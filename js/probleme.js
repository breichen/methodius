/*
  Liste aller Fallakten.

  Zwei Schreibweisen sind möglich (analog zu ratgeberListe, siehe
  js/ratgeber.js):

  1) Einfacher Text, wenn Dateiname (slug) und Anzeige-Titel
     identisch sind:
       "Mein Falltitel"
     -> erwartet Datei md/probleme/Mein Falltitel.md
     ACHTUNG: ohne "erstellt" wird diese Fallakte NIRGENDS angezeigt
     (siehe unten) - die einfache Schreibweise eignet sich daher nur
     für schnelle Entwürfe, nicht für veröffentlichte Fallakten.

  2) Objekt, wenn sich Dateiname (slug) und Anzeige-Titel (titel)
     unterscheiden sollen, z.B. für einen kürzeren/saubereren
     Dateinamen:
       { slug: "mein-fall", titel: "Mein ausführlicher Falltitel!" }
     -> erwartet Datei md/probleme/mein-fall.md
     "titel" ist dabei optional - fehlt er, wird "slug" als
     Anzeige-Titel verwendet (wie bei der einfachen Text-Schreibweise
     oben).

  Zusätzlich lässt sich bei der Objekt-Schreibweise "erstellt" und
  optional "aktualisiert" angeben (ISO-Format YYYY-MM-DD):
       { slug: "mein-fall", titel: "Mein Fall", erstellt: "2026-08-27" }
       { slug: "mein-fall", titel: "Mein Fall", erstellt: "2026-08-27", aktualisiert: "2026-09-01" }
     Nur Fallakten mit einem "erstellt"-Datum, das bereits erreicht
     ist, werden in den Übersichten (problemgrid.js,
     problemshowcase.js) und auf der Fallakten-Seite selbst
     angezeigt - siehe istDatumErreicht() in js/datumsformat.js.

  "einsender" steht weiterhin in der jeweiligen Markdown-Datei selbst
  (## Einsender), da er inhaltlich zur Fallakte gehört statt zu den
  Metadaten der Liste.

  Die Reihenfolge bestimmt die Fallnummer:

    erster Eintrag  -> Fall Nr. 001
    zweiter Eintrag -> Fall Nr. 002
    usw.

  Neue Fallakten werden am ENDE der Liste ergänzt.

  Die eigentlichen Inhalte (Frage, Diagnose, Behandlung, Begründung,
  Prognose, Einsender) liegen weiterhin als Markdown-Datei unter:

    md/probleme/<slug>.md
*/

const problemeRohdaten = [
  { slug: "ans-bett-gebunden", titel: "Ans Bett gebunden", erstellt: "2026-08-27" },
];

// Wandelt die Rohdaten oben in einheitliche { slug, titel, ... }-Objekte
// um, damit problem.js, problemgrid.js und problemshowcase.js sich um
// nichts Zusätzliches kümmern müssen. Objekt-Einträge (inkl. optionalem
// "erstellt"/"aktualisiert") werden dabei unverändert durchgereicht -
// fehlt "titel", wird "slug" als Anzeige-Titel verwendet.
const problemeListe = problemeRohdaten.map(eintrag =>
  typeof eintrag === "string"
    ? { slug: eintrag, titel: eintrag }
    : { ...eintrag, titel: eintrag.titel || eintrag.slug }
);
