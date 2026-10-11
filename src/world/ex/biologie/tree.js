// Biologie: Stammbaum des Lebens als großes Wandbild (Canvas 1024 x 1024). Nur Verwandtes steht beieinander:
// Wurzel -> Bakterien | (Archaeen -> Eukaryoten -> Einzeller | Pflanzen | (Pilze + Tiere)); Wirbeltiere verschachtelt: Fische, Amphibien, (Säugetiere | (Echsen | (Krokodile + Vögel)))
import { mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF } from './style.js';

const S = 1024;
const COL = { stamm: '#6a4a2c', bak: '#b0603e', arc: '#7e5cb4', euk: '#7a5a3a', ein: '#2d9a98', pfl: '#4a8f3c', pil: '#c98a2c', tie: '#3b72b8' };
const INK = '#2a1c10';

// ---------------------------------------------------------------- Knoten und Zweige
const N = {
  root: [512, 1010], f1: [512, 915], b1: [345, 840], f2: [585, 835], a1: [795, 800], e1: [570, 725], e2: [565, 605], p1: [410, 530], o1: [700, 535],
  p2: [395, 455], p3: [385, 383], p4: [375, 310], pi1: [820, 512],
  t1: [692, 468], t2: [686, 416], t3: [680, 364], t4: [674, 312], t5: [668, 262], v1: [705, 238], v2: [755, 216], s1: [808, 238], s2: [860, 260],
};
// Zweige (Eltern -> Kind, Krümmung, Farbe); die Dicke folgt der Zahl der Spitzen darunter (Röhrenmodell)
const EDGES = [
  ['root', 'f1', 'stamm', 0], ['f1', 'b1', 'bak', -0.18], ['f1', 'f2', 'stamm', 0.16], ['f2', 'a1', 'arc', -0.1], ['f2', 'e1', 'euk', 0.1], ['e1', 'e2', 'euk', 0.06],
  ['e2', 'p1', 'pfl', 0.2], ['e2', 'o1', 'tie', -0.2], ['p1', 'p2', 'pfl', 0.05], ['p2', 'p3', 'pfl', -0.04], ['p3', 'p4', 'pfl', 0.03],
  ['o1', 'pi1', 'pil', -0.12], ['o1', 't1', 'tie', 0.03], ['t1', 't2', 'tie', -0.03], ['t2', 't3', 'tie', 0.03], ['t3', 't4', 'tie', -0.03], ['t4', 't5', 'tie', 0.03],
  ['t5', 'v1', 'tie', 0.1], ['v1', 'v2', 'tie', -0.1], ['v2', 's1', 'tie', -0.08], ['s1', 's2', 'tie', 0.1],
];
// Spitzen: id, Knoten, Ort, Gruppenfarbe, Glyphe, Name, Zusatz
const TIPS = [
  ['cyano', 'b1', [95, 775], 'bak', 'cyano', 'Cyanobakterien', ''], ['darm', 'b1', [205, 690], 'bak', 'darm', 'Darmbakterien', ''], ['milch', 'b1', [320, 715], 'bak', 'milch', 'Milchsäure-', 'bakterien'],
  ['methan', 'a1', [715, 705], 'arc', 'methan', 'Methan-', 'bildner'], ['salz', 'a1', [820, 690], 'arc', 'salz', 'Salz-', 'liebende'], ['hitze', 'a1', [925, 712], 'arc', 'hitze', 'Hitze-', 'liebende'],
  ['einz', 'e1', [455, 628], 'ein', 'einz', 'Einzeller', 'z. B. Amöben'],
  ['gruen', 'p1', [120, 560], 'pfl', 'gruen', 'Grünalgen', ''], ['moos', 'p2', [120, 450], 'pfl', 'moos', 'Moose', ''], ['farn', 'p3', [190, 330], 'pfl', 'farn', 'Farne', ''], ['nadel', 'p4', [262, 205], 'pfl', 'nadel', 'Nadelbäume', ''], ['bluete', 'p4', [445, 195], 'pfl', 'bluete', 'Blüten-', 'pflanzen'],
  ['hefe', 'pi1', [945, 585], 'pil', 'hefe', 'Hefen', ''], ['hut', 'pi1', [925, 455], 'pil', 'hut', 'Hutpilze', ''],
  ['schwamm', 't1', [545, 462], 'tie', 'schwamm', 'Schwämme', ''], ['qualle', 't2', [815, 418], 'tie', 'qualle', 'Nesseltiere', 'z. B. Quallen'], ['schnecke', 't3', [570, 366], 'tie', 'schnecke', 'Weichtiere', 'z. B. Schnecken'], ['insekt', 't4', [825, 322], 'tie', 'insekt', 'Gliederfüßer', 'z. B. Insekten'],
  ['fisch', 't5', [578, 262], 'tie', 'fisch', 'Fische', ''], ['frosch', 'v1', [640, 176], 'tie', 'frosch', 'Amphibien', ''], ['maus', 'v2', [752, 142], 'tie', 'maus', 'Säugetiere', 'mit Mensch'], ['echse', 's1', [884, 172], 'tie', 'echse', 'Echsen,', 'Schlangen'], ['kroko', 's2', [952, 248], 'tie', 'kroko', 'Krokodile', ''], ['vogel', 's2', [962, 338], 'tie', 'vogel', 'Vögel', ''],
];
// Röhrenmodell: Dicke nach Zahl der Spitzen im Teilbaum
const KIDS = {}; for (const [a, b] of EDGES) (KIDS[a] = KIDS[a] || []).push(b);
const weight = (n) => (KIDS[n] || []).reduce((s, k) => s + weight(k), 0) + TIPS.filter((t) => t[1] === n).length;
const widthOf = (n) => { const w = weight(n); return w <= 1 ? 3 : 2.8 + 6.5 * (Math.sqrt(w) - 1) + 2; };
export const TIP_POS = Object.fromEntries(TIPS.map((t) => [t[0], t[2]]));

// ---------------------------------------------------------------- Zeichenhelfer
function bez(p0, p1, bend) { const mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2, dx = p1[0] - p0[0], dy = p1[1] - p0[1]; return [mx - dy * bend, my + dx * bend]; }
function branch(g, p0, p1, w0, w1, color, bend, pass = 2) {
  const c = bez(p0, p1, bend), pts = [], n = 28;
  for (let i = 0; i <= n; i++) { const t = i / n, a = (1 - t) * (1 - t), b = 2 * (1 - t) * t, d = t * t; pts.push([a * p0[0] + b * c[0] + d * p1[0], a * p0[1] + b * c[1] + d * p1[1], w0 + (w1 - w0) * t]); }
  const L = [], R = [];
  for (let i = 0; i <= n; i++) { const a = pts[Math.max(0, i - 1)], b = pts[Math.min(n, i + 1)]; let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m; L.push([pts[i][0] - ty * pts[i][2] / 2, pts[i][1] + tx * pts[i][2] / 2]); R.push([pts[i][0] + ty * pts[i][2] / 2, pts[i][1] - tx * pts[i][2] / 2]); }
  g.beginPath(); L.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); R.reverse().forEach(([x, y]) => g.lineTo(x, y)); g.closePath();
  if (pass === 0) { g.lineJoin = 'round'; g.lineWidth = 4.2; g.strokeStyle = 'rgba(30,20,10,.55)'; g.stroke(); } else { g.fillStyle = color; g.fill(); }
}
const text = (g, t, x, y, { font = 'bold 19px', color = INK, align = 'center', halo = '#f3ebd2', hw = 4 } = {}) => { g.save(); g.font = `${font} ${SERIF}`; g.textAlign = align; g.textBaseline = 'middle'; g.lineJoin = 'round'; g.lineWidth = hw; g.strokeStyle = halo; g.strokeText(t, x, y); g.fillStyle = color; g.fillText(t, x, y); g.restore(); };
function banner(g, label, x, y, color, { size = 25, w } = {}) { g.save(); g.font = `bold ${size}px ${SERIF}`; const tw = w || g.measureText(label).width + 36, h = size + 16; g.shadowColor = 'rgba(30,20,10,.35)'; g.shadowBlur = 6; g.shadowOffsetY = 3; g.fillStyle = color; g.beginPath(); g.roundRect(x - tw / 2, y - h / 2, tw, h, 10); g.fill(); g.shadowColor = 'transparent'; g.strokeStyle = 'rgba(255,248,220,.85)'; g.lineWidth = 2; g.beginPath(); g.roundRect(x - tw / 2 + 3, y - h / 2 + 3, tw - 6, h - 6, 8); g.stroke(); g.fillStyle = '#fff8e6'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, x, y + 1); g.restore(); return [x - tw / 2, y - h / 2, tw, h]; }

// ---------------------------------------------------------------- Glyphen (Radius etwa 14, Mittelpunkt 0,0)
const GL = {
  cyano(g, c) { for (let i = 0; i < 4; i++) { g.beginPath(); g.arc(-12 + i * 8, Math.sin(i * 1.3) * 3, 5.5, 0, TAU); g.fillStyle = '#4aa86a'; g.fill(); g.stroke(); } },
  darm(g, c) { g.beginPath(); g.roundRect(-11, -5, 22, 10, 5); g.fillStyle = c; g.fill(); g.stroke(); g.beginPath(); g.moveTo(11, 0); g.bezierCurveTo(16, -6, 18, 6, 22, 0); g.moveTo(-11, 1); g.bezierCurveTo(-16, 6, -18, -5, -22, 1); g.stroke(); },
  milch(g, c) { for (const [x, y] of [[-11, 3], [-4, -3], [4, 3], [11, -3]]) { g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fillStyle = c; g.fill(); g.stroke(); } },
  methan(g, c) { g.beginPath(); g.arc(0, 4, 9, 0, TAU); g.fillStyle = c; g.fill(); g.stroke(); g.fillStyle = '#e8e0f4'; for (const [x, y, r] of [[-4, -9, 2.4], [3, -12, 3], [8, -7, 2]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.stroke(); } },
  salz(g, c) { g.beginPath(); g.moveTo(-9, -4); g.lineTo(2, -4); g.lineTo(2, 9); g.lineTo(-9, 9); g.closePath(); g.fillStyle = '#f4f1ea'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(-9, -4); g.lineTo(-3, -10); g.lineTo(8, -10); g.lineTo(2, -4); g.moveTo(8, -10); g.lineTo(8, 3); g.lineTo(2, 9); g.fillStyle = '#d8d4ca'; g.fill(); g.stroke(); },
  hitze(g, c) { g.beginPath(); g.moveTo(0, -14); g.bezierCurveTo(14, -2, 12, 12, 0, 13); g.bezierCurveTo(-12, 12, -14, -1, -4, -6); g.bezierCurveTo(-3, -9, -1, -12, 0, -14); g.fillStyle = '#e8702a'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(6, 5, 4, 11, 0, 11); g.bezierCurveTo(-5, 10, -5, 4, 0, 0); g.fillStyle = '#f6d24a'; g.fill(); },
  einz(g, c) { g.beginPath(); g.moveTo(-12, 0); g.bezierCurveTo(-12, -12, 2, -14, 8, -9); g.bezierCurveTo(16, -6, 16, 4, 10, 8); g.bezierCurveTo(4, 14, -8, 12, -12, 0); g.fillStyle = '#9fe0d8'; g.fill(); g.stroke(); g.beginPath(); g.arc(-1, -1, 4.5, 0, TAU); g.fillStyle = c; g.fill(); g.stroke(); },
  gruen(g, c) { g.beginPath(); g.moveTo(-14, 0); for (let i = 0; i <= 28; i++) g.lineTo(-14 + i, Math.sin(i * 0.5) * 5); g.lineWidth = 5; g.strokeStyle = '#4aa84a'; g.stroke(); g.lineWidth = 1.5; g.strokeStyle = '#2a6a2a'; g.beginPath(); for (let i = 0; i <= 28; i++) g.lineTo(-14 + i, Math.sin(i * 0.5 + 1.6) * 3); g.stroke(); },
  moos(g, c) { g.beginPath(); g.moveTo(-14, 9); g.quadraticCurveTo(-12, -6, 0, -8); g.quadraticCurveTo(12, -6, 14, 9); g.closePath(); g.fillStyle = '#6aae48'; g.fill(); g.stroke(); g.fillStyle = '#3f8a35'; for (const [x, y] of [[-6, 0], [2, -2], [7, 3], [-2, 5], [-9, 6]]) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } g.strokeStyle = '#6a5a30'; g.beginPath(); g.moveTo(6, -6); g.lineTo(8, -13); g.stroke(); g.fillStyle = '#8a6a30'; g.beginPath(); g.ellipse(8, -14, 2.4, 3.4, 0, 0, TAU); g.fill(); },
  farn(g, c) { g.strokeStyle = '#3a7a30'; g.lineWidth = 2; g.beginPath(); g.moveTo(-10, 12); g.quadraticCurveTo(0, 0, 10, -14); g.stroke(); g.fillStyle = '#4aa040'; for (let i = 0; i < 6; i++) { const t = i / 6, x = -10 + 20 * t - 2, y = 12 - 26 * t - Math.sin(t * 3) * 2; for (const s of [-1, 1]) { g.beginPath(); g.ellipse(x + s * 5, y - s * 2, 6 - i * 0.6, 2.3, -0.7 + s * 0.5, 0, TAU); g.fill(); } } },
  nadel(g, c) { g.fillStyle = '#6a4a28'; g.fillRect(-2, 8, 4, 6); for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(-12 + i * 3, 9 - i * 8); g.lineTo(0, -14 + i * 2 - 0); g.lineTo(12 - i * 3, 9 - i * 8); g.closePath(); g.fillStyle = i % 2 ? '#2f7a3e' : '#3d8f4a'; g.fill(); g.stroke(); } },
  bluete(g, c) { for (let i = 0; i < 5; i++) { g.save(); g.rotate((i / 5) * TAU); g.beginPath(); g.ellipse(0, -9, 5.5, 8, 0, 0, TAU); g.fillStyle = '#f08aa8'; g.fill(); g.stroke(); g.restore(); } g.beginPath(); g.arc(0, 0, 4.4, 0, TAU); g.fillStyle = '#f2c43a'; g.fill(); g.stroke(); },
  hefe(g, c) { g.beginPath(); g.ellipse(-3, 3, 9, 8, 0, 0, TAU); g.fillStyle = '#efd9a0'; g.fill(); g.stroke(); g.beginPath(); g.ellipse(8, -6, 5.4, 5, 0, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.arc(-3, 3, 2.6, 0, TAU); g.fillStyle = c; g.fill(); },
  hut(g, c) { g.fillStyle = '#f0e4cc'; g.beginPath(); g.roundRect(-4, -2, 8, 16, 3); g.fill(); g.stroke(); g.beginPath(); g.moveTo(-15, 1); g.bezierCurveTo(-15, -14, 15, -14, 15, 1); g.closePath(); g.fillStyle = '#c44a30'; g.fill(); g.stroke(); g.fillStyle = '#fff'; for (const [x, y, r] of [[-7, -5, 2.4], [2, -8, 2.6], [8, -3, 2]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } },
  schwamm(g, c) { g.beginPath(); g.moveTo(-8, 12); g.bezierCurveTo(-14, -2, -10, -12, -6, -14); g.lineTo(6, -14); g.bezierCurveTo(10, -12, 14, -2, 8, 12); g.closePath(); g.fillStyle = '#f2c868'; g.fill(); g.stroke(); g.fillStyle = '#b8862a'; for (const [x, y] of [[-4, 2], [3, -4], [4, 5], [-3, -7], [0, 9]]) { g.beginPath(); g.ellipse(x, y, 2.2, 1.6, 0, 0, TAU); g.fill(); } g.beginPath(); g.ellipse(0, -14, 6, 2.4, 0, 0, TAU); g.fillStyle = '#8a5e18'; g.fill(); },
  qualle(g, c) { g.beginPath(); g.moveTo(-13, 2); g.bezierCurveTo(-13, -16, 13, -16, 13, 2); g.closePath(); g.fillStyle = '#d8b4f0'; g.fill(); g.stroke(); g.strokeStyle = '#8a64b0'; g.lineWidth = 2; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * 5, 2); g.bezierCurveTo(i * 5 + 4, 8, i * 5 - 4, 11, i * 5, 15); g.stroke(); } },
  schnecke(g, c) { g.beginPath(); g.moveTo(-14, 11); g.quadraticCurveTo(-4, 8, 8, 10); g.quadraticCurveTo(14, 11, 15, 6); g.lineTo(15, 2); g.lineTo(13, -2); g.lineTo(11, 3); g.lineTo(9, 10); g.closePath(); g.fillStyle = '#d8b88a'; g.fill(); g.stroke(); g.beginPath(); g.arc(-2, 0, 11, 0, TAU); g.fillStyle = '#c47a3a'; g.fill(); g.stroke(); g.strokeStyle = '#7a4018'; g.lineWidth = 1.6; g.beginPath(); for (let i = 0; i < 40; i++) { const a = i * 0.4, r = i * 0.26; g.lineTo(-2 + Math.cos(a) * r, Math.sin(a) * r); } g.stroke(); },
  insekt(g, c) { g.beginPath(); g.ellipse(0, 0, 7, 11, 0, 0, TAU); g.fillStyle = '#d83a3a'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(0, -11); g.lineTo(0, 11); g.stroke(); g.fillStyle = '#2a1c10'; for (const [x, y] of [[-3, -2], [3, 2], [-3, 5], [3, -5]]) { g.beginPath(); g.arc(x, y, 1.6, 0, TAU); g.fill(); } g.beginPath(); g.arc(0, -13, 4.4, 0, TAU); g.fill(); g.lineWidth = 1.6; for (const y of [-5, 0, 6]) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(s * 7, y); g.lineTo(s * 13, y + 3); g.stroke(); } },
  fisch(g, c) { g.beginPath(); g.moveTo(-16, 0); g.bezierCurveTo(-8, -12, 8, -12, 12, 0); g.bezierCurveTo(8, 12, -8, 12, -16, 0); g.fillStyle = '#6aa8d8'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(12, 0); g.lineTo(20, -8); g.lineTo(20, 8); g.closePath(); g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(-9, -2, 2.6, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(-9, -2, 1.2, 0, TAU); g.fill(); },
  frosch(g, c) { g.beginPath(); g.ellipse(0, 3, 12, 9, 0, 0, TAU); g.fillStyle = '#6fbf5a'; g.fill(); g.stroke(); for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 6, -6, 4.6, 0, TAU); g.fillStyle = '#6fbf5a'; g.fill(); g.stroke(); g.fillStyle = '#fff'; g.beginPath(); g.arc(s * 6, -6, 2.8, 0, TAU); g.fill(); g.fillStyle = INK; g.beginPath(); g.arc(s * 6, -6, 1.3, 0, TAU); g.fill(); } g.strokeStyle = INK; g.lineWidth = 1.6; g.beginPath(); g.arc(0, 4, 5, 0.2, Math.PI - 0.2); g.stroke(); },
  maus(g, c) { g.beginPath(); g.arc(0, 2, 10, 0, TAU); g.fillStyle = '#c9a888'; g.fill(); g.stroke(); for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 9, -7, 5.6, 0, TAU); g.fillStyle = '#e8b8b8'; g.fill(); g.stroke(); } g.fillStyle = INK; for (const s of [-1, 1]) { g.beginPath(); g.arc(s * 4, 0, 1.5, 0, TAU); g.fill(); } g.beginPath(); g.arc(0, 5, 1.8, 0, TAU); g.fillStyle = '#d86a7a'; g.fill(); g.strokeStyle = INK; g.lineWidth = 1; for (const s of [-1, 1]) for (const dy of [-1, 2]) { g.beginPath(); g.moveTo(s * 3, 6 + dy * 0.4); g.lineTo(s * 13, 5 + dy * 2); g.stroke(); } },
  echse(g, c) { g.strokeStyle = '#4a8a3a'; g.lineCap = 'round'; g.lineWidth = 7; g.beginPath(); g.moveTo(14, -4); g.bezierCurveTo(6, -10, 0, 0, -6, 2); g.bezierCurveTo(-12, 4, -14, 10, -20, 8); g.stroke(); g.lineWidth = 2.6; for (const [x, y, dx, dy] of [[8, -6, 4, -6], [8, -3, 5, 4], [-4, 2, -3, -6], [-4, 3, -2, 8]]) { g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + dy); g.stroke(); } g.fillStyle = INK; g.beginPath(); g.arc(14, -6, 1.2, 0, TAU); g.fill(); },
  kroko(g, c) { g.beginPath(); g.moveTo(-18, 2); g.quadraticCurveTo(-4, -6, 10, -4); g.lineTo(21, -2); g.lineTo(21, 3); g.lineTo(10, 3); g.quadraticCurveTo(-4, 9, -18, 2); g.closePath(); g.fillStyle = '#5a9a4a'; g.fill(); g.stroke(); g.fillStyle = '#3a6a2a'; for (let i = 0; i < 6; i++) { g.beginPath(); g.moveTo(-14 + i * 4, -3 + i * 0.1); g.lineTo(-12 + i * 4, -7); g.lineTo(-10 + i * 4, -3); g.fill(); } g.fillStyle = '#fff'; for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(11 + i * 3, 0); g.lineTo(12.4 + i * 3, 3.6); g.lineTo(13.8 + i * 3, 0); g.fill(); } g.fillStyle = '#f2d84a'; g.beginPath(); g.arc(8, -3, 1.8, 0, TAU); g.fill(); },
  vogel(g, c) { g.beginPath(); g.ellipse(-1, 2, 11, 8, -0.2, 0, TAU); g.fillStyle = '#d86a4a'; g.fill(); g.stroke(); g.beginPath(); g.arc(9, -5, 5.5, 0, TAU); g.fill(); g.stroke(); g.beginPath(); g.moveTo(14, -6); g.lineTo(21, -4); g.lineTo(14, -2); g.closePath(); g.fillStyle = '#f2b43a'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(-10, 4); g.lineTo(-20, -2); g.lineTo(-18, 8); g.closePath(); g.fillStyle = '#b8503a'; g.fill(); g.stroke(); g.fillStyle = INK; g.beginPath(); g.arc(10, -6, 1.2, 0, TAU); g.fill(); },
  mensch(g, c) { g.beginPath(); g.arc(0, -9, 5, 0, TAU); g.fillStyle = '#f0c8a0'; g.fill(); g.stroke(); g.beginPath(); g.moveTo(-8, 13); g.lineTo(-5, -2); g.lineTo(5, -2); g.lineTo(8, 13); g.closePath(); g.fillStyle = '#3b72b8'; g.fill(); g.stroke(); },
};

// ---------------------------------------------------------------- Zeichnung
export function treeCanvas() {
  return memo('tree-canvas', () => {
    const [c, g] = canvas(S, S), rnd = mulberry32(7);
    // Pergament
    g.fillStyle = '#efe5c8'; g.fillRect(0, 0, S, S);
    const img = g.getImageData(0, 0, S, S), d = img.data; for (let i = 0; i < d.length; i += 4) { const x = (i / 4) % S, y = Math.floor(i / 4 / S), n = (Math.sin(x * 0.018 + y * 0.011) + Math.sin(x * 0.007 - y * 0.02)) * 3 + (rnd() - 0.5) * 6; d[i] += n; d[i + 1] += n; d[i + 2] += n * 1.2; } g.putImageData(img, 0, 0);
    const v = g.createRadialGradient(S / 2, S / 2, 260, S / 2, S / 2, 740); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(120,90,40,.32)'); g.fillStyle = v; g.fillRect(0, 0, S, S);
    g.strokeStyle = '#7a5a30'; g.lineWidth = 6; g.strokeRect(14, 14, S - 28, S - 28); g.lineWidth = 2; g.strokeRect(26, 26, S - 52, S - 52);
    // Boden
    g.fillStyle = 'rgba(110,80,40,.25)'; g.beginPath(); g.moveTo(26, 990); for (let x = 26; x <= S - 26; x += 10) g.lineTo(x, 985 + Math.sin(x * 0.03) * 4); g.lineTo(S - 26, S - 26); g.lineTo(26, S - 26); g.closePath(); g.fill();
    // Wurzeln
    g.strokeStyle = COL.stamm; g.lineCap = 'round'; for (const [dx, dy, w] of [[-90, 25, 9], [-50, 32, 7], [70, 28, 8], [105, 20, 6], [-20, 38, 6]]) { g.lineWidth = w; g.beginPath(); g.moveTo(512, 1005); g.quadraticCurveTo(512 + dx * 0.4, 1012 + dy * 0.3, 512 + dx, 1000 + dy); g.stroke(); }
    // Äste (dicke zuerst: Reihenfolge der Liste ist von unten nach oben, später darüber)
    for (const pass of [0, 1]) { for (const [a, b, col, bend] of EDGES) branch(g, N[a], N[b], widthOf(b) * 1.08, widthOf(b), COL[col], bend, pass); for (const [id, node, pos, grp] of TIPS) branch(g, N[node], pos, 4.6, 2.8, COL[grp], (id.length % 2 ? 1 : -1) * 0.12, pass); }
    // gestrichelte Linien: Endosymbiose (Mitochondrien und Chloroplasten stammen von Bakterien)
    const dash = (p0, c1, c2, p1) => { g.save(); g.setLineDash([7, 6]); g.lineWidth = 2.6; g.strokeStyle = 'rgba(176,96,62,.9)'; g.beginPath(); g.moveTo(...p0); g.bezierCurveTo(...c1, ...c2, ...p1); g.stroke(); g.setLineDash([]); const a = Math.atan2(p1[1] - c2[1], p1[0] - c2[0]); g.fillStyle = 'rgba(176,96,62,.95)'; g.beginPath(); g.moveTo(p1[0], p1[1]); g.lineTo(p1[0] - 14 * Math.cos(a - 0.4), p1[1] - 14 * Math.sin(a - 0.4)); g.lineTo(p1[0] - 14 * Math.cos(a + 0.4), p1[1] - 14 * Math.sin(a + 0.4)); g.closePath(); g.fill(); g.restore(); };
    dash([358, 806], [440, 810], [500, 750], [548, 714]); dash([112, 748], [120, 640], [250, 560], [378, 538]);
    // Medaillons und Beschriftungen
    for (const [id, node, [x, y], grp, gl, name, sub] of TIPS) {
      g.save(); g.translate(x, y); g.shadowColor = 'rgba(30,20,10,.35)'; g.shadowBlur = 6; g.shadowOffsetY = 3; g.beginPath(); g.arc(0, 0, 26, 0, TAU); g.fillStyle = '#fbf6e6'; g.fill(); g.shadowColor = 'transparent'; g.lineWidth = 4.5; g.strokeStyle = COL[grp]; g.stroke();
      g.save(); g.scale(1.05, 1.05); g.lineWidth = 1.5; g.strokeStyle = INK; g.lineJoin = 'round'; GL[gl](g, COL[grp]); g.restore(); g.restore();
      const below = y < 700 || true; const ly = y + 42; text(g, name, x, ly, { font: 'bold 18px' }); if (sub) text(g, sub, x, ly + 19, { font: 'italic 15px', color: '#5a4630', hw: 3 });
    }
    // Gruppen-Schilder
    const regions = {};
    regions.bak = banner(g, 'Bakterien', 200, 890, COL.bak);
    regions.arc = banner(g, 'Archaeen', 880, 836, COL.arc);
    regions.euk = banner(g, 'Eukaryoten', 690, 640, COL.euk, { size: 21 }); text(g, '(Zellen mit Zellkern)', 690, 670, { font: 'italic 15px', color: '#4a3a24' });
    regions.pfl = banner(g, 'Pflanzen', 300, 492, COL.pfl);
    regions.pil = banner(g, 'Pilze', 850, 548, COL.pil, { size: 22 });
    regions.tie = banner(g, 'Tiere', 640, 532, COL.tie, { size: 22 });
    regions.wir = banner(g, 'Wirbeltiere', 790, 276, COL.tie, { size: 19 });
    // Wurzelbeschriftung und Hinweise
    text(g, 'Gemeinsame Vorfahren', 400, 950, { font: 'bold 18px', align: 'center' }); text(g, 'aller Lebewesen', 400, 970, { font: 'bold 18px', align: 'center' }); text(g, 'vor mehr als 3 Milliarden Jahren', 400, 992, { font: 'italic 15px', color: '#5a4630', align: 'center' });
    text(g, 'Mitochondrien', 478, 786, { font: 'italic 14px', color: '#8a4a2a', hw: 3 }); text(g, 'Chloroplasten', 250, 572, { font: 'italic 14px', color: '#8a4a2a', hw: 3 });
    text(g, 'Gestrichelte Pfeile: Mitochondrien und Chloroplasten', 800, 922, { font: 'italic 14px', color: '#5a3a20', hw: 3 }); text(g, 'stammen von Bakterien ab (Endosymbiose).', 800, 939, { font: 'italic 14px', color: '#5a3a20', hw: 3 });
    text(g, 'Je näher zwei Zweige am gleichen Ast', 800, 966, { font: 'italic 15px', color: '#4a3a24', hw: 3 }); text(g, 'ansetzen, desto enger sind sie verwandt.', 800, 984, { font: 'italic 15px', color: '#4a3a24', hw: 3 });
    // Titel
    g.fillStyle = '#4a2f18'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 46px ${SERIF}`; g.fillText('Der Stammbaum des Lebens', 512, 52); g.font = `italic 22px ${SERIF}`; g.fillStyle = '#6a4a2c'; g.fillText('Alle Lebewesen sind miteinander verwandt', 512, 85);
    g.strokeStyle = '#a07a40'; g.lineWidth = 2; g.beginPath(); g.moveTo(330, 99); g.lineTo(694, 99); g.stroke();
    treeCanvas.regions = { groups: regions };
    return c;
  });
}
// Trefferflächen (Pixel im Bild) für resolve(uv): Spitzen als Kreise um das Medaillon, Gruppenschilder als Rechtecke
export function treeHit(px, py) {
  treeCanvas();
  let best = null, bd = 1e9;
  for (const [id, , [x, y]] of TIPS) { const dx = px - x, dy = py - (y + 12); const inBox = Math.abs(px - x) < 62 && py > y - 30 && py < y + 66; const dd = Math.hypot(dx, dy); if (inBox && dd < bd) { bd = dd; best = id; } }
  if (best) return best;
  for (const [k, r] of Object.entries(treeCanvas.regions.groups)) if (px >= r[0] && px <= r[0] + r[2] && py >= r[1] && py <= r[1] + r[3]) return 'g-' + k;
  return null;
}
