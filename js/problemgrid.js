/*
  Befüllt den Container #alle-probleme (auf probleme.html) mit einer
  Karte pro Problem aus problemeListe (aus js/probleme.js). Zeigt
  bewusst NUR Frage, Diagnose und Behandlung - "Wissenschaftliche
  Begründung" und Prognose gibt es erst auf der vollständigen
  Fallakte (problem.html, siehe js/problem.js).
*/

// Wandelt einfache Formatierung in Text-Feldern (aus probleme.js) in
// HTML um: **fett** wird zu <strong>, doppelte Zeilenumbrüche trennen
// Absätze, einfache Zeilenumbrüche werden zu <br>. Bewusst simpel
// gehalten (kein vollständiger Markdown-Parser nötig), da die Felder
// in probleme.js normalerweise nur kurze Texte enthalten.
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

// Baut eine einzelne Fallakten-Karte für die Übersicht.
function baueProblemKarte(problem, index) {
  const fallnummer = String(index + 1).padStart(3, "0");

  const einsenderHtml = problem.einsender
    ? `<p class="problem-einsender">Eingesendet von: ${problem.einsender}</p>`
    : "";

  return `
    <article class="problem-card">
      <p class="problem-fallnummer">Fall Nr. ${fallnummer}</p>
      <h3 class="problem-titel">${problem.titel}</h3>

      <p class="problem-frage">„${problem.frage}“</p>

      <p class="problem-label">🩺 Diagnose</p>
      ${formatiereProblemText(problem.diagnose)}

      <p class="problem-label">💊 Behandlung</p>
      ${formatiereProblemText(problem.behandlung)}

      ${einsenderHtml}

      <p class="problem-mehr">
        <a href="problem.html?titel=${encodeURIComponent(problem.titel)}">Vollständige Fallakte ansehen →</a>
      </p>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", () => {
  const container = document.getElementById("alle-probleme");
  if (!container) return;

  if (!problemeListe.length) {
    container.innerHTML =
      "<p>Noch keine Fälle dokumentiert - reich dein Problem doch einfach ein!</p>";
    return;
  }

  container.innerHTML = problemeListe.map(baueProblemKarte).join("\n");
});
