"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { supabaseClient } from "@/lib/supabaseClient";
import { sectorCatalog } from "@/lib/sitemixStudio";

const suggestions = [
  "Ankara’da modern bir kadın kuaförü sitesi oluştur",
  "Halı yıkama işletmem için WhatsApp odaklı site hazırla",
  "Berberim için fiyat listeli, koyu renkli bir site yap",
];

const typingExamples = [
  "Kadıköy'deki berberim için koyu, premium ve randevu odaklı bir site kur...",
  "Halı yıkama işletmem için güven veren, hızlı teklif toplayan bir site hazırla...",
  "Güzellik salonum için zarif, hareketli ve WhatsApp odaklı bir site oluştur...",
  "Emlak ofisim için portföyleri öne çıkaran çok sayfalı bir site tasarla...",
];

const featureCards = [
  ["01", "İşletmeni anlat", "Form doldurmak yerine doğal biçimde neye ihtiyacın olduğunu yaz."],
  ["02", "Siteni canlı gör", "SiteMix sektörüne uygun sayfaları, metinleri ve görünümü saniyeler içinde kursun."],
  ["03", "İstediğin gibi değiştir", "Renkleri, bölümleri, hizmetleri ve sayfa yapısını sohbet ederek düzenle."],
  ["04", "Yayınla veya bize bırak", "Aylık yönetimle kendin devam et ya da yıllık kurulum için SiteMix’e aktar."],
];

export default function SitemixLanding() {
  const [prompt, setPrompt] = useState("");
  const [showAuth, setShowAuth] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState("");
  const [signedIn, setSignedIn] = useState(false);
  const [typingIndex, setTypingIndex] = useState(0);
  const [typedExample, setTypedExample] = useState("");
  const [typingDeleting, setTypingDeleting] = useState(false);

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!showAuth) return;

    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !authBusy) setShowAuth(false);
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [showAuth, authBusy]);

  useEffect(() => {
    const fullText = typingExamples[typingIndex];
    let delay = typingDeleting ? 18 : 42;

    if (!typingDeleting && typedExample === fullText) delay = 1650;
    if (typingDeleting && typedExample === "") delay = 260;

    const timer = window.setTimeout(() => {
      if (!typingDeleting && typedExample === fullText) {
        setTypingDeleting(true);
      } else if (typingDeleting && typedExample === "") {
        setTypingDeleting(false);
        setTypingIndex((current) => (current + 1) % typingExamples.length);
      } else {
        setTypedExample((current) => typingDeleting ? current.slice(0, -1) : fullText.slice(0, current.length + 1));
      }
    }, delay);

    return () => window.clearTimeout(timer);
  }, [typedExample, typingDeleting, typingIndex]);

  function startWithPrompt(value: string) {
    const cleanPrompt = value.trim();
    if (!cleanPrompt) return;
    window.sessionStorage.setItem("sitemix_pending_prompt", cleanPrompt);
    window.localStorage.setItem("sitemix_pending_prompt_backup", cleanPrompt);

    if (signedIn) {
      window.location.href = "/studio";
      return;
    }

    setShowAuth(true);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    startWithPrompt(prompt);
  }

  async function continueWithGoogle() {
    setAuthBusy(true);
    setAuthError("");
    const { error } = await supabaseClient.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/studio?auth=google`,
        queryParams: { prompt: "select_account" },
      },
    });

    if (error) {
      setAuthError("Google bağlantısı başlatılamadı. Biraz sonra tekrar dene.");
      setAuthBusy(false);
    }
  }

  return (
    <main className="sitemix-landing min-h-screen overflow-hidden bg-[#070811] text-white">
      <div className="aurora aurora-one" />
      <div className="aurora aurora-two" />
      <div className="aurora aurora-three" />

      <header className="fixed inset-x-0 top-0 z-40 border-b border-white/8 bg-[#070811]/65 backdrop-blur-2xl">
        <div className="mx-auto flex h-[72px] max-w-[1440px] items-center justify-between px-4 sm:px-7 lg:px-10">
          <Link href="/" className="flex items-center gap-3" aria-label="SiteMix ana sayfa">
            <span className="brand-orb"><span>S</span></span>
            <span>
              <span className="block text-[17px] font-black tracking-[-0.04em]">SiteMix</span>
              <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-white/38">Studio</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 text-sm font-bold text-white/58 lg:flex">
            <a href="#nasil">Nasıl çalışır?</a>
            <a href="#sektorler">Sektörler</a>
            <a href="#yonetim">Yönetim</a>
            <a href="#sss">SSS</a>
          </nav>

          <div className="flex items-center gap-2">
            <Link href="/on-muhasebe" className="hidden rounded-full px-4 py-2.5 text-xs font-black text-white/55 transition hover:bg-white/8 hover:text-white sm:inline-flex">
              Ön Muhasebe
            </Link>
            <Link href={signedIn ? "/panel" : "/studio"} className="rounded-full border border-white/12 bg-white/8 px-4 py-2.5 text-xs font-black transition hover:bg-white/14 sm:px-5">
              {signedIn ? "Projelerim" : "Giriş yap"}
            </Link>
          </div>
        </div>
      </header>

      <section className="relative z-10 mx-auto flex min-h-[100svh] max-w-[1440px] flex-col items-center justify-center px-4 pb-16 pt-28 sm:px-7 lg:px-10">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="mb-6 flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-xs font-bold text-white/62 backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-[#7dffcf] shadow-[0_0_18px_#7dffcf]" />
          Fikrini yaz, ilk taslağın dakikalar içinde hazır olsun
        </motion.div>

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-5xl text-center text-[clamp(3.2rem,9vw,8rem)] font-black leading-[0.88] tracking-[-0.085em]">
          <span className="block">Söyle.</span>
          <motion.span animate={{ y: [0, -5, 0], rotate: [-.4, .35, -.4] }} transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }} className="premium-title-shape hero-gradient mt-2 inline-block">Siten olsun.</motion.span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="mt-7 max-w-2xl text-center text-base font-medium leading-7 text-white/52 sm:text-lg sm:leading-8">
          İşletmeni birkaç cümleyle anlat. SiteMix sektörüne uygun yapıyı kurar, sen canlı ön izlemede istediğin gibi değiştirirsin.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.97, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.22, type: "spring", stiffness: 130 }} className="relative mt-10 w-full max-w-4xl">
          <div className="prompt-glow" />
          <form onSubmit={handleSubmit} className="prompt-shell premium-prompt relative overflow-hidden rounded-[28px] border border-white/12 bg-[#11121d]/88 p-3 shadow-[0_40px_130px_rgba(0,0,0,.62)] backdrop-blur-2xl sm:rounded-[36px] sm:p-4">
            <div className="flex items-center justify-between border-b border-white/7 px-3 pb-3 sm:px-5"><span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[.17em] text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-[#82f0cd] shadow-[0_0_12px_#82f0cd]" />Site fikrini anlat</span><span className="rounded-full border border-white/8 bg-white/[0.035] px-3 py-1.5 text-[9px] font-black text-white/25">Adım 1 / Sohbet</span></div>
            <div className="relative min-h-[132px] sm:min-h-[148px]">
              {!prompt ? <div aria-hidden="true" className="pointer-events-none absolute inset-0 px-3 py-5 text-base font-semibold leading-7 text-white/30 sm:px-5 sm:text-lg"><span className="text-white/18">Örn. </span>{typedExample}<span className="ml-0.5 inline-block h-5 w-px animate-pulse bg-[#9c8bff] align-middle" /></div> : null}
              <textarea
                value={prompt}
                onChange={(event) => setPrompt(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && !event.shiftKey) {
                    event.preventDefault();
                    startWithPrompt(prompt);
                  }
                }}
                rows={4}
                maxLength={1200}
                placeholder=""
                aria-label="Oluşturmak istediğiniz siteyi anlatın"
                className="relative z-10 min-h-[132px] w-full resize-none bg-transparent px-3 py-5 text-base font-semibold leading-7 text-white outline-none sm:min-h-[148px] sm:px-5 sm:text-lg"
              />
            </div>
            <div className="flex items-center justify-between gap-3 border-t border-white/8 px-1 pt-3 sm:px-3">
              <span className="hidden items-center gap-3 text-[10px] font-bold text-white/28 sm:flex"><span>Enter ile gönder</span><span className="h-1 w-1 rounded-full bg-white/15" /><span>Mesajın girişten sonra korunur</span></span>
              <span className="text-xs font-bold text-white/28 sm:hidden">İşletmeni anlat</span>
              <button type="submit" disabled={!prompt.trim()} className="send-button group flex min-h-12 items-center gap-3 rounded-full px-5 text-sm font-black text-[#0a0b13] disabled:cursor-not-allowed disabled:opacity-35 sm:px-7">
                Oluşturmaya başla
                <span className="grid h-7 w-7 place-items-center rounded-full bg-black/10 transition group-hover:translate-x-1">↗</span>
              </button>
            </div>
          </form>
        </motion.div>

        <div className="mt-5 flex max-w-4xl flex-wrap justify-center gap-2">
          {suggestions.map((item) => (
            <button key={item} type="button" onClick={() => { setPrompt(item); startWithPrompt(item); }} className="rounded-full border border-white/8 bg-white/[0.035] px-4 py-2.5 text-left text-[11px] font-bold text-white/45 transition hover:border-white/18 hover:bg-white/8 hover:text-white/80 sm:text-xs">
              {item}
            </button>
          ))}
        </div>

        <div className="mt-10 flex items-center gap-6 text-[11px] font-black uppercase tracking-[0.16em] text-white/28">
          <span>Mobil uyumlu</span><span className="h-1 w-1 rounded-full bg-white/20" /><span>Canlı ön izleme</span><span className="hidden h-1 w-1 rounded-full bg-white/20 sm:block" /><span className="hidden sm:block">Domain paneli</span>
        </div>
      </section>

      <section id="nasil" className="relative z-10 border-y border-white/7 bg-white/[0.025] px-4 py-24 sm:px-7 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <p className="section-kicker">Bir fikirden çalışan siteye</p>
          <div className="mt-4 grid gap-8 lg:grid-cols-[1fr_.8fr] lg:items-end">
            <h2 className="max-w-4xl text-4xl font-black leading-[1.02] tracking-[-0.06em] sm:text-6xl">Uzun formlar yok. Ne istediğini söylemen yeterli.</h2>
            <p className="max-w-xl text-base font-medium leading-8 text-white/48 lg:justify-self-end">SiteMix doğru soruları sırayla sorar, işletmene uygun sayfaları önerir ve kararlarını anında canlı ön izlemeye taşır.</p>
          </div>
          <div className="mt-14 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(([number, title, text]) => (
              <article key={number} className="group rounded-[26px] border border-white/8 bg-white/[0.035] p-6 transition hover:-translate-y-1 hover:border-white/15 hover:bg-white/[0.06]">
                <span className="text-xs font-black tracking-[0.2em] text-[#90f4d3]">{number}</span>
                <h3 className="mt-12 text-2xl font-black tracking-[-0.04em]">{title}</h3>
                <p className="mt-4 text-sm font-medium leading-7 text-white/45">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="sektorler" className="relative z-10 px-4 py-24 sm:px-7 lg:px-10 lg:py-32">
        <div className="mx-auto max-w-[1320px]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div><p className="section-kicker">Sektörünü tanıyan yapı</p><h2 className="mt-4 max-w-3xl text-4xl font-black tracking-[-0.06em] sm:text-6xl">Her işletme aynı siteye ihtiyaç duymaz.</h2></div>
            <p className="max-w-lg text-sm font-medium leading-7 text-white/45">Sektörün listede yoksa isteğin doğrudan SiteMix ekibine aktarılır; talebin hiçbir zaman yarıda kalmaz.</p>
          </div>
          <div className="mt-12 flex flex-wrap gap-3">
            {sectorCatalog.map((sector, index) => (
              <button key={sector.id} type="button" onClick={() => { const value = `${sector.label} işletmem için modern, mobil uyumlu bir site oluştur`; setPrompt(value); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="sector-pill" style={{ animationDelay: `${index * 50}ms` }}>
                <span className="sector-dot" />{sector.label}<span className="text-white/20">↗</span>
              </button>
            ))}
            <button type="button" onClick={() => { setPrompt("Sektörüm listede yok. Şu işletme için özel bir site istiyorum: "); window.scrollTo({ top: 0, behavior: "smooth" }); }} className="sector-pill border-dashed text-[#b9a9ff]">+ Başka bir sektör</button>
          </div>
        </div>
      </section>

      <section id="yonetim" className="relative z-10 px-4 pb-24 sm:px-7 lg:px-10 lg:pb-32">
        <div className="mx-auto grid max-w-[1320px] overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#171827] to-[#0d0e17] lg:grid-cols-2 lg:rounded-[44px]">
          <div className="p-7 sm:p-10 lg:p-14">
            <p className="section-kicker">Önce siteni gör</p>
            <h2 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Kararını tasarımı gördükten sonra ver.</h2>
            <p className="mt-5 max-w-xl text-sm font-medium leading-7 text-white/48">Site hazır olduğunda kendin yönetebilir veya kurulumu ve güncellemeleri bize bırakabilirsin.</p>
          </div>
          <div className="grid gap-px bg-white/8 sm:grid-cols-2">
            <div className="bg-[#11121d] p-7 sm:p-9"><span className="plan-badge">Aylık</span><h3 className="mt-8 text-2xl font-black">Kendim yöneteyim</h3><p className="mt-3 text-sm leading-7 text-white/45">İçerik, hizmet, fiyat, görsel ve domain kontrolü kendi panelinde.</p></div>
            <div className="bg-[#11121d] p-7 sm:p-9"><span className="plan-badge plan-badge-alt">Yıllık / Özel</span><h3 className="mt-8 text-2xl font-black">SiteMix kursun</h3><p className="mt-3 text-sm leading-7 text-white/45">Projen bütün ayrıntılarıyla WhatsApp üzerinden ekibimize aktarılsın.</p></div>
          </div>
        </div>
      </section>

      <section id="sss" className="relative z-10 border-t border-white/7 px-4 py-24 sm:px-7 lg:px-10">
        <div className="mx-auto max-w-4xl"><p className="section-kicker">Kısa cevaplar</p><h2 className="mt-4 text-4xl font-black tracking-[-0.055em] sm:text-5xl">Merak edilenler</h2>
          <div className="mt-10 divide-y divide-white/8 border-y border-white/8">
            {[
              ["İlk mesajdan önce giriş yapmak gerekir mi?", "Hayır. Ana sayfayı inceleyebilirsin. İlk mesajını gönderdiğin anda Google ile giriş istenir ve mesajın kaybolmadan oluşturma başlar."],
              ["Mobil telefondan düzenleme yapabilir miyim?", "Evet. Sohbet, ön izleme, içerik düzenleme, ödeme ve domain ekranlarının tamamı mobil kullanım için tasarlanır."],
              ["Kendi domainimi bağlayabilir miyim?", "Evet. Mevcut domainini ücretsiz kontrol panelinden ekleyebilir, gerekli DNS kayıtlarını ve bağlantı durumunu görebilirsin."],
              ["Sektörüm listede yoksa ne olur?", "İhtiyaçların toplanır ve proje özeti SiteMix ekibine WhatsApp üzerinden aktarılır."],
            ].map(([q, a]) => <details key={q} className="group py-6"><summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-lg font-black"><span>{q}</span><span className="text-[#90f4d3] transition group-open:rotate-45">+</span></summary><p className="mt-4 max-w-3xl pr-8 text-sm font-medium leading-7 text-white/45">{a}</p></details>)}
          </div>
        </div>
      </section>

      <footer className="relative z-10 border-t border-white/8 px-4 py-8 text-xs font-bold text-white/36 sm:px-7 lg:px-10"><div className="mx-auto flex max-w-[1320px] flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><span>© {new Date().getFullYear()} SiteMix Studio</span><div className="flex gap-5"><Link href="/on-muhasebe">Ön Muhasebe</Link><a href="https://wa.me/905515550302" target="_blank" rel="noreferrer">WhatsApp</a></div></div></footer>

      <AnimatePresence>
        {showAuth ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onMouseDown={(event) => {
              if (event.target === event.currentTarget && !authBusy) setShowAuth(false);
            }}
            className="fixed inset-0 z-[100] flex items-end justify-center overflow-y-auto bg-[#04050a]/84 p-0 backdrop-blur-2xl sm:items-center sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sitemix-auth-title"
          >
            <motion.div
              initial={{ y: 42, opacity: 0, scale: 0.975 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: 24, opacity: 0, scale: 0.985 }}
              transition={{ type: "spring", stiffness: 220, damping: 25 }}
              className="relative grid w-full max-w-[980px] overflow-hidden rounded-t-[34px] border border-white/12 bg-[#11121b] shadow-[0_40px_160px_rgba(0,0,0,.75)] sm:rounded-[38px] lg:grid-cols-[.9fr_1.1fr]"
            >
              <aside className="relative hidden min-h-[650px] overflow-hidden border-r border-white/8 bg-[#0b0c14] p-10 lg:flex lg:flex-col">
                <div className="absolute -left-28 -top-32 h-96 w-96 rounded-full bg-[#7c5cff]/30 blur-[95px]" />
                <div className="absolute -bottom-28 -right-32 h-96 w-96 rounded-full bg-[#35e8ad]/20 blur-[100px]" />
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,.035)_1px,transparent_1px)] bg-[size:42px_42px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />

                <div className="relative flex items-center gap-3">
                  <span className="brand-orb"><span>S</span></span>
                  <div><strong className="block text-base font-black">SiteMix</strong><span className="text-[10px] font-black uppercase tracking-[.2em] text-white/35">Studio</span></div>
                </div>

                <div className="relative mt-auto mb-auto py-14">
                  <span className="inline-flex items-center gap-2 rounded-full border border-[#8b78ff]/25 bg-[#8b78ff]/10 px-3.5 py-2 text-[10px] font-black uppercase tracking-[.16em] text-[#bdb3ff]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#8ff5d2] shadow-[0_0_14px_#8ff5d2]" />
                    İlk adım tamam
                  </span>
                  <h3 className="mt-6 max-w-sm text-[42px] font-black leading-[.98] tracking-[-.065em]">Fikrin kaybolmadan taslağa dönüşsün.</h3>
                  <p className="mt-5 max-w-sm text-sm font-medium leading-7 text-white/45">Giriş yaptıktan sonra mesajını yeniden yazman gerekmez. SiteMix kaldığın yerden devam eder.</p>

                  <div className="mt-9 space-y-3">
                    {[
                      ["01", "İşletmeni anlattın", "Tamamlandı"],
                      ["02", "Güvenli giriş", "Şimdi"],
                      ["03", "Canlı taslak", "Sıradaki"],
                    ].map(([number, label, status], index) => (
                      <div key={number} className={`flex items-center gap-4 rounded-2xl border px-4 py-3.5 ${index === 1 ? "border-[#8b78ff]/30 bg-[#8b78ff]/10" : "border-white/7 bg-white/[0.025]"}`}>
                        <span className={`grid h-8 w-8 place-items-center rounded-full text-[10px] font-black ${index === 0 ? "bg-[#8ff5d2] text-[#07110d]" : index === 1 ? "bg-[#8b78ff] text-white" : "bg-white/7 text-white/30"}`}>{index === 0 ? "✓" : number}</span>
                        <strong className="flex-1 text-xs font-black text-white/75">{label}</strong>
                        <span className={`text-[9px] font-black uppercase tracking-[.12em] ${index === 1 ? "text-[#bdb3ff]" : "text-white/25"}`}>{status}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <p className="relative text-[10px] font-bold uppercase tracking-[.16em] text-white/25">Mobil uyumlu · Canlı ön izleme · Kolay yönetim</p>
              </aside>

              <section className="relative flex min-h-[640px] flex-col p-5 sm:p-9 lg:p-11">
                <div className="pointer-events-none absolute right-0 top-0 h-64 w-64 rounded-full bg-[#5f43e8]/10 blur-[85px]" />
                <div className="relative flex items-center justify-between lg:justify-end">
                  <div className="flex items-center gap-3 lg:hidden">
                    <span className="brand-orb"><span>S</span></span>
                    <div><strong className="block text-sm font-black">SiteMix</strong><span className="text-[9px] font-black uppercase tracking-[.18em] text-white/30">Güvenli proje alanı</span></div>
                  </div>
                  <button type="button" onClick={() => setShowAuth(false)} disabled={authBusy} className="grid h-11 w-11 place-items-center rounded-full border border-white/8 bg-white/[0.035] text-xl text-white/45 transition hover:border-white/15 hover:bg-white/8 hover:text-white disabled:opacity-40" aria-label="Pencereyi kapat">×</button>
                </div>

                <div className="relative my-auto py-7 sm:py-9">
                  <p className="text-[10px] font-black uppercase tracking-[.18em] text-[#9b8cff]">Mesajın güvende</p>
                  <h2 id="sitemix-auth-title" className="mt-3 max-w-md text-[clamp(2.35rem,6vw,3.4rem)] font-black leading-[.98] tracking-[-.065em]">Taslağını hesabına bağla.</h2>
                  <p className="mt-4 max-w-lg text-sm font-medium leading-7 text-white/46">Projen sana özel kaydedilsin, düzenlemelerine istediğin cihazdan devam et. İlk mesajın girişten sonra otomatik olarak işlenecek.</p>

                  <div className="mt-6 overflow-hidden rounded-[22px] border border-white/8 bg-white/[0.035]">
                    <div className="flex items-center justify-between border-b border-white/7 px-4 py-3">
                      <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[.14em] text-white/35"><span className="h-1.5 w-1.5 rounded-full bg-[#8ff5d2]" />Gönderilmeye hazır</span>
                      <span className="text-[10px] font-bold text-white/20">İlk mesaj</span>
                    </div>
                    <p className="line-clamp-3 px-4 py-4 text-sm font-semibold leading-6 text-white/70">“{prompt.trim() || "Site oluşturma isteğin"}”</p>
                  </div>

                  {authError ? <p className="mt-4 rounded-2xl border border-red-400/15 bg-red-500/10 p-3.5 text-sm font-bold text-red-200">{authError}</p> : null}

                  <button type="button" onClick={continueWithGoogle} disabled={authBusy} className="group mt-5 flex min-h-15 w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 text-sm font-black text-[#11121b] shadow-[0_15px_45px_rgba(0,0,0,.28)] transition hover:-translate-y-0.5 hover:bg-[#f4f2ff] hover:shadow-[0_20px_55px_rgba(87,65,190,.22)] disabled:translate-y-0 disabled:cursor-wait disabled:opacity-60">
                    <span className="grid h-8 w-8 place-items-center rounded-full border border-black/8 bg-white shadow-sm">
                      <svg aria-hidden="true" viewBox="0 0 24 24" className="h-[18px] w-[18px]">
                        <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.4-.18-2.07H12v3.91h5.38a4.6 4.6 0 0 1-2 3.02v2.54h3.24c1.9-1.75 2.98-4.33 2.98-7.4Z" />
                        <path fill="#34A853" d="M12 22c2.7 0 4.98-.9 6.63-2.37l-3.24-2.54c-.9.6-2.05.96-3.39.96-2.61 0-4.82-1.76-5.61-4.13H3.04v2.62A10 10 0 0 0 12 22Z" />
                        <path fill="#FBBC05" d="M6.39 13.92A6 6 0 0 1 6.07 12c0-.67.12-1.32.32-1.92V7.46H3.04A10 10 0 0 0 2 12c0 1.63.39 3.17 1.04 4.54l3.35-2.62Z" />
                        <path fill="#EA4335" d="M12 5.95c1.47 0 2.79.5 3.83 1.5l2.87-2.88A9.64 9.64 0 0 0 12 2a10 10 0 0 0-8.96 5.46l3.35 2.62C7.18 7.71 9.39 5.95 12 5.95Z" />
                      </svg>
                    </span>
                    <span>{authBusy ? "Google açılıyor..." : "Google ile güvenli devam et"}</span>
                    <span className="ml-auto text-lg text-black/25 transition group-hover:translate-x-1">→</span>
                  </button>

                  <div className="mt-5 grid grid-cols-3 gap-2">
                    {["Şifre istemeyiz", "Mesajın korunur", "Ücretsiz başla"].map((item) => (
                      <span key={item} className="rounded-xl border border-white/6 bg-white/[0.025] px-2 py-3 text-center text-[9px] font-black leading-4 text-white/34">{item}</span>
                    ))}
                  </div>
                </div>

                <p className="relative text-center text-[10px] font-medium leading-5 text-white/25">Devam ederek hesabının yalnızca güvenli oturum ve proje sahipliği için kullanılmasını kabul edersin.</p>
              </section>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
