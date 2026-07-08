import { NextResponse } from "next/server";
import {
  getOnMuhasebeContext,
  isMissingTableError,
  requireOwner,
} from "@/lib/onMuhasebe/auth";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CariRow = {
  id: string;
  cari_kodu: string;
  unvan: string;
  acilis_bakiyesi: number | null;
  acilis_bakiye_tipi: "borc_yok" | "borclu" | "alacakli" | null;
  aktif: boolean | null;
  deleted_at?: string | null;
  created_at?: string | null;
};

type FisRow = {
  cari_id: string | null;
  fis_turu: "satis" | "alis" | string;
  fis_tarihi: string;
  genel_toplam: number | null;
  tahsilat_tutari: number | null;
  durum: string | null;
};

type KasaRow = {
  cari_id: string | null;
  hareket_turu: "tahsilat" | "odeme" | string;
  islem_tarihi: string;
  tutar: number | null;
  durum: string | null;
};

type CariHareketRow = {
  cari_id: string | null;
  borc_tutar: number | null;
  alacak_tutar: number | null;
  durum: string | null;
  created_at?: string | null;
};

type DevirRow = {
  id: string;
  company_id: string;
  kaynak_yil: number;
  hedef_yil: number;
  durum: string;
  cari_sayisi: number;
  borclu_toplam: number;
  alacakli_toplam: number;
  net_bakiye: number;
  created_at: string;
};

type DevirDetailRow = {
  id: string;
  devir_id: string;
  company_id: string;
  cari_id: string;
  cari_kodu: string;
  unvan: string;
  kaynak_yil: number;
  hedef_yil: number;
  kaynak_yil_son_bakiye: number;
  hedef_acilis_bakiyesi: number;
  hedef_acilis_bakiye_tipi: string;
  durum: string;
  created_at: string;
};

function asYear(value: unknown, fallback: number) {
  const numberValue = Number(value);

  if (!Number.isInteger(numberValue) || numberValue < 2020 || numberValue > 2100) {
    return fallback;
  }

  return numberValue;
}

function moneyRound(value: number) {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function openingEffect(cari: CariRow) {
  const amount = Number(cari.acilis_bakiyesi || 0);

  if (cari.acilis_bakiye_tipi === "borclu") return amount;
  if (cari.acilis_bakiye_tipi === "alacakli") return -amount;
  return 0;
}

function applyAmount(map: Map<string, number>, cariId: string | null, amount: number) {
  if (!cariId || !Number.isFinite(amount)) return;
  map.set(cariId, (map.get(cariId) || 0) + amount);
}

async function fetchCariHareketleri(
  companyId: string,
  endIso: string,
): Promise<CariHareketRow[]> {
  const firstAttempt = await supabaseAdmin
    .from("cari_hareketleri")
    .select("cari_id, borc_tutar, alacak_tutar, durum, created_at")
    .eq("company_id", companyId)
    .eq("durum", "aktif")
    .lte("created_at", endIso)
    .limit(50000);

  if (!firstAttempt.error) {
    return (firstAttempt.data || []) as CariHareketRow[];
  }

  const message = firstAttempt.error.message?.toLowerCase() || "";

  if (!message.includes("created_at") && firstAttempt.error.code !== "42703") {
    throw firstAttempt.error;
  }

  const secondAttempt = await supabaseAdmin
    .from("cari_hareketleri")
    .select("cari_id, borc_tutar, alacak_tutar, durum")
    .eq("company_id", companyId)
    .eq("durum", "aktif")
    .limit(50000);

  if (secondAttempt.error) throw secondAttempt.error;

  return (secondAttempt.data || []) as CariHareketRow[];
}

async function calculateCariYearEndBalances(companyId: string, sourceYear: number) {
  const endDate = `${sourceYear}-12-31`;
  const endIso = `${sourceYear}-12-31T23:59:59.999Z`;

  const [cariResult, fisResult, kasaResult, cariHareketleri] = await Promise.all([
    supabaseAdmin
      .from("cari_hesaplar")
      .select(
        "id, cari_kodu, unvan, acilis_bakiyesi, acilis_bakiye_tipi, aktif, deleted_at, created_at",
      )
      .eq("company_id", companyId)
      .is("deleted_at", null)
      .order("unvan", { ascending: true })
      .limit(50000),
    supabaseAdmin
      .from("fatura_fisleri")
      .select("cari_id, fis_turu, fis_tarihi, genel_toplam, tahsilat_tutari, durum")
      .eq("company_id", companyId)
      .eq("durum", "aktif")
      .lte("fis_tarihi", endDate)
      .limit(50000),
    supabaseAdmin
      .from("kasa_hareketleri")
      .select("cari_id, hareket_turu, islem_tarihi, tutar, durum")
      .eq("company_id", companyId)
      .in("hareket_turu", ["tahsilat", "odeme"])
      .eq("durum", "tamamlandi")
      .lte("islem_tarihi", endDate)
      .limit(50000),
    fetchCariHareketleri(companyId, endIso),
  ]);

  if (cariResult.error) throw cariResult.error;
  if (fisResult.error) throw fisResult.error;
  if (kasaResult.error) throw kasaResult.error;

  const cariler = (cariResult.data || []) as CariRow[];
  const balances = new Map<string, number>();

  cariler.forEach((cari) => {
    balances.set(cari.id, openingEffect(cari));
  });

  ((fisResult.data || []) as FisRow[]).forEach((fis) => {
    const toplam = Number(fis.genel_toplam || 0);
    const tahsilat = Number(fis.tahsilat_tutari || 0);

    if (fis.fis_turu === "satis") {
      applyAmount(balances, fis.cari_id, toplam - tahsilat);
      return;
    }

    if (fis.fis_turu === "alis") {
      applyAmount(balances, fis.cari_id, -toplam + tahsilat);
    }
  });

  ((kasaResult.data || []) as KasaRow[]).forEach((hareket) => {
    const tutar = Number(hareket.tutar || 0);

    if (hareket.hareket_turu === "tahsilat") {
      applyAmount(balances, hareket.cari_id, -tutar);
      return;
    }

    if (hareket.hareket_turu === "odeme") {
      applyAmount(balances, hareket.cari_id, tutar);
    }
  });

  (cariHareketleri as CariHareketRow[]).forEach((hareket: CariHareketRow) => {
    applyAmount(
      balances,
      hareket.cari_id,
      Number(hareket.borc_tutar || 0) - Number(hareket.alacak_tutar || 0),
    );
  });

  const details = cariler.map((cari) => {
    const balance = moneyRound(balances.get(cari.id) || 0);
    const amount = moneyRound(Math.abs(balance));
    const openingType = balance > 0 ? "borclu" : balance < 0 ? "alacakli" : "borc_yok";

    return {
      cari,
      balance,
      amount,
      openingType,
    };
  });

  const borcluToplam = moneyRound(
    details.filter((item) => item.balance > 0).reduce((sum, item) => sum + item.balance, 0),
  );
  const alacakliToplam = moneyRound(
    details
      .filter((item) => item.balance < 0)
      .reduce((sum, item) => sum + Math.abs(item.balance), 0),
  );

  return {
    details,
    summary: {
      cari_sayisi: details.length,
      borclu_toplam: borcluToplam,
      alacakli_toplam: alacakliToplam,
      net_bakiye: moneyRound(borcluToplam - alacakliToplam),
    },
  };
}

async function listDevirler(companyId: string, devirId?: string | null) {
  const { data: devirler, error } = await supabaseAdmin
    .from("on_muhasebe_yil_devirleri")
    .select("id, company_id, kaynak_yil, hedef_yil, durum, cari_sayisi, borclu_toplam, alacakli_toplam, net_bakiye, created_at")
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) throw error;

  const rows = (devirler || []) as DevirRow[];
  const selectedId = devirId || rows[0]?.id || null;

  const { data: detailData, error: detailError } = selectedId
    ? await supabaseAdmin
        .from("on_muhasebe_cari_devirleri")
        .select(
          "id, devir_id, company_id, cari_id, cari_kodu, unvan, kaynak_yil, hedef_yil, kaynak_yil_son_bakiye, hedef_acilis_bakiyesi, hedef_acilis_bakiye_tipi, durum, created_at",
        )
        .eq("company_id", companyId)
        .eq("devir_id", selectedId)
        .order("unvan", { ascending: true })
        .limit(5000)
    : { data: [], error: null };

  if (detailError) throw detailError;

  return {
    devirler: rows,
    selectedDevirId: selectedId,
    details: (detailData || []) as DevirDetailRow[],
  };
}


async function ensureRegisteredSourcePeriod(companyId: string, sourceYear: number) {
  const { data, error } = await supabaseAdmin
    .from("on_muhasebe_calisma_donemleri")
    .select("id")
    .eq("company_id", companyId)
    .eq("yil", sourceYear)
    .neq("durum", "pasif")
    .maybeSingle<{ id: string }>();

  if (error) throw error;

  if (!data) {
    throw new Error(
      `${sourceYear} kaynak dönemi kayıtlı değil. Devir sadece kayıtlı dönemlerden hazırlanabilir.`,
    );
  }
}

async function registerTargetPeriod(
  companyId: string,
  targetYear: number,
  userId: string,
) {
  const { error } = await supabaseAdmin
    .from("on_muhasebe_calisma_donemleri")
    .upsert(
      {
        company_id: companyId,
        yil: targetYear,
        baslangic_tarihi: `${targetYear}-01-01`,
        bitis_tarihi: `${targetYear}-12-31`,
        durum: "acik",
        locked: false,
        created_by: userId,
      },
      { onConflict: "company_id,yil" },
    );

  if (error) throw error;
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const url = new URL(request.url);
    const devirId = url.searchParams.get("devirId");
    const data = await listDevirler(context.company.id, devirId);

    return NextResponse.json({
      setupRequired: false,
      ...data,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json({
        setupRequired: true,
        devirler: [],
        selectedDevirId: null,
        details: [],
        message:
          "Devir tabloları henüz kurulmamış. Supabase SQL dosyasını çalıştırınca yıl devri aktif olur.",
      });
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Devir bilgileri alınamadı.",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    requireOwner(context);

    const body = await request.json().catch(() => null);

    if (!body) {
      return NextResponse.json(
        { message: "Geçersiz devir isteği." },
        { status: 400 },
      );
    }

    const currentYear = new Date().getFullYear();
    const sourceYear = asYear(body.sourceYear, currentYear - 1);
    const targetYear = asYear(body.targetYear, sourceYear + 1);
    const overwrite = Boolean(body.overwrite);

    if (targetYear <= sourceYear) {
      return NextResponse.json(
        { message: "Hedef yıl kaynak yıldan büyük olmalı. Örnek: 2025 → 2026." },
        { status: 400 },
      );
    }

    if (targetYear !== sourceYear + 1) {
      return NextResponse.json(
        { message: "Devir işlemi ardışık yıllar için yapılmalı. Örnek: 2025 → 2026." },
        { status: 400 },
      );
    }

    await ensureRegisteredSourcePeriod(context.company.id, sourceYear);

    const { data: existing } = await supabaseAdmin
      .from("on_muhasebe_yil_devirleri")
      .select("id")
      .eq("company_id", context.company.id)
      .eq("kaynak_yil", sourceYear)
      .eq("hedef_yil", targetYear)
      .maybeSingle<{ id: string }>();

    if (existing && !overwrite) {
      return NextResponse.json(
        {
          message:
            "Bu yıl aralığı için daha önce devir hazırlanmış. Yeniden oluşturmak için 'Mevcut devri yenile' seçeneğini işaretle.",
        },
        { status: 409 },
      );
    }

    if (existing && overwrite) {
      const { error: deleteError } = await supabaseAdmin
        .from("on_muhasebe_yil_devirleri")
        .delete()
        .eq("id", existing.id)
        .eq("company_id", context.company.id);

      if (deleteError) throw deleteError;
    }

    const calculation = await calculateCariYearEndBalances(context.company.id, sourceYear);

    const { data: devir, error: devirError } = await supabaseAdmin
      .from("on_muhasebe_yil_devirleri")
      .insert({
        company_id: context.company.id,
        kaynak_yil: sourceYear,
        hedef_yil: targetYear,
        durum: "hazir",
        cari_sayisi: calculation.summary.cari_sayisi,
        borclu_toplam: calculation.summary.borclu_toplam,
        alacakli_toplam: calculation.summary.alacakli_toplam,
        net_bakiye: calculation.summary.net_bakiye,
        created_by: context.user.id,
      })
      .select("id")
      .single<{ id: string }>();

    if (devirError || !devir) throw devirError || new Error("Devir kaydı oluşturulamadı.");

    const detailRows = calculation.details.map((item) => ({
      devir_id: devir.id,
      company_id: context.company.id,
      cari_id: item.cari.id,
      cari_kodu: item.cari.cari_kodu,
      unvan: item.cari.unvan,
      kaynak_yil: sourceYear,
      hedef_yil: targetYear,
      kaynak_yil_son_bakiye: item.balance,
      hedef_acilis_bakiyesi: item.amount,
      hedef_acilis_bakiye_tipi: item.openingType,
      durum: "hazir",
    }));

    if (detailRows.length > 0) {
      const { error: detailError } = await supabaseAdmin
        .from("on_muhasebe_cari_devirleri")
        .insert(detailRows);

      if (detailError) throw detailError;
    }

    await registerTargetPeriod(context.company.id, targetYear, context.user.id);

    const data = await listDevirler(context.company.id, devir.id);

    return NextResponse.json({
      success: true,
      setupRequired: false,
      message: `${sourceYear} → ${targetYear} cari devirleri hazırlandı. Cari kartların mevcut bakiyesi değiştirilmedi; yeni yıl açılışları devir kayıtlarında tutuldu.`,
      summary: calculation.summary,
      ...data,
    });
  } catch (error) {
    if (isMissingTableError(error)) {
      return NextResponse.json(
        {
          message:
            "Devir tabloları kurulmadan yıl devri hazırlanamaz. Supabase SQL dosyasını çalıştır.",
        },
        { status: 501 },
      );
    }

    return NextResponse.json(
      {
        message:
          error instanceof Error ? error.message : "Devir hazırlanırken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
