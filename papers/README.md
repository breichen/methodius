# Methodius Paper Generator

Ein kleines LaTeX-Projekt für die fiktiven wissenschaftlichen Publikationen des
Methodius-Instituts.

Die Idee:

- Das **Journal-Template** bestimmt das Erscheinungsbild.
- Für ein neues Paper schreibst du Text + Metadaten in einer einfachen
  `paper.md`-Datei (Frontmatter + Markdown) — kein LaTeX nötig.
- Der Generator erzeugt daraus zuerst ein `main.tex` und kompiliert es dann
  zu PDF und PNG.
- Für Sonderfälle (Fußnoten, BibTeX-verwaltete Literatur, sehr spezielle
  Formatierung) kannst
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

## Projektstruktur

Die Markdown-Dateien der Papers liegen **direkt** im Ordner `md/papers/`,
jede mit ihrem eigenen Namen (`mein-paper.md`, `anderes-paper.md`, ...).
Dieser Ordner liegt **parallel** zum Ordner `papers/` (mit `generate.py`,
`paperdoc.py`, `templates/` und `output/`):

```text
<projekt>/
├── papers/          generate.py, paperdoc.py, templates/, output/
├── md/
│   └── papers/      mein-paper.md, anderes-paper.md, figures/, ...
└── data/            veroeffentlichungen.json
```

In diesem README steht `paper.md` als allgemeiner Begriff für die
Markdown-Datei eines Papers — der tatsächliche Dateiname ist frei wählbar.
Bilder, Daten und Skripte werden relativ zum Ordner der Markdown-Datei
aufgelöst, also relativ zu `md/papers/` (z. B. `md/papers/figures/`).
Verwenden mehrere Papers denselben Bildpfad, teilen sie sich die Datei.

## Schnellstart (empfohlen): `paper.md`

### 1. Ein Paper anlegen

Kopiere:

```text
md/papers/_template.md
```

nach:

```text
md/papers/mein-paper.md
```

und fülle Frontmatter und Text aus:

```markdown
---
slug: empirische-plausibilitaet-datenlage
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

Pflichtfelder sind nur `slug` und `abstract`. Alles andere — `journal`,
`title`, `authors`, `volume`, `issue`, `year`, `date`, `pages` — wird über
`slug` aus `data/veroeffentlichungen.json` nachgeschlagen. Ein Feld direkt
im Frontmatter anzugeben überschreibt immer den nachgeschlagenen Wert, du
kannst also z. B. nur `journal:` oder nur `pages:` gezielt überschreiben,
ohne den Rest zu wiederholen:

```markdown
---
slug: empirische-plausibilitaet-datenlage
journal: Kritik & Evidenz   # überschreibt das Journal aus der JSON
pages: 35--52               # überschreibt die Seitenzahl aus der JSON
abstract: |
  Hier steht der Abstract.
---
```

`keywords` kommt nie aus der JSON (dort nicht vorgesehen) und wird, wenn
weggelassen, im PDF einfach nicht angezeigt.

Fehlt `slug` oder `abstract`, ist `slug` in `veroeffentlichungen.json`
nicht zu finden, oder lässt sich weder aus Frontmatter noch JSON ein
`journal`/`title`/`authors` ermitteln, bricht der Generator mit einer
klaren Fehlermeldung ab, bevor überhaupt LaTeX aufgerufen wird.

Unterstützt werden `##`/`###`/`####`-Überschriften, Absätze, `**fett**`,
`*kursiv*`, `` `code` ``, sowie einfache `-`/`1.`-Listen (auch über mehrere
Zeilen umgebrochen) — und, wie unten beschrieben, Tabellen und Abbildungen.
Für alles darüber hinaus (Fußnoten, Zitate, mehrspaltige Abbildungslayouts
o. ä.) schreibst du diesen einen Absatz direkt als `main.tex`, siehe
"Fortgeschritten: main.tex direkt schreiben" weiter unten.

#### Tabellen

Normale GitHub-Markdown-Tabellen, mit optionaler Caption direkt danach:

```markdown
| Bedingung | n | Signifikant? |
| --- | :---: | ---: |
| Kontrolle | 24 | nein |
| Intervention | 24 | knapp |

Table: Ergebnisse nach Bedingung {#tab:ergebnisse}
```

Die Trennzeile bestimmt die Spaltenausrichtung: `---` = links (Standard),
`:---:` = zentriert, `---:` = rechts. Die `Table:`-Zeile ist optional; auch
`{#tab:...}` darin ist optional (ohne Label keine Referenzierbarkeit, aber
weiterhin eine nummerierte Tabelle mit Caption).

#### Abbildungen

Ein Bild, das allein in seinem Absatz steht, wird automatisch zur
captionierten Abbildung (Alt-Text = Caption):

```markdown
![Verteilung der p-Werte über alle Studien](figures/pwerte.png){#fig:pwerte width=80%}
```

Die Bilddatei liegt relativ zum Ordner der Markdown-Datei, z. B. unter
`md/papers/figures/pwerte.png` — der Generator prüft vor dem
LaTeX-Lauf, ob sie existiert, und bricht sonst mit einer klaren
Fehlermeldung ab. `{#fig:...}` und `width=...` (z. B. `80%` oder `5cm`)
sind optional; ohne `width` wird die volle Spalten-/Textbreite verwendet.

#### Diagramme aus Python generieren

Statt einer fertigen Bilddatei kann eine Abbildung auch von einem
Python-Skript erzeugt werden, das im Zuge der Generierung läuft:

```markdown
![Verteilung der p-Werte über alle Studien](figures/pwerte.png){#fig:pwerte width=80% script=figures/pwerte.py}
```

Der Pfad in `![...](...)` bleibt der Zielpfad der Bilddatei (relativ zum
Ordner der Markdown-Datei, wie bisher) — `script=` gibt zusätzlich ein Python-Skript an
(ebenfalls relativ zum Ordner der Markdown-Datei), das diese Datei erst erzeugt. Vor
dem LaTeX-Lauf ruft der Generator es auf als:

```bash
python figures/pwerte.py /absoluter/pfad/zu/figures/pwerte.png
```

mit dem Ordner der Markdown-Datei als Arbeitsverzeichnis — das Skript bekommt seinen
Ausgabepfad also als `sys.argv[1]` und muss dort exakt die Bilddatei
(PNG oder PDF) ablegen, z. B. mit Matplotlib:

```python
import sys
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
ax.plot([1, 2, 3], [0.9, 0.4, 0.02])
ax.set_ylabel("p-Wert")
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
```

Weil das Skript relativ zum Ordner der Markdown-Datei läuft, kann es dort z. B. auch
eine `data/messwerte.csv` einlesen, genau wie Bildpfade auch relativ zum
Ordner der Markdown-Datei aufgelöst werden.

Das Bild entsteht in einem temporären Ordner, der nach dem Lauf wieder
gelöscht wird (siehe "Was nach dem Lauf übrig bleibt" unten) — im
Ordner der Markdown-Datei bleibt also nichts zurück, und das Skript läuft dafür bei
jedem Build neu. Ein Bild, das im Ordner der Markdown-Datei schon von Hand abgelegt
ist, wird nie überschrieben. Schlägt das Skript fehl oder legt es die
erwartete Datei nicht an, bricht der Generator mit einer klaren
Fehlermeldung (inkl. Skript-Traceback) ab, bevor überhaupt LaTeX
aufgerufen wird — genau wie beim fehlenden-Bild-Fall oben.

#### Diagramme: Code direkt in der paper.md statt in einer eigenen .py-Datei

Statt auf `script=pfad/zu/datei.py` zu verweisen, kannst du den Python-Code
auch direkt unter der Abbildungszeile einbetten — ohne Leerzeile
dazwischen, sonst wird der Code-Block nicht mehr eindeutig dieser
Abbildung zugeordnet:

```markdown
![Verteilung der p-Werte über alle Studien](figures/pwerte.png){#fig:pwerte width=80%}
```python
import sys
import matplotlib.pyplot as plt

fig, ax = plt.subplots()
ax.plot([1, 2, 3], [0.9, 0.4, 0.02])
ax.set_ylabel("p-Wert")
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
```
```

Der Code-Block wird genau wie die externe Variante behandelt: er läuft mit
dem Ordner der Markdown-Datei als Arbeitsverzeichnis und bekommt den Zielpfad als
`sys.argv[1]`. Intern wird er dazu als Datei (z. B.
`generated/mein-slug-pwerte.generated.py` für die Abbildung
`figures/pwerte.png`) in denselben temporären Ordner geschrieben wie das
erzeugte Bild und mit diesem nach dem Lauf gelöscht. Im Ordner der Markdown-Datei
entsteht weder ein `generated/`-Ordner noch sonst eine Datei.

Beide Varianten schließen sich pro Abbildung gegenseitig aus: `script=...`
**und** ein eingebetteter Code-Block gleichzeitig ist ein Fehler, genau wie
ein Code-Block, der nicht direkt auf eine Abbildung folgt. Welche Variante
du wählst, kannst du pro Abbildung frei entscheiden — beide funktionieren
im selben Paper nebeneinander.

#### Querverweise

Im Fließtext auf eine Tabelle oder Abbildung verweisen:

```markdown
Wie in Tabelle @tab:ergebnisse zu sehen, ...
Siehe Abbildung @fig:pwerte für Details.
```

`@tab:xyz` / `@fig:xyz` werden zu `\ref{tab:xyz}` / `\ref{fig:xyz}` — das
Wort "Tabelle"/"Abbildung" davor schreibst du selbst, wie in LaTeX üblich.

#### Literatur und Zitate

Ein Literatureintrag steht als eigener Absatz (durch Leerzeilen von allem
anderen getrennt), beginnend mit seinem Key in eckigen Klammern:

```markdown
[@muster] Muster, M. (2026). Ein Beitrag zur empirischen Plausibilität.
*Archiv für Ausreichende Evidenz*, 14(2), 12--19.

[@huber2025] Huber, K. P. (2025). Zur Systematik der Alltagsentscheidung.
*Zeitschrift für Alltagsforschung*, 3(1), 5--22.
```

Im Fließtext wird mit `@cite:key` zitiert, mehrere Keys kommagetrennt:

```markdown
Bereits @cite:muster konnte zeigen, dass ... Andere Autoren
(@cite:huber2025,muster) kamen zu ähnlichen Schlüssen.
```

`@cite:key` wird zu `\cite{key}`, `@cite:a,b` zu `\cite{a,b}`. Die
Reihenfolge spielt keine Rolle — eine Zitation darf im Text vor ihrem
`[@key]`-Eintrag stehen, genau wie bei `\ref`/`\label` in LaTeX üblich.
Alle `[@key]`-Einträge im Paper werden unabhängig von ihrer Position im
Markdown gesammelt und am Ende des Artikels zu einem einzigen
`thebibliography`-Block zusammengefasst — üblicherweise schreibst du sie
daher als letzten Abschnitt ans Ende der `paper.md`.

Du kannst diesen Abschnitt optional mit einer eigenen `## Literatur`-
Überschrift einleiten, rein zur Orientierung beim Schreiben — diese
Überschrift wird beim Konvertieren aber stillschweigend übersprungen und
taucht nicht im PDF auf. Grund: `thebibliography` druckt seine Überschrift
("Literatur") ohnehin automatisch selbst; ohne diesen Schritt stünde
"Literatur" doppelt im PDF (einmal nummeriert aus der `##`-Überschrift,
einmal unnummeriert aus `thebibliography`).

Fehlt zu einem `@cite:key` der passende `[@key]`-Eintrag, oder ist ein Key
doppelt definiert, bricht der Generator mit einer klaren Fehlermeldung ab,
bevor überhaupt LaTeX aufgerufen wird — genau wie bei einer fehlenden
Bilddatei oben. Für einen BibTeX-verwalteten Literaturapparat (z. B. bei
sehr vielen Quellen über mehrere Papers hinweg) schreibst du das Paper
stattdessen als reines `main.tex`, siehe unten.

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
python generate.py mein-paper
```

Der Generator sucht die Markdown-Datei automatisch in `md/papers/`
(`mein-paper` → `md/papers/mein-paper.md`); genauso funktioniert
`python generate.py mein-paper.md`. Auch ein voller Pfad (absolut oder
relativ zum aktuellen Verzeichnis), z. B.
`python generate.py md/papers/mein-paper.md`, wird akzeptiert.

#### Alle Papers auf einmal

Ohne Angabe eines Papers verarbeitet der Generator **alle** Papers im
Ordner:

```bash
python generate.py
python generate.py --spread     # Doppelseiten-Vorschau für alle
```

Dabei gilt:

- Verarbeitet wird jede `.md`-Datei, die direkt in `md/papers/` liegt, in
  alphabetischer Reihenfolge. Unterordner (z. B. `figures/`) und andere
  Dateitypen werden nicht durchsucht bzw. ignoriert.
- Dateien, deren Name mit `_` oder `.` beginnt (z. B. `_template.md`),
  werden übersprungen.
- Die Papers werden nacheinander und unabhängig voneinander gebaut: Schlägt
  eines fehl, laufen die übrigen trotzdem weiter. Am Ende steht eine
  Zusammenfassung mit OK/FEHLER pro Paper; der Exit-Code ist 1, sobald
  mindestens ein Paper fehlgeschlagen ist, sonst 0.
- Jedes Paper bekommt wie gewohnt seine eigenen Dateien in `output/tex/`,
  `output/pdf/` und `output/png/` (benannt nach dem `slug`) und räumt
  seinen temporären Ordner selbst wieder auf.

#### Anderen Ordner verwenden: `--md-dir`

Mit `--md-dir` zeigst du dem Generator einen anderen Ordner als
`md/papers/` (Pfad absolut oder relativ zum aktuellen Verzeichnis):

```bash
python generate.py --md-dir ../andere-papers              # alle Papers dort
python generate.py mein-paper --md-dir ../andere-papers   # ein Paper dort
```

Der Ordner enthält wie `md/papers/` die Markdown-Dateien direkt (und ggf.
`figures/` usw. für deren Bilder). Bei einem einzelnen Paper wird der
Dateiname (mit oder ohne `.md`) darin nachgeschlagen; ein voller Pfad zur
Markdown-Datei funktioniert weiterhin unabhängig von `--md-dir`.

Das erzeugt in einem Rutsch:

```text
output/tex/mein-paper.tex      ← generiertes LaTeX (zum Nachsehen/Debuggen)
output/pdf/mein-paper.pdf
output/png/mein-paper.png
```

Das generierte LaTeX trägt einen Hinweis-Kommentar, dass es automatisch
erzeugt wurde — Änderungen an `output/tex/mein-paper.tex` gehen beim
nächsten Lauf verloren. Wenn du mehr Kontrolle brauchst, bearbeite
entweder die Markdown-Datei weiter, oder wechsle für dieses eine Paper auf ein
von Hand gepflegtes `main.tex` (siehe unten).

#### Was nach dem Lauf übrig bleibt

Nur die drei Dateien in `output/tex/`, `output/pdf/` und `output/png/`.
Alles, was der Generator unterwegs braucht, entsteht in einem temporären
Ordner im Temp-Verzeichnis des Betriebssystems (nicht im Projekt) und wird
am Ende jedes Laufs wieder gelöscht — auch bei Fehlern und bei Strg+C:

- das erzeugte `main.tex` (aus der `paper.md`),
- LaTeX-Hilfsdateien (`.aux`, `.log`, `.out`) und das Zwischen-PDF,
- von Diagramm-Skripten erzeugte Bilder und eingebettete Code-Blöcke,
- Zwischenbilder der Doppelseiten-Vorschau (`--spread`).

Der Ordner der Markdown-Datei (die `.md`-Dateien, `figures/`, ein von Hand geschriebenes
`main.tex` usw.) wird vom Generator nur gelesen, nie beschrieben. Auch
`__pycache__`-Ordner legt der Generator nicht an.

Einzige Ausnahme außerhalb des Projekts: LuaLaTeX pflegt seinen eigenen
Schrift-Cache im Benutzerverzeichnis (TeX-Live-Standardverhalten, nicht
vom Generator steuerbar).

### 4. Doppelseiten-Vorschau (`--spread`)

Für einen News-Feed-Look wie eine aufgeschlagene Zeitschrift kannst du statt
der ersten Seite allein ein Doppelseiten-Bild erzeugen lassen:

```bash
python generate.py mein-paper --spread
```

Das zeigt Seite 1 und Seite 2 nebeneinander, mit einem dezenten Schatten in
der Mitte ("Falz"). Hat das Paper nur eine Seite, wird automatisch eine
leere zweite Seite ergänzt, damit das Bild trotzdem wie eine echte
Doppelseite aussieht. Dieser Modus benötigt zusätzlich Pillow
(`pip install Pillow`).

## Fortgeschritten: `main.tex` direkt schreiben

Für Sonderfälle, die der Markdown-Konverter nicht abdeckt (Fußnoten,
BibTeX-verwaltete Literaturverzeichnisse, Abbildungen mit besonderem
Layout, o. ä.), kannst du ein Paper weiterhin komplett als LaTeX schreiben
und genauso mit `generate.py` kompilieren:

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
gesetzt werden. (Diese manuellen Aufrufe legen die üblichen LaTeX-
Hilfsdateien wie `main.aux` und `main.log` im Paper-Ordner ab — der
Generator-Aufruf weiter unten tut das nicht.)

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

Der einfachste Weg ist Literatur direkt in der `paper.md` zu schreiben, wie
oben unter "Literatur und Zitate" beschrieben — kein main.tex nötig.

Für ein von Hand geschriebenes `main.tex` (oder einen BibTeX-verwalteten
Literaturapparat) funktioniert ein einfaches Literaturverzeichnis auch
ohne BibTeX:

```latex
\begin{thebibliography}{9}

\bibitem{muster}
Muster, M. (2026).
Ein Beitrag zur empirischen Plausibilität.
\textit{Archiv für Ausreichende Evidenz}, 14(2), 12--19.

\end{thebibliography}
```

Für umfangreichere Papers kann später problemlos BibLaTeX ergänzt werden.
 
## Wichtig für alle `.cls`-Templates: optionale Felder korrekt speichern

Da `journal`, `keywords`, `date`, `pages` usw. jetzt öfter mal fehlen
(weil sie schlicht nicht in `veroeffentlichungen.json` stehen), muss jedes
`.cls`-Template optionale Metadatenfelder so definieren, dass ein
**nie aufgerufener** Setter nicht crasht. Das bisher verwendete Muster

```latex
\newcommand{\articlekeywords}{}
\renewcommand{\articlekeywords}[1]{\gdef\articlekeywords{#1}}
```

ist dafür ungeeignet: Wird `\articlekeywords{...}` nie aufgerufen, bleibt
`\articlekeywords` als 1-Parameter-Makro stehen (nicht als leerer Wert!),
und ein späteres `\ifx\articlekeywords\empty` oder ein bloßes
`\articlekeywords` im Fließtext bricht die Kompilierung mit einem
kryptischen `minipage`/`center`-Fehler ab.

Verwende stattdessen für jedes optionale Feld zwei getrennte Makros — ein
Speicher-Makro mit garantiertem Leer-Default, und den öffentlichen Setter,
der nur dieses Speicher-Makro füllt (genau das Muster, das `\subtitle`/
`\@subtitle` bereits richtig macht):

```latex
\def\StoredArticlekeywords{}
\newcommand{\articlekeywords}[1]{\gdef\StoredArticlekeywords{#1}}
```

und dann überall im Template `\StoredArticlekeywords` statt
`\articlekeywords` zum *Lesen* verwenden (in `\ifx`-Prüfungen und bei der
Anzeige) — der Setter-Aufruf `\articlekeywords{...}` in `main.tex` bleibt
davon unberührt. Betrifft mindestens: `journalvolume`, `journalissue`,
`journalyear`, `articledate`, `articlepages`, `articlekeywords`.

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
