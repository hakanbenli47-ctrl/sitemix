create index if not exists on_muhasebe_company_users_user_status_idx
  on public.on_muhasebe_company_users(user_id, status);

create index if not exists on_muhasebe_company_users_company_user_status_idx
  on public.on_muhasebe_company_users(company_id, user_id, status);

create index if not exists subscriptions_company_created_idx
  on public.subscriptions(company_id, created_at desc);

create index if not exists cari_hesaplar_company_deleted_unvan_idx
  on public.cari_hesaplar(company_id, deleted_at, unvan);

create index if not exists cari_hesaplar_company_active_deleted_idx
  on public.cari_hesaplar(company_id, aktif, deleted_at);

create index if not exists urunler_company_deleted_created_idx
  on public.urunler(company_id, deleted_at, created_at desc);

create index if not exists urunler_company_active_deleted_name_idx
  on public.urunler(company_id, aktif, deleted_at, urun_adi);

create index if not exists urun_kategorileri_company_deleted_name_idx
  on public.urun_kategorileri(company_id, deleted_at, kategori_adi);

create index if not exists stok_hareketleri_company_date_created_idx
  on public.stok_hareketleri(company_id, hareket_tarihi desc, created_at desc);

create index if not exists stok_hareketleri_company_product_date_idx
  on public.stok_hareketleri(company_id, urun_id, hareket_tarihi desc);

create index if not exists kasa_hesaplari_company_deleted_created_idx
  on public.kasa_hesaplari(company_id, deleted_at, created_at);

create index if not exists kasa_hareketleri_company_date_created_idx
  on public.kasa_hareketleri(company_id, islem_tarihi desc, created_at desc);

create index if not exists kasa_hareketleri_company_account_date_idx
  on public.kasa_hareketleri(company_id, kasa_hesap_id, islem_tarihi desc);

create index if not exists gelir_gider_kategorileri_company_active_deleted_name_idx
  on public.gelir_gider_kategorileri(company_id, aktif, deleted_at, kategori_adi);

create index if not exists fatura_fisleri_company_date_created_idx
  on public.fatura_fisleri(company_id, fis_tarihi desc, created_at desc);

create index if not exists fatura_fisleri_company_status_type_date_idx
  on public.fatura_fisleri(company_id, durum, fis_turu, fis_tarihi desc);

create index if not exists fatura_fis_kalemleri_company_fis_idx
  on public.fatura_fis_kalemleri(company_id, fis_id);

create index if not exists fatura_fis_kalemleri_company_product_idx
  on public.fatura_fis_kalemleri(company_id, urun_id);
