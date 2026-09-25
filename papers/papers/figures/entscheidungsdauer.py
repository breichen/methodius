"""Erzeugt die Abbildung "Mittlere Entscheidungsdauer je Beratungsbedingung"
fuer paper.md (Abschnitt "Ergebnisse" / "Entscheidungsdauer").

Wird automatisch von generate.py aufgerufen, weil die Abbildung in
paper.md mit `script=figures/entscheidungsdauer.py` referenziert ist
(siehe README, Abschnitt "Diagramme aus Python generieren"). Aufruf:

    python entscheidungsdauer.py <ausgabepfad.png>

Die drei Werte entsprechen den im Fliesstext berichteten Mittelwerten
(31,4 s / 44,7 s / 12,8 s) -- bei einer echten Datenanalyse wuerden sie
stattdessen aus einer CSV im selben Paper-Ordner eingelesen.
"""

import sys

import matplotlib.pyplot as plt

BEDINGUNGEN = ["Sachlich\nkorrekt", "Unvoll-\nständig", "Kontrollierte\nFehlberatung"]
WERTE = [31.4, 44.7, 12.8]
FARBEN = ["#4c72b0", "#4c72b0", "#c44e52"]  # Fehlberatung farblich hervorgehoben

plt.rcParams["font.family"] = "serif"


def main(output_path: str) -> None:
    fig, ax = plt.subplots(figsize=(4.5, 3.2))
    balken = ax.bar(BEDINGUNGEN, WERTE, color=FARBEN, width=0.55)

    ax.set_ylabel("Mittlere Entscheidungsdauer (s)")
    ax.set_ylim(0, max(WERTE) * 1.25)
    ax.spines["top"].set_visible(False)
    ax.spines["right"].set_visible(False)

    for balken_einzeln, wert in zip(balken, WERTE):
        ax.text(
            balken_einzeln.get_x() + balken_einzeln.get_width() / 2,
            wert + max(WERTE) * 0.02,
            f"{wert:.1f} s".replace(".", ","),
            ha="center",
            va="bottom",
            fontsize=9,
        )

    fig.tight_layout()
    fig.savefig(output_path, dpi=300, bbox_inches="tight")


if __name__ == "__main__":
    main(sys.argv[1])
