/*
  Lädt und rendert die News-Beiträge aus newsListe.

  Die Markdown-Dateien liegen unter:

    md/news/

  Unterstützt werden alle Formatierungen, die
  parseMarkdownBloecke() aus markdown.js versteht,
  insbesondere:

  **fett**

  *kursiv*
*/

const newsContainer = document.getElementById("news-liste");


function ladeNews() {

  if (!newsListe || newsListe.length === 0) {
    newsContainer.innerHTML = `
      <p>Derzeit gibt es keine Neuigkeiten.</p>
    `;
    return;
  }

  /*
    Die neuesten Beiträge stehen in news.js oben.
  */

  Promise.all(
    newsListe.map(beitrag =>
      ladeNewsBeitrag(beitrag)
    )
  )
    .then(beitragHtml => {

      newsContainer.innerHTML =
        beitragHtml.join("\n");

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der News:",
        fehler
      );

      newsContainer.innerHTML = `
        <p>
          <em>
            Die News konnten leider nicht geladen werden.
          </em>
        </p>
      `;
    });
}


function ladeNewsBeitrag(beitrag) {

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

      const bloecke =
        parseMarkdownBloecke(markdown);

      const textHtml =
        bloecke.join("\n");

      /*
        Optionaler Link, z.B. zum neuen Ratgeber.
      */

      let linkHtml = "";

      if (beitrag.link) {

        linkHtml = `
          <p class="news-link-wrap">
            <a
              href="${beitrag.link}"
              class="news-link"
            >
              ${beitrag.linkText || "Mehr erfahren"} →
            </a>
          </p>
        `;
      }


      /*
        Optionales Bild.

        Das Bild steht bewusst GANZ AM ENDE
        des Beitrags.
      */

      let bildHtml = "";

      if (beitrag.bild) {

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
        <article class="news-beitrag">

          <div class="news-meta">
            ${beitrag.datum || ""}
          </div>

          <h2 class="news-titel">
            ${beitrag.titel}
          </h2>

          <div class="news-text">
            ${textHtml}
          </div>

          ${linkHtml}

          ${bildHtml}

        </article>
      `;
    });
}


ladeNews();