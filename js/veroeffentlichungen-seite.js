/*
  Lädt ALLE Veröffentlichungen aus data/veroeffentlichungen.json und
  zeigt sie vollständig an (im Gegensatz zu js/institutseite.js, das
  auf der Institutsseite nur die INSTITUT_VEROEFFENTLICHUNGEN_ANZAHL
  neuesten zeigt und hierher verlinkt).
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
      // Newest first, same as on the person detail pages. Sorted
      // explicitly so the page doesn't depend on the JSON order.
      const sichtbareVeroeffentlichungen = veroeffentlichungen
        .filter(
          veroeffentlichung => istDatumErreicht(veroeffentlichung.datum)
        )
        .sort((a, b) => new Date(b.datum) - new Date(a.datum));

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

                ${erzeugePdfLink(veroeffentlichung.slug, pdfVorhandenListe[index])}

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

// prüfePdfExistenz() und PDF_ICON_SVG kommen aus js/pdf-icon.js

ladeAlleVeroeffentlichungen();
