from reportlab.lib import colors

ROT = colors.HexColor("#B5292C")

def zeichne_ornament(c, seitenbreite, y):
    """
    Zentriertes Methodius-Ornament.
    """

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