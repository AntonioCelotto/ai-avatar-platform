import test from 'node:test';
import assert from 'node:assert/strict';
process.env.SUPABASE_URL='https://test.invalid';process.env.SUPABASE_SERVICE_ROLE_KEY='test-service-key';process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-anon';process.env.DASHBOARD_UPLOAD_PIN='test-pin-only';
const {validateDraft,menuText,publicAddress,importPublicWebsite}=await import('../app/lib/customer-knowledge.js');
const {knowledgeContext}=await import('../app/lib/knowledge-context.js');
const {createAdminToken}=await import('../app/lib/admin-auth.js');
const knowledge=await import('../app/api/client-knowledge/route.js');
const accessRoute=await import('../app/api/client-access/route.js');
const activation=await import('../app/api/client-activation/route.js');
const clientA='11111111-1111-4111-8111-111111111111',clientB='22222222-2222-4222-8222-222222222222';
let role='editor',active=true,reads=[],writes=[];
const source={id:'s1',type:'text',title:'Menu',url:'',content:'Carbonara 12 euro.',metadata:{}};
global.fetch=async(input,options={})=>{
 const url=String(input);reads.push(url);if(options.method&&options.method!=='GET')writes.push({url,body:options.body});
 if(url.includes('/auth/v1/user'))return Response.json({id:'test-user',email:'test@example.invalid'});
 if(url.includes('/avatar_customer_access?'))return Response.json(active?[{user_id:'test-user',client_id:clientA,role,active:true}]:[]);
 if(url.includes('/customer_profiles?'))return Response.json([]);
 if(url.includes('/avatar_clients?slug=eq.')){const slug=new URL(url).searchParams.get('slug');return Response.json([{id:slug==='eq.client-a'?clientA:clientB,slug:slug.slice(3),company_name:'Test',avatar_name:'Test',status:'active'}]);}
 if(url.includes('/avatar_knowledge_workspaces?'))return Response.json([{revision:1,base_fingerprint:'fingerprint',draft:[source]}]);
 if(url.includes('/avatar_client_knowledge_sources?'))return Response.json([{id:'s1',source_type:'text',title:'Menu',content:source.content,metadata:{}}]);
 if(url.includes('/avatar_knowledge_releases?'))return Response.json([]);
 if(url.includes('/rpc/a1_knowledge_fingerprint'))return Response.json('fingerprint');
 if(url.includes('/rpc/a1_save_workspace'))return Response.json({revision:2,base_fingerprint:'fingerprint'});
 throw new Error(`Unexpected fetch ${url}`);
};
const request=(slug,action,extra={},origin='https://www.avatarone.it')=>new Request('https://www.avatarone.it/api/client-knowledge',{method:'POST',headers:{Origin:origin,Cookie:'avatarone_client_session=test-token','Content-Type':'application/json','x-forwarded-for':crypto.randomUUID()},body:JSON.stringify({slug,action,...extra})});
test('customer may read assigned avatar but cannot read another customer',async()=>{
 role='editor';active=true;let r=await knowledge.GET(new Request('https://www.avatarone.it/api/client-knowledge?client=client-a',{headers:{Cookie:'avatarone_client_session=test-token'}}));assert.equal(r.status,200);assert.equal((await r.json()).client.id,clientA);
 reads=[];r=await knowledge.GET(new Request('https://www.avatarone.it/api/client-knowledge?client=client-b',{headers:{Cookie:'avatarone_client_session=test-token'}}));assert.equal(r.status,403);assert.equal(reads.some(u=>u.includes('avatar_knowledge_workspaces')),false);
});
test('viewer and revoked customer cannot save; foreign origins cannot mutate',async()=>{
 writes=[];role='viewer';assert.equal((await knowledge.POST(request('client-a','save',{draft:[source]}))).status,403);assert.equal(writes.some(w=>w.url.includes('a1_save_workspace')),false);
 role='editor';active=false;assert.equal((await knowledge.POST(request('client-a','save',{draft:[source]}))).status,403);
 active=true;assert.equal((await knowledge.POST(request('client-a','save',{draft:[source]},'https://evil.invalid'))).status,403);
});
test('saving editor draft uses server-assigned client id and does not publish',async()=>{
 writes=[];const r=await knowledge.POST(request('client-a','save',{clientId:clientB,draft:[source],revision:1,fingerprint:'fingerprint'}));assert.equal(r.status,200);const calls=writes.filter(w=>w.url.includes('/rpc/'));assert.equal(calls.length,1);assert.equal(JSON.parse(calls[0].body).p_client,clientA);assert.equal(calls[0].url.includes('save'),true);
});
test('publishing requires explicit confirmation',async()=>{writes=[];assert.equal((await knowledge.POST(request('client-a','publish',{revision:1}))).status,400);assert.equal(writes.some(w=>w.url.includes('a1_publish')),false);});
test('invitations are inaccessible to customers and unauthenticated users',async()=>{assert.equal((await accessRoute.GET(new Request('https://www.avatarone.it/api/client-access',{headers:{Cookie:'avatarone_client_session=test-token'}}))).status,401);});
test('invalid activation link or weak password cannot create a session',async()=>{const r=await activation.POST(new Request('https://www.avatarone.it/api/client-activation',{method:'POST',headers:{Origin:'https://www.avatarone.it','Content-Type':'application/json'},body:JSON.stringify({token_hash:'invalid',type:'invite',password:'short'})}));assert.equal(r.status,400);assert.equal(r.headers.has('set-cookie'),false);});
test('menu values are validated and content generated from structured fields',()=>{
 const menu=[{name:'Carbonara',price:'12,50',available:false,allergens:'uova, latte'}];assert.match(menuText(menu),/€12.50/);assert.match(menuText(menu),/NON DISPONIBILE/);assert.throws(()=>menuText([{name:'A',price:'-5'}]));
 const draft=validateDraft([{...source,content:'Wrong price',metadata:{menu}}]);assert.match(draft[0].content,/12.50/);assert.throws(()=>validateDraft([source,source]));
});
test('website import rejects local, mapped, private and redirectable internal addresses',async()=>{
 for(const ip of ['127.0.0.1','10.1.2.3','169.254.169.254','192.168.1.1','100.64.0.1','::1','::ffff:127.0.0.1','fc00::1'])assert.equal(Boolean(publicAddress(ip)),false,ip);
 assert.equal(publicAddress('8.8.8.8'),true);await assert.rejects(importPublicWebsite('http://127.0.0.1'));
});
test('question context can retrieve a dish from the end of a long document',()=>{
 const text='Informazioni generiche. '.repeat(1800)+'\nCarbonara €12.50 NON DISPONIBILE';const context=knowledgeContext([{title:'Menu',content:text}],'Quanto costa la carbonara?');assert.match(context,/Carbonara €12.50/);assert.ok(context.length<=14000);
});
test('admin generates a personal invite without sending email and assigns the selected avatar',async()=>{
 const previous=global.fetch;const called=[];
 global.fetch=async(input,options={})=>{const u=String(input);called.push(u);if(u.includes('/auth/v1/admin/generate_link'))return Response.json({id:'test-user',email:'test@example.invalid',hashed_token:'personal-hash',verification_type:'invite',action_link:'https://test.invalid/auth/v1/verify'});if(u.includes('/avatar_customer_access?')&&options.method==='POST')return new Response(null,{status:201});return previous(input,options);};
 try{const r=await accessRoute.POST(new Request('https://www.avatarone.it/api/client-access',{method:'POST',headers:{Origin:'https://www.avatarone.it',Cookie:`avatarone_admin=${createAdminToken()}`,'Content-Type':'application/json'},body:JSON.stringify({slug:'client-a',email:'test@example.invalid',name:'Test',role:'editor'})}));const d=await r.json();assert.equal(r.status,200,JSON.stringify({d,called}));assert.match(d.url,/client-activate#token_hash=personal-hash/);assert.equal(called.some(u=>u.includes('/invite')||u.includes('/recover')),false);}finally{global.fetch=previous;}
});
test('valid activation verifies token, sets password and issues an HttpOnly session',async()=>{
 const previous=global.fetch;const calls=[];
 const token=['eyJhbGciOiJIUzI1NiJ9',Buffer.from(JSON.stringify({sub:'test-user',exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})).toString('base64url'),'signature'].join('.');
 global.fetch=async(input,options={})=>{const u=String(input);calls.push({u,method:options.method});if(u.includes('/auth/v1/verify'))return Response.json({access_token:token,refresh_token:'refresh',expires_in:3600,token_type:'bearer',user:{id:'test-user',email:'test@example.invalid'}});if(u.includes('/auth/v1/user')&&options.method==='PUT')return Response.json({id:'test-user',email:'test@example.invalid'});return previous(input,options);};
 try{active=true;role='editor';const r=await activation.POST(new Request('https://www.avatarone.it/api/client-activation',{method:'POST',headers:{Origin:'https://www.avatarone.it','Content-Type':'application/json','x-forwarded-for':'activation-test'},body:JSON.stringify({token_hash:'personal-hash',type:'invite',password:'Test-only-password-12345'})}));assert.equal(r.status,200,JSON.stringify(await r.clone().json()));assert.match(r.headers.get('set-cookie'),/HttpOnly; Secure; SameSite=Lax/);assert.ok(calls.some(c=>c.u.includes('/user')&&c.method==='PUT'));}finally{global.fetch=previous;}
});
test('legacy knowledge stays byte-for-byte compatible until workspace publication',async()=>{
 const {getAvatarKnowledgeText}=await import('../app/lib/supabase-server.js');const previous=global.fetch;const rows=Array.from({length:16},(_,i)=>({title:`Source ${i}`,content:`Text ${i} `.repeat(20),metadata:{}}));
 global.fetch=async()=>Response.json(rows);
 try{assert.equal(await getAvatarKnowledgeText(clientA,'unrelated question'),rows.slice(0,12).map(r=>r.content.trim()).join('\n\n').slice(0,14000));}finally{global.fetch=previous;}
});
