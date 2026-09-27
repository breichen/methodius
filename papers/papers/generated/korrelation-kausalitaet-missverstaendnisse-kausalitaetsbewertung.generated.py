# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["Korrelation", "Zeitliche\nSequenz", "Randomisierung"]
means = [58.6, 71.8, 41.3]
errors = [18.4, 15.9, 17.2]

fig, ax = plt.subplots(figsize=(6.4, 4.2))
x = range(len(conditions))

ax.bar(x, means, yerr=errors, capsize=4)
ax.set_xticks(list(x))
ax.set_xticklabels(conditions)
ax.set_ylabel("Kausalitätsbewertung (0–100)")
ax.set_ylim(0, 100)
ax.set_title("Mittlere Kausalitätsbewertung nach Darstellungsbedingung")
ax.grid(axis="y", alpha=0.25)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
