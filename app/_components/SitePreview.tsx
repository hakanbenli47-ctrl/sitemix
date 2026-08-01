import type { StudioSite } from "@/lib/sitemixStudio";
import ContactCapture from "@/app/_components/ContactCapture";

export default function SitePreview({ site, compact = false, slug }: { site: StudioSite; compact?: boolean; slug?: string }) {
  const { theme } = site;

  return (
    <div
      className={`site-preview-frame ${compact ? "site-preview-compact" : ""}`}
      style={{
        background: theme.background,
        color: theme.foreground,
        fontFamily: theme.fontStyle === "elegant" ? "Georgia, serif" : "Arial, Helvetica, sans-serif",
      }}
    >
      <header className="flex items-center justify-between border-b px-5 py-4" style={{ borderColor: `${theme.foreground}18` }}>
        <strong className="text-base tracking-[-0.04em]">{site.businessName}</strong>
        <div className="hidden items-center gap-5 text-[10px] font-black uppercase tracking-[0.12em] opacity-55 sm:flex">
          <span>Hakkımızda</span><span>Hizmetler</span><span>İletişim</span>
        </div>
        <span className="rounded-full px-3 py-2 text-[10px] font-black" style={{ background: theme.accent, color: theme.background }}>Bize ulaş</span>
      </header>

      {site.sections.map((section) => {
        if (section.type === "hero") {
          return (
            <section key={section.id} className="relative overflow-hidden px-5 py-12 sm:px-9 sm:py-20">
              <div className="absolute -right-16 -top-20 h-64 w-64 rounded-full opacity-30 blur-3xl" style={{ background: theme.accent }} />
              <div className="relative max-w-2xl">
                <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{site.location} · {site.sector}</p>
                <h1 className="mt-4 text-4xl font-black leading-[.98] tracking-[-0.065em] sm:text-6xl">{section.title}</h1>
                <p className="mt-5 max-w-xl text-sm font-medium leading-7 opacity-60">{section.text}</p>
                <div className="mt-7 flex flex-wrap gap-2">
                  <span className="rounded-full px-5 py-3 text-xs font-black" style={{ background: theme.accent, color: theme.background }}>WhatsApp’tan bilgi al</span>
                  <span className="rounded-full border px-5 py-3 text-xs font-black" style={{ borderColor: `${theme.foreground}25` }}>Hizmetleri incele</span>
                </div>
              </div>
            </section>
          );
        }

        if (section.type === "services" || section.type === "pricing" || section.type === "testimonials" || section.type === "faq") {
          return (
            <section key={section.id} className="border-t px-5 py-9 sm:px-9 sm:py-14" style={{ borderColor: `${theme.foreground}14` }}>
              <p className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: theme.accent }}>{section.type === "services" ? "Hizmetler" : section.type === "pricing" ? "Paketler" : section.type === "testimonials" ? "Deneyimler" : "Merak edilenler"}</p>
              <h2 className="mt-3 text-2xl font-black tracking-[-0.045em] sm:text-3xl">{section.title}</h2>
              <p className="mt-3 max-w-xl text-xs font-medium leading-6 opacity-55">{section.text}</p>
              <div className="mt-6 grid gap-2 sm:grid-cols-3">
                {(section.items || []).map((item, index) => (
                  <article key={`${item}-${index}`} className="rounded-2xl border p-4" style={{ borderColor: `${theme.foreground}13`, background: `${theme.accent}0B` }}>
                    <span className="text-[9px] font-black" style={{ color: theme.accent }}>0{index + 1}</span>
                    <p className="mt-5 text-sm font-black leading-5">{item}</p>
                  </article>
                ))}
              </div>
            </section>
          );
        }

        if (section.type === "gallery") {
          return (
            <section key={section.id} className="border-t px-5 py-9 sm:px-9 sm:py-14" style={{ borderColor: `${theme.foreground}14` }}>
              <h2 className="text-2xl font-black tracking-[-0.045em]">{section.title}</h2>
              <div className="mt-6 grid grid-cols-3 gap-2">
                {[0, 1, 2].map((item) => <div key={item} className="aspect-[4/5] rounded-2xl" style={{ background: `linear-gradient(${130 + item * 25}deg, ${theme.accentSoft}, ${theme.accent})` }} />)}
              </div>
            </section>
          );
        }

        if (section.type === "contact") {
          return (
            <section key={section.id} className="m-4 rounded-3xl px-5 py-10 text-center sm:m-8 sm:px-9" style={{ background: theme.accent, color: theme.background }}>
              <h2 className="text-3xl font-black tracking-[-0.05em]">{section.title}</h2>
              <p className="mx-auto mt-3 max-w-md text-xs font-semibold leading-6 opacity-70">{section.text}</p>
              {slug ? <ContactCapture slug={slug} background={theme.background} foreground={theme.foreground} /> : <span className="mt-6 inline-flex rounded-full px-5 py-3 text-xs font-black" style={{ background: theme.background, color: theme.foreground }}>Mesaj gönder</span>}
            </section>
          );
        }

        return (
          <section key={section.id} className="border-t px-5 py-9 sm:px-9 sm:py-14" style={{ borderColor: `${theme.foreground}14` }}>
            <h2 className="text-2xl font-black tracking-[-0.045em]">{section.title}</h2>
            <p className="mt-4 max-w-xl text-sm font-medium leading-7 opacity-60">{section.text}</p>
          </section>
        );
      })}

      <footer className="border-t px-5 py-7 text-[10px] font-bold opacity-45" style={{ borderColor: `${theme.foreground}14` }}>
        © {new Date().getFullYear()} {site.businessName} · SiteMix ile hazırlandı
      </footer>
    </div>
  );
}
