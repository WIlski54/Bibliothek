// Biologie: großes Oberlicht (leuchtende Deckenfläche mit Sprossen) und Lichtfleck auf dem Boden.
import * as THREE from 'three';
import { M, mat, box } from '../../kit.js';
import { skyTex, lightPatchTex, beamTex, sunFloorTex, ironGreen, trimMat } from './style.js';

export function skylight({ w = 5.6, d = 7.6, h = 5.2, cols = 4, rows = 5 } = {}) {
  const g = new THREE.Group(), iron = ironGreen(), trim = trimMat();
  // leuchtende Glasfläche knapp unter der Decke
  const sky = mat('bio-skylight', () => new THREE.MeshBasicMaterial({ map: skyTex(), toneMapped: false }));
  const pane = new THREE.Mesh(new THREE.PlaneGeometry(w, d), sky); pane.rotation.x = Math.PI / 2; pane.position.y = h - 0.012; g.add(pane);
  // Laibung (Lichtschacht): hell, leicht selbstleuchtend
  const well = mat('bio-well', () => new THREE.MeshStandardMaterial({ color: 0xf2ecd8, emissive: 0xfff0cc, emissiveIntensity: 0.55, roughness: 0.9 }));
  const dep = 0.34, t = 0.06;
  for (const sx of [-1, 1]) { const b = box(t, dep, d + t * 2, well); b.position.set(sx * (w / 2 + t / 2), h - dep / 2, 0); g.add(b); }
  for (const sz of [-1, 1]) { const b = box(w, dep, t, well); b.position.set(0, h - dep / 2, sz * (d / 2 + t / 2)); g.add(b); }
  // Rahmen (Profil) um die Öffnung
  const fw = 0.22;
  for (const sx of [-1, 1]) { const b = box(fw, 0.09, d + 2 * (t + fw), trim); b.position.set(sx * (w / 2 + t + fw / 2), h - dep - 0.045, 0); g.add(b); const c2 = box(0.05, 0.14, d + 2 * (t + fw) + 0.1, trim); c2.position.set(sx * (w / 2 + t + fw + 0.02), h - dep - 0.07, 0); g.add(c2); }
  for (const sz of [-1, 1]) { const b = box(w + 2 * t, 0.09, fw, trim); b.position.set(0, h - dep - 0.045, sz * (d / 2 + t + fw / 2)); g.add(b); const c2 = box(w + 2 * (t + fw) + 0.1, 0.14, 0.05, trim); c2.position.set(0, h - dep - 0.07, sz * (d / 2 + t + fw + 0.02)); g.add(c2); }
  // Sprossen
  for (let i = 1; i < cols; i++) { const x = -w / 2 + (w * i) / cols; const b = box(0.045, 0.1, d, iron); b.position.set(x, h - 0.09, 0); g.add(b); const f = box(0.09, 0.02, d, iron); f.position.set(x, h - 0.145, 0); g.add(f); }
  for (let j = 1; j < rows; j++) { const z = -d / 2 + (d * j) / rows; const b = box(w, 0.1, 0.045, iron); b.position.set(0, h - 0.09, z); g.add(b); const f = box(w, 0.02, 0.09, iron); f.position.set(0, h - 0.145, z); g.add(f); }
  // messingfarbene Eckbeschläge
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const k = box(0.16, 0.03, 0.16, M.brass()); k.position.set(sx * (w / 2 - 0.08), h - 0.03, sz * (d / 2 - 0.08)); g.add(k); }
  g.userData.size = { w, d };
  return g;
}

// Lichtfleck der Sonne auf dem Boden (additiv, schräg versetzt) mit Schatten der Sprossen
export function lightPatch({ w = 5.6, d = 7.6, cols = 4, rows = 5, dx = 0.9, dz = 1.1, y = 0.02 } = {}) {
  const m = mat('bio-patch', () => new THREE.MeshBasicMaterial({ map: lightPatchTex(cols, rows), color: 0xfff0cf, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.2, depthWrite: false, toneMapped: false }));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.25, d * 1.25), m); p.rotation.x = -Math.PI / 2; p.position.set(dx, y, dz); p.renderOrder = 2; return p;
}
// weiche Lichtsäulen von der Decke (Tageslicht-Stimmung)
export function beams(list) {
  const g = new THREE.Group(), m = mat('bio-beam', () => new THREE.MeshBasicMaterial({ map: beamTex(), color: 0xfff4d8, blending: THREE.AdditiveBlending, transparent: true, opacity: 0.16, depthWrite: false, side: THREE.DoubleSide, toneMapped: false }));
  for (const { x, z, w = 1.6, h = 5.0, ry = 0, lean = 0.12 } of list) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, h), m); p.position.set(x, h / 2 + 0.1, z); p.rotation.set(0, ry, lean); p.renderOrder = 3; g.add(p); }
  return g;
}

// Sonnenfleck: Bodenplatte, die alles außerhalb des Fleckens leicht abdunkelt (Multiplikation, ohne Tonemapping)
export function sunFloor({ w = 10, d = 12, y = 0.02 } = {}) {
  const m = mat('bio-sunfloor', () => new THREE.MeshBasicMaterial({ map: sunFloorTex(), blending: THREE.MultiplyBlending, transparent: true, premultipliedAlpha: true, depthWrite: false, toneMapped: false }));
  const p = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.02, d - 0.02), m); p.rotation.x = -Math.PI / 2; p.position.y = y; p.renderOrder = 2; return p;
}
