import argparse
import glob
import math
import os

from PIL import Image


TARGET_COLOR = (241, 236, 226)

# Startwert:
# 20 = konservativ
# 25 = meist sinnvoll
# 30 = aggressiver
THRESHOLD = 25


def color_distance(c1, c2):
    return math.sqrt(
        (c1[0] - c2[0]) ** 2 +
        (c1[1] - c2[1]) ** 2 +
        (c1[2] - c2[2]) ** 2
    )


def normalize_background(img):
    img = img.convert("RGB")

    pixels = img.load()

    width, height = img.size

    replaced = 0

    for y in range(height):
        for x in range(width):

            pixel = pixels[x, y]

            if color_distance(pixel, TARGET_COLOR) <= THRESHOLD:
                pixels[x, y] = TARGET_COLOR
                replaced += 1

    return img, replaced


def process_file(path, target_dir):

    filename = os.path.basename(path)

    img = Image.open(path)

    img, replaced = normalize_background(img)

    output_path = os.path.join(
        target_dir,
        filename
    )

    img.save(
        output_path,
        optimize=True,
        compress_level=9
    )

    print(
        f"{filename}: "
        f"{replaced:,} Pixel ersetzt"
    )


def get_all_cover_names(source_dir):
    pattern = os.path.join(source_dir, "*.png")

    return [
        os.path.splitext(os.path.basename(path))[0]
        for path in sorted(glob.glob(pattern))
    ]


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Normalisiert die Hintergrundfarbe eines Covers "
            "(oder aller Cover)."
        )
    )

    parser.add_argument(
        "type",
        choices=["front", "back"],
        help='Cover-Typ: "front" oder "back".'
    )

    parser.add_argument(
        "name",
        nargs="?",
        default="*",
        help=(
            'Name des Covers (ohne .png-Endung). '
            'Ohne Angabe (oder "*") wird der komplette Ordner '
            'verarbeitet.'
        )
    )

    return parser.parse_args()


def main():
    args = parse_args()

    source_dir = f"../pics/ratgeber-{args.type}-raw"
    target_dir = f"../pics/ratgeber-{args.type}-nologo"

    os.makedirs(target_dir, exist_ok=True)

    if args.name == "*":
        cover_names = get_all_cover_names(source_dir)

        if not cover_names:
            print("Keine PNG-Dateien gefunden.")
            return

        files = [
            os.path.join(source_dir, f"{name}.png")
            for name in cover_names
        ]
    else:
        path = os.path.join(source_dir, f"{args.name}.png")

        if not os.path.isfile(path):
            print(f"Datei nicht gefunden: {path}")
            return

        files = [path]

    print(f"{len(files)} Dateien gefunden.\n")

    for path in files:
        process_file(path, target_dir)

    print("\nFertig.")


if __name__ == "__main__":
    main()