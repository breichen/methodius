/*
  Untermenü-Steuerung für Touch-Geräte.

  Der Header selbst steht jetzt fest im HTML (siehe _includes/header.njk),
  hier bleibt nur das Auf-/Zuklappen der Untermenüs per Tap.
  Am PC übernimmt weiterhin reines CSS (:hover / :focus-within).
*/
(function () {

  const istTouchGeraet =
    window.matchMedia("(hover: none), (pointer: coarse)").matches;

  if (!istTouchGeraet) return;

  function schliesseUntermenue(listenpunkt) {
    listenpunkt.classList.remove("offen");
  }

  document.querySelectorAll(".hat-untermenue > a")
    .forEach(link => {

      link.addEventListener("click", function (ereignis) {

        const listenpunkt = link.closest(".hat-untermenue");
        if (!listenpunkt) return;

        const istOffen = listenpunkt.classList.contains("offen");

        if (!istOffen) {

          ereignis.preventDefault();

          document
            .querySelectorAll(".hat-untermenue.offen")
            .forEach(anderer => {
              if (anderer !== listenpunkt) {
                schliesseUntermenue(anderer);
              }
            });

          listenpunkt.classList.add("offen");
        }
      });

    });

  document.addEventListener("click", function (ereignis) {

    document
      .querySelectorAll(".hat-untermenue.offen")
      .forEach(listenpunkt => {

        if (!listenpunkt.contains(ereignis.target)) {
          schliesseUntermenue(listenpunkt);
        }

      });

  });

})();


/*
  Debug-Elemente einblenden: Alles mit dem Attribut data-nur-debug
  (z.B. der Menüpunkt "Studierende des Monats" in _data/navigation.json
  oder die Karte in studium.html) ist im HTML "hidden" und wird nur
  eingeblendet, wenn der Debug-Modus aktiv ist (siehe js/datumsformat.js).

  Läuft nach DOMContentLoaded, damit datumsformat.js (falls die Seite es
  einbindet) schon geladen ist. Für Seiten ohne datumsformat.js gibt es
  einen kleinen Ersatz, der nur den gemerkten Zustand aus localStorage liest.
*/
(function () {

  function debugAktiv() {

    if (typeof istDebugModusAktiv === "function") {
      return istDebugModusAktiv();
    }

    const host = window.location.hostname;
    const lokal =
      host === "localhost" || host === "127.0.0.1" ||
      host === "[::1]" || /^192\.168\./.test(host);

    if (!lokal) return false;

    try {
      return localStorage.getItem("debugModus") === "1";
    } catch (fehler) {
      return false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {

    if (!debugAktiv()) return;

    document.querySelectorAll("[data-nur-debug]")
      .forEach(element => { element.hidden = false; });

  });

})();
