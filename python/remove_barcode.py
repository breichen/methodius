import argparse
import glob
import os
from statistics import median

from PIL import Image, ImageDraw


SOURCE_DIR = "../pics/ratgeber-back-nologo-barcode"
TARGET_DIR = "../pics/ratgeber-back-nologo-removed-barcode"

# Standardgröße des Barcodes, falls nicht per Parameter überschrieben
DEFAULT_BARCODE_WIDTH = 250
DEFAULT_BARCODE_HEIGHT = 145

os.makedirs(TARGET_DIR, exist_ok=True)


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


def remove_barcode(img, barcode_width=DEFAULT_BARCODE_WIDTH, barcode_height=DEFAULT_BARCODE_HEIGHT):
    width, height = img.size

    bg = detect_background_color(img)

    draw = ImageDraw.Draw(img)

    # Barcodeposition gemäß deinem Layout
    margin_right = 55
    margin_bottom = 55

    x = width - margin_right - barcode_width
    y = height - margin_bottom - barcode_height

    # etwas größer als der Barcode selbst,
    # damit auch Rahmen und Antialiasing verschwinden
    cleanup_margin = 5

    # Statt exakt am Barcode aufzuhören, ziehen wir das Rechteck bis
    # zum rechten und unteren Bildrand durch. Das deckt auch Barcodes
    # ab, die etwas weiter nach rechts/unten verschoben sind.
    draw.rectangle(
        (
            x - cleanup_margin,
            y - cleanup_margin,
            width,
            height,
        ),
        fill=bg,
    )

    return img


def process_file(path, barcode_width=DEFAULT_BARCODE_WIDTH, barcode_height=DEFAULT_BARCODE_HEIGHT):
    filename = os.path.basename(path)

    img = Image.open(path).convert("RGB")

    img = remove_barcode(img, barcode_width=barcode_width, barcode_height=barcode_height)

    output_path = os.path.join(TARGET_DIR, filename)

    img.save(
        output_path,
        optimize=True,
        compress_level=9,
    )

    print(f"Gespeichert: {output_path}")


def parse_args():
    parser = argparse.ArgumentParser(
        description="Entfernt Barcodes aus PNG-Bildern."
    )
    parser.add_argument(
        "--file",
        default=None,
        help=(
            "Optional: Name oder Pfad einer einzelnen Datei, die "
            "verarbeitet werden soll. Ohne Angabe werden alle PNG-Dateien "
            "in SOURCE_DIR verarbeitet."
        ),
    )
    parser.add_argument(
        "--width",
        type=int,
        default=DEFAULT_BARCODE_WIDTH,
        help=f"Breite des Barcodes in Pixeln (Standard: {DEFAULT_BARCODE_WIDTH}).",
    )
    parser.add_argument(
        "--height",
        type=int,
        default=DEFAULT_BARCODE_HEIGHT,
        help=f"Höhe des Barcodes in Pixeln (Standard: {DEFAULT_BARCODE_HEIGHT}).",
    )
    return parser.parse_args()


def resolve_files(filename):
    """
    Liefert die Liste der zu verarbeitenden Dateipfade. Wurde ein
    einzelner Dateiname übergeben, wird nur diese Datei verarbeitet
    (entweder als vollständiger Pfad oder relativ zu SOURCE_DIR).
    Ohne Angabe werden alle PNG-Dateien in SOURCE_DIR verwendet.
    """

    if filename:
        candidate = filename
        if not os.path.isfile(candidate):
            candidate = os.path.join(SOURCE_DIR, filename)

        if not os.path.isfile(candidate):
            print(f"Datei nicht gefunden: {filename}")
            return []

        return [candidate]

    pattern = os.path.join(SOURCE_DIR, "*.png")
    return sorted(glob.glob(pattern))


def main():
    args = parse_args()

    files = resolve_files(args.file)

    if not files:
        if not args.file:
            print("Keine PNG-Dateien gefunden.")
        return

    print(f"{len(files)} Dateien gefunden.")

    for path in files:
        process_file(path, barcode_width=args.width, barcode_height=args.height)

    print("Fertig.")


if __name__ == "__main__":
    main()