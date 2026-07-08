create or replace function public.on_muhasebe_has_company_access(
  target_company_id uuid,
  module_key text default null
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.on_muhasebe_company_users membership
    where membership.company_id = target_company_id
      and membership.user_id = auth.uid()
      and membership.status = 'active'
      and (
        membership.role = 'owner'
        or module_key is null
        or coalesce((membership.permissions ->> module_key)::boolean, false)
      )
  );
$$;

alter table public.companies enable row level security;
drop policy if exists "on_muhasebe_companies_access" on public.companies;
create policy "on_muhasebe_companies_access"
on public.companies
for select
to authenticated
using (public.on_muhasebe_has_company_access(id));

alter table public.subscriptions enable row level security;
drop policy if exists "on_muhasebe_subscriptions_access" on public.subscriptions;
create policy "on_muhasebe_subscriptions_access"
on public.subscriptions
for select
to authenticated
using (public.on_muhasebe_has_company_access(company_id));

alter table public.profiles enable row level security;
drop policy if exists "on_muhasebe_profiles_own_select" on public.profiles;
create policy "on_muhasebe_profiles_own_select"
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "on_muhasebe_profiles_own_update" on public.profiles;
create policy "on_muhasebe_profiles_own_update"
on public.profiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

alter table public.cari_hesaplar enable row level security;
drop policy if exists "on_muhasebe_cari_access" on public.cari_hesaplar;
create policy "on_muhasebe_cari_access"
on public.cari_hesaplar
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'cari'))
with check (public.on_muhasebe_has_company_access(company_id, 'cari'));

alter table public.cari_hareketleri enable row level security;
drop policy if exists "on_muhasebe_cari_hareket_access" on public.cari_hareketleri;
create policy "on_muhasebe_cari_hareket_access"
on public.cari_hareketleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'cari'))
with check (public.on_muhasebe_has_company_access(company_id, 'cari'));

alter table public.urun_kategorileri enable row level security;
drop policy if exists "on_muhasebe_urun_kategori_access" on public.urun_kategorileri;
create policy "on_muhasebe_urun_kategori_access"
on public.urun_kategorileri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'stok'))
with check (public.on_muhasebe_has_company_access(company_id, 'stok'));

alter table public.urunler enable row level security;
drop policy if exists "on_muhasebe_urun_access" on public.urunler;
create policy "on_muhasebe_urun_access"
on public.urunler
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'stok'))
with check (public.on_muhasebe_has_company_access(company_id, 'stok'));

alter table public.stok_hareketleri enable row level security;
drop policy if exists "on_muhasebe_stok_hareket_access" on public.stok_hareketleri;
create policy "on_muhasebe_stok_hareket_access"
on public.stok_hareketleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'stok'))
with check (public.on_muhasebe_has_company_access(company_id, 'stok'));

alter table public.kasa_hesaplari enable row level security;
drop policy if exists "on_muhasebe_kasa_hesap_access" on public.kasa_hesaplari;
create policy "on_muhasebe_kasa_hesap_access"
on public.kasa_hesaplari
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'kasa'))
with check (public.on_muhasebe_has_company_access(company_id, 'kasa'));

alter table public.kasa_hareketleri enable row level security;
drop policy if exists "on_muhasebe_kasa_hareket_access" on public.kasa_hareketleri;
create policy "on_muhasebe_kasa_hareket_access"
on public.kasa_hareketleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'kasa'))
with check (public.on_muhasebe_has_company_access(company_id, 'kasa'));

alter table public.gelir_gider_kategorileri enable row level security;
drop policy if exists "on_muhasebe_gelir_gider_kategori_access" on public.gelir_gider_kategorileri;
create policy "on_muhasebe_gelir_gider_kategori_access"
on public.gelir_gider_kategorileri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'kasa'))
with check (public.on_muhasebe_has_company_access(company_id, 'kasa'));

alter table public.fatura_fisleri enable row level security;
drop policy if exists "on_muhasebe_fatura_access" on public.fatura_fisleri;
create policy "on_muhasebe_fatura_access"
on public.fatura_fisleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'fatura'))
with check (public.on_muhasebe_has_company_access(company_id, 'fatura'));

alter table public.fatura_fis_kalemleri enable row level security;
drop policy if exists "on_muhasebe_fatura_kalem_access" on public.fatura_fis_kalemleri;
create policy "on_muhasebe_fatura_kalem_access"
on public.fatura_fis_kalemleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'fatura'))
with check (public.on_muhasebe_has_company_access(company_id, 'fatura'));

alter table public.on_muhasebe_settings enable row level security;
drop policy if exists "on_muhasebe_settings_owner_access" on public.on_muhasebe_settings;
create policy "on_muhasebe_settings_owner_access"
on public.on_muhasebe_settings
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'ayarlar'))
with check (public.on_muhasebe_has_company_access(company_id, 'ayarlar'));

alter table public.on_muhasebe_backup_logs enable row level security;
drop policy if exists "on_muhasebe_backup_logs_owner_access" on public.on_muhasebe_backup_logs;
create policy "on_muhasebe_backup_logs_owner_access"
on public.on_muhasebe_backup_logs
for select
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'yedekleme'));
