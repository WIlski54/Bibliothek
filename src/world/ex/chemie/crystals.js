// Salz- und Kristallmodelle: NaCl-Kugel-Stab-Gitter (4 x 4 x 4 Ionen, dreht sich langsam), Kupfersulfat-Kristalle unter der Glasglocke,
// Natron-Haufen in der Holzkiste, Schaukasten-Tisch mit Beschriftung.
import * as THREE from 'three';
import { ConvexGeometry } from 'three/examples/jsm/geometries/ConvexGeometry.js';
import { M } from '../../kit.js';
import { mulberry32 } from '../../../lib/util.js';
import { Batch, MAT, signMesh, canvas, texOf } from './util.js';

export const NA_COL = 0x6a78e0, CL_COL = 0x5cc15a;

// ---------------------------------------------------------------- NaCl-Gitter
export function makeNaCl({ n = 4, s = 0.1, rNa = 0.022, rCl = 0.036 } = {}) {
  const grp = new THREE.Group(), spin = new THREE.Group(); spin.userData.dynamic = true; grp.add(spin);
  const b = new Batch(), na = MAT.solid(NA_COL, 0.28, 0.1), cl = MAT.solid(CL_COL, 0.3, 0.05), stick = MAT.solid(0xc2bdb0, 0.45, 0.35), off = (n - 1) / 2;
  const P = (i, j, k) => [(i - off) * s, (j - off) * s, (k - off) * s];
  for (let k = 0; k < n; k++) for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
    const isNa = (i + j + k) % 2 === 0; b.sph(isNa ? na : cl, isNa ? rNa : rCl, ...P(i, j, k), { w: 18, h: 12 });
    for (const [di, dj, dk] of [[1, 0, 0], [0, 1, 0], [0, 0, 1]]) if (i + di < n && j + dj < n && k + dk < n) b.tube(stick, P(i, j, k), P(i + di, j + dj, k + dk), 0.0045, 6);
  }
  spin.add(b.build({ name: 'nacl-gitter' }));
  const sb = new Batch(); sb.tube(M.brass(), [0, -off * s - 0.1, 0], [0, off * s + 0.03, 0], 0.005, 8); spin.add(sb.build({ name: 'nacl-stab' }));
  const half = off * s + rCl;
  return { group: grp, spin, extent: half, update: (t) => { spin.rotation.y = t * 0.2; } };
}

// ---------------------------------------------------------------- Kupfersulfat-Kristalle (schief, blau)
export function crystalGeo(rnd, a, b2, c) {
  const pts = []; const sx = (rnd() - 0.5) * 0.7, sz = (rnd() - 0.5) * 0.5;
  for (const x of [-1, 1]) for (const y of [-1, 1]) for (const z of [-1, 1]) {
    const cut = rnd() < 0.55, t = 0.38 + rnd() * 0.18;
    const add = (xx, yy, zz) => pts.push(new THREE.Vector3((xx + sx * yy) * a, yy * b2, (zz + sz * yy) * c));
    if (cut) { add(x * (1 - t), y, z); add(x, y * (1 - t), z); add(x, y, z * (1 - t)); } else add(x, y, z);
  }
  return new ConvexGeometry(pts);
}
export function makeCuSO4() {
  const grp = new THREE.Group(), b = new Batch(), rnd = mulberry32(5), blue = new THREE.MeshStandardMaterial({ color: 0x2f6bd8, roughness: 0.16, metalness: 0.05, emissive: 0x0c2c78, emissiveIntensity: 0.35, flatShading: true });
  b.cyl(M.wood(0x3a2214, { planks: 1 }), 0.14, 0.15, 0.025, 0, 0.0125, 0, { seg: 28 }); b.torus(M.brass(), 0.14, 0.006, 0, 0.026, 0, { rx: Math.PI / 2, ts: 32, rs: 6 });
  // flache Glasschale
  b.lathe(MAT.glass(), [[0, 0.03], [0.07, 0.032], [0.1, 0.048], [0.104, 0.056]], 0, 0, 0, { seg: 28 });
  const spots = [[0, 0.0, 0.06, 0.035, 0.04, 0.2], [0.055, 0.03, 0.03, 0.02, 0.025, -0.5], [-0.05, 0.035, 0.032, 0.022, 0.024, 0.9], [0.02, -0.055, 0.028, 0.02, 0.02, 0.2], [-0.045, -0.04, 0.022, 0.016, 0.018, -1.1], [0.07, -0.025, 0.02, 0.014, 0.016, 2.0]];
  for (const [x, z, a, h, c, ry] of spots) b.add(crystalGeo(rnd, a, h, c), blue, { p: [x, 0.04 + h * 0.65, z], r: [(rnd() - 0.5) * 0.5, ry, (rnd() - 0.5) * 0.4] });
  // Glasglocke
  const R = 0.13, H = 0.2, dome = [[R + 0.004, 0.026], [R, 0.03], [R, 0.07]]; for (let i = 1; i <= 14; i++) { const a = (i / 14) * (Math.PI / 2); dome.push([R * Math.cos(a), 0.07 + (H - 0.07) * Math.sin(a)]); }
  b.lathe(MAT.glass(), dome, 0, 0, 0, { seg: 32 }); b.sph(MAT.glass(), 0.016, 0, H + 0.016, 0, { w: 12, h: 8 });
  grp.add(b.build({ name: 'kupfersulfat' })); return grp;
}

// ---------------------------------------------------------------- Natron-Haufen in Holzkiste
export function makeNatron() {
  const grp = new THREE.Group(), b = new Batch(), wood = M.wood(0x5a3a22, { planks: 3, seed: 2 }), W = 0.42, D = 0.28, Hh = 0.11;
  b.box(wood, W, 0.02, D, 0, 0.01, 0, 0, { tile: 1 });
  for (const [w, d, x, z] of [[W, 0.02, 0, D / 2 - 0.01], [W, 0.02, 0, -D / 2 + 0.01], [0.02, D - 0.04, W / 2 - 0.01, 0], [0.02, D - 0.04, -W / 2 + 0.01, 0]]) b.box(wood, w, Hh, d, x, Hh / 2 + 0.02, z, 0, { tile: 1 });
  for (const sx of [-1, 1]) b.box(M.wood(0x3a2214, { planks: 1 }), 0.025, Hh + 0.03, D + 0.01, sx * (W / 2 - 0.0), (Hh + 0.03) / 2 + 0.02, 0, 0, { tile: 1 });
  // Haufen: Ikosaeder, nach oben gestaucht, Oberfläche leicht gestört
  const geo = new THREE.IcosahedronGeometry(0.19, 4), p = geo.attributes.position, rnd = mulberry32(9);
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i); const nz = Math.sin(x * 38 + 1.3) * Math.cos(z * 33) * 0.5 + Math.sin(x * 71 + z * 59) * 0.25 + (rnd() - 0.5) * 0.3; const k = 1 + nz * 0.07; p.setXYZ(i, x * k * 1.05, Math.max(0, y * k) * 0.62, z * k * 0.72); }
  geo.computeVertexNormals();
  const pile = MAT.solid(0xe9e6da, 0.98), chunk = MAT.solid(0xd7d9d2, 0.9);
  b.add(geo, pile, { p: [0, 0.03, 0] });
  for (let i = 0; i < 16; i++) { const a = rnd() * 6.28, r = Math.sqrt(rnd()) * 0.15; b.add(new THREE.IcosahedronGeometry(0.01 + rnd() * 0.012, 0), chunk, { p: [Math.cos(a) * r * 1.1, 0.04 + Math.max(0, 0.11 * (1 - (r / 0.17) ** 2)), Math.sin(a) * r * 0.7], r: [rnd() * 3, rnd() * 3, rnd() * 3] }); }
  // Schaufel
  b.add(new THREE.SphereGeometry(0.035, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2), M.brass(), { p: [0.2, 0.12, 0.13], r: [0.5, 0.3, 0.2], s: [1, 0.6, 1.2] }); b.tube(M.brass(), [0.2, 0.125, 0.13], [0.3, 0.2, 0.2], 0.006, 6);
  grp.add(b.build({ name: 'natron' })); return { group: grp, w: W, d: D };
}

// ---------------------------------------------------------------- Schaukasten-Tisch
export function makeDisplayTable({ w = 2.3, d = 0.95, h = 0.95 } = {}) {
  const g = new THREE.Group(), b = new Batch(), wood = M.wood(0x4a2a18, { planks: 2, seed: 6 }), dark = M.wood(0x3a2214, { planks: 1 }), brass = M.brass();
  b.box(wood, w, 0.05, d, 0, h - 0.025, 0, 0, { tile: 1 }); b.box(MAT.solid(0x1b4a4c, 1), w - 0.1, 0.004, d - 0.1, 0, h + 0.002, 0);
  b.box(brass, w + 0.01, 0.014, 0.01, 0, h - 0.02, d / 2); b.box(brass, w + 0.01, 0.014, 0.01, 0, h - 0.02, -d / 2);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) b.box(dark, 0.08, h - 0.05, 0.08, sx * (w / 2 - 0.1), (h - 0.05) / 2, sz * (d / 2 - 0.1), 0, { tile: 1 });
  b.box(dark, w - 0.2, 0.1, 0.03, 0, h - 0.1, d / 2 - 0.1, 0, { tile: 1 }); b.box(dark, w - 0.2, 0.1, 0.03, 0, h - 0.1, -d / 2 + 0.1, 0, { tile: 1 });
  for (const sx of [-1, 1]) b.box(dark, 0.03, 0.1, d - 0.2, sx * (w / 2 - 0.1), h - 0.1, 0, 0, { tile: 1 });
  b.box(dark, w - 0.2, 0.03, d - 0.2, 0, 0.2, 0, 0, { tile: 1 });
  g.add(b.build({ name: 'schautisch' })); return { group: g, top: h + 0.004, w, d };
}
// Beschriftungsschild auf kleinem Keil (Formeln mit tiefgestellten Ziffern über Unicode)
export function labelStand(text, w = 0.3, h = 0.06) {
  const g = new THREE.Group(), wedge = new THREE.Mesh(new THREE.BoxGeometry(w, 0.03, 0.05), M.wood(0x3a2214, { planks: 1 })); wedge.position.set(0, 0.015, 0); g.add(wedge);
  const sg = signMesh(text, w - 0.01, h, { bg: '#2d1c0e', fg: '#f6dc8a', font: 'bold 54px Georgia, serif', px: 640, border: '#d9a441' }); sg.rotation.x = -0.75; sg.position.set(0, 0.048, 0.006); g.add(sg); return g;
}
