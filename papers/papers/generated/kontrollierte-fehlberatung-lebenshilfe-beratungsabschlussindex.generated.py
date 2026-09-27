# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

bedingungen = [
    "Korrekte\nBeratung",
    "Unvollständige\nBeratung",
    "Kontrollierte\nFehlberatung"
]
werte = [-0.31, 0.02, 0.29]

fig, ax = plt.subplots(figsize=(7.2, 4.4))
ax.bar(bedingungen, werte)
ax.axhline(0, linewidth=0.8)
ax.set_ylabel("Beratungsabschlussindex")
ax.set_title("Mittlerer Beratungsabschlussindex nach Beratungsbedingung")
ax.text(
    0.5,
    -0.19,
    "Höhere Werte entsprechen höherer Abschlussqualität",
    transform=ax.transAxes,
    ha="center"
)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
