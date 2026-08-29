/*
  Liest den Titel aus der URL (?titel=...), sucht das passende Problem
  in problemeListe (aus js/probleme.js) und zeigt die vollständige
  Fallakte an - inklusive "Wissenschaftliche Begründung" und Prognose,
  die auf der Übersicht (probleme.html) bewusst nicht zu sehen sind.
*/

const container = document.getElementById("problem-inhalt");

// Wandelt einfache Formatierung in Text-Feldern (aus probleme.js) in
// HTML um: **fett** wird zu <strong>, doppelte Zeilenumbrüche trennen
// Absätze, einfache Zeilenumbrüche werden zu <br>.
function formatiereProblemText(text) {
  const escaped = String(text || "");

  return escaped
    .split(/\n\s*\n/)
    .map(absatz => {
      const mitFett = absatz.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      return `<p>${mitFett.replace(/\n/g, "<br>")}</p>`;
    })
    .join("\n");
}

// Baut die optionale "Eingesendet von: ..." / "Veröffentlicht: ..." /
// "Aktualisiert: ..."-Zeile - genau wie bei den Ratgebern (siehe
// js/buch.js), nur hier lokal, da Probleme keine eigene Datei haben.
function baueDatumsHinweis(problem) {
  const zeilen = [];

  if (problem.einsender) {
    zeilen.push(`<p class="buch-datum">Eingesendet von: ${problem.einsender}</p>`);
  }

  if (problem.erstellt) {
    zeilen.push(`<p class="buch-datum">Veröffentlicht: ${problem.erstellt}</p>`);
  }

  if (problem.aktualisiert) {
    zeilen.push(`<p class="buch-datum">Aktualisiert: ${problem.aktualisiert}</p>`);
  }

  return zeilen.length
    ? `<div class="buch-datums-hinweis">${zeilen.join("\n")}</div>`
    : "";
}

// URL-Parameter auslesen, z.B. "Der ewige Gruppenchat" aus
// problem.html?titel=Der%20ewige%20Gruppenchat
const parameter = new URLSearchParams(window.location.search);
const titelParam = parameter.get("titel");
const problem = problemeListe.find(p => p.titel === titelParam);

if (!problem) {
  // Falscher oder fehlender Link -> freundliche Fehlermeldung statt kaputter Seite
  container.innerHTML = `
    <h1>Fallakte nicht gefunden</h1>
    <p>Dieses Problem gibt es (noch) nicht. <a href="probleme.html">Zur Übersicht</a>.</p>
  `;
} else {
  document.title = problem.titel + " – Dr. Maximilian Methodius";

  const datumsHtml = baueDatumsHinweis(problem);

  // Fallnummer (z.B. "001") wird weiterhin für die Teilen-Karte
  // gebraucht (siehe initTeilenButtonProblem unten).
  const fallnummer = String(problemeListe.indexOf(problem) + 1).padStart(3, "0");

  // Dateiname der Kommentar-Datei (md/fallakten-kommentare/<...>.md):
  // Bevorzugt das optionale, garantiert eindeutige "id"-Feld aus
  // problemeListe (siehe js/probleme.js); ist keine ID gesetzt, wird
  // ersatzweise der Titel verwendet. Der Titel ist NICHT zwingend
  // eindeutig - bei doppelten Titeln landen die Kommentare dann
  // versehentlich auf derselben Datei/Fallakte. Für neue oder
  // umbenannte Fallakten daher am besten immer eine "id" vergeben.
  const kommentarSlug = problem.id || problem.titel;

  container.innerHTML = `
    ${datumsHtml}
    <h1>${problem.titel}</h1>

    <div class="problem-block problem-frage-block">
      <p class="problem-label">🗒️ Eingesandtes Problem</p>
      <p class="problem-frage-text">„${problem.frage}“</p>
    </div>

    <div class="problem-block">
      <p class="problem-label">🩺 Diagnose</p>
      ${formatiereProblemText(problem.diagnose)}
    </div>

    <div class="problem-block">
      <p class="problem-label">💊 Behandlung</p>
      ${formatiereProblemText(problem.behandlung)}
    </div>

    <div class="problem-block">
      <p class="problem-label">🔬 Wissenschaftliche Begründung</p>
      ${formatiereProblemText(problem.begruendung)}
    </div>

    <div class="problem-block">
      <p class="problem-label">📈 Prognose</p>
      ${formatiereProblemText(problem.prognose)}
    </div>

    <p class="blaettern-wrap">
      <a href="#fallakten-kommentare" id="kommentar-link" class="kommentar-link">
        💬 <span id="kommentar-link-text">Kommentare</span>
      </a>

      <button type="button" id="teilen-button" class="teilen-button">🔗 Teilen</button>
    </p>

    <p class="grid-link"><a href="probleme.html">← Zur Übersicht</a></p>
  `;

  // Teilen-Button (siehe js/teilen.js) - erzeugt ein Kartenbild
  // (Fallnummer, Titel, Frage, Diagnose, Behandlung) und teilt es
  // zusammen mit Titel + Link
  initTeilenButtonProblem(document.getElementById("teilen-button"), {
    titel: problem.titel,
    fallnummer,
    frage: problem.frage,
    diagnose: problem.diagnose,
    behandlung: problem.behandlung
  });

  // Kommentarbereich (siehe js/kommentare.js) - gleiche Logik wie bei
  // den Ratgebern, nur mit eigenem Ordner/Container/Anker.
  ladeKommentare({
    slug: kommentarSlug,
    ordner: "fallakten-kommentare",
    containerId: "problem-inhalt",
    sectionId: "fallakten-kommentare"
  });
}