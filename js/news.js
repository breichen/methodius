const NewsKategorie = Object.freeze({
  RATGEBER: "Ratgeber",
  FALLAKTEN: "Fallakten",
  ALLTAGSSTUDIEN: "Alltagsstudien",
  PUBLIKATIONEN: "Publikationen",
  INSTITUTSLEBEN: "Institutsleben",
  PERSONAL: "Personal des Monats",
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

// Institutsleben-Einträge kommen aus der JSON-Datei
// data/institutsleben.json und werden in ladeAlleNews() dazugeladen.

// Alltagsstudien-Einträge kommen automatisch aus alltagsstudienListe
// (alltagsstudien.js, muss vor dieser Datei geladen sein).

// Personal-des-Monats-Einträge kommen aus der JSON-Datei
// data/personal-des-monats.json (siehe erzeugePersonalNews unten).


// Erzeugt aus der Veröffentlichungsliste automatisch einen News-Eintrag
// pro Paper. Für die Ankündigung wird die Paper-Datei selbst unter
// md/news-papers/<paper.slug>.md verwendet, falls sie existiert -
// andernfalls der generische Text md/news/neues-paper-generisch.md.
async function erzeugePaperNews(veroeffentlichungen) {

  return Promise.all(veroeffentlichungen.map(async paper => {

    const path = `news-papers/${paper.slug}.md`;
    const eigeneDatei = `md/${path}`;
    const bildPfad = `pics/papers/${paper.slug}.png`;

    const [hatEigeneDatei, hatBild] = await Promise.all([
      dateiExistiert(eigeneDatei),
      dateiExistiert(bildPfad),
    ]);

    return {
      datei: hatEigeneDatei
        ? `../${path}`
        : "neues-paper-generisch.md",
      titel: `Neues Paper: ${paper.titel}`,
      datum: paper.datum,
      ...(hatBild && { bild: bildPfad }),
      link: "veroeffentlichungen.html",
      linkText: "Zu den Veröffentlichungen",
      kategorie: NewsKategorie.PUBLIKATIONEN,
    };

  }));

}


// Prüft per HEAD-Request, ob unter dem gegebenen Pfad eine Datei
// existiert.
async function dateiExistiert(pfad) {

  try {

    const response =
      await fetch(
        pfad,
        { method: "HEAD" }
      );

    return response.ok;

  }
  catch {

    return false;

  }

}


// Erzeugt aus ratgeberListe (ratgeber.js) automatisch einen News-Eintrag
// pro Buch. Nur Bücher mit gesetztem "erstellt" tauchen auf.
// Erwartet ein Mockup-Bild unter pics/ratgeber-mockup/<slug>.png.
// Für die Ankündigung wird eine eigene Datei unter
// md/news-ratgeber/<slug>.md verwendet, falls sie existiert -
// andernfalls der generische Text
// md/news/neuer-ratgeber-generisch.md.
async function erzeugeRatgeberNews(ratgeberListe) {

  return Promise.all(ratgeberListe.map(async ratgeber => {

    const eigeneDatei =
      `md/news-ratgeber/${ratgeber.slug}.md`;

    const bildPfad =
      `pics/ratgeber-mockup/${ratgeber.slug}.png`;

    const [hatEigeneDatei, hatBild] =
      await Promise.all([
        dateiExistiert(eigeneDatei),
        dateiExistiert(bildPfad),
      ]);

    return {
      datei: hatEigeneDatei
        ? `../news-ratgeber/${ratgeber.slug}.md`
        : "neuer-ratgeber-generisch.md",
      titel: `Neuer Ratgeber: ${ratgeber.titel}`,
      datum: ratgeber.erstellt,
      ...(hatBild && { bild: bildPfad }),
      link: `ratgeber-${ratgeber.urlSlug}.html`,
      linkText: "Zum Ratgeber",
      kategorie: NewsKategorie.RATGEBER,
    };

  }));

}


// Erzeugt aus problemeListe (probleme.js) automatisch einen News-Eintrag
// pro Fallakte. Nur Fallakten mit gesetztem "erstellt" tauchen auf.
// Für die Ankündigung wird eine eigene Datei unter
// md/news-probleme/<slug>.md verwendet, falls sie existiert -
// andernfalls der generische Text
// md/news/neue-fallakte-generisch.md.
async function erzeugeProblemNews(problemeListe) {

  return Promise.all(problemeListe.map(async problem => {

    const eigeneDatei =
      `md/news-probleme/${problem.slug}.md`;

    const hatEigeneDatei =
      await dateiExistiert(eigeneDatei);

    return {
      datei: hatEigeneDatei
        ? `../news-probleme/${problem.slug}.md`
        : "neue-fallakte-generisch.md",
      titel: `Neue Fallakte: ${problem.titel}`,
      datum: problem.erstellt,
      slug: problem.slug,
      link: `problem-${problem.slug}.html`,
      linkText: "Zur Fallakte",
      kategorie: NewsKategorie.FALLAKTEN,
    };

  }));

}


// Versieht eine Liste roher News-Einträge (ohne kategorie-Feld) mit
// der übergebenen Kategorie. Wird für die ausgelagerte JSON-Datei
// Institutsleben verwendet.
function versieheMitKategorie(
  eintraege,
  kategorie
) {

  return eintraege.map(
    eintrag => ({
      ...eintrag,
      kategorie,
    })
  );

}


// Lädt News-Einträge aus einer JSON-Datei.
//
// ordner: Name des Ordners, der für diese Kategorie sowohl die
// .md-Dateien (unter md/) als auch die Bilder (unter pics/) enthält.
//
// datei muss in der JSON-Datei selbst nur den reinen Dateinamen
// enthalten - der jeweilige Pfad wird hier ergänzt.
//
// Ein Bild wird nur gesetzt, wenn unter
// pics/<ordner>/<slug>.png tatsächlich eine Datei existiert.
//
// Optional - ohne Angabe bleiben datei und bild unverändert.
async function ladeJsonNews(
  pfad,
  kategorie,
  ordner
) {

  const response =
    await fetch(pfad);

  if (!response.ok) {

    throw new Error(
      `News-Datei nicht gefunden: ${pfad}`
    );

  }

  const eintraege =
    await response.json();

  const eintraegeMitPfad =
    ordner

      ? await Promise.all(
          eintraege.map(
            async eintrag => {

              const bildPfad =
                `pics/${ordner}/${eintrag.slug}.png`;

              const hatBild =
                await dateiExistiert(
                  bildPfad
                );

              return {
                ...eintrag,
                datei:
                  `../${ordner}/${eintrag.slug}.md`,
                ...(hatBild && {
                  bild: bildPfad
                }),
              };

            }
          )
        )

      : eintraege;

  return versieheMitKategorie(
    eintraegeMitPfad,
    kategorie
  );

}


// Erzeugt aus alltagsstudienListe automatisch einen News-Eintrag
// pro Alltagsstudie.
//
// Die Markdown-Datei liegt unter:
// md/alltagsstudien/<slug>.md
//
// Das optionale Bild liegt unter:
// pics/alltagsstudien/<slug>.png
//
// Wenn ein Bild existiert, wird es als News-Bild übernommen.
async function erzeugeAlltagsstudienNews(
  alltagsstudienListe
) {

  return Promise.all(
    alltagsstudienListe.map(
      async studie => {

        const bildPfad =
          `pics/alltagsstudien/${studie.slug}.png`;

        const hatBild =
          await dateiExistiert(
            bildPfad
          );

        return {
          datei:
            `../alltagsstudien/${studie.slug}.md`,

          titel:
            `Neue Alltagsstudie: ${studie.titel}`,

          datum:
            studie.datum,

          ...(hatBild && {
            bild: bildPfad
          }),

          link:
            `alltagsstudie-${studie.slug}.html`,

          linkText:
            "Zur Alltagsstudie",

          kategorie:
            NewsKategorie.ALLTAGSSTUDIEN,
        };

      }
    )
  );

}


// Name und Stellenbezeichnung einer Person aus
// md/personal-des-monats/<slug>.md ("# Name" und
// "**Stellenbezeichnung:** ..."). Fehlt die Datei, dient der Slug als Name.
async function ladePersonalKopfdaten(slug) {

  try {

    const response =
      await fetch(
        `md/personal-des-monats/${encodeURIComponent(slug)}.md`
      );

    if (!response.ok) {
      throw new Error("Markdown nicht gefunden");
    }

    const markdown = await response.text();

    const name =
      (markdown.match(/^#\s+(.+)$/m) || [])[1];

    const stelle =
      (markdown.match(/^\*\*Stellenbezeichnung:\*\*\s*(.+)$/m) || [])[1];

    return {
      name: name ? name.trim() : slug,
      stelle: stelle ? stelle.trim() : "",
    };

  }
  catch {

    return { name: slug, stelle: "" };

  }

}


// Erzeugt aus data/personal-des-monats.json automatisch einen
// News-Eintrag pro ernannter Person. Einträge ohne "datum" tauchen nicht
// auf (ohne Datum gibt es nichts zu berichten); Einträge mit Datum in der
// Zukunft werden - wie bei allen News - erst von den Seiten ausgeblendet
// (istDatumErreicht()).
//
// Ein optionales Bild (z.B. die Überreichung der Auszeichnung, Querformat)
// wird übernommen, wenn unter pics/personal-des-monats/<slug>.png
// eine Datei existiert.
//
// Text und Link werden aus den Daten abgeleitet: Statt einer Datei unter
// md/news/ bekommt der Eintrag das Feld "text" (ein Markdown-Absatz),
// das news-seite.js und news-startseite.js direkt verwenden.
// Schlägt das Laden fehl, bleiben die übrigen News davon unberührt.
async function erzeugePersonalNews() {

  try {

    const response =
      await fetch(
        "data/personal-des-monats.json"
      );

    if (!response.ok) {

      throw new Error(
        "Personal-des-Monats-Datei nicht gefunden"
      );

    }

    const eintraege =
      await response.json();

    return Promise.all(
      eintraege
        .map(async eintrag => {

          const bildPfad =
            `pics/personal-des-monats/${eintrag.slug}.png`;

          const [{ name, stelle }, hatBild] =
            await Promise.all([
              ladePersonalKopfdaten(eintrag.slug),
              dateiExistiert(bildPfad),
            ]);

          // "2026-10" (ohne Tag) -> "2026-10-01", damit
          // formatiereDatumDeutsch() und der Datumsvergleich passen.
          const datum =
            /^\d{4}-\d{2}$/.test(eintrag.datum)
              ? `${eintrag.datum}-01`
              : eintrag.datum;

          const stellenText =
            stelle ? ` – ${stelle}` : "";

          return {
            titel: `Neues Personal des Monats: ${name}`,
            datum,
            text:
              `Ausgezeichnet wurde: **${name}**${stellenText}. ` +
              "Was dafür den Ausschlag gab und womit das Institut " +
              "dankt, erfährst du auf der Seite zur Auszeichnung.",
            ...(hatBild && { bild: bildPfad }),
            link: `personal-des-monats-${eintrag.slug}.html`,
            linkText: "Zum Personal des Monats",
            kategorie: NewsKategorie.PERSONAL,
          };

        })
    );

  }
  catch (fehler) {

    console.warn(
      "Personal des Monats konnte nicht geladen werden:",
      fehler
    );

    return [];

  }

}


async function ladeAlleNews() {

  const response =
    await fetch(
      "data/veroeffentlichungen.json"
    );

  if (!response.ok) {

    throw new Error(
      "Veröffentlichungsdatei nicht gefunden"
    );

  }

  const veroeffentlichungen =
    await response.json();


  const paperNews =
    await erzeugePaperNews(
      veroeffentlichungen
    );


  const ratgeberNews =
    await erzeugeRatgeberNews(
      ratgeberListe
    );


  const problemNews =
    await erzeugeProblemNews(
      problemeListe
    );


  const [
    institutslebenNews,
    alltagsstudienNews,
    personalNews
  ] = await Promise.all([

    ladeJsonNews(
      "data/institutsleben.json",
      NewsKategorie.INSTITUTSLEBEN,
      "news-institutsleben"
    ),

    erzeugeAlltagsstudienNews(
      alltagsstudienListe
    ),

    erzeugePersonalNews(),

  ]);


  return [

    ...newsListe,

    ...paperNews,

    ...ratgeberNews,

    ...problemNews,

    ...institutslebenNews,

    ...alltagsstudienNews,

    ...personalNews,

  ];

}
