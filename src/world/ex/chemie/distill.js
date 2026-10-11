// Destillationsapparatur (Liebig-Kühler), fachlich korrekt aufgebaut:
//  Heizpilz auf Hebebühne, Siedekolben (Rundkolben) mit Siedesteinen, Destillationsaufsatz mit Thermometer (Kugel in Höhe des Seitenrohrs),
//  Liebig-Kühler leicht abfallend (Kühlwasser im Gegenstrom: unten rein, oben raus), Vorstoß und Vorlage (Erlenmeyerkolben), zwei Stative.
// Koordinaten lokal: Ursprung = Tischplatte unter der Kolbenachse, +x zur Vorlage, +z nach hinten (vom Betrachter weg), y nach oben.
import * as THREE from 'three';
import { Batch, MAT } from './util.js';
import { PROFILE, addVessel, erlenmeyer } from './glass.js';

const TH = (18 * Math.PI) / 180, D = new THREE.Vector3(Math.cos(TH), -Math.sin(TH), 0);
export const GEO = { ks: [0.1427, 0.4086], lc: 0.46, tx: 0.6867 };
const axisPt = (t) => [GEO.ks[0] + D.x * t, GEO.ks[1] + D.y * t, 0];

function hose(b, mat, pts, r) {
  const curve = new THREE.CatmullRomCurve3(pts.map((p) => new THREE.Vector3(...p)), false, 'centripetal');
  b.add(new THREE.TubeGeometry(curve, 48, r, 8, false), mat);
}
// Stativ mit Muffe und Klemme: Stange bei (x, z), Klemme hält ein Rohr/Hals bei (cx, cy, cz=0) mit Ringradius ringR
function stand(b, x, z, h, clampY, cx, ringR, axis = [0, 1, 0]) {
  const st = MAT.darkSteel(), br = MAT.steel();
  b.box(MAT.black(), 0.24, 0.02, 0.15, x + 0.02, 0.01, z);                      // Fußplatte
  b.cyl(br, 0.0065, 0.0065, h, x, h / 2, z, { seg: 8 });                         // Stange
  b.box(st, 0.03, 0.03, 0.03, x, clampY, z);                                       // Muffe
  b.cyl(MAT.steel(), 0.005, 0.005, z - 0.012, x, clampY, z / 2, { rx: Math.PI / 2, seg: 6 });      // Ausleger (nach vorn)
  { const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...axis).normalize()); b.add(new THREE.TorusGeometry(ringR, 0.0045, 6, 18), br, { m: new THREE.Matrix4().compose(new THREE.Vector3(cx, clampY, 0), q, new THREE.Vector3(1, 1, 1)) }); } // Klemmring um das Rohr
  b.cyl(st, 0.008, 0.008, 0.03, x, clampY + 0.018, z - 0.002, { seg: 8 });         // Flügelschraube
}

export function makeDistillation() {
  const grp = new THREE.Group(), b = new Batch(), glass = MAT.glass();
  // ---- Hebebühne und Heizpilz
  b.box(MAT.darkSteel(), 0.17, 0.075, 0.17, 0, 0.0375, 0); b.box(MAT.steel(), 0.2, 0.012, 0.2, 0, 0.081, 0);
  b.cyl(MAT.black(), 0.012, 0.012, 0.03, 0.1, 0.04, 0.0, { rz: Math.PI / 2, seg: 8 });
  b.cyl(MAT.darkSteel(), 0.09, 0.092, 0.105, 0, 0.1395, 0, { seg: 28 }); b.torus(MAT.steel(), 0.09, 0.005, 0, 0.192, 0, { rx: Math.PI / 2, ts: 28, rs: 6 });
  b.lathe(MAT.solid(0xb9ab8c, 0.97), [[0, 0.124], [0.034, 0.128], [0.058, 0.146], [0.074, 0.17], [0.078, 0.19]], 0, 0, 0, { seg: 26 });           // Heizpilz-Mulde (Glasfasergewebe)
  b.box(MAT.black(), 0.075, 0.055, 0.045, 0, 0.12, -0.11); b.cyl(MAT.steel(), 0.013, 0.013, 0.02, -0.017, 0.122, -0.14, { rx: Math.PI / 2, seg: 14 }); b.box(MAT.steel(), 0.003, 0.016, 0.004, -0.017, 0.122, -0.151);
  b.sph(MAT.emissive(0xff3322, 2.2), 0.005, 0.021, 0.14, -0.134, { w: 8, h: 6 });
  b.pipe(MAT.black(), [[0.03, 0.11, -0.11], [0.03, 0.02, -0.11], [0.18, 0.012, -0.11], [0.3, 0.012, 0.15]], 0.004, 0.03, 6);                // Netzkabel

  // ---- Siedekolben mit Siedesteinen und Gemisch; Boden liegt in der Mulde
  const F0 = 0.125, flask = PROFILE.rund(0.062, 0.017, 0.11);
  addVessel(b, flask, 0, F0, 0, { liquid: 0xb0283c, level: 0.34, opacity: 0.82, seg: 28 });
  for (const [x, z, r, c] of [[0.012, 0.01, 0.007, 0xe2dccb], [-0.018, -0.006, 0.006, 0xcfc8b4], [0.003, -0.02, 0.0065, 0xe8e2d0], [-0.006, 0.022, 0.006, 0xd9d2bf], [0.028, -0.012, 0.0055, 0xe0d9c6]]) b.sph(MAT.solid(c, 0.95), r, x, F0 + 0.012 + r * 0.4, z, { w: 7, h: 5 });
  // ---- Destillationsaufsatz: senkrechtes Rohr (Schliff auf dem Kolbenhals), Thermometerstutzen oben, Seitenrohr zum Kühler
  const yTopFlask = F0 + 0.1216 + 0.11;                 // Oberkante Kolbenhals
  b.cyl(glass, 0.0235, 0.0235, 0.04, 0, yTopFlask - 0.006, 0, { seg: 20 });  // Schliffhülse
  b.cyl(glass, 0.0195, 0.0195, 0.15, 0, 0.415, 0, { seg: 20 });             // senkrechtes Rohr  (0.34 .. 0.49)
  b.cyl(glass, 0.0135, 0.0135, 0.04, 0, 0.505, 0, { seg: 16 });             // Thermometerstutzen
  b.cyl(MAT.rubber(), 0.0158, 0.0158, 0.024, 0, 0.53, 0, { seg: 14 });      // Gummiadapter
  b.tube(glass, [0, 0.455, 0], [GEO.ks[0], GEO.ks[1], 0], 0.0125, 14);        // Seitenrohr (Dampfweg)
  // Thermometer: Stab, Kugel in Höhe des Seitenrohrs, rote Säule
  b.cyl(glass, 0.0045, 0.0045, 0.24, 0, 0.545, 0, { seg: 8 }); b.sph(MAT.liquid(0xd8261b, 1), 0.0068, 0, 0.436, 0, { w: 10, h: 8 }); b.cyl(MAT.liquid(0xd8261b, 1), 0.0017, 0.0017, 0.13, 0, 0.5, 0, { seg: 6 });
  b.box(MAT.paper(), 0.002, 0.2, 0.0085, 0, 0.55, 0.0038);                   // weißer Skalenstreifen
  for (let i = 0; i < 14; i++) b.box(MAT.black(), 0.0021, 0.0011, 0.0092, 0, 0.455 + i * 0.0125, 0.0038);
  // ---- Liebig-Kühler: Innenrohr, Kühlmantel mit Wasser, Endstücke, Schlauchanschlüsse (unten rein, oben raus)
  const L = GEO.lc, pa = axisPt(0), pb = axisPt(L + 0.07), mid = axisPt(L / 2);
  b.tube(glass, pa, pb, 0.0075, 12);                                              // Innenrohr (Kondensat)
  { const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), D.clone()); const m = new THREE.Matrix4().compose(new THREE.Vector3(...axisPt(L / 2)), q, new THREE.Vector3(1, 1, 1));
    const j = new THREE.CylinderGeometry(0.0255, 0.0255, L, 24, 1, true); b.add(j, glass, { m });
    const ring = [[0.0095, -L / 2], [0.0245, -L / 2], [0.0245, L / 2], [0.0095, L / 2], [0.0095, -L / 2]];
    b.add(new THREE.LatheGeometry(ring.map(([r, y]) => new THREE.Vector2(r, y)), 22), MAT.liquid(0x4aa3e8, 0.38), { m });                 // Kühlwasser im Mantel
    for (const s of [-1, 1]) { const cap = new THREE.CylinderGeometry(s > 0 ? 0.0105 : 0.0105, 0.0255, 0.018, 20, 1, true); const mm = new THREE.Matrix4().compose(new THREE.Vector3(...axisPt(L / 2 + s * (L / 2 + 0.009))), q.clone().multiply(new THREE.Quaternion().setFromAxisAngle(new THREE.Vector3(1, 0, 0), s > 0 ? Math.PI : 0)), new THREE.Vector3(1, 1, 1)); b.add(cap, glass, { m: mm }); } }
  const n = new THREE.Vector3(Math.sin(TH), Math.cos(TH), 0);                  // senkrecht zur Achse, schräg nach oben
  const at = (t, s, len) => { const p = axisPt(t); return [p[0] + n.x * s * len, p[1] + n.y * s * len, 0]; };
  const tLow = L - 0.05, tUp = 0.05;
  b.tube(glass, at(tLow, -1, 0.02), at(tLow, -1, 0.064), 0.0065, 10); b.tube(glass, at(tLow, -1, 0.058), at(tLow, -1, 0.068), 0.0088, 10);   // unten: Wasser rein
  b.tube(glass, at(tUp, 1, 0.02), at(tUp, 1, 0.064), 0.0065, 10); b.tube(glass, at(tUp, 1, 0.058), at(tUp, 1, 0.068), 0.0088, 10);           // oben: Wasser raus
  const pLow = at(tLow, -1, 0.062), pUp = at(tUp, 1, 0.062);
  // ---- Vorstoß (Adapter) und Vorlage
  const tx = GEO.tx, ey = pb[1];
  b.pipe(glass, [[pb[0], ey, 0], [tx, ey, 0], [tx, 0.15, 0]], 0.0085, 0.02, 10);
  erlenmeyer(b, tx, 0, 0, { liquid: 0xcfe8f0, level: 0.17, opacity: 0.6, seg: 28 });
  b.sph(MAT.liquid(0xcfe8f0, 0.7), 0.0034, tx + 0.0005, 0.146, 0, { w: 8, h: 6 }); // Tropfen am Vorstoß
  // ---- Stative: Kolbenhals (Klemme bei y = 0.30) und Kühler (Klemme in der Mitte des Mantels)
  stand(b, 0, 0.17, 0.66, 0.30, 0, 0.0225);
  const cm = axisPt(0.27); stand(b, cm[0], 0.17, 0.6, cm[1], cm[0], 0.0285, [D.x, D.y, 0]);
  // ---- Schläuche: Zulauf (blau) vom Wasserhahn zum unteren Anschluss, Ablauf (grau) vom oberen Anschluss ins Becken
  const TAP = { x: 0.98, z: 0.54 };
  hose(b, MAT.hoseBlue(), [pLow, [pLow[0] - 0.01, pLow[1] - 0.07, 0.02], [0.5, 0.03, 0.14], [0.68, 0.022, 0.34], [TAP.x - 0.06, 0.19, TAP.z + 0.06]], 0.0072);
  hose(b, MAT.hoseGrey(), [pUp, [pUp[0] + 0.0, pUp[1] + 0.05, 0.02], [pUp[0] + 0.03, pUp[1] + 0.05, 0.16], [0.30, 0.50, 0.34], [0.62, 0.30, 0.44], [TAP.x - 0.08, 0.08, TAP.z - 0.05]], 0.0072);
  // ---- Wasserhahn und Ausgussbecken (Laborstandard)
  b.box(MAT.ceramic(), 0.24, 0.06, 0.2, TAP.x + 0.0, 0.03, TAP.z - 0.06); b.box(MAT.solid(0x33383a, 0.6), 0.17, 0.003, 0.13, TAP.x, 0.0615, TAP.z - 0.06);
  b.cyl(MAT.copper(), 0.013, 0.015, 0.2, TAP.x, 0.1, TAP.z + 0.07, { seg: 12 }); b.pipe(MAT.copper(), [[TAP.x, 0.2, TAP.z + 0.07], [TAP.x, 0.255, TAP.z + 0.07], [TAP.x, 0.255, TAP.z - 0.02], [TAP.x, 0.21, TAP.z - 0.02]], 0.012, 0.04, 12);
  b.cyl(MAT.copper(), 0.007, 0.007, 0.05, TAP.x - 0.03, 0.18, TAP.z + 0.07, { rz: Math.PI / 2, seg: 8 });
  b.cyl(MAT.solid(0x2e7bd0, 0.5), 0.004, 0.004, 0.06, TAP.x, 0.235, TAP.z + 0.07, { rz: Math.PI / 2, seg: 6 }); b.sph(MAT.solid(0x2e7bd0, 0.5), 0.011, TAP.x + 0.03, 0.235, TAP.z + 0.07, { w: 8, h: 6 });
  grp.add(b.build({ name: 'destillation' }));
  return { group: grp, tap: TAP, size: { x0: -0.12, x1: 1.15, z0: -0.15, z1: 0.65, h: 0.7 } };
}
