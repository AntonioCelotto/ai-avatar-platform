"use client";

import { useEffect, useRef, useState } from "react";
import CustomAvatar from "./custom-avatar";
import { CATEGORIES, ETHRASOL_URL } from "../../lib/ethrasol-catalog";
import styles from "./ethrasol-experience.module.css";

const money = value => new Intl.NumberFormat("it-IT",{style:"currency",currency:"EUR"}).format(value);
function ProductImage({product,large=false}) {
  const [failed,setFailed] = useState(false);
  useEffect(() => setFailed(false),[product.image]);
  return product.image && !failed ? <img className={large ? styles.heroImage : styles.productImage} src={product.image} alt={product.name} onError={() => setFailed(true)} /> : <div className={large ? styles.heroPlaceholder : styles.placeholder} aria-label="Foto non disponibile"><span>ETHRASOL</span><small>Immagine non disponibile</small></div>;
}
export default function EthrasolExperience({slug,initialAvatar,embedded=false}) {
  const [ethrasolToken,setEthrasolToken]=useState("");
  const [networkId,setNetworkId]=useState(null);
  const [hostOrigin,setHostOrigin]=useState("");
  const [draftItems,setDraftItems]=useState([]);
  const [products,setProducts] = useState([]);
  const [selected,setSelected] = useState(null);
  const [section,setSection] = useState("products");
  const [query,setQuery] = useState("");
  const [category,setCategory] = useState("");
  const [loading,setLoading] = useState(true);
  const [error,setError] = useState("");
  const [resultLabel,setResultLabel] = useState("Una selezione dal catalogo");
  const generation = useRef(0);
  const panelRef = useRef(null);
  useEffect(()=>{
    if(!embedded)return;
    const receive=event=>{
      if(event.source!==window.parent||!["https://ethrasol.it","https://www.ethrasol.it"].includes(event.origin))return;
      if(event.data?.type==="ETHRASOL_HOST_READY"){
        setHostOrigin(event.origin);window.parent.postMessage({type:"ESMERALDA_READY"},event.origin);
      }
      if(event.data?.type==="ETHRASOL_AUTH_CONTEXT"&&typeof event.data.token==='string'&&/^[A-Za-z0-9_.-]{40,8000}$/.test(event.data.token)){setEthrasolToken(event.data.token);setNetworkId(event.data.networkId||null);}
      if(event.data?.type==="ETHRASOL_DRAFT_CONTEXT"&&Array.isArray(event.data.items))setDraftItems(event.data.items.slice(0,40));
    };
    window.addEventListener("message",receive);return()=>window.removeEventListener("message",receive);
  },[embedded]);
  function hostAction(type,values={}){if(hostOrigin)window.parent.postMessage({type,...values},hostOrigin);}

  async function search(q=query,cat=category) {
    const current = ++generation.current;
    setLoading(true);setError("");setSelected(null);setSection("products");
    try {
      const params = new URLSearchParams({q,category:cat});
      const response = await fetch(`/api/ethrasol/catalog?${params}`,{cache:"no-store"});
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      if (current !== generation.current) return;
      setProducts(data.products || []);
      setResultLabel(q ? `Risultati per “${q}”` : cat || "Una selezione dal catalogo");
    } catch(e) { if (current === generation.current) {setError(e.message || "Catalogo non disponibile");setProducts([]);} }
    finally { if (current === generation.current) setLoading(false); }
  }
  useEffect(() => {search("","");return () => {generation.current++;};},[]);

  function present(data) {
    generation.current++;
    setLoading(false);setError("");
    if(data.type==="draft_item"&&data.product?.id){
      if(hostOrigin)hostAction("ESMERALDA_ADD_PRODUCT",{productId:data.product.id,quantity:data.quantity});
      else {setSection("quote");setSelected(data.product);}
    } else if (data.type === "products" && Array.isArray(data.products)) {
      setSection("products");setSelected(null);setProducts(data.products);setQuery(data.query || "");setCategory("");
      setResultLabel(data.query ? `Risultati per “${data.query}”` : "Una selezione dal catalogo");
    } else if (data.type === "product" && data.product?.id) {
      setSection("products");setSelected(data.product);
    } else if (["quote","portal","avatarone"].includes(data.type)) {setSelected(null);setSection(data.type);}
    if (window.matchMedia("(max-width: 860px)").matches) panelRef.current?.scrollIntoView({behavior:"smooth",block:"start"});
  }

  return <div className={`${styles.experience} ${embedded?styles.embedded:""}`}>
    {!embedded&&<header className={styles.header}><a href={ETHRASOL_URL} target="_blank" rel="noreferrer" className={styles.brand}>ETHRASOL<span>Entra nel nuovo sole</span></a><span className={styles.headerLabel}>Esmeralda · La tua assistente digitale</span><a href={ETHRASOL_URL} target="_blank" rel="noreferrer" className={styles.portalLink}>Accedi al gestionale ↗</a></header>}
    <div className={styles.layout}>
      <div className={`ethra-avatar-column ${styles.avatarColumn}`}>
        <CustomAvatar slug={slug} initialAvatar={{...initialAvatar,suggestions:["Mostrami i pannelli fotovoltaici","Cerco una batteria","Come richiedo un preventivo?"]}} experienceMode initialImmersive={false} onPresentation={present} ethrasolToken={ethrasolToken} catalogContext={{networkId,productIds:products.map(p=>p.id),selectedId:selected?.id || "",embedded:Boolean(hostOrigin),draftItems}} />
      </div>
      <section className={styles.panel} ref={panelRef} aria-label="Informazioni e prodotti Ethrasol" aria-busy={loading}>
        <nav className={styles.tabs} aria-label="Sezioni"><button aria-pressed={section==="products"} onClick={()=>{setSection("products");setSelected(null);}}>Prodotti</button><button aria-pressed={section==="quote"} onClick={()=>{setSection("quote");setSelected(null);}}>Preventivi</button><button aria-pressed={section==="portal"} onClick={()=>{setSection("portal");setSelected(null);}}>Il gestionale</button><button aria-pressed={section==="avatarone"} onClick={()=>{setSection("avatarone");setSelected(null);}}>AvatarOne</button></nav>
        {embedded?<div className={styles.projectActions}><button className={styles.primary} disabled={!hostOrigin} onClick={()=>hostAction("ESMERALDA_ATTACH")}>＋ Allega progetto</button><button className={styles.secondary} disabled={!hostOrigin} onClick={()=>hostAction("ESMERALDA_OPEN_DRAFT")}>Apri bozza richiesta ({draftItems.length})</button></div>:<p className={styles.note}><a href={`${ETHRASOL_URL}&pagina=esmeralda`} target="_blank" rel="noreferrer">Hai un progetto? Allegalo nell'area Esmeralda del gestionale ↗</a></p>}
        {section === "products" && !selected && <>
          <div className={styles.heading}><span className={styles.eyebrow}>IL CATALOGO ETHRASOL</span><h1>Troviamo quello che cerchi.</h1><p>Chiedi a Esmeralda oppure cerca un articolo per nome, marca o codice.</p></div>
          <form className={styles.search} onSubmit={e=>{e.preventDefault();search();}}><input aria-label="Cerca nel catalogo" value={query} placeholder="Es. inverter, batteria, AFORE…" onChange={e=>setQuery(e.target.value)}/><button type="submit" disabled={loading}>Cerca</button></form>
          <label className={styles.category}>Categoria<select value={category} onChange={e=>{setCategory(e.target.value);search(query,e.target.value);}}><option value="">Tutte le categorie</option>{CATEGORIES.map(c=><option key={c}>{c}</option>)}</select></label>
          <div className={styles.resultsLabel} role="status">{loading ? "Sto consultando il catalogo…" : error || `${resultLabel} · ${products.length} articoli mostrati`}</div>
          {error && <button className={styles.secondary} onClick={()=>search()}>Riprova</button>}
          {!loading && !error && !products.length && <div className={styles.empty}>Nessun articolo trovato. Prova una marca o un codice diverso.</div>}
          {!loading && !error && <div className={styles.grid}>{products.map((product,index)=><button className={styles.card} key={product.id} onClick={()=>setSelected(product)} aria-label={`Apri prodotto ${index+1}: ${product.name}`}><div className={styles.imageWrap}><ProductImage product={product}/><span className={styles.number}>{index+1}</span></div><div className={styles.cardBody}><span className={styles.eyebrow}>{product.brand || product.category}</span><h2>{product.name}</h2><p>{product.subcategory || product.category}</p><div className={styles.cardBottom}><strong>{product.price === null ? "Prezzo su richiesta" : money(product.price)}</strong><span>Vedi scheda ↗</span></div></div></button>)}</div>}
          <p className={styles.note}>Dati aggiornati dal catalogo Ethrasol. La presenza nel catalogo non garantisce disponibilità a magazzino. Gli eventuali prezzi sono indicativi.</p>
        </>}
        {section === "products" && selected && <article className={styles.detail}>
          <button className={styles.back} onClick={()=>setSelected(null)}>← Torna ai risultati</button>
          <ProductImage key={selected.id} product={selected} large/>
          <span className={styles.eyebrow}>{selected.brand || selected.category}</span><h1>{selected.name}</h1><p className={styles.detailCategory}>{selected.category}{selected.subcategory ? ` / ${selected.subcategory}` : ""}</p>
          <dl className={styles.specs}><div><dt>Codice articolo</dt><dd>{selected.code}</dd></div>{selected.manufacturerCode && <div><dt>Codice produttore</dt><dd>{selected.manufacturerCode}</dd></div>}{selected.unit && <div><dt>Unità</dt><dd>{selected.unit}</dd></div>}<div><dt>Prezzo indicativo</dt><dd>{selected.price === null ? "Su richiesta" : money(selected.price)}</dd></div></dl>
          <p className={styles.description}>{selected.description || "Per maggiori dettagli tecnici, richiedi informazioni al team Ethrasol."}</p>
          {hostOrigin&&<button className={styles.primary} onClick={()=>hostAction("ESMERALDA_ADD_PRODUCT",{productId:selected.id,quantity:1})}>＋ Aggiungi alla bozza richiesta</button>}
          <button className={styles.secondary} onClick={()=>hostOrigin?hostAction("ESMERALDA_OPEN_DRAFT"):setSection("quote")}>Come richiedere un preventivo</button><p className={styles.note}>Puoi chiedere a Esmeralda informazioni su questa scheda. Prezzo e disponibilità da confermare nel preventivo.</p>
        </article>}
        {section === "quote" && <article className={styles.info}><span className={styles.eyebrow}>DALL'IDEA AL PREVENTIVO</span><h1>La tua richiesta, al team giusto.</h1><p>Nel gestionale puoi selezionare i prodotti e preparare una richiesta di preventivo.</p>{selected && <div className={styles.chosen}>Articolo che stai consultando: <strong>{selected.name}</strong><small>Codice {selected.code}</small></div>}<ol><li>Accedi o registrati su Ethrasol.</li><li>Cerca il prodotto nel catalogo e aggiungilo alla richiesta.</li><li>Indica quantità, esigenze e gli eventuali allegati tecnici.</li><li>Invia la richiesta dal gestionale e segui l'avanzamento dalla tua area.</li></ol><a className={styles.primary} href={ETHRASOL_URL} target="_blank" rel="noreferrer">Apri il gestionale ↗</a><p className={styles.note}>La conversazione con Esmeralda non invia una richiesta. La selezione mostrata qui non viene trasferita automaticamente al carrello.</p></article>}
        {section === "portal" && <article className={styles.info}><span className={styles.eyebrow}>LA TUA AREA ETHRASOL</span><h1>Tutto sotto controllo.</h1><p>Dal gestionale puoi consultare catalogo, richieste, preventivi, ordini e le sezioni previste dal tuo profilo.</p><div className={styles.infoBox}><h2>Le tue informazioni sono riservate</h2><p>Per consultare pratiche, documenti e dati personali entra nella tua area con il tuo account. Esmeralda in questa pagina consulta il catalogo pubblico e ti guida nell'utilizzo.</p></div><a className={styles.primary} href={ETHRASOL_URL} target="_blank" rel="noreferrer">Accedi a Ethrasol ↗</a></article>}
        {section === "avatarone" && <article className={styles.info}><span className={styles.eyebrow}>LA TECNOLOGIA DI ESMERALDA</span><h1>Conoscenza, voce e interazione.</h1><p>AvatarOne è la piattaforma che dà voce e volto a Esmeralda. Con Experience, l'avatar utilizza video di attesa e parlato e può collegarsi tramite API alle informazioni aziendali.</p><div className={styles.infoBox}><h2>Tre soluzioni</h2><p>Smart: avatar con immagine statica.<br/>Connect: conversazione, WhatsApp e form.<br/>Experience: video e integrazioni con i sistemi aziendali.</p></div><a className={styles.primary} href="https://www.avatarone.it" target="_blank" rel="noreferrer">Scopri AvatarOne ↗</a></article>}
      </section>
    </div>
  </div>;
}

