-- Migration: 20261003220000_initial_schema.sql
-- Phase 2: Dashboard and schema
-- Eight tables: projects, analyses, files, edges, routes, explanations, file_roles, insights
-- Foreign key to organizations(id) on delete cascade
-- Row-level security enabled on all tables with tenant isolation predicate

-- 1. Organizations table (root of foreign keys)
create table if not exists public.organizations (
  id text primary key,
  name text not null,
  slug text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2. Projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  name text not null,
  repository_url text not null,
  default_branch text not null default 'main',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 3. Analyses table
create table if not exists public.analyses (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  project_id uuid references public.projects(id) on delete cascade,
  repository_url text not null,
  commit_hash text,
  status text not null default 'pending',
  stage text,
  error_message text,
  coverage_ratio numeric(5, 4),
  files_count integer not null default 0,
  edges_count integer not null default 0,
  started_at timestamptz default now(),
  finished_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Files table
create table if not exists public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  path text not null,
  directory text not null,
  name text not null,
  extension text not null,
  lines_count integer not null default 0,
  content_hash text,
  fan_in integer not null default 0,
  fan_out integer not null default 0,
  created_at timestamptz not null default now()
);

-- 5. Edges table
create table if not exists public.edges (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  source_file_id uuid references public.files(id) on delete cascade,
  target_file_id uuid references public.files(id) on delete cascade,
  source_path text not null,
  target_path text not null,
  import_type text not null default 'import',
  raw_specifier text not null,
  resolved boolean not null default true,
  unresolved_reason text,
  created_at timestamptz not null default now()
);

-- 6. Routes table
create table if not exists public.routes (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  file_id uuid references public.files(id) on delete cascade,
  method text not null,
  pattern text not null,
  handler_name text,
  framework text,
  created_at timestamptz not null default now()
);

-- 7. Explanations table
create table if not exists public.explanations (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  file_id uuid references public.files(id) on delete cascade,
  target_type text not null default 'file',
  target_path text not null,
  content_hash text not null,
  model text not null,
  prompt_version text not null default 'v1',
  explanation text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 8. File Roles table
create table if not exists public.file_roles (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  file_id uuid not null references public.files(id) on delete cascade,
  role text not null,
  source text not null default 'adapter',
  confidence numeric(3, 2),
  created_at timestamptz not null default now()
);

-- 9. Insights table
create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  organization_id text not null references public.organizations(id) on delete cascade,
  analysis_id uuid not null references public.analyses(id) on delete cascade,
  file_id uuid references public.files(id) on delete cascade,
  kind text not null,
  message text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Indexes for tenant isolation and join performance
create index if not exists idx_projects_org on public.projects(organization_id);
create index if not exists idx_analyses_org on public.analyses(organization_id);
create index if not exists idx_files_org on public.files(organization_id);
create index if not exists idx_edges_org on public.edges(organization_id);
create index if not exists idx_routes_org on public.routes(organization_id);
create index if not exists idx_explanations_org on public.explanations(organization_id);
create index if not exists idx_file_roles_org on public.file_roles(organization_id);
create index if not exists idx_insights_org on public.insights(organization_id);

create index if not exists idx_analyses_project on public.analyses(project_id);
create index if not exists idx_files_analysis on public.files(analysis_id);
create index if not exists idx_edges_analysis on public.edges(analysis_id);
create index if not exists idx_routes_analysis on public.routes(analysis_id);
create index if not exists idx_explanations_analysis on public.explanations(analysis_id);
create index if not exists idx_file_roles_analysis on public.file_roles(analysis_id);
create index if not exists idx_insights_analysis on public.insights(analysis_id);

-- Enable Row Level Security on ALL tables
alter table public.organizations enable row level security;
alter table public.projects enable row level security;
alter table public.analyses enable row level security;
alter table public.files enable row level security;
alter table public.edges enable row level security;
alter table public.routes enable row level security;
alter table public.explanations enable row level security;
alter table public.file_roles enable row level security;
alter table public.insights enable row level security;

-- Force RLS on all tables
alter table public.organizations force row level security;
alter table public.projects force row level security;
alter table public.analyses force row level security;
alter table public.files force row level security;
alter table public.edges force row level security;
alter table public.routes force row level security;
alter table public.explanations force row level security;
alter table public.file_roles force row level security;
alter table public.insights force row level security;

-- RLS Policies for Organizations
drop policy if exists organizations_tenant_isolation on public.organizations;
create policy organizations_tenant_isolation on public.organizations
  for all to authenticated
  using (id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Projects
drop policy if exists projects_tenant_isolation on public.projects;
create policy projects_tenant_isolation on public.projects
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Analyses
drop policy if exists analyses_tenant_isolation on public.analyses;
create policy analyses_tenant_isolation on public.analyses
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Files
drop policy if exists files_tenant_isolation on public.files;
create policy files_tenant_isolation on public.files
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Edges
drop policy if exists edges_tenant_isolation on public.edges;
create policy edges_tenant_isolation on public.edges
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Routes
drop policy if exists routes_tenant_isolation on public.routes;
create policy routes_tenant_isolation on public.routes
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Explanations
drop policy if exists explanations_tenant_isolation on public.explanations;
create policy explanations_tenant_isolation on public.explanations
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for File Roles
drop policy if exists file_roles_tenant_isolation on public.file_roles;
create policy file_roles_tenant_isolation on public.file_roles
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));

-- RLS Policies for Insights
drop policy if exists insights_tenant_isolation on public.insights;
create policy insights_tenant_isolation on public.insights
  for all to authenticated
  using (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')))
  with check (organization_id = (select coalesce(auth.jwt()->>'org_id', auth.jwt()->'o'->>'id')));
