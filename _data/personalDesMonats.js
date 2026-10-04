import { readFileSync } from "node:fs";

// Liest data/personal-des-monats.json (dieselbe Datei, die der Browser
// per fetch() lädt) und stellt sie Eleventy als "personalDesMonats"
// bereit - Grundlage für personal-des-monats-seite.html (eine Seite
// pro Eintrag).
const liste = JSON.parse(
  readFileSync("data/personal-des-monats.json", "utf8")
);

// Heutiges Datum lokal als YYYY-MM-DD (schwedisches Format ist ISO)
const heute = new Date().toLocaleDateString("sv-SE");

// Für Datumsangaben wie "2026-10" (ohne Tag) den Monatsersten ergänzen,
// damit der Textvergleich mit "heute" stimmt.
const alsVollesDatum = datum =>
  /^\d{4}-\d{2}$/.test(datum) ? `${datum}-01` : datum;

export default liste
  // Einträge ohne slug können keine Seite bekommen.
  .filter(eintrag => eintrag.slug)
  .map(eintrag => ({
    ...eintrag,
    veroeffentlicht:
      Boolean(eintrag.datum) && alsVollesDatum(eintrag.datum) <= heute
  }));
