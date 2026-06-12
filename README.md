# ai-avatar-platform

Piattaforma multi-cliente per assistenti AI con avatar, voce e knowledge base dedicata. Il primo caso reale e' l'avatar AI di New Digital App, pensato per essere poi replicato su clienti diversi.

## Stack

- Next.js su Vercel
- Supabase per clienti, avatar, documenti, fonti, conversazioni e richieste
- OpenAI Responses API via REST per generazione risposte
- WhatsApp link precompilato per richieste e contatti

## Setup locale

1. Avvia:

```bash
npm run dev
```

App locale:

```text
http://localhost:3000/
```

## Variabili ambiente

```text
OPENAI_API_KEY=
OPENAI_MODEL=gpt-5.2
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
WHATSAPP_ORDER_PHONE=393457980259
```

Non inserire mai `SUPABASE_SERVICE_ROLE_KEY` o `OPENAI_API_KEY` nel frontend.

## Nota tecnica

Il progetto usa Next.js per rendere affidabili sia le pagine sia le API route su Vercel.

Endpoint di controllo sicuro:

```text
/api/health
```

Mostra solo se le variabili ambiente sono presenti, senza esporre valori segreti.

## Supabase

La migrazione iniziale si trova in:

```text
supabase/migrations/001_initial_multi_tenant_schema.sql
```

Il modello dati e' multi-tenant: ogni cliente ha configurazione avatar, fonti di apprendimento, conversazioni e richieste separate.
