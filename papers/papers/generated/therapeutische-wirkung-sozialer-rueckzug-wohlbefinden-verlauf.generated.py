# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

tage = [1, 2, 3, 4, 5, 6, 7]

interaktion = [0.02, 0.07, 0.08, 0.10, 0.11, 0.10, 0.09]
passiv = [0.41, 0.52, 0.63, 0.68, 0.71, 0.67, 0.65]
aktiv = [0.92, 0.98, 1.08, 1.12, 1.09, 1.04, 1.05]

fig, ax = plt.subplots(figsize=(7.2, 4.4))
ax.plot(tage, interaktion, marker="o", label="Interaktionskontrolle")
ax.plot(tage, passiv, marker="o", label="Passiver Rückzug")
ax.plot(tage, aktiv, marker="o", label="Aktiv deklarierter Rückzug")

ax.set_xlabel("Untersuchungstag")
ax.set_ylabel("Veränderung des Wohlbefindens")
ax.set_xticks(tage)
ax.set_ylim(0, 1.25)
ax.legend(frameon=False)
ax.grid(axis="y", alpha=0.2)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
