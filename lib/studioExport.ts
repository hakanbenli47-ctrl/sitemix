import type { StudioSection, StudioSite } from "@/lib/sitemixStudio";

export type StudioRepositoryFile = { path: string; content: string };

const pageDefinitions = [
  { key: "home", label: "Ana Sayfa", path: "", types: ["hero", "features", "services", "about", "process", "pricing", "gallery", "testimonials", "faq", "contact"] },
  { key: "about", label: "Hakkımızda", path: "hakkimizda", types: ["about", "features", "process"] },
  { key: "services", label: "Hizmetler", path: "hizmetler", types: ["services", "pricing", "process", "faq"] },
  { key: "gallery", label: "Çalışmalar", path: "calismalar", types: ["gallery", "testimonials"] },
  { key: "contact", label: "İletişim", path: "iletisim", types: ["contact", "faq"] },
] as const;

function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

function safeUrl(value?: string) {
  if (!value) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.toString() : "";
  } catch {
    return "";
  }
}

function normalizeOrigin(domain?: string, fallback?: string) {
  const value = (domain || fallback || "").trim().replace(/^https?:\/\//, "").replace(/\/$/, "");
  return value ? `https://${value}` : "";
}

function pageHref(path: string, multi: boolean) {
  return multi && path ? `/${path}/` : path ? `/#${path}` : "/";
}

function renderCards(section: StudioSection) {
  return (section.items || []).map((item, index) => `<article class="card"><span class="index">0${index + 1}</span><h3>${escapeHtml(item)}</h3>${section.details?.[index] ? `<p>${escapeHtml(section.details[index])}</p>` : ""}</article>`).join("");
}

function renderSection(section: StudioSection, site: StudioSite) {
  const heroImage = safeUrl(site.media?.hero);
  if (section.type === "hero") return `<section class="hero"${heroImage ? ` style="--hero:url('${escapeHtml(heroImage)}')"` : ""}><div class="wrap hero-grid"><div><span class="eyebrow">${escapeHtml(section.eyebrow || `${site.location} · ${site.sector}`)}</span><h1>${escapeHtml(section.title)}</h1><p>${escapeHtml(section.text)}</p><div class="actions"><a class="primary" href="${site.whatsapp ? `https://wa.me/${site.whatsapp.replace(/\D/g, "")}` : "/iletisim/"}">${escapeHtml(section.ctaLabel || "Bilgi al")}</a><a class="secondary" href="${pageHref("hizmetler", site.pageMode === "multi")}">Hizmetleri incele</a></div></div><div class="hero-visual"><strong>${escapeHtml(site.businessName)}</strong><span>${escapeHtml(site.sector)}</span></div></div></section>`;
  if (section.type === "about") return `<section id="hakkimizda"><div class="wrap split"><div class="visual"${safeUrl(site.media?.about) ? ` style="background-image:url('${escapeHtml(safeUrl(site.media?.about))}')"` : ""}></div><div>${heading(section)}<p class="lead">${escapeHtml(section.text)}</p></div></div></section>`;
  if (["features", "services", "process"].includes(section.type)) return `<section id="${section.type}"><div class="wrap">${heading(section)}<div class="cards">${renderCards(section)}</div></div></section>`;
  if (section.type === "pricing") return `<section id="pricing"><div class="wrap">${heading(section)}<div class="cards">${renderCards(section)}</div></div></section>`;
  if (section.type === "gallery") {
    const media = site.media?.gallery || [];
    const count = Math.max(media.length, 6);
    return `<section id="gallery"><div class="wrap">${heading(section)}<div class="gallery">${Array.from({ length: count }, (_, index) => `<figure${media[index] ? ` style="background-image:url('${escapeHtml(safeUrl(media[index]))}')"` : ""}><span>${escapeHtml((site.sections.find((item) => item.type === "services")?.items || [site.businessName])[index % Math.max(site.sections.find((item) => item.type === "services")?.items?.length || 1, 1)] || site.businessName)}</span></figure>`).join("")}</div></div></section>`;
  }
  if (section.type === "testimonials") return `<section id="testimonials"><div class="wrap">${heading(section)}<div class="cards quotes">${(section.items || []).map((item) => `<blockquote>“${escapeHtml(item)}”</blockquote>`).join("")}</div></div></section>`;
  if (section.type === "faq") return `<section id="faq"><div class="wrap">${heading(section)}<div class="faq">${(section.items || []).map((item, index) => `<details><summary>${escapeHtml(item)}</summary><p>${escapeHtml(section.answers?.[index] || "Ayrıntılı bilgi için bizimle iletişime geçebilirsiniz.")}</p></details>`).join("")}</div></div></section>`;
  if (section.type === "contact") return `<section id="contact"><div class="wrap contact"><div>${heading(section)}<p class="lead">${escapeHtml(section.text)}</p></div><div class="contact-info"><strong>${escapeHtml(site.phone || "Telefon daha sonra eklenecek")}</strong><span>${escapeHtml(site.location)}</span>${site.whatsapp ? `<a class="primary" href="https://wa.me/${site.whatsapp.replace(/\D/g, "")}">WhatsApp’tan yaz</a>` : ""}</div></div></section>`;
  return "";
}

function heading(section: StudioSection) {
  return `<span class="eyebrow">${escapeHtml(section.eyebrow || section.type)}</span><h2>${escapeHtml(section.title)}</h2>${section.type !== "about" && section.type !== "contact" ? `<p class="lead">${escapeHtml(section.text)}</p>` : ""}`;
}

function renderPage(site: StudioSite, page: typeof pageDefinitions[number], origin: string) {
  const isMulti = site.pageMode === "multi";
  const sections = isMulti ? page.types.flatMap((type) => site.sections.filter((section) => section.type === type)) : site.sections;
  const canonical = origin ? `${origin}${page.path ? `/${page.path}/` : "/"}` : "";
  const title = page.key === "home" ? `${site.businessName} | ${site.sector}` : `${page.label} | ${site.businessName}`;
  const description = sections.find((section) => section.type === "hero")?.text || sections[0]?.text || site.tagline;
  const nav = pageDefinitions.map((item) => `<a href="${pageHref(item.path, isMulti)}"${item.key === page.key ? " class=\"active\"" : ""}>${item.label}</a>`).join("");
  return `<!doctype html><html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description.slice(0, 160))}">${canonical ? `<link rel="canonical" href="${escapeHtml(canonical)}">` : ""}<link rel="stylesheet" href="/styles.css"></head><body style="--accent:${escapeHtml(site.theme.accent)};--bg:${escapeHtml(site.theme.background)};--fg:${escapeHtml(site.theme.foreground)}"><header><div class="wrap nav"><a class="brand" href="/"><span>${escapeHtml(site.businessName.charAt(0) || "S")}</span>${escapeHtml(site.businessName)}</a><nav>${nav}</nav></div></header><main>${isMulti && page.key !== "home" ? `<div class="page-head"><div class="wrap"><span class="eyebrow">${escapeHtml(site.location)} · ${escapeHtml(site.businessName)}</span><h1>${page.label}</h1></div></div>` : ""}${sections.map((section) => renderSection(section, site)).join("")}</main><footer><div class="wrap"><strong>${escapeHtml(site.businessName)}</strong><span>© ${new Date().getFullYear()} · SiteMix ile hazırlandı</span></div></footer></body></html>`;
}

const stylesheet = `*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--fg);font-family:Arial,Helvetica,sans-serif}.wrap{width:min(1120px,calc(100% - 36px));margin:auto}header{position:sticky;top:0;z-index:20;border-bottom:1px solid color-mix(in srgb,var(--fg) 10%,transparent);background:color-mix(in srgb,var(--bg) 92%,transparent);backdrop-filter:blur(18px)}.nav{min-height:68px;display:flex;align-items:center;justify-content:space-between;gap:20px}.brand{display:flex;align-items:center;gap:10px;color:inherit;text-decoration:none;font-weight:900}.brand span{display:grid;width:36px;height:36px;place-items:center;border-radius:11px;background:var(--accent);color:var(--bg)}nav{display:flex;flex-wrap:wrap;gap:4px}nav a{padding:10px 12px;border-radius:999px;color:inherit;text-decoration:none;font-size:11px;font-weight:800;opacity:.55}nav a.active,nav a:hover{opacity:1;background:color-mix(in srgb,var(--accent) 10%,transparent)}section{padding:80px 0;border-top:1px solid color-mix(in srgb,var(--fg) 9%,transparent)}.hero{border:0;padding:110px 0;background-image:linear-gradient(90deg,var(--bg) 35%,transparent),var(--hero)}.hero-grid,.split,.contact{display:grid;grid-template-columns:1.05fr .95fr;gap:56px;align-items:center}.eyebrow{display:inline-block;color:var(--accent);font-size:10px;font-weight:900;letter-spacing:.16em;text-transform:uppercase}h1{max-width:850px;margin:20px 0;font-size:clamp(48px,8vw,96px);line-height:.92;letter-spacing:-.075em}h2{max-width:760px;margin:15px 0;font-size:clamp(36px,5vw,62px);line-height:.98;letter-spacing:-.055em}.lead,.hero p{max-width:700px;line-height:1.8;opacity:.62}.actions{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}.primary,.secondary{display:inline-flex;padding:14px 22px;border-radius:999px;text-decoration:none;font-size:12px;font-weight:900}.primary{background:var(--accent);color:var(--bg)}.secondary{border:1px solid color-mix(in srgb,var(--fg) 18%,transparent);color:inherit}.hero-visual,.visual{min-height:420px;border-radius:28px;background:linear-gradient(145deg,var(--fg),var(--accent));background-size:cover;background-position:center;color:var(--bg);padding:32px;display:flex;flex-direction:column;justify-content:flex-end}.hero-visual strong{font-size:30px}.cards{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:36px}.card,blockquote{margin:0;min-height:220px;padding:24px;border:1px solid color-mix(in srgb,var(--fg) 11%,transparent);border-radius:20px;background:color-mix(in srgb,var(--fg) 3%,transparent)}.card .index{color:var(--accent);font-size:10px;font-weight:900}.card h3{margin-top:55px}.card p,blockquote{font-size:13px;line-height:1.7;opacity:.66}.gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin-top:36px}.gallery figure{aspect-ratio:1/.82;margin:0;border-radius:20px;background:linear-gradient(145deg,var(--fg),var(--accent));background-size:cover;background-position:center;color:var(--bg);padding:20px;display:flex;align-items:flex-end;font-weight:900}.faq{margin-top:36px;border-top:1px solid color-mix(in srgb,var(--fg) 12%,transparent)}details{padding:20px 0;border-bottom:1px solid color-mix(in srgb,var(--fg) 12%,transparent)}summary{cursor:pointer;font-weight:900}details p{line-height:1.7;opacity:.62}.contact-info{display:grid;gap:16px;padding:28px;border-radius:24px;background:var(--fg);color:var(--bg)}.page-head{padding:70px 0 34px;background:color-mix(in srgb,var(--accent) 7%,var(--bg))}.page-head h1{font-size:clamp(42px,7vw,72px)}footer{padding:34px 0;border-top:1px solid color-mix(in srgb,var(--fg) 10%,transparent)}footer .wrap{display:flex;justify-content:space-between;gap:16px;font-size:12px;opacity:.55}@media(max-width:780px){nav{display:none}.hero,.page-head{padding:70px 0}.hero-grid,.split,.contact{grid-template-columns:1fr}.cards{grid-template-columns:1fr 1fr}.gallery{grid-template-columns:1fr 1fr}section{padding:60px 0}}@media(max-width:520px){.cards,.gallery{grid-template-columns:1fr}h1{font-size:46px}.hero-visual,.visual{min-height:320px}}`;

export function buildStudioRepositoryFiles(site: StudioSite, domain?: string, fallbackHost?: string): StudioRepositoryFile[] {
  const { deployment: _deployment, ...publicSiteData } = site;
  void _deployment;
  const publicSite = publicSiteData as StudioSite;
  const origin = normalizeOrigin(domain, fallbackHost);
  const pages = publicSite.pageMode === "multi" ? pageDefinitions : [pageDefinitions[0]];
  const files: StudioRepositoryFile[] = pages.map((page) => ({ path: page.path ? `${page.path}/index.html` : "index.html", content: renderPage(publicSite, page, origin) }));
  files.push({ path: "styles.css", content: stylesheet });
  files.push({ path: "site-data.json", content: JSON.stringify(publicSite, null, 2) });
  files.push({ path: "robots.txt", content: `User-agent: *\nAllow: /\n${origin ? `Sitemap: ${origin}/sitemap.xml\n` : ""}` });
  files.push({ path: "sitemap.xml", content: `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map((page) => `<url><loc>${escapeHtml(origin || "https://example.com")}${page.path ? `/${page.path}/` : "/"}</loc></url>`).join("")}</urlset>` });
  files.push({ path: "vercel.json", content: JSON.stringify({ cleanUrls: true, trailingSlash: true }, null, 2) });
  files.push({ path: "README.md", content: `# ${publicSite.businessName}\n\nSiteMix Studio tarafından oluşturulan bağımsız web sitesi.\n` });
  return files;
}
