import argparse
import os
from statistics import median

from PIL import Image


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


def translate_image(img, delta):
    """
    Verschiebt den Bildinhalt vertikal um delta Pixel.
    delta > 0: Inhalt wandert nach unten (oben entsteht eine Lücke).
    delta < 0: Inhalt wandert nach oben (unten entsteht eine Lücke).
    Die entstehende Lücke wird mit der erkannten Hintergrundfarbe
    gefüllt.
    """

    width, height = img.size

    bg = detect_background_color(img)

    new_img = Image.new("RGB", (width, height), bg)

    if delta >= 0:
        d = min(delta, height)

        if d < height:
            src_crop = img.crop((0, 0, width, height - d))
            new_img.paste(src_crop, (0, d))
    else:
        d = min(-delta, height)

        if d < height:
            src_crop = img.crop((0, d, width, height))
            new_img.paste(src_crop, (0, 0))

    return new_img


def process_file(path, target_dir, delta):
    filename = os.path.basename(path)

    img = Image.open(path).convert("RGB")

    img = translate_image(img, delta)

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
            "Verschiebt den Inhalt eines Covers vertikal nach oben "
            "oder unten."
        )
    )
    parser.add_argument(
        "type",
        choices=["front", "back"],
        help='Cover-Typ: "front" oder "back".'
    )
    parser.add_argument(
        "file",
        help=(
            "Name oder Pfad der Bilddatei "
            "(mit oder ohne .png-Endung)."
        ),
    )
    parser.add_argument(
        "delta",
        type=int,
        help=(
            "Verschiebung in Pixeln. Positiv = Inhalt nach unten, "
            "negativ = Inhalt nach oben."
        ),
    )
    return parser.parse_args()


def resolve_file(source_dir, filename):
    """
    Findet die tatsächliche Bilddatei zu einem gegebenen Namen/Pfad.
    Akzeptiert sowohl vollständige Pfade als auch Namen relativ zu
    source_dir, jeweils mit oder ohne .png-Endung.
    """

    candidates = [
        filename,
        f"{filename}.png",
        os.path.join(source_dir, filename),
        os.path.join(source_dir, f"{filename}.png"),
    ]

    for candidate in candidates:
        if os.path.isfile(candidate):
            return candidate

    return None


def main():
    args = parse_args()

    source_dir = f"../pics/ratgeber-{args.type}-nologo"
    target_dir = f"../pics/ratgeber-{args.type}-nologo-translated"

    os.makedirs(target_dir, exist_ok=True)

    path = resolve_file(source_dir, args.file)

    if path is None:
        print(f"Datei nicht gefunden: {args.file}")
        return

    process_file(path, target_dir, args.delta)

    print("Fertig.")


if __name__ == "__main__":
    main()
