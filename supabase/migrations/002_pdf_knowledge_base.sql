insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'knowledge-documents',
  'knowledge-documents',
  false,
  10485760,
  array['application/pdf']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

create table if not exists public.knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  source_id uuid not null references public.knowledge_sources(id) on delete cascade,
  chunk_index integer not null,
  content text not null,
  created_at timestamptz not null default now(),
  unique (source_id, chunk_index)
);

create index if not exists knowledge_chunks_source_id_idx
  on public.knowledge_chunks(source_id);

alter table public.knowledge_chunks enable row level security;

-- MVP note:
-- PDF upload and reads happen through server-side Next.js API routes with
-- SUPABASE_SERVICE_ROLE_KEY. Do not expose direct public upload policies until
-- the customer dashboard has authentication and membership rules.
