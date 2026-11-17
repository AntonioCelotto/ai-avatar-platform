import test from "node:test";
import assert from "node:assert/strict";
import { searchProducts,getProduct,publicProduct,safeImage } from "../app/lib/ethrasol-catalog.js";
import { ethrasolResponse } from "../app/lib/ethrasol-chat.js";

const id = "b0726cfc-e162-45df-bd35-8f9a01443f6e";
const row = {id,name:"Inverter AFORE",code:"A1",active:true,reference_price:0,quote_only:true,image_url:"/catalog/test.svg",purchase_price:42,commission:20};
test("Catalog API selects only public fields, sanitizes filters, and excludes inactive rows",async()=>{
  const products=await searchProducts('AFORE,)(id.neq.null* --',"",async(url,options)=>{
    assert.equal(url.origin,"https://ambsotujefpcpxtmmqon.supabase.co");
    assert.equal(url.searchParams.get("active"),"eq.true");
    assert.doesNotMatch(url.searchParams.get("select"),/purchase|commission|\*/);
    assert.ok(!options.headers.Authorization);
    assert.doesNotMatch(url.searchParams.get("and") || url.searchParams.get("or"),/\)\(|--/);
    return Response.json([row]);
  });
  assert.equal(products[0].price,null);
  assert.equal(products[0].image,"https://ethrasol.it/catalog/test.svg");
  assert.equal(products[0].purchase_price,undefined);
});
test("Brand and product type are combined instead of returning unrelated brands",async()=>{
  await searchProducts("inverter AFORE","",async(url)=>{
    assert.match(url.searchParams.get("and"),/inverter/);
    assert.match(url.searchParams.get("and"),/afore/);
    assert.equal(url.searchParams.get("or"),null);
    return Response.json([]);
  });
});
test("Invalid ids never reach database; safe images and zero prices",async()=>{
  assert.equal(await getProduct("id)or=(active.eq.false)",()=>{throw Error("must not fetch")}),null);
  assert.equal(safeImage("javascript:alert(1)"),"");
  assert.equal(publicProduct({...row,reference_price:100,quote_only:false}).price,100);
  assert.equal(publicProduct(row).quoteOnly,true);
});
test("AI search tool reads actual catalogue and emits product panel",async()=>{
  let ai=0;
  const result=await ethrasolResponse({messages:[{role:"user",content:"Mostra AFORE"}],instructions:"Italiano",context:null,fetchImpl:async(url,options)=>{
    if(String(url).startsWith("https://api.openai.com")) {
      const body=JSON.parse(options.body);
      assert.equal(body.store,false);
      if(ai++===0)return Response.json({output:[{type:"function_call",name:"search_products",call_id:"call_1",arguments:'{"query":"AFORE"}'}]});
      const output=body.input.find(x=>x.type==="function_call_output");
      assert.equal(JSON.parse(output.output).products[0].id,id);
      return Response.json({output_text:"Ecco gli inverter AFORE.",output:[]});
    }
    return Response.json([row]);
  }});
  assert.equal(result.presentation.type,"products");assert.equal(result.presentation.products[0].id,id);
});
test("AI product opening handles contextual second item; failures cannot emit fake cards",async()=>{
  for(const fail of [false,true]) {
    let ai=0;
    const result=await ethrasolResponse({messages:[{role:"user",content:"Apri il secondo"}],instructions:"Italiano",context:{productIds:[id,id]},fetchImpl:async(url,options)=>{
      if(String(url).startsWith("https://api.openai.com")) {
        if(ai++===0)return Response.json({output:[{type:"function_call",name:"show_product",call_id:"call_2",arguments:JSON.stringify({id})}]});
        const body=JSON.parse(options.body),output=JSON.parse(body.input.find(x=>x.type==="function_call_output").output);
        assert.equal(output.ok,!fail);
        return Response.json({output_text:fail?"Catalogo non disponibile":"Ecco la scheda.",output:[]});
      }
      return fail ? new Response("failure",{status:503}) : Response.json([row]);
    }});
    assert.equal(result.presentation?.type || null,fail?null:"product");
  }
});
test("A multi-product search leaves its results visible until the user chooses",async()=>{
  let ai=0,reads=0;
  const result=await ethrasolResponse({messages:[{role:"user",content:"Mostra i risultati FOX ESS"}],instructions:"Italiano",fetchImpl:async(url,options)=>{
    if(String(url).startsWith("https://api.openai.com")) {
      const round=ai++;
      if(round===0)return Response.json({output:[{type:"function_call",name:"search_products",call_id:"search",arguments:'{"query":"FOX ESS"}'}]});
      if(round===1)return Response.json({output:[{type:"function_call",name:"show_product",call_id:"show",arguments:JSON.stringify({id})}]});
      const last=JSON.parse(JSON.parse(options.body).input.at(-1).output);
      assert.equal(last.ok,false);
      return Response.json({output_text:"Ecco i risultati. Quale vuoi vedere?",output:[]});
    }
    reads++;
    return Response.json([row,{...row,id:"c0726cfc-e162-45df-bd35-8f9a01443f6e",name:"Secondo articolo"}]);
  }});
  assert.equal(result.presentation.type,"products");assert.equal(result.presentation.products.length,2);assert.equal(reads,1);
});
