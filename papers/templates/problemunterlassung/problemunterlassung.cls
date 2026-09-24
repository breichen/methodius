\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{problemunterlassung}[2026/09/24 Methodius journal template]

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
\setmainfont{Caladea}
\newfontfamily\headfont{TeX Gyre Heros}

\geometry{
  top=24mm,
  bottom=25mm,
  left=25mm,
  right=25mm,
  headheight=14pt,
  headsep=8mm,
  footskip=12mm
}

\definecolor{Cone}{HTML}{465C73}
\definecolor{Ctwo}{HTML}{9FB2C2}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\footnotesize\headfont\scshape\color{Ctwo}\journalname}
\fancyhead[R]{\footnotesize\headfont\color{Ctwo} Bd.~\journalvolume\;\textperiodcentered\;\journalyear}
\fancyfoot[C]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}

\newcommand{\journalname}{Zeitschrift für Angewandte Problemunterlassung}
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
  {\normalfont\large\bfseries\headfont\color{Cone}}
  {\thesection}
  {0.6em}
  {}

\titlespacing{\section}{0pt}{14pt}{5pt}

\titleformat{\subsection}
  {\normalfont\normalsize\bfseries\headfont\color{Cone}}
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
  \noindent
  \begin{minipage}[t]{0.64\textwidth}
    {\LARGE\bfseries\@title\par}
    \ifx\@subtitle\@empty\else
      \vspace{2mm}
      {\large\itshape\color{Ctwo}\@subtitle\par}
    \fi
    \vspace{5mm}
    {\normalsize\begin{tabular}[t]{c}\@author\end{tabular}\par}
  \end{minipage}%
  \hfill
  \begin{minipage}[t]{0.32\textwidth}
    \small
    \setlength{\fboxsep}{3mm}
    \setlength{\fboxrule}{0.7pt}
    \fcolorbox{Ctwo}{white}{%
      \begin{minipage}[t]{\dimexpr\linewidth-6mm\relax}
      \headfont\scshape\color{Cone}\journalname\par
      \normalfont Bd.~\journalvolume, Heft~\journalissue\par
      \journalyear\par
      \ifx\articledate\empty\else\vspace{1.5mm}Eingegangen: \articledate\par\fi
      \ifx\articlepages\empty\else S.~\articlepages\par\fi
      \end{minipage}%
    }
  \end{minipage}
  
  \vspace{8mm}
  {\color{Cone}\rule{\textwidth}{0.8pt}}
  \vspace{5mm}
  
  \ifx\@abstract\@empty\else
    \noindent{\bfseries\headfont\color{Cone}Zusammenfassung.}\enspace\@abstract\par
  \fi
  \ifx\articlekeywords\empty\else
    \vspace{2.5mm}
    \noindent{\bfseries\headfont\color{Cone}Schlüsselwörter:}\enspace\articlekeywords\par
  \fi
  
  \vspace{6mm}
  {\color{Ctwo}\rule{\textwidth}{0.4pt}}
  \vspace{6mm}
}

\makeatother

\AtBeginDocument{
  \ifx\shorttitle\empty
    \gdef\shorttitle{\@title}
  \fi
  \maketitleblock
}


\endinput
