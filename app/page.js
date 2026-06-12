import Link from "next/link";

export default function Home() {
  return (
    <main className="home">
      <div className="home__inner">
        <span className="eyebrow">AI Avatar Platform</span>
        <h1>Assistenti AI parlanti per clienti locali.</h1>
        <p>
          Una piattaforma multi-cliente per creare avatar AI addestrati su menu,
          documenti e siti dei clienti. Il primo MVP e&apos; dedicato ai ristoranti.
        </p>
        <Link className="primary-link" href="/demo/trattoria-demo">
          Apri demo ristorante
        </Link>
      </div>
    </main>
  );
}
