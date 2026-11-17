-- Additive client workspace. Existing avatars keep their current knowledge until an explicit publish.
create table public.avatar_customer_access (
 user_id uuid not null references auth.users(id) on delete cascade,
 client_id uuid not null references public.avatar_clients(id) on delete cascade,
 email text not null, display_name text not null default '',
 role text not null default 'editor' check(role in ('owner','editor','viewer')),
 active boolean not null default true, created_at timestamptz not null default now(),
 primary key(user_id,client_id)
);
create index avatar_customer_access_client_idx on public.avatar_customer_access(client_id);
create table public.avatar_knowledge_workspaces (
 client_id uuid primary key references public.avatar_clients(id) on delete cascade,
 draft jsonb not null default '[]', revision bigint not null default 0,
 base_fingerprint text not null, updated_at timestamptz not null default now(),
 updated_by uuid references auth.users(id) on delete set null,
 check(jsonb_typeof(draft)='array')
);
create table public.avatar_knowledge_releases (
 id uuid primary key default gen_random_uuid(),
 client_id uuid not null references public.avatar_clients(id) on delete cascade,
 content jsonb not null, created_at timestamptz not null default now(),
 created_by uuid references auth.users(id) on delete set null,
 label text not null default 'Pubblicazione', check(jsonb_typeof(content)='array')
);
create index avatar_knowledge_releases_client_idx on public.avatar_knowledge_releases(client_id,created_at desc);
alter table public.avatar_customer_access enable row level security;
alter table public.avatar_knowledge_workspaces enable row level security;
alter table public.avatar_knowledge_releases enable row level security;
revoke all on public.avatar_customer_access,public.avatar_knowledge_workspaces,public.avatar_knowledge_releases from public,anon,authenticated;
grant all on public.avatar_customer_access,public.avatar_knowledge_workspaces,public.avatar_knowledge_releases to service_role;

create function public.a1_knowledge_fingerprint(p_client uuid) returns text language sql stable security invoker set search_path=public,pg_temp as $$
 select md5(coalesce(jsonb_agg(jsonb_build_object('id',id,'type',source_type,'title',title,'url',source_url,'content',content,'metadata',metadata) order by id)::text,'[]'))
 from public.avatar_client_knowledge_sources where client_id=p_client and status='active';
$$;
create function public.a1_save_workspace(p_client uuid,p_revision bigint,p_fingerprint text,p_draft jsonb,p_actor uuid default null) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w public.avatar_knowledge_workspaces;
begin
 if jsonb_typeof(p_draft) <> 'array' or jsonb_array_length(p_draft)>50 or length(p_draft::text)>600000 then raise exception 'INVALID_DRAFT'; end if;
 insert into public.avatar_knowledge_workspaces(client_id,draft,base_fingerprint) values(p_client,'[]',p_fingerprint) on conflict do nothing;
 select * into w from public.avatar_knowledge_workspaces where client_id=p_client for update;
 if w.revision<>p_revision or public.a1_knowledge_fingerprint(p_client)<>p_fingerprint or (w.revision>0 and w.base_fingerprint<>p_fingerprint) then raise exception 'WORKSPACE_CONFLICT'; end if;
 update public.avatar_knowledge_workspaces set draft=p_draft,revision=revision+1,updated_at=now(),updated_by=p_actor where client_id=p_client returning * into w;
 return to_jsonb(w);
end;$$;
create function public.a1_publish_workspace(p_client uuid,p_revision bigint,p_actor uuid default null) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w public.avatar_knowledge_workspaces; item jsonb; previous jsonb; release_id uuid;
begin
 select * into w from public.avatar_knowledge_workspaces where client_id=p_client for update;
 if not found or w.revision<>p_revision then raise exception 'WORKSPACE_CONFLICT'; end if;
 if public.a1_knowledge_fingerprint(p_client)<>w.base_fingerprint then raise exception 'WORKSPACE_CONFLICT'; end if;
 if jsonb_array_length(w.draft)=0 then raise exception 'EMPTY_DRAFT'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id::text,'type',source_type,'title',title,'url',coalesce(source_url,''),'content',content,'metadata',metadata) order by created_at),'[]') into previous from public.avatar_client_knowledge_sources where client_id=p_client and status='active';
 -- Keep an initial recovery point, including initial avatar notes if no sources existed.
 if not exists(select 1 from public.avatar_knowledge_releases where client_id=p_client) then
  if jsonb_array_length(previous)=0 then
   select case when coalesce(notes,'')<>'' then jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'type','text','title','Conoscenza iniziale','url','','content',notes,'metadata','{}'::jsonb)) else '[]'::jsonb end into previous from public.avatar_clients where id=p_client;
  end if;
  insert into public.avatar_knowledge_releases(client_id,content,created_by,label) values(p_client,previous,p_actor,'Versione precedente');
 end if;
 update public.avatar_client_knowledge_sources set status='archived',updated_at=now() where client_id=p_client and status='active';
 for item in select value from jsonb_array_elements(w.draft) loop
  insert into public.avatar_client_knowledge_sources(client_id,source_type,title,source_url,content,status,metadata)
  values(p_client,item->>'type',item->>'title',nullif(item->>'url',''),item->>'content','active',coalesce(item->'metadata','{}') || jsonb_build_object('workspaceItemId',item->>'id'));
 end loop;
 insert into public.avatar_knowledge_releases(client_id,content,created_by) values(p_client,w.draft,p_actor) returning id into release_id;
 update public.avatar_knowledge_workspaces set base_fingerprint=public.a1_knowledge_fingerprint(p_client),revision=revision+1,updated_at=now(),updated_by=p_actor where client_id=p_client returning * into w;
 return jsonb_build_object('revision',w.revision,'fingerprint',w.base_fingerprint,'releaseId',release_id);
end;$$;
revoke all on function public.a1_knowledge_fingerprint(uuid),public.a1_save_workspace(uuid,bigint,text,jsonb,uuid),public.a1_publish_workspace(uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function public.a1_knowledge_fingerprint(uuid),public.a1_save_workspace(uuid,bigint,text,jsonb,uuid),public.a1_publish_workspace(uuid,bigint,uuid) to service_role;
