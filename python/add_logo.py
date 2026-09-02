import argparse
import glob
import os

from PIL import Image


def add_logo(
    cover_name,
    cover_type="front"  # "front" oder "back"
):
    """
    cover_type:
        front -> Logo oben zwischen den roten Linien
        back  -> Logo unten oberhalb des Barcodes
    """

    cover_path = f"../pics/ratgeber-{cover_type}-nologo/{cover_name}.png"
    output_path = f"../pics/ratgeber-{cover_type}/{cover_name}.png"
    logo_path = "../assets/favicon/methodius-512x512-nobg.png"

    cover = Image.open(cover_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")

    cover_width, cover_height = cover.size

    # ---------------------------------
    # Logo-Größe
    # ---------------------------------

    if cover_type.lower() == "front":
        # ca. 5 % der Coverbreite
        target_logo_width = int(cover_width * 0.05)
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
    else:
        x = int(cover_width * 0.92) - logo.width

    # ---------------------------------
    # Vertikale Position
    # ---------------------------------

    if cover_type.lower() == "front":

        # kleines Logo oben zwischen den roten Linien
        y = int(cover_height * 0.03)

    elif cover_type.lower() == "back":

        # Logo unter dem Slogan,
        # aber oberhalb des Barcodes
        y = int(cover_height * 0.8)

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
                cover_type=args.type
            )
    else:
        add_logo(
            cover_name=args.name,
            cover_type=args.type
        )