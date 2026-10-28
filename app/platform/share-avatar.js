"use client";
import {useState} from "react";
export default function ShareAvatar({path,name}){
 const [message,setMessage]=useState("");
 const url="https://www.avatarone.it"+path;
 async function copy(){try{await navigator.clipboard.writeText(url);setMessage("Link copiato");}catch{setMessage("Copia il link: "+url);}}
 return <div style={{display:"flex",flexWrap:"wrap",alignItems:"center",gap:8,marginTop:8}}>
 <button type="button" onClick={copy} style={{border:"1px solid #b7c5d0",borderRadius:10,padding:"9px 12px",background:"#fff",color:"#10212b",cursor:"pointer",fontWeight:600}}>📋 Copia link</button>
 <a href={`https://wa.me/?text=${encodeURIComponent("Parla con "+name+": "+url)}`} target="_blank" rel="noreferrer" style={{padding:"9px 12px"}}>Condividi WhatsApp</a>
 <a href={`https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(url)}`} target="_blank" rel="noreferrer" style={{padding:"9px 12px"}}>QR code</a>
 {message?<small role="status" style={{width:"100%"}}>{message}</small>:null}
 </div>;
}
