# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

bedingungen = [
    "Wissenschaftlich\nbegründet",
    "Verkürzt",
    "Intuitiv"
]
werte = [18.2, 21.7, 28.4]

fig, ax = plt.subplots(figsize=(7, 4.2))
ax.bar(bedingungen, werte)
ax.set_ylabel("Mittlere Entscheidungsdauer (s)")
ax.set_xlabel("Experimentalbedingung")
ax.set_ylim(0, 32)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
plt.close(fig)
