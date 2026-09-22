/*
  Darstellung der Alltagsstudien-Übersicht.

  - Neueste: kompakte chronologische Liste
  - Zufällige: kompakte Liste mit zufälliger Auswahl
  - Alle: vollständige chronologische Liste

  Alle drei Bereiche verwenden dasselbe Darstellungsformat.

  Die Studien selbst werden in
  js/alltagsstudien.js verwaltet.
*/


/* ==========================================
   KONFIGURATION
   ========================================== */

const ANZAHL_NEUESTE = 4;
const ANZAHL_ZUFAELLIGE = 4;


/* ==========================================
   HILFSFUNKTIONEN
   ========================================== */

function mischenAlltagsstudien(array) {

  const kopie = [...array];

  for (let i = kopie.length - 1; i > 0; i--) {

    const j =
      Math.floor(Math.random() * (i + 1));

    [kopie[i], kopie[j]] =
      [kopie[j], kopie[i]];

  }

  return kopie;
}


function baueAlltagsstudienZeile(studie, nummer) {

  const pfad =
    encodeURIComponent(studie.slug);

  const datum =
    studie.datum
      ? formatiereDatumDeutsch(studie.datum)
      : "";

  return `
    <a
      class="alltagsstudie-register-zeile"
      href="alltagsstudie.html?titel=${pfad}">

      <span class="alltagsstudie-register-nummer">
        AS-${String(nummer).padStart(3, "0")}
      </span>

      <span class="alltagsstudie-register-titel">
        ${studie.titel}
      </span>

      ${
        datum
          ? `
            <span class="alltagsstudie-register-datum">
              ${datum}
            </span>
          `
          : ""
      }

    </a>
  `;
}


/*
  Rendert eine Liste von Studien.

  Die Nummer wird anhand der ursprünglichen Position
  in verfuegbareAlltagsstudien ermittelt.
*/

function rendereAlltagsstudien(container, studien) {

  if (!container) return;

  container.innerHTML =
    studien
      .map(studie => {

        const index =
          verfuegbareAlltagsstudien.indexOf(studie);

        const nummer =
          index + 1;

        return baueAlltagsstudienZeile(
          studie,
          nummer
        );

      })
      .join("");
}


/* ==========================================
   VERFÜGBARE STUDIEN
   ========================================== */

const verfuegbareAlltagsstudien =
  holeVerfuegbareAlltagsstudien();


/* ==========================================
   NEUESTE
   ========================================== */

const containerNeueste =
  document.getElementById(
    "neueste-alltagsstudien"
  );


if (containerNeueste) {

  const neueste =
    verfuegbareAlltagsstudien
      .slice(-ANZAHL_NEUESTE)
      .reverse();

  rendereAlltagsstudien(
    containerNeueste,
    neueste
  );

}


/* ==========================================
   ZUFÄLLIGE
   ========================================== */

const containerZufaellige =
  document.getElementById(
    "zufaellige-alltagsstudien"
  );


if (containerZufaellige) {

  const zufaellige =
    mischenAlltagsstudien(
      verfuegbareAlltagsstudien
    ).slice(0, ANZAHL_ZUFAELLIGE);

  rendereAlltagsstudien(
    containerZufaellige,
    zufaellige
  );

}


/* ==========================================
   ALLE
   ========================================== */

const containerAlle =
  document.getElementById(
    "alle-alltagsstudien"
  );


if (containerAlle) {

  /*
    "Alle" bewusst als vollständiges Register.

    Die neueste Studie steht oben.
    Die Reihenfolge entspricht damit der
    Reihenfolge der Veröffentlichungen.
  */

  const alle =
    [...verfuegbareAlltagsstudien].reverse();

  rendereAlltagsstudien(
    containerAlle,
    alle
  );

}


/* ==========================================
   LEERE ZUSTÄNDE
   ========================================== */

if (!verfuegbareAlltagsstudien.length) {

  const neuesteTitel =
    document.getElementById(
      "neueste-titel"
    );

  if (neuesteTitel) {
    neuesteTitel.textContent =
      "Alltagsstudien";
  }


  const neuesteText =
    document.getElementById(
      "neueste-text"
    );

  if (neuesteText) {
    neuesteText.textContent =
      "Derzeit sind noch keine Alltagsstudien veröffentlicht.";
  }


  document
    .getElementById("neueste-alltagsstudien")
    ?.remove();


  document
    .getElementById("empfehlungen")
    ?.remove();


  document
    .getElementById("alle-alltagsstudien-sektion")
    ?.remove();

}
else if (
  verfuegbareAlltagsstudien.length <= ANZAHL_NEUESTE
) {

  const neuesteTitel =
    document.getElementById(
      "neueste-titel"
    );

  if (neuesteTitel) {
    neuesteTitel.textContent =
      "Alle Alltagsstudien";
  }


  const neuesteText =
    document.getElementById(
      "neueste-text"
    );

  if (neuesteText) {
    neuesteText.textContent =
      "Alle derzeit veröffentlichten Alltagsstudien.";
  }


  document
    .getElementById("empfehlungen")
    ?.remove();


  document
    .getElementById(
      "alle-alltagsstudien-sektion"
    )
    ?.remove();

}

/*
  Färbt alle <section> der Seite abwechselnd ein
  (hell, dunkel, hell, ...).

  Maßgeblich ist die tatsächliche Reihenfolge der
  noch vorhandenen Sections. Dadurch bleibt das
  Muster auch dann korrekt, wenn einzelne Bereiche
  entfernt wurden.
*/
function aktualisiereSectionFarben() {

  const sektionen =
    Array.from(
      document.querySelectorAll("section")
    );

  let gezaehlt = 0;
  let istAlt = false;

  sektionen.forEach(sektion => {

    sektion.classList.remove("section-alt");

    if (!sektion.classList.contains("showcase")) {
      istAlt = gezaehlt % 2 === 1;
      gezaehlt++;
    }

    if (istAlt) {
      sektion.classList.add("section-alt");
    }

  });
}

aktualisiereSectionFarben();