import { readFileSync } from "node:fs";

// Liest die Browser-Skripte ein und holt die Liste heraus,
// damit sie nur an EINER Stelle gepflegt werden muss.
const code =
  readFileSync("js/ratgeber-kategorien.js", "utf8") + "\n" +
  readFileSync("js/ratgeber.js", "utf8");

export default new Function(`${code}\nreturn ratgeberListe;`)();