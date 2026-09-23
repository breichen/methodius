/*
  Zeigt eine einzelne Alltagsstudie.

  URL:
    alltagsstudie.html?titel=<slug>

  Die Studie besteht aus:
  - Titel
  - Bild
  - Markdown-Text
  - optionalem externen Link
  - optionalem Veröffentlichungsdatum

  Es gibt bewusst KEINE Kommentare.
*/


const parameter =
  new URLSearchParams(
    window.location.search
  );


const slug =
  parameter.get("titel");


const studie =
  alltagsstudienListe.find(
    eintrag =>
      eintrag.slug === slug
  );


const container =
  document.getElementById(
    "alltagsstudie-inhalt"
  );


/* ==========================================
   FEHLERFALL
   ========================================== */

if (!studie) {

  container.innerHTML = `

    <section class="section">

      <div class="wrap">

        <h1>
          Alltagsstudie nicht gefunden
        </h1>

        <p>
          Diese Studie gibt es (noch) nicht.
        </p>

        <p>
          <a href="alltagsstudien.html">
            Zur Übersicht der Alltagsstudien
          </a>
        </p>

      </div>

    </section>

  `;

}
else {

  /* ========================================
     SEITENTITEL
     ======================================== */

  document.title =
    `${studie.titel} – Dr. Methodius`;


  /* ========================================
     STUDIENNUMMER
     ======================================== */

  const index =
    alltagsstudienListe.findIndex(
      eintrag =>
        eintrag.slug === studie.slug
    );


  const nummer =
    index + 1;


  /* ========================================
     META
     ======================================== */

  const meta =
    document.getElementById(
      "alltagsstudie-meta"
    );


  const metaZeilen = [];


  if (nummer > 0) {

    metaZeilen.push(
      `<p class="buch-datum">
        AS-${String(nummer).padStart(3, "0")}
      </p>`
    );

  }


  if (studie.datum) {

    metaZeilen.push(
      `<p class="buch-datum">
        Datum:
        ${formatiereDatumDeutsch(studie.datum)}
      </p>`
    );

  }

  if (studie.einsender) {
    zeilen.push(`<p class="buch-datum">Vorgeschlagen von: ${studie.einsender}</p>`);
  }


  meta.innerHTML =
    metaZeilen.join("\n");


  /* ========================================
     TITEL
     ======================================== */

  document
    .getElementById(
      "alltagsstudie-titel"
    )
    .textContent =
      studie.titel;


      /* ========================================
     BILD
     ======================================== */

  const bildContainer =
    document.getElementById(
      "alltagsstudie-bild"
    );


  const pfad =
    encodeURIComponent(
      studie.slug
    );


  const bildPfad =
    `pics/alltagsstudien/${pfad}.png`;


  fetch(
    bildPfad,
    { method: "HEAD" }
  )

    .then(antwort => {

      if (!antwort.ok) {

        bildContainer.style.display =
          "none";

        return;

      }


      bildContainer.innerHTML = `

        <img
          src="${bildPfad}"
          alt="${studie.titel}"
          id="alltagsstudie-bild-img">

      `;


      const bild =
        document.getElementById(
          "alltagsstudie-bild-img"
        );


      if (!bild) return;


      bild.style.cursor = "zoom-in";


      bild.addEventListener(
        "click",
        () => {

          let lightbox =
            document.querySelector(
              ".foto-lightbox"
            );


          /*
            Lightbox beim ersten Klick erzeugen.
          */

          if (!lightbox) {

            lightbox =
              document.createElement("div");

            lightbox.className =
              "foto-lightbox";

            lightbox.innerHTML = `

              <button
                type="button"
                class="foto-lightbox-schliessen"
                aria-label="Bild schließen">

                ×

              </button>

              <img
                src=""
                alt="">

              <div
                class="foto-lightbox-beschriftung">
              </div>

            `;

            document.body.appendChild(
              lightbox
            );


            /*
              Klick auf den Hintergrund
              schließt die Lightbox.
            */

            lightbox.addEventListener(
              "click",
              event => {

                if (
                  event.target === lightbox
                ) {

                  lightbox.classList.remove(
                    "offen"
                  );

                }

              }
            );


            /*
              Schließen-Button
            */

            lightbox
              .querySelector(
                ".foto-lightbox-schliessen"
              )
              .addEventListener(
                "click",
                () => {

                  lightbox.classList.remove(
                    "offen"
                  );

                }
              );

          }


          const lightboxBild =
            lightbox.querySelector(
              "img"
            );


          const beschriftung =
            lightbox.querySelector(
              ".foto-lightbox-beschriftung"
            );


          lightboxBild.src =
            bild.src;

          lightboxBild.alt =
            bild.alt;

          beschriftung.textContent =
            studie.titel;


          lightbox.classList.add(
            "offen"
          );

        }
      );

    })

    .catch(() => {

      /*
        Falls die Bilddatei nicht erreichbar ist,
        wird der gesamte Bildbereich entfernt.
      */

      bildContainer.style.display =
        "none";

    });

    document.addEventListener("keydown", event => {

    if (event.key !== "Escape") return;

    const lightbox =
        document.querySelector(".foto-lightbox");

    if (lightbox) {
        lightbox.classList.remove("offen");
    }

    });


  /* ========================================
     MARKDOWN LADEN
     ======================================== */

  fetch(
    `md/alltagsstudien/${pfad}.md`
  )

    .then(antwort => {

      if (!antwort.ok) {
        throw new Error(
          "Datei nicht gefunden"
        );
      }

      return antwort.text();

    })

    .then(markdown => {

      /*
        Die bestehende Markdown-Funktion
        der Website wird wiederverwendet.
      */

      if (
        typeof parseMarkdownBloecke ===
        "function"
      ) {

        document
          .getElementById(
            "alltagsstudie-text"
          )
          .innerHTML =
            parseMarkdownBloecke(markdown)
              .join("\n");

      }
      else {

        /*
          Fallback, falls markdown.js auf dieser
          Seite noch nicht geladen wurde.
        */

        document
          .getElementById(
            "alltagsstudie-text"
          )
          .textContent =
            markdown;

      }

    })

    .catch(() => {

      document
        .getElementById(
          "alltagsstudie-text"
        )
        .innerHTML = `

          <p>
            <em>
              Der Text dieser Alltagsstudie konnte
              nicht geladen werden.
              Läuft die Seite über einen lokalen
              Server?
            </em>
          </p>

        `;

    });


  /* ========================================
     OPTIONALER EXTERNER LINK
     ======================================== */

  const linkContainer =
    document.getElementById(
      "alltagsstudie-link"
    );


  if (studie.link) {

    linkContainer.innerHTML = `

      <p>
        <a
          href="${studie.link}"
          target="_blank"
          rel="noopener noreferrer">

          ${studie.linkText || "Weitere Informationen"}

          ↗

        </a>
      </p>

    `;

  }

}
