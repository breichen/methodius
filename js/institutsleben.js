const container =
  document.getElementById("institutsleben-galerie");

function ladeInstitutsfotos() {

  if (!container) return;

  fetch("data/fotos.json")
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error("Fotodatei nicht gefunden");
      }

      return antwort.json();
    })
    .then(fotos => {

      const sichtbareFotos =
        fotos.filter(
          foto => istDatumErreicht(foto.datum)
        );

      if (sichtbareFotos.length === 0) {

        container.innerHTML = `
          <p>
            Bisher wurden keine Fotos
            aus dem Institutsleben veröffentlicht.
          </p>
        `;

        return;
      }

      container.innerHTML = `
        <div class="institutsfoto-grid">

          ${sichtbareFotos.map(foto => `
            <figure class="institutsfoto">

              <img
                class="institutsfoto-klickbar"
                src="${foto.bild}"
                alt="${foto.titel}"
                data-bild="${foto.bild}"
                data-titel="${foto.titel}"
                loading="lazy">

              <figcaption>

                <p class="institutsfoto-datum">
                  ${formatiereDatumDeutsch(foto.datum)}
                </p>

                <h3>
                  ${foto.titel}
                </h3>

                ${
                  foto.beschreibung
                    ? `
                      <p>
                        ${foto.beschreibung}
                      </p>
                    `
                    : ""
                }

              </figcaption>

            </figure>
          `).join("\n")}

        </div>
      `;

      initialisiereLightbox();

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Fotos:",
        fehler
      );

      container.innerHTML = `
        <p>
          Die Fotos konnten leider
          nicht geladen werden.
        </p>
      `;
    });
}

function initialisiereLightbox() {

  initialisiereFotoLightboxSchliessen();

  document
    .querySelectorAll(".institutsfoto-klickbar")
    .forEach(bild => {

      bild.addEventListener("click", () => {
        oeffneFotoLightbox(bild.dataset.bild, bild.dataset.titel);
      });

    });
}

ladeInstitutsfotos();