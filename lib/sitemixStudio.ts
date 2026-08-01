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

export type StudioSite = {
  businessName: string;
  sector: string;
  location: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  pageMode: "single" | "multi";
  theme: StudioTheme;
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
  const quoted = prompt.match(/[“\"']([^”\"']{2,40})[”\"']/)?.[1];
  if (quoted) return titleCase(quoted);

  const named = prompt.match(/(?:adı|ismim|işletmem|markam)\s*(?:is|:|de)?\s*([a-zA-ZçğıöşüÇĞİÖŞÜ0-9 ]{2,40})/i)?.[1];
  if (named) return titleCase(named.replace(/(?:için|olan|sitesi).*$/i, ""));

  return `Yeni ${sectorLabel}`;
}

function inferLocation(prompt: string) {
  const match = prompt.match(/(?:^|\s)([A-ZÇĞİÖŞÜ][a-zçğıöşü]+(?:'?[dt][ae])?)\s+(?:bir|bulunan|için)/);
  return match?.[1]?.replace(/'[dt][ae]$/i, "") || "Bulunduğunuz bölgede";
}

export function generateStudioSite(prompt: string): StudioSite {
  const normalized = prompt.toLocaleLowerCase("tr-TR");
  const sector =
    sectorCatalog.find((item) => item.keywords.some((keyword) => normalized.includes(keyword))) ||
    sectorCatalog[0];
  const businessName = inferBusinessName(prompt, sector.label);
  const location = inferLocation(prompt);
  const theme = palettes[sector.id] || palettes.default;
  const wantsPricing = /fiyat|paket|ücret/.test(normalized);
  const wantsGallery = /galeri|fotoğraf|öncesi|sonrası/.test(normalized);
  const wantsMulti = /çok sayfa|çok sayfalı|sayfalar/.test(normalized);

  const sections: StudioSection[] = [
    {
      id: "hero",
      type: "hero",
      title: sector.tagline,
      text: `${location} ${sector.label.toLocaleLowerCase("tr-TR")} hizmetleri için hızlıca bilgi alın, çalışma detaylarını görün ve WhatsApp üzerinden bize ulaşın.`,
    },
    {
      id: "services",
      type: "services",
      title: "Size nasıl yardımcı olabiliriz?",
      text: "İhtiyacınıza uygun hizmeti seçin, ayrıntıları birlikte netleştirelim.",
      items: [...sector.services],
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
    {
      id: "testimonials",
      type: "testimonials",
      title: "Müşterilerimiz ne diyor?",
      text: "Memnuniyet, işimizin en görünür sonucu.",
      items: ["Hızlı ve ilgili bir ekip.", "Süreç boyunca her şey çok açıktı.", "Sonuç beklentimizin üzerindeydi."],
    },
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
    sector: sector.label,
    location,
    tagline: sector.tagline,
    phone: "",
    whatsapp: "",
    pageMode: wantsMulti ? "multi" : "single",
    theme,
    sections,
  };
}

export function applyStudioInstruction(site: StudioSite, instruction: string): StudioSite {
  const normalized = instruction.toLocaleLowerCase("tr-TR");
  const next: StudioSite = JSON.parse(JSON.stringify(site));

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

  const addSection = (section: StudioSection) => {
    if (!next.sections.some((item) => item.type === section.type)) {
      next.sections.splice(Math.max(next.sections.length - 1, 1), 0, section);
    }
  };

  if (/fiyat|ücret|paket/.test(normalized)) {
    addSection({
      id: "pricing",
      type: "pricing",
      title: "Hizmet paketleri",
      text: "İhtiyacınıza göre net ve anlaşılır seçenekler.",
      items: ["Başlangıç", "Profesyonel", "Size özel"],
    });
  }
  if (/galeri|fotoğraf|öncesi|sonrası/.test(normalized)) {
    addSection({
      id: "gallery",
      type: "gallery",
      title: "Çalışmalarımız",
      text: "İşletmemizden seçili çalışmalar.",
    });
  }
  if (/yorum/.test(normalized)) {
    addSection({
      id: "testimonials",
      type: "testimonials",
      title: "Müşterilerimiz anlatıyor",
      text: "Gerçek deneyimlerden kısa notlar.",
      items: ["Çok memnun kaldık.", "Hızlı ve güvenilir.", "Kesinlikle tavsiye ederim."],
    });
  }

  return next;
}

