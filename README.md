# SiteMix Studio

SiteMix Studio, işletmelerin konuşarak mobil uyumlu web sitesi oluşturduğu; ön izleme, içerik yönetimi, yayınlama, domain, abonelik ve hizmet taleplerinin tek sistemde yönetildiği Next.js uygulamasıdır. Mevcut `/on-muhasebe` ürünü aynı proje içinde korunur.

## Ana alanlar

- `/` — SiteMix ana sayfası ve ilk mesajda Google giriş akışı
- `/studio` — Konuşmalı site oluşturucu, canlı ön izleme, içerik ve domain paneli
- `/site/[slug]` — Müşteri sitesi ön izleme/yayın adresi
- `/admin/giris` — Güvenli yönetici girişi
- `/admin/studio` — SiteMix yönetim merkezi
- `/admin` — Korunan ön muhasebe yönetimi
- `/on-muhasebe` — Mevcut ön muhasebe ürünü

## Kurulum

1. `.env.example` içindeki değişkenleri yerel `.env.local` ve Vercel proje ayarlarında tanımlayın.
2. Yeni kurulumda Supabase SQL editöründe `supabase/sitemix_studio_setup.sql` dosyasını bir kez çalıştırın. GitHub/Vercel aktarımı için ayrıca bir SQL yükseltmesi gerekmez; dağıtım bilgisi proje verisinde tutulur.
3. Supabase Authentication içinde Google sağlayıcısını etkinleştirin.
4. Supabase Site URL ve Redirect URL listesine yerel adresi, `https://www.sitemix.com.tr/studio` ve `https://www.sitemix.com.tr/admin/giris` adreslerini ekleyin.
5. Her müşteri sitesi için ayrı depo oluştururken sistem önce SiteMix AI'daki mevcut `GITHUB_TOKEN` ve `GITHUB_OWNER` değişkenlerini kullanır; istenirse bunlar `GITHUB_STUDIO_TOKEN` ve `GITHUB_STUDIO_OWNER` ile ayrı tutulabilir. Vercel projesinin de otomatik oluşturulması için `VERCEL_TOKEN` ve gerekiyorsa `VERCEL_TEAM_ID` tanımlanmalıdır. Vercel anahtarı yoksa GitHub deposu ve yayın paketi yine hazırlanır, admin panelinde Vercel bağlantısı bekliyor olarak gösterilir.

## Yayın düzeni

Kullanıcı yayın/ödeme seçeneğine geçtiğinde siteye özel, özel bir GitHub deposu ve ona bağlı ayrı bir Vercel projesi hazırlanır. Bu aktarım için ayrı bir dağıtım tablosu kullanılmaz; güncel GitHub/Vercel bilgisi projenin kendi JSON verisinde saklanır ve admin panelinde gösterilir. Aylık ödeme onaylanan kullanıcıların Studio değişiklikleri bu site deposuna aktarılır. Tek seferlik kurulum ve SiteMix yönetimi seçeneklerinde müşteri düzenleme paneli kilitli kalır. Admin panelinden domain bağlandığında `robots.txt`, `sitemap.xml` ve canonical adresleri site deposunda otomatik güncellenir.

## Komutlar

```bash
npm run dev
npm run build
npm run lint
```
