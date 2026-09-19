import matplotlib.pyplot as plt
from matplotlib.patches import Rectangle

# =====================================================
# Farbdefinitionen des Methodius-Instituts
# =====================================================

COLORS = [
    ("Methodius-Rot", "#B5292C"),
    ("Methodius-Blau", "#1B2340"),
    ("Methodius-Creme", "#F1ECE2"),
    ("Grün", "#008000"),
    ("Bernstein", "#FFBF00"),
    ("Kornblumenblau", "#6495ED"),
]

# =====================================================
# Farbkarte erzeugen
# =====================================================

fig, ax = plt.subplots(figsize=(8, 4))

for i, (name, color) in enumerate(COLORS):

    ax.add_patch(
        Rectangle((0, i), 4, 1, color=color)
    )

    textcolor = "white"

    if color.upper() in ["#F1ECE2", "#FFBF00"]:
        textcolor = "black"

    ax.text(
        0.15,
        i + 0.5,
        f"{name} ({color})",
        va="center",
        fontsize=12,
        fontweight="bold",
        color=textcolor
    )

ax.set_xlim(0, 10)
ax.set_ylim(0, len(COLORS))
ax.axis("off")

plt.tight_layout()
plt.savefig(
    "figures/farbpalette.png",
    dpi=300,
    bbox_inches="tight"
)

plt.close()

# =====================================================
# Beispiel-Diagramm
# =====================================================

plt.rcParams.update({
    "font.size": 11,
    "axes.titlesize": 14,
    "axes.labelsize": 12
})

kategorien = [
    "Kaffee",
    "Schlaf",
    "Planung",
    "Optimismus",
    "Ausreden"
]

werte = [92, 87, 73, 68, 55]

fig, ax = plt.subplots(figsize=(8, 5))

bars = ax.bar(
    kategorien,
    werte,
    color=[c[1] for c in COLORS]
)

#ax.set_title(
#    "Einflussfaktoren auf die subjektive Produktivität"
#)

ax.set_ylabel("Wissenschaftlich wirkender Index")

ax.set_ylim(0, 100)

ax.spines["top"].set_visible(False)
ax.spines["right"].set_visible(False)

for bar in bars:
    height = bar.get_height()
    ax.text(
        bar.get_x() + bar.get_width()/2,
        height + 1,
        f"{height}",
        ha="center"
    )

plt.tight_layout()

plt.savefig(
    "figures/beispieldiagramm.png",
    dpi=300,
    bbox_inches="tight"
)

plt.show()

print("Gespeichert:")
print(" - figures/farbpalette.png")
print(" - figures/beispieldiagramm.png")