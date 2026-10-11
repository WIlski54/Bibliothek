// Biologie: Herbarblätter (gepresste Pflanzen auf Papier, gezeichnet) in Rahmen.
import * as THREE from 'three';
import { M, mat, framedPicture } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF } from './style.js';
import { paperBase } from './paper.js';

const W = 400, H = 560;
// ---- kleine Zeichenhelfer (Koordinaten in Pixeln)
const stemPath = (g, pts, w, col) => { g.save(); g.strokeStyle = col; g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.stroke(); g.restore(); };
const curve = (p0, p1, p2, n = 14) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, c = t * t; return [a * p0[0] + b * p1[0] + c * p2[0], a * p0[1] + b * p1[1] + c * p2[1]]; });
const GREEN = '#6f7f3e', GREEN2 = '#8a9a52', GREEN3 = '#59692e', BROWN = '#7a5a30';
function leafShape(g, x, y, ang, len, wid, col, vein = true, edge = 'rgba(50,60,20,.55)') {
  g.save(); g.translate(x, y); g.rotate(ang); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(len * 0.25, -wid, len * 0.7, -wid * 0.8, len, 0); g.bezierCurveTo(len * 0.7, wid * 0.8, len * 0.25, wid, 0, 0); g.closePath(); g.fillStyle = col; g.fill(); g.lineWidth = 1.3; g.strokeStyle = edge; g.stroke();
  if (vein) { g.strokeStyle = 'rgba(240,235,190,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(2, 0); g.lineTo(len * 0.95, 0); g.stroke(); for (let i = 1; i < 6; i++) { const t = i / 6.5; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(len * t, 0); g.lineTo(len * (t + 0.12), s * wid * 0.55 * Math.sin(Math.PI * Math.min(1, t + 0.1))); g.stroke(); } } }
  g.restore();
}
const flowerDaisy = (g, x, y, r, rot = 0, petals = 24, col = '#f5f1e2', disc = '#e0b52e') => { g.save(); g.translate(x, y); g.rotate(rot); for (let i = 0; i < petals; i++) { g.rotate(TAU / petals); g.fillStyle = col; g.strokeStyle = 'rgba(120,100,60,.5)'; g.lineWidth = 0.9; g.beginPath(); g.ellipse(0, -r * 0.72, r * 0.1, r * 0.34, 0, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = disc; g.beginPath(); g.arc(0, 0, r * 0.34, 0, TAU); g.fill(); g.fillStyle = 'rgba(120,80,10,.35)'; for (let i = 0; i < 14; i++) { g.beginPath(); g.arc(Math.cos(i * 2.4) * r * 0.2 * ((i % 3) / 2 + 0.2), Math.sin(i * 2.4) * r * 0.2 * ((i % 3) / 2 + 0.2), 1.4, 0, TAU); g.fill(); } g.restore(); };

const PLANTS = {
  gaensebluemchen(g) {
    const rnd = mulberry32(3);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.42 + (rnd() - 0.5) * 0.15; leafShape(g, 200, 470, a, 110 + rnd() * 30, 18, i % 2 ? GREEN : GREEN2, true); }
    const stems = [[[200, 466], [185, 330], [150, 190]], [[200, 466], [215, 320], [255, 160]], [[200, 466], [205, 360], [190, 120]]];
    stems.forEach((s, k) => { stemPath(g, curve(s[0], s[1], s[2]), 3, GREEN3); });
    flowerDaisy(g, 150, 188, 40, 0.2); flowerDaisy(g, 256, 158, 46, 0.5); flowerDaisy(g, 190, 112, 30, 0.9, 20);
    g.fillStyle = '#c9a0a0'; g.strokeStyle = GREEN3; g.beginPath(); g.ellipse(95, 300, 12, 16, 0.4, 0, TAU); g.fill(); stemPath(g, curve([200, 466], [140, 400], [96, 312]), 2.6, GREEN3);
    stemPath(g, [[200, 470], [196, 515], [190, 530]], 3, BROWN); stemPath(g, [[198, 490], [180, 510]], 1.6, BROWN); stemPath(g, [[199, 492], [218, 512]], 1.6, BROWN);
  },
  klatschmohn(g) {
    const rnd = mulberry32(5); stemPath(g, curve([210, 520], [190, 360], [230, 150]), 3.4, GREEN3); stemPath(g, curve([205, 380], [140, 320], [120, 230]), 2.8, GREEN3); stemPath(g, curve([196, 330], [290, 300], [308, 215]), 2.6, GREEN3);
    for (const [x, y, a, l] of [[205, 440, 0.2, 90], [196, 400, 2.8, 80], [200, 360, -0.3, 70], [212, 300, 3.0, 60], [214, 250, -0.2, 50]]) { for (let k = 0; k < 5; k++) leafShape(g, x, y, a + (k - 2) * 0.26, l * (1 - Math.abs(k - 2) * 0.18), 9, GREEN, false); }
    const poppy = (x, y, r, rot) => { g.save(); g.translate(x, y); g.rotate(rot); for (let i = 0; i < 4; i++) { g.rotate(Math.PI / 2); g.fillStyle = i % 2 ? '#b3342a' : '#c24030'; g.strokeStyle = 'rgba(80,20,10,.5)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(-r * 0.9, -r * 0.2, -r * 0.8, -r * 1.1, 0, -r * 1.05); g.bezierCurveTo(r * 0.8, -r * 1.1, r * 0.9, -r * 0.2, 0, 0); g.fill(); g.stroke(); g.strokeStyle = 'rgba(70,10,10,.25)'; for (let k = -2; k <= 2; k++) { g.beginPath(); g.moveTo(0, -r * 0.1); g.lineTo(k * r * 0.2, -r * 0.9); g.stroke(); } } g.fillStyle = '#34302a'; g.beginPath(); g.arc(0, 0, r * 0.22, 0, TAU); g.fill(); g.fillStyle = '#2a2824'; for (let i = 0; i < 22; i++) { g.beginPath(); g.arc(Math.cos(i * 0.9) * r * 0.36, Math.sin(i * 0.9) * r * 0.36, 2, 0, TAU); g.fill(); } g.restore(); };
    poppy(230, 145, 56, 0.3); poppy(120, 222, 44, 1.1);
    g.fillStyle = '#8a9a50'; g.strokeStyle = GREEN3; g.lineWidth = 1.4; g.beginPath(); g.ellipse(308, 232, 14, 18, 0.2, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(296, 216); g.lineTo(320, 216); g.stroke();
    g.fillStyle = '#9aa05a'; g.beginPath(); g.ellipse(300, 330, 10, 14, -0.6, 0, TAU); g.fill();
  },
  eiche(g) {
    stemPath(g, curve([40, 500], [160, 330], [330, 120]), 6, BROWN); stemPath(g, curve([160, 400], [230, 380], [320, 330]), 4, BROWN);
    const oak = (x, y, a, s) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); const pts = [], N = 70, hwf = (t) => 30 * Math.sin(Math.PI * Math.pow(t, 0.75)) * (0.62 + 0.38 * Math.max(0, Math.cos(t * 4.5 * TAU - 0.3)) ** 0.6);
      for (let i = 0; i <= N; i++) { const t = i / N; pts.push([hwf(t), t * 126]); } for (let i = N; i >= 0; i--) { const t = i / N; pts.push([-hwf(t), t * 126]); }
      g.beginPath(); pts.forEach(([px, py], i) => (i ? g.lineTo(px, py) : g.moveTo(px, py))); g.closePath(); g.fillStyle = GREEN; g.fill(); g.lineWidth = 1.4; g.strokeStyle = 'rgba(40,55,15,.6)'; g.stroke(); g.strokeStyle = 'rgba(235,230,180,.55)'; g.lineWidth = 1.3; g.beginPath(); g.moveTo(0, 2); g.lineTo(0, 120); g.stroke();
      for (let i = 0; i < 5; i++) for (const sg of [-1, 1]) { const t = 0.16 + i * 0.16; g.beginPath(); g.moveTo(0, t * 126); g.lineTo(sg * 24 * Math.sin(Math.PI * Math.pow(t, 0.75)), (t + 0.07) * 126); g.stroke(); } g.restore(); };
    for (const [x, y, a, s] of [[80, 455, 1.0, 0.95], [140, 396, -0.9, 1.0], [210, 340, 1.0, 0.95], [260, 262, -0.8, 1.0], [320, 180, 0.9, 0.9], [330, 130, -0.5, 0.8], [210, 345, -2.2, 0.8]]) { stemPath(g, [[x, y], [x + Math.sin(a) * 4, y - Math.cos(a) * 4]], 2.2, BROWN); oak(x, y, a + Math.PI, s * 0.82); }
    for (const [x, y, a] of [[250, 410, 0.4], [300, 360, -0.2]]) { stemPath(g, curve([x, y - 30], [x + 12, y - 8], [x + 8 * Math.sin(a), y]), 2.4, BROWN); g.save(); g.translate(x + 8 * Math.sin(a), y); g.rotate(a); g.fillStyle = '#b7863f'; g.strokeStyle = 'rgba(70,40,10,.7)'; g.lineWidth = 1.5; g.beginPath(); g.ellipse(0, 18, 11, 17, 0, 0, TAU); g.fill(); g.stroke(); g.fillStyle = '#7a6030'; g.beginPath(); g.ellipse(0, 6, 13, 8, 0, Math.PI, TAU); g.fill(); g.stroke(); g.strokeStyle = 'rgba(40,25,5,.6)'; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, 1); g.lineTo(i * 5, 8); g.stroke(); } g.restore(); }
  },
  wurmfarn(g) {
    const rach = curve([190, 540], [175, 340], [262, 60], 40); stemPath(g, rach, 5, '#5a6a30');
    for (let i = 2; i < 40; i++) { const [x, y] = rach[i], [x2, y2] = rach[i + 1], a = Math.atan2(y2 - y, x2 - x), t = i / 40, L = 135 * Math.sin(Math.PI * Math.min(1, t * 0.9 + 0.1)) * (1 - 0.45 * t) + 8;
      for (const s of [-1, 1]) { const a2 = a + s * (1.2 - 0.35 * t), ex = x + Math.cos(a2) * L, ey = y + Math.sin(a2) * L;
        g.save(); g.fillStyle = i % 2 ? GREEN : GREEN2; g.strokeStyle = 'rgba(40,55,15,.6)'; g.lineWidth = 1; g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo((x + ex) / 2 + Math.cos(a2 + 1.6) * L * 0.18, (y + ey) / 2 + Math.sin(a2 + 1.6) * L * 0.18, ex, ey); g.quadraticCurveTo((x + ex) / 2 - Math.cos(a2 + 1.6) * L * 0.18, (y + ey) / 2 - Math.sin(a2 + 1.6) * L * 0.18, x, y); g.fill(); g.stroke();
        g.strokeStyle = 'rgba(40,55,15,.55)'; g.lineWidth = 1; for (let k = 1; k < 7; k++) { const px = x + Math.cos(a2) * L * (k / 7), py = y + Math.sin(a2) * L * (k / 7); for (const q of [-1, 1]) { g.beginPath(); g.moveTo(px, py); g.lineTo(px + Math.cos(a2 + q * 1.1) * L * 0.1 * (1 - k / 8), py + Math.sin(a2 + q * 1.1) * L * 0.1 * (1 - k / 8)); g.stroke(); } } g.restore(); } }
    stemPath(g, [[190, 540], [186, 560]], 5, '#6a4a28');
  },
  loewenzahn(g) {
    const rnd = mulberry32(9);
    for (let i = 0; i < 9; i++) { const a = -Math.PI / 2 + (i - 4) * 0.4 + (rnd() - 0.5) * 0.1; g.save(); g.translate(200, 500); g.rotate(a); const L = 130 + rnd() * 25; g.beginPath(); g.moveTo(0, 0); for (let k = 1; k <= 5; k++) { const x = (L / 5) * k; g.lineTo(x - 6, -16 - k * 1.2); g.lineTo(x, -4); } g.lineTo(L, 0); for (let k = 5; k >= 1; k--) { const x = (L / 5) * k; g.lineTo(x, 4); g.lineTo(x - 6, 16 + k * 1.2); } g.closePath(); g.fillStyle = i % 2 ? GREEN : GREEN2; g.fill(); g.strokeStyle = 'rgba(40,55,15,.6)'; g.lineWidth = 1.3; g.stroke(); g.strokeStyle = 'rgba(235,230,170,.6)'; g.beginPath(); g.moveTo(2, 0); g.lineTo(L - 4, 0); g.stroke(); g.restore(); }
    stemPath(g, curve([200, 495], [190, 330], [170, 160]), 4, '#8a9a60'); stemPath(g, curve([204, 495], [240, 360], [292, 190]), 4, '#8a9a60');
    // Blüte: viele schmale Zungenblüten
    g.save(); g.translate(170, 140); for (let i = 0; i < 64; i++) { const a = (i / 64) * TAU; g.fillStyle = i % 2 ? '#d9b02a' : '#e6c140'; g.strokeStyle = 'rgba(120,90,10,.5)'; g.lineWidth = 0.8; g.beginPath(); g.ellipse(Math.cos(a) * 28, Math.sin(a) * 28, 22, 3.6, a, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#c99a1c'; g.beginPath(); g.arc(0, 0, 9, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#7a8a46'; for (let i = 0; i < 18; i++) { const a = Math.PI * 0.6 + (i / 17) * Math.PI * 0.8; g.beginPath(); g.ellipse(170 + Math.cos(a) * 15, 168 + Math.sin(a) * 6, 3, 10, a - 1.57, 0, TAU); g.fill(); }
    // Pusteblume: Samenstand mit Schirmchen
    g.save(); g.translate(292, 160); g.strokeStyle = 'rgba(70,60,40,.55)'; g.lineWidth = 0.9; for (let i = 0; i < 46; i++) { const a = (i / 46) * TAU; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.cos(a) * 36, Math.sin(a) * 36); g.stroke(); g.fillStyle = 'rgba(250,248,240,.95)'; g.strokeStyle = 'rgba(90,80,60,.5)'; g.beginPath(); g.arc(Math.cos(a) * 38, Math.sin(a) * 38, 4.2, 0, TAU); g.fill(); g.stroke(); } g.fillStyle = '#8a7a50'; g.beginPath(); g.arc(0, 0, 5, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#b8a850'; g.beginPath(); g.ellipse(120, 280, 11, 17, -0.4, 0, TAU); g.fill(); stemPath(g, curve([202, 480], [150, 400], [122, 290]), 3, '#8a9a60');
    stemPath(g, [[200, 498], [198, 540], [194, 556]], 5, '#8a6a3a');
  },
  ginkgo(g) {
    stemPath(g, curve([60, 520], [180, 360], [300, 120]), 5.5, BROWN);
    const leaf = (x, y, a, s) => { g.save(); g.translate(x, y); g.rotate(a); g.scale(s, s); g.strokeStyle = 'rgba(120,90,30,.9)'; g.lineWidth = 2.4; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -38); g.stroke(); g.translate(0, -38);
      const R = 84, spread = 1.28, rr = (ang) => R * (1 - 0.1 * Math.pow(Math.abs(ang) / spread, 2) + 0.03 * Math.sin(ang * 11)); g.beginPath(); g.moveTo(0, 0);
      for (let i = 0; i <= 28; i++) { const ang = -spread + (i / 28) * (spread * 0.93), r = rr(ang); g.lineTo(Math.sin(ang) * r, -Math.cos(ang) * r); } g.lineTo(0, -R * 0.52); for (let i = 0; i <= 28; i++) { const ang = spread * 0.07 + (i / 28) * (spread * 0.93), r = rr(ang); g.lineTo(Math.sin(ang) * r, -Math.cos(ang) * r); } g.closePath();
      g.fillStyle = '#a3b04c'; g.fill(); g.lineWidth = 1.5; g.strokeStyle = 'rgba(70,80,20,.7)'; g.stroke(); g.strokeStyle = 'rgba(245,240,190,.55)'; g.lineWidth = 1; for (let i = -14; i <= 14; i++) { const ang = (i / 14) * spread * 0.95; g.beginPath(); g.moveTo(0, 0); g.lineTo(Math.sin(ang) * R * 0.94, -Math.cos(ang) * R * 0.94); g.stroke(); } g.restore(); };
    for (const [x, y, a, s] of [[90, 470, -0.5, 0.78], [140, 400, 0.8, 0.8], [190, 340, -0.7, 0.82], [240, 270, 0.9, 0.82], [280, 190, -0.4, 0.78], [310, 130, 0.7, 0.7], [160, 360, 2.6, 0.64]]) leaf(x, y, a, s);
  },
};
export const HERBAR = {
  gaensebluemchen: { name: 'Gänseblümchen', sci: 'Bellis perennis L.', fam: 'Asteraceae (Korbblütler)', fund: 'Wiese' },
  klatschmohn: { name: 'Klatschmohn', sci: 'Papaver rhoeas L.', fam: 'Papaveraceae (Mohngewächse)', fund: 'Feldrand' },
  eiche: { name: 'Stieleiche', sci: 'Quercus robur L.', fam: 'Fagaceae (Buchengewächse)', fund: 'Laubwald' },
  wurmfarn: { name: 'Wurmfarn', sci: 'Dryopteris filix-mas (L.) Schott', fam: 'Dryopteridaceae', fund: 'Waldrand' },
  loewenzahn: { name: 'Löwenzahn', sci: 'Taraxacum officinale agg.', fam: 'Asteraceae (Korbblütler)', fund: 'Wegrand' },
  ginkgo: { name: 'Ginkgo', sci: 'Ginkgo biloba L.', fam: 'Ginkgoaceae', fund: 'Park' },
};
export const HERBAR_ORDER = ['gaensebluemchen', 'klatschmohn', 'eiche', 'wurmfarn', 'loewenzahn', 'ginkgo'];

// Herbarbogen: gealtertes Papier, Pflanze, Klebestreifen, Etikett
export function herbarCanvas(key) {
  return memo('herbar-' + key, () => {
    const [c, g] = canvas(W, H), rnd = mulberry32(key.length * 31 + 7); paperBase(g, W, H, '#f0e7cd', key.length);
    const v = g.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, 380); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(130,100,50,.22)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
    g.strokeStyle = 'rgba(120,90,40,.25)'; g.lineWidth = 1.5; g.strokeRect(10, 10, W - 20, H - 20);
    // Pflanze mit leichtem Schatten
    g.save(); g.shadowColor = 'rgba(70,50,20,.35)'; g.shadowBlur = 5; g.shadowOffsetX = 2; g.shadowOffsetY = 3; g.globalAlpha = 0.93; PLANTS[key](g); g.restore();
    g.save(); g.globalCompositeOperation = 'multiply'; g.globalAlpha = 0.18; g.fillStyle = '#c8a860'; g.fillRect(0, 0, W, H); g.restore();
    // Klebestreifen quer über Stängel
    g.save(); for (const [x, y, a] of [[200 + rnd() * 20, 250 + rnd() * 40, 0.5], [190 + rnd() * 30, 400 + rnd() * 30, -0.4]]) { g.translate(x, y); g.rotate(a); g.fillStyle = 'rgba(214,190,130,.55)'; g.strokeStyle = 'rgba(150,120,60,.4)'; g.fillRect(-26, -7, 52, 14); g.strokeRect(-26, -7, 52, 14); g.setTransform(1, 0, 0, 1, 0, 0); } g.restore();
    // Etikett unten rechts
    const P = HERBAR[key], lx = 150, ly = 478, lw = 232, lh = 66; g.save(); g.shadowColor = 'rgba(60,40,10,.3)'; g.shadowBlur = 4; g.shadowOffsetY = 2; g.fillStyle = '#fbf7ea'; g.fillRect(lx, ly, lw, lh); g.restore(); g.strokeStyle = 'rgba(80,60,30,.6)'; g.lineWidth = 1.5; g.strokeRect(lx + 3, ly + 3, lw - 6, lh - 6);
    g.fillStyle = '#2a2014'; g.textAlign = 'left'; g.textBaseline = 'alphabetic'; g.font = `bold 11px ${SERIF}`; g.fillText('HERBARIUM · ' + P.fam.toUpperCase().slice(0, 28), lx + 10, ly + 18, lw - 20); g.font = `italic bold 17px ${SERIF}`; g.fillText(P.sci, lx + 10, ly + 38, lw - 20); g.font = `14px ${SERIF}`; g.fillText(`${P.name} · Fundort: ${P.fund}`, lx + 10, ly + 57, lw - 20);
    return c;
  });
}
export function herbarSheet(key, { w = 0.46, h = 0.644 } = {}) {
  const tex = texOf(herbarCanvas(key)); const f = framedPicture(tex, { w, h, frame: 0.05, name: HERBAR[key].name, sub: HERBAR[key].sci.replace(/ \(L\.\) Schott| agg\./, ''), mat: M.brass() }); return f;
}
