import { readFileSync } from "node:fs";

const code =
  readFileSync("js/ratgeber-kategorien.js", "utf8") + "\n" +
  readFileSync("js/ratgeber.js", "utf8");

const liste = new Function(`${code}\nreturn ratgeberListe;`)();

// Heutiges Datum lokal als YYYY-MM-DD (schwedisches Format ist ISO)
const heute = new Date().toLocaleDateString("sv-SE");

export default liste.map(buch => ({
  ...buch,
  veroeffentlicht: Boolean(buch.erstellt) && buch.erstellt <= heute
}));