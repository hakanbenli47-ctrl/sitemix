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

  useEffect(() => {
    supabaseClient.auth.getSession().then(({ data }) => setSignedIn(Boolean(data.session)));
    const { data } = supabaseClient.auth.onAuthStateChange((_event, session) => {
      setSignedIn(Boolean(session));
    });
    return () => data.subscription.unsubscribe();
  }, []);

  function startWithPrompt(value: string) {
    const cleanPrompt = value.trim();
    if (!cleanPrompt) return;
    window.sessionStorage.setItem("sitemix_pending_prompt", cleanPrompt);

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
        queryParams: { access_type: "offline", prompt: "consent" },
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

        <motion.h1 initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08 }} className="max-w-5xl text-center text-[clamp(3.1rem,9vw,8.5rem)] font-black leading-[0.88] tracking-[-0.085em]">
          Konuş. Siten
          <span className="hero-gradient block">şekillensin.</span>
        </motion.h1>

        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.18 }} className="mt-7 max-w-2xl text-center text-base font-medium leading-7 text-white/52 sm:text-lg sm:leading-8">
          İşletmeni birkaç cümleyle anlat. SiteMix sektörüne uygun yapıyı kurar, sen canlı ön izlemede istediğin gibi değiştirirsin.
        </motion.p>

        <motion.div initial={{ opacity: 0, scale: 0.97, y: 24 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ delay: 0.22, type: "spring", stiffness: 130 }} className="relative mt-10 w-full max-w-4xl">
          <div className="prompt-glow" />
          <form onSubmit={handleSubmit} className="prompt-shell relative overflow-hidden rounded-[28px] border border-white/12 bg-[#11121d]/88 p-3 shadow-[0_35px_100px_rgba(0,0,0,.55)] backdrop-blur-2xl sm:rounded-[34px] sm:p-4">
            <textarea
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === "Enter" && !event.shiftKey) {
                  event.preventDefault();
                  startWithPrompt(prompt);
                }
              }}
              rows={3}
              maxLength={1200}
              placeholder="Örn. Üsküdar'daki halı yıkama işletmem için güven veren, WhatsApp odaklı bir site oluştur..."
              aria-label="Oluşturmak istediğiniz siteyi anlatın"
              className="min-h-[112px] w-full resize-none bg-transparent px-3 py-3 text-base font-semibold leading-7 text-white outline-none placeholder:text-white/27 sm:min-h-[126px] sm:px-5 sm:py-4 sm:text-lg"
            />
            <div className="flex items-center justify-between gap-3 border-t border-white/8 px-1 pt-3 sm:px-3">
              <span className="hidden text-xs font-bold text-white/30 sm:block">Enter ile gönder · Shift + Enter ile yeni satır</span>
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
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-end bg-black/72 p-0 backdrop-blur-xl sm:place-items-center sm:p-5" role="dialog" aria-modal="true" aria-label="Google ile giriş">
            <motion.div initial={{ y: 50, opacity: 0, scale: 0.98 }} animate={{ y: 0, opacity: 1, scale: 1 }} exit={{ y: 30, opacity: 0 }} className="w-full max-w-md rounded-t-[32px] border border-white/12 bg-[#151621] p-6 shadow-2xl sm:rounded-[32px] sm:p-8">
              <div className="flex items-start justify-between"><span className="brand-orb"><span>S</span></span><button type="button" onClick={() => setShowAuth(false)} className="grid h-10 w-10 place-items-center rounded-full bg-white/7 text-xl text-white/55" aria-label="Pencereyi kapat">×</button></div>
              <h2 className="mt-7 text-3xl font-black tracking-[-0.05em]">Mesajın hazır.</h2>
              <p className="mt-3 text-sm font-medium leading-7 text-white/48">Oluşturduğumuz siteyi sana kaydedebilmemiz için Google hesabınla devam et. Yazdığın mesaj girişten sonra otomatik gönderilecek.</p>
              <div className="mt-5 rounded-2xl border border-white/8 bg-white/[0.035] p-4 text-sm font-semibold leading-6 text-white/65">“{prompt.trim() || "Site oluşturma isteğin"}”</div>
              {authError ? <p className="mt-4 rounded-2xl bg-red-500/12 p-3 text-sm font-bold text-red-200">{authError}</p> : null}
              <button type="button" onClick={continueWithGoogle} disabled={authBusy} className="mt-5 flex min-h-14 w-full items-center justify-center gap-3 rounded-full bg-white px-6 text-sm font-black text-[#11121b] transition hover:bg-[#eef0ff] disabled:opacity-60">
                <span className="grid h-7 w-7 place-items-center rounded-full border border-black/10 font-black text-[#4285f4]">G</span>{authBusy ? "Google açılıyor..." : "Google ile devam et"}
              </button>
              <p className="mt-4 text-center text-[11px] font-medium leading-5 text-white/28">Google hesabın yalnızca güvenli oturum ve proje sahipliği için kullanılır.</p>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </main>
  );
}
