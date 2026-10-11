// Biologie: kleine Dinge für Regalfächer (Töpfe, Gläser, Knochen, Muscheln ...). Jede Funktion liefert eine Gruppe, Ursprung unten Mitte.
import * as THREE from 'three';
import { M, mat, mesh, box, globe } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { glassMat } from './style.js';
import * as P from './plants.js';
import { buildAmmonite } from './fossils.js';

const glass = () => glassMat();
export const props = {
  fern: (o = {}) => P.fernPlant({ h: 0.36, potR: 0.07, fronds: 8, seed: o.seed || 1, kind: o.kind || 'terra' }),
  leafy: (o = {}) => { const b = P.bushPlant({ h: 0.9, seed: o.seed || 2, n: 22, size: 0.3, kind: o.kind || 'white' }); b.scale.setScalar(0.3); return b; },
  succ: (o = {}) => P.succulent({ r: 0.065, seed: o.seed || 3, kind: o.kind || 'terra', rings: 3 }),
  cactus: (o = {}) => P.cactus({ h: 0.14, seed: o.seed || 4, kind: o.kind || 'terra' }),
  grass: (o = {}) => P.grassTuft({ r: 0.06, h: 0.2, seed: o.seed || 5, n: 12, kind: o.kind || 'green' }),
  jar: (o = {}) => { // Einmachglas mit Moos und Blättern
    const g = new THREE.Group(), r = 0.05, h = 0.14, body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 18, 1, true), glass()); body.position.y = h / 2; body.renderOrder = 4; g.add(body);
    const moss = mesh(new THREE.SphereGeometry(r * 0.9, 12, 8, 0, TAU, 0, Math.PI / 2), M.plain(0x4f8a3a, 1)); moss.scale.y = 0.6; moss.position.y = 0.01; g.add(moss);
    const L = new P.Leaves(), rnd = mulberry32(o.seed || 7); for (let i = 0; i < 6; i++) L.leaf('simple', { o: [(rnd() - 0.5) * 0.04, 0.02, (rnd() - 0.5) * 0.04], yaw: rnd() * TAU, tilt: 0.2 + rnd() * 0.5, len: 0.08 + rnd() * 0.04, wid: 0.04, bend: 0.4, cup: 0.4, seg: 2, color: [0.9, 1, 0.9] }); g.add(L.mesh());
    const lid = mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.016, 18), M.brass()); lid.position.y = h + 0.008; g.add(lid); return g; },
  bone: () => { const g = new THREE.Group(), m = M.plain(0xede4cc, 0.6); const sh = mesh(new THREE.CylinderGeometry(0.014, 0.017, 0.22, 10), m); sh.rotation.z = Math.PI / 2; sh.position.y = 0.025; g.add(sh); for (const s of [-1, 1]) { for (const dz of [-1, 1]) { const k = mesh(new THREE.SphereGeometry(0.026, 12, 8), m); k.position.set(s * 0.115, 0.025, dz * 0.014); g.add(k); } } return g; },
  ammo: () => { const a = buildAmmonite({ size: 0.15, turns: 3.0 }); const g = new THREE.Group(); g.add(a); a.rotation.y = 0.0; return g; },
  globe: () => { const g = globe({ r: 0.07 }); g.scale.setScalar(0.7); g.position.y = -0.1; const w = new THREE.Group(); w.add(g); return w; },
  box: (o = {}) => { const g = new THREE.Group(), w = M.wood(0x6a4326, { planks: 1 }); const b = box(0.2, 0.06, 0.12, w, { tile: 1 }); b.position.y = 0.03; g.add(b); const l = box(0.204, 0.012, 0.124, M.brass()); l.position.y = 0.066; g.add(l); return g; },
  books: (o = {}) => { const g = new THREE.Group(), rnd = mulberry32(o.seed || 3), cols = [0x2f6a4a, 0x9a5a38, 0x2c5a6e, 0xc9a24a, 0x7a3a50]; for (let i = 0; i < 4; i++) { const h = 0.2 + rnd() * 0.1, b = box(0.05 + rnd() * 0.02, h, 0.16, M.plain(cols[i % 5], 0.7)); b.position.set(i * 0.058, h / 2, 0); g.add(b); } return g; },
  shell: () => { const g = new THREE.Group(); const c = new THREE.Mesh(new THREE.ConeGeometry(0.05, 0.12, 16), M.plain(0xe8d4b4, 0.5)); c.rotation.z = -1.2; c.position.y = 0.04; g.add(c); for (let i = 0; i < 5; i++) { const t = mesh(new THREE.TorusGeometry(0.04 - i * 0.006, 0.006, 6, 18), M.plain(0xb89868, 0.6)); t.rotation.y = Math.PI / 2; t.position.set(-0.01 + i * 0.016, 0.04, 0); g.add(t); } return g; },
};
