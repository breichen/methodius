/*
  Liste aller Ratgeber.

  Zwei Schreibweisen sind möglich:

  1) Einfacher Text, wenn Dateiname und Anzeige-Titel identisch sind:
       "Mein Buchtitel"
     -> erwartet Dateien pics/ratgeber/Mein Buchtitel.png und
     md/ratgeber/Mein Buchtitel.md

  2) Objekt, wenn sich Dateiname (slug) und Anzeige-Titel (titel)
     unterscheiden sollen, z.B. für einen kürzeren/saubereren Dateinamen:
       { slug: "mein-buch", titel: "Mein ausführlicher Buchtitel!" }
     -> erwartet Dateien pics/ratgeber/mein-buch.png und
    md/ratgeber/mein-buch.md
     "titel" ist dabei optional - fehlt er, wird einfach "slug" als
     Anzeige-Titel verwendet (wie bei der einfachen Text-Schreibweise
     oben):
       { slug: "mein-buch", erstellt: "12. März 2026" }
     -> Anzeige-Titel wird "mein-buch"

  Optional lässt sich bei der Objekt-Schreibweise zusätzlich "erstellt",
  "aktualisiert" und/oder "einsender" angeben (einfache Strings, z.B.
  "12. März 2026" - das Format ist frei wählbar, es wird 1:1 auf der
  Buch-Seite angezeigt):
       { slug: "mein-buch", titel: "Mein Buch", erstellt: "12. März 2026" }
       { slug: "mein-buch", titel: "Mein Buch", erstellt: "12. März 2026", aktualisiert: "3. April 2026" }
       { slug: "mein-buch", titel: "Mein Buch", erstellt: "12. März 2026", einsender: "Max Mustermann" }
     Ist "erstellt" gesetzt, erscheint oben auf der Buch-Seite
     "Veröffentlicht: ...". Ist zusätzlich (oder auch nur) "aktualisiert"
     gesetzt, erscheint "Aktualisiert: ..." darunter. Ist "einsender"
     gesetzt, erscheint zusätzlich ganz oben (über "Veröffentlicht: ...")
     die Zeile "Vorgeschlagen von: ...". Alle drei Angaben sind komplett
     optional und werden weggelassen, wenn nicht vorhanden.

  Neue Bücher fügst du einfach am ENDE der Liste hinzu –
  "Neueste Ratgeber" zeigt automatisch die letzten Einträge.
*/
const ratgeberRohdaten = [
  {slug: "Abnehmen dank Muskelabbau"},
  /*"Die Kunst, beschäftigt auszusehen",
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
  "Politische Bildung durch soziale Medien",
  "Wie man zuverlässig unzuverlässig wird",*/  
  //"Pünktlichkeit verbessern durch Zugausfälle",
  //"Warum ich heute leider keine Zeit habe",
  //"Vom Millionär zum Tellerwäscher in nur 7 Tagen",
  //"So wirst du zum modernen Künstler",
  //"Gedanken lesen durch geschicktes Raten",
  //"Statistiken fälschen leicht gemacht",
  //"Zum Influencer in 2 Stunden",
  //"Der perfekte Körper dank geschickter Beleuchtung",
  //"Die Kunst, am Monatsanfang schon pleite zu sein",
  
  //"Warum das Leben leichter ist, wenn man nichts versteht",
  //"Plötzlich Privatdetektiv - Völlig unverdächtige Leute observieren",
  //"Zugausfälle als Chance nutzen",
];

// Wandelt die Rohdaten oben in einheitliche { slug, titel, ... }-Objekte
// um, damit buchgrid.js und buch.js sich um nichts Zusätzliches kümmern
// müssen. Objekt-Einträge (inkl. optionalem "erstellt"/"aktualisiert"/
// "einsender") werden dabei unverändert durchgereicht - fehlt "titel",
// wird "slug" als Anzeige-Titel verwendet.
const ratgeberListe = ratgeberRohdaten.map(eintrag =>
  typeof eintrag === "string"
    ? { slug: eintrag, titel: eintrag }
    : { ...eintrag, titel: eintrag.titel || eintrag.slug }
);
