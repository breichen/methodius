/*
  Filter-Logik für die Fallakten-Übersicht (probleme.html).

  Analog zu js/ratgeber-filter.js: filtert problemeListe zunächst nach
  dem "erstellt"-Datum (siehe istDatumErreicht() in
  js/datumsformat.js) und zusätzlich - sobald einzelne Fallakten eine
  Kategorie bekommen - nach der Kategorie aus dem URL-Parameter
  ?kategorie=...

  Eine Fallakte erhält eine Kategorie, indem in js/probleme.js beim
  jeweiligen Eintrag optional "kategorie: ..." angegeben wird, z. B.:

    { slug: "mein-fall", titel: "Mein Fall", erstellt: "2026-08-27", kategorie: ProblemKategorie.ALLGEMEIN }

  Verwendet wird dabei ein EIGENES Kategorien-Enum für Fallakten
  (ProblemKategorie / ProblemKategorieNachSlug aus
  js/probleme-kategorien.js), bewusst getrennt von den
  Ratgeber-Kategorien - dieses Script setzt voraus, dass
  js/probleme-kategorien.js VOR diesem Script geladen wird.

  Aktuell gibt es noch KEIN Filter-Grid, über das sich eine Kategorie
  auswählen ließe (anders als "Nach Themen stöbern" auf
  alle-ratgeber.html, siehe baueKategorienBereich() in
  js/ratgeber-filter.js) - ?kategorie=... funktioniert aber schon
  jetzt, wenn man es manuell an die URL anhängt bzw. später von einem
  Filter-Grid aus verlinkt. Sobald es so ein Grid geben soll, reicht
  eine Funktion analog zu baueKategorienBereich() (mit
  ProblemKategorieInfo statt RatgeberKategorieInfo) plus ein
  passender Container im HTML.
*/

// Wie viele Karten "Neueste Fallakten" bzw. "Zufällige Empfehlungen"
// zeigen. Auch von js/problemgrid.js verwendet (dort geladen NACH
// diesem Script) und als Schwelle für "nicht mehr als N Fallakten ->
// nur eine Section mit allen" weiter unten.
const ANZAHL_NEUESTE_PROBLEME = 3;
const ANZAHL_ZUFAELLIGE_PROBLEME = 3;


function holeAktuelleProblemKategorie() {

  const urlParameter =
    new URLSearchParams(window.location.search);

  const kategorieSlug =
    urlParameter.get("kategorie");

  return ProblemKategorieNachSlug[kategorieSlug] ?? null;
}

function holeGefilterteProbleme() {

  const kategorie = holeAktuelleProblemKategorie();

  let probleme = problemeListe.filter(
    eintrag => istDatumErreicht(eintrag.erstellt)
  );

  if (kategorie) {
    probleme = probleme.filter(
      eintrag => eintrag.kategorie === kategorie
    );
  }

  return probleme;
}

const problemKategorie = holeAktuelleProblemKategorie();

if (problemKategorie) {

    document.title =
      `${problemKategorie} – Dr. Methodius`;

    const seitenTitel =
      document.getElementById("seiten-titel");

    if (seitenTitel) {
      seitenTitel.textContent =
        `Sprechstunde: ${problemKategorie}`;
    }

    const seitenEinleitung =
      document.getElementById("seiten-einleitung");

    if (seitenEinleitung) {
      seitenEinleitung.textContent =
        `Hier landen Fragen aus der Kategorie „${problemKategorie}“, die Leser eingeschickt haben - und die Dr. Maximilian Methodius mit der gebotenen wissenschaftlichen Unbekümmertheit beantwortet.`;
    }

    const neuesteTitel =
      document.getElementById("neueste-titel");

    if (neuesteTitel) {
      neuesteTitel.textContent =
        `Neueste Fallakten aus ${problemKategorie}`;
    }

    const neuesteText =
      document.getElementById("neueste-text");

    if (neuesteText) {
      neuesteText.textContent =
        `Die zuletzt eingesandten Probleme aus der Kategorie „${problemKategorie}“, derer Dr. Methodius sich angenommen hat.`;
    }

    const empfehlungenTitel =
      document.getElementById("empfehlungen-titel");

    if (empfehlungenTitel) {
      empfehlungenTitel.textContent =
        `Zufällige Empfehlungen aus ${problemKategorie}`;
    }

    const empfehlungenText =
      document.getElementById("empfehlungen-text");

    if (empfehlungenText) {
      empfehlungenText.textContent =
        `Drei Fallakten aus der Kategorie „${problemKategorie}“, ausgewürfelt – lade die Seite neu für eine neue Auswahl.`;
    }

    const alleTitel =
      document.getElementById("alle-titel");

    if (alleTitel) {
      alleTitel.textContent =
        `Alle Fallakten aus ${problemKategorie}`;
    }

    const alleText =
      document.getElementById("alle-text");

    if (alleText) {
      alleText.textContent =
        `Die vollständige Sammlung aller bisher behandelten Fälle aus der Kategorie „${problemKategorie}“.`;
    }
}


/*
  Wie bei den Ratgebern (siehe js/ratgeber-filter.js):

  - Gibt es nach dem Filtern GAR KEINE Fallakten mehr, wird nur noch
    eine Meldung angezeigt: "Neueste Fallakten" wird zu "Alle
    Fallakten" umbenannt und zeigt nur noch einen Hinweistext, die
    übrigen Sections ("Zufällige Empfehlungen", "Alle Fallakten")
    verschwinden komplett.
  - Gibt es nicht mehr als ANZAHL_NEUESTE_PROBLEME Fallakten, reicht
    eine einzige Section mit allen Karten - "Neueste Fallakten" wird
    zu "Alle Fallakten" umbenannt und zeigt bereits alle Karten,
    "Zufällige Empfehlungen" und "Alle Fallakten" werden ausgeblendet.

  Läuft synchron beim Laden dieses Scripts (wie ratgeber-filter.js),
  also VOR js/problemgrid.js: dessen renderProblemKarten() ignoriert
  fehlende Container ohnehin (siehe dort).
*/

const gefilterteProblemeTmp =
  holeGefilterteProbleme();

if (gefilterteProblemeTmp.length === 0) {

  const neuesteTitel =
    document.getElementById("neueste-titel");

  if (neuesteTitel) {
    neuesteTitel.textContent = "Alle Fallakten";
  }

  const neuesteText =
    document.getElementById("neueste-text");

  if (neuesteText) {
    neuesteText.textContent =
      "Derzeit sind in diesem Bereich noch keine Fallakten verfügbar.";
  }

  document
    .getElementById("neueste-probleme")
    ?.remove();

  document
    .getElementById("empfehlungen")
    ?.remove();

  document
    .getElementById("alle-probleme-sektion")
    ?.remove();
}
else if (gefilterteProblemeTmp.length <= ANZAHL_NEUESTE_PROBLEME) {

  const neuesteTitel =
    document.getElementById("neueste-titel");

  if (neuesteTitel) {
    neuesteTitel.textContent = "Alle Fallakten";
  }

  const neuesteText =
    document.getElementById("neueste-text");

  if (neuesteText) {
    neuesteText.textContent =
      "Alle derzeit verfügbaren Fallakten.";
  }

  document
    .getElementById("empfehlungen")
    ?.remove();

  document
    .getElementById("alle-probleme-sektion")
    ?.remove();

  document
    .getElementById("problem-einsenden")
    ?.classList.remove("section-alt");
}


/*
  Färbt alle <section> der Seite nach einem eventuellen Entfernen
  einzelner Sections wieder korrekt abwechselnd ein (hell, dunkel,
  hell, ...). Identisch zu aktualisiereSectionFarben() in
  js/ratgeber-filter.js (dort für alle-ratgeber.html, hier für
  probleme.html - beide Seiten laden nicht dasselbe Script-Bundle,
  daher die eigene Kopie).
*/
function aktualisiereSectionFarben() {

  const sektionen = Array.from(
    document.querySelectorAll("section")
  );

  let gezaehlt = 0;
  let istAlt = false;   // Farbe der zuletzt gezählten Section

  sektionen.forEach(sektion => {

    sektion.classList.remove("section-alt");

    if (!sektion.classList.contains("showcase")) {
      istAlt = gezaehlt % 2 === 1;
      gezaehlt++;
    }

    if (istAlt) {
      sektion.classList.add("section-alt");
    }

  });
}

aktualisiereSectionFarben();
