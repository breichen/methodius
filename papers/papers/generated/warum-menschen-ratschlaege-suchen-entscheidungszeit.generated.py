# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["Kongruente\nBeratung", "Inkongruente\nBeratung"]
means = [31.6, 58.9]
sd = [14.8, 27.4]

fig, ax = plt.subplots(figsize=(6.2, 4.0))
ax.bar(conditions, means, yerr=sd, capsize=4)
ax.set_ylabel("Entscheidungszeit (Sekunden)")
ax.set_ylim(0, 95)
ax.set_title("Entscheidungszeit nach Beratung")
ax.text(
    0.5,
    0.96,
    "Mittelwert ± SD",
    transform=ax.transAxes,
    ha="center",
    va="top"
)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
plt.close(fig)
