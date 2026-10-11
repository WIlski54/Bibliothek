"""Archimedes: Form der Katze als Distanzfeld (Sitzpose = Bindepose).
Alle Maße im Quelltext in Zentimetern (CM), nach außen in Metern. Die Katze sitzt auf dem Boden (z = 0), blickt nach -y,
links der Katze = +x. Jedes Teil gehört einem Knochen (für die Hautgewichte), die Vereinigung ergibt EIN Netz."""
import numpy as np
from sdfmesh import ellipsoid, roundcone, flat_cone, sphere, smin, smax

CM = 0.01
v3 = lambda *a: np.array(a, float) * CM


def E(c, r, rot=(0, 0, 0)): return ellipsoid(v3(*c), v3(*r), rot)
def RC(a, b, r1, r2): return roundcone(v3(*a), v3(*b), r1 * CM, r2 * CM)
def mir(p): return (-p[0], p[1], p[2])


# ----------------------------------------------------------------------------- Maße
EYE_C = (4.9, -9.0, 30.3)      # Augapfelmitte (linkes Auge, +x)
EYE_R = 2.4                    # Augapfelradius
HEAD_C = (0.0, -2.2, 30.6)
MOUTH_Z = 26.9                 # Lippenlinie in der Mitte (cm)

# Schwanz: Mittellinie als Catmull-Rom-Kurve (cm), Radius-Profil; 6 Knochen = 6 gleiche Abschnitte der Kurve
TAIL_CTRL = [(0.0, 8.0, 5.0), (0.2, 11.0, 4.6), (4.5, 14.2, 3.4), (11.0, 13.2, 3.0), (15.0, 7.0, 3.0), (15.4, -0.5, 3.0), (13.6, -7.2, 3.3), (9.8, -11.4, 4.8), (7.0, -11.6, 8.6)]
TAIL_RAD = [(0.0, 3.1), (0.2, 3.7), (0.55, 4.1), (0.85, 3.8), (1.0, 3.1)]


def catmull(pts, n):
    pts = np.asarray(pts, float); P = np.vstack([2 * pts[0] - pts[1], pts, 2 * pts[-1] - pts[-2]])
    seg = len(pts) - 1; out = []
    for i in range(seg):
        p0, p1, p2, p3 = P[i], P[i + 1], P[i + 2], P[i + 3]
        for t in np.linspace(0, 1, n, endpoint=False):
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1]); return np.array(out)


def tail_curve(n=14):
    c = catmull(TAIL_CTRL, n)
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(c, axis=0), axis=1))]; u = d / d[-1]
    r = np.interp(u, [p[0] for p in TAIL_RAD], [p[1] for p in TAIL_RAD])
    return c, r, u


def tail_spheres(i):
    """Kugelkette des Schwanzabschnitts i (1..6)"""
    c, r, u = tail_curve()
    m = (u >= (i - 1) / 6 - 1e-9) & (u <= i / 6 + 1e-9)
    return [sphere(v3(*c[k]), r[k] * CM) for k in np.nonzero(m)[0]]


EAR_BASE = (6.0, -0.8, 35.0); EAR_MID = (7.5, -0.2, 39.2); EAR_TIP = (8.9, 0.4, 43.2)


def ears(side):
    s = side; sx = lambda p: (s * p[0], p[1], p[2])
    base, mid, tip = sx(EAR_BASE), sx(EAR_MID), sx(EAR_TIP)
    nrm = (s * 0.42, -1.0, 0.30)
    o1 = flat_cone(v3(*base), v3(*mid), 3.9 * CM, 2.8 * CM, nrm, 2.7)
    o2 = flat_cone(v3(*mid), v3(*tip), 2.8 * CM, 1.5 * CM, nrm, 2.7)
    n = np.array(nrm); n = n / np.linalg.norm(n)
    off = n * 1.0 * CM
    inner = flat_cone(v3(*base) + off, v3(*tip) + off - np.array([0, 0, 0.5 * CM]), 2.9 * CM, 1.1 * CM, nrm, 2.7)
    return (o1, o2), inner


def build_parts():
    """Liefert {knochen: [Feld, ...]} der Hautteile (ohne Augenhöhlen, Kiefer, Bodenabflachung)."""
    P = {}
    def add(b, f): P.setdefault(b, []).append(f)
    # Rumpf: Birne aus drei Rundkegeln mit stetigen Radien
    add('pelvis', RC((0, 6.2, 7.0), (0, 5.2, 11.0), 8.8, 8.6))
    add('spine1', RC((0, 5.2, 11.0), (0, 3.3, 15.5), 8.6, 7.8))
    add('spine2', RC((0, 3.3, 15.5), (0, 1.4, 19.8), 7.8, 6.6))
    add('neck', RC((0, 0.8, 19.8), (0, -1.4, 25.0), 6.4, 5.6))
    # Kopf
    add('head', E(HEAD_C, (10.6, 8.6, 8.1)))
    for s in (-1, 1):
        add('head', E((s * 7.0, -4.8, 28.0), (4.4, 4.2, 3.5)))                      # Wangen
        add('head', E((s * 2.3, -8.5, 26.8), (2.6, 2.2, 1.8)))                      # Schnurrhaarpolster
    add('head', E((0, -8.1, 27.9), (3.5, 3.1, 2.5)))                                  # Schnauze
    add('head', E((0, -10.9, 28.7), (1.3, 1.0, 0.9)))                                 # Nase
    add('head', E((0, -5.0, 33.8), (5.6, 3.8, 2.7)))                                  # Stirn
    add('head', E((0, -7.6, 24.9), (2.5, 2.5, 1.8)))                                  # Kinn
    for s, nm in ((1, 'L'), (-1, 'R')):
        (o1, o2), _ = ears(s); add('ear' + nm + '1', o1); add('ear' + nm + '2', o2)
    for s, n in ((1, 'L'), (-1, 'R')):
        add('foreUp' + n, RC((s * 4.1, 0.8, 18.0), (s * 4.1, -0.2, 10.5), 3.7, 3.3))
        add('foreLow' + n, RC((s * 4.1, -0.2, 10.5), (s * 4.1, -1.6, 3.8), 3.3, 3.1))
        add('forePaw' + n, E((s * 4.1, -3.8, 2.5), (3.7, 5.0, 2.5)))
        add('thigh' + n, E((s * 8.0, 4.2, 8.8), (6.0, 8.2, 7.2)))
        add('shin' + n, RC((s * 8.3, 3.0, 7.5), (s * 8.2, 7.0, 3.6), 4.1, 3.2))
        add('hindPaw' + n, E((s * 8.2, 0.2, 2.3), (3.5, 6.6, 2.3)))
    for i in range(1, 7):
        for sp in tail_spheres(i): add(f'tail{i}', sp)
    return P


def union_min(fs):
    def f(Pt):
        v = fs[0](Pt)
        for g in fs[1:]: v = np.minimum(v, g(Pt))
        return v
    return f


def union(fs, k):
    def f(Pt):
        v = fs[0](Pt)
        for g in fs[1:]: v = smin(v, g(Pt), k)
        return v
    return f


# Ketten, deren Abschnitte ohne Wulst (harte Vereinigung) ineinander übergehen
CHAINS = {
    'torso': ['pelvis', 'spine1', 'spine2', 'neck'],
    'tail': [f'tail{i}' for i in range(1, 7)],
    'foreL': ['foreUpL', 'foreLowL'], 'foreR': ['foreUpR', 'foreLowR'], 'earL': ['earL1', 'earL2'], 'earR': ['earR1', 'earR2'],
}
# Verschmelzungsweite (m) zwischen den Gruppen
BLEND = {'torso': 0.03, 'head': 0.03, 'tail': 0.014, 'foreL': 0.02, 'foreR': 0.02, 'earL': 0.016, 'earR': 0.016, 'thighL': 0.03, 'thighR': 0.03, 'shinL': 0.03, 'shinR': 0.03,
         'hindPawL': 0.025, 'hindPawR': 0.025, 'forePawL': 0.016, 'forePawR': 0.016, 'earL1': 0.016, 'earR1': 0.016, 'earL2': 0.016, 'earR2': 0.016}


def to_rest(S, b):
    """Abbildung Punkt (Pose) -> Punkt (Ruhelage) für Knochen b aus S[b] = (R, t) mit p_pose = R p_rest + t"""
    if S is None or b not in S: return None
    R, t = S[b]; return lambda P: (P - t) @ R


def moved(f, tf):
    return f if tf is None else (lambda P: f(tf(P)))


# Die Katze besteht aus überlappenden Teilnetzen (wie bei einem Plüschtier): so verformen sich Beine, Schwanz und Kopf beim Laufen sauber,
# ohne dass Haut zwischen auseinanderlaufenden Teilen gezogen wird. Die Nahtstellen liegen unter Halsband, Brustlatz und Fell-AO.
PIECE_BONES = {
    'body': ['pelvis', 'spine1', 'spine2', 'neck'],
    'head': ['head'],
    'earL': ['earL1', 'earL2'], 'earR': ['earR1', 'earR2'],
    'foreL': ['foreUpL', 'foreLowL', 'forePawL'], 'foreR': ['foreUpR', 'foreLowR', 'forePawR'],
    'hindL': ['thighL', 'shinL', 'hindPawL'], 'hindR': ['thighR', 'shinR', 'hindPawR'],
    'tail': [f'tail{i}' for i in range(1, 7)],
}
BONE_PIECE = {b: p for p, bs in PIECE_BONES.items() for b in bs}


def build_fields(S=None):
    """S: optional {Knochen: (R, t)} (Skinning-Matrizen einer Pose): Feld in dieser Pose."""
    parts = build_parts()
    bone_fields = {b: moved(union_min(fs) if b.startswith('tail') else union(fs, 0.004), to_rest(S, b)) for b, fs in parts.items()}
    ear_in = [moved(ears(1)[1], to_rest(S, 'earL1')), moved(ears(-1)[1], to_rest(S, 'earR1'))]
    th = to_rest(S, 'head')
    eye_cut = [moved(sphere(v3(*EYE_C), (EYE_R - 0.15) * CM), th), moved(sphere(v3(-EYE_C[0], EYE_C[1], EYE_C[2]), (EYE_R - 0.15) * CM), th)]
    in_chain = {b: g for g, bs in CHAINS.items() for b in bs}
    groups = {}
    for b in parts: groups.setdefault(in_chain.get(b, b), []).append(b)
    def body(Pt, ears_on=False):
        """alle Teile weich verschmolzen (für Umgebungsverdeckung, Halsband usw.)"""
        v = None
        for g, bs in groups.items():
            if not ears_on and g.startswith('ear'): continue
            fg = bone_fields[bs[0]](Pt)
            for b in bs[1:]: fg = np.minimum(fg, bone_fields[b](Pt))
            v = fg if v is None else smin(v, fg, BLEND.get(g, 0.016))
        return v
    def ground(v, Pt): return smax(v, -Pt[:, 2], 0.004)           # ebene Sohlen
    def piece(name):
        bs = PIECE_BONES[name]
        def f(Pt):
            fs = [bone_fields[b](Pt) for b in bs]
            if name == 'body': v = np.minimum.reduce(fs)
            elif name == 'tail': v = np.minimum.reduce(fs)
            elif name.startswith('fore'): v = smin(np.minimum(fs[0], fs[1]), fs[2], 0.016)
            elif name.startswith('hind'): v = smin(smin(fs[0], fs[1], 0.03), fs[2], 0.025)
            elif name.startswith('ear'):
                inner = ear_in[0] if name == 'earL' else ear_in[1]
                return smax(np.minimum(fs[0], fs[1]), -inner(Pt), 0.003)
            else: v = fs[0]
            if name == 'head':
                for c in eye_cut: v = smax(v, -c(Pt), 0.004)
            return ground(v, Pt) if name != 'head' else v
        return f
    return dict(parts=parts, bone_fields=bone_fields, body=body, piece=piece, ear_inner={1: ear_in[0], -1: ear_in[1]}, groups=groups, head_tf=th)


# ----------------------------------------------------------------------------- Kiefer: abgetrenntes Stück Kinn/Unterlippe
def lip_z(x):
    """Lippenlinie (cm) als Funktion von x (cm): in der Mitte (Philtrum) am höchsten, zu beiden Seiten ein sanfter Bogen nach unten, am Mundwinkel wieder hoch (Miene „ω“)."""
    ax = np.minimum(np.abs(x) / 3.4, 1.0)
    return MOUTH_Z - 0.95 * np.sin(np.pi * ax) + 0.15 * (1 - ax)


def jaw_terms(Pt):
    """die drei Begrenzungen des Kiefers (Meter): oben (Lippenlinie), hinten, seitlich"""
    x, y, z = Pt[:, 0] / CM, Pt[:, 1] / CM, Pt[:, 2] / CM
    a = z - lip_z(x)
    b = y + 5.2
    c = (np.sqrt((x / 3.7) ** 2 + (np.maximum(MOUTH_Z - z, 0) / 4.6) ** 2) - 1.0) * 3.2
    return a * CM, b * CM, c * CM


def jaw_region(Pt):
    """< 0 im Kiefer (Meter)."""
    a, b, c = jaw_terms(Pt)
    return np.maximum(np.maximum(a, b), c)


JAW_HINGE = (0.0, -3.6, 26.0)

# ----------------------------------------------------------------------------- Knochen (Sitzpose): (Name, Eltern, Kopf, Ende) in cm
def bones():
    B = []
    def add(n, par, h, t): B.append((n, par, tuple(h), tuple(t)))
    add('root', None, (0, 3.0, 0.0), (0, 3.0, 4.0))
    add('pelvis', 'root', (0, 6.2, 7.0), (0, 5.2, 11.0))
    add('spine1', 'pelvis', (0, 5.2, 11.0), (0, 3.3, 15.5))
    add('spine2', 'spine1', (0, 3.3, 15.5), (0, 1.4, 19.8))
    add('neck', 'spine2', (0, 1.2, 19.8), (0, -1.4, 25.0))
    add('head', 'neck', (0, -1.4, 25.0), (0, -2.2, 38.0))
    add('jaw', 'head', JAW_HINGE, (0, -10.4, 25.6))
    for s, n in ((1, 'L'), (-1, 'R')):
        add('ear' + n + '1', 'head', (s * EAR_BASE[0], EAR_BASE[1], EAR_BASE[2]), (s * EAR_MID[0], EAR_MID[1], EAR_MID[2]))
        add('ear' + n + '2', 'ear' + n + '1', (s * EAR_MID[0], EAR_MID[1], EAR_MID[2]), (s * EAR_TIP[0], EAR_TIP[1], EAR_TIP[2]))
        add('eye' + n, 'head', (s * EYE_C[0], EYE_C[1], EYE_C[2]), (s * EYE_C[0], EYE_C[1] - 2.0, EYE_C[2]))
        add('lid' + n, 'head', (s * EYE_C[0], EYE_C[1], EYE_C[2]), (s * EYE_C[0], EYE_C[1] - 2.0, EYE_C[2] + 0.001))
    c, r, u = tail_curve(40)
    pt = lambda uu: tuple(np.array([np.interp(uu, u, c[:, k]) for k in range(3)]))
    for i in range(1, 7):
        add(f'tail{i}', 'pelvis' if i == 1 else f'tail{i - 1}', pt((i - 1) / 6), pt(i / 6))
    for s, n in ((1, 'L'), (-1, 'R')):
        add('foreUp' + n, 'spine2', (s * 4.1, 0.8, 18.0), (s * 4.1, -0.2, 10.5))
        add('foreLow' + n, 'foreUp' + n, (s * 4.1, -0.2, 10.5), (s * 4.1, -1.6, 3.8))
        add('forePaw' + n, 'foreLow' + n, (s * 4.1, -1.6, 3.8), (s * 4.1, -7.4, 2.0))
        add('thigh' + n, 'pelvis', (s * 8.0, 7.0, 11.2), (s * 8.4, -2.4, 7.6))
        add('shin' + n, 'thigh' + n, (s * 8.4, -2.4, 7.6), (s * 8.2, 7.2, 3.4))
        add('hindPaw' + n, 'shin' + n, (s * 8.2, 7.2, 3.4), (s * 8.2, -6.0, 2.0))
    return B
