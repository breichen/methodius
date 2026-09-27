# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["Keine", "Drei", "Zwölf"]
times = [94, 173, 491]

fig, ax = plt.subplots()
ax.bar(conditions, times)
ax.set_xlabel("Anzahl kritischer Einwände")
ax.set_ylabel("Bearbeitungszeit (Sekunden)")
ax.set_title("Bearbeitungsdauer nach Einwandintensität")
ax.set_ylim(0, 550)
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
