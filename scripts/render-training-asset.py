"""Render Ploder's original dumbbell illustration. Run with Blender --background --python.

The web UI tints this render per theme palette via CSS hue-rotate (see
.hero-dumbbell in src/styles.css), so a single PNG covers all palettes.
For a pixel-perfect variant, set PLODER_PALETTE to one of
neutral|lime|rose|ocean|iris to bake the trim color in and override the
output filename, e.g.:

    PLODER_PALETTE=rose blender --background --python scripts/render-training-asset.py
"""
import bpy
import math
import os
from pathlib import Path
from mathutils import Vector

# Trim colors: 'lime' keeps the original volt render (runtime CSS maps it to
# the lime --chart-1); other entries bake that palette's --chart-1 in.
PALETTE_TRIMS = {
    'neutral': (0.09, 0.09, 0.11),
    'lime': (0.64, 0.89, 0.13),
    'rose': (0.81, 0.41, 0.58),
    'ocean': (0.22, 0.47, 0.73),
    'iris': (0.53, 0.38, 0.71),
}
PALETTE = os.environ.get('PLODER_PALETTE', 'lime')
TRIM_COLOR = PALETTE_TRIMS.get(PALETTE, PALETTE_TRIMS['lime'])
ROOT = Path(__file__).resolve().parents[1]
scene = bpy.data.scenes.new('Ploder Studio')
bpy.context.window.scene = scene
scene.render.engine = 'CYCLES'
scene.cycles.samples = 32
scene.render.resolution_x = 960
scene.render.resolution_y = 720
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.world = bpy.data.worlds.new('Ploder Studio World')
scene.world.use_nodes = True
scene.world.node_tree.nodes['Background'].inputs[0].default_value = (0.25, 0.28, 0.22, 1)
scene.world.node_tree.nodes['Background'].inputs[1].default_value = 0.5

def material(name, color, metal=0, rough=0.4):
    m = bpy.data.materials.new(name)
    m.diffuse_color = (*color, 1)
    m.use_nodes = True
    p = m.node_tree.nodes.get('Principled BSDF')
    p.inputs['Base Color'].default_value = (*color, 1)
    p.inputs['Metallic'].default_value = metal
    p.inputs['Roughness'].default_value = rough
    return m

rubber = material('Graphite rubber', (0.035, 0.045, 0.031), 0.18, 0.32)
lime = material('Volt green trim', TRIM_COLOR, 0.32, 0.24)
steel = material('Brushed titanium', (0.4, 0.45, 0.36), 0.85, 0.3)

def cylinder(name, radius, depth, x, mat, vertices=64):
    bpy.ops.mesh.primitive_cylinder_add(vertices=vertices, radius=radius, depth=depth, location=(x, 0, 0), rotation=(0, math.pi/2, 0))
    o = bpy.context.object
    o.name = name
    o.data.materials.append(mat)
    bevel = o.modifiers.new('Soft machined edges', 'BEVEL')
    bevel.width = 0.075
    bevel.segments = 4
    o.modifiers.new('Weighted normals', 'WEIGHTED_NORMAL')
    return o

cylinder('Handle', 0.19, 2.5, 0, steel)
for side in [-1, 1]:
    cylinder('Hex rubber weight', 0.94, 0.62, side*1.13, rubber, 6)
    cylinder('Volt inset plate', 0.72, 0.065, side*1.465, lime, 6)
    cylinder('Inset face', 0.59, 0.075, side*1.5, rubber, 6)
    cylinder('End bolt', 0.12, 0.085, side*1.55, steel, 6)
for i in range(25):
    cylinder('Grip band', 0.196, 0.016, -0.6+i*0.05, rubber)

bpy.ops.object.camera_add(location=(5, -7, 5.0))
camera = bpy.context.object
camera.rotation_euler = (Vector((0,0,0))-camera.location).to_track_quat('-Z','Y').to_euler()
camera.data.type = 'ORTHO'
camera.data.ortho_scale = 4.9
scene.camera = camera
for name, loc, power, size in [('Key', (0,-4,6), 700, 5), ('Rim', (3,3,4), 1100, 3), ('Fill', (-4,-1,1), 400, 3)]:
    bpy.ops.object.light_add(type='AREA', location=loc)
    light=bpy.context.object
    light.name=name
    light.data.energy=power
    light.data.shape='DISK'
    light.data.size=size
    light.rotation_euler=(-light.location).to_track_quat('-Z','Y').to_euler()
scene.render.image_settings.file_format='PNG'
asset_name = 'training-dumbbell.png' if PALETTE == 'lime' else f'training-dumbbell-{PALETTE}.png'
scene.render.filepath=str(ROOT/'public/assets'/asset_name)
bpy.data.libraries.write(str(ROOT/'public/assets/training-dumbbell.blend'), {scene})
bpy.ops.render.render(write_still=True)
