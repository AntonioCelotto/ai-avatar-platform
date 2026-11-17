# Esmeralda — integrazione Ethrasol

Solo l'avatar `twenty-seven-ethra-sol` usa la nuova interfaccia. La base è il commit di produzione `b196751` del ramo `feature/experience-studio`, conservando le funzioni degli altri avatar.

## Flusso

La conversazione usa la chiave e il modello OpenAI già configurati su AvatarOne. Gli strumenti server cercano prodotti, aprono una scheda tramite ID verificato nel catalogo o mostrano istruzioni per preventivi, portale e AvatarOne. Le risposte restituiscono `reply` e un oggetto `presentation`, che il client visualizza prima del parlato. I riferimenti ordinali ricevono gli ID degli articoli mostrati e della scheda selezionata.

`GET /api/ethrasol/catalog?q=...&category=...` ricerca articoli attivi; `?id=UUID` legge una scheda. Le letture utilizzano la Data API del database Ethrasol con la sua chiave publishable e le RLS esistenti. Nessuna nuova chiave privilegiata, tabella, policy o modifica dei dati. Le colonne sono esplicitamente elencate e i risultati sono limitati a dodici articoli.

Prezzi nulli, zero o `quote_only` sono presentati come «su richiesta». Immagini relative sono risolte sul dominio Ethrasol; in assenza di foto pubblica si mostra un segnaposto. Le foto in Storage privato non vengono rese pubbliche. L'accesso a ordini, anagrafiche e documenti rimane nel gestionale autenticato. Il collegamento al portale non trasferisce il carrello né invia richieste.

## Verifiche

`node --test tests/ethrasol.test.mjs` copre colonne pubbliche, filtri, ID non validi, prezzi, immagini e ciclo degli strumenti AI con risposte simulate. `npm run build` verifica la compilazione dell'applicazione. Le ricerche dirette sul catalogo ospitato sono state verificate con AFORE, batterie, fotovoltaico e una ricerca senza risultati.

Il collaudo visivo e della conversazione AI reale sull'anteprima protetta richiede accesso autenticato o un link di revisione autorizzato. Non è ancora dichiarato completato. La produzione non è aggiornata.
