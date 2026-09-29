import { readFileSync } from "node:fs";

// Die Kategorien-Datei wird vorangestellt, falls Einträge in
// probleme.js einmal ProblemKategorie.XYZ verwenden.
const code =
  readFileSync("js/probleme-kategorien.js", "utf8") + "\n" +
  readFileSync("js/probleme.js", "utf8");

const liste = new Function(`${code}\nreturn problemeListe;`)();

const heute = new Date().toLocaleDateString("sv-SE");

export default liste.map(fall => ({
  ...fall,
  veroeffentlicht: Boolean(fall.erstellt) && fall.erstellt <= heute
}));