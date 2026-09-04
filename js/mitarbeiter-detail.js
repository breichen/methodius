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

      const html =
        publikationen.map(veroeffentlichung => {

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

                <h3>
                ${veroeffentlichung.titel}
                </h3>

                ${
                autorenText
                    ? `
                    <p class="institut-veroeffentlichung-autoren">
                        ${autorenText}
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

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Publikationen:",
        fehler
      );

    });

}