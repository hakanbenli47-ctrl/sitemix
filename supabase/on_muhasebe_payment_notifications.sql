create table if not exists public.on_muhasebe_payment_notifications (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references public.companies(id) on delete cascade,
  user_id uuid references auth.users(id) on delete set null,
  subscription_id uuid references public.subscriptions(id) on delete set null,
  payment_code text not null,
  description text not null,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  created_at timestamptz not null default now(),
  updated_at timestamptz
);

create index if not exists on_muhasebe_payment_notifications_company_status_idx
  on public.on_muhasebe_payment_notifications(company_id, status, created_at desc);

alter table public.on_muhasebe_payment_notifications enable row level security;

drop policy if exists "payment_notifications_owner_access"
  on public.on_muhasebe_payment_notifications;

create policy "payment_notifications_owner_access"
on public.on_muhasebe_payment_notifications
for select
using (
  exists (
    select 1
    from public.on_muhasebe_company_users cu
    where cu.company_id = on_muhasebe_payment_notifications.company_id
      and cu.user_id = auth.uid()
      and cu.status = 'active'
      and cu.role = 'owner'
  )
);
