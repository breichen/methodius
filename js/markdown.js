/*
  Gemeinsamer, sehr einfacher Markdown-Übersetzer - genutzt sowohl von
  buch.js (Ratgeber-Seiten) als auch von autorseite.js (Über-den-Autor-
  Seite). Reicht für #/##/###-Überschriften, **fett**, *kursiv*,
  > Zitate, - Listen, --- als Trennlinie und normale Absätze. Kein
  Ersatz für eine vollständige Markdown-Bibliothek, aber genug für
  unsere Texte.
*/

// Wandelt **fett** und *kursiv* um. Nutzt [\s\S] statt "." und das
// "g"-Flag OHNE "s", damit die Formatierung auch über mehrere Zeilen
// hinweg funktioniert (z.B. bei einem kursiven Absatz, der mit
// Zeilenumbrüchen über drei Zeilen geht).
function inlineFormat(text) {
  return text
    .replace(/\*\*([\s\S]+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([\s\S]+?)\*/g, "<em>$1</em>");
}

// Wandelt Markdown in ein Array von HTML-Blöcken um (ein Eintrag pro
// Absatz/Überschrift/Trennlinie/Zitat/Liste) - die "rohe" Übersetzung,
// noch ohne Kapitel- oder Autor-spezifische Nachbearbeitung.
function parseMarkdownBloecke(markdown) {
  const bloecke = markdown.trim().split(/\n\s*\n/);

  return bloecke.map(block => {
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

    /*
     * MARKDOWN-ZITATE
     * > **„Ich habe gestern etwas gemacht.“**
     * Das ">" wird entfernt, Anführungszeichen ebenfalls (kommen als
     * ::before-Dekoration wieder), Rest als <blockquote>.
     */
    const zitatZeilen = zeile.split("\n").map(z => z.trim());

    if (zitatZeilen.length > 0 && zitatZeilen.every(z => z.startsWith(">"))) {
      const zitatInhalt = zitatZeilen
        .map(z => z.replace(/^>\s?/, ""))
        .map(z => z.replace(/^(\*\*|__)?["„“‚‘]+/, "$1"))
        .map(z => z.replace(/["„“‚‘]+(\*\*|__)?$/, "$1"))
        .join("\n");

      return `<blockquote>${inlineFormat(zitatInhalt).replace(/\n/g, "<br>")}</blockquote>`;
    }

    // Markdown-Aufzählung: mehrere Zeilen, die mit "- " beginnen,
    // werden zu einer echten <ul>-Liste.
    const zeilen = zeile.split("\n").map(z => z.trim());

    if (zeilen.length > 0 && zeilen.every(z => z.startsWith("- "))) {
      const items = zeilen.map(z => `<li>${inlineFormat(z.slice(2))}</li>`).join("");
      return `<ul>${items}</ul>`;
    }

    // Normaler Absatz: **/*-Formatierung wird auf den GANZEN Block
    // angewendet (funktioniert dadurch auch über Zeilenumbrüche
    // hinweg), erst danach werden echte Zeilenumbrüche zu <br>.
    return `<p>${inlineFormat(zeile).replace(/\n/g, "<br>")}</p>`;
  });
}
