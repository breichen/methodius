/*
  Kategorien für Fallakten (Probleme).

  Eigenständiges Enum, bewusst getrennt von den Ratgeber-Kategorien
  (RatgeberKategorie aus js/ratgeber-kategorien.js) - Fallakten werden
  nicht zwangsläufig in dieselben Kategorien einsortiert wie Ratgeber.

  Aktuell gibt es nur einen Platzhalter-Typ ("Allgemein"). Weitere
  Kategorien lassen sich hier einfach ergänzen, sobald sie gebraucht
  werden - Aufbau und Verwendung (u. a. in js/probleme-filter.js)
  sind analog zu RatgeberKategorie/RatgeberKategorieInfo in
  js/ratgeber-kategorien.js gehalten.
*/

const ProblemKategorie = Object.freeze({
  ALLGEMEIN: "Allgemein"
});

const ProblemKategorieInfo = Object.freeze({

  [ProblemKategorie.ALLGEMEIN]: {
    slug: "allgemein",
    beschreibung:
      "Fallakten ohne speziellere Einordnung."
  }

});

const ProblemKategorieSlug = Object.freeze(
  Object.fromEntries(
    Object.entries(ProblemKategorieInfo)
      .map(([kategorie, info]) => [
        kategorie,
        info.slug
      ])
  )
);

const ProblemKategorieNachSlug = Object.freeze(
  Object.fromEntries(
    Object.entries(ProblemKategorieInfo)
      .map(([kategorie, info]) => [
        info.slug,
        kategorie
      ])
  )
);
