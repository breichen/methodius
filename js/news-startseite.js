/*
  Zeigt die neuesten News-Beiträge auf der Startseite als Karussell
  (Pfeile links/rechts, Start beim neuesten Beitrag).

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

  Darstellung je Beitrag:
    - Ratgeber mit Cover: Cover als Link zum Ratgeber
    - Fallakten: dieselbe Karte wie im Fallakten-Showcase
      (braucht ladeShowcaseFallakte() aus js/problemshowcase.js,
      deshalb dort vorher einbinden)
    - alle anderen mit Bild: Bild (klickbar, Lightbox)
    - ohne Bild: Textkarte mit Kategorie und Titel
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


// Number of latest posts that can be paged through on the home page.
const AKTUELLES_ANZAHL = 6;

const aktuellesPrev = document.getElementById("aktuelles-prev");
const aktuellesNext = document.getElementById("aktuelles-next");

// Teaser texts already fetched, keyed by file name.
const aktuellesTeaserCache = {};


async function ladeAktuellsteNews() {

  if (!newsStartseiteContainer) {
    return;
  }

  const bereich = document.getElementById("aktuelles");

  try {

    const alleNews = await ladeAlleNews();

    /*
      Nur Beiträge mit erreichtem Datum (siehe istDatumErreicht() in
      js/datumsformat.js), neueste zuerst. ladeAlleNews() hängt die
      einzelnen Quellen nur aneinander, deshalb wird hier nach Datum
      absteigend sortiert, genau wie in js/news-seite.js.
    */
    const beitraege = alleNews
      .filter(beitrag => istDatumErreicht(beitrag.datum))
      .sort((a, b) => new Date(b.datum) - new Date(a.datum))
      .slice(0, AKTUELLES_ANZAHL);

    if (beitraege.length === 0) {
      if (bereich) bereich.style.display = "none";
      return;
    }

    starteAktuellesKarussell(beitraege);

  } catch (fehler) {

    console.error("Fehler beim Laden der aktuellen News:", fehler);

    newsStartseiteContainer.innerHTML = `
      <p>
        <em>
          Die aktuellen News konnten leider nicht geladen werden.
        </em>
      </p>
    `;

    if (aktuellesPrev) aktuellesPrev.disabled = true;
    if (aktuellesNext) aktuellesNext.disabled = true;
  }
}


/*
  Index 0 = neuester Beitrag. Linker Pfeil: zu neueren Beiträgen,
  rechter Pfeil: zu älteren (wie bei den beiden Showcases).
*/
function starteAktuellesKarussell(beitraege) {

  let index = 0;
  let anfrage = 0; // guards against out-of-order async renders

  async function zeige() {

    const meineAnfrage = ++anfrage;

    aktuellesPrev.disabled = index <= 0;
    aktuellesNext.disabled = index >= beitraege.length - 1;

    try {

      const html = await baueAktuellesSlide(beitraege[index]);

      if (meineAnfrage !== anfrage) {
        return;
      }

      newsStartseiteContainer.innerHTML = html;

    } catch (fehler) {

      console.error("Fehler beim Anzeigen des Beitrags:", fehler);
    }
  }

  aktuellesPrev.addEventListener("click", () => {
    if (index > 0) {
      index--;
      zeige();
    }
  });

  aktuellesNext.addEventListener("click", () => {
    if (index < beitraege.length - 1) {
      index++;
      zeige();
    }
  });

  zeige();
}


function aktuellesEscape(text) {

  return String(text ?? "").replace(/[&<>"']/g, zeichen => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[zeichen]));
}


// "Neuer Ratgeber: Titel" -> "Titel"
function aktuellesKurztitel(titel) {

  return String(titel || "").replace(/^Neu(?:e|er|es)\s[^:]{1,30}:\s*/, "");
}


async function baueAktuellesSlide(beitrag) {

  const titel = aktuellesEscape(beitrag.titel);
  const kurztitel = aktuellesEscape(aktuellesKurztitel(beitrag.titel));

  let visual = null;
  let zeigeTitel = false;
  let zeigeTeaser = true;

  // 1) Fallakte: same card as in the case showcase
  if (beitrag.kategorie === NewsKategorie.FALLAKTEN && beitrag.slug) {

    visual = await baueAktuellesFallkarte(beitrag);

    if (visual) {
      zeigeTeaser = false;
    }
  }

  // 2) Ratgeber with cover: cover links straight to the book
  if (!visual && beitrag.kategorie === NewsKategorie.RATGEBER && beitrag.bild) {

    visual = `
      <a class="showcase-link" href="${aktuellesEscape(beitrag.link)}">
        <img
          class="showcase-cover"
          src="${aktuellesEscape(beitrag.bild)}"
          alt="Cover: ${kurztitel}"
        >
      </a>
    `;
  }

  // 3) Any other post with an image: clickable image (lightbox)
  if (!visual && beitrag.bild) {

    visual = `
      <img
        class="news-bild institutsfoto-klickbar"
        src="${aktuellesEscape(beitrag.bild)}"
        alt="${titel}"
        data-bild="${aktuellesEscape(beitrag.bild)}"
        data-titel="${titel}"
        loading="lazy"
        tabindex="0"
      >
    `;
    zeigeTitel = true;
  }

  // 4) No image at all: text card with category and title
  if (!visual) {

    visual = `
      <div class="problem-showcase-link">
        <div class="problem-card">
          <p class="problem-fallnummer">${aktuellesEscape(beitrag.kategorie)}</p>
          <h3 class="problem-titel">${kurztitel}</h3>
        </div>
      </div>
    `;
  }

  const teaserHtml = zeigeTeaser
    ? await ladeAktuellesTeaser(beitrag)
    : "";

  const linkHtml = beitrag.link
    ? `
      <p class="news-link-wrap">
        <a href="${aktuellesEscape(beitrag.link)}" class="news-link">
          ${aktuellesEscape(beitrag.linkText || "Zum Beitrag")} →
        </a>
      </p>
    `
    : "";

  const datum = beitrag.datum ? formatiereDatumDeutsch(beitrag.datum) : "";
  const meta = [beitrag.kategorie, datum].filter(Boolean).join(" · ");

  return `
    <article class="news-beitrag news-startseiten-beitrag aktuelles-slide">

      <div class="news-meta">${aktuellesEscape(meta)}</div>

      ${visual}

      ${zeigeTitel ? `<h3 class="news-titel">${titel}</h3>` : ""}

      ${teaserHtml ? `<div class="news-text">${teaserHtml}</div>` : ""}

      ${linkHtml}

    </article>
  `;
}


// Case card identical to the one in the case showcase (index.html).
// Returns null if the case cannot be found, so the caller can fall back.
async function baueAktuellesFallkarte(beitrag) {

  try {

    const eintrag = problemeListe.find(p => p.slug === beitrag.slug);

    if (!eintrag) {
      return null;
    }

    const problem = await ladeShowcaseFallakte(eintrag);

    const fallnummer = String(
      problemeListe.findIndex(p => p.slug === problem.slug) + 1
    ).padStart(3, "0");

    return `
      <a
        class="problem-card-link problem-showcase-link"
        href="problem.html?slug=${encodeURIComponent(problem.slug)}"
      >
        <div class="problem-card">
          <p class="problem-fallnummer">Fall Nr. ${fallnummer}</p>
          <h3 class="problem-titel">${aktuellesEscape(problem.titel)}</h3>
          <p class="problem-frage">„${aktuellesEscape(problem.frage)}“</p>
        </div>
      </a>
    `;

  } catch (fehler) {

    console.warn("Fallakte konnte nicht geladen werden:", fehler);
    return null;
  }
}


// First two markdown blocks of the news file, cached per file.
async function ladeAktuellesTeaser(beitrag) {

  if (aktuellesTeaserCache[beitrag.datei] !== undefined) {
    return aktuellesTeaserCache[beitrag.datei];
  }

  try {

    const antwort = await fetch(
      `md/news/${encodeURIComponent(beitrag.datei)}`
    );

    if (!antwort.ok) {
      throw new Error(`News-Datei nicht gefunden: ${beitrag.datei}`);
    }

    const markdown = await antwort.text();

    const html = parseMarkdownBloecke(markdown).slice(0, 2).join("\n");

    aktuellesTeaserCache[beitrag.datei] = html;

    return html;

  } catch (fehler) {

    console.warn(fehler);
    return "";
  }
}


ladeAktuellsteNews();
