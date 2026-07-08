"use client";

import Link from "next/link";
import { useMemo } from "react";

function formatDate(value: string | null) {
  if (!value) return "-";

  const date = new Date(value);

  if (!Number.isFinite(date.getTime())) {
    return "-";
  }

  return new Intl.DateTimeFormat("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

const supportPhone = "905515550302";
const activationMessage =
  "Sitemix Ön Muhasebe paketimi aktif etmek istiyorum.";

export default function OnMuhasebeDenemeBittiPage() {
  const params = useMemo(() => {
    if (typeof window === "undefined") {
      return new URLSearchParams();
    }

    return new URLSearchParams(window.location.search);
  }, []);

  const paket = params.get("paket") || "Seçili paket";
  const durum = params.get("durum") || "Süresi Doldu";
  const bitis = formatDate(params.get("bitis"));

  return (
    <main className="min-h-screen overflow-hidden bg-[#eef2ff] text-[#0b1025]">
      <section className="relative px-5 py-6 sm:py-8 lg:px-8">
        <div className="absolute left-[-140px] top-10 h-80 w-80 rounded-full bg-[#7c3aed]/20 blur-3xl" />
        <div className="absolute right-[-140px] top-40 h-80 w-80 rounded-full bg-[#06b6d4]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-80 w-80 -translate-x-1/2 rounded-full bg-[#22c55e]/10 blur-3xl" />

        <div className="relative mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/on-muhasebe" className="flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#111827] text-sm font-black text-white shadow-lg shadow-indigo-900/20">
              <span className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#06b6d4] to-[#22c55e] opacity-90" />
              <span className="relative text-white">S</span>
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-[-0.03em] text-[#0b1025]">
                Sitemix
              </span>
              <span className="block text-xs font-extrabold text-slate-500">
                Ön Muhasebe
              </span>
            </span>
          </Link>

          <Link
            href="/on-muhasebe/giris"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-4 text-xs font-black shadow-lg shadow-indigo-950/5 transition hover:-translate-y-0.5 hover:bg-indigo-50 sm:px-5 sm:text-sm"
          >
            <span className="text-[#0b1025]">Giriş Ekranı</span>
          </Link>
        </div>

        <div className="relative mx-auto grid max-w-6xl gap-8 py-12 lg:grid-cols-[0.95fr_1.05fr] lg:items-center lg:py-20">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-red-600 shadow-lg shadow-indigo-950/5">
              Deneme süresi tamamlandı
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-[-0.06em] text-[#0b1025] sm:text-5xl lg:text-6xl">
              Panel kullanımına devam etmek için
              <span className="block bg-gradient-to-r from-[#4f46e5] via-[#06b6d4] to-[#22c55e] bg-clip-text text-transparent">
                paketi aktif et.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600">
              Ücretsiz deneme bittikten sonra cari, stok, kasa, fiş ve rapor
              ekranları korunur; devam etmek için ödeme veya admin onayı gerekir.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a
                href={`https://wa.me/${supportPhone}?text=${encodeURIComponent(
                  activationMessage,
                )}`}
                target="_blank"
                rel="noreferrer"
                className="inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#4f46e5] px-8 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#4338ca]"
              >
                WhatsApp ile Aktifleştir
              </a>
              <Link
                href="/on-muhasebe/giris"
                className="inline-flex min-h-[58px] items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-black text-[#111827] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                Girişe Dön
              </Link>
            </div>
          </div>

          <div className="rounded-[2.25rem] bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-7 lg:rounded-[2.75rem] lg:p-8">
            <p className="text-sm font-black uppercase tracking-[0.22em] text-[#4f46e5]">
              Paket Bilgisi
            </p>
            <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0b1025]">
              Hesap durumu
            </h2>

            <div className="mt-6 grid gap-3">
              <div className="rounded-[1.5rem] bg-slate-100 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Paket
                </p>
                <p className="mt-2 text-xl font-black text-slate-950">
                  {paket}
                </p>
              </div>

              <div className="rounded-[1.5rem] bg-slate-100 p-5">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                  Durum
                </p>
                <p className="mt-2 text-xl font-black text-red-600">{durum}</p>
              </div>

              <div className="rounded-[1.5rem] bg-slate-950 p-5 text-white">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-white/40">
                  Deneme Bitişi
                </p>
                <p className="mt-2 text-xl font-black text-white">{bitis}</p>
              </div>
            </div>

            <div className="mt-6 rounded-[1.75rem] bg-amber-50 p-5 text-sm font-bold leading-7 text-amber-800">
              Admin paneli tamamlandığında paket aktifleştirme ve süre uzatma
              işlemleri yönetim ekranından yapılacak. Şimdilik bu ekran kullanıcıyı
              doğru bilgilendirir ve panel erişimini kapatır.
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
