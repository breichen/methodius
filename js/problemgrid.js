/*
  Befüllt bis zu drei Container auf den Problem-Seiten mit Karten aus
  den Markdown-Dateien aus problemeListe.

  Die eigentlichen Fallakten liegen unter:

    md/probleme/

  Erwartete Struktur einer Fallakte:

    # Titel

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

    ## Erstellt

    ...

    ## Aktualisiert

  Für die Übersicht werden momentan nur Titel und Frage benötigt.
*/


// Wie viele Karten "Neueste Fallakten" bzw.
// "Zufällige Empfehlungen" angezeigt werden.
const ANZAHL_NEUESTE_PROBLEME = 3;
const ANZAHL_ZUFAELLIGE_PROBLEME = 3;


// ------------------------------------------------------------
// Markdown-Datei laden
// ------------------------------------------------------------

function ladeProblem(dateiname) {

  const pfad =
    `md/probleme/${encodeURIComponent(dateiname)}`;

  return fetch(pfad)
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error(
          `Fallakten-Datei nicht gefunden: ${dateiname}`
        );
      }

      return antwort.text();
    })
    .then(markdown => {

      return {
        datei: dateiname,
        ...parseProblemMarkdown(markdown)
      };

    });

}


// ------------------------------------------------------------
// Markdown einer Fallakte auslesen
// ------------------------------------------------------------

function parseProblemMarkdown(markdown) {

  const bereiche = {};

  /*
    Erkennt Überschriften wie:

      # Titel
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


  const titel =
    bereiche["titel"] || "";


  /*
    Die Frage kann Markdown enthalten.
    Für die Karte wird daraus eine einfache
    Textversion gemacht.
  */

  const frage =
    markdownZuKlartext(
      bereiche["frage"] || ""
    );


  return {
    titel,
    frage
  };
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
      href="problem.html?datei=${encodeURIComponent(problem.datei)}"
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
          problemeListe.indexOf(problem.datei) + 1;

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
      Alle Fallakten laden.
    */

    Promise.all(
      problemeListe.map(dateiname =>
        ladeProblem(dateiname)
      )
    )

      .then(probleme => {

        // Alle Fallakten
        renderProblemKarten(
          "alle-probleme",
          probleme,
          leerText
        );


        // Neueste Fallakten
        const neueste =
          probleme
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
            probleme,
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