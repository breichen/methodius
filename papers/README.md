# Methodius Paper Generator

Ein kleines LaTeX-Projekt für die fiktiven wissenschaftlichen Publikationen des
Methodius-Instituts.

Die Idee:

- Das **Journal-Template** bestimmt das Erscheinungsbild.
- Die eigentliche `.tex`-Datei enthält möglichst wenig Layout-Code.
- Für ein neues Paper kopierst du nur `papers/_template/main.tex`,
  wählst eine Journal-Klasse und ersetzt den Beispieltext.
- Der Generator kann PDF und PNG der ersten Seite erzeugen.

## Voraussetzungen

Empfohlen:

- TeX Live 2025+ oder eine aktuelle MiKTeX-Installation
- LuaLaTeX
- Python 3.10+
- Für PNG-Vorschauen: ImageMagick **oder** Poppler (`pdftoppm`)
- Für Doppelseiten-Vorschauen (`--spread`, siehe unten): zusätzlich
  [Pillow](https://pypi.org/project/pillow/) (`pip install Pillow`)

Die Templates verwenden `fontspec` und werden daher mit **LuaLaTeX** gesetzt.

## Schnellstart

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

Mögliche Templates:

```text
aevidence       Archiv für Ausreichende Evidenz
alltagsforschung Zeitschrift für Alltagsforschung
praxisplaus     Annalen der Praktischen Plausibilität
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

Oder mit dem Generator:

```bash
python generate.py papers/mein-paper/main.tex
```

Der Generator schreibt die Ergebnisse nach:

```text
output/
├── pdf/
└── png/
```

### 4. Doppelseiten-Vorschau (`--spread`)

Für einen News-Feed-Look wie eine aufgeschlagene Zeitschrift kannst du statt
der ersten Seite allein ein Doppelseiten-Bild erzeugen lassen:

```bash
python generate.py papers/mein-paper/main.tex --spread
```

Das zeigt Seite 1 und Seite 2 nebeneinander, mit einem dezenten Schatten in
der Mitte ("Falz"). Hat das Paper nur eine Seite, wird automatisch eine
leere zweite Seite ergänzt, damit das Bild trotzdem wie eine echte
Doppelseite aussieht. Dieser Modus benötigt zusätzlich Pillow
(`pip install Pillow`).

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
