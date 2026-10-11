"""Laufzyklen (Schritt, Trab, Galopp) per ebener IK: Pfoten bleiben beim Aufsetzen am Boden. Nur numpy.
Das Ergebnis je Phase: Winkel (Grad um x) für alle Wirbelsäulen-/Bein-/Schwanzknochen und die Wurzelverschiebung (cm)."""
import numpy as np
import catplanar as P


def wrap(a): return (a + 180.0) % 360.0 - 180.0


def smooth(t): t = np.clip(t, 0, 1); return t * t * (3 - 2 * t)


# Parameter je Gangart
GAITS = {
    'walk': dict(T=1.0, duty=0.66, stride=16.0, lift=3.4, offs=dict(hindL=0.0, foreL=0.25, hindR=0.5, foreR=0.75),
                 rz=7.5, torso=(18, 20, 18), neck=-34, head=-26, fy=-3.0, hy=7.5, bob=0.35, tail=0.2, spine_wave=2.0),
    'trot': dict(T=0.5667, duty=0.52, stride=22.0, lift=4.6, offs=dict(foreL=0.0, hindR=0.0, foreR=0.5, hindL=0.5),
                 rz=8.5, torso=(20, 22, 20), neck=-38, head=-28, fy=-3.0, hy=7.5, bob=0.8, tail=0.3, spine_wave=2.0),
    'run': dict(T=0.4667, duty=0.34, stride=30.0, lift=6.5, offs=dict(foreL=0.0, foreR=0.06, hindL=0.45, hindR=0.5),
                rz=7.0, torso=(24, 24, 22), neck=-40, head=-34, fy=-3.0, hy=6.0, bob=2.6, tail=0.5, spine_wave=9.0, bound=True),
}


def foot_target(u, duty, yc, S, lift, z0, p=1.0):
    """Position (y, z) und Pfotendrehung (Grad, + = Zehen nach unten) einer Pfote bei Phase u in [0,1)"""
    u = u % 1.0
    if u < duty:
        s = u / duty
        y = yc + S / 2 * (1 - 2 * s); z = z0
        rot = -10 * smooth(1 - s * 8) + 18 * smooth((s - 0.75) * 4)
    else:
        s = (u - duty) / (1 - duty)
        e = smooth(s) * 0.5 + 0.5 * s
        y = yc - S / 2 + S * e; z = z0 + lift * np.sin(np.pi * s) ** 1.2
        rot = 32 * np.sin(np.pi * min(s * 1.2, 1.0)) - 12 * smooth((s - 0.7) / 0.3)
    return np.array([y, z]), rot


def pose_at(name, ph):
    """-> (rot: {Knochen: (rx, ry, rz)}, loc: {Knochen: (x, y, z) in Metern}) bei Phase ph in [0,1)"""
    g = GAITS[name]
    TAU = 2 * np.pi
    bob = g['bob']
    bound = g.get('bound', False)
    # Körperhöhe: zweimal pro Zyklus (Schritt/Trab) bzw. einmal (Galopp)
    if bound:
        rz = g['rz'] + bob * (0.5 + 0.5 * np.sin(TAU * (ph + 0.15)))
        pitch = 7.0 * np.sin(TAU * (ph + 0.25))
        wave = g['spine_wave'] * np.sin(TAU * (ph + 0.1))
    else:
        rz = g['rz'] + bob * 0.5 * (1 - np.cos(TAU * 2 * ph + 0.4)) * 0.5 - bob * 0.25
        pitch = 1.2 * np.sin(TAU * 2 * ph + 0.3) * (1 if name == 'trot' else 0.6)
        wave = g['spine_wave'] * np.sin(TAU * ph)
    a_p, a_s1, a_s2 = g['torso']
    ang = {'pelvis': a_p + pitch * 0.5 - wave * 0.5, 'spine1': a_s1 + wave * 0.6, 'spine2': a_s2 + pitch * 0.3 + wave * 0.5,
           'neck': g['neck'] - pitch * 0.6 - wave * 0.4, 'head': g['head'] + pitch * 0.3 + (0.4 * wave if bound else 0)}
    loc = {'root': (0.0, rz)}
    M, H, T = P.fk(ang, loc)
    out = {}
    z_foot = {'fore': P.SPEC['forePawL'][1][2], 'hind': P.SPEC['hindPawL'][1][2]}     # Gelenkhöhe bei flacher Pfote (cm)
    for side in ('L', 'R'):
        for kind, (up, lo, ft, bend, key) in {'fore': ('foreUp', 'foreLow', 'forePaw', +1, 'fore'), 'hind': ('thigh', 'shin', 'hindPaw', -1, 'hind')}.items():
            u_ = up + side; l_ = lo + side; f_ = ft + side
            hip = H[u_]
            yc = g['fy'] if kind == 'fore' else g['hy']
            S = g['stride'] if kind == 'fore' else g['stride'] * (1.0 if not bound else 1.15)
            phase = ph + g['offs'][kind + side]
            tgt, rot = foot_target(phase, g['duty'], yc, S, g['lift'], z_foot[kind] + 0.0, 1.0)
            if kind == 'hind':
                # hinteres Sprunggelenk: Pfote flach, Gelenkhöhe wie vorn
                pass
            lu, ll, lf, knee = P.solve_leg(M, hip, u_, l_, f_, tgt, bend=bend, foot_abs=rot)
            out[u_] = wrap(lu); out[l_] = wrap(ll); out[f_] = wrap(lf)
    # Schwanz: erhoben, S-Welle
    ta = g['tail']
    tw = np.sin(TAU * (ph * (1 if not bound else 2)))
    rot = {k: (v, 0, 0) for k, v in {**ang, **out}.items()}
    for i in range(1, 7):
        rot[f'tail{i}'] = (-ta * 14 * (1.0 if i < 3 else 0.5) + 6 * np.sin(TAU * ph + i * 0.7) * ta, 0, 10 * tw * ta * (i / 3.0))
    return rot, {'root': (0, 0, rz / 100.0)}, dict(ang=ang, M=M, H=H, T=T)
