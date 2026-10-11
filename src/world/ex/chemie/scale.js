// Balkenwaage (Lavoisier): Messingsäule auf Holzfuß, Waagebalken mit Zeiger, zwei Schalen an Ketten: links ein verschlossener Kolben, rechts Gewichte.
// Der Balken schwankt nur ganz leicht und kommt zur Ruhe (dynamische Gruppe). Ursprung: Tischplatte unter der Mitte.
import * as THREE from 'three';
import { M } from '../../kit.js';
import { Batch, MAT } from './util.js';
import { PROFILE, addVessel } from './glass.js';

export function makeScale() {
  const grp = new THREE.Group(), brass = M.brass(), wood = M.wood(0x4a2a18, { planks: 1 }), b = new Batch();
  const Y = 0.40, A = 0.26;            // Drehpunkthöhe, halbe Balkenlänge
  b.box(wood, 0.4, 0.035, 0.18, 0, 0.0175, 0, 0, { tile: 1 }); b.box(wood, 0.34, 0.02, 0.15, 0, 0.045, 0, 0, { tile: 1 });
  b.cyl(brass, 0.016, 0.026, 0.3, 0, 0.2, 0, { seg: 16 }); b.cyl(brass, 0.034, 0.034, 0.016, 0, 0.062, 0, { seg: 18 }); b.cyl(brass, 0.02, 0.02, 0.04, 0, 0.36, 0, { seg: 14 });
  b.sph(brass, 0.021, 0, Y, 0, { w: 14, h: 10 });
  b.torus(brass, 0.07, 0.006, 0, 0.13, 0.0, { ts: 28, arc: Math.PI, rz: Math.PI, rs: 6 }); // Skalenbogen (Messing) hinter dem Zeiger
  grp.add(b.build({ name: 'waage-fuss' }));
  // beweglich: Balken, Zeiger, Schalen
  const beam = new THREE.Group(); beam.position.y = Y; beam.userData.dynamic = true;
  const bb = new Batch();
  bb.box(brass, 2 * A, 0.014, 0.01, 0, 0, 0.0); bb.box(brass, 0.02, 0.03, 0.012, 0, 0.01, 0);
  for (const s of [-1, 1]) { bb.sph(brass, 0.012, s * A, 0, 0, { w: 8, h: 6 }); bb.tube(brass, [s * A, 0.0, 0], [s * A, -0.012, 0], 0.004, 6); }
  bb.tube(brass, [0, 0, 0.004], [0, -0.265, 0.004], 0.0035, 6, 0.0012);                          // Zeiger
  beam.add(bb.build({ name: 'waagebalken' }));
  const pan = (side) => {
    const g = new THREE.Group(); g.position.set(side * A, -0.012, 0); g.userData.dynamic = true; const pb = new Batch(), drop = 0.27;
    for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3 + 0.4; pb.tube(brass, [0, 0, 0], [Math.cos(a) * 0.085, -drop, Math.sin(a) * 0.085], 0.0017, 5); }
    pb.lathe(brass, [[0.0, -drop - 0.012], [0.05, -drop - 0.01], [0.088, -drop], [0.094, -drop + 0.006]], 0, 0, 0, { seg: 26 });
    if (side < 0) { addVessel(pb, PROFILE.erlenmeyer(0.62), 0, -drop - 0.002, 0, { liquid: 0xb9d6e4, level: 0.2, opacity: 0.6, seg: 24 }); pb.cyl(MAT.cork(), 0.0125, 0.0105, 0.02, 0, -drop + 0.113 + 0.006, 0, { seg: 12 }); }
    else { for (const [x, z, r, h] of [[-0.03, 0.0, 0.024, 0.026], [0.03, 0.015, 0.018, 0.02], [0.0, -0.03, 0.014, 0.016], [0.035, -0.025, 0.01, 0.012]]) { pb.cyl(brass, r, r, h, x, -drop + h / 2 - 0.0, z, { seg: 14 }); pb.sph(brass, r * 0.35, x, -drop + h + r * 0.2, z, { w: 8, h: 6 }); } }
    g.add(pb.build({ name: 'waageschale' })); return g;
  };
  const pl = pan(-1), pr = pan(1); beam.add(pl, pr);
  grp.add(beam);
  const update = (t) => { const a = 0.012 * Math.exp(-((t % 40) * 0.12)) * Math.sin(t * 2.2) + 0.002 * Math.sin(t * 0.7); beam.rotation.z = a; pl.rotation.z = -a; pr.rotation.z = -a; };
  return { group: grp, update, size: { w: 0.62, h: 0.66 } };
}

// Gewichtssatz im Holzkasten (nur Optik)
export function makeWeightBox() {
  const g = new THREE.Group(), b = new Batch(), wood = M.wood(0x4a2a18, { planks: 1 }), brass = M.brass();
  b.box(wood, 0.26, 0.04, 0.12, 0, 0.02, 0, 0, { tile: 1 }); b.box(MAT.solid(0x1d3a2a, 1), 0.23, 0.002, 0.095, 0, 0.041, 0);
  for (let i = 0; i < 8; i++) { const r = 0.009 + (i % 4) * 0.0025; b.cyl(brass, r, r, 0.016, -0.1 + i * 0.029, 0.05, i % 2 ? 0.02 : -0.02, { seg: 10 }); b.sph(brass, r * 0.4, -0.1 + i * 0.029, 0.062, i % 2 ? 0.02 : -0.02, { w: 6, h: 5 }); }
  g.add(b.build({ name: 'gewichte' })); return g;
}
