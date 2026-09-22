#!/usr/bin/env python3
"""
Checks whether every entry in alltagsstudienListe (js/alltagsstudien.js)
is complete and has all the files it needs elsewhere in the project.

Never aborts on the first problem - it collects every error and warning
and reports them all at the end.

Per entry the following is checked:

  * The properties slug, titel and datum are set         (error if not)
  * "link" and "linkText" come as a pair: if one is set,
    the other one has to be set too, and vice versa      (error if not)
  * md/alltagsstudien/<slug>.md exists                   (error if not)
  * ...and contains no heading at all                    (error if it does)
  * pics/alltagsstudien/<slug>.png exists                (error if not,
    but only if "datum" is set and not in the future -
    else warning)

The "slug" (= file name without extension) names both the .md
and the .png file of an entry.

Usage:
    python pruefe_alltagsstudien.py [project-root]

If no argument is given, the current directory is used as the
project root.

The script expects js/alltagsstudien.js, md/ and pics/ to exist
directly below that root.

This script reuses the mini JS parser and helpers from
pruefe_ratgeber.py and pruefe_papers.py, so these files have to
live in the same folder.

Assumption about alltagsstudienListe's shape:
a flat JS array of object literals with "slug", "titel" and
"datum" fields and optional "link" and "linkText" fields.
"""

import argparse
import re
import sys
from pathlib import Path

from pruefe_papers import (
    ist_gesetzt,
    parse_datum,
    pruefe_datei_vorhanden,
    pruefe_keine_ueberschrift,
)

from pruefe_ratgeber import (
    JSDatenFehler,
    Meldungen,
    MiniJSParser,
)


PFLICHT_PROPERTIES = (
    "slug",
    "titel",
    "datum",
)


# --------------------------------------------------------------------
# Loading alltagsstudienListe
# --------------------------------------------------------------------

def lade_alltagsstudien(
    pfad: Path,
) -> list:
    """
    Locates and parses the alltagsstudienListe array literal
    in js/alltagsstudien.js.
    """

    text = pfad.read_text(
        encoding="utf-8"
    )

    treffer = re.search(
        r"alltagsstudienListe\s*=",
        text,
    )

    if not treffer:
        raise JSDatenFehler(
            f"'alltagsstudienListe' wurde in "
            f"{pfad} nicht gefunden."
        )

    wert = MiniJSParser(
        text,
        pos=treffer.end(),
    ).parse_value()

    if not isinstance(wert, list):
        raise JSDatenFehler(
            "'alltagsstudienListe' ist kein Array."
        )

    return wert


# --------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------

def slug_aus_eintrag(
    eintrag: dict,
):
    """
    The slug that names the .md and .png files
    of this entry.
    """

    return (
        eintrag.get("slug")
        if ist_gesetzt(eintrag, "slug")
        else None
    )


def pruefe_link_paar(
    eintrag: dict,
    bezeichner: str,
    meldungen: Meldungen,
):
    hat_link = ist_gesetzt(
        eintrag,
        "link",
    )

    hat_link_text = ist_gesetzt(
        eintrag,
        "linkText",
    )

    if hat_link and not hat_link_text:

        meldungen.fehler_melden(
            bezeichner,
            "'link' ist gesetzt, "
            "aber 'linkText' fehlt.",
        )

    elif hat_link_text and not hat_link:

        meldungen.fehler_melden(
            bezeichner,
            "'linkText' ist gesetzt, "
            "aber 'link' fehlt.",
        )


# --------------------------------------------------------------------
# Actual checks
# --------------------------------------------------------------------

def pruefe_eintrag(
    eintrag: dict,
    nummer: int,
    root: Path,
    meldungen: Meldungen,
):

    slug = slug_aus_eintrag(
        eintrag
    )

    titel = (
        eintrag.get("titel")
        if ist_gesetzt(
            eintrag,
            "titel",
        )
        else None
    )

    bezeichner = (
        slug
        or titel
        or f"<Eintrag #{nummer} ohne slug>"
    )

    if not isinstance(
        bezeichner,
        str,
    ):
        bezeichner = str(
            bezeichner
        )

    # Required properties
    fehlende = [
        name
        for name in PFLICHT_PROPERTIES
        if not ist_gesetzt(
            eintrag,
            name,
        )
    ]

    if fehlende:

        meldungen.fehler_melden(
            bezeichner,
            "Properties fehlen: "
            + ", ".join(fehlende)
            + ".",
        )

    # Optional link/linkText pair
    pruefe_link_paar(
        eintrag,
        bezeichner,
        meldungen,
    )

    # Date
    datum = parse_datum(
        eintrag,
        bezeichner,
        meldungen,
    )

    # Without a usable slug none of the file checks can run.
    if slug is None:
        return

    if not isinstance(slug, str):

        meldungen.fehler_melden(
            bezeichner,
            f"'slug' ist kein Text "
            f"({slug!r}), Dateien können "
            f"nicht geprüft werden.",
        )

        return

    # ----------------------------------------------------------------
    # Markdown
    # ----------------------------------------------------------------

    md_pfad = (
        root
        / "md"
        / "alltagsstudien"
        / f"{slug}.md"
    )

    if not md_pfad.is_file():

        meldungen.fehler_melden(
            slug,
            f"md/alltagsstudien/{slug}.md fehlt.",
        )

    else:

        pruefe_keine_ueberschrift(
            md_pfad,
            slug,
            root,
            meldungen,
        )

    # ----------------------------------------------------------------
    # Preview image
    # ----------------------------------------------------------------

    pruefe_datei_vorhanden(
        root
        / "pics"
        / "alltagsstudien"
        / f"{slug}.png",

        f"pics/alltagsstudien/{slug}.png",

        slug,
        datum,
        meldungen,
    )


# --------------------------------------------------------------------
# Main
# --------------------------------------------------------------------

def main():

    argparser = argparse.ArgumentParser(
        description=(
            "Checks that all entries in alltagsstudienListe "
            "are complete and have their required files."
        )
    )

    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help=(
            "Project root directory "
            "(default: current directory)."
        ),
    )

    args = argparser.parse_args()

    root = Path(
        args.projekt_root
    ).resolve()

    alltagsstudien_js = (
        root
        / "js"
        / "alltagsstudien.js"
    )

    if not alltagsstudien_js.is_file():

        print(
            f"Datei nicht gefunden: "
            f"{alltagsstudien_js}",
            file=sys.stderr,
        )

        sys.exit(1)

    try:

        eintraege = lade_alltagsstudien(
            alltagsstudien_js
        )

    except JSDatenFehler as fehler:

        print(
            "Konnte alltagsstudienListe "
            f"nicht lesen: {fehler}",
            file=sys.stderr,
        )

        sys.exit(1)

    meldungen = Meldungen()

    for nummer, eintrag in enumerate(
        eintraege,
        start=1,
    ):

        if not isinstance(
            eintrag,
            dict,
        ):

            meldungen.fehler_melden(
                f"<Eintrag #{nummer}>",
                f"Kein Objekt: {eintrag!r}",
            )

            continue

        pruefe_eintrag(
            eintrag,
            nummer,
            root,
            meldungen,
        )

    print(
        f"{len(eintraege)} "
        "Alltagsstudien-Einträge geprüft.\n"
    )

    if meldungen.warnungen:

        print(
            f"Warnungen "
            f"({len(meldungen.warnungen)}):"
        )

        for warnung in meldungen.warnungen:

            print(
                f"  ⚠ {warnung}"
            )

        print()

    if meldungen.fehler:

        print(
            f"Fehler "
            f"({len(meldungen.fehler)}):"
        )

        for fehler in meldungen.fehler:

            print(
                f"  ✗ {fehler}"
            )

        print()

        sys.exit(1)

    print(
        "Keine Fehler gefunden."
    )

    sys.exit(0)


if __name__ == "__main__":
    main()