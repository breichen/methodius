/*
  Baut die Seite "Zeitschrift für Angewandte Lebensführung"
  (zeitschrift.html) aus drei Teilen:

    1. Einleitungstext - aus md/zeitschrift.md geladen, genau wie bei
       js/institutseite.js.
    2. Die einzelnen Ausgaben zum Download (siehe zeitschriftAusgaben
       weiter unten). Die Liste ist aktuell noch leer - die Seite muss
       trotzdem sauber funktionieren, siehe baueAusgabenSection().
    3. Call for Papers - statischer Text mit Kontakt-E-Mail.

  Ausgaben mit einem "erstellt"-Datum in der Zukunft werden - wie bei
  Ratgeber, News und Fallakten auch - erst ab diesem Datum angezeigt
  (siehe istDatumErreicht() in js/datumsformat.js). Muss VOR dieser
  Datei geladen sein, ebenso wie js/markdown.js (parseMarkdownBloecke).
*/

// Hier werden künftige Ausgaben eingetragen, sobald sie fertig sind.
// Beispiel für einen Eintrag:
//
//   {
//     nummer: 1,
//     titel: "Über das disziplinierte Nichtstun",
//     erstellt: "2026-10-01",
//     pdf: "assets/zeitschrift/ausgabe-01.pdf",
//   },
//
const zeitschriftAusgaben = [];

const container = document.getElementById("zeitschrift-inhalt");

function baueAusgabenKarte(ausgabe) {
  return `
    <li class="zeitschrift-ausgabe">
      <div class="zeitschrift-ausgabe-info">
        <span class="zeitschrift-ausgabe-nummer">Ausgabe ${ausgabe.nummer}</span>
        <span class="zeitschrift-ausgabe-titel">${ausgabe.titel}</span>
        ${
          ausgabe.erstellt
            ? `<span class="zeitschrift-ausgabe-datum">${formatiereDatumDeutsch(ausgabe.erstellt)}</span>`
            : ""
        }
      </div>
      <a class="zeitschrift-ausgabe-download" href="${ausgabe.pdf}" download>
        PDF herunterladen
      </a>
    </li>
  `;
}

function baueAusgabenSection() {

  const sichtbareAusgaben =
    zeitschriftAusgaben
      .filter(ausgabe => istDatumErreicht(ausgabe.erstellt))
      .sort((a, b) => new Date(b.erstellt) - new Date(a.erstellt));

  const inhalt =
    sichtbareAusgaben.length > 0
      ? `
        <ul class="zeitschrift-ausgaben-liste">
          ${sichtbareAusgaben.map(baueAusgabenKarte).join("")}
        </ul>
      `
      : `
        <p class="zeitschrift-leer">
          Die erste Ausgabe befindet sich derzeit in Vorbereitung.
          Sobald sie erschienen ist, steht sie hier zum Download bereit.
        </p>
      `;

  return `
    <section class="section section-alt">
      <div class="wrap">
        <h2>Ausgaben zum Download</h2>
        ${inhalt}
      </div>
    </section>
  `;
}

function baueCallForPapersSection() {
  return `
    <section class="section">
      <div class="wrap">
        <h2>Call for Papers</h2>
        <p>
          Für kommende Ausgaben der <em>Zeitschrift für Angewandte
          Lebensführung</em> suchen wir laufend nach Beiträgen, die sich
          mit den großen und kleinen Fragen des disziplinierten Lebens
          auseinandersetzen – je unkonventioneller der Ansatz, desto
          besser.
        </p>

        <h3>Mögliche Beitragsarten</h3>
        <ul>
          <li><strong>Forschungsartikel</strong> – berichten über originale Untersuchungen zur angewandten Lebensführung.</li>
          <li><strong>Übersichtsarbeiten</strong> – fassen den aktuellen Stand der Forschung zu einer relevanten Fragestellung zusammen.</li>
          <li><strong>Kurzmitteilungen</strong> – präsentieren bemerkenswerte Beobachtungen, überraschende Befunde oder gescheiterte Optimierungsversuche.</li>
          <li><strong>Perspektiven</strong> – skizzieren zukünftige Entwicklungen und Herausforderungen der Lebenspraxis.</li>
          <li><strong>Standpunkte</strong> – vertreten begründete Positionen zu kontroversen Fragen der Lebensführung.</li>
          <li><strong>Kommentare</strong> – diskutieren gesellschaftliche, organisatorische oder methodische Aspekte des Fachgebiets.</li>
          <li><strong>Nachrichten &amp; Höhepunkte</strong> – informieren über wichtige Entwicklungen aus Forschung, Alltag und Verwaltung.</li>
        </ul>

        <p>
          Themenvorschläge und vollständige Manuskripte sind
          an
          <a href="mailto:service@dr-methodius.com">service@dr-methodius.com</a> 
          zu senden.
        </p>
      </div>
    </section>

    <section class="section section-alt">
      <div class="wrap">
        <h2>Vorlagen für Einreichungen</h2>
        <p>
          Für die Manuskriptvorbereitung steht eine LaTeX-Vorlage zum
          Download bereit. Alternativ kann auch ein Word-Dokument
          ausgefüllt und eingereicht werden:
        </p>

        <p">
          <a class="quiz-start-button" href="assets/zeitschrift/vorlage.zip" download>
            Vorlage herunterladen
          </a>
        </p>

        <p>
          In beiden Fällen ist sicherzustellen, dass jegliches
          Zusatzmaterial – etwa Bilder – mitgeschickt wird.
        </p>

      </div>
    </section>
  `;
}

/*
  Die Seite ist noch nicht offiziell veröffentlicht - solange der
  Debug-Modus nicht aktiv ist (siehe istDebugModusAktiv() in
  js/datumsformat.js), wird statt des eigentlichen Inhalts nur ein
  Hinweis angezeigt. Einfach diesen Block entfernen, sobald die Seite
  freigegeben werden soll.
*/
if (!istDebugModusAktiv()) {

  container.innerHTML = `
    <section class="section">
      <div class="wrap">
        <h1>Zeitschrift für Angewandte Lebensführung</h1>
        <p>Diese Seite ist derzeit noch nicht öffentlich verfügbar.</p>
      </div>
    </section>
  `;

} else {

  fetch("md/zeitschrift.md")
  .then(antwort => {
    if (!antwort.ok) throw new Error("Datei nicht gefunden");
    return antwort.text();
  })
  .then(markdown => {

    const bloecke = parseMarkdownBloecke(markdown);

    const einleitung = `
      <section class="section">
        <div class="wrap">
          ${bloecke.join("\n")}
        </div>
      </section>
    `;

    container.innerHTML =
      einleitung +
      baueAusgabenSection() +
      baueCallForPapersSection();
  })
  .catch(() => {
    container.innerHTML = `
      <section class="section">
        <div class="wrap">
          <h1>Zeitschrift für Angewandte Lebensführung</h1>
          <p>Der Einleitungstext konnte leider nicht geladen werden.</p>
        </div>
      </section>
    ` + baueAusgabenSection() + baueCallForPapersSection();
  });

}