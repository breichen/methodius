/*
  Baut die Seite "Beiträge einer Ausgabe" (zeitschrift-heft.html).

  Die Ausgabe wird über die Adresse bestimmt, z. B.
    zeitschrift-heft.html?band=1&heft=2

  Die Daten stammen aus js/zeitschrift-ausgaben.js. Ausgaben, deren
  "erstellt"-Datum noch nicht erreicht ist, gelten hier als nicht
  vorhanden - auch wenn jemand die Adresse direkt aufruft.

  Muss NACH js/datumsformat.js und js/zeitschrift-ausgaben.js geladen
  sein.
*/

const container = document.getElementById("zeitschrift-heft-inhalt");

const ZURUECK_LINK = `
  <p class="zeitschrift-zurueck">
    <a href="zeitschrift.html">&larr; Alle Ausgaben</a>
  </p>
`;

// "autoren" ist eine Liste von Namen; sie wird mit Komma getrennt angezeigt.
function autorenText(autoren) {
  return Array.isArray(autoren) ? autoren.join(", ") : autoren;
}

function baueBeitragsZeile(beitrag) {
  return `
    <tr>
      <td data-label="Autor(en)">${zeitschriftEscape(autorenText(beitrag.autoren))}</td>
      <td data-label="Titel" class="zeitschrift-beitrag-titel">${zeitschriftEscape(beitrag.titel)}</td>
      <td data-label="Beitragsart">${zeitschriftEscape(beitrag.typ)}</td>
      <td data-label="Seiten">${zeitschriftEscape(beitrag.seiten)}</td>
    </tr>
  `;
}

function baueBeitragsTabelle(beitraege) {

  if (!beitraege || beitraege.length === 0) {
    return `
      <p class="zeitschrift-leer">
        Für diese Ausgabe sind noch keine Beiträge hinterlegt.
      </p>
    `;
  }

  return `
    <table class="zeitschrift-beitraege">
      <thead>
        <tr>
          <th>Autor(en)</th>
          <th>Titel</th>
          <th>Beitragsart</th>
          <th>Seiten</th>
        </tr>
      </thead>
      <tbody>
        ${beitraege.map(baueBeitragsZeile).join("")}
      </tbody>
    </table>
  `;
}

function baueHeftSeite(ausgabe) {

  document.title =
    `Band ${ausgabe.band}, Heft ${ausgabe.heft} – Zeitschrift für Angewandte Lebensführung – Dr. Methodius`;

  return `
    <section class="section">
      <div class="wrap">
        ${ZURUECK_LINK}
        <h1>Zeitschrift für Angewandte Lebensführung</h1>
        <h2>Band ${zeitschriftEscape(ausgabe.band)}, Heft ${zeitschriftEscape(ausgabe.heft)}</h2>
        ${
          ausgabe.erstellt
            ? `<p class="zeitschrift-heft-datum">Erschienen: ${formatiereDatumDeutsch(ausgabe.erstellt)}</p>`
            : ""
        }
        ${baueBeitragsTabelle(ausgabe.beitraege)}
      </div>
    </section>
  `;
}

function baueNichtGefunden() {
  return `
    <section class="section">
      <div class="wrap">
        ${ZURUECK_LINK}
        <h1>Ausgabe nicht gefunden</h1>
        <p>Diese Ausgabe existiert nicht oder ist noch nicht erschienen.</p>
      </div>
    </section>
  `;
}

/*
  Wie bei zeitschrift.html: Solange die Seite nicht freigegeben ist
  (Debug-Modus nicht aktiv, siehe istDebugModusAktiv() in
  js/datumsformat.js), wird nur ein Hinweis angezeigt. Diesen Block
  gemeinsam mit dem in js/zeitschrift.js entfernen, sobald die Seite
  freigegeben werden soll.
*/
if (!istDebugModusAktiv()) {

  container.innerHTML = `
    <section class="section">
      <div class="wrap">
        <h1>Zeitschrift für Angewandte Lebensführung</h1>
        <p>Diese Seite ist derzeit noch nicht öffentlich verfügbar.</p>
      </div>
    </section>
  `;

} else {

  const parameter = new URLSearchParams(window.location.search);
  const band = Number(parameter.get("band"));
  const heft = Number(parameter.get("heft"));

  const ausgabe = zeitschriftSichtbareAusgaben().find(
    a => Number(a.band) === band && Number(a.heft) === heft
  );

  container.innerHTML = ausgabe ? baueHeftSeite(ausgabe) : baueNichtGefunden();

}