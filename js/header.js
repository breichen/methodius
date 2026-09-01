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

function baueRatgeberUntermenue() {

  const kategorien =
    Object.entries(RatgeberKategorieInfo);

  return `
    <li>
      <a href="alle-ratgeber.html">
        Alle
      </a>
    </li>

    ${kategorien.map(
      ([kategorie, info]) => `
        <li>
          <a
            href="alle-ratgeber.html?kategorie=${info.slug}">
            ${kategorie}
          </a>
        </li>
      `
    ).join("")}
  `;
}

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
            <li class="hat-untermenue">
              <a href="alle-ratgeber.html">Ratgeber</a>
              <ul class="untermenue">
                ${baueRatgeberUntermenue()}
              </ul>
            </li>
            <li><a href="probleme.html">Fallakten</a></li>
            <li><a href="autor.html">Biographie</a></li>
            <li class="hat-untermenue">
              <a href="institut.html">Institut</a>
              <ul class="untermenue">
                <li><a href="institut.html">Das Methodius-Institut</a></li>
                <li><a href="mitglieder.html">Mitglieder</a></li>
                <li><a href="veroeffentlichungen.html">Publikationen</a></li>
                <li><a href="institutsleben.html">Institutsleben</a></li>
              </ul>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  `;

  /*
    Alternative, falls die Startseite KEINEN Logo-Link haben soll:

    const istStartseite =
      location.pathname.endsWith("index.html") ||
      location.pathname.endsWith("/");

    const logoHtml = istStartseite
      ? `<span class="logo">
           <img src="assets/favicon/methodius-512x512.png" alt="" class="logo-icon">
           <span>Dr. Methodius</span>
         </span>`
      : `<a href="index.html" class="logo">
           <img src="assets/favicon/methodius-512x512.png" alt="" class="logo-icon">
           <span>Dr. Methodius</span>
         </a>`;

    ... und dann ${logoHtml} statt der festen <a>...</a> oben verwenden.
  */
}

const headerPlatzhalter = document.getElementById("header-platzhalter");

if (headerPlatzhalter) {
  headerPlatzhalter.outerHTML = baueHeader();
} else {
  // Fallback, falls der Platzhalter auf einer Seite vergessen wurde:
  // Header trotzdem ganz vorne in <body> einfügen, statt dass die
  // Seite ohne Header dasteht.
  console.warn(
    "header.js: #header-platzhalter nicht gefunden - Header wird " +
    "stattdessen an den Anfang von <body> eingefügt."
  );
  document.body.insertAdjacentHTML("afterbegin", baueHeader());
}

/*
  Untermenü-Steuerung (z.B. für "Aktuelles" und "Institut").

  - Am PC (Hover-fähige Geräte) übernimmt reines CSS das Ein-/Ausblenden
    beim Drüberfahren (siehe :hover / :focus-within in der CSS-Datei).
    Der Klick auf den Menüpunkt selbst navigiert dabei ganz normal weiter.
  - Am Handy/Tablet (kein Hover) gibt es stattdessen den kleinen Pfeil-
    Button daneben: ein Tap klappt das jeweilige Untermenü auf/zu, ohne
    dass man dafür die Seite verlässt.

  Es kann mehrere Menüpunkte mit Untermenü gleichzeitig geben - deshalb
  wird hier immer mit allen ".hat-untermenue"-Elementen gearbeitet
  (nicht nur mit dem ersten), und beim Öffnen eines Untermenüs werden
  alle anderen automatisch geschlossen.
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

        const istOffen =
          listenpunkt.classList.contains("offen");

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