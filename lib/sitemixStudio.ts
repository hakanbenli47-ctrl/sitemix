export type StudioSection = {
  id: string;
  type:
    | "hero"
    | "about"
    | "services"
    | "pricing"
    | "gallery"
    | "testimonials"
    | "faq"
    | "contact";
  title: string;
  text: string;
  items?: string[];
};

export type StudioTheme = {
  accent: string;
  accentSoft: string;
  background: string;
  foreground: string;
  fontStyle: "modern" | "elegant" | "strong";
};

export type StudioDesign = {
  heroAlign: "left" | "center";
  heroStyle: "editorial" | "conversion" | "immersive" | "minimal";
  motion: "none" | "calm" | "dynamic";
  cardStyle: "soft" | "sharp" | "outline";
  density: "airy" | "balanced" | "compact";
};

export type StudioSite = {
  businessName: string;
  sector: string;
  location: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  pageMode: "single" | "multi";
  theme: StudioTheme;
  design?: StudioDesign;
  sections: StudioSection[];
};

export type StudioProject = {
  id: string;
  owner_id?: string;
  title: string;
  slug: string;
  sector: string;
  prompt: string;
  status: string;
  management_mode?: string | null;
  payment_status?: string | null;
  published_at?: string | null;
  created_at?: string;
  updated_at?: string;
  current_version: StudioSite;
};

export const sectorCatalog = [
  {
    id: "kuafor",
    label: "Kadın kuaförü",
    keywords: ["kadın kuaförü", "kuaför", "hair", "saç"],
    services: ["Saç kesimi", "Renklendirme", "Fön & bakım", "Gelin saçı"],
    tagline: "Kendinizi iyi hissettiren dokunuşlar.",
  },
  {
    id: "berber",
    label: "Erkek berberi",
    keywords: ["berber", "erkek kuaförü", "barber"],
    services: ["Saç kesimi", "Sakal tasarımı", "Cilt bakımı", "Damat paketi"],
    tagline: "Tarzınıza net bir imza.",
  },
  {
    id: "guzellik",
    label: "Güzellik salonu",
    keywords: ["güzellik", "nail", "tırnak", "bakım", "estetik"],
    services: ["Cilt bakımı", "Kalıcı oje", "Kirpik lifting", "Profesyonel makyaj"],
    tagline: "Işığınızı ortaya çıkaran bakım deneyimi.",
  },
  {
    id: "hali-yikama",
    label: "Halı ve koltuk yıkama",
    keywords: ["halı", "koltuk", "yıkama", "temizlik"],
    services: ["Halı yıkama", "Koltuk yıkama", "Yorgan yıkama", "Yerinde temizlik"],
    tagline: "Evinize teslim, hijyenin en temiz hâli.",
  },
  {
    id: "oto-yikama",
    label: "Oto yıkama",
    keywords: ["oto", "araç", "detailing", "seramik"],
    services: ["İç dış yıkama", "Detaylı temizlik", "Pasta cila", "Seramik kaplama"],
    tagline: "Aracınız ilk günkü ışıltısına dönsün.",
  },
  {
    id: "teknik-servis",
    label: "Teknik servis",
    keywords: ["elektrik", "tesisat", "klima", "servis", "tamir"],
    services: ["Aynı gün servis", "Arıza tespiti", "Bakım & onarım", "Acil destek"],
    tagline: "İhtiyacınız olduğunda hızlı ve güvenilir servis.",
  },
  {
    id: "emlak",
    label: "Emlak danışmanı",
    keywords: ["emlak", "gayrimenkul", "satılık", "kiralık"],
    services: ["Satılık portföy", "Kiralık portföy", "Değerleme", "Yatırım danışmanlığı"],
    tagline: "Doğru gayrimenkul, güvenilir danışmanlık.",
  },
  {
    id: "danismanlik",
    label: "Danışmanlık",
    keywords: ["diyetisyen", "danışman", "uzman", "koçluk"],
    services: ["İlk görüşme", "Kişisel plan", "Online danışmanlık", "Süreç takibi"],
    tagline: "Hedefinize uygun, size özel bir yol haritası.",
  },
  {
    id: "organizasyon",
    label: "Organizasyon",
    keywords: ["düğün", "organizasyon", "etkinlik", "nişan"],
    services: ["Düğün organizasyonu", "Nişan & söz", "Kurumsal etkinlik", "Mekân süsleme"],
    tagline: "Hayal ettiğiniz anları birlikte tasarlayalım.",
  },
] as const;

const palettes: Record<string, StudioTheme> = {
  kuafor: {
    accent: "#ff5d8f",
    accentSoft: "#ffdbe7",
    background: "#fff8fb",
    foreground: "#25131b",
    fontStyle: "elegant",
  },
  berber: {
    accent: "#df9f45",
    accentSoft: "#f5e3c7",
    background: "#101211",
    foreground: "#fffaf1",
    fontStyle: "strong",
  },
  "hali-yikama": {
    accent: "#09a8b5",
    accentSoft: "#c9f3f2",
    background: "#f5ffff",
    foreground: "#102b2d",
    fontStyle: "modern",
  },
  "oto-yikama": {
    accent: "#7c5cff",
    accentSoft: "#ddd6ff",
    background: "#0d0b16",
    foreground: "#f8f6ff",
    fontStyle: "strong",
  },
  default: {
    accent: "#5b5df0",
    accentSoft: "#dddfff",
    background: "#fbfbff",
    foreground: "#15162c",
    fontStyle: "modern",
  },
};

const sectorDesigns: Record<string, StudioDesign> = {
  kuafor: { heroAlign: "left", heroStyle: "editorial", motion: "calm", cardStyle: "sharp", density: "airy" },
  guzellik: { heroAlign: "left", heroStyle: "editorial", motion: "calm", cardStyle: "soft", density: "airy" },
  berber: { heroAlign: "left", heroStyle: "immersive", motion: "calm", cardStyle: "sharp", density: "balanced" },
  "hali-yikama": { heroAlign: "left", heroStyle: "conversion", motion: "calm", cardStyle: "soft", density: "balanced" },
  "oto-yikama": { heroAlign: "left", heroStyle: "immersive", motion: "dynamic", cardStyle: "sharp", density: "balanced" },
  "teknik-servis": { heroAlign: "left", heroStyle: "conversion", motion: "calm", cardStyle: "outline", density: "compact" },
  emlak: { heroAlign: "center", heroStyle: "immersive", motion: "calm", cardStyle: "sharp", density: "airy" },
  danismanlik: { heroAlign: "left", heroStyle: "minimal", motion: "calm", cardStyle: "outline", density: "airy" },
  organizasyon: { heroAlign: "center", heroStyle: "editorial", motion: "dynamic", cardStyle: "soft", density: "airy" },
  default: { heroAlign: "left", heroStyle: "minimal", motion: "calm", cardStyle: "outline", density: "balanced" },
};

function shortHeadline(site: Pick<StudioSite, "sector" | "businessName">) {
  const sector = site.sector.toLocaleLowerCase("tr-TR");
  if (/kuaför|güzellik/.test(sector)) return "Işığını ortaya çıkar.";
  if (/berber/.test(sector)) return "Tarzın burada başlar.";
  if (/halı|temizlik|yıkama/.test(sector)) return "Temizliğin güven veren hâli.";
  if (/oto|araç/.test(sector)) return "Aracın yeniden ışıldasın.";
  if (/servis|tamir/.test(sector)) return "Hızlı çözüm. Net sonuç.";
  if (/emlak|gayrimenkul/.test(sector)) return "Doğru yer, doğru karar.";
  if (/danışman|uzman/.test(sector)) return "Netlik burada başlar.";
  if (/organizasyon|etkinlik/.test(sector)) return "Unutulmayacak anlar.";
  return `${site.businessName} ile daha ileri.`;
}

function titleCase(value: string) {
  return value
    .trim()
    .split(/\s+/)
    .slice(0, 6)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

export function slugify(value: string) {
  return value
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "yeni-site";
}

function inferBusinessName(prompt: string, sectorLabel: string) {
  const structured = prompt.match(/İşletme adı:\s*([^.!?\n]{2,60})/i)?.[1];
  if (structured) return titleCase(structured);

  const quoted = prompt.match(/[“\"']([^”\"']{2,40})[”\"']/)?.[1];
  if (quoted) return titleCase(quoted);

  const named = prompt.match(/(?:adı|ismim|işletmem|markam)\s*(?:is|:|de)?\s*([a-zA-ZçğıöşüÇĞİÖŞÜ0-9 ]{2,40})/i)?.[1];
  if (named) return titleCase(named.replace(/(?:için|olan|sitesi).*$/i, ""));

  return `Yeni ${sectorLabel}`;
}

function inferLocation(prompt: string) {
  const structured = prompt.match(/Konum:\s*([^.!?\n]{2,80})/i)?.[1];
  if (structured) return titleCase(structured);

  const match = prompt.match(/(?:^|\s)([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:'?[dt][ae])?)\s+(?:bir|bulunan|için)/);
  return match?.[1]?.replace(/'[dt][ae]$/i, "") || "Bulunduğunuz bölgede";
}

export function generateStudioSite(prompt: string): StudioSite {
  const normalized = prompt.toLocaleLowerCase("tr-TR");
  const requestedSector = prompt.match(/Sektör:\s*([^.!?\n]{2,80})/i)?.[1]?.trim();
  const requestedSectorNormalized = requestedSector?.toLocaleLowerCase("tr-TR") || "";
  const catalogSector = sectorCatalog.find((item) =>
    requestedSectorNormalized.includes(item.label.toLocaleLowerCase("tr-TR"))
    || item.keywords.some((keyword) => requestedSectorNormalized.includes(keyword.toLocaleLowerCase("tr-TR"))),
  ) || sectorCatalog.find((item) => item.keywords.some((keyword) => normalized.includes(keyword)));
  const sector = catalogSector || sectorCatalog[0];
  const sectorLabel = requestedSector || sector.label;
  const businessName = inferBusinessName(prompt, sectorLabel);
  const location = inferLocation(prompt);
  const theme: StudioTheme = { ...(palettes[catalogSector?.id || "default"] || palettes.default) };
  const learnedServices = prompt.match(/Hizmetler:\s*([^.!?\n]{3,300})/i)?.[1]
    ?.split(/,|;/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, 8);
  const goal = prompt.match(/Sitenin ana hedefi:\s*([^.!?\n]{3,160})/i)?.[1]?.trim();
  const phone = prompt.match(/Telefon:\s*(\+?\d[\d\s()-]{8,}\d)/i)?.[1]?.trim() || "";
  const whatsapp = prompt.match(/WhatsApp:\s*(\+?\d[\d\s()-]{8,}\d)/i)?.[1]?.trim() || phone;
  const wantsPricing = /fiyat|paket|ücret/.test(normalized);
  const wantsGallery = /galeri|fotoğraf|öncesi|sonrası/.test(normalized);
  const wantsTestimonials = /yorum|referans|müşteri deneyimi/.test(normalized);
  const wantsMulti = /çok sayfa|çok sayfalı|sayfalar/.test(normalized);

  const conversationColors: Array<[RegExp, Partial<StudioTheme>]> = [
    [/kırmızı|bordo/, { accent: "#e33d4f", accentSoft: "#ffd9de" }],
    [/mavi/, { accent: "#3478f6", accentSoft: "#d9e8ff" }],
    [/yeşil/, { accent: "#15a36d", accentSoft: "#d3f5e6" }],
    [/mor/, { accent: "#7656ee", accentSoft: "#e4ddff" }],
    [/turuncu/, { accent: "#f2773d", accentSoft: "#ffe0d0" }],
    [/pembe/, { accent: "#f0528a", accentSoft: "#ffd8e6" }],
    [/siyah|koyu/, { background: "#0e1014", foreground: "#fafafa" }],
    [/beyaz|açık/, { background: "#fbfbff", foreground: "#171827" }],
  ];
  conversationColors.forEach(([pattern, colors]) => {
    if (pattern.test(normalized)) Object.assign(theme, colors);
  });

  const tagline = catalogSector?.tagline || `${businessName} ile ihtiyacınıza uygun, güvenilir çözümler.`;
  const design: StudioDesign = { ...(sectorDesigns[catalogSector?.id || "default"] || sectorDesigns.default) };
  const heroAction = goal
    ? `${goal.toLocaleLowerCase("tr-TR")} için hizmetleri inceleyin ve hemen iletişime geçin.`
    : "Hızlıca bilgi alın, çalışma detaylarını görün ve bize ulaşın.";

  const sections: StudioSection[] = [
    {
      id: "hero",
      type: "hero",
      title: tagline,
      text: `${location} ${sectorLabel.toLocaleLowerCase("tr-TR")} hizmetleri. ${heroAction}`,
    },
    {
      id: "services",
      type: "services",
      title: "Size nasıl yardımcı olabiliriz?",
      text: "İhtiyacınıza uygun hizmeti seçin, ayrıntıları birlikte netleştirelim.",
      items: learnedServices?.length ? learnedServices : [...sector.services],
    },
    {
      id: "about",
      type: "about",
      title: `${businessName} hakkında`,
      text: "İşini özenle yapan, müşterisine açık bilgi veren ve her aşamada ulaşılabilir kalan bir ekibiz.",
    },
    ...(wantsPricing
      ? [
          {
            id: "pricing",
            type: "pricing" as const,
            title: "Hizmet paketleri",
            text: "Net kapsam, anlaşılır süreç ve ihtiyacınıza göre şekillenen seçenekler.",
            items: ["Başlangıç paketi", "En çok tercih edilen", "Size özel çözüm"],
          },
        ]
      : []),
    ...(wantsGallery
      ? [
          {
            id: "gallery",
            type: "gallery" as const,
            title: "Çalışmalarımız",
            text: "İşletmemizden seçili çalışmalar ve sonuçlar.",
          },
        ]
      : []),
    ...(wantsTestimonials
      ? [
          {
            id: "testimonials",
            type: "testimonials" as const,
            title: "Müşteri deneyimleri",
            text: "Gerçek müşterilerinizden izinli yorumları yayınlamadan önce buradan düzenleyin.",
            items: ["Müşteri yorumunuzu buraya ekleyin", "İkinci müşteri yorumunu buraya ekleyin", "Üçüncü müşteri yorumunu buraya ekleyin"],
          },
        ]
      : []),
    {
      id: "faq",
      type: "faq",
      title: "Merak edilenler",
      text: "Randevu, hizmet kapsamı ve çalışma süreciyle ilgili kısa cevaplar.",
      items: ["Nasıl randevu alabilirim?", "Hangi bölgelere hizmet veriyorsunuz?", "Fiyat bilgisi nasıl alabilirim?"],
    },
    {
      id: "contact",
      type: "contact",
      title: "Hemen iletişime geçin",
      text: "Sorunuzu yazın; en kısa sürede size dönüş yapalım.",
    },
  ];

  return {
    businessName,
    sector: sectorLabel,
    location,
    tagline,
    phone,
    whatsapp,
    pageMode: wantsMulti ? "multi" : "single",
    theme,
    design,
    sections,
  };
}

export function applyStudioInstruction(site: StudioSite, instruction: string): StudioSite {
  const normalized = instruction.toLocaleLowerCase("tr-TR");
  const next: StudioSite = JSON.parse(JSON.stringify(site));
  next.design = { ...(site.design || sectorDesigns.default) };

  if (/(başl(?:ık|ığ)|hero).*(ortala|ortaya|merkeze)|ortalanmış başlık/.test(normalized)) next.design.heroAlign = "center";
  if (/(başl(?:ık|ığ)|hero).*(sola|solda)|sol hizalı başlık/.test(normalized)) next.design.heroAlign = "left";
  if ((/başl(?:ık|ığ)/.test(normalized) && /kısa|kısalt/.test(normalized)) || /daha kısa bir şey/.test(normalized)) {
    const hero = next.sections.find((section) => section.type === "hero");
    if (hero) {
      hero.title = shortHeadline(next);
      next.tagline = hero.title;
    }
  }
  if (/(açıklama|metin).*(kısa|kısalt)/.test(normalized)) {
    const hero = next.sections.find((section) => section.type === "hero");
    if (hero && hero.text.length > 110) hero.text = `${hero.text.slice(0, 107).replace(/\s+\S*$/, "")}...`;
  }
  if (/(giriş|hero|ana ekran).*(hareketli|dinamik|canlı)|daha hareketli/.test(normalized)) next.design.motion = "dynamic";
  if (/(hareket|animasyon).*(kapat|olmasın|kaldır)|sabit olsun/.test(normalized)) next.design.motion = "none";
  if (/sakin|yavaş animasyon/.test(normalized)) next.design.motion = "calm";
  if (/premium|lüks|editoryal|dergi gibi/.test(normalized)) {
    next.design.heroStyle = "editorial";
    next.design.cardStyle = "sharp";
    next.design.density = "airy";
    next.theme.fontStyle = "elegant";
  }
  if (/minimal|çok sade/.test(normalized)) {
    next.design.heroStyle = "minimal";
    next.design.cardStyle = "outline";
    next.design.density = "airy";
  }
  if (/satış odaklı|teklif odaklı|dönüşüm odaklı/.test(normalized)) next.design.heroStyle = "conversion";
  if (/tam ekran|görsel ağırlıklı|çarpıcı giriş/.test(normalized)) next.design.heroStyle = "immersive";
  if (/köşeli|keskin/.test(normalized)) next.design.cardStyle = "sharp";
  if (/yuvarlak|yumuşak köşe/.test(normalized)) next.design.cardStyle = "soft";
  if (/daha sıkı|kompakt/.test(normalized)) next.design.density = "compact";
  if (/daha ferah|boşlukları artır/.test(normalized)) next.design.density = "airy";

  const businessName = instruction.match(/(?:işletme|marka|şirket)\s+ad(?:ı|ını)\s*[:,-]?\s*([^.!?\n]{2,60}?)(?:\s+olsun|\s+yap|$)/i)?.[1]
    || instruction.match(/ad(?:ı|ını)\s+([^.!?\n]{2,60}?)\s+(?:olsun|yap)/i)?.[1];
  if (businessName) {
    next.businessName = titleCase(businessName);
    const about = next.sections.find((section) => section.type === "about");
    if (about) about.title = `${next.businessName} hakkında`;
  }

  const location = instruction.match(/(?:konum|şehir|bölge)\s*[:,-]?\s*([^.!?\n]{2,80}?)(?:\s+olsun|\s+yap|$)/i)?.[1];
  if (location) next.location = titleCase(location);

  const phone = instruction.match(/(?:telefon|iletişim numarası)\s*[:,-]?\s*(\+?[\d\s()-]{10,22})/i)?.[1];
  if (phone) next.phone = phone.trim();
  const whatsapp = instruction.match(/(?:whatsapp|wp)\s*(?:numarası)?\s*[:,-]?\s*(\+?[\d\s()-]{10,22})/i)?.[1];
  if (whatsapp) next.whatsapp = whatsapp.trim();

  const serviceList = instruction.match(/(?:hizmetler|hizmetlerim|hizmetlerimiz)(?![a-zçğıöşü])\s*[:,-]?\s*([^.!?\n]{3,260})/i)?.[1]
    ?.replace(/\s+olsun$/i, "")
    .split(/,|;|\s+ve\s+/i)
    .map((item) => item.trim())
    .filter((item) => item.length > 1)
    .slice(0, 8);
  if (serviceList?.length) {
    const services = next.sections.find((section) => section.type === "services");
    if (services) services.items = serviceList;
  }
  const serviceToAdd = instruction.match(/hizmet(?:lere|lerime|lerimize)?\s+([^.!?\n]{2,70}?)\s+ekle/i)?.[1]?.trim();
  if (serviceToAdd) {
    const services = next.sections.find((section) => section.type === "services");
    if (services) services.items = [...new Set([...(services.items || []), titleCase(serviceToAdd)])].slice(0, 10);
  }
  const serviceToRemove = instruction.match(/hizmet(?:lerden|lerimden|lerimizden)?\s+([^.!?\n]{2,70}?)\s+(?:kaldır|sil|çıkar)/i)?.[1]?.trim();
  if (serviceToRemove) {
    const services = next.sections.find((section) => section.type === "services");
    if (services?.items) services.items = services.items.filter((item) => item.toLocaleLowerCase("tr-TR") !== serviceToRemove.toLocaleLowerCase("tr-TR"));
  }

  const slogan = instruction.match(/(?:slogan|ana başlık|hero başlığı)\s*[:,-]?\s*[“"']?([^.!?\n”"']{3,120})[”"']?/i)?.[1];
  if (slogan) {
    next.tagline = slogan.trim();
    const hero = next.sections.find((section) => section.type === "hero");
    if (hero) hero.title = next.tagline;
  }

  const colorMap: Array<[RegExp, Partial<StudioTheme>]> = [
    [/kırmızı|bordo/, { accent: "#e33d4f", accentSoft: "#ffd9de" }],
    [/mavi/, { accent: "#3478f6", accentSoft: "#d9e8ff" }],
    [/yeşil/, { accent: "#15a36d", accentSoft: "#d3f5e6" }],
    [/mor/, { accent: "#7656ee", accentSoft: "#e4ddff" }],
    [/turuncu/, { accent: "#f2773d", accentSoft: "#ffe0d0" }],
    [/pembe/, { accent: "#f0528a", accentSoft: "#ffd8e6" }],
    [/siyah|koyu/, { background: "#0e1014", foreground: "#fafafa" }],
    [/beyaz|açık/, { background: "#fbfbff", foreground: "#171827" }],
  ];

  colorMap.forEach(([pattern, colors]) => {
    if (pattern.test(normalized)) next.theme = { ...next.theme, ...colors };
  });

  if (/çok sayfa|çok sayfalı/.test(normalized)) next.pageMode = "multi";
  if (/tek sayfa|tek sayfalı/.test(normalized)) next.pageMode = "single";

  const moveAfterHero = (type: StudioSection["type"]) => {
    const sectionIndex = next.sections.findIndex((section) => section.type === type);
    const heroIndex = next.sections.findIndex((section) => section.type === "hero");
    if (sectionIndex < 0 || heroIndex < 0 || sectionIndex === heroIndex + 1) return;
    const [section] = next.sections.splice(sectionIndex, 1);
    const nextHeroIndex = next.sections.findIndex((item) => item.type === "hero");
    next.sections.splice(nextHeroIndex + 1, 0, section);
  };
  if (/hizmet.*(yukarı|öne|başa)/.test(normalized)) moveAfterHero("services");
  if (/hakkımızda.*(yukarı|öne|başa)/.test(normalized)) moveAfterHero("about");

  const addSection = (section: StudioSection) => {
    if (!next.sections.some((item) => item.type === section.type)) {
      next.sections.splice(Math.max(next.sections.length - 1, 1), 0, section);
    }
  };

  if (/fiyat|ücret|paket/.test(normalized) && !/kaldır|sil|çıkar/.test(normalized)) {
    addSection({
      id: "pricing",
      type: "pricing",
      title: "Hizmet paketleri",
      text: "İhtiyacınıza göre net ve anlaşılır seçenekler.",
      items: ["Başlangıç", "Profesyonel", "Size özel"],
    });
  }
  if (/galeri|fotoğraf|öncesi|sonrası/.test(normalized) && !/kaldır|sil|çıkar/.test(normalized)) {
    addSection({
      id: "gallery",
      type: "gallery",
      title: "Çalışmalarımız",
      text: "İşletmemizden seçili çalışmalar.",
    });
  }
  if (/yorum/.test(normalized) && !/kaldır|sil|çıkar/.test(normalized)) {
    addSection({
      id: "testimonials",
      type: "testimonials",
      title: "Müşterilerimiz anlatıyor",
      text: "Yayınlama izni alınmış gerçek müşteri deneyimlerini buraya ekleyin.",
      items: ["Müşteri yorumunu buraya ekleyin.", "İkinci müşteri yorumunu buraya ekleyin.", "Üçüncü müşteri yorumunu buraya ekleyin."],
    });
  }

  const removableSections: Array<[RegExp, StudioSection["type"]]> = [
    [/fiyat|ücret|paket/, "pricing"],
    [/galeri|fotoğraf/, "gallery"],
    [/yorum|referans/, "testimonials"],
    [/sss|sıkça|soru/, "faq"],
    [/hakkımızda/, "about"],
  ];
  if (/kaldır|sil|çıkar/.test(normalized)) {
    removableSections.forEach(([pattern, type]) => {
      if (pattern.test(normalized)) next.sections = next.sections.filter((section) => section.type !== type);
    });
  }

  return next;
}

export function describeStudioChanges(before: StudioSite, after: StudioSite) {
  const changes: string[] = [];
  if (before.businessName !== after.businessName) changes.push("işletme adı");
  if (before.location !== after.location) changes.push("konum");
  if (before.phone !== after.phone) changes.push("telefon");
  if (before.whatsapp !== after.whatsapp) changes.push("WhatsApp numarası");
  if (before.tagline !== after.tagline) changes.push("ana başlık");
  if (before.pageMode !== after.pageMode) changes.push("sayfa yapısı");
  if (before.theme.accent !== after.theme.accent || before.theme.background !== after.theme.background) changes.push("renk ve görünüm");
  if (JSON.stringify(before.design || sectorDesigns.default) !== JSON.stringify(after.design || sectorDesigns.default)) changes.push("tema yerleşimi ve hareket");

  const beforeHero = before.sections.find((section) => section.type === "hero");
  const afterHero = after.sections.find((section) => section.type === "hero");
  if (beforeHero?.title !== afterHero?.title && !changes.includes("ana başlık")) changes.push("ana başlık");
  if (beforeHero?.text !== afterHero?.text) changes.push("giriş açıklaması");

  const beforeTypes = before.sections.map((section) => section.type);
  const afterTypes = after.sections.map((section) => section.type);
  if (beforeTypes.join("|") !== afterTypes.join("|")) changes.push("site bölümleri");

  const beforeServices = before.sections.find((section) => section.type === "services")?.items || [];
  const afterServices = after.sections.find((section) => section.type === "services")?.items || [];
  if (beforeServices.join("|") !== afterServices.join("|")) changes.push("hizmetler");

  return [...new Set(changes)];
}

export function suggestStudioInstructions(site: StudioSite, instruction = "") {
  const value = instruction.toLocaleLowerCase("tr-TR");
  if (/başl(?:ık|ığ)|hero|giriş/.test(value)) {
    return ["Başlığı ortaya al ve kısalt", "Girişi daha premium ve hareketli yap", "Başlığı sola al, açıklamayı kısalt", "Girişi tam ekran ve çarpıcı yap"];
  }
  if (/renk|tema|görünüm/.test(value)) {
    return ["Koyu, premium ve altın tonlu yap", "Açık, sade ve ferah yap", "Sektörüme uygun renkleri sen seç", "Kartları daha köşeli ve editoryal yap"];
  }
  if (/hizmet|bölüm|sayfa/.test(value)) {
    return ["Hizmetleri girişin hemen altına al", "Fiyat bölümü ekle", "Galeri bölümü ekle", "Siteyi çok sayfalı yap"];
  }
  const sector = site.sector.toLocaleLowerCase("tr-TR");
  const sectorSuggestion = /kuaför|güzellik/.test(sector)
    ? "Randevu odaklı, zarif ve editoryal yap"
    : /berber/.test(sector)
      ? "Koyu, güçlü ve premium berber teması yap"
      : /halı|temizlik/.test(sector)
        ? "Güven ve hızlı teklif odaklı yap"
        : /emlak/.test(sector)
          ? "Portföy odaklı, ferah ve lüks yap"
          : "Sektörüme uygun premium temayı uygula";
  return [sectorSuggestion, "Başlığı daha kısa yap", "Hizmetleri yukarı al", "WhatsApp numaramı ekle"];
}
