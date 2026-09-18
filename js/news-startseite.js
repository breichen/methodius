/*
  Zeigt den aktuellsten News-Beitrag auf der Startseite.

  Verwendet werden:
    - ladeAlleNews() aus js/news.js (kombiniert die manuelle
      newsListe mit den automatisch erzeugten Papers-, Ratgeber-,
      Fallakten-, Institutsleben- und Kuriositäten-Einträgen)
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


/*
  Lightbox zum vergrößerten Anzeigen des Beitragsbilds - nutzt
  dasselbe Overlay (#foto-lightbox) und dieselbe Logik wie
  Institutsleben-Galerie und news.html, siehe js/foto-lightbox.js.

  Das Overlay-Markup steht im HTML erst NACH diesem <script>-Tag,
  deshalb hier auf DOMContentLoaded warten (bzw. sofort ausführen,
  falls das Dokument ohnehin schon fertig geparst ist) - siehe
  ausführlicherer Kommentar dazu in js/news-seite.js.
*/

if (document.readyState === "loading") {
  document.addEventListener(
    "DOMContentLoaded",
    initialisiereFotoLightboxSchliessen
  );
} else {
  initialisiereFotoLightboxSchliessen();
}

if (newsStartseiteContainer) {

  newsStartseiteContainer.addEventListener("click", event => {

    const bild = event.target.closest(".institutsfoto-klickbar");

    if (!bild) {
      return;
    }

    oeffneFotoLightbox(bild.dataset.bild, bild.dataset.titel);
  });

  newsStartseiteContainer.addEventListener("keydown", event => {

    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    const bild = event.target.closest(".institutsfoto-klickbar");

    if (!bild) {
      return;
    }

    event.preventDefault();
    oeffneFotoLightbox(bild.dataset.bild, bild.dataset.titel);
  });
}


async function ladeAktuellsteNews() {

  if (!newsStartseiteContainer) {
    return;
  }

  const alleNews = await ladeAlleNews();

  /*
    Nur Beiträge berücksichtigen, die ein "datum" haben UND dessen
    Datum bereits erreicht ist (heute oder in der Vergangenheit) -
    siehe istDatumErreicht() in js/datumsformat.js. Beiträge ohne
    Datum oder mit einem Datum in der Zukunft werden ignoriert.

    Anders als bei der früher direkt verwendeten (manuellen)
    newsListe steht der neueste Beitrag hier NICHT automatisch an
    erster Stelle - die einzelnen Quellen (Papers, Ratgeber,
    Fallakten, Institutsleben, Kuriositäten) werden von
    ladeAlleNews() einfach hintereinandergehängt. Deshalb wird hier
    zusätzlich nach Datum absteigend sortiert, genau wie in
    js/news-seite.js.
  */
  const sichtbareNews = alleNews
    .filter(beitrag => beitrag.datum && istDatumErreicht(beitrag.datum))
    .sort((a, b) => new Date(b.datum) - new Date(a.datum));

  if (sichtbareNews.length === 0) {
    newsStartseiteContainer.innerHTML = "";
    return;
  }

  // Nach der Sortierung oben ist der erste Eintrag der aktuellste.
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

      if (beitrag.bild && !beitrag.bild.startsWith("pics/ratgeber-mockup/")) {

        bildHtml = `
          <img
            class="news-bild institutsfoto-klickbar"
            src="${beitrag.bild}"
            alt="${beitrag.titel}"
            data-bild="${beitrag.bild}"
            data-titel="${beitrag.titel}"
            loading="lazy"
            tabindex="0"
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