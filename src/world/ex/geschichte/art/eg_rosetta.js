// Gruppe O3 – Rosetta-Stein (um 196 v. Chr., Granodiorit, 1,12 m hoch).
// Parts (einzeln ein-/ausblendbar): body (dunkler Stein mit Bruchkanten), band_hiero (Hieroglyphen, oben), band_demot (Demotisch, Mitte),
// band_greek (Griechisch, unten). Die Schrift ist Zierde (keine Texte). Ausnahme: die Kartusche im Hieroglyphenband zeigt den Namen
// PTOLEMAIOS aus den echten Zeichen p-t-w-l-m-i-i-s (Matte, Brot, Küken, Löwe, Eule, Schilfblatt×2, Tuch).
// opts: lesen 'rtl' (Standard, wie auf dem Stein: Zeichen blicken nach rechts, gelesen wird von rechts nach links) | 'ltr' (gespiegelt, von links nach rechts lesbar)
//       seed (Zierzeichen anders gewürfelt)
import { P, blob, poly, mk, L, rect, rrect, speckle, grain, fillPoly, strokePoly, curve, line, dot, rngOf, norm, volume } from './_eg_daily_kit.js';
import { drawGlyph, drawCartouche } from './eg_glyphs.js';

const STONE = poly([
  [0.03, 0.0], [0.73, 0.0], [0.76, 0.1], [0.71, 0.17], [0.74, 0.3], [0.75, 0.55], [0.76, 0.72], [0.74, 0.84], [0.68, 0.9], [0.62, 0.97], [0.52, 0.99],
  [0.46, 1.04], [0.36, 1.06], [0.3, 1.1], [0.16, 1.12], [0.06, 1.09], [0.01, 1.0], [0.03, 0.8], [0.0, 0.5], [0.02, 0.25]], 1);
const HIERO = poly([[0.06, 0.7], [0.7, 0.7], [0.7, 0.8], [0.66, 0.86], [0.62, 0.92], [0.56, 0.96], [0.5, 0.98], [0.44, 1.01], [0.36, 1.03], [0.3, 1.06], [0.16, 1.07], [0.07, 1.04], [0.05, 0.9]], 1);
const DEMOT = rrect(0.06, 0.45, 0.70, 0.675, 0.012);
const GREEK = rrect(0.06, 0.07, 0.70, 0.425, 0.012);

const SAND = '#e6d4a0', PANEL = '#42464f';

function inside(pg, x, y) {
  let ins = false;
  for (let i = 0, j = pg.length - 1; i < pg.length; j = i++) {
    const [xi, yi] = pg[i], [xj, yj] = pg[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) ins = !ins;
  }
  return ins;
}

// Zeile aus Zierzeichen (nur Bildzeichen; Reihenfolge gewürfelt, nie ein Wort)
const ROW_SET = ['sonne', 'auge', 'haus', 'wellen', 'geier', 'schlange', 'korb', 'strick', 'fuss', 'eule', 'mund', 'loewe'];
function signRow(c, pg, y, s, x0, x1, rng, flip) {
  let x = x0 + s * 0.5, last = '';
  while (x < x1 - s * 0.4) {
    let k; do { k = ROW_SET[Math.floor(rng() * ROW_SET.length)]; } while (k === last);
    last = k;
    const w = s * (k === 'wellen' || k === 'wasser' ? 0.95 : 0.8);
    const ok = [[-w / 2, -s / 2], [w / 2, -s / 2], [-w / 2, s / 2], [w / 2, s / 2]].every(([dx, dy]) => inside(pg, x + dx, y + dy));
    if (ok) drawGlyph(c, k, x, y, s * 0.92, { flip, ink: SAND, style: 'line', paper: PANEL, lw: 0.9 });
    x += w + s * 0.28;
    if (rng() < 0.18) x += s * 0.35; // Lücke
  }
}

// Demotisch: fließende, verbundene Schreibschrift-Striche (nur Zierde)
function demoticRows(c, bb, rows, rng) {
  const y0 = bb.y1 - 0.025, dy = (bb.h - 0.04) / rows;
  for (let r = 0; r < rows; r++) {
    const y = y0 - r * dy;
    let x = bb.x1 - 0.03; // von rechts nach links
    const xEnd = bb.x0 + 0.03 + (r === rows - 1 ? 0.25 : 0);
    while (x > xEnd) {
      const wl = 0.03 + rng() * 0.09, pts = [];
      const n = 3 + Math.floor(rng() * 3);
      for (let i = 0; i <= n; i++) pts.push([x - (wl * i) / n, y + (rng() - 0.5) * 0.026 + (i % 2 ? 0.01 : -0.006)]);
      curve(c, pts, '#cfe2d6', 0.0042, { alpha: 0.9 });
      if (rng() < 0.7) curve(c, [[x - wl * 0.3, y + 0.012], [x - wl * 0.45, y - 0.012], [x - wl * 0.7, y + 0.004]], '#cfe2d6', 0.0036, { alpha: 0.8 });
      x -= wl + 0.014 + rng() * 0.012;
    }
  }
}

// Griechisch: aufrechte Pseudobuchstaben aus einfachen Strichen (Zierde, ohne Wörter)
function greekRows(c, bb, rows, rng) {
  const dy = (bb.h - 0.03) / rows, h = Math.min(0.017, dy * 0.52), w = h * 0.7;
  for (let r = 0; r < rows; r++) {
    const y = bb.y1 - 0.02 - dy * (r + 0.5);
    let x = bb.x0 + 0.03;
    const xEnd = bb.x1 - 0.03 - (r === rows - 1 ? 0.3 : (rng() < 0.3 ? rng() * 0.05 : 0));
    while (x < xEnd) {
      const k = Math.floor(rng() * 9);
      const X = x, Y = y;
      const P2 = (pts) => line(c, pts.map(([a, b]) => [X + a * w, Y + b * h]), '#d4def0', 0.0034, { alpha: 0.92 });
      if (k === 0) P2([[0.5, -0.5], [0.5, 0.5]]);
      else if (k === 1) P2([[0, 0.5], [0.5, -0.5], [1, 0.5]]);
      else if (k === 2) P2([[0, -0.5], [0, 0.5]]), P2([[0, -0.5], [1, -0.5]]);
      else if (k === 3) P2([[0, 0.5], [0, -0.5], [1, -0.5], [1, 0.5]]);
      else if (k === 4) { P2([[0, -0.5], [1, -0.5]]); P2([[0.5, -0.5], [0.5, 0.5]]); }
      else if (k === 5) P2([[0, 0], [0.2, 0.5], [0.8, 0.5], [1, 0], [0.8, -0.5], [0.2, -0.5], [0, 0]]);
      else if (k === 6) P2([[1, -0.5], [0, -0.5], [1, 0.5], [0, 0.5]]);
      else if (k === 7) { P2([[0, 0.5], [0.5, -0.5], [1, 0.5]]); P2([[0.2, 0.1], [0.8, 0.1]]); }
      else P2([[0, 0.5], [0, -0.5], [0.7, -0.5], [0.7, 0], [0, 0]]);
      x += w * 1.45;
      if (rng() < 0.2) x += w * 1.2;
    }
  }
}

export function rosetta_stein(opts = {}) {
  const o = norm(opts);
  const ltr = o.lesen === 'ltr';
  const seed = o.seed ?? 3;
  const shift = (pg, dx, dy) => pg.map(([x, y]) => [x + dx, y + dy]);
  // Name PTOLEMAIOS: Lesefolge p t w l m i i s; Bildfolge (Zeichen blicken nach rechts) = rückwärts
  const NAME = ['matte', 'brot', 'kueken', 'loewe', 'eule', 'schilfblatt', 'schilfblatt', 'stoff'];
  const order = ltr ? NAME : NAME.slice().reverse();

  const bandLayer = (pg, accent, deco) => [L([pg], { stops: [[0, '#4b4f59'], [1, '#3b3e46']], dir: 'v' }, (c, bb) => {
    speckle(c, bb, ['#5a5e68', '#2e3036', '#6e6a6a'], 40, 0.002, 0.005, 11, 0.5);
    deco(c, bb);
    strokePoly(c, pg, accent, 0.008, 0.9);
    volume(c, bb, { dark: 'rgba(0,0,0,.25)', light: 'rgba(255,255,255,.07)' });
  })];

  const parts = {
    body: {
      z: 0,
      layers: [
        L([shift(STONE, 0.035, 0.02)], '#26282d', null, { stroke: 'rgba(0,0,0,.4)' }),
        L([STONE], { stops: [[0, '#4a4d56'], [0.55, '#383b43'], [1, '#2f3137']], dir: 'v' }, (c, bb) => {
          speckle(c, bb, ['#6c6f78', '#2b2d33', '#8a6a66', '#a39a98', '#55586a'], 260, 0.003, 0.011, 5, 0.55);
          speckle(c, bb, ['#b9a8a0'], 40, 0.002, 0.005, 9, 0.4);
          grain(c, bb, '#1f2024', 24, { len: 0.12, w: 0.004, alpha: 0.35, seed: 8, ang: 0.3 });
          // frische Bruchkanten oben rechts und unten rechts: heller
          line(c, [[0.76, 0.72], [0.74, 0.84], [0.68, 0.9], [0.62, 0.97], [0.52, 0.99], [0.46, 1.04], [0.36, 1.06], [0.3, 1.1]], '#8d8f96', 0.016, { alpha: 0.7 });
          line(c, [[0.73, 0.0], [0.76, 0.1], [0.71, 0.17], [0.74, 0.3]], '#8d8f96', 0.014, { alpha: 0.6 });
          line(c, [[0.04, 1.0], [0.02, 0.8], [0.0, 0.5]], '#7a7d84', 0.01, { alpha: 0.4 });
          // glatter, polierter Rand der Vorderseite
          strokePoly(c, STONE, '#5b5e67', 0.03, 0.8);
          volume(c, bb, { dark: 'rgba(0,0,0,.3)', light: 'rgba(255,255,255,.12)' });
        }),
      ],
    },
    band_hiero: {
      z: 1,
      layers: bandLayer(HIERO, P.gold, (c, bb) => {
        const rng = rngOf(seed, 41), flip = ltr;
        const rows = [[0.985, 0.058], [0.755, 0.052]];
        // Trennlinien
        line(c, [[0.08, 0.92], [0.66, 0.92]], '#5d616b', 0.003, { alpha: 0.8 });
        line(c, [[0.08, 0.81], [0.69, 0.81]], '#5d616b', 0.003, { alpha: 0.8 });
        for (const [y, s] of rows) signRow(c, HIERO, y, s, 0.08, 0.7, rng, flip);
        // Kartusche mit PTOLEMAIOS
        drawCartouche(c, order, 0.335, 0.865, 0.54, 0.118, { flip, ink: '#2b1a10', bg: '#e9dcb4', style: 'color', ring: '#2b1a10' });
      }),
    },
    band_demot: {
      z: 2,
      layers: bandLayer(DEMOT, P.tuerkis, (c, bb) => {
        const rng = rngOf(seed, 42);
        for (let r = 1; r < 8; r++) line(c, [[0.07, 0.675 - (r * 0.225) / 8], [0.69, 0.675 - (r * 0.225) / 8]], '#52565f', 0.002, { alpha: 0.7 });
        demoticRows(c, bb, 8, rng);
      }),
    },
    band_greek: {
      z: 3,
      layers: bandLayer(GREEK, P.lapis, (c, bb) => {
        const rng = rngOf(seed, 43);
        greekRows(c, bb, 13, rng);
      }),
    },
  };
  return mk('rosetta_stein', 'Rosetta-Stein', parts, {
    cartouche: [0.335, 0.865], hiero: [0.33, 0.88], demot: [0.38, 0.56], greek: [0.38, 0.25], top: [0.2, 1.1],
  }, {
    heightM: 1.12, widthM: 0.76, year: -196, material: 'Granodiorit',
    toggles: ['band_hiero', 'band_demot', 'band_greek'],
  }, {});
}
export default rosetta_stein;
