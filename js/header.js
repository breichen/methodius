/*
  Zentrale Definition des Seiten-Headers (Logo + Navigation).

  Muss nur noch HIER gepflegt werden - nicht mehr auf jeder einzelnen
  HTML-Seite einzeln. Einbindung auf jeder Seite:

    <body>

      <div id="header-platzhalter"></div>
      <script src="js/header.js"></script>

      ... restlicher Seiteninhalt ...

    </body>

  Der Platzhalter MUSS vor dem <script>-Tag stehen, damit das Script
  ihn beim Ausführen bereits im DOM vorfindet.

  Das Logo verlinkt bewusst IMMER auf index.html - auch auf der
  Startseite selbst. Das ist ein gängiges, einfaches Muster (viele
  Websites machen das genauso) und vermeidet Sonderfälle. Falls
  stattdessen auf der Startseite kein Link gewünscht ist, siehe
  Kommentar bei "istStartseite" weiter unten.
*/

function baueHeader() {
  return `
    <header class="site-header">
      <div class="wrap">
        <a href="index.html" class="logo">
          <img src="assets/favicon/methodius-512x512.png" alt="" class="logo-icon">
          <span>Dr. Methodius</span>
        </a>

        <nav>
          <ul>
            <li class="hat-untermenue">
              <a href="news.html">Aktuelles</a>

              <ul class="untermenue">
                <li><a href="news.html">Alles</a></li>
                <li><a href="news-veroeffentlichungen.html">Veröffentlichungen</a></li>
                <li><a href="news-institutsleben.html">Institutsleben</a></li>
                <li><a href="news-kuriositaeten.html">Kuriositäten des Alltags</a></li>
              </ul>
            </li>

            <li><a href="alle-ratgeber.html">Ratgeber</a></li>
            <li><a href="probleme.html">Fallakten</a></li>
            <li><a href="autor.html">Biographie</a></li>
            <li><a href="institut.html">Institut</a></li>
          </ul>
        </nav>
      </div>
    </header>
  `;
}

const headerPlatzhalter = document.getElementById("header-platzhalter");

if (headerPlatzhalter) {
  headerPlatzhalter.outerHTML = baueHeader();
} else {
  console.warn(
    "header.js: #header-platzhalter nicht gefunden - Header wird " +
    "stattdessen an den Anfang von <body> eingefügt."
  );
  document.body.insertAdjacentHTML("afterbegin", baueHeader());
}


/*
  Untermenü-Steuerung für "Aktuelles".

  - Klick auf "Aktuelles" öffnet bzw. schließt das Untermenü.
  - Das Untermenü ist immer vertikal.
  - Klick außerhalb schließt das Untermenü.
  - Escape schließt das Untermenü.
*/
(function () {
  document.addEventListener("click", function (ereignis) {
    const link = ereignis.target.closest(".hat-untermenue > a");
    const listenpunkt = document.querySelector(".hat-untermenue");

    if (!listenpunkt) return;

    if (link) {
      ereignis.preventDefault();

      const istOffen = listenpunkt.classList.toggle("offen");

      link.setAttribute("aria-expanded", String(istOffen));
      return;
    }

    // Klick außerhalb des Menüs -> Untermenü schließen
    if (!listenpunkt.contains(ereignis.target)) {
      listenpunkt.classList.remove("offen");

      const aktuellesLink = listenpunkt.querySelector(":scope > a");
      if (aktuellesLink) {
        aktuellesLink.setAttribute("aria-expanded", "false");
      }
    }
  });

  // Mit Escape schließen
  document.addEventListener("keydown", function (ereignis) {
    if (ereignis.key !== "Escape") return;

    const listenpunkt = document.querySelector(".hat-untermenue");
    if (!listenpunkt) return;

    listenpunkt.classList.remove("offen");

    const aktuellesLink = listenpunkt.querySelector(":scope > a");
    if (aktuellesLink) {
      aktuellesLink.setAttribute("aria-expanded", "false");
    }
  });
})();
