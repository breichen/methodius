/*
  Zeigt einen großen Einzel-Ratgeber auf der Startseite, ausgehend vom
  aktuellsten, mit Pfeilen zum Durchklicken durch die Chronologie.
  Setzt voraus, dass js/ratgeber.js (ratgeberListe) vor diesem Skript
  eingebunden ist.
*/

(function () {
  const cover = document.getElementById("showcase-cover");
  const titel = document.getElementById("showcase-title");
  const link = document.getElementById("showcase-link");
  const prevBtn = document.getElementById("showcase-prev");
  const nextBtn = document.getElementById("showcase-next");

  if (!cover || typeof ratgeberListe === "undefined" || ratgeberListe.length === 0) return;

  // Chronologie, neuestes zuerst: Laut ratgeber.js werden neue Bücher
  // am ENDE der Liste ergänzt ("Neueste Ratgeber" zeigt die letzten
  // Einträge) - die Liste wird also einfach umgedreht.
  const chronologie = [...ratgeberListe].reverse();

  let index = 0; // 0 = aktuellster Ratgeber

  function zeigeAktuellen() {
    const buch = chronologie[index];
    const pfad = encodeURIComponent(buch.slug);

    cover.src = `pics/ratgeber/${pfad}.png`;
    cover.alt = `Cover: ${buch.titel}`;
    titel.textContent = buch.titel;
    link.href = `buch.html?titel=${pfad}`;

    prevBtn.disabled = index <= 0;
    nextBtn.disabled = index >= chronologie.length - 1;
  }

  prevBtn.addEventListener("click", () => {
    if (index > 0) {
      index--;
      zeigeAktuellen();
    }
  });

  nextBtn.addEventListener("click", () => {
    if (index < chronologie.length - 1) {
      index++;
      zeigeAktuellen();
    }
  });

  zeigeAktuellen();
})();