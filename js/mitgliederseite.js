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

  const team = [
    {
      name: "Dr. Maximilian Methodius",
      rolle: "Gründer und Direktor",
      bild: "pics/team/autor-portrait.png",
      text: "Gründer des Instituts und wissenschaftlicher Leiter. Verfügt über umfassende Kenntnisse in praktisch allen Gebieten, die dringend einer Expertenmeinung bedürfen. Entwickelt die zentralen Theorien des Instituts, verfasst die Ratgeber und trifft die abschließenden Entscheidungen."
    },
    {
      name: "Prof. Dr. Hildegard Wankelmuth",
      rolle: "Leitung der Abteilung für angewandte Fehlberatung",
      bild: "pics/team/Wankelmuth.png",
      text: "Beschäftigt sich mit der kontrollierten Überinterpretation alltäglicher Verhaltensweisen und der Entwicklung wissenschaftlich fragwürdiger Behandlungsmethoden."
    },
    {
      name: "Dr. Konrad P. Huber",
      rolle: "Leitung der Abteilung für Statistik und empirische Plausibilität",
      bild: "pics/team/Huber.png",
      text: "Spezialist für statistische Auswertungen und eindeutige Aussagen bei uneindeutiger Datenlage."
    },
    {
      name: "Dr. Friedrich Unbedacht",
      rolle: "Wissenschaftlicher Beirat",
      bild: "pics/team/Unbedacht.png",
      text: "Zuständig für die wissenschaftliche Überprüfung der Institutsarbeit. Weist regelmäßig auf unbelegte Behauptungen, methodische Schwächen und logische Widersprüche hin. Seine Einwände werden sorgfältig protokolliert und anschließend ignoriert."
    },
    {
      name: "Sabine Krämer",
      rolle: "Leitung der Abteilung für Fallmanagement und Patientenangelegenheiten",
      bild: "pics/team/Kraemer.png",
      text: "Koordiniert die eingehenden Fälle, verwaltet die Fallakten und versucht seit Jahren, innerhalb des Instituts für Ordnung zu sorgen."
    }
  ];

  const karten = team.map(person => `
    <article class="team-card">

      <div class="team-photo-wrap">
        <img
          class="team-photo"
          src="${person.bild}"
          alt="Porträt von ${person.name}">
      </div>

      <div class="team-card-content">

        <h3>${person.name}</h3>

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