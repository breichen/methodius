function holeAktuelleKategorie() {

  const urlParameter =
    new URLSearchParams(window.location.search);

  const kategorieSlug =
    urlParameter.get("kategorie");

  return KategorieNachSlug[kategorieSlug] ?? null;
}

function holeGefilterteRatgeber() {

  const kategorie = holeAktuelleKategorie();

  let ratgeber = ratgeberListe.filter(
    buch =>
      buch.erstellt &&
      istDatumErreicht(buch.erstellt)
  );

  if (kategorie) {
    ratgeber = ratgeber.filter(
      buch => buch.kategorie === kategorie
    );
  }

  return ratgeber;
}

const kategorie = holeAktuelleKategorie();

if (kategorie) {

    document.title =
      `${kategorie} – Dr. Methodius`;

    const seitenTitel =
      document.getElementById("seiten-titel");

    if (seitenTitel) {
      seitenTitel.textContent =
        `Ratgeber: ${kategorie}`;
    }

    const seitenEinleitung =
      document.getElementById("seiten-einleitung");

    if (seitenEinleitung) {
      seitenEinleitung.textContent =
        `Hier findest du sämtliche Ratgeber von Dr. Maximilian Methodius in der Kategorie „${kategorie}“.`;
    }

    const neuesteTitel =
      document.getElementById("neueste-titel");

    if (neuesteTitel) {
      neuesteTitel.textContent =
        `Neueste Ratgeber aus ${kategorie}`;
    }

    const neuesteText =
      document.getElementById("neueste-text");

    if (neuesteText) {
      neuesteText.textContent =
        `Die neuesten Veröffentlichungen aus der Kategorie „${kategorie}“.`;
    }

    const empfehlungenTitel =
      document.getElementById("empfehlungen-titel");

    if (empfehlungenTitel) {
      empfehlungenTitel.textContent =
        `Zufällige Empfehlungen aus ${kategorie}`;
    }

    const empfehlungenText =
      document.getElementById("empfehlungen-text");

    if (empfehlungenText) {
      empfehlungenText.textContent =
        `Drei zufällig ausgewählte Ratgeber aus der Kategorie „${kategorie}“.`;
    }

    const alleTitel =
      document.getElementById("alle-titel");

    if (alleTitel) {
      alleTitel.textContent =
        `Alle Ratgeber aus ${kategorie}`;
    }

    const alleText =
      document.getElementById("alle-text");

    if (alleText) {
      alleText.textContent =
        `Die vollständige Sammlung aller bisher veröffentlichten Ratgeber aus der Kategorie „${kategorie}“.`;
    }
}

const gefilterteRatgeberTmp =
  holeGefilterteRatgeber();

if (gefilterteRatgeberTmp.length === 0) {

  const neuesteTitel =
    document.getElementById("neueste-titel");

  if (neuesteTitel) {
    neuesteTitel.textContent = "Alle Ratgeber";
  }

  const neuesteText =
    document.getElementById("neueste-text");

  if (neuesteText) {
    neuesteText.textContent =
      "Derzeit sind in diesem Bereich noch keine Ratgeber verfügbar.";
  }

  document
    .getElementById("neueste-ratgeber")
    ?.remove();

  document
    .getElementById("empfehlungen")
    ?.remove();

  document
    .getElementById("alle-ratgeber-sektion")
    ?.remove();
}
else if (gefilterteRatgeberTmp.length <= 3) {

  const neuesteTitel =
    document.getElementById("neueste-titel");

  if (neuesteTitel) {
    neuesteTitel.textContent = "Alle Ratgeber";
  }

  const neuesteText =
    document.getElementById("neueste-text");

  if (neuesteText) {
    neuesteText.textContent =
      "Alle derzeit verfügbaren Ratgeber.";
  }

  document
    .getElementById("empfehlungen")
    ?.remove();

  document
    .getElementById("alle-ratgeber-sektion")
    ?.remove();

  document
    .getElementById("thema-anfragen")
    ?.classList.remove("section-alt");
}


function baueKategorienBereich() {

  const section =
    document.getElementById(
      "ratgeber-kategorien"
    );

  const container =
    document.getElementById(
      "ratgeber-kategorien-container"
    );

  if (!section || !container) return;

  // Nur auf der Gesamtübersicht anzeigen
  if (holeAktuelleKategorie()) {
    section.remove();
    return;
  }

  const kategorien =
    Object.entries(
      RatgeberKategorieInfo
    );

  container.innerHTML = `

    <h2>Nach Themen stöbern</h2>

    <p>
      Du suchst Rat zu einem bestimmten Lebensbereich?
      Wähle eine Kategorie und entdecke die passenden
      Veröffentlichungen von Dr. Methodius.
    </p>

    <div class="kategorie-grid">

      ${kategorien.map(
        ([titel, info]) => `

          <a
            class="kategorie-card"
            href="alle-ratgeber.html?kategorie=${info.slug}">

            <h3>${titel}</h3>

            <p>
              ${info.beschreibung}
            </p>

          </a>

        `
      ).join("")}

    </div>

  `;
}

function aktualisiereSectionFarben() {

  const sektionen = Array.from(
    document.querySelectorAll("section")
  );

  sektionen.forEach((sektion, index) => {

    sektion.classList.remove("section-alt");

    if (index % 2 === 1) {
      sektion.classList.add("section-alt");
    }

  });
}

baueKategorienBereich();
aktualisiereSectionFarben();