/*
  Steuert den "Aktuellster Fall"-Showcase auf der Startseite.

  Die Fallakten liegen als Markdown-Dateien unter:

    md/probleme/

  problemeListe enthält nur die Dateinamen.

  Der neueste Fall ist der letzte Eintrag in problemeListe.
*/


document.addEventListener(
  "DOMContentLoaded",
  () => {

    const showcase =
      document.getElementById(
        "problem-showcase"
      );

    const link =
      document.getElementById(
        "problem-showcase-link"
      );

    if (!showcase || !link) {
      return;
    }


    /*
      Keine Fallakten vorhanden.
    */

    if (
      !problemeListe ||
      !problemeListe.length
    ) {

      showcase.style.display =
        "none";

      return;
    }


    const fallnummerEl =
      document.getElementById(
        "problem-showcase-fallnummer"
      );

    const titelEl =
      document.getElementById(
        "problem-showcase-title"
      );

    const frageEl =
      document.getElementById(
        "problem-showcase-frage"
      );

    const prevBtn =
      document.getElementById(
        "problem-showcase-prev"
      );

    const nextBtn =
      document.getElementById(
        "problem-showcase-next"
      );


    /*
      Alle Fallakten laden.
    */

    Promise.all(
      problemeListe.map(
        dateiname =>
          ladeShowcaseFallakte(
            dateiname
          )
      )
    )

      .then(probleme => {

        let index =
          probleme.length - 1;


        function zeigeFall() {

          const problem =
            probleme[index];

          const fallnummer =
            String(index + 1)
              .padStart(3, "0");


          fallnummerEl.textContent =
            `Fall Nr. ${fallnummer}`;

          titelEl.textContent =
            problem.titel;

          frageEl.textContent =
            `„${problem.frage}“`;

          link.href =
            `problem.html?datei=${
              encodeURIComponent(
                problem.datei
              )
            }`;


          /*
            Start ist der neueste Fall.

            Linker Pfeil:
            zu neueren Fällen.

            Rechter Pfeil:
            zu älteren Fällen.
          */

          prevBtn.disabled =
            index >= probleme.length - 1;

          nextBtn.disabled =
            index <= 0;

        }


        prevBtn.addEventListener(
          "click",
          () => {

            if (
              index <
              probleme.length - 1
            ) {

              index++;

              zeigeFall();

            }

          }
        );


        nextBtn.addEventListener(
          "click",
          () => {

            if (index > 0) {

              index--;

              zeigeFall();

            }

          }
        );


        zeigeFall();

      })

      .catch(fehler => {

        console.error(
          "Fehler beim Laden des Fallakten-Showcases:",
          fehler
        );

        showcase.style.display =
          "none";

      });

  }
);


// ------------------------------------------------------------
// Einzelne Fallakte für Showcase laden
// ------------------------------------------------------------

function ladeShowcaseFallakte(
  dateiname
) {

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

      const bereiche = {};

      const regex =
        /^#{1,2}\s+(.+?)\s*\n([\s\S]*?)(?=^#{1,2}\s+|\s*$)/gm;

      let match;

      while (
        (match = regex.exec(markdown)) !== null
      ) {

        const ueberschrift =
          match[1]
            .trim()
            .toLowerCase();

        bereiche[ueberschrift] =
          match[2].trim();

      }


      return {

        datei:
          dateiname,

        titel:
          bereiche["titel"] || "",

        frage:
          markdownZuKlartext(
            bereiche["frage"] || ""
          )

      };

    });

}


// ------------------------------------------------------------
// Markdown für die Vorschau vereinfachen
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