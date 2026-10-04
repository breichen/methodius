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

  {id: 1, slug: "Abnehmen dank Muskelabbau", urlSlug: "abnehmen-dank-muskelabbau", erstellt: "2026-10-02", kategorie: RatgeberKategorie.LEBEN},
  {id: 2, slug: "Freunde verlieren leicht gemacht", urlSlug: "freunde-verlieren", erstellt: "2026-10-04", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 3, slug: "Das perfekte Leben auf Social Media", urlSlug: "perfektes-leben-social-media", lehrgang: "Perfekte Selbstdarstellung in sozialen Medien", erstellt: "", kategorie: RatgeberKategorie.MEDIEN},
  {id: 4, slug: "Die Kunst, beschäftigt auszusehen", urlSlug: "beschaeftigt-aussehen", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 5, slug: "KI (gar nicht) sicher nutzen", urlSlug: "ki-gar-nicht-sicher-nutzen", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 6, slug: "Moderne Kunst interpretieren", urlSlug: "moderne-kunst-interpretieren", erstellt: "", kategorie: RatgeberKategorie.KUNST_KULTUR},
  {id: 7, slug: "Vom Millionär zum Tellerwäscher in nur 7 Tagen", urlSlug: "millionaer-zum-tellerwaescher", lehrgang: "Strategischer finanzieller und sozialer Abstieg", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 8, slug: "In 12 einfachen Schritten zum US-Präsidenten", urlSlug: "us-praesident-in-12-schritten", lehrgang: "Grundlagen des politischen Aufstiegs", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 9, slug: "So wirst du zum modernen Künstler", urlSlug: "moderner-kuenstler-werden", lehrgang: "Grundlagen des modernen Künstlertums", erstellt: "", kategorie: RatgeberKategorie.KUNST_KULTUR},
  {id: 10, slug: "Smalltalk für Fortgeschrittene", urlSlug: "smalltalk-fuer-fortgeschrittene", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 11, slug: "Stress reduzieren durch Faulheit", urlSlug: "stress-reduzieren-durch-faulheit", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 12, slug: "Politische Bildung durch soziale Medien", urlSlug: "politische-bildung-soziale-medien", erstellt: "", kategorie: RatgeberKategorie.MEDIEN},
  {id: 13, slug: "Intelligent werden mit KI", urlSlug: "intelligent-werden-mit-ki", lehrgang: "Intelligenzsteigerung durch künstliche Intelligenz", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 14, slug: "Muskelkater ohne Training", urlSlug: "muskelkater-ohne-training", lehrgang: "Grundlagen des simulierten Muskelkaters", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 15, slug: "Kunstkritiker werden in nur 15 Minuten", urlSlug: "kunstkritiker-in-15-minuten", lehrgang: "Grundlagen der Kunstkritik", erstellt: "", kategorie: RatgeberKategorie.KUNST_KULTUR},
  {id: 16, slug: "Erfolgreich werden ohne Leistung", urlSlug: "erfolg-ohne-leistung", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 17, slug: "Aluhüte im Alltag richtig verwenden", urlSlug: "aluhuete-im-alltag", lehrgang: "Praktische Anwendung von Aluhüten im Alltag", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 18, slug: "Warum beim Nachbarn das Gras immer viel grüner ist", urlSlug: "nachbars-gras-gruener", lehrgang: "Grundlagen des nachbarschaftlichen Grünvergleichs", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 19, slug: "Termine vermeiden leicht gemacht", urlSlug: "termine-vermeiden", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 20, slug: "Zum Influencer in nur 2 Stunden", urlSlug: "influencer-in-2-stunden", lehrgang: "Grundlagen des Influencer-Werdens", erstellt: "", kategorie: RatgeberKategorie.MEDIEN},
  {id: 21, slug: "Wie man jedes Buch als gesellschaftskritisch interpretiert", urlSlug: "buecher-gesellschaftskritisch-interpretieren", lehrgang: "Gesellschaftskritische Buchinterpretation", erstellt: "", kategorie: RatgeberKategorie.KUNST_KULTUR},
  {id: 22, slug: "Experte werden durch selbstbewusstes Auftreten", urlSlug: "experte-durch-selbstbewusstsein", lehrgang: "Autorität durch selbstbewusstes Auftreten", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 23, slug: "Wir haben das sicherste Passwort", urlSlug: "sicherstes-passwort", lehrgang: "Grundlagen maximaler Passwortsicherheit", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 24, slug: "Freunde finden in Dating-Portalen", urlSlug: "freunde-finden-dating-portale", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 25, slug: "Warum ein Passwort für alles reicht", urlSlug: "ein-passwort-fuer-alles", lehrgang: "Die Ein-Passwort-Strategie", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 26, slug: "Glücklich werden durch niedrigere Erwartungen", urlSlug: "gluecklich-durch-niedrige-erwartungen", lehrgang: "Glück durch reduzierte Erwartungen", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 27, slug: "Der perfekte Körper dank geschickter Beleuchtung", urlSlug: "perfekter-koerper-beleuchtung", lehrgang: "Visuelle Optimierung des eigenen Erscheinungsbildes", erstellt: "", kategorie: RatgeberKategorie.MEDIEN},
  {id: 28, slug: "Ratgeber schreiben mit KI", urlSlug: "ratgeber-schreiben-mit-ki", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 29, slug: "Meetings überleben ohne Expertise", urlSlug: "meetings-ueberleben", lehrgang: "Erfolgreiche Teilnahme an Meetings ohne Fachkenntnisse", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 30, slug: "Meisterwerke erkennen am Preisetikett", urlSlug: "meisterwerke-am-preisetikett", lehrgang: "Kunstbewertung anhand des Preisetiketts", erstellt: "", kategorie: RatgeberKategorie.KUNST_KULTUR},
  {id: 31, slug: "Quellenangaben erfinden für Fortgeschrittene", urlSlug: "quellenangaben-erfinden", erstellt: "", kategorie: RatgeberKategorie.MEDIEN},
  {id: 32, slug: "Wie man zuverlässig unzuverlässig wird", urlSlug: "zuverlaessig-unzuverlaessig", lehrgang: "Methoden systematischer Unzuverlässigkeit", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 33, slug: "Gedanken lesen durch geschicktes Raten", urlSlug: "gedanken-lesen-durch-raten", lehrgang: "Grundlagen der Gedankeninterpretation durch Raten", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 34, slug: "Statistiken fälschen leicht gemacht", urlSlug: "statistiken-faelschen", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 35, slug: "Die Kunst, am Monatsanfang schon pleite zu sein", urlSlug: "am-monatsanfang-pleite", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 36, slug: "So beweist man, dass die globale Erwärmung erfunden ist", urlSlug: "erwaermung-erfunden", lehrgang: "Scheinbeweise und alternative Erklärungen zur globalen Erwärmung", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 37, slug: "Pünktlichkeit verbessern durch Zugausfälle", urlSlug: "puenktlichkeit-durch-zugausfaelle", lehrgang: "Pünktlichkeitsverbesserung durch Zugausfälle", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 38, slug: "Diskussionen gewinnen durch konsequentes Dagegenreden", urlSlug: "diskussionen-gewinnen-dagegenreden", lehrgang: "Konfrontative Gesprächsführung", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 39, slug: "Warum das Leben leichter ist, wenn man nichts versteht", urlSlug: "leben-leichter-ohne-verstehen", lehrgang: "Grundlagen der strategischen Unwissenheit", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 40, slug: "Warum ich heute leider keine Zeit habe", urlSlug: "heute-keine-zeit", lehrgang: "Professionelles Zeitvermeidungsmanagement", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 41, slug: "Wie man aus Junk-Food Gourmet-Menüs bastelt", urlSlug: "junkfood-gourmet-menues", lehrgang: "Kulinarische Aufwertung von Junk-Food", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 42, slug: "Sicherheit beim Bewerbungsgespräch trotz Mangel an Fachwissen", urlSlug: "bewerbungsgespraech-ohne-fachwissen", lehrgang: "Souveränes Auftreten ohne Fachkenntnisse", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 43, slug: "Plötzlich Privatdetektiv - Völlig unverdächtige Leute observieren", urlSlug: "privatdetektiv-observieren", lehrgang: "Grundlagen der unauffälligen Personenbeobachtung", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 44, slug: "Zugausfälle als Chance nutzen", urlSlug: "zugausfaelle-als-chance", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 45, slug: "Unsinn mit wissenschaftlichen Diagrammen belegen", urlSlug: "unsinn-mit-diagrammen-belegen", lehrgang: "Wissenschaftliche Diagramme zur Begründung beliebiger Behauptungen", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 46, slug: "Permanente Enttäuschung dank zu hoch gesteckter Ziele", urlSlug: "permanente-enttaeuschung", lehrgang: "Systematische Erzeugung unrealistischer Erwartungen", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 47, slug: "Befördert werden ohne Qualifikation", urlSlug: "befoerdert-ohne-qualifikation", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 48, slug: "Verwendung von KI durch Fehler vertuschen", urlSlug: "ki-durch-fehler-vertuschen", lehrgang: "Gezielte Fehlerproduktion zur Verschleierung von KI-Nutzung", erstellt: "", kategorie: RatgeberKategorie.WISSEN_TECHNIK},
  {id: 49, slug: "Die besten Ausreden für Verspätungen", urlSlug: "ausreden-fuer-verspaetungen", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 50, slug: "Wie man aus einer kleinen Aufgabe ein Großprojekt macht", urlSlug: "aufgabe-zum-grossprojekt", lehrgang: "Systematische Vergrößerung von Aufgabenstellungen", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 51, slug: "Komplimente machen, die garantiert falsch verstanden werden", urlSlug: "komplimente-falsch-verstanden", lehrgang: "Ambivalente Kommunikation und missverständliche Komplimente", erstellt: "", kategorie: RatgeberKategorie.LEBEN},
  {id: 52, slug: "E-Mails schreiben, die niemand beantworten möchte", urlSlug: "emails-ohne-antwort", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 53, slug: "Wie man beim ersten Eindruck einen bleibenden Schaden hinterlässt", urlSlug: "erster-eindruck-schaden", lehrgang: "Strategisches Erzeugen negativer erster Eindrücke", erstellt: "", kategorie: RatgeberKategorie.GESELLSCHAFT},
  {id: 54, slug: "Smalltalk ohne Worte beenden", urlSlug: "smalltalk-ohne-worte-beenden", erstellt: "", kategorie: RatgeberKategorie.ALLTAG_BERUF},
  {id: 55, slug: "Texte kurz und knackig halten", urlSlug: "texte-kurz-und-knackig", erstellt: "", kategorie: RatgeberKategorie.MEDIEN},

];

// Wandelt die Rohdaten oben in einheitliche { slug, titel, ... }-Objekte
// um, damit buchgrid.js und buch.js sich um nichts Zusätzliches kümmern
// müssen. Objekt-Einträge (inkl. optionalem "erstellt"/"aktualisiert"/
// "einsender") werden dabei unverändert durchgereicht - fehlt "titel",
// wird "slug" als Anzeige-Titel verwendet.
const ratgeberListe = ratgeberRohdaten.map(eintrag =>
  typeof eintrag === "string"
    ? { slug: eintrag, titel: eintrag, lehrgang: eintrag }
    : { ...eintrag, titel: eintrag.titel || eintrag.slug,
       lehrgang: eintrag.lehrgang || eintrag.titel || eintrag.slug }
);
