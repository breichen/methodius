const container = document.getElementById("institut-inhalt");

fetch("md/institut.md")
  .then(antwort => {
    if (!antwort.ok) throw new Error("Datei nicht gefunden");
    return antwort.text();
  })
  .then(markdown => {

    const bloecke = parseMarkdownBloecke(markdown);

    const teamStart = bloecke.findIndex(
      block => block.includes("Das Team")
    );

    if (teamStart === -1) {
      container.innerHTML = baueInstitutSections(bloecke, 0);
      return;
    }

    const vorTeam = bloecke.slice(0, teamStart);
    const nachTeam = bloecke.slice(teamStart + 1);

    // Zuerst die Abschnitte vor dem Team bestimmen.
    const vorTeamAbschnitte = gruppiereInstitutSections(vorTeam);

    // Das Team folgt auf den letzten Abschnitt vor dem Team.
    const teamIndex = vorTeamAbschnitte.length;

    // Die Veröffentlichungen folgen direkt auf das Team.
    const veroeffentlichungenIndex = teamIndex + 1;

    // Nach den Veröffentlichungen geht die Farbfolge weiter.
    const nachTeamAbschnitte = gruppiereInstitutSections(nachTeam);
    const nachTeamStartIndex = veroeffentlichungenIndex + 1;

    container.innerHTML =
      rendereInstitutSections(vorTeamAbschnitte, 0) +
      baueTeamBereich(teamIndex) +
      baueVeroeffentlichungenBereich(veroeffentlichungenIndex) +
      rendereInstitutSections(nachTeamAbschnitte, nachTeamStartIndex);

    // Erst JETZT existiert #institut-veroeffentlichungen im DOM (siehe
    // baueVeroeffentlichungenBereich oben) - deshalb wird hier und
    // nicht am Dateiende nachgeladen.
    ladeVeroeffentlichungen();
  })
  .catch(() => {
    container.innerHTML = `
      <section class="section">
        <div class="wrap">
          <h1>Das Institut</h1>
          <p>Die Institutsunterlagen konnten leider nicht geladen werden.</p>
        </div>
      </section>
    `;
  });


/*
 * Teilt die Markdown-Blöcke in Abschnitte auf.
 *
 * Besonderheit:
 * Die H1 "Das Methodius-Institut" und die unmittelbar
 * folgende H2 bleiben gemeinsam im ersten Abschnitt.
 *
 * Danach beginnt jede H2/H3 einen neuen Abschnitt.
 */
function gruppiereInstitutSections(bloecke) {

  const abschnitte = [];
  let aktuellerAbschnitt = null;

  let h1Gefunden = false;
  let ersteH2NachH1 = false;

  bloecke.forEach(block => {

    const istH1 = block.startsWith("<h1");
    const istH2 = block.startsWith("<h2");
    const istH3 = block.startsWith("<h3");

    const bleibtBeiEinleitung =
      h1Gefunden &&
      istH2 &&
      !ersteH2NachH1;

    const startetNeuenAbschnitt =
      aktuellerAbschnitt !== null &&
      (istH1 || istH2 || istH3) &&
      !bleibtBeiEinleitung;

    if (startetNeuenAbschnitt || aktuellerAbschnitt === null) {
      aktuellerAbschnitt = [];
      abschnitte.push(aktuellerAbschnitt);
    }

    aktuellerAbschnitt.push(block);

    if (istH1) {
      h1Gefunden = true;
    }

    if (h1Gefunden && istH2) {
      ersteH2NachH1 = true;
    }
  });

  return abschnitte;
}


/*
 * Rendert eine Gruppe von Abschnitten.
 *
 * startIndex sorgt dafür, dass die alternierenden
 * Hintergrundfarben über getrennte Bereiche hinweg
 * korrekt weiterlaufen.
 */
function rendereInstitutSections(abschnitte, startIndex = 0) {

  return abschnitte
    .map((abschnitt, index) => {

      const farbIndex = startIndex + index;

      const klasse =
        farbIndex % 2 === 0
          ? "section"
          : "section section-alt";

      return `
        <section class="${klasse} institut-section">
          <div class="wrap">
            ${abschnitt.join("\n")}
          </div>
        </section>
      `;
    })
    .join("\n");
}


/*
 * Kompatibilitätsfunktion, falls sie an anderer Stelle
 * noch verwendet werden sollte.
 */
function baueInstitutSections(bloecke, startIndex = 0) {
  return rendereInstitutSections(
    gruppiereInstitutSections(bloecke),
    startIndex
  );
}


function baueTeamBereich(index) {

  const team = [
    {
      name: "Dr. Maximilian Methodius",
      rolle: "Gründer und Direktor",
      bild: "pics/team/autor-portrait.png",
      text: "Gründer des Instituts und wissenschaftlicher Leiter. Verfügt über umfassende Kenntnisse in praktisch allen Gebieten, die dringend einer Expertenmeinung bedürfen. Entwickelt die zentralen Theorien des Instituts, verfasst die Ratgeber und trifft die abschließenden Entscheidungen."
    },
    {
      name: "Prof. Dr. Hildegard Wankelmuth",
      rolle: "Leitung der Abteilung für angewandte Fehlberatung",
      bild: "pics/team/Wankelmuth.png",
      text: "Beschäftigt sich mit der kontrollierten Überinterpretation alltäglicher Verhaltensweisen und der Entwicklung wissenschaftlich fragwürdiger Behandlungsmethoden."
    },
    {
      name: "Dr. Konrad P. Huber",
      rolle: "Leitung der Abteilung für Statistik und empirische Plausibilität",
      bild: "pics/team/Huber.png",
      text: "Spezialist für statistische Auswertungen und eindeutige Aussagen bei uneindeutiger Datenlage."
    },
    {
      name: "Dr. Friedrich Unbedacht",
      rolle: "Wissenschaftlicher Beirat",
      bild: "pics/team/Unbedacht.png",
      text: "Zuständig für die wissenschaftliche Überprüfung der Institutsarbeit. Weist regelmäßig auf unbelegte Behauptungen, methodische Schwächen und logische Widersprüche hin. Seine Einwände werden sorgfältig protokolliert und anschließend ignoriert."
    },
    {
      name: "Sabine Krämer",
      rolle: "Leitung der Abteilung für Fallmanagement und Patientenangelegenheiten",
      bild: "pics/team/Kraemer.png",
      text: "Koordiniert die eingehenden Fälle, verwaltet die Fallakten und versucht seit Jahren, innerhalb des Instituts für Ordnung zu sorgen."
    }
  ];

  const karten = team.map(person => `
    <article class="team-card">

      <div class="team-photo-wrap">
        <img
          class="team-photo"
          src="${person.bild}"
          alt="Porträt von ${person.name}">
      </div>

      <div class="team-card-content">

        <h3>${person.name}</h3>

        <p class="team-role">
          ${person.rolle}
        </p>

        <p>
          ${person.text}
        </p>

      </div>

    </article>
  `).join("\n");

  const klasse =
    index % 2 === 0
      ? "section"
      : "section section-alt";

  return `
    <section class="${klasse} institut-team-section">

      <div class="wrap">

        <h2>Das Team</h2>

        <p class="team-intro">
          Hinter jeder erfolgreichen Untersuchung steht ein
          Team hochqualifizierter Mitarbeiter.
          Zumindest laut Institutsleitung.
        </p>

        <div class="team-grid">
          ${karten}
        </div>

      </div>

    </section>
  `;
}


/*
 * Veröffentlichungen der Institutsmitglieder.
 *
 * Die Daten werden separat aus
 * data/veroeffentlichungen.json geladen.
 *
 * Die JSON-Datei ist bereits nach Datum absteigend
 * sortiert, sodass die neueste Veröffentlichung oben steht.
 */
function baueVeroeffentlichungenBereich(index) {

  const klasse =
    index % 2 === 0
      ? "section"
      : "section section-alt";

  return `
    <section class="${klasse} institut-veroeffentlichungen-section">

      <div class="wrap">

        <h2>Veröffentlichungen</h2>

        <div id="institut-veroeffentlichungen">
          <p>Veröffentlichungen werden geladen …</p>
        </div>

      </div>

    </section>
  `;
}


/*
 * Wie viele Veröffentlichungen auf der Institutsseite angezeigt
 * werden, bevor stattdessen auf die vollständige Übersicht
 * (veroeffentlichungen.html) verwiesen wird.
 */
const INSTITUT_VEROEFFENTLICHUNGEN_ANZAHL = 5;

/*
 * Lädt die Veröffentlichungen und befüllt
 * den zuvor erzeugten Bereich.
 */
function ladeVeroeffentlichungen() {

  const container =
    document.getElementById("institut-veroeffentlichungen");

  if (!container) return;

  fetch("data/veroeffentlichungen.json")
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error("Veröffentlichungsdatei nicht gefunden");
      }

      return antwort.json();
    })
    .then(veroeffentlichungen => {

      // Veröffentlichungen mit einem Datum in der Zukunft werden
      // (noch) nicht angezeigt - so lassen sich zukünftige Einträge
      // schon jetzt in der JSON-Datei anlegen, ohne dass sie
      // vorzeitig sichtbar werden (siehe istDatumErreicht() in
      // js/datumsformat.js).
      const sichtbareVeroeffentlichungen = veroeffentlichungen.filter(
        veroeffentlichung => istDatumErreicht(veroeffentlichung.datum)
      );

      if (sichtbareVeroeffentlichungen.length === 0) {
        container.innerHTML = `
          <p>
            Bisher wurden keine Veröffentlichungen
            des Instituts verzeichnet.
          </p>
        `;
        return;
      }

      // Die JSON-Datei ist bereits nach Datum absteigend sortiert
      // (siehe Kommentar oben in baueVeroeffentlichungenBereich) -
      // die ersten N sichtbaren Einträge sind daher automatisch die
      // neuesten.
      const angezeigteVeroeffentlichungen =
        sichtbareVeroeffentlichungen.slice(
          0,
          INSTITUT_VEROEFFENTLICHUNGEN_ANZAHL
        );

      const kartenHtml =
        angezeigteVeroeffentlichungen
          .map(veroeffentlichung => `
            <article class="institut-veroeffentlichung">

              <p class="institut-veroeffentlichung-datum">
                ${formatiereDatumDeutsch(veroeffentlichung.datum)}
              </p>

              <h3>
                ${veroeffentlichung.titel}
              </h3>

              <p class="institut-veroeffentlichung-autoren">
                ${veroeffentlichung.autoren.join(", ")}
              </p>

            </article>
          `)
          .join("\n");

      const hatWeitereVeroeffentlichungen =
        sichtbareVeroeffentlichungen.length >
        INSTITUT_VEROEFFENTLICHUNGEN_ANZAHL;

      const linkHtml = hatWeitereVeroeffentlichungen
        ? `
          <p class="grid-link">
            <a href="veroeffentlichungen.html">
              Alle Veröffentlichungen ansehen →
            </a>
          </p>
        `
        : "";

      container.innerHTML = kartenHtml + linkHtml;

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Veröffentlichungen:",
        fehler
      );

      container.innerHTML = `
        <p>
          Die Veröffentlichungen konnten leider
          nicht geladen werden.
        </p>
      `;
    });
}


/*
 * Wird jetzt direkt nach dem Einfügen des Veröffentlichungen-Bereichs
 * aufgerufen (siehe oben im .then() der institut.md-Ladung), damit
 * #institut-veroeffentlichungen zu diesem Zeitpunkt garantiert existiert.
 */