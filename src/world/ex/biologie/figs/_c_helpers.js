// Helpers for art group C (sea reptiles, pterosaurs, sea animals, insect). Pure functions, no engine changes.
import { spline, limb, poly } from '../../../../art/dsl.js';
import { mulberry32 } from '../../../../lib/util.js';
import { unionPolys } from '../../../../lib/papercut.js';

const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);

// centripetal Catmull-Rom point (Barry-Goldman), p0..p3 = [x,y]
function cr(p0, p1, p2, p3, t, alpha = 0.5) {
  const t0 = 0;
  const t1 = t0 + Math.pow(Math.max(dist(p0, p1), 1e-9), alpha);
  const t2 = t1 + Math.pow(Math.max(dist(p1, p2), 1e-9), alpha);
  const t3 = t2 + Math.pow(Math.max(dist(p2, p3), 1e-9), alpha);
  const u = t1 + (t2 - t1) * t;
  const mix = (a, b, ta, tb) => [a[0] * (tb - u) / (tb - ta) + b[0] * (u - ta) / (tb - ta), a[1] * (tb - u) / (tb - ta) + b[1] * (u - ta) / (tb - ta)];
  const A1 = mix(p0, p1, t0, t1), A2 = mix(p1, p2, t1, t2), A3 = mix(p2, p3, t2, t3);
  const B1 = mix(A1, A2, t0, t2), B2 = mix(A2, A3, t1, t3);
  return mix(B1, B2, t1, t2);
}

// Closed smooth curve through [x,y(,sharp)] points -> polygon. A point with a truthy 3rd value is a sharp corner.
export function smooth(pts, per = 8) {
  const P = [];
  for (const p of pts) { P.push([p[0], p[1], !!p[2]]); }
  const n = P.length, out = [];
  for (let i = 0; i < n; i++) {
    let p0 = P[(i - 1 + n) % n], p1 = P[i], p2 = P[(i + 1) % n], p3 = P[(i + 2) % n];
    // sharp corners: phantom neighbours along the chord make the curve leave/arrive straight
    if (p1[2]) p0 = [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]];
    if (p2[2]) p3 = [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]];
    for (let j = 0; j < per; j++) out.push(cr(p0, p1, p2, p3, j / per));
  }
  return out;
}

// Open smooth curve through [x,y] points -> list of [x,y]
export function curve(pts, per = 10) {
  const n = pts.length, out = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(n - 1, i + 2)];
    const q0 = i === 0 ? [2 * p1[0] - p2[0], 2 * p1[1] - p2[1]] : p0;
    const q3 = i === n - 2 ? [2 * p2[0] - p1[0], 2 * p2[1] - p1[1]] : p3;
    for (let j = 0; j < per; j++) out.push(cr(q0, p1, p2, q3, j / per));
  }
  out.push([pts[n - 1][0], pts[n - 1][1]]);
  return out;
}

export const mirrorX = (p, cx = 0) => p.map(([x, y]) => [2 * cx - x, y]);
export const mirrorY = (p, cy = 0) => p.map(([x, y]) => [x, 2 * cy - y]);
export const rotAbout = (p, cx, cy, a) => { const c = Math.cos(a), s = Math.sin(a); return p.map(([x, y]) => [cx + (x - cx) * c - (y - cy) * s, cy + (x - cx) * s + (y - cy) * c]); };

// equally spaced points along a polyline
export function resample(pts, n) {
  const L = [0];
  for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + dist(pts[i - 1], pts[i]));
  const tot = L[L.length - 1], out = [];
  for (let k = 0; k < n; k++) {
    const d = (tot * k) / Math.max(1, n - 1);
    let i = 1; while (i < L.length - 1 && L[i] < d) i++;
    const t = (d - L[i - 1]) / Math.max(1e-9, L[i] - L[i - 1]);
    out.push([pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t]);
  }
  return out;
}
export function pathLength(pts) { let s = 0; for (let i = 1; i < pts.length; i++) s += dist(pts[i - 1], pts[i]); return s; }

// small triangular teeth along a path; side=+1 -> tooth tips on the left of the travel direction, -1 right
export function teeth(path, n, len, w, side = 1, t0 = 0.05, t1 = 0.95, lean = 0.1) {
  const out = [];
  const S = resample(path, 200);
  for (let k = 0; k < n; k++) {
    const t = n === 1 ? (t0 + t1) / 2 : t0 + ((t1 - t0) * k) / (n - 1);
    const i = Math.min(S.length - 2, Math.max(1, Math.round(t * (S.length - 1))));
    const a = S[i - 1], b = S[i + 1];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty * side, ny = tx * side;
    const c = S[i];
    out.push([[c[0] - tx * w / 2, c[1] - ty * w / 2], [c[0] + nx * len + tx * len * lean, c[1] + ny * len + ty * len * lean], [c[0] + tx * w / 2, c[1] + ty * w / 2]]);
  }
  return out;
}

// bounding box of polygons
export function bboxOf(polys) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of polys) for (const [x, y] of p) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}

// ---- painting helpers (c = painter) ----------------------------------------------------------
export function pathOn(c, pts, close = false) {
  const { ctx, tf } = c;
  ctx.beginPath();
  pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  if (close) ctx.closePath();
}
export function fillPoly(c, pts, color, alpha = 1) {
  const { ctx } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; pathOn(c, pts, true); ctx.fill(); ctx.restore();
}
export function strokePath(c, pts, color, w, alpha = 1, cap = 'round') {
  const { ctx, S } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * S);
  ctx.lineCap = cap; ctx.lineJoin = 'round'; pathOn(c, pts, false); ctx.stroke(); ctx.restore();
}
// soft elliptical glow (highlight/shadow) painted with a radial gradient
export function glow(c, x, y, rx, ry, color, alpha = 0.5, rot = 0) {
  const { ctx, tf, S } = c; const [X, Y] = tf(x, y);
  ctx.save(); ctx.translate(X, Y); ctx.rotate(-rot); ctx.scale(rx * S, ry * S);
  const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
  g.addColorStop(0, color); g.addColorStop(1, 'rgba(255,255,255,0)');
  ctx.globalAlpha = alpha; ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fill(); ctx.restore();
}
// mother-of-pearl shimmer: soft pastel bands drifting over a region
export function pearl(c, bb, { alpha = 0.45, seed = 4, bands = 5 } = {}) {
  const { ctx, tf, S } = c; const r = mulberry32(seed);
  const cols = ['rgba(255,185,215,A)', 'rgba(190,255,225,A)', 'rgba(255,240,170,A)', 'rgba(210,195,255,A)', 'rgba(255,215,190,A)'];
  ctx.save();
  for (let i = 0; i < bands; i++) {
    const x = bb.x0 + (bb.w * (i + 0.5)) / bands + (r() - 0.5) * bb.w * 0.2, y = bb.y0 + r() * bb.h;
    const rx = bb.w * (0.18 + r() * 0.12), ry = bb.h * (0.25 + r() * 0.2);
    const col = cols[i % cols.length];
    const [X, Y] = tf(x, y);
    ctx.save(); ctx.translate(X, Y); ctx.rotate(-0.8 + r() * 1.6); ctx.scale(rx * S, ry * S);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, 1);
    g.addColorStop(0, col.replace('A', String(alpha))); g.addColorStop(1, col.replace('A', '0'));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, 1, 0, 6.2832); ctx.fill(); ctx.restore();
  }
  ctx.restore();
}
// overlapping fish scales: small "(" arcs in staggered rows, free edge toward -x (the tail)
export function fishScales(c, bb, color, { size = 0.02, alpha = 0.3, y0, y1, x0, x1 } = {}) {
  const { ctx, tf, S } = c; ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, S * size * 0.12);
  const ya = y0 ?? bb.y0, yb = y1 ?? bb.y1, xa = x0 ?? bb.x0, xb = x1 ?? bb.x1;
  let row = 0;
  for (let y = ya; y < yb; y += size * 0.9, row++) {
    for (let x = xa + (row % 2) * size * 0.5; x < xb; x += size) {
      const [X, Y] = tf(x, y); ctx.beginPath(); ctx.arc(X + size * S * 0.5, Y, size * S * 0.5, Math.PI * 0.55, Math.PI * 1.45); ctx.stroke();
    }
  }
  ctx.restore();
}
// rhombic ganoid scales: diagonal criss-cross lines
export function ganoid(c, bb, color, { size = 0.04, alpha = 0.3, slant = 0.7 } = {}) {
  const { ctx, tf, S } = c; ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, S * 0.004); ctx.lineCap = 'round';
  for (let x = bb.x0 - bb.h * slant; x < bb.x1 + bb.h * slant; x += size) {
    let [a, b] = tf(x, bb.y0), [d, e] = tf(x + bb.h * slant, bb.y1); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(d, e); ctx.stroke();
    [a, b] = tf(x + bb.h * slant, bb.y0); [d, e] = tf(x, bb.y1); ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(d, e); ctx.stroke();
  }
  ctx.restore();
}
// thin outline of the union of `shapes` (for small figures: width relative to the figure, not a fixed 1.2 cm). Use with layer.stroke = null.
export function outline(c, shapes, color = 'rgba(50,30,12,0.5)', w = 0.004) {
  const { ctx, tf, S } = c;
  const paths = unionPolys(shapes).map((p) => p.map((q) => [q.X / 4000, q.Y / 4000]));
  ctx.save(); ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * 2 * S); ctx.lineJoin = 'round';
  for (const p of paths) { ctx.beginPath(); p.forEach((q, i) => { const [X, Y] = tf(q[0], q[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.closePath(); ctx.stroke(); }
  ctx.restore();
}
// fan of thin lines between two polylines at equal fractions (fin rays, wing veins)
export function fan(c, A, B, color, w, n, alpha = 1) {
  const a = resample(A, n + 2), b = resample(B, n + 2);
  for (let k = 1; k <= n; k++) strokePath(c, [a[k], b[k]], color, w, alpha);
}
// vertical gradient in MODEL y-coordinates (stops at t=0 at yTop .. t=1 at yBottom), painted over the whole layer (clip applies)
export function vgrad(c, yTop, yBottom, stops) {
  const { ctx, tf } = c; const [x0, y0] = tf(0, yTop), [x1, y1] = tf(0, yBottom);
  const g = ctx.createLinearGradient(x0, y0, x1, y1); stops.forEach(([t, col]) => g.addColorStop(t, col));
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
}
// a friendly eye with a coloured ring (e.g. golden scleral ring)
export function ringEye(c, x, y, r, { ring = '#d9a441', pupil = '#14181c', look = 0.3, white = '#fffaf0' } = {}) {
  const { ctx, tf, S } = c; const [X, Y] = tf(x, y); const R = Math.max(2, r * S);
  ctx.save();
  ctx.beginPath(); ctx.arc(X, Y, R, 0, 6.2832); ctx.fillStyle = ring; ctx.fill();
  ctx.lineWidth = Math.max(1, R * 0.14); ctx.strokeStyle = 'rgba(40,25,10,.85)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(X, Y, R * 0.78, 0, 6.2832); ctx.fillStyle = white; ctx.fill();
  ctx.beginPath(); ctx.arc(X + R * look * 0.45, Y, R * 0.55, 0, 6.2832); ctx.fillStyle = pupil; ctx.fill();
  ctx.beginPath(); ctx.arc(X + R * look * 0.45 + R * 0.2, Y - R * 0.22, R * 0.2, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
}

// polygon of the band between offsets fa..fb (fractions of the local width, + = left of travel direction) along a limb centre-line
export function strip(ctrl, fa, fb, per = 10) {
  const S = spline(ctrl, per);
  const A = [], B = [];
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx, w = S[i][2];
    A.push([S[i][0] + nx * w * fa, S[i][1] + ny * w * fa]);
    B.push([S[i][0] + nx * w * fb, S[i][1] + ny * w * fb]);
  }
  return A.concat(B.reverse());
}
// point + unit tangent along a limb centre-line at fraction t (0..1)
export function along(ctrl, t, per = 10) {
  const S = spline(ctrl, per); const i = Math.min(S.length - 2, Math.max(1, Math.round(t * (S.length - 1))));
  const a = S[i - 1], b = S[i + 1]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1;
  return { x: S[i][0], y: S[i][1], w: S[i][2], tx: tx / m, ty: ty / m, nx: -ty / m, ny: tx / m };
}

// Uniformly scale a finished spec by k (shapes, pivots, anchors; deco callbacks keep working in design units via a painter proxy).
export function scaleSpec(spec, k) {
  const sc = (p) => p.map(([x, y]) => [x * k, y * k]);
  const parts = {};
  for (const [name, part] of Object.entries(spec.parts)) {
    const np = Object.assign({}, part);
    if (part.pivot) np.pivot = [part.pivot[0] * k, part.pivot[1] * k];
    np.layers = part.layers.map((l) => Object.assign({}, l, {
      shapes: l.shapes.map(sc),
      deco: l.deco ? (c, bb) => {
        const c2 = Object.create(c); c2.tf = (x, y) => c.tf(x * k, y * k); c2.S = c.S * k;
        l.deco(c2, { x0: bb.x0 / k, x1: bb.x1 / k, y0: bb.y0 / k, y1: bb.y1 / k, w: bb.w / k, h: bb.h / k });
      } : undefined,
    }));
    parts[name] = np;
  }
  const anchors = {}; for (const [n, a] of Object.entries(spec.anchors || {})) anchors[n] = [a[0] * k, a[1] * k];
  return Object.assign({}, spec, { parts, anchors });
}

export { spline, limb, poly };
