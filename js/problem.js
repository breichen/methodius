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

// Baut die optionale "Vorgeschlagen von: ..." / "Veröffentlicht: ..." /
// "Aktualisiert: ..."-Zeile - genau wie bei den Ratgebern (siehe
// js/buch.js), nur hier lokal, da Probleme keine eigene Datei haben.
function baueDatumsHinweis(problem) {
  const zeilen = [];

  if (problem.einsender) {
    zeilen.push(`<p class="buch-datum">Vorgeschlagen von: ${problem.einsender}</p>`);
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
    <p>Dieses Problem gibt es (noch) nicht. <a href="probleme.html">Zurück zur Übersicht</a>.</p>
  `;
} else {
  document.title = problem.titel + " – Dr. Maximilian Methodius";

  const datumsHtml = baueDatumsHinweis(problem);

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
      <button type="button" id="teilen-button" class="teilen-button">🔗 Teilen</button>
    </p>

    <p class="grid-link"><a href="probleme.html">← Zurück zur Übersicht</a></p>
  `;

  // Teilen-Button (siehe js/teilen.js) - erzeugt ein Kartenbild
  // (Fallnummer, Titel, Frage) und teilt es zusammen mit Titel + Link
  const fallnummer = String(problemeListe.indexOf(problem) + 1).padStart(3, "0");
  initTeilenButtonProblem(document.getElementById("teilen-button"), {
    titel: problem.titel,
    fallnummer,
    frage: problem.frage
  });
}