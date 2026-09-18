const NewsKategorie = Object.freeze({
  VEROEFFENTLICHUNGEN: "Veröffentlichungen",
  INSTITUTSLEBEN: "Institutsleben",
  KURIOSITAETEN: "Kuriositäten des Alltags",
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
];

// Fallakten-Einträge kommen automatisch aus problemeListe (probleme.js,
// muss vor dieser Datei geladen sein - siehe erzeugeProblemNews unten).

// Ratgeber-Einträge kommen automatisch aus ratgeberListe (ratgeber.js,
// muss vor dieser Datei geladen sein - siehe erzeugeRatgeberNews unten).

// Institutsleben- und Kuriositäten-Einträge liegen jeweils in einer
// eigenen JSON-Datei (siehe data/institutsleben.json und
// data/kuriositaeten.json) und werden in ladeAlleNews() dazugeladen.




// Erzeugt aus der Veröffentlichungsliste automatisch einen News-Eintrag
// pro Paper. Für die Ankündigung wird die Paper-Datei selbst unter
// md/news-papers/<paper.datei> verwendet, falls sie existiert -
// andernfalls der generische Text md/news/neues-paper-generisch.md.
async function erzeugePaperNews(veroeffentlichungen) {

  return Promise.all(veroeffentlichungen.map(async paper => {

    const path = `news-papers/${paper.slug}.md`;
    const eigeneDatei = `md/${path}`;
    const hatEigeneDatei = await dateiExistiert(eigeneDatei);

    return {
      datei: hatEigeneDatei
        ? `../${path}`
        : "neues-paper-generisch.md",
      titel: `Neues Paper: ${paper.titel}`,
      datum: paper.datum,
      link: "veroeffentlichungen.html",
      linkText: "Zur Veröffentlichung",
      kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
    };

  }));

}

// Prüft per HEAD-Request, ob unter dem gegebenen Pfad eine Datei
// existiert (z.B. um pro Paper/Ratgeber eine eigene Ankündigungsdatei
// zu verwenden, falls vorhanden).
async function dateiExistiert(pfad) {
  try {
    const response = await fetch(pfad, { method: "HEAD" });
    return response.ok;
  } catch {
    return false;
  }
}

// Erzeugt aus ratgeberListe (ratgeber.js) automatisch einen News-Eintrag
// pro Buch. Nur Bücher mit gesetztem "erstellt" tauchen auf (ohne
// Datum kein Erscheinungsdatum für die News). Erwartet ein Mockup-Bild
// unter pics/ratgeber-mockup/<slug>.png. Für die Ankündigung wird eine
// eigene Datei unter md/news-ratgeber/<slug>.md verwendet, falls sie
// existiert - andernfalls der generische Text
// md/news/neuer-ratgeber-generisch.md.
async function erzeugeRatgeberNews(ratgeberListe) {

  const relevante = ratgeberListe.filter(ratgeber => ratgeber.erstellt);

  return Promise.all(relevante.map(async ratgeber => {

    const eigeneDatei = `md/news-ratgeber/${ratgeber.slug}.md`;
    const hatEigeneDatei = await dateiExistiert(eigeneDatei);

    return {
      datei: hatEigeneDatei
        ? `../news-ratgeber/${ratgeber.slug}.md`
        : "neuer-ratgeber-generisch.md",
      titel: `Neuer Ratgeber: ${ratgeber.titel}`,
      datum: ratgeber.erstellt,
      bild: `pics/ratgeber-mockup/${ratgeber.slug}.png`,
      link: `buch.html?titel=${ratgeber.titel}`,
      linkText: "Zum Ratgeber",
      kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
    };

  }));

}

// Erzeugt aus problemeListe (probleme.js) automatisch einen News-Eintrag
// pro Fallakte. Nur Fallakten mit gesetztem "erstellt" tauchen auf
// (ohne Datum kein Erscheinungsdatum für die News). Für die Ankündigung
// wird eine eigene Datei unter md/news-probleme/<slug>.md verwendet,
// falls sie existiert - andernfalls der generische Text
// md/news/neue-fallakte-generisch.md.
async function erzeugeProblemNews(problemeListe) {

  const relevante = problemeListe.filter(problem => problem.erstellt);

  return Promise.all(relevante.map(async problem => {

    const eigeneDatei = `md/news-probleme/${problem.slug}.md`;
    const hatEigeneDatei = await dateiExistiert(eigeneDatei);

    return {
      datei: hatEigeneDatei
        ? `../news-probleme/${problem.slug}.md`
        : "neue-fallakte-generisch.md",
      titel: `Neue Fallakte: ${problem.titel}`,
      datum: problem.erstellt,
      link: `problem.html?slug=${problem.slug}`,
      linkText: "Zur Fallakte",
      kategorie: NewsKategorie.VEROEFFENTLICHUNGEN,
    };

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
    await erzeugePaperNews(veroeffentlichungen);

  const ratgeberNews =
    await erzeugeRatgeberNews(ratgeberListe);

  const problemNews =
    await erzeugeProblemNews(problemeListe);

  const [institutslebenNews, kuriositaetenNews] = await Promise.all([
    ladeJsonNews("data/institutsleben.json", NewsKategorie.INSTITUTSLEBEN, "news-institutsleben"),
    ladeJsonNews("data/kuriositaeten.json", NewsKategorie.KURIOSITAETEN, "news-kuriositaeten"),
  ]);

  return [
    ...newsListe,
    ...paperNews,
    ...ratgeberNews,
    ...problemNews,
    ...institutslebenNews,
    ...kuriositaetenNews,
  ];

}