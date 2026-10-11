"""Gemälde „Archimedes, Hausherr“: die 3D-Katze sitzt im Sessel und hält ein Buch, dahinter ein Bücherregal. Cycles-Render (CPU), 720 x 960.
Wird von archimedes.py (--portrait PFAD) nach dem Modellbau aufgerufen; Szene nur Python/bpy, Texturen mit Pillow."""
import math, os
import numpy as np
import bpy
import mathutils
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import catanim as AN

W, H = 720, 960


def mat(name, color, rough=0.6, metal=0.0, sheen=0.0, tex=None, emit=None):
    m = bpy.data.materials.new(name); m.use_nodes = True
    b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*color, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    if sheen: b.inputs['Sheen Weight'].default_value = sheen; b.inputs['Sheen Roughness'].default_value = 0.5
    if tex:
        n = m.node_tree.nodes.new('ShaderNodeTexImage'); n.image = bpy.data.images.load(tex); n.image.colorspace_settings.name = 'sRGB'
        m.node_tree.links.new(n.outputs['Color'], b.inputs['Base Color'])
    return m


def box(name, loc, size, m, bevel=0.0, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc, rotation=rot)
    o = bpy.context.object; o.name = name; o.scale = size; o.data.materials.append(m)
    if bevel:
        md = o.modifiers.new('bev', 'BEVEL'); md.width = bevel; md.segments = 4
        bpy.ops.object.shade_smooth()
    return o


def srgb(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92 for v in c)


def wallpaper(path, w=1024, h=1024):
    """dunkelgrüne Damast-Tapete"""
    im = Image.new('RGB', (w, h), (36, 78, 70)); d = ImageDraw.Draw(im, 'RGBA')
    for j in range(0, 14):
        for i in range(0, 10):
            cx = i * 104 + (52 if j % 2 else 0); cy = j * 78 + 10
            d.polygon([(cx, cy - 26), (cx + 14, cy), (cx, cy + 26), (cx - 14, cy)], fill=(120, 190, 170, 46))
            d.ellipse([cx - 5, cy - 5, cx + 5, cy + 5], fill=(150, 210, 185, 50))
    im = im.filter(ImageFilter.GaussianBlur(0.8)); im.save(path)


def book_cover(path, w=512, h=640):
    im = Image.new('RGB', (w, h), (122, 42, 32)); d = ImageDraw.Draw(im)
    d.rectangle([14, 14, w - 15, h - 15], outline=(224, 180, 72), width=4); d.rectangle([26, 26, w - 27, h - 27], outline=(224, 180, 72), width=2)
    try: f = ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSerif-Bold.ttf', 64)
    except Exception: f = ImageFont.load_default()
    d.text((w // 2, 150), 'HEUREKA!', fill=(240, 207, 106), font=f, anchor='mm')
    cx, cy = w // 2, 340                          # kleine Glühbirne
    for k in range(7):
        a = math.pi * (0.12 + k / 6 * 0.76); d.line([(cx + math.cos(a) * 62, cy - 4 - math.sin(a) * 62), (cx + math.cos(a) * 92, cy - 4 - math.sin(a) * 92)], fill=(246, 196, 58), width=6)
    d.ellipse([cx - 44, cy - 52, cx + 44, cy + 36], fill=(255, 211, 74)); d.ellipse([cx - 26, cy - 34, cx - 8, cy - 16], fill=(255, 251, 200))
    d.rectangle([cx - 20, cy + 34, cx + 20, cy + 66], fill=(190, 184, 168)); d.rectangle([cx - 14, cy + 66, cx + 14, cy + 82], fill=(150, 150, 150))
    im.save(path)


def build_scene(res, work, out_path, samples=96):
    arm, fur, eyes, acc = res['arm'], res['fur'], res['eyes'], res['acc']
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.device = 'CPU'; sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.render.resolution_x, sc.render.resolution_y = W, H; sc.render.resolution_percentage = int(float(os.environ.get('PORTRAIT_SCALE', '1')) * 100)
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0.0
    # ---------------- Pose: würdevoll sitzen, beide Pfoten am Buch
    import catrig as R
    rig = R.Rig(arm)
    p = AN.Pose()
    p.r('head', -2, 0, 4); p.r('neck', 2)
    import catplanar as PL, catgait as G
    M0, H0, T0 = PL.fk({}, {})
    for s_ in 'LR':
        lu, ll, lf, _ = PL.solve_leg(M0, H0['foreUp' + s_], 'foreUp' + s_, 'foreLow' + s_, 'forePaw' + s_, np.array([-10.2, 13.0]), bend=+1, foot_abs=-35.0)
        p.r('foreUp' + s_, G.wrap(lu)); p.r('foreLow' + s_, G.wrap(ll)); p.r('forePaw' + s_, G.wrap(lf))
        p.r('foreUp' + s_, 0, 0, (1 if s_ == 'L' else -1) * 16)
    AN.lids(p, 0.22)
    for i, n in enumerate(AN.TAIL): p.r(n, 0, 0, 2.0 * math.sin(i))
    p.apply(rig); bpy.context.view_layer.update()
    for n in ('forePawL', 'forePawR', 'foreLowL', 'spine2'):
        print('[portrait]', n, [round(v * 100, 1) for v in arm.pose.bones[n].head], [round(v * 100, 1) for v in arm.pose.bones[n].tail])
    # ---------------- Sessel (Sitzfläche bei z = 0, Katze sitzt auf dem Kissen, schaut nach -y)
    velvet = mat('Samt', srgb('#8f2234'), 0.92, sheen=1.0); velvet2 = mat('SamtDunkel', srgb('#5f1626'), 0.95, sheen=1.0)
    wood = mat('Holz', srgb('#4a2a18'), 0.45); brass = mat('Messing', srgb('#d6a640'), 0.3, metal=1.0)
    box('Sitz', (0, 0.02, -0.055), (0.62, 0.62, 0.11), velvet, 0.035)
    box('Sockel', (0, 0.02, -0.19), (0.66, 0.66, 0.17), velvet2, 0.02)
    box('Lehne', (0, 0.34, 0.30), (0.66, 0.15, 0.66), velvet, 0.06, rot=(math.radians(-6), 0, 0))
    for sx in (-1, 1):
        box('Armlehne', (sx * 0.34, 0.02, 0.14), (0.10, 0.62, 0.28), velvet, 0.04)
        box('ArmlehneOben', (sx * 0.34, 0.0, 0.30), (0.14, 0.60, 0.065), velvet, 0.03)
        for fy in (-0.26, 0.30):
            box('Fuss', (sx * 0.31, fy, -0.34), (0.07, 0.07, 0.16), wood, 0.01)
    for k in range(5):                                           # Messingnieten an der Lehne
        for j in range(3):
            bpy.ops.mesh.primitive_uv_sphere_add(radius=0.012, location=(-0.24 + k * 0.12, 0.262, 0.07 + j * 0.2 + (0.0 if k % 2 == 0 else 0.0)), segments=12, ring_count=8)
            o = bpy.context.object; o.data.materials.append(brass); bpy.ops.object.shade_smooth()
    # ---------------- Buch in den Pfoten (schräg auf dem Schoß)
    book_cover(os.path.join(work, 'bookcover.png'))
    bookm = mat('Buch', srgb('#7a2a20'), 0.55, tex=os.path.join(work, 'bookcover.png'))
    pages = mat('Seiten', srgb('#f1e6c8'), 0.8)
    b = box('Buch', (0.0, -0.093, 0.114), (0.145, 0.03, 0.17), pages, 0.004, rot=(math.radians(-14), 0, 0))
    b.data.materials.clear(); b.data.materials.append(pages); b.data.materials.append(bookm)
    # Deckel vorn als Plane mit Tapetenbild
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0.0, -0.1115, 0.1175), rotation=(math.radians(76), 0, 0))
    cv = bpy.context.object; cv.scale = (0.145, 0.17, 1); cv.data.materials.append(bookm)
    # ---------------- Hintergrund: Tapete, Bücherregal, Boden
    wp = os.path.join(work, 'wall.png'); wallpaper(wp)
    wallm = mat('Tapete', srgb('#2a5a50'), 0.85, tex=wp)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 1.45, 0.55), rotation=(math.radians(90), 0, 0)); wl = bpy.context.object; wl.scale = (3.6, 2.6, 1); wl.data.materials.append(wallm)
    bpy.ops.mesh.primitive_plane_add(size=1, location=(0, 0.2, -0.43)); fl = bpy.context.object; fl.scale = (3.6, 3.0, 1); fl.data.materials.append(mat('Boden', srgb('#5a2a24'), 0.5))
    rnd = np.random.RandomState(7)
    pal = ['#7b1f26', '#2c4a6e', '#2f6a4a', '#8a5a2b', '#4a2c5a', '#1f3f3a', '#9a7b30', '#5a2a20', '#a8552f', '#20303a', '#c9a24a', '#7a6a4a']
    cm = [mat(f'B{i}', srgb(c), 0.6) for i, c in enumerate(pal)]
    shelf_y = 1.2
    box('Regalrückwand', (0, shelf_y + 0.18, 0.95), (2.4, 0.04, 0.95), mat('Regal', srgb('#2b180f'), 0.7))
    for row, (z0, hmax) in enumerate(((0.58, 0.30), (0.98, 0.30), (1.36, 0.26))):
        x = -1.1
        box(f'Brett{row}', (0, shelf_y, z0 - 0.015), (2.4, 0.36, 0.03), wood)
        while x < 1.1:
            w = 0.03 + rnd.rand() * 0.04; h = hmax * (0.62 + rnd.rand() * 0.38)
            if rnd.rand() < 0.04: x += 0.05; continue
            lean = (rnd.rand() - 0.5) * 0.25 if rnd.rand() < 0.07 else 0.0
            box('Buch', (x + w / 2, shelf_y, z0 + h / 2), (w, 0.22, h), cm[rnd.randint(len(cm))], 0.003, rot=(0, lean, 0))
            x += w + 0.002
    box('Kranzleiste', (0, shelf_y - 0.02, 1.62), (2.5, 0.42, 0.07), wood, 0.01)
    # ---------------- Licht
    def light(kind, loc, energy, size, color, target=(0, 0, 0.2)):
        L = bpy.data.lights.new('l', kind); L.energy = energy; L.color = color
        if kind == 'AREA': L.size = size
        o = bpy.data.objects.new('l', L); sc.collection.objects.link(o); o.location = loc
        o.rotation_euler = (mathutils.Vector(target) - mathutils.Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); return o
    light('AREA', (-1.4, -1.5, 1.0), 85, 1.4, (1.0, 0.84, 0.62))
    light('AREA', (1.7, -1.2, 0.5), 22, 1.2, (0.7, 0.8, 1.0))
    light('AREA', (0.9, 0.5, 1.3), 45, 0.8, (1.0, 0.88, 0.7))
    light('AREA', (0.0, -0.4, 2.2), 28, 1.6, (1.0, 0.9, 0.8), target=(0, 0.3, 0.6))
    wd = bpy.data.worlds.new('w'); wd.use_nodes = True; bg = wd.node_tree.nodes['Background']; bg.inputs['Color'].default_value = (0.09, 0.07, 0.07, 1); bg.inputs['Strength'].default_value = 0.35; sc.world = wd
    # ---------------- Kamera
    cd = bpy.data.cameras.new('cam'); cd.lens = 62; cam = bpy.data.objects.new('cam', cd); sc.collection.objects.link(cam); sc.camera = cam
    cam.location = (0.0, -1.72, 0.62); cam.rotation_euler = (mathutils.Vector((0, 0.0, 0.36)) - mathutils.Vector(cam.location)).to_track_quat('-Z', 'Y').to_euler()
    for o in (fur, eyes, acc): o.hide_render = False
    sc.render.image_settings.file_format = 'PNG'; sc.render.filepath = out_path
    bpy.ops.render.render(write_still=True)
    return out_path
