/*
  Lädt md/author.md und zeigt die feste "Über den Autor"-Seite an.
  Nutzt dieselbe Basis-Markdown-Übersetzung wie die Ratgeber (siehe
  js/markdown.js), aber KEINE Kapitel-Logik (kein "Kapitel 1" o.ä. in
  diesem Dokument) und auch keine Blätter-Ansicht - stattdessen wird
  die letzte Namenszeile "Dr. Maximilian Methodius" zu einer Box mit
  Porträt umgebaut, unter der der komplette Rest des Dokuments steht.
*/

const container = document.getElementById("autor-inhalt");

fetch("md/author.md")
  .then(antwort => {
    if (!antwort.ok) throw new Error("Datei nicht gefunden");
    return antwort.text();
  })
  .then(markdown => {
    const bloecke = parseMarkdownBloecke(markdown);
    const bloeckeMitAbschluss = styleAutorAbschluss(bloecke);
    container.innerHTML = baueAutorSections(bloeckeMitAbschluss);
  })
  .catch(() => { /* unverändert */ });

// Findet die LETZTE Überschrift, deren Text exakt "Dr. Maximilian
// Methodius" lautet (das Ende des Dokuments), entfernt sie und baut
// stattdessen eine Box mit Porträt links sowie Name + dem kompletten
// restlichen Dokument rechts daneben - im selben Stil wie die
// Autor-Vorstellung am Anfang der Ratgeber (siehe buch.js).
function styleAutorAbschluss(bloecke) {
  const NAME_HEADING_REGEX = /^<h[1-3]>Dr\.?\s*Maximilian Methodius<\/h[1-3]>$/;

  let index = -1;
  bloecke.forEach((block, i) => {
    if (NAME_HEADING_REGEX.test(block)) index = i;
  });

  if (index === -1) return bloecke;

  const name = bloecke[index].replace(/^<h[1-3]>|<\/h[1-3]>$/g, "");
  const rest = bloecke.slice(index + 1);

  const nameBox = `<div class="autor-box autor-box-abschluss">
    <img class="autor-foto" src="pics/team/autor-portrait.png" alt="Porträt von Dr. Maximilian Methodius">
    <div class="autor-box-text">
      <p class="autor-name">${name}</p>
      ${rest.join("\n")}
    </div>
  </div>`;

  return [...bloecke.slice(0, index), nameBox];
}

// Wie baueKapitelSections() in buch.js: verpackt aufeinanderfolgende
// Blöcke abwechselnd in class="section" bzw. class="section section-alt",
// damit sich die Abschnitte der Autorseite farblich absetzen. Ein neuer
// Abschnitt beginnt bei jeder Überschrift (H1-H3) sowie bei der
// Abschluss-Box mit Porträt - die bekommt dadurch ebenfalls einen
// eigenen, in die Alternierung passenden Hintergrund.
const AUTOR_FULL_BLEED_STYLE =
  "position:relative;left:50%;right:50%;width:100vw;margin-left:-50vw;margin-right:-50vw;";

function baueAutorSections(bloecke) {
  const bloeckeOhneTrennlinie = bloecke.filter(block => block !== "<hr>");

  const abschnitte = [];
  let aktuellerAbschnitt = null;
  let ueberschriftenAnzahl = 0;

  bloeckeOhneTrennlinie.forEach(block => {
    const istUeberschrift =
      block.startsWith("<h1") ||
      block.startsWith("<h2") ||
      block.startsWith("<h3");

    const istAbschlussBox = block.startsWith('<div class="autor-box');
    const istAbschnittStart = istUeberschrift || istAbschlussBox;

    if (istUeberschrift) ueberschriftenAnzahl++;

    // Die allererste Überschrift (meist H1) startet Abschnitt 0. Die
    // darauffolgende ZWEITE Überschrift (meist die erste H2 direkt
    // danach) bleibt bewusst noch in Abschnitt 0, damit H1 und erste
    // H2 dieselbe Hintergrundfarbe teilen. Ab der dritten Überschrift
    // sowie bei der Abschluss-Box wird wie gewohnt alterniert.
    const zaehltAlsNeuerAbschnitt =
      istAbschnittStart &&
      aktuellerAbschnitt !== null &&
      !(istUeberschrift && ueberschriftenAnzahl === 2);

    if (zaehltAlsNeuerAbschnitt || aktuellerAbschnitt === null) {
      aktuellerAbschnitt = [];
      abschnitte.push(aktuellerAbschnitt);
    }

    aktuellerAbschnitt.push(block);
  });

  return abschnitte
    .map((abschnittBloecke, index) => {
      const klasse = index % 2 === 0 ? "section" : "section section-alt";
      return `<section class="${klasse}" style="${AUTOR_FULL_BLEED_STYLE}"><div class="wrap">${abschnittBloecke.join("\n")}</div></section>`;
    })
    .join("\n");
}
