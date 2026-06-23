const categories = [
  {
    name: "Ricordi dell'infanzia",
    prompts: [
      "Mi racconti un ricordo bello della tua infanzia?",
      "Dove giocavi quando eri piccolo?",
      "Qual era il tuo gioco preferito?",
      "Ti ricordi il primo giorno di scuola?",
      "Com'era la tua aula di scuola?",
      "Chi era il tuo maestro o la tua maestra preferita?",
      "Quale merenda ti piaceva di piu'?",
      "Che profumo ti ricorda casa da bambino?",
      "Quale festa aspettavi con piu' gioia?",
      "Chi ti raccontava le storie?"
    ]
  },
  {
    name: "Famiglia e affetti",
    prompts: [
      "Mi racconti qualcosa della tua famiglia?",
      "Chi ti ha dato un consiglio importante?",
      "Quale persona ricordi con piu' tenerezza?",
      "Com'erano i pranzi della domenica?",
      "Qual era una tradizione della tua famiglia?",
      "Chi cucinava meglio in casa?",
      "Quale frase dicevano spesso i tuoi genitori?",
      "C'e' una storia di famiglia che ami raccontare?",
      "Chi era la persona piu' allegra della famiglia?",
      "Quale ricordo ti scalda il cuore?"
    ]
  },
  {
    name: "Cucina e tradizioni",
    prompts: [
      "Qual era il tuo piatto preferito?",
      "Che cosa si preparava nei giorni di festa?",
      "Mi racconti una ricetta di famiglia?",
      "Quale profumo di cucina ti piace di piu'?",
      "Chi preparava il sugo migliore?",
      "Preferisci pasta, riso o minestra?",
      "Quale dolce ti ricorda l'infanzia?",
      "Qual era il piatto della domenica?",
      "Che cosa non mancava mai sulla tavola?",
      "Quale sapore ti rende felice?"
    ]
  },
  {
    name: "Musica, cinema e spettacolo",
    prompts: [
      "Quale canzone ti emoziona ancora oggi?",
      "Chi era il tuo cantante preferito?",
      "Ti piaceva ballare?",
      "Ricordi il primo film visto al cinema?",
      "Quale attore ti piaceva molto?",
      "Quale programma televisivo guardavi volentieri?",
      "Ti piace cantare?",
      "Che musica ascoltavi da giovane?",
      "Quale canzone ti ricorda una persona cara?",
      "Se potessimo ascoltare una canzone, quale sceglieresti?"
    ]
  },
  {
    name: "Viaggi e luoghi",
    prompts: [
      "Qual e' il viaggio piu' bello che hai fatto?",
      "Preferisci mare, montagna o campagna?",
      "Quale citta' ti e' rimasta nel cuore?",
      "Ti piacerebbe tornare in un luogo speciale?",
      "Com'erano le vacanze quando eri giovane?",
      "Con chi viaggiavi piu' spesso?",
      "Quale paesaggio ricordi meglio?",
      "Ti piaceva prendere il treno?",
      "Quale luogo ti fa sentire a casa?",
      "Dove vorresti andare con la fantasia?"
    ]
  },
  {
    name: "Natura e animali",
    prompts: [
      "Ti piacciono gli animali?",
      "Hai mai avuto un cane o un gatto?",
      "Quale animale ti fa simpatia?",
      "Preferisci fiori o alberi?",
      "Quale fiore ti piace di piu'?",
      "Ti piaceva curare l'orto?",
      "Che profumo ha la primavera per te?",
      "Quale stagione preferisci?",
      "Ti piace ascoltare la pioggia?",
      "Quale paesaggio ti rende sereno?"
    ]
  },
  {
    name: "Giochi di memoria semplici",
    prompts: [
      "Ti va di nominare tre colori?",
      "Proviamo a ricordare tre parole: casa, pane, fiore.",
      "Quale mese viene dopo maggio?",
      "Quale giorno viene prima di domenica?",
      "Nomina tre animali domestici.",
      "Nomina tre frutti rossi.",
      "Conta lentamente da uno a dieci.",
      "Prova a dire cinque citta' italiane.",
      "Quale stagione viene dopo l'estate?",
      "Ricordi le tre parole di prima?"
    ]
  },
  {
    name: "Indovinelli e curiosita'",
    prompts: [
      "Vuoi un indovinello facile?",
      "Cosa ha le lancette ma non cuce?",
      "Cosa sale e non scende mai?",
      "Quale mese ha 28 giorni?",
      "Cosa si rompe senza essere toccato?",
      "Vuoi una curiosita' sugli animali?",
      "Sai perche' il cielo sembra azzurro?",
      "Vuoi sapere una curiosita' sull'Italia?",
      "Cosa ha le chiavi ma non apre porte?",
      "Vuoi un proverbio e il suo significato?"
    ]
  },
  {
    name: "Benessere e compagnia",
    prompts: [
      "Come ti senti oggi?",
      "Ti va di fare due chiacchiere?",
      "Raccontami qualcosa della tua giornata.",
      "C'e' qualcosa che ti ha fatto sorridere oggi?",
      "Vuoi parlare di un bel ricordo?",
      "Sono qui con te, senza fretta.",
      "Ti va di respirare lentamente insieme?",
      "Quale piccola cosa ti fa stare bene?",
      "Vuoi che ti racconti una storia tranquilla?",
      "Scegli tu: ricordo, gioco o curiosita'?"
    ]
  }
];

const variants = [
  "Falla come domanda dolce e breve.",
  "Chiedi un piccolo dettaglio in piu'.",
  "Usala per iniziare una conversazione serena.",
  "Usala dopo un momento di silenzio.",
  "Usala se la persona sembra avere voglia di raccontare.",
  "Usala come attivita' leggera di gruppo."
];

export const francescaLibrary = categories.flatMap((category) =>
  category.prompts.flatMap((prompt) =>
    variants.map((variant) => ({
      category: category.name,
      prompt,
      variant
    }))
  )
);

export function getFrancescaLibraryContext(limit = 80) {
  const selected = francescaLibrary.slice(0, limit);
  const lines = selected.map(
    (item, index) => `${index + 1}. [${item.category}] ${item.prompt} ${item.variant}`
  );

  return [
    `Libreria Francesca: ${francescaLibrary.length} tracce conversazionali disponibili.`,
    "Categorie: ricordi, famiglia, cucina, musica, viaggi, natura, giochi di memoria, indovinelli, curiosita', benessere e compagnia.",
    "Usa queste tracce come ispirazione, non come elenco da leggere. Fai una domanda alla volta.",
    ...lines
  ].join("\n");
}
