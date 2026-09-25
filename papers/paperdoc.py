"""
paperdoc.py — converts a raw paper.md (frontmatter + Markdown) into a
ready-to-compile main.tex for one of the Methodius journal templates.

paper.md format
----------------

The short form — everything but `slug` and `abstract` is looked up in
data/veroeffentlichungen.json via `slug`:

    ---
    slug: empirische-plausibilitaet-datenlage
    abstract: |
      Zusammenfassung des Beitrags. Kann sich über
      mehrere Zeilen erstrecken.
    ---

    ## Einleitung

    Fließtext mit **fett** und *kursiv* gesetzten Stellen.

    ## Fazit

    - Ein Punkt
    - Noch ein Punkt

journal`, `title`, `authors`, `volume`, `issue`, `year`, `date` and `pages` are
filled in from the veroeffentlichungen.json entry whose `slug` matches (its
`band`/`heft` fields become `volume`/`issue`, `seite_start`/`seite_ende`
become `pages`, and `datum` becomes both `date` and `year`). Any of them can
still be given directly in the frontmatter — an explicit value always wins
over the looked-up one, so a paper.md can override a single field (e.g. a
corrected `pages:`) without repeating everything else:

    ---
    slug: empirische-plausibilitaet-datenlage
    journal: Archiv für Ausreichende Evidenz   # overrides the looked-up journal
    pages: 35--52        # overrides the looked-up value
    subtitle: Optionaler Untertitel
    shorttitle: Kurztitel für die Kopfzeile
    keywords:
      - Begriff 1
      - Begriff 2
    abstract: |
      Zusammenfassung des Beitrags.
    ---

    ...

`slug` and `abstract` are always required — `slug` because without it no
lookup is possible. Everything else is optional; the underlying .cls files fall
back to sensible defaults (and `keywords` is simply omitted from the output if
not given — veroeffentlichungen.json has no keywords field, so these are never
looked up, only hand-written).

This is intentionally NOT a general-purpose YAML/Markdown implementation —
just enough of both to cover the fields and formatting a satire paper
typically needs, without adding a dependency beyond the Python standard
library. Anything more exotic (tables, footnotes, citations, raw LaTeX)
should go directly into a hand-written main.tex instead.
"""

from __future__ import annotations

import json
import re
from dataclasses import dataclass, field
from pathlib import Path


class PaperDocError(ValueError):
    """Raised for anything wrong with a paper.md file's structure or content."""


# `slug` is required (not just "title"/"authors") because without it the
# data/veroeffentlichungen.json lookup can't happen at all. `journal` is no
# longer required either — it, too, is normally looked up via `slug` (see
# _PUBLICATION_LOOKUP_FIELDS below).
REQUIRED_FIELDS = ("slug", "abstract")

# Fields that, when missing from the frontmatter, are filled in from the
# matching data/veroeffentlichungen.json entry (looked up via `slug`).
# Maps the frontmatter field name to the JSON entry's field name, as
# returned by lookup_publication() below (see that function for how the
# JSON's own field names, e.g. `band`/`heft`, get there).
_PUBLICATION_LOOKUP_FIELDS = {
    "journal": "journal_name",
    "title": "titel",
    "volume": "volume",
    "issue": "issue",
    "year": "year",
    "date": "date",
    "pages": "pages",
}

DEFAULT_PUBLICATIONS_FILENAME = "veroeffentlichungen.json"

# Maps the full journal name (as written in a paper.md's frontmatter) to the
# corresponding template's slug, i.e. the folder/class name under
# templates_dir (templates/<slug>/<slug>.cls).
JOURNAL_SLUGS = {
    "Schriftenreihe des Methodius-Instituts": "methodiusschriften",
    "Journal für Praktische Fehlorientierung": "fehlorientierung",
    "Archiv für Ausreichende Evidenz": "aevidence",
    "Methodenhefte der Alltagshermeneutik": "alltagshermeneutik",
    "Zeitschrift für Alternative Körperkomposition": "koerperkomposition",
    "Statistische Irrtümer Quarterly": "irrtuemer",
    "Annalen der Bedeutungsüberhöhung": "bedeutungsueberhoehung",
    "Praxisjournal für Evidenznahe Belehrung": "evidenznahebelehrung",
    "Berichte aus der Überdeutungsforschung": "ueberdeutungsforschung",
    "Journal of Recursive Self-Improvement Studies": "recursiveselfimprovement",
    "Zeitschrift für Selektive Beratung": "selektiveberatung",
    "Kritik & Evidenz": "kritikevidenz",
    "Wochenanfangsforschung Quarterly": "wochenanfangsforschung",
    "Journal für Praktische Distanzpflege": "distanzpflege",
    "Zeitschrift für Populäre Grundgesamtheiten": "grundgesamtheiten",
    "Mitteilungen zur Dynamischen Überzeugungsforschung": "ueberzeugungsforschung",
    "Archiv für Aufgeschobene Vorhaben": "aufgeschobenevorhaben",
    "Jahrbuch für Strategische Untätigkeit": "strategischeuntaetigkeit",
    "Zeitschrift für Angewandte Problemunterlassung": "problemunterlassung",
}

# Fields that map directly to a same-named \fieldname{...} command in the
# .cls files, emitted only if present.
OPTIONAL_SCALAR_FIELDS = {
    "subtitle": "subtitle",
    "shorttitlecommand": "shorttitlecommand",  # allows "shorttitlecommand:" too
    "volume": "journalvolume",
    "issue": "journalissue",
    "year": "journalyear",
    "date": "articledate",
    "pages": "articlepages",
}


@dataclass
class PaperMeta:
    journal: str
    slug: str
    title: str
    authors: list[str]
    abstract: str
    subtitle: str | None = None
    shorttitle: str | None = None
    keywords: list[str] = field(default_factory=list)
    volume: str | None = None
    issue: str | None = None
    year: str | None = None
    date: str | None = None
    pages: str | None = None


# ---------------------------------------------------------------------------
# Frontmatter parsing
# ---------------------------------------------------------------------------

def split_frontmatter(text: str) -> tuple[str, str]:
    """Split a paper.md's raw text into (frontmatter, body)."""
    lines = text.splitlines()
    idx = 0
    while idx < len(lines) and lines[idx].strip() == "":
        idx += 1
    if idx >= len(lines) or lines[idx].strip() != "---":
        raise PaperDocError(
            "paper.md muss mit einer Frontmatter-Sektion beginnen "
            "(eine Zeile mit genau '---')."
        )
    start = idx + 1
    end = None
    for i in range(start, len(lines)):
        if lines[i].strip() == "---":
            end = i
            break
    if end is None:
        raise PaperDocError(
            "Die Frontmatter-Sektion wurde nicht mit '---' geschlossen."
        )
    frontmatter = "\n".join(lines[start:end])
    body = "\n".join(lines[end + 1:])
    return frontmatter, body


def _strip_quotes(value: str) -> str:
    value = value.strip()
    if len(value) >= 2 and value[0] == value[-1] and value[0] in "\"'":
        return value[1:-1]
    return value


def parse_frontmatter(frontmatter: str) -> dict:
    """Parse the small YAML subset described in the module docstring."""
    lines = frontmatter.splitlines()
    data: dict = {}
    i = 0
    key_line_re = re.compile(r"^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$")

    while i < len(lines):
        raw = lines[i]
        if raw.strip() == "" or raw.lstrip().startswith("#"):
            i += 1
            continue

        if raw[:1] in (" ", "\t"):
            raise PaperDocError(
                f"Unerwartete Einrückung in der Frontmatter, Zeile {i + 1}: "
                f"{raw!r}"
            )

        match = key_line_re.match(raw)
        if not match:
            raise PaperDocError(
                f"Konnte Frontmatter-Zeile {i + 1} nicht lesen: {raw!r}"
            )
        key, rest = match.group(1), match.group(2).strip()
        i += 1

        if rest == "|":
            # Block scalar: collect indented lines until dedent/EOF.
            block_lines: list[str] = []
            indent = None
            while i < len(lines):
                line = lines[i]
                if line.strip() == "":
                    block_lines.append("")
                    i += 1
                    continue
                current_indent = len(line) - len(line.lstrip(" "))
                if current_indent == 0:
                    break
                if indent is None:
                    indent = current_indent
                if current_indent < indent:
                    break
                block_lines.append(line[indent:])
                i += 1
            # Trim trailing blank lines from the block.
            while block_lines and block_lines[-1] == "":
                block_lines.pop()
            data[key] = "\n".join(block_lines)

        elif rest == "":
            # Either a list (next lines start with "- ") or an empty scalar.
            items: list[str] = []
            while i < len(lines):
                line = lines[i]
                stripped = line.strip()
                if stripped.startswith("- "):
                    items.append(_strip_quotes(stripped[2:]))
                    i += 1
                elif stripped == "":
                    i += 1
                else:
                    break
            data[key] = items

        else:
            data[key] = _strip_quotes(rest)

    return data


# ---------------------------------------------------------------------------
# data/veroeffentlichungen.json lookup
# ---------------------------------------------------------------------------
#
# Each entry looks like:
#   {
#     "datum": "2026-11-27",
#     "titel": "Empirische Plausibilität bei unvollständiger Datenlage",
#     "autoren": ["Dr. Konrad P. Huber", "Dr. Maximilian Methodius"],
#     "beschreibung": "...",             (not used here — see abstract below)
#     "journal": "Archiv für Ausreichende Evidenz",   (bare name, no "Bd./Heft")
#     "band": 14,
#     "heft": 2,
#     "seite_start": 35,
#     "seite_ende": 51,
#     "slug": "empirische-plausibilitaet-datenlage"
#   }
#
# `beschreibung` is a short one-line description of the publication, not the
# paper's abstract, so it is intentionally never used as a fallback for
# `abstract` — the abstract is always written by hand in the paper.md.

_ISO_DATE_RE = re.compile(r"^(?P<year>\d{4})-(?P<month>\d{2})-(?P<day>\d{2})$")


def _iso_date_to_de(value: str) -> str:
    """Turn "2026-11-27" into "27.11.2026"; return unchanged if it doesn't match."""
    match = _ISO_DATE_RE.match(value.strip())
    if not match:
        return value
    return f"{match.group('day')}.{match.group('month')}.{match.group('year')}"


def load_publications(data_path: Path) -> dict[str, dict]:
    """Load veroeffentlichungen.json and index its entries by `slug`."""
    if not data_path.exists():
        raise PaperDocError(f"Metadaten-Datei nicht gefunden: {data_path}")
    try:
        raw = json.loads(data_path.read_text(encoding="utf-8"))
    except json.JSONDecodeError as exc:
        raise PaperDocError(f"{data_path} ist kein gültiges JSON: {exc}") from exc
    if not isinstance(raw, list):
        raise PaperDocError(f"{data_path}: erwartet eine JSON-Liste von Einträgen.")

    by_slug: dict[str, dict] = {}
    for entry in raw:
        entry_slug = entry.get("slug") if isinstance(entry, dict) else None
        if entry_slug:
            by_slug[str(entry_slug)] = entry
    return by_slug


def lookup_publication(slug: str, data_path: Path, source: Path) -> dict:
    """Resolve a `slug` to the fields build_paper_meta needs, or raise."""
    publications = load_publications(data_path)
    entry = publications.get(slug)
    if entry is None:
        known = "\n".join(f"  - {s}" for s in sorted(publications))
        raise PaperDocError(
            f"{source}: slug '{slug}' wurde in {data_path} nicht gefunden.\n"
            f"Bekannte slugs:\n{known}"
        )

    # "journal" is already the bare journal name in this schema (unlike an
    # earlier version of veroeffentlichungen.json, it does NOT contain a
    # trailing ", Bd. X, Heft Y" that would need to be split off). Volume
    # and issue come from the separate "band"/"heft" fields instead.
    journal_name = entry.get("journal")
    volume = entry.get("band")
    issue = entry.get("heft")

    seite_start = entry.get("seite_start")
    seite_ende = entry.get("seite_ende")
    pages = (
        f"{seite_start}--{seite_ende}"
        if seite_start is not None and seite_ende is not None
        else None
    )

    datum = entry.get("datum")
    date_de = _iso_date_to_de(str(datum)) if datum else None
    year_match = _ISO_DATE_RE.match(str(datum)) if datum else None
    year = year_match.group("year") if year_match else None

    autoren = entry.get("autoren")
    authors = [str(a) for a in autoren] if isinstance(autoren, list) else []

    return {
        "titel": entry.get("titel"),
        "authors": authors,
        "journal_name": str(journal_name) if journal_name is not None else None,
        "volume": str(volume) if volume is not None else None,
        "issue": str(issue) if issue is not None else None,
        "year": year,
        "date": date_de,
        "pages": pages,
    }


def build_paper_meta(data: dict, source: Path, data_path: Path) -> PaperMeta:
    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        raise PaperDocError(
            f"{source}: Pflichtfelder fehlen oder sind leer: {', '.join(missing)}"
        )

    slug = data["slug"]
    if not isinstance(slug, str):
        raise PaperDocError(f"{source}: 'slug' darf keine Liste sein.")
    publication = lookup_publication(slug.strip(), data_path, source)

    def scalar(name: str) -> str | None:
        value = data.get(name)
        if value in (None, ""):
            return None
        if isinstance(value, list):
            raise PaperDocError(f"{source}: '{name}' darf keine Liste sein.")
        return str(value)

    def resolved(name: str) -> str | None:
        """Explicit frontmatter value wins; otherwise fall back to the
        matching veroeffentlichungen.json field."""
        explicit = scalar(name)
        if explicit is not None:
            return explicit
        value = publication.get(_PUBLICATION_LOOKUP_FIELDS.get(name, name))
        if value not in (None, ""):
            return str(value)
        return None

    title = resolved("title")
    if title is None:
        raise PaperDocError(
            f"{source}: 'title' fehlt und der Eintrag zu slug '{slug}' in "
            f"{data_path.name} hat kein 'titel'-Feld. Bitte 'title' angeben "
            f"oder den JSON-Eintrag ergänzen."
        )

    journal = resolved("journal")
    if journal is None:
        raise PaperDocError(
            f"{source}: 'journal' fehlt und der Eintrag zu slug '{slug}' in "
            f"{data_path.name} hat kein 'journal'-Feld. Bitte 'journal' "
            f"angeben oder den JSON-Eintrag ergänzen."
        )

    authors_fm = data.get("authors")
    if authors_fm:
        if not isinstance(authors_fm, list):
            raise PaperDocError(
                f"{source}: 'authors' muss eine Liste sein, z.B.\n"
                "  authors:\n    - Dr. Vorname Nachname"
            )
        authors = [str(a) for a in authors_fm]
    elif publication["authors"]:
        authors = publication["authors"]
    else:
        raise PaperDocError(
            f"{source}: 'authors' fehlt und der Eintrag zu slug '{slug}' in "
            f"{data_path.name} hat kein (nicht-leeres) 'autoren'-Feld. Bitte "
            f"'authors' angeben oder den JSON-Eintrag ergänzen."
        )

    keywords = data.get("keywords", [])
    if keywords and not isinstance(keywords, list):
        raise PaperDocError(f"{source}: 'keywords' muss eine Liste sein.")

    return PaperMeta(
        journal=journal,
        slug=slug.strip(),
        title=title,
        authors=authors,
        abstract=str(data["abstract"]),
        subtitle=scalar("subtitle"),
        shorttitle=scalar("shorttitle") or scalar("shorttitlecommand"),
        keywords=[str(k) for k in keywords],
        volume=resolved("volume"),
        issue=resolved("issue"),
        year=resolved("year"),
        date=resolved("date"),
        pages=resolved("pages"),
    )


def resolve_journal_slug(journal: str) -> str:
    """Look up the template slug for a full journal name.

    Raises a PaperDocError listing the known journal names if `journal`
    isn't in JOURNAL_SLUGS (e.g. a typo, or a journal not yet templated).
    """
    slug = JOURNAL_SLUGS.get(journal)
    if slug is not None:
        return slug
    known = "\n".join(f"  - {name}" for name in sorted(JOURNAL_SLUGS))
    raise PaperDocError(
        f"Unbekanntes journal: '{journal}'. Bekannte Journalnamen:\n{known}"
    )


def validate_journal(journal: str, templates_dir: Path) -> str:
    """Resolve `journal` to its slug and confirm the .cls file exists.

    Returns the resolved slug on success.
    """
    slug = resolve_journal_slug(journal)
    candidate = templates_dir / slug / f"{slug}.cls"
    if candidate.exists():
        return slug
    available = sorted(
        p.name for p in templates_dir.iterdir()
        if p.is_dir() and (p / f"{p.name}.cls").exists()
    ) if templates_dir.is_dir() else []
    raise PaperDocError(
        f"journal '{journal}' wird als '{slug}' geführt, aber "
        f"{candidate} wurde nicht gefunden. "
        f"Verfügbare Templates: {', '.join(available) or '(keine gefunden)'}"
    )


# ---------------------------------------------------------------------------
# Markdown (a small subset) -> LaTeX
# ---------------------------------------------------------------------------

_LATEX_ESCAPE_MAP = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}


def escape_latex(text: str) -> str:
    return "".join(_LATEX_ESCAPE_MAP.get(ch, ch) for ch in text)


def _inline_to_latex(text: str) -> str:
    """Escape LaTeX specials while preserving **bold**, *italic*, `code`."""
    placeholders: list[str] = []

    def stash(latex_snippet: str) -> str:
        placeholders.append(latex_snippet)
        return f"\x00{len(placeholders) - 1}\x00"

    # Order matters: bold before italic, so a leftover single '*' from a
    # '**' pair is never mistaken for italic markup.
    text = re.sub(
        r"\*\*(.+?)\*\*",
        lambda m: stash(r"\textbf{" + escape_latex(m.group(1)) + "}"),
        text,
    )
    text = re.sub(
        r"\*(.+?)\*",
        lambda m: stash(r"\emph{" + escape_latex(m.group(1)) + "}"),
        text,
    )
    text = re.sub(
        r"`(.+?)`",
        lambda m: stash(r"\texttt{" + escape_latex(m.group(1)) + "}"),
        text,
    )
    # Cross-reference to a figure/table, e.g. "Tabelle @tab:ergebnisse".
    text = re.sub(
        _CROSSREF_RE,
        lambda m: stash(r"\ref{" + m.group(1) + "}"),
        text,
    )

    text = escape_latex(text)

    for i, snippet in enumerate(placeholders):
        text = text.replace(f"\x00{i}\x00", snippet)
    return text


_HEADING_RE = re.compile(r"^(#{2,4})\s+(.*)$")
_BULLET_RE = re.compile(r"^[-*]\s+(.*)$")
_NUMBERED_RE = re.compile(r"^\d+\.\s+(.*)$")

_SECTION_COMMANDS = {2: "section", 3: "subsection", 4: "subsubsection"}

# A GFM-style table separator row: cells of dashes, optionally colon-flanked
# for alignment, e.g. "---", ":---", "---:", ":---:", separated by "|".
_TABLE_SEPARATOR_RE = re.compile(r"^\|?\s*:?-+:?\s*(\|\s*:?-+:?\s*)*\|?$")

# A caption line for the table immediately above it, Pandoc-style:
#   Table: Caption text {#tab:some-id}
# The {#tab:...} part is optional.
_TABLE_CAPTION_RE = re.compile(r"^Table:\s*(.*?)\s*(?:\{#(tab:[\w-]+)\})?\s*$")

# A standalone image, Pandoc's "implicit figure" syntax:
#   ![Caption text](path/to/file.png){#fig:some-id width=80%}
# The {...} attribute block is optional; so is the caption (empty [] is OK).
_FIGURE_RE = re.compile(
    r"^!\[(?P<caption>[^\]]*)\]\((?P<path>[^\s)]+)(?:\s+\"[^\"]*\")?\)"
    r"(?:\{(?P<attrs>[^}]*)\})?$"
)

# Cross-reference to a figure/table label in running text: @fig:some-id or
# @tab:some-id, turned into \ref{fig:some-id} / \ref{tab:some-id}.
_CROSSREF_RE = re.compile(r"@((?:fig|tab):[\w-]+)")


def _split_table_row(line: str) -> list[str]:
    """Split a "| a | b |" (or "a | b") row into ["a", "b"], honoring \\|."""
    line = line.strip().replace(r"\|", "\x01")
    if line.startswith("|"):
        line = line[1:]
    if line.endswith("|"):
        line = line[:-1]
    return [cell.replace("\x01", "|").strip() for cell in line.split("|")]


def _table_column_alignment(separator_cells: list[str]) -> list[str]:
    """Map GFM separator cells (---, :---, ---:, :---:) to LaTeX l/c/r."""
    aligns = []
    for cell in separator_cells:
        cell = cell.strip()
        left, right = cell.startswith(":"), cell.endswith(":")
        aligns.append("c" if left and right else "r" if right else "l")
    return aligns


def _table_to_latex(rows: list[list[str]], aligns: list[str],
                     caption: str | None, label: str | None) -> str:
    ncols = len(rows[0])
    col_spec = "".join((aligns + ["l"] * ncols)[:ncols])
    lines = ["\\begin{table}[htbp]", "  \\centering"]
    if caption:
        lines.append(f"  \\caption{{{_inline_to_latex(caption)}}}")
    if label:
        lines.append(f"  \\label{{{label}}}")
    lines.append(f"  \\begin{{tabular}}{{{col_spec}}}")
    lines.append("    \\toprule")
    lines.append("    " + " & ".join(_inline_to_latex(c) for c in rows[0]) + r" \\")
    lines.append("    \\midrule")
    for row in rows[1:]:
        lines.append("    " + " & ".join(_inline_to_latex(c) for c in row) + r" \\")
    lines.append("    \\bottomrule")
    lines.append("  \\end{tabular}")
    lines.append("\\end{table}")
    return "\n".join(lines)


def _parse_figure_attrs(attrs_str: str | None) -> dict[str, str]:
    """Parse a Pandoc-style {#id key=value key2="quoted value"} block."""
    result: dict[str, str] = {}
    if not attrs_str:
        return result
    token_re = re.compile(r'#([\w:-]+)|([\w-]+)=("([^"]*)"|\S+)')
    for m in token_re.finditer(attrs_str):
        if m.group(1):
            result["id"] = m.group(1)
        else:
            result[m.group(2)] = m.group(4) if m.group(4) is not None else m.group(3)
    return result


def _figure_width_to_latex(width: str | None) -> str:
    if not width:
        return "\\linewidth"
    width = width.strip()
    if width.endswith("%"):
        try:
            return f"{float(width[:-1]) / 100:g}\\linewidth"
        except ValueError:
            return "\\linewidth"
    return width  # a raw LaTeX length such as "5cm" or "0.8\\textwidth"


def _figure_to_latex(match: re.Match, paper_dir: Path, source: Path) -> str:
    caption = match.group("caption").strip()
    image_path_str = match.group("path").strip()
    attrs = _parse_figure_attrs(match.group("attrs"))

    resolved_path = paper_dir / image_path_str
    if not resolved_path.exists():
        raise PaperDocError(
            f"{source}: Bilddatei nicht gefunden: {resolved_path} "
            f"(referenziert als '{image_path_str}')"
        )

    label = attrs.get("id")
    if label and not label.startswith("fig:"):
        raise PaperDocError(
            f"{source}: Abbildungs-Label muss mit 'fig:' beginnen, nicht "
            f"'{label}' (in {match.group(0)!r})."
        )

    width_latex = _figure_width_to_latex(attrs.get("width"))
    lines = [
        "\\begin{figure}[htbp]",
        "  \\centering",
        f"  \\includegraphics[width={width_latex}]{{{image_path_str}}}",
    ]
    if caption:
        lines.append(f"  \\caption{{{_inline_to_latex(caption)}}}")
    if label:
        lines.append(f"  \\label{{{label}}}")
    lines.append("\\end{figure}")
    return "\n".join(lines)


def markdown_to_latex(body: str, source: Path) -> str:
    """Convert the small Markdown subset described in the module docstring.

    `source` is the paper.md path: its parent directory is where relative
    figure paths (e.g. "figures/diagramm.png") are resolved from, and it's
    used to name the file in error messages (missing image, bad label).
    """
    paper_dir = source.parent

    # Normalize line endings and split into blank-line-separated blocks,
    # while keeping heading lines and standalone figures as their own
    # single-line blocks (a figure must stand alone in its paragraph, per
    # Pandoc's "implicit figure" convention, so it's detected the same way
    # a heading is: nothing else is allowed to share its block).
    lines = body.replace("\r\n", "\n").split("\n")

    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if line.strip() == "":
            if current:
                blocks.append(current)
                current = []
            continue
        if _HEADING_RE.match(line) or _FIGURE_RE.match(line.strip()):
            if current:
                blocks.append(current)
                current = []
            blocks.append([line])
            continue
        current.append(line)
    if current:
        blocks.append(current)

    out: list[str] = []
    idx = 0
    while idx < len(blocks):
        block = blocks[idx]

        heading = _HEADING_RE.match(block[0]) if len(block) == 1 else None
        if heading:
            level = len(heading.group(1))
            command = _SECTION_COMMANDS.get(level, "subsubsection")
            out.append(f"\\{command}{{{_inline_to_latex(heading.group(2).strip())}}}")
            idx += 1
            continue

        figure = _FIGURE_RE.match(block[0].strip()) if len(block) == 1 else None
        if figure:
            out.append(_figure_to_latex(figure, paper_dir, source))
            idx += 1
            continue

        if (
            len(block) >= 2
            and "|" in block[0]
            and _TABLE_SEPARATOR_RE.match(block[1].strip())
        ):
            header = _split_table_row(block[0])
            aligns = _table_column_alignment(_split_table_row(block[1]))
            rows = [header] + [_split_table_row(l) for l in block[2:]]

            caption = label = None
            if idx + 1 < len(blocks) and len(blocks[idx + 1]) == 1:
                cap_match = _TABLE_CAPTION_RE.match(blocks[idx + 1][0].strip())
                if cap_match:
                    caption = cap_match.group(1).strip() or None
                    label = cap_match.group(2)
                    idx += 1  # this block was the caption, consume it too

            out.append(_table_to_latex(rows, aligns, caption, label))
            idx += 1
            continue

        # A new list item starts on a line matching the marker; any line
        # that doesn't (a wrapped continuation line) is appended to the
        # current item, so multi-line items are not mistaken for prose.
        first_stripped = block[0].strip()
        is_bullet_list = bool(_BULLET_RE.match(first_stripped))
        is_numbered_list = bool(_NUMBERED_RE.match(first_stripped))
        if is_bullet_list or is_numbered_list:
            item_re = _BULLET_RE if is_bullet_list else _NUMBERED_RE
            items: list[str] = []
            for line in block:
                stripped = line.strip()
                match = item_re.match(stripped)
                if match:
                    items.append(match.group(1))
                elif items:
                    items[-1] += " " + stripped
                else:
                    items = []
                    break
            if items:
                env = "itemize" if is_bullet_list else "enumerate"
                out.append(
                    f"\\begin{{{env}}}\n"
                    + "\n".join(f"  \\item {_inline_to_latex(item)}" for item in items)
                    + f"\n\\end{{{env}}}"
                )
                idx += 1
                continue

        paragraph = " ".join(l.strip() for l in block)
        out.append(_inline_to_latex(paragraph))
        idx += 1

    return "\n\n".join(out)


# ---------------------------------------------------------------------------
# main.tex assembly
# ---------------------------------------------------------------------------

def build_tex(meta: PaperMeta, body_latex: str, source_name: str, template_slug: str) -> str:
    lines: list[str] = []
    lines.append(f"% AUTO-GENERATED von generate.py aus {source_name}.")
    lines.append("% Bitte NICHT von Hand bearbeiten – Änderungen gehen beim")
    lines.append("% nächsten Lauf verloren. Bearbeite stattdessen die .md-Datei.")
    lines.append(f"% journal: {meta.journal}  (Template: {template_slug})")
    # `slug` (the paper's own identifier, from veroeffentlichungen.json) is
    # emitted as a machine-readable comment so generate.py can name output
    # files after it even when compiling this main.tex directly, without
    # going back through the original paper.md.
    lines.append(f"% slug: {meta.slug}")
    lines.append(f"\\documentclass{{{template_slug}}}")
    lines.append("")

    if meta.volume:
        lines.append(f"\\journalvolume{{{meta.volume}}}")
    if meta.issue:
        lines.append(f"\\journalissue{{{meta.issue}}}")
    if meta.year:
        lines.append(f"\\journalyear{{{meta.year}}}")
    if meta.date:
        lines.append(f"\\articledate{{{meta.date}}}")
    if meta.pages:
        lines.append(f"\\articlepages{{{meta.pages}}}")

        # Seitenzähler auf die erste Seite des Beitrags setzen
        start_page = meta.pages.split("--", 1)[0].strip()
        if start_page.isdigit():
            lines.append(f"\\setcounter{{page}}{{{start_page}}}")

    lines.append("")

    lines.append(f"\\title{{{escape_latex(meta.title)}}}")
    lines.append("")
    if meta.subtitle:
        lines.append(f"\\subtitle{{{escape_latex(meta.subtitle)}}}")
        lines.append("")

    authors_joined = "\n  \\and\n  ".join(escape_latex(a) for a in meta.authors)
    lines.append("\\author{\n  " + authors_joined + "\n}")
    lines.append("")

    if meta.shorttitle:
        lines.append(f"\\shorttitlecommand{{{escape_latex(meta.shorttitle)}}}")
        lines.append("")

    if meta.keywords:
        lines.append(
            "\\articlekeywords{\n  "
            + "; ".join(escape_latex(k) for k in meta.keywords)
            + "\n}"
        )
        lines.append("")

    lines.append("\\abstracttext{\n" + escape_latex(meta.abstract) + "\n}")
    lines.append("")

    lines.append("\\begin{document}")
    lines.append("")
    lines.append(body_latex)
    lines.append("")
    lines.append("\\end{document}")
    lines.append("")

    return "\n".join(lines)


def convert_paper_md(
    md_path: Path,
    templates_dir: Path,
    data_path: Path | None = None,
) -> tuple[str, str]:
    """Read a paper.md file and return (main.tex source, paper slug).

    The paper slug (`meta.slug`, from the paper.md's `slug:` field) is
    returned alongside the .tex source so callers — namely generate.py —
    can use it to name output files after the paper rather than after its
    folder.

    `data_path` is the veroeffentlichungen.json used to resolve a paper.md's
    `slug`, if given. Defaults to data/veroeffentlichungen.json at the
    project root — i.e. templates_dir.parent.parent / "data" / ..., since
    `templates_dir` (e.g. .../papers/templates) lives inside the "papers"
    folder alongside the paper folders and these .py files, while "data" is
    a sibling of "papers" one level further up, not of "templates" itself.
    Pass `data_path` explicitly to override.
    """
    if data_path is None:
        data_path = templates_dir.parent.parent / "data" / DEFAULT_PUBLICATIONS_FILENAME
    text = md_path.read_text(encoding="utf-8")
    frontmatter_text, body_text = split_frontmatter(text)
    data = parse_frontmatter(frontmatter_text)
    meta = build_paper_meta(data, md_path, data_path)
    template_slug = validate_journal(meta.journal, templates_dir)
    body_latex = markdown_to_latex(body_text, md_path)
    tex_source = build_tex(meta, body_latex, md_path.name, template_slug)
    return tex_source, meta.slug
