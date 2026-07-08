"use client";

import Link from "next/link";
import { FormEvent, useCallback, useEffect, useState } from "react";
import {
  buildYearScopedUrl,
  getBrowserWorkYear,
  sortWorkPeriods,
  type OnMuhasebeWorkPeriod,
} from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

type Settings = {
  auto_backup_enabled: boolean;
  backup_email: string | null;
  backup_frequency_hours: number;
  default_kdv_rate: number;
  low_stock_alert_enabled: boolean;
  receipt_prefix: string;
  whatsapp_support_enabled: boolean;
};

type StaffOption = {
  id: string;
  userId: string;
  fullName: string;
  email: string;
  status: "active" | "passive";
};

type PersonnelActivity = {
  id: string;
  actor_user_id: string | null;
  actor_role: string | null;
  module_key: string;
  action_type: string;
  title: string;
  detail: string | null;
  entity_table: string | null;
  entity_id: string | null;
  amount: number | null;
  movement_date: string | null;
  created_at: string;
};

type ActivityPeriod = "gunluk" | "haftalik" | "aylik" | "yillik";

type ActivitySummary = {
  total: number;
  totalAmount: number;
  byModule: Record<string, number>;
  byAction: Record<string, number>;
};

type DevirRow = {
  id: string;
  kaynak_yil: number;
  hedef_yil: number;
  durum: string;
  cari_sayisi: number;
  borclu_toplam: number;
  alacakli_toplam: number;
  net_bakiye: number;
  created_at: string;
};

type DevirDetail = {
  id: string;
  devir_id: string;
  cari_id: string;
  cari_kodu: string;
  unvan: string;
  kaynak_yil: number;
  hedef_yil: number;
  kaynak_yil_son_bakiye: number;
  hedef_acilis_bakiyesi: number;
  hedef_acilis_bakiye_tipi: "borc_yok" | "borclu" | "alacakli" | string;
  durum: string;
  created_at: string;
};

type PeriodResponse = {
  setupRequired?: boolean;
  periods?: OnMuhasebeWorkPeriod[];
  message?: string;
};

type MeResponse = {
  isOwner?: boolean;
  role?: "owner" | "staff";
  user?: {
    id: string;
    email: string | null;
  };
  message?: string;
};

const emptySettings: Settings = {
  auto_backup_enabled: true,
  backup_email: "",
  backup_frequency_hours: 24,
  default_kdv_rate: 20,
  low_stock_alert_enabled: true,
  receipt_prefix: "FIS",
  whatsapp_support_enabled: true,
};

const emptySummary: ActivitySummary = {
  total: 0,
  totalAmount: 0,
  byModule: {},
  byAction: {},
};

const activityPeriodLabels: Record<ActivityPeriod, string> = {
  gunluk: "Günlük",
  haftalik: "Haftalık",
  aylik: "Aylık",
  yillik: "Yıllık",
};

const moduleLabels: Record<string, string> = {
  cari: "Cari",
  stok: "Stok",
  kasa: "Kasa",
  fatura: "Fatura / Fiş",
  ayarlar: "Ayarlar",
  devir: "Devir",
};

function paraFormatla(value: number | null | undefined) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function tarihSaatFormatla(value: string | null | undefined) {
  if (!value) return "-";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(date);
}

function devirTipiEtiketi(value: string) {
  if (value === "borclu") return "Borçlu açılır";
  if (value === "alacakli") return "Alacaklı açılır";
  return "Bakiye yok";
}

export default function OnMuhasebeAyarlarPage() {
  const [settings, setSettings] = useState<Settings>(emptySettings);
  const [isOwner, setIsOwner] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string | null>(null);
  const [setupRequired, setSetupRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([]);
  const [activities, setActivities] = useState<PersonnelActivity[]>([]);
  const [activitySummary, setActivitySummary] = useState<ActivitySummary>(emptySummary);
  const [activityPeriod, setActivityPeriod] = useState<ActivityPeriod>("gunluk");
  const [selectedStaffUserId, setSelectedStaffUserId] = useState("all");
  const [activitySetupRequired, setActivitySetupRequired] = useState(false);
  const [activityMessage, setActivityMessage] = useState("");
  const [activityErrorMessage, setActivityErrorMessage] = useState("");
  const [isActivityLoading, setIsActivityLoading] = useState(false);

  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordAgain, setNewPasswordAgain] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [passwordErrorMessage, setPasswordErrorMessage] = useState("");
  const [isPasswordSaving, setIsPasswordSaving] = useState(false);

  const [workYear] = useState(getBrowserWorkYear());
  const [periodOptions, setPeriodOptions] = useState<OnMuhasebeWorkPeriod[]>([]);
  const [periodSetupRequired, setPeriodSetupRequired] = useState(false);
  const [sourceYear, setSourceYear] = useState("");
  const targetYear = sourceYear ? String(Number(sourceYear) + 1) : "";
  const [overwriteDevir, setOverwriteDevir] = useState(false);
  const [devirler, setDevirler] = useState<DevirRow[]>([]);
  const [devirDetails, setDevirDetails] = useState<DevirDetail[]>([]);
  const [selectedDevirId, setSelectedDevirId] = useState<string | null>(null);
  const [devirSetupRequired, setDevirSetupRequired] = useState(false);
  const [devirMessage, setDevirMessage] = useState("");
  const [devirErrorMessage, setDevirErrorMessage] = useState("");
  const [isDevirLoading, setIsDevirLoading] = useState(false);
  const [isDevirSaving, setIsDevirSaving] = useState(false);

  const authHeaders = useCallback(async () => {
    const {
      data: { session },
      error,
    } = await supabaseClient.auth.getSession();

    if (error || !session) {
      window.location.href = "/on-muhasebe/giris";
      throw new Error("Oturum bulunamadı.");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
      "Content-Type": "application/json",
    };
  }, []);

  const loadMe = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch(buildYearScopedUrl("/api/on-muhasebe/me", workYear), {
      headers,
      cache: "no-store",
    });
    const result = (await response.json().catch(() => null)) as MeResponse | null;

    if (!response.ok) {
      throw new Error(result?.message || "Hesap bilgisi alınamadı.");
    }

    setIsOwner(Boolean(result?.isOwner));
    setAccountEmail(result?.user?.email || null);

    return Boolean(result?.isOwner);
  }, [authHeaders, workYear]);

  const loadSettings = useCallback(async () => {
    const headers = await authHeaders();
    const response = await fetch("/api/on-muhasebe/settings", {
      headers,
      cache: "no-store",
    });
    const result = await response.json().catch(() => null);

    if (!response.ok) {
      throw new Error(result?.message || "Ayarlar yüklenemedi.");
    }

    setSettings(result.settings || emptySettings);
    setSetupRequired(Boolean(result.setupRequired));
    setMessage(result.message || "");
  }, [authHeaders]);

  const loadWorkPeriods = useCallback(async () => {
    try {
      const headers = await authHeaders();
      const response = await fetch("/api/on-muhasebe/donemler", {
        headers,
        cache: "no-store",
      });
      const result = (await response.json().catch(() => null)) as PeriodResponse | null;

      if (!response.ok) {
        throw new Error(result?.message || "Çalışma dönemleri alınamadı.");
      }

      setPeriodSetupRequired(Boolean(result?.setupRequired));

      const registeredPeriods = sortWorkPeriods(result?.periods || []);
      setPeriodOptions(registeredPeriods);

      if (registeredPeriods.length > 0) {
        const currentPeriod = registeredPeriods.find((period) => period.yil === workYear);
        setSourceYear(String(currentPeriod?.yil || registeredPeriods[0].yil));
      } else {
        setSourceYear("");
      }
    } catch (error) {
      setPeriodOptions([]);
      setSourceYear("");
      setPeriodSetupRequired(false);
      setDevirErrorMessage(
        error instanceof Error ? error.message : "Çalışma dönemleri alınamadı.",
      );
    }
  }, [authHeaders, workYear]);

  const loadPersonnelActivities = useCallback(async () => {
    setIsActivityLoading(true);
    setActivityErrorMessage("");

    try {
      const headers = await authHeaders();
      const params = new URLSearchParams({
        period: activityPeriod,
        staffUserId: selectedStaffUserId,
        workYear: String(workYear),
      });
      const response = await fetch(`/api/on-muhasebe/personel-hareketleri?${params.toString()}`, {
        headers,
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Personel hareketleri alınamadı.");
      }

      setStaffOptions(result.staff || []);
      setActivities(result.activities || []);
      setActivitySummary(result.summary || emptySummary);
      setActivitySetupRequired(Boolean(result.setupRequired));
      setActivityMessage(result.message || "");
    } catch (error) {
      setActivityErrorMessage(
        error instanceof Error ? error.message : "Personel hareketleri alınamadı.",
      );
    } finally {
      setIsActivityLoading(false);
    }
  }, [activityPeriod, authHeaders, selectedStaffUserId, workYear]);

  const loadDevirler = useCallback(
    async (devirId?: string | null) => {
      setIsDevirLoading(true);
      setDevirErrorMessage("");

      try {
        const headers = await authHeaders();
        const params = new URLSearchParams({ workYear: String(workYear) });

        if (devirId) {
          params.set("devirId", devirId);
        }

        const response = await fetch(`/api/on-muhasebe/devir?${params.toString()}`, {
          headers,
          cache: "no-store",
        });
        const result = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(result?.message || "Devir bilgileri alınamadı.");
        }

        setDevirler(result.devirler || []);
        setSelectedDevirId(result.selectedDevirId || null);
        setDevirDetails(result.details || []);
        setDevirSetupRequired(Boolean(result.setupRequired));
        setDevirMessage(result.message || "");
      } catch (error) {
        setDevirErrorMessage(
          error instanceof Error ? error.message : "Devir bilgileri alınamadı.",
        );
      } finally {
        setIsDevirLoading(false);
      }
    },
    [authHeaders, workYear],
  );

  useEffect(() => {
    let isMounted = true;

    async function loadInitial() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const owner = await loadMe();

        if (owner) {
          await Promise.all([loadSettings(), loadWorkPeriods(), loadDevirler()]);
        }
      } catch (error) {
        if (!isMounted) return;
        setErrorMessage(error instanceof Error ? error.message : "Ayarlar yüklenemedi.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadInitial();

    return () => {
      isMounted = false;
    };
  }, [loadDevirler, loadMe, loadSettings, loadWorkPeriods]);

  useEffect(() => {
    if (!isOwner) return;
    loadPersonnelActivities();
  }, [isOwner, loadPersonnelActivities]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSaving(true);
    setMessage("");
    setErrorMessage("");

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/on-muhasebe/settings", {
        method: "PUT",
        headers,
        body: JSON.stringify({
          autoBackupEnabled: settings.auto_backup_enabled,
          backupEmail: settings.backup_email,
          backupFrequencyHours: settings.backup_frequency_hours,
          defaultKdvRate: settings.default_kdv_rate,
          lowStockAlertEnabled: settings.low_stock_alert_enabled,
          receiptPrefix: settings.receipt_prefix,
          whatsappSupportEnabled: settings.whatsapp_support_enabled,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Ayarlar kaydedilemedi.");
      }

      setSettings(result.settings || settings);
      setSetupRequired(false);
      setMessage(result.message || "Ayarlar kaydedildi.");
    } catch (error) {
      setErrorMessage(error instanceof Error ? error.message : "Ayarlar kaydedilemedi.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handlePasswordSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsPasswordSaving(true);
    setPasswordMessage("");
    setPasswordErrorMessage("");

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/on-muhasebe/sifre-degistir", {
        method: "POST",
        headers,
        body: JSON.stringify({ oldPassword, newPassword, newPasswordAgain }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Şifre değiştirilemedi.");
      }

      setOldPassword("");
      setNewPassword("");
      setNewPasswordAgain("");
      setPasswordMessage(result?.message || "Şifre başarıyla değiştirildi.");
    } catch (error) {
      setPasswordErrorMessage(error instanceof Error ? error.message : "Şifre değiştirilemedi.");
    } finally {
      setIsPasswordSaving(false);
    }
  }

  async function handleDevirSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsDevirSaving(true);
    setDevirMessage("");
    setDevirErrorMessage("");

    try {
      const headers = await authHeaders();
      const response = await fetch(buildYearScopedUrl("/api/on-muhasebe/devir", workYear), {
        method: "POST",
        headers,
        body: JSON.stringify({
          sourceYear: Number(sourceYear),
          targetYear: Number(targetYear),
          overwrite: overwriteDevir,
        }),
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Devir hazırlanamadı.");
      }

      setDevirler(result.devirler || []);
      setSelectedDevirId(result.selectedDevirId || null);
      setDevirDetails(result.details || []);
      setDevirSetupRequired(false);
      setDevirMessage(result.message || "Devir hazırlandı.");
      setOverwriteDevir(false);
      await loadWorkPeriods();
    } catch (error) {
      setDevirErrorMessage(error instanceof Error ? error.message : "Devir hazırlanamadı.");
    } finally {
      setIsDevirSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="mt-5 text-sm font-black text-slate-600">Ayarlar yükleniyor...</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-5 py-6 text-slate-950 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              {isOwner ? "Genel" : "Hesap"}
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              {isOwner ? "Ayarlar" : "Hesap Ayarları"}
            </h1>
            {accountEmail ? (
              <p className="mt-2 text-sm font-bold text-slate-500">{accountEmail}</p>
            ) : null}
          </div>
          <Link
            href="/on-muhasebe/panel"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-slate-950 shadow-lg shadow-slate-200 transition hover:bg-slate-100"
          >
            Panele Dön
          </Link>
        </div>

        <div className="mt-5 flex flex-wrap gap-2">
          {isOwner ? (
            <>
              <a href="#genel" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                Genel Ayarlar
              </a>
              <a href="#personel-hareketleri" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                Personel Hareketleri
              </a>
              <a href="#donem-devir" className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700 shadow-sm">
                Dönem / Devir
              </a>
            </>
          ) : null}
          <a href="#sifre" className="rounded-full bg-slate-950 px-4 py-2 text-xs font-black text-white shadow-sm">
            Şifre Yenileme
          </a>
        </div>

        {errorMessage ? (
          <div className="mt-5 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        {!isOwner ? (
          <div className="mt-5 rounded-[1.75rem] bg-indigo-50 p-5 text-sm font-bold leading-7 text-indigo-800">
            Personel hesabında sadece kendi şifreni yenileyebilirsin. Personel hareketleri, dönem ve devir ekranları yönetici hesabında görünür.
          </div>
        ) : null}

        {isOwner ? (
          <form
            id="genel"
            onSubmit={handleSubmit}
            className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7"
          >
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Yedekleme</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Otomatik yedek ayarları</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                Yedek e-postası, varsayılan KDV, düşük stok uyarısı ve fiş ön eki bu bölümden yönetilir.
              </p>
            </div>

            {setupRequired ? (
              <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
                Otomatik yedek ayarlarının kalıcı çalışması için supabase/on_muhasebe_backup_setup.sql dosyasını çalıştırmalısın.
              </div>
            ) : null}

            {message ? (
              <div className="mt-5 rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {message}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4">
              <label className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
                <span>
                  <span className="block text-sm font-black">Otomatik yedek açık</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">Cron endpoint çalıştığında yedek e-postaya gönderilir.</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.auto_backup_enabled}
                  onChange={(event) => setSettings((prev) => ({ ...prev, auto_backup_enabled: event.target.checked }))}
                  className="h-6 w-6 rounded border-slate-300"
                />
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-sm font-black">Yedek e-postası</span>
                  <input
                    type="email"
                    value={settings.backup_email || ""}
                    onChange={(event) => setSettings((prev) => ({ ...prev, backup_email: event.target.value }))}
                    className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black">Yedek sıklığı</span>
                  <select
                    value={settings.backup_frequency_hours}
                    onChange={(event) => setSettings((prev) => ({ ...prev, backup_frequency_hours: Number(event.target.value) }))}
                    className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  >
                    <option value={24}>24 saatte bir</option>
                    <option value={48}>48 saatte bir</option>
                    <option value={72}>72 saatte bir</option>
                  </select>
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black">Varsayılan KDV (%)</span>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={settings.default_kdv_rate}
                    onChange={(event) => setSettings((prev) => ({ ...prev, default_kdv_rate: Number(event.target.value) }))}
                    className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  />
                </label>

                <label className="grid gap-2">
                  <span className="text-sm font-black">Fiş ön eki</span>
                  <input
                    value={settings.receipt_prefix || "FIS"}
                    onChange={(event) => setSettings((prev) => ({ ...prev, receipt_prefix: event.target.value.toUpperCase() }))}
                    className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  />
                </label>
              </div>

              <label className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
                <span>
                  <span className="block text-sm font-black">Düşük stok uyarısı</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">Kritik stok altındaki ürünleri raporlarda öne çıkarır.</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.low_stock_alert_enabled}
                  onChange={(event) => setSettings((prev) => ({ ...prev, low_stock_alert_enabled: event.target.checked }))}
                  className="h-6 w-6 rounded border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
                <span>
                  <span className="block text-sm font-black">WhatsApp destek açık</span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">Panelde destek yönlendirmelerini aktif tutar.</span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.whatsapp_support_enabled}
                  onChange={(event) => setSettings((prev) => ({ ...prev, whatsapp_support_enabled: event.target.checked }))}
                  className="h-6 w-6 rounded border-slate-300"
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSaving}
              className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </button>
          </form>
        ) : null}

        {isOwner ? (
          <section id="personel-hareketleri" className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Personel</p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Personel hareketleri</h2>
                <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                  Seçili personelin günlük, haftalık, aylık veya yıllık işlemlerini gösterir.
                </p>
              </div>
              <button
                type="button"
                onClick={loadPersonnelActivities}
                disabled={isActivityLoading}
                className="inline-flex min-h-11 items-center justify-center rounded-full bg-slate-100 px-5 text-sm font-black text-slate-700 transition hover:bg-slate-200 disabled:opacity-60"
              >
                Yenile
              </button>
            </div>

            {activitySetupRequired ? (
              <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
                Personel hareket tablosu kurulmamış. Supabase dönem/devir/personel SQL dosyasını çalıştırınca hareketler görünür.
              </div>
            ) : null}

            {activityMessage ? (
              <div className="mt-5 rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {activityMessage}
              </div>
            ) : null}

            {activityErrorMessage ? (
              <div className="mt-5 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {activityErrorMessage}
              </div>
            ) : null}

            <div className="mt-6 grid gap-4 md:grid-cols-[1fr_1fr]">
              <label className="grid gap-2">
                <span className="text-sm font-black">Personel</span>
                <select
                  value={selectedStaffUserId}
                  onChange={(event) => setSelectedStaffUserId(event.target.value)}
                  className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  <option value="all">Tüm personeller</option>
                  {staffOptions.map((staff) => (
                    <option key={staff.id} value={staff.userId}>
                      {staff.fullName} {staff.email ? `- ${staff.email}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black">Dönem filtresi</span>
                <select
                  value={activityPeriod}
                  onChange={(event) => setActivityPeriod(event.target.value as ActivityPeriod)}
                  className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                >
                  {Object.entries(activityPeriodLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">İşlem</p>
                <p className="mt-2 text-2xl font-black">{activitySummary.total}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Tutar</p>
                <p className="mt-2 text-2xl font-black">{paraFormatla(activitySummary.totalAmount)}</p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Yıl</p>
                <p className="mt-2 text-2xl font-black">{workYear}</p>
              </div>
            </div>

            <div className="mt-5 overflow-hidden rounded-[1.5rem] border border-slate-200">
              <div className="grid grid-cols-[1fr_0.8fr_0.8fr_0.9fr] gap-3 bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 max-md:hidden">
                <span>İşlem</span>
                <span>Modül</span>
                <span>Tutar</span>
                <span>Tarih</span>
              </div>

              {activities.length === 0 ? (
                <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">
                  Seçili filtrede personel hareketi yok.
                </div>
              ) : (
                activities.map((activity) => (
                  <div
                    key={activity.id}
                    className="grid gap-2 border-t border-slate-200 px-4 py-4 text-sm font-bold text-slate-700 md:grid-cols-[1fr_0.8fr_0.8fr_0.9fr]"
                  >
                    <div>
                      <div className="font-black text-slate-950">{activity.title}</div>
                      <div className="mt-1 text-xs text-slate-500">{activity.detail || activity.action_type}</div>
                    </div>
                    <div>{moduleLabels[activity.module_key] || activity.module_key}</div>
                    <div>{activity.amount ? paraFormatla(activity.amount) : "-"}</div>
                    <div>{tarihSaatFormatla(activity.created_at)}</div>
                  </div>
                ))
              )}
            </div>
          </section>
        ) : null}

        {isOwner ? (
          <section id="donem-devir" className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Dönem</p>
              <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Dönem ve devir işlemleri</h2>
              <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
                Kaynak dönem sadece kayıtlı dönemlerden seçilir. Hedef dönem devir başarılı olursa otomatik açılır.
              </p>
            </div>

            {devirSetupRequired ? (
              <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
                Devir tabloları kurulmamış. Supabase dönem/devir/personel SQL dosyasını çalıştırmalısın.
              </div>
            ) : null}

            {periodSetupRequired ? (
              <div className="mt-5 rounded-[1.5rem] bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
                Çalışma dönemi tablosu kurulmamış. SQL dosyasını çalıştırınca kayıtlı dönemler listelenir.
              </div>
            ) : null}

            {devirMessage ? (
              <div className="mt-5 rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
                {devirMessage}
              </div>
            ) : null}

            {devirErrorMessage ? (
              <div className="mt-5 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
                {devirErrorMessage}
              </div>
            ) : null}

            <div className="mt-5 rounded-[1.5rem] bg-slate-100 p-4">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">Kayıtlı dönemler</p>
              <div className="mt-3 flex flex-wrap gap-2">
                {periodOptions.length === 0 ? (
                  <span className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-500">Kayıtlı dönem yok</span>
                ) : (
                  periodOptions.map((period) => (
                    <span key={period.id} className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-700">
                      {period.yil} {period.durum === "kapali" ? "Kapalı" : "Açık"}
                    </span>
                  ))
                )}
              </div>
            </div>

            <form onSubmit={handleDevirSubmit} className="mt-6 grid gap-4 lg:grid-cols-[1fr_1fr_auto] lg:items-end">
              <label className="grid gap-2">
                <span className="text-sm font-black">Kaynak Dönem</span>
                <select
                  value={sourceYear}
                  onChange={(event) => setSourceYear(event.target.value)}
                  disabled={periodOptions.length === 0}
                  className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {periodOptions.length === 0 ? <option value="">Kayıtlı dönem yok</option> : null}
                  {periodOptions.map((period) => (
                    <option key={period.id} value={period.yil}>
                      {period.yil} dönemi {period.durum === "kapali" ? "(Kapalı)" : ""}
                    </option>
                  ))}
                </select>
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black">Hedef Dönem</span>
                <div className="flex min-h-14 items-center rounded-2xl border border-slate-200 bg-slate-100 px-4 text-sm font-black text-slate-700">
                  {targetYear ? `${sourceYear} → ${targetYear}` : "Önce kaynak dönem seç"}
                </div>
                <span className="text-xs font-bold leading-5 text-slate-500">
                  Hedef yıl listede sahte olarak gösterilmez.
                </span>
              </label>

              <button
                type="submit"
                disabled={isDevirSaving || !sourceYear || periodOptions.length === 0}
                className="inline-flex min-h-14 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDevirSaving ? "Hazırlanıyor..." : "Devir Hazırla"}
              </button>
            </form>

            <label className="mt-4 flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
              <span>
                <span className="block text-sm font-black">Mevcut devri yenile</span>
                <span className="mt-1 block text-xs font-bold text-slate-500">
                  Aynı yıl aralığı daha önce hazırlanmışsa eski kayıt silinip tekrar hesaplanır.
                </span>
              </span>
              <input
                type="checkbox"
                checked={overwriteDevir}
                onChange={(event) => setOverwriteDevir(event.target.checked)}
                className="h-6 w-6 rounded border-slate-300"
              />
            </label>

            <div className="mt-6 grid gap-4 lg:grid-cols-[0.9fr_1.3fr]">
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="text-base font-black">Devir Geçmişi</h3>
                  <button
                    type="button"
                    onClick={() => loadDevirler()}
                    disabled={isDevirLoading}
                    className="rounded-full bg-white px-4 py-2 text-xs font-black text-slate-950 shadow-sm disabled:opacity-60"
                  >
                    Yenile
                  </button>
                </div>

                <div className="mt-4 grid gap-3">
                  {devirler.length === 0 ? (
                    <p className="text-sm font-bold leading-6 text-slate-500">Henüz hazırlanmış devir yok.</p>
                  ) : (
                    devirler.map((devir) => (
                      <button
                        key={devir.id}
                        type="button"
                        onClick={() => loadDevirler(devir.id)}
                        className={`rounded-[1.25rem] p-4 text-left transition ${
                          selectedDevirId === devir.id
                            ? "bg-slate-950 text-white"
                            : "bg-white text-slate-950 hover:bg-slate-50"
                        }`}
                      >
                        <div className="text-sm font-black">{devir.kaynak_yil} → {devir.hedef_yil}</div>
                        <div className="mt-1 text-xs font-bold opacity-75">
                          {devir.cari_sayisi} cari · Net {paraFormatla(devir.net_bakiye)}
                        </div>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div className="overflow-hidden rounded-[1.5rem] border border-slate-200">
                <div className="grid grid-cols-[1.2fr_1fr_1fr] gap-3 bg-slate-100 px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-slate-500 max-md:hidden">
                  <span>Cari</span>
                  <span>Yıl Sonu</span>
                  <span>Hedef Açılış</span>
                </div>

                {devirDetails.length === 0 ? (
                  <div className="px-4 py-8 text-center text-sm font-bold text-slate-500">Seçili devir detayı yok.</div>
                ) : (
                  devirDetails.map((detail) => (
                    <div
                      key={detail.id}
                      className="grid gap-2 border-t border-slate-200 px-4 py-4 text-sm font-bold text-slate-700 md:grid-cols-[1.2fr_1fr_1fr]"
                    >
                      <div>
                        <div className="font-black text-slate-950">{detail.unvan}</div>
                        <div className="mt-1 text-xs text-slate-500">{detail.cari_kodu}</div>
                      </div>
                      <div>{paraFormatla(detail.kaynak_yil_son_bakiye)}</div>
                      <div>
                        {paraFormatla(detail.hedef_acilis_bakiyesi)}
                        <div className="mt-1 text-xs text-slate-500">{devirTipiEtiketi(detail.hedef_acilis_bakiye_tipi)}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </section>
        ) : null}

        <form
          id="sifre"
          onSubmit={handlePasswordSubmit}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Güvenlik</p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">Şifre yenileme</h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Eski şifre doğruysa yeni şifre Supabase Auth üzerinde gerçekten güncellenir.
            </p>
          </div>

          {passwordMessage ? (
            <div className="mt-5 rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
              {passwordMessage}
            </div>
          ) : null}

          {passwordErrorMessage ? (
            <div className="mt-5 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
              {passwordErrorMessage}
            </div>
          ) : null}

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <label className="grid gap-2">
              <span className="text-sm font-black">Eski Şifre</span>
              <input
                type="password"
                value={oldPassword}
                onChange={(event) => setOldPassword(event.target.value)}
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                autoComplete="current-password"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black">Yeni Şifre</span>
              <input
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                autoComplete="new-password"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black">Yeni Şifre Tekrar</span>
              <input
                type="password"
                value={newPasswordAgain}
                onChange={(event) => setNewPasswordAgain(event.target.value)}
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                autoComplete="new-password"
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={isPasswordSaving}
            className="mt-6 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isPasswordSaving ? "Şifre Değiştiriliyor..." : "Şifreyi Değiştir"}
          </button>
        </form>
      </section>
    </main>
  );
}
