/*
  Lädt eine Fallakte aus einer Markdown-Datei und zeigt sie vollständig an.

  Die Fallakte wird über ?slug=... ausgewählt.

  Beispiel:

    problem.html?slug=ans-bett-gebunden

  Titel, Erstellungs- und Aktualisierungsdatum kommen aus
  problemeListe (siehe js/probleme.js). Der eigentliche Inhalt
  (Frage, Diagnose, Behandlung, Begründung, Prognose, Einsender)
  liegt als Markdown-Datei unter:

    md/probleme/<slug>.md
*/


const container =
  document.getElementById("problem-inhalt");


// ------------------------------------------------------------
// Slug aus URL lesen
// ------------------------------------------------------------

const parameter =
  new URLSearchParams(
    window.location.search
  );

const slugParam =
  parameter.get("slug");


if (!slugParam) {

  zeigeFehler();

} else {

  ladeFallakte(slugParam);

}


// ------------------------------------------------------------
// Fallakte laden
// ------------------------------------------------------------

function ladeFallakte(slug) {

  const eintrag =
    problemeListe.find(
      problem => problem.slug === slug
    );

  if (!eintrag) {

    zeigeFehler();
    return;
  }

  const pfad =
    `md/probleme/${encodeURIComponent(slug)}.md`;

  fetch(pfad)

    .then(antwort => {

      if (!antwort.ok) {

        throw new Error(
          `Fallakten-Datei nicht gefunden: ${slug}`
        );

      }

      return antwort.text();

    })

    .then(markdown => {

      const inhalt =
        parseFallakte(markdown);

      /*
        Titel, erstellt und aktualisiert kommen aus problemeListe
        (eintrag), der Rest aus der Markdown-Datei (inhalt).
      */

      const problem = {
        ...eintrag,
        ...inhalt,
      };

      zeigeFallakte(problem);

    })

    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Fallakte:",
        fehler
      );

      zeigeFehler();

    });

}


// ------------------------------------------------------------
// Fallakte aus Markdown auslesen
//
// Titel, Erstellt und Aktualisiert stehen NICHT mehr in der
// Markdown-Datei - die kommen aus problemeListe (siehe
// ladeFallakte oben).
// ------------------------------------------------------------

function parseFallakte(markdown) {

  const bereiche = {};

  const regex =
    /^#{1,2}\s+(.+?)\s*\n([\s\S]*?)(?=^#{1,2}\s+|\s*$)/gm;

  let match;

  while ((match = regex.exec(markdown)) !== null) {

    const ueberschrift =
      match[1]
        .trim()
        .toLowerCase();

    const inhalt =
      match[2].trim();

    bereiche[ueberschrift] =
      inhalt;
  }


  return {

    frage:
      bereiche["frage"] || "",

    diagnose:
      bereiche["diagnose"] || "",

    behandlung:
      bereiche["behandlung"] || "",

    begruendung:
      bereiche["begründung"] ||
      bereiche["begruendung"] ||
      "",

    prognose:
      bereiche["prognose"] || "",

    einsender:
      bereiche["einsender"] || ""

  };

}


// ------------------------------------------------------------
// Fehleranzeige
// ------------------------------------------------------------

function zeigeFehler() {

  container.innerHTML = `
    <h1>Fallakte nicht gefunden</h1>

    <p>
      Dieses Problem gibt es (noch) nicht.
      <a href="probleme.html">
        Zur Übersicht
      </a>.
    </p>
  `;

}


// ------------------------------------------------------------
// Datums- und Einsender-Hinweise
//
// "erstellt" und "aktualisiert" kommen bereits im ISO-Format
// (YYYY-MM-DD) aus problemeListe und werden für die Anzeige über
// formatiereDatumDeutsch() (siehe js/datumsformat.js) in die
// deutsche Lesefassung umgewandelt - "einsender" ist dagegen kein
// Datum und bleibt unverändert.
// ------------------------------------------------------------

function baueDatumsHinweis(problem) {

  const zeilen = [];

  // Fallnummer anhand der Reihenfolge in problemeListe bestimmen
  const fallnummer =
    problemeListe.findIndex(
      p => p.slug === problem.slug
    ) + 1;

  if (fallnummer > 0) {
    zeilen.push(
      `<p class="buch-datum">FALL NR. ${String(fallnummer).padStart(3, "0")}</p>`
    );
  }


  if (problem.einsender) {

    zeilen.push(`
      <p class="buch-datum">
        Eingesendet von: ${problem.einsender}
      </p>
    `);

  }


  if (problem.erstellt) {

    zeilen.push(`
      <p class="buch-datum">
        Veröffentlicht: ${formatiereDatumDeutsch(problem.erstellt)}
      </p>
    `);

  }


  if (problem.aktualisiert) {

    zeilen.push(`
      <p class="buch-datum">
        Aktualisiert: ${formatiereDatumDeutsch(problem.aktualisiert)}
      </p>
    `);

  }


  return zeilen.length

    ? `
      <div class="buch-datums-hinweis">
        ${zeilen.join("\n")}
      </div>
    `

    : "";

}


// ------------------------------------------------------------
// Fallakte anzeigen
// ------------------------------------------------------------

function zeigeFallakte(problem) {

  document.title =
    problem.titel +
    " – Dr. Maximilian Methodius";


  const datumsHtml =
    baueDatumsHinweis(problem);


  /*
    Fallnummer anhand der Position
    des slug in problemeListe.
  */

  const index =
    problemeListe.findIndex(
      p => p.slug === problem.slug
    );

  const fallnummerText =
    index >= 0
      ? String(index + 1).padStart(3, "0")
      : "???";


  /*
    Der slug ist die eindeutige
    Kennung für Kommentare.
  */

  const kommentarSlug =
    problem.slug;


  /*
    Markdown rendern.
  */

  const frageHtml =
    parseMarkdownBloecke(problem.frage)
      .join("\n");

  const diagnoseHtml =
    parseMarkdownBloecke(problem.diagnose)
      .join("\n");

  const behandlungHtml =
    parseMarkdownBloecke(problem.behandlung)
      .join("\n");

  const begruendungHtml =
    parseMarkdownBloecke(problem.begruendung)
      .join("\n");

  const prognoseHtml =
    parseMarkdownBloecke(problem.prognose)
      .join("\n");


  container.innerHTML = `

    ${datumsHtml}

    <p class="blaettern-wrap">

      <a
        href="#fallakten-kommentare"
        id="kommentar-link"
        class="kommentar-link"
      >
        💬
        <span id="kommentar-link-text">
          Kommentare
        </span>
      </a>

      <button
        type="button"
        id="teilen-button"
        class="teilen-button"
      >
        🔗 Teilen
      </button>

    </p>


    <h1>${problem.titel}</h1>


    <div class="problem-block problem-frage-block">

      <p class="problem-label">
        🗒️ Eingesandtes Problem
      </p>

      <div class="problem-frage-text">
        ${frageHtml}
      </div>

    </div>


    <div class="problem-block">

      <p class="problem-label">
        🩺 Diagnose
      </p>

      ${diagnoseHtml}

    </div>


    <div class="problem-block">

      <p class="problem-label">
        💊 Behandlung
      </p>

      ${behandlungHtml}

    </div>


    <div class="problem-block">

      <p class="problem-label">
        🔬 Wissenschaftliche Begründung
      </p>

      ${begruendungHtml}

    </div>


    <div class="problem-block">

      <p class="problem-label">
        📈 Prognose
      </p>

      ${prognoseHtml}

    </div>


    <p class="grid-link">
      <a href="probleme.html">
        ← Zur Übersicht
      </a>
    </p>

  `;


  // ----------------------------------------------------------
  // Teilen
  // ----------------------------------------------------------

  initTeilenButtonProblem(
    document.getElementById(
      "teilen-button"
    ),
    {
      titel:
        problem.titel,

      fallnummer:
        fallnummerText,

      frage:
        problem.frage,

      diagnose:
        problem.diagnose,

      behandlung:
        problem.behandlung
    }
  );


  // ----------------------------------------------------------
  // Kommentare
  // ----------------------------------------------------------

  ladeKommentare({

    slug:
      kommentarSlug,

    ordner:
      "probleme-kommentare",

    containerId:
      "problem-inhalt",

    sectionId:
      "fallakten-kommentare"

  });

}
