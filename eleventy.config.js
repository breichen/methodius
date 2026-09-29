export default function (eleventyConfig) {

  // ---------------------------------------------------------------
  // 1) Was gehört zur Website und wird unverändert übernommen?
  //    (Bilder, CSS, JS, Markdown-Texte, PDFs ...)
  // ---------------------------------------------------------------
  const unveraendert = [
    "style.css", "CNAME",
    "css", "js", "assets", "data", "md", "pics", "pdf", "out"
  ];
  unveraendert.forEach(pfad => eleventyConfig.addPassthroughCopy(pfad));

  // ---------------------------------------------------------------
  // 2) Was ist nur Arbeitsmaterial und soll NICHT in die Website?
  // ---------------------------------------------------------------
  ["papers", "journal", "python", "prompts", "test"].forEach(ordner =>
    eleventyConfig.ignores.add(`${ordner}/**`)
  );
  eleventyConfig.ignores.add("ANLEITUNG.md");

  // ---------------------------------------------------------------
  // 3) Bestehende URLs behalten: studium.html bleibt studium.html
  // ---------------------------------------------------------------
  eleventyConfig.addGlobalData("permalink", () => {
    return (data) => `${data.page.filePathStem}.html`;
  });

  eleventyConfig.addPassthroughCopy({
    "node_modules/@supabase/supabase-js/dist/umd/supabase.js": "vendor/supabase-js.js",
    "node_modules/html2canvas/dist/html2canvas.min.js": "vendor/html2canvas.min.js",
    "node_modules/jspdf/dist/jspdf.umd.min.js": "vendor/jspdf.umd.min.js"
  });

  return {
    // Nur .html und .njk werden als Seiten verarbeitet.
    // Deine .md-Dateien in md/ bleiben Rohdaten (werden von deinem JS geladen).
    templateFormats: ["html", "njk"],
    htmlTemplateEngine: "njk",
    dir: {
      input: ".",
      includes: "_includes",
      data: "_data",
      output: "_site"
    }
  };
}
