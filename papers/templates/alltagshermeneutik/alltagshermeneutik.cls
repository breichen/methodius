\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{alltagshermeneutik}[2026/09/24 Methodius journal template]

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
\RequirePackage{etoolbox}
\RequirePackage{parskip}
\setmainfont{TeX Gyre Schola}


\geometry{
  top=24mm,
  bottom=25mm,
  left=26mm,
  right=26mm,
  headheight=14pt,
  headsep=8mm,
  footskip=12mm
}

\definecolor{Cone}{HTML}{6B4A2D}
\definecolor{Ctwo}{HTML}{C9B79C}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\footnotesize\scshape\journalname}
\fancyhead[R]{\footnotesize Bd.~\journalvolume\;\textperiodcentered\;\journalyear}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}

\newcommand{\journalname}{Methodenhefte der Alltagshermeneutik}
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
\newcommand{\shorttitlecommand}[1]{\gdef\shorttitle{#1}}
\newcommand{\abstracttext}[1]{\gdef\@abstract{#1}}

\def\@subtitle{}
\def\@abstract{}

\titleformat{\section}
  {\normalfont\large\bfseries \scshape\color{Cone}}
  {\thesection.}
  {0.55em}
  {}

\titlespacing{\section}{0pt}{13pt}{5pt}

\titleformat{\subsection}
  {\normalfont\normalsize\bfseries \scshape\color{Cone}}
  {\thesubsection}
  {0.5em}
  {}

\titlespacing{\subsection}{0pt}{9pt}{3pt}

\captionsetup{
  font=small,
  labelfont={bf,color=Cone},
  margin=5pt
}

\newcommand{\maketitleblock}{%
      \begin{center}
        {\small\scshape\journalname\quad\textperiodcentered\quad Bd.~\journalvolume, Heft~\journalissue\quad\textperiodcentered\quad\journalyear}
  
        \vspace{9mm}
  
        {\color{Cone}\rule{0.7\textwidth}{0.6pt}}
  
        \vspace{7mm}
  
        {\LARGE\bfseries\@title\par}
  
        \ifx\@subtitle\@empty\else
          \vspace{3mm}
          {\large\itshape\color{Ctwo}\@subtitle\par}
        \fi
  
        \vspace{6mm}
  
        {\normalsize\begin{tabular}[t]{c}\@author\end{tabular}\par}
  
        \ifx\articledate\empty\else
          \vspace{2mm}
          {\small Eingegangen: \articledate
          \ifx\articlepages\empty\else\quad\textperiodcentered\quad S.~\articlepages\fi}
        \fi
  
        \vspace{8mm}
  
        \ifx\@abstract\@empty\else
    \begin{minipage}{0.89\textwidth}
      \small
      \textbf{\color{Cone}Zusammenfassung.}\enspace
      \@abstract
    \end{minipage}
  \fi
  
  \ifx\articlekeywords\empty\else
    \vspace{3mm}
    \begin{minipage}{0.89\textwidth}
      \small
      \textbf{\color{Cone}Schlüsselwörter:}\enspace
      \articlekeywords
    \end{minipage}
  \fi
  
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
