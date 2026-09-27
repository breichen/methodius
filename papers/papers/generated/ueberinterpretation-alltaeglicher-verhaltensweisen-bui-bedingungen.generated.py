# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["Kontrolle", "Relevanz", "Kontext"]
means = [2.31, 3.42, 4.17]
ci_low = [1.98, 3.01, 3.69]
ci_high = [2.64, 3.83, 4.65]

x = range(len(conditions))

fig, ax = plt.subplots(figsize=(7, 4.5))
ax.errorbar(
    x,
    means,
    yerr=[
        [means[i] - ci_low[i] for i in range(3)],
        [ci_high[i] - means[i] for i in range(3)]
    ],
    fmt="o-",
    capsize=4
)

ax.set_xticks(list(x))
ax.set_xticklabels(conditions)
ax.set_ylabel("Bedeutungsüberhöhungsindex")
ax.set_ylim(0, 5.2)
ax.set_title("Interpretationsintensität nach Untersuchungsbedingung")
ax.grid(axis="y", alpha=0.25)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
