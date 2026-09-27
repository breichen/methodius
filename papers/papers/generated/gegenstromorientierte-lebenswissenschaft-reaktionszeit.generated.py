# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt

conditions = ["Neutral", "Positiv", "Gegenstrom"]
means = [4.82, 4.31, 3.76]
errors = [1.91, 1.67, 1.42]

fig, ax = plt.subplots()
ax.bar(conditions, means, yerr=errors, capsize=4)
ax.set_ylabel("Reaktionszeit (s)")
ax.set_xlabel("Bedingung")
ax.set_title("Mittlere Reaktionszeit bis zur Handlungsausführung")
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
