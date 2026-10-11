// Erklärskizzen für die Karten (Canvas, im Code gezeichnet): Bunsenbrenner, Destillation, NaCl-Gitter, Atommodell.
import { canvas } from './util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const INK = '#2a1810', PAPER = '#f7edd3', TEAL = '#1f7f7f', RED = '#b5321f';

function sheet(w, h, title) {
  const [c, g] = canvas(w, h); g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9a96a'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
  if (title) { g.fillStyle = INK; g.font = `italic bold 24px ${SERIF}`; g.textAlign = 'center'; g.fillText(title, w / 2, 38); }
  g.textAlign = 'left'; return [c, g];
}
// Beschriftung mit Linie: von (x,y) zum Text bei (tx,ty)
function tag(g, text, x, y, tx, ty, { align = 'left', size = 17, col = INK } = {}) {
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.5; g.beginPath(); g.moveTo(x, y); g.lineTo(tx, ty); g.stroke();
  g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
  g.font = `${size}px ${SERIF}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, tx + (align === 'left' ? 6 : align === 'right' ? -6 : 0), ty); g.restore();
}
function arrow(g, x1, y1, x2, y2, col, w = 5) {
  const a = Math.atan2(y2 - y1, x2 - x1); g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * 8, y2 - Math.sin(a) * 8); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - 0.45) * 15, y2 - Math.sin(a - 0.45) * 15); g.lineTo(x2 - Math.cos(a + 0.45) * 15, y2 - Math.sin(a + 0.45) * 15); g.closePath(); g.fill(); g.restore();
}
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// ---------------------------------------------------------------- Bunsenbrenner: Luft offen / Luft zu
function burnerBody(g, cx, open) {
  const gy = 372;
  g.fillStyle = '#4a5056'; g.beginPath(); g.moveTo(cx - 62, gy); g.lineTo(cx + 62, gy); g.lineTo(cx + 54, gy - 14); g.lineTo(cx + 18, gy - 34); g.lineTo(cx - 18, gy - 34); g.lineTo(cx - 54, gy - 14); g.closePath(); g.fill();
  g.fillStyle = '#c9ced2'; g.fillRect(cx - 14, 190, 28, gy - 34 - 190);                           // Brennerrohr
  g.fillStyle = '#d9a441'; rr(g, cx - 22, 268, 44, 44, 4); g.fill(); g.strokeStyle = '#8a6a1c'; g.lineWidth = 2; g.stroke();   // Manschette
  g.fillStyle = open ? '#1c1d20' : '#c28f2f'; for (const dx of [-12, 4]) g.fillRect(cx + dx, 278, 8, 24);        // Luftlöcher
  g.fillStyle = '#c9ced2'; g.fillRect(cx - 50, gy - 30, 36, 10);                                // Gasstutzen
  g.fillStyle = '#c4521c'; g.fillRect(cx - 92, gy - 31, 44, 12);                                // Schlauch
}
export function bunsenDiagram() {
  const [c, g] = sheet(720, 420, 'Bunsenbrenner: Luft offen oder zu');
  // links: Luft offen, blaue Flamme
  let cx = 175; burnerBody(g, cx, true);
  const flame = (cx, col1, col2, h, wdt) => { const gr = g.createLinearGradient(0, 190 - h, 0, 190); gr.addColorStop(0, col1); gr.addColorStop(1, col2); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 13, 190); g.bezierCurveTo(cx - wdt, 190 - h * 0.45, cx - wdt * 0.5, 190 - h * 0.85, cx, 190 - h); g.bezierCurveTo(cx + wdt * 0.5, 190 - h * 0.85, cx + wdt, 190 - h * 0.45, cx + 13, 190); g.closePath(); g.fill(); };
  flame(cx, 'rgba(120,170,255,.55)', 'rgba(60,110,255,.9)', 125, 30);
  flame(cx, 'rgba(210,250,255,.95)', 'rgba(110,200,255,.95)', 58, 11);
  arrow(g, cx - 98, 252, cx - 30, 288, '#3a78c9'); arrow(g, cx + 98, 252, cx + 30, 288, '#3a78c9');
  arrow(g, cx - 120, 330, cx - 96, 330, '#c4521c', 4);
  tag(g, 'Luft', cx - 64, 270, 28, 236, { size: 18, col: '#3a78c9' }); tag(g, 'Gas', cx - 112, 330, 24, 304, { size: 18, col: '#c4521c' });
  tag(g, 'innerer Kegel', cx, 160, cx + 82, 120); tag(g, 'heißeste Zone', cx + 4, 130, cx + 92, 82, { col: RED });
  tag(g, 'Brennerrohr', cx + 14, 230, cx + 84, 232); tag(g, 'Luftregulierung', cx + 22, 290, cx + 84, 296);
  g.fillStyle = TEAL; g.font = `bold 20px ${SERIF}`; g.textAlign = 'center'; g.fillText('Luft offen', cx, 408); g.font = `italic 17px ${SERIF}`; g.fillStyle = INK; g.fillText('blaue, heiße Flamme', cx, 398 - 0);
  // rechts: Luft zu, gelbe Flamme
  cx = 520; burnerBody(g, cx, false); flame(cx, 'rgba(255,170,40,.5)', 'rgba(255,205,70,.95)', 175, 40);
  g.fillStyle = 'rgba(70,110,255,.8)'; g.beginPath(); g.ellipse(cx, 188, 11, 16, 0, 0, Math.PI * 2); g.fill();
  tag(g, 'gelbe, leuchtende Flamme', cx + 20, 120, cx + 70, 70, { col: '#a8650a' }); tag(g, 'Manschette zu', cx + 22, 290, cx + 80, 296);
  g.fillStyle = TEAL; g.font = `bold 20px ${SERIF}`; g.textAlign = 'center'; g.fillText('Luft zu', cx, 408); g.font = `italic 17px ${SERIF}`; g.fillStyle = INK; g.fillText('kälter, rußt: Sicherheitsflamme', cx, 398 - 0);
  g.textAlign = 'left'; return c;
}

// ---------------------------------------------------------------- Destillation (Schnittskizze)
export function distillDiagram() {
  const [c, g] = sheet(720, 440, 'Destillation mit dem Liebig-Kühler');
  // Heizpilz und Kolben
  g.fillStyle = '#4a5056'; rr(g, 52, 330, 130, 62, 8); g.fill(); g.fillStyle = '#b9ab8c'; g.beginPath(); g.ellipse(117, 330, 62, 16, 0, 0, Math.PI); g.fill();
  g.fillStyle = 'rgba(176,40,60,.78)'; g.beginPath(); g.arc(117, 292, 52, Math.PI * 0.12, Math.PI * 0.88); g.closePath(); g.fill();                      // Gemisch
  g.strokeStyle = TEAL; g.lineWidth = 4; g.fillStyle = 'rgba(200,235,245,.25)'; g.beginPath(); g.arc(117, 292, 62, Math.PI * 0.64 - 0.0, Math.PI * 2.36); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(200,235,245,.25)'; g.fillRect(104, 160, 26, 70); g.strokeRect(104, 160, 26, 70);
  g.fillStyle = '#e2dccb'; for (const [x, y] of [[100, 340], [116, 346], [132, 340], [108, 335]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  // Aufsatz, Thermometer, Seitenrohr
  g.fillStyle = 'rgba(200,235,245,.25)'; g.fillRect(100, 110, 34, 54); g.strokeRect(100, 110, 34, 54);
  g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); g.moveTo(117, 52); g.lineTo(117, 130); g.stroke(); g.fillStyle = RED; g.beginPath(); g.arc(117, 133, 8, 0, 7); g.fill();
  g.strokeStyle = TEAL; g.lineWidth = 4; g.fillStyle = 'rgba(200,235,245,.25)'; g.save(); g.translate(134, 132); g.rotate(0.31); g.fillRect(0, -8, 120, 16); g.strokeRect(0, -8, 120, 16); g.restore();
  // Kühler: Mantel + Innenrohr
  g.save(); g.translate(236, 160); g.rotate(0.31); g.fillStyle = 'rgba(80,160,230,.45)'; g.fillRect(0, -22, 300, 44); g.strokeStyle = TEAL; g.lineWidth = 4; g.strokeRect(0, -22, 300, 44);
  g.fillStyle = '#f7edd3'; g.fillRect(-20, -8, 372, 16); g.strokeRect(-20, -8, 372, 16);
  g.fillStyle = 'rgba(90,150,210,.8)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(40 + i * 48, 5, 3, 0, 7); g.fill(); }
  g.restore();
  // Anschlüsse: Wasser rein unten, raus oben
  g.strokeStyle = TEAL; g.lineWidth = 4; g.beginPath(); g.moveTo(448, 232); g.lineTo(436, 270); g.stroke(); g.beginPath(); g.moveTo(262, 130); g.lineTo(274, 96); g.stroke();
  arrow(g, 424, 330, 436, 276, '#3a78c9', 6); arrow(g, 276, 96, 300, 58, '#3a78c9', 6);
  // Vorlage
  g.fillStyle = 'rgba(200,235,245,.25)'; g.strokeStyle = TEAL; g.lineWidth = 4; g.beginPath(); g.moveTo(548, 280); g.lineTo(548, 310); g.lineTo(512, 392); g.lineTo(612, 392); g.lineTo(576, 310); g.lineTo(576, 280); g.closePath(); g.fill(); g.stroke();
  g.fillStyle = 'rgba(190,225,240,.85)'; g.beginPath(); g.moveTo(525, 366); g.lineTo(599, 366); g.lineTo(612, 392); g.lineTo(512, 392); g.closePath(); g.fill();
  g.strokeStyle = TEAL; g.lineWidth = 4; g.beginPath(); g.moveTo(520, 214); g.lineTo(556, 244); g.lineTo(556, 296); g.stroke(); g.fillStyle = 'rgba(90,150,210,.9)'; g.beginPath(); g.arc(556, 306, 4, 0, 7); g.fill();
  // Dampf
  g.strokeStyle = RED; g.setLineDash([7, 6]); g.lineWidth = 3; g.beginPath(); g.moveTo(117, 270); g.lineTo(117, 150); g.lineTo(150, 142); g.lineTo(290, 182); g.stroke(); g.setLineDash([]);
  // Beschriftung
  tag(g, 'Thermometer', 117, 70, 18, 56, { size: 16 }); g.fillStyle = INK;
  tag(g, 'Kugel in Höhe des Seitenrohrs', 117, 134, 180, 96, { size: 15 });
  tag(g, 'Destillationsaufsatz', 102, 145, 14, 118, { size: 16 });
  tag(g, 'Siedekolben mit Gemisch', 70, 285, 14, 250, { size: 16 }); tag(g, 'Siedesteine', 108, 342, 14, 420, { size: 16 }); tag(g, 'Heizpilz', 90, 372, 14, 396, { size: 16 });
  tag(g, 'Dampf', 117, 210, 40, 196, { size: 16, col: RED });
  tag(g, 'Liebig-Kühler', 360, 190, 360, 116, { size: 18, align: 'center' });
  tag(g, 'Kühlwasser rein (unten)', 424, 331, 340, 372, { size: 16, col: '#3a78c9', align: 'right' }); tag(g, 'Kühlwasser raus (oben)', 300, 58, 330, 66, { size: 16, col: '#3a78c9' });
  tag(g, 'Vorlage', 560, 340, 650, 330, { size: 17 }); tag(g, 'Destillat', 560, 378, 650, 372, { size: 17 });
  g.textAlign = 'left'; return c;
}

// ---------------------------------------------------------------- NaCl-Gitter: 3 x 3 x 3 Ionen, mittleres Ion mit seinen sechs Nachbarn
export function naclDiagram() {
  const [c, g] = sheet(720, 420, 'Kochsalz-Gitter (NaCl)'); const Na = '#6a78e0', Cl = '#5cc15a';
  const ox = 175, oy = 345, d = 96, px = (i, j, k) => [ox + i * d + k * d * 0.5, oy - j * d - k * d * 0.38];
  const pts = []; for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) pts.push({ i, j, k, na: (i + j + k) % 2 === 0 });
  g.strokeStyle = '#9a8a6a'; g.lineWidth = 2.5;
  for (const p of pts) { for (const [di, dj, dk] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) { const i = p.i + di, j = p.j + dj, k = p.k + dk; if (i < 3 && j < 3 && k < 3) { const [x1, y1] = px(p.i, p.j, p.k), [x2, y2] = px(i, j, k); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } } }
  // Nachbarn des mittleren Ions hervorheben
  g.strokeStyle = RED; g.lineWidth = 6; const [mx, my] = px(1, 1, 1); for (const [i, j, k] of [[0, 1, 1], [2, 1, 1], [1, 0, 1], [1, 2, 1], [1, 1, 0], [1, 1, 2]]) { const [x, y] = px(i, j, k); g.beginPath(); g.moveTo(mx, my); g.lineTo(x, y); g.stroke(); }
  const order = pts.slice().sort((a, b) => (b.k - a.k) || (a.j - b.j) || 0);
  for (const p of order.sort((a, b) => b.k - a.k || a.j - b.j)) { const [x, y] = px(p.i, p.j, p.k), r = p.na ? 14 : 22; const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, p.na ? Na : Cl); gr.addColorStop(1, p.na ? '#3b45a0' : '#2f7d2c'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  // Legende
  const lx = 520, ly = 110; g.font = `20px ${SERIF}`; g.fillStyle = INK; g.textBaseline = 'middle';
  g.fillStyle = Na; g.beginPath(); g.arc(lx, ly, 14, 0, 7); g.fill(); g.fillStyle = INK; g.fillText('Natrium-Ion', lx + 28, ly - 8); sup(g, 'Na', '+', lx + 28, ly + 14);
  g.fillStyle = Cl; g.beginPath(); g.arc(lx, ly + 76, 22, 0, 7); g.fill(); g.fillStyle = INK; g.fillText('Chlorid-Ion', lx + 36, ly + 68); sup(g, 'Cl', '–', lx + 36, ly + 92);
  g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); g.moveTo(lx - 14, ly + 160); g.lineTo(lx + 14, ly + 160); g.stroke(); g.fillStyle = INK; g.fillText('sechs Nachbarn', lx + 28, ly + 152); g.fillText('hat jedes Ion innen', lx + 28, ly + 178);
  g.textAlign = 'left'; g.textBaseline = 'alphabetic'; return c;
}
function sup(g, base, ch, x, y) { g.font = `19px ${SERIF}`; g.fillStyle = INK; g.fillText(base, x, y); const w = g.measureText(base).width; g.font = `13px ${SERIF}`; g.fillText(ch, x + w + 1, y - 7); }

// ---------------------------------------------------------------- Atommodell Natrium (Schalenmodell)
export function bohrDiagram() {
  const [c, g] = sheet(720, 400, 'Natrium-Atom (vereinfachtes Schalenmodell)'); const cx = 230, cy = 215;
  g.strokeStyle = '#8a7a58'; g.lineWidth = 2.5; for (const r of [52, 98, 144]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
  // Kern aus Protonen und Neutronen
  const rnd = (() => { let s = 7; return () => (s = (s * 16807) % 2147483647) / 2147483647; })();
  for (let i = 0; i < 23; i++) { const a = rnd() * 6.283, r = Math.sqrt(rnd()) * 20; g.fillStyle = i < 11 ? '#c8372d' : '#8b9096'; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 7, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke(); }
  const el = (r, n, off) => { for (let i = 0; i < n; i++) { const a = off + (i / n) * 6.283, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; g.fillStyle = '#2f7fd0'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.strokeStyle = '#123a66'; g.lineWidth = 1.5; g.stroke(); } };
  el(52, 2, 0.7); el(98, 8, 0.2); el(144, 1, -0.6);
  tag(g, 'Kern: 11 Protonen (rot), 12 Neutronen (grau)', cx + 10, cy - 12, 400, 120, { size: 17 });
  tag(g, '1. Schale: 2 Elektronen', cx + 52 * Math.cos(0.7), cy + 52 * Math.sin(0.7), 400, 190, { size: 17, col: '#2f7fd0' });
  tag(g, '2. Schale: 8 Elektronen', cx + 98 * Math.cos(0.2 + 1.57), cy + 98 * Math.sin(0.2 + 1.57), 400, 250, { size: 17, col: '#2f7fd0' });
  tag(g, '3. Schale: 1 Elektron', cx + 144 * Math.cos(-0.6), cy + 144 * Math.sin(-0.6), 400, 310, { size: 17, col: '#2f7fd0' });
  g.fillStyle = INK; g.font = `italic 16px ${SERIF}`; g.fillText('Das einzelne Außenelektron wird leicht abgegeben.', 400, 360);
  g.textAlign = 'left'; return c;
}
