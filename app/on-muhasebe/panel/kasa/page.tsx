"use client";

import Link from "next/link";
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { getOnMuhasebeClientContext } from "@/lib/onMuhasebe/client";
import { supabaseClient } from "@/lib/supabaseClient";

type Company = {
  id: string;
  company_code: string;
  name: string;
};

type HesapTuru = "nakit" | "banka" | "kredi_karti" | "pos";
type HareketTuru = "gelir" | "gider" | "tahsilat" | "odeme";
type HareketFiltresi = "son10" | "bugun" | "hafta" | "ay";
type CariTuru = "musteri" | "tedarikci" | "musteri_tedarikci";

type KasaHesabi = {
  id: string;
  company_id: string;
  hesap_adi: string;
  hesap_turu: HesapTuru;
  banka_adi: string | null;
  iban: string | null;
  para_birimi: string;
  acilis_bakiyesi: number;
  aktif: boolean;
};

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

type GelirGiderKategori = {
  id: string;
  kategori_turu: "gelir" | "gider";
  kategori_adi: string;
};

type KasaHareket = {
  id: string;
  company_id: string;
  kasa_hesap_id: string;
  cari_id: string | null;
  kategori_id: string | null;
  hareket_turu: HareketTuru | "transfer_giris" | "transfer_cikis" | "duzeltme";
  islem_tarihi: string;
  aciklama: string | null;
  tutar: number;
  para_birimi: string;
  tahsilat_fis_no: string | null;
  cari_bakiye_once: number | null;
  cari_bakiye_sonra: number | null;
  durum: "taslak" | "tamamlandi" | "iptal";
  created_at: string;
  kasa_hesaplari?:
    | {
        hesap_adi: string;
        hesap_turu: HesapTuru;
      }
    | {
        hesap_adi: string;
        hesap_turu: HesapTuru;
      }[]
    | null;
  cari_hesaplar?:
    | {
        cari_kodu: string;
        unvan: string;
        telefon: string | null;
        bakiye: number | null;
      }
    | {
        cari_kodu: string;
        unvan: string;
        telefon: string | null;
        bakiye: number | null;
      }[]
    | null;
  gelir_gider_kategorileri?:
    | {
        kategori_adi: string;
      }
    | {
        kategori_adi: string;
      }[]
    | null;
};

type KasaHareketView = KasaHareket & {
  kasa_hesabi?: {
    hesap_adi: string;
    hesap_turu: HesapTuru;
  } | null;
  cari?: {
    cari_kodu: string;
    unvan: string;
    telefon: string | null;
    bakiye: number | null;
  } | null;
  kategori?: {
    kategori_adi: string;
  } | null;
};

type KasaForm = {
  hareketTuru: HareketTuru;
  kasaHesapId: string;
  cariId: string;
  kategoriId: string;
  islemTarihi: string;
  tutar: string;
  aciklama: string;
};

type YeniHesapForm = {
  hesapAdi: string;
  hesapTuru: HesapTuru;
  bankaAdi: string;
  iban: string;
  acilisBakiyesi: string;
};

const hareketEtiketleri: Record<HareketTuru, string> = {
  tahsilat: "Tahsilat",
  odeme: "Ödeme",
  gelir: "Gelir",
  gider: "Gider",
};

const whatsappDestekLink =
  "https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20kasa%20tahsilat%20ve%20%C3%B6deme%20i%C5%9Flemleri%20i%C3%A7in%20destek%20istiyorum.";

const hareketAciklamalari: Record<HareketTuru, string> = {
  tahsilat: "Müşteriden para alınır. Kasa artar, müşterinin bakiyesi düşer.",
  odeme: "Tedarikçiye para ödenir. Kasa azalır, ödenecek bakiye düşer.",
  gelir: "Cari seçmeden doğrudan para girişi kaydedilir.",
  gider: "Cari seçmeden doğrudan para çıkışı kaydedilir.",
};

const hesapTuruEtiketleri: Record<HesapTuru, string> = {
  nakit: "Nakit",
  banka: "Banka",
  kredi_karti: "Kredi Kartı",
  pos: "POS",
};

const hareketFiltresiEtiketleri: Record<HareketFiltresi, string> = {
  son10: "Son 10",
  bugun: "Bugün",
  hafta: "Bu Hafta",
  ay: "Bu Ay",
};

function tarihiInputFormatinaCevir(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function bugununTarihi() {
  return tarihiInputFormatinaCevir();
}

function haftaninIlkGunu() {
  const date = new Date();
  const gun = date.getDay();
  const pazartesiFarki = gun === 0 ? -6 : 1 - gun;
  date.setDate(date.getDate() + pazartesiFarki);
  return tarihiInputFormatinaCevir(date);
}

function ayinIlkGunu() {
  const date = new Date();
  date.setDate(1);
  return tarihiInputFormatinaCevir(date);
}

function tarihFormatla(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

function paraFormatla(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);
}

function paraSayiyaCevir(value: string) {
  const temizDeger = value.replace(/\./g, "").replace(",", ".").trim();
  const sayi = Number(temizDeger);

  if (!Number.isFinite(sayi) || sayi < 0) {
    return 0;
  }

  return sayi;
}

function paraGirisiFormatla(value: string) {
  const sadecePara = value.replace(/[^\d,]/g, "");
  const parcalar = sadecePara.split(",");
  const tamKisim = parcalar[0] || "";
  const kurusKisim = parcalar.length > 1 ? parcalar.slice(1).join("").slice(0, 2) : "";

  const formatliTamKisim = tamKisim ? Number(tamKisim).toLocaleString("tr-TR") : "";

  if (parcalar.length > 1) {
    return `${formatliTamKisim},${kurusKisim}`;
  }

  return formatliTamKisim;
}

function bosIseNull(value: string) {
  const temiz = value.trim();
  return temiz.length > 0 ? temiz : null;
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

  if (sadeceRakam.startsWith("90") && sadeceRakam.length === 12) {
    return sadeceRakam;
  }

  if (sadeceRakam.startsWith("0") && sadeceRakam.length === 11) {
    return `90${sadeceRakam.slice(1)}`;
  }

  if (sadeceRakam.length === 10) {
    return `90${sadeceRakam}`;
  }

  return sadeceRakam;
}

function tahsilatFisNo(hareket: KasaHareketView) {
  return hareket.tahsilat_fis_no || `THS-${hareket.id.slice(0, 8).toUpperCase()}`;
}

function hareketCariBakiyesiOnce(hareket: KasaHareketView) {
  const tutar = Number(hareket.tutar || 0);

  if (hareket.cari_bakiye_once !== null && hareket.cari_bakiye_once !== undefined) {
    return Number(hareket.cari_bakiye_once || 0);
  }

  if (hareket.cari_bakiye_sonra !== null && hareket.cari_bakiye_sonra !== undefined) {
    const sonra = Number(hareket.cari_bakiye_sonra || 0);
    if (hareket.hareket_turu === "tahsilat") return sonra + tutar;
    if (hareket.hareket_turu === "odeme") return sonra - tutar;
    return sonra;
  }

  const guncelBakiye = Number(hareket.cari?.bakiye ?? 0);
  if (hareket.hareket_turu === "tahsilat") return guncelBakiye + tutar;
  if (hareket.hareket_turu === "odeme") return guncelBakiye - tutar;

  return guncelBakiye;
}

function hareketCariBakiyesi(hareket: KasaHareketView) {
  if (hareket.cari_bakiye_sonra !== null && hareket.cari_bakiye_sonra !== undefined) {
    return Number(hareket.cari_bakiye_sonra || 0);
  }

  const oncekiBakiye = hareketCariBakiyesiOnce(hareket);
  const tutar = Number(hareket.tutar || 0);

  if (hareket.hareket_turu === "tahsilat") return oncekiBakiye - tutar;
  if (hareket.hareket_turu === "odeme") return oncekiBakiye + tutar;

  return Number(hareket.cari?.bakiye ?? 0);
}

function iliskiyiDuzelt<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) return value[0] || null;
  return value || null;
}

function kasaGirisiMi(hareketTuru: KasaHareket["hareket_turu"]) {
  return hareketTuru === "gelir" || hareketTuru === "tahsilat" || hareketTuru === "transfer_giris";
}

function kasaCikisiMi(hareketTuru: KasaHareket["hareket_turu"]) {
  return hareketTuru === "gider" || hareketTuru === "odeme" || hareketTuru === "transfer_cikis";
}

function cariBakiyeEtiketi(value: number) {
  if (value > 0) return "";
  if (value < 0) return "Ödenecek";
  return "Kapalı";
}

function cariBakiyeRengi(value: number) {
  if (value > 0) return "text-red-600";
  if (value < 0) return "text-amber-600";
  return "text-slate-500";
}

function kasaHareketBasligi(hareketTuru: KasaHareket["hareket_turu"]) {
  if (hareketTuru in hareketEtiketleri) {
    return hareketEtiketleri[hareketTuru as HareketTuru];
  }

  if (hareketTuru === "transfer_giris") return "Transfer Giriş";
  if (hareketTuru === "transfer_cikis") return "Transfer Çıkış";
  return "Düzeltme";
}

export default function KasaPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [kasaHesaplari, setKasaHesaplari] = useState<KasaHesabi[]>([]);
  const [cariler, setCariler] = useState<CariHesap[]>([]);
  const [kategoriler, setKategoriler] = useState<GelirGiderKategori[]>([]);
  const [hareketler, setHareketler] = useState<KasaHareketView[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isAccountSaving, setIsAccountSaving] = useState(false);
  const [isCancelling, setIsCancelling] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [showAccountForm, setShowAccountForm] = useState(false);
  const [cariArama, setCariArama] = useState("");
  const [hareketFiltresi, setHareketFiltresi] = useState<HareketFiltresi>("son10");
  const [tahsilatFisOnizleme, setTahsilatFisOnizleme] = useState<KasaHareketView | null>(null);

  const [form, setForm] = useState<KasaForm>({
    hareketTuru: "tahsilat",
    kasaHesapId: "",
    cariId: "",
    kategoriId: "",
    islemTarihi: bugununTarihi(),
    tutar: "",
    aciklama: "",
  });

  const [accountForm, setAccountForm] = useState<YeniHesapForm>({
    hesapAdi: "",
    hesapTuru: "nakit",
    bankaAdi: "",
    iban: "",
    acilisBakiyesi: "0",
  });

  const kasaBakiyeleri = useMemo(() => {
    const result: Record<string, number> = {};

    kasaHesaplari.forEach((hesap) => {
      result[hesap.id] = Number(hesap.acilis_bakiyesi || 0);
    });

    hareketler.forEach((hareket) => {
      if (hareket.durum !== "tamamlandi") return;

      if (kasaGirisiMi(hareket.hareket_turu)) {
        result[hareket.kasa_hesap_id] =
          (result[hareket.kasa_hesap_id] || 0) + Number(hareket.tutar || 0);
      }

      if (kasaCikisiMi(hareket.hareket_turu)) {
        result[hareket.kasa_hesap_id] =
          (result[hareket.kasa_hesap_id] || 0) - Number(hareket.tutar || 0);
      }
    });

    return result;
  }, [hareketler, kasaHesaplari]);

  const ozet = useMemo(() => {
    let nakit = 0;
    let banka = 0;
    let toplam = 0;
    let bugunGiris = 0;
    let bugunCikis = 0;
    const bugun = bugununTarihi();

    kasaHesaplari.forEach((hesap) => {
      const bakiye = kasaBakiyeleri[hesap.id] || 0;
      toplam += bakiye;

      if (hesap.hesap_turu === "nakit") {
        nakit += bakiye;
      } else {
        banka += bakiye;
      }
    });

    hareketler.forEach((hareket) => {
      if (hareket.durum !== "tamamlandi" || hareket.islem_tarihi !== bugun) return;

      if (kasaGirisiMi(hareket.hareket_turu)) {
        bugunGiris += Number(hareket.tutar || 0);
      }

      if (kasaCikisiMi(hareket.hareket_turu)) {
        bugunCikis += Number(hareket.tutar || 0);
      }
    });

    return { nakit, banka, toplam, bugunGiris, bugunCikis };
  }, [hareketler, kasaBakiyeleri, kasaHesaplari]);

  const filtreliCariler = useMemo(() => {
    if (form.hareketTuru === "tahsilat") {
      return cariler.filter(
        (cari) => cari.cari_turu === "musteri" || cari.cari_turu === "musteri_tedarikci",
      );
    }

    if (form.hareketTuru === "odeme") {
      return cariler.filter(
        (cari) => cari.cari_turu === "tedarikci" || cari.cari_turu === "musteri_tedarikci",
      );
    }

    return [];
  }, [cariler, form.hareketTuru]);

  const aramayaGoreFiltreliCariler = useMemo(() => {
    if (form.cariId) {
      return [];
    }

    const arama = metniAraFormatinaCevir(cariArama);

    if (!arama) {
      return filtreliCariler.slice(0, 6);
    }

    const aramaKelimeleri = arama.split(" ").filter(Boolean);

    return filtreliCariler
      .filter((cari) => {
        const aranacakMetin = metniAraFormatinaCevir(
          `${cari.cari_kodu} ${cari.unvan} ${cari.telefon || ""}`,
        );

        return aramaKelimeleri.every((kelime) => aranacakMetin.includes(kelime));
      })
      .slice(0, 8);
  }, [cariArama, filtreliCariler, form.cariId]);

  const filtreliKategoriler = useMemo(() => {
    if (form.hareketTuru === "gelir" || form.hareketTuru === "gider") {
      return kategoriler.filter((kategori) => kategori.kategori_turu === form.hareketTuru);
    }

    return [];
  }, [form.hareketTuru, kategoriler]);

  const gorunenHareketler = useMemo(() => {
    if (hareketFiltresi === "son10") {
      return hareketler.slice(0, 10);
    }

    const bugun = bugununTarihi();
    const haftaBaslangici = haftaninIlkGunu();
    const ayBaslangici = ayinIlkGunu();

    return hareketler.filter((hareket) => {
      if (hareketFiltresi === "bugun") return hareket.islem_tarihi === bugun;
      if (hareketFiltresi === "hafta") return hareket.islem_tarihi >= haftaBaslangici;
      if (hareketFiltresi === "ay") return hareket.islem_tarihi >= ayBaslangici;
      return true;
    });
  }, [hareketFiltresi, hareketler]);

  const seciliCari = useMemo(
    () => cariler.find((cari) => cari.id === form.cariId) || null,
    [cariler, form.cariId],
  );

  const formTutari = paraSayiyaCevir(form.tutar);
  const mevcutCariBakiye = Number(seciliCari?.bakiye || 0);

  const islemSonrasiCariBakiye = useMemo(() => {
    if (!seciliCari) return 0;
    if (form.hareketTuru === "tahsilat") return mevcutCariBakiye - formTutari;
    if (form.hareketTuru === "odeme") return mevcutCariBakiye + formTutari;
    return mevcutCariBakiye;
  }, [form.hareketTuru, formTutari, mevcutCariBakiye, seciliCari]);

  async function verileriYukle(mesajlariTemizle = true) {
    setIsLoading(true);
    setErrorMessage("");

    if (mesajlariTemizle) {
      setSuccessMessage("");
    }

    try {
      const context = await getOnMuhasebeClientContext();
      const companyData = context.company;

      setCompany(companyData as Company);

      const { data: hesapData, error: hesapError } = await supabaseClient
        .from("kasa_hesaplari")
        .select("id, company_id, hesap_adi, hesap_turu, banka_adi, iban, para_birimi, acilis_bakiyesi, aktif")
        .eq("company_id", companyData.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: true });

      if (hesapError) {
        throw new Error("Kasa hesapları alınamadı.");
      }

      let hesaplar = (hesapData || []) as KasaHesabi[];

      if (hesaplar.length === 0) {
        const { data: createdAccounts, error: createAccountError } = await supabaseClient
          .from("kasa_hesaplari")
          .insert([
            {
              company_id: companyData.id,
              hesap_adi: "Nakit Kasa",
              hesap_turu: "nakit",
              para_birimi: "TRY",
              acilis_bakiyesi: 0,
            },
            {
              company_id: companyData.id,
              hesap_adi: "Banka Hesabı",
              hesap_turu: "banka",
              para_birimi: "TRY",
              acilis_bakiyesi: 0,
            },
          ])
          .select("id, company_id, hesap_adi, hesap_turu, banka_adi, iban, para_birimi, acilis_bakiyesi, aktif");

        if (createAccountError) {
          throw new Error("Varsayılan kasa hesapları oluşturulamadı.");
        }

        hesaplar = (createdAccounts || []) as KasaHesabi[];
      }

      setKasaHesaplari(hesaplar);
      setForm((current) => ({
        ...current,
        kasaHesapId: current.kasaHesapId || hesaplar[0]?.id || "",
      }));

      const [cariResponse, kategoriResponse, hareketResponse] = await Promise.all([
        supabaseClient
          .from("cari_hesaplar")
          .select("id, company_id, cari_kodu, cari_turu, unvan, telefon, bakiye, aktif")
          .eq("company_id", companyData.id)
          .eq("aktif", true)
          .is("deleted_at", null)
          .order("unvan", { ascending: true }),
        supabaseClient
          .from("gelir_gider_kategorileri")
          .select("id, kategori_turu, kategori_adi")
          .eq("company_id", companyData.id)
          .eq("aktif", true)
          .is("deleted_at", null)
          .order("kategori_adi", { ascending: true }),
        supabaseClient
          .from("kasa_hareketleri")
          .select(
            "id, company_id, kasa_hesap_id, cari_id, kategori_id, hareket_turu, islem_tarihi, aciklama, tutar, para_birimi, tahsilat_fis_no, cari_bakiye_once, cari_bakiye_sonra, durum, created_at, kasa_hesaplari(hesap_adi, hesap_turu), cari_hesaplar(cari_kodu, unvan, telefon, bakiye), gelir_gider_kategorileri(kategori_adi)",
          )
          .eq("company_id", companyData.id)
          .order("islem_tarihi", { ascending: false })
          .order("created_at", { ascending: false })
          .limit(100),
      ]);

      if (cariResponse.error) throw new Error("Cariler alınamadı.");
      if (kategoriResponse.error) throw new Error("Gelir/gider kategorileri alınamadı.");
      if (hareketResponse.error) throw new Error("Kasa hareketleri alınamadı.");

      setCariler((cariResponse.data || []) as CariHesap[]);
      setKategoriler((kategoriResponse.data || []) as GelirGiderKategori[]);
      setHareketler(
        ((hareketResponse.data || []) as KasaHareket[]).map((hareket) => ({
          ...hareket,
          kasa_hesabi: iliskiyiDuzelt(hareket.kasa_hesaplari),
          cari: iliskiyiDuzelt(hareket.cari_hesaplar),
          kategori: iliskiyiDuzelt(hareket.gelir_gider_kategorileri),
        })),
      );
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Kasa ekranı yüklenirken hata oluştu.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    verileriYukle();
  }, []);

  function formGuncelle<K extends keyof KasaForm>(field: K, value: KasaForm[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function hesapFormuGuncelle<K extends keyof YeniHesapForm>(
    field: K,
    value: YeniHesapForm[K],
  ) {
    setAccountForm((current) => ({ ...current, [field]: value }));
  }

  function tutarGuncelle(event: ChangeEvent<HTMLInputElement>) {
    formGuncelle("tutar", paraGirisiFormatla(event.target.value));
  }

  function hesapAcilisBakiyesiGuncelle(event: ChangeEvent<HTMLInputElement>) {
    hesapFormuGuncelle("acilisBakiyesi", paraGirisiFormatla(event.target.value));
  }

  function cariAramaGuncelle(event: ChangeEvent<HTMLInputElement>) {
    setCariArama(event.target.value);

    if (form.cariId) {
      formGuncelle("cariId", "");
    }
  }

  function cariSec(cari: CariHesap) {
    formGuncelle("cariId", cari.id);
    setCariArama("");
    setErrorMessage("");
  }

  function cariSecimiTemizle() {
    formGuncelle("cariId", "");
    setCariArama("");
  }

  function hareketTuruSec(hareketTuru: HareketTuru) {
    setSuccessMessage("");
    setErrorMessage("");
    setCariArama("");
    setForm((current) => ({
      ...current,
      hareketTuru,
      cariId: "",
      kategoriId: "",
    }));
  }

  async function islemiKaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    if (!form.kasaHesapId) {
      setErrorMessage("Nakit veya banka hesabı seçmelisin.");
      return;
    }

    if ((form.hareketTuru === "tahsilat" || form.hareketTuru === "odeme") && !form.cariId) {
      setErrorMessage("Tahsilat ve ödeme işlemlerinde cari seçmelisin.");
      return;
    }

    const tutar = paraSayiyaCevir(form.tutar);

    if (tutar <= 0) {
      setErrorMessage("Tutar 0'dan büyük olmalı.");
      return;
    }

    setIsSaving(true);

    try {
      const { error } = await supabaseClient.rpc("kasa_hareketi_ekle", {
        p_company_id: company.id,
        p_kasa_hesap_id: form.kasaHesapId,
        p_hareket_turu: form.hareketTuru,
        p_tutar: tutar,
        p_islem_tarihi: form.islemTarihi,
        p_cari_id: form.cariId || null,
        p_kategori_id: form.kategoriId || null,
        p_aciklama: form.aciklama.trim() || null,
        p_para_birimi: "TRY",
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Kasa işlemi kaydedildi.");
      setCariArama("");
      setForm((current) => ({
        ...current,
        cariId: "",
        kategoriId: "",
        tutar: "",
        aciklama: "",
      }));
      await verileriYukle(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kasa işlemi kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function hesapOlustur(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    if (!accountForm.hesapAdi.trim()) {
      setErrorMessage("Hesap adı zorunlu.");
      return;
    }

    setIsAccountSaving(true);

    try {
      const { error } = await supabaseClient.from("kasa_hesaplari").insert({
        company_id: company.id,
        hesap_adi: accountForm.hesapAdi.trim(),
        hesap_turu: accountForm.hesapTuru,
        banka_adi: accountForm.hesapTuru === "nakit" ? null : bosIseNull(accountForm.bankaAdi),
        iban: accountForm.hesapTuru === "nakit" ? null : bosIseNull(accountForm.iban),
        para_birimi: "TRY",
        acilis_bakiyesi: paraSayiyaCevir(accountForm.acilisBakiyesi),
        aktif: true,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Kasa/banka hesabı eklendi.");
      setAccountForm({
        hesapAdi: "",
        hesapTuru: "nakit",
        bankaAdi: "",
        iban: "",
        acilisBakiyesi: "0",
      });
      setShowAccountForm(false);
      await verileriYukle(false);
    } catch (error) {
      const mesaj = error instanceof Error ? error.message : "Hesap eklenemedi.";
      setErrorMessage(
        mesaj.includes("duplicate") || mesaj.includes("unique")
          ? "Bu hesap adı zaten kullanılıyor. Farklı bir hesap adı gir."
          : mesaj,
      );
    } finally {
      setIsAccountSaving(false);
    }
  }

  async function hareketiIptalEt(hareket: KasaHareketView) {
    if (!company || hareket.durum === "iptal") return;

    const onay = window.confirm("Bu kasa hareketi iptal edilsin mi? Cari bakiyesi de geri alınır.");
    if (!onay) return;

    setIsCancelling(hareket.id);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const { error } = await supabaseClient.rpc("kasa_hareketi_iptal_et", {
        p_company_id: company.id,
        p_kasa_hareket_id: hareket.id,
      });

      if (error) {
        throw error;
      }

      setSuccessMessage("Kasa hareketi iptal edildi.");
      await verileriYukle(false);
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Kasa hareketi iptal edilemedi.");
    } finally {
      setIsCancelling(null);
    }
  }

  function tahsilatFisMesajiOlustur(hareket: KasaHareketView) {
    const oncekiBakiye = hareketCariBakiyesiOnce(hareket);
    const kalanBakiye = hareketCariBakiyesi(hareket);

    return [
      `${company?.name || "Sitemix Ön Muhasebe"} - Tahsilat Fişi`,
      `Fiş No: ${tahsilatFisNo(hareket)}`,
      `Tarih: ${tarihFormatla(hareket.islem_tarihi)}`,
      `Cari: ${hareket.cari?.unvan || "-"}`,
      `İşlem Öncesi Bakiye: ${cariBakiyeEtiketi(oncekiBakiye)} ${paraFormatla(Math.abs(oncekiBakiye))}`,
      `Tahsilat: ${paraFormatla(Number(hareket.tutar || 0))}`,
      `Kalan Bakiye: ${cariBakiyeEtiketi(kalanBakiye)} ${paraFormatla(Math.abs(kalanBakiye))}`,
      hareket.aciklama ? `Not: ${hareket.aciklama}` : "",
    ]
      .filter(Boolean)
      .join("\n");
  }

  function tahsilatFisiHtmlOlustur(hareket: KasaHareketView) {
    const oncekiBakiye = hareketCariBakiyesiOnce(hareket);
    const kalanBakiye = hareketCariBakiyesi(hareket);
    const fisNo = tahsilatFisNo(hareket);

    return `
      <!doctype html>
      <html lang="tr">
        <head>
          <meta charset="utf-8" />
          <title>${fisNo}</title>
          <style>
            * { box-sizing: border-box; }
            body { margin: 0; padding: 32px; font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; }
            .fis { max-width: 720px; margin: 0 auto; background: #fff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 28px; }
            .ust { display: flex; justify-content: space-between; gap: 24px; border-bottom: 2px solid #0f172a; padding-bottom: 18px; }
            .firma { font-size: 22px; font-weight: 800; }
            .etiket { margin-top: 4px; font-size: 12px; color: #64748b; font-weight: 700; }
            .baslik { text-align: right; }
            .baslik h1 { margin: 0; font-size: 24px; }
            .baslik p { margin: 8px 0 0; font-size: 13px; color: #64748b; font-weight: 700; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; margin-top: 24px; }
            .kutu { border: 1px solid #e2e8f0; border-radius: 14px; padding: 14px; }
            .kutu small { display: block; color: #64748b; font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .kutu strong { display: block; margin-top: 8px; font-size: 16px; }
            .tutar { margin-top: 24px; border-radius: 18px; background: #ecfdf5; padding: 20px; }
            .tutar small { display: block; color: #047857; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: .08em; }
            .tutar strong { display: block; margin-top: 8px; color: #047857; font-size: 32px; }
            .not { margin-top: 20px; border-radius: 14px; background: #f1f5f9; padding: 14px; color: #475569; font-size: 13px; line-height: 1.6; }
            .imza { display: grid; grid-template-columns: 1fr 1fr; gap: 36px; margin-top: 48px; }
            .imza-kutu { min-height: 112px; border: 1px solid #cbd5e1; border-radius: 14px; padding: 14px; }
            .imza-baslik { color: #0f172a; font-size: 13px; font-weight: 800; }
            .imza-ad { margin-top: 8px; color: #64748b; font-size: 12px; font-weight: 700; }
            .imza-cizgi { margin-top: 42px; border-top: 1px solid #94a3b8; padding-top: 8px; color: #94a3b8; font-size: 11px; font-weight: 700; text-align: center; }
            .alt { margin-top: 28px; color: #94a3b8; font-size: 11px; text-align: center; }
            @media print { body { background: #fff; padding: 0; } .fis { border: 0; border-radius: 0; } }
          </style>
        </head>
        <body>
          <div class="fis">
            <div class="ust">
              <div>
                <div class="firma">${company?.name || "Sitemix Ön Muhasebe"}</div>
                <div class="etiket">Firma Kodu: ${company?.company_code || "-"}</div>
              </div>
              <div class="baslik">
                <h1>Tahsilat Fişi</h1>
                <p>Fiş No: ${fisNo}</p>
              </div>
            </div>

            <div class="grid">
              <div class="kutu"><small>Tarih</small><strong>${tarihFormatla(hareket.islem_tarihi)}</strong></div>
              <div class="kutu"><small>Kasa / Banka</small><strong>${hareket.kasa_hesabi?.hesap_adi || "Kasa"}</strong></div>
              <div class="kutu"><small>Cari</small><strong>${hareket.cari?.unvan || "-"}</strong></div>
              <div class="kutu"><small>Cari Kodu</small><strong>${hareket.cari?.cari_kodu || "-"}</strong></div>
              <div class="kutu"><small>İşlem Öncesi Bakiye</small><strong>${cariBakiyeEtiketi(oncekiBakiye)} ${paraFormatla(Math.abs(oncekiBakiye))}</strong></div>
              <div class="kutu"><small>Kalan Bakiye</small><strong>${cariBakiyeEtiketi(kalanBakiye)} ${paraFormatla(Math.abs(kalanBakiye))}</strong></div>
            </div>

            <div class="tutar">
              <small>Tahsil Edilen Tutar</small>
              <strong>${paraFormatla(Number(hareket.tutar || 0))}</strong>
            </div>

            ${hareket.aciklama ? `<div class="not"><strong>Not:</strong> ${hareket.aciklama}</div>` : ""}

            <div class="imza">
              <div class="imza-kutu">
                <div class="imza-baslik">Teslim Eden</div>
                <div class="imza-ad">${company?.name || "Firma Yetkilisi"}</div>
                <div class="imza-cizgi">Ad Soyad / İmza</div>
              </div>
              <div class="imza-kutu">
                <div class="imza-baslik">Teslim Alan</div>
                <div class="imza-ad">${hareket.cari?.unvan || "Müşteri"}</div>
                <div class="imza-cizgi">Ad Soyad / İmza</div>
              </div>
            </div>

            <div class="alt">Bu fiş Sitemix Ön Muhasebe üzerinden oluşturulmuştur.</div>
          </div>
        </body>
      </html>
    `;
  }

  function tahsilatFisiPdfAc(hareket: KasaHareketView) {
    const pencere = window.open("", "_blank", "width=820,height=900");

    if (!pencere) {
      setErrorMessage("PDF penceresi açılamadı. Tarayıcı pop-up iznini kontrol et.");
      return;
    }

    pencere.document.open();
    pencere.document.write(tahsilatFisiHtmlOlustur(hareket));
    pencere.document.close();
    pencere.focus();

    setTimeout(() => {
      pencere.print();
    }, 300);
  }

  function tahsilatFisiniWhatsappGonder(hareket: KasaHareketView) {
    const telefon = telefonuWhatsappFormatinaCevir(hareket.cari?.telefon);

    if (!telefon) {
      setErrorMessage("Bu caride telefon numarası yok. Önce cari kartına telefon eklemelisin.");
      return;
    }

    const mesaj = tahsilatFisMesajiOlustur(hareket);
    window.open(`https://wa.me/${telefon}?text=${encodeURIComponent(mesaj)}`, "_blank");
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-600" />
          <p className="mt-5 text-sm font-black text-slate-600">Kasa ekranı yükleniyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] pb-24 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/on-muhasebe/panel" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-600 text-sm font-black text-white shadow-lg shadow-emerald-200">
              ₺
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-[-0.03em]">Kasa</span>
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
              className="hidden min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200 sm:inline-flex"
            >
              Yenile
            </button>
            <button
              type="button"
              onClick={() => setShowAccountForm((value) => !value)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
            >
              Hesap Ekle
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-300 sm:p-8">
          <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-emerald-500/30 blur-3xl" />
          <div className="absolute bottom-[-110px] left-[-80px] h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">Kasa Yönetimi</p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                Nakit, banka ve cari tahsilatları
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-white/60">
                Tahsilat ve ödeme işlemleri kasa hareketi oluşturur. Cari seçiliyse bakiye otomatik güncellenir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
              <div className="rounded-[1.35rem] bg-white/10 p-4">
                <p className="text-xs font-black text-white/40">Toplam Kasa</p>
                <p className="mt-2 text-2xl font-black text-white">{paraFormatla(ozet.toplam)}</p>
              </div>
              <div className="rounded-[1.35rem] bg-white/10 p-4">
                <p className="text-xs font-black text-white/40">Bugün Net</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {paraFormatla(ozet.bugunGiris - ozet.bugunCikis)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Nakit</p>
            <p className="mt-3 text-2xl font-black tracking-[-0.05em]">{paraFormatla(ozet.nakit)}</p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Banka / POS</p>
            <p className="mt-3 text-2xl font-black tracking-[-0.05em]">{paraFormatla(ozet.banka)}</p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Bugün Giriş</p>
            <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-emerald-600">{paraFormatla(ozet.bugunGiris)}</p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Bugün Çıkış</p>
            <p className="mt-3 text-2xl font-black tracking-[-0.05em] text-red-600">{paraFormatla(ozet.bugunCikis)}</p>
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

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Yeni İşlem</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Kasa hareketi ekle</h2>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                  Müşteriden para alırken tahsilat, tedarikçiye para verirken ödeme seç.
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-2 sm:grid-cols-4">
              {(["tahsilat", "odeme", "gelir", "gider"] as HareketTuru[]).map((hareketTuru) => {
                const aktif = form.hareketTuru === hareketTuru;
                return (
                  <button
                    key={hareketTuru}
                    type="button"
                    onClick={() => hareketTuruSec(hareketTuru)}
                    className={[
                      "rounded-[1.25rem] border px-4 py-4 text-left transition",
                      aktif
                        ? "border-emerald-600 bg-emerald-600 text-white shadow-lg shadow-emerald-100"
                        : "border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-300",
                    ].join(" ")}
                  >
                    <span className="block text-sm font-black">{hareketEtiketleri[hareketTuru]}</span>
                    <span className={aktif ? "mt-1 block text-xs font-bold text-white/70" : "mt-1 block text-xs font-bold text-slate-400"}>
                      {hareketTuru === "tahsilat" || hareketTuru === "gelir" ? "Para girişi" : "Para çıkışı"}
                    </span>
                  </button>
                );
              })}
            </div>

            <p className="mt-4 rounded-[1.25rem] bg-slate-100 p-4 text-sm font-bold leading-6 text-slate-600">
              {hareketAciklamalari[form.hareketTuru]}
            </p>

            <form onSubmit={islemiKaydet} className="mt-5 grid gap-4">
              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Hesap</span>
                  <select
                    value={form.kasaHesapId}
                    onChange={(event) => formGuncelle("kasaHesapId", event.target.value)}
                    className="min-h-[52px] rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500"
                  >
                    {kasaHesaplari.map((hesap) => (
                      <option key={hesap.id} value={hesap.id}>
                        {hesap.hesap_adi} - {hesapTuruEtiketleri[hesap.hesap_turu]}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tarih</span>
                  <input
                    type="date"
                    value={form.islemTarihi}
                    onChange={(event) => formGuncelle("islemTarihi", event.target.value)}
                    className="min-h-[52px] rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500"
                  />
                </label>
              </div>

              {form.hareketTuru === "tahsilat" || form.hareketTuru === "odeme" ? (
                <div className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Cari</span>

                  {seciliCari ? (
                    <div className="rounded-[1.25rem] border border-emerald-200 bg-emerald-50 p-4">
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.14em] text-emerald-700">
                            Seçilen Cari
                          </p>
                          <p className="mt-1 text-base font-black text-slate-900">{seciliCari.unvan}</p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {seciliCari.cari_kodu}
                            {seciliCari.telefon ? ` • ${seciliCari.telefon}` : ""}
                          </p>
                        </div>

                        <div className="flex items-center justify-between gap-3 sm:block sm:text-right">
                          <div>
                            <p className={["text-xs font-black", cariBakiyeRengi(Number(seciliCari.bakiye || 0))].join(" ")}>
                              {cariBakiyeEtiketi(Number(seciliCari.bakiye || 0))}
                            </p>
                            <p className="mt-1 text-sm font-black text-slate-900">
                              {paraFormatla(Math.abs(Number(seciliCari.bakiye || 0)))}
                            </p>
                          </div>

                          <button
                            type="button"
                            onClick={cariSecimiTemizle}
                            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm transition hover:bg-slate-100"
                          >
                            Değiştir
                          </button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <>
                      <input
                        value={cariArama}
                        onChange={cariAramaGuncelle}
                        placeholder={
                          form.hareketTuru === "tahsilat"
                            ? "Müşteri adı, kodu veya telefon yaz"
                            : "Tedarikçi adı, kodu veya telefon yaz"
                        }
                        autoComplete="off"
                        className="min-h-[52px] rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500"
                      />

                      <div className="max-h-72 overflow-y-auto rounded-[1.25rem] border border-slate-200 bg-slate-50 p-2">
                        {aramayaGoreFiltreliCariler.length === 0 ? (
                          <div className="rounded-[1rem] bg-white p-4 text-sm font-bold text-slate-500">
                            {cariArama.trim()
                              ? "Cari bulunamadı. Farklı bir kelime yaz."
                              : form.hareketTuru === "tahsilat"
                                ? "Tahsilat için müşteri arayabilirsin."
                                : "Ödeme için tedarikçi arayabilirsin."}
                          </div>
                        ) : null}

                        {aramayaGoreFiltreliCariler.map((cari) => {
                          const bakiye = Number(cari.bakiye || 0);

                          return (
                            <button
                              key={cari.id}
                              type="button"
                              onClick={() => cariSec(cari)}
                              className="mb-2 flex w-full items-start justify-between gap-3 rounded-[1rem] bg-white p-3 text-left text-slate-700 transition last:mb-0 hover:bg-emerald-50"
                            >
                              <span>
                                <span className="block text-sm font-black">{cari.unvan}</span>
                                <span className="mt-1 block text-xs font-bold text-slate-400">
                                  {cari.cari_kodu}
                                  {cari.telefon ? ` • ${cari.telefon}` : ""}
                                </span>
                              </span>

                              <span className={["shrink-0 text-right text-xs font-black", cariBakiyeRengi(bakiye)].join(" ")}>
                                {cariBakiyeEtiketi(bakiye)}
                                <span className="block">{paraFormatla(Math.abs(bakiye))}</span>
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              {form.hareketTuru === "gelir" || form.hareketTuru === "gider" ? (
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Kategori</span>
                  <select
                    value={form.kategoriId}
                    onChange={(event) => formGuncelle("kategoriId", event.target.value)}
                    className="min-h-[52px] rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500"
                  >
                    <option value="">Kategori seçmeden devam et</option>
                    {filtreliKategoriler.map((kategori) => (
                      <option key={kategori.id} value={kategori.id}>
                        {kategori.kategori_adi}
                      </option>
                    ))}
                  </select>
                </label>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tutar</span>
                  <input
                    value={form.tutar}
                    onChange={tutarGuncelle}
                    inputMode="decimal"
                    placeholder="1.500"
                    className="min-h-[52px] rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Kısa Not</span>
                  <input
                    value={form.aciklama}
                    onChange={(event) => formGuncelle("aciklama", event.target.value)}
                    placeholder="Örn: Haziran tahsilatı"
                    className="min-h-[52px] rounded-[1.25rem] border border-slate-200 bg-white px-4 text-sm font-black outline-none transition focus:border-emerald-500"
                  />
                </label>
              </div>

              {seciliCari ? (
                <div className="grid gap-3 rounded-[1.5rem] bg-slate-100 p-4 sm:grid-cols-2">
                  <div>
                    <p className="text-xs font-black text-slate-400">Mevcut Cari Bakiye</p>
                    <p className={["mt-1 text-lg font-black", cariBakiyeRengi(mevcutCariBakiye)].join(" ")}>
                      {cariBakiyeEtiketi(mevcutCariBakiye)} {paraFormatla(Math.abs(mevcutCariBakiye))}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-black text-slate-400">İşlem Sonrası</p>
                    <p className={["mt-1 text-lg font-black", cariBakiyeRengi(islemSonrasiCariBakiye)].join(" ")}>
                      {cariBakiyeEtiketi(islemSonrasiCariBakiye)} {paraFormatla(Math.abs(islemSonrasiCariBakiye))}
                    </p>
                  </div>
                </div>
              ) : null}

              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Kaydediliyor..." : "İşlemi Kaydet"}
              </button>
            </form>
          </div>

          <div className="grid gap-5">
            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Hesaplar</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Nakit ve Banka</h2>
                </div>
              </div>

              {showAccountForm ? (
                <form onSubmit={hesapOlustur} className="mt-5 grid gap-3 rounded-[1.5rem] bg-slate-100 p-4">
                  <input
                    value={accountForm.hesapAdi}
                    onChange={(event) => hesapFormuGuncelle("hesapAdi", event.target.value)}
                    placeholder="Hesap adı"
                    className="min-h-[48px] rounded-[1rem] border border-transparent bg-white px-4 text-sm font-black outline-none focus:border-emerald-500"
                  />

                  <select
                    value={accountForm.hesapTuru}
                    onChange={(event) => hesapFormuGuncelle("hesapTuru", event.target.value as HesapTuru)}
                    className="min-h-[48px] rounded-[1rem] border border-transparent bg-white px-4 text-sm font-black outline-none focus:border-emerald-500"
                  >
                    <option value="nakit">Nakit</option>
                    <option value="banka">Banka</option>
                    <option value="pos">POS</option>
                    <option value="kredi_karti">Kredi Kartı</option>
                  </select>

                  {accountForm.hesapTuru !== "nakit" ? (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <input
                        value={accountForm.bankaAdi}
                        onChange={(event) => hesapFormuGuncelle("bankaAdi", event.target.value)}
                        placeholder="Banka adı"
                        className="min-h-[48px] rounded-[1rem] border border-transparent bg-white px-4 text-sm font-black outline-none focus:border-emerald-500"
                      />
                      <input
                        value={accountForm.iban}
                        onChange={(event) => hesapFormuGuncelle("iban", event.target.value)}
                        placeholder="IBAN"
                        className="min-h-[48px] rounded-[1rem] border border-transparent bg-white px-4 text-sm font-black outline-none focus:border-emerald-500"
                      />
                    </div>
                  ) : null}

                  <input
                    value={accountForm.acilisBakiyesi}
                    onChange={hesapAcilisBakiyesiGuncelle}
                    inputMode="decimal"
                    placeholder="Açılış bakiyesi"
                    className="min-h-[48px] rounded-[1rem] border border-transparent bg-white px-4 text-sm font-black outline-none focus:border-emerald-500"
                  />

                  <button
                    type="submit"
                    disabled={isAccountSaving}
                    className="min-h-[48px] rounded-full bg-slate-950 px-5 text-sm font-black text-white disabled:opacity-60"
                  >
                    {isAccountSaving ? "Ekleniyor..." : "Hesabı Kaydet"}
                  </button>
                </form>
              ) : null}

              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                {kasaHesaplari.map((hesap) => (
                  <div key={hesap.id} className="rounded-[1.5rem] bg-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{hesap.hesap_adi}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {hesapTuruEtiketleri[hesap.hesap_turu]}
                          {hesap.banka_adi ? ` • ${hesap.banka_adi}` : ""}
                        </p>
                      </div>
                      <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-600">
                        {hesap.para_birimi}
                      </span>
                    </div>
                    <p className="mt-4 text-2xl font-black tracking-[-0.05em]">
                      {paraFormatla(kasaBakiyeleri[hesap.id] || 0)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Son İşlemler</p>
                  <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Hareketler</h2>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                  {(["son10", "bugun", "hafta", "ay"] as HareketFiltresi[]).map((filtre) => {
                    const aktif = hareketFiltresi === filtre;

                    return (
                      <button
                        key={filtre}
                        type="button"
                        onClick={() => setHareketFiltresi(filtre)}
                        className={[
                          "min-h-10 rounded-full px-3 text-xs font-black transition",
                          aktif ? "bg-slate-950 text-white" : "bg-slate-100 text-slate-500 hover:bg-slate-200",
                        ].join(" ")}
                      >
                        {hareketFiltresiEtiketleri[filtre]}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                {gorunenHareketler.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-slate-100 p-5 text-sm font-bold text-slate-500">
                    Bu filtreye uygun kasa hareketi yok.
                  </div>
                ) : null}

                {gorunenHareketler.map((hareket) => {
                  const giris = kasaGirisiMi(hareket.hareket_turu);
                  const iptal = hareket.durum === "iptal";

                  return (
                    <div key={hareket.id} className={iptal ? "rounded-[1.5rem] bg-slate-50 p-4 opacity-60" : "rounded-[1.5rem] bg-slate-100 p-4"}>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-black">
                            {kasaHareketBasligi(hareket.hareket_turu)}
                            {iptal ? " / İptal" : ""}
                          </p>
                          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                            {tarihFormatla(hareket.islem_tarihi)} • {hareket.kasa_hesabi?.hesap_adi || "Kasa"}
                            {hareket.cari ? ` • ${hareket.cari.unvan}` : ""}
                            {hareket.kategori ? ` • ${hareket.kategori.kategori_adi}` : ""}
                          </p>
                        </div>
                        <p className={["shrink-0 text-base font-black", giris ? "text-emerald-600" : "text-red-600"].join(" ")}>
                          {giris ? "+" : "-"}{paraFormatla(Number(hareket.tutar || 0))}
                        </p>
                      </div>

                      {hareket.aciklama ? (
                        <p className="mt-3 rounded-[1rem] bg-white p-3 text-xs font-bold leading-5 text-slate-500">
                          {hareket.aciklama}
                        </p>
                      ) : null}

                      {!iptal ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {hareket.hareket_turu === "tahsilat" && hareket.cari ? (
                            <button
                              type="button"
                              onClick={() => setTahsilatFisOnizleme(hareket)}
                              className="rounded-full bg-emerald-600 px-4 py-2 text-xs font-black text-white transition hover:bg-emerald-700"
                            >
                              Tahsilat Fişi
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => hareketiIptalEt(hareket)}
                            disabled={isCancelling === hareket.id}
                            className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500 transition hover:text-red-600 disabled:opacity-50"
                          >
                            {isCancelling === hareket.id ? "İptal ediliyor..." : "İptal Et"}
                          </button>
                        </div>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {tahsilatFisOnizleme ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 py-5 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">Ön İzleme</p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.05em]">Tahsilat Fişi</h3>
                <p className="mt-1 text-xs font-bold text-slate-400">
                  Fiş No: {tahsilatFisNo(tahsilatFisOnizleme)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setTahsilatFisOnizleme(null)}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>

            <div className="mt-5 rounded-[1.5rem] border border-slate-200 bg-slate-50 p-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Cari</p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {tahsilatFisOnizleme.cari?.unvan || "-"}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {tahsilatFisOnizleme.cari?.cari_kodu || "-"}
                    {tahsilatFisOnizleme.cari?.telefon ? ` • ${tahsilatFisOnizleme.cari.telefon}` : ""}
                  </p>
                </div>

                <div className="rounded-[1rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Tarih / Hesap</p>
                  <p className="mt-1 text-sm font-black text-slate-900">
                    {tarihFormatla(tahsilatFisOnizleme.islem_tarihi)}
                  </p>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    {tahsilatFisOnizleme.kasa_hesabi?.hesap_adi || "Kasa"}
                  </p>
                </div>

                <div className="rounded-[1rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">İşlem Öncesi Bakiye</p>
                  <p className={["mt-1 text-xl font-black", cariBakiyeRengi(hareketCariBakiyesiOnce(tahsilatFisOnizleme))].join(" ")}>
                    {cariBakiyeEtiketi(hareketCariBakiyesiOnce(tahsilatFisOnizleme))} {paraFormatla(Math.abs(hareketCariBakiyesiOnce(tahsilatFisOnizleme)))}
                  </p>
                </div>

                <div className="rounded-[1rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Tahsilat</p>
                  <p className="mt-1 text-xl font-black text-emerald-600">
                    {paraFormatla(Number(tahsilatFisOnizleme.tutar || 0))}
                  </p>
                </div>

                <div className="rounded-[1rem] bg-white p-4 sm:col-span-2">
                  <p className="text-xs font-black text-slate-400">Kalan Bakiye</p>
                  <p className={["mt-1 text-xl font-black", cariBakiyeRengi(hareketCariBakiyesi(tahsilatFisOnizleme))].join(" ")}>
                    {cariBakiyeEtiketi(hareketCariBakiyesi(tahsilatFisOnizleme))} {paraFormatla(Math.abs(hareketCariBakiyesi(tahsilatFisOnizleme)))}
                  </p>
                </div>
              </div>

              {tahsilatFisOnizleme.aciklama ? (
                <div className="mt-3 rounded-[1rem] bg-white p-4 text-sm font-bold leading-6 text-slate-500">
                  {tahsilatFisOnizleme.aciklama}
                </div>
              ) : null}
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="min-h-28 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Teslim Eden</p>
                <p className="mt-2 text-sm font-black text-slate-900">{company?.name || "Firma Yetkilisi"}</p>
                <div className="mt-8 border-t border-slate-300 pt-2 text-center text-xs font-bold text-slate-400">
                  Ad Soyad / İmza
                </div>
              </div>

              <div className="min-h-28 rounded-[1.25rem] border border-slate-200 bg-white p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Teslim Alan</p>
                <p className="mt-2 text-sm font-black text-slate-900">{tahsilatFisOnizleme.cari?.unvan || "Müşteri"}</p>
                <div className="mt-8 border-t border-slate-300 pt-2 text-center text-xs font-bold text-slate-400">
                  Ad Soyad / İmza
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => tahsilatFisiPdfAc(tahsilatFisOnizleme)}
                className="min-h-12 flex-1 rounded-full bg-slate-950 px-5 text-sm font-black text-white transition hover:bg-slate-800"
              >
                PDF / Yazdır
              </button>

              <button
                type="button"
                onClick={() => tahsilatFisiniWhatsappGonder(tahsilatFisOnizleme)}
                disabled={!telefonuWhatsappFormatinaCevir(tahsilatFisOnizleme.cari?.telefon)}
                className="min-h-12 flex-1 rounded-full bg-emerald-600 px-5 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
              >
                WhatsApp&apos;ta Gönder
              </button>
            </div>

            {!telefonuWhatsappFormatinaCevir(tahsilatFisOnizleme.cari?.telefon) ? (
              <p className="mt-3 text-xs font-bold leading-5 text-slate-400">
                Bu caride telefon numarası olmadığı için WhatsApp gönderimi kapalı. PDF oluşturabilirsin.
              </p>
            ) : (
              <p className="mt-3 text-xs font-bold leading-5 text-slate-400">
                WhatsApp mesajı tahsilat bilgilerini gönderir. PDF dosyasını otomatik eklemek için ayrıca dosyayı manuel seçmen gerekir.
              </p>
            )}
          </div>
        </div>
      ) : null}
    </main>
  );
}
