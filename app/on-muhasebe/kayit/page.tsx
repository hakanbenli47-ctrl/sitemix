"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";

type PlanId = "monthly" | "six_month" | "yearly";

const plans: Array<{
  id: PlanId;
  name: string;
  shortName: string;
  price: string;
  period: string;
  total: string;
  saving: string;
  description: string;
  popular?: boolean;
}> = [
  {
    id: "monthly",
    name: "Aylık Paket",
    shortName: "Aylık",
    price: "399 TL",
    period: "/ ay",
    total: "Aylık ödeme",
    saving: "Esnek kullanım",
    description: "Aylık kullan, istediğin zaman paketini değiştir.",
  },
  {
    id: "six_month",
    name: "6 Aylık Paket",
    shortName: "6 Aylık",
    price: "359 TL",
    period: "/ ay",
    total: "Toplam 2.154 TL",
    saving: "240 TL avantaj",
    description: "Daha avantajlı kullanım isteyen işletmeler için.",
    popular: true,
  },
  {
    id: "yearly",
    name: "Yıllık Paket",
    shortName: "Yıllık",
    price: "319 TL",
    period: "/ ay",
    total: "Toplam 3.828 TL",
    saving: "960 TL avantaj",
    description: "En düşük aylık fiyatı sunan paket.",
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
  const [selectedPlan, setSelectedPlan] = useState<PlanId>("monthly");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [sector, setSector] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [agreement, setAgreement] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const activePlan = useMemo(
    () => plans.find((plan) => plan.id === selectedPlan) || plans[0],
    [selectedPlan],
  );

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setStatusMessage("");
    setErrorMessage("");

    if (
      !fullName.trim() ||
      !phone.trim() ||
      !companyName.trim() ||
      !sector ||
      !email.trim() ||
      !password
    ) {
      setErrorMessage("Lütfen tüm alanları eksiksiz doldurun.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Şifreniz en az 6 karakter olmalıdır.");
      return;
    }

    if (!agreement) {
      setErrorMessage(
        "Ücretsiz denemeyi başlatmak için kullanım koşullarını kabul etmelisiniz.",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch("/api/on-muhasebe/kayit", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          fullName: fullName.trim(),
          phone: phone.trim(),
          companyName: companyName.trim(),
          sector,
          email: email.trim().toLowerCase(),
          password,
          plan: selectedPlan,
          agreement,
        }),
      });

      const result = await response.json().catch(() => ({}));

      if (!response.ok) {
        throw new Error(result.message || "Kayıt oluşturulamadı.");
      }

      setStatusMessage(
        result.message || "Hesabınız başarıyla oluşturuldu.",
      );

      window.location.href =
        result.redirectTo || "/on-muhasebe/giris";
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

  const inputClassName =
    "h-14 w-full rounded-2xl border border-transparent bg-slate-100 px-4 text-base font-bold text-[#0b1025] outline-none transition placeholder:font-semibold placeholder:text-slate-400 focus:border-indigo-200 focus:bg-white focus:ring-4 focus:ring-indigo-100";

  return (
    <main className="min-h-screen overflow-hidden bg-[#f3f5ff] text-[#0b1025]">
      <section className="relative px-4 pb-10 pt-4 sm:px-6 sm:pt-6 lg:px-8">
        <div className="pointer-events-none absolute left-[-160px] top-10 h-80 w-80 rounded-full bg-indigo-400/20 blur-3xl" />
        <div className="pointer-events-none absolute right-[-160px] top-60 h-80 w-80 rounded-full bg-cyan-400/20 blur-3xl" />

        <header className="relative mx-auto flex max-w-7xl items-center justify-between">
          <Link href="/on-muhasebe" className="flex items-center gap-3">
            <span className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-xl text-sm font-black text-white shadow-lg shadow-indigo-900/20 sm:h-11 sm:w-11 sm:rounded-2xl">
              <span className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#06b6d4] to-[#22c55e]" />
              <span className="relative">S</span>
            </span>

            <span className="leading-tight">
              <span className="block text-sm font-black tracking-[-0.03em] sm:text-base">
                Sitemix
              </span>
              <span className="block text-[11px] font-extrabold text-slate-500 sm:text-xs">
                Ön Muhasebe
              </span>
            </span>
          </Link>

          <Link
            href="/on-muhasebe/giris"
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-white px-4 text-xs font-black shadow-lg shadow-indigo-950/5 transition hover:bg-indigo-50 sm:min-h-11 sm:px-5 sm:text-sm"
          >
            Giriş Yap
          </Link>
        </header>

        <div className="relative mx-auto grid max-w-7xl gap-8 py-6 lg:grid-cols-[0.82fr_1.18fr] lg:items-start lg:py-14">
          <aside className="hidden lg:sticky lg:top-8 lg:block">
            <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-[#4f46e5] shadow-lg shadow-indigo-950/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
              </span>
              7 gün ücretsiz kullan
            </div>

            <h1 className="mt-6 max-w-xl text-5xl font-black tracking-[-0.06em] lg:text-6xl">
              İşletmeni tek panelden
              <span className="block bg-gradient-to-r from-[#4f46e5] via-[#06b6d4] to-[#22c55e] bg-clip-text text-transparent">
                kolayca yönet.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base font-semibold leading-8 text-slate-600">
              Cari, stok, kasa, gelir-gider ve tahsilat işlemlerini karmaşık
              programlarla uğraşmadan takip et.
            </p>

            <div className="mt-8 rounded-[2rem] bg-[#0b1025] p-6 text-white shadow-2xl shadow-indigo-950/20">
              <p className="text-xs font-black uppercase tracking-[0.22em] text-white/40">
                Seçilen paket
              </p>

              <div className="mt-4 border-b border-white/10 pb-5">
                <p className="text-2xl font-black">{activePlan.name}</p>

                <p className="mt-2 text-4xl font-black tracking-[-0.06em]">
                  {activePlan.price}
                  <span className="ml-1 text-sm text-white/50">
                    {activePlan.period}
                  </span>
                </p>

                <p className="mt-3 text-sm font-bold text-white/65">
                  {activePlan.total} · {activePlan.saving}
                </p>
              </div>

              <ul className="mt-5 space-y-4">
                {[
                  "Cari, stok, kasa ve gelir-gider takibi",
                  "Fatura ve fiş işlemleri",
                  "Hazır PDF çıktıları",
                  "Mobil ve masaüstü kullanım",
                  "7 gün ücretsiz deneme",
                ].map((item) => (
                  <li
                    key={item}
                    className="flex gap-3 text-sm font-bold leading-6"
                  >
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[10px] font-black text-[#0b1025]">
                      ✓
                    </span>
                    <span className="text-white/80">{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="rounded-[1.75rem] bg-white/95 p-5 shadow-2xl shadow-indigo-950/10 backdrop-blur-xl sm:p-7 lg:rounded-[2.75rem] lg:p-8">
            <div className="lg:hidden">
              <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-2 text-[11px] font-black text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                7 gün ücretsiz deneme
              </div>

              <h1 className="mt-4 text-[2rem] font-black leading-[1.05] tracking-[-0.055em]">
                Ön muhasebe hesabını hemen oluştur.
              </h1>

              <p className="mt-3 text-sm font-semibold leading-6 text-slate-600">
                İşletmeni cep telefonundan kolayca yönetmeye başla.
              </p>

              <div className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-[11px] font-black text-slate-500">
                <span>✓ Kart bilgisi gerekmez</span>
                <span>✓ Mobil uyumlu</span>
                <span>✓ 7 gün ücretsiz</span>
              </div>
            </div>

            <div className="mb-7 hidden lg:block">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-[#4f46e5]">
                Ücretsiz hesap oluştur
              </p>

              <h2 className="mt-3 text-4xl font-black tracking-[-0.05em]">
                Birkaç adımda başlayın.
              </h2>

              <p className="mt-3 text-sm font-semibold leading-7 text-slate-500">
                İşletme bilgilerinizi girin, hesabınız hemen oluşturulsun.
              </p>
            </div>

            <form className="mt-7 space-y-6 lg:mt-0" onSubmit={handleSubmit}>
              <div>
                <div className="mb-4 flex items-center justify-between">
                  <div>
                    <span className="block text-sm font-black">
                      Paket tercihin
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-slate-500">
                      Paketini daha sonra değiştirebilirsin.
                    </span>
                  </div>

                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black text-emerald-700 sm:text-xs">
                    7 gün ücretsiz
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 sm:gap-3">
                  {plans.map((plan) => {
                    const isSelected = selectedPlan === plan.id;

                    return (
                      <button
                        key={plan.id}
                        type="button"
                        aria-pressed={isSelected}
                        onClick={() => setSelectedPlan(plan.id)}
                        className={[
                          "relative min-h-[88px] rounded-2xl px-2 py-3 text-center transition sm:min-h-[100px] sm:px-4",
                          isSelected
                            ? "bg-indigo-50 ring-2 ring-[#4f46e5]"
                            : "bg-slate-100 ring-1 ring-transparent hover:bg-indigo-50",
                        ].join(" ")}
                      >
                        {plan.popular ? (
                          <span className="absolute -top-2 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#4f46e5] px-2 py-0.5 text-[8px] font-black uppercase tracking-wide text-white sm:text-[9px]">
                            Önerilen
                          </span>
                        ) : null}

                        <span className="block text-xs font-black sm:text-sm">
                          {plan.shortName}
                        </span>

                        <span className="mt-2 block text-sm font-black tracking-[-0.03em] sm:text-lg">
                          {plan.price}
                        </span>

                        <span className="block text-[9px] font-bold text-slate-500 sm:text-[10px]">
                          aylık
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="mt-3 flex items-center justify-between rounded-2xl bg-indigo-50 px-4 py-3">
                  <div>
                    <p className="text-xs font-black text-[#4f46e5]">
                      {activePlan.name}
                    </p>
                    <p className="mt-1 text-[11px] font-bold text-slate-500">
                      {activePlan.total}
                    </p>
                  </div>

                  <span className="rounded-full bg-white px-3 py-1 text-[10px] font-black text-[#4f46e5] shadow-sm sm:text-xs">
                    {activePlan.saving}
                  </span>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="mb-4 text-sm font-black">
                  İşletme bilgilerin
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black">
                      Ad Soyad
                    </span>
                    <input
                      required
                      type="text"
                      name="fullName"
                      value={fullName}
                      onChange={(event) => setFullName(event.target.value)}
                      placeholder="İşletme sahibi adı"
                      autoComplete="name"
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black">
                      Telefon
                    </span>
                    <input
                      required
                      type="tel"
                      name="phone"
                      value={phone}
                      onChange={(event) => setPhone(event.target.value)}
                      placeholder="05xx xxx xx xx"
                      autoComplete="tel"
                      inputMode="tel"
                      className={inputClassName}
                    />
                  </label>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black">
                      İşletme Adı
                    </span>
                    <input
                      required
                      type="text"
                      name="companyName"
                      value={companyName}
                      onChange={(event) => setCompanyName(event.target.value)}
                      placeholder="Örn: Yıldız Market"
                      autoComplete="organization"
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black">
                      Sektör
                    </span>
                    <select
                      required
                      name="sector"
                      value={sector}
                      onChange={(event) => setSector(event.target.value)}
                      className={inputClassName}
                    >
                      <option value="">Sektörünü seç</option>

                      {sectors.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
              </div>

              <div className="border-t border-slate-100 pt-6">
                <p className="mb-4 text-sm font-black">
                  Giriş bilgilerin
                </p>

                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="block">
                    <span className="mb-2 block text-sm font-black">
                      E-posta
                    </span>
                    <input
                      required
                      type="email"
                      name="email"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      placeholder="ornek@mail.com"
                      autoComplete="email"
                      inputMode="email"
                      className={inputClassName}
                    />
                  </label>

                  <label className="block">
                    <span className="mb-2 block text-sm font-black">
                      Şifre
                    </span>

                    <span className="relative block">
                      <input
                        required
                        minLength={6}
                        type={showPassword ? "text" : "password"}
                        name="password"
                        value={password}
                        onChange={(event) => setPassword(event.target.value)}
                        placeholder="En az 6 karakter"
                        autoComplete="new-password"
                        className={`${inputClassName} pr-16`}
                      />

                      <button
                        type="button"
                        onClick={() => setShowPassword((current) => !current)}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-black text-[#4f46e5]"
                      >
                        {showPassword ? "Gizle" : "Göster"}
                      </button>
                    </span>
                  </label>
                </div>
              </div>

              <label className="flex cursor-pointer gap-3 rounded-2xl bg-slate-100 p-4">
                <input
                  required
                  type="checkbox"
                  name="agreement"
                  checked={agreement}
                  onChange={(event) => setAgreement(event.target.checked)}
                  className="mt-0.5 h-5 w-5 shrink-0 rounded border-slate-300 text-[#4f46e5] focus:ring-[#4f46e5]"
                />

                <span className="text-xs font-semibold leading-5 text-slate-600 sm:text-sm sm:leading-6">
                  7 günlük ücretsiz denemeyi başlatmak istiyorum. Deneme
                  sonunda otomatik ödeme alınmayacağını ve devam etmek için
                  paket satın almam gerektiğini biliyorum.
                </span>
              </label>

              {errorMessage ? (
                <div
                  role="alert"
                  className="rounded-2xl bg-red-50 px-4 py-3 text-sm font-bold leading-6 text-red-700"
                >
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
                className="group inline-flex min-h-[60px] w-full items-center justify-center rounded-full bg-[#4f46e5] px-6 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:-translate-y-0.5 hover:bg-[#4338ca] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0 sm:text-base"
              >
                <span>
                  {isSubmitting
                    ? "Hesabın Oluşturuluyor..."
                    : "Ücretsiz Hesabımı Oluştur"}
                </span>

                {!isSubmitting ? (
                  <span className="ml-2 transition group-hover:translate-x-1">
                    →
                  </span>
                ) : null}
              </button>

              <div className="text-center">
                <p className="text-[11px] font-bold leading-5 text-slate-400">
                  Kayıt sırasında ödeme veya kart bilgisi istenmez.
                </p>

                <p className="mt-3 text-xs font-bold text-slate-500">
                  Zaten hesabın var mı?{" "}
                  <Link
                    href="/on-muhasebe/giris"
                    className="font-black text-[#4f46e5] hover:text-[#4338ca]"
                  >
                    Giriş yap
                  </Link>
                </p>
              </div>

              <div className="border-t border-slate-100 pt-5 lg:hidden">
                <p className="text-sm font-black">
                  Hesabına dahil olanlar
                </p>

                <div className="mt-3 grid gap-2 text-xs font-bold leading-5 text-slate-600">
                  <span>✓ Cari ve müşteri takibi</span>
                  <span>✓ Stok ve ürün yönetimi</span>
                  <span>✓ Kasa ve gelir-gider takibi</span>
                  <span>✓ Mobil ve masaüstü kullanım</span>
                </div>
              </div>
            </form>
          </div>
        </div>
      </section>
    </main>
  );
}