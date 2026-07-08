"use client";

import Link from "next/link";
import { ChangeEvent, type ReactNode, useCallback, useEffect, useMemo, useState } from "react";
import { getOnMuhasebeClientContext } from "@/lib/onMuhasebe/client";
import { getBrowserWorkYear, referenceDateForWorkYear, workYearDateRange } from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

type Company = {
  id: string;
  company_code: string | null;
  name: string;
};

type RaporTuru = "stok" | "cari" | "kasa" | "fatura";
type TarihSecimi = "bugun" | "bu_ay" | "bu_yil" | "son_30" | "ozel";
type FisTuru = "satis" | "alis";
type FisDurumu = "aktif" | "iptal";
type KasaDurumu = "taslak" | "tamamlandi" | "iptal";
type StokHareketTuru = "giris" | "cikis" | "duzeltme";
type KasaHareketTuru =
  | "gelir"
  | "gider"
  | "tahsilat"
  | "odeme"
  | "transfer_giris"
  | "transfer_cikis"
  | "duzeltme";

type CariHesap = {
  id: string;
  company_id: string;
  cari_kodu: string;
  cari_turu: "musteri" | "tedarikci" | "musteri_tedarikci";
  unvan: string;
  telefon: string | null;
  bakiye: number;
  aktif: boolean;
  deleted_at: string | null;
};

type UrunKategori = {
  id: string;
  company_id: string;
  kategori_adi: string;
  aktif: boolean;
  deleted_at: string | null;
};

type Urun = {
  id: string;
  company_id: string;
  kategori_id: string | null;
  urun_kodu: string;
  barkod: string | null;
  urun_adi: string;
  urun_tipi: "urun" | "hizmet";
  birim: string;
  kdv_orani: number;
  alis_fiyati: number;
  satis_fiyati: number;
  maliyet_fiyati: number;
  mevcut_stok: number;
  kritik_stok: number;
  para_birimi: string;
  aciklama: string | null;
  aktif: boolean;
  deleted_at: string | null;
  created_at: string;
};

type FaturaFis = {
  id: string;
  company_id: string;
  cari_id: string;
  kasa_hesap_id: string | null;
  fis_no: string;
  fis_turu: FisTuru;
  fis_tarihi: string;
  ara_toplam: number;
  kdv_toplam: number;
  genel_toplam: number;
  tahsilat_tutari: number;
  cari_bakiye_once: number;
  cari_bakiye_sonra: number;
  aciklama: string | null;
  durum: FisDurumu;
  created_at: string;
  updated_at: string;
};

type FaturaFisKalem = {
  id: string;
  company_id: string;
  fis_id: string;
  urun_id: string;
  urun_kodu: string;
  urun_adi: string;
  miktar: number;
  birim: string;
  birim_fiyat: number;
  kdv_orani: number;
  ara_toplam: number;
  kdv_tutari: number;
  satir_toplami: number;
  aciklama: string | null;
  created_at: string;
};

type KasaHesabi = {
  id: string;
  company_id: string;
  hesap_adi: string;
  hesap_turu: "nakit" | "banka" | "kredi_karti" | "pos";
  banka_adi: string | null;
  para_birimi: string;
  acilis_bakiyesi: number;
  aktif: boolean;
  deleted_at: string | null;
};

type GelirGiderKategori = {
  id: string;
  company_id: string;
  kategori_turu: string;
  kategori_adi: string;
  aktif: boolean;
  deleted_at: string | null;
};

type KasaHareketi = {
  id: string;
  company_id: string;
  kasa_hesap_id: string;
  cari_id: string | null;
  fatura_id: string | null;
  kategori_id: string | null;
  hareket_turu: KasaHareketTuru;
  islem_tarihi: string;
  aciklama: string | null;
  tutar: number;
  para_birimi: string;
  iliskili_hareket_id: string | null;
  durum: KasaDurumu;
  created_at: string;
  tahsilat_fis_no: string | null;
  cari_bakiye_once: number | null;
  cari_bakiye_sonra: number | null;
};

type StokHareketi = {
  id: string;
  company_id: string;
  urun_id: string;
  fatura_id: string | null;
  fatura_satir_id: string | null;
  hareket_turu: StokHareketTuru;
  hareket_tarihi: string;
  miktar: number;
  birim_maliyet: number;
  aciklama: string | null;
  created_at: string;
  belge_no: string | null;
  kaynak_turu: string | null;
  kaynak_id: string | null;
};

type Filtreler = {
  tarihSecimi: TarihSecimi;
  baslangicTarihi: string;
  bitisTarihi: string;
  arama: string;
  cariId: string;
  fisTuru: "tum" | FisTuru;
  fisDurumu: "aktif" | "iptal" | "tum";
  kasaHesapId: string;
  kasaHareketTuru: "tum" | KasaHareketTuru;
  kasaYon: "tum" | "giris" | "cikis" | "duzeltme";
  kasaDurumu: "tamamlandi" | "taslak" | "iptal" | "tum";
  stokDurumu: "tum" | "var" | "kritik" | "yok";
  kategoriId: string;
};

type StokRaporSatiri = {
  urun: Urun;
  kategoriAdi: string;
  satilanMiktar: number;
  alinanMiktar: number;
  satisTutari: number;
  alisTutari: number;
  hareketSayisi: number;
  sonHareketTarihi: string | null;
  stokDegeri: number;
  stokDurumu: "Stok Yok" | "Kritik" | "Yeterli";
};

type FisRaporSatiri = {
  fis: FaturaFis;
  cari: CariHesap | null;
  kalemSayisi: number;
  toplamMiktar: number;
};

type CariRaporSatiri = {
  cari: CariHesap;
  satisToplam: number;
  alisToplam: number;
  satilanMiktar: number;
  alinanMiktar: number;
  satisFisSayisi: number;
  alisFisSayisi: number;
  kalemSayisi: number;
  tahsilatToplam: number;
  odemeToplam: number;
  kasaHareketSayisi: number;
  sonIslemTarihi: string | null;
};

const raporKartlari: Array<{
  key: RaporTuru;
  title: string;
  desc: string;
  badge: string;
}> = [
  {
    key: "stok",
    title: "Stok Raporları",
    desc: "Ürün bazlı mevcut stok, alış, satış ve hareket detayı.",
    badge: "Ürün",
  },
  {
    key: "cari",
    title: "Cari Raporları",
    desc: "Cari bazlı alış, satış, ürün miktarı, tahsilat ve ödeme özeti.",
    badge: "Cari",
  },
  {
    key: "kasa",
    title: "Kasa Raporları",
    desc: "Gelen, giden, tahsilat, ödeme ve transfer hareketleri.",
    badge: "Para",
  },
  {
    key: "fatura",
    title: "Fiş / Fatura Raporları",
    desc: "Kime ne kadar ürün gitti, hangi fişte neler var.",
    badge: "Fiş",
  },
];

const fisTuruEtiketleri: Record<FisTuru, string> = {
  satis: "Satış",
  alis: "Alış",
};

const kasaHareketEtiketleri: Record<KasaHareketTuru, string> = {
  gelir: "Gelir",
  gider: "Gider",
  tahsilat: "Tahsilat",
  odeme: "Ödeme",
  transfer_giris: "Transfer Giriş",
  transfer_cikis: "Transfer Çıkış",
  duzeltme: "Düzeltme",
};

function tarihToIso(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function tarihAraligi(secim: TarihSecimi, workYear = new Date().getFullYear()) {
  const today = referenceDateForWorkYear(workYear);
  const bitis = tarihToIso(today);

  if (secim === "bugun") {
    return { baslangicTarihi: bitis, bitisTarihi: bitis };
  }

  if (secim === "bu_yil") {
    return {
      baslangicTarihi: tarihToIso(new Date(workYear, 0, 1)),
      bitisTarihi: bitis,
    };
  }

  if (secim === "son_30") {
    const start = new Date(today);
    start.setDate(start.getDate() - 29);
    return { baslangicTarihi: tarihToIso(start), bitisTarihi: bitis };
  }

  return {
    baslangicTarihi: tarihToIso(new Date(workYear, today.getMonth(), 1)),
    bitisTarihi: bitis,
  };
}

function varsayilanFiltreler(workYear = new Date().getFullYear()): Filtreler {
  const aralik = tarihAraligi("bu_ay", workYear);

  return {
    tarihSecimi: "bu_ay",
    baslangicTarihi: aralik.baslangicTarihi,
    bitisTarihi: aralik.bitisTarihi,
    arama: "",
    cariId: "tum",
    fisTuru: "tum",
    fisDurumu: "aktif",
    kasaHesapId: "tum",
    kasaHareketTuru: "tum",
    kasaYon: "tum",
    kasaDurumu: "tamamlandi",
    stokDurumu: "tum",
    kategoriId: "tum",
  };
}

function formatShortDate(value?: string | null) {
  if (!value) return "-";
  const datePart = value.slice(0, 10);
  const parts = datePart.split("-").map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(parts[0], parts[1] - 1, parts[2]));
}

function formatMoney(value?: number | string | null) {
  return Number(value || 0).toLocaleString("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
  });
}

function formatNumber(value?: number | string | null) {
  return Number(value || 0).toLocaleString("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

function normalize(value?: string | null) {
  return String(value || "").toLocaleLowerCase("tr-TR").trim();
}

function dateInRange(value: string | null | undefined, start: string, end: string) {
  if (!value) return false;
  const clean = value.slice(0, 10);
  return clean >= start && clean <= end;
}

function kasaYon(hareketTuru: KasaHareketTuru): "giris" | "cikis" | "duzeltme" {
  if (["gelir", "tahsilat", "transfer_giris"].includes(hareketTuru)) {
    return "giris";
  }

  if (["gider", "odeme", "transfer_cikis"].includes(hareketTuru)) {
    return "cikis";
  }

  return "duzeltme";
}

function hataMesajiAl(error: unknown, fallback: string) {
  if (error instanceof Error) return error.message;

  if (typeof error === "object" && error !== null) {
    const supabaseError = error as {
      message?: string;
      details?: string;
      hint?: string;
      code?: string;
    };

    const mesajlar = [
      supabaseError.message,
      supabaseError.details,
      supabaseError.hint,
      supabaseError.code ? `Kod: ${supabaseError.code}` : "",
    ].filter(Boolean);

    if (mesajlar.length > 0) return mesajlar.join(" | ");
  }

  return fallback;
}

function durumRozeti(text: string, tone: "green" | "red" | "amber" | "slate" | "blue") {
  const classMap = {
    green: "bg-emerald-50 text-emerald-700 ring-emerald-100",
    red: "bg-red-50 text-red-700 ring-red-100",
    amber: "bg-amber-50 text-amber-700 ring-amber-100",
    slate: "bg-slate-100 text-slate-700 ring-slate-200",
    blue: "bg-blue-50 text-blue-700 ring-blue-100",
  };

  return (
    <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-black ring-1 ${classMap[tone]}`}>
      {text}
    </span>
  );
}

export default function OnMuhasebeRaporPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [cariHesaplar, setCariHesaplar] = useState<CariHesap[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [urunKategorileri, setUrunKategorileri] = useState<UrunKategori[]>([]);
  const [fisler, setFisler] = useState<FaturaFis[]>([]);
  const [fisKalemleri, setFisKalemleri] = useState<FaturaFisKalem[]>([]);
  const [kasaHesaplari, setKasaHesaplari] = useState<KasaHesabi[]>([]);
  const [kasaHareketleri, setKasaHareketleri] = useState<KasaHareketi[]>([]);
  const [gelirGiderKategorileri, setGelirGiderKategorileri] = useState<GelirGiderKategori[]>([]);
  const [stokHareketleri, setStokHareketleri] = useState<StokHareketi[]>([]);

  const [workYear] = useState(getBrowserWorkYear());
  const yearRange = useMemo(() => workYearDateRange(workYear), [workYear]);
  const [raporTuru, setRaporTuru] = useState<RaporTuru>("stok");
  const [filtreler, setFiltreler] = useState<Filtreler>(() => varsayilanFiltreler(getBrowserWorkYear()));
  const [raporHazir, setRaporHazir] = useState(false);
  const [seciliUrunId, setSeciliUrunId] = useState<string | null>(null);
  const [seciliCariId, setSeciliCariId] = useState<string | null>(null);
  const [seciliFisId, setSeciliFisId] = useState<string | null>(null);
  const [seciliKasaHareketId, setSeciliKasaHareketId] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  const cariMap = useMemo(() => {
    return new Map(cariHesaplar.map((cari) => [cari.id, cari]));
  }, [cariHesaplar]);

  const urunMap = useMemo(() => {
    return new Map(urunler.map((urun) => [urun.id, urun]));
  }, [urunler]);

  const kategoriMap = useMemo(() => {
    return new Map(urunKategorileri.map((kategori) => [kategori.id, kategori]));
  }, [urunKategorileri]);

  const fisMap = useMemo(() => {
    return new Map(fisler.map((fis) => [fis.id, fis]));
  }, [fisler]);

  const kasaHesapMap = useMemo(() => {
    return new Map(kasaHesaplari.map((hesap) => [hesap.id, hesap]));
  }, [kasaHesaplari]);

  const gelirGiderKategoriMap = useMemo(() => {
    return new Map(gelirGiderKategorileri.map((kategori) => [kategori.id, kategori]));
  }, [gelirGiderKategorileri]);

  const seciliDonemEtiketi = useMemo(() => {
    return `${formatShortDate(filtreler.baslangicTarihi)} - ${formatShortDate(filtreler.bitisTarihi)}`;
  }, [filtreler.baslangicTarihi, filtreler.bitisTarihi]);

  const filtreliFisler = useMemo(() => {
    const arama = normalize(filtreler.arama);

    return fisler
      .filter((fis) => dateInRange(fis.fis_tarihi, filtreler.baslangicTarihi, filtreler.bitisTarihi))
      .filter((fis) => filtreler.fisTuru === "tum" || fis.fis_turu === filtreler.fisTuru)
      .filter((fis) => filtreler.fisDurumu === "tum" || fis.durum === filtreler.fisDurumu)
      .filter((fis) => filtreler.cariId === "tum" || fis.cari_id === filtreler.cariId)
      .filter((fis) => {
        if (!arama) return true;
        const cari = cariMap.get(fis.cari_id);
        return [fis.fis_no, fis.aciklama, cari?.unvan, cari?.cari_kodu]
          .map(normalize)
          .some((value) => value.includes(arama));
      })
      .sort((a, b) => {
        const tarihKarsilastirma = b.fis_tarihi.localeCompare(a.fis_tarihi);
        if (tarihKarsilastirma !== 0) return tarihKarsilastirma;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [cariMap, filtreler, fisler]);

  const aktifFiltreliFisler = useMemo(() => {
    return filtreliFisler.filter((fis) => fis.durum === "aktif");
  }, [filtreliFisler]);

  const stokRaporSatirlari = useMemo<StokRaporSatiri[]>(() => {
    const arama = normalize(filtreler.arama);

    return urunler
      .filter((urun) => urun.aktif && !urun.deleted_at)
      .filter((urun) => filtreler.kategoriId === "tum" || urun.kategori_id === filtreler.kategoriId)
      .filter((urun) => {
        if (!arama) return true;
        const kategoriAdi = urun.kategori_id ? kategoriMap.get(urun.kategori_id)?.kategori_adi : "";
        return [urun.urun_adi, urun.urun_kodu, urun.barkod, kategoriAdi]
          .map(normalize)
          .some((value) => value.includes(arama));
      })
      .map((urun) => {
        const donemKalemleri = fisKalemleri.filter((kalem) => {
          if (kalem.urun_id !== urun.id) return false;
          const fis = fisMap.get(kalem.fis_id);
          if (!fis || fis.durum !== "aktif") return false;
          if (filtreler.cariId !== "tum" && fis.cari_id !== filtreler.cariId) return false;
          return dateInRange(fis.fis_tarihi, filtreler.baslangicTarihi, filtreler.bitisTarihi);
        });

        const satisKalemleri = donemKalemleri.filter((kalem) => fisMap.get(kalem.fis_id)?.fis_turu === "satis");
        const alisKalemleri = donemKalemleri.filter((kalem) => fisMap.get(kalem.fis_id)?.fis_turu === "alis");
        const sonHareket = donemKalemleri
          .map((kalem) => fisMap.get(kalem.fis_id)?.fis_tarihi || null)
          .filter(Boolean)
          .sort()
          .at(-1) || null;

        const stokDurumu: StokRaporSatiri["stokDurumu"] =
          Number(urun.mevcut_stok) <= 0
            ? "Stok Yok"
            : Number(urun.mevcut_stok) <= Number(urun.kritik_stok)
              ? "Kritik"
              : "Yeterli";

        return {
          urun,
          kategoriAdi: urun.kategori_id ? kategoriMap.get(urun.kategori_id)?.kategori_adi || "Kategorisiz" : "Kategorisiz",
          satilanMiktar: satisKalemleri.reduce((sum, kalem) => sum + Number(kalem.miktar || 0), 0),
          alinanMiktar: alisKalemleri.reduce((sum, kalem) => sum + Number(kalem.miktar || 0), 0),
          satisTutari: satisKalemleri.reduce((sum, kalem) => sum + Number(kalem.satir_toplami || 0), 0),
          alisTutari: alisKalemleri.reduce((sum, kalem) => sum + Number(kalem.satir_toplami || 0), 0),
          hareketSayisi: donemKalemleri.length,
          sonHareketTarihi: sonHareket,
          stokDegeri: Number(urun.mevcut_stok || 0) * Number(urun.maliyet_fiyati || urun.alis_fiyati || 0),
          stokDurumu,
        };
      })
      .filter((satir) => {
        if (filtreler.stokDurumu === "tum") return true;
        if (filtreler.stokDurumu === "var") return Number(satir.urun.mevcut_stok) > 0;
        if (filtreler.stokDurumu === "kritik") return satir.stokDurumu === "Kritik";
        return satir.stokDurumu === "Stok Yok";
      })
      .sort((a, b) => {
        const durumSira = { "Stok Yok": 0, Kritik: 1, Yeterli: 2 };
        const durumFarki = durumSira[a.stokDurumu] - durumSira[b.stokDurumu];
        if (durumFarki !== 0) return durumFarki;
        return a.urun.urun_adi.localeCompare(b.urun.urun_adi, "tr");
      });
  }, [filtreler, fisKalemleri, fisMap, kategoriMap, urunler]);

  const filtreliKasaHareketleri = useMemo(() => {
    const arama = normalize(filtreler.arama);

    return kasaHareketleri
      .filter((hareket) => dateInRange(hareket.islem_tarihi, filtreler.baslangicTarihi, filtreler.bitisTarihi))
      .filter((hareket) => filtreler.kasaHesapId === "tum" || hareket.kasa_hesap_id === filtreler.kasaHesapId)
      .filter((hareket) => filtreler.kasaHareketTuru === "tum" || hareket.hareket_turu === filtreler.kasaHareketTuru)
      .filter((hareket) => filtreler.kasaDurumu === "tum" || hareket.durum === filtreler.kasaDurumu)
      .filter((hareket) => filtreler.cariId === "tum" || hareket.cari_id === filtreler.cariId)
      .filter((hareket) => filtreler.kasaYon === "tum" || kasaYon(hareket.hareket_turu) === filtreler.kasaYon)
      .filter((hareket) => {
        if (!arama) return true;
        const cari = hareket.cari_id ? cariMap.get(hareket.cari_id) : null;
        const kasa = kasaHesapMap.get(hareket.kasa_hesap_id);
        const kategori = hareket.kategori_id ? gelirGiderKategoriMap.get(hareket.kategori_id) : null;

        return [
          hareket.aciklama,
          hareket.tahsilat_fis_no,
          kasa?.hesap_adi,
          cari?.unvan,
          cari?.cari_kodu,
          kategori?.kategori_adi,
          kasaHareketEtiketleri[hareket.hareket_turu],
        ]
          .map(normalize)
          .some((value) => value.includes(arama));
      })
      .sort((a, b) => {
        const tarihKarsilastirma = b.islem_tarihi.localeCompare(a.islem_tarihi);
        if (tarihKarsilastirma !== 0) return tarihKarsilastirma;
        return b.created_at.localeCompare(a.created_at);
      });
  }, [cariMap, filtreler, gelirGiderKategoriMap, kasaHareketleri, kasaHesapMap]);

  const faturaRaporSatirlari = useMemo<FisRaporSatiri[]>(() => {
    return filtreliFisler.map((fis) => {
      const kalemler = fisKalemleri.filter((kalem) => kalem.fis_id === fis.id);

      return {
        fis,
        cari: cariMap.get(fis.cari_id) || null,
        kalemSayisi: kalemler.length,
        toplamMiktar: kalemler.reduce((sum, kalem) => sum + Number(kalem.miktar || 0), 0),
      };
    });
  }, [cariMap, filtreliFisler, fisKalemleri]);

  const stokOzet = useMemo(() => {
    return {
      urunSayisi: stokRaporSatirlari.length,
      mevcutStok: stokRaporSatirlari.reduce((sum, satir) => sum + Number(satir.urun.mevcut_stok || 0), 0),
      kritikSayisi: stokRaporSatirlari.filter((satir) => satir.stokDurumu === "Kritik" || satir.stokDurumu === "Stok Yok").length,
      stokDegeri: stokRaporSatirlari.reduce((sum, satir) => sum + Number(satir.stokDegeri || 0), 0),
      satisTutari: stokRaporSatirlari.reduce((sum, satir) => sum + Number(satir.satisTutari || 0), 0),
      alisTutari: stokRaporSatirlari.reduce((sum, satir) => sum + Number(satir.alisTutari || 0), 0),
    };
  }, [stokRaporSatirlari]);

  const kasaOzet = useMemo(() => {
    const tamamlanmis = filtreliKasaHareketleri.filter((hareket) => hareket.durum === "tamamlandi");
    const gelen = tamamlanmis
      .filter((hareket) => kasaYon(hareket.hareket_turu) === "giris")
      .reduce((sum, hareket) => sum + Number(hareket.tutar || 0), 0);
    const giden = tamamlanmis
      .filter((hareket) => kasaYon(hareket.hareket_turu) === "cikis")
      .reduce((sum, hareket) => sum + Number(hareket.tutar || 0), 0);
    const duzeltme = tamamlanmis
      .filter((hareket) => kasaYon(hareket.hareket_turu) === "duzeltme")
      .reduce((sum, hareket) => sum + Number(hareket.tutar || 0), 0);

    return {
      hareketSayisi: filtreliKasaHareketleri.length,
      gelen,
      giden,
      duzeltme,
      net: gelen - giden,
    };
  }, [filtreliKasaHareketleri]);

  const faturaOzet = useMemo(() => {
    const satisToplam = aktifFiltreliFisler
      .filter((fis) => fis.fis_turu === "satis")
      .reduce((sum, fis) => sum + Number(fis.genel_toplam || 0), 0);
    const alisToplam = aktifFiltreliFisler
      .filter((fis) => fis.fis_turu === "alis")
      .reduce((sum, fis) => sum + Number(fis.genel_toplam || 0), 0);
    const kalemSayisi = aktifFiltreliFisler.reduce(
      (sum, fis) => sum + fisKalemleri.filter((kalem) => kalem.fis_id === fis.id).length,
      0,
    );

    return {
      fisSayisi: filtreliFisler.length,
      aktifFisSayisi: aktifFiltreliFisler.length,
      satisToplam,
      alisToplam,
      net: satisToplam - alisToplam,
      kalemSayisi,
    };
  }, [aktifFiltreliFisler, filtreliFisler.length, fisKalemleri]);

  const cariRaporSatirlari = useMemo<CariRaporSatiri[]>(() => {
    const arama = normalize(filtreler.arama);

    const secilenCariler = cariHesaplar
      .filter((cari) => cari.aktif && !cari.deleted_at)
      .filter((cari) => filtreler.cariId === "tum" || cari.id === filtreler.cariId)
      .filter((cari) => {
        if (!arama) return true;
        return [cari.unvan, cari.cari_kodu, cari.telefon, cari.cari_turu]
          .map(normalize)
          .some((value) => value.includes(arama));
      });

    return secilenCariler
      .map((cari) => {
        const cariFisleri = filtreliFisler.filter((fis) => fis.cari_id === cari.id);
        const cariKasaHareketleri = filtreliKasaHareketleri.filter(
          (hareket) => hareket.cari_id === cari.id && hareket.durum === "tamamlandi",
        );
        const cariKalemleri = cariFisleri.flatMap((fis) =>
          fisKalemleri
            .filter((kalem) => kalem.fis_id === fis.id)
            .map((kalem) => ({ kalem, fis })),
        );

        const satisFisleri = cariFisleri.filter((fis) => fis.fis_turu === "satis");
        const alisFisleri = cariFisleri.filter((fis) => fis.fis_turu === "alis");
        const satisKalemleri = cariKalemleri.filter((item) => item.fis.fis_turu === "satis");
        const alisKalemleri = cariKalemleri.filter((item) => item.fis.fis_turu === "alis");
        const tarihListesi = [
          ...cariFisleri.map((fis) => fis.fis_tarihi),
          ...cariKasaHareketleri.map((hareket) => hareket.islem_tarihi),
        ].filter(Boolean);

        return {
          cari,
          satisToplam: satisFisleri.reduce((sum, fis) => sum + Number(fis.genel_toplam || 0), 0),
          alisToplam: alisFisleri.reduce((sum, fis) => sum + Number(fis.genel_toplam || 0), 0),
          satilanMiktar: satisKalemleri.reduce((sum, item) => sum + Number(item.kalem.miktar || 0), 0),
          alinanMiktar: alisKalemleri.reduce((sum, item) => sum + Number(item.kalem.miktar || 0), 0),
          satisFisSayisi: satisFisleri.length,
          alisFisSayisi: alisFisleri.length,
          kalemSayisi: cariKalemleri.length,
          tahsilatToplam: cariKasaHareketleri
            .filter((hareket) => hareket.hareket_turu === "tahsilat")
            .reduce((sum, hareket) => sum + Number(hareket.tutar || 0), 0),
          odemeToplam: cariKasaHareketleri
            .filter((hareket) => hareket.hareket_turu === "odeme")
            .reduce((sum, hareket) => sum + Number(hareket.tutar || 0), 0),
          kasaHareketSayisi: cariKasaHareketleri.length,
          sonIslemTarihi: tarihListesi.sort().at(-1) || null,
        };
      })
      .filter((satir) => {
        if (filtreler.cariId !== "tum") return true;
        return (
          satir.satisFisSayisi > 0 ||
          satir.alisFisSayisi > 0 ||
          satir.kasaHareketSayisi > 0 ||
          Number(satir.cari.bakiye || 0) !== 0
        );
      })
      .sort((a, b) => {
        const toplamA = a.satisToplam + a.alisToplam + a.tahsilatToplam + a.odemeToplam;
        const toplamB = b.satisToplam + b.alisToplam + b.tahsilatToplam + b.odemeToplam;
        if (toplamB !== toplamA) return toplamB - toplamA;
        return a.cari.unvan.localeCompare(b.cari.unvan, "tr");
      });
  }, [cariHesaplar, filtreler, filtreliFisler, filtreliKasaHareketleri, fisKalemleri]);

  const cariRaporOzet = useMemo(() => {
    return {
      cariSayisi: cariRaporSatirlari.length,
      satisToplam: cariRaporSatirlari.reduce((sum, satir) => sum + satir.satisToplam, 0),
      alisToplam: cariRaporSatirlari.reduce((sum, satir) => sum + satir.alisToplam, 0),
      tahsilatToplam: cariRaporSatirlari.reduce((sum, satir) => sum + satir.tahsilatToplam, 0),
      odemeToplam: cariRaporSatirlari.reduce((sum, satir) => sum + satir.odemeToplam, 0),
      kalemSayisi: cariRaporSatirlari.reduce((sum, satir) => sum + satir.kalemSayisi, 0),
    };
  }, [cariRaporSatirlari]);

  const seciliUrun = seciliUrunId ? urunMap.get(seciliUrunId) || null : null;
  const seciliCari = seciliCariId ? cariMap.get(seciliCariId) || null : null;
  const seciliFis = seciliFisId ? fisMap.get(seciliFisId) || null : null;
  const seciliKasaHareketi = seciliKasaHareketId
    ? kasaHareketleri.find((hareket) => hareket.id === seciliKasaHareketId) || null
    : null;

  const seciliUrunFisHareketleri = useMemo(() => {
    if (!seciliUrun) return [];

    return fisKalemleri
      .filter((kalem) => kalem.urun_id === seciliUrun.id)
      .map((kalem) => {
        const fis = fisMap.get(kalem.fis_id);
        return { kalem, fis, cari: fis ? cariMap.get(fis.cari_id) || null : null };
      })
      .filter((item) => item.fis && item.fis.durum === "aktif")
      .filter((item) => filtreler.cariId === "tum" || item.fis?.cari_id === filtreler.cariId)
      .filter((item) => dateInRange(item.fis?.fis_tarihi, filtreler.baslangicTarihi, filtreler.bitisTarihi))
      .sort((a, b) => {
        const tarihA = a.fis?.fis_tarihi || "";
        const tarihB = b.fis?.fis_tarihi || "";
        return tarihB.localeCompare(tarihA);
      });
  }, [cariMap, filtreler.baslangicTarihi, filtreler.bitisTarihi, filtreler.cariId, fisKalemleri, fisMap, seciliUrun]);

  const seciliUrunStokHareketleri = useMemo(() => {
    if (!seciliUrun) return [];

    return stokHareketleri
      .filter((hareket) => hareket.urun_id === seciliUrun.id)
      .filter((hareket) => dateInRange(hareket.hareket_tarihi, filtreler.baslangicTarihi, filtreler.bitisTarihi))
      .sort((a, b) => b.hareket_tarihi.localeCompare(a.hareket_tarihi));
  }, [filtreler.baslangicTarihi, filtreler.bitisTarihi, seciliUrun, stokHareketleri]);

  const seciliFisKalemleri = useMemo(() => {
    if (!seciliFis) return [];
    return fisKalemleri.filter((kalem) => kalem.fis_id === seciliFis.id);
  }, [fisKalemleri, seciliFis]);

  const seciliCariFisleri = useMemo(() => {
    if (!seciliCari) return [];
    return filtreliFisler.filter((fis) => fis.cari_id === seciliCari.id);
  }, [filtreliFisler, seciliCari]);

  const seciliCariKasaHareketleri = useMemo(() => {
    if (!seciliCari) return [];
    return filtreliKasaHareketleri.filter((hareket) => hareket.cari_id === seciliCari.id && hareket.durum === "tamamlandi");
  }, [filtreliKasaHareketleri, seciliCari]);

  const seciliCariUrunOzetleri = useMemo(() => {
    if (!seciliCari) return [];

    const map = new Map<
      string,
      {
        urunAdi: string;
        urunKodu: string;
        birim: string;
        satilanMiktar: number;
        alinanMiktar: number;
        satisToplam: number;
        alisToplam: number;
      }
    >();

    seciliCariFisleri.forEach((fis) => {
      fisKalemleri
        .filter((kalem) => kalem.fis_id === fis.id)
        .forEach((kalem) => {
          const mevcut = map.get(kalem.urun_id) || {
            urunAdi: kalem.urun_adi,
            urunKodu: kalem.urun_kodu,
            birim: kalem.birim,
            satilanMiktar: 0,
            alinanMiktar: 0,
            satisToplam: 0,
            alisToplam: 0,
          };

          if (fis.fis_turu === "satis") {
            mevcut.satilanMiktar += Number(kalem.miktar || 0);
            mevcut.satisToplam += Number(kalem.satir_toplami || 0);
          } else {
            mevcut.alinanMiktar += Number(kalem.miktar || 0);
            mevcut.alisToplam += Number(kalem.satir_toplami || 0);
          }

          map.set(kalem.urun_id, mevcut);
        });
    });

    return [...map.values()].sort((a, b) => {
      const toplamA = a.satisToplam + a.alisToplam;
      const toplamB = b.satisToplam + b.alisToplam;
      return toplamB - toplamA;
    });
  }, [fisKalemleri, seciliCari, seciliCariFisleri]);

  const verileriYukle = useCallback(async (forceRefresh = false) => {
    if (forceRefresh) setIsRefreshing(true);
    else setIsLoading(true);

    setErrorMessage("");

    try {
      const context = await getOnMuhasebeClientContext();
      const companyData = context.company;

      const companyId = String(companyData.id);
      setCompany(companyData as Company);

      const [
        cariResult,
        urunResult,
        kategoriResult,
        fisResult,
        fisKalemResult,
        kasaHesapResult,
        kasaHareketResult,
        gelirGiderKategoriResult,
        stokHareketResult,
      ] = await Promise.all([
        supabaseClient
          .from("cari_hesaplar")
          .select("id, company_id, cari_kodu, cari_turu, unvan, telefon, bakiye, aktif, deleted_at")
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("unvan", { ascending: true })
          .limit(10000),
        supabaseClient
          .from("urunler")
          .select(
            "id, company_id, kategori_id, urun_kodu, barkod, urun_adi, urun_tipi, birim, kdv_orani, alis_fiyati, satis_fiyati, maliyet_fiyati, mevcut_stok, kritik_stok, para_birimi, aciklama, aktif, deleted_at, created_at",
          )
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("urun_adi", { ascending: true })
          .limit(10000),
        supabaseClient
          .from("urun_kategorileri")
          .select("id, company_id, kategori_adi, aktif, deleted_at")
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("kategori_adi", { ascending: true })
          .limit(10000),
        supabaseClient
          .from("fatura_fisleri")
          .select(
            "id, company_id, cari_id, kasa_hesap_id, fis_no, fis_turu, fis_tarihi, ara_toplam, kdv_toplam, genel_toplam, tahsilat_tutari, cari_bakiye_once, cari_bakiye_sonra, aciklama, durum, created_at, updated_at",
          )
          .eq("company_id", companyId)
          .gte("fis_tarihi", yearRange.start)
          .lte("fis_tarihi", yearRange.end)
          .order("fis_tarihi", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(10000),
        supabaseClient
          .from("fatura_fis_kalemleri")
          .select(
            "id, company_id, fis_id, urun_id, urun_kodu, urun_adi, miktar, birim, birim_fiyat, kdv_orani, ara_toplam, kdv_tutari, satir_toplami, aciklama, created_at",
          )
          .eq("company_id", companyId)
          .limit(20000),
        supabaseClient
          .from("kasa_hesaplari")
          .select(
            "id, company_id, hesap_adi, hesap_turu, banka_adi, para_birimi, acilis_bakiyesi, aktif, deleted_at",
          )
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("hesap_adi", { ascending: true })
          .limit(10000),
        supabaseClient
          .from("kasa_hareketleri")
          .select(
            "id, company_id, kasa_hesap_id, cari_id, fatura_id, kategori_id, hareket_turu, islem_tarihi, aciklama, tutar, para_birimi, iliskili_hareket_id, durum, created_at, tahsilat_fis_no, cari_bakiye_once, cari_bakiye_sonra",
          )
          .eq("company_id", companyId)
          .gte("islem_tarihi", yearRange.start)
          .lte("islem_tarihi", yearRange.end)
          .order("islem_tarihi", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20000),
        supabaseClient
          .from("gelir_gider_kategorileri")
          .select("id, company_id, kategori_turu, kategori_adi, aktif, deleted_at")
          .eq("company_id", companyId)
          .is("deleted_at", null)
          .order("kategori_adi", { ascending: true })
          .limit(10000),
        supabaseClient
          .from("stok_hareketleri")
          .select(
            "id, company_id, urun_id, fatura_id, fatura_satir_id, hareket_turu, hareket_tarihi, miktar, birim_maliyet, aciklama, created_at, belge_no, kaynak_turu, kaynak_id",
          )
          .eq("company_id", companyId)
          .gte("hareket_tarihi", yearRange.start)
          .lte("hareket_tarihi", yearRange.end)
          .order("hareket_tarihi", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(20000),
      ]);

      const results = [
        cariResult,
        urunResult,
        kategoriResult,
        fisResult,
        fisKalemResult,
        kasaHesapResult,
        kasaHareketResult,
        gelirGiderKategoriResult,
        stokHareketResult,
      ];

      const firstError = results.find((result) => result.error)?.error;
      if (firstError) throw firstError;

      setCariHesaplar((cariResult.data || []) as CariHesap[]);
      setUrunler((urunResult.data || []) as Urun[]);
      setUrunKategorileri((kategoriResult.data || []) as UrunKategori[]);
      setFisler((fisResult.data || []) as FaturaFis[]);
      setFisKalemleri((fisKalemResult.data || []) as FaturaFisKalem[]);
      setKasaHesaplari((kasaHesapResult.data || []) as KasaHesabi[]);
      setKasaHareketleri((kasaHareketResult.data || []) as KasaHareketi[]);
      setGelirGiderKategorileri((gelirGiderKategoriResult.data || []) as GelirGiderKategori[]);
      setStokHareketleri((stokHareketResult.data || []) as StokHareketi[]);
    } catch (error) {
      setErrorMessage(hataMesajiAl(error, "Rapor verileri yüklenemedi."));
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [yearRange.end, yearRange.start]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  function raporTurunuSec(tur: RaporTuru) {
    setRaporTuru(tur);
    setRaporHazir(false);
    setSeciliUrunId(null);
    setSeciliCariId(null);
    setSeciliFisId(null);
    setSeciliKasaHareketId(null);
  }

  function filtreGuncelle<K extends keyof Filtreler>(key: K, value: Filtreler[K]) {
    setFiltreler((prev) => ({ ...prev, [key]: value }));
    setSeciliUrunId(null);
    setSeciliCariId(null);
    setSeciliFisId(null);
    setSeciliKasaHareketId(null);
  }

  function tarihSecimiDegistir(event: ChangeEvent<HTMLSelectElement>) {
    const secim = event.target.value as TarihSecimi;

    if (secim === "ozel") {
      setFiltreler((prev) => ({ ...prev, tarihSecimi: secim }));
      return;
    }

    const aralik = tarihAraligi(secim, workYear);
    setFiltreler((prev) => ({
      ...prev,
      tarihSecimi: secim,
      baslangicTarihi: aralik.baslangicTarihi,
      bitisTarihi: aralik.bitisTarihi,
    }));
  }

  function raporuGoster() {
    setRaporHazir(true);
    setSeciliUrunId(null);
    setSeciliCariId(null);
    setSeciliFisId(null);
    setSeciliKasaHareketId(null);
  }

  function filtreleriTemizle() {
    setFiltreler(varsayilanFiltreler());
    setRaporHazir(false);
    setSeciliUrunId(null);
    setSeciliCariId(null);
    setSeciliFisId(null);
    setSeciliKasaHareketId(null);
  }

  function yazdir() {
    window.print();
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5 text-slate-950">
        <div className="border border-slate-200 bg-white px-8 py-7 text-center">
          <div className="mx-auto h-9 w-9 animate-spin rounded-full border-4 border-slate-100 border-t-slate-900" />
          <p className="mt-4 text-sm font-black text-slate-600">Rapor verileri yükleniyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto w-full max-w-[1500px] px-4 py-4 sm:px-6 lg:px-8">
        <header className="border-b border-slate-200 bg-white px-4 py-4 print:border-0">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <Link href="/on-muhasebe/panel" className="text-xs font-black uppercase tracking-[0.22em] text-slate-400 print:hidden">
                ← Panele dön
              </Link>
              <h1 className="mt-2 text-2xl font-black tracking-tight text-slate-950">Raporlar</h1>
              <p className="mt-1 text-sm font-bold text-slate-500">
                {company?.name || "İşletme"} · sadece görüntüleme ekranı, düzenleme ve silme işlemi yok.
              </p>
            </div>

            <div className="flex flex-wrap gap-2 print:hidden">
              <button
                type="button"
                onClick={() => verileriYukle(true)}
                disabled={isRefreshing}
                className="h-10 border border-slate-300 bg-white px-4 text-sm font-black text-slate-700 transition hover:bg-slate-100 disabled:opacity-60"
              >
                {isRefreshing ? "Yenileniyor" : "Verileri Yenile"}
              </button>
              <button
                type="button"
                onClick={yazdir}
                className="h-10 bg-slate-950 px-4 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Yazdır
              </button>
            </div>
          </div>
        </header>

        {errorMessage ? (
          <section className="mt-4 border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
            {errorMessage}
          </section>
        ) : null}

        <section className="mt-4 border border-slate-200 bg-white print:hidden">
          <div className="border-b border-slate-200 p-3">
            <div className="grid grid-cols-2 gap-2 md:flex">
              {raporKartlari.map((kart) => {
                const aktif = raporTuru === kart.key;
                return (
                  <button
                    key={kart.key}
                    type="button"
                    onClick={() => raporTurunuSec(kart.key)}
                    className={`h-11 px-4 text-sm font-black transition md:min-w-[150px] ${
                      aktif
                        ? "bg-slate-950 text-white"
                        : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {kart.title.replace(" Raporları", "").replace(" / Fatura", "")}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="grid gap-3 p-3 md:grid-cols-2 xl:grid-cols-6">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Dönem</span>
              <select
                value={filtreler.tarihSecimi}
                onChange={tarihSecimiDegistir}
                className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
              >
                <option value="bugun">Bugün</option>
                <option value="bu_ay">Bu Ay</option>
                <option value="bu_yil">Bu Yıl</option>
                <option value="son_30">Son 30 Gün</option>
                <option value="ozel">Özel Tarih</option>
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Başlangıç</span>
              <input
                type="date"
                min={yearRange.start}
                max={yearRange.end}
                value={filtreler.baslangicTarihi}
                onChange={(event) => {
                  filtreGuncelle("baslangicTarihi", event.target.value);
                  filtreGuncelle("tarihSecimi", "ozel");
                }}
                className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Bitiş</span>
              <input
                type="date"
                min={yearRange.start}
                max={yearRange.end}
                value={filtreler.bitisTarihi}
                onChange={(event) => {
                  filtreGuncelle("bitisTarihi", event.target.value);
                  filtreGuncelle("tarihSecimi", "ozel");
                }}
                className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
              />
            </label>

            <label className="flex flex-col gap-1 md:col-span-2 xl:col-span-2">
              <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Arama</span>
              <input
                type="search"
                value={filtreler.arama}
                onChange={(event) => filtreGuncelle("arama", event.target.value)}
                placeholder="Ürün, cari, fiş no, açıklama..."
                className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
              />
            </label>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={filtreleriTemizle}
                className="h-10 flex-1 border border-slate-300 bg-white px-3 text-sm font-black text-slate-700 hover:bg-slate-100"
              >
                Sıfırla
              </button>
              <button
                type="button"
                onClick={raporuGoster}
                className="h-10 flex-1 bg-slate-950 px-3 text-sm font-black text-white hover:bg-slate-800"
              >
                Göster
              </button>
            </div>
          </div>

          <div className="grid gap-3 border-t border-slate-200 p-3 md:grid-cols-2 xl:grid-cols-6">
            {(raporTuru === "stok" || raporTuru === "cari" || raporTuru === "fatura" || raporTuru === "kasa") && (
              <label className="flex flex-col gap-1 xl:col-span-2">
                <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Cari</span>
                <select
                  value={filtreler.cariId}
                  onChange={(event) => filtreGuncelle("cariId", event.target.value)}
                  className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                >
                  <option value="tum">Tüm cariler</option>
                  {cariHesaplar.map((cari) => (
                    <option key={cari.id} value={cari.id}>
                      {cari.unvan}
                    </option>
                  ))}
                </select>
              </label>
            )}

            {raporTuru === "stok" && (
              <>
                <label className="flex flex-col gap-1 xl:col-span-2">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Kategori</span>
                  <select
                    value={filtreler.kategoriId}
                    onChange={(event) => filtreGuncelle("kategoriId", event.target.value)}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tum">Tüm kategoriler</option>
                    {urunKategorileri.map((kategori) => (
                      <option key={kategori.id} value={kategori.id}>
                        {kategori.kategori_adi}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Stok</span>
                  <select
                    value={filtreler.stokDurumu}
                    onChange={(event) => filtreGuncelle("stokDurumu", event.target.value as Filtreler["stokDurumu"])}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tum">Tüm ürünler</option>
                    <option value="var">Stokta olanlar</option>
                    <option value="kritik">Kritik stok</option>
                    <option value="yok">Stok yok</option>
                  </select>
                </label>
              </>
            )}

            {(raporTuru === "fatura" || raporTuru === "cari") && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Fiş Türü</span>
                  <select
                    value={filtreler.fisTuru}
                    onChange={(event) => filtreGuncelle("fisTuru", event.target.value as Filtreler["fisTuru"])}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tum">Alış + Satış</option>
                    <option value="satis">Satış</option>
                    <option value="alis">Alış</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Fiş Durumu</span>
                  <select
                    value={filtreler.fisDurumu}
                    onChange={(event) => filtreGuncelle("fisDurumu", event.target.value as Filtreler["fisDurumu"])}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="aktif">Aktif</option>
                    <option value="iptal">İptal</option>
                    <option value="tum">Tümü</option>
                  </select>
                </label>
              </>
            )}

            {raporTuru === "kasa" && (
              <>
                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Kasa</span>
                  <select
                    value={filtreler.kasaHesapId}
                    onChange={(event) => filtreGuncelle("kasaHesapId", event.target.value)}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tum">Tüm kasalar</option>
                    {kasaHesaplari.map((hesap) => (
                      <option key={hesap.id} value={hesap.id}>
                        {hesap.hesap_adi}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Yön</span>
                  <select
                    value={filtreler.kasaYon}
                    onChange={(event) => filtreGuncelle("kasaYon", event.target.value as Filtreler["kasaYon"])}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tum">Tümü</option>
                    <option value="giris">Gelen</option>
                    <option value="cikis">Giden</option>
                    <option value="duzeltme">Düzeltme</option>
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Hareket</span>
                  <select
                    value={filtreler.kasaHareketTuru}
                    onChange={(event) => filtreGuncelle("kasaHareketTuru", event.target.value as Filtreler["kasaHareketTuru"])}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tum">Tüm hareketler</option>
                    {Object.entries(kasaHareketEtiketleri).map(([key, label]) => (
                      <option key={key} value={key}>
                        {label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="flex flex-col gap-1">
                  <span className="text-[11px] font-black uppercase tracking-wide text-slate-400">Durum</span>
                  <select
                    value={filtreler.kasaDurumu}
                    onChange={(event) => filtreGuncelle("kasaDurumu", event.target.value as Filtreler["kasaDurumu"])}
                    className="h-10 border border-slate-300 bg-white px-3 text-sm font-bold outline-none focus:border-slate-900"
                  >
                    <option value="tamamlandi">Tamamlandı</option>
                    <option value="taslak">Taslak</option>
                    <option value="iptal">İptal</option>
                    <option value="tum">Tümü</option>
                  </select>
                </label>
              </>
            )}
          </div>
        </section>

        {!raporHazir ? (
          <section className="mt-4 border border-slate-200 bg-white px-6 py-8 text-center print:hidden">
            <p className="text-base font-black text-slate-950">Rapor seçimi hazır</p>
            <p className="mt-1 text-sm font-bold text-slate-500">Rapor türünü ve filtreleri seçip Göster butonuna bas.</p>
          </section>
        ) : (
          <section className="mt-4 space-y-4">
            {renderOzetSatiri()}

            <div className="border border-slate-200 bg-white">
              <div className="flex flex-col gap-2 border-b border-slate-200 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">{seciliDonemEtiketi}</p>
                  <h2 className="mt-1 text-lg font-black text-slate-950">
                    {raporTuru === "stok" ? "Stok raporu" : raporTuru === "cari" ? "Cari raporu" : raporTuru === "kasa" ? "Kasa raporu" : "Fiş / fatura raporu"}
                  </h2>
                </div>
                <p className="text-sm font-black text-slate-500">{raporKayitSayisi()}</p>
              </div>

              <div className="p-3">
                {raporTuru === "stok" && renderStokRaporu()}
                {raporTuru === "cari" && renderCariRaporu()}
                {raporTuru === "kasa" && renderKasaRaporu()}
                {raporTuru === "fatura" && renderFaturaRaporu()}
              </div>
            </div>
          </section>
        )}
      </div>
    </main>
  );

  function raporKayitSayisi() {
    if (raporTuru === "stok") return `${formatNumber(stokRaporSatirlari.length)} ürün`;
    if (raporTuru === "cari") return `${formatNumber(cariRaporSatirlari.length)} cari`;
    if (raporTuru === "kasa") return `${formatNumber(filtreliKasaHareketleri.length)} hareket`;
    return `${formatNumber(faturaRaporSatirlari.length)} fiş`;
  }

  function renderOzetSatiri() {
    if (raporTuru === "stok") {
      return (
        <OzetSatiri
          items={[
            ["Ürün", formatNumber(stokOzet.urunSayisi), "Listelenen"],
            ["Mevcut stok", formatNumber(stokOzet.mevcutStok), "Toplam miktar"],
            ["Kritik", formatNumber(stokOzet.kritikSayisi), "Kritik / yok"],
            ["Stok değeri", formatMoney(stokOzet.stokDegeri), "Maliyet bazlı"],
          ]}
        />
      );
    }

    if (raporTuru === "cari") {
      return (
        <OzetSatiri
          items={[
            ["Cari", formatNumber(cariRaporOzet.cariSayisi), "Listelenen"],
            ["Satış", formatMoney(cariRaporOzet.satisToplam), "Fiş toplamı"],
            ["Alış", formatMoney(cariRaporOzet.alisToplam), "Fiş toplamı"],
            ["Kasa net", formatMoney(cariRaporOzet.tahsilatToplam - cariRaporOzet.odemeToplam), "Tahsilat - ödeme"],
          ]}
        />
      );
    }

    if (raporTuru === "kasa") {
      return (
        <OzetSatiri
          items={[
            ["Gelen", formatMoney(kasaOzet.gelen), "Giriş hareketleri"],
            ["Giden", formatMoney(kasaOzet.giden), "Çıkış hareketleri"],
            ["Net", formatMoney(kasaOzet.net), "Gelen - giden"],
            ["Hareket", formatNumber(kasaOzet.hareketSayisi), "Listelenen"],
          ]}
        />
      );
    }

    return (
      <OzetSatiri
        items={[
          ["Satış", formatMoney(faturaOzet.satisToplam), "Aktif fiş"],
          ["Alış", formatMoney(faturaOzet.alisToplam), "Aktif fiş"],
          ["Net", formatMoney(faturaOzet.net), "Satış - alış"],
          ["Fiş", formatNumber(faturaOzet.fisSayisi), `${formatNumber(faturaOzet.kalemSayisi)} kalem`],
        ]}
      />
    );
  }

  function renderStokRaporu() {
    return (
      <div className="space-y-3">
        <RaporTablo
          headers={["Ürün", "Kategori", "Mevcut", "Kritik", "Alınan", "Satılan", "Satış Tutarı", "Stok Değeri", "Durum"]}
          minWidth="1040px"
        >
          {stokRaporSatirlari.length === 0 ? (
            <TabloBos colSpan={9} mesaj="Seçilen filtrelere göre ürün bulunamadı." />
          ) : (
            stokRaporSatirlari.map((satir) => {
              const aktif = seciliUrunId === satir.urun.id;
              return (
                <tr
                  key={satir.urun.id}
                  onClick={() => setSeciliUrunId(aktif ? null : satir.urun.id)}
                  className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${aktif ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
                >
                  <td className="px-3 py-2 align-top">
                    <p className="text-sm font-black text-slate-950">{satir.urun.urun_adi}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500">{satir.urun.urun_kodu}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-sm font-bold text-slate-700">{satir.kategoriAdi}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatNumber(satir.urun.mevcut_stok)} {satir.urun.birim}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatNumber(satir.urun.kritik_stok)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatNumber(satir.alinanMiktar)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatNumber(satir.satilanMiktar)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatMoney(satir.satisTutari)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatMoney(satir.stokDegeri)}</td>
                  <td className="px-3 py-2 align-top">
                    {satir.stokDurumu === "Stok Yok"
                      ? durumRozeti("Stok Yok", "red")
                      : satir.stokDurumu === "Kritik"
                        ? durumRozeti("Kritik", "amber")
                        : durumRozeti("Yeterli", "green")}
                  </td>
                </tr>
              );
            })
          )}
        </RaporTablo>

        {seciliUrun ? (
          <DetayPanel title={seciliUrun.urun_adi} subtitle={`${seciliUrun.urun_kodu} · ${seciliUrun.birim}`}>
            <BilgiTablosu
              rows={[
                ["Mevcut stok", `${formatNumber(seciliUrun.mevcut_stok)} ${seciliUrun.birim}`],
                ["Kritik stok", formatNumber(seciliUrun.kritik_stok)],
                ["Alış fiyatı", formatMoney(seciliUrun.alis_fiyati)],
                ["Satış fiyatı", formatMoney(seciliUrun.satis_fiyati)],
                ["Maliyet", formatMoney(seciliUrun.maliyet_fiyati || seciliUrun.alis_fiyati)],
                ["KDV", `%${formatNumber(seciliUrun.kdv_orani)}`],
              ]}
            />

            <div className="mt-3 grid gap-3 xl:grid-cols-2">
              <DetayBlok title="Satış / alış geçmişi">
                <MiniTablo headers={["Tarih", "Fiş", "İşlem", "Cari", "Miktar", "Tutar"]} minWidth="720px">
                  {seciliUrunFisHareketleri.length === 0 ? (
                    <TabloBos colSpan={6} mesaj="Bu dönemde fiş hareketi yok." />
                  ) : (
                    seciliUrunFisHareketleri.map(({ kalem, fis, cari }) => (
                      <tr key={kalem.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 text-xs font-bold">{formatShortDate(fis?.fis_tarihi)}</td>
                        <td className="px-3 py-2 text-xs font-black">{fis?.fis_no || "-"}</td>
                        <td className="px-3 py-2 text-xs font-bold">{fis?.fis_turu === "satis" ? "Satış" : "Alış"}</td>
                        <td className="px-3 py-2 text-xs font-bold">{cari?.unvan || "Cari bulunamadı"}</td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatNumber(kalem.miktar)} {kalem.birim}</td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatMoney(kalem.satir_toplami)}</td>
                      </tr>
                    ))
                  )}
                </MiniTablo>
              </DetayBlok>

              <DetayBlok title="Stok hareketleri">
                <MiniTablo headers={["Tarih", "Tür", "Miktar", "Maliyet", "Belge"]} minWidth="620px">
                  {seciliUrunStokHareketleri.length === 0 ? (
                    <TabloBos colSpan={5} mesaj="Stok hareket kaydı yok." />
                  ) : (
                    seciliUrunStokHareketleri.map((hareket) => (
                      <tr key={hareket.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 text-xs font-bold">{formatShortDate(hareket.hareket_tarihi)}</td>
                        <td className="px-3 py-2 text-xs font-black">
                          {hareket.hareket_turu === "giris" ? "Giriş" : hareket.hareket_turu === "cikis" ? "Çıkış" : "Düzeltme"}
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatNumber(hareket.miktar)} {seciliUrun.birim}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{formatMoney(hareket.birim_maliyet)}</td>
                        <td className="px-3 py-2 text-xs font-bold">{hareket.belge_no || "-"}</td>
                      </tr>
                    ))
                  )}
                </MiniTablo>
              </DetayBlok>
            </div>
          </DetayPanel>
        ) : null}
      </div>
    );
  }

  function renderCariRaporu() {
    return (
      <div className="space-y-3">
        <RaporTablo
          headers={["Cari", "Tür", "Satış", "Alış", "Satılan", "Alınan", "Tahsilat", "Ödeme", "Bakiye", "Son İşlem"]}
          minWidth="1120px"
        >
          {cariRaporSatirlari.length === 0 ? (
            <TabloBos colSpan={10} mesaj="Seçilen filtrelere göre cari hareketi bulunamadı." />
          ) : (
            cariRaporSatirlari.map((satir) => {
              const aktif = seciliCariId === satir.cari.id;
              return (
                <tr
                  key={satir.cari.id}
                  onClick={() => setSeciliCariId(aktif ? null : satir.cari.id)}
                  className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${aktif ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
                >
                  <td className="px-3 py-2 align-top">
                    <p className="text-sm font-black text-slate-950">{satir.cari.unvan}</p>
                    <p className="mt-0.5 text-xs font-bold text-slate-500">{satir.cari.cari_kodu}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-sm font-bold text-slate-700">
                    {satir.cari.cari_turu === "musteri" ? "Müşteri" : satir.cari.cari_turu === "tedarikci" ? "Tedarikçi" : "Müşteri / Tedarikçi"}
                  </td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatMoney(satir.satisToplam)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatMoney(satir.alisToplam)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatNumber(satir.satilanMiktar)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatNumber(satir.alinanMiktar)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold text-emerald-700">{formatMoney(satir.tahsilatToplam)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold text-red-700">{formatMoney(satir.odemeToplam)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatMoney(satir.cari.bakiye)}</td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{formatShortDate(satir.sonIslemTarihi)}</td>
                </tr>
              );
            })
          )}
        </RaporTablo>

        {seciliCari ? (
          <DetayPanel title={seciliCari.unvan} subtitle={`${seciliCari.cari_kodu} · Güncel bakiye: ${formatMoney(seciliCari.bakiye)}`}>
            <div className="grid gap-3 xl:grid-cols-3">
              <DetayBlok title="Ürün özeti">
                <MiniTablo headers={["Ürün", "Satılan", "Alınan", "Satış", "Alış"]} minWidth="680px">
                  {seciliCariUrunOzetleri.length === 0 ? (
                    <TabloBos colSpan={5} mesaj="Bu cariye ait ürün hareketi yok." />
                  ) : (
                    seciliCariUrunOzetleri.map((item) => (
                      <tr key={`${item.urunKodu}-${item.urunAdi}`} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2">
                          <p className="text-xs font-black">{item.urunAdi}</p>
                          <p className="text-[11px] font-bold text-slate-500">{item.urunKodu}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatNumber(item.satilanMiktar)} {item.birim}</td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatNumber(item.alinanMiktar)} {item.birim}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{formatMoney(item.satisToplam)}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{formatMoney(item.alisToplam)}</td>
                      </tr>
                    ))
                  )}
                </MiniTablo>
              </DetayBlok>

              <DetayBlok title="Fiş hareketleri">
                <MiniTablo headers={["Tarih", "Fiş", "Tür", "Toplam"]} minWidth="540px">
                  {seciliCariFisleri.length === 0 ? (
                    <TabloBos colSpan={4} mesaj="Fiş hareketi yok." />
                  ) : (
                    seciliCariFisleri.map((fis) => (
                      <tr key={fis.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 text-xs font-bold">{formatShortDate(fis.fis_tarihi)}</td>
                        <td className="px-3 py-2 text-xs font-black">{fis.fis_no}</td>
                        <td className="px-3 py-2 text-xs font-bold">{fisTuruEtiketleri[fis.fis_turu]}</td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatMoney(fis.genel_toplam)}</td>
                      </tr>
                    ))
                  )}
                </MiniTablo>
              </DetayBlok>

              <DetayBlok title="Kasa hareketleri">
                <MiniTablo headers={["Tarih", "Hareket", "Kasa", "Tutar"]} minWidth="540px">
                  {seciliCariKasaHareketleri.length === 0 ? (
                    <TabloBos colSpan={4} mesaj="Kasa hareketi yok." />
                  ) : (
                    seciliCariKasaHareketleri.map((hareket) => (
                      <tr key={hareket.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2 text-xs font-bold">{formatShortDate(hareket.islem_tarihi)}</td>
                        <td className="px-3 py-2 text-xs font-black">{kasaHareketEtiketleri[hareket.hareket_turu]}</td>
                        <td className="px-3 py-2 text-xs font-bold">{kasaHesapMap.get(hareket.kasa_hesap_id)?.hesap_adi || "-"}</td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatMoney(hareket.tutar)}</td>
                      </tr>
                    ))
                  )}
                </MiniTablo>
              </DetayBlok>
            </div>
          </DetayPanel>
        ) : null}
      </div>
    );
  }

  function renderKasaRaporu() {
    return (
      <div className="space-y-3">
        <RaporTablo headers={["Tarih", "Hareket", "Yön", "Kasa", "Cari", "Kategori", "Belge", "Tutar", "Durum"]} minWidth="1080px">
          {filtreliKasaHareketleri.length === 0 ? (
            <TabloBos colSpan={9} mesaj="Seçilen filtrelere göre kasa hareketi bulunamadı." />
          ) : (
            filtreliKasaHareketleri.map((hareket) => {
              const kasa = kasaHesapMap.get(hareket.kasa_hesap_id);
              const cari = hareket.cari_id ? cariMap.get(hareket.cari_id) : null;
              const kategori = hareket.kategori_id ? gelirGiderKategoriMap.get(hareket.kategori_id) : null;
              const yon = kasaYon(hareket.hareket_turu);
              const aktif = seciliKasaHareketId === hareket.id;

              return (
                <tr
                  key={hareket.id}
                  onClick={() => setSeciliKasaHareketId(aktif ? null : hareket.id)}
                  className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${aktif ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
                >
                  <td className="px-3 py-2 align-top text-sm font-black">{formatShortDate(hareket.islem_tarihi)}</td>
                  <td className="px-3 py-2 align-top">
                    <p className="text-sm font-black">{kasaHareketEtiketleri[hareket.hareket_turu]}</p>
                    <p className="mt-0.5 max-w-[280px] truncate text-xs font-bold text-slate-500">{hareket.aciklama || "Açıklama yok"}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{yon === "giris" ? "Giriş" : yon === "cikis" ? "Çıkış" : "Düzeltme"}</td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{kasa?.hesap_adi || "Kasa bulunamadı"}</td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{cari?.unvan || "-"}</td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{kategori?.kategori_adi || "-"}</td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{hareket.tahsilat_fis_no || "-"}</td>
                  <td className={`px-3 py-2 text-right align-top text-sm font-black ${yon === "giris" ? "text-emerald-700" : yon === "cikis" ? "text-red-700" : ""}`}>
                    {yon === "giris" ? "+" : yon === "cikis" ? "-" : ""}{formatMoney(hareket.tutar)}
                  </td>
                  <td className="px-3 py-2 align-top">
                    {hareket.durum === "tamamlandi" ? durumRozeti("Tamamlandı", "green") : hareket.durum === "iptal" ? durumRozeti("İptal", "red") : durumRozeti("Taslak", "slate")}
                  </td>
                </tr>
              );
            })
          )}
        </RaporTablo>

        {seciliKasaHareketi ? (
          <DetayPanel title={kasaHareketEtiketleri[seciliKasaHareketi.hareket_turu]} subtitle={seciliKasaHareketi.aciklama || "Açıklama yok"}>
            <BilgiTablosu
              rows={[
                ["Tarih", formatShortDate(seciliKasaHareketi.islem_tarihi)],
                ["Tutar", formatMoney(seciliKasaHareketi.tutar)],
                ["Kasa", kasaHesapMap.get(seciliKasaHareketi.kasa_hesap_id)?.hesap_adi || "-"],
                ["Cari", seciliKasaHareketi.cari_id ? cariMap.get(seciliKasaHareketi.cari_id)?.unvan || "-" : "-"],
                ["Kategori", seciliKasaHareketi.kategori_id ? gelirGiderKategoriMap.get(seciliKasaHareketi.kategori_id)?.kategori_adi || "-" : "-"],
                ["Fiş no", seciliKasaHareketi.tahsilat_fis_no || "-"],
                ["Önceki bakiye", formatMoney(seciliKasaHareketi.cari_bakiye_once)],
                ["Son bakiye", formatMoney(seciliKasaHareketi.cari_bakiye_sonra)],
              ]}
            />
          </DetayPanel>
        ) : null}
      </div>
    );
  }

  function renderFaturaRaporu() {
    return (
      <div className="space-y-3">
        <RaporTablo
          headers={["Tarih", "Fiş No", "Tür", "Cari", "Kalem", "Miktar", "Ara Toplam", "KDV", "Genel Toplam", "Durum"]}
          minWidth="1120px"
        >
          {faturaRaporSatirlari.length === 0 ? (
            <TabloBos colSpan={10} mesaj="Seçilen filtrelere göre fiş bulunamadı." />
          ) : (
            faturaRaporSatirlari.map((satir) => {
              const aktif = seciliFisId === satir.fis.id;
              return (
                <tr
                  key={satir.fis.id}
                  onClick={() => setSeciliFisId(aktif ? null : satir.fis.id)}
                  className={`cursor-pointer border-b border-slate-100 last:border-b-0 ${aktif ? "bg-slate-100" : "bg-white hover:bg-slate-50"}`}
                >
                  <td className="px-3 py-2 align-top text-sm font-black">{formatShortDate(satir.fis.fis_tarihi)}</td>
                  <td className="px-3 py-2 align-top">
                    <p className="text-sm font-black">{satir.fis.fis_no}</p>
                    <p className="mt-0.5 max-w-[240px] truncate text-xs font-bold text-slate-500">{satir.fis.aciklama || "-"}</p>
                  </td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{fisTuruEtiketleri[satir.fis.fis_turu]}</td>
                  <td className="px-3 py-2 align-top text-sm font-bold">{satir.cari?.unvan || "Cari bulunamadı"}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatNumber(satir.kalemSayisi)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatNumber(satir.toplamMiktar)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatMoney(satir.fis.ara_toplam)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-bold">{formatMoney(satir.fis.kdv_toplam)}</td>
                  <td className="px-3 py-2 text-right align-top text-sm font-black">{formatMoney(satir.fis.genel_toplam)}</td>
                  <td className="px-3 py-2 align-top">{satir.fis.durum === "aktif" ? durumRozeti("Aktif", "green") : durumRozeti("İptal", "red")}</td>
                </tr>
              );
            })
          )}
        </RaporTablo>

        {seciliFis ? (
          <DetayPanel title={seciliFis.fis_no} subtitle={`${cariMap.get(seciliFis.cari_id)?.unvan || "Cari bulunamadı"} · ${fisTuruEtiketleri[seciliFis.fis_turu]}`}>
            <BilgiTablosu
              rows={[
                ["Tarih", formatShortDate(seciliFis.fis_tarihi)],
                ["Durum", seciliFis.durum === "aktif" ? "Aktif" : "İptal"],
                ["Ara toplam", formatMoney(seciliFis.ara_toplam)],
                ["KDV", formatMoney(seciliFis.kdv_toplam)],
                ["Genel toplam", formatMoney(seciliFis.genel_toplam)],
                ["Kalem", formatNumber(seciliFisKalemleri.length)],
                ["Bakiye önce", formatMoney(seciliFis.cari_bakiye_once)],
                ["Bakiye sonra", formatMoney(seciliFis.cari_bakiye_sonra)],
              ]}
            />

            <div className="mt-3">
              <DetayBlok title="Ürün kalemleri">
                <MiniTablo headers={["Ürün", "Miktar", "Birim Fiyat", "Ara", "KDV", "Toplam"]} minWidth="760px">
                  {seciliFisKalemleri.length === 0 ? (
                    <TabloBos colSpan={6} mesaj="Bu fişte ürün kalemi yok." />
                  ) : (
                    seciliFisKalemleri.map((kalem) => (
                      <tr key={kalem.id} className="border-b border-slate-100 last:border-b-0">
                        <td className="px-3 py-2">
                          <p className="text-xs font-black text-slate-950">{kalem.urun_adi}</p>
                          <p className="mt-0.5 text-[11px] font-bold text-slate-500">{kalem.urun_kodu}</p>
                        </td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatNumber(kalem.miktar)} {kalem.birim}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{formatMoney(kalem.birim_fiyat)}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">{formatMoney(kalem.ara_toplam)}</td>
                        <td className="px-3 py-2 text-right text-xs font-bold">%{formatNumber(kalem.kdv_orani)} · {formatMoney(kalem.kdv_tutari)}</td>
                        <td className="px-3 py-2 text-right text-xs font-black">{formatMoney(kalem.satir_toplami)}</td>
                      </tr>
                    ))
                  )}
                </MiniTablo>
              </DetayBlok>
            </div>
          </DetayPanel>
        ) : null}
      </div>
    );
  }
}


function OzetSatiri({ items }: { items: Array<[string, string, string]> }) {
  return (
    <div className="grid border border-slate-200 bg-white md:grid-cols-4 print:grid-cols-4">
      {items.map(([label, value, note], index) => (
        <div key={`${label}-${index}`} className="border-b border-slate-200 px-4 py-3 last:border-b-0 md:border-b-0 md:border-r md:last:border-r-0">
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">{label}</p>
          <p className="mt-1 text-xl font-black text-slate-950">{value}</p>
          <p className="mt-0.5 text-xs font-bold text-slate-500">{note}</p>
        </div>
      ))}
    </div>
  );
}

function RaporTablo({
  headers,
  children,
  minWidth = "980px",
}: {
  headers: string[];
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead className="bg-slate-100">
            <tr>
              {headers.map((header) => (
                <th key={header} className="border-b border-slate-200 px-3 py-2 text-left text-[11px] font-black uppercase tracking-wide text-slate-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function MiniTablo({
  headers,
  children,
  minWidth = "520px",
}: {
  headers: string[];
  children: ReactNode;
  minWidth?: string;
}) {
  return (
    <div className="overflow-hidden border border-slate-200 bg-white">
      <div className="max-h-[360px] overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth }}>
          <thead className="sticky top-0 z-10 bg-slate-100">
            <tr>
              {headers.map((header) => (
                <th key={header} className="border-b border-slate-200 px-3 py-2 text-left text-[10px] font-black uppercase tracking-wide text-slate-600">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>{children}</tbody>
        </table>
      </div>
    </div>
  );
}

function TabloBos({ colSpan, mesaj }: { colSpan: number; mesaj: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="bg-white px-4 py-8 text-center text-sm font-bold text-slate-500">
        {mesaj}
      </td>
    </tr>
  );
}

function DetayPanel({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <section className="border border-slate-200 bg-slate-50 p-3">
      <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Seçili kayıt detayı</p>
          <h3 className="mt-1 text-base font-black text-slate-950">{title}</h3>
          <p className="mt-0.5 text-sm font-bold text-slate-500">{subtitle}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function DetayBlok({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="border border-slate-200 bg-white p-3">
      <p className="mb-2 text-sm font-black text-slate-950">{title}</p>
      {children}
    </div>
  );
}

function BilgiTablosu({ rows }: { rows: Array<[string, string]> }) {
  return (
    <div className="grid border border-slate-200 bg-white sm:grid-cols-2 lg:grid-cols-4">
      {rows.map(([label, value], index) => (
        <div key={`${label}-${index}`} className="border-b border-slate-200 px-3 py-2 last:border-b-0 sm:border-r sm:last:border-r-0 lg:[&:nth-child(4n)]:border-r-0">
          <p className="text-[10px] font-black uppercase tracking-wide text-slate-400">{label}</p>
          <p className="mt-0.5 break-words text-sm font-black text-slate-950">{value}</p>
        </div>
      ))}
    </div>
  );
}
