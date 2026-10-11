// Erklärskizzen für die Karten (Canvas, im Code gezeichnet): Bunsenbrenner, Destillation, NaCl-Gitter, Atommodell.
import { canvas } from './util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const INK = '#2a1810', PAPER = '#f7edd3', TEAL = '#1f7f7f', RED = '#b5321f', BLUE = '#2f6fc0', GLASS = 'rgba(200,235,245,.35)';

// Papierblatt mit Rahmen; die Überschrift sitzt links von der Mitte, damit der Schließen-Knopf der Karte (rechts oben) nichts verdeckt
function sheet(w, h, title) {
  const [c, g] = canvas(w, h); g.fillStyle = PAPER; g.fillRect(0, 0, w, h);
  g.strokeStyle = '#c9a96a'; g.lineWidth = 3; g.strokeRect(6, 6, w - 12, h - 12);
  if (title) { g.fillStyle = INK; g.font = `italic bold 24px ${SERIF}`; g.textAlign = 'left'; g.fillText(title, 24, 40); }
  g.textAlign = 'left'; return [c, g];
}
// Beschriftung mit Linie vom Punkt (x,y) zum Text bei (tx,ty); mehrere Zeilen mit \n
function tag(g, text, x, y, tx, ty, { align = 'left', size = 17, col = INK } = {}) {
  g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 1.5; g.font = `${size}px ${SERIF}`;
  const lines = text.split('\n'), tw = Math.max(...lines.map((l) => g.measureText(l).width));
  // Der Strich endet am Textrand, der dem Anker zugewandt ist (nie durch den Text hindurch)
  let ex = tx; if (align === 'left') ex = tx < x ? tx + tw + 10 : tx; else if (align === 'right') ex = tx;
  g.beginPath(); g.moveTo(x, y); g.lineTo(ex, ty); g.stroke(); g.beginPath(); g.arc(x, y, 3, 0, Math.PI * 2); g.fill();
  g.textAlign = align; g.textBaseline = 'middle'; const x0 = tx + (align === 'left' ? (tx < x ? 0 : 6) : align === 'right' ? -6 : 0);
  lines.forEach((ln, i) => g.fillText(ln, x0, ty + (i - (lines.length - 1) / 2) * (size + 3))); g.restore();
}
function label(g, text, x, y, { size = 18, col = INK, align = 'left', bold = false, italic = false } = {}) {
  g.save(); g.fillStyle = col; g.font = `${italic ? 'italic ' : ''}${bold ? 'bold ' : ''}${size}px ${SERIF}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(text, x, y); g.restore();
}
function arrow(g, x1, y1, x2, y2, col, w = 5) {
  const a = Math.atan2(y2 - y1, x2 - x1); g.save(); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = w; g.lineCap = 'round'; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2 - Math.cos(a) * 8, y2 - Math.sin(a) * 8); g.stroke();
  g.beginPath(); g.moveTo(x2, y2); g.lineTo(x2 - Math.cos(a - 0.45) * 15, y2 - Math.sin(a - 0.45) * 15); g.lineTo(x2 - Math.cos(a + 0.45) * 15, y2 - Math.sin(a + 0.45) * 15); g.closePath(); g.fill(); g.restore();
}
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); };

// ---------------------------------------------------------------- Bunsenbrenner: Luft offen / Luft zu
function burnerBody(g, cx, open, gy) {
  g.fillStyle = '#4a5056'; g.beginPath(); g.moveTo(cx - 62, gy); g.lineTo(cx + 62, gy); g.lineTo(cx + 54, gy - 14); g.lineTo(cx + 18, gy - 34); g.lineTo(cx - 18, gy - 34); g.lineTo(cx - 54, gy - 14); g.closePath(); g.fill();
  g.fillStyle = '#c9ced2'; g.fillRect(cx - 14, gy - 190, 28, 190 - 34);                           // Brennerrohr
  g.fillStyle = '#d9a441'; rr(g, cx - 22, gy - 112, 44, 44, 4); g.fill(); g.strokeStyle = '#8a6a1c'; g.lineWidth = 2; g.stroke();   // Manschette
  g.fillStyle = open ? '#1c1d20' : '#c28f2f'; for (const dx of [-12, 4]) g.fillRect(cx + dx, gy - 102, 8, 24);        // Luftlöcher
  g.fillStyle = '#c9ced2'; g.fillRect(cx - 50, gy - 30, 36, 10);                                // Gasstutzen
  g.fillStyle = '#c4521c'; g.fillRect(cx - 92, gy - 31, 44, 12);                                // Schlauch
}
export function bunsenDiagram() {
  const [c, g] = sheet(720, 470, 'Bunsenbrenner: Luft offen oder zu'); const gy = 400, top = gy - 190;
  const flame = (cx, col1, col2, h, wdt) => { const gr = g.createLinearGradient(0, top - h, 0, top); gr.addColorStop(0, col1); gr.addColorStop(1, col2); g.fillStyle = gr; g.beginPath(); g.moveTo(cx - 13, top); g.bezierCurveTo(cx - wdt, top - h * 0.45, cx - wdt * 0.5, top - h * 0.85, cx, top - h); g.bezierCurveTo(cx + wdt * 0.5, top - h * 0.85, cx + wdt, top - h * 0.45, cx + 13, top); g.closePath(); g.fill(); };
  // links: Luft offen, blaue Flamme
  let cx = 165; burnerBody(g, cx, true, gy);
  flame(cx, 'rgba(120,170,255,.55)', 'rgba(60,110,255,.9)', 120, 30); flame(cx, 'rgba(210,250,255,.95)', 'rgba(110,200,255,.95)', 56, 11);
  arrow(g, cx - 84, gy - 138, cx - 30, gy - 108, BLUE); arrow(g, cx + 84, gy - 138, cx + 30, gy - 108, BLUE);
  arrow(g, cx - 122, gy - 25, cx - 96, gy - 25, '#c4521c', 4);
  label(g, 'Luft', cx - 140, gy - 150, { col: BLUE, size: 19 }); label(g, 'Gas', cx - 140, gy - 48, { col: '#c4521c', size: 19 });
  tag(g, 'innerer Kegel', cx, top - 22, cx + 70, top - 66); tag(g, 'heißeste Zone', cx + 5, top - 62, cx + 78, top - 112, { col: RED });
  tag(g, 'Brennerrohr', cx + 14, gy - 175, cx + 70, gy - 175); tag(g, 'Luftregulierung', cx + 22, gy - 90, cx + 70, gy - 88);
  label(g, 'Luft offen', cx, 436, { bold: true, size: 21, col: TEAL, align: 'center' }); label(g, 'blaue, heiße Flamme', cx, 458, { italic: true, size: 16, align: 'center' });
  // rechts: Luft zu, gelbe Flamme
  cx = 520; burnerBody(g, cx, false, gy); flame(cx, 'rgba(255,170,40,.5)', 'rgba(255,205,70,.95)', 150, 38);
  g.fillStyle = 'rgba(70,110,255,.8)'; g.beginPath(); g.ellipse(cx, top - 3, 11, 15, 0, 0, Math.PI * 2); g.fill();
  tag(g, 'gelbe, leuchtende\nFlamme', cx + 22, top - 90, cx + 62, top - 118, { col: '#a8650a' }); tag(g, 'Luftloch zu', cx + 22, gy - 90, cx + 70, gy - 88);
  label(g, 'Luft zu', cx, 436, { bold: true, size: 21, col: TEAL, align: 'center' }); label(g, 'kälter, rußt: Sicherheitsflamme', cx, 458, { italic: true, size: 16, align: 'center' });
  return c;
}

// ---------------------------------------------------------------- Destillation (Schnittskizze)
export function distillDiagram() {
  const [c, g] = sheet(760, 470, 'Destillation mit dem Liebig-Kühler'); g.lineJoin = 'round';
  const GL = (fn) => { g.fillStyle = GLASS; g.strokeStyle = TEAL; g.lineWidth = 4; fn(); g.fill(); g.stroke(); };
  // Heizpilz, Siedekolben (Rundkolben) mit Gemisch und Siedesteinen
  g.fillStyle = '#4a5056'; rr(g, 168, 380, 134, 56, 8); g.fill(); g.fillStyle = '#b9ab8c'; g.beginPath(); g.ellipse(235, 380, 62, 14, 0, 0, Math.PI); g.fill();
  g.fillStyle = 'rgba(176,40,60,.8)'; g.beginPath(); g.arc(235, 336, 52, Math.PI * 0.15, Math.PI * 0.85); g.closePath(); g.fill();
  g.fillStyle = '#e2dccb'; for (const [x, y] of [[212, 378], [236, 384], [258, 378], [224, 372], [247, 372]]) { g.beginPath(); g.arc(x, y, 5, 0, 7); g.fill(); }
  GL(() => { g.beginPath(); g.arc(235, 336, 60, -Math.PI * 0.43, Math.PI * 1.43); g.lineTo(247, 240); g.lineTo(247, 205); g.lineTo(223, 205); g.lineTo(223, 240); g.closePath(); });
  // Destillationsaufsatz mit Seitenrohr, Thermometer
  GL(() => { g.beginPath(); g.rect(216, 140, 38, 70); });
  g.save(); g.translate(254, 170); g.rotate(0.31); GL(() => { g.beginPath(); g.rect(0, -8, 62, 16); }); g.restore();
  g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); g.moveTo(235, 70); g.lineTo(235, 176); g.stroke(); g.fillStyle = RED; g.beginPath(); g.arc(235, 179, 8, 0, 7); g.fill();
  g.strokeStyle = INK; g.lineWidth = 1.5; g.strokeRect(230, 60, 10, 120);
  // Liebig-Kühler: Mantel mit Kühlwasser, Innenrohr
  g.save(); g.translate(312, 188); g.rotate(0.31);
  g.fillStyle = 'rgba(80,160,230,.5)'; g.fillRect(0, -22, 290, 44); g.strokeStyle = TEAL; g.lineWidth = 4; g.strokeRect(0, -22, 290, 44);
  g.fillStyle = PAPER; g.fillRect(-60, -8, 380, 16); g.strokeRect(-60, -8, 380, 16);
  g.fillStyle = 'rgba(70,130,200,.8)'; for (let i = 0; i < 6; i++) { g.beginPath(); g.arc(210 + i * 18, 3, 2.6, 0, 7); g.fill(); }
  g.restore();
  // Schlauchanschlüsse: unten rein, oben raus (Gegenstrom)
  g.strokeStyle = TEAL; g.lineWidth = 4; g.beginPath(); g.moveTo(547, 273); g.lineTo(535, 306); g.stroke(); g.beginPath(); g.moveTo(342, 168); g.lineTo(354, 136); g.stroke();
  arrow(g, 510, 372, 533, 312, BLUE, 6); arrow(g, 356, 134, 380, 88, BLUE, 6);
  // Vorstoß und Vorlage (Erlenmeyerkolben)
  g.strokeStyle = TEAL; g.lineWidth = 4; g.beginPath(); g.moveTo(560, 247); g.lineTo(596, 276); g.lineTo(596, 330); g.stroke();
  GL(() => { g.beginPath(); g.moveTo(584, 318); g.lineTo(584, 350); g.lineTo(548, 432); g.lineTo(648, 432); g.lineTo(612, 350); g.lineTo(612, 318); g.closePath(); });
  g.fillStyle = 'rgba(190,225,240,.9)'; g.beginPath(); g.moveTo(561, 406); g.lineTo(635, 406); g.lineTo(648, 432); g.lineTo(548, 432); g.closePath(); g.fill();
  g.fillStyle = 'rgba(90,150,210,.9)'; g.beginPath(); g.arc(596, 344, 4, 0, 7); g.fill();
  // Dampfweg (gestrichelt)
  g.strokeStyle = RED; g.setLineDash([7, 6]); g.lineWidth = 3; g.beginPath(); g.moveTo(235, 300); g.lineTo(235, 172); g.lineTo(280, 177); g.lineTo(420, 215); g.stroke(); g.setLineDash([]);
  // Beschriftung: links Gerät, oben und unten Kühler, rechts Vorlage
  tag(g, 'Thermometer', 231, 90, 20, 72); tag(g, 'Kugel in Höhe\ndes Seitenrohrs', 238, 179, 20, 122, { size: 16 });
  tag(g, 'Destillations-\naufsatz', 217, 160, 20, 178); tag(g, 'Dampf', 232, 242, 20, 232, { col: RED });
  tag(g, 'Siedekolben\nmit Gemisch', 180, 322, 20, 304); tag(g, 'Siedesteine', 214, 380, 20, 372); tag(g, 'Heizpilz', 176, 418, 20, 420);
  tag(g, 'Liebig-Kühler', 440, 254, 420, 318, { align: 'center', size: 19 });
  tag(g, 'Kühlwasser rein (unten)', 514, 372, 530, 425, { col: BLUE, align: 'right', size: 16 }); tag(g, 'Kühlwasser raus (oben)', 382, 90, 400, 76, { col: BLUE, size: 16 });
  tag(g, 'Vorlage', 620, 372, 660, 330); tag(g, 'Destillat', 622, 420, 660, 385);
  return c;
}

// ---------------------------------------------------------------- NaCl-Gitter: 3 x 3 x 3 Ionen, mittleres Ion mit seinen sechs Nachbarn
export function naclDiagram() {
  const [c, g] = sheet(720, 440, 'Kochsalz-Gitter (NaCl), Ausschnitt'); const Na = '#6a78e0', Cl = '#5cc15a';
  const ox = 150, oy = 380, d = 92, px = (i, j, k) => [ox + i * d + k * d * 0.5, oy - j * d - k * d * 0.38];
  const pts = []; for (let k = 0; k < 3; k++) for (let j = 0; j < 3; j++) for (let i = 0; i < 3; i++) pts.push({ i, j, k, na: (i + j + k) % 2 === 0 });
  g.strokeStyle = '#9a8a6a'; g.lineWidth = 2.5;
  for (const p of pts) for (const [di, dj, dk] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) { const i = p.i + di, j = p.j + dj, k = p.k + dk; if (i < 3 && j < 3 && k < 3) { const [x1, y1] = px(p.i, p.j, p.k), [x2, y2] = px(i, j, k); g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); } }
  g.strokeStyle = RED; g.lineWidth = 6; const [mx, my] = px(1, 1, 1); for (const [i, j, k] of [[0, 1, 1], [2, 1, 1], [1, 0, 1], [1, 2, 1], [1, 1, 0], [1, 1, 2]]) { const [x, y] = px(i, j, k); g.beginPath(); g.moveTo(mx, my); g.lineTo(x, y); g.stroke(); }
  for (const p of pts.slice().sort((a, b) => b.k - a.k || a.j - b.j)) { const [x, y] = px(p.i, p.j, p.k), r = p.na ? 14 : 22; const gr = g.createRadialGradient(x - r * 0.35, y - r * 0.4, 2, x, y, r); gr.addColorStop(0, '#fff'); gr.addColorStop(0.25, p.na ? Na : Cl); gr.addColorStop(1, p.na ? '#3b45a0' : '#2f7d2c'); g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  // Legende (Ladungen als kleine hochgestellte Zeichen)
  const lx = 505, ly = 130, ion = (name, sym, ch, y, r, col) => { g.fillStyle = col; g.beginPath(); g.arc(lx, y, r, 0, 7); g.fill(); label(g, name, lx + 34, y - 10, { size: 20 }); g.font = `20px ${SERIF}`; const w = g.measureText(sym).width; label(g, sym, lx + 34, y + 16, { size: 20 }); label(g, ch, lx + 34 + w + 2, y + 9, { size: 14 }); };
  ion('Natrium-Ion', 'Na', '+', ly, 14, Na); ion('Chlorid-Ion', 'Cl', '–', ly + 76, 22, Cl);
  g.strokeStyle = RED; g.lineWidth = 6; g.beginPath(); g.moveTo(lx - 14, ly + 165); g.lineTo(lx + 14, ly + 165); g.stroke(); label(g, 'Jedes Ion im Innern hat', lx + 34, ly + 154, { size: 18 }); label(g, 'sechs Nachbarn.', lx + 34, ly + 178, { size: 18 });
  return c;
}

// ---------------------------------------------------------------- Atommodell Natrium (Schalenmodell)
export function bohrDiagram() {
  const [c, g] = sheet(720, 420, 'Natrium-Atom (vereinfachtes Schalenmodell)'); const cx = 215, cy = 232;
  g.strokeStyle = '#8a7a58'; g.lineWidth = 2.5; for (const r of [52, 98, 144]) { g.beginPath(); g.arc(cx, cy, r, 0, 7); g.stroke(); }
  for (let i = 0; i < 23; i++) { const a = i * 2.39996, r = Math.sqrt((i + 0.5) / 23) * 21; g.fillStyle = i % 2 ? '#c8372d' : '#9aa0a6'; g.beginPath(); g.arc(cx + Math.cos(a) * r, cy + Math.sin(a) * r, 7.5, 0, 7); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1; g.stroke(); }
  const el = (r, n, off) => { for (let i = 0; i < n; i++) { const a = off + (i / n) * 6.283, x = cx + Math.cos(a) * r, y = cy + Math.sin(a) * r; g.fillStyle = '#2f7fd0'; g.beginPath(); g.arc(x, y, 8, 0, 7); g.fill(); g.strokeStyle = '#123a66'; g.lineWidth = 1.5; g.stroke(); } };
  el(52, 2, -0.9); el(98, 8, -0.15); el(144, 1, 0.5);
  const at = (r, a) => [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  tag(g, '1. Schale: 2 Elektronen', ...at(52, -0.9), 420, 170, { size: 17, col: BLUE });
  tag(g, '2. Schale: 8 Elektronen', ...at(98, -0.15), 420, 222, { size: 17, col: BLUE });
  tag(g, '3. Schale: 1 Elektron', ...at(144, 0.5), 420, 290, { size: 17, col: BLUE });
  tag(g, 'Kern: 11 Protonen (rot)\nund 12 Neutronen (grau)', cx + 12, cy + 16, 420, 355, { size: 17 });
  label(g, 'Das einzelne Außenelektron gibt Natrium leicht ab.', 28, 394, { italic: true, size: 16 });
  return c;
}
