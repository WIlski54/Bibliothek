"""Archimedes, die Bibliothekskatze: Modell, Skelett, Animationen und glTF-Export per Skript.

Aufruf (reproduzierbar, ohne Oberfläche):
    /home/user/blenv/bin/python tools/blender/archimedes.py [--out assets/cat/archimedes.glb] [--cache DIR] [--render DIR] [--no-export]

Ablauf: Distanzfeld (catshape) -> Netze (catmesh, Surface Nets) -> Ausdünnen (Blender) -> Normalen/Gewichte/Ambient Occlusion aus dem Feld
-> UV-Entfaltung (Blender) -> Fellfarbe aus der 3D-Funktion in die Textur backen (cattex) -> Augen, Lider, Halsband, Marke, Schnurrhaare (catparts)
-> Skelett (catrig) -> Animationen (catanim) -> glTF/GLB. Nur numpy, Pillow und bpy.
"""
import os, sys, time, argparse, math
HERE = os.path.dirname(os.path.abspath(__file__)); sys.path.insert(0, HERE)
import numpy as np
import bpy
from PIL import Image, ImageDraw, ImageFilter
import json
import sdfmesh as SD, catshape as C, catmesh as M, catrig as R, cattex as TX, catparts as PT, catanim as AN

ROOT = os.path.abspath(os.path.join(HERE, '..', '..'))
CM = 0.01
TEX = 1024


def log(*a): print('[archimedes]', *a, flush=True)


# ----------------------------------------------------------------------------- Blender-Hilfen
def new_mesh_object(name, V, T, smooth=True):
    me = bpy.data.meshes.new(name); me.from_pydata(np.asarray(V, float).tolist(), [], np.asarray(T, int).tolist()); me.update()
    ob = bpy.data.objects.new(name, me); bpy.context.scene.collection.objects.link(ob)
    if smooth:
        for p in me.polygons: p.use_smooth = True
    return ob


def decimate(V, T, target):
    ob = new_mesh_object('tmp', V, T, smooth=False)
    md = ob.modifiers.new('dec', 'DECIMATE'); md.decimate_type = 'COLLAPSE'; md.ratio = min(1.0, target / len(T)); md.use_collapse_triangulate = True
    me = bpy.data.meshes.new_from_object(ob.evaluated_get(bpy.context.evaluated_depsgraph_get()))
    V2 = np.array([v.co[:] for v in me.vertices]); T2 = np.array([p.vertices[:] for p in me.polygons])
    bpy.data.objects.remove(ob); bpy.data.meshes.remove(me)
    return V2, T2


def set_uv(me, uv_per_vertex, T):
    """UV je Eckpunkt (für Teile mit einfacher Abwicklung)"""
    layer = me.uv_layers.new(name='UVMap')
    loops = np.array([v for p in me.polygons for v in p.vertices])
    layer.data.foreach_set('uv', np.asarray(uv_per_vertex)[loops].ravel().astype(np.float32))


def tail_param(P):
    c, r, u = C.tail_curve(60)
    c = c * CM
    d = np.linalg.norm(P[:, None, :] - c[None, :, :], axis=2)
    k = d.argmin(1); return u[k], d.min(1)


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


# ----------------------------------------------------------------------------- Fell-Netz
class Fur:
    pass


def build_fur(cache):
    F = C.build_fields(); fields = M.piece_fields(F)
    pieces = M.raw_pieces(cache_dir=cache)
    Vs, Ts, ids = [], [], []
    off = 0
    for k in M.PIECES:
        V, T = pieces[k]
        V2, T2 = decimate(V, T, M.TARGET[k])
        V2 = SD.project(fields[k], V2, 2)
        log(f'Teilnetz {k}: {len(T)} -> {len(T2)} Dreiecke')
        Vs.append(V2); Ts.append(T2 + off); ids.append(np.full(len(V2), M.PID[k], np.int8)); off += len(V2)
    f = Fur(); f.F = F; f.fields = fields
    f.V = np.vstack(Vs); f.T = np.vstack(Ts); f.piece = np.concatenate(ids)
    # Normalen aus dem Feld des jeweiligen Teilnetzes
    f.N = np.zeros_like(f.V)
    for k in M.PIECES:
        m = f.piece == M.PID[k]; g = SD.grad(fields[k], f.V[m], 0.0012); f.N[m] = g / np.linalg.norm(g, axis=1)[:, None]
    # Umgebungsverdeckung (Ambient Occlusion) aus dem verschmolzenen Gesamtkörper
    body = lambda P: F['body'](P, True)
    occ = np.zeros(len(f.V)); sca = 1.0
    gN = SD.grad(body, f.V, 0.0015); gN /= np.maximum(np.linalg.norm(gN, axis=1), 1e-9)[:, None]
    for i in range(1, 7):
        h = 0.004 * i * (1 + 0.35 * i)
        d = body(f.V + gN * h)
        occ += np.clip(h - d, 0, None) * sca; sca *= 0.78
    f.ao = np.clip(1 - 7.0 * occ, 0, 1)
    # Hautgewichte: jedes Teilnetz nur an seinen eigenen Knochen
    allnames = list(F['parts'].keys())
    f.W = np.zeros((len(f.V), len(allnames))); f.names = allnames
    for k in M.PIECES:
        m = np.nonzero(f.piece == M.PID[k])[0]
        if k == 'jaw': continue
        bs = C.PIECE_BONES[k]
        tau = {'body': 0.012, 'tail': 0.022}.get(k, 0.008)
        if len(bs) == 1: w = np.ones((len(m), 1))
        else: w, _ = R.skin_weights(f.V[m], F, tau=tau, allowed=bs)
        for j, b in enumerate(bs): f.W[m, allnames.index(b)] = w[:, j]
    return f


REGION_OF_PIECE = {'body': 'torso', 'head': 'head', 'jaw': 'head', 'earL': 'ear', 'earR': 'ear', 'foreL': 'fore', 'foreR': 'fore', 'hindL': 'hind', 'hindR': 'hind', 'tail': 'tail', 'lid': 'head'}


def region_weights(piece):
    out = {k: np.zeros(len(piece)) for k in ('head', 'torso', 'fore', 'hind', 'tail', 'ear')}
    for k, r in REGION_OF_PIECE.items(): out[r][piece == M.PID[k]] = 1.0
    return out


# ----------------------------------------------------------------------------- Texturen
def bake_fur(me, f, V, N, ao, Pc, rim, wr, tail_u, piece_t, img_path, size=TEX):
    """me: Blender-Netz mit UV. Backt die Fellfarbe in ein Bild."""
    uvl = me.uv_layers.active.data
    loops = np.array([(lp.vertex_index) for lp in me.loops]); uvs = np.empty((len(me.loops), 2), np.float32); uvl.foreach_get('uv', uvs.ravel())
    tris = np.array([p.vertices[:] for p in me.polygons]); lt = np.array([p.loop_indices[:] for p in me.polygons])
    uv_t = uvs[lt]                                    # (m,3,2)
    tid, bary = TX.rasterize(uv_t, size)
    mask = tid >= 0
    ii = tid[mask]; bb = bary[mask]
    vi = tris[ii]                                     # (k,3) Eckpunkte

    def interp(A):
        A = np.asarray(A); return (A[vi] * bb[..., None]).sum(1) if A.ndim == 2 else (A[vi] * bb).sum(1)
    P = interp(Pc); Nn = interp(N); Nn /= np.maximum(np.linalg.norm(Nn, axis=1), 1e-9)[:, None]
    A = interp(ao); Rg = {k: interp(v) for k, v in wr.items()}; TU = interp(tail_u); RIM = interp(rim)
    pt = piece_t[vi[:, 0]]
    # Zusatzfelder direkt am Bildpunkt
    aux = {}
    ein = np.zeros(len(P))
    for sgn, pid in ((1, M.PID['earL']), (-1, M.PID['earR'])):
        m = pt == pid
        if m.any(): ein[m] = 1 - sstep(0.0007, 0.0021, np.abs(f.F['ear_inner'][sgn](P[m])))
    aux['ear_inner'] = ein
    x, y, z = P[:, 0] / CM, P[:, 1] / CM, P[:, 2] / CM
    aux['lip'] = np.where(y < -8.0, np.abs(z - C.lip_z(x)) * 1.0, 99.0)
    a_, b_, c_ = C.jaw_terms(P)
    top = (np.abs(a_) < 0.0016) & (a_ >= np.maximum(b_, c_) - 0.0016)
    aux['mouth_in'] = np.where(top & (y > -10.4), sstep(0.0016, 0.0009, np.abs(a_)), 0.0)
    aux['tongue'] = sstep(1.5, 1.0, np.abs(x)) * sstep(-5.6, -6.6, y) * sstep(-10.0, -8.6, y) * 1.0
    col = TX.fur_color(P, Nn, A, Rg, TU, aux)
    # Lidrand dunkel, Lider sonst Fell
    lm = pt == M.PID['lid']
    if lm.any():
        t = np.clip(RIM[lm], 0, 1)
        col[lm] = col[lm] * (1 - t[:, None]) + np.array(TX.COL['liner']) * t[:, None]
    img = np.zeros((size, size, 3), np.float32); img[mask] = col
    img, m2 = TX.dilate(img, mask, 8)
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(img_path, quality=88, subsampling=0 if img_path.endswith('.png') else 2)
    log('Fellkarte', img_path, 'Abdeckung', f'{mask.mean() * 100:.0f}%')
    return img


def eye_texture(path, size=256):
    """Auge: azimutale Karte (Mitte = Blickrichtung, Rand = 100 Grad). Grüne Iris, große Pupille, zwei Glanzlichter."""
    S = size; im = np.zeros((S, S, 3), np.float32)
    yy, xx = np.mgrid[0:S, 0:S]; cx = (xx + 0.5) / S - 0.5; cy = (yy + 0.5) / S - 0.5
    r = np.hypot(cx, cy) / 0.5                               # 0 Mitte .. 1 Rand (=100 Grad)
    deg = r * 100.0
    iris_r = 52.0                                            # Irisradius in Grad
    t = np.clip(deg / iris_r, 0, 1.5)
    inner = np.array([214, 238, 112.0]); mid = np.array([120, 200, 70.0]); outer = np.array([34, 112, 52.0]); rimc = np.array([18, 62, 36.0])
    col = np.where((t < 0.55)[..., None], inner + (mid - inner) * (t / 0.55)[..., None], mid + (outer - mid) * np.clip((t - 0.55) / 0.40, 0, 1)[..., None])
    # radiale Fasern
    ang = np.arctan2(cy, cx); fib = 0.5 + 0.5 * np.sin(ang * 26 + np.sin(ang * 7) * 2)
    col = col * (0.93 + 0.12 * fib[..., None] * np.clip(t * 1.4, 0, 1)[..., None])
    col = np.where((t > 0.90)[..., None], col + (rimc - col) * sstep(0.90, 1.0, t)[..., None], col)
    # Sklera
    sc = np.array([250, 248, 240.0])
    col = np.where((t >= 1.0)[..., None], sc + (np.array([226, 224, 220.0]) - sc) * sstep(1.0, 1.5, t)[..., None], col)
    col = col + (sc - col) * (1 - sstep(0.96, 1.04, t))[..., None] * 0                # harte Kante
    # Pupille (leicht hochoval, schlaue Katzenpupille aber rund genug für niedlich)
    pup = np.hypot(cx / 0.5 / 0.36 * 100.0 / 100.0, cy / 0.5 / 0.46)                   # Ellipse: 36 Grad breit, 46 Grad hoch ... in Einheiten von r
    pr = np.hypot(cx / (0.5 * 0.22), cy / (0.5 * 0.30))
    pm = 1 - sstep(0.9, 1.0, pr)
    col = col * (1 - pm[..., None]) + np.array([14, 12, 16.0]) * pm[..., None]
    # Glanzlichter: groß oben links, klein unten rechts
    for (gx, gy, gr, a) in ((-0.20, -0.20, 0.085, 1.0), (0.17, 0.19, 0.040, 0.9)):
        g = 1 - sstep(gr * 0.75, gr, np.hypot(cx - gx * 0.5 * 1.0, cy - gy * 0.5 * 1.0) )
        col = col * (1 - g[..., None] * a) + np.array([255, 255, 255.0]) * g[..., None] * a
    Image.fromarray(np.clip(col, 0, 255).astype(np.uint8)).save(path)


def acc_textures(p_col, p_mr, size=64):
    """Zubehör-Atlas: links Halsband (rot), Mitte Messing, rechts Schnurrhaare (cremeweiß)"""
    c = np.zeros((size, size, 3), np.uint8); mr = np.zeros((size, size, 3), np.uint8)
    w = size // 3
    cols = [(184, 37, 47), (234, 185, 74), (246, 242, 232)]; rough = [150, 85, 140]; metal = [0, 255, 0]
    for i in range(3):
        c[:, i * w:(i + 1) * w if i < 2 else size] = cols[i]; mr[:, i * w:(i + 1) * w if i < 2 else size] = (255, rough[i], metal[i])
    Image.fromarray(c).save(p_col); Image.fromarray(mr).save(p_mr)


def image_node(mat, path, colorspace='sRGB'):
    img = bpy.data.images.load(path); img.colorspace_settings.name = colorspace; img.pack()
    n = mat.node_tree.nodes.new('ShaderNodeTexImage'); n.image = img; return n


def make_material(name, tex_path, rough=0.85, metal=0.0):
    m = bpy.data.materials.new(name); m.use_nodes = True; m.use_backface_culling = True
    nt = m.node_tree; b = nt.nodes['Principled BSDF']
    tn = image_node(m, tex_path); nt.links.new(tn.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal
    return m, b


# ----------------------------------------------------------------------------- Hauptablauf
def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--out', default=os.path.join(ROOT, 'assets', 'cat', 'archimedes.glb'))
    ap.add_argument('--cache', default=None)
    ap.add_argument('--render', default=None, help='Ordner für Kontrollbilder')
    ap.add_argument('--no-export', action='store_true')
    ap.add_argument('--save-blend', default=None, help='gebautes Modell als .blend ablegen (Entwicklung)')
    argv = sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else sys.argv[1:]
    args = ap.parse_args(argv)
    t0 = time.time()
    work = args.cache or os.path.join(ROOT, 'tools', 'blender', '.cache')
    os.makedirs(work, exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    res = build_all(args, work)
    if args.save_blend: bpy.ops.wm.save_as_mainfile(filepath=args.save_blend)
    if not args.no_export: export(args, res)
    log('fertig in %.1f s' % (time.time() - t0))


def build_all(args, work):
    f = build_fur(work)
    V, T, N, ao, piece = f.V, f.T, f.N, f.ao, f.piece
    W, names = f.W, f.names
    # --- Lider anhängen
    LIDS = []
    off = len(V)
    Vl_all, Tl_all, Nl_all, Pc_all, rim_all, wl_all = [], [], [], [], [], []
    lid_ids = []
    for s, nm in ((1, 'lidL'), (-1, 'lidR')):
        c = np.array([s * C.EYE_C[0], C.EYE_C[1], C.EYE_C[2]]) * CM
        Vo, Tl, No, Vc, rim = PT.lid_shell(c, (C.EYE_R + 0.09) * CM)
        LIDS.append((nm, Vo, Tl, No, Vc, rim))
    # Arrays zusammenführen
    V2, T2, N2, ao2, piece2 = [V], [T], [N], [ao], [piece]
    Pc = [V]; RIM = [np.zeros(len(V))]; lidw = []
    base = len(V)
    for nm, Vo, Tl, No, Vc, rim in LIDS:
        Tl = PT.fix_winding(Vo, Tl, No); V2.append(Vo); T2.append(Tl + base); N2.append(No); ao2.append(np.full(len(Vo), 0.9)); piece2.append(np.full(len(Vo), M.PID['lid'], np.int8))
        cl = np.array([s * C.EYE_C[0], C.EYE_C[1], C.EYE_C[2]]) * CM
        dz = (Vc[:, 2] - cl[2]) / ((C.EYE_R + 0.09) * CM)
        lash = sstep(0.68, 0.94, rim) * sstep(0.2, -0.5, dz)          # dunkle Lidkante nur unten (Wimpernlinie)
        Pc.append(cl + (Vc - cl) * 1.55); RIM.append(lash); lidw.append((nm, base, len(Vo))); base += len(Vo)
    V = np.vstack(V2); T = np.vstack(T2); N = np.vstack(N2); ao = np.concatenate(ao2); piece = np.concatenate(piece2); Pc = np.vstack(Pc); RIM = np.concatenate(RIM)
    log('Fell gesamt:', len(V), 'Punkte', len(T), 'Dreiecke')
    # --- Blender-Netz, UV
    fur = new_mesh_object('Fell', V, T)
    me = fur.data
    me.normals_split_custom_set_from_vertices([tuple(n) for n in N])
    bpy.context.view_layer.objects.active = fur; fur.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, area_weight=0.7, correct_aspect=True)
    bpy.ops.object.mode_set(mode='OBJECT')
    # --- Farbe backen
    wr = region_weights(piece)
    tu, _ = tail_param(Pc)
    img_fur = os.path.join(work, 'fur.jpg')
    bake_fur(me, f, V, N, ao, Pc, RIM, wr, tu, piece, img_fur)
    img_eye = os.path.join(work, 'eye.png'); eye_texture(img_eye)
    img_acc = os.path.join(work, 'acc.png'); img_accmr = os.path.join(work, 'accmr.png'); acc_textures(img_acc, img_accmr)
    # --- Gewichte der Fellnetz-Punkte
    Wfull = np.zeros((len(V), len(names)))
    Wfull[:len(W)] = W
    jawm = np.zeros(len(V), bool); jawm[:len(f.piece)] = f.piece == M.PID['jaw']
    R.assign_weights(fur, Wfull * (~jawm)[:, None], names)
    vg = fur.vertex_groups.new(name='jaw')
    for i in np.nonzero(jawm)[0]: vg.add([int(i)], 1.0, 'REPLACE')
    for nm, b0, n in lidw:
        vg = fur.vertex_groups.new(name=nm)
        for i in range(b0, b0 + n): vg.add([i], 1.0, 'REPLACE')
    mat_fur, bsdf = make_material('Fell', img_fur, 0.86)
    me.materials.append(mat_fur)

    # --- Augen
    Ve, Te, Ne, UVe = [], [], [], []; eb = 0; eyegroups = []
    for s, nm in ((1, 'eyeL'), (-1, 'eyeR')):
        v, t, n, uv = PT.eyeball(np.array([s * C.EYE_C[0], C.EYE_C[1], C.EYE_C[2]]) * CM, C.EYE_R * CM)
        t = PT.fix_winding(v, t, n); Ve.append(v); Te.append(t + eb); Ne.append(n); UVe.append(uv); eyegroups.append((nm, eb, len(v))); eb += len(v)
    eyes = new_mesh_object('Augen', np.vstack(Ve), np.vstack(Te)); eyes.data.normals_split_custom_set_from_vertices([tuple(n) for n in np.vstack(Ne)])
    set_uv(eyes.data, np.vstack(UVe), np.vstack(Te))
    for nm, b0, n in eyegroups:
        vg = eyes.vertex_groups.new(name=nm)
        for i in range(b0, b0 + n): vg.add([i], 1.0, 'REPLACE')
    mat_eye, beye = make_material('Augen', img_eye, 0.18)
    beye.inputs['Specular IOR Level'].default_value = 0.6
    eyes.data.materials.append(mat_eye)

    # --- Zubehör: Halsband, Marke, Schnurrhaare
    Va, Ta, Na, UVa = [], [], [], []; ab = 0; wparts = []
    def addp(V_, T_, N_, u, wkind):
        nonlocal ab
        T_ = PT.fix_winding(V_, T_, N_)
        Va.append(V_); Ta.append(T_ + ab); Na.append(N_); UVa.append(np.tile(u, (len(V_), 1))); wparts.append((wkind, ab, len(V_))); ab += len(V_)
    cV, cT, cN, front, ax = PT.collar(f.F)
    addp(cV, cT, cN, (1 / 6, 0.5), 'skin')
    tV, tT, tN = PT.tag(front, ax)
    addp(tV, tT, tN, (0.5, 0.5), 'skin')
    for s in (1, -1):
        for V_, T_, N_ in PT.whiskers(f.F, s): addp(V_, T_, N_, (5 / 6, 0.5), 'head')
    acc = new_mesh_object('Zubehoer', np.vstack(Va), np.vstack(Ta)); acc.data.normals_split_custom_set_from_vertices([tuple(n) for n in np.vstack(Na)])
    set_uv(acc.data, np.vstack(UVa), np.vstack(Ta))
    Vall = np.vstack(Va)
    Wa, _ = R.skin_weights(Vall, f.F)
    for kind, b0, n in wparts:
        if kind == 'head':
            Wa[b0:b0 + n] = 0; Wa[b0:b0 + n, names.index('head')] = 1.0
    R.assign_weights(acc, Wa, names)
    mat_acc, bacc = make_material('Zubehoer', img_acc, 0.6)
    mr = image_node(mat_acc, img_accmr, 'Non-Color'); sep = mat_acc.node_tree.nodes.new('ShaderNodeSeparateColor')
    mat_acc.node_tree.links.new(mr.outputs['Color'], sep.inputs['Color'])
    mat_acc.node_tree.links.new(sep.outputs['Green'], bacc.inputs['Roughness']); mat_acc.node_tree.links.new(sep.outputs['Blue'], bacc.inputs['Metallic'])
    acc.data.materials.append(mat_acc)

    # --- Skelett
    arm = R.make_armature(C.bones())
    for ob in (fur, eyes, acc): R.bind(ob, arm)
    log('Knochen:', len(arm.data.bones))
    tris = len(fur.data.polygons) + len(eyes.data.polygons) + len(acc.data.polygons)
    log('Dreiecke gesamt:', tris)
    np.savez(os.path.join(work, 'fur_data.npz'), V=V, T=T, W=Wfull, names=np.array(names), piece=piece, nfur=len(f.V))
    return dict(arm=arm, fur=fur, eyes=eyes, acc=acc, f=f)


def export(args, res):
    arm = res['arm']; rig = R.Rig(arm)
    AN.build_actions(rig, arm)
    arm['archimedes'] = json.dumps(dict(gaits=AN.stride_info(), fps=AN.FPS, clips={n: dict(duration=round(d, 4), loop=l) for n, _, d, l in AN.CLIPS}))
    arm.animation_data.action = None
    rig.reset(); bpy.context.view_layer.update()
    os.makedirs(os.path.dirname(os.path.abspath(args.out)), exist_ok=True)
    bpy.ops.export_scene.gltf(filepath=args.out, export_format='GLB', export_animations=True, export_animation_mode='NLA_TRACKS', export_skins=True, export_morph=False,
                              export_extras=True, export_yup=True, export_apply=False, export_cameras=False, export_lights=False, export_image_format='AUTO', export_jpeg_quality=86,
                              export_optimize_animation_size=True, export_def_bones=False, export_leaf_bone=False, export_influence_nb=4, export_force_sampling=True)
    size = os.path.getsize(args.out)
    log('GLB:', args.out, f'{size / 1024:.0f} KB')


if __name__ == '__main__':
    main()
