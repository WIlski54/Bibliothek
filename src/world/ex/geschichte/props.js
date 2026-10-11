// Möbel und Requisiten für den Raum Geschichte: Kartentisch (Karte, Zirkel, Lineal, Lupe, Tintenfass), Gutenberg-Presse mit Setzkasten,
// Sonnenscheibe als Hintergrund für die Maske, Papierstapel. Alles aus einfachen Formen; statisch -> wird in world.js zusammengefasst.
import * as THREE from 'three';
import { M, box, mesh } from '../../kit.js';
import { cv, tex, W } from './decor.js';
import { renderMap } from './worldmap.js';
import { mulberry32 } from '../../../lib/util.js';

const TAU = Math.PI * 2;
const SERIF = 'Georgia, "Times New Roman", serif';

// ---------------------------------------------------------------- Sonnenscheibe (Papierschnitt-Hintergrund)
export function sunDisc(r = 0.5) {
  const [c, g] = cv(512, 512), cx = 256, cy = 256;
  g.translate(cx, cy);
  const rays = 24; g.fillStyle = '#e9b84a';
  for (let i = 0; i < rays; i++) { g.save(); g.rotate((i / rays) * TAU); g.beginPath(); g.moveTo(-9, -150); g.lineTo(0, -246); g.lineTo(9, -150); g.closePath(); g.fill(); g.restore(); }
  g.fillStyle = '#f6efdc'; g.beginPath(); g.arc(0, 0, 170, 0, TAU); g.fill();
  const gr = g.createRadialGradient(-30, -40, 10, 0, 0, 160); gr.addColorStop(0, '#fff0b3'); gr.addColorStop(0.6, '#f0c85a'); gr.addColorStop(1, '#c4952a'); g.fillStyle = gr; g.beginPath(); g.arc(0, 0, 160, 0, TAU); g.fill();
  g.strokeStyle = 'rgba(120,70,10,.5)'; g.lineWidth = 3; for (const rr of [150, 120]) { g.beginPath(); g.arc(0, 0, rr, 0, TAU); g.stroke(); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(r * 2, r * 2), new THREE.MeshStandardMaterial({ map: tex(c), transparent: true, alphaTest: 0.05, roughness: 0.5, metalness: 0.2, emissive: 0x2a1a05, emissiveIntensity: 0.4 }));
  return m;
}

// ---------------------------------------------------------------- Kartentisch
let rulerMat = null;
function ruler(len = 0.5, wd = 0.05) {
  if (!rulerMat) { const [c, g] = cv(512, 64); g.fillStyle = '#e7d3a0'; g.fillRect(0, 0, 512, 64); g.fillStyle = '#3b2415'; for (let i = 0; i <= 50; i++) { const x = 6 + i * 10, h = i % 10 === 0 ? 26 : i % 5 === 0 ? 18 : 11; g.fillRect(x, 0, 2, h); if (i % 10 === 0 && i) { g.font = `bold 16px ${SERIF}`; g.textAlign = 'center'; g.fillText(String(i / 10), x + 1, 42); } } rulerMat = new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6 }); }
  const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.BoxGeometry(len, 0.006, wd), [M.plain(0xc9ab6a, 0.7), M.plain(0xc9ab6a, 0.7), rulerMat, M.plain(0xc9ab6a, 0.7), M.plain(0xc9ab6a, 0.7), M.plain(0xc9ab6a, 0.7)]); g.add(b); return g;
}
export function mapTable() {
  const g = new THREE.Group(); const wd = W(0x4a2416, { planks: 3, seed: 4 }), br = M.brass(), L = 1.9, D = 0.95, H = 0.8;
  const top = box(L, 0.07, D, wd, { tile: 1 }); top.position.y = H - 0.035; g.add(top);
  const edge = box(L + 0.04, 0.014, D + 0.04, br); edge.position.y = H - 0.075; g.add(edge);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    const leg = mesh(new THREE.CylinderGeometry(0.045, 0.06, H - 0.12, 12), wd, { tile: 1 }); leg.position.set(sx * (L / 2 - 0.1), (H - 0.12) / 2, sz * (D / 2 - 0.1)); g.add(leg);
    const ball = mesh(new THREE.SphereGeometry(0.065, 12, 8), wd, { tile: 1 }); ball.position.set(sx * (L / 2 - 0.1), H - 0.16, sz * (D / 2 - 0.1)); g.add(ball);
    const foot = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.03, 12), br); foot.position.set(sx * (L / 2 - 0.1), 0.015, sz * (D / 2 - 0.1)); g.add(foot);
  }
  const apron = box(L - 0.2, 0.14, 0.04, wd, { tile: 1 }); apron.position.set(0, H - 0.14, D / 2 - 0.1); g.add(apron); const apron2 = apron.clone(); apron2.position.z = -D / 2 + 0.1; g.add(apron2);
  for (const sx of [-1, 1]) { const s = box(0.04, 0.14, D - 0.2, wd, { tile: 1 }); s.position.set(sx * (L / 2 - 0.1), H - 0.14, 0); g.add(s); }
  for (const x of [-0.45, 0.45]) { const kn = mesh(new THREE.SphereGeometry(0.02, 10, 8), br); kn.position.set(x, H - 0.14, D / 2 - 0.065); g.add(kn); }
  const stretch = box(L - 0.4, 0.04, 0.05, wd, { tile: 1 }); stretch.position.set(0, 0.18, 0); g.add(stretch);
  // Karte (Mittelmeer und Nil) auf Papierunterlage
  const [mc] = (() => { const c = document.createElement('canvas'); c.width = 1024; c.height = 560; renderMap(c, { lon0: -12, lon1: 50, lat0: 20, lat1: 53, margin: 22, labels: false, pins: false, ornaments: false, title: false, mtn: 12, seed: 3 }); return [c]; })();
  const sheet = box(1.54, 0.005, 0.86, M.plain(0xf1e3bd, 1), { tile: 0 }); sheet.position.y = H + 0.0025; g.add(sheet);
  const map = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5 * 560 / 1024), new THREE.MeshStandardMaterial({ map: tex(mc), roughness: 0.85 }));
  map.rotation.x = -Math.PI / 2; map.position.y = H + 0.0058; g.add(map);
  // Zirkel
  const comp = new THREE.Group(); const mt = M.brass();
  for (const s of [-1, 1]) { const leg = box(0.012, 0.24, 0.008, mt); leg.position.set(s * 0.05, 0.12, 0); leg.rotation.z = -s * 0.43; comp.add(leg); const tip = mesh(new THREE.ConeGeometry(0.005, 0.03, 6), M.plain(0x333333, 0.5, 0.8)); tip.position.set(s * 0.108, 0.005, 0); tip.rotation.z = Math.PI + s * 0.0; comp.add(tip); }
  const hinge = mesh(new THREE.SphereGeometry(0.02, 10, 8), mt); hinge.position.y = 0.245; comp.add(hinge); const bar = mesh(new THREE.TorusGeometry(0.045, 0.004, 5, 14, Math.PI), mt); bar.position.y = 0.1; bar.rotation.z = Math.PI; comp.add(bar);
  comp.position.set(0.42, H + 0.006, -0.12); comp.rotation.y = 0.5; g.add(comp);
  // Lineal
  const rl = ruler(0.55, 0.055); rl.position.set(-0.35, H + 0.009, -0.12); rl.rotation.y = 0.35; g.add(rl);
  // Lupe
  const lupe = new THREE.Group(); const ring = mesh(new THREE.TorusGeometry(0.075, 0.008, 8, 24), mt); lupe.add(ring);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(0.072, 24), new THREE.MeshStandardMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.25, roughness: 0.05, depthWrite: false })); lupe.add(lens);
  const hd = mesh(new THREE.CylinderGeometry(0.012, 0.014, 0.16, 10), W(0x3a2014, { planks: 1 }), { tile: 1 }); hd.rotation.z = Math.PI / 2; hd.position.set(0.155, 0, 0); lupe.add(hd);
  lupe.rotation.x = -Math.PI / 2 + 0.06; lupe.position.set(0.1, H + 0.02, 0.25); lupe.rotation.z = 0.5; g.add(lupe);
  // Tintenfass mit Feder
  const ink = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.05, 14), M.plain(0x1c2a3a, 0.2, 0.4)); ink.position.set(-0.72, H + 0.03, 0.3); g.add(ink);
  const lidk = mesh(new THREE.CylinderGeometry(0.022, 0.03, 0.02, 12), mt); lidk.position.set(-0.72, H + 0.065, 0.3); g.add(lidk);
  const quill = mesh(new THREE.CylinderGeometry(0.002, 0.003, 0.28, 5), M.plain(0xf3ead2, 0.8)); quill.position.set(-0.7, H + 0.19, 0.3); quill.rotation.z = -0.5; g.add(quill);
  const feather = new THREE.Mesh(new THREE.PlaneGeometry(0.05, 0.19), new THREE.MeshStandardMaterial({ color: 0xf6efdc, roughness: 0.9, side: THREE.DoubleSide })); feather.position.set(-0.64, H + 0.24, 0.3); feather.rotation.z = -0.5; g.add(feather);
  // Kartenrolle
  const roll = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.6, 14), M.plain(0xf1e3bd, 0.9)); roll.rotation.z = Math.PI / 2; roll.rotation.y = 0.3; roll.position.set(0.55, H + 0.05, -0.34); g.add(roll);
  const rib = mesh(new THREE.TorusGeometry(0.042, 0.005, 6, 14), M.plain(0xa8302a, 0.6)); rib.rotation.y = Math.PI / 2 + 0.3; rib.position.set(0.55, H + 0.05, -0.34); g.add(rib);
  g.userData.size = { w: L, d: D, h: H };
  return g;
}

// ---------------------------------------------------------------- Gutenberg-Druckerpresse (Spindelpresse), vereinfachtes Modell
export function printingPress() {
  const g = new THREE.Group(); const wd = W(0xa8703c, { planks: 2, seed: 6 }), dk = W(0x6a3a1c, { planks: 1 }), br = M.brass(), iron = M.plain(0x2b2b2e, 0.5, 0.7);
  for (const sx of [-1, 1]) { const skid = box(0.1, 0.1, 0.9, wd, { tile: 1 }); skid.position.set(sx * 0.36, 0.05, 0.05); g.add(skid); const post = box(0.1, 1.45, 0.12, wd, { tile: 1 }); post.position.set(sx * 0.36, 0.1 + 0.725, -0.2); g.add(post); const br2 = box(0.08, 0.5, 0.08, wd, { tile: 1 }); br2.position.set(sx * 0.36, 0.35, 0.15); br2.rotation.x = 0.5; g.add(br2); }
  const holm = box(0.96, 0.18, 0.2, wd, { tile: 1 }); holm.position.set(0, 1.42, -0.2); g.add(holm);
  const midb = box(0.96, 0.12, 0.16, wd, { tile: 1 }); midb.position.set(0, 0.78, -0.2); g.add(midb);
  const spindle = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.85, 14), iron); spindle.position.set(0, 1.05, -0.2); g.add(spindle);
  for (let i = 0; i < 7; i++) { const t = mesh(new THREE.TorusGeometry(0.037, 0.006, 6, 14), br); t.rotation.x = Math.PI / 2; t.position.set(0, 0.7 + i * 0.1, -0.2); g.add(t); }
  const platen = box(0.42, 0.05, 0.36, dk, { tile: 1 }); platen.position.set(0, 0.7, -0.2); g.add(platen); const pl2 = box(0.3, 0.015, 0.26, iron); pl2.position.set(0, 0.665, -0.2); g.add(pl2);
  // Bengel (Hebel) mit Griff
  const bengel = new THREE.Group(); bengel.position.set(0, 1.18, -0.2); const bar = mesh(new THREE.CylinderGeometry(0.02, 0.025, 0.95, 10), dk, { tile: 1 }); bar.rotation.z = Math.PI / 2; bengel.add(bar);
  const knob = mesh(new THREE.SphereGeometry(0.05, 12, 8), dk, { tile: 1 }); knob.position.x = 0.5; bengel.add(knob); const collar = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.08, 12), br); collar.position.x = 0.0; bengel.add(collar); bengel.rotation.y = -0.55; g.add(bengel);
  // Tisch/Karren mit Satz (Druckform)
  const bed = box(0.62, 0.07, 0.9, dk, { tile: 1 }); bed.position.set(0, 0.6, 0.1); g.add(bed);
  const rail = box(0.72, 0.05, 0.12, wd, { tile: 1 }); rail.position.set(0, 0.54, -0.1); g.add(rail); const rail2 = rail.clone(); rail2.position.z = 0.3; g.add(rail2);
  const [fc, fg] = cv(256, 320); fg.fillStyle = '#26262a'; fg.fillRect(0, 0, 256, 320); fg.fillStyle = '#9aa0a8'; const r = mulberry32(4); for (let y = 12; y < 310; y += 17) for (let x = 10; x < 246;) { const w = 8 + r() * 10; if (r() < 0.86) fg.fillRect(x, y, w, 11); x += w + 4; }
  const forme = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.03, 0.38), [M.plain(0x26262a, 0.4, 0.5), M.plain(0x26262a, 0.4, 0.5), new THREE.MeshStandardMaterial({ map: tex(fc), roughness: 0.35, metalness: 0.6 }), M.plain(0x26262a, 0.4, 0.5), M.plain(0x26262a, 0.4, 0.5), M.plain(0x26262a, 0.4, 0.5)]);
  forme.position.set(0, 0.665, 0.06); g.add(forme);
  // Papierstapel und Farbballen
  for (let i = 0; i < 9; i++) { const sh = box(0.3, 0.004, 0.4, M.plain(0xf3ead2, 0.95)); sh.position.set(0.52 + (i % 3) * 0.004, 0.62 + i * 0.0045, 0.35); sh.rotation.y = 0.08 * ((i % 4) - 1.5); g.add(sh); }
  const standT = box(0.4, 0.04, 0.5, wd, { tile: 1 }); standT.position.set(0.52, 0.59, 0.35); g.add(standT);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.04, 0.57, 0.04, wd, { tile: 1 }); l.position.set(0.52 + sx * 0.17, 0.285, 0.35 + sz * 0.2); g.add(l); }
  for (const sx of [-1, 1]) { const stick = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.16, 6), dk, { tile: 1 }); stick.position.set(-0.52 + sx * 0.06, 0.66, 0.38); g.add(stick); const ball = mesh(new THREE.SphereGeometry(0.05, 10, 8), M.plain(0x1a1210, 0.5)); ball.position.set(-0.52 + sx * 0.06, 0.76, 0.38); ball.scale.y = 0.7; g.add(ball); }
  const standB = box(0.4, 0.04, 0.5, wd, { tile: 1 }); standB.position.set(-0.52, 0.59, 0.35); g.add(standB);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const l = box(0.04, 0.57, 0.04, wd, { tile: 1 }); l.position.set(-0.52 + sx * 0.17, 0.285, 0.35 + sz * 0.2); g.add(l); }
  g.userData.size = { w: 1.3, d: 1.0, h: 1.55 };
  return g;
}

// Setzkasten (Schrägpult mit Fächern voller Lettern)
export function typeCase() {
  const g = new THREE.Group(); const wd = W(0x5a2f18, { planks: 2, seed: 6 });
  const [c, gg] = cv(512, 384); gg.fillStyle = '#4a2a16'; gg.fillRect(0, 0, 512, 384);
  const r = mulberry32(12), letters = 'abcdefghijklmnopqrstuvwxyzäöüß';
  for (let j = 0; j < 8; j++) for (let i = 0; i < 12; i++) { const x = 10 + i * 41, y = 10 + j * 46; gg.fillStyle = '#2a170c'; gg.fillRect(x, y, 37, 42); gg.fillStyle = '#9aa0a8'; for (let k = 0; k < 4; k++) gg.fillRect(x + 4 + (k % 2) * 15, y + 4 + Math.floor(k / 2) * 18, 10, 14); gg.fillStyle = '#d9d9d4'; gg.font = `bold 14px ${SERIF}`; gg.textAlign = 'center'; gg.fillText(letters[(i + j * 12 + Math.floor(r() * 3)) % letters.length], x + 18, y + 38); }
  const top = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.05, 0.54), [wd, wd, new THREE.MeshStandardMaterial({ map: tex(c), roughness: 0.6 }), wd, wd, wd]); top.rotation.x = 0.4; top.position.y = 0.88; g.add(top);
  for (const sx of [-1, 1]) { const leg = box(0.05, 0.84, 0.05, wd, { tile: 1 }); leg.position.set(sx * 0.33, 0.42, -0.1); g.add(leg); const leg2 = box(0.05, 0.62, 0.05, wd, { tile: 1 }); leg2.position.set(sx * 0.33, 0.31, 0.2); g.add(leg2); }
  const rail = box(0.7, 0.03, 0.04, wd, { tile: 1 }); rail.position.set(0, 0.45, 0.03); g.add(rail);
  g.userData.size = { w: 0.75, d: 0.6, h: 1.0 };
  return g;
}

// Seite aus der Gutenberg-Bibel (angedeutet): zwei Spalten Fraktur-Zeilen, rote Initiale; als Canvas für ein Bild
export function bibelSeiteCanvas() {
  const [c, g] = cv(480, 640), r = mulberry32(21);
  g.fillStyle = '#efdfae'; g.fillRect(0, 0, 480, 640); for (let i = 0; i < 700; i++) { g.fillStyle = r() < 0.5 ? 'rgba(120,80,25,.07)' : 'rgba(255,250,225,.12)'; g.fillRect(r() * 480, r() * 640, 2, 2); }
  for (const x0 of [48, 252]) { for (let y = 70; y < 590; y += 15) { g.fillStyle = '#231710'; let x = x0; const end = x0 + 178 - (y > 560 ? r() * 90 : 0); while (x < end) { const w = 4 + r() * 11; g.fillRect(x, y, w, 8); x += w + 3 + r() * 2; } } }
  g.fillStyle = '#a8302a'; g.font = `bold 62px ${SERIF}`; g.textAlign = 'left'; g.fillText('I', 52, 125);
  g.fillStyle = '#efdfae'; g.fillRect(52, 120, 40, 14); g.strokeStyle = '#3a6aa8'; g.lineWidth = 2; g.strokeRect(36, 56, 210, 540); g.strokeRect(240, 56, 210, 540);
  return c;
}
