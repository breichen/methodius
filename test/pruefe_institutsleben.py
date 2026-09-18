#!/usr/bin/env python3
"""
Checks whether every entry in data/institutsleben.json is complete and
has all the files it needs elsewhere in the project. Never aborts on
the first problem - it collects every error and warning and reports
them all at the end.

Per entry the following is checked:

  * The properties slug, titel and datum are set         (error if not)
  * "link" and "linkText" come as a pair: if one is set,
    the other one has to be set too, and vice versa      (error if not)
  * md/news-institutsleben/<slug>.md exists              (error if not)
  * ...and contains no heading at all                    (error if it does)
  * pics/news-institutsleben/<slug>.png exists           (error if not, but only if
                                                          "datum" is set and not in
                                                          the future - else warning)

The "slug" (= file name without extension) names both the .md and the
.png file of an entry.

"Set" means: the key exists and its value is not null, not an empty
(or whitespace-only) string and not an empty list.

Usage:
    python pruefe_institutsleben.py [project-root]

If no argument is given, the current directory is used as the
project root. The script expects data/institutsleben.json, md/ and
pics/ to exist directly below that root.

This script reuses helpers from pruefe_papers.py and
pruefe_ratgeber.py, so all three files have to live in the same folder.

Assumption about the JSON file's shape: a top-level array of objects
where "datum" is an ISO date string (YYYY-MM-DD).
"""

import argparse
import json
import sys
from pathlib import Path

from pruefe_papers import (
    ist_gesetzt,
    parse_datum,
    pruefe_datei_vorhanden,
    pruefe_keine_ueberschrift,
)
from pruefe_ratgeber import Meldungen


PFLICHT_PROPERTIES = ("slug", "titel", "datum")


def slug_aus_eintrag(eintrag: dict):
    """The slug that names the .md and .png files of this entry."""
    return eintrag.get("slug") if ist_gesetzt(eintrag, "slug") else None


def pruefe_link_paar(eintrag: dict, bezeichner: str, meldungen: Meldungen):
    hat_link = ist_gesetzt(eintrag, "link")
    hat_link_text = ist_gesetzt(eintrag, "linkText")

    if hat_link and not hat_link_text:
        meldungen.fehler_melden(
            bezeichner, "'link' ist gesetzt, aber 'linkText' fehlt."
        )
    elif hat_link_text and not hat_link:
        meldungen.fehler_melden(
            bezeichner, "'linkText' ist gesetzt, aber 'link' fehlt."
        )


def pruefe_eintrag(eintrag: dict, nummer: int, root: Path, meldungen: Meldungen):

    slug = slug_aus_eintrag(eintrag)
    titel = eintrag.get("titel") if ist_gesetzt(eintrag, "titel") else None
    bezeichner = slug or titel or f"<Eintrag #{nummer} ohne slug>"

    if not isinstance(bezeichner, str):
        bezeichner = str(bezeichner)

    fehlende = [name for name in PFLICHT_PROPERTIES if not ist_gesetzt(eintrag, name)]
    if fehlende:
        meldungen.fehler_melden(
            bezeichner, "Properties fehlen: " + ", ".join(fehlende) + "."
        )

    pruefe_link_paar(eintrag, bezeichner, meldungen)

    datum = parse_datum(eintrag, bezeichner, meldungen)

    # Without a usable slug none of the file checks can run - but we
    # move on to the next entry instead of aborting the whole run.
    if slug is None:
        return
    if not isinstance(slug, str):
        meldungen.fehler_melden(
            bezeichner,
            f"'slug' ist kein Text ({slug!r}), Dateien können nicht geprüft werden.",
        )
        return

    # News markdown: always required, and must not contain a heading.
    md_pfad = root / "md" / "news-institutsleben" / f"{slug}.md"
    if not md_pfad.is_file():
        meldungen.fehler_melden(slug, f"md/news-institutsleben/{slug}.md fehlt.")
    else:
        pruefe_keine_ueberschrift(md_pfad, slug, root, meldungen)

    # Preview image: hard error only if "datum" is valid and not in the future.
    pruefe_datei_vorhanden(
        root / "pics" / "news-institutsleben" / f"{slug}.png",
        f"pics/news-institutsleben/{slug}.png",
        slug, datum, meldungen,
    )


def lade_institutsleben(pfad: Path) -> list:
    with pfad.open(encoding="utf-8-sig") as datei:
        daten = json.load(datei)

    if not isinstance(daten, list):
        raise ValueError(
            f"Top-Level-Element ist kein Array, sondern {type(daten).__name__}."
        )
    return daten


def main():

    argparser = argparse.ArgumentParser(
        description="Checks that all entries in institutsleben.json are "
                    "complete and have their required files."
    )
    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help="Project root directory (default: current directory).",
    )
    args = argparser.parse_args()

    root = Path(args.projekt_root).resolve()
    json_pfad = root / "data" / "institutsleben.json"

    if not json_pfad.is_file():
        print(f"Datei nicht gefunden: {json_pfad}", file=sys.stderr)
        sys.exit(1)

    try:
        eintraege = lade_institutsleben(json_pfad)
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

    print(f"{len(eintraege)} Institutsleben-Einträge geprüft.\n")

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
