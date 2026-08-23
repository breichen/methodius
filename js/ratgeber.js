/*
  Liste aller Ratgeber.

  Zwei Schreibweisen sind möglich:

  1) Einfacher Text, wenn Dateiname und Anzeige-Titel identisch sind:
       "Mein Buchtitel"
     -> erwartet Dateien pics/Mein Buchtitel.png und md/Mein Buchtitel.md

  2) Objekt, wenn sich Dateiname (slug) und Anzeige-Titel (titel)
     unterscheiden sollen, z.B. für einen kürzeren/saubereren Dateinamen:
       { slug: "mein-buch", titel: "Mein ausführlicher Buchtitel!" }
     -> erwartet Dateien pics/mein-buch.png und md/mein-buch.md

  Neue Bücher fügst du einfach am ENDE der Liste hinzu –
  "Neueste Ratgeber" zeigt automatisch die letzten Einträge.
*/
const ratgeberRohdaten = [
  "Abnehmen dank Muskelabbau",
  "Die Kunst, beschäftigt auszusehen",
  "Freunde verlieren leicht gemacht",
  "Glücklich werden durch niedrigere Erwartungen",
  "In 12 einfachen Schritten zum US-Präsidenten",
  "KI (gar nicht) sicher nutzen",
  "Smalltalk für Fortgeschrittene",
  "Stress reduzieren durch Faulheit",
  "Intelligent werden mit KI",
  "Muskelkater ohne Training",
  "Erfolgreich werden ohne Leistung",
  "Aluhüte im Alltag richtig verwenden",
  "Warum beim Nachbarn das Gras immer viel grüner ist",
  "Termine vermeiden leicht gemacht",
  "Moderne Kunst interpretieren",
  "Experte werden durch selbstbewusstes Auftreten",  
  "Wir haben das sicherste Passwort",
  "Ratgeber schreiben mit KI",
  "Freunde finden in Dating-Portalen",
  "Warum ein Passwort für alles reicht",
  "Meetings überleben ohne Expertise",
  "Das perfekte Leben auf Social Media",
  
  //"Politische Bildung durch soziale Medien",
  //"Wie man zuverlässig unzuverlässig wird",
  //"Pünktlichkeit verbessern durch Zugausfälle",
  // "Warum ich heute leider keine Zeit habe",
  //"Vom Millionär zum Tellerwäscher in nur 7 Tagen",
  //"Zum modernen Künstler in nur 2 Minuten",
  //"Gedanken lesen durch geschicktes Raten",
  //"Statistiken fälschen leicht gemacht",
  //"So wirst du zum Influencer",
  //"Der perfekte Körper dank geschickter Beleuchtung",
  //"Die Kunst, am Monatsanfang schon pleite zu sein",
  //"Warum das Leben leichter ist, wenn man nichts versteht",
  //"Plötzlich Privatdetektiv - Völlig unverdächtige Leute observieren",
  //"",
];

// Wandelt die Rohdaten oben in einheitliche { slug, titel }-Objekte um,
// damit buchgrid.js und buch.js sich um nichts Zusätzliches kümmern müssen.
const ratgeberListe = ratgeberRohdaten.map(eintrag =>
  typeof eintrag === "string" ? { slug: eintrag, titel: eintrag } : eintrag
);
