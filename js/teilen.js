/*
  Stellt den Teilen-Button auf den Detailseiten bereit (buch.html für
  Ratgeber, problem.html für Fallakten - beide binden diese Datei ein).

  Nutzt, wo verfügbar, die native Teilen-Funktion des Geräts/Browsers
  (Web Share API - v.a. auf dem Handy: öffnet das normale
  Teilen-Menü für WhatsApp, Mail, usw.). Ist die API nicht verfügbar
  (z.B. am Desktop in älteren Browsern), wird stattdessen der aktuelle
  Link in die Zwischenablage kopiert und der Button zeigt kurz
  "Link kopiert!" als Bestätigung an.
*/

// "titel" erscheint im Teilen-Dialog als Titel des geteilten Inhalts.
// "button" ist das <button>-Element, an das der Klick-Handler gehängt wird.
function initTeilenButton(button, titel) {
  if (!button) return;

  const urspruenglicherText = button.innerHTML;

  button.addEventListener("click", async () => {
    const url = window.location.href;

    // Web Share API: v.a. auf dem Handy verfügbar, öffnet das native
    // Teilen-Menü des Betriebssystems.
    if (navigator.share) {
      try {
        await navigator.share({ title: titel, url });
      } catch (fehler) {
        // Wird u.a. ausgelöst, wenn der Nutzer den Teilen-Dialog
        // abbricht - das ist kein echter Fehler, einfach ignorieren.
      }
      return;
    }

    // Fallback (z.B. Desktop-Browser ohne Web Share API): Link in die
    // Zwischenablage kopieren und kurz eine Bestätigung anzeigen.
    try {
      await navigator.clipboard.writeText(url);
      button.innerHTML = "✅ Link kopiert!";
    } catch (fehler) {
      button.innerHTML = "⚠️ Kopieren fehlgeschlagen";
    }

    setTimeout(() => {
      button.innerHTML = urspruenglicherText;
    }, 2000);
  });
}
