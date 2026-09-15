#!/usr/bin/env python3
"""
Wandelt Ratgeber-Markdown-Dateien (md/ratgeber/*.md) in Buch-artig
formatierte PDFs um. Layout ist A4 mit normalem Textfluss (nicht die
strikte Pixel-Seitenaufteilung des Flipbooks), aber Farben, Schriften
und Elemente (Kapitelüberschriften, Zitate, Listen, Tabellen) sind aus
style.css übernommen, damit es optisch an die Flipbook-Ansicht angelehnt
ist. Ohne Cover-Bilder: es wird eine schlichte typografische Titelseite
erzeugt.

Requirements:
    pip install markdown weasyprint
    (WeasyPrint braucht zusätzlich System-Libraries wie Pango, Cairo und
    GDK-Pixbuf - siehe https://doc.courtbouillon.org/weasyprint/stable/first_steps.html#installation)

Usage:
    python md_zu_pdf.py                        # alle Ratgeber konvertieren
    python md_zu_pdf.py der-perfekte-sonntag    # nur einen Ratgeber (Slug = Dateiname ohne .md)
"""

import argparse
import re
import sys
from pathlib import Path

import markdown
from weasyprint import CSS, HTML

# --- Paths ------------------------------------------------------------

SCRIPT_DIR = Path(__file__).resolve().parent
RATGEBER_DIR = SCRIPT_DIR / ".." / "md" / "ratgeber"
OUTPUT_DIR = SCRIPT_DIR / ".." / "pdf" / "ratgeber"

# --- Markdown preprocessing --------------------------------------------


def in_bloecke(markdown_text: str) -> list[str]:
    """Split markdown into blank-line-separated blocks - the same unit
    parseMarkdownBloecke() in buch.js works on. A heading is always its
    own single-line block, so this is enough to run the heading logic
    below; multi-line blocks (lists, tables, paragraphs) simply pass
    through untouched as one block each."""
    return [b for b in re.split(r"\n\s*\n", markdown_text.strip()) if b]


def _ist_h1(block: str) -> bool:
    return block.startswith("# ")


def _ist_h2(block: str) -> bool:
    return block.startswith("## ")


def vereinheitliche_ueberschriften(markdown_text: str) -> str:
    """Port of bereinigeKapitelUeberschriften() in buch.js to markdown
    blocks (instead of parsed <h1>/<h2> blocks). Only the very first '#'
    heading in the book stays H1 (the book title); every other chapter
    heading becomes H2. A generic placeholder heading ("Kapitel ...",
    "Schlusswort") is discarded entirely - the H2 title right after it
    becomes the real chapter heading. A chapter's own title WITH a
    following H2 subtitle gets combined into one heading ("Titel:
    Untertitel"), except for the very first heading in the book, which
    always stays standalone."""
    bloecke = in_bloecke(markdown_text)
    ergebnis: list[str] = []
    i = 0
    erste_ueberschrift = True

    while i < len(bloecke):
        block = bloecke[i]

        if not _ist_h1(block):
            ergebnis.append(block)
            i += 1
            continue

        eigener_titel = block[2:].strip()
        generisch = re.match(r"^(Kapitel|Schlusswort)", eigener_titel)
        war_erste = erste_ueberschrift
        ziel_marker = "#" if war_erste else "##"
        erste_ueberschrift = False
        i += 1

        # Everything up to the next heading (H1 or H2), collected
        # unchanged - normally empty, since a chapter's own title
        # heading directly follows.
        zwischen: list[str] = []
        while i < len(bloecke) and not _ist_h1(bloecke[i]) and not _ist_h2(bloecke[i]):
            zwischen.append(bloecke[i])
            i += 1

        naechste_ist_h2 = i < len(bloecke) and _ist_h2(bloecke[i])

        if generisch:
            ergebnis.extend(zwischen)
            if naechste_ist_h2:
                inhalt = bloecke[i][3:].strip()
                ergebnis.append(f"{ziel_marker} {inhalt}")
                i += 1
        elif naechste_ist_h2 and war_erste:
            ergebnis.append(f"# {eigener_titel}")
            ergebnis.extend(zwischen)
            ergebnis.append(bloecke[i])
            i += 1
        elif naechste_ist_h2:
            untertitel = bloecke[i][3:].strip()
            ergebnis.append(f"{ziel_marker} {eigener_titel}: {untertitel}")
            ergebnis.extend(zwischen)
            i += 1
        else:
            ergebnis.append(f"{ziel_marker} {eigener_titel}")
            ergebnis.extend(zwischen)

    return "\n\n".join(ergebnis)


def quiz_checkboxen_als_liste(markdown_text: str) -> str:
    """Turn '☐ Option' lines (quiz answer options inside BONUS sections)
    into a proper markdown list, so they render as bullet points instead
    of one run-on paragraph. The PDF has no click handling, so the quiz
    simply appears as a normal (static) part of the book."""
    zeilen = markdown_text.splitlines()
    ergebnis = [
        f"- {zeile}" if zeile.strip().startswith("☐") else zeile
        for zeile in zeilen
    ]
    return "\n".join(ergebnis)


def erster_titel(markdown_text: str) -> str:
    """Extract the text of the first '# ' heading - used as the title
    page heading and as the PDF document title."""
    match = re.search(r"^#\s+(.+)$", markdown_text, re.MULTILINE)
    return match.group(1).strip() if match else "Ratgeber"


# --- HTML/CSS -----------------------------------------------------------

# Colors/fonts below are taken 1:1 from the site's design tokens
# (style.css :root) and its .flipbook-page rules, so the PDF reads like
# the flipbook pages rather than the plain scrolling article view:
#   --color-bg           #F1ECE2
#   --color-bg-alt        #E7E0D2
#   --color-text          #1B2340
#   --color-muted         #5A5F72
#   --color-accent         #B5292C
#   --font-display        'Fraunces', serif       (headings, blockquotes)
#   --font-body           'Inter', sans-serif     (.flipbook-page p)
# Fraunces/Inter are loaded from Google Fonts so they render correctly
# even without the fonts installed locally; drop the @import and point
# font-family at local fonts if the machine has no internet access.
CSS_TEXT = """
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Inter:wght@400;600&display=swap');

@page {
    size: A4;
    margin: 2.8cm 3cm;
    background: #F1ECE2;
    @bottom-center {
        content: counter(page);
        font-family: Georgia, "Times New Roman", serif;
        font-style: italic;
        font-size: 9pt;
        color: #5A5F72;
    }
}

body {
    font-family: 'Inter', Helvetica, Arial, sans-serif;
    font-size: 10.8pt;
    line-height: 1.6;
    color: #1B2340;
    text-align: justify;
    hyphens: auto;
    background: #F1ECE2;
}

.titelseite {
    page-break-after: always;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    height: 85vh;
    text-align: center;
}

.titelseite h1 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    font-size: 30pt;
    color: #1B2340;
    border: none;
    margin: 0;
    padding: 0;
    page-break-before: avoid;
}

.titelseite h1::after {
    content: "";
    display: block;
    width: 64px;
    height: 3px;
    margin: 20px auto 0;
    background: #B5292C;
}

.titelseite p.autor {
    margin-top: 1.4em;
    font-family: 'Inter', Helvetica, Arial, sans-serif;
    font-weight: 600;
    font-size: 9pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
    font-style: normal;
    color: #5A5F72;
}

h1, h2, h3 {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    page-break-before: always;
    page-break-after: avoid;
    text-align: left;
}

h1 {
    font-size: 22pt;
    color: #1B2340;
    margin: 0 0 20px;
}

h1::after {
    content: "";
    display: block;
    width: 64px;
    height: 3px;
    margin-top: 12px;
    background: #B5292C;
}

h2 {
    font-size: 17pt;
    color: #B5292C;
    margin-top: 2em;
}

h3 {
    font-size: 13pt;
    color: #B5292C;
    page-break-before: avoid;
}

p { margin: 0 0 0.95em 0; }

blockquote {
    position: relative;
    margin: 1.6em 0 1.6em 0.3em;
    padding: 0 0 0 22px;
    border-left: 3px solid #B5292C;
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 500;
    font-style: normal;
    font-size: 13pt;
    line-height: 1.5;
    color: #1B2340;
}

blockquote::before {
    content: "\\201E";
    position: absolute;
    left: -2px;
    top: -30px;
    font-family: Georgia, serif;
    font-size: 38pt;
    line-height: 1;
    color: #B5292C;
    opacity: 0.25;
}

blockquote strong { color: #1B2340; }

ul, ol {
    margin: 0 0 0.95em 0;
    padding: 0 0 0 22px;
}

ul { list-style: none; }

ul li {
    position: relative;
    margin-bottom: 0.35em;
    padding-left: 4px;
}

ul li::before {
    content: "";
    position: absolute;
    left: -14px;
    top: 0.6em;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #B5292C;
}

ol li { margin-bottom: 0.35em; }

strong { color: #B5292C; }

table {
    width: 100%;
    border-collapse: collapse;
    margin: 1.4em 0;
    font-size: 10pt;
    font-family: 'Inter', Helvetica, Arial, sans-serif;
}

th, td {
    border: 1px solid #D6CDBB;
    padding: 0.45em 0.7em;
    text-align: left;
}

thead { background: #E7E0D2; }

th {
    font-family: 'Fraunces', Georgia, serif;
    font-weight: 600;
    color: #1B2340;
}

hr {
    border: none;
    border-top: 2px solid #B5292C;
    width: 60px;
    margin: 2.2em 0;
}
"""

HTML_TEMPLATE = """<!DOCTYPE html>
<html lang="de">
<head><meta charset="utf-8"><title>{titel}</title></head>
<body>
<div class="titelseite">
    <h1>{titel}</h1>
    <p class="autor">Ratgeber</p>
</div>
{inhalt}
</body>
</html>
"""


def markdown_zu_pdf(md_pfad: Path, ziel_pfad: Path) -> None:
    rohtext = md_pfad.read_text(encoding="utf-8")

    vorbereitet = quiz_checkboxen_als_liste(
        vereinheitliche_ueberschriften(rohtext)
    )

    # The first '# ' heading becomes the title-page heading and is
    # stripped from the body so it doesn't appear a second time.
    titel = erster_titel(vorbereitet)
    vorbereitet = re.sub(
        r"^#\s+.+\n?", "", vorbereitet, count=1, flags=re.MULTILINE
    )

    inhalt_html = markdown.markdown(
        vorbereitet, extensions=["tables", "sane_lists"]
    )

    seite_html = HTML_TEMPLATE.format(titel=titel, inhalt=inhalt_html)

    ziel_pfad.parent.mkdir(parents=True, exist_ok=True)
    HTML(string=seite_html, base_url=str(md_pfad.parent)).write_pdf(
        str(ziel_pfad), stylesheets=[CSS(string=CSS_TEXT)]
    )


# --- CLI ------------------------------------------------------------------


def sammle_ratgeber_dateien(slug: str | None) -> list[Path]:
    if slug:
        pfad = RATGEBER_DIR / f"{slug}.md"
        if not pfad.exists():
            sys.exit(f"Ratgeber '{slug}' wurde nicht gefunden: {pfad}")
        return [pfad]

    dateien = sorted(RATGEBER_DIR.glob("*.md"))
    if not dateien:
        sys.exit(f"Keine .md-Dateien in {RATGEBER_DIR} gefunden.")
    return dateien


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Wandelt Ratgeber-Markdown-Dateien in Buch-artig formatierte PDFs um."
    )
    parser.add_argument(
        "slug",
        nargs="?",
        default=None,
        help="Slug des Ratgebers (Dateiname ohne .md). Ohne Angabe werden alle Ratgeber konvertiert.",
    )
    args = parser.parse_args()

    dateien = sammle_ratgeber_dateien(args.slug)

    for md_pfad in dateien:
        ziel_pfad = OUTPUT_DIR / f"{md_pfad.stem}.pdf"
        print(f"Konvertiere {md_pfad.name} -> {ziel_pfad} ...")
        markdown_zu_pdf(md_pfad, ziel_pfad)

    print(f"Fertig: {len(dateien)} PDF(s) erzeugt in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()