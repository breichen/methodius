/*
  Liest den Slug aus der URL (?titel=...), sucht das passende Buch
  in ratgeberListe (aus js/ratgeber.js) und zeigt Bild + Text an.
*/

const container = document.getElementById("buch-inhalt");

// URL-Parameter auslesen, z.B. "der-perfekte-sonntag" aus buch.html?titel=der-perfekte-sonntag
const parameter = new URLSearchParams(window.location.search);
const slug = parameter.get("titel");
const buch = ratgeberListe.find(b => b.slug === slug);

if (!buch) {
  // Falscher oder fehlender Link -> freundliche Fehlermeldung statt kaputter Seite
  container.innerHTML = `
    <h1>Ratgeber nicht gefunden</h1>
    <p>Diesen Ratgeber gibt es (noch) nicht. <a href="index.html#ratgeber">Zurück zur Übersicht</a>.</p>
  `;
} else {
  document.title = buch.titel + " – Dr. Maximilian Methodius";

  // Auch hier: encodeURIComponent macht den Dateinamen URL-sicher
  // (wichtig bei Leerzeichen, Kommas, Klammern im Titel).
  const pfad = encodeURIComponent(buch.slug);

  // Bild sofort anzeigen, Text kommt gleich per fetch() nach
  container.innerHTML = `
    <img class="book-cover" id="buch-cover-bild" src="pics/${pfad}.png" alt="Cover: ${buch.titel}" style="width: 100%; max-width: 750px; height: auto; margin-bottom: 24px; cursor: zoom-in;">
    <p class="blaettern-wrap"><a href="#" id="blaettern-link" class="blaettern-link">📖 Blättern</a></p>
    <div id="buch-text"><p>Lade Text …</p></div>
  `;

  // Klick auf das Cover -> Bild vergrößert in einer Lightbox anzeigen
  initCoverLightbox();

  // Der Link wird erst sichtbar/klickbar, wenn der Text geladen ist
  const blaetternLink = document.getElementById("blaettern-link");
  blaetternLink.style.visibility = "hidden";

  fetch(`md/${pfad}.md`)
    .then(antwort => {
      if (!antwort.ok) throw new Error("Datei nicht gefunden");
      return antwort.text();
    })
    .then(markdown => {
      document.getElementById("buch-text").innerHTML = markdownZuHtml(markdown);

      // Für die Blätter-Ansicht brauchen wir die einzelnen Blöcke (nicht
      // den fertig verketteten HTML-String), damit wir sie auf Seiten
      // verteilen können.
      const bloecke = markdownZuBloecke(markdown);
      initFlipbook(bloecke);
      blaetternLink.style.visibility = "visible";
    })
    .catch(() => {
      document.getElementById("buch-text").innerHTML = `
        <p><em>Der Text zu diesem Ratgeber konnte nicht geladen werden.
        Läuft die Seite über einen lokalen Server (nicht per Doppelklick geöffnet)?</em></p>
      `;
    });
}

/* ============================================
   MARKDOWN-ÜBERSETZER
   Sehr einfach: reicht für #/##/###-Überschriften, **fett**, *kursiv*,
   --- als Trennlinie und normale Absätze. Kein Ersatz für eine
   vollständige Markdown-Bibliothek, aber genug für unsere Ratgeber-Texte.
   ============================================ */

// Wandelt Markdown in ein Array von HTML-Blöcken um (ein Eintrag pro
// Absatz/Überschrift/Trennlinie) - wird sowohl für die normale Anzeige
// als auch für die Seitenaufteilung der Blätter-Ansicht genutzt.
function markdownZuBloecke(markdown) {
  const bloecke = markdown.trim().split(/\n\s*\n/);

  const html = bloecke.map(block => {
    const zeile = block.trim();

    if (zeile.startsWith("### ")) {
      return `<h3>${inlineFormat(zeile.slice(4))}</h3>`;
    }

    if (zeile.startsWith("## ")) {
      return `<h2>${inlineFormat(zeile.slice(3))}</h2>`;
    }

    if (zeile.startsWith("# ")) {
      return `<h1>${inlineFormat(zeile.slice(2))}</h1>`;
    }

    if (zeile === "---") {
      return `<hr>`;
    }

    // Markdown-Aufzählung:
    // Mehrere Zeilen, die mit "- " beginnen, werden zu einer
    // echten <ul>-Liste.
    const zeilen = zeile.split("\n").map(z => z.trim());

    if (
      zeilen.length > 0 &&
      zeilen.every(z => z.startsWith("- "))
    ) {
      const items = zeilen
        .map(z => `<li>${inlineFormat(z.slice(2))}</li>`)
        .join("");

      return `<ul>${items}</ul>`;
    }

    // Normaler Absatz:
    const zeilenUmbruch = zeile
      .split("\n")
      .map(inlineFormat)
      .join("<br>");

    return `<p>${zeilenUmbruch}</p>`;
  });

  // "Kapitel"-Überschriften (Top-Level, z.B. "# Kapitel 1") werden entfernt;
  // die darauffolgende Zwischenüberschrift (##) rückt an ihre Stelle als
  // neue Top-Level-Überschrift (#) nach - gilt für Fließtext UND Blätteransicht,
  // da beide auf diesen Blöcken aufbauen.
  const bereinigt = bereinigeKapitelUeberschriften(html);

  // Autor-Erwähnungen im ersten und letzten Kapitel besonders gestalten -
  // ebenfalls für Fließtext UND Blätteransicht, da beide auf diesen
  // Blöcken aufbauen.
  return styleAutorErwaehnung(bereinigt);
}

// Text, der als handschriftliche Unterschrift über der Namenszeile im
// letzten Kapitel erscheint - frei erfunden, wie ein Brief-Abschluss.
const AUTOR_SIGNATUR_TEXT = "Maximilian Methodius";

// Findet die Namenszeile "Dr. Maximilian Methodius" im ERSTEN Kapitel und
// gestaltet sie zu einem Vorstellungs-Block um (Einleitungstext in einem
// farbigen Kasten, darunter rundes Porträt + stilisierter Name). Findet
// dieselbe Namenszeile im LETZTEN Kapitel und setzt eine erfundene,
// handschriftliche Unterschrift direkt darüber.
function styleAutorErwaehnung(bloecke) {
  const NAME_REGEX = /<strong>Dr\. Maximilian Methodius<\/strong>/;

  const kapitelStarts = bloecke.reduce((acc, block, i) => {
    if (block.startsWith("<h1")) acc.push(i);
    return acc;
  }, []);
  if (kapitelStarts.length === 0) return bloecke;

  const namensIndizes = bloecke.reduce((acc, block, i) => {
    if (NAME_REGEX.test(block)) acc.push(i);
    return acc;
  }, []);
  if (namensIndizes.length === 0) return bloecke;

  const ersterKapitelStart = kapitelStarts[0];
  const letzterKapitelStart = kapitelStarts[kapitelStarts.length - 1];

  const vorstellungIndex = namensIndizes.find(i => i > ersterKapitelStart);
  const signaturIndex = [...namensIndizes].reverse().find(i => i > letzterKapitelStart);

  const ergebnis = [...bloecke];

  // --- Unterschrift im letzten Kapitel (Index bleibt gleich, also zuerst) ---
  if (signaturIndex !== undefined) {
    ergebnis[signaturIndex] =
      `<p class="autor-signatur">${AUTOR_SIGNATUR_TEXT}</p>` + ergebnis[signaturIndex];
  }

  // --- Vorstellung im ersten Kapitel ---
  if (vorstellungIndex !== undefined && vorstellungIndex !== signaturIndex) {
    const einleitungsBloecke = ergebnis.slice(ersterKapitelStart + 1, vorstellungIndex);
    const einleitungsHtml = einleitungsBloecke.length
      ? `<div class="autor-einleitung">${einleitungsBloecke.join("\n")}</div>`
      : "";

    const nameOhneTags = ergebnis[vorstellungIndex].replace(/^<p>|<\/p>$/g, "");
    const nameBox = `<div class="autor-box">
      <img class="autor-foto" src="pics/autor-portrait.png" alt="Porträt von Dr. Maximilian Methodius">
      <div>
        <p class="autor-name">${nameOhneTags}</p>
        <p class="autor-tagline">Experte in allen Gebieten, Spezialist für ungewöhnliche Lösungen und anerkannter Fachmann für die großen und kleinen Probleme des modernen Lebens.</p>
      </div>
    </div>`;

    const neueBloecke = [
      ergebnis[ersterKapitelStart],
      ...(einleitungsHtml ? [einleitungsHtml] : []),
      nameBox
    ];

    ergebnis.splice(ersterKapitelStart, vorstellungIndex - ersterKapitelStart + 1, ...neueBloecke);
  }

  return ergebnis;
}

// Entfernt jede <h1>-Überschrift, deren Text mit "Kapitel" beginnt, und
// macht die nächste darauf folgende <h2>-Überschrift zur neuen <h1>.
function bereinigeKapitelUeberschriften(bloecke) {
  const ergebnis = [];
  let i = 0;

  while (i < bloecke.length) {
    const block = bloecke[i];

    if (/^<h1>Kapitel/.test(block)) {
      i++; // die Kapitel-Überschrift selbst überspringen (nicht übernehmen)

      // Alles bis zur nächsten <h2> unverändert übernehmen (z.B. falls
      // dazwischen noch ein Absatz stehen sollte)
      while (i < bloecke.length && !bloecke[i].startsWith("<h2>")) {
        ergebnis.push(bloecke[i]);
        i++;
      }

      // Die gefundene <h2> zur neuen <h1> hochstufen
      if (i < bloecke.length && bloecke[i].startsWith("<h2>")) {
        const inhalt = bloecke[i].slice(4, -5); // "<h2>" und "</h2>" entfernen
        ergebnis.push(`<h1>${inhalt}</h1>`);
        i++;
      }
    } else {
      ergebnis.push(block);
      i++;
    }
  }

  return ergebnis;
}

function markdownZuHtml(markdown) {
  return markdownZuBloecke(markdown).join("\n");
}

// Wandelt **fett** und *kursiv* innerhalb einer Zeile um
function inlineFormat(text) {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>");
}

/* ============================================
   COVER-LIGHTBOX
   Klick auf das Cover-Bild zeigt es vergrößert in einem Overlay.
   ============================================ */

function initCoverLightbox() {
  const bild = document.getElementById("buch-cover-bild");
  if (!bild) return;

  bild.addEventListener("click", () => {
    baueLightboxGeruest();
    const overlayBild = document.getElementById("cover-lightbox-bild");
    overlayBild.src = bild.src;
    overlayBild.alt = bild.alt;
    document.getElementById("cover-lightbox-overlay").classList.add("is-open");
  });
}

// Baut das Lightbox-Grundgerüst einmalig und hängt es an den <body>
function baueLightboxGeruest() {
  if (document.getElementById("cover-lightbox-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "cover-lightbox-overlay";
  overlay.className = "cover-lightbox-overlay";
  overlay.innerHTML = `
    <button class="cover-lightbox-close" id="cover-lightbox-close" aria-label="Schließen">&times;</button>
    <img id="cover-lightbox-bild" src="" alt="">
  `;
  document.body.appendChild(overlay);

  document.getElementById("cover-lightbox-close").addEventListener("click", schliesseLightbox);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) schliesseLightbox(); // Klick auf den dunklen Hintergrund schließt
  });
  document.addEventListener("keydown", e => {
    if (overlay.classList.contains("is-open") && e.key === "Escape") schliesseLightbox();
  });
}

function schliesseLightbox() {
  const overlay = document.getElementById("cover-lightbox-overlay");
  if (overlay) overlay.classList.remove("is-open");
}

/* ============================================
   BLÄTTER-ANSICHT
   Zeigt den Ratgeber-Text zweiseitig wie ein aufgeschlagenes Heft,
   mit Pfeilen zum Vor- und Zurückblättern.
   ============================================ */

let flipSeiten = [];  // Array von Seiten; jede Seite ist ein Array von Block-HTML
let flipIndex = 0;    // Index der linken Seite im aktuell sichtbaren Spread

function initFlipbook(bloecke) {
  baueFlipbookGeruest();
  // <hr> wird im Blättermodus nicht gebraucht: neue Kapitel beginnen
  // ohnehin automatisch auf einer neuen Seite (siehe teileInSeiten)
  const bloeckeOhneTrennlinie = bloecke.filter(block => block !== "<hr>");
  flipSeiten = teileInSeiten(bloeckeOhneTrennlinie);
  flipIndex = 0;

  document.getElementById("blaettern-link").addEventListener("click", e => {
    e.preventDefault();
    flipIndex = 0;
    zeigeSpread();
    document.getElementById("flipbook-overlay").classList.add("is-open");
  });
}

// Baut das Overlay-Grundgerüst einmalig und hängt es an den <body>,
// damit es unabhängig vom Seiten-Layout immer im Vordergrund liegt.
function baueFlipbookGeruest() {
  if (document.getElementById("flipbook-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "flipbook-overlay";
  overlay.className = "flipbook-overlay";
  overlay.innerHTML = `
    <button class="flipbook-close" id="flipbook-close" aria-label="Schließen">&times;</button>
    <div class="flipbook-stage">
      <button class="flipbook-arrow" id="flipbook-prev" aria-label="Vorherige Seite">&#8249;</button>
      <div>
        <div class="flipbook-book">
          <div class="flipbook-page" id="flipbook-page-links"></div>
          <div class="flipbook-page" id="flipbook-page-rechts"></div>
        </div>
        <div class="flipbook-counter" id="flipbook-counter"></div>
      </div>
      <button class="flipbook-arrow" id="flipbook-next" aria-label="Nächste Seite">&#8250;</button>
    </div>
  `;
  document.body.appendChild(overlay);

  document.getElementById("flipbook-close").addEventListener("click", schliesseFlipbook);
  overlay.addEventListener("click", e => {
    if (e.target === overlay) schliesseFlipbook(); // Klick auf den dunklen Hintergrund schließt
  });
  document.getElementById("flipbook-prev").addEventListener("click", () => blaettere(-2));
  document.getElementById("flipbook-next").addEventListener("click", () => blaettere(2));

  document.addEventListener("keydown", e => {
    if (!overlay.classList.contains("is-open")) return;
    if (e.key === "ArrowLeft")  blaettere(-2);
    if (e.key === "ArrowRight") blaettere(2);
    if (e.key === "Escape")     schliesseFlipbook();
  });
}

function schliesseFlipbook() {
  document.getElementById("flipbook-overlay").classList.remove("is-open");
}

function blaettere(schritt) {
  const neuerIndex = flipIndex + schritt;
  if (neuerIndex < 0 || neuerIndex >= flipSeiten.length) return;
  flipIndex = neuerIndex;
  zeigeSpread();
}

// Verteilt die Text-Blöcke auf Seiten: Ein unsichtbares Mess-Element in
// exakter .flipbook-page-Größe wird nach und nach befüllt; sobald der
// Inhalt nicht mehr hineinpasst, beginnt eine neue Seite.
function teileInSeiten(bloecke) {
  const messSeite = document.createElement("div");

  messSeite.className = "flipbook-page flipbook-measure-page";
  messSeite.style.position = "absolute";
  messSeite.style.visibility = "hidden";
  messSeite.style.pointerEvents = "none";
  messSeite.style.left = "-10000px";
  messSeite.style.top = "0";
  messSeite.style.width = "480px";
  messSeite.style.maxWidth = "480px";
  messSeite.style.height = "660px";

  document.body.appendChild(messSeite);

  const seiten = [];
  let aktuelleSeite = [];

  function passtAufSeite(html) {
    messSeite.innerHTML = aktuelleSeite.join("\n") + html;
    return messSeite.scrollHeight <= messSeite.clientHeight;
  }

  function neueSeite() {
    if (aktuelleSeite.length > 0) {
      seiten.push(aktuelleSeite);
    }

    aktuelleSeite = [];
    messSeite.innerHTML = "";
  }

  bloecke.forEach(block => {
    const istKapitelStart = block.startsWith("<h1");

    /*
     * Kapitelüberschriften beginnen weiterhin auf einer neuen Seite.
     */
    if (istKapitelStart && aktuelleSeite.length > 0) {
      neueSeite();
    }

    /*
     * Normale Blöcke:
     * Absatz, Überschrift, HR etc.
     */
    if (!block.startsWith("<ul>") && !block.startsWith("<ol>")) {
      if (!passtAufSeite(block) && aktuelleSeite.length > 0) {
        neueSeite();
      }

      aktuelleSeite.push(block);
      messSeite.innerHTML = aktuelleSeite.join("\n");

      return;
    }

    /*
     * LISTEN:
     * Die Liste wird in einzelne <li>-Elemente zerlegt.
     */
    const istUl = block.startsWith("<ul>");
    const tag = istUl ? "ul" : "ol";

    const match = block.match(
      new RegExp(`<${tag}>([\\s\\S]*?)<\\/${tag}>`)
    );

    if (!match) {
      aktuelleSeite.push(block);
      messSeite.innerHTML = aktuelleSeite.join("\n");
      return;
    }

    const listenInhalt = match[1];

    const items = listenInhalt.match(/<li>[\s\S]*?<\/li>/g) || [];

    let aktuelleListe = [];

    items.forEach(item => {
      const testListe = `
        <${tag}>
          ${aktuelleListe.join("\n")}
          ${item}
        </${tag}>
      `;

      const testInhalt = aktuelleSeite.concat(testListe);

      messSeite.innerHTML = testInhalt.join("\n");

      /*
       * Passt der nächste Eintrag nicht mehr:
       *
       * 1. aktuelle Liste auf die aktuelle Seite schreiben
       * 2. Seite abschließen
       * 3. neuen Listeneintrag auf nächster Seite beginnen
       */
      if (
        messSeite.scrollHeight > messSeite.clientHeight &&
        aktuelleListe.length > 0
      ) {
        aktuelleSeite.push(`
          <${tag}>
            ${aktuelleListe.join("\n")}
          </${tag}>
        `);

        neueSeite();

        aktuelleListe = [item];

        messSeite.innerHTML = `
          <${tag}>
            ${item}
          </${tag}>
        `;

        return;
      }

      aktuelleListe.push(item);
    });

    /*
     * Übrig gebliebene Listeneinträge an die aktuelle Seite hängen.
     */
    if (aktuelleListe.length > 0) {
      const fertigeListe = `
        <${tag}>
          ${aktuelleListe.join("\n")}
        </${tag}>
      `;

      aktuelleSeite.push(fertigeListe);
      messSeite.innerHTML = aktuelleSeite.join("\n");
    }
  });

  if (aktuelleSeite.length > 0) {
    seiten.push(aktuelleSeite);
  }

  document.body.removeChild(messSeite);

  return seiten.length > 0 ? seiten : [[]];
}

// Zeigt den Spread (linke + rechte Seite) für den aktuellen flipIndex an
function zeigeSpread() {
  const linkeSeite = document.getElementById("flipbook-page-links");
  const rechteSeite = document.getElementById("flipbook-page-rechts");
  const zaehler = document.getElementById("flipbook-counter");
  const prevBtn = document.getElementById("flipbook-prev");
  const nextBtn = document.getElementById("flipbook-next");

  const inhaltLinks = flipSeiten[flipIndex] || [];
  const inhaltRechts = flipSeiten[flipIndex + 1] || [];

  linkeSeite.innerHTML = inhaltLinks.join("\n") +
    `<span class="flipbook-page-number left">${flipIndex + 1}</span>`;

  rechteSeite.innerHTML = inhaltRechts.length
    ? inhaltRechts.join("\n") + `<span class="flipbook-page-number">${flipIndex + 2}</span>`
    : "";

  zaehler.textContent = inhaltRechts.length
    ? `Seite ${flipIndex + 1}–${flipIndex + 2} von ${flipSeiten.length}`
    : `Seite ${flipIndex + 1} von ${flipSeiten.length}`;

  prevBtn.disabled = flipIndex <= 0;
  nextBtn.disabled = flipIndex + 2 >= flipSeiten.length;
}