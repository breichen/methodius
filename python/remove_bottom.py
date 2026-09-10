import argparse
import glob
import os
from statistics import median

from PIL import Image, ImageDraw


# Standardhöhe des zu entfernenden Streifens, je nach Cover-Typ.
# Passe diese Werte nach Bedarf an.
DEFAULT_HEIGHT_FRONT = 150
DEFAULT_HEIGHT_BACK = 150


def detect_background_color(img):
    """
    Bestimmt die Hintergrundfarbe aus einer freien Fläche links unten.
    Verwendet den Median statt des Durchschnitts, um robuster gegen
    Artefakte zu sein.
    """

    width, height = img.size

    sample_size = 80

    sample_x = int(width * 0.08)
    sample_y = int(height * 0.90)

    sample = img.crop(
        (
            sample_x,
            sample_y,
            sample_x + sample_size,
            sample_y + sample_size,
        )
    )

    pixels = list(sample.getdata())

    r = int(median([p[0] for p in pixels]))
    g = int(median([p[1] for p in pixels]))
    b = int(median([p[2] for p in pixels]))

    return (r, g, b)


def remove_bottom(img, strip_height, ratio=1.0):
    width, height = img.size

    bg = detect_background_color(img)

    draw = ImageDraw.Draw(img)

    # etwas größer als die angegebene Höhe,
    # damit auch Rahmen und Antialiasing verschwinden
    cleanup_margin = 5

    y = height - strip_height

    strip_width = width * ratio

    x_start = (width - strip_width) / 2
    x_end = x_start + strip_width

    # Bei ratio=1.0 die volle Breite, sonst nur der mittlere Anteil.
    draw.rectangle(
        (
            x_start,
            y - cleanup_margin,
            x_end,
            height,
        ),
        fill=bg,
    )

    return img


def process_file(path, target_dir, strip_height, ratio=1.0):
    filename = os.path.basename(path)

    img = Image.open(path).convert("RGB")

    img = remove_bottom(img, strip_height, ratio=ratio)

    output_path = os.path.join(target_dir, filename)

    img.save(
        output_path,
        optimize=True,
        compress_level=9,
    )

    print(f"Gespeichert: {output_path}")


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Entfernt einen vollflächigen Streifen am unteren Rand "
            "von PNG-Bildern (Front- oder Back-Cover)."
        )
    )
    parser.add_argument(
        "type",
        choices=["front", "back"],
        help='Cover-Typ: "front" oder "back".'
    )
    parser.add_argument(
        "--file",
        default=None,
        help=(
            "Optional: Name oder Pfad einer einzelnen Datei, die "
            "verarbeitet werden soll. Ohne Angabe werden alle PNG-Dateien "
            "im Quellordner verarbeitet."
        ),
    )
    parser.add_argument(
        "--height",
        type=int,
        default=None,
        help=(
            "Höhe des zu entfernenden Streifens in Pixeln. "
            f"Standard: {DEFAULT_HEIGHT_FRONT} (front) / "
            f"{DEFAULT_HEIGHT_BACK} (back)."
        ),
    )
    parser.add_argument(
        "--ratio",
        type=float,
        default=1.0,
        help=(
            "Anteil der Breite (0.0 bis 1.0), der in der horizontalen "
            "Mitte entfernt wird. Standard: 1.0 (volle Breite)."
        ),
    )
    return parser.parse_args()


def resolve_files(source_dir, filename):
    """
    Liefert die Liste der zu verarbeitenden Dateipfade. Wurde ein
    einzelner Dateiname übergeben, wird nur diese Datei verarbeitet
    (entweder als vollständiger Pfad oder relativ zu source_dir).
    Ohne Angabe werden alle PNG-Dateien in source_dir verwendet.
    """

    if filename:
        candidate = filename
        if not os.path.isfile(candidate):
            candidate = os.path.join(source_dir, filename)

        if not os.path.isfile(candidate):
            print(f"Datei nicht gefunden: {filename}")
            return []

        return [candidate]

    pattern = os.path.join(source_dir, "*.png")
    return sorted(glob.glob(pattern))


def main():
    args = parse_args()

    if not 0.0 <= args.ratio <= 1.0:
        print("Fehler: --ratio muss zwischen 0.0 und 1.0 liegen.")
        return

    source_dir = f"../pics/ratgeber-{args.type}-todo"
    target_dir = f"../pics/ratgeber-{args.type}-removed-bottom"

    os.makedirs(target_dir, exist_ok=True)

    if args.height is not None:
        strip_height = args.height
    elif args.type == "front":
        strip_height = DEFAULT_HEIGHT_FRONT
    else:
        strip_height = DEFAULT_HEIGHT_BACK

    files = resolve_files(source_dir, args.file)

    if not files:
        if not args.file:
            print("Keine PNG-Dateien gefunden.")
        return

    print(f"{len(files)} Dateien gefunden.")

    for path in files:
        process_file(path, target_dir, strip_height, ratio=args.ratio)

    print("Fertig.")


if __name__ == "__main__":
    main()