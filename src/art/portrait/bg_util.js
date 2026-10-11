// Gemeinsame Bausteine für die Porträt-Hintergründe (Papierlagen mit Fach-Motiv)
import { rect, ell, spline, bez, TAU, mix, shade, tint, alpha, ribbon } from './paper.js';

export const C = (c, i, d) => (c && c[i]) || d;
// ganzflächiges Grundpapier (mit leichtem Farbverlauf)
export function base(P, col, col2) {
  P.cut(rect(-30, -30, 660, 860), col, { lift: 0, wob: 0, edge: false, line: false, step: 300, smooth: false, grad: false, deco: col2 ? (ctx) => { const g = ctx.createLinearGradient(0, 0, 0, 800); g.addColorStop(0, col); g.addColorStop(1, col2); ctx.fillStyle = g; ctx.fillRect(-30, -30, 660, 860); } : undefined });
}
// Scheibe mit gewelltem Rand hinter dem Kopf (Heiligenschein)
export function halo(P, G, col, r = 200, o = {}) {
  const n = 40, pts = []; for (let i = 0; i < n; i++) { const a = i / n * TAU, rr = r * (1 + (o.scallop ?? 0.03) * Math.sin(a * (o.k || 14))); pts.push([G.cx + Math.cos(a) * rr, (o.cy ?? G.Y(-0.1)) + Math.sin(a) * rr * (o.sy ?? 1)]); }
  return P.cut(pts, col, { lift: o.lift ?? 0.6, wob: 0.9, grad: o.grad });
}
// Wellenband: Oberkante als Sinus, unten gerade
export function band(P, y, h, col, { amp = 8, wl = 120, ph = 0, x0 = -20, x1 = 620, lift = 0.7, scallop = false, deco } = {}) {
  const top = [], n = Math.ceil((x1 - x0) / 10);
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; const t = (x / wl + ph) * TAU; top.push([x, y - (scallop ? Math.abs(Math.sin(t / 2)) * amp : Math.sin(t) * amp)]); }
  const pts = top.concat([[x1, y + h], [x0, y + h]]);
  return P.cut(pts, col, { lift, smooth: false, step: 10, wob: 0.6, deco });
}
export function star(P, x, y, r, col, pts = 4, o = {}) {
  const a = []; for (let i = 0; i < pts * 2; i++) { const rr = i % 2 ? r * (o.in ?? 0.28) : r, t = i / (pts * 2) * TAU - Math.PI / 2; a.push([x + Math.cos(t) * rr, y + Math.sin(t) * rr]); }
  return P.cut(a, col, { lift: o.lift ?? 0.3, smooth: false, wob: 0.2, edge: false, line: false, grad: false, step: 40 });
}
// Blatt: Länge len in Richtung ang, Breite w; Mittelrippe
export function leaf(P, x, y, len, ang, col, w = 0.4, o = {}) {
  const c = Math.cos(ang), s = Math.sin(ang), L = (u, v) => [x + c * u - s * v, y + s * u + c * v], hw = len * w / 2;
  const pts = [L(0, 0), L(len * 0.25, -hw * 0.9), L(len * 0.6, -hw), L(len * 0.9, -hw * 0.45), L(len, 0), L(len * 0.9, hw * 0.45), L(len * 0.6, hw), L(len * 0.25, hw * 0.9)];
  return P.cut(pts, col, { lift: o.lift ?? 0.55, wob: 0.5, deco: (ctx) => {
    ctx.strokeStyle = alpha(shade(col, 0.4), 0.45); ctx.lineWidth = 1.3; const a = L(0, 0), b = L(len * 0.95, 0); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke();
    ctx.lineWidth = 0.9; for (let i = 1; i < 5; i++) for (const sg of [-1, 1]) { const p = L(len * i * 0.17, 0), q = L(len * (i * 0.17 + 0.15), sg * hw * 0.8); ctx.beginPath(); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); ctx.stroke(); }
  } });
}
export function disc(P, x, y, r, col, o = {}) { return P.cut(ell(x, y, r, r * (o.sy ?? 1), o.n || 28), col, { lift: o.lift ?? 0.5, wob: o.wob ?? 0.6, grad: o.grad, edge: o.edge }); }
export function cloud(P, x, y, s, col) {
  P.cut([[x - 70 * s, y + 20 * s], [x - 60 * s, y - 6 * s], [x - 30 * s, y - 24 * s], [x, y - 14 * s], [x + 30 * s, y - 30 * s], [x + 62 * s, y - 8 * s], [x + 76 * s, y + 20 * s], [x + 30 * s, y + 28 * s], [x - 30 * s, y + 28 * s]], col, { lift: 0.4, wob: 0.8 });
}
// Dreieck mit heller und schattiger Fläche (Pyramide, Berg)
export function peak(P, x0, x1, yb, xp, yp, lit, dark, o = {}) {
  const xm = o.xm ?? xp + (x1 - xp) * 0.0;
  P.cut([[x0, yb], [xp, yp], [xm + (o.split ?? 0), yb]], lit, { lift: o.lift ?? 0.6, smooth: false, wob: 0.8, step: 14, grad: o.grad });
  P.cut([[xp, yp], [x1, yb], [xm + (o.split ?? 0), yb]], dark, { lift: 0.2, smooth: false, wob: 0.8, step: 14, grad: o.grad });
}
export function text(P, str, x, y, { font = 'italic 22px Georgia, serif', col = '#3a2a1c', align = 'center', a = 1, rot = 0 } = {}) {
  const { ctx } = P; ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.font = font; ctx.textAlign = align; ctx.textBaseline = 'middle'; ctx.globalAlpha = a; ctx.fillStyle = col; ctx.fillText(str, 0, 0); ctx.restore();
}
// Stängel als Papierstreifen
export function stem(P, pts, w, col, o = {}) {
  const r = ribbon(pts.map((p, i) => [p[0], p[1], w * (1 - 0.35 * i / (pts.length - 1))]), { step: 6 });
  return P.cut(r, col, { lift: o.lift ?? 0.4, wob: 0.4, grad: false, edge: false, line: false });
}
// Kolben (Rundkolben) mit Flüssigkeit
export function flask(P, x, y, r, liquid, o = {}) {
  const neckW = r * 0.34, neckH = r * (o.neck ?? 1.0);
  const glass = o.glass || '#e6f2f2';
  const body = ell(x, y, r, r, 28);
  // Glasform: Kreis + Hals
  P.cut(body, glass, { lift: 0.7, grad: false, deco: (ctx) => { const g = ctx.createLinearGradient(x - r, y - r, x + r, y + r); g.addColorStop(0, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(120,170,180,0.25)'); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); } });
  P.cut([[x - neckW, y - r - neckH], [x + neckW, y - r - neckH], [x + neckW * 1.05, y - r * 0.8], [x - neckW * 1.05, y - r * 0.8]], glass, { lift: 0.5, grad: false, smooth: false, step: 30, wob: 0.3 });
  if (liquid) P.cut(ell(x, y + r * 0.22, r * 0.86, r * 0.78, 24).map(([px, py]) => [px, Math.max(py, y + r * 0.0)]), liquid, { lift: 0, edge: false, line: false, grad: false, deco: (ctx) => { const g = ctx.createLinearGradient(0, y, 0, y + r); g.addColorStop(0, 'rgba(255,255,255,0.25)'); g.addColorStop(1, 'rgba(0,0,0,0.15)'); ctx.fillStyle = g; ctx.fillRect(x - r, y, r * 2, r); } });
  P.line([[x - r * 0.6, y - r * 0.25], [x - r * 0.45, y - r * 0.6], [x - r * 0.15, y - r * 0.78]], '#ffffff', 3, { a: 0.7 });
  if (o.cork !== false) P.cut([[x - neckW * 1.1, y - r - neckH - 10], [x + neckW * 1.1, y - r - neckH - 10], [x + neckW * 0.9, y - r - neckH + 6], [x - neckW * 0.9, y - r - neckH + 6]], '#b8864a', { lift: 0.5, smooth: false, wob: 0.3, step: 30 });
}
