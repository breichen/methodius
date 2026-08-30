/*
  Gemeinsame Kommentar-Logik für Ratgeber (buch.html) und Fallakten
  (problem.html).

  Lädt die Kommentare aus:

    md/<ordner>/<slug>.md

  Unterstütztes Format der Markdown-Datei:

    [Unbedacht | 0]
    Das ist ein Kommentar.

    [Redaktion | 1]
    Das ist eine Antwort auf den vorherigen Kommentar.

    [Unbedacht | 0]
    Dieser Kommentar beginnt wieder ganz links.

  "level" bestimmt die Einrückung:
    Level 0 = ganz links
    Level 1 = eine Ebene eingerückt
    Level 2 = zwei Ebenen eingerückt
    usw.

  Fehlt die Kommentar-Datei oder ist sie leer, wird trotzdem die
  Kommentar-Section mit einem entsprechenden Hinweis angezeigt.
*/


const kommentarAutoren = {

  "Unbedacht": {
    name: "Dr. Konrad Unbedacht",
    username: "@unbedacht"
  },

  "Wankelmuth": {
    name: "Prof. Dr. Hildegard Wankelmuth",
    username: "@hwankel"
  },

  "Huber": {
    name: "Dr. Konrad P. Huber",
    username: "@huber"
  },

  "Methodius": {
    name: "Dr. Maximilian Methodius",
    username: "@chef"
  },

  "Redaktion": {
    name: "Redaktion",
    username: "@methodius"
  },

  "Barbara": {
    name: "Barbara",
    username: "@babsi95"
  },

};


/*
  Lädt die Kommentar-Datei und baut anschließend die
  Kommentar-Section.

  Beispiel Ratgeber:

    ladeKommentare({
      slug: buch.slug,
      ordner: "ratgeber-kommentare",
      containerId: "buch-text",
      sectionId: "ratgeber-kommentare"
    });

  Beispiel Fallakte:

    ladeKommentare({
      slug: problem.id || problem.titel,
      ordner: "fallakten-kommentare",
      containerId: "problem-inhalt",
      sectionId: "fallakten-kommentare"
    });
*/

function ladeKommentare({
  slug,
  ordner,
  containerId,
  sectionId,
  ueberschrift = "Kommentare"
} = {}) {

  /*
    Parameter prüfen
  */

  if (
    typeof ordner !== "string" ||
    typeof containerId !== "string" ||
    typeof sectionId !== "string" ||
    (typeof slug !== "string" && typeof slug !== "number")
  ) {

    console.error(
      "ladeKommentare(): ungültige Parameter erhalten.",
      {
        slug,
        ordner,
        containerId,
        sectionId
      }
    );

    return;
  }


  /*
    Ziel-Element suchen
  */

  const zielElement =
    document.getElementById(containerId);

  if (!zielElement) {

    console.error(
      `ladeKommentare(): Element mit id="${containerId}" wurde nicht gefunden.`
    );

    return;
  }


  /*
    Pfad zur Markdown-Datei
  */

  const pfad =
    encodeURIComponent(slug);

  const url =
    `md/${ordner}/${pfad}.md`;

  console.log(
    "Lade Kommentar-Datei:",
    url
  );


  /*
    Kommentar-Section einfügen
  */

  function einfuegen(kommentare) {

    const kommentarHtml =
      baueKommentarBereich(
        kommentare,
        sectionId,
        ueberschrift
      );

    zielElement.insertAdjacentHTML(
      "beforeend",
      kommentarHtml
    );
  }


  /*
    Datei laden
  */

  fetch(url)

    .then(antwort => {

      if (!antwort.ok) {

        console.log(
          "Keine Kommentar-Datei gefunden:",
          url
        );

        /*
          Kein Fehler:
          Die Section soll trotzdem erscheinen.
        */

        return "";
      }

      return antwort.text();
    })


    .then(markdown => {

      /*
        Keine Datei oder leere Datei
      */

      if (
        !markdown ||
        !markdown.trim()
      ) {

        console.log(
          "Kommentar-Datei ist leer oder fehlt."
        );

        aktualisiereKommentarLink(0);

        einfuegen([]);

        return;
      }


      console.log(
        "Kommentar-Datei geladen:",
        markdown
      );


      /*
        Kommentare parsen
      */

      const kommentare =
        parseKommentare(markdown);


      console.log(
        "Gefundene Kommentare:",
        kommentare
      );


      /*
        Link oberhalb des Textes aktualisieren
      */

      aktualisiereKommentarLink(
        kommentare.length
      );


      /*
        Kommentar-Section einfügen
      */

      einfuegen(kommentare);

    })


    .catch(fehler => {

      console.error(
        "Fehler beim Laden der Kommentare:",
        fehler
      );

      /*
        Auch bei einem Ladefehler soll die
        Kommentar-Section sichtbar bleiben.
      */

      aktualisiereKommentarLink(0);

      einfuegen([]);
    });

}


/*
  PARSER
  ============================================

  Erwartetes Format:

    [Unbedacht | 0]
    Kommentartext

    [Redaktion | 1]
    Antwort

    [Unbedacht | 0]
    Neuer Hauptkommentar

  Die Zahl ist das Level der Einrückung.
*/

function parseKommentare(markdown) {

  const kommentare = [];


  /*
    Die Datei wird anhand der Kommentar-Kopfzeilen
    in einzelne Blöcke zerlegt.

    (?=^\[[^\]]+\|\s*\d+\]\s*$)
    erkennt die nächste Kommentar-Kopfzeile.
  */

  const bloecke = markdown
    .split(
      /\n\s*\n(?=^\[[^\]]+\|\s*\d+\]\s*$)/m
    )
    .map(block => block.trim())
    .filter(Boolean);


  /*
    Jeden Block einzeln verarbeiten
  */

  bloecke.forEach(block => {

    const match = block.match(
      /^\[([^\]|]+)\s*\|\s*(\d+)\]\s*\n([\s\S]*)$/m
    );


    if (!match) {

      console.warn(
        "Kommentar konnte nicht erkannt werden:",
        block
      );

      return;
    }


    const autor =
      match[1].trim();

    const level =
      Math.max(
        0,
        Number(match[2])
      );

    const text =
      match[3].trim();


    /*
      Leere Kommentare ignorieren
    */

    if (!text) {
      return;
    }


    kommentare.push({
      autor,
      level,
      text
    });

  });


  return kommentare;
}


/*
  BAUT DIE KOMMENTAR-SECTION
  ============================================
*/

function baueKommentarBereich(
  kommentare,
  sectionId,
  ueberschrift = "Kommentare"
) {

  /*
    Kommentare vorhanden
  */

  let beitraege = "";


  if (kommentare.length > 0) {

    beitraege = kommentare
      .map(kommentar => {

        /*
          Markdown des Kommentars in HTML umwandeln
        */

        const bloecke =
          parseMarkdownBloecke(
            kommentar.text
          );

        const html =
          bloecke.join("\n");


        /*
          Autorinformationen aus dem Mapping holen
        */

        const autorInfo =
          kommentarAutoren[kommentar.autor] || {
            name: kommentar.autor,
            username: ""
          };


        /*
          Redaktion bekommt weiterhin die
          entsprechende CSS-Klasse.

          Die tatsächliche Einrückung kommt aber
          NICHT mehr vom Autor, sondern vom Level.
        */

        const istRedaktion =
          kommentar.autor === "Redaktion";


        const klasse =
          istRedaktion
            ? "kommentar kommentar-redaktion"
            : "kommentar kommentar-unbedacht";


        /*
          Level bestimmt die Einrückung.

          42px pro Ebene.

          Inline-Style überschreibt damit auch die
          bisherige .kommentar-redaktion-Regel aus dem CSS,
          sodass z.B. eine Redaktion mit Level 0
          tatsächlich ganz links steht.
        */

        const einrueckung =
          kommentar.level * 42;


        return `
          <article
            class="${klasse}"
            data-level="${kommentar.level}"
            style="margin-left: ${einrueckung}px;"
          >

            <div
              class="kommentar-avatar"
              aria-hidden="true"
            >
              ${autorInfo.name.charAt(0)}
            </div>


            <div class="kommentar-inhalt">

              <div class="kommentar-meta">

                <span class="kommentar-autor">
                  ${autorInfo.name}
                </span>

                ${
                  autorInfo.username
                    ? `
                      <span class="kommentar-username">
                        ${autorInfo.username}
                      </span>
                    `
                    : ""
                }

              </div>


              <div class="kommentar-text">
                ${html}
              </div>

            </div>

          </article>
        `;

      })
      .join("\n");

  }


  /*
    Keine Kommentare vorhanden
  */

  else {

    beitraege = `
      <p class="kommentar-leer">
        Noch keine Kommentare vorhanden.
      </p>
    `;
  }


  /*
    Gesamte Section
  */

  return `
    <section
      id="${sectionId}"
      class="ratgeber-kommentare"
    >

      <div class="wrap">

        <div class="kommentar-spalte">

          <div class="kommentar-ueberschrift">

            <span class="kommentar-linie"></span>

            <h2>${ueberschrift}</h2>

          </div>


          <div class="kommentar-liste">

            ${beitraege}

          </div>

        </div>

      </div>

    </section>
  `;
}


/*
  AKTUALISIERT DEN KOMMENTARE-LINK
  ============================================
*/

function aktualisiereKommentarLink(anzahl) {

  const linkText =
    document.getElementById(
      "kommentar-link-text"
    );


  if (!linkText) {
    return;
  }


  if (anzahl === 0) {

    linkText.textContent =
      "Noch keine Kommentare";

  }

  else if (anzahl === 1) {

    linkText.textContent =
      "1 Kommentar";

  }

  else {

    linkText.textContent =
      `${anzahl} Kommentare`;

  }

}