const RatgeberKategorie = Object.freeze({
  ALLTAG_BERUF: "Alltag & Beruf",
  GESELLSCHAFT: "Gesellschaft",
  MEDIEN: "Medien",
  LEBEN: "Leben & Selbstoptimierung",
  KUNST_KULTUR: "Kunst & Kultur",
  WISSEN_TECHNIK: "Wissen & Technik"
});

const RatgeberKategorieInfo = Object.freeze({

  [RatgeberKategorie.ALLTAG_BERUF]: {
    slug: "alltag-beruf",
    beschreibung:
      "Effizient scheitern, beschäftigt wirken und den Arbeitsalltag wissenschaftlich fragwürdig optimieren."
  },

  [RatgeberKategorie.GESELLSCHAFT]: {
    slug: "gesellschaft",
    beschreibung:
      "Zwischenmenschliche Dynamiken, gesellschaftliche Trends und kollektive Fehlentscheidungen."
  },

  [RatgeberKategorie.MEDIEN]: {
    slug: "medien",
    beschreibung:
      "Nachrichten, soziale Netzwerke und die Kunst der gezielten Fehlinformation."
  },

  [RatgeberKategorie.LEBEN]: {
    slug: "leben",
    beschreibung:
      "Persönliche Entwicklung, Lebensführung und fragwürdige Wege zum Glück."
  },

  [RatgeberKategorie.KUNST_KULTUR]: {
    slug: "kunst-kultur",
    beschreibung:
      "Ästhetik, Kreativität und kulturelle Phänomene mit methodischer Unsicherheit."
  },

  [RatgeberKategorie.WISSEN_TECHNIK]: {
    slug: "wissen-technik",
    beschreibung:
      "Wissenschaftliche Erkenntnisse, technische Innovationen und deren kreative Fehlanwendung."
  }

});

const RatgeberKategorieSlug = Object.freeze(
  Object.fromEntries(
    Object.entries(RatgeberKategorieInfo)
      .map(([kategorie, info]) => [
        kategorie,
        info.slug
      ])
  )
);

const KategorieNachSlug = Object.freeze(
  Object.fromEntries(
    Object.entries(RatgeberKategorieInfo)
      .map(([kategorie, info]) => [
        info.slug,
        kategorie
      ])
  )
);