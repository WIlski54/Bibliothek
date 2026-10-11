"""Teilnetze der Katze (Surface Nets aus den Distanzfeldern): Körper, Kopf, Kiefer, Ohren, Beine, Schwanz."""
import hashlib, os
import numpy as np
import sdfmesh as S
import catshape as C

SRC = ['sdfmesh.py', 'catshape.py', 'catmesh.py']
PIECES = ['body', 'head', 'jaw', 'earL', 'earR', 'foreL', 'foreR', 'hindL', 'hindR', 'tail']
PID = {n: i for i, n in enumerate(PIECES)}
PID['lid'] = len(PIECES)
# Voxelgröße (m) und Dreiecksziel je Teilnetz
VOXEL = {'body': 0.005, 'head': 0.0045, 'jaw': 0.003, 'earL': 0.002, 'earR': 0.002, 'foreL': 0.0045, 'foreR': 0.0045, 'hindL': 0.0045, 'hindR': 0.0045, 'tail': 0.005}
TARGET = {'body': 3000, 'head': 2700, 'jaw': 420, 'earL': 560, 'earR': 560, 'foreL': 520, 'foreR': 520, 'hindL': 620, 'hindR': 620, 'tail': 800}


def _hash():
    h = hashlib.sha1()
    for f in SRC: h.update(open(os.path.join(os.path.dirname(__file__), f), 'rb').read())
    return h.hexdigest()[:12]


def piece_fields(F):
    """Felder der Teilnetze; Kopf und Kiefer teilen sich eine Lippenlinie"""
    th = F.get('head_tf')
    jr = (lambda P: C.jaw_region(P)) if th is None else (lambda P: C.jaw_region(th(P)))
    out = {n: F['piece'](n) for n in PIECES if n != 'jaw'}
    head = out['head']
    out['head'] = lambda P: np.maximum(head(P), -jr(P))
    out['jaw'] = lambda P: np.maximum(head(P), jr(P) - 0.0004)    # 0,4 mm Überlappung, damit keine Fuge klafft
    return out


def _bbox(f, pad=0.014):
    lo = np.array([-0.2, -0.22, -0.01]); hi = np.array([0.22, 0.22, 0.5]); h = 0.012
    xs = np.arange(lo[0], hi[0], h); ys = np.arange(lo[1], hi[1], h); zs = np.arange(lo[2], hi[2], h)
    X, Y, Z = np.meshgrid(xs, ys, zs, indexing='ij'); P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
    v = f(P); m = v < 0.012; Q = P[m]
    return Q.min(0) - pad, Q.max(0) + pad


def _extract(f, lo, hi, h, minv=60, blur=1):
    V, Q, _ = S.extract(f, lo, hi, h, blur=blur)
    V = S.project(f, V, 2); T = S.quads_to_tris(Q)
    lab = S.components(len(V), T); cnt = np.bincount(lab, minlength=len(V)); T = T[cnt[lab[T[:, 0]]] > minv]
    used = np.unique(T); m = -np.ones(len(V), int); m[used] = np.arange(len(used))
    return V[used], m[T]


def raw_pieces(cache_dir=None):
    """{Name: (V, T)} unausgedünnt"""
    key = _hash()
    path = os.path.join(cache_dir, f'raw_{key}.npz') if cache_dir else None
    if path and os.path.exists(path):
        d = np.load(path); return {k: (d[k + 'V'], d[k + 'T']) for k in PIECES}
    F = C.build_fields(); fields = piece_fields(F)
    out = {}
    for n in PIECES:
        lo, hi = _bbox(fields['head'] if n == 'jaw' else fields[n])
        if n == 'jaw': lo = np.array([-0.05, -0.135, 0.205]); hi = np.array([0.05, -0.045, 0.30])
        out[n] = _extract(fields[n], lo, hi, VOXEL[n])
    if path:
        os.makedirs(cache_dir, exist_ok=True)
        for old in os.listdir(cache_dir):
            if old.startswith('raw_'): os.remove(os.path.join(cache_dir, old))
        np.savez(path, **{k + 'V': v[0] for k, v in out.items()}, **{k + 'T': v[1] for k, v in out.items()})
    return out
