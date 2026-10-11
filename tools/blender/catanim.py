"""Animationsclips von Archimedes. Jeder Clip ist eine Funktion u in [0,1] -> Pose; die Posen werden Bild für Bild in Aktionen gesetzt.
Konventionen: Winkel in Grad, Drehungen um die Achsen des Skeletts (x quer, y nach hinten, z oben) im Rahmen des Elternknochens.
Positives rx: Oberseite eines senkrechten Knochens nach vorn (Kopf nickt, Wirbelsäule beugt sich nach vorn, nach unten zeigende Beine schwingen nach hinten)."""
import numpy as np
import catshape as C
import catplanar as PL
import catgait as G
from sdfmesh import rotmat

FPS = 30
I3 = np.eye(3)
BONES = {n: (par, np.array(h, float), np.array(t, float)) for n, par, h, t in C.bones()}
TAU = 2 * np.pi
sin = np.sin; cos = np.cos


def E(rx=0, ry=0, rz=0): return rotmat(rx, ry, rz)


def clamp01(x): return float(np.clip(x, 0, 1))
def smooth(x): x = clamp01(x); return x * x * (3 - 2 * x)
def seg(u, a, b): return smooth((u - a) / (b - a))
def pulse(u, a, b, c, d):
    """steigt zwischen a..b auf 1, bleibt bis c, fällt bis d"""
    return seg(u, a, b) * (1 - seg(u, c, d))
def lerp(a, b, t): return a + (b - a) * t


class Pose:
    def __init__(self):
        self.m = {}; self.loc = {}; self.sc = {}

    def r(self, bone, rx=0, ry=0, rz=0):
        self.m[bone] = E(rx, ry, rz) @ self.m.get(bone, I3); return self

    def rm(self, bone, M):
        self.m[bone] = M @ self.m.get(bone, I3); return self

    def l(self, bone, x=0, y=0, z=0):
        o = self.loc.get(bone, (0, 0, 0)); self.loc[bone] = (o[0] + x, o[1] + y, o[2] + z); return self

    def s(self, bone, sx=1, sy=1, sz=1):
        self.sc[bone] = (sx, sy, sz); return self

    def merge(self, other):
        for b, M in other.m.items(): self.rm(b, M)
        for b, v in other.loc.items(): self.l(b, *v)
        for b, v in other.sc.items(): self.sc[b] = v
        return self

    def apply(self, rig):
        rig.reset()
        for b, M in self.m.items(): rig.set(b, mat=M)
        for b, v in self.loc.items(): rig.set(b, loc=v)
        for b, v in self.sc.items(): rig.set(b, scale=v)

    def bones(self): return set(self.m) | set(self.loc) | set(self.sc)


# ----------------------------------------------------------------------------- Hilfen
LID_OPEN = 0.0
LID_REST = 0.2            # leicht gesenkte Oberlider: schlau, ein wenig von oben herab
def lids(p, k):
    """Lidschluss k in 0..1 (0 = weit offen, 1 = geschlossen)"""
    for s in 'LR':
        p.r('lid' + s, 150.0 * k, 0, 0)
        if k > 0.2:                                     # beim Schließen sinken Augapfel und Lid ein wenig in die Höhle
            d = 0.014 * smooth((k - 0.2) / 0.8)
            p.l('lid' + s, 0, d, 0); p.l('eye' + s, 0, d, 0)
    return p


def rest_dir3(n):
    par, h, t = BONES[n]; v = t - h; return v / np.linalg.norm(v)


def rot_between(a, b):
    a = a / np.linalg.norm(a); b = b / np.linalg.norm(b)
    v = np.cross(a, b); c = float(a @ b)
    if c < -0.999999:
        ax = np.cross(a, np.array([1.0, 0, 0]))
        if np.linalg.norm(ax) < 1e-6: ax = np.cross(a, np.array([0, 1.0, 0]))
        ax /= np.linalg.norm(ax)
        K = np.array([[0, -ax[2], ax[1]], [ax[2], 0, -ax[0]], [-ax[1], ax[0], 0]]); return I3 + 2 * K @ K
    K = np.array([[0, -v[2], v[1]], [v[2], 0, -v[0]], [-v[1], v[0], 0]])
    return I3 + K + K @ K / (1 + c)


def aim_chain(p, names, dirs, parent_cum=I3):
    """Knochenkette so drehen, dass Knochen i in Richtung dirs[i] zeigt (kürzester Bogen aus der Ruhelage)"""
    cum_prev = parent_cum
    for n, d in zip(names, dirs):
        Rc = rot_between(rest_dir3(n), np.asarray(d, float))
        p.rm(n, np.linalg.inv(cum_prev) @ Rc)
        cum_prev = Rc
    return p


def dir_yp(yaw, pitch):
    """Richtung aus Gierwinkel (0 = nach hinten +y, positiv zur +x-Seite) und Nickwinkel (positiv = nach oben), Grad"""
    y, pt = np.radians(yaw), np.radians(pitch)
    return np.array([sin(y) * cos(pt), cos(y) * cos(pt), sin(pt)])


TAIL = [f'tail{i}' for i in range(1, 7)]
# Rest-Gierwinkel der Schwanzknochen (Kringel um den Körper)
def tail_rest_yaw():
    out = []
    for n in TAIL:
        d = rest_dir3(n); out.append(np.degrees(np.arctan2(d[0], d[1])))
    return out


def set_tail_wag(p, amp, t, speed=1.0, phase=0.0):
    """kleines Wedeln des Kringel-Schwanzes um die Hochachse (Drehung um z: Achse bleibt senkrecht)"""
    for i, n in enumerate(TAIL):
        k = (i + 1) / 6.0
        p.r(n, 0, 0, amp * k * 1.2 * sin(TAU * (t * speed) - i * 0.6 + phase))
    return p


# ----------------------------------------------------------------------------- Sitzen
def sit_base(t, calm_ear=True, breath=1.0, tail_amp=3.5):
    """Grundhaltung Sitzen mit Atmen, leichtem Schwanzspiel und Kopfpendeln. t: 0..1 über 3,2 s"""
    p = Pose()
    b = sin(TAU * 2 * t)
    p.r('spine1', -0.6 * b * breath); p.r('spine2', 0.9 * b * breath)
    p.r('neck', -0.4 * b * breath, 0, 0); p.r('head', 0.3 * b * breath + 1.0 * sin(TAU * t + 0.5), 0.8 * sin(TAU * t), 1.4 * sin(TAU * t))
    p.l('pelvis', 0, 0, 0.0005 * b)
    set_tail_wag(p, tail_amp, t, 1, 0.0)
    for i, n in enumerate(TAIL[3:]):
        p.r(n, 3.0 * sin(TAU * t - i * 0.8 + 1.0), 0, 0)
    # Ohren: ein kurzes Zucken links bei 0.55
    f = pulse(t, 0.50, 0.55, 0.56, 0.64) * sin(TAU * 12 * (t - 0.5)) if 0.5 < t < 0.64 else 0.0
    p.r('earL1', 6.0 * f, 0, 10 * f); p.r('earL2', 8 * f, 0, 0)
    p.r('earR1', 0, 0, -2.0 * sin(TAU * t + 1))
    lids(p, LID_REST)
    return p


def clip_sit_idle(u): return sit_base(u)
def clip_sit_calm(u):
    """Ruhiger Modus: nur Atmen"""
    p = Pose(); b = sin(TAU * 2 * u)
    p.r('spine1', -0.6 * b); p.r('spine2', 0.9 * b); p.r('neck', -0.4 * b); p.r('head', 0.3 * b)
    lids(p, LID_REST); return p


def clip_blink(u):
    p = Pose()
    k = LID_REST + (1 - LID_REST) * (pulse(u, 0.0, 0.32, 0.42, 0.95))
    lids(p, k); return p


# ----------------------------------------------------------------------------- Gangarten
def gait_pose(name, u):
    g = G.GAITS[name]
    rot, loc, info = G.pose_at(name, u)
    p = Pose()
    for b, v in rot.items():
        if b.startswith('tail'): continue
        p.r(b, v[0], 0, 0)
    z = loc['root'][2]; p.l('root', 0, 0, z)
    bound = g.get('bound', False)
    # Rumpf: leichtes Verwinden und Wiegen
    p.r('spine1', 0, 0, 2.2 * sin(TAU * u) * (1 if not bound else 0.2)); p.r('pelvis', 0, 0, -2.4 * sin(TAU * u) * (1 if not bound else 0.2))
    p.r('spine2', 0, 1.6 * sin(TAU * 2 * u + 0.3) * (1 if not bound else 0.0), 0.0)
    p.r('head', 0, 0, 2.5 * sin(TAU * u + 0.4) * (1 if not bound else 0.0))
    # Schwanz
    pitch = {'walk': [20, 34, 46, 54, 56, 52], 'trot': [14, 22, 30, 34, 34, 30], 'run': [6, 8, 10, 10, 8, 4]}[name]
    wav = {'walk': 7, 'trot': 8, 'run': 7}[name]
    sp = 2 if bound else 1
    dirs = [dir_yp(wav * sin(TAU * sp * u - i * 0.9) * (0.4 + i / 5.0), pitch[i]) for i in range(6)]
    ang = info['ang']; cum = E(ang['pelvis'], 0, 0)
    aim_chain(p, TAIL, dirs, cum)
    # Ohren: leicht nach hinten beim Rennen
    ear = {'walk': 0, 'trot': 8, 'run': 22}[name]
    for s, sg in (('L', 1), ('R', -1)):
        p.r('ear' + s + '1', ear * 0.6 + 3 * sin(TAU * 2 * u + (0 if s == 'L' else 1.5)), 0, 0); p.r('ear' + s + '2', ear * 0.4, 0, 0)
    lids(p, LID_REST if name != 'run' else 0.04)
    return p


def clip_walk(u): return gait_pose('walk', u)
def clip_trot(u): return gait_pose('trot', u)
def clip_run(u): return gait_pose('run', u)


def stand_pose(gait='walk', rz=None):
    """Neutrale Standhaltung (alle Pfoten flach am Boden) für die Formkorrektur und als Basis für Sprünge."""
    g = G.GAITS[gait]
    a_p, a_s1, a_s2 = g['torso']
    ang = {'pelvis': a_p, 'spine1': a_s1, 'spine2': a_s2, 'neck': g['neck'], 'head': g['head']}
    rz = g['rz'] if rz is None else rz
    M, H, T = PL.fk(ang, {'root': (0, rz)})
    p = Pose()
    for b, v in ang.items(): p.r(b, v)
    p.l('root', 0, 0, rz / 100.0)
    for side in 'LR':
        for kind, (up, lo, ft, bend) in {'fore': ('foreUp', 'foreLow', 'forePaw', +1), 'hind': ('thigh', 'shin', 'hindPaw', -1)}.items():
            u_, l_, f_ = up + side, lo + side, ft + side
            tgt = np.array([g['fy'] if kind == 'fore' else g['hy'], PL.SPEC[f_][1][2]])
            lu, ll, lf, _ = PL.solve_leg(M, H[u_], u_, l_, f_, tgt, bend=bend, foot_abs=0.0)
            p.r(u_, G.wrap(lu)); p.r(l_, G.wrap(ll)); p.r(f_, G.wrap(lf))
    dirs = [dir_yp(0, pt) for pt in (24, 38, 48, 54, 56, 52)]
    aim_chain(p, TAIL, dirs, E(ang['pelvis'], 0, 0))
    lids(p, LID_REST)
    return p


# ----------------------------------------------------------------------------- Überblenden von Posen
def mat_to_quat(M):
    m = M; t = m[0, 0] + m[1, 1] + m[2, 2]
    if t > 0:
        s = np.sqrt(t + 1.0) * 2; q = np.array([0.25 * s, (m[2, 1] - m[1, 2]) / s, (m[0, 2] - m[2, 0]) / s, (m[1, 0] - m[0, 1]) / s])
    elif m[0, 0] > m[1, 1] and m[0, 0] > m[2, 2]:
        s = np.sqrt(1.0 + m[0, 0] - m[1, 1] - m[2, 2]) * 2; q = np.array([(m[2, 1] - m[1, 2]) / s, 0.25 * s, (m[0, 1] + m[1, 0]) / s, (m[0, 2] + m[2, 0]) / s])
    elif m[1, 1] > m[2, 2]:
        s = np.sqrt(1.0 + m[1, 1] - m[0, 0] - m[2, 2]) * 2; q = np.array([(m[0, 2] - m[2, 0]) / s, (m[0, 1] + m[1, 0]) / s, 0.25 * s, (m[1, 2] + m[2, 1]) / s])
    else:
        s = np.sqrt(1.0 + m[2, 2] - m[0, 0] - m[1, 1]) * 2; q = np.array([(m[1, 0] - m[0, 1]) / s, (m[0, 2] + m[2, 0]) / s, (m[1, 2] + m[2, 1]) / s, 0.25 * s])
    return q / np.linalg.norm(q)


def quat_to_mat(q):
    w, x, y, z = q
    return np.array([[1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w)], [2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w)], [2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y)]])


def slerp(q0, q1, t):
    d = float(q0 @ q1)
    if d < 0: q1 = -q1; d = -d
    if d > 0.9995:
        q = q0 + t * (q1 - q0); return q / np.linalg.norm(q)
    th = np.arccos(d); return (np.sin((1 - t) * th) * q0 + np.sin(t * th) * q1) / np.sin(th)


def blend(a, b, w):
    """Posen mischen: Drehungen per Slerp, Verschiebung/Skalierung linear"""
    p = Pose()
    for n in set(a.m) | set(b.m):
        qa = mat_to_quat(a.m.get(n, I3)); qb = mat_to_quat(b.m.get(n, I3))
        p.m[n] = quat_to_mat(slerp(qa, qb, w))
    for n in set(a.loc) | set(b.loc):
        la = np.array(a.loc.get(n, (0, 0, 0))); lb = np.array(b.loc.get(n, (0, 0, 0))); p.loc[n] = tuple(la + (lb - la) * w)
    for n in set(a.sc) | set(b.sc):
        sa = np.array(a.sc.get(n, (1, 1, 1))); sb = np.array(b.sc.get(n, (1, 1, 1))); p.sc[n] = tuple(sa + (sb - sa) * w)
    return p


def seq(keys, u, ease=smooth):
    """keys: [(u, Pose), ...] aufsteigend; zwischen den Schlüsseln weich überblenden"""
    if u <= keys[0][0]: return keys[0][1]
    if u >= keys[-1][0]: return keys[-1][1]
    for (u0, p0), (u1, p1) in zip(keys, keys[1:]):
        if u0 <= u <= u1: return blend(p0, p1, ease((u - u0) / (u1 - u0)))
    return keys[-1][1]


def add_pose(a, b):
    """b zusätzlich auf a legen (Drehungen multipliziert)"""
    p = Pose(); p.m = dict(a.m); p.loc = dict(a.loc); p.sc = dict(a.sc)
    return p.merge(b)


def sit_rest():
    p = Pose(); lids(p, LID_REST); return p


# ----------------------------------------------------------------------------- Sprechen, Miauen, Erschrecken
def clip_talk(u):
    p = sit_rest()
    open_ = 0.5 + 0.5 * sin(TAU * 3 * u); amp = 0.65 + 0.35 * sin(TAU * 2 * u + 1.0)
    p.r('jaw', 17.0 * open_ * amp, 0, 0)
    p.r('head', 1.2 * sin(TAU * 3 * u + 0.5) - 1.0, 1.0 * sin(TAU * u), 1.8 * sin(TAU * u + 1.0))
    p.r('neck', 0.8 * sin(TAU * 3 * u), 0, 0)
    b = sin(TAU * u); p.r('spine2', 0.8 * b); p.r('spine1', -0.5 * b)
    p.r('earL1', 0, 0, 3 * sin(TAU * u + 2)); p.r('earR1', 0, 0, -3 * sin(TAU * u))
    set_tail_wag(p, 3.0, u, 1)
    return p


def clip_meow(u):
    p = sit_rest()
    env = pulse(u, 0.10, 0.30, 0.62, 0.90)
    jaw = pulse(u, 0.16, 0.34, 0.60, 0.82)
    p.r('jaw', 30.0 * jaw, 0, 0)
    p.r('neck', -9.0 * env, 0, 0); p.r('head', -13.0 * env - 3 * sin(TAU * 3 * u) * jaw, 0, 0)
    p.r('spine2', -3.0 * env, 0, 0); p.r('spine1', 1.5 * env, 0, 0); p.r('pelvis', 0, 0, 0)
    for s, sg in (('L', 1), ('R', -1)): p.r('ear' + s + '1', -12 * env, 0, sg * -8 * env)
    for n in TAIL[2:]: p.r(n, 0, 0, 14 * sin(TAU * 1.5 * u) * env)
    lids(p, LID_REST + (0.42 - LID_REST) * env)
    return p


def clip_scared(u):
    """Schreck: Hüpfer nach hinten, Buckel, Ohren flach, Augen weit, Schwanz gesträubt; entspannt sich nach etwa einer Sekunde"""
    base = sit_rest()
    k = pulse(u, 0.0, 0.10, 0.45, 1.0)          # Schreck-Stärke
    hop = np.sin(np.clip(u / 0.28, 0, 1) * np.pi)
    p = Pose(); lids(p, LID_REST * (1 - min(1, k * 1.5)))
    p.l('root', 0, 0.012 * k, 0.030 * hop)
    p.r('pelvis', -6 * k); p.r('spine1', 8 * k); p.r('spine2', 12 * k)      # Buckel
    p.r('neck', -14 * k); p.r('head', -8 * k)
    for s, sg in (('L', 1), ('R', -1)):
        p.r('ear' + s + '1', -38 * k, 0, sg * -16 * k); p.r('ear' + s + '2', -10 * k)
        p.r('foreUp' + s, 6 * k); p.r('eye' + s)
        p.s('eye' + s, 1 + 0.10 * k, 1 + 0.10 * k, 1 + 0.10 * k)
    p.s('tail1', 1 + 0.5 * k, 1, 1 + 0.5 * k)
    set_tail_wag(p, 10 * k, u, 4)
    p.r('jaw', 8 * pulse(u, 0.05, 0.12, 0.4, 0.6))
    return p


# ----------------------------------------------------------------------------- Putzen
def paw_to_face(k):
    """rechte Vorderpfote an die Wange (k = 0..1)"""
    p = Pose()
    p.r('foreUpR', -122 * k, 0, 0)            # Oberarm nach vorn-oben
    p.r('foreUpR', 0, 0, 10 * k)               # leicht nach außen/innen
    p.r('foreLowR', 62 * k, 0, 0)              # Ellbogen beugen: Unterarm zurück zum Gesicht
    p.r('forePawR', 10 * k, 0, 0)
    return p


def clip_groom(u):
    """0..0.14 Pfote hoch, bis 0.86 putzen (5 Striche), danach zurück"""
    on = pulse(u, 0.0, 0.16, 0.84, 1.0)
    p = sit_rest()
    stroke = sin(TAU * 4.5 * (u - 0.14)) * on
    p.merge(paw_to_face(on))
    p.r('foreLowR', 14 * stroke, 0, 0); p.r('forePawR', -10 * stroke, 0, 0); p.r('foreUpR', 4 * stroke, 0, 0)
    p.r('head', 0, -12 * on, -8 * on); p.r('neck', 2 * on)
    for s, sg in (('L', 1), ('R', -1)): p.r('ear' + s + '1', -4 * on * (1 if s == 'R' else 0.5), 0, 0)
    lids(p, LID_REST + (0.92 - LID_REST) * pulse(u, 0.04, 0.2, 0.82, 0.96))
    p.r('jaw', 3 * on * (0.5 + 0.5 * sin(TAU * 4.5 * (u - 0.14))))
    set_tail_wag(p, 3.0, 1.0 * u, 1)
    b = sin(TAU * 3 * u); p.r('spine2', 0.6 * b)
    return p


# ----------------------------------------------------------------------------- Schlafen (eingerollt) und Aufwachen
SLEEP = dict(torso=(26, 30, 26), neck=(-46, 0, 0), head=(-22, -30, -15), arm=(-52, 38, 18))


def sleep_pose():
    """Zusammengerollt wie ein Brötchen: Körper liegt, Kopf ruht auf den Vorderpfoten, Schwanz bleibt um den Körper gelegt"""
    p = Pose()
    p.r('pelvis', SLEEP['torso'][0]); p.r('spine1', SLEEP['torso'][1]); p.r('spine2', SLEEP['torso'][2])
    p.r('neck', *SLEEP['neck']); p.r('head', *SLEEP['head'])
    p.l('root', 0, 0, 0.0)
    for s, sg in (('L', 1), ('R', -1)):
        p.r('foreUp' + s, SLEEP['arm'][0], 0, sg * -8); p.r('foreLow' + s, SLEEP['arm'][1], 0, 0); p.r('forePaw' + s, SLEEP['arm'][2], 0, 0)
        p.r('ear' + s + '1', 14, 0, sg * 12); p.r('ear' + s + '2', 6, 0, 0)
    lids(p, 1.0)
    return p


def clip_sleep_idle(u):
    p = sleep_pose()
    b = sin(TAU * u)
    p.r('spine1', 1.0 * b); p.r('spine2', -1.4 * b); p.r('head', 1.0 * b)
    p.l('root', 0, 0, 0.0012 * b)
    for i, n in enumerate(TAIL[3:]): p.r(n, 0, 0, 2.0 * sin(TAU * u - i * 0.9))
    f = pulse(u, 0.62, 0.66, 0.67, 0.72)
    p.r('earL1', -5 * f, 0, 6 * f)
    return p


def clip_wake(u):
    """aufwachen: Augen weit, Kopf hoch, aufsetzen"""
    a = sleep_pose(); c = Pose(); lids(c, 0.0)
    c.r('spine2', -4); c.r('neck', -8); c.r('head', -10)
    for s, sg in (('L', 1), ('R', -1)): c.r('ear' + s + '1', -6, 0, sg * -4)
    sit = sit_rest(); lids(sit, LID_REST)
    mid = Pose(); mid.merge(blend(sit_rest(), a, 0.4)); lids(mid, 0.0)
    keys = [(0.0, a), (0.28, mid), (0.52, c), (0.82, sit_rest()), (1.0, sit_rest())]
    return seq(keys, u)


# ----------------------------------------------------------------------------- Haltungen mit IK (Stehen, Hocke, Sprung, Verbeugung)
def ik_pose(ang, rz, fore, hind, forepaw=0.0, hindpaw=0.0, ry=0.0, tail=(24, 38, 48, 54, 56, 52), foreR=None, hindR=None, forepawR=None, hindpawR=None):
    """ang: Rumpfwinkel {pelvis, spine1, spine2, neck, head}; rz: Höhe der Wurzel (cm); fore/hind: Zielpunkt (y, z in cm) des Handgelenks/Sprunggelenks"""
    M, H, T = PL.fk(ang, {'root': (0, rz)})
    p = Pose()
    for b, v in ang.items(): p.r(b, v)
    p.l('root', 0, 0, rz / 100.0)
    tg = {'L': (fore, hind, forepaw, hindpaw), 'R': (foreR or fore, hindR or hind, forepawR if forepawR is not None else forepaw, hindpawR if hindpawR is not None else hindpaw)}
    for side in 'LR':
        fo, hi, fpaw, hpaw = tg[side]
        for kind, (up, lo, ft, bend), tgt, pw in (('fore', ('foreUp', 'foreLow', 'forePaw', +1), fo, fpaw), ('hind', ('thigh', 'shin', 'hindPaw', -1), hi, hpaw)):
            u_, l_, f_ = up + side, lo + side, ft + side
            lu, ll, lf, _ = PL.solve_leg(M, H[u_], u_, l_, f_, np.array(tgt, float), bend=bend, foot_abs=pw)
            p.r(u_, G.wrap(lu)); p.r(l_, G.wrap(ll)); p.r(f_, G.wrap(lf))
    if tail:
        aim_chain(p, TAIL, [dir_yp(0, pt) for pt in tail], E(ang['pelvis'], 0, 0))
    return p


def A_(p, s1, s2, n, h): return {'pelvis': p, 'spine1': s1, 'spine2': s2, 'neck': n, 'head': h}


def pose_stand(): return ik_pose(A_(18, 20, 18, -34, -26), 7.5, (-3, 3.8), (7.5, 3.4))


def with_lids(p, k=LID_REST): lids(p, k); return p


def clip_jump_up(u):
    st = with_lids(pose_stand())
    crouch = with_lids(ik_pose(A_(28, 28, 22, -44, -32), 3.2, (-4, 3.8), (4, 3.4), tail=(14, 22, 30, 36, 40, 40)))
    air = with_lids(ik_pose(A_(4, 8, 10, -20, -12), 11.0, (-17, 20), (15, 8.5), forepaw=-10, hindpaw=25, tail=(0, 4, 8, 12, 14, 12)), 0.05)
    reach = with_lids(ik_pose(A_(10, 12, 14, -26, -16), 10.0, (-12, 9), (11, 8), forepaw=-5, hindpaw=20, tail=(14, 22, 28, 32, 32, 30)), 0.08)
    keys = [(0.0, st), (0.26, crouch), (0.50, air), (0.76, reach), (1.0, st)]
    return seq(keys, u)


def clip_jump_down(u):
    st = with_lids(pose_stand())
    lean = with_lids(ik_pose(A_(24, 26, 26, -40, -30), 6.5, (-8, 3.8), (9, 3.4), tail=(30, 40, 46, 50, 52, 48)))
    air = with_lids(ik_pose(A_(30, 32, 30, -48, -34), 10.0, (-15, 11), (13, 14), forepaw=10, hindpaw=15, tail=(10, 14, 18, 22, 22, 20)), 0.04)
    land = with_lids(ik_pose(A_(26, 26, 22, -44, -32), 3.5, (-5, 3.8), (5, 3.4), tail=(18, 26, 34, 40, 42, 40)))
    keys = [(0.0, st), (0.26, lean), (0.52, air), (0.78, land), (1.0, st)]
    return seq(keys, u)


def clip_stretch(u):
    sit = sit_rest()
    bow = with_lids(ik_pose(A_(46, 34, 26, -62, -46), 8.0, (-14, 3.8), (7.0, 3.4), tail=(40, 55, 62, 60, 56, 50)), 0.5)
    p = seq([(0.0, sit), (0.32, bow), (0.68, bow), (1.0, sit)], u)
    y = pulse(u, 0.38, 0.46, 0.56, 0.64)
    q = Pose().merge(p)
    q.r('jaw', 22 * y); q.r('tail3', 0, 0, 6 * sin(TAU * 2 * u) * pulse(u, 0.3, 0.4, 0.62, 0.7))
    return q


# ----------------------------------------------------------------------------- Clip-Tabelle und Aktionen
# (Name, Funktion, Dauer in Sekunden, Schleife)
CLIPS = [
    ('sit_idle', clip_sit_idle, 3.2, True),
    ('sit_calm', clip_sit_calm, 3.2, True),
    ('blink', clip_blink, 0.4, False),
    ('groom', clip_groom, 3.6, False),
    ('meow', clip_meow, 1.2, False),
    ('scared', clip_scared, 1.1, False),
    ('talk', clip_talk, 1.2, True),
    ('walk', clip_walk, G.GAITS['walk']['T'], True),
    ('trot', clip_trot, G.GAITS['trot']['T'], True),
    ('run', clip_run, G.GAITS['run']['T'], True),
    ('jump_up', clip_jump_up, 0.9, False),
    ('jump_down', clip_jump_down, 0.8, False),
    ('stretch', clip_stretch, 2.0, False),
    ('sleep_idle', clip_sleep_idle, 4.0, True),
    ('wake', clip_wake, 1.0, False),
]


def stride_info():
    """Strecke (m) je Zyklus der Laufzyklen: Pfoten rutschen beim Aufsetzen nicht, wenn die Abspielrate = Tempo / Strecke * Dauer ist"""
    out = {}
    for n in ('walk', 'trot', 'run'):
        g = G.GAITS[n]; out[n] = dict(stride=round(g['stride'] / g['duty'] / 100.0, 4), T=round(g['T'], 4))
    return out


def pose_equal(M, N, eps=1e-5): return np.abs(M - N).max() < eps


def build_actions(rig, arm, only=None):
    """Aktionen für alle Clips anlegen und als NLA-Spuren ablegen (so exportiert sie der glTF-Exporter als benannte Animationen)"""
    import bpy
    arm.animation_data_create()
    for name, fn, dur, loop in CLIPS:
        if only and name not in only: continue
        n = max(2, int(round(dur * FPS)))
        poses = [fn(i / n) for i in range(n + 1)]
        if loop: assert pose_close(poses[0], poses[-1]), f'Schleife {name} schließt nicht'
        used = set()
        for p in poses: used |= p.bones()
        used = sorted(used, key=lambda b: [x[0] for x in C.bones()].index(b))
        act = bpy.data.actions.new(name); arm.animation_data.action = act
        for i, p in enumerate(poses):
            p.apply(rig); rig.key(i, used)
        act.use_fake_user = True
        for fc in act_fcurves(act):
            for kp in fc.keyframe_points: kp.interpolation = 'LINEAR'
        tr = arm.animation_data.nla_tracks.new(); tr.name = name
        st = tr.strips.new(name, 0, act); st.name = name
        arm.animation_data.action = None
        print(f'[archimedes] Clip {name}: {n} Bilder, {len(used)} Knochen, Schleife={loop}', flush=True)
    rig.reset()


def pose_close(a, b, eps=1e-4):
    for n in set(a.m) | set(b.m):
        if np.abs(a.m.get(n, I3) - b.m.get(n, I3)).max() > eps: return False
    for n in set(a.loc) | set(b.loc):
        if np.abs(np.array(a.loc.get(n, (0, 0, 0))) - np.array(b.loc.get(n, (0, 0, 0)))).max() > 1e-6: return False
    return True


def act_fcurves(act):
    """F-Kurven einer Aktion (Blender 4.x: act.fcurves, ab 5.0: Ebenen/Streifen/Kanalgruppen)"""
    if hasattr(act, 'fcurves') and act.fcurves is not None:
        try: return list(act.fcurves)
        except Exception: pass
    out = []
    for layer in getattr(act, 'layers', []):
        for strip in layer.strips:
            for slot in act.slots:
                try: out += list(strip.channelbag(slot).fcurves)
                except Exception: pass
    return out
