const ANZAHL_ANZEIGEN = 4;

function zahlwort(zahl) {

  const zahlwoerter = {
    2: "Zwei",
    3: "Drei",
    4: "Vier",
    5: "Fünf",
    6: "Sechs",
    7: "Sieben",
    8: "Acht"
  };

  return zahlwoerter[zahl] ?? String(zahl);
}