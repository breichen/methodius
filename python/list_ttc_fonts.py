import sys

from fontTools.ttLib import TTCollection


def list_fonts(path):
    collection = TTCollection(path)

    for index, font in enumerate(collection.fonts):
        name_table = font["name"]

        family = name_table.getDebugName(1)
        subfamily = name_table.getDebugName(2)
        full_name = name_table.getDebugName(4)

        print(f"Index {index}: {full_name} ({family} - {subfamily})")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Verwendung: python3 list_ttc_fonts.py <pfad-zur-ttc-datei>")
        sys.exit(1)

    list_fonts(sys.argv[1])
