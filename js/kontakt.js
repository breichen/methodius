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

      tallyId: "WOVKGa"
    },

    {
      titel: "Problem einsenden",

      beschreibung:
        "Du stehst vor einer Frage, auf die du selbst keine zufriedenstellende Antwort findest? Schilder uns deinen Fall.",

      tallyId: "VLObgg"
    },

    {
      titel: "Studie vorschlagen",

      beschreibung:
        "Du hast eine Beobachtung gemacht, die dringend empirisch untersucht werden sollte? Schlage uns eine Studie vor.",

      tallyId: "PdKjxb"
    },

    {
      titel: "Als studierende Person des Monats bewerben",

      beschreibung:
        "Du hast im Methodius-Studium Außergewöhnliches geleistet – oder zumindest etwas, das wir so nennen? Dann bewirb dich.",

      // Dieselbe Tally-ID wie der Button auf studierende-des-monats.html
      tallyId: "jadNJE",

      // Nur im Debug-Modus sichtbar. Zum Veröffentlichen diese Zeile
      // (und das Komma davor) löschen.
      nurDebug: true
    },

    {
      titel: "Allgemeine Anfrage",

      beschreibung:
        "Für sonstige Fragen, Anregungen und Anliegen kannst du unser allgemeines Kontaktformular nutzen.",

      tallyId: "xXKrkk"
    },

  ];


  // Optionen mit "nurDebug" erscheinen nur im Debug-Modus
  // (istDebugModusAktiv() kommt aus js/datumsformat.js).
  const sichtbareOptionen = optionen.filter(
    option => !option.nurDebug || istDebugModusAktiv()
  );


  container.innerHTML = `

    <h2>Wie können wir dir helfen?</h2>

    <p>
      Wähle das Anliegen, das am besten zu deiner
      Nachricht passt.
    </p>

    <div class="kategorie-grid">

      ${sichtbareOptionen.map(
        option => `

          <a
            class="kategorie-card"
            href="#"
            data-tally-open="${option.tallyId}"
            data-tally-layout="modal">
          
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
