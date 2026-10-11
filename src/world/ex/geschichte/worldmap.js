// Weltkarte für den Raum Geschichte: die Karte selbst kommt aus src/world/ex/worldmap.js (Natural Earth, Robinson-Projektion);
// hier kommen Pergamentrand, Alterung, Papierschnitt-Zierde (Schiffe, Kompassrose, Titelschild) und die Kartennadeln dazu.
// renderMap(canvas) -> { P, pins, outline }   P(lon, lat) = Pixel auf dem Canvas
import { drawWorld, worldProject, ROBINSON_ASPECT } from '../worldmap.js';
import { drawIcon } from './icons.js';
import { mulberry32 } from '../../../lib/util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const TAU = Math.PI * 2, PAPER = '#f4ecd6', INK = '#3b2415';

// Kartennadeln: Position, Beschriftung, Symbol, Versatz des Schildchens (Pixel bei 2048 Breite)
export const PINS = [
  { id: 'aegypten', lon: 31.1, lat: 30.0, label: 'Ägypten · Nil', icon: 'pyramide', dx: 34, dy: 40 },
  { id: 'zweistromland', lon: 44.4, lat: 32.5, label: 'Zweistromland', icon: 'tafel', dx: 34, dy: -36 },
  { id: 'athen', lon: 23.7, lat: 38.0, label: 'Athen', icon: 'tempel', dx: 26, dy: -40 },
  { id: 'rom', lon: 12.5, lat: 41.9, label: 'Rom', icon: 'lorbeer', dx: -26, dy: 36 },
  { id: 'mainz', lon: 8.3, lat: 50.0, label: 'Mainz', icon: 'druck', dx: -34, dy: -8 },
  { id: 'xian', lon: 108.9, lat: 34.3, label: 'Xi’an', icon: 'soldat', dx: 34, dy: 40 },
  { id: 'machu', lon: -72.5, lat: -13.2, label: 'Machu Picchu', icon: 'terrassen', dx: -30, dy: 34 },
  { id: 'bahamas', lon: -74.5, lat: 24.0, label: 'Bahamas', icon: 'schiff', dx: -34, dy: 38 },
];

export function mapSize(w = 2048, margin = 44) { const iw = w - 2 * margin, ih = Math.round(iw / ROBINSON_ASPECT); return { w, h: ih + 2 * margin, iw, ih, margin }; }

function ship(g, x, y, s, flip = 1) {
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  g.shadowColor = 'rgba(40,20,5,.5)'; g.shadowBlur = 6; g.shadowOffsetX = 3; g.shadowOffsetY = 5;
  g.fillStyle = PAPER; g.beginPath(); g.moveTo(-1.1, 0.1); g.lineTo(1.1, 0.1); g.lineTo(0.75, 0.55); g.lineTo(-0.7, 0.55); g.closePath(); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = '#9a4a2a'; g.beginPath(); g.moveTo(-1.0, 0.12); g.lineTo(1.0, 0.12); g.lineTo(0.78, 0.4); g.lineTo(-0.66, 0.4); g.closePath(); g.fill();
  g.fillStyle = PAPER; g.fillRect(-0.04, -1.0, 0.08, 1.12);
  g.beginPath(); g.moveTo(0.1, -0.95); g.quadraticCurveTo(0.9, -0.45, 0.8, 0.02); g.lineTo(0.1, 0.02); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-0.1, -0.7); g.quadraticCurveTo(-0.7, -0.3, -0.7, 0.02); g.lineTo(-0.1, 0.02); g.closePath(); g.fill();
  g.fillStyle = '#b8352b'; g.beginPath(); g.moveTo(0.04, -1.0); g.lineTo(0.5, -0.86); g.lineTo(0.04, -0.72); g.closePath(); g.fill();
  g.restore();
}
function compassRose(g, x, y, R) {
  g.save(); g.translate(x, y); g.shadowColor = 'rgba(40,20,5,.45)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 6;
  g.fillStyle = PAPER; g.beginPath(); g.arc(0, 0, R * 0.98, 0, TAU); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = R * 0.03; g.strokeStyle = '#7a5530'; g.beginPath(); g.arc(0, 0, R * 0.9, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.8, 0, TAU); g.stroke();
  for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU, l = i % 8 === 0 ? 0.9 : i % 4 === 0 ? 0.86 : 0.83; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); g.lineTo(Math.cos(a) * R * l, Math.sin(a) * R * l); g.stroke(); }
  const star = (n, len, wid, c1, c2, rot) => { for (let i = 0; i < n; i++) { g.save(); g.rotate(rot + (i / n) * TAU); g.fillStyle = c1; g.beginPath(); g.moveTo(0, -len); g.lineTo(wid, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(0, -len); g.lineTo(-wid, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.restore(); } };
  star(4, R * 0.46, R * 0.1, '#c8935c', '#7a4a28', Math.PI / 4); star(4, R * 0.72, R * 0.12, '#b8352b', '#7d1f18', 0);
  g.fillStyle = PAPER; g.beginPath(); g.arc(0, 0, R * 0.07, 0, TAU); g.fill();
  g.fillStyle = INK; g.font = `bold ${Math.round(R * 0.22)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 0, -R * 0.88);
  g.restore();
}
function shield(g, x, y, w, h, l1, l2) { // Titelschild (Papier mit Rand)
  g.save(); g.shadowColor = 'rgba(40,20,5,.5)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 6; g.fillStyle = PAPER; g.beginPath(); g.roundRect(x - w / 2, y - h / 2, w, h, 10); g.fill(); g.restore();
  g.lineWidth = 3; g.strokeStyle = '#7a5530'; g.beginPath(); g.roundRect(x - w / 2 + 8, y - h / 2 + 8, w - 16, h - 16, 6); g.stroke();
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${Math.round(h * 0.3)}px ${SERIF}`; g.fillText(l1, x, y - h * 0.13, w - 30);
  g.font = `italic ${Math.round(h * 0.19)}px ${SERIF}`; g.fillText(l2, x, y + h * 0.26, w - 30);
}
function aging(g, W, H, rnd) { // Pergament-Alterung: Flecken, Fasern, dunkle Ränder
  g.save(); g.globalCompositeOperation = 'multiply';
  for (let i = 0; i < 40; i++) { const x = rnd() * W, y = rnd() * H, r = 25 + rnd() * 90, gr = g.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, `rgba(${150 + rnd() * 50},${110 + rnd() * 40},${50 + rnd() * 30},${0.05 + rnd() * 0.05})`); gr.addColorStop(1, 'rgba(150,110,50,0)'); g.fillStyle = gr; g.fillRect(x - r, y - r, 2 * r, 2 * r); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.35, W / 2, H / 2, W * 0.62); vg.addColorStop(0, 'rgba(255,255,255,0)'); vg.addColorStop(1, 'rgba(140,90,40,.38)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  g.restore();
  for (let i = 0; i < 2600; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(110,70,25,.07)' : 'rgba(255,250,230,.10)'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); }
  g.strokeStyle = 'rgba(110,70,25,.10)'; g.lineWidth = 1; for (let i = 0; i < 160; i++) { const x = rnd() * W, y = rnd() * H, a = rnd() * TAU, l = 6 + rnd() * 18; g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
}

// Beschriftung (eigene Plätze, damit sie nicht unter den Kartennadeln verschwindet): [Text, lon, lat, Größe, Art]
const LABELS = [
  ['Nordamerika', -102, 46, 1, 'land'], ['Südamerika', -52, -22, 1, 'land'], ['Europa', 26, 58, 0.72, 'land'], ['Afrika', 20, 3, 1, 'land'], ['Asien', 88, 52, 1.1, 'land'], ['Australien', 134, -25, 0.85, 'land'],
  ['Pazifischer Ozean', -150, 8, 1, 'sea'], ['Pazifischer Ozean', -128, -34, 1, 'sea'], ['Atlantischer Ozean', -36, 14, 1, 'sea'], ['Indischer Ozean', 80, -20, 1, 'sea'], ['Südlicher Ozean', 40, -60, 0.9, 'sea'],
];
function labels(g, P, ih) {
  g.textAlign = 'center'; g.textBaseline = 'middle';
  for (const [t, lon, lat, k, kind] of LABELS) {
    const [x, y] = P(lon, lat), fs = Math.round(ih * 0.04 * k); g.font = `${kind === 'sea' ? 'italic' : 'bold'} ${fs}px ${SERIF}`;
    g.fillStyle = kind === 'sea' ? 'rgba(248,238,208,.92)' : 'rgba(56,34,12,.88)'; g.shadowColor = kind === 'sea' ? 'rgba(10,30,45,.55)' : 'rgba(255,245,215,.7)'; g.shadowBlur = fs * 0.12; g.fillText(t, x, y); g.shadowBlur = 0;
  }
}

// zwei Flüsse als blaue Linien: der Nil (Ägypten-Buch) und der Rhein (Mainz); stark vereinfacht
const FLUESSE = {
  nil: [[31, 31.4], [31.2, 30], [31.3, 28], [32.6, 25.7], [32.9, 24], [32.3, 21.8], [30.7, 19.8], [32, 18.6], [33.5, 18], [33.8, 16.5], [32.5, 15.6], [32, 12], [31.6, 9.5], [31.8, 6], [32.3, 3.5], [33, 1], [33.3, 0]],
  rhein: [[9.4, 46.7], [9.5, 47.5], [7.6, 47.6], [7.8, 48.6], [8.3, 50], [6.96, 50.94], [6.1, 51.8], [4.1, 52]],
};
function rivers(g, P, k) {
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const [name, pts] of Object.entries(FLUESSE)) {
    const q = pts.map(([lo, la]) => P(lo, la)); g.beginPath(); g.moveTo(q[0][0], q[0][1]); for (let i = 1; i < q.length - 1; i++) g.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2); g.lineTo(q[q.length - 1][0], q[q.length - 1][1]);
    const lw = (name === 'nil' ? 5.5 : 4) * k; g.strokeStyle = 'rgba(246,239,220,.9)'; g.lineWidth = lw + 3 * k; g.stroke(); g.strokeStyle = '#2f7f94'; g.lineWidth = lw; g.stroke();
  }
}

// Wandkarte. opts: { style: 'parchment'|'atlas', margin }
export function renderMap(canvas, opts = {}) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d'), rnd = mulberry32(opts.seed ?? 7);
  const m = opts.margin ?? 44, iw = W - 2 * m, ih = H - 2 * m, k = W / 2048;
  // Pergament
  const pg = g.createLinearGradient(0, 0, W, H); pg.addColorStop(0, '#f1e3bd'); pg.addColorStop(0.5, '#ead9ab'); pg.addColorStop(1, '#e2cd9b'); g.fillStyle = pg; g.fillRect(0, 0, W, H);
  // Karte (Robinson) in den Rahmen
  const P0 = worldProject(iw, ih, { proj: 'robinson' }), P = (lon, lat) => { const [x, y] = P0(lon, lat); return [x + m, y + m]; };
  const outline = new Path2D(); for (let lat = -90; lat <= 90; lat += 3) { const [x, y] = P(-180, lat); lat === -90 ? outline.moveTo(x, y) : outline.lineTo(x, y); } for (let lat = 90; lat >= -90; lat -= 3) { const [x, y] = P(180, lat); outline.lineTo(x, y); } outline.closePath();
  g.save(); g.translate(m, m); drawWorld(g, iw, ih, { proj: 'robinson', style: opts.style || 'atlas', lines: false, grid: 30, labels: false }); g.restore();
  if (opts.tint !== 0) { g.save(); g.clip(outline); g.globalCompositeOperation = 'multiply'; g.fillStyle = `rgba(240,214,150,${opts.tint ?? 0.55})`; g.fillRect(0, 0, W, H); g.restore(); } // wie vergilbtes Papier
  g.lineJoin = 'round'; g.lineWidth = 8 * k; g.strokeStyle = '#5a3a1e'; g.stroke(outline); g.lineWidth = 2.5 * k; g.strokeStyle = '#d9b058'; g.save(); g.translate(0, 0); g.stroke(outline); g.restore();
  rivers(g, P, k); labels(g, P, ih);
  // Zierde in den freien Ecken und auf dem Meer
  ship(g, ...P(-38, 40), 34 * k, 1); ship(g, ...P(-150, -14), 36 * k, -1); ship(g, ...P(70, -34), 34 * k, 1); ship(g, ...P(160, 26), 30 * k, -1);
  compassRose(g, m + 120 * k, H - m - 120 * k, 105 * k);
  shield(g, m + 190 * k, m + 70 * k, 340 * k, 104 * k, 'Die Welt', 'der Geschichte');
  shield(g, W - m - 205 * k, m + 62 * k, 360 * k, 90 * k, 'Tippe auf eine Nadel', 'und erfahre mehr');
  // Kartennadeln
  for (const p of PINS) {
    const [x, y] = P(p.lon, p.lat), r = 24 * k;
    g.font = `bold ${Math.round(r * 0.95)}px ${SERIF}`; const tw = g.measureText(p.label).width + r * 0.9, th = r * 1.45, lx = x + p.dx * k, ly = y + p.dy * k, bx = p.dx < 0 ? lx - tw : lx;
    g.save(); g.shadowColor = 'rgba(40,20,5,.5)'; g.shadowBlur = 6; g.shadowOffsetX = 3; g.shadowOffsetY = 4; g.fillStyle = PAPER; g.beginPath(); g.roundRect(bx, ly - th / 2, tw, th, th * 0.3); g.fill(); g.restore();
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.label, bx + tw / 2, ly + 1);
    g.save(); g.shadowColor = 'rgba(40,20,5,.55)'; g.shadowBlur = 6; g.shadowOffsetX = 3; g.shadowOffsetY = 5; g.fillStyle = PAPER; g.beginPath(); g.arc(x, y, r * 1.12, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#b8352b'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = PAPER; g.beginPath(); g.arc(x, y, r * 0.8, 0, TAU); g.fill();
    drawIcon(g, p.icon, x, y, r * 0.6, INK, PAPER);
  }
  aging(g, W, H, rnd);
  return { P, pins: PINS };
}

// Ausschnitt (Mittelmeer und Nil) für den Kartentisch: gleichrechteckig mit Pergamentrand
export function renderCrop(canvas, { lon0 = -12, lon1 = 50, lat0 = 20, lat1 = 53, margin = 22, style = 'parchment', seed = 3 } = {}) {
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d'), rnd = mulberry32(seed), m = margin;
  g.fillStyle = '#ead9ab'; g.fillRect(0, 0, W, H);
  g.save(); g.translate(m, m); drawWorld(g, W - 2 * m, H - 2 * m, { proj: 'equirect', style, lon0, lon1, lat0, lat1, lines: false, grid: 10, labels: false }); g.restore();
  g.lineWidth = 5; g.strokeStyle = '#5a3a1e'; g.strokeRect(m - 1, m - 1, W - 2 * m + 2, H - 2 * m + 2); g.lineWidth = 2; g.strokeStyle = '#c9a24a'; g.strokeRect(m - 8, m - 8, W - 2 * m + 16, H - 2 * m + 16);
  aging(g, W, H, rnd);
  return canvas;
}
