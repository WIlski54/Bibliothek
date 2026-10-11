// Silhouette DSL: builds 2D polygons (arrays of [x,y], y up, units = METERS) for paper-cut animals & plants.
// Everything is union-ed later (clipper) into one paper outline per part.
import { TAU } from '../lib/util.js';

// ---- primitives ---------------------------------------------------------------------------
export function blob(cx, cy, rx, ry = rx, rot = 0, n = 40) {
  const pts = [];
  const c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU;
    const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
    pts.push([cx + x * c - y * s, cy + x * s + y * c]);
  }
  return pts;
}

// Closed polygon, optional Chaikin smoothing (corner cutting) to get soft cartoon contours
export function poly(pts, smoothing = 0) {
  let p = pts.map((q) => [q[0], q[1]]);
  for (let k = 0; k < smoothing; k++) {
    const out = [];
    for (let i = 0; i < p.length; i++) {
      const a = p[i], b = p[(i + 1) % p.length];
      out.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25]);
      out.push([a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]);
    }
    p = out;
  }
  return p;
}

// Catmull-Rom through [x,y,w] control points -> dense samples
export function spline(ctrl, per = 10) {
  const P = ctrl.map((c) => [c[0], c[1], c[2] ?? 0]);
  const n = P.length;
  if (n === 1) return [P[0]];
  const out = [];
  for (let i = 0; i < n - 1; i++) {
    const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n - 1, i + 2)];
    for (let j = 0; j < per; j++) {
      const t = j / per, t2 = t * t, t3 = t2 * t;
      const f = (a, b, c, d) => 0.5 * ((2 * b) + (-a + c) * t + (2 * a - 5 * b + 4 * c - d) * t2 + (-a + 3 * b - 3 * c + d) * t3);
      out.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1]), Math.max(0, f(p0[2], p1[2], p2[2], p3[2]))]);
    }
  }
  out.push(P[n - 1]);
  return out;
}

// Tapered "limb" along a spline with per-point width (full diameter) and round caps.
// ctrl: [[x,y,w],...]
export function limb(ctrl, { per = 10, caps = true } = {}) {
  const S = spline(ctrl, per);
  const L = [], R = [];
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1];
    const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty, ny = tx, h = S[i][2] / 2;
    L.push([S[i][0] + nx * h, S[i][1] + ny * h]);
    R.push([S[i][0] - nx * h, S[i][1] - ny * h]);
  }
  let pts = L.concat(R.reverse());
  if (caps) {
    const cap = (p, dirx, diry, r, arr) => {
      if (r < 0.004) return;
      const a0 = Math.atan2(diry, dirx);
      for (let k = 1; k < 8; k++) {
        const a = a0 + Math.PI / 2 - (k / 8) * Math.PI;
        arr.push([p[0] + Math.cos(a) * r, p[1] + Math.sin(a) * r]);
      }
    };
    const first = S[0], second = S[Math.min(1, S.length - 1)];
    const last = S[S.length - 1], prev = S[Math.max(0, S.length - 2)];
    const endCap = [], startCap = [];
    cap(last, last[0] - prev[0], last[1] - prev[1], last[2] / 2, endCap);
    cap(first, first[0] - second[0], first[1] - second[1], first[2] / 2, startCap);
    // order: L (start->end), endCap, R reversed (end->start), startCap
    const Llen = L.length;
    pts = L.concat(endCap, pts.slice(Llen), startCap);
  }
  return pts;
}

// ---- transforms -----------------------------------------------------------------------------
export function xf(p, { x = 0, y = 0, rot = 0, s = 1, sx = s, sy = s, flipX = false } = {}) {
  const c = Math.cos(rot), si = Math.sin(rot);
  return p.map(([px, py]) => {
    let X = px * sx * (flipX ? -1 : 1), Y = py * sy;
    return [X * c - Y * si + x, X * si + Y * c + y];
  });
}
export const move = (p, x, y) => p.map(([a, b]) => [a + x, b + y]);

// Wavy-topped panel (scenery flats): width w, base y0, height h, wave amplitude/frequency
export function panel(x0, x1, y0, h, { wave = 0.3, freq = 6, phase = 0, seed = 1, scallop = false, step = 0.12 } = {}) {
  const pts = [[x0, y0]];
  const n = Math.max(8, Math.round((x1 - x0) / step));
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const t = i / n;
    let y;
    if (scallop) {
      const k = (t * freq) % 1;
      y = y0 + h - wave * (1 - Math.pow(Math.sin(k * Math.PI), 0.55));
    } else {
      y = y0 + h + wave * (Math.sin(t * freq * TAU + phase) * 0.6 + Math.sin(t * freq * 2.3 * TAU + phase * 1.7 + seed) * 0.4);
    }
    pts.push([x, y]);
  }
  pts.push([x1, y0]);
  return pts;
}
