import { readFileSync } from "node:fs";

const code = readFileSync("js/alltagsstudien.js", "utf8");
const liste = new Function(`${code}\nreturn alltagsstudienListe;`)();

const heute = new Date().toLocaleDateString("sv-SE");

export default liste.map(studie => ({
  ...studie,
  veroeffentlicht: Boolean(studie.datum) && studie.datum <= heute
}));