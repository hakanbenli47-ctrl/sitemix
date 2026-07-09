create extension if not exists pgcrypto;

-- Aktif donem secimi: Ayarlar ekraninda secilen yil giriste otomatik acilir.
alter table public.on_muhasebe_settings
  add column if not exists active_work_year integer;

-- Fis duzenleme takibi icin hareket tablosu yoksa olusturulur.
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

create index if not exists on_muhasebe_personel_hareketleri_company_module_idx
  on public.on_muhasebe_personel_hareketleri(company_id, module_key, action_type, created_at desc);

create index if not exists on_muhasebe_personel_hareketleri_entity_idx
  on public.on_muhasebe_personel_hareketleri(entity_table, entity_id, created_at desc);

alter table public.on_muhasebe_personel_hareketleri enable row level security;

drop policy if exists "on_muhasebe_personel_hareketleri_access"
  on public.on_muhasebe_personel_hareketleri;

create policy "on_muhasebe_personel_hareketleri_access"
on public.on_muhasebe_personel_hareketleri
for all
to authenticated
using (
  public.on_muhasebe_has_company_access(company_id, 'ayarlar')
  or public.on_muhasebe_has_company_access(company_id, 'fatura')
)
with check (public.on_muhasebe_has_company_access(company_id));
