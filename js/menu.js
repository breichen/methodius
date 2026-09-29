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
