#!/usr/bin/env python3
"""
ratgeber_pdf.py

Erzeugt aus Ratgeber-Markdown-Dateien PDFs im Stil des Flipbooks.

Verwendung:

    python ratgeber_pdf.py mein-ratgeber

oder ohne Argument für ALLE Ratgeber:

    python ratgeber_pdf.py

Erwartete Dateien:

    ../md/ratgeber/mein-ratgeber.md

Ausgabe:

    ../pdf/ratgeber/mein-ratgeber.pdf
"""

from __future__ import annotations

import argparse
import html
import re
import sys
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Flowable,
    Frame,
    HRFlowable,
    KeepTogether,
    PageBreak,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


# ============================================================
# PFADE
# ============================================================

SCRIPT_DIR = Path(__file__).resolve().parent

MD_DIR = (SCRIPT_DIR / "../md/ratgeber").resolve()
PDF_DIR = (SCRIPT_DIR / "../pdf").resolve()


# ============================================================
# DESIGN
# Entsprechend dem aktuellen Flipbook / Homepage-CSS
# ============================================================

COLOR_BG = colors.HexColor("#F5F0E6")
COLOR_TEXT = colors.HexColor("#1B2340")
COLOR_TEXT_MUTED = colors.HexColor("#777777")
COLOR_ACCENT = colors.HexColor("#B5292C")
COLOR_BORDER = colors.HexColor("#D6CDBB")
COLOR_BG_ALT = colors.HexColor("#ECE5D8")

PAGE_WIDTH, PAGE_HEIGHT = A4

MARGIN_LEFT = 23 * mm
MARGIN_RIGHT = 23 * mm
MARGIN_TOP = 25 * mm
MARGIN_BOTTOM = 23 * mm


# ============================================================
# SCHRIFTEN
# ============================================================

def finde_font(dateinamen: list[str]) -> Path | None:
    """
    Sucht eine Schrift zuerst in typischen lokalen Font-Verzeichnissen.
    """

    suchpfade = [
        Path("/usr/share/fonts"),
        Path("/usr/local/share/fonts"),
        Path.home() / ".fonts",
        SCRIPT_DIR / "fonts",
        SCRIPT_DIR / "../fonts",
    ]

    for basis in suchpfade:
        if not basis.exists():
            continue

        for name in dateinamen:
            treffer = list(basis.rglob(name))
            if treffer:
                return treffer[0]

    return None


def registriere_schriften():
    """
    Registriert Inter und Fraunces.

    Die Dateien können z.B. so heißen:

        Inter-Regular.ttf
        Inter-SemiBold.ttf
        Inter-Italic.ttf

        Fraunces-Regular.ttf
        Fraunces-SemiBold.ttf
        Fraunces-Italic.ttf

    Falls die Fonts nicht gefunden werden, verwendet ReportLab
    Helvetica als Fallback.
    """

    fonts = {}

    inter_regular = finde_font([
        "Inter-Regular.ttf",
        "Inter-Regular.otf",
    ])

    inter_semibold = finde_font([
        "Inter-SemiBold.ttf",
        "Inter-SemiBold.otf",
        "Inter-Bold.ttf",
        "Inter-Bold.otf",
    ])

    inter_italic = finde_font([
        "Inter-Italic.ttf",
        "Inter-Italic.otf",
    ])

    fraunces_regular = finde_font([
        "Fraunces-Regular.ttf",
        "Fraunces-Regular.otf",
    ])

    fraunces_semibold = finde_font([
        "Fraunces-SemiBold.ttf",
        "Fraunces-SemiBold.otf",
        "Fraunces-Bold.ttf",
        "Fraunces-Bold.otf",
    ])

    fraunces_italic = finde_font([
        "Fraunces-Italic.ttf",
        "Fraunces-Italic.otf",
    ])

    if inter_regular:
        pdfmetrics.registerFont(TTFont("Inter", str(inter_regular)))
        fonts["body"] = "Inter"
    else:
        fonts["body"] = "Helvetica"
        print(
            "WARNUNG: Inter-Regular nicht gefunden. "
            "Verwende Helvetica.",
            file=sys.stderr,
        )

    if inter_semibold and fonts["body"] == "Inter":
        pdfmetrics.registerFont(TTFont("Inter-SemiBold", str(inter_semibold)))
        fonts["body_bold"] = "Inter-SemiBold"
    else:
        fonts["body_bold"] = "Helvetica-Bold"

    if inter_italic and fonts["body"] == "Inter":
        pdfmetrics.registerFont(TTFont("Inter-Italic", str(inter_italic)))
        fonts["body_italic"] = "Inter-Italic"
    else:
        fonts["body_italic"] = "Helvetica-Oblique"

    if fraunces_regular:
        pdfmetrics.registerFont(
            TTFont("Fraunces", str(fraunces_regular))
        )
        fonts["display"] = "Fraunces"
    else:
        fonts["display"] = "Times-Roman"
        print(
            "WARNUNG: Fraunces-Regular nicht gefunden. "
            "Verwende Times-Roman.",
            file=sys.stderr,
        )

    if fraunces_semibold and fonts["display"] == "Fraunces":
        pdfmetrics.registerFont(
            TTFont("Fraunces-SemiBold", str(fraunces_semibold))
        )
        fonts["display_bold"] = "Fraunces-SemiBold"
    else:
        fonts["display_bold"] = "Times-Bold"

    if fraunces_italic and fonts["display"] == "Fraunces":
        pdfmetrics.registerFont(
            TTFont("Fraunces-Italic", str(fraunces_italic))
        )
        fonts["display_italic"] = "Fraunces-Italic"
    else:
        fonts["display_italic"] = "Times-Italic"

    return fonts


# ============================================================
# MARKDOWN
# ============================================================

def inline_markdown(text: str) -> str:
    """
    Kleine Markdown-Inline-Engine für die im Ratgeber verwendeten
    Konstrukte.

    Unterstützt:

        **fett**
        *kursiv*
        ***fett kursiv***
        `Code`
        [Link](URL)
    """

    text = html.escape(text, quote=False)

    # Code
    text = re.sub(
        r"`([^`]+)`",
        r'<font name="Courier">\1</font>',
        text,
    )

    # Links
    text = re.sub(
        r"\[([^\]]+)\]\((https?://[^)]+)\)",
        r'<link href="\2" color="#B5292C">\1</link>',
        text,
    )

    # Fett + kursiv
    text = re.sub(
        r"\*\*\*([^*]+)\*\*\*",
        r"<b><i>\1</i></b>",
        text,
    )

    # Fett
    text = re.sub(
        r"\*\*([^*]+)\*\*",
        r"<b>\1</b>",
        text,
    )

    # Kursiv
    text = re.sub(
        r"(?<!\*)\*([^*]+)\*(?!\*)",
        r"<i>\1</i>",
        text,
    )

    return text


def split_table_row(line: str) -> list[str]:
    line = line.strip()

    if line.startswith("|"):
        line = line[1:]

    if line.endswith("|"):
        line = line[:-1]

    return [cell.strip() for cell in line.split("|")]


def is_table_separator(line: str) -> bool:
    cells = split_table_row(line)

    if not cells:
        return False

    return all(
        re.fullmatch(r":?-{2,}:?", cell or "")
        for cell in cells
    )


def parse_markdown(markdown: str):
    """
    Wandelt Markdown in eine vereinfachte interne Blockstruktur um.
    """

    lines = markdown.replace("\r\n", "\n").replace("\r", "\n").split("\n")

    blocks = []
    i = 0

    paragraph_lines = []
    list_items = []
    list_type = None

    def flush_paragraph():
        nonlocal paragraph_lines

        if paragraph_lines:
            text = " ".join(
                line.strip()
                for line in paragraph_lines
            ).strip()

            if text:
                blocks.append(("paragraph", text))

            paragraph_lines = []

    def flush_list():
        nonlocal list_items, list_type

        if list_items:
            blocks.append(
                (
                    "list",
                    list_type,
                    list_items[:],
                )
            )

            list_items = []
            list_type = None

    while i < len(lines):
        line = lines[i]
        stripped = line.strip()

        # Leerzeile
        if not stripped:
            flush_paragraph()
            flush_list()
            i += 1
            continue

        # Tabelle
        if (
            stripped.startswith("|")
            and i + 1 < len(lines)
            and is_table_separator(lines[i + 1])
        ):
            flush_paragraph()
            flush_list()

            header = split_table_row(lines[i])
            i += 2

            rows = []

            while (
                i < len(lines)
                and lines[i].strip().startswith("|")
            ):
                rows.append(split_table_row(lines[i]))
                i += 1

            blocks.append(("table", header, rows))
            continue

        # Überschrift
        heading = re.match(r"^(#{1,3})\s+(.+?)\s*$", stripped)

        if heading:
            flush_paragraph()
            flush_list()

            level = len(heading.group(1))
            blocks.append(
                ("heading", level, heading.group(2))
            )

            i += 1
            continue

        # Horizontale Linie
        if re.fullmatch(r"[-*_]{3,}", stripped):
            flush_paragraph()
            flush_list()
            blocks.append(("hr",))
            i += 1
            continue

        # Blockquote
        if stripped.startswith(">"):
            flush_paragraph()
            flush_list()

            quote_lines = []

            while i < len(lines):
                q = lines[i].strip()

                if not q.startswith(">"):
                    break

                q = q[1:].strip()
                quote_lines.append(q)
                i += 1

            blocks.append(
                ("blockquote", " ".join(quote_lines))
            )
            continue

        # Ungeordnete Liste
        unordered = re.match(
            r"^[-*+]\s+(.+)$",
            stripped,
        )

        if unordered:
            flush_paragraph()

            if list_type not in (None, "bullet"):
                flush_list()

            list_type = "bullet"
            list_items.append(unordered.group(1))
            i += 1
            continue

        # Geordnete Liste
        ordered = re.match(
            r"^\d+[.)]\s+(.+)$",
            stripped,
        )

        if ordered:
            flush_paragraph()

            if list_type not in (None, "number"):
                flush_list()

            list_type = "number"
            list_items.append(ordered.group(1))
            i += 1
            continue

        # Normaler Fließtext
        flush_list()
        paragraph_lines.append(stripped)

        i += 1

    flush_paragraph()
    flush_list()

    return blocks


# ============================================================
# REPORTLAB-STYLES
# ============================================================

def create_styles(fonts):
    styles = getSampleStyleSheet()

    body = ParagraphStyle(
        "RatgeberBody",
        parent=styles["Normal"],
        fontName=fonts["body"],
        fontSize=9.7,
        leading=15.0,
        textColor=COLOR_TEXT,
        spaceBefore=0,
        spaceAfter=7,
        alignment=TA_LEFT,
        splitLongWords=True,
    )

    body_bold = ParagraphStyle(
        "RatgeberBodyBold",
        parent=body,
        fontName=fonts["body_bold"],
    )

    h1 = ParagraphStyle(
        "RatgeberH1",
        parent=body,
        fontName=fonts["display_bold"],
        fontSize=18,
        leading=21,
        textColor=COLOR_TEXT,
        spaceBefore=5,
        spaceAfter=10,
        keepWithNext=True,
    )

    h2 = ParagraphStyle(
        "RatgeberH2",
        parent=body,
        fontName=fonts["display_bold"],
        fontSize=14,
        leading=17,
        textColor=COLOR_ACCENT,
        spaceBefore=16,
        spaceAfter=7,
        keepWithNext=True,
    )

    h3 = ParagraphStyle(
        "RatgeberH3",
        parent=body,
        fontName=fonts["display_bold"],
        fontSize=11.5,
        leading=14,
        textColor=COLOR_ACCENT,
        spaceBefore=12,
        spaceAfter=5,
        keepWithNext=True,
    )

    quote = ParagraphStyle(
        "RatgeberQuote",
        parent=body,
        fontName=fonts["display"],
        fontSize=10.5,
        leading=15.5,
        textColor=COLOR_TEXT,
        leftIndent=11,
        rightIndent=5,
        spaceBefore=8,
        spaceAfter=10,
    )

    list_style = ParagraphStyle(
        "RatgeberList",
        parent=body,
        fontName=fonts["body"],
        fontSize=9.2,
        leading=13.5,
        leftIndent=15,
        firstLineIndent=-10,
        spaceAfter=3,
    )

    metadata = ParagraphStyle(
        "RatgeberMetadata",
        parent=body,
        fontName=fonts["body_bold"],
        fontSize=7.5,
        leading=10,
        textColor=COLOR_TEXT_MUTED,
        spaceAfter=3,
        uppercase=True,
    )

    page_number = ParagraphStyle(
        "PageNumber",
        parent=body,
        fontName=fonts["body_italic"],
        fontSize=7.5,
        leading=9,
        textColor=COLOR_TEXT_MUTED,
    )

    return {
        "body": body,
        "body_bold": body_bold,
        "h1": h1,
        "h2": h2,
        "h3": h3,
        "quote": quote,
        "list": list_style,
        "metadata": metadata,
        "page_number": page_number,
    }


# ============================================================
# FLOWABLES
# ============================================================

class QuoteBlock(Flowable):
    """
    Ein ReportLab-Flowable mit linker roter Linie,
    ähnlich dem Flipbook-Blockquote.
    """

    def __init__(self, paragraph, width=2 * mm):
        super().__init__()
        self.paragraph = paragraph
        self.line_width = width
        self.height = 0
        self.width = 0

    def wrap(self, availWidth, availHeight):
        text_width = availWidth - 7 * mm

        w, h = self.paragraph.wrap(
            text_width,
            availHeight,
        )

        self.width = availWidth
        self.height = h + 2 * mm

        return availWidth, self.height

    def draw(self):
        canvas = self.canv

        canvas.saveState()

        canvas.setStrokeColor(COLOR_ACCENT)
        canvas.setLineWidth(self.line_width)

        canvas.line(
            1.5 * mm,
            0,
            1.5 * mm,
            self.height,
        )

        canvas.translate(
            5 * mm,
            1 * mm,
        )

        self.paragraph.drawOn(
            canvas,
            0,
            0,
        )

        canvas.restoreState()


# ============================================================
# MARKDOWN -> FLOWABLES
# ============================================================

def blocks_to_flowables(blocks, styles):
    story = []

    first_heading = True

    for block in blocks:
        kind = block[0]

        if kind == "paragraph":
            text = inline_markdown(block[1])

            story.append(
                Paragraph(
                    text,
                    styles["body"],
                )
            )

        elif kind == "heading":
            level = block[1]
            text = inline_markdown(block[2])

            if level == 1:
                story.append(
                    Paragraph(
                        text,
                        styles["h1"],
                    )
                )

                # Akzentlinie wie im Flipbook
                story.append(
                    HRFlowable(
                        width=12 * mm,
                        thickness=1.5,
                        color=COLOR_ACCENT,
                        spaceBefore=0,
                        spaceAfter=10,
                        hAlign="LEFT",
                    )
                )

                first_heading = False

            elif level == 2:
                story.append(
                    Paragraph(
                        text,
                        styles["h2"],
                    )
                )

            else:
                story.append(
                    Paragraph(
                        text,
                        styles["h3"],
                    )
                )

        elif kind == "blockquote":
            quote = Paragraph(
                inline_markdown(block[1]),
                styles["quote"],
            )

            story.append(
                QuoteBlock(quote)
            )

        elif kind == "hr":
            story.append(
                HRFlowable(
                    width=15 * mm,
                    thickness=1.5,
                    color=COLOR_ACCENT,
                    spaceBefore=8,
                    spaceAfter=10,
                    hAlign="LEFT",
                )
            )

        elif kind == "list":
            list_type = block[1]
            items = block[2]

            for number, item in enumerate(items, 1):
                if list_type == "bullet":
                    prefix = "•"
                else:
                    prefix = f"{number}."

                story.append(
                    Paragraph(
                        f"<b>{prefix}</b>&nbsp;&nbsp;"
                        f"{inline_markdown(item)}",
                        styles["list"],
                    )
                )

            story.append(Spacer(1, 3))

        elif kind == "table":
            header = block[1]
            rows = block[2]

            data = [
                [
                    Paragraph(
                        inline_markdown(cell),
                        ParagraphStyle(
                            "TableHeader",
                            parent=styles["body"],
                            fontName=styles["h3"].fontName,
                            fontSize=8.2,
                            leading=10,
                            textColor=COLOR_TEXT,
                        ),
                    )
                    for cell in header
                ]
            ]

            for row in rows:
                # Spaltenzahl korrigieren
                row = row[:len(header)]

                while len(row) < len(header):
                    row.append("")

                data.append(
                    [
                        Paragraph(
                            inline_markdown(cell),
                            ParagraphStyle(
                                "TableCell",
                                parent=styles["body"],
                                fontSize=7.8,
                                leading=10.5,
                                spaceAfter=0,
                            ),
                        )
                        for cell in row
                    ]
                )

            usable_width = (
                PAGE_WIDTH
                - MARGIN_LEFT
                - MARGIN_RIGHT
            )

            col_width = usable_width / max(len(header), 1)

            table = Table(
                data,
                colWidths=[col_width] * len(header),
                repeatRows=1,
                hAlign="LEFT",
            )

            table.setStyle(
                TableStyle(
                    [
                        (
                            "BACKGROUND",
                            (0, 0),
                            (-1, 0),
                            COLOR_BG_ALT,
                        ),
                        (
                            "GRID",
                            (0, 0),
                            (-1, -1),
                            0.5,
                            COLOR_BORDER,
                        ),
                        (
                            "VALIGN",
                            (0, 0),
                            (-1, -1),
                            "TOP",
                        ),
                        (
                            "LEFTPADDING",
                            (0, 0),
                            (-1, -1),
                            5,
                        ),
                        (
                            "RIGHTPADDING",
                            (0, 0),
                            (-1, -1),
                            5,
                        ),
                        (
                            "TOPPADDING",
                            (0, 0),
                            (-1, -1),
                            4,
                        ),
                        (
                            "BOTTOMPADDING",
                            (0, 0),
                            (-1, -1),
                            4,
                        ),
                    ]
                )
            )

            story.append(
                Spacer(1, 4)
            )
            story.append(table)
            story.append(
                Spacer(1, 8)
            )

    return story


# ============================================================
# PDF-SEITEN
# ============================================================

def draw_page_background(canvas, doc):
    """
    Zeichnet den Buchseiten-Hintergrund und die Seitenzahl.
    """

    canvas.saveState()

    # Buchpapier
    canvas.setFillColor(COLOR_BG)
    canvas.rect(
        0,
        0,
        PAGE_WIDTH,
        PAGE_HEIGHT,
        fill=1,
        stroke=0,
    )

    # Sehr dezente obere Linie
    canvas.setStrokeColor(COLOR_BORDER)
    canvas.setLineWidth(0.5)

    canvas.line(
        MARGIN_LEFT,
        PAGE_HEIGHT - 14 * mm,
        PAGE_WIDTH - MARGIN_RIGHT,
        PAGE_HEIGHT - 14 * mm,
    )

    # Seitenzahl
    canvas.setFillColor(COLOR_TEXT_MUTED)
    canvas.setFont(
        "Helvetica-Oblique",
        7.5,
    )

    page = canvas.getPageNumber()

    if page % 2 == 0:
        x = MARGIN_LEFT
        alignment = "left"
    else:
        x = PAGE_WIDTH - MARGIN_RIGHT
        alignment = "right"

    if alignment == "right":
        canvas.drawRightString(
            x,
            12 * mm,
            str(page),
        )
    else:
        canvas.drawString(
            x,
            12 * mm,
            str(page),
        )

    canvas.restoreState()


# ============================================================
# PDF ERZEUGEN
# ============================================================

def create_pdf(markdown_path: Path, output_path: Path, fonts):
    markdown = markdown_path.read_text(
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

    doc = BaseDocTemplate(
        str(output_path),
        pagesize=A4,
        leftMargin=MARGIN_LEFT,
        rightMargin=MARGIN_RIGHT,
        topMargin=MARGIN_TOP,
        bottomMargin=MARGIN_BOTTOM,
        title=markdown_path.stem,
        author="Dr. Maximilian Methodius",
        subject="Ratgeber",
    )

    frame = Frame(
        MARGIN_LEFT,
        MARGIN_BOTTOM,
        PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT,
        PAGE_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM,
        id="ratgeber",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )

    template = PageTemplate(
        id="Ratgeber",
        frames=[frame],
        onPage=draw_page_background,
    )

    doc.addPageTemplates([template])

    doc.build(story)


# ============================================================
# DATEIEN AUSWÄHLEN
# ============================================================

def finde_ratgeber(name: str | None):
    if not MD_DIR.exists():
        print(
            f"Fehler: Ratgeber-Verzeichnis nicht gefunden:\n"
            f"  {MD_DIR}",
            file=sys.stderr,
        )
        sys.exit(1)

    if name:
        # Erlaubt sowohl:
        #
        #   mein-ratgeber
        #
        # als auch:
        #
        #   mein-ratgeber.md
        #
        if name.lower().endswith(".md"):
            name = name[:-3]

        path = MD_DIR / f"{name}.md"

        if not path.is_file():
            print(
                f"Fehler: Ratgeber nicht gefunden:\n"
                f"  {path}",
                file=sys.stderr,
            )
            sys.exit(1)

        return [path]

    return sorted(
        path
        for path in MD_DIR.glob("*.md")
        if path.is_file()
    )


# ============================================================
# CLI
# ============================================================

def main():
    parser = argparse.ArgumentParser(
        description=(
            "Erzeugt aus Ratgeber-Markdown-Dateien PDFs "
            "im Stil des Flipbooks."
        )
    )

    parser.add_argument(
        "ratgeber",
        nargs="?",
        help=(
            "Slug/Dateiname des Ratgebers ohne .md. "
            "Ohne Angabe werden alle Ratgeber verarbeitet."
        ),
    )

    args = parser.parse_args()

    fonts = registriere_schriften()

    files = finde_ratgeber(
        args.ratgeber
    )

    if not files:
        print(
            f"Keine Markdown-Dateien gefunden in:\n"
            f"  {MD_DIR}",
            file=sys.stderr,
        )
        sys.exit(1)

    print(
        f"Erzeuge {len(files)} PDF(s)...\n"
    )

    for md_path in files:
        output_path = PDF_DIR / f"{md_path.stem}.pdf"

        try:
            create_pdf(
                md_path,
                output_path,
                fonts,
            )

            print(
                f"  ✓ {md_path.name}"
                f" -> {output_path}"
            )

        except Exception as exc:
            print(
                f"  ✗ {md_path.name}: {exc}",
                file=sys.stderr,
            )

    print("\nFertig.")


if __name__ == "__main__":
    main()