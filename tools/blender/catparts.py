"""Einzelteile als reine Netze (numpy): Augäpfel, Lider, Halsband, Marke, Schnurrhaare. Maße in Metern."""
import numpy as np
import catshape as C

CM = 0.01


def _grid_tris(nu, nv, wrap_u=True):
    """Dreiecke für ein (nu x nv)-Punktgitter, Punkt (i,j) = i*nv + j"""
    T = []
    for i in range(nu if wrap_u else nu - 1):
        i2 = (i + 1) % nu
        for j in range(nv - 1):
            a, b, c, d = i * nv + j, i2 * nv + j, i2 * nv + j + 1, i * nv + j + 1
            T += [[a, b, c], [a, c, d]]
    return np.array(T, int)


def rot_x(a):
    c, s = np.cos(a), np.sin(a); return np.array([[1, 0, 0], [0, c, -s], [0, s, c]])


def eyeball(center, R, nseg=18, nring=11):
    """Kugel, Pol (Pupille) nach -y. UV azimutal: Mitte der Textur = Pol, Rand = 100 Grad."""
    th = np.linspace(0, np.pi, nring); ph = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    V, UV, N = [], [], []
    for t in th:
        for p in ph:
            d = np.array([np.sin(t) * np.cos(p), -np.cos(t), np.sin(t) * np.sin(p)])
            V.append(np.asarray(center) + R * d); N.append(d)
            r = min(t / np.radians(100.0), 1.0) * 0.5
            UV.append([0.5 + r * np.cos(p), 0.5 + r * np.sin(p)])
    V, N, UV = np.array(V), np.array(N), np.array(UV)
    T = []
    for i in range(nring - 1):
        for j in range(nseg):
            j2 = (j + 1) % nseg
            a, b, c, d = i * nseg + j, i * nseg + j2, (i + 1) * nseg + j2, (i + 1) * nseg + j
            if i == 0: T.append([a, c, d])
            elif i == nring - 2: T.append([a, b, d])
            else: T += [[a, c, d], [a, b, c]]
    T = np.array(T, int)
    return V, T, N, UV


def lid_shell(center, R, nseg=16, nring=7, a_open=-150.0):
    """Oberlid als Halbkugelschale (Pol nach vorn = geschlossen), Rand bei 92 Grad. Rückgabe: Eckpunkte in Offenstellung, Schließstellung (für die Farbe), Normalen, Rand-Wert 0..1"""
    th = np.linspace(0, np.radians(94), nring); ph = np.linspace(0, 2 * np.pi, nseg, endpoint=False)
    Vc, Nc, rim = [], [], []
    for t in th:
        for p in ph:
            d = np.array([np.sin(t) * np.cos(p), -np.cos(t), np.sin(t) * np.sin(p)])
            Vc.append(np.asarray(center) + R * d); Nc.append(d); rim.append(t / np.radians(94))
    Vc, Nc, rim = np.array(Vc), np.array(Nc), np.array(rim)
    Ro = rot_x(np.radians(a_open))
    Vo = (Vc - center) @ Ro.T + center; No = Nc @ Ro.T
    T = []
    for i in range(nring - 1):
        for j in range(nseg):
            j2 = (j + 1) % nseg
            a, b, c, d = i * nseg + j, i * nseg + j2, (i + 1) * nseg + j2, (i + 1) * nseg + j
            if i == 0: T.append([a, c, d])
            else: T += [[a, c, d], [a, b, c]]
    return Vo, np.array(T, int), No, Vc, rim


def tube(path, radii, sides=3, cap=True):
    """Rohr entlang einer Polylinie mit Radien, Querschnitt n-Eck. -> V, T, N"""
    path = np.asarray(path, float); n = len(path)
    V, N = [], []
    tang = np.gradient(path, axis=0); tang /= np.linalg.norm(tang, axis=1)[:, None]
    ref = np.array([0, 0, 1.0]);
    for i in range(n):
        t = tang[i]; a = np.cross(t, ref)
        if np.linalg.norm(a) < 1e-6: a = np.cross(t, np.array([1.0, 0, 0]))
        a /= np.linalg.norm(a); b = np.cross(t, a)
        for k in range(sides):
            ang = 2 * np.pi * k / sides; d = np.cos(ang) * a + np.sin(ang) * b
            V.append(path[i] + radii[i] * d); N.append(d)
    V, N = np.array(V), np.array(N)
    T = []
    for i in range(n - 1):
        for k in range(sides):
            k2 = (k + 1) % sides
            a, b, c, d = i * sides + k, i * sides + k2, (i + 1) * sides + k2, (i + 1) * sides + k
            T += [[a, b, c], [a, c, d]]
    if cap:
        for end, idx in ((0, 0), (1, n - 1)):
            ci = len(V); V = np.vstack([V, path[idx]]); N = np.vstack([N, tang[idx] * (-1 if end == 0 else 1)])
            for k in range(sides):
                k2 = (k + 1) % sides
                a, b = idx * sides + k, idx * sides + k2
                T.append([ci, b, a] if end == 0 else [ci, a, b])
    return V, np.array(T, int), N


def whiskers(F, side_sign=1):
    """4 Schnurrhaare je Seite: Wurzel auf dem Schnurrhaarpolster, schwach nach unten gebogen."""
    out = []
    specs = [(27.9, 0.30, 8.8, 8), (27.0, 0.0, 9.6, 0), (26.2, -0.30, 9.0, -9), (25.5, -0.55, 7.6, -17)]   # z, steigung, Länge, Winkel nach hinten
    for z0, rise, L, ang in specs:
        # Wurzel: auf der Polsteroberfläche (Suchstrahl von innen nach vorn/außen)
        s = side_sign
        o = np.array([s * 2.4, -7.2, z0]) * CM; d = np.array([s * 0.55, -1.0, 0.0]); d /= np.linalg.norm(d)
        lo, hi = 0.0, 0.08
        for _ in range(30):
            mid = (lo + hi) / 2
            if F['body'](np.array([o + d * mid]), False)[0] < 0: lo = mid
            else: hi = mid
        root = o + d * lo - d * 0.002
        t = np.linspace(0, 1, 6)
        a = np.radians(ang)
        dirv = np.array([s * np.cos(a), -0.12 - 0.5 * np.sin(abs(a)) * 0 + 0.0, 0.0]) ; dirv = np.array([s * np.cos(a) * 1.0, np.sin(a) * 0.9 * -1.0 * -1.0, rise * 0.25]); dirv /= np.linalg.norm(dirv)
        pts = []
        for ti in t:
            p = root + dirv * (L * CM * ti)
            p[2] -= 0.5 * CM * (L * ti / 6.0) ** 2 * 6.0       # Durchhang
            pts.append(p)
        rad = (0.17 * (1 - t) + 0.05) * CM * 1.3
        V, T, N = tube(np.array(pts), rad, sides=3, cap=False)
        out.append((V, T, N))
    return out


def collar(F, tilt_axis=(0.0, -2.2, 5.2), s=0.30, half_h=0.95, thick=0.52, nseg=28, nprof=8):
    """Halsband: abgeflachter Torus, der sich der Halsoberfläche anschmiegt. -> V, T, N, Mitte vorn (für die Marke)"""
    a0 = np.array([0.0, 0.8, 19.8]) * CM; ax = np.array(tilt_axis, float); ax /= np.linalg.norm(ax)
    c = a0 + ax * (s * 5.65 * CM)                    # Mitte auf der Halsachse
    u = np.array([1.0, 0, 0]); w = np.cross(ax, u); w /= np.linalg.norm(w)          # Ebene senkrecht zur Achse: u (quer), w (nach hinten/oben)
    if w[1] < 0: w = -w
    V, N = [], []
    front = None
    for i in range(nseg):
        th = 2 * np.pi * i / nseg
        d = np.cos(th) * u + np.sin(th) * w
        lo, hi = 0.0, 0.12
        for _ in range(30):
            mid = (lo + hi) / 2
            if F['body'](np.array([c + d * mid]), False)[0] < 0: lo = mid
            else: hi = mid
        rc = lo + 0.0015 + thick * 0.5 * CM
        cen = c + d * rc
        if i == (nseg * 3) // 4: front = (cen.copy(), d.copy())
        for j in range(nprof):
            ph = 2 * np.pi * j / nprof
            off = np.cos(ph) * d * thick * 0.5 * CM + np.sin(ph) * ax * half_h * CM
            V.append(cen + off)
            n = np.cos(ph) * d / (thick * 0.5) + np.sin(ph) * ax / half_h; N.append(n / np.linalg.norm(n))
    V, N = np.array(V), np.array(N)
    T = []
    for i in range(nseg):
        i2 = (i + 1) % nseg
        for j in range(nprof):
            j2 = (j + 1) % nprof
            a, b, cc, dd = i * nprof + j, i2 * nprof + j, i2 * nprof + j2, i * nprof + j2
            T += [[a, b, cc], [a, cc, dd]]
    return V, np.array(T, int), N, front, ax


def tag(front, ax, R=1.3, thick=0.34, nseg=18):
    """Messingmarke: Scheibe, hängt vorn unter dem Halsband."""
    cen, d = front
    down = -np.array([0, 0, 1.0]); fw = np.array([0, -1.0, 0])
    c = cen + d * 0.002 + down * (R + 0.55) * CM + fw * 0.2 * CM
    # Scheibe liegt in der Ebene senkrecht zu n (zeigt nach vorn, leicht nach oben geneigt)
    n = np.array([0, -1.0, 0.18]); n /= np.linalg.norm(n)
    a = np.cross(n, np.array([0, 0, 1.0])); a /= np.linalg.norm(a); b = np.cross(n, a)
    V, N = [], []
    for side in (1, -1):
        for k in range(nseg):
            ang = 2 * np.pi * k / nseg
            rim = np.cos(ang) * a + np.sin(ang) * b
            V.append(c + side * n * thick * 0.5 * CM + rim * R * CM * (0.94 if True else 1)); N.append(side * n * 0.85 + rim * 0.15)
        V.append(c + side * n * thick * 0.5 * CM); N.append(side * n)
    V, N = np.array(V), np.array(N); N /= np.linalg.norm(N, axis=1)[:, None]
    T = []
    m = nseg + 1
    for side, off in ((1, 0), (-1, m)):
        for k in range(nseg):
            k2 = (k + 1) % nseg
            T.append([off + nseg, off + k, off + k2] if side == 1 else [off + nseg, off + k2, off + k])
    for k in range(nseg):                                  # Rand
        k2 = (k + 1) % nseg
        T += [[k, m + k, m + k2], [k, m + k2, k2]]
    return V, np.array(T, int), N


def fix_winding(V, T, N):
    """Dreiecke so drehen, dass die Flächennormale zu den Eckpunkt-Normalen passt (Vorderseite = außen)."""
    V = np.asarray(V); T = np.array(T)
    fn = np.cross(V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]])
    vn = np.asarray(N)[T].sum(1)
    flip = (fn * vn).sum(1) < 0
    T[flip] = T[flip][:, ::-1]
    return T
