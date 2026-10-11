// Aufbau des Labortischs: Glasgeräte, Reagenzglasständer, zwei Bunsenbrenner (blau/gelb), Dreifuß, Destillationsapparatur, Schutzbrille, Mörser,
// dazu die Tipp-Flächen. Der Betrachter steht nördlich vom Tisch und schaut nach Süden: Osten ist links.
import * as THREE from 'three';
import { M, hitBox } from '../../kit.js';
import { Batch, MAT } from './util.js';
import { LAB, makeLabTable } from './furniture.js';
import { erlenmeyer, becher, rundkolben, messzylinder, korkring, reagenzglasstaender } from './glass.js';
import { makeBurner, makeTripod } from './burner.js';
import { makeDistillation } from './distill.js';

export const DIST_AT = { x: 1.92, z: 1.2 };       // Kolbenachse der Destillation (Weltachsen im Raum); die Apparatur ist in x gespiegelt (Kolben links vom Betrachter)

export function buildLab(g, cards, upd) {
  const H = LAB.H, wood = M.wood(0x6a4326, { planks: 1 });
  { const tb = makeLabTable(); tb.position.set(LAB.cx, 0, LAB.cz); g.add(tb); }
  // Tisch: Tippfläche (Körper) – Gegenstände liegen darüber und werden zuerst getroffen
  { const t = hitBox(LAB.L, H, LAB.D, cards.labortisch); t.position.set(LAB.cx, H / 2, LAB.cz); g.add(t); }

  // ---- Glasgeräte (alles ein Batch: Glas als ein durchsichtiges Mesh, Flüssigkeiten je Farbe)
  const gl = new Batch();
  erlenmeyer(gl, -1.95, H, 1.12, { liquid: 0x2f7fd8, level: 0.3 });
  korkring(gl, -1.58, H, 1.14); rundkolben(gl, -1.58, H + 0.016, 1.14, { liquid: 0xf2d33a, level: 0.28 });
  erlenmeyer(gl, -1.2, H, 1.12, { k: 0.9, liquid: 0x4cc15c, level: 0.32 });
  becher(gl, -1.95, H, 1.55, { R: 0.045, H: 0.11, liquid: 0xe04646, level: 0.5 });
  becher(gl, -1.62, H, 1.57, { R: 0.035, H: 0.08, liquid: 0xbfe3f0, level: 0.4, opacity: 0.6 });
  becher(gl, -1.28, H, 1.54, { R: 0.05, H: 0.13, liquid: 0xf08a2e, level: 0.55 });
  messzylinder(gl, -0.98, H, 1.5, { liquid: 0x9fd8ee, level: 0.42, opacity: 0.6 });
  g.add(gl.build({ name: 'glasgeraete' }));
  { const t = hitBox(1.36, 0.3, 0.72, cards.glas); t.position.set(-1.55, H + 0.15, 1.38); g.add(t); }

  // ---- Reagenzglasständer
  const rb = new Batch(); const rk = reagenzglasstaender(rb, wood, 0, 0, 0), rg = rb.build({ name: 'reagenzglaeser' }); rg.scale.setScalar(1.35); rg.position.set(-2.45, H, 1.2); g.add(rg);
  { const t = hitBox((rk.len + 0.04) * 1.35, 0.4, (rk.dep + 0.04) * 1.35, cards.reagenz); t.position.set(-2.45, H + 0.2, 1.2); g.add(t); }

  // ---- Bunsenbrenner mit Dreifuß (blau), zweiter Brenner mit gelber Flamme, Schutzbrille, Mörser
  const blue = makeBurner({ open: true }); blue.group.position.set(-0.4, H, 1.14); g.add(blue.group);
  const tri = makeTripod({ withBeaker: true, h: 0.34 }); tri.position.set(-0.4, H, 1.14); g.add(tri);
  const yel = makeBurner({ open: false }); yel.group.position.set(0.22, H, 1.14); g.add(yel.group);
  upd.push((dt, tm, t) => { blue.update(t); yel.update(t + 1.3); });
  { const t = hitBox(0.3, 0.52, 0.3, cards.bunsen); t.position.set(-0.4, H + 0.26, 1.2); g.add(t); const t2 = hitBox(0.17, 0.42, 0.17, cards.bunsen); t2.position.set(0.22, H + 0.21, 1.14); g.add(t2); }
  { // Schutzbrille: zwei Gläser mit Gummiband, liegt vorn am Tischrand
    const sb = new Batch(), fr = MAT.black(), lens = MAT.glass(), x0 = -0.08, z0 = 0.99;
    for (const sx of [-1, 1]) { sb.torus(fr, 0.032, 0.005, x0 + sx * 0.04, H + 0.03, z0, { rx: Math.PI / 2 - 0.5, ts: 18, rs: 5 }); sb.cyl(lens, 0.03, 0.03, 0.003, x0 + sx * 0.04, H + 0.03, z0, { rx: 0.5, seg: 16 }); }
    sb.box(fr, 0.02, 0.004, 0.006, x0, H + 0.036, z0 - 0.004); sb.pipe(fr, [[x0 + 0.075, H + 0.03, z0 + 0.012], [x0 + 0.09, H + 0.03, z0 + 0.012], [x0 + 0.09, H + 0.012, z0 + 0.012], [x0 + 0.09, H + 0.012, z0 + 0.1]], 0.004, 0.012, 6);
    g.add(sb.build({ name: 'schutzbrille' }));
  }

  // ---- Destillationsapparatur
  const d = makeDistillation({ mirrorX: true }); d.group.position.set(DIST_AT.x, H, DIST_AT.z); g.add(d.group);
  const W = (x, y, z) => [DIST_AT.x - x, H + y, DIST_AT.z + z];
  const box = (w, h, dd, x, y, z) => { const t = hitBox(w, h, dd, cards.destillation); t.position.set(...W(x, y, z)); g.add(t); return t; };
  box(0.34, 0.74, 0.26, 0.0, 0.37, 0.0);                    // Heizpilz, Kolben, Aufsatz, Thermometer
  { const c = box(0.62, 0.075, 0.075, 0.42, 0.30, 0.0); c.rotation.z = (18 * Math.PI) / 180; }  // Kühler (geneigt; Spiegelung in x kehrt die Neigung um)
  box(0.16, 0.26, 0.16, 0.687, 0.13, 0.0);                  // Vorlage
  box(0.3, 0.3, 0.3, 0.98, 0.15, 0.5);                      // Hahn und Becken
  return { dist: d, blue, yel };
}
