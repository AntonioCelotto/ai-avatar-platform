# ai-avatar-platform

Piattaforma multi-cliente per assistenti AI con avatar, voce e knowledge base dedicata. Il primo MVP e' orientato ai ristoranti: menu, allergeni, consigli, raccolta ordine e invio riepilogo via WhatsApp.

## Stack

- Static web app + Vercel Serverless Function
- Supabase per clienti, ristoranti, menu, documenti e conversazioni
- OpenAI Responses API via REST per generazione risposte
- WhatsApp link precompilato per MVP ordini

## Setup locale

1. Avvia:

```bash
npm run dev
```

Demo locale:

```text
http://localhost:3000/demo/trattoria-demo/
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

La prima base e' zero dependency per evitare blocchi di installazione npm e rendere il deploy Vercel immediato. Quando il repository sara' collegato e il registry sara' disponibile, potremo migrare a Next.js mantenendo schema dati e flusso prodotto.

## Supabase

La migrazione iniziale si trova in:

```text
supabase/migrations/001_initial_multi_tenant_schema.sql
```

Il modello dati e' multi-tenant: ogni ristorante/cliente ha configurazione, fonti, voci menu, conversazioni e ordini separati.
