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
                        >${PDF_ICON_SVG}</a>
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

// Uses currentColor so it inherits the link's color (see
// .institut-veroeffentlichung-pdf-link in style.css), instead of an
// emoji glyph whose own colors don't adapt to the page's palette.
const PDF_ICON_SVG = `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M15 2v5h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>
`;

ladeAlleVeroeffentlichungen();
