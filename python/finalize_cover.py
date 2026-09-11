import argparse
import glob
import math
import os
import random
import re

from PIL import Image, ImageDraw, ImageFont
from tempfile import NamedTemporaryFile
from barcode import EAN13
from barcode.writer import ImageWriter


# ---------------------------------------------------------------------------
# Schritt 1: Hintergrundfarbe normalisieren (ehemals fix_bg_color.py)
# ---------------------------------------------------------------------------

TARGET_COLOR = (241, 236, 226)

# Startwert:
# 20 = konservativ
# 25 = meist sinnvoll
# 30 = aggressiver
BACKGROUND_THRESHOLD = 25

# #B5292C - einheitlicher Rotton, auf den alle rötlichen Farbtöne im
# Cover vereinheitlicht werden (analog zur Hintergrundfarbe).
TARGET_RED = (181, 41, 44)

# Wie groß die Farbabweichung sein darf, damit ein Pixel noch als
# "dieser Rotton" erkannt und ersetzt wird. Bei Bedarf anpassen:
# kleiner = konservativer, größer = aggressiver.
RED_THRESHOLD = 45

# Textfarben, die vereinheitlicht werden sollen (Front und Back).
# #1B2340 (dunkles Navy, Überschriften) und #5A5F72 (helleres
# Graublau, Fließtext).
TEXT_COLOR_DARK = (27, 35, 64)
TEXT_COLOR_LIGHT = (90, 95, 114)

# Wie groß die Farbabweichung sein darf, damit ein Pixel noch als
# "diese Textfarbe" erkannt und ersetzt wird. Bei Bedarf anpassen.
TEXT_THRESHOLD = 30

# Bei Front-Covern steht Text nur im oberen Bereich (Titel/Untertitel),
# darunter beginnt die Illustration - die soll nicht angefasst werden.
# Statt Textfarben-Lücken zu suchen (unzuverlässig - z.B. weil manche
# Titelwörter rot statt navy sind, wodurch die Lücke zwischen Titel-
# und Untertitel-Zeilen teils GRÖSSER ist als die Lücke zwischen
# Untertitel und Illustration), wird die Grenze anhand einer
# zusammenhängenden Fläche erkannt: Text besteht aus kurzen Zeilen mit
# Lücken dazwischen, eine Illustration ist dagegen über hunderte
# Zeilen hinweg durchgehend "belegt" (unabhängig von der Farbe).
# TEXT_REGION_MAX_RATIO_FRONT wirkt als absolute Sicherheits-
# Obergrenze, die nie überschritten wird.
TEXT_REGION_MAX_RATIO_FRONT = 0.55

# Ein Pixel gilt als "Inhalt" (nicht Hintergrund), wenn er weiter als
# BACKGROUND_THRESHOLD vom Hintergrund entfernt ist. Eine Zeile gilt
# als "leer", wenn weniger als dieser Anteil der Breite Inhalt ist.
TEXT_BLANK_ROW_MAX_COVERAGE = 0.002

# Mindestlänge einer durchgehenden (lückenlosen) Fläche, damit sie als
# Illustration statt als einzelne Textzeile gilt. Am Beispielcover
# gemessen: die längste einzelne Textzeile war 117 Zeilen (bei 1492 px
# Höhe -> 7.8%), die Illustration lief 700 Zeilen (46.9%) am Stück.
# 15% liegt komfortabel dazwischen.
SUSTAINED_CONTENT_MIN_ROWS_RATIO = 0.15


def color_distance(c1, c2):
    return math.sqrt(
        (c1[0] - c2[0]) ** 2 +
        (c1[1] - c2[1]) ** 2 +
        (c1[2] - c2[2]) ** 2
    )


def normalize_color(img, target, threshold, y_start=0, y_end=None):
    """
    Ersetzt alle Pixel, deren Farbe nahe genug (innerhalb threshold)
    an target liegt, durch target selbst. Generische Grundlage für
    normalize_background, normalize_red und normalize_text_colors.

    Über y_start/y_end lässt sich der Bereich auf einen horizontalen
    Streifen einschränken (z.B. nur den oberen Textbereich eines
    Front-Covers, ohne die Illustration darunter zu berühren).
    """

    img = img.convert("RGB")

    pixels = img.load()

    width, height = img.size

    if y_end is None:
        y_end = height

    replaced = 0

    for y in range(y_start, y_end):
        for x in range(width):

            pixel = pixels[x, y]

            if color_distance(pixel, target) <= threshold:
                pixels[x, y] = target
                replaced += 1

    return img, replaced


def normalize_background(img):
    return normalize_color(img, TARGET_COLOR, BACKGROUND_THRESHOLD)


def normalize_red(img):
    return normalize_color(img, TARGET_RED, RED_THRESHOLD)


def normalize_text_colors(img):
    """
    Vereinheitlicht beide Textfarben (dunkles Navy und helleres
    Graublau) auf dem GESAMTEN Bild. Für Back-Cover gedacht, wo es
    keine Illustration gibt, die versehentlich mitgetroffen werden
    könnte. Gibt das Bild sowie die jeweils ersetzte Pixelanzahl
    zurück.
    """

    img, replaced_dark = normalize_color(img, TEXT_COLOR_DARK, TEXT_THRESHOLD)
    img, replaced_light = normalize_color(img, TEXT_COLOR_LIGHT, TEXT_THRESHOLD)

    return img, replaced_dark, replaced_light


def find_text_block_end(img):
    """
    Ermittelt die Zeile, an der der obere Textblock (Titel/Untertitel)
    endet, indem die erste ausreichend lange, LÜCKENLOSE Fläche
    gesucht wird (unabhängig von deren Farbe). Textzeilen sind kurz
    und durch Lücken getrennt, eine Illustration ist dagegen über
    viele hundert Zeilen hinweg durchgehend "belegt" - dieser
    qualitative Unterschied ist robuster als eine Suche nach
    bestimmten Textfarben (die z.B. durch farbig hervorgehobene
    Titelwörter in die Irre geführt werden kann).

    TEXT_REGION_MAX_RATIO_FRONT wirkt als absolute Obergrenze, die nie
    überschritten wird. Gibt 0 zurück, wenn im Bild gar keine "leeren"
    Zeilen gefunden wurden (z.B. weil es komplett ungewöhnlich
    aufgebaut ist) - in dem Fall wird die Normalisierung sicherheits-
    halber komplett übersprungen.
    """

    width, height = img.size
    pixels = img.load()

    max_y_cap = int(height * TEXT_REGION_MAX_RATIO_FRONT)
    max_coverage_pixels = int(width * TEXT_BLANK_ROW_MAX_COVERAGE)
    sustained_min_rows = max(10, int(height * SUSTAINED_CONTENT_MIN_ROWS_RATIO))

    def is_row_blank(y):
        count = 0
        for x in range(width):
            if color_distance(pixels[x, y], TARGET_COLOR) > BACKGROUND_THRESHOLD:
                count += 1
                if count > max_coverage_pixels:
                    return False
        return True

    row_blank = [is_row_blank(y) for y in range(height)]

    # Zusammenhängende "leere" Bereiche (Lücken) finden.
    gaps = []
    start = None
    for y in range(height):
        if row_blank[y]:
            if start is None:
                start = y
        elif start is not None:
            gaps.append((start, y - 1))
            start = None
    if start is not None:
        gaps.append((start, height - 1))

    if not gaps:
        return 0

    # Für jede Lücke prüfen, wie lang die anschließende zusammen-
    # hängende Fläche bis zur nächsten Lücke ist. Ist sie lang genug,
    # markiert diese Lücke den Übergang von Text zu Illustration.
    for i, (gap_start, gap_end) in enumerate(gaps):
        if gap_start > max_y_cap:
            break

        next_gap_start = gaps[i + 1][0] if i + 1 < len(gaps) else height
        span = next_gap_start - (gap_end + 1)

        if span >= sustained_min_rows:
            return min(max_y_cap, gap_end + 1)

    # Kein eindeutiger Übergang gefunden - sicherheitshalber die
    # Obergrenze verwenden.
    return max_y_cap


def normalize_front_text_colors(img):
    """
    Vereinheitlicht beide Textfarben, aber NUR im automatisch
    erkannten oberen Textbereich (Titel/Untertitel). Die Illustration
    im unteren Bereich bleibt unangetastet. Wird kein Textbereich
    erkannt, passiert nichts (sicherer Fallback).
    """

    y_end = find_text_block_end(img)

    if y_end == 0:
        print(
            "Warnung: Kein Textbereich erkannt, "
            "Textfarben-Normalisierung übersprungen."
        )
        return img, 0, 0

    img, replaced_dark = normalize_color(
        img, TEXT_COLOR_DARK, TEXT_THRESHOLD, y_end=y_end
    )
    img, replaced_light = normalize_color(
        img, TEXT_COLOR_LIGHT, TEXT_THRESHOLD, y_end=y_end
    )

    return img, replaced_dark, replaced_light


# ---------------------------------------------------------------------------
# Schritt 2: Logo (und ggf. Barcode) hinzufügen (ehemals add_logo.py)
# ---------------------------------------------------------------------------

used_isbns = set()


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


def add_logo(cover, cover_type):
    """
    Fügt einem bereits geladenen Cover (RGBA) das Logo hinzu.
    Gibt das fertige Cover zurück.
    """

    cover_width, cover_height = cover.size

    logo_path = "../assets/favicon/methodius-512x512-nobg.png"
    logo = Image.open(logo_path).convert("RGBA")

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

    return cover


# ---------------------------------------------------------------------------
# Schritt 3: Autorenname und Ornament (nur Front-Cover)
# ---------------------------------------------------------------------------

AUTHOR_NAME = "Dr. Maximilian Methodius"

# Pfad zur Inter-Schriftdatei. Bitte an den tatsächlichen Speicherort
# anpassen (z.B. "../assets/fonts/Inter-SemiBold.ttf").
AUTHOR_FONT_PATH = "../assets/fonts/Inter.ttc"

# Index des gewünschten Schriftschnitts innerhalb der .ttc-Datei.
# Herausfinden z.B. mit list_ttc_fonts.py <pfad-zur-ttc-datei>.
AUTHOR_FONT_INDEX = 10

# Werte unten wurden anhand des Beispielcovers (1054x1492 px) vermessen
# und als Anteil von Coverbreite/-höhe ausgedrückt, damit sie bei
# anderen Bildgrößen automatisch mitskalieren. Bei Bedarf anpassen.

AUTHOR_FONT_SIZE_RATIO = 0.03    # Schriftgröße relativ zur Coverbreite
AUTHOR_COLOR = (0, 28, 73)        # Navy, wie im Beispielcover gemessen
AUTHOR_Y_RATIO = 0.910            # vertikale Mitte des Textes

ORNAMENT_COLOR = TARGET_RED        # #B5292C, einheitlich mit normalize_red
ORNAMENT_Y_RATIO_FRONT = 0.950    # vertikale Mitte von Linie/Raute (Front)
ORNAMENT_Y_RATIO_BACK = 0.930     # vertikale Mitte von Linie/Raute (Back)
                                   # Platzhalter - bitte an dein Layout anpassen
ORNAMENT_LINE_LENGTH_RATIO = 0.125 # Länge je Linie (links/rechts)
ORNAMENT_GAP_RATIO = 0.016        # Abstand zwischen Linie und Raute
ORNAMENT_DIAMOND_SIZE_RATIO = 0.012  # halbe Rautenhöhe/-breite
ORNAMENT_STROKE_RATIO = 0.0019    # Linienstärke


def draw_author_name(cover):
    cover_width, cover_height = cover.size

    draw = ImageDraw.Draw(cover)

    font_size = max(1, int(cover_width * AUTHOR_FONT_SIZE_RATIO))

    try:
        font = ImageFont.truetype(
            AUTHOR_FONT_PATH, font_size, index=AUTHOR_FONT_INDEX
        )
    except OSError:
        print(
            f"Warnung: Schriftart nicht gefunden unter "
            f"{AUTHOR_FONT_PATH}, verwende Standardschrift."
        )
        font = ImageFont.load_default()

    center_x = cover_width // 2
    center_y = int(cover_height * AUTHOR_Y_RATIO)

    draw.text(
        (center_x, center_y),
        AUTHOR_NAME,
        font=font,
        fill=AUTHOR_COLOR,
        anchor="mm",
    )

    return cover


def draw_ornament(cover, y_ratio):
    cover_width, cover_height = cover.size

    draw = ImageDraw.Draw(cover)

    center_x = cover_width // 2
    center_y = int(cover_height * y_ratio)

    line_length = int(cover_width * ORNAMENT_LINE_LENGTH_RATIO)
    gap = int(cover_width * ORNAMENT_GAP_RATIO)
    diamond_size = max(1, int(cover_width * ORNAMENT_DIAMOND_SIZE_RATIO))
    stroke = max(1, int(cover_width * ORNAMENT_STROKE_RATIO))

    # Linie links
    draw.line(
        [
            (center_x - gap - line_length, center_y),
            (center_x - gap, center_y),
        ],
        fill=ORNAMENT_COLOR,
        width=stroke,
    )

    # Linie rechts
    draw.line(
        [
            (center_x + gap, center_y),
            (center_x + gap + line_length, center_y),
        ],
        fill=ORNAMENT_COLOR,
        width=stroke,
    )

    # Raute in der Mitte
    draw.polygon(
        [
            (center_x, center_y - diamond_size),
            (center_x + diamond_size, center_y),
            (center_x, center_y + diamond_size),
            (center_x - diamond_size, center_y),
        ],
        fill=ORNAMENT_COLOR,
    )

    return cover


def add_author_and_ornament(cover):
    cover = draw_author_name(cover)
    cover = draw_ornament(cover, ORNAMENT_Y_RATIO_FRONT)
    return cover


# ---------------------------------------------------------------------------
# Schritt 4: Nummern-Kreis unten rechts (nur Front-Cover)
# ---------------------------------------------------------------------------

RATGEBER_JS_PATH = "../js/ratgeber.js"

CIRCLE_COLOR = (27, 35, 64)      # Navy, #1B2340
CIRCLE_NUMBER_COLOR = TARGET_COLOR  # Creme, #F1ECE2 (wie Hintergrund)

# Orientiert an Position/Größe des Logos (siehe add_logo): Logo sitzt
# bei x=0.04*Breite (linker Rand) / y=0.93*Höhe, Breite 0.07*Breite.
# Der Kreis spiegelt das unten rechts, mit etwas mehr Durchmesser,
# damit auch dreistellige Zahlen gut hineinpassen.
CIRCLE_DIAMETER_RATIO = 0.09       # Durchmesser relativ zur Coverbreite
CIRCLE_MARGIN_RIGHT_RATIO = 0.04   # Abstand zum rechten Rand
CIRCLE_Y_RATIO = 0.93              # vertikale Position (oben am Kreis)

# Schriftgröße relativ zum Kreisdurchmesser. Der Wert ist so gewählt,
# dass auch dreistellige Zahlen (z.B. "123") noch bequem hineinpassen.
CIRCLE_FONT_SIZE_RATIO = 0.42


def load_ratgeber_order(path=RATGEBER_JS_PATH):
    """
    Liest ../js/ratgeber.js ein und liefert die Liste aller Slugs in
    der Reihenfolge, in der sie dort auftauchen (sowohl einfache
    String-Einträge als auch { slug: "...", ... }-Objekte).
    """

    if not os.path.isfile(path):
        print(f"Warnung: {path} nicht gefunden, keine Nummerierung möglich.")
        return []

    with open(path, encoding="utf-8") as f:
        content = f.read()

    match = re.search(
        r"ratgeberRohdaten\s*=\s*\[(.*?)\]\s*;", content, re.DOTALL
    )

    if not match:
        print(
            f"Warnung: 'ratgeberRohdaten' in {path} nicht gefunden, "
            "keine Nummerierung möglich."
        )
        return []

    array_body = match.group(1)

    slugs = []

    for entry_match in re.finditer(r"\{[^}]*\}|\"[^\"]*\"", array_body):
        entry = entry_match.group(0)

        if entry.startswith("{"):
            slug_match = re.search(r'slug:\s*"([^"]*)"', entry)
            if slug_match:
                slugs.append(slug_match.group(1))
        else:
            slugs.append(entry.strip('"'))

    return slugs


def get_cover_number(name, path=RATGEBER_JS_PATH):
    """
    Bestimmt die (1-basierte) Nummer eines Covers anhand seiner
    Position in der ratgeberRohdaten-Liste. Gibt None zurück, wenn
    der Name nicht gefunden wurde.
    """

    slugs = load_ratgeber_order(path)

    try:
        return slugs.index(name) + 1
    except ValueError:
        print(f"Warnung: '{name}' nicht in {path} gefunden.")
        return None


def draw_number_circle(cover, number):
    cover_width, cover_height = cover.size

    diameter = int(cover_width * CIRCLE_DIAMETER_RATIO)
    margin_right = int(cover_width * CIRCLE_MARGIN_RIGHT_RATIO)

    x = cover_width - margin_right - diameter
    y = int(cover_height * CIRCLE_Y_RATIO)

    draw = ImageDraw.Draw(cover)

    draw.ellipse(
        (x, y, x + diameter, y + diameter),
        fill=CIRCLE_COLOR,
    )

    font_size = max(1, int(diameter * CIRCLE_FONT_SIZE_RATIO))

    try:
        font = ImageFont.truetype(
            AUTHOR_FONT_PATH, font_size, index=AUTHOR_FONT_INDEX
        )
    except OSError:
        font = ImageFont.load_default()

    center_x = x + diameter // 2
    center_y = y + diameter // 2

    draw.text(
        (center_x, center_y),
        str(number),
        font=font,
        fill=CIRCLE_NUMBER_COLOR,
        anchor="mm",
    )

    return cover


# ---------------------------------------------------------------------------
# Zusammengeführte Pipeline
# ---------------------------------------------------------------------------

def process_cover(name, cover_type):
    """
    Führt für ein einzelnes Cover beide Schritte aus:
    1. Hintergrundfarbe normalisieren (raw -> nologo)
    2. Logo (und bei Back-Covern Barcode) hinzufügen (nologo -> final)
    """

    raw_path = f"../pics/ratgeber-{cover_type}-todo/{name}.png"

    if not os.path.isfile(raw_path):
        print(f"Datei nicht gefunden: {raw_path}")
        return

    img = Image.open(raw_path)
    img, replaced_bg = normalize_background(img)
    img, replaced_red = normalize_red(img)

    log_line = (
        f"{name}.png: {replaced_bg:,} Pixel (Hintergrund), "
        f"{replaced_red:,} Pixel (Rot)"
    )

    if cover_type.lower() == "back":
        img, replaced_dark, replaced_light = normalize_text_colors(img)
        log_line += (
            f", {replaced_dark:,} Pixel (Text dunkel), "
            f"{replaced_light:,} Pixel (Text hell)"
        )

    if cover_type.lower() == "front":
        img, replaced_dark, replaced_light = normalize_front_text_colors(img)
        log_line += (
            f", {replaced_dark:,} Pixel (Text dunkel), "
            f"{replaced_light:,} Pixel (Text hell)"
        )

    log_line += " ersetzt"

    nologo_dir = f"../pics/ratgeber-{cover_type}-nologo"
    os.makedirs(nologo_dir, exist_ok=True)

    nologo_path = os.path.join(nologo_dir, f"{name}.png")
    img.save(nologo_path, optimize=True, compress_level=9)

    print(log_line)

    cover = img.convert("RGBA")

    if cover_type.lower() == "back":
        cover = draw_barcode(cover)
        cover = draw_ornament(cover, ORNAMENT_Y_RATIO_BACK)

    if cover_type.lower() == "front":
        cover = add_author_and_ornament(cover)

        number = get_cover_number(name)
        if number is not None:
            cover = draw_number_circle(cover, number)

    cover = add_logo(cover, cover_type)

    output_dir = f"../pics/ratgeber-{cover_type}-finalized"
    os.makedirs(output_dir, exist_ok=True)

    output_path = os.path.join(output_dir, f"{name}.png")
    cover.save(output_path)

    print(f"Gespeichert: {output_path}")


def get_all_names(cover_type):
    source_dir = f"../pics/ratgeber-{cover_type}-todo"

    pattern = os.path.join(source_dir, "*.png")

    return [
        os.path.splitext(os.path.basename(path))[0]
        for path in sorted(glob.glob(pattern))
    ]


def parse_args():
    parser = argparse.ArgumentParser(
        description=(
            "Normalisiert die Hintergrundfarbe eines Covers "
            "(oder aller Cover) und fügt anschließend Logo "
            "(und bei Back-Covern ggf. Barcode) hinzu."
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

    if args.name == "*":
        names = get_all_names(args.type)

        if not names:
            print("Keine Cover gefunden.")
            return
    else:
        names = [args.name]

    print(f"{len(names)} Cover werden verarbeitet.\n")

    for name in names:
        process_cover(name, args.type)

    print("\nFertig.")


if __name__ == "__main__":
    main()