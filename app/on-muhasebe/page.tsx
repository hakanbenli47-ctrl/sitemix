import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Sitemix Ön Muhasebe | 7 Gün Ücretsiz Dene",
  description:
    "Cari, stok, fiyat, gelir-gider, tahsilat, ödeme, fatura ve rapor takibini tek panelden yönetin. Sitemix Ön Muhasebe'yi 7 gün ücretsiz deneyin.",
};

const navItems = [
  { label: "Özellikler", href: "#ozellikler" },
  { label: "İş Akışı", href: "#is-akisi" },
  { label: "Fiyatlar", href: "#fiyatlar" },
  { label: "SSS", href: "#sss" },
];

const heroMetrics = [
  { value: "7 gün", label: "ücretsiz deneme" },
  { value: "₺399", label: "aylık başlangıç" },
  { value: "₺960", label: "yıllık kazanç" },
];

const quickActions = [
  {
    title: "Tek tıkla cari ekle",
    text: "Müşteri, tedarikçi veya firma hesabını saniyeler içinde aç. Alacak, borç ve hareket geçmişini aynı ekranda takip et.",
    tag: "Cari",
  },
  {
    title: "Tek tıkla stok ekle",
    text: "Ürün adı, kategori, alış fiyatı, satış fiyatı, barkod ve mevcut stok bilgisini hızlıca sisteme işle.",
    tag: "Stok",
  },
  {
    title: "Toplu aktarım hazır",
    text: "Excel mantığıyla cari, ürün ve stok verilerini toplu yüklemeye uygun altyapı. Tek tek uğraşmadan liste halinde içeri al.",
    tag: "Toplu",
  },
  {
    title: "Hızlı tahsilat ve gider",
    text: "Nakit, banka, kredi kartı, kasa çıkışı ve işletme giderlerini hızlı işlem mantığıyla kaydet.",
    tag: "Kasa",
  },
];

const modules = [
  {
    title: "Cari hesap",
    desc: "Müşteri ve tedarikçi bakiyelerini net gör.",
    items: ["Alacak-borç", "Hareket geçmişi", "Tahsilat notu"],
  },
  {
    title: "Stok ve ürün",
    desc: "Ürünlerini fiyat ve miktar bilgisiyle takip et.",
    items: ["Alış fiyatı", "Satış fiyatı", "Düşük stok"],
  },
  {
    title: "Gelir-gider",
    desc: "Günlük para giriş çıkışlarını düzenli kaydet.",
    items: ["Kategori", "Kasa", "Aylık özet"],
  },
  {
    title: "Fatura ve fiş",
    desc: "Satış, alış, belge ve fiş kayıtlarını toparla.",
    items: ["Satış kaydı", "Alış kaydı", "Belge notu"],
  },
  {
    title: "Tahsilat ödeme",
    desc: "Kimden ne alınacak, kime ne ödenecek karışmasın.",
    items: ["Vade", "Durum", "Hatırlatma"],
  },
  {
    title: "Rapor ekranı",
    desc: "İşletmenin günlük durumunu tek bakışta oku.",
    items: ["Kasa özeti", "Açık cari", "Stok özeti"],
  },
];

const workflow = [
  {
    step: "01",
    title: "Hesabını aç",
    text: "7 gün ücretsiz denemeyi başlat. Sade kayıt akışıyla işletme hesabını oluştur.",
  },
  {
    step: "02",
    title: "Cari ve stoklarını ekle",
    text: "Tek tek ekle veya toplu aktarım mantığıyla ürün, fiyat, stok ve cari bilgilerini hazırla.",
  },
  {
    step: "03",
    title: "Günlük işlemleri gir",
    text: "Tahsilat, ödeme, gider, satış ve kasa hareketlerini hızlı işlem butonlarıyla kaydet.",
  },
  {
    step: "04",
    title: "Raporlardan takip et",
    text: "Bugün ne kazandın, kime borcun var, kimden alacağın var ve stokta ne kaldı net gör.",
  },
];

const comparison = [
  "Defter, Excel ve WhatsApp notlarını tek düzene toplar.",
  "Cari, stok, fiyat ve kasa karışıklığını azaltır.",
  "Küçük işletmelerin anlayacağı sade bir panel mantığı sunar.",
  "Mobilde hızlı işlem için büyük buton ve net alanlarla tasarlanır.",
];

const pricingPlans = [
  {
    name: "Aylık",
    badge: "Esnek başlangıç",
    price: "₺399",
    period: "/ay",
    monthly: "Aylık ödeme",
    normal: "Taahhüt yok",
    saving: "Esnek kullanım",
    savingDetail: "Önce dene, aylık devam et.",
    desc: "Yeni başlayan işletmeler için en hızlı başlangıç.",
    highlighted: false,
    featured: false,
    features: [
      "7 gün ücretsiz deneme",
      "Cari hesap takibi",
      "Stok ve ürün takibi",
      "Gelir-gider kaydı",
      "Tahsilat ve ödeme takibi",
      "Mobil uyumlu kullanım",
    ],
  },
  {
    name: "6 Aylık",
    badge: "Daha avantajlı",
    price: "₺359",
    period: "/ay",
    monthly: "6 ay toplam ₺2.154",
    normal: "Normal: ₺2.394",
    saving: "₺240 kazanç",
    savingDetail: "Aylığa göre %10 daha avantajlı.",
    desc: "Düzenli kullanmak isteyen işletmeler için dengeli paket.",
    highlighted: true,
    featured: false,
    features: [
      "Aylık paketteki her şey",
      "Toplu cari aktarım altyapısı",
      "Toplu ürün / stok aktarım altyapısı",
      "Alış-satış fiyat takibi",
      "Gelişmiş işletme özeti",
      "Ödeme ve tahsilat görünümü",
    ],
  },
  {
    name: "Yıllık",
    badge: "En kârlı seçim",
    price: "₺319",
    period: "/ay",
    monthly: "Yıllık toplam ₺3.828",
    normal: "Normal: ₺4.788",
    saving: "₺960 kazanç",
    savingDetail: "Aylığa göre %20 daha avantajlı.",
    desc: "Uzun süreli kullanımda en düşük aylık maliyet.",
    highlighted: false,
    featured: true,
    features: [
      "6 aylık paketteki her şey",
      "En düşük aylık maliyet",
      "Yıllık kullanım avantajı",
      "Yedekleme ve dışa aktarma altyapısı",
      "Yeni modüllere erken erişim",
      "Öncelikli geliştirme desteği",
    ],
  },
];

const faqs = [
  {
    question: "7 gün ücretsiz denemede ödeme gerekiyor mu?",
    answer:
      "Hayır. Kullanıcı sistemi önce ücretsiz deneyebilir. İşletmesine uygunsa paket seçerek devam eder.",
  },
  {
    question: "Aylık paket fiyatı ne kadar?",
    answer:
      "Aylık paket 399 TL olarak kurgulandı. 6 aylık ve yıllık paketler bu fiyat üzerinden indirimli hesaplandı.",
  },
  {
    question: "Toplu cari ve stok ekleme olacak mı?",
    answer:
      "Evet. Platform akışında cari, ürün ve stok bilgilerinin toplu aktarım mantığıyla eklenmesi hedefleniyor.",
  },
  {
    question: "Telefondan kullanılabilecek mi?",
    answer:
      "Evet. Tasarım mobil öncelikli kurgulanıyor. İşletme sahibi temel işlemleri telefondan rahatça yapabilecek.",
  },
];

export default function OnMuhasebePage() {
  return (
    <main className="min-h-screen overflow-hidden bg-[#eef2ff] text-[#0b1025]">
      <header className="sticky top-0 z-50 border-b border-[#111827]/10 bg-white/85 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="group flex items-center gap-3">
            <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl bg-[#111827] text-sm font-black text-white shadow-lg shadow-indigo-900/20">
              <span className="absolute inset-0 bg-gradient-to-br from-[#7c3aed] via-[#06b6d4] to-[#22c55e] opacity-85 transition group-hover:scale-125" />
              <span className="relative">S</span>
            </span>
            <span className="leading-tight">
              <span className="block text-base font-black tracking-[-0.03em]">
                Sitemix
              </span>
              <span className="block text-xs font-extrabold text-slate-500">
                Ön Muhasebe Platformu
              </span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {navItems.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-black text-slate-500 transition hover:text-[#111827]"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              href="/on-muhasebe/giris"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full border border-slate-200 bg-white px-5 text-sm font-black text-[#111827] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
            >
              Giriş Yap
            </Link>
            <Link
              href="/on-muhasebe/kayit"
              className="inline-flex min-h-[46px] items-center justify-center rounded-full bg-[#4f46e5] px-5 text-sm font-black text-white shadow-lg shadow-indigo-500/25 transition hover:bg-[#4338ca]"
            >
              7 Gün Ücretsiz Dene
            </Link>
          </div>

          <Link
            href="/on-muhasebe/kayit"
            className="inline-flex min-h-[44px] items-center justify-center rounded-full bg-[#4f46e5] px-4 text-xs font-black text-white shadow-lg shadow-indigo-500/25 md:hidden"
          >
            Ücretsiz Dene
          </Link>
        </div>
      </header>

      <section className="relative px-5 pb-14 pt-8 lg:px-8 lg:pb-20 lg:pt-16">
        <div className="absolute left-[-120px] top-10 h-72 w-72 rounded-full bg-[#7c3aed]/20 blur-3xl" />
        <div className="absolute right-[-120px] top-28 h-72 w-72 rounded-full bg-[#06b6d4]/20 blur-3xl" />
        <div className="absolute bottom-0 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-[#22c55e]/10 blur-3xl" />

        <div className="relative mx-auto grid max-w-7xl gap-10 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-xs font-black text-[#4f46e5] shadow-sm shadow-indigo-900/5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#22c55e] opacity-75" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-[#22c55e]" />
              </span>
              7 gün ücretsiz dene, aylık sadece ₺399
            </div>

            <h1 className="mt-6 max-w-5xl text-4xl font-black tracking-[-0.06em] text-[#0b1025] sm:text-5xl lg:text-7xl">
              Cari, stok ve kasanı
              <span className="block bg-gradient-to-r from-[#4f46e5] via-[#06b6d4] to-[#22c55e] bg-clip-text text-transparent motion-safe:animate-pulse">
                tek ekranda yönet.
              </span>
            </h1>

            <p className="mt-6 max-w-2xl text-base font-semibold leading-8 text-slate-600 sm:text-lg">
              Sitemix Ön Muhasebe; cari hesap, ürün, stok, alış-satış fiyatı,
              gelir-gider, tahsilat, ödeme ve günlük kasa özetini sade bir
              panelde toplamak için tasarlanır. Önce 7 gün ücretsiz dene,
              sonra işletmene uygunsa devam et.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/on-muhasebe/kayit"
                className="group inline-flex min-h-[58px] items-center justify-center rounded-full bg-[#4f46e5] px-8 text-sm font-black text-white shadow-xl shadow-indigo-500/25 transition hover:bg-[#4338ca]"
              >
                7 Gün Ücretsiz Başla
                <span className="ml-2 transition group-hover:translate-x-1">→</span>
              </Link>
              <Link
                href="/on-muhasebe/giris"
                className="inline-flex min-h-[58px] items-center justify-center rounded-full border border-slate-200 bg-white px-8 text-sm font-black text-[#111827] shadow-sm transition hover:border-indigo-200 hover:bg-indigo-50"
              >
                Giriş Yap
              </Link>
            </div>

            <p className="mt-5 text-sm font-bold text-slate-500">
              Kurulum yok. Karmaşık ekran yok. Küçük işletmeler için hızlı ve
              anlaşılır takip mantığı.
            </p>

            <div className="mt-9 grid max-w-2xl gap-3 sm:grid-cols-3">
              {heroMetrics.map((item) => (
                <div
                  key={item.label}
                  className="rounded-3xl border border-white bg-white/75 p-5 shadow-sm shadow-indigo-900/5 backdrop-blur"
                >
                  <p className="text-2xl font-black tracking-[-0.05em] text-[#111827]">
                    {item.value}
                  </p>
                  <p className="mt-1 text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div className="relative">
            <div className="absolute -right-6 -top-6 hidden rounded-3xl bg-[#22c55e] px-5 py-4 text-sm font-black text-white shadow-xl shadow-emerald-500/25 motion-safe:animate-bounce sm:block">
              + Stok eklendi
            </div>
            <div className="absolute -bottom-6 -left-6 hidden rounded-3xl bg-[#06b6d4] px-5 py-4 text-sm font-black text-white shadow-xl shadow-cyan-500/25 motion-safe:animate-pulse sm:block">
              ₺960 yıllık kazanç
            </div>

            <div className="overflow-hidden rounded-[2.25rem] border border-white/70 bg-[#0b1025] p-4 shadow-2xl shadow-indigo-950/25 sm:p-6">
              <div className="rounded-[1.75rem] bg-white p-4 sm:p-5">
                <div className="flex items-center justify-between gap-4 border-b border-slate-100 pb-4">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">
                      Canlı ön izleme
                    </p>
                    <h2 className="mt-1 text-xl font-black tracking-[-0.04em] text-[#111827]">
                      İşletme paneli
                    </h2>
                  </div>
                  <span className="rounded-full bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-600">
                    Aktif
                  </span>
                </div>

                <div className="mt-5 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-3xl bg-indigo-50 p-4">
                    <p className="text-xs font-black text-indigo-600">Kasa</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#111827]">
                      ₺42.850
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Güncel işletme bakiyesi
                    </p>
                  </div>
                  <div className="rounded-3xl bg-cyan-50 p-4">
                    <p className="text-xs font-black text-cyan-700">Alacak</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#111827]">
                      ₺18.300
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Açık cari hareket
                    </p>
                  </div>
                  <div className="rounded-3xl bg-emerald-50 p-4">
                    <p className="text-xs font-black text-emerald-700">Stok</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#111827]">
                      128
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Kayıtlı ürün
                    </p>
                  </div>
                  <div className="rounded-3xl bg-violet-50 p-4">
                    <p className="text-xs font-black text-violet-700">Gider</p>
                    <p className="mt-2 text-3xl font-black tracking-[-0.05em] text-[#111827]">
                      ₺7.920
                    </p>
                    <p className="mt-1 text-xs font-bold text-slate-500">
                      Bu ay işlenen gider
                    </p>
                  </div>
                </div>

                <div className="mt-4 rounded-3xl bg-[#0b1025] p-4 text-white">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.2em] text-white/45">
                        Hızlı işlem
                      </p>
                      <p className="mt-1 text-lg font-black tracking-[-0.03em]">
                        En sık kullanılanlar
                      </p>
                    </div>
                    <span className="rounded-full bg-white px-3 py-2 text-xs font-black text-[#0b1025]">
                      Tek tık
                    </span>
                  </div>

                  <div className="mt-4 grid gap-2 sm:grid-cols-2">
                    {["+ Cari", "+ Stok", "+ Gider", "+ Tahsilat"].map(
                      (item) => (
                        <span
                          key={item}
                          className="rounded-2xl bg-white px-4 py-3 text-center text-xs font-black text-[#0b1025]"
                        >
                          {item}
                        </span>
                      ),
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="ozellikler" className="mx-auto max-w-7xl px-5 py-14 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#4f46e5]">
              Hızlı işlemler
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-5xl">
              Günlük işleri tek tek uğraştırmadan hızlandır.
            </h2>
          </div>
          <p className="max-w-2xl text-base font-semibold leading-8 text-slate-600 lg:ml-auto">
            İşletme sahibinin ihtiyacı netliktir. Bu yüzden ana işlem akışı;
            cari, stok, gelir-gider, tahsilat ve toplu aktarım üzerine kuruldu.
          </p>
        </div>

        <div className="mt-10 grid gap-5 md:grid-cols-2">
          {quickActions.map((item) => (
            <div
              key={item.title}
              className="group relative overflow-hidden rounded-[2rem] border border-white bg-white p-6 shadow-sm shadow-indigo-900/5 transition hover:-translate-y-1 hover:shadow-xl hover:shadow-indigo-900/10"
            >
              <div className="absolute right-[-40px] top-[-40px] h-32 w-32 rounded-full bg-indigo-100 opacity-0 blur-2xl transition group-hover:opacity-100" />
              <div className="relative">
                <span className="inline-flex rounded-full bg-[#eef2ff] px-3 py-2 text-xs font-black text-[#4f46e5]">
                  {item.tag}
                </span>
                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em] text-[#0b1025]">
                  {item.title}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                  {item.text}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section id="is-akisi" className="bg-white px-5 py-16 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#4f46e5]">
                İş akışı
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-5xl">
                Kullanıcıyı kayda götüren sade düzen.
              </h2>
              <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
                Önce ücretsiz deneme, sonra hızlı kurulum, ardından günlük
                işlemler ve rapor ekranı. Akış net olduğu için kullanıcı ne
                alacağını daha kolay anlar.
              </p>
            </div>

            <div className="grid gap-4">
              {workflow.map((item) => (
                <div
                  key={item.step}
                  className="grid gap-4 rounded-[2rem] border border-slate-100 bg-slate-50 p-5 sm:grid-cols-[72px_1fr]"
                >
                  <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#4f46e5] text-sm font-black text-white shadow-lg shadow-indigo-500/20">
                    {item.step}
                  </span>
                  <div>
                    <h3 className="text-xl font-black tracking-[-0.04em] text-[#0b1025]">
                      {item.title}
                    </h3>
                    <p className="mt-2 text-sm font-semibold leading-7 text-slate-600">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[0.75fr_1.25fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#4f46e5]">
              Modüller
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-5xl">
              Ön muhasebe için gereken ana yapı burada.
            </h2>
            <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
              Karmaşık muhasebe ekranları yerine; günlük para, stok ve cari
              takibini kolaylaştıran sade bir sistem.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            {modules.map((module) => (
              <div
                key={module.title}
                className="rounded-[2rem] border border-white bg-white p-6 shadow-sm shadow-indigo-900/5"
              >
                <h3 className="text-xl font-black tracking-[-0.04em] text-[#0b1025]">
                  {module.title}
                </h3>
                <p className="mt-2 text-sm font-semibold leading-6 text-slate-600">
                  {module.desc}
                </p>
                <div className="mt-5 flex flex-wrap gap-2">
                  {module.items.map((item) => (
                    <span
                      key={item}
                      className="rounded-full bg-slate-100 px-3 py-2 text-xs font-black text-slate-600"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="px-5 py-10 lg:px-8">
        <div className="mx-auto max-w-7xl overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-[#4f46e5] via-[#06b6d4] to-[#22c55e] p-[1px] shadow-2xl shadow-indigo-900/15">
          <div className="grid gap-8 rounded-[2.45rem] bg-white p-7 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:p-12">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.25em] text-[#4f46e5]">
                Toplu işlem gücü
              </p>
              <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-5xl">
                Yüzlerce ürünü ve cariyi tek tek girmek zorunda kalma.
              </h2>
              <p className="mt-5 text-base font-semibold leading-8 text-slate-600">
                Toplu cari, toplu ürün ve toplu stok aktarımı öne çıkarıldı.
                Bu alan kullanıcıya gerçek bir platform hissi verir ve deneme
                butonuna geçişi güçlendirir.
              </p>
            </div>

            <div className="rounded-[2rem] bg-[#0b1025] p-5 text-white">
              <div className="grid grid-cols-4 gap-2 border-b border-white/10 pb-3 text-xs font-black text-white/50">
                <span>Ürün</span>
                <span>Stok</span>
                <span>Alış</span>
                <span>Satış</span>
              </div>
              {[
                ["Filtre", "42", "₺90", "₺140"],
                ["Yağ", "18", "₺310", "₺430"],
                ["Balata", "12", "₺620", "₺850"],
                ["Ampul", "76", "₺35", "₺65"],
              ].map((row) => (
                <div
                  key={row.join("-")}
                  className="grid grid-cols-4 gap-2 border-b border-white/10 py-4 text-sm font-bold text-white/85"
                >
                  {row.map((cell) => (
                    <span key={cell}>{cell}</span>
                  ))}
                </div>
              ))}
              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <span className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-white text-sm font-black text-[#0b1025]">
                  Toplu içe aktar
                </span>
                <span className="inline-flex min-h-[48px] flex-1 items-center justify-center rounded-full bg-[#22c55e] text-sm font-black text-[#052e16]">
                  Şablon indir
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="fiyatlar" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-[0.85fr_1.15fr] lg:items-end">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#4f46e5]">
              Fiyatlar
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-5xl">
              Aylık ₺399. 6 ay ve yıllıkta aylık maliyet düşer.
            </h2>
          </div>
          <div className="rounded-[2rem] bg-[#0b1025] p-5 text-white shadow-xl shadow-indigo-950/15">
            <p className="text-sm font-black text-white/50">Hesap net</p>
            <p className="mt-2 text-lg font-black tracking-[-0.03em]">
              6 ayda ₺240, yılda ₺960 cebinde kalır.
            </p>
            <p className="mt-2 text-sm font-semibold leading-6 text-white/60">
              Aylık 399 TL baz alınarak 6 aylık pakette %10, yıllık pakette
              %20 avantaj gösterildi.
            </p>
          </div>
        </div>

        <div className="mt-10 grid gap-5 lg:grid-cols-3">
          {pricingPlans.map((plan) => (
            <div
              key={plan.name}
              className={[
                "relative overflow-hidden rounded-[2.25rem] p-6 shadow-sm transition hover:-translate-y-1",
                plan.highlighted
                  ? "bg-[#0b1025] text-white shadow-indigo-950/20"
                  : "border border-white bg-white text-[#0b1025] shadow-indigo-900/5",
              ].join(" ")}
            >
              {plan.highlighted ? (
                <div className="absolute right-[-60px] top-[-60px] h-48 w-48 rounded-full bg-[#4f46e5]/50 blur-3xl" />
              ) : null}
              {plan.featured ? (
                <div className="absolute right-5 top-5 rounded-full bg-emerald-100 px-3 py-2 text-xs font-black text-emerald-700">
                  En düşük aylık maliyet
                </div>
              ) : null}

              <div className="relative">
                <span
                  className={[
                    "inline-flex rounded-full px-3 py-2 text-xs font-black",
                    plan.highlighted
                      ? "bg-white text-[#0b1025]"
                      : "bg-indigo-50 text-[#4f46e5]",
                  ].join(" ")}
                >
                  {plan.badge}
                </span>

                <h3 className="mt-5 text-2xl font-black tracking-[-0.04em]">
                  {plan.name}
                </h3>
                <p
                  className={[
                    "mt-3 text-sm font-semibold leading-7",
                    plan.highlighted ? "text-white/70" : "text-slate-600",
                  ].join(" ")}
                >
                  {plan.desc}
                </p>

                <div className="mt-7 flex items-end gap-1">
                  <span className="text-5xl font-black tracking-[-0.07em]">
                    {plan.price}
                  </span>
                  <span
                    className={[
                      "pb-2 text-sm font-black",
                      plan.highlighted ? "text-white/55" : "text-slate-400",
                    ].join(" ")}
                  >
                    {plan.period}
                  </span>
                </div>

                <div
                  className={[
                    "mt-5 rounded-[1.5rem] p-4",
                    plan.highlighted
                      ? "bg-white/10 ring-1 ring-white/10"
                      : "bg-slate-50",
                  ].join(" ")}
                >
                  <p
                    className={[
                      "text-sm font-black",
                      plan.highlighted ? "text-cyan-200" : "text-[#4f46e5]",
                    ].join(" ")}
                  >
                    {plan.monthly}
                  </p>
                  <p
                    className={[
                      "mt-1 text-xs font-bold",
                      plan.highlighted ? "text-white/50" : "text-slate-500",
                    ].join(" ")}
                  >
                    {plan.normal}
                  </p>
                  <div
                    className={[
                      "mt-3 inline-flex rounded-full px-3 py-2 text-xs font-black",
                      plan.highlighted
                        ? "bg-[#22c55e] text-[#052e16]"
                        : "bg-emerald-100 text-emerald-700",
                    ].join(" ")}
                  >
                    {plan.saving}
                  </div>
                  <p
                    className={[
                      "mt-2 text-xs font-bold leading-5",
                      plan.highlighted ? "text-white/60" : "text-slate-500",
                    ].join(" ")}
                  >
                    {plan.savingDetail}
                  </p>
                </div>

                <Link
                  href="/on-muhasebe/kayit"
                  className={[
                    "mt-7 inline-flex min-h-[56px] w-full items-center justify-center rounded-full px-6 text-sm font-black transition",
                    plan.highlighted
                      ? "bg-[#facc15] text-[#0b1025] hover:bg-[#fde047]"
                      : "bg-[#4f46e5] text-white hover:bg-[#4338ca]",
                  ].join(" ")}
                >
                  7 Gün Ücretsiz Dene
                </Link>

                <ul className="mt-7 space-y-3">
                  {plan.features.map((feature) => (
                    <li
                      key={feature}
                      className={[
                        "flex gap-3 text-sm font-semibold leading-6",
                        plan.highlighted ? "text-white/78" : "text-slate-600",
                      ].join(" ")}
                    >
                      <span
                        className={[
                          "mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black",
                          plan.highlighted
                            ? "bg-white text-[#0b1025]"
                            : "bg-emerald-100 text-emerald-700",
                        ].join(" ")}
                      >
                        ✓
                      </span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-[#0b1025] px-5 py-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-white/45">
              Neden avantajlı?
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] sm:text-5xl">
              Defter ve Excel karışıklığını bırak,
              <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-yellow-200 bg-clip-text text-transparent motion-safe:animate-pulse">
                düzenli takip sistemine geç.
              </span>
            </h2>
          </div>
          <div className="grid gap-4">
            {comparison.map((item) => (
              <div
                key={item}
                className="flex gap-4 rounded-[1.75rem] bg-white/10 p-5 ring-1 ring-white/10"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#22c55e] text-sm font-black text-[#052e16]">
                  ✓
                </span>
                <p className="text-base font-black leading-7 text-white/85">
                  {item}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#0b1025] px-5 pb-16 text-white lg:px-8">
        <div className="mx-auto grid max-w-7xl gap-8 border-t border-white/10 pt-16 lg:grid-cols-[1fr_auto] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-white/40">
              Şimdi başla
            </p>
            <h2 className="mt-4 max-w-4xl text-3xl font-black tracking-[-0.05em] sm:text-5xl">
              Ön muhasebeni karışık notlardan çıkar,
              <span className="block bg-gradient-to-r from-cyan-300 to-emerald-300 bg-clip-text text-transparent">
                düzenli bir panele taşı.
              </span>
            </h2>
            <p className="mt-5 max-w-2xl text-base font-semibold leading-8 text-white/60">
              7 gün ücretsiz dene. Cari, stok, kasa ve günlük işletme özetini
              tek ekranda görmeye başla.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col">
            <Link
              href="/on-muhasebe/kayit"
              className="group inline-flex min-h-[60px] items-center justify-center rounded-full bg-[#4f46e5] px-8 text-sm font-black text-white shadow-xl shadow-indigo-500/30 ring-1 ring-white/10 transition hover:-translate-y-0.5 hover:bg-[#4338ca]"
            >
              <span className="text-white">7 Gün Ücretsiz Başla</span>
              <span className="ml-2 text-white transition group-hover:translate-x-1">
                →
              </span>
            </Link>

            <Link
              href="/on-muhasebe/giris"
              className="inline-flex min-h-[60px] items-center justify-center rounded-full border border-white/25 bg-white px-8 text-sm font-black shadow-lg shadow-white/10 transition hover:-translate-y-0.5 hover:bg-slate-100"
            >
              <span className="!text-[#0b1025]">Giriş Yap</span>
            </Link>
          </div>
        </div>
      </section>

      <section id="sss" className="mx-auto max-w-7xl px-5 py-16 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.25em] text-[#4f46e5]">
              Sık sorulanlar
            </p>
            <h2 className="mt-4 text-3xl font-black tracking-[-0.05em] text-[#0b1025] sm:text-5xl">
              Kullanıcının aklındaki soruları kayıt öncesi azalt.
            </h2>
          </div>

          <div className="space-y-5">
            {faqs.map((faq) => (
              <div
                key={faq.question}
                className="rounded-[2rem] border border-white bg-white p-6 shadow-sm shadow-indigo-900/5"
              >
                <h3 className="text-lg font-black tracking-[-0.03em] text-[#111827]">
                  {faq.question}
                </h3>
                <p className="mt-3 text-sm font-semibold leading-7 text-slate-600">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-white px-5 py-8 lg:px-8">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 text-sm font-bold text-slate-500 sm:flex-row sm:items-center sm:justify-between">
          <p>© Sitemix Ön Muhasebe</p>
          <div className="flex flex-wrap gap-5">
            <Link href="/" className="transition hover:text-[#111827]">
              Sitemix ana sayfa
            </Link>
            <Link
              href="/on-muhasebe/giris"
              className="transition hover:text-[#111827]"
            >
              Giriş
            </Link>
            <Link
              href="/on-muhasebe/kayit"
              className="transition hover:text-[#111827]"
            >
              Kaydol
            </Link>
          </div>
        </div>
      </footer>
    </main>
  );
}
