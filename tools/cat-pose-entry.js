// Posen-Bogen für Archimedes (Entwicklungswerkzeug): die echte Figur in einer kleinen Szene. Bauen: node build.mjs --dev --entry=tools/cat-pose-entry.js --out=...
import * as THREE from 'three';
import { Archimedes } from '../src/world/ex/cat/archimedes.js';

const canvas = document.getElementById('gl');
document.getElementById('intro').hidden = true;
const q = new URLSearchParams(location.search), W = +(q.get('w') || 1400), H = +(q.get('h') || 800);
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.setPixelRatio(1); renderer.setSize(W, H, false); canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
const scene = new THREE.Scene(); scene.background = new THREE.Color(0x5a3a26);
scene.add(new THREE.HemisphereLight(0xfff0dc, 0x4a3524, 0.5));
const pl = new THREE.PointLight(0xffe2b0, 22, 0, 2); pl.position.set(0.5, 3.6, 1.8); scene.add(pl);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(20, 20), new THREE.MeshStandardMaterial({ color: 0x7a4a2a, roughness: 0.8 })); floor.rotation.x = -Math.PI / 2; scene.add(floor);
const camera = new THREE.PerspectiveCamera(30, W / H, 0.05, 50);
const rig = { camera, calm: false, stations: new Map(), room: 'foyer', aspect: W / H, hfov: 1.5 };
const said = [];
const cat = new Archimedes({ rig, world: { rooms: {}, roomsOrder: [] }, ui: { say: (t, o) => said.push([t, o]) }, books: [] });
scene.add(cat.group);
for (const n of ['sit', 'walk', 'sleep']) cat.getPose(n);
window.__t = {
  THREE, cat, scene, renderer, camera, said, rig,
  step(dt, n = 1) { for (let i = 0; i < n; i++) cat.update(dt); },
  // Kachelbogen: list[i] = { setup(), cam:[x,y,z,tx,ty,tz] }
  grid(cols, rows, list) {
    const tw = Math.floor(W / cols), th = Math.floor(H / rows); renderer.setScissorTest(true);
    list.forEach((it, i) => {
      const cx = i % cols, cy = Math.floor(i / cols), x = cx * tw, y = H - (cy + 1) * th; it.setup?.();
      let c = it.cam || [0, 0.3, 1.5, 0, 0.22, 0]; if (typeof c === 'function') c = c(); camera.position.set(c[0], c[1], c[2]); camera.lookAt(c[3], c[4], c[5] || 0); camera.aspect = tw / th; camera.updateProjectionMatrix(); cat.update(0.0001);
      renderer.setViewport(x, y, tw, th); renderer.setScissor(x, y, tw, th); renderer.render(scene, camera);
    });
    renderer.setScissorTest(false);
  },
};
window.__bookReady = true;
