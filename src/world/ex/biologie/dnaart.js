// Biologie: 2D-Zeichnungen zur Doppelhelix: Legende (Schild am Pult) und Basenpaar-Diagramm (Bild auf der Karte).
import * as THREE from 'three';
import { M, mat, box, mesh } from '../../kit.js';
import { TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF, woodMid } from './style.js';
import { DNA, hexPts, pentPts, CXH, ATTACH } from './dna.js';

const css = (n) => '#' + n.toString(16).padStart(6, '0');
// eine Base als Plättchen in (u, v) Modellmetern -> Pixel: u nach rechts, v nach oben (Sugar-Seite unten)
function drawBase(g, b, ox, oy, k, mirror = false) {
  const purine = b === 'A' || b === 'G', col = css(DNA.COLORS[b]), X = (u) => ox + (mirror ? -u : u) * k, Y = (v) => oy - v * k;
  const poly = (pts, fill) => { g.beginPath(); pts.forEach(([u, v], i) => (i ? g.lineTo(X(u), Y(v)) : g.moveTo(X(u), Y(v)))); g.closePath(); g.fillStyle = fill; g.fill(); g.lineWidth = 2.4; g.strokeStyle = 'rgba(30,20,10,.65)'; g.lineJoin = 'round'; g.stroke(); };
  if (purine) poly(pentPts(), col); poly(hexPts(), col);
  return { cx: X(CXH), cy: Y(0.088) };
}
const SUGAR = (g, x, y, r) => { g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * TAU) / 5; g.lineTo(x + Math.cos(a) * r, y + Math.sin(a) * r); } g.closePath(); g.fillStyle = '#f2ede0'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(30,20,10,.7)'; g.stroke(); g.beginPath(); for (let i = 0; i < 5; i++) { const a = -Math.PI / 2 + (i * TAU) / 5; g.lineTo(x + Math.cos(a) * r * 0.5, y + Math.sin(a) * r * 0.5); } g.closePath(); g.fillStyle = '#d9cfa8'; g.fill(); };

// Karte: zwei Basenpaare von oben gesehen (A-T und G-C), mit Wasserstoffbrücken
export function pairDiagram() {
  return memo('dna-pairs', () => {
    const [c, g] = canvas(960, 430);
    g.fillStyle = '#f7f0dc'; g.fillRect(0, 0, 960, 430); g.strokeStyle = 'rgba(120,90,40,.4)'; g.lineWidth = 3; g.strokeRect(6, 6, 948, 418);
    const k = 1150, y0 = 284, half = 0.1287;
    const pair = (left, right, ox, hb, title) => {
      const lx = ox - half * k, rx = ox + half * k;
      const a = drawBase(g, left, lx, y0, k, false), b = drawBase(g, right, rx, y0, k, true);
      // Zucker und Phosphat unter den beiden Sehnenenden, Stäbchen zur Base
      for (const [x, dir, base] of [[lx, 1, left], [rx, -1, right]]) {
        const pur = base === 'A' || base === 'G', att = pur ? ATTACH.pur() : ATTACH.pyr(), ax = x + dir * att[0] * k, ay = y0 - att[1] * k, sx = x - dir * 4, sy = y0 + 74;
        g.strokeStyle = '#b8b2a0'; g.lineWidth = 6; g.lineCap = 'round'; g.beginPath(); g.moveTo(ax, ay); g.lineTo(sx, sy - 10); g.stroke();
        SUGAR(g, sx, sy, 24); g.beginPath(); g.arc(sx - dir * 52, sy + 14, 12, 0, TAU); g.fillStyle = '#f08a22'; g.fill(); g.lineWidth = 2; g.strokeStyle = 'rgba(30,20,10,.7)'; g.stroke();
        g.strokeStyle = '#b8b2a0'; g.lineWidth = 5; g.beginPath(); g.moveTo(sx - dir * 24, sy + 6); g.lineTo(sx - dir * 42, sy + 12); g.stroke();
      }
      // Wasserstoffbrücken
      const ys = hb === 2 ? [y0 - 0.075 * k, y0 - 0.1 * k] : [y0 - 0.066 * k, y0 - 0.088 * k, y0 - 0.11 * k];
      g.strokeStyle = '#2a2a2a'; g.lineWidth = 4; g.setLineDash([6, 5]); for (const yy of ys) { g.beginPath(); g.moveTo(ox - 0.02 * k, yy); g.lineTo(ox + 0.02 * k, yy); g.stroke(); } g.setLineDash([]);
      g.fillStyle = '#fff'; g.font = `bold 40px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 5; g.strokeStyle = 'rgba(30,20,10,.55)'; for (const [ch, p] of [[left, a], [right, b]]) { g.strokeText(ch, p.cx, p.cy); g.fillText(ch, p.cx, p.cy); }
      g.fillStyle = '#2a1c10'; g.font = `bold 26px ${SERIF}`; g.fillText(title, ox, 44); g.font = `italic 21px ${SERIF}`; g.fillStyle = '#5a4630'; g.fillText(hb === 2 ? 'zwei Wasserstoffbrücken' : 'drei Wasserstoffbrücken', ox, 76);
    };
    pair('A', 'T', 258, 2, 'Adenin – Thymin'); pair('G', 'C', 704, 3, 'Guanin – Cytosin');
    g.fillStyle = '#5a4630'; g.font = `italic 18px ${SERIF}`; g.textAlign = 'center'; g.fillText('Blick von oben auf ein Basenpaar · unten: Zucker (weißes Fünfeck) und Phosphat (orange)', 480, 408);
    return c;
  });
}

// Legende: Schild für das Pult (Hochformat, schräg gelesen)
export function legendCanvas() {
  return memo('dna-legend', () => {
    const [c, g] = canvas(768, 540); g.scale(0.75, 0.75);
    const grd = g.createLinearGradient(0, 0, 0, 720); grd.addColorStop(0, '#f8f1dc'); grd.addColorStop(1, '#efe4c4'); g.fillStyle = grd; g.fillRect(0, 0, 1024, 720);
    g.strokeStyle = '#2c5a3e'; g.lineWidth = 12; g.strokeRect(12, 12, 1000, 696); g.lineWidth = 3; g.strokeRect(30, 30, 964, 660);
    g.fillStyle = '#2c5a3e'; g.fillRect(30, 30, 964, 78); g.fillStyle = '#f6e7b0'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold 44px ${SERIF}`; g.fillText('Legende zur Doppelhelix', 512, 70);
    const row = (b, y) => { g.save(); g.translate(86, y); const k = 520; drawBase(g, b, -0.045 * 0, 0 + 0, 0.0001, false); g.restore(); };
    // vier Basen
    const names = [['A', 'Adenin', 'Purin (Doppelring)'], ['T', 'Thymin', 'Pyrimidin (Einzelring)'], ['G', 'Guanin', 'Purin (Doppelring)'], ['C', 'Cytosin', 'Pyrimidin (Einzelring)']];
    names.forEach(([b, n, kind], i) => { const y = 190 + i * 98; drawBase(g, b, 112, y + 48, 640, false); g.fillStyle = '#2a1c10'; g.textAlign = 'left'; g.font = `bold 40px ${SERIF}`; g.fillText(`${b}  ${n}`, 214, y + 6); g.font = `italic 25px ${SERIF}`; g.fillStyle = '#5a4630'; g.fillText(kind, 214, y + 42); });
    // Paarung
    g.fillStyle = '#2a1c10'; g.font = `bold 34px ${SERIF}`; g.textAlign = 'left'; g.fillText('Es passen nur:', 520, 172);
    g.font = `bold 40px ${SERIF}`; g.fillStyle = css(DNA.COLORS.A); g.fillText('A', 520, 232); g.fillStyle = '#2a1c10'; g.fillText('–', 556, 232); g.fillStyle = css(DNA.COLORS.T); g.fillText('T', 584, 232); g.font = `26px ${SERIF}`; g.fillStyle = '#2a1c10'; g.fillText('2 Wasserstoffbrücken', 640, 232);
    g.font = `bold 40px ${SERIF}`; g.fillStyle = css(DNA.COLORS.G); g.fillText('G', 520, 296); g.fillStyle = '#2a1c10'; g.fillText('–', 556, 296); g.fillStyle = css(DNA.COLORS.C); g.fillText('C', 584, 296); g.font = `26px ${SERIF}`; g.fillStyle = '#2a1c10'; g.fillText('3 Wasserstoffbrücken', 640, 296);
    // Rückgrat
    g.beginPath(); g.arc(540, 392, 20, 0, TAU); g.fillStyle = '#f08a22'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2a1c10'; g.stroke(); g.fillStyle = '#2a1c10'; g.font = `28px ${SERIF}`; g.fillText('Phosphat', 576, 398);
    SUGAR(g, 540, 452, 24); g.fillStyle = '#2a1c10'; g.fillText('Zucker (Desoxyribose)', 576, 458);
    g.strokeStyle = '#3a3a3a'; g.lineWidth = 6; g.setLineDash([8, 7]); g.beginPath(); g.moveTo(516, 512); g.lineTo(564, 512); g.stroke(); g.setLineDash([]); g.fillStyle = '#2a1c10'; g.fillText('Wasserstoffbrücke', 576, 518);
    g.fillStyle = '#f08a22'; g.beginPath(); g.moveTo(514, 566); g.lineTo(556, 566); g.lineTo(556, 552); g.lineTo(584, 574); g.lineTo(556, 596); g.lineTo(556, 582); g.lineTo(514, 582); g.closePath(); g.fillStyle = '#b04a2a'; g.fill(); g.fillStyle = '#2a1c10'; g.fillText('Richtung 5′ → 3′', 598, 580);
    g.font = `italic 26px ${SERIF}`; g.fillStyle = '#5a4630'; g.textAlign = 'center'; g.fillText('Die beiden Stränge laufen gegenläufig (antiparallel).', 512, 640); g.fillText('Etwa 10 Basenpaare pro Windung · rechtsgängig (B-DNA)', 512, 676);
    return c;
  });
}
// Pult mit schräger Platte und Legende
export function buildLectern() {
  const g = new THREE.Group(), wood = woodMid(), brass = M.brass();
  const w = 0.82, d = 0.55;
  const post = mesh(new THREE.CylinderGeometry(0.06, 0.09, 0.88, 14), wood, { tile: 1 }); post.position.y = 0.44; g.add(post);
  const foot = mesh(new THREE.CylinderGeometry(0.3, 0.33, 0.06, 24), wood, { tile: 1 }); foot.position.y = 0.03; g.add(foot);
  const slab = new THREE.Group(); slab.position.y = 0.96; slab.rotation.x = 0.52; g.add(slab);
  const board = box(w, 0.04, d, wood, { tile: 1 }); slab.add(board);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.1, (w - 0.1) * 720 / 1024), new THREE.MeshStandardMaterial({ map: texOf(legendCanvas()), roughness: 0.6 })); sign.rotation.x = -Math.PI / 2; sign.position.y = 0.023; slab.add(sign);
  for (const [x, z, ww, dd] of [[0, d / 2 - 0.012, w, 0.024], [0, -d / 2 + 0.012, w, 0.024]]) { const b = box(ww, 0.018, dd, brass); b.position.set(x, 0.03, z); slab.add(b); }
  for (const s of [-1, 1]) { const b = box(0.024, 0.018, d, brass); b.position.set(s * (w / 2 - 0.012), 0.03, 0); slab.add(b); }
  const lip = box(w, 0.04, 0.03, wood, { tile: 1 }); lip.position.set(0, 0.0, d / 2 + 0.0); slab.add(lip);
  g.userData.size = { w, d, h: 1.15 }; return g;
}
// Staffelei für das Franklin-Porträt
export function buildEasel() {
  const g = new THREE.Group(), wood = woodMid(), brass = M.brass();
  for (const [x, rz, h] of [[-0.42, 0.17, 2.1], [0.42, -0.17, 2.1]]) { const l = box(0.045, h, 0.04, wood, { tile: 1 }); l.position.set(x, h / 2, -0.04); l.rotation.z = rz; l.rotation.x = 0.06; g.add(l); }
  const back = box(0.045, 1.9, 0.04, wood, { tile: 1 }); back.position.set(0, 0.95, -0.42); back.rotation.x = -0.4; g.add(back);
  const rail = box(1.0, 0.05, 0.04, wood, { tile: 1 }); rail.position.set(0, 1.18, -0.01); g.add(rail);
  const top = box(0.64, 0.05, 0.04, wood, { tile: 1 }); top.position.set(0, 2.05, -0.03); g.add(top);
  for (const s of [-1, 1]) { const k = mesh(new THREE.SphereGeometry(0.02, 8, 6), brass); k.position.set(s * 0.5, 1.18, 0.02); g.add(k); }
  return g;
}
