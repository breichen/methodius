/*
  Stellt den Teilen-Button auf den Detailseiten bereit (buch.html für
  Ratgeber, problem.html für Fallakten - beide binden diese Datei ein).

  Statt nur den nackten Link zu teilen, wird - wo möglich - ein Bild
  mitgeteilt:
  - Ratgeber: das vorhandene Cover-Bild
  - Probleme: ein "on the fly" per Canvas erzeugtes Bild der
    kompakten Karte (Fallnummer, Titel, Frage) - Probleme haben ja
    kein eigenes Cover.

  Fallback-Kette (jeweils falls der vorherige Schritt nicht klappt):
  1. Web Share API MIT Bild-Datei (v.a. Handy: natives Teilen-Menü,
     Bild landet z.B. direkt in der WhatsApp-Nachricht)
  2. Web Share API OHNE Bild (nur Titel/Text/Link)
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
// null sein (z.B. wenn die Bilderzeugung fehlgeschlagen ist).
async function teileMitFallback(button, { titel, text, datei }) {
  const url = window.location.href;
  const urspruenglicherText = button.innerHTML;

  if (datei && navigator.canShare && navigator.canShare({ files: [datei] })) {
    try {
      await navigator.share({ title: titel, text, files: [datei] });
      return;
    } catch (fehler) {
      // Abbruch durch Nutzer oder Fehler beim Teilen mit Datei ->
      // weiter zum nächsten Fallback statt einfach aufzugeben.
    }
  }

  if (navigator.share) {
    try {
      await navigator.share({ title: titel, text, url });
      return;
    } catch (fehler) {
      // Abbruch durch Nutzer - kein echter Fehler, kein weiterer Fallback nötig.
      return;
    }
  }

  await kopiereLink(button, urspruenglicherText);
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
// PROBLEME: KARTEN-BILD TEILEN
// Probleme haben kein Cover - stattdessen wird die kompakte Karte
// (Fallnummer, Titel, Frage) per Canvas als Bild "nachgebaut".
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

// Zeichnet Text mit automatischem Zeilenumbruch (bricht bei
// "maxBreite" um) und liefert die Y-Position nach der letzten Zeile.
function zeichneMehrzeiligenText(ctx, text, x, y, maxBreite, zeilenhoehe) {
  const woerter = text.split(" ");
  let zeile = "";
  let aktuelleY = y;

  woerter.forEach(wort => {
    const testZeile = zeile ? `${zeile} ${wort}` : wort;
    const breite = ctx.measureText(testZeile).width;

    if (breite > maxBreite && zeile) {
      ctx.fillText(zeile, x, aktuelleY);
      zeile = wort;
      aktuelleY += zeilenhoehe;
    } else {
      zeile = testZeile;
    }
  });

  if (zeile) {
    ctx.fillText(zeile, x, aktuelleY);
    aktuelleY += zeilenhoehe;
  }

  return aktuelleY;
}

// Baut per Canvas ein PNG (1200x630 - gängiges Social-Share-Format)
// nach dem Vorbild der kompakten Fallakten-Karte und liefert es als
// File-Objekt zurück. Farben sind bewusst als feste Hex-Werte
// hinterlegt (identisch zu den Design-Tokens in style.css), da Canvas
// keine CSS-Variablen lesen kann.
function erzeugeFallkartenBild({ fallnummer, titel, frage }) {
  return new Promise((resolve, reject) => {
    const breite = 1200;
    const hoehe = 630;

    const canvas = document.createElement("canvas");
    canvas.width = breite;
    canvas.height = hoehe;
    const ctx = canvas.getContext("2d");

    // Seitenhintergrund (--color-bg)
    ctx.fillStyle = "#F1ECE2";
    ctx.fillRect(0, 0, breite, hoehe);

    // Karte selbst (--color-bg-alt), mit etwas Rand zum Bildrand
    const rand = 60;
    const kartenX = rand;
    const kartenY = rand;
    const kartenBreite = breite - rand * 2;
    const kartenHoehe = hoehe - rand * 2;

    ctx.fillStyle = "#E7E0D2";
    zeichneAbgerundetesRechteck(ctx, kartenX, kartenY, kartenBreite, kartenHoehe, 16);
    ctx.fill();

    // Roter Akzentbalken links (--color-accent), wie border-left in CSS
    ctx.fillStyle = "#B5292C";
    ctx.fillRect(kartenX, kartenY, 10, kartenHoehe);

    const textX = kartenX + 60;
    const maxTextBreite = kartenBreite - 120;
    let textY = kartenY + 90;

    // Fallnummer
    ctx.fillStyle = "#5A5F72";
    ctx.font = "600 24px 'Courier New', monospace";
    ctx.fillText(`FALL NR. ${fallnummer}`, textX, textY);
    textY += 60;

    // Titel
    ctx.fillStyle = "#1B2340";
    ctx.font = "700 48px Georgia, serif";
    textY = zeichneMehrzeiligenText(ctx, titel, textX, textY, maxTextBreite, 56);
    textY += 26;

    // Frage
    ctx.fillStyle = "#5A5F72";
    ctx.font = "italic 30px Georgia, serif";
    zeichneMehrzeiligenText(ctx, `„${frage}“`, textX, textY, maxTextBreite, 42);

    // Kleines Branding unten rechts
    ctx.fillStyle = "#B5292C";
    ctx.font = "600 26px Inter, sans-serif";
    ctx.textAlign = "right";
    ctx.fillText("Dr. Methodius", kartenX + kartenBreite - 40, kartenY + kartenHoehe - 40);
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
function initTeilenButtonProblem(button, { titel, fallnummer, frage }) {
  if (!button) return;

  const text = `Fall Nr. ${fallnummer}: „${titel}“ - diagnostiziert von Dr. Methodius.`;

  button.addEventListener("click", async () => {
    let datei = null;

    try {
      datei = await erzeugeFallkartenBild({ fallnummer, titel, frage });
    } catch (fehler) {
      // Kartenbild konnte nicht erzeugt werden -> ohne Bild weiterteilen
    }

    await teileMitFallback(button, { titel, text, datei });
  });
}