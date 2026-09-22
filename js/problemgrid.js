/*
  Befüllt bis zu drei Container auf den Problem-Seiten mit Karten aus
  den Markdown-Dateien aus problemeListe.

  Die eigentlichen Fallakten liegen unter:

    md/probleme/<slug>.md

  Titel, Erstellungs- und Aktualisierungsdatum kommen aus
  problemeListe (siehe js/probleme.js). Erwartete Struktur einer
  Fallakten-Markdown-Datei:

    ## Frage

    ...

    ## Diagnose

    ...

    ## Behandlung

    ...

    ## Begründung

    ...

    ## Prognose

    ...

    ## Einsender

    ...

  Für die Übersicht wird momentan nur die Frage benötigt.

  Setzt js/probleme-filter.js voraus (muss VOR diesem Script geladen
  werden): von dort kommen sowohl holeGefilterteProbleme() (Filterung
  nach "erstellt"-Datum und ggf. Kategorie, siehe dort) als auch die
  Anzeige-Konstanten ANZAHL_NEUESTE_PROBLEME/ANZAHL_ZUFAELLIGE_PROBLEME.
*/


// ------------------------------------------------------------
// Markdown-Datei laden
// ------------------------------------------------------------

function ladeProblem(eintrag) {

  const pfad =
    `md/probleme/${encodeURIComponent(eintrag.slug)}.md`;

  return fetch(pfad)
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error(
          `Fallakten-Datei nicht gefunden: ${eintrag.slug}`
        );
      }

      return antwort.text();
    })
    .then(markdown => {

      return {
        slug: eintrag.slug,
        titel: eintrag.titel,
        erstellt: eintrag.erstellt,
        frage: parseProblemFrage(markdown)
      };

    });

}


// ------------------------------------------------------------
// Frage aus der Markdown-Datei auslesen
// ------------------------------------------------------------

function parseProblemFrage(markdown) {

  const bereiche = {};

  /*
    Erkennt Überschriften wie:

      ## Frage
      ## Diagnose
      ## Behandlung

    und speichert den jeweiligen Inhalt bis
    zur nächsten Überschrift.
  */

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


  /*
    Die Frage kann Markdown enthalten.
    Für die Karte wird daraus eine einfache
    Textversion gemacht.
  */

  return markdownZuKlartext(
    bereiche["frage"] || ""
  );
}


// ------------------------------------------------------------
// Einfaches Markdown für die Kartendarstellung entfernen
// ------------------------------------------------------------

function markdownZuKlartext(text) {

  return String(text || "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/\s+/g, " ")
    .trim();

}


// ------------------------------------------------------------
// Eine Fallakten-Karte bauen
// ------------------------------------------------------------

function baueProblemKarte(problem, fallnummer) {

  const nummerText =
    String(fallnummer).padStart(3, "0");

  return `
    <a
      class="problem-card-link"
      href="problem.html?slug=${encodeURIComponent(problem.slug)}"
    >
      <article class="problem-card">

        <p class="problem-fallnummer">
          Fall Nr. ${nummerText}
        </p>

        <h3 class="problem-titel">
          ${problem.titel}
        </h3>

        <p class="problem-frage">
          „${problem.frage}“
        </p>

      </article>
    </a>
  `;
}


// ------------------------------------------------------------
// Karten rendern
// ------------------------------------------------------------

function renderProblemKarten(
  containerId,
  probleme,
  leerText
) {

  const container =
    document.getElementById(containerId);

  if (!container) return;

  if (!probleme.length) {

    container.innerHTML =
      `<p>${leerText}</p>`;

    return;
  }

  container.innerHTML =
    probleme
      .map(problem => {

        const fallnummer =
          problemeListe.findIndex(
            p => p.slug === problem.slug
          ) + 1;

        return baueProblemKarte(
          problem,
          fallnummer
        );

      })
      .join("\n");
}


// ------------------------------------------------------------
// Zufällige Auswahl
// ------------------------------------------------------------

function waehleZufaelligeProbleme(
  liste,
  anzahl
) {

  const kopie =
    [...liste];

  for (
    let i = kopie.length - 1;
    i > 0;
    i--
  ) {

    const j =
      Math.floor(
        Math.random() * (i + 1)
      );

    [kopie[i], kopie[j]] =
      [kopie[j], kopie[i]];
  }

  return kopie.slice(0, anzahl);
}


// ------------------------------------------------------------
// Start
// ------------------------------------------------------------

document.addEventListener(
  "DOMContentLoaded",
  () => {

    const leerText =
      "Noch keine Fälle dokumentiert – reich dein Problem doch einfach ein!";


    /*
      Nur die sichtbaren Fallakten laden: holeGefilterteProbleme()
      (aus js/probleme-filter.js) berücksichtigt bereits sowohl das
      "erstellt"-Datum (siehe istDatumErreicht() in
      js/datumsformat.js) als auch eine eventuell über ?kategorie=...
      aktive Kategorie-Filterung. Fallakten ohne erreichtes Datum
      bzw. außerhalb der gefilterten Kategorie tauchen dadurch in
      keiner der drei Übersichten auf.
    */

    Promise.all(
      holeGefilterteProbleme().map(eintrag =>
        ladeProblem(eintrag)
      )
    )

      .then(sichtbareProbleme => {

        // Alle Fallakten
        renderProblemKarten(
          "alle-probleme",
          sichtbareProbleme,
          leerText
        );


        // Neueste Fallakten
        const neueste =
          sichtbareProbleme
            .slice(-ANZAHL_NEUESTE_PROBLEME)
            .reverse();

        renderProblemKarten(
          "neueste-probleme",
          neueste,
          leerText
        );


        // Zufällige Empfehlungen
        const zufaellige =
          waehleZufaelligeProbleme(
            sichtbareProbleme,
            ANZAHL_ZUFAELLIGE_PROBLEME
          );

        renderProblemKarten(
          "zufaellige-probleme",
          zufaellige,
          leerText
        );

      })

      .catch(fehler => {

        console.error(
          "Fehler beim Laden der Fallakten:",
          fehler
        );

        const containerIds = [
          "alle-probleme",
          "neueste-probleme",
          "zufaellige-probleme"
        ];

        containerIds.forEach(id => {

          const container =
            document.getElementById(id);

          if (container) {

            container.innerHTML = `
              <p>
                <em>
                  Die Fallakten konnten leider nicht geladen werden.
                </em>
              </p>
            `;

          }

        });

      });

  }
);
