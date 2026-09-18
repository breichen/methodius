const NewsKategorie = Object.freeze({
  VEROEFFENTLICHUNGEN: "Veröffentlichungen",
  INSTITUTSLEBEN: "Institutsleben",
  KURIOSItAETEN: "Kuriositäten des Alltags",
});

/*
  Liste aller News-Beiträge.

  Jeder Eintrag besteht aus:
  - datei: Dateiname unter md/news/
  - titel: Überschrift des Beitrags
  - datum: Datum im ISO-Format (YYYY-MM-DD), wird für die Anzeige
    über formatiereDatumDeutsch() (siehe js/datumsformat.js) in die
    deutsche Lesefassung umgewandelt
  - bild: optionaler Bildpfad; wird am Ende des Beitrags angezeigt
  - link: optionaler Link, z.B. zu einem neuen Ratgeber
  - linkText: optionaler Text für den Link
*/

const newsListe = [


  // RATGEBER

  {
    datei: "neuer-ratgeber-muskelabbau.md",
    titel: "Neuer Ratgeber erschienen",
    datum: "2026-08-30",
    bild: "pics/ratgeber-mockup/Abnehmen dank Muskelabbau.png",
    link: "buch.html?titel=Abnehmen dank Muskelabbau",
    linkText: "Zum Ratgeber",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },


  // FALLAKTEN

  {
    datei: "neuer-fall-ans-bett-gebunden.md",
    titel: "Neue Fallakte angelegt",
    datum: "2026-08-27",
    link: "problem.html?datei=ans-bett-gebunden.md",
    linkText: "Zur Fallakte",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  },


];

// Institutsleben- und Kuriositäten-Einträge liegen jeweils in einer
// eigenen JSON-Datei (siehe data/institutsleben.json und
// data/kuriositaeten.json) und werden in ladeAlleNews() dazugeladen.




function erzeugePaperNews(veroeffentlichungen) {
  return veroeffentlichungen.map(paper => ({
    datei: `../news-papers/${paper.datei}`,
    titel: `Neues Paper: ${paper.titel}`,
    datum: paper.datum,
    link: "veroeffentlichungen.html",
    linkText: "Zur Veröffentlichung",
    kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
  }));
}

// Versieht eine Liste roher News-Einträge (ohne kategorie-Feld) mit
// der übergebenen Kategorie. Wird für die ausgelagerten JSON-Dateien
// (Institutsleben, Kuriositäten) verwendet.
function versieheMitKategorie(eintraege, kategorie) {
  return eintraege.map(eintrag => ({
    ...eintrag,
    kategorie,
  }));
}

// ordner: Name des Ordners, der für diese Kategorie sowohl die
// .md-Dateien (unter md/, z.B. "../news-institutsleben") als auch
// die Bilder (unter pics/, z.B. "pics/news-institutsleben") enthält.
// datei und bild müssen in der JSON-Datei selbst nur den reinen
// Dateinamen enthalten - der jeweilige Pfad wird hier ergänzt.
// Optional - ohne Angabe bleiben datei und bild unverändert.
async function ladeJsonNews(pfad, kategorie, ordner) {

  const response = await fetch(pfad);

  if (!response.ok) {
    throw new Error(`News-Datei nicht gefunden: ${pfad}`);
  }

  const eintraege = await response.json();

  const eintraegeMitPfad = ordner
    ? eintraege.map(eintrag => ({
        ...eintrag,
        datei: `../${ordner}/${eintrag.datei}`,
        ...(eintrag.bild && { bild: `pics/${ordner}/${eintrag.bild}` }),
      }))
    : eintraege;

  return versieheMitKategorie(eintraegeMitPfad, kategorie);

}

async function ladeAlleNews() {

  const response =
    await fetch("data/veroeffentlichungen.json");

  if (!response.ok) {
    throw new Error(
      "Veröffentlichungsdatei nicht gefunden"
    );
  }

  const veroeffentlichungen =
    await response.json();

  const paperNews =
    erzeugePaperNews(veroeffentlichungen);

  const [institutslebenNews, kuriositaetenNews] = await Promise.all([
    ladeJsonNews("data/institutsleben.json", NewsKategorie.INSTITUTSLEBEN, "news-institutsleben"),
    ladeJsonNews("data/kuriositaeten.json", NewsKategorie.KURIOSITAETEN, "news-kuriositaeten"),
  ]);

  return [
    ...newsListe,
    ...paperNews,
    ...institutslebenNews,
    ...kuriositaetenNews,
  ];

}