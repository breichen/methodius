/*
 * ============================================================
 * ZERTIFIKAT (eigenständig, außerhalb des Quiz-Overlays)
 * ============================================================
 *
 * Diese Datei ist eine bewusst eigenständige Variante der
 * gleichnamigen Funktionen "zeigeZertifikatDialog" /
 * "erstelleZertifikat" aus js/buch.js. Dort hängen beide Funktionen
 * am Quiz-Kontext der aktuell offenen Buch-Seite (Panel-Element
 * #quiz-panel, globale Variable "buch", Punktzahl aus dem gerade
 * abgelegten Quiz). Auf Seiten wie studienfortschritt.html gibt es
 * weder das eine noch das andere - dort können außerdem mehrere
 * Lehrgänge gleichzeitig relevant sein statt nur "des" aktuellen
 * Buchs.
 *
 * Deshalb nimmt diese Version "lehrgang" und "anzahl" als Parameter
 * entgegen, statt sie aus globalem Zustand zu lesen, und baut sich
 * ihr eigenes Dialog-Overlay. Für ein einheitliches Erscheinungsbild
 * werden dabei bewusst dieselben CSS-Klassen wie beim Quiz-Overlay
 * verwendet (.quiz-overlay / .quiz-panel / .quiz-close / ... aus
 * style.css) - es wird also keine einzige neue Dialog-Regel
 * gebraucht.
 *
 * "anzahl" (die Punktzahl fürs Zertifikat) ist optional: Lässt sie
 * sich nicht ermitteln, entfällt die Punktzahl-Zeile auf dem
 * Zertifikat einfach ersatzlos, statt eine falsche Zahl zu zeigen.
 *
 * Voraussetzung: Das html2canvas-Skript muss vor dieser Datei
 * geladen sein (siehe <script>-Tag in der jeweiligen HTML-Seite).
 */

// Baut das Overlay-Grundgerüst einmalig und hängt es an den <body> -
// exakt nach demselben Muster wie baueQuizGeruest() in buch.js.
function baueZertifikatGeruest() {
  const bestehendes = document.getElementById("zertifikat-overlay");
  if (bestehendes) return bestehendes;

  const overlay = document.createElement("div");
  overlay.id = "zertifikat-overlay";
  overlay.className = "quiz-overlay";
  overlay.innerHTML = `
    <button class="quiz-close" id="zertifikat-close" aria-label="Schließen">&times;</button>
    <div class="quiz-panel" id="zertifikat-panel"></div>
  `;

  document.body.appendChild(overlay);

  const schliessen = () => overlay.classList.remove("is-open");

  document
    .getElementById("zertifikat-close")
    .addEventListener("click", schliessen);

  overlay.addEventListener("click", event => {
    if (event.target === overlay) schliessen();
  });

  document.addEventListener("keydown", event => {
    if (overlay.classList.contains("is-open") && event.key === "Escape") {
      schliessen();
    }
  });

  return overlay;
}

// Öffnet den Namens-Dialog. "anzahl" ist optional (siehe oben).
function zeigeZertifikatDialog(lehrgang, anzahl) {
  const overlay = baueZertifikatGeruest();
  const panel = document.getElementById("zertifikat-panel");

  panel.innerHTML = `
    <h3>Zertifikat erstellen</h3>

    <p>
      Bitte gib deinen Namen ein, der auf dem Zertifikat erscheinen soll.
    </p>

    <p class="quiz-zertifikat-hinweis">
      Name des zukünftigen Zertifikatsträgers:
    </p>

    <input
      id="zertifikat-name"
      type="text"
      placeholder="Max Mustermann"
      class="quiz-name-input">

    <div class="quiz-ergebnis-buttons">
      <button id="zertifikat-erstellen" class="quiz-zurueck-button" type="button">
        Zertifikat herunterladen
      </button>

      <button id="zertifikat-abbrechen" class="quiz-zurueck-button" type="button">
        Abbrechen
      </button>
    </div>
  `;

  overlay.classList.add("is-open");

  document
    .getElementById("zertifikat-abbrechen")
    .addEventListener("click", () => overlay.classList.remove("is-open"));

  document
    .getElementById("zertifikat-erstellen")
    .addEventListener("click", () => {

      const name =
        document.getElementById("zertifikat-name").value.trim();

      if (!name) {
        alert("Bitte gib einen Namen ein.");
        return;
      }

      overlay.classList.remove("is-open");
      erstelleZertifikat(name, lehrgang, anzahl);

    });
}

// Erzeugt das Zertifikat als PNG (per html2canvas) und startet den
// Download. Entspricht inhaltlich 1:1 der Vorlage aus buch.js -
// einzige Unterschiede: "lehrgang" kommt als Parameter statt aus der
// globalen "buch"-Variable, und die Punktzahl-Zeile wird nur
// eingefügt, wenn "anzahl" tatsächlich bekannt ist.
function erstelleZertifikat(name, lehrgang, anzahl) {

  const zertifikatsNummer =
    "MI-" +
    new Date().getFullYear() +
    "-" +
    Math.floor(Math.random() * 100000)
      .toString()
      .padStart(5, "0");

  const punktzahlHtml = anzahl
    ? `
      <p>mit der Höchstpunktzahl von</p>
      <h2>${anzahl} von ${anzahl} Punkten</h2>
    `
    : "";

  const zertifikat = document.createElement("div");

  zertifikat.style.width = "1200px";
  zertifikat.style.padding = "80px";
  zertifikat.style.background = "#f7f4ec";
  zertifikat.style.color = "#1f2747";
  zertifikat.style.fontFamily = "Georgia, serif";
  zertifikat.style.border = "10px solid #c22d2d";
  zertifikat.style.position = "fixed";
  zertifikat.style.left = "-99999px";

  zertifikat.innerHTML = `
    <p style="font-size:14px;color:#666;">
      Zertifikatsnummer: ${zertifikatsNummer}
    </p>

    <div style="text-align:center">

      <img
        src="assets/favicon/methodius-512x512-nobg.png"
        alt="Methodius-Institut"
        style="
          width:120px;
          height:auto;
          margin:25px auto 35px;
          display:block;
        ">

      <h2 style="margin-bottom:10px">
        Methodius-Institut für angewandte Lebenswissenschaften
      </h2>
      <br>

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          margin:30px 0;
        ">

        <div style="width:140px;height:3px;background:#B5292C;"></div>

        <div
          style="
            width:20px;
            height:20px;
            background:#B5292C;
            transform:rotate(45deg);
            margin:0 20px;
          ">
        </div>

        <div style="width:140px;height:3px;background:#B5292C;"></div>

      </div>

      <div
        style="
          font-size:72px;
          font-weight:700;
          letter-spacing:8px;
          margin:30px 0 50px;
          text-transform:uppercase;
          color:#B5292C;
        ">
        Zertifikat
      </div>

      <br>

      <p>Hiermit wird bestätigt, dass</p>

      <h1>${name}</h1>

      <p
        style="
          margin-top:35px;
          margin-bottom:15px;
          color:#666;
        ">
        den Lehrgang
      </p>

      <div
        style="
          font-size:52px;
          font-weight:700;
          line-height:1.15;

          color:#B5292C;

          max-width:900px;
          margin:0 auto;

          font-style:italic;
        ">
        ${lehrgang}
      </div>

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          margin:25px 0 45px;
        ">

        <div style="width:100px;height:2px;background:#B5292C;"></div>

        <div
          style="
            width:14px;
            height:14px;
            background:#B5292C;
            transform:rotate(45deg);
            margin:0 16px;
          ">
        </div>

        <div style="width:100px;height:2px;background:#B5292C;"></div>

      </div>

      ${punktzahlHtml}

      <p>erfolgreich abgeschlossen hat.</p>

      <br>

      <p>
        Die Möglichkeit eines Nichtbestehens
        war im Prüfungsverfahren nicht vorgesehen.
      </p>

      <p>
        Ausgestellt durch das
        Methodius-Institut für angewandte Lebenswissenschaften.
      </p>

      <br>

      <div
        style="
          display:flex;
          align-items:center;
          justify-content:center;
          margin:30px 0;
        ">

        <div style="width:140px;height:3px;background:#B5292C;"></div>

        <div
          style="
            width:20px;
            height:20px;
            background:#B5292C;
            transform:rotate(45deg);
            margin:0 20px;
          ">
        </div>

        <div style="width:140px;height:3px;background:#B5292C;"></div>

      </div>

      <br>

      <div style="margin-top:80px">

        <p class="autor-signatur">
          Maximilian Methodius
        </p>

        <p class="autor-name">
          Dr. Maximilian Methodius
        </p>

      </div>
    </div>
  `;

  document.body.appendChild(zertifikat);

  html2canvas(zertifikat, {
    scale: 2
  }).then(canvas => {

    const link = document.createElement("a");

    link.download =
      `methodius-zertifikat-${name
        .replace(/\s+/g, "-")
        .toLowerCase()}.png`;

    link.href = canvas.toDataURL("image/png");

    link.click();

    zertifikat.remove();

  });
}
