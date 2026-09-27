# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

conditions = ["Konventionell", "Nicht spezifiziert", "Gegenläufig"]
attention = np.array([2.8, 3.7, 5.4])
duration = np.array([3.4, 3.8, 4.1])

attention_z = (attention - attention.mean()) / attention.std()
duration_z = (duration - duration.mean()) / duration.std()

x = np.arange(len(conditions))
width = 0.36

fig, ax = plt.subplots(figsize=(7.2, 4.2))
ax.bar(x - width / 2, attention_z, width, label="Aufmerksamkeit")
ax.bar(x + width / 2, duration_z, width, label="Entscheidungsdauer")
ax.set_xticks(x)
ax.set_xticklabels(conditions)
ax.set_ylabel("Standardisierter Mittelwert")
ax.set_xlabel("Bedingung")
ax.legend(frameon=False)
ax.axhline(0, linewidth=0.8)
fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
