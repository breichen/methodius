# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

bedingungen = ["Sachlich korrekte\nBeratung", "Unvollständige\nBeratung", "Kontrollierte\nFehlberatung"]
werte = [31.4, 44.7, 12.8]

fig, ax = plt.subplots(figsize=(6, 4))
ax.bar(bedingungen, werte, color="#4a6fa5")
ax.set_ylabel("Entscheidungsdauer (s)")
ax.set_title("Mittlere Entscheidungsdauer je Beratungsbedingung")
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
