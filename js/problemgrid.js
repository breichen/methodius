/*
  Befüllt bis zu drei Container auf den Problem-Seiten mit Karten aus
  problemeListe (aus js/probleme.js):

  - #alle-probleme        alle Probleme, in der Reihenfolge aus probleme.js
  - #neueste-probleme     die zuletzt hinzugefügten Probleme (neueste zuerst)
  - #zufaellige-probleme  eine zufällige Auswahl, bei jedem Laden neu gewürfelt

  Jede Karte ist bewusst kompakt gehalten (Fallnummer, Titel, Frage)
  und komplett anklickbar - Diagnose, Behandlung, wissenschaftliche
  Begründung und Prognose gibt es erst auf der vollständigen Fallakte
  (problem.html, siehe js/problem.js). Fehlt ein Container auf der
  aktuellen Seite, wird der jeweilige Schritt einfach übersprungen -
  so kann dieselbe Datei auf mehreren Seiten verwendet werden.
*/

// Wie viele Karten "Neueste Fallakten" bzw. "Zufällige Empfehlungen"
// jeweils anzeigen - dieselbe Anzahl wie bei den Ratgebern.
const ANZAHL_NEUESTE_PROBLEME = 3;
const ANZAHL_ZUFAELLIGE_PROBLEME = 3;

// Baut eine einzelne, komplett anklickbare Fallakten-Karte. "fallnummer"
// wird bewusst von außen übergeben (statt aus der Position in der
// jeweils angezeigten Teil-Liste berechnet) - so bleibt z.B.
// "Fall Nr. 004" auch dann dieselbe Nummer, wenn das Problem in
// "Neueste Fallakten" oder "Zufällige Empfehlungen" an anderer Stelle
// auftaucht als in der vollständigen Liste.
function baueProblemKarte(problem, fallnummer) {
  const nummerText = String(fallnummer).padStart(3, "0");

  return `
    <a class="problem-card-link" href="problem.html?titel=${encodeURIComponent(problem.titel)}">
      <article class="problem-card">
        <p class="problem-fallnummer">Fall Nr. ${nummerText}</p>
        <h3 class="problem-titel">${problem.titel}</h3>
        <p class="problem-frage">„${problem.frage}“</p>
      </article>
    </a>
  `;
}

// Rendert eine Liste von Problemen (mit ihrer jeweiligen Fallnummer aus
// der GESAMTEN problemeListe) in den Container mit der übergebenen ID.
// "leerText" wird angezeigt, falls problemeListe komplett leer ist.
function renderProblemKarten(containerId, probleme, leerText) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (!probleme.length) {
    container.innerHTML = `<p>${leerText}</p>`;
    return;
  }

  container.innerHTML = probleme
    .map(problem => baueProblemKarte(problem, problemeListe.indexOf(problem) + 1))
    .join("\n");
}

// Liefert "anzahl" zufällig ausgewählte, unterschiedliche Einträge aus
// "liste" (oder alle, falls weniger vorhanden sind als angefragt).
function waehleZufaelligeProbleme(liste, anzahl) {
  const kopie = [...liste];

  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }

  return kopie.slice(0, anzahl);
}

document.addEventListener("DOMContentLoaded", () => {
  const leerText = "Noch keine Fälle dokumentiert - reich dein Problem doch einfach ein!";

  // Alle Probleme, in der Reihenfolge aus probleme.js
  renderProblemKarten("alle-probleme", problemeListe, leerText);

  // Die zuletzt hinzugefügten Probleme, neueste zuerst
  const neueste = problemeListe.slice(-ANZAHL_NEUESTE_PROBLEME).reverse();
  renderProblemKarten("neueste-probleme", neueste, leerText);

  // Eine zufällige Auswahl, bei jedem Laden neu gewürfelt
  const zufaellige = waehleZufaelligeProbleme(problemeListe, ANZAHL_ZUFAELLIGE_PROBLEME);
  renderProblemKarten("zufaellige-probleme", zufaellige, leerText);
});