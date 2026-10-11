// Biologie: Skarabäus (Heiliger Pillendreher) unter einer Glasglocke, mit Mistkugel auf Sand; Vogelnest mit Eiern auf einem Ast.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, mat, mesh, box } from '../../kit.js';
import { fbm, mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, woodDark } from './style.js';
import { Leaves } from './plants.js';

const shell = () => mat('scarab-shell', () => new THREE.MeshStandardMaterial({ color: 0x1e3030, roughness: 0.32, metalness: 0.45 }));
const legMat = () => mat('scarab-leg', () => new THREE.MeshStandardMaterial({ color: 0x2c221c, roughness: 0.5, metalness: 0.2 }));

// Käfer (Heiliger Pillendreher), läuft nach +x. Länge etwa 0,14 m (stark vergrößert). Breiter, gewölbter Körper, Kopfschild mit sechs Zähnen,
// kräftige Vorderbeine mit gezähnten Schienen, schlanke Mittel- und Hinterbeine.
export function buildScarab({ s = 1 } = {}) {
  const g = new THREE.Group(), sh = shell(), lg = legMat(), U = 0.14;                  // U = Körperlänge in Metern
  const E = (rx, ry, rz, x, y, z, m = sh, seg = [24, 16]) => { const e = new THREE.Mesh(new THREE.SphereGeometry(1, seg[0], seg[1]), m); e.scale.set(rx * U, ry * U, rz * U); e.position.set(x * U, y * U, z * U); return e; };
  g.add(E(0.40, 0.19, 0.31, -0.12, 0.2, 0));                                         // Flügeldecken und Hinterleib
  g.add(E(0.18, 0.13, 0.32, 0.27, 0.19, 0));                                         // Halsschild
  g.add(E(0.11, 0.07, 0.2, 0.46, 0.15, 0));                                          // Kopf
  // Kopfschild: sechs Zähne am Vorderrand
  for (let i = 0; i < 6; i++) { const a = -0.78 + (i / 5) * 1.56, c = mesh(new THREE.ConeGeometry(0.028 * U, 0.1 * U, 6), sh); c.rotation.z = -Math.PI / 2; c.rotation.y = 0; c.position.set((0.52 + Math.cos(a) * 0.1) * U, 0.13 * U, Math.sin(a) * 0.19 * U); c.rotation.set(0, -a * 0.9, -Math.PI / 2); g.add(c); }
  // Längsfurchen auf den Flügeldecken (dünne Röhren, folgen der Wölbung)
  for (const zz of [0, 0.1, 0.2, -0.1, -0.2]) { const pts = []; for (let i = 0; i <= 14; i++) { const t = -1 + (i / 14) * 2, x = -0.12 + 0.4 * t * 0.97, k = 1 - Math.pow((x + 0.12) / 0.4, 2) - Math.pow(zz / 0.31, 2); if (k <= 0.02) continue; pts.push(new THREE.Vector3(x * U, (0.2 + 0.19 * Math.sqrt(k) + 0.002) * U, zz * U)); } if (pts.length > 3) g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 16, 0.004 * U, 4), lg)); }
  // Augen und Fühlerkeule
  for (const sz of [-1, 1]) { g.add(E(0.03, 0.03, 0.03, 0.5, 0.2, sz * 0.16, lg, [8, 6])); for (let i = 0; i < 3; i++) { const p = box(0.012 * U, 0.1 * U, 0.04 * U, lg); p.position.set((0.6 + i * 0.012) * U, 0.17 * U, sz * (0.2 + i * 0.015) * U); g.add(p); } }
  // Beine: Hüfte unter dem Körper, Oberschenkel nach außen, Schiene nach unten
  const seg = (a, b, r0, r1) => { const d = b.clone().sub(a), c = mesh(new THREE.CylinderGeometry(r1 * U, r0 * U, d.length(), 7), lg); c.position.copy(a).addScaledVector(d, 0.5); c.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); g.add(c); const j = mesh(new THREE.SphereGeometry(r1 * U * 1.15, 8, 6), lg); j.position.copy(b); g.add(j); };
  const legs = [[0.27, 0.1, 0.16, 0, 0.46], [0.0, -0.02, -0.03, 0, 0.5], [-0.28, -0.12, -0.18, 0, 0.52]];     // x, Vorschub des Knies, ... Fußpunkt, Länge
  legs.forEach(([x, dkx, dfx, _a, reach], i) => { for (const sz of [-1, 1]) {
    const hip = new THREE.Vector3(x * U, 0.09 * U, sz * 0.2 * U), knee = new THREE.Vector3((x + dkx) * U, 0.15 * U, sz * (reach * 0.86) * U), foot = new THREE.Vector3((x + dfx + dkx) * U, 0.005 * U, sz * (reach + 0.05) * U);
    seg(hip, knee, 0.055, 0.045); seg(knee, foot, 0.045, i === 0 ? 0.05 : 0.03);
    if (i === 0) { const t = box(0.08 * U, 0.03 * U, 0.22 * U, lg); t.position.copy(knee).lerp(foot, 0.6); t.lookAt(foot.clone().setY(t.position.y)); g.add(t); for (let k = 0; k < 3; k++) { const th = mesh(new THREE.ConeGeometry(0.018 * U, 0.05 * U, 5), lg); th.rotation.x = Math.PI / 2 * -sz; th.position.copy(knee).lerp(foot, 0.35 + k * 0.22); th.position.x += 0.05 * U; g.add(th); } }
    const ft = box(0.05 * U, 0.02 * U, 0.06 * U, lg); ft.position.copy(foot); g.add(ft); } });
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
