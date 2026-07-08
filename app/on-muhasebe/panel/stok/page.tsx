"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { getOnMuhasebeClientContext } from "@/lib/onMuhasebe/client";
import { getBrowserWorkYear, todayForWorkYear, workYearDateRange } from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

type Company = {
  id: string;
  company_code: string;
  name: string;
};

type UrunTipi = "urun" | "hizmet";
type StokHareketTuru = "giris" | "cikis" | "duzeltme";

type UrunKategori = {
  id: string;
  company_id: string;
  kategori_adi: string;
  aciklama: string | null;
  aktif: boolean;
  created_at: string;
  updated_at: string;
};

type Urun = {
  id: string;
  company_id: string;
  kategori_id: string | null;
  urun_kodu: string;
  barkod: string | null;
  urun_adi: string;
  urun_tipi: UrunTipi;
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
  created_at: string;
  updated_at: string;
};

type StokHareket = {
  id: string;
  company_id: string;
  urun_id: string;
  hareket_turu: StokHareketTuru;
  hareket_tarihi: string;
  miktar: number;
  birim_maliyet: number;
  aciklama: string | null;
  created_at: string;
};

type UrunForm = {
  kategori_id: string;
  urun_kodu: string;
  barkod: string;
  urun_adi: string;
  urun_tipi: UrunTipi;
  birim: string;
  kdv_orani: string;
  alis_fiyati: string;
  satis_fiyati: string;
  maliyet_fiyati: string;
  mevcut_stok: string;
  kritik_stok: string;
  aciklama: string;
  aktif: boolean;
};

type UrunKaydi = {
  company_id: string;
  kategori_id: string | null;
  urun_kodu: string;
  barkod: string | null;
  urun_adi: string;
  urun_tipi: UrunTipi;
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
};

type StokHareketForm = {
  urun_id: string;
  hareket_turu: StokHareketTuru;
  miktar: string;
  birim_maliyet: string;
  aciklama: string;
};

type TopluUrunSatiri = UrunForm & {
  satir_id: string;
};

const whatsappDestekLink =
  "https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20%C3%BCr%C3%BCn%20ve%20stok%20ekleme%20i%C3%A7in%20destek%20istiyorum.";

const urunTipiEtiketleri: Record<UrunTipi, string> = {
  urun: "Ürün",
  hizmet: "Hizmet",
};

const hareketTuruEtiketleri: Record<StokHareketTuru, string> = {
  giris: "Stok Girişi",
  cikis: "Stok Çıkışı",
  duzeltme: "Sayım Düzeltme",
};

const birimler = [
  "Adet",
  "Kg",
  "Gram",
  "Lt",
  "Metre",
  "Paket",
  "Kutu",
  "Takım",
  "Saat",
  "Gün",
  "Hizmet",
];

const bosForm: UrunForm = {
  kategori_id: "",
  urun_kodu: "",
  barkod: "",
  urun_adi: "",
  urun_tipi: "urun",
  birim: "Adet",
  kdv_orani: "20",
  alis_fiyati: "0",
  satis_fiyati: "0",
  maliyet_fiyati: "0",
  mevcut_stok: "0",
  kritik_stok: "0",
  aciklama: "",
  aktif: true,
};

const bosHareketForm: StokHareketForm = {
  urun_id: "",
  hareket_turu: "giris",
  miktar: "",
  birim_maliyet: "0",
  aciklama: "",
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

function miktarGirisiTemizle(value: string) {
  return value.replace(/[^\d.,]/g, "");
}

function miktarFormatla(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 3,
  }).format(value);
}

function paraFormatla(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

function tarihFormatla(value: string) {
  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

function urunKodNumaralari(urunler: Pick<Urun, "urun_kodu">[]) {
  return urunler
    .map((urun) => urun.urun_kodu.match(/^UR-(\d+)$/)?.[1])
    .filter((value): value is string => Boolean(value))
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value));
}

function siradakiUrunKodu(urunler: Pick<Urun, "urun_kodu">[]) {
  const numaralar = urunKodNumaralari(urunler);
  const siradaki = numaralar.length > 0 ? Math.max(...numaralar) + 1 : urunler.length + 1;
  return `UR-${String(siradaki).padStart(4, "0")}`;
}

function topluSatirId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function urunKoduAnahtari(kod: string) {
  return kod.trim().toLocaleLowerCase("tr-TR");
}

function barkodAnahtari(barkod: string | null) {
  return (barkod || "").trim().toLocaleLowerCase("tr-TR");
}

function topluUrunKoduUret(urunler: Urun[], satirlar: TopluUrunSatiri[]) {
  const kullanilanKodlar = new Set([
    ...urunler.map((urun) => urunKoduAnahtari(urun.urun_kodu)),
    ...satirlar.map((satir) => urunKoduAnahtari(satir.urun_kodu)).filter(Boolean),
  ]);

  const numaralar = [
    ...urunKodNumaralari(urunler),
    ...satirlar
      .map((satir) => satir.urun_kodu.match(/^UR-(\d+)$/)?.[1])
      .filter((value): value is string => Boolean(value))
      .map((value) => Number(value))
      .filter((value) => Number.isFinite(value)),
  ];

  let siradaki = numaralar.length > 0 ? Math.max(...numaralar) + 1 : urunler.length + satirlar.length + 1;
  let kod = `UR-${String(siradaki).padStart(4, "0")}`;

  while (kullanilanKodlar.has(urunKoduAnahtari(kod))) {
    siradaki += 1;
    kod = `UR-${String(siradaki).padStart(4, "0")}`;
  }

  return kod;
}

function yeniTopluUrunSatiri(
  urunler: Urun[],
  satirlar: TopluUrunSatiri[],
  referansSatir?: TopluUrunSatiri,
): TopluUrunSatiri {
  const urunTipi = referansSatir?.urun_tipi || "urun";

  return {
    satir_id: topluSatirId(),
    kategori_id: referansSatir?.kategori_id || "",
    urun_kodu: topluUrunKoduUret(urunler, satirlar),
    barkod: "",
    urun_adi: "",
    urun_tipi: urunTipi,
    birim: referansSatir?.birim || (urunTipi === "hizmet" ? "Hizmet" : "Adet"),
    kdv_orani: referansSatir?.kdv_orani || "20",
    alis_fiyati: "0",
    satis_fiyati: "0",
    maliyet_fiyati: "0",
    mevcut_stok: "0",
    kritik_stok: referansSatir?.kritik_stok || "0",
    aciklama: "",
    aktif: true,
  };
}

function topluSatirVarsayilanReferansi(satirlar: TopluUrunSatiri[]) {
  return satirlar[0];
}

function urunFormunaDonustur(urun: Urun): UrunForm {
  return {
    kategori_id: urun.kategori_id || "",
    urun_kodu: urun.urun_kodu,
    barkod: urun.barkod || "",
    urun_adi: urun.urun_adi,
    urun_tipi: urun.urun_tipi,
    birim: urun.birim,
    kdv_orani: String(urun.kdv_orani || 0),
    alis_fiyati: paraGirisiFormatla(String(urun.alis_fiyati || 0)),
    satis_fiyati: paraGirisiFormatla(String(urun.satis_fiyati || 0)),
    maliyet_fiyati: paraGirisiFormatla(String(urun.maliyet_fiyati || 0)),
    mevcut_stok: String(urun.mevcut_stok || 0),
    kritik_stok: String(urun.kritik_stok || 0),
    aciklama: urun.aciklama || "",
    aktif: urun.aktif,
  };
}

function urunKaydiHazirla(companyId: string, form: UrunForm): UrunKaydi {
  const urunTipi = form.urun_tipi;
  const alisFiyati = sayiyaCevir(form.alis_fiyati);
  const maliyetFiyati = sayiyaCevir(form.maliyet_fiyati);

  return {
    company_id: companyId,
    kategori_id: form.kategori_id || null,
    urun_kodu: metniTemizle(form.urun_kodu),
    barkod: bosIseNull(form.barkod),
    urun_adi: metniTemizle(form.urun_adi),
    urun_tipi: urunTipi,
    birim: metniTemizle(form.birim) || "Adet",
    kdv_orani: sayiyaCevir(form.kdv_orani),
    alis_fiyati: alisFiyati,
    satis_fiyati: sayiyaCevir(form.satis_fiyati),
    maliyet_fiyati: maliyetFiyati > 0 ? maliyetFiyati : alisFiyati,
    mevcut_stok: urunTipi === "hizmet" ? 0 : sayiyaCevir(form.mevcut_stok),
    kritik_stok: urunTipi === "hizmet" ? 0 : sayiyaCevir(form.kritik_stok),
    para_birimi: "TRY",
    aciklama: bosIseNull(form.aciklama),
    aktif: form.aktif,
  };
}

function topluUrunSatirDoluMu(satir: TopluUrunSatiri) {
  return [satir.urun_adi, satir.barkod, satir.aciklama].some(
    (value) => value.trim().length > 0,
  ) ||
    sayiyaCevir(satir.alis_fiyati) > 0 ||
    sayiyaCevir(satir.satis_fiyati) > 0 ||
    sayiyaCevir(satir.mevcut_stok) > 0 ||
    sayiyaCevir(satir.kritik_stok) > 0;
}

function topluUrunSatirHatalari(
  satir: TopluUrunSatiri,
  urunler: Urun[],
  tumSatirlar: TopluUrunSatiri[],
) {
  const hatalar: string[] = [];

  if (!topluUrunSatirDoluMu(satir)) {
    return hatalar;
  }

  const kod = urunKoduAnahtari(satir.urun_kodu);
  const barkod = barkodAnahtari(satir.barkod);

  if (!metniTemizle(satir.urun_kodu)) {
    hatalar.push("Ürün kodu zorunlu.");
  }

  if (!metniTemizle(satir.urun_adi)) {
    hatalar.push("Ürün adı zorunlu.");
  }

  if (urunler.some((urun) => urunKoduAnahtari(urun.urun_kodu) === kod)) {
    hatalar.push("Bu ürün kodu sistemde var.");
  }

  const ayniKodSatirlari = tumSatirlar.filter(
    (item) => topluUrunSatirDoluMu(item) && urunKoduAnahtari(item.urun_kodu) === kod,
  );

  if (kod && ayniKodSatirlari.length > 1) {
    hatalar.push("Bu ürün kodu toplu girişte tekrar ediyor.");
  }

  if (barkod) {
    if (urunler.some((urun) => barkodAnahtari(urun.barkod) === barkod)) {
      hatalar.push("Bu barkod sistemde var.");
    }

    const ayniBarkodSatirlari = tumSatirlar.filter(
      (item) => topluUrunSatirDoluMu(item) && barkodAnahtari(item.barkod) === barkod,
    );

    if (ayniBarkodSatirlari.length > 1) {
      hatalar.push("Bu barkod toplu girişte tekrar ediyor.");
    }
  }

  if (satir.urun_tipi === "hizmet" && sayiyaCevir(satir.mevcut_stok) > 0) {
    hatalar.push("Hizmet kartında mevcut stok tutulmaz.");
  }

  return hatalar;
}

export default function StokPage() {
  const [company, setCompany] = useState<Company | null>(null);
  const [workYear] = useState(getBrowserWorkYear());
  const stokFormRef = useRef<HTMLFormElement | null>(null);
  const [urunler, setUrunler] = useState<Urun[]>([]);
  const [kategoriler, setKategoriler] = useState<UrunKategori[]>([]);
  const [hareketler, setHareketler] = useState<StokHareket[]>([]);
  const [form, setForm] = useState<UrunForm>(bosForm);
  const [duzenlenenUrunId, setDuzenlenenUrunId] = useState<string | null>(null);
  const [formAcik, setFormAcik] = useState(false);
  const [topluAcik, setTopluAcik] = useState(false);
  const [topluSatirlar, setTopluSatirlar] = useState<TopluUrunSatiri[]>([]);
  const [hareketFormAcik, setHareketFormAcik] = useState(false);
  const [hareketForm, setHareketForm] = useState<StokHareketForm>(bosHareketForm);
  const [arama, setArama] = useState("");
  const [tipFiltresi, setTipFiltresi] = useState<"tum" | UrunTipi>("tum");
  const [kategoriFiltresi, setKategoriFiltresi] = useState("tum");
  const [stokFiltresi, setStokFiltresi] = useState<"tum" | "kritik" | "stokta" | "stoksuz">("tum");
  const [kategoriAdi, setKategoriAdi] = useState("");
  const [kategoriFormAcik, setKategoriFormAcik] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isTopluSaving, setIsTopluSaving] = useState(false);
  const [isHareketSaving, setIsHareketSaving] = useState(false);
  const [isKategoriSaving, setIsKategoriSaving] = useState(false);
  const [message, setMessage] = useState("");
  const yearRange = useMemo(() => workYearDateRange(workYear), [workYear]);
  const [errorMessage, setErrorMessage] = useState("");

  const kategoriHaritasi = useMemo(() => {
    return kategoriler.reduce<Record<string, UrunKategori>>((acc, kategori) => {
      acc[kategori.id] = kategori;
      return acc;
    }, {});
  }, [kategoriler]);

  const ozet = useMemo(() => {
    return urunler.reduce(
      (acc, urun) => {
        const mevcutStok = Number(urun.mevcut_stok || 0);
        const kritikStok = Number(urun.kritik_stok || 0);

        acc.toplamKayit += 1;

        if (urun.aktif) {
          acc.aktifKayit += 1;
        }

        if (urun.urun_tipi === "urun") {
          acc.urun += 1;
          acc.stokDegeri += mevcutStok * Number(urun.maliyet_fiyati || 0);

          if (mevcutStok <= 0) {
            acc.stoksuz += 1;
          }

          if (kritikStok > 0 && mevcutStok <= kritikStok) {
            acc.kritik += 1;
          }
        }

        if (urun.urun_tipi === "hizmet") {
          acc.hizmet += 1;
        }

        return acc;
      },
      {
        toplamKayit: 0,
        aktifKayit: 0,
        urun: 0,
        hizmet: 0,
        kritik: 0,
        stoksuz: 0,
        stokDegeri: 0,
      },
    );
  }, [urunler]);

  const filtreliUrunler = useMemo(() => {
    const aramaMetni = arama.trim().toLocaleLowerCase("tr-TR");

    return urunler.filter((urun) => {
      const mevcutStok = Number(urun.mevcut_stok || 0);
      const kritikStok = Number(urun.kritik_stok || 0);
      const kategoriUyuyor = kategoriFiltresi === "tum" || urun.kategori_id === kategoriFiltresi;
      const tipUyuyor = tipFiltresi === "tum" || urun.urun_tipi === tipFiltresi;
      const aramaUyuyor =
        aramaMetni.length === 0 ||
        [
          urun.urun_kodu,
          urun.barkod,
          urun.urun_adi,
          urun.birim,
          urun.aciklama,
          urun.kategori_id ? kategoriHaritasi[urun.kategori_id]?.kategori_adi : "",
        ]
          .filter(Boolean)
          .join(" ")
          .toLocaleLowerCase("tr-TR")
          .includes(aramaMetni);

      const stokUyuyor =
        stokFiltresi === "tum" ||
        (stokFiltresi === "kritik" &&
          urun.urun_tipi === "urun" &&
          kritikStok > 0 &&
          mevcutStok <= kritikStok) ||
        (stokFiltresi === "stokta" && urun.urun_tipi === "urun" && mevcutStok > 0) ||
        (stokFiltresi === "stoksuz" && urun.urun_tipi === "urun" && mevcutStok <= 0);

      return kategoriUyuyor && tipUyuyor && aramaUyuyor && stokUyuyor;
    });
  }, [arama, kategoriFiltresi, kategoriHaritasi, stokFiltresi, tipFiltresi, urunler]);

  const sonHareketler = useMemo(() => {
    return [...hareketler]
      .sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      )
      .slice(0, 10);
  }, [hareketler]);

  const topluKontrol = useMemo(() => {
    const doluSatirlar = topluSatirlar.filter(topluUrunSatirDoluMu);
    const hatalar = doluSatirlar.flatMap((satir) =>
      topluUrunSatirHatalari(satir, urunler, topluSatirlar).map((hata) => ({
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
  }, [topluSatirlar, urunler]);

  const verileriYukle = useCallback(async (mesajlariTemizle = true) => {
    setIsLoading(true);
    setErrorMessage("");

    if (mesajlariTemizle) {
      setMessage("");
    }

    try {
      const context = await getOnMuhasebeClientContext();
      const companyData = context.company;

      const { data: kategoriData, error: kategoriError } = await supabaseClient
        .from("urun_kategorileri")
        .select("id, company_id, kategori_adi, aciklama, aktif, created_at, updated_at")
        .eq("company_id", companyData.id)
        .is("deleted_at", null)
        .order("kategori_adi", { ascending: true });

      if (kategoriError) {
        throw new Error("Ürün kategorileri alınamadı.");
      }

      const { data: urunData, error: urunError } = await supabaseClient
        .from("urunler")
        .select(
          "id, company_id, kategori_id, urun_kodu, barkod, urun_adi, urun_tipi, birim, kdv_orani, alis_fiyati, satis_fiyati, maliyet_fiyati, mevcut_stok, kritik_stok, para_birimi, aciklama, aktif, created_at, updated_at",
        )
        .eq("company_id", companyData.id)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (urunError) {
        throw new Error("Stok listesi alınamadı.");
      }

      const { data: hareketData, error: hareketError } = await supabaseClient
        .from("stok_hareketleri")
        .select(
          "id, company_id, urun_id, hareket_turu, hareket_tarihi, miktar, birim_maliyet, aciklama, created_at",
        )
        .eq("company_id", companyData.id)
        .gte("hareket_tarihi", yearRange.start)
        .lte("hareket_tarihi", yearRange.end)
        .order("created_at", { ascending: false })
        .limit(50);

      if (hareketError) {
        throw new Error("Stok hareketleri alınamadı.");
      }

      setCompany(companyData as Company);
      setKategoriler((kategoriData || []) as UrunKategori[]);
      setUrunler((urunData || []) as Urun[]);
      setHareketler((hareketData || []) as StokHareket[]);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Stok ekranı yüklenirken hata oluştu.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [yearRange.end, yearRange.start]);

  useEffect(() => {
    verileriYukle();
  }, [verileriYukle]);
  useEffect(() => {
    if (!formAcik) return;

    window.requestAnimationFrame(() => {
      stokFormRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  }, [formAcik, duzenlenenUrunId]);
  function formGuncelle<K extends keyof UrunForm>(key: K, value: UrunForm[K]) {
    setForm((currentForm) => {
      if (key === "urun_tipi" && value === "hizmet") {
        return {
          ...currentForm,
          [key]: value,
          birim: currentForm.birim === "Adet" ? "Hizmet" : currentForm.birim,
          mevcut_stok: "0",
          kritik_stok: "0",
        };
      }

      return { ...currentForm, [key]: value };
    });
  }

  function hareketFormGuncelle<K extends keyof StokHareketForm>(
    key: K,
    value: StokHareketForm[K],
  ) {
    setHareketForm((currentForm) => ({ ...currentForm, [key]: value }));
  }

  function topluSatirGuncelle<K extends keyof UrunForm>(
    satirId: string,
    key: K,
    value: UrunForm[K],
  ) {
    setTopluSatirlar((current) =>
      current.map((satir) => {
        if (satir.satir_id !== satirId) {
          return satir;
        }

        if (key === "urun_tipi" && value === "hizmet") {
          return {
            ...satir,
            [key]: value,
            birim: satir.birim === "Adet" ? "Hizmet" : satir.birim,
            mevcut_stok: "0",
            kritik_stok: "0",
          };
        }

        if (key === "urun_tipi" && value === "urun") {
          return {
            ...satir,
            [key]: value,
            birim: satir.birim === "Hizmet" ? "Adet" : satir.birim,
          };
        }

        return { ...satir, [key]: value };
      }),
    );
  }

  function yeniUrunAc() {
    setDuzenlenenUrunId(null);
    setForm({ ...bosForm, urun_kodu: siradakiUrunKodu(urunler) });
    setFormAcik(true);
    setTopluAcik(false);
    setHareketFormAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  function topluUrunAcKapat() {
    setTopluAcik((current) => {
      const yeniDurum = !current;

      if (yeniDurum && topluSatirlar.length === 0) {
        setTopluSatirlar([yeniTopluUrunSatiri(urunler, [])]);
      }

      return yeniDurum;
    });

    setFormAcik(false);
    setHareketFormAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  function topluSatirEkle() {
    setTopluSatirlar((current) => {
      const referansSatir = topluSatirVarsayilanReferansi(current);
      return [...current, yeniTopluUrunSatiri(urunler, current, referansSatir)];
    });
  }

  function topluBesSatirEkle() {
    setTopluSatirlar((current) => {
      let yeniSatirlar = [...current];
      const referansSatir = topluSatirVarsayilanReferansi(current);

      for (let i = 0; i < 5; i += 1) {
        yeniSatirlar = [
          ...yeniSatirlar,
          yeniTopluUrunSatiri(urunler, yeniSatirlar, referansSatir),
        ];
      }

      return yeniSatirlar;
    });
  }

  function topluSatirSil(satirId: string) {
    setTopluSatirlar((current) => {
      const kalanSatirlar = current.filter((satir) => satir.satir_id !== satirId);
      return kalanSatirlar.length > 0 ? kalanSatirlar : [yeniTopluUrunSatiri(urunler, [])];
    });
  }

  function topluSatiriKopyala(satir: TopluUrunSatiri) {
    setTopluSatirlar((current) => {
      const kopya: TopluUrunSatiri = {
        ...satir,
        satir_id: topluSatirId(),
        urun_kodu: topluUrunKoduUret(urunler, current),
        barkod: "",
        urun_adi: "",
      };

      const satirIndex = current.findIndex((item) => item.satir_id === satir.satir_id);
      const yeniListe = [...current];
      yeniListe.splice(satirIndex + 1, 0, kopya);
      return yeniListe;
    });
  }

  function topluSatirlariTemizle() {
    setTopluSatirlar([yeniTopluUrunSatiri(urunler, [])]);
    setMessage("");
    setErrorMessage("");
  }

  function urunDuzenle(urun: Urun) {
    setDuzenlenenUrunId(urun.id);
    setForm(urunFormunaDonustur(urun));
    setFormAcik(true);
    setTopluAcik(false);
    setHareketFormAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  function stokHareketiAc(urun?: Urun, hareketTuru: StokHareketTuru = "giris") {
    setHareketForm({
      urun_id: urun?.id || "",
      hareket_turu: hareketTuru,
      miktar: "",
      birim_maliyet: urun
        ? paraGirisiFormatla(String(urun.maliyet_fiyati || urun.alis_fiyati || 0))
        : "0",
      aciklama: "",
    });
    setHareketFormAcik(true);
    setFormAcik(false);
    setTopluAcik(false);
    setMessage("");
    setErrorMessage("");
  }

  async function kategoriEkle(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    const temizKategoriAdi = metniTemizle(kategoriAdi);

    if (!temizKategoriAdi) {
      setErrorMessage("Kategori adı zorunludur.");
      return;
    }

    setIsKategoriSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabaseClient.from("urun_kategorileri").insert({
        company_id: company.id,
        kategori_adi: temizKategoriAdi,
        aktif: true,
      });

      if (error) {
        throw error;
      }

      setKategoriAdi("");
      setKategoriFormAcik(false);
      setMessage("Kategori eklendi.");
      await verileriYukle(false);
    } catch (error) {
      const hataMesaji =
        error instanceof Error ? error.message : "Kategori eklenirken hata oluştu.";

      if (hataMesaji.includes("duplicate") || hataMesaji.includes("unique")) {
        setErrorMessage("Bu kategori zaten var.");
      } else {
        setErrorMessage(hataMesaji);
      }
    } finally {
      setIsKategoriSaving(false);
    }
  }

  async function urunKaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    const urunKodu = metniTemizle(form.urun_kodu);
    const urunAdi = metniTemizle(form.urun_adi);

    if (!urunKodu) {
      setErrorMessage("Ürün kodu zorunludur.");
      return;
    }

    if (!urunAdi) {
      setErrorMessage("Ürün / hizmet adı zorunludur.");
      return;
    }

    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    const kayit = urunKaydiHazirla(company.id, form);

    try {
      if (duzenlenenUrunId) {
        const { error } = await supabaseClient
          .from("urunler")
          .update(kayit)
          .eq("id", duzenlenenUrunId)
          .eq("company_id", company.id);

        if (error) {
          throw error;
        }

        setMessage("Stok kartı güncellendi.");
      } else {
        const { error } = await supabaseClient.from("urunler").insert(kayit);

        if (error) {
          throw error;
        }

        setMessage("Stok kartı eklendi.");
      }

      setFormAcik(false);
      setDuzenlenenUrunId(null);
      setForm(bosForm);
      await verileriYukle(false);
    } catch (error) {
      const hataMesaji =
        error instanceof Error ? error.message : "Stok kartı kaydedilirken hata oluştu.";

      if (hataMesaji.includes("duplicate") || hataMesaji.includes("unique")) {
        setErrorMessage("Ürün kodu veya barkod zaten kullanılıyor.");
      } else {
        setErrorMessage(hataMesaji);
      }
    } finally {
      setIsSaving(false);
    }
  }

  async function topluUrunleriKaydet() {
    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    const doluSatirlar = topluSatirlar.filter(topluUrunSatirDoluMu);
    const hataliSatirlar = doluSatirlar.filter(
      (satir) => topluUrunSatirHatalari(satir, urunler, topluSatirlar).length > 0,
    );

    if (doluSatirlar.length === 0) {
      setErrorMessage("Kaydedilecek ürün yok. En az bir satırda ürün adı veya bilgi gir.");
      return;
    }

    if (hataliSatirlar.length > 0) {
      setErrorMessage("Hatalı satırlar var. Kırmızı uyarıları düzeltmeden toplu kayıt yapılamaz.");
      return;
    }

    const kayitlar = doluSatirlar.map((satir) => urunKaydiHazirla(company.id, satir));

    setIsTopluSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error } = await supabaseClient.from("urunler").insert(kayitlar);

      if (error) {
        throw error;
      }

      setMessage(`${kayitlar.length} ürün / hizmet başarıyla eklendi.`);
      setTopluSatirlar([]);
      setTopluAcik(false);
      await verileriYukle(false);
    } catch (error) {
      const hataMesaji =
        error instanceof Error ? error.message : "Toplu ürün kaydı sırasında hata oluştu.";

      if (hataMesaji.includes("duplicate") || hataMesaji.includes("unique")) {
        setErrorMessage("Aynı ürün kodu veya barkod kullanılıyor. Satırları kontrol et.");
      } else {
        setErrorMessage(hataMesaji);
      }
    } finally {
      setIsTopluSaving(false);
    }
  }

  async function stokHareketiKaydet(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!company) {
      setErrorMessage("Firma bilgisi bulunamadı.");
      return;
    }

    const urun = urunler.find((item) => item.id === hareketForm.urun_id);

    if (!urun) {
      setErrorMessage("Ürün seçmelisin.");
      return;
    }

    if (urun.urun_tipi === "hizmet") {
      setErrorMessage("Hizmet kartlarında stok hareketi yapılamaz.");
      return;
    }

    const miktar = sayiyaCevir(hareketForm.miktar);
    const birimMaliyet = sayiyaCevir(hareketForm.birim_maliyet);
    const mevcutStok = Number(urun.mevcut_stok || 0);

    if (miktar <= 0) {
      setErrorMessage(
        hareketForm.hareket_turu === "duzeltme"
          ? "Yeni stok miktarı sıfırdan büyük olmalı."
          : "Hareket miktarı sıfırdan büyük olmalı.",
      );
      return;
    }

    let yeniStok = mevcutStok;
    let hareketMiktari = miktar;

    if (hareketForm.hareket_turu === "giris") {
      yeniStok = mevcutStok + miktar;
    }

    if (hareketForm.hareket_turu === "cikis") {
      if (miktar > mevcutStok) {
        setErrorMessage("Çıkış miktarı mevcut stoktan fazla olamaz.");
        return;
      }

      yeniStok = mevcutStok - miktar;
    }

    if (hareketForm.hareket_turu === "duzeltme") {
      yeniStok = miktar;
      hareketMiktari = Math.abs(miktar - mevcutStok);

      if (hareketMiktari <= 0) {
        setErrorMessage("Yeni stok miktarı mevcut stokla aynı. Değişiklik yok.");
        return;
      }
    }

    setIsHareketSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const { error: hareketError } = await supabaseClient.from("stok_hareketleri").insert({
        company_id: company.id,
        urun_id: urun.id,
        hareket_turu: hareketForm.hareket_turu,
        hareket_tarihi: todayForWorkYear(workYear),
        miktar: hareketMiktari,
        birim_maliyet: birimMaliyet,
        aciklama: bosIseNull(hareketForm.aciklama),
      });

      if (hareketError) {
        throw hareketError;
      }

      const { error: urunError } = await supabaseClient
        .from("urunler")
        .update({
          mevcut_stok: yeniStok,
          maliyet_fiyati:
            hareketForm.hareket_turu === "giris" && birimMaliyet > 0
              ? birimMaliyet
              : urun.maliyet_fiyati,
        })
        .eq("id", urun.id)
        .eq("company_id", company.id);

      if (urunError) {
        throw urunError;
      }

      setMessage("Stok hareketi işlendi.");
      setHareketForm(bosHareketForm);
      setHareketFormAcik(false);
      await verileriYukle(false);
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Stok hareketi kaydedilirken hata oluştu.",
      );
    } finally {
      setIsHareketSaving(false);
    }
  }

  async function aktiflikDegistir(urun: Urun) {
    if (!company) return;

    setMessage("");
    setErrorMessage("");

    const { error } = await supabaseClient
      .from("urunler")
      .update({ aktif: !urun.aktif })
      .eq("id", urun.id)
      .eq("company_id", company.id);

    if (error) {
      setErrorMessage("Ürün durumu değiştirilemedi.");
      return;
    }

    setMessage(urun.aktif ? "Stok kartı pasif yapıldı." : "Stok kartı aktif yapıldı.");
    await verileriYukle(false);
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="mt-5 text-sm font-black text-slate-600">
            Stok ekranı yükleniyor...
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
                Stok Yönetimi
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
              className="hidden min-h-11 items-center justify-center rounded-full bg-emerald-50 px-5 text-xs font-black text-emerald-700 transition hover:bg-emerald-100 xl:inline-flex"
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
              onClick={topluUrunAcKapat}
              className="hidden min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800 sm:inline-flex"
            >
              Toplu Ürün
            </button>
            <button
              type="button"
              onClick={() => stokHareketiAc()}
              className="hidden min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200 sm:inline-flex"
            >
              Stok Hareketi
            </button>
            <button
              type="button"
              onClick={yeniUrunAc}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-xs font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
            >
              Yeni Ürün
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
                Stok ve Hizmet Kartları
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
                Ürün, hizmet ve stok takibi
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-white/60">
                Ürün kartı, hizmet kartı, kategori, alış fiyatı, satış fiyatı,
                mevcut stok, kritik stok ve manuel stok hareketleri bu alandan
                yönetilir.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:min-w-[460px]">
              <div className="rounded-[1.35rem] bg-white/10 p-4">
                <p className="text-xs font-black text-white/40">Tahmini Stok Değeri</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {paraFormatla(ozet.stokDegeri)}
                </p>
              </div>
              <div className="rounded-[1.35rem] bg-white/10 p-4">
                <p className="text-xs font-black text-white/40">Kritik Stok</p>
                <p className="mt-2 text-2xl font-black text-white">
                  {ozet.kritik} ürün
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Toplam Kart
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.toplamKayit}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Aktif Kart
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.aktifKayit}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Ürün
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.urun}
            </p>
          </div>
          <div className="rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
              Hizmet
            </p>
            <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
              {ozet.hizmet}
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
                  Hızlı Toplu Ürün
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Birden fazla ürün / hizmet ekle
                </h2>
                <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
                  Excel yok. Satırları içeride doldur, sistem ürün kodunu otomatik verir.
                  Yeni satır eklerken ilk satırdaki kategori, tip, birim, KDV ve kritik stok bilgisi taşınır. Kopyala dediğinde ürün adı, ürün kodu ve barkod hariç diğer alanlar aynı gelir.
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
              <table className="w-full min-w-[1580px] border-separate border-spacing-y-2 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-3 py-2">Kod</th>
                    <th className="px-3 py-2">Tip</th>
                    <th className="px-3 py-2">Kategori</th>
                    <th className="px-3 py-2">Ürün / Hizmet</th>
                    <th className="px-3 py-2">Barkod</th>
                    <th className="px-3 py-2">Birim</th>
                    <th className="px-3 py-2">KDV</th>
                    <th className="px-3 py-2">Alış</th>
                    <th className="px-3 py-2">Satış</th>
                    <th className="px-3 py-2">Stok</th>
                    <th className="px-3 py-2">Kritik</th>
                    <th className="px-3 py-2">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {topluSatirlar.map((satir) => {
                    const hatalar = topluUrunSatirHatalari(satir, urunler, topluSatirlar);

                    return (
                      <tr key={satir.satir_id} className="bg-slate-50 align-top">
                        <td className="rounded-l-[1.2rem] px-3 py-3">
                          <input
                            value={satir.urun_kodu}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "urun_kodu", event.target.value)
                            }
                            className="min-h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={satir.urun_tipi}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "urun_tipi",
                                event.target.value as UrunTipi,
                              )
                            }
                            className="min-h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          >
                            <option value="urun">Ürün</option>
                            <option value="hizmet">Hizmet</option>
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={satir.kategori_id}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "kategori_id", event.target.value)
                            }
                            className="min-h-10 w-44 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          >
                            <option value="">Kategori yok</option>
                            {kategoriler.map((kategori) => (
                              <option key={kategori.id} value={kategori.id}>
                                {kategori.kategori_adi}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.urun_adi}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "urun_adi", event.target.value)
                            }
                            className="min-h-10 w-64 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                            placeholder="Ürün / hizmet adı"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            value={satir.barkod}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "barkod", event.target.value)
                            }
                            className="min-h-10 w-40 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500"
                            placeholder="Barkod"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <select
                            value={satir.birim}
                            onChange={(event) =>
                              topluSatirGuncelle(satir.satir_id, "birim", event.target.value)
                            }
                            className="min-h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 text-xs font-black outline-none focus:border-emerald-500"
                          >
                            {birimler.map((birim) => (
                              <option key={birim} value={birim}>
                                {birim}
                              </option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-3">
                          <div className="relative">
                            <input
                              inputMode="decimal"
                              value={satir.kdv_orani}
                              onChange={(event) =>
                                topluSatirGuncelle(
                                  satir.satir_id,
                                  "kdv_orani",
                                  miktarGirisiTemizle(event.target.value),
                                )
                              }
                              className="min-h-10 w-20 rounded-xl border border-slate-200 bg-white px-3 pr-7 text-xs font-bold outline-none focus:border-emerald-500"
                              placeholder="20"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                              %
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="relative">
                            <input
                              inputMode="decimal"
                              value={satir.alis_fiyati}
                              onChange={(event) =>
                                topluSatirGuncelle(
                                  satir.satir_id,
                                  "alis_fiyati",
                                  paraGirisiTemizle(event.target.value),
                                )
                              }
                              onBlur={(event) =>
                                topluSatirGuncelle(
                                  satir.satir_id,
                                  "alis_fiyati",
                                  paraGirisiFormatla(event.target.value),
                                )
                              }
                              className="min-h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-bold outline-none focus:border-emerald-500"
                              placeholder="0"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                              ₺
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <div className="relative">
                            <input
                              inputMode="decimal"
                              value={satir.satis_fiyati}
                              onChange={(event) =>
                                topluSatirGuncelle(
                                  satir.satir_id,
                                  "satis_fiyati",
                                  paraGirisiTemizle(event.target.value),
                                )
                              }
                              onBlur={(event) =>
                                topluSatirGuncelle(
                                  satir.satir_id,
                                  "satis_fiyati",
                                  paraGirisiFormatla(event.target.value),
                                )
                              }
                              className="min-h-10 w-28 rounded-xl border border-slate-200 bg-white px-3 pr-8 text-xs font-bold outline-none focus:border-emerald-500"
                              placeholder="0"
                            />
                            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-xs font-black text-slate-400">
                              ₺
                            </span>
                          </div>
                        </td>
                        <td className="px-3 py-3">
                          <input
                            inputMode="decimal"
                            value={satir.mevcut_stok}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "mevcut_stok",
                                miktarGirisiTemizle(event.target.value),
                              )
                            }
                            disabled={satir.urun_tipi === "hizmet"}
                            className="min-h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0"
                          />
                        </td>
                        <td className="px-3 py-3">
                          <input
                            inputMode="decimal"
                            value={satir.kritik_stok}
                            onChange={(event) =>
                              topluSatirGuncelle(
                                satir.satir_id,
                                "kritik_stok",
                                miktarGirisiTemizle(event.target.value),
                              )
                            }
                            disabled={satir.urun_tipi === "hizmet"}
                            className="min-h-10 w-24 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-emerald-500 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="0"
                          />
                          {hatalar.length > 0 ? (
                            <p className="mt-2 max-w-44 text-[11px] font-black leading-4 text-red-600">
                              {hatalar.join(" ")}
                            </p>
                          ) : topluUrunSatirDoluMu(satir) ? (
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
              <p className="text-sm font-black text-slate-950">Kullanım mantığı</p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                Sadece dolu satırlar kaydedilir. Ürün kodu otomatik gelir ama istersen değiştirebilirsin.
                Barkod boş bırakılabilir. Hizmet seçilirse stok alanları otomatik sıfır kabul edilir. Kopyala butonu fiyat, stok, KDV, kategori, birim ve açıklama gibi alanları aynı bırakır; ürün adı, ürün kodu ve barkod yeni kayıt için boş/benzersiz hazırlanır.
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
                onClick={topluUrunleriKaydet}
                disabled={isTopluSaving || topluKontrol.dolu === 0 || topluKontrol.hatali > 0}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-7 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isTopluSaving ? "Kaydediliyor..." : `${topluKontrol.dolu} Ürünü Kaydet`}
              </button>
            </div>
          </div>
        ) : null}

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Kategoriler
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                Ürün grupları
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setKategoriFormAcik((current) => !current)}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
            >
              Kategori Ekle
            </button>
          </div>

          {kategoriFormAcik ? (
            <form onSubmit={kategoriEkle} className="mt-5 flex flex-col gap-3 sm:flex-row">
              <input
                value={kategoriAdi}
                onChange={(event) => setKategoriAdi(event.target.value)}
                className="min-h-12 flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                placeholder="Örn: Temizlik Ürünleri"
              />
              <button
                type="submit"
                disabled={isKategoriSaving}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-indigo-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isKategoriSaving ? "Ekleniyor..." : "Kaydet"}
              </button>
            </form>
          ) : null}

          <div className="mt-5 flex flex-wrap gap-2">
            {kategoriler.length === 0 ? (
              <span className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-500">
                Henüz kategori yok
              </span>
            ) : (
              kategoriler.map((kategori) => (
                <span
                  key={kategori.id}
                  className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700"
                >
                  {kategori.kategori_adi}
                </span>
              ))
            )}
          </div>
        </div>

        {hareketFormAcik ? (
          <form
            onSubmit={stokHareketiKaydet}
            className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                  Stok Hareketi
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Giriş, çıkış veya sayım düzeltme
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setHareketFormAcik(false)}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2 lg:col-span-2">
                <span className="text-xs font-black text-slate-500">Ürün</span>
                <select
                  value={hareketForm.urun_id}
                  onChange={(event) => {
                    const secilenUrun = urunler.find((urun) => urun.id === event.target.value);
                    hareketFormGuncelle("urun_id", event.target.value);

                    if (secilenUrun) {
                      hareketFormGuncelle(
                        "birim_maliyet",
                        paraGirisiFormatla(
                          String(secilenUrun.maliyet_fiyati || secilenUrun.alis_fiyati || 0),
                        ),
                      );
                    }
                  }}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                >
                  <option value="">Ürün seç</option>
                  {urunler
                    .filter((urun) => urun.urun_tipi === "urun")
                    .map((urun) => (
                      <option key={urun.id} value={urun.id}>
                        {urun.urun_kodu} - {urun.urun_adi} / Stok: {" "}
                        {miktarFormatla(Number(urun.mevcut_stok || 0))} {urun.birim}
                      </option>
                    ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Hareket Türü</span>
                <select
                  value={hareketForm.hareket_turu}
                  onChange={(event) =>
                    hareketFormGuncelle("hareket_turu", event.target.value as StokHareketTuru)
                  }
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                >
                  <option value="giris">Stok Girişi</option>
                  <option value="cikis">Stok Çıkışı</option>
                  <option value="duzeltme">Sayım Düzeltme</option>
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">
                  {hareketForm.hareket_turu === "duzeltme" ? "Yeni Stok Miktarı" : "Miktar"}
                </span>
                <input
                  inputMode="decimal"
                  value={hareketForm.miktar}
                  onChange={(event) =>
                    hareketFormGuncelle("miktar", miktarGirisiTemizle(event.target.value))
                  }
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="0"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Birim Maliyet</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={hareketForm.birim_maliyet}
                    onChange={(event) =>
                      hareketFormGuncelle(
                        "birim_maliyet",
                        paraGirisiTemizle(event.target.value),
                      )
                    }
                    onBlur={(event) =>
                      hareketFormGuncelle(
                        "birim_maliyet",
                        paraGirisiFormatla(event.target.value),
                      )
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    ₺
                  </span>
                </div>
              </label>

              <label className="grid gap-2 md:col-span-2 lg:col-span-3">
                <span className="text-xs font-black text-slate-500">Açıklama</span>
                <input
                  value={hareketForm.aciklama}
                  onChange={(event) => hareketFormGuncelle("aciklama", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
                  placeholder="Örn: Sayım fazlası, fire, manuel giriş"
                />
              </label>
            </div>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setHareketFormAcik(false)}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-100 px-7 text-sm font-black text-slate-950 transition hover:bg-slate-200"
              >
                Vazgeç
              </button>
              <button
                type="submit"
                disabled={isHareketSaving}
                className="inline-flex min-h-12 items-center justify-center rounded-full bg-emerald-600 px-7 text-sm font-black text-white shadow-lg shadow-emerald-100 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isHareketSaving ? "İşleniyor..." : "Hareketi Kaydet"}
              </button>
            </div>
          </form>
        ) : null}

        {formAcik ? (
         <form
  ref={stokFormRef}
  onSubmit={urunKaydet}
  className="mt-5 scroll-mt-28 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7"
>
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  Stok Kartı
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  {duzenlenenUrunId ? "Ürün / hizmet düzenle" : "Yeni ürün / hizmet ekle"}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => {
                  setFormAcik(false);
                  setDuzenlenenUrunId(null);
                  setForm(bosForm);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>

            <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-cyan-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center">
              <p className="text-sm font-bold leading-6 text-cyan-900">
                Ürün satılıyorsa “Ürün”, sadece hizmet bedeli girilecekse
                “Hizmet” seç. Alış, satış, KDV ve kritik stok alanlarını doğru
                girersen raporlar ve stok uyarıları daha sağlıklı çalışır.
              </p>
              <a
                href={whatsappDestekLink}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-xs font-black text-white transition hover:bg-emerald-700"
              >
                Ürün eklerken destek al
              </a>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Ürün Kodu</span>
                <input
                  value={form.urun_kodu}
                  onChange={(event) => formGuncelle("urun_kodu", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="UR-0001"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Tip</span>
                <select
                  value={form.urun_tipi}
                  onChange={(event) =>
                    formGuncelle("urun_tipi", event.target.value as UrunTipi)
                  }
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="urun">Ürün</option>
                  <option value="hizmet">Hizmet</option>
                </select>
              </label>

              <label className="grid gap-2 md:col-span-2">
                <span className="text-xs font-black text-slate-500">Ürün / Hizmet Adı</span>
                <input
                  value={form.urun_adi}
                  onChange={(event) => formGuncelle("urun_adi", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Örn: Motor Yağı 5W-30"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Kategori</span>
                <select
                  value={form.kategori_id}
                  onChange={(event) => formGuncelle("kategori_id", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="">Kategori yok</option>
                  {kategoriler.map((kategori) => (
                    <option key={kategori.id} value={kategori.id}>
                      {kategori.kategori_adi}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Barkod</span>
                <input
                  value={form.barkod}
                  onChange={(event) => formGuncelle("barkod", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Barkod / SKU"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Birim</span>
                <select
                  value={form.birim}
                  onChange={(event) => formGuncelle("birim", event.target.value)}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  {birimler.map((birim) => (
                    <option key={birim} value={birim}>
                      {birim}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">KDV Oranı</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form.kdv_orani}
                    onChange={(event) =>
                      formGuncelle("kdv_orani", miktarGirisiTemizle(event.target.value))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                    placeholder="20"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    %
                  </span>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Alış Fiyatı</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form.alis_fiyati}
                    onChange={(event) =>
                      formGuncelle("alis_fiyati", paraGirisiTemizle(event.target.value))
                    }
                    onBlur={(event) =>
                      formGuncelle("alis_fiyati", paraGirisiFormatla(event.target.value))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    ₺
                  </span>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Satış Fiyatı</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form.satis_fiyati}
                    onChange={(event) =>
                      formGuncelle("satis_fiyati", paraGirisiTemizle(event.target.value))
                    }
                    onBlur={(event) =>
                      formGuncelle("satis_fiyati", paraGirisiFormatla(event.target.value))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    ₺
                  </span>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Maliyet Fiyatı</span>
                <div className="relative">
                  <input
                    inputMode="decimal"
                    value={form.maliyet_fiyati}
                    onChange={(event) =>
                      formGuncelle("maliyet_fiyati", paraGirisiTemizle(event.target.value))
                    }
                    onBlur={(event) =>
                      formGuncelle("maliyet_fiyati", paraGirisiFormatla(event.target.value))
                    }
                    className="min-h-12 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 pr-11 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                    placeholder="0"
                  />
                  <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm font-black text-slate-400">
                    ₺
                  </span>
                </div>
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Mevcut Stok</span>
                <input
                  inputMode="decimal"
                  value={form.mevcut_stok}
                  onChange={(event) =>
                    formGuncelle("mevcut_stok", miktarGirisiTemizle(event.target.value))
                  }
                  disabled={form.urun_tipi === "hizmet"}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-xs font-black text-slate-500">Kritik Stok</span>
                <input
                  inputMode="decimal"
                  value={form.kritik_stok}
                  onChange={(event) =>
                    formGuncelle("kritik_stok", miktarGirisiTemizle(event.target.value))
                  }
                  disabled={form.urun_tipi === "hizmet"}
                  className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-50"
                  placeholder="0"
                />
              </label>

              <label className="grid gap-2 md:col-span-2 lg:col-span-4">
                <span className="text-xs font-black text-slate-500">Açıklama</span>
                <textarea
                  value={form.aciklama}
                  onChange={(event) => formGuncelle("aciklama", event.target.value)}
                  className="min-h-24 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="Ürün / hizmet hakkında not"
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
              Stok kartı aktif olsun
            </label>

            <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => {
                  setFormAcik(false);
                  setDuzenlenenUrunId(null);
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
                {isSaving ? "Kaydediliyor..." : "Stok Kartını Kaydet"}
              </button>
            </div>
          </form>
        ) : null}

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Stok Listesi
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                {filtreliUrunler.length} kayıt
              </h2>
            </div>

            <div className="grid gap-3 lg:min-w-[760px] lg:grid-cols-[1fr_160px_180px_160px]">
              <input
                value={arama}
                onChange={(event) => setArama(event.target.value)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                placeholder="Ürün adı, kod, barkod veya kategori ara"
              />
              <select
                value={tipFiltresi}
                onChange={(event) => setTipFiltresi(event.target.value as "tum" | UrunTipi)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="tum">Tüm tipler</option>
                <option value="urun">Ürün</option>
                <option value="hizmet">Hizmet</option>
              </select>
              <select
                value={kategoriFiltresi}
                onChange={(event) => setKategoriFiltresi(event.target.value)}
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="tum">Tüm kategoriler</option>
                {kategoriler.map((kategori) => (
                  <option key={kategori.id} value={kategori.id}>
                    {kategori.kategori_adi}
                  </option>
                ))}
              </select>
              <select
                value={stokFiltresi}
                onChange={(event) =>
                  setStokFiltresi(event.target.value as "tum" | "kritik" | "stokta" | "stoksuz")
                }
                className="min-h-12 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value="tum">Tüm stoklar</option>
                <option value="kritik">Kritik stok</option>
                <option value="stokta">Stokta var</option>
                <option value="stoksuz">Stoksuz</option>
              </select>
            </div>
          </div>

          {filtreliUrunler.length === 0 ? (
            <div className="mt-6 rounded-[1.7rem] bg-slate-50 p-8 text-center">
              <p className="text-xl font-black tracking-[-0.04em]">
                Henüz stok kartı yok
              </p>
              <p className="mx-auto mt-2 max-w-md text-sm font-bold leading-6 text-slate-500">
                İlk ürün veya hizmet kartını tek tek ekleyebilir ya da hızlı toplu giriş ekranından birden fazla ürünü aynı anda kaydedebilirsin.
              </p>
              <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={yeniUrunAc}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-indigo-600 px-7 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700"
                >
                  İlk Stok Kartını Ekle
                </button>
                <button
                  type="button"
                  onClick={topluUrunAcKapat}
                  className="inline-flex min-h-12 items-center justify-center rounded-full bg-slate-950 px-7 text-sm font-black text-white shadow-lg shadow-slate-200 transition hover:bg-slate-800"
                >
                  Toplu Ürün Ekle
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 overflow-x-auto">
              <table className="w-full min-w-[1120px] border-separate border-spacing-y-3 text-left">
                <thead>
                  <tr className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                    <th className="px-4 py-2">Ürün / Hizmet</th>
                    <th className="px-4 py-2">Kategori</th>
                    <th className="px-4 py-2">Fiyat</th>
                    <th className="px-4 py-2">Stok</th>
                    <th className="px-4 py-2">Durum</th>
                    <th className="px-4 py-2 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody>
                  {filtreliUrunler.map((urun) => {
                    const mevcutStok = Number(urun.mevcut_stok || 0);
                    const kritikStok = Number(urun.kritik_stok || 0);
                    const kritikMi =
                      urun.urun_tipi === "urun" && kritikStok > 0 && mevcutStok <= kritikStok;

                    return (
                      <tr key={urun.id} className="rounded-[1.5rem] bg-slate-50">
                        <td className="rounded-l-[1.5rem] px-4 py-4 align-top">
                          <p className="text-sm font-black text-slate-950">
                            {urun.urun_adi}
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-400">
                            {urun.urun_kodu}
                            {urun.barkod ? ` / ${urun.barkod}` : ""}
                          </p>
                          <span className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                            {urunTipiEtiketleri[urun.urun_tipi]}
                          </span>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-black text-slate-700">
                            {urun.kategori_id
                              ? kategoriHaritasi[urun.kategori_id]?.kategori_adi || "Kategori yok"
                              : "Kategori yok"}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Birim: {urun.birim}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            KDV: %{Number(urun.kdv_orani || 0)}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          <p className="text-xs font-bold text-slate-500">Satış</p>
                          <p className="text-sm font-black text-slate-950">
                            {paraFormatla(Number(urun.satis_fiyati || 0))}
                          </p>
                          <p className="mt-2 text-xs font-bold text-slate-500">
                            Alış: {paraFormatla(Number(urun.alis_fiyati || 0))}
                          </p>
                        </td>

                        <td className="px-4 py-4 align-top">
                          {urun.urun_tipi === "hizmet" ? (
                            <>
                              <p className="text-sm font-black text-slate-700">
                                Stok takibi yok
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                Hizmet kartı
                              </p>
                            </>
                          ) : (
                            <>
                              <p
                                className={[
                                  "text-sm font-black",
                                  kritikMi
                                    ? "text-red-700"
                                    : mevcutStok <= 0
                                      ? "text-slate-500"
                                      : "text-emerald-700",
                                ].join(" ")}
                              >
                                {miktarFormatla(mevcutStok)} {urun.birim}
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                Kritik: {miktarFormatla(kritikStok)} {urun.birim}
                              </p>
                              <p className="mt-1 text-xs font-bold text-slate-500">
                                Değer: {" "}
                                {paraFormatla(mevcutStok * Number(urun.maliyet_fiyati || 0))}
                              </p>
                            </>
                          )}
                        </td>

                        <td className="px-4 py-4 align-top">
                          <span
                            className={[
                              "inline-flex rounded-full px-3 py-1 text-xs font-black",
                              urun.aktif
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-slate-200 text-slate-600",
                            ].join(" ")}
                          >
                            {urun.aktif ? "Aktif" : "Pasif"}
                          </span>
                          {kritikMi ? (
                            <span className="mt-2 block rounded-full bg-red-50 px-3 py-1 text-center text-xs font-black text-red-700">
                              Kritik stok
                            </span>
                          ) : null}
                        </td>

                        <td className="rounded-r-[1.5rem] px-4 py-4 align-top">
                          <div className="flex flex-wrap justify-end gap-2">
                            {urun.urun_tipi === "urun" ? (
                              <>
                                <button
                                  type="button"
                                  onClick={() => stokHareketiAc(urun, "giris")}
                                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-emerald-600 px-4 text-xs font-black text-white shadow-sm transition hover:bg-emerald-700"
                                >
                                  Giriş
                                </button>
                                <button
                                  type="button"
                                  onClick={() => stokHareketiAc(urun, "cikis")}
                                  className="inline-flex min-h-10 items-center justify-center rounded-full bg-orange-500 px-4 text-xs font-black text-white shadow-sm transition hover:bg-orange-600"
                                >
                                  Çıkış
                                </button>
                              </>
                            ) : null}

                            <button
                              type="button"
                              onClick={() => urunDuzenle(urun)}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-black text-slate-950 shadow-sm transition hover:bg-slate-100"
                            >
                              Düzenle
                            </button>
                            <button
                              type="button"
                              onClick={() => aktiflikDegistir(urun)}
                              className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-4 text-xs font-black text-white shadow-sm transition hover:bg-slate-800"
                            >
                              {urun.aktif ? "Pasifleştir" : "Aktifleştir"}
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

        <div className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Son Stok Hareketleri
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                Giriş / çıkış kayıtları
              </h2>
            </div>
            <button
              type="button"
              onClick={() => stokHareketiAc()}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white transition hover:bg-slate-800"
            >
              Yeni Hareket
            </button>
          </div>

          {sonHareketler.length === 0 ? (
            <div className="mt-5 rounded-[1.5rem] bg-slate-50 p-5 text-sm font-bold text-slate-500">
              Henüz stok hareketi yok.
            </div>
          ) : (
            <div className="mt-5 grid gap-3">
              {sonHareketler.map((hareket) => {
                const urun = urunler.find((item) => item.id === hareket.urun_id);

                return (
                  <div
                    key={hareket.id}
                    className="flex flex-col gap-3 rounded-[1.5rem] bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="text-sm font-black text-slate-950">
                        {urun?.urun_adi || "Ürün bulunamadı"}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        {tarihFormatla(hareket.hareket_tarihi)} / {" "}
                        {hareketTuruEtiketleri[hareket.hareket_turu]}
                      </p>
                      {hareket.aciklama ? (
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {hareket.aciklama}
                        </p>
                      ) : null}
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-sm font-black text-slate-950">
                        {miktarFormatla(Number(hareket.miktar || 0))} {urun?.birim || ""}
                      </p>
                      <p className="mt-1 text-xs font-bold text-slate-500">
                        Maliyet: {paraFormatla(Number(hareket.birim_maliyet || 0))}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="mt-5 rounded-[1.7rem] bg-white p-5 text-sm font-bold leading-6 text-slate-500 shadow-lg shadow-slate-200">
          <span className="font-black text-slate-950">Not:</span> Bu ekranda ürün,
          hizmet, kategori, mevcut stok, kritik stok, hızlı toplu ürün girişi ve
          manuel stok hareketleri yönetilir. Fatura / fiş modülü eklendiğinde satış
          ve alış işlemleri stok hareketlerine otomatik yansıtılacak.
        </div>
      </section>

      <div className="fixed bottom-5 right-5 z-30 flex flex-col gap-2 lg:hidden">
        <button
          type="button"
          onClick={topluUrunAcKapat}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-emerald-600 text-lg font-black text-white shadow-2xl shadow-emerald-300 transition hover:bg-emerald-700"
          aria-label="Toplu ürün ekle"
        >
          ⇪
        </button>
        <button
          type="button"
          onClick={() => stokHareketiAc()}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-slate-950 text-lg font-black text-white shadow-2xl shadow-slate-300 transition hover:bg-slate-800"
          aria-label="Stok hareketi ekle"
        >
          ⇄
        </button>
        <button
          type="button"
          onClick={yeniUrunAc}
          className="inline-flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600 text-2xl font-black text-white shadow-2xl shadow-indigo-300 transition hover:bg-indigo-700"
          aria-label="Yeni ürün ekle"
        >
          +
        </button>
      </div>
    </main>
  );
}
