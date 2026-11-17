"use client";
import { useState } from "react";
import "../client-area/customer.css";
export default function ClientLogin(){
 const[error,setError]=useState(""),[loading,setLoading]=useState(false);
 async function submit(event){event.preventDefault();setLoading(true);setError("");const form=new FormData(event.currentTarget);try{const response=await fetch("/api/client-session",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({email:form.get("email"),password:form.get("password")})});const data=await response.json();if(!response.ok)throw new Error(data.error||"Accesso non riuscito.");location.href="/client-area";}catch(e){setError(e.message||"Connessione non disponibile.");}finally{setLoading(false);}}
 return <main className="a1-customer a1-auth"><form onSubmit={submit}><a href="/" className="a1-customer-logo">AvatarOne</a><p className="a1-customer-kicker">AREA CLIENTI</p><h1>Il tuo avatar,<br/>i tuoi contenuti.</h1><p>Accedi con la password impostata attraverso l’invito personale di NDA.</p><label>Email<input name="email" type="email" autoComplete="username" required/></label><label>Password<input name="password" type="password" autoComplete="current-password" required/></label>{error?<p className="a1-customer-error" role="alert">{error}</p>:null}<button disabled={loading}>{loading?"Accesso…":"Entra nella tua area"}</button><a href="https://wa.me/393457980259?text=Ho%20bisogno%20di%20un%20nuovo%20invito%20AvatarOne" target="_blank" rel="noreferrer">Password dimenticata o primo accesso? Richiedi un invito</a></form></main>;
}
