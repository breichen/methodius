"""
paperdoc.py — converts a raw paper.md (frontmatter + Markdown) into a
ready-to-compile main.tex for one of the Methodius journal templates.

paper.md format
----------------

    ---
    journal: Archiv für Ausreichende Evidenz
    title: Titel des Beitrags
    subtitle: Optionaler Untertitel
    shorttitle: Kurztitel für die Kopfzeile
    authors:
      - Dr. Vorname Nachname
      - Prof. Dr. Zweite Person
    keywords:
      - Begriff 1
      - Begriff 2
    volume: 14
    issue: 2
    year: 2026
    date: 27.11.2026
    pages: 35--51
    abstract: |
      Zusammenfassung des Beitrags. Kann sich über
      mehrere Zeilen erstrecken.
    ---

    ## Einleitung

    Fließtext mit **fett** und *kursiv* gesetzten Stellen.

    ## Fazit

    - Ein Punkt
    - Noch ein Punkt

Only `journal`, `title`, `authors` and `abstract` are required. Everything
else is optional; the underlying .cls files fall back to sensible defaults
(and `keywords` is simply omitted from the output if not given).

This is intentionally NOT a general-purpose YAML/Markdown implementation —
just enough of both to cover the fields and formatting a satire paper
typically needs, without adding a dependency beyond the Python standard
library. Anything more exotic (tables, footnotes, citations, raw LaTeX)
should go directly into a hand-written main.tex instead.
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from pathlib import Path


class PaperDocError(ValueError):
    """Raised for anything wrong with a paper.md file's structure or content."""


REQUIRED_FIELDS = ("journal", "title", "authors", "abstract")

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


def build_paper_meta(data: dict, source: Path) -> PaperMeta:
    missing = [f for f in REQUIRED_FIELDS if not data.get(f)]
    if missing:
        raise PaperDocError(
            f"{source}: Pflichtfelder fehlen oder sind leer: {', '.join(missing)}"
        )

    authors = data["authors"]
    if not isinstance(authors, list) or not authors:
        raise PaperDocError(
            f"{source}: 'authors' muss eine nicht-leere Liste sein, z.B.\n"
            "  authors:\n    - Dr. Vorname Nachname"
        )

    keywords = data.get("keywords", [])
    if keywords and not isinstance(keywords, list):
        raise PaperDocError(f"{source}: 'keywords' muss eine Liste sein.")

    def scalar(name: str) -> str | None:
        value = data.get(name)
        if value in (None, ""):
            return None
        if isinstance(value, list):
            raise PaperDocError(f"{source}: '{name}' darf keine Liste sein.")
        return str(value)

    return PaperMeta(
        journal=str(data["journal"]).strip(),
        title=str(data["title"]),
        authors=[str(a) for a in authors],
        abstract=str(data["abstract"]),
        subtitle=scalar("subtitle"),
        shorttitle=scalar("shorttitle") or scalar("shorttitlecommand"),
        keywords=[str(k) for k in keywords],
        volume=scalar("volume"),
        issue=scalar("issue"),
        year=scalar("year"),
        date=scalar("date"),
        pages=scalar("pages"),
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

    text = escape_latex(text)

    for i, snippet in enumerate(placeholders):
        text = text.replace(f"\x00{i}\x00", snippet)
    return text


_HEADING_RE = re.compile(r"^(#{2,4})\s+(.*)$")
_BULLET_RE = re.compile(r"^[-*]\s+(.*)$")
_NUMBERED_RE = re.compile(r"^\d+\.\s+(.*)$")

_SECTION_COMMANDS = {2: "section", 3: "subsection", 4: "subsubsection"}


def markdown_to_latex(body: str) -> str:
    """Convert the small Markdown subset described in the module docstring."""
    # Normalize line endings and split into blank-line-separated blocks,
    # while keeping heading lines as their own single-line blocks.
    lines = body.replace("\r\n", "\n").split("\n")

    blocks: list[list[str]] = []
    current: list[str] = []
    for line in lines:
        if line.strip() == "":
            if current:
                blocks.append(current)
                current = []
            continue
        if _HEADING_RE.match(line):
            if current:
                blocks.append(current)
                current = []
            blocks.append([line])
            continue
        current.append(line)
    if current:
        blocks.append(current)

    out: list[str] = []
    for block in blocks:
        heading = _HEADING_RE.match(block[0]) if len(block) == 1 else None
        if heading:
            level = len(heading.group(1))
            command = _SECTION_COMMANDS.get(level, "subsubsection")
            out.append(f"\\{command}{{{_inline_to_latex(heading.group(2).strip())}}}")
            continue

        if all(_BULLET_RE.match(l.strip()) for l in block):
            items = [_BULLET_RE.match(l.strip()).group(1) for l in block]
            out.append(
                "\\begin{itemize}\n"
                + "\n".join(f"  \\item {_inline_to_latex(item)}" for item in items)
                + "\n\\end{itemize}"
            )
            continue

        if all(_NUMBERED_RE.match(l.strip()) for l in block):
            items = [_NUMBERED_RE.match(l.strip()).group(1) for l in block]
            out.append(
                "\\begin{enumerate}\n"
                + "\n".join(f"  \\item {_inline_to_latex(item)}" for item in items)
                + "\n\\end{enumerate}"
            )
            continue

        paragraph = " ".join(l.strip() for l in block)
        out.append(_inline_to_latex(paragraph))

    return "\n\n".join(out)


# ---------------------------------------------------------------------------
# main.tex assembly
# ---------------------------------------------------------------------------

def build_tex(meta: PaperMeta, body_latex: str, source_name: str, slug: str) -> str:
    lines: list[str] = []
    lines.append(f"% AUTO-GENERATED von generate.py aus {source_name}.")
    lines.append("% Bitte NICHT von Hand bearbeiten – Änderungen gehen beim")
    lines.append("% nächsten Lauf verloren. Bearbeite stattdessen die .md-Datei.")
    lines.append(f"% journal: {meta.journal}  (Template: {slug})")
    lines.append(f"\\documentclass{{{slug}}}")
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


def convert_paper_md(md_path: Path, templates_dir: Path) -> str:
    """Read a paper.md file and return the generated main.tex source."""
    text = md_path.read_text(encoding="utf-8")
    frontmatter_text, body_text = split_frontmatter(text)
    data = parse_frontmatter(frontmatter_text)
    meta = build_paper_meta(data, md_path)
    slug = validate_journal(meta.journal, templates_dir)
    body_latex = markdown_to_latex(body_text)
    return build_tex(meta, body_latex, md_path.name, slug)