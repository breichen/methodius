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
    container.innerHTML = styleAutorAbschluss(bloecke).join("\n");
  })
  .catch(() => {
    container.innerHTML = `
      <p><em>Die Seite über den Autor konnte nicht geladen werden.
      Läuft die Seite über einen lokalen Server (nicht per Doppelklick geöffnet)?</em></p>
    `;
  });

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
    <img class="autor-foto" src="pics/autor-portrait.png" alt="Porträt von Dr. Maximilian Methodius">
    <div class="autor-box-text">
      <p class="autor-name">${name}</p>
      ${rest.join("\n")}
    </div>
  </div>`;

  return [...bloecke.slice(0, index), nameBox];
}
