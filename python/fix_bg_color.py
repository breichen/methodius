import glob
import math
import os

from PIL import Image


SOURCE_DIR = "../pics/ratgeber-back-nologo-removed-barcode"
TARGET_DIR = "../pics/ratgeber-back-nologo-normalized"

TARGET_COLOR = (241, 236, 226)

# Startwert:
# 20 = konservativ
# 25 = meist sinnvoll
# 30 = aggressiver
THRESHOLD = 25

os.makedirs(TARGET_DIR, exist_ok=True)


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


def process_file(path):

    filename = os.path.basename(path)

    img = Image.open(path)

    img, replaced = normalize_background(img)

    output_path = os.path.join(
        TARGET_DIR,
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


def main():

    files = sorted(
        glob.glob(
            os.path.join(SOURCE_DIR, "*.png")
        )
    )

    if not files:
        print("Keine PNG-Dateien gefunden.")
        return

    print(f"{len(files)} Dateien gefunden.\n")

    for path in files:
        process_file(path)

    print("\nFertig.")


if __name__ == "__main__":
    main()