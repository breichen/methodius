const container = document.getElementById("institut-inhalt");

// Team und Veröffentlichungen hängen (anders als der Rest der
// Institutsseite) nicht von institut.md ab - der Team-Bereich ist
// fest hinterlegt, die Veröffentlichungen kommen aus
// data/veroeffentlichungen.json. Beide Bereiche können deshalb sofort
// gebaut werden.
container.innerHTML =
  baueMitgliederEinleitung();


/*
 * Kurze Einleitung ganz oben auf der Seite (Position 0, also immer
 * mit der regulären Hintergrundfarbe).
 */
function baueMitgliederEinleitung() {
  const teamBereich = baueTeamBereich();

  return `
    <section class="section institut-section">
      <div class="wrap">

        <h1>Mitglieder des Instituts</h1>

        ${teamBereich}

      </div>
    </section>
  `;
}


function baueTeamBereich() {

  const team = mitarbeiter;

  const karten = team.map(person => `
    <article class="team-card">

      <div class="team-photo-wrap">
        <a href="mitarbeiter.html?person=${person.slug}">
          <img
            class="team-photo"
            src="${person.bild}"
            alt="Porträt von ${person.name}">
        </a>
      </div>

      <div class="team-card-content">

        <h3>
          <a
            class="team-link"
            href="mitarbeiter.html?person=${person.slug}">
            ${person.name}
          </a>
        </h3>

        <p class="team-role">
          ${person.rolle}
        </p>

        <p>
          ${person.text}
        </p>

      </div>

    </article>
  `).join("\n");

  return `
    <p class="team-intro">
      Hinter jeder erfolgreichen Untersuchung steht ein
      Team hochqualifizierter Mitarbeiter.
      Zumindest laut Institutsleitung.
    </p>

    <div class="team-grid">
      ${karten}
    </div>
  `;
}