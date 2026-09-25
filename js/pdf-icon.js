/*
  Gemeinsame Logik für das PDF-Icon bei Veröffentlichungen, verwendet
  sowohl von js/veroeffentlichungen-seite.js (Institutsseite, alle
  Veröffentlichungen) als auch von js/mitarbeiter-detail.js
  (Publikationen einer einzelnen Person).
*/

// Checks whether a PDF exists for a given publication slug under
// pdf/papers/. Uses HEAD so the file itself isn't downloaded just to
// test for its presence.
function prüfePdfExistenz(slug) {
  if (!slug) return Promise.resolve(false);

  return fetch(`pdf/papers/${slug}.pdf`, { method: "HEAD" })
    .then(antwort => antwort.ok)
    .catch(() => false);
}

// Uses currentColor so it inherits the link's color (see
// .institut-veroeffentlichung-pdf-link in style.css), instead of an
// emoji glyph whose own colors don't adapt to the page's palette.
const PDF_ICON_SVG = `
  <svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
    <path d="M6 2h9l5 5v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V3a1 1 0 0 1 1-1z"
          fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
    <path d="M15 2v5h5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"/>
  </svg>
`;
