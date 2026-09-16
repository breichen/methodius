"""
book_mockup.py
================

Erzeugt in Blender ein Premium-Produktfoto-Mockup fuer ein duennes
Ratgeber-Booklet (15-20 Innenseiten, Ruecken ca. 3-5 mm) mit zwei
Exemplaren nebeneinander:

    - LINKES Exemplar zeigt das FRONT-Cover, Buchruecken links.
    - RECHTES Exemplar zeigt das BACK-Cover, Buchruecken rechts.

Die Cover-Grafiken werden 1:1 (pixelgenau, ohne Neusetzung/Rekonstruktion)
als Textur aufgebracht. Der Buchruecken bleibt bei dieser Buchdicke absichtlich
leer (schlichte, zur Coverfarbe passende Cremefarbe), wie besprochen.

VERWENDUNG (Kommandozeile):

    blender -b -P book_mockup.py -- --name mein-ratgeber

Optionale Parameter:

    --front-dir   Ordner mit Front-Covern   (Default: ../pics/ratgeber-front)
    --back-dir    Ordner mit Back-Covern    (Default: ../pics/ratgeber-back)
    --output      Zieldatei fuer den Render (Default: ../pics/mockup/<name>.png)
    --res-x       Render-Breite in Pixeln   (Default: 1536)
    --res-y       Render-Hoehe in Pixeln    (Default: 1024)
    --samples     Cycles Samples            (Default: 128)

Erwartete Eingabedateien:

    <front-dir>/<name>.png
    <back-dir>/<name>.png
"""

import bpy
import bmesh
import sys
import os
import re
import math
import random
import argparse
from pathlib import Path
from mathutils import Vector, Matrix


# ---------------------------------------------------------------------------
# 1. ARGUMENTE PARSEN
# ---------------------------------------------------------------------------

def parse_args():
    argv = sys.argv
    if "--" in argv:
        argv = argv[argv.index("--") + 1:]
    else:
        argv = []

    parser = argparse.ArgumentParser(description="Book Mockup Generator")
    parser.add_argument("--name", required=True, help="Name des Ratgebers (Dateiname ohne .png)")
    parser.add_argument("--front-dir", default="../pics/ratgeber-front")
    parser.add_argument("--back-dir", default="../pics/ratgeber-back")
    parser.add_argument("--output", default=None)
    parser.add_argument("--res-x", type=int, default=1536)
    parser.add_argument("--res-y", type=int, default=1024)
    parser.add_argument("--samples", type=int, default=128)
    parser.add_argument("--denoise", action="store_true",
                         help="Denoising aktivieren (benoetigt Blender-Build mit OIDN)")
    parser.add_argument("--seed", type=int, default=None,
                         help="Zufalls-Seed fuer die leichte Variation pro Buch "
                              "(Default: aus --name abgeleitet, also reproduzierbar)")
    parser.add_argument("--no-variation", action="store_true",
                         help="Deaktiviert die zufaellige Mikro-Variation der Buecher")
    return parser.parse_args(argv)


ARGS = parse_args()

# Pfade werden relativ zum Skript-Verzeichnis aufgeloest, damit
# "../pics/..." unabhaengig vom aktuellen Arbeitsverzeichnis funktioniert.
SCRIPT_DIR = Path(__file__).resolve().parent

FRONT_PATH = (SCRIPT_DIR / ARGS.front_dir / f"{ARGS.name}.png").resolve()
BACK_PATH = (SCRIPT_DIR / ARGS.back_dir / f"{ARGS.name}.png").resolve()

if not FRONT_PATH.exists():
    raise FileNotFoundError(f"Front-Cover nicht gefunden: {FRONT_PATH}")
if not BACK_PATH.exists():
    raise FileNotFoundError(f"Back-Cover nicht gefunden: {BACK_PATH}")

def sanitize_filename(name):
    """
    Ersetzt Zeichen, die unter Windows in Dateinamen verboten sind
    (\\ / : * ? " < > |), durch "-". Ratgeber-Titel enthalten oft
    einen Doppelpunkt (Titel: Untertitel) - ohne diese Bereinigung
    wuerde das Speichern auf Windows fehlschlagen, obwohl die
    Konsole trotzdem "Fertig gespeichert" meldet (siehe Erfolgs-
    pruefung unten).
    """
    return re.sub(r'[\\/:*?"<>|]', "-", name)


if ARGS.output:
    OUTPUT_PATH = Path(ARGS.output).resolve()
else:
    safe_name = sanitize_filename(ARGS.name)
    OUTPUT_PATH = (SCRIPT_DIR / ".." / "pics" / "ratgeber-mockup" / f"{safe_name}.png").resolve()
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)

# Seed fuer die kleine zufaellige Variation: standardmaessig aus dem Namen
# abgeleitet, damit derselbe Ratgeber immer dasselbe Ergebnis liefert,
# aber unterschiedliche Ratgeber sich optisch leicht unterscheiden.
SEED = ARGS.seed if ARGS.seed is not None else abs(hash(ARGS.name)) % (2**31)
random.seed(SEED)


# ---------------------------------------------------------------------------
# 2. KONSTANTEN / PRODUKTMASSE (schlankes Booklet)
# ---------------------------------------------------------------------------

BOOK_HEIGHT = 0.210          # 21 cm Hoehe (A5-artig), Basis fuer Seitenverhaeltnis
SPINE_THICKNESS = 0.016      # 5 mm Ruecken -> oberes Ende von "duennes Booklet"
BEVEL_WIDTH = 0.0006         # minimale Kantenrundung fuer realistische Optik

CREAM_SPINE_COLOR = (0.93, 0.895, 0.82, 1.0)   # gleiche warme Cremepalette wie Cover
BACKGROUND_HEX = (254/255, 250/255, 239/255)       # #FEFAEF

BOOK_SCALE = 1.07             # Buch insgesamt 50% groesser (Hoehe UND Breite
                              # gleichermassen skaliert -> Seitenverhaeltnis
                              # bleibt exakt erhalten, Cover wird NICHT
                              # verzerrt). Kamera wird weiter unten passend
                              # dazu angepasst, damit nichts abgeschnitten wird.

EDGE_GAP = 0.02              # Abstand zwischen den einander zugewandten
                              # Buchkanten (vorher effektiv ca. 0.033 m bei
                              # GAP_BETWEEN_BOOKS=0.09 und kleineren Buechern;
                              # jetzt enger UND bezogen auf die neue,
                              # groessere Buchbreite berechnet)
TURN_ANGLE_DEG = 24.0        # leichte Drehung "toward the viewer"

# Kleine zufaellige Variation pro Buch, damit nicht jedes Rendering wie eine
# perfekte Spiegelung aussieht. Bewusst klein gehalten, damit die Vorderkanten
# trotz EDGE_GAP niemals kollidieren.
JITTER_Z_DEG = 2.5      # zusaetzliche Drehung um die Hochachse
JITTER_TILT_DEG = 1.0   # minimales Kippen (Vor-/Rueckneigung, seitlich)
JITTER_POS = 0.006      # Positions-Jitter in Metern (X/Y)

COVER_COLOR_FIDELITY = 0.35   # 0.0 = komplett normal beleuchtet (kann blasser
                               # wirken), 1.0 = Cover komplett unbeleuchtet
                               # (100% Originalfarbe, aber flach/ohne 3D-Schattierung).
                               # 0.3-0.4 ist ein guter Kompromiss.

# HINWEIS zum Hintergrund: frueher gab es hier COVE_COLOR_FIDELITY, das
# versucht hat, die unterschiedliche Beleuchtung von Boden und Rueckwand
# durch einen hohen Fixfarben-Anteil zu kaschieren. Das kann eine echte
# Richtungslichtquelle auf gekruemmter Geometrie aber nie vollstaendig
# ausgleichen (an der Rundung selbst entsteht durch den Winkel zur Sonne
# fast immer ein helleres/dunkleres Band). Die Loesung jetzt: die Cove
# ist ein Shadow Catcher (siehe Abschnitt 6) und im Bild gar nicht mehr
# direkt sichtbar - nur ihr Schattenwurf. Die eigentliche Hintergrundfarbe
# kommt danach absolut gleichmaessig aus dem Compositing (Abschnitt 9).


# ---------------------------------------------------------------------------
# 3. SZENE LEEREN
# ---------------------------------------------------------------------------

def clear_scene():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for block_collection in (bpy.data.meshes, bpy.data.materials,
                              bpy.data.images, bpy.data.lights,
                              bpy.data.cameras, bpy.data.worlds):
        for block in list(block_collection):
            if block.users == 0:
                block_collection.remove(block)


clear_scene()


# ---------------------------------------------------------------------------
# 4. HILFSFUNKTIONEN
# ---------------------------------------------------------------------------

def srgb_to_linear(c):
    """Wandelt einen sRGB-Farbwert (0..1, wie ein Hexcode) in Blenders
    lineare Farbraum-Werte um, damit z.B. #FAF8F2 auch wirklich als
    #FAF8F2 im gerenderten Bild ankommt."""
    if c <= 0.04045:
        return c / 12.92
    return ((c + 0.055) / 1.055) ** 2.4


def srgb_tuple(rgb):
    return tuple(srgb_to_linear(c) for c in rgb)


def load_cover_image(path: Path):
    """Laedt das Cover 1:1, ohne jegliche Bearbeitung."""
    img = bpy.data.images.load(str(path), check_existing=True)
    img.colorspace_settings.name = 'sRGB'
    width, height = img.size
    aspect = width / height if height else 0.7
    return img, aspect


def make_cover_material(name, image):
    """
    Cover-Material mit Farbtreue-Kompensation:

    Jedes Umgebungs-/Fuelllicht hebt zwangslaeufig die Schwaerzen an und
    verringert dadurch Saettigung/Kontrast der Textur, egal wie gut die
    Belichtung kalibriert ist (das ist ein grundsaetzlicher Effekt von
    3D-Beleuchtung, keine falsche Einstellung). Um trotzdem nah am
    Original zu bleiben, wird ein kleiner Anteil (COVER_COLOR_FIDELITY)
    der Textur ALS EMISSION beigemischt -- diese ignoriert die
    Szenenbeleuchtung komplett und liefert exakt die Originalfarbe.
    Der Rest bleibt normal beleuchtetes Principled-BSDF fuer realistische
    3D-Schattierung/Hochglanzverlauf. Ergebnis: Cover behaelt die Original-
    Farbtreue, sieht aber trotzdem dreidimensional beleuchtet aus.
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (500, 0)

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 150)
    bsdf.inputs["Roughness"].default_value = 0.55
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.15
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.15

    tex = nodes.new("ShaderNodeTexImage")
    tex.location = (-350, 0)
    tex.image = image
    tex.interpolation = 'Cubic'  # sanftes, aber nicht verfaelschendes Sampling

    emission = nodes.new("ShaderNodeEmission")
    emission.location = (0, -150)
    emission.inputs["Strength"].default_value = 1.0

    mix_shader = nodes.new("ShaderNodeMixShader")
    mix_shader.location = (280, 0)
    mix_shader.inputs["Fac"].default_value = COVER_COLOR_FIDELITY

    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(tex.outputs["Color"], emission.inputs["Color"])
    links.new(bsdf.outputs["BSDF"], mix_shader.inputs[1])
    links.new(emission.outputs["Emission"], mix_shader.inputs[2])
    links.new(mix_shader.outputs["Shader"], output.inputs["Surface"])
    return mat


def make_plain_material(name, rgba, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
    return mat


def make_fidelity_material(name, rgba, fidelity, roughness=0.5):
    """
    Wie make_cover_material, aber fuer eine einfarbige Flaeche statt einer
    Bildtextur (gedacht fuer den Cove-Hintergrund). Mischt eine normal
    beleuchtete Principled-BSDF (liefert Schattierung UND Schattenwurf)
    mit einer fixen Emission in exakt derselben Farbe (ignoriert
    Beleuchtung/Lichtwinkel/indirekte Beleuchtung komplett).

    Ein hoher 'fidelity'-Wert haelt die Flaeche dadurch praktisch ueberall
    im selben Farbton, unabhaengig davon, wie viel Licht eine bestimmte
    Stelle (Boden vs. gebogene Ruckwand, je nach Flaechennormale)
    tatsaechlich abbekommt - genau das Problem, das Boden und Ruckwand
    bisher unterschiedlich hell (elfenbein vs. fast weiss) aussehen liess.
    Der kleine beleuchtete Rest (1 - fidelity) bleibt erhalten und macht
    einen dezenten, aber ueberall gleichmaessig sichtbaren Kontaktschatten
    unter den Buechern moeglich.
    """
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (500, 0)

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 150)
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness

    emission = nodes.new("ShaderNodeEmission")
    emission.location = (0, -150)
    emission.inputs["Color"].default_value = rgba
    emission.inputs["Strength"].default_value = 1.0

    mix_shader = nodes.new("ShaderNodeMixShader")
    mix_shader.location = (280, 0)
    mix_shader.inputs["Fac"].default_value = fidelity

    links.new(bsdf.outputs["BSDF"], mix_shader.inputs[1])
    links.new(emission.outputs["Emission"], mix_shader.inputs[2])
    links.new(mix_shader.outputs["Shader"], output.inputs["Surface"])
    return mat


def build_book_mesh(name, width, height, thickness, spine_on_right):
    """
    Erstellt die Geometrie eines Booklets.

    Lokales Koordinatensystem:
        X = Breite   (links -w/2 .. rechts +w/2)
        Y = Tiefe    (Cover-Vorderseite bei y = -t/2, sichtbar Richtung Kamera)
        Z = Hoehe    (0 .. height), Objektursprung liegt am Boden mittig

    spine_on_right=False -> Buchruecken bei x = -w/2 (LINKS)   -> Frontcover-Exemplar
    spine_on_right=True  -> Buchruecken bei x = +w/2 (RECHTS)  -> Backcover-Exemplar

    Die UV-Koordinaten der Cover-Flaeche werden IMMER in natuerlicher
    Bild-Orientierung vergeben (u=0 am linken Bildrand, u=1 am rechten),
    damit die Covergrafik niemals gespiegelt/verzerrt dargestellt wird.
    """
    w, h, t = width, height, thickness
    hw, ht = w / 2.0, t / 2.0

    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()

    # 8 Eckpunkte der Box
    v = [
        bm.verts.new((-hw, -ht, 0)),  # 0 unten-links-vorne
        bm.verts.new((hw, -ht, 0)),   # 1 unten-rechts-vorne
        bm.verts.new((hw, ht, 0)),    # 2 unten-rechts-hinten
        bm.verts.new((-hw, ht, 0)),   # 3 unten-links-hinten
        bm.verts.new((-hw, -ht, h)),  # 4 oben-links-vorne
        bm.verts.new((hw, -ht, h)),   # 5 oben-rechts-vorne
        bm.verts.new((hw, ht, h)),    # 6 oben-rechts-hinten
        bm.verts.new((-hw, ht, h)),   # 7 oben-links-hinten
    ]
    bm.verts.ensure_lookup_table()

    # Cover-Flaeche (vorne, sichtbar) -- Index 0 im Material-Slot
    face_cover = bm.faces.new((v[0], v[1], v[5], v[4]))
    # Rueckseite der Box (unsichtbar) -- gleiche schlichte Ruecken-Farbe
    face_back = bm.faces.new((v[2], v[3], v[7], v[6]))
    # Buchruecken links (x = -hw)
    face_left = bm.faces.new((v[3], v[0], v[4], v[7]))
    # Vorderschnitt / Fore-Edge rechts (x = +hw)
    face_right = bm.faces.new((v[1], v[2], v[6], v[5]))
    # oben / unten (Kopf-/Fussschnitt)
    face_top = bm.faces.new((v[4], v[5], v[6], v[7]))
    face_bottom = bm.faces.new((v[0], v[3], v[2], v[1]))

    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    # Materialindizes: 0 = Cover, 1 = Cream (Ruecken/Schnitt)
    face_cover.material_index = 0
    for f in (face_back, face_left, face_right, face_top, face_bottom):
        f.material_index = 1

    # UV-Layer nur fuer die Cover-Flaeche sinnvoll befuellen
    uv_layer = bm.loops.layers.uv.new("UVMap")
    uv_coords = {
        v[0]: (0.0, 0.0),
        v[1]: (1.0, 0.0),
        v[5]: (1.0, 1.0),
        v[4]: (0.0, 1.0),
    }
    for loop in face_cover.loops:
        loop[uv_layer].uv = uv_coords[loop.vert]

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    return obj


def add_bevel_and_shading(obj):
    bevel = obj.modifiers.new(name="EdgeBevel", type='BEVEL')
    bevel.width = BEVEL_WIDTH
    bevel.segments = 4
    bevel.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    bevel_mod = obj.modifiers["EdgeBevel"]
    # Auto-Smooth nur auf scharfen Kanten (per Bevel-Weight/Angle geregelt),
    # Bevel-Modifier + Shade Smooth reicht fuer die kleinen Fasen hier aus.
    obj.select_set(False)


def create_book(basename, image_path, aspect, spine_on_right, x_position, turn_deg, apply_jitter=True):
    image, _ = load_cover_image(image_path)

    width = BOOK_HEIGHT * aspect
    obj = build_book_mesh(f"Book_{basename}", width, BOOK_HEIGHT, SPINE_THICKNESS,
                           spine_on_right)

    cover_mat = make_cover_material(f"Mat_Cover_{basename}", image)
    cream_mat = make_plain_material(
        f"Mat_Cream_{basename}",
        (*srgb_tuple(CREAM_SPINE_COLOR[:3]), 1.0),
        roughness=0.85,
    )
    obj.data.materials.append(cover_mat)
    obj.data.materials.append(cream_mat)

    add_bevel_and_shading(obj)

    # Gleichmaessige Skalierung um den Objektursprung (der am Boden, mittig
    # in X und Y liegt) -> Buch wird insgesamt groesser, Seitenverhaeltnis
    # des Covers bleibt exakt erhalten (keine Verzerrung), Buch steht
    # weiterhin exakt auf der "Buehne" (z=0).
    obj.scale = (BOOK_SCALE, BOOK_SCALE, BOOK_SCALE)

    # Position: Objektursprung ist am Boden -> z bleibt 0 (steht auf der "Buehne")
    jitter_x = random.uniform(-JITTER_POS, JITTER_POS) if apply_jitter else 0.0
    jitter_y = random.uniform(-JITTER_POS, JITTER_POS) if apply_jitter else 0.0
    obj.location = (x_position + jitter_x, jitter_y, 0.0)

    # Leichte Drehung um Z ("slightly turned toward the viewer")
    # spine_on_right=False (Frontcover-Exemplar): positive Drehung zeigt
    #   den linken Buchruecken minimal an.
    # spine_on_right=True (Backcover-Exemplar): Spiegelbildliche negative
    #   Drehung zeigt den rechten Buchruecken minimal an.
    sign = 1.0 if not spine_on_right else -1.0
    z_jitter = random.uniform(-JITTER_Z_DEG, JITTER_Z_DEG) if apply_jitter else 0.0
    x_tilt = math.radians(random.uniform(-JITTER_TILT_DEG, JITTER_TILT_DEG)) if apply_jitter else 0.0
    y_tilt = math.radians(random.uniform(-JITTER_TILT_DEG, JITTER_TILT_DEG)) if apply_jitter else 0.0
    obj.rotation_euler = (x_tilt, y_tilt, math.radians(turn_deg) * sign + math.radians(z_jitter))

    return obj


# ---------------------------------------------------------------------------
# 5. BUECHER ERZEUGEN
# ---------------------------------------------------------------------------

_, front_aspect = load_cover_image(FRONT_PATH)
_, back_aspect = load_cover_image(BACK_PATH)

# Positionen aus der tatsaechlichen (skalierten) Buchbreite herleiten, damit
# EDGE_GAP wirklich der Abstand zwischen den einander zugewandten Kanten ist
# und die Buecher bei groesserer BOOK_WIDTH_SCALE nicht ueberlappen.
width_left = BOOK_HEIGHT * front_aspect * BOOK_SCALE
width_right = BOOK_HEIGHT * back_aspect * BOOK_SCALE
left_x = -(EDGE_GAP / 2.0 + width_left / 2.0)
right_x = (EDGE_GAP / 2.0 + width_right / 2.0)

left_book = create_book(
    basename=f"{ARGS.name}_front",
    image_path=FRONT_PATH,
    aspect=front_aspect,
    spine_on_right=False,
    x_position=left_x,
    turn_deg=TURN_ANGLE_DEG,
    apply_jitter=not ARGS.no_variation,
)

right_book = create_book(
    basename=f"{ARGS.name}_back",
    image_path=BACK_PATH,
    aspect=back_aspect,
    spine_on_right=True,
    x_position=right_x,
    turn_deg=TURN_ANGLE_DEG,
    apply_jitter=not ARGS.no_variation,
)


# ---------------------------------------------------------------------------
# 6. HINTERGRUND: durchgehende "Infinity Cove" (Boden + gebogene Rueckwand
#    aus EINEM Mesh/Material, damit keine Naht/Horizontlinie entsteht)
# ---------------------------------------------------------------------------

def build_infinity_cove(name, half_width, wall_y, wall_top_z, corner_radius, floor_extent_y):
    """
    Erzeugt eine klassische Fotostudio-Kurve: flacher Boden, der ohne
    sichtbare Kante in eine senkrechte Ruckwand uebergeht (wie nahtloses
    Fotokarton-Papier). Alles ein zusammenhaengendes Mesh -> keine Naht,
    keine zwei unterschiedlich belichteten Flaechen.
    """
    yc = wall_y - corner_radius
    zc = corner_radius

    profile = [(-floor_extent_y, 0.0)]
    steps = 10
    for i in range(steps + 1):
        phi = math.radians(-90 + (90.0 * i / steps))
        y = yc + corner_radius * math.cos(phi)
        z = zc + corner_radius * math.sin(phi)
        profile.append((y, z))
    profile.append((wall_y, wall_top_z))

    mesh = bpy.data.meshes.new(name)
    bm = bmesh.new()

    rows = []
    for (y, z) in profile:
        v_left = bm.verts.new((-half_width, y, z))
        v_right = bm.verts.new((half_width, y, z))
        rows.append((v_left, v_right))

    for i in range(len(rows) - 1):
        a_left, a_right = rows[i]
        b_left, b_right = rows[i + 1]
        bm.faces.new((a_left, a_right, b_right, b_left))

    bm.faces.ensure_lookup_table()
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

    bm.to_mesh(mesh)
    bm.free()

    obj = bpy.data.objects.new(name, mesh)
    bpy.context.collection.objects.link(obj)
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    obj.select_set(False)
    return obj


cove = build_infinity_cove(
    "InfinityCove",
    half_width=2.5,
    wall_y=1.2,
    wall_top_z=2.0,
    corner_radius=0.35,
    floor_extent_y=2.0,
)
cove_mat = make_plain_material(
    "Mat_Cove",
    (*srgb_tuple(BACKGROUND_HEX), 1.0),
    roughness=0.92,
)
cove.data.materials.append(cove_mat)

# Cove als Shadow Catcher: die Flaeche selbst wird im Rendering unsichtbar
# (kein Boden/Wand-Look mehr, also auch keine unterschiedliche Beleuchtung
# von Boden vs. Rueckwand mehr moeglich) - sie hinterlaesst im Bild nur noch
# dort einen transparenten, abgedunkelten Pixel, wo tatsaechlich ein Schatten
# der Buecher darauf faellt. Die sichtbare Hintergrundfarbe kommt erst im
# Compositing (Abschnitt 9) dazu, dort absolut einheitlich.
try:
    cove.is_shadow_catcher = True          # Blender 4.x
except AttributeError:
    cove.cycles.is_shadow_catcher = True   # Blender 3.x

# Sehr dezentes, neutrales Umgebungslicht (nur fuer sanfte Reflexe/Fuellung,
# absichtlich schwach, damit weder Buecher noch Hintergrund davon spuerbar
# aufgehellt werden).
world = bpy.data.worlds.new("World_Neutral")
bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
bg_node.inputs["Color"].default_value = (*srgb_tuple((0.55, 0.545, 0.53)), 1.0)
bg_node.inputs["Strength"].default_value = 0.35


# ---------------------------------------------------------------------------
# 7. KAMERA (Dreiviertelperspektive)
# ---------------------------------------------------------------------------

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85  # leichtes Tele, verzerrungsarm, klassisch fuer Produktfotos
cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

# CAMERA_ZOOM steuert den Kameraabstand UNABHAENGIG von BOOK_SCALE.
#
# Vorher stand hier direkt "0.92 * BOOK_SCALE": Buchgroesse UND
# Kameraabstand skalierten dadurch im exakt gleichen Verhaeltnis, was
# sich gegenseitig aufhebt (groesseres Buch, aber die Kamera geht im
# selben Mass weiter weg -> die scheinbare Groesse im Bild blieb immer
# exakt gleich). BOOK_SCALE hatte dadurch de facto keinen sichtbaren
# Effekt. CAMERA_ZOOM ist bewusst als separater Wert (Default = alter
# BOOK_SCALE-Wert, damit sich am Bild bei unveraenderten Werten nichts
# aendert) - jetzt aendert BOOK_SCALE wirklich die Buchgroesse im Bild,
# und CAMERA_ZOOM kann bei Bedarf unabhaengig davon nachjustiert werden
# (kleiner = Kamera naeher dran = Buecher groesser im Bild).
CAMERA_ZOOM = 1.1

cam_pos = Vector((0.0, -0.92 * CAMERA_ZOOM, BOOK_HEIGHT * BOOK_SCALE * 0.58))
target = Vector((0.0, 0.0, BOOK_HEIGHT * BOOK_SCALE * 0.50))
direction = (target - cam_pos).normalized()
cam_obj.location = cam_pos
cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


# ---------------------------------------------------------------------------
# 8. STUDIOLICHT (weich, dezente Schatten, keine Drama-Beleuchtung)
# ---------------------------------------------------------------------------

def add_area_light(name, location, size, energy, rotation_euler=None, target=None,
                    color=(1.0, 0.98, 0.94), receiver_collection=None):
    light_data = bpy.data.lights.new(name=name, type='AREA')
    light_data.shape = 'RECTANGLE'
    light_data.size = size
    light_data.size_y = size * 0.7
    light_data.energy = energy
    light_data.color = color
    light_obj = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = location
    if target is not None:
        # Robuster als von Hand geschaetzte Euler-Winkel: das Licht wird
        # (wie die Kamera in Abschnitt 7) exakt auf den Zielpunkt
        # ausgerichtet, unabhaengig von seiner Position.
        direction = (Vector(target) - Vector(location)).normalized()
        light_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()
    else:
        light_obj.rotation_euler = rotation_euler
    if receiver_collection is not None:
        light_obj.light_linking.receiver_collection = receiver_collection
    return light_obj


# Light-Linking: Buch-Lichter beleuchten NUR die Buecher, das Hintergrund-
# Licht NUR die Cove. So bleibt der Hintergrund unabhaengig regelbar (fuer
# gleichmaessige Ausleuchtung ohne Verlauf oben/unten) und die Cover werden
# nicht zusaetzlich vom Hintergrundlicht aufgehellt.
books_link = bpy.data.collections.new("BooksLink")
books_link.objects.link(left_book)
books_link.objects.link(right_book)

cove_link = bpy.data.collections.new("CoveLink")
cove_link.objects.link(cove)

# EINE einzige Lichtquelle fuer die Buecher: eine Softbox schraeg oben-
# rechts, auf Buchmitte ausgerichtet. Sorgt fuer klar erkennbaren
# Lichteinfall von rechts (helle rechte Kanten/Seiten, weicher Schatten
# nach links), wie im Referenzfoto. Das (sehr schwache) Umgebungslicht
# aus Abschnitt 6 hellt die Schattenseite minimal aussenauf, damit sie
# nicht komplett absaeuft - das ist kein zweites Licht im fotografischen
# Sinne, sondern der uebliche neutrale Raumfuellton.
BOOKS_TARGET = (0.0, 0.0, BOOK_HEIGHT * BOOK_SCALE * 0.45)
add_area_light(
    "Key_Light_Right",
    location=(0.9, -1.75, 1.9),
    target=BOOKS_TARGET,
    size=3.2,
    energy=70,
    receiver_collection=books_link,
)

# Hintergrund-Licht: eine Sonne (Parallellicht, KEIN Abfall mit Entfernung),
# damit Boden (nah an der Kamera) und Ruckwand (weiter weg) gleich hell
# ausgeleuchtet werden -> kein Verlauf mehr oben/unten. Nur auf die Cove
# gelinkt, beeinflusst die Buecher also nicht.
#
# Bewusst OHNE seitlichen (Z-)Versatz: Die beiden Buecher stehen
# spiegelbildlich links/rechts der Mitte. Ein seitlicher Versatz der
# Sonne wuerde die Schatten der beiden Buecher unterschiedlich stark
# sichtbar machen (der eine faellt eher hinter/unter das Buch, der
# andere sichtbar zur Seite). Rein frontal-schraeg von oben (nur
# X-Rotation) sorgt dafuer, dass beide Buecher spiegelgleich und damit
# gleich stark sichtbaren Schatten werfen.
sun_data = bpy.data.lights.new("Cove_Sun", type='SUN')
sun_data.energy = 3.1
sun_data.angle = math.radians(9)  # weicher Schattenwurf auf der Kurve
sun_data.color = (1.0, 0.995, 0.985)
sun_obj = bpy.data.objects.new("Cove_Sun", sun_data)
bpy.context.collection.objects.link(sun_obj)
sun_obj.rotation_euler = (math.radians(45), 0, 0)
sun_obj.light_linking.receiver_collection = cove_link


# ---------------------------------------------------------------------------
# 9. RENDER-EINSTELLUNGEN
# ---------------------------------------------------------------------------

scene = bpy.context.scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = ARGS.samples
scene.cycles.use_denoising = bool(ARGS.denoise)

scene.render.resolution_x = ARGS.res_x
scene.render.resolution_y = ARGS.res_y
scene.render.resolution_percentage = 100

# Standard-Farbwiedergabe, damit die Coverfarben moeglichst originalgetreu
# (pixelgenau) bleiben und nicht durch Filmic/Kontrastkurven veraendert werden.
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'

scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGB'
scene.render.filepath = str(OUTPUT_PATH)


def setup_compositing(background_hex):
    """
    Macht den Hintergrund ueberall exakt gleich, unabhaengig von
    Lichtwinkel/Flaechennormale, UND behaelt trotzdem einen echten
    Schattenwurf der Buecher:

    Die Cove ist ein Shadow Catcher (Abschnitt 6) und dadurch im Render
    komplett unsichtbar/transparent - ausser dort, wo ein Schatten auf sie
    faellt, dort liefert sie einen abgedunkelten Pixel mit passendem
    Alpha-Wert. Der Compositor legt dieses Ergebnis anschliessend ueber
    eine absolut einfarbige Flaeche. Der Hintergrund kann dadurch NIE
    mehr unterschiedlich beleuchtet aussehen (er wird ja gar nicht mehr
    beleuchtet gerendert), der Schatten bleibt aber vollstaendig erhalten.
    """
    scene = bpy.context.scene
    scene.render.film_transparent = True

    # Ab Blender 5.0 ist der Compositor-Node-Baum ein eigenstaendiger
    # Datenblock (kein "scene.node_tree" mehr, sondern
    # "scene.compositing_node_group"), und der frueherer "Composite"-
    # Ausgabeknoten wurde durch einen generischen Group-Output ersetzt.
    # "node_tree" auf der Scene gibt es nur noch vor 5.0 - das nutzen
    # wir als zuverlaessige Versionsweiche.
    def link_alpha_over(tree, alpha_over, background_socket, foreground_socket):
        """
        Verbindet den AlphaOver-Knoten robust ueber Socket-NAMEN statt
        Indizes. Grund: Der urspruengliche verwaschene Render kam genau
        daher, dass in einer neueren Blender-Version die Eingangs-
        Reihenfolge des AlphaOver-Knotens nicht mehr exakt der alten
        (< 5.0) Reihenfolge [Fac, Hintergrund, Vordergrund] entsprach -
        mit Indizes rutschte die Verbindung dadurch auf einen falschen
        Socket, was zu genau diesem extrem blassen "Geister"-Ergebnis
        fuehrte. Namen ("Background"/"Foreground" bzw. das aeltere
        doppelte "Image") sind stabiler als Positionen.
        """
        try:
            bg_input = alpha_over.inputs["Background"]
            fg_input = alpha_over.inputs["Foreground"]
        except KeyError:
            bg_input = alpha_over.inputs[1]
            fg_input = alpha_over.inputs[2]
        tree.links.new(background_socket, bg_input)
        tree.links.new(foreground_socket, fg_input)
        # Cycles liefert bei film_transparent=True premultiplizierten Alpha-
        # Kanal; ohne diese Option kann es an Kanten/Schatten-Uebergaengen
        # zu falschen (zu dunklen) Mischwerten kommen.
        if hasattr(alpha_over, "use_premultiply"):
            alpha_over.use_premultiply = True

    if hasattr(scene, "node_tree"):
        # Blender <= 4.5
        scene.use_nodes = True
        tree = scene.node_tree
        tree.nodes.clear()

        render_layers = tree.nodes.new("CompositorNodeRLayers")
        render_layers.location = (0, 0)

        bg_color = tree.nodes.new("CompositorNodeRGB")
        bg_color.location = (0, -250)
        bg_color.outputs[0].default_value = (*srgb_tuple(background_hex), 1.0)

        alpha_over = tree.nodes.new("CompositorNodeAlphaOver")
        alpha_over.location = (300, 0)

        output_node = tree.nodes.new("CompositorNodeComposite")
        output_node.location = (600, 0)
        output_image_input = output_node.inputs["Image"]
    else:
        # Blender >= 5.0
        tree = bpy.data.node_groups.new(
            name="Compositing Nodes", type="CompositorNodeTree"
        )
        tree.interface.new_socket(
            name="Image", in_out="OUTPUT", socket_type="NodeSocketColor"
        )

        render_layers = tree.nodes.new("CompositorNodeRLayers")
        render_layers.location = (0, 0)

        bg_color = tree.nodes.new("CompositorNodeRGB")
        bg_color.location = (0, -250)
        bg_color.outputs[0].default_value = (*srgb_tuple(background_hex), 1.0)

        alpha_over = tree.nodes.new("CompositorNodeAlphaOver")
        alpha_over.location = (300, 0)

        output_node = tree.nodes.new("NodeGroupOutput")
        output_node.location = (600, 0)
        output_image_input = output_node.inputs["Image"]

        scene.compositing_node_group = tree

    link_alpha_over(tree, alpha_over, bg_color.outputs[0], render_layers.outputs["Image"])
    tree.links.new(alpha_over.outputs[0], output_image_input)


setup_compositing(BACKGROUND_HEX)

# Explizit erzwingen (nicht auf den Default/Preferences-Wert verlassen):
# ist "Overwrite" deaktiviert (z.B. weil das mal fuer Render-Farm-
# Workflows so gespeichert wurde), wuerde Blender eine bereits
# existierende Datei stillschweigend NICHT neu schreiben - ohne
# Fehler und ohne Warnung.
scene.render.use_overwrite = True


# ---------------------------------------------------------------------------
# 10. RENDERN
# ---------------------------------------------------------------------------

# mtime VOR dem Rendern merken, um zu erkennen, ob eine bereits
# vorhandene Datei wirklich NEU geschrieben wurde (ein reiner
# exists()-Check wuerde eine unveraenderte alte Datei faelschlich
# als Erfolg werten, z.B. wenn use_overwrite doch irgendwo False
# waere oder das Schreiben aus einem anderen Grund fehlschlaegt).
mtime_before = OUTPUT_PATH.stat().st_mtime if OUTPUT_PATH.exists() else None

bpy.ops.render.render(write_still=True)

mtime_after = OUTPUT_PATH.stat().st_mtime if OUTPUT_PATH.exists() else None

if mtime_after is None:
    raise RuntimeError(
        f"Rendern abgeschlossen, aber Datei wurde NICHT gefunden: "
        f"{OUTPUT_PATH}. Pfad/Dateiname pruefen (z.B. Sonderzeichen, "
        f"Schreibrechte, Pfadlaenge)."
    )
elif mtime_before is not None and mtime_after <= mtime_before:
    raise RuntimeError(
        f"Datei existiert bereits, wurde aber NICHT neu geschrieben: "
        f"{OUTPUT_PATH}. Moegliche Ursachen: 'Overwrite' war "
        f"deaktiviert, die Datei ist durch ein anderes Programm "
        f"gesperrt (z.B. Viewer, OneDrive-Sync), oder fehlende "
        f"Schreibrechte."
    )
else:
    print(f"Fertig. Mockup gespeichert unter: {OUTPUT_PATH}")