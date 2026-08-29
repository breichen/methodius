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
    datum: "29. August 2026",
    bild: "pics/ratgeber/Abnehmen dank Muskelabbau.png",
    link: "buch.html?titel=Abnehmen dank Muskelabbau",
    linkText: "Zum Ratgeber"
  },
];