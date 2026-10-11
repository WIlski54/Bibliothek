"""Ebene Vorwärtskinematik (y-z-Ebene) des Skeletts und Zwei-Gelenk-IK für die Beine, nur numpy.
Alle Winkel in Grad um die x-Achse (positiv: Oberseite nach vorn, Vorwärtsvektor nach unten), Längen in cm. Wird für Laufzyklen genutzt,
damit die Pfoten am Boden bleiben."""
import numpy as np
import catshape as C

SPEC = {n: (par, np.array(h, float), np.array(t, float)) for n, par, h, t in C.bones()}
ORDER = [n for n, *_ in C.bones()]


def rot2(a):
    a = np.radians(a); c, s = np.cos(a), np.sin(a)
    return np.array([[c, -s], [s, c]])


def tr(v):
    m = np.eye(3); m[:2, 2] = v; return m


def rm(a):
    m = np.eye(3); m[:2, :2] = rot2(a); return m


def fk(angles, loc=None):
    """angles: {Knochen: Grad (lokal)}, loc: {Knochen: (dy, dz) in cm}. -> {Knochen: (M 3x3)}, Kopf-/Endpunkte (y,z)"""
    loc = loc or {}
    M = {}; H = {}; T = {}
    for n in ORDER:
        par, h, t = SPEC[n]
        hy = np.array([h[1], h[2]]); ty = np.array([t[1], t[2]])
        base = M[par] if par else np.eye(3)
        L = tr(loc.get(n, (0, 0)))
        Mb = base @ L @ tr(hy) @ rm(angles.get(n, 0.0)) @ tr(-hy)
        M[n] = Mb
        H[n] = (Mb @ np.array([hy[0], hy[1], 1.0]))[:2]; T[n] = (Mb @ np.array([ty[0], ty[1], 1.0]))[:2]
    return M, H, T


def cum_angle(M):
    """Gesamtdrehung (Grad) einer Matrix"""
    return np.degrees(np.arctan2(M[1, 0], M[0, 0]))


def direction(vec): return np.degrees(np.arctan2(vec[1], vec[0]))


def rest_dir(n):
    par, h, t = SPEC[n]; v = np.array([t[1] - h[1], t[2] - h[2]]); return direction(v), np.linalg.norm(v)


def solve_leg(M, hip, upper, lower, foot, target, hock_target=None, bend=1.0, foot_abs=None):
    """Bein = Oberschenkel (upper), Unterschenkel (lower), Pfote (foot). hip: Gelenkposition (y,z) im Raum.
    Es wird das Gelenk zwischen lower und foot (Sprunggelenk/Handgelenk) auf `target` gesetzt (Zwei-Gelenk-IK),
    `bend` = +1/-1 wählt die Knickrichtung des mittleren Gelenks. foot_abs: absolute Drehung der Pfote (Grad, relativ zur Ruhelage) oder None.
    Rückgabe lokale Winkel (Grad) für upper, lower, foot, abhängig vom Eltern-Matrixeintrag M[parent(upper)]."""
    par_u = SPEC[upper][0]
    A_par = cum_angle(M[par_u]) if par_u else 0.0
    d_u, L1 = rest_dir(upper); d_l, L2 = rest_dir(lower); d_f, _ = rest_dir(foot)
    v = np.array(target) - np.array(hip); D = np.linalg.norm(v)
    D = np.clip(D, abs(L1 - L2) + 1e-3, L1 + L2 - 1e-3)
    # Winkel im Dreieck
    cos_a = (L1 * L1 + D * D - L2 * L2) / (2 * L1 * D)
    a = np.degrees(np.arccos(np.clip(cos_a, -1, 1)))
    base = direction(v)
    abs_upper_dir = base + bend * a                       # absolute Richtung des Oberschenkels
    knee = np.array(hip) + L1 * np.array([np.cos(np.radians(abs_upper_dir)), np.sin(np.radians(abs_upper_dir))])
    w = np.array(target) - knee
    abs_lower_dir = direction(w)
    # lokale Winkel: absolute Drehung = abs_dir - rest_dir (Gesamtdrehung der Knochen)
    tot_u = abs_upper_dir - d_u; tot_l = abs_lower_dir - d_l
    loc_u = tot_u - A_par; loc_l = tot_l - tot_u
    tot_f = (foot_abs if foot_abs is not None else 0.0)
    loc_f = tot_f - tot_l
    return loc_u, loc_l, loc_f, knee
