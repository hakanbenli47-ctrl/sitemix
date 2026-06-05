"use client";

import { useState } from "react";
import { motion, type Variants } from "framer-motion";

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
};

const img = {
  hero:
    "https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=78",
  meeting:
    "https://images.unsplash.com/photo-1552664730-d307ca884978?auto=format&fit=crop&w=1700&q=78",
  mobile:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1700&q=78",
  ecommerce:
    "https://images.unsplash.com/photo-1563013544-824ae1b704d3?auto=format&fit=crop&w=1700&q=78",
  support:
    "https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1700&q=78",
  about:
    "https://images.unsplash.com/photo-1521737604893-d14cc237f11d?auto=format&fit=crop&w=1700&q=78",
};

const rise: Variants = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.48, ease: [0.22, 1, 0.36, 1] },
  },
};

const group: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.07 },
  },
};

const navItems = [
  { label: "Yaklaşım", href: "#yaklasim" },
  { label: "Hakkımızda", href: "#hakkimizda" },
  { label: "Süreç", href: "#surec" },
  { label: "E-Ticaret", href: "#eticaret" },
  { label: "Referanslar", href: "#referanslar" },
  { label: "Paketler", href: "#paketler" },
];

const references = [
  {
    name: "Müjde Hair Beauty",
    sector: "Güzellik Salonu",
    url: "https://www.mujdehairbeauty.com.tr/",
  },
  {
    name: "Beyza Nails",
    sector: "Nail Studio",
    url: "https://www.beyzanails.com.tr",
  },
  {
    name: "İncek Ender Perde",
    sector: "Perde Mağazası",
    url: "https://www.incekenderperde.com",
  },
  {
    name: "Naturel Peruk",
    sector: "Ürün Tanıtımı",
    url: "https://www.naturelperuk.com",
  },
  {
    name: "By Willy Belek Kuaför",
    sector: "Kuaför",
    url: "https://www.bywillybelekkuafor.com.tr/",
  },
  {
    name: "Özdurmuş Hidrolik",
    sector: "Teknik Servis",
    url: "https://www.ozdurmushidrolik.com.tr/",
  },
  {
    name: "Dekorasyoncum",
    sector: "Dekorasyon",
    url: "https://www.dekorasyoncum.com.tr/",
  },
  {
    name: "Kervan Döner",
    sector: "Restoran",
    url: "https://www.kervandoner.com/",
  },
  {
    name: "Engelli Taşıma",
    sector: "Ulaşım Hizmeti",
    url: "https://www.engellitasima.com/",
  },
];

const approach = [
  {
    title: "İlk izlenim profesyonel olmalı",
    text: "Ziyaretçi sayfaya girdiğinde işletmenin ciddi, ulaşılabilir ve güvenilir olduğunu birkaç saniye içinde anlamalı.",
  },
  {
    title: "Mesaj net olmalı",
    text: "Site, işletmenin ne yaptığını uzun ve yoran metinlerle değil; doğrudan, sade ve karar verdiren bir dille anlatmalı.",
  },
  {
    title: "İletişim yolu kısa olmalı",
    text: "Ziyaretçi iletişime geçmek için aramak zorunda kalmamalı. WhatsApp, arama ve konum yönlendirmeleri her cihazda kolay görünmeli.",
  },
  {
    title: "Sayfa satışa hazır olmalı",
    text: "Instagram, Google, Haritalar veya reklamdan gelen kişi sayfaya düştüğünde nereden başlayacağını bilmeli.",
  },
];

const aboutTrust = [
  {
    title: "Ulaşılabilir çalışma düzeni",
    text: "Çalışma süreci WhatsApp üzerinden net şekilde yürütülür. İstekler, teslim adımları ve düzenleme süreci açık ilerler.",
  },
  {
    title: "Şeffaf işletme bilgileri",
    text: "Çalışma öncesinde gerekli görüldüğünde işletme bilgileri, ödeme bilgileri ve resmi kayıt detayları müşteriyle paylaşılabilir.",
  },
  {
    title: "Uzmanlık ve dijital deneyim",
    text: "Sayfa yalnızca görsel olarak değil; müşteri davranışı, mobil kullanım, güven dili ve iletişim yönlendirmesi düşünülerek hazırlanır.",
  },
  {
    title: "Yayın sonrası destek",
    text: "Site yayına alındıktan sonra temel düzenleme, yönlendirme ve küçük güncellemeler için destek süreci devam eder.",
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
  },
];

const faq = [
  {
    q: "Web sitesi tek başına müşteri getirir mi?",
    a: "Tek başına mucize yaratmaz. Fakat doğru hazırlanmış bir site, reklamdan, sosyal medyadan veya Google’dan gelen kişiyi daha güvenli karşılar ve iletişime geçme ihtimalini artırır.",
  },
  {
    q: "Neden hazır şablon yerine özel yapı gerekiyor?",
    a: "Çünkü her sektörün müşterisi aynı şekilde karar vermez. Bir kuaför, teknik servis, temizlik firması veya ürün satan işletme aynı dille anlatılamaz.",
  },
  {
    q: "E-ticaret sitesinde ödeme sistemi olmak zorunda mı?",
    a: "Hayır. Başlangıç için ürünler sitede gösterilir, sipariş WhatsApp üzerinden alınabilir. Bu, küçük işletmeler için daha hızlı ve daha pratik bir modeldir.",
  },
  {
    q: "Yayından sonra destek veriliyor mu?",
    a: "Evet. Site yayına çıktıktan sonra temel düzenleme, yönlendirme ve gerekli güncelleme tarafında destek verilir.",
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
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#102018] px-7 text-center text-[14px] font-black leading-none text-white shadow-xl shadow-black/15 transition hover:-translate-y-0.5 hover:bg-[#1d342a] md:min-h-[58px] md:px-8"
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
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-[#1f6b43] px-7 text-center text-[14px] font-black leading-none text-white shadow-xl shadow-[#1f6b43]/20 transition hover:-translate-y-0.5 hover:bg-[#185735] md:min-h-[58px] md:px-8"
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
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      className="inline-flex min-h-[56px] items-center justify-center rounded-full bg-white px-7 text-center text-[14px] font-black leading-none text-[#102018] shadow-xl shadow-black/10 transition hover:-translate-y-0.5 hover:bg-[#f4f4f0] md:min-h-[58px] md:px-8"
    >
      <span className="block whitespace-nowrap text-[#102018]">{children}</span>
    </a>
  );
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#f4efe4] pb-28 text-[#102018] md:pb-0">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_0%_0%,rgba(31,107,67,0.15),transparent_28%),radial-gradient(circle_at_100%_0%,rgba(214,150,76,0.16),transparent_30%),linear-gradient(180deg,#fbf7ee_0%,#eee0ca_48%,#f7f1e7_100%)]" />
        <div className="absolute inset-x-0 top-0 h-[580px] bg-gradient-to-b from-white/70 to-transparent" />
      </div>

      <header className="fixed left-0 top-0 z-50 w-full border-b border-[#102018]/10 bg-[#fbf7ee]/92 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 md:px-8">
          <a
            href="#"
            onClick={() => setMenuOpen(false)}
            className="flex items-center gap-3"
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
          </a>

          <nav className="hidden items-center gap-6 text-sm font-black text-[#102018]/56 md:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="transition hover:text-[#102018]"
              >
                {item.label}
              </a>
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
              className="grid h-11 w-11 place-items-center rounded-full border border-[#102018]/12 bg-white text-xl font-black text-[#102018] md:hidden"
              aria-label="Menüyü aç"
            >
              {menuOpen ? "×" : "☰"}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="border-t border-[#102018]/10 bg-[#fbf7ee] px-4 py-4 md:hidden">
            <div className="grid gap-1">
              {navItems.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="py-3 text-sm font-black text-[#102018]/70"
                >
                  {item.label}
                </a>
              ))}

              <a
                href={wp.demo}
                onClick={() => setMenuOpen(false)}
                className="mt-3 inline-flex min-h-[54px] items-center justify-center rounded-full bg-[#1f6b43] px-6 text-center text-sm font-black leading-none text-white"
              >
                <span className="text-white">Ön Çalışma İste</span>
              </a>
            </div>
          </div>
        )}
      </header>

      <section className="relative z-10 px-4 pb-16 pt-28 md:px-8 md:pb-24 md:pt-36">
        <div className="mx-auto max-w-7xl">
          <motion.div
            variants={group}
            initial="hidden"
            animate="show"
            className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center"
          >
            <div>
              <motion.p
                variants={rise}
                className="inline-flex items-center gap-2 rounded-full border border-[#1f6b43]/20 bg-white/70 px-4 py-2 text-xs font-black text-[#1f6b43]"
              >
                <span className="h-2 w-2 rounded-full bg-[#1f6b43]" />
                İşletmeler için profesyonel web ve dijital vitrin çözümleri
              </motion.p>

              <motion.h1
                variants={rise}
                className="mt-6 max-w-5xl text-[43px] font-black leading-[0.98] tracking-[-0.075em] text-[#102018] sm:text-6xl lg:text-[82px]"
              >
                İşletmen internette güçlü görünmeli. Müşteri sana ulaşırken
                tereddüt etmemeli.
              </motion.h1>

              <motion.p
                variants={rise}
                className="mt-7 max-w-2xl text-base leading-8 text-[#102018]/66 md:text-lg"
              >
                Sitemix, küçük ve orta ölçekli işletmeler için güven veren,
                mobilde kusursuz çalışan, WhatsApp ve arama yönlendirmeleriyle
                müşteri temasını kolaylaştıran profesyonel web siteleri hazırlar.
              </motion.p>

              <motion.div
                variants={rise}
                className="mt-9 flex flex-col gap-3 sm:flex-row"
              >
                <GreenButton href={wp.demo}>
                  Ücretsiz Ön Çalışma İste
                </GreenButton>
                <PrimaryButton href={wp.genel}>
                  WhatsApp’tan Bilgi Al
                </PrimaryButton>
              </motion.div>

              <motion.div
                variants={rise}
                className="mt-9 grid gap-3 text-sm font-bold text-[#102018]/62 sm:grid-cols-2"
              >
                {[
                  "Web sitesi 3.999 TL’den başlayan fiyatlarla",
                  "E-ticaret sitesi 5.999 TL’den başlayan fiyatlarla",
                  "WhatsApp, arama ve konum yönlendirmesi",
                  "Yayın sonrası temel destek",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#1f6b43]" />
                    <span>{item}</span>
                  </div>
                ))}
              </motion.div>
            </div>

            <motion.div
              variants={rise}
              className="relative min-h-[560px] overflow-hidden rounded-[42px] bg-[#102018] shadow-2xl shadow-black/18"
            >
              <div
                className="absolute inset-0 bg-cover bg-center opacity-44"
                style={{ backgroundImage: `url(${img.hero})` }}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-[#102018]/10 via-[#102018]/58 to-[#102018]" />

              <div className="relative flex min-h-[560px] flex-col justify-end p-7 text-white md:p-10">
                <p className="text-xs font-black uppercase tracking-[0.28em] text-[#c7ed90]">
                  Doğru web sitesi ne yapar?
                </p>

                <h2 className="mt-4 max-w-xl text-3xl font-black leading-tight tracking-[-0.05em] text-white md:text-5xl">
                  Ziyaretçiye güven verir, hizmeti anlatır ve iletişime
                  geçmesini kolaylaştırır.
                </h2>

                <div className="mt-8 divide-y divide-white/14 border-y border-white/14">
                  {[
                    "Net hizmet anlatımı",
                    "Güçlü ilk izlenim",
                    "Kolay WhatsApp yönlendirmesi",
                    "Mobilde okunur ve hızlı deneyim",
                  ].map((item, index) => (
                    <div
                      key={item}
                      className="grid grid-cols-[56px_1fr] items-center py-4"
                    >
                      <span className="text-sm font-black text-[#c7ed90]">
                        0{index + 1}
                      </span>
                      <span className="text-sm font-black text-white/84">
                        {item}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section
        id="yaklasim"
        className="relative z-10 px-4 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl border-y border-[#102018]/10 py-16">
          <div className="grid gap-12 lg:grid-cols-[0.85fr_1.15fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
                Yaklaşım
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
                Web sitesi yalnızca tanıtım alanı değildir. İşletmenin dijital
                güven noktasıdır.
              </h2>

              <p className="mt-5 text-base leading-8 text-[#102018]/62">
                Bir müşteri işletmeni araştırdığında profesyonel, düzenli ve
                ulaşılabilir bir yapı görmek ister. Sayfanın dili, görsel
                düzeni, iletişim butonları ve mobil görünümü bu güveni
                desteklemelidir.
              </p>
            </div>

            <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
              {approach.map((item, index) => (
                <div
                  key={item.title}
                  className="grid gap-5 py-7 md:grid-cols-[70px_1fr]"
                >
                  <span className="text-sm font-black text-[#1f6b43]">
                    0{index + 1}
                  </span>

                  <div>
                    <h3 className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#102018]">
                      {item.title}
                    </h3>

                    <p className="mt-3 text-sm leading-7 text-[#102018]/62 md:text-base">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1fr_0.95fr] lg:items-center">
            <div
              className="min-h-[460px] overflow-hidden rounded-[38px] bg-cover bg-center shadow-2xl shadow-black/14"
              style={{ backgroundImage: `url(${img.meeting})` }}
            />

            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
                Sayfa kurgusu
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
                Ziyaretçi sayfada kaybolmamalı. Ne yaptığını ve nasıl
                ulaşacağını hemen görmeli.
              </h2>

              <p className="mt-5 text-base leading-8 text-[#102018]/62">
                Profesyonel bir web sayfasında amaç, her şeyi üst üste koymak
                değildir. Doğru sırayla anlatmak gerekir: hizmet, güven, süreç,
                örnek işler, fiyat başlangıcı ve iletişim.
              </p>

              <div className="mt-8 divide-y divide-[#102018]/10 border-y border-[#102018]/10">
                {[
                  "İlk ekran: kısa, güçlü ve net mesaj.",
                  "Orta alan: hizmet ve güven açıklaması.",
                  "Devamı: süreç, referans ve fiyat başlangıcı.",
                  "Son alan: net WhatsApp yönlendirmesi.",
                ].map((item) => (
                  <div
                    key={item}
                    className="py-4 text-sm font-bold leading-7 text-[#102018]/68"
                  >
                    {item}
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <PrimaryButton href={wp.demo}>
                  Benim İşletmem İçin Hazırla
                </PrimaryButton>
              </div>
            </div>
          </div>
        </div>
      </section>

     <section
  id="hakkimizda"
  className="relative z-10 px-4 py-16 md:px-8 md:py-24"
>
  <div className="mx-auto max-w-7xl border-y border-[#102018]/10 py-16">
    <div className="grid gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:items-start">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
          Sitemix Kimdir?
        </p>

        <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
          Sitemix, işletmelerin internette daha güvenilir ve profesyonel görünmesi için kurulmuş bir web hizmet markasıdır.
        </h2>

        <p className="mt-5 text-base leading-8 text-[#102018]/62">
          Sitemix, küçük ve orta ölçekli işletmelere özel web sitesi,
          e-ticaret vitrini ve dijital görünürlük çözümleri hazırlar.
          Amaç yalnızca bir web sayfası yapmak değil; işletmenin internette
          daha ciddi görünmesini, müşterinin daha kolay güvenmesini ve
          iletişime daha hızlı geçmesini sağlamaktır.
        </p>

        <p className="mt-5 text-base leading-8 text-[#102018]/62">
          Çalışma süreci işletmenin ihtiyacına göre planlanır. Hizmet yapısı,
          hedef müşteri, sektör dili, mobil görünüm ve WhatsApp yönlendirmeleri
          birlikte düşünülür. Böylece site yalnızca görsel olarak değil,
          müşteri karar süreci açısından da doğru hazırlanır.
        </p>
      </div>

      <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
        {[
          {
            title: "Kim tarafından kuruldu?",
            text: "Sitemix, Hakan Benli tarafından işletmelerin daha ulaşılabilir, güvenilir ve profesyonel bir dijital görünüme sahip olması amacıyla kurulmuştur.",
          },
          {
            title: "Ne zamandır hizmet veriyor?",
            text: "Sitemix, sahada görülen işletme ihtiyaçları, reklamdan gelen müşteri davranışları ve web sitesi dönüşüm tecrübeleri üzerine geliştirilmiş bir hizmet yapısıdır.",
          },
          {
            title: "Nereden hizmet veriyor?",
            text: "Sitemix, Türkiye genelindeki işletmelere online çalışma modeliyle hizmet verir. Görüşme, planlama, teslim ve destek süreci WhatsApp üzerinden açık şekilde yürütülür.",
          },
          {
            title: "Resmi bilgiler paylaşılır mı?",
            text: "Çalışma öncesinde talep eden müşterilerle ödeme, işletme ve resmi kayıt bilgileri şeffaf şekilde paylaşılabilir. Süreç belirsiz bırakılmaz.",
          },
        ].map((item, index) => (
          <div
            key={item.title}
            className="grid gap-4 py-7 md:grid-cols-[70px_1fr]"
          >
            <span className="text-sm font-black text-[#1f6b43]">
              0{index + 1}
            </span>

            <div>
              <h3 className="text-2xl font-black leading-tight tracking-[-0.04em] text-[#102018]">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-7 text-[#102018]/62 md:text-base">
                {item.text}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>

    <div className="mt-12 grid gap-8 border-t border-[#102018]/10 pt-10 lg:grid-cols-[0.85fr_1.15fr]">
      <div>
        <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
          Güven ve şeffaflık
        </p>

        <h3 className="mt-4 text-3xl font-black leading-tight tracking-[-0.05em] text-[#102018] md:text-4xl">
          Web sitesi yaptırırken müşteri, kiminle çalıştığını bilmek ister.
        </h3>
      </div>

      <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
        {[
          "Çalışma başlamadan önce kapsam ve teslim süreci netleştirilir.",
          "Ödeme ve teslim adımları açık şekilde konuşulur.",
          "Talep halinde işletme ve resmi kayıt bilgileri paylaşılabilir.",
          "Tüm süreç WhatsApp üzerinden yazılı şekilde takip edilebilir.",
          "Site yayına çıktıktan sonra temel destek süreci devam eder.",
        ].map((item) => (
          <div
            key={item}
            className="flex gap-3 py-4 text-sm font-bold leading-7 text-[#102018]/68"
          >
            <span className="font-black text-[#1f6b43]">✓</span>
            <span>{item}</span>
          </div>
        ))}
      </div>
    </div>
  </div>
</section>

      <section
        id="surec"
        className="relative z-10 px-4 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl border-y border-[#102018]/10 py-16">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
              Süreç
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
              Baştan sona düzenli, anlaşılır ve kontrollü bir çalışma süreci.
            </h2>

            <p className="mt-5 text-base leading-8 text-[#102018]/62">
              İş sadece sayfa hazırlamak değildir. Önce işletmenin ihtiyacı
              anlaşılır, sonra müşterinin görmek isteyeceği yapı hazırlanır.
            </p>
          </div>

          <div className="mx-auto mt-14 max-w-5xl divide-y divide-[#102018]/10 border-y border-[#102018]/10">
            {process.map((item, index) => (
              <div
                key={item}
                className="grid gap-4 py-6 md:grid-cols-[120px_1fr]"
              >
                <span className="text-sm font-black text-[#1f6b43]">
                  0{index + 1}
                </span>

                <p className="text-xl font-black leading-snug tracking-[-0.035em] text-[#102018] md:text-2xl">
                  {item}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <PrimaryButton href={wp.destek}>Destek Sürecini Sor</PrimaryButton>
          </div>
        </div>
      </section>

      <section
        id="eticaret"
        className="relative z-10 px-4 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-12 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            <div
              className="min-h-[480px] overflow-hidden rounded-[38px] bg-cover bg-center shadow-2xl shadow-black/14"
              style={{ backgroundImage: `url(${img.ecommerce})` }}
            />

            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
                E-Ticaret
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
                Ürünlerini kendi markana ait bir vitrinde göster.
              </h2>

              <p className="mt-5 text-base leading-8 text-[#102018]/62">
                Küçük işletmeler için başlangıçta karmaşık ödeme sistemleri
                şart değildir. Ürünler profesyonel şekilde sergilenebilir,
                müşteri WhatsApp üzerinden siparişe yönlendirilebilir.
              </p>

              <div className="mt-8 divide-y divide-[#102018]/10 border-y border-[#102018]/10">
                {[
                  "Ürünlerin kendi sitende görünür.",
                  "Müşteri doğrudan işletmene ulaşır.",
                  "Sipariş süreci WhatsApp üzerinden ilerler.",
                  "Kendi reklamını kendi sayfana verebilirsin.",
                  "Marka algısı pazar yeri sayfasına göre daha güçlü olur.",
                ].map((item) => (
                  <div key={item} className="flex gap-3 py-4">
                    <span className="font-black text-[#1f6b43]">✓</span>
                    <p className="text-sm font-bold leading-6 text-[#102018]/68">
                      {item}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8">
                <GreenButton href={wp.ecommerce}>
                  E-Ticaret İçin Bilgi Al
                </GreenButton>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-16 md:px-8 md:py-24">
        <div className="mx-auto max-w-7xl border-y border-[#102018]/10 py-16">
          <div className="grid gap-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-center">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
                Mobil uyum
              </p>

              <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
                Mobilde okunmayan site, müşteri kaybettirir.
              </h2>

              <p className="mt-5 text-base leading-8 text-[#102018]/62">
                Ziyaretçilerin büyük kısmı siteye telefondan girer. Bu yüzden
                yazılar sıkışmamalı, butonlar net görünmeli, arama ve WhatsApp
                bağlantıları kolay tıklanmalıdır.
              </p>

              <div className="mt-8 divide-y divide-[#102018]/10 border-y border-[#102018]/10">
                {[
                  "Butonlar yüksek kontrastlı hazırlanır.",
                  "Yazı boyutları mobil için düzenlenir.",
                  "İletişim aksiyonları kaybolmaz.",
                  "Sayfa gereksiz kalabalıktan arındırılır.",
                ].map((item) => (
                  <div
                    key={item}
                    className="py-4 text-sm font-bold leading-7 text-[#102018]/68"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>

            <div
              className="min-h-[460px] overflow-hidden rounded-[38px] bg-cover bg-center shadow-2xl shadow-black/14"
              style={{ backgroundImage: `url(${img.mobile})` }}
            />
          </div>
        </div>
      </section>

      <section
        id="referanslar"
        className="relative z-10 px-4 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
                Referanslar
              </p>

              <h2 className="mt-4 max-w-4xl text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
                Farklı sektörlerde yayına alınmış web çalışmaları.
              </h2>
            </div>

            <PrimaryButton href={wp.demo}>Benzer Çalışma İste</PrimaryButton>
          </div>

          <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
            {references.map((item) => (
              <a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid gap-3 py-6 transition hover:bg-white/35 md:grid-cols-[1fr_190px_120px] md:items-center md:px-4"
              >
                <h3 className="text-xl font-black tracking-[-0.035em] text-[#102018] md:text-2xl">
                  {item.name}
                </h3>

                <span className="text-sm font-bold text-[#1f6b43]">
                  {item.sector}
                </span>

                <span className="text-sm font-black text-[#102018]/45 transition group-hover:text-[#1f6b43]">
                  İncele →
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section
        id="paketler"
        className="relative z-10 px-4 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
              Paketler
            </p>

            <h2 className="mt-4 text-3xl font-black leading-tight tracking-[-0.055em] text-[#102018] md:text-5xl">
              İşletmenin ihtiyacına göre doğru yapı seçilir.
            </h2>

            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-[#102018]/60 md:text-base">
              Her işletmeye aynı paket önerilmez. Sadece kurumsal görünüm, ürün
              vitrini veya reklamdan müşteri karşılayacak daha güçlü bir yapı
              ihtiyaca göre belirlenir.
            </p>
          </div>

          <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
            {packages.map((item, index) => (
              <div
                key={item.title}
                className="grid gap-8 py-10 lg:grid-cols-[90px_0.8fr_1fr_220px] lg:items-start"
              >
                <span className="text-sm font-black text-[#1f6b43]">
                  0{index + 1}
                </span>

                <div>
                  <p className="text-lg font-black text-[#1f6b43]">
                    {item.price}
                  </p>

                  <h3 className="mt-3 text-3xl font-black leading-tight tracking-[-0.05em] text-[#102018]">
                    {item.title}
                  </h3>

                  <p className="mt-4 text-sm leading-7 text-[#102018]/60">
                    {item.desc}
                  </p>
                </div>

                <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10 lg:border-y-0">
                  {item.features.map((feature) => (
                    <div key={feature} className="flex gap-3 py-3">
                      <span className="font-black text-[#1f6b43]">✓</span>
                      <p className="text-sm font-bold leading-6 text-[#102018]/68">
                        {feature}
                      </p>
                    </div>
                  ))}
                </div>

                <a
                  href={item.href}
                  className="inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#102018] px-7 text-center text-sm font-black leading-none text-white shadow-xl shadow-black/14 transition hover:-translate-y-0.5 hover:bg-[#1d342a]"
                >
                  <span className="whitespace-nowrap text-white">Bilgi Al</span>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section
        id="sss"
        className="relative z-10 px-4 py-16 md:px-8 md:py-24"
      >
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-[#1f6b43]">
              Sık sorulanlar
            </p>

            <h2 className="mt-4 text-3xl font-black tracking-[-0.055em] text-[#102018] md:text-5xl">
              Karar vermeden önce bilinmesi gerekenler.
            </h2>
          </div>

          <div className="divide-y divide-[#102018]/10 border-y border-[#102018]/10">
            {faq.map((item) => (
              <div key={item.q} className="py-7">
                <h3 className="text-xl font-black tracking-[-0.035em] text-[#102018]">
                  {item.q}
                </h3>

                <p className="mt-3 text-sm leading-7 text-[#102018]/62 md:text-base">
                  {item.a}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-36 pt-10 md:px-8 md:pb-28">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[42px] bg-[#102018] shadow-2xl shadow-black/18">
          <div
            className="relative bg-cover bg-center"
            style={{ backgroundImage: `url(${img.support})` }}
          >
            <div className="absolute inset-0 bg-[#102018]/84" />

            <div className="relative mx-auto max-w-5xl px-6 py-16 text-center text-white md:px-10 md:py-24">
              <p className="text-sm font-black uppercase tracking-[0.28em] text-[#c7ed90]">
                Başlangıç
              </p>

              <h2 className="mx-auto mt-5 max-w-4xl text-4xl font-black leading-tight tracking-[-0.065em] text-white md:text-6xl">
                İşletmen için doğru web yapısını birlikte netleştirelim.
              </h2>

              <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/68 md:text-base">
                Önce işletmenin ihtiyacını görelim. Kurumsal web sitesi mi,
                ürün vitrini mi, yoksa reklam trafiğini karşılayacak daha güçlü
                bir yapı mı gerekiyor birlikte belirleyelim.
              </p>

              <div className="mt-9 flex flex-col justify-center gap-3 sm:flex-row">
                <LightButton href={wp.demo}>
                  Ücretsiz Ön Çalışma İste
                </LightButton>
                <GreenButton href={wp.genel}>WhatsApp’tan Yaz</GreenButton>
              </div>

              <p className="mt-6 text-xs font-bold text-white/50">
                Uzun form yok. Kart bilgisi istenmez. İletişim WhatsApp
                üzerinden ilerler.
              </p>
            </div>
          </div>
        </div>
      </section>

      <a
        href={wp.demo}
        className="fixed left-4 right-4 z-50 inline-flex min-h-[60px] items-center justify-center rounded-full bg-[#1f6b43] px-5 text-center text-sm font-black leading-none text-white shadow-2xl shadow-[#1f6b43]/25 transition hover:bg-[#185735] md:left-auto md:right-6 md:min-h-[52px] md:w-auto md:px-7"
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