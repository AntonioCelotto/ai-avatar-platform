-- AvatarOne is administered only through protected server routes using the
-- Supabase service role. RLS therefore denies direct anon/authenticated access.
drop policy if exists "Service role manages avatar clients" on public.avatar_clients;
drop policy if exists "Service role manages avatar knowledge" on public.avatar_client_knowledge_sources;
drop policy if exists "Service role manages avatar conversations" on public.avatar_client_conversations;
drop policy if exists "Service role manages avatar memories" on public.avatar_client_memories;

alter table public.avatar_clients enable row level security;
alter table public.avatar_client_knowledge_sources enable row level security;
alter table public.avatar_documents enable row level security;
alter table public.avatar_client_conversations enable row level security;
alter table public.avatar_client_memories enable row level security;
alter table public.avatar_launch_checklists enable row level security;
alter table public.avatar_analytics_daily enable row level security;

create index if not exists orders_conversation_id_idx
  on public.orders(conversation_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatar-voice-samples', 'avatar-voice-samples', false, 5242880,
  array['audio/mpeg', 'audio/mp4', 'audio/wav', 'audio/webm'])
on conflict (id) do update set
  public = false,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
