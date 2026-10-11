// Modell der Cheops-Pyramide, aufgeschnitten: vorn der Papierschnitt-Querschnitt (Gänge und Kammern, wie im Ägypten-Buch),
// dahinter die halbe Pyramide als echter Körper aus Kalkstein-Quadern auf einer Scholle aus Fels und Sand. Dazu die Tischvitrine.
import * as THREE from 'three';
import { M, box, mesh } from '../../kit.js';
import { paperCut } from './figs.js';
import { cv, tex, brassPlateTex, W } from './decor.js';
import { mulberry32 } from '../../../lib/util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
let stoneMat = null, sandMat = null, rockMat = null;
function limestone() {
  if (stoneMat) return stoneMat;
  const [c, g] = cv(512, 512), r = mulberry32(11), rows = 13, rh = 512 / rows;
  g.fillStyle = '#d9c28a'; g.fillRect(0, 0, 512, 512);
  for (let j = 0; j < rows; j++) {
    let x = -((j * 97) % 61); const y = j * rh;
    while (x < 512) {
      const w = 62 + r() * 56, t = 0.92 + r() * 0.16; const l = Math.round(226 * t), m = Math.round(204 * t), b = Math.round(150 * t);
      g.fillStyle = `rgb(${l},${m},${b})`; g.fillRect(x + 1, y + 1, w - 2, rh - 2);
      g.fillStyle = 'rgba(255,248,222,.35)'; g.fillRect(x + 1, y + 1, w - 2, 3);
      g.fillStyle = 'rgba(90,60,25,.22)'; g.fillRect(x + 1, y + rh - 5, w - 2, 4);
      for (let k = 0; k < 14; k++) { g.fillStyle = r() < 0.5 ? 'rgba(255,245,215,.25)' : 'rgba(120,85,40,.2)'; g.fillRect(x + r() * w, y + r() * rh, 2 + r() * 4, 2); }
      g.fillStyle = 'rgba(90,60,25,.5)'; g.fillRect(x, y, 2, rh);
      x += w;
    }
    g.fillStyle = 'rgba(90,60,25,.55)'; g.fillRect(0, y, 512, 2);
  }
  const t = tex(c, { repeat: [1, 1] }); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  stoneMat = new THREE.MeshStandardMaterial({ map: t, roughness: 0.92, side: THREE.DoubleSide });
  return stoneMat;
}
// Dreiecksfläche mit planarer UV (Quader in Metern: tile m je Textur)
function tri(a, b, c, uvAxis, tile) {
  const g = new THREE.BufferGeometry(); const p = new Float32Array([...a, ...b, ...c]);
  g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const uv = []; for (const v of [a, b, c]) uv.push(v[uvAxis] / tile, v[1] / tile);
  g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(uv), 2)); g.computeVertexNormals(); return g;
}

// Liefert Group: Front (Schnitt) zeigt nach +z, Unterkante y=0, Mitte x=0, Tiefe nach -z. height = Gesamthöhe des Schnitts (m)
export function pyramidModel({ height = 0.66 } = {}) {
  const g = new THREE.Group();
  const pc = paperCut('pyramide_schnitt', { height, thickness: 0.02, border: 0.006, ppu: 1500, maxTex: 1024, name: 'gesch:pyr' });
  const ws = pc.ws, s = 2.9 * ws, G = 0.9 * ws, Hh = 3.6 * ws, bx = 3.75 * ws, zf = -0.02;
  pc.mesh.userData.keep = true; g.add(pc.mesh);
  const A = [0, G + Hh, zf], B1 = [-s, G, zf], B2 = [s, G, zf], B3 = [-s, G, zf - s], B4 = [s, G, zf - s];
  const st = limestone();
  const left = new THREE.Mesh(tri(A, B3, B1, 2, 0.5), st), right = new THREE.Mesh(tri(A, B2, B4, 2, 0.5), st), back = new THREE.Mesh(tri(A, B4, B3, 0, 0.5), st);
  g.add(left, right, back);
  // Scholle: Fels (Seiten, Rückseite) und Sand (oben)
  const Db = s + 0.07, top = G + 0.012;
  rockMat = rockMat || new THREE.MeshStandardMaterial({ color: 0xa88b64, roughness: 1 });
  sandMat = sandMat || new THREE.MeshStandardMaterial({ color: 0xe9d097, roughness: 1 });
  const slab = new THREE.Mesh(new THREE.BoxGeometry(2 * bx, top, Db), rockMat); slab.position.set(0, top / 2, zf - Db / 2); g.add(slab);
  const sand = new THREE.Mesh(new THREE.PlaneGeometry(2 * bx - 0.01, Db - 0.005), sandMat); sand.rotation.x = -Math.PI / 2; sand.position.set(0, top + 0.001, zf - Db / 2); g.add(sand);
  g.userData.size = { w: 2 * bx, h: G + Hh, d: Db }; g.userData.ws = ws;
  return g;
}

// Tischvitrine (Glashaube auf Tisch). w = Länge (x), d = Tiefe (z), Vorderseite +z. inner = Standfläche
export function tableCase({ w = 1.5, d = 1.0, baseH = 0.82, glassH = 0.95 } = {}) {
  const g = new THREE.Group(); const wd = W(0x4a2416, { planks: 3, seed: 4 }), br = M.brass();
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = mesh(new THREE.CylinderGeometry(0.05, 0.065, baseH - 0.1, 12), wd, { tile: 1 }); l.position.set(sx * (w / 2 - 0.1), (baseH - 0.1) / 2, sz * (d / 2 - 0.1)); g.add(l); const f = mesh(new THREE.CylinderGeometry(0.075, 0.075, 0.05, 12), wd, { tile: 1 }); f.position.set(sx * (w / 2 - 0.1), 0.025, sz * (d / 2 - 0.1)); g.add(f); const cp = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), br); cp.position.set(sx * (w / 2 - 0.1), baseH - 0.115, sz * (d / 2 - 0.1)); g.add(cp); }
  const apronF = box(w - 0.1, 0.2, 0.05, wd, { tile: 1 }); apronF.position.set(0, baseH - 0.2, d / 2 - 0.1); g.add(apronF);
  const apronB = box(w - 0.1, 0.2, 0.05, wd, { tile: 1 }); apronB.position.set(0, baseH - 0.2, -d / 2 + 0.1); g.add(apronB);
  for (const sx of [-1, 1]) { const a = box(0.05, 0.2, d - 0.1, wd, { tile: 1 }); a.position.set(sx * (w / 2 - 0.1), baseH - 0.2, 0); g.add(a); }
  const slabT = box(w, 0.06, d, wd, { tile: 1 }); slabT.position.y = baseH - 0.03; g.add(slabT);
  const rim = box(w + 0.04, 0.02, d + 0.04, br); rim.position.y = baseH + 0.0; g.add(rim);
  const cloth = box(w - 0.1, 0.03, d - 0.1, M.fabric(0x1f3a46), { tile: 0 }); cloth.position.y = baseH + 0.015; g.add(cloth);
  const y0 = baseH + 0.03;
  const gl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.1, glassH, d - 0.1), M.glass()); gl.position.y = y0 + glassH / 2; gl.renderOrder = 3; g.add(gl);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = box(0.03, glassH, 0.03, br); p.position.set(sx * (w / 2 - 0.05), y0 + glassH / 2, sz * (d / 2 - 0.05)); g.add(p); }
  for (const [x, z, ww, dd] of [[0, d / 2 - 0.05, w - 0.06, 0.03], [0, -d / 2 + 0.05, w - 0.06, 0.03], [-w / 2 + 0.05, 0, 0.03, d - 0.06], [w / 2 - 0.05, 0, 0.03, d - 0.06]]) { const b = box(ww, 0.03, dd, br); b.position.set(x, y0 + glassH, z); g.add(b); const b2 = box(ww, 0.02, dd, br); b2.position.set(x, y0 + 0.01, z); g.add(b2); }
  const inner = new THREE.Group(); inner.position.y = y0; g.add(inner); g.userData.inner = inner; g.userData.top = y0;
  g.userData.size = { w, d, h: y0 + glassH + 0.03 };
  return g;
}

// Legende (Messingschild mit farbigen Punkten) für die Vorderseite der Tischvitrine
export function legendPlate(w = 0.95, h = 0.17) {
  const W = 1024, H = Math.round(W * h / w), [c, g] = cv(W, H);
  const t = brassPlateTex('', { w: W, h: H }); // nur Hintergrund und Rand
  g.drawImage(t.image, 0, 0);
  const items = [['Königskammer', '#d8583c'], ['Königinnenkammer', '#4a7cc4'], ['Große Galerie', '#f2c25a'], ['Gänge', '#6e4e38'], ['Schächte', '#58cfc4'], ['Kammer unter der Erde', '#8470a0']];
  g.textBaseline = 'middle'; g.textAlign = 'left'; g.font = `bold ${Math.round(H * 0.2)}px ${SERIF}`;
  const cols = [[0, 1, 2], [3, 4, 5]]; const x0 = [W * 0.06, W * 0.55];
  cols.forEach((col, ci) => col.forEach((k, ri) => { const y = H * (0.25 + ri * 0.25), [name, color] = items[k]; g.fillStyle = color; g.strokeStyle = '#3a2208'; g.lineWidth = 2; g.beginPath(); g.arc(x0[ci] + 14, y, 13, 0, Math.PI * 2); g.fill(); g.stroke(); g.fillStyle = '#3a2208'; g.fillText(name, x0[ci] + 40, y + 1); }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex(c), metalness: 0.5, roughness: 0.45 }));
  return m;
}
