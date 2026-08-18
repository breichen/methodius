/*
  Befüllt die Übersichtsseite (alle-ratgeber.html) mit ALLEN Büchern.
  Nutzt baueBuchKachel() aus js/buchgrid.js, damit die Kacheln
  überall exakt gleich aussehen.
*/
document.getElementById("alle-ratgeber").innerHTML =
  ratgeberListe.map(baueBuchKachel).join("");
