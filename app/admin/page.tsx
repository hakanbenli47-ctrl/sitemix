"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";

type Company = {
  id: string;
  code: string | null;
  paymentCode: string;
  name: string;
  sector: string | null;
  phone: string | null;
  owner: {
    userId: string;
    name: string;
    phone: string | null;
    email: string | null;
    accessStatus: "active" | "passive";
  };
  subscription: {
    id: string;
    plan: string;
    status: string;
    trial_ends_at: string | null;
    billing_period_months: number | null;
    daysLeft?: number;
    monthly_price: number | null;
    total_price: number | null;
    currency: string | null;
    staff_count?: number;
    staff_monthly_price?: number;
    staff_monthly_total?: number;
  } | null;
  paymentNotification: {
    id: string;
    payment_code: string;
    description: string;
    status: string;
    created_at: string;
    updated_at: string | null;
  } | null;
  periods: Array<{
    id: string;
    yil: number;
    durum: string;
    locked: boolean | null;
  }>;
  staffCount: number;
  activeStaffCount: number;
  staffMonthlyPrice: number;
  staffMonthlyTotal: number;
  staff: Array<{
    id: string;
    userId: string;
    fullName: string;
    phone: string | null;
    email: string | null;
    status: "active" | "passive";
    permissions: Record<string, boolean>;
    createdAt: string | null;
  }>;
};

const packageStatuses = ["trial", "active", "expired", "cancelled"] as const;

function formatDate(value?: string | null) {
  if (!value) return "-";
  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium" }).format(date);
}

function formatDateTime(value?: Date | null) {
  if (!value) return "Henüz yenilenmedi";
  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(value);
}

function formatMoney(value?: number | null, currency = "TRY") {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function planLabel(plan?: string | null) {
  const labels: Record<string, string> = {
    monthly: "Aylık Paket",
    six_month: "6 Aylık Paket",
    yearly: "Yıllık Paket",
  };

  return labels[plan || ""] || plan || "-";
}

function statusLabel(status?: string | null) {
  const labels: Record<string, string> = {
    trial: "Deneme",
    active: "Aktif",
    expired: "Süresi Doldu",
    cancelled: "Pasif",
    passive: "Pasif",
    acik: "Açık",
    kapali: "Kapalı",
    pasif: "Pasif",
    pending: "Onay Bekliyor",
    approved: "Onaylandı",
    rejected: "Kapatıldı",
  };

  return labels[status || ""] || status || "-";
}

function statusClass(status?: string | null) {
  if (status === "active" || status === "trial" || status === "acik") {
    return "bg-emerald-50 text-emerald-700 ring-emerald-100";
  }

  if (status === "expired" || status === "cancelled" || status === "passive" || status === "pasif") {
    return "bg-red-50 text-red-700 ring-red-100";
  }

  return "bg-amber-50 text-amber-700 ring-amber-100";
}

function daysText(value?: number | null) {
  const days = Number(value || 0);
  return days > 0 ? `${days} gün kaldı` : "Süre doldu";
}

function paymentStatusText(company: Company) {
  if (company.paymentNotification?.status === "pending") {
    return "Ödeme bildirimi var";
  }

  return "Bildirim yok";
}

function customerPhone(company: Company) {
  return company.owner.phone || company.phone || "";
}

function normalizeWhatsAppPhone(value?: string | null) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return "";

  if (digits.startsWith("00")) {
    digits = digits.slice(2);
  }

  if (digits.startsWith("0") && digits.length === 11) {
    digits = `90${digits.slice(1)}`;
  } else if (digits.length === 10) {
    digits = `90${digits}`;
  }

  return digits.length >= 10 ? digits : "";
}

function onboardingWhatsAppMessage(company: Company) {
  const name = company.owner.name && company.owner.name !== "-" ? company.owner.name : "Merhaba";
  const companyName = company.name || "isletmeniz";
  const companyCode = company.code || company.paymentCode || "-";

  return [
    `Merhaba ${name}, ben Sitemix On Muhasebe'den Hakan.`,
    `${companyName} icin on muhasebe paneliniz hazir.`,
    "",
    "7 gun ucretsiz kullanim sureniz vardir. Bu surecte cari ve stoklarinizi toplu sekilde eklemenize yardimci olabiliriz.",
    "Cari takip, stok takip, kasa islemleri, satis/alis fisi, PDF/WhatsApp paylasimi, personel yetkileri ve gunluk raporlar panel icinde hazir.",
    "",
    `Firma kodunuz: ${companyCode}`,
    "Giris adresi: https://www.sitemix.com.tr/on-muhasebe/giris",
    "",
    "Takildiginiz yerde bu WhatsApp hattindan yazabilirsiniz.",
  ].join("\n");
}

function onboardingWhatsAppHref(company: Company) {
  const phone = normalizeWhatsAppPhone(customerPhone(company));
  if (!phone) return "";
  return `https://wa.me/${phone}?text=${encodeURIComponent(onboardingWhatsAppMessage(company))}`;
}

export default function SitemixAdminPage() {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const busyIdRef = useRef<string | null>(null);
  const isRefreshingRef = useRef(false);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<Date | null>(null);
  const [expandedCompanyId, setExpandedCompanyId] = useState<string | null>(null);
  const [ownerEmailDrafts, setOwnerEmailDrafts] = useState<Record<string, string>>({});
  const [ownerPasswordDrafts, setOwnerPasswordDrafts] = useState<Record<string, string>>({});
  const [restoreFiles, setRestoreFiles] = useState<Record<string, File | null>>({});
  const [periodYear, setPeriodYear] = useState(String(new Date().getFullYear()));

  const filteredCompanies = useMemo(() => {
    const cleanQuery = query.trim().toLocaleLowerCase("tr-TR");
    if (!cleanQuery) return companies;

    return companies.filter((company) =>
      [
        company.name,
        company.code,
        company.paymentCode,
        company.owner.name,
        company.owner.email,
        company.phone,
      ]
        .filter(Boolean)
        .join(" ")
        .toLocaleLowerCase("tr-TR")
        .includes(cleanQuery),
    );
  }, [companies, query]);

  const packageSummary = useMemo(() => {
    const counts = {
      monthly: 0,
      six_month: 0,
      yearly: 0,
    };
    let activeMonthlyRevenue = 0;
    let selectedMonthlyRevenue = 0;
    let activeStaffCount = 0;
    let staffMonthlyRevenue = 0;

    companies.forEach((company) => {
      const subscription = company.subscription;
      if (!subscription) return;

      if (
        subscription.plan === "monthly" ||
        subscription.plan === "six_month" ||
        subscription.plan === "yearly"
      ) {
        counts[subscription.plan] += 1;
      }

      const monthlyPrice = Number(subscription.monthly_price || 0);
      selectedMonthlyRevenue += monthlyPrice;

      if (
        company.owner.accessStatus === "active" &&
        (subscription.status === "active" || subscription.status === "trial")
      ) {
        activeMonthlyRevenue += monthlyPrice;
        activeStaffCount += company.activeStaffCount || 0;
        staffMonthlyRevenue += company.staffMonthlyTotal || 0;
      }
    });

    return {
      ...counts,
      activeMonthlyRevenue,
      selectedMonthlyRevenue,
      activeStaffCount,
      staffMonthlyRevenue,
    };
  }, [companies]);

  async function loadCompanies(options: { silent?: boolean } = {}) {
    if (isRefreshingRef.current) return;
    isRefreshingRef.current = true;

    if (!options.silent) {
      setErrorMessage("");
    }

    try {
      const response = await fetch("/api/admin/companies", { cache: "no-store" });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Admin paneli yüklenemedi.");
      }

      setCompanies(result.companies || []);
      setLastUpdatedAt(new Date());
    } catch (error) {
      if (!options.silent) {
        setErrorMessage(
          error instanceof Error ? error.message : "Admin paneli yüklenemedi.",
        );
      }
    } finally {
      isRefreshingRef.current = false;
      setIsLoading(false);
    }
  }

  useEffect(() => {
    busyIdRef.current = busyId;
  }, [busyId]);

  useEffect(() => {
    loadCompanies();
    const intervalId = window.setInterval(() => {
      if (!busyIdRef.current) {
        loadCompanies({ silent: true });
      }
    }, 30000);

    return () => window.clearInterval(intervalId);
  }, []);

  async function runAction(companyId: string, payload: Record<string, unknown>) {
    setBusyId(companyId);
    setMessage("");
    setErrorMessage("");

    try {
      const response = await fetch("/api/admin/companies", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyId, ...payload }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "İşlem tamamlanamadı.");
      }

      setMessage(result.message || "İşlem tamamlandı.");
      await loadCompanies();
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "İşlem tamamlanamadı.");
    } finally {
      setBusyId(null);
    }
  }

  async function restoreBackup(company: Company) {
    const file = restoreFiles[company.id];

    if (!file) {
      setErrorMessage("Geri yuklemek icin once JSON yedek dosyasini sec.");
      return;
    }

    const confirmed = window.confirm(
      `${company.name} icin yedek geri yuklenecek. Cari, stok, kasa, fis, donem ve ayar verileri dosyadaki hale donecek. Paket ve odeme bilgileri korunacak. Devam edilsin mi?`,
    );

    if (!confirmed) return;

    setBusyId(company.id);
    setMessage("");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("backup", file);

      const response = await fetch(
        `/api/admin/companies/${company.id}/restore-backup`,
        {
          method: "POST",
          body: formData,
        },
      );
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Yedek geri yuklenemedi.");
      }

      setMessage(result.message || "Yedek geri yuklendi.");
      setRestoreFiles((current) => ({
        ...current,
        [company.id]: null,
      }));
      await loadCompanies();
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Yedek geri yuklenemedi.",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.href = "/on-muhasebe/giris";
  }

  function handlePeriodSubmit(event: FormEvent<HTMLFormElement>, companyId: string) {
    event.preventDefault();
    runAction(companyId, {
      action: "create_period",
      year: Number(periodYear),
    });
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-5 text-slate-950">
        <div className="rounded-2xl bg-white p-8 text-center shadow-sm">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="mt-5 text-sm font-black text-slate-600">Admin paneli yükleniyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-5 text-slate-950 sm:px-6 lg:px-8">
      <section className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
              Sitemix Yönetim
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-tight">Admin Paneli</h1>
            <p className="mt-2 max-w-2xl text-sm font-bold leading-6 text-slate-500">
              Firma erişimi, ödeme bildirimi, paket süresi, dönemler ve müşteri hesap yardımı.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href="/admin/studio"
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-indigo-600 px-5 text-sm font-black text-white hover:bg-indigo-500"
            >
              SiteMix Studio Yönetimi
            </a>
            <button
              type="button"
              onClick={logout}
              className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-950 px-5 text-sm font-black text-white hover:bg-slate-800"
            >
              Çıkış Yap
            </button>
          </div>
        </header>

        <div className="mt-5 grid gap-3 md:grid-cols-[1fr_auto]">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Firma, kod, yetkili, e-posta veya telefon ara"
            className="min-h-12 rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold outline-none transition focus:border-indigo-500"
          />
          <div className="grid gap-2 sm:grid-cols-[auto_auto] sm:items-center md:grid-cols-1">
            <button
              type="button"
              onClick={() => loadCompanies()}
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-slate-950 shadow-sm hover:bg-slate-50"
            >
              Yenile
            </button>
            <span className="text-center text-xs font-black text-slate-500">
              Son güncelleme: {formatDateTime(lastUpdatedAt)}
            </span>
          </div>
        </div>

        {message ? (
          <div className="mt-4 rounded-2xl bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-4 rounded-2xl bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {[
            {
              label: "Aylık Paket",
              value: packageSummary.monthly,
              detail: "Seçen firma",
            },
            {
              label: "6 Aylık Paket",
              value: packageSummary.six_month,
              detail: "Seçen firma",
            },
            {
              label: "Yıllık Paket",
              value: packageSummary.yearly,
              detail: "Seçen firma",
            },
            {
              label: "Personel Paketi",
              value: packageSummary.activeStaffCount,
              detail: `${formatMoney(packageSummary.staffMonthlyRevenue)} / ay`,
            },
            {
              label: "Aktif Aylık Gelir",
              value: formatMoney(packageSummary.activeMonthlyRevenue),
              detail: `Potansiyel: ${formatMoney(packageSummary.selectedMonthlyRevenue)}`,
            },
          ].map((item) => (
            <div key={item.label} className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                {item.label}
              </p>
              <p className="mt-3 text-2xl font-black tracking-tight text-slate-950">
                {item.value}
              </p>
              <p className="mt-1 text-xs font-bold text-slate-500">
                {item.detail}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-5 grid gap-3">
          {filteredCompanies.length === 0 ? (
            <div className="rounded-2xl bg-white p-8 text-center text-sm font-bold text-slate-500">
              Firma bulunamadı.
            </div>
          ) : (
            filteredCompanies.map((company) => {
              const isExpanded = expandedCompanyId === company.id;
              const hasPendingPayment = company.paymentNotification?.status === "pending";
              const whatsappHref = onboardingWhatsAppHref(company);
              const whatsappPhone = customerPhone(company);

              return (
                <article key={company.id} className="rounded-2xl bg-white p-4 shadow-sm transition hover:shadow-md">
                  <div className="grid gap-3 lg:grid-cols-[1.2fr_0.8fr_auto] lg:items-center">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="text-lg font-black">{company.name}</h2>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                          {company.code || "Kod yok"}
                        </span>
                        <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-black text-indigo-700">
                          Ödeme Kodu: {company.paymentCode}
                        </span>
                        {hasPendingPayment ? (
                          <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-700 ring-1 ring-amber-100">
                            Ödeme bildirimi bekliyor
                          </span>
                        ) : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs font-bold text-slate-500">
                        <span>Yetkili: <b className="text-slate-950">{company.owner.name}</b></span>
                        <span>E-posta: <b className="text-slate-950">{company.owner.email || "-"}</b></span>
                        <span>Telefon: <b className="text-slate-950">{company.owner.phone || company.phone || "-"}</b></span>
                        <span>Paket: <b className="text-slate-950">{planLabel(company.subscription?.plan)}</b></span>
                        <span>Personel: <b className="text-slate-950">{company.activeStaffCount}/{company.staffCount}</b></span>
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-5 lg:grid-cols-5">
                      <span className="rounded-full bg-indigo-50 px-3 py-2 text-center text-xs font-black text-indigo-700">
                        {planLabel(company.subscription?.plan)}
                      </span>
                      <span className={`rounded-full px-3 py-2 text-center text-xs font-black ring-1 ${statusClass(company.owner.accessStatus)}`}>
                        {company.owner.accessStatus === "active" ? "Sistem Aktif" : "Sistem Pasif"}
                      </span>
                      <span className={`rounded-full px-3 py-2 text-center text-xs font-black ring-1 ${statusClass(company.subscription?.status)}`}>
                        {statusLabel(company.subscription?.status)}
                      </span>
                      <span className="rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-700">
                        {daysText(company.subscription?.daysLeft)}
                      </span>
                      <span className={hasPendingPayment ? "rounded-full bg-amber-50 px-3 py-2 text-center text-xs font-black text-amber-700 ring-1 ring-amber-100" : "rounded-full bg-slate-100 px-3 py-2 text-center text-xs font-black text-slate-500"}>
                        {paymentStatusText(company)}
                      </span>
                    </div>

                    <button
                      type="button"
                      disabled={busyId === company.id}
                      onClick={() => setExpandedCompanyId(isExpanded ? null : company.id)}
                      className="inline-flex min-h-10 items-center justify-center rounded-full bg-slate-950 px-5 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {isExpanded ? "Detayı Kapat" : "Detay"}
                    </button>
                  </div>

                  {isExpanded ? (
                    <div className="mt-4 border-t border-slate-100 pt-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === company.id}
                          onClick={() =>
                            runAction(company.id, {
                              action: "set_access",
                              status: company.owner.accessStatus === "active" ? "passive" : "active",
                            })
                          }
                          className={`inline-flex min-h-11 items-center justify-center rounded-full px-5 text-sm font-black text-white disabled:opacity-60 ${
                            company.owner.accessStatus === "active"
                              ? "bg-red-600 hover:bg-red-700"
                              : "bg-emerald-600 hover:bg-emerald-700"
                          }`}
                        >
                          {company.owner.accessStatus === "active" ? "Pasife Al" : "Aktif Et"}
                        </button>
                        {whatsappHref ? (
                          <a
                            href={whatsappHref}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-emerald-600 px-5 text-sm font-black text-white hover:bg-emerald-700"
                            title={`WhatsApp: ${whatsappPhone}`}
                          >
                            Hazir WhatsApp Mesaji Gonder
                          </a>
                        ) : (
                          <button
                            type="button"
                            disabled
                            className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-200 px-5 text-sm font-black text-slate-500"
                          >
                            WhatsApp icin telefon yok
                          </button>
                        )}
                      </div>

                      <div className="mt-4 grid gap-4 xl:grid-cols-3">
                        <section className="rounded-2xl bg-slate-50 p-4">
                          <h3 className="text-sm font-black">Paket / Ödeme</h3>
                          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                            Ödeme geldiyse paketi aktif yap. Sistem paketin ay sayısına göre bitiş tarihini otomatik kaydeder.
                          </p>

                          <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">
                            IBAN açıklamasında aranacak kod:
                            <span className="mt-1 block break-words text-base font-black text-indigo-700">
                              {company.paymentCode}
                            </span>
                          </div>

                          {hasPendingPayment ? (
                            <div className="mt-3 rounded-xl bg-amber-50 p-3 text-xs font-bold leading-5 text-amber-800 ring-1 ring-amber-100">
                              <p className="font-black">Müşteri ödeme yaptığını işaretledi.</p>
                              <p className="mt-1">Açıklama: {company.paymentNotification?.description}</p>
                              <p className="mt-1">Tarih: {formatDate(company.paymentNotification?.created_at)}</p>
                              <button
                                type="button"
                                disabled={busyId === company.id}
                                onClick={() =>
                                  runAction(company.id, {
                                    action: "set_payment_notification_status",
                                    status: "rejected",
                                  })
                                }
                                className="mt-3 min-h-9 rounded-full bg-white px-4 text-xs font-black text-amber-900 shadow-sm hover:bg-amber-100 disabled:opacity-60"
                              >
                                Bildirimi Kapat
                              </button>
                            </div>
                          ) : null}

                          <div className="mt-4 grid gap-2">
                            {packageStatuses.map((status) => (
                              <button
                                key={status}
                                type="button"
                                disabled={busyId === company.id || company.subscription?.status === status}
                                onClick={() =>
                                  runAction(company.id, {
                                    action: "set_subscription",
                                    status,
                                  })
                                }
                                className={`min-h-10 rounded-full px-4 text-xs font-black transition disabled:opacity-50 ${
                                  company.subscription?.status === status
                                    ? "bg-slate-950 text-white"
                                    : "bg-white text-slate-700 hover:bg-slate-100"
                                }`}
                              >
                                {statusLabel(status)}
                              </button>
                            ))}
                          </div>

                          <p className="mt-3 text-xs font-bold text-slate-500">
                            Seçilen paket: {planLabel(company.subscription?.plan)} / {formatMoney(company.subscription?.total_price, company.subscription?.currency || "TRY")}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Aylık karşılık: {formatMoney(company.subscription?.monthly_price, company.subscription?.currency || "TRY")}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Personel eklentisi: {company.activeStaffCount} kişi x {formatMoney(company.staffMonthlyPrice)} = {formatMoney(company.staffMonthlyTotal)}
                          </p>
                          <p className="mt-1 text-xs font-bold text-slate-500">
                            Bitiş tarihi: {formatDate(company.subscription?.trial_ends_at)}
                          </p>
                          <p className="mt-1 text-xs font-black text-slate-700">
                            {daysText(company.subscription?.daysLeft)}
                            {company.subscription?.billing_period_months
                              ? ` / ${company.subscription.billing_period_months} aylık paket`
                              : ""}
                          </p>
                        </section>

                        <section className="rounded-2xl bg-slate-50 p-4">
                          <h3 className="text-sm font-black">Çalışma Dönemleri</h3>
                          <div className="mt-3 flex flex-wrap gap-2">
                            {company.periods.length === 0 ? (
                              <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-slate-500">
                                Dönem yok
                              </span>
                            ) : (
                              company.periods.map((period) => (
                                <button
                                  key={period.id}
                                  type="button"
                                  disabled={busyId === company.id}
                                  onClick={() =>
                                    runAction(company.id, {
                                      action: "set_period_status",
                                      periodId: period.id,
                                      status: period.durum === "acik" ? "kapali" : "acik",
                                    })
                                  }
                                  className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(period.durum)}`}
                                >
                                  {period.yil} {statusLabel(period.durum)}
                                </button>
                              ))
                            )}
                          </div>
                          <form
                            onSubmit={(event) => handlePeriodSubmit(event, company.id)}
                            className="mt-4 flex gap-2"
                          >
                            <input
                              value={periodYear}
                              onChange={(event) => setPeriodYear(event.target.value)}
                              className="min-h-10 min-w-0 flex-1 rounded-xl border border-slate-200 bg-white px-3 text-sm font-bold outline-none focus:border-indigo-500"
                            />
                            <button
                              type="submit"
                              disabled={busyId === company.id}
                              className="rounded-xl bg-indigo-600 px-4 text-xs font-black text-white hover:bg-indigo-700 disabled:opacity-60"
                            >
                              Dönem Ekle
                            </button>
                          </form>
                        </section>

                        <section className="rounded-2xl bg-slate-50 p-4">
                          <h3 className="text-sm font-black">Hesap Yardımı</h3>
                          <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                            Müşteri e-postasını unuttuysa görebilir, yanlış e-postayı düzeltebilir veya geçici şifre atayabilirsin.
                          </p>
                          <div className="mt-3 rounded-xl bg-white p-3 text-xs font-bold leading-5 text-slate-600">
                            Kayıtlı giriş e-postası:
                            <span className="mt-1 block break-words text-sm font-black text-slate-950">
                              {company.owner.email || "-"}
                            </span>
                          </div>
                          <div className="mt-3 grid gap-2">
                            <input
                              value={ownerEmailDrafts[company.id] ?? company.owner.email ?? ""}
                              onChange={(event) =>
                                setOwnerEmailDrafts((current) => ({
                                  ...current,
                                  [company.id]: event.target.value,
                                }))
                              }
                              placeholder="Yeni giriş e-postası"
                              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              disabled={busyId === company.id}
                              onClick={() =>
                                runAction(company.id, {
                                  action: "set_owner_email",
                                  email: ownerEmailDrafts[company.id] ?? company.owner.email,
                                })
                              }
                              className="min-h-10 rounded-full bg-white px-4 text-xs font-black text-slate-950 shadow-sm hover:bg-slate-100 disabled:opacity-60"
                            >
                              E-postayı Güncelle
                            </button>
                          </div>
                          <div className="mt-4 grid gap-2">
                            <input
                              value={ownerPasswordDrafts[company.id] ?? ""}
                              onChange={(event) =>
                                setOwnerPasswordDrafts((current) => ({
                                  ...current,
                                  [company.id]: event.target.value,
                                }))
                              }
                              placeholder="Geçici şifre yaz"
                              className="min-h-10 rounded-xl border border-slate-200 bg-white px-3 text-xs font-bold outline-none focus:border-indigo-500"
                            />
                            <button
                              type="button"
                              disabled={busyId === company.id || !(ownerPasswordDrafts[company.id] || "").trim()}
                              onClick={() =>
                                runAction(company.id, {
                                  action: "set_owner_password",
                                  password: ownerPasswordDrafts[company.id],
                                })
                              }
                              className="min-h-10 rounded-full bg-slate-950 px-4 text-xs font-black text-white hover:bg-slate-800 disabled:opacity-60"
                            >
                              Geçici Şifre Ata
                            </button>
                          </div>
                        </section>
                      </div>

                      <section className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
                          <div>
                            <h3 className="text-sm font-black text-amber-950">Yedekten Geri Yukle</h3>
                            <p className="mt-2 text-xs font-bold leading-5 text-amber-800">
                              Secili firmaya ait JSON yedegi yukle. Cari, stok, kasa, fis,
                              calisma donemi, devir ve ayar verileri dosyadaki hale doner.
                              Paket, odeme bildirimi ve admin abonelik bilgisi korunur.
                            </p>
                            <p className="mt-2 text-xs font-black text-amber-900">
                              Guvenlik: Sistem dosyanin firma kodunu kontrol eder ve yanlis
                              firmaya ait yedegi isleme almaz.
                            </p>
                          </div>

                          <div className="grid gap-2 sm:min-w-80">
                            <input
                              key={`${company.id}-${restoreFiles[company.id]?.name || "empty"}`}
                              type="file"
                              accept=".json,application/json"
                              disabled={busyId === company.id}
                              onChange={(event) =>
                                setRestoreFiles((current) => ({
                                  ...current,
                                  [company.id]: event.target.files?.[0] || null,
                                }))
                              }
                              className="min-h-11 rounded-xl border border-amber-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 file:mr-3 file:rounded-full file:border-0 file:bg-amber-100 file:px-3 file:py-2 file:text-xs file:font-black file:text-amber-900"
                            />
                            <button
                              type="button"
                              disabled={busyId === company.id || !restoreFiles[company.id]}
                              onClick={() => restoreBackup(company)}
                              className="min-h-11 rounded-full bg-amber-600 px-5 text-xs font-black text-white hover:bg-amber-700 disabled:opacity-60"
                            >
                              Yedegi Geri Yukle
                            </button>
                          </div>
                        </div>
                      </section>

                      <section className="mt-4 rounded-2xl bg-slate-50 p-4">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div>
                            <h3 className="text-sm font-black">Ana Kullanıcıya Bağlı Personeller</h3>
                            <p className="mt-1 text-xs font-bold leading-5 text-slate-500">
                              Personel ücreti ana firma paketine eklenir; personel hesabına ayrı ödeme çıkarılmaz.
                            </p>
                          </div>
                          <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700">
                            {company.activeStaffCount} x {formatMoney(company.staffMonthlyPrice)} = {formatMoney(company.staffMonthlyTotal)} / ay
                          </span>
                        </div>

                        <div className="mt-4 grid gap-2">
                          {company.staff.length === 0 ? (
                            <div className="rounded-xl bg-white p-4 text-sm font-bold text-slate-500">
                              Bu firmaya bağlı personel yok.
                            </div>
                          ) : null}

                          {company.staff.map((staff) => (
                            <div
                              key={staff.id}
                              className="grid gap-3 rounded-xl bg-white p-4 text-sm sm:grid-cols-[1fr_auto] sm:items-center"
                            >
                              <div className="min-w-0">
                                <p className="font-black text-slate-950">{staff.fullName}</p>
                                <p className="mt-1 break-words text-xs font-bold text-slate-500">
                                  {staff.email || "-"} {staff.phone ? `/ ${staff.phone}` : ""}
                                </p>
                              </div>
                              <div className="flex flex-wrap gap-2">
                                <span className={`rounded-full px-3 py-1 text-xs font-black ring-1 ${statusClass(staff.status)}`}>
                                  {statusLabel(staff.status)}
                                </span>
                                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-black text-slate-600">
                                  {staff.status === "active" ? formatMoney(company.staffMonthlyPrice) : "Ücrete dahil değil"}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </section>
                    </div>
                  ) : null}
                </article>
              );
            })
          )}
        </div>
      </section>
    </main>
  );
}
