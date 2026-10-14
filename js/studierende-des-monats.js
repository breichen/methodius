/*
  "Studierende des Monats" - gemeinsames Skript für
    - studierende-des-monats.html          (Übersicht, Container #personal-liste)
    - studierende-des-monats-seite.html    (Einzelseite, Container #personal-inhalt)

  Die Container-IDs und CSS-Klassen (personal-*) stammen bewusst von
  "Personal des Monats", damit css/personal-des-monats.css unverändert
  mitbenutzt wird.

  Datenquellen:
    data/studierende-des-monats.json        [{ "slug": "...", "datum": "YYYY-MM-DD" }]
    md/studierende-des-monats/<slug>.md     "# Name", "**Begründung:** ...",
                                            dann "## Zur Person" usw.
    pics/studierende-des-monats/<slug>.<png|jpg|jpeg|webp>   (optional)

  Als "ernannt" gilt ein Eintrag nur, wenn "datum" gesetzt ist und
  istDatumErreicht() (aus js/datumsformat.js) true liefert - Einträge
  mit leerem oder zukünftigem Datum bleiben unsichtbar. Im lokalen
  Debug-Modus (?debug=1, siehe istDebugModusAktiv()) werden dagegen
  ALLE Einträge gezeigt und als "nicht veröffentlicht" gekennzeichnet.

  Benötigt vorher: datumsformat.js (DATUM_MONATSNAMEN, istDatumErreicht,
  istDebugModusAktiv) und markdown.js (parseMarkdownBloecke).
*/

// ------------------------------------------------------------
// SCHALTER: Solange true, ist der gesamte Bereich "Studierende des
// Monats" NUR im Debug-Modus sichtbar - auch Einträge mit Datum.
// Zum Veröffentlichen auf false setzen (siehe Hinweis in
// studierende-des-monats.html).
// ------------------------------------------------------------
const STUDIERENDE_NUR_DEBUG = true;

function istStudierendeFreigegeben() {
  return !STUDIERENDE_NUR_DEBUG || istDebugModusAktiv();
}

const STUDIERENDE_JSON_PFAD = "data/studierende-des-monats.json";
const STUDIERENDE_MD_ORDNER = "md/studierende-des-monats";

// Optionales Bild pro Eintrag: pics/studierende-des-monats/<slug>.<endung>
// Die Endungen werden der Reihe nach probiert; gibt es keins, bleibt
// die Seite ohne Bild.
const STUDIERENDE_BILD_ORDNER = "pics/studierende-des-monats";
const STUDIERENDE_BILD_ENDUNGEN = ["png", "jpg", "jpeg", "webp"];

// "2026-10-01" oder "2026-10" -> "Oktober 2026"
function formatiereMonatJahr(isoDatum) {
  if (!isoDatum) return "Ohne Datum";

  const teile = String(isoDatum).split("-");
  const monatsName = DATUM_MONATSNAMEN[Number(teile[1]) - 1];

  return monatsName ? `${monatsName} ${teile[0]}` : String(isoDatum);
}

// Regulär veröffentlicht = Datum gesetzt und heute oder in der
// Vergangenheit. Bewusst OHNE Debug-Ausnahme (anders als
// istDatumErreicht()), um im Debug-Modus Entwürfe kennzeichnen zu können.
function istStudierendeRegulaerVeroeffentlicht(eintrag) {
  return (
    !STUDIERENDE_NUR_DEBUG &&
    Boolean(eintrag.datum) &&
    new Date(eintrag.datum) <= new Date()
  );
}

// Lädt die JSON und liefert nur bereits ernannte Einträge, neueste
// zuerst (ISO-Daten lassen sich als Text sortieren). Im lokalen
// Debug-Modus (?debug=1) kommen ALLE Einträge zurück, auch ohne Datum
// oder mit Datum in der Zukunft - Einträge ohne Datum stehen dann am Ende.
async function ladeErnannteStudierende() {
  if (!istStudierendeFreigegeben()) return [];

  const antwort = await fetch(STUDIERENDE_JSON_PFAD);

  if (!antwort.ok) throw new Error("JSON nicht gefunden");

  const liste = await antwort.json();
  const debug = istDebugModusAktiv();

  return liste
    .filter(eintrag =>
      eintrag.slug &&
      (debug || (eintrag.datum && istDatumErreicht(eintrag.datum)))
    )
    .sort((a, b) => (b.datum || "").localeCompare(a.datum || ""));
}

async function ladeStudierendeMarkdown(slug) {
  const antwort = await fetch(`${STUDIERENDE_MD_ORDNER}/${encodeURIComponent(slug)}.md`);

  if (!antwort.ok) throw new Error("Markdown nicht gefunden");

  return antwort.text();
}

// Name = erste "# "-Zeile, Begründung = Zeile "**Begründung:** ..."
function extrahiereStudierendeKopfdaten(markdown, slug) {
  const name = (markdown.match(/^#\s+(.+)$/m) || [])[1];
  const begruendung = (markdown.match(/^\*\*Begründung:\*\*\s*(.+)$/m) || [])[1];

  return {
    name: name ? name.trim() : slug,
    begruendung: begruendung ? begruendung.trim() : ""
  };
}

/* ============================================
   ÜBERSICHT
   ============================================ */

async function initStudierendeListe(container) {
  try {
    const eintraege = await ladeErnannteStudierende();

    if (!eintraege.length) {
      container.innerHTML = `
        <p><em>Noch wurde niemand ausgezeichnet. Das Institut prüft derzeit,
        ob jemand die Auszeichnung verdient hätte.</em></p>
      `;
      return;
    }

    const karten = await Promise.all(
      eintraege.map(async eintrag => {
        let kopf = { name: eintrag.slug, begruendung: "" };

        try {
          kopf = extrahiereStudierendeKopfdaten(
            await ladeStudierendeMarkdown(eintrag.slug),
            eintrag.slug
          );
        } catch (fehler) {
          // Markdown fehlt -> Karte trotzdem mit dem Slug als Namen zeigen.
        }

        const entwurf = !istStudierendeRegulaerVeroeffentlicht(eintrag);

        return `
          <a class="personal-karte${entwurf ? " personal-karte-entwurf" : ""}" href="studierende-des-monats-${encodeURIComponent(eintrag.slug)}.html">
            <span class="personal-karte-monat">${formatiereMonatJahr(eintrag.datum)}${entwurf ? " · nicht veröffentlicht" : ""}</span>
            <span class="personal-karte-name">${kopf.name}</span>
            <span class="personal-karte-stelle">${kopf.begruendung}</span>
          </a>
        `;
      })
    );

    container.innerHTML = karten.join("\n");

  } catch (fehler) {
    container.innerHTML = `
      <p><em>Die Liste konnte nicht geladen werden.
      Läuft die Seite über einen lokalen Server (nicht per Doppelklick geöffnet)?</em></p>
    `;
  }
}

/* ============================================
   EINZELSEITE
   ============================================ */

// Sucht ein Bild zum Slug und setzt es in den Platzhalter #personal-bild
// (steht unter der Begründung). Der Platzhalter ist anfangs "hidden" und
// wird nur eingeblendet, wenn ein Bild wirklich geladen werden konnte.
function ladeStudierendeBild(slug, name) {
  const platz = document.getElementById("personal-bild");

  if (!platz) return;

  const probiere = index => {
    if (index >= STUDIERENDE_BILD_ENDUNGEN.length) return;

    const bild = new Image();

    bild.onload = () => {
      bild.className = "news-bild";
      bild.alt = `Bild: ${name}`;
      platz.appendChild(bild);
      platz.hidden = false;
    };

    bild.onerror = () => probiere(index + 1);

    bild.src =
      `${STUDIERENDE_BILD_ORDNER}/${encodeURIComponent(slug)}.${STUDIERENDE_BILD_ENDUNGEN[index]}`;
  };

  probiere(0);
}

function zeigeStudierendeNichtGefunden(container) {
  container.innerHTML = `
    <section class="section">
      <div class="wrap">
        <h1>Seite nicht gefunden</h1>
        <p>Diese Auszeichnung gibt es (noch) nicht.
        <a href="index.html">Zur Startseite</a>.</p>
      </div>
    </section>
  `;
}

// Teilt die Markdown-Blöcke in Gruppen: erste Gruppe = Überschrift
// samt Begründung, danach eine Gruppe pro "## "-Kapitel.
// Jede Gruppe wird eine eigene Section (abwechselnd mit section-alt).
function baueStudierendeDetailSections(bloecke, eintrag) {
  const gruppen = [];
  let aktuelle = [];

  bloecke.forEach(block => {
    if (block.startsWith("<h2") && aktuelle.length > 0) {
      gruppen.push(aktuelle);
      aktuelle = [];
    }
    aktuelle.push(block);
  });

  if (aktuelle.length > 0) gruppen.push(aktuelle);

  const entwurfHinweis = istStudierendeRegulaerVeroeffentlicht(eintrag)
    ? ""
    : " (NICHT VERÖFFENTLICHT – NUR IM DEBUG-MODUS SICHTBAR)";

  const datumsHtml = `
    <div class="buch-datums-hinweis">
      <p class="buch-datum">STUDIERENDE DES MONATS: ${formatiereMonatJahr(eintrag.datum).toUpperCase()}${entwurfHinweis}</p>
    </div>
  `;

  const sections = gruppen.map((gruppe, index) => `
    <section class="section${index % 2 === 1 ? " section-alt" : ""}">
      <div class="wrap">
        ${index === 0 ? datumsHtml : ""}
        ${gruppe.join("\n")}
        ${index === 0 ? '<div id="personal-bild" class="personal-bild" hidden></div>' : ""}
      </div>
    </section>
  `);

  sections.push(`
    <section class="section${gruppen.length % 2 === 1 ? " section-alt" : ""}">
      <div class="wrap">
        <p><a href="studierende-des-monats.html">← Zurück zur Übersicht</a></p>
      </div>
    </section>
  `);

  return sections.join("\n");
}

async function initStudierendeDetail(container) {
  const slug = container.dataset.slug;

  try {
    const eintraege = await ladeErnannteStudierende();
    const eintrag = eintraege.find(e => e.slug === slug);

    // Kein Eintrag, kein Datum, Datum in der Zukunft oder Bereich
    // (noch) nur für den Debug-Modus freigegeben
    if (!eintrag) {
      zeigeStudierendeNichtGefunden(container);
      return;
    }

    const markdown = await ladeStudierendeMarkdown(slug);
    const kopf = extrahiereStudierendeKopfdaten(markdown, slug);

    document.title = `${kopf.name} – Studierende des Monats – Dr. Maximilian Methodius`;

    container.innerHTML = baueStudierendeDetailSections(parseMarkdownBloecke(markdown), eintrag);

    ladeStudierendeBild(slug, kopf.name);

  } catch (fehler) {
    container.innerHTML = `
      <section class="section">
        <div class="wrap">
          <p><em>Der Text konnte nicht geladen werden.
          Läuft die Seite über einen lokalen Server (nicht per Doppelklick geöffnet)?</em></p>
        </div>
      </section>
    `;
  }
}

/* ============================================
   START
   ============================================ */

// Übersicht: Der Inhalt ist im HTML anfangs "hidden" und wird nur
// eingeblendet, wenn der Bereich freigegeben ist (Debug-Modus bzw.
// STUDIERENDE_NUR_DEBUG = false). Sonst erscheint "nicht gefunden".
const studierendeSeite = document.getElementById("studierende-seite");

if (studierendeSeite) {
  if (istStudierendeFreigegeben()) {
    studierendeSeite.hidden = false;

    const studierendeListeContainer = document.getElementById("personal-liste");
    if (studierendeListeContainer) initStudierendeListe(studierendeListeContainer);
  } else {
    zeigeStudierendeNichtGefunden(studierendeSeite);
    studierendeSeite.hidden = false;
  }
}

const studierendeDetailContainer = document.getElementById("personal-inhalt");
if (studierendeDetailContainer) initStudierendeDetail(studierendeDetailContainer);
