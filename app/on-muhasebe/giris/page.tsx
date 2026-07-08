"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import {
  currentCalendarYear,
  pickRegisteredWorkYear,
  setBrowserWorkYear,
  sortWorkPeriods,
  type OnMuhasebeWorkPeriod,
} from "@/lib/onMuhasebe/workYear";
import { supabaseClient } from "@/lib/supabaseClient";

type LoginStage = "credentials" | "periods";

type PeriodResponse = {
  setupRequired?: boolean;
  canCreatePeriod?: boolean;
  periods?: OnMuhasebeWorkPeriod[];
  selectedYear?: number;
  message?: string;
};

export default function OnMuhasebeGirisPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [companyCode, setCompanyCode] = useState("");
  const [registerSuccess, setRegisterSuccess] = useState(false);
  const [stage, setStage] = useState<LoginStage>("credentials");
  const [periods, setPeriods] = useState<OnMuhasebeWorkPeriod[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [canCreatePeriod, setCanCreatePeriod] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCreatingPeriod, setIsCreatingPeriod] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const kayit = params.get("kayit");
    const firma = params.get("firma");

    if (kayit === "basarili") {
      setRegisterSuccess(true);
      setStatusMessage("Kayıt başarıyla oluşturuldu. Paneline giriş yapabilirsin.");
    }

    if (firma) {
      setCompanyCode(firma);
    }
  }, []);

  function redirectToPanel(year: number) {
    setBrowserWorkYear(year);
    setStatusMessage(`${year} çalışma dönemiyle giriş yapılıyor...`);
    window.location.href = "/on-muhasebe/panel";
  }

  async function loadRegisteredPeriods(accessToken: string) {
    const response = await fetch("/api/on-muhasebe/donemler", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    });

    const result = (await response.json().catch(() => null)) as PeriodResponse | null;

    if (!response.ok) {
      throw new Error(result?.message || "Çalışma dönemleri alınamadı.");
    }

    if (result?.setupRequired) {
      throw new Error(
        result.message ||
          "Çalışma dönemi tablosu kurulmamış. Önce Supabase SQL dosyasını çalıştır.",
      );
    }

    return {
      periods: sortWorkPeriods(result?.periods || []),
      canCreatePeriod: Boolean(result?.canCreatePeriod),
    };
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setErrorMessage("");
    setStatusMessage("");
    setIsSubmitting(true);

    try {
      const cleanEmail = email.trim().toLowerCase();

      if (!cleanEmail || !cleanEmail.includes("@")) {
        throw new Error("Geçerli bir e-posta adresi gir.");
      }

      if (!password || password.length < 6) {
        throw new Error("Şifre en az 6 karakter olmalı.");
      }

      const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: cleanEmail,
        password,
      });

      if (error) {
        throw new Error("E-posta veya şifre hatalı. Bilgileri kontrol et.");
      }

      const accessToken = data.session?.access_token;

      if (!accessToken) {
        throw new Error("Oturum açıldı ama erişim anahtarı alınamadı. Tekrar dene.");
      }

      const periodData = await loadRegisteredPeriods(accessToken);
      const registeredPeriods = periodData.periods;

      setPeriods(registeredPeriods);
      setCanCreatePeriod(periodData.canCreatePeriod);

      if (registeredPeriods.length === 0) {
        setSelectedYear(null);
        setStage("periods");
        setStatusMessage(
          periodData.canCreatePeriod
            ? "Bu firmada kayıtlı çalışma dönemi yok. Önce ilk dönemi oluştur."
            : "Bu firmada kayıtlı çalışma dönemi yok. Yönetici dönem oluşturmalı.",
        );
        return;
      }

      const pickedYear = pickRegisteredWorkYear(registeredPeriods, currentCalendarYear());

      if (!pickedYear) {
        throw new Error("Geçerli çalışma dönemi bulunamadı.");
      }

      setSelectedYear(pickedYear);
      setStage("periods");
      setStatusMessage("Kayıtlı dönemlerden çalışmak istediğin yılı seç.");
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Giriş sırasında hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateInitialPeriod() {
    setErrorMessage("");
    setStatusMessage("");
    setIsCreatingPeriod(true);

    try {
      const {
        data: { session },
        error,
      } = await supabaseClient.auth.getSession();

      if (error || !session) {
        throw new Error("Oturum bulunamadı. Tekrar giriş yap.");
      }

      const year = currentCalendarYear();
      const response = await fetch("/api/on-muhasebe/donemler", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ year }),
      });

      const result = (await response.json().catch(() => null)) as PeriodResponse | null;

      if (!response.ok) {
        throw new Error(result?.message || "Çalışma dönemi oluşturulamadı.");
      }

      const registeredPeriods = sortWorkPeriods(result?.periods || []);
      setPeriods(registeredPeriods);
      setCanCreatePeriod(Boolean(result?.canCreatePeriod));
      redirectToPanel(result?.selectedYear || year);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Çalışma dönemi oluşturulamadı.",
      );
    } finally {
      setIsCreatingPeriod(false);
    }
  }

  async function handleCancelPeriodSelection() {
    await supabaseClient.auth.signOut();
    setStage("credentials");
    setPeriods([]);
    setSelectedYear(null);
    setPassword("");
    setStatusMessage("");
    setErrorMessage("");
  }

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
            href="/on-muhasebe/kayit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-4 text-xs font-black shadow-lg shadow-indigo-950/5 transition hover:-translate-y-0.5 hover:bg-indigo-50 sm:px-5 sm:text-sm"
          >
            <span className="text-[#0b1025]">7 Gün Ücretsiz Dene</span>
          </Link>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 py-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:py-16">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#4f46e5] shadow-lg shadow-indigo-950/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              </span>
              Güvenli işletme paneli
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-[-0.06em] text-[#0b1025] sm:text-5xl lg:text-6xl">
              İşletmeni tek panelden
              <span className="block bg-gradient-to-r from-[#4f46e5] via-[#06b6d4] to-[#22c55e] bg-clip-text text-transparent">
                kolayca yönet.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600">
              Cari, stok, kasa ve tahsilat işlemlerini sade bir ekrandan takip et.
              Panel sadece firmaya kayıtlı çalışma dönemleriyle açılır.
            </p>

            <div className="mt-8 rounded-[2rem] bg-[#0b1025] p-6 text-white shadow-2xl shadow-indigo-950/20">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/35">
                Panelde seni bekleyenler
              </p>

              <ul className="mt-5 space-y-4">
                {[
                  "Cari bakiyelerini ve tahsilatlarını takip edebilirsin",
                  "Stoklarını ve ürün hareketlerini düzenli görebilirsin",
                  "Nakit, banka ve kasa işlemlerini ayrı yönetebilirsin",
                  "Dönem seçimi sadece kayıtlı yıllardan yapılır",
                ].map((item) => (
                  <li key={item} className="flex gap-3 text-sm font-bold leading-6">
                    <span className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#0b1025]">
                      ✓
                    </span>
                    <span className="text-white/78">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="rounded-[2.25rem] bg-white/90 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-7 lg:rounded-[2.75rem] lg:p-8">
            {registerSuccess ? (
              <div className="mb-6 rounded-[1.75rem] bg-emerald-50 p-5">
                <p className="text-sm font-black text-emerald-700">
                  Kayıt başarıyla oluşturuldu.
                </p>

                {companyCode ? (
                  <p className="mt-2 text-sm font-bold leading-6 text-emerald-700/80">
                    Firma kodun: <span className="font-black text-emerald-800">{companyCode}</span>
                  </p>
                ) : null}

                <p className="mt-2 text-sm font-semibold leading-6 text-emerald-700/75">
                  Bu kod, ödeme açıklaması ve destek işlemlerinde firmanı hızlıca bulmamızı sağlar.
                </p>
              </div>
            ) : null}

            <div className="mb-7">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#4f46e5]">
                Panel girişi
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-4xl">
                {stage === "credentials" ? "Paneline giriş yap." : "Çalışma dönemini seç."}
              </h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                {stage === "credentials"
                  ? "Önce e-posta ve şifreni gir. Sonra sadece firmanda kayıtlı dönemler gösterilir."
                  : "Olmayan yıllar listelenmez. Panel seçtiğin kayıtlı dönemin verisiyle açılır."}
              </p>
            </div>

            {stage === "credentials" ? (
              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#0b1025]">
                    E-posta
                  </span>
                  <input
                    type="email"
                    name="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="ornek@mail.com"
                    autoComplete="email"
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#0b1025]">
                    Şifre
                  </span>
                  <input
                    type="password"
                    name="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="Şifreni gir"
                    autoComplete="current-password"
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <div className="rounded-2xl bg-slate-100 px-4 py-3 text-xs font-bold leading-5 text-slate-500">
                  Çalışma yılı burada hazır liste olarak gösterilmez. Girişten sonra sadece firmaya kayıtlı dönemler gelir.
                </div>

                {errorMessage ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {statusMessage ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                    {statusMessage}
                  </div>
                ) : null}

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="group inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#4f46e5] px-8 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0"
                >
                  <span className="text-white">
                    {isSubmitting ? "Dönemler Kontrol Ediliyor..." : "Panele Giriş Yap"}
                  </span>
                  <span className="ml-2 text-white transition group-hover:translate-x-1">→</span>
                </button>

                <p className="text-center text-xs font-bold leading-6 text-slate-500">
                  Hesabın yok mu?{" "}
                  <Link href="/on-muhasebe/kayit" className="font-black text-[#4f46e5] hover:text-[#4338ca]">
                    7 gün ücretsiz başla
                  </Link>
                </p>
              </form>
            ) : (
              <div className="space-y-5">
                {periods.length > 0 ? (
                  <label className="block">
                    <span className="mb-2 block text-sm font-black text-[#0b1025]">
                      Kayıtlı çalışma dönemi
                    </span>
                    <select
                      value={selectedYear ?? ""}
                      onChange={(event) => setSelectedYear(Number(event.target.value))}
                      className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-black text-[#0b1025] outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-100"
                    >
                      {periods.map((period) => (
                        <option key={period.id} value={period.yil}>
                          {period.yil} dönemi {period.durum === "kapali" ? "(Kapalı)" : ""}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs font-bold leading-5 text-slate-500">
                      Sadece Supabase’de kayıtlı dönemler listelenir.
                    </p>
                  </label>
                ) : (
                  <div className="rounded-[1.5rem] bg-amber-50 px-5 py-4 text-sm font-bold leading-6 text-amber-800">
                    Bu firmada kayıtlı çalışma dönemi yok.
                    {canCreatePeriod
                      ? " Yönetici olduğun için ilk dönemi oluşturabilirsin."
                      : " Yönetici dönem oluşturduktan sonra giriş yapabilirsin."}
                  </div>
                )}

                {errorMessage ? (
                  <div className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700">
                    {errorMessage}
                  </div>
                ) : null}

                {statusMessage ? (
                  <div className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-700">
                    {statusMessage}
                  </div>
                ) : null}

                {periods.length > 0 ? (
                  <button
                    type="button"
                    disabled={!selectedYear}
                    onClick={() => selectedYear && redirectToPanel(selectedYear)}
                    className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#4f46e5] px-8 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Seçili Dönemle Panele Gir
                  </button>
                ) : canCreatePeriod ? (
                  <button
                    type="button"
                    disabled={isCreatingPeriod}
                    onClick={handleCreateInitialPeriod}
                    className="inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#4f46e5] px-8 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isCreatingPeriod ? "İlk Dönem Oluşturuluyor..." : `${currentCalendarYear()} İlk Dönemini Oluştur`}
                  </button>
                ) : null}

                <button
                  type="button"
                  onClick={handleCancelPeriodSelection}
                  className="inline-flex min-h-12 w-full items-center justify-center rounded-full bg-slate-100 px-6 text-sm font-black text-slate-600 transition hover:bg-slate-200"
                >
                  Giriş Bilgilerine Dön
                </button>
              </div>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
