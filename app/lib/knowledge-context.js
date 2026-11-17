// New workspace publications opt in; legacy avatars retain their existing context exactly.
export function knowledgeContext(sources,question='',limit=14000){
 const words=[...new Set(question.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().match(/[a-z0-9]{3,}/g)||[])];
 const chunks=sources.flatMap((s,index)=>{
 const text=String(s.content||'');const parts=[];for(let offset=0;offset<text.length;offset+=1000)parts.push(text.slice(Math.max(0,offset-100),offset+1000));
 return parts.map((part,i)=>{const normalized=part.normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();const title=String(s.title||'').toLowerCase();return {text:`FONTE: ${s.title||'Informazioni aziendali'}\n${part}`,score:words.reduce((sum,word)=>sum+(normalized.includes(word)?1:0)+(title.includes(word)?2:0),0),order:index*10000+i};});
 });
 chunks.sort((a,b)=>b.score-a.score||a.order-b.order);
 let result='';for(const chunk of chunks){if(result.length+chunk.text.length>limit)continue;result+=`${result?'\n\n':''}${chunk.text}`;}return result.slice(0,limit);
}
