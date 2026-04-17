"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";
const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6 }
  }
};
export default function Home() {
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const [isMobile, setIsMobile] = useState(false);
  const [popup, setPopup] = useState(false);
const messages = [
  "🔴 Antalya’da bir kuaför 3 yeni müşteri aldı",
  "🟢 WhatsApp’tan yeni mesaj geldi",
  "🔵 Google’dan biri seni buldu",
  "🟣 Bir işletme bugün sisteme katıldı",
  "🟡 Site kurulduktan sonra ilk mesaj geldi",
  "🔴 Yeni müşteri kazancı başladı",
];

const [index, setIndex] = useState(0);

useEffect(() => {
  const i = setInterval(() => {
    setIndex((prev) => (prev + 1) % messages.length);
  }, 2500);
  return () => clearInterval(i);
}, []);
  // cihaz kontrol
  useEffect(() => {
    if (window.innerWidth < 768) {
      setIsMobile(true);
    }
  }, []);

  // mouse sadece desktop
  useEffect(() => {
    if (isMobile) return;

    const move = (e: any) => {
      setMouse({ x: e.clientX, y: e.clientY });
    };

    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [isMobile]);

  return (
   <main className="relative min-h-screen text-white overflow-hidden">

  {/* NAVBAR */}
  <header className="fixed top-0 w-full z-50 backdrop-blur-md bg-black/30 border-b border-white/10">
    <div className="max-w-6xl mx-auto px-6 py-4 flex justify-between items-center">

      <motion.h1
  initial="hidden"
  animate="show"
  className="font-semibold text-white flex gap-[2px]"
>
  {"Sitemix".split("").map((char, i) => (
    <motion.span
      key={i}
      variants={{
        hidden: { opacity: 0, y: 10, filter: "blur(6px)" },
        show: {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          transition: {
            delay: i * 0.05,
          },
        },
      }}
    >
      {char}
    </motion.span>
  ))}
</motion.h1>

      <a
        href="https://wa.me/905515550302"
        className="text-sm bg-blue-500 px-4 py-2 rounded-full hover:scale-105 transition"
      >
        WhatsApp
      </a>

    </div>
  </header>

 <div className="absolute inset-0 bg-gradient-to-b from-[#0f172a] via-[#020617] to-black"></div>

      {/* 🔥 DESKTOP MOUSE LIGHT */}
      {!isMobile && (
        <div
          className="pointer-events-none fixed w-[500px] h-[500px] rounded-full blur-[120px] opacity-20 bg-blue-500 blur-[160px] opacity-10"
          style={{
            left: mouse.x - 250,
            top: mouse.y - 250,
          }}
        />
      )}

      {/* 🔥 MOBİL GLOW */}
      {isMobile && (
        <motion.div
          className="pointer-events-none fixed w-[300px] h-[300px] rounded-full blur-[100px] opacity-20 bg-purple-500"
          animate={{
            y: [0, 50, 0],
          }}
          transition={{
            duration: 6,
            repeat: Infinity,
          }}
          style={{
            left: "50%",
            transform: "translateX(-50%)",
            top: "30%",
          }}
        />
      )}

      {/* BACKGROUND */}
      <div className="absolute top-[-200px] left-1/2 -translate-x-1/2 w-[900px] h-[900px] bg-blue-500 opacity-10 blur-[200px] rounded-full"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">

        {/* HERO */}
        
      <section className="pt-40 pb-28 relative overflow-hidden">
          <motion.h1
  initial={{ opacity: 0, y: 40 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.6 }}
  whileInView={{ y: [0, -10, 0] }}
            className="text-4xl md:text-7xl font-bold leading-tight max-w-3xl mx-auto md:mx-0"
          >
            Web sitesi değil
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-blue-600 bg-clip-text text-transparent">
             İşletmeniz için
dijital müşteri sistemi
            </span>
          </motion.h1>
           <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="text-gray-400 mt-6 max-w-xl text-sm md:text-base"
          >
            Google’da görünür ol.
            İnsanlar seni bulsun.
            WhatsApp’tan yazsın.
          </motion.p>
{/* 🔥 ARKA PLAN SİSTEM AKIŞI */}
<motion.div
 className="absolute inset-0 pointer-events-none overflow-hidden"
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
>

  {/* Akış çizgileri */}
  <motion.div
    className="absolute inset-0 opacity-[0.02]"
    style={{
      backgroundImage: `
        linear-gradient(to right, transparent 0%, rgba(255,255,255,0.15) 50%, transparent 100%),
        linear-gradient(to bottom, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)
      `,
      backgroundSize: "200px 200px",
    }}
    animate={{
      backgroundPosition: ["0px 0px", "200px 200px"],
    }}
    transition={{
      duration: 20,
      repeat: Infinity,
      ease: "linear",
    }}
  />

  {/* Veri noktaları */}
  <motion.div
    className="absolute w-1 h-1 bg-blue-400/60 rounded-full"
    animate={{
      x: [0, 300, 600],
      y: [100, 200, 100],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 6,
      repeat: Infinity,
      ease: "linear",
    }}
  />

  <motion.div
    className="absolute w-2 h-2 bg-blue-500 rounded-full"
    animate={{
      x: [600, 300, 0],
      y: [200, 100, 200],
      opacity: [0, 1, 0],
    }}
    transition={{
      duration: 7,
      repeat: Infinity,
      ease: "linear",
    }}
  />

  {/* Yumuşak glow */}
  <motion.div
    className="absolute w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-[120px]"
    animate={{
      x: [0, 100, -50, 0],
      y: [0, -50, 50, 0],
    }}
    transition={{
      duration: 14,
      repeat: Infinity,
      ease: "linear",
    }}
  />

</motion.div>
        

         

          <motion.a
            whileHover={!isMobile ? { scale: 1.1 } : {}}
            whileTap={{ scale: 0.95 }}
            href="https://wa.me/905515550302"
            className="inline-block mt-10 px-8 py-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 font-semibold shadow-xl"
          >
            Başla
          </motion.a>

        </section>
        <p className="text-green-400 text-sm mt-4">
  ✔ Son 7 günde 12 işletme müşteri almaya başladı
</p>
<motion.div
  initial={{ opacity: 0 }}
  animate={{ opacity: 1 }}
  className="flex justify-center py-10"
>
  <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-full text-sm text-gray-300">
    {messages[index]}
  </div>
</motion.div>
<motion.section
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  viewport={{ once: true }}
  className="py-24 border-t border-white/10"
>
<motion.section
  initial={{ opacity: 0 }}
  whileInView={{ opacity: 1 }}
  className="py-20 border-t border-white/10"
>

  <h2 className="text-2xl md:text-3xl text-center mb-10">
    İnsanlar bunları soruyor
  </h2>

  <div className="max-w-3xl mx-auto space-y-4">

    {[
      {
        q: "Bu gerçekten müşteri getiriyor mu yoksa klasik site mi?",
        a: "Bu bir vitrin sitesi değil. Google’dan bulunma + WhatsApp’a yönlendirme sistemi kurulur."
      },
      {
        q: "Ben daha önce site yaptırdım, hiçbir işe yaramadı neden?",
        a: "Çoğu site sadece görünür. Bizim sistem dönüşüm ve müşteri alma üzerine kurulur."
      },
      {
        q: "Google’da üstte çıkacağım garantisi var mı?",
        a: "Kimse garanti veremez. Ama doğru yapı kurulduğunda görünürlük ciddi şekilde artar."
      },
      {
        q: "Ne kadar sürede müşteri gelmeye başlar?",
        a: "Genelde ilk haftalarda hareket başlar, sektörüne göre hız değişir."
      },
      {
        q: "Benim sektörde işe yarar mı?",
        a: "Hizmet veren tüm işletmeler için çalışır. Kuaför, dövmeci, dişçi, emlak vs."
      },
      {
        q: "Fiyat neden sabit değil?",
        a: "Çünkü her işletme farklı. Sana özel kurulum yapılır, hazır paket yok."
      },
      {
        q: "Siteyi yaptın diyelim, sonra ne olacak?",
        a: "Sistem kurulduktan sonra insanlar seni bulur ve mesaj atmaya başlar."
      }
    ].map((item, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ delay: i * 0.05 }}
        className="p-5 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md"
      >
        <p className="text-white text-sm md:text-base font-medium">
          {item.q}
        </p>
        <p className="text-gray-400 text-sm mt-2">
          {item.a}
        </p>
      </motion.div>
    ))}

  </div>
</motion.section>
  <h2 className="text-3xl mb-16 text-center">
    Gerçek Sonuç
  </h2>

  <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-2xl p-10">

    <div className="grid md:grid-cols-2 gap-10">

      <div>
        <p className="text-gray-400 text-sm mb-2">ÖNCE</p>
        <p className="text-red-400 text-sm">Günlük 0-2 müşteri</p>
        <p className="text-red-400 text-sm">Sadece Instagram</p>
      </div>

      <div>
        <p className="text-gray-400 text-sm mb-2">SONRA</p>
        <p className="text-green-400 text-sm">Google’dan müşteri</p>
        <p className="text-green-400 text-sm">WhatsApp mesaj artışı</p>
      </div>

    </div>

    <p className="text-gray-300 mt-10 text-center">
      “Site sonrası müşteriler Google’dan gelmeye başladı.”
    </p>

  </div>

</motion.section>
<section className="py-24 border-t border-white/10 text-center">

  <h2 className="text-3xl mb-16">
    Sistem
  </h2>

  <div className="grid md:grid-cols-4 gap-8 max-w-5xl mx-auto">

    {[
      "Web sitesi kurulur",
      "Google’da görünür olur",
      "İnsanlar seni bulur",
      "Mesaj gelir",
    ].map((item, i) => (
      <motion.div
        key={i}
        whileHover={{ scale: 1.05 }}
     className="p-6 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md
hover:border-purple-400/40 hover:shadow-[0_0_40px_rgba(168,85,247,0.2)] transition"
      >
        {item}
      </motion.div>
    ))}

  </div>

</section>
<motion.section
  variants={fadeUp}
  initial="hidden"
  whileInView="show"
  className="py-24 border-t border-white/10 text-center"
>
  <h2 className="text-3xl mb-12">
    Referans
  </h2>

  <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-10">

  {/* Müjde Hair Beauty */}
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:scale-105 transition">
    <h3 className="mb-2 font-semibold">
      Müjde Hair Beauty
    </h3>

    <p className="text-gray-400 text-sm mb-4">
      Google üzerinden müşteri almaya başladı
    </p>

    <a
      href="https://www.mujdehairbeauty.com.tr/"
      target="_blank"
      className="text-purple-400 text-sm underline"
    >
      Siteyi incele →
    </a>
  </div>

  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <p className="text-gray-300 text-sm">
      “Site sonrası WhatsApp mesajları ciddi şekilde arttı.”
    </p>

    <p className="text-gray-500 text-xs mt-4">
      Antalya • Güzellik Salonu
    </p>
  </div>


  {/* Beyza Nails */}
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:scale-105 transition">
    <h3 className="mb-2 font-semibold">
      Beyza Nails
    </h3>

    <p className="text-gray-400 text-sm mb-4">
      Web sitesiyle yeni müşteriler kazanmaya başladı
    </p>

    <a
      href="https://www.beyzanails.com.tr"
      target="_blank"
      className="text-purple-400 text-sm underline"
    >
      Siteyi incele →
    </a>
  </div>

  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <p className="text-gray-300 text-sm">
      “Randevu taleplerimiz gözle görülür şekilde arttı.”
    </p>

    <p className="text-gray-500 text-xs mt-4">
      İstanbul • Nail Studio
    </p>
  </div>


  {/* By Willy Belek Kuaför */}
  <div className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:scale-105 transition">
    <h3 className="mb-2 font-semibold">
      By Willy Belek Kuaför
    </h3>

    <p className="text-gray-400 text-sm mb-4">
      Google’da görünürlük ve müşteri trafiği arttı
    </p>

    <a
      href="https://www.bywillybelekkuafor.com.tr/"
      target="_blank"
      className="text-purple-400 text-sm underline"
    >
      Siteyi incele →
    </a>
  </div>

  <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
    <p className="text-gray-300 text-sm">
      “Web sitemiz sayesinde daha profesyonel görünmeye başladık.”
    </p>

    <p className="text-gray-500 text-xs mt-4">
      Belek • Kuaför
    </p>
  </div>

</div>

</motion.section>  
<section className="py-24 border-t border-white/10 text-center">

  <h2 className="text-3xl mb-10">
    İşletmeler ne diyor?
  </h2>

  <div className="max-w-2xl mx-auto bg-white/5 border border-white/10 p-8 rounded-2xl">

    <p className="text-gray-300">
      “İlk defa Google’dan müşteri geldi. Bu sistem gerçekten çalışıyor.”
    </p>

    <p className="text-gray-500 text-sm mt-4">
      Antalya • Güzellik Salonu
    </p>

  </div>

</section>
<section className="py-24 border-t border-white/10">

  <h2 className="text-3xl text-center mb-16">
    Fark
  </h2>

  <div className="max-w-4xl mx-auto grid md:grid-cols-2 gap-10">

    <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
      <h3 className="mb-4 text-red-400">Normal site</h3>
      <ul className="text-gray-400 text-sm space-y-2">
        <li>❌ Sadece görünür</li>
        <li>❌ Müşteri getirmez</li>
        <li>❌ Satış odaklı değil</li>
      </ul>
    </div>

    <div className="bg-white/5 p-8 rounded-2xl border border-white/10">
      <h3 className="mb-4 text-green-400">Sitemix</h3>
      <ul className="text-gray-300 text-sm space-y-2">
        <li>✔ Google’dan müşteri</li>
        <li>✔ WhatsApp mesaj</li>
        <li>✔ Dönüşüm odaklı</li>
      </ul>
    </div>

  </div>

</section>

        {/* PROBLEM */}
        <section className="py-20 border-t border-white/10">

          <motion.h2
            initial={{ opacity: 0, y: 40 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-2xl md:text-3xl mb-12"
          >
            Neden müşteri gelmiyor?
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-6">

            {[
              "Google’da yoksun",
              "Güven vermiyorsun",
              "Sistem kurulu değil",
            ].map((item, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 60 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.2 }}
                whileHover={!isMobile ? { scale: 1.05 } : {}}
                whileTap={{ scale: 0.97 }}
                className="p-6 md:p-8 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-xl"
              >
                <h3 className="mb-2">{item}</h3>
                <p className="text-gray-400 text-sm">
                  Bu yüzden müşteri rakibe gider.
                </p>
              </motion.div>
            ))}

          </div>

        </section>

        {/* FLOW */}
        <section className="py-20 border-t border-white/10 text-center">

          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-2xl md:text-3xl mb-12"
          >
            Sistem nasıl çalışır?
          </motion.h2>

          <div className="flex flex-col md:flex-row justify-center gap-6">

            {["Site", "Google", "Müşteri", "Mesaj"].map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.2 }}
                whileHover={!isMobile ? { y: -10 } : {}}
                whileTap={{ scale: 0.95 }}
                className="px-6 py-4 border border-white/10 rounded-xl bg-white/5"
              >
                {step}
              </motion.div>
            ))}

          </div>

        </section>

<motion.div
  initial={{ opacity: 0, y: 20 }}
  whileInView={{ opacity: 1, y: 0 }}
  transition={{ duration: 0.5 }}
  className="text-center mt-12"
>
  <div className="inline-block px-6 py-4 rounded-2xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">

    <p className="text-gray-300 text-sm md:text-base font-medium">
      Her işletmeye özel sistem kuruluyor
    </p>

    <p className="text-blue-400 text-sm mt-1">
      Net fiyat için WhatsApp’tan yazın
    </p>

  </div>
</motion.div>
        {/* CTA */}
        <section className="py-24 border-t border-white/10 text-center">

          <motion.h2
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            className="text-3xl md:text-4xl mb-6"
          >
            Müşteri almaya bugün başla
          </motion.h2>

          <motion.a
            whileTap={{ scale: 0.95 }}
            whileHover={!isMobile ? { scale: 1.15 } : {}}
            href="https://wa.me/905515550302"
            className="bg-white text-black px-8 py-4 rounded-full font-semibold"
          >
           Hemen WhatsApp’tan Yaz
          </motion.a>

        </section>
<motion.div
  initial={{ opacity: 0, y: 50 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 2 }}
  className="fixed bottom-6 left-6 z-50"
>
  <div className="bg-white/[0.05] border border-white/[0.1] backdrop-blur-md px-4 py-3 rounded-xl text-sm text-gray-300 shadow-lg">
    🟢 Şu an biri WhatsApp’tan yazıyor...
  </div>
</motion.div>
      </div>

      {/* 🔥 CANLI AKIŞ BİLDİRİMİ */}
      {popup && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-6 left-6 z-50"
        >
          <div className="bg-white/[0.05] border border-white/[0.1] backdrop-blur-md px-4 py-3 rounded-xl text-sm text-gray-300 shadow-lg">
            🔵 Google’dan biri seni buldu
          </div>
        </motion.div>
      )}

    </main>
  );
}