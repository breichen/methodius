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
  {slug: "Abnehmen dank Muskelabbau", erstellt: "2026-08-30"},
  {slug: "Die Kunst, beschäftigt auszusehen", erstellt: ""},
  {slug: "Freunde verlieren leicht gemacht", erstellt: ""},
  {slug: "Glücklich werden durch niedrigere Erwartungen", erstellt: ""},
  {slug: "In 12 einfachen Schritten zum US-Präsidenten", erstellt: ""},
  {slug: "KI (gar nicht) sicher nutzen", erstellt: ""},
  {slug: "Smalltalk für Fortgeschrittene", erstellt: ""},
  {slug: "Stress reduzieren durch Faulheit", erstellt: ""},
  {slug: "Intelligent werden mit KI", erstellt: ""},
  {slug: "Muskelkater ohne Training", erstellt: ""},
  {slug: "Erfolgreich werden ohne Leistung", erstellt: ""},
  {slug: "Aluhüte im Alltag richtig verwenden", erstellt: ""},
  {slug: "Warum beim Nachbarn das Gras immer viel grüner ist", erstellt: ""},
  {slug: "Termine vermeiden leicht gemacht", erstellt: ""},
  {slug: "Moderne Kunst interpretieren", erstellt: ""},
  {slug: "Experte werden durch selbstbewusstes Auftreten", erstellt: ""},  
  {slug: "Wir haben das sicherste Passwort", erstellt: ""},
  {slug: "Ratgeber schreiben mit KI", erstellt: ""},
  {slug: "Freunde finden in Dating-Portalen", erstellt: ""},
  {slug: "Warum ein Passwort für alles reicht", erstellt: ""},
  {slug: "Meetings überleben ohne Expertise", erstellt: ""},
  {slug: "Das perfekte Leben auf Social Media", erstellt: ""},  
  {slug: "Politische Bildung durch soziale Medien", erstellt: ""},
  {slug: "Wie man zuverlässig unzuverlässig wird", erstellt: ""},
  {slug: "Pünktlichkeit verbessern durch Zugausfälle", erstellt: ""},
  {slug: "Warum ich heute leider keine Zeit habe", erstellt: ""},
  {slug: "Vom Millionär zum Tellerwäscher in nur 7 Tagen", erstellt: ""},
  {slug: "So wirst du zum modernen Künstler", erstellt: ""},
  {slug: "Gedanken lesen durch geschicktes Raten", erstellt: ""},
  {slug: "Statistiken fälschen leicht gemacht", erstellt: ""},
  {slug: "Zum Influencer in nur 2 Stunden", erstellt: ""},
  {slug: "Der perfekte Körper dank geschickter Beleuchtung", erstellt: ""},
  {slug: "Die Kunst, am Monatsanfang schon pleite zu sein", erstellt: ""},  
  {slug: "So beweist man, dass die globale Erwärmung erfunden ist", erstellt: ""},
  {slug: "Sicherheit beim Bewerbungsgespräch trotz Mangel an Fachwissen", erstellt: ""},
  {slug: "Diskussionen gewinnen durch konsequentes Dagegenreden", erstellt: ""},

  {slug: "Warum das Leben leichter ist, wenn man nichts versteht", erstellt: ""},
  {slug: "Plötzlich Privatdetektiv - Völlig unverdächtige Leute observieren", erstellt: ""},
  {slug: "Wie man aus Junk-Food Gourmet-Menüs bastelt", erstellt: ""},
  {slug: "Zugausfälle als Chance nutzen", erstellt: ""},
  {slug: "Unsinn mit wissenschaftlichen Diagrammen belegen", erstellt: ""},
  {slug: "Permanente Enttäuschung dank zu hoch gesteckter Ziele", erstellt: ""},
  {slug: "Befördert werden ohne Qualifikation", erstellt: ""},
  {slug: "Verwendung von KI durch Fehler vertuschen", erstellt: ""},
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
