"""SDF-Werkzeuge für die Katze: Distanzfelder (numpy), Oberflächennetze (Surface Nets), Glättung.
Reines numpy, kein bpy. Koordinaten: Meter, z nach oben, die Katze blickt nach -y."""
import numpy as np

# ---------------------------------------------------------------- Distanzfelder
def _n(a): return np.linalg.norm(a, axis=-1)

def rotmat(rx=0, ry=0, rz=0):
    """Drehmatrix aus Winkeln in Grad (erst x, dann y, dann z)."""
    rx, ry, rz = np.radians([rx, ry, rz])
    cx, sx, cy, sy, cz, sz = np.cos(rx), np.sin(rx), np.cos(ry), np.sin(ry), np.cos(rz), np.sin(rz)
    X = np.array([[1, 0, 0], [0, cx, -sx], [0, sx, cx]]); Y = np.array([[cy, 0, sy], [0, 1, 0], [-sy, 0, cy]]); Z = np.array([[cz, -sz, 0], [sz, cz, 0], [0, 0, 1]])
    return Z @ Y @ X

def ellipsoid(c, r, rot=(0, 0, 0)):
    c = np.asarray(c, float); r = np.asarray(r, float); R = rotmat(*rot)
    def f(P):
        q = (P - c) @ R          # lokale Koordinaten (R^T angewandt auf Zeilenvektoren)
        k0 = _n(q / r); k1 = _n(q / (r * r))
        return np.where(k1 > 1e-12, k0 * (k0 - 1.0) / np.maximum(k1, 1e-12), -min(r))
    return f

def roundcone(a, b, r1, r2):
    a = np.asarray(a, float); b = np.asarray(b, float)
    ba = b - a; l2 = ba @ ba; rr = r1 - r2; a2 = l2 - rr * rr; il2 = 1.0 / l2
    def f(P):
        pa = P - a; y = pa @ ba; z = y - l2
        w = pa * l2 - np.outer(y, ba); x2 = (w * w).sum(-1); y2 = y * y * l2; z2 = z * z * l2
        k = np.sign(rr) * rr * rr * x2
        cap_b = np.sqrt(x2 + z2) * il2 - r2
        cap_a = np.sqrt(x2 + y2) * il2 - r1
        mid = (np.sqrt(np.maximum(x2 * a2 * il2, 0)) + y * rr) * il2 - r1
        return np.where(np.sign(z) * a2 * z2 > k, cap_b, np.where(np.sign(y) * a2 * y2 < k, cap_a, mid))
    return f

def flat_cone(a, b, r1, r2, normal, squash):
    """Abgeflachter Rundkegel (Ohr): Dicke senkrecht zu `normal` um den Faktor `squash` gestaucht."""
    a = np.asarray(a, float); b = np.asarray(b, float); nrm = np.asarray(normal, float); nrm = nrm / np.linalg.norm(nrm)
    inner = roundcone(a, b, r1, r2)
    def f(P):
        d = (P - a) @ nrm
        Q = P + np.outer(d * (squash - 1.0), nrm)
        return inner(Q) / squash
    return f

def box(c, h, rot=(0, 0, 0), rad=0.0):
    c = np.asarray(c, float); h = np.asarray(h, float); R = rotmat(*rot)
    def f(P):
        q = np.abs((P - c) @ R) - (h - rad)
        return _n(np.maximum(q, 0)) + np.minimum(q.max(-1), 0) - rad
    return f

def sphere(c, r):
    c = np.asarray(c, float)
    return lambda P: _n(P - c) - r

def smin(a, b, k):
    if k <= 0: return np.minimum(a, b)
    h = np.maximum(k - np.abs(a - b), 0.0) / k
    return np.minimum(a, b) - h * h * k * 0.25

def smax(a, b, k): return -smin(-a, -b, k)

def smooth_union(fs, k):
    def f(P):
        v = fs[0](P)
        for g in fs[1:]: v = smin(v, g(P), k)
        return v
    return f

# ---------------------------------------------------------------- Netz aus dem Feld (Surface Nets)
def surface_nets(F, origin, h):
    """F: Feld (nx,ny,nz) an Gitterpunkten. Liefert Eckpunkte (Zellmitten-Schwerpunkte der Kantenschnitte) und Vierecke (Außen = F>0)."""
    nx, ny, nz = F.shape
    s = (F < 0)
    cs = np.zeros((nx - 1, ny - 1, nz - 1), np.uint8); allin = np.ones_like(cs, bool); anyin = np.zeros_like(cs, bool)
    corners = [(0, 0, 0), (1, 0, 0), (0, 1, 0), (1, 1, 0), (0, 0, 1), (1, 0, 1), (0, 1, 1), (1, 1, 1)]
    for dx, dy, dz in corners:
        sl = s[dx:nx - 1 + dx, dy:ny - 1 + dy, dz:nz - 1 + dz]
        allin &= sl; anyin |= sl
    mixed = anyin & ~allin
    idx = np.full(mixed.shape, -1, np.int64); ci = np.argwhere(mixed); idx[mixed] = np.arange(len(ci))
    # Eckpunkt = Mittel der Kantenschnitte
    edges = [(0, 1), (2, 3), (4, 5), (6, 7), (0, 2), (1, 3), (4, 6), (5, 7), (0, 4), (1, 5), (2, 6), (3, 7)]
    acc = np.zeros((len(ci), 3)); cnt = np.zeros(len(ci))
    def val(c): dx, dy, dz = corners[c]; return F[ci[:, 0] + dx, ci[:, 1] + dy, ci[:, 2] + dz]
    for a, b in edges:
        va, vb = val(a), val(b); m = (va < 0) != (vb < 0)
        t = np.where(m, va / np.where(m, va - vb, 1.0), 0.0)
        pa = np.array(corners[a], float); pb = np.array(corners[b], float)
        pt = pa[None, :] + t[:, None] * (pb - pa)[None, :]
        acc += np.where(m[:, None], pt, 0.0); cnt += m
    V = (ci + acc / np.maximum(cnt, 1)[:, None]) * h + origin
    quads = []
    def add(axis):
        # Kanten entlang `axis` zwischen Punkt p und p+e; Vorzeichenwechsel -> Viereck aus den 4 Zellen um die Kante
        sl0 = [slice(None)] * 3; sl1 = [slice(None)] * 3
        sl0[axis] = slice(0, F.shape[axis] - 1); sl1[axis] = slice(1, F.shape[axis])
        a = s[tuple(sl0)]; b = s[tuple(sl1)]
        m = a != b
        # nur innere Kanten (Zellen ringsum vorhanden)
        pts = np.argwhere(m)
        u, v = [(1, 2), (2, 0), (0, 1)][axis]
        ok = (pts[:, u] >= 1) & (pts[:, v] >= 1) & (pts[:, u] < F.shape[u]) & (pts[:, v] < F.shape[v])
        for ax_i in range(3):
            if ax_i != axis: ok &= pts[:, ax_i] < F.shape[ax_i] - 1
        pts = pts[ok]
        if not len(pts): return
        inside_first = a[tuple(pts.T)]
        def cell(du, dv):
            q = pts.copy(); q[:, u] += du; q[:, v] += dv; return idx[tuple(q.T)]
        c00, c10, c11, c01 = cell(-1, -1), cell(0, -1), cell(0, 0), cell(-1, 0)
        quad = np.stack([c00, c10, c11, c01], 1)
        # Orientierung: Normale zeigt von innen nach außen
        flip = ~inside_first
        quad = np.where(flip[:, None], quad[:, ::-1], quad)
        quads.append(quad)
    for ax in range(3): add(ax)
    Q = np.concatenate(quads, 0) if quads else np.zeros((0, 4), np.int64)
    Q = Q[(Q >= 0).all(1)]
    return V, Q

def quads_to_tris(Q):
    return np.concatenate([Q[:, [0, 1, 2]], Q[:, [0, 2, 3]]], 0)

def components(n, T):
    """Zusammenhangskomponenten (Union-Find, vektorisiert über Kanten)."""
    parent = np.arange(n)
    def find_all():
        while True:
            pp = parent[parent]
            if (pp == parent).all(): return parent
            parent[:] = pp
    for _ in range(64):
        for a, b in ((0, 1), (1, 2), (2, 0)):
            ra, rb = parent[T[:, a]], parent[T[:, b]]
            m = ra != rb
            if not m.any(): continue
            lo = np.minimum(ra[m], rb[m]); hi = np.maximum(ra[m], rb[m])
            np.minimum.at(parent, hi, lo)
        find_all()
        done = True
        for a, b in ((0, 1), (1, 2)):
            if (parent[T[:, a]] != parent[T[:, b]]).any(): done = False
        if done: break
    return parent

def vertex_normals(V, T):
    fn = np.cross(V[T[:, 1]] - V[T[:, 0]], V[T[:, 2]] - V[T[:, 0]])
    N = np.zeros_like(V)
    for i in range(3): np.add.at(N, T[:, i], fn)
    return N / np.maximum(_n(N), 1e-12)[:, None]

def grad(f, P, e=0.0015):
    g = np.zeros_like(P)
    for i in range(3):
        d = np.zeros(3); d[i] = e
        g[:, i] = (f(P + d) - f(P - d)) / (2 * e)
    return g

def project(f, V, iters=3):
    """Eckpunkte auf die Nullfläche des Feldes schieben."""
    V = V.copy()
    for _ in range(iters):
        v = f(V); g = grad(f, V); gg = np.maximum((g * g).sum(-1), 1e-9)
        V -= (v / gg)[:, None] * g
    return V

def laplacian(V, T, iters=1, lam=0.5):
    n = len(V)
    for _ in range(iters):
        acc = np.zeros_like(V); cnt = np.zeros(n)
        for a, b in ((0, 1), (1, 2), (2, 0)):
            np.add.at(acc, T[:, a], V[T[:, b]]); np.add.at(cnt, T[:, a], 1)
            np.add.at(acc, T[:, b], V[T[:, a]]); np.add.at(cnt, T[:, b], 1)
        V = V + lam * (acc / np.maximum(cnt, 1)[:, None] - V)
    return V

def blur3(F, n=1):
    for _ in range(n):
        for ax in range(3):
            P = np.pad(F, [(1, 1) if i == ax else (0, 0) for i in range(3)], mode='edge')
            sl = lambda a, b: tuple(slice(a, b) if i == ax else slice(None) for i in range(3))
            F = (P[sl(0, -2)] + 2 * P[sl(1, -1)] + P[sl(2, None)]) * 0.25
    return F


def extract(f, lo, hi, h, chunk=24, blur=0):
    """Feld f auf dem Gitter [lo,hi] mit Schrittweite h auswerten und das Netz holen."""
    lo = np.asarray(lo, float); hi = np.asarray(hi, float)
    n = np.ceil((hi - lo) / h).astype(int) + 1
    xs = lo[0] + np.arange(n[0]) * h; ys = lo[1] + np.arange(n[1]) * h; zs = lo[2] + np.arange(n[2]) * h
    F = np.empty(tuple(n), np.float32)
    for i0 in range(0, n[0], chunk):
        X, Y, Z = np.meshgrid(xs[i0:i0 + chunk], ys, zs, indexing='ij')
        P = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1)
        F[i0:i0 + chunk] = f(P).reshape(X.shape)
    if blur: F = blur3(F, blur)
    V, Q = surface_nets(F, lo, h)
    return V, Q, F
