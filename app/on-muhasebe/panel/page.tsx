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
    birim?: string;
    miktar: number;
    tutar: number;
  } | null;
  criticalProducts: Array<{
    id: string;
    urunAdi: string;
    birim: string;
    mevcutStok: number;
    kritikStok: number;
  }>;
  todaySoldProducts: Array<{
    urunAdi: string;
    birim: string;
    miktar: number;
    tutar: number;
  }>;
  topSoldProducts: Array<{
    urunAdi: string;
    birim: string;
    miktar: number;
    tutar: number;
  }>;
  upcomingReceivables: Array<{
    id: string;
    cariId: string;
    cariUnvan: string;
    belgeNo: string;
    dueDate: string;
    amount: number;
    daysLeft: number;
  }>;
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
    title: "Cari Ekle",
    desc: "Yeni müşteri veya tedarikçi kaydı aç",
    href: "/on-muhasebe/panel/cari",
    tone: "bg-indigo-600",
    icon: "+C",
    permission: "cari",
  },
  {
    title: "Cariler",
    desc: "Müşteri ve tedarikçi kartlarını görüntüle",
    href: "/on-muhasebe/panel/cari",
    tone: "bg-indigo-950",
    icon: "C",
    permission: "cari",
  },
  {
    title: "Stok Ekle",
    desc: "Yeni ürün veya hizmet kartı oluştur",
    href: "/on-muhasebe/panel/stok",
    tone: "bg-cyan-600",
    icon: "+S",
    permission: "stok",
  },
  {
    title: "Stoklar",
    desc: "Ürünleri, miktarları ve stok hareketlerini gör",
    href: "/on-muhasebe/panel/stok",
    tone: "bg-cyan-950",
    icon: "S",
    permission: "stok",
  },
  {
    title: "Fiş Ekle",
    desc: "Yeni satış veya alış fişi oluştur",
    href: "/on-muhasebe/panel/fatura-fis",
    tone: "bg-violet-600",
    icon: "+F",
    permission: "fatura",
  },
  {
    title: "Kasa",
    desc: "Tahsilat, ödeme, gelir ve gider işlemlerine ulaş",
    href: "/on-muhasebe/panel/kasa",
    tone: "bg-emerald-600",
    icon: "₺",
    permission: "kasa",
  },
] as const;

const guideCards = [
  {
    title: "Ana Panel",
    icon: "AP",
    href: "/on-muhasebe/panel",
    permission: "dashboard",
    desc: "Sık kullanılan işlemlere ulaş, önemli finansal özetleri istediğinde açıp gizle.",
    points: ["Hızlı işlem kısayolları", "Gizlenebilir finansal özet", "Son hareket ve yaklaşan iş takibi"],
  },
  {
    title: "Cari",
    icon: "C",
    href: "/on-muhasebe/panel/cari",
    permission: "cari",
    desc: "Müşteri ve tedarikçi kartlarını tek yerde düzenle.",
    points: ["Cari kartı ve iletişim bilgileri", "Alacak, borç ve açılış bakiyesi", "Cari hareket geçmişi"],
  },
  {
    title: "Stok",
    icon: "S",
    href: "/on-muhasebe/panel/stok",
    permission: "stok",
    desc: "Ürün ve hizmetlerini, fiyatlarını ve stok seviyelerini takip et.",
    points: ["Ürün ve hizmet kartları", "Alış ve satış fiyatları", "Kritik stok ve hareket kontrolü"],
  },
  {
    title: "Kasa",
    icon: "₺",
    href: "/on-muhasebe/panel/kasa",
    permission: "kasa",
    desc: "Nakit ve banka hareketlerini doğru işlem türüyle kaydet.",
    points: ["Tahsilat ve ödeme", "Gelir, gider ve transfer", "Kasa hesabı ve işlem fişi"],
  },
  {
    title: "Fatura / Fiş",
    icon: "F",
    href: "/on-muhasebe/panel/fatura-fis",
    permission: "fatura",
    desc: "Satış ve alış belgelerini kalemleriyle birlikte oluştur.",
    points: ["Satış ve alış fişleri", "Ürün, miktar, KDV ve toplam", "PDF, yazdırma ve paylaşım"],
  },
  {
    title: "Raporlar",
    icon: "R",
    href: "/on-muhasebe/panel/rapor",
    permission: "rapor",
    desc: "Kayıtlarını dönem ve tarih filtreleriyle anlaşılır biçimde incele.",
    points: ["Stok ve ürün raporları", "Cari ve kasa raporları", "Fatura ve işlem detayları"],
  },
  {
    title: "Personel",
    icon: "P",
    href: "/on-muhasebe/panel/personel",
    permission: "personel",
    ownerOnly: true,
    desc: "Çalışan hesaplarını oluştur ve görebilecekleri alanları belirle.",
    points: ["Personel giriş bilgileri", "Modül bazlı yetkilendirme", "Aktif ve pasif kullanıcı yönetimi"],
  },
  {
    title: "Yedekleme",
    icon: "Y",
    href: "/on-muhasebe/panel/yedekleme",
    permission: "yedekleme",
    ownerOnly: true,
    desc: "Muhasebe kayıtlarının yedeğini indir veya e-posta ayarlarını yönet.",
    points: ["Manuel yedek oluşturma", "Yedek dosyasını indirme", "Otomatik yedek durumu"],
  },
  {
    title: "Ayarlar",
    icon: "A",
    href: "/on-muhasebe/panel/ayarlar",
    permission: "ayarlar",
    desc: "Hesap, güvenlik ve işletme tercihlerini tek merkezden düzenle.",
    points: ["Genel uygulama tercihleri", "Şifre yenileme", "Dönem ve devir işlemleri"],
  },
] as const;

function formatMoney(value?: number | null) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatNumber(value?: number | null) {
  return new Intl.NumberFormat("tr-TR", {
    maximumFractionDigits: 2,
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

function receivableTimeLabel(daysLeft: number) {
  if (daysLeft < 0) return `${Math.abs(daysLeft)} gün gecikti`;
  if (daysLeft === 0) return "Bugün";
  return `${daysLeft} gün sonra`;
}

const DASHBOARD_CACHE_TTL_MS = 10 * 60 * 1000;
const DASHBOARD_CACHE_PREFIX = "onMuhasebeDashboardV2";

type CachedDashboard = {
  expiresAt: number;
  data: DashboardData;
};

function dashboardCacheKey(workYear: number) {
  return `${DASHBOARD_CACHE_PREFIX}:${workYear}`;
}

function readCachedDashboard(workYear: number) {
  if (typeof window === "undefined") return null;

  try {
    const raw = window.sessionStorage.getItem(dashboardCacheKey(workYear));
    if (!raw) return null;

    const cached = JSON.parse(raw) as CachedDashboard;
    if (!cached?.data || cached.expiresAt < Date.now()) {
      window.sessionStorage.removeItem(dashboardCacheKey(workYear));
      return null;
    }

    return cached.data;
  } catch {
    window.sessionStorage.removeItem(dashboardCacheKey(workYear));
    return null;
  }
}

function writeCachedDashboard(workYear: number, data: DashboardData) {
  if (typeof window === "undefined") return;

  window.sessionStorage.setItem(
    dashboardCacheKey(workYear),
    JSON.stringify({
      expiresAt: Date.now() + DASHBOARD_CACHE_TTL_MS,
      data,
    } satisfies CachedDashboard),
  );
}

export default function OnMuhasebePanelPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [introOpen, setIntroOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const subscription = data?.subscription || null;
  const trialDaysLeft = useMemo(
    () =>
      subscription?.trialDaysLeft != null
        ? subscription.trialDaysLeft
        : getOnMuhasebeDaysLeft(subscription?.trial_ends_at),
    [subscription?.trialDaysLeft, subscription?.trial_ends_at],
  );

  const visibleQuickActions = useMemo(() => {
    if (!data) return [];
    return quickActions.filter((action) => data.permissions[action.permission]);
  }, [data]);

  const visibleModuleCards = useMemo(() => {
    if (!data) return [];
    return moduleCards.filter((module) => data.permissions[module.permission]);
  }, [data]);

  const visibleGuideCards = useMemo(() => {
    if (!data) return [];
    return guideCards.filter(
      (card) =>
        data.permissions[card.permission] &&
        (!("ownerOnly" in card) || !card.ownerOnly || data.isOwner),
    );
  }, [data]);

  useEffect(() => {
    let isMounted = true;

    async function loadDashboard() {
      setErrorMessage("");

      try {
        const selectedWorkYear = getBrowserWorkYear();
        const cachedDashboard = readCachedDashboard(selectedWorkYear);

        if (cachedDashboard) {
          setData(cachedDashboard);
          setIsLoading(false);
        } else {
          setIsLoading(true);
        }

        const {
          data: { session },
          error: sessionError,
        } = await supabaseClient.auth.getSession();

        if (sessionError || !session) {
          window.location.href = "/on-muhasebe/giris";
          return;
        }

        const response = await fetch(buildYearScopedUrl("/api/on-muhasebe/dashboard", selectedWorkYear), {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          if (response.status === 403 && result?.allowed === false) {
            const searchParams = new URLSearchParams();
            const subscription = result.subscription;
            if (subscription?.planLabel) searchParams.set("paket", subscription.planLabel);
            if (subscription?.trial_ends_at) searchParams.set("bitis", subscription.trial_ends_at);
            if (subscription?.statusLabel) searchParams.set("durum", subscription.statusLabel);
            if (subscription?.monthly_price != null) searchParams.set("aylik", String(subscription.monthly_price));
            if (subscription?.total_price != null) searchParams.set("toplam", String(subscription.total_price));
            if (subscription?.currency) searchParams.set("para", subscription.currency);
            if (subscription?.billing_period_months != null) searchParams.set("ay", String(subscription.billing_period_months));
            if (result?.role) searchParams.set("rol", result.role);
            window.location.href = `/on-muhasebe/deneme-bitti?${searchParams.toString()}`;
            return;
          }

          throw new Error(result.message || "Panel özeti yüklenemedi.");
        }

        if (isMounted) {
          setData(result);
          writeCachedDashboard(selectedWorkYear, result);
        }
      } catch (error) {
        if (!isMounted) return;

        if (!readCachedDashboard(getBrowserWorkYear())) {
          setErrorMessage(
            error instanceof Error
              ? error.message
              : "Panel özeti yüklenirken hata oluştu.",
          );
        }
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
  const todaySoldProducts = data.todaySoldProducts || [];
  const topSoldProducts = data.topSoldProducts || [];
  const upcomingReceivables = data.upcomingReceivables || [];

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3 sm:gap-4 sm:px-5 sm:py-4 lg:px-8">
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
            <div className="hidden rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-600 sm:block">
              {company.company_code || "-"}
            </div>
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              aria-label="Kullanım tanıtımını aç"
              title="Kullanım tanıtımını aç"
              className="inline-flex h-12 items-center justify-center gap-2 rounded-2xl bg-indigo-50 px-3 text-indigo-700 transition hover:bg-indigo-100 sm:px-4"
            >
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs font-black text-white">
                i
              </span>
              <span className="hidden text-xs font-black xl:inline">Tanıtım</span>
            </button>
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

          <aside className="absolute right-0 top-0 flex h-full w-full max-w-md flex-col overflow-y-auto bg-white p-4 shadow-2xl shadow-slate-950/20 sm:p-6">
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
                x
              </button>
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-slate-950 p-5 text-white">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-white/40">
                Firma Kodu
              </p>
              <p className="mt-2 break-words text-2xl font-black tracking-[-0.04em] text-white sm:text-3xl">
                {company.company_code || "-"}
              </p>
              <p className="mt-2 text-sm font-bold text-white/55">
                {company.name}
              </p>
            </div>

            <div className="mt-5 grid gap-3">
              {[
                ["Firma", company.name],
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
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setIntroOpen(true);
                }}
                className="inline-flex min-h-[50px] items-center justify-between rounded-[1.25rem] bg-indigo-50 px-5 text-sm font-black text-indigo-700 transition hover:bg-indigo-100"
              >
                <span>Kullanım Rehberi</span>
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-xs text-white">i</span>
              </button>
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
                  <span className="text-slate-400">&gt;</span>
                </Link>
              ))}

              <a
                href="https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20destek%20istiyorum."
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[50px] items-center justify-between rounded-[1.25rem] bg-emerald-50 px-5 text-sm font-black text-emerald-700 transition hover:bg-emerald-100"
              >
                <span>Destek / WhatsApp</span>
                <span>&gt;</span>
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
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/65 px-2 py-2 backdrop-blur-sm sm:items-center sm:px-4 sm:py-5">
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="onboarding-title"
            className="max-h-[96vh] w-full max-w-6xl overflow-y-auto rounded-[1.75rem] bg-white shadow-2xl sm:max-h-[92vh] sm:rounded-[2rem]"
          >
            <div className="sticky top-0 z-20 flex items-start justify-between gap-4 border-b border-slate-200 bg-white/95 p-5 backdrop-blur-xl sm:px-7 sm:py-6">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
                  Sitemix Kullanım Rehberi
                </p>
                <h2 id="onboarding-title" className="mt-1 text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  Ön muhasebeyi adım adım tanıyın
                </h2>
                <p className="mt-2 max-w-3xl text-xs font-bold leading-5 text-slate-500 sm:text-sm sm:leading-6">
                  Her alanın ne işe yaradığını, günlük çalışma sırasını ve önemli
                  kullanım ipuçlarını bu ekranda görebilirsiniz.
                </p>
              </div>
              <button
                type="button"
                onClick={closeIntro}
                aria-label="Tanıtımı kapat"
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-slate-100 text-sm font-black text-slate-700 transition hover:bg-slate-200"
              >
                ×
              </button>
            </div>

            <div className="p-5 sm:p-7">
              <section className="overflow-hidden rounded-[1.5rem] bg-slate-950 p-5 text-white sm:p-6">
                <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-300">Önce burayı bilin</p>
                    <h3 className="mt-2 text-xl font-black sm:text-2xl">Güvenli ve sade ana panel</h3>
                    <p className="mt-2 max-w-3xl text-sm font-bold leading-6 text-white/60">
                      Kasa ve cari gibi özel rakamlar ana ekranda kapalı başlar.
                      “Detayları Göster” ile özetleri açabilir, aynı düğmeyle yeniden gizleyebilirsiniz.
                    </p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center text-[11px] font-black sm:text-xs">
                    <span className="rounded-xl bg-white/10 px-3 py-3">Kısayollar</span>
                    <span className="rounded-xl bg-white/10 px-3 py-3">Gizli özet</span>
                    <span className="rounded-xl bg-white/10 px-3 py-3">Hızlı menü</span>
                  </div>
                </div>
              </section>

              <section className="mt-7">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Önerilen çalışma sırası</p>
                  <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">İlk kurulumdan günlük kullanıma</h3>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {[
                    ["1", "Cari kartlarını hazırla", "Müşteri ve tedarikçileri, iletişim bilgileri ve varsa açılış bakiyesiyle kaydet."],
                    ["2", "Stokları tanımla", "Ürün ve hizmet kartlarını; birim, fiyat ve kritik stok bilgileriyle oluştur."],
                    ["3", "İşlemleri kaydet", "Satış/alış fişlerini ve tahsilat, ödeme, gelir veya gider hareketlerini gir."],
                    ["4", "Raporla kontrol et", "Dönem sonunda cari, stok, kasa ve fatura raporlarından kayıtlarını karşılaştır."],
                  ].map(([step, title, desc]) => (
                    <div key={step} className="rounded-[1.35rem] bg-slate-100 p-4">
                      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-600 text-sm font-black text-white">{step}</span>
                      <h4 className="mt-3 text-sm font-black text-slate-950">{title}</h4>
                      <p className="mt-2 text-xs font-bold leading-5 text-slate-500">{desc}</p>
                    </div>
                  ))}
                </div>
              </section>

              <section className="mt-8">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Tüm alanlar</p>
                  <h3 className="mt-1 text-xl font-black tracking-[-0.03em]">Hangi bölümde ne yapabilirsiniz?</h3>
                  <p className="mt-2 text-sm font-bold text-slate-500">Yalnızca hesabınızın erişebildiği alanlar gösterilir.</p>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {visibleGuideCards.map((card) => (
                    <Link
                      key={card.href}
                      href={card.href}
                      onClick={closeIntro}
                      className="group rounded-[1.5rem] border border-slate-200 bg-white p-5 transition hover:-translate-y-0.5 hover:border-indigo-200 hover:shadow-lg"
                    >
                      <div className="flex items-start gap-3">
                        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-950 text-xs font-black text-white">{card.icon}</span>
                        <div>
                          <h4 className="text-base font-black text-slate-950">{card.title}</h4>
                          <p className="mt-1 text-xs font-bold leading-5 text-slate-500">{card.desc}</p>
                        </div>
                      </div>
                      <ul className="mt-4 grid gap-2">
                        {card.points.map((point) => (
                          <li key={point} className="flex items-start gap-2 text-xs font-bold text-slate-600">
                            <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-indigo-500" />
                            <span>{point}</span>
                          </li>
                        ))}
                      </ul>
                      <span className="mt-4 inline-flex text-xs font-black text-indigo-600 group-hover:text-indigo-800">
                        Bölümü Aç →
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="mt-8 grid gap-3 md:grid-cols-2">
                <div className="rounded-[1.5rem] bg-amber-50 p-5">
                  <p className="text-sm font-black text-amber-900">Fiş ve kasa ilişkisi</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-amber-800/75">
                    Satış ve alış belgelerini Fatura / Fiş alanından; doğrudan para giriş ve çıkışlarını Kasa alanından kaydedin. Böylece kayıt türleri düzenli kalır.
                  </p>
                </div>
                <div className="rounded-[1.5rem] bg-cyan-50 p-5">
                  <p className="text-sm font-black text-cyan-900">Dönem ve yetki kontrolü</p>
                  <p className="mt-2 text-xs font-bold leading-5 text-cyan-800/75">
                    İşlem yapmadan önce seçili çalışma dönemini kontrol edin. Personel hesapları yalnızca yönetici tarafından izin verilen bölümlere erişebilir.
                  </p>
                </div>
              </section>

              <div className="mt-6 grid gap-3 rounded-[1.5rem] bg-emerald-50 p-5 sm:grid-cols-[1fr_auto] sm:items-center">
                <div>
                  <p className="text-sm font-black text-emerald-800">Tanıtıma her zaman geri dönebilirsiniz</p>
                  <p className="mt-1 text-xs font-bold leading-5 text-emerald-700/80">
                    Üst çubuktaki “i” bilgi düğmesi bu rehberi yeniden açar. Yardıma ihtiyaç duyarsanız destek bağlantısını da kullanabilirsiniz.
                  </p>
                </div>
                <a
                  href="https://wa.me/905515550302?text=Sitemix%20On%20Muhasebe%20kullan%C4%B1m%C4%B1%20i%C3%A7in%20destek%20istiyorum."
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
                Rehberi Kapat ve Panele Başla
              </button>
            </div>
          </div>
        </div>
      ) : null}

    <section className="mx-auto max-w-7xl px-4 py-4 sm:px-5 sm:py-6 lg:px-8 lg:py-8">
        <div>
          <div className="relative min-h-[270px] overflow-hidden rounded-[2rem] bg-slate-950 p-6 text-white shadow-xl shadow-slate-300 sm:min-h-[330px] sm:p-9 lg:p-12">
            <div className="absolute right-[-90px] top-[-90px] h-64 w-64 rounded-full bg-indigo-500/30 blur-3xl" />
            <div className="absolute bottom-[-110px] left-[-80px] h-64 w-64 rounded-full bg-cyan-500/20 blur-3xl" />
            <div className="relative">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-indigo-300">
                İşletmenizin kontrol merkezi
              </p>
              <h1 className="mt-4 max-w-5xl break-words text-4xl font-black tracking-[-0.055em] sm:text-6xl lg:text-7xl">
                Sitemix Ön Muhasebe
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-bold leading-6 text-white/55 sm:text-base sm:leading-7">
                Cari, stok, kasa ve fiş işlemlerinizi tek merkezden yönetin.
                Finansal analizleriniz siz açana kadar gizli tutulur.
              </p>
              <div className="mt-7 flex flex-wrap gap-2">
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/75">{company.name}</span>
                <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-black text-white/75">{data.workYear} çalışma dönemi</span>
              </div>
            </div>
          </div>

          <div className="hidden rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                  Gizli özet
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                  Önemli Bilgiler
                </h2>
              </div>
              <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700">
                {trialDaysLeft} gün
              </span>
            </div>

            <div className="mt-5 rounded-[1.35rem] bg-slate-100 p-5">
              <p className="text-sm font-black text-slate-800">Mahremiyet öncelikli görünüm</p>
              <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                Kasa, cari, satış ve stok özetleri yalnızca Detayları Göster
                düğmesine bastığınızda açılır.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setIntroOpen(true)}
              className="mt-5 inline-flex min-h-11 w-full items-center justify-center rounded-full bg-slate-100 px-5 text-xs font-black text-slate-700 transition hover:bg-slate-200"
            >
              Kullanım Rehberini Aç
            </button>
          </div>
        </div>

        <div className="mt-6 flex items-end justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">Sık Kullanılanlar</p>
            <p className="mt-1 text-xs font-bold text-slate-500">Yeni kayıt ve günlük işlemler için hızlı başlangıç.</p>
          </div>
        </div>
        <div className="mt-3 grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-6">
          {visibleQuickActions.map((action) => (
            <Link
              key={action.title}
              href={action.href}
              prefetch
              title={action.desc}
              aria-label={`${action.title}: ${action.desc}`}
              className="group rounded-[1.25rem] bg-white p-3 shadow-lg shadow-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300 sm:rounded-[1.6rem] sm:p-5"
            >
              <div
                className={[
                  "mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-[11px] font-black text-white sm:mb-5 sm:h-11 sm:w-11 sm:rounded-2xl sm:text-sm",
                  action.tone,
                ].join(" ")}
              >
                {action.icon}
              </div>
              <p className="text-sm font-black tracking-[-0.04em] sm:text-xl">
                {action.title}
              </p>
              <p className="mt-1 hidden text-xs font-bold leading-5 text-slate-500 sm:block">
                {action.desc}
              </p>
              <span className="mt-3 inline-flex rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 transition group-hover:bg-slate-950 group-hover:text-white sm:mt-5 sm:px-3 sm:text-xs">
                Başla
              </span>
            </Link>
          ))}
        </div>

        <button
          type="button"
          onClick={() => setDetailsOpen((current) => !current)}
          className="mt-5 flex min-h-[64px] w-full items-center justify-between rounded-[1.5rem] bg-indigo-600 px-5 text-left text-white shadow-xl shadow-indigo-200 transition hover:bg-indigo-700 sm:px-7"
        >
          <span>
            <span className="block text-sm font-black sm:text-base">
              {detailsOpen ? "Detaylı Analizleri Gizle" : "Detaylı Analizleri Aç"}
            </span>
            <span className="mt-1 block text-[11px] font-bold text-white/65 sm:text-xs">
              Günlük, haftalık ve aylık finansal görünümü inceleyin
            </span>
          </span>
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/15 text-xl font-black">
            {detailsOpen ? "−" : "+"}
          </span>
        </button>

        <div className="hidden mt-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Çalışma Alanları</p>
          <p className="mt-1 text-xs font-bold text-slate-500">Kayıt, takip ve raporlama bölümlerine doğrudan ulaşın.</p>
        </div>
        <div className="mt-3 hidden grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-5">
          {visibleModuleCards.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              prefetch
              title={item.desc}
              aria-label={`${item.title}: ${item.desc}`}
              className="group rounded-[1.25rem] bg-white p-3 shadow-lg shadow-slate-200 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-slate-300 sm:rounded-[1.6rem] sm:p-5"
            >
              <div
                className={[
                  "flex h-9 w-9 items-center justify-center rounded-xl text-sm font-black shadow-lg sm:h-12 sm:w-12 sm:rounded-2xl sm:text-base",
                  toneClasses(item.tone),
                ].join(" ")}
              >
                {item.icon}
              </div>
              <p className="mt-3 text-sm font-black tracking-[-0.04em] sm:mt-5 sm:text-xl">
                {item.title}
              </p>
              <p className="mt-1 hidden min-h-10 text-xs font-bold leading-5 text-slate-500 sm:block">
                {item.desc}
              </p>
              <div className="mt-3 flex items-center justify-between sm:mt-4">
                <span className="rounded-full bg-slate-950 px-2.5 py-1 text-[10px] font-black text-white sm:px-3 sm:text-xs">
                  {item.action}
                </span>
                <span className="text-lg font-black text-slate-300 transition group-hover:translate-x-1 group-hover:text-slate-950">
                  &gt;
                </span>
              </div>
            </Link>
          ))}
        </div>

        {detailsOpen ? <>
        <ProfessionalAnalytics data={data} />
        <div className="mt-5 grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
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
                  <p className="mt-3 break-words text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  {formatMoney(summary.buAySatis)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Alış
                </p>
                  <p className="mt-3 break-words text-2xl font-black tracking-[-0.04em] sm:text-3xl">
                  {formatMoney(summary.buAyAlis)}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                  Net
                </p>
                  <p className="mt-3 break-words text-2xl font-black tracking-[-0.04em] sm:text-3xl">
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

          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
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
              {data.isOwner ? (
              <Link
                href="/on-muhasebe/panel/yedekleme"
                className="rounded-[1.5rem] bg-slate-950 p-4 text-white transition hover:bg-slate-800"
              >
                <p className="text-sm font-black">Yedeğini güvenceye al</p>
                <p className="mt-1 text-xs font-bold text-white/55">
                  Otomatik yedek: {backup.autoEnabled ? "Açık" : "Kapalı"}
                </p>
              </Link>
              ) : null}
            </div>
          </div>
        </div>

        {data.isOwner ? (
        <div className="mt-5 grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
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

          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
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
        ) : (
          <div className="mt-5 grid gap-5 lg:grid-cols-3">
            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-violet-600">
                Bugün
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                Satılan ürünler
              </h2>
              <div className="mt-5 grid gap-3">
                {todaySoldProducts.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-slate-100 p-5 text-sm font-bold text-slate-500">
                    Bugün satış fişi yok.
                  </div>
                ) : null}

                {todaySoldProducts.map((item) => (
                  <div key={item.urunAdi} className="rounded-[1.5rem] bg-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black">{item.urunAdi}</p>
                      <p className="shrink-0 text-sm font-black text-violet-700">
                        {formatMoney(item.tutar)}
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      {formatNumber(item.miktar)} {item.birim}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-600">
                Performans
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                En çok satılanlar
              </h2>
              <div className="mt-5 grid gap-3">
                {topSoldProducts.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-slate-100 p-5 text-sm font-bold text-slate-500">
                    Seçili dönemde satış yok.
                  </div>
                ) : null}

                {topSoldProducts.map((item) => (
                  <div key={item.urunAdi} className="rounded-[1.5rem] bg-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm font-black">{item.urunAdi}</p>
                      <p className="shrink-0 text-sm font-black text-cyan-700">
                        {formatNumber(item.miktar)} {item.birim}
                      </p>
                    </div>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Toplam: {formatMoney(item.tutar)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
              <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
                Cari
              </p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
                Yaklaşan alacaklar
              </h2>
              <div className="mt-5 grid gap-3">
                {upcomingReceivables.length === 0 ? (
                  <div className="rounded-[1.5rem] bg-slate-100 p-5 text-sm font-bold text-slate-500">
                    Yaklaşan alacak kaydı yok.
                  </div>
                ) : null}

                {upcomingReceivables.map((item) => (
                  <div key={item.id} className="rounded-[1.5rem] bg-slate-100 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-black">{item.cariUnvan}</p>
                        <p className="mt-1 text-xs font-bold text-slate-500">
                          {item.belgeNo} / {formatDate(item.dueDate)}
                        </p>
                      </div>
                      <p className="shrink-0 text-sm font-black text-emerald-700">
                        {formatMoney(item.amount)}
                      </p>
                    </div>
                    <p className="mt-2 text-xs font-black text-slate-500">
                      {receivableTimeLabel(item.daysLeft)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
        </> : null}
      </section>

     
    </main>
  );
}

type AnalysisPeriod = "today" | "week" | "month";

type PersonnelAnalytics = {
  setupRequired?: boolean;
  message?: string;
  summary?: {
    total: number;
    totalAmount: number;
    byModule: Record<string, number>;
    byAction: Record<string, number>;
  };
  activities?: Array<{
    id: string;
    title: string;
    detail: string | null;
    module_key: string;
    action_type: string;
    amount: number | null;
    movement_date: string | null;
    created_at: string;
  }>;
};

function ProfessionalAnalytics({ data }: { data: DashboardData }) {
  const [period, setPeriod] = useState<AnalysisPeriod>("month");
  const [personnelAnalytics, setPersonnelAnalytics] = useState<PersonnelAnalytics | null>(null);
  const [personnelLoading, setPersonnelLoading] = useState(false);
  const [personnelError, setPersonnelError] = useState("");

  const { summary } = data;
  const criticalProducts = data.criticalProducts || [];
  const upcomingReceivables = data.upcomingReceivables || [];
  const topSoldProducts = data.topSoldProducts || [];
  const sevenDayReceivables = upcomingReceivables
    .filter((item) => item.daysLeft >= 0 && item.daysLeft <= 7)
    .reduce((total, item) => total + item.amount, 0);

  const periodView = useMemo(() => {
    if (period === "today") {
      const difference = summary.bugunKasaGiris - summary.bugunKasaCikis;
      return {
        eyebrow: "Bugünün para hareketi",
        title: "Günlük kasa görünümü",
        note: "Tamamlanan kasa hareketlerine göre hesaplanır.",
        items: [
          { label: "Kasa Girişi", value: summary.bugunKasaGiris, color: "bg-emerald-500" },
          { label: "Kasa Çıkışı", value: summary.bugunKasaCikis, color: "bg-red-500" },
          { label: "Günlük Fark", value: difference, color: difference >= 0 ? "bg-indigo-500" : "bg-amber-500" },
        ],
      };
    }

    if (period === "week") {
      const difference = sevenDayReceivables - summary.buHaftaOdeme;
      return {
        eyebrow: "Bu haftanın para planı",
        title: "Haftalık nakit görünümü",
        note: "Ödemeler gerçekleşen, alacaklar yaklaşan vadeli kayıtlardır.",
        items: [
          { label: "Yaklaşan Alacak", value: sevenDayReceivables, color: "bg-emerald-500" },
          { label: "Haftalık Ödeme", value: summary.buHaftaOdeme, color: "bg-red-500" },
          { label: "Beklenen Fark", value: difference, color: difference >= 0 ? "bg-indigo-500" : "bg-amber-500" },
        ],
      };
    }

    return {
      eyebrow: "Bu ayın fiş toplamları",
      title: "Aylık satış ve alış görünümü",
      note: "Satış ve alış fişlerine göre hesaplanır; genel giderler hariçtir.",
      items: [
        { label: "Satış", value: summary.buAySatis, color: "bg-violet-500" },
        { label: "Alış", value: summary.buAyAlis, color: "bg-cyan-500" },
        { label: "Satış-Alış Farkı", value: summary.buAyNet, color: summary.buAyNet >= 0 ? "bg-indigo-500" : "bg-amber-500" },
      ],
    };
  }, [period, sevenDayReceivables, summary]);

  useEffect(() => {
    if (!data.isOwner) return;

    let isMounted = true;

    async function loadPersonnelAnalytics() {
      setPersonnelLoading(true);
      setPersonnelError("");

      try {
        const {
          data: { session },
        } = await supabaseClient.auth.getSession();

        if (!session) throw new Error("Oturum bilgisi bulunamadı.");

        const periodMap: Record<AnalysisPeriod, string> = {
          today: "gunluk",
          week: "haftalik",
          month: "aylik",
        };
        const params = new URLSearchParams({
          period: periodMap[period],
          staffUserId: "all",
        });
        const response = await fetch(
          buildYearScopedUrl(
            `/api/on-muhasebe/personel-hareketleri?${params.toString()}`,
            data.workYear,
          ),
          {
            headers: { Authorization: `Bearer ${session.access_token}` },
            cache: "no-store",
          },
        );
        const result = (await response.json().catch(() => null)) as PersonnelAnalytics | null;

        if (!response.ok || !result) {
          throw new Error(result?.message || "Personel hareketleri alınamadı.");
        }

        if (isMounted) setPersonnelAnalytics(result);
      } catch (error) {
        if (isMounted) {
          setPersonnelError(
            error instanceof Error ? error.message : "Personel hareketleri alınamadı.",
          );
        }
      } finally {
        if (isMounted) setPersonnelLoading(false);
      }
    }

    loadPersonnelAnalytics();

    return () => {
      isMounted = false;
    };
  }, [data.isOwner, data.workYear, period]);

  const chartMaximum = Math.max(
    ...periodView.items.map((item) => Math.abs(item.value)),
    1,
  );
  const monthlyMaximum = Math.max(summary.buAySatis, summary.buAyAlis, 1);
  const collectionTotal = summary.tahsilEdilecek + summary.odenecek;
  const collectionRatio = collectionTotal > 0
    ? Math.round((summary.tahsilEdilecek / collectionTotal) * 100)
    : 0;
  const permissionCount = Object.values(data.permissions).filter(Boolean).length;

  return (
    <section className="mt-6 space-y-5" aria-label="Detaylı analizler">
      <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">Detaylı Analizler</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.045em] sm:text-3xl">İşletme performans merkezi</h2>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              Para akışını, cari durumunu, stok risklerini ve son işlemleri tek görünümde değerlendirin.
            </p>
          </div>
          <div className="grid grid-cols-3 rounded-full bg-slate-100 p-1">
            {([
              ["today", "Bugün"],
              ["week", "Bu Hafta"],
              ["month", "Bu Ay"],
            ] as const).map(([key, label]) => (
              <button
                key={key}
                type="button"
                onClick={() => setPeriod(key)}
                className={`min-h-10 rounded-full px-3 text-[11px] font-black transition sm:px-5 sm:text-xs ${period === key ? "bg-slate-950 text-white shadow" : "text-slate-500 hover:text-slate-950"}`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:gap-3 xl:grid-cols-4">
        {[
          ["Kasa Bakiyesi", formatMoney(summary.kasaBakiyesi), "Güncel toplam", "text-indigo-700", "bg-indigo-50"],
          ["Tahsil Edilecek", formatMoney(summary.tahsilEdilecek), `${summary.aktifCari} aktif cari`, "text-emerald-700", "bg-emerald-50"],
          ["Ödenecek", formatMoney(summary.odenecek), "Açık cari borçlar", "text-red-700", "bg-red-50"],
          ["Stok Değeri", formatMoney(summary.stokDegeri), `${summary.aktifUrun} aktif ürün`, "text-cyan-700", "bg-cyan-50"],
        ].map(([label, value, note, color, background]) => (
          <div key={label} className={`min-w-0 rounded-[1.35rem] p-4 sm:p-5 ${background}`}>
            <p className={`text-[10px] font-black uppercase tracking-[0.12em] sm:text-xs ${color}`}>{label}</p>
            <p className="mt-2 break-words text-lg font-black tracking-[-0.035em] text-slate-950 sm:text-2xl">{value}</p>
            <p className="mt-1 text-[10px] font-bold text-slate-500 sm:text-xs">{note}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.35fr_0.65fr]">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">{periodView.eyebrow}</p>
              <h3 className="mt-1 text-xl font-black tracking-[-0.035em]">{periodView.title}</h3>
            </div>
            <Link href="/on-muhasebe/panel/rapor" className="shrink-0 rounded-full bg-slate-100 px-3 py-2 text-[10px] font-black text-slate-700 sm:px-4 sm:text-xs">Raporlar</Link>
          </div>

          <div className="mt-7 grid h-56 grid-cols-3 items-end gap-3 border-b border-slate-200 px-1 sm:gap-6 sm:px-6">
            {periodView.items.map((item) => {
              const height = Math.max(18, (Math.abs(item.value) / chartMaximum) * 150);
              return (
                <div key={item.label} className="flex min-w-0 flex-col items-center justify-end">
                  <p className="mb-2 max-w-full truncate text-[9px] font-black text-slate-700 sm:text-xs">{formatMoney(item.value)}</p>
                  <div className={`w-full max-w-24 rounded-t-xl ${item.color}`} style={{ height: `${height}px` }} />
                  <p className="mt-2 min-h-8 text-center text-[9px] font-black leading-4 text-slate-500 sm:text-xs">{item.label}</p>
                </div>
              );
            })}
          </div>
          <p className="mt-4 text-xs font-bold leading-5 text-slate-500">{periodView.note}</p>
        </div>

        <div className="rounded-[1.75rem] bg-slate-950 p-5 text-white shadow-xl shadow-slate-300 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-white/45">Kâr / Zarar Görünümü</p>
          <p className={`mt-3 break-words text-3xl font-black tracking-[-0.05em] ${summary.buAyNet >= 0 ? "text-emerald-400" : "text-amber-400"}`}>
            {formatMoney(summary.buAyNet)}
          </p>
          <p className="mt-2 text-xs font-bold leading-5 text-white/50">Aylık satış ve alış fişleri arasındaki fark. Genel giderler bu hesaba dahil değildir.</p>
          <div className="mt-6 space-y-4">
            <div>
              <div className="flex justify-between gap-3 text-xs font-black"><span className="text-white/60">Satış</span><span>{formatMoney(summary.buAySatis)}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-violet-500" style={{ width: `${(summary.buAySatis / monthlyMaximum) * 100}%` }} /></div>
            </div>
            <div>
              <div className="flex justify-between gap-3 text-xs font-black"><span className="text-white/60">Alış</span><span>{formatMoney(summary.buAyAlis)}</span></div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10"><div className="h-full rounded-full bg-cyan-400" style={{ width: `${(summary.buAyAlis / monthlyMaximum) * 100}%` }} /></div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-3">
        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-red-600">Stok Uyarıları</p>
              <h3 className="mt-1 text-xl font-black">Azalan ürünler</h3>
            </div>
            <span className="rounded-full bg-red-50 px-3 py-2 text-xs font-black text-red-700">{summary.kritikStok} kritik</span>
          </div>
          <div className="mt-5 grid gap-3">
            {criticalProducts.length === 0 ? (
              <p className="rounded-[1.2rem] bg-emerald-50 p-4 text-xs font-bold leading-5 text-emerald-700">Kritik seviyede ürün bulunmuyor.</p>
            ) : criticalProducts.map((product) => {
              const ratio = product.kritikStok > 0
                ? Math.max(0, Math.min(100, (product.mevcutStok / product.kritikStok) * 100))
                : 0;
              return (
                <div key={product.id} className="rounded-[1.2rem] bg-slate-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <p className="min-w-0 truncate text-sm font-black">{product.urunAdi}</p>
                    <p className="shrink-0 text-xs font-black text-red-700">{formatNumber(product.mevcutStok)} {product.birim}</p>
                  </div>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-200"><div className="h-full rounded-full bg-red-500" style={{ width: `${ratio}%` }} /></div>
                  <p className="mt-2 text-[10px] font-bold text-slate-500">Kritik seviye: {formatNumber(product.kritikStok)} {product.birim}</p>
                </div>
              );
            })}
          </div>
          <Link href="/on-muhasebe/panel/stok" className="mt-4 inline-flex text-xs font-black text-red-700">Tüm stokları aç →</Link>
        </div>

        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-violet-600">Satış Performansı</p>
          <h3 className="mt-1 text-xl font-black">En çok satılanlar</h3>
          <div className="mt-5 grid gap-3">
            {topSoldProducts.length === 0 ? (
              <p className="rounded-[1.2rem] bg-slate-100 p-4 text-xs font-bold text-slate-500">Bu dönemde satış kaydı bulunmuyor.</p>
            ) : topSoldProducts.slice(0, 5).map((product, index) => (
              <div key={`${product.urunAdi}-${index}`} className="flex items-center gap-3 rounded-[1.2rem] bg-slate-100 p-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-violet-600 text-xs font-black text-white">{index + 1}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-xs font-black">{product.urunAdi}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{formatNumber(product.miktar)} {product.birim}</p></div>
                <p className="shrink-0 text-xs font-black text-violet-700">{formatMoney(product.tutar)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.18em] text-emerald-600">Cari Dengesi</p>
              <h3 className="mt-1 text-xl font-black">Alacak ve borç</h3>
            </div>
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full" style={{ background: `conic-gradient(#10b981 0 ${collectionRatio}%, #ef4444 ${collectionRatio}% 100%)` }}>
              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-[10px] font-black">%{collectionRatio}</div>
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-2">
            <div className="rounded-[1.1rem] bg-emerald-50 p-3"><p className="text-[10px] font-black text-emerald-700">ALACAK</p><p className="mt-1 break-words text-sm font-black">{formatMoney(summary.tahsilEdilecek)}</p></div>
            <div className="rounded-[1.1rem] bg-red-50 p-3"><p className="text-[10px] font-black text-red-700">BORÇ</p><p className="mt-1 break-words text-sm font-black">{formatMoney(summary.odenecek)}</p></div>
          </div>
          <p className="mt-5 text-xs font-black text-slate-700">Yaklaşan alacaklar</p>
          <div className="mt-3 grid gap-2">
            {upcomingReceivables.length === 0 ? (
              <p className="rounded-[1.1rem] bg-slate-100 p-3 text-xs font-bold text-slate-500">Yaklaşan alacak kaydı yok.</p>
            ) : upcomingReceivables.slice(0, 4).map((item) => (
              <div key={item.id} className="flex items-center justify-between gap-3 rounded-[1.1rem] bg-slate-100 p-3">
                <div className="min-w-0"><p className="truncate text-xs font-black">{item.cariUnvan}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{receivableTimeLabel(item.daysLeft)}</p></div>
                <p className="shrink-0 text-xs font-black text-emerald-700">{formatMoney(item.amount)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className={`grid gap-5 ${data.isOwner ? "xl:grid-cols-2" : ""}`}>
        <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div><p className="text-xs font-black uppercase tracking-[0.18em] text-slate-400">İşlem Akışı</p><h3 className="mt-1 text-xl font-black">Son hareketler</h3></div>
            <span className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">{data.recentActivities.length} kayıt</span>
          </div>
          <div className="mt-5 grid gap-2">
            {data.recentActivities.length === 0 ? (
              <p className="rounded-[1.2rem] bg-slate-100 p-4 text-xs font-bold text-slate-500">Henüz kasa veya fiş hareketi bulunmuyor.</p>
            ) : data.recentActivities.slice(0, 6).map((activity) => (
              <div key={activity.id} className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-slate-100 p-3 sm:p-4">
                <div className="min-w-0"><span className={`inline-flex rounded-full px-2 py-1 text-[9px] font-black ${activityTone(activity.tone)}`}>{activity.type}</span><p className="mt-1 truncate text-xs font-black sm:text-sm">{activity.title}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{formatDate(activity.date)}</p></div>
                <p className="shrink-0 text-xs font-black sm:text-sm">{formatMoney(activity.amount)}</p>
              </div>
            ))}
          </div>
        </div>

        {data.isOwner ? (
          <div className="rounded-[1.75rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <div><p className="text-xs font-black uppercase tracking-[0.18em] text-cyan-600">Personel Kontrolü</p><h3 className="mt-1 text-xl font-black">Personel hareketleri</h3></div>
              <span className="rounded-full bg-cyan-50 px-3 py-2 text-xs font-black text-cyan-700">{personnelAnalytics?.summary?.total || 0} işlem</span>
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-[1.1rem] bg-slate-100 p-3"><p className="text-[10px] font-black text-slate-400">YETKİLİ MODÜL</p><p className="mt-1 text-lg font-black">{permissionCount}</p></div>
              <div className="rounded-[1.1rem] bg-slate-100 p-3"><p className="text-[10px] font-black text-slate-400">İŞLEM TUTARI</p><p className="mt-1 break-words text-sm font-black">{formatMoney(personnelAnalytics?.summary?.totalAmount || 0)}</p></div>
            </div>
            <div className="mt-4 grid gap-2">
              {personnelLoading ? <p className="rounded-[1.2rem] bg-slate-100 p-4 text-xs font-bold text-slate-500">Personel hareketleri yükleniyor...</p> : null}
              {personnelError ? <p className="rounded-[1.2rem] bg-red-50 p-4 text-xs font-bold leading-5 text-red-700">{personnelError}</p> : null}
              {!personnelLoading && !personnelError && personnelAnalytics?.setupRequired ? <p className="rounded-[1.2rem] bg-amber-50 p-4 text-xs font-bold leading-5 text-amber-700">{personnelAnalytics.message}</p> : null}
              {!personnelLoading && !personnelError && !personnelAnalytics?.setupRequired && (personnelAnalytics?.activities?.length || 0) === 0 ? <p className="rounded-[1.2rem] bg-slate-100 p-4 text-xs font-bold text-slate-500">Seçili dönemde personel hareketi yok.</p> : null}
              {personnelAnalytics?.activities?.slice(0, 5).map((activity) => (
                <div key={activity.id} className="flex items-center justify-between gap-3 rounded-[1.2rem] bg-slate-100 p-3">
                  <div className="min-w-0"><p className="truncate text-xs font-black">{activity.title}</p><p className="mt-0.5 text-[10px] font-bold text-slate-500">{activity.module_key} · {formatDate(activity.movement_date || activity.created_at)}</p></div>
                  {Number(activity.amount || 0) !== 0 ? <p className="shrink-0 text-xs font-black">{formatMoney(activity.amount)}</p> : null}
                </div>
              ))}
            </div>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/on-muhasebe/panel/personel" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white">Personeli Yönet</Link>
              <Link href="/on-muhasebe/panel/ayarlar" className="rounded-full bg-slate-100 px-4 py-2 text-xs font-black text-slate-700">Tüm Hareketler</Link>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
