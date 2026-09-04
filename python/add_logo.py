import argparse
import glob
import os

from PIL import Image, ImageDraw


def add_corner_area(cover, area, color=(0xE7, 0xE0, 0xD2, 255), crease_color=(199, 190, 172, 255)):
    """
    Zeichnet eine "Logofläche" als umgeknickte Ecke links unten,
    wie im Beispielcover (schräg abgeschnittenes Dreieck).

    area: Größe der Fläche als Anteil der Coverbreite (z.B. 0.12 = 12 %)
    """
    cover_width, cover_height = cover.size
    flap_size = int(cover_width * area)

    if flap_size <= 0:
        return cover

    overlay = Image.new("RGBA", cover.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    # Dreieck: untere linke Ecke des Covers, mit schräger Kante nach oben rechts
    p1 = (0, cover_height - flap_size)
    p2 = (0, cover_height)
    p3 = (flap_size, cover_height)

    draw.polygon([p1, p2, p3], fill=color)

    # dezente Knick-Linie entlang der schrägen Kante
    draw.line([p1, p3], fill=crease_color, width=max(1, int(flap_size * 0.015)))

    cover.alpha_composite(overlay)
    return cover


def add_logo(
    cover_name,
    cover_type="front",  # "front" oder "back"
    area=None            # Anteil der Coverbreite für die Logofläche links unten (optional)
):
    """
    cover_type:
        front -> Logo oben zwischen den roten Linien
        back  -> Logo unten oberhalb des Barcodes

    area:
        Wenn gesetzt (z.B. 0.12), wird zusätzlich links unten eine
        Logofläche (umgeknickte Ecke) platziert, wie im Beispielcover.
    """

    cover_path = f"../pics/ratgeber-{cover_type}-nologo/{cover_name}.png"
    output_path = f"../pics/ratgeber-{cover_type}/{cover_name}.png"
    logo_path = "../assets/favicon/methodius-512x512-nobg.png"

    cover = Image.open(cover_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")

    cover_width, cover_height = cover.size

    # ---------------------------------
    # Logofläche links unten (optional)
    # ---------------------------------

    if area is not None:
        cover = add_corner_area(cover, area)

    # ---------------------------------
    # Logo-Größe
    # ---------------------------------

    if cover_type.lower() == "front":
        # ca. 5 % der Coverbreite
        target_logo_width = int(cover_width * 0.05)
        target_logo_width = int(cover_width * 0.07)
    else:
        target_logo_width = int(cover_width * 0.1)

    scale_factor = target_logo_width / logo.width

    logo = logo.resize(
        (
            int(logo.width * scale_factor),
            int(logo.height * scale_factor)
        ),
        Image.LANCZOS
    )

    # ---------------------------------
    # Horizontale Position
    # ---------------------------------

    if cover_type.lower() == "front":
        x = (cover_width - logo.width) // 2
        x = int(cover_width * 0.04)
    else:
        x = int(cover_width * 0.92) - logo.width
        x = int(cover_width * 0.11)

    # ---------------------------------
    # Vertikale Position
    # ---------------------------------

    if cover_type.lower() == "front":

        # kleines Logo oben zwischen den roten Linien
        y = int(cover_height * 0.03)
        y = int(cover_height * 0.93)

    elif cover_type.lower() == "back":

        # Logo unter dem Slogan,
        # aber oberhalb des Barcodes
        y = int(cover_height * 0.8)
        y = int(cover_height * 0.89)

    else:
        raise ValueError(
            "cover_type muss 'front' oder 'back' sein"
        )

    # ---------------------------------
    # Logo einfügen
    # ---------------------------------

    cover.alpha_composite(logo, (x, y))

    # ---------------------------------
    # Speichern
    # ---------------------------------

    cover.save(output_path)

    print(f"Gespeichert: {output_path}")


def get_all_cover_names(source_dir="../pics/ratgeber-front-nologo"):
    """
    Liefert alle Cover-Namen (ohne .png-Endung) aus dem
    Quellordner zurück.
    """
    pattern = os.path.join(source_dir, "*.png")
    return [
        os.path.splitext(os.path.basename(path))[0]
        for path in sorted(glob.glob(pattern))
    ]


def parse_args():
    parser = argparse.ArgumentParser(
        description="Fügt einem Cover (oder allen Covern) ein Logo hinzu."
    )
    parser.add_argument(
        "name",
        help='Name des Covers (ohne .png-Endung). "*" verarbeitet den kompletten Ordner.'
    )
    parser.add_argument(
        "type",
        choices=["front", "back"],
        help='Cover-Typ: "front" oder "back".'
    )
    parser.add_argument(
        "--area",
        type=float,
        default=None,
        help='Anteil der Coverbreite (z.B. 0.12) für eine Logofläche links unten. '
             'Wenn nicht gesetzt, wird keine Fläche gezeichnet.'
    )
    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if args.name == "*":
        cover_names = get_all_cover_names()

        if not cover_names:
            print("Keine Cover im Quellordner gefunden.")

        for cover_name in cover_names:
            add_logo(
                cover_name=cover_name,
                cover_type=args.type,
                area=args.area
            )
    else:
        add_logo(
            cover_name=args.name,
            cover_type=args.type,
            area=args.area
        )