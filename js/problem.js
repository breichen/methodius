/*
  Lädt eine Fallakte aus einer Markdown-Datei und zeigt sie vollständig an.

  Die Datei wird über ?datei=... ausgewählt.

  Beispiel:

    problem.html?datei=ans-bett-gebunden.md

  Die Fallakte liegt unter:

    md/probleme/
*/


const container =
  document.getElementById("problem-inhalt");


// ------------------------------------------------------------
// Datei aus URL lesen
// ------------------------------------------------------------

const parameter =
  new URLSearchParams(
    window.location.search
  );

const dateiParam =
  parameter.get("datei");


if (!dateiParam) {

  zeigeFehler();

} else {

  ladeFallakte(dateiParam);

}


// ------------------------------------------------------------
// Fallakte laden
// ------------------------------------------------------------

function ladeFallakte(dateiname) {

  const pfad =
    `md/probleme/${encodeURIComponent(dateiname)}`;

  fetch(pfad)

    .then(antwort => {

      if (!antwort.ok) {

        throw new Error(
          `Fallakten-Datei nicht gefunden: ${dateiname}`
        );

      }

      return antwort.text();

    })

    .then(markdown => {

      const problem =
        parseFallakte(markdown);

      if (!problem.titel) {

        throw new Error(
          "Die Fallakte enthält keinen Titel."
        );

      }

      zeigeFallakte(
        problem,
        dateiname
      );

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

    titel:
      bereiche["titel"] || "",

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
      bereiche["einsender"] || "",

    erstellt:
      bereiche["erstellt"] || "",

    aktualisiert:
      bereiche["aktualisiert"] || ""

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
// ------------------------------------------------------------

function baueDatumsHinweis(problem) {

  const zeilen = [];


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
        Veröffentlicht: ${problem.erstellt}
      </p>
    `);

  }


  if (problem.aktualisiert) {

    zeilen.push(`
      <p class="buch-datum">
        Aktualisiert: ${problem.aktualisiert}
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

function zeigeFallakte(
  problem,
  dateiname
) {

  document.title =
    problem.titel +
    " – Dr. Maximilian Methodius";


  const datumsHtml =
    baueDatumsHinweis(problem);


  /*
    Fallnummer anhand der Position
    des Dateinamens in problemeListe.
  */

  const index =
    problemeListe.indexOf(dateiname);

  const fallnummerText =
    index >= 0
      ? String(index + 1).padStart(3, "0")
      : "???";


  /*
    Der Dateiname ohne .md ist die
    eindeutige Kennung für Kommentare.
  */

  const kommentarSlug =
    dateiname.replace(
      /\.md$/i,
      ""
    );


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
      "fallakten-kommentare",

    containerId:
      "problem-inhalt",

    sectionId:
      "fallakten-kommentare"

  });

}