"use client";

import { motion, type Variants } from "framer-motion";
import { useEffect, useState } from "react";

const phone = "905515550302";

const wp = {
  genel: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, Sitemix hakkında kısa bilgi almak istiyorum."
  )}`,
  demo: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, işletmem için ücretsiz demo görmek istiyorum. Uygunsa kısa bilgi alabilir miyim?"
  )}`,
  teklif: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, işletmem için web sitesi teklifi almak istiyorum."
  )}`,
  referans: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, referans işleriniz hoşuma gitti. Benim işletmem için de benzer bir çalışma yapılabilir mi?"
  )}`,
  google: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, işletmemin Google’da daha görünür olması için web sitesi yaptırmak istiyorum."
  )}`,
  paketBaslangic: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, 3.000 TL’den başlayan web sitesi paketi hakkında bilgi almak istiyorum."
  )}`,
  paketTanitim: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, web sitesi + tanıtım paketi hakkında bilgi almak istiyorum."
  )}`,
  sonCta: `https://wa.me/${phone}?text=${encodeURIComponent(
    "Merhaba, işletmem için profesyonel demo hazırlatmak istiyorum."
  )}`,
};

const img = {
  hero:
    "https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1400&q=85",
  shop:
    "https://images.unsplash.com/photo-1521737711867-e3b97375f902?auto=format&fit=crop&w=1200&q=85",
  web:
    "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1200&q=85",
  local:
    "https://images.unsplash.com/photo-1556745757-8d76bdb6984b?auto=format&fit=crop&w=1200&q=85",
  phone:
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=85",
};

const rise: Variants = {
  hidden: { opacity: 0, y: 34 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

const reveal: Variants = {
  hidden: { opacity: 0, y: 44, scale: 0.97 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.8, ease: [0.22, 1, 0.36, 1] },
  },
};

const group: Variants = {
  hidden: {},
  show: {
    transition: { staggerChildren: 0.1 },
  },
};

const references = [
  {
    name: "Müjde Hair Beauty",
    sector: "Güzellik Salonu",
    text: "Randevu odaklı, güven veren ve WhatsApp’a yönlendiren web yapısı.",
    url: "https://www.mujdehairbeauty.com.tr/",
  },
  {
    name: "Beyza Nails",
    sector: "Nail Studio",
    text: "Mobilde güçlü görünen, hizmetleri net anlatan profesyonel vitrin.",
    url: "https://www.beyzanails.com.tr",
  },
  {
    name: "İncek Ender Perde",
    sector: "Perde Mağazası",
    text: "Yerel aramalara ve müşteri talebi toplamaya uygun web sistemi.",
    url: "https://www.incekenderperde.com",
  },
  {
    name: "Naturel Peruk",
    sector: "Ürün Tanıtımı",
    text: "Ürünleri güvenle gösteren ve WhatsApp sipariş akışını güçlendiren yapı.",
    url: "https://www.naturelperuk.com",
  },
  {
    name: "By Willy Belek Kuaför",
    sector: "Kuaför",
    text: "Google görünürlüğü ve randevu taleplerine odaklanan profesyonel kurulum.",
    url: "https://www.bywillybelekkuafor.com.tr/",
  },
  {
    name: "Özdurmuş Hidrolik",
    sector: "Teknik Servis",
    text: "Havalı kriko, transpalet ve hidrolik sistem servisleri için güven veren yerel hizmet sayfası.",
    url: "https://www.ozdurmushidrolik.com.tr/",
  },
  {
    name: "Dekorasyoncum",
    sector: "Duvar Kağıdı & Dekorasyon",
    text: "Duvar kağıdı satışı, uygulama hizmeti ve katalog inceleme akışını netleştiren profesyonel web yapısı.",
    url: "https://www.dekorasyoncum.com.tr/",
  },
  {
    name: "Kervan Döner",
    sector: "Restoran & Paket Servis",
    text: "Menü, öne çıkan lezzetler, konum ve WhatsApp sipariş akışını hızlı gösteren restoran sayfası.",
    url: "https://www.kervandoner.com/",
  },
  {
    name: "Engelli Taşıma",
    sector: "Engelli Araç Kiralama",
    text: "Engelli araç kiralama, engelli taksi ve randevulu ulaşım hizmetleri için güven odaklı web sayfası.",
    url: "https://www.engellitasima.com/",
  },
];

const steps = [
  {
    no: "01",
    title: "İlk izlenim",
    text: "Müşteri sayfaya girdiğinde işletmenin ciddi, güvenilir ve profesyonel olduğunu hisseder.",
  },
  {
    no: "02",
    title: "Doğru anlatım",
    text: "Hizmetlerin karışık değil, müşterinin karar vereceği sırayla gösterilir.",
  },
  {
    no: "03",
    title: "Google sinyali",
    text: "Başlık, açıklama, içerik ve sayfa yapısı arama niyetine göre hazırlanır.",
  },
  {
    no: "04",
    title: "Mesaja dönüşüm",
    text: "Ziyaretçi karar verdiğinde tek dokunuşla WhatsApp’tan sana ulaşır.",
  },
];

const packages = [
  {
    title: "Web Sitesi Kurulumu",
    price: "3.000 TL’den başlayan",
    desc: "İşletmeni profesyonel gösterecek, mobil uyumlu ve WhatsApp odaklı web sitesi.",
    href: wp.paketBaslangic,
    items: ["Özel ana sayfa", "Mobil uyum", "WhatsApp yönlendirme", "Google temel ayarları"],
  },
  {
    title: "Web + Tanıtım Sistemi",
    price: "6.000 TL’den başlayan",
    desc: "Web sitesiyle birlikte görünürlük ve müşteri akışı tarafını güçlendiren sistem.",
    href: wp.paketTanitim,
    items: ["Web sitesi", "Google görünürlük düzeni", "Tanıtım hazırlığı", "Dönüşüm optimizasyonu"],
  },
];

const faqs = [
  {
    q: "Bu hazır şablon site mi?",
    a: "Hayır. İşletmenin sektörüne, müşterisine ve güven vermesi gereken noktalarına göre kurgu hazırlanır.",
  },
  {
    q: "Demo ücretsiz mi?",
    a: "Evet. Önce demo hazırlanır. Beğenirsen revize ve yayın sürecine geçilir.",
  },
  {
    q: "Google’da kesin birinci sıra olur muyum?",
    a: "Kimse gerçekçi şekilde garanti veremez. Ama doğru kurulum, içerik ve teknik yapı görünürlüğü güçlendirir.",
  },
  {
    q: "Site bittikten sonra ne işe yarayacak?",
    a: "Müşteri seni Google’da daha güvenilir görür, sayfayı inceler ve doğrudan WhatsApp’tan ulaşır.",
  },
];

export default function Home() {
  const [liveIndex, setLiveIndex] = useState(0);

  const live = [
    "Bir ziyaretçi WhatsApp butonuna tıkladı",
    "Yeni demo isteği geldi",
    "Google araması sayfaya yönlendi",
    "Mobil ziyaretçi teklif almak istedi",
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setLiveIndex((prev) => (prev + 1) % live.length);
    }, 2300);

    return () => clearInterval(timer);
  }, [live.length]);

  return (
    <main className="relative min-h-screen overflow-hidden bg-[#0a0706] text-[#fff7ed]">
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.20),transparent_28%),radial-gradient(circle_at_top_right,rgba(244,63,94,0.16),transparent_30%),radial-gradient(circle_at_bottom,rgba(132,204,22,0.10),transparent_34%),linear-gradient(180deg,#0a0706_0%,#130b09_42%,#050303_100%)]" />
        <div className="absolute inset-0 opacity-[0.14] bg-[linear-gradient(135deg,transparent_0%,transparent_48%,rgba(255,255,255,0.20)_49%,transparent_51%,transparent_100%)] bg-[size:38px_38px]" />

        <motion.div
          className="absolute left-[-160px] top-[100px] h-[430px] w-[430px] rounded-full bg-orange-500/25 blur-[120px]"
          animate={{ x: [0, 90, 0], y: [0, 40, 0] }}
          transition={{ duration: 14, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute right-[-120px] top-[240px] h-[420px] w-[420px] rounded-full bg-rose-500/18 blur-[130px]"
          animate={{ x: [0, -80, 0], y: [0, -50, 0] }}
          transition={{ duration: 16, repeat: Infinity, ease: "linear" }}
        />

        <motion.div
          className="absolute bottom-[-180px] left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-lime-400/12 blur-[150px]"
          animate={{ scale: [1, 1.18, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <header className="fixed left-0 top-0 z-50 w-full border-b border-white/10 bg-[#0a0706]/70 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 md:px-8">
          <a href="#" className="flex items-center gap-3">
            <div className="relative grid h-11 w-11 place-items-center overflow-hidden rounded-2xl border border-orange-200/20 bg-orange-300/10 shadow-2xl shadow-orange-500/10">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.8),transparent_35%),radial-gradient(circle_at_bottom_right,rgba(244,63,94,0.55),transparent_38%)]" />
              <span className="relative text-lg font-black text-white">S</span>
            </div>

            <div>
              <p className="text-sm font-black tracking-wide">Sitemix</p>
              <p className="text-[11px] font-semibold text-white/45">Web sitesi değil, müşteri yolu</p>
            </div>
          </a>

          <nav className="hidden items-center gap-8 text-sm font-semibold text-white/58 md:flex">
            <a href="#fark" className="transition hover:text-orange-100">Fark</a>
            <a href="#referanslar" className="transition hover:text-orange-100">Referanslar</a>
            <a href="#paketler" className="transition hover:text-orange-100">Paketler</a>
            <a href="#sss" className="transition hover:text-orange-100">SSS</a>
          </nav>

          <a
            href={wp.genel}
            className="rounded-full border border-lime-300/25 bg-lime-300/10 px-4 py-2 text-xs font-black text-lime-100 shadow-lg shadow-lime-500/10 transition hover:scale-105 hover:bg-lime-300/16 md:px-5 md:py-3 md:text-sm"
          >
            Bilgi Al
          </a>
        </div>
      </header>

      <section className="relative z-10 px-4 pb-16 pt-32 md:px-8 md:pb-24 md:pt-40">
        <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.02fr_0.98fr]">
          <motion.div variants={group} initial="hidden" animate="show" className="text-center lg:text-left">
            <motion.div
              variants={rise}
              className="mx-auto mb-6 inline-flex items-center gap-3 rounded-full border border-orange-200/18 bg-orange-300/10 px-4 py-2 text-xs font-black text-orange-100 shadow-2xl shadow-orange-500/10 lg:mx-0"
            >
              <span className="h-2 w-2 rounded-full bg-lime-300 shadow-[0_0_20px_rgba(190,242,100,0.95)]" />
              İşletmeni internette daha güçlü gösteren sistem
            </motion.div>

            <motion.h1
              variants={rise}
              className="mx-auto max-w-5xl text-4xl font-black leading-[1.01] tracking-[-0.065em] md:text-6xl lg:mx-0 lg:text-7xl"
            >
              Müşteri seni görmeden karar veriyor.
              <span className="block bg-gradient-to-r from-orange-200 via-rose-100 to-lime-200 bg-clip-text text-transparent">
                O ilk izlenimi biz kuruyoruz.
              </span>
            </motion.h1>

            <motion.p
              variants={rise}
              className="mx-auto mt-7 max-w-2xl text-base leading-8 text-white/64 md:text-lg lg:mx-0"
            >
              Sitemix; işletmen için sadece güzel bir sayfa değil, Google’da güven veren ve müşteriyi WhatsApp’a taşıyan profesyonel bir dijital vitrin hazırlar.
            </motion.p>

            <motion.div variants={rise} className="mt-9 flex flex-col items-center gap-4 sm:flex-row sm:justify-center lg:justify-start">
              <a
                href={wp.demo}
                className="group relative w-full overflow-hidden rounded-2xl border border-orange-200/25 bg-orange-400/12 px-7 py-4 text-center text-sm font-black text-orange-50 shadow-2xl shadow-orange-500/10 transition hover:-translate-y-1 hover:bg-orange-400/20 sm:w-auto"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/25 to-transparent transition duration-700 group-hover:translate-x-full" />
                <span className="relative">Ücretsiz Demo Gör</span>
              </a>

              <a
                href={wp.google}
                className="group relative w-full overflow-hidden rounded-2xl border border-rose-200/20 bg-rose-400/10 px-7 py-4 text-center text-sm font-black text-rose-50 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-rose-400/18 sm:w-auto"
              >
                <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/18 to-transparent transition duration-700 group-hover:translate-x-full" />
                <span className="relative">Google İçin Bilgi Al</span>
              </a>
            </motion.div>

            <motion.div variants={rise} className="mt-8 grid grid-cols-1 gap-3 text-xs font-semibold text-white/56 sm:grid-cols-3 lg:max-w-xl">
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">Hazır şablon değil</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">Google mantıklı</div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.045] px-4 py-3 backdrop-blur-xl">WhatsApp odaklı</div>
            </motion.div>
          </motion.div>

          <motion.div variants={reveal} initial="hidden" animate="show" className="relative">
            <div className="absolute -inset-5 rounded-[46px] bg-gradient-to-br from-orange-400/25 via-rose-500/12 to-lime-400/16 blur-3xl" />

            <div className="relative overflow-hidden rounded-[34px] border border-white/12 bg-white/[0.06] p-3 shadow-2xl shadow-black/50 backdrop-blur-2xl md:p-5">
              <div
                className="relative min-h-[520px] overflow-hidden rounded-[28px] bg-cover bg-center"
                style={{ backgroundImage: `url(${img.hero})` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-black/88 via-black/55 to-black/20" />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(251,146,60,0.28),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(190,242,100,0.16),transparent_34%)]" />

                <div className="relative flex min-h-[520px] flex-col justify-between p-5 md:p-7">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold text-white/50">Canlı kurgu</p>
                      <p className="mt-1 text-sm font-black">Sitemix müşteri yolu</p>
                    </div>

                    <div className="rounded-full border border-lime-300/25 bg-lime-300/10 px-3 py-1 text-[11px] font-black text-lime-100">
                      Aktif
                    </div>
                  </div>

                  <div>
                    <div className="mb-4 max-w-md rounded-[24px] border border-white/12 bg-black/40 p-5 backdrop-blur-xl">
                      <p className="text-xs font-semibold text-orange-100/65">Müşteri rotası</p>
                      <h3 className="mt-3 text-2xl font-black tracking-[-0.04em]">
                        Google’da görür. Sayfaya girer. Güven duyar. Sana yazar.
                      </h3>
                    </div>

                    <div className="grid gap-3">
                      {["Google araması", "Güven veren web sitesi", "WhatsApp mesajı"].map((item, index) => (
                        <motion.div
                          key={item}
                          initial={{ opacity: 0, x: 28 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.55 + index * 0.15 }}
                          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/38 p-3 backdrop-blur-xl"
                        >
                          <span className="grid h-9 w-9 place-items-center rounded-xl bg-orange-300/15 text-xs font-black text-orange-100">
                            0{index + 1}
                          </span>
                          <span className="text-sm font-semibold text-white/82">{item}</span>
                        </motion.div>
                      ))}
                    </div>

                    <div className="mt-4 rounded-[24px] border border-lime-300/18 bg-lime-300/10 p-4 backdrop-blur-xl">
                      <div className="flex items-center gap-4">
                        <div className="relative flex h-10 w-10 items-center justify-center rounded-2xl border border-lime-300/25 bg-lime-300/10">
                          <span className="absolute h-3 w-3 animate-ping rounded-full bg-lime-300" />
                          <span className="relative h-3 w-3 rounded-full bg-lime-200" />
                        </div>

                        <div>
                          <p className="text-xs font-semibold text-lime-100/55">Canlı bildirim</p>
                          <motion.p
                            key={liveIndex}
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-1 text-sm font-black text-lime-100"
                          >
                            {live[liveIndex]}
                          </motion.p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div
          variants={group}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true }}
          className="mx-auto mt-14 grid max-w-7xl grid-cols-2 gap-3 md:grid-cols-4 md:gap-5"
        >
          {[
            ["1 Saat", "Demo önizleme"],
            ["3 Gün", "Yayına alma hedefi"],
            ["Mobil", "Her ekrana uyumlu"],
            ["WhatsApp", "Direkt müşteri akışı"],
          ].map(([value, label]) => (
            <motion.div
              variants={rise}
              key={label}
              className="rounded-[26px] border border-white/10 bg-white/[0.045] p-5 text-center backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.075] md:p-6"
            >
              <p className="text-xl font-black md:text-2xl">{value}</p>
              <p className="mt-2 text-xs leading-5 text-white/45 md:text-sm">{label}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      <section id="fark" className="relative z-10 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-end">
            <motion.div variants={rise} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-orange-200">Kırılma noktası</p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-5xl">
                Web sitesi müşteriye “bu işletme ciddi” dedirtmeli.
              </h2>
            </motion.div>

            <motion.p
              variants={rise}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="text-base leading-8 text-white/58 md:text-lg"
            >
              Bizim farkımız sadece tasarım değil. Sayfanın her bölümünü müşterinin aklındaki şüpheyi azaltmak ve iletişime geçmesini kolaylaştırmak için kuruyoruz.
            </motion.p>
          </div>

          <div className="mt-12 grid gap-5 md:grid-cols-3">
            {[
              {
                title: "Güven hissi",
                desc: "Sayfaya giren kişi ilk saniyede amatörlük değil, düzenli ve ciddi bir işletme görür.",
                image: img.shop,
              },
              {
                title: "Google mantığı",
                desc: "Başlıklar ve içerik, müşterinin arama yaptığı kelimelere göre düzenlenir.",
                image: img.web,
              },
              {
                title: "Kolay iletişim",
                desc: "Ziyaretçi kararsız kalmadan WhatsApp veya telefon yoluyla sana ulaşır.",
                image: img.phone,
              },
            ].map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative min-h-[360px] overflow-hidden rounded-[32px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition hover:-translate-y-2 hover:border-orange-200/25"
              >
                <div
                  className="absolute inset-0 bg-cover bg-center transition duration-700 group-hover:scale-110"
                  style={{ backgroundImage: `url(${item.image})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/72 to-black/25" />
                <div className="absolute inset-0 bg-orange-500/0 transition group-hover:bg-orange-500/10" />

                <div className="relative flex h-full min-h-[312px] flex-col justify-between">
                  <div className="grid h-12 w-12 place-items-center rounded-2xl border border-white/15 bg-black/35 text-sm font-black backdrop-blur-xl">
                    0{index + 1}
                  </div>

                  <div>
                    <h3 className="text-2xl font-black tracking-[-0.04em]">{item.title}</h3>
                    <p className="mt-4 text-sm leading-7 text-white/68">{item.desc}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={wp.teklif}
              className="inline-flex rounded-2xl border border-orange-200/20 bg-orange-400/12 px-7 py-4 text-sm font-black text-orange-50 transition hover:-translate-y-1 hover:bg-orange-400/20"
            >
              Benim İşletmeme Uygun Teklif Al
            </a>
          </div>
        </div>
      </section>

      <section id="referanslar" className="relative z-10 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.28em] text-rose-200">Referanslar</p>
              <h2 className="mt-4 max-w-3xl text-3xl font-black tracking-[-0.045em] md:text-5xl">
                Farklı sektörlerde çalışan dijital vitrinler.
              </h2>
            </div>

            <a
              href={wp.referans}
              className="rounded-2xl border border-rose-200/20 bg-rose-400/10 px-6 py-4 text-center text-sm font-black text-rose-50 transition hover:-translate-y-1 hover:bg-rose-400/18"
            >
              Benzer Çalışma İste
            </a>
          </div>

          <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
            {references.map((item, index) => (
              <motion.a
                key={item.name}
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="group relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl transition hover:-translate-y-1 hover:border-orange-200/25 hover:bg-white/[0.075]"
              >
                <div className="absolute -right-14 -top-14 h-36 w-36 rounded-full bg-orange-400/10 blur-3xl transition group-hover:bg-rose-400/20" />

                <div className="relative mb-8 flex items-center justify-between gap-4">
                  <span className="rounded-full border border-white/10 bg-white/[0.045] px-3 py-1 text-xs font-black text-white/55">
                    {item.sector}
                  </span>
                  <span className="text-sm font-black text-orange-100/50 transition group-hover:text-orange-100">
                    Siteyi incele →
                  </span>
                </div>

                <h3 className="relative text-xl font-black">{item.name}</h3>
                <p className="relative mt-4 min-h-[76px] text-sm leading-7 text-white/52">{item.text}</p>
              </motion.a>
            ))}

            <div
              className="relative overflow-hidden rounded-[30px] border border-lime-300/20 bg-cover bg-center p-6 backdrop-blur-xl"
              style={{ backgroundImage: `url(${img.local})` }}
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black via-black/72 to-black/30" />
              <div className="relative">
                <span className="rounded-full border border-lime-300/20 bg-lime-300/10 px-3 py-1 text-xs font-black text-lime-100">
                  Sıradaki proje
                </span>

                <h3 className="mt-8 text-xl font-black">Senin işletmen</h3>
                <p className="mt-4 text-sm leading-7 text-white/66">
                  Önce demo hazırlanır. Sayfanın nasıl görüneceğini görürsün. Beğenirsen yayın süreci başlar.
                </p>

                <a
                  href={wp.demo}
                  className="mt-8 inline-flex rounded-2xl border border-lime-300/20 bg-lime-300/12 px-5 py-3 text-sm font-black text-lime-50 transition hover:bg-lime-300/18"
                >
                  Demo İste
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mx-auto max-w-3xl text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-lime-200">Akış</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-5xl">
              Müşterinin karar yolunu kısaltıyoruz.
            </h2>
          </div>

          <div className="mt-14 grid gap-5 md:grid-cols-2 lg:grid-cols-4">
            {steps.map((item, index) => (
              <motion.div
                key={item.no}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="relative overflow-hidden rounded-[30px] border border-white/10 bg-white/[0.045] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.075]"
              >
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-orange-400/10 blur-2xl" />
                <span className="text-sm font-black text-orange-200">{item.no}</span>
                <h3 className="mt-8 text-lg font-black">{item.title}</h3>
                <p className="mt-4 text-sm leading-7 text-white/52">{item.text}</p>
              </motion.div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <a
              href={wp.google}
              className="inline-flex rounded-2xl border border-lime-300/20 bg-lime-300/10 px-7 py-4 text-sm font-black text-lime-50 transition hover:-translate-y-1 hover:bg-lime-300/16"
            >
              Google Görünürlüğü İçin Yaz
            </a>
          </div>
        </div>
      </section>

      <section id="paketler" className="relative z-10 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-orange-200">Paketler</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-5xl">
              İhtiyaca göre doğru başlangıç.
            </h2>
            <p className="mx-auto mt-5 max-w-2xl text-sm leading-7 text-white/55 md:text-base">
              Her işletme aynı değil. Önce ihtiyacı netleştirip en doğru web ve müşteri akışı yapısını kuruyoruz.
            </p>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            {packages.map((item, index) => (
              <motion.div
                key={item.title}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.12 }}
                className="relative overflow-hidden rounded-[34px] border border-white/10 bg-white/[0.045] p-7 backdrop-blur-xl transition hover:-translate-y-1 hover:bg-white/[0.07] md:p-9"
              >
                <div className="absolute -right-14 -top-14 h-40 w-40 rounded-full bg-rose-400/12 blur-3xl" />

                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h3 className="text-2xl font-black">{item.title}</h3>
                    <p className="mt-3 text-sm leading-7 text-white/55">{item.desc}</p>
                  </div>

                  <div className="rounded-2xl border border-orange-300/20 bg-orange-300/10 px-4 py-3 text-sm font-black text-orange-100">
                    {item.price}
                  </div>
                </div>

                <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
                  {item.items.map((listItem) => (
                    <div key={listItem} className="rounded-2xl border border-white/10 bg-black/35 p-4 text-sm font-semibold text-white/68">
                      <span className="mr-2 text-lime-200">✓</span>
                      {listItem}
                    </div>
                  ))}
                </div>

                <a
                  href={item.href}
                  className="relative mt-8 inline-flex w-full justify-center rounded-2xl border border-orange-200/20 bg-orange-400/12 px-6 py-4 text-sm font-black text-orange-50 transition hover:bg-orange-400/20"
                >
                  Bu Paket İçin Bilgi Al
                </a>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section id="sss" className="relative z-10 px-4 py-20 md:px-8 md:py-28">
        <div className="mx-auto max-w-5xl">
          <div className="mb-10 text-center">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-rose-200">Sorular</p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.045em] md:text-5xl">
              Karar vermeden önce netleştirelim.
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((item, index) => (
              <motion.div
                key={item.q}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.06 }}
                className="rounded-[26px] border border-white/10 bg-white/[0.045] p-6 backdrop-blur-xl"
              >
                <h3 className="text-base font-black md:text-lg">{item.q}</h3>
                <p className="mt-3 text-sm leading-7 text-white/52">{item.a}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative z-10 px-4 pb-28 pt-12 md:px-8">
        <div
          className="mx-auto max-w-7xl overflow-hidden rounded-[38px] border border-white/10 bg-cover bg-center p-8 text-center shadow-2xl shadow-black/30 md:p-14"
          style={{ backgroundImage: `url(${img.shop})` }}
        >
          <div className="mx-auto max-w-5xl rounded-[30px] border border-white/12 bg-black/68 p-8 backdrop-blur-xl md:p-12">
            <p className="text-sm font-black uppercase tracking-[0.28em] text-orange-200">Başlayalım</p>

            <h2 className="mx-auto mt-5 max-w-4xl text-3xl font-black tracking-[-0.055em] md:text-6xl">
              İşletmen için önce profesyonel demo hazırlayalım.
            </h2>

            <p className="mx-auto mt-6 max-w-2xl text-sm leading-7 text-white/62 md:text-base">
              Sayfanın nasıl görüneceğini gör. Beğenirsen revizeleri yapıp yayına alma sürecini başlatalım.
            </p>

            <div className="mt-9 flex flex-col justify-center gap-4 sm:flex-row">
              <a
                href={wp.sonCta}
                className="rounded-2xl border border-orange-200/25 bg-orange-400/14 px-8 py-4 text-sm font-black text-orange-50 transition hover:-translate-y-1 hover:bg-orange-400/22"
              >
                Demo Hazırlat
              </a>

              <a
                href={wp.teklif}
                className="rounded-2xl border border-lime-300/25 bg-lime-300/10 px-8 py-4 text-sm font-black text-lime-50 transition hover:-translate-y-1 hover:bg-lime-300/16"
              >
                Teklif Al
              </a>
            </div>
          </div>
        </div>
      </section>

      <motion.a
        href={wp.teklif}
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.1 }}
        className="fixed bottom-5 left-4 right-4 z-50 rounded-2xl border border-lime-300/25 bg-[#14210a]/95 px-5 py-4 text-center text-sm font-black text-lime-100 shadow-2xl shadow-lime-500/10 backdrop-blur-xl transition hover:bg-[#1f330f] md:left-auto md:right-6 md:w-auto"
      >
        WhatsApp’tan Teklif Al
      </motion.a>
    </main>
  );
}