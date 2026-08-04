import { sectorCatalog } from "@/lib/sitemixStudio";

export type BriefField = "sector" | "businessName" | "location" | "services" | "businessDetails" | "goal" | "contact" | "style" | "photos" | "pageMode";

export type StudioBrief = {
  sectorId?: string;
  sectorLabel?: string;
  businessName?: string;
  location?: string;
  services: string[];
  businessDetails?: string;
  goal?: string;
  phone?: string;
  whatsapp?: string;
  contactSkipped?: boolean;
  style?: string;
  photoPreference?: "upload" | "placeholder" | "later";
  pageMode?: "single" | "multi";
  lastQuestion?: BriefField;
  notes: string[];
};

export type ConversationResult = {
  brief: StudioBrief;
  reply: string;
  quickReplies: string[];
  ready: boolean;
  shouldBuild: boolean;
  progress: number;
  learned: string[];
};

export const emptyStudioBrief: StudioBrief = { services: [], notes: [] };

const requiredFields: BriefField[] = ["sector", "businessName", "location", "services", "businessDetails", "goal", "contact", "style", "photos", "pageMode"];

const greetings = /^(merhaba|selam|selamlar|hey|iyi günler|iyi akşamlar|günaydın|mrb)[.!\s]*$/i;
const buildRequest = /(taslağ[ıi]?|siteyi|sitemi).*(oluştur|hazırla|göster)|(oluştur|hazırla).*(taslağ[ıi]?|siteyi|sitemi)|^hazırım$|^başla$/i;

function clean(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function titleCase(value: string) {
  return clean(value)
    .split(" ")
    .slice(0, 8)
    .map((part) => part.charAt(0).toLocaleUpperCase("tr-TR") + part.slice(1))
    .join(" ");
}

function normalized(value: string) {
  return value.toLocaleLowerCase("tr-TR");
}

function directAnswer(message: string) {
  return clean(message.replace(/^(bence|olsun|istiyorum|tercihim|cevap)\s*[:,-]?\s*/i, ""));
}

function splitServices(value: string) {
  return value
    .replace(/^(hizmetlerim|hizmetlerimiz|hizmetler|şunlar|başlıca)\s*[:,-]?\s*/i, "")
    .split(/,|;|\s+ve\s+/i)
    .map((item) => clean(item))
    .filter((item) => item.length > 1 && item.length < 60)
    .slice(0, 8);
}

function findSector(message: string) {
  const value = normalized(message);
  return sectorCatalog.find((sector) =>
    sector.keywords.some((keyword) => value.includes(normalized(keyword))) || value.includes(normalized(sector.label)),
  );
}

function inferGoal(message: string) {
  const value = normalized(message);
  if (/whatsapp|mesaj|yazsın|teklif/.test(value)) return "WhatsApp üzerinden talep toplamak";
  if (/randevu|rezervasyon/.test(value)) return "Randevu almak";
  if (/ara(sın|ma)|telefon/.test(value)) return "Telefon araması almak";
  if (/satış|satmak|sipariş/.test(value)) return "Satış ve sipariş almak";
  if (/tanıt|portföy|güven|kurumsal/.test(value)) return "İşletmeyi profesyonel biçimde tanıtmak";
  return undefined;
}

function inferStyle(message: string) {
  const value = normalized(message);
  const words = ["modern", "sade", "şık", "lüks", "kurumsal", "samimi", "renkli", "minimal", "koyu", "açık", "enerjik", "elegant", "güçlü", "güven veren"];
  const found = words.filter((word) => value.includes(word));
  const color = value.match(/(mor|mavi|yeşil|pembe|turuncu|kırmızı|bordo|siyah|beyaz|altın)(?:\s+ton(?:ları|larda)?)?/i)?.[0];
  if (!found.length && !color) return undefined;
  return titleCase([...found, ...(color ? [color] : [])].join(", "));
}

function inferBusinessDetails(message: string) {
  const explicit = message.match(/(?:neden bizi tercih etsinler|bizi farklı yapan|farkımız|avantajımız|öne çıkan yönümüz|işletme hakkında)\s*[:,-]?\s*([^\n]{8,360})/i)?.[1];
  if (explicit) return clean(explicit);
  return undefined;
}

function fieldDone(brief: StudioBrief, field: BriefField) {
  if (field === "sector") return Boolean(brief.sectorLabel);
  if (field === "services") return brief.services.length > 0;
  if (field === "contact") return Boolean(brief.phone || brief.whatsapp || brief.contactSkipped);
  if (field === "photos") return Boolean(brief.photoPreference);
  return Boolean(brief[field]);
}

export function getBriefProgress(brief: StudioBrief) {
  const completed = requiredFields.filter((field) => fieldDone(brief, field)).length;
  return Math.round((completed / requiredFields.length) * 100);
}

export function getMissingBriefFields(brief: StudioBrief) {
  return requiredFields.filter((field) => !fieldDone(brief, field));
}

function questionFor(field: BriefField, brief: StudioBrief) {
  const questions: Record<BriefField, { reply: string; quickReplies: string[] }> = {
    sector: {
      reply: "Önce işletmeni tanıyayım. Hangi sektörde hizmet veriyorsun?",
      quickReplies: ["Kadın kuaförü", "Erkek berberi", "Halı yıkama", "Güzellik salonu", "Başka bir sektör"],
    },
    businessName: {
      reply: `${brief.sectorLabel || "İşletmen"} için doğru yapıyı kurabiliriz. İşletmenin veya markanın adı nedir?`,
      quickReplies: [],
    },
    location: {
      reply: `Memnun oldum, ${brief.businessName}. Hangi şehirde veya bölgede hizmet veriyorsun?`,
      quickReplies: ["Tüm Türkiye", "Sadece bulunduğum bölge", "Online hizmet veriyorum"],
    },
    services: {
      reply: `${brief.location || "Bulunduğun bölge"} için siteyi doğru kurgulayabilmem adına hizmetlerini netleştirelim. Müşterilerin en çok hangi hizmetler için sana ulaşıyor? Virgülle ayırarak yazabilirsin.`,
      quickReplies: [],
    },
    businessDetails: {
      reply: "Siteyi sıradan bir şablondan çıkaracak en önemli bilgi bu: Müşterilerin neden seni tercih etsin? Deneyim, hız, garanti, hijyen, ücretsiz servis veya sana özel başka bir farkı doğal biçimde anlatabilirsin.",
      quickReplies: ["Hızlı ve güvenilir hizmet", "Kaliteli işçilik ve garanti", "Kişiye özel ilgi", "Fiyatlarımız şeffaf", "Kendim anlatacağım"],
    },
    goal: {
      reply: "Bu sitenin senin için en önemli sonucu ne olmalı?",
      quickReplies: ["WhatsApp mesajı almak", "Randevu almak", "Telefon araması almak", "İşletmemi tanıtmak"],
    },
    contact: {
      reply: "Müşteriler sana hangi numaradan ulaşsın? Telefon ve WhatsApp numaranı yazabilirsin. Aynı numaraysa bir kez yazman yeterli.",
      quickReplies: ["Telefon ve WhatsApp aynı", "Sadece WhatsApp kullanacağım", "Şimdilik sonra ekle"],
    },
    style: {
      reply: "Ziyaretçiler sitene girdiğinde nasıl bir his alsın? Bir tarz veya renk tercihin varsa söyle.",
      quickReplies: ["Modern ve sade", "Şık ve lüks", "Kurumsal ve güven veren", "Koyu ve güçlü", "Sana bırakıyorum"],
    },
    photos: {
      reply: "Sitenin gerçek ve güven veren görünmesi için işletmenden en az bir fotoğraf önemli. Logo, mekân, ekip veya tamamlanmış çalışma görselin var mı? Taslak açılınca sana doğru yükleme alanını göstereceğim.",
      quickReplies: ["Şimdi yükleyeceğim", "Önce görselsiz taslağı göreyim", "Fotoğrafları sonra ekleyeceğim"],
    },
    pageMode: {
      reply: `${brief.services.length >= 4 ? "Hizmetlerin ayrı ayrı anlatılmaya uygun; çok sayfalı yapı daha güçlü görünebilir." : "Hizmet sayın için tek sayfalı yapı hızlı ve yeterli olabilir."} Yine de son karar senin: tek sayfalı mı, çok sayfalı mı ilerleyelim?`,
      quickReplies: [brief.services.length >= 4 ? "Çok sayfalı" : "Tek sayfalı", brief.services.length >= 4 ? "Tek sayfalı" : "Çok sayfalı", "SiteMix karar versin"],
    },
  };
  return questions[field];
}

function summary(brief: StudioBrief) {
  return [
    `${brief.businessName} için site planını tamamladım. Son kez kontrol edelim:`,
    "",
    `• Sektör: ${brief.sectorLabel}`,
    `• Hizmet bölgesi: ${brief.location}`,
    `• Hizmetler: ${brief.services.join(", ")}`,
    `• Ana hedef: ${brief.goal}`,
    `• Öne çıkan yön: ${brief.businessDetails}`,
    `• İletişim: ${brief.whatsapp || brief.phone || "Daha sonra eklenecek"}`,
    `• Görsel tarz: ${brief.style}`,
    `• Fotoğraflar: ${brief.photoPreference === "upload" ? "Taslak açılınca yüklenecek" : brief.photoPreference === "later" ? "Daha sonra eklenecek" : "Görsel alanları hazır bırakılacak"}`,
    `• Site yapısı: ${brief.pageMode === "multi" ? "Çok sayfalı" : "Tek sayfalı"}`,
    "",
    "Bilgiler doğruysa taslağı oluşturabilirim. Değişiklik varsa önce onu düzeltelim.",
  ].join("\n");
}

export function advanceStudioConversation(current: StudioBrief, rawMessage: string): ConversationResult {
  const message = clean(rawMessage).slice(0, 1200);
  const value = normalized(message);
  const brief: StudioBrief = { ...current, services: [...current.services], notes: [...current.notes, message].slice(-30) };
  const learned: string[] = [];

  const requestedChange: BriefField | undefined = /işletme ad/i.test(value)
    ? "businessName"
    : /konum|şehir|bölge/i.test(value)
      ? "location"
      : /telefon|whatsapp|numara/i.test(value) && /değiştir/i.test(value)
        ? "contact"
      : /hizmet/i.test(value) && /değiştir/i.test(value)
        ? "services"
        : /fark|avantaj|neden.*tercih/i.test(value) && /değiştir/i.test(value)
          ? "businessDetails"
        : /hedef/i.test(value) && /değiştir/i.test(value)
          ? "goal"
          : /tarz|renk|görünüm/i.test(value) && /değiştir/i.test(value)
            ? "style"
            : /sayfa yap/i.test(value) && /değiştir/i.test(value)
              ? "pageMode"
              : /fotoğraf|görsel|logo/i.test(value) && /değiştir/i.test(value)
                ? "photos"
              : /sektör/i.test(value) && /değiştir/i.test(value)
                ? "sector"
                : undefined;

  if (requestedChange && /değiştir(?:eceğim|mek|elim)?/i.test(value)) {
    if (requestedChange === "sector") {
      brief.sectorId = undefined;
      brief.sectorLabel = undefined;
    } else if (requestedChange === "services") {
      brief.services = [];
    } else if (requestedChange === "contact") {
      brief.phone = undefined;
      brief.whatsapp = undefined;
      brief.contactSkipped = false;
    } else if (requestedChange === "photos") {
      brief.photoPreference = undefined;
    } else {
      brief[requestedChange] = undefined;
    }
    brief.lastQuestion = requestedChange;
    const changeQuestion = questionFor(requestedChange, brief);
    return {
      brief,
      reply: `Tabii, bu bilgiyi yeniden netleştirelim. ${changeQuestion.reply}`,
      quickReplies: changeQuestion.quickReplies,
      ready: false,
      shouldBuild: false,
      progress: getBriefProgress(brief),
      learned,
    };
  }

  if (greetings.test(message) && !brief.sectorLabel) {
    const question = questionFor("sector", brief);
    brief.lastQuestion = "sector";
    return { brief, reply: `Merhaba, SiteMix Studio’ya hoş geldin. Ben önce işletmeni anlayacağım, sonra birlikte doğru site yapısını kuracağız.\n\n${question.reply}`, quickReplies: question.quickReplies, ready: false, shouldBuild: false, progress: 0, learned };
  }

  const sector = findSector(message);
  const canUpdateSector = !brief.sectorLabel || brief.lastQuestion === "sector" || /sektör(?:üm|ümüz)?\s*[:,-]/i.test(message);
  if (sector && brief.sectorId !== sector.id && canUpdateSector) {
    brief.sectorId = sector.id;
    brief.sectorLabel = sector.label;
    learned.push(`Sektör: ${sector.label}`);
  } else if (brief.lastQuestion === "sector" && !brief.sectorLabel && !/başka bir sektör/i.test(message)) {
    brief.sectorId = "custom";
    brief.sectorLabel = titleCase(directAnswer(message));
    learned.push(`Sektör: ${brief.sectorLabel}`);
  }

  const named = message.match(/(?:[iİ]şletme(?:min|mizin)?|marka(?:m|mız)?|şirket(?:im|imiz)?)(?:in)?\s+(?:adı|ismi)\s*[:,-]?\s*([^.!?\n]{2,60})/i)
    || message.match(/(?:adı|ismi)\s*[:,-]\s*([^.!?\n]{2,60})/i);
  if (named?.[1]) {
    brief.businessName = titleCase(named[1]);
    learned.push(`İşletme: ${brief.businessName}`);
  } else if (brief.lastQuestion === "businessName" && !brief.businessName && message.length <= 70) {
    brief.businessName = titleCase(directAnswer(message));
    learned.push(`İşletme: ${brief.businessName}`);
  }

  const located = message.match(/(?:konum|şehir|bölge|hizmet bölgesi)\s*[:,-]?\s*([^.!?\n]{2,80})/i)
    || message.match(/([\p{L}]+(?:\s+[\p{L}]+){0,2})['’]?(?:da|de|ta|te)\s+(?:hizmet|faaliyet|bulun)/iu);
  if (located?.[1]) {
    brief.location = titleCase(located[1]);
    learned.push(`Konum: ${brief.location}`);
  } else if (brief.lastQuestion === "location" && !brief.location && message.length <= 100) {
    brief.location = titleCase(directAnswer(message));
    learned.push(`Konum: ${brief.location}`);
  }

  const serviceMatch = message.match(/(?:hizmetlerim|hizmetlerimiz|başlıca hizmetler|yapıyoruz|sunuyoruz)\s*[:,-]?\s*([^.!?\n]{3,240})/i);
  if (serviceMatch?.[1]) {
    const services = splitServices(serviceMatch[1]);
    if (services.length) {
      brief.services = services;
      learned.push(`Hizmetler: ${services.join(", ")}`);
    }
  } else if (brief.lastQuestion === "services" && !brief.services.length) {
    const services = splitServices(message);
    if (services.length) {
      brief.services = services;
      learned.push(`Hizmetler: ${services.join(", ")}`);
    }
  }

  const businessDetails = inferBusinessDetails(message);
  if (businessDetails && businessDetails !== brief.businessDetails) {
    brief.businessDetails = businessDetails;
    learned.push(`İşletmenin farkı: ${businessDetails}`);
  } else if (brief.lastQuestion === "businessDetails" && !brief.businessDetails) {
    const detail = directAnswer(message);
    if (detail.length >= 3 && !/kendim anlatacağım/i.test(detail)) {
      brief.businessDetails = detail;
      learned.push(`İşletmenin farkı: ${detail}`);
    }
  }

  const goal = inferGoal(message);
  if (goal && goal !== brief.goal) {
    brief.goal = goal;
    learned.push(`Hedef: ${goal}`);
  } else if (brief.lastQuestion === "goal" && !brief.goal && message.length <= 120) {
    brief.goal = titleCase(directAnswer(message));
    learned.push(`Hedef: ${brief.goal}`);
  }

  if (brief.lastQuestion === "contact" || /telefon|whatsapp|numara/i.test(value)) {
    if (/şimdilik|sonra ekle|atla/.test(value)) {
      brief.contactSkipped = true;
      learned.push("İletişim numarası: Daha sonra eklenecek");
    } else {
      const numbers = message.match(/\+?\d[\d\s()-]{8,}\d/g)?.map((item) => clean(item)).slice(0, 2) || [];
      const explicitWhatsapp = message.match(/(?:whatsapp|wp)\s*(?:numarası)?\s*[:,-]?\s*(\+?\d[\d\s()-]{8,}\d)/i)?.[1];
      const explicitPhone = message.match(/telefon\s*(?:numarası)?\s*[:,-]?\s*(\+?\d[\d\s()-]{8,}\d)/i)?.[1];
      if (explicitPhone) brief.phone = clean(explicitPhone);
      if (explicitWhatsapp) brief.whatsapp = clean(explicitWhatsapp);
      if (!explicitPhone && !explicitWhatsapp && numbers[0]) {
        brief.phone = numbers[0];
        brief.whatsapp = numbers[0];
      } else if (numbers.length === 2) {
        brief.phone ||= numbers[0];
        brief.whatsapp ||= numbers[1];
      }
      if (brief.phone || brief.whatsapp) learned.push(`İletişim: ${brief.whatsapp || brief.phone}`);
    }
  }

  const style = inferStyle(message);
  if (style && style !== brief.style) {
    brief.style = style;
    learned.push(`Tarz: ${style}`);
  } else if (brief.lastQuestion === "style" && !brief.style) {
    brief.style = /sana bırak/i.test(message) ? "Sektöre uygun, modern ve güven veren" : titleCase(directAnswer(message));
    learned.push(`Tarz: ${brief.style}`);
  }

  if (brief.lastQuestion === "photos" || /fotoğraf|görsel|logo/i.test(value)) {
    if (/şimdi yükle|yükleyeceğim|hazır/.test(value)) brief.photoPreference = "upload";
    else if (/sonra/.test(value)) brief.photoPreference = "later";
    else if (/görselsiz|örnek alan|yer tutucu|önce.*taslak/.test(value)) brief.photoPreference = "placeholder";
    if (brief.photoPreference) learned.push(`Görseller: ${brief.photoPreference === "upload" ? "Taslak açılınca yüklenecek" : brief.photoPreference === "later" ? "Daha sonra eklenecek" : "Alanları hazır bırakılacak"}`);
  }

  if (/çok\s*sayfa|çok\s*sayfalı/i.test(value)) {
    brief.pageMode = "multi";
    learned.push("Yapı: Çok sayfalı");
  } else if (/tek\s*sayfa|tek\s*sayfalı/i.test(value)) {
    brief.pageMode = "single";
    learned.push("Yapı: Tek sayfalı");
  } else if (brief.lastQuestion === "pageMode" && /sen öner|sana bırak|sitemix karar/i.test(message)) {
    brief.pageMode = brief.services.length >= 4 ? "multi" : "single";
    learned.push(`Yapı: ${brief.pageMode === "multi" ? "Çok sayfalı" : "Tek sayfalı"} (SiteMix önerisi)`);
  }

  const missing = getMissingBriefFields(brief);
  const ready = missing.length === 0;
  const shouldBuild = ready && buildRequest.test(message);

  if (ready) {
    brief.lastQuestion = undefined;
    return {
      brief,
      reply: shouldBuild ? "Harika. Onayını aldım; şimdi bu bilgilerle ilk taslağını hazırlıyorum." : summary(brief),
      quickReplies: shouldBuild ? [] : ["Evet, taslağı oluştur", "Bir bilgiyi değiştirelim"],
      ready: true,
      shouldBuild,
      progress: 100,
      learned,
    };
  }

  const nextField = missing[0];
  brief.lastQuestion = nextField;
  const next = questionFor(nextField, brief);
  const ambiguous = current.lastQuestion === nextField && learned.length === 0;
  const acknowledgement = learned.length
    ? `${learned.length === 1 ? "Tamam, bunu not aldım" : "Güzel, bilgileri netleştirdik"}: ${learned.join(" · ")}.\n\n`
    : ambiguous
      ? nextField === "contact"
        ? "Tercihini anladım; şimdi kullanacağımız numarayı da yazar mısın? Örnek: 0555 555 55 55\n\n"
        : nextField === "businessDetails" && /kendim anlatacağım/i.test(message)
          ? "Elbette, seni dinliyorum. Müşterinin seni neden tercih etmesi gerektiğini kendi cümlelerinle anlatabilirsin.\n\n"
        : "Cevabını ilgili alana tam yerleştiremedim. Bunu mu demek istedin?\n\n"
      : "";
  return {
    brief,
    reply: `${acknowledgement}${next.reply}`,
    quickReplies: next.quickReplies,
    ready: false,
    shouldBuild: false,
    progress: getBriefProgress(brief),
    learned,
  };
}

export function composeStudioPrompt(brief: StudioBrief) {
  return [
    `İşletme adı: ${brief.businessName}.`,
    `Sektör: ${brief.sectorLabel}.`,
    `Konum: ${brief.location}.`,
    `Hizmetler: ${brief.services.join(", ")}.`,
    `İşletmenin öne çıkan yönleri: ${brief.businessDetails}.`,
    `Sitenin ana hedefi: ${brief.goal}.`,
    `Telefon: ${brief.phone || "Daha sonra eklenecek"}.`,
    `WhatsApp: ${brief.whatsapp || brief.phone || "Daha sonra eklenecek"}.`,
    `Görsel tarz: ${brief.style}.`,
    `Görsel tercihi: ${brief.photoPreference === "upload" ? "Taslak açılınca gerçek görseller yüklenecek" : brief.photoPreference === "later" ? "Görseller daha sonra eklenecek" : "Görsel alanları hazır bırakılacak"}.`,
    `Site yapısı: ${brief.pageMode === "multi" ? "çok sayfalı" : "tek sayfalı"}.`,
  ].join(" ");
}
