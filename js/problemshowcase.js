/*
  Steuert den "Aktuellster Fall"-Showcase auf der Startseite - ähnlich
  zu js/showcase.js für die Ratgeber. Zeigt standardmäßig den
  neuesten Fall aus problemeListe (letzter Eintrag, siehe
  js/probleme.js) und erlaubt es, über die Pfeile durch alle Fälle zu
  blättern (älter/neuer).
*/

document.addEventListener("DOMContentLoaded", () => {
  const showcase = document.getElementById("problem-showcase");
  const link = document.getElementById("problem-showcase-link");
  if (!showcase || !link) return; // Läuft nur auf Seiten mit diesem Showcase

  if (!problemeListe.length) {
    // Noch keine Fälle vorhanden -> Showcase lieber ganz ausblenden,
    // statt eine leere Karte anzuzeigen.
    showcase.style.display = "none";
    return;
  }

  const fallnummerEl = document.getElementById("problem-showcase-fallnummer");
  const titelEl = document.getElementById("problem-showcase-title");
  const frageEl = document.getElementById("problem-showcase-frage");
  const prevBtn = document.getElementById("problem-showcase-prev");
  const nextBtn = document.getElementById("problem-showcase-next");

  // Start beim neuesten Fall - Probleme werden wie Ratgeber am ENDE
  // der Liste ergänzt, der letzte Eintrag ist also der aktuellste.
  let index = problemeListe.length - 1;

  function zeigeFall() {
    const problem = problemeListe[index];
    const fallnummer = String(index + 1).padStart(3, "0");

    fallnummerEl.textContent = `Fall Nr. ${fallnummer}`;
    titelEl.textContent = problem.titel;
    frageEl.textContent = `„${problem.frage}“`;
    link.href = `problem.html?titel=${encodeURIComponent(problem.titel)}`;

    // Wie beim Ratgeber-Showcase: der LINKE Pfeil ("Vorheriger") führt zu
    // neueren Fällen, der RECHTE Pfeil ("Nächster") zu älteren. Start ist
    // der neueste Fall, daher ist "Vorheriger" anfangs deaktiviert.
    prevBtn.disabled = index >= problemeListe.length - 1;
    nextBtn.disabled = index <= 0;
  }

  prevBtn.addEventListener("click", () => {
    if (index < problemeListe.length - 1) {
      index++;
      zeigeFall();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
      zeigeFall();
    }
  });

  zeigeFall();
});