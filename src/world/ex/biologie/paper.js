// Biologie: Papierschnitt-Malerei auf Canvas (Schichten mit weißem Rand und weichem Schatten) für Dioramen, Wandbilder und Falter.
import { mulberry32, TAU } from '../../../lib/util.js';

// Fläche mit Papierrand: erst weicher Schatten, dann weißer Rand, dann Füllung. path: (g) => void  (zeichnet den Pfad)
export function cutout(g, path, fill, { border = 5, shadow = 0.28, sx = 5, sy = 7, blur = 7, stroke = 'rgba(40,30,15,.28)', alpha = 1 } = {}) {
  g.save();
  if (shadow) { g.shadowColor = `rgba(20,15,5,${shadow})`; g.shadowBlur = blur; g.shadowOffsetX = sx; g.shadowOffsetY = sy; g.beginPath(); path(g); g.fillStyle = '#f6efdc'; g.lineJoin = 'round'; g.lineWidth = border * 2; g.strokeStyle = '#f6efdc'; g.stroke(); g.fill(); g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = g.shadowOffsetY = 0; }
  else { g.beginPath(); path(g); g.lineJoin = 'round'; g.lineWidth = border * 2; g.strokeStyle = '#f6efdc'; g.stroke(); }
  g.globalAlpha = alpha; g.beginPath(); path(g); g.fillStyle = fill; g.fill();
  if (stroke) { g.lineWidth = 1.4; g.strokeStyle = stroke; g.stroke(); }
  g.restore();
}
// Farnwedel (Fiedern entlang einer gebogenen Spindel), ang = Anfangsrichtung (rad), curl = Krümmung
export function frond(g, x, y, len, ang, curl, { fill = '#3f8a45', seed = 1, w = 0.2, n = 14, border = 3 } = {}) {
  const rnd = mulberry32(seed * 7 + 3), pts = []; let px = x, py = y, a = ang;
  for (let i = 0; i <= n; i++) { pts.push([px, py, a]); px += Math.cos(a) * len / n; py += Math.sin(a) * len / n; a += curl / n; }
  for (let i = 1; i <= n; i++) {
    const [qx, qy, qa] = pts[i], t = i / n, L = len * w * Math.sin(Math.PI * Math.min(1, t * 0.85 + 0.12)) * (1 - 0.5 * t) + 3;
    for (const s of [-1, 1]) { const a2 = qa + s * (1.0 - t * 0.3), ex = qx + Math.cos(a2) * L, ey = qy + Math.sin(a2) * L; cutout(g, (c) => { c.moveTo(qx, qy); c.quadraticCurveTo((qx + ex) / 2 + Math.cos(qa + s * 1.57) * 3, (qy + ey) / 2 + Math.sin(qa + s * 1.57) * 3, ex, ey); c.quadraticCurveTo((qx + ex) / 2 - Math.cos(qa + s * 1.57) * 3, (qy + ey) / 2 - Math.sin(qa + s * 1.57) * 3, qx, qy); }, fill, { border, shadow: 0.12, sx: 2, sy: 3, blur: 3, stroke: 'rgba(20,50,20,.35)' }); }
  }
  g.save(); g.lineCap = 'round'; g.lineWidth = 3; g.strokeStyle = 'rgba(20,50,20,.6)'; g.beginPath(); pts.forEach(([a, b], i) => (i ? g.lineTo(a, b) : g.moveTo(a, b))); g.stroke(); g.restore();
}
// Nadelbaum (Silhouette aus gestaffelten Dreiecken)
export function conifer(g, x, y, h, w, { fill = '#2f6a3f', trunk = '#6a4a2a', layers = 6 } = {}) {
  cutout(g, (c) => { c.rect(x - w * 0.045, y - h * 0.3, w * 0.09, h * 0.3); }, trunk, { border: 3, shadow: 0.15, sx: 3, sy: 4, blur: 4 });
  for (let i = 0; i < layers; i++) { const t = i / layers, yy = y - h * (0.18 + t * 0.72), ww = w * (1 - t * 0.78) / 2, hh = h * 0.24; cutout(g, (c) => { c.moveTo(x - ww, yy + hh * 0.5); c.lineTo(x, yy - hh * 0.6); c.lineTo(x + ww, yy + hh * 0.5); c.closePath(); }, fill, { border: 3, shadow: i === 0 ? 0.2 : 0.1, sx: 3, sy: 4, blur: 4 }); }
}
// Sägepalmfarn-Krone (Cycadee): dicker Stamm, Wedelkranz
export function cycad(g, x, y, h, { fill = '#4a9a4a', seed = 1 } = {}) {
  cutout(g, (c) => { c.moveTo(x - h * 0.07, y); c.quadraticCurveTo(x - h * 0.06, y - h * 0.5, x - h * 0.05, y - h * 0.62); c.lineTo(x + h * 0.05, y - h * 0.62); c.quadraticCurveTo(x + h * 0.07, y - h * 0.5, x + h * 0.08, y); c.closePath(); }, '#7a5a38', { border: 3, shadow: 0.15, sx: 3, sy: 4, blur: 4 });
  for (let i = 0; i < 9; i++) { const a = -Math.PI * (0.05 + (i / 8) * 0.9) , cu = (a > -Math.PI / 2 ? 1 : -1) * 0.9; frond(g, x, y - h * 0.62, h * 0.42, a, cu, { fill, seed: seed + i, w: 0.12, n: 12 }); }
}
// Hügelband: Wellenlinie als gefüllte Fläche bis zum Boden des Bildes
export function hills(g, w, h, y0, amp, freq, phase, fill, opts = {}) {
  cutout(g, (c) => { c.moveTo(0, h); for (let x = 0; x <= w; x += 8) c.lineTo(x, y0 + Math.sin(x / w * TAU * freq + phase) * amp + Math.sin(x / w * TAU * freq * 2.3 + phase * 1.7) * amp * 0.4); c.lineTo(w, h); c.closePath(); }, fill, { border: 4, ...opts });
}
export function paperBase(g, w, h, base = '#f1e9d2', seed = 3) { // Papierfläche mit Fasern (für Herbarbögen, Etiketten)
  const rnd = mulberry32(seed); g.fillStyle = base; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.07; for (let i = 0; i < 700; i++) { g.fillStyle = rnd() < 0.5 ? '#7a6030' : '#ffffff'; g.fillRect(rnd() * w, rnd() * h, 1 + rnd() * 3, 1); } g.globalAlpha = 1;
  g.strokeStyle = 'rgba(110,80,40,.07)'; g.lineWidth = 1; for (let i = 0; i < 90; i++) { const x = rnd() * w, y = rnd() * h, a = rnd() * TAU, l = 6 + rnd() * 16; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}
