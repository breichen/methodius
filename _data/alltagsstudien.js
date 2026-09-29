import { readFileSync } from "node:fs";

// Liest die Studienliste aus dem Browser-Skript, damit sie nur
// an EINER Stelle gepflegt werden muss.
const code = readFileSync("js/alltagsstudien.js", "utf8");

export default new Function(`${code}\nreturn alltagsstudienListe;`)();