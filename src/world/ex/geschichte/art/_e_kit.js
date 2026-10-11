// Gruppe E (Pflanzen, Felsen, Requisiten): gemeinsamer Baukasten.
// Geometrie-Helfer (Blatt, Wedel, Wollkontur, Fels, Wellen), Malhilfen in Modellkoordinaten und `finish()` (Skalierung via opts.h,
// Zentrierung bei x=0, Basis bei y=0, meta/anchors). Alles Meter, y nach oben.
import { blob, limb, poly, xf, spline } from '../../../../art/dsl.js';
import { mulberry32, TAU } from '../../../../lib/util.js';

export { blob, limb, poly, xf, spline, TAU };

// ---- Zufall / Varianten -----------------------------------------------------------------------
export function rngOf(seed = 1, salt = 0) {
  return mulberry32((Math.imul((seed | 0) + 17, 2654435761) ^ Math.imul(salt + 1, 40503)) >>> 0);
}
/** Variante 0..n-1 aus opts.variant oder opts.seed (seed 1,2,3 -> 0,1,2). */
export function variantOf(opts, n) {
  if (opts.variant != null) return ((opts.variant % n) + n) % n;
  const s = opts.seed ?? 1;
  return (((s - 1) % n) + n) % n;
}

// ---- Farben ---------------------------------------------------------------------------------------
const hex2rgb = (c) => [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)];
const rgb2hex = (r) => '#' + r.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
export function mix(a, b, t) {
  const A = hex2rgb(a), B = hex2rgb(b);
  return rgb2hex(A.map((v, i) => v + (B[i] - v) * t));
}
/** f>0 heller (Richtung Creme), f<0 dunkler (Richtung warmes Dunkelbraun). */
export function shade(c, f) { return f >= 0 ? mix(c, '#fff4d6', f) : mix(c, '#2a1a0e', -f); }

// ---- Geometrie ---------------------------------------------------------------------------------
/** Spitzes Blatt ab (x,y) in Richtung a, Länge L, Breite W; curve = seitlicher Bogen, fat = Lage der größten Breite (0..1). */
export function leaf(x, y, a, L, W, { curve = 0, fat = 0.45, baseW = 0, n = 7 } = {}) {
  const e = Math.log(0.5) / Math.log(fat);
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const left = [], right = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const w = (W / 2) * (Math.sin(Math.PI * Math.pow(t, e)) + baseW * (1 - t) * (1 - t));
    const off = curve * L * t * t;
    const px = x + dx * L * t + nx * off, py = y + dy * L * t + ny * off;
    left.push([px + nx * w, py + ny * w]); right.push([px - nx * w, py - ny * w]);
  }
  return left.concat(right.reverse());
}

/** Mittellinie mit stetig wachsender Krümmung: [[x,y,winkel,s],...] */
export function centerline(x, y, a, L, bend = 0, { n = 22, p = 1.5 } = {}) {
  const pts = []; let px = x, py = y; const ds = L / n;
  for (let i = 0; i <= n; i++) {
    const s = i / n, ang = a + bend * Math.pow(s, p);
    pts.push([px, py, ang, s]);
    px += Math.cos(ang) * ds; py += Math.sin(ang) * ds;
  }
  return pts;
}
export function along(cl, s) {
  const f = Math.max(0, Math.min(1, s)) * (cl.length - 1), i = Math.min(cl.length - 2, Math.floor(f)), u = f - i;
  const A = cl[i], B = cl[i + 1];
  return [A[0] + (B[0] - A[0]) * u, A[1] + (B[1] - A[1]) * u, A[2] + (B[2] - A[2]) * u];
}
/** Strang entlang einer Mittellinie, Breite w0 -> w1. */
export function strand(cl, w0, w1, { every = 3, per = 3 } = {}) {
  const ctrl = [];
  for (let i = 0; i < cl.length; i += every) ctrl.push([cl[i][0], cl[i][1], w0 + (w1 - w0) * (i / (cl.length - 1))]);
  const last = cl[cl.length - 1];
  if (ctrl[ctrl.length - 1][0] !== last[0] || ctrl[ctrl.length - 1][1] !== last[1]) ctrl.push([last[0], last[1], w1]);
  return limb(ctrl, { per });
}

/**
 * Wedel: gebogene Spindel mit Fiederblättchen (beidseitig, wechselständig).
 * Rückgabe { rachis, leaflets:[polys], all:[polys], cl }.
 */
export function frond(x, y, a, L, o = {}) {
  const {
    bend = 0, p = 1.5, pairs = 8, leafL = L * 0.3, leafW = leafL * 0.32, spread = 1.05, start = 0.12, end = 0.93,
    rachisW = L * 0.035, curve = 0.12, fat = 0.45, shrink = 0.7, tipLeaf = true, baseW = 0, droop = 0, rng = null, sizeJit = 0,
  } = o;
  const cl = centerline(x, y, a, L, bend, { p });
  const leaflets = [], veins = [];
  const step = (end - start) / Math.max(1, pairs - 1);
  for (let k = 0; k < pairs; k++) {
    const s0 = start + step * k;
    for (const side of [1, -1]) {
      const s = Math.min(0.97, s0 + (side < 0 ? step * 0.5 : 0));
      const [px, py, ang] = along(cl, s);
      const j = rng && sizeJit ? 1 + (rng() - 0.5) * sizeJit : 1;
      const sz = (1 - shrink * Math.pow(s, 1.25)) * j;
      // droop: Fiedern fallen der Schwerkraft folgend nach unten (Winkel zur Senkrechten -> verkleinert)
      let la = ang + side * spread;
      if (droop) { const down = -Math.PI / 2; let d = la - down; d = Math.atan2(Math.sin(d), Math.cos(d)); la -= d * droop; }
      leaflets.push(leaf(px, py, la, leafL * sz, leafW * sz, { curve: -side * curve, fat, baseW }));
      veins.push([px, py, px + Math.cos(la) * leafL * sz * 0.78, py + Math.sin(la) * leafL * sz * 0.78]);
    }
  }
  if (tipLeaf) {
    const [px, py, ang] = along(cl, 0.99);
    const sz = 1 - shrink * 0.97;
    leaflets.push(leaf(px, py, ang, leafL * (sz + 0.2), leafW * (sz + 0.25), { fat, curve: 0 }));
  }
  const rachis = strand(cl, rachisW, rachisW * 0.25);
  return { rachis, leaflets, all: [rachis, ...leaflets], cl, veins };
}

/** Farnwedel-Spirale (Krümmling): Stiel + eingerollte Spitze. */
export function crozier(x, y, a, L, r, w) {
  const pts = [];
  const stalk = centerline(x, y, a, L, 0.4, { n: 8, p: 1 });
  for (const s of stalk) pts.push([s[0], s[1], w]);
  const end = stalk[stalk.length - 1];
  let ang = end[2], px = end[0], py = end[1];
  const N = 22, turns = 1.15;
  for (let i = 1; i <= N; i++) {
    const t = i / N;
    const rr = r * (1 - 0.82 * t);
    const da = (turns * TAU) / N * (1.0 + 0.6 * t);
    ang -= da; // nach rechts einrollen
    px += Math.cos(ang) * rr * da; py += Math.sin(ang) * rr * da;
    pts.push([px, py, w * (1 - 0.65 * t)]);
  }
  return limb(pts.filter((_, i) => i % 2 === 0 || i === pts.length - 1), { per: 3 });
}

/** Wollkontur: Kern-Ellipse + Kreise auf dem Rand (Wolke, Busch, Baumkrone). Liefert eine LISTE von Polygonen. */
export function cluster(cx, cy, rx, ry, { bumps = 9, rb = null, seed = 1, jit = 0.15, inset = 0.85, start = 0, n = 22, arcFrom = 0, arcTo = TAU, core = 0.8 } = {}) {
  const r = rngOf(seed, 3);
  const out = [blob(cx, cy, rx * core, ry * core, 0, 36)];
  const rad = rb ?? Math.min(rx, ry) * 0.5;
  for (let i = 0; i < bumps; i++) {
    const t = bumps === 1 ? 0.5 : i / (bumps - 1);
    const a = start + arcFrom + (arcTo - arcFrom) * (arcTo - arcFrom >= TAU - 1e-6 ? i / bumps : t);
    const jj = 1 + (r() - 0.5) * 2 * jit;
    out.push(blob(cx + Math.cos(a) * rx * inset, cy + Math.sin(a) * ry * inset, rad * jj, rad * jj * (0.9 + r() * 0.2), 0, n));
  }
  return out;
}

/** Halbebene: alles unterhalb y0 abschneiden (Sutherland-Hodgman). */
export function clipBelow(pts, y0) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = a[1] >= y0, bin = b[1] >= y0;
    if (ain) out.push(a);
    if (ain !== bin) { const t = (y0 - a[1]) / (b[1] - a[1]); out.push([a[0] + (b[0] - a[0]) * t, y0]); }
  }
  return out;
}
/** Halbebene an Achse ax (0=x,1=y): behalte Werte >= v (keepGreater) bzw. <= v. */
export function clipAxis(pts, ax, v, keepGreater = true) {
  const out = [];
  const inside = (p) => (keepGreater ? p[ax] >= v : p[ax] <= v);
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const ain = inside(a), bin = inside(b);
    if (ain) out.push(a);
    if (ain !== bin) { const t = (v - a[ax]) / (b[ax] - a[ax]); out.push(ax === 0 ? [v, a[1] + (b[1] - a[1]) * t] : [a[0] + (b[0] - a[0]) * t, v]); }
  }
  return out;
}
export const clipBelowAll = (polys, y0) => polys.map((p) => clipBelow(p, y0)).filter((p) => p.length >= 3);

/** Felsbrocken: gezackter Umriss, abgerundet. flat = Anteil der abgeflachten Unterseite. */
export function rock(cx, cy, rx, ry, { seed = 1, n = 11, rough = 0.2, smooth = 1, flatBottom = true, sharp = 0 } = {}) {
  const r = rngOf(seed, 9);
  const pts = [];
  const a0 = r() * 0.5;
  for (let i = 0; i < n; i++) {
    const a = a0 + (i / n) * TAU + (r() - 0.5) * (TAU / n) * 0.55;
    const k = 1 + (r() - 0.5) * 2 * rough;
    let x = Math.cos(a) * rx * k, y = Math.sin(a) * ry * k;
    if (y < 0) y *= 0.5 + 0.5 * (1 - sharp);
    pts.push([cx + x, cy + y]);
  }
  let p = poly(pts, smooth);
  if (flatBottom) p = clipBelow(p, cy - ry * 0.55);
  return p;
}

/** Gezackter Streifen/Polygon aus Ober- und Unterkante (Listen von [x,y]). */
export function ribbon(top, bottom) { return top.concat(bottom.slice().reverse()); }

/** Wellenlinie als Punktliste. */
export function wavy(x0, x1, y, amp, freq, { n = 60, phase = 0, seed = 1, jit = 0.0 } = {}) {
  const r = rngOf(seed, 21); const pts = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    pts.push([x0 + (x1 - x0) * t, y + amp * Math.sin(t * freq * TAU + phase) + (jit ? (r() - 0.5) * jit : 0)]);
  }
  return pts;
}


/** Profil eines aufrecht verlaufenden Strangs (ctrl [[x,y,w],...], y steigend): y -> {x, w} */
export function profile(ctrl, per = 12) {
  const S = spline(ctrl, per);
  return (y) => {
    for (let i = 0; i < S.length - 1; i++) {
      const a = S[i], b = S[i + 1];
      if ((y >= a[1] && y <= b[1]) || (y <= a[1] && y >= b[1])) {
        const t = b[1] === a[1] ? 0 : (y - a[1]) / (b[1] - a[1]);
        return { x: a[0] + (b[0] - a[0]) * t, w: a[2] + (b[2] - a[2]) * t };
      }
    }
    const e = y < S[0][1] ? S[0] : S[S.length - 1];
    return { x: e[0], w: e[2] };
  };
}

/** Kreisperlen entlang einer Kurve (Nadelpolster, wollige Äste): ctrl [[x,y,r],...] -> Liste von Polygonen */
export function beads(ctrl, { per = 4, rng = null, jit = 0.1, sy = 1, n = 16 } = {}) {
  const S = spline(ctrl, per);
  return S.map((p) => {
    const j = rng ? 1 + (rng() - 0.5) * 2 * jit : 1;
    return blob(p[0], p[1], Math.max(0.01, p[2] * j), Math.max(0.01, p[2] * j * sy), 0, n);
  });
}

/** Fächerblatt (Ginkgo): Fächer mit Mittelkerbe + Stiel; Öffnungswinkel span (rad) um Richtung a. */
export function fan(x, y, a, R, { span = 2.1, notch = 0.28, n = 26, petiole = 0.28, wave = 0.04 } = {}) {
  const pts = [[x, y]];
  for (let i = 0; i <= n; i++) {
    const t = i / n, th = a - span / 2 + span * t;
    const d = (t - 0.5);
    const r = R * (1 - notch * Math.exp(-(d * d) / (2 * 0.045 * 0.045))) * (1 + wave * Math.sin(t * 17));
    pts.push([x + Math.cos(th) * r, y + Math.sin(th) * r]);
  }
  const stalk = limb([[x - Math.cos(a) * R * petiole, y - Math.sin(a) * R * petiole, R * 0.045], [x, y, R * 0.06]], { per: 2, caps: false });
  return { blade: pts, stalk };
}

// ---- Malen in Modellkoordinaten ------------------------------------------------------------------
export function pathPoly(c, pts) {
  const { ctx, tf } = c; ctx.beginPath();
  pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.closePath();
}
export function fillPoly(c, pts, color, alpha = 1) {
  const { ctx } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; pathPoly(c, pts); ctx.fill(); ctx.restore();
}
export function fillPolys(c, polys, color, alpha = 1) { for (const p of polys) fillPoly(c, p, color, alpha); }
export function strokePoly(c, pts, color, w, alpha = 1) {
  const { ctx, S } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * S); ctx.lineJoin = 'round';
  pathPoly(c, pts); ctx.stroke(); ctx.restore();
}
export function gradient(c, x0, y0, x1, y1, stops) {
  const [ax, ay] = c.tf(x0, y0), [bx, by] = c.tf(x1, y1);
  const g = c.ctx.createLinearGradient(ax, ay, bx, by);
  stops.forEach(([t, col]) => g.addColorStop(t, col));
  return g;
}
export function fillGrad(c, pts, x0, y0, x1, y1, stops, alpha = 1) {
  const { ctx } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = gradient(c, x0, y0, x1, y1, stops); pathPoly(c, pts); ctx.fill(); ctx.restore();
}
/** Kurve durch Punkte (weich, quadratisch) */
export function curve(c, pts, color, w, { alpha = 1, cap = 'round' } = {}) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * S); ctx.lineCap = cap; ctx.lineJoin = 'round';
  ctx.beginPath();
  const P = pts.map((p) => tf(p[0], p[1]));
  ctx.moveTo(P[0][0], P[0][1]);
  for (let i = 1; i < P.length - 1; i++) {
    const mx = (P[i][0] + P[i + 1][0]) / 2, my = (P[i][1] + P[i + 1][1]) / 2;
    ctx.quadraticCurveTo(P[i][0], P[i][1], mx, my);
  }
  ctx.lineTo(P[P.length - 1][0], P[P.length - 1][1]);
  ctx.stroke(); ctx.restore();
}
/** Bündel kurzer Striche (Nadeln, Grashalme) */
export function strokes(c, list, color, w, alpha = 1) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * S); ctx.lineCap = 'round';
  ctx.beginPath();
  for (const [x0, y0, x1, y1] of list) { const [A, B] = tf(x0, y0), [C, D] = tf(x1, y1); ctx.moveTo(A, B); ctx.lineTo(C, D); }
  ctx.stroke(); ctx.restore();
}
/** Mittelrippe eines Blattes (passend zu leaf()) */
export function vein(c, x, y, a, L, curveK, color, w, alpha = 0.55) {
  const dx = Math.cos(a), dy = Math.sin(a), nx = -dy, ny = dx;
  const mid = [x + dx * L * 0.5 + nx * curveK * L * 0.25, y + dy * L * 0.5 + ny * curveK * L * 0.25];
  const end = [x + dx * L * 0.92 + nx * curveK * L * 0.85, y + dy * L * 0.92 + ny * curveK * L * 0.85];
  curve(c, [[x, y], mid, end], color, w, { alpha });
}
/** Horizontale Bänder (Gesteinsschichten): bands = [{y0,y1,color}], breiter als der Layer, wird vom Layer begrenzt */
export function bandsH(c, bb, bands, x0 = bb.x0 - 0.2, x1 = bb.x1 + 0.2) {
  const { ctx, tf } = c;
  ctx.save();
  for (const b of bands) {
    ctx.fillStyle = b.color;
    const [A, B] = tf(x0, b.y1), [C, D] = tf(x1, b.y0);
    ctx.fillRect(A, B, C - A, D - B);
  }
  ctx.restore();
}

// ---- Abschluss: Skalierung, Zentrierung, Meta ------------------------------------------------------
function wrapCtx(c, s, dx, dy) {
  return Object.assign(Object.create(c), {
    tf: (x, y) => c.tf(x * s + dx, y * s + dy),
    px: (x, y) => c.tf(x * s + dx, y * s + dy),
    S: c.S * s,
  });
}
function wrapDeco(fn, s, dx, dy) {
  if (!fn) return fn;
  return (c, bb) => fn(wrapCtx(c, s, dx, dy), {
    x0: (bb.x0 - dx) / s, x1: (bb.x1 - dx) / s, y0: (bb.y0 - dy) / s, y1: (bb.y1 - dy) / s, w: bb.w / s, h: bb.h / s,
  });
}
function wrapAfter(fn, s, dx, dy) { return fn ? (c) => fn(wrapCtx(c, s, dx, dy)) : fn; }

/**
 * spec = { id, parts, anchors, meta }. Schneidet optional alles unter `floor` ab, skaliert auf Zielhöhe h bzw. Zielbreite w (Meter, Gesamt-
 * Bounding-Box), zentriert bei x=0 (centerX) und legt die Unterkante auf y=0. Trägt meta.heightM/widthM ein.
 */
export function finish(spec, { h = 0, w = 0, floor = null, centerX = true, baseY = true } = {}) {
  const clipped = {};
  for (const [name, part] of Object.entries(spec.parts)) {
    clipped[name] = floor == null ? part : { ...part, layers: part.layers.map((l) => ({ ...l, shapes: l.shapes.map((sh) => clipBelow(sh, floor)).filter((sh) => sh.length >= 3) })) };
  }
  spec = { ...spec, parts: clipped };
  let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
  for (const part of Object.values(spec.parts)) for (const l of part.layers) for (const sh of l.shapes) for (const [x, y] of sh) {
    if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y;
  }
  let s = 1;
  if (h) s = h / (y1 - y0); else if (w) s = w / (x1 - x0);
  const dx = centerX ? -((x0 + x1) / 2) * s : 0, dy = baseY ? -y0 * s : 0;
  const tp = (p) => p.map(([x, y]) => [x * s + dx, y * s + dy]);
  const parts = {};
  for (const [name, part] of Object.entries(spec.parts)) {
    const np = { ...part };
    np.layers = part.layers.map((l) => ({ ...l, shapes: l.shapes.map(tp), deco: wrapDeco(l.deco, s, dx, dy) }));
    if (part.pivot) np.pivot = [part.pivot[0] * s + dx, part.pivot[1] * s + dy];
    if (part.after) np.after = wrapAfter(part.after, s, dx, dy);
    parts[name] = np;
  }
  const anchors = {};
  for (const [k, v0] of Object.entries(spec.anchors || {})) {
    // Anker: [x,y] lokal oder { rel:[fx,fy] } relativ zur Gesamt-Bounding-Box (0..1)
    const v = Array.isArray(v0) ? v0 : [x0 + v0.rel[0] * (x1 - x0) + (v0.dx || 0), y0 + v0.rel[1] * (y1 - y0) + (v0.dy || 0)];
    anchors[k] = [+(v[0] * s + dx).toFixed(4), +(v[1] * s + dy).toFixed(4)];
  }
  const W = (x1 - x0) * s, H = (y1 - y0) * s;
  // Render-Hinweis: Papierrand und Texturdichte sollten mit der Objektgröße skalieren (kleine Requisiten sonst nur Rand/unscharf)
  const big = Math.max(W, H);
  const render = { borderM: +Math.max(0.004, Math.min(0.15, big * 0.0125)).toFixed(4), pxPerM: Math.round(Math.max(40, Math.min(1500, 900 / big))) };
  const meta = { ranges: {}, render, ...(spec.meta || {}), heightM: +H.toFixed(3), widthM: +W.toFixed(3) };
  return { id: spec.id, parts, anchors, meta };
}
