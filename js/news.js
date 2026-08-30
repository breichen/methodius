/*
  Liste aller News-Beiträge.

  Jeder Eintrag besteht aus:
  - datei: Dateiname unter md/news/
  - titel: Überschrift des Beitrags
  - datum: angezeigtes Datum
  - bild: optionaler Bildpfad; wird am Ende des Beitrags angezeigt
  - link: optionaler Link, z.B. zu einem neuen Ratgeber
  - linkText: optionaler Text für den Link
*/

const newsListe = [

  {
    datei: "neuer-ratgeber-muskelabbau.md",
    titel: "Neuer Ratgeber erschienen",
    datum: "30. August 2026",
    bild: "pics/ratgeber/Abnehmen dank Muskelabbau.png",
    link: "buch.html?titel=Abnehmen dank Muskelabbau",
    linkText: "Zum Ratgeber"
  },

  {
    datei: "neuer-fall-ans-bett-gebunden.md",
    titel: "Neue Fallakte angelegt",
    datum: "27. August 2026",
    link: "problem.html?datei=ans-bett-gebunden.md",
    linkText: "Zur Fallakte"
  },

  {
    datei: "gruendung-methodius-institut.md",
    titel: "Methodius-Institut für Lebenswissenschaften gegründet",
    datum: "4. Mai 2026",
    bild: "pics/news/gruendung-methodius-institut.jpg"
  },

];