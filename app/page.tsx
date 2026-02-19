"use client";
import { useState } from "react";

export default function Home() {
  const [showNumber, setShowNumber] = useState(false);

  return (
    <main className="relative min-h-screen bg-black text-white overflow-hidden">

      {/* Glow Background */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-purple-600 opacity-20 blur-[150px] rounded-full"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500 opacity-20 blur-[120px] rounded-full"></div>

      {/* HERO */}
      <section className="relative z-10 flex flex-col items-center justify-center text-center px-6 py-32 fade-up">

        <div className="text-gray-400 text-sm mb-6">
          İşletmelere özel geliştirilen randevu altyapısı
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6">
          <span className="bg-gradient-to-r from-purple-400 via-blue-400 to-purple-500 bg-clip-text text-transparent">
            Sitemix
          </span>
        </h1>

        <h2 className="text-xl md:text-2xl text-gray-300 mb-6">
          DM’den randevu almak yerine sistemi otomatikleştirin.
        </h2>

        <p className="text-gray-400 max-w-xl mb-10">
          Saat çakışması yok. Manuel takip yok. Kaçan müşteri yok.
          Tüm süreci tek panelden yönetin.
        </p>

        <div className="flex flex-col md:flex-row gap-4">
          <a
            href="/demo"
            className="px-8 py-4 rounded-full font-semibold bg-gradient-to-r from-purple-500 to-blue-500 hover:scale-105 hover:shadow-[0_10px_40px_rgba(139,92,246,0.5)] transition-all duration-300"
          >
            Demo Gör
          </a>

          <a
            href="#pricing"
            className="border border-gray-500 px-8 py-4 rounded-full hover:bg-white hover:text-black transition"
          >
            Fiyatları İncele
          </a>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="relative z-10 px-6 py-24 border-t border-white/10 text-center">
        <h3 className="text-3xl font-semibold mb-10">
          İşletmelerin En Büyük Sorunu
        </h3>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:-translate-y-2 smooth-section">
            <h4 className="font-semibold mb-3">DM Karışıklığı</h4>
            <p className="text-gray-400 text-sm">
              Instagram mesajlarında kaybolan randevular.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:-translate-y-2 smooth-section">
            <h4 className="font-semibold mb-3">Saat Çakışması</h4>
            <p className="text-gray-400 text-sm">
              Aynı saatin iki kişiye verilmesi.
            </p>
          </div>

          <div className="bg-white/5 backdrop-blur-md p-8 rounded-2xl border border-white/10 hover:-translate-y-2 smooth-section">
            <h4 className="font-semibold mb-3">Zaman Kaybı</h4>
            <p className="text-gray-400 text-sm">
              Telefon ve manuel takip yükü.
            </p>
          </div>
        </div>
      </section>

      {/* SOLUTION */}
      <section className="relative z-10 px-6 py-24 text-center">
        <h3 className="text-3xl font-semibold mb-10">
          3 Adımda Otomatik Randevu
        </h3>

        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-12">
          <div>
            <h4 className="text-lg font-semibold mb-3">
              1. İşletme Sayfanız Oluşturulur
            </h4>
            <p className="text-gray-400">
              Size özel randevu altyapısı kurulur.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">
              2. Müşteri Saat Seçer
            </h4>
            <p className="text-gray-400">
              Uygun tarih ve saatleri kendisi belirler.
            </p>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-3">
              3. Sistem Otomatik Kaydeder
            </h4>
            <p className="text-gray-400">
              Randevu panelinize anında düşer.
            </p>
          </div>
        </div>
      </section>

      {/* REVENUE SECTION */}
      <section className="relative z-10 px-6 py-24 border-t border-white/10 text-center">
        <h3 className="text-3xl font-semibold mb-8">
          Kaç Müşteri Kaçırıyorsunuz?
        </h3>

        <p className="text-gray-400 max-w-2xl mx-auto">
          Günlük sadece 1 müşteriyi kaçırmak, ayda binlerce lira kayıp demektir.
          Sitemix ile randevu sürecini otomatikleştirerek bu kaybı durdurun.
        </p>
      </section>

      {/* TRUST */}
      <section className="relative z-10 px-6 py-24 border-t border-white/10 text-center">
        <h3 className="text-3xl font-semibold mb-10">
          Neden Sitemix?
        </h3>

        <div className="max-w-3xl mx-auto space-y-6 text-gray-400">
          <p>✔ Mobil uyumlu modern tasarım</p>
          <p>✔ Otomatik saat bloklama</p>
          <p>✔ Yönetim paneli</p>
          <p>✔ Sürekli teknik destek</p>
        </div>
      </section>
{/* REFERENCES */}
<section className="relative z-10 px-6 py-24 border-t border-white/10 text-center">
  <h3 className="text-3xl font-semibold mb-12">
    İşletmeler Ne Diyor?
  </h3>

  <div className="max-w-4xl mx-auto flex justify-center">


    <div className="w-full md:w-[600px] bg-white/5 backdrop-blur-xl p-12 rounded-3xl border border-white/10 hover:-translate-y-2 hover:shadow-[0_20px_60px_rgba(139,92,246,0.25)] transition-all duration-300">

      <p className="text-gray-300 text-lg mb-6">

        İlk pilot işletme için görüşmeler devam ediyor.
      </p>
      <p className="font-semibold text-purple-400">
        Yakında burada yer alacak
      </p>
    </div>

  </div>
</section>

      {/* PRICING */}
      
      <section id="pricing" className="relative z-10 px-6 py-24 text-center border-t border-white/10">
        <h3 className="text-3xl font-semibold mb-10">
          Başlangıç Paketi
        </h3>

        <div className="bg-white/5 backdrop-blur-md p-10 rounded-3xl max-w-md mx-auto border border-white/10 hover:scale-105 hover:shadow-[0_20px_50px_rgba(139,92,246,0.3)] smooth-section">
          <p className="text-4xl font-bold text-purple-400 mb-4">
            4.500 TL
          </p>

          <p className="text-gray-400 mb-4">
            Tek seferlik kurulum
          </p>

          <p className="text-gray-400 mb-6">
            Aylık teknik destek: 750 TL
          </p>

          <p className="text-sm text-gray-500 mb-6">
            İlk 5 işletmeye özel lansman fiyatı
          </p>

          <a
            href="https://wa.me/905515550302"
            className="inline-block bg-gradient-to-r from-purple-500 to-blue-500 px-8 py-4 rounded-full font-semibold hover:scale-105 transition"
          >
           Hemen Başlamak İçin İletişime Geç

          </a>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative z-10 px-6 py-32 text-center border-t border-white/10">
        <h3 className="text-4xl font-bold mb-6">
          İşletmenizi Otomatiğe Bağlayın
        </h3>

        <a
          href="/demo"
          className="bg-gradient-to-r from-purple-500 to-blue-500 px-10 py-5 rounded-full font-semibold hover:scale-105 hover:shadow-[0_10px_40px_rgba(139,92,246,0.5)] transition-all duration-300"
        >
          Demo Deneyin
        </a>
      </section>

      {/* FOOTER */}
      <footer className="relative z-10 text-center py-10 text-gray-500 text-sm border-t border-white/10">
        © 2026 Sitemix. Tüm hakları saklıdır.
      </footer>

    </main>
  );
}
