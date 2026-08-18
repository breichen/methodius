/*
  Zeigt EINEN Ratgeber groß an, mit Pfeilen zum Durchklicken der
  Chronologie. Start ist immer der aktuellste (= letzter Eintrag in
  ratgeberListe, siehe js/ratgeber.js), der linke Pfeil führt weiter
  zurück in die Vergangenheit, der rechte wieder nach vorne.
*/

let featuredIndex = ratgeberListe.length - 1;

function zeigeFeatured() {
  const buch = ratgeberListe[featuredIndex];
  const pfad = encodeURIComponent(buch.slug);

  document.getElementById("featured-cover").src = `pics/${pfad}.png`;
  document.getElementById("featured-cover").alt = `Cover: ${buch.titel}`;
  document.getElementById("featured-title").textContent = buch.titel;
  document.getElementById("featured-card").href = `buch.html?titel=${pfad}`;

  const istAktuellster = featuredIndex === ratgeberListe.length - 1;
  document.getElementById("featured-index").textContent = istAktuellster
    ? "Aktuellster Ratgeber"
    : `Ratgeber ${featuredIndex + 1} von ${ratgeberListe.length}`;

  document.getElementById("featured-prev").disabled = featuredIndex <= 0;
  document.getElementById("featured-next").disabled = featuredIndex >= ratgeberListe.length - 1;
}

document.getElementById("featured-prev").addEventListener("click", () => {
  if (featuredIndex > 0) {
    featuredIndex--;
    zeigeFeatured();
  }
});

document.getElementById("featured-next").addEventListener("click", () => {
  if (featuredIndex < ratgeberListe.length - 1) {
    featuredIndex++;
    zeigeFeatured();
  }
});

zeigeFeatured();
