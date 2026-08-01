"use client";

import { FormEvent, useMemo, useState } from "react";
import type { StudioSection, StudioSite } from "@/lib/sitemixStudio";
import ContactCapture from "@/app/_components/ContactCapture";

const sectionLabels: Record<StudioSection["type"], string> = {
  hero: "Ana sayfa",
  about: "Hakkımızda",
  services: "Hizmetler",
  pricing: "Paketler",
  gallery: "Galeri",
  testimonials: "Yorumlar",
  faq: "SSS",
  contact: "İletişim",
};

export default function SitePreview({ site, compact = false, slug }: { site: StudioSite; compact?: boolean; slug?: string }) {
  const { theme } = site;
  const [activePage, setActivePage] = useState("home");
  const [mobileMenu, setMobileMenu] = useState(false);
  const [selectedService, setSelectedService] = useState(0);
  const [selectedGallery, setSelectedGallery] = useState<number | null>(null);

  const navigableSections = useMemo(
    () => site.sections.filter((section) => ["about", "services", "pricing", "gallery", "contact"].includes(section.type)),
    [site.sections],
  );

  const visibleSections = useMemo(() => {
    if (site.pageMode === "single") return site.sections;
    if (activePage === "home") {
      const hero = site.sections.find((section) => section.type === "hero");
      const highlights = site.sections.filter((section) => ["services", "testimonials"].includes(section.type));
      return [hero, ...highlights].filter(Boolean) as StudioSection[];
    }
    return site.sections.filter((section) => section.id === activePage || section.type === activePage);
  }, [activePage, site.pageMode, site.sections]);

  function navigate(target: string) {
    setMobileMenu(false);
    if (site.pageMode === "multi") {
      setActivePage(target);
      window.requestAnimationFrame(() => document.getElementById("site-preview-top")?.scrollIntoView({ behavior: "smooth", block: "start" }));
      return;
    }
    const element = document.getElementById(`site-section-${target}`);
    element?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function contactAction() {
    const number = site.whatsapp.replace(/\D/g, "");
    if (number) {
      window.open(`https://wa.me/${number}`, "_blank", "noopener,noreferrer");
      return;
    }
    const contact = site.sections.find((section) => section.type === "contact");
    if (contact) navigate(site.pageMode === "multi" ? contact.id : "contact");
  }

  return (
    <div
      id="site-preview-top"
      className={`site-preview-frame ${compact ? "site-preview-compact" : ""}`}
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: theme.fontStyle === "elegant" ? "Georgia, 'Times New Roman', serif" : "Arial, Helvetica, sans-serif",
      }}
    >
      <header className="sticky top-0 z-40 border-b backdrop-blur-2xl" style={{ borderColor: `${theme.foreground}12`, background: `${theme.background}E8` }}>
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-7">
          <button type="button" onClick={() => navigate("home")} className="flex min-w-0 items-center gap-3 text-left">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl text-sm font-black shadow-lg" style={{ background: theme.accent, color: theme.background }}>{site.businessName.charAt(0) || "S"}</span>
            <span className="truncate text-sm font-black tracking-[-0.035em] sm:text-base">{site.businessName}</span>
          </button>

          <nav className="hidden items-center gap-1 md:flex">
            <button type="button" onClick={() => navigate("home")} className="rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] opacity-55 transition hover:opacity-100">Ana sayfa</button>
            {navigableSections.slice(0, 5).map((section) => (
              <button key={section.id} type="button" onClick={() => navigate(site.pageMode === "multi" ? section.id : section.type)} className={`rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-[.08em] transition ${activePage === section.id ? "opacity-100" : "opacity-55 hover:opacity-100"}`}>{sectionLabels[section.type]}</button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <button type="button" onClick={contactAction} className="hidden rounded-full px-4 py-2.5 text-[10px] font-black sm:inline-flex" style={{ background: theme.accent, color: theme.background }}>Bize ulaş <span className="ml-2">↗</span></button>
            <button type="button" onClick={() => setMobileMenu((current) => !current)} className="grid h-10 w-10 place-items-center rounded-xl border text-base md:hidden" style={{ borderColor: `${theme.foreground}1A` }} aria-label="Menüyü aç">{mobileMenu ? "×" : "≡"}</button>
          </div>
        </div>

        {mobileMenu ? <nav className="grid gap-1 border-t px-4 py-3 md:hidden" style={{ borderColor: `${theme.foreground}12`, background: theme.background }}><button type="button" onClick={() => navigate("home")} className="rounded-xl px-3 py-3 text-left text-xs font-black">Ana sayfa</button>{navigableSections.map((section) => <button key={section.id} type="button" onClick={() => navigate(site.pageMode === "multi" ? section.id : section.type)} className="rounded-xl px-3 py-3 text-left text-xs font-black" style={{ background: `${theme.accent}0B` }}>{sectionLabels[section.type]}</button>)}</nav> : null}
      </header>

      {site.pageMode === "multi" && activePage !== "home" ? (
        <div className="border-b px-5 py-3 text-[9px] font-black uppercase tracking-[.14em] opacity-45 sm:px-9" style={{ borderColor: `${theme.foreground}12` }}>
          <button type="button" onClick={() => navigate("home")}>Ana sayfa</button><span className="mx-2">/</span><span>{sectionLabels[visibleSections[0]?.type] || "Sayfa"}</span>
        </div>
      ) : null}

      <main key={activePage} className="animate-[site-page-in_.38s_ease-out]">
        {visibleSections.map((section) => {
          if (section.type === "hero") {
            return (
              <section id="site-section-hero" key={section.id} className="relative overflow-hidden px-5 py-14 sm:px-9 sm:py-24">
                <div className="absolute -right-20 -top-28 h-80 w-80 rounded-full opacity-20 blur-[80px]" style={{ background: theme.accent }} />
                <div className="absolute -bottom-28 left-[28%] h-72 w-72 rounded-full opacity-15 blur-[90px]" style={{ background: theme.accentSoft }} />
                <div className="relative mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.12fr_.88fr]">
                  <div>
                    <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[9px] font-black uppercase tracking-[.16em]" style={{ borderColor: `${theme.accent}35`, background: `${theme.accent}0D`, color: theme.accent }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />{site.location} · {site.sector}</div>
                    <h1 className="mt-6 max-w-3xl text-[clamp(2.65rem,8vw,5.8rem)] font-black leading-[.91] tracking-[-.075em]">{section.title}</h1>
                    <p className="mt-6 max-w-xl text-sm font-medium leading-7 opacity-58 sm:text-base sm:leading-8">{section.text}</p>
                    <div className="mt-8 flex flex-wrap gap-3">
                      <button type="button" onClick={contactAction} className="rounded-full px-6 py-3.5 text-xs font-black shadow-xl transition hover:-translate-y-0.5" style={{ background: theme.accent, color: theme.background }}>Hemen bilgi al <span className="ml-2">↗</span></button>
                      <button type="button" onClick={() => navigate("services")} className="rounded-full border px-6 py-3.5 text-xs font-black transition hover:-translate-y-0.5" style={{ borderColor: `${theme.foreground}22` }}>Hizmetleri incele</button>
                    </div>
                    <div className="mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[9px] font-black uppercase tracking-[.12em] opacity-38"><span>✓ Hızlı iletişim</span><span>✓ Şeffaf süreç</span><span>✓ Güvenilir hizmet</span></div>
                  </div>

                  <div className="relative mx-auto w-full max-w-md lg:max-w-none">
                    <div className="aspect-[.92] rounded-[34px] p-4 shadow-[0_35px_80px_rgba(0,0,0,.18)]" style={{ background: `linear-gradient(145deg, ${theme.accentSoft}, ${theme.accent})` }}>
                      <div className="relative h-full overflow-hidden rounded-[26px] border" style={{ borderColor: `${theme.background}35`, background: `${theme.background}D9` }}>
                        <div className="absolute left-5 right-5 top-5 flex items-center justify-between"><span className="text-[9px] font-black uppercase tracking-[.14em] opacity-45">Öne çıkan</span><span className="h-2 w-2 rounded-full" style={{ background: theme.accent }} /></div>
                        <div className="absolute inset-x-5 bottom-5 rounded-[22px] p-5" style={{ background: theme.background, color: theme.foreground }}><p className="text-[9px] font-black uppercase tracking-[.14em]" style={{ color: theme.accent }}>Size özel hizmet</p><h3 className="mt-3 text-2xl font-black tracking-[-.045em]">İyi bir deneyim, ilk temasta başlar.</h3><button type="button" onClick={contactAction} className="mt-5 text-xs font-black" style={{ color: theme.accent }}>Detayları konuşalım →</button></div>
                        <div className="absolute left-1/2 top-[34%] h-32 w-32 -translate-x-1/2 -translate-y-1/2 rotate-12 rounded-[32px] opacity-85 shadow-2xl" style={{ background: theme.accent }} />
                        <div className="absolute left-[28%] top-[29%] h-20 w-20 -rotate-12 rounded-full opacity-60" style={{ background: theme.accentSoft }} />
                      </div>
                    </div>
                    <div className="absolute -bottom-4 -left-4 rounded-2xl border px-4 py-3 shadow-xl" style={{ background: theme.background, borderColor: `${theme.foreground}14` }}><strong className="block text-lg font-black">%100</strong><span className="text-[8px] font-black uppercase tracking-[.12em] opacity-35">Müşteri odağı</span></div>
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === "services") {
            return (
              <section id="site-section-services" key={section.id} className="border-t px-5 py-12 sm:px-9 sm:py-20" style={{ borderColor: `${theme.foreground}12` }}>
                <SectionHeading eyebrow="Hizmetler" title={section.title} text={section.text} accent={theme.accent} />
                <div className="mx-auto mt-9 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(section.items || []).map((item, index) => <button key={`${item}-${index}`} type="button" onClick={() => setSelectedService(index)} className="group min-h-44 rounded-[24px] border p-5 text-left transition hover:-translate-y-1" style={{ borderColor: selectedService === index ? `${theme.accent}70` : `${theme.foreground}12`, background: selectedService === index ? `${theme.accent}12` : `${theme.foreground}04` }}><span className="flex items-center justify-between"><span className="text-[9px] font-black" style={{ color: theme.accent }}>0{index + 1}</span><span className="grid h-7 w-7 place-items-center rounded-full border opacity-35 transition group-hover:opacity-100" style={{ borderColor: `${theme.foreground}25` }}>↗</span></span><h3 className="mt-10 text-lg font-black tracking-[-.035em]">{item}</h3><p className="mt-2 text-[10px] font-medium leading-5 opacity-42">Kapsamı ve size uygun seçenekleri birlikte netleştirelim.</p></button>)}
                </div>
                {(section.items || [])[selectedService] ? <div className="mx-auto mt-3 flex max-w-6xl flex-col gap-4 rounded-[22px] border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: `${theme.accent}30`, background: `${theme.accent}0A` }}><div><p className="text-[9px] font-black uppercase tracking-[.14em]" style={{ color: theme.accent }}>Seçtiğiniz hizmet</p><h3 className="mt-1 text-lg font-black">{section.items?.[selectedService]}</h3></div><button type="button" onClick={contactAction} className="rounded-full px-5 py-3 text-[10px] font-black" style={{ background: theme.accent, color: theme.background }}>Bu hizmet için bilgi al</button></div> : null}
              </section>
            );
          }

          if (section.type === "about") {
            return <section id="site-section-about" key={section.id} className="border-t px-5 py-12 sm:px-9 sm:py-20" style={{ borderColor: `${theme.foreground}12` }}><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.9fr_1.1fr] lg:items-center"><div className="grid aspect-[1.12] grid-cols-2 gap-3 rounded-[32px] p-4" style={{ background: `${theme.accent}0B` }}><div className="rounded-[24px]" style={{ background: `linear-gradient(145deg, ${theme.accent}, ${theme.accentSoft})` }} /><div className="mt-12 rounded-[24px] border p-5" style={{ borderColor: `${theme.foreground}13`, background: theme.background }}><strong className="block text-3xl font-black">10+</strong><span className="mt-2 block text-[9px] font-black uppercase tracking-[.13em] opacity-38">Yıllık deneyim</span></div><div className="-mt-8 rounded-[24px] border p-5" style={{ borderColor: `${theme.foreground}13`, background: theme.background }}><strong className="block text-3xl font-black">4.9</strong><span className="mt-2 block text-[9px] font-black uppercase tracking-[.13em] opacity-38">Memnuniyet</span></div><div className="rounded-[24px]" style={{ background: `linear-gradient(45deg, ${theme.accentSoft}, ${theme.accent})` }} /></div><div><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: theme.accent }}>Hakkımızda</p><h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-.06em] sm:text-5xl">{section.title}</h2><p className="mt-5 text-sm font-medium leading-8 opacity-58">{section.text}</p><div className="mt-7 grid gap-3 sm:grid-cols-2">{["Açık iletişim", "Özenli çalışma", "Zamanında teslim", "Sürekli destek"].map((item) => <div key={item} className="flex items-center gap-3 rounded-2xl border px-4 py-3 text-xs font-black" style={{ borderColor: `${theme.foreground}10` }}><span className="grid h-6 w-6 place-items-center rounded-full text-[9px]" style={{ background: `${theme.accent}18`, color: theme.accent }}>✓</span>{item}</div>)}</div></div></div></section>;
          }

          if (section.type === "pricing") {
            return <section id="site-section-pricing" key={section.id} className="border-t px-5 py-12 sm:px-9 sm:py-20" style={{ borderColor: `${theme.foreground}12` }}><SectionHeading eyebrow="Paketler" title={section.title} text={section.text} accent={theme.accent} /><div className="mx-auto mt-9 grid max-w-6xl gap-3 md:grid-cols-3">{(section.items || []).map((item, index) => <article key={item} className="flex min-h-72 flex-col rounded-[26px] border p-6" style={{ borderColor: index === 1 ? `${theme.accent}65` : `${theme.foreground}12`, background: index === 1 ? `${theme.accent}10` : `${theme.foreground}03` }}>{index === 1 ? <span className="w-fit rounded-full px-3 py-1.5 text-[8px] font-black uppercase tracking-[.12em]" style={{ background: theme.accent, color: theme.background }}>En çok tercih edilen</span> : <span className="text-[9px] font-black uppercase tracking-[.14em] opacity-28">Paket 0{index + 1}</span>}<h3 className="mt-8 text-2xl font-black tracking-[-.045em]">{item}</h3><ul className="mt-5 space-y-3 text-[11px] font-bold opacity-50"><li>✓ İhtiyaca özel kapsam</li><li>✓ Net süreç planı</li><li>✓ Hızlı iletişim</li></ul><button type="button" onClick={contactAction} className="mt-auto rounded-full border px-5 py-3 text-[10px] font-black" style={{ borderColor: index === 1 ? theme.accent : `${theme.foreground}20`, background: index === 1 ? theme.accent : "transparent", color: index === 1 ? theme.background : theme.foreground }}>Teklif al</button></article>)}</div></section>;
          }

          if (section.type === "gallery") {
            return <section id="site-section-gallery" key={section.id} className="border-t px-5 py-12 sm:px-9 sm:py-20" style={{ borderColor: `${theme.foreground}12` }}><SectionHeading eyebrow="Çalışmalar" title={section.title} text={section.text} accent={theme.accent} /><div className="mx-auto mt-9 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <button type="button" onClick={() => setSelectedGallery(item)} key={item} className={`group relative overflow-hidden rounded-[24px] ${item === 0 || item === 4 ? "col-span-2 aspect-[1.8] sm:col-span-1 sm:aspect-[.82]" : "aspect-[.82]"}`} style={{ background: `linear-gradient(${125 + item * 22}deg, ${theme.accentSoft}, ${theme.accent})` }}><span className="absolute inset-0 bg-black/0 transition group-hover:bg-black/10" /><span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full bg-white/85 text-xs font-black text-black opacity-0 transition group-hover:opacity-100">↗</span></button>)}</div></section>;
          }

          if (section.type === "testimonials") {
            return <section id="site-section-testimonials" key={section.id} className="border-t px-5 py-12 sm:px-9 sm:py-20" style={{ borderColor: `${theme.foreground}12`, background: `${theme.accent}08` }}><SectionHeading eyebrow="Müşteri deneyimi" title={section.title} text={section.text} accent={theme.accent} /><div className="mx-auto mt-9 grid max-w-6xl gap-3 md:grid-cols-3">{(section.items || []).map((item, index) => <article key={`${item}-${index}`} className="rounded-[24px] border p-5" style={{ borderColor: `${theme.foreground}10`, background: theme.background }}><div className="flex items-center justify-between"><span className="text-lg" style={{ color: theme.accent }}>★★★★★</span><span className="text-3xl font-black opacity-10">“</span></div><p className="mt-7 text-sm font-bold leading-7">{item}</p><div className="mt-6 flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-full text-[10px] font-black" style={{ background: `${theme.accent}18`, color: theme.accent }}>{String.fromCharCode(65 + index)}</span><div><strong className="block text-[10px] font-black">Doğrulanmış müşteri</strong><span className="text-[8px] font-bold opacity-35">Google değerlendirmesi</span></div></div></article>)}</div></section>;
          }

          if (section.type === "faq") {
            return <section id="site-section-faq" key={section.id} className="border-t px-5 py-12 sm:px-9 sm:py-20" style={{ borderColor: `${theme.foreground}12` }}><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: theme.accent }}>Merak edilenler</p><h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-.055em]">{section.title}</h2><p className="mt-4 text-xs font-medium leading-6 opacity-48">{section.text}</p></div><div className="divide-y border-y" style={{ borderColor: `${theme.foreground}12` }}>{(section.items || []).map((item, index) => <details key={`${item}-${index}`} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black"><span>{item}</span><span className="grid h-7 w-7 place-items-center rounded-full transition group-open:rotate-45" style={{ background: `${theme.accent}12`, color: theme.accent }}>+</span></summary><p className="mt-3 pr-10 text-xs font-medium leading-6 opacity-50">Bu konuda ihtiyacınıza göre net bilgi paylaşmak için bizimle iletişime geçebilirsiniz.</p></details>)}</div></div></section>;
          }

          if (section.type === "contact") {
            return <section id="site-section-contact" key={section.id} className="px-4 py-5 sm:px-8 sm:py-8"><div className="relative mx-auto max-w-6xl overflow-hidden rounded-[32px] px-5 py-12 sm:px-9 sm:py-16" style={{ background: theme.accent, color: theme.background }}><div className="absolute -right-24 -top-28 h-72 w-72 rounded-full opacity-20" style={{ background: theme.background }} /><div className="relative text-center"><p className="text-[9px] font-black uppercase tracking-[.17em] opacity-55">İletişim</p><h2 className="mx-auto mt-4 max-w-2xl text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl">{section.title}</h2><p className="mx-auto mt-4 max-w-lg text-xs font-semibold leading-6 opacity-65">{section.text}</p>{slug ? <ContactCapture slug={slug} background={theme.background} foreground={theme.foreground} /> : <PreviewContactForm background={theme.background} foreground={theme.foreground} />}</div></div></section>;
          }

          return null;
        })}
      </main>

      <footer className="border-t px-5 py-8 sm:px-9" style={{ borderColor: `${theme.foreground}12` }}><div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-sm font-black">{site.businessName}</strong><p className="mt-1 text-[9px] font-bold opacity-32">© {new Date().getFullYear()} · SiteMix ile hazırlandı</p></div><div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-[.1em] opacity-38">{navigableSections.slice(0, 4).map((section) => <button key={section.id} type="button" onClick={() => navigate(site.pageMode === "multi" ? section.id : section.type)}>{sectionLabels[section.type]}</button>)}</div></div></footer>

      {selectedGallery !== null ? <button type="button" onClick={() => setSelectedGallery(null)} className="fixed inset-0 z-[100] grid place-items-center bg-black/82 p-6 backdrop-blur-xl" aria-label="Galeri görünümünü kapat"><span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl text-white">×</span><span className="block aspect-[4/5] max-h-[78vh] w-full max-w-lg rounded-[32px] shadow-2xl" style={{ background: `linear-gradient(${125 + selectedGallery * 22}deg, ${theme.accentSoft}, ${theme.accent})` }} /></button> : null}
    </div>
  );
}

function SectionHeading({ eyebrow, title, text, accent }: { eyebrow: string; title: string; text: string; accent: string }) {
  return <div className="mx-auto max-w-6xl"><p className="text-[9px] font-black uppercase tracking-[.19em]" style={{ color: accent }}>{eyebrow}</p><div className="mt-3 grid gap-4 lg:grid-cols-[1fr_.7fr] lg:items-end"><h2 className="text-4xl font-black leading-[1] tracking-[-.06em] sm:text-5xl">{title}</h2><p className="text-xs font-medium leading-6 opacity-48 lg:justify-self-end">{text}</p></div></div>;
}

function PreviewContactForm({ background, foreground }: { background: string; foreground: string }) {
  const [sent, setSent] = useState(false);
  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSent(true);
  }
  return <form onSubmit={submit} className="mx-auto mt-8 grid max-w-2xl gap-3 text-left sm:grid-cols-2"><input required placeholder="Adınız" className="h-12 rounded-xl border px-4 text-xs font-bold outline-none" style={{ background, color: foreground, borderColor: `${foreground}1C` }} /><input placeholder="Telefon" className="h-12 rounded-xl border px-4 text-xs font-bold outline-none" style={{ background, color: foreground, borderColor: `${foreground}1C` }} /><textarea required rows={3} placeholder="Nasıl yardımcı olabiliriz?" className="resize-none rounded-xl border p-4 text-xs font-bold outline-none sm:col-span-2" style={{ background, color: foreground, borderColor: `${foreground}1C` }} /><button className="min-h-12 rounded-full px-5 text-xs font-black sm:col-span-2" style={{ background, color: foreground }}>{sent ? "Ön izleme mesajı alındı ✓" : "Mesaj gönder"}</button>{sent ? <p className="text-center text-[10px] font-black opacity-65 sm:col-span-2">Bu bir ön izleme işlemidir. Site yayınlandığında mesaj gerçek panele düşer.</p> : null}</form>;
}
