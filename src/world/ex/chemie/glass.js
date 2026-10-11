// Laborglas: Drehkörper-Profile (Außenhaut) und passende Flüssigkeitsfüllungen. Alles Meter, Boden des Gefäßes bei y = 0.
// Alle Funktionen schreiben in einen Batch (b), Glas und Flüssigkeit werden dort je Material zu einem Mesh zusammengefasst.
import * as THREE from 'three';
import { MAT } from './util.js';

const lerp = (a, b, t) => a + (b - a) * t;
// Außenprofil als Linienzug [[r, y], ...] mit steigendem y
function interpR(pr, y) { for (let i = 1; i < pr.length; i++) { const [r0, y0] = pr[i - 1], [r1, y1] = pr[i]; if (y >= y0 && y <= y1 && y1 > y0) return lerp(r0, r1, (y - y0) / (y1 - y0)); } return pr[pr.length - 1][0]; }
// Flüssigkeit bis Höhe `level`: Profil nach innen versetzt, oben mit ebener Fläche geschlossen
export function fillProfile(pr, level, inset = 0.0035, y0 = 0.004) {
  const out = [[0, y0]];
  for (const [r, y] of pr) if (y > y0 && y < level) out.push([Math.max(0.001, r - inset), y]);
  out.push([Math.max(0.001, interpR(pr, level) - inset), level], [0, level]); return out;
}
const arc = (cx, cy, r, a0, a1, n = 8) => Array.from({ length: n + 1 }, (_, i) => { const a = lerp(a0, a1, i / n); return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; });

// ---------------------------------------------------------------- Profile
export const PROFILE = {
  erlenmeyer: (k = 1) => [[0, 0], [0.052 * k, 0], [0.060 * k, 0.006 * k], [0.064 * k, 0.020 * k], [0.021 * k, 0.130 * k], [0.017 * k, 0.140 * k], [0.017 * k, 0.172 * k], [0.021 * k, 0.176 * k], [0.021 * k, 0.181 * k]],
  becher: (R = 0.04, H = 0.10) => [[0, 0], [R - 0.005, 0], [R, 0.005], [R, H], [R + 0.004, H + 0.003]],
  tube: (r = 0.0135, L = 0.17) => [[0, 0], ...arc(0, r, r, -Math.PI / 2, 0, 6).map(([x, y]) => [x, y]).slice(1), [r, L], [r + 0.0018, L + 0.002]],
  rund: (Rs = 0.058, rn = 0.018, Ln = 0.1) => { const th = Math.acos(rn / Rs), pts = arc(0, Rs, Rs, -Math.PI / 2, th, 14).slice(1), yj = Rs + Rs * Math.sin(th); return [[0, 0], ...pts, [rn, yj + Ln], [rn + 0.004, yj + Ln + 0.003]]; },
  zylinder: (r = 0.022, H = 0.25) => [[0, 0.012], [r, 0.012], [r, H], [r + 0.003, H + 0.004]],
};
export const levelOf = (pr, frac) => { const top = pr[pr.length - 1][1]; return Math.max(0.01, top * frac); };

// ---------------------------------------------------------------- Bausteine (position x,y,z = Mitte des Bodens)
export function addVessel(b, pr, x, y, z, { liquid = null, level = 0.4, opacity = 0.9, seg = 24, rot = [0, 0, 0] } = {}) {
  b.lathe(MAT.glass(), pr, x, y, z, { seg, rx: rot[0], ry: rot[1], rz: rot[2] });
  const top = pr[pr.length - 1];
  b.torus(MAT.glass(), top[0], 0.0017, x, y + top[1], z, { rx: Math.PI / 2, ts: Math.max(12, seg - 6), rs: 5 }); // Glasrand
  if (liquid != null) b.lathe(MAT.liquid(liquid, opacity), fillProfile(pr, levelOf(pr, level)), x, y, z, { seg: Math.max(12, seg - 6) });
}
export const erlenmeyer = (b, x, y, z, o = {}) => addVessel(b, PROFILE.erlenmeyer(o.k || 1), x, y, z, o);
export const becher = (b, x, y, z, o = {}) => addVessel(b, PROFILE.becher(o.R, o.H), x, y, z, o);
export const rundkolben = (b, x, y, z, o = {}) => addVessel(b, PROFILE.rund(o.Rs, o.rn, o.Ln), x, y, z, o);
export const reagenzglas = (b, x, y, z, o = {}) => addVessel(b, PROFILE.tube(o.r, o.L), x, y, z, { seg: 14, ...o });
export function messzylinder(b, x, y, z, o = {}) {
  const r = o.r || 0.022, H = o.H || 0.25; addVessel(b, PROFILE.zylinder(r, H), x, y, z, o);
  b.cyl(MAT.white(), r * 1.9, r * 1.9, 0.012, x, y + 0.006, z, { seg: 6 }); // Sechskantfuß
  for (let i = 1; i < 10; i++) b.box(MAT.paper(), i % 5 === 0 ? 0.014 : 0.008, 0.0016, 0.002, x, y + 0.02 + i * (H - 0.04) / 10, z - r - 0.0005); // Skala (zur Nordseite, also zum Betrachter)
}
// Korkring für den Rundkolben
export function korkring(b, x, y, z, R = 0.03) { b.torus(MAT.cork(), R, 0.012, x, y + 0.012, z, { rx: Math.PI / 2, ts: 16, rs: 8 }); }

// ---------------------------------------------------------------- Reagenzglasständer (Holz) mit farbigen Lösungen
const RAINBOW = [0xe04646, 0xf08a2e, 0xf2d33a, 0x52b85a, 0x3a8fe0, 0x7a56c9, 0xd85bb0];
export function reagenzglasstaender(b, wood, x, y, z) {
  const n = 7, pitch = 0.05, len = n * pitch + 0.04, dep = 0.12, h = 0.10;
  b.box(wood, len, 0.014, dep, x, y + 0.007, z);                                   // Bodenbrett
  for (const sx of [-1, 1]) b.box(wood, 0.014, h, dep, x + sx * (len / 2 - 0.007), y + h / 2, z);  // Seitenwände
  const top = new THREE.Shape(); top.moveTo(-len / 2, -dep / 2); top.lineTo(len / 2, -dep / 2); top.lineTo(len / 2, dep / 2); top.lineTo(-len / 2, dep / 2); top.closePath();
  for (let i = 0; i < n; i++) for (const rz of [-0.026, 0.026]) { const p = new THREE.Path(); p.absarc(-len / 2 + 0.02 + pitch * (i + 0.5), rz, 0.0165, 0, Math.PI * 2, true); top.holes.push(p); }
  const geo = new THREE.ExtrudeGeometry(top, { depth: 0.012, bevelEnabled: false, curveSegments: 10 }); geo.rotateX(-Math.PI / 2);
  b.add(geo, wood, { p: [x, y + h - 0.012, z] });                                                // Lochplatte
  for (let i = 0; i < n; i++) { const tx = x - len / 2 + 0.02 + pitch * (i + 0.5);
    reagenzglas(b, tx, y + 0.014, z + 0.026, { L: 0.17, liquid: RAINBOW[i], level: 0.5, r: 0.0135 });
    reagenzglas(b, tx, y + 0.014, z - 0.026, { L: 0.17, liquid: i % 3 === 1 ? 0xbfe3f0 : null, level: 0.3, r: 0.0135, opacity: 0.55 });
  }
  return { len, dep, h };
}
