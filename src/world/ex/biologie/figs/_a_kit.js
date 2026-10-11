// Gruppe A: gemeinsame Helfer (Kurven, Beine, Federn, Zähne, weiche Malflächen).
// Nur Werkzeug – jedes Tier setzt seine Kurven selbst.
import { limb, poly, xf, move, blob, spline } from '../../../../art/dsl.js';
import { mulberry32 } from '../../../../lib/util.js';
import { eye, dot, line, volume } from '../../../../art/paint.js';

// ---------- Kurven ----------------------------------------------------------------------------
// Centripetal Catmull-Rom durch Punkte [x,y] (offen oder geschlossen) -> dichte Polylinie
export function cr(pts, per = 10, closed = false) {
  const n = pts.length;
  const P = pts.map((p) => [p[0], p[1]]);
  const out = [];
  const get = (i) => (closed ? P[((i % n) + n) % n] : P[Math.max(0, Math.min(n - 1, i))]);
  const segs = closed ? n : n - 1;
  const d = (a, b) => Math.pow(Math.hypot(b[0] - a[0], b[1] - a[1]) + 1e-6, 0.5);
  for (let i = 0; i < segs; i++) {
    const p0 = get(i - 1), p1 = get(i), p2 = get(i + 1), p3 = get(i + 2);
    const t0 = 0, t1 = t0 + d(p0, p1), t2 = t1 + d(p1, p2), t3 = t2 + d(p2, p3);
    for (let j = 0; j < per; j++) {
      const t = t1 + ((t2 - t1) * j) / per;
      const lerp2 = (a, b, ta, tb) => [a[0] * ((tb - t) / (tb - ta)) + b[0] * ((t - ta) / (tb - ta)), a[1] * ((tb - t) / (tb - ta)) + b[1] * ((t - ta) / (tb - ta))];
      const A1 = lerp2(p0, p1, t0, t1), A2 = lerp2(p1, p2, t1, t2), A3 = lerp2(p2, p3, t2, t3);
      const B1 = lerp2(A1, A2, t0, t2), B2 = lerp2(A2, A3, t1, t3);
      out.push(lerp2(B1, B2, t1, t2));
    }
  }
  if (!closed) out.push(P[n - 1]);
  return out;
}
export const loop = (pts, per = 10) => cr(pts, per, true);
export const curve = (pts, per = 10) => cr(pts, per, false);

export const rotAbout = (p, cx, cy, ang) => p.map(([x, y]) => {
  const c = Math.cos(ang), s = Math.sin(ang), dx = x - cx, dy = y - cy;
  return [cx + dx * c - dy * s, cy + dx * s + dy * c];
});
export const rotPt = (pt, cx, cy, ang) => rotAbout([pt], cx, cy, ang)[0];

// obere / untere Kante eines Polygons bei x (für Streifen & Bauchfärbung)
export function edgeAt(poly, x, which = 'top') {
  let best = null;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const a = poly[j], b = poly[i];
    if ((a[0] <= x && b[0] > x) || (b[0] <= x && a[0] > x)) {
      const t = (x - a[0]) / (b[0] - a[0]);
      const y = a[1] + (b[1] - a[1]) * t;
      if (best === null || (which === 'top' ? y > best : y < best)) best = y;
    }
  }
  return best;
}
export const topAt = (p, x) => edgeAt(p, x, 'top');
export const botAt = (p, x) => edgeAt(p, x, 'bot');
// Kanten über eine Liste von Polygonen (Vereinigung)
export function topOf(polys, x) { let b = null; for (const p of polys) { const v = topAt(p, x); if (v !== null && (b === null || v > b)) b = v; } return b; }
export function botOf(polys, x) { let b = null; for (const p of polys) { const v = botAt(p, x); if (v !== null && (b === null || v < b)) b = v; } return b; }
// Band entlang der Unterkante einer Polygonliste
export function underBandOf(polys, x0, x1, th, n = 60) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n; const b = botOf(polys, x); if (b === null) continue;
    bot.push([x, b - 0.02]); top.push([x, b + (typeof th === 'function' ? th(x) : th)]);
  }
  return bot.concat(top.reverse());
}
export function overBandOf(polys, x0, x1, th, n = 60) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n; const t = topOf(polys, x); if (t === null) continue;
    top.push([x, t + 0.02]); bot.push([x, t - (typeof th === 'function' ? th(x) : th)]);
  }
  return top.concat(bot.reverse());
}

// Polygon-Band entlang der Unterkante: von x0 bis x1, Dicke th(x) über der Unterkante
export function underBand(p, x0, x1, th, n = 40) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const b = botAt(p, x); if (b === null) continue;
    bot.push([x, b - 0.02]);
    top.push([x, b + (typeof th === 'function' ? th(x) : th)]);
  }
  return bot.concat(top.reverse());
}
// Polygon-Band entlang der Oberkante
export function overBand(p, x0, x1, th, n = 40) {
  const top = [], bot = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const t = topAt(p, x); if (t === null) continue;
    top.push([x, t + 0.02]);
    bot.push([x, t - (typeof th === 'function' ? th(x) : th)]);
  }
  return top.concat(bot.reverse());
}

// ---------- weiche Malflächen -----------------------------------------------------------------
// Polygon mit weichem Rand (Schatten-Trick, ohne ctx.filter -> läuft auch auf Safari/iPad)
export function soft(c, pts, color, blurM = 0.04, alpha = 1) {
  const { ctx, tf, S } = c; const OFF = 6000;
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = Math.max(1, blurM * S); ctx.shadowOffsetX = OFF; ctx.shadowOffsetY = 0;
  ctx.globalAlpha = alpha; ctx.fillStyle = '#000';
  ctx.beginPath();
  pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X - OFF, Y); else ctx.moveTo(X - OFF, Y); });
  ctx.closePath(); ctx.fill();
  ctx.restore();
}
export function fillPoly(c, pts, color, alpha = 1) {
  const { ctx, tf } = c;
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
  pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  ctx.closePath(); ctx.fill(); ctx.restore();
}
export function strokePoly(c, pts, color, w, alpha = 1, closed = false) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.globalAlpha = alpha; ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, w * S); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
  if (closed) ctx.closePath(); ctx.stroke(); ctx.restore();
}
// Zugespitzter Streifen (breit oben, Spitze unten): von (x,y1) nach (x+dx,y2)
export function wedge(c, x, y1, y2, w, dx, color, alpha = 0.6) {
  const L = Math.hypot(dx, y2 - y1) || 1, nx = (y2 - y1) / L, ny = -dx / L; // Normale
  fillPoly(c, [[x - nx * w / 2, y1 - ny * w / 2], [x + nx * w / 2, y1 + ny * w / 2], [x + dx + nx * w * 0.08, y2 + ny * w * 0.08], [x + dx - nx * w * 0.08, y2 - ny * w * 0.08]], color, alpha);
}
// Streifen quer zu einer Kurve (Schwanzringe): an Position p mit Normalenrichtung ang, Länge len (beidseitig)
export function bar(c, p, ang, len, w, color, alpha = 0.6) {
  const dx = Math.cos(ang) * len / 2, dy = Math.sin(ang) * len / 2;
  strokePoly(c, [[p[0] - dx, p[1] - dy], [p[0] + dx, p[1] + dy]], color, w, alpha);
}

// ---------- Zähne -----------------------------------------------------------------------------
// n kleine Dreiecke entlang p0->p1; dir = +1 zeigt nach unten (Oberkiefer), -1 nach oben (Unterkiefer)
export function teethRow(p0, p1, n, h, w, dir = 1, bend = 0) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = (i + 0.5) / n, x = p0[0] + (p1[0] - p0[0]) * t, y = p0[1] + (p1[1] - p0[1]) * t;
    const hh = h * (1 - 0.25 * Math.abs(t - 0.5));
    out.push([[x - w / 2, y + dir * 0.004], [x + w / 2, y + dir * 0.004], [x + bend * h, y - dir * hh]]);
  }
  return out;
}

// ---------- Federn ----------------------------------------------------------------------------
// Feder entlang +x ab (0,0): Länge len, größte Breite w
export function featherShape(len, w, { tip = 0.12, base = 0.22 } = {}) {
  return limb([[0, 0, w * base], [len * 0.3, 0, w * 0.92], [len * 0.62, 0, w], [len * 0.88, 0, w * 0.62], [len, 0, w * tip]], { per: 6 });
}
export function featherAt(x, y, ang, len, w, o) { return xf(featherShape(len, w, o), { x, y, rot: ang }); }
// Fächer: n Federn von ang0 bis ang1 an Punkt (x,y); Länge len(t) mit t in 0..1
export function featherFan(x, y, ang0, ang1, n, len, w, o) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1);
    out.push(featherAt(x, y, ang0 + (ang1 - ang0) * t, typeof len === 'function' ? len(t, i) : len, typeof w === 'function' ? w(t, i) : w, o));
  }
  return out;
}

// ---------- Auge ------------------------------------------------------------------------------
export function bigEye(c, x, y, r, { color = '#1b120c', look = 0.2, white = '#fff7e0' } = {}) { eye(c, x, y, r, { color, look, white }); }

// ---------- Theropoden-Bein (Vorwärtskinematik + 2-Gelenk-IK) -------------------------------------
// Bein steht mit Zehen auf dem Boden (y=0). hip=[x,y]; foot = x der Zehenbasis; Segmentlängen L=[thigh,shin,meta];
// metaAng: Winkel des Mittelfußes gegen Horizontale (rad, ~1.2 = steil, nach hinten oben geneigt);
// widths: [hüfte, knie, knöchel, zehenbasis]; toe: Zehenlänge; toeW: Zehendicke
export function theropodLeg(o) {
  const { hip, foot, L, metaAng = 1.25, widths = [0.2, 0.12, 0.07, 0.06], toe = 0.2, toeW = 0.05, toes = 3, kneeSide = 1, heel = 0 } = o;
  const [hx, hy] = hip;
  const tb = [foot, toeW * 0.55 + 0.004];                                           // Zehenbasis (Gelenk)
  const ank = [tb[0] - Math.cos(metaAng) * L[2], tb[1] + Math.sin(metaAng) * L[2]];   // Knöchel (hinten/oben)
  const dx = ank[0] - hx, dy = ank[1] - hy;
  let d = Math.hypot(dx, dy);
  const maxd = L[0] + L[1] - 0.001; if (d > maxd) d = maxd;
  const a = (L[0] * L[0] - L[1] * L[1] + d * d) / (2 * d);
  const hh = Math.sqrt(Math.max(0, L[0] * L[0] - a * a));
  const ux = dx / Math.hypot(dx, dy), uy = dy / Math.hypot(dx, dy);
  // Normale n = (-uy, ux): zeigt bei nach unten gerichtetem Bein nach vorn (+x) -> Knie vorn
  const K = [hx + ux * a - uy * hh * kneeSide, hy + uy * a + ux * hh * kneeSide];
  // widths: [hüfte, oberschenkel-mitte, knie, wade, knöchel, zehenbasis]
  const W = widths.length === 4 ? [widths[0], widths[0] * 1.05, widths[1], widths[1] * 0.85, widths[2], widths[3]] : widths;
  const lp = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  const t30 = lp(hip, K, 0.38), s40 = lp(K, ank, 0.4);
  const thigh = limb([[hx, hy, W[0]], [t30[0], t30[1], W[1]], [K[0], K[1], W[2]]], { per: 10 });
  const shin = limb([[K[0], K[1], W[2]], [s40[0], s40[1], W[3]], [ank[0], ank[1], W[4]]], { per: 8 });
  const meta = limb([[ank[0], ank[1], W[4]], [tb[0], tb[1], W[5]]], { per: 4 });
  const toeList = [];
  const spread = toes === 3 ? [0.22, 0, -0.14] : toes === 4 ? [0.3, 0.1, -0.1, -0.35] : [0];
  const tl = [1, 1.18, 0.9];
  for (let i = 0; i < Math.min(toes, 3); i++) {
    const ang = -spread[i] * 0.35; // leichte Fächerung
    const len = toe * tl[i];
    toeList.push(limb([[tb[0], tb[1], toeW * 1.1], [tb[0] + Math.cos(ang) * len * 0.5, toeW * 0.5 + 0.002 + Math.sin(ang) * len * 0.1, toeW * 0.9], [tb[0] + Math.cos(ang) * len, toeW * 0.42, toeW * 0.5]], { per: 6 }));
  }
  const clawPts = toeList.map((t, i) => { const len = toe * tl[i]; return [tb[0] + len * 1.02, toeW * 0.38]; });
  return { shapes: [thigh, shin, meta].concat(toeList), thigh, shin, meta, toes: toeList, knee: K, ankle: ank, toeBase: tb, clawPts, toe, toeW };
}
// kleine dunkle Krallenspitzen (Polygone) an gegebenen Punkten
export function claws(pts, len = 0.04, w = 0.025, dirAng = -0.15) {
  return pts.map((p) => xf(poly([[0, w / 2], [len, 0], [0, -w / 2]]), { x: p[0] - len * 0.55, y: p[1], rot: dirAng }));
}

// ---------- Feder-Layer (jede Feder ein eigener Layer, mit Farbverlauf entlang der Federachse) ------------------
// f = {x,y,ang,len,w}; colors = [[t,color],...] (t 0 = Kiel, 1 = Spitze); rachis = Farbe der Mittelrippe oder null
export function featherLayer(f, colors, { rachis = 'rgba(255,245,225,0.35)', tipW = 0.12, base = 0.22, stroke, extra } = {}) {
  const shp = featherAt(f.x, f.y, f.ang, f.len, f.w, { tip: tipW, base });
  const x1 = f.x + Math.cos(f.ang) * f.len, y1 = f.y + Math.sin(f.ang) * f.len;
  const layer = {
    shapes: [shp], fill: colors[0][1],
    deco(c) {
      const { ctx, tf } = c; const [ax, ay] = tf(f.x, f.y), [bx, by] = tf(x1, y1);
      const g = ctx.createLinearGradient(ax, ay, bx, by); colors.forEach(([t, col]) => g.addColorStop(t, col));
      ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
      if (rachis) line(c, [[f.x + Math.cos(f.ang) * f.len * 0.08, f.y + Math.sin(f.ang) * f.len * 0.08], [f.x + Math.cos(f.ang) * f.len * 0.92, f.y + Math.sin(f.ang) * f.len * 0.92]], rachis, Math.max(0.0015, f.w * 0.07));
      if (extra) extra(c);
    },
  };
  if (stroke !== undefined) layer.stroke = stroke;
  return layer;
}
// Fächer aus Feder-Layern: spec(t,i) -> {ang,len,w}; Reihenfolge = Malreihenfolge (zuerst hinten)
export function featherLayers(x, y, n, spec, colorsFn, o) {
  const out = [];
  for (let i = 0; i < n; i++) {
    const t = n === 1 ? 0.5 : i / (n - 1); const s = spec(t, i);
    out.push(featherLayer({ x: s.x ?? x, y: s.y ?? y, ang: s.ang, len: s.len, w: s.w }, colorsFn(t, i), o));
  }
  return out;
}

// ---------- Vogel-/Flugsaurier-Flügel in Seitenansicht ---------------------------------------------------
// Kanonisch: Vorderkante (Arm+Hand) entlang +x ab Schulter S, Federn laufen zur +y-Seite ("hinten") und werden um theta gedreht.
// theta = Richtung der Vorderkante (rad, 90° = senkrecht nach oben, 180° = nach hinten). Rotation um S: + = gegen den Uhrzeigersinn
// (Flügel oben -> hinten/unten). Rückgabe: Layer-Liste (hinten -> vorn), Handgelenk-/Spitzenpunkte.
export function makeWing(o) {
  const { S, theta, L = 0.2, handFrac = 0.5, nSec = 6, nPrim = 8, secLen = 0.12, primLen = 0.18, fw = 0.045, pal, armW = [0.055, 0.04, 0.024], covers = 2, coverLen = 0.07, armFill, clawN = 0, clawLen = 0.03, fold = 0, noArm = false, rachis = 'rgba(255,245,225,0.28)' } = o;
  const fk = 1 - 0.82 * fold; // fold 1 = Federn liegen parallel zur Vorderkante (angelegter Flügel)
  const ct = Math.cos(theta), st = Math.sin(theta);
  const T = (u, v) => [S[0] + u * ct - v * st, S[1] + u * st + v * ct];
  const layers = [];
  const hs = handFrac; // Handgelenk bei u = L*hs
  // Armschwingen: von Handgelenk Richtung Schulter, Winkel wächst zur Schulter
  for (let i = 0; i < nSec; i++) {
    const t = nSec === 1 ? 0.5 : i / (nSec - 1);                // 0 = Handgelenk, 1 = Schulter
    const u = L * (hs - 0.04 - t * (hs - 0.14));
    const p = T(u, 0);
    const phi = (98 + t * 16) * fk * Math.PI / 180;
    const len = secLen * (1 - 0.3 * t);
    layers.push(featherLayer({ x: p[0], y: p[1], ang: phi + theta, len, w: fw * 1.1 }, pal('sec', i, t), { rachis }));
  }
  // Handschwingen: von innen (nahe Handgelenk) nach außen (Spitze), Winkel fällt zur Spitze
  for (let i = 0; i < nPrim; i++) {
    const t = nPrim === 1 ? 0.5 : i / (nPrim - 1);              // 0 = innen, 1 = außen
    const u = L * (hs + 0.02 + t * (0.97 - hs - 0.02));
    const p = T(u, 0);
    const phi = (84 - t * 62) * fk * Math.PI / 180;
    const prof = 0.74 + 0.26 * Math.sin(Math.PI * Math.min(1, 0.15 + t * 0.85)); // außen etwas kürzer
    const len = primLen * prof * (1 - 0.18 * t);
    layers.push(featherLayer({ x: p[0], y: p[1], ang: phi + theta, len, w: fw }, pal('prim', i, t), { rachis }));
  }
  // Deckfedern entlang der Vorderkante
  for (let r = 0; r < covers; r++) {
    const n = 6 - r;
    for (let i = 0; i < n; i++) {
      const t = i / (n - 1);
      const u = L * (0.12 + t * 0.78), p = T(u, 0.0);
      const phi = (100 - t * 26 + r * 6) * fk * Math.PI / 180;
      layers.push(featherLayer({ x: p[0], y: p[1], ang: phi + theta, len: coverLen * (1 - 0.15 * r) * (1 - 0.3 * t), w: fw * 1.15 }, pal('cover', i, t), { rachis }));
    }
  }
  // Vorderkante (Arm) als schlanker Strang
  const a0 = T(0, 0), a1 = T(L * 0.5, 0), a2 = T(L * 0.95, 0);
  if (!noArm) layers.push({ shapes: [limb([[a0[0], a0[1], armW[0]], [a1[0], a1[1], armW[1]], [a2[0], a2[1], armW[2]]], { per: 10 })], fill: armFill || '#7a5e48', deco(c, bb) { volume(c, bb); } });
  else layers.push({ shapes: [blob(a0[0] + (a1[0] - a0[0]) * 0.55, a0[1] + (a1[1] - a0[1]) * 0.55, L * 0.34, armW[0] * 0.7, theta, 24)], fill: armFill || '#7a5e48', deco(c, bb) { volume(c, bb); } });
  // Fingerkrallen (klein, vorn am Handgelenk)
  if (clawN) {
    const cl = [];
    for (let i = 0; i < clawN; i++) {
      const u = L * (hs - 0.04 + i * 0.065), p = T(u, -armW[2] * 0.7);
      const phi = (-70 + i * 16) * Math.PI / 180 + theta;
      cl.push(xf(poly([[0, 0.0075], [clawLen * (1 - i * 0.1), 0], [0, -0.0075]], 1), { x: p[0], y: p[1], rot: phi }));
    }
    layers.push({ shapes: cl, fill: '#4a3626', stroke: 'rgba(30,20,10,0.5)' });
  }
  return { layers, tip: T(L, 0), wrist: T(L * hs, 0) };
}

// ---------- Spec skalieren (alle Formen, Pivots, Anker, Malroutinen) ---------------------------------------
// So lässt sich ein Tier in bequemen Zahlen zeichnen und danach auf die echte Größe in Metern bringen.
export function scaleSpec(spec, k) {
  if (k === 1) return spec;
  const sc = (p) => p.map(([x, y]) => [x * k, y * k]);
  const parts = {};
  for (const [name, part] of Object.entries(spec.parts)) {
    const np = { ...part };
    if (part.pivot) np.pivot = [part.pivot[0] * k, part.pivot[1] * k];
    np.layers = part.layers.map((l) => {
      const nl = { ...l, shapes: l.shapes.map(sc) };
      if (l.deco) {
        nl.deco = (c, bb) => {
          const c2 = Object.assign({}, c, { tf: (x, y) => c.tf(x * k, y * k), S: c.S * k });
          const b2 = { x0: bb.x0 / k, x1: bb.x1 / k, y0: bb.y0 / k, y1: bb.y1 / k, w: bb.w / k, h: bb.h / k };
          return l.deco(c2, b2);
        };
      }
      return nl;
    });
    parts[name] = np;
  }
  const anchors = {};
  for (const [a, v] of Object.entries(spec.anchors || {})) anchors[a] = [v[0] * k, v[1] * k];
  return { ...spec, parts, anchors };
}

export { blob, limb, poly, xf, move, eye, dot, line };

// ---------- Flaum / Federbüschel entlang eines Strangs --------------------------------------------
// ctrl = [[x,y,w],...] wie bei limb (Richtung beliebig). side=+1 linke Seite (bei Fahrtrichtung +x oben), -1 rechts.
// Gibt kleine blattförmige Büschel zurück, die schräg nach hinten (gegen die Laufrichtung des Strangs, wenn back=true) zeigen.
export function fluff(ctrl, { side = 1, t0 = 0, t1 = 1, n = 20, len = 0.04, w = 0.03, tilt = 1.0, back = -1, seed = 3, jitter = 0.25, lenTaper = null, shape = 'leaf', inset = 0.85 } = {}) {
  // tilt: Gewicht der Rückwärtsneigung (0 = senkrecht zur Oberfläche, 1 = 45°, 3 = fast anliegend); back=-1: ctrl läuft Schwanz->Kopf
  const S = spline(ctrl, 14); const r = mulberry32(seed); const out = [];
  for (let i = 0; i < n; i++) {
    const t = t0 + ((t1 - t0) * (i + 0.5)) / n;
    const k = Math.min(S.length - 2, Math.max(1, Math.round(t * (S.length - 1))));
    const a = S[k - 1], b = S[k + 1], p = S[k];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const nx = -ty * side, ny = tx * side, h = p[2] / 2;
    const tl = tilt + (r() - 0.5) * jitter * 2;
    const dx = nx + tx * back * tl, dy = ny + ty * back * tl;
    const ang0 = Math.atan2(dy, dx);
    const L = len * (0.8 + r() * 0.4) * (lenTaper ? lenTaper(t) : 1);
    const px = p[0] + nx * h * inset, py = p[1] + ny * h * inset;
    const shp = shape === 'blob' ? blob(L * 0.42, 0, L * 0.58, w * 0.55, 0, 14) : limb([[0, 0, w * 0.5], [L * 0.45, 0, w], [L, 0, w * 0.12]], { per: 5 });
    out.push(xf(shp, { x: px, y: py, rot: ang0 }));
  }
  return out;
}
// Flecken im Rückenband (unter der Oberkante des Polygons p)
export function dorsalSpots(c, p, x0, x1, n, rmin, rmax, depth, color, alpha = 0.55) {
  const { ctx, tf, S } = c; const rg = c.rng;
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const x = x0 + (x1 - x0) * rg(); const t = topAt(p, x); if (t === null) continue;
    const d = typeof depth === 'function' ? depth(x) : depth; const y = t - 0.01 - rg() * d;
    const rad = rmin + rg() * (rmax - rmin); const [X, Y] = tf(x, y);
    ctx.beginPath(); ctx.ellipse(X, Y, rad * S, rad * S * (0.7 + rg() * 0.5), rg() * 3, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}
