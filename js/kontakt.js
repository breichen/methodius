function baueKontaktOptionen() {

  const section =
    document.getElementById(
      "kontakt-optionen"
    );

  const container =
    document.getElementById(
      "kontakt-optionen-container"
    );

  if (!section || !container) return;


  const optionen = [

    {
      titel: "Ratgeber vorschlagen",

      beschreibung:
        "Du hast ein alltägliches Problem, zu dem das Methodius-Institut einmal wissenschaftlich fundiert Stellung nehmen sollte?",

      href: "ratgeber-vorschlagen.html"
    },

    {
      titel: "Problem einsenden",

      beschreibung:
        "Du stehst vor einer Frage, auf die du selbst keine zufriedenstellende Antwort findest? Schilder uns deinen Fall.",

      href: "problem-einsenden.html"
    },

    {
      titel: "Studie vorschlagen",

      beschreibung:
        "Du hast eine Beobachtung gemacht, die dringend empirisch untersucht werden sollte? Schlage uns eine Studie vor.",

      href: "studie-vorschlagen.html"
    },

    {
      titel: "Allgemeine Anfrage",

      beschreibung:
        "Für sonstige Fragen, Anregungen und Anliegen kannst du unser allgemeines Kontaktformular nutzen.",

      href: "https://tally.so/r/xXKrkk"
    }

  ];


  container.innerHTML = `

    <h2>Wie können wir dir helfen?</h2>

    <p>
      Wähle das Anliegen, das am besten zu deiner
      Nachricht passt.
    </p>

    <div class="kategorie-grid">

      ${optionen.map(
        option => `

          <a
            class="kategorie-card"
            href="${option.href}">

            <h3>${option.titel}</h3>

            <p>
              ${option.beschreibung}
            </p>

          </a>

        `
      ).join("")}

    </div>

  `;
}


document.addEventListener(
  "DOMContentLoaded",
  baueKontaktOptionen
);
