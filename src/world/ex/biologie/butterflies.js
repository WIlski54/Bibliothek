// Biologie: Schmetterlings-Schaukasten. Sechs heimische Tagfalter als Papierschnitt (Technik aus den Popup-Büchern), farblich nach den echten Arten gemalt.
import * as THREE from 'three';
import { Figure } from '../../../lib/figure.js';
import { limb, blob, poly } from '../../../art/dsl.js';
import { M, mat, box } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF, glassSheen, woodMid } from './style.js';
import { litFigure } from './trexcase.js';

// ---- Umrisse der rechten Flügel (mm, Körperachse x=0, Kopf oben). Die linke Seite wird gespiegelt.
const WINGS = {
  pfauenauge: { // Tagpfauenauge, Spannweite ca. 52 mm
    fw: [[1, 5], [6, 8], [12, 11], [18, 13.2], [23, 14.2], [26.2, 12.4], [26.8, 9], [25.2, 5.5], [24, 3], [22.5, 0.6], [17, -1.8], [10, -2], [4.5, -0.5], [1, 1]],
    hw: [[1, 1.5], [8, 2.6], [15, 1], [21, -1.5], [24.5, -5], [24.8, -9.5], [22.2, -13.2], [18, -15], [13.5, -15.6], [9, -14], [5, -11], [2, -7], [1, -3]],
  },
  zitronenfalter: { // Zitronenfalter, ca. 55 mm, Flügelspitzen eckig
    fw: [[1, 4.5], [8, 7], [15, 9.5], [21, 10.8], [26, 10.2], [28.4, 8], [26.5, 5.2], [24, 2.5], [21, 0.4], [14, -1.5], [8, -1.8], [3.5, -0.4], [1, 1]],
    hw: [[1, 1.5], [9, 2.4], [17, 0.2], [23.5, -4.2], [27.4, -9.5], [26, -12.6], [21, -13.8], [15, -12.5], [9.5, -10], [5, -6.5], [2, -3.5], [1, -1.5]],
  },
  admiral: { // Admiral, ca. 56 mm
    fw: [[1, 4.5], [8, 7.5], [15, 10.5], [22, 12.6], [27, 12.6], [29.2, 11], [27.5, 8.5], [25.6, 5], [24, 1.6], [18, -0.8], [11, -1.4], [5, -0.5], [1, 1]],
    hw: [[1, 1.5], [9, 2.5], [17, 0.8], [22, -3], [24.5, -7.5], [22.5, -11.4], [17.5, -13.4], [11.5, -12.8], [6, -10], [2, -6], [1, -2.5]],
  },
  fuchs: { // Kleiner Fuchs, ca. 48 mm
    fw: [[1, 4.5], [6, 7.2], [12, 9.8], [17.5, 11.6], [21.5, 12], [23.8, 10.3], [23.4, 7], [22.2, 4.4], [21, 2.2], [17.5, 0.2], [11, -1], [5, -0.4], [1, 1]],
    hw: [[1, 1.5], [8, 2.4], [15, 1], [20, -1.6], [22.5, -5.2], [22.2, -9], [19.6, -12], [15, -13.2], [10.4, -12.4], [6, -9.6], [2.4, -6], [1, -2.6]],
  },
  aurora: { // Aurorafalter (Männchen), ca. 44 mm
    fw: [[1, 4.5], [6, 7], [12, 9.6], [17, 11.6], [20.6, 12.2], [22.6, 10.6], [22.4, 7.4], [21, 4], [19.2, 1.4], [14.5, -0.6], [8, -1.4], [3.5, -0.4], [1, 1]],
    hw: [[1, 1.5], [8, 2.4], [14.5, 1.2], [19.5, -1.6], [21.5, -5.4], [20.4, -9.2], [16.6, -11.2], [11.6, -10.8], [7, -8.2], [3, -4.6], [1, -2]],
  },
  schwalbenschwanz: { // Schwalbenschwanz, ca. 72 mm, mit Schwänzchen
    fw: [[1, 5], [9, 9], [18, 13], [27, 16], [33, 15.5], [35.6, 12], [34, 7.5], [31, 3.5], [28, 0.5], [22, -1.5], [12, -2.5], [5, -1], [1, 1]],
    hw: [[1, 1.5], [12, 3.5], [22, 1.5], [29, -3], [33, -9], [34.2, -13], [32.5, -17.5], [31, -23.5], [29.8, -27], [27.6, -24], [25.4, -19.5], [21.5, -17], [15, -15.4], [9, -12], [4, -8], [1, -4]],
  },
};
const mir = (p) => p.map(([x, y]) => [-x, y]);
const wingShape = (pts) => poly(pts, 2);

// ---- Malwerkzeug in Modellkoordinaten (mm); side = +1 rechts, -1 links
function tools(c, side) {
  const { ctx, tf, S } = c; const X = (x, y) => tf(side * x, y);
  const path = (pts, close = true) => { ctx.beginPath(); pts.forEach(([x, y], i) => { const [a, b] = X(x, y); if (i) ctx.lineTo(a, b); else ctx.moveTo(a, b); }); if (close) ctx.closePath(); };
  return {
    poly(pts, fill, a = 1) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = fill; path(pts); ctx.fill(); ctx.restore(); },
    smooth(pts, fill, a = 1) { ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); const P = pts.map(([x, y]) => X(x, y)); ctx.moveTo((P[0][0] + P[P.length - 1][0]) / 2, (P[0][1] + P[P.length - 1][1]) / 2); for (let i = 0; i < P.length; i++) { const n = P[(i + 1) % P.length]; ctx.quadraticCurveTo(P[i][0], P[i][1], (P[i][0] + n[0]) / 2, (P[i][1] + n[1]) / 2); } ctx.fill(); ctx.restore(); },
    dot(x, y, r, fill, a = 1, sy = 1) { const [px, py] = X(x, y); ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = fill; ctx.beginPath(); ctx.ellipse(px, py, r * S, r * S * sy, 0, 0, TAU); ctx.fill(); ctx.restore(); },
    ring(x, y, r, col, w, a = 1) { const [px, py] = X(x, y); ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w * S; ctx.beginPath(); ctx.arc(px, py, r * S, 0, TAU); ctx.stroke(); ctx.restore(); },
    line(pts, col, w, a = 1) { ctx.save(); ctx.globalAlpha = a; ctx.strokeStyle = col; ctx.lineWidth = w * S; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; path(pts, false); ctx.stroke(); ctx.restore(); },
    path, X, S, ctx,
  };
}
const both = (c, fn) => { fn(tools(c, 1), 1); fn(tools(c, -1), -1); };
const ARC = (cx, cy, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => [cx + Math.cos(a0 + ((a1 - a0) * i) / n) * r, cy + Math.sin(a0 + ((a1 - a0) * i) / n) * r]);
// Adern von der Flügelwurzel zu Punkten am Rand
const veins = (T, base, ends, col, w, a) => { for (const e of ends) T.line([base, [(base[0] + e[0]) / 2 + 0.3, (base[1] + e[1]) / 2], e], col, w, a); };

// ---- Malerei der sechs Arten (deco der Flügelschicht)
const PAINT = {
  pfauenauge(c) {
    const g = c.ctx, [x0, y0] = c.tf(-30, 20), [x1, y1] = c.tf(30, -20); const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#d8562a'); gr.addColorStop(0.5, '#b8402a'); gr.addColorStop(1, '#8a2c22'); g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H);
    both(c, (T) => {
      T.line([[27, 5], [25.6, 9], [26.6, 12.6], [22, 14.6], [15, 13.6]], '#2a1810', 3.2, 0.95); T.line([[24.4, 3], [22.6, 0.6], [17, -1.8], [10, -2]], '#2a1810', 2.2, 0.9);
      T.line([[23, -1.5], [24.6, -5], [24.9, -9.5], [22.2, -13.2], [18, -15.2], [13.5, -15.8], [9, -14]], '#2a1810', 3.4, 0.95);
      for (const [a, b] of [[16, 12.3], [19.2, 13.3], [22.4, 13.4]]) T.line([[a, b], [a + 1.2, b - 1.8]], '#e9d68a', 0.9, 0.9);
      T.dot(19.8, 8.4, 4.6, '#2a1810'); T.dot(19.8, 8.4, 3.6, '#e9d68a'); T.dot(19.8, 8.4, 3.0, '#2a1810'); T.dot(19.8, 8.4, 2.1, '#3c5bc8'); T.dot(19.8, 8.4, 1.1, '#101428'); T.dot(19.2, 9.1, 0.5, '#fff', 0.8);
      T.dot(17.5, -9, 5.3, '#2a1810'); T.dot(17.5, -9, 4.0, '#4a2a1c'); T.line(ARC(17.5, -9, 3.0, -2.6, -0.4, 6), '#6f8fe6', 1.0, 0.9); T.line(ARC(17.5, -9, 3.0, 0.3, 2.2, 6), '#6f8fe6', 0.7, 0.8); T.dot(17.5, -9, 1.3, '#101428');
      T.dot(5, 2, 4, '#5a2a1c', 0.5); T.dot(5, -3, 5, '#4a2418', 0.6);
      for (let i = 0; i < 5; i++) { const [px, py] = ARC(17, -2, 9, -0.2 - i * 0.18, -0.2 - i * 0.18)[0]; }
    });
  },
  zitronenfalter(c) {
    const g = c.ctx, [x0, y0] = c.tf(0, 12), [x1, y1] = c.tf(0, -14); const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#f2e44e'); gr.addColorStop(1, '#e6dc46'); g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H);
    both(c, (T) => {
      veins(T, [1.5, 2.8], [[8, 8], [14, 10], [20, 10.4], [25, 9], [26, 5.5], [24, 2.4], [20, 0.2], [12, -1]], '#b8b43a', 0.35, 0.6);
      veins(T, [1.5, 1.2], [[10, -6], [14, -10], [18, -12.2], [22, -12], [25, -9], [22.4, -3.5], [16, -1]], '#b8b43a', 0.35, 0.6);
      T.line([[2.5, -1.2], [8, -2.4], [16, -2]], '#c8b83a', 2, 0.15); T.dot(14.2, 3, 1.5, '#ea8226'); T.dot(14.2, 3, 0.9, '#d4691e'); T.dot(12.2, -3.6, 1.2, '#ea8226'); T.dot(12.2, -3.6, 0.7, '#d4691e');
      T.line([[27.6, 7.4], [26, 5], [23.4, 2.4], [20.6, 0.4], [14, -1.3]], 'rgba(190,110,50,.7)', 0.45, 0.9); T.line([[27.2, -8.8], [25.6, -12], [21, -13.3], [15, -12], [9.4, -9.6]], 'rgba(190,110,50,.7)', 0.45, 0.9);
    });
  },
  admiral(c) {
    const g = c.ctx; g.fillStyle = '#1d1416'; g.fillRect(0, 0, c.W, c.H);
    both(c, (T) => {
      T.poly([[11.5, 10.8], [16, 12.4], [21.5, 12.6], [24.2, 8.6], [23.2, 3.4], [22.2, 0.2], [16, -1.2], [14.6, 2.4], [13, 6.4]], '#e0431e');
      T.poly([[11.5, 10.8], [16, 12.4], [21.5, 12.6], [23.8, 10], [18, 6.6], [13, 6.6]], '#d8381a', 0.35);
      for (const [x, y, r] of [[25.4, 11.9, 1.0], [23.4, 13.6, 0.9], [27.4, 10.3, 0.7], [26.2, 8.2, 0.6], [24, 9.3, 0.5]]) T.dot(x, y, r, '#fff6e6');
      for (let i = 0; i < 6; i++) { const t = i / 5, x = 8.6 + t * 15, y = -2.2 - Math.sin(t * 2.4) * 8 - t * 4; }
      T.line(ARC(10, -2, 11.8, -0.45, -2.4, 10), '#e0431e', 3.0, 0.95); // roter Randsaum der Hinterflügel
      T.line([[22, -5], [23.7, -8.8], [22.3, -12], [18, -13.8], [12, -13]], '#e0431e', 2.0, 0.95);
      for (const [x, y] of [[21.4, -5.4], [22.4, -8.6], [20.4, -11.4], [16.4, -12.6], [12, -11.8]]) T.dot(x, y, 0.55, '#1d1416');
      T.dot(5, -10, 0.9, '#3a5cc8', 0.7); T.dot(3.8, -8, 0.6, '#3a5cc8', 0.6);
    });
  },
  fuchs(c) {
    const g = c.ctx, [x0, y0] = c.tf(0, 12), [x1, y1] = c.tf(18, -10); const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#f08a22'); gr.addColorStop(1, '#d8541c'); g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H);
    both(c, (T) => {
      T.poly([[1, 4], [4, 6.2], [4, 2.5], [1, 0.5]], '#4a2a18', 0.8);
      T.poly([[1, 1.2], [8, 2.2], [15, 1], [20, -1.6], [22.6, -5.2], [22.2, -9], [19.6, -12], [14, -13.4], [8, -12], [3, -8], [1, -2.6]], '#4c2a1c', 0.55); // dunkler Hinterflügel
      T.poly([[13.2, 10.6], [18, 11.6], [20.6, 12], [20, 9.4], [16, 8.6]], '#2a1a14'); T.poly([[18, 10.8], [21.4, 11.8], [23.2, 10.5], [21.2, 8.8]], '#f3dca0');
      T.dot(13.2, 6.4, 1.7, '#2a1a14'); T.dot(17.8, 6.8, 1.5, '#2a1a14'); T.dot(12.6, 1.4, 1.5, '#2a1a14');
      T.line([[23.4, 5.5], [24, 9.6], [22.8, 11.6]], '#2a1a14', 1.8, 0.9); T.line([[22.6, 0.6], [23.4, 3.4], [23.6, 6.4]], '#2a1a14', 1.8, 0.9);
      T.line([[21.8, 0.4], [17.5, -0.6], [11, -1.4]], '#2a1a14', 1.6, 0.9);
      T.line([[22.4, -5.2], [22, -9], [19.4, -12], [14.8, -13.4], [10, -12.4]], '#2a1a14', 2.2, 0.95);
      for (let i = 0; i < 6; i++) { const t = i / 5; T.dot(21.6 - t * 2.2 - (i > 3 ? t * 5 : 0), -3 - t * 9.4, 0.6, '#3b6fe0', 0.9); }
      for (let i = 0; i < 4; i++) T.dot(22.6 - i * 1.2, 4 + i * 1.4, 0.45, '#3b6fe0', 0.8);
    });
  },
  aurora(c) {
    const g = c.ctx; g.fillStyle = '#f7f4ea'; g.fillRect(0, 0, c.W, c.H);
    both(c, (T) => {
      T.poly([[2, 3], [10, 5], [10, -2], [3, -1]], '#cfd2c0', 0.55); T.poly([[1, -1], [8, 0.4], [9, -9], [2, -6]], '#cfd2c0', 0.5);
      T.poly([[14.2, 12], [22.8, 12.4], [23, 7], [21.4, 3.6], [19.6, 1.2], [15.4, 0.8], [14.6, 5]], '#f08a1c'); T.poly([[16.4, 12.2], [22.8, 12.4], [23, 8], [18.6, 9]], '#f9a73a', 0.55);
      T.line([[21.6, 12.2], [23.2, 10.2], [22.9, 6.8], [21.2, 3.6]], '#4a4a4e', 1.7, 0.95); T.dot(11.8, 5.2, 1.0, '#2e2a30', 1, 1.5);
      T.line([[13.4, 12.2], [17, 12.4], [21, 12.2]], '#8a8a8c', 0.8, 0.7);
      veins(T, [1.5, 2.8], [[8, 8], [14, 10.5], [19, 11.4], [22, 9], [20.5, 3], [14, -0.4]], '#9aa08a', 0.28, 0.45);
    });
  },
  schwalbenschwanz(c) {
    const g = c.ctx, [x0, y0] = c.tf(0, 14), [x1, y1] = c.tf(0, -20); const gr = g.createLinearGradient(x0, y0, x1, y1); gr.addColorStop(0, '#f6d838'); gr.addColorStop(1, '#f2cb2e'); g.fillStyle = gr; g.fillRect(0, 0, c.W, c.H);
    both(c, (T) => {
      T.poly([[1, 6], [10, 9.6], [12, 5], [8, 1.2], [1, 0.4]], '#1e1a18'); for (const [x, y] of [[3, 3], [5, 5], [7.2, 6.4], [9, 4], [6, 2.6]]) T.dot(x, y, 0.55, '#f2c830');
      T.line([[36, 12], [34.4, 7.6], [31.4, 3.6], [28.4, 0.6], [22.6, -1.6], [14, -2.4]], '#1e1a18', 4.4, 0.97); T.line([[34, 15], [27, 16]], '#1e1a18', 2.6, 0.9);
      for (const [x, y, a] of [[33.2, 9.6, 1.1], [31, 6.2, 0.9], [28.4, 3.2, 0.6], [24.6, 0.8, 0.4], [20, -0.2, 0.2], [15, -0.8, 0]]) T.poly(ARC(x - 0.6, y - 0.4, 1.1, 0, TAU, 6), '#f4cc30');
      veins(T, [1.5, 3], [[10, 10], [18, 13.4], [26, 15], [31, 12.6], [32, 8], [28, 2.4], [20, -0.6], [10, -1.8]], '#1e1a18', 0.55, 0.85);
      veins(T, [1.5, 1.4], [[14, 2.4], [22, -0.6], [29, -5], [32, -10], [30, -14.6], [24, -16.4], [16, -14.6], [8, -10], [3, -6]], '#1e1a18', 0.55, 0.85);
      T.line([[29.6, -3.2], [33.2, -9.4], [32.4, -16], [30.4, -22], [28.4, -25.8]], '#1e1a18', 4.4, 0.97); T.line([[23, -17], [15.6, -15.4], [9.4, -12.4]], '#1e1a18', 3.8, 0.97);
      for (let i = 0; i < 6; i++) { const t = i / 5, x = 27.8 + Math.sin(t * 2.4) * 1.5 - t * 2.4, y = -4.6 - t * 12.4; T.dot(x - (i > 3 ? t * 2 : 0), y, 0.95, '#5aa6ee', 0.95, 1.5); }
      for (let i = 0; i < 4; i++) T.dot(14.6 + i * 3.2, -14 + i * 0.4, 0.8, '#5aa6ee', 0.95);
      T.dot(8.8, -10.6, 1.9, '#e2552a'); T.dot(8.8, -10.6, 0.9, '#1e1a18');
      T.line([[31.4, -23], [30, -26.4]], '#f2cb2e', 0.5, 0.9);
    });
  },
};
const BUTTERFLY = {
  pfauenauge: { name: 'Tagpfauenauge', sci: 'Aglais io', mm: 52 }, zitronenfalter: { name: 'Zitronenfalter', sci: 'Gonepteryx rhamni', mm: 55 }, admiral: { name: 'Admiral', sci: 'Vanessa atalanta', mm: 56 },
  fuchs: { name: 'Kleiner Fuchs', sci: 'Aglais urticae', mm: 48 }, aurora: { name: 'Aurorafalter', sci: 'Anthocharis cardamines', mm: 44 }, schwalbenschwanz: { name: 'Schwalbenschwanz', sci: 'Papilio machaon', mm: 72 },
};
export { BUTTERFLY };

function butterflySpec(key) {
  const w = WINGS[key], shapes = [wingShape(w.fw), wingShape(mir(w.fw)), wingShape(w.hw), wingShape(mir(w.hw))];
  const bodyDark = '#2a1c14';
  const body = [blob(0, 3.2, 2.0, 3.4), limb([[0, 1, 3.0], [0, -5, 2.6], [0, -12.5, 1.1]], { per: 8 }), blob(0, 7.4, 1.7, 1.6)];
  const ant = [limb([[0.6, 8.2, 0.35], [2.4, 13, 0.3], [4.6, 17.5, 0.3]], { per: 8 }), limb([[-0.6, 8.2, 0.35], [-2.4, 13, 0.3], [-4.6, 17.5, 0.3]], { per: 8 }), blob(4.8, 17.9, 0.7, 0.45, 0.6), blob(-4.8, 17.9, 0.7, 0.45, -0.6)];
  return { id: 'falter-' + key, parts: {
    wings: { z: 0, layers: [{ shapes, fill: '#d8c8a0', stroke: 'rgba(40,25,10,.4)', deco: (c) => PAINT[key](c) }] },
    body: { z: 1, layers: [{ shapes: body, fill: { top: '#5a4030', bottom: bodyDark }, deco: (c) => { c.ctx.save(); c.ctx.globalAlpha = 0.5; c.ctx.fillStyle = '#e8dcc0'; const [px, py] = c.tf(-1.2, 5.6); c.ctx.beginPath(); c.ctx.arc(px, py, c.S * 0.45, 0, TAU); c.ctx.fill(); const [qx, qy] = c.tf(1.2, 5.6); c.ctx.beginPath(); c.ctx.arc(qx, qy, c.S * 0.45, 0, TAU); c.ctx.fill(); c.ctx.restore(); } }, { shapes: ant, fill: '#2a1c14' }] },
  }, anchors: {} };
}
const cache = new Map();
export function butterflyFigure(key, scale = 0.0066) {
  const f = litFigure(butterflySpec(key), { worldScale: scale, ppu: 1700, maxTex: 1024, thickness: 0.012, border: 0.0016 });
  f.group.userData.mm = BUTTERFLY[key].mm; return f;
}

// ---- Etikett (Name, lateinischer Name) als kleine Karte
function labelTexture(name, sci) {
  return memo(`bf-label|${name}`, () => { const [c, g] = canvas(512, 160); g.fillStyle = '#f6efdc'; g.fillRect(0, 0, 512, 160); g.strokeStyle = '#a58a5a'; g.lineWidth = 3; g.strokeRect(6, 6, 500, 148); g.fillStyle = '#2a1c10'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 54px ${SERIF}`; g.fillText(name, 256, 62, 470); g.font = `italic 36px ${SERIF}`; g.fillStyle = '#5a4a38'; g.fillText(sci, 256, 118, 470); return texOf(c); });
}

// ---- Schaukasten (Ursprung Mitte unten an der Wand, Vorderseite +z)
export const BF_ORDER = ['pfauenauge', 'zitronenfalter', 'admiral', 'fuchs', 'aurora', 'schwalbenschwanz'];
export function buildButterflyCase({ w = 1.7, h = 1.2, d = 0.12 } = {}) {
  const g = new THREE.Group(), wood = woodMid(), brass = M.brass(), T = 0.07;
  for (const [x, y, ww, hh] of [[0, h + T / 2, w + 2 * T, T], [0, -T / 2, w + 2 * T, T]]) { const b = box(ww, hh, d + 0.03, wood, { tile: 1 }); b.position.set(x, y, (d + 0.03) / 2); g.add(b); }
  for (const s of [-1, 1]) { const b = box(T, h, d + 0.03, wood, { tile: 1 }); b.position.set(s * (w / 2 + T / 2), h / 2, (d + 0.03) / 2); g.add(b); }
  // Hintergrund: Leinenpapier in hellem Salbei mit feiner Struktur
  const back = memo('bf-back', () => { const [c, gg] = canvas(512, 384); const rnd = mulberry32(11); gg.fillStyle = '#3d5a48'; gg.fillRect(0, 0, 512, 384); gg.globalAlpha = 0.1; for (let i = 0; i < 2600; i++) { gg.fillStyle = rnd() < 0.5 ? '#9ab88a' : '#10241a'; gg.fillRect(rnd() * 512, rnd() * 384, 1 + rnd() * 3, 1); } gg.globalAlpha = 0.07; gg.strokeStyle = '#9ab88a'; for (let x = 0; x < 512; x += 4) { gg.beginPath(); gg.moveTo(x, 0); gg.lineTo(x, 384); gg.stroke(); } const v = gg.createRadialGradient(256, 192, 100, 256, 192, 330); v.addColorStop(0, 'rgba(255,255,240,.0)'); v.addColorStop(1, 'rgba(10,25,15,.4)'); gg.globalAlpha = 1; gg.fillStyle = v; gg.fillRect(0, 0, 512, 384); return texOf(c); });
  const bp = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat('bf-back-mat', () => new THREE.MeshStandardMaterial({ map: back, roughness: 0.95 }))); bp.position.set(0, h / 2, 0.012); g.add(bp);
  for (const [x, y, ww, hh] of [[0, h - 0.012, w, 0.024], [0, 0.012, w, 0.024]]) { const b = box(ww, hh, 0.02, brass); b.position.set(x, y, d + 0.015); g.add(b); }
  for (const s of [-1, 1]) { const b = box(0.024, h, 0.02, brass); b.position.set(s * (w / 2 - 0.012), h / 2, d + 0.015); g.add(b); }
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassSheen()); gl.position.set(0, h / 2, d + 0.01); gl.renderOrder = 9; g.add(gl);
  // Falter in zwei Reihen, mit Nadel und Etikett
  const cols = 3, rows = 2, figs = {};
  BF_ORDER.forEach((key, i) => {
    const col = i % cols, row = Math.floor(i / cols), cx = (col - 1) * (w / cols) * 0.97 + (row ? 0.0 : 0), cy = h * (row === 0 ? 0.68 : 0.3);
    const f = butterflyFigure(key); f.group.position.set(cx, cy + 0.01, 0.045 + (i % 2) * 0.012); f.group.rotation.z = ((i * 53) % 7 - 3) * 0.018; g.add(f.group); figs[key] = f.group;
    const pin = new THREE.Mesh(new THREE.SphereGeometry(0.0075, 8, 6), brass); pin.position.set(cx - 0.0, cy + 0.04, 0.075); g.add(pin);
    const lb = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.075), new THREE.MeshStandardMaterial({ map: labelTexture(BUTTERFLY[key].name, BUTTERFLY[key].sci), roughness: 0.9 })); lb.position.set(cx, cy - h * 0.23 + (row ? 0.02 : 0), 0.022); g.add(lb);
  });
  g.userData.figs = figs; g.userData.size = { w: w + 2 * T, h: h + 2 * T, d };
  return g;
}
