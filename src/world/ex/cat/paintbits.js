// Kleine Mal-Helfer für Gesicht und Fell (alles in Designeinheiten = cm, y nach oben). c = Mal-Kontext aus lib/papercut.js.
import { kit } from './kit.js';
import { C } from './palette.js';

export const K = kit(0.01);
const U = 0.01;
const px = (c, x, y) => c.tf(x * U, y * U);

// Tabby-Strich: verjüngter Pinselstrich von (x,y) in Richtung ang (rad), Länge l, Breite w (cm)
export function stripe(c, x, y, ang, l, w, color = C.stripe, alpha = 0.55, bend = 0.25) {
  const { ctx, S } = c; const [X, Y] = px(c, x, y), [X2, Y2] = px(c, x + Math.cos(ang) * l, y + Math.sin(ang) * l);
  const dx = X2 - X, dy = Y2 - Y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, wp = Math.max(1, w * U * S), cv = bend * L * 0.3;
  const mx = (X + X2) / 2 + nx * cv, my = (Y + Y2) / 2 + ny * cv;
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha; ctx.beginPath(); ctx.moveTo(X + nx * wp / 2, Y + ny * wp / 2);
  ctx.quadraticCurveTo(mx + nx * wp * 0.5, my + ny * wp * 0.5, X2, Y2); ctx.quadraticCurveTo(mx - nx * wp * 0.5, my - ny * wp * 0.5, X - nx * wp / 2, Y - ny * wp / 2); ctx.closePath(); ctx.fill(); ctx.restore();
}

// weicher Schlagschatten einer Form (Polygone in Metern) auf die aktuelle Lage: dx,dy in cm, Unschärfe in cm
export function dropShadow(c, polys, { dx = 0.5, dy = -1.3, blur = 1.6, alpha = 0.34, color = '30,20,34' } = {}) {
  const { ctx, S } = c; const off = 4000;
  ctx.save(); ctx.shadowColor = `rgba(${color},${alpha})`; ctx.shadowBlur = blur * U * S; ctx.shadowOffsetX = off + dx * U * S; ctx.shadowOffsetY = -dy * U * S;
  ctx.fillStyle = '#000'; ctx.beginPath();
  for (const p of polys) { p.forEach(([x, y], i) => { const [X, Y] = c.tf(x, y); if (i) ctx.lineTo(X - off, Y); else ctx.moveTo(X - off, Y); }); ctx.closePath(); }
  ctx.fill(); ctx.restore();
}

// Auge von vorn. lid = Anteil des Auges, den das obere Lid verdeckt (0 = weit offen). tilt = Lidkante (cm Höhenunterschied außen minus innen)
export function eyeFront(c, x, y, { r = 3.4, lid = 0.3, side = 1, tilt = -0.1, pup = 0.3, look = 0 } = {}) {
  const { ctx, S } = c; const [X0, Y0] = px(c, x, y), R = r * U * S;
  const X = X0 + R * look, Y = Y0;
  ctx.save();
  ctx.beginPath(); ctx.arc(X0, Y0, R, 0, 6.2832); ctx.clip();
  // Lidgrenze (Bildschirmkoordinaten, y nach unten): innen etwas tiefer als außen = freundlich-überlegen
  const yb = Y0 - R + 2 * R * lid, ti = tilt * U * S;
  ctx.beginPath(); ctx.moveTo(X0 - R * 1.3, yb + (side > 0 ? ti : -ti)); ctx.lineTo(X0 + R * 1.3, yb + (side > 0 ? -ti : ti)); ctx.lineTo(X0 + R * 1.3, Y0 + R * 1.3); ctx.lineTo(X0 - R * 1.3, Y0 + R * 1.3); ctx.closePath(); ctx.clip();
  const g = ctx.createRadialGradient(X, Y - R * 0.15, R * 0.1, X, Y, R * 1.05);
  g.addColorStop(0, '#e4f58a'); g.addColorStop(0.45, C.iris); g.addColorStop(0.85, C.irisDark); g.addColorStop(1, C.irisRim);
  ctx.fillStyle = g; ctx.fillRect(X0 - R * 1.3, Y0 - R * 1.3, R * 2.6, R * 2.6);
  // Pupille: senkrechter Schlitz
  ctx.fillStyle = C.pupil; ctx.beginPath(); ctx.ellipse(X + R * 0.02, Y + R * 0.04, R * pup, R * 0.84, 0, 0, 6.2832); ctx.fill();
  // Glanzlichter
  ctx.fillStyle = '#fffdf2'; ctx.beginPath(); ctx.arc(X - R * 0.32, Y - R * 0.12, R * 0.26, 0, 6.2832); ctx.fill();
  ctx.globalAlpha = 0.8; ctx.beginPath(); ctx.arc(X + R * 0.34, Y + R * 0.42, R * 0.11, 0, 6.2832); ctx.fill();
  ctx.restore();
  // Lidkante und Lidstrich
  ctx.save(); ctx.strokeStyle = C.dark; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.5, R * 0.15);
  ctx.beginPath();
  if (lid > 0.02) { ctx.moveTo(X0 - R * 1.04, yb + (side > 0 ? ti : -ti)); ctx.lineTo(X0 + R * 1.04, yb + (side > 0 ? -ti : ti)); }
  else ctx.arc(X0, Y0, R * 1.02, 3.4, 6.0);
  ctx.stroke();
  // Lidstrich-Schwung nach außen (wie bei der ägyptischen Katze)
  ctx.lineWidth = Math.max(1.2, R * 0.12); ctx.beginPath();
  const ox = X0 + side * R * 1.02, oy = yb + (side > 0 ? -ti : ti);
  ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + side * R * 0.28, oy - R * 0.02, ox + side * R * 0.48, oy - R * 0.3); ctx.stroke();
  // untere Kante zart
  ctx.globalAlpha = 0.55; ctx.lineWidth = Math.max(1, R * 0.1); ctx.beginPath(); ctx.arc(X0, Y0, R * 1.0, 0.25, Math.PI - 0.25); ctx.stroke();
  ctx.restore();
}

// geschlossenes Auge: Bogen nach unten (Blinzeln, Schlaf) oder nach oben (fröhlich, "^")
export function eyeClosed(c, x, y, { r = 3.4, side = 1, happy = false } = {}) {
  const { ctx, S } = c; const [X, Y] = px(c, x, y), R = r * U * S;
  ctx.save(); ctx.strokeStyle = C.dark; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.lineWidth = Math.max(1.6, R * 0.22);
  ctx.beginPath();
  if (happy) { ctx.moveTo(X - R * 0.95, Y + R * 0.3); ctx.quadraticCurveTo(X, Y - R * 1.0, X + R * 0.95, Y + R * 0.3); }
  else { ctx.moveTo(X - R * 0.98, Y - R * 0.12); ctx.quadraticCurveTo(X, Y + R * 0.62, X + R * 0.98, Y - R * 0.12); }
  ctx.stroke();
  ctx.lineWidth = Math.max(1.2, R * 0.15); ctx.beginPath();
  const ox = X + side * R * 0.98, oy = happy ? Y + R * 0.3 : Y - R * 0.12;
  ctx.moveTo(ox, oy); ctx.quadraticCurveTo(ox + side * R * 0.4, oy - R * 0.02, ox + side * R * 0.72, oy - R * 0.38); ctx.stroke();
  ctx.restore();
}

// Näschen und Mund von vorn (x,y = Nasenmitte). open = 0 geschlossen, bis 1 = miauend (offener Mund mit Zunge). Bildschirm-y zeigt nach unten.
export function noseMouth(c, x, y, { open = 0, scale = 1 } = {}) {
  const { ctx, S } = c; const [X, Y] = px(c, x, y), s = scale * U * S;
  ctx.save(); ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  if (open > 0) { // Mund auf: dunkelrote Höhle, rosa Zunge
    const mw = 2.5 * s, mh = 5.4 * s * open, top = Y + 1.9 * s;
    ctx.fillStyle = '#6b222c'; ctx.beginPath(); ctx.moveTo(X - mw, top); ctx.quadraticCurveTo(X, top + 1.0 * s, X + mw, top); ctx.quadraticCurveTo(X + mw * 0.92, top + mh, X, top + mh * 1.04); ctx.quadraticCurveTo(X - mw * 0.92, top + mh, X - mw, top); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#f08c98'; ctx.beginPath(); ctx.ellipse(X, top + mh * 0.82, mw * 0.62, mh * 0.2, 0, 0, 6.2832); ctx.fill();
    ctx.strokeStyle = C.mouth; ctx.lineWidth = Math.max(1, 0.3 * s); ctx.beginPath(); ctx.moveTo(X, Y + 0.4 * s); ctx.lineTo(X, top + 0.6 * s); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(X - mw, top); ctx.quadraticCurveTo(X, top + 1.0 * s, X + mw, top); ctx.stroke();
  } else { // geschlossen: kleines "w"
    ctx.strokeStyle = C.mouth; ctx.lineWidth = Math.max(1, 0.3 * s); ctx.beginPath();
    ctx.moveTo(X, Y + 0.6 * s); ctx.lineTo(X, Y + 1.9 * s);
    ctx.moveTo(X, Y + 1.9 * s); ctx.quadraticCurveTo(X - 0.9 * s, Y + 3.2 * s, X - 2.5 * s, Y + 2.3 * s);
    ctx.moveTo(X, Y + 1.9 * s); ctx.quadraticCurveTo(X + 0.9 * s, Y + 3.2 * s, X + 2.5 * s, Y + 2.3 * s);
    ctx.stroke();
  }
  // Nase: gerundetes Dreieck (Spitze nach unten)
  ctx.fillStyle = C.nose; ctx.strokeStyle = 'rgba(120,50,60,.8)'; ctx.lineWidth = Math.max(1, 0.2 * s);
  ctx.beginPath(); ctx.moveTo(X - 1.8 * s, Y - 0.9 * s); ctx.quadraticCurveTo(X, Y - 1.5 * s, X + 1.8 * s, Y - 0.9 * s); ctx.quadraticCurveTo(X + 1.3 * s, Y + 0.4 * s, X, Y + 0.9 * s); ctx.quadraticCurveTo(X - 1.3 * s, Y + 0.4 * s, X - 1.8 * s, Y - 0.9 * s); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,.6)'; ctx.beginPath(); ctx.ellipse(X - 0.5 * s, Y - 0.6 * s, 0.55 * s, 0.25 * s, -0.2, 0, 6.2832); ctx.fill();
  ctx.restore();
}

// Farbverlauf-Hilfen: Farbe eines Verlaufs (stops [[t,'#rrggbb'],..]) bei t, und Stopps für ein Teil, das denselben Verlauf in absoluten Höhen fortsetzt
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
export function gradAt(stops, t) {
  t = Math.min(1, Math.max(0, t));
  for (let i = 1; i < stops.length; i++) if (t <= stops[i][0]) {
    const [t0, c0] = stops[i - 1], [t1, c1] = stops[i], k = (t - t0) / ((t1 - t0) || 1), a = hex(c0), b = hex(c1);
    return '#' + a.map((v, j) => Math.round(v + (b[j] - v) * k).toString(16).padStart(2, '0')).join('');
  }
  return stops[stops.length - 1][1];
}
// Höhenbereich [y0,y1] (cm) der Vereinigung von Formen
export function spanY(shapes) {
  let y0 = 1e9, y1 = -1e9; for (const p of shapes) for (const q of p) { y0 = Math.min(y0, q[1]); y1 = Math.max(y1, q[1]); } return [y0 * 100, y1 * 100];
}
// Verlauf für Teil mit Höhen [ly0,ly1], der den Körperverlauf (stops über [by0,by1]) fortsetzt
export function continueGrad(stops, [by0, by1], [ly0, ly1], n = 6) {
  const out = []; for (let i = 0; i < n; i++) { const t = i / (n - 1), y = ly1 - t * (ly1 - ly0); out.push([t, gradAt(stops, (by1 - y) / (by1 - by0))]); } return out;
}
