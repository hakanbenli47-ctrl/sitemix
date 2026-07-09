create extension if not exists pgcrypto;

create table if not exists public.on_muhasebe_settings (
  company_id uuid primary key references public.companies(id) on delete cascade,
  auto_backup_enabled boolean not null default true,
  backup_email text,
  backup_frequency_hours integer not null default 24,
  default_kdv_rate numeric(5,2) not null default 20,
  low_stock_alert_enabled boolean not null default true,
  receipt_prefix text not null default 'FIS',
  whatsapp_support_enabled boolean not null default true,
  active_work_year integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.on_muhasebe_settings
  add column if not exists default_kdv_rate numeric(5,2) not null default 20,
  add column if not exists low_stock_alert_enabled boolean not null default true,
  add column if not exists receipt_prefix text not null default 'FIS',
  add column if not exists whatsapp_support_enabled boolean not null default true,
  add column if not exists active_work_year integer;

create table if not exists public.on_muhasebe_backup_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  backup_type text not null check (backup_type in ('manual', 'auto')),
  status text not null check (status in ('success', 'failed')),
  email_to text,
  file_name text not null,
  row_count integer not null default 0,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists on_muhasebe_backup_logs_company_created_idx
  on public.on_muhasebe_backup_logs(company_id, created_at desc);

create table if not exists public.on_muhasebe_restore_logs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  status text not null check (status in ('success', 'failed')),
  file_name text not null,
  row_count integer not null default 0,
  backup_exported_at timestamptz,
  error_message text,
  created_at timestamptz not null default now()
);

create index if not exists on_muhasebe_restore_logs_company_created_idx
  on public.on_muhasebe_restore_logs(company_id, created_at desc);

alter table public.on_muhasebe_restore_logs enable row level security;

create or replace function public.set_on_muhasebe_settings_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_on_muhasebe_settings_updated_at
  on public.on_muhasebe_settings;

create trigger set_on_muhasebe_settings_updated_at
before update on public.on_muhasebe_settings
for each row
execute function public.set_on_muhasebe_settings_updated_at();
