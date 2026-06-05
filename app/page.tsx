"use client";

import { useState, type ReactNode } from "react";
import { motion, AnimatePresence, type Variants } from "framer-motion";

const phone = "905515550302";

const wp = {
  genel: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. İşletmem için web sitesi hakkında bilgi almak istiyorum."
  )}`,
  demo: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. İşletmem için ücretsiz ön çalışma görmek istiyorum."
  )}`,
  web: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. İşletmem için profesyonel web sitesi yaptırmak istiyorum."
  )}`,
  ecommerce: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. Kendi markama ait e-ticaret sitesi hakkında bilgi almak istiyorum."
  )}`,
  destek: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. Yayından sonraki destek süreci hakkında bilgi almak istiyorum."
  )}`,
  guven: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. Çalışma süreci, işletme bilgileri ve güven detayları hakkında bilgi almak istiyorum."
  )}`,
  kapsam: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix üzerinden geldim. Web sitesi paket kapsamı, teslim süresi, domain ve hosting detaylarını öğrenmek istiyorum."
  )}`,
};

const img = {
  hero:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1900&q=78",
  about:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1700&q=78",
  ecommerce:
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1700&q=78",
  process:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1700&q=78",
};

type PageKey =
  | "home"
  | "hakkimizda"
  | "kapsam"
  | "surec"
  | "eticaret"
  | "referanslar"
  | "paketler"
  | "sss";

const menuItems: { label: string; key: Exclude<PageKey, "home"> }[] = [
  { label: "Hakkımızda", key: "hakkimizda" },
  { label: "Kapsam", key: "kapsam" },
  { label: "Süreç", key: "surec" },
  { label: "E-Ticaret", key: "eticaret" },
  { label: "Referanslar", key: "referanslar" },
  { label: "Paketler", key: "paketler" },
  { label: "SSS", key: "sss" },
];

const rise: Variants = {
  hidden: { opacity: 0, y: 18 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] },
  },
};

const group: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.055 },
  },
};

const openingProof = [
  {
    title: "Kiminle çalıştığını bilirsin",
    text: "Süreç WhatsApp üzerinden yazılı ve takip edilebilir şekilde ilerler.",
  },
  {
    title: "Kapsam baştan netleşir",
    text: "Sayfa, teslim, domain, hosting ve destek detayları çalışma öncesinde konuşulur.",
  },
  {
    title: "Site müşteri için hazırlanır",
    text: "Amaç yalnızca görünmek değil, ziyaretçinin sana güvenerek ulaşmasını kolaylaştırmaktır.",
  },
];

const companyFacts = [
  {
    title: "Sitemix kimdir?",
    text: "Sitemix, küçük ve orta ölçekli işletmelerin internette daha profesyonel, güvenilir ve ulaşılabilir görünmesi için web sitesi, ürün vitrini ve dijital görünürlük çözümleri hazırlayan bir hizmet markasıdır.",
  },
  {
    title: "Kim tarafından kuruldu?",
    text: "Sitemix, Hakan Benli tarafından işletmelerin daha güçlü bir dijital görünüme sahip olması ve müşteriye daha güven veren web yapılarıyla tanıtılması amacıyla kurulmuştur.",
  },
  {
    title: "Nereden hizmet verir?",
    text: "Sitemix, Türkiye genelindeki işletmelere online çalışma modeliyle hizmet verir. Görüşme, planlama, teslim ve destek süreci WhatsApp üzerinden yazılı ve takip edilebilir şekilde yürütülür.",
  },
  {
    title: "Resmi bilgiler paylaşılır mı?",
    text: "Çalışma öncesinde talep eden müşterilerle gerekli işletme bilgileri, ödeme bilgileri ve resmi kayıt detayları şeffaf şekilde paylaşılabilir. Süreç belirsiz bırakılmaz.",
  },
];

const trustDetails = [
  {
    title: "Ulaşılabilir çalışma düzeni",
    text: "Çalışma süreci WhatsApp üzerinden net şekilde yürütülür. İstekler, teslim adımları ve düzenleme süreci açık ilerler.",
  },
  {
    title: "Şeffaf işletme bilgileri",
    text: "Çalışma öncesinde gerekli görüldüğünde işletme bilgileri, ödeme bilgileri ve resmi kayıt detayları müşteriyle paylaşılabilir.",
  },
  {
    title: "Net kapsam ve teslim süreci",
    text: "Site başlamadan önce ne yapılacağı, hangi alanların hazırlanacağı, hangi bilgilerin müşteriden isteneceği ve teslim süreci netleştirilir.",
  },
  {
    title: "Yayın sonrası destek",
    text: "Site yayına alındıktan sonra temel düzenleme, yönlendirme ve küçük güncellemeler için destek süreci devam eder.",
  },
];

const scopeDetails = [
  {
    title: "Sayfa ve içerik kapsamı",
    text: "Ana sayfa, hizmet veya ürün tanıtım alanları, iletişim yönlendirmeleri, güven bölümleri ve işletmeye göre ihtiyaç duyulan temel sayfa yapısı çalışma öncesinde belirlenir.",
  },
  {
    title: "Domain ve hosting",
    text: "Domain ve hosting ihtiyacı çalışma öncesinde netleştirilir. Müşterinin mevcut alan adı varsa ona göre ilerlenir; yoksa uygun kurulum yöntemi ayrıca konuşulur.",
  },
  {
    title: "Revize ve düzenleme",
    text: "İlk teslim sonrası temel düzenleme talepleri alınır. Büyük kapsam değişiklikleri ayrıca değerlendirilir; küçük metin, görsel ve yönlendirme düzenlemelerinde destek verilir.",
  },
  {
    title: "Teslim ve yayın",
    text: "Teslim süresi işin kapsamına göre belirlenir. Çalışma başlamadan önce hangi bilgilerin gerektiği, ne zaman ön izleme sunulacağı ve yayın adımı netleştirilir.",
  },
];

const process = [
  "İşletme, hedef müşteri ve hizmet yapısı analiz edilir.",
  "Sayfanın dili, müşterinin karar verme sürecine göre hazırlanır.",
  "İlk ekran güven, açıklık ve iletişim aksiyonu üzerine kurulur.",
  "Hizmet, süreç, fiyat başlangıcı, referans ve sık sorulanlar netleştirilir.",
  "WhatsApp, arama, konum ve sipariş yönlendirmeleri bağlanır.",
  "Mobil görünüm özel olarak kontrol edilir.",
  "Yayın sonrası temel düzenleme ve yönlendirme desteği verilir.",
];

const ecommercePoints = [
  "Ürünlerin kendi markana ait sitede görünür.",
  "Müşteri doğrudan işletmene ulaşır.",
  "Sipariş süreci WhatsApp üzerinden ilerleyebilir.",
  "Kendi reklamını kendi sayfana verebilirsin.",
  "Marka algısı pazar yeri sayfasına göre daha güçlü olur.",
];

const references = [
  {
    name: "Müjde Hair Beauty",
    sector: "Güzellik Salonu",
    text: "Randevu ve hizmet güveni odaklı web yapısı.",
    url: "https://www.mujdehairbeauty.com.tr/",
  },
  {
    name: "Beyza Nails",
    sector: "Nail Studio",
    text: "Mobilde hızlı anlaşılan hizmet ve iletişim akışı.",
    url: "https://www.beyzanails.com.tr",
  },
  {
    name: "İncek Ender Perde",
    sector: "Perde Mağazası",
    text: "Yerel arama ve WhatsApp talebi toplamaya uygun yapı.",
    url: "https://www.incekenderperde.com",
  },
  {
    name: "Naturel Peruk",
    sector: "Ürün Tanıtımı",
    text: "Ürün güveni ve sipariş yönlendirmesi odaklı vitrin.",
    url: "https://www.naturelperuk.com",
  },
  {
    name: "By Willy Belek Kuaför",
    sector: "Kuaför",
    text: "Hizmet, konum ve randevu akışını net gösteren yapı.",
    url: "https://www.bywillybelekkuafor.com.tr/",
  },
  {
    name: "Özdurmuş Hidrolik",
    sector: "Teknik Servis",
    text: "Teknik hizmetleri sade ve güven veren dille anlatan sayfa.",
    url: "https://www.ozdurmushidrolik.com.tr/",
  },
  {
    name: "Dekorasyoncum",
    sector: "Dekorasyon",
    text: "Ürün, uygulama ve katalog inceleme akışını netleştiren yapı.",
    url: "https://www.dekorasyoncum.com.tr/",
  },
  {
    name: "Kervan Döner",
    sector: "Restoran",
    text: "Menü, konum ve sipariş akışını hızlı gösteren restoran sayfası.",
    url: "https://www.kervandoner.com/",
  },
  {
    name: "Engelli Taşıma",
    sector: "Ulaşım Hizmeti",
    text: "Hizmeti güvenli, net ve randevulu iletişime uygun anlatan yapı.",
    url: "https://www.engellitasima.com/",
  },
];

const packages = [
  {
    title: "Kurumsal Web Sitesi",
    price: "3.999 TL’den başlayan",
    desc: "İşletmenin internette güvenilir görünmesi, hizmetlerini net anlatması ve müşteriyi hızlıca iletişime taşıması için hazırlanır.",
    href: wp.web,
    features: [
      "Sektöre özel ana sayfa",
      "Mobil uyumlu profesyonel yapı",
      "WhatsApp, arama ve konum bağlantıları",
      "Hizmet ve güven bölümleri",
      "Temel Google uyumlu yapı",
      "Yayından sonra temel destek",
    ],
    details: [
      "Küçük işletmeler ve hizmet veren firmalar için uygundur.",
      "İletişim, konum, WhatsApp ve hizmet anlatımı önceliklidir.",
      "Kapsam çalışma öncesinde netleştirilir.",
    ],
  },
  {
    title: "Kişiye Özel E-Ticaret",
    price: "5.999 TL’den başlayan",
    desc: "Ürünlerini kendi markana ait sitede göstermek, müşteriyle doğrudan iletişim kurmak ve siparişi WhatsApp üzerinden almak için hazırlanır.",
    href: wp.ecommerce,
    features: [
      "Ürün vitrin sistemi",
      "Kategori ve ürün alanları",
      "WhatsApp sipariş akışı",
      "Markaya özel satış sayfası",
      "Reklama uygun ürün yapısı",
      "Komisyonsuz satış mantığı",
    ],
    details: [
      "Başlangıç seviyesi ürün vitrini mantığıyla hazırlanır.",
      "Online ödeme yerine WhatsApp sipariş akışı tercih edilebilir.",
      "Ürün adedi ve kategori kapsamı iş başlamadan netleştirilir.",
    ],
  },
  {
    title: "Web + Büyüme Sistemi",
    price: "7.999 TL’den başlayan",
    desc: "Reklam, sosyal medya ve Google’dan gelen müşteriyi karşılayacak daha güçlü bir dijital yapı isteyen işletmeler için hazırlanır.",
    href: wp.demo,
    features: [
      "Dönüşüm odaklı ilk ekran",
      "Reklama uygun sayfa akışı",
      "Hazır WhatsApp mesajları",
      "Güven ve itiraz karşılama alanları",
      "Mobil aksiyon düzeni",
      "Yayın sonrası yönlendirme",
    ],
    details: [
      "Reklamdan gelen ziyaretçiyi karşılamaya uygun hazırlanır.",
      "Güven, açıklama, referans ve iletişim akışı birlikte düşünülür.",
      "İçerik dili müşteri karar sürecine göre düzenlenir.",
    ],
  },
];

const faq = [
  {
    q: "Web sitesi tek başına müşteri getirir mi?",
    a: "Tek başına mucize yaratmaz. Fakat doğru hazırlanmış bir site; reklamdan, sosyal medyadan veya Google’dan gelen kişiyi daha güvenli karşılar ve iletişime geçme ihtimalini artırır.",
  },
  {
    q: "Neden hazır şablon yerine özel yapı gerekiyor?",
    a: "Çünkü her sektörün müşterisi aynı şekilde karar vermez. Bir güzellik salonu, teknik servis, temizlik firması, mağaza veya ürün satan işletme aynı dille anlatılamaz.",
  },
  {
    q: "E-ticaret sitesinde ödeme sistemi olmak zorunda mı?",
    a: "Hayır. Başlangıç için ürünler sitede gösterilir, sipariş WhatsApp üzerinden alınabilir. Bu, küçük işletmeler için daha hızlı ve daha pratik bir modeldir.",
  },
  {
    q: "Domain ve hosting dahil mi?",
    a: "Domain ve hosting durumu çalışma öncesinde netleştirilir. Mevcut alan adınız varsa ona göre ilerlenir; yoksa uygun kurulum yöntemi ayrıca konuşulur.",
  },
  {
    q: "Yayından sonra destek veriliyor mu?",
    a: "Evet. Site yayına çıktıktan sonra temel düzenleme, yönlendirme ve gerekli küçük güncellemeler tarafında destek verilir.",
  },
  {
    q: "Çalışma öncesi resmi bilgi paylaşılır mı?",
    a: "Evet. Talep eden müşterilerle gerekli işletme bilgileri, ödeme bilgileri ve çalışma süreci şeffaf şekilde paylaşılabilir.",
  },
];

function PrimaryButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#102018] px-6 text-center text-[14px] font-black leading-none text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#1d342a] md:min-h-[56px] md:px-8"
    >
      <span className="block whitespace-nowrap text-white">{children}</span>
    </a>
  );
}

function GreenButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-[#1f6b43] px-6 text-center text-[14px] font-black leading-none text-white shadow-xl shadow-[#1f6b43]/20 transition hover:-translate-y-0.5 hover:bg-[#185735] md:min-h-[56px] md:px-8"
    >
      <span className="block whitespace-nowrap text-white">{children}</span>
    </a>
  );
}

function LightButton({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[52px] items-center justify-center rounded-full bg-white px-6 text-center text-[14px] font-black leading-none text-[#102018] shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#f4f4f0] md:min-h-[56px] md:px-8"
    >
      <span className="block whitespace-nowrap text-[#102018]">{children}</span>
    </a>
  );
}

function PageShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <motion.section
      key={title}
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -14 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className="relative z-10 min-h-screen px-4 pb-28 pt-28 md:px-8 md:pb-16 md:pt-32"
    >
      <div className="mx-auto max-w-7xl">
        <div className="mb-10 border-b border-[#102018]/10 pb-8">
          <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
            {eyebrow}
          </p>

          <h1 className="mt-4 max-w-5xl text-4xl font-black leading-tight tracking-[-0.06em] text-[#102018] md:text-6xl">
            {title}
          </h1>
        </div>

        {children}
      </div>
    </motion.section>
  );
}

function NumberedList({
  items,
}: {
  items: { title: string; text: string }[];
}) {
  return (
    <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
      {items.map((item, index) => (
        <div
          key={item.title}
          className="grid gap-4 py-6 md:grid-cols-[90px_0.85fr_1.15fr]"
        >
          <span className="text-sm font-black text-[#1f6b43]">
            0{index + 1}
          </span>

          <h3 className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#102018]">
            {item.title}
          </h3>

          <p className="text-sm leading-7 text-[#102018]/62 md:text-base">
            {item.text}
          </p>
        </div>
      ))}
    </div>
  );
}

function TextRows({ items }: { items: string[] }) {
  return (
    <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
      {items.map((item) => (
        <div key={item} className="flex gap-3 py-4">
          <span className="font-black text-[#1f6b43]">✓</span>
          <p className="text-sm font-bold leading-7 text-[#102018]/68">
            {item}
          </p>
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [page, setPage] = useState<PageKey>("home");

  const goToPage = (nextPage: PageKey) => {
    setPage(nextPage);
    setMenuOpen(false);

    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const renderPage = () => {
    if (page === "home") {
      return (
        <motion.section
          key="home"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -14 }}
          transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
          className="relative z-10 flex min-h-[100svh] items-center overflow-hidden px-4 pb-[84px] pt-[78px] md:px-8 md:pb-8 md:pt-28"
        >
          <div className="mx-auto w-full max-w-7xl">
            <motion.div
              variants={group}
              initial="hidden"
              animate="show"
              className="grid gap-6 lg:grid-cols-[0.7fr_1.3fr] lg:items-stretch"
            >
              <motion.aside
                variants={rise}
                className="hidden flex-col justify-between border-y border-[#102018]/10 py-7 lg:flex"
              >
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.28em] text-[#1f6b43]">
                    Sitemix nedir?
                  </p>

                  <h2 className="mt-4 text-4xl font-black leading-tight tracking-[-0.055em] text-[#102018]">
                    İşletmenin internette güven veren yüzünü kuran web hizmet
                    markası.
                  </h2>

                  <p className="mt-5 text-base leading-7 text-[#102018]/62">
                    Web sitesi, ürün vitrini, WhatsApp yönlendirmesi, temel
                    Google uyumu ve yayın sonrası destek tek bir çalışma
                    sürecinde planlanır.
                  </p>
                </div>

                <div className="mt-8 divide-y divide-[#102018]/10 border-y border-[#102018]/10">
                  {openingProof.map((item, index) => (
                    <div key={item.title} className="grid gap-3 py-5">
                      <span className="text-sm font-black text-[#1f6b43]">
                        0{index + 1}
                      </span>

                      <div>
                        <h3 className="text-xl font-black tracking-[-0.035em] text-[#102018]">
                          {item.title}
                        </h3>
                        <p className="mt-2 text-sm leading-6 text-[#102018]/58">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.aside>

              <motion.div variants={rise}>
                <div className="relative overflow-hidden rounded-[30px] bg-[#102018] shadow-2xl shadow-black/20 md:rounded-[42px]">
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-24 md:opacity-32"
                    style={{ backgroundImage: `url(${img.hero})` }}
                  />
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(199,237,144,0.22),transparent_32%),linear-gradient(135deg,rgba(16,32,24,0.98)_0%,rgba(16,32,24,0.92)_50%,rgba(16,32,24,0.72)_100%)]" />

                  <div className="relative flex min-h-[calc(100svh-176px)] flex-col justify-between gap-5 p-5 text-white sm:p-7 md:min-h-[620px] md:p-10 lg:p-12">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-[#c7ed90] px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-[#102018] sm:px-4 sm:text-xs">
                        Profesyonel web çözümü
                      </span>

                      <span className="rounded-full border border-white/18 px-3 py-2 text-[10px] font-black uppercase tracking-[0.15em] text-white/72 sm:px-4 sm:text-xs">
                        Online çalışma
                      </span>
                    </div>

                    <div>
                      <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#c7ed90] sm:text-sm">
                        İşletmeler için dijital güven noktası
                      </p>

                      <h1 className="mt-4 max-w-5xl text-[clamp(32px,9vw,58px)] font-black leading-[0.96] tracking-[-0.07em] text-white md:text-[86px]">
                        Müşteri seni aradığında, karşısına güven veren bir
                        işletme çıkmalı.
                      </h1>

                      <p className="mt-5 max-w-3xl text-sm leading-7 text-white/70 md:text-lg md:leading-8">
                        Sitemix; işletmeler için kurumsal web sitesi, ürün
                        vitrini ve WhatsApp odaklı iletişim yapıları hazırlar.
                        Amaç, müşterinin seni daha ciddi görmesi ve sana kolayca
                        ulaşmasıdır.
                      </p>

                      <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] font-bold text-white/72 sm:flex sm:flex-wrap sm:text-sm">
                        {[
                          "3.999 TL’den başlayan",
                          "WhatsApp yönlendirmesi",
                          "Kapsam baştan net",
                          "Yayın sonrası destek",
                        ].map((item) => (
                          <span
                            key={item}
                            className="rounded-full border border-white/12 bg-white/7 px-3 py-2"
                          >
                            {item}
                          </span>
                        ))}
                      </div>

                      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                        <LightButton href={wp.demo}>
                          Ücretsiz Ön Çalışma İste
                        </LightButton>
                        <GreenButton href={wp.genel}>
                          WhatsApp’tan Bilgi Al
                        </GreenButton>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-white/14 pt-4">
                      {[
                        ["3.999 TL", "web"],
                        ["5.999 TL", "e-ticaret"],
                        ["7.999 TL", "büyüme"],
                      ].map(([value, label]) => (
                        <div key={value}>
                          <p className="text-lg font-black tracking-[-0.04em] text-white sm:text-2xl md:text-3xl">
                            {value}
                          </p>
                          <p className="mt-1 text-[10px] font-bold uppercase tracking-[0.14em] text-white/45 sm:text-xs">
                            {label}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          </div>
        </motion.section>
      );
    }

    if (page === "hakkimizda") {
      return (
        <PageShell
          eyebrow="Sitemix Kimdir?"
          title="Kiminle çalıştığını bilmek, müşteri için güvenin başlangıcıdır."
        >
          <div className="grid gap-10">
            <p className="max-w-4xl text-base leading-8 text-[#102018]/66 md:text-lg">
              Sitemix, küçük ve orta ölçekli işletmelerin internette daha
              profesyonel, güvenilir ve ulaşılabilir görünmesi için web sitesi,
              ürün vitrini ve dijital görünürlük çözümleri hazırlar.
            </p>

            <NumberedList items={companyFacts} />

            <div className="grid gap-10 lg:grid-cols-[0.95fr_1.05fr] lg:items-center">
              <div
                className="min-h-[430px] rounded-[36px] bg-cover bg-center shadow-2xl shadow-black/14"
                style={{ backgroundImage: `url(${img.about})` }}
              />

              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#1f6b43]">
                  Güven ve şeffaflık
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.05em] text-[#102018] md:text-5xl">
                  Süreç başlamadan önce kapsam, ödeme ve teslim adımları
                  konuşulur.
                </h2>

                <div className="mt-6">
                  <NumberedList items={trustDetails} />
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <GreenButton href={wp.guven}>Güven Detaylarını Sor</GreenButton>
              <PrimaryButton href={wp.demo}>Ön Çalışma İste</PrimaryButton>
            </div>
          </div>
        </PageShell>
      );
    }

    if (page === "kapsam") {
      return (
        <PageShell
          eyebrow="Kapsam"
          title="Başlamadan önce neyin dahil olduğu netleşir."
        >
          <div className="grid gap-10">
            <p className="max-w-4xl text-base leading-8 text-[#102018]/66 md:text-lg">
              Web sitesi yaptırırken en önemli konulardan biri belirsizliktir.
              Sitemix’te sayfa kapsamı, teslim süreci, düzenleme hakkı, domain,
              hosting ve destek tarafı çalışma başlamadan önce açıkça konuşulur.
            </p>

            <NumberedList items={scopeDetails} />

            <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.24em] text-[#1f6b43]">
                  Netlik
                </p>

                <h2 className="mt-3 text-3xl font-black leading-tight tracking-[-0.05em] text-[#102018] md:text-5xl">
                  Müşteri neye ödeme yaptığını bilmelidir.
                </h2>
              </div>

              <TextRows
                items={[
                  "Hangi sayfaların hazırlanacağı çalışma öncesinde belirlenir.",
                  "Müşteriden hangi bilgi, görsel veya logo isteneceği açıkça söylenir.",
                  "Domain ve hosting tarafı mevcut duruma göre netleştirilir.",
                  "Revize ve düzenleme kapsamı teslim öncesi konuşulur.",
                  "Yayın sonrası temel destek süreci müşteriye önceden anlatılır.",
                ]}
              />
            </div>

            <PrimaryButton href={wp.kapsam}>Paket Kapsamını Sor</PrimaryButton>
          </div>
        </PageShell>
      );
    }

    if (page === "surec") {
      return (
        <PageShell
          eyebrow="Çalışma Süreci"
          title="Baştan sona düzenli, anlaşılır ve kontrollü ilerler."
        >
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
            <div
              className="min-h-[460px] rounded-[36px] bg-cover bg-center shadow-2xl shadow-black/14"
              style={{ backgroundImage: `url(${img.process})` }}
            />

            <div>
              <p className="text-base leading-8 text-[#102018]/66 md:text-lg">
                İş sadece sayfa hazırlamak değildir. Önce işletmenin ihtiyacı
                anlaşılır, sonra müşterinin görmek isteyeceği yapı hazırlanır.
              </p>

              <div className="mt-7 divide-y divide-[#102018]/10 border-y border-[#102018]/10">
                {process.map((item, index) => (
                  <div
                    key={item}
                    className="grid gap-4 py-5 md:grid-cols-[90px_1fr]"
                  >
                    <span className="text-sm font-black text-[#1f6b43]">
                      0{index + 1}
                    </span>

                    <p className="text-xl font-black leading-snug tracking-[-0.035em] text-[#102018]">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <PrimaryButton href={wp.destek}>
                  Destek Sürecini Sor
                </PrimaryButton>
              </div>
            </div>
          </div>
        </PageShell>
      );
    }

    if (page === "eticaret") {
      return (
        <PageShell
          eyebrow="E-Ticaret"
          title="Ürünlerini kendi markana ait bir vitrinde göster."
        >
          <div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div
              className="min-h-[460px] rounded-[36px] bg-cover bg-center shadow-2xl shadow-black/14"
              style={{ backgroundImage: `url(${img.ecommerce})` }}
            />

            <div>
              <p className="text-base leading-8 text-[#102018]/66 md:text-lg">
                Küçük işletmeler için başlangıçta karmaşık ödeme sistemleri şart
                değildir. Ürünler profesyonel şekilde sergilenebilir, müşteri
                WhatsApp üzerinden siparişe yönlendirilebilir.
              </p>

              <div className="mt-7">
                <TextRows items={ecommercePoints} />
              </div>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <GreenButton href={wp.ecommerce}>
                  E-Ticaret İçin Bilgi Al
                </GreenButton>
                <PrimaryButton href={wp.demo}>Ön Çalışma İste</PrimaryButton>
              </div>
            </div>
          </div>
        </PageShell>
      );
    }

    if (page === "referanslar") {
      return (
        <PageShell
          eyebrow="Referanslar"
          title="Farklı sektörlerde yayına alınmış web çalışmaları."
        >
          <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
            {references.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-3 py-6 transition hover:bg-white/40 md:grid-cols-[1fr_190px_1.2fr_100px] md:items-center md:px-4"
              >
                <h3 className="text-xl font-black tracking-[-0.035em] text-[#102018] md:text-2xl">
                  {item.name}
                </h3>

                <span className="text-sm font-bold text-[#1f6b43]">
                  {item.sector}
                </span>

                <p className="text-sm leading-6 text-[#102018]/58">
                  {item.text}
                </p>

                <span className="text-sm font-black text-[#102018]/45 transition group-hover:text-[#1f6b43]">
                  İncele →
                </span>
              </a>
            ))}
          </div>
        </PageShell>
      );
    }

    if (page === "paketler") {
      return (
        <PageShell
          eyebrow="Paketler"
          title="İşletmenin ihtiyacına göre doğru yapı seçilir."
        >
          <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
            {packages.map((item, index) => (
              <div key={item.title} className="grid gap-8 py-10">
                <div className="grid gap-5 md:grid-cols-[90px_1fr]">
                  <span className="text-sm font-black text-[#1f6b43]">
                    0{index + 1}
                  </span>

                  <div>
                    <p className="text-lg font-black text-[#1f6b43]">
                      {item.price}
                    </p>

                    <h2 className="mt-2 text-3xl font-black leading-tight tracking-[-0.05em] text-[#102018] md:text-5xl">
                      {item.title}
                    </h2>

                    <p className="mt-4 max-w-3xl text-sm leading-7 text-[#102018]/60 md:text-base">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="grid gap-8 lg:grid-cols-[1fr_1fr_220px] lg:items-start">
                  <TextRows items={item.features} />

                  <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
                    {item.details.map((detail) => (
                      <div key={detail} className="py-4">
                        <p className="text-sm leading-7 text-[#102018]/58">
                          {detail}
                        </p>
                      </div>
                    ))}
                  </div>

                  <PrimaryButton href={item.href}>Bilgi Al</PrimaryButton>
                </div>
              </div>
            ))}
          </div>
        </PageShell>
      );
    }

    return (
      <PageShell
        eyebrow="Sık Sorulanlar"
        title="Karar vermeden önce bilinmesi gerekenler."
      >
        <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
          {faq.map((item) => (
            <div key={item.q} className="py-7">
              <h2 className="text-xl font-black tracking-[-0.035em] text-[#102018] md:text-2xl">
                {item.q}
              </h2>

              <p className="mt-3 max-w-4xl text-sm leading-7 text-[#102018]/62 md:text-base">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </PageShell>
    );
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe4] text-[#102018]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(31,107,67,0.16),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(214,150,76,0.18),transparent_30%),linear-gradient(180deg,#fbf7ee_0%,#eee0ca_48%,#f7f1e7_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[580px] bg-gradient-to-b from-white/72 to-transparent" />
      </div>

      <header className="fixed left-0 top-0 z-50 w-full border-b border-[#102018]/10 bg-[#fbf7ee]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <button
            type="button"
            onClick={() => goToPage("home")}
            className="flex items-center gap-3 text-left"
          >
            <div className="relative grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-full bg-[#102018]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(199,237,144,0.9),transparent_42%),radial-gradient(circle_at_bottom_right,rgba(235,148,66,0.78),transparent_44%)]" />
              <span className="relative text-lg font-black text-white">S</span>
            </div>

            <div className="leading-tight">
              <p className="text-sm font-black tracking-wide text-[#102018]">
                Sitemix
              </p>
              <p className="text-[11px] font-bold text-[#102018]/52">
                Dijital varlık ve web çözümleri
              </p>
            </div>
          </button>

          <nav className="hidden items-center gap-2 md:flex">
            {menuItems.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => goToPage(item.key)}
                className={`rounded-full px-4 py-2 text-sm font-black transition ${
                  page === item.key
                    ? "bg-[#102018] text-white"
                    : "text-[#102018]/58 hover:bg-white hover:text-[#102018]"
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <a
              href={wp.demo}
              className="hidden min-h-[46px] items-center justify-center rounded-full bg-[#102018] px-6 text-center text-sm font-black leading-none text-white shadow-lg shadow-black/10 transition hover:bg-[#1d342a] sm:inline-flex"
            >
              <span className="whitespace-nowrap text-white">
                Ön Çalışma İste
              </span>
            </a>

            <button
              type="button"
              onClick={() => setMenuOpen((value) => !value)}
              className="grid h-11 w-11 place-items-center rounded-full border border-[#102018]/12 bg-white text-xl font-black text-[#102018]"
              aria-label="Menüyü aç"
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
              className="border-t border-[#102018]/10 bg-[#fbf7ee] px-4 py-4 shadow-xl shadow-black/5"
            >
              <div className="mx-auto grid max-w-7xl gap-2 md:grid-cols-4">
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    type="button"
                    onClick={() => goToPage(item.key)}
                    className={`min-h-[48px] rounded-full px-5 text-left text-sm font-black shadow-sm transition md:text-center ${
                      page === item.key
                        ? "bg-[#102018] text-white"
                        : "bg-white text-[#102018] hover:bg-[#102018] hover:text-white"
                    }`}
                  >
                    {item.label}
                  </button>
                ))}

                <a
                  href={wp.genel}
                  className="inline-flex min-h-[48px] items-center justify-center rounded-full bg-[#1f6b43] px-5 text-sm font-black text-white shadow-sm"
                >
                  <span className="text-white">WhatsApp’tan Yaz</span>
                </a>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <AnimatePresence mode="wait">{renderPage()}</AnimatePresence>

      <a
        href={wp.demo}
        className="fixed left-4 right-4 z-50 inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#1f6b43] px-5 text-center text-sm font-black leading-none text-white shadow-2xl shadow-[#1f6b43]/25 transition hover:bg-[#185735] md:left-auto md:right-6 md:min-h-[52px] md:w-auto md:px-7"
        style={{
          bottom: "calc(16px + env(safe-area-inset-bottom))",
        }}
      >
        <span className="whitespace-nowrap text-white">
          Ücretsiz Ön Çalışma İste
        </span>
      </a>
    </main>
  );
}