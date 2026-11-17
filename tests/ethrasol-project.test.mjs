import test from 'node:test';
import assert from 'node:assert/strict';
import {authenticateEthrasol,projectContent,normalizeProject} from '../app/lib/ethrasol-project.js';
test('Analisi progetto richiede identità reale, convalidata sul database Ethrasol',async()=>{
  await assert.rejects(authenticateEthrasol(new Request('https://example.test')),e=>e.status===401);
  const req=new Request('https://example.test',{headers:{Authorization:'Bearer '+ 'a'.repeat(45)}});
  let calls=0;const userId='b0726cfc-e162-45df-bd35-8f9a01443f6e';
  assert.equal(await authenticateEthrasol(req,async(url,options)=>{assert.match(url,/ambsotujefpcpxtmmqon/);assert.match(options.headers.Authorization,/Bearer/);return Response.json(calls++===0?{id:userId}:[{id:userId,active:true}]);}),userId);
  calls=0;await assert.rejects(authenticateEthrasol(req,async()=>Response.json(calls++===0?{id:userId}:[{active:false}])),e=>e.status===403);
});
test('File alterati, eccessivi o non supportati vengono rifiutati prima dell’AI',()=>{
  assert.throws(()=>projectContent({file:{type:'application/pdf',data:Buffer.from('malicious').toString('base64')}}));
  assert.throws(()=>projectContent({text:'x'.repeat(60001)}));
  assert.equal(projectContent({text:'4 pannelli, 1 inverter'})[0].type,'input_text');
  assert.equal(projectContent({file:{type:'application/pdf',name:'progetto.pdf',data:Buffer.from('%PDF-1.4 test').toString('base64')}})[0].type,'input_file');
});
test('Analisi con quantità incerte rimane una bozza senza prezzi',()=>{
  const d=normalizeProject({title:'Progetto',items:[{description:'Pannello',quantity:-2,price:100,unit:'pz'}],questions:['Quanti pannelli?']});
  assert.equal(d.items[0].quantity,null);assert.equal(d.items[0].price,undefined);assert.equal(d.questions.length,1);
});
