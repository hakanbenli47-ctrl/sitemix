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
2. Supabase SQL editöründe `supabase/sitemix_studio_setup.sql` dosyasını bir kez çalıştırın.
3. Supabase Authentication içinde Google sağlayıcısını etkinleştirin.
4. Supabase Site URL ve Redirect URL listesine yerel adresi, `https://www.sitemix.com.tr/studio` ve `https://www.sitemix.com.tr/admin/giris` adreslerini ekleyin.
5. Domain otomasyonu için Vercel erişim anahtarı, proje kimliği ve gerekiyorsa takım kimliğini tanımlayın.

## Yayın düzeni

GitHub deposu Vercel projesine bağlanır. Kod değişiklikleri GitHub → Vercel üzerinden yayınlanır. Müşteri içerikleri Supabase’de tutulduğu için içerik değişiklikleri yeni kod dağıtımı gerektirmez.

## Komutlar

```bash
npm run dev
npm run build
npm run lint
```

