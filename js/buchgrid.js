/*
  Baut die Buch-Kacheln für "Neueste Ratgeber" und "Zufällige Empfehlungen".
  Nutzt die Daten aus js/ratgeber.js (Datei muss VOR dieser hier geladen werden).
*/

// Erzeugt das HTML für eine Buch-Kachel: Bild + Titel, verlinkt auf buch.html
function baueBuchKachel(buch) {
  // encodeURIComponent macht aus Leerzeichen, Kommas, Klammern etc. eine
  // gültige URL (z.B. "Die Kunst, beschäftigt..." -> "Die%20Kunst%2C%20...").
  // Ohne das findet der Browser Dateien mit solchen Zeichen im Namen nicht zuverlässig.
  const pfad = encodeURIComponent(buch.slug);
  return `
    <a class="book-card" href="buch.html?titel=${pfad}">
      <img src="pics/ratgeber/${pfad}.png" alt="Cover: ${buch.titel}">
      <span class="book-title">${buch.titel}</span>
    </a>
  `;
}

// Mischt ein Array zufällig (Fisher-Yates-Algorithmus)
function mischen(array) {
  const kopie = [...array];
  for (let i = kopie.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [kopie[i], kopie[j]] = [kopie[j], kopie[i]];
  }
  return kopie;
}

const gefilterteRatgeber = holeGefilterteRatgeber();

// "Neueste Ratgeber": die letzten N Einträge der Liste, neuestes zuerst
// (nur befüllen, wenn der Container auf der aktuellen Seite existiert)
const containerNeueste = document.getElementById("neueste-ratgeber");
if (containerNeueste) {
  const neueste = gefilterteRatgeber.slice(-ANZAHL_ANZEIGEN).reverse();
  containerNeueste.innerHTML = neueste.map(baueBuchKachel).join("");
}

// "Zufällige Empfehlungen": N zufällig gemischte Einträge
const containerZufaellige = document.getElementById("zufaellige-empfehlungen");
if (containerZufaellige) {
  const zufaellige = mischen(gefilterteRatgeber).slice(0, ANZAHL_ANZEIGEN);
  containerZufaellige.innerHTML = zufaellige.map(baueBuchKachel).join("");
}