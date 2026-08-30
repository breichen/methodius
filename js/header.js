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
            <li><a href="news.html">Aktuelles</a></li>
            <li><a href="alle-ratgeber.html">Ratgeber</a></li>
            <li><a href="probleme.html">Fallakten</a></li>
            <li><a href="autor.html">Biographie</a></li>
            <li><a href="institut.html">Institut</a></li>
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
