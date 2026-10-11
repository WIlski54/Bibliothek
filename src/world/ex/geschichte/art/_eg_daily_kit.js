// Gruppe O3 (Alltag, Schrift, Werkzeug, Rosetta): gemeinsamer Baukasten.
// Palette des Briefs, Optionen-Normalisierung, Spec-Helfer (finish), Malhilfen in Modellkoordinaten
// (Maserung, Körnung, Glanz, Schraffur, Quader, Seil, Ring-Polygone) – alles Meter, y nach oben, Boden y=0.
import {
  blob, limb, poly, xf, spline, TAU, rngOf, mix, shade, leaf, ribbon, wavy, clipBelow,
  fillPoly, fillPolys, strokePoly, curve, strokes, gradient, fillGrad, finish,
} from './_e_kit.js';
import { volume, dot, line } from '../../../../art/paint.js';

export {
  blob, limb, poly, xf, spline, TAU, rngOf, mix, shade, leaf, ribbon, wavy, clipBelow,
  fillPoly, fillPolys, strokePoly, curve, strokes, gradient, fillGrad, finish, volume, dot, line,
};

// ---- Palette (Brief) ---------------------------------------------------------------------------
export const P = {
  hautM: '#b5693a', hautF: '#d9a95a', leinen: '#f6efe0', leinenS: '#d9cdb4', haar: '#1c1816',
  gold: '#e0b040', goldH: '#fff0b3', goldD: '#8a5f1c', lapis: '#2a5aa0', tuerkis: '#3bb3a8', karneol: '#c0432e',
  papyrus: '#5b9a4b', nil: '#3f8f5a', sand: '#d9b97a', ziegel: '#b9824f', schwarz: '#1c1816',
  // Alltags-Töne
  holz: '#9a6a3a', holzH: '#c08a52', holzD: '#5e3d1f', ton: '#c98a55', tonD: '#8f5a33', terra: '#c4693d',
  kalk: '#e9dcc0', kalkD: '#bfae8a', granit: '#3a3d44', rohr: '#d8c27a', brot: '#cf8f45', brotD: '#8a4f1f',
  tinte: '#1c1816', rot: '#b8281f', papier: '#f1e3b8', papierD: '#d9c28a', ink: '#2b1a10',
};
export const INK = P.ink;

// ---- Optionen / Spec -----------------------------------------------------------------------------
/** Fabriken werden von den Seiten mit `variant` aufgerufen (undefined | Zahl | Text | Objekt) -> immer ein Objekt. */
export function norm(o) {
  if (o == null) return {};
  if (typeof o === 'number' || typeof o === 'string') return { variant: o };
  return o;
}
export const mk = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);
/** Layer-Kurzform. */
export const L = (shapes, fill, deco, extra = {}) => ({ shapes, fill, ...(deco ? { deco } : {}), ...extra });

// ---- Geometrie ------------------------------------------------------------------------------------
/** Rechteck mit Rundung (Chaikin). */
export function rrect(x0, y0, x1, y1, r = 0.02, k = 2) {
  const q = Math.min(r, (x1 - x0) / 2, (y1 - y0) / 2);
  return poly([[x0 + q, y0], [x1 - q, y0], [x1, y0 + q], [x1, y1 - q], [x1 - q, y1], [x0 + q, y1], [x0, y1 - q], [x0, y0 + q]], k);
}
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** Linienzug mit Gehrung als Polygon (scharfe Zickzacklinien). */
export function polyline(pts, w, limit = 2.2) {
  const n = pts.length, h = w / 2, Lf = [], Rt = [];
  const dir = (a, b) => { const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy) || 1; return [dx / m, dy / m]; };
  for (let i = 0; i < n; i++) {
    const d1 = i > 0 ? dir(pts[i - 1], pts[i]) : dir(pts[0], pts[1]);
    const d2 = i < n - 1 ? dir(pts[i], pts[i + 1]) : d1;
    const n1 = [-d1[1], d1[0]], n2 = [-d2[1], d2[0]];
    let mx = n1[0] + n2[0], my = n1[1] + n2[1];
    const dd = 1 + n1[0] * n2[0] + n1[1] * n2[1];
    let k = dd < 0.0001 ? 1 : 1 / dd;
    k = Math.min(k, limit * limit * 0.5);
    mx *= k; my *= k;
    Lf.push([pts[i][0] + mx * h, pts[i][1] + my * h]);
    Rt.push([pts[i][0] - mx * h, pts[i][1] - my * h]);
  }
  return Lf.concat(Rt.reverse());
}
/** Ring (Loch durch Brücke): äußerer Kreis CCW, innerer CW. Für Layer-shapes und Pfade. */
export function ring(cx, cy, R, r, n = 36, rx = 1, ry = 1) {
  const out = [], inn = [];
  for (let i = 0; i <= n; i++) { const a = (i / n) * TAU; out.push([cx + Math.cos(a) * R * rx, cy + Math.sin(a) * R * ry]); }
  for (let i = 0; i <= n; i++) { const a = -(i / n) * TAU; inn.push([cx + Math.cos(a) * r * rx, cy + Math.sin(a) * r * ry]); }
  return out.concat(inn);
}
/** Quader in leichter Schrägsicht: Vorderfläche, Oberseite (Schräge nach hinten rechts), rechte Seite. */
export function quader(x0, y0, w, h, dx, dy) {
  return {
    front: rect(x0, y0, x0 + w, y0 + h),
    top: [[x0, y0 + h], [x0 + w, y0 + h], [x0 + w + dx, y0 + h + dy], [x0 + dx, y0 + h + dy]],
    side: [[x0 + w, y0], [x0 + w + dx, y0 + dy], [x0 + w + dx, y0 + h + dy], [x0 + w, y0 + h]],
  };
}
/** Unregelmäßiges Vieleck um (cx,cy) für Scherben/Steine. */
export function lump(cx, cy, rx, ry, seed = 1, n = 9, rough = 0.15, sm = 1) {
  const r = rngOf(seed, 5), pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * TAU + (r() - 0.5) * 0.3, k = 1 + (r() - 0.5) * 2 * rough;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return poly(pts, sm);
}
/** Rotation eines Punktes/Polygons um (px,py). */
export const rotPts = (p, a, px = 0, py = 0) => {
  const c = Math.cos(a), s = Math.sin(a);
  return p.map(([x, y]) => [px + (x - px) * c - (y - py) * s, py + (x - px) * s + (y - py) * c]);
};

// ---- Malhilfen -------------------------------------------------------------------------------------
/** Gesprenkelte Körnung (Granit, Kalkstein, Lehm). cols = Liste von Farben. */
export function speckle(c, bb, cols, n, rmin, rmax, seed = 3, alpha = 0.7) {
  const r = rngOf(seed, 17);
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h, rad = rmin + r() * (rmax - rmin);
    fillPoly(c, blob(x, y, rad, rad * (0.6 + r() * 0.6), r() * 3, 7), cols[Math.floor(r() * cols.length)], alpha);
  }
}
/** Parallele Schraffur über die Bounding-Box (Layer begrenzt). ang in rad. */
export function hatch(c, bb, color, step, ang = 0.6, w = 0.006, alpha = 0.4) {
  const d = Math.hypot(bb.w, bb.h), cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2;
  const ca = Math.cos(ang), sa = Math.sin(ang), list = [];
  for (let t = -d; t <= d; t += step) {
    const ox = cx - sa * t, oy = cy + ca * t;
    list.push([ox - ca * d, oy - sa * d, ox + ca * d, oy + sa * d]);
  }
  strokes(c, list, color, w, alpha);
}
/** Waagerechte Maserung/Fasern mit leichtem Zittern. */
export function grain(c, bb, color, n, { len = 0.3, w = 0.004, alpha = 0.35, seed = 4, ang = 0 } = {}) {
  const r = rngOf(seed, 23), L2 = [];
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h, l = len * (0.4 + r() * 0.8), a = ang + (r() - 0.5) * 0.12;
    L2.push([x, y, x + Math.cos(a) * l, y + Math.sin(a) * l]);
  }
  strokes(c, L2, color, w, alpha);
}
/** Weicher Glanzfleck (Ellipse) für Glasur/Ton/Metall. */
export function gloss(c, x, y, rx, ry, rot = 0, alpha = 0.35, color = '#fff8e0') {
  fillPoly(c, blob(x, y, rx, ry, rot, 20), color, alpha);
}
/** Dunkle Kante + helle Kante auf einer Kontur (Licht von links oben). */
export function bevel(c, pts, w, dark = 'rgba(40,22,10,.35)', light = 'rgba(255,245,215,.35)') {
  const sh = pts.map(([x, y]) => [x + w * 0.5, y - w * 0.5]);
  strokePoly(c, sh, dark, w, 1);
  const hi = pts.map(([x, y]) => [x - w * 0.4, y + w * 0.4]);
  strokePoly(c, hi, light, w * 0.8, 1);
}
/** Seilstrang mit Drehung: Pfad ctrl [[x,y],...], Breite w; liefert Polygon-Liste (für Layer-shapes) */
export function ropePolys(ctrl, w) { return [limb(ctrl.map((p) => [p[0], p[1], w]), { per: 6, caps: true })]; }
/** Seildrehung (diagonale Striche) entlang einer Spline in deco. */
export function ropeTwist(c, ctrl, w, color = 'rgba(60,35,15,.55)', step = 0.035) {
  const S = spline(ctrl.map((p) => [p[0], p[1], w]), 14);
  let acc = 0, prev = S[0];
  const L2 = [];
  for (let i = 1; i < S.length; i++) {
    const cur = S[i], dx = cur[0] - prev[0], dy = cur[1] - prev[1], m = Math.hypot(dx, dy);
    acc += m;
    if (acc >= step) {
      acc = 0;
      const tx = dx / (m || 1), ty = dy / (m || 1), nx = -ty, ny = tx, h = w * 0.5;
      L2.push([cur[0] - nx * h + tx * w * 0.35, cur[1] - ny * h - ty * w * 0.0, cur[0] + nx * h - tx * w * 0.35, cur[1] + ny * h]);
    }
    prev = cur;
  }
  strokes(c, L2, color, Math.max(0.004, w * 0.18), 1);
}
/** Flamme: Tropfen mit Spitze nach oben. Rückgabe Polygon. */
export function flameShape(cx, y0, w, h, lean = 0, k = 2) {
  return poly([[cx - w * 0.5, y0 + h * 0.06], [cx - w * 0.55, y0 + h * 0.3], [cx - w * 0.3, y0 + h * 0.58], [cx - w * 0.12 + lean * w, y0 + h * 0.82], [cx + lean * w * 1.6, y0 + h],
    [cx + w * 0.18 + lean * w, y0 + h * 0.7], [cx + w * 0.5, y0 + h * 0.4], [cx + w * 0.52, y0 + h * 0.16], [cx + w * 0.2, y0]], k);
}
export { rngOf as rng };

/** Gefäß-Silhouette: prof = [[radius, y], ...] von unten nach oben, achsensymmetrisch um x=cx; sm = Glättung. */
export function vase(prof, cx = 0, sm = 2) {
  const R = prof.map(([r, y]) => [cx + r, y]);
  const Lf = prof.slice().reverse().map(([r, y]) => [cx - r, y]);
  return poly(R.concat(Lf), sm);
}
/** Symmetrischer Radius-Verlauf als Funktion von y (lineare Interpolation) – für Bänder auf Gefäßen. */
export function radiusAt(prof, y) {
  for (let i = 0; i < prof.length - 1; i++) {
    const [r0, y0] = prof[i], [r1, y1] = prof[i + 1];
    if (y >= y0 && y <= y1) return r0 + ((r1 - r0) * (y - y0)) / (y1 - y0 || 1);
  }
  return prof[prof.length - 1][0];
}
/** Zähes Zufallsmuster Lehmverputz-Spritzer */
export function plasterBlotches(c, bb, cols, n, seed = 2) {
  const r = rngOf(seed, 31);
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h, rx = 0.01 + r() * 0.03;
    fillPoly(c, blob(x, y, rx, rx * (0.4 + r() * 0.4), r() * 3, 9), cols[Math.floor(r() * cols.length)], 0.35);
  }
}

/** Gedrehter Mal-Kontext: zeichnet in lokalen Koordinaten, die um a (rad) um (px,py) gedreht erscheinen. */
export function rotCtx(c, a, px = 0, py = 0) {
  const co = Math.cos(a), si = Math.sin(a);
  const f = (x, y) => c.tf(px + (x - px) * co - (y - py) * si, py + (x - px) * si + (y - py) * co);
  return Object.assign(Object.create(c), { tf: f, px: f });
}
/** Polygon gegen ein konvexes Clip-Polygon (CCW) schneiden (Sutherland-Hodgman). */
export function clipConvex(subject, clip) {
  let out = subject;
  for (let i = 0; i < clip.length && out.length; i++) {
    const a = clip[i], b = clip[(i + 1) % clip.length], inp = out; out = [];
    const side = (p) => (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]);
    for (let j = 0; j < inp.length; j++) {
      const p = inp[j], q = inp[(j + 1) % inp.length], sp = side(p), sq = side(q);
      if (sp >= 0) out.push(p);
      if ((sp >= 0) !== (sq >= 0)) { const t = sp / (sp - sq); out.push([p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t]); }
    }
  }
  return out;
}
