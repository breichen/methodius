#!/usr/bin/env python3
"""
Checks whether every entry in data/fotos.json is complete and points
to an existing image file. Never aborts on the first problem - it
collects every error and warning and reports them all at the end.

Per entry the following is checked:

  * The properties datum, titel, bild and beschreibung
    are set                                              (error if not)
  * "bild" is a path (including file name) relative to the
    project root, ends in .png and points to an
    existing file                                        (error if not)

"Set" means: the key exists and its value is not null, not an empty
(or whitespace-only) string and not an empty list.

"datum" is only checked for being set, not for its format.

Usage:
    python pruefe_fotos.py [project-root]

If no argument is given, the current directory is used as the
project root. The script expects data/fotos.json to exist directly
below that root.

This script reuses helpers from pruefe_papers.py and
pruefe_ratgeber.py, so all three files have to live in the same folder.

Assumption about the JSON file's shape: a top-level array of objects.
"""

import argparse
import json
import sys
from pathlib import Path, PurePosixPath, PureWindowsPath

from pruefe_papers import ist_gesetzt
from pruefe_ratgeber import Meldungen


PFLICHT_PROPERTIES = ("datum", "titel", "bild", "beschreibung")


def pruefe_bild(eintrag: dict, bezeichner: str, root: Path, meldungen: Meldungen):
    bild = eintrag["bild"]

    if not isinstance(bild, str):
        meldungen.fehler_melden(
            bezeichner, f"'bild' ist kein Text ({bild!r}), Datei kann nicht geprüft werden."
        )
        return

    # The path must be relative to the project root. A leading "/" would
    # otherwise silently make Path() jump to the filesystem root.
    if bild.startswith(("/", "\\")) or PureWindowsPath(bild).drive or PurePosixPath(bild).is_absolute():
        meldungen.fehler_melden(
            bezeichner,
            f"'bild' ({bild!r}) muss ein relativer Pfad sein "
            f"(relativ zur Project Root, ohne führendes '/').",
        )
        return

    if not bild.lower().endswith(".png"):
        meldungen.fehler_melden(bezeichner, f"'bild' ({bild!r}) ist keine .png-Datei.")
        # Keep going: the existence check below is still useful.

    if not (root / bild).is_file():
        meldungen.fehler_melden(bezeichner, f"{bild} fehlt.")


def pruefe_eintrag(eintrag: dict, nummer: int, root: Path, meldungen: Meldungen):

    bild = eintrag.get("bild") if ist_gesetzt(eintrag, "bild") else None
    titel = eintrag.get("titel") if ist_gesetzt(eintrag, "titel") else None

    # There is no slug, so entries are identified by their image path,
    # falling back to the title and finally to their position.
    bezeichner = bild or titel or f"<Eintrag #{nummer}>"
    if not isinstance(bezeichner, str):
        bezeichner = str(bezeichner)

    fehlende = [name for name in PFLICHT_PROPERTIES if not ist_gesetzt(eintrag, name)]
    if fehlende:
        meldungen.fehler_melden(
            bezeichner, "Properties fehlen: " + ", ".join(fehlende) + "."
        )

    if bild is not None:
        pruefe_bild(eintrag, bezeichner, root, meldungen)


def lade_fotos(pfad: Path) -> list:
    with pfad.open(encoding="utf-8-sig") as datei:
        daten = json.load(datei)

    if not isinstance(daten, list):
        raise ValueError(
            f"Top-Level-Element ist kein Array, sondern {type(daten).__name__}."
        )
    return daten


def main():

    argparser = argparse.ArgumentParser(
        description="Checks that all entries in fotos.json are complete "
                    "and point to existing image files."
    )
    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help="Project root directory (default: current directory).",
    )
    args = argparser.parse_args()

    root = Path(args.projekt_root).resolve()
    json_pfad = root / "data" / "fotos.json"

    if not json_pfad.is_file():
        print(f"Datei nicht gefunden: {json_pfad}", file=sys.stderr)
        sys.exit(1)

    try:
        eintraege = lade_fotos(json_pfad)
    except json.JSONDecodeError as fehler:
        print(
            f"Ungültiges JSON in {json_pfad} (Zeile {fehler.lineno}, "
            f"Spalte {fehler.colno}): {fehler.msg}",
            file=sys.stderr,
        )
        sys.exit(1)
    except (ValueError, UnicodeDecodeError) as fehler:
        print(f"Konnte {json_pfad} nicht lesen: {fehler}", file=sys.stderr)
        sys.exit(1)

    meldungen = Meldungen()

    for nummer, eintrag in enumerate(eintraege, start=1):
        if not isinstance(eintrag, dict):
            meldungen.fehler_melden(f"<Eintrag #{nummer}>", f"Kein Objekt: {eintrag!r}")
            continue
        pruefe_eintrag(eintrag, nummer, root, meldungen)

    print(f"{len(eintraege)} Foto-Einträge geprüft.\n")

    if meldungen.warnungen:
        print(f"Warnungen ({len(meldungen.warnungen)}):")
        for warnung in meldungen.warnungen:
            print(f"  ⚠ {warnung}")
        print()

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
