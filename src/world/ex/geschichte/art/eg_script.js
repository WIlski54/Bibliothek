// Gruppe O3 – Schreibzeug: papyrusrolle (Parts body = Rolle mit Band und Siegel, blatt = herabhängendes Blatt, Pivot oben),
// schreibpalette (body, pinsel), ostrakon (beschriftete Scherbe). Schrift ist Zierde (Hieratisch-Andeutung, einzelne echte Bildzeichen).
import {
  P, blob, limb, poly, mk, L, rect, rrect, ring, lump, polyline, speckle, hatch, grain, gloss, fillPoly, strokePoly, curve, strokes, line, dot, rngOf, norm, volume, TAU,
} from './_eg_daily_kit.js';
import { drawGlyph } from './eg_glyphs.js';

// Zeilen aus winzigen Zeichen (Tusche); Bildzeichen im Linienstil, nie ein lesbares Wort
const INKROW = ['sonne', 'auge', 'haus', 'wellen', 'geier', 'schlange', 'korb', 'fuss', 'eule', 'loewe'];
function inkRow(c, x0, x1, y, s, rng, color, paper) {
  let x = x0 + s * 0.5, last = '';
  while (x < x1 - s * 0.3) {
    let k; do { k = INKROW[Math.floor(rng() * INKROW.length)]; } while (k === last);
    last = k;
    drawGlyph(c, k, x, y, s, { style: 'line', ink: color, paper, lw: 1.5 });
    x += s * (k === 'wellen' ? 1.0 : 0.88) + s * 0.18;
    if (rng() < 0.15) x += s * 0.4;
  }
}

// ------------------------------------------------------------------------------------------------
// Papyrusrolle 0,4 m
export function papyrusrolle(opts = {}) {
  const o = norm(opts);
  const seed = o.seed ?? 2;
  const SHEET = '#f1e1ae';
  const bw = 0.3, top = 0.325; // Blattbreite, Oberkante des Blattes (verdeckt von der Rolle)
  const sheet = poly([[-bw / 2, top], [bw / 2, top], [bw / 2 + 0.004, 0.2], [bw / 2 - 0.006, 0.1], [bw / 2 + 0.003, 0.03], [bw / 2 - 0.02, 0.012], [0.05, 0.026], [-0.05, 0.008], [-bw / 2 + 0.02, 0.026], [-bw / 2 - 0.004, 0.06], [-bw / 2 + 0.004, 0.16], [-bw / 2 - 0.003, 0.26]], 1);
  const roll = rrect(-0.175, 0.31, 0.175, 0.41, 0.05, 3);
  const capL = blob(-0.175, 0.36, 0.035, 0.05, 0, 20), capR = blob(0.175, 0.36, 0.035, 0.05, 0, 20);
  const parts = {
    blatt: {
      z: 0, pivot: [0, top],
      layers: [{
        shapes: [sheet], fill: { top: SHEET, bottom: '#e6d08e' },
        deco(c, bb) {
          // Papyrus-Fasern: feines Gitter
          for (let y = 0.02; y < top; y += 0.011) line(c, [[bb.x0, y], [bb.x1, y + 0.002]], 'rgba(150,115,50,.22)', 0.0025);
          for (let x = bb.x0 + 0.006; x < bb.x1; x += 0.02) line(c, [[x, 0.0], [x + 0.001, top]], 'rgba(150,115,50,.14)', 0.0025);
          speckle(c, bb, ['#c8a85a', '#fff3c8'], 40, 0.002, 0.006, seed, 0.4);
          const rng = rngOf(seed, 6);
          // rote Überschrift, danach schwarze Zeilen
          inkRow(c, -0.12, 0.12, 0.275, 0.036, rng, P.rot, SHEET);
          for (let r = 0; r < 4; r++) inkRow(c, -0.125, 0.125, 0.215 - r * 0.052, 0.034, rng, '#1c1816', SHEET);
          line(c, [[-0.13, 0.248], [0.13, 0.248]], 'rgba(120,80,30,.4)', 0.003);
          // kleiner Tintenfleck
          fillPoly(c, blob(0.1, 0.04, 0.008, 0.006, 0.4, 8), 'rgba(28,24,22,.65)');
          volume(c, bb, { dark: 'rgba(110,70,20,.18)', light: 'rgba(255,255,230,.12)' });
        },
      }],
    },
    body: {
      z: 1,
      layers: [
        { shapes: [capL, capR], fill: '#d9bd78', deco(c, bb) { line(c, [[bb.x0, 0.36], [bb.x1, 0.36]], 'rgba(100,70,30,.3)', 0.003); } },
        {
          shapes: [roll], fill: { top: '#f4e6b8', bottom: '#d3b66e' },
          deco(c, bb) {
            for (let y = 0.32; y < 0.41; y += 0.012) line(c, [[bb.x0, y], [bb.x1, y]], 'rgba(150,115,50,.25)', 0.003);
            volume(c, bb, { dark: 'rgba(110,70,20,.3)', light: 'rgba(255,255,235,.3)' });
          },
        },
        // Spiral-Enden der Rolle
        {
          shapes: [blob(-0.175, 0.36, 0.034, 0.048, 0, 20)], fill: '#e9d39a',
          deco(c, bb) { for (const k of [0.78, 0.5, 0.24]) strokePoly(c, blob(-0.175, 0.36, 0.034 * k, 0.048 * k, 0, 20), 'rgba(110,75,30,.7)', 0.003, 1); },
        },
        {
          shapes: [blob(0.175, 0.36, 0.034, 0.048, 0, 20)], fill: '#e9d39a',
          deco(c, bb) { for (const k of [0.78, 0.5, 0.24]) strokePoly(c, blob(0.175, 0.36, 0.034 * k, 0.048 * k, 0, 20), 'rgba(110,75,30,.7)', 0.003, 1); },
        },
        // Leinenband mit Knoten und Tonsiegel
        {
          shapes: [rrect(-0.02, 0.305, 0.01, 0.415, 0.006)], fill: '#f6efe0',
          deco(c, bb) { for (let y = 0.31; y < 0.415; y += 0.012) line(c, [[bb.x0, y], [bb.x1, y + 0.006]], 'rgba(150,130,100,.5)', 0.003); },
        },
        { shapes: [limb([[0.0, 0.31, 0.012], [0.03, 0.29, 0.011], [0.045, 0.26, 0.01]], { per: 5 })], fill: '#f6efe0' },
        { shapes: [blob(0.045, 0.245, 0.024, 0.022, 0, 16)], fill: '#a86a3e', deco(c, bb) { gloss(c, 0.038, 0.252, 0.01, 0.006, 0.4, 0.4); strokePoly(c, blob(0.045, 0.245, 0.014, 0.012, 0, 12), 'rgba(60,30,10,.5)', 0.003, 1); } },
      ],
    },
  };
  return mk('papyrusrolle', 'Papyrusrolle', parts, { siegel: [0.045, 0.245], blatt: [0, 0.18], top: [0, 0.41] }, {
    heightM: 0.4, ranges: { blatt: [0, 0.2] }, material: 'Papyrus',
  }, {});
}

// ------------------------------------------------------------------------------------------------
// Schreibpalette 0,35 m: Holzbrett in Schrägsicht, zwei Tuschnäpfe (schwarz, rot), Rinne mit Binsen, Schnur; Part `pinsel`
function reedBrush(x0, y0, x1, y1, tip = '#2a1a10') {
  const dx = x1 - x0, dy = y1 - y0, m = Math.hypot(dx, dy), ux = dx / m, uy = dy / m;
  const shaft = limb([[x0, y0, 0.011], [x0 + dx * 0.5, y0 + dy * 0.5, 0.012], [x1 - ux * 0.02, y1 - uy * 0.02, 0.012]], { per: 5 });
  const brush = poly([[x1 - ux * 0.025 - uy * 0.007, y1 - uy * 0.025 + ux * 0.007], [x1 + ux * 0.02, y1 + uy * 0.02], [x1 - ux * 0.025 + uy * 0.007, y1 - uy * 0.025 - ux * 0.007]], 1);
  return { shaft, brush, tip };
}
export function schreibpalette(opts = {}) {
  const o = norm(opts);
  const W = 0.35, d = 0.12, sk = 0.03;
  const edge = rect(-W / 2, 0, W / 2, 0.03);
  const topf = poly([[-W / 2, 0.03], [W / 2, 0.03], [W / 2 + sk, 0.03 + d], [-W / 2 + sk, 0.03 + d]], 0);
  const slot = poly([[-0.04, 0.062], [0.16, 0.062], [0.17, 0.092], [-0.03, 0.092]], 0);
  const wellK = [-0.115, 0.082], wellR = [-0.055, 0.082];
  const r1 = reedBrush(-0.02, 0.07, 0.19, 0.08), r2 = reedBrush(-0.01, 0.083, 0.2, 0.09);
  const brushTip = (c, R, col) => { };
  const parts = {
    body: {
      z: 0,
      layers: [
        { shapes: [edge], fill: { top: P.holz, bottom: P.holzD }, deco(c, bb) { grain(c, bb, 'rgba(50,28,10,.45)', 10, { len: 0.1, w: 0.003, seed: 3 }); } },
        {
          shapes: [topf], fill: { top: '#d6a468', bottom: '#c08a4e' },
          deco(c, bb) {
            grain(c, bb, 'rgba(110,70,30,.45)', 30, { len: 0.12, w: 0.003, seed: 5 });
            line(c, [[-W / 2 + 0.005, 0.03 + 0.003], [W / 2 - 0.005, 0.033]], 'rgba(255,235,190,.5)', 0.004);
            volume(c, bb, { dark: 'rgba(60,35,10,.22)', light: 'rgba(255,240,200,.18)' });
          },
        },
        { shapes: [slot], fill: '#5e3d1f', deco(c, bb) { line(c, [[-0.03, 0.09], [0.17, 0.09]], 'rgba(0,0,0,.35)', 0.004); } },
        // Tuschnäpfe: Holzrand + Tuschekuchen
        { shapes: [blob(wellK[0], wellK[1], 0.03, 0.021, 0, 22), blob(wellR[0], wellR[1], 0.03, 0.021, 0, 22)], fill: '#8a5f33', deco(c, bb) { } },
        {
          shapes: [blob(wellK[0], wellK[1] + 0.002, 0.022, 0.014, 0, 22)], fill: '#1c1816',
          deco(c, bb) { gloss(c, wellK[0] - 0.007, wellK[1] + 0.008, 0.009, 0.0035, 0.1, 0.5); },
        },
        {
          shapes: [blob(wellR[0], wellR[1] + 0.002, 0.022, 0.014, 0, 22)], fill: '#b8281f',
          deco(c, bb) { gloss(c, wellR[0] - 0.007, wellR[1] + 0.008, 0.009, 0.0035, 0.1, 0.5); },
        },
        // zwei Binsen in der Rinne
        { shapes: [r2.shaft], fill: '#d8c27a', deco(c, bb) { line(c, [[0.0, 0.092], [0.19, 0.093]], 'rgba(255,245,200,.6)', 0.003); } },
        { shapes: [r1.shaft], fill: '#c9b066', deco(c, bb) { line(c, [[0.0, 0.074], [0.18, 0.082]], 'rgba(255,245,200,.5)', 0.003); } },
        { shapes: [r2.brush], fill: '#1c1816' },
        // Tragschnur mit Quaste am linken Ende
        { shapes: [limb([[-W / 2 + 0.01, 0.075, 0.008], [-W / 2 - 0.03, 0.05, 0.008], [-W / 2 - 0.045, 0.02, 0.008]], { per: 6 })], fill: '#f6efe0' },
        { shapes: [poly([[-W / 2 - 0.058, 0.02], [-W / 2 - 0.032, 0.02], [-W / 2 - 0.03, -0.0], [-W / 2 - 0.05, -0.002]], 1)], fill: '#c0432e' },
      ],
    },
    pinsel: {
      z: 1, pivot: [-0.03, 0.12],
      layers: [
        { shapes: [reedBrush(-0.03, 0.12, 0.14, 0.15).shaft], fill: '#d8c27a', deco(c, bb) { line(c, [[-0.02, 0.123], [0.12, 0.147]], 'rgba(255,245,200,.6)', 0.003); } },
        { shapes: [reedBrush(-0.03, 0.12, 0.14, 0.15).brush], fill: '#b8281f' },
      ],
    },
  };
  return mk('schreibpalette', 'Schreibpalette', parts, { tinte_schwarz: [wellK[0], wellK[1]], tinte_rot: [wellR[0], wellR[1]], pinselspitze: [0.14, 0.15] }, {
    lengthM: 0.35, ranges: { pinsel: [0, 0.35] }, material: 'Holz',
  }, {});
}

// ------------------------------------------------------------------------------------------------
// Ostrakon 0,3 m: beschriftete Kalksteinscherbe mit Zeilen und einer Küken-Kritzelei
export function ostrakon(opts = {}) {
  const o = norm(opts);
  const seed = o.seed ?? 4;
  const sh = lump(0, 0.115, 0.145, 0.105, seed, 11, 0.12, 1);
  const SH = '#efe2c2';
  return mk('ostrakon', 'Ostrakon (beschriftete Scherbe)', {
    body: {
      layers: [{
        shapes: [sh], fill: { top: '#f4e9cc', bottom: '#dccaa0' },
        deco(c, bb) {
          const rng = rngOf(seed, 7);
          speckle(c, bb, ['#c8b78e', '#fff8e0', '#d4c298'], 90, 0.002, 0.007, seed, 0.5);
          inkRow(c, -0.12, 0.12, 0.185, 0.03, rng, P.rot, SH);
          for (let r = 0; r < 2; r++) inkRow(c, -0.12 + r * 0.01, 0.1, 0.145 - r * 0.036, 0.028, rng, '#1c1816', SH);
          drawGlyph(c, 'kueken', 0.0, 0.055, 0.075, { style: 'line', ink: '#1c1816', paper: SH, lw: 1.4 });
          line(c, [[-0.06, 0.02], [0.07, 0.02]], 'rgba(28,24,22,.5)', 0.003);
          // Kante: Bruchlinien
          strokePoly(c, sh, 'rgba(120,95,55,.5)', 0.006, 1);
          volume(c, bb, { dark: 'rgba(100,70,30,.25)', light: 'rgba(255,255,240,.18)' });
        },
      }],
    },
  }, { schrift: [0, 0.15] }, { lengthM: 0.3, material: 'Kalkstein-Scherbe' }, {});
}
