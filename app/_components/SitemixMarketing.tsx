import Link from "next/link";
import {
  ArrowRight,
  ArrowUpRight,
  Check,
  ChevronRight,
  Clock3,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Scissors,
  ShieldCheck,
  Smartphone,
  Sparkles,
} from "lucide-react";
import styles from "./sitemixMarketing.module.css";

const phone = "+905515550302";
const whatsapp = "https://wa.me/905515550302";
const whatsappOffer = `${whatsapp}?text=${encodeURIComponent("Merhaba, işletmem için internet sitesi teklifi almak istiyorum.")}`;

const projects = [
  { name: "Müjde Hair Beauty", category: "Kuaför & güzellik", description: "Bakım hizmetlerini güçlü görseller ve kolay iletişimle buluşturan salon sitesi.", url: "https://mujdehairbeauty.com.tr", beauty: true },
  { name: "By Willy Belek Kuaför", category: "Kuaför & bakım", description: "Hizmetleri, ekibi ve randevu yollarını öne çıkaran kurumsal web sitesi.", url: "https://bywillybelekkuafor.com.tr", beauty: true },
  { name: "Beyza Nails", category: "Tırnak stüdyosu", description: "Uygulama galerisi ve kolay randevu iletişimi sunan güzellik sitesi.", url: "https://beyzanails.com.tr", beauty: true },
  { name: "İncek Ender Perde", category: "Perde & ev tekstili", description: "Ürünleri, kampanyaları ve keşif taleplerini bir araya getiren site.", url: "https://incekenderperde.com" },
  { name: "Naturel Peruk", category: "Peruk & saç sistemleri", description: "Ürün ve hizmetlerini güven veren bir dille anlatan mobil uyumlu site.", url: "https://naturelperuk.com" },
  { name: "Özdurmuş Hidrolik", category: "Sanayi & hidrolik", description: "Teknik hizmetleri ve firma yetkinliğini anlatan kurumsal web sitesi.", url: "https://ozdurmushidrolik.com.tr" },
  { name: "Dekorasyoncum", category: "Dekorasyon", description: "Ürün katalogları ve uygulama hizmetlerini buluşturan web sitesi.", url: "https://dekorasyoncum.com.tr" },
  { name: "Kervan Döner", category: "Restoran & sipariş", description: "Menüyü gösteren ve müşteriyi kolay siparişe yönlendiren restoran sitesi.", url: "https://kervandoner.com" },
  { name: "Engelli Taşıma", category: "Ulaşım & hizmet", description: "Hizmetleri anlaşılır anlatan, erişilebilir kurumsal web sitesi.", url: "https://engellitasima.com" },
  { name: "Neva Shop", category: "E-ticaret", description: "Ürün keşfi ve alışverişi kolaylaştıran online mağaza.", url: "https://nevashop.tr" },
  { name: "Hasköy Shell Araç Bakım", category: "Otomotiv & servis", description: "Araç bakım hizmetlerini ve hızlı iletişimi öne çıkaran site.", url: "https://haskoyshellaracbakim.com.tr" },
];

const services = [
  { title: "İşletmenizi anlatan tasarım", description: "Hizmetlerinizi, çalışma saatlerinizi ve iletişim bilgilerinizi müşterinize kolayca gösterin." },
  { title: "Telefonda kolay kullanım", description: "Ziyaretçileriniz hangi cihazdan gelirse gelsin sitenizi rahatça kullansın." },
  { title: "Google'a uygun altyapı", description: "Arama motorlarının okuyabildiği sayfalar, doğru başlıklar ve temel görünürlük ayarları." },
  { title: "Hızlı iletişim ve randevu", description: "WhatsApp, telefon, harita ve ihtiyaç duyduğunuz özel formlarla müşterilerinize ulaşın." },
];

const steps = [
  { title: "Görüşelim", description: "WhatsApp'tan işinizi ve ihtiyacınızı konuşuyoruz." },
  { title: "Tasarlayalım", description: "Sitenizi hazırlıyor, onayınıza sunuyoruz." },
  { title: "Yayına Alalım", description: "Siteniz yayında; bakım ve destek bizden." },
];

const packages = [
  {
    name: "Başlangıç", price: "3.999", note: "Yerel işletmeler için sade ve etkili başlangıç",
    features: ["Tek sayfalık profesyonel tasarım", "Telefon ve tablet uyumu", "WhatsApp ve arama butonları", "Google Haritalar bağlantısı", "Temel arama motoru ayarları"],
  },
  {
    name: "Kurumsal", price: "5.999", note: "Hizmetlerini daha detaylı tanıtmak isteyenlere", featured: true,
    features: ["5 sayfaya kadar kurumsal yapı", "İşletmenize özel görsel tasarım", "Hizmetler ve fotoğraf galerisi", "İletişim ve teklif formu", "Mobil uyum ve temel SEO ayarları"],
  },
  {
    name: "E-Ticaret", price: "9.999", note: "İnternetten ürün sunmak ve sipariş almak için",
    features: ["Ürün kataloğu ve kategoriler", "Sepet ve sipariş akışı", "WhatsApp / havale sipariş seçeneği", "Ürün yönetim alanı", "Mobil uyum ve temel SEO ayarları"],
  },
];

function SectionHeading({ eyebrow, title, description }: { eyebrow: string; title: string; description?: string }) {
  return (
    <div className={styles.sectionHeader}>
      <span className={styles.eyebrow}><span className={styles.eyebrowDot} />{eyebrow}</span>
      <h2>{title}</h2>
      {description ? <p>{description}</p> : null}
    </div>
  );
}

function ProjectCard({ project, index }: { project: (typeof projects)[number]; index: number }) {
  return (
    <a href={project.url} target="_blank" rel="noopener noreferrer" className={styles.projectCard}>
      <div className={styles.projectTop}>
        <span className={styles.projectNumber}>{String(index + 1).padStart(2, "0")}</span>
        <span className={styles.projectStatus}><span /> Yayındaki çalışma</span>
      </div>
      <div>
        <span className={styles.projectCategory}>{project.category}</span>
        <h3>{project.name}</h3>
        <p>{project.description}</p>
      </div>
      <span className={styles.projectLink}>Siteyi incele <ArrowUpRight size={16} aria-hidden="true" /></span>
    </a>
  );
}

export default function SitemixMarketing() {
  return (
    <div className={styles.marketing}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <Link href="/" className={styles.brand} aria-label="SiteMix ana sayfa">
            <span className={styles.brandMark}>S</span>
            <span className={styles.brandWords}><strong>SiteMix</strong><small>WEB TASARIM</small></span>
          </Link>
          <nav className={styles.desktopNav} aria-label="Ana menü">
            <a href="#referanslar">Çalışmalarımız</a>
            <a href="#surec">Nasıl çalışıyoruz?</a>
            <a href="#fiyatlar">Fiyatlar</a>
            <a href="#hakkimizda">Hakkımızda</a>
            <a href="#iletisim">İletişim</a>
          </nav>
          <div className={styles.headerActions}>
            <Link href="/on-muhasebe/giris" className={styles.accountingLink}>Ön Muhasebe Girişi</Link>
            <a href={whatsappOffer} className={styles.headerCta} target="_blank" rel="noopener noreferrer">Teklif al <ArrowUpRight size={17} /></a>
          </div>
          <details className={styles.mobileMenu}>
            <summary aria-label="Menüyü aç">Menü <span aria-hidden="true">☰</span></summary>
            <nav aria-label="Mobil menü">
              <a href="#referanslar">Çalışmalarımız</a>
              <a href="#surec">Nasıl çalışıyoruz?</a>
              <a href="#fiyatlar">Fiyatlar</a>
              <a href="#hakkimizda">Hakkımızda</a>
              <a href="#iletisim">İletişim</a>
              <Link href="/on-muhasebe/giris">Ön Muhasebe Girişi</Link>
            </nav>
          </details>
        </div>
      </header>

      <main>
        <section className={styles.hero} aria-labelledby="hero-title">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.heroInner}>
            <div className={styles.heroCopy}>
              <span className={styles.heroBadge}><span className={styles.eyebrowDot} /> Antalya&apos;dan tüm Türkiye&apos;ye</span>
              <h1 id="hero-title">İşinize <span>müşteri getiren</span> internet siteleri<span className={styles.heroPeriod}>.</span></h1>
              <p>Kuaför, güzellik salonu, restoran, oto servis ve tüm yerel işletmeler için mobil uyumlu, Google&apos;da bulunan profesyonel siteler. Antalya&apos;dan tüm Türkiye&apos;ye.</p>
              <div className={styles.heroButtons}>
                <a href={whatsappOffer} className={styles.primaryButton} target="_blank" rel="noopener noreferrer"><MessageCircle size={19} /> WhatsApp&apos;tan Teklif Al <ArrowUpRight size={18} /></a>
                <a href="#referanslar" className={styles.secondaryButton}>Çalışmalarımızı Gör <ArrowRight size={18} /></a>
              </div>
              <div className={styles.heroChecks}><span><Check size={16} /> Mobil uyumlu</span><span><Check size={16} /> Google altyapısı</span><span><Check size={16} /> Yayın sonrası destek</span></div>
            </div>
            <aside className={styles.heroPanel} aria-label="SiteMix ile neler kazanırsınız">
              <span className={styles.panelKicker}>İşletmeniz için gerçek faydalar</span>
              <h2>Daha çok kişiye ulaşın. Daha kolay iletişim kurun.</h2>
              <div className={styles.panelBenefits}>
                <span><Smartphone size={21} /> Telefonda rahat kullanım</span>
                <span><MapPin size={21} /> Kolay adres ve yol tarifi</span>
                <span><MessageCircle size={21} /> Tek dokunuşla WhatsApp</span>
                <span><ShieldCheck size={21} /> Güven veren profesyonel görünüm</span>
              </div>
              <a href={`tel:${phone}`} className={styles.panelPhone}><span><small>Doğrudan arayın</small><strong>0551 555 03 02</strong></span><Phone size={22} /></a>
            </aside>
          </div>
        </section>

        <section id="referanslar" className={styles.section}>
          <div className={styles.container}>
            <SectionHeading eyebrow="Seçilmiş çalışmalar" title="Anlattığımız işi önce kendimiz gösteriyoruz." description="Farklı sektörler için hazırladığımız, yayında olan internet sitelerinden bazıları." />
            <div className={styles.projectGrid}>{projects.map((project, index) => <ProjectCard key={project.url} project={project} index={index} />)}</div>
          </div>
        </section>

        <section id="hizmetler" className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.container}>
            <SectionHeading eyebrow="Ne yapıyoruz?" title="Sadece güzel değil, işinize yarayan siteler." description="İşletmenizin müşteriye ulaşmasını kolaylaştıran, anlaşılır ve kullanışlı bir internet sitesi hazırlıyoruz." />
            <div className={styles.serviceGrid}>{services.map((service, i) => <article key={service.title} className={styles.serviceCard}><span className={styles.cardIndex}>{String(i + 1).padStart(2, "0")}</span><h3>{service.title}</h3><p>{service.description}</p></article>)}</div>
          </div>
        </section>

        <section id="surec" className={styles.section}>
          <div className={styles.container}>
            <SectionHeading eyebrow="Nasıl çalışıyoruz?" title="Üç adımda internet siteniz hazır." description="Her adımda ne yaptığımızı bilirsiniz. Onayınız olmadan sitenizi yayına almayız." />
            <div className={styles.stepsGrid}>{steps.map((step, i) => <article key={step.title} className={styles.stepCard}><span className={styles.stepNumber}>{i + 1}</span><h3>{step.title}</h3><p>{step.description}</p><ChevronRight className={styles.stepArrow} size={24} aria-hidden="true" /></article>)}</div>
          </div>
        </section>

        <section id="fiyatlar" className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={styles.container}>
            <SectionHeading eyebrow="Şeffaf başlangıç fiyatları" title="İşletmenize uygun paketi seçin." description="Her işletmenin ihtiyacı farklıdır. Size uygun kapsamı görüşerek netleştiriyoruz." />
            <div className={styles.pricingGrid}>{packages.map((pack) => <article key={pack.name} className={`${styles.priceCard} ${pack.featured ? styles.priceFeatured : ""}`}>
              {pack.featured ? <span className={styles.popularBadge}>En çok tercih edilen</span> : null}
              <h3>{pack.name}</h3><p className={styles.packageNote}>{pack.note}</p>
              <div className={styles.price}><strong>{pack.price} TL</strong><span>&apos;den başlayan fiyatlarla</span></div>
              <ul>{pack.features.map((feature) => <li key={feature}><Check size={16} aria-hidden="true" />{feature}</li>)}</ul>
              <a href={`${whatsapp}?text=${encodeURIComponent(`Merhaba, ${pack.name} paketiniz için teklif almak istiyorum.`)}`} target="_blank" rel="noopener noreferrer" className={pack.featured ? styles.primaryButton : styles.secondaryButton}>Paket için teklif al <ArrowUpRight size={17} /></a>
            </article>)}</div>
            <p className={styles.maintenance}><ShieldCheck size={22} aria-hidden="true" /><span><strong>Aylık bakım ve destek paketi: 499 TL/ay.</strong> İsteğe bağlıdır. Güncelleme ve teknik destek kapsamı teklif sırasında netleştirilir.</span></p>
          </div>
        </section>

        <section id="guzellik" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.beautyIntro}><div><span className={styles.eyebrow}><Scissors size={16} /> Sektörünüze özel</span><h2>Kuaför ve güzellik salonlarına özel</h2><p>Online randevu butonu, hizmet ve fiyat listesi, fotoğraf galerisi ve Google Haritalar entegrasyonu ile salonunuza yeni müşteri getiren siteler.</p></div><a href={whatsappOffer} target="_blank" rel="noopener noreferrer" className={styles.secondaryButton}>Salonum için teklif al <ArrowUpRight size={17} /></a></div>
            <div className={styles.beautyGrid}>{projects.filter((project) => project.beauty).map((project, index) => <ProjectCard key={project.url} project={project} index={index} />)}</div>
          </div>
        </section>

        <section className={`${styles.section} ${styles.sectionMuted}`} aria-labelledby="accounting-title">
          <div className={`${styles.container} ${styles.accountingBox}`}>
            <div><span className={styles.eyebrow}>SiteMix Ön Muhasebe</span><h2 id="accounting-title">Siteniz + Ön Muhasebe bir arada</h2><p>Cari hesap, stok, fatura ve raporlarınızı tek panelden yönetin. Web sitenizle birlikte alın, işinizi tek yerden yönetin.</p><div className={styles.accountingTags}><span>Cari hesap</span><span>Stok</span><span>Fatura</span><span>Raporlar</span></div><Link href="/on-muhasebe" className={styles.secondaryButton}>Ön Muhasebe&apos;yi incele <ArrowUpRight size={18} /></Link></div>
            <div className={styles.accountingVisual} aria-hidden="true"><span className={styles.accountingVisualTitle}>İşinizi tek yerden takip edin</span><div><span>Gelir ve gider takibi</span><Check size={19} /></div><div><span>Stok ve cari hesaplar</span><Check size={19} /></div><div><span>Fatura ve raporlar</span><Check size={19} /></div></div>
          </div>
        </section>

        <section id="yorumlar" className={styles.section}>
          <div className={styles.container}>
            <SectionHeading eyebrow="Müşteri deneyimi" title="Müşterilerimiz ne diyor?" description="Doğrulanmış müşteri yorumlarını burada paylaşacağız." />
            <div className={styles.reviewsGrid}>{[1, 2, 3].map((item) => <article className={styles.reviewCard} key={item}><span className={styles.reviewQuote}>“</span><p>Gerçek müşteri yorumu buraya eklenecek.</p><div><span className={styles.reviewAvatar}><MessageCircle size={20} /></span><span><strong>Müşteri adı</strong><small>İşletme adı</small></span></div></article>)}</div>
          </div>
        </section>

        <section id="hakkimizda" className={`${styles.section} ${styles.sectionMuted}`}>
          <div className={`${styles.container} ${styles.aboutGrid}`}>
            <div className={styles.photoPlaceholder} role="img" aria-label="Hakan Benli'nin fotoğrafı için ayrılan alan"><span>HB</span><small>Hakan Benli · Fotoğraf alanı</small></div>
            <div><span className={styles.eyebrow}><Sparkles size={16} /> Hakkımızda</span><h2>İşletmenizi anlayan bir web tasarım ekibi.</h2><p>Ben Hakan Benli. Antalya&apos;da SiteMix ile esnafın ve yerel işletmelerin internette daha güçlü görünmesine yardımcı oluyorum. Amacımız teknik terimlerle sizi yormadan, müşterilerinizin kolayca ulaşabildiği profesyonel web siteleri hazırlamak.</p><p>İlk görüşmeden tasarıma, yayından sonraki desteğe kadar doğrudan iletişim kurarak ilerliyoruz.</p><a href={whatsappOffer} target="_blank" rel="noopener noreferrer" className={styles.textLink}>Birlikte çalışalım <ArrowUpRight size={18} /></a></div>
          </div>
        </section>

        <section id="iletisim" className={styles.section}>
          <div className={styles.container}>
            <div className={styles.contactBanner}><div><span className={styles.eyebrow}>Yeni projenizi konuşalım</span><h2>İşletmenize yakışan siteyi birlikte yapalım.</h2><p>Ne iş yaptığınızı anlatın, size uygun web sitesi için birlikte en doğru yolu belirleyelim.</p><a href={whatsappOffer} target="_blank" rel="noopener noreferrer" className={styles.primaryButton}><MessageCircle size={20} /> WhatsApp&apos;tan Teklif Al <ArrowUpRight size={18} /></a></div><div className={styles.contactDetails}><a href={`tel:${phone}`}><Phone size={20} /><span><small>Telefon</small>0551 555 03 02</span></a><a href="mailto:info@sitemix.com.tr"><Mail size={20} /><span><small>E-posta</small>info@sitemix.com.tr</span></a><div><MapPin size={20} /><span><small>Konum</small>Antalya / Türkiye</span></div><div><Clock3 size={20} /><span><small>Çalışma saatleri</small>Pzt–Cmt 09:00–19:00</span></div></div></div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}><div className={styles.container}><div className={styles.footerTop}><Link href="/" className={styles.brand}><span className={styles.brandMark}>S</span><span className={styles.brandWords}><strong>SiteMix</strong><small>WEB TASARIM</small></span></Link><p>Antalya&apos;dan tüm Türkiye&apos;ye, işletmenize müşteri getirmeyi hedefleyen profesyonel internet siteleri.</p><nav aria-label="Alt menü"><a href="#referanslar">Çalışmalarımız</a><a href="#fiyatlar">Fiyatlar</a><a href="#hakkimizda">Hakkımızda</a><Link href="/on-muhasebe/giris">Ön Muhasebe</Link></nav></div><div className={styles.footerBottom}><span>© {new Date().getFullYear()} SiteMix. Tüm hakları saklıdır.</span><span>0551 555 03 02 · info@sitemix.com.tr · Antalya</span></div></div></footer>

      <a className={styles.floatingWhatsapp} href={whatsappOffer} target="_blank" rel="noopener noreferrer" aria-label="WhatsApp üzerinden SiteMix'e yazın"><MessageCircle size={26} aria-hidden="true" /><span>WhatsApp</span></a>
    </div>
  );
}
