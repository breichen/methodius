#!/usr/bin/env python3
"""
Urkunde "Studierende Person des Monats" des Methodius-Instituts.

Verwendung (aus dem Projekt-Root oder aus python/):

    python python/urkunde_studierende.py "Max Mustermann"
    python python/urkunde_studierende.py "Max Mustermann" --monat 2026-10
    python python/urkunde_studierende.py "Max Mustermann" \
        --grund "für die konsequente Verweigerung jeglicher Lernziele"

Optionen:
    --monat     Monat der Auszeichnung als YYYY-MM (Standard: aktueller Monat)
    --grund     Optional: eigene Begründung statt des Standardtexts
                (wird automatisch umbrochen, am besten 1-2 Zeilen lang)

Benötigt: pip install reportlab
"""

import argparse
import os
import random
import re
import sys
from datetime import date
from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.pagesizes import A4
from reportlab.lib.units import mm
from reportlab.lib.utils import ImageReader, simpleSplit
from reportlab.pdfbase.pdfmetrics import stringWidth
from reportlab.pdfgen import canvas


# ==================================================
# KONFIGURATION
# ==================================================

# Projekt-Root = eine Ebene über diesem Skript (python/urkunde_studierende.py -> Root)
PROJECT_ROOT = Path(__file__).resolve().parent.parent

LOGO_DATEI = PROJECT_ROOT / "assets" / "favicon" / "methodius-512x512-nobg.png"
SIGNATUR_DATEI = PROJECT_ROOT / "assets" / "signatur" / "methodius-signatur.png"
AUSGABE_ORDNER = PROJECT_ROOT / "out" / "urkunden"

BLAU = colors.HexColor("#1f2747")
ROT = colors.HexColor("#B5292C")
BEIGE = colors.HexColor("#f7f4ec")
GRAU = colors.HexColor("#666666")

ORT = "Neu-Korrelationsburg"
UNTERZEICHNER = "Dr. Maximilian Methodius, Institutsleiter"

STANDARD_GRUND = (
    "für bemerkenswerte Leistungen im Methodius-Studium, "
    "die das Institut in dieser Form nicht vorgesehen hatte,"
)

MONATSNAMEN = [
    "Januar", "Februar", "März", "April", "Mai", "Juni",
    "Juli", "August", "September", "Oktober", "November", "Dezember",
]


# ==================================================
# HILFSFUNKTIONEN
# ==================================================

def dateiname_sicher(text):

    text = (
        text
        .replace("ä", "ae").replace("ö", "oe").replace("ü", "ue")
        .replace("Ä", "Ae").replace("Ö", "Oe").replace("Ü", "Ue")
        .replace("ß", "ss")
    )

    return re.sub(r"[^A-Za-z0-9_-]", "_", text)


def monat_jahr(iso_monat):
    """'2026-10' -> 'Oktober 2026'"""

    teile = iso_monat.split("-")

    if len(teile) < 2 or not teile[0].isdigit() or not teile[1].isdigit():
        raise ValueError(f"Ungültiger Monat: {iso_monat!r} (erwartet: YYYY-MM)")

    monat = int(teile[1])

    if not 1 <= monat <= 12:
        raise ValueError(f"Ungültiger Monat: {iso_monat!r} (erwartet: YYYY-MM)")

    return f"{MONATSNAMEN[monat - 1]} {teile[0]}"


def datum_deutsch(tag):
    return f"{tag.day}. {MONATSNAMEN[tag.month - 1]} {tag.year}"


def passende_schriftgroesse(text, schrift, start, minimum, max_breite):
    """Verkleinert die Schrift, bis der Text in max_breite passt."""

    groesse = start

    while groesse > minimum and stringWidth(text, schrift, groesse) > max_breite:
        groesse -= 0.5

    return groesse


def zeichne_bild(c, pfad, x, y, breite, hoehe=None):
    """
    Zeichnet ein Bild, wenn die Datei existiert. Wird keine Höhe angegeben,
    ergibt sie sich aus dem Seitenverhältnis des Bildes.
    Gibt False zurück (und warnt), wenn die Datei fehlt.
    """

    if not Path(pfad).exists():
        print(f"Warnung: Bild nicht gefunden, wird übersprungen: {pfad}", file=sys.stderr)
        return False

    if hoehe is None:
        orig_b, orig_h = ImageReader(str(pfad)).getSize()
        hoehe = breite * orig_h / orig_b

    c.drawImage(str(pfad), x, y, width=breite, height=hoehe, mask="auto")

    return True


def zeichne_ornament(c, seitenbreite, y):

    mitte_x = seitenbreite / 2
    linienlaenge = 40
    diamant = 10

    c.setStrokeColor(ROT)
    c.setLineWidth(1.5)

    c.line(mitte_x - diamant - 10 - linienlaenge, y, mitte_x - diamant - 10, y)
    c.line(mitte_x + diamant + 10, y, mitte_x + diamant + 10 + linienlaenge, y)

    c.saveState()
    c.translate(mitte_x, y)
    c.rotate(45)
    c.setFillColor(ROT)
    c.rect(-diamant / 2, -diamant / 2, diamant, diamant, fill=1, stroke=0)
    c.restoreState()


# ==================================================
# URKUNDE ERZEUGEN
# ==================================================

def generiere_urkunde(name, monat, grund=None):

    urkundennummer = f"SDM-{random.randint(100000, 999999)}"

    os.makedirs(AUSGABE_ORDNER, exist_ok=True)

    dateiname = (
        AUSGABE_ORDNER
        / f"urkunde_studierende_{urkundennummer}_{dateiname_sicher(name)}.pdf"
    )

    w, h = A4
    text_breite = w - 60 * mm   # nutzbare Breite innerhalb des Rahmens

    c = canvas.Canvas(str(dateiname), pagesize=A4)
    c.setTitle(f"Urkunde Studierende Person des Monats – {name}")
    c.setAuthor("Methodius-Institut für angewandte Lebenswissenschaften")

    # --------------------------------------------------
    # Hintergrund und Rahmen
    # --------------------------------------------------

    c.setFillColor(BEIGE)
    c.rect(0, 0, w, h, fill=1, stroke=0)

    c.setStrokeColor(ROT)
    c.setLineWidth(4)
    c.rect(15 * mm, 15 * mm, w - 30 * mm, h - 30 * mm)

    # --------------------------------------------------
    # Logo und Institut
    # --------------------------------------------------

    zeichne_bild(c, LOGO_DATEI, w / 2 - 15 * mm, h - 55 * mm, 30 * mm, 30 * mm)

    c.setFillColor(BLAU)
    c.setFont("Helvetica-Bold", 16)
    c.drawCentredString(w / 2, h - 65 * mm, "METHODIUS-INSTITUT")

    c.setFont("Helvetica", 10)
    c.drawCentredString(w / 2, h - 72 * mm, "für angewandte Lebenswissenschaften")

    # --------------------------------------------------
    # Titel
    # --------------------------------------------------

    c.setFillColor(ROT)
    c.setFont("Helvetica-Bold", 28)
    c.drawCentredString(w / 2, h - 97 * mm, "URKUNDE")

    zeichne_ornament(c, w, h - 105 * mm)

    # --------------------------------------------------
    # Einleitung und Name
    # --------------------------------------------------

    c.setFillColor(BLAU)
    c.setFont("Helvetica", 12)
    c.drawCentredString(w / 2, h - 120 * mm, "Hiermit wird bestätigt, dass")

    # Lange Namen werden automatisch verkleinert, damit sie in den Rahmen passen.
    namens_groesse = passende_schriftgroesse(
        name, "Helvetica-Bold", 24, 12, text_breite
    )

    c.setFont("Helvetica-Bold", namens_groesse)
    c.drawCentredString(w / 2, h - 135 * mm, name)

    # --------------------------------------------------
    # Begründung (automatisch umbrochen)
    # --------------------------------------------------

    grund_text = (grund or STANDARD_GRUND).strip()

    if not grund_text.endswith(","):
        grund_text += ","

    y = 150 * mm

    c.setFont("Helvetica", 12)

    for zeile in simpleSplit(grund_text, "Helvetica", 12, text_breite):
        c.drawCentredString(w / 2, h - y, zeile)
        y += 6.5 * mm

    c.drawCentredString(w / 2, h - y, "vom Methodius-Institut ausgezeichnet wird als")

    # --------------------------------------------------
    # Auszeichnung
    # --------------------------------------------------

    y += 15 * mm

    c.setFont("Helvetica-Bold", 20)
    c.drawCentredString(w / 2, h - y, "Studierende Person des Monats")

    y += 9 * mm

    c.setFont("Helvetica-Oblique", 14)
    c.drawCentredString(w / 2, h - y, f"({monat_jahr(monat)})")

    # --------------------------------------------------
    # Urkundennummer
    # --------------------------------------------------

    y += 16 * mm

    c.setFont("Helvetica", 9)
    c.drawCentredString(w / 2, h - y, f"Urkundennummer: {urkundennummer}")

    # --------------------------------------------------
    # Ort, Datum und Signatur (feste Position am unteren Rand)
    # --------------------------------------------------

    c.setFont("Helvetica", 10)
    c.drawCentredString(
        w / 2, h - 236 * mm, f"{ORT}, den {datum_deutsch(date.today())}"
    )

    signatur_breite = 60 * mm
    zeichne_bild(c, SIGNATUR_DATEI, w / 2 - 30 * mm, h - 253 * mm, signatur_breite)

    c.setFont("Helvetica", 11)
    c.drawCentredString(w / 2, h - 262 * mm, UNTERZEICHNER)

    # --------------------------------------------------
    # Hinweis
    # --------------------------------------------------

    c.setFillColor(GRAU)
    c.setFont("Helvetica", 8)

    c.drawCentredString(
        w / 2, 25 * mm,
        "Die Auszeichnung ist weder mit einem Preisgeld noch mit einem erkennbaren Vorteil verbunden."
    )
    c.drawCentredString(
        w / 2, 21 * mm,
        "Das Institut hält sie dennoch für außerordentlich verdient."
    )

    c.save()

    print(f"Urkunde erstellt: {dateiname}")
    print(f"Urkundennummer: {urkundennummer}")

    return dateiname


# ==================================================
# MAIN
# ==================================================

def main():

    parser = argparse.ArgumentParser(
        description='Erzeugt eine Urkunde "Studierende Person des Monats".'
    )
    parser.add_argument("name", help='Name, z.B. "Max Mustermann"')
    parser.add_argument(
        "--monat",
        default=date.today().strftime("%Y-%m"),
        help="Monat der Auszeichnung als YYYY-MM (Standard: aktueller Monat)",
    )
    parser.add_argument("--grund", help="Optional: eigene Begründung")

    args = parser.parse_args()

    try:
        monat_jahr(args.monat)  # früh prüfen, bevor etwas erzeugt wird
    except ValueError as fehler:
        parser.error(str(fehler))

    generiere_urkunde(args.name, args.monat, args.grund)


if __name__ == "__main__":
    main()