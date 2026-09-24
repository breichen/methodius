\NeedsTeXFormat{LaTeX2e}
\ProvidesClass{ueberzeugungsforschung}[2026/09/24 Methodius journal template]

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

\setmainfont{TeX Gyre Bonum}


\geometry{
  top=23mm,
  bottom=25mm,
  left=20mm,
  right=20mm,
  columnsep=7mm,
  headheight=14pt,
  headsep=7mm,
  footskip=11mm
}

\definecolor{Cone}{HTML}{C1440E}
\definecolor{Ctwo}{HTML}{F2A007}

\pagestyle{fancy}
\fancyhf{}
\fancyhead[LE]{\footnotesize\scshape\journalname}
\fancyhead[RO]{\footnotesize\itshape\shorttitle}
\fancyfoot[CE,CO]{\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0pt}

\newcommand{\journalname}{Mitteilungen zur Dynamischen Überzeugungsforschung}
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
  width=.95\columnwidth
}

\newcommand{\maketitleblock}{%
  \twocolumn[
        \begin{center}
          {\small\scshape\journalname\quad\textperiodcentered\quad Bd.~\journalvolume, Heft~\journalissue\quad\textperiodcentered\quad\journalyear}
    
          \vspace{9mm}
    
          {\color{Cone}\rule{\textwidth}{0.9pt}}
    
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
    
          \begin{minipage}{0.88\textwidth}
      \small
      \setlength{\fboxsep}{3mm}\setlength{\fboxrule}{0.8pt}
      \fcolorbox{Cone}{white}{%
        \begin{minipage}{\dimexpr0.88\textwidth-6mm\relax}
        \ifx\@abstract\@empty\else
          \textbf{\color{Cone}Zusammenfassung.}\enspace\@abstract
        \fi
        \ifx\articlekeywords\empty\else
          \\[2mm]\textbf{\color{Cone}Schlüsselwörter:}\enspace\articlekeywords
        \fi
        \end{minipage}%
      }
    \end{minipage}
    
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
  \ClassError{ueberzeugungsforschung}{Could not hook \string\maketitleblock\space into
    \string\document}{Call \string\maketitleblock\space manually right
    after \string\begin{document}.}%
}

\endinput
