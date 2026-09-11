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
    --output      Zieldatei fuer den Render (Default: ../out/<name>_mockup.png)
    --res-x       Render-Breite in Pixeln   (Default: 2400)
    --res-y       Render-Hoehe in Pixeln    (Default: 1800)
    --samples     Cycles Samples            (Default: 128)

Erwartete Eingabedateien:

    <front-dir>/<name>.png
    <back-dir>/<name>.png
"""

import bpy
import bmesh
import sys
import os
import math
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
    parser.add_argument("--res-x", type=int, default=2400)
    parser.add_argument("--res-y", type=int, default=1800)
    parser.add_argument("--samples", type=int, default=128)
    parser.add_argument("--denoise", action="store_true",
                         help="Denoising aktivieren (benoetigt Blender-Build mit OIDN)")
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

if ARGS.output:
    OUTPUT_PATH = Path(ARGS.output).resolve()
else:
    OUTPUT_PATH = (SCRIPT_DIR / ".." / "out" / f"{ARGS.name}_mockup.png").resolve()
OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)


# ---------------------------------------------------------------------------
# 2. KONSTANTEN / PRODUKTMASSE (schlankes Booklet)
# ---------------------------------------------------------------------------

BOOK_HEIGHT = 0.210          # 21 cm Hoehe (A5-artig), Basis fuer Seitenverhaeltnis
SPINE_THICKNESS = 0.004      # 4 mm Ruecken -> "duennes Booklet", nicht dick
BEVEL_WIDTH = 0.0006         # minimale Kantenrundung fuer realistische Optik

CREAM_SPINE_COLOR = (0.93, 0.895, 0.82, 1.0)   # gleiche warme Cremepalette wie Cover
BACKGROUND_HEX = (0.980, 0.973, 0.949)          # #FAF8F2

GAP_BETWEEN_BOOKS = 0.11
TURN_ANGLE_DEG = 14.0        # leichte Drehung "toward the viewer"


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

def load_cover_image(path: Path):
    """Laedt das Cover 1:1, ohne jegliche Bearbeitung."""
    img = bpy.data.images.load(str(path), check_existing=True)
    img.colorspace_settings.name = 'sRGB'
    width, height = img.size
    aspect = width / height if height else 0.7
    return img, aspect


def make_cover_material(name, image):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    nodes = mat.node_tree.nodes
    links = mat.node_tree.links
    nodes.clear()

    output = nodes.new("ShaderNodeOutputMaterial")
    output.location = (300, 0)
    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    bsdf.location = (0, 0)
    bsdf.inputs["Roughness"].default_value = 0.38
    if "Specular IOR Level" in bsdf.inputs:
        bsdf.inputs["Specular IOR Level"].default_value = 0.4
    elif "Specular" in bsdf.inputs:
        bsdf.inputs["Specular"].default_value = 0.4

    tex = nodes.new("ShaderNodeTexImage")
    tex.location = (-350, 0)
    tex.image = image
    tex.interpolation = 'Cubic'  # sanftes, aber nicht verfaelschendes Sampling

    links.new(tex.outputs["Color"], bsdf.inputs["Base Color"])
    links.new(bsdf.outputs["BSDF"], output.inputs["Surface"])
    return mat


def make_plain_material(name, rgba, roughness=0.5):
    mat = bpy.data.materials.new(name=name)
    mat.use_nodes = True
    bsdf = mat.node_tree.nodes.get("Principled BSDF")
    bsdf.inputs["Base Color"].default_value = rgba
    bsdf.inputs["Roughness"].default_value = roughness
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
    bevel.segments = 2
    bevel.limit_method = 'ANGLE'
    bpy.context.view_layer.objects.active = obj
    obj.select_set(True)
    bpy.ops.object.shade_smooth()
    bevel_mod = obj.modifiers["EdgeBevel"]
    # Auto-Smooth nur auf scharfen Kanten (per Bevel-Weight/Angle geregelt),
    # Bevel-Modifier + Shade Smooth reicht fuer die kleinen Fasen hier aus.
    obj.select_set(False)


def create_book(basename, image_path, aspect, spine_on_right, x_position, turn_deg):
    image, _ = load_cover_image(image_path)

    width = BOOK_HEIGHT * aspect
    obj = build_book_mesh(f"Book_{basename}", width, BOOK_HEIGHT, SPINE_THICKNESS,
                           spine_on_right)

    cover_mat = make_cover_material(f"Mat_Cover_{basename}", image)
    cream_mat = make_plain_material(f"Mat_Cream_{basename}", CREAM_SPINE_COLOR)
    obj.data.materials.append(cover_mat)
    obj.data.materials.append(cream_mat)

    add_bevel_and_shading(obj)

    # Position: Objektursprung ist am Boden -> z bleibt 0 (steht auf der "Buehne")
    obj.location = (x_position, 0.0, 0.0)

    # Leichte Drehung um Z ("slightly turned toward the viewer")
    # spine_on_right=False (Frontcover-Exemplar): positive Drehung zeigt
    #   den linken Buchruecken minimal an.
    # spine_on_right=True (Backcover-Exemplar): Spiegelbildliche negative
    #   Drehung zeigt den rechten Buchruecken minimal an.
    sign = 1.0 if not spine_on_right else -1.0
    obj.rotation_euler = (0.0, 0.0, math.radians(turn_deg) * sign)

    return obj


# ---------------------------------------------------------------------------
# 5. BUECHER ERZEUGEN
# ---------------------------------------------------------------------------

_, front_aspect = load_cover_image(FRONT_PATH)
_, back_aspect = load_cover_image(BACK_PATH)

left_book = create_book(
    basename=f"{ARGS.name}_front",
    image_path=FRONT_PATH,
    aspect=front_aspect,
    spine_on_right=False,
    x_position=-GAP_BETWEEN_BOOKS,
    turn_deg=TURN_ANGLE_DEG,
)

right_book = create_book(
    basename=f"{ARGS.name}_back",
    image_path=BACK_PATH,
    aspect=back_aspect,
    spine_on_right=True,
    x_position=GAP_BETWEEN_BOOKS,
    turn_deg=TURN_ANGLE_DEG,
)


# ---------------------------------------------------------------------------
# 6. BODEN / HINTERGRUND (nahtlose, warme Ivory-Flaeche, keine Requisiten)
# ---------------------------------------------------------------------------

bpy.ops.mesh.primitive_plane_add(size=6, location=(0, 0.15, 0))
floor = bpy.context.active_object
floor.name = "Floor"
floor_mat = make_plain_material("Mat_Floor", (*BACKGROUND_HEX, 1.0), roughness=0.85)
floor.data.materials.append(floor_mat)

world = bpy.data.worlds.new("World_Ivory")
bpy.context.scene.world = world
world.use_nodes = True
bg_node = world.node_tree.nodes.get("Background")
bg_node.inputs["Color"].default_value = (*BACKGROUND_HEX, 1.0)
bg_node.inputs["Strength"].default_value = 1.0


# ---------------------------------------------------------------------------
# 7. KAMERA (Dreiviertelperspektive)
# ---------------------------------------------------------------------------

cam_data = bpy.data.cameras.new("Camera")
cam_data.lens = 85  # leichtes Tele, verzerrungsarm, klassisch fuer Produktfotos
cam_obj = bpy.data.objects.new("Camera", cam_data)
bpy.context.collection.objects.link(cam_obj)
bpy.context.scene.camera = cam_obj

cam_pos = Vector((0.0, -1.05, BOOK_HEIGHT * 0.58))
target = Vector((0.0, 0.0, BOOK_HEIGHT * 0.50))
direction = (target - cam_pos).normalized()
cam_obj.location = cam_pos
cam_obj.rotation_euler = direction.to_track_quat('-Z', 'Y').to_euler()


# ---------------------------------------------------------------------------
# 8. STUDIOLICHT (weich, dezente Schatten, keine Drama-Beleuchtung)
# ---------------------------------------------------------------------------

def add_area_light(name, location, rotation_euler, size, energy, color=(1.0, 0.98, 0.94)):
    light_data = bpy.data.lights.new(name=name, type='AREA')
    light_data.shape = 'RECTANGLE'
    light_data.size = size
    light_data.size_y = size * 0.7
    light_data.energy = energy
    light_data.color = color
    light_obj = bpy.data.objects.new(name, light_data)
    bpy.context.collection.objects.link(light_obj)
    light_obj.location = location
    light_obj.rotation_euler = rotation_euler
    return light_obj


# Key-Light: grosse weiche Softbox von vorne-oben
add_area_light(
    "Key_Softbox",
    location=(-0.6, -1.1, 1.1),
    rotation_euler=(math.radians(58), 0, math.radians(-28)),
    size=1.4,
    energy=180,
)

# Fill-Light: schwaecher, von der anderen Seite, hellt Schatten dezent auf
add_area_light(
    "Fill_Light",
    location=(0.9, -0.9, 0.7),
    rotation_euler=(math.radians(65), 0, math.radians(35)),
    size=1.6,
    energy=70,
)

# Top-Light: gleichmaessiges Overhead-Licht fuer sauberen, editorial Look
add_area_light(
    "Top_Fill",
    location=(0.0, -0.2, 1.8),
    rotation_euler=(0, 0, 0),
    size=2.2,
    energy=90,
)


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
scene.render.film_transparent = False

# Standard-Farbwiedergabe, damit die Coverfarben moeglichst originalgetreu
# (pixelgenau) bleiben und nicht durch Filmic/Kontrastkurven veraendert werden.
scene.view_settings.view_transform = 'Standard'
scene.view_settings.look = 'None'

scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.filepath = str(OUTPUT_PATH)


# ---------------------------------------------------------------------------
# 10. RENDERN
# ---------------------------------------------------------------------------

bpy.ops.render.render(write_still=True)
print(f"Fertig. Mockup gespeichert unter: {OUTPUT_PATH}")