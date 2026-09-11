import bpy
import sys
import os
from math import radians

# --------------------------------------------------
# ARGUMENT
# --------------------------------------------------

argv = sys.argv

if "--" not in argv:
    raise Exception(
        'Aufruf: blender -b -P booklet_mockup.py -- "Titel"'
    )

name = argv[argv.index("--") + 1]

# --------------------------------------------------
# PATHS
# --------------------------------------------------

BASE = os.path.dirname(os.path.abspath(__file__))

FRONT = os.path.abspath(
    os.path.join(
        BASE,
        f"../pics/ratgeber-front/{name}.png"
    )
)

BACK = os.path.abspath(
    os.path.join(
        BASE,
        f"../pics/ratgeber-back/{name}.png"
    )
)

OUTDIR = os.path.join(BASE, "output")
os.makedirs(OUTDIR, exist_ok=True)

OUTPUT = os.path.join(
    OUTDIR,
    f"{name}.png"
)

if not os.path.exists(FRONT):
    raise Exception(f"Front fehlt: {FRONT}")

if not os.path.exists(BACK):
    raise Exception(f"Back fehlt: {BACK}")

print("FRONT:", FRONT)
print("BACK :", BACK)

# --------------------------------------------------
# CLEAN SCENE
# --------------------------------------------------

bpy.ops.object.select_all(action="SELECT")
bpy.ops.object.delete()

# --------------------------------------------------
# RENDER
# --------------------------------------------------

scene = bpy.context.scene

scene.render.engine = "CYCLES"

scene.cycles.samples = 128

scene.render.resolution_x = 3840
scene.render.resolution_y = 2160
scene.render.resolution_percentage = 100

scene.render.image_settings.file_format = "PNG"

scene.render.filepath = OUTPUT

# --------------------------------------------------
# WORLD
# --------------------------------------------------

world = bpy.data.worlds.new("World")

scene.world = world
world.use_nodes = True

bg = world.node_tree.nodes["Background"]

bg.inputs[0].default_value = (
    0.980,
    0.973,
    0.949,
    1
)

bg.inputs[1].default_value = 1.0

# --------------------------------------------------
# LOAD IMAGES
# --------------------------------------------------

front_img = bpy.data.images.load(FRONT)
back_img = bpy.data.images.load(BACK)

# --------------------------------------------------
# MATERIALS
# --------------------------------------------------

def image_material(name, image):

    mat = bpy.data.materials.new(name)

    mat.use_nodes = True

    nodes = mat.node_tree.nodes
    links = mat.node_tree.links

    for n in list(nodes):
        if n.name != "Material Output":
            nodes.remove(n)

    tex = nodes.new("ShaderNodeTexImage")
    tex.image = image

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")

    bsdf.inputs["Roughness"].default_value = 0.4

    links.new(
        tex.outputs["Color"],
        bsdf.inputs["Base Color"]
    )

    links.new(
        bsdf.outputs["BSDF"],
        nodes["Material Output"].inputs["Surface"]
    )

    return mat


paper_mat = bpy.data.materials.new("Paper")
paper_mat.use_nodes = True

paper_mat.node_tree.nodes[
    "Principled BSDF"
].inputs["Base Color"].default_value = (
    0.94,
    0.93,
    0.90,
    1
)

front_mat = image_material(
    "FrontMat",
    front_img
)

back_mat = image_material(
    "BackMat",
    back_img
)

# --------------------------------------------------
# BOOK FORMAT
# --------------------------------------------------

BOOK_H = 2.0
BOOK_W = 1.42

THICKNESS = 0.004

# --------------------------------------------------
# COVER OBJECT
# --------------------------------------------------

def cover_plane(
    material,
    x,
    y,
    rot_y
):

    bpy.ops.mesh.primitive_plane_add()

    obj = bpy.context.object

    obj.scale = (
        BOOK_W / 2,
        BOOK_H / 2,
        1
    )

    obj.rotation_euler = (
        radians(90),
        radians(rot_y),
        0
    )

    obj.location = (
        x,
        y,
        BOOK_H / 2
    )

    obj.data.materials.append(material)

    return obj

# --------------------------------------------------
# PAPER BLOCK
# --------------------------------------------------

def paper_block(
    x,
    rot_y
):

    bpy.ops.mesh.primitive_cube_add()

    block = bpy.context.object

    block.scale = (
        BOOK_W / 2,
        THICKNESS / 2,
        BOOK_H / 2
    )

    block.location = (
        x,
        0,
        BOOK_H / 2
    )

    block.rotation_euler = (
        0,
        radians(rot_y),
        0
    )

    block.data.materials.append(
        paper_mat
    )

    return block

# --------------------------------------------------
# LEFT BOOKLET
# FRONT
# --------------------------------------------------

paper_block(
    x=-1.1,
    rot_y=-18
)

cover_plane(
    front_mat,
    x=-1.1,
    y=THICKNESS/2 + 0.001,
    rot_y=-18
)

# --------------------------------------------------
# RIGHT BOOKLET
# BACK
#
# Rücken außen rechts
# --------------------------------------------------

paper_block(
    x=1.1,
    rot_y=18
)

cover_plane(
    back_mat,
    x=1.1,
    y=-(THICKNESS/2 + 0.001),
    rot_y=198
)

# --------------------------------------------------
# FLOOR
# --------------------------------------------------

bpy.ops.mesh.primitive_plane_add(
    size=20
)

floor = bpy.context.object

floor.location = (
    0,
    0,
    0
)

floor_mat = bpy.data.materials.new(
    "Floor"
)

floor_mat.use_nodes = True

floor_mat.node_tree.nodes[
    "Principled BSDF"
].inputs["Base Color"].default_value = (
    0.980,
    0.973,
    0.949,
    1
)

floor.data.materials.append(
    floor_mat
)

# --------------------------------------------------
# CAMERA
# --------------------------------------------------

cam_data = bpy.data.cameras.new(
    "Camera"
)

cam = bpy.data.objects.new(
    "Camera",
    cam_data
)

bpy.context.collection.objects.link(
    cam
)

scene.camera = cam

cam.location = (
    0,
    -5.2,
    1.45
)

cam.rotation_euler = (
    radians(76),
    0,
    0
)

cam.data.lens = 85

# --------------------------------------------------
# LIGHT
# --------------------------------------------------

bpy.ops.object.light_add(
    type="AREA",
    location=(0, -2.5, 4.5)
)

light = bpy.context.object

light.data.energy = 5000

light.data.shape = "RECTANGLE"

light.scale = (
    5,
    5,
    1
)

# --------------------------------------------------
# OPTIONAL GPU
# --------------------------------------------------

prefs = bpy.context.preferences

try:
    prefs.addons[
        "cycles"
    ].preferences.compute_device_type = "CUDA"
except:
    pass

# --------------------------------------------------
# RENDER
# --------------------------------------------------

print("Rendering ...")

bpy.ops.render.render(
    write_still=True
)

print("Fertig:")
print(OUTPUT)