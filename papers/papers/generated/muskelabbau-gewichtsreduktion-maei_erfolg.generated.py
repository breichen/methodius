# AUTO-GENERATED von generate.py aus einem eingebetteten
# Code-Block in der paper.md. Bitte nicht von Hand bearbeiten –
# Änderungen gehen beim nächsten Lauf verloren.

import sys
import matplotlib.pyplot as plt
import numpy as np

maei = np.array([
    0.02, 0.05, 0.08, 0.11,
    0.16, 0.19, 0.24, 0.29,
    0.34, 0.38, 0.42, 0.47,
    0.51, 0.56, 0.61, 0.66,
    0.72, 0.77, 0.83, 0.88,
    0.94, 1.01, 1.06, 1.12,
    1.18, 1.23, 1.29, 1.35,
    1.40, 1.46, 1.50, 1.56,
    1.61, 1.68, 1.72, 1.78
])

success = np.array([
    1.8, 2.1, 2.4, 2.5,
    2.8, 3.0, 3.1, 3.4,
    3.6, 3.9, 4.1, 4.3,
    4.7, 4.8, 5.0, 5.2,
    5.5, 5.7, 5.9, 6.1,
    6.3, 6.5, 6.7, 6.9,
    7.0, 7.2, 7.3, 7.5,
    7.7, 7.8, 8.0, 8.2,
    8.4, 8.6, 8.8, 9.0
])

fig, ax = plt.subplots(figsize=(6.8, 4.6))
ax.scatter(maei, success, s=28)

coeff = np.polyfit(maei, success, 1)
x_line = np.linspace(maei.min(), maei.max(), 100)
y_line = coeff[0] * x_line + coeff[1]
ax.plot(x_line, y_line, linewidth=1.2)

ax.set_xlabel("Muskelabbau-als-Erfolg-Index (MAEI)")
ax.set_ylabel("Subjektiver Erfolg (0–10)")
ax.set_title("Zusammenhang zwischen MAEI und Erfolgserleben")
ax.set_xlim(0, 1.85)
ax.set_ylim(0, 10)

fig.tight_layout()
fig.savefig(sys.argv[1], dpi=300, bbox_inches="tight")
