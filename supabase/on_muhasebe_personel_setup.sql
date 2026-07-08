create extension if not exists pgcrypto;

create table if not exists public.on_muhasebe_company_users (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('owner', 'staff')),
  status text not null default 'active' check (status in ('active', 'passive')),
  permissions jsonb not null default '{}'::jsonb,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (company_id, user_id)
);

create index if not exists on_muhasebe_company_users_user_idx
  on public.on_muhasebe_company_users(user_id);

create index if not exists on_muhasebe_company_users_company_idx
  on public.on_muhasebe_company_users(company_id);

create or replace function public.set_on_muhasebe_company_users_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_on_muhasebe_company_users_updated_at
  on public.on_muhasebe_company_users;

create trigger set_on_muhasebe_company_users_updated_at
before update on public.on_muhasebe_company_users
for each row
execute function public.set_on_muhasebe_company_users_updated_at();

insert into public.on_muhasebe_company_users (
  company_id,
  user_id,
  role,
  status,
  permissions,
  created_by
)
select
  c.id,
  c.owner_user_id,
  'owner',
  'active',
  jsonb_build_object(
    'dashboard', true,
    'cari', true,
    'stok', true,
    'kasa', true,
    'fatura', true,
    'rapor', true,
    'ayarlar', true,
    'yedekleme', true,
    'personel', true
  ),
  c.owner_user_id
from public.companies c
where c.owner_user_id is not null
on conflict (company_id, user_id) do update set
  role = 'owner',
  status = 'active',
  permissions = excluded.permissions;

alter table public.on_muhasebe_company_users enable row level security;

drop policy if exists "on_muhasebe_company_users_select_own" on public.on_muhasebe_company_users;
create policy "on_muhasebe_company_users_select_own"
on public.on_muhasebe_company_users
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.on_muhasebe_company_users owner_membership
    where owner_membership.company_id = on_muhasebe_company_users.company_id
      and owner_membership.user_id = auth.uid()
      and owner_membership.role = 'owner'
      and owner_membership.status = 'active'
  )
);
