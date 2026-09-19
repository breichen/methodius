#!/usr/bin/env python3
"""
Checks the <head> of every *.html file directly in the project root
against the fixed set of rules the project's <head> is supposed to
follow (see the docstrings of the individual pruefe_*-functions below
for the exact rule each one checks).

Like pruefe_ratgeber.py and pruefe_js_reihenfolge.py, this script
never aborts on the first problem - it collects every error and
reports them all at the end.

Usage:
    python pruefe_head.py [project-root]

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
# Erwartete, feste Bestandteile (siehe Beispiel-<head> aus der Aufgabe).
# --------------------------------------------------------------------

ERWARTETE_TITEL_ENDUNG = " – Dr. Methodius"

# Ausnahme: die Hauptseite hat ein umgekehrtes Titelschema.
HAUPTSEITE_DATEINAME = "index.html"
HAUPTSEITE_TITEL_PRAEFIX = "Dr. Methodius – "

# Jedes Dict beschreibt genau ein erwartetes <link>-Icon-Tag: die
# Attribute müssen exakt (Name UND Wert) so vorkommen - zusätzliche
# Attribute an diesem Tag sind nicht erlaubt, die Reihenfolge der
# Attribute untereinander spielt keine Rolle.
ERWARTETE_ICON_TAGS = [
    {"rel": "icon", "href": "assets/favicon/favicon.ico", "sizes": "any"},
    {
        "rel": "icon", "type": "image/png", "sizes": "32x32",
        "href": "assets/favicon/methodius-32x32.png",
    },
    {
        "rel": "icon", "type": "image/png", "sizes": "16x16",
        "href": "assets/favicon/methodius-16x16.png",
    },
    {
        "rel": "apple-touch-icon", "sizes": "180x180",
        "href": "assets/favicon/methodius-180x180.png",
    },
]

FONTS_PRECONNECT_HREF = "https://fonts.googleapis.com"
FONTS_STYLESHEET_TEIL = "fonts.googleapis.com/css2"


# --------------------------------------------------------------------
# Kleiner HTML-Tag-/Attribut-Parser (kein vollständiger HTML-Parser -
# reicht aber für <meta>/<link>/<title> im <head>).
# --------------------------------------------------------------------

_TAG_MUSTER = re.compile(r"<([a-zA-Z][\w-]*)\b([^>]*)>", re.DOTALL)
_ATTR_MUSTER = re.compile(
    r'([a-zA-Z_:][-\w:.]*)\s*=\s*(?:"([^"]*)"|\'([^\']*)\')'
)


def _parse_attribute(attr_text: str) -> dict:
    attribute = {}
    for m in _ATTR_MUSTER.finditer(attr_text):
        name = m.group(1).lower()
        wert = m.group(2) if m.group(2) is not None else m.group(3)
        attribute[name] = wert.strip()
    return attribute


def _finde_tags(head_text: str, tag_name: str) -> list:
    """Returns the attribute-dicts of every <tag_name ...> in head_text."""
    ergebnis = []
    for name, attr_text in _TAG_MUSTER.findall(head_text):
        if name.lower() == tag_name.lower():
            ergebnis.append(_parse_attribute(attr_text))
    return ergebnis


def _extrahiere_head(html_text: str):
    treffer = re.search(r"<head\b[^>]*>(.*?)</head\s*>", html_text, re.DOTALL | re.IGNORECASE)
    return treffer.group(1) if treffer else None


# --------------------------------------------------------------------
# Meldungen
# --------------------------------------------------------------------

@dataclass
class Meldungen:
    """Collects errors instead of raising on the first one."""

    fehler: list = field(default_factory=list)

    def fehler_melden(self, datei: str, text: str):
        self.fehler.append(f"[{datei}] {text}")


# --------------------------------------------------------------------
# Einzelne Prüfungen
# --------------------------------------------------------------------

def _pruefe_meta_charset(head: str, dateiname: str, meldungen: Meldungen):
    """Regel: <meta charset="UTF-8"> muss vorkommen."""
    for attribute in _finde_tags(head, "meta"):
        if attribute.get("charset", "").lower() == "utf-8":
            return
    meldungen.fehler_melden(
        dateiname, 'Fehlendes <meta charset="UTF-8">.'
    )


def _pruefe_meta_viewport(head: str, dateiname: str, meldungen: Meldungen):
    """Regel: <meta name="viewport" content="width=device-width, initial-scale=1.0"> muss vorkommen."""
    erwarteter_content = "width=device-width, initial-scale=1.0"
    for attribute in _finde_tags(head, "meta"):
        if attribute.get("name", "").lower() == "viewport":
            if attribute.get("content", "").strip() == erwarteter_content:
                return
            meldungen.fehler_melden(
                dateiname,
                f"<meta name=\"viewport\"> hat content={attribute.get('content')!r}, "
                f"erwartet {erwarteter_content!r}.",
            )
            return
    meldungen.fehler_melden(
        dateiname, 'Fehlendes <meta name="viewport" content="...">.'
    )


def _pruefe_icons(head: str, dateiname: str, meldungen: Meldungen):
    """Regel: die vier Favicon-/Apple-Touch-Icon-<link>-Tags müssen
    exakt (alle Attribute, keine zusätzlichen) so wie im Beispiel
    vorkommen."""

    link_tags = _finde_tags(head, "link")

    for erwartet in ERWARTETE_ICON_TAGS:
        if erwartet not in link_tags:
            attrs_text = " ".join(f'{k}="{v}"' for k, v in erwartet.items())
            meldungen.fehler_melden(
                dateiname, f"Fehlendes oder abweichendes Icon-Tag: <link {attrs_text}>."
            )


def _pruefe_titel(head: str, dateiname: str, meldungen: Meldungen):
    """Regel: <title> muss auf " – Dr. Methodius" enden - außer auf der
    Hauptseite (HAUPTSEITE_DATEINAME), wo es umgekehrt mit
    "Dr. Methodius - " beginnen muss."""
    treffer = re.search(r"<title\b[^>]*>(.*?)</title\s*>", head, re.DOTALL | re.IGNORECASE)
    if treffer is None:
        meldungen.fehler_melden(dateiname, "Fehlendes <title>.")
        return

    titel = treffer.group(1).strip()

    if dateiname == HAUPTSEITE_DATEINAME:
        if not titel.startswith(HAUPTSEITE_TITEL_PRAEFIX):
            meldungen.fehler_melden(
                dateiname,
                f"<title> {titel!r} beginnt nicht mit "
                f"{HAUPTSEITE_TITEL_PRAEFIX!r} (Hauptseite).",
            )
        return

    if not titel.endswith(ERWARTETE_TITEL_ENDUNG):
        meldungen.fehler_melden(
            dateiname,
            f"<title> {titel!r} endet nicht auf {ERWARTETE_TITEL_ENDUNG!r}.",
        )


def _pruefe_font_loads(head: str, dateiname: str, meldungen: Meldungen):
    """Regel: die Google-Fonts-Einbindung (preconnect + stylesheet)
    muss vorhanden sein."""

    link_tags = _finde_tags(head, "link")

    hat_preconnect = any(
        attribute.get("rel", "").lower() == "preconnect"
        and attribute.get("href", "").rstrip("/") == FONTS_PRECONNECT_HREF
        for attribute in link_tags
    )
    if not hat_preconnect:
        meldungen.fehler_melden(
            dateiname,
            f'Fehlendes <link rel="preconnect" href="{FONTS_PRECONNECT_HREF}">.',
        )

    hat_stylesheet = any(
        attribute.get("rel", "").lower() == "stylesheet"
        and FONTS_STYLESHEET_TEIL in attribute.get("href", "")
        for attribute in link_tags
    )
    if not hat_stylesheet:
        meldungen.fehler_melden(
            dateiname,
            f"Fehlender Google-Fonts-Stylesheet-Link (href mit "
            f"'{FONTS_STYLESHEET_TEIL}').",
        )


def _pruefe_css_datei(head: str, dateiname: str, meldungen: Meldungen):
    """Regel: mindestens ein eigenes (lokales) CSS-Stylesheet muss
    eingebunden werden - die Google-Fonts-Einbindung zählt dafür nicht."""

    for attribute in _finde_tags(head, "link"):
        if attribute.get("rel", "").lower() != "stylesheet":
            continue
        href = attribute.get("href", "")
        ohne_query = href.split("?", 1)[0].split("#", 1)[0]
        if ohne_query.lower().endswith(".css"):
            return

    meldungen.fehler_melden(
        dateiname, "Kein lokales CSS-Stylesheet (<link rel=\"stylesheet\" href=\"....css\">) gefunden."
    )


def pruefe_datei(pfad: Path, meldungen: Meldungen):
    try:
        html_text = pfad.read_text(encoding="utf-8")
    except OSError as fehler:
        meldungen.fehler_melden(pfad.name, f"konnte nicht gelesen werden: {fehler}")
        return

    head = _extrahiere_head(html_text)
    if head is None:
        meldungen.fehler_melden(pfad.name, "Kein <head>...</head> gefunden.")
        return

    _pruefe_meta_charset(head, pfad.name, meldungen)
    _pruefe_meta_viewport(head, pfad.name, meldungen)
    _pruefe_icons(head, pfad.name, meldungen)
    _pruefe_titel(head, pfad.name, meldungen)
    _pruefe_font_loads(head, pfad.name, meldungen)
    _pruefe_css_datei(head, pfad.name, meldungen)


def main():
    argparser = argparse.ArgumentParser(
        description="Checks the <head> of the root HTML files against the project's fixed rules."
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