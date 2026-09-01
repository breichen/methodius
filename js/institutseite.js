const container = document.getElementById("institut-inhalt");

fetch("md/institut.md")
  .then(antwort => {
    if (!antwort.ok) throw new Error("Datei nicht gefunden");
    return antwort.text();
  })
  .then(markdown => {

    const bloecke = parseMarkdownBloecke(markdown);

    // Der Abschnitt "Das Team" dient in institut.md nur als Marker -
    // Team und Veröffentlichungen werden auf dieser Seite nicht mehr
    // angezeigt, sondern leben jetzt auf der separaten Seite
    // "Mitglieder" (siehe mitglieder.html / js/mitgliederseite.js).
    const teamStart = bloecke.findIndex(
      block => block.includes("Das Team")
    );

    if (teamStart === -1) {
      container.innerHTML = baueInstitutSections(bloecke, 0);
      return;
    }

    const vorTeam = bloecke.slice(0, teamStart);
    const nachTeam = bloecke.slice(teamStart + 1);

    // Beide Teile werden weiterhin getrennt gruppiert (wie zuvor),
    // aber jetzt direkt hintereinander gerendert - ohne die Team- und
    // Veröffentlichungen-Bereiche dazwischen. nachTeamStartIndex sorgt
    // dafür, dass die alternierenden Hintergrundfarben nahtlos
    // weiterlaufen.
    const vorTeamAbschnitte = gruppiereInstitutSections(vorTeam);
    const nachTeamAbschnitte = gruppiereInstitutSections(nachTeam);
    const nachTeamStartIndex = vorTeamAbschnitte.length;

    container.innerHTML =
      rendereInstitutSections(vorTeamAbschnitte, 0) +
      rendereInstitutSections(nachTeamAbschnitte, nachTeamStartIndex);
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