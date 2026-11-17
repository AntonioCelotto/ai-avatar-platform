-- Transactional integration checks: all fixtures and changes are rolled back.
begin;
do $$
declare a uuid; b uuid; f text; w jsonb; result jsonb; rev bigint; n integer;
begin
 insert into public.avatar_clients(slug,company_name,avatar_name,notes) values('workspace-test-'||gen_random_uuid(),'Workspace test','Test','Informazioni iniziali') returning id into a;
 insert into public.avatar_clients(slug,company_name,avatar_name) values('workspace-other-'||gen_random_uuid(),'Other test','Other') returning id into b;
 insert into public.avatar_client_knowledge_sources(client_id,source_type,title,content,status) values(a,'text','Prezzi','Carbonara 10 euro','active');
 insert into public.avatar_client_knowledge_sources(client_id,source_type,title,content,status) values(b,'text','Privato','Dato altro cliente','active');
 f:=public.a1_knowledge_fingerprint(a);
 w:=public.a1_save_workspace(a,0,f,'[{"id":"menu","type":"text","title":"Menu","url":"","content":"Carbonara 12 euro","metadata":{}}]');
 assert (select content='Carbonara 10 euro' from public.avatar_client_knowledge_sources where client_id=a and status='active'),'Draft affected live knowledge';
 begin
  perform public.a1_save_workspace(a,0,f,'[]');raise exception 'Stale revision accepted';
 exception when raise_exception then if sqlerrm<>'WORKSPACE_CONFLICT' then raise;end if;end;
 result:=public.a1_publish_workspace(a,(w->>'revision')::bigint);
 assert (select count(*)=1 and min(content)='Carbonara 12 euro' from public.avatar_client_knowledge_sources where client_id=a and status='active'),'Publish failed';
 assert (select count(*)=1 and min(content)='Dato altro cliente' from public.avatar_client_knowledge_sources where client_id=b and status='active'),'Cross tenant mutation';
 assert (select count(*)=2 from public.avatar_knowledge_releases where client_id=a),'Initial recovery point missing';
 rev:=(result->>'revision')::bigint;f:=result->>'fingerprint';
 select content into w from public.avatar_knowledge_releases where client_id=a and label='Versione precedente';
 result:=public.a1_save_workspace(a,rev,f,w);
 perform public.a1_publish_workspace(a,(result->>'revision')::bigint);
 assert (select min(content)='Carbonara 10 euro' from public.avatar_client_knowledge_sources where client_id=a and status='active'),'Restore failed';
 select revision,base_fingerprint into rev,f from public.avatar_knowledge_workspaces where client_id=a;
 update public.avatar_client_knowledge_sources set content='External update' where client_id=a and status='active';
 begin perform public.a1_publish_workspace(a,rev);raise exception 'External edit overwritten';
 exception when raise_exception then if sqlerrm<>'WORKSPACE_CONFLICT' then raise;end if;end;
 result:=public.a1_reset_workspace(a,rev);
 assert result->>'base_fingerprint'=public.a1_knowledge_fingerprint(a),'Reset fingerprint mismatch';
 assert result->'draft'->0->>'content'='External update','Reset did not read published content';
end;$$;
set local role anon;
do $$begin
 begin perform public.a1_publish_workspace(gen_random_uuid(),0);raise exception 'Anon could publish';exception when insufficient_privilege then null;end;
 begin perform 1 from public.avatar_customer_access limit 1;raise exception 'Anon could read accounts';exception when insufficient_privilege then null;end;
end;$$;
reset role;
set local role authenticated;
do $$begin
 begin perform public.a1_save_workspace(gen_random_uuid(),0,'x','[]');raise exception 'Auth bypassed application authorization';exception when insufficient_privilege then null;end;
end;$$;
reset role;
rollback;
