import argparse
import glob
import os
import random

from PIL import Image, ImageDraw
from tempfile import NamedTemporaryFile
from barcode import EAN13
from barcode.writer import ImageWriter

used_isbns = set()


def add_corner_area(
    cover,
    area,
    color=(0xE7, 0xE0, 0xD2, 255),
    crease_color=(199, 190, 172, 255)
):
    cover_width, cover_height = cover.size
    flap_size = int(cover_width * area)

    if flap_size <= 0:
        return cover

    overlay = Image.new("RGBA", cover.size, (0, 0, 0, 0))
    draw = ImageDraw.Draw(overlay)

    p1 = (0, cover_height - flap_size)
    p2 = (0, cover_height)
    p3 = (flap_size, cover_height)

    draw.polygon([p1, p2, p3], fill=color)

    draw.line(
        [p1, p3],
        fill=crease_color,
        width=max(1, int(flap_size * 0.015))
    )

    cover.alpha_composite(overlay)
    return cover


def generate_isbn13():
    while True:
        digits = [9, 7, 8, 3]

        digits += [random.randint(0, 9) for _ in range(8)]

        total = 0

        for i, digit in enumerate(digits):
            total += digit if i % 2 == 0 else digit * 3

        checksum = (10 - (total % 10)) % 10

        isbn = "".join(map(str, digits)) + str(checksum)

        if isbn not in used_isbns:
            used_isbns.add(isbn)
            return isbn


def draw_barcode(cover):

    isbn = generate_isbn13()

    with NamedTemporaryFile(suffix=".png", delete=False) as tmp:

        barcode = EAN13(
            isbn[:-1],
            writer=ImageWriter()
        )

        barcode.save(
            tmp.name[:-4],
            options={
                "module_width": 0.26,
                "module_height": 12,
                "quiet_zone": 3.5,
                "font_size": 9,
                "text_distance": 4,
                "write_text": True,
                "dpi": 300,
            }
        )

        barcode_path = tmp.name

    barcode_img = Image.open(barcode_path).convert("RGBA")

    padding_x = 2
    padding_top = 6
    padding_bottom = 0

    BARCODE_SCALE = 0.45
    
    barcode_img = barcode_img.resize(
        (
            int(barcode_img.width * BARCODE_SCALE),
            int(barcode_img.height * BARCODE_SCALE)
        ),
        Image.LANCZOS
    )
    
    box_width = barcode_img.width + padding_x * 2
    box_height = barcode_img.height + padding_top + padding_bottom

    barcode_box = Image.new(
        "RGBA",
        (box_width, box_height),
        (255, 255, 255, 255)
    )
    
    barcode_box.alpha_composite(
        barcode_img,
        (padding_x, padding_top)
    )

    draw = ImageDraw.Draw(barcode_box)

    draw.rectangle(
        [0, 0, box_width - 1, box_height - 1],
        outline=(27, 35, 64),
        width=2
    )

    cover_width, cover_height = cover.size

    margin_right = 55
    margin_bottom = 55

    x = cover_width - margin_right - box_width
    y = cover_height - margin_bottom - box_height

    cover.alpha_composite(
        barcode_box,
        (x, y)
    )

    try:
        os.remove(barcode_path)
    except OSError:
        pass

    return cover


def add_logo(
    cover_name,
    cover_type="front",
    area=None,
    no_barcode=False
):
    if cover_type.lower() == "back" and no_barcode:
        cover_path = (
            f"../pics/ratgeber-{cover_type}-nologo-barcode/"
            f"{cover_name}.png"
        )
    else:
        cover_path = (
            f"../pics/ratgeber-{cover_type}-nologo/"
            f"{cover_name}.png"
        )

    output_path = f"../pics/ratgeber-{cover_type}/{cover_name}.png"

    logo_path = "../assets/favicon/methodius-512x512-nobg.png"

    cover = Image.open(cover_path).convert("RGBA")
    logo = Image.open(logo_path).convert("RGBA")

    if cover_type.lower() == "back" and not no_barcode:
        cover = draw_barcode(cover)

    cover_width, cover_height = cover.size

    if area is not None:
        cover = add_corner_area(cover, area)

    if cover_type.lower() == "front":
        target_logo_width = int(cover_width * 0.07)
    else:
        target_logo_width = int(cover_width * 0.10)

    scale_factor = target_logo_width / logo.width

    logo = logo.resize(
        (
            int(logo.width * scale_factor),
            int(logo.height * scale_factor)
        ),
        Image.LANCZOS
    )

    if cover_type.lower() == "front":
        x = int(cover_width * 0.04)
    else:
        x = int(cover_width * 0.11)

    if cover_type.lower() == "front":
        y = int(cover_height * 0.93)

    elif cover_type.lower() == "back":
        y = int(cover_height * 0.89)

    else:
        raise ValueError(
            "cover_type muss 'front' oder 'back' sein"
        )

    cover.alpha_composite(logo, (x, y))

    cover.save(output_path)

    print(f"Gespeichert: {output_path}")


def get_all_cover_names(typ, no_barcode=False):
    if typ == "back" and no_barcode:
        source_dir = "../pics/ratgeber-back-nologo-barcode"
    else:
        source_dir = f"../pics/ratgeber-{typ}-nologo"

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
        help=(
            'Name des Covers (ohne .png-Endung). '
            '"*" verarbeitet den kompletten Ordner.'
        )
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
        help=(
            "Anteil der Coverbreite "
            "(z.B. 0.12) für eine Logofläche links unten."
        )
    )

    parser.add_argument(
        "--no-barcode",
        action="store_true",
        help=(
            "Nur für Back-Cover: "
            "kein Barcode zeichnen und Bilder aus "
            "ratgeber-back-nologo-barcode verwenden."
        )
    )

    return parser.parse_args()


if __name__ == "__main__":
    args = parse_args()

    if args.name == "*":

        cover_names = get_all_cover_names(
            args.type,
            args.no_barcode
        )

        if not cover_names:
            print("Keine Cover im Quellordner gefunden.")

        for cover_name in cover_names:

            add_logo(
                cover_name=cover_name,
                cover_type=args.type,
                area=args.area,
                no_barcode=args.no_barcode
            )

    else:

        add_logo(
            cover_name=args.name,
            cover_type=args.type,
            area=args.area,
            no_barcode=args.no_barcode
        )