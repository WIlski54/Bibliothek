// Gruppe O1 (Königs- und Grabschätze, Kronen): gemeinsamer Baukasten.
// Gold mit Verlauf + Glanzkante + Glanzstreifen, Einlagen (Lapislazuli, Türkis, Karneol, Fayence), Zierzeichen (nur Ornament!),
// Symmetrie- und Ringhelfer. Es wird in beliebigen Einheiten (meist cm) gebaut; `spec()`/finish() skaliert auf die Zielgröße.
import { blob, limb, poly, xf, spline } from '../../../../art/dsl.js';
import { TAU } from '../../../../lib/util.js';
import { volume } from '../../../../art/paint.js';
import ClipperLib from 'clipper-lib';
import { unionF } from '../../../../lib/papercut.js';
import {
  shade, mix, rngOf, finish, pathPoly, fillPoly, strokePoly, curve, strokes, clipBelow, clipAxis,
} from './_e_kit.js';

export { blob, limb, poly, xf, spline, TAU, shade, mix, rngOf, pathPoly, fillPoly, strokePoly, curve, strokes, clipBelow, clipAxis, volume };

// ---- Palette (Brief) ---------------------------------------------------------------------------------------
export const K = {
  gold: '#e0b040', goldHi: '#fff0b3', goldLo: '#8a5f1c', goldMid: '#c4952a',
  lapis: '#2a5aa0', lapisHi: '#4f86cf', lapisLo: '#173a70',
  turq: '#3bb3a8', turqHi: '#7fe0d4', turqLo: '#22766f',
  carn: '#c0432e', carnHi: '#e0705a', carnLo: '#862517',
  linen: '#f6efe0', linenSh: '#d9cdb4', black: '#1c1816',
  sand: '#d9b97a', mud: '#b9824f', papyrus: '#5b9a4b', nil: '#3f8f5a',
  skinM: '#b5693a', skinF: '#d9a95a', wood: '#8a5a32', woodLo: '#5a3a1e', ebony: '#2a2018',
  silver: '#d8dde0', iron: '#8f9aa3', ironLo: '#4f5a64', ironHi: '#e6eef3',
  ink: 'rgba(60,35,8,.75)',
};

export const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);

// ---- Geometrie -------------------------------------------------------------------------------------------------
export const mirror = (p) => p.map(([x, y]) => [-x, y]);
/** Symmetrischer Umriss: Punkte der rechten Hälfte von oben (x=0) nach unten (x=0). */
export function sym(pts, smooth = 0) {
  const left = pts.slice(1, -1).reverse().map(([x, y]) => [-x, y]);
  return poly(pts.concat(left), smooth);
}
/** Kreisring/-segment zwischen Radien r0..r1 von Winkel a0..a1 (rad, 0 = +x, gegen den Uhrzeigersinn). */
export function ring(cx, cy, r0, r1, a0, a1, n = 28) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * r1, cy + Math.sin(a) * r1]); }
  for (let i = n; i >= 0; i--) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * r0, cy + Math.sin(a) * r0]); }
  return out;
}
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
/** Gerundetes Rechteck. */
export function rrect(x0, y0, x1, y1, r = 0.5, n = 5) {
  const pts = [];
  const corner = (cx, cy, a0) => { for (let i = 0; i <= n; i++) { const a = a0 + (i / n) * Math.PI / 2; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); } };
  corner(x1 - r, y1 - r, 0); corner(x0 + r, y1 - r, Math.PI / 2); corner(x0 + r, y0 + r, Math.PI); corner(x1 - r, y0 + r, Math.PI * 1.5);
  return pts;
}
/** Bogenlinie (Punktliste) um Mittelpunkt. */
export function arcPts(cx, cy, rx, ry, a0, a1, n = 24) {
  const out = [];
  for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * (i / n); out.push([cx + Math.cos(a) * rx, cy + Math.sin(a) * ry]); }
  return out;
}
/** Dicke Linie als Polygon. */
export const stroke2poly = (pts, w, per = 6) => limb(pts.map((p) => [p[0], p[1], w]), { per });
/** Strang in n Abschnitte teilen (abwechselnd färbbar): Liefert Liste von Polygonen je Abschnitt. ctrl [[x,y,w],...] */
export function bandedLimb(ctrl, n, { per = 14, gap = 0 } = {}) {
  const S = spline(ctrl, per);
  const out = [];
  for (let i = 0; i < n; i++) {
    const a = Math.floor((S.length - 1) * (i / n)), b = Math.min(S.length - 1, Math.ceil((S.length - 1) * ((i + 1) / n)) + (i < n - 1 ? 1 : 0));
    const sub = S.slice(a, b + 1);
    if (sub.length >= 2) out.push(limb(sub, { per: 1, caps: false }));
  }
  return out;
}
/** Kreisförmiges Rosettenband entlang einer Punktliste. */
export function beadsAlong(pts, r, step) {
  const S = spline(pts.map((p) => [p[0], p[1], 0]), 10), out = [];
  let acc = 0;
  for (let i = 1; i < S.length; i++) {
    acc += Math.hypot(S[i][0] - S[i - 1][0], S[i][1] - S[i - 1][1]);
    if (acc >= step) { acc = 0; out.push(blob(S[i][0], S[i][1], r, r, 0, 12)); }
  }
  return out;
}

// ---- Gold & Glanz -------------------------------------------------------------------------------------------------
export const goldFill = (dir = 'h') => ({
  stops: dir === 'h'
    ? [[0, '#a8761f'], [0.16, '#e0b040'], [0.34, '#fff0b3'], [0.5, '#f0c85a'], [0.78, '#d0a030'], [1, '#8a5f1c']]
    : [[0, '#fff0b3'], [0.2, '#f0c85a'], [0.55, '#e0b040'], [1, '#a8761f']],
  dir,
});
export const silverFill = (dir = 'h') => ({ stops: [[0, '#8e969b'], [0.25, '#e8eef0'], [0.45, '#ffffff'], [0.7, '#c4ccd0'], [1, '#7a838a']], dir });
export const ironFill = (dir = 'h') => ({ stops: [[0, '#5a6670'], [0.3, '#a9b5be'], [0.45, '#e6eef3'], [0.7, '#8a96a0'], [1, '#4a545c']], dir });

/** Diagonales Glanzband über die Layer-Box (nur im Layer sichtbar, da Layer geclippt). */
export function gloss(c, bb, { ang = 0.9, pos = 0.3, w = 0.16, a = 0.55, color = '255,246,200' } = {}) {
  const { ctx, tf } = c;
  const cx = (bb.x0 + bb.x1) / 2, cy = (bb.y0 + bb.y1) / 2, R = Math.hypot(bb.w, bb.h) / 2;
  const dx = Math.cos(ang), dy = Math.sin(ang);
  const [x0, y0] = tf(cx - dx * R, cy - dy * R), [x1, y1] = tf(cx + dx * R, cy + dy * R);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  const p0 = Math.max(0, pos - w), p1 = Math.min(1, pos + w);
  g.addColorStop(0, `rgba(${color},0)`); g.addColorStop(p0, `rgba(${color},0)`);
  g.addColorStop(pos, `rgba(${color},${a})`); g.addColorStop(p1, `rgba(${color},0)`); g.addColorStop(1, `rgba(${color},0)`);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
}

/** Glanzkante: verschobene Umrisse (hell oben-links, dunkel unten-rechts), erscheint nur im Layer. */
export function bevel(c, shapes, bb, { px = null, hi = 'rgba(255,248,205,.9)', lo = 'rgba(70,40,6,.5)', w = null } = {}) {
  const { ctx } = c;
  const outs = unionF(shapes);
  const base = Math.max(bb.w, bb.h) * c.S;
  const d = px ?? Math.max(1.3, Math.min(4, base * 0.006));
  const lw = w ?? Math.max(1.2, d * 1.2);
  ctx.save(); ctx.lineJoin = 'round'; ctx.lineWidth = lw;
  // Umriss nach rechts-unten verschoben: erscheint innen an den linken/oberen Kanten (Licht); nach links-oben: rechte/untere Kanten (Schatten)
  ctx.translate(d, d * 0.9); ctx.strokeStyle = hi;
  for (const o of outs) { pathPoly(c, o); ctx.stroke(); }
  ctx.translate(-2 * d, -1.8 * d); ctx.strokeStyle = lo;
  for (const o of outs) { pathPoly(c, o); ctx.stroke(); }
  ctx.restore();
}

/** Goldlayer mit Verlauf, Volumen, Glanzband und Glanzkante. o: dir, gloss, ang, pos, deco, stroke */
export function gold(shapes, o = {}) {
  return {
    shapes, fill: o.fill || goldFill(o.dir || 'h'), stroke: o.stroke === undefined ? 'rgba(110,68,10,.8)' : o.stroke,
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(100,55,5,.30)', light: 'rgba(255,246,190,.22)' });
      if (o.gloss !== false) gloss(c, bb, { ang: o.ang ?? 0.9, pos: o.pos ?? 0.3, w: o.gw ?? 0.14, a: o.ga ?? 0.5 });
      if (o.bevel !== false) bevel(c, shapes, bb, o.bevelOpts || {});
      if (o.deco) o.deco(c, bb);
    },
  };
}
/** Einlage / farbige Fläche mit sanftem Verlauf und feiner Kante. */
export function inlay(shapes, color, o = {}) {
  return {
    shapes, fill: o.fill || { top: shade(color, o.up ?? 0.22), bottom: shade(color, o.down ?? -0.22) },
    stroke: o.stroke === undefined ? 'rgba(25,15,5,.55)' : o.stroke,
    deco(c, bb) {
      if (o.volume !== false) volume(c, bb, { dark: 'rgba(0,0,20,.22)', light: 'rgba(255,255,255,.14)' });
      if (o.bevel) bevel(c, shapes, bb, { hi: 'rgba(255,255,255,.35)', lo: 'rgba(0,0,0,.3)' });
      if (o.deco) o.deco(c, bb);
    },
  };
}
/** Schlichte Fläche (Holz, Leinen, Stein ...) mit Volumen. */
export function flat(shapes, fill, o = {}) {
  return {
    shapes, fill, stroke: o.stroke,
    deco(c, bb) {
      if (o.volume !== false) volume(c, bb, o.vol || {});
      if (o.bevel) bevel(c, shapes, bb, o.bevelOpts || {});
      if (o.deco) o.deco(c, bb);
    },
  };
}

// ---- Malen --------------------------------------------------------------------------------------------------------------
export function fillShape(c, pts, color, alpha = 1) { fillPoly(c, pts, color, alpha); }
export function dotAt(c, x, y, r, color, alpha = 1) {
  const { ctx, tf, S } = c; const [X, Y] = tf(x, y);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X, Y, Math.max(0.8, r * S), 0, TAU); ctx.fill(); ctx.restore();
}
export function ln(c, pts, color, w, alpha = 1) { curve(c, pts, color, w, { alpha }); }
export function seg(c, a, b, color, w, alpha = 1) {
  const { ctx, tf, S } = c; const [x0, y0] = tf(a[0], a[1]), [x1, y1] = tf(b[0], b[1]);
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(0.8, w * S); ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore();
}
export function ellipseAt(c, x, y, rx, ry, color, alpha = 1, rot = 0) {
  const { ctx, tf, S } = c; const [X, Y] = tf(x, y);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(X, Y, Math.max(0.8, rx * S), Math.max(0.8, ry * S), -rot, 0, TAU); ctx.fill(); ctx.restore();
}
/** Parallele Streifen quer zu einer Mittellinie-Richtung ang (Standard: horizontale Bänder, von unten nach oben). */
export function bands(c, bb, colors, { y0 = bb.y0, y1 = bb.y1, n = 8, ang = 0, alpha = 1, curve = 0, cx = null } = {}) {
  const { ctx } = c;
  ctx.save(); ctx.globalAlpha = alpha;
  const dy = (y1 - y0) / n;
  const mx = cx ?? (bb.x0 + bb.x1) / 2;
  const xa = bb.x0 - 1, xb = bb.x1 + 1, steps = curve ? 18 : 1;
  const edge = (y, dir) => {
    const out = [];
    for (let k = 0; k <= steps; k++) {
      const x = xa + ((xb - xa) * k) / steps;
      out.push([x, y + Math.tan(ang) * (x - mx) - curve * (x - mx) * (x - mx)]);
    }
    return dir > 0 ? out : out.reverse();
  };
  for (let i = 0; i < n; i++) {
    const col = colors[i % colors.length]; if (!col) continue;
    const ya = y0 + dy * i, yb = ya + dy;
    const P = edge(ya - 0.02, 1).concat(edge(yb + 0.02, -1));
    ctx.fillStyle = col; pathPoly(c, P); ctx.fill();
  }
  ctx.restore();
}
/** Gefärbte Perle (Kreis mit Glanzpunkt). */
export function bead(c, x, y, r, color, hi = 'rgba(255,255,255,.55)') {
  dotAt(c, x, y, r, 'rgba(30,18,5,.6)'); dotAt(c, x, y, r * 0.84, color); dotAt(c, x - r * 0.28, y + r * 0.3, r * 0.28, hi);
}

// ---- Zierzeichen (nur Ornament, einfache echte Formen) -----------------------------------------------------------
// s = Höhe in Modelleinheiten, (x,y) = Fußmitte
const G = {
  ankh(c, x, y, s, col, w) {
    const { ctx, tf, S } = c; const [X, Y] = tf(x, y + s * 0.78);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, w * S); ctx.beginPath(); ctx.ellipse(X, Y, s * 0.17 * S, s * 0.21 * S, 0, 0, TAU); ctx.stroke(); ctx.restore();
    seg(c, [x, y], [x, y + s * 0.58], col, w); seg(c, [x - s * 0.28, y + s * 0.42], [x + s * 0.28, y + s * 0.42], col, w);
  },
  was(c, x, y, s, col, w) {
    seg(c, [x, y + s * 0.08], [x, y + s * 0.88], col, w);
    ln(c, [[x, y + s * 0.88], [x + s * 0.2, y + s * 0.98], [x + s * 0.24, y + s * 0.8]], col, w);
    seg(c, [x - s * 0.18, y], [x, y + s * 0.14], col, w); seg(c, [x + s * 0.18, y], [x, y + s * 0.14], col, w);
  },
  djed(c, x, y, s, col, w) {
    seg(c, [x, y], [x, y + s * 0.92], col, w * 1.1);
    for (let i = 0; i < 4; i++) seg(c, [x - s * 0.2, y + s * (0.62 + i * 0.11)], [x + s * 0.2, y + s * (0.62 + i * 0.11)], col, w * 0.8);
  },
  shen(c, x, y, s, col, w) {
    const { ctx, tf, S } = c; const [X, Y] = tf(x, y + s * 0.55);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, w * S); ctx.beginPath(); ctx.ellipse(X, Y, s * 0.26 * S, s * 0.38 * S, 0, 0, TAU); ctx.stroke(); ctx.restore();
    seg(c, [x - s * 0.34, y + s * 0.08], [x + s * 0.34, y + s * 0.08], col, w * 1.1);
  },
  sun(c, x, y, s, col, w) {
    const { ctx, tf, S } = c; const [X, Y] = tf(x, y + s * 0.5);
    ctx.save(); ctx.strokeStyle = col; ctx.lineWidth = Math.max(0.8, w * S); ctx.beginPath(); ctx.arc(X, Y, s * 0.38 * S, 0, TAU); ctx.stroke(); ctx.restore();
    dotAt(c, x, y + s * 0.5, s * 0.09, col);
  },
  water(c, x, y, s, col, w) {
    for (let i = 0; i < 3; i++) ln(c, [[x - s * 0.4, y + s * (0.2 + i * 0.28)], [x - s * 0.2, y + s * (0.32 + i * 0.28)], [x, y + s * (0.2 + i * 0.28)], [x + s * 0.2, y + s * (0.32 + i * 0.28)], [x + s * 0.4, y + s * (0.2 + i * 0.28)]], col, w);
  },
  feather(c, x, y, s, col, w) {
    ellipseAt(c, x, y + s * 0.58, s * 0.16, s * 0.4, col, 1);
    seg(c, [x, y], [x, y + s * 0.95], 'rgba(40,25,10,.7)', w * 0.6);
  },
  reed(c, x, y, s, col, w) {
    ln(c, [[x - s * 0.1, y], [x - s * 0.04, y + s * 0.5], [x + s * 0.06, y + s]], col, w);
    ellipseAt(c, x + s * 0.06, y + s * 0.88, s * 0.1, s * 0.22, col, 1, 0.3);
  },
  lotus(c, x, y, s, col, w) {
    ellipseAt(c, x, y + s * 0.55, s * 0.1, s * 0.34, col, 1);
    ellipseAt(c, x - s * 0.17, y + s * 0.5, s * 0.09, s * 0.3, col, 1, 0.4); ellipseAt(c, x + s * 0.17, y + s * 0.5, s * 0.09, s * 0.3, col, 1, -0.4);
    seg(c, [x, y], [x, y + s * 0.22], col, w);
  },
  eye(c, x, y, s, col, w) { // Udjat-Auge (vereinfacht)
    const { ctx, tf, S } = c;
    ctx.save(); ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = Math.max(0.8, w * S); ctx.lineCap = 'round';
    const P = (px, py) => tf(x + px * s, y + py * s);
    ctx.beginPath(); let a = P(-0.45, 0.5); ctx.moveTo(a[0], a[1]);
    let b = P(0, 0.76), d = P(0.45, 0.5); ctx.quadraticCurveTo(b[0], b[1], d[0], d[1]);
    b = P(0, 0.24); ctx.quadraticCurveTo(b[0], b[1], a[0], a[1]); ctx.stroke();
    const m = P(0, 0.5); ctx.beginPath(); ctx.arc(m[0], m[1], s * 0.11 * S, 0, TAU); ctx.fill();
    const brow1 = P(-0.4, 0.86), brow2 = P(0.4, 0.86); ctx.beginPath(); ctx.moveTo(brow1[0], brow1[1]); ctx.lineTo(brow2[0], brow2[1]); ctx.stroke();
    const t1 = P(0.1, 0.3), t2 = P(0.15, 0.04); ctx.beginPath(); ctx.moveTo(t1[0], t1[1]); ctx.lineTo(t2[0], t2[1]); ctx.stroke();
    ctx.restore();
  },
  bar(c, x, y, s, col, w) { seg(c, [x - s * 0.3, y + s * 0.5], [x + s * 0.3, y + s * 0.5], col, w * 1.3); },
  owl(c, x, y, s, col, w) { // Eule (m), stilisiert
    ellipseAt(c, x, y + s * 0.42, s * 0.22, s * 0.32, col, 1); dotAt(c, x - s * 0.06, y + s * 0.62, s * 0.05, 'rgba(255,245,210,.9)'); dotAt(c, x + s * 0.08, y + s * 0.62, s * 0.05, 'rgba(255,245,210,.9)');
    seg(c, [x - s * 0.1, y], [x - s * 0.1, y + s * 0.1], col, w); seg(c, [x + s * 0.1, y], [x + s * 0.1, y + s * 0.1], col, w);
  },
};
/** Zierzeichen malen. */
export function glyph(c, name, x, y, s, col = K.lapisLo, w = s * 0.07) { (G[name] || G.bar)(c, x, y, s, col, w); }
/** Reihe von Zierzeichen. */
export function frieze(c, names, x0, x1, y, s, col, w) {
  const n = names.length;
  for (let i = 0; i < n; i++) glyph(c, names[i], x0 + ((x1 - x0) * (i + 0.5)) / n, y, s, col, w ?? s * 0.07);
}

// ---- Uräus (Schlange) im Profil ----------------------------------------------------------------------------------------
/**
 * Aufgerichtete Uräusschlange im Profil (schaut nach +x), Fuß bei (x,y), Höhe s. Layer: Gold mit Lapis/Karneol-Haubenbändern.
 */
export function uraeusProfile(x, y, s) {
  const hood = blob(x + 0.0 * s, y + 0.5 * s, 0.2 * s, 0.3 * s, 0.12, 30);
  const neck = limb([[x + 0.0 * s, y + 0.7 * s, 0.14 * s], [x + 0.04 * s, y + 0.84 * s, 0.1 * s], [x + 0.1 * s, y + 0.9 * s, 0.09 * s]], { per: 6 });
  const head = blob(x + 0.1 * s, y + 0.91 * s, 0.13 * s, 0.085 * s, -0.08, 22);
  const base = limb([[x + 0.0 * s, y + 0.3 * s, 0.2 * s], [x + 0.02 * s, y + 0.14 * s, 0.2 * s], [x + 0.0 * s, y - 0.01 * s, 0.22 * s]], { per: 6, caps: false });
  const shapes = [hood, neck, head, base];
  return gold(shapes, {
    ang: 1.2, pos: 0.4, bevelOpts: { px: 1.2 },
    deco(c) {
      // Haubenbänder
      for (let i = 0; i < 4; i++) {
        const yy = y + (0.34 + i * 0.1) * s;
        ln(c, [[x - 0.2 * s, yy - 0.03 * s], [x + 0.0 * s, yy + 0.005 * s], [x + 0.2 * s, yy - 0.03 * s]], i % 2 ? K.carn : K.lapis, 0.045 * s, 0.95);
      }
      dotAt(c, x + 0.14 * s, y + 0.93 * s, 0.028 * s, K.black);
      dotAt(c, x + 0.147 * s, y + 0.94 * s, 0.008 * s, '#fff');
    },
  });
}

/** Uräus frontal (Haube + Kopf), Fuß bei (x,y), Höhe s. Layer. */
export function uraeusFront(x, y, s, { eye = true } = {}) {
  const hood = poly([[x, y + 0.14 * s], [x + 0.16 * s, y + 0.22 * s], [x + 0.3 * s, y + 0.46 * s], [x + 0.2 * s, y + 0.7 * s], [x + 0.1 * s, y + 0.74 * s], [x, y + 0.75 * s],
    [x - 0.1 * s, y + 0.74 * s], [x - 0.2 * s, y + 0.7 * s], [x - 0.3 * s, y + 0.46 * s], [x - 0.16 * s, y + 0.22 * s]], 2);
  const head = blob(x, y + 0.86 * s, 0.12 * s, 0.14 * s, 0, 20);
  const body = limb([[x, y + 0.3 * s, 0.22 * s], [x, y + 0.1 * s, 0.2 * s], [x, y - 0.0 * s, 0.2 * s]], { per: 5, caps: false });
  const shapes = [hood, head, body];
  return gold(shapes, {
    ang: 1.2, pos: 0.35, bevelOpts: { px: 1.2 }, stroke: 'rgba(100,60,8,.6)',
    deco(c) {
      for (let i = 0; i < 4; i++) {
        const yy = y + (0.3 + i * 0.1) * s, w = 0.3 - i * 0.03;
        ln(c, [[x - w * s, yy + 0.02 * s], [x, yy - 0.03 * s], [x + w * s, yy + 0.02 * s]], i % 2 ? K.carn : K.lapis, 0.05 * s, 0.95);
      }
      if (eye) { dotAt(c, x - 0.05 * s, y + 0.88 * s, 0.022 * s, K.black); dotAt(c, x + 0.05 * s, y + 0.88 * s, 0.022 * s, K.black); }
    },
  });
}

/** Geierkopf frontal (Nechbet): Hals, runder Kopf, Hakenschnabel nach unten. */
export function vultureFront(x, y, s) {
  const neck = limb([[x, y, 0.2 * s], [x, y + 0.45 * s, 0.17 * s], [x, y + 0.62 * s, 0.15 * s]], { per: 5, caps: false });
  const head = blob(x, y + 0.78 * s, 0.2 * s, 0.2 * s, 0, 24);
  const beak = poly([[x - 0.09 * s, y + 0.82 * s], [x + 0.09 * s, y + 0.82 * s], [x + 0.06 * s, y + 0.62 * s], [x, y + 0.5 * s], [x - 0.06 * s, y + 0.62 * s]], 2);
  const shapes = [neck, head, beak];
  return gold(shapes, {
    ang: 1.2, pos: 0.35, bevelOpts: { px: 1.2 }, stroke: 'rgba(100,60,8,.6)',
    deco(c) {
      for (let i = 0; i < 3; i++) ln(c, [[x - 0.13 * s, y + (0.2 + i * 0.1) * s], [x, y + (0.25 + i * 0.1) * s], [x + 0.13 * s, y + (0.2 + i * 0.1) * s]], i % 2 ? K.carn : K.lapis, 0.04 * s, 0.9);
      for (const sg of [-1, 1]) { dotAt(c, x + sg * 0.1 * s, y + 0.84 * s, 0.05 * s, K.lapisLo); dotAt(c, x + sg * 0.1 * s, y + 0.84 * s, 0.027 * s, K.black); }
      ln(c, [[x, y + 0.84 * s], [x, y + 0.56 * s]], K.goldLo, 0.02 * s, 0.7);
    },
  });
}

/** Fertige Layer verschieben/skalieren (z. B. Maske als Kopf eines Sargs): Formen und deco werden mit transformiert. */
export function place(layers, s = 1, dx = 0, dy = 0) {
  const tp = (p) => p.map(([x, y]) => [x * s + dx, y * s + dy]);
  const wrapC = (c) => Object.assign(Object.create(c), {
    tf: (x, y) => c.tf(x * s + dx, y * s + dy), px: (x, y) => c.tf(x * s + dx, y * s + dy), S: c.S * s,
  });
  return layers.map((l) => ({
    ...l, shapes: l.shapes.map(tp),
    deco: l.deco ? (c, bb) => l.deco(wrapC(c), { x0: (bb.x0 - dx) / s, x1: (bb.x1 - dx) / s, y0: (bb.y0 - dy) / s, y1: (bb.y1 - dy) / s, w: bb.w / s, h: bb.h / s }) : undefined,
  }));
}

// ---- Mengenoperationen (Clipper) --------------------------------------------------------------------------------------------
const SCL = 4000;
const toP = (p) => p.map(([x, y]) => ({ X: Math.round(x * SCL), Y: Math.round(y * SCL) }));
const fromP = (p) => p.map((q) => [q.X / SCL, q.Y / SCL]);
function runClip(type, subjects, clips) {
  const c = new ClipperLib.Clipper();
  for (const p of subjects) c.AddPath(toP(p), ClipperLib.PolyType.ptSubject, true);
  for (const p of clips) c.AddPath(toP(p), ClipperLib.PolyType.ptClip, true);
  const sol = new ClipperLib.Paths();
  c.Execute(type, sol, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return sol.map(fromP);
}
/** Schnittmenge: alle `subjects` (als Vereinigung) mit dem Polygon `clip`. */
export const intersect = (subjects, clip) => runClip(ClipperLib.ClipType.ctIntersection, subjects, [clip]);
/** Differenz: subjects minus clips (Listen von Polygonen). */
export const subtract = (subjects, clips) => runClip(ClipperLib.ClipType.ctDifference, subjects, clips);
/** Jedes Polygon einzeln auf `clip` beschneiden (Ergebnis: Liste von Polygonen). */
export function clipEach(polys, clip) { const out = []; for (const p of polys) out.push(...intersect([p], clip)); return out; }
/** Halbbreite eines symmetrischen Umrisses (Liste rechter Seitenpunkte) bei Höhe y – lineare Interpolation. */
export function halfWidthAt(ptsRight, y) {
  for (let i = 0; i < ptsRight.length - 1; i++) {
    const a = ptsRight[i], b = ptsRight[i + 1];
    if ((y <= a[1] && y >= b[1]) || (y >= a[1] && y <= b[1])) { const t = a[1] === b[1] ? 0 : (y - a[1]) / (b[1] - a[1]); return a[0] + (b[0] - a[0]) * t; }
  }
  return 0;
}
