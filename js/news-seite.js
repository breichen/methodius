/*
  Lädt und rendert die News-Beiträge aus newsListe.

  Die Markdown-Dateien liegen unter:

    md/news/

  Unterstützt werden alle Formatierungen, die
  parseMarkdownBloecke() aus markdown.js versteht,
  insbesondere:

  **fett**

  *kursiv*

  "datum" in newsListe (siehe js/news.js) liegt im ISO-Format
  (YYYY-MM-DD) vor und wird über formatiereDatumDeutsch() (siehe
  js/datumsformat.js) in die deutsche Lesefassung umgewandelt.
*/

const newsContainer = document.getElementById("news-liste");

// Anzahl der Absätze (Markdown-Blöcke), die standardmäßig sichtbar
// sind, bevor ein "Mehr"-Button den Rest einblendet.
const NEWS_TEASER_BLOECKE = 2;

// true: Link und Bild eines Beitrags werden - genau wie der restliche
// Text - erst beim Ausklappen sichtbar.
// false: Link und Bild sind immer sichtbar, unabhängig vom Ausklapp-
// Zustand des Textes.
const NEWS_LINK_UND_BILD_NUR_BEI_MEHR = true;

// true: der neueste Beitrag (der erste in newsListe, siehe js/news.js)
// ist von Anfang an komplett ausgeklappt, alle anderen eingeklappt.
// false: alle Beiträge starten eingeklappt.
const NEWS_ERSTEN_BEITRAG_AUSGEKLAPPT = true;

// Delegierter Klick-Handler für alle "Mehr"/"Weniger"-Buttons - EINMAL
// registriert, funktioniert aber auch für Buttons, die erst später
// (nach dem Laden der Beiträge) in den Container eingefügt werden.
//
// Ein Button kann mehrere Elemente gleichzeitig ein-/ausblenden (z.B.
// den restlichen Text UND den Link/Bild-Block) - dafür bekommen alle
// zusammengehörigen Elemente dasselbe data-mehr-gruppe="<index>" und
// werden hier gemeinsam umgeschaltet.
newsContainer.addEventListener("click", event => {

  const button = event.target.closest(".news-mehr-button");

  if (!button) {
    return;
  }

  const gruppe = button.dataset.group;

  const zielElemente = newsContainer.querySelectorAll(
    `[data-mehr-gruppe="${gruppe}"]`
  );

  if (zielElemente.length === 0) {
    return;
  }

  // Zustand am ersten Element der Gruppe ablesen - alle Elemente
  // derselben Gruppe sind immer synchron (hidden oder nicht).
  const istEingeklappt = zielElemente[0].hasAttribute("hidden");

  zielElemente.forEach(element => {
    if (istEingeklappt) {
      element.removeAttribute("hidden");
    } else {
      element.setAttribute("hidden", "");
    }
  });

  button.textContent = istEingeklappt ? "Weniger anzeigen" : "Mehr anzeigen";
});


function ladeNews() {

  /*
    Nur Beiträge anzeigen, die ein "datum" haben UND dessen Datum
    bereits erreicht ist (heute oder in der Vergangenheit) - siehe
    istDatumErreicht() in js/datumsformat.js. Beiträge ohne Datum
    oder mit einem Datum in der Zukunft werden ausgeblendet. Der
    neue Index in der gefilterten Liste bestimmt danach weiterhin
    die Sektions-Abwechslung und welcher Beitrag initial
    ausgeklappt startet.
  */
  const sichtbareNews = (newsListe || []).filter(
    beitrag => beitrag.datum && istDatumErreicht(beitrag.datum)
  );

  if (sichtbareNews.length === 0) {
    newsContainer.innerHTML = `
      <p>Derzeit gibt es keine Neuigkeiten.</p>
    `;
    return;
  }

  /*
    Die neuesten Beiträge stehen in news.js oben.
  */

  Promise.all(
    sichtbareNews.map((beitrag, index) =>
      ladeNewsBeitrag(beitrag, index)
    )
  )
    .then(beitragHtml => {

      newsContainer.innerHTML =
        beitragHtml.join("\n");

    })
    .catch(fehler => {

      console.error(
        "Fehler beim Laden der News:",
        fehler
      );

      newsContainer.innerHTML = `
        <p>
          <em>
            Die News konnten leider nicht geladen werden.
          </em>
        </p>
      `;
    });
}


function ladeNewsBeitrag(beitrag, index) {

  const pfad =
    `md/news/${encodeURIComponent(beitrag.datei)}`;

  return fetch(pfad)
    .then(antwort => {

      if (!antwort.ok) {
        throw new Error(
          `News-Datei nicht gefunden: ${beitrag.datei}`
        );
      }

      return antwort.text();
    })
    .then(markdown => {

      const bloecke =
        parseMarkdownBloecke(markdown);

      /*
        Nur die ersten NEWS_TEASER_BLOECKE Absätze standardmäßig
        zeigen. Der Rest landet in einem versteckten Container, der
        erst über den "Mehr"-Button (siehe Klick-Handler oben)
        eingeblendet wird - und nur dann, wenn es überhaupt mehr zu
        zeigen gibt.
      */

      const teaserBloecke =
        bloecke.slice(0, NEWS_TEASER_BLOECKE);

      const restBloecke =
        bloecke.slice(NEWS_TEASER_BLOECKE);

      const teaserHtml =
        teaserBloecke.join("\n");

      const hatZusaetzlichenText =
        restBloecke.length > 0;

      /*
        Der neueste Beitrag (index === 0) kann per
        NEWS_ERSTEN_BEITRAG_AUSGEKLAPPT von Anfang an komplett
        ausgeklappt starten - alle anderen starten eingeklappt.
      */

      const istInitialAusgeklappt =
        NEWS_ERSTEN_BEITRAG_AUSGEKLAPPT && index === 0;

      // Als Attribut-String für die Templates unten: "hidden" oder
      // "" (leer), je nachdem, ob dieser Beitrag initial eingeklappt
      // oder ausgeklappt sein soll.
      const hiddenAttribut =
        istInitialAusgeklappt ? "" : "hidden";

      /*
        Optionaler Link, z.B. zum neuen Ratgeber.
      */

      let linkHtml = "";

      if (beitrag.link) {

        linkHtml = `
          <p class="news-link-wrap">
            <a
              href="${beitrag.link}"
              class="news-link"
            >
              ${beitrag.linkText || "Mehr erfahren"} →
            </a>
          </p>
        `;
      }


      /*
        Optionales Bild.

        Das Bild steht bewusst GANZ AM ENDE
        des Beitrags.
      */

      let bildHtml = "";

      if (beitrag.bild) {

        bildHtml = `
          <img
            class="news-bild"
            src="${beitrag.bild}"
            alt=""
            loading="lazy"
          >
        `;
      }

      const hatBild = Boolean(beitrag.bild);
      const hatLink = Boolean(beitrag.link);

      // Ein Bild rechtfertigt für sich allein schon einen
      // "Mehr"-Button - ein Link dagegen NICHT: ein Beitrag, der nur
      // wegen seines Links "unvollständig" wäre, zeigt den Link
      // stattdessen sofort an, ganz ohne Button und ohne ihn zu
      // verstecken (siehe hatMehrInhalt und linkUndBildVerstecken
      // unten).
      const bildRechtfertigtMehrButton =
        NEWS_LINK_UND_BILD_NUR_BEI_MEHR && hatBild;

      // Gibt es überhaupt etwas, das einen "Mehr"-Button rechtfertigt
      // (zusätzlicher Text ODER ein zu versteckendes Bild)?
      const hatMehrInhalt =
        hatZusaetzlichenText || bildRechtfertigtMehrButton;

      // Link und Bild werden nur dann versteckt, wenn es ohnehin
      // schon einen Button gibt (wegen Text oder Bild) - ein Beitrag,
      // der NUR wegen des Links "mehr" bräuchte, bleibt komplett
      // sichtbar, ohne Button.
      const linkUndBildVerstecken =
        NEWS_LINK_UND_BILD_NUR_BEI_MEHR &&
        hatMehrInhalt &&
        (hatLink || hatBild);

      /*
        Die Beiträge wechseln sich farblich ab.
        Der erste Beitrag verwendet .section,
        der zweite .section-alt, der dritte wieder
        .section usw.
      */

      const sectionKlasse =
        index % 2 === 0
          ? "section"
          : "section section-alt";

      /*
        Der ausklappbare Rest-Text wird ABSICHTLICH INNERHALB von
        .news-text verschachtelt (statt als Geschwister-Element
        danach): so bleibt die bestehende Regel
        ".news-text p:last-child { margin-bottom: 0; }" korrekt -
        sie entfernt dann weiterhin nur den Abstand nach dem
        WIRKLICH letzten Absatz des Beitrags, nicht mehr fälschlich
        nach dem letzten Teaser-Absatz.
      */

      let restTextHtml = "";

      if (hatZusaetzlichenText) {
        restTextHtml = `
          <div
            class="news-text-rest"
            data-mehr-gruppe="${index}"
            ${hiddenAttribut}
          >
            ${restBloecke.join("\n")}
          </div>
        `;
      }

      /*
        Link und Bild: je nach NEWS_LINK_UND_BILD_NUR_BEI_MEHR entweder
        immer sichtbar, oder in denselben versteckten Zustand versetzt
        wie der restliche Text (gehören dann zur selben
        data-mehr-gruppe und werden vom selben Button umgeschaltet).
      */

      const linkUndBildHtml = `${linkHtml}${bildHtml}`;

      const linkUndBildBereichHtml = linkUndBildVerstecken
        ? `
          <div
            class="news-link-bild-wrap"
            data-mehr-gruppe="${index}"
            ${hiddenAttribut}
          >
            ${linkUndBildHtml}
          </div>
        `
        : linkUndBildHtml;

      const mehrButtonHtml = hatMehrInhalt
        ? `
          <button
            type="button"
            class="news-mehr-button"
            data-group="${index}"
          >
            ${istInitialAusgeklappt ? "Weniger anzeigen" : "Mehr anzeigen"}
          </button>
        `
        : "";


      /*
        Reihenfolge von Button und Link/Bild-Bereich hängt von
        NEWS_LINK_UND_BILD_NUR_BEI_MEHR ab: sind Link und Bild Teil des
        versteckten Bereichs, soll der "Mehr"/"Weniger"-Button logisch
        danach kommen (also unter dem Bild), nicht davor.
      */

      return `
        <section class="news-beitrag ${sectionKlasse}">

          <div class="wrap">

            <div class="news-meta">
              ${beitrag.datum ? formatiereDatumDeutsch(beitrag.datum) : ""}
            </div>

            <h2 class="news-titel">
              ${beitrag.titel}
            </h2>

            <div class="news-text">
              ${teaserHtml}
              ${restTextHtml}
            </div>

            ${NEWS_LINK_UND_BILD_NUR_BEI_MEHR
              ? `${linkUndBildBereichHtml}\n${mehrButtonHtml}`
              : `${mehrButtonHtml}\n${linkUndBildBereichHtml}`}

          </div>

        </section>
      `;
    });
}


ladeNews();