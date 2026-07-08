"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
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

export default function OnMuhasebeAyarlarPage() {
  const [settings, setSettings] = useState<Settings>({
    auto_backup_enabled: true,
    backup_email: "",
    backup_frequency_hours: 24,
    default_kdv_rate: 20,
    low_stock_alert_enabled: true,
    receipt_prefix: "FIS",
    whatsapp_support_enabled: true,
  });
  const [setupRequired, setSetupRequired] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  async function authHeaders() {
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
  }

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setIsLoading(true);
      setErrorMessage("");

      try {
        const headers = await authHeaders();
        const response = await fetch("/api/on-muhasebe/settings", {
          headers,
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Ayarlar yüklenemedi.");
        }

        if (isMounted) {
          setSettings(result.settings);
          setSetupRequired(Boolean(result.setupRequired));
          setMessage(result.message || "");
        }
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error ? error.message : "Ayarlar yüklenemedi.",
        );
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

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
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Ayarlar kaydedilemedi.");
      }

      setSettings(result.settings);
      setSetupRequired(false);
      setMessage(result.message || "Ayarlar kaydedildi.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Ayarlar kaydedilemedi.",
      );
    } finally {
      setIsSaving(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-indigo-600" />
          <p className="mt-5 text-sm font-black text-slate-600">
            Ayarlar yükleniyor...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f3f6fb] px-5 py-6 text-slate-950 lg:px-8">
      <section className="mx-auto max-w-5xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-indigo-600">
              Genel
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Ayarlar
            </h1>
          </div>
          <Link
            href="/on-muhasebe/panel"
            className="inline-flex min-h-12 items-center justify-center rounded-full bg-white px-6 text-sm font-black text-slate-950 shadow-lg shadow-slate-200 transition hover:bg-slate-100"
          >
            Panele Dön
          </Link>
        </div>

        {setupRequired ? (
          <div className="mt-5 rounded-[1.75rem] bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
            Otomatik yedek ayarlarının kalıcı çalışması için
            <span className="font-black"> supabase/on_muhasebe_backup_setup.sql </span>
            dosyasındaki SQL kurulumu çalıştırılmalı.
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-sm font-bold text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <form
          onSubmit={handleSubmit}
          className="mt-5 rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7"
        >
          <div>
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Yedekleme
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
              Otomatik yedek ayarları
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Sistem 24 saatte bir yedek alacak şekilde hazırlanmıştır. Cron
              endpoint çağrıldığında yedek dosyası seçilen e-posta adresine
              gönderilir.
            </p>
          </div>

          <div className="mt-6 grid gap-4">
            <label className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
              <span>
                <span className="block text-sm font-black">
                  Otomatik yedek açık
                </span>
                <span className="mt-1 block text-xs font-bold text-slate-500">
                  Günde bir kez yedek alınıp e-posta adresine gönderilir.
                </span>
              </span>
              <input
                type="checkbox"
                checked={settings.auto_backup_enabled}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    auto_backup_enabled: event.target.checked,
                  }))
                }
                className="h-6 w-6 rounded border-slate-300"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black">Yedek E-posta Adresi</span>
              <input
                type="email"
                value={settings.backup_email || ""}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    backup_email: event.target.value,
                  }))
                }
                placeholder="mail@firma.com"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
              />
            </label>

            <label className="grid gap-2">
              <span className="text-sm font-black">Yedek Sıklığı</span>
              <select
                value={settings.backup_frequency_hours}
                onChange={(event) =>
                  setSettings((current) => ({
                    ...current,
                    backup_frequency_hours: Number(event.target.value),
                  }))
                }
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
              >
                <option value={24}>24 saatte bir</option>
                <option value={48}>48 saatte bir</option>
                <option value={72}>72 saatte bir</option>
              </select>
            </label>
          </div>

          <div className="mt-8 border-t border-slate-200 pt-6">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Kullanım Tercihleri
            </p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="grid gap-2">
                <span className="text-sm font-black">Varsayılan KDV Oranı</span>
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={settings.default_kdv_rate}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      default_kdv_rate: Number(event.target.value),
                    }))
                  }
                  className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-black">Fiş Numarası Ön Eki</span>
                <input
                  value={settings.receipt_prefix}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      receipt_prefix: event.target.value.toUpperCase(),
                    }))
                  }
                  className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-indigo-500 focus:bg-white"
                  placeholder="FIS"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
                <span>
                  <span className="block text-sm font-black">
                    Kritik stok uyarısı
                  </span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    Stok ekranında kritik seviyeleri görünür tutar.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.low_stock_alert_enabled}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      low_stock_alert_enabled: event.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded border-slate-300"
                />
              </label>

              <label className="flex items-center justify-between gap-4 rounded-[1.5rem] bg-slate-100 p-4">
                <span>
                  <span className="block text-sm font-black">
                    WhatsApp destek butonları
                  </span>
                  <span className="mt-1 block text-xs font-bold text-slate-500">
                    Kritik ekranlarda destek kısayolları gösterilir.
                  </span>
                </span>
                <input
                  type="checkbox"
                  checked={settings.whatsapp_support_enabled}
                  onChange={(event) =>
                    setSettings((current) => ({
                      ...current,
                      whatsapp_support_enabled: event.target.checked,
                    }))
                  }
                  className="h-6 w-6 rounded border-slate-300"
                />
              </label>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-black text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Kaydediliyor..." : "Ayarları Kaydet"}
            </button>
            <Link
              href="/on-muhasebe/panel/yedekleme"
              className="inline-flex min-h-12 flex-1 items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Manuel Yedek Al
            </Link>
          </div>
        </form>
      </section>
    </main>
  );
}
