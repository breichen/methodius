import glob
import os
from statistics import median

from PIL import Image, ImageDraw


SOURCE_DIR = "../pics/ratgeber-back-nologo-barcode"
TARGET_DIR = "../pics/ratgeber-back-nologo-removed-barcode"

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


def remove_barcode(img):
    width, height = img.size

    bg = detect_background_color(img)

    draw = ImageDraw.Draw(img)

    # Barcodeposition gemäß deinem Layout
    barcode_width = 250
    barcode_height = 145

    margin_right = 55
    margin_bottom = 55

    x = width - margin_right - barcode_width
    y = height - margin_bottom - barcode_height

    # etwas größer als der Barcode selbst,
    # damit auch Rahmen und Antialiasing verschwinden
    cleanup_margin = 15

    draw.rectangle(
        (
            x - cleanup_margin,
            y - cleanup_margin,
            x + barcode_width + cleanup_margin,
            y + barcode_height + cleanup_margin,
        ),
        fill=bg,
    )

    return img


def process_file(path):
    filename = os.path.basename(path)

    img = Image.open(path).convert("RGB")

    img = remove_barcode(img)

    output_path = os.path.join(TARGET_DIR, filename)

    img.save(
        output_path,
        optimize=True,
        compress_level=9,
    )

    print(f"Gespeichert: {output_path}")


def main():
    pattern = os.path.join(SOURCE_DIR, "*.png")

    files = sorted(glob.glob(pattern))

    if not files:
        print("Keine PNG-Dateien gefunden.")
        return

    print(f"{len(files)} Dateien gefunden.")

    for path in files:
        process_file(path)

    print("Fertig.")


if __name__ == "__main__":
    main()