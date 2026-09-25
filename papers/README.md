# Methodius Paper Generator

Ein kleines LaTeX-Projekt für die fiktiven wissenschaftlichen Publikationen des
Methodius-Instituts.

Die Idee:

- Das **Journal-Template** bestimmt das Erscheinungsbild.
- Für ein neues Paper schreibst du Text + Metadaten in einer einfachen
  `paper.md`-Datei (Frontmatter + Markdown) — kein LaTeX nötig.
- Der Generator erzeugt daraus zuerst ein `main.tex` und kompiliert es dann
  zu PDF und PNG.
- Für Sonderfälle (Tabellen, Fußnoten, sehr spezielle Formatierung) kannst
  du weiterhin direkt ein `main.tex` von Hand schreiben und kompilieren —
  beide Wege funktionieren nebeneinander.

## Voraussetzungen

Empfohlen:

- TeX Live 2025+ oder eine aktuelle MiKTeX-Installation
- LuaLaTeX
- Python 3.10+
- Für PNG-Vorschauen: ImageMagick **oder** Poppler (`pdftoppm`)
- Für Doppelseiten-Vorschauen (`--spread`, siehe unten): zusätzlich
  [Pillow](https://pypi.org/project/pillow/) (`pip install Pillow`)

Die Templates verwenden `fontspec` und werden daher mit **LuaLaTeX** gesetzt.

## Schnellstart (empfohlen): `paper.md`

### 1. Ein Paper anlegen

Kopiere:

```text
papers/_template/paper.md
```

nach:

```text
papers/mein-paper/paper.md
```

und fülle Frontmatter und Text aus:

```markdown
---
slug: empirische-plausibilitaet-datenlage
journal: Archiv für Ausreichende Evidenz
subtitle: Ein optionaler Untertitel
shorttitle: Kurztitel für die Kopfzeile
keywords:
  - Begriff 1
  - Begriff 2
abstract: |
  Hier steht der Abstract. Kann sich über mehrere
  Zeilen erstrecken.
---

## Einleitung

Hier steht dein Text, mit **fett**, *kursiv* und ganz normalen Absätzen.

- Auch Aufzählungen
- funktionieren
```

Pflichtfelder sind `slug` und `abstract` — alles
andere ist optional; die Templates füllen sinnvolle Standardwerte, wo
nichts angegeben wurde. Fehlt ein Pflichtfeld oder ist `journal` unbekannt,
bricht der Generator mit einer klaren Fehlermeldung ab, bevor überhaupt
LaTeX aufgerufen wird.

Unterstützt werden `##`/`###`/`####`-Überschriften, Absätze, `**fett**`,
`*kursiv*`, `` `code` ``, sowie einfache `-`/`1.`-Listen (auch über mehrere
Zeilen umgebrochen). Für alles Speziellere (Tabellen, Fußnoten, Zitate,
Abbildungen) schreibst du diesen einen Absatz direkt als `main.tex`, siehe
"Fortgeschritten: main.tex direkt schreiben" weiter unten.

### 2. Journal auswählen

Der Wert von `journal:` in der Frontmatter entspricht dem Ordnernamen unter
`templates/`:

```text
aevidence        Archiv für Ausreichende Evidenz
alltagsforschung Zeitschrift für Alltagsforschung
praxisplaus      Annalen der Praktischen Plausibilität
...
```

Das zum Journal passende Template wird automatisch ausgewählt.

### 3. Generieren und kompilieren

```bash
python generate.py papers/mein-paper/paper.md
```

Das erzeugt in einem Rutsch:

```text
papers/mein-paper/main.tex     ← generiertes LaTeX (1. Output, zum Nachsehen/Debuggen)
output/tex/mein-paper.tex      ← Kopie davon, neben den anderen Outputs
output/pdf/mein-paper.pdf
output/png/mein-paper.png
```

Das generierte `main.tex` trägt einen Hinweis-Kommentar, dass es
automatisch erzeugt wurde — Änderungen daran gehen beim nächsten Lauf
verloren. Wenn du mehr Kontrolle brauchst, bearbeite entweder die
`paper.md` weiter, oder wechsle für dieses eine Paper auf ein von Hand
gepflegtes `main.tex` (siehe unten).

### 4. Doppelseiten-Vorschau (`--spread`)

Für einen News-Feed-Look wie eine aufgeschlagene Zeitschrift kannst du statt
der ersten Seite allein ein Doppelseiten-Bild erzeugen lassen:

```bash
python generate.py papers/mein-paper/paper.md --spread
```

Das zeigt Seite 1 und Seite 2 nebeneinander, mit einem dezenten Schatten in
der Mitte ("Falz"). Hat das Paper nur eine Seite, wird automatisch eine
leere zweite Seite ergänzt, damit das Bild trotzdem wie eine echte
Doppelseite aussieht. Dieser Modus benötigt zusätzlich Pillow
(`pip install Pillow`).

## Fortgeschritten: `main.tex` direkt schreiben

Für Sonderfälle, die der Markdown-Konverter nicht abdeckt (Tabellen,
Fußnoten, Literaturverzeichnis, Abbildungen mit besonderem Layout, o. ä.),
kannst du ein Paper weiterhin komplett als LaTeX schreiben und genauso mit
`generate.py` kompilieren:

### 1. Ein Paper anlegen

Kopiere z. B.:

```text
papers/_template/main.tex
```

nach:

```text
papers/mein-paper/main.tex
```

Öffne die Datei und ändere im Wesentlichen nur:

```latex
\journalvolume{14}
\journalissue{2}
\journalyear{2026}
\articledate{27.11.2026}
\articlepages{35--51}

\title{Mein neuer wissenschaftlicher Beitrag}
\author{Dr. Konrad P. Huber \and Dr. Maximilian Methodius}

\begin{abstract}
Hier steht der Abstract.
\end{abstract}

\section{Einleitung}
Hier steht dein Text.
```

### 2. Journal auswählen

In der ersten Zeile steht die Journal-Klasse:

```latex
\documentclass{aevidence}
```

Du kannst also z. B. aus

```latex
\documentclass{aevidence}
```

einfach

```latex
\documentclass{alltagsforschung}
```

machen.

### 3. Kompilieren

Direkt in einem Paper-Verzeichnis:

```bash
lualatex main.tex
lualatex main.tex
```

Der zweite Durchlauf sorgt dafür, dass Seitenzahlen und Querverweise sauber
gesetzt werden.

Oder mit dem Generator, genau wie bei `paper.md` (nur ohne den
Konvertierungsschritt davor):

```bash
python generate.py papers/mein-paper/main.tex
python generate.py papers/mein-paper/main.tex --spread
```

## Die drei mitgelieferten Journals

### Archiv für Ausreichende Evidenz

Klassisches, konservatives Fachjournal:

- zweispaltig
- Serifenschrift
- kompakter Satz
- dezente graue Kopfzeile
- klassische wissenschaftliche Anmutung

### Zeitschrift für Alltagsforschung

Etwas moderner:

- einspaltiger Satz
- großzügiger
- klare blaue Akzente
- stärkerer Editorial-Charakter

### Annalen der Praktischen Plausibilität

Etwas älter und akademischer:

- zweispaltig
- klassischer Satz
- zurückhaltende rote Akzente
- stärkerer "alte Fachzeitschrift"-Charakter

Die Templates sind bewusst unterschiedlich, bleiben aber innerhalb einer
gemeinsamen seriösen wissenschaftlichen Welt.

## Abbildungen

In jedem Paper kannst du einfach schreiben:

```latex
\begin{figure}[t]
  \centering
  \includegraphics[width=\linewidth]{figures/abbildung.png}
  \caption{Eine bemerkenswerte Beobachtung.}
  \label{fig:beobachtung}
\end{figure}
```

Lege die Datei dann unter

```text
papers/mein-paper/figures/abbildung.png
```

ab.

## Literatur

Ein einfaches Literaturverzeichnis funktioniert ohne BibTeX:

```latex
\begin{thebibliography}{9}

\bibitem{muster}
Muster, M. (2026).
Ein Beitrag zur empirischen Plausibilität.
\textit{Archiv für Ausreichende Evidenz}, 14(2), 12--19.

\end{thebibliography}
```

Für umfangreichere Papers kann später problemlos BibLaTeX ergänzt werden.

## Eigene Templates hinzufügen

Kopiere eine der `.cls`-Dateien:

```text
templates/aevidence/aevidence.cls
```

und benenne sie z. B. in:

```text
templates/mein-journal/meinjournal.cls
```

Dann legst du eine entsprechende Paper-Datei an:

```latex
\documentclass{meinjournal}
```

Die eigentliche Paper-Datei muss dadurch kaum verändert werden.

## Wichtiger Hinweis zur Website

Für deine Website würde ich die PDF als eigentliches Dokument verwenden und
die PNG-Datei nur als Vorschau der ersten Seite:

```text
PDF = Original
PNG = Website-Preview
```

Damit musst du das Layout nie wieder als KI-Bild rekonstruieren.
