// Weltkarte im Papierschnitt-Stil, komplett aus Küstenlinien (mapdata.js) im Canvas gezeichnet.
// renderMap(canvas, opts) malt Pergament, Meer, Länderstücke (mit Papierrand und Schatten), Gebirge, Flüsse, Beschriftung und Kartennadeln.
import { LAND, EUROPA_REGION, SEEN, FLUESSE, GEBIRGE, WUESTEN } from './mapdata.js';
import { drawIcon } from './icons.js';
import { mulberry32 } from '../../../lib/util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const TAU = Math.PI * 2;
const PAPER = '#f4ecd6', INK = '#3b2415';

const REGION = {
  nordamerika: '#c98a7c', gruenland: '#e8dfc9', baffin: '#c98a7c', arktisinseln: '#d3a092', ellesmere: '#d9b1a4',
  suedamerika: '#d5a45c', eurasien: '#e2c66f', tschuktschen: '#e2c66f', afrika: '#97b36c', madagaskar: '#97b36c',
  australien: '#ad8ebb', tasmanien: '#ad8ebb', neuseeland_n: '#ad8ebb', neuseeland_s: '#ad8ebb',
  sumatra: '#dba264', java: '#dba264', borneo: '#dba264', sulawesi: '#dba264', neuguinea: '#dba264', luzon: '#dba264', mindanao: '#dba264',
  honshu: '#e2c66f', hokkaido: '#e2c66f', kyushu: '#e2c66f', taiwan: '#e2c66f', hainan: '#e2c66f', srilanka: '#e2c66f', sachalin: '#e2c66f',
  grossbritannien: '#dc8f56', irland: '#dc8f56', island: '#dc8f56', sizilien: '#dc8f56', sardinien: '#dc8f56', korsika: '#dc8f56', kreta: '#dc8f56', zypern: '#e2c66f', spitzbergen: '#dc8f56', nowajasemlja: '#dc8f56',
  antarktis: '#f1f5f4',
};
const EUROPA_COL = '#dc8f56';
const DESERT = { sahara: 'rgba(120,80,30,.45)', arabien: 'rgba(120,80,30,.4)', gobi: 'rgba(120,80,30,.35)', australien: 'rgba(90,50,100,.38)', kalahari: 'rgba(90,100,40,.4)' };

// Kartennadeln: Position, Beschriftung, Symbol, Tafelversatz
export const PINS = [
  { id: 'aegypten', lon: 31.1, lat: 30.0, label: 'Ägypten · Nil', icon: 'pyramide', dx: 30, dy: 34 },
  { id: 'zweistromland', lon: 44.4, lat: 32.5, label: 'Zweistromland', icon: 'tafel', dx: 30, dy: -34 },
  { id: 'athen', lon: 23.7, lat: 38.0, label: 'Athen', icon: 'tempel', dx: 24, dy: -34 },
  { id: 'rom', lon: 12.5, lat: 41.9, label: 'Rom', icon: 'lorbeer', dx: -22, dy: 38 },
  { id: 'mainz', lon: 8.3, lat: 50.0, label: 'Mainz', icon: 'druck', dx: -36, dy: -4 },
  { id: 'xian', lon: 108.9, lat: 34.3, label: 'Xi’an', icon: 'soldat', dx: 30, dy: 34 },
  { id: 'machu', lon: -72.5, lat: -13.2, label: 'Machu Picchu', icon: 'terrassen', dx: -26, dy: 30 },
  { id: 'bahamas', lon: -74.5, lat: 24.0, label: 'Bahamas', icon: 'schiff', dx: -32, dy: 34 },
];

export function makeProj(box, rect) {
  const { lon0, lon1, lat0, lat1 } = box, { x, y, w, h } = rect;
  const P = (lon, lat) => [x + ((lon - lon0) / (lon1 - lon0)) * w, y + ((lat1 - lat) / (lat1 - lat0)) * h];
  P.inv = (px, py) => [lon0 + ((px - x) / w) * (lon1 - lon0), lat1 - ((py - y) / h) * (lat1 - lat0)];
  P.rect = rect; P.box = box; return P;
}

function smoothPath(g, pts, P) {
  const q = pts.map(([lo, la]) => P(lo, la)), n = q.length;
  g.beginPath(); g.moveTo((q[n - 1][0] + q[0][0]) / 2, (q[n - 1][1] + q[0][1]) / 2);
  for (let i = 0; i < n; i++) { const a = q[i], b = q[(i + 1) % n]; g.quadraticCurveTo(a[0], a[1], (a[0] + b[0]) / 2, (a[1] + b[1]) / 2); }
  g.closePath();
}
function linePath(g, pts, P) {
  const q = pts.map(([lo, la]) => P(lo, la)); g.beginPath(); g.moveTo(q[0][0], q[0][1]);
  for (let i = 1; i < q.length - 1; i++) g.quadraticCurveTo(q[i][0], q[i][1], (q[i][0] + q[i + 1][0]) / 2, (q[i][1] + q[i + 1][1]) / 2);
  g.lineTo(q[q.length - 1][0], q[q.length - 1][1]);
}
function spaced(g, text, x, y, sp, { stroke = null, fill = INK, lw = 6 } = {}) { // Text mit Sperrung, mittig
  const ws = [...text].map((c) => g.measureText(c).width + sp), tot = ws.reduce((a, b) => a + b, 0) - sp; let cx = x - tot / 2;
  [...text].forEach((c, i) => { g.textAlign = 'left'; if (stroke) { g.lineWidth = lw; g.strokeStyle = stroke; g.lineJoin = 'round'; g.strokeText(c, cx, y); } g.fillStyle = fill; g.fillText(c, cx, y); cx += ws[i]; });
}

function paperPiece(g, pathFn, color, { edge = 5, shadow = 1, y0 = 0, y1 = 100 } = {}) {
  g.save();
  if (shadow) { g.shadowColor = 'rgba(8,20,26,.55)'; g.shadowBlur = 9; g.shadowOffsetX = 4; g.shadowOffsetY = 6; }
  pathFn(); g.fillStyle = PAPER; g.fill(); g.lineWidth = edge * 2; g.lineJoin = 'round'; g.strokeStyle = PAPER; g.stroke();
  g.restore();
  g.save(); pathFn();
  const gr = g.createLinearGradient(0, y0, 0, y1); gr.addColorStop(0, shade(color, 1.1)); gr.addColorStop(1, shade(color, 0.86));
  g.fillStyle = gr; g.fill(); g.clip();
  return () => { // Abschluss (innen schattieren, Linie)
    pathFn(); g.lineWidth = 14; g.strokeStyle = 'rgba(70,35,15,.2)'; g.stroke();
    pathFn(); g.lineWidth = 2.2; g.strokeStyle = 'rgba(80,45,25,.45)'; g.stroke(); g.restore();
  };
}
function shade(hex, k) {
  const n = parseInt(hex.slice(1), 16), c = [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => Math.max(0, Math.min(255, Math.round(v * k))));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function seaBackground(g, r, rnd, P, lines) {
  const gr = g.createRadialGradient(r.x + r.w / 2, r.y + r.h / 2, r.h * 0.2, r.x + r.w / 2, r.y + r.h / 2, r.w * 0.62);
  gr.addColorStop(0, '#3f8a92'); gr.addColorStop(1, '#215662'); g.fillStyle = gr; g.fillRect(r.x, r.y, r.w, r.h);
  // Wellenstriche
  g.strokeStyle = 'rgba(255,255,255,.10)'; g.lineWidth = 2; g.lineCap = 'round';
  const n = Math.round((r.w * r.h) / 2600);
  for (let i = 0; i < n; i++) { const x = r.x + rnd() * r.w, y = r.y + rnd() * r.h, s = 10 + rnd() * 12; g.beginPath(); g.moveTo(x - s, y); g.quadraticCurveTo(x - s / 2, y - s * 0.45, x, y); g.quadraticCurveTo(x + s / 2, y + s * 0.45, x + s, y); g.stroke(); }
  if (lines) { // Gradnetz
    const { lon0, lon1, lat0, lat1 } = P.box; g.lineWidth = 1.4; g.strokeStyle = 'rgba(255,255,255,.14)';
    for (let lo = Math.ceil(lon0 / 30) * 30; lo <= lon1; lo += 30) { const [x] = P(lo, 0); g.beginPath(); g.moveTo(x, r.y); g.lineTo(x, r.y + r.h); g.stroke(); }
    for (let la = Math.ceil(lat0 / 30) * 30; la <= lat1; la += 30) { const [, y] = P(0, la); g.beginPath(); g.moveTo(r.x, y); g.lineTo(r.x + r.w, y); g.stroke(); }
    g.setLineDash([14, 10]); g.strokeStyle = 'rgba(255,236,170,.34)'; g.lineWidth = 2;
    for (const la of [0, 23.4, -23.4]) { const [, y] = P(0, la); if (y > r.y && y < r.y + r.h) { g.beginPath(); g.moveTo(r.x, y); g.lineTo(r.x + r.w, y); g.stroke(); } }
    g.setLineDash([]);
  }
}

function mountains(g, pts, P, rnd, size) {
  const q = pts.map(([lo, la]) => P(lo, la)); let acc = 0; const step = size * 1.05;
  for (let i = 1; i < q.length; i++) {
    const [x0, y0] = q[i - 1], [x1, y1] = q[i], len = Math.hypot(x1 - x0, y1 - y0); let t = (step - (acc % step)) % step;
    while (t < len) {
      const x = x0 + ((x1 - x0) * t) / len + (rnd() - 0.5) * size * 0.4, y = y0 + ((y1 - y0) * t) / len + (rnd() - 0.5) * size * 0.5, s = size * (0.7 + rnd() * 0.6);
      g.save(); g.shadowColor = 'rgba(40,20,5,.35)'; g.shadowBlur = 3; g.shadowOffsetX = 2; g.shadowOffsetY = 3;
      g.fillStyle = '#8a5a34'; g.beginPath(); g.moveTo(x - s, y + s * 0.55); g.lineTo(x, y - s * 0.75); g.lineTo(x + s, y + s * 0.55); g.closePath(); g.fill(); g.restore();
      g.fillStyle = '#c8935c'; g.beginPath(); g.moveTo(x - s, y + s * 0.55); g.lineTo(x, y - s * 0.75); g.lineTo(x + s * 0.1, y + s * 0.55); g.closePath(); g.fill();
      g.fillStyle = '#fbf3e0'; g.beginPath(); g.moveTo(x, y - s * 0.75); g.lineTo(x + s * 0.22, y - s * 0.3); g.lineTo(x + s * 0.02, y - s * 0.38); g.lineTo(x - s * 0.18, y - s * 0.3); g.closePath(); g.fill();
      t += step * (0.8 + rnd() * 0.5);
    }
    acc += len;
  }
}

function ship(g, x, y, s, flip = 1) {
  g.save(); g.translate(x, y); g.scale(s * flip, s);
  g.shadowColor = 'rgba(0,15,20,.5)'; g.shadowBlur = 6; g.shadowOffsetX = 3; g.shadowOffsetY = 5;
  g.fillStyle = '#f6efdc'; g.beginPath(); g.moveTo(-1.1, 0.1); g.lineTo(1.1, 0.1); g.lineTo(0.75, 0.55); g.lineTo(-0.7, 0.55); g.closePath(); g.fill();
  g.shadowColor = 'transparent';
  g.fillStyle = '#9a4a2a'; g.beginPath(); g.moveTo(-1.0, 0.12); g.lineTo(1.0, 0.12); g.lineTo(0.78, 0.4); g.lineTo(-0.66, 0.4); g.closePath(); g.fill();
  g.fillStyle = '#f6efdc'; g.fillRect(-0.04, -1.0, 0.08, 1.12);
  g.fillStyle = '#f6efdc'; g.beginPath(); g.moveTo(0.1, -0.95); g.quadraticCurveTo(0.9, -0.45, 0.8, 0.02); g.lineTo(0.1, 0.02); g.closePath(); g.fill();
  g.beginPath(); g.moveTo(-0.1, -0.7); g.quadraticCurveTo(-0.7, -0.3, -0.7, 0.02); g.lineTo(-0.1, 0.02); g.closePath(); g.fill();
  g.fillStyle = '#b8352b'; g.beginPath(); g.moveTo(0.04, -1.0); g.lineTo(0.5, -0.86); g.lineTo(0.04, -0.72); g.closePath(); g.fill();
  g.restore();
}

function compassRose(g, x, y, R) {
  g.save(); g.translate(x, y); g.shadowColor = 'rgba(0,15,20,.45)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 6;
  g.fillStyle = PAPER; g.beginPath(); g.arc(0, 0, R * 0.98, 0, TAU); g.fill(); g.shadowColor = 'transparent';
  g.lineWidth = R * 0.03; g.strokeStyle = '#7a5530'; g.beginPath(); g.arc(0, 0, R * 0.9, 0, TAU); g.stroke(); g.beginPath(); g.arc(0, 0, R * 0.8, 0, TAU); g.stroke();
  for (let i = 0; i < 32; i++) { const a = (i / 32) * TAU, l = i % 8 === 0 ? 0.9 : i % 4 === 0 ? 0.86 : 0.83; g.beginPath(); g.moveTo(Math.cos(a) * R * 0.8, Math.sin(a) * R * 0.8); g.lineTo(Math.cos(a) * R * l, Math.sin(a) * R * l); g.stroke(); }
  const star = (n, len, wid, c1, c2, rot) => { for (let i = 0; i < n; i++) { const a = rot + (i / n) * TAU; g.save(); g.rotate(a); g.fillStyle = c1; g.beginPath(); g.moveTo(0, -len); g.lineTo(wid, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.fillStyle = c2; g.beginPath(); g.moveTo(0, -len); g.lineTo(-wid, 0); g.lineTo(0, 0); g.closePath(); g.fill(); g.restore(); } };
  star(4, R * 0.46, R * 0.1, '#c8935c', '#7a4a28', Math.PI / 4); star(4, R * 0.72, R * 0.12, '#b8352b', '#7d1f18', 0);
  g.fillStyle = '#f6efdc'; g.beginPath(); g.arc(0, 0, R * 0.07, 0, TAU); g.fill();
  g.fillStyle = INK; g.font = `bold ${Math.round(R * 0.22)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('N', 0, -R * 0.88 - R * 0.0);
  g.restore();
}

// Hauptzeichnung. opts: {lon0,lon1,lat0,lat1, margin, labels, pins, lines, ornaments, title}
export function renderMap(canvas, opts = {}) {
  const o = { lon0: -180, lon1: 180, lat0: -70, lat1: 84, margin: 52, labels: true, pins: true, lines: true, ornaments: true, title: true, seed: 7, mtn: 15, ...opts };
  const W = canvas.width, H = canvas.height, g = canvas.getContext('2d'), rnd = mulberry32(o.seed);
  const m = o.margin, rect = { x: m, y: m, w: W - 2 * m, h: H - 2 * m };
  const P = makeProj({ lon0: o.lon0, lon1: o.lon1, lat0: o.lat0, lat1: o.lat1 }, rect);
  const kx = rect.w / (o.lon1 - o.lon0); // Pixel je Grad
  // ---- Pergament
  const pg = g.createLinearGradient(0, 0, W, H); pg.addColorStop(0, '#f1e3bd'); pg.addColorStop(0.5, '#ead9ab'); pg.addColorStop(1, '#e2cd9b');
  g.fillStyle = pg; g.fillRect(0, 0, W, H);
  for (let i = 0; i < 90; i++) { g.fillStyle = `rgba(${120 + rnd() * 40},${80 + rnd() * 30},30,${0.02 + rnd() * 0.035})`; g.beginPath(); g.ellipse(rnd() * W, rnd() * H, 20 + rnd() * 90, 14 + rnd() * 60, rnd() * 3, 0, TAU); g.fill(); }
  for (let i = 0; i < 2200; i++) { g.fillStyle = rnd() < 0.5 ? 'rgba(110,70,25,.07)' : 'rgba(255,250,230,.12)'; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 2, 1 + rnd() * 2); }
  const vg = g.createRadialGradient(W / 2, H / 2, H * 0.4, W / 2, H / 2, W * 0.7); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(90,50,10,.28)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);

  // ---- Meer
  g.save(); g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.clip();
  seaBackground(g, rect, rnd, P, o.lines);
  const names = Object.keys(LAND);
  // Küstenhalo
  for (const [lw, a] of [[38, 0.05], [24, 0.06], [12, 0.08]]) { g.lineWidth = lw; g.lineJoin = 'round'; g.strokeStyle = `rgba(255,255,255,${a})`; for (const k of names) { smoothPath(g, LAND[k], P); g.stroke(); } }
  // Schiffe
  if (o.labels) { ship(g, ...P(-38, 38), kx * 3.4, 1); ship(g, ...P(-150, -12), kx * 3.6, -1); ship(g, ...P(66, -33), kx * 3.4, 1); ship(g, ...P(160, 30), kx * 3.0, -1); }
  // Länder
  const y0 = rect.y, y1 = rect.y + rect.h;
  for (const k of names) {
    const fn = () => smoothPath(g, LAND[k], P), done = paperPiece(g, fn, REGION[k] || '#d9c07a', { edge: Math.max(3, kx * 0.9), y0, y1 });
    if (k === 'eurasien') { // Europa in anderer Farbe
      smoothPath(g, EUROPA_REGION, P); g.fillStyle = EUROPA_COL; g.fill();
      g.save(); g.setLineDash([10, 8]); g.strokeStyle = 'rgba(70,35,15,.4)'; g.lineWidth = 2.4; linePath(g, EUROPA_REGION.slice(1, 11), P); g.stroke(); g.restore();
    }
    // Papierkörnung
    for (let i = 0; i < 260; i++) { const x = rect.x + rnd() * rect.w, y = rect.y + rnd() * rect.h; g.fillStyle = rnd() < 0.5 ? 'rgba(255,248,225,.10)' : 'rgba(80,45,20,.07)'; g.fillRect(x, y, 2 + rnd() * 3, 2); }
    done();
  }
  // Wüsten (Punktfelder), Binnenmeere
  g.save();
  for (const k of Object.keys(WUESTEN)) {
    g.save(); const lk = k === 'sahara' || k === 'kalahari' ? 'afrika' : k === 'arabien' || k === 'gobi' ? 'eurasien' : 'australien'; smoothPath(g, LAND[lk], P); g.clip();
    smoothPath(g, WUESTEN[k], P); g.clip(); g.fillStyle = DESERT[k];
    const [bx0, by0] = P(Math.min(...WUESTEN[k].map((p) => p[0])), Math.max(...WUESTEN[k].map((p) => p[1]))), [bx1, by1] = P(Math.max(...WUESTEN[k].map((p) => p[0])), Math.min(...WUESTEN[k].map((p) => p[1])));
    const st = Math.max(9, kx * 2.1); for (let yy = by0, r = 0; yy < by1; yy += st * 0.8, r++) for (let xx = bx0 + (r % 2) * st / 2; xx < bx1; xx += st) { g.beginPath(); g.arc(xx + (rnd() - 0.5) * 3, yy + (rnd() - 0.5) * 3, 1.6 + rnd() * 1.4, 0, TAU); g.fill(); }
    g.restore();
  }
  g.restore();
  for (const k of Object.keys(SEEN)) { const fn = () => smoothPath(g, SEEN[k], P); g.save(); g.shadowColor = 'rgba(40,20,5,.35)'; g.shadowBlur = 5; fn(); g.fillStyle = PAPER; g.fill(); g.lineWidth = 6; g.strokeStyle = PAPER; g.stroke(); g.restore(); fn(); g.fillStyle = '#3b8c94'; g.fill(); }
  // Gebirge
  if (o.mtn) { const r2 = mulberry32(o.seed + 9); for (const k of Object.keys(GEBIRGE)) mountains(g, GEBIRGE[k], P, r2, kx * (k === 'himalaya' || k === 'anden' || k === 'rocky' ? 2.2 : 1.7) * (o.mtn / 15)); }
  // Flüsse
  g.lineCap = 'round'; g.lineJoin = 'round';
  for (const k of Object.keys(FLUESSE)) {
    const big = k === 'nil';
    linePath(g, FLUESSE[k], P); g.lineWidth = (big ? 8 : 5) + 4; g.strokeStyle = 'rgba(246,239,220,.85)'; g.stroke();
    linePath(g, FLUESSE[k], P); g.lineWidth = big ? 8 : 5; g.strokeStyle = '#3f8f9a'; g.stroke();
  }
  g.restore(); // Ende Clip Meer

  // ---- Rahmenlinien, Gradbeschriftung
  g.lineWidth = 5; g.strokeStyle = '#5a3a1e'; g.strokeRect(rect.x - 1, rect.y - 1, rect.w + 2, rect.h + 2);
  g.lineWidth = 2; g.strokeStyle = '#c9a24a'; g.strokeRect(rect.x - 9, rect.y - 9, rect.w + 18, rect.h + 18);
  g.lineWidth = 1.5; g.strokeStyle = '#5a3a1e'; g.strokeRect(rect.x - 15, rect.y - 15, rect.w + 30, rect.h + 30);
  if (o.ornaments && m >= 40) {
    g.fillStyle = '#5a3a1e'; g.font = `italic ${Math.round(m * 0.3)}px ${SERIF}`; g.textBaseline = 'middle'; g.textAlign = 'center';
    for (let lo = Math.ceil(o.lon0 / 30) * 30; lo <= o.lon1; lo += 30) { if (Math.abs(lo) === 180) continue; const [x] = P(lo, 0), t = lo === 0 ? '0°' : `${Math.abs(lo)}° ${lo < 0 ? 'W' : 'O'}`; g.fillText(t, x, m * 0.52 - 8); g.fillText(t, x, H - m * 0.52 + 8); }
    for (let la = Math.ceil(o.lat0 / 30) * 30; la <= o.lat1; la += 30) { const [, y] = P(0, la), t = la === 0 ? '0°' : `${Math.abs(la)}° ${la < 0 ? 'S' : 'N'}`; g.save(); g.translate(m * 0.45 - 4, y); g.rotate(-Math.PI / 2); g.fillText(t, 0, 0); g.restore(); g.save(); g.translate(W - m * 0.45 + 4, y); g.rotate(Math.PI / 2); g.fillText(t, 0, 0); g.restore(); }
    // Eckzierde
    for (const [cx, cy] of [[m * 0.5, m * 0.5], [W - m * 0.5, m * 0.5], [m * 0.5, H - m * 0.5], [W - m * 0.5, H - m * 0.5]]) { g.save(); g.translate(cx, cy); g.fillStyle = '#c9a24a'; g.strokeStyle = '#5a3a1e'; g.lineWidth = 1.5; g.beginPath(); for (let i = 0; i < 8; i++) { const a = (i / 8) * TAU, r = i % 2 ? m * 0.12 : m * 0.3; g.lineTo(Math.cos(a) * r, Math.sin(a) * r); } g.closePath(); g.fill(); g.stroke(); g.restore(); }
  }

  g.save(); g.beginPath(); g.rect(rect.x, rect.y, rect.w, rect.h); g.clip();
  // ---- Beschriftung
  if (o.labels) {
    const lab = (text, lon, lat, size, sp, col = INK, edge = 'rgba(250,240,215,.8)', italic = false) => { const [x, y] = P(lon, lat); g.font = `${italic ? 'italic ' : 'bold '}${Math.round(size)}px ${SERIF}`; g.textBaseline = 'middle'; spaced(g, text, x, y, sp, { stroke: edge, fill: col, lw: Math.max(4, size * 0.16) }); };
    lab('NORDAMERIKA', -102, 46, kx * 5.2, kx * 1.3); lab('SÜDAMERIKA', -44, -8, kx * 3.9, kx * 0.8); lab('AFRIKA', 19, 5, kx * 6, kx * 1.8);
    lab('ASIEN', 88, 55, kx * 6.4, kx * 2.4); lab('EUROPA', 22, 60.5, kx * 4.6, kx * 1.0); lab('AUSTRALIEN', 134, -27, kx * 4.4, kx * 1.0);
    const ocean = (t, lon, lat, size) => { const [x, y] = P(lon, lat); g.font = `italic ${Math.round(size)}px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = 'rgba(230,243,240,.82)'; t.split('\n').forEach((s, i, a) => g.fillText(s, x, y + (i - (a.length - 1) / 2) * size * 1.15)); };
    ocean('Atlantischer\nOzean', -33, 14, kx * 4.2); ocean('Pazifischer\nOzean', -140, 6, kx * 5); ocean('Pazifischer\nOzean', 164, 12, kx * 3.4); ocean('Indischer\nOzean', 80, -16, kx * 4.6); ocean('Nordpolarmeer', 60, 81, kx * 3.2);
    ocean('Südpolarmeer', 20, -66.5, kx * 3);
  }
  // Kompassrose und Titel
  if (o.labels && o.title) {
    compassRose(g, ...P(-30, -38), kx * 11);
    const [tx, ty] = P(118, -52), tw = kx * 74, th = kx * 13;
    g.save(); g.shadowColor = 'rgba(0,15,20,.5)'; g.shadowBlur = 8; g.shadowOffsetX = 4; g.shadowOffsetY = 6; g.fillStyle = PAPER;
    g.beginPath(); g.roundRect(tx - tw / 2, ty - th / 2, tw, th, 10); g.fill(); g.restore();
    g.lineWidth = 3; g.strokeStyle = '#7a5530'; g.beginPath(); g.roundRect(tx - tw / 2 + 8, ty - th / 2 + 8, tw - 16, th - 16, 6); g.stroke();
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${Math.round(th * 0.36)}px ${SERIF}`; g.fillText('Die Welt der Geschichte', tx, ty - th * 0.12);
    g.font = `italic ${Math.round(th * 0.2)}px ${SERIF}`; g.fillText('Tippe auf eine Nadel', tx, ty + th * 0.26);
  }
  // Kartennadeln
  if (o.pins) for (const p of PINS) {
    const [x, y] = P(p.lon, p.lat); if (x < rect.x || x > rect.x + rect.w || y < rect.y || y > rect.y + rect.h) continue;
    const r = Math.max(14, kx * 3.8);
    // Etikett
    g.font = `bold ${Math.round(r * 0.95)}px ${SERIF}`; const tw = g.measureText(p.label).width + r * 0.9, th = r * 1.45, lx = x + p.dx * (r / 26), ly = y + p.dy * (r / 26);
    const bx = p.dx < 0 ? lx - tw : lx;
    g.save(); g.shadowColor = 'rgba(8,20,26,.5)'; g.shadowBlur = 6; g.shadowOffsetX = 3; g.shadowOffsetY = 4; g.fillStyle = PAPER; g.beginPath(); g.roundRect(bx, ly - th / 2, tw, th, th * 0.3); g.fill(); g.restore();
    g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(p.label, bx + tw / 2, ly + 1);
    // Nadel
    g.save(); g.shadowColor = 'rgba(8,20,26,.55)'; g.shadowBlur = 6; g.shadowOffsetX = 3; g.shadowOffsetY = 5; g.fillStyle = PAPER; g.beginPath(); g.arc(x, y, r * 1.12, 0, TAU); g.fill(); g.restore();
    g.fillStyle = '#b8352b'; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.fillStyle = PAPER; g.beginPath(); g.arc(x, y, r * 0.8, 0, TAU); g.fill();
    drawIcon(g, p.icon, x, y, r * 0.6, INK, PAPER);
  }
  g.restore();
  return { P, pins: PINS, rect };
}
