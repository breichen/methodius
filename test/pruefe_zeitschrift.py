#!/usr/bin/env python3
"""
Checks whether every entry in zeitschriftAusgaben
(js/zeitschrift-ausgaben.js) is complete. Never aborts on the first
problem - it collects every error and reports them all at the end.

Per issue (Ausgabe) the following is checked:

  * The properties band, heft, erstellt and beitraege are all set
                                                        (error if not)
  * beitraege is a list                                 (error if not)
  * erstellt is a valid date in the form YYYY-MM-DD     (error if not)

Across all issues the following is checked:

  * Every combination of band and heft occurs only once (error if not)
    - zeitschrift-heft.html finds an issue by band and heft, so a
    duplicate would silently hide one of the two issues.

Per contribution (Beitrag) in beitraege the following is checked:

  * autoren is a non-empty list, and none of the names in it is
    empty                                               (error if not)
  * The properties titel, typ and seiten are all set    (error if not)

"Set" means: the key exists and its value is not null, not an empty
(or whitespace-only) string and not an empty list. Numbers such as
seiten = 0 count as set.

Usage:
    python pruefe_zeitschrift.py [project-root]

If no argument is given, the current directory is used as the
project root. The script expects js/zeitschrift-ausgaben.js to exist
directly below that root.

This script reuses Meldungen and the mini JS parser from
pruefe_ratgeber.py, so both files have to live in the same folder.

Assumption about zeitschriftAusgaben's shape: a flat JS array of
object literals like

    {
      band: 1,
      heft: 1,
      erstellt: "2026-10-01",
      beitraege: [
        {
          autoren: ["Erster Autor", "Zweiter Autor"],
          titel: "...",
          typ: "Forschungsartikel",
          seiten: "1-12",
        },
      ],
    }

An empty array (no issue published yet) is fine and produces no errors.
"""

import argparse
import re
import sys
from datetime import datetime
from pathlib import Path

from pruefe_ratgeber import JSDatenFehler, Meldungen, MiniJSParser


PFLICHT_PROPERTIES_AUSGABE = ("band", "heft", "erstellt", "beitraege")
PFLICHT_PROPERTIES_BEITRAG = ("autoren", "titel", "typ", "seiten")


# --------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------

def ist_leer(wert) -> bool:
    if wert is None:
        return True
    if isinstance(wert, str) and not wert.strip():
        return True
    if isinstance(wert, (list, dict)) and not wert:
        return True
    return False


def ist_gesetzt(eintrag: dict, name: str) -> bool:
    return name in eintrag and not ist_leer(eintrag[name])


def ist_gueltiges_datum(wert) -> bool:
    """True for a real calendar date written exactly as YYYY-MM-DD."""

    text = str(wert)
    if not re.fullmatch(r"\d{4}-\d{2}-\d{2}", text):
        return False
    try:
        datetime.strptime(text, "%Y-%m-%d")
    except ValueError:
        return False
    return True


def vergleichswert(wert):
    """
    Normalises band/heft for the duplicate check. The website compares
    them with Number(), so 1 and "1" are the same issue there.
    """

    if isinstance(wert, str):
        wert = wert.strip()
        try:
            return float(wert)
        except ValueError:
            return wert
    if isinstance(wert, (int, float)) and not isinstance(wert, bool):
        return float(wert)
    return wert


def lade_ausgaben(pfad: Path) -> list:
    """Locates and parses the zeitschriftAusgaben array literal."""

    text = pfad.read_text(encoding="utf-8-sig")

    # Anchored to the start of a line so that a mention of the name
    # inside a comment is not mistaken for the declaration.
    treffer = re.search(
        r"^[ \t]*(?:const|let|var)\s+zeitschriftAusgaben\s*=", text, re.MULTILINE
    )
    if not treffer:
        raise JSDatenFehler(f"'zeitschriftAusgaben' was not found in {pfad}.")

    try:
        wert = MiniJSParser(text, pos=treffer.end()).parse_value()
    except IndexError as fehler:
        # The parser runs off the end of the text if the literal is not
        # closed, e.g. a missing "]" or "}" at the end of the file.
        raise JSDatenFehler(
            "Unexpected end of file - is the array literal complete?"
        ) from fehler

    if not isinstance(wert, list):
        raise JSDatenFehler("'zeitschriftAusgaben' is not an array.")

    return wert


# --------------------------------------------------------------------
# Actual checks
# --------------------------------------------------------------------

def pruefe_autoren(beitrag: dict, bezeichner: str, meldungen: Meldungen):
    """
    Only called when "autoren" is set (a missing or empty value is
    already reported by the property check).
    """

    autoren = beitrag["autoren"]

    if not isinstance(autoren, list):
        meldungen.fehler_melden(
            bezeichner,
            f"'autoren' muss eine Liste sein, ist aber {type(autoren).__name__} "
            f"({autoren!r}).",
        )
        return

    leere = [
        str(position)
        for position, name in enumerate(autoren, start=1)
        if not isinstance(name, str) or not name.strip()
    ]
    if leere:
        meldungen.fehler_melden(
            bezeichner,
            "'autoren' enthält leere oder ungültige Einträge an Position "
            + ", ".join(leere) + ".",
        )


def pruefe_beitrag(beitrag, nummer: int, ausgabe_bezeichner: str, meldungen: Meldungen):

    if not isinstance(beitrag, dict):
        meldungen.fehler_melden(
            ausgabe_bezeichner, f"Beitrag #{nummer} ist kein Objekt: {beitrag!r}"
        )
        return

    bezeichner = f"{ausgabe_bezeichner}, Beitrag #{nummer}"
    if ist_gesetzt(beitrag, "titel") and isinstance(beitrag["titel"], str):
        bezeichner += f" („{beitrag['titel'].strip()}“)"

    fehlende = [
        name for name in PFLICHT_PROPERTIES_BEITRAG if not ist_gesetzt(beitrag, name)
    ]
    if fehlende:
        meldungen.fehler_melden(
            bezeichner, "Properties fehlen oder sind leer: " + ", ".join(fehlende) + "."
        )

    if ist_gesetzt(beitrag, "autoren"):
        pruefe_autoren(beitrag, bezeichner, meldungen)


def pruefe_ausgabe(eintrag: dict, nummer: int, meldungen: Meldungen) -> int:
    """Checks one issue and returns how many contributions it contains."""

    if ist_gesetzt(eintrag, "band") and ist_gesetzt(eintrag, "heft"):
        bezeichner = f"Band {eintrag['band']}, Heft {eintrag['heft']}"
    else:
        bezeichner = f"<Ausgabe #{nummer}>"

    fehlende = [
        name for name in PFLICHT_PROPERTIES_AUSGABE if not ist_gesetzt(eintrag, name)
    ]
    if fehlende:
        meldungen.fehler_melden(
            bezeichner, "Properties fehlen oder sind leer: " + ", ".join(fehlende) + "."
        )

    if ist_gesetzt(eintrag, "erstellt") and not ist_gueltiges_datum(eintrag["erstellt"]):
        meldungen.fehler_melden(
            bezeichner,
            f"'erstellt' ({eintrag['erstellt']!r}) ist kein gültiges Datum "
            f"(erwartet YYYY-MM-DD).",
        )

    # Without a usable list the contributions can't be checked - but we
    # move on to the next issue instead of aborting the whole run.
    if not ist_gesetzt(eintrag, "beitraege"):
        return 0

    beitraege = eintrag["beitraege"]
    if not isinstance(beitraege, list):
        meldungen.fehler_melden(
            bezeichner,
            f"'beitraege' muss eine Liste sein, ist aber {type(beitraege).__name__}.",
        )
        return 0

    for beitrag_nummer, beitrag in enumerate(beitraege, start=1):
        pruefe_beitrag(beitrag, beitrag_nummer, bezeichner, meldungen)

    return len(beitraege)


def pruefe_doppelte_ausgaben(ausgaben: list, meldungen: Meldungen):
    """Reports every band/heft combination that is used by more than one issue."""

    gesehen = {}  # (band, heft) -> [Nummern der Ausgaben]

    for nummer, eintrag in enumerate(ausgaben, start=1):
        if not isinstance(eintrag, dict):
            continue
        if not (ist_gesetzt(eintrag, "band") and ist_gesetzt(eintrag, "heft")):
            continue  # already reported by the property check
        schluessel = (vergleichswert(eintrag["band"]), vergleichswert(eintrag["heft"]))
        gesehen.setdefault(schluessel, []).append(nummer)

    for nummern in gesehen.values():
        if len(nummern) < 2:
            continue
        erste = ausgaben[nummern[0] - 1]
        meldungen.fehler_melden(
            f"Band {erste['band']}, Heft {erste['heft']}",
            "Kommt mehrfach vor (Ausgabe "
            + ", ".join(f"#{n}" for n in nummern) + ").",
        )


def main():

    argparser = argparse.ArgumentParser(
        description="Checks that all entries in zeitschriftAusgaben are complete."
    )
    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help="Project root directory (default: current directory).",
    )
    args = argparser.parse_args()

    root = Path(args.projekt_root).resolve()
    js_pfad = root / "js" / "zeitschrift-ausgaben.js"

    if not js_pfad.is_file():
        print(f"Datei nicht gefunden: {js_pfad}", file=sys.stderr)
        sys.exit(1)

    try:
        ausgaben = lade_ausgaben(js_pfad)
    except (JSDatenFehler, UnicodeDecodeError) as fehler:
        print(f"Konnte {js_pfad} nicht lesen: {fehler}", file=sys.stderr)
        sys.exit(1)

    meldungen = Meldungen()
    anzahl_beitraege = 0

    for nummer, eintrag in enumerate(ausgaben, start=1):
        if not isinstance(eintrag, dict):
            meldungen.fehler_melden(f"<Ausgabe #{nummer}>", f"Kein Objekt: {eintrag!r}")
            continue
        anzahl_beitraege += pruefe_ausgabe(eintrag, nummer, meldungen)

    pruefe_doppelte_ausgaben(ausgaben, meldungen)

    print(f"{len(ausgaben)} Ausgaben mit {anzahl_beitraege} Beiträgen geprüft.\n")

    if meldungen.fehler:
        print(f"Fehler ({len(meldungen.fehler)}):")
        for fehler in meldungen.fehler:
            print(f"  ✗ {fehler}")
        print()
        sys.exit(1)

    print("Keine Fehler gefunden.")
    sys.exit(0)


if __name__ == "__main__":
    main()
