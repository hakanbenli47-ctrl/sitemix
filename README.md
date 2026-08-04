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
2. Yeni kurulumda Supabase SQL editöründe `supabase/sitemix_studio_setup.sql` dosyasını bir kez çalıştırın. Mevcut Studio kurulumu için yalnızca `supabase/studio_provisioning_upgrade.sql` yükseltmesini çalıştırın.
3. Supabase Authentication içinde Google sağlayıcısını etkinleştirin.
4. Supabase Site URL ve Redirect URL listesine yerel adresi, `https://www.sitemix.com.tr/studio` ve `https://www.sitemix.com.tr/admin/giris` adreslerini ekleyin.
5. Her müşteri sitesi için ayrı depo ve Vercel projesi oluşturmak üzere `GITHUB_STUDIO_TOKEN`, `GITHUB_STUDIO_OWNER`, `VERCEL_TOKEN` ve gerekiyorsa `VERCEL_TEAM_ID` değişkenlerini tanımlayın. GitHub anahtarının özel depo oluşturma ve içerik yazma yetkisi; Vercel hesabının da bu GitHub depolarına erişimi olmalıdır.

## Yayın düzeni

Kullanıcı yayın/ödeme seçeneğine geçtiğinde siteye özel, özel bir GitHub deposu ve ona bağlı ayrı bir Vercel projesi hazırlanır. Aylık ödeme onaylanan kullanıcıların Studio değişiklikleri bu site deposuna aktarılır. Tek seferlik kurulum ve SiteMix yönetimi seçeneklerinde müşteri düzenleme paneli kilitli kalır. Admin panelinden domain bağlandığında `robots.txt`, `sitemap.xml` ve canonical adresleri site deposunda otomatik güncellenir.

## Komutlar

```bash
npm run dev
npm run build
npm run lint
```
