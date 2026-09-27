# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

conditions = [
    "Physiologisch",
    "Organisatorisch",
    "Entwicklungsbezogen"
]
means = [2.84, 3.11, 6.72]
ci_low = [2.25, 2.55, 6.21]
ci_high = [3.43, 3.67, 7.00]

x = np.arange(len(conditions))
yerr = [
    np.array(means) - np.array(ci_low),
    np.array(ci_high) - np.array(means)
]

fig, ax = plt.subplots(figsize=(6.8, 4.2))
ax.bar(x, means, yerr=yerr, capsize=4)
ax.set_ylabel("Persönliche Bedeutung (1–7)")
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylim(0, 7.5)
ax.set_title("Persönliche Bedeutung alltäglicher Müdigkeit")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
