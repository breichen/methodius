# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = [
    "Deskriptiv",
    "Moderat",
    "Kontrolliert\nüberinterpretierend"
]
means = [1.84, 4.63, 7.26]
sd = [0.71, 1.18, 1.03]

fig, ax = plt.subplots(figsize=(7.0, 4.2))
x = range(len(conditions))
ax.bar(x, means, yerr=sd, capsize=4)
ax.set_xticks(list(x))
ax.set_xticklabels(conditions)
ax.set_ylabel("Bedeutungsüberschussindex (0–10)")
ax.set_ylim(0, 9)
ax.set_title("Bedeutungszuschreibung nach Interpretationsbedingung")
ax.grid(axis="y", alpha=0.2)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
plt.close(fig)
