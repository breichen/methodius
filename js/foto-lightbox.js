/*
  Gemeinsame Logik für die Foto-Lightbox (Overlay #foto-lightbox,
  siehe Markup in institutsleben.html und news.html sowie die
  zugehörigen Styles in style.css unter "INSTITUT – FOTOS").

  Wird von jeder Seite eingebunden, die Bilder vergrößert anzeigen
  will (aktuell institutsleben.js und news-seite.js). Jede dieser
  Seiten:
  - ruft einmalig initialisiereFotoLightboxSchliessen() auf, um das
    Schließen per Klick auf das Overlay/den Schließen-Button oder per
    Escape-Taste zu aktivieren
  - ruft oeffneFotoLightbox(src, beschriftung) auf, wenn ein Bild
    angeklickt wird
*/

function oeffneFotoLightbox(src, beschriftung) {

  const lightbox =
    document.getElementById("foto-lightbox");

  const lightboxBild =
    document.getElementById("foto-lightbox-bild");

  const beschriftungElement =
    document.getElementById("foto-lightbox-beschriftung");

  if (!lightbox || !lightboxBild) return;

  lightboxBild.src = src;
  lightboxBild.alt = beschriftung || "";

  if (beschriftungElement) {
    beschriftungElement.textContent = beschriftung || "";
  }

  lightbox.classList.add("offen");
}

function schliesseFotoLightbox() {

  const lightbox =
    document.getElementById("foto-lightbox");

  if (lightbox) {
    lightbox.classList.remove("offen");
  }
}

// Einmalig pro Seite aufrufen - registriert die Schließen-Handler
// (Klick auf Overlay/Schließen-Button, Escape-Taste). Unabhängig
// davon, wie und wann die Bilder selbst geladen werden.
function initialisiereFotoLightboxSchliessen() {

  const lightbox =
    document.getElementById("foto-lightbox");

  if (!lightbox) return;

  lightbox.addEventListener("click", event => {

    if (
      event.target === lightbox ||
      event.target.classList.contains(
        "foto-lightbox-schliessen"
      )
    ) {
      schliesseFotoLightbox();
    }

  });

  document.addEventListener("keydown", event => {

    if (event.key === "Escape") {
      schliesseFotoLightbox();
    }

  });
}
