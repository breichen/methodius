"""
Erzeugt pro veröffentlichter Fallakte ein Vorschaubild (1200 x 630) im
Look der Fallakten-Karte von probleme.html, für die Link-Vorschau.

Nutzt die echte style.css der Website, Titel/Reihenfolge aus js/probleme.js
und die Frage aus md/probleme/<slug>.md.

Aufruf im Projektordner:  python python/problem_og_bilder.py
Ergebnis:                 pics/problem-og/<slug>.jpg
"""

import html
import re
import sys
from datetime import date
from pathlib import Path

from playwright.sync_api import sync_playwright

# Unveröffentlichte Fallakten überspringen: Das Bild enthält die Frage
# im Klartext und wäre sonst unter einer erratbaren URL abrufbar.
NUR_VEROEFFENTLICHTE = False

PROJEKT = Path(__file__).resolve().parent.parent
AUSGABE = PROJEKT / "pics" / "problem-og"
TEMP = PROJEKT / "python" / "_vorschau.html"   # python/ liegt auf der Ignorier-Liste

# Die Seite wird mit 600 x 315 CSS-Pixeln und Faktor 2 gerendert = 1200 x 630
BREITE, HOEHE, FAKTOR = 600, 315, 2
KARTENBREITE = 520
RAND_OBEN_UNTEN = 24

SEITE = """<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Inter:wght@400;500;600&family=Homemade+Apple&display=swap" rel="stylesheet">
  <link rel="stylesheet" href="__CSS__">
  <style>
    html, body {
      width: __BREITE__px; height: __HOEHE__px;
      margin: 0; padding: 0; overflow: hidden;
      background: var(--color-bg-alt, #eee);
    }
    body { display: flex; align-items: center; justify-content: center; }
    .problem-card { width: __KARTE__px; box-sizing: border-box; }
  </style>
</head>
<body>
  <article class="problem-card">
    <p class="problem-fallnummer">Fall Nr. __NUMMER__</p>
    <h3 class="problem-titel">__TITEL__</h3>
    <p class="problem-frage">„__FRAGE__“</p>
  </article>
</body>
</html>
"""

# Kürzt Frage (und notfalls Titel) mit "…", bis die Karte ins Bild passt.
PASSEND_JS = """
() => {
  const maxHoehe = __HOEHE__ - 2 * __RAND__;
  const karte = document.querySelector('.problem-card');
  const frage = document.querySelector('.problem-frage');
  const titel = document.querySelector('.problem-titel');
  const klemme = (el, n) => {
    el.style.display = '-webkit-box';
    el.style.webkitBoxOrient = 'vertical';
    el.style.overflow = 'hidden';
    el.style.webkitLineClamp = String(n);
  };
  klemme(titel, 3);
  let n = 12;
  klemme(frage, n);
  while (n > 1 && karte.getBoundingClientRect().height > maxHoehe) {
    n--;
    klemme(frage, n);
  }
}
""".replace("__HOEHE__", str(HOEHE)).replace("__RAND__", str(RAND_OBEN_UNTEN))


def feld(eintrag, name):
    """Liest ein String-Feld wie  slug: "abc"  aus einem JS-Objekt."""
    treffer = re.search(rf'\b{name}:\s*"((?:[^"\\]|\\.)*)"', eintrag)
    return treffer.group(1).replace('\\"', '"') if treffer else ""


def lese_faelle():
    """Holt Nummer, slug, titel und erstellt aus js/probleme.js."""
    text = (PROJEKT / "js" / "probleme.js").read_text(encoding="utf-8")
    block = re.search(r"problemeRohdaten\s*=\s*\[(.*?)\]\s*;", text, re.S)
    if not block:
        sys.exit("problemeRohdaten in js/probleme.js nicht gefunden.")

    faelle = []
    for nummer, eintrag in enumerate(re.findall(r"\{[^{}]*\}", block.group(1)), start=1):
        slug = feld(eintrag, "slug")
        if slug:
            faelle.append({
                "nummer": nummer,
                "slug": slug,
                "titel": feld(eintrag, "titel") or slug,
                "erstellt": feld(eintrag, "erstellt"),
            })
    return faelle


def lese_frage(slug):
    """Holt den Abschnitt '## Frage' aus der Markdown-Datei als Klartext."""
    text = (PROJEKT / "md" / "probleme" / f"{slug}.md").read_text(encoding="utf-8")
    treffer = re.search(
        r"^#{1,2}\s+Frage\s*\n(.*?)(?=^#{1,2}\s+|\Z)", text, re.S | re.M | re.I
    )
    frage = treffer.group(1) if treffer else ""

    # wie markdownZuKlartext() in js/problemgrid.js
    frage = re.sub(r"\*\*(.*?)\*\*", r"\1", frage)
    frage = re.sub(r"\*(.*?)\*", r"\1", frage)
    frage = re.sub(r"`(.*?)`", r"\1", frage)
    frage = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", frage)
    return re.sub(r"\s+", " ", frage).strip()


def baue_seite(fall, frage):
    ersetzungen = {
        "__CSS__": (PROJEKT / "style.css").as_uri(),
        "__BREITE__": str(BREITE),
        "__HOEHE__": str(HOEHE),
        "__KARTE__": str(KARTENBREITE),
        "__NUMMER__": f"{fall['nummer']:03d}",
        "__TITEL__": html.escape(fall["titel"]),
        "__FRAGE__": html.escape(frage),
    }
    seite = SEITE
    for platzhalter, wert in ersetzungen.items():
        seite = seite.replace(platzhalter, wert)
    return seite


def main():
    AUSGABE.mkdir(parents=True, exist_ok=True)
    heute = date.today().isoformat()

    with sync_playwright() as p:
        browser = p.chromium.launch()
        seite = browser.new_page(
            viewport={"width": BREITE, "height": HOEHE}, device_scale_factor=FAKTOR
        )

        for fall in lese_faelle():
            veroeffentlicht = bool(fall["erstellt"]) and fall["erstellt"] <= heute
            if NUR_VEROEFFENTLICHTE and not veroeffentlicht:
                print(f"SKIP  {fall['slug']}  (nicht veröffentlicht)")
                continue

            try:
                frage = lese_frage(fall["slug"])
            except FileNotFoundError:
                print(f"FEHLT {fall['slug']}  (md/probleme/{fall['slug']}.md)")
                continue

            TEMP.write_text(baue_seite(fall, frage), encoding="utf-8")
            seite.goto(TEMP.as_uri(), wait_until="networkidle")
            seite.evaluate("async () => { await document.fonts.ready; }")
            seite.evaluate(PASSEND_JS)
            seite.screenshot(
                path=str(AUSGABE / f"{fall['slug']}.jpg"), type="jpeg", quality=88
            )
            print(f"OK    {fall['slug']}")

        browser.close()

    TEMP.unlink(missing_ok=True)


if __name__ == "__main__":
    main()