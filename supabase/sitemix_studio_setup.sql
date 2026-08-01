-- SiteMix Studio ana şeması
-- Bu dosya mevcut ön muhasebe tablolarını değiştirmez.

create extension if not exists pgcrypto;

create or replace function public.sitemix_touch_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table if not exists public.studio_projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  slug text not null unique,
  sector text not null,
  prompt text not null default '',
  status text not null default 'draft' check (status in ('draft','ready','request_received','published','payment_pending','suspended','archived')),
  management_mode text check (management_mode is null or management_mode in ('monthly','yearly','managed')),
  payment_status text not null default 'not_required' check (payment_status in ('not_required','pending','paid','overdue','grace','cancelled')),
  current_version jsonb not null default '{}'::jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists studio_projects_owner_updated_idx on public.studio_projects(owner_id, updated_at desc);
create index if not exists studio_projects_status_idx on public.studio_projects(status, updated_at desc);

drop trigger if exists studio_projects_touch on public.studio_projects;
create trigger studio_projects_touch before update on public.studio_projects
for each row execute function public.sitemix_touch_updated_at();

create table if not exists public.studio_messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant','system','admin')),
  content text not null,
  created_at timestamptz not null default now()
);
create index if not exists studio_messages_project_created_idx on public.studio_messages(project_id, created_at);

create table if not exists public.studio_versions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  version_number integer not null,
  snapshot jsonb not null,
  change_note text,
  created_at timestamptz not null default now(),
  unique(project_id, version_number)
);
create index if not exists studio_versions_project_idx on public.studio_versions(project_id, version_number desc);

create table if not exists public.studio_leads (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references public.studio_projects(id) on delete set null,
  owner_id uuid references auth.users(id) on delete set null,
  type text not null check (type in ('managed_service','yearly_setup','custom_sector','support')),
  status text not null default 'new' check (status in ('new','contact_waiting','contacted','proposal_sent','approved','in_progress','completed','lost')),
  summary jsonb not null default '{}'::jsonb,
  admin_notes text,
  assigned_to uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_leads_status_created_idx on public.studio_leads(status, created_at desc);
drop trigger if exists studio_leads_touch on public.studio_leads;
create trigger studio_leads_touch before update on public.studio_leads
for each row execute function public.sitemix_touch_updated_at();

create table if not exists public.studio_subscriptions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  plan text not null check (plan in ('monthly','yearly','managed','complimentary')),
  status text not null default 'pending' check (status in ('pending','active','overdue','grace','cancelled','expired')),
  amount numeric(12,2),
  currency text not null default 'TRY',
  starts_at timestamptz,
  renews_at timestamptz,
  grace_ends_at timestamptz,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(project_id)
);
drop trigger if exists studio_subscriptions_touch on public.studio_subscriptions;
create trigger studio_subscriptions_touch before update on public.studio_subscriptions
for each row execute function public.sitemix_touch_updated_at();

create table if not exists public.studio_payments (
  id uuid primary key default gen_random_uuid(),
  subscription_id uuid references public.studio_subscriptions(id) on delete set null,
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded','cancelled')),
  amount numeric(12,2) not null default 0,
  currency text not null default 'TRY',
  method text,
  transaction_reference text,
  paid_at timestamptz,
  period_start date,
  period_end date,
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_payments_status_created_idx on public.studio_payments(status, created_at desc);
drop trigger if exists studio_payments_touch on public.studio_payments;
create trigger studio_payments_touch before update on public.studio_payments
for each row execute function public.sitemix_touch_updated_at();

create table if not exists public.studio_domains (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  owner_id uuid not null references auth.users(id) on delete cascade,
  domain text not null unique,
  status text not null default 'requested' check (status in ('requested','dns_pending','verification_pending','active','error','removed')),
  is_primary boolean not null default false,
  ssl_status text not null default 'pending' check (ssl_status in ('pending','provisioning','active','error')),
  verification_records jsonb not null default '[]'::jsonb,
  registrar text,
  expires_at date,
  last_checked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_domains_project_idx on public.studio_domains(project_id, created_at desc);
drop trigger if exists studio_domains_touch on public.studio_domains;
create trigger studio_domains_touch before update on public.studio_domains
for each row execute function public.sitemix_touch_updated_at();

create table if not exists public.studio_form_submissions (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.studio_projects(id) on delete cascade,
  type text not null default 'contact',
  name text,
  phone text,
  email text,
  message text,
  status text not null default 'new' check (status in ('new','read','contacted','closed','spam')),
  source_url text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists studio_forms_project_status_idx on public.studio_form_submissions(project_id, status, created_at desc);
drop trigger if exists studio_forms_touch on public.studio_form_submissions;
create trigger studio_forms_touch before update on public.studio_form_submissions
for each row execute function public.sitemix_touch_updated_at();

create table if not exists public.studio_staff (
  user_id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('super_admin','editor','sales','support','accounting','viewer')),
  active boolean not null default true,
  permissions jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_settings (
  key text primary key,
  value jsonb not null,
  updated_by uuid references auth.users(id) on delete set null,
  updated_at timestamptz not null default now()
);

create table if not exists public.studio_sectors (
  id text primary key,
  label text not null,
  keywords jsonb not null default '[]'::jsonb,
  services jsonb not null default '[]'::jsonb,
  configuration jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
drop trigger if exists studio_sectors_touch on public.studio_sectors;
create trigger studio_sectors_touch before update on public.studio_sectors
for each row execute function public.sitemix_touch_updated_at();

insert into public.studio_sectors(id, label, keywords, services, sort_order)
values
  ('kuafor','Kadın kuaförü','["kuaför","saç","hair"]','["Saç kesimi","Renklendirme","Fön ve bakım","Gelin saçı"]',10),
  ('berber','Erkek berberi','["berber","barber"]','["Saç kesimi","Sakal tasarımı","Cilt bakımı","Damat paketi"]',20),
  ('guzellik','Güzellik salonu','["güzellik","nail","bakım"]','["Cilt bakımı","Kalıcı oje","Kirpik lifting","Profesyonel makyaj"]',30),
  ('hali-yikama','Halı ve koltuk yıkama','["halı","koltuk","yıkama"]','["Halı yıkama","Koltuk yıkama","Yorgan yıkama","Yerinde temizlik"]',40),
  ('oto-yikama','Oto yıkama','["oto","araç","detailing"]','["İç dış yıkama","Detaylı temizlik","Pasta cila","Seramik kaplama"]',50),
  ('teknik-servis','Teknik servis','["elektrik","tesisat","klima","servis"]','["Aynı gün servis","Arıza tespiti","Bakım ve onarım","Acil destek"]',60),
  ('emlak','Emlak danışmanı','["emlak","gayrimenkul"]','["Satılık portföy","Kiralık portföy","Değerleme","Yatırım danışmanlığı"]',70),
  ('danismanlik','Danışmanlık','["diyetisyen","danışman","uzman"]','["İlk görüşme","Kişisel plan","Online danışmanlık","Süreç takibi"]',80),
  ('organizasyon','Organizasyon','["düğün","organizasyon","etkinlik"]','["Düğün organizasyonu","Nişan ve söz","Kurumsal etkinlik","Mekân süsleme"]',90)
on conflict (id) do nothing;

insert into public.studio_settings(key, value)
values
  ('contact', '{"whatsapp":"905515550302","support_email":"hakanbenli47@gmail.com"}'::jsonb),
  ('publishing', '{"auto_suspend":false,"grace_days":7,"monthly_domains_free":true}'::jsonb)
on conflict (key) do nothing;

create table if not exists public.studio_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users(id) on delete set null,
  actor_label text,
  action text not null,
  entity_type text not null,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists studio_audit_created_idx on public.studio_audit_logs(created_at desc);

alter table public.studio_projects enable row level security;
alter table public.studio_messages enable row level security;
alter table public.studio_versions enable row level security;
alter table public.studio_leads enable row level security;
alter table public.studio_subscriptions enable row level security;
alter table public.studio_payments enable row level security;
alter table public.studio_domains enable row level security;
alter table public.studio_form_submissions enable row level security;
alter table public.studio_staff enable row level security;
alter table public.studio_settings enable row level security;
alter table public.studio_sectors enable row level security;
alter table public.studio_audit_logs enable row level security;

drop policy if exists studio_projects_owner on public.studio_projects;
create policy studio_projects_owner on public.studio_projects for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists studio_messages_owner on public.studio_messages;
create policy studio_messages_owner on public.studio_messages for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists studio_versions_owner on public.studio_versions;
create policy studio_versions_owner on public.studio_versions for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists studio_leads_owner_read on public.studio_leads;
create policy studio_leads_owner_read on public.studio_leads for select using (owner_id = auth.uid());
drop policy if exists studio_leads_owner_insert on public.studio_leads;
create policy studio_leads_owner_insert on public.studio_leads for insert with check (owner_id = auth.uid());
drop policy if exists studio_subscriptions_owner_read on public.studio_subscriptions;
create policy studio_subscriptions_owner_read on public.studio_subscriptions for select using (owner_id = auth.uid());
drop policy if exists studio_payments_owner_read on public.studio_payments;
create policy studio_payments_owner_read on public.studio_payments for select using (owner_id = auth.uid());
drop policy if exists studio_domains_owner on public.studio_domains;
create policy studio_domains_owner on public.studio_domains for all using (owner_id = auth.uid()) with check (owner_id = auth.uid());
drop policy if exists studio_forms_owner_read on public.studio_form_submissions;
create policy studio_forms_owner_read on public.studio_form_submissions for select using (
  exists (select 1 from public.studio_projects p where p.id = project_id and p.owner_id = auth.uid())
);
drop policy if exists studio_staff_self_read on public.studio_staff;
create policy studio_staff_self_read on public.studio_staff for select using (user_id = auth.uid());

grant select, insert, update, delete on public.studio_projects to authenticated;
grant select, insert, update, delete on public.studio_messages to authenticated;
grant select, insert on public.studio_versions to authenticated;
grant select, insert on public.studio_leads to authenticated;
grant select on public.studio_subscriptions to authenticated;
grant select on public.studio_payments to authenticated;
grant select, insert, update, delete on public.studio_domains to authenticated;
grant select on public.studio_form_submissions to authenticated;
grant select on public.studio_staff to authenticated;
