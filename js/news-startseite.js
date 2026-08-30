/*
  Zeigt den aktuellsten News-Beitrag auf der Startseite.

  Die Reihenfolge der Beiträge wird in news.js festgelegt:
  Der NEUESTE Beitrag steht dort an erster Stelle.

  Verwendet werden:
    - newsListe aus js/news.js
    - parseMarkdownBloecke() aus js/markdown.js

  Unterstützt:
    - Datum (ISO-Format YYYY-MM-DD in newsListe, wird über
      formatiereDatumDeutsch() aus js/datumsformat.js in die
      deutsche Lesefassung umgewandelt)
    - Titel
    - Markdown-Text
    - optionalen Link
    - optionales Bild

  Der Beitrag wird bewusst kompakter dargestellt als auf news.html.
*/

const newsStartseiteContainer =
  document.getElementById("news-startseite");


function ladeAktuellsteNews() {

  if (!newsStartseiteContainer) {
    return;
  }

  if (!newsListe || newsListe.length === 0) {
    newsStartseiteContainer.innerHTML = "";
    return;
  }

  /*
    Nur Beiträge berücksichtigen, die ein "datum" haben UND dessen
    Datum bereits erreicht ist (heute oder in der Vergangenheit) -
    siehe istDatumErreicht() in js/datumsformat.js. Beiträge ohne
    Datum oder mit einem Datum in der Zukunft werden ignoriert.
  */
  const sichtbareNews = newsListe.filter(
    beitrag => beitrag.datum && istDatumErreicht(beitrag.datum)
  );

  if (sichtbareNews.length === 0) {
    newsStartseiteContainer.innerHTML = "";
    return;
  }

  // Der erste Eintrag ist laut news.js der aktuellste.
  const beitrag = sichtbareNews[0];

  ladeNewsStartseitenBeitrag(beitrag)
    .then(html => {
      newsStartseiteContainer.innerHTML = html;
    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der aktuellsten News:",
        fehler
      );

      newsStartseiteContainer.innerHTML = `
        <p>
          <em>
            Die aktuellen News konnten leider nicht geladen werden.
          </em>
        </p>
      `;
    });
}


function ladeNewsStartseitenBeitrag(beitrag) {

  const pfad =
    `md/news/${encodeURIComponent(beitrag.datei)}`;

  return fetch(pfad)
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error(
          `News-Datei nicht gefunden: ${beitrag.datei}`
        );
      }

      return antwort.text();
    })
    .then(markdown => {

      /*
        Markdown wie auf der eigentlichen News-Seite
        in HTML umwandeln.
      */

      const bloecke =
        parseMarkdownBloecke(markdown);

      /*
        Für die Startseite nur die ersten beiden
        Markdown-Blöcke anzeigen.

        Dadurch wird aus einem längeren News-Beitrag
        ein kurzer Teaser.
      */

      const teaserBloecke =
        bloecke.slice(0, 2);

      const textHtml =
        teaserBloecke.join("\n");


      /*
        Optionaler Link.
      */

      let linkHtml = "";

      if (beitrag.link) {

        linkHtml = `
          <p class="news-link-wrap">
            <a
              href="${beitrag.link}"
              class="news-link"
            >
              ${beitrag.linkText || "Zum Beitrag"} →
            </a>
          </p>
        `;
      }


      /*
        Optionales Bild.

        Wie bei news.html steht das Bild am Ende
        des Beitrags.
      */

      let bildHtml = "";

      if (beitrag.bild && !beitrag.bild.startsWith("pics/ratgeber/")) {

        bildHtml = `
          <img
            class="news-bild"
            src="${beitrag.bild}"
            alt=""
            loading="lazy"
          >
        `;
      }


      return `
        <article class="news-beitrag news-startseiten-beitrag">

          <div class="news-meta">
            ${beitrag.datum ? formatiereDatumDeutsch(beitrag.datum) : ""}
          </div>

          <h3 class="news-titel">
            ${beitrag.titel}
          </h3>

          <div class="news-text">
            ${textHtml}
          </div>

          ${linkHtml}

          ${bildHtml}

        </article>
      `;
    });
}


ladeAktuellsteNews();