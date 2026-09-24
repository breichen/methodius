#!/usr/bin/env python3
"""
Methodius Paper Generator

Usage:
    python generate.py papers/example-aevidence/main.tex
    python generate.py papers/example-aevidence/main.tex --spread

The script:
1. finds the journal template (templates/<name>/<name>.cls) that the paper's
   \\documentclass refers to and makes it visible to LaTeX,
2. compiles the LaTeX file twice with LuaLaTeX,
3. copies the resulting PDF to output/pdf,
4. renders a PNG preview if ImageMagick or pdftoppm is available:
   - by default, just the first page;
   - with --spread, page 1 and page 2 side by side, like an open magazine
     spread. If the paper only has one page, a blank second page is added
     so the spread still looks like a real double page. This mode needs
     Pillow (`pip install Pillow`).
"""

from __future__ import annotations

import argparse
import os
import re
import shutil
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parent
OUT_PDF = ROOT / "output" / "pdf"
OUT_PNG = ROOT / "output" / "png"
TEMPLATES_DIR = ROOT / "templates"

DOCUMENTCLASS_RE = re.compile(r"\\documentclass(?:\[[^\]]*\])?\{([^}]+)\}")

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


def build_texinputs(template_dir: Path | None) -> dict:
    """Return an environment with TEXINPUTS extended by the template dir.

    The trailing path separator keeps the normal TeX search path intact
    (an empty TEXINPUTS component means "use the default"), so other
    packages are still found as usual.
    """
    env = os.environ.copy()
    if template_dir:
        sep = ";" if os.name == "nt" else ":"
        existing = env.get("TEXINPUTS", "")
        env["TEXINPUTS"] = f"{template_dir}{os.sep}{sep}{existing}"
    return env


def tail_of_log(workdir: Path, stem: str, lines: int = 25) -> str:
    log_path = workdir / f"{stem}.log"
    if not log_path.exists():
        return "(no main.log was produced)"
    content = log_path.read_text(encoding="utf-8", errors="ignore").splitlines()
    return "\n".join(content[-lines:])


def compile_tex(tex: Path, env: dict) -> None:
    workdir = tex.parent
    try:
        # Two passes for stable page numbers / references.
        for _ in range(2):
            run(
                [
                    "lualatex",
                    "-interaction=nonstopmode",
                    "-halt-on-error",
                    tex.name,
                ],
                workdir,
                env=env,
            )
    except subprocess.CalledProcessError as exc:
        raise LatexError(
            f"lualatex failed (exit code {exc.returncode}).\n"
            f"--- tail of {tex.stem}.log ---\n"
            f"{tail_of_log(workdir, tex.stem)}\n"
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

    tmp_dir = output_png.parent / ".spread-tmp"
    tmp_dir.mkdir(parents=True, exist_ok=True)
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


def main() -> int:
    parser = argparse.ArgumentParser(
        description="Compile a Methodius paper and render a PNG preview."
    )
    parser.add_argument(
        "tex_file",
        help="Path to the paper's main.tex, e.g. papers/example-aevidence/main.tex",
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

    tex = Path(args.tex_file).resolve()
    if not tex.exists():
        print(f"File not found: {tex}")
        return 2

    if tex.suffix.lower() != ".tex":
        print("The input must be a .tex file.")
        return 2

    workdir = tex.parent
    stem = tex.stem
    pdf = workdir / f"{stem}.pdf"

    # Every paper is conventionally called main.tex, so using tex.stem alone
    # for the output filename would make every paper overwrite the same
    # output/pdf/main.pdf and output/png/main.png. Use the paper's own
    # folder name instead (e.g. "example-aevidence") when the file is
    # actually called "main", so each paper gets its own output file.
    output_name = workdir.name if stem == "main" else stem

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

    env = build_texinputs(template_dir)

    try:
        compile_tex(tex, env)
    except LatexError as exc:
        print(f"ERROR: {exc}")
        return 1

    if not pdf.exists():
        print("ERROR: LaTeX reported success but did not produce a PDF.")
        return 1

    OUT_PDF.mkdir(parents=True, exist_ok=True)
    OUT_PNG.mkdir(parents=True, exist_ok=True)

    target_pdf = OUT_PDF / f"{output_name}.pdf"
    shutil.copy2(pdf, target_pdf)

    target_png = OUT_PNG / f"{output_name}.png"
    rendered = render_spread_png(pdf, target_png) if args.spread else render_png(pdf, target_png)

    print()
    print("Created:")
    print(f"  PDF: {target_pdf}")

    if rendered:
        print(f"  PNG: {target_png}")
    else:
        print("  PNG: not created")
        print("  Install pdftoppm (Poppler) or ImageMagick to enable PNG previews.")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
