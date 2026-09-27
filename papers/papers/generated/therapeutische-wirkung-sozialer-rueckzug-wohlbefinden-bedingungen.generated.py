# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

conditions = [
    "Reguläre\nInteraktion",
    "Moderierte\nInteraktion",
    "Kontrollierter\nRückzug"
]
means = [1.7, 5.9, 14.8]
ci_low = [-0.9, 3.0, 11.7]
ci_high = [4.3, 8.8, 17.9]

x = np.arange(len(conditions))
yerr = [
    np.array(means) - np.array(ci_low),
    np.array(ci_high) - np.array(means)
]

fig, ax = plt.subplots(figsize=(7.2, 4.5))
ax.bar(x, means, width=0.62)
ax.errorbar(x, means, yerr=yerr, fmt="none", capsize=4, linewidth=1.2)

ax.set_ylabel("Veränderung des ISE-12")
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylim(0, 20)
ax.axhline(0, linewidth=0.8)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
