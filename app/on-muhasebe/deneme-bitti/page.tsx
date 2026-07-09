"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabaseClient } from "@/lib/supabaseClient";

const supportPhone = "905515550302";
const paymentOwner = "Hakan Benli";
const paymentBank = "Ziraat Bankasi";
const paymentIban = "TR 6300 0100 4013 9635 0584 5010";

function formatMoney(value: number, currency = "TRY") {
  if (!Number.isFinite(value) || value <= 0) return "-";

  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);
  if (!Number.isFinite(date.getTime())) return "-";

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function paymentCodeFromParams(params: URLSearchParams) {
  return params.get("kod") || "SITEMIX";
}

export default function OnMuhasebeDenemeBittiPage() {
  const [copiedKey, setCopiedKey] = useState("");
  const [notificationSent, setNotificationSent] = useState(false);
  const [isSendingNotification, setIsSendingNotification] = useState(false);
  const [notificationError, setNotificationError] = useState("");
  const [params, setParams] = useState(() => new URLSearchParams());

  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAccess() {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) return;

      const response = await fetch("/api/on-muhasebe/subscription-status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
        cache: "no-store",
      });
      const result = await response.json().catch(() => null);

      if (!isMounted || !response.ok || !result?.allowed) return;

      for (let index = window.sessionStorage.length - 1; index >= 0; index -= 1) {
        const key = window.sessionStorage.key(index);
        if (
          key?.startsWith("onMuhasebeBootstrap") ||
          key?.startsWith("onMuhasebeClientContext") ||
          key?.startsWith("onMuhasebeDashboard")
        ) {
          window.sessionStorage.removeItem(key);
        }
      }

      window.location.replace("/on-muhasebe/panel");
    }

    checkAccess();
    const timer = window.setInterval(checkAccess, 10000);

    return () => {
      isMounted = false;
      window.clearInterval(timer);
    };
  }, []);

  const paket = params.get("paket") || "Secili paket";
  const durum = params.get("durum") || "Suresi Doldu";
  const bitis = formatDate(params.get("bitis"));
  const currency = params.get("para") || "TRY";
  const monthlyPrice = Number(params.get("aylik") || 0);
  const totalPrice = Number(params.get("toplam") || 0);
  const billingMonths = Number(params.get("ay") || 0);
  const isStaffAccount = params.get("rol") === "staff";
  const paymentCode = paymentCodeFromParams(params);
  const paymentDescription = `SITEMIX ${paymentCode}`;
  const activationMessage = `Sitemix On Muhasebe odeme bildirimi icin destek istiyorum. Odeme aciklamasi: ${paymentDescription}`;

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey(""), 1600);
    } catch {
      setCopiedKey("");
    }
  }

  async function sendPaymentNotification() {
    setNotificationError("");
    setIsSendingNotification(true);

    try {
      const {
        data: { session },
      } = await supabaseClient.auth.getSession();

      if (!session) {
        throw new Error("Odeme bildirimi icin tekrar giris yapmaniz gerekiyor.");
      }

      const response = await fetch("/api/on-muhasebe/payment-notification", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
        },
      });
      const result = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(result?.message || "Odeme bildirimi gonderilemedi.");
      }

      setNotificationSent(true);
    } catch (error) {
      setNotificationError(
        error instanceof Error ? error.message : "Odeme bildirimi gonderilemedi.",
      );
    } finally {
      setIsSendingNotification(false);
    }
  }

  const paymentRows = [
    ["owner", "Alici Adi", paymentOwner],
    ["bank", "Banka", paymentBank],
    ["iban", "IBAN", paymentIban],
    ["desc", "Aciklama", paymentDescription],
  ] as const;

  return (
    <main className="min-h-screen bg-[#f3f6fb] text-slate-950">
      <section className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="flex items-center justify-between gap-3 border-b border-slate-200 pb-5">
          <Link href="/on-muhasebe" className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-slate-950 text-sm font-black text-white">
              S
            </span>
            <span>
              <span className="block text-base font-black tracking-[-0.03em]">
                Sitemix
              </span>
              <span className="block text-xs font-extrabold text-slate-500">
                On Muhasebe
              </span>
            </span>
          </Link>

          <Link
            href="/on-muhasebe/giris"
            className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-sm font-black text-slate-950 shadow-sm hover:bg-slate-50"
          >
            Giris Ekrani
          </Link>
        </header>

        <div className="grid flex-1 gap-6 py-8 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-12">
          <div>
            <div className="inline-flex items-center rounded-full bg-red-50 px-4 py-2 text-xs font-black text-red-700 ring-1 ring-red-100">
              Paket suresi doldu
            </div>

            <h1 className="mt-5 max-w-2xl text-4xl font-black tracking-[-0.05em] text-slate-950 sm:text-5xl">
              {isStaffAccount
                ? "Firmanın aylık paketi sonlanmıştır."
                : "Devam etmek için ödeme yapıp onay bekleyin."}
            </h1>

            <p className="mt-5 max-w-xl text-sm font-bold leading-7 text-slate-600 sm:text-base">
              {isStaffAccount
                ? "Bu hesap ana firmaya bağlı personel hesabıdır. Ödeme ana kullanıcı tarafından yapıldığında sisteminiz tekrar açılır."
                : "Cari, stok, kasa, fiş ve rapor verileriniz korunur. Ödeme açıklamasına müşteri kodunu yazarsanız admin panelinde ödeme hızlı eşleşir ve onaydan sonra yeni bitiş tarihi otomatik kaydedilir."}
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Paket
                </p>
                <p className="mt-2 text-sm font-black">{paket}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Ödenecek Tutar
                </p>
                <p className="mt-2 text-sm font-black">{formatMoney(totalPrice, currency)}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Aylık Karşılık
                </p>
                <p className="mt-2 text-sm font-black">
                  {formatMoney(monthlyPrice, currency)}
                  {billingMonths > 0 ? ` / ${billingMonths} ay` : ""}
                </p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Durum
                </p>
                <p className="mt-2 text-sm font-black text-red-600">{durum}</p>
              </div>
              <div className="rounded-2xl bg-white p-4 shadow-sm">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Bitis
                </p>
                <p className="mt-2 text-sm font-black">{bitis}</p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-white p-5 shadow-xl shadow-slate-200 sm:p-6">
            <div className="flex flex-col gap-2 border-b border-slate-100 pb-5 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-indigo-600">
                  {isStaffAccount ? "Personel Bilgilendirme" : "Ödeme Bilgileri"}
                </p>
                <h2 className="mt-2 text-2xl font-black tracking-[-0.04em]">
                  {isStaffAccount ? "Panel geçici olarak kapalı" : "Havale / EFT"}
                </h2>
              </div>
              {!isStaffAccount ? (
                <span className="rounded-full bg-indigo-50 px-4 py-2 text-xs font-black text-indigo-700">
                  Kod: {paymentCode}
                </span>
              ) : null}
            </div>

            {isStaffAccount ? (
              <div className="mt-5 rounded-2xl bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800 ring-1 ring-amber-100">
                Ana firmanın aylık paketi sonlandığı için personel girişi kapalıdır.
                Ödeme onaylandığında hesabınız otomatik olarak tekrar panele yönlenir.
                Gerekirse firma yöneticinizle iletişime geçin.
              </div>
            ) : (
              <>
                <div className="mt-5 grid gap-3">
                  {paymentRows.map(([key, label, value]) => (
                    <div
                      key={key}
                      className="grid gap-3 rounded-2xl bg-slate-50 p-4 sm:grid-cols-[1fr_auto] sm:items-center"
                    >
                      <div className="min-w-0">
                        <p className="text-xs font-black uppercase tracking-[0.14em] text-slate-400">
                          {label}
                        </p>
                        <p className="mt-1 break-words text-base font-black text-slate-950">
                          {value}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyValue(key, value)}
                        className="inline-flex min-h-11 items-center justify-center rounded-full bg-white px-5 text-xs font-black text-slate-950 shadow-sm hover:bg-slate-100"
                      >
                        {copiedKey === key ? "Kopyalandı" : "Kopyala"}
                      </button>
                    </div>
                  ))}
                </div>

                <div className="mt-5 rounded-2xl bg-amber-50 p-4 text-sm font-bold leading-7 text-amber-800">
                  Açıklama alanına mutlaka <strong>{paymentDescription}</strong>{" "}
                  yazın. Ödeme onaylandığında panel tekrar açılır.
                </div>

                {notificationSent ? (
                  <div className="mt-4 rounded-2xl bg-emerald-50 p-4 text-sm font-bold leading-7 text-emerald-800 ring-1 ring-emerald-100">
                    Ödeme bildiriminiz alındı. Onay işlemi ortalama 15 dakika
                    sürebilir. Bu süre içinde panel açılmaz; onaydan sonra tekrar
                    giriş yaparak kullanmaya devam edebilirsiniz.
                  </div>
                ) : null}

                {notificationError ? (
                  <div className="mt-4 rounded-2xl bg-red-50 p-4 text-sm font-bold leading-7 text-red-700 ring-1 ring-red-100">
                    {notificationError}
                  </div>
                ) : null}

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    onClick={sendPaymentNotification}
                    disabled={isSendingNotification || notificationSent}
                    className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-indigo-600 px-6 text-sm font-black text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {notificationSent
                      ? "Onay Bekleniyor"
                      : isSendingNotification
                        ? "Gönderiliyor..."
                        : "Ödeme Yaptım"}
                  </button>
                  <a
                    href={`https://wa.me/${supportPhone}?text=${encodeURIComponent(
                      activationMessage,
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex min-h-[54px] items-center justify-center rounded-full bg-emerald-600 px-6 text-sm font-black text-white hover:bg-emerald-700"
                  >
                    15 Dakika Geçtiyse WhatsApp
                  </a>
                </div>
              </>
            )}

            <Link
              href="/on-muhasebe/giris"
              className="mt-3 inline-flex min-h-[54px] w-full items-center justify-center rounded-full bg-slate-950 px-6 text-sm font-black text-white hover:bg-slate-800"
            >
              Girise Don
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
