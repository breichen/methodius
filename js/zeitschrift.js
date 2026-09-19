/*
  Baut die Seite "Zeitschrift für Angewandte Lebensführung"
  (zeitschrift.html) aus drei Teilen:

    1. Einleitungstext - aus md/zeitschrift.md geladen, genau wie bei
       js/institutseite.js.
    2. Die bisher erschienenen Ausgaben (Band und Heft). Ein Klick
       führt zur Seite zeitschrift-heft.html (js/zeitschrift-heft.js),
       die alle Beiträge der Ausgabe auflistet. Die Daten stehen in
       js/zeitschrift-ausgaben.js. Solange dort noch keine Ausgabe
       eingetragen ist, muss die Seite trotzdem sauber funktionieren,
       siehe baueAusgabenSection().
    3. Call for Papers - statischer Text mit Kontakt-E-Mail, gefolgt
       von den Vorlagen für Einreichungen.

  Ausgaben mit einem "erstellt"-Datum in der Zukunft werden - wie bei
  Ratgeber, News und Fallakten auch - erst ab diesem Datum angezeigt
  (siehe istDatumErreicht() in js/datumsformat.js). Muss VOR dieser
  Datei geladen sein, ebenso wie js/zeitschrift-ausgaben.js und
  js/markdown.js (parseMarkdownBloecke).
*/

const container = document.getElementById("zeitschrift-inhalt");

function baueAusgabenKarte(ausgabe) {

  const anzahl = (ausgabe.beitraege || []).length;

  const details = [
    ausgabe.erstellt
      ? `Erschienen: ${formatiereDatumDeutsch(ausgabe.erstellt)}`
      : "",
    anzahl > 0
      ? (anzahl === 1 ? "1 Beitrag" : `${anzahl} Beiträge`)
      : "",
  ].filter(Boolean).join(" · ");

  return `
    <li class="zeitschrift-ausgabe">
      <a class="zeitschrift-ausgabe-link" href="${zeitschriftEscape(zeitschriftHeftUrl(ausgabe))}">
        <span class="zeitschrift-ausgabe-info">
          <span class="zeitschrift-ausgabe-nummer">Band ${zeitschriftEscape(ausgabe.band)}, Heft ${zeitschriftEscape(ausgabe.heft)}</span>
          ${details ? `<span class="zeitschrift-ausgabe-datum">${details}</span>` : ""}
        </span>
        <span class="zeitschrift-ausgabe-cta">Beiträge ansehen &rarr;</span>
      </a>
    </li>
  `;
}

function baueAusgabenSection() {

  const sichtbareAusgaben = zeitschriftSichtbareAusgaben();

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
          Sobald sie erschienen ist, werden hier alle Ausgaben mit
          ihren Beiträgen aufgelistet.
        </p>
      `;

  return `
    <section class="section section-alt">
      <div class="wrap">
        <h2>Bisher erschienene Ausgaben</h2>
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

        <p>
          <a class="quiz-start-button" href="assets/zeitschrift/zal-vorlage.zip" download>
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