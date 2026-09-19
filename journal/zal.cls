% !TeX root = ./template.tex
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%
%%% Copyright (C) 2026 by Dr. Maximilian Methodius
%%%
%%% DESCRIPTION:
%%% This class provides a template for the Dr. Methodius journal
%%% with proper formatting according to journal guidelines.
%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%
%%% Commands:
%%% 1. \title{<long title>}
%%% 2. \shorttitle{<short title>}
%%% 3. \author[<optional arguments>]{<author name>}
%%%      Available optional arguments (separated by commas):
%%%        digital : address label
%%%        * : This author and other authors contributed equally to this work.
%%%        + : This author is the corresponding author.
%%% 4. \address[<address label>]{<address>}
%%% 5. \corremail{<correspondence e-mail>}
%%% 6. \zalsetup{<key-value>}
%%%      <key>          : <value>                   |<default>
%%%      doi            = <doi>                     |10.1007/sxxxxx-yyy-zzzz-1
%%%      received       = <received time>           |\today
%%%      accepted       = <accepted time>           |\today
%%%      issue          = <issue No.>               |0
%%%      volume         = <volume No.>              |0
%%%      article-id     = <online article id>       |1
%%%      first-page     = <first page No.>          |1
%%%      publish-year   = <publish year>            |\year
%%%      publish-month  = <publish month>           |January
%%% 7. \keywords{<keywords>}
%%%      Capitalize the first word of each semicolon-separated keyword group.
%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%
%%% Environments:
%%% 1. abstract
%%% \begin{abstract}
%%%   <abstract context>
%%% \end{abstract}
%%% 2. biography
%%% \begin{biography}[<author name>]{<author photo file name>}
%%%   <author biography context after the name>
%%% \end{biography}
%%% 3. lemma, definition, corollary, proposition, theorem, example & proof
%%% \begin{<theorem name>}
%%%   <theorem context>
%%% \end{<theorem name>}
%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%
%%% Options:
%%%   research(default), review, editorials, letters, perspectives
%%%   "research" describing original investigations relevant to Computer Science;
%%%   "review" giving an in-depth overview of certain topic or a review of one's
%%%     own work or one laboratory or a group of researchers;
%%%   "editorials" providing overview on certain topic written by well known
%%%     scientists in the field.
%%%   example: \documentclass[research]{zal}
%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%%
%%% More detailed instructions are given below, following the definitions.
%%% This template is compatible to TeXLive 2020.
%%%
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\NeedsTeXFormat{LaTeX2e}
\ProvidesExplClass{zal}{2026/06/11}{v1.5}{Z. Angew. Lebens. journal template}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Required packages and L3 compatibility checks
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage{ xparse, xtemplate }

% Define error messaging functions
\cs_new:Npn \__zal_msg_new:nn   { \msg_new:nnn { zal } }
\cs_new:Npn \__zal_msg_error:nn { \msg_error:nnn { zal } }
\cs_generate_variant:Nn \__zal_msg_error:nn { nx } % For variable messages

% Show error message for old l3 packages
\__zal_msg_new:nn { l3-too-old }
  {
    Package~"#1"~is~too~old. \\\\
    Please~update~an~up-to-date~version~of~the~bundles \\
    "l3kernel"~and~"l3packages"~using~your~TeX~package \\
    manager~or~from~CTAN.
  }

% Check for minimum versions of LaTeX3 packages
\clist_map_inline:nn { expl3, xparse, xtemplate }
  {
    \@ifpackagelater { #1 } { 2020/01/01 } { }
      { \__zal_msg_error:nn { l3-too-old } { #1 } }
  }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Class Options Processing
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Define variables for class options
\tl_new:N \g__zal_article_type_tl
\tl_new:N \g__zal_article_fontsize_tl

% Helper function to set default values if not already set
\cs_new_protected:Npn \__zal_set_default_value:Nn #1#2
  { \tl_if_empty:NT #1 { \tl_gset:Nn #1 { #2 } } }

% Define keys for document options
\keys_define:nn { zal / option }
  {
    % Article type options
    review      .code:n = { \tl_gset:Nn \g__zal_article_type_tl { REVIEW~ARTICLE } },
    research    .code:n = { \tl_gset:Nn \g__zal_article_type_tl { RESEARCH~ARTICLE } },
    editorials  .code:n = { \tl_gset:Nn \g__zal_article_type_tl { EDITORIALS } },
    letters     .code:n = { \tl_gset:Nn \g__zal_article_type_tl { LETTERS } },
    perspectives.code:n = { \tl_gset:Nn \g__zal_article_type_tl { PERSPECTIVES } },

    % No value allowed for these options
    review      .value_forbidden:n = true,
    research    .value_forbidden:n = true,
    editorials  .value_forbidden:n = true,
    letters     .value_forbidden:n = true,
    perspectives.value_forbidden:n = true,
  }

% Process options based on LaTeX version
\IfFormatAtLeastTF { 2022-06-01 }
  {
    \ProcessKeyOptions [ zal / option ]
  }
  {
    \RequirePackage { l3keys2e }
    \ProcessKeysOptions { zal / option }
  }

% Set default values if not specified through options
\__zal_set_default_value:Nn \g__zal_article_type_tl { RESEARCH~ARTICLE }
\__zal_set_default_value:Nn \g__zal_article_fontsize_tl { 9pt }

% Load the base class with appropriate options
\LoadClass [ twoside, \g__zal_article_fontsize_tl ] { extarticle }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Required Packages
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RequirePackage
  {
    % Mathematics packages
    amsmath,    % Mathematical typesetting
    amssymb,    % Mathematical symbols
    amsthm,     % Theorem environments

    % Layout and design packages
    caption,    % Customizing captions
    fancyhdr,   % Headers and footers
    geometry,   % Page geometry
    graphicx,   % Graphics inclusion
    marvosym,   % Symbols (for email symbol)
    titlesec,   % Section titles formatting

    % Utility packages
    array,      % Column types for tables
    booktabs,   % Better tables
    cite,       % Citation management
    etoolbox,   % Programming tools
    enumitem,   % List customization
    flushend,   % Balance columns on last page
    xurl,       % URL handling

    % Graphics packages
    eso-pic,    % Add picture at absolute positions
    tcolorbox,  % Colored boxes
    tikz,       % Drawing tool
    xcolor,     % Color extensions
  }

% Configure graphics
\graphicspath { { figures/ } }

% Add zal logo
\ExplSyntaxOff

\usetikzlibrary{calc}

\newlength{\logoframepad}
\setlength{\logoframepad}{3mm}

\AddToShipoutPictureBG*
{
	\begin{tikzpicture}[remember picture, overlay, every node/.style={inner sep=0pt}]
		\node[anchor=north east, xshift=-22mm, yshift=-5mm] (methodiuslogo) 
		at (current page.north east) 
		{\phantom{\includegraphics[width=1.5cm]{logo.png}}};
		
		% Untere linke und obere rechte Ecke direkt bestimmen
		\coordinate (frame-bl) at ($(methodiuslogo.south west) + (-\logoframepad,-\logoframepad)$);
		\coordinate (frame-tr) at ($(methodiuslogo.north east |- current page.north east) + (\logoframepad,0)$);
		
		% Die anderen beiden Ecken EXPLIZIT aus x/y von bl und tr zusammensetzen
		\path let \p1 = (frame-bl), \p2 = (frame-tr) in
		coordinate (frame-tl) at (\x1,\y2)
		coordinate (frame-br) at (\x2,\y1);
		
		% Fläche füllen (ohne Rand)
		\fill[methodiuscream] (frame-bl) rectangle (frame-tr);
		
		% Nur linke, untere und rechte Kante zeichnen
		%\draw[thick] (frame-tl) -- (frame-bl) -- (frame-br) -- (frame-tr);
		
		% Logo zuletzt zeichnen, damit es oben liegt
		\node[anchor=north east, xshift=-22mm, yshift=-5mm] 
		at (current page.north east) 
		{\includegraphics[width=1.5cm]{logo.png}};
	\end{tikzpicture}
}

\ExplSyntaxOn

% Configure fonts
\RequirePackage { newtxtext, newtxmath }
\tl_set:Nn \ttdefault { cmtt }

% Improve justification in narrow journal columns without forcing loose spacing
\IfFileExists { microtype.sty }
  {
    \RequirePackage { microtype }
    \microtypesetup { protrusion = true, expansion = true }
  }
  { }
\pretolerance = 100
\tolerance = 2000
\emergencystretch = 1em
\hyphenpenalty = 100
\exhyphenpenalty = 50

% Configure refs
\RequirePackage
  [
    colorlinks,
    citecolor = methodiusred,
    linkcolor = methodiusred,
    urlcolor = methodiusred,
  ] { hyperref }
\RequirePackage [ capitalise, nameinlink ] { cleveref }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Color Definitions
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Define standard colors
\definecolor { methodiusred }   { HTML } { B5292C }
\definecolor { methodiusnavy } { HTML } { 1B2340 }
\definecolor { methodiuscream } { HTML } { F1ECE2 }

% Color text commands
\NewDocumentCommand \textred { m }
  { \textcolor { methodiusred } { #1 } }
\NewDocumentCommand \textnavy { m }
  { \textcolor { methodiusnavy } { #1 } }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Data Structures
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Author and address storage
\seq_new:N \g__zal_authors_seq
\seq_new:N \g__zal_addresses_seq
\tl_new:N \g__zal_corr_email_tl
\tl_new:N \g__zal_first_author_tl
\tl_new:N \g__zal_short_author_tl
\tl_new:N \g__zal_short_title_tl
\bool_new:N \g__zal_has_equal_contrib_bool

% New counter for addresses
\newcounter { zal@address }
\setcounter { zal@address } { 0 }

% Common journal strings
\tl_set:Nn \l__zal_etal_tl
  { et~al. }

\ExplSyntaxOff

\NewTotalTColorBox { \zalheaderbox } { O{methodiuscream} m } {
	on line,
	colback = #1,
	colframe = #1,
	boxrule = 0pt,
	arc = 0pt,
	left = 3pt, right = 3pt,
	top = 3pt, bottom = 1pt,
	boxsep = 0pt,
	fontupper = \color{methodiusred},
} { #2 }

\ExplSyntaxOn

% Page header/footer strings
\tl_set:Nn \l__zal_short_detailed_page_tl
{
	\zalheaderbox
	{
		\l__zal_short_journal_name_tl
		,~
		\int_use:N \l__zal_publish_year_int
		,~
		\int_to_arabic:n \l__zal_issue_int
		(
		\int_to_arabic:n \l__zal_volume_int
		):~
		\int_to_arabic:n \l__zal_first_page_int
	}
}

\tl_set:Nn \l__zal_long_detailed_page_tl
{
	\normalsize
	\zalheaderbox
	{
		\textbf{ \l__zal_long_journal_name_tl }
		\footnotesize
		\ $\vert$\
		Heft~\int_to_arabic:n \l__zal_issue_int
		\ $\vert$\
		Band~\int_to_arabic:n \l__zal_volume_int
		\ $\vert$\
		\l__zal_publish_month_tl\ {\int_use:N \l__zal_publish_year_int}
		\ $\vert$\
		ZAL~\l__zal_article_id_tl
		-
		\int_use:c { c@page }
	}
}

% Journal name strings
\tl_set:Nn \l__zal_short_journal_name_tl
  { Z.~Angew.~Lebensf. }

% Zeitschrift für angewandte Lebensführung
% Mitteilungen aus der angewandten Lebenswissenschaft
% Beiträge zur fragwürdigen Lebensoptimierung
% Notizen aus der angewandten Daseinsbewältigung
% Rundschreiben für praktische Lebensfragen
% Fortschritte der angewandten Lebenswissenschaft

\tl_set:Nn \l__zal_long_journal_name_tl
  { \textbf{\textsf{Zeitschrift}}~\textit{für}~\textbf{\textsf{angewandte~Lebensführung}} }

% DOI URL string
\tl_set:Nn \l__zal_doi_url_tl
  { https://doi.org/ \l__zal_doi_tl }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Page Setup and Layout
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Set page size and margin
\geometry{
  paperwidth  = 216mm,
  paperheight = 283mm,
  left        = 18mm,
  right       = 18mm,
  top         = \dimexpr 26.5mm + 6mm,
  bottom      = \dimexpr 17.5mm + 3mm,
  footskip    = \dimexpr 8.5mm + 2mm,
  columnsep   = 4mm,
}

% Set line spacing and paragraph indentation
\linespread { 1.15 } \selectfont
\dim_set:Nn \parindent { 1.2em }

% Table column helpers. Use F for the first column when it should be centered.
\newcolumntype { L } [1] { > { \raggedright\arraybackslash } p { #1 } }
\newcolumntype { F } [1] { > { \centering\arraybackslash } p { #1 } }
\newcolumntype { R } [1] { > { \raggedleft\arraybackslash } p { #1 } }

% Configure header and footer styles
\pagestyle { fancy }
\fancyhf { }

\fancyhead [ CO ]
  {
    \small
    \textnavy{ \l__zal_short_detailed_page_tl }
  }
\fancyhead [ CE ]
  {
	\small
	\textnavy{ \zalheaderbox{ \g__zal_short_author_tl \quad \g__zal_short_title_tl } }
  }
\fancyfoot [ RO, LE ]
  {
    \l__zal_long_detailed_page_tl
  }

\RenewDocumentCommand \headrulewidth { } { 0pt }

% Configure first page style
\fancypagestyle { plain }
  {
    \fancyhf { }
    \fancyhead [ L ]
      {
        \normalsize
        \textnavy { \l__zal_doi_url_tl }
      }
    \fancyfoot [ RO, LE ]
      {
        \l__zal_long_detailed_page_tl
      }
  }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Section and Paragraph Formatting
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Set section numbering depth
\setcounter { secnumdepth } { 4 }

% Format section headers
\titleformat
  { \section }
  { \linespread { 1 } \normalfont \fontsize{11pt}{13pt}\selectfont \bfseries }
  { \textred{ \fontsize{11pt}{11pt}\selectfont $\blacksquare$ }~\thesection }
  { 1ex }
  { }

\titleformat
  { name = \section, numberless }
  { \linespread { 1 } \normalfont \fontsize{11pt}{13pt}\selectfont \bfseries }
  { \textred{ \fontsize{9pt}{9pt}\selectfont $\blacksquare$ } }
  { 0.5ex }
  { }
  [ \fontsize{5.5pt}{10pt} \selectfont ]

\titleformat
  { \subsection }
  { \linespread { 1 } \normalfont \fontsize{10pt}{12pt}\selectfont \bfseries }
  { \textred{ \fontsize{7pt}{7pt}\selectfont $\blacksquare$ }~\thesubsection }
  { 1ex }
  { }

\titleformat
  { \subsubsection }
  { \linespread { 1 } \normalfont \fontsize{11pt}{13pt}\selectfont \bfseries }
  { \thesubsubsection }
  { 1em }
  { }

\titleformat
  { \paragraph }
  { \normalfont \normalsize \bfseries }
  { $\bullet$ }
  { 1ex }
  { }

\titleformat
  { \subparagraph }
  [ runin ]
  { \normalfont \normalsize \bfseries }
  { }
  { 0pt }
  { }

% Configure section spacing
\titlespacing*
  { \section }
  { 0pt }
  { 1em plus 1ex minus 1ex }
  { 0pt }

\titlespacing*
  { \subsection }
  { 0pt }
  { 1em plus 1ex minus 1ex }
  { 0pt }

\titlespacing*
  { \subsubsection }
  { 0pt }
  { 1ex plus 1ex minus 1ex }
  { 0pt }

\titlespacing*
  { \paragraph }
  { 0pt }
  { 1pt plus 1pt minus 1pt }
  { 0pt }

\titlespacing
  { \subparagraph }
  { \parindent }
  { 0pt plus 1pt }
  { 0pt }

% Configure list spacing
\setlist{
  itemsep       = 0pt plus 2pt,
  parsep        = 0pt plus 2pt,
  topsep        = 0pt plus 2pt,
  partopsep     = 0pt,
  itemindent    = 0pt,
  listparindent = \parindent,
}

\setlist [ itemize ] {
  label       = $\bullet$,
  leftmargin  = 0pt,
  labelwidth  = 0.6em,
  labelsep    = 0.4em,
  itemindent  = 1.4em,
  align       = left,
}

\setlist [ enumerate ] {
  leftmargin = *,
  labelsep   = 0.55em,
}

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Commands Definitions
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Short title command
\NewDocumentCommand \shorttitle { m }
  { \tl_gset:Nn \g__zal_short_title_tl { #1 } }

% Title command
\RenewDocumentCommand \title { m }
  {
    \tl_gset:Nn \g__zal_title_tl { #1 }
    \__zal_set_default_value:Nn \g__zal_short_title_tl { #1 }
  }

% Author command with optional arguments
\RenewDocumentCommand \author { O{} m }
  {
    \seq_put_right:Nn \g__zal_authors_seq
      {
        % Print author name
        \group_begin:
          \fontsize{10pt}{12pt} \selectfont #2
        \group_end:
        % Deal with optional arguments
        \clist_clear:N \l_tmpa_clist % Store digitals
        \clist_clear:N \l_tmpb_clist % Store symbols (*, +)
        \clist_map_inline:nn { #1 }
          {
            \regex_match:nnTF { ^\d+$ } { ##1 }
              { \clist_put_right:Nn \l_tmpa_clist { ##1 } }
              { \clist_put_right:Nn \l_tmpb_clist { ##1 } }
          }
        % Print superscript
        \clist_if_empty:NTF \l_tmpa_clist
          { % Without address
            \textsuperscript
            {
              \clist_if_in:NnT \l_tmpb_clist { * } { * }
            }
          }
          { % With address
            \clist_set:Nx \l_tmpa_clist 
              { \clist_map_function:NN \l_tmpa_clist \__zal_ref:n }
            \textsuperscript 
              { 
                \clist_use:Nn \l_tmpa_clist { , }
                \clist_if_in:NnT \l_tmpb_clist { * } { ,* }
              }
          }
        % Print corresponding author symbol
        \clist_if_in:NnT \l_tmpb_clist { + } 
          { 
            \group_begin:
              \huge \Letter
            \group_end:
          }
        % Assign value for \g__zal_has_equal_contrib_bool
        \clist_if_in:NnT \l_tmpb_clist { * } 
          { \bool_set_true:N \g__zal_has_equal_contrib_bool }
      }
    \__zal_set_default_value:Nn \g__zal_first_author_tl { #2 }
  }

% Helper function for reference formatting
\cs_new:Npn \__zal_ref:n #1
  { \exp_not:N \ref { #1 } , }

% Address command with optional label
\NewDocumentCommand \address { o m }
  {
    \IfNoValueTF { #1 }
      { \seq_put_right:Nn \g__zal_addresses_seq { #2 } }
      {
        \seq_put_right:Nn \g__zal_addresses_seq
          {
            \refstepcounter { zal@address }
            \label { #1 }
            \int_use:c { c@zal@address }
            .~#2
          }
      }
  }

% Correspondence email
\NewDocumentCommand \corremail { m }
  { \tl_gset:Nn \g__zal_corr_email_tl { #1 } }

% Document setup command with key-value interface
\NewDocumentCommand \zalsetup { m }
  { \keys_set:nn { zal } { #1 } }

% Define keys for document setup
\keys_define:nn { zal }
  {
    % Metadata keys
    doi            .tl_set:N  = \l__zal_doi_tl,
    received       .tl_set:N  = \l__zal_received_time_tl,
    accepted       .tl_set:N  = \l__zal_accepted_time_tl,
    copyright      .tl_set:N  = \l__zal_copyright_tl,
    article-id     .tl_set:N  = \l__zal_article_id_tl,
    issue          .int_set:N = \l__zal_issue_int,
    volume         .int_set:N = \l__zal_volume_int,
    first-page     .int_set:N = \l__zal_first_page_int,
    publish-year   .int_set:N = \l__zal_publish_year_int,
    publish-month  .tl_set:N = \l__zal_publish_month_tl,

    % Default values
    doi            .initial:n = { 10.1007/sxxxxx-yyy-zzzz-1 },
    received       .initial:n = \today,
    accepted       .initial:n = \today,
    copyright      .initial:n = { \copyright\ Methodius-Institut\ \int_use:N \year },
    article-id     .initial:n = { 1 },
    issue          .initial:n = { 0 },
    volume         .initial:n = { 0 },
    first-page     .initial:n = { 1 },
    publish-year   .initial:n = \year,
    publish-month  .initial:n = Jänner,

    % Special handling for first-page
    first-page     .code:n    =
      {
        \int_set:cn { c@page } { #1 }
        \int_set:Nn \l__zal_first_page_int { #1 }
      },
  }

% Format function for abstract and keywords
\cs_new_protected:Npn \__zal_abstract_keywords_format:nn #1#2
  { \noindent \bfseries #1 \\ \normalfont #2 \par }

% Keywords command
\NewDocumentCommand \keywords { m }
  {
    \tl_set:Nn \l__zal_keywords_tl
      { \__zal_abstract_keywords_format:nn { Schlüsselwörter } { #1 } }
  }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Abstract Environment
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\RenewDocumentEnvironment { abstract } { +b }
  {
    \tl_gset:Nn \g__zal_abstract_tl
      { \__zal_abstract_keywords_format:nn { Abstract } { #1 } }
  } { }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Float Environments
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Caption setup
\captionsetup
  {
    font      = footnotesize,
    labelfont = bf,
    labelsep  = quad,
    belowskip = 0pt,
  }

% Table caption setup
\captionsetup [ table ]
  {
    justification   = RaggedRight,
    singlelinecheck = false,
    position        = top,
    aboveskip       = 0pt plus 3pt
  }

% Figure caption setup
\captionsetup [ figure ]
  {
    aboveskip = 5pt plus 3pt minus 3pt,
  }

% Adjust float spacing
\skip_set:Nn \intextsep { 4mm }

% Rename figure caption
\RenewDocumentCommand \figurename { } { Fig. }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Theorem Environment
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Set up titlecase function based on expl3 version
\@ifpackagelater { expl3 } { 2019/11/20 }
  {
    \cs_set_eq:NN \__zal_titlecase:n \text_titlecase:n
  }
  {
    % Fallback for older expl3 versions
    \cs_new_protected:Npn \__zal_titlecase:n #1
      {
        \tl_set:Nn \l__zal_titlecase_tl { #1 }
        \tl_set:Nn \l__zal_titlecase_head_tl { \tl_head:n { #1 } }
        \cs_generate_variant:Nn \tl_remove_once:Nn { Nx }
        \tl_remove_once:Nx \l__zal_titlecase_tl \l__zal_titlecase_head_tl
        \__zal_uppercase:n \l__zal_titlecase_head_tl
        \l__zal_titlecase_tl
      }
  }

% Set up theorem environments
\theoremstyle { definition }

% Function to create theorem-like environments
\cs_new_protected_nopar:Npn \__zal_new_theorem:n #1
  {
    \newtheorem { #1 } { \__zal_titlecase:n { #1 } }
    \newtheorem* { #1* } { \__zal_titlecase:n { #1 } }
  }

% Define theorem-like environments
\clist_set:Nn \l__theorem_label_clist
  {
    lemma, definition, corollary, proposition, theorem, example
  }
\clist_map_function:NN \l__theorem_label_clist \__zal_new_theorem:n

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Bibliography Environment
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\patchcmd{\thebibliography}
  { \advance \leftmargin \labelsep }
  {
    \leftmargin = 0pt
    \itemindent = \labelwidth
    \advance \itemindent \labelsep
    \parsep     = 0pt
    \itemsep    = 0pt
  }
  { }
  { }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Biography Environment
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

\dim_const:Nn \c__zal_biography_photo_width_dim { 15mm }

\NewDocumentEnvironment { biography } { O{} m +b }
  { \__zal_biography:nnn { #1 } { #2 } { #3 } } { }

\cs_new_protected:Npn \__zal_biography:nnn #1#2#3
  {
    \noindent
    \begin{minipage}{\linewidth}
      \begin{minipage}[c]{\c__zal_biography_photo_width_dim}
          \begin{tikzpicture}
            \clip (0,0) circle (\dimexpr\c__zal_biography_photo_width_dim/2);
            \node[inner~sep=0pt] at (0,0)
              {
                \includegraphics
                [
                  width=\c__zal_biography_photo_width_dim,
                  height=\c__zal_biography_photo_width_dim,
                  keepaspectratio
                ]{#2}
              };
              \draw[methodiusred, line~width = 0.75pt] (0,0) circle (\dimexpr\c__zal_biography_photo_width_dim/2);
          \end{tikzpicture}
      \end{minipage}
      \hspace{3mm}
      \begin{minipage}[c]{\dimexpr\textwidth-18mm}
        \fontsize{8.5pt}{10pt} \selectfont
        \tl_if_blank:nTF { #1 } { #3 } { #1~#3 }
      \end{minipage}
    \end{minipage}
  }

%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%
%%% Article Type Box and Title
%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%%

% Define article type box
\newtcolorbox { articletypebox }
  {
    colback = methodiuscream,
    sharp~corners,
    %rounded~corners = southeast,
    width = \dimexpr .5\textwidth - 6mm,
    height = 17pt,
    arc = 8.5pt,
    boxrule = 0pt,
    left = 1.5ex,
    valign = center,
    fontupper = \fontsize { 11pt } { 13pt } \selectfont,
    before~upper = { \color { methodiusred } },
    nobeforeafter,
  }

% Define maketitle command
\RenewDocumentCommand \maketitle { }
  {
    \thispagestyle { plain }
    \twocolumn
      [
        \skip_vertical:N -6mm

        % Article type
        \begin{articletypebox}
          \g__zal_article_type_tl
        \end{articletypebox}

        \skip_vertical:N 6mm

        % Title
        \group_begin:
          \fontsize{18pt}{14pt} \selectfont \bfseries \g__zal_title_tl \par
        \group_end:

        \skip_vertical:N 5mm

        % Author list
        \seq_use:Nn \g__zal_authors_seq {,~}

        \skip_vertical:N 5mm

        % Set short author format for header
        \if_int_compare:w 1 < \seq_count:N \g__zal_authors_seq
          \tl_gset:Nn \g__zal_short_author_tl { \g__zal_first_author_tl \ \l__zal_etal_tl}
        \else:
          \tl_gset:Nn \g__zal_short_author_tl \g__zal_first_author_tl
        \fi:

        % Addresses
        \color_group_begin:
        \color_select:n { black!70 }
        \seq_use:Nn \g__zal_addresses_seq { \par }
        \color_group_end:

        \skip_vertical:N 5mm

        % Publication metadata
        \textred{ Erhalten\ \l__zal_received_time_tl;\ akzeptiert\ \l__zal_accepted_time_tl }
        \par
        \color_group_begin:
        \color_select:n { black!70 }
        E-mail:\ \g__zal_corr_email_tl .
        \IfBooleanT { \g__zal_has_equal_contrib_bool }
          { \quad *\ Diese\ Autoren\ haben\ gleichermaßen\ zu\ dieser\ Arbeit\ beigettragen. }
        \color_group_end:
        \par
        \textred{ \bfseries \l__zal_copyright_tl }

        \skip_vertical:N 5mm

        % Abstract
        \g__zal_abstract_tl

        \skip_vertical:N 5mm

        % Keywords
        \l__zal_keywords_tl

        \skip_vertical:N 5mm
      ]
  }

% Auto-run \maketitle at the beginning of document
\AfterEndPreamble { \maketitle }
