/*
  Stellt den Teilen-Button auf den Detailseiten bereit (buch.html für
  Ratgeber, problem.html für Fallakten - beide binden diese Datei ein).

  Statt nur den nackten Link zu teilen, wird - wo möglich - ein Bild
  mitgeteilt:
  - Ratgeber: das vorhandene Cover-Bild
  - Probleme: ein "on the fly" per Canvas erzeugtes Bild der Fallakte
    (Fallnummer, Titel, Frage, Diagnose, Behandlung) - Probleme haben
    ja kein eigenes Cover.

  WICHTIG: Manche Apps (v.a. beim Teilen MIT Bild-Datei) zeigen das
  separate "url"-Feld von navigator.share() nicht an oder ignorieren
  es. Der Link wird deshalb IMMER zusätzlich in den Text-Teil
  eingebaut, damit er beim Teilen nicht verloren geht.

  Fallback-Kette (jeweils falls der vorherige Schritt nicht klappt):
  1. Web Share API MIT Bild-Datei (v.a. Handy: natives Teilen-Menü,
     Bild landet z.B. direkt in der WhatsApp-Nachricht, Link steht im
     Text der Nachricht)
  2. Web Share API OHNE Bild (Titel/Text inkl. Link/Link-Feld)
  3. Link in die Zwischenablage kopieren, Button zeigt kurz eine
     Bestätigung an
*/

// ============================================
// GEMEINSAME HILFSFUNKTIONEN
// ============================================

// Zeigt für 2 Sekunden eine Bestätigung im Button an, danach wieder
// der ursprüngliche Button-Text.
function zeigeButtonBestaetigung(button, urspruenglicherText, neuerText) {
  button.innerHTML = neuerText;
  setTimeout(() => {
    button.innerHTML = urspruenglicherText;
  }, 2000);
}

// Kopiert die aktuelle Seiten-URL in die Zwischenablage - der letzte
// Fallback, falls auf diesem Gerät/Browser gar kein Teilen möglich ist.
async function kopiereLink(button, urspruenglicherText) {
  try {
    await navigator.clipboard.writeText(window.location.href);
    zeigeButtonBestaetigung(button, urspruenglicherText, "✅ Link kopiert!");
  } catch (fehler) {
    zeigeButtonBestaetigung(button, urspruenglicherText, "⚠️ Kopieren fehlgeschlagen");
  }
}

// Versucht zu teilen: zuerst mit Bild-Datei (falls vorhanden UND vom
// Gerät unterstützt), dann ohne Bild, dann Link kopieren. "datei" darf
// null sein (z.B. wenn die Bilderzeugung fehlgeschlagen ist). Der Link
// wird IMMER mit in den Text eingebaut (siehe Hinweis oben).
async function teileMitFallback(button, { titel, text, datei }) {
  const url = window.location.href;
  const textMitLink = `${text}\n\n${url}`;
  const urspruenglicherText = button.innerHTML;

  if (datei && navigator.canShare && navigator.canShare({ files: [datei] })) {
    try {
      await navigator.share({ title: titel, text: textMitLink, files: [datei] });
      return;
    } catch (fehler) {
      // Abbruch durch Nutzer oder Fehler beim Teilen mit Datei ->
      // weiter zum nächsten Fallback statt einfach aufzugeben.
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: titel, text: textMitLink, url });
      return;
    } catch (fehler) {
      // Abbruch durch Nutzer - kein echter Fehler, kein weiterer Fallback nötig.
      return;
    }
  }

  await kopiereLink(button, urspruenglicherText);
}

// Entfernt einfache Markdown-Formatierung (**fett**) und fasst
// Zeilenumbrüche zu Leerzeichen zusammen - fürs Kartenbild reicht
// reiner Text, ohne Formatierung.
function reinerText(text) {
  return String(text || "")
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\n+/g, " ")
    .trim();
}

// ============================================
// RATGEBER: COVER-BILD TEILEN
// ============================================

// Lädt eine Bild-URL und wandelt sie in ein File-Objekt um (nötig für
// navigator.share mit "files").
async function bildAlsDatei(url, dateiname) {
  const antwort = await fetch(url);
  const blob = await antwort.blob();
  return new File([blob], dateiname, { type: blob.type || "image/png" });
}

// "button" ist das <button>-Element, "titel" und "bildUrl" kommen vom
// jeweiligen Ratgeber (siehe js/buch.js).
function initTeilenButtonRatgeber(button, { titel, bildUrl }) {
  if (!button) return;

  const text = `Schau dir "${titel}" von Dr. Methodius an!`;

  button.addEventListener("click", async () => {
    let datei = null;

    try {
      datei = await bildAlsDatei(bildUrl, "cover.png");
    } catch (fehler) {
      // Cover konnte nicht geladen werden -> ohne Bild weiterteilen
    }

    await teileMitFallback(button, { titel, text, datei });
  });
}

// ============================================
// PROBLEME: FALLAKTEN-BILD TEILEN
// Probleme haben kein Cover - stattdessen wird eine kompakte
// Fallakten-Ansicht (Fallnummer, Titel, Frage, Diagnose, Behandlung)
// per Canvas als Bild "nachgebaut".
// ============================================

// Zeichnet ein Rechteck mit abgerundeten Ecken (Canvas kennt das nicht
// eingebaut).
function zeichneAbgerundetesRechteck(ctx, x, y, breite, hoehe, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + breite - radius, y);
  ctx.arcTo(x + breite, y, x + breite, y + radius, radius);
  ctx.lineTo(x + breite, y + hoehe - radius);
  ctx.arcTo(x + breite, y + hoehe, x + breite - radius, y + hoehe, radius);
  ctx.lineTo(x + radius, y + hoehe);
  ctx.arcTo(x, y + hoehe, x, y + hoehe - radius, radius);
  ctx.lineTo(x, y + radius);
  ctx.arcTo(x, y, x + radius, y, radius);
  ctx.closePath();
}

// Zerlegt "text" anhand von "maxBreite" in Zeilen (mit dem AKTUELL auf
// "ctx" gesetzten Font gemessen) - wird sowohl zum reinen Zählen
// (Höhe vorab berechnen) als auch zum tatsächlichen Zeichnen benutzt.
function ermittleZeilen(ctx, text, maxBreite) {
  const woerter = text.split(" ");
  const zeilen = [];
  let zeile = "";

  woerter.forEach(wort => {
    const testZeile = zeile ? `${zeile} ${wort}` : wort;
    const breite = ctx.measureText(testZeile).width;

    if (breite > maxBreite && zeile) {
      zeilen.push(zeile);
      zeile = wort;
    } else {
      zeile = testZeile;
    }
  });

  if (zeile) zeilen.push(zeile);
  return zeilen;
}

// Zeichnet die vorbereiteten Zeilen untereinander und liefert die
// Y-Position nach der letzten Zeile.
function zeichneZeilen(ctx, zeilen, x, y, zeilenhoehe) {
  let aktuelleY = y;
  zeilen.forEach(zeile => {
    ctx.fillText(zeile, x, aktuelleY);
    aktuelleY += zeilenhoehe;
  });
  return aktuelleY;
}

// Schriftarten/Größen an einer Stelle definiert, damit Berechnung
// (Zeilenumbrüche zählen) und tatsächliches Zeichnen garantiert
// dieselben Werte verwenden.
const FALLKARTE_STIL = {
  fallnummer: { font: "600 24px 'Courier New', monospace", zeilenhoehe: 0 },
  titel: { font: "700 44px Georgia, serif", zeilenhoehe: 52 },
  frage: { font: "italic 28px Georgia, serif", zeilenhoehe: 40 },
  label: { font: "700 22px 'Courier New', monospace", zeilenhoehe: 0 },
  text: { font: "400 26px Inter, sans-serif", zeilenhoehe: 36 }
};

// Baut per Canvas ein PNG nach dem Vorbild der Fallakte (Fallnummer,
// Titel, Frage, Diagnose, Behandlung) und liefert es als File-Objekt
// zurück. Die Bildhöhe wird vorab anhand der tatsächlichen Textlänge
// berechnet, damit auch längere Diagnosen/Behandlungen nicht
// abgeschnitten werden. Farben sind bewusst als feste Hex-Werte
// hinterlegt (identisch zu den Design-Tokens in style.css), da Canvas
// keine CSS-Variablen lesen kann.
function erzeugeFallkartenBild({ fallnummer, titel, frage, diagnose, behandlung }) {
  return new Promise((resolve, reject) => {
    const breite = 1200;
    const randAussen = 60;
    const kartenPadding = 60;
    const kartenBreite = breite - randAussen * 2;
    const maxTextBreite = kartenBreite - kartenPadding * 2;

    const frageText = `„${reinerText(frage)}“`;
    const diagnoseText = reinerText(diagnose);
    const behandlungText = reinerText(behandlung);

    // Erst mit einem unsichtbaren Mess-Canvas alle Zeilenumbrüche
    // ermitteln, um die nötige Bildhöhe zu berechnen, BEVOR das
    // eigentliche (sichtbare) Canvas erzeugt wird.
    const messCanvas = document.createElement("canvas");
    const messCtx = messCanvas.getContext("2d");

    messCtx.font = FALLKARTE_STIL.titel.font;
    const titelZeilen = ermittleZeilen(messCtx, titel, maxTextBreite);

    messCtx.font = FALLKARTE_STIL.frage.font;
    const frageZeilen = ermittleZeilen(messCtx, frageText, maxTextBreite);

    messCtx.font = FALLKARTE_STIL.text.font;
    const diagnoseZeilen = ermittleZeilen(messCtx, diagnoseText, maxTextBreite);
    const behandlungZeilen = ermittleZeilen(messCtx, behandlungText, maxTextBreite);

    const labelAbstand = 44; // Platz für Label ("DIAGNOSE" etc.) + kleiner Abstand danach

    const inhaltsHoehe =
      36 + // Fallnummer
      12 + // Abstand danach
      titelZeilen.length * FALLKARTE_STIL.titel.zeilenhoehe +
      16 + // Abstand danach
      frageZeilen.length * FALLKARTE_STIL.frage.zeilenhoehe +
      36 + // Abstand vor "Diagnose"
      labelAbstand +
      diagnoseZeilen.length * FALLKARTE_STIL.text.zeilenhoehe +
      36 + // Abstand vor "Behandlung"
      labelAbstand +
      behandlungZeilen.length * FALLKARTE_STIL.text.zeilenhoehe +
      70; // Platz fürs Branding unten

    const kartenHoehe = kartenPadding * 2 + inhaltsHoehe;
    const hoehe = kartenHoehe + randAussen * 2;

    // Jetzt das eigentliche Canvas in der berechneten Größe erzeugen.
    const canvas = document.createElement("canvas");
    canvas.width = breite;
    canvas.height = hoehe;
    const ctx = canvas.getContext("2d");

    // Seitenhintergrund (--color-bg)
    ctx.fillStyle = "#F1ECE2";
    ctx.fillRect(0, 0, breite, hoehe);

    // Karte selbst (--color-bg-alt)
    const kartenX = randAussen;
    const kartenY = randAussen;
    ctx.fillStyle = "#E7E0D2";
    zeichneAbgerundetesRechteck(ctx, kartenX, kartenY, kartenBreite, kartenHoehe, 16);
    ctx.fill();

    // Roter Akzentbalken links (--color-accent), wie border-left in CSS
    ctx.fillStyle = "#B5292C";
    ctx.fillRect(kartenX, kartenY, 10, kartenHoehe);

    const textX = kartenX + kartenPadding;
    // "cursorY" markiert immer den oberen Rand des NÄCHSTEN Blocks -
    // die jeweilige Textgrundlinie ergibt sich daraus mit einem festen
    // Versatz (abhängig von der Schriftgröße).
    let cursorY = kartenY + kartenPadding;

    // Fallnummer
    ctx.fillStyle = "#5A5F72";
    ctx.font = FALLKARTE_STIL.fallnummer.font;
    ctx.fillText(`FALL NR. ${fallnummer}`, textX, cursorY + 24);
    cursorY += 36 + 12;

    // Titel
    ctx.fillStyle = "#1B2340";
    ctx.font = FALLKARTE_STIL.titel.font;
    zeichneZeilen(ctx, titelZeilen, textX, cursorY + 40, FALLKARTE_STIL.titel.zeilenhoehe);
    cursorY += titelZeilen.length * FALLKARTE_STIL.titel.zeilenhoehe + 16;

    // Frage
    ctx.fillStyle = "#5A5F72";
    ctx.font = FALLKARTE_STIL.frage.font;
    zeichneZeilen(ctx, frageZeilen, textX, cursorY + 28, FALLKARTE_STIL.frage.zeilenhoehe);
    cursorY += frageZeilen.length * FALLKARTE_STIL.frage.zeilenhoehe + 36;

    // Label "DIAGNOSE" + Text
    ctx.fillStyle = "#B5292C";
    ctx.font = FALLKARTE_STIL.label.font;
    ctx.fillText("🩺 DIAGNOSE", textX, cursorY + 22);
    cursorY += labelAbstand;

    ctx.fillStyle = "#1B2340";
    ctx.font = FALLKARTE_STIL.text.font;
    zeichneZeilen(ctx, diagnoseZeilen, textX, cursorY + 24, FALLKARTE_STIL.text.zeilenhoehe);
    cursorY += diagnoseZeilen.length * FALLKARTE_STIL.text.zeilenhoehe + 36;

    // Label "BEHANDLUNG" + Text
    ctx.fillStyle = "#B5292C";
    ctx.font = FALLKARTE_STIL.label.font;
    ctx.fillText("💊 BEHANDLUNG", textX, cursorY + 22);
    cursorY += labelAbstand;

    ctx.fillStyle = "#1B2340";
    ctx.font = FALLKARTE_STIL.text.font;
    zeichneZeilen(ctx, behandlungZeilen, textX, cursorY + 24, FALLKARTE_STIL.text.zeilenhoehe);

    // Kleines Branding unten rechts
    ctx.fillStyle = "#B5292C";
    ctx.font = "600 24px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Dr. Methodius", kartenX + kartenBreite - 40, kartenY + kartenHoehe - 30);
    ctx.textAlign = "left";

    canvas.toBlob(blob => {
      if (!blob) {
        reject(new Error("Canvas konnte nicht in ein Bild umgewandelt werden."));
        return;
      }
      resolve(new File([blob], "fallakte.png", { type: "image/png" }));
    }, "image/png");
  });
}

// "button" ist das <button>-Element, die übrigen Felder kommen vom
// jeweiligen Problem (siehe js/problem.js).
function initTeilenButtonProblem(button, { titel, fallnummer, frage, diagnose, behandlung }) {
  if (!button) return;

  const text = `Fall Nr. ${fallnummer}: „${titel}“ - diagnostiziert von Dr. Methodius.`;

  button.addEventListener("click", async () => {
    let datei = null;

    try {
      datei = await erzeugeFallkartenBild({ fallnummer, titel, frage, diagnose, behandlung });
    } catch (fehler) {
      // Kartenbild konnte nicht erzeugt werden -> ohne Bild weiterteilen
    }

    await teileMitFallback(button, { titel, text, datei });
  });
}