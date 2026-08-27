/*
  Liste aller Probleme.

  Ein "Problem" ist eine Frage, die ein Leser eingeschickt hat und die
  Dr. Methodius beantwortet - ähnlich wie ein Ratgeber (siehe
  ratgeber.js), nur kürzer und direkt als Frage-Antwort-Format, statt
  als eigene Markdown-Datei.

  Jeder Eintrag ist ein Objekt mit folgenden Feldern:

    titel        Kurzer Anzeige-Titel des Problems, z.B. "Der ewige
                 Gruppenchat". Wird auf der Übersichtsseite und der
                 Problem-Seite selbst angezeigt. Pflichtfeld.

    frage        Die eigentliche Frage/Schilderung des Lesers, z.B.
                 "Seit drei Jahren schreibt unsere Schulklasse noch
                 immer in derselben Gruppe - wie komme ich da raus,
                 ohne unhöflich zu wirken?". Pflichtfeld.

    diagnose     Kurze, prägnante "Diagnose" des Problems in ein bis
                 zwei Sätzen - der Dreh, den Dr. Methodius der Sache
                 gibt. Pflichtfeld.

    behandlung   Die eigentliche "Behandlung"/der Rat - der Hauptteil
                 der Antwort. Kann auch mehrere Absätze/einfaches
                 Markdown enthalten (z.B. **fett**, Zeilenumbrüche).
                 Pflichtfeld.

    begruendung  Warum genau dieser Rat (angeblich) funktioniert - die
                 (natürlich nicht ernst gemeinte) wissenschaftliche
                 oder pseudo-logische Begründung dahinter. Pflichtfeld.

    prognose     Wie es weitergeht, wenn der Rat befolgt wird - ein
                 kurzer, augenzwinkernder Ausblick. Pflichtfeld.

    erstellt     Optional. Freier String, z.B. "12. März 2026" - wird
                 als "Veröffentlicht: ..." auf der Problem-Seite
                 angezeigt, wenn gesetzt.

    aktualisiert Optional. Freier String, wird als "Aktualisiert: ..."
                 angezeigt, wenn gesetzt (unabhängig von "erstellt").

    einsender    Optional. Name des Lesers, der das Problem
                 eingeschickt hat, z.B. "Max Mustermann". Wird als
                 "Vorgeschlagen von: ..." ganz oben angezeigt, wenn
                 gesetzt (genau wie bei den Ratgebern).

  Neue Probleme fügst du einfach am ENDE der Liste hinzu.
*/
const problemeRohdaten = [
  {
    titel: "Der ewige Gruppenchat",
    frage:
      "Warum kann ich morgens nicht aufstehen?",
    diagnose:
      "Chronische Morgenaktivität",
    behandlung:
      "Stell deinen Wecker künftig auf 11:47 Uhr. Dadurch entfällt die gesellschaftlich völlig unbegründete Erwartung, bereits um 7 Uhr leistungsfähig zu sein.",
    begruendung:
      "Untersuchungen des Methodius-Instituts haben gezeigt, dass Menschen, die um 11:47 Uhr aufstehen, um 11:47 Uhr aufstehen.",
    prognose:
      "Hervorragend. Du wirst zwar weiterhin zu spät kommen, aber wesentlich ausgeschlafener.",
    erstellt: "12. 8 2026",
    einsender: "Horst"
  },
  /*
  {
    titel: "Das Handy immer griffbereit",
    frage: "...",
    diagnose: "...",
    behandlung: "...",
    begruendung: "...",
    prognose: "...",
    erstellt: "...",
    aktualisiert: "...",
    einsender: "...",
  },
  */
];

// Reicht die Rohdaten unverändert durch - anders als bei den
// Ratgebern gibt es hier keine Kurzschreibweise, da jedes Problem
// ohnehin ein vollständiges Objekt mit mehreren Textfeldern ist.
const problemeListe = problemeRohdaten;