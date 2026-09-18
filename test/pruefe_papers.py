#!/usr/bin/env python3
"""
Checks whether every entry in json/veroeffentlichungen.json is
complete and has all the files it needs elsewhere in the project.
Never aborts on the first problem - it collects every error and
warning and reports them all at the end.

Per entry the following is checked:

  * The properties datum, titel, autoren, beschreibung, journal,
    seite_start, seite_ende and slug are all set        (error if not)
  * md/news-papers/<slug>.md exists                     (error if not, but only if
                                                         "datum" is set and not in
                                                         the future - else warning)
  * ...and contains no heading at all                   (error if it does)
  * pics/papers/<slug>.png exists                       (same rule as the .md file)

"Set" means: the key exists and its value is not null, not an empty
(or whitespace-only) string and not an empty list. Numbers such as
seite_start = 0 count as set.

Usage:
    python pruefe_papers.py [project-root]

If no argument is given, the current directory is used as the
project root. The script expects json/veroeffentlichungen.json,
md/ and pics/ to exist directly below that root.

This script reuses Meldungen and a helper from pruefe_ratgeber.py, so
both files have to live in the same folder.

Assumption about the JSON file's shape: a top-level array of objects
where "datum" is an ISO date string (YYYY-MM-DD). If the real
format differs, only parse_datum() below needs adjusting.
"""

import argparse
import json
import re
import sys
import unicodedata
from datetime import date, datetime
from pathlib import Path

from pruefe_ratgeber import Meldungen, datei_mit_slug_existiert


PFLICHT_PROPERTIES = (
    "datum",
    "titel",
    "autoren",
    "beschreibung",
    "journal",
    "seite_start",
    "seite_ende",
    "slug",
)


# --------------------------------------------------------------------
# Helpers
# --------------------------------------------------------------------

def ist_gesetzt(eintrag: dict, name: str) -> bool:
    if name not in eintrag:
        return False
    wert = eintrag[name]
    if wert is None:
        return False
    if isinstance(wert, str) and not wert.strip():
        return False
    if isinstance(wert, (list, dict)) and not wert:
        return False
    return True


def parse_datum(eintrag: dict, slug: str, meldungen: Meldungen):
    """
    Returns "datum" as a date, or None if it's missing or invalid.
    A missing "datum" is already reported by the property check; an
    invalid one is reported here (once per entry, not once per file).
    """

    if not ist_gesetzt(eintrag, "datum"):
        return None

    roh = eintrag["datum"]
    try:
        return datetime.strptime(str(roh), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        meldungen.fehler_melden(
            slug,
            f"'datum' ({roh!r}) ist kein gültiges Datum (erwartet YYYY-MM-DD).",
        )
        return None


def pruefe_datei_vorhanden(
    pfad: Path, hinweis: str, slug: str, datum, meldungen: Meldungen
) -> bool:
    """
    Returns True if the file exists. If not, a missing file is a hard
    error only when "datum" is a valid date that is not in the future;
    otherwise it's just a warning (the paper may not be published yet).
    """

    if pfad.is_file():
        return True

    if datum is None:
        meldungen.warnung_melden(
            slug, f"{hinweis} fehlt (kein gültiges 'datum' gesetzt)."
        )
    elif datum > date.today():
        meldungen.warnung_melden(
            slug,
            f"{hinweis} fehlt, 'datum' liegt aber in der Zukunft "
            f"({datum.isoformat()}) - noch kein Fehler.",
        )
    else:
        meldungen.fehler_melden(slug, f"{hinweis} fehlt.")

    return False


# --------------------------------------------------------------------
# Markdown heading detection
# --------------------------------------------------------------------

def finde_ueberschriften(markdown: str) -> list:
    """
    Returns (line number, text) for every heading in the markdown:

      * ATX headings:     "# Text" ... "###### Text"
      * Setext headings:  a text line underlined with === or ---
      * HTML headings:    <h1> ... <h6>

    Lines inside fenced code blocks (``` or ~~~) and a leading YAML
    front matter block (--- ... ---) are ignored.
    """

    zeilen = markdown.splitlines()
    gefunden = []
    im_codeblock = False
    i = 0

    # Skip YAML front matter at the very top of the file.
    if zeilen and zeilen[0].strip() == "---":
        for j in range(1, len(zeilen)):
            if zeilen[j].strip() in ("---", "..."):
                i = j + 1
                break

    vorherige_zeile_ist_text = False

    while i < len(zeilen):
        zeile = zeilen[i]
        nummer = i + 1
        i += 1

        if re.match(r"^ {0,3}(```|~~~)", zeile):
            im_codeblock = not im_codeblock
            vorherige_zeile_ist_text = False
            continue
        if im_codeblock:
            continue

        atx = re.match(r"^ {0,3}#{1,6}(?:[ \t]+(.*?))?(?:[ \t]+#+)?[ \t]*$", zeile)
        html = re.search(r"<h[1-6][\s>]", zeile, re.IGNORECASE)
        setext = re.match(r"^ {0,3}(=+|-+)[ \t]*$", zeile)

        if atx:
            gefunden.append((nummer, (atx.group(1) or "").strip()))
            vorherige_zeile_ist_text = False
        elif html:
            gefunden.append((nummer, zeile.strip()))
            vorherige_zeile_ist_text = False
        elif setext and vorherige_zeile_ist_text:
            gefunden.append((nummer - 1, zeilen[nummer - 2].strip()))
            vorherige_zeile_ist_text = False
        else:
            vorherige_zeile_ist_text = bool(zeile.strip())

    return gefunden


def pruefe_keine_ueberschrift(md_pfad: Path, slug: str, root: Path, meldungen: Meldungen):
    hinweis = md_pfad.relative_to(root).as_posix()

    try:
        # utf-8-sig silently drops a BOM if the editor added one.
        inhalt = md_pfad.read_text(encoding="utf-8-sig")
    except UnicodeDecodeError:
        meldungen.fehler_melden(slug, f"{hinweis} ist nicht UTF-8-kodiert.")
        return

    ueberschriften = finde_ueberschriften(inhalt)
    if not ueberschriften:
        return

    beispiele = ", ".join(
        f'Zeile {nummer}: "{unicodedata.normalize("NFC", text)}"'
        for nummer, text in ueberschriften[:3]
    )
    mehr = f" (+{len(ueberschriften) - 3} weitere)" if len(ueberschriften) > 3 else ""
    meldungen.fehler_melden(
        slug,
        f"{hinweis} darf keine Überschrift enthalten, hat aber "
        f"{len(ueberschriften)}: {beispiele}{mehr}.",
    )


# --------------------------------------------------------------------
# Actual checks
# --------------------------------------------------------------------

def pruefe_eintrag(eintrag: dict, nummer: int, root: Path, meldungen: Meldungen):

    slug = eintrag.get("slug") if ist_gesetzt(eintrag, "slug") else None
    titel = eintrag.get("titel") if ist_gesetzt(eintrag, "titel") else None
    bezeichner = slug or titel or f"<Eintrag #{nummer} ohne slug>"

    if not isinstance(bezeichner, str):
        bezeichner = str(bezeichner)

    fehlende = [name for name in PFLICHT_PROPERTIES if not ist_gesetzt(eintrag, name)]
    if fehlende:
        meldungen.fehler_melden(
            bezeichner, "Properties fehlen: " + ", ".join(fehlende) + "."
        )

    # Without a usable slug none of the file checks can run - but we
    # move on to the next entry instead of aborting the whole run.
    if slug is None:
        return
    if not isinstance(slug, str):
        meldungen.fehler_melden(
            bezeichner, f"'slug' ist kein Text ({slug!r}), Dateien können nicht geprüft werden."
        )
        return

    datum = parse_datum(eintrag, slug, meldungen)

    # News markdown: must exist and must not contain a heading.
    md_ordner = root / "md" / "news-papers"
    if pruefe_datei_vorhanden(
        md_ordner / f"{slug}.md", f"md/news-papers/{slug}.md", slug, datum, meldungen
    ):
        pruefe_keine_ueberschrift(md_ordner / f"{slug}.md", slug, root, meldungen)

    # Preview image.
    pruefe_datei_vorhanden(
        root / "pics" / "papers" / f"{slug}.png",
        f"pics/papers/{slug}.png",
        slug, datum, meldungen,
    )


def lade_veroeffentlichungen(pfad: Path) -> list:
    with pfad.open(encoding="utf-8-sig") as datei:
        daten = json.load(datei)

    if not isinstance(daten, list):
        raise ValueError(
            f"Top-Level-Element ist kein Array, sondern {type(daten).__name__}."
        )
    return daten


def main():

    argparser = argparse.ArgumentParser(
        description="Checks that all entries in veroeffentlichungen.json are "
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
    json_pfad = root / "data" / "veroeffentlichungen.json"

    if not json_pfad.is_file():
        print(f"Datei nicht gefunden: {json_pfad}", file=sys.stderr)
        sys.exit(1)

    try:
        eintraege = lade_veroeffentlichungen(json_pfad)
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

    print(f"{len(eintraege)} Veröffentlichungen geprüft.\n")

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
