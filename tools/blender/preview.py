"""Entwicklungswerkzeug: Szene aufbauen und Ansichten mit Cycles (CPU) rendern, zu einem Bogen zusammensetzen."""
import math, os, sys
import bpy
import numpy as np
from PIL import Image


def reset_scene():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'
    return sc


def mesh_object(name, V, T, smooth=True, normals=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata(np.asarray(V, float).tolist(), [], np.asarray(T, int).tolist())
    me.update()
    ob = bpy.data.objects.new(name, me)
    bpy.context.scene.collection.objects.link(ob)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    if normals is not None:
        try: me.normals_split_custom_set_from_vertices([tuple(n) for n in normals])
        except Exception as e: print('normals', e)
    return ob


def make_mat(name, color, rough=0.8):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough
    return m


def setup_world(strength=1.0, color=(0.75, 0.78, 0.85)):
    w = bpy.data.worlds.new('w'); w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (*color, 1); bg.inputs['Strength'].default_value = strength
    bpy.context.scene.world = w


def add_light(loc, energy=300, size=0.6, color=(1.0, 0.95, 0.85), target=(0, 0, 0.2)):
    L = bpy.data.lights.new('l', 'AREA'); L.energy = energy; L.size = size; L.color = color
    o = bpy.data.objects.new('l', L); bpy.context.scene.collection.objects.link(o); o.location = loc
    d = np.array(target) - np.array(loc); o.rotation_euler = (math.atan2(math.hypot(d[0], d[1]), -d[2]) if False else 0, 0, 0)
    # Blickrichtung zum Ziel
    import mathutils
    v = mathutils.Vector(target) - mathutils.Vector(loc)
    o.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()
    return o


def render_view(path, eye, target=(0, 0, 0.22), res=(480, 600), lens=70, samples=24, ortho=None, denoise=True):
    import mathutils
    sc = bpy.context.scene
    cam = bpy.data.objects.get('cam')
    if cam is None:
        cd = bpy.data.cameras.new('cam'); cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam)
    sc.camera = cam
    cam.data.lens = lens; cam.data.clip_start = 0.02; cam.data.clip_end = 20
    if ortho: cam.data.type = 'ORTHO'; cam.data.ortho_scale = ortho
    else: cam.data.type = 'PERSP'
    cam.location = eye
    v = mathutils.Vector(target) - mathutils.Vector(eye)
    cam.rotation_euler = v.to_track_quat('-Z', 'Y').to_euler()
    sc.render.resolution_x, sc.render.resolution_y = res; sc.render.resolution_percentage = 100
    sc.cycles.samples = samples; sc.cycles.use_denoising = denoise
    sc.render.image_settings.file_format = 'PNG'
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    return path


def sheet(paths, out, cols=None, label=None):
    ims = [Image.open(p).convert('RGB') for p in paths]
    w, h = ims[0].size; cols = cols or len(ims); rows = (len(ims) + cols - 1) // cols
    S = Image.new('RGB', (w * cols, h * rows), (30, 30, 34))
    for i, im in enumerate(ims): S.paste(im, ((i % cols) * w, (i // cols) * h))
    S.save(out); return out


VIEWS = {
    'front': ((0, -1.55, 0.30), 0),
    'q3': ((1.1, -1.1, 0.42), 0),
    'side': ((1.55, 0.0, 0.30), 0),
    'back': ((0.3, 1.5, 0.35), 0),
    'top': ((0.01, -0.4, 1.4), 0),
}


def standard_view():
    sc = bpy.context.scene
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
