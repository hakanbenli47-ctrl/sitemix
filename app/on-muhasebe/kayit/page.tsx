"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type PlanId = "monthly" | "six_month" | "yearly";

const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  period: string;
  total: string;
  saving: string;
  description: string;
  popular?: boolean;
}> = [
  {
    id: "monthly",
    name: "Aylık",
    price: "399 TL",
    period: "/ ay",
    total: "Aylık ödeme",
    saving: "Esnek kullanım",
    description: "İstediğin zaman başla, aylık devam et.",
  },
  {
    id: "six_month",
    name: "6 Aylık",
    price: "359 TL",
    period: "/ ay",
    total: "Toplam 2.154 TL",
    saving: "240 TL kazanç",
    description: "Daha avantajlı kullanım için önerilir.",
    popular: true,
  },
  {
    id: "yearly",
    name: "Yıllık",
    price: "319 TL",
    period: "/ ay",
    total: "Toplam 3.828 TL",
    saving: "960 TL kazanç",
    description: "En yüksek kazanç sağlayan paket.",
  },
];

const sectors = [
  "Berber / Kuaför",
  "Market / Bakkal",
  "Oto Yıkama / Oto Servis",
  "Klinik / Sağlık",
  "Mağaza",
  "Restoran / Kafe",
  "Servis / Teknik Hizmet",
  "İnşaat / Usta Hizmetleri",
  "E-ticaret",
  "Diğer",
];

export default function OnMuhasebeKayitPage() {
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("six_month");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [agreement, setAgreement] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) || plans[1],
    [selectedPlan],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/on-muhasebe/kayit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName,
          phone,
          companyName,
          sector,
          email,
          password,
          plan: selectedPlan,
          agreement,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || "Kayıt oluşturulamadı.");
      }

      setStatusMessage(result.message || "Kayıt başarıyla oluşturuldu.");

      window.location.href = result.redirectTo || "/on-muhasebe/giris";
    } catch (error) {
      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Kayıt sırasında bir hata oluştu.",
      );
    } finally {
      setIsSubmitting(false);
    }
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
            href="/on-muhasebe/giris"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-white px-4 text-xs font-black shadow-lg shadow-indigo-950/5 transition hover:-translate-y-0.5 hover:bg-indigo-50 sm:px-5 sm:text-sm"
          >
            <span className="text-[#0b1025]">Giriş Yap</span>
          </Link>
        </div>

        <div className="relative mx-auto grid max-w-7xl gap-8 py-10 lg:grid-cols-[0.88fr_1.12fr] lg:items-start lg:py-16">
          <div className="lg:sticky lg:top-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#4f46e5] shadow-lg shadow-indigo-950/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              </span>
              7 gün ücretsiz deneme
            </div>

            <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-[-0.06em] text-[#0b1025] sm:text-5xl lg:text-6xl">
              Ön muhasebe hesabını
              <span className="block bg-gradient-to-r from-[#4f46e5] via-[#06b6d4] to-[#22c55e] bg-clip-text text-transparent">
                hemen oluştur.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600">
              Cari hesap, stok, ürün fiyatı, gelir-gider, tahsilat ve kasa
              takibini tek panelden yönetmek için ücretsiz denemeni başlat.
            </p>

            <div className="mt-8 rounded-[2rem] bg-[#0b1025] p-6 text-white shadow-2xl shadow-indigo-950/20">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-white/35">
                Seçilen paket
              </p>

              <div className="mt-4 rounded-[1.5rem] bg-white/10 p-5">
                <p className="text-2xl font-black text-white">
                  {activePlan.name}
                </p>
                <p className="mt-2 text-4xl font-black tracking-[-0.06em] text-white">
                  {activePlan.price}
                  <span className="ml-1 text-sm font-black text-white/45">
                    {activePlan.period}
                  </span>
                </p>
                <p className="mt-3 text-sm font-bold text-white/65">
                  {activePlan.total} — {activePlan.saving}
                </p>
              </div>

              <ul className="mt-5 space-y-4">
                {[
                  "Cari, stok, gelir-gider ve kasa takibi",
                  "Tek tıkla cari ve stok ekleme altyapısı",
                  "7 gün ücretsiz kullanım",
                  "Mobil ve masaüstü uyumlu panel",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm font-bold leading-6"
                  >
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
            <div className="mb-7">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#4f46e5]">
                Kayıt formu
              </p>
              <h2 className="mt-3 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-4xl">
                Ücretsiz denemeni başlat.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                Bilgilerini doldur. Hesap, işletme ve 7 günlük deneme kaydı
                Supabase üzerinde oluşturulacak.
              </p>
            </div>

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#0b1025]">
                    Ad Soyad
                  </span>
                  <input
                    type="text"
                    name="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    placeholder="işletme saihbi adı"
                    autoComplete="name"
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#0b1025]">
                    Telefon
                  </span>
                  <input
                    type="tel"
                    name="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder="05xx xxx xx xx"
                    autoComplete="tel"
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#0b1025]">
                    İşletme Adı
                  </span>
                  <input
                    type="text"
                    name="companyName"
                    value={companyName}
                    onChange={(event) => setCompanyName(event.target.value)}
                    placeholder="Örn: Sitemix Dijital"
                    autoComplete="organization"
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>

                <label className="block">
                  <span className="mb-2 block text-sm font-black text-[#0b1025]">
                    Sektör
                  </span>
                  <select
                    name="sector"
                    value={sector}
                    onChange={(event) => setSector(event.target.value)}
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  >
                    <option value="">Sektör seç</option>
                    {sectors.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
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
                    placeholder="En az 6 karakter"
                    autoComplete="new-password"
                    className="h-14 w-full rounded-2xl bg-slate-100 px-4 text-sm font-bold text-[#0b1025] outline-none transition placeholder:text-slate-400 focus:bg-white focus:ring-4 focus:ring-indigo-100"
                  />
                </label>
              </div>

              <div>
                <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                  <div>
                    <span className="block text-sm font-black text-[#0b1025]">
                      Paket Seçimi
                    </span>
                    <span className="mt-1 block text-xs font-bold text-slate-500">
                      Seçtiğin paket 7 gün ücretsiz denemeden sonra geçerli
                      olur.
                    </span>
                  </div>

                  <span className="mt-2 w-fit rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-700 sm:mt-0">
                    İlk 7 gün ücretsiz
                  </span>
                </div>

                <div className="grid gap-3 lg:grid-cols-3">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        onClick={() => setSelectedPlan(plan.id)}
                        className={[
                          "relative min-h-full cursor-pointer overflow-hidden rounded-[1.75rem] p-5 text-left shadow-sm transition duration-300 hover:-translate-y-1",
                          isSelected
                            ? "bg-indigo-50 ring-4 ring-indigo-200 shadow-xl shadow-indigo-950/10"
                            : "bg-slate-100 hover:bg-indigo-50/70",
                        ].join(" ")}
                      >
                        {plan.popular ? (
                          <span className="absolute right-4 top-4 rounded-full bg-[#4f46e5] px-3 py-1 text-[10px] font-black uppercase tracking-[0.12em] text-white">
                            Önerilen
                          </span>
                        ) : null}

                        <span
                          className={[
                            "mb-5 flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-sm ring-1",
                            isSelected ? "ring-[#4f46e5]" : "ring-slate-200",
                          ].join(" ")}
                        >
                          <span
                            className={[
                              "h-3 w-3 rounded-full",
                              isSelected ? "bg-[#4f46e5]" : "bg-slate-300",
                            ].join(" ")}
                          />
                        </span>

                        <span className="block pr-20 text-lg font-black tracking-[-0.04em] text-[#0b1025]">
                          {plan.name}
                        </span>

                        <span className="mt-4 flex items-end gap-1">
                          <span className="text-3xl font-black tracking-[-0.06em] text-[#0b1025]">
                            {plan.price}
                          </span>
                          <span className="pb-1 text-xs font-black text-slate-500">
                            {plan.period}
                          </span>
                        </span>

                        <span className="mt-2 block text-xs font-bold text-slate-500">
                          {plan.total}
                        </span>

                        <span className="mt-3 block text-sm font-bold leading-6 text-slate-600">
                          {plan.description}
                        </span>

                        <span className="mt-4 inline-flex rounded-full bg-white px-3 py-1 text-xs font-black text-[#4f46e5] shadow-sm">
                          {plan.saving}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <label className="flex gap-3 rounded-[1.75rem] bg-slate-100 p-4">
                <input
                  type="checkbox"
                  name="agreement"
                  checked={agreement}
                  onChange={(event) => setAgreement(event.target.checked)}
                  className="mt-1 h-5 w-5 shrink-0 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]"
                />
                <span className="text-sm font-semibold leading-6 text-slate-600">
                  7 gün ücretsiz deneme başlatmak istediğimi ve devamında
                  seçtiğim paket üzerinden kullanım yapabileceğimi kabul
                  ediyorum.
                </span>
              </label>

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
                  {isSubmitting
                    ? "Kayıt Oluşturuluyor..."
                    : "Kayıt Ol ve 7 Gün Ücretsiz Başla"}
                </span>
                <span className="ml-2 text-white transition group-hover:translate-x-1">
                  →
                </span>
              </button>

              <p className="text-center text-xs font-bold leading-6 text-slate-500">
                Zaten hesabın var mı?{" "}
                <Link
                  href="/on-muhasebe/giris"
                  className="font-black text-[#4f46e5] hover:text-[#4338ca]"
                >
                  Giriş yap
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}