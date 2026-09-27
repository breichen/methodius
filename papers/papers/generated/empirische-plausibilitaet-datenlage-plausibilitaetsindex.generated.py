# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["D25", "D50", "D75"]
means = [54.2, 72.6, 74.8]
errors = [12.8, 10.7, 10.2]

fig, ax = plt.subplots(figsize=(6.4, 4.2))
ax.bar(conditions, means, yerr=errors, capsize=4)
ax.set_xlabel("Datenvollständigkeitsbedingung")
ax.set_ylabel("Empirischer Plausibilitätsindex")
ax.set_ylim(0, 100)
ax.set_title("Plausibilität in Abhängigkeit von der Datenvollständigkeit")
ax.grid(axis="y", alpha=0.2)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
plt.close(fig)
