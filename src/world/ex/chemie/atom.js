// Atommodell als drehende Skulptur: Natrium-Atom im Bohrschen Schalenmodell (vereinfacht): Kern aus 11 Protonen und 12 Neutronen,
// drei Schalen mit 2, 8 und 1 Elektron. Ringe fest, Elektronen laufen darauf um, alles dreht sich langsam. Ursprung: Fuß der Säule.
import * as THREE from 'three';
import { M } from '../../kit.js';
import { Batch, MAT } from './util.js';

export function makeAtom({ h = 1.12 } = {}) {
  const grp = new THREE.Group(), brass = M.brass(), wood = M.wood(0x3a2214, { planks: 1 }), cy = h + 0.62;
  // Säule (Holz, Messingkragen), schlanke Stange bis zum Kern
  const b = new Batch();
  b.cyl(wood, 0.17, 0.2, 0.05, 0, 0.025, 0, { seg: 24 }); b.cyl(wood, 0.075, 0.11, h - 0.1, 0, 0.05 + (h - 0.1) / 2, 0, { seg: 20 });
  b.cyl(brass, 0.145, 0.145, 0.03, 0, h - 0.045, 0, { seg: 24 }); b.cyl(wood, 0.16, 0.16, 0.04, 0, h - 0.01, 0, { seg: 24 });
  b.cyl(brass, 0.014, 0.014, 0.62, 0, h + 0.3, 0, { seg: 8 });
  grp.add(b.build({ name: 'atom-saeule' }));
  // drehende Gruppe
  const spin = new THREE.Group(); spin.position.y = cy; spin.userData.dynamic = true; grp.add(spin);
  // Kern: 11 rote Protonen, 12 graue Neutronen als Haufen
  const nb = new Batch(), red = MAT.solid(0xc8372d, 0.45, 0.1), grey = MAT.solid(0xc9ccd0, 0.5, 0.1);
  // 23 Kugeln (11 rot = Protonen, 12 grau = Neutronen) nach goldenem Winkel in einer Kugel verteilt
  for (let i = 0; i < 23; i++) {
    const rr = 0.074 * Math.cbrt((i + 0.5) / 23), y = 1 - (2 * (i + 0.5)) / 23, rad = Math.sqrt(1 - y * y), a = i * 2.39996;
    nb.sph(i % 2 === 1 ? red : grey, 0.03, rr * rad * Math.cos(a), rr * y, rr * rad * Math.sin(a), { w: 10, h: 8 });
  }
  spin.add(nb.build({ name: 'kern' }));
  // Schalen: Ringe (Messing) in unterschiedlichen Ebenen, Elektronen laufen um
  const shells = [{ r: 0.19, n: 2, tilt: [0.0, 0.0], w: 1.9, col: 0x3b9ae8 }, { r: 0.32, n: 8, tilt: [1.05, 0.3], w: 1.1, col: 0x3b9ae8 }, { r: 0.45, n: 1, tilt: [-0.9, 1.1], w: 0.7, col: 0xf2c14a }];
  const runners = [];
  for (const s of shells) {
    const tg = new THREE.Group(); tg.rotation.set(s.tilt[0], s.tilt[1], 0); spin.add(tg);
    const rb = new Batch(); rb.torus(brass, s.r, 0.0065, 0, 0, 0, { ts: 64, rs: 6 }); tg.add(rb.build({ name: 'schale' }));
    const run = new THREE.Group(); run.userData.dynamic = true; tg.add(run);
    const eb = new Batch(); for (let i = 0; i < s.n; i++) { const a = (i / s.n) * Math.PI * 2; eb.sph(MAT.solid(s.col, 0.25, 0.3), 0.028, Math.cos(a) * s.r, Math.sin(a) * s.r, 0, { w: 12, h: 8 }); }
    run.add(eb.build({ name: 'elektronen' })); runners.push([run, s.w]);
  }
  const update = (t) => { spin.rotation.y = t * 0.25; for (const [r, w] of runners) r.rotation.z = t * w; };
  return { group: grp, update, centerY: cy, radius: 0.48 };
}
