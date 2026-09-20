/*
  Datengrundlage der "Zeitschrift für Angewandte Lebensführung".

  Wird von zwei Seiten benutzt:
    - zeitschrift.html       (js/zeitschrift.js)       - Liste der Ausgaben
    - zeitschrift-heft.html  (js/zeitschrift-heft.js)  - Beiträge einer Ausgabe

  Muss NACH js/datumsformat.js geladen werden (istDatumErreicht) und
  VOR den beiden oben genannten Dateien.

  Eine Ausgabe mit einem "erstellt"-Datum in der Zukunft wird - wie bei
  Ratgeber, News und Fallakten auch - erst ab diesem Datum angezeigt.
  Das gilt auch für die Beitragsseite: Ihr Link funktioniert vorher nicht.
*/

// Hier werden erschienene Ausgaben eingetragen (neueste dürfen ans Ende,
// die Sortierung übernimmt zeitschriftSichtbareAusgaben()).
// Beispiel für einen Eintrag:
//
//   {
//     band: 1,
//     heft: 1,
//     erstellt: "2026-10-01",
//     beitraege: [
//       {
//         autoren: ["Erster Autor", "Zweiter Autor"],
//         titel: "Über das disziplinierte Nichtstun",
//         typ: "Forschungsartikel",
//         seiten: "1–12",
//       },
//     ],
//   },
//
// Die Beiträge werden in der hier angegebenen Reihenfolge angezeigt.
// "autoren" ist eine Liste mit einem Namen pro Eintrag. Ob alle Einträge
// vollständig sind, prüft pruefe_zeitschrift.py.
const zeitschriftAusgaben = [
   {
     band: 1,
     heft: 1,
     erstellt: "2026-10-01",
     beitraege: [
       {
         autoren: ["Erster Autor", "Zweiter Autor"],
         titel: "Über das disziplinierte Nichtstun",
         typ: "Forschungsartikel",
         seiten: "1–12",
       },
     ],
   },];

// Alle bereits erschienenen Ausgaben, neueste (höchster Band, höchstes Heft) zuerst.
function zeitschriftSichtbareAusgaben() {
  return zeitschriftAusgaben
    .filter(ausgabe => istDatumErreicht(ausgabe.erstellt))
    .sort((a, b) => (b.band - a.band) || (b.heft - a.heft));
}

// Link zur Beitragsübersicht einer Ausgabe.
function zeitschriftHeftUrl(ausgabe) {
  return `zeitschrift-heft.html?band=${encodeURIComponent(ausgabe.band)}&heft=${encodeURIComponent(ausgabe.heft)}`;
}

// Schützt Titel, Autorennamen usw. davor, als HTML interpretiert zu werden.
function zeitschriftEscape(text) {
  return String(text ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}