create table if not exists public.on_muhasebe_calisma_donemleri (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  yil integer not null,
  baslangic_tarihi date not null,
  bitis_tarihi date not null,
  durum text not null default 'acik' check (durum in ('acik', 'kapali', 'pasif')),
  locked boolean not null default false,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, yil)
);

create table if not exists public.on_muhasebe_yil_devirleri (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  kaynak_yil integer not null,
  hedef_yil integer not null,
  durum text not null default 'hazir' check (durum in ('hazir', 'iptal')),
  cari_sayisi integer not null default 0,
  borclu_toplam numeric(14,2) not null default 0,
  alacakli_toplam numeric(14,2) not null default 0,
  net_bakiye numeric(14,2) not null default 0,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, kaynak_yil, hedef_yil)
);

create table if not exists public.on_muhasebe_cari_devirleri (
  id uuid primary key default gen_random_uuid(),
  devir_id uuid not null references public.on_muhasebe_yil_devirleri(id) on delete cascade,
  company_id uuid not null references public.companies(id) on delete cascade,
  cari_id uuid not null references public.cari_hesaplar(id) on delete cascade,
  cari_kodu text not null,
  unvan text not null,
  kaynak_yil integer not null,
  hedef_yil integer not null,
  kaynak_yil_son_bakiye numeric(14,2) not null default 0,
  hedef_acilis_bakiyesi numeric(14,2) not null default 0,
  hedef_acilis_bakiye_tipi text not null default 'borc_yok',
  durum text not null default 'hazir' check (durum in ('hazir', 'iptal')),
  created_at timestamptz not null default now()
);

create table if not exists public.on_muhasebe_personel_hareketleri (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  actor_role text,
  module_key text not null,
  action_type text not null,
  title text not null,
  detail text,
  entity_table text,
  entity_id uuid,
  amount numeric(14,2),
  movement_date date not null default current_date,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists on_muhasebe_calisma_donemleri_company_yil_idx
  on public.on_muhasebe_calisma_donemleri(company_id, yil desc);

create index if not exists on_muhasebe_yil_devirleri_company_idx
  on public.on_muhasebe_yil_devirleri(company_id, created_at desc);

create index if not exists on_muhasebe_cari_devirleri_devir_idx
  on public.on_muhasebe_cari_devirleri(devir_id, unvan);

create index if not exists on_muhasebe_personel_hareketleri_company_date_idx
  on public.on_muhasebe_personel_hareketleri(company_id, movement_date desc, created_at desc);

create or replace function public.set_on_muhasebe_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_on_muhasebe_calisma_donemleri_updated_at
  on public.on_muhasebe_calisma_donemleri;
create trigger set_on_muhasebe_calisma_donemleri_updated_at
before update on public.on_muhasebe_calisma_donemleri
for each row execute function public.set_on_muhasebe_updated_at();

drop trigger if exists set_on_muhasebe_yil_devirleri_updated_at
  on public.on_muhasebe_yil_devirleri;
create trigger set_on_muhasebe_yil_devirleri_updated_at
before update on public.on_muhasebe_yil_devirleri
for each row execute function public.set_on_muhasebe_updated_at();

insert into public.on_muhasebe_calisma_donemleri (
  company_id,
  yil,
  baslangic_tarihi,
  bitis_tarihi,
  durum,
  locked,
  created_by
)
select
  c.id,
  extract(year from now())::integer,
  make_date(extract(year from now())::integer, 1, 1),
  make_date(extract(year from now())::integer, 12, 31),
  'acik',
  false,
  c.owner_user_id
from public.companies c
where c.owner_user_id is not null
on conflict (company_id, yil) do nothing;

alter table public.on_muhasebe_calisma_donemleri enable row level security;
drop policy if exists "on_muhasebe_calisma_donemleri_access"
  on public.on_muhasebe_calisma_donemleri;
create policy "on_muhasebe_calisma_donemleri_access"
on public.on_muhasebe_calisma_donemleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id))
with check (public.on_muhasebe_has_company_access(company_id, 'ayarlar'));

alter table public.on_muhasebe_yil_devirleri enable row level security;
drop policy if exists "on_muhasebe_yil_devirleri_access"
  on public.on_muhasebe_yil_devirleri;
create policy "on_muhasebe_yil_devirleri_access"
on public.on_muhasebe_yil_devirleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'ayarlar'))
with check (public.on_muhasebe_has_company_access(company_id, 'ayarlar'));

alter table public.on_muhasebe_cari_devirleri enable row level security;
drop policy if exists "on_muhasebe_cari_devirleri_access"
  on public.on_muhasebe_cari_devirleri;
create policy "on_muhasebe_cari_devirleri_access"
on public.on_muhasebe_cari_devirleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'ayarlar'))
with check (public.on_muhasebe_has_company_access(company_id, 'ayarlar'));

alter table public.on_muhasebe_personel_hareketleri enable row level security;
drop policy if exists "on_muhasebe_personel_hareketleri_access"
  on public.on_muhasebe_personel_hareketleri;
create policy "on_muhasebe_personel_hareketleri_access"
on public.on_muhasebe_personel_hareketleri
for all
to authenticated
using (public.on_muhasebe_has_company_access(company_id, 'ayarlar'))
with check (public.on_muhasebe_has_company_access(company_id));
