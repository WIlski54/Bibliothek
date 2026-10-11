// Biologie: Messing-Mikroskop (3D), Arbeitstisch mit Zubehör.
import * as THREE from 'three';
import { M, mat, mesh, box, deskLamp } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF, glassMat } from './style.js';
import * as P from './plants.js';

const enamel = () => mat('mic-enamel', () => new THREE.MeshStandardMaterial({ color: 0x161a1a, roughness: 0.32, metalness: 0.55 }));
const chrome = () => mat('mic-chrome', () => new THREE.MeshStandardMaterial({ color: 0xdfe6ea, roughness: 0.12, metalness: 1 }));
const lensGlass = () => mat('mic-lens', () => new THREE.MeshStandardMaterial({ color: 0x9fc6d8, roughness: 0.05, metalness: 0.3, emissive: 0x203040, emissiveIntensity: 0.4 }));

// Mikroskop, Blick von +z (Okular oben, Tubus senkrecht, Stativ nach hinten). Höhe ca. 0.5 m.
export function buildMicroscope({ s = 1.3 } = {}) {
  const g = new THREE.Group(), brass = M.brass(), black = enamel();
  // Fuß: Hufeisen
  const sh = new THREE.Shape(); const fw = 0.085, fd = 0.085; sh.moveTo(-fw, -fd); sh.lineTo(fw, -fd); sh.lineTo(fw, fd - 0.03); sh.quadraticCurveTo(fw, fd, fw - 0.03, fd); sh.lineTo(0.035, fd); sh.absarc(0, fd - 0.03, 0.035, 0, Math.PI, false); sh.lineTo(-fw + 0.03, fd); sh.quadraticCurveTo(-fw, fd, -fw, fd - 0.03); sh.closePath();
  const foot = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.022, bevelEnabled: true, bevelSize: 0.006, bevelThickness: 0.006, bevelSegments: 2, curveSegments: 8 }), black); foot.rotation.x = Math.PI / 2; foot.position.set(0, 0.028, -0.01); g.add(foot);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.0, 0.01, 4, 4), brass); // (leer, Platzhalter für Struktur)
  // Säule und Gelenk
  const pillar = mesh(new THREE.CylinderGeometry(0.017, 0.022, 0.1, 16), brass); pillar.position.set(0, 0.075, -0.05); g.add(pillar);
  const hinge = mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.085, 16), brass); hinge.rotation.z = Math.PI / 2; hinge.position.set(0, 0.13, -0.05); g.add(hinge);
  for (const sx of [-1, 1]) { const kn = mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 12), brass); kn.rotation.z = Math.PI / 2; kn.position.set(sx * 0.05, 0.13, -0.05); g.add(kn); }
  // Arm (gebogener Griff)
  const arm = new THREE.CatmullRomCurve3([new THREE.Vector3(0, 0.13, -0.05), new THREE.Vector3(0, 0.2, -0.092), new THREE.Vector3(0, 0.29, -0.092), new THREE.Vector3(0, 0.36, -0.06), new THREE.Vector3(0, 0.385, -0.01)]);
  const armM = new THREE.Mesh(new THREE.TubeGeometry(arm, 32, 0.016, 10), brass); g.add(armM);
  // Tubus mit Okular und Objektiven
  const tube = mesh(new THREE.CylinderGeometry(0.021, 0.021, 0.2, 20), brass); tube.position.set(0, 0.29, 0.0); g.add(tube);
  const collar = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 20), brass); collar.position.set(0, 0.36, 0.0); g.add(collar);
  const eye = mesh(new THREE.CylinderGeometry(0.0125, 0.016, 0.075, 16), black); eye.position.set(0, 0.425, 0); g.add(eye);
  const eyeRing = mesh(new THREE.TorusGeometry(0.0128, 0.003, 6, 16), brass); eyeRing.rotation.x = Math.PI / 2; eyeRing.position.set(0, 0.46, 0); g.add(eyeRing);
  const lens = mesh(new THREE.CircleGeometry(0.011, 14), lensGlass()); lens.rotation.x = -Math.PI / 2; lens.position.set(0, 0.4625, 0); g.add(lens);
  const nose = mesh(new THREE.CylinderGeometry(0.036, 0.026, 0.016, 20), brass); nose.position.set(0, 0.2, 0); g.add(nose);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU + 0.5, ob = mesh(new THREE.CylinderGeometry(0.007, 0.0095, 0.05 + i * 0.01, 12), i === 1 ? black : brass); ob.position.set(Math.sin(a) * 0.023, 0.165 - i * 0.004, Math.cos(a) * 0.023); ob.rotation.set(Math.cos(a) * 0.25, 0, -Math.sin(a) * 0.25); g.add(ob); const tip = mesh(new THREE.CylinderGeometry(0.0055, 0.0055, 0.006, 10), chrome()); tip.position.set(Math.sin(a) * 0.027, 0.138 - i * 0.008, Math.cos(a) * 0.027); g.add(tip); }
  // Objekttisch mit Klammern, Objektträger, Beleuchtung
  const stageArm = box(0.03, 0.02, 0.07, brass, { tile: 1 }); stageArm.position.set(0, 0.1, -0.06); g.add(stageArm);
  const stage = box(0.14, 0.012, 0.12, black); stage.position.set(0, 0.108, 0.002); g.add(stage);
  const stageEdge = box(0.146, 0.003, 0.126, brass); stageEdge.position.set(0, 0.1015, 0.002); g.add(stageEdge);
  for (const sx of [-1, 1]) { const cl = box(0.032, 0.002, 0.006, brass); cl.position.set(sx * 0.03, 0.1175, 0.03); cl.rotation.y = sx * 0.2; g.add(cl); const cp = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.006, 8), brass); cp.position.set(sx * 0.05, 0.1165, 0.036); g.add(cp); }
  const slide = new THREE.Mesh(new THREE.BoxGeometry(0.076, 0.0016, 0.026), mat('mic-slide', () => new THREE.MeshStandardMaterial({ color: 0xcfe8ee, transparent: true, opacity: 0.55, roughness: 0.05 }))); slide.position.set(0, 0.1218, 0.004); slide.rotation.y = 0.12; g.add(slide);
  const lab = box(0.016, 0.0018, 0.022, M.plain(0xf3ead2, 0.8)); lab.position.set(-0.026, 0.1223, 0.007); lab.rotation.y = 0.12; g.add(lab);
  const spec = mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.0018, 10), M.plain(0xc86a6a, 0.6)); spec.position.set(0.006, 0.1226, 0.003); g.add(spec);
  const cond = mesh(new THREE.CylinderGeometry(0.016, 0.02, 0.028, 16), brass); cond.position.set(0, 0.082, 0.002); g.add(cond);
  // Spiegel
  const mArm = mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 8), brass); mArm.position.set(0, 0.055, -0.0); mArm.rotation.x = 0; g.add(mArm);
  const mir = mesh(new THREE.CylinderGeometry(0.036, 0.036, 0.006, 24), brass); mir.rotation.x = -0.3; mir.position.set(0, 0.052, 0.0); g.add(mir);
  const mirS = mesh(new THREE.CircleGeometry(0.031, 20), chrome()); mirS.rotation.x = -Math.PI / 2 - 0.3; mirS.position.set(0.0, 0.0555, 0.001); g.add(mirS);
  // Triebräder (grob) und Feintrieb
  for (const sx of [-1, 1]) {
    const kn = mesh(new THREE.CylinderGeometry(0.028, 0.028, 0.016, 24), brass); kn.rotation.z = Math.PI / 2; kn.position.set(sx * 0.052, 0.215, -0.092); g.add(kn);
    const kr = mesh(new THREE.TorusGeometry(0.028, 0.0035, 6, 24), black); kr.rotation.y = Math.PI / 2; kr.position.set(sx * 0.052, 0.215, -0.092); g.add(kr);
    const fk = mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 16), black); fk.rotation.z = Math.PI / 2; fk.position.set(sx * 0.06, 0.288, -0.092); g.add(fk);
  }
  const hub = mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.11, 10), brass); hub.rotation.z = Math.PI / 2; hub.position.set(0, 0.215, -0.092); g.add(hub);
  g.scale.setScalar(s); g.userData.height = 0.47 * s; return g;
}

// ---------------------------------------------------------------- Arbeitstisch
function notebookTex() {
  return memo('mic-notebook', () => {
    const [c, g] = canvas(512, 360), rnd = mulberry32(5); g.fillStyle = '#f1e8cf'; g.fillRect(0, 0, 512, 360);
    g.strokeStyle = 'rgba(60,50,40,.25)'; g.lineWidth = 1.5; for (let y = 44; y < 340; y += 24) { g.beginPath(); g.moveTo(268, y); g.lineTo(496, y); g.stroke(); }
    g.fillStyle = 'rgba(90,60,30,.35)'; g.fillRect(254, 0, 4, 360);
    // linke Seite: gezeichnete Zellen (Zwiebelhaut): Reihen länglicher Zellen mit Kern
    g.strokeStyle = '#3a3a48'; g.lineWidth = 2;
    for (let r = 0; r < 6; r++) for (let q = 0; q < 5; q++) { const x = 34 + q * 42 + (r % 2) * 20 + (rnd() - 0.5) * 3, y = 70 + r * 36 + (rnd() - 0.5) * 3; g.beginPath(); g.roundRect(x, y, 40, 30, 5); g.stroke(); g.fillStyle = 'rgba(120,150,200,.35)'; g.beginPath(); g.arc(x + 20, y + 15, 5, 0, TAU); g.fill(); g.stroke(); }
    g.fillStyle = '#3a3a48'; g.font = `italic 22px ${SERIF}`; g.textAlign = 'left'; g.fillText('Zwiebelhaut, 100fach', 30, 40);
    g.font = `italic 19px ${SERIF}`; g.fillStyle = '#4a3a30'; ['Jede Kammer ist eine Zelle.', 'Der dunkle Punkt: der Zellkern.', 'Pflanzenzellen haben eine feste', 'Wand. Alles eng gepackt!'].forEach((t, i) => g.fillText(t, 276, 62 + i * 24));
    g.strokeStyle = '#3a3a48'; g.lineWidth = 1.6; g.beginPath(); g.moveTo(276, 175); g.lineTo(300, 175); g.stroke(); g.fillText('= 0,1 mm', 306, 180);
    return texOf(c);
  });
}
export function buildWorkbench({ len = 1.9, dep = 0.8, h = 0.8 } = {}) {
  const g = new THREE.Group(), wood = M.wood(0xb98a55, { planks: 3, seed: 6 }), dark = M.wood(0x6a4326, { planks: 2, seed: 4 }), brass = M.brass();
  const top = box(len, 0.05, dep, wood, { tile: 1 }); top.position.y = h - 0.025; g.add(top);
  const edge = box(len + 0.04, 0.02, dep + 0.04, dark, { tile: 1 }); edge.position.y = h - 0.06; g.add(edge);
  const inlay = box(len - 0.3, 0.004, dep - 0.2, M.fabric(0x2f5a40, 1)); inlay.position.y = h + 0.001; g.add(inlay);
  const inEdge = box(len - 0.26, 0.003, dep - 0.16, brass); inEdge.position.y = h - 0.001; g.add(inEdge);
  const apron = box(len - 0.1, 0.12, dep - 0.1, dark, { tile: 1 }); apron.position.y = h - 0.13; g.add(apron);
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const l = mesh(new THREE.CylinderGeometry(0.035, 0.045, h - 0.12, 12), dark, { tile: 1 }); l.position.set(x * (len / 2 - 0.09), (h - 0.12) / 2, z * (dep / 2 - 0.09)); g.add(l); const f = mesh(new THREE.CylinderGeometry(0.055, 0.05, 0.03, 12), brass); f.position.set(x * (len / 2 - 0.09), 0.015, z * (dep / 2 - 0.09)); g.add(f); }
  const shelf = box(len - 0.2, 0.03, dep - 0.2, dark, { tile: 1 }); shelf.position.y = 0.2; g.add(shelf);
  // Schubladengriffe
  for (const x of [-0.4, 0.4]) { const hd = mesh(new THREE.SphereGeometry(0.018, 10, 8), brass); hd.position.set(x, h - 0.13, dep / 2 - 0.045); g.add(hd); }
  g.userData.top = h + 0.004; return g;
}
// Zubehör auf dem Tisch (Gläser, Dias, Notizbuch, Lupe, Petrischalen, Lampe, Pflanze). Rückgabe: Gruppe, lokale Koordinaten: x entlang des Tisches, z Tiefe
export function bench(items = {}) {
  const g = new THREE.Group(), y0 = 0.804, brass = M.brass(), glass = glassMat();
  // Glasdosen mit Pflanzenteilen
  const jar = (x, z, r, h, content) => { const j = new THREE.Group(); const body = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 20, 1, true), glass); body.position.y = h / 2; body.renderOrder = 4; j.add(body); const bot = mesh(new THREE.CylinderGeometry(r, r, 0.004, 20), mat('jar-bot', () => new THREE.MeshStandardMaterial({ color: 0xcfe6ea, transparent: true, opacity: 0.35, roughness: 0.1 }))); bot.position.y = 0.002; j.add(bot); const lid = mesh(new THREE.CylinderGeometry(r + 0.004, r + 0.004, 0.02, 20), brass); lid.position.y = h + 0.01; j.add(lid); if (content) j.add(content); j.position.set(x, y0, z); g.add(j); return j; };
  { const sp = P.fernPlant({ h: 0.2, seed: 12, fronds: 6, potR: 0.004 }); sp.scale.setScalar(0.5); sp.children.forEach((c, i) => { if (i < 3) c.visible = false; }); sp.position.y = -0.005; jar(-0.7, -0.08, 0.06, 0.15, sp); }
  jar(-0.55, 0.05, 0.045, 0.1, (() => { const c = new THREE.Group(); const m = mesh(new THREE.SphereGeometry(0.03, 12, 10), M.plain(0xc9d98a, 0.7)); m.position.y = 0.032; c.add(m); const m2 = mesh(new THREE.SphereGeometry(0.02, 10, 8), M.plain(0xb85a3a, 0.7)); m2.position.set(0.02, 0.02, 0.01); c.add(m2); return c; })());
  // Dia-Kästchen
  { const bx = box(0.16, 0.05, 0.09, M.wood(0x6a4326, { planks: 1 }), { tile: 1 }); bx.position.set(0.5, y0 + 0.025, 0.12); bx.rotation.y = 0.2; g.add(bx); const lid = box(0.164, 0.012, 0.094, brass); lid.position.set(0.5, y0 + 0.056, 0.12); lid.rotation.y = 0.2; g.add(lid); for (let i = 0; i < 4; i++) { const sl = box(0.076, 0.0016, 0.026, M.plain(0xcfe8ee, 0.2)); sl.position.set(0.55 + i * 0.002, y0 + 0.002 + i * 0.002, -0.07 + i * 0.03); sl.rotation.y = 0.25 + i * 0.15; g.add(sl); } }
  // Notizbuch (aufgeschlagen, mit Zeichnung)
  { const nb = new THREE.Group(); const cv = box(0.4, 0.014, 0.28, M.plain(0x2f5a40, 0.7)); cv.position.y = 0.007; nb.add(cv); const pg = new THREE.Mesh(new THREE.PlaneGeometry(0.38, 0.265), new THREE.MeshStandardMaterial({ map: notebookTex(), roughness: 0.95 })); pg.rotation.x = -Math.PI / 2; pg.position.y = 0.0145; nb.add(pg); for (const sx of [-1, 1]) { const pgs = box(0.188, 0.012, 0.262, M.plain(0xf0e6cc, 0.95)); pgs.position.set(sx * 0.098, 0.016 - 0.002, 0); pgs.rotation.z = -sx * 0.025; nb.add(pgs); } nb.children[2].visible = false; nb.children[3].visible = false; nb.position.set(0.1, y0, 0.12); nb.rotation.y = -0.12; g.add(nb); }
  // Lupe
  { const l = new THREE.Group(); const ring = mesh(new THREE.TorusGeometry(0.05, 0.007, 8, 28), brass); ring.rotation.x = -Math.PI / 2; l.add(ring); const gl = new THREE.Mesh(new THREE.CircleGeometry(0.05, 24), mat('lupe', () => new THREE.MeshStandardMaterial({ color: 0xcfe6ea, transparent: true, opacity: 0.25, roughness: 0.03 }))); gl.rotation.x = -Math.PI / 2; l.add(gl); const hd = mesh(new THREE.CylinderGeometry(0.01, 0.012, 0.13, 10), M.wood(0x4a2a18, { planks: 1 })); hd.rotation.z = Math.PI / 2; hd.rotation.y = 0; hd.position.set(0.115, 0, 0); l.add(hd); l.position.set(0.32, y0 + 0.01, -0.12); l.rotation.y = 0.5; g.add(l); }
  // Petrischalen
  for (const [x, z] of [[-0.3, 0.14], [-0.2, 0.2]]) { const p = new THREE.Group(); const b = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.012, 24), glass); b.position.y = 0.006; b.renderOrder = 4; p.add(b); const agar = mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.005, 24), M.plain(0xe8d890, 0.4)); agar.position.y = 0.004; p.add(agar); for (let i = 0; i < 4; i++) { const col = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.002, 8), M.plain(0xf8f0e0, 0.5)); col.position.set((i - 1.5) * 0.012, 0.007, Math.sin(i * 2) * 0.014); p.add(col); } p.position.set(x, y0, z); g.add(p); }
  // Tischlampe
  { const lp = deskLamp({ light: false }); lp.position.set(0.75, y0, -0.18); lp.rotation.y = -0.5; lp.scale.setScalar(1.0); g.add(lp); }
  // Pflanze im Topf
  { const pl = P.succulent({ r: 0.07, seed: 3, kind: 'white' }); pl.position.set(-0.85, y0, 0.2); g.add(pl); }
  // Schreibfeder im Tintenfass
  { const ink = mesh(new THREE.CylinderGeometry(0.03, 0.035, 0.04, 14), M.plain(0x1a1a24, 0.2, 0.3)); ink.position.set(0.28, y0 + 0.02, 0.2); g.add(ink); const pen = mesh(new THREE.CylinderGeometry(0.002, 0.004, 0.2, 6), M.plain(0xf3ead2, 0.8)); pen.position.set(0.31, y0 + 0.1, 0.2); pen.rotation.set(0.25, 0, -0.25); g.add(pen); }
  return g;
}
export function stool({ h = 0.5 } = {}) {
  const g = new THREE.Group(), wood = M.wood(0x8a5a30, { planks: 2, seed: 3 }), brass = M.brass();
  const seat = mesh(new THREE.CylinderGeometry(0.2, 0.19, 0.05, 24), wood, { tile: 0.6 }); seat.position.y = h; g.add(seat);
  for (let i = 0; i < 3; i++) { const a = (i / 3) * TAU, l = mesh(new THREE.CylinderGeometry(0.018, 0.026, h, 8), wood, { tile: 1 }); l.position.set(Math.cos(a) * 0.15, h / 2, Math.sin(a) * 0.15); l.rotation.set(Math.sin(a) * 0.14, 0, -Math.cos(a) * 0.14); g.add(l); }
  const ring = mesh(new THREE.TorusGeometry(0.15, 0.01, 6, 24), brass); ring.rotation.x = Math.PI / 2; ring.position.y = h * 0.35; g.add(ring); return g;
}
