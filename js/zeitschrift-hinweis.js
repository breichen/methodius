/*
  Die Startseite verweist auf die Zeitschrift für Angewandte
  Lebensführung nur, solange der Debug-Modus aktiv ist (siehe
  istDebugModusAktiv() in js/datumsformat.js) - die Seite selbst ist
  ja ebenfalls nur im Debug-Modus erreichbar (siehe js/zeitschrift.js).

  Einfach das "hidden"-Attribut der Section #zeitschrift-hinweis in
  index.html entfernen und diese Datei (samt ihrem <script>-Tag)
  wieder löschen, sobald die Seite offiziell freigegeben wird.
*/
if (istDebugModusAktiv()) {
  document.getElementById("zeitschrift-hinweis")?.removeAttribute("hidden");
}
