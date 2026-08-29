/*
  Gemeinsame Kommentar-Logik für Ratgeber (buch.html) und Fallakten
  (problem.html). Lädt die redaktionelle Diskussion zu einem Eintrag
  aus einer Markdown-Datei (md/<ordner>/<slug>.md) und baut daraus den
  Kommentarbereich - inklusive Aktualisierung des "Kommentare"-Links
  in der Blättern/Teilen-Leiste.

  Wird von js/buch.js UND js/problem.js über ladeKommentare(...)
  aufgerufen - hier ausgelagert, damit der Code nicht doppelt gepflegt
  werden muss. Setzt voraus, dass js/markdown.js VOR dieser Datei
  geladen wurde (parseMarkdownBloecke()).
*/

const kommentarAutoren = {
  "Unbedacht": {
    name: "Dr. Konrad Unbedacht",
    username: "@unbedacht"
  },
  "Redaktion": {
    name: "Redaktion",
    username: "@methodius"
  }
};

// Lädt "md/<ordner>/<slug>.md", baut daraus den Kommentarbereich
// (<section id="sectionId">) und hängt ihn ans Ende des Elements mit
// der ID "containerId" an. "ueberschrift" ist der Text über der
// Kommentarliste (Standard: "Kommentare"). Fehlt die Datei oder ist
// sie leer, wird trotzdem ein (leerer) Kommentarbereich angezeigt.
//
// Beispiel Ratgeber (siehe js/buch.js):
//   ladeKommentare({
//     slug: buch.slug,
//     ordner: "ratgeber-kommentare",
//     containerId: "buch-text",
//     sectionId: "ratgeber-kommentare"
//   });
//
// Beispiel Fallakte (siehe js/problem.js):
//   ladeKommentare({
//     slug: problem.id || problem.titel,
//     ordner: "fallakten-kommentare",
//     containerId: "problem-inhalt",
//     sectionId: "fallakten-kommentare"
//   });
function ladeKommentare({ slug, ordner, containerId, sectionId, ueberschrift = "Kommentare" } = {}) {
  // Frühzeitige, klare Fehlermeldung statt einer kryptischen 404 auf
  // z.B. "md/[object Object]/undefined.md" - das passiert, wenn
  // ladeKommentare() mit falsch geformten Parametern aufgerufen wird
  // (z.B. weil eine veraltete Version von buch.js/problem.js noch den
  // alten Einzel-String-Aufruf ladeKommentare(slug) benutzt).
  if (
    typeof ordner !== "string" ||
    typeof containerId !== "string" ||
    typeof sectionId !== "string" ||
    (typeof slug !== "string" && typeof slug !== "number")
  ) {
    console.error(
      "ladeKommentare(): ungültige Parameter erhalten - erwartet werden " +
      "{ slug, ordner, containerId, sectionId } als Objekt, jeweils als " +
      "String/Zahl. Erhalten:",
      { slug, ordner, containerId, sectionId }
    );
    return;
  }

  const zielElement = document.getElementById(containerId);

  if (!zielElement) {
    console.error(
      `ladeKommentare(): Element mit id="${containerId}" wurde nicht gefunden. ` +
      "Prüfe, ob containerId korrekt gesetzt ist und ladeKommentare() erst " +
      "aufgerufen wird, nachdem dieses Element im DOM existiert."
    );
    return;
  }

  const pfad = encodeURIComponent(slug);
  const url = `md/${ordner}/${pfad}.md`;

  console.log("Lade Kommentar-Datei:", url);

  function einfuegen(kommentare) {
    const kommentarHtml = baueKommentarBereich(kommentare, sectionId, ueberschrift);
    zielElement.insertAdjacentHTML("beforeend", kommentarHtml);
  }

  fetch(url)
    .then(antwort => {
      if (!antwort.ok) {
        console.log("Keine Kommentar-Datei gefunden:", url);

        // Kein Fehler: Kommentarbereich trotzdem anzeigen.
        return "";
      }

      return antwort.text();
    })
    .then(markdown => {
      if (!markdown || !markdown.trim()) {
        console.log("Kommentar-Datei ist leer oder fehlt.");

        aktualisiereKommentarLink(0);
        einfuegen([]);
        return;
      }

      console.log("Kommentar-Datei geladen:", markdown);

      const kommentare = parseKommentare(markdown);

      console.log("Gefundene Kommentare:", kommentare);

      aktualisiereKommentarLink(kommentare.length);
      einfuegen(kommentare);
    })
    .catch(fehler => {
      console.error("Fehler beim Laden der Kommentare:", fehler);

      // Auch bei einem Fehler den Kommentarbereich anzeigen.
      einfuegen([]);
    });
}

function parseKommentare(markdown) {
  const bloecke = markdown
    .split(/\n\s*\n(?=\[[^\]]+\])/)
    .map(block => block.trim())
    .filter(Boolean);

  const kommentare = [];

  bloecke.forEach(block => {
    const match = block.match(
      /^\[([^|\]]+)\s*\|\s*(\d+)\]\s*\n([\s\S]*)$/
    );

    if (!match) {
      console.warn("Kommentar konnte nicht erkannt werden:", block);
      return;
    }

    const autor = match[1].trim();
    const level = Number(match[2]);
    const text = match[3].trim();

    if (!text) {
      return;
    }

    kommentare.push({
      autor,
      level,
      text
    });
  });

  return kommentare;
}

function baueKommentarBereich(kommentare, sectionId, ueberschrift = "Kommentare") {
  const beitraege = kommentare
    .map(kommentar => {
      const bloecke = parseMarkdownBloecke(kommentar.text);
      const html = bloecke.join("\n");

      const autorInfo =
        kommentarAutoren[kommentar.autor] || {
          name: kommentar.autor,
          username: ""
        };

      const istRedaktion = kommentar.autor === "Redaktion";

      const klasse = istRedaktion
        ? "kommentar kommentar-redaktion"
        : "kommentar kommentar-unbedacht";

      return `
        <article class="${klasse}" data-level="${kommentar.level}">
          <div class="kommentar-avatar" aria-hidden="true">
            ${autorInfo.name.charAt(0)}
          </div>

          <div class="kommentar-inhalt">
            <div class="kommentar-meta">
              <span class="kommentar-autor">
                ${autorInfo.name}
              </span>

              ${
                autorInfo.username
                  ? `<span class="kommentar-username">${autorInfo.username}</span>`
                  : ""
              }
            </div>

            <div class="kommentar-text">
              ${html}
            </div>
          </div>
        </article>
      `;
    })
    .join("\n");

  return `
    <section id="${sectionId}" class="ratgeber-kommentare">
      <div class="wrap">
        <div class="kommentar-spalte">

          <div class="kommentar-ueberschrift">
            <span class="kommentar-linie"></span>
            <h2>${ueberschrift}</h2>
          </div>

          <div class="kommentar-liste">
            ${beitraege}
          </div>

        </div>
      </div>
    </section>
  `;
}

function aktualisiereKommentarLink(anzahl) {
  const linkText = document.getElementById("kommentar-link-text");

  if (!linkText) return;

  if (anzahl === 0) {
    linkText.textContent = "Noch keine Kommentare";
  } else if (anzahl === 1) {
    linkText.textContent = "1 Kommentar";
  } else {
    linkText.textContent = `${anzahl} Kommentare`;
  }
}