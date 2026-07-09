"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { getOnMuhasebeClientContext } from "@/lib/onMuhasebe/client";
import { supabaseClient } from "@/lib/supabaseClient";

type Company = {
  id: string;
  company_code: string;
  name: string;
};

type CariTuru = "musteri" | "tedarikci" | "musteri_tedarikci";
type AcilisBakiyeTipi = "borc_yok" | "borclu" | "alacakli";

type CariHesap = {
  id: string;
  company_id: string;
  cari_kodu: string;
  cari_turu: CariTuru;
  unvan: string;
  yetkili_adi: string | null;
  telefon: string | null;
  eposta: string | null;
  adres: string | null;
  il: string | null;
  ilce: string | null;
  vergi_dairesi: string | null;
  vergi_no: string | null;
  tc_kimlik_no: string | null;
  acilis_bakiyesi: number;
  acilis_bakiye_tipi: AcilisBakiyeTipi;
  vade_gunu: number;
  risk_limiti: number;
  notlar: string | null;
  aktif: boolean;
  created_at: string;
  updated_at: string;
};

type CariHareket = {
  cari_id: string;
  borc_tutar: number;
  alacak_tutar: number;
  durum: "aktif" | "iptal";
};

type CariForm = {
  cari_kodu: string;
  cari_turu: CariTuru;
  unvan: string;
  yetkili_adi: string;
  telefon: string;
  eposta: string;
  adres: string;
  il: string;
  ilce: string;
  vergi_dairesi: string;
  vergi_no: string;
  tc_kimlik_no: string;
  acilis_bakiyesi: string;
  acilis_bakiye_tipi: AcilisBakiyeTipi;
  vade_gunu: string;
  risk_limiti: string;
  notlar: string;
  aktif: boolean;
};

type CariKaydi = {
  company_id: string;
  cari_kodu: string;
  cari_turu: CariTuru;
  unvan: string;
  yetkili_adi: string | null;
  telefon: string | null;
  eposta: string | null;
  adres: string | null;
  il: string | null;
  ilce: string | null;
  vergi_dairesi: string | null;
  vergi_no: string | null;
  tc_kimlik_no: string | null;
  acilis_bakiyesi: number;
  acilis_bakiye_tipi: AcilisBakiyeTipi;
  vade_gunu: number;
  risk_limiti: number;
  notlar: string | null;
  aktif: boolean;
};

type TopluCariSatiri = CariForm & {
  satir_id: string;
};

type BakiyeBilgisi = {
  bakiye: number;
  etiket: "Dengede" | "Tahsil Edilecek" | "Ödenecek";
};

const whatsappDestekLink =
  "https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20cari%20ekleme%20i%C3%A7in%20destek%20istiyorum.";

const cariTuruEtiketleri: Record<CariTuru, string> = {
  musteri: "Müşteri",
  tedarikci: "Tedarikçi",
  musteri_tedarikci: "Müşteri + Tedarikçi",
};

const bosForm: CariForm = {
  cari_kodu: "",
  cari_turu: "musteri",
  unvan: "",
  yetkili_adi: "",
  telefon: "",
  eposta: "",
  adres: "",
  il: "",
  ilce: "",
  vergi_dairesi: "",
  vergi_no: "",
  tc_kimlik_no: "",
  acilis_bakiyesi: "0",
  acilis_bakiye_tipi: "borc_yok",
  vade_gunu: "0",
  risk_limiti: "0",
  notlar: "",
  aktif: true,
};

function metniTemizle(value: string) {
  return value.trim();
}

function bosIseNull(value: string) {
  const temizDeger = metniTemizle(value);
  return temizDeger.length > 0 ? temizDeger : null;
}

function sayiyaCevir(value: string) {
  const temizDeger = value.replace(/\./g, "").replace(",", ".").trim();
  const sayi = Number(temizDeger);

  if (!Number.isFinite(sayi) || sayi < 0) {
    return 0;
  }

  return sayi;
}
function paraGirisiTemizle(value: string) {
  return value.replace(/[^\d.,]/g, "");
}

function paraGirisiFormatla(value: string) {
  const sayi = sayiyaCevir(value);

  if (sayi === 0) {
    return "0";
  }

  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(sayi);
}
function paraFormatla(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function acilisBakiyesiEtkisi(cari: CariHesap) {
  if (cari.acilis_bakiye_tipi === "borclu") {
    return Number(cari.acilis_bakiyesi || 0);
  }

  if (cari.acilis_bakiye_tipi === "alacakli") {
    return -Number(cari.acilis_bakiyesi || 0);
  }

  return 0;
}

function bakiyeBilgisiHesapla(
  cari: CariHesap,
  hareketler: CariHareket[],
): BakiyeBilgisi {
  const hareketBakiyesi = hareketler
    .filter((hareket) => hareket.cari_id === cari.id && hareket.durum === "aktif")
    .reduce(
      (toplam, hareket) =>
        toplam + Number(hareket.borc_tutar || 0) - Number(hareket.alacak_tutar || 0),
      0,
    );

  const bakiye = acilisBakiyesiEtkisi(cari) + hareketBakiyesi;

  if (bakiye > 0) {
    return { bakiye, etiket: "Tahsil Edilecek" };
  }

  if (bakiye < 0) {
    return { bakiye, etiket: "Ödenecek" };
  }

  return { bakiye: 0, etiket: "Dengede" };
}

function cariKodNumaralari(cariler: Pick<CariHesap, "cari_kodu">[]) {
  return cariler
    .map((cari) => cari.cari_kodu.match(/^CR-(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function siradakiCariKodu(cariler: Pick<CariHesap, "cari_kodu">[]) {
  const numaralar = cariKodNumaralari(cariler);
  const siradaki = numaralar.length > 0 ? Math.max(...numaralar) + 1 : cariler.length + 1;
  return `CR-${String(siradaki).padStart(4, "0")}`;
}

function topluSatirId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cariKoduAnahtari(kod: string) {
  return kod.trim().toLocaleLowerCase("tr-TR");
}

function topluCariKoduUret(cariler: CariHesap[], satirlar: TopluCariSatiri[]) {
  const kullanilanKodlar = new Set([
    ...cariler.map((cari) => cariKoduAnahtari(cari.cari_kodu)),
    ...satirlar.map((satir) => cariKoduAnahtari(satir.cari_kodu)).filter(Boolean),
  ]);

  const numaralar = [
    ...cariKodNumaralari(cariler),
    ...satirlar
      .map((satir) => satir.cari_kodu.match(/^CR-(\d+)$/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value)),
  ];

  let siradaki = numaralar.length > 0 ? Math.max(...numaralar) + 1 : cariler.length + satirlar.length + 1;
  let kod = `CR-${String(siradaki).padStart(4, "0")}`;

  while (kullanilanKodlar.has(cariKoduAnahtari(kod))) {
    siradaki += 1;
    kod = `CR-${String(siradaki).padStart(4, "0")}`;
  }

  return kod;
}

function yeniTopluCariSatiri(
  cariler: CariHesap[],
  satirlar: TopluCariSatiri[],
  oncekiSatir?: TopluCariSatiri,
): TopluCariSatiri {
  return {
    satir_id: topluSatirId(),
    cari_kodu: topluCariKoduUret(cariler, satirlar),
    cari_turu: oncekiSatir?.cari_turu || "musteri",
    unvan: "",
    yetkili_adi: "",
    telefon: "",
    eposta: "",
    adres: "",
    il: oncekiSatir?.il || "",
    ilce: oncekiSatir?.ilce || "",
    vergi_dairesi: oncekiSatir?.vergi_dairesi || "",
    vergi_no: "",
    tc_kimlik_no: "",
    acilis_bakiyesi: "0",
    acilis_bakiye_tipi: "borc_yok",
    vade_gunu: oncekiSatir?.vade_gunu || "0",
    risk_limiti: oncekiSatir?.risk_limiti || "0",
    notlar: "",
    aktif: true,
  };
}

function cariFormunaDonustur(cari: CariHesap): CariForm {
  return {
    cari_kodu: cari.cari_kodu,
    cari_turu: cari.cari_turu,
    unvan: cari.unvan,
    yetkili_adi: cari.yetkili_adi || "",
    telefon: cari.telefon || "",
    eposta: cari.eposta || "",
    adres: cari.adres || "",
    il: cari.il || "",
    ilce: cari.ilce || "",
    vergi_dairesi: cari.vergi_dairesi || "",
    vergi_no: cari.vergi_no || "",
    tc_kimlik_no: cari.tc_kimlik_no || "",
    acilis_bakiyesi: String(cari.acilis_bakiyesi || 0),
    acilis_bakiye_tipi: cari.acilis_bakiye_tipi,
    vade_gunu: String(cari.vade_gunu || 0),
    risk_limiti: String(cari.risk_limiti || 0),
    notlar: cari.notlar || "",
    aktif: cari.aktif,
  };
}

function cariKaydiHazirla(companyId: string, form: CariForm): CariKaydi {
  return {
    company_id: companyId,
    cari_kodu: metniTemizle(form.cari_kodu),
    cari_turu: form.cari_turu,
    unvan: metniTemizle(form.unvan),
    yetkili_adi: bosIseNull(form.yetkili_adi),
    telefon: bosIseNull(form.telefon),
    eposta: bosIseNull(form.eposta),
    adres: bosIseNull(form.adres),
    il: bosIseNull(form.il),
    ilce: bosIseNull(form.ilce),
    vergi_dairesi: bosIseNull(form.vergi_dairesi),
    vergi_no: bosIseNull(form.vergi_no),
    tc_kimlik_no: bosIseNull(form.tc_kimlik_no),
    acilis_bakiyesi: sayiyaCevir(form.acilis_bakiyesi),
    acilis_bakiye_tipi: form.acilis_bakiye_tipi,
    vade_gunu: Math.round(sayiyaCevir(form.vade_gunu)),
    risk_limiti: sayiyaCevir(form.risk_limiti),
    notlar: bosIseNull(form.notlar),
    aktif: form.aktif,
  };
}

function topluSatirDoluMu(satir: TopluCariSatiri) {
  return [
    satir.unvan,
    satir.yetkili_adi,
    satir.telefon,
    satir.eposta,
    satir.adres,
    satir.il,
    satir.ilce,
    satir.vergi_dairesi,
    satir.vergi_no,
    satir.tc_kimlik_no,
    satir.notlar,
  ].some((value) => value.trim().length > 0);
}

function topluSatirHatalari(
  satir: TopluCariSatiri,
  cariler: CariHesap[],
  tumSatirlar: TopluCariSatiri[],
) {
  const hatalar: string[] = [];
  const kod = cariKoduAnahtari(satir.cari_kodu);

  if (!topluSatirDoluMu(satir)) {
    return hatalar;
  }

  if (!metniTemizle(satir.cari_kodu)) {
    hatalar.push("Cari kodu zorunlu.");
  }

  if (!metniTemizle(satir.unvan)) {
    hatalar.push("Unvan zorunlu.");
  }

  if (cariler.some((cari) => cariKoduAnahtari(cari.cari_kodu) === kod)) {
    hatalar.push("Bu cari kodu sistemde var.");
  }

  const ayniKodSatirlari = tumSatirlar.filter(
    (item) => cariKoduAnahtari(item.cari_kodu) === kod,
  );

  if (kod && ayniKodSatirlari.length > 1) {
    hatalar.push("Bu cari kodu toplu girişte tekrar ediyor.");
  }

  return hatalar;
}

export default function CariPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [cariler, setCariler] = useState<CariHesap[]>([]);
  const [hareketler, setHareketler] = useState<CariHareket[]>([]);
  const [form, setForm] = useState<CariForm>(bosForm);
  const [duzenlenenCariId, setDuzenlenenCariId] = useState<string | null>(null);
  const [arama, setArama] = useState("");
  const [turFiltresi, setTurFiltresi] = useState<"tum" | CariTuru>("tum");
  const [formAcik, setFormAcik] = useState(false);
  const [topluAcik, setTopluAcik] = useState(false);
  const [topluSatirlar, setTopluSatirlar] = useState<TopluCariSatiri[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTopluSaving, setIsTopluSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const acilisBakiyesiKilitli = Boolean(duzenlenenCariId && !isOwner);

  const bakiyeHaritasi = useMemo(() => {
    return cariler.reduce<Record<string, BakiyeBilgisi>>((acc, cari) => {
      acc[cari.id] = bakiyeBilgisiHesapla(cari, hareketler);
      return acc;
    }, {});
  }, [cariler, hareketler]);

  const ozet = useMemo(() => {
    return cariler.reduce(
      (acc, cari) => {
        const bakiye = bakiyeHaritasi[cari.id]?.bakiye || 0;

        acc.toplamCari += 1;

        if (cari.aktif) {
          acc.aktifCari += 1;
        }

        if (cari.cari_turu === "musteri") {
          acc.musteri += 1;
        }

        if (cari.cari_turu === "tedarikci") {
          acc.tedarikci += 1;
        }

        if (cari.cari_turu === "musteri_tedarikci") {
          acc.musteri += 1;
          acc.tedarikci += 1;
        }

        if (bakiye > 0) {
          acc.tahsilEdilecek += bakiye;
        }

        if (bakiye < 0) {
          acc.odenecek += Math.abs(bakiye);
        }

        return acc;
      },
      {
        toplamCari: 0,
        aktifCari: 0,
        musteri: 0,
        tedarikci: 0,
        tahsilEdilecek: 0,
        odenecek: 0,
      },
    );
  }, [bakiyeHaritasi, cariler]);

  const filtreliCariler = useMemo(() => {
    const aramaMetni = arama.trim().toLocaleLowerCase("tr-TR");

    return cariler.filter((cari) => {
      const turUyuyor = turFiltresi === "tum" || cari.cari_turu === turFiltresi;
      const aramaUyuyor =
        aramaMetni.length === 0 ||
        [
          cari.cari_kodu,
          cari.unvan,
          cari.yetkili_adi,
          cari.telefon,
          cari.eposta,
          cari.il,
          cari.ilce,
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(aramaMetni);

      return turUyuyor && aramaUyuyor;
    });
  }, [arama, cariler, turFiltresi]);

  const topluKontrol = useMemo(() => {
    const doluSatirlar = topluSatirlar.filter(topluSatirDoluMu);
    const hatalar = doluSatirlar.flatMap((satir) =>
      topluSatirHatalari(satir, cariler, topluSatirlar).map((hata) => ({
        satir_id: satir.satir_id,
        hata,
      })),
    );

    return {
      toplam: topluSatirlar.length,
      dolu: doluSatirlar.length,
      bos: topluSatirlar.length - doluSatirlar.length,
      hatali: new Set(hatalar.map((hata) => hata.satir_id)).size,
      hatalar,
    };
  }, [cariler, topluSatirlar]);

  async function verileriYukle(mesajlariTemizle = true) {
    setIsLoading(true);
    setErrorMessage("");

    if (mesajlariTemizle) {
      setMessage("");
    }

    try {
      const context = await getOnMuhasebeClientContext();
      const companyData = context.company;
      setIsOwner(context.isOwner);

      const { data: cariData, error: cariError } = await supabaseClient
        .from("cari_hesaplar")
        .select(
          "id, company_id, cari_kodu, cari_turu, unvan, yetkili_adi, telefon, eposta, adres, il, ilce, vergi_dairesi, vergi_no, tc_kimlik_no, acilis_bakiyesi, acilis_bakiye_tipi, vade_gunu, risk_limiti, notlar, aktif, created_at, updated_at",
        )
        .eq("company_id", companyData.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (cariError) {
        throw new Error("Cari listesi alınamadı.");
      }

      const { data: hareketData, error: hareketError } = await supabaseClient
        .from("cari_hareketleri")
        .select("cari_id, borc_tutar, alacak_tutar, durum")
        .eq("company_id", companyData.id)
        .eq("durum", "aktif");

      if (hareketError) {
        throw new Error("Cari hareketleri alınamadı.");
      }

      setCompany(companyData as Company);
      setCariler((cariData || []) as CariHesap[]);
      setHareketler((hareketData || []) as CariHareket[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Cari ekranı yüklenirken hata oluştu.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    verileriYukle();
  }, []);

  function yeniCariAc() {
    setDuzenlenenCariId(null);
    setForm({ ...bosForm, cari_kodu: siradakiCariKodu(cariler) });
    setFormAcik(true);
    setTopluAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  function cariDuzenle(cari: CariHesap) {
    setDuzenlenenCariId(cari.id);
    setForm(cariFormunaDonustur(cari));
    setFormAcik(true);
    setTopluAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  function topluCariAcKapat() {
    setTopluAcik((current) => {
      const yeniDurum = !current;

      if (yeniDurum && topluSatirlar.length === 0) {
        setTopluSatirlar([yeniTopluCariSatiri(cariler, [])]);
      }

      return yeniDurum;
    });

    setFormAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  function formGuncelle<K extends keyof CariForm>(key: K, value: CariForm[K]) {
    if (
      acilisBakiyesiKilitli &&
      (key === "acilis_bakiyesi" || key === "acilis_bakiye_tipi")
    ) {
      return;
    }

    setForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  function topluSatirGuncelle<K extends keyof CariForm>(
    satirId: string,
    key: K,
    value: CariForm[K],
  ) {
    setTopluSatirlar((current) =>
      current.map((satir) =>
        satir.satir_id === satirId ? { ...satir, [key]: value } : satir,
      ),
    );
  }

  function topluSatirEkle() {
    setTopluSatirlar((current) => {
      const oncekiSatir = current[current.length - 1];
      return [...current, yeniTopluCariSatiri(cariler, current, oncekiSatir)];
    });
  }

  function topluBesSatirEkle() {
    setTopluSatirlar((current) => {
      let yeniSatirlar = [...current];

      for (let i = 0; i < 5; i += 1) {
        const oncekiSatir = yeniSatirlar[yeniSatirlar.length - 1];
        yeniSatirlar = [
          ...yeniSatirlar,
          yeniTopluCariSatiri(cariler, yeniSatirlar, oncekiSatir),
        ];
      }

      return yeniSatirlar;
    });
  }

  function topluSatirSil(satirId: string) {
    setTopluSatirlar((current) => {
      const kalanSatirlar = current.filter((satir) => satir.satir_id !== satirId);
      return kalanSatirlar.length > 0 ? kalanSatirlar : [yeniTopluCariSatiri(cariler, [])];
    });
  }

  function topluSatiriKopyala(satir: TopluCariSatiri) {
    setTopluSatirlar((current) => {
      const kopya: TopluCariSatiri = {
        ...satir,
        satir_id: topluSatirId(),
        cari_kodu: topluCariKoduUret(cariler, current),
        unvan: "",
        yetkili_adi: "",
        telefon: "",
        eposta: "",
        vergi_no: "",
        tc_kimlik_no: "",
        acilis_bakiyesi: "0",
        acilis_bakiye_tipi: "borc_yok",
        notlar: "",
      };

      const satirIndex = current.findIndex((item) => item.satir_id === satir.satir_id);
      const yeniListe = [...current];

      yeniListe.splice(satirIndex + 1, 0, kopya);
      return yeniListe;
    });
  }

  function topluSatirlariTemizle() {
    setTopluSatirlar([yeniTopluCariSatiri(cariler, [])]);
    setMessage("");
    setErrorMessage("");
  }

  async function topluCarileriKaydet() {
    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    const doluSatirlar = topluSatirlar.filter(topluSatirDoluMu);
    const hataliSatirlar = doluSatirlar.filter(
      (satir) => topluSatirHatalari(satir, cariler, topluSatirlar).length > 0,
    );

    if (doluSatirlar.length === 0) {
      setErrorMessage("Kaydedilecek cari yok. En az bir satırda unvan veya bilgi gir.");
      return;
    }

    if (hataliSatirlar.length > 0) {
      setErrorMessage("Hatalı satırlar var. Kırmızı uyarıları düzeltmeden toplu kayıt yapılamaz.");
      return;
    }

    const kayitlar = doluSatirlar.map((satir) => cariKaydiHazirla(company.id, satir));

    setIsTopluSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabaseClient.from("cari_hesaplar").insert(kayitlar);

      if (error) {
        throw error;
      }

      setMessage(`${kayitlar.length} cari başarıyla eklendi.`);
      setTopluSatirlar([]);
      setTopluAcik(false);
      await verileriYukle(false);
    } catch (error) {
      const hataMesaji =
        error instanceof Error ? error.message : "Toplu cari kaydı sırasında hata oluştu.";

      if (hataMesaji.includes("duplicate") || hataMesaji.includes("unique")) {
        setErrorMessage("Aynı cari kodu kullanılıyor. Cari kodlarını kontrol et.");
      } else {
        setErrorMessage(hataMesaji);
      }
    } finally {
      setIsTopluSaving(false);
    }
  }

  async function formuKaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    const cariKodu = metniTemizle(form.cari_kodu);
    const unvan = metniTemizle(form.unvan);

    if (!cariKodu) {
      setErrorMessage("Cari kodu zorunludur.");
      return;
    }

    if (!unvan) {
      setErrorMessage("Cari unvanı zorunludur.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    const kayit = cariKaydiHazirla(company.id, form);

    try {
      if (duzenlenenCariId) {
        if (!isOwner) {
          const mevcutCari = cariler.find((cari) => cari.id === duzenlenenCariId);

          if (!mevcutCari) {
            throw new Error("Düzenlenen cari bulunamadı. Listeyi yenileyip tekrar dene.");
          }

          kayit.acilis_bakiyesi = Number(mevcutCari.acilis_bakiyesi || 0);
          kayit.acilis_bakiye_tipi = mevcutCari.acilis_bakiye_tipi;
        }

        const { error } = await supabaseClient
          .from("cari_hesaplar")
          .update(kayit)
          .eq("id", duzenlenenCariId)
          .eq("company_id", company.id);

        if (error) {
          throw error;
        }

        setMessage("Cari kartı güncellendi.");
      } else {
        const { error } = await supabaseClient.from("cari_hesaplar").insert(kayit);

        if (error) {
          throw error;
        }

        setMessage("Cari kartı eklendi.");
      }

      setFormAcik(false);
      setDuzenlenenCariId(null);
      setForm(bosForm);
      await verileriYukle(false);
    } catch (error) {
      const hataMesaji =
        error instanceof Error ? error.message : "Cari kaydedilirken hata oluştu.";

      if (hataMesaji.includes("duplicate") || hataMesaji.includes("unique")) {
        setErrorMessage("Bu cari kodu zaten kullanılıyor. Farklı bir cari kodu gir.");
      } else {
        setErrorMessage(hataMesaji);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function aktiflikDegistir(cari: CariHesap) {
    if (!company) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabaseClient
      .from("cari_hesaplar")
      .update({ aktif: !cari.aktif })
      .eq("id", cari.id)
      .eq("company_id", company.id);

    if (error) {
      setErrorMessage("Cari durumu değiştirilemedi.");
      return;
    }

    setMessage(cari.aktif ? "Cari pasif yapıldı." : "Cari aktif yapıldı.");
    await verileriYukle(false);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="mt-5 text-sm font-black text-slate-600">
            Cari ekranı yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] pb-24 text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/on-muhasebe/panel" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-300">
              S
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-[-0.03em]">
                Cari Hesaplar
              </span>
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
              onClick={topluCariAcKapat}
              className="hidden min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800 sm:inline-flex"
            >
              Toplu Cari
            </button>
            <button
              type="button"
              onClick={yeniCariAc}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-xs font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Yeni Cari
            </button>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-7xl px-5 py-6 lg:px-8 lg:py-8">
        <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-300 sm:p-8">
          <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
          <div className="absolute bottom-[-110px] left-[-80px] h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                Cari Yönetimi
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                Müşteri ve tedarikçi kayıtları
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-white/60">
                Cari kartları tek tek eklenebilir veya hızlı toplu giriş ekranından
                birden fazla cari aynı anda kaydedilebilir. Tahsilat, ödeme, satış
                ve alış işlemleri eklendikçe bakiye alanı otomatik güncellenir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
              <div className="rounded-[1.35rem] bg-white/10 p-4">
                <p className="text-xs font-black text-white/40">Tahsil Edilecek</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {paraFormatla(ozet.tahsilEdilecek)}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-white/10 p-4">
                <p className="text-xs font-black text-white/40">Ödenecek</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {paraFormatla(ozet.odenecek)}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Toplam Cari
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.toplamCari}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Aktif Cari
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.aktifCari}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Müşteri
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.musteri}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Tedarikçi
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.tedarikci}
            </p>
          </div>
        </div>

        {message ? (
          <div className="mt-5 rounded-[1.5rem] bg-emerald-50 p-4 text-sm font-black text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-[1.5rem] bg-red-50 p-4 text-sm font-black text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {topluAcik ? (
          <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  Hızlı Toplu Cari
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Birden fazla cariyi aynı ekranda ekle
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                  Excel yok. Satırları içeride doldur, sistem cari kodunu otomatik
                  verir. Yeni satır eklerken önceki satırdaki tür, il, ilçe, vergi
                  dairesi, vade ve risk bilgileri otomatik taşınır.
                </p>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={topluSatirEkle}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-xs font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700"
                >
                  Satır Ekle
                </button>
                <button
                  type="button"
                  onClick={topluBesSatirEkle}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200"
                >
                  +5 Satır
                </button>
                <button
                  type="button"
                  onClick={() => setTopluAcik(false)}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
                >
                  Kapat
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-4">
              <div className="rounded-[1.3rem] bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-400">Satır</p>
                <p className="mt-1 text-2xl font-black">{topluKontrol.toplam}</p>
              </div>
              <div className="rounded-[1.3rem] bg-emerald-50 p-4">
                <p className="text-xs font-black text-emerald-600">Dolu</p>
                <p className="mt-1 text-2xl font-black text-emerald-700">
                  {topluKontrol.dolu}
                </p>
              </div>
              <div className="rounded-[1.3rem] bg-slate-50 p-4">
                <p className="text-xs font-black text-slate-400">Boş</p>
                <p className="mt-1 text-2xl font-black">{topluKontrol.bos}</p>
              </div>
              <div className="rounded-[1.3rem] bg-red-50 p-4">
                <p className="text-xs font-black text-red-600">Hatalı</p>
                <p className="mt-1 text-2xl font-black text-red-700">
                  {topluKontrol.hatali}
                </p>
              </div>
            </div>

            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[1320px] border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-3 py-2">Kod</th>
                    <th className="px-3 py-2">Tür</th>
                    <th className="px-3 py-2">Unvan</th>
                    <th className="px-3 py-2">Yetkili</th>
                    <th className="px-3 py-2">Telefon</th>
                    <th className="px-3 py-2">E-posta</th>
                    <th className="px-3 py-2">İl</th>
                    <th className="px-3 py-2">İlçe</th>
                    <th className="px-3 py-2">Açılış</th>
                    <th className="px-3 py-2">Tip</th>
                    <th className="px-3 py-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {topluSatirlar.map((satir) => {
                    const hatalar = topluSatirHatalari(satir, cariler, topluSatirlar);

                    return (
                      <tr key={satir.satir_id} className="bg-slate-50 align-top">
                        <td className="rounded-l-[1.2rem] px-3 py-3">
                          <input
                            value={satir.cari_kodu}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "cari_kodu",
                                event.target.value,
                              )
                            }
                            className="min-h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={satir.cari_turu}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "cari_turu",
                                event.target.value as CariTuru,
                              )
                            }
                            className="min-h-10 w-36 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          >
                            <option value="musteri">Müşteri</option>
                            <option value="tedarikci">Tedarikçi</option>
                            <option value="musteri_tedarikci">Müşteri + Tedarikçi</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.unvan}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "unvan", event.target.value)
                            }
                            className="min-h-10 w-60 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                            placeholder="Firma / Ad Soyad"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.yetkili_adi}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "yetkili_adi",
                                event.target.value,
                              )
                            }
                            className="min-h-10 w-44 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                            placeholder="Yetkili"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.telefon}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "telefon", event.target.value)
                            }
                            className="min-h-10 w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                            placeholder="05xx..."
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.eposta}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "eposta", event.target.value)
                            }
                            className="min-h-10 w-48 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                            placeholder="mail@firma.com"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.il}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "il", event.target.value)
                            }
                            className="min-h-10 w-32 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                            placeholder="İl"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.ilce}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "ilce", event.target.value)
                            }
                            className="min-h-10 w-32 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                            placeholder="İlçe"
                          />
                        </td>
                      <td className="px-3 py-3">
  <div className="relative">
    <input
      inputMode="decimal"
      value={satir.acilis_bakiyesi}
      onChange={(event) =>
        topluSatirGuncelle(
          satir.satir_id,
          "acilis_bakiyesi",
          paraGirisiTemizle(event.target.value),
        )
      }
      onBlur={(event) =>
        topluSatirGuncelle(
          satir.satir_id,
          "acilis_bakiyesi",
          paraGirisiFormatla(event.target.value),
        )
      }
      className="min-h-10 w-32 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-bold outline-none focus:border-emerald-500"
     placeholder="0"
    />
    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
      ₺
    </span>
  </div>
</td>
                        <td className="px-3 py-3">
                          <select
                            value={satir.acilis_bakiye_tipi}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "acilis_bakiye_tipi",
                                event.target.value as AcilisBakiyeTipi,
                              )
                            }
                            className="min-h-10 w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          >
                            <option value="borc_yok">Borç yok</option>
                            <option value="borclu">Bize borçlu</option>
                            <option value="alacakli">Biz borçluyuz</option>
                          </select>
                          {hatalar.length > 0 ? (
                            <p className="mt-2 max-w-44 text-[11px] font-black leading-4 text-red-600">
                              {hatalar.join(" ")}
                            </p>
                          ) : topluSatirDoluMu(satir) ? (
                            <p className="mt-2 text-[11px] font-black text-emerald-600">
                              Kayda hazır
                            </p>
                          ) : (
                            <p className="mt-2 text-[11px] font-bold text-slate-400">
                              Boş satır
                            </p>
                          )}
                        </td>
                        <td className="rounded-r-[1.2rem] px-3 py-3">
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => topluSatiriKopyala(satir)}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-3 text-xs font-black text-slate-950 shadow-sm transition hover:bg-slate-100"
                            >
                              Kopyala
                            </button>
                            <button
                              type="button"
                              onClick={() => topluSatirSil(satir.satir_id)}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-red-50 px-3 text-xs font-black text-red-700 shadow-sm transition hover:bg-red-100"
                            >
                              Sil
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-5 rounded-[1.4rem] bg-slate-50 p-4">
              <p className="text-sm font-black text-slate-950">Detay alanları</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                Toplu giriş hızlı olsun diye tabloda ana alanlar gösterilir. Adres,
                vergi dairesi, vergi no, T.C. kimlik no, vade, risk ve not gibi
                detayları satır kopyalama mantığıyla tek tek cari düzenlerken de
                tamamlayabilirsin. Sistem boş satırları kaydetmez.
              </p>
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={topluSatirlariTemizle}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-7 text-sm font-black text-slate-950 transition hover:bg-slate-200"
              >
                Temizle
              </button>
              <button
                type="button"
                onClick={topluCarileriKaydet}
                disabled={isTopluSaving || topluKontrol.dolu === 0 || topluKontrol.hatali > 0}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-7 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTopluSaving ? "Kaydediliyor..." : `${topluKontrol.dolu} Cariyi Kaydet`}
              </button>
            </div>
          </div>
        ) : null}

        {formAcik ? (
          <form
            onSubmit={formuKaydet}
            className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  Cari Kartı
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  {duzenlenenCariId ? "Cari düzenle" : "Yeni cari ekle"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormAcik(false);
                  setDuzenlenenCariId(null);
                  setForm(bosForm);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>

            {acilisBakiyesiKilitli ? (
              <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-4 py-3 text-sm font-black leading-6 text-amber-800">
                Personel mevcut cari kartını düzenlerken açılış bakiyesini değiştiremez. Bu alanı sadece yönetici güncelleyebilir.
              </div>
            ) : null}

            <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-indigo-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-sm font-bold leading-6 text-indigo-800">
                Müşteri için “Müşteri”, tedarikçi için “Tedarikçi” seç. Açılış
                bakiyesi varsa burada gir; sonraki tahsilat ve ödemeler bakiyeyi
                otomatik günceller.
              </p>
              <a
                href={whatsappDestekLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-xs font-black text-white transition hover:bg-emerald-700"
              >
                Cari eklerken destek al
              </a>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Cari Kodu</span>
                <input
                  value={form.cari_kodu}
                  onChange={(event) => formGuncelle("cari_kodu", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="CR-0001"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Cari Türü</span>
                <select
                  value={form.cari_turu}
                  onChange={(event) =>
                    formGuncelle("cari_turu", event.target.value as CariTuru)
                  }
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="musteri">Müşteri</option>
                  <option value="tedarikci">Tedarikçi</option>
                  <option value="musteri_tedarikci">Müşteri + Tedarikçi</option>
                </select>
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black text-slate-500">Unvan / Ad Soyad</span>
                <input
                  value={form.unvan}
                  onChange={(event) => formGuncelle("unvan", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Örnek Ticaret Ltd. Şti."
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Yetkili</span>
                <input
                  value={form.yetkili_adi}
                  onChange={(event) => formGuncelle("yetkili_adi", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Yetkili kişi"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Telefon</span>
                <input
                  value={form.telefon}
                  onChange={(event) => formGuncelle("telefon", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="05xx xxx xx xx"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">E-posta</span>
                <input
                  value={form.eposta}
                  onChange={(event) => formGuncelle("eposta", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="mail@firma.com"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">İl</span>
                <input
                  value={form.il}
                  onChange={(event) => formGuncelle("il", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Antalya"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">İlçe</span>
                <input
                  value={form.ilce}
                  onChange={(event) => formGuncelle("ilce", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Muratpaşa"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Vergi Dairesi</span>
                <input
                  value={form.vergi_dairesi}
                  onChange={(event) => formGuncelle("vergi_dairesi", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Vergi dairesi"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Vergi No</span>
                <input
                  value={form.vergi_no}
                  onChange={(event) => formGuncelle("vergi_no", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Vergi numarası"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">T.C. Kimlik No</span>
                <input
                  value={form.tc_kimlik_no}
                  onChange={(event) => formGuncelle("tc_kimlik_no", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Şahıs cariler için"
                />
              </label>

             <label className="grid gap-2">
  <span className="text-xs font-black text-slate-500">Açılış Bakiyesi</span>
  <div className="relative">
    <input
      inputMode="decimal"
      value={form.acilis_bakiyesi}
      disabled={acilisBakiyesiKilitli}
      onChange={(event) =>
        formGuncelle("acilis_bakiyesi", paraGirisiTemizle(event.target.value))
      }
      onBlur={(event) =>
        formGuncelle("acilis_bakiyesi", paraGirisiFormatla(event.target.value))
      }
      className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
     placeholder="0"
    />
    <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
      ₺
    </span>
  </div>
</label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Bakiye Tipi</span>
                <select
                  value={form.acilis_bakiye_tipi}
                  disabled={acilisBakiyesiKilitli}
                  onChange={(event) =>
                    formGuncelle(
                      "acilis_bakiye_tipi",
                      event.target.value as AcilisBakiyeTipi,
                    )
                  }
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-500"
                >
                  <option value="borc_yok">Borç yok</option>
                  <option value="borclu">Cari bize borçlu</option>
                  <option value="alacakli">Biz cariye borçluyuz</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Vade Günü</span>
                <input
                  value={form.vade_gunu}
                  onChange={(event) => formGuncelle("vade_gunu", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="0"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Risk Limiti</span>
                <input
                  value={form.risk_limiti}
                  onChange={(event) => formGuncelle("risk_limiti", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="0"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black text-slate-500">Adres</span>
                <textarea
                  value={form.adres}
                  onChange={(event) => formGuncelle("adres", event.target.value)}
                  className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Açık adres"
                />
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black text-slate-500">Notlar</span>
                <textarea
                  value={form.notlar}
                  onChange={(event) => formGuncelle("notlar", event.target.value)}
                  className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Cari hakkında özel not"
                />
              </label>
            </div>

            <label className="mt-5 flex items-center gap-3 rounded-[1.5rem] bg-slate-50 p-4 text-sm font-black text-slate-700">
              <input
                type="checkbox"
                checked={form.aktif}
                onChange={(event) => formGuncelle("aktif", event.target.checked)}
                className="h-5 w-5 rounded border-slate-300"
              />
              Cari aktif olsun
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormAcik(false);
                  setDuzenlenenCariId(null);
                  setForm(bosForm);
                }}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-7 text-sm font-black text-slate-950 transition hover:bg-slate-200"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-indigo-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isSaving ? "Kaydediliyor..." : "Cariyi Kaydet"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Cari Listesi
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                {filtreliCariler.length} kayıt
              </h2>
            </div>

            <div className="grid gap-3 sm:grid-cols-[1fr_220px] lg:min-w-[560px]">
              <input
                value={arama}
                onChange={(event) => setArama(event.target.value)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                placeholder="Unvan, kod, telefon veya şehir ara"
              />
              <select
                value={turFiltresi}
                onChange={(event) => setTurFiltresi(event.target.value as "tum" | CariTuru)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="tum">Tüm cariler</option>
                <option value="musteri">Müşteri</option>
                <option value="tedarikci">Tedarikçi</option>
                <option value="musteri_tedarikci">Müşteri + Tedarikçi</option>
              </select>
            </div>
          </div>

          {filtreliCariler.length === 0 ? (
            <div className="mt-6 rounded-[1.7rem] bg-slate-50 p-8 text-center">
              <p className="text-xl font-black tracking-[-0.04em]">
                Henüz cari kaydı yok
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-slate-500">
                İlk müşteri veya tedarikçi kaydını tek tek ekleyebilir ya da hızlı
                toplu giriş ekranından birden fazla cariyi aynı anda kaydedebilirsin.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={yeniCariAc}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-indigo-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  İlk Cariyi Ekle
                </button>
                <button
                  type="button"
                  onClick={topluCariAcKapat}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-7 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  Toplu Cari Ekle
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[980px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-4 py-2">Cari</th>
                    <th className="px-4 py-2">Tür</th>
                    <th className="px-4 py-2">İletişim</th>
                    <th className="px-4 py-2">Vade</th>
                    <th className="px-4 py-2">Bakiye</th>
                    <th className="px-4 py-2">Durum</th>
                    <th className="px-4 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliCariler.map((cari) => {
                    const bakiye = bakiyeHaritasi[cari.id] || {
                      bakiye: 0,
                      etiket: "Dengede" as const,
                    };

                    return (
                      <tr key={cari.id} className="rounded-[1.5rem] bg-slate-50">
                        <td className="rounded-l-[1.5rem] px-4 py-4 align-top">
                          <p className="text-sm font-black text-slate-950">
                            {cari.unvan}
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-400">
                            {cari.cari_kodu}
                          </p>
                          {cari.yetkili_adi ? (
                            <p className="mt-1 text-xs font-bold text-slate-500">
                              Yetkili: {cari.yetkili_adi}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span className="inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                            {cariTuruEtiketleri[cari.cari_turu]}
                          </span>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-black text-slate-700">
                            {cari.telefon || "Telefon yok"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {cari.eposta || "E-posta yok"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {[cari.ilce, cari.il].filter(Boolean).join(" / ") || "Adres yok"}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p className="text-sm font-black text-slate-950">
                            {cari.vade_gunu} gün
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Risk: {paraFormatla(Number(cari.risk_limiti || 0))}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <p
                            className={[
                              "text-sm font-black",
                              bakiye.bakiye > 0
                                ? "text-emerald-700"
                                : bakiye.bakiye < 0
                                  ? "text-red-700"
                                  : "text-slate-700",
                            ].join(" ")}
                          >
                            {paraFormatla(Math.abs(bakiye.bakiye))}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            {bakiye.etiket}
                          </p>
                        </td>
                        <td className="px-4 py-4 align-top">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-black",
                              cari.aktif
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-200 text-slate-600",
                            ].join(" ")}
                          >
                            {cari.aktif ? "Aktif" : "Pasif"}
                          </span>
                        </td>
                        <td className="rounded-r-[1.5rem] px-4 py-4 align-top">
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => cariDuzenle(cari)}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-slate-100"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => aktiflikDegistir(cari)}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                            >
                              {cari.aktif ? "Pasifleştir" : "Aktifleştir"}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[1.7rem] bg-white p-5 text-sm font-bold leading-6 text-slate-500 shadow-lg shadow-slate-200">
          <span className="font-black text-slate-950">Not:</span> Bu ekranda cari
          kartı, açılış bakiyesi ve hızlı toplu cari girişi yönetilir. Tahsilat,
          ödeme, satış ve alış hareketleri sıradaki Kasa ve Fatura / Fiş
          modülleri eklendikçe cari bakiyesine otomatik yansıyacak.
        </div>
      </section>

      <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2 lg:hidden">
        <button
          type="button"
          onClick={topluCariAcKapat}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white shadow-2xl shadow-slate-300 transition hover:bg-slate-800"
          aria-label="Toplu cari ekle"
        >
          ⇪
        </button>
        <button
          type="button"
          onClick={yeniCariAc}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl font-black text-white shadow-2xl shadow-indigo-300 transition hover:bg-indigo-700"
          aria-label="Yeni cari ekle"
        >
          +
        </button>
      </div>
    </main>
  );
}
