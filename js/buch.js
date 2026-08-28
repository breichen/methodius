/*
  Liest den Slug aus der URL (?titel=...), sucht das passende Buch
  in ratgeberListe (aus js/ratgeber.js) und zeigt Bild + Text an.
*/

const container = document.getElementById("buch-inhalt");

// Baut die optionale "Vorgeschlagen von: ..." / "Veröffentlicht: ..." /
// "Aktualisiert: ..."-Zeile aus den Feldern "einsender", "erstellt" und
// "aktualisiert" in ratgeber.js. Alle drei Angaben sind frei wählbare
// Strings (kein Datumsformat wird vorausgesetzt) und komplett optional -
// fehlt eine, wird die entsprechende Zeile einfach weggelassen. Ist
// "einsender" gesetzt, erscheint "Vorgeschlagen von: ..." ganz oben,
// noch vor "Veröffentlicht: ...". Sind alle drei leer, liefert die
// Funktion "".
function baueDatumsHinweis(buch) {
  const zeilen = [];

  if (buch.einsender) {
    zeilen.push(`<p class="buch-datum">Vorgeschlagen von: ${buch.einsender}</p>`);
  }

  if (buch.erstellt) {
    zeilen.push(`<p class="buch-datum">Veröffentlicht: ${buch.erstellt}</p>`);
  }

  if (buch.aktualisiert) {
    zeilen.push(`<p class="buch-datum">Aktualisiert: ${buch.aktualisiert}</p>`);
  }

  return zeilen.length
    ? `<div class="buch-datums-hinweis">${zeilen.join("\n")}</div>`
    : "";
}

// URL-Parameter auslesen, z.B. "der-perfekte-sonntag" aus buch.html?titel=der-perfekte-sonntag
const parameter = new URLSearchParams(window.location.search);
const slug = parameter.get("titel");
const buch = ratgeberListe.find(b => b.slug === slug);

if (!buch) {
  // Falscher oder fehlender Link -> freundliche Fehlermeldung statt kaputter Seite
  container.innerHTML = `
    <h1>Ratgeber nicht gefunden</h1>
    <p>Diesen Ratgeber gibt es (noch) nicht. <a href="index.html#ratgeber">Zur Übersicht</a>.</p>
  `;
} else {
  document.title = buch.titel + " – Dr. Maximilian Methodius";

  // Auch hier: encodeURIComponent macht den Dateinamen URL-sicher
  // (wichtig bei Leerzeichen, Kommas, Klammern im Titel).
  const pfad = encodeURIComponent(buch.slug);

  // "Vorgeschlagen von: ..." / "Veröffentlicht: ..." / "Aktualisiert: ..."
  // nur anzeigen, wenn die jeweilige Angabe in ratgeber.js gesetzt wurde -
  // alle drei sind komplett optional.
  const datumsHtml = baueDatumsHinweis(buch);

  // Bild sofort anzeigen, Text kommt gleich per fetch() nach
  container.innerHTML = `
    ${datumsHtml}
    <img class="book-cover" id="buch-cover-bild" src="pics/ratgeber/${pfad}.png" alt="Cover: ${buch.titel}" style="width: 100%; max-width: 750px; height: auto; margin-bottom: 24px; cursor: zoom-in;">
    <p class="blaettern-wrap">
      <a href="#" id="blaettern-link" class="blaettern-link">📖 Blättern</a>
      <button type="button" id="teilen-button" class="teilen-button">🔗 Teilen</button>
    </p>
    <div id="buch-text"><p>Lade Text …</p></div>
  `;

  // Klick auf das Cover -> Bild vergrößert in einer Lightbox anzeigen
  initCoverLightbox();

  // Teilen-Button (siehe js/teilen.js) - teilt Cover-Bild + Titel + Link
  initTeilenButtonRatgeber(document.getElementById("teilen-button"), {
    titel: buch.titel,
    bildUrl: `pics/ratgeber/${pfad}.png`
  });

  // Der Link wird erst sichtbar/klickbar, wenn der Text geladen ist
  const blaetternLink = document.getElementById("blaettern-link");
  blaetternLink.style.visibility = "hidden";

  fetch(`md/ratgeber/${pfad}.md`)
    .then(antwort => {
      if (!antwort.ok) throw new Error("Datei nicht gefunden");
      return antwort.text();
    })
    .then(markdown => {

      const { fliesstextBloecke, flipbookBloecke, quiz } =
        verarbeiteRatgeberMarkdown(markdown);

      document.getElementById("buch-text").innerHTML =
        baueKapitelSections(fliesstextBloecke);

      initFlipbook(flipbookBloecke);
      initQuizButton(quiz);

      ladeKommentare(buch.slug);

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
   TABELLEN
   Erkennt Markdown-Tabellen (Pipe-Syntax mit |---|-Trennzeile),
   wandelt sie VOR dem eigentlichen Markdown-Parsing in echtes
   HTML um und setzt sie per Platzhalter wieder in die fertigen
   Blöcke ein - so bleibt parseMarkdownBloecke() unangetastet.
   ============================================ */

// Zerlegt eine Tabellenzeile ("| A | B |") in ihre Zellen (["A", "B"]).
function zerlegeTabellenZeile(zeile) {
  let z = zeile.trim();
  if (z.startsWith("|")) z = z.slice(1);
  if (z.endsWith("|")) z = z.slice(0, -1);
  return z.split("|").map(zelle => zelle.trim());
}

// Prüft, ob eine Zeile die Trennzeile einer Tabelle ist (z.B. "|---|---|").
function istTabellenTrennzeile(zeile) {
  const zellen = zerlegeTabellenZeile(zeile);
  return (
    zellen.length > 0 &&
    zellen.every(zelle => /^:?-{2,}:?$/.test(zelle))
  );
}

// Durchsucht das rohe Markdown zeilenweise nach Tabellen, ersetzt jede
// gefundene Tabelle durch einen eindeutigen Platzhalter (eigener Absatz)
// und liefert zusätzlich das fertige HTML pro Tabelle zurück.
function extrahiereTabellenAusMarkdown(markdown) {
  const zeilen = markdown.split("\n");
  const ergebnisZeilen = [];
  const tabellenHtml = [];
  let i = 0;

  while (i < zeilen.length) {
    const koennteTabelleSein =
      zeilen[i].trim().startsWith("|") &&
      i + 1 < zeilen.length &&
      istTabellenTrennzeile(zeilen[i + 1]);

    if (koennteTabelleSein) {
      const kopfZellen = zerlegeTabellenZeile(zeilen[i]);
      i += 2; // Kopfzeile + Trennzeile überspringen

      const datenZeilen = [];
      while (i < zeilen.length && zeilen[i].trim().startsWith("|")) {
        datenZeilen.push(zerlegeTabellenZeile(zeilen[i]));
        i++;
      }

      const theadHtml = `<tr>${kopfZellen
        .map(zelle => `<th>${zelle}</th>`)
        .join("")}</tr>`;

      const tbodyHtml = datenZeilen
        .map(
          zellen =>
            `<tr>${zellen.map(zelle => `<td>${zelle}</td>`).join("")}</tr>`
        )
        .join("");

      const tabelleIndex = tabellenHtml.length;
      tabellenHtml.push(
        `<table class="ratgeber-tabelle"><thead>${theadHtml}</thead><tbody>${tbodyHtml}</tbody></table>`
      );

      // Leerzeilen drumherum sorgen dafür, dass der Platzhalter als
      // eigener Block erkannt wird (wie ein normaler Absatz).
      ergebnisZeilen.push("", `TABELLE_PLATZHALTER_${tabelleIndex}`, "");
    } else {
      ergebnisZeilen.push(zeilen[i]);
      i++;
    }
  }

  return { markdown: ergebnisZeilen.join("\n"), tabellenHtml };
}

// Ersetzt in den fertig geparsten Blöcken jeden Platzhalter-Block
// durch das zugehörige, bereits fertige Tabellen-HTML.
function setzeTabellenEin(bloecke, tabellenHtml) {
  return bloecke.map(block => {
    const match = block.match(/TABELLE_PLATZHALTER_(\d+)/);
    return match ? tabellenHtml[Number(match[1])] : block;
  });
}

/* ============================================
   MARKDOWN-ÜBERSETZUNG
   Die eigentliche Übersetzung (Überschriften, **fett**, *kursiv*,
   > Zitate, - Listen, --- als Trennlinie) übernimmt parseMarkdownBloecke()
   aus js/markdown.js. Hier kommt nur noch die Kapitel-, Autor- und
   Bonus-Quiz-spezifische Nachbearbeitung dazu, die NUR für
   Ratgeber-Seiten gilt.
   ============================================ */

// Übernimmt den kompletten Weg von rohem Markdown bis zu den fertigen
// HTML-Blöcken UND liefert zusätzlich die extrahierten Quiz-Daten
// (falls ein BONUS-Abschnitt gefunden wurde).
//
// Liefert ZWEI verschiedene Block-Arrays:
// - fliesstextBloecke: BONUS-Abschnitt durch einen Button ersetzt
//   (öffnet das interaktive Quiz-Overlay)
// - flipbookBloecke: unverändert, BONUS-Abschnitt bleibt als normaler
//   Text stehen - in einem physischen Buch kann man schließlich nicht
//   klicken, daher zeigt die Blätter-Ansicht das Quiz statisch an.
function verarbeiteRatgeberMarkdown(markdown) {
  // NEU: Tabellen zuerst herausziehen, damit parseMarkdownBloecke()
  // die Pipe-Syntax nicht falsch interpretiert.
  const { markdown: markdownOhneTabellen, tabellenHtml } =
    extrahiereTabellenAusMarkdown(markdown);

  const rohMitPlatzhaltern = parseMarkdownBloecke(markdownOhneTabellen);
  const roh = setzeTabellenEin(rohMitPlatzhaltern, tabellenHtml);

  // ... ab hier bleibt alles wie bisher ...
  const flipbookBloecke = styleAutorErwaehnung(
    bereinigeKapitelUeberschriften(roh)
  );

  const { bloecke: ohneBonus, quiz } = extrahiereBonusQuiz(roh);
  const fliesstextBloecke = styleAutorErwaehnung(
    bereinigeKapitelUeberschriften(ohneBonus)
  );

  return { fliesstextBloecke, flipbookBloecke, quiz };
}

// Nur die Fließtext-Blöcke, ohne Quiz-Daten - falls an anderer Stelle
// mal nur der Text gebraucht wird.
function markdownZuBloecke(markdown) {
  return verarbeiteRatgeberMarkdown(markdown).fliesstextBloecke;
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
    if (block.startsWith("<h1") || block.startsWith("<h2")) acc.push(i);
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
  const signaturIndex = [...namensIndizes]
    .reverse()
    .find(i => i > letzterKapitelStart);

  const ergebnis = [...bloecke];

  // --- Unterschrift im letzten Kapitel (Index bleibt gleich, also zuerst) ---
  if (signaturIndex !== undefined) {
    ergebnis[signaturIndex] =
      `<p class="autor-signatur">${AUTOR_SIGNATUR_TEXT}</p>` +
      ergebnis[signaturIndex];
  }

  // --- Vorstellung im ersten Kapitel ---
  if (
    vorstellungIndex !== undefined &&
    vorstellungIndex !== signaturIndex
  ) {
    const einleitungsBloecke = ergebnis.slice(
      ersterKapitelStart + 1,
      vorstellungIndex
    );

    const einleitungsHtml = einleitungsBloecke.length
      ? `<div class="autor-einleitung">${einleitungsBloecke.join("\n")}</div>`
      : "";

    const nameOhneTags = ergebnis[vorstellungIndex]
      .replace(/^<p>|<\/p>$/g, "");

    const nameBox = `<div class="autor-box">
      <img class="autor-foto" src="pics/team/autor-portrait.png" alt="Porträt von Dr. Maximilian Methodius">
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

    ergebnis.splice(
      ersterKapitelStart,
      vorstellungIndex - ersterKapitelStart + 1,
      ...neueBloecke
    );
  }

  return ergebnis;
}

// Vereinheitlicht alle Kapitelüberschriften auf H2 - unabhängig davon,
// ob ein Kapitel mit einer generischen "Kapitel ..."/"Schlusswort"-
// Überschrift beginnt oder direkt mit seinem eigenen Titel. NUR die
// allererste Überschrift im Buch (der Buchtitel) bleibt eine H1.
//
// - "Kapitel ..."/"Schlusswort": die generische Überschrift wird
//   verworfen, alles bis zur nächsten Überschrift bleibt unverändert
//   stehen, und die darauf folgende H2 (der eigentliche Titel) wird
//   zur neuen Kapitelüberschrift - als H2 (bzw. als H1, falls es sich
//   um die allererste Überschrift des Buches handelt).
// - Eigener Titel MIT einer H2 darunter (bevor das nächste Kapitel
//   beginnt): beide Überschriften werden zu einer einzigen Überschrift
//   kombiniert, damit nicht zwei Überschriften auf gleicher Ebene
//   direkt aufeinanderfolgen. AUSNAHME: bei der allerersten Überschrift
//   wird NICHT kombiniert - die H1 bleibt eigenständig, und die
//   darauffolgende H2 bleibt unverändert eine eigene H2.
// - Eigener Titel OHNE H2 darunter: einfach übernommen (bzw. zu H2
//   herabgestuft, außer bei der allerersten Überschrift).
function bereinigeKapitelUeberschriften(bloecke) {
  const ergebnis = [];
  let i = 0;
  let istErsteUeberschrift = true;

  while (i < bloecke.length) {
    const block = bloecke[i];

    if (block.startsWith("<h1>")) {
      const istGenerischeUeberschrift = /^<h1>(Kapitel|Schlusswort)/.test(block);
      const eigenerTitel = block.slice(4, -5);

      // Nur die allererste Überschrift im ganzen Buch bleibt eine H1 -
      // alle weiteren Kapitelüberschriften werden zu H2.
      const warErsteUeberschrift = istErsteUeberschrift;
      const zielTag = warErsteUeberschrift ? "h1" : "h2";
      istErsteUeberschrift = false;

      i++;

      // Alles bis zur nächsten Überschrift (egal ob H1 oder H2)
      // sammeln, ohne dabei versehentlich in ein späteres Kapitel
      // hineinzulaufen.
      const zwischenBloecke = [];
      while (
        i < bloecke.length &&
        !bloecke[i].startsWith("<h1>") &&
        !bloecke[i].startsWith("<h2>")
      ) {
        zwischenBloecke.push(bloecke[i]);
        i++;
      }

      const naechsteIstH2 =
        i < bloecke.length && bloecke[i].startsWith("<h2>");

      if (istGenerischeUeberschrift) {
        // Wie bisher: generische Überschrift verwerfen, Zwischenblöcke
        // unverändert übernehmen, gefundene H2 wird zur neuen
        // Kapitelüberschrift (als H2, bzw. H1 bei der allerersten).
        ergebnis.push(...zwischenBloecke);

        if (naechsteIstH2) {
          const inhalt = bloecke[i].slice(4, -5);
          ergebnis.push(`<${zielTag}>${inhalt}</${zielTag}>`);
          i++;
        }
      } else if (naechsteIstH2 && warErsteUeberschrift) {
        // Allererste Überschrift: NICHT mit der H2 kombinieren - die H1
        // bleibt eigenständig stehen, und die H2 bleibt unverändert
        // eine eigene H2.
        ergebnis.push(`<h1>${eigenerTitel}</h1>`);
        ergebnis.push(...zwischenBloecke);
        ergebnis.push(bloecke[i]);
        i++;
      } else if (naechsteIstH2) {
        // Eigener Titel UND eine H2 im selben Kapitel -> zu einer
        // einzigen Überschrift kombinieren, die Kapitelüberschrift
        // bleibt aber am ursprünglichen Anfang des Kapitels stehen.
        const unterTitel = bloecke[i].slice(4, -5);
        ergebnis.push(`<h2>${eigenerTitel}: ${unterTitel}</h2>`);
        ergebnis.push(...zwischenBloecke);
        i++;
      } else {
        // Eigener Titel ohne H2 darunter -> übernehmen (bzw. zu H2
        // herabstufen, außer bei der allerersten Überschrift).
        ergebnis.push(`<${zielTag}>${eigenerTitel}</${zielTag}>`);
        ergebnis.push(...zwischenBloecke);
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


/* ============================================
   KOMMENTARE
   Lädt die redaktionelle Diskussion zum jeweiligen
   Ratgeber aus md/ratgeber-kommentare/<slug>.md
   ============================================ */

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

function ladeKommentare(slug) {
  const pfad = encodeURIComponent(slug);
  const url = `md/ratgeber-kommentare/${pfad}.md`;

  console.log("Lade Kommentar-Datei:", url);

  fetch(url)
    .then(antwort => {
      if (!antwort.ok) {
        console.log("Keine Kommentar-Datei gefunden:", url);
        return null;
      }

      return antwort.text();
    })
    .then(markdown => {
      if (!markdown || !markdown.trim()) {
        console.log("Kommentar-Datei ist leer.");
        return;
      }

      console.log("Kommentar-Datei geladen:", markdown);

      const kommentare = parseKommentare(markdown);

      console.log("Gefundene Kommentare:", kommentare);

      if (kommentare.length === 0) {
        console.log("Keine Kommentare erkannt.");
        return;
      }

      const kommentarHtml = baueKommentarBereich(kommentare);

      document
        .getElementById("buch-text")
        .insertAdjacentHTML("beforeend", kommentarHtml);
    })
    .catch(fehler => {
      console.error("Fehler beim Laden der Kommentare:", fehler);
    });
}

function parseKommentare(markdown) {
  const bloecke = markdown
    .split(/\n\s*\n(?=(?:Unbedacht|Redaktion)\s*:)/i)
    .map(block => block.trim())
    .filter(Boolean);

  const kommentare = [];

  bloecke.forEach(block => {
    const match = block.match(
      /^(Unbedacht|Redaktion)\s*:\s*\n([\s\S]*)$/i
    );

    if (!match) return;

    const autor = match[1].toLowerCase() === "unbedacht"
      ? "Unbedacht"
      : "Redaktion";

    const text = match[2].trim();

    if (text) {
      kommentare.push({
        autor,
        text
      });
    }
  });

  return kommentare;
}

function baueKommentarBereich(kommentare) {
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
        <article class="${klasse}">
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
    <section class="ratgeber-kommentare">
      <div class="wrap">
        <div class="kommentar-spalte">

          <div class="kommentar-ueberschrift">
            <span class="kommentar-linie"></span>
            <h2>Kommentare</h2>
          </div>

          <div class="kommentar-liste">
            ${beitraege}
          </div>

        </div>
      </div>
    </section>
  `;
}

// NUR für die Fließtext-Ansicht: verpackt jedes Kapitel abwechselnd in
// class="section" bzw. class="section section-alt" (wie auf den
// anderen Seiten der Website), damit sich die Kapitel farblich
// voneinander absetzen. Ein neues Kapitel beginnt bei jeder Kapitel-
// überschrift (H1 - nur die allererste - oder H2) sowie beim
// Quiz-Start-Button (der Endteil ab dem Bonus-Quiz bekommt so
// ebenfalls einen eigenen, neuen Farbabschnitt). Die Blätter-Ansicht
// (Flipbook) bekommt bewusst KEINE Sections - dort blättert man ja
// ohnehin Seite für Seite, unabhängig von Kapitelgrenzen.
function baueKapitelSections(bloecke) {
  // "---" zwischen Kapiteln wird nicht gebraucht: Der Section-Wechsel
  // (mit eigenem Hintergrund) markiert den Kapitelübergang bereits
  // deutlich genug.
  const bloeckeOhneTrennlinie = bloecke.filter(block => block !== "<hr>");

  const kapitel = [];
  let aktuellesKapitel = null;

  bloeckeOhneTrennlinie.forEach(block => {
    const istKapitelStart =
      block.startsWith("<h1") ||
      block.startsWith("<h2") ||
      block.startsWith('<div class="quiz-start-wrap"');

    if (istKapitelStart || aktuellesKapitel === null) {
      aktuellesKapitel = [];
      kapitel.push(aktuellesKapitel);
    }

    aktuellesKapitel.push(block);
  });

  // Die Sections liegen innerhalb von #buch-inhalt/.wrap und wären
  // dadurch normalerweise auf dessen Breite beschränkt. Der Full-Bleed-
  // Trick (position:relative + left:50% + negative Margin) lässt den
  // Hintergrund trotzdem bis zum Seitenrand reichen, während der
  // innere .wrap-Container den Text weiterhin schön schmal hält.
  const FULL_BLEED_STYLE =
    "position:relative;left:50%;right:50%;width:100vw;margin-left:-50vw;margin-right:-50vw;";

  return kapitel
    .map((kapitelBloecke, index) => {
      const klasse = index % 2 === 0 ? "section" : "section section-alt";
      return `<section class="${klasse}" style="${FULL_BLEED_STYLE}"><div class="wrap">${kapitelBloecke.join("\n")}</div></section>`;
    })
    .join("\n");
}

/* ============================================
   BONUS-QUIZ
   Erkennt einen Top-Level-Abschnitt, dessen Überschrift mit "BONUS"
   beginnt (z.B. "# BONUS: Der Muskelabbau-Test"), zieht ihn aus dem
   normalen Textfluss heraus und ersetzt ihn durch einen Button. Der
   Button öffnet später ein Quiz-Overlay (siehe initQuizButton unten).
   ============================================ */

// Sucht die erste <h1>-Überschrift, die mit "BONUS" beginnt, schneidet
// den kompletten Abschnitt bis zur nächsten <h1> (oder Textende) heraus
// und ersetzt ihn im Block-Array durch einen einzelnen Button-Block.
function extrahiereBonusQuiz(bloecke) {
  const NAME_REGEX = /<strong>Dr\. Maximilian Methodius<\/strong>/;

  const h1Indizes = bloecke.reduce((acc, block, i) => {
    if (block.startsWith("<h1")) acc.push(i);
    return acc;
  }, []);

  const bonusStart = h1Indizes.find(i => {
    const text = bloecke[i].replace(/^<h1>|<\/h1>$/g, "");
    return text.startsWith("BONUS:");
  });

  if (bonusStart === undefined) {
    return { bloecke, quiz: null };
  }

  const naechsteH1 = h1Indizes.find(i => i > bonusStart);

  // WICHTIG: Die Namenszeile "Dr. Maximilian Methodius" (Unterschrift +
  // Name am Buchende) darf NIEMALS Teil des herausgeschnittenen
  // Bonus-Bereichs werden - egal ob sie im Markdown vor dem BONUS-
  // Abschnitt steht (dann betrifft es diese Prüfung ohnehin nicht) oder
  // direkt danach, ohne eigene Zwischenüberschrift. Sie bleibt also in
  // jedem Fall auf der eigentlichen Buch-Seite stehen.
  const namensIndexNachBonus = bloecke.findIndex(
    (block, i) => i > bonusStart && NAME_REGEX.test(block)
  );

  const grenzen = [naechsteH1, namensIndexNachBonus === -1 ? undefined : namensIndexNachBonus]
    .filter(i => i !== undefined);

  const bonusEnde = grenzen.length > 0 ? Math.min(...grenzen) : bloecke.length;

  const bonusBloecke = bloecke.slice(bonusStart, bonusEnde);
  const { titel, beschreibung, fragen, verbrauchteAnzahl } = parseQuizAusBloecken(bonusBloecke);
  const quiz = { titel, beschreibung, fragen };

  // Alles nach der letzten Frage (z.B. "Herzlichen Glückwunsch...")
  // bleibt als ganz normaler Text auf der Buch-Seite stehen, statt im
  // Quiz zu verschwinden - die Auswertung bekommt stattdessen einen
  // eigenen, dynamischen Text (siehe zeigeQuizErgebnis).
  const outroBloecke = bonusBloecke.slice(verbrauchteAnzahl);

  const buttonBlock = `<div class="quiz-start-wrap">
    <button class="quiz-start-button" id="quiz-start-button" type="button">📝 ${quiz.titel} – Quiz starten</button>
  </div>`;

  const neueBloecke = [
    ...bloecke.slice(0, bonusStart),
    buttonBlock,
    ...outroBloecke,
    ...bloecke.slice(bonusEnde)
  ];

  return { bloecke: neueBloecke, quiz };
}

// Zerlegt die Blöcke eines BONUS-Abschnitts in: Titel, optionale
// Beschreibung und Fragen (mit Antwortoptionen). Alles NACH der letzten
// Frage (z.B. "Herzlichen Glückwunsch...") gehört nicht zum Quiz,
// sondern bleibt normaler Text auf der Buch-Seite - deswegen liefert
// diese Funktion zusätzlich "verbrauchteAnzahl", damit der Aufrufer
// weiß, ab welchem Index der restliche Text beginnt.
//
// Erwartetes Markdown-Muster pro Frage:
//   **1. Frage-Text?**
//
//   ☐ Option A
//   ☐ Option B
function parseQuizAusBloecken(bonusBloecke) {
  const titel = bonusBloecke[0]
    .replace(/^<h1>/, "")
    .replace(/<\/h1>$/, "")
    .replace(/^BONUS:?\s*/i, "")
    .trim();

  let i = 1;
  let beschreibung = null;

  if (bonusBloecke[i] && !/^<p><strong>\d+\./.test(bonusBloecke[i])) {
    beschreibung = bonusBloecke[i];
    i++;
  }

  const fragen = [];

  for (; i < bonusBloecke.length; i++) {
    const block = bonusBloecke[i];
    // NEU: Nummer als eigene Gruppe erfassen, damit sie im Quiz-Overlay
    // wieder angezeigt werden kann (statt sie beim Parsen zu verwerfen).
    const frageMatch = block.match(/^<p><strong>(\d+)\.\s*(.+?)<\/strong><\/p>$/);

    if (!frageMatch) {
      break;
    }

    const optionenBlock = bonusBloecke[i + 1] || "";
    const optionen = optionenBlock
      .replace(/^<p>/, "")
      .replace(/<\/p>$/, "")
      .split("<br>")
      .map(o => o.replace(/^☐\s*/, "").trim())
      .filter(Boolean);

    fragen.push({ nummer: frageMatch[1], text: frageMatch[2], optionen });
    i++;
  }

  return { titel, beschreibung, fragen, verbrauchteAnzahl: i };
}

// Baut den Button-Klick-Handler auf, der das Quiz-Overlay öffnet.
// Wird pro Buch-Seite einmal aufgerufen - tut nichts, falls kein
// BONUS-Abschnitt gefunden wurde.
function initQuizButton(quiz) {
  if (!quiz) return;

  const startButton = document.getElementById("quiz-start-button");
  if (!startButton) return;

  startButton.addEventListener("click", () => {
    baueQuizGeruest();
    zeigeQuizFragen(quiz);
    document.getElementById("quiz-overlay").classList.add("is-open");
  });
}

// Baut das Overlay-Grundgerüst einmalig und hängt es an den <body>
function baueQuizGeruest() {
  if (document.getElementById("quiz-overlay")) return;

  const overlay = document.createElement("div");
  overlay.id = "quiz-overlay";
  overlay.className = "quiz-overlay";
  overlay.innerHTML = `
    <button class="quiz-close" id="quiz-close" aria-label="Schließen">&times;</button>
    <div class="quiz-panel" id="quiz-panel"></div>
  `;

  document.body.appendChild(overlay);

  document.getElementById("quiz-close").addEventListener("click", schliesseQuiz);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) schliesseQuiz();
  });

  document.addEventListener("keydown", e => {
    if (overlay.classList.contains("is-open") && e.key === "Escape") {
      schliesseQuiz();
    }
  });
}

function schliesseQuiz() {
  const overlay = document.getElementById("quiz-overlay");
  if (overlay) overlay.classList.remove("is-open");
}

// Zeigt die Fragen als Formular mit Checkboxen an. Erst beim Abschicken
// (Button "Auswertung anzeigen") wird die Auswertung eingeblendet - das
// komplette Panel wird dabei einfach neu befüllt (robuster als
// einzelne Elemente per "hidden" ein-/auszublenden).
function zeigeQuizFragen(quiz) {
  const panel = document.getElementById("quiz-panel");

  const beschreibungHtml = quiz.beschreibung || "";

  const fragenHtml = quiz.fragen.map((frage, fIndex) => `
    <fieldset class="quiz-frage">
      <legend>${frage.nummer}. ${frage.text}</legend>
      ${frage.optionen.map((option, oIndex) => `
        <label class="quiz-option">
          <input type="radio" name="quiz-frage-${fIndex}" value="${oIndex}" required>
          <span>${option}</span>
        </label>
      `).join("")}
    </fieldset>
  `).join("");

  panel.innerHTML = `
    <h3 class="quiz-titel">${quiz.titel}</h3>
    ${beschreibungHtml}
    <form id="quiz-form">
      ${fragenHtml}
      <button class="quiz-auswerten-button" type="submit">Auswertung anzeigen</button>
    </form>
  `;

  document.getElementById("quiz-form").addEventListener("submit", e => {
    e.preventDefault();
    zeigeQuizErgebnis(quiz);
  });
}

// Zeigt die Auswertung an - da Satire, gilt ohnehin jede Antwort als
// richtig: kleines gezeichnetes Abzeichen-Icon (statt des Buch-Covers,
// das als Kreis-Crop schlecht aussah), darunter stilisiertes
// "X/X Antworten richtig" (X = Anzahl der erkannten Fragen) und ein
// knapper Glückwunsch-Text mit dem BUCH-Titel (nicht dem Quiz-Titel).
// Zusätzlich ein "Zurück"-Button für alle, die nicht sehen (wollen),
// dass ein Klick daneben das Overlay auch schließt.
function zeigeQuizErgebnis(quiz) {
  const panel = document.getElementById("quiz-panel");
  const anzahl = quiz.fragen.length;

  panel.innerHTML = `
    <div class="quiz-ergebnis-abzeichen" aria-hidden="true">
      <svg viewBox="0 0 100 120" width="84" height="101">
        <path d="M35 68 L18 116 L50 99 L82 116 L65 68 Z" fill="var(--color-accent-warm)"></path>
        <circle cx="50" cy="45" r="40" fill="var(--color-accent)" stroke="#fff" stroke-width="4"></circle>
        <path d="M50 24 L56.5 38.5 L72 40.5 L60.5 51 L63.5 66.5 L50 58.5 L36.5 66.5 L39.5 51 L28 40.5 L43.5 38.5 Z" fill="#fff"></path>
      </svg>
    </div>
    <p class="quiz-score">${anzahl}/${anzahl} Antworten richtig</p>
    <div class="quiz-ergebnis-text">
      <p>Herzlichen Glückwunsch! Du bist Experte zum Thema <strong>${buch.titel}</strong>!</p>
    </div>
    <button class="quiz-zurueck-button" id="quiz-zurueck-button" type="button">Zurück</button>
  `;

  document.getElementById("quiz-zurueck-button").addEventListener("click", schliesseQuiz);
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

    const overlayBild =
      document.getElementById("cover-lightbox-bild");

    overlayBild.src = bild.src;
    overlayBild.alt = bild.alt;

    document
      .getElementById("cover-lightbox-overlay")
      .classList.add("is-open");
  });
}

// Baut das Lightbox-Grundgerüst einmalig und hängt es an den <body>
function baueLightboxGeruest() {
  if (
    document.getElementById("cover-lightbox-overlay")
  ) {
    return;
  }

  const overlay = document.createElement("div");

  overlay.id = "cover-lightbox-overlay";
  overlay.className = "cover-lightbox-overlay";

  overlay.innerHTML = `
    <button class="cover-lightbox-close" id="cover-lightbox-close" aria-label="Schließen">&times;</button>
    <img id="cover-lightbox-bild" src="" alt="">
  `;

  document.body.appendChild(overlay);

  document
    .getElementById("cover-lightbox-close")
    .addEventListener("click", schliesseLightbox);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      schliesseLightbox();
    }
  });

  document.addEventListener("keydown", e => {
    if (
      overlay.classList.contains("is-open") &&
      e.key === "Escape"
    ) {
      schliesseLightbox();
    }
  });
}

function schliesseLightbox() {
  const overlay =
    document.getElementById("cover-lightbox-overlay");

  if (overlay) {
    overlay.classList.remove("is-open");
  }
}

/* ============================================
   BLÄTTER-ANSICHT
   Zeigt den Ratgeber-Text zweiseitig wie ein aufgeschlagenes Heft,
   mit Pfeilen zum Vor- und Zurückblättern.
   ============================================ */

let flipSeiten = [];
let flipIndex = 0;
let flipBloeckeOhneTrennlinie = [];
let flipResizeTimeout = null;

// Im Hochformat wird bewusst nur EINE Seite auf einmal gezeigt (statt
// zwei nebeneinander/übereinander) - das lässt sich besser lesen und
// die einzelne Seite kann viel mehr von der verfügbaren Höhe nutzen.
function istPortraitModus() {
  return window.matchMedia("(orientation: portrait)").matches;
}

function berechneFlipSeiten() {
  flipSeiten = teileInSeiten(flipBloeckeOhneTrennlinie);
}

function initFlipbook(bloecke) {
  baueFlipbookGeruest();

  // <hr> wird im Blättermodus nicht gebraucht:
  // neue Kapitel beginnen ohnehin automatisch auf einer neuen Seite.
  flipBloeckeOhneTrennlinie =
    bloecke.filter(block => block !== "<hr>");

  document
    .getElementById("blaettern-link")
    .addEventListener("click", e => {
      e.preventDefault();

      // Erst JETZT (statt schon beim Laden der Seite) berechnen, damit
      // die aktuelle Bildschirmgröße/Ausrichtung berücksichtigt wird.
      berechneFlipSeiten();
      flipIndex = 0;
      zeigeSpread();

      document
        .getElementById("flipbook-overlay")
        .classList.add("is-open");
    });
}

// Baut das Overlay-Grundgerüst einmalig und hängt es an den <body>,
function baueFlipbookGeruest() {
  if (document.getElementById("flipbook-overlay")) {
    return;
  }

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

  document
    .getElementById("flipbook-close")
    .addEventListener("click", schliesseFlipbook);

  overlay.addEventListener("click", e => {
    if (e.target === overlay) {
      schliesseFlipbook();
    }
  });

  document
    .getElementById("flipbook-prev")
    .addEventListener("click", () => blaettere(-1));

  document
    .getElementById("flipbook-next")
    .addEventListener("click", () => blaettere(1));

  document.addEventListener("keydown", e => {
    if (!overlay.classList.contains("is-open")) {
      return;
    }

    if (e.key === "ArrowLeft") {
      blaettere(-1);
    }

    if (e.key === "ArrowRight") {
      blaettere(1);
    }

    if (e.key === "Escape") {
      schliesseFlipbook();
    }
  });

  // Bei Größenänderung (z.B. Drehen des Handys) die Seitenaufteilung
  // neu berechnen, solange das Overlay offen ist - sonst passt die
  // vorher berechnete Aufteilung nicht mehr zur neuen Seitengröße.
  // Leicht entprellt (200ms), damit das nicht bei jedem Zwischenschritt
  // der Dreh-Animation feuert.
  window.addEventListener("resize", () => {
    clearTimeout(flipResizeTimeout);
    flipResizeTimeout = setTimeout(() => {
      if (!overlay.classList.contains("is-open")) return;

      berechneFlipSeiten();
      // Sicherstellen, dass der aktuelle Index nach der Neuberechnung
      // noch existiert (z.B. falls es jetzt insgesamt weniger Seiten gibt).
      if (flipIndex >= flipSeiten.length) {
        flipIndex = Math.max(0, flipSeiten.length - 1);
      }
      zeigeSpread();
    }, 200);
  });
}

function schliesseFlipbook() {
  document
    .getElementById("flipbook-overlay")
    .classList.remove("is-open");
}

// "richtung" ist -1 (zurück) oder 1 (vor). Im Hochformat wird pro
// Klick EINE Seite weitergeblättert, sonst ZWEI (da dort immer ein
// ganzer Spread aus linker+rechter Seite gezeigt wird).
function blaettere(richtung) {
  const schritt = (istPortraitModus() ? 1 : 2) * richtung;
  const neuerIndex = flipIndex + schritt;

  if (
    neuerIndex < 0 ||
    neuerIndex >= flipSeiten.length
  ) {
    return;
  }

  flipIndex = neuerIndex;
  zeigeSpread();
}

// Verteilt die Text-Blöcke auf Seiten: Ein unsichtbares Mess-Element in
// exakter .flipbook-page-Größe wird nach und nach befüllt; sobald der
// Inhalt nicht mehr hineinpasst, beginnt eine neue Seite.
//
// WICHTIG: Die Mess-Box bekommt bewusst KEINE fest einprogrammierten
// Maße (früher: immer 480x660px) - stattdessen übernimmt sie ganz
// normal die Maße aus der .flipbook-page-CSS-Klasse, die sich per
// Media Queries an Bildschirmgröße/Ausrichtung anpasst. Nur so
// entspricht die Seitenaufteilung dem, was auf dem jeweiligen Gerät
// tatsächlich sichtbar ist - sonst wird z.B. auf dem Handy Text
// abgeschnitten, der für eine viel größere Desktop-Seite berechnet wurde.
function teileInSeiten(bloecke) {
  const messSeite = document.createElement("div");

  messSeite.className =
    "flipbook-page flipbook-measure-page";

  messSeite.style.position = "absolute";
  messSeite.style.visibility = "hidden";
  messSeite.style.pointerEvents = "none";
  messSeite.style.left = "-10000px";
  messSeite.style.top = "0";

  document.body.appendChild(messSeite);

  const seiten = [];
  let aktuelleSeite = [];

  function passtAufSeite(html) {
    messSeite.innerHTML =
      aktuelleSeite.join("\n") + html;

    return (
      messSeite.scrollHeight <=
      messSeite.clientHeight
    );
  }

  function neueSeite() {
    if (aktuelleSeite.length > 0) {
      seiten.push(aktuelleSeite);
    }

    aktuelleSeite = [];
    messSeite.innerHTML = "";
  }

  bloecke.forEach(block => {
    const istKapitelStart =
      block.startsWith("<h1") || block.startsWith("<h2");

    /*
     * Kapitelüberschriften beginnen weiterhin auf einer neuen Seite.
     */
    if (
      istKapitelStart &&
      aktuelleSeite.length > 0
    ) {
      neueSeite();
    }

    /*
     * Normale Blöcke:
     * Absatz, Überschrift, Zitat etc.
     */
    if (
      !block.startsWith("<ul>") &&
      !block.startsWith("<ol>")
    ) {
      if (
        !passtAufSeite(block) &&
        aktuelleSeite.length > 0
      ) {
        neueSeite();
      }

      aktuelleSeite.push(block);

      messSeite.innerHTML =
        aktuelleSeite.join("\n");

      return;
    }

    /*
     * LISTEN:
     * Die Liste wird in einzelne <li>-Elemente zerlegt.
     */
    const istUl = block.startsWith("<ul>");
    const tag = istUl ? "ul" : "ol";

    const match = block.match(
      new RegExp(
        `<${tag}>([\\s\\S]*?)<\\/${tag}>`
      )
    );

    if (!match) {
      aktuelleSeite.push(block);
      messSeite.innerHTML =
        aktuelleSeite.join("\n");
      return;
    }

    const listenInhalt = match[1];

    const items =
      listenInhalt.match(
        /<li>[\s\S]*?<\/li>/g
      ) || [];

    let aktuelleListe = [];

    items.forEach(item => {
      const testListe = `
        <${tag}>
          ${aktuelleListe.join("\n")}
          ${item}
        </${tag}>
      `;

      const testInhalt =
        aktuelleSeite.concat(testListe);

      messSeite.innerHTML =
        testInhalt.join("\n");

      /*
       * Passt der nächste Eintrag nicht mehr:
       */
      if (
        messSeite.scrollHeight >
          messSeite.clientHeight &&
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

      messSeite.innerHTML =
        aktuelleSeite.join("\n");
    }
  });

  if (aktuelleSeite.length > 0) {
    seiten.push(aktuelleSeite);
  }

  document.body.removeChild(messSeite);

  return seiten.length > 0
    ? seiten
    : [[]];
}

// Zeigt die aktuelle(n) Seite(n) an: im Hochformat nur EINE Seite,
// sonst einen Spread aus linker + rechter Seite.
function zeigeSpread() {
  const linkeSeite =
    document.getElementById(
      "flipbook-page-links"
    );

  const rechteSeite =
    document.getElementById(
      "flipbook-page-rechts"
    );

  const zaehler =
    document.getElementById(
      "flipbook-counter"
    );

  const prevBtn =
    document.getElementById(
      "flipbook-prev"
    );

  const nextBtn =
    document.getElementById(
      "flipbook-next"
    );

  const einzelseite = istPortraitModus();
  const schritt = einzelseite ? 1 : 2;

  const inhaltLinks =
    flipSeiten[flipIndex] || [];

  linkeSeite.innerHTML =
    inhaltLinks.join("\n") +
    `<span class="flipbook-page-number${einzelseite ? "" : " left"}">${flipIndex + 1}</span>`;

  if (einzelseite) {
    // Rechte Seite bleibt leer (und ist per CSS im Hochformat
    // ohnehin ausgeblendet) - es wird immer nur eine Seite gezeigt.
    rechteSeite.innerHTML = "";
    zaehler.textContent = `Seite ${flipIndex + 1} von ${flipSeiten.length}`;
  } else {
    const inhaltRechts =
      flipSeiten[flipIndex + 1] || [];

    rechteSeite.innerHTML =
      inhaltRechts.length
        ? inhaltRechts.join("\n") +
          `<span class="flipbook-page-number">${flipIndex + 2}</span>`
        : "";

    zaehler.textContent =
      inhaltRechts.length
        ? `Seite ${flipIndex + 1}–${flipIndex + 2} von ${flipSeiten.length}`
        : `Seite ${flipIndex + 1} von ${flipSeiten.length}`;
  }

  prevBtn.disabled =
    flipIndex <= 0;

  nextBtn.disabled =
    flipIndex + schritt >= flipSeiten.length;
}