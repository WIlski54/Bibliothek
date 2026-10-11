// Hohe Rundbogenfenster als leuchtende Flächen (Himmelsverlauf, Sprossen) mit Lichtschächten und Staubflocken. Nur Optik, keine echten Lichter.
import * as THREE from 'three';
import { M, box, mesh, placeWall } from '../kit.js';
import { mulberry32 } from '../../lib/util.js';

let skyMap = null;
function skyTex() {
  if (skyMap) return skyMap;
  const c = document.createElement('canvas'); c.width = 128; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#9cc8f0'); gr.addColorStop(0.6, '#d6ecfb'); gr.addColorStop(1, '#fff6dc'); g.fillStyle = gr; g.fillRect(0, 0, 128, 256);
  g.fillStyle = 'rgba(255,255,255,.75)'; for (const [x, y, r] of [[40, 70, 18], [58, 66, 24], [84, 74, 16], [70, 150, 20], [46, 156, 14]]) { g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.7, 0, 0, Math.PI * 2); g.fill(); }
  skyMap = new THREE.CanvasTexture(c); skyMap.colorSpace = THREE.SRGBColorSpace; return skyMap;
}
const beamMat = () => M.plain; // Platzhalter, Strahlenmaterial unten

const glassMats = new Map();
const glassMat = (glow) => { if (!glassMats.has(glow)) glassMats.set(glow, new THREE.MeshStandardMaterial({ map: skyTex(), color: 0x222222, emissive: 0xffffff, emissiveMap: skyTex(), emissiveIntensity: glow, roughness: 0.4 })); return glassMats.get(glow); };
export function archWindow({ w = 1.0, h = 2.3, frame = M.wood(0x4a2a18, { planks: 1 }), glow = 1.1 } = {}) {
  const g = new THREE.Group(); const r = w / 2, yt = h - r;
  const sh = new THREE.Shape(); sh.moveTo(-r, 0); sh.lineTo(r, 0); sh.lineTo(r, yt); sh.absarc(0, yt, r, 0, Math.PI, false); sh.lineTo(-r, 0);
  const glass = new THREE.Mesh(new THREE.ShapeGeometry(sh, 20), glassMat(glow));
  // UV der ShapeGeometry sind Koordinaten in Metern: auf 0..1 normieren
  const uv = glass.geometry.attributes.uv, p = glass.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, (p.getX(i) + r) / w, p.getY(i) / h);
  glass.position.z = 0.02; g.add(glass);
  // Rahmen und Sprossen
  const outer = new THREE.Shape(); const t = 0.07; outer.moveTo(-r - t, 0); outer.lineTo(r + t, 0); outer.lineTo(r + t, yt); outer.absarc(0, yt, r + t, 0, Math.PI, false); outer.lineTo(-r - t, 0);
  const hole = new THREE.Path(); hole.moveTo(-r, 0); hole.lineTo(-r, yt); hole.absarc(0, yt, r, Math.PI, 0, true); hole.lineTo(r, 0); hole.lineTo(-r, 0); outer.holes.push(hole);
  const fr = new THREE.Mesh(new THREE.ExtrudeGeometry(outer, { depth: 0.08, bevelEnabled: false, curveSegments: 20 }), frame); g.add(fr);
  const bar = (bw, bh, x, y) => { const b = box(bw, bh, 0.04, frame, { tile: 1 }); b.position.set(x, y, 0.04); g.add(b); };
  bar(0.035, h - 0.05, 0, (h - 0.05) / 2); bar(w, 0.035, 0, yt * 0.45); bar(w, 0.035, 0, yt * 0.9);
  const sill = box(w + 0.3, 0.07, 0.2, frame, { tile: 1 }); sill.position.set(0, -0.03, 0.08); g.add(sill);
  return g;
}

// Schräger Lichtschacht von einem Fenster zum Boden (additiv, ohne Tiefenschreiben). Winkel in Richtung des Raums.
const shaftTex = (() => { let t = null; return () => { if (t) return t; const c = document.createElement('canvas'); c.width = 8; c.height = 128; const g = c.getContext('2d'); const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,240,200,.55)'); gr.addColorStop(1, 'rgba(255,240,200,0)'); g.fillStyle = gr; g.fillRect(0, 0, 8, 128); t = new THREE.CanvasTexture(c); return t; }; })();
export function lightShaft({ w = 0.9, len = 5.5, color = 0xfff0c8, opacity = 0.22 } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, len), new THREE.MeshBasicMaterial({ map: shaftTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide }));
  m.geometry.translate(0, -len / 2, 0); m.renderOrder = 2; return m;
}

// Staubflocken in einem Quader (Points, langsam treibend). userData.dynamic setzen!
export function dust({ box: b = [10, 4, 8], n = 90, seed = 4, y0 = 0.8, color = 0xfff3d0, size = 0.035 } = {}) {
  const rnd = mulberry32(seed), pos = new Float32Array(n * 3), ph = [];
  for (let i = 0; i < n; i++) { pos[i * 3] = (rnd() - 0.5) * b[0]; pos[i * 3 + 1] = y0 + rnd() * b[1]; pos[i * 3 + 2] = (rnd() - 0.5) * b[2]; ph.push([rnd() * 6.28, 0.02 + rnd() * 0.05, rnd() * 6.28]); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const c = document.createElement('canvas'); c.width = c.height = 32; const g = c.getContext('2d'); const gr = g.createRadialGradient(16, 16, 0, 16, 16, 16); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 32, 32);
  const t = new THREE.CanvasTexture(c);
  const pts = new THREE.Points(geo, new THREE.PointsMaterial({ map: t, color, size, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending, sizeAttenuation: true }));
  pts.userData.dynamic = true; pts.frustumCulled = false;
  const base = pos.slice();
  pts.userData.tick = (time) => { const a = geo.attributes.position; for (let i = 0; i < n; i++) { const p = ph[i]; a.setXYZ(i, base[i * 3] + Math.sin(time * p[1] * 2 + p[0]) * 0.25, base[i * 3 + 1] + Math.sin(time * p[1] * 3 + p[2]) * 0.18, base[i * 3 + 2] + Math.cos(time * p[1] * 2 + p[2]) * 0.25); } a.needsUpdate = true; };
  return pts;
}
