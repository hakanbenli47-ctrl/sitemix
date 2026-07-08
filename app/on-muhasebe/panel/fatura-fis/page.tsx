"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { getOnMuhasebeClientContext } from "@/lib/onMuhasebe/client";
import {
  getBrowserWorkYear,
  monthStartForWorkYear,
  todayForWorkYear,
  workYearDateRange,
} from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

type Company = {
  id: string;
  company_code: string;
  name: string;
};

type FisTuru = "satis" | "alis";
type CariTuru = "musteri" | "tedarikci" | "musteri_tedarikci";
type UrunTipi = "urun" | "hizmet";

type CariHesap = {
  id: string;
  company_id: string;
  cari_kodu: string;
  cari_turu: CariTuru;
  unvan: string;
  telefon: string | null;
  bakiye: number;
  aktif: boolean;
};

type Urun = {
  id: string;
  company_id: string;
  urun_kodu: string;
  urun_adi: string;
  urun_tipi: UrunTipi;
  birim: string;
  kdv_orani: number;
  alis_fiyati: number;
  satis_fiyati: number;
  maliyet_fiyati: number;
  mevcut_stok: number;
  para_birimi: string;
  aktif: boolean;
};

type FisSatiri = {
  satir_id: string;
  urun_id: string;
  miktar: string;
  birim_fiyat: string;
  kdv_orani: string;
  aciklama: string;
};

type FisForm = {
  fis_turu: FisTuru;
  cari_id: string;
  fis_tarihi: string;
  aciklama: string;
};

type KayitliFisKalemi = {
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
};

type KayitliFis = {
  id: string;
  company_id: string;
  cari_id: string;
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
  durum: "aktif" | "iptal";
  created_at: string;
  cari?: {
    cari_kodu: string;
    unvan: string;
    telefon: string | null;
  } | null;
  kalemler?: KayitliFisKalemi[];
};

type RpcFisSonucu = {
  id: string;
  fis_no: string;
  fis_turu: FisTuru;
  cari_bakiye_once: number;
  cari_bakiye_sonra: number;
  genel_toplam: number;
  tahsilat_tutari: number;
};

type FisIstatistikSatiri = {
  fis_turu: FisTuru;
  fis_tarihi: string;
  genel_toplam: number;
};

type DonemIstatistigi = {
  satis: number;
  alis: number;
  net: number;
};

const fisEtiketleri: Record<FisTuru, string> = {
  satis: "Satış Fişi",
  alis: "Alış Fişi",
};

const whatsappDestekLink =
  "https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20fatura%20fi%C5%9F%20olu%C5%9Fturma%20i%C3%A7in%20destek%20istiyorum.";

const fisKisaAciklama: Record<FisTuru, string> = {
  satis: "Müşteriye satış kaydı oluşturur. Ürün stoğu düşer, cari borcu artar.",
  alis: "Tedarikçiden alış kaydı oluşturur. Ürün stoğu artar, firmaya ödenecek bakiye artar.",
};

function tarihiYaz(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function bugununTarihi(workYear = new Date().getFullYear()) {
  return todayForWorkYear(workYear);
}

function ayBaslangici(workYear = new Date().getFullYear()) {
  return monthStartForWorkYear(workYear);
}

function yilBaslangici(workYear = new Date().getFullYear()) {
  return workYearDateRange(workYear).start;
}

function donemAraliklari(workYear = new Date().getFullYear()) {
  const bugun = bugununTarihi(workYear);
  const ayIlkGun = ayBaslangici(workYear);
  const yilIlkGun = yilBaslangici(workYear);

  return {
    gun: {
      baslangic: bugun,
      bitis: bugun,
      etiket: tarihFormatla(bugun),
    },
    ay: {
      baslangic: ayIlkGun,
      bitis: bugun,
      etiket: `${tarihFormatla(ayIlkGun)} - ${tarihFormatla(bugun)}`,
    },
    yil: {
      baslangic: yilIlkGun,
      bitis: bugun,
      etiket: `${tarihFormatla(yilIlkGun)} - ${tarihFormatla(bugun)}`,
    },
  };
}

const bosForm: FisForm = {
  fis_turu: "satis",
  cari_id: "",
  fis_tarihi: bugununTarihi(),
  aciklama: "",
};

function yeniSatir(): FisSatiri {
  return {
    satir_id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    urun_id: "",
    miktar: "1",
    birim_fiyat: "0",
    kdv_orani: "20",
    aciklama: "",
  };
}

function sayiyaCevir(value: string | number | null | undefined) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? value : 0;
  }

  const temizDeger = String(value ?? "")
    .replace(/\./g, "")
    .replace(",", ".")
    .trim();
  const sayi = Number(temizDeger);

  if (!Number.isFinite(sayi) || sayi < 0) return 0;

  return sayi;
}

function paraGirisiTemizle(value: string) {
  return value.replace(/[^\d.,]/g, "");
}

function paraGirisiFormatla(value: string | number) {
  const sayi = sayiyaCevir(value);

  if (sayi === 0) return "0";

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(sayi);
}

function miktarGirisiTemizle(value: string) {
  return value.replace(/[^\d.,]/g, "");
}

function paraFormatla(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function miktarFormatla(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(Number.isFinite(value) ? value : 0);
}

function tarihFormatla(value: string) {
  const temizTarih = String(value || "").slice(0, 10);
  const [year, month, day] = temizTarih.split("-");

  if (!year || !month || !day) return "-";

  return `${day}.${month}.${year}`;
}

function metniAraFormatinaCevir(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9\s]/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function telefonuWhatsappFormatinaCevir(value: string | null | undefined) {
  const sadeceRakam = (value || "").replace(/\D/g, "");

  if (!sadeceRakam) return "";

  if (sadeceRakam.startsWith("90") && sadeceRakam.length === 12) return sadeceRakam;
  if (sadeceRakam.startsWith("0") && sadeceRakam.length === 11) return `90${sadeceRakam.slice(1)}`;
  if (sadeceRakam.length === 10) return `90${sadeceRakam}`;

  return sadeceRakam;
}

function htmlEscape(value: string | number | null | undefined) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\"/g, "&quot;")
    .replace(/'/g, "&#039;");
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

function cariBakiyeEtiketi(value: number) {
  if (value > 0) return "Tahsil Edilecek";
  if (value < 0) return "Ödenecek";
  return "Bakiye Kapalı";
}

function bakiyeRengi(value: number) {
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-amber-600";
  return "text-emerald-600";
}

function donemIstatistigiHesapla(fisler: FisIstatistikSatiri[], baslangic: string, bitis: string): DonemIstatistigi {
  const donemFisleri = fisler.filter((fis) => {
    const tarih = String(fis.fis_tarihi || "").slice(0, 10);
    return tarih >= baslangic && tarih <= bitis;
  });
  const satis = donemFisleri
    .filter((fis) => fis.fis_turu === "satis")
    .reduce((toplam, fis) => toplam + Number(fis.genel_toplam || 0), 0);
  const alis = donemFisleri
    .filter((fis) => fis.fis_turu === "alis")
    .reduce((toplam, fis) => toplam + Number(fis.genel_toplam || 0), 0);

  return {
    satis,
    alis,
    net: satis - alis,
  };
}

export default function FaturaFisPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [cariler, setCariler] = useState<CariHesap[]>([]);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [sonFisler, setSonFisler] = useState<KayitliFis[]>([]);
  const [istatistikFisleri, setIstatistikFisleri] = useState<FisIstatistikSatiri[]>([]);
  const [formAcik, setFormAcik] = useState(false);
  const [duzenlenenFisId, setDuzenlenenFisId] = useState<string | null>(null);
  const [workYear] = useState(getBrowserWorkYear());
  const yearRange = useMemo(() => workYearDateRange(workYear), [workYear]);
  const [form, setForm] = useState<FisForm>(() => ({
    ...bosForm,
    fis_tarihi: todayForWorkYear(getBrowserWorkYear()),
  }));
  const [satirlar, setSatirlar] = useState<FisSatiri[]>([yeniSatir()]);
  const [cariArama, setCariArama] = useState("");
  const [urunArama, setUrunArama] = useState("");
  const [listeArama, setListeArama] = useState("");
  const [listeTuru, setListeTuru] = useState<"tum" | FisTuru>("tum");
  const [sonKayitliFis, setSonKayitliFis] = useState<KayitliFis | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const donemler = useMemo(() => donemAraliklari(workYear), [workYear]);
  const duzenlemeModu = Boolean(duzenlenenFisId);

  const seciliCari = useMemo(
    () => cariler.find((cari) => cari.id === form.cari_id) || null,
    [cariler, form.cari_id],
  );

  const filtreliCariler = useMemo(() => {
    const tipeGore = cariler.filter((cari) => {
      if (form.fis_turu === "satis") {
        return cari.cari_turu === "musteri" || cari.cari_turu === "musteri_tedarikci";
      }

      return cari.cari_turu === "tedarikci" || cari.cari_turu === "musteri_tedarikci";
    });

    if (form.cari_id) return [];

    const arama = metniAraFormatinaCevir(cariArama);
    if (!arama) return tipeGore.slice(0, 8);

    const kelimeler = arama.split(" ").filter(Boolean);

    return tipeGore
      .filter((cari) => {
        const aranacakMetin = metniAraFormatinaCevir(
          `${cari.cari_kodu} ${cari.unvan} ${cari.telefon || ""}`,
        );

        return kelimeler.every((kelime) => aranacakMetin.includes(kelime));
      })
      .slice(0, 8);
  }, [cariArama, cariler, form.cari_id, form.fis_turu]);

  const filtreliUrunler = useMemo(() => {
    const aktifUrunler = urunler.filter((urun) => urun.aktif);
    const arama = metniAraFormatinaCevir(urunArama);

    if (!arama) return aktifUrunler.slice(0, 10);

    const kelimeler = arama.split(" ").filter(Boolean);

    return aktifUrunler
      .filter((urun) => {
        const aranacakMetin = metniAraFormatinaCevir(
          `${urun.urun_kodu} ${urun.urun_adi} ${urun.birim}`,
        );

        return kelimeler.every((kelime) => aranacakMetin.includes(kelime));
      })
      .slice(0, 10);
  }, [urunArama, urunler]);

  const satirHesaplari = useMemo(() => {
    return satirlar.map((satir) => {
      const urun = urunler.find((item) => item.id === satir.urun_id) || null;
      const miktar = sayiyaCevir(satir.miktar);
      const birimFiyat = sayiyaCevir(satir.birim_fiyat);
      const kdvOrani = sayiyaCevir(satir.kdv_orani);
      const araToplam = miktar * birimFiyat;
      const kdvTutari = araToplam * (kdvOrani / 100);
      const satirToplami = araToplam + kdvTutari;

      return {
        ...satir,
        urun,
        miktar,
        birimFiyat,
        kdvOrani,
        araToplam,
        kdvTutari,
        satirToplami,
      };
    });
  }, [satirlar, urunler]);

  const toplamlar = useMemo(() => {
    const araToplam = satirHesaplari.reduce((toplam, satir) => toplam + satir.araToplam, 0);
    const kdvToplam = satirHesaplari.reduce((toplam, satir) => toplam + satir.kdvTutari, 0);
    const genelToplam = satirHesaplari.reduce((toplam, satir) => toplam + satir.satirToplami, 0);
    const oncekiBakiye = Number(seciliCari?.bakiye || 0);
    const yeniBakiye = form.fis_turu === "satis" ? oncekiBakiye + genelToplam : oncekiBakiye - genelToplam;

    return {
      araToplam,
      kdvToplam,
      genelToplam,
      oncekiBakiye,
      yeniBakiye,
    };
  }, [form.fis_turu, satirHesaplari, seciliCari?.bakiye]);

  const istatistikler = useMemo(() => {
    return {
      bugun: donemIstatistigiHesapla(istatistikFisleri, donemler.gun.baslangic, donemler.gun.bitis),
      ay: donemIstatistigiHesapla(istatistikFisleri, donemler.ay.baslangic, donemler.ay.bitis),
      yil: donemIstatistigiHesapla(istatistikFisleri, donemler.yil.baslangic, donemler.yil.bitis),
    };
  }, [donemler, istatistikFisleri]);

  const listeFisleri = useMemo(() => {
    const arama = metniAraFormatinaCevir(listeArama);

    return sonFisler.filter((fis) => {
      if (listeTuru !== "tum" && fis.fis_turu !== listeTuru) return false;
      if (!arama) return true;

      const aranacakMetin = metniAraFormatinaCevir(
        `${fis.fis_no} ${fis.cari?.unvan || ""} ${fis.cari?.cari_kodu || ""} ${fis.fis_tarihi}`,
      );

      return arama.split(" ").filter(Boolean).every((kelime) => aranacakMetin.includes(kelime));
    });
  }, [listeArama, listeTuru, sonFisler]);

  const verileriYukle = useCallback(async (mesajlariTemizle = true, tamEkranYukleme = true) => {
    if (tamEkranYukleme) setIsLoading(true);
    setErrorMessage("");

    if (mesajlariTemizle) setSuccessMessage("");

    try {
      const context = await getOnMuhasebeClientContext();
      const companyData = context.company;

      setCompany(companyData as Company);

      const [cariResponse, urunResponse, fisResponse, istatistikResponse] = await Promise.all([
        supabaseClient
          .from("cari_hesaplar")
          .select("id, company_id, cari_kodu, cari_turu, unvan, telefon, bakiye, aktif")
          .eq("company_id", companyData.id)
          .eq("aktif", true)
          .is("deleted_at", null)
          .order("unvan", { ascending: true }),
        supabaseClient
          .from("urunler")
          .select(
            "id, company_id, urun_kodu, urun_adi, urun_tipi, birim, kdv_orani, alis_fiyati, satis_fiyati, maliyet_fiyati, mevcut_stok, para_birimi, aktif",
          )
          .eq("company_id", companyData.id)
          .eq("aktif", true)
          .is("deleted_at", null)
          .order("urun_adi", { ascending: true }),
        supabaseClient
          .from("fatura_fisleri")
          .select(
            "id, company_id, cari_id, fis_no, fis_turu, fis_tarihi, ara_toplam, kdv_toplam, genel_toplam, tahsilat_tutari, cari_bakiye_once, cari_bakiye_sonra, aciklama, durum, created_at, cari_hesaplar(cari_kodu, unvan, telefon)",
          )
          .eq("company_id", companyData.id)
          .gte("fis_tarihi", yearRange.start)
          .lte("fis_tarihi", yearRange.end)
          .order("fis_tarihi", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(50),
        supabaseClient
          .from("fatura_fisleri")
          .select("fis_turu, fis_tarihi, genel_toplam")
          .eq("company_id", companyData.id)
          .eq("durum", "aktif")
          .gte("fis_tarihi", donemler.yil.baslangic)
          .lte("fis_tarihi", donemler.yil.bitis)
          .order("fis_tarihi", { ascending: false })
          .limit(5000),
      ]);

      if (cariResponse.error) throw new Error(hataMesajiAl(cariResponse.error, "Cariler alınamadı."));
      if (urunResponse.error) throw new Error(hataMesajiAl(urunResponse.error, "Ürünler alınamadı."));
      if (fisResponse.error) throw new Error(hataMesajiAl(fisResponse.error, "Fiş listesi alınamadı."));
      if (istatistikResponse.error) {
        throw new Error(hataMesajiAl(istatistikResponse.error, "Fiş istatistikleri alınamadı."));
      }

      setCariler((cariResponse.data || []) as CariHesap[]);
      setUrunler((urunResponse.data || []) as Urun[]);
      setIstatistikFisleri((istatistikResponse.data || []) as FisIstatistikSatiri[]);
      setSonFisler(
        ((fisResponse.data || []) as (Omit<KayitliFis, "cari"> & {
          cari_hesaplar?: KayitliFis["cari"] | KayitliFis["cari"][];
        })[]).map((fis) => ({
          ...fis,
          cari: Array.isArray(fis.cari_hesaplar) ? fis.cari_hesaplar[0] || null : fis.cari_hesaplar || null,
        })),
      );
    } catch (error) {
      console.error("Fiş ekranı yükleme hatası:", error);
      setErrorMessage(hataMesajiAl(error, "Fiş ekranı yüklenirken hata oluştu."));
    } finally {
      if (tamEkranYukleme) setIsLoading(false);
    }
  }, [donemler.yil.baslangic, donemler.yil.bitis]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);

  function formGuncelle<K extends keyof FisForm>(key: K, value: FisForm[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function fisOlusturmaAc(fisTuru: FisTuru) {
    setDuzenlenenFisId(null);
    setForm({
      ...bosForm,
      fis_turu: fisTuru,
      fis_tarihi: bugununTarihi(workYear),
    });
    setSatirlar([yeniSatir()]);
    setCariArama("");
    setUrunArama("");
    setErrorMessage("");
    setSuccessMessage("");
    setFormAcik(true);
  }

  function formuKapat() {
    setDuzenlenenFisId(null);
    setForm({ ...bosForm, fis_tarihi: bugununTarihi(workYear) });
    setSatirlar([yeniSatir()]);
    setCariArama("");
    setUrunArama("");
    setErrorMessage("");
    setFormAcik(false);
  }

  function fisTuruSec(fisTuru: FisTuru) {
    setForm((current) => ({
      ...current,
      fis_turu: fisTuru,
      cari_id: "",
    }));
    setCariArama("");
    setErrorMessage("");

    setSatirlar((current) =>
      current.map((satir) => {
        const urun = urunler.find((item) => item.id === satir.urun_id);
        if (!urun) return satir;

        const fiyat = fisTuru === "satis" ? urun.satis_fiyati : urun.alis_fiyati;

        return {
          ...satir,
          birim_fiyat: paraGirisiFormatla(String(fiyat || 0)),
        };
      }),
    );
  }

  function cariSec(cari: CariHesap) {
    formGuncelle("cari_id", cari.id);
    setCariArama("");
    setErrorMessage("");
  }

  function cariSecimiTemizle() {
    formGuncelle("cari_id", "");
    setCariArama("");
  }

  function satirGuncelle<K extends keyof FisSatiri>(satirId: string, key: K, value: FisSatiri[K]) {
    setSatirlar((current) =>
      current.map((satir) => (satir.satir_id === satirId ? { ...satir, [key]: value } : satir)),
    );
  }

  function urunSatiraEkle(urun: Urun) {
    const bosSatir = satirlar.find((satir) => !satir.urun_id);
    const fiyat = form.fis_turu === "satis" ? urun.satis_fiyati : urun.alis_fiyati;

    if (bosSatir) {
      setSatirlar((current) =>
        current.map((satir) =>
          satir.satir_id === bosSatir.satir_id
            ? {
                ...satir,
                urun_id: urun.id,
                miktar: satir.miktar || "1",
                birim_fiyat: paraGirisiFormatla(String(fiyat || 0)),
                kdv_orani: String(urun.kdv_orani || 0),
              }
            : satir,
        ),
      );
    } else {
      setSatirlar((current) => [
        ...current,
        {
          ...yeniSatir(),
          urun_id: urun.id,
          birim_fiyat: paraGirisiFormatla(String(fiyat || 0)),
          kdv_orani: String(urun.kdv_orani || 0),
        },
      ]);
    }

    setUrunArama("");
    setErrorMessage("");
  }

  function satirEkle() {
    setSatirlar((current) => [...current, yeniSatir()]);
  }

  function satirSil(satirId: string) {
    setSatirlar((current) => {
      const kalanlar = current.filter((satir) => satir.satir_id !== satirId);
      return kalanlar.length > 0 ? kalanlar : [yeniSatir()];
    });
  }

  function formHatalari() {
    const hatalar: string[] = [];

    if (!company) hatalar.push("Firma bilgisi bulunamadı.");
    if (!form.cari_id) hatalar.push(form.fis_turu === "satis" ? "Müşteri seçmelisin." : "Tedarikçi seçmelisin.");
    if (!form.fis_tarihi) hatalar.push("Fiş tarihi seçmelisin.");
    if (form.fis_tarihi && (form.fis_tarihi < yearRange.start || form.fis_tarihi > yearRange.end)) {
      hatalar.push(`${workYear} çalışma yılında sadece ${yearRange.start} - ${yearRange.end} arası fiş kesebilirsin.`);
    }

    const doluSatirlar = satirHesaplari.filter((satir) => satir.urun && satir.miktar > 0);

    if (doluSatirlar.length === 0) hatalar.push("En az bir ürün veya hizmet seçmelisin.");

    doluSatirlar.forEach((satir) => {
      if (!satir.urun) return;

      if (satir.birimFiyat <= 0) {
        hatalar.push(`${satir.urun.urun_adi} için birim fiyat 0'dan büyük olmalı.`);
      }

      if (form.fis_turu === "satis" && satir.urun.urun_tipi === "urun" && satir.miktar > Number(satir.urun.mevcut_stok || 0)) {
        hatalar.push(
          `${satir.urun.urun_adi} için stok yetersiz. Mevcut: ${miktarFormatla(Number(satir.urun.mevcut_stok || 0))} ${satir.urun.birim}`,
        );
      }
    });

    if (toplamlar.genelToplam <= 0) hatalar.push("Fiş toplamı 0'dan büyük olmalı.");

    return hatalar;
  }

  async function fisiKaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    const hatalar = formHatalari();

    if (hatalar.length > 0) {
      setErrorMessage(hatalar[0]);
      return;
    }

    if (!company || !seciliCari) return;

    const kalemler = satirHesaplari
      .filter((satir) => satir.urun && satir.miktar > 0 && satir.birimFiyat > 0)
      .map((satir) => ({
        urun_id: satir.urun?.id,
        miktar: satir.miktar,
        birim_fiyat: satir.birimFiyat,
        kdv_orani: satir.kdvOrani,
        aciklama: satir.aciklama.trim() || null,
      }));

    setIsSaving(true);

    try {
      const { data, error } = duzenlenenFisId
        ? await supabaseClient.rpc("fatura_fisi_guncelle", {
            p_company_id: company.id,
            p_fis_id: duzenlenenFisId,
            p_cari_id: form.cari_id,
            p_fis_turu: form.fis_turu,
            p_fis_tarihi: form.fis_tarihi,
            p_aciklama: form.aciklama.trim() || null,
            p_kalemler: kalemler,
          })
        : await supabaseClient.rpc("fatura_fisi_kaydet", {
            p_company_id: company.id,
            p_cari_id: form.cari_id,
            p_kasa_hesap_id: null,
            p_fis_turu: form.fis_turu,
            p_fis_tarihi: form.fis_tarihi,
            p_aciklama: form.aciklama.trim() || null,
            p_tahsilat_tutari: 0,
            p_kalemler: kalemler,
          });

      if (error) throw error;

      const sonuc = data as RpcFisSonucu;
      const kayitliFis: KayitliFis = {
        id: sonuc.id,
        company_id: company.id,
        cari_id: seciliCari.id,
        fis_no: sonuc.fis_no,
        fis_turu: sonuc.fis_turu,
        fis_tarihi: form.fis_tarihi,
        ara_toplam: toplamlar.araToplam,
        kdv_toplam: toplamlar.kdvToplam,
        genel_toplam: sonuc.genel_toplam,
        tahsilat_tutari: 0,
        cari_bakiye_once: sonuc.cari_bakiye_once,
        cari_bakiye_sonra: sonuc.cari_bakiye_sonra,
        aciklama: form.aciklama.trim() || null,
        durum: "aktif",
        created_at: new Date().toISOString(),
        cari: {
          cari_kodu: seciliCari.cari_kodu,
          unvan: seciliCari.unvan,
          telefon: seciliCari.telefon,
        },
        kalemler: satirHesaplari
          .filter((satir) => satir.urun && satir.miktar > 0 && satir.birimFiyat > 0)
          .map((satir) => ({
            urun_id: satir.urun?.id || "",
            urun_kodu: satir.urun?.urun_kodu || "",
            urun_adi: satir.urun?.urun_adi || "",
            miktar: satir.miktar,
            birim: satir.urun?.birim || "",
            birim_fiyat: satir.birimFiyat,
            kdv_orani: satir.kdvOrani,
            ara_toplam: satir.araToplam,
            kdv_tutari: satir.kdvTutari,
            satir_toplami: satir.satirToplami,
          })),
      };

      setSonKayitliFis(kayitliFis);
      setSuccessMessage(
        duzenlenenFisId
          ? `${sonuc.fis_no} güncellendi. Stok ve cari bakiyesi yeni fişe göre tekrar işlendi.`
          : `${fisEtiketleri[form.fis_turu]} kaydedildi. Form kapatıldı; PDF veya WhatsApp işlemini son kayıttan yapabilirsin.`,
      );
      setDuzenlenenFisId(null);
      setFormAcik(false);
      setForm({ ...bosForm, fis_tarihi: bugununTarihi(workYear) });
      setSatirlar([yeniSatir()]);
      setCariArama("");
      setUrunArama("");
      await verileriYukle(false, false);
    } catch (error) {
      console.error("Fiş kaydetme hatası:", error);
      setErrorMessage(hataMesajiAl(error, "Fiş kaydedilemedi."));
    } finally {
      setIsSaving(false);
    }
  }

  function fisMesajiOlustur(fis: KayitliFis) {
    const kalanEtiketi = cariBakiyeEtiketi(Number(fis.cari_bakiye_sonra || 0));

    return [
      `${company?.name || "Sitemix Ön Muhasebe"} - ${fisEtiketleri[fis.fis_turu]}`,
      `Fiş No: ${fis.fis_no}`,
      `Tarih: ${tarihFormatla(fis.fis_tarihi)}`,
      `Cari: ${fis.cari?.unvan || "-"}`,
      `Fiş Toplamı: ${paraFormatla(Number(fis.genel_toplam || 0))}`,
      `Önceki Bakiye: ${cariBakiyeEtiketi(Number(fis.cari_bakiye_once || 0))} ${paraFormatla(Math.abs(Number(fis.cari_bakiye_once || 0)))}`,
      `Yeni Bakiye: ${kalanEtiketi} ${paraFormatla(Math.abs(Number(fis.cari_bakiye_sonra || 0)))}`,
      fis.aciklama ? `Not: ${fis.aciklama}` : "",
      "PDF fişi ayrıca iletilmiştir.",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function fisHtmlOlustur(fis: KayitliFis) {
    const kalemler = fis.kalemler || [];

    return `
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${htmlEscape(fis.fis_no)}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 28px; font-family: Arial, sans-serif; color: #111827; background: #f3f4f6; }
            .fis { max-width: 920px; margin: 0 auto; background: #fff; border: 1px solid #d1d5db; padding: 28px; }
            .ust { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #111827; padding-bottom: 16px; }
            .firma { font-size: 22px; font-weight: 800; }
            .firma-alt { margin-top: 6px; color: #6b7280; font-size: 12px; font-weight: 700; }
            .baslik { text-align: right; }
            .baslik h1 { margin: 0; font-size: 24px; }
            .baslik p { margin: 7px 0 0; font-size: 13px; color: #4b5563; font-weight: 700; }
            .bilgiler { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; margin-top: 20px; }
            .bilgi { border: 1px solid #e5e7eb; padding: 11px; min-height: 72px; }
            .bilgi small { display: block; color: #6b7280; font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .bilgi strong { display: block; margin-top: 7px; font-size: 13px; }
            table { width: 100%; border-collapse: collapse; margin-top: 22px; }
            th { text-align: left; color: #4b5563; background: #f9fafb; font-size: 11px; text-transform: uppercase; letter-spacing: .06em; border: 1px solid #e5e7eb; padding: 10px 8px; }
            td { border: 1px solid #e5e7eb; padding: 10px 8px; font-size: 12px; vertical-align: top; }
            .right { text-align: right; }
            .toplamlar { margin-top: 18px; margin-left: auto; width: 340px; border: 1px solid #d1d5db; }
            .toplam-satir { display: flex; justify-content: space-between; gap: 16px; padding: 11px 13px; border-bottom: 1px solid #e5e7eb; font-size: 13px; }
            .toplam-satir:last-child { border-bottom: 0; background: #111827; color: #fff; font-size: 15px; }
            .not { margin-top: 18px; border: 1px solid #e5e7eb; background: #f9fafb; padding: 12px; font-size: 12px; }
            .imza { display: grid; grid-template-columns: 1fr 1fr; gap: 18px; margin-top: 34px; }
            .imza-kutu { border: 1px solid #d1d5db; padding: 18px; min-height: 116px; }
            .imza-baslik { font-size: 11px; color: #6b7280; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .imza-ad { margin-top: 10px; font-size: 13px; font-weight: 800; }
            .imza-cizgi { margin-top: 38px; border-top: 1px solid #9ca3af; padding-top: 8px; font-size: 11px; color: #6b7280; }
            .alt { margin-top: 18px; text-align: center; color: #6b7280; font-size: 11px; }
            @media print {
              body { background: #fff; padding: 0; }
              .fis { border: 0; padding: 18px; }
            }
          </style>
        </head>
        <body>
          <div class="fis">
            <div class="ust">
              <div>
                <div class="firma">${htmlEscape(company?.name || "Sitemix Ön Muhasebe")}</div>
                <div class="firma-alt">Firma Kodu: ${htmlEscape(company?.company_code || "-")}</div>
              </div>
              <div class="baslik">
                <h1>${htmlEscape(fisEtiketleri[fis.fis_turu])}</h1>
                <p>Fiş No: ${htmlEscape(fis.fis_no)}</p>
                <p>Tarih: ${htmlEscape(tarihFormatla(fis.fis_tarihi))}</p>
              </div>
            </div>

            <div class="bilgiler">
              <div class="bilgi"><small>Cari</small><strong>${htmlEscape(fis.cari?.unvan || "-")}</strong></div>
              <div class="bilgi"><small>Cari Kodu</small><strong>${htmlEscape(fis.cari?.cari_kodu || "-")}</strong></div>
              <div class="bilgi"><small>Önceki Bakiye</small><strong>${htmlEscape(cariBakiyeEtiketi(Number(fis.cari_bakiye_once || 0)))} ${htmlEscape(paraFormatla(Math.abs(Number(fis.cari_bakiye_once || 0))))}</strong></div>
              <div class="bilgi"><small>Yeni Bakiye</small><strong>${htmlEscape(cariBakiyeEtiketi(Number(fis.cari_bakiye_sonra || 0)))} ${htmlEscape(paraFormatla(Math.abs(Number(fis.cari_bakiye_sonra || 0))))}</strong></div>
            </div>

            <table>
              <thead>
                <tr>
                  <th>Ürün / Hizmet</th>
                  <th class="right">Miktar</th>
                  <th class="right">Birim Fiyat</th>
                  <th class="right">KDV</th>
                  <th class="right">Satır Toplamı</th>
                </tr>
              </thead>
              <tbody>
                ${kalemler
                  .map(
                    (kalem) => `
                      <tr>
                        <td><strong>${htmlEscape(kalem.urun_adi)}</strong><br /><span style="color:#6b7280">${htmlEscape(kalem.urun_kodu)}</span></td>
                        <td class="right">${htmlEscape(miktarFormatla(Number(kalem.miktar || 0)))} ${htmlEscape(kalem.birim)}</td>
                        <td class="right">${htmlEscape(paraFormatla(Number(kalem.birim_fiyat || 0)))}</td>
                        <td class="right">%${htmlEscape(kalem.kdv_orani)}<br />${htmlEscape(paraFormatla(Number(kalem.kdv_tutari || 0)))}</td>
                        <td class="right"><strong>${htmlEscape(paraFormatla(Number(kalem.satir_toplami || 0)))}</strong></td>
                      </tr>
                    `,
                  )
                  .join("")}
              </tbody>
            </table>

            <div class="toplamlar">
              <div class="toplam-satir"><span>Ara Toplam</span><strong>${htmlEscape(paraFormatla(Number(fis.ara_toplam || 0)))}</strong></div>
              <div class="toplam-satir"><span>KDV Toplam</span><strong>${htmlEscape(paraFormatla(Number(fis.kdv_toplam || 0)))}</strong></div>
              <div class="toplam-satir"><span>Genel Toplam</span><strong>${htmlEscape(paraFormatla(Number(fis.genel_toplam || 0)))}</strong></div>
            </div>

            ${fis.aciklama ? `<div class="not"><strong>Not:</strong> ${htmlEscape(fis.aciklama)}</div>` : ""}

            <div class="imza">
              <div class="imza-kutu">
                <div class="imza-baslik">Teslim Eden</div>
                <div class="imza-ad">${htmlEscape(fis.fis_turu === "satis" ? company?.name || "Firma Yetkilisi" : fis.cari?.unvan || "Tedarikçi")}</div>
                <div class="imza-cizgi">Ad Soyad / İmza</div>
              </div>
              <div class="imza-kutu">
                <div class="imza-baslik">Teslim Alan</div>
                <div class="imza-ad">${htmlEscape(fis.fis_turu === "satis" ? fis.cari?.unvan || "Müşteri" : company?.name || "Firma Yetkilisi")}</div>
                <div class="imza-cizgi">Ad Soyad / İmza</div>
              </div>
            </div>

            <div class="alt">Bu fiş ödeme/tahsilat makbuzu değildir. Kasa işlemleri ayrı makbuz üzerinden takip edilir.</div>
          </div>
        </body>
      </html>
    `;
  }

  async function fisKalemleriniYukle(fis: KayitliFis) {
    if (fis.kalemler && fis.kalemler.length > 0) return fis;

    const { data, error } = await supabaseClient
      .from("fatura_fis_kalemleri")
      .select("urun_id, urun_kodu, urun_adi, miktar, birim, birim_fiyat, kdv_orani, ara_toplam, kdv_tutari, satir_toplami")
      .eq("fis_id", fis.id)
      .order("created_at", { ascending: true });

    if (error) throw new Error(hataMesajiAl(error, "Fiş kalemleri alınamadı."));

    return {
      ...fis,
      kalemler: (data || []) as KayitliFisKalemi[],
    };
  }

  async function fisPdfAc(fis: KayitliFis) {
    setErrorMessage("");

    const pencere = window.open("", "_blank", "width=980,height=900");

    if (!pencere) {
      setErrorMessage("PDF ön izlemesi açılamadı. Tarayıcı pop-up iznini kontrol et.");
      return;
    }

    pencere.document.open();
    pencere.document.write("<p style='font-family:Arial;padding:24px'>PDF hazırlanıyor...</p>");
    pencere.document.close();

    try {
      const guncelFis = await fisKalemleriniYukle(fis);

      pencere.document.open();
      pencere.document.write(fisHtmlOlustur(guncelFis));
      pencere.document.close();
      pencere.focus();

      setTimeout(() => {
        pencere.print();
      }, 350);
    } catch (error) {
      pencere.close();
      console.error("PDF oluşturma hatası:", error);
      setErrorMessage(hataMesajiAl(error, "PDF oluşturulamadı."));
    }
  }

  function fisiWhatsappIleGonder(fis: KayitliFis) {
    setErrorMessage("");
    const telefon = telefonuWhatsappFormatinaCevir(fis.cari?.telefon);

    if (!telefon) {
      setErrorMessage("Bu caride telefon numarası yok. Önce cari kartına telefon eklemelisin.");
      return;
    }

    const mesaj = fisMesajiOlustur(fis);
    const whatsappUrl = `https://api.whatsapp.com/send?phone=${telefon}&text=${encodeURIComponent(mesaj)}`;
    const pencere = window.open(whatsappUrl, "_blank", "noopener,noreferrer");

    if (!pencere) {
      window.location.href = whatsappUrl;
    }
  }


  async function fisiDuzenlemeyeAc(fis: KayitliFis) {
    if (fis.durum === "iptal") {
      setErrorMessage("İptal edilmiş fiş düzenlenemez. Aynı bilgilerle yeni giriş açabilirsin.");
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    try {
     const guncelFis = await fisKalemleriniYukle(fis);

setDuzenlenenFisId(guncelFis.id);
setForm({
  fis_turu: guncelFis.fis_turu,
  cari_id: guncelFis.cari_id,
  fis_tarihi: String(guncelFis.fis_tarihi || "").slice(0, 10) || bugununTarihi(workYear),
  aciklama: guncelFis.aciklama || "",
});
      setSatirlar(
        guncelFis.kalemler && guncelFis.kalemler.length > 0
          ? guncelFis.kalemler.map((kalem) => ({
              satir_id: `${Date.now()}-${kalem.urun_id}-${Math.random().toString(16).slice(2)}`,
              urun_id: kalem.urun_id,
              miktar: paraGirisiFormatla(String(kalem.miktar || 0)),
              birim_fiyat: paraGirisiFormatla(String(kalem.birim_fiyat || 0)),
              kdv_orani: String(kalem.kdv_orani || 0),
              aciklama: "",
            }))
          : [yeniSatir()],
      );
      setCariArama("");
      setUrunArama("");
      setFormAcik(true);
      window.scrollTo({ top: 0, behavior: "smooth" });
      setSuccessMessage(`${guncelFis.fis_no} düzenleme için açıldı. Kaydedince eski stok/cari etkisi geri alınır ve yeni hali işlenir.`);
    } catch (error) {
      console.error("Fiş düzenleme açma hatası:", error);
      setErrorMessage(hataMesajiAl(error, "Fiş düzenleme için açılamadı."));
    }
  }

  async function fisiIptalEt(fis: KayitliFis) {
    if (!company) return;
    if (fis.durum === "iptal") return;

    const onay = window.confirm(`${fis.fis_no} iptal edilecek. Stok ve cari etkisi geri alınacak. Devam edilsin mi?`);
    if (!onay) return;

    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabaseClient.rpc("fatura_fisi_iptal_et", {
        p_company_id: company.id,
        p_fis_id: fis.id,
      });

      if (error) throw error;

      if (duzenlenenFisId === fis.id) formuKapat();
      setSuccessMessage(`${fis.fis_no} iptal edildi. Stok ve cari bakiyesi geri alındı.`);
      await verileriYukle(false, false);
    } catch (error) {
      console.error("Fiş iptal hatası:", error);
      setErrorMessage(hataMesajiAl(error, "Fiş iptal edilemedi."));
    }
  }

  async function fistenYeniGirisAc(fis: KayitliFis) {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const guncelFis = await fisKalemleriniYukle(fis);
      setDuzenlenenFisId(null);
      setForm({
        fis_turu: guncelFis.fis_turu,
        cari_id: guncelFis.cari_id,
        fis_tarihi: bugununTarihi(workYear),
        aciklama: guncelFis.aciklama || "",
      });
      setSatirlar(
        guncelFis.kalemler && guncelFis.kalemler.length > 0
          ? guncelFis.kalemler.map((kalem) => ({
              satir_id: `${Date.now()}-${kalem.urun_id}-${Math.random().toString(16).slice(2)}`,
              urun_id: kalem.urun_id,
              miktar: paraGirisiFormatla(String(kalem.miktar || 0)),
              birim_fiyat: paraGirisiFormatla(String(kalem.birim_fiyat || 0)),
              kdv_orani: String(kalem.kdv_orani || 0),
              aciklama: "",
            }))
          : [yeniSatir()],
      );
      setCariArama("");
      setUrunArama("");
      setFormAcik(true);
      setSuccessMessage("Fiş bilgileri yeni giriş olarak açıldı. Bu işlem eski fişi değiştirmez; yeni fiş kaydı oluşturur.");
    } catch (error) {
      console.error("Fişten yeni giriş açma hatası:", error);
      setErrorMessage(hataMesajiAl(error, "Fiş bilgileri açılamadı."));
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-violet-600" />
          <p className="mt-5 text-sm font-black text-slate-600">Fiş ekranı yükleniyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] pb-24 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/on-muhasebe/panel" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-violet-600 text-sm font-black text-white shadow-lg shadow-violet-200">
              F
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-[-0.03em]">Fatura / Fiş / {workYear}</span>
              <span className="block text-xs font-extrabold text-slate-500">
                {company?.company_code || "Sitemix Ön Muhasebe"}
              </span>
            </span>
          </Link>

          <div className="flex items-center gap-2">
            <a
              href={whatsappDestekLink}
              target="_blank"
              rel="noreferrer"
              className="hidden min-h-11 items-center justify-center rounded-full bg-emerald-50 px-5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 lg:inline-flex"
            >
              WP Destek
            </a>
            <button
              type="button"
              onClick={() => verileriYukle()}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200"
            >
              Yenile
            </button>
            <button
              type="button"
              onClick={() => fisOlusturmaAc("satis")}
              className="hidden min-h-11 items-center justify-center rounded-full bg-violet-600 px-5 text-xs font-black text-white transition hover:bg-violet-700 sm:inline-flex"
            >
              Satış Fişi
            </button>
            <button
              type="button"
              onClick={() => fisOlusturmaAc("alis")}
              className="hidden min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800 sm:inline-flex"
            >
              Alış Fişi
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-[2rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-white/40">Bugün</p>
            <p className="mt-2 text-xs font-bold text-white/50">{donemler.gun.etiket}</p>
            <div className="mt-5 grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-bold text-white/40">Satış</p>
                <p className="mt-1 text-xl font-black">{paraFormatla(istatistikler.bugun.satis)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-white/40">Alış</p>
                <p className="mt-1 text-xl font-black">{paraFormatla(istatistikler.bugun.alis)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bu Ay</p>
            <p className="mt-2 text-xs font-bold text-slate-400">{tarihFormatla(ayBaslangici(workYear))} - {donemler.gun.etiket}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">Satış</p>
                <p className="mt-1 text-sm font-black">{paraFormatla(istatistikler.ay.satis)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Alış</p>
                <p className="mt-1 text-sm font-black">{paraFormatla(istatistikler.ay.alis)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Net</p>
                <p className="mt-1 text-sm font-black">{paraFormatla(istatistikler.ay.net)}</p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">Bu Yıl</p>
            <p className="mt-2 text-xs font-bold text-slate-400">{tarihFormatla(yilBaslangici(workYear))} - {donemler.gun.etiket}</p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              <div>
                <p className="text-xs font-bold text-slate-400">Satış</p>
                <p className="mt-1 text-sm font-black">{paraFormatla(istatistikler.yil.satis)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Alış</p>
                <p className="mt-1 text-sm font-black">{paraFormatla(istatistikler.yil.alis)}</p>
              </div>
              <div>
                <p className="text-xs font-bold text-slate-400">Net</p>
                <p className="mt-1 text-sm font-black">{paraFormatla(istatistikler.yil.net)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Alış / Satış Fişi</p>
              <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">Stok ve cari hareketi aynı kayıtla oluşur</h1>
              <p className="mt-3 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                Bu ekranda sadece fiş oluşturulur. Nakit tahsilat ve ödeme işlemleri kasa ekranından yapılır. Böylece satış/alış kaydı ile para hareketi birbirine karışmaz.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 lg:min-w-[360px]">
              <button
                type="button"
                onClick={() => fisOlusturmaAc("satis")}
                className="min-h-14 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700"
              >
                Satış Fişi Oluştur
              </button>
              <button
                type="button"
                onClick={() => fisOlusturmaAc("alis")}
                className="min-h-14 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
              >
                Alış Fişi Oluştur
              </button>
            </div>
          </div>
        </div>

        {successMessage ? (
          <div className="mt-5 rounded-[1.5rem] bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-[1.5rem] bg-red-50 p-4 text-sm font-black text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {sonKayitliFis ? (
          <div className="mt-5 rounded-[2rem] border border-emerald-100 bg-emerald-50 p-5 shadow-lg shadow-emerald-100 sm:p-6">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">Son Kaydedilen Fiş</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em] text-slate-950">
                  {sonKayitliFis.fis_no} · {sonKayitliFis.cari?.unvan || "-"}
                </h2>
                <p className="mt-2 text-sm font-bold text-slate-600">
                  {fisEtiketleri[sonKayitliFis.fis_turu]} · {tarihFormatla(sonKayitliFis.fis_tarihi)} · {paraFormatla(Number(sonKayitliFis.genel_toplam || 0))}
                </p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[520px]">
                <button
                  type="button"
                  onClick={() => fisPdfAc(sonKayitliFis)}
                  className="min-h-12 rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
                >
                  PDF Oluştur
                </button>
                <button
                  type="button"
                  onClick={() => fisiWhatsappIleGonder(sonKayitliFis)}
                  className="min-h-12 rounded-full bg-emerald-600 px-5 text-xs font-black text-white transition hover:bg-emerald-700"
                >
                  WhatsApp Aç
                </button>
                <button
                  type="button"
                  onClick={() => fistenYeniGirisAc(sonKayitliFis)}
                  className="min-h-12 rounded-full bg-white px-5 text-xs font-black text-slate-900 shadow-sm transition hover:bg-slate-50"
                >
                  Yeni Girişe Kopyala
                </button>
              </div>
            </div>
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section>
            {!formAcik ? (
              <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Yeni Kayıt</p>
                <h2 className="mt-3 text-2xl font-black tracking-[-0.05em]">Fiş oluşturmak için işlem türü seç</h2>
                <p className="mx-auto mt-3 max-w-xl text-sm font-bold leading-6 text-slate-500">
                  Kaydettiğin fiş stok hareketini ve cari bakiyeyi işler. Kayıt sonrası form otomatik kapanır ve temizlenir.
                </p>
                <div className="mx-auto mt-6 grid max-w-xl gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={() => fisOlusturmaAc("satis")}
                    className="min-h-16 rounded-2xl bg-violet-600 px-5 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700"
                  >
                    Satış Fişi Oluştur
                  </button>
                  <button
                    type="button"
                    onClick={() => fisOlusturmaAc("alis")}
                    className="min-h-16 rounded-2xl bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
                  >
                    Alış Fişi Oluştur
                  </button>
                </div>
              </div>
            ) : (
              <form onSubmit={fisiKaydet} className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">{duzenlemeModu ? "Fiş Düzenleme" : "Yeni Fiş"}</p>
                    <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">{duzenlemeModu ? "Fişi güncelle" : `${fisEtiketleri[form.fis_turu]} oluştur`}</h2>
                    <p className="mt-2 text-sm font-bold leading-6 text-slate-500">{fisKisaAciklama[form.fis_turu]}</p>
                  </div>
                  <button
                    type="button"
                    onClick={formuKapat}
                    className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                  >
                    Formu Kapat
                  </button>
                </div>

                <div className="mt-5 grid gap-2 sm:grid-cols-2">
                  {(["satis", "alis"] as FisTuru[]).map((fisTuru) => {
                    const aktif = form.fis_turu === fisTuru;

                    return (
                      <button
                        key={fisTuru}
                        type="button"
                        onClick={() => fisTuruSec(fisTuru)}
                        className={[
                          "rounded-[1.25rem] border px-4 py-4 text-left transition",
                          aktif
                            ? "border-violet-600 bg-violet-600 text-white shadow-lg shadow-violet-100"
                            : "border-slate-200 bg-slate-50 text-slate-700 hover:border-violet-300",
                        ].join(" ")}
                      >
                        <span className="block text-sm font-black">{fisEtiketleri[fisTuru]}</span>
                        <span className={aktif ? "mt-1 block text-xs font-bold text-white/70" : "mt-1 block text-xs font-bold text-slate-400"}>
                          {fisTuru === "satis" ? "Stok düşer, cari borçlanır" : "Stok artar, firma borçlanır"}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-5 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Fiş Tarihi</span>
                    <input
                      type="date"
                      min={yearRange.start}
                      max={yearRange.end}
                      value={form.fis_tarihi}
                      onChange={(event) => formGuncelle("fis_tarihi", event.target.value)}
                      className="mt-2 h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-violet-400 focus:bg-white"
                    />
                  </label>

                  <div className="rounded-2xl bg-slate-50 p-4">
                    <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Fiş Bakiyesi</p>
                    <p className="mt-2 text-sm font-bold text-slate-500">Nakit/tahsilat bu ekranda işlenmez.</p>
                    <p className="mt-1 text-xs font-bold text-slate-400">Kasa işlemi gerekiyorsa kasa modülünden makbuz oluştur.</p>
                  </div>
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Cari</p>
                      <p className="mt-1 text-sm font-black text-slate-800">
                        {form.fis_turu === "satis" ? "Müşteri seç" : "Tedarikçi seç"}
                      </p>
                    </div>
                    {seciliCari ? (
                      <button
                        type="button"
                        onClick={cariSecimiTemizle}
                        className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-600 shadow-sm"
                      >
                        Değiştir
                      </button>
                    ) : null}
                  </div>

                  {seciliCari ? (
                    <div className="mt-4 rounded-[1.25rem] bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black text-slate-950">{seciliCari.unvan}</p>
                          <p className="mt-1 text-xs font-bold text-slate-400">{seciliCari.cari_kodu}</p>
                        </div>
                        <div className="text-right">
                          <p className={["text-xs font-black", bakiyeRengi(Number(seciliCari.bakiye || 0))].join(" ")}>
                            Mevcut: {cariBakiyeEtiketi(Number(seciliCari.bakiye || 0))}
                          </p>
                          <p className="mt-1 text-sm font-black">{paraFormatla(Math.abs(Number(seciliCari.bakiye || 0)))}</p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-4">
                      <input
                        type="text"
                        value={cariArama}
                        onChange={(event) => setCariArama(event.target.value)}
                        placeholder="Cari unvanı, kodu veya telefon ara"
                        className="h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-violet-400"
                      />

                      <div className="mt-3 grid gap-2">
                        {filtreliCariler.map((cari) => (
                          <button
                            key={cari.id}
                            type="button"
                            onClick={() => cariSec(cari)}
                            className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-white p-3 text-left shadow-sm transition hover:bg-violet-50"
                          >
                            <span>
                              <span className="block text-sm font-black text-slate-950">{cari.unvan}</span>
                              <span className="mt-1 block text-xs font-bold text-slate-400">{cari.cari_kodu}</span>
                            </span>
                            <span className="text-right text-xs font-black text-slate-500">
                              {cariBakiyeEtiketi(Number(cari.bakiye || 0))}
                              <span className="block">{paraFormatla(Math.abs(Number(cari.bakiye || 0)))}</span>
                            </span>
                          </button>
                        ))}

                        {filtreliCariler.length === 0 ? (
                          <p className="rounded-[1.1rem] bg-white p-3 text-sm font-bold text-slate-400">Uygun cari bulunamadı.</p>
                        ) : null}
                      </div>
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Ürün / Hizmet Ara</p>
                  <input
                    type="text"
                    value={urunArama}
                    onChange={(event) => setUrunArama(event.target.value)}
                    placeholder="Ürün adı veya kodu ara"
                    className="mt-3 h-12 w-full rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-violet-400"
                  />

                  {urunArama ? (
                    <div className="mt-3 grid gap-2">
                      {filtreliUrunler.map((urun) => (
                        <button
                          key={urun.id}
                          type="button"
                          onClick={() => urunSatiraEkle(urun)}
                          className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-white p-3 text-left shadow-sm transition hover:bg-violet-50"
                        >
                          <span>
                            <span className="block text-sm font-black text-slate-950">{urun.urun_adi}</span>
                            <span className="mt-1 block text-xs font-bold text-slate-400">
                              {urun.urun_kodu} · Stok: {urun.urun_tipi === "hizmet" ? "Hizmet" : `${miktarFormatla(Number(urun.mevcut_stok || 0))} ${urun.birim}`}
                            </span>
                          </span>
                          <span className="text-right text-xs font-black text-slate-600">
                            {paraFormatla(Number(form.fis_turu === "satis" ? urun.satis_fiyati || 0 : urun.alis_fiyati || 0))}
                          </span>
                        </button>
                      ))}

                      {filtreliUrunler.length === 0 ? (
                        <p className="rounded-[1.1rem] bg-white p-3 text-sm font-bold text-slate-400">Ürün bulunamadı.</p>
                      ) : null}
                    </div>
                  ) : null}
                </div>

                <div className="mt-5 space-y-3">
                  {satirHesaplari.map((satir, index) => (
                    <div key={satir.satir_id} className="rounded-[1.5rem] border border-slate-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-xs font-black text-slate-400">Satır {index + 1}</p>
                          <p className="mt-1 text-sm font-black text-slate-950">{satir.urun?.urun_adi || "Ürün seçilmedi"}</p>
                          {satir.urun ? (
                            <p className="mt-1 text-xs font-bold text-slate-400">
                              {satir.urun.urun_kodu} · {satir.urun.urun_tipi === "hizmet" ? "Hizmet" : `Stok: ${miktarFormatla(Number(satir.urun.mevcut_stok || 0))} ${satir.urun.birim}`}
                            </p>
                          ) : null}
                        </div>
                        <button
                          type="button"
                          onClick={() => satirSil(satir.satir_id)}
                          className="rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-600"
                        >
                          Sil
                        </button>
                      </div>

                      <div className="mt-4 grid gap-3 sm:grid-cols-4">
                        <label className="block sm:col-span-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Miktar</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={satir.miktar}
                            onChange={(event) => satirGuncelle(satir.satir_id, "miktar", miktarGirisiTemizle(event.target.value))}
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-violet-400 focus:bg-white"
                          />
                        </label>

                        <label className="block sm:col-span-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">Birim Fiyat</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={satir.birim_fiyat}
                            onChange={(event) => satirGuncelle(satir.satir_id, "birim_fiyat", paraGirisiTemizle(event.target.value))}
                            onBlur={(event) => satirGuncelle(satir.satir_id, "birim_fiyat", paraGirisiFormatla(event.target.value))}
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-violet-400 focus:bg-white"
                          />
                        </label>

                        <label className="block sm:col-span-1">
                          <span className="text-[10px] font-black uppercase tracking-[0.12em] text-slate-400">KDV %</span>
                          <input
                            type="text"
                            inputMode="decimal"
                            value={satir.kdv_orani}
                            onChange={(event) => satirGuncelle(satir.satir_id, "kdv_orani", miktarGirisiTemizle(event.target.value))}
                            className="mt-2 h-11 w-full rounded-2xl border border-slate-200 bg-slate-50 px-3 text-sm font-bold outline-none focus:border-violet-400 focus:bg-white"
                          />
                        </label>

                        <div className="rounded-2xl bg-slate-950 p-3 text-white">
                          <p className="text-[10px] font-black uppercase tracking-[0.12em] text-white/40">Satır Toplamı</p>
                          <p className="mt-2 text-sm font-black">{paraFormatla(satir.satirToplami)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={satirEkle}
                  className="mt-4 inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
                >
                  Satır Ekle
                </button>

                <label className="mt-5 block">
                  <span className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Not</span>
                  <textarea
                    value={form.aciklama}
                    onChange={(event) => formGuncelle("aciklama", event.target.value)}
                    rows={3}
                    placeholder="Fiş açıklaması"
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-violet-400 focus:bg-white"
                  />
                </label>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-violet-600 px-6 text-sm font-black text-white shadow-lg shadow-violet-100 transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? "Kaydediliyor..." : duzenlemeModu ? "Fişi Güncelle" : `${fisEtiketleri[form.fis_turu]} Kaydet`}
                  </button>

                  <button
                    type="button"
                    onClick={formuKapat}
                    className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-6 text-sm font-black text-slate-700 transition hover:bg-slate-200"
                  >
                    Vazgeç
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="space-y-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Anlık Fiş Özeti</p>
              <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">{formAcik ? fisEtiketleri[form.fis_turu] : "Fiş seçilmedi"}</h3>

              <div className="mt-5 space-y-3">
                <div className="flex items-center justify-between rounded-[1.25rem] bg-slate-50 p-4">
                  <span className="text-sm font-bold text-slate-500">Ara Toplam</span>
                  <strong className="text-sm font-black">{paraFormatla(toplamlar.araToplam)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-[1.25rem] bg-slate-50 p-4">
                  <span className="text-sm font-bold text-slate-500">KDV</span>
                  <strong className="text-sm font-black">{paraFormatla(toplamlar.kdvToplam)}</strong>
                </div>
                <div className="flex items-center justify-between rounded-[1.25rem] bg-slate-950 p-4 text-white">
                  <span className="text-sm font-bold text-white/60">Fiş Toplamı</span>
                  <strong className="text-lg font-black">{paraFormatla(toplamlar.genelToplam)}</strong>
                </div>
              </div>

              <div className="mt-5 rounded-[1.5rem] border border-slate-200 p-4">
                <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Cari Bakiye</p>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs font-bold text-slate-400">Önce</p>
                    <p className={["mt-1 text-sm font-black", bakiyeRengi(toplamlar.oncekiBakiye)].join(" ")}>
                      {cariBakiyeEtiketi(toplamlar.oncekiBakiye)}
                    </p>
                    <p className="mt-1 text-lg font-black">{paraFormatla(Math.abs(toplamlar.oncekiBakiye))}</p>
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-400">Sonra</p>
                    <p className={["mt-1 text-sm font-black", bakiyeRengi(toplamlar.yeniBakiye)].join(" ")}>
                      {cariBakiyeEtiketi(toplamlar.yeniBakiye)}
                    </p>
                    <p className="mt-1 text-lg font-black">{paraFormatla(Math.abs(toplamlar.yeniBakiye))}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Son Fişler</p>
              <div className="mt-4 space-y-3">
                {sonFisler.length === 0 ? (
                  <p className="rounded-[1.25rem] bg-slate-50 p-4 text-sm font-bold text-slate-500">Henüz fiş yok.</p>
                ) : null}

                {sonFisler.map((fis) => (
                  <div key={fis.id} className="rounded-[1.35rem] border border-slate-200 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black text-slate-950">{fis.fis_no}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          {fisEtiketleri[fis.fis_turu]} · {tarihFormatla(fis.fis_tarihi)} · {fis.durum === "iptal" ? "İptal" : "Aktif"}
                        </p>
                        <p className="mt-1 text-xs font-bold text-slate-500">{fis.cari?.unvan || "-"}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black">{paraFormatla(Number(fis.genel_toplam || 0))}</p>
                        <p className="mt-1 text-xs font-bold text-slate-400">
                          Bakiye: {paraFormatla(Math.abs(Number(fis.cari_bakiye_sonra || 0)))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-5">
                      <button
                        type="button"
                        onClick={() => fisPdfAc(fis)}
                        className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700"
                      >
                        PDF
                      </button>
                      <button
                        type="button"
                        onClick={() => fisiWhatsappIleGonder(fis)}
                        className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700"
                      >
                        WhatsApp
                      </button>
                      <button
                        type="button"
                        onClick={() => fistenYeniGirisAc(fis)}
                        className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700"
                      >
                        Kopyala
                      </button>
                      <button
                        type="button"
                        disabled={fis.durum === "iptal"}
                        onClick={() => fisiDuzenlemeyeAc(fis)}
                        className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        Düzenle
                      </button>
                      <button
                        type="button"
                        disabled={fis.durum === "iptal"}
                        onClick={() => fisiIptalEt(fis)}
                        className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
                      >
                        İptal
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">Fiş Hareketleri</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Alış, satış ve düzenleme işlemleri</h2>
              <p className="mt-2 text-sm font-bold text-slate-500">
                Liste fiş tarihine göre sıralanır. Aktif fişler düzenlenebilir veya iptal edilebilir; iptal edilen fişin stok ve cari etkisi geri alınır.
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-[160px_minmax(220px,320px)]">
              <select
                value={listeTuru}
                onChange={(event) => setListeTuru(event.target.value as "tum" | FisTuru)}
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-black outline-none focus:border-violet-400 focus:bg-white"
              >
                <option value="tum">Tüm fişler</option>
                <option value="satis">Satış</option>
                <option value="alis">Alış</option>
              </select>
              <input
                type="search"
                value={listeArama}
                onChange={(event) => setListeArama(event.target.value)}
                placeholder="Fiş no, cari, tarih ara"
                className="h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none focus:border-violet-400 focus:bg-white"
              />
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-[1.5rem] bg-violet-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-violet-500">Listelenen Satış</p>
              <p className="mt-2 text-xl font-black text-slate-950">
                {paraFormatla(listeFisleri.filter((fis) => fis.durum === "aktif" && fis.fis_turu === "satis").reduce((toplam, fis) => toplam + Number(fis.genel_toplam || 0), 0))}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-50 p-4">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-slate-400">Listelenen Alış</p>
              <p className="mt-2 text-xl font-black text-slate-950">
                {paraFormatla(listeFisleri.filter((fis) => fis.durum === "aktif" && fis.fis_turu === "alis").reduce((toplam, fis) => toplam + Number(fis.genel_toplam || 0), 0))}
              </p>
            </div>
            <div className="rounded-[1.5rem] bg-slate-950 p-4 text-white">
              <p className="text-xs font-black uppercase tracking-[0.12em] text-white/40">Aktif Fiş Sayısı</p>
              <p className="mt-2 text-xl font-black">{listeFisleri.filter((fis) => fis.durum === "aktif").length}</p>
            </div>
          </div>

          <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
            <div className="hidden grid-cols-[130px_110px_minmax(180px,1fr)_130px_130px_260px] bg-slate-50 px-4 py-3 text-[11px] font-black uppercase tracking-[0.12em] text-slate-400 lg:grid">
              <span>Fiş No</span>
              <span>Tarih</span>
              <span>Cari</span>
              <span>Tür</span>
              <span className="text-right">Toplam</span>
              <span className="text-right">İşlem</span>
            </div>

            {listeFisleri.length === 0 ? (
              <p className="p-5 text-sm font-bold text-slate-500">Aramana uygun fiş bulunamadı.</p>
            ) : null}

            {listeFisleri.map((fis) => (
              <div
                key={`hareket-${fis.id}`}
                className={[
                  "grid gap-3 border-t border-slate-200 px-4 py-4 lg:grid-cols-[130px_110px_minmax(180px,1fr)_130px_130px_260px] lg:items-center",
                  fis.durum === "iptal" ? "bg-red-50/50" : "bg-white",
                ].join(" ")}
              >
                <div>
                  <p className="text-sm font-black text-slate-950">{fis.fis_no}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400 lg:hidden">{tarihFormatla(fis.fis_tarihi)}</p>
                </div>
                <p className="hidden text-sm font-bold text-slate-600 lg:block">{tarihFormatla(fis.fis_tarihi)}</p>
                <div>
                  <p className="text-sm font-black text-slate-950">{fis.cari?.unvan || "-"}</p>
                  <p className="mt-1 text-xs font-bold text-slate-400">{fis.cari?.cari_kodu || "Cari kodu yok"}</p>
                </div>
                <div>
                  <span
                    className={[
                      "inline-flex rounded-full px-3 py-1 text-xs font-black",
                      fis.fis_turu === "satis" ? "bg-violet-50 text-violet-700" : "bg-slate-100 text-slate-700",
                    ].join(" ")}
                  >
                    {fisEtiketleri[fis.fis_turu]}
                  </span>
                  {fis.durum === "iptal" ? (
                    <span className="ml-2 inline-flex rounded-full bg-red-100 px-3 py-1 text-xs font-black text-red-700">İptal</span>
                  ) : null}
                </div>
                <p className="text-left text-base font-black text-slate-950 lg:text-right">{paraFormatla(Number(fis.genel_toplam || 0))}</p>
                <div className="grid grid-cols-5 gap-2 lg:justify-end">
                  <button type="button" onClick={() => fisPdfAc(fis)} className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">PDF</button>
                  <button type="button" onClick={() => fisiWhatsappIleGonder(fis)} className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">WP</button>
                  <button type="button" onClick={() => fistenYeniGirisAc(fis)} className="rounded-full bg-violet-50 px-3 py-2 text-xs font-black text-violet-700">Kopya</button>
                  <button type="button" disabled={fis.durum === "iptal"} onClick={() => fisiDuzenlemeyeAc(fis)} className="rounded-full bg-amber-50 px-3 py-2 text-xs font-black text-amber-700 disabled:cursor-not-allowed disabled:opacity-40">Düzenle</button>
                  <button type="button" disabled={fis.durum === "iptal"} onClick={() => fisiIptalEt(fis)} className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700 disabled:cursor-not-allowed disabled:opacity-40">İptal</button>
                </div>
              </div>
            ))}
          </div>
        </section>

      </section>
    </main>
  );
}
