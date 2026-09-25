const params =
  new URLSearchParams(location.search);

const slug =
  params.get("person");

const person =
  mitarbeiter.find(
    mitarbeiter => mitarbeiter.slug === slug
  );

const container =
  document.getElementById("mitarbeiter-inhalt");

if (!person) {

  container.innerHTML = `
    <section class="section">
      <div class="wrap">
        <h1>Mitarbeiter nicht gefunden</h1>
      </div>
    </section>
  `;

} else {

  document.title =
    `${person.name} – Dr. Methodius`;

  const lebenslauf =
    person.lebenslauf
      .map(eintrag => `<li>${eintrag}</li>`)
      .join("");

  const aufgaben =
    person.aufgaben
      .map(eintrag => `<li>${eintrag}</li>`)
      .join("");

 container.innerHTML = `

    <section class="section">
        <div class="wrap">

        <h1>${person.name}</h1>

        <div class="mitarbeiter-header">

            <img
            src="${person.bild}"
            alt="Porträt von ${person.name}"
            class="mitarbeiter-bild">

            <div class="mitarbeiter-header-text">

            <p class="mitarbeiter-rolle">
                ${person.rolle}
            </p>

            <p class="mitarbeiter-kurztext">
                ${person.text}
            </p>

            </div>

        </div>

        </div>
    </section>

    <section class="section section-alt">
    <div class="wrap">

        <h2>Kontakt</h2>

        <div class="mitarbeiter-fakten">

        <div class="kontakt-box">
            <h3>Raum</h3>
            <p>${person.raum}</p>
        </div>

        <div class="kontakt-box">
            <h3>${person.sprechstundeTitel}</h3>

            ${person.sprechstunden
                .map(zeit => `
                <div class="sprechzeit">
                    ${zeit}
                </div>
                `)
                .join("")}
            </div>

        </div>

    </div>
    </section>

    <section class="section">
        <div class="wrap">

        <h2>Aufgaben</h2>

        <ul>
            ${aufgaben}
        </ul>

        </div>
    </section>

    <section class="section section-alt">
        <div class="wrap">

        <h2>Biographische Stationen</h2>

        <ul>
            ${lebenslauf}
        </ul>

        </div>
    </section>

    `;

  ladePublikationen(person);
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

function ladePublikationen(person) {

  fetch("data/veroeffentlichungen.json")
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error(
          "Veröffentlichungsdatei nicht gefunden"
        );
      }

      return antwort.json();
    })
    .then(veroeffentlichungen => {

      const sichtbareVeroeffentlichungen =
        veroeffentlichungen.filter(
            veroeffentlichung =>
            istDatumErreicht(veroeffentlichung.datum)
        );

        const publikationen =
        sichtbareVeroeffentlichungen.filter(
            veroeffentlichung =>
            Array.isArray(veroeffentlichung.autoren) &&
            veroeffentlichung.autoren.includes(person.name)
        );

      if (publikationen.length === 0) {
        return;
      }

      publikationen.sort(
        (a, b) => new Date(b.datum) - new Date(a.datum)
        );

      // Check PDF availability for every entry before rendering, so
      // the icon is present from the start instead of popping in
      // after the fact.
      Promise.all(
        publikationen.map(
          veroeffentlichung => prüfePdfExistenz(veroeffentlichung.slug)
        )
      ).then(pdfVorhandenListe => {

        const html =
          publikationen.map((veroeffentlichung, index) => {

              const weitereAutoren =
              veroeffentlichung.autoren.filter(
                  autor => autor !== person.name
              );

              const autorenText =
              weitereAutoren.length > 0
                  ? `mit ${weitereAutoren.join(", ")}`
                  : "";

              return `
              <article class="institut-veroeffentlichung">

                  <p class="institut-veroeffentlichung-datum">
                    ${formatiereDatumDeutsch(veroeffentlichung.datum)}
                  </p>

                  ${
                    autorenText
                      ? `
                        <p class="institut-veroeffentlichung-autoren">
                          ${autorenText}
                        </p>
                      `
                      : ""
                  }

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
                          <em>${veroeffentlichung.journal}</em>${veroeffentlichung.band != null ? `, Bd. ${veroeffentlichung.band}` : ""}${veroeffentlichung.heft != null ? `, Heft ${veroeffentlichung.heft}` : ""}${veroeffentlichung.seite_start != null && veroeffentlichung.seite_ende != null ? `, ${veroeffentlichung.seite_start}&ndash;${veroeffentlichung.seite_ende}` : ""}
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
              `;

          }).join("");

        document
          .getElementById("mitarbeiter-inhalt")
          .insertAdjacentHTML(
            "beforeend",
            `
              <section class="section">
                <div class="wrap">

                  <h2>Publikationen</h2>

                  ${html}

                </div>
              </section>
            `
          );
      });

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Publikationen:",
        fehler
      );

    });

}
