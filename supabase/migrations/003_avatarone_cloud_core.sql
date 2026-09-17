alter table public.avatar_clients
  add column if not exists media_mode text not null default 'placeholder',
  add column if not exists liveavatar_avatar_id text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatar-media', 'avatar-media', true, 5242880,
  array['image/jpeg', 'image/png', 'image/webp', 'video/mp4', 'video/webm'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('knowledge-documents', 'knowledge-documents', false, 10485760,
  array['application/pdf'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;
