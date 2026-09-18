#!/usr/bin/env python3
"""
Checks that <script src="..."> tags in the HTML files directly in the
project root are included in the right order.

Dependencies are defined as pairs of "slugs" (ABHAENGIGKEITEN below),
e.g. ("ratgeber", "ratgeber-kategorien") means: the script whose slug
is "ratgeber" depends on the script whose slug is "ratgeber-kategorien"
- so wherever "ratgeber" is included in an HTML file, "ratgeber-
kategorien" must be included earlier in that same file.

A "slug" is simply the JS filename without directory, query string and
.js/.min.js extension - so js/ratgeber-kategorien.js?v=3 has the slug
"ratgeber-kategorien".

Like pruefe_ratgeber.py, this script never aborts on the first problem
- it collects every error and reports them all at the end.

Usage:
    python pruefe_js_reihenfolge.py [project-root]

If no argument is given, the current directory is used as the project
root. Only *.html files directly in that root are checked (not
subdirectories).
"""

import argparse
import re
import sys
from dataclasses import dataclass, field
from pathlib import Path


# --------------------------------------------------------------------
# Configuration: dependency pairs to check.
#
# Each pair (abhaengiges_slug, abhaengigkeit_slug) means: wherever
# abhaengiges_slug is included in an HTML file, abhaengigkeit_slug must
# also be included, and earlier in the file.
# --------------------------------------------------------------------

ABHAENGIGKEITEN = [
    ("allegrid", "buchgrid"),
    ("allegrid", "ratgeber-filter"),
    ("autorseite", "markdown"),
    ("buch", "datumsformat"),
    ("buch", "kommentare"),
    ("buch", "markdown"),
    ("buch", "ratgeber"),
    ("buch", "ratgeber-kategorien"),
    ("buch", "teilen"),
    ("buchgrid", "konstanten"),
    ("buchgrid", "ratgeber-filter"),
    ("featured", "ratgeber"),
    ("header", "ratgeber-kategorien"),
    ("institutseite", "markdown"),
    ("institutsleben", "datumsformat"),
    ("institutsleben", "foto-lightbox"),
    ("kommentare", "markdown"),
    ("mitarbeiter-detail", "datumsformat"),
    ("mitarbeiter-detail", "mitarbeiter"),
    ("mitgliederseite", "mitarbeiter"),
    ("news", "probleme"),
    ("news", "ratgeber"),
    ("news-seite", "datumsformat"),
    ("news-seite", "foto-lightbox"),
    ("news-seite", "markdown"),
    ("news-seite", "news"),
    ("news-startseite", "datumsformat"),
    ("news-startseite", "foto-lightbox"),
    ("news-startseite", "markdown"),
    ("news-startseite", "news"),
    ("problem", "datumsformat"),
    ("problem", "kommentare"),
    ("problem", "markdown"),
    ("problem", "probleme"),
    ("problem", "teilen"),
    ("problemgrid", "datumsformat"),
    ("problemgrid", "probleme"),
    ("problemshowcase", "datumsformat"),
    ("problemshowcase", "probleme"),
    ("ratgeber", "ratgeber-kategorien"),
    ("ratgeber-filter", "datumsformat"),
    ("ratgeber-filter", "konstanten"),
    ("ratgeber-filter", "ratgeber"),
    ("ratgeber-filter", "ratgeber-kategorien"),
    ("showcase", "datumsformat"),
    ("showcase", "ratgeber"),
    ("veroeffentlichungen-seite", "datumsformat"),
]


# --------------------------------------------------------------------
# Extracting script slugs from HTML in document order.
# --------------------------------------------------------------------

_SCRIPT_TAG_MUSTER = re.compile(
    r"<script\b[^>]*\bsrc\s*=\s*(?:\"([^\"]+)\"|'([^']+)')[^>]*>",
    re.IGNORECASE,
)

_JS_ENDUNGEN = (".min.js", ".js")


def _ist_externe_url(src: str) -> bool:
    return src.startswith(("http://", "https://", "//", "data:"))


def _slug_aus_src(src: str) -> str:
    """Turns a script src into its slug: basename, no query/fragment,
    no .js/.min.js extension."""

    ohne_query = src.split("?", 1)[0].split("#", 1)[0]
    dateiname = ohne_query.rsplit("/", 1)[-1]

    for endung in _JS_ENDUNGEN:
        if dateiname.lower().endswith(endung):
            dateiname = dateiname[: -len(endung)]
            break

    return dateiname


def extrahiere_script_slugs(html_text: str) -> list:
    """Returns the slugs of all local <script src="..."> tags, in the
    order they appear in the document. External scripts (http(s)://,
    protocol-relative, data:) are skipped."""

    slugs = []
    for treffer in _SCRIPT_TAG_MUSTER.finditer(html_text):
        src = treffer.group(1) if treffer.group(1) is not None else treffer.group(2)
        if _ist_externe_url(src):
            continue
        slugs.append(_slug_aus_src(src))
    return slugs


# --------------------------------------------------------------------
# Checks
# --------------------------------------------------------------------

@dataclass
class Meldungen:
    """Collects errors instead of raising on the first one."""

    fehler: list = field(default_factory=list)

    def fehler_melden(self, datei: str, text: str):
        self.fehler.append(f"[{datei}] {text}")


def pruefe_datei(pfad: Path, meldungen: Meldungen):
    try:
        html_text = pfad.read_text(encoding="utf-8")
    except OSError as fehler:
        meldungen.fehler_melden(pfad.name, f"konnte nicht gelesen werden: {fehler}")
        return

    slugs = extrahiere_script_slugs(html_text)

    # Index der jeweils ersten Einbindung eines Slugs.
    erster_index = {}
    for i, slug in enumerate(slugs):
        if slug not in erster_index:
            erster_index[slug] = i

    for abhaengiges_slug, abhaengigkeit_slug in ABHAENGIGKEITEN:
        if abhaengiges_slug not in erster_index:
            continue  # abhängiges Script wird hier gar nicht eingebunden

        if abhaengigkeit_slug not in erster_index:
            meldungen.fehler_melden(
                pfad.name,
                f"'{abhaengiges_slug}.js' wird eingebunden, aber "
                f"'{abhaengigkeit_slug}.js' (Abhängigkeit) fehlt.",
            )
            continue

        if erster_index[abhaengigkeit_slug] > erster_index[abhaengiges_slug]:
            meldungen.fehler_melden(
                pfad.name,
                f"'{abhaengigkeit_slug}.js' muss vor '{abhaengiges_slug}.js' "
                f"eingebunden werden, kommt aber danach.",
            )


def main():
    argparser = argparse.ArgumentParser(
        description=(
            "Checks that <script src=...> includes in the root HTML files "
            "respect the configured dependency order."
        )
    )
    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help="Project root directory (default: current directory).",
    )
    args = argparser.parse_args()

    root = Path(args.projekt_root).resolve()

    html_dateien = sorted(root.glob("*.html"))
    if not html_dateien:
        print(f"Keine .html-Dateien direkt in {root} gefunden.", file=sys.stderr)
        sys.exit(1)

    meldungen = Meldungen()
    for pfad in html_dateien:
        pruefe_datei(pfad, meldungen)

    print(f"{len(html_dateien)} HTML-Datei(en) geprüft.\n")

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
