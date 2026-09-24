async function zeigeStudienfortschritt() {

  const uebersichtContainer =
    document.getElementById("studienfortschritt-uebersicht");

  const listeContainer =
    document.getElementById("studienfortschritt-liste");

  if (!uebersichtContainer || !listeContainer) return;


  /*
   * ---------------------------------------------------------
   * FRAGENANZAHL ERMITTELN (für die Punktzahl-Zeile im Zertifikat)
   * ---------------------------------------------------------
   *
   * Lädt das Markdown des Ratgebers nach und zählt die Fragen im
   * BONUS-Abschnitt per Regex - dieselbe Zeilen-Konvention wie in
   * js/buch.js (parseQuizAusBloecken): "**1. Frage-Text?**".
   *
   * Bewusst eine einfache, eigenständige Zählung statt der vollen
   * Markdown-zu-HTML-Pipeline aus buch.js: Die wäre hier nur mit
   * erheblichem Zusatzaufwand nutzbar (u.a. weil buch.js beim Laden
   * sofort Code ausführt, der von Elementen der Buch-Seite ausgeht
   * und auf dieser Seite crashen würde). Schlägt irgendetwas fehl
   * (kein Fetch, kein BONUS-Abschnitt, kein Treffer), liefert die
   * Funktion "null" - das Zertifikat lässt die Punktzahl-Zeile dann
   * einfach weg, statt eine falsche Zahl zu zeigen.
   */
  async function holeFragenanzahl(lehrgang) {
    try {

      const pfad = encodeURIComponent(lehrgang);
      const antwort = await fetch(`md/ratgeber/${pfad}.md`);

      if (!antwort.ok) return null;

      const markdown = await antwort.text();

      const bonusMatch =
        markdown.match(/^#\s*BONUS:.*$/m);

      if (!bonusMatch) return null;

      const abBonus =
        markdown.slice(
          bonusMatch.index + bonusMatch[0].length
        );

      const naechsteUeberschrift =
        abBonus.match(/^#\s+.*$/m);

      const bonusAbschnitt =
        naechsteUeberschrift
          ? abBonus.slice(0, naechsteUeberschrift.index)
          : abBonus;

      const fragen =
        bonusAbschnitt.match(
          /^\*\*\d+\.\s+.+\*\*\s*$/gm
        );

      return fragen && fragen.length > 0
        ? fragen.length
        : null;

    } catch {
      return null;
    }
  }


  try {

    /*
     * ---------------------------------------------------------
     * DATEN LADEN
     * ---------------------------------------------------------
     */

    const [ratgeber, fortschritt] = await Promise.all([

      ratgeberListe.filter(
        buch => istDatumErreicht(buch.erstellt)
      ),

      holeStudienfortschritt()

    ]);


    /*
     * ---------------------------------------------------------
     * ABGESCHLOSSENE LEHRGÄNGE
     * ---------------------------------------------------------
     */

    const abgeschlosseneIds = new Set(
      fortschritt.map(
        eintrag => Number(eintrag.ratgeber_id)
      )
    );


    /*
     * ---------------------------------------------------------
     * KATEGORIEN
     * ---------------------------------------------------------
     *
     * Die Reihenfolge kommt direkt aus RatgeberKategorie.
     * Dadurch bleibt die Darstellung unabhängig von der
     * Reihenfolge in ratgeberListe immer gleich.
     */

    const kategorien = Object.values(RatgeberKategorie)
      .map(kategorie => ({

        name: kategorie,

        lehrgaenge: ratgeber.filter(
          buch => buch.kategorie === kategorie
        )

      }))
      .filter(
        gruppe => gruppe.lehrgaenge.length > 0
      );


    /*
     * ---------------------------------------------------------
     * GESAMTFORTSCHRITT
     * ---------------------------------------------------------
     */

    const anzahlGesamt =
      ratgeber.length;


    const anzahlAbgeschlossen =
      ratgeber.filter(
        buch =>
          abgeschlosseneIds.has(
            Number(buch.id)
          )
      ).length;


    const gesamtProzent =
      anzahlGesamt > 0
        ? Math.round(
            anzahlAbgeschlossen /
            anzahlGesamt *
            100
          )
        : 0;


    /*
     * ---------------------------------------------------------
     * STUDIENFORTSCHRITT
     * ---------------------------------------------------------
     *
     * Für den Abschluss zählen maximal fünf abgeschlossene
     * Lehrgänge pro Kategorie.
     */

    const anzahlStudienKategorien =
      Object.values(RatgeberKategorie).length;


    const studiumGesamt =
      anzahlStudienKategorien * 5;


    let studiumAbgeschlossen = 0;


    kategorien.forEach(
      gruppe => {

        const abgeschlossen =
          gruppe.lehrgaenge.filter(
            buch =>
              abgeschlosseneIds.has(
                Number(buch.id)
              )
          ).length;


        studiumAbgeschlossen +=
          Math.min(abgeschlossen, 5);

      }
    );


    const studiumProzent =
      studiumGesamt > 0
        ? Math.round(
            studiumAbgeschlossen /
            studiumGesamt *
            100
          )
        : 0;


    /*
     * ---------------------------------------------------------
     * HILFSFUNKTION FÜR FORTSCHRITTSBALKEN
     * ---------------------------------------------------------
     */

    function progressBar(
      prozent,
      label
    ) {

      return `

        <div
          class="studienfortschritt-balken"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${prozent}"
          aria-label="${label}"
        >

          <div
            class="studienfortschritt-balken-fuellung"
            style="width: ${prozent}%"
          ></div>

        </div>

      `;

    }


    /*
     * ---------------------------------------------------------
     * KATEGORIEN-ÜBERSICHT
     * ---------------------------------------------------------
     */

    const kategorienHtml =
      kategorien
        .map(
          gruppe => {

            const abgeschlossen =
              gruppe.lehrgaenge.filter(
                buch =>
                  abgeschlosseneIds.has(
                    Number(buch.id)
                  )
              ).length;


            const gesamt =
              gruppe.lehrgaenge.length;


            const prozent =
              gesamt > 0
                ? Math.round(
                    abgeschlossen /
                    gesamt *
                    100
                  )
                : 0;


            return `

              <div class="studienfortschritt-kategorie">

                <div class="studienfortschritt-kategorie-kopf">

                  <strong>
                    ${gruppe.name}
                  </strong>

                  <span>
                    ${abgeschlossen} / ${gesamt}
                  </span>

                </div>

                ${progressBar(
                  prozent,
                  `Fortschritt ${gruppe.name}`
                )}

              </div>

            `;

          }
        )
        .join("");


    /*
     * ---------------------------------------------------------
     * LEHRGÄNGE NACH KATEGORIE
     * ---------------------------------------------------------
     */

    const lehrgaengeHtml =
      kategorien
        .map(
          gruppe => {

            const lehrgaenge =
              gruppe.lehrgaenge
                .map(
                  buch => {

                    const abgeschlossen =
                      abgeschlosseneIds.has(
                        Number(buch.id)
                      );


                    return `

                      <div
                        class="
                          studienfortschritt-eintrag
                          ${abgeschlossen
                            ? "abgeschlossen"
                            : ""}
                        "
                      >

                        <span
                          class="studienfortschritt-status"
                          aria-label="${
                            abgeschlossen
                              ? "Abgeschlossen"
                              : "Noch nicht abgeschlossen"
                          }"
                        >
                          ${
                            abgeschlossen
                              ? "✓"
                              : "○"
                          }
                        </span>

                        <span class="studienfortschritt-lehrgang">
                          ${buch.lehrgang}
                        </span>

                        ${
                          abgeschlossen
                            ? `
                              <button
                                type="button"
                                class="studienfortschritt-link studienfortschritt-zertifikat-button"
                                data-buch-id="${buch.id}"
                              >
                                🎓 Zertifikat
                              </button>
                            `
                            : `
                              <a
                                class="studienfortschritt-link"
                                href="buch.html?titel=${encodeURIComponent(buch.lehrgang)}"
                              >
                                Zum Ratgeber
                              </a>
                            `
                        }

                      </div>

                    `;

                  }
                )
                .join("");


            return `

              <section class="studienfortschritt-kategorie-liste">

                <h3>
                  ${gruppe.name}
                </h3>

                <div class="studienfortschritt-lehrgaenge">
                  ${lehrgaenge}
                </div>

              </section>

            `;

          }
        )
        .join("");


    /*
     * ---------------------------------------------------------
     * HTML AUSGEBEN
     * ---------------------------------------------------------
     */

    uebersichtContainer.innerHTML = `

      <h2>Dein Fortschritt</h2>

      <!-- GESAMT -->

      <div class="studienfortschritt-box">

          <h3>
              Alle Lehrgänge · ${anzahlAbgeschlossen} / ${anzahlGesamt}
          </h3>

          ${progressBar(
              gesamtProzent,
              "Gesamtfortschritt über alle Lehrgänge"
          )}

      </div>


      <!-- STUDIUM -->

      <div class="studienfortschritt-box">

          <h3>
              Methodius-Studium · ${studiumAbgeschlossen} / ${studiumGesamt}
          </h3>

          ${progressBar(
              studiumProzent,
              "Fortschritt für das Methodius-Studium"
          )}

          <p>
              Maximal fünf Lehrgänge pro Kategorie
              werden angerechnet.
          </p>

          ${
            studiumAbgeschlossen === studiumGesamt
              ? `
                <button
                  type="button"
                  id="urkunde-button"
                  class="quiz-zurueck-button"
                >
                  🎓 Urkunde herunterladen
                </button>
              `
              : ""
          }

      </div>


      <!-- KATEGORIEN -->

      <div class="studienfortschritt-box">

        <h3>Nach Kategorien</h3>

        <div class="studienfortschritt-kategorien">

          ${kategorienHtml}

        </div>

      </div>

    `;


    /*
     * =====================================================
     * URKUNDE-BUTTON
     * =====================================================
     */

    const urkundeButton =
      document.getElementById("urkunde-button");

    if (urkundeButton) {
      urkundeButton.addEventListener(
        "click",
        () => zeigeUrkundeDialog()
      );
    }


    /*
     * =====================================================
     * LEHRGÄNGE NACH KATEGORIE
     * =====================================================
     */

    listeContainer.innerHTML = `

      <h2>Deine Lehrgänge</h2>

      ${lehrgaengeHtml}

    `;


    /*
     * =====================================================
     * ZERTIFIKAT-BUTTONS
     * =====================================================
     *
     * "ratgeber" enthält bereits nur die aktuell relevanten Bücher
     * (siehe DATEN LADEN oben) - die Suche per buch.id darin reicht
     * also aus, ohne erneut auf ratgeberListe zuzugreifen.
     */

    listeContainer
      .querySelectorAll(".studienfortschritt-zertifikat-button")
      .forEach(button => {

        button.addEventListener("click", async () => {

          const buch =
            ratgeber.find(
              b => Number(b.id) === Number(button.dataset.buchId)
            );

          if (!buch) return;

          const textVorher = button.textContent;

          button.disabled = true;
          button.textContent = "Wird vorbereitet …";

          const anzahl =
            await holeFragenanzahl(buch.lehrgang);

          button.disabled = false;
          button.textContent = textVorher;

          zeigeZertifikatDialog(buch.lehrgang, anzahl);

        });

      });


  } catch (fehler) {

    console.error(
      "Fehler beim Anzeigen des Studienfortschritts:",
      fehler
    );


    const fehlermeldung = `

      <p>
        <em>
          Der Studienfortschritt konnte leider
          nicht geladen werden.
        </em>
      </p>

    `;

    uebersichtContainer.innerHTML = fehlermeldung;
    listeContainer.innerHTML = "";

  }

}


document.addEventListener(
  "DOMContentLoaded",
  zeigeStudienfortschritt
);