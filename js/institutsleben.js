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

  const lightbox =
    document.getElementById("foto-lightbox");

  const lightboxBild =
    document.getElementById("foto-lightbox-bild");

  const beschriftung =
    document.getElementById(
      "foto-lightbox-beschriftung"
    );

  if (!lightbox || !lightboxBild) return;

  document
    .querySelectorAll(".institutsfoto-klickbar")
    .forEach(bild => {

      bild.addEventListener("click", () => {

        lightboxBild.src =
          bild.dataset.bild;

        lightboxBild.alt =
          bild.dataset.titel;

        beschriftung.textContent =
          bild.dataset.titel;

        lightbox.classList.add("offen");
      });

    });

  lightbox.addEventListener("click", event => {

    if (
      event.target === lightbox ||
      event.target.classList.contains(
        "foto-lightbox-schliessen"
      )
    ) {
      lightbox.classList.remove("offen");
    }

  });

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
      lightbox.classList.remove("offen");
    }

  });
}

ladeInstitutsfotos();