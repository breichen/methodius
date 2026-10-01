import { readdirSync } from "node:fs";

export default function (eleventyConfig) {

  // ---------------------------------------------------------------
  // 1) Was gehört zur Website und wird unverändert übernommen?
  //    (Bilder, CSS, JS, Markdown-Texte, PDFs ...)
  // ---------------------------------------------------------------
  const unveraendert = [
    "style.css", "CNAME", "robots.txt", "fonts",
    "css", "js", "assets", "data", "md", "pdf"
  ];
  unveraendert.forEach(pfad => eleventyConfig.addPassthroughCopy(pfad));

  // ---------------------------------------------------------------
  // pics: alles kopieren, außer Arbeitsordner (Rohfassungen, Entwürfe ...)
  // ---------------------------------------------------------------
  const picsAusgeschlossen = new Set([
    "ratgeber-back-finalized", "ratgeber-back-todo",
    "ratgeber-back-nologo",    "ratgeber-back-raw",
    "ratgeber-front-finalized", "ratgeber-front-todo",
    "ratgeber-front-nologo",    "ratgeber-front-raw",
    "ratgeber-teaser-finalized", "ratgeber-teaser-todo",
    "ratgeber-teaser",           "ratgeber-teaser-raw"
  ]);

  for (const eintrag of readdirSync("pics", { withFileTypes: true })) {
    if (picsAusgeschlossen.has(eintrag.name)) continue;
    eleventyConfig.addPassthroughCopy(`pics/${eintrag.name}`);
  }

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
