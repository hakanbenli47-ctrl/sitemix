export type StudioSection = {
  id: string;
  type:
    | "hero"
    | "features"
    | "about"
    | "services"
    | "process"
    | "pricing"
    | "gallery"
    | "testimonials"
    | "faq"
    | "contact";
  title: string;
  text: string;
  items?: string[];
  details?: string[];
  answers?: string[];
  eyebrow?: string;
  ctaLabel?: string;
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

export type StudioDeployment = {
  project_id: string;
  github_repo_id?: number | null;
  github_repo_name?: string | null;
  github_repo_full_name?: string | null;
  github_repo_url?: string | null;
  github_commit_sha?: string | null;
  vercel_project_id?: string | null;
  vercel_project_name?: string | null;
  vercel_url?: string | null;
  domain?: string | null;
  status: string;
  last_error?: string | null;
  provisioned_at?: string | null;
  seo_synced_at?: string | null;
  updated_at?: string;
};

export type StudioSite = {
  contentVersion?: number;
  businessName: string;
  sector: string;
  location: string;
  tagline: string;
  phone: string;
  whatsapp: string;
  pageMode: "single" | "multi";
  theme: StudioTheme;
  design?: StudioDesign;
  media?: {
    logo?: string;
    hero?: string;
    about?: string;
    services?: string[];
    gallery?: string[];
  };
  deployment?: StudioDeployment;
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

type SectorContentKit = {
  heroText: string;
  about: string;
  serviceDetails: string[];
  faq: string[];
  visualPrompt: string;
};

const sectorContentKits: Record<string, SectorContentKit> = {
  kuafor: {
    heroText: "Önce seni ve saçını dinleyen bir danışmanlık, ardından yüzüne ve yaşam tarzına uygun kişisel bir uygulama.",
    about: "Her randevuyu kısa bir danışmanlıkla başlatır; saç yapısını, günlük bakım alışkanlıklarını ve istediğin sonucu birlikte değerlendiririz. Amacımız yalnızca o gün güzel görünen değil, evde de kolayca sürdürebileceğin bir stil oluşturmaktır.",
    serviceDetails: ["Yüz şekline ve saç yapısına göre kişisel kesim planı.", "Ton analizi, renk koruma ve bakım önerisiyle uygulama.", "Saçın ihtiyacına göre parlaklık, nem ve onarım bakımı.", "Prova, aksesuar uyumu ve gün boyu kalıcılık planı."],
    faq: ["Randevu öncesinde danışmanlık yapıyor musunuz?", "Renklendirme işlemi ne kadar sürer?", "Gelin saçı için prova gerekiyor mu?", "Evde bakım için ürün öneriyor musunuz?"],
    visualPrompt: "Salonun atmosferini veya tamamlanmış bir saç uygulamasını gösteren yatay bir fotoğraf",
  },
  berber: {
    heroText: "Klasik berberlik disiplinini modern stil danışmanlığıyla buluşturan, detaylara odaklı bir bakım deneyimi.",
    about: "Kesimden önce saçın çıkış yönünü, yüz hatlarını ve günlük kullanımını değerlendiririz. Makas, makine ve sakal tasarımını tek bir bütün olarak ele alır; her ziyaretinde tutarlı bir sonuç sunarız.",
    serviceDetails: ["Yüz hatlarına ve kullanım alışkanlığına göre net form.", "Sıcak havlu, kontur ve sakal yapısına uygun bakım.", "Arındırma ve nem desteğiyle kısa, etkili bakım.", "Kesim, sakal ve son dokunuşları kapsayan hazırlık."],
    faq: ["Randevusuz gelebilir miyim?", "Saç ve sakal birlikte ne kadar sürer?", "Damat paketi hangi uygulamaları kapsar?", "Çocuk kesimi yapıyor musunuz?"],
    visualPrompt: "Berber koltuğu, çalışma alanı veya tamamlanmış bir saç-sakal uygulamasını gösteren güçlü yatay fotoğraf",
  },
  guzellik: {
    heroText: "Cilt yapına ve hedeflerine göre planlanan, hijyen ve uygulama kalitesini merkeze alan kişisel bakım hizmetleri.",
    about: "Her uygulamadan önce ihtiyacı değerlendirir, kullanılacak ürünleri ve beklenen sonucu açıkça paylaşırız. Sterilizasyon, kişiye özel planlama ve doğal görünüm salon deneyimimizin temelidir.",
    serviceDetails: ["Cilt tipine göre analiz, arındırma ve nem desteği.", "Tırnak yapısını koruyan özenli hazırlık ve uygulama.", "Göz yapısına uygun doğal kıvrım ve bakım.", "Etkinlik, ışık ve ten tonuna göre kişisel görünüm."],
    faq: ["İlk uygulama öncesi analiz yapılıyor mu?", "Kullanılan ürünler hassas ciltlere uygun mu?", "Randevu iptal koşulları nelerdir?", "Uygulama sonrası bakım önerisi veriliyor mu?"],
    visualPrompt: "Temiz uygulama alanını veya gerçek bir bakım sonucunu gösteren aydınlık yatay fotoğraf",
  },
  "hali-yikama": {
    heroText: "Adresinden teslim alınan ürünler için kayıtlı süreç, uygun yıkama yöntemi ve planlı teslimat.",
    about: "Ürünleri teslim alırken türünü ve özel lekeleri kaydeder; uygun yıkama, durulama ve kurutma programını seçeriz. Sürecin her aşamasında ulaşılabilir olur, teslimat zamanını önceden netleştiririz.",
    serviceDetails: ["Ürün türüne göre ayrıştırma, yıkama ve kontrollü kurutma.", "Yerinde kumaş kontrolü, leke ön işlemi ve güçlü vakumlama.", "Dolgu yapısını koruyan yıkama ve tam kurutma süreci.", "Ev ve iş yerleri için planlı ekip ve yerinde uygulama."],
    faq: ["Hangi bölgelerden ücretsiz servisiniz var?", "Teslimat kaç gün sürüyor?", "Leke çıkmazsa bilgi veriyor musunuz?", "Koltuk yıkama sonrası kuruma süresi nedir?"],
    visualPrompt: "Temizleme ekibini, profesyonel ekipmanı veya öncesi-sonrası sonucu gösteren yatay fotoğraf",
  },
  "oto-yikama": {
    heroText: "Aracın yüzeyine uygun ürünler, kontrollü uygulama ve teslim öncesi ayrıntılı kalite kontrolü.",
    about: "Boyanın, jantların ve iç yüzeylerin ihtiyacını ayrı ayrı değerlendiririz. Her işlemde doğru ürün, doğru ekipman ve kontrollü uygulama kullanarak temizliği görünür bir sonuca dönüştürürüz.",
    serviceDetails: ["Temassız ön yıkama, detaylı dış temizlik ve iç vakum.", "Koltuk, tavan, zemin ve dar alanlarda derin temizlik.", "Boya durumuna göre yüzey düzeltme ve parlaklık koruması.", "Uygulama öncesi hazırlık ve uzun süreli yüzey koruması."],
    faq: ["Randevu gerekiyor mu?", "Detaylı temizlik ne kadar sürüyor?", "Seramik kaplama öncesi ekspertiz yapılıyor mu?", "Kullandığınız ürünler yüzeylere zarar verir mi?"],
    visualPrompt: "Parlak araç yüzeyini, detailing uygulamasını veya profesyonel çalışma alanını gösteren dramatik yatay fotoğraf",
  },
  "teknik-servis": {
    heroText: "Sorunu doğru tespit eden, yapılacak işlemi önceden açıklayan ve sonucu kayıt altına alan teknik servis.",
    about: "İlk görüşmede arızayı dinler, yerinde kontrolün ardından kapsam ve maliyet hakkında açık bilgi veririz. Onay alınmadan ek işlem yapmaz; tamamlanan işi anlaşılır biçimde teslim ederiz.",
    serviceDetails: ["Uygun ekip planlamasıyla hızlı yönlendirme.", "Belirti yerine arızanın kaynağına odaklanan kontrol.", "Parça ve işçilik kapsamı açıklanarak uygulama.", "Acil durumlarda öncelikli iletişim ve yönlendirme."],
    faq: ["Servis ücreti nasıl belirleniyor?", "Aynı gün servis mümkün mü?", "İşlem öncesi fiyat veriyor musunuz?", "Yapılan iş için garanti sunuyor musunuz?"],
    visualPrompt: "Teknisyeni iş başında, düzenli ekipmanı veya tamamlanan uygulamayı gösteren güven veren yatay fotoğraf",
  },
  emlak: {
    heroText: "Doğru fiyatlama, nitelikli sunum ve düzenli bilgilendirmeyle gayrimenkul sürecini güvenle yönetin.",
    about: "Portföyü yalnızca listelemek yerine konum, hedef kitle ve piyasa verileriyle konumlandırırız. Profesyonel sunumdan görüşme yönetimine kadar her aşamayı planlar, gelişmeleri düzenli olarak paylaşırız.",
    serviceDetails: ["Doğru konumlandırma ve nitelikli alıcı iletişimi.", "Kiracı profili, gösterim ve sözleşme süreci desteği.", "Bölge, emsal ve mülk özelliklerine dayalı analiz.", "Hedefe uygun portföy araştırması ve karar desteği."],
    faq: ["Mülkün değerini nasıl belirliyorsunuz?", "Profesyonel fotoğraf çekimi yapılıyor mu?", "Portföy süreci nasıl raporlanıyor?", "Yatırım danışmanlığı hangi bölgeleri kapsıyor?"],
    visualPrompt: "Öne çıkarılacak portföyü veya bölge yaşamını gösteren yüksek kaliteli geniş açı fotoğraf",
  },
  danismanlik: {
    heroText: "İhtiyacı netleştiren, uygulanabilir bir yol haritasına dönüştüren ve ilerlemeyi düzenli takip eden danışmanlık.",
    about: "İlk görüşmede mevcut durumu, hedefleri ve öncelikleri netleştiririz. Her öneriyi uygulanabilir adımlara böler; süreç boyunca ölçülebilir ilerleme ve açık iletişim sağlarız.",
    serviceDetails: ["İhtiyaç ve hedeflerin netleştirildiği keşif görüşmesi.", "Kişiye veya kuruma özel uygulanabilir yol haritası.", "Konumdan bağımsız, planlı ve güvenli görüşme.", "Düzenli kontrol noktalarıyla gelişim değerlendirmesi."],
    faq: ["İlk görüşmede neler konuşuluyor?", "Online görüşme yapıyor musunuz?", "Süreç ne kadar devam ediyor?", "Görüşmeler gizli tutuluyor mu?"],
    visualPrompt: "Uzmanın çalışma ortamını veya güven veren profesyonel portresini gösteren sade yatay fotoğraf",
  },
  organizasyon: {
    heroText: "Fikirden etkinlik gününe kadar yaratıcı tasarım, güvenilir tedarik ve tek merkezden koordinasyon.",
    about: "Mekânı, konuk sayısını ve istediğiniz atmosferi birlikte değerlendiririz. Tasarım önerisi, bütçe kalemleri, tedarik ve etkinlik günü koordinasyonunu tek bir plan üzerinden yürütürüz.",
    serviceDetails: ["Konsept, akış ve tedarikçilerin uçtan uca koordinasyonu.", "Kişisel detaylarla şekillenen samimi kutlama tasarımı.", "Marka hedeflerine uygun planlama ve sahne yönetimi.", "Mekâna özel renk, çiçek, masa ve karşılama kurgusu."],
    faq: ["Teklif hazırlamak için hangi bilgiler gerekli?", "Mekân bulma konusunda destek oluyor musunuz?", "Etkinlik günü ekip bulunuyor mu?", "Bütçe ve ödeme planı nasıl ilerliyor?"],
    visualPrompt: "Tamamlanmış etkinlik düzenini, masa detayını veya atmosferi gösteren etkileyici geniş fotoğraf",
  },
  default: {
    heroText: "İhtiyacınızı dinleyen, süreci açıkça anlatan ve sonucu özenle teslim eden profesyonel hizmet.",
    about: "Her çalışmaya ihtiyacı doğru anlayarak başlar, kapsamı ve süreci açık biçimde paylaşırız. Planlı iletişim, özenli uygulama ve ulaşılabilir destek çalışma biçimimizin temelidir.",
    serviceDetails: ["İhtiyaca göre netleştirilen profesyonel kapsam.", "Açık planlama ve düzenli bilgilendirme.", "Uygun çözüm ve özenli uygulama.", "İşlem sonrası ulaşılabilir destek."],
    faq: ["Nasıl bilgi alabilirim?", "Hizmet kapsamı nasıl belirleniyor?", "Fiyat teklifi nasıl hazırlanıyor?", "Hangi bölgelere hizmet veriyorsunuz?"],
    visualPrompt: "İşletmeyi, ekibi veya verilen hizmeti gerçek ortamında gösteren kaliteli yatay fotoğraf",
  },
};

const sectorFaqAnswers: Record<string, string[]> = {
  kuafor: ["Evet. Saç yapını, geçmiş işlemleri ve istediğin görünümü değerlendirerek uygulama planını birlikte belirliyoruz.", "Süre saçın uzunluğuna ve seçilen tekniğe göre değişir; randevu öncesinde yaklaşık süreyi netleştiriyoruz.", "Kalıcı ve dengeli bir sonuç için prova öneriyoruz; aksesuar ve duvak detaylarını da birlikte planlıyoruz.", "Evet. İşlem sonrası saçının ihtiyacına uygun ev bakım rutinini ve ürün kullanımını açıklıyoruz."],
  berber: ["Müsaitlik varsa yardımcı oluyoruz; beklememek için WhatsApp veya telefon üzerinden randevu öneriyoruz.", "Saç ve sakal uygulaması seçilen modele göre ortalama 45–75 dakika sürer.", "Kesim, sakal tasarımı, bakım ve son dokunuşları tek randevuda planlıyoruz.", "Yaş ve saç yapısına uygun teknikle çocuk kesimi için de randevu oluşturabiliyoruz."],
  guzellik: ["Evet. Uygulama öncesinde cilt veya tırnak yapısını değerlendirerek uygun yöntemi belirliyoruz.", "Kullanılacak ürünleri uygulama öncesinde açıklıyor; hassasiyet bilgilerini mutlaka soruyoruz.", "Randevu değişikliği için mümkün olduğunca erken haber vermenizi rica ediyoruz; kesin koşulları rezervasyon sırasında paylaşıyoruz.", "Evet. Sonucun korunması için yapılması ve kaçınılması gerekenleri uygulama sonunda anlatıyoruz."],
  "hali-yikama": ["Servis bölgeleri yoğunluğa göre değişebilir; adresinizi gönderdiğinizde teslim alma gününü hemen kontrol ediyoruz.", "Ürün türü ve hava koşullarına göre teslim süresi değişir; teslim alırken tahmini tarihi kayıt altına alıyoruz.", "Özel lekeleri teslim sırasında işaretliyor, çıkma ihtimali konusunda işlem öncesinde açık bilgi veriyoruz.", "Havalandırma koşullarına bağlı olarak genellikle birkaç saat içinde kurur; uygulama sonrası net yönlendirme yapıyoruz."],
  "oto-yikama": ["Standart yıkamada müsaitliğe göre kabul yapıyoruz; detailing ve koruma uygulamalarında randevu gerekiyor.", "Aracın büyüklüğü ve iç durumuna göre süre değişir; ön kontrolden sonra teslim saatini bildiriyoruz.", "Evet. Boya yüzeyini kontrol ederek gerekli hazırlık ve uygun koruma paketini belirliyoruz.", "Her yüzey için uygun ürün ve ekipman kullanıyor, işlem öncesinde hassas bölgeleri ayrıca kontrol ediyoruz."],
  "teknik-servis": ["Ücret; konum, arıza türü ve gerekli işleme göre belirlenir. İşleme başlamadan önce kapsamı açıklıyoruz.", "Ekip ve bölge müsaitliğine göre aynı gün yönlendirme yapabiliyoruz; acil durum bilgisini ilk görüşmede belirtin.", "Kontrol sonrasında işçilik ve gerekiyorsa parça kapsamını onayınıza sunuyoruz.", "Yapılan işin niteliğine göre garanti kapsamını ve süresini teslim sırasında yazılı veya açık biçimde paylaşıyoruz."],
  emlak: ["Bölgedeki emsaller, mülkün fiziksel özellikleri ve güncel talep birlikte değerlendirilir.", "Portföy planına göre profesyonel fotoğraf ve sunum desteğini teklif kapsamına ekliyoruz.", "Görüşme, gösterim ve geri bildirimleri düzenli özetlerle mülk sahibine iletiyoruz.", "Hizmet verdiğimiz bölgeleri ve yatırım hedefinizi ilk görüşmede eşleştirerek uygun çalışma alanını netleştiriyoruz."],
  danismanlik: ["Mevcut durumunu, hedeflerini ve önceliklerini konuşur; birlikte çalışmanın sana uygun olup olmadığını netleştiririz.", "Evet. Güvenli çevrim içi görüşme araçlarıyla planlı seanslar gerçekleştiriyoruz.", "Süre hedefe ve ihtiyaç kapsamına göre değişir; ilk görüşmeden sonra önerilen yol haritasını paylaşıyoruz.", "Evet. Görüşme notları ve paylaşılan bilgiler gizlilik ilkeleri doğrultusunda korunur."],
  organizasyon: ["Tarih, şehir, mekân, konuk sayısı, etkinlik türü ve yaklaşık bütçe ilk teklif için yeterlidir.", "İhtiyaç hâlinde konsepte, kapasiteye ve bütçeye uygun mekân alternatifleri sunuyoruz.", "Evet. Kurulumdan program akışına kadar sorumlu ekip etkinlik boyunca koordinasyonu yürütür.", "Onaylanan kapsam kalemlere ayrılır; rezervasyon ve ara ödeme tarihleri sözleşmeyle netleştirilir."],
  default: ["İlk görüşmede ihtiyacınızı dinleyerek uygun hizmet ve sonraki adımları netleştiriyoruz.", "Hizmet kapsamını hedefinize, süreye ve uygulama ihtiyacına göre birlikte belirliyoruz.", "Talebinizi değerlendirdikten sonra kapsamı ve varsa seçenekleri açık bir teklifle paylaşıyoruz.", "Konumunuzu ilettiğinizde hizmet bölgesi ve uygun zamanı hızlıca kontrol ediyoruz."],
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
  const businessDetails = prompt.match(/İşletmenin öne çıkan yönleri:\s*([^.!?\n]{3,360})/i)?.[1]?.trim();
  const aboutDetails = prompt.match(/İşletme hikayesi:\s*([^\n]{3,600}?)(?=\.\s+(?:Çalışma süreci|Sık sorulanlar|Müşteri yorumları|Fiyat yaklaşımı|Sitenin ana hedefi):|$)/i)?.[1]?.trim();
  const processDetails = prompt.match(/Çalışma süreci:\s*([^\n]{3,500}?)(?=\.\s+(?:Sık sorulanlar|Müşteri yorumları|Fiyat yaklaşımı|Sitenin ana hedefi):|$)/i)?.[1]?.trim();
  const faqDetails = prompt.match(/Sık sorulanlar:\s*([^\n]{3,600}?)(?=\.\s+(?:Müşteri yorumları|Fiyat yaklaşımı|Sitenin ana hedefi):|$)/i)?.[1]?.trim();
  const testimonialDetails = prompt.match(/Müşteri yorumları:\s*([^\n]{3,800}?)(?=\.\s+(?:Fiyat yaklaşımı|Sitenin ana hedefi):|$)/i)?.[1]?.trim();
  const pricingDetails = prompt.match(/Fiyat yaklaşımı:\s*([^\n]{3,500}?)(?=\.\s+Sitenin ana hedefi:|$)/i)?.[1]?.trim();
  const phone = prompt.match(/Telefon:\s*(\+?\d[\d\s()-]{8,}\d)/i)?.[1]?.trim() || "";
  const whatsapp = prompt.match(/WhatsApp:\s*(\+?\d[\d\s()-]{8,}\d)/i)?.[1]?.trim() || phone;
  const wantsPricing = pricingDetails
    ? !/göstermeyelim|teklif istensin|daha sonra/i.test(pricingDetails.toLocaleLowerCase("tr-TR"))
    : /fiyat|paket|ücret/.test(normalized);
  const wantsGallery = /galeri|fotoğraf|görsel|öncesi|sonrası/.test(normalized);
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
  const contentKit = sectorContentKits[catalogSector?.id || "default"] || sectorContentKits.default;
  const heroAction = goal
    ? `${goal.toLocaleLowerCase("tr-TR")} için hizmetleri inceleyin ve hemen iletişime geçin.`
    : "Hızlıca bilgi alın, çalışma detaylarını görün ve bize ulaşın.";
  const shouldUseSectorDefault = (value?: string) => !value || /sektör(?:üme|e) uygun|hazırla|sonra düzenle/i.test(value);
  const splitContentItems = (value?: string, limit = 4) => (value || "")
    .split(/;|\n|\s+→\s+|\s+->\s+/)
    .map((item) => item.trim().replace(/[.!]+$/, ""))
    .filter((item) => item.length > 2)
    .slice(0, limit);
  const customProcess = shouldUseSectorDefault(processDetails) ? [] : splitContentItems(processDetails);
  const customFaq = shouldUseSectorDefault(faqDetails) ? [] : splitContentItems(faqDetails).map((item) => item.endsWith("?") ? item : `${item}?`);
  const customTestimonials = /daha sonra|henüz|hazır bırak/i.test(testimonialDetails || "") ? [] : splitContentItems(testimonialDetails, 3);

  const sections: StudioSection[] = [
    {
      id: "hero",
      type: "hero",
      title: tagline,
      text: `${contentKit.heroText} ${heroAction}`,
      eyebrow: `${location} · ${sectorLabel}`,
      ctaLabel: goal ? "Hemen başlayalım" : "Bilgi ve randevu al",
    },
    {
      id: "features",
      type: "features",
      title: "Neden bizi tercih ediyorlar?",
      text: businessDetails || "İyi bir hizmeti yalnızca sonuçla değil, başından sonuna kadar güven veren bir deneyimle sunuyoruz.",
      items: ["İhtiyaca özel planlama", "Açık bilgilendirme", "Özenli uygulama", "Ulaşılabilir destek"],
      details: ["Talebi dinler, doğru kapsamı birlikte belirleriz.", "Süreç, süre ve seçenekleri başlamadan önce açıklarız.", "Her aşamada kalite kontrolü ve ayrıntılı çalışma uygularız.", "İşlem öncesi ve sonrasında sorularınıza hızlıca döneriz."],
      eyebrow: "Güven veren ayrıntılar",
    },
    {
      id: "services",
      type: "services",
      title: "Size nasıl yardımcı olabiliriz?",
      text: "Her hizmetin kapsamını, süresini ve size uygun seçeneği görüşme sırasında netleştiriyoruz.",
      items: learnedServices?.length ? learnedServices : [...sector.services],
      details: learnedServices?.length
        ? learnedServices.map((service) => `${service} için ihtiyacınıza göre kapsam, süre ve uygulama planı oluşturulur.`)
        : [...contentKit.serviceDetails],
      eyebrow: "Uzmanlık alanlarımız",
    },
    {
      id: "about",
      type: "about",
      title: `${businessName} hakkında`,
      text: shouldUseSectorDefault(aboutDetails) ? contentKit.about : aboutDetails!,
      eyebrow: "Yaklaşımımız",
    },
    {
      id: "process",
      type: "process",
      title: "Nasıl çalışıyoruz?",
      text: customProcess.length ? "Süreci baştan sona açık, planlı ve takip edilebilir adımlarla ilerletiyoruz." : "İlk iletişimden hizmetin tamamlanmasına kadar ne olacağını bilmeniz için süreci dört net adımda ilerletiyoruz.",
      items: customProcess.length ? customProcess : ["İhtiyacınızı dinliyoruz", "Planı netleştiriyoruz", "Özenle uyguluyoruz", "Sonucu birlikte kontrol ediyoruz"],
      details: customProcess.length ? customProcess.map((item) => `${item} aşamasında gerekli bilgileri paylaşır ve bir sonraki adımı netleştiririz.`) : ["Beklentinizi, konumunuzu ve önceliğinizi öğreniyoruz.", "Uygun hizmeti, kapsamı ve zamanlamayı açıkça paylaşıyoruz.", "Belirlenen plana uygun, kontrollü ve düzenli çalışıyoruz.", "Tamamlanan işi değerlendiriyor ve gereken desteği sürdürüyoruz."],
      eyebrow: "Dört adımda net süreç",
    },
    ...(wantsPricing
      ? [
          {
            id: "pricing",
            type: "pricing" as const,
            title: "Hizmet paketleri",
            text: pricingDetails || "Net kapsam, anlaşılır süreç ve ihtiyacınıza göre şekillenen seçenekler.",
            items: splitContentItems(pricingDetails, 3).length ? splitContentItems(pricingDetails, 3) : ["Başlangıç seçeneği", "Kapsamlı uygulama", "Kişisel çözüm"],
          },
        ]
      : []),
    ...(wantsGallery || wantsMulti
      ? [
          {
            id: "gallery",
            type: "gallery" as const,
            title: "Çalışmalarımız",
            text: "İşletmemizden seçili çalışmalar ve sonuçlar.",
          },
        ]
      : []),
    ...(wantsTestimonials || wantsMulti
      ? [
          {
            id: "testimonials",
            type: "testimonials" as const,
            title: "Müşteri deneyimleri",
            text: "Gerçek müşterilerinizden izinli yorumları yayınlamadan önce buradan düzenleyin.",
            items: customTestimonials.length ? customTestimonials : ["Onaylı müşteri yorumunuzu buraya ekleyin", "İkinci onaylı müşteri yorumunu buraya ekleyin", "Üçüncü onaylı müşteri yorumunu buraya ekleyin"],
          },
        ]
      : []),
    {
      id: "faq",
      type: "faq",
      title: "Merak edilenler",
      text: "Karar vermeden önce en sık sorulan konulara açık ve kısa yanıtlar.",
      items: customFaq.length ? customFaq : contentKit.faq,
      answers: customFaq.length ? customFaq.map(() => "Bu sorunun yanıtı hizmetin kapsamına ve ihtiyacınıza göre netleştirilir; ayrıntılı bilgi için bizimle iletişime geçebilirsiniz.") : sectorFaqAnswers[catalogSector?.id || "default"] || sectorFaqAnswers.default,
      eyebrow: "Sık sorulan sorular",
    },
    {
      id: "contact",
      type: "contact",
      title: "Hemen iletişime geçin",
      text: "İhtiyacınızı kısaca anlatın. Uygun hizmet, süreç ve müsaitlik bilgisiyle size dönüş yapalım.",
      eyebrow: "Birlikte planlayalım",
      ctaLabel: "Mesajı gönder",
    },
  ];

  return {
    contentVersion: 2,
    businessName,
    sector: sectorLabel,
    location,
    tagline,
    phone,
    whatsapp,
    pageMode: wantsMulti ? "multi" : "single",
    theme,
    design,
    media: { services: [], gallery: [] },
    sections,
  };
}

export function getStudioVisualPrompt(site: StudioSite) {
  const sectorValue = site.sector.toLocaleLowerCase("tr-TR");
  const sector = sectorCatalog.find((item) => item.keywords.some((keyword) => sectorValue.includes(keyword.toLocaleLowerCase("tr-TR"))));
  return (sectorContentKits[sector?.id || "default"] || sectorContentKits.default).visualPrompt;
}

function ensureMultiPageSections(site: StudioSite) {
  const insertBeforeContact = (section: StudioSection) => {
    if (site.sections.some((item) => item.type === section.type)) return;
    const contactIndex = site.sections.findIndex((item) => item.type === "contact");
    site.sections.splice(contactIndex >= 0 ? contactIndex : site.sections.length, 0, section);
  };
  insertBeforeContact({ id: "gallery", type: "gallery", title: "Çalışmalarımız", text: "Gerçek çalışma, mekân ve ekip fotoğraflarınızı bu alanda sergileyin.", eyebrow: "İşimizden kareler" });
  insertBeforeContact({ id: "testimonials", type: "testimonials", title: "Müşterilerimiz anlatıyor", text: "Yayınlama izni alınmış gerçek müşteri deneyimlerini ekleyin.", items: ["İlk müşteri yorumunu buraya ekleyin.", "İkinci müşteri yorumunu buraya ekleyin.", "Üçüncü müşteri yorumunu buraya ekleyin."] });
}

export function upgradeStudioSite(site: StudioSite): StudioSite {
  const next: StudioSite = JSON.parse(JSON.stringify(site));
  const needsContentUpgrade = (next.contentVersion || 1) < 2;
  const sectorValue = next.sector.toLocaleLowerCase("tr-TR");
  const sector = sectorCatalog.find((item) => item.keywords.some((keyword) => sectorValue.includes(keyword.toLocaleLowerCase("tr-TR"))));
  const sectorId = sector?.id || "default";
  const kit = sectorContentKits[sectorId] || sectorContentKits.default;
  next.design = { ...(next.design || sectorDesigns[sectorId] || sectorDesigns.default) };
  next.media = { services: [], gallery: [], ...(next.media || {}) };

  next.sections = next.sections.map((section) => {
    const upgraded = { ...section };
    if (section.type === "hero") {
      upgraded.eyebrow ||= `${next.location} · ${next.sector}`;
      upgraded.ctaLabel ||= "Bilgi ve randevu al";
      if (/hizmetleri\.|hızlıca bilgi alın|için hizmetleri inceleyin/i.test(section.text)) upgraded.text = kit.heroText;
    }
    if (section.type === "services") {
      upgraded.eyebrow ||= "Uzmanlık alanlarımız";
      if (/uygun hizmeti seçin|ayrıntıları birlikte netleştirelim/i.test(section.text)) upgraded.text = "Her hizmetin kapsamını, süresini ve size uygun seçeneği görüşme sırasında netleştiriyoruz.";
      if (!upgraded.details?.length) upgraded.details = (upgraded.items || []).map((item, index) => kit.serviceDetails[index] || `${item} için ihtiyacınıza göre kapsam, süre ve uygulama planı oluşturulur.`);
    }
    if (section.type === "about") {
      upgraded.eyebrow ||= "Yaklaşımımız";
      if (/işini özenle yapan|müşterisine açık bilgi veren/i.test(section.text)) upgraded.text = kit.about;
    }
    if (section.type === "faq") {
      upgraded.eyebrow ||= "Sık sorulan sorular";
      if (!upgraded.answers?.length) upgraded.answers = (upgraded.items || []).map((_, index) => (sectorFaqAnswers[sectorId] || sectorFaqAnswers.default)[index] || sectorFaqAnswers.default[index] || "Ayrıntılı bilgi için bizimle iletişime geçebilirsiniz.");
    }
    if (section.type === "contact") {
      upgraded.eyebrow ||= "Birlikte planlayalım";
      upgraded.ctaLabel ||= "Mesajı gönder";
      if (/sorunuzu yazın/i.test(section.text)) upgraded.text = "İhtiyacınızı kısaca anlatın. Uygun hizmet, süreç ve müsaitlik bilgisiyle size dönüş yapalım.";
    }
    return upgraded;
  });

  if (needsContentUpgrade) {
    const insertAfter = (targetType: StudioSection["type"], section: StudioSection) => {
      if (next.sections.some((item) => item.type === section.type)) return;
      const targetIndex = next.sections.findIndex((item) => item.type === targetType);
      next.sections.splice(targetIndex >= 0 ? targetIndex + 1 : Math.max(next.sections.length - 1, 0), 0, section);
    };
    const insertBeforeContact = (section: StudioSection) => {
      if (next.sections.some((item) => item.type === section.type)) return;
      const contactIndex = next.sections.findIndex((item) => item.type === "contact");
      next.sections.splice(contactIndex >= 0 ? contactIndex : next.sections.length, 0, section);
    };

    insertAfter("hero", {
      id: "features",
      type: "features",
      title: "Neden bizi tercih ediyorlar?",
      text: "İyi bir hizmeti yalnızca sonuçla değil, başından sonuna kadar güven veren bir deneyimle sunuyoruz.",
      items: ["İhtiyaca özel planlama", "Açık bilgilendirme", "Özenli uygulama", "Ulaşılabilir destek"],
      details: ["Talebi dinler, doğru kapsamı birlikte belirleriz.", "Süreç, süre ve seçenekleri başlamadan önce açıklarız.", "Her aşamada kalite kontrolü ve ayrıntılı çalışma uygularız.", "İşlem öncesi ve sonrasında sorularınıza hızlıca döneriz."],
      eyebrow: "Güven veren ayrıntılar",
    });
    insertAfter("services", {
      id: "process",
      type: "process",
      title: "Nasıl çalışıyoruz?",
      text: "İlk iletişimden hizmetin tamamlanmasına kadar ne olacağını bilmeniz için süreci dört net adımda ilerletiyoruz.",
      items: ["İhtiyacınızı dinliyoruz", "Planı netleştiriyoruz", "Özenle uyguluyoruz", "Sonucu birlikte kontrol ediyoruz"],
      details: ["Beklentinizi, konumunuzu ve önceliğinizi öğreniyoruz.", "Uygun hizmeti, kapsamı ve zamanlamayı açıkça paylaşıyoruz.", "Belirlenen plana uygun, kontrollü ve düzenli çalışıyoruz.", "Tamamlanan işi değerlendiriyor ve gereken desteği sürdürüyoruz."],
      eyebrow: "Dört adımda net süreç",
    });
    if (next.pageMode === "multi") {
      insertBeforeContact({ id: "gallery", type: "gallery", title: "Çalışmalarımız", text: "Gerçek çalışma, mekân ve ekip fotoğraflarınızı bu alanda sergileyin.", eyebrow: "İşimizden kareler" });
      insertBeforeContact({ id: "testimonials", type: "testimonials", title: "Müşterilerimiz anlatıyor", text: "Yayınlama izni alınmış gerçek müşteri deneyimlerini ekleyin.", items: ["İlk müşteri yorumunu buraya ekleyin.", "İkinci müşteri yorumunu buraya ekleyin.", "Üçüncü müşteri yorumunu buraya ekleyin."] });
    }
    next.contentVersion = 2;
  }
  return next;
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
    if (services) {
      services.items = serviceList;
      services.details = serviceList.map((service) => `${service} için kapsam, süre ve uygulama ayrıntıları görüşme sırasında netleştirilir.`);
    }
  }
  const serviceToAdd = instruction.match(/hizmet(?:lere|lerime|lerimize)?\s+([^.!?\n]{2,70}?)\s+ekle/i)?.[1]?.trim();
  if (serviceToAdd) {
    const services = next.sections.find((section) => section.type === "services");
    if (services) {
      services.items = [...new Set([...(services.items || []), titleCase(serviceToAdd)])].slice(0, 10);
      services.details = (services.items || []).map((service, index) => services.details?.[index] || `${service} için kişisel kapsam ve uygulama planı.`);
    }
  }
  const serviceToRemove = instruction.match(/hizmet(?:lerden|lerimden|lerimizden)?\s+([^.!?\n]{2,70}?)\s+(?:kaldır|sil|çıkar)/i)?.[1]?.trim();
  if (serviceToRemove) {
    const services = next.sections.find((section) => section.type === "services");
    if (services?.items) {
      const removeIndex = services.items.findIndex((item) => item.toLocaleLowerCase("tr-TR") === serviceToRemove.toLocaleLowerCase("tr-TR"));
      services.items = services.items.filter((_, index) => index !== removeIndex);
      if (services.details && removeIndex >= 0) services.details = services.details.filter((_, index) => index !== removeIndex);
    }
  }

  const sectionTypeFromName = (value: string): StudioSection["type"] | null => {
    const name = value.toLocaleLowerCase("tr-TR");
    if (/giriş|hero|ana ekran/.test(name)) return "hero";
    if (/neden biz|avantaj|öne çıkan|farkımız/.test(name)) return "features";
    if (/hizmet/.test(name)) return "services";
    if (/hakkımızda|biz kimiz/.test(name)) return "about";
    if (/süreç|nasıl çalış/.test(name)) return "process";
    if (/fiyat|paket|ücret/.test(name)) return "pricing";
    if (/galeri|çalışma|fotoğraf/.test(name)) return "gallery";
    if (/yorum|referans/.test(name)) return "testimonials";
    if (/sss|sıkça|soru/.test(name)) return "faq";
    if (/iletişim|mesaj|randevu/.test(name)) return "contact";
    return null;
  };
  const sectionNamePattern = "(giriş|hero|ana ekran|neden biz|avantajlar|öne çıkanlar|hizmetler|hakkımızda|biz kimiz|süreç|nasıl çalışıyoruz|fiyatlar|paketler|galeri|çalışmalar|yorumlar|referanslar|sss|sıkça sorulan sorular|iletişim|İletişim)";
  const titleCommand = instruction.match(new RegExp(`${sectionNamePattern}\\s+(?:bölümünün\\s+)?başlığ(?:ını|ı)\\s*[:,-]?\\s*[“\"']?([^.!?\\n”\"']{3,140}?)[”\"']?(?:\\s+olsun|\\s+yap|$)`, "i"));
  if (titleCommand) {
    const type = sectionTypeFromName(titleCommand[1]);
    const section = next.sections.find((item) => item.type === type);
    if (section) section.title = titleCommand[2].trim();
  }
  const textCommand = instruction.match(new RegExp(`${sectionNamePattern}\\s+(?:bölümünün\\s+)?(?:metn(?:ini|i)|açıklamas(?:ını|ı))\\s*[:,-]?\\s*[“\"']?([^\\n”\"']{8,420}?)[”\"']?(?:\\s+olsun|\\s+yap|$)`, "i"));
  if (textCommand) {
    const type = sectionTypeFromName(textCommand[1]);
    const section = next.sections.find((item) => item.type === type);
    if (section) section.text = textCommand[2].trim();
  }
  const buttonCommand = instruction.match(new RegExp(`${sectionNamePattern}\\s+(?:bölümünün\\s+)?buton(?:unu|u| yazısı| metni)\\s*[:,-]?\\s*[“\"']?([^.!?\\n”\"']{2,60}?)[”\"']?(?:\\s+olsun|\\s+yap|$)`, "i"));
  if (buttonCommand) {
    const type = sectionTypeFromName(buttonCommand[1]);
    const section = next.sections.find((item) => item.type === type);
    if (section) section.ctaLabel = buttonCommand[2].trim();
  }
  const faqList = instruction.match(/(?:sss|sorular)\s*[:,-]\s*([^\n]{8,600})/i)?.[1]
    ?.split(/;|\|/)
    .map((item) => item.trim())
    .filter((item) => item.length > 4)
    .slice(0, 8);
  if (faqList?.length) {
    const faq = next.sections.find((section) => section.type === "faq");
    if (faq) faq.items = faqList;
  }
  const numberedService = instruction.match(/(\d{1,2})\.?\s*hizmet(?:in)?\s+(?:ad(?:ını|ı)|başlığ(?:ını|ı))\s*[:,-]?\s*([^.!?\n]{2,90}?)(?:\s+olsun|\s+yap|$)/i);
  if (numberedService) {
    const index = Number(numberedService[1]) - 1;
    const services = next.sections.find((section) => section.type === "services");
    if (services?.items?.[index] !== undefined) services.items[index] = numberedService[2].trim();
  }
  const numberedServiceDetail = instruction.match(/(\d{1,2})\.?\s*hizmet(?:in)?\s+(?:açıklamas(?:ını|ı)|metn(?:ini|i))\s*[:,-]?\s*([^\n]{5,260}?)(?:\s+olsun|\s+yap|$)/i);
  if (numberedServiceDetail) {
    const index = Number(numberedServiceDetail[1]) - 1;
    const services = next.sections.find((section) => section.type === "services");
    if (services?.items?.[index] !== undefined) {
      services.details = services.items.map((item, itemIndex) => services.details?.[itemIndex] || `${item} için kişisel kapsam ve uygulama planı.`);
      services.details[index] = numberedServiceDetail[2].trim();
    }
  }
  const numberedFaq = instruction.match(/(\d{1,2})\.?\s*(?:sss|soru)(?:nun|nın)?\s*(?:metn(?:ini|i))?\s*[:,-]?\s*([^\n]{5,220}?)(?:\s+olsun|\s+yap|$)/i);
  if (numberedFaq && !/cevab/i.test(numberedFaq[0])) {
    const index = Number(numberedFaq[1]) - 1;
    const faq = next.sections.find((section) => section.type === "faq");
    if (faq?.items?.[index] !== undefined) faq.items[index] = numberedFaq[2].trim();
  }
  const numberedFaqAnswer = instruction.match(/(\d{1,2})\.?\s*(?:sss|soru)(?:nun|nın)?\s+cevab(?:ını|ı)\s*[:,-]?\s*([^\n]{5,360}?)(?:\s+olsun|\s+yap|$)/i);
  if (numberedFaqAnswer) {
    const index = Number(numberedFaqAnswer[1]) - 1;
    const faq = next.sections.find((section) => section.type === "faq");
    if (faq?.items?.[index] !== undefined) {
      faq.answers = faq.items.map((_, itemIndex) => faq.answers?.[itemIndex] || "Ayrıntılı bilgi için bizimle iletişime geçebilirsiniz.");
      faq.answers[index] = numberedFaqAnswer[2].trim();
    }
  }
  const reorderCommand = normalized.match(/(giriş|hero|neden biz|avantajlar|hizmetler|hakkımızda|süreç|fiyatlar|paketler|galeri|yorumlar|sss|iletişim)\s+bölümünü\s+(giriş|hero|neden biz|avantajlar|hizmetler|hakkımızda|süreç|fiyatlar|paketler|galeri|yorumlar|sss|iletişim)(?:\s+bölümünün)?\s+(altına|üstüne)/i);
  if (reorderCommand) {
    const movingType = sectionTypeFromName(reorderCommand[1]);
    const targetType = sectionTypeFromName(reorderCommand[2]);
    const movingIndex = next.sections.findIndex((section) => section.type === movingType);
    const targetIndex = next.sections.findIndex((section) => section.type === targetType);
    if (movingIndex >= 0 && targetIndex >= 0 && movingIndex !== targetIndex) {
      const [moving] = next.sections.splice(movingIndex, 1);
      const freshTarget = next.sections.findIndex((section) => section.type === targetType);
      next.sections.splice(reorderCommand[3] === "altına" ? freshTarget + 1 : freshTarget, 0, moving);
    }
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
  const accentHex = instruction.match(/(?:ana renk|vurgu rengi|buton rengi)\s*[:,-]?\s*(#[0-9a-f]{6})/i)?.[1];
  if (accentHex) next.theme.accent = accentHex;
  const backgroundHex = instruction.match(/(?:arka plan|zemin)\s*(?:rengi)?\s*[:,-]?\s*(#[0-9a-f]{6})/i)?.[1];
  if (backgroundHex) next.theme.background = backgroundHex;

  if (/çok sayfa|çok sayfalı/.test(normalized)) {
    next.pageMode = "multi";
    ensureMultiPageSections(next);
  }
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
  if (/neden biz|avantaj|öne çıkan/.test(normalized) && !/kaldır|sil|çıkar/.test(normalized)) {
    addSection({
      id: "features",
      type: "features",
      title: "Neden bizi tercih ediyorlar?",
      text: "İhtiyaca uygun planlama, açık iletişim ve özenli uygulama.",
      items: ["Doğru planlama", "Açık iletişim", "Özenli uygulama", "Ulaşılabilir destek"],
      details: ["Talebi doğru anlarız.", "Süreci net açıklarız.", "Kaliteyi her aşamada koruruz.", "Sorularınıza hızlıca döneriz."],
    });
  }
  if (/süreç|nasıl çalış/.test(normalized) && !/kaldır|sil|çıkar/.test(normalized)) {
    addSection({
      id: "process",
      type: "process",
      title: "Nasıl çalışıyoruz?",
      text: "Talebinizden teslimata kadar süreci net adımlarla yönetiyoruz.",
      items: ["İhtiyacı dinliyoruz", "Planlıyoruz", "Uyguluyoruz", "Kontrol ediyoruz"],
      details: ["Beklentinizi öğreniyoruz.", "Kapsam ve zamanı netleştiriyoruz.", "Planı özenle uyguluyoruz.", "Sonucu birlikte değerlendiriyoruz."],
    });
  }

  const removableSections: Array<[RegExp, StudioSection["type"]]> = [
    [/neden biz|avantaj|öne çıkan/, "features"],
    [/fiyat|ücret|paket/, "pricing"],
    [/galeri|fotoğraf/, "gallery"],
    [/yorum|referans/, "testimonials"],
    [/sss|sıkça|soru/, "faq"],
    [/hakkımızda/, "about"],
    [/süreç|nasıl çalış/, "process"],
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

  if (JSON.stringify(before.media || {}) !== JSON.stringify(after.media || {})) changes.push("site görselleri");

  const beforeTypes = before.sections.map((section) => section.type);
  const afterTypes = after.sections.map((section) => section.type);
  if (beforeTypes.join("|") !== afterTypes.join("|")) changes.push("site bölümleri");

  const beforeServices = before.sections.find((section) => section.type === "services")?.items || [];
  const afterServices = after.sections.find((section) => section.type === "services")?.items || [];
  if (beforeServices.join("|") !== afterServices.join("|")) changes.push("hizmetler");
  if (JSON.stringify(before.sections) !== JSON.stringify(after.sections) && !changes.includes("site bölümleri") && !changes.includes("hizmetler") && !changes.includes("ana başlık") && !changes.includes("giriş açıklaması")) changes.push("bölüm içerikleri");

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
    return ["Hizmetleri girişin hemen altına al", "1. hizmet açıklamasını İhtiyacınıza göre planlanan profesyonel uygulama yap", "Galeri bölümü ekle", "Siteyi çok sayfalı yap"];
  }
  if (/metin|içerik|açıklama|buton/.test(value)) {
    return ["Hakkımızda başlığını Biz Kimiz yap", "İletişim butonunu Randevu Al yap", "Hizmetler açıklamasını daha güven veren yap", "SSS: Nasıl randevu alırım?; Fiyatı nasıl öğrenirim?; Hangi bölgelere hizmet veriyorsunuz?"];
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
  return [sectorSuggestion, "Başlığı daha kısa yap", "Hakkımızda başlığını Bizi Yakından Tanıyın yap", "Hizmetleri yukarı al"];
}
