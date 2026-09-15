#!/usr/bin/env python3
"""
Erzeugt PDF-Dateien aus den Ratgeber-Markdown-Dateien.

Aufruf:

    python ratgeber_pdf.py
        -> erzeugt PDFs für alle ../md/ratgeber/*.md

    python ratgeber_pdf.py der-perfekte-sonntag
        -> erzeugt ../pdf/ratgeber/der-perfekte-sonntag.pdf

Optional:
    python ratgeber_pdf.py der-perfekte-sonntag --output ./pdf
"""

from __future__ import annotations

import argparse
import re
import sys
from pathlib import Path
from html import escape

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT, TA_CENTER
from reportlab.lib.pagesizes import A5
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    PageTemplate,
    Frame,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    HRFlowable,
    KeepTogether,
    ListFlowable,
    ListItem,
)
from reportlab.lib.colors import HexColor


# ============================================================
# PFAD-EINSTELLUNGEN
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent

MD_DIR = SCRIPT_DIR / "../md/ratgeber"
DEFAULT_OUTPUT_DIR = SCRIPT_DIR / "../pdf/ratgeber"


# ============================================================
# DESIGN – an style.css / Flipbook angelehnt
# ============================================================

BG = HexColor("#F1ECE2")
BG_ALT = HexColor("#E7E0D2")
TEXT = HexColor("#1B2340")
MUTED = HexColor("#5A5F72")
ACCENT = HexColor("#B5292C")
BORDER = HexColor("#D6CDBB")


# Flipbook:
#
#   --font-display: 'Fraunces', serif;
#   --font-body:    'Inter', sans-serif;
#
# Die Browser-Version verwendet Google Fonts.
# Für PDF müssen die TTF-Dateien lokal vorhanden sein.
#
# Diese Liste kann bei Bedarf angepasst werden.
FONT_CANDIDATES = {
    "Inter-Regular": [
        "/usr/share/fonts/truetype/inter/Inter-Regular.ttf",
        "/usr/share/fonts/truetype/inter/Inter_18pt-Regular.ttf",
        "/usr/share/fonts/truetype/inter/static/Inter_18pt-Regular.ttf",
        "/usr/local/share/fonts/Inter-Regular.ttf",
        str(SCRIPT_DIR / "fonts/Inter-Regular.ttf"),
    ],
    "Inter-SemiBold": [
        "/usr/share/fonts/truetype/inter/Inter-SemiBold.ttf",
        "/usr/share/fonts/truetype/inter/Inter_18pt-SemiBold.ttf",
        "/usr/share/fonts/truetype/inter/static/Inter_18pt-SemiBold.ttf",
        "/usr/local/share/fonts/Inter-SemiBold.ttf",
        str(SCRIPT_DIR / "fonts/Inter-SemiBold.ttf"),
    ],
    "Inter-Italic": [
        "/usr/share/fonts/truetype/inter/Inter-Italic.ttf",
        "/usr/share/fonts/truetype/inter/Inter_18pt-Italic.ttf",
        "/usr/share/fonts/truetype/inter/static/Inter_18pt-Italic.ttf",
        "/usr/local/share/fonts/Inter-Italic.ttf",
        str(SCRIPT_DIR / "fonts/Inter-Italic.ttf"),
    ],
    "Fraunces-Regular": [
        "/usr/share/fonts/truetype/fraunces/Fraunces-Regular.ttf",
        "/usr/local/share/fonts/Fraunces-Regular.ttf",
        str(SCRIPT_DIR / "fonts/Fraunces-Regular.ttf"),
    ],
    "Fraunces-SemiBold": [
        "/usr/share/fonts/truetype/fraunces/Fraunces-SemiBold.ttf",
        "/usr/local/share/fonts/Fraunces-SemiBold.ttf",
        str(SCRIPT_DIR / "fonts/Fraunces-SemiBold.ttf"),
    ],
}


def find_font(candidates):
    """Erste existierende Font-Datei zurückgeben."""
    for candidate in candidates:
        path = Path(candidate).expanduser()
        if path.exists():
            return path

    return None


def register_fonts():
    """
    Registriert Inter und Fraunces.

    Wenn die Fonts nicht gefunden werden, wird mit Helvetica /
    Times als Fallback gearbeitet. Das PDF funktioniert dann trotzdem,
    sieht aber natürlich nicht exakt wie die Website aus.
    """

    found = {}

    for name, candidates in FONT_CANDIDATES.items():
        path = find_font(candidates)

        if path:
            pdfmetrics.registerFont(TTFont(name, str(path)))
            found[name] = name

    # Fallbacks
    body_regular = found.get("Inter-Regular", "Helvetica")
    body_semibold = found.get("Inter-SemiBold", "Helvetica-Bold")
    body_italic = found.get("Inter-Italic", "Helvetica-Oblique")

    display_regular = found.get("Fraunces-Regular", "Times-Roman")
    display_semibold = found.get("Fraunces-SemiBold", "Times-Bold")

    return {
        "body": body_regular,
        "body_bold": body_semibold,
        "body_italic": body_italic,
        "display": display_regular,
        "display_bold": display_semibold,
    }


# ============================================================
# MARKDOWN
# ============================================================

def inline_markdown(text):
    """
    Sehr kleiner Markdown-Inline-Parser.

    Unterstützt:
      **fett**
      __fett__
      *kursiv*
      _kursiv_
      `Code`
      [Text](URL)

    Die Ausgabe ist ReportLab-kompatibles Mini-HTML.
    """

    text = escape(text, quote=False)

    # Links
    text = re.sub(
        r"\[([^\]]+)\]\(([^)]+)\)",
        r'<link href="\2" color="#B5292C">\1</link>',
        text,
    )

    # Code
    text = re.sub(
        r"`([^`]+)`",
        r'<font name="Courier">\1</font>',
        text,
    )

    # Fett
    text = re.sub(
        r"\*\*(.+?)\*\*",
        r"<b>\1</b>",
        text,
    )

    text = re.sub(
        r"__(.+?)__",
        r"<b>\1</b>",
        text,
    )

    # Kursiv
    text = re.sub(
        r"(?<!\*)\*([^*]+?)\*(?!\*)",
        r"<i>\1</i>",
        text,
    )

    text = re.sub(
        r"(?<!_)_([^_]+?)_(?!_)",
        r"<i>\1</i>",
        text,
    )

    return text


def is_table_separator(line):
    """
    Prüft z.B.:

        |---|---|
        |:---|---:|
    """

    line = line.strip()

    if not line.startswith("|"):
        return False

    cells = split_table_row(line)

    return bool(cells) and all(
        re.fullmatch(r":?-{2,}:?", cell.strip())
        for cell in cells
    )


def split_table_row(line):
    line = line.strip()

    if line.startswith("|"):
        line = line[1:]

    if line.endswith("|"):
        line = line[:-1]

    return [cell.strip() for cell in line.split("|")]


def parse_markdown(markdown):
    """
    Wandelt Markdown in eine einfache Liste strukturierter Blöcke um.

    Das ist bewusst kein vollständiger Markdown-Parser.
    Es orientiert sich an der Markdown-Struktur, die dein
    buch.js ebenfalls verarbeitet.
    """

    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    blocks = []
    paragraph = []
    i = 0

    def flush_paragraph():
        nonlocal paragraph

        if paragraph:
            text = " ".join(x.strip() for x in paragraph).strip()

            if text:
                blocks.append(("paragraph", text))

            paragraph = []

    while i < len(lines):
        line = lines[i]

        # ----------------------------------------------------
        # Leerzeile
        # ----------------------------------------------------

        if not line.strip():
            flush_paragraph()
            i += 1
            continue

        stripped = line.strip()

        # ----------------------------------------------------
        # Überschrift
        # ----------------------------------------------------

        match = re.match(r"^(#{1,6})\s+(.+?)\s*#*\s*$", stripped)

        if match:
            flush_paragraph()

            level = min(len(match.group(1)), 3)
            title = match.group(2).strip()

            blocks.append(("heading", level, title))

            i += 1
            continue

        # ----------------------------------------------------
        # Horizontale Linie
        # ----------------------------------------------------

        if re.fullmatch(r"[-*_]{3,}", stripped):
            flush_paragraph()
            blocks.append(("hr",))
            i += 1
            continue

        # ----------------------------------------------------
        # Blockquote
        # ----------------------------------------------------

        if stripped.startswith(">"):
            flush_paragraph()

            quote_lines = []

            while i < len(lines):
                current = lines[i].strip()

                if not current.startswith(">"):
                    break

                current = current[1:].strip()
                quote_lines.append(current)
                i += 1

            blocks.append(("quote", " ".join(quote_lines)))
            continue

        # ----------------------------------------------------
        # Tabelle
        # ----------------------------------------------------

        if (
            stripped.startswith("|")
            and i + 1 < len(lines)
            and is_table_separator(lines[i + 1])
        ):
            flush_paragraph()

            header = split_table_row(lines[i])
            i += 2

            rows = []

            while i < len(lines):
                current = lines[i].strip()

                if not current.startswith("|"):
                    break

                rows.append(split_table_row(current))
                i += 1

            blocks.append(("table", header, rows))
            continue

        # ----------------------------------------------------
        # Ungeordnete Liste
        # ----------------------------------------------------

        if re.match(r"^[-*+]\s+", stripped):
            flush_paragraph()

            items = []

            while i < len(lines):
                current = lines[i].strip()

                match = re.match(r"^[-*+]\s+(.+)$", current)

                if not match:
                    break

                items.append(match.group(1))
                i += 1

            blocks.append(("ul", items))
            continue

        # ----------------------------------------------------
        # Geordnete Liste
        # ----------------------------------------------------

        if re.match(r"^\d+[.)]\s+", stripped):
            flush_paragraph()

            items = []

            while i < len(lines):
                current = lines[i].strip()

                match = re.match(r"^\d+[.)]\s+(.+)$", current)

                if not match:
                    break

                items.append(match.group(1))
                i += 1

            blocks.append(("ol", items))
            continue

        # ----------------------------------------------------
        # Normaler Absatz
        # ----------------------------------------------------

        paragraph.append(line)
        i += 1

    flush_paragraph()

    return blocks


# ============================================================
# REPORTLAB STYLES
# ============================================================

def create_styles(fonts):

    styles = getSampleStyleSheet()

    body = ParagraphStyle(
        "FlipbookBody",
        parent=styles["BodyText"],
        fontName=fonts["body"],
        fontSize=8.6 * 1.0,
        leading=13.3,
        textColor=TEXT,
        spaceAfter=7.5 * mm,
        alignment=TA_LEFT,
        allowWidows=1,
        allowOrphans=1,
    )

    h1 = ParagraphStyle(
        "FlipbookH1",
        parent=styles["Heading1"],
        fontName=fonts["display_bold"],
        fontSize=20,
        leading=23,
        textColor=TEXT,
        spaceBefore=0,
        spaceAfter=9 * mm,
        keepWithNext=True,
    )

    h2 = ParagraphStyle(
        "FlipbookH2",
        parent=styles["Heading2"],
        fontName=fonts["display_bold"],
        fontSize=14,
        leading=17,
        textColor=ACCENT,
        spaceBefore=7 * mm,
        spaceAfter=4 * mm,
        keepWithNext=True,
    )

    h3 = ParagraphStyle(
        "FlipbookH3",
        parent=styles["Heading3"],
        fontName=fonts["display_bold"],
        fontSize=11,
        leading=14,
        textColor=ACCENT,
        spaceBefore=5 * mm,
        spaceAfter=3 * mm,
        keepWithNext=True,
    )

    quote = ParagraphStyle(
        "FlipbookQuote",
        parent=body,
        fontName=fonts["display"],
        fontSize=11,
        leading=15,
        textColor=TEXT,
        leftIndent=6 * mm,
        rightIndent=2 * mm,
        borderPadding=(0, 0, 0, 4 * mm),
        borderColor=ACCENT,
        borderWidth=1.5,
        borderLeft=True,
        spaceBefore=5 * mm,
        spaceAfter=6 * mm,
    )

    list_style = ParagraphStyle(
        "FlipbookList",
        parent=body,
        fontName=fonts["body"],
        fontSize=8.2,
        leading=12.1,
        leftIndent=5 * mm,
        firstLineIndent=0,
        spaceAfter=1.5 * mm,
    )

    table_header = ParagraphStyle(
        "TableHeader",
        parent=body,
        fontName=fonts["display_bold"],
        fontSize=8,
        leading=10,
        textColor=TEXT,
        spaceAfter=0,
    )

    table_body = ParagraphStyle(
        "TableBody",
        parent=body,
        fontName=fonts["body"],
        fontSize=7.7,
        leading=10,
        textColor=TEXT,
        spaceAfter=0,
    )

    page_number = ParagraphStyle(
        "PageNumber",
        parent=body,
        fontName=fonts["body"],
        fontSize=7.5,
        leading=9,
        textColor=MUTED,
        alignment=TA_CENTER,
    )

    return {
        "body": body,
        "h1": h1,
        "h2": h2,
        "h3": h3,
        "quote": quote,
        "list": list_style,
        "table_header": table_header,
        "table_body": table_body,
        "page_number": page_number,
    }


# ============================================================
# SEITENLAYOUT
# ============================================================

class FlipbookDocTemplate(BaseDocTemplate):
    pass


def draw_page(canvas, doc):
    """
    Hintergrund + dezente Seitenzahl.

    Das Flipbook selbst ist cremefarben mit dunkelblauer Schrift
    und roter Akzentfarbe.
    """

    canvas.saveState()

    width, height = A5

    # Seitenhintergrund
    canvas.setFillColor(BG)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)

    # Seitenzahl
    canvas.setFillColor(MUTED)
    canvas.setFont(doc.page_number_font, 7.5)

    canvas.drawCentredString(
        width / 2,
        9 * mm,
        str(canvas.getPageNumber()),
    )

    canvas.restoreState()


def create_document(output_path, fonts):
    width, height = A5

    # Relativ großzügige Buchränder.
    left = 20 * mm
    right = 20 * mm
    top = 18 * mm
    bottom = 17 * mm

    doc = FlipbookDocTemplate(
        str(output_path),
        pagesize=A5,
        leftMargin=left,
        rightMargin=right,
        topMargin=top,
        bottomMargin=bottom,
        title=output_path.stem,
        author="Dr. Maximilian Methodius",
    )

    doc.page_number_font = fonts["body"]

    frame = Frame(
        left,
        bottom,
        width - left - right,
        height - top - bottom,
        id="normal",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )

    template = PageTemplate(
        id="flipbook",
        frames=[frame],
        onPage=draw_page,
    )

    doc.addPageTemplates([template])

    return doc


# ============================================================
# FLOWABLES
# ============================================================

def build_table(header, rows, styles):

    data = []

    data.append([
        Paragraph(inline_markdown(cell), styles["table_header"])
        for cell in header
    ])

    for row in rows:

        # Falls eine Zeile weniger Spalten hat
        # als die Kopfzeile, auffüllen.
        row = list(row)

        while len(row) < len(header):
            row.append("")

        row = row[:len(header)]

        data.append([
            Paragraph(inline_markdown(cell), styles["table_body"])
            for cell in row
        ])

    if not data:
        return Spacer(1, 1)

    available_width = A5[0] - 40 * mm

    col_count = len(header)

    if col_count:
        col_width = available_width / col_count
        col_widths = [col_width] * col_count
    else:
        col_widths = None

    table = Table(
        data,
        colWidths=col_widths,
        repeatRows=1,
        hAlign="LEFT",
    )

    table.setStyle(
        TableStyle([
            ("BACKGROUND", (0, 0), (-1, 0), BG_ALT),
            ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
            ("VALIGN", (0, 0), (-1, -1), "TOP"),
            ("LEFTPADDING", (0, 0), (-1, -1), 5),
            ("RIGHTPADDING", (0, 0), (-1, -1), 5),
            ("TOPPADDING", (0, 0), (-1, -1), 4),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ])
    )

    return table


def build_list(items, ordered, styles):

    flow_items = []

    for item in items:
        flow_items.append(
            ListItem(
                Paragraph(
                    inline_markdown(item),
                    styles["list"],
                ),
                leftIndent=4 * mm,
            )
        )

    return ListFlowable(
        flow_items,
        bulletType="1" if ordered else "bullet",
        start="1" if ordered else None,
        bulletFontName=styles["list"].fontName,
        bulletFontSize=7,
        bulletColor=ACCENT,
        leftIndent=5 * mm,
        bulletOffsetY=2,
        spaceAfter=4 * mm,
    )


def blocks_to_flowables(blocks, styles):

    story = []

    first_heading_seen = False

    for block in blocks:

        kind = block[0]

        # ----------------------------------------------------
        # Überschrift
        # ----------------------------------------------------

        if kind == "heading":

            level = block[1]
            title = inline_markdown(block[2])

            if not first_heading_seen:
                # Der erste Titel ist die große H1.
                first_heading_seen = True

                story.append(
                    Paragraph(title, styles["h1"])
                )

                # Akzentlinie wie im Flipbook:
                story.append(
                    HRFlowable(
                        width=12 * mm,
                        thickness=1.5,
                        color=ACCENT,
                        spaceBefore=0,
                        spaceAfter=7 * mm,
                        hAlign="LEFT",
                    )
                )

            elif level <= 2:
                story.append(
                    Paragraph(title, styles["h2"])
                )

                story.append(
                    HRFlowable(
                        width=8.75 * mm,
                        thickness=1.2,
                        color=ACCENT,
                        spaceBefore=0,
                        spaceAfter=4 * mm,
                        hAlign="LEFT",
                    )
                )

            else:
                story.append(
                    Paragraph(title, styles["h3"])
                )

            continue

        # ----------------------------------------------------
        # Absatz
        # ----------------------------------------------------

        if kind == "paragraph":

            story.append(
                Paragraph(
                    inline_markdown(block[1]),
                    styles["body"],
                )
            )

            continue

        # ----------------------------------------------------
        # Zitat
        # ----------------------------------------------------

        if kind == "quote":

            story.append(
                KeepTogether([
                    Paragraph(
                        inline_markdown(block[1]),
                        styles["quote"],
                    )
                ])
            )

            continue

        # ----------------------------------------------------
        # Liste
        # ----------------------------------------------------

        if kind == "ul":

            story.append(
                build_list(
                    block[1],
                    ordered=False,
                    styles=styles,
                )
            )

            continue

        if kind == "ol":

            story.append(
                build_list(
                    block[1],
                    ordered=True,
                    styles=styles,
                )
            )

            continue

        # ----------------------------------------------------
        # Tabelle
        # ----------------------------------------------------

        if kind == "table":

            story.append(
                Spacer(1, 2 * mm)
            )

            story.append(
                build_table(
                    block[1],
                    block[2],
                    styles,
                )
            )

            story.append(
                Spacer(1, 5 * mm)
            )

            continue

        # ----------------------------------------------------
        # Horizontale Linie
        # ----------------------------------------------------

        if kind == "hr":

            story.append(
                HRFlowable(
                    width=12 * mm,
                    thickness=1.5,
                    color=ACCENT,
                    spaceBefore=4 * mm,
                    spaceAfter=5 * mm,
                    hAlign="LEFT",
                )
            )

            continue

    return story


# ============================================================
# PDF ERZEUGEN
# ============================================================

def create_pdf(md_path: Path, output_path: Path, fonts):

    print(f"  {md_path.name} -> {output_path.name}")

    markdown = md_path.read_text(
        encoding="utf-8"
    )

    blocks = parse_markdown(markdown)

    styles = create_styles(fonts)

    story = blocks_to_flowables(
        blocks,
        styles,
    )

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True,
    )

    doc = create_document(
        output_path,
        fonts,
    )

    doc.build(story)


# ============================================================
# CLI
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "Erzeugt PDF-Ratgeber aus ../md/ratgeber/*.md"
        )
    )

    parser.add_argument(
        "ratgeber",
        nargs="?",
        help=(
            "Name/Slug des Ratgebers ohne .md. "
            "Ohne Angabe werden alle Ratgeber erzeugt."
        ),
    )

    parser.add_argument(
        "--output",
        type=Path,
        default=DEFAULT_OUTPUT_DIR,
        help=(
            "Ausgabeordner für PDFs "
            f"(Standard: {DEFAULT_OUTPUT_DIR})"
        ),
    )

    args = parser.parse_args()

    md_dir = MD_DIR.resolve()
    output_dir = args.output.resolve()

    if not md_dir.exists():
        print(
            f"Fehler: Markdown-Verzeichnis nicht gefunden:\n"
            f"  {md_dir}",
            file=sys.stderr,
        )
        return 1

    fonts = register_fonts()

    print("Verwendete Fonts:")
    print(f"  Body:    {fonts['body']}")
    print(f"  Display: {fonts['display']}")
    print()

    # --------------------------------------------------------
    # Einzelner Ratgeber
    # --------------------------------------------------------

    if args.ratgeber:

        slug = args.ratgeber

        if slug.endswith(".md"):
            slug = slug[:-3]

        md_path = md_dir / f"{slug}.md"

        if not md_path.exists():
            print(
                f"Fehler: Ratgeber nicht gefunden:\n"
                f"  {md_path}",
                file=sys.stderr,
            )
            return 1

        output_path = output_dir / f"{slug}.pdf"

        create_pdf(
            md_path,
            output_path,
            fonts,
        )

        print()
        print(f"Fertig: {output_path}")

        return 0

    # --------------------------------------------------------
    # Alle Ratgeber
    # --------------------------------------------------------

    files = sorted(
        md_dir.glob("*.md")
    )

    if not files:
        print(
            f"Keine Markdown-Dateien gefunden in:\n"
            f"  {md_dir}",
            file=sys.stderr,
        )
        return 1

    print(
        f"{len(files)} Ratgeber gefunden.\n"
    )

    failed = []

    for md_path in files:

        try:
            output_path = output_dir / (
                md_path.stem + ".pdf"
            )

            create_pdf(
                md_path,
                output_path,
                fonts,
            )

        except Exception as exc:
            failed.append(
                (md_path.name, exc)
            )

            print(
                f"  FEHLER: {exc}",
                file=sys.stderr,
            )

    print()

    if failed:
        print(
            f"{len(failed)} Datei(en) konnten nicht "
            f"erzeugt werden:",
            file=sys.stderr,
        )

        for name, error in failed:
            print(
                f"  - {name}: {error}",
                file=sys.stderr,
            )

        return 1

    print(
        f"Fertig. PDFs liegen in:\n"
        f"  {output_dir}"
    )

    return 0


if __name__ == "__main__":
    raise SystemExit(main())