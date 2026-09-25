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

      // Dieselbe Regel wie auf der Institutsseite (siehe
      // js/institutseite.js und istDatumErreicht() in
      // js/datumsformat.js): Veröffentlichungen mit einem Datum in
      // der Zukunft werden noch nicht angezeigt.
      const sichtbareVeroeffentlichungen = veroeffentlichungen.filter(
        veroeffentlichung => istDatumErreicht(veroeffentlichung.datum)
      );

      if (sichtbareVeroeffentlichungen.length === 0) {
        container.innerHTML = `
          <p>
            Bisher wurden keine Veröffentlichungen
            des Instituts verzeichnet.
          </p>
        `;
        return;
      }

      // Check PDF availability for every entry before rendering, so
      // the icon is present from the start instead of popping in
      // after the fact.
      Promise.all(
        sichtbareVeroeffentlichungen.map(
          veroeffentlichung => prüfePdfExistenz(veroeffentlichung.slug)
        )
      ).then(pdfVorhandenListe => {

        container.innerHTML =
          sichtbareVeroeffentlichungen
            .map((veroeffentlichung, index) => `
              <article class="institut-veroeffentlichung">

                <p class="institut-veroeffentlichung-datum">
                  ${formatiereDatumDeutsch(veroeffentlichung.datum)}
                </p>

                <p class="institut-veroeffentlichung-autoren">
                  ${veroeffentlichung.autoren.join(", ")}
                </p>

                <h3>
                  ${veroeffentlichung.titel}
                  ${
                    pdfVorhandenListe[index]
                      ? `
                        <a
                          href="pdf/papers/${veroeffentlichung.slug}.pdf"
                          target="_blank"
                          rel="noopener"
                          class="institut-veroeffentlichung-pdf-link"
                          aria-label="PDF in neuem Tab öffnen"
                          title="PDF öffnen"
                        >📄</a>
                      `
                      : ""
                  }
                </h3>

                ${
                  veroeffentlichung.journal
                    ? `
                      <p class="institut-veroeffentlichung-journal">
                        <em>${veroeffentlichung.journal}</em>${veroeffentlichung.band != null ? `, Bd. ${veroeffentlichung.band}` : ""}${veroeffentlichung.heft != null ? `, Heft ${veroeffentlichung.heft}` : ""}${veroeffentlichung.seite_start != null && veroeffentlichung.seite_ende != null ? `,
                               ${veroeffentlichung.seite_start}&ndash;${veroeffentlichung.seite_ende}` : ""}
                      </p>
                    `
                    : ""
                }

                ${
                  veroeffentlichung.beschreibung
                    ? `<p>${veroeffentlichung.beschreibung}</p>`
                    : ""
                }

              </article>
            `)
            .join("\n");
      });
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

// Checks whether a PDF exists for a given publication slug under
// pdf/papers/. Uses HEAD so the file itself isn't downloaded just to
// test for its presence.
function prüfePdfExistenz(slug) {
  if (!slug) return Promise.resolve(false);

  return fetch(`pdf/papers/${slug}.pdf`, { method: "HEAD" })
    .then(antwort => antwort.ok)
    .catch(() => false);
}

ladeAlleVeroeffentlichungen();
