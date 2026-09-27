# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

conditions = [
    "Wissenschaftlicher\nOriginaltext",
    "Populärwissenschaftliche\nZusammenfassung",
    "Ratgeberempfehlung",
]

means = np.array([7.4, 5.1, 3.2])
ci_low = np.array([6.5, 4.1, 2.4])
ci_high = np.array([8.3, 6.1, 4.0])

errors = np.vstack((means - ci_low, ci_high - means))

fig, ax = plt.subplots(figsize=(7.0, 4.4))
x = np.arange(len(conditions))

ax.bar(x, means, yerr=errors, capsize=4, width=0.62)
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylabel("Zeit bis zum Handlungsbeginn (Minuten)")
ax.set_ylim(0, 9)
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
