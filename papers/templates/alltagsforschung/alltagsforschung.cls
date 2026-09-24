% Zeitschrift für Alltagsforschung
% Modern editorial scientific journal style

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{alltagsforschung}[2026/09/22 Methodius journal template]

\LoadClass[
  10pt,
  a4paper
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
\RequirePackage{parskip}

\setmainfont{Libertinus Serif}

\geometry{
  top=24mm,
  bottom=25mm,
  left=27mm,
  right=27mm,
  headheight=14pt,
  headsep=8mm,
  footskip=12mm
}

\definecolor{AFblue}{RGB}{35,58,88}
\definecolor{AFgray}{RGB}{95,95,95}
\definecolor{AFline}{RGB}{205,210,216}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\footnotesize\scshape\journalname}
\fancyhead[R]{\footnotesize Bd.~\journalvolume\; · \;\journalyear}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0.45pt}

\newcommand{\journalname}{Zeitschrift für Alltagsforschung}
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
  {\normalfont\large\bfseries\color{AFblue}}
  {\thesection}
  {0.65em}
  {}

\titlespacing{\section}{0pt}{15pt}{6pt}

\titleformat{\subsection}
  {\normalfont\normalsize\bfseries\color{AFblue}}
  {\thesubsection}
  {0.65em}
  {}

\titlespacing{\subsection}{0pt}{10pt}{4pt}

\captionsetup{
  font=small,
  labelfont={bf,color=AFblue},
  margin=5pt
}

\newcommand{\maketitleblock}{%
  \begin{center}
    {\small\color{AFgray}\scshape
    \journalname\quad ·\quad
    Bd.~\journalvolume, Heft~\journalissue\quad ·\quad
    \journalyear}

    \vspace{10mm}

    {\color{AFblue}\rule{\textwidth}{1.2pt}}

    \vspace{7mm}

    {\Huge\bfseries\@title\par}

    \ifx\@subtitle\@empty\else
      \vspace{3mm}
      {\large\itshape\color{AFgray}\@subtitle\par}
    \fi

    \vspace{6mm}
    {\normalsize\begin{tabular}[t]{c}\@author\end{tabular}\par}

    \vspace{3mm}

    \ifx\articledate\empty\else
      {\small\color{AFgray}
      Eingegangen: \articledate
      \ifx\articlepages\empty\else
        \quad · \quad S.~\articlepages
      \fi}
    \fi

    \vspace{8mm}

    \begin{minipage}{0.88\textwidth}
      \small
      \textbf{\color{AFblue}Zusammenfassung.}\enspace
      \@abstract
    \end{minipage}

    \ifx\articlekeywords\empty\else
      \vspace{3mm}
      \begin{minipage}{0.88\textwidth}
        \small
        \textbf{\color{AFblue}Schlüsselwörter:}\enspace
        \articlekeywords
      \end{minipage}
    \fi

    \vspace{5mm}
    {\color{AFblue}\rule{\textwidth}{0.45pt}}
    \vspace{5mm}
  \end{center}
}

\makeatother

\AtBeginDocument{
  \ifx\shorttitle\empty
    \gdef\shorttitle{\@title}
  \fi
  \maketitleblock
}

\endinput
