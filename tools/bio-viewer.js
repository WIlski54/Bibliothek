// Entwicklungswerkzeug (nicht Teil der Bibliothek): zeigt einzelne Biologie-Objekte in einer Testszene.
// Bauen: node build.mjs --dev --entry=tools/bio-viewer.js --out=$SCRATCH/viewer.html ; Fotos: node tools/bio-view.mjs <objekt> <kamera> ...
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { buildHelix, buildDnaStand } from './../src/world/ex/biologie/dna.js';
import { pairDiagram, legendCanvas } from './../src/world/ex/biologie/dnaart.js';
import * as P from './../src/world/ex/biologie/plants.js';
import { buildTrexCase, buildIchthyo } from './../src/world/ex/biologie/trexcase.js';
import * as F from './../src/world/ex/biologie/fossils.js';
import * as MI from './../src/world/ex/biologie/microscope.js';
import * as SC from './../src/world/ex/biologie/scarab.js';
import { herbarSheet, HERBAR_ORDER, herbarCanvas } from './../src/world/ex/biologie/herbar.js';
import { treeCanvas } from './../src/world/ex/biologie/tree.js';
import { CHARTS, chartFrame } from './../src/world/ex/biologie/charts.js';
import { buildButterflyCase, butterflyFigure, BF_ORDER } from './../src/world/ex/biologie/butterflies.js';

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setPixelRatio(1);
const scene = new THREE.Scene(); scene.background = new THREE.Color(0xdfe9d6);
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x4a3524, 0.5));
const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.32;
const L1 = new THREE.PointLight(0xfff3dc, 30, 0, 2); L1.position.set(1.5, 4.2, 2.5); scene.add(L1);
const L2 = new THREE.PointLight(0xfff1d6, 8, 0, 2); L2.position.set(-3, 2.5, 1); scene.add(L2);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0xd8cdb0, roughness: 0.6 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const camera = new THREE.PerspectiveCamera(60, 1.6, 0.05, 80);
let cur = null;
const REG = {
  dna: () => { const g = new THREE.Group(); const st = buildDnaStand(); g.add(st); const h = buildHelix(); h.position.y = st.userData.top; g.add(h); g.userData.helix = h; return g; },
  trex: () => { const g = new THREE.Group(); const c = buildTrexCase(); c.position.y = 1.0; g.add(c); const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: 0xcfe0be })); wall.position.set(0, 2, -0.01); g.add(wall); return g; },
  ichthyo: () => { const g = new THREE.Group(); const c = buildIchthyo(); c.position.y = 1.5; g.add(c); return g; },
  bfcase: () => { const g = new THREE.Group(); const c = buildButterflyCase(); c.position.y = 1.0; g.add(c); const wall = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), new THREE.MeshStandardMaterial({ color: 0xcfe0be })); wall.position.set(0, 2, -0.01); g.add(wall); return g; },
  bf: () => { const g = new THREE.Group(); BF_ORDER.forEach((k, i) => { const f = butterflyFigure(k, 0.01); f.group.position.set((i % 3) * 0.7 - 0.7, 1.5 - Math.floor(i / 3) * 0.7, 0); g.add(f.group); }); return g; },
  ammo: () => { const g = new THREE.Group(); g.add(F.buildAmmonite()); const t = F.buildTrilobitePlate(); t.position.set(0.4, 0.015, 0); g.add(t); const f = F.buildFishPlate(); f.position.set(-0.45, 0.014, 0); g.add(f); const u = F.buildUrchin(); u.position.set(0.15, 0, 0.3); g.add(u); const sk = F.buildSharkTooth(); sk.position.set(-0.1, 0, 0.3); g.add(sk); return g; },
  micro: () => { const g = new THREE.Group(); const b = MI.buildWorkbench(); g.add(b); const m = MI.buildMicroscope(); m.position.set(0, 0.804, -0.1); g.add(m); g.add(MI.bench()); const st = MI.stool(); st.position.set(0, 0, 0.8); g.add(st); return g; },
  scarab: () => { const g = new THREE.Group(); const d = SC.buildScarabDome(); d.position.x = -0.3; g.add(d); const n = SC.buildNestOnBranch(); n.position.set(0.4, 0, 0); g.add(n); return g; },
  herbar: () => { const g = new THREE.Group(); HERBAR_ORDER.forEach((k, i) => { const f = herbarSheet(k); f.position.set((i % 3) * 0.7 - 0.7, 1.7 - Math.floor(i / 3) * 0.95, 0); g.add(f); }); return g; },
  tree: () => { const g = new THREE.Group(); const t = new THREE.CanvasTexture(treeCanvas()); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 2.6), new THREE.MeshBasicMaterial({ map: t })); m.position.y = 1.5; g.add(m); return g; },
  charts: () => { const g = new THREE.Group(); Object.keys(CHARTS).forEach((k, i) => { const f = chartFrame(k); f.position.set((i % 2) * 1.8 - 0.9, 2.4 - Math.floor(i / 2) * 1.3, 0); g.add(f); }); return g; },
  pair: () => { const g = new THREE.Group(); const t = new THREE.CanvasTexture(pairDiagram()); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4 * 430 / 960), new THREE.MeshBasicMaterial({ map: t })); m.position.y = 1.5; g.add(m); return g; },
  legend: () => { const g = new THREE.Group(); const t = new THREE.CanvasTexture(legendCanvas()); t.colorSpace = THREE.SRGBColorSpace; const m = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4 * 540 / 768), new THREE.MeshBasicMaterial({ map: t })); m.position.y = 1.5; g.add(m); return g; },
  beetle: () => { const g = new THREE.Group(); const b = SC.buildScarab({ s: 3 }); b.position.y = 0.5; g.add(b); return g; },
  plants: () => { const g = new THREE.Group(); const add = (o, x, z) => { o.position.set(x, 0, z); g.add(o); }; add(P.palmPlant({ h: 2.0 }), -1.6, 0); add(P.monsteraPlant({ h: 1.2 }), -0.6, 0); add(P.fernPlant({ h: 0.9 }), 0.4, 0); add(P.bushPlant({ h: 1.2 }), 1.4, 0); add(P.succulent({ r: 0.12 }), 2.1, 0); add(P.cactus({}), 2.5, 0); add(P.grassTuft({}), 3.0, 0); const hp = P.hangingPlant({}); hp.position.set(0, 2.4, 1.2); g.add(hp); return g; },
};
window.__v = {
  THREE, scene, camera, renderer, REG,
  dump(fn) { const c = fn(); return c.toDataURL('image/png'); },
  show(name, opts = {}) { if (cur) scene.remove(cur); cur = REG[name](opts); scene.add(cur); window.__cur = cur; return true; },
  shot(pos, look, { w = 900, h = 560, fov = 50, rot, clipY } = {}) {
    renderer.clippingPlanes = clipY !== undefined ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), clipY)] : [];
    renderer.setSize(w, h, false); camera.aspect = w / h; camera.fov = fov; camera.position.set(...pos); camera.lookAt(...look); camera.updateProjectionMatrix();
    if (rot !== undefined && cur?.userData.helix) cur.userData.helix.rotation.y = rot;
    renderer.render(scene, camera);
  },
};
document.getElementById('intro').hidden = true; window.__bookReady = true;
