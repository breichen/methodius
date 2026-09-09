import argparse
import glob
import os
import random

from PIL import Image, ImageDraw


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
    digits = [9, 7, 8, 3]

    digits += [random.randint(0, 9) for _ in range(8)]

    total = 0

    for i, digit in enumerate(digits):
        total += digit if i % 2 == 0 else digit * 3

    checksum = (10 - (total % 10)) % 10

    digits.append(checksum)

    return "".join(map(str, digits))


def draw_barcode(cover):
    draw = ImageDraw.Draw(cover)

    cover_width, cover_height = cover.size

    box_width = int(cover_width * 0.16)
    box_height = int(box_width * 0.58)

    margin = int(cover_width * 0.035)

    x0 = cover_width - margin - box_width
    y0 = cover_height - margin - box_height

    x1 = x0 + box_width
    y1 = y0 + box_height

    navy = (27, 35, 64)

    draw.rectangle(
        [x0, y0, x1, y1],
        fill="white",
        outline=navy,
        width=2
    )

    isbn = generate_isbn13()

    bars_left = x0 + 14
    bars_right = x1 - 14

    bars_top = y0 + 10
    bars_bottom = y0 + int(box_height * 0.72)

    x = bars_left

    while x < bars_right:

        if random.random() < 0.48:

            bar_width = random.choice(
                [1, 1, 1, 2, 2, 2, 3]
            )

            draw.rectangle(
                [x, bars_top, x + bar_width, bars_bottom],
                fill=navy
            )

        x += random.choice([2, 3, 4])

    isbn_text = (
        f"{isbn[:3]}-"
        f"{isbn[3]}-"
        f"{isbn[4:6]}-"
        f"{isbn[6:11]}-"
        f"{isbn[11:]}"
    )

    draw.text(
        (x0 + 18, bars_bottom + 6),
        isbn_text,
        fill=navy
    )

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