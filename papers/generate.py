#!/usr/bin/env python3
"""
Methodius Paper Generator

Usage:
    python generate.py                            # ALL papers in md/papers/
    python generate.py --md-dir pfad/zum/ordner   # all papers in another folder
    python generate.py mein-satire-artikel
    python generate.py mein-satire-artikel.md --spread
    python generate.py papers/example-aevidence/main.tex

The Markdown files of the papers lie directly in md/papers/, each with its
own name (mein-satire-artikel.md, ...) — a folder parallel to the papers/
folder this script sits in:

    <project>/
        papers/      generate.py, paperdoc.py, templates/, output/, ...
        md/papers/   mein-satire-artikel.md, anderes-paper.md, figures/, ...
        data/        veroeffentlichungen.json

For a Markdown paper, the input can therefore be just the file name, with
or without the ".md" ("mein-satire-artikel" or "mein-satire-artikel.md") —
it is looked up in md/papers/ first. A full path (absolute, or relative to
the current directory) to any .md or main.tex works as well.

Without any input, every paper in the folder is processed: each .md file
directly in md/papers/, in alphabetical order. Files whose name starts
with "_" or "." (e.g. "_template.md") are skipped. Papers are built one
after the other and independently — one that fails doesn't stop the
others; a summary at the end lists the results and the exit code is 1 if
any paper failed. --md-dir PATH points the generator at a different folder
than md/papers/ (for the batch run and for looking up a single paper's
file name alike). --spread applies to every paper of the run.

Relative paths inside a Markdown file (figures, script data) are resolved
from the folder the .md file lies in, i.e. md/papers/ itself.

The script:
0. if given a paper.md (frontmatter + Markdown) instead of a .tex file,
   first generates a main.tex from it — this is the "extra first output"
   step, copied to output/tex/ so it's visible alongside the PDF/PNG
   outputs,
1. finds the journal template (templates/<name>/<name>.cls) that the paper's
   \\documentclass refers to and makes it visible to LaTeX,
2. compiles the LaTeX file twice with LuaLaTeX,
2b. checks the compiled PDF's real page count against the end page declared
    in \\articlepages{start--end}. If they disagree, the true end page
    (start + actual page count - 1) is written back into main.tex and the
    file is recompiled — but only for a main.tex paperdoc.py generated
    (marked "AUTO-GENERATED"); a hand-written main.tex is only warned
    about, never rewritten. Either way, an unmissable console banner marks
    the mismatch so 'seite_ende' in data/veroeffentlichungen.json (and any
    later paper's 'seite_start' in the same Heft) doesn't quietly drift out
    of sync with what the PDF actually contains,
3. copies the resulting PDF to output/pdf,
4. renders a PNG preview if ImageMagick or pdftoppm is available:
   - by default, just the first page;
   - with --spread, page 1 and page 2 side by side, like an open magazine
     spread. If the paper only has one page, a blank second page is added
     so the spread still looks like a real double page. This mode needs
     Pillow (`pip install Pillow`).

Every output file (the main.tex copy in output/tex, the PDF, the PNG) is
named after the paper's own slug (its `slug:` field, from paper.md /
data/veroeffentlichungen.json) rather than its folder, so a paper's outputs
stay identifiably its own wherever the folder is named. This works for a
plain main.tex too, as long as it still carries the "% slug: ..." comment
a paper.md-based generation writes into it; without that comment (a fully
hand-written main.tex with no paper.md in its history), the folder name is
used instead, exactly as before.

Nothing is left behind outside output/: the only files this script leaves
on disk are output/tex/<slug>.tex, output/pdf/<slug>.pdf and
output/png/<slug>.png. Everything else it produces on the way — the
generated main.tex, LaTeX's .aux/.log/.out files and the intermediate
main.pdf, images and scripts generated from figure code blocks, page
previews for --spread — is written to a temporary folder (in the system's
temp directory, not in the project) that is deleted at the end of every
run, successful or not. Python doesn't write __pycache__ folders either.
The folder the paper lies in (the .md files, figures/, a hand-written
main.tex, ...) is only ever read, never written to.

paper.md is optional: a hand-written main.tex can still be passed directly
and is compiled exactly as before. See paperdoc.py for the paper.md format.
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

# Must be set before `import paperdoc`: otherwise Python writes a
# __pycache__/ folder with paperdoc's bytecode next to this script, which
# would be a leftover file outside output/.
sys.dont_write_bytecode = True

import paperdoc


ROOT = Path(__file__).resolve().parent
OUT_PDF = ROOT / "output" / "pdf"
OUT_PNG = ROOT / "output" / "png"
OUT_TEX = ROOT / "output" / "tex"
TEMPLATES_DIR = ROOT / "templates"
DATA_DIR = ROOT.parent / "data"
MD_DIR = ROOT.parent / "md" / "papers"  # <project>/md/papers, parallel to papers/
PUBLICATIONS_PATH = DATA_DIR / "veroeffentlichungen.json"

DOCUMENTCLASS_RE = re.compile(r"\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}")
SLUG_COMMENT_RE = re.compile(r"^%\s*slug:\s*(\S+)\s*$", re.MULTILINE)
GENERATED_MARKER_RE = re.compile(r"^%\s*AUTO-GENERATED\b", re.MULTILINE)
ARTICLEPAGES_RE = re.compile(r"\\articlepages\{\s*(\d+)\s*(?:--\s*(\d+)\s*)?\}")

PNG_DPI = 180
SPINE_WIDTH_FRACTION = 0.018  # spine width relative to a single page's width


class LatexError(RuntimeError):
    """Raised when lualatex fails; carries the tail of the .log for context."""


def run(command: list[str], cwd: Path, env: dict | None = None) -> None:
    print("$", " ".join(command))
    subprocess.run(command, cwd=cwd, check=True, env=env)


def find_documentclass(tex: Path) -> str | None:
    """Extract the class name from \\documentclass{...} in the .tex file."""
    text = tex.read_text(encoding="utf-8", errors="ignore")
    match = DOCUMENTCLASS_RE.search(text)
    return match.group(1).strip() if match else None


def find_paper_slug(tex: Path) -> str | None:
    """Extract the paper's slug from a "% slug: ..." comment in the .tex file.

    That comment is only present in main.tex files generated from a
    paper.md (see paperdoc.build_tex); a hand-written main.tex has none,
    and this returns None.
    """
    text = tex.read_text(encoding="utf-8", errors="ignore")
    match = SLUG_COMMENT_RE.search(text)
    return match.group(1).strip() if match else None


def is_generated_tex(tex: Path) -> bool:
    """True if `tex` carries the "% AUTO-GENERATED ..." marker paperdoc.py
    writes, i.e. it's safe to rewrite automatically (it will just be
    regenerated from paper.md next time anyway)."""
    text = tex.read_text(encoding="utf-8", errors="ignore")
    return GENERATED_MARKER_RE.search(text) is not None


def find_declared_page_range(tex: Path) -> tuple[int, int] | None:
    """Read the (start, end) page numbers from \\articlepages{...} in `tex`.

    A single-page \\articlepages{5} (no "--end") is read as (5, 5). Returns
    None if the paper doesn't declare \\articlepages at all.
    """
    text = tex.read_text(encoding="utf-8", errors="ignore")
    match = ARTICLEPAGES_RE.search(text)
    if not match:
        return None
    start = int(match.group(1))
    end = int(match.group(2)) if match.group(2) else start
    return start, end


def get_pdf_page_count(pdf: Path) -> int | None:
    """Return the actual number of pages in `pdf`, or None if it can't be
    determined (neither pdfinfo nor ImageMagick available)."""
    if shutil.which("pdfinfo"):
        result = subprocess.run(
            ["pdfinfo", str(pdf)], capture_output=True, text=True
        )
        if result.returncode == 0:
            match = re.search(r"^Pages:\s+(\d+)\s*$", result.stdout, re.MULTILINE)
            if match:
                return int(match.group(1))

    if shutil.which("magick"):
        result = subprocess.run(
            ["magick", "identify", str(pdf)], capture_output=True, text=True
        )
        if result.returncode == 0:
            lines = [line for line in result.stdout.splitlines() if line.strip()]
            if lines:
                return len(lines)

    return None


def print_unmissable(*lines: str) -> None:
    """Print a warning banner that is hard to scroll past or miss."""
    width = max(70, max((len(line) for line in lines), default=0) + 4)
    bar = "!" * width
    print()
    print(bar)
    for line in lines:
        print(f"!! {line}")
    print(bar)
    print()


def reconcile_page_range(tex: Path, pdf: Path, env: dict,
                         workdir: Path, outdir: Path) -> bool:
    """Correct \\articlepages's end page to match the PDF's real last page.

    The paper's declared page range (\\articlepages{start--end}) ultimately
    comes from data/veroeffentlichungen.json's seite_start/seite_ende,
    which are hand-maintained and easily out of sync with however many
    pages the paper actually renders to. Rather than trust that end page
    blindly, this recomputes it from the compiled PDF's real page count and,
    if it changed, rewrites the .tex and recompiles so the PDF's own "S.
    x-y" line matches what it actually is — then prints an unmissable
    reminder that veroeffentlichungen.json (and any later paper in the same
    Heft, whose own seite_start likely assumed the old end page) needs a
    matching update.

    Only rewrites .tex files carrying the "AUTO-GENERATED" marker (i.e.
    ones paperdoc.py produced from a paper.md, living in the temporary
    build folder) — a hand-written main.tex is never modified, only warned
    about.

    Returns True if `tex` was rewritten (the caller then refreshes its
    copy in output/tex), else False.
    """
    declared = find_declared_page_range(tex)
    if declared is None:
        return False  # paper doesn't use \articlepages at all — nothing to check

    declared_start, declared_end = declared
    actual_pages = get_pdf_page_count(pdf)
    if actual_pages is None:
        print(
            "Hinweis: Seitenzahl des PDFs konnte nicht ermittelt werden "
            "(weder pdfinfo noch ImageMagick gefunden) — Abgleich mit "
            "\\articlepages übersprungen."
        )
        return False

    actual_end = declared_start + actual_pages - 1
    if actual_end == declared_end:
        return False  # already consistent, nothing to do

    if is_generated_tex(tex):
        text = tex.read_text(encoding="utf-8")
        new_text = ARTICLEPAGES_RE.sub(
            f"\\\\articlepages{{{declared_start}--{actual_end}}}", text, count=1
        )
        tex.write_text(new_text, encoding="utf-8")
        try:
            compile_tex(tex, env, workdir, outdir)
        except LatexError as exc:
            print_unmissable(
                "SEITENZAHL-ABGLEICH FEHLGESCHLAGEN",
                f"\\articlepages wurde auf {declared_start}--{actual_end} korrigiert,",
                "aber der Rekompilierungslauf ist fehlgeschlagen:",
                str(exc),
            )
            return True
        print_unmissable(
            "SEITENZAHL WURDE AUTOMATISCH KORRIGIERT",
            f"Projektdaten sagten S. {declared_start}--{declared_end} "
            f"({declared_end - declared_start + 1} Seiten),",
            f"tatsächlich erzeugt: {actual_pages} Seite(n) -> S. {declared_start}--{actual_end}.",
            f"Das generierte LaTeX wurde angepasst und neu kompiliert.",
            "BITTE 'seite_ende' in data/veroeffentlichungen.json nachziehen",
            "(und ggf. 'seite_start' nachfolgender Beiträge im selben Heft)!",
        )
        return True
    else:
        print_unmissable(
            "SEITENZAHL STIMMT NICHT MEHR",
            f"\\articlepages sagt S. {declared_start}--{declared_end}, das PDF hat aber "
            f"{actual_pages} Seite(n) (-> S. {declared_start}--{actual_end}).",
            "main.tex ist handgeschrieben und wurde NICHT automatisch geändert.",
            "Bitte \\articlepages hier sowie 'seite_ende' in "
            "data/veroeffentlichungen.json von Hand anpassen!",
        )
        return False


def find_template_dir(class_name: str) -> Path | None:
    """Locate the templates/<class_name>/ directory that provides the .cls file."""
    candidate = TEMPLATES_DIR / class_name
    if (candidate / f"{class_name}.cls").exists():
        return candidate

    # Fallback: search all template subdirectories for a matching .cls file,
    # in case the folder name doesn't match the class name exactly.
    if TEMPLATES_DIR.is_dir():
        for sub in TEMPLATES_DIR.iterdir():
            if (sub / f"{class_name}.cls").exists():
                return sub

    return None


def build_texinputs(template_dir: Path | None, build_dir: Path) -> dict:
    """Return an environment with TEXINPUTS extended by the build and
    template folders.

    `build_dir` comes first so images produced during this run (figure
    scripts, see paperdoc) are found there; `template_dir` provides the
    journal's .cls. LaTeX itself runs with the paper folder as working
    directory, so hand-maintained figures/inputs resolve relative to it as
    usual.

    The trailing path separator keeps the normal TeX search path intact
    (an empty TEXINPUTS component means "use the default"), so other
    packages are still found as usual.
    """
    env = os.environ.copy()
    sep = ";" if os.name == "nt" else ":"
    existing = env.get("TEXINPUTS", "")
    dirs = [build_dir] + ([template_dir] if template_dir else [])
    prefix = sep.join(f"{d}{os.sep}" for d in dirs)
    env["TEXINPUTS"] = f"{prefix}{sep}{existing}"
    return env


def tail_of_log(outdir: Path, stem: str, lines: int = 25) -> str:
    log_path = outdir / f"{stem}.log"
    if not log_path.exists():
        return f"(no {stem}.log was produced)"
    content = log_path.read_text(encoding="utf-8", errors="ignore").splitlines()
    return "\n".join(content[-lines:])


def compile_tex(tex: Path, env: dict, workdir: Path, outdir: Path) -> None:
    """Compile `tex` twice with lualatex.

    lualatex runs with `workdir` (the paper's own folder) as cwd, so
    relative paths in the .tex (figures, \\input) resolve as they always
    did — but every file LaTeX *writes* (.aux, .log, .out, the .pdf) goes
    to `outdir` via -output-directory, so nothing lands in the paper folder.
    """
    try:
        # Two passes for stable page numbers / references.
        for _ in range(2):
            run(
                [
                    "lualatex",
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    f"-output-directory={outdir}",
                    str(tex),
                ],
                workdir,
                env=env,
            )
    except subprocess.CalledProcessError as exc:
        raise LatexError(
            f"lualatex failed (exit code {exc.returncode}).\n"
            f"--- tail of {tex.stem}.log ---\n"
            f"{tail_of_log(outdir, tex.stem)}\n"
            f"--- end of log ---"
        ) from exc


def render_page_png(pdf: Path, page: int, output_png: Path) -> bool:
    """Render a single PDF page to a PNG. Returns False if the page doesn't exist."""
    # Prefer pdftoppm because it is predictable and widely available.
    if shutil.which("pdftoppm"):
        prefix = output_png.with_suffix("")
        result = subprocess.run(
            [
                "pdftoppm",
                "-f", str(page),
                "-l", str(page),
                "-singlefile",
                "-png",
                "-r", str(PNG_DPI),
                str(pdf),
                str(prefix),
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        # pdftoppm exits non-zero (and writes no file) if the page is out of
        # range, which is exactly how we detect a paper with fewer pages.
        return result.returncode == 0 and output_png.exists()

    # ImageMagick fallback.
    if shutil.which("magick"):
        result = subprocess.run(
            [
                "magick",
                "-density", str(PNG_DPI),
                f"{pdf}[{page - 1}]",
                "-quality", "92",
                str(output_png),
            ],
            cwd=ROOT,
            capture_output=True,
            text=True,
        )
        return result.returncode == 0 and output_png.exists()

    return False


def render_png(pdf: Path, output_png: Path) -> bool:
    """Render just the first page (the normal, non-spread preview)."""
    return render_page_png(pdf, 1, output_png)


def render_spread_png(pdf: Path, output_png: Path) -> bool:
    """Render page 1 and page 2 side by side, like an open magazine spread.

    If the paper has only one page, a blank page of matching size is used
    for the right-hand side so the result still reads as a double page.
    """
    try:
        from PIL import Image, ImageDraw
    except ImportError:
        print("ERROR: --spread requires Pillow.")
        print("Install it with: pip install Pillow  (add --break-system-packages on Linux if needed)")
        return False

    # System temp dir, not output/png: the two single-page renders must not
    # even briefly (or after a crash) sit in the project's output folders.
    tmp_dir = Path(tempfile.mkdtemp(prefix="methodius-spread-"))
    left_tmp = tmp_dir / f"{output_png.stem}-p1.png"
    right_tmp = tmp_dir / f"{output_png.stem}-p2.png"

    try:
        if not render_page_png(pdf, 1, left_tmp):
            print("ERROR: could not render page 1 of the PDF.")
            return False

        has_second_page = render_page_png(pdf, 2, right_tmp)

        with Image.open(left_tmp) as left_src:
            left = left_src.convert("RGB").copy()

        if has_second_page:
            with Image.open(right_tmp) as right_src:
                right = right_src.convert("RGB").copy()
        else:
            # No second page: pad with a blank page the same size as page 1
            # so the spread still looks like a real double page.
            right = Image.new("RGB", left.size, "white")

        height = max(left.height, right.height)
        spine_width = max(6, round(left.width * SPINE_WIDTH_FRACTION))

        spread = Image.new("RGB", (left.width + spine_width + right.width, height), "white")
        spread.paste(left, (0, (height - left.height) // 2))
        spread.paste(right, (left.width + spine_width, (height - right.height) // 2))

        # Soft "gutter" shadow where the two pages meet, like a real
        # magazine spread lying open.
        draw = ImageDraw.Draw(spread)
        center = left.width + spine_width / 2
        for offset in range(spine_width):
            x = left.width + offset
            distance = abs((x + 0.5) - center) / (spine_width / 2)
            darkness = round(60 * (1 - distance))  # 0 (no shading) .. 60
            if darkness > 0:
                draw.line([(x, 0), (x, height)], fill=(255 - darkness, 255 - darkness, 255 - darkness))

        spread.save(output_png)
        return True
    finally:
        shutil.rmtree(tmp_dir, ignore_errors=True)


def generate_tex_from_markdown(md_path: Path, build_dir: Path) -> tuple[Path, str]:
    """Convert a paper.md into main.tex inside `build_dir`; return
    (.tex path, slug).

    The .tex is written to the temporary build folder, not next to the
    paper.md — output/tex/<slug>.tex (copied by main()) is its only
    lasting copy.

    Fields the paper.md omits (title, authors, volume, issue, year, date,
    pages) are looked up in PUBLICATIONS_PATH via the paper.md's `slug`,
    see paperdoc.py. The returned slug is the paper's own identifier (its
    `slug:` field), used to name output files after the paper itself.

    Raises paperdoc.PaperDocError with a human-readable message on anything
    wrong with the paper.md's structure or content.
    """
    tex_source, slug = paperdoc.convert_paper_md(
        md_path, TEMPLATES_DIR, PUBLICATIONS_PATH, build_dir=build_dir
    )
    tex_path = build_dir / "main.tex"
    tex_path.write_text(tex_source, encoding="utf-8")
    return tex_path, slug


def build(source: Path, spread: bool, build_dir: Path) -> int:
    """Do the actual work for one input file. Everything written along the
    way (except the three files in output/) goes into `build_dir`, which
    main() deletes afterwards."""
    slug: str | None = None

    if source.suffix.lower() == ".md":
        try:
            tex, slug = generate_tex_from_markdown(source, build_dir)
        except paperdoc.PaperDocError as exc:
            print(f"ERROR: {exc}")
            return 1
        OUT_TEX.mkdir(parents=True, exist_ok=True)
        tex_copy = OUT_TEX / f"{slug}.tex"
        # Copied right away (not only at the end) so that a failed LaTeX
        # run still leaves the generated .tex behind for debugging.
        shutil.copy2(tex, tex_copy)
        print(f"Erzeugt: {tex_copy} (aus {source.name})")
        print()
    elif source.suffix.lower() == ".tex":
        tex = source
        # No paper.md was involved this run, but the .tex may still carry
        # the "% slug: ..." comment from an earlier paper.md-based
        # generation — reuse it so output filenames stay stable across
        # both entry points for the same paper.
        slug = find_paper_slug(tex)
        tex_copy = None
    else:
        print("The input must be a .tex or a paper.md file.")
        return 2

    # LaTeX runs with the paper's own folder as cwd, so relative figure
    # paths etc. resolve exactly as before; its output goes to build_dir.
    workdir = source.parent
    pdf = build_dir / f"{tex.stem}.pdf"

    # Output files are named after the paper's own slug (from paper.md /
    # veroeffentlichungen.json) whenever one is known, so every paper keeps
    # a stable, unique output name regardless of its folder. Only a
    # hand-written main.tex with no paper.md history falls back to the
    # folder name (papers live in their own folder by convention,
    # papers/<name>/..., which then still keeps outputs distinct).
    output_name = slug or workdir.name

    if not shutil.which("lualatex"):
        print("ERROR: lualatex was not found in PATH.")
        print("Install TeX Live or MiKTeX and make sure LuaLaTeX is available.")
        return 1

    # Figure out which journal template (.cls) this paper needs. lualatex is
    # run with `workdir` (the paper's own folder) as cwd, so without help it
    # never finds templates/<name>/<name>.cls, which lives elsewhere. We
    # detect the class from \documentclass{...} and add its folder to
    # TEXINPUTS so LaTeX's normal file search picks it up.
    class_name = find_documentclass(tex)
    template_dir = find_template_dir(class_name) if class_name else None

    if class_name and not template_dir:
        print(f"ERROR: No template found for \\documentclass{{{class_name}}}.")
        print(f"Expected a file at templates/{class_name}/{class_name}.cls")
        return 1

    env = build_texinputs(template_dir, build_dir)

    try:
        compile_tex(tex, env, workdir, build_dir)
    except LatexError as exc:
        print(f"ERROR: {exc}")
        return 1

    if not pdf.exists():
        print("ERROR: LaTeX reported success but did not produce a PDF.")
        return 1

    # Reconcile \articlepages's end page with the PDF's real last page
    # before anything gets copied to output/, so target_pdf/target_png
    # below always reflect the corrected version.
    if reconcile_page_range(tex, pdf, env, workdir, build_dir) and tex_copy is not None:
        shutil.copy2(tex, tex_copy)  # keep output/tex in sync with the PDF

    OUT_PDF.mkdir(parents=True, exist_ok=True)
    OUT_PNG.mkdir(parents=True, exist_ok=True)

    target_pdf = OUT_PDF / f"{output_name}.pdf"
    shutil.copy2(pdf, target_pdf)

    target_png = OUT_PNG / f"{output_name}.png"
    rendered = render_spread_png(pdf, target_png) if spread else render_png(pdf, target_png)

    print()
    print("Created:")
    print(f"  PDF: {target_pdf}")

    if rendered:
        print(f"  PNG: {target_png}")
    else:
        print("  PNG: not created")
        print("  Install pdftoppm (Poppler) or ImageMagick to enable PNG previews.")

    return 0


def resolve_input_path(arg: str, md_dir: Path) -> tuple[Path | None, list[Path]]:
    """Resolve the command-line input to an existing file.

    Relative inputs are looked up in `md_dir` (md/papers/ by default, or
    whatever --md-dir says) first, so a paper can be given as just its file
    name — "mein-paper" or "mein-paper.md". The path as given (relative to
    the current directory, or absolute) is the fallback and still works for
    any .md / main.tex anywhere.

    Returns (resolved path or None, every candidate that was tried) — the
    latter for the "not found" message.
    """
    given = Path(arg)
    if given.is_absolute():
        candidates = [given]
    else:
        candidates = [md_dir / given]
        if given.suffix.lower() not in (".md", ".tex"):
            candidates.append(md_dir / f"{given}.md")  # "mein-paper" -> mein-paper.md
        candidates.append(given)
    for candidate in candidates:
        if candidate.is_file():
            return candidate.resolve(), candidates
    return None, candidates


def find_papers(md_dir: Path) -> list[Path]:
    """All .md files directly in `md_dir`, sorted by file name.

    Files starting with "_" or "." (a "_template.md", hidden files) are not
    papers and are skipped. Subfolders (figures/, ...) are not searched.
    """
    return sorted(
        path
        for path in md_dir.iterdir()
        if path.is_file()
        and path.suffix.lower() == ".md"
        and not path.name.startswith(("_", "."))
    )


def run_build(source: Path, spread: bool) -> int:
    """build() with its own scratch folder.

    All intermediate files live in one scratch folder outside the project,
    removed in `finally` so it disappears on success, on errors and on
    Ctrl+C alike. Only output/{tex,pdf,png} keep anything.
    """
    build_dir = Path(tempfile.mkdtemp(prefix="methodius-build-"))
    try:
        return build(source, spread, build_dir)
    finally:
        shutil.rmtree(build_dir, ignore_errors=True)


def build_all(papers: list[Path], spread: bool) -> int:
    """Build every paper in `papers`, one after the other, independently:
    a failing paper is reported and skipped, the rest still run. Returns 0
    if all succeeded, else 1."""
    results: list[tuple[str, int]] = []
    for number, paper in enumerate(papers, start=1):
        name = paper.stem
        print()
        print("=" * 70)
        print(f"[{number}/{len(papers)}] {name}")
        print("=" * 70)
        results.append((name, run_build(paper, spread)))

    failed = [name for name, code in results if code != 0]
    print()
    print("=" * 70)
    print(f"Fertig: {len(results) - len(failed)} von {len(results)} Papers erfolgreich.")
    for name, code in results:
        print(f"  {'OK    ' if code == 0 else 'FEHLER'}  {name}")
    print("=" * 70)
    return 1 if failed else 0


def main() -> int:
    parser = argparse.ArgumentParser(
        description=(
            "Compile Methodius papers and render PNG previews. Without an "
            "input, all papers in md/papers/ are processed."
        )
    )
    parser.add_argument(
        "input_file",
        nargs="?",
        default=None,
        help=(
            "A Markdown paper (frontmatter + Markdown, see paperdoc.py) — "
            "given as its file name in md/papers/, with or without '.md', "
            "e.g. mein-paper — or the path to a hand-written main.tex, "
            "e.g. papers/example-aevidence/main.tex. Omit it to process "
            "every .md file in the folder."
        ),
    )
    parser.add_argument(
        "--md-dir",
        metavar="PATH",
        default=None,
        help=(
            f"Folder that holds the Markdown papers (<paper>.md). "
            f"Default: {MD_DIR}. Used for the run over all papers and for "
            f"looking up a single paper's file name."
        ),
    )
    parser.add_argument(
        "--spread",
        action="store_true",
        help=(
            "Render page 1 and page 2 side by side as one magazine-style "
            "spread instead of just the first page. A one-page paper gets "
            "a blank second page so the spread still looks like a real "
            "double page. Requires Pillow (pip install Pillow)."
        ),
    )
    args = parser.parse_args()

    md_dir = Path(args.md_dir).expanduser().resolve() if args.md_dir else MD_DIR

    if args.input_file is None:
        # No paper given: process everything in md_dir.
        if not md_dir.is_dir():
            print(f"Folder not found: {md_dir}")
            print("Pass the folder with --md-dir PATH, or name a paper.")
            return 2
        papers = find_papers(md_dir)
        if not papers:
            print(f"Keine Papers gefunden in {md_dir}")
            print("(gesucht: *.md direkt in diesem Ordner; Dateien mit '_' "
                  "oder '.' am Anfang werden übersprungen)")
            return 0
        if not shutil.which("lualatex"):
            # Checked once up front instead of once per paper.
            print("ERROR: lualatex was not found in PATH.")
            print("Install TeX Live or MiKTeX and make sure LuaLaTeX is available.")
            return 1
        print(f"{len(papers)} Paper(s) in {md_dir}:")
        for paper in papers:
            print(f"  - {paper.name}")
        return build_all(papers, args.spread)

    source, tried = resolve_input_path(args.input_file, md_dir)
    if source is None:
        print(f"File not found: {args.input_file}")
        print("Looked for:")
        for candidate in tried:
            print(f"  {candidate}")
        print(f"(Markdown papers belong directly in {md_dir})")
        return 2

    return run_build(source, args.spread)


if __name__ == "__main__":
    raise SystemExit(main())
