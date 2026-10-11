// Gerahmtes Bild des Hausherrn: Archimedes würdevoll im Sessel, ein Buch in den Pfoten, dahinter das Bücherregal.
// Papierschnitt-Schichten mit weichen Schatten (gleiche Technik wie die Popup-Bücher), alles aus Code gemalt.
import * as THREE from 'three';
import ClipperLib from 'clipper-lib';
import { unionPolys, offsetPaths, pathsToShapes, bboxOf, paintCut } from '../../../lib/papercut.js';
import { mulberry32, hashStr } from '../../../lib/util.js';
import { framedPicture } from '../../kit.js';
import { K, stripe } from './paintbits.js';
import { C } from './palette.js';
import { sitParts } from './art-sit.js';
import { PORTRAIT_CARD } from './talk.js';

const W = 720, H = 960, PPM = 800;   // Pixel, Pixel, Pixel je Meter (0.9 x 1.2 m)
const yc = (px) => (H - px) / 8;    // Bildpunkt -> cm von unten

// Ein Papierteil (Lagen-Beschreibung in Modell-Metern) mit Schatten auf die Leinwand legen. k = Maßstab, (x, y) = Versatz in Metern, Ursprung unten Mitte.
function piece(g, part, { k = 1, x = 0, y = 0, shadow = true, border = 0.006, seed = 1 } = {}) {
  const all = part.layers.flatMap((l) => l.shapes);
  let outline = unionPolys(all); if (border > 0) outline = offsetPaths(outline, border, 0.003); outline = ClipperLib.Clipper.CleanPolygons(outline, 6);
  const { outers, holes } = pathsToShapes(outline); const polys = outers.concat(holes), bb = bboxOf(polys);
  const p = paintCut(part, polys, bb, PPM * k, seed);
  const X = (p.ox * k + x + W / 2 / PPM) * PPM, Y = (H / PPM - (p.oy * k + y)) * PPM;
  g.save();
  if (shadow) { g.shadowColor = 'rgba(15,8,10,.5)'; g.shadowBlur = 14; g.shadowOffsetX = 5; g.shadowOffsetY = 8; }
  g.drawImage(p.canvas, X, Y, p.canvas.width, p.canvas.height);
  g.restore();
  return p;
}
const cm = (a) => a * 0.01;
const rect = (x0, y0, x1, y1) => [[cm(x0), cm(y0)], [cm(x1), cm(y0)], [cm(x1), cm(y1)], [cm(x0), cm(y1)]];
const rimOf = (shapes, w = 0.2) => K.rim(shapes, { w, color: 'rgba(40,24,22,.8)', soft: 0.12 });

function wallpaper(g) {
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#2c5a54'); gr.addColorStop(1, '#1f423f'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.save(); g.globalAlpha = 0.13; g.fillStyle = '#9fd6c8';
  for (let j = 0; j < 14; j++) for (let i = 0; i < 9; i++) { // Damast-Muster: kleine Rauten und Blüten
    const cx = i * 90 + (j % 2 ? 45 : 0), cy = j * 78;
    g.beginPath(); g.moveTo(cx, cy - 22); g.quadraticCurveTo(cx + 12, cy, cx, cy + 22); g.quadraticCurveTo(cx - 12, cy, cx, cy - 22); g.fill();
    g.beginPath(); g.arc(cx, cy, 5, 0, 6.3); g.fill();
  }
  g.restore();
  const v = g.createRadialGradient(W / 2, H * 0.45, H * 0.2, W / 2, H * 0.5, H * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(10,8,10,.5)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
}

// Bücherregal oben: zwei Reihen mit Buchrücken, Bretter als Papierteile
function shelf(g, seed) {
  const r = mulberry32(seed), pal = ['#7b1f26', '#2c4a6e', '#2f6a4a', '#8a5a2b', '#4a2c5a', '#1f3f3a', '#9a7b30', '#5a2a20', '#a8552f', '#20303a', '#c9a24a', '#7a6a4a'];
  piece(g, { layers: [{ shapes: [rect(-45, yc(384), 45, yc(30))], fill: '#3a2417', stroke: null, deco: K.deco((c, bb) => K.shade(c, bb, { dark: 'rgba(0,0,0,.45)', light: 'rgba(255,220,160,.08)' })) }] }, { shadow: false, border: 0 });
  for (const [top, bot] of [[64, 212], [228, 372]]) {
    let x = 4;
    while (x < W - 12) {
      const w = 14 + r() * 20, h = (bot - top) * (0.6 + r() * 0.38), lean = r() < 0.06 ? (r() - 0.5) * 0.3 : 0;
      if (r() < 0.05) { x += 10 + r() * 14; continue; }
      const col = pal[Math.floor(r() * pal.length)];
      g.save(); g.translate(x + w / 2, bot); g.rotate(lean);
      g.fillStyle = col; g.fillRect(-w / 2, -h, w, h); g.fillStyle = 'rgba(255,255,255,.13)'; g.fillRect(-w / 2, -h, 3, h); g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(w / 2 - 4, -h, 4, h);
      g.fillStyle = '#d9b45a'; for (const f of [0.16, 0.5, 0.84]) if (r() < 0.8) g.fillRect(-w / 2, -h * f - 1.5, w, 3);
      g.restore(); x += w + 1 + (lean ? 8 : 0);
    }
  }
  // Bretter vorn und Kranzleiste
  for (const [a, b] of [[212, 224], [372, 386], [30, 54]]) piece(g, { layers: [{ shapes: [rect(-45, yc(b), 45, yc(a))], fill: '#5a3320', stroke: null, deco: K.deco((c, bb) => K.shade(c, bb, { dark: 'rgba(0,0,0,.35)', light: 'rgba(255,220,170,.22)' })) }] }, { border: 0.002 });
}

function chair(g) {
  const back = K.poly([[-30, 10], [-33, 62], [-27, 92], [0, 100], [27, 92], [33, 62], [30, 10]], 2);
  piece(g, { layers: [{ shapes: [back], fill: { top: '#9a2a3c', bottom: '#651726' }, stroke: null, deco: K.deco((c, bb) => {
    K.shade(c, bb, { dark: 'rgba(30,5,10,.4)', light: 'rgba(255,200,200,.15)' });
    const { ctx } = c; ctx.save(); ctx.strokeStyle = 'rgba(40,6,14,.5)'; ctx.lineWidth = Math.max(1, 0.4 * 0.01 * c.S);
    for (let k = -9; k < 10; k++) { const [x1, y1] = c.tf((k * 6 - 36) * 0.01, 30 * 0.01), [x2, y2] = c.tf((k * 6 + 36) * 0.01, 102 * 0.01); ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke(); const [a1, b1] = c.tf((k * 6 + 36) * 0.01, 30 * 0.01), [a2, b2] = c.tf((k * 6 - 36) * 0.01, 102 * 0.01); ctx.beginPath(); ctx.moveTo(a1, b1); ctx.lineTo(a2, b2); ctx.stroke(); }
    ctx.restore();
    for (let j = 0; j < 7; j++) for (let i = -3; i <= 3; i++) { const x = i * 11 + (j % 2 ? 5.5 : 0), y = 30 + j * 11; if (Math.abs(x) < 29 && y < 92) { K.paintBlob(c, x, y, 1.5, 1.5, 0, '#6a4a10', 1); K.paintBlob(c, x, y + 0.1, 1.2, 1.2, 0, '#e8b844', 1); K.paintBlob(c, x - 0.3, y + 0.5, 0.4, 0.3, 0, '#fff4c0', 1); } }
  }, rimOf([back], 0.25)) }] }, { seed: 3, border: 0.008 });
}
function armrests(g) {
  for (const s of [-1, 1]) {
    const arm = K.S(K.poly([[s * 31, 8], [s * 32, 31], [s * 36, 37], [s * 42, 37], [s * 46, 31], [s * 45, 8]], 2), K.blob(s * 38.5, 36, 7.5, 4.6, 0, 28));
    piece(g, { layers: [{ shapes: arm, fill: { top: '#b03446', bottom: '#6a1828' }, stroke: null, deco: K.deco((c, bb) => { K.shade(c, bb, { dark: 'rgba(30,5,10,.4)', light: 'rgba(255,210,210,.2)' }); K.curve(c, [[s * 32.5, 34], [s * 38.5, 41.5], [s * 45, 34]], 'rgba(255,220,220,.35)', 0.8); }, rimOf(arm, 0.22)) }] }, { seed: 5 + s, border: 0.007 });
  }
}
function floor(g) {
  piece(g, { layers: [{ shapes: [rect(-45, 0, 45, 9)], fill: '#5a2a24', stroke: null, deco: K.deco((c, bb) => {
    K.shade(c, bb, { dark: 'rgba(0,0,0,.4)', light: 'rgba(255,200,150,.18)' });
    for (let i = -9; i <= 9; i++) K.paintPoly(c, [[i * 5, 4.5], [i * 5 + 2, 7.5], [i * 5 + 4, 4.5], [i * 5 + 2, 1.5]], '#d8a840', 0.55, 0);
    K.curve(c, [[-45, 8], [45, 8]], '#d8a840', 0.6);
  }) }] }, { border: 0.003 });
}

function book(g) {
  const w = 21, h = 27, cx = 0, cy = 36.5;
  const b = K.poly([[cx - w / 2, cy - h / 2], [cx + w / 2, cy - h / 2], [cx + w / 2, cy + h / 2], [cx - w / 2, cy + h / 2]], 0);
  piece(g, { layers: [{ shapes: [b], fill: { top: '#7a2a20', bottom: '#4e1810' }, stroke: null, deco: K.deco((c, bb) => {
    K.shade(c, bb, { dark: 'rgba(20,5,5,.35)', light: 'rgba(255,200,170,.2)' });
    const { ctx, S, tf } = c; const lw = Math.max(1, 0.5 * 0.01 * S);
    ctx.save(); ctx.strokeStyle = '#e0b448'; ctx.lineWidth = lw; for (const [m, a] of [[1.6, 1], [2.8, 0.6]]) { const [x0, y0] = tf((cx - w / 2 + m) * 0.01, (cy + h / 2 - m) * 0.01), [x1, y1] = tf((cx + w / 2 - m) * 0.01, (cy - h / 2 + m) * 0.01); ctx.globalAlpha = a; ctx.strokeRect(x0, y0, x1 - x0, y1 - y0); }
    ctx.restore();
    K.paintPoly(c, [[cx - w / 2, cy - h / 2], [cx - w / 2 + 2.4, cy - h / 2], [cx - w / 2 + 2.4, cy + h / 2], [cx - w / 2, cy + h / 2]], 'rgba(30,6,6,.5)', 1, 0);
    K.paintPoly(c, [[cx - w / 2 + 2.4, cy - h / 2 + 0.9], [cx + w / 2 - 0.6, cy - h / 2 + 0.9], [cx + w / 2 - 0.6, cy - h / 2], [cx - w / 2 + 2.4, cy - h / 2]], '#f1e6c8', 1, 0);
    ctx.save(); ctx.fillStyle = '#f0cf6a'; ctx.textAlign = 'center'; ctx.font = `bold ${Math.round(0.0215 * S)}px Georgia, serif`; const [tx, ty] = tf((cx + 1) * 0.01, (cy + 8) * 0.01); ctx.fillText('HEUREKA!', tx, ty);
    ctx.restore();
    const bx = cx + 1, by = cy - 4.6;   // kleine Glühbirne
    for (let i = 0; i < 7; i++) { const a = Math.PI * (0.12 + (i / 6) * 0.76); K.curve(c, [[bx + Math.cos(a) * 5.2, by + 1.4 + Math.sin(a) * 5.2], [bx + Math.cos(a) * 7.0, by + 1.4 + Math.sin(a) * 7.0]], '#f6c43a', 0.5); }
    K.paintBlob(c, bx, by + 1.4, 3.1, 3.1, 0, '#ffd34a', 1); K.paintBlob(c, bx - 0.8, by + 2.2, 1.0, 0.8, 0, '#fffbc8', 1); K.paintPoly(c, [[bx - 1.6, by - 1.2], [bx + 1.6, by - 1.2], [bx + 1.3, by - 3.0], [bx - 1.3, by - 3.0]], '#c0b8a8', 1, 0);
  }, rimOf([b], 0.22)) }] }, { seed: 11, border: 0.005 });
}
function paws(g) {
  for (const s of [-1, 1]) {
    const x = s * 7.2, y = 24.4;
    const paw = K.S(K.blob(x, y, 5.2, 3.3, s * 0.1, 24), K.blob(x - s * 0.4, y + 2.4, 3.6, 3.0, 0, 16));
    piece(g, { layers: [{ shapes: paw, fill: { top: C.low, bottom: C.white }, stroke: null, deco: K.deco((c, bb) => { K.shade(c, bb, { dark: 'rgba(52,40,60,.2)' }); for (const dx of [-1.8, 0, 1.8]) stripe(c, x + dx, y + 0.4, -Math.PI / 2, 2.2, 0.34, 'rgba(70,60,80,.7)', 0.6, 0); }, rimOf(paw, 0.2)) }] }, { seed: 21 + s, border: 0.005 });
  }
}

function build() {
  const c = document.createElement('canvas'); c.width = W; c.height = H; const g = c.getContext('2d');
  wallpaper(g); shelf(g, 77); chair(g);
  // Katze (Sitzpose) im Maßstab k, Füße auf der Sitzfläche
  const k = 1.34, parts = sitParts(), by = 0.215;
  for (const name of ['tail', 'body', 'legL', 'legR', 'earL', 'earR', 'head']) { const p = parts.find((q) => q.name === name); piece(g, p.variants[0], { k, x: 0, y: by, seed: (hashStr(name) % 97) + 1, border: 0.0065 * k }); }
  armrests(g); book(g); paws(g); floor(g);
  const gl = g.createRadialGradient(W / 2, H * 0.42, 40, W / 2, H * 0.5, H * 0.7); gl.addColorStop(0, 'rgba(255,230,170,.14)'); gl.addColorStop(1, 'rgba(0,0,0,.28)'); g.fillStyle = gl; g.fillRect(0, 0, W, H);
  return c;
}

export function portrait() {
  const canvas = build();
  const tex = new THREE.CanvasTexture(canvas); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const f = framedPicture(tex, { w: 0.9, h: 1.2, name: 'Archimedes', sub: 'Hausherr der Bibliothek' });
  f.userData.tap = { ...PORTRAIT_CARD, image: canvas, alt: 'Gemälde: Archimedes, der Hausherr, im Sessel mit einem Buch', label: 'Archimedes, Hausherr' };
  f.name = 'archimedes-portrait'; return f;
}
export function portraitCanvas() { return build(); }
