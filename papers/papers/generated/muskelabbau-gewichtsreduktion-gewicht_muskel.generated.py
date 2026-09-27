# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

conditions = [
    "Alltagskontrolle",
    "Gewichtsreduktion",
    "Belastungsreduktion"
]

weight_change = [-0.18, -1.47, -1.84]
lean_change = [-0.06, -0.48, -1.21]

x = np.arange(len(conditions))
width = 0.34

fig, ax = plt.subplots(figsize=(7.2, 4.4))

ax.bar(x - width / 2, weight_change, width, label="Körpergewicht")
ax.bar(x + width / 2, lean_change, width, label="Fettfreie Masse")

ax.axhline(0, linewidth=0.8)
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylabel("Veränderung in kg")
ax.set_title("Gewichts- und fettfreie Massenveränderung nach 28 Tagen")
ax.legend(frameon=False)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
