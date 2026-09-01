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

if (
  holeGefilterteRatgeber().length <= 3
) {

  const neuesteTitel =
    document.getElementById("neueste-titel");

  if (neuesteTitel) {
    neuesteTitel.textContent = "Alle verfügbaren Ratgeber";
  }

  const neuesteText =
    document.getElementById("neueste-text");

  if (neuesteText) {
    neuesteText.textContent =
      "Alle derzeit verfügbaren Ratgeber dieser Kategorie.";
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