/*
  "Personal des Monats" - gemeinsames Skript für
    - personal-des-monats.html          (Übersicht, Container #personal-liste)
    - personal-des-monats-seite.html    (Einzelseite, Container #personal-inhalt)

  Datenquellen:
    data/personal-des-monats.json        [{ "slug": "...", "datum": "YYYY-MM-DD" }]
    md/personal-des-monats/<slug>.md     "# Name", "**Stellenbezeichnung:** ...",
                                         dann "## Zur Person" usw.

  Als "ernannt" gilt ein Eintrag nur, wenn "datum" gesetzt ist und
  istDatumErreicht() (aus js/datumsformat.js) true liefert - Einträge
  mit leerem oder zukünftigem Datum bleiben unsichtbar. Im lokalen
  Debug-Modus (?debug=1, siehe istDebugModusAktiv()) werden dagegen
  ALLE Einträge gezeigt und als "nicht veröffentlicht" gekennzeichnet.

  Benötigt vorher: datumsformat.js (DATUM_MONATSNAMEN, istDatumErreicht)
  und markdown.js (parseMarkdownBloecke).
*/

const PERSONAL_JSON_PFAD = "data/personal-des-monats.json";
const PERSONAL_MD_ORDNER = "md/personal-des-monats";

// Optionales Bild pro Person: pics/personal-des-monats/<slug>.<endung>
// Die Endungen werden der Reihe nach probiert; gibt es keins, bleibt
// die Seite ohne Bild.
const PERSONAL_BILD_ORDNER = "pics/personal-des-monats";
const PERSONAL_BILD_ENDUNGEN = ["png", "jpg", "jpeg", "webp"];

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
function istPersonalRegulaerVeroeffentlicht(eintrag) {
  return Boolean(eintrag.datum) && new Date(eintrag.datum) <= new Date();
}

// Lädt die JSON und liefert nur bereits ernannte Einträge, neueste
// zuerst (ISO-Daten lassen sich als Text sortieren). Im lokalen
// Debug-Modus (?debug=1) kommen ALLE Einträge zurück, auch ohne Datum
// oder mit Datum in der Zukunft - Einträge ohne Datum stehen dann am Ende.
async function ladeErnanntesPersonal() {
  const antwort = await fetch(PERSONAL_JSON_PFAD);

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

async function ladePersonalMarkdown(slug) {
  const antwort = await fetch(`${PERSONAL_MD_ORDNER}/${encodeURIComponent(slug)}.md`);

  if (!antwort.ok) throw new Error("Markdown nicht gefunden");

  return antwort.text();
}

// Name = erste "# "-Zeile, Stelle = Zeile "**Stellenbezeichnung:** ..."
function extrahiereKopfdaten(markdown, slug) {
  const name = (markdown.match(/^#\s+(.+)$/m) || [])[1];
  const stelle = (markdown.match(/^\*\*Stellenbezeichnung:\*\*\s*(.+)$/m) || [])[1];

  return {
    name: name ? name.trim() : slug,
    stelle: stelle ? stelle.trim() : ""
  };
}

/* ============================================
   ÜBERSICHT
   ============================================ */

async function initPersonalListe(container) {
  try {
    const eintraege = await ladeErnanntesPersonal();

    if (!eintraege.length) {
      container.innerHTML = `
        <p><em>Noch wurde niemand ausgezeichnet. Das Institut prüft derzeit,
        ob jemand die Auszeichnung verdient hätte.</em></p>
      `;
      return;
    }

    const karten = await Promise.all(
      eintraege.map(async eintrag => {
        let kopf = { name: eintrag.slug, stelle: "" };

        try {
          kopf = extrahiereKopfdaten(await ladePersonalMarkdown(eintrag.slug), eintrag.slug);
        } catch (fehler) {
          // Markdown fehlt -> Karte trotzdem mit dem Slug als Namen zeigen.
        }

        const entwurf = !istPersonalRegulaerVeroeffentlicht(eintrag);

        return `
          <a class="personal-karte${entwurf ? " personal-karte-entwurf" : ""}" href="personal-des-monats-${encodeURIComponent(eintrag.slug)}.html">
            <span class="personal-karte-monat">${formatiereMonatJahr(eintrag.datum)}${entwurf ? " · nicht veröffentlicht" : ""}</span>
            <span class="personal-karte-name">${kopf.name}</span>
            <span class="personal-karte-stelle">${kopf.stelle}</span>
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
// (steht unter der Stellenbezeichnung). Der Platzhalter ist anfangs
// "hidden" und wird nur eingeblendet, wenn ein Bild wirklich geladen
// werden konnte - sonst bleibt die Seite wie sie ist.
function ladePersonalBild(slug, name) {
  const platz = document.getElementById("personal-bild");

  if (!platz) return;

  const probiere = index => {
    if (index >= PERSONAL_BILD_ENDUNGEN.length) return;

    const bild = new Image();

    bild.onload = () => {
      // Vorhandene Porträt-Klasse aus style.css (220 px breit, Akzentkante)
      bild.className = "mitarbeiter-bild";
      bild.alt = `Bild: ${name}`;
      platz.appendChild(bild);
      platz.hidden = false;
    };

    bild.onerror = () => probiere(index + 1);

    bild.src =
      `${PERSONAL_BILD_ORDNER}/${encodeURIComponent(slug)}.${PERSONAL_BILD_ENDUNGEN[index]}`;
  };

  probiere(0);
}

function zeigePersonalNichtGefunden(container) {
  container.innerHTML = `
    <section class="section">
      <div class="wrap">
        <h1>Personal nicht gefunden</h1>
        <p>Diese Person wurde (noch) nicht ausgezeichnet.
        <a href="personal-des-monats.html">Zur Übersicht</a>.</p>
      </div>
    </section>
  `;
}

// Teilt die Markdown-Blöcke in Gruppen: erste Gruppe = Überschrift
// samt Stellenbezeichnung, danach eine Gruppe pro "## "-Kapitel.
// Jede Gruppe wird eine eigene Section (abwechselnd mit section-alt).
function baueDetailSections(bloecke, eintrag) {
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

  const entwurfHinweis = istPersonalRegulaerVeroeffentlicht(eintrag)
    ? ""
    : " (NICHT VERÖFFENTLICHT – NUR IM DEBUG-MODUS SICHTBAR)";

  const datumsHtml = `
    <div class="buch-datums-hinweis">
      <p class="buch-datum">PERSONAL DES MONATS: ${formatiereMonatJahr(eintrag.datum).toUpperCase()}${entwurfHinweis}</p>
    </div>
  `;

  const sections = gruppen.map((gruppe, index) => `
    <section class="section${index % 2 === 1 ? " section-alt" : ""}">
      <div class="wrap">
        ${index === 0 ? datumsHtml : ""}
        ${gruppe.join("\n")}
        ${index === 0 ? '<div id="personal-bild" class="personal-bild" style="margin-top: 24px;" hidden></div>' : ""}
      </div>
    </section>
  `);

  sections.push(`
    <section class="section${gruppen.length % 2 === 1 ? " section-alt" : ""}">
      <div class="wrap">
        <p><a href="personal-des-monats.html">← Zurück zur Übersicht</a></p>
      </div>
    </section>
  `);

  return sections.join("\n");
}

async function initPersonalDetail(container) {
  const slug = container.dataset.slug;

  try {
    const eintraege = await ladeErnanntesPersonal();
    const eintrag = eintraege.find(e => e.slug === slug);

    // Kein Eintrag, kein Datum oder Datum in der Zukunft
    if (!eintrag) {
      zeigePersonalNichtGefunden(container);
      return;
    }

    const markdown = await ladePersonalMarkdown(slug);
    const kopf = extrahiereKopfdaten(markdown, slug);

    document.title = `${kopf.name} – Personal des Monats – Dr. Maximilian Methodius`;

    container.innerHTML = baueDetailSections(parseMarkdownBloecke(markdown), eintrag);

    ladePersonalBild(slug, kopf.name);

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

const personalListeContainer = document.getElementById("personal-liste");
if (personalListeContainer) initPersonalListe(personalListeContainer);

const personalDetailContainer = document.getElementById("personal-inhalt");
if (personalDetailContainer) initPersonalDetail(personalDetailContainer);