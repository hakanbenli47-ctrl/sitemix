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
  const design = site.design || { heroAlign: "left", heroStyle: "minimal", motion: "calm", cardStyle: "outline", density: "balanced" };
  const cardRadius = design.cardStyle === "sharp" ? "rounded-[10px]" : design.cardStyle === "soft" ? "rounded-[28px]" : "rounded-[18px]";
  const sectionSpacing = design.density === "airy" ? "py-16 sm:py-24" : design.density === "compact" ? "py-10 sm:py-14" : "py-12 sm:py-20";
  const motionClass = design.motion === "dynamic" ? "animate-[premium-drift_7s_ease-in-out_infinite]" : design.motion === "calm" ? "animate-[premium-drift_14s_ease-in-out_infinite]" : "";
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
              <section id="site-section-hero" key={section.id} className={`relative overflow-hidden px-5 ${design.heroStyle === "immersive" ? "py-20 sm:py-32" : sectionSpacing} sm:px-9`}>
                <div className={`absolute -right-20 -top-28 h-80 w-80 rounded-full opacity-15 blur-[90px] ${motionClass}`} style={{ background: theme.accent }} />
                <div className={`absolute -bottom-28 left-[28%] h-72 w-72 rounded-full opacity-10 blur-[100px] ${motionClass}`} style={{ background: theme.accentSoft, animationDelay: "-3s" }} />
                <div className={`relative mx-auto grid max-w-6xl items-center gap-12 ${design.heroAlign === "center" ? "text-center" : "lg:grid-cols-[1.08fr_.92fr]"}`}>
                  <div className={design.heroAlign === "center" ? "mx-auto max-w-4xl" : ""}>
                    <div className="inline-flex items-center gap-2 rounded-full border px-3.5 py-2 text-[9px] font-black uppercase tracking-[.16em]" style={{ borderColor: `${theme.accent}35`, background: `${theme.accent}0D`, color: theme.accent }}><span className="h-1.5 w-1.5 rounded-full" style={{ background: theme.accent }} />{site.location} · {site.sector}</div>
                    <h1 className={`mt-6 text-[clamp(2.8rem,8vw,6.4rem)] font-black leading-[.91] tracking-[-.075em] ${design.heroAlign === "center" ? "mx-auto max-w-5xl" : "max-w-3xl"}`}>{section.title}</h1>
                    <p className={`mt-6 text-sm font-medium leading-7 opacity-58 sm:text-base sm:leading-8 ${design.heroAlign === "center" ? "mx-auto max-w-2xl" : "max-w-xl"}`}>{section.text}</p>
                    <div className={`mt-8 flex flex-wrap gap-3 ${design.heroAlign === "center" ? "justify-center" : ""}`}>
                      <button type="button" onClick={contactAction} className="rounded-full px-6 py-3.5 text-xs font-black shadow-xl transition hover:-translate-y-0.5" style={{ background: theme.accent, color: theme.background }}>Hemen bilgi al <span className="ml-2">↗</span></button>
                      <button type="button" onClick={() => navigate("services")} className="rounded-full border px-6 py-3.5 text-xs font-black transition hover:-translate-y-0.5" style={{ borderColor: `${theme.foreground}22` }}>Hizmetleri incele</button>
                    </div>
                    <div className={`mt-9 flex flex-wrap gap-x-7 gap-y-3 text-[9px] font-black uppercase tracking-[.12em] opacity-38 ${design.heroAlign === "center" ? "justify-center" : ""}`}><span>Hızlı iletişim</span><span>Şeffaf süreç</span><span>Güvenilir hizmet</span></div>
                  </div>

                  <div className={`relative mx-auto w-full max-w-xl ${design.heroAlign === "center" ? "mt-2" : ""}`}>
                    <div className={`${cardRadius} overflow-hidden border shadow-[0_35px_90px_rgba(0,0,0,.14)]`} style={{ borderColor: `${theme.foreground}12`, background: design.heroStyle === "immersive" ? theme.foreground : `${theme.accent}09`, color: design.heroStyle === "immersive" ? theme.background : theme.foreground }}>
                      <div className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: `${design.heroStyle === "immersive" ? theme.background : theme.foreground}15` }}><span className="text-[9px] font-black uppercase tracking-[.16em] opacity-48">{site.businessName}</span><span className={`h-2 w-2 rounded-full ${motionClass}`} style={{ background: theme.accent }} /></div>
                      <div className="p-6 sm:p-8">
                        <p className="text-[9px] font-black uppercase tracking-[.16em]" style={{ color: theme.accent }}>{design.heroStyle === "conversion" ? "Hızlı teklif" : "Öne çıkan hizmetler"}</p>
                        <div className="mt-5 divide-y" style={{ borderColor: `${design.heroStyle === "immersive" ? theme.background : theme.foreground}12` }}>{(site.sections.find((item) => item.type === "services")?.items || []).slice(0, 4).map((item, index) => <button key={item} type="button" onClick={() => { setSelectedService(index); navigate("services"); }} className="flex w-full items-center justify-between py-4 text-left text-sm font-black"><span>{item}</span><span className="opacity-30">0{index + 1} ↗</span></button>)}</div>
                        <div className="mt-6 flex items-center justify-between gap-4 border-t pt-5" style={{ borderColor: `${design.heroStyle === "immersive" ? theme.background : theme.foreground}12` }}><div><span className="block text-[8px] font-black uppercase tracking-[.13em] opacity-35">İletişim</span><strong className="mt-1 block text-xs">{site.whatsapp || site.phone || "Numaranızı ekleyin"}</strong></div><button type="button" onClick={contactAction} className="rounded-full px-4 py-2.5 text-[9px] font-black" style={{ background: theme.accent, color: theme.background }}>Görüşelim</button></div>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
            );
          }

          if (section.type === "services") {
            return (
              <section id="site-section-services" key={section.id} className={`border-t px-5 sm:px-9 ${sectionSpacing}`} style={{ borderColor: `${theme.foreground}12` }}>
                <SectionHeading eyebrow="Hizmetler" title={section.title} text={section.text} accent={theme.accent} />
                <div className="mx-auto mt-9 grid max-w-6xl gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {(section.items || []).map((item, index) => <button key={`${item}-${index}`} type="button" onClick={() => setSelectedService(index)} className={`group min-h-44 border p-5 text-left transition hover:-translate-y-1 ${cardRadius}`} style={{ borderColor: selectedService === index ? `${theme.accent}70` : `${theme.foreground}12`, background: selectedService === index ? `${theme.accent}12` : `${theme.foreground}04` }}><span className="flex items-center justify-between"><span className="text-[9px] font-black" style={{ color: theme.accent }}>0{index + 1}</span><span className="grid h-7 w-7 place-items-center rounded-full border opacity-35 transition group-hover:opacity-100" style={{ borderColor: `${theme.foreground}25` }}>↗</span></span><h3 className="mt-10 text-lg font-black tracking-[-.035em]">{item}</h3><p className="mt-2 text-[10px] font-medium leading-5 opacity-42">Kapsamı ve size uygun seçenekleri birlikte netleştirelim.</p></button>)}
                </div>
                {(section.items || [])[selectedService] ? <div className="mx-auto mt-3 flex max-w-6xl flex-col gap-4 rounded-[22px] border p-5 sm:flex-row sm:items-center sm:justify-between" style={{ borderColor: `${theme.accent}30`, background: `${theme.accent}0A` }}><div><p className="text-[9px] font-black uppercase tracking-[.14em]" style={{ color: theme.accent }}>Seçtiğiniz hizmet</p><h3 className="mt-1 text-lg font-black">{section.items?.[selectedService]}</h3></div><button type="button" onClick={contactAction} className="rounded-full px-5 py-3 text-[10px] font-black" style={{ background: theme.accent, color: theme.background }}>Bu hizmet için bilgi al</button></div> : null}
              </section>
            );
          }

          if (section.type === "about") {
            return <section id="site-section-about" key={section.id} className={`border-t px-5 sm:px-9 ${sectionSpacing}`} style={{ borderColor: `${theme.foreground}12` }}><div className="mx-auto grid max-w-6xl gap-10 lg:grid-cols-[.88fr_1.12fr] lg:items-center"><div className={`${cardRadius} overflow-hidden border`} style={{ borderColor: `${theme.foreground}12`, background: `${theme.accent}08` }}><div className="border-b p-6" style={{ borderColor: `${theme.foreground}10` }}><p className="text-[9px] font-black uppercase tracking-[.16em]" style={{ color: theme.accent }}>Çalışma yaklaşımımız</p><h3 className="mt-3 text-2xl font-black tracking-[-.045em]">Güven, ayrıntılarda kurulur.</h3></div><div className="divide-y" style={{ borderColor: `${theme.foreground}10` }}>{["İhtiyacı doğru dinleriz", "Süreci açıkça paylaşırız", "Her aşamada ulaşılabiliriz", "İşi özenle tamamlarız"].map((item, index) => <div key={item} className="flex items-center gap-4 px-6 py-4"><span className="text-[9px] font-black" style={{ color: theme.accent }}>0{index + 1}</span><strong className="text-xs">{item}</strong></div>)}</div></div><div><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: theme.accent }}>Hakkımızda</p><h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-.06em] sm:text-5xl">{section.title}</h2><p className="mt-5 text-sm font-medium leading-8 opacity-58">{section.text}</p><div className="mt-7 flex flex-wrap gap-2">{["Açık iletişim", "Özenli çalışma", "Zamanında teslim", "Sürekli destek"].map((item) => <span key={item} className="rounded-full border px-4 py-2.5 text-[10px] font-black" style={{ borderColor: `${theme.foreground}12` }}>{item}</span>)}</div></div></div></section>;
          }

          if (section.type === "pricing") {
            return <section id="site-section-pricing" key={section.id} className={`border-t px-5 sm:px-9 ${sectionSpacing}`} style={{ borderColor: `${theme.foreground}12` }}><SectionHeading eyebrow="Paketler" title={section.title} text={section.text} accent={theme.accent} /><div className="mx-auto mt-9 grid max-w-6xl gap-3 md:grid-cols-3">{(section.items || []).map((item, index) => <article key={item} className={`flex min-h-72 flex-col border p-6 ${cardRadius}`} style={{ borderColor: index === 1 ? `${theme.accent}65` : `${theme.foreground}12`, background: index === 1 ? `${theme.accent}0D` : `${theme.foreground}03` }}><span className="w-fit text-[9px] font-black uppercase tracking-[.14em]" style={{ color: index === 1 ? theme.accent : `${theme.foreground}55` }}>{index === 1 ? "Önerilen yapı" : `Paket 0${index + 1}`}</span><h3 className="mt-8 text-2xl font-black tracking-[-.045em]">{item}</h3><ul className="mt-5 space-y-3 text-[11px] font-bold opacity-50"><li>✓ İhtiyaca özel kapsam</li><li>✓ Net süreç planı</li><li>✓ Hızlı iletişim</li></ul><button type="button" onClick={contactAction} className="mt-auto rounded-full border px-5 py-3 text-[10px] font-black" style={{ borderColor: index === 1 ? theme.accent : `${theme.foreground}20`, background: index === 1 ? theme.accent : "transparent", color: index === 1 ? theme.background : theme.foreground }}>Teklif al</button></article>)}</div></section>;
          }

          if (section.type === "gallery") {
            const serviceItems = site.sections.find((item) => item.type === "services")?.items || [];
            return <section id="site-section-gallery" key={section.id} className={`border-t px-5 sm:px-9 ${sectionSpacing}`} style={{ borderColor: `${theme.foreground}12` }}><SectionHeading eyebrow="Çalışmalar" title={section.title} text={section.text} accent={theme.accent} /><div className="mx-auto mt-9 grid max-w-6xl grid-cols-2 gap-3 sm:grid-cols-3">{[0, 1, 2, 3, 4, 5].map((item) => <button type="button" onClick={() => setSelectedGallery(item)} key={item} className={`group relative overflow-hidden border text-left ${cardRadius} ${item === 0 || item === 4 ? "col-span-2 aspect-[1.8] sm:col-span-1 sm:aspect-[.82]" : "aspect-[.82]"}`} style={{ borderColor: `${theme.foreground}12`, background: `linear-gradient(${135 + item * 18}deg, ${theme.foreground} 0%, ${theme.foreground}E8 54%, ${theme.accent} 140%)`, color: theme.background }}><span className="absolute inset-x-0 top-0 h-px opacity-70" style={{ background: theme.accent }} /><span className="absolute left-4 top-4 text-[8px] font-black uppercase tracking-[.15em] opacity-45">Çalışma 0{item + 1}</span><span className="absolute bottom-4 left-4 right-12 text-sm font-black tracking-[-.03em]">{serviceItems[item % Math.max(serviceItems.length, 1)] || "Proje görseli ekleyin"}</span><span className="absolute bottom-3 right-3 grid h-8 w-8 place-items-center rounded-full border text-xs font-black opacity-55 transition group-hover:opacity-100" style={{ borderColor: `${theme.background}35` }}>↗</span></button>)}</div></section>;
          }

          if (section.type === "testimonials") {
            return <section id="site-section-testimonials" key={section.id} className={`border-t px-5 sm:px-9 ${sectionSpacing}`} style={{ borderColor: `${theme.foreground}12`, background: `${theme.accent}06` }}><SectionHeading eyebrow="Müşteri deneyimi" title={section.title} text={section.text} accent={theme.accent} /><div className="mx-auto mt-9 grid max-w-6xl gap-3 md:grid-cols-3">{(section.items || []).map((item, index) => <article key={`${item}-${index}`} className={`border p-6 ${cardRadius}`} style={{ borderColor: `${theme.foreground}10`, background: theme.background }}><span className="text-4xl font-black opacity-10">“</span><p className="mt-6 text-sm font-bold leading-7">{item}</p><div className="mt-7 border-t pt-4" style={{ borderColor: `${theme.foreground}10` }}><span className="text-[8px] font-black uppercase tracking-[.13em] opacity-35">Yayınlamadan önce müşteri onayı alın</span></div></article>)}</div></section>;
          }

          if (section.type === "faq") {
            return <section id="site-section-faq" key={section.id} className={`border-t px-5 sm:px-9 ${sectionSpacing}`} style={{ borderColor: `${theme.foreground}12` }}><div className="mx-auto grid max-w-6xl gap-8 lg:grid-cols-[.7fr_1.3fr]"><div><p className="text-[9px] font-black uppercase tracking-[.18em]" style={{ color: theme.accent }}>Merak edilenler</p><h2 className="mt-4 text-4xl font-black leading-[1] tracking-[-.055em]">{section.title}</h2><p className="mt-4 text-xs font-medium leading-6 opacity-48">{section.text}</p></div><div className="divide-y border-y" style={{ borderColor: `${theme.foreground}12` }}>{(section.items || []).map((item, index) => <details key={`${item}-${index}`} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-sm font-black"><span>{item}</span><span className="grid h-7 w-7 place-items-center rounded-full transition group-open:rotate-45" style={{ background: `${theme.accent}12`, color: theme.accent }}>+</span></summary><p className="mt-3 pr-10 text-xs font-medium leading-6 opacity-50">Bu konuda ihtiyacınıza göre net bilgi paylaşmak için bizimle iletişime geçebilirsiniz.</p></details>)}</div></div></section>;
          }

          if (section.type === "contact") {
            return <section id="site-section-contact" key={section.id} className="px-4 py-5 sm:px-8 sm:py-8"><div className={`relative mx-auto max-w-6xl overflow-hidden px-5 py-10 sm:px-9 sm:py-14 ${cardRadius}`} style={{ background: theme.foreground, color: theme.background }}><div className="absolute -right-24 -top-28 h-72 w-72 rounded-full opacity-20 blur-3xl" style={{ background: theme.accent }} /><div className="relative grid gap-10 lg:grid-cols-[.8fr_1.2fr] lg:items-start"><div><p className="text-[9px] font-black uppercase tracking-[.17em]" style={{ color: theme.accent }}>İletişim</p><h2 className="mt-4 max-w-xl text-4xl font-black leading-[.98] tracking-[-.06em] sm:text-5xl">{section.title}</h2><p className="mt-4 max-w-md text-xs font-semibold leading-6 opacity-60">{section.text}</p><div className="mt-8 space-y-3 border-t pt-6 text-xs font-black" style={{ borderColor: `${theme.background}18` }}><p>{site.phone || "Telefon numarası henüz eklenmedi"}</p><p className="opacity-55">{site.location}</p></div></div><div>{slug ? <ContactCapture slug={slug} background={theme.background} foreground={theme.foreground} /> : <PreviewContactForm background={theme.background} foreground={theme.foreground} />}</div></div></div></section>;
          }

          return null;
        })}
      </main>

      <footer className="border-t px-5 py-8 sm:px-9" style={{ borderColor: `${theme.foreground}12` }}><div className="mx-auto flex max-w-6xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"><div><strong className="text-sm font-black">{site.businessName}</strong><p className="mt-1 text-[9px] font-bold opacity-32">© {new Date().getFullYear()} · SiteMix ile hazırlandı</p></div><div className="flex flex-wrap gap-4 text-[9px] font-black uppercase tracking-[.1em] opacity-38">{navigableSections.slice(0, 4).map((section) => <button key={section.id} type="button" onClick={() => navigate(site.pageMode === "multi" ? section.id : section.type)}>{sectionLabels[section.type]}</button>)}</div></div></footer>

      {selectedGallery !== null ? <button type="button" onClick={() => setSelectedGallery(null)} className="fixed inset-0 z-[100] grid place-items-center bg-black/82 p-6 backdrop-blur-xl" aria-label="Galeri görünümünü kapat"><span className="absolute right-5 top-5 grid h-11 w-11 place-items-center rounded-full bg-white/10 text-xl text-white">×</span><span className="flex aspect-[4/5] max-h-[78vh] w-full max-w-lg flex-col justify-end rounded-[32px] border border-white/10 p-8 text-left text-white shadow-2xl" style={{ background: `linear-gradient(${145 + selectedGallery * 18}deg, #0b0b0f, ${theme.accent} 160%)` }}><small className="text-[9px] font-black uppercase tracking-[.16em] opacity-45">Çalışma 0{selectedGallery + 1}</small><strong className="mt-3 text-3xl font-black tracking-[-.05em]">{site.sections.find((item) => item.type === "services")?.items?.[selectedGallery % Math.max(site.sections.find((item) => item.type === "services")?.items?.length || 1, 1)] || "Proje görseli ekleyin"}</strong></span></button> : null}
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
