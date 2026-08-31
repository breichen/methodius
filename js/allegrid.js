/*
  Befüllt die Übersichtsseite (alle-ratgeber.html) mit ALLEN Büchern.
  Nutzt baueBuchKachel() aus js/buchgrid.js, damit die Kacheln
  überall exakt gleich aussehen.
*/

// Nur Ratgeber anzeigen, die ein "erstellt"-Datum haben UND dessen
// Datum bereits erreicht ist (heute oder in der Vergangenheit) -
// siehe istDatumErreicht() in js/datumsformat.js. Ratgeber ohne
// Datum oder mit einem Datum in der Zukunft werden ausgeblendet.
const sichtbareRatgeberAlle = ratgeberListe.filter(
  buch => buch.erstellt && istDatumErreicht(buch.erstellt)
);

document.getElementById("alle-ratgeber").innerHTML =
  sichtbareRatgeberAlle.map(baueBuchKachel).join("");
