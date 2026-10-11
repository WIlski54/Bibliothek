// Papierschnitt-Zeichner für die Porträts: Lagen aus farbigem Papier mit leicht unregelmäßig geschnittenen Kanten,
// hellem Schnittrand und weichem Schlagschatten, am Ende Papiermaserung und Passepartout.
// Reines Canvas-2D (kein THREE, kein Clipper), damit ein Porträt in wenigen Millisekunden fertig ist.
export const TAU = Math.PI * 2;

export function rngOf(seed) {
  let a = seed >>> 0;
  return () => { a = (a + 0x6d2b79f5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
export function hashStr(s) { let h = 2166136261; for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

// ---------------------------------------------------------------- Farben
const RGB = new Map();
export function rgb(c) {
  let v = RGB.get(c); if (v) return v;
  let h = c.slice(1); if (h.length === 3) h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  v = [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; RGB.set(c, v); return v;
}
const hx = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
export function mix(a, b, t) { const A = rgb(a), B = rgb(b); return '#' + hx(A[0] + (B[0] - A[0]) * t) + hx(A[1] + (B[1] - A[1]) * t) + hx(A[2] + (B[2] - A[2]) * t); }
export const shade = (c, t) => mix(c, '#24120a', t);
export const tint = (c, t) => mix(c, '#fff8e6', t);
export function alpha(c, a) { const v = rgb(c); return `rgba(${v[0]},${v[1]},${v[2]},${a})`; }

// ---------------------------------------------------------------- Kurven und Kanten
function cr(p0, p1, p2, p3, t) {
  const t2 = t * t, t3 = t2 * t;
  return [0.5 * (2 * p1[0] + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
    0.5 * (2 * p1[1] + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)];
}
// Catmull-Rom durch die Punkte (geschlossen oder offen), ca. alle `step` Pixel ein Stützpunkt
export function spline(pts, closed = true, step = 7) {
  const n = pts.length, out = [];
  const m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const p1 = pts[i], p2 = pts[(i + 1) % n];
    const p0 = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)], p3 = closed ? pts[(i + 2) % n] : pts[Math.min(n - 1, i + 2)];
    const k = Math.max(1, Math.ceil(Math.hypot(p2[0] - p1[0], p2[1] - p1[1]) / step));
    for (let j = 0; j < k; j++) out.push(cr(p0, p1, p2, p3, j / k));
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
// Gerade Schnitte: Zwischenpunkte auf den Strecken
export function subdiv(pts, closed = true, step = 12) {
  const n = pts.length, out = [], m = closed ? n : n - 1;
  for (let i = 0; i < m; i++) {
    const a = pts[i], b = pts[(i + 1) % n];
    const k = Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < k; j++) out.push([a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k]);
  }
  if (!closed) out.push(pts[n - 1]);
  return out;
}
// Unregelmäßigkeit der Schere: kleiner Zufallsgang quer zur Kante
export function wobble(pts, amp, rnd, closed = true) {
  if (!amp) return pts;
  const n = pts.length, out = new Array(n); let off = 0;
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)];
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    off = off * 0.5 + (rnd() - 0.5) * amp * 1.7;
    out[i] = [pts[i][0] - ty * off, pts[i][1] + tx * off];
  }
  return out;
}
export function signedArea(pts) { let a = 0; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) a += (pts[j][0] + pts[i][0]) * (pts[j][1] - pts[i][1]); return a / 2; }
// Wulstiger Rand (Locken, Fell, Bart): Ausbuchtungen nach außen
export function bumpy(pts, amp, wl, rnd, closed = true) {
  const n = pts.length, out = new Array(n), ccw = signedArea(pts) > 0 ? 1 : -1; let s = 0, ph = rnd() * 6;
  for (let i = 0; i < n; i++) {
    const a = pts[closed ? (i - 1 + n) % n : Math.max(0, i - 1)], b = pts[closed ? (i + 1) % n : Math.min(n - 1, i + 1)], p = pts[i];
    if (i) s += Math.hypot(p[0] - pts[i - 1][0], p[1] - pts[i - 1][1]);
    let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const w = Math.pow(Math.abs(Math.sin(Math.PI * s / wl + ph)), 0.6) * amp * (0.8 + 0.4 * rnd());
    out[i] = [p[0] + ty * w * ccw, p[1] - tx * w * ccw];
  }
  return out;
}

export function toPath(pts, closed = true) {
  const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) p.lineTo(pts[i][0], pts[i][1]);
  if (closed) p.closePath(); return p;
}
export function bboxOf(pts) { let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9; for (const p of pts) { if (p[0] < x0) x0 = p[0]; if (p[0] > x1) x1 = p[0]; if (p[1] < y0) y0 = p[1]; if (p[1] > y1) y1 = p[1]; } return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0, cx: (x0 + x1) / 2, cy: (y0 + y1) / 2 }; }

// ---------------------------------------------------------------- Formen
export function ell(cx, cy, rx, ry = rx, n = 20, rot = 0) {
  const o = [], c = Math.cos(rot), s = Math.sin(rot);
  for (let i = 0; i < n; i++) { const a = i / n * TAU, x = Math.cos(a) * rx, y = Math.sin(a) * ry; o.push([cx + x * c - y * s, cy + x * s + y * c]); }
  return o;
}
export const rect = (x, y, w, h) => [[x, y], [x + w, y], [x + w, y + h], [x, y + h]];
export function mirrorX(right, cx) { // rechte Hälfte (oben -> unten, erster/letzter Punkt auf der Mittelachse) -> geschlossene Form
  const l = []; for (let i = right.length - 2; i >= 1; i--) l.push([2 * cx - right[i][0], right[i][1]]);
  return right.concat(l);
}
export function mirrorPts(pts, cx) { return pts.map(([x, y]) => [2 * cx - x, y]).reverse(); }
export const lerp = (a, b, t) => a + (b - a) * t;
export function bez(p0, p1, p2, n = 10) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * p0[0] + 2 * u * t * p1[0] + t * t * p2[0], u * u * p0[1] + 2 * u * t * p1[1] + t * t * p2[1]]); } return o; }
export function bez3(p0, p1, p2, p3, n = 12) { const o = []; for (let i = 0; i <= n; i++) { const t = i / n, u = 1 - t; o.push([u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0], u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1]]); } return o; }
// Band entlang einer Mittellinie (Breite je Punkt), z. B. Stängel, Locken, Bart-Strähnen
export function ribbon(ctrl, { step = 6, caps = true } = {}) {
  const S = spline(ctrl.map((c) => [c[0], c[1]]), false, step), W = spline(ctrl.map((c, i) => [i, c[2] ?? 6]), false, step);
  const L = [], R = [];
  for (let i = 0; i < S.length; i++) {
    const a = S[Math.max(0, i - 1)], b = S[Math.min(S.length - 1, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
    const h = (W[Math.min(i, W.length - 1)][1] || 0) / 2; L.push([S[i][0] - ty * h, S[i][1] + tx * h]); R.push([S[i][0] + ty * h, S[i][1] - tx * h]);
  }
  return L.concat(R.reverse());
}

// ---------------------------------------------------------------- Maserung
let GRAIN = null;
function grainCanvas() {
  if (GRAIN) return GRAIN;
  const c = document.createElement('canvas'); c.width = c.height = 192; const g = c.getContext('2d'); const r = rngOf(4242);
  const img = g.createImageData(192, 192);
  for (let i = 0; i < 192 * 192; i++) { const v = 222 + Math.floor(r() * 33); img.data[i * 4] = v; img.data[i * 4 + 1] = v - 2; img.data[i * 4 + 2] = v - 7; img.data[i * 4 + 3] = 255; }
  g.putImageData(img, 0, 0);
  g.globalAlpha = 0.10; g.strokeStyle = '#6b5a3a'; g.lineWidth = 0.7;
  for (let i = 0; i < 150; i++) {
    const x = r() * 192, y = r() * 192, a = r() * 6.28, l = 5 + r() * 13;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 3, y + Math.sin(a) * l * 0.5 + r() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  g.globalAlpha = 0.5; g.strokeStyle = '#fff'; for (let i = 0; i < 60; i++) { const x = r() * 192, y = r() * 192, a = r() * 6.28, l = 4 + r() * 8; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  GRAIN = c; return c;
}

// ---------------------------------------------------------------- Der Zeichner
export class Paper {
  constructor(canvas, seed = 1, logicalW = 600) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { willReadFrequently: true }); this.k = canvas.width / logicalW;
    this.W = logicalW; this.H = canvas.height / this.k; this.rnd = rngOf(seed); this.seed = seed;
    this.ctx.scale(this.k, this.k);
  }
  // Eine Lage Papier. pts = Eckpunkte, fill = Farbe. o: smooth (Kurve, Standard), wob (Unruhe der Kante), lift (Schattenhöhe, 0 = kein Schatten),
  // grad ('v' | 'h' | false), edge (heller Schnittrand), deco(ctx, bbox) (Muster, auf die Lage beschnitten), bump {amp, wl}, line (Randfarbe)
  cut(pts, fill, o = {}) {
    const { ctx, k } = this; const smooth = o.smooth ?? true;
    let d = smooth ? spline(pts, true, o.step || 6) : subdiv(pts, true, o.step || 11);
    if (o.bump) d = bumpy(d, o.bump.amp, o.bump.wl, this.rnd);
    d = wobble(d, o.wob ?? 0.85, this.rnd);
    const path = toPath(d), bb = bboxOf(d), lift = o.lift ?? 1;
    ctx.save();
    if (lift > 0) {
      ctx.shadowColor = alpha('#2a1408', 0.30 * Math.min(1, 0.35 + lift * 0.65) * (o.shadow ?? 1));
      ctx.shadowBlur = (2.5 + 5 * lift) * k; ctx.shadowOffsetX = 1.0 * lift * k; ctx.shadowOffsetY = (1.4 + 2.6 * lift) * k;
    }
    let f = fill;
    if (o.grad !== false && typeof fill === 'string') {
      const gr = o.grad === 'h' ? ctx.createLinearGradient(bb.x0, 0, bb.x1, 0) : ctx.createLinearGradient(0, bb.y0, 0, bb.y1);
      gr.addColorStop(0, tint(fill, o.gl ?? 0.07)); gr.addColorStop(1, shade(fill, o.gd ?? 0.07)); f = gr;
    }
    ctx.fillStyle = f; ctx.fill(path);
    ctx.restore();
    ctx.save(); ctx.clip(path);
    if (o.deco) { ctx.save(); ctx.beginPath(); ctx.rect(bb.x0 - 1, bb.y0 - 1, bb.w + 2, bb.h + 2); ctx.clip(); o.deco(ctx, bb, path); ctx.restore(); }
    if (o.edge !== false) {
      const base = typeof fill === 'string' ? fill : '#d8c8a8';
      ctx.lineJoin = 'round';
      ctx.strokeStyle = alpha(tint(base, 0.5), 0.55); ctx.lineWidth = 2.4; ctx.stroke(path);
      if (Math.max(bb.w, bb.h) > 44) { // Lichtkante oben links, Schattenkante unten rechts (bei winzigen Teilen unnötig)
        ctx.save(); ctx.translate(-0.7, -0.8); ctx.strokeStyle = alpha('#fffaf0', 0.28); ctx.lineWidth = 1.6; ctx.stroke(path); ctx.restore();
        ctx.save(); ctx.translate(0.9, 1.1); ctx.strokeStyle = alpha('#1a0c04', 0.13); ctx.lineWidth = 1.6; ctx.stroke(path); ctx.restore();
      }
    }
    ctx.restore();
    if (o.line !== false) { ctx.save(); ctx.strokeStyle = o.line || alpha(shade(typeof fill === 'string' ? fill : '#8a7a5a', 0.45), 0.28); ctx.lineWidth = 0.8; ctx.lineJoin = 'round'; ctx.stroke(path); ctx.restore(); }
    return { path, bb, d };
  }
  // Strich (Falten, Haarsträhnen, Stängel). pts offen, glatt. o: a (Deckkraft), cap, shadow (Papierstreifen mit Schatten)
  line(pts, col, w = 2, o = {}) {
    const { ctx, k } = this; const d = o.smooth === false ? pts : spline(pts, false, 5);
    ctx.save(); ctx.strokeStyle = col; ctx.globalAlpha = o.a ?? 1; ctx.lineWidth = w; ctx.lineCap = o.cap || 'round'; ctx.lineJoin = 'round';
    if (o.shadow) { ctx.shadowColor = alpha('#2a1408', 0.3); ctx.shadowBlur = 3 * k; ctx.shadowOffsetY = 1.6 * k; ctx.shadowOffsetX = 0.6 * k; }
    ctx.beginPath(); ctx.moveTo(d[0][0], d[0][1]); for (let i = 1; i < d.length; i++) ctx.lineTo(d[i][0], d[i][1]); ctx.stroke(); ctx.restore();
  }
  dot(x, y, r, col, a = 1) { const { ctx } = this; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x, y, r, 0, TAU); ctx.fill(); ctx.restore(); }
  fillPts(pts, col, a = 1, smooth = true) { const { ctx } = this; const d = smooth ? spline(pts, true, 6) : pts; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(d[0][0], d[0][1]); for (let i = 1; i < d.length; i++) ctx.lineTo(d[i][0], d[i][1]); ctx.closePath(); ctx.fill(); ctx.restore(); }
  // weicher Lichtfleck/Schatten (ohne Kante), z. B. Wangenröte, Glühen
  glow(x, y, r, col, a = 0.4, sy = 1) {
    const { ctx } = this; ctx.save(); ctx.translate(x, y); ctx.scale(1, sy);
    const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r); g.addColorStop(0, alpha(col, a)); g.addColorStop(1, alpha(col, 0));
    ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, r, 0, TAU); ctx.fill(); ctx.restore();
  }
  // Lichtstreifen (Strahlenkranz u. ä.)
  fan(x, y, r, a0, a1, col, a = 0.2) { const { ctx } = this; ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a0) * r, y + Math.sin(a0) * r); ctx.lineTo(x + Math.cos(a1) * r, y + Math.sin(a1) * r); ctx.closePath(); ctx.fill(); ctx.restore(); }

  // Papiermaserung und leichte Randabdunklung: ein vorgerendertes, halbtransparentes Überzug-Bild (je Größe einmal)
  overlay() {
    const key = this.canvas.width + 'x' + this.canvas.height;
    let ov = OVERLAY.get(key);
    if (!ov) {
      ov = document.createElement('canvas'); ov.width = this.canvas.width; ov.height = this.canvas.height; const g = ov.getContext('2d', { willReadFrequently: true });
      const w = ov.width, h = ov.height, img = g.createImageData(w, h), r = rngOf(777), d = img.data;
      for (let i = 0; i < w * h; i++) { const v = r(); const dark = v < 0.5; const a = dark ? Math.pow(r(), 2.2) * 0.10 : Math.pow(r(), 2.4) * 0.08; d[i * 4] = dark ? 70 : 255; d[i * 4 + 1] = dark ? 48 : 250; d[i * 4 + 2] = dark ? 28 : 235; d[i * 4 + 3] = a * 255; }
      g.putImageData(img, 0, 0); g.scale(this.k, this.k);
      g.globalAlpha = 0.10; g.strokeStyle = '#4a3a22'; g.lineWidth = 0.7;
      for (let i = 0; i < 520; i++) { const x = r() * this.W, y = r() * this.H, a = r() * 6.28, l = 5 + r() * 14; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 3, y + Math.sin(a) * l * 0.5 + r() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
      g.globalAlpha = 1; const vg = g.createRadialGradient(this.W / 2, this.H * 0.45, this.H * 0.28, this.W / 2, this.H * 0.5, this.H * 0.75);
      vg.addColorStop(0, 'rgba(255,240,200,0)'); vg.addColorStop(1, 'rgba(60,30,10,0.20)'); g.fillStyle = vg; g.fillRect(0, 0, this.W, this.H);
      OVERLAY.set(key, ov);
    }
    return ov;
  }
  finish() { const { ctx } = this; ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(this.overlay(), 0, 0); ctx.restore(); }
  // Passepartout: cremefarbenes Papier mit unregelmäßig geschnittenem Fenster, Schatten fällt aufs Bild; innerer Zierstreifen in Fachfarbe.
  // Je Größe und Farbe einmal vorgerendert.
  mat(accent, m = 24) {
    const { ctx, canvas } = this; const key = canvas.width + 'x' + canvas.height + accent;
    let mc = MATS.get(key);
    if (!mc) {
      mc = document.createElement('canvas'); mc.width = canvas.width; mc.height = canvas.height;
      const sub = Object.create(Paper.prototype); sub.canvas = mc; sub.ctx = mc.getContext('2d', { willReadFrequently: true }); sub.k = this.k; sub.W = this.W; sub.H = this.H; sub.rnd = rngOf(hashStr(accent)); sub.ctx.scale(sub.k, sub.k);
      sub.drawMat(accent, m); MATS.set(key, mc);
    }
    ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(mc, 0, 0); ctx.restore();
  }
  drawMat(accent, m) {
    const { ctx, W, H } = this; const r = this.rnd;
    const win = [[m, m], [W - m, m], [W - m, H - m], [m, H - m]], win2 = [[m + 7, m + 7], [W - m - 7, m + 7], [W - m - 7, H - m - 7], [m + 7, H - m - 7]];
    const ring = wobble(subdiv(win, true, 14), 0.7, r), ring2 = wobble(subdiv(win2, true, 14), 0.7, r);
    const frame = (inner) => { const p = new Path2D(); p.rect(-10, -10, W + 20, H + 20); p.addPath(toPath(inner)); return p; };
    // Schatten des Papierrandes: Verläufe entlang der Fensterkanten (Licht von links oben)
    const shadow = (x0, y0, x1, y1, wTop, aTop, wBot, aBot) => {
      const strip = (ax, ay, bx, by, wd, a, rx, ry, rw, rh) => { const g = ctx.createLinearGradient(ax, ay, bx, by); g.addColorStop(0, `rgba(30,14,4,${a})`); g.addColorStop(1, 'rgba(30,14,4,0)'); ctx.fillStyle = g; ctx.fillRect(rx, ry, rw, rh); };
      strip(x0, y0, x0, y0 + wTop, wTop, aTop, x0, y0, x1 - x0, wTop);            // oben
      strip(x0, y0, x0 + wTop, y0, wTop, aTop, x0, y0, wTop, y1 - y0);            // links
      strip(x0, y1, x0, y1 - wBot, wBot, aBot, x0, y1 - wBot, x1 - x0, wBot);      // unten
      strip(x1, y0, x1 - wBot, y0, wBot, aBot, x1 - wBot, y0, wBot, y1 - y0);     // rechts
    };
    ctx.fillStyle = accent; ctx.fill(frame(ring2), 'evenodd');
    shadow(m + 7, m + 7, W - m - 7, H - m - 7, 15, 0.42, 6, 0.2);
    const cream = ctx.createLinearGradient(0, 0, W, H); cream.addColorStop(0, '#f6ecd4'); cream.addColorStop(1, '#e9dcbc');
    ctx.save(); ctx.clip(frame(ring2), 'evenodd'); shadow(m, m, W - m, H - m, 8, 0.38, 4, 0.2); ctx.restore();
    ctx.fillStyle = cream; ctx.fill(frame(ring), 'evenodd');
    ctx.save(); ctx.clip(frame(ring), 'evenodd'); ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2; ctx.stroke(toPath(ring)); ctx.restore();
    // Maserung auf das Papier (nur dort, wo schon etwas liegt)
    ctx.save(); ctx.globalCompositeOperation = 'source-atop'; ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.drawImage(this.overlay(), 0, 0); ctx.restore();
  }
}
const OVERLAY = new Map(), MATS = new Map();
