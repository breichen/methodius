async function zeigeStudienfortschritt() {

  const container =
    document.getElementById(
      "studienfortschritt"
    );

  if (!container) return;


  try {

    const [
      ratgeber,
      fortschritt
    ] = await Promise.all([

      ratgeberListe,

      holeStudienfortschritt()

    ]);


    const abgeschlosseneIds =
      new Set(
        fortschritt.map(
          eintrag =>
            Number(eintrag.ratgeber_id)
        )
      );


    const anzahlGesamt =
      ratgeber.length;

    const anzahlAbgeschlossen =
      ratgeber.filter(
        ratgeber =>
          abgeschlosseneIds.has(
            Number(ratgeber.id)
          )
      ).length;


    const prozent =
      anzahlGesamt > 0
        ? Math.round(
            anzahlAbgeschlossen /
            anzahlGesamt *
            100
          )
        : 0;


    container.innerHTML = `

      <div class="studienfortschritt-zusammenfassung">

        <p class="studienfortschritt-zaehler">
          <strong>
            ${anzahlAbgeschlossen}
          </strong>
          von
          <strong>
            ${anzahlGesamt}
          </strong>
          Ratgebern abgeschlossen
        </p>


        <div
          class="studienfortschritt-balken"
          role="progressbar"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow="${prozent}"
          aria-label="Studienfortschritt"
        >

          <div
            class="studienfortschritt-balken-fuellung"
            style="width: ${prozent}%"
          ></div>

        </div>


        <p class="studienfortschritt-prozent">
          ${prozent} %
        </p>

      </div>


      <div class="studienfortschritt-liste">

        <h2>Deine Ratgeber</h2>

        ${ratgeber.map(
          buch => {

            const abgeschlossen =
              abgeschlosseneIds.has(
                Number(buch.id)
              );

            return `

              <div
                class="studienfortschritt-eintrag${
                  abgeschlossen
                    ? " abgeschlossen"
                    : ""
                }"
              >

                <div>

                  <h3>
                    ${buch.titel}
                  </h3>

                  ${
                    abgeschlossen
                      ? `
                        <p class="studienfortschritt-status">
                          Abgeschlossen
                        </p>
                      `
                      : `
                        <p class="studienfortschritt-status">
                          Noch nicht abgeschlossen
                        </p>
                      `
                  }

                </div>

              </div>

            `;

          }
        ).join("")}

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
