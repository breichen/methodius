/*
  Zeigt einen großen Einzel-Ratgeber auf der Startseite, ausgehend vom
  aktuellsten, mit Pfeilen zum Durchklicken durch die Chronologie.
  Setzt voraus, dass js/ratgeber.js (ratgeberListe) vor diesem Skript
  eingebunden ist.
*/

(function () {
  const cover = document.getElementById("showcase-cover");
  const link = document.getElementById("showcase-link");
  const prevBtn = document.getElementById("showcase-prev");
  const nextBtn = document.getElementById("showcase-next");

  if (!cover || typeof ratgeberListe === "undefined" || ratgeberListe.length === 0) return;

  // Nur Ratgeber anzeigen, die ein "erstellt"-Datum haben UND dessen
  // Datum bereits erreicht ist (heute oder in der Vergangenheit) -
  // siehe istDatumErreicht() in js/datumsformat.js. Ratgeber ohne
  // Datum oder mit einem Datum in der Zukunft werden im Showcase
  // ausgeblendet.
  const sichtbareRatgeberAlle = ratgeberListe.filter(
    buch => buch.erstellt && istDatumErreicht(buch.erstellt)
  );

  if (sichtbareRatgeberAlle.length === 0) return;

  // Chronologie, neuestes zuerst: Laut ratgeber.js werden neue Bücher
  // am ENDE der Liste ergänzt ("Neueste Ratgeber" zeigt die letzten
  // Einträge) - die Liste wird also einfach umgedreht.
  const chronologie = [...sichtbareRatgeberAlle].reverse();

  let index = 0; // 0 = aktuellster Ratgeber

  function zeigeAktuellen() {
    const buch = chronologie[index];
    const pfad = encodeURIComponent(buch.slug);

    cover.src = `pics/ratgeber-3d/${pfad}.png`;
    cover.alt = `Cover: ${buch.titel}`;
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