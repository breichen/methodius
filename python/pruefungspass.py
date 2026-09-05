from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib import colors
from reportlab.lib.units import mm

PDF_DATEI = "Methodius_Studien_und_Pruefungspass.pdf"
LOGO_DATEI = "assets/favicon/methodius-512x512-nobg.png"

BLUE = colors.HexColor("#1f2747")


def zeichne_modul(c, form, titel, y_start, prefix):
    c.setFillColor(BLUE)
    c.setFont("Helvetica-Bold", 13)
    c.drawString(20 * mm, y_start, titel)

    y = y_start - 10 * mm

    for i in range(1, 6):
        c.setFont("Helvetica", 11)

        c.drawString(25 * mm, y + 2 * mm, f"{i}.")

        form.textfield(
            name=f"{prefix}_{i}",
            x=32 * mm,
            y=y,
            width=120 * mm,
            height=7 * mm,
            borderStyle="underlined"
        )

        y -= 10 * mm


def main():
    w, h = A4

    c = canvas.Canvas(PDF_DATEI, pagesize=A4)
    form = c.acroForm

    # --------------------------------------------------
    # SEITE 1
    # --------------------------------------------------

    c.drawImage(
        LOGO_DATEI,
        20 * mm,
        h - 32 * mm,
        width=12 * mm,
        height=12 * mm,
        mask="auto"
    )

    c.setFillColor(BLUE)

    c.setFont("Helvetica-Bold", 14)
    c.drawString(
        34 * mm,
        h - 25 * mm,
        "METHODIUS-INSTITUT"
    )

    c.setFont("Helvetica", 10)
    c.drawString(
        34 * mm,
        h - 31 * mm,
        "für angewandte Lebenswissenschaften"
    )

    c.setFont("Helvetica-Bold", 22)
    c.drawCentredString(
        w / 2,
        h - 70 * mm,
        "STUDIEN- UND PRÜFUNGSPASS"
    )

    c.setFont("Helvetica", 12)
    c.drawCentredString(
        w / 2,
        h - 80 * mm,
        "für das Methodius-Studium"
    )

    c.setFont("Helvetica", 11)

    c.drawString(
        25 * mm,
        h - 113 * mm,
        "Name:"
    )

    form.textfield(
        name="name",
        x=40 * mm,
        y=h - 114 * mm,
        width=90 * mm,
        height=8 * mm,
        borderStyle="underlined"
    )

    c.drawString(
        25 * mm,
        h - 180 * mm,
        "Dieser Pass dient der Dokumentation der im Rahmen des Methodius-Studiums"
    )

    c.drawString(
        25 * mm,
        h - 187 * mm,
        "erbrachten Studienleistungen."
    )

    c.showPage()

    # --------------------------------------------------
    # SEITE 2
    # --------------------------------------------------

    zeichne_modul(
        c,
        form,
        "Leben & Selbstoptimierung",
        h - 25 * mm,
        "leben"
    )

    zeichne_modul(
        c,
        form,
        "Alltag & Beruf",
        h - 95 * mm,
        "alltag"
    )

    zeichne_modul(
        c,
        form,
        "Gesellschaft",
        h - 165 * mm,
        "gesellschaft"
    )

    c.showPage()

    # --------------------------------------------------
    # SEITE 3
    # --------------------------------------------------

    zeichne_modul(
        c,
        form,
        "Wissen & Technik",
        h - 25 * mm,
        "wissen"
    )

    zeichne_modul(
        c,
        form,
        "Medien",
        h - 95 * mm,
        "medien"
    )

    zeichne_modul(
        c,
        form,
        "Kunst & Kultur",
        h - 165 * mm,
        "kultur"
    )

    c.showPage()

    # --------------------------------------------------
    # SEITE 4
    # --------------------------------------------------

    c.setFillColor(BLUE)

    c.setFont("Helvetica-Bold", 18)

    c.drawCentredString(
        w / 2,
        h - 35 * mm,
        "ANTRAG AUF VERLEIHUNG DES GRADES"
    )

    c.setFont("Helvetica-Bold", 12)

    c.drawCentredString(
        w / 2,
        h - 50 * mm,
        "Magister der angewandten Lebenswissenschaften"
    )

    c.setFont("Helvetica-Oblique", 11)

    c.drawCentredString(
        w / 2,
        h - 58 * mm,
        "(Mag. rer. vit.)"
    )

    c.setFont("Helvetica", 11)

    c.drawString(
        25 * mm,
        h - 92 * mm,
        "Anzahl eingereichter Zertifikate:"
    )

    form.textfield(
        name="anzahl_zertifikate",
        x=95 * mm,
        y=h - 94 * mm,
        width=20 * mm,
        height=8 * mm
    )

    c.drawString(
        25 * mm,
        h - 125 * mm,
        "Vom Institut auszufüllen"
    )

    punkte = [
        "Antrag angenommen",
        "Antrag vertagt",
        "Antrag wissenschaftlich diskutiert",
        "Antrag versehentlich abgeheftet"
    ]

    for idx, text in enumerate(punkte):

        y = h - (140 + idx * 12) * mm

        c.rect(
            30 * mm,
            y,
            4 * mm,
            4 * mm
        )

        c.drawString(
            38 * mm,
            y + 1 * mm,
            text
        )

    c.setFont("Helvetica", 10)

    c.drawCentredString(
        w / 2,
        20 * mm,
        "Die Unterlagen sind zusammen mit den Zertifikaten an service@dr-methodius.com zu übermitteln."
    )

    c.save()


if __name__ == "__main__":
    main()