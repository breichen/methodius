# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

stufen = ["Beobachtung", "1. Interpretation", "2. Interpretation"]
mittelwerte = [1.8, 3.7, 6.2]
fehler = [0.9, 1.2, 1.1]

fig, ax = plt.subplots(figsize=(7.0, 4.2))
ax.errorbar(
    range(len(stufen)),
    mittelwerte,
    yerr=fehler,
    fmt="o-",
    capsize=4,
    linewidth=1.5
)
ax.set_xticks(range(len(stufen)))
ax.set_xticklabels(stufen)
ax.set_ylabel("Interpretationsindex (SBÜ)")
ax.set_ylim(0, 8)
ax.grid(axis="y", alpha=0.2)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
