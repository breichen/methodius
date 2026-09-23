async function zeigeStudienfortschritt() {

  const container =
    document.getElementById("studienfortschritt");

  if (!container) return;


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

    container.innerHTML = `

      <div class="studienfortschritt-uebersicht">
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

        </div>


        <!-- KATEGORIEN -->

        <div class="studienfortschritt-box">

          <h3>Nach Kategorien</h3>

          <div class="studienfortschritt-kategorien">

            ${kategorienHtml}

          </div>

        </div>

      </div>


      <!-- =====================================================
           LEHRGÄNGE NACH KATEGORIE
           ===================================================== -->

      <div class="studienfortschritt-liste">

        <h2>Deine Lehrgänge</h2>

        ${lehrgaengeHtml}

      </div>

    `;


  } catch (fehler) {

    console.error(
      "Fehler beim Anzeigen des Studienfortschritts:",
      fehler
    );


    container.innerHTML = `

      <p>
        <em>
          Der Studienfortschritt konnte leider
          nicht geladen werden.
        </em>
      </p>

    `;

  }

}


document.addEventListener(
  "DOMContentLoaded",
  zeigeStudienfortschritt
);