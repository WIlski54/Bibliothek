// Biologie: Skarabäus (Heiliger Pillendreher) unter einer Glasglocke, mit Mistkugel auf Sand; Vogelnest mit Eiern auf einem Ast.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, mat, mesh, box } from '../../kit.js';
import { fbm, mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, woodDark } from './style.js';
import { Leaves } from './plants.js';

const shell = () => mat('scarab-shell', () => new THREE.MeshStandardMaterial({ color: 0x15201d, roughness: 0.26, metalness: 0.6 }));
const legMat = () => mat('scarab-leg', () => new THREE.MeshStandardMaterial({ color: 0x241a14, roughness: 0.45, metalness: 0.3 }));

// Käfer, Blick von +x (er läuft nach +x). Länge etwa 0.14 m (vergrößert).
export function buildScarab({ s = 1 } = {}) {
  const g = new THREE.Group(), sh = shell(), lg = legMat();
  const ell = (rx, ry, rz, x, y, z, m = sh) => { const e = new THREE.Mesh(new THREE.SphereGeometry(1, 22, 14), m); e.scale.set(rx, ry, rz); e.position.set(x, y, z); return e; };
  g.add(ell(0.052, 0.03, 0.034, -0.03, 0.05, 0));                                   // Flügeldecken (länglich)
  { const gr = box(0.1, 0.002, 0.002, lg); gr.position.set(-0.03, 0.082, 0); g.add(gr); for (const sz of [-1, 1]) for (const o of [0.012, 0.024]) { const l2 = box(0.085, 0.0015, 0.0015, lg); l2.position.set(-0.03, 0.078, sz * o); l2.rotation.z = 0.0; g.add(l2); } }
  g.add(ell(0.032, 0.024, 0.036, 0.028, 0.05, 0));                                  // Halsschild
  g.add(ell(0.02, 0.014, 0.026, 0.062, 0.043, 0));                                  // Kopf
  // Kopfschild mit sechs Zähnen (halbrund, gezackt)
  { const shp = new THREE.Shape(); const n = 6, R = 0.028; shp.moveTo(0, -R); for (let i = 0; i <= n; i++) { const a = -Math.PI / 2 + (i / n) * Math.PI; shp.lineTo(Math.cos(a - 0.0) * R * 0.78 * 0 + 0, 0); } }
  { const shp = new THREE.Shape(), R = 0.03; shp.moveTo(0, -R); for (let i = 0; i < 6; i++) { const a0 = -Math.PI / 2 + (i / 6) * Math.PI, a1 = -Math.PI / 2 + ((i + 1) / 6) * Math.PI, am = (a0 + a1) / 2; shp.lineTo(Math.cos(a0 + 0.0) * R * 0.86, Math.sin(a0) * R * 0.86 * 1.0); shp.lineTo(Math.cos(am) * R * 1.12, Math.sin(am) * R * 1.12); } shp.lineTo(0, R); shp.closePath();
    const geo = new THREE.ExtrudeGeometry(shp, { depth: 0.008, bevelEnabled: true, bevelSize: 0.002, bevelThickness: 0.002, bevelSegments: 1, curveSegments: 4 }); geo.rotateX(Math.PI / 2); geo.rotateY(Math.PI / 2); geo.rotateX(Math.PI); geo.scale(1, 1, 1);
    const cl = new THREE.Mesh(geo, sh); cl.rotation.set(0, 0, 0); cl.position.set(0.078, 0.04, 0); cl.scale.set(0.8, 1, 1); g.add(cl); }
  for (const sz of [-1, 1]) { g.add(ell(0.006, 0.006, 0.006, 0.06, 0.056, sz * 0.02, lg)); }
  // Fühler mit Keule
  for (const sz of [-1, 1]) { const a = mesh(new THREE.CylinderGeometry(0.0015, 0.0015, 0.04, 5), lg); a.position.set(0.085, 0.055, sz * 0.022); a.rotation.set(sz * 0.9, 0, 0.5); g.add(a); for (let i = 0; i < 3; i++) { const p = box(0.002, 0.012, 0.007, lg); p.position.set(0.098 + i * 0.001, 0.067, sz * (0.034 + i * 0.0035)); p.rotation.set(sz * 0.5, 0, 0.3); g.add(p); } }
  // Beine: Vorderbeine mit gezähnten Schienen, mittlere, lange Hinterbeine
  const leg = (x, sz, spread, len, flat) => { const p0 = new THREE.Vector3(x, 0.034, sz * 0.026), p1 = new THREE.Vector3(x + spread * 0.5, 0.042, sz * (0.062 + len * 0.3)), p2 = new THREE.Vector3(x + spread, 0.004, sz * (0.07 + len)); const seg = (a, b, r) => { const d = b.clone().sub(a), c = mesh(new THREE.CylinderGeometry(r, r * 0.8, d.length(), 6), lg); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(c); }; seg(p0, p1, 0.0045); if (flat) { const t = box(0.014, 0.006, 0.04 + len * 0.3, lg); t.position.copy(p1).lerp(p2, 0.5); t.lookAt(p2.clone().setY(t.position.y)); g.add(t); for (let i = 0; i < 3; i++) { const tt = box(0.004, 0.004, 0.008, lg); tt.position.copy(p1).lerp(p2, 0.3 + i * 0.25); tt.position.x += 0.008; g.add(tt); } } else seg(p1, p2, 0.0035); const ft = box(0.006, 0.003, 0.012, lg); ft.position.copy(p2); g.add(ft); };
  for (const sz of [-1, 1]) { leg(0.036, sz, 0.045, 0.02, true); leg(0.0, sz, 0.0, 0.03, false); leg(-0.05, sz, -0.05, 0.04, false); }
  g.scale.setScalar(s); return g;
}
export function dungBall({ r = 0.05, seed = 4 } = {}) {
  const geo = new THREE.SphereGeometry(r, 28, 20), p = geo.attributes.position, rnd = mulberry32(seed); for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), z = p.getZ(i), k = 1 + fbm(x * 30 + seed, y * 30 + z * 17, 3) * 0.2; p.setXYZ(i, x * k, y * k, z * k); } geo.computeVertexNormals();
  return new THREE.Mesh(geo, mat('dung', () => new THREE.MeshStandardMaterial({ color: 0x4a3322, roughness: 0.95 })));
}
const sandTex = () => memo('sand', () => { const [c, g] = canvas(256, 256), rnd = mulberry32(2); const img = g.createImageData(256, 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = 0.9 + fbm(x * 0.05, y * 0.05, 3) * 0.4 + (rnd() - 0.5) * 0.12, i = (y * 256 + x) * 4; img.data[i] = 214 * v; img.data[i + 1] = 188 * v; img.data[i + 2] = 140 * v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); return texOf(c, { wrap: true }); });

// Glasglocke mit Käfer, Mistkugel und Sand auf rundem Holzfuß. Höhe etwa 0.36 m.
export function buildScarabDome() {
  const g = new THREE.Group(), brass = M.brass(), wood = woodDark();
  const base = mesh(new THREE.CylinderGeometry(0.19, 0.2, 0.04, 36), wood, { tile: 0.6 }); base.position.y = 0.02; g.add(base);
  const ring = mesh(new THREE.TorusGeometry(0.17, 0.008, 8, 40), brass); ring.rotation.x = Math.PI / 2; ring.position.y = 0.043; g.add(ring);
  const sand = mesh(new THREE.CylinderGeometry(0.165, 0.165, 0.014, 36), mat('sand-m', () => new THREE.MeshStandardMaterial({ map: sandTex(), roughness: 1 })), { tile: 0.3 }); sand.position.y = 0.047; g.add(sand);
  for (const [x, z, r] of [[-0.09, 0.07, 0.012], [0.1, -0.06, 0.009], [-0.04, -0.1, 0.008], [0.05, 0.1, 0.01]]) { const st = mesh(new THREE.SphereGeometry(r, 8, 6), M.plain(0x8a7a62, 0.9)); st.scale.y = 0.6; st.position.set(x, 0.056, z); g.add(st); }
  const beetle = buildScarab(); beetle.position.set(-0.055, 0.054, 0.0); beetle.rotation.y = 0.15; g.add(beetle);
  const ball = dungBall({ r: 0.052 }); ball.position.set(0.1, 0.1, 0.01); g.add(ball);
  // Glocke (Drehkörper)
  const prof = [[0.17, 0], [0.17, 0.04], [0.168, 0.14], [0.155, 0.22], [0.12, 0.29], [0.07, 0.325], [0.025, 0.34], [0, 0.342]].map(([r, y]) => new THREE.Vector2(r, y));
  const gl = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), mat('cloche', () => new THREE.MeshStandardMaterial({ color: 0xe4f4f8, transparent: true, opacity: 0.22, roughness: 0.04, metalness: 0, depthWrite: false, side: THREE.DoubleSide }))); gl.position.y = 0.045; gl.renderOrder = 4; g.add(gl);
  const knob = mesh(new THREE.SphereGeometry(0.02, 14, 10), brass); knob.position.y = 0.045 + 0.355; g.add(knob);
  const ring2 = mesh(new THREE.TorusGeometry(0.17, 0.006, 6, 40), brass); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.05; g.add(ring2);
  g.userData.height = 0.42; return g;
}

// ---------------------------------------------------------------- Vogelnest (Amsel: Gras und Halme, innen Mulde) mit vier Eiern auf einem Ast
function eggTex() { return memo('egg', () => { const [c, g] = canvas(256, 256), rnd = mulberry32(8); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, '#9fd6cf'); gr.addColorStop(1, '#78bdb6'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256); for (let i = 0; i < 480; i++) { const x = rnd() * 256, y = rnd() * 256, r = 1 + rnd() * 3.4, dense = 0.4 + 0.6 * Math.max(0, Math.sin((y / 256) * Math.PI) * 0.4 + 0.6 * (x / 256)); if (rnd() > dense) continue; g.fillStyle = `rgba(${130 + rnd() * 40 | 0},${70 + rnd() * 30 | 0},${40 + rnd() * 20 | 0},${0.35 + rnd() * 0.5})`; g.beginPath(); g.ellipse(x, y, r, r * (0.6 + rnd() * 0.6), rnd() * 3, 0, TAU); g.fill(); } return texOf(c, { wrap: true }); }); }
export function egg({ r = 0.0155 } = {}) { const pts = []; for (let i = 0; i <= 24; i++) { const t = (i / 24) * Math.PI, y = -Math.cos(t) * r * 1.42, x = Math.sin(t) * r * (1 - 0.14 * Math.cos(t)) ; pts.push(new THREE.Vector2(x, y)); } return new THREE.Mesh(new THREE.LatheGeometry(pts, 20), mat('egg-m', () => new THREE.MeshStandardMaterial({ map: eggTex(), roughness: 0.4 }))); }
export function buildNest() {
  const g = new THREE.Group(), rnd = mulberry32(11), twigs = [], cols = [];
  const tmp = new THREE.Color(), pal = [0x8a6a3c, 0x6a4a28, 0xa88a52, 0x7a5c34, 0x9a7a44];
  for (let i = 0; i < 230; i++) { // Halme in Schichten: Schalenform
    const layer = rnd(), ph = rnd() * TAU, ring = 0.095 + (1 - layer) * 0.0 + Math.sin(layer * Math.PI) * 0.035, y = layer * 0.065 - 0.005 + (layer < 0.3 ? 0 : 0), rr = ring * (0.9 + 0.2 * Math.sin(layer * 3.14)) , len = 0.07 + rnd() * 0.09;
    const R = 0.03 + (0.09 - 0.03) * Math.pow(Math.sin(Math.min(1, layer + 0.1) * Math.PI / 2), 0.8) + rnd() * 0.012;
    const x = Math.cos(ph) * R, z = Math.sin(ph) * R, yy = layer * 0.07;
    const geo = new THREE.CylinderGeometry(0.0022 + rnd() * 0.0022, 0.0018, len, 5); geo.rotateZ(Math.PI / 2);
    const m = new THREE.Matrix4().compose(new THREE.Vector3(x, yy, z), new THREE.Quaternion().setFromEuler(new THREE.Euler((rnd() - 0.5) * 0.7, -ph + (rnd() - 0.5) * 1.1, (rnd() - 0.5) * 0.9 + Math.cos(ph * 0) * 0.3)), new THREE.Vector3(1, 1, 1)); geo.applyMatrix4(m);
    tmp.setHex(pal[Math.floor(rnd() * pal.length)]).offsetHSL(0, 0, (rnd() - 0.5) * 0.08); const n = geo.attributes.position.count, arr = new Float32Array(n * 3); for (let k = 0; k < n; k++) { arr[k * 3] = tmp.r; arr[k * 3 + 1] = tmp.g; arr[k * 3 + 2] = tmp.b; } geo.setAttribute('color', new THREE.BufferAttribute(arr, 3)); twigs.push(geo.toNonIndexed());
  }
  const nestGeo = mergeGeometries(twigs, false); nestGeo.deleteAttribute('uv');
  g.add(new THREE.Mesh(nestGeo, mat('nest-twigs', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.9 }))));
  // Innenmulde: weiches Polster
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.062, 20, 10, 0, TAU, Math.PI / 2, Math.PI / 2), mat('nest-in', () => new THREE.MeshStandardMaterial({ color: 0x5a4328, roughness: 1, side: THREE.DoubleSide }))); bowl.scale.y = 0.5; bowl.position.y = 0.045; g.add(bowl);
  const bot = mesh(new THREE.CylinderGeometry(0.075, 0.05, 0.03, 18), mat('nest-bot', () => new THREE.MeshStandardMaterial({ color: 0x4a3722, roughness: 1 }))); bot.position.y = 0.015; g.add(bot);
  const eggs = [[0.02, 0.0, 0.0], [-0.016, 0.0, 0.02], [-0.012, 0.0, -0.022], [0.0, 0.0, 0.0]];
  [[0.022, 0.012], [-0.018, 0.022], [-0.012, -0.024], [0.005, -0.004]].forEach(([x, z], i) => { const e = egg(); e.position.set(x, 0.05 + (i === 3 ? 0.018 : 0), z); e.rotation.set(1.2 + i * 0.3, i * 1.4, 0.4); e.scale.setScalar(1.0); g.add(e); });
  g.userData.size = { r: 0.1, h: 0.08 }; return g;
}
// Ast mit Nest (Astgabel), Blättern: Ursprung unten Mitte
export function buildNestOnBranch() {
  const g = new THREE.Group(), bark = mat('bark', () => new THREE.MeshStandardMaterial({ color: 0x5a4430, roughness: 0.95 }));
  const path = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.32, 0.03, 0.02), new THREE.Vector3(-0.12, 0.05, -0.01), new THREE.Vector3(0.1, 0.045, 0.01), new THREE.Vector3(0.33, 0.07, -0.02)]);
  const br = new THREE.Mesh(new THREE.TubeGeometry(path, 24, 0.028, 8), bark); g.add(br);
  const fork = new THREE.CatmullRomCurve3([new THREE.Vector3(-0.02, 0.05, 0), new THREE.Vector3(0.04, 0.12, 0.06), new THREE.Vector3(0.1, 0.2, 0.09)]); g.add(new THREE.Mesh(new THREE.TubeGeometry(fork, 12, 0.014, 6), bark));
  const nest = buildNest(); nest.position.set(0.0, 0.07, 0.0); g.add(nest);
  const L = new Leaves(), rnd = mulberry32(5);
  for (let i = 0; i < 12; i++) L.leaf('simple', { o: [0.2 + rnd() * 0.12, 0.07, -0.01 + rnd() * 0.04], yaw: rnd() * TAU, tilt: 0.7 + rnd() * 0.6, len: 0.13 + rnd() * 0.05, wid: 0.06, bend: 0.5, cup: 0.4, seg: 3, color: [0.9 + rnd() * 0.2, 1, 0.9] });
  for (let i = 0; i < 8; i++) L.leaf('simple', { o: [-0.28 + rnd() * 0.1, 0.04, rnd() * 0.04], yaw: rnd() * TAU, tilt: 0.7 + rnd() * 0.6, len: 0.12 + rnd() * 0.04, wid: 0.055, bend: 0.5, cup: 0.4, seg: 3, color: [0.9 + rnd() * 0.2, 1, 0.9] });
  g.add(L.mesh()); return g;
}
