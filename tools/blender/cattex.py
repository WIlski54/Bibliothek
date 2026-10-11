"""Fellfarbe von Archimedes: 3D-Funktion (Tabby, weiße Abzeichen, Gesicht) in der Sitzpose, die per Python in die UV-Karte gebacken wird.
Alle Längen hier in Zentimetern (Eingabe P in Metern, intern * 100)."""
import numpy as np

# ----------------------------------------------------------------------------- Farben (sRGB 0..255)
def hexc(h):
    h = h.lstrip('#'); return np.array([int(h[i:i + 2], 16) for i in (0, 2, 4)], float)

COL = dict(
    base=hexc('#79859b'), baseHi=hexc('#8892a6'), baseLo=hexc('#97a1b4'),
    stripe=hexc('#3a4257'), stripeSoft=hexc('#566075'), dark=hexc('#363d4d'),
    white=hexc('#fbf7ec'), cream=hexc('#f0e8d6'), pink=hexc('#f3a5a9'), pinkDeep=hexc('#e58a92'),
    nose=hexc('#e8808f'), noseDark=hexc('#c25f70'), mouth=hexc('#7a2a3a'), tongue=hexc('#ee7a8a'), line=hexc('#4a2c36'),
    liner=hexc('#2f2f3d'),
)


# ----------------------------------------------------------------------------- Rauschen
def _hash3(i, j, k, seed=0):
    h = (i * 374761393 + j * 668265263 + k * 2147483647 + seed * 1274126177) & 0xFFFFFFFF
    h = ((h ^ (h >> 13)) * 1274126177) & 0xFFFFFFFF
    h = (h ^ (h >> 16)) & 0xFFFFFFFF
    return h / 4294967295.0


def vnoise(P, freq=1.0, seed=0):
    """Wertrauschen 0..1, P in cm"""
    Q = np.asarray(P, float) * freq
    i = np.floor(Q).astype(np.int64); f = Q - i; f = f * f * (3 - 2 * f)
    out = 0
    for dx in (0, 1):
        for dy in (0, 1):
            for dz in (0, 1):
                w = (f[:, 0] if dx else 1 - f[:, 0]) * (f[:, 1] if dy else 1 - f[:, 1]) * (f[:, 2] if dz else 1 - f[:, 2])
                out = out + w * _hash3(i[:, 0] + dx, i[:, 1] + dy, i[:, 2] + dz, seed)
    return out


def fbm(P, freq, octs=3, seed=0):
    a, s, t = 1.0, 0.0, 0.0
    for o in range(octs):
        s += a * vnoise(P, freq * (2 ** o), seed + o); t += a; a *= 0.5
    return s / t


def sstep(a, b, x):
    t = np.clip((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t)


def band(c, period, duty, soft):
    """periodische Streifen: 1 im dunklen Anteil duty (0..1) je Periode, weiche Kante soft (Anteil der Periode)"""
    f = (c / period) % 1.0
    d = np.abs(f - 0.5) * 2          # 0 in der Mitte des Streifens, 1 am Rand der Periode
    return 1 - sstep(duty - soft, duty + soft, d)


def mix(a, b, t): return a + (b - a) * np.asarray(t)[..., None]


# ----------------------------------------------------------------------------- Farbfunktion
def fur_color(P, N, ao, R, tail_u, aux):
    """P (n,3) Meter (Sitzpose), N Normalen, ao 0..1, R: Regionsgewichte dict(head, torso, fore, hind, tail, ear), tail_u 0..1, aux dict.
    Rückgabe sRGB (n,3) 0..255."""
    p = P * 100.0                                    # cm
    x, y, z = p[:, 0], p[:, 1], p[:, 2]
    ax = np.abs(x)
    n = len(p)
    nz = fbm(p, 0.35, 3, 1)                          # große Unregelmäßigkeit
    nf = fbm(p, 1.1, 2, 5)
    wob = (nz - 0.5) * 2.0                           # -1..1

    # --- Grundfarbe: Rücken/Oberseite etwas dunkler, Bauch/Unterseite heller
    shade = np.clip(0.5 + 0.5 * N[:, 2] * 0.6 - 0.2 * N[:, 1], 0, 1)
    col = mix(mix(COL['baseLo'], COL['base'], sstep(0.15, 0.7, shade)), COL['baseHi'], 0.0 * shade)
    col = mix(col, COL['base'], 0.0)

    # --- Tabby-Muster: je Region ein eigener Streifenverlauf
    # Rumpf: Querbänder (in der Sitzpose waagerecht), zum Bauch hin ausklingend; Rückenlinie
    cT = z + 5.0 * (ax / 8.0) ** 2 + wob * 1.3
    bT = band(cT, 3.5, 0.46, 0.20)
    side = sstep(0.0, 0.55, N[:, 1] * 0.8 + 0.3 + np.abs(N[:, 0]) * 0.5)            # eher Rücken/Seiten
    stT = bT * side * sstep(24.0, 20.0, z) * sstep(2.5, 6.0, z)
    spine = (1 - sstep(0.6, 1.6, ax + wob * 0.4)) * sstep(0.2, 0.7, N[:, 1])
    stT = np.maximum(stT, spine * 0.9 * sstep(24.0, 21.0, z))
    # Oberschenkel: Bögen um die Hüfte
    cx = np.sign(x) * 8.5
    rH = np.sqrt((ax - 8.5) ** 2 + (y - 7.5) ** 2 + (z - 10.5) ** 2 * 0.6)
    bH = band(rH + wob * 0.9, 3.0, 0.42, 0.2)
    stH = bH * sstep(2.0, 5.0, ax) * sstep(0.0, 0.5, np.abs(N[:, 0]) * 0.6 + N[:, 1] * 0.5 + 0.2) * sstep(14.0, 11.0, np.hypot(ax - 8.5, y - 7.5) * 0.8 + 0 * z)
    # Vorderbeine: Ringe
    bF = band(z + wob * 0.8, 2.9, 0.40, 0.2)
    stF = bF * sstep(14.0, 10.5, z)
    # Schwanz: Ringe entlang der Kurve, dunkle Spitze
    bTail = band(tail_u * 100.0 / 7.0 + wob * 0.12, 1.0, 0.46, 0.18)
    stTail = np.maximum(bTail * sstep(0.0, 0.1, tail_u), sstep(0.86, 0.96, tail_u))
    # Kopf: Stirnstreifen, Wangenstreifen, Augenlinie
    head = np.zeros(n)
    fore = sstep(30.0, 33.0, z) * sstep(-3.0, -7.0, y * 1.0 + 0)                      # Stirn (vorn, oben)
    st3 = np.maximum(band(x, 4.4, 0.20, 0.10) * 0.0, 0)
    for cxm, wd in ((0.0, 0.75), (2.7, 0.55), (-2.7, 0.55), (5.2, 0.45), (-5.2, 0.45)):
        # Streifen laufen von der Nase nach hinten über den Kopf: Mitte x = cxm * (1 + (y+8)*0.03)
        xm = cxm * (1.0 + (y + 8.0) * 0.04)
        head = np.maximum(head, (1 - sstep(wd * 0.5, wd * 1.1, np.abs(x - xm + wob * 0.25))) * sstep(30.8, 33.3, z))
    head = head * sstep(0.2, 0.7, N[:, 2] + 0.2)                                        # nur Oberseite/Stirn
    # Wangenstreifen: zwei Bögen vom äußeren Augenwinkel nach hinten/unten
    cheek = np.zeros(n)
    for z0, wd in ((28.9, 0.5), (26.7, 0.45)):
        zz = z0 - np.maximum(ax - 8.0, 0) * 0.55 - np.maximum(ax - 5.5, 0) * 0.15
        cheek = np.maximum(cheek, (1 - sstep(wd * 0.5, wd * 1.2, np.abs(z - zz + wob * 0.2))) * sstep(7.8, 9.2, ax) * sstep(1.5, -3.0, y + 0.0))
    # Augenlinie: dunkler Ring um die Augenhöhle und ein Strich nach außen
    ex, ey, ez = 4.9, -7.7, 30.3
    de = np.sqrt((ax - ex) ** 2 + (y - ey) ** 2 * 0.5 + (z - ez) ** 2)
    ring = (1 - sstep(0.12, 0.40, np.abs(de - 2.75))) * sstep(0.0, -0.4, y + 5.0)
    tail_line = (1 - sstep(0.18, 0.5, np.abs(z - (ez - 0.2 - (ax - ex - 2.2) * 0.12)))) * sstep(ex + 2.0, ex + 2.5, ax) * sstep(ex + 7.2, ex + 5.5, ax) * sstep(-3.0, -6.0, y)
    liner = np.maximum(ring, tail_line)

    stripe_amt = (R['torso'] * stT + R['hind'] * np.maximum(stH, stT * 0.5) + R['fore'] * stF + R['tail'] * stTail + R['head'] * np.maximum(head, cheek))
    stripe_amt = np.clip(stripe_amt, 0, 1)
    sc = mix(COL['stripeSoft'], COL['stripe'], 0.5 + 0.5 * nf)
    col = mix(col, sc, stripe_amt * 0.9)
    # Ohren außen: dunkler
    ear = np.clip(R['ear'], 0, 1)
    col = mix(col, COL['dark'], ear * 0.55 * (1 - 0.4 * nf))

    # --- weiße Abzeichen
    # Schnauze/Kinn/Wangenpolster
    dm = np.sqrt(((x) / 4.9) ** 2 + ((y + 9.2) / 5.0) ** 2 + ((z - 27.0) / 3.9) ** 2)
    muzzle = 1 - sstep(0.82 + wob * 0.06, 1.0 + wob * 0.06, dm)
    # Blesse über die Nasenwurzel
    blaze = (1 - sstep(0.5, 1.1, np.abs(x) + wob * 0.15)) * sstep(31.8, 29.5, z) * sstep(-8.0, -9.4, y) * 0.0
    # Brust und Kehle
    db = np.sqrt((x / 5.3) ** 2 + ((y + 3.5) / 7.0) ** 2 + ((z - 15.0) / 10.5) ** 2)
    bib = (1 - sstep(0.80 + wob * 0.07, 0.98 + wob * 0.07, db)) * sstep(0.1, -0.3, N[:, 1] + 0.1)
    # Söckchen
    sockF = R['fore'] * sstep(6.4 + wob * 0.9, 5.4 + wob * 0.9, z) + R['fore'] * 0
    sockH = R['hind'] * sstep(4.6 + wob * 0.7, 3.8 + wob * 0.7, z) * sstep(2.0, 4.0, 100 * 0 + (-y + 12.0)) + R['hind'] * sstep(2.6, 2.2, z)
    # Schwanzunterseite hell? nein. Bauch (unten hell)
    belly = sstep(3.5, 1.0, z) * 0.35 * R['torso']
    white = np.clip(np.maximum.reduce([muzzle * 1.0, blaze, bib, sockF, np.clip(sockH, 0, 1), belly]), 0, 1)
    white = white * (1 - 0.0 * stripe_amt)
    wc = mix(COL['white'], COL['cream'], 0.35 * nf)
    col = mix(col, wc, white * 0.97)
    # Augenlinie über Weiß hinweg
    col = mix(col, COL['liner'], liner * 0.85)

    # --- Ohr innen (Mulde) und Rand
    ei = aux['ear_inner']                                   # 1 in der Mulde
    ecol = mix(COL['pink'], COL['pinkDeep'], 0.5 * nf)
    col = mix(col, ecol, np.clip(ei, 0, 1))

    # --- Nase, Philtrum, Mundlinie, Mundinneres
    dn = np.sqrt((x / 1.45) ** 2 + ((y + 10.9) / 1.2) ** 2 + ((z - 28.7) / 1.05) ** 2)
    nose = 1 - sstep(0.85, 1.0, dn)
    ncol = mix(COL['nose'], COL['noseDark'], 0.5 * sstep(28.4, 27.9, z))
    col = mix(col, ncol, nose)
    ph = (1 - sstep(0.12, 0.34, np.abs(x))) * sstep(28.0, 27.7, z) * sstep(26.9, 27.5, z) * sstep(-9.6, -10.2, y)
    col = mix(col, COL['line'], ph * 0.9)
    lip = aux['lip']                                         # Abstand zur Lippenlinie (cm), 99 sonst
    ml = (1 - sstep(0.12, 0.30, lip)) * sstep(-8.2, -9.6, y)
    col = mix(col, COL['line'], ml * 0.95)
    mi = np.clip(aux['mouth_in'], 0, 1)
    col = mix(col, COL['mouth'], mi)
    tg = np.clip(aux['tongue'], 0, 1)
    col = mix(col, COL['tongue'], tg * mi)

    # --- feines Fell: leichte Streuung, dann Verschattung durch Umgebungsverdeckung
    fine = (fbm(p, 3.0, 2, 11) - 0.5) * 0.10
    col = col * (1 + fine[:, None])
    occ = (0.58 + 0.42 * np.clip(ao, 0, 1))[:, None]
    col = col * occ
    return np.clip(col, 0, 255)


# ----------------------------------------------------------------------------- Rastern
def rasterize(uv, size):
    """uv: (m,3,2) in 0..1 (v nach oben). Liefert Dreiecks-Nr. (-1 leer) und baryzentrische Koordinaten je Bildpunkt (Zeile 0 = oben)."""
    tid = -np.ones((size, size), np.int32); bary = np.zeros((size, size, 3), np.float32)
    px = uv[:, :, 0] * size; py = (1 - uv[:, :, 1]) * size
    for i in range(len(uv)):
        xs, ys = px[i], py[i]
        x0, x1 = int(np.floor(xs.min() - 0.5)), int(np.ceil(xs.max() - 0.5)); y0, y1 = int(np.floor(ys.min() - 0.5)), int(np.ceil(ys.max() - 0.5))
        x0 = max(x0, 0); y0 = max(y0, 0); x1 = min(x1, size - 1); y1 = min(y1, size - 1)
        if x1 < x0 or y1 < y0: continue
        gx, gy = np.meshgrid(np.arange(x0, x1 + 1) + 0.5, np.arange(y0, y1 + 1) + 0.5)
        d = (ys[1] - ys[2]) * (xs[0] - xs[2]) + (xs[2] - xs[1]) * (ys[0] - ys[2])
        if abs(d) < 1e-12: continue
        l0 = ((ys[1] - ys[2]) * (gx - xs[2]) + (xs[2] - xs[1]) * (gy - ys[2])) / d
        l1 = ((ys[2] - ys[0]) * (gx - xs[2]) + (xs[0] - xs[2]) * (gy - ys[2])) / d
        l2 = 1 - l0 - l1
        m = (l0 >= -1e-4) & (l1 >= -1e-4) & (l2 >= -1e-4)
        if not m.any(): continue
        rr, cc = np.nonzero(m)
        tid[y0 + rr, x0 + cc] = i
        bary[y0 + rr, x0 + cc] = np.stack([l0[m], l1[m], l2[m]], 1)
    return tid, bary


def dilate(img, mask, iters=6):
    """Farben über den Rand der Inseln hinaus fortsetzen (gegen Nähte beim Mip-Mapping)."""
    img = img.copy(); mask = mask.copy()
    for _ in range(iters):
        acc = np.zeros_like(img); cnt = np.zeros(mask.shape, np.float32)
        for dy in (-1, 0, 1):
            for dx in (-1, 0, 1):
                if dx == 0 and dy == 0: continue
                m = np.roll(np.roll(mask, dy, 0), dx, 1); c = np.roll(np.roll(img, dy, 0), dx, 1)
                acc += c * m[..., None]; cnt += m
        new = (~mask) & (cnt > 0)
        img[new] = acc[new] / cnt[new][:, None]; mask = mask | new
    return img, mask
