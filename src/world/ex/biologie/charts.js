// Biologie: gemalte Lehrtafeln (Wandbilder im Stil alter Schultafeln): Verwandlung des Schmetterlings, Mendels Erbsen, Bau einer Blüte, Pflanzen- und Tierzelle.
import * as THREE from 'three';
import { M, box } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF } from './style.js';
import { paperBase } from './paper.js';

const W = 768, H = 540;
function base(title, sub) {
  const [c, g] = canvas(W, H); paperBase(g, W, H, '#f4ecd4', 5);
  g.strokeStyle = '#2c5a3e'; g.lineWidth = 10; g.strokeRect(8, 8, W - 16, H - 16); g.lineWidth = 2; g.strokeRect(22, 22, W - 44, H - 44);
  g.fillStyle = '#2c5a3e'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 38px ${SERIF}`; g.fillText(title, W / 2, 58, W - 90);
  if (sub) { g.fillStyle = '#5a4630'; g.font = `italic 20px ${SERIF}`; g.fillText(sub, W / 2, H - 42, W - 90); }
  return [c, g];
}
const ink = '#2a1c10', lbl = (g, t, x, y, o = {}) => { g.save(); g.fillStyle = o.color || ink; g.font = `${o.font || '20px'} ${SERIF}`; g.textAlign = o.align || 'center'; g.textBaseline = 'middle'; g.fillText(t, x, y, o.w || 220); g.restore(); };
const arrow = (g, x0, y0, x1, y1, col = '#8a6a30') => { g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); const a = Math.atan2(y1 - y0, x1 - x0); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x1 - 16 * Math.cos(a - 0.45), y1 - 16 * Math.sin(a - 0.45)); g.lineTo(x1 - 16 * Math.cos(a + 0.45), y1 - 16 * Math.sin(a + 0.45)); g.closePath(); g.fill(); g.restore(); };
const leader = (g, x0, y0, x1, y1) => { g.save(); g.strokeStyle = '#3a2a18'; g.lineWidth = 1.8; g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); g.fillStyle = '#3a2a18'; g.beginPath(); g.arc(x1, y1, 3.2, 0, TAU); g.fill(); g.restore(); };
const stroke = (g, fill, lw = 2, col = 'rgba(30,20,10,.65)') => { g.fillStyle = fill; g.fill(); g.lineWidth = lw; g.strokeStyle = col; g.lineJoin = 'round'; g.stroke(); };

// ---------------------------------------------------------------- Verwandlung des Schmetterlings
export function metamorphosisCanvas() {
  return memo('chart-meta', () => {
    const [c, g] = base('Die Verwandlung des Schmetterlings', 'Vollständige Verwandlung (Metamorphose): vier Stadien');
    const xs = [112, 296, 480, 664], y0 = 290;
    xs.forEach((x, i) => { g.fillStyle = 'rgba(160,200,140,.35)'; g.beginPath(); g.roundRect(x - 80, y0 - 120, 160, 240, 18); g.fill(); g.strokeStyle = 'rgba(60,100,60,.5)'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#2c5a3e'; g.beginPath(); g.arc(x - 58, y0 - 98, 17, 0, TAU); g.fill(); g.fillStyle = '#f6e7b0'; g.font = `bold 22px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(i + 1), x - 58, y0 - 97); });
    // 1 Ei auf Blatt
    { const x = xs[0]; g.beginPath(); g.moveTo(x - 62, y0 + 20); g.bezierCurveTo(x - 40, y0 - 60, x + 40, y0 - 70, x + 66, y0 - 10); g.bezierCurveTo(x + 40, y0 + 40, x - 30, y0 + 50, x - 62, y0 + 20); stroke(g, '#5fa85a'); g.strokeStyle = 'rgba(230,245,200,.7)'; g.lineWidth = 3; g.beginPath(); g.moveTo(x - 58, y0 + 18); g.quadraticCurveTo(x, y0 - 20, x + 62, y0 - 10); g.stroke();
      for (const [dx, dy] of [[-10, -12], [4, -16], [-2, -2], [14, -4]]) { g.beginPath(); g.ellipse(x + dx, y0 + dy, 7, 8.5, 0, 0, TAU); stroke(g, '#f6efb8', 1.6); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(x + dx - 2, y0 + dy - 3, 2, 0, TAU); g.fill(); } lbl(g, 'Ei', x, y0 + 86, { font: 'bold 26px' }); lbl(g, 'auf der Futterpflanze', x, y0 + 108, { font: 'italic 16px', color: '#5a4630' }); }
    // 2 Raupe
    { const x = xs[1]; g.beginPath(); g.moveTo(x - 70, y0 + 10); g.bezierCurveTo(x - 40, y0 - 60, x + 40, y0 - 60, x + 70, y0 - 6); g.bezierCurveTo(x + 40, y0 + 50, x - 40, y0 + 50, x - 70, y0 + 10); stroke(g, '#5fa85a');
      for (let k = 0; k < 8; k++) { const px = x - 46 + k * 12, py = y0 - 6 + Math.sin(k * 0.9) * 8; g.beginPath(); g.arc(px, py, 12, 0, TAU); stroke(g, k % 2 ? '#b8d85a' : '#8cc64a', 1.6); g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(px, py - 7, 1.8, 0, TAU); g.fill(); }
      g.beginPath(); g.arc(x + 54, y0 - 16, 13, 0, TAU); stroke(g, '#c47a3a'); g.fillStyle = '#fff'; g.beginPath(); g.arc(x + 58, y0 - 20, 4, 0, TAU); g.fill(); g.fillStyle = ink; g.beginPath(); g.arc(x + 59, y0 - 20, 2, 0, TAU); g.fill();
      lbl(g, 'Raupe', x, y0 + 86, { font: 'bold 26px' }); lbl(g, 'frisst, wächst, häutet sich', x, y0 + 108, { font: 'italic 16px', color: '#5a4630' }); }
    // 3 Puppe am Zweig
    { const x = xs[2]; g.strokeStyle = '#7a5a30'; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(x - 70, y0 - 60); g.quadraticCurveTo(x, y0 - 78, x + 70, y0 - 58); g.stroke(); g.lineWidth = 2; g.strokeStyle = '#7a5a30'; g.beginPath(); g.moveTo(x, y0 - 72); g.lineTo(x, y0 - 54); g.stroke();
      g.beginPath(); g.moveTo(x, y0 - 54); g.bezierCurveTo(x + 30, y0 - 40, x + 28, y0 + 30, x + 4, y0 + 56); g.bezierCurveTo(x - 6, y0 + 62, x - 10, y0 + 50, x - 16, y0 + 30); g.bezierCurveTo(x - 34, y0 - 10, x - 24, y0 - 44, x, y0 - 54); stroke(g, '#b5c27a'); g.strokeStyle = 'rgba(100,90,40,.5)'; g.lineWidth = 2; for (let k = 0; k < 5; k++) { g.beginPath(); g.moveTo(x - 16 + k * 3, y0 - 30 + k * 18); g.quadraticCurveTo(x + 4, y0 - 24 + k * 18, x + 20 - k * 2, y0 - 30 + k * 18); g.stroke(); } g.fillStyle = '#d9b84a'; for (const [dx, dy] of [[-4, -8], [8, 6], [-2, 22]]) { g.beginPath(); g.arc(x + dx, y0 + dy, 3, 0, TAU); g.fill(); }
      lbl(g, 'Puppe', x, y0 + 86, { font: 'bold 26px' }); lbl(g, 'Umbau in der Hülle', x, y0 + 108, { font: 'italic 16px', color: '#5a4630' }); }
    // 4 Falter
    { const x = xs[3], y = y0 - 8; const wing = (sx, sy, rx, ry, rot, col) => { g.beginPath(); g.ellipse(x + sx, y + sy, rx, ry, rot, 0, TAU); stroke(g, col, 2); };
      wing(-34, -22, 38, 28, -0.5, '#d8562a'); wing(34, -22, 38, 28, 0.5, '#d8562a'); wing(-26, 24, 28, 24, 0.4, '#c24626'); wing(26, 24, 28, 24, -0.4, '#c24626');
      for (const s of [-1, 1]) { g.fillStyle = '#2a1c10'; g.beginPath(); g.arc(x + s * 46, y - 30, 9, 0, TAU); g.fill(); g.fillStyle = '#6f8fe6'; g.beginPath(); g.arc(x + s * 46, y - 30, 5, 0, TAU); g.fill(); g.fillStyle = '#e9d68a'; g.beginPath(); g.arc(x + s * 46, y - 30, 2, 0, TAU); g.fill(); }
      g.beginPath(); g.ellipse(x, y, 5.5, 34, 0, 0, TAU); stroke(g, '#3a2418'); g.strokeStyle = '#3a2418'; g.lineWidth = 2.2; g.beginPath(); g.moveTo(x - 2, y - 32); g.quadraticCurveTo(x - 14, y - 52, x - 22, y - 50); g.moveTo(x + 2, y - 32); g.quadraticCurveTo(x + 14, y - 52, x + 22, y - 50); g.stroke();
      lbl(g, 'Schmetterling', x, y0 + 86, { font: 'bold 24px' }); lbl(g, 'schlüpft und fliegt', x, y0 + 108, { font: 'italic 16px', color: '#5a4630' }); }
    for (let i = 0; i < 3; i++) arrow(g, xs[i] + 84, y0, xs[i + 1] - 84, y0);
    return c;
  });
}

// ---------------------------------------------------------------- Mendels Erbsenversuch
export function mendelCanvas() {
  return memo('chart-mendel', () => {
    const [c, g] = base('Mendels Erbsenversuch', 'Gregor Mendel kreuzte Erbsen und zählte die Nachkommen (um 1860)');
    const pea = (x, y, r, wrinkled, tag) => { g.beginPath(); if (!wrinkled) g.arc(x, y, r, 0, TAU); else { for (let i = 0; i <= 36; i++) { const a = (i / 36) * TAU, rr = r * (0.9 + 0.1 * Math.sin(a * 7) + 0.05 * Math.sin(a * 3)); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.94; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); }
      stroke(g, wrinkled ? '#c8b84a' : '#d8cc58', 2.4); g.fillStyle = 'rgba(255,255,230,.5)'; g.beginPath(); g.ellipse(x - r * 0.3, y - r * 0.35, r * 0.28, r * 0.18, -0.6, 0, TAU); g.fill(); if (wrinkled) { g.strokeStyle = 'rgba(110,100,30,.6)'; g.lineWidth = 2; for (const [dx, dy, ex, ey] of [[-0.5, -0.1, 0.0, 0.2], [0.1, -0.5, 0.4, 0.0], [-0.1, 0.4, 0.5, 0.5], [-0.6, 0.3, -0.3, 0.6]]) { g.beginPath(); g.moveTo(x + dx * r, y + dy * r); g.quadraticCurveTo(x + (dx + ex) * r * 0.5 + 4, y + (dy + ey) * r * 0.5 - 4, x + ex * r, y + ey * r); g.stroke(); } } if (tag) lbl(g, tag, x, y + r + 20, { font: 'bold 20px' }); };
    const rows = [118, 258, 398];
    lbl(g, 'Eltern (P)', 80, rows[0] - 34, { font: 'bold 20px', align: 'left', color: '#2c5a3e' }); lbl(g, 'Kinder (F1)', 80, rows[1] - 34, { font: 'bold 20px', align: 'left', color: '#2c5a3e' }); lbl(g, 'Enkel (F2)', 80, rows[2] - 34, { font: 'bold 20px', align: 'left', color: '#2c5a3e' });
    pea(300, rows[0], 30, false, 'rund  RR'); pea(470, rows[0], 30, true, 'runzelig  rr'); lbl(g, '×', 385, rows[0], { font: 'bold 40px', color: '#8a6a30' });
    arrow(g, 385, rows[0] + 50, 385, rows[1] - 40);
    for (let i = 0; i < 4; i++) pea(250 + i * 90, rows[1], 24, false, 'Rr'); lbl(g, 'alle rund', 640, rows[1], { font: 'italic 20px', color: '#5a4630' });
    arrow(g, 385, rows[1] + 52, 385, rows[2] - 40);
    pea(250, rows[2], 24, false, 'RR'); pea(340, rows[2], 24, false, 'Rr'); pea(430, rows[2], 24, false, 'rR'); pea(520, rows[2], 24, true, 'rr');
    lbl(g, '3 rund : 1 runzelig', 640, rows[2] - 6, { font: 'bold 22px', color: '#b04a2a', w: 150 });
    lbl(g, 'R: Erbanlage für „rund“ (setzt sich durch)   r: Erbanlage für „runzelig“', W / 2, H - 76, { font: '17px', color: '#4a3a24', w: 700 });
    return c;
  });
}

// ---------------------------------------------------------------- Bau einer Blüte (Längsschnitt)
export function flowerCanvas() {
  return memo('chart-flower', () => {
    const [c, g] = base('Bau einer Blüte', 'Staubblätter: männlich (bilden Pollen) · Fruchtblatt: weiblich (Samenanlagen)');
    const cx = W / 2;
    // Stängel und Blütenboden
    g.beginPath(); g.moveTo(cx - 9, H - 70); g.lineTo(cx - 9, 400); g.lineTo(cx + 9, 400); g.lineTo(cx + 9, H - 70); g.closePath(); stroke(g, '#6fae5a');
    // Kronblätter (hinten und vorn)
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 12, 392); g.bezierCurveTo(cx + s * 70, 380, cx + s * 130, 300, cx + s * 150, 170); g.bezierCurveTo(cx + s * 110, 200, cx + s * 70, 250, cx + s * 40, 300); g.bezierCurveTo(cx + s * 30, 340, cx + s * 22, 372, cx + s * 12, 392); stroke(g, '#f2a8b8', 2.4); g.strokeStyle = 'rgba(190,80,110,.45)'; g.lineWidth = 1.6; for (let k = 0; k < 3; k++) { g.beginPath(); g.moveTo(cx + s * 24, 380); g.quadraticCurveTo(cx + s * (70 + k * 14), 300 - k * 20, cx + s * (136 - k * 6), 190 + k * 22); g.stroke(); } }
    // Kelchblätter
    for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 10, 404); g.bezierCurveTo(cx + s * 50, 410, cx + s * 100, 396, cx + s * 120, 352); g.bezierCurveTo(cx + s * 80, 370, cx + s * 40, 372, cx + s * 12, 384); stroke(g, '#5fa85a', 2.2); }
    // Fruchtblatt: Fruchtknoten mit Samenanlagen, Griffel, Narbe
    g.beginPath(); g.ellipse(cx, 372, 42, 48, 0, 0, TAU); stroke(g, '#a8d46a', 2.4);
    for (const [dx, dy] of [[-14, 360], [14, 360], [0, 386]]) { g.beginPath(); g.ellipse(cx + dx, dy + 0, 9, 12, 0.2, 0, TAU); stroke(g, '#f0a43a', 1.8); }
    g.beginPath(); g.moveTo(cx - 7, 330); g.lineTo(cx - 5, 230); g.lineTo(cx + 5, 230); g.lineTo(cx + 7, 330); g.closePath(); stroke(g, '#bfe07a', 2);
    g.beginPath(); g.moveTo(cx - 16, 232); g.bezierCurveTo(cx - 20, 208, cx + 20, 208, cx + 16, 232); g.closePath(); stroke(g, '#f0c43a', 2.2);
    // Staubblätter
    for (const s of [-1, 1]) for (const k of [0, 1]) { const x = cx + s * (56 + k * 34), top = 250 + k * 34; g.strokeStyle = '#a89a3a'; g.lineWidth = 5; g.lineCap = 'round'; g.beginPath(); g.moveTo(cx + s * 22, 390); g.quadraticCurveTo(x - s * 6, 330, x, top + 14); g.stroke(); g.beginPath(); g.ellipse(x, top, 12, 20, s * 0.1, 0, TAU); stroke(g, '#f0d23a', 2); g.fillStyle = 'rgba(160,110,20,.5)'; for (let i = 0; i < 5; i++) { g.beginPath(); g.arc(x + (i % 2 ? 3 : -3), top - 10 + i * 5, 1.6, 0, TAU); g.fill(); } }
    // Beschriftungen
    const R = (t, x, y, px, py) => { lbl(g, t, x, y, { align: 'left', font: 'bold 20px', w: 230 }); leader(g, x - 6, y, px, py); };
    const L = (t, x, y, px, py) => { lbl(g, t, x, y, { align: 'right', font: 'bold 20px', w: 230 }); leader(g, x + 6, y, px, py); };
    R('Narbe', 552, 196, cx + 10, 220); R('Griffel', 560, 262, cx + 5, 270); R('Fruchtknoten', 560, 340, cx + 36, 360); R('Samenanlage', 560, 392, cx + 18, 372); R('Kelchblatt', 560, 440, cx + 100, 366); R('Kronblatt', 570, 140, cx + 138, 180);
    L('Staubbeutel', 214, 200, cx - 90, 258); L('Staubfaden', 214, 280, cx - 76, 316); L('Blütenboden', 214, 410, cx - 10, 398); L('Stängel', 214, 470, cx - 9, 450);
    return c;
  });
}

// ---------------------------------------------------------------- Pflanzenzelle und Tierzelle
export function cellsCanvas() {
  return memo('chart-cells', () => {
    const [c, g] = base('Pflanzenzelle und Tierzelle', 'Nur Pflanzenzellen haben Zellwand, Chloroplasten und eine große Vakuole (stark vereinfacht).');
    const nucleus = (x, y, r) => { g.beginPath(); g.arc(x, y, r, 0, TAU); stroke(g, '#c9a8e0', 2.6); g.beginPath(); g.arc(x + r * 0.2, y - r * 0.1, r * 0.34, 0, TAU); stroke(g, '#8a5ab0', 1.8); };
    const mito = (x, y, a, s = 1) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 16, 8, 0, 0, TAU); stroke(g, '#f0a45a', 2); g.strokeStyle = 'rgba(150,70,20,.8)'; g.lineWidth = 1.6; g.beginPath(); for (let i = -2; i <= 2; i++) { g.moveTo(i * 5, -6); g.lineTo(i * 5 + 2, 0); g.lineTo(i * 5, 6); } g.stroke(); g.restore(); };
    const chloro = (x, y, a, s = 1) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.beginPath(); g.ellipse(0, 0, 17, 9, 0, 0, TAU); stroke(g, '#5fb84a', 2); g.strokeStyle = 'rgba(20,80,20,.6)'; g.lineWidth = 1.4; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, -6); g.lineTo(i * 5, 6); g.stroke(); } g.restore(); };
    // Pflanzenzelle (links): dicke Wand, Membran, Plasma, große Vakuole
    { const x0 = 50, y0 = 96, w = 330, h = 250;
      g.beginPath(); g.roundRect(x0, y0, w, h, 24); stroke(g, '#8ac26a', 8, '#3d7a2a'); g.beginPath(); g.roundRect(x0 + 14, y0 + 14, w - 28, h - 28, 16); stroke(g, '#e3f2c8', 2, '#6a8a3a');
      g.beginPath(); g.roundRect(x0 + 130, y0 + 50, 170, 150, 40); stroke(g, '#cfe8f4', 2.2, '#6a9ab0'); lbl(g, 'Vakuole', x0 + 215, y0 + 125, { font: 'italic 18px', color: '#3a5a70' });
      nucleus(x0 + 66, y0 + 70, 30); for (const [dx, dy, a] of [[56, 160, 0.3], [96, 218, -0.2], [66, 118, 1.2], [260, 40, 0.1]]) chloro(x0 + dx, y0 + dy, a); mito(x0 + 112, y0 + 36, 0.5); mito(x0 + 292, y0 + 222, -0.4);
      lbl(g, 'Pflanzenzelle', x0 + w / 2, y0 + h + 28, { font: 'bold 26px', color: '#2c5a3e' }); }
    // Tierzelle (rechts): nur Membran
    { const cx = 580, cy = 218; g.beginPath(); for (let i = 0; i <= 48; i++) { const a = (i / 48) * TAU, r = 108 + 8 * Math.sin(a * 3 + 1) + 5 * Math.sin(a * 5); const px = cx + Math.cos(a) * r * 1.1, py = cy + Math.sin(a) * r * 0.92; if (i) g.lineTo(px, py); else g.moveTo(px, py); } g.closePath(); stroke(g, '#f6d8c8', 3, '#b8603a');
      nucleus(cx - 10, cy - 8, 38); for (const [dx, dy, a] of [[60, 44, 0.4], [-62, 52, -0.6], [48, -56, 1.1], [-84, -26, 0.2]]) mito(cx + dx, cy + dy, a);
      lbl(g, 'Tierzelle', cx, 346 + 28, { font: 'bold 26px', color: '#2c5a3e' }); }
    // Legende
    g.strokeStyle = 'rgba(90,60,30,.4)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(40, 410); g.lineTo(W - 40, 410); g.stroke();
    const items = [['Zellkern', (x, y) => nucleus(x, y, 12)], ['Chloroplast', (x, y) => chloro(x, y, 0, 0.8)], ['Mitochondrium', (x, y) => mito(x, y, 0, 0.8)], ['Vakuole', (x, y) => { g.beginPath(); g.roundRect(x - 13, y - 9, 26, 18, 7); stroke(g, '#cfe8f4', 1.8, '#6a9ab0'); }], ['Zellwand', (x, y) => { g.strokeStyle = '#3d7a2a'; g.lineWidth = 7; g.beginPath(); g.moveTo(x - 13, y); g.lineTo(x + 13, y); g.stroke(); }]];
    const colW = 140; items.forEach(([t, draw], i) => { const x = 74 + i * colW; draw(x, 440); lbl(g, t, x, 470, { font: 'bold 16px', w: 130 }); });
    return c;
  });
}
export const CHARTS = { meta: metamorphosisCanvas, mendel: mendelCanvas, flower: flowerCanvas, cells: cellsCanvas };

// Bild im Rahmen (breit), Ursprung Mitte, Vorderseite +z
export function chartFrame(key, { w = 1.5 } = {}) {
  const h = w * H / W, g = new THREE.Group(), wood = M.wood(0x5a3a22, { planks: 1 }), brass = M.brass();
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: texOf(CHARTS[key]()), roughness: 0.8 })); pic.position.z = 0.03; g.add(pic);
  for (const [x, y, ww, hh] of [[0, h / 2 + 0.04, w + 0.16, 0.08], [0, -h / 2 - 0.04, w + 0.16, 0.08]]) { const b = box(ww, hh, 0.06, wood, { tile: 1 }); b.position.set(x, y, 0.02); g.add(b); }
  for (const s of [-1, 1]) { const b = box(0.08, h, 0.06, wood, { tile: 1 }); b.position.set(s * (w / 2 + 0.04), 0, 0.02); g.add(b); }
  // Aufhängestab (Messing) oben
  const rod = box(w + 0.3, 0.02, 0.02, brass); rod.position.set(0, h / 2 + 0.1, 0.05); g.add(rod);
  g.userData.size = { w: w + 0.16, h: h + 0.16 }; return g;
}
