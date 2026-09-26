# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

bedingungen = ["Stromkonform", "Gegenstrom"]
werte = [26.5, 31.4]

fig, ax = plt.subplots()
ax.bar(bedingungen, werte)
ax.set_ylabel("Dauer (s)")
ax.set_title("Mittlere Ausführungsdauer")
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
