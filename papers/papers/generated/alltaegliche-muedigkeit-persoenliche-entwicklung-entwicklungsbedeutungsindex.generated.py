# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import numpy as np
import matplotlib.pyplot as plt

conditions = ["Kontrolle", "Belastung", "Entwicklung"]
means = np.array([31.4, 49.7, 72.8])
lower = np.array([31.4 - 6.1, 49.7 - 6.8, 72.8 - 5.7])
upper = np.array([31.4 + 6.1, 49.7 + 6.8, 72.8 + 5.7])

yerr = np.vstack([means - lower, upper - means])

fig, ax = plt.subplots(figsize=(6.6, 4.2))
x = np.arange(len(conditions))
ax.bar(x, means, width=0.62)
ax.errorbar(x, means, yerr=yerr, fmt="none", capsize=4, linewidth=1.2)
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylabel("Entwicklungsbedeutungsindex (0–100)")
ax.set_ylim(0, 90)
ax.set_title("Entwicklungsbezogene Deutung von Müdigkeit")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
plt.close(fig)
