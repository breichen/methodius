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


/*
 * ============================================================
 * URKUNDE (für das komplett abgeschlossene Methodius-Studium)
 * ============================================================
 *
 * Portierung von python/urkunde.py nach JavaScript, damit die
 * Urkunde direkt im Browser als echtes PDF erzeugt wird (mit
 * jsPDF) statt als Screenshot-PNG - läuft komplett clientseitig,
 * ohne eigenes Backend, und funktioniert daher auch auf GitHub
 * Pages.
 *
 * Layout, Farben, Schriften und Texte sind bewusst 1:1 aus dem
 * Python-Script übernommen. Einzige strukturelle Änderung: reportlab
 * zählt y-Koordinaten von unten nach oben (Ursprung unten links),
 * jsPDF von oben nach unten (Ursprung oben links). Die Hilfsfunktion
 * yBasis()/yOben() unten übernimmt genau diese Umrechnung, damit die
 * Positionsangaben unten exakt den "h - X * mm"-Werten aus
 * urkunde.py entsprechen.
 *
 * Nutzt denselben Dialog-Rahmen wie das Einzel-Zertifikat oben
 * (baueZertifikatGeruest / #zertifikat-overlay).
 *
 * Voraussetzung: Das jsPDF-Skript muss vor dieser Datei geladen sein
 * (siehe <script>-Tag in der jeweiligen HTML-Seite).
 */

// Öffnet den Namens-Dialog für die Urkunde.
function zeigeUrkundeDialog() {
  const overlay = baueZertifikatGeruest();
  const panel = document.getElementById("zertifikat-panel");

  panel.innerHTML = `
    <h3>Urkunde erstellen</h3>

    <p>
      Bitte gib deinen Namen ein, der auf der Urkunde erscheinen soll.
    </p>

    <p class="quiz-zertifikat-hinweis">
      Name des zukünftigen Urkundenträgers:
    </p>

    <input
      id="zertifikat-name"
      type="text"
      placeholder="Max Mustermann"
      class="quiz-name-input">

    <div class="quiz-ergebnis-buttons">
      <button id="zertifikat-erstellen" class="quiz-zurueck-button" type="button">
        Urkunde herunterladen
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
      erstelleUrkunde(name);

    });
}

// Lädt ein Bild von der eigenen Seite und wandelt es in eine
// Data-URL um, damit jsPDF es per addImage() einbetten kann.
async function ladeBildAlsDataUrl(pfad) {
  const antwort = await fetch(pfad);
  const blob = await antwort.blob();

  return await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

// Entspricht dateiname_sicher() aus urkunde.py.
function dateinameSicher(text) {

  const ersetzungen = {
    "ä": "ae", "ö": "oe", "ü": "ue",
    "Ä": "Ae", "Ö": "Oe", "Ü": "Ue",
    "ß": "ss"
  };

  const ersetzt =
    text.replace(
      /[äöüÄÖÜß]/g,
      zeichen => ersetzungen[zeichen]
    );

  return ersetzt.replace(/[^A-Za-z0-9_-]/g, "_");
}

// Erzeugt die Urkunde als PDF (per jsPDF) und startet den Download.
async function erstelleUrkunde(name) {

  const { jsPDF } = window.jspdf;

  const MM = 2.8346456692913385; // = reportlab.lib.units.mm
  const BLAU = "#1f2747";
  const ROT = "#B5292C";
  const BEIGE = "#f7f4ec";
  const GRAU = "#666666";

  const urkundennummer =
    "MRV-" + (100000 + Math.floor(Math.random() * 900000));

  const doc = new jsPDF({ unit: "pt", format: "a4" });

  const w = doc.internal.pageSize.getWidth();
  const h = doc.internal.pageSize.getHeight();

  // Rechnet reportlab-y-Werte (Ursprung unten links, wie in
  // urkunde.py) in jsPDF-y-Werte (Ursprung oben links) um.
  const yBasis = yRL => h - yRL;
  const yOben = (yRL, hoehe) => h - yRL - hoehe;

  // --------------------------------------------------
  // Hintergrund
  // --------------------------------------------------

  doc.setFillColor(BEIGE);
  doc.rect(0, 0, w, h, "F");

  // --------------------------------------------------
  // Rahmen
  // --------------------------------------------------

  doc.setDrawColor(ROT);
  doc.setLineWidth(4);
  doc.rect(15 * MM, 15 * MM, w - 30 * MM, h - 30 * MM, "S");

  // --------------------------------------------------
  // Logo
  // --------------------------------------------------

  try {
    const logo =
      await ladeBildAlsDataUrl(
        "assets/favicon/methodius-512x512-nobg.png"
      );

    doc.addImage(
      logo,
      "PNG",
      w / 2 - 15 * MM,
      yOben(h - 55 * MM, 30 * MM),
      30 * MM,
      30 * MM
    );
  } catch {
    // Kein Logo verfügbar - Urkunde trotzdem ohne Logo erzeugen.
  }

  // --------------------------------------------------
  // Institut
  // --------------------------------------------------

  doc.setTextColor(BLAU);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);

  doc.text(
    "METHODIUS-INSTITUT",
    w / 2,
    yBasis(h - 65 * MM),
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);

  doc.text(
    "für angewandte Lebenswissenschaften",
    w / 2,
    yBasis(h - 72 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Titel
  // --------------------------------------------------

  doc.setTextColor(ROT);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(28);

  doc.text(
    "URKUNDE",
    w / 2,
    yBasis(h - 100 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Text
  // --------------------------------------------------

  doc.setTextColor(BLAU);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  doc.text(
    "Hiermit wird bestätigt, dass",
    w / 2,
    yBasis(h - 120 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Name
  // --------------------------------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);

  doc.text(
    name,
    w / 2,
    yBasis(h - 145 * MM),
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  doc.text(
    "nach Erfüllung sämtlicher Anforderungen des Methodius-Studiums",
    w / 2,
    yBasis(h - 165 * MM),
    { align: "center" }
  );

  doc.text(
    "der akademische Grad",
    w / 2,
    yBasis(h - 172 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Grad
  // --------------------------------------------------

  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);

  doc.text(
    "Magister der angewandten Lebenswissenschaften",
    w / 2,
    yBasis(h - 195 * MM),
    { align: "center" }
  );

  doc.setFont("helvetica", "italic");
  doc.setFontSize(14);

  doc.text(
    "(Mag. rer. vit.)",
    w / 2,
    yBasis(h - 203 * MM),
    { align: "center" }
  );

  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);

  doc.text(
    "verliehen wird.",
    w / 2,
    yBasis(h - 220 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Urkundennummer
  // --------------------------------------------------

  doc.setFontSize(9);

  doc.text(
    `Urkundennummer: ${urkundennummer}`,
    w / 2,
    yBasis(h - 230 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Signatur
  // --------------------------------------------------

  const SIGNATUR_ORIG_W = 457;
  const SIGNATUR_ORIG_H = 65;
  const SIGNATUR_WIDTH = 60 * MM;
  const SIGNATUR_HEIGHT =
    SIGNATUR_WIDTH * SIGNATUR_ORIG_H / SIGNATUR_ORIG_W;

  try {
    const signatur =
      await ladeBildAlsDataUrl(
        "assets/signatur/methodius-signatur.png"
      );

    doc.addImage(
      signatur,
      "PNG",
      w / 2 - 30 * MM,
      yOben(h - 255 * MM, SIGNATUR_HEIGHT),
      SIGNATUR_WIDTH,
      SIGNATUR_HEIGHT
    );
  } catch {
    // Keine Signatur verfügbar - Urkunde trotzdem ohne Bild erzeugen.
  }

  doc.setFontSize(11);

  doc.text(
    "Dr. Maximilien Methodius, Institutsleiter",
    w / 2,
    yBasis(h - 262 * MM),
    { align: "center" }
  );

  // --------------------------------------------------
  // Hinweis
  // --------------------------------------------------

  doc.setTextColor(GRAU);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);

  doc.text(
    "Der verliehene Grad ist weder staatlich anerkannt noch von erkennbarem praktischem Nutzen.",
    w / 2,
    yBasis(25 * MM),
    { align: "center" }
  );

  doc.text(
    "Sein ideeller Wert wird vom Institut jedoch als außerordentlich hoch eingeschätzt.",
    w / 2,
    yBasis(21 * MM),
    { align: "center" }
  );

  doc.save(
    `urkunde_${urkundennummer}_${dateinameSicher(name)}.pdf`
  );
}
