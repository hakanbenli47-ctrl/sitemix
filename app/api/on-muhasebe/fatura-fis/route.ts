import { NextResponse } from "next/server";
import { getOnMuhasebeContext } from "@/lib/onMuhasebe/auth";
import {
  getWorkYearFromRequest,
  workYearDateRange,
} from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type FisTuru = "satis" | "alis";

type FisInputLine = {
  urun_id: string;
  miktar: number;
  birim_fiyat: number;
  kdv_orani: number;
};

type FisInput = {
  fisId?: string;
  cariId: string;
  fisTuru: FisTuru;
  fisTarihi: string;
  aciklama: string | null;
  kalemler: FisInputLine[];
};

type CariRow = {
  id: string;
  cari_turu: "musteri" | "tedarikci" | "musteri_tedarikci";
  unvan: string;
  bakiye: number | null;
  aktif: boolean | null;
  deleted_at?: string | null;
};

type UrunRow = {
  id: string;
  urun_kodu: string;
  urun_adi: string;
  urun_tipi: "urun" | "hizmet";
  birim: string;
  mevcut_stok: number | null;
  maliyet_fiyati: number | null;
  aktif: boolean | null;
  deleted_at?: string | null;
};

type FisRow = {
  id: string;
  company_id: string;
  cari_id: string;
  fis_no: string;
  fis_turu: FisTuru;
  fis_tarihi: string;
  ara_toplam: number | null;
  kdv_toplam: number | null;
  genel_toplam: number | null;
  tahsilat_tutari: number | null;
  cari_bakiye_once: number | null;
  cari_bakiye_sonra: number | null;
  aciklama: string | null;
  durum: "aktif" | "iptal";
  created_at: string;
};

type FisKalemRow = {
  id: string;
  urun_id: string;
  urun_kodu: string;
  urun_adi: string;
  miktar: number | null;
  birim: string;
  birim_fiyat: number | null;
  kdv_orani: number | null;
  ara_toplam: number | null;
  kdv_tutari: number | null;
  satir_toplami: number | null;
};

type CalculatedLine = {
  urun: UrunRow;
  miktar: number;
  birimFiyat: number;
  kdvOrani: number;
  araToplam: number;
  kdvTutari: number;
  satirToplami: number;
};

type SaveState = {
  cari: CariRow;
  lines: CalculatedLine[];
  araToplam: number;
  kdvToplam: number;
  genelToplam: number;
  cariBakiyeOnce: number;
  cariBakiyeSonra: number;
  cariBalances: Map<string, number>;
  productStocks: Map<string, number>;
};

type CancelState = {
  lines: CalculatedLine[];
  cariBakiyeSonra: number;
  productStocks: Map<string, number>;
};

type DbError = {
  code?: string;
  message?: string;
  details?: string;
};

function textValue(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

function numberValue(value: unknown) {
  const number = Number(value || 0);
  return Number.isFinite(number) ? number : 0;
}

function money(value: number) {
  return Math.round((Number.isFinite(value) ? value : 0) * 100) / 100;
}

function jsonError(error: unknown, fallback: string, status = 400) {
  const dbError = error as DbError | undefined;
  const message =
    error instanceof Error
      ? error.message
      : dbError?.message || dbError?.details || fallback;

  return NextResponse.json({ message }, { status });
}

function isMissingColumnError(error: unknown) {
  const dbError = error as DbError | undefined;
  const message = `${dbError?.message || ""} ${dbError?.details || ""}`.toLowerCase();

  return (
    dbError?.code === "42703" ||
    dbError?.code === "PGRST204" ||
    message.includes("column") ||
    message.includes("schema cache")
  );
}

function readInput(body: Record<string, unknown>): FisInput {
  const fisTuru = body.fisTuru === "alis" ? "alis" : "satis";
  const rawLines = Array.isArray(body.kalemler) ? body.kalemler : [];

  return {
    fisId: textValue(body.fisId) || undefined,
    cariId: textValue(body.cariId),
    fisTuru,
    fisTarihi: textValue(body.fisTarihi).slice(0, 10),
    aciklama: textValue(body.aciklama) || null,
    kalemler: rawLines.map((line) => {
      const row = line as Record<string, unknown>;

      return {
        urun_id: textValue(row.urun_id),
        miktar: numberValue(row.miktar),
        birim_fiyat: numberValue(row.birim_fiyat),
        kdv_orani: numberValue(row.kdv_orani),
      };
    }),
  };
}

function ensurePermission(context: Awaited<ReturnType<typeof getOnMuhasebeContext>>) {
  if (!context.permissions.fatura) {
    throw new Error("Bu islem icin fatura/fis yetkisi gerekir.");
  }
}

function cariMatchesFisType(cari: CariRow, fisTuru: FisTuru) {
  if (fisTuru === "satis") {
    return cari.cari_turu === "musteri" || cari.cari_turu === "musteri_tedarikci";
  }

  return cari.cari_turu === "tedarikci" || cari.cari_turu === "musteri_tedarikci";
}

function stockDeltaFor(fisTuru: FisTuru, line: Pick<CalculatedLine, "urun" | "miktar">) {
  if (line.urun.urun_tipi !== "urun") return 0;
  return fisTuru === "satis" ? -line.miktar : line.miktar;
}

function oldStockDeltaFor(
  fisTuru: FisTuru,
  line: Pick<FisKalemRow, "miktar" | "urun_id">,
  products: Map<string, UrunRow>,
) {
  const urun = products.get(line.urun_id);
  if (!urun || urun.urun_tipi !== "urun") return 0;

  const miktar = numberValue(line.miktar);
  return fisTuru === "satis" ? -miktar : miktar;
}

async function getSettingsPrefix(companyId: string) {
  const { data } = await supabaseAdmin
    .from("on_muhasebe_settings")
    .select("receipt_prefix")
    .eq("company_id", companyId)
    .maybeSingle<{ receipt_prefix: string | null }>();

  const prefix = textValue(data?.receipt_prefix) || "FIS";
  return prefix.replace(/[^A-Za-z0-9]/g, "").slice(0, 8).toUpperCase() || "FIS";
}

async function createFisNo(companyId: string, fisTuru: FisTuru) {
  const prefix = await getSettingsPrefix(companyId);
  const typePrefix = fisTuru === "satis" ? "SAT" : "ALI";
  const now = new Date();
  const stamp = [
    String(now.getFullYear()).slice(2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const suffix = Math.random().toString(36).slice(2, 5).toUpperCase();

  return `${prefix}-${typePrefix}-${stamp}-${suffix}`;
}

async function loadExistingFis(companyId: string, fisId: string) {
  const { data: fis, error: fisError } = await supabaseAdmin
    .from("fatura_fisleri")
    .select(
      "id, company_id, cari_id, fis_no, fis_turu, fis_tarihi, ara_toplam, kdv_toplam, genel_toplam, tahsilat_tutari, cari_bakiye_once, cari_bakiye_sonra, aciklama, durum, created_at",
    )
    .eq("company_id", companyId)
    .eq("id", fisId)
    .maybeSingle<FisRow>();

  if (fisError) throw fisError;
  if (!fis) throw new Error("Fis bulunamadi.");

  const { data: lines, error: lineError } = await supabaseAdmin
    .from("fatura_fis_kalemleri")
    .select(
      "id, urun_id, urun_kodu, urun_adi, miktar, birim, birim_fiyat, kdv_orani, ara_toplam, kdv_tutari, satir_toplami",
    )
    .eq("company_id", companyId)
    .eq("fis_id", fisId);

  if (lineError) throw lineError;

  return {
    fis,
    lines: (lines || []) as FisKalemRow[],
  };
}

async function buildSaveState(
  companyId: string,
  input: FisInput,
  dateRange: { start: string; end: string },
  existing?: { fis: FisRow; lines: FisKalemRow[] } | null,
): Promise<SaveState> {
  if (!input.cariId) throw new Error("Cari secmelisin.");
  if (!input.fisTarihi) throw new Error("Fis tarihi secmelisin.");
  if (input.fisTarihi < dateRange.start || input.fisTarihi > dateRange.end) {
    throw new Error(`Fis tarihi ${dateRange.start} - ${dateRange.end} arasinda olmali.`);
  }

  const cleanLines = input.kalemler.filter(
    (line) => line.urun_id && line.miktar > 0 && line.birim_fiyat > 0,
  );

  if (cleanLines.length === 0) {
    throw new Error("En az bir urun veya hizmet secmelisin.");
  }

  const { data: cari, error: cariError } = await supabaseAdmin
    .from("cari_hesaplar")
    .select("id, cari_turu, unvan, bakiye, aktif, deleted_at")
    .eq("company_id", companyId)
    .eq("id", input.cariId)
    .maybeSingle<CariRow>();

  if (cariError) throw cariError;
  if (!cari || cari.deleted_at || cari.aktif === false) {
    throw new Error("Secilen cari aktif degil veya bulunamadi.");
  }
  if (!cariMatchesFisType(cari, input.fisTuru)) {
    throw new Error(input.fisTuru === "satis" ? "Satis icin musteri secmelisin." : "Alis icin tedarikci secmelisin.");
  }

  let oldCari: CariRow | null = null;
  if (existing && existing.fis.cari_id !== input.cariId) {
    const { data, error } = await supabaseAdmin
      .from("cari_hesaplar")
      .select("id, cari_turu, unvan, bakiye, aktif, deleted_at")
      .eq("company_id", companyId)
      .eq("id", existing.fis.cari_id)
      .maybeSingle<CariRow>();

    if (error) throw error;
    if (!data) throw new Error("Eski fis carisi bulunamadi.");
    oldCari = data;
  }

  const productIds = Array.from(
    new Set([
      ...cleanLines.map((line) => line.urun_id),
      ...(existing?.lines || []).map((line) => line.urun_id),
    ]),
  );

  const { data: products, error: productError } = await supabaseAdmin
    .from("urunler")
    .select(
      "id, urun_kodu, urun_adi, urun_tipi, birim, mevcut_stok, maliyet_fiyati, aktif, deleted_at",
    )
    .eq("company_id", companyId)
    .in("id", productIds);

  if (productError) throw productError;

  const productMap = new Map((products || []).map((product) => [product.id, product as UrunRow]));

  const lines = cleanLines.map((line) => {
    const urun = productMap.get(line.urun_id);

    if (!urun || urun.deleted_at || urun.aktif === false) {
      throw new Error("Secilen urun/hizmet aktif degil veya bulunamadi.");
    }

    const araToplam = money(line.miktar * line.birim_fiyat);
    const kdvTutari = money(araToplam * (line.kdv_orani / 100));

    return {
      urun,
      miktar: line.miktar,
      birimFiyat: money(line.birim_fiyat),
      kdvOrani: money(line.kdv_orani),
      araToplam,
      kdvTutari,
      satirToplami: money(araToplam + kdvTutari),
    };
  });

  const oldCariDelta = existing
    ? existing.fis.fis_turu === "satis"
      ? numberValue(existing.fis.genel_toplam)
      : -numberValue(existing.fis.genel_toplam)
    : 0;
  const newCariDelta = input.fisTuru === "satis"
    ? lines.reduce((sum, line) => sum + line.satirToplami, 0)
    : -lines.reduce((sum, line) => sum + line.satirToplami, 0);

  let cariBakiyeOnce = 0;
  let cariBakiyeSonra = 0;
  const cariBalances = new Map<string, number>();

  if (oldCari) {
    cariBalances.set(oldCari.id, money(numberValue(oldCari.bakiye) - oldCariDelta));
    cariBakiyeOnce = money(numberValue(cari.bakiye));
    cariBakiyeSonra = money(cariBakiyeOnce + newCariDelta);
    cariBalances.set(cari.id, cariBakiyeSonra);
  } else {
    cariBakiyeOnce = money(numberValue(cari.bakiye) - oldCariDelta);
    cariBakiyeSonra = money(cariBakiyeOnce + newCariDelta);
    cariBalances.set(cari.id, cariBakiyeSonra);
  }

  const oldStockDelta = new Map<string, number>();
  for (const line of existing?.lines || []) {
    oldStockDelta.set(
      line.urun_id,
      numberValue(oldStockDelta.get(line.urun_id)) +
        oldStockDeltaFor(existing?.fis.fis_turu || input.fisTuru, line, productMap),
    );
  }

  const newStockDelta = new Map<string, number>();
  for (const line of lines) {
    newStockDelta.set(
      line.urun.id,
      numberValue(newStockDelta.get(line.urun.id)) + stockDeltaFor(input.fisTuru, line),
    );
  }

  const productStocks = new Map<string, number>();
  for (const productId of productIds) {
    const product = productMap.get(productId);
    if (!product || product.urun_tipi !== "urun") continue;

    const baseStock = numberValue(product.mevcut_stok) - numberValue(oldStockDelta.get(productId));
    const nextStock = money(baseStock + numberValue(newStockDelta.get(productId)));

    if (nextStock < 0) {
      throw new Error(`${product.urun_adi} icin stok yetersiz. Mevcut: ${baseStock} ${product.birim}`);
    }

    productStocks.set(productId, nextStock);
  }

  const araToplam = money(lines.reduce((sum, line) => sum + line.araToplam, 0));
  const kdvToplam = money(lines.reduce((sum, line) => sum + line.kdvTutari, 0));
  const genelToplam = money(lines.reduce((sum, line) => sum + line.satirToplami, 0));

  return {
    cari,
    lines,
    araToplam,
    kdvToplam,
    genelToplam,
    cariBakiyeOnce,
    cariBakiyeSonra,
    cariBalances,
    productStocks,
  };
}

async function buildCancelState(
  companyId: string,
  existing: { fis: FisRow; lines: FisKalemRow[] },
): Promise<CancelState> {
  const [{ data: cari, error: cariError }, { data: products, error: productError }] =
    await Promise.all([
      supabaseAdmin
        .from("cari_hesaplar")
        .select("id, cari_turu, unvan, bakiye, aktif, deleted_at")
        .eq("company_id", companyId)
        .eq("id", existing.fis.cari_id)
        .maybeSingle<CariRow>(),
      supabaseAdmin
        .from("urunler")
        .select(
          "id, urun_kodu, urun_adi, urun_tipi, birim, mevcut_stok, maliyet_fiyati, aktif, deleted_at",
        )
        .eq("company_id", companyId)
        .in("id", existing.lines.map((line) => line.urun_id)),
    ]);

  if (cariError) throw cariError;
  if (productError) throw productError;
  if (!cari) throw new Error("Cari bulunamadi.");

  const productMap = new Map((products || []).map((product) => [product.id, product as UrunRow]));
  const lines = existing.lines.map((line) => {
    const urun = productMap.get(line.urun_id);
    if (!urun) throw new Error(`${line.urun_adi} urun kaydi bulunamadi.`);

    return {
      urun,
      miktar: numberValue(line.miktar),
      birimFiyat: money(numberValue(line.birim_fiyat)),
      kdvOrani: money(numberValue(line.kdv_orani)),
      araToplam: money(numberValue(line.ara_toplam)),
      kdvTutari: money(numberValue(line.kdv_tutari)),
      satirToplami: money(numberValue(line.satir_toplami)),
    };
  });

  const oldCariDelta =
    existing.fis.fis_turu === "satis"
      ? numberValue(existing.fis.genel_toplam)
      : -numberValue(existing.fis.genel_toplam);
  const productStocks = new Map<string, number>();

  for (const line of existing.lines) {
    const product = productMap.get(line.urun_id);
    if (!product || product.urun_tipi !== "urun") continue;

    const oldDelta = oldStockDeltaFor(existing.fis.fis_turu, line, productMap);
    productStocks.set(
      line.urun_id,
      money(numberValue(product.mevcut_stok) - oldDelta),
    );
  }

  return {
    lines,
    cariBakiyeSonra: money(numberValue(cari.bakiye) - oldCariDelta),
    productStocks,
  };
}

function fisPayload(
  companyId: string,
  input: FisInput,
  state: SaveState,
  fisNo: string,
) {
  return {
    company_id: companyId,
    cari_id: input.cariId,
    fis_no: fisNo,
    fis_turu: input.fisTuru,
    fis_tarihi: input.fisTarihi,
    ara_toplam: state.araToplam,
    kdv_toplam: state.kdvToplam,
    genel_toplam: state.genelToplam,
    tahsilat_tutari: 0,
    cari_bakiye_once: state.cariBakiyeOnce,
    cari_bakiye_sonra: state.cariBakiyeSonra,
    aciklama: input.aciklama,
    durum: "aktif",
  };
}

function kalemPayload(companyId: string, fisId: string, line: CalculatedLine) {
  return {
    company_id: companyId,
    fis_id: fisId,
    urun_id: line.urun.id,
    urun_kodu: line.urun.urun_kodu,
    urun_adi: line.urun.urun_adi,
    miktar: line.miktar,
    birim: line.urun.birim,
    birim_fiyat: line.birimFiyat,
    kdv_orani: line.kdvOrani,
    ara_toplam: line.araToplam,
    kdv_tutari: line.kdvTutari,
    satir_toplami: line.satirToplami,
  };
}

function stockPayload(
  companyId: string,
  input: FisInput,
  fisId: string,
  fisNo: string,
  lines: CalculatedLine[],
  mode: "kayit" | "iptal",
) {
  const hareketTuru =
    mode === "iptal"
      ? input.fisTuru === "satis"
        ? "giris"
        : "cikis"
      : input.fisTuru === "satis"
        ? "cikis"
        : "giris";

  return lines
    .filter((line) => line.urun.urun_tipi === "urun")
    .map((line) => ({
      company_id: companyId,
      urun_id: line.urun.id,
      hareket_turu: hareketTuru,
      hareket_tarihi: input.fisTarihi,
      miktar: line.miktar,
      birim_maliyet: line.birimFiyat,
      aciklama:
        mode === "iptal"
          ? `${fisNo} iptal stok hareketi`
          : `${fisNo} fis stok hareketi`,
      belge_no: fisNo,
      kaynak_turu: mode === "iptal" ? "fatura_fisi_iptal" : "fatura_fisi",
      kaynak_id: fisId,
    }));
}

function cariMovementPayload(
  companyId: string,
  input: FisInput,
  fisId: string,
  fisNo: string,
  total: number,
  userId: string,
) {
  const isSale = input.fisTuru === "satis";

  return {
    company_id: companyId,
    cari_id: input.cariId,
    fatura_id: null,
    kasa_hareket_id: null,
    hareket_turu: isSale ? "satis" : "alis",
    hareket_tarihi: input.fisTarihi,
    islem_tarihi: input.fisTarihi,
    aciklama: fisNo,
    borc_tutar: isSale ? total : 0,
    alacak_tutar: isSale ? 0 : total,
    para_birimi: "TRY",
    durum: "aktif",
    created_by: userId,
    belge_no: fisNo,
    kaynak_turu: "fatura_fis",
    kaynak_id: fisId,
  };
}

async function insertCariMovement(row: Record<string, unknown>) {
  const { error } = await supabaseAdmin.from("cari_hareketleri").insert(row);
  if (!error) return;

  if (!isMissingColumnError(error)) throw error;

  const cleanRow = { ...row };
  delete cleanRow.belge_no;
  delete cleanRow.kaynak_turu;
  delete cleanRow.kaynak_id;
  delete cleanRow.islem_tarihi;

  const { error: fallbackError } = await supabaseAdmin
    .from("cari_hareketleri")
    .insert(cleanRow);

  if (fallbackError) throw fallbackError;
}

async function deactivateCariMovementsForFis(companyId: string, fisId: string) {
  const withSource = await supabaseAdmin
    .from("cari_hareketleri")
    .update({ durum: "iptal", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("kaynak_id", fisId)
    .eq("kaynak_turu", "fatura_fis");

  if (!withSource.error) return;
  if (!isMissingColumnError(withSource.error)) throw withSource.error;

  const fallback = await supabaseAdmin
    .from("cari_hareketleri")
    .update({ durum: "iptal", updated_at: new Date().toISOString() })
    .eq("company_id", companyId)
    .eq("fatura_id", fisId);

  if (fallback.error) throw fallback.error;
}

async function insertStockRows(rows: Record<string, unknown>[]) {
  if (rows.length === 0) return;

  const { error } = await supabaseAdmin.from("stok_hareketleri").insert(rows);
  if (!error) return;

  if (!isMissingColumnError(error)) throw error;

  const fallbackRows = rows.map((row) => {
    const cleanRow = { ...row };
    delete cleanRow.belge_no;
    delete cleanRow.kaynak_turu;
    delete cleanRow.kaynak_id;
    return cleanRow;
  });
  const { error: fallbackError } = await supabaseAdmin
    .from("stok_hareketleri")
    .insert(fallbackRows);

  if (fallbackError) throw fallbackError;
}

async function deleteStockRowsForFis(companyId: string, fisId: string) {
  const withSource = await supabaseAdmin
    .from("stok_hareketleri")
    .delete()
    .eq("company_id", companyId)
    .or(`kaynak_id.eq.${fisId},fatura_id.eq.${fisId}`);

  if (!withSource.error) return;
  if (!isMissingColumnError(withSource.error)) throw withSource.error;

  const fallback = await supabaseAdmin
    .from("stok_hareketleri")
    .delete()
    .eq("company_id", companyId)
    .eq("fatura_id", fisId);

  if (fallback.error) throw fallback.error;
}

async function applyProductStocks(companyId: string, stocks: Map<string, number>) {
  for (const [productId, nextStock] of stocks.entries()) {
    const { error } = await supabaseAdmin
      .from("urunler")
      .update({ mevcut_stok: nextStock })
      .eq("company_id", companyId)
      .eq("id", productId);

    if (error) throw error;
  }
}

async function updateCariBalance(companyId: string, cariId: string, balance: number) {
  const { error } = await supabaseAdmin
    .from("cari_hesaplar")
    .update({ bakiye: balance })
    .eq("company_id", companyId)
    .eq("id", cariId);

  if (error) throw error;
}

async function applyCariBalances(companyId: string, balances: Map<string, number>) {
  for (const [cariId, balance] of balances.entries()) {
    await updateCariBalance(companyId, cariId, balance);
  }
}

async function cleanupCreatedFis(companyId: string, fisId: string) {
  if (!companyId || !fisId) return;

  try {
    await deactivateCariMovementsForFis(companyId, fisId);
  } catch {
    // Best effort cleanup; the original error is more useful to the caller.
  }

  try {
    await deleteStockRowsForFis(companyId, fisId);
  } catch {
    // Best effort cleanup; the original error is more useful to the caller.
  }

  try {
    await supabaseAdmin
      .from("fatura_fis_kalemleri")
      .delete()
      .eq("company_id", companyId)
      .eq("fis_id", fisId);
  } catch {
    // Best effort cleanup.
  }

  try {
    await supabaseAdmin
      .from("fatura_fisleri")
      .delete()
      .eq("company_id", companyId)
      .eq("id", fisId);
  } catch {
    // Best effort cleanup.
  }
}

function responseFis(fis: FisRow) {
  return {
    id: fis.id,
    fis_no: fis.fis_no,
    fis_turu: fis.fis_turu,
    cari_bakiye_once: numberValue(fis.cari_bakiye_once),
    cari_bakiye_sonra: numberValue(fis.cari_bakiye_sonra),
    genel_toplam: numberValue(fis.genel_toplam),
    tahsilat_tutari: numberValue(fis.tahsilat_tutari),
  };
}

export async function POST(request: Request) {
  let createdFisId = "";
  let companyId = "";

  try {
    const context = await getOnMuhasebeContext(request);
    ensurePermission(context);
    companyId = context.company.id;

    const input = readInput(await request.json().catch(() => ({})));
    const state = await buildSaveState(
      companyId,
      input,
      workYearDateRange(getWorkYearFromRequest(request)),
    );
    const fisNo = await createFisNo(companyId, input.fisTuru);

    const { data: fis, error: fisError } = await supabaseAdmin
      .from("fatura_fisleri")
      .insert(fisPayload(companyId, input, state, fisNo))
      .select(
        "id, company_id, cari_id, fis_no, fis_turu, fis_tarihi, ara_toplam, kdv_toplam, genel_toplam, tahsilat_tutari, cari_bakiye_once, cari_bakiye_sonra, aciklama, durum, created_at",
      )
      .single<FisRow>();

    if (fisError || !fis) throw fisError || new Error("Fis kaydi olusturulamadi.");
    createdFisId = fis.id;

    const { error: lineError } = await supabaseAdmin
      .from("fatura_fis_kalemleri")
      .insert(state.lines.map((line) => kalemPayload(companyId, fis.id, line)));

    if (lineError) throw lineError;

    await insertStockRows(stockPayload(companyId, input, fis.id, fis.fis_no, state.lines, "kayit"));
    await insertCariMovement(
      cariMovementPayload(
        companyId,
        input,
        fis.id,
        fis.fis_no,
        state.genelToplam,
        context.user.id,
      ),
    );
    await applyProductStocks(companyId, state.productStocks);
    await applyCariBalances(companyId, state.cariBalances);

    return NextResponse.json({ fis: responseFis(fis) });
  } catch (error) {
    if (createdFisId) {
      await cleanupCreatedFis(companyId, createdFisId);
    }

    return jsonError(error, "Fis kaydedilemedi.");
  }
}

export async function PATCH(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    ensurePermission(context);

    const input = readInput(await request.json().catch(() => ({})));
    if (!input.fisId) throw new Error("Duzenlenecek fis bulunamadi.");

    const existing = await loadExistingFis(context.company.id, input.fisId);
    if (existing.fis.durum === "iptal") {
      throw new Error("Iptal edilmis fis duzenlenemez.");
    }

    const state = await buildSaveState(
      context.company.id,
      input,
      workYearDateRange(getWorkYearFromRequest(request)),
      existing,
    );

    const { data: fis, error: fisError } = await supabaseAdmin
      .from("fatura_fisleri")
      .update({
        ...fisPayload(context.company.id, input, state, existing.fis.fis_no),
        updated_at: new Date().toISOString(),
      })
      .eq("company_id", context.company.id)
      .eq("id", input.fisId)
      .select(
        "id, company_id, cari_id, fis_no, fis_turu, fis_tarihi, ara_toplam, kdv_toplam, genel_toplam, tahsilat_tutari, cari_bakiye_once, cari_bakiye_sonra, aciklama, durum, created_at",
      )
      .single<FisRow>();

    if (fisError || !fis) throw fisError || new Error("Fis guncellenemedi.");

    await deleteStockRowsForFis(context.company.id, input.fisId);
    await deactivateCariMovementsForFis(context.company.id, input.fisId);

    const deleteLines = await supabaseAdmin
      .from("fatura_fis_kalemleri")
      .delete()
      .eq("company_id", context.company.id)
      .eq("fis_id", input.fisId);

    if (deleteLines.error) throw deleteLines.error;

    const { error: lineError } = await supabaseAdmin
      .from("fatura_fis_kalemleri")
      .insert(state.lines.map((line) => kalemPayload(context.company.id, fis.id, line)));

    if (lineError) throw lineError;

    await insertStockRows(stockPayload(context.company.id, input, fis.id, fis.fis_no, state.lines, "kayit"));
    await insertCariMovement(
      cariMovementPayload(
        context.company.id,
        input,
        fis.id,
        fis.fis_no,
        state.genelToplam,
        context.user.id,
      ),
    );
    await applyProductStocks(context.company.id, state.productStocks);
    await applyCariBalances(context.company.id, state.cariBalances);

    return NextResponse.json({ fis: responseFis(fis) });
  } catch (error) {
    return jsonError(error, "Fis guncellenemedi.");
  }
}

export async function DELETE(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    ensurePermission(context);

    const url = new URL(request.url);
    const fisId = textValue(url.searchParams.get("id"));
    if (!fisId) throw new Error("Iptal edilecek fis bulunamadi.");

    const existing = await loadExistingFis(context.company.id, fisId);
    if (existing.fis.durum === "iptal") {
      return NextResponse.json({ message: "Fis zaten iptal." });
    }

    const input: FisInput = {
      fisId,
      cariId: existing.fis.cari_id,
      fisTuru: existing.fis.fis_turu,
      fisTarihi: String(existing.fis.fis_tarihi).slice(0, 10),
      aciklama: existing.fis.aciklama,
      kalemler: existing.lines.map((line) => ({
        urun_id: line.urun_id,
        miktar: numberValue(line.miktar),
        birim_fiyat: numberValue(line.birim_fiyat),
        kdv_orani: numberValue(line.kdv_orani),
      })),
    };
    const state = await buildCancelState(context.company.id, existing);

    const { error: updateError } = await supabaseAdmin
      .from("fatura_fisleri")
      .update({ durum: "iptal", updated_at: new Date().toISOString() })
      .eq("company_id", context.company.id)
      .eq("id", fisId);

    if (updateError) throw updateError;

    await deactivateCariMovementsForFis(context.company.id, fisId);
    await insertStockRows(
      stockPayload(context.company.id, input, fisId, existing.fis.fis_no, state.lines, "iptal"),
    );
    await applyProductStocks(context.company.id, state.productStocks);
    await updateCariBalance(context.company.id, existing.fis.cari_id, state.cariBakiyeSonra);

    return NextResponse.json({ message: "Fis iptal edildi." });
  } catch (error) {
    return jsonError(error, "Fis iptal edilemedi.");
  }
}
