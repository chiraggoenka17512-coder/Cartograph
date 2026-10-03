-- Seed data for Phase 2: Matches canonical dashboard dataset
-- Seeds the 5 exact analyses shown in the product design for the active team,
-- plus distinct analyses for the second team for organization switching verification.

-- Clear previous analyses and child data cleanly
delete from public.insights;
delete from public.file_roles;
delete from public.explanations;
delete from public.routes;
delete from public.edges;
delete from public.files;
delete from public.analyses;
delete from public.projects;

-- 1. Org 1: Active Organization
insert into public.organizations (id, name, slug)
values ('org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'Chirag And Vihaan''s Organization', 'chirag-and-vihaan-s-organization-1791026997951247940')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

-- 2. Org 2: Acme Systems Lab (for switching check)
insert into public.organizations (id, name, slug)
values ('org_3KByWCWImUaLO3EfZhwD9kbkDaN', 'Acme Systems Lab', 'acme-systems-lab')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

-- Projects for Org 1
insert into public.projects (id, organization_id, name, repository_url, default_branch)
values
  ('11111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'tailwindcss', 'https://github.com/tailwindlabs/tailwindcss', 'main'),
  ('22222222-2222-4222-8222-222222222222', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'next.js', 'https://github.com/vercel/next.js', 'canary'),
  ('33333333-3333-4333-8333-333333333333', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'ui', 'https://github.com/shadcn-ui/ui', 'main');

-- The 5 canonical analyses for Org 1 (matching exact screenshot)
-- 1. tailwindlabs/tailwindcss | queued   | —       | 2m ago  | —
-- 2. vercel/next.js           | parsing  | a93be01 | 3m ago  | —
-- 3. shadcn-ui/ui             | failed   | —       | 5h ago  | 5h ago (Repository archive download timed out)
-- 4. shadcn-ui/ui             | complete | 0c7d9e2 | 24h ago | 24h ago
-- 5. vercel/next.js           | complete | 4f1c2a9 | 3d ago  | 3d ago

insert into public.analyses (
  id,
  organization_id,
  project_id,
  repository_url,
  commit_hash,
  status,
  stage,
  error_message,
  coverage_ratio,
  files_count,
  edges_count,
  started_at,
  finished_at,
  created_at
)
values
  (
    'a1111111-1111-4111-8111-111111111111',
    'org_3KBNS1gNFq6P8Jg7aVHB80XqHza',
    '11111111-1111-4111-8111-111111111111',
    'tailwindlabs/tailwindcss',
    null,
    'queued',
    null,
    null,
    null,
    0,
    0,
    now() - interval '2 minutes',
    null,
    now() - interval '2 minutes'
  ),
  (
    'a2222222-2222-4222-8222-222222222222',
    'org_3KBNS1gNFq6P8Jg7aVHB80XqHza',
    '22222222-2222-4222-8222-222222222222',
    'vercel/next.js',
    'a93be01',
    'parsing',
    null,
    null,
    null,
    184,
    420,
    now() - interval '3 minutes',
    null,
    now() - interval '3 minutes'
  ),
  (
    'a3333333-3333-4333-8333-333333333333',
    'org_3KBNS1gNFq6P8Jg7aVHB80XqHza',
    '33333333-3333-4333-8333-333333333333',
    'shadcn-ui/ui',
    null,
    'failed',
    null,
    'Repository archive download timed out',
    null,
    0,
    0,
    now() - interval '5 hours',
    now() - interval '5 hours',
    now() - interval '5 hours'
  ),
  (
    'a4444444-4444-4444-8444-444444444444',
    'org_3KBNS1gNFq6P8Jg7aVHB80XqHza',
    '33333333-3333-4333-8333-333333333333',
    'shadcn-ui/ui',
    '0c7d9e2',
    'complete',
    'indexed',
    null,
    0.9850,
    95,
    312,
    now() - interval '24 hours',
    now() - interval '24 hours',
    now() - interval '24 hours'
  ),
  (
    'a5555555-5555-4555-8555-555555555555',
    'org_3KBNS1gNFq6P8Jg7aVHB80XqHza',
    '22222222-2222-4222-8222-222222222222',
    'vercel/next.js',
    '4f1c2a9',
    'complete',
    'indexed',
    null,
    0.9620,
    342,
    1480,
    now() - interval '3 days',
    now() - interval '3 days',
    now() - interval '3 days'
  );

-- Analyses for Org 2: Acme Systems Lab (for switching check)
insert into public.projects (id, organization_id, name, repository_url, default_branch)
values
  ('44444444-4444-4444-8444-444444444444', 'org_3KByWCWImUaLO3EfZhwD9kbkDaN', 'trpc', 'https://github.com/trpc/trpc', 'main');

insert into public.analyses (
  id,
  organization_id,
  project_id,
  repository_url,
  commit_hash,
  status,
  stage,
  error_message,
  coverage_ratio,
  files_count,
  edges_count,
  started_at,
  finished_at,
  created_at
)
values
  (
    'b1111111-1111-4111-8111-111111111111',
    'org_3KByWCWImUaLO3EfZhwD9kbkDaN',
    '44444444-4444-4444-8444-444444444444',
    'trpc/trpc',
    '9d3a71b',
    'complete',
    'indexed',
    null,
    0.9910,
    124,
    487,
    now() - interval '4 hours',
    now() - interval '4 hours',
    now() - interval '4 hours'
  ),
  (
    'b2222222-2222-4222-8222-222222222222',
    'org_3KByWCWImUaLO3EfZhwD9kbkDaN',
    '44444444-4444-4444-8444-444444444444',
    'facebook/react',
    'b8cf4a1',
    'complete',
    'indexed',
    null,
    0.9420,
    312,
    1205,
    now() - interval '1 day',
    now() - interval '1 day',
    now() - interval '1 day'
  );

-- Seed connected rows for files, edges, routes, explanations, file_roles, insights
insert into public.files (id, organization_id, analysis_id, path, directory, name, extension, lines_count, content_hash, fan_in, fan_out)
values
  ('f1111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'packages/cli/src/index.ts', 'packages/cli/src', 'index.ts', '.ts', 84, 'h_cli', 0, 5),
  ('f2222222-2222-4222-8222-222222222222', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'packages/cli/src/utils.ts', 'packages/cli/src', 'utils.ts', '.ts', 42, 'h_utils', 3, 1);

insert into public.edges (id, organization_id, analysis_id, source_file_id, target_file_id, source_path, target_path, import_type, raw_specifier)
values
  ('e1111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'f1111111-1111-4111-8111-111111111111', 'f2222222-2222-4222-8222-222222222222', 'packages/cli/src/index.ts', 'packages/cli/src/utils.ts', 'import', './utils');

insert into public.routes (id, organization_id, analysis_id, file_id, method, pattern, handler_name, framework)
values
  ('c1111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'f1111111-1111-4111-8111-111111111111', 'GET', '/api/registry', 'registryHandler', 'nextjs');

insert into public.explanations (id, organization_id, analysis_id, file_id, target_type, target_path, content_hash, model, prompt_version, explanation)
values
  ('d1111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'f1111111-1111-4111-8111-111111111111', 'file', 'packages/cli/src/index.ts', 'h_cli', 'gpt-4o', 'v1', 'Entry point for shadcn-ui CLI.');

insert into public.file_roles (id, organization_id, analysis_id, file_id, role, source, confidence)
values
  ('da111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'f1111111-1111-4111-8111-111111111111', 'entrypoint', 'adapter', 1.0);

insert into public.insights (id, organization_id, analysis_id, file_id, kind, message, metadata)
values
  ('db111111-1111-4111-8111-111111111111', 'org_3KBNS1gNFq6P8Jg7aVHB80XqHza', 'a4444444-4444-4444-8444-444444444444', 'f1111111-1111-4111-8111-111111111111', 'high_fan_in', 'High fan in utility component', '{}'::jsonb);
