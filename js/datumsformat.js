/*
  Wandelt ein ISO-Datum (YYYY-MM-DD, z.B. aus
  data/veroeffentlichungen.json) für die Anzeige in die deutsche
  Lesefassung um, z.B. "2028-08-22" -> "22. August 2028".

  ISO wird in der JSON-Datei bewusst verwendet, weil es sich zuverlässig
  parsen und vergleichen lässt (new Date("2028-08-22") funktioniert
  überall gleich) - anders als deutsche Datumstexte, die der
  JavaScript-Date-Konstruktor nicht zuverlässig versteht.

  Wird von js/institutseite.js UND js/veroeffentlichungen-seite.js
  genutzt.
*/

const DATUM_MONATSNAMEN = [
  "Januar", "Februar", "März", "April", "Mai", "Juni",
  "Juli", "August", "September", "Oktober", "November", "Dezember"
];

function formatiereDatumDeutsch(isoDatum) {

  const teile = String(isoDatum).split("-");

  if (teile.length !== 3) {
    // Kein erkennbares ISO-Datum - unverändert zurückgeben, statt die
    // Seite deswegen kaputtgehen zu lassen.
    return isoDatum;
  }

  const [jahr, monat, tag] = teile;

  const monatsName = DATUM_MONATSNAMEN[Number(monat) - 1];

  if (!monatsName) {
    return isoDatum;
  }

  // Führende Null beim Tag entfernen (z.B. "05" -> "5").
  const tagOhneFuehrendeNull = String(Number(tag));

  return `${tagOhneFuehrendeNull}. ${monatsName} ${jahr}`;
}

/*
  Prüft, ob ein ISO-Datum bereits erreicht ist (heute oder in der
  Vergangenheit liegt). Funktioniert zuverlässig, weil "datum" im
  ISO-Format vorliegt (new Date("2028-08-22") lässt sich überall
  gleich parsen und vergleichen - anders als deutsche Datumstexte).

  Wird von js/institutseite.js UND js/veroeffentlichungen-seite.js
  genutzt, um Veröffentlichungen mit einem Datum in der Zukunft
  auszublenden.
*/
function istDatumErreicht(isoDatum) {
  const heute = new Date();
  return new Date(isoDatum) <= heute;
}