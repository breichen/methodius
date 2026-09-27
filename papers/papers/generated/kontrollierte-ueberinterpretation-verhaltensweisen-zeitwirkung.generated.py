# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

labels = ["Ohne Zeitkomponente", "Mit Zeitkomponente"]
means = [3.52, 4.31]
ci_low = [3.43, 4.22]
ci_high = [3.61, 4.40]

x = range(len(labels))
yerr = [
    [means[i] - ci_low[i] for i in range(len(means))],
    [ci_high[i] - means[i] for i in range(len(means))]
]

fig, ax = plt.subplots(figsize=(6.4, 4.2))
ax.bar(x, means, width=0.55)
ax.errorbar(x, means, yerr=yerr, fmt="none", capsize=4)
ax.set_xticks(list(x))
ax.set_xticklabels(labels)
ax.set_ylabel("KÜI")
ax.set_ylim(0, 5.2)
ax.set_title("Überinterpretation nach zeitlicher Struktur")
ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
