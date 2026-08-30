/*
  Lädt ALLE Veröffentlichungen aus data/veroeffentlichungen.json und
  zeigt sie vollständig an (im Gegensatz zu js/institutseite.js, das
  auf der Institutsseite nur die INSTITUT_VEROEFFENTLICHUNGEN_ANZAHL
  neuesten zeigt und hierher verlinkt).

  Die JSON-Datei ist bereits nach Datum absteigend sortiert, sodass die
  neueste Veröffentlichung oben steht - hier wird daher keine weitere
  Sortierung vorgenommen.
*/

const container = document.getElementById("veroeffentlichungen-liste");

function ladeAlleVeroeffentlichungen() {

  if (!container) return;

  fetch("data/veroeffentlichungen.json")
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error("Veröffentlichungsdatei nicht gefunden");
      }

      return antwort.json();
    })
    .then(veroeffentlichungen => {

      if (
        !Array.isArray(veroeffentlichungen) ||
        veroeffentlichungen.length === 0
      ) {
        container.innerHTML = `
          <p>
            Bisher wurden keine Veröffentlichungen
            des Instituts verzeichnet.
          </p>
        `;
        return;
      }

      container.innerHTML =
        veroeffentlichungen
          .map(veroeffentlichung => `
            <article class="institut-veroeffentlichung">

              <p class="institut-veroeffentlichung-datum">
                ${formatiereDatumDeutsch(veroeffentlichung.datum)}
              </p>

              <h3>
                ${veroeffentlichung.titel}
              </h3>

              <p class="institut-veroeffentlichung-autoren">
                ${veroeffentlichung.autoren.join(", ")}
              </p>

              ${
                veroeffentlichung.beschreibung
                  ? `<p>${veroeffentlichung.beschreibung}</p>`
                  : ""
              }

            </article>
          `)
          .join("\n");

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Veröffentlichungen:",
        fehler
      );

      container.innerHTML = `
        <p>
          Die Veröffentlichungen konnten leider
          nicht geladen werden.
        </p>
      `;
    });
}

ladeAlleVeroeffentlichungen();