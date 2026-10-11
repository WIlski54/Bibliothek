// Möbel des Chemielabors: langer Labortisch mit Gestell, Fensterfront-Arbeitsplatte mit Spüle, Schrank unter dem Periodensystem, Laborhocker.
import * as THREE from 'three';
import { M } from '../../kit.js';
import { mulberry32 } from '../../../lib/util.js';
import { Batch, MAT } from './util.js';

export const LAB = { cx: -0.3, cz: 1.4, L: 5.4, D: 1.0, H: 0.92 };

// Labortisch: dicke Platte mit Messingkante, Beine, Zargen, zwei Schubladenschränke, offene Mitte mit Ablage
export function makeLabTable({ L, D, H } = LAB) {
  const g = new THREE.Group(), b = new Batch(), top = M.wood(0x6a4428, { planks: 3, seed: 4 }), fr = M.wood(0x4a2c1a, { planks: 1 }), dk = M.wood(0x35200f, { planks: 2, seed: 3 }), brass = M.brass();
  const T = { tile: 1 };
  b.box(top, L, 0.05, D, 0, H - 0.025, 0, 0, T);
  for (const sz of [-1, 1]) b.box(brass, L + 0.012, 0.016, 0.008, 0, H - 0.03, sz * (D / 2 + 0.002)); for (const sx of [-1, 1]) b.box(brass, 0.008, 0.016, D, sx * (L / 2 + 0.002), H - 0.03, 0);
  const lx = [-2.5, -0.85, 0.85, 2.5], lz = D / 2 - 0.1, legH = H - 0.05;
  for (const x of lx) for (const sz of [-1, 1]) { b.box(fr, 0.09, legH, 0.09, x, legH / 2, sz * lz, 0, T); b.box(fr, 0.11, 0.03, 0.11, x, 0.015, sz * lz, 0, T); }
  for (const sz of [-1, 1]) { b.box(fr, L - 0.2, 0.1, 0.03, 0, H - 0.1, sz * lz, 0, T); b.box(fr, L - 0.2, 0.05, 0.03, 0, 0.2, sz * lz, 0, T); }
  for (const x of lx) { b.box(fr, 0.03, 0.1, 2 * lz, x, H - 0.1, 0, 0, T); b.box(fr, 0.03, 0.05, 2 * lz, x, 0.2, 0, 0, T); }
  b.box(dk, L - 0.4, 0.03, D - 0.18, 0, 0.24, 0, 0, T);                                     // untere Ablage
  // Schubladenschränke zwischen den Beinpaaren (außen), Fronten nach Norden und Süden
  for (const [x0, x1] of [[-2.5, -0.85], [0.85, 2.5]]) {
    const cw = x1 - x0 - 0.09, cx = (x0 + x1) / 2; b.box(dk, cw, 0.56, D - 0.22, cx, 0.58, 0, 0, T);
    for (const sz of [-1, 1]) for (let r = 0; r < 3; r++) for (let c = 0; c < 2; c++) {
      const w = cw / 2 - 0.012, x = cx + (c ? 1 : -1) * (cw / 4), y = 0.40 + r * 0.175, z = sz * (D / 2 - 0.1 - 0.012);
      b.box(fr, w, 0.155, 0.02, x, y + 0.04, z, 0, T); b.box(MAT.black(), w - 0.07, 0.004, 0.003, x, y + 0.04, z + sz * 0.011);
      b.sph(brass, 0.011, x, y + 0.045, z + sz * 0.02, { w: 8, h: 6 }); b.cyl(brass, 0.004, 0.004, 0.012, x, y + 0.045, z + sz * 0.014, { rx: Math.PI / 2, seg: 6 });
    }
  }
  // Ablage mit Kisten
  const rnd = mulberry32(3);
  for (let i = 0; i < 4; i++) { const x = -0.7 + i * 0.4 + (rnd() - 0.5) * 0.06, w = 0.3 + rnd() * 0.06; b.box(fr, w, 0.14, 0.34, x, 0.32, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.2, T); b.box(MAT.paper(), 0.1, 0.045, 0.002, x, 0.34, -0.176 - 0.002 * 0); }
  g.add(b.build({ name: 'labortisch' })); return g;
}

// Arbeitsplatte an der Südwand (lokal: x entlang der Wand von links nach rechts von innen, z von der Wand in den Raum) mit Spülbecken
export function makeCounter({ len = 11.2, depth = 0.62, h = 0.86, sinkA = 3.9 } = {}) {
  const g = new THREE.Group(), b = new Batch(), dk = M.wood(0x3a2214, { planks: 2, seed: 7 }), fr = M.wood(0x4a2a18, { planks: 1 }), brass = M.brass(), T = { tile: 1 };
  b.box(dk, len, h - 0.04, depth - 0.06, 0, (h - 0.04) / 2 + 0.06, depth / 2 - 0.02, 0, T);
  b.box(MAT.black(), len - 0.1, 0.07, depth - 0.14, 0, 0.035, depth / 2 - 0.1);
  b.box(M.wood(0x4a2c18, { planks: 4, seed: 2 }), len + 0.02, 0.04, depth + 0.02, 0, h - 0.02, depth / 2, 0, T);
  b.box(brass, len + 0.02, 0.012, 0.01, 0, h - 0.045, depth + 0.01);
  const n = Math.floor(len / 0.86), pw = len / n;
  for (let i = 0; i < n; i++) { const x = -len / 2 + pw * (i + 0.5); b.box(fr, pw - 0.05, h - 0.2, 0.022, x, (h - 0.04) / 2 + 0.08, depth - 0.03, 0, T); b.box(dk, pw - 0.14, h - 0.32, 0.004, x, (h - 0.04) / 2 + 0.08, depth - 0.016, 0, T); b.sph(brass, 0.014, x + (i % 2 ? -1 : 1) * (pw / 2 - 0.1), h - 0.2, depth - 0.008, { w: 8, h: 6 }); }
  // Spülbecken (Keramik mit dunkler Mulde) unter dem linken Fenster, Wasserhahn mit Schwanenhals
  const sx = sinkA; b.box(MAT.ceramic(), 0.78, 0.07, 0.46, sx, h + 0.035, depth / 2 + 0.0); b.box(MAT.solid(0x2d3436, 0.6), 0.64, 0.004, 0.34, sx, h + 0.071, depth / 2); b.cyl(MAT.steel(), 0.025, 0.025, 0.004, sx, h + 0.074, depth / 2 + 0.02, { seg: 14 });
  b.cyl(MAT.copper(), 0.016, 0.018, 0.34, sx, h + 0.17, 0.09, { seg: 12 }); b.pipe(MAT.copper(), [[sx, h + 0.34, 0.09], [sx, h + 0.42, 0.09], [sx, h + 0.42, 0.28], [sx, h + 0.34, 0.28]], 0.014, 0.05, 12); b.cyl(MAT.copper(), 0.02, 0.02, 0.03, sx, h + 0.335, 0.28, { seg: 12 });
  for (const dx of [-0.07, 0.07]) { b.cyl(MAT.copper(), 0.01, 0.01, 0.12, sx + dx, h + 0.11, 0.07, { seg: 8 }); b.cyl(MAT.solid(dx < 0 ? 0x2e7bd0 : 0xc4401c, 0.5), 0.022, 0.022, 0.014, sx + dx, h + 0.175, 0.07, { seg: 14 }); }
  g.add(b.build({ name: 'arbeitsplatte' })); return g;
}

// Schrank unter dem Periodensystem (Ostwand), lokal: x entlang der Wand, z in den Raum; Flaschen und Mörser oben
export function makeSideboard({ w = 4.3, depth = 0.5, h = 0.88 } = {}) {
  const g = new THREE.Group(), b = new Batch(), dk = M.wood(0x3a2214, { planks: 2, seed: 7 }), fr = M.wood(0x4a2a18, { planks: 1 }), brass = M.brass(), T = { tile: 1 };
  b.box(dk, w, h - 0.04, depth - 0.04, 0, (h - 0.04) / 2 + 0.05, depth / 2 - 0.02, 0, T); b.box(MAT.black(), w - 0.1, 0.06, depth - 0.1, 0, 0.03, depth / 2 - 0.06);
  b.box(M.wood(0x4a2c18, { planks: 4, seed: 2 }), w + 0.04, 0.04, depth + 0.04, 0, h - 0.02, depth / 2, 0, T); b.box(brass, w + 0.04, 0.012, 0.01, 0, h - 0.045, depth + 0.021);
  const n = 5, pw = w / n;
  for (let i = 0; i < n; i++) { const x = -w / 2 + pw * (i + 0.5); b.box(fr, pw - 0.05, h - 0.16, 0.022, x, (h - 0.04) / 2 + 0.05, depth - 0.02, 0, T); b.box(dk, pw - 0.15, h - 0.28, 0.004, x, (h - 0.04) / 2 + 0.05, depth - 0.008, 0, T); b.cyl(brass, 0.006, 0.006, 0.1, x + (i % 2 ? -1 : 1) * (pw / 2 - 0.09), h - 0.3, depth - 0.004, { seg: 6 }); }
  // Standflaschen (braunes Apothekerglas) mit Korken und Etikett
  const rnd = mulberry32(17), glass = new THREE.MeshStandardMaterial({ color: 0x8c4d16, roughness: 0.18, metalness: 0, emissive: 0x2a1204, emissiveIntensity: 0.55 });
  const lab = MAT.paper(), cork = MAT.cork();
  for (let i = 0; i < 9; i++) {
    const x = -1.9 + i * 0.4 + (rnd() - 0.5) * 0.06, hh = 0.16 + rnd() * 0.12, r = 0.04 + rnd() * 0.015, z = 0.2 + (rnd() - 0.5) * 0.12, y0 = h;
    b.lathe(glass, [[0, 0], [r - 0.004, 0], [r, 0.006], [r, hh * 0.72], [r * 0.7, hh * 0.9], [0.017, hh * 0.98], [0.017, hh + 0.04], [0.021, hh + 0.045]], x, y0, z, { seg: 18 });
    b.cyl(cork, 0.016, 0.014, 0.03, x, y0 + hh + 0.03, z, { seg: 10 }); b.cyl(lab, r + 0.0015, r + 0.0015, hh * 0.38, x, y0 + hh * 0.38, z, { seg: 18 }); b.cyl(MAT.solid(0x2d3a3a, 0.9), r + 0.0018, r + 0.0018, 0.012, x, y0 + hh * 0.5, z, { seg: 18 });
  }
  // Mörser mit Stößel
  b.lathe(MAT.ceramic(), [[0, 0.0], [0.04, 0], [0.06, 0.02], [0.085, 0.07], [0.09, 0.075], [0.08, 0.075], [0.055, 0.04], [0.0, 0.025]], 1.95, h, 0.28, { seg: 22 }); b.tube(MAT.ceramic(), [1.96, h + 0.05, 0.27], [2.06, h + 0.15, 0.2], 0.012, 10, 0.017);
  g.add(b.build({ name: 'schrank' })); return g;
}

// Laborhocker: runde Sitzfläche auf drei Beinen mit Fußring
export function makeStool() {
  const g = new THREE.Group(), b = new Batch(), wood = M.wood(0x5a3a22, { planks: 3, seed: 6 }), fr = M.wood(0x3a2214, { planks: 1 });
  b.cyl(wood, 0.17, 0.17, 0.045, 0, 0.66, 0, { seg: 22 }); b.torus(fr, 0.17, 0.012, 0, 0.66, 0, { rx: Math.PI / 2, ts: 22, rs: 6 });
  for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3 + 0.6; b.tube(fr, [Math.sin(a) * 0.11, 0.64, Math.cos(a) * 0.11], [Math.sin(a) * 0.21, 0, Math.cos(a) * 0.21], 0.016, 8); }
  b.torus(MAT.copper(), 0.16, 0.007, 0, 0.26, 0, { rx: Math.PI / 2, ts: 22, rs: 6 });
  g.add(b.build({ name: 'hocker' })); return g;
}
