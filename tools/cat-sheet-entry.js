// Kontaktbogen für Archimedes (Entwicklungswerkzeug): eigene kleine Szene ohne Bibliothek. Bauen: node build.mjs --dev --entry=tools/cat-sheet-entry.js --out=...
import * as THREE from 'three';
import { sitParts, HEAD_VARIANT } from '../src/world/ex/cat/art-sit.js';
import { walkParts, WALK_HEAD } from '../src/world/ex/cat/art-walk.js';
import { sleepParts, SLEEP_HEAD } from '../src/world/ex/cat/art-sleep.js';
import { buildPose } from '../src/world/ex/cat/rig.js';

const canvas = document.getElementById('gl');
document.getElementById('intro').hidden = true;
const W = +(new URLSearchParams(location.search).get('w') || 1400), H = +(new URLSearchParams(location.search).get('h') || 800);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setPixelRatio(1); renderer.setSize(W, H, false);
canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x5a3a26);
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x4a3524, 0.5));
const pl = new THREE.PointLight(0xffe2b0, 3.0, 0, 2); pl.position.set(0.5, 3.2, 1.2); scene.add(pl);
const t0 = performance.now();
const sit = buildPose(sitParts(), { name: 'sit' });
console.log('build sit ms', Math.round(performance.now() - t0));
const t1 = performance.now(); const walk = buildPose(walkParts(), { name: 'walk' }); console.log('build walk ms', Math.round(performance.now() - t1));
const t2 = performance.now(); const sleep = buildPose(sleepParts(), { name: 'sleep' }); console.log('build sleep ms', Math.round(performance.now() - t2));
walk.root.position.x = 2; sleep.root.position.x = 4;
const cam = new THREE.PerspectiveCamera(30, W / H, 0.05, 50);
window.__sheet = {
  THREE, scene, renderer, cam, sit, walk, sleep, HEAD_VARIANT, WALK_HEAD, SLEEP_HEAD,
  // Kontaktbogen: cols x rows Kacheln, je Kachel { setup(), cam: [x,y,z,tx,ty] }
  grid(cols, rows, list, bg = 0x5a3a26) {
    const tw = Math.floor(W / cols), th = Math.floor(H / rows); renderer.setScissorTest(true); scene.background = new THREE.Color(bg);
    list.forEach((it, i) => {
      const cx = i % cols, cy = Math.floor(i / cols), x = cx * tw, y = H - (cy + 1) * th;
      renderer.setViewport(x, y, tw, th); renderer.setScissor(x, y, tw, th);
      it.setup?.(); const c = it.cam || [0, 0.26, 1.4, 0, 0.23]; cam.position.set(c[0], c[1], c[2]); cam.lookAt(c[3], c[4], 0); cam.aspect = tw / th; cam.updateProjectionMatrix(); renderer.render(scene, cam);
    });
    renderer.setScissorTest(false);
  },
  shot(x, y, z, tx, ty) { cam.position.set(x, y, z); cam.lookAt(tx, ty, 0); cam.aspect = W / H; cam.updateProjectionMatrix(); renderer.render(scene, cam); },
};
scene.add(sit.root); scene.add(walk.root); scene.add(sleep.root);
window.__bookReady = true;
