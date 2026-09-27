# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

tage = ["Montag", "Mittwoch", "Samstag"]
werte = [74.1, 63.8, 58.6]

fig, ax = plt.subplots(figsize=(7, 4.5))
ax.bar(tage, werte)
ax.set_ylabel("Erwartete Umsetzungswahrscheinlichkeit (%)")
ax.set_ylim(0, 100)
ax.set_title("Erwartete Umsetzung nach Beginntermin")
ax.grid(axis="y", alpha=0.2)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
