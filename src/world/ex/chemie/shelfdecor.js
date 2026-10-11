// Schmuck für die Regale: Gläser mit Pulvern, Mineralstufen, bunte Flaschen, Haushaltsdinge. Alles opak und mit Vertexfarben in EINEM Material,
// damit die Zusammenfassung in world.js daraus einen einzigen Zeichenaufruf macht. Lücken in den Bücherreihen über u.userData.taken.
import * as THREE from 'three';
import { mulberry32 } from '../../../lib/util.js';
import { Batch, MAT } from './util.js';

const C = (b, geo, color, o) => b.add(geo, MAT.vc(), { ...o, color });
const cyl = (b, color, rt, rb, h, x, y, z, seg = 14) => C(b, new THREE.CylinderGeometry(rt, rb, h, seg), color, { p: [x, y + h / 2, z] });
const lump = (b, rnd, color, s, x, y, z) => C(b, new THREE.IcosahedronGeometry(s, 1), color, { p: [x, y + s * 0.55, z], r: [rnd() * 3, rnd() * 3, rnd() * 3], s: [1.1, 0.8, 0.95] });
function jar(b, rnd, x, y, z, color, powder) { const r = 0.045 + rnd() * 0.01, h = 0.11 + rnd() * 0.05; cyl(b, 0xd7e6ea, r, r, h, x, y, z, 16); cyl(b, powder, r * 0.88, r * 0.88, h * 0.78, x, y + 0.004, z, 16); cyl(b, color, r * 1.05, r * 1.05, 0.026, x, y + h, z, 16); cyl(b, 0xf1e8cf, r + 0.002, r + 0.002, h * 0.34, x, y + h * 0.3, z, 16); }
function bottle(b, rnd, x, y, z, color, big = false) { const r = (big ? 0.05 : 0.036) + rnd() * 0.006, h = (big ? 0.2 : 0.13) + rnd() * 0.04; cyl(b, color, r, r, h * 0.7, x, y, z, 14); C(b, new THREE.CylinderGeometry(r * 0.38, r, h * 0.2, 14), color, { p: [x, y + h * 0.8, z] }); cyl(b, color, r * 0.38, r * 0.38, h * 0.2, x, y + h * 0.9, z, 12); cyl(b, 0xb98a55, r * 0.34, r * 0.3, 0.03, x, y + h * 1.1, z, 10); cyl(b, 0xf1e8cf, r + 0.001, r + 0.001, h * 0.28, x, y + h * 0.22, z, 14); }
function box(b, rnd, x, y, z, color) { const w = 0.15 + rnd() * 0.06, h = 0.1 + rnd() * 0.05, d = 0.09; C(b, new THREE.BoxGeometry(w, h, d), color, { p: [x, y + h / 2, z], r: [0, (rnd() - 0.5) * 0.4, 0] }); C(b, new THREE.BoxGeometry(w * 0.7, h * 0.4, d + 0.004), 0xf1e8cf, { p: [x, y + h / 2, z], r: [0, 0, 0] }); }
const THEMES = {
  stoffe(b, rnd, x, y, z) { jar(b, rnd, x, y, z, 0x2d6a6a, 0xf3efe0); jar(b, rnd, x + 0.12, y, z, 0x7b1f26, 0xd9a441); jar(b, rnd, x + 0.24, y, z, 0x2c4a6e, 0x9bc7e8); lump(b, rnd, 0x6a6e72, 0.035, x + 0.34, y, z + 0.02); },
  elemente(b, rnd, x, y, z) { cyl(b, 0x3a2214, 0.19, 0.19, 0.02, x + 0.16, y, z, 4); lump(b, rnd, 0xd9b04a, 0.04, x + 0.07, y + 0.02, z); lump(b, rnd, 0x3f9a6a, 0.045, x + 0.16, y + 0.02, z + 0.02); lump(b, rnd, 0x3a6fc0, 0.04, x + 0.25, y + 0.02, z - 0.01); lump(b, rnd, 0xe9e6da, 0.035, x + 0.12, y + 0.02, z - 0.06); lump(b, rnd, 0x8a5a3c, 0.035, x + 0.22, y + 0.02, z + 0.07); },
  reaktionen(b, rnd, x, y, z) { bottle(b, rnd, x, y, z, 0xd24a3a, true); bottle(b, rnd, x + 0.12, y, z, 0x3a7fd0); bottle(b, rnd, x + 0.22, y, z, 0xe0b83a, true); bottle(b, rnd, x + 0.33, y, z + 0.01, 0x4cae5c); },
  alltag(b, rnd, x, y, z) { box(b, rnd, x, y, z, 0xc9d9e8); cyl(b, 0xe8e2d0, 0.05, 0.05, 0.14, x + 0.2, y, z, 16); cyl(b, 0x2f7fd0, 0.052, 0.052, 0.03, x + 0.2, y + 0.14, z, 16); bottle(b, rnd, x + 0.32, y, z, 0xe9e5d6, true); bottle(b, rnd, x + 0.43, y, z, 0xb8862f); },
};
export function decorateUnit(u, theme, seed = 1) {
  const rnd = mulberry32(seed * 7919), b = new Batch(), fn = THEMES[theme]; if (!fn) return;
  const slots = u.userData.slots;
  for (const k of [1, 3]) {
    const sl = slots[k]; if (!sl) continue; const x = sl.x0 + 0.12 + rnd() * (sl.x1 - sl.x0 - 0.62); fn(b, rnd, x, sl.y + 0.006, sl.z - 0.02);
    (u.userData.taken[k] ||= []).push([x - 0.04, x + 0.52]);
  }
  const g = b.build({ name: 'regalschmuck' }); u.add(g);
}
