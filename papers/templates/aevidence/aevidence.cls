% Archiv für Ausreichende Evidenz
% Classic German scientific journal style

\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{aevidence}[2026/09/22 Methodius journal template]

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
  top=22mm,
  bottom=24mm,
  left=19mm,
  right=19mm,
  columnsep=7mm,
  headheight=14pt,
  headsep=7mm,
  footskip=11mm
}

\definecolor{AEgray}{RGB}{75,75,75}
\definecolor{AEline}{RGB}{165,165,165}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[LE]{\footnotesize\scshape\journalname}
\fancyhead[RO]{\footnotesize\scshape\shorttitle}
\fancyfoot[CE,CO]{\thepage}
\renewcommand{\headrulewidth}{0.35pt}
\renewcommand{\footrulewidth}{0pt}

\newcommand{\journalname}{Archiv für Ausreichende Evidenz}
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

\newcommand{\maketitleblock}{%
  \twocolumn[
    \begin{center}
      {\small\scshape
      \journalname\quad ·\quad
      Bd.~\journalvolume, Heft~\journalissue\quad ·\quad
      \journalyear
      }

      \vspace{12mm}

      {\LARGE\bfseries\@title\par}

      \ifx\@subtitle\@empty\else
        \vspace{3mm}
        {\large\itshape\@subtitle\par}
      \fi

      \vspace{6mm}

      {\normalsize\begin{tabular}[t]{c}\@author\end{tabular}\par}

      \ifx\articledate\empty\else
        \vspace{2mm}
        {\small Eingegangen: \articledate
        \ifx\articlepages\empty\else\quad ·\quad
        S.~\articlepages\fi}
      \fi

      \vspace{8mm}
      \hrule height 0.35pt
      \vspace{5mm}

      \ifx\@abstract\@empty\else
        \begin{minipage}{0.91\textwidth}
          \small
          \textbf{Zusammenfassung.}\enspace
          \@abstract
        \end{minipage}
      \fi

      \ifx\articlekeywords\empty\else
        \vspace{3mm}
        \begin{minipage}{0.91\textwidth}
          \small
          \textbf{Schlüsselwörter:}\enspace
          \articlekeywords
        \end{minipage}
      \fi

      \vspace{7mm}
    \end{center}
  ]
}

\makeatletter

\newcommand{\subtitle}[1]{\gdef\@subtitle{#1}}
\newcommand{\shorttitlecommand}[1]{\gdef\shorttitle{#1}}
\newcommand{\abstracttext}[1]{\gdef\@abstract{#1}}

\def\@subtitle{}
\def\@abstract{}

\titleformat{\section}
  {\normalfont\large\bfseries}
  {\thesection.}
  {0.5em}
  {}

\titlespacing{\section}{0pt}{13pt}{5pt}

\titleformat{\subsection}
  {\normalfont\normalsize\bfseries}
  {\thesubsection}
  {0.5em}
  {}

\titlespacing{\subsection}{0pt}{9pt}{3pt}

\captionsetup{
  font=small,
  labelfont=bf,
  width=.95\columnwidth
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
  \ClassError{aevidence}{Could not hook \string\maketitleblock\space into
    \string\document}{Call \string\maketitleblock\space manually right
    after \string\begin{document}.}%
}

\endinput
