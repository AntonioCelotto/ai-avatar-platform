import Link from "next/link";
import { getAvatarClientBySlug, isSupabaseConfigured, listAvatarClients, listAvatarDocuments } from "../../lib/supabase-server";
import { configurationChecks, skills } from "../../skills/catalog";
import "./studio.css";

export const metadata = { title: "Skill e integrazioni · AvatarOne Studio", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function SkillsStudio({ searchParams }) {
  const params = await searchParams;
  let clients = [], error = "", selected = null, documents = null;
  if (isSupabaseConfigured()) {
    try { clients = await listAvatarClients(); }
    catch { error = "Non è stato possibile leggere gli avatar. Riprova tra poco."; }
  } else error = "Il collegamento agli avatar non è disponibile in questo ambiente.";
  const requested = typeof params?.client === "string" ? params.client : "";
  const slug = clients.some(client => client.slug === requested) ? requested : clients[0]?.slug;
  if (slug) {
    try { selected = await getAvatarClientBySlug(slug); }
    catch { error = "Non è stato possibile leggere la configurazione dell’avatar selezionato."; }
    if (selected?.id) {
      try { documents = await listAvatarDocuments(selected.id); }
      catch { /* Unknown knowledge state is displayed explicitly below. */ }
    }
  }
  const checks = selected ? configurationChecks(selected) : [];
  const name = selected?.spoken_avatar_name || selected?.avatar_name;
  const readyDocs = documents?.filter(document => document.status === "ready").length || 0;
  const publicPath = selected?.slug === "new-digital-app" ? "/mia" : selected?.slug === "demo-cliente-01" ? "/demo-cliente-01" : `/avatar/${encodeURIComponent(slug || "")}`;
  const integration = slug === "twenty-seven-ethra-sol" ? { name: "Catalogo ETHRASOL", text: "Collegamento dedicato presente nel codice di Esmeralda. Disponibilità e permessi vanno verificati con una prova.", href: "/experience/ethrasol", action: "Apri Esmeralda" } : slug === "giulia-new-digital-app" ? { name: "CUP dimostrativo", text: "Percorso di prenotazione e ticket con dati fittizi. Non è un collegamento a un CUP reale.", href: "/experience/giulia", action: "Apri demo Giulia" } : null;

  return <main className="a1-studio">
    <header className="a1-studio-top"><Link href="/platform" className="a1-studio-brand">AvatarOne <span>Studio</span></Link><Link href="/platform">← Torna alla dashboard</Link></header>
    <section className="a1-studio-heading"><p>SKILL E INTEGRAZIONI</p><h1>Ogni avatar, le sue capacità.</h1><span>Controlla cosa è configurato e prepara i prossimi collegamenti.</span></section>
    <form action="/platform/skills" className="a1-studio-select"><label htmlFor="skill-client">Persona digitale<select name="client" id="skill-client" defaultValue={slug || ""} disabled={!clients.length}>{clients.map(client => <option key={client.slug} value={client.slug}>{client.spoken_avatar_name || client.avatar_name} · {client.company_name}</option>)}</select></label><button disabled={!clients.length} type="submit">Mostra configurazione</button></form>
    {error ? <p className="a1-studio-notice" role="status">{error}</p> : null}
    {selected ? <>
      <section className="a1-studio-avatar"><div><small>{selected.company_name}</small><h2>{name}</h2><p>Pacchetto: <strong>{({smart:"Smart",connect:"Connect",experience:"Experience"})[selected.plan_code] || "Da verificare"}</strong> · Stato: {selected.status === "active" ? "Pubblicato" : selected.status === "paused" ? "In pausa" : "Bozza"}</p></div><Link href={publicPath} target="_blank" rel="noreferrer">Apri e prova l’avatar ↗</Link></section>
      <div className="a1-studio-notice">Questa vista consulta la configurazione. Per dichiarare una funzione operativa serve una prova: voce, video, dati e permessi possono richiedere un controllo.</div>
      <section aria-labelledby="configuration-title"><div className="a1-studio-section-heading"><h2 id="configuration-title">Configurazione presente</h2><Link href="/platform#persone-digitali">Gestisci avatar →</Link></div><div className="a1-studio-checks">{checks.map(check => <article key={check.id}><span className={check.ready ? "a1-state configured" : "a1-state"}>{check.ready ? "Configurato" : "Da configurare"}</span><h3>{check.title}</h3><p>{check.detail}</p></article>)}<article><span className={readyDocs ? "a1-state configured" : "a1-state"}>{documents === null ? "Da verificare" : readyDocs ? "Contenuti presenti" : "Da verificare"}</span><h3>Conoscenza</h3><p>{documents === null ? "Documenti non leggibili in questo momento." : readyDocs ? `${readyDocs} documenti o siti pronti nel Knowledge Center.` : "Nessun documento pronto rilevato. Possono essere presenti note o contenuti iniziali nell’avatar."}</p><Link href={`/platform/knowledge?client=${encodeURIComponent(slug)}`}>Apri Knowledge Center →</Link></article></div></section>
      <section className="a1-studio-integration"><small>COLLEGAMENTI DEDICATI</small><h2>{integration?.name || "Integrazioni da verificare per questo avatar"}</h2><p>{integration?.text || "Non è stato identificato un collegamento dedicato tra quelli riconosciuti da questa vista. Le integrazioni esterne o sviluppate separatamente richiedono una verifica specifica."}</p>{integration ? <Link href={integration.href} target="_blank" rel="noreferrer">{integration.action} ↗</Link> : null}</section>
    </> : null}
    <section aria-labelledby="catalog-title"><div className="a1-studio-section-heading"><h2 id="catalog-title">Catalogo delle capacità</h2><Link href="/#skill" target="_blank">Vedi la presentazione commerciale ↗</Link></div><p className="a1-studio-caption">Le skill su progetto richiedono configurazione, collegamento e collaudo per il singolo cliente.</p><div className="a1-studio-catalog">{skills.map(skill => <article key={skill.id}><small>{skill.group} · {skill.kind === "base" ? "Funzione base" : "Su progetto"}</small><h3>{skill.title}</h3><p>{skill.description}</p><details><summary>Requisiti e collaudo</summary><p>{skill.requires}</p><p><strong>Domanda di prova:</strong> {skill.question}</p></details></article>)}</div></section>
    <section className="a1-studio-test"><h2>Prima di estendere una nuova funzione</h2><ol><li>Preparala su un avatar di prova con i contenuti del cliente.</li><li>Verifica risposte, voce e ritorno all’ascolto su smartphone e sul dispositivo previsto.</li><li>Prova dati mancanti, errori di collegamento e autorizzazioni.</li><li>Per prenotazioni, ordini e altre scritture verifica conferma e risultato nel sistema collegato.</li></ol></section>
  </main>;
}
