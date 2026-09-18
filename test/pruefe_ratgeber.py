#!/usr/bin/env python3
"""
Checks whether every entry in ratgeberRohdaten (js/ratgeber.js) has
all the files it needs elsewhere in the project. Never aborts on the
first problem - it collects every error and warning and reports them
all at the end.

Usage:
    python pruefe_ratgeber.py [project-root]

If no argument is given, the current directory is used as the
project root. The script expects js/ratgeber.js, md/, and pics/ to
exist directly below that root.

Assumption about ratgeberRohdaten's shape: a flat JS array of object
literals, each with at least a "slug" and "kategorie" field and an
optional "erstellt" field (ISO date string, YYYY-MM-DD). If the real
file looks different, the mini JS parser below may need adjusting -
in that case just share js/ratgeber.js and the parser can be fixed.
"""

import argparse
import re
import sys
from dataclasses import dataclass, field
from datetime import date, datetime
from pathlib import Path


# --------------------------------------------------------------------
# Minimal parser for JSON5-ish JS object/array literals.
#
# Deliberately NOT a general JS parser - just enough to read a data
# literal like ratgeberRohdaten: single/double/backtick strings,
# unquoted object keys, // and /* */ comments, and trailing commas
# before } or ]. Using this instead of exec()/eval() means the rest
# of ratgeber.js (which may reference browser globals) is never
# actually executed.
# --------------------------------------------------------------------

class JSDatenFehler(Exception):
    """Raised when the mini JS parser can't make sense of the input."""


@dataclass(frozen=True)
class JSEnumWert:
    """
    Stands for an enum-style member reference such as
    RatgeberKategorie.LEBEN.

    The enum itself is defined elsewhere in the project, so the parser
    can't resolve it to a real value - it just keeps the enum name and
    the member name apart so callers can inspect or compare them.
    str() gives back the original JS spelling ("RatgeberKategorie.LEBEN").
    """

    enum: str
    name: str

    def __str__(self) -> str:
        return f"{self.enum}.{self.name}"


class MiniJSParser:

    _KEYWORDS = {
        "true": True,
        "false": False,
        "null": None,
        "undefined": None,
    }

    def __init__(self, text: str, pos: int = 0):
        self.text = text
        self.pos = pos
        self.length = len(text)

    def _skip_ws_und_kommentare(self):
        while self.pos < self.length:
            ch = self.text[self.pos]
            if ch in " \t\r\n":
                self.pos += 1
            elif self.text.startswith("//", self.pos):
                ende = self.text.find("\n", self.pos)
                self.pos = self.length if ende == -1 else ende + 1
            elif self.text.startswith("/*", self.pos):
                ende = self.text.find("*/", self.pos + 2)
                if ende == -1:
                    raise JSDatenFehler("Unterminated block comment")
                self.pos = ende + 2
            else:
                break

    def _peek(self) -> str:
        self._skip_ws_und_kommentare()
        if self.pos >= self.length:
            return ""
        return self.text[self.pos]

    def parse_value(self):
        ch = self._peek()
        if ch == "{":
            return self._parse_object()
        if ch == "[":
            return self._parse_array()
        if ch in "\"'`":
            return self._parse_string()
        if ch == "-" or ch.isdigit():
            return self._parse_number()
        # Anything else is a bare identifier: either a keyword
        # (true/false/null/undefined) or an enum reference like
        # RatgeberKategorie.LEBEN.
        return self._parse_bezeichner()

    def _parse_object(self) -> dict:
        self.pos += 1  # consume '{'
        ergebnis = {}
        while True:
            self._skip_ws_und_kommentare()
            if self._peek() == "}":
                self.pos += 1
                break
            key = self._parse_key()
            self._skip_ws_und_kommentare()
            if self._peek() != ":":
                raise JSDatenFehler(f"Expected ':' at position {self.pos}")
            self.pos += 1
            ergebnis[key] = self.parse_value()
            self._skip_ws_und_kommentare()
            if self._peek() == ",":
                self.pos += 1
                continue
            if self._peek() == "}":
                self.pos += 1
                break
            raise JSDatenFehler(f"Expected ',' or '}}' at position {self.pos}")
        return ergebnis

    def _parse_array(self) -> list:
        self.pos += 1  # consume '['
        ergebnis = []
        while True:
            self._skip_ws_und_kommentare()
            if self._peek() == "]":
                self.pos += 1
                break
            ergebnis.append(self.parse_value())
            self._skip_ws_und_kommentare()
            if self._peek() == ",":
                self.pos += 1
                continue
            if self._peek() == "]":
                self.pos += 1
                break
            raise JSDatenFehler(f"Expected ',' or ']' at position {self.pos}")
        return ergebnis

    def _parse_key(self) -> str:
        ch = self._peek()
        if ch in "\"'`":
            return self._parse_string()
        # Unquoted identifier key.
        schluessel = self._lese_bezeichner()
        if not schluessel:
            raise JSDatenFehler(f"Expected an object key at position {self.pos}")
        return schluessel

    def _lese_bezeichner(self) -> str:
        """Reads a single identifier (letters, digits, _ and $). May return ''."""
        start = self.pos
        while self.pos < self.length and (
            self.text[self.pos].isalnum() or self.text[self.pos] in "_$"
        ):
            self.pos += 1
        return self.text[start:self.pos]

    def _parse_string(self) -> str:
        anfuehrer = self.text[self.pos]
        self.pos += 1
        teile = []
        while True:
            if self.pos >= self.length:
                raise JSDatenFehler("Unterminated string")
            ch = self.text[self.pos]
            if ch == anfuehrer:
                self.pos += 1
                break
            if ch == "\\":
                self.pos += 1
                escape = self.text[self.pos]
                mapping = {
                    "n": "\n", "t": "\t", "r": "\r", "\\": "\\",
                    "'": "'", '"': '"', "`": "`", "0": "\0",
                }
                teile.append(mapping.get(escape, escape))
                self.pos += 1
            else:
                teile.append(ch)
                self.pos += 1
        return "".join(teile)

    def _parse_number(self):
        start = self.pos
        if self.text[self.pos] == "-":
            self.pos += 1
        while self.pos < self.length and (
            self.text[self.pos].isdigit() or self.text[self.pos] in ".eE+-"
        ):
            self.pos += 1
        rohtext = self.text[start:self.pos]
        try:
            return float(rohtext) if any(c in rohtext for c in ".eE") else int(rohtext)
        except ValueError as fehler:
            raise JSDatenFehler(f"Invalid number literal {rohtext!r}") from fehler

    def _parse_bezeichner(self):
        """
        Parses a bare identifier or a dotted identifier path.

        - "true" / "false" / "null" / "undefined" -> the matching Python value
        - "RatgeberKategorie.LEBEN"               -> JSEnumWert("RatgeberKategorie", "LEBEN")

        Any other lone identifier (e.g. a variable reference) can't be
        resolved without executing the JS, so it is reported as an error.
        """
        start = self.pos
        teile = []

        while True:
            teil = self._lese_bezeichner()
            if not teil:
                raise JSDatenFehler(
                    f"Unexpected input at position {self.pos}: "
                    f"{self.text[self.pos:self.pos + 20]!r}"
                )
            teile.append(teil)
            if self.pos < self.length and self.text[self.pos] == ".":
                self.pos += 1  # consume '.', a member name must follow
                continue
            break

        if len(teile) == 1:
            name = teile[0]
            if name in self._KEYWORDS:
                return self._KEYWORDS[name]
            raise JSDatenFehler(
                f"Unknown identifier {name!r} at position {start} "
                f"(expected true/false/null/undefined or Enum.MEMBER)"
            )

        return JSEnumWert(enum=".".join(teile[:-1]), name=teile[-1])


def lade_ratgeber_rohdaten(pfad: Path) -> list:
    """Locates and parses the ratgeberRohdaten array literal in js/ratgeber.js."""

    text = pfad.read_text(encoding="utf-8")

    treffer = re.search(r"ratgeberRohdaten\s*=", text)
    if not treffer:
        raise JSDatenFehler(f"'ratgeberRohdaten' was not found in {pfad}.")

    wert = MiniJSParser(text, pos=treffer.end()).parse_value()

    if not isinstance(wert, list):
        raise JSDatenFehler("'ratgeberRohdaten' is not an array.")

    return wert


# --------------------------------------------------------------------
# Actual checks
# --------------------------------------------------------------------

@dataclass
class Meldungen:
    """Collects errors and warnings instead of raising on the first one."""

    fehler: list = field(default_factory=list)
    warnungen: list = field(default_factory=list)

    def fehler_melden(self, slug: str, text: str):
        self.fehler.append(f"[{slug}] {text}")

    def warnung_melden(self, slug: str, text: str):
        self.warnungen.append(f"[{slug}] {text}")


def datei_mit_slug_existiert(ordner: Path, slug: str, endung: str) -> bool:
    return (ordner / f"{slug}{endung}").is_file()


def _pruefe_optionale_md_datei(
    ordner: Path, slug: str, eintrag: dict, meldungen: Meldungen, beschreibung: str
):
    """
    Checks for <ordner>/<slug>.md. Missing is only a hard error when
    "erstellt" is set and not in the future - otherwise it's just a
    warning (the entry may simply not be published yet).
    """

    if datei_mit_slug_existiert(ordner, slug, ".md"):
        return

    erstellt_roh = eintrag.get("erstellt")
    pfad_hinweis = f"{beschreibung}/{slug}.md"

    if not erstellt_roh:
        meldungen.warnung_melden(
            slug, f"{pfad_hinweis} fehlt (kein 'erstellt' gesetzt)."
        )
        return

    try:
        erstellt = datetime.strptime(str(erstellt_roh), "%Y-%m-%d").date()
    except (ValueError, TypeError):
        meldungen.fehler_melden(
            slug,
            f"'erstellt' ({erstellt_roh!r}) ist kein gültiges Datum "
            f"(erwartet YYYY-MM-DD).",
        )
        return

    if erstellt > date.today():
        meldungen.warnung_melden(
            slug,
            f"{pfad_hinweis} fehlt, 'erstellt' liegt aber in der "
            f"Zukunft ({erstellt_roh}) - noch kein Fehler.",
        )
    else:
        meldungen.fehler_melden(slug, f"{pfad_hinweis} fehlt.")


def pruefe_eintrag(eintrag: dict, root: Path, meldungen: Meldungen):

    slug = eintrag.get("slug")
    kategorie = eintrag.get("kategorie")

    # No slug means most other checks can't run meaningfully - but we
    # still record it as an error and move on to the next entry
    # instead of aborting the whole run.
    bezeichner = slug or eintrag.get("titel") or "<ohne slug>"

    if not slug:
        meldungen.fehler_melden(bezeichner, "Property 'slug' fehlt.")
    if not kategorie:
        meldungen.fehler_melden(bezeichner, "Property 'kategorie' fehlt.")

    if not slug:
        return

    if not datei_mit_slug_existiert(root / "md" / "ratgeber", slug, ".md"):
        meldungen.fehler_melden(slug, f"md/ratgeber/{slug}.md fehlt.")

    _pruefe_optionale_md_datei(
        root / "md" / "ratgeber-kommentare", slug, eintrag, meldungen,
        beschreibung="md/ratgeber-kommentare",
    )

    _pruefe_optionale_md_datei(
        root / "md" / "news-ratgeber", slug, eintrag, meldungen,
        beschreibung="md/news-ratgeber",
    )

    if not datei_mit_slug_existiert(root / "pics" / "ratgeber-front", slug, ".png"):
        meldungen.fehler_melden(slug, f"pics/ratgeber-front/{slug}.png fehlt.")

    if not datei_mit_slug_existiert(root / "pics" / "ratgeber-back", slug, ".png"):
        meldungen.fehler_melden(slug, f"pics/ratgeber-back/{slug}.png fehlt.")

    if not datei_mit_slug_existiert(root / "pics" / "ratgeber-mockup", slug, ".png"):
        meldungen.fehler_melden(slug, f"pics/ratgeber-mockup/{slug}.png fehlt.")

    if not datei_mit_slug_existiert(root / "pics" / "ratgeber-teaser", slug, ".png"):
        meldungen.warnung_melden(slug, f"pics/ratgeber-teaser/{slug}.png fehlt.")


def main():

    argparser = argparse.ArgumentParser(
        description="Checks that all files required by ratgeberRohdaten exist."
    )
    argparser.add_argument(
        "projekt_root",
        nargs="?",
        default=".",
        help="Project root directory (default: current directory).",
    )
    args = argparser.parse_args()

    root = Path(args.projekt_root).resolve()
    ratgeber_js = root / "js" / "ratgeber.js"

    if not ratgeber_js.is_file():
        print(f"Datei nicht gefunden: {ratgeber_js}", file=sys.stderr)
        sys.exit(1)

    try:
        rohdaten = lade_ratgeber_rohdaten(ratgeber_js)
    except JSDatenFehler as fehler:
        print(f"Konnte ratgeberRohdaten nicht lesen: {fehler}", file=sys.stderr)
        sys.exit(1)

    meldungen = Meldungen()

    for eintrag in rohdaten:
        if not isinstance(eintrag, dict):
            meldungen.fehler_melden("<unbekannt>", f"Kein Objekt: {eintrag!r}")
            continue
        pruefe_eintrag(eintrag, root, meldungen)

    print(f"{len(rohdaten)} Ratgeber-Einträge geprüft.\n")

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