#!/usr/bin/env python3
"""
Checks whether every entry in problemeRohdaten (js/probleme.js) is
complete and has all the files it needs elsewhere in the project.
Never aborts on the first problem - it collects every error and
warning and reports them all at the end.

Per entry the following is checked:

  * "slug" and "titel" are set                          (error if not)
  * md/probleme/<slug>.md exists                        (error if not)
  * ...and contains the h2 headings Frage, Diagnose,
    Behandlung, Begründung, Prognose, Einsender         (error if not)
  * md/probleme-kommentare/<slug>.md exists             (warning if not)
  * md/news-probleme/<slug>.md exists                   (error if not, but only if
                                                         "erstellt" is set and not in
                                                         the future - else warning)

Usage:
    python pruefe_probleme.py [project-root]

If no argument is given, the current directory is used as the
project root. The script expects js/probleme.js and md/ to exist
directly below that root.

This script reuses the mini JS parser and a few helpers from
pruefe_ratgeber.py, so both files have to live in the same folder.

Assumption about problemeRohdaten's shape: a flat JS array of object
literals with "slug" and "titel" fields and an optional "erstellt"
field (ISO date string, YYYY-MM-DD).
"""

import argparse
import re
import sys
import unicodedata
from pathlib import Path

from pruefe_ratgeber import (
    JSDatenFehler,
    Meldungen,
    MiniJSParser,
    _pruefe_optionale_md_datei,
    datei_mit_slug_existiert,
)


ERWARTETE_UEBERSCHRIFTEN = (
    "Frage",
    "Diagnose",
    "Behandlung",
    "Begründung",
    "Prognose",
    "Einsender",
)


# --------------------------------------------------------------------
# Loading problemeRohdaten
# --------------------------------------------------------------------

def lade_probleme_rohdaten(pfad: Path) -> list:
    """Locates and parses the problemeRohdaten array literal in js/probleme.js."""

    text = pfad.read_text(encoding="utf-8")

    treffer = re.search(r"problemeRohdaten\s*=", text)
    if not treffer:
        raise JSDatenFehler(f"'problemeRohdaten' was not found in {pfad}.")

    wert = MiniJSParser(text, pos=treffer.end()).parse_value()

    if not isinstance(wert, list):
        raise JSDatenFehler("'problemeRohdaten' is not an array.")

    return wert


# --------------------------------------------------------------------
# Markdown heading check
# --------------------------------------------------------------------

def _normalisiere(text: str) -> str:
    # NFC so that "Begründung" matches no matter whether the file was
    # saved with a precomposed ü or with u + combining diaeresis
    # (which happens on some macOS setups).
    return unicodedata.normalize("NFC", text).strip()


def lese_h2_ueberschriften(markdown: str) -> list:
    """
    Returns the texts of all ATX-style h2 headings ("## Text").
    Lines inside fenced code blocks (``` or ~~~) are ignored, and an
    optional closing "##" ("## Text ##") is stripped.
    """

    ueberschriften = []
    im_codeblock = False

    for zeile in markdown.splitlines():
        if re.match(r"^ {0,3}(```|~~~)", zeile):
            im_codeblock = not im_codeblock
            continue
        if im_codeblock:
            continue

        treffer = re.match(r"^ {0,3}##[ \t]+(.*?)(?:[ \t]+#+)?[ \t]*$", zeile)
        if treffer:
            ueberschriften.append(_normalisiere(treffer.group(1)))

    return ueberschriften


def pruefe_ueberschriften(md_pfad: Path, slug: str, root: Path, meldungen: Meldungen):
    try:
        # utf-8-sig silently drops a BOM if the editor added one.
        inhalt = md_pfad.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        meldungen.fehler_melden(
            slug, f"{md_pfad.relative_to(root).as_posix()} ist nicht UTF-8-kodiert."
        )
        return

    vorhandene = set(lese_h2_ueberschriften(inhalt))
    fehlende = [
        name for name in ERWARTETE_UEBERSCHRIFTEN
        if _normalisiere(name) not in vorhandene
    ]

    if fehlende:
        liste = ", ".join(f'"{name}"' for name in fehlende)
        meldungen.fehler_melden(
            slug,
            f"md/probleme/{slug}.md: h2-Überschrift(en) fehlen: {liste}.",
        )


# --------------------------------------------------------------------
# Actual checks
# --------------------------------------------------------------------

def pruefe_eintrag(eintrag: dict, nummer: int, root: Path, meldungen: Meldungen):

    slug = eintrag.get("slug")
    titel = eintrag.get("titel")

    # Without a slug most other checks can't run meaningfully - but we
    # still record it and move on to the next entry instead of aborting.
    bezeichner = slug or titel or f"<Eintrag #{nummer} ohne slug>"

    if not slug:
        meldungen.fehler_melden(bezeichner, "Property 'slug' fehlt.")
    if not titel:
        meldungen.fehler_melden(bezeichner, "Property 'titel' fehlt.")

    if not slug:
        return

    # Main markdown file (required) + its headings.
    md_ordner = root / "md" / "probleme"
    if not datei_mit_slug_existiert(md_ordner, slug, ".md"):
        meldungen.fehler_melden(slug, f"md/probleme/{slug}.md fehlt.")
    else:
        pruefe_ueberschriften(md_ordner / f"{slug}.md", slug, root, meldungen)

    # Comments: always optional, a missing file is only ever a warning.
    if not datei_mit_slug_existiert(root / "md" / "probleme-kommentare", slug, ".md"):
        meldungen.warnung_melden(slug, f"md/probleme-kommentare/{slug}.md fehlt.")

    # News: error only if "erstellt" is set and not in the future.
    _pruefe_optionale_md_datei(
        root / "md" / "news-probleme", slug, eintrag, meldungen,
        beschreibung="md/news-probleme",
    )


def main():

    argparser = argparse.ArgumentParser(
        description="Checks that all entries in problemeRohdaten are complete "
                    "and have their required files."
    )
    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help="Project root directory (default: current directory).",
    )
    args = argparser.parse_args()

    root = Path(args.projekt_root).resolve()
    probleme_js = root / "js" / "probleme.js"

    if not probleme_js.is_file():
        print(f"Datei nicht gefunden: {probleme_js}", file=sys.stderr)
        sys.exit(1)

    try:
        rohdaten = lade_probleme_rohdaten(probleme_js)
    except JSDatenFehler as fehler:
        print(f"Konnte problemeRohdaten nicht lesen: {fehler}", file=sys.stderr)
        sys.exit(1)

    meldungen = Meldungen()

    for nummer, eintrag in enumerate(rohdaten, start=1):
        if not isinstance(eintrag, dict):
            meldungen.fehler_melden(f"<Eintrag #{nummer}>", f"Kein Objekt: {eintrag!r}")
            continue
        pruefe_eintrag(eintrag, nummer, root, meldungen)

    print(f"{len(rohdaten)} Probleme-Einträge geprüft.\n")

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
