#!/usr/bin/env python3

import sys
import random
import os
import re

from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm


# ==================================================
# KONFIGURATION
# ==================================================

LOGO_DATEI = "assets/favicon/methodius-512x512-nobg.png"

BLAU = colors.HexColor("#1f2747")
ROT = colors.HexColor("#B5292C")
BEIGE = colors.HexColor("#f7f4ec")


# ==================================================
# ORNAMENT
# ==================================================

def zeichne_ornament(c, seitenbreite, y):

    mitte_x = seitenbreite / 2

    linienlaenge = 40
    diamant = 10

    c.setStrokeColor(ROT)
    c.setLineWidth(1.5)

    # linke Linie
    c.line(
        mitte_x - diamant - 10 - linienlaenge,
        y,
        mitte_x - diamant - 10,
        y
    )

    # rechte Linie
    c.line(
        mitte_x + diamant + 10,
        y,
        mitte_x + diamant + 10 + linienlaenge,
        y
    )

    # Diamant
    c.saveState()

    c.translate(mitte_x, y)
    c.rotate(45)

    c.setFillColor(ROT)

    c.rect(
        -diamant / 2,
        -diamant / 2,
        diamant,
        diamant,
        fill=1,
        stroke=0
    )

    c.restoreState()


# ==================================================
# URKUNDE ERZEUGEN
# ==================================================

def dateiname_sicher(text):

    text = (
        text
        .replace("ä", "ae")
        .replace("ö", "oe")
        .replace("ü", "ue")
        .replace("Ä", "Ae")
        .replace("Ö", "Oe")
        .replace("Ü", "Ue")
        .replace("ß", "ss")
    )

    text = re.sub(
        r"[^A-Za-z0-9_-]",
        "_",
        text
    )

    return text

def generiere_urkunde(name):

    urkundennummer = f"MRV-{random.randint(100000, 999999)}"

    os.makedirs(
        "out/urkunden",
        exist_ok=True
    )

    dateiname = (
        f"out/urkunden/"
        f"urkunde_{urkundennummer}_"
        f"{dateiname_sicher(name)}.pdf"
    )

    w, h = A4

    c = canvas.Canvas(
        dateiname,
        pagesize=A4
    )

    # --------------------------------------------------
    # Hintergrund
    # --------------------------------------------------

    c.setFillColor(BEIGE)

    c.rect(
        0,
        0,
        w,
        h,
        fill=1,
        stroke=0
    )

    # --------------------------------------------------
    # Rahmen
    # --------------------------------------------------

    c.setStrokeColor(ROT)
    c.setLineWidth(4)

    c.rect(
        15 * mm,
        15 * mm,
        w - 30 * mm,
        h - 30 * mm
    )

    # --------------------------------------------------
    # Logo
    # --------------------------------------------------

    c.drawImage(
        LOGO_DATEI,
        w / 2 - 15 * mm,
        h - 55 * mm,
        width=30 * mm,
        height=30 * mm,
        mask="auto"
    )

    # --------------------------------------------------
    # Institut
    # --------------------------------------------------

    c.setFillColor(BLAU)

    c.setFont(
        "Helvetica-Bold",
        16
    )

    c.drawCentredString(
        w / 2,
        h - 65 * mm,
        "METHODIUS-INSTITUT"
    )

    c.setFont(
        "Helvetica",
        10
    )

    c.drawCentredString(
        w / 2,
        h - 72 * mm,
        "für angewandte Lebenswissenschaften"
    )

    # --------------------------------------------------
    # Titel
    # --------------------------------------------------

    c.setFillColor(ROT)

    c.setFont(
        "Helvetica-Bold",
        28
    )

    c.drawCentredString(
        w / 2,
        h - 100 * mm,
        "URKUNDE"
    )

    # --------------------------------------------------
    # Text
    # --------------------------------------------------

    c.setFillColor(BLAU)

    c.setFont(
        "Helvetica",
        12
    )

    c.drawCentredString(
        w / 2,
        h - 120 * mm,
        "Hiermit wird bestätigt, dass"
    )

    # --------------------------------------------------
    # Name
    # --------------------------------------------------

    c.setFont(
        "Helvetica-Bold",
        24
    )

    c.drawCentredString(
        w / 2,
        h - 145 * mm,
        name
    )

    c.setFont(
        "Helvetica",
        12
    )

    c.drawCentredString(
        w / 2,
        h - 165 * mm,
        "nach Erfüllung sämtlicher Anforderungen des Methodius-Studiums"
    )

    c.drawCentredString(
        w / 2,
        h - 172 * mm,
        "der akademische Grad"
    )

    # --------------------------------------------------
    # Grad
    # --------------------------------------------------

    c.setFont(
        "Helvetica-Bold",
        18
    )

    c.drawCentredString(
        w / 2,
        h - 195 * mm,
        "Magister der angewandten Lebenswissenschaften"
    )

    c.setFont(
        "Helvetica-Oblique",
        14
    )

    c.drawCentredString(
        w / 2,
        h - 203 * mm,
        "(Mag. rer. vit.)"
    )

    c.setFont(
        "Helvetica",
        12
    )

    c.drawCentredString(
        w / 2,
        h - 220 * mm,
        "verliehen wird."
    )

    # --------------------------------------------------
    # Urkundennummer
    # --------------------------------------------------

    c.setFont(
        "Helvetica",
        9
    )

    c.drawCentredString(
        w / 2,
        h - 230 * mm,
        f"Urkundennummer: {urkundennummer}"
    )

    # --------------------------------------------------
    # Signatur
    # --------------------------------------------------

    c.setFont(
        "Helvetica",
        11
    )

    # Signatur

    c.drawCentredString(
        w / 2,
        h - 250 * mm,
        "Dr. Maximilien Methodius"
    )

    c.drawCentredString(
        w / 2,
        h - 256 * mm,
        "Institutsleiter"
    )

    # --------------------------------------------------
    # Ornament
    # --------------------------------------------------

    zeichne_ornament(
        c,
        w,
        55 * mm
    )

    # --------------------------------------------------
    # Hinweis
    # --------------------------------------------------

    c.setFillColor(colors.HexColor("#666666"))

    c.setFont(
        "Helvetica",
        8
    )

    c.drawCentredString(
        w / 2,
        25 * mm,
        "Der verliehene Grad ist weder staatlich anerkannt noch von erkennbarem praktischem Nutzen."
    )

    c.drawCentredString(
        w / 2,
        21 * mm,
        "Sein ideeller Wert wird vom Institut jedoch als außerordentlich hoch eingeschätzt."
    )

    c.save()

    print(f"Urkunde erstellt: {dateiname}")
    print(f"Urkundennummer: {urkundennummer}")


# ==================================================
# MAIN
# ==================================================

if __name__ == "__main__":

    if len(sys.argv) != 2:
        print('Verwendung: python urkunde.py "Max Mustermann"')
        sys.exit(1)

    generiere_urkunde(sys.argv[1])