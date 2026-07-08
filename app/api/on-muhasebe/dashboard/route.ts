import { NextResponse } from "next/server";
import { getOnMuhasebeContext, isMissingTableError } from "@/lib/onMuhasebe/auth";
import { getOnMuhasebeDaysLeft } from "@/lib/onMuhasebe/plans";
import {
  getWorkYearFromRequest,
  monthStartForWorkYear,
  todayForWorkYear,
  weekStartForWorkYear,
  workYearDateRange,
} from "@/lib/onMuhasebe/workYear";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

type CariRow = {
  id: string;
  cari_turu: "musteri" | "tedarikci" | "musteri_tedarikci";
  unvan: string;
  bakiye: number | null;
  aktif: boolean;
};

type UrunRow = {
  id: string;
  urun_adi: string;
  urun_tipi: "urun" | "hizmet";
  birim: string;
  mevcut_stok: number | null;
  kritik_stok: number | null;
  maliyet_fiyati: number | null;
  aktif: boolean;
};

type KasaHesapRow = {
  id: string;
  hesap_adi: string;
  hesap_turu: "nakit" | "banka" | "kredi_karti" | "pos";
  acilis_bakiyesi: number | null;
  aktif: boolean;
};

type KasaHareketRow = {
  id: string;
  kasa_hesap_id: string;
  hareket_turu: string;
  islem_tarihi: string;
  tutar: number | null;
  durum: "taslak" | "tamamlandi" | "iptal";
  created_at: string;
  aciklama: string | null;
};

type FisRow = {
  id: string;
  fis_no: string;
  fis_turu: "satis" | "alis";
  fis_tarihi: string;
  genel_toplam: number | null;
  durum: "aktif" | "iptal";
  created_at: string;
  aciklama: string | null;
};

type FisKalemRow = {
  fis_id: string;
  urun_id: string;
  urun_adi: string;
  miktar: number | null;
  satir_toplami: number | null;
};

function kasaGirisiMi(type: string) {
  return ["gelir", "tahsilat", "transfer_giris"].includes(type);
}

function kasaCikisiMi(type: string) {
  return ["gider", "odeme", "transfer_cikis"].includes(type);
}

function numberValue(value: number | null | undefined) {
  return Number(value || 0);
}

async function optionalSingle<T>(
  table: string,
  companyId: string,
  select: string,
) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(select)
    .eq("company_id", companyId)
    .maybeSingle<T>();

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  return error ? null : data;
}

async function optionalLatest<T>(
  table: string,
  companyId: string,
  select: string,
) {
  const { data, error } = await supabaseAdmin
    .from(table)
    .select(select)
    .eq("company_id", companyId)
    .order("created_at", { ascending: false })
    .limit(1);

  if (error && !isMissingTableError(error)) {
    throw error;
  }

  return error ? null : ((data?.[0] || null) as T | null);
}

export async function GET(request: Request) {
  try {
    const context = await getOnMuhasebeContext(request);
    const { user, company } = context;

    const workYear = getWorkYearFromRequest(request);
    const yearRange = workYearDateRange(workYear);
    const today = todayForWorkYear(workYear);
    const monthStart = monthStartForWorkYear(workYear);
    const weekStart = weekStartForWorkYear(workYear);

    const [
      profileResponse,
      subscriptionResponse,
      cariResponse,
      urunResponse,
      kasaHesapResponse,
      kasaHareketResponse,
      fisResponse,
      kalemResponse,
      settings,
      lastBackup,
    ] = await Promise.all([
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, phone, role")
        .eq("id", user.id)
        .single(),
      supabaseAdmin
        .from("subscriptions")
        .select(
          "id, plan, status, trial_started_at, trial_ends_at, monthly_price, total_price, saving_amount, currency",
        )
        .eq("company_id", company.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
      supabaseAdmin
        .from("cari_hesaplar")
        .select("id, cari_turu, unvan, bakiye, aktif")
        .eq("company_id", company.id)
        .is("deleted_at", null)
        .limit(5000),
      supabaseAdmin
        .from("urunler")
        .select(
          "id, urun_adi, urun_tipi, birim, mevcut_stok, kritik_stok, maliyet_fiyati, aktif",
        )
        .eq("company_id", company.id)
        .is("deleted_at", null)
        .limit(5000),
      supabaseAdmin
        .from("kasa_hesaplari")
        .select("id, hesap_adi, hesap_turu, acilis_bakiyesi, aktif")
        .eq("company_id", company.id)
        .is("deleted_at", null)
        .limit(200),
      supabaseAdmin
        .from("kasa_hareketleri")
        .select(
          "id, kasa_hesap_id, hareket_turu, islem_tarihi, tutar, durum, created_at, aciklama",
        )
        .eq("company_id", company.id)
        .gte("islem_tarihi", yearRange.start)
        .lte("islem_tarihi", yearRange.end)
        .order("islem_tarihi", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5000),
      supabaseAdmin
        .from("fatura_fisleri")
        .select(
          "id, fis_no, fis_turu, fis_tarihi, genel_toplam, durum, created_at, aciklama",
        )
        .eq("company_id", company.id)
        .gte("fis_tarihi", yearRange.start)
        .lte("fis_tarihi", yearRange.end)
        .order("fis_tarihi", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(5000),
      supabaseAdmin
        .from("fatura_fis_kalemleri")
        .select("fis_id, urun_id, urun_adi, miktar, satir_toplami")
        .eq("company_id", company.id)
        .limit(3000),
      optionalSingle<{
        auto_backup_enabled: boolean;
        backup_email: string | null;
        backup_frequency_hours: number | null;
      }>(
        "on_muhasebe_settings",
        company.id,
        "auto_backup_enabled, backup_email, backup_frequency_hours",
      ),
      optionalLatest<{
        created_at: string;
        status: string;
        email_to: string | null;
        row_count: number | null;
      }>(
        "on_muhasebe_backup_logs",
        company.id,
        "created_at, status, email_to, row_count",
      ),
    ]);

    if (profileResponse.error) throw profileResponse.error;
    if (subscriptionResponse.error) throw subscriptionResponse.error;
    if (!subscriptionResponse.data) {
      throw new Error("Paket bilgisi bulunamadı.");
    }
    if (cariResponse.error) throw cariResponse.error;
    if (urunResponse.error) throw urunResponse.error;
    if (kasaHesapResponse.error) throw kasaHesapResponse.error;
    if (kasaHareketResponse.error) throw kasaHareketResponse.error;
    if (fisResponse.error) throw fisResponse.error;
    if (kalemResponse.error) throw kalemResponse.error;

    const cariler = (cariResponse.data || []) as CariRow[];
    const urunler = (urunResponse.data || []) as UrunRow[];
    const kasaHesaplari = (kasaHesapResponse.data || []) as KasaHesapRow[];
    const kasaHareketleri = (kasaHareketResponse.data || []) as KasaHareketRow[];
    const fisler = (fisResponse.data || []) as FisRow[];
    const kalemler = (kalemResponse.data || []) as FisKalemRow[];

    const kasaBakiyesi = kasaHesaplari.reduce(
      (sum, hesap) => sum + numberValue(hesap.acilis_bakiyesi),
      0,
    ) +
      kasaHareketleri.reduce((sum, hareket) => {
        if (hareket.durum !== "tamamlandi") return sum;
        if (kasaGirisiMi(hareket.hareket_turu)) return sum + numberValue(hareket.tutar);
        if (kasaCikisiMi(hareket.hareket_turu)) return sum - numberValue(hareket.tutar);
        return sum;
      }, 0);

    const tahsilEdilecek = cariler.reduce((sum, cari) => {
      const bakiye = numberValue(cari.bakiye);
      return bakiye > 0 ? sum + bakiye : sum;
    }, 0);

    const odenecek = cariler.reduce((sum, cari) => {
      const bakiye = numberValue(cari.bakiye);
      return bakiye < 0 ? sum + Math.abs(bakiye) : sum;
    }, 0);

    const stokDegeri = urunler.reduce((sum, urun) => {
      if (urun.urun_tipi === "hizmet") return sum;
      return sum + numberValue(urun.mevcut_stok) * numberValue(urun.maliyet_fiyati);
    }, 0);

    const kritikStok = urunler.filter((urun) => {
      if (urun.urun_tipi === "hizmet") return false;
      const kritik = numberValue(urun.kritik_stok);
      return kritik > 0 && numberValue(urun.mevcut_stok) <= kritik;
    }).length;

    const bugunKasaGiris = kasaHareketleri.reduce((sum, hareket) => {
      if (hareket.durum !== "tamamlandi" || hareket.islem_tarihi !== today) return sum;
      return kasaGirisiMi(hareket.hareket_turu) ? sum + numberValue(hareket.tutar) : sum;
    }, 0);

    const bugunKasaCikis = kasaHareketleri.reduce((sum, hareket) => {
      if (hareket.durum !== "tamamlandi" || hareket.islem_tarihi !== today) return sum;
      return kasaCikisiMi(hareket.hareket_turu) ? sum + numberValue(hareket.tutar) : sum;
    }, 0);

    const buAySatis = fisler.reduce((sum, fis) => {
      if (fis.durum !== "aktif" || fis.fis_turu !== "satis") return sum;
      return sum + numberValue(fis.genel_toplam);
    }, 0);

    const buAyAlis = fisler.reduce((sum, fis) => {
      if (fis.durum !== "aktif" || fis.fis_turu !== "alis") return sum;
      return sum + numberValue(fis.genel_toplam);
    }, 0);

    const buHaftaOdeme = kasaHareketleri.reduce((sum, hareket) => {
      if (
        hareket.durum !== "tamamlandi" ||
        hareket.islem_tarihi < weekStart ||
        !kasaCikisiMi(hareket.hareket_turu)
      ) {
        return sum;
      }

      return sum + numberValue(hareket.tutar);
    }, 0);

    const aktifSatisFisIds = new Set(
      fisler
        .filter((fis) => fis.durum === "aktif" && fis.fis_turu === "satis")
        .map((fis) => fis.id),
    );

    const enCokSatilan = [...kalemler
      .filter((kalem) => aktifSatisFisIds.has(kalem.fis_id))
      .reduce((map, kalem) => {
      const key = kalem.urun_id || kalem.urun_adi;
      const current = map.get(key) || {
        urunAdi: kalem.urun_adi || "Ürün",
        miktar: 0,
        tutar: 0,
      };

      current.miktar += numberValue(kalem.miktar);
      current.tutar += numberValue(kalem.satir_toplami);
      map.set(key, current);
      return map;
      }, new Map<string, { urunAdi: string; miktar: number; tutar: number }>()).values()]
      .sort((a, b) => b.miktar - a.miktar)[0] || null;

    const canCari = context.permissions.cari;
    const canStok = context.permissions.stok;
    const canKasa = context.permissions.kasa;
    const canFatura = context.permissions.fatura;

    const recentActivities = [
      ...(canKasa ? kasaHareketleri.slice(0, 6).map((hareket) => ({
        id: `kasa-${hareket.id}`,
        title: hareket.aciklama || "Kasa hareketi",
        type: "Kasa",
        date: hareket.islem_tarihi,
        amount: numberValue(hareket.tutar),
        tone: kasaGirisiMi(hareket.hareket_turu) ? "green" : "red",
      })) : []),
      ...(canFatura ? fisler.slice(0, 6).map((fis) => ({
        id: `fis-${fis.id}`,
        title: fis.fis_no,
        type: fis.fis_turu === "satis" ? "Satış Fişi" : "Alış Fişi",
        date: fis.fis_tarihi,
        amount: numberValue(fis.genel_toplam),
        tone: fis.fis_turu === "satis" ? "violet" : "slate",
      })) : []),
    ]
      .sort((a, b) => b.date.localeCompare(a.date))
      .slice(0, 8);

    return NextResponse.json({
      profile: profileResponse.data,
      userEmail: user.email || null,
      company,
      role: context.role,
      permissions: context.permissions,
      isOwner: context.isOwner,
      subscription: {
        ...subscriptionResponse.data,
        trialDaysLeft: getOnMuhasebeDaysLeft(subscriptionResponse.data.trial_ends_at),
      },
      summary: {
        kasaBakiyesi: canKasa ? kasaBakiyesi : 0,
        tahsilEdilecek: canCari ? tahsilEdilecek : 0,
        odenecek: canCari ? odenecek : 0,
        netCari: canCari ? tahsilEdilecek - odenecek : 0,
        stokDegeri: canStok ? stokDegeri : 0,
        kritikStok: canStok ? kritikStok : 0,
        aktifCari: canCari ? cariler.filter((cari) => cari.aktif).length : 0,
        toplamCari: canCari ? cariler.length : 0,
        aktifUrun: canStok ? urunler.filter((urun) => urun.aktif).length : 0,
        toplamUrun: canStok ? urunler.length : 0,
        bugunKasaGiris: canKasa ? bugunKasaGiris : 0,
        bugunKasaCikis: canKasa ? bugunKasaCikis : 0,
        buAySatis: canFatura ? buAySatis : 0,
        buAyAlis: canFatura ? buAyAlis : 0,
        buAyNet: canFatura ? buAySatis - buAyAlis : 0,
        buHaftaOdeme: canKasa ? buHaftaOdeme : 0,
        kasaHesapSayisi: canKasa ? kasaHesaplari.length : 0,
      },
      topProduct: canFatura ? enCokSatilan : null,
      recentActivities,
      backup: {
        autoEnabled: settings?.auto_backup_enabled ?? true,
        email: settings?.backup_email || user.email || null,
        frequencyHours: settings?.backup_frequency_hours || 24,
        lastBackup,
      },
      workYear,
      dateRange: {
        today,
        weekStart,
        monthStart,
        yearStart: yearRange.start,
        yearEnd: yearRange.end,
      },
      diagnostics: {
        activeSalesReceiptScope: aktifSatisFisIds.size,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        message:
          error instanceof Error
            ? error.message
            : "Panel özeti yüklenirken hata oluştu.",
      },
      { status: 500 },
    );
  }
}
