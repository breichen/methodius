# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["Keine", "Drei", "Zwölf"]
stability = [4.42, 5.67, 5.75]
revision = [2.83, 4.08, 5.17]

x = range(len(conditions))
width = 0.36

fig, ax = plt.subplots()
ax.bar([i - width / 2 for i in x], stability, width=width, label="Stabilität")
ax.bar([i + width / 2 for i in x], revision, width=width, label="Revisionsbereitschaft")
ax.set_xticks(list(x))
ax.set_xticklabels(conditions)
ax.set_xlabel("Anzahl kritischer Einwände")
ax.set_ylabel("Mittelwert der Skala")
ax.set_title("Stabilität und Revisionsbereitschaft")
ax.set_ylim(0, 7)
ax.legend()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
