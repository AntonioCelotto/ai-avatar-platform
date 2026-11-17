create function public.a1_reset_workspace(p_client uuid,p_revision bigint,p_actor uuid default null) returns jsonb language plpgsql security invoker set search_path=public,pg_temp as $$
declare w public.avatar_knowledge_workspaces; sources jsonb; fingerprint text;
begin
 select * into w from public.avatar_knowledge_workspaces where client_id=p_client for update;
 if not found or w.revision<>p_revision then raise exception 'WORKSPACE_CONFLICT'; end if;
 select coalesce(jsonb_agg(jsonb_build_object('id',id,'type',source_type,'title',title,'url',source_url,'content',content,'metadata',metadata) order by id),'[]') into sources
 from public.avatar_client_knowledge_sources where client_id=p_client and status='active';
 fingerprint:=md5(sources::text);
 if jsonb_array_length(sources)=0 then
  select case when coalesce(notes,'')<>'' then jsonb_build_array(jsonb_build_object('id',gen_random_uuid()::text,'type','text','title','Conoscenza iniziale','url','','content',notes,'metadata','{}'::jsonb)) else '[]'::jsonb end into sources from public.avatar_clients where id=p_client;
 end if;
 update public.avatar_knowledge_workspaces set draft=sources,base_fingerprint=fingerprint,revision=revision+1,updated_at=now(),updated_by=p_actor where client_id=p_client returning * into w;
 return to_jsonb(w);
end;$$;
revoke all on function public.a1_reset_workspace(uuid,bigint,uuid) from public,anon,authenticated;
grant execute on function public.a1_reset_workspace(uuid,bigint,uuid) to service_role;
