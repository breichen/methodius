# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

conditions = [
    "Offene\nEntscheidung",
    "Vorstrukturierte\nEntscheidung",
    "Nahezu\nabgeschlossen"
]

before = np.array([5.83, 7.19, 8.40])
after = np.array([7.21, 8.08, 8.79])

x = np.arange(len(conditions))
width = 0.34

fig, ax = plt.subplots(figsize=(7.2, 4.6))
ax.bar(x - width / 2, before, width, label="Vor Beratung")
ax.bar(x + width / 2, after, width, label="Nach Beratung")

ax.set_ylabel("Entscheidungssicherheit (0–10)")
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylim(0, 10)
ax.legend(frameon=False)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
plt.close(fig)
