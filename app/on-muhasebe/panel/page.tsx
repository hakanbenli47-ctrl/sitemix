"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { OnMuhasebeModuleKey } from "@/lib/onMuhasebe/auth";
import { buildYearScopedUrl, getBrowserWorkYear } from "@/lib/onMuhasebe/workYear";
import {
  getOnMuhasebeDaysLeft,
  onMuhasebeStatusLabels,
  type OnMuhasebePlanId,
  type OnMuhasebeSubscriptionStatus,
} from "@/lib/onMuhasebe/plans";
import { supabaseClient } from "@/lib/supabaseClient";

type Profile = {
  id: string;
  full_name: string;
  phone: string;
  role: string;
};

type Company = {
  id: string;
  company_code: string | null;
  name: string;
  sector: string | null;
  phone: string | null;
};

type Subscription = {
  id: string;
  plan: OnMuhasebePlanId;
  status: OnMuhasebeSubscriptionStatus;
  trial_ends_at: string | null;
  monthly_price: number;
  total_price: number;
  saving_amount: number;
  currency: string;
  trialDaysLeft?: number;
};

type DashboardData = {
  profile: Profile;
  userEmail: string | null;
  company: Company;
  subscription: Subscription;
  summary: {
    kasaBakiyesi: number;
    tahsilEdilecek: number;
    odenecek: number;
    netCari: number;
    stokDegeri: number;
    kritikStok: number;
    aktifCari: number;
    toplamCari: number;
    aktifUrun: number;
    toplamUrun: number;
    bugunKasaGiris: number;
    bugunKasaCikis: number;
    buAySatis: number;
    buAyAlis: number;
    buAyNet: number;
    buHaftaOdeme: number;
    kasaHesapSayisi: number;
  };
  topProduct: {
    urunAdi: string;
    miktar: number;
    tutar: number;
  } | null;
  recentActivities: Array<{
    id: string;
    title: string;
    type: string;
    date: string;
    amount: number;
    tone: "green" | "red" | "violet" | "slate";
  }>;
  backup: {
    autoEnabled: boolean;
    email: string | null;
    frequencyHours: number;
    lastBackup: {
      created_at: string;
      status: string;
      email_to: string | null;
      row_count: number | null;
    } | null;
  };
  role: "owner" | "staff";
  permissions: Record<OnMuhasebeModuleKey, boolean>;
  isOwner: boolean;
  workYear: number;
};

const planLabels: Record<OnMuhasebePlanId, string> = {
  monthly: "Aylık Paket",
  six_month: "6 Aylık Paket",
  yearly: "Yıllık Paket",
};

const moduleCards = [
  {
    title: "Cari",
    desc: "Müşteri, tedarikçi, alacak ve borç takibi.",
    href: "/on-muhasebe/panel/cari",
    action: "Cari Aç",
    icon: "C",
    tone: "indigo",
    metricKey: "cari",
    permission: "cari",
  },
  {
    title: "Stok",
    desc: "Ürün, hizmet, fiyat, kritik stok ve hareketler.",
    href: "/on-muhasebe/panel/stok",
    action: "Stok Aç",
    icon: "S",
    tone: "cyan",
    metricKey: "stok",
    permission: "stok",
  },
  {
    title: "Kasa",
    desc: "Tahsilat, ödeme, gelir, gider, nakit ve banka.",
    href: "/on-muhasebe/panel/kasa",
    action: "Kasa Aç",
    icon: "₺",
    tone: "emerald",
    metricKey: "kasa",
    permission: "kasa",
  },
  {
    title: "Fatura / Fiş",
    desc: "Satış, alış, belge, PDF ve WhatsApp paylaşımı.",
    href: "/on-muhasebe/panel/fatura-fis",
    action: "Fiş Kes",
    icon: "F",
    tone: "violet",
    metricKey: "fis",
    permission: "fatura",
  },
  {
    title: "Rapor",
    desc: "Stok, cari, kasa ve fatura analizleri.",
    href: "/on-muhasebe/panel/rapor",
    action: "Rapor Aç",
    icon: "R",
    tone: "slate",
    metricKey: "rapor",
    permission: "rapor",
  },
] as const;

const quickActions = [
  {
    title: "Yeni Cari",
    desc: "Müşteri veya tedarikçi ekle",
    href: "/on-muhasebe/panel/cari",
    tone: "bg-indigo-600",
    permission: "cari",
  },
  {
    title: "Yeni Stok",
    desc: "Ürün, hizmet veya kategori ekle",
    href: "/on-muhasebe/panel/stok",
    tone: "bg-cyan-600",
    permission: "stok",
  },
  {
    title: "Tahsilat",
    desc: "Para girişini hızlı kaydet",
    href: "/on-muhasebe/panel/kasa",
    tone: "bg-emerald-600",
    permission: "kasa",
  },
  {
    title: "Satış Fişi",
    desc: "Satış belgesi oluştur",
    href: "/on-muhasebe/panel/fatura-fis",
    tone: "bg-violet-600",
    permission: "fatura",
  },
] as const;

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value?: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(date);
}

function toneClasses(tone: string) {
  const map: Record<string, string> = {
    indigo: "bg-indigo-600 text-white shadow-indigo-200",
    cyan: "bg-cyan-600 text-white shadow-cyan-200",
    emerald: "bg-emerald-600 text-white shadow-emerald-200",
    violet: "bg-violet-600 text-white shadow-violet-200",
    slate: "bg-slate-950 text-white shadow-slate-200",
  };

  return map[tone] || map.slate;
}

function activityTone(tone: DashboardData["recentActivities"][number]["tone"]) {
  const map = {
    green: "text-emerald-700 bg-emerald-50",
    red: "text-red-700 bg-red-50",
    violet: "text-violet-700 bg-violet-50",
    slate: "text-slate-700 bg-slate-100",
  };

  return map[tone];
}

export default function OnMuhasebePanelPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [workYear, setWorkYear] = useState(getBrowserWorkYear());
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const subscription = data?.subscription || null;
  const trialDaysLeft = useMemo(
    () =>
      subscription?.trialDaysLeft ??
      getOnMuhasebeDaysLeft(subscription?.trial_ends_at),
    [subscription?.trialDaysLeft, subscription?.trial_ends_at],
  );

  const moduleMetrics = useMemo(() => {
    if (!data) return null;

    return {
      cari: `${data.summary.aktifCari} aktif / ${formatMoney(data.summary.tahsilEdilecek)} alacak`,
      stok: `${data.summary.aktifUrun} kart / ${data.summary.kritikStok} kritik`,
      kasa: `${formatMoney(data.summary.kasaBakiyesi)} / ${data.summary.kasaHesapSayisi} hesap`,
      fis: `${formatMoney(data.summary.buAySatis)} satış / ${formatMoney(data.summary.buAyAlis)} alış`,
      rapor: `${formatMoney(data.summary.buAyNet)} aylık net`,
    };
  }, [data]);

  const visibleQuickActions = useMemo(() => {
    if (!data) return [];
    return quickActions.filter((action) => data.permissions[action.permission]);
  }, [data]);

  const visibleModuleCards = useMemo(() => {
    if (!data) return [];
    return moduleCards.filter((module) => data.permissions[module.permission]);
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
          window.location.href = "/on-muhasebe/giris";
          return;
        }

        const selectedWorkYear = getBrowserWorkYear();
        setWorkYear(selectedWorkYear);

        const response = await fetch(buildYearScopedUrl("/api/on-muhasebe/dashboard", selectedWorkYear), {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Panel özeti yüklenemedi.");
        }

        if (isMounted) {
          setData(result);
        }
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Panel özeti yüklenirken hata oluştu.",
        );
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadDashboard();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const introSeen = window.localStorage.getItem("onMuhasebeIntroSeen");

    if (!introSeen) {
      setIntroOpen(true);
    }
  }, []);

  function closeIntro() {
    window.localStorage.setItem("onMuhasebeIntroSeen", "true");
    setIntroOpen(false);
  }

  async function handleLogout() {
    await supabaseClient.auth.signOut();
    window.location.href = "/on-muhasebe/giris";
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-[#f3f6fb] px-5 py-6 text-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="h-20 animate-pulse rounded-[2rem] bg-white" />
          <div className="mt-5 grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
            <div className="h-72 animate-pulse rounded-[2rem] bg-white" />
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-[1.6rem] bg-white" />
            ))}
          </div>
        </div>
      </main>
    );
  }

  if (errorMessage || !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="max-w-md rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <p className="text-lg font-black text-red-600">Bir sorun oluştu</p>
          <p className="mt-3 text-sm font-bold leading-6 text-slate-500">
            {errorMessage || "Panel bilgileri alınamadı."}
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-black text-white"
          >
            Tekrar Dene
          </button>
        </div>
      </main>
    );
  }

  const { company, profile, summary, backup } = data;

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <Link href="/on-muhasebe/panel" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-300">
              S
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-[-0.03em]">
                Sitemix
              </span>
              <span className="block text-xs font-extrabold text-slate-500">
                Ön Muhasebe Paneli
              </span>
            </span>
          </Link>

          <div className="hidden flex-1 justify-center px-4 lg:flex">
            <div className="grid w-full max-w-xl grid-cols-4 gap-2 rounded-full bg-slate-100 p-1">
              {visibleQuickActions.map((action) => (
                <Link
                  key={action.title}
                  href={action.href}
                  prefetch
                  className="inline-flex min-h-10 items-center justify-center rounded-full px-3 text-xs font-black text-slate-600 transition hover:bg-white hover:text-slate-950 hover:shadow-sm"
                >
                  {action.title}
                </Link>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="hidden rounded-full bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700 sm:block">
              {workYear} yılı
            </div>
            <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 sm:block">
              {company.company_code || "-"}
            </div>
            <button
              type="button"
              onClick={() => setMenuOpen(true)}
              aria-label="Menüyü aç"
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 transition hover:bg-slate-200"
            >
              <span className="flex flex-col gap-1.5">
                <span className="block h-0.5 w-5 rounded-full bg-slate-950" />
                <span className="block h-0.5 w-5 rounded-full bg-slate-950" />
                <span className="block h-0.5 w-5 rounded-full bg-slate-950" />
              </span>
            </button>
          </div>
        </div>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50">
          <button
            type="button"
            aria-label="Menüyü kapat"
            onClick={() => setMenuOpen(false)}
            className="absolute inset-0 bg-slate-950/45 backdrop-blur-sm"
          />

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-5 shadow-2xl shadow-slate-950/20 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Yönetim
                </p>
                <h2 className="mt-1 text-2xl font-black tracking-[-0.05em]">
                  Menü
                </h2>
              </div>

              <button
                type="button"
                onClick={() => setMenuOpen(false)}
                className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-100 text-xl font-black text-slate-950 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                Firma Kodu
              </p>
              <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                {company.company_code || "-"}
              </p>
              <p className="mt-2 text-sm font-bold text-white/55">
                {company.name}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Firma", company.name],
                ["Çalışma Yılı", String(workYear)],
                ["Yetkili", profile.full_name || "-"],
                ["E-posta", data.userEmail || "-"],
                ["Telefon", profile.phone || company.phone || "-"],
                ["Sektör", company.sector || "-"],
              ].map(([label, value]) => (
                <div key={label} className="rounded-[1.35rem] bg-slate-100 p-4">
                  <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    {label}
                  </p>
                  <p className="mt-1 break-words text-sm font-black">{value}</p>
                </div>
              ))}
            </div>

            <div className="mt-5 grid gap-2">
              {[
                ["Ana Panel", "/on-muhasebe/panel"],
                ...(data.isOwner
                  ? [
                      ["Personel", "/on-muhasebe/panel/personel"],
                      ["Ayarlar", "/on-muhasebe/panel/ayarlar"],
                      ["Yedekleme", "/on-muhasebe/panel/yedekleme"],
                    ]
                  : [["Hesap Ayarları", "/on-muhasebe/panel/ayarlar"]]),
                ...(data.permissions.rapor
                  ? [["Raporlar", "/on-muhasebe/panel/rapor"]]
                  : []),
                ["Paketler", "/on-muhasebe#fiyatlar"],
              ].map(([label, href]) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="inline-flex min-h-[50px] items-center justify-between rounded-[1.25rem] bg-slate-100 px-5 text-sm font-black text-slate-950 transition hover:bg-slate-200"
                >
                  <span>{label}</span>
                  <span className="text-slate-400">→</span>
                </Link>
              ))}

              <a
                href="https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20destek%20istiyorum."
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[50px] items-center justify-between rounded-[1.25rem] bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              >
                <span>Destek / WhatsApp</span>
                <span>↗</span>
              </a>
            </div>

            <div className="mt-5 rounded-[1.75rem] bg-slate-100 p-5">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                Paket
              </p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-[1.25rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Paket</p>
                  <p className="mt-1 text-sm font-black">
                    {subscription ? planLabels[subscription.plan] : "-"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Durum</p>
                  <p className="mt-1 text-sm font-black text-indigo-600">
                    {subscription
                      ? onMuhasebeStatusLabels[subscription.status]
                      : "-"}
                  </p>
                </div>
                <div className="rounded-[1.25rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Kalan</p>
                  <p className="mt-1 text-sm font-black">{trialDaysLeft} gün</p>
                </div>
                <div className="rounded-[1.25rem] bg-white p-4">
                  <p className="text-xs font-black text-slate-400">Bitiş</p>
                  <p className="mt-1 text-sm font-black">
                    {formatDate(subscription?.trial_ends_at)}
                  </p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              className="mt-5 inline-flex min-h-[52px] items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Güvenli Çıkış Yap
            </button>
          </aside>
        </div>
      ) : null}

      {introOpen ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/60 px-4 py-5 backdrop-blur-sm sm:items-center">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-[2rem] bg-white p-5 shadow-2xl sm:p-7">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  İlk Kullanım
                </p>
                <h2 className="mt-2 text-3xl font-black tracking-[-0.05em]">
                  Ön muhasebeye hızlı başlangıç
                </h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                  Sistemi günlük kullanırken önce cari ve stok kartlarını
                  hazırlayıp, sonra kasa ve fiş işlemlerini girmek en hızlı
                  akıştır.
                </p>
              </div>
              <button
                type="button"
                onClick={closeIntro}
                className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 transition hover:bg-slate-200"
              >
                Kapat
              </button>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              {[
                [
                  "1",
                  "Cari kartlarını aç",
                  "Müşteri ve tedarikçilerini Cari ekranına ekle. Açılış bakiyesi varsa ilk kartta belirt.",
                  "/on-muhasebe/panel/cari",
                  "Cariye Git",
                ],
                [
                  "2",
                  "Ürün ve hizmetleri ekle",
                  "Stok ekranında ürün, hizmet, fiyat ve kritik stok bilgilerini hazırla.",
                  "/on-muhasebe/panel/stok",
                  "Stoka Git",
                ],
                [
                  "3",
                  "Günlük para hareketini gir",
                  "Tahsilat, ödeme, gelir ve giderleri Kasa ekranından kaydet.",
                  "/on-muhasebe/panel/kasa",
                  "Kasaya Git",
                ],
                [
                  "4",
                  "Fiş ve raporla kontrol et",
                  "Satış/alış fişlerini oluştur, raporlardan stok ve cari durumunu izle.",
                  "/on-muhasebe/panel/fatura-fis",
                  "Fiş Oluştur",
                ],
              ].map(([step, title, desc, href, action]) => (
                <Link
                  key={step}
                  href={href}
                  onClick={closeIntro}
                  className="rounded-[1.5rem] bg-slate-100 p-5 transition hover:bg-slate-200"
                >
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
                    {step}
                  </span>
                  <h3 className="mt-4 text-lg font-black tracking-[-0.04em]">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                    {desc}
                  </p>
                  <span className="mt-4 inline-flex rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950">
                    {action}
                  </span>
                </Link>
              ))}
            </div>

            <div className="mt-5 grid gap-3 rounded-[1.5rem] bg-emerald-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
              <div>
                <p className="text-sm font-black text-emerald-800">
                  Takıldığın yerde destek al
                </p>
                <p className="mt-1 text-xs font-bold leading-5 text-emerald-700/80">
                  Cari, stok, kasa veya fiş ekranlarında WhatsApp destek
                  butonlarını göreceksin.
                </p>
              </div>
              <a
                href="https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20ilk%20kurulum%20i%C3%A7in%20destek%20istiyorum."
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-xs font-black text-white transition hover:bg-emerald-700"
              >
                WhatsApp Destek
              </a>
            </div>

            <button
              type="button"
              onClick={closeIntro}
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-black text-white transition hover:bg-indigo-700"
            >
              Anladım, Panele Başla
            </button>
          </div>
        </div>
      ) : null}

      <section className="mx-auto max-w-7xl px-5 py-6 pb-24 lg:px-8 lg:py-8">
        <div className="grid gap-5 lg:grid-cols-[1.2fr_0.8fr]">
          <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-300 sm:p-8">
            <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="absolute bottom-[-110px] left-[-80px] h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                Günlük kontrol
              </p>
              <h1 className="mt-3 text-3xl font-black tracking-[-0.05em] sm:text-4xl lg:text-5xl">
                {company.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm font-bold leading-6 text-white/55">
                Bugünün kasa girişini, açık carileri, kritik stokları ve fiş
                hareketlerini tek ekrandan takip et.
              </p>

              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-[1.35rem] bg-white/10 p-4">
                  <p className="text-xs font-black text-white/40">Kasa</p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatMoney(summary.kasaBakiyesi)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] bg-white/10 p-4">
                  <p className="text-xs font-black text-white/40">
                    Tahsil Edilecek
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {formatMoney(summary.tahsilEdilecek)}
                  </p>
                </div>
                <div className="rounded-[1.35rem] bg-white/10 p-4">
                  <p className="text-xs font-black text-white/40">
                    Kritik Stok
                  </p>
                  <p className="mt-2 text-2xl font-black text-white">
                    {summary.kritikStok}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Bugün
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Hızlı Özet
                </h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700">
                {trialDaysLeft} gün
              </span>
            </div>

            <div className="mt-5 grid gap-3">
              <div className="flex items-center justify-between rounded-[1.35rem] bg-emerald-50 p-4">
                <span className="text-sm font-black text-emerald-700">
                  Kasa Girişi
                </span>
                <strong className="text-lg font-black text-emerald-700">
                  {formatMoney(summary.bugunKasaGiris)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-[1.35rem] bg-red-50 p-4">
                <span className="text-sm font-black text-red-700">
                  Kasa Çıkışı
                </span>
                <strong className="text-lg font-black text-red-700">
                  {formatMoney(summary.bugunKasaCikis)}
                </strong>
              </div>
              <div className="flex items-center justify-between rounded-[1.35rem] bg-slate-100 p-4">
                <span className="text-sm font-black text-slate-700">
                  Bu Ay Net
                </span>
                <strong className="text-lg font-black text-slate-950">
                  {formatMoney(summary.buAyNet)}
                </strong>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            >
              Tanıtımı Tekrar Aç
            </button>
          </div>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {visibleQuickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              prefetch
              className="group rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300"
            >
              <div
                className={[
                  "mb-5 flex h-11 w-11 items-center justify-center rounded-2xl text-lg font-black text-white",
                  action.tone,
                ].join(" ")}
              >
                +
              </div>
              <p className="text-xl font-black tracking-[-0.04em]">
                {action.title}
              </p>
              <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                {action.desc}
              </p>
              <span className="mt-5 inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white">
                Başla
              </span>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {visibleModuleCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              className="group rounded-[1.6rem] bg-white p-5 shadow-lg shadow-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300"
            >
              <div
                className={[
                  "flex h-12 w-12 items-center justify-center rounded-2xl text-base font-black shadow-lg",
                  toneClasses(item.tone),
                ].join(" ")}
              >
                {item.icon}
              </div>
              <p className="mt-5 text-xl font-black tracking-[-0.04em]">
                {item.title}
              </p>
              <p className="mt-1 min-h-10 text-xs font-bold leading-5 text-slate-500">
                {item.desc}
              </p>
              <p className="mt-4 rounded-[1rem] bg-slate-100 px-3 py-2 text-xs font-black text-slate-700">
                {moduleMetrics?.[item.metricKey] || "-"}
              </p>
              <div className="mt-4 flex items-center justify-between">
                <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-black text-white">
                  {item.action}
                </span>
                <span className="text-lg font-black text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-950">
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  Aylık Durum
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Satış, alış ve cari dengesi
                </h2>
              </div>
              <Link
                href="/on-muhasebe/panel/rapor"
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-950 transition hover:bg-slate-200"
              >
                Detaylı Rapor
              </Link>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-violet-50 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-500">
                  Satış
                </p>
                <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
                  {formatMoney(summary.buAySatis)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Alış
                </p>
                <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
                  {formatMoney(summary.buAyAlis)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                  Net
                </p>
                <p className="mt-3 text-3xl font-black tracking-[-0.06em]">
                  {formatMoney(summary.buAyNet)}
                </p>
              </div>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-emerald-50 p-5">
                <p className="text-xs font-black text-emerald-700">
                  Alacak
                </p>
                <p className="mt-2 text-xl font-black">
                  {formatMoney(summary.tahsilEdilecek)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-red-50 p-5">
                <p className="text-xs font-black text-red-700">Ödenecek</p>
                <p className="mt-2 text-xl font-black">
                  {formatMoney(summary.odenecek)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-cyan-50 p-5">
                <p className="text-xs font-black text-cyan-700">Stok Değeri</p>
                <p className="mt-2 text-xl font-black">
                  {formatMoney(summary.stokDegeri)}
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
                  Kullanım Kolaylığı
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Sıradaki işler
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              <Link
                href="/on-muhasebe/panel/stok"
                className="rounded-[1.5rem] bg-slate-100 p-4 transition hover:bg-slate-200"
              >
                <p className="text-sm font-black">Kritik stokları kontrol et</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  {summary.kritikStok} ürün kritik seviyede.
                </p>
              </Link>
              <Link
                href="/on-muhasebe/panel/kasa"
                className="rounded-[1.5rem] bg-slate-100 p-4 transition hover:bg-slate-200"
              >
                <p className="text-sm font-black">Haftalık ödemeleri izle</p>
                <p className="mt-1 text-xs font-bold text-slate-500">
                  Bu hafta kasa çıkışı: {formatMoney(summary.buHaftaOdeme)}
                </p>
              </Link>
              <Link
                href="/on-muhasebe/panel/yedekleme"
                className="rounded-[1.5rem] bg-slate-950 p-4 text-white transition hover:bg-slate-800"
              >
                <p className="text-sm font-black">Yedeğini güvenceye al</p>
                <p className="mt-1 text-xs font-bold text-white/55">
                  Otomatik yedek: {backup.autoEnabled ? "Açık" : "Kapalı"}
                </p>
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Yedek ve Güvenlik
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
              Verilerin güvende kalsın
            </h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black text-slate-400">
                  Otomatik Yedek
                </p>
                <p className="mt-1 text-sm font-black">
                  {backup.autoEnabled
                    ? `${backup.frequencyHours} saatte bir açık`
                    : "Kapalı"}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black text-slate-400">
                  Yedek E-postası
                </p>
                <p className="mt-1 break-words text-sm font-black">
                  {backup.email || data.userEmail || "-"}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black text-slate-400">Son Yedek</p>
                <p className="mt-1 text-sm font-black">
                  {backup.lastBackup
                    ? `${formatDate(backup.lastBackup.created_at)} / ${backup.lastBackup.status}`
                    : "Henüz yok"}
                </p>
              </div>
            </div>
            <Link
              href="/on-muhasebe/panel/yedekleme"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700"
            >
              Manuel Yedek Al
            </Link>
          </div>

          <div className="rounded-[2rem] bg-white p-6 shadow-xl shadow-slate-200">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Son Hareketler
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  İşlem akışı
                </h2>
              </div>
            </div>
            <div className="mt-5 grid gap-3">
              {data.recentActivities.length === 0 ? (
                <div className="rounded-[1.5rem] bg-slate-100 p-5 text-sm font-bold text-slate-500">
                  Henüz hareket yok. İlk cari, stok veya kasa işlemini hızlı
                  işlem kartlarından ekleyebilirsin.
                </div>
              ) : null}

              {data.recentActivities.map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4"
                >
                  <div>
                    <span
                      className={[
                        "inline-flex rounded-full px-3 py-1 text-[11px] font-black",
                        activityTone(activity.tone),
                      ].join(" ")}
                    >
                      {activity.type}
                    </span>
                    <p className="mt-2 text-sm font-black">{activity.title}</p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {formatDate(activity.date)}
                    </p>
                  </div>
                  <p className="shrink-0 text-sm font-black">
                    {formatMoney(activity.amount)}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <nav className="fixed bottom-4 left-1/2 z-30 flex w-[calc(100%-2rem)] max-w-md -translate-x-1/2 items-center justify-between rounded-full bg-slate-950/95 px-3 py-3 shadow-2xl shadow-slate-400 backdrop-blur-xl lg:hidden">
        {visibleModuleCards.slice(0, 4).map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="flex min-h-12 min-w-12 items-center justify-center rounded-full text-sm font-black text-white/75 transition hover:bg-white/10 hover:text-white"
          >
            {item.icon}
          </Link>
        ))}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="flex min-h-12 min-w-12 items-center justify-center rounded-full bg-white text-sm font-black text-slate-950"
        >
          ≡
        </button>
      </nav>
    </main>
  );
}
