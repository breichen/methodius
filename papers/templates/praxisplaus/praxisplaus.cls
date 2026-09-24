% Annalen der Praktischen Plausibilität
% Older academic / archival journal style

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{praxisplaus}[2026/09/22 Methodius journal template]

\LoadClass[
  10pt,
  a4paper,
  twoside,
  twocolumn
]{article}

\RequirePackage[ngerman]{babel}
\RequirePackage{fontspec}
\RequirePackage{microtype}
\RequirePackage{geometry}
\RequirePackage{amsmath}
\RequirePackage{amssymb}
\RequirePackage{graphicx}
\RequirePackage{booktabs}
\RequirePackage{caption}
\RequirePackage{xcolor}
\RequirePackage{fancyhdr}
\RequirePackage{titlesec}
\RequirePackage{etoolbox}

\setmainfont{Libertinus Serif}

\geometry{
  top=24mm,
  bottom=25mm,
  left=20mm,
  right=20mm,
  columnsep=8mm,
  headheight=14pt,
  headsep=8mm,
  footskip=12mm
}

\definecolor{PPred}{RGB}{105,48,43}
\definecolor{PPgray}{RGB}{82,82,82}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[LE]{\footnotesize\scshape Annalen der Praktischen Plausibilität}
\fancyhead[RO]{\footnotesize\itshape\shorttitle}
\fancyfoot[CE,CO]{\thepage}
\renewcommand{\headrulewidth}{0.3pt}

\newcommand{\journalname}{Annalen der Praktischen Plausibilität}
\newcommand{\journalvolume}{}
\renewcommand{\journalvolume}[1]{\gdef\journalvolume{#1}}
\newcommand{\journalissue}{}
\renewcommand{\journalissue}[1]{\gdef\journalissue{#1}}
\newcommand{\journalyear}{}
\renewcommand{\journalyear}[1]{\gdef\journalyear{#1}}
\newcommand{\articledate}{}
\renewcommand{\articledate}[1]{\gdef\articledate{#1}}
\newcommand{\articlepages}{}
\renewcommand{\articlepages}[1]{\gdef\articlepages{#1}}
\newcommand{\shorttitle}{}
\newcommand{\articlekeywords}{}
\renewcommand{\articlekeywords}[1]{\gdef\articlekeywords{#1}}

\makeatletter

\newcommand{\subtitle}[1]{\gdef\@subtitle{#1}}
\newcommand{\abstracttext}[1]{\gdef\@abstract{#1}}
\newcommand{\shorttitlecommand}[1]{\gdef\shorttitle{#1}}

\def\@subtitle{}
\def\@abstract{}

\titleformat{\section}
  {\normalfont\normalsize\bfseries\scshape}
  {\thesection.}
  {0.55em}
  {\color{PPred}}

\titlespacing{\section}{0pt}{12pt}{4pt}

\titleformat{\subsection}
  {\normalfont\small\bfseries}
  {\thesubsection}
  {0.5em}
  {}

\titlespacing{\subsection}{0pt}{8pt}{3pt}

\captionsetup{
  font=small,
  labelfont=bf
}

\newcommand{\maketitleblock}{%
  \twocolumn[
    \begin{center}

      {\small
      \textsc{\journalname}
      \quad\textperiodcentered\quad
      \journalvolume.~Jahrgang
      \quad\textperiodcentered\quad
      \journalyear}

      \vspace{5mm}

      {\color{PPred}\rule{0.7\textwidth}{0.7pt}}

      \vspace{6mm}

      {\LARGE\bfseries\@title\par}

      \ifx\@subtitle\@empty\else
        \vspace{2mm}
        {\normalsize\itshape\@subtitle\par}
      \fi

      \vspace{5mm}

      {\normalsize\begin{tabular}[t]{c}\@author\end{tabular}\par}

      \vspace{2mm}

      \ifx\articledate\empty\else
        {\small
        Eingereicht \articledate
        \ifx\articlepages\empty\else
          \quad · \quad S.~\articlepages
        \fi}
      \fi

      \vspace{6mm}

      \begin{minipage}{0.89\textwidth}
        \small
        \textbf{Zusammenfassung.}\enspace
        \@abstract
      \end{minipage}

      \ifx\articlekeywords\empty\else
        \vspace{2mm}
        \begin{minipage}{0.89\textwidth}
          \small
          \textbf{Schlagwörter:}\enspace
          \articlekeywords
        \end{minipage}
      \fi

      \vspace{6mm}
      {\color{PPred}\rule{0.7\textwidth}{0.45pt}}
      \vspace{7mm}

    \end{center}
  ]
}

\makeatother

\AtBeginDocument{
  \ifx\shorttitle\empty
    \gdef\shorttitle{\@title}
  \fi
}

% \maketitleblock uses \twocolumn[...], which must run as the very first
% material typeset after \begin{document}. Calling it from \AtBeginDocument
% breaks LuaLaTeX with "Missing \begin{document}", so it is instead appended
% to \document itself (after the standard \@begindocumenthook processing),
% which keeps the title block fully automatic without any change needed in
% the paper's own .tex file.
\apptocmd{\document}{\maketitleblock}{}{%
  \ClassError{praxisplaus}{Could not hook \string\maketitleblock\space into
    \string\document}{Call \string\maketitleblock\space manually right
    after \string\begin{document}.}%
}

\endinput
