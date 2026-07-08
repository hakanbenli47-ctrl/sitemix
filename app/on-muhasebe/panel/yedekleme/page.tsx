"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

type Settings = {
  auto_backup_enabled: boolean;
  backup_email: string | null;
  backup_frequency_hours: number;
};

type EmailStatus =
  | { status: "sent"; messageId?: string }
  | { status: "not_configured" }
  | { status: "failed"; message: string };

export default function OnMuhasebeYedeklemePage() {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [setupRequired, setSetupRequired] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [emailStatus, setEmailStatus] = useState<EmailStatus | null>(null);

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

      try {
        const headers = await authHeaders();
        const response = await fetch("/api/on-muhasebe/settings", {
          headers,
          cache: "no-store",
        });
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.message || "Yedek ayarları alınamadı.");
        }

        if (isMounted) {
          setSettings(result.settings);
          setEmailTo(result.settings?.backup_email || "");
          setSetupRequired(Boolean(result.setupRequired));
          setMessage(result.message || "");
        }
      } catch (error) {
        if (!isMounted) return;

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Yedek ayarları alınamadı.",
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

  function downloadBackup(fileName: string, backup: unknown) {
    const blob = new Blob([JSON.stringify(backup, null, 2)], {
      type: "application/json;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");

    anchor.href = url;
    anchor.download = fileName;
    anchor.click();
    URL.revokeObjectURL(url);
  }

  async function manualBackup() {
    setIsBackingUp(true);
    setMessage("");
    setErrorMessage("");
    setEmailStatus(null);

    try {
      const headers = await authHeaders();
      const response = await fetch("/api/on-muhasebe/backup", {
        method: "POST",
        headers,
        body: JSON.stringify({ emailTo }),
      });
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Yedek alınamadı.");
      }

      downloadBackup(result.fileName, result.backup);
      setEmailStatus(result.email);
      setMessage(result.message || "Yedek oluşturuldu.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Yedek alınamadı.",
      );
    } finally {
      setIsBackingUp(false);
    }
  }

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#f3f6fb] px-5 text-slate-950">
        <div className="rounded-[2rem] bg-white p-8 text-center shadow-xl shadow-slate-200">
          <div className="mx-auto h-10 w-10 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-600" />
          <p className="mt-5 text-sm font-black text-slate-600">
            Yedekleme ekranı hazırlanıyor...
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
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Güvenlik
            </p>
            <h1 className="mt-2 text-3xl font-black tracking-[-0.05em] sm:text-4xl">
              Yedekleme
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
            Otomatik yedek kaydı için SQL kurulum dosyasını çalıştırmalısın.
            Manuel yedek indirme yine çalışır.
          </div>
        ) : null}

        {message ? (
          <div className="mt-5 rounded-[1.5rem] bg-emerald-50 px-5 py-4 text-sm font-bold leading-6 text-emerald-700">
            {message}
          </div>
        ) : null}

        {errorMessage ? (
          <div className="mt-5 rounded-[1.5rem] bg-red-50 px-5 py-4 text-sm font-bold leading-6 text-red-700">
            {errorMessage}
          </div>
        ) : null}

        <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
              Otomatik Durum
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
              24 saatlik yedek
            </h2>
            <div className="mt-5 grid gap-3">
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black text-slate-400">Durum</p>
                <p className="mt-1 text-sm font-black">
                  {settings?.auto_backup_enabled ? "Açık" : "Kapalı"}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black text-slate-400">Sıklık</p>
                <p className="mt-1 text-sm font-black">
                  {settings?.backup_frequency_hours || 24} saatte bir
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-slate-100 p-4">
                <p className="text-xs font-black text-slate-400">E-posta</p>
                <p className="mt-1 break-words text-sm font-black">
                  {settings?.backup_email || "-"}
                </p>
              </div>
            </div>

            <Link
              href="/on-muhasebe/panel/ayarlar"
              className="mt-5 inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white transition hover:bg-slate-800"
            >
              Yedek Ayarlarını Düzenle
            </Link>
          </div>

          <div className="rounded-[2rem] bg-white p-5 shadow-xl shadow-slate-200 sm:p-7">
            <p className="text-xs font-black uppercase tracking-[0.2em] text-emerald-600">
              Manuel Yedek
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-[-0.05em]">
              Hemen yedek al
            </h2>
            <p className="mt-2 text-sm font-bold leading-6 text-slate-500">
              Cari, stok, kasa, fiş/fatura, hareket ve ayar verileri JSON
              dosyası olarak hazırlanır. Dosya bilgisayara indirilir; e-posta
              servisi tanımlıysa aynı dosya mail eki olarak da gönderilir.
            </p>

            <label className="mt-5 grid gap-2">
              <span className="text-sm font-black">Yedek gönderilecek e-posta</span>
              <input
                type="email"
                value={emailTo}
                onChange={(event) => setEmailTo(event.target.value)}
                placeholder="mail@firma.com"
                className="min-h-14 rounded-2xl border border-slate-200 bg-slate-50 px-4 text-sm font-bold outline-none transition focus:border-emerald-500 focus:bg-white"
              />
            </label>

            <button
              type="button"
              onClick={manualBackup}
              disabled={isBackingUp}
              className="mt-5 inline-flex min-h-14 w-full items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-black text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isBackingUp ? "Yedek hazırlanıyor..." : "Manuel Yedek Al ve İndir"}
            </button>

            {emailStatus ? (
              <div className="mt-5 rounded-[1.5rem] bg-slate-100 p-4 text-sm font-bold leading-6 text-slate-600">
                {emailStatus.status === "sent"
                  ? "E-posta gönderildi."
                  : emailStatus.status === "not_configured"
                    ? "E-posta servisi tanımlı değil. Yedek dosyası indirildi."
                    : emailStatus.message}
              </div>
            ) : null}
          </div>
        </div>
      </section>
    </main>
  );
}
