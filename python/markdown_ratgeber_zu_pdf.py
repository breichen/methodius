#!/usr/bin/env python3
"""
Markdown-Ratgeber -> PDF im Stil der Flipbook-Ansicht der Website.

Voraussetzungen:
    pip install markdown beautifulsoup4 playwright
    python -m playwright install chromium

Beispiele (aus dem Verzeichnis des Scripts):
    python markdown_ratgeber_zu_pdf.py mein-ratgeber
    python markdown_ratgeber_zu_pdf.py
    python markdown_ratgeber_zu_pdf.py mein-ratgeber --no-new-page-per-chapter

Wichtig:
- Es wird KEINE Titelseite / kein Cover erzeugt.
- Die erste PDF-Seite beginnt direkt mit dem ersten Inhalt des Markdown.
- Die PDF-Seiten sind weiß.
- Kapitelüberschriften beginnen auf einer neuen Seite, wie im Flipbook.
- Autorenbild und die auf der Website verwendete Signatur werden übernommen.
- Tabellen, Listen, Zitate, Fett/Kursiv und Links werden unterstützt.
"""

from __future__ import annotations

import argparse
import asyncio
import html
import re
import sys
import traceback
from pathlib import Path

import markdown
from playwright.async_api import async_playwright


# Die Werte orientieren sich an den Flipbook-Regeln aus style.css.
TEXT = "#1B2340"
MUTED = "#5A5F72"
ACCENT = "#B5292C"
BORDER = "#D6CDBB"

AUTHOR_IMAGE = "pics/team/Methodius.png"
AUTHOR_NAME = "Dr. Maximilian Methodius"
SIGNATURE = "Maximilian Methodius"

A4_PAGE = ("210mm", "297mm")
A5_PAGE = ("148mm", "210mm")


def page_size(a5: bool) -> tuple[str, str]:
    return A5_PAGE if a5 else A4_PAGE


def parse_args() -> argparse.Namespace:
    p = argparse.ArgumentParser(
        description=(
            "Markdown-Ratgeber als Flipbook-ähnliches PDF ausgeben. "
            "Ohne Namen werden alle .md-Dateien in ../md/ratgeber verarbeitet."
        )
    )
    p.add_argument(
        "name",
        nargs="?",
        default=None,
        help=(
            "Name des Ratgebers ohne .md. Die Quelldatei ist ../md/ratgeber/{name}.md. "
            "Ohne Angabe werden alle .md-Dateien in diesem Ordner verarbeitet."
        ),
    )
    p.add_argument(
        "--new-page-per-chapter",
        action="store_true",
        help="Jedes Kapitel beginnt auf einer neuen Seite.",
    )
    p.add_argument(
        "--site-root",
        type=Path,
        default=None,
        help="Wurzel des Websites-Verzeichnisses; dort werden pics/team/Methodius.png usw. gesucht.",
    )
    p.add_argument(
        "--a5",
        action="store_true",
        help="PDF im A5-Format erzeugen. Standard ist A4.",
    )
    return p.parse_args()


def get_input_files(name: str | None) -> list[Path]:
    """Ermittelt die Markdown-Dateien relativ zum aktuellen Arbeitsverzeichnis.

    Erwartete Struktur:
        <cwd>/../md/ratgeber/*.md

    Mit NAME wird exakt ../md/ratgeber/{NAME}.md verarbeitet; ohne NAME
    werden alle Markdown-Dateien dieses Ordners alphabetisch verarbeitet.
    """
    ratgeber_dir = (Path("..") / "md" / "ratgeber").resolve()

    if not ratgeber_dir.is_dir():
        raise FileNotFoundError(
            f"Ratgeber-Ordner nicht gefunden: {ratgeber_dir} "
            "(erwartet: ../md/ratgeber relativ zum aktuellen Verzeichnis)"
        )

    if name:
        filename = name if name.lower().endswith(".md") else f"{name}.md"
        md_path = ratgeber_dir / filename
        if not md_path.is_file():
            raise FileNotFoundError(f"Markdown-Datei nicht gefunden: {md_path}")
        return [md_path]

    files = sorted(ratgeber_dir.glob("*.md"), key=lambda p: p.name.lower())
    if not files:
        raise FileNotFoundError(f"Keine Markdown-Dateien gefunden in: {ratgeber_dir}")
    return files


def output_path_for(md_path: Path) -> Path:
    """Fester Ausgabeordner ../out/ratgeber, gleicher Dateiname wie die MD."""
    return (Path("..") / "out" / "ratgeber" / f"{md_path.stem}.pdf").resolve()


def find_site_root(md_path: Path, explicit: Path | None) -> Path:
    if explicit:
        return explicit.resolve()

    # Typischer Aufbau: <root>/md/ratgeber/datei.md
    for candidate in [md_path.parent, *md_path.parents]:
        if (candidate / "pics" / "team" / "Methodius.png").exists():
            return candidate.resolve()

    return md_path.parent.resolve()


def make_tables(markdown_text: str) -> str:
    """markdown kann Tabellen selbst verarbeiten; diese Funktion hält die
    Klassenbezeichnung der Website (.ratgeber-tabelle) bei."""
    return markdown_text


def md_to_html(markdown_text: str) -> str:
    extensions = [
        "extra",       # Tabellen, fenced code, ...
        "sane_lists",
        "nl2br",
    ]
    return markdown.markdown(
        make_tables(markdown_text),
        extensions=extensions,
        output_format="html5",
    )


def strip_bonus_for_pdf(html_text: str) -> str:
    """
    Im Flipbook bleibt der BONUS-Bereich statischer Inhalt.
    Deshalb wird er für das PDF NICHT als interaktiver Button ersetzt.
    """
    return html_text


def normalise_headings(html_text: str, new_page_per_chapter: bool) -> str:
    """
    Entspricht inhaltlich der Website-Logik:
    - erste Überschrift bleibt h1
    - spätere Kapitelüberschriften werden h2
    - generische 'Kapitel ...' / 'Schlusswort ...' Überschriften werden
      zugunsten einer unmittelbar folgenden h2 entfernt.
    """
    soup = __import__("bs4").BeautifulSoup(html_text, "html.parser")
    headings = soup.find_all(["h1", "h2"])

    if not headings:
        return str(soup)

    first = True
    for h in list(headings):
        if h.name == "h1":
            text = h.get_text(" ", strip=True)
            if first:
                first = False
                continue

            # Spätere H1 werden zu H2.
            h.name = "h2"
            first = False

    # Noch einmal die aktuelle Reihenfolge betrachten.
    headings = soup.find_all(["h1", "h2"])
    for i, h in enumerate(list(headings)):
        text = h.get_text(" ", strip=True)
        if re.match(r"^(Kapitel|Schlusswort)\b", text, re.I):
            nxt = h.find_next(["h1", "h2"])
            if nxt is not None and nxt.name == "h2":
                if i == 0 and h.name == "h1":
                    nxt.name = "h1"
                h.decompose()
    
    if new_page_per_chapter:
        h2s = soup.find_all("h2")

        for heading in h2s[1:]:
            classes = heading.get("class", [])
            classes.append("chapter-start")
            heading["class"] = classes
    
    # zweites h2 immer auf neue Seite
    h2s = soup.find_all("h2")

    for h2 in h2s[1:]:
        classes = h2.get("class", [])

        if "chapter-start" not in classes:
            classes.append("chapter-start")

        h2["class"] = classes

    return str(soup)


def style_author_mentions(html_text: str, site_root: Path, image_rel: str, signature: str, author_name: str) -> str:
    """
    Übernimmt die konkrete Autorenlogik aus buch.js:
    - erste Namenszeile im ersten Kapitel -> Autorenbox mit Porträt
    - letzte Namenszeile im letzten Kapitel -> Abschluss mit Signatur
    """
    soup = __import__("bs4").BeautifulSoup(html_text, "html.parser")
    headings = soup.find_all(["h1", "h2"])
    if not headings:
        return str(soup)

    name_regex = re.compile(re.escape(author_name))

    # Kapitelgrenzen anhand der Überschriften.
    top = soup.body if soup.body else soup
    blocks = [x for x in top.find_all(recursive=False) if getattr(x, "name", None)]

    chapter_positions = [
        i for i, block in enumerate(blocks)
        if block.name in ("h1", "h2")
    ]
    if not chapter_positions:
        return str(soup)

    name_positions = [
        i for i, block in enumerate(blocks)
        if name_regex.search(block.get_text(" ", strip=True))
    ]
    if not name_positions:
        return str(soup)

    first_chapter = chapter_positions[0]
    last_chapter = chapter_positions[-1]

    first_name = next((i for i in name_positions if i > first_chapter), None)
    last_name = next((i for i in reversed(name_positions) if i > last_chapter), None)

    # Letztes Kapitel: Abschlussblock mit Signatur.
    if last_name is not None:
        last_block = blocks[-1]
        description = last_block.get_text(" ", strip=True)
        description = description.replace("Autor, Satiriker", "Forscher, Autor")

        target = blocks[last_name]
        target_html = str(target)

        wrapper = soup.new_tag("div", attrs={"class": "autor-abschluss"})
        sig = soup.new_tag("p", attrs={"class": "autor-signatur"})
        sig.string = signature
        wrapper.append(sig)

        name_p = soup.new_tag("p", attrs={"class": "autor-name"})
        # Originales HTML der Namenszeile beibehalten, aber Tags außen entfernen.
        inner = __import__("bs4").BeautifulSoup(
            re.sub(r"^<p>|</p>$", "", target_html),
            "html.parser",
        )
        for child in list(inner.contents):
            name_p.append(child)
        wrapper.append(name_p)

        desc_p = soup.new_tag("p", attrs={"class": "autor-abschluss-text"})
        desc_p.string = description
        wrapper.append(desc_p)

        target.replace_with(wrapper)

        # Wenn der letzte Block nur für die Beschreibung verwendet wurde,
        # entspricht das dem splice() in buch.js.
        if last_block is not target and last_block in blocks:
            last_block.extract()

    # Erstes Kapitel: Vorstellungsbox.
    # Nach der Veränderung oben die Elemente erneut holen.
    blocks = [x for x in top.find_all(recursive=False) if getattr(x, "name", None)]
    chapter_positions = [i for i, block in enumerate(blocks) if block.name in ("h1", "h2")]
    name_positions = [i for i, block in enumerate(blocks) if name_regex.search(block.get_text(" ", strip=True))]

    if chapter_positions and name_positions:
        first_chapter = chapter_positions[0]
        first_name = next((i for i in name_positions if i > first_chapter), None)

        if first_name is not None:
            between = blocks[first_chapter + 1:first_name]

            intro = soup.new_tag("div", attrs={"class": "autor-einleitung"})
            for block in between:
                intro.append(block.extract())

            target = blocks[first_name]
            target_text = target.get_text(" ", strip=True)

            box = soup.new_tag("div", attrs={"class": "autor-box"})

            img = soup.new_tag(
                "img",
                attrs={
                    "class": "autor-foto",
                    "src": image_rel,
                    "alt": f"Porträt von {author_name}",
                },
            )
            box.append(img)

            text_div = soup.new_tag("div")
            name_p = soup.new_tag("p", attrs={"class": "autor-name"})
            name_p.string = target_text
            text_div.append(name_p)

            tagline = soup.new_tag("p", attrs={"class": "autor-tagline"})
            tagline.string = (
                "Experte in allen Gebieten, Spezialist für ungewöhnliche "
                "Lösungen und anerkannter Fachmann für die großen und kleinen "
                "Probleme des modernen Lebens."
            )
            text_div.append(tagline)

            box.append(text_div)

            target.replace_with(box)

            # Intro muss direkt nach der ersten Kapitelüberschrift stehen.
            heading = soup.find(["h1", "h2"])
            if heading:
                heading.insert_after(intro)

    return str(soup)


def make_html(
    content_html: str,
    image_uri: str,
    new_page_per_chapter: bool,
    a5: bool,
) -> str:
    page_width, page_height = page_size(a5)
    content_margin = "20mm" if not a5 else "8mm"

    # image_uri wird absichtlich absolut eingesetzt; Chromium kann dann auch
    # lokal geöffnete Dateien laden.
    return f"""<!doctype html>
<html lang="de">
<head>
<meta charset="utf-8">
<title>Ratgeber</title>
<style>
  @page {{
      size: {page_width} {page_height};
      margin: {content_margin};
  }}

  :root {{
    --color-text: {TEXT};
    --color-muted: {MUTED};
    --color-accent: {ACCENT};
    --color-border: {BORDER};
    --font-display: 'Fraunces', Georgia, serif;
    --font-body: 'Inter', Arial, sans-serif;
  }}

  * {{ box-sizing: border-box; }}

  html, body {{
    margin: 0;
    padding: 0;
    background: white;
    color: var(--color-text);
  }}

  body {{
    font-family: var(--font-body);
    line-height: 1.6;
  }}

  .document {{
      padding: {content_margin};
  }}

  h1, h2, h3 {{
    font-family: var(--font-display);
    font-weight: 600;
    line-height: 1.2;
    color: var(--color-text);
  }}

  h1 {{
    font-family: var(--font-display);
    font-size: 1.9rem;
    line-height: 1.1;
    font-weight: 600;
    letter-spacing: -0.04em;
    color: var(--color-text);
    margin: 10mm 0 12mm;
  }}

  h1::before {{
      content: "RATGEBER";
      display: block;
      font-family: var(--font-body);
      font-size: 0.65rem;
      font-weight: 600;
      letter-spacing: 0.25em;
      color: var(--color-accent);
      margin-bottom: 10px;
  }}

  h1::after {{
    content: "";
    display: block;
    width: 80px;
    height: 3px;
    margin-top: 14px;
    background: var(--color-accent);
  }}

  h2 {{
    font-size: 1.1rem;
    color: var(--color-accent);
    margin: 0 0 16px;
    margin-top: 4mm;
  }}

  h3 {{
    font-size: 0.98rem;
    color: var(--color-accent);
    margin: 18px 0 10px;
  }}

  p {{
    font-family: var(--font-body);
    font-size: 0.86rem;
    line-height: 1.55;
    color: var(--color-text);
    margin: 0 0 16px;
  }}

  strong {{ color: var(--color-accent); }}
  em {{ font-style: italic; }}

  a {{
    color: var(--color-accent);
    text-decoration: underline;
  }}

  blockquote {{
    position: relative;
    margin: 20px 0;
    padding: 0 0 0 16px;
    background: transparent;
    border-left: 2px solid var(--color-accent);
    color: var(--color-text);
    font-family: var(--font-display);
    font-size: 0.95rem;
    line-height: 1.5;
    font-weight: 500;
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  ul, ol {{
    margin: 14px 0 16px;
    padding: 0 0 0 6px;
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  li {{
    position: relative;
    margin: 0 0 5px;
    padding-left: 21px;
    font-size: 0.82rem;
    line-height: 1.48;
    color: var(--color-text);
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  li::before {{
    content: "";
    position: absolute;
    left: 1px;
    top: 0.72em;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--color-accent);
    transform: translateY(-50%);
  }}

  ul,
  ol {{
      list-style: none;
  }}

  hr {{
      border: none;
      margin: 32px 0;
  }}

  table {{
    width: 100%;
    border-collapse: collapse;
    margin: 14px 0 16px;
    font-size: 0.82rem;
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  th, td {{
    padding: 5px 8px;
    border: 1px solid var(--color-border);
    text-align: left;
  }}

  thead {{ background: #E7E0D2; }}

  th {{
    color: var(--color-text);
    font-family: var(--font-display);
    font-weight: 600;
  }}

  img {{
    max-width: 100%;
    height: auto;
  }}

  .autor-einleitung {{
    padding: 14px 16px;
    margin: 32px 0;
    border-left: 3px solid var(--color-accent);
    background: transparent;
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  .autor-box {{
    display: flex;
    align-items: center;
    gap: 10px;
    margin: 48px 0 16px;
    padding-left: 18px;
    border-left: 3px solid var(--color-accent);
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  .autor-foto {{
    width: 64px;
    height: 64px;
    object-fit: cover;
    object-position: center 25%;
    border-radius: 0;
    border: 2px solid rgba(27, 35, 64, 0.12);
    flex-shrink: 0;
  }}

  .autor-box > div {{ flex: 1; }}

  .autor-box .autor-name {{
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    margin: 0;
  }}

  .autor-tagline {{
    font-size: 0.8rem;
    line-height: 1.45;
    margin: 4px 0 0;
    color: var(--color-muted);
  }}

  .autor-abschluss {{
    margin-top: 48px;
    padding-top: 18px;
    break-inside: avoid;
    page-break-inside: avoid;
  }}

  .autor-signatur {{
    font-family: 'Homemade Apple', 'Brush Script MT', cursive;
    font-size: 1.5rem;
    font-weight: 400;
    color: #000;
    letter-spacing: -0.03em;
    transform: rotate(-3deg) skewX(-6deg);
    margin: 56px 0 2px;
    display: block;
  }}

  .autor-name {{
    font-family: var(--font-display);
    font-size: 1rem;
    font-weight: 600;
    color: var(--color-text);
    margin: 0;
  }}

  .autor-abschluss-text {{
    margin-top: 8px;
    font-size: 0.68rem;
    text-transform: none;
    letter-spacing: normal;
    color: var(--color-muted);
  }}

  /* Kapitel beginnen auf einer neuen PDF-Seite. */
  .chapter-start {{
    break-before: page;
    page-break-before: always;
  }}
</style>

<!-- Dieselben Schriftfamilien wie auf der Website; Offline-Fallbacks bleiben aktiv. -->
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:wght@400;500;600;700&family=Homemade+Apple&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body>
<div class="document">
    {content_html}
</div>
</body>
</html>
"""


async def create_pdf(
    html_file: Path,
    output: Path,
    a5: bool,
) -> None:
    async with async_playwright() as p:
        browser = await p.chromium.launch()
        page = await browser.new_page()

        await page.goto(html_file.as_uri(), wait_until="networkidle")

        page_width, page_height = page_size(a5)
        await page.pdf(
            path=str(output),
            width=page_width,
            height=page_height,
            print_background=True,
            prefer_css_page_size=True,

            display_header_footer=True,

            header_template="<div></div>",

            footer_template="""
            <div style="
                width:100%;
                text-align:center;
                font-size:12px;
                color:#666;
                padding-bottom:5mm;
            ">
                <span class="pageNumber"></span>
            </div>
            """,
        )
        await browser.close()


def add_chapter_breaks(html_text: str) -> str:
    soup = __import__("bs4").BeautifulSoup(html_text, "html.parser")

    first_h1_seen = False

    for heading in soup.find_all(["h1", "h2"]):
        if heading.name == "h1":
            if not first_h1_seen:
                first_h1_seen = True
                continue

        classes = heading.get("class", [])
        classes.append("chapter-start")
        heading["class"] = classes

    return str(soup)


def main() -> int:
    args = parse_args()

    try:
        md_files = get_input_files(args.name)
    except FileNotFoundError as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        return 2

    print(f"{len(md_files)} Ratgeber zu verarbeiten:")
    for md_path in md_files:
        print(f"  - {md_path}")

    for md_path in md_files:
        try:
            site_root = find_site_root(md_path, args.site_root)
            image_path = (site_root / AUTHOR_IMAGE).resolve()

            if not image_path.exists():
                print(
                    f"Warnung: Autorenbild nicht gefunden: {image_path}\n"
                    "Die PDF wird trotzdem erzeugt; passe ggf. --site-root oder --author-image an.",
                    file=sys.stderr,
                )

            output = output_path_for(md_path)
            output.parent.mkdir(parents=True, exist_ok=True)

            md_text = md_path.read_text(encoding="utf-8")
            html_text = md_to_html(md_text)
            html_text = strip_bonus_for_pdf(html_text)
            html_text = normalise_headings(html_text, args.new_page_per_chapter)

            image_uri = image_path.as_uri()
            html_text = style_author_mentions(
                html_text,
                site_root=site_root,
                image_rel=image_uri,
                signature=SIGNATURE,
                author_name=AUTHOR_NAME,
            )

            temp_html = output.with_suffix(".pdf_work.html")
            temp_html.write_text(
                make_html(html_text, image_uri, args.new_page_per_chapter, args.a5),
                encoding="utf-8",
            )

            try:
                asyncio.run(create_pdf(temp_html, output, args.a5))
            finally:
                try:
                    temp_html.unlink()
                except OSError:
                    pass

            print(f"PDF erstellt: {output}")
        except Exception:
            traceback.print_exc()
            return 1
        #except Exception as exc:
        #    print(f"Fehler bei {md_path.name}: {exc}", file=sys.stderr)
        #    return 1

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
