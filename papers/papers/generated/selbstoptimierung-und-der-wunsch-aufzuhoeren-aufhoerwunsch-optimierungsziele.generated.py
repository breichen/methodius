# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

gruppen = ["≤ 3 Ziele", "4–5 Ziele", "≥ 6 Ziele"]
mittelwerte = [2.7, 4.0, 5.6]
fehler = [0.45, 0.39, 0.51]

fig, ax = plt.subplots(figsize=(7.2, 4.5))
x = range(len(gruppen))
ax.bar(x, mittelwerte, yerr=fehler, capsize=4)
ax.set_xticks(list(x))
ax.set_xticklabels(gruppen)
ax.set_ylabel("Aufhörwunsch (1–7)")
ax.set_xlabel("Anzahl aktiver Optimierungsziele")
ax.set_ylim(0, 7)
ax.set_title("Aufhörwunsch nach Optimierungsverdichtung")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
