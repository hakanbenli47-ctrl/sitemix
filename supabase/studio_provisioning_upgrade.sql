-- SiteMix Studio bağımsız GitHub/Vercel yayın kayıtları
-- Ön muhasebe tablolarını değiştirmez.

create table if not exists public.studio_deployments (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null unique references public.studio_projects(id) on delete cascade,
  github_repo_id bigint,
  github_repo_name text,
  github_repo_full_name text,
  github_repo_url text,
  github_commit_sha text,
  vercel_project_id text,
  vercel_project_name text,
  vercel_url text,
  domain text,
  status text not null default 'queued' check (status in ('queued','configuration_required','provisioning','vercel_connection_required','ready','error','archived')),
  last_error text,
  provisioned_at timestamptz,
  seo_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.studio_deployments
drop constraint if exists studio_deployments_status_check;
alter table public.studio_deployments
add constraint studio_deployments_status_check
check (status in ('queued','configuration_required','provisioning','vercel_connection_required','ready','error','archived'));

create index if not exists studio_deployments_status_idx on public.studio_deployments(status, updated_at desc);
drop trigger if exists studio_deployments_touch on public.studio_deployments;
create trigger studio_deployments_touch before update on public.studio_deployments
for each row execute function public.sitemix_touch_updated_at();

alter table public.studio_deployments enable row level security;
drop policy if exists studio_deployments_owner_read on public.studio_deployments;
create policy studio_deployments_owner_read on public.studio_deployments for select using (
  exists (select 1 from public.studio_projects p where p.id = project_id and p.owner_id = auth.uid())
);
grant select on public.studio_deployments to authenticated;
