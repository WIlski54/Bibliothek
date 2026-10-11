// Biologie: Pflanzen für den Gewächshaus-Raum. Blätter sind gebogene Streifen mit Blatt-Atlas (alphaTest, Vertexfarben),
// damit sich alle Blätter des Raums zu EINEM Zeichenaufruf zusammenfassen lassen.
import * as THREE from 'three';
import { mulberry32, TAU } from '../../../lib/util.js';
import { M, mat, mesh } from '../../kit.js';
import { canvas, texOf, memo, terracotta } from './style.js';

// ------------------------------------------------------------------ Blatt-Atlas (4 x 2 Zellen, je 256 px). Blattspitze oben, Ansatz unten Mitte.
const CELL = { simple: 0, fern: 1, monstera: 2, palm: 3, round: 4, ivy: 5, succ: 6, grass: 7 };
export function leafAtlas() {
  return memo('bio-leaf-atlas', () => {
    const [c, g] = canvas(1024, 512), S = 256;
    const leafBody = (x0, y0, wf, fillA, fillB, edge) => { // eiförmiger Umriss
      const x = (u) => x0 + u * S, y = (v) => y0 + v * S, mid = 0.5, h = 0.5 * wf;
      g.beginPath(); g.moveTo(x(mid), y(0.985)); g.bezierCurveTo(x(mid - h * 1.05), y(0.85), x(mid - h * 1.0), y(0.38), x(mid), y(0.015)); g.bezierCurveTo(x(mid + h * 1.0), y(0.38), x(mid + h * 1.05), y(0.85), x(mid), y(0.985)); g.closePath();
      const gr = g.createLinearGradient(x(0.1), 0, x(0.9), 0); gr.addColorStop(0, fillB); gr.addColorStop(0.5, fillA); gr.addColorStop(1, fillB); g.fillStyle = gr; g.fill(); g.lineWidth = 3; g.strokeStyle = edge; g.stroke();
    };
    const hw = (v, wf) => 0.5 * wf * Math.pow(Math.sin(Math.PI * Math.pow(1 - v, 0.8)), 0.8) * 1.0; // halbe Breite bei Höhe v (0 oben)
    // 0 einfaches Blatt mit Mittelrippe und Seitenadern
    { const x0 = 0, y0 = 0; leafBody(x0, y0, 0.96, '#5fae5a', '#3d8a45', '#2c6a34');
      g.strokeStyle = 'rgba(210,240,170,.8)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.985); g.lineTo(x0 + S * 0.5, y0 + S * 0.08); g.stroke();
      g.lineWidth = 2.2; g.strokeStyle = 'rgba(200,235,160,.55)';
      for (let i = 1; i <= 9; i++) { const v = 0.93 - i * 0.092, w = hw(v - 0.05, 0.96) * 0.86; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * v); g.quadraticCurveTo(x0 + S * (0.5 + s * w * 0.5), y0 + S * (v - 0.02), x0 + S * (0.5 + s * w), y0 + S * (v - 0.075)); g.stroke(); } } }
    // 1 Farnwedel: Spindel mit Fiedern, die zur Spitze kleiner werden
    { const x0 = S, y0 = 0; g.strokeStyle = '#4a7a38'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.99); g.lineTo(x0 + S * 0.5, y0 + S * 0.03); g.stroke();
      const n = 15; for (let i = 0; i < n; i++) { const v = 0.93 - i * (0.88 / n), L = 0.46 * Math.pow(Math.sin(Math.PI * Math.min(1, (0.2 + (1 - v) * 0.85))), 0.8) * (1 - (1 - v) * 0.35) + 0.04;
        for (const s of [-1, 1]) { const ex = x0 + S * (0.5 + s * L), ey = y0 + S * (v - 0.055); g.fillStyle = i % 2 ? '#4f9d4e' : '#5eac55'; g.strokeStyle = '#2f6a35'; g.lineWidth = 1.6;
          g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * (v + 0.01)); g.quadraticCurveTo(x0 + S * (0.5 + s * L * 0.55), y0 + S * (v - 0.075), ex, ey); g.quadraticCurveTo(x0 + S * (0.5 + s * L * 0.55), y0 + S * (v + 0.03), x0 + S * 0.5, y0 + S * (v + 0.035)); g.closePath(); g.fill(); g.stroke(); } }
      g.fillStyle = '#4f9d4e'; g.beginPath(); g.ellipse(x0 + S * 0.5, y0 + S * 0.05, S * 0.025, S * 0.05, 0, 0, TAU); g.fill(); }
    // 2 Monstera: Herzblatt mit Einschnitten und Löchern
    { const x0 = 2 * S, y0 = 0; g.save(); g.beginPath(); g.rect(x0, y0, S, S); g.clip();
      const x = (u) => x0 + u * S, y = (v) => y0 + v * S;
      g.beginPath(); g.moveTo(x(0.5), y(0.97)); g.bezierCurveTo(x(0.2), y(1.02), x(0.0), y(0.78), x(0.02), y(0.5)); g.bezierCurveTo(x(0.04), y(0.2), x(0.3), y(0.04), x(0.5), y(0.02)); g.bezierCurveTo(x(0.7), y(0.04), x(0.96), y(0.2), x(0.98), y(0.5)); g.bezierCurveTo(x(1.0), y(0.78), x(0.8), y(1.02), x(0.5), y(0.97)); g.closePath();
      const gr = g.createLinearGradient(x(0), y(0), x(1), y(1)); gr.addColorStop(0, '#2f8a48'); gr.addColorStop(1, '#206a3a'); g.fillStyle = gr; g.fill(); g.lineWidth = 3; g.strokeStyle = '#17512c'; g.stroke();
      g.globalCompositeOperation = 'destination-out'; // Einschnitte vom Rand und Löcher
      for (const s of [-1, 1]) for (let k = 0; k < 4; k++) { const v = 0.2 + k * 0.17; g.beginPath(); g.moveTo(x(0.5 + s * 0.52), y(v - 0.02)); g.lineTo(x(0.5 + s * 0.2), y(v + 0.015)); g.lineTo(x(0.5 + s * 0.52), y(v + 0.075)); g.closePath(); g.fill(); }
      for (const s of [-1, 1]) for (let k = 0; k < 3; k++) { g.beginPath(); g.ellipse(x(0.5 + s * (0.16 + k * 0.02)), y(0.3 + k * 0.17), S * 0.028, S * 0.05, s * 0.5, 0, TAU); g.fill(); }
      g.globalCompositeOperation = 'source-over'; g.strokeStyle = 'rgba(190,235,160,.75)'; g.lineWidth = 4; g.beginPath(); g.moveTo(x(0.5), y(0.97)); g.lineTo(x(0.5), y(0.1)); g.stroke(); g.lineWidth = 2.2;
      for (const s of [-1, 1]) for (let k = 0; k < 5; k++) { const v = 0.85 - k * 0.14; g.beginPath(); g.moveTo(x(0.5), y(v)); g.quadraticCurveTo(x(0.5 + s * 0.2), y(v - 0.02), x(0.5 + s * 0.4), y(v - 0.1)); g.stroke(); }
      g.restore(); }
    // 3 Palmwedel (Kentia): lange, schmale, hängende Fiedern
    { const x0 = 3 * S, y0 = 0; g.strokeStyle = '#5a8a3a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.99); g.lineTo(x0 + S * 0.5, y0 + S * 0.04); g.stroke();
      const n = 13; for (let i = 0; i < n; i++) { const v = 0.95 - i * (0.88 / n), L = 0.47 * (1 - Math.pow(i / n, 2.4) * 0.65);
        for (const s of [-1, 1]) { g.fillStyle = i % 2 ? '#3f8f4a' : '#4aa050'; g.strokeStyle = '#2a6a34'; g.lineWidth = 1.4; const ex = x0 + S * (0.5 + s * L), ey = y0 + S * (v + 0.035);
          g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * v); g.quadraticCurveTo(x0 + S * (0.5 + s * L * 0.6), y0 + S * (v - 0.07), ex, ey); g.quadraticCurveTo(x0 + S * (0.5 + s * L * 0.6), y0 + S * (v - 0.035), x0 + S * 0.5, y0 + S * (v + 0.016)); g.closePath(); g.fill(); g.stroke(); } } }
    // 4 rundes Blatt (Pilea, Kapuzinerkresse) mit strahlenförmigen Adern
    { const x0 = 0, y0 = S; g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.99); g.bezierCurveTo(x0 + S * 0.0, y0 + S * 0.9, x0 + S * 0.0, y0 + S * 0.02, x0 + S * 0.5, y0 + S * 0.03); g.bezierCurveTo(x0 + S * 1.0, y0 + S * 0.02, x0 + S * 1.0, y0 + S * 0.9, x0 + S * 0.5, y0 + S * 0.99); g.closePath();
      const gr = g.createRadialGradient(x0 + S * 0.5, y0 + S * 0.6, 8, x0 + S * 0.5, y0 + S * 0.5, S * 0.55); gr.addColorStop(0, '#7cc267'); gr.addColorStop(1, '#3f8f48'); g.fillStyle = gr; g.fill(); g.lineWidth = 3; g.strokeStyle = '#2a6a34'; g.stroke();
      g.strokeStyle = 'rgba(215,240,170,.75)'; g.lineWidth = 2.6; for (let k = -3; k <= 3; k++) { g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.95); g.quadraticCurveTo(x0 + S * (0.5 + k * 0.09), y0 + S * 0.55, x0 + S * (0.5 + k * 0.15), y0 + S * (0.14 + Math.abs(k) * 0.07)); g.stroke(); } }
    // 5 Efeublatt (fünf Lappen)
    { const x0 = S, y0 = S, x = (u) => x0 + u * S, y = (v) => y0 + v * S; g.beginPath(); g.moveTo(x(0.5), y(0.99));
      g.bezierCurveTo(x(0.3), y(0.95), x(0.12), y(0.92), x(0.02), y(0.62)); g.bezierCurveTo(x(0.2), y(0.62), x(0.26), y(0.55), x(0.16), y(0.5)); g.bezierCurveTo(x(0.1), y(0.38), x(0.32), y(0.44), x(0.3), y(0.3)); g.bezierCurveTo(x(0.34), y(0.16), x(0.44), y(0.1), x(0.5), y(0.01));
      g.bezierCurveTo(x(0.56), y(0.1), x(0.66), y(0.16), x(0.7), y(0.3)); g.bezierCurveTo(x(0.68), y(0.44), x(0.9), y(0.38), x(0.84), y(0.5)); g.bezierCurveTo(x(0.74), y(0.55), x(0.8), y(0.62), x(0.98), y(0.62)); g.bezierCurveTo(x(0.88), y(0.92), x(0.7), y(0.95), x(0.5), y(0.99)); g.closePath();
      g.fillStyle = '#3f9150'; g.fill(); g.lineWidth = 3; g.strokeStyle = '#256a38'; g.stroke(); g.strokeStyle = 'rgba(220,240,190,.8)'; g.lineWidth = 3;
      for (const [ex, ey] of [[0.5, 0.06], [0.2, 0.52], [0.8, 0.52], [0.1, 0.66], [0.9, 0.66]]) { g.beginPath(); g.moveTo(x(0.5), y(0.96)); g.lineTo(x(ex), y(ey)); g.stroke(); } }
    // 6 dickes Sukkulentenblatt (spitz, hell in der Mitte)
    { const x0 = 2 * S, y0 = S; leafBody(x0, y0, 0.9, '#8fcf9a', '#4f9a6a', '#2f7a50'); g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(x0 + S * 0.5, y0 + S * 0.55, S * 0.1, S * 0.3, 0, 0, TAU); g.fill(); g.strokeStyle = 'rgba(196,90,110,.55)'; g.lineWidth = 6; g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.03); g.lineTo(x0 + S * 0.5, y0 + S * 0.1); g.stroke(); }
    // 7 Grasblatt / schmales Blatt mit heller Mittelrippe
    { const x0 = 3 * S, y0 = S; leafBody(x0, y0, 0.7, '#75bb4e', '#4c9a3c', '#3a7a2e'); g.strokeStyle = 'rgba(225,245,170,.8)'; g.lineWidth = 5; g.beginPath(); g.moveTo(x0 + S * 0.5, y0 + S * 0.98); g.lineTo(x0 + S * 0.5, y0 + S * 0.1); g.stroke(); }
    const t = texOf(c, { aniso: 4 }); t.generateMipmaps = true; return t;
  });
}
export const leafMat = () => mat('bio-leaf', () => new THREE.MeshStandardMaterial({ map: leafAtlas(), vertexColors: true, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.62, metalness: 0 }));

// ------------------------------------------------------------------ Blatt-Sammler
class Leaves {
  constructor() { this.p = []; this.n = []; this.u = []; this.c = []; this.i = []; this.count = 0; }
  // Blatt: Ansatz o=[x,y,z], Richtung (yaw um Y, tilt von der Senkrechten 0=aufrecht..90=waagerecht), Länge len, Breite wid, Biegung bend (rad über die Länge), cup
  leaf(type, { o = [0, 0, 0], yaw = 0, tilt = 0.4, len = 0.4, wid = 0.2, bend = 0.5, cup = 0.4, seg = 4, color = [1, 1, 1], roll = 0 }) {
    const cell = CELL[type], u0 = (cell % 4) / 4, v0 = 1 - (Math.floor(cell / 4) + 1) / 2, du = 0.25, dv = 0.5;
    const ds = len / seg, cy = Math.cos(yaw), sy = Math.sin(yaw), base = this.count;
    let px = 0, py = 0, pz = 0, a = tilt;
    for (let j = 0; j <= seg; j++) {
      const t = j / seg, na = a; // Normale des Streifens
      const ny = -Math.sin(na), nz = Math.cos(na);
      const col = [color[0] * (0.78 + 0.22 * t), color[1] * (0.78 + 0.22 * t), color[2] * (0.78 + 0.22 * t)];
      for (const s of [-1, 1]) {
        const lx = s * wid / 2, off = cup * lx * lx * 2, cr = Math.cos(roll), sr = Math.sin(roll);
        // Seitenvektor um die Blattachse gedreht (roll), Wölbung (cup) entlang der gedrehten Normalen
        const X = lx * cr + off * sr, Y = py - lx * sr * ny + off * cr * ny, Z = pz - lx * sr * nz + off * cr * nz;
        const wx = X * cy + Z * sy, wz = -X * sy + Z * cy;
        this.p.push(o[0] + wx, o[1] + Y, o[2] + wz);
        const nxl = sr, nyl = ny * cr, nzl = nz * cr; this.n.push(nxl * cy + nzl * sy, nyl, -nxl * sy + nzl * cy);
        this.u.push(u0 + (s < 0 ? 0 : du), v0 + dv * t);
        this.c.push(col[0], col[1], col[2]);
      }
      this.count += 2;
      if (j < seg) { py += Math.cos(a) * ds; pz += Math.sin(a) * ds; a += bend / seg; }
    }
    for (let j = 0; j < seg; j++) { const k = base + j * 2; this.i.push(k, k + 1, k + 2, k + 1, k + 3, k + 2); }
  }
  geometry() {
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(this.p, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(this.n, 3));
    g.setAttribute('uv', new THREE.Float32BufferAttribute(this.u, 2)); g.setAttribute('color', new THREE.Float32BufferAttribute(this.c, 3)); g.setIndex(this.i); return g;
  }
  mesh() { const m = new THREE.Mesh(this.geometry(), leafMat()); m.receiveShadow = true; return m; }
}
export { Leaves };

const G = (r, g, b) => [r, g, b];
const tintOf = (rnd, base = [1, 1, 1], v = 0.18) => { const k = 1 - v / 2 + rnd() * v, s = 1 + (rnd() - 0.5) * v * 0.6; return [base[0] * k * s, base[1] * k, base[2] * k / s]; };

// ------------------------------------------------------------------ Töpfe
const potCache = new Map();
export function pot({ r = 0.22, h = 0.34, kind = 'terra', y = 0 } = {}) {
  const g = new THREE.Group(); const cols = { terra: 0xb8643c, white: 0xe9e4d6, green: 0x4f8a64, blue: 0x5f86a6, dark: 0x4a3a30 };
  const m = M.plain(cols[kind] || cols.terra, kind === 'terra' ? 0.88 : 0.45);
  const body = mesh(new THREE.CylinderGeometry(r, r * 0.72, h, 22), m); body.position.y = y + h / 2; g.add(body);
  const rim = mesh(new THREE.CylinderGeometry(r * 1.07, r * 1.04, h * 0.14, 22), m); rim.position.y = y + h - h * 0.07; g.add(rim);
  const soil = mesh(new THREE.CylinderGeometry(r * 0.96, r * 0.96, 0.02, 18), M.plain(0x2a1a10, 1)); soil.position.y = y + h - h * 0.12; g.add(soil);
  return g;
}

// ------------------------------------------------------------------ Pflanzen (Gruppe mit Topf, ein Blatt-Mesh)
export function fernPlant({ h = 0.9, seed = 1, kind = 'terra', fronds = 13, potR } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 91 + 7), L = new Leaves(), pr = potR || 0.2 + h * 0.06;
  g.add(pot({ r: pr, h: pr * 1.5, kind })); const y0 = pr * 1.5 - 0.02;
  for (let i = 0; i < fronds; i++) {
    const yaw = (i / fronds) * TAU + rnd() * 0.5, up = rnd();
    L.leaf('fern', { o: [Math.cos(yaw) * 0.03, y0, Math.sin(yaw) * 0.03], yaw, tilt: 0.25 + up * 0.8, len: h * (0.7 + rnd() * 0.5), wid: h * (0.3 + rnd() * 0.12), bend: 0.7 + rnd() * 0.5, cup: -0.5, roll: (rnd() - 0.5) * 0.7, seg: 5, color: tintOf(rnd, G(0.95, 1, 0.9), 0.2) });
  }
  g.add(L.mesh()); return g;
}
export function palmPlant({ h = 2.0, seed = 2, kind = 'terra', fronds = 12, trunk = true } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 57 + 3), L = new Leaves(), pr = 0.28;
  g.add(pot({ r: pr, h: 0.45, kind })); const y0 = 0.43, brown = M.plain(0x6a5a3a, 0.9);
  for (let i = 0; i < fronds; i++) {
    const yaw = (i / fronds) * TAU + rnd() * 0.4, hh = h * (0.5 + rnd() * 0.42), lean = 0.1 + rnd() * 0.22, fl = h * (0.38 + rnd() * 0.16);
    const sx = Math.cos(yaw) * lean * hh, sz = Math.sin(yaw) * lean * hh;
    const st = mesh(new THREE.CylinderGeometry(0.011, 0.018, hh, 6), brown); st.position.set(sx / 2, y0 + hh / 2, sz / 2); st.rotation.set(Math.sin(yaw) * lean * 0.9, 0, -Math.cos(yaw) * lean * 0.9); g.add(st);
    L.leaf('palm', { o: [sx, y0 + hh * 0.97, sz], yaw, tilt: 0.45 + rnd() * 0.5, len: fl * 1.1, wid: fl * 0.9, bend: 1.2 + rnd() * 0.5, cup: -0.9, roll: (rnd() - 0.5) * 0.5, seg: 6, color: tintOf(rnd, G(0.9, 1, 0.9), 0.18) });
  }
  g.add(L.mesh()); return g;
}
export function monsteraPlant({ h = 1.2, seed = 3, kind = 'terra', n = 9 } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 41 + 1), L = new Leaves();
  g.add(pot({ r: 0.26, h: 0.4, kind })); const y0 = 0.38, brown = M.plain(0x5a8a3a, 0.8);
  for (let i = 0; i < n; i++) {
    const yaw = (i / n) * TAU + rnd() * 0.6, hh = h * (0.35 + rnd() * 0.6), lean = 0.18 + rnd() * 0.35, ll = h * (0.34 + rnd() * 0.14);
    const sx = Math.cos(yaw) * lean * hh, sz = Math.sin(yaw) * lean * hh;
    const st = mesh(new THREE.CylinderGeometry(0.008, 0.013, hh, 6), brown); st.position.set(sx / 2, y0 + hh / 2, sz / 2); st.rotation.set(Math.sin(yaw) * lean * 0.85, 0, -Math.cos(yaw) * lean * 0.85); g.add(st);
    L.leaf('monstera', { o: [sx, y0 + hh, sz], yaw, tilt: 0.45 + rnd() * 0.5, len: ll * 1.05, wid: ll, bend: 0.9, cup: 0.35, roll: (rnd() - 0.5) * 1.0, seg: 4, color: tintOf(rnd, G(1, 1, 1), 0.2) });
  }
  g.add(L.mesh()); return g;
}
export function bushPlant({ h = 1.0, seed = 4, kind = 'terra', n = 40, leaf = 'simple', size = 0.2 } = {}) { // Gummibaum / Ficus: viele breite Blätter an kurzem Stamm
  const g = new THREE.Group(), rnd = mulberry32(seed * 29 + 9), L = new Leaves(), brown = M.plain(0x6a4a30, 0.9);
  g.add(pot({ r: 0.24, h: 0.4, kind })); const y0 = 0.38;
  const st = mesh(new THREE.CylinderGeometry(0.02, 0.035, h * 0.7, 8), brown); st.position.y = y0 + h * 0.35; g.add(st);
  for (let i = 0; i < n; i++) {
    const yaw = rnd() * TAU, f = rnd(), hh = h * (0.35 + f * 0.65), rad = (0.04 + (1 - Math.abs(f - 0.55)) * 0.25) * h * 0.8;
    L.leaf(leaf, { o: [Math.cos(yaw) * 0.03, y0 + hh * 0.98, Math.sin(yaw) * 0.03], yaw, tilt: 0.5 + rnd() * 0.9, len: size * (0.8 + rnd() * 0.5), wid: size * (0.55 + rnd() * 0.25), bend: 0.5, cup: 0.5, roll: (rnd() - 0.5) * 1.2, seg: 3, color: tintOf(rnd, G(1, 1, 1), 0.25) });
  }
  g.add(L.mesh()); return g;
}
export function succulent({ r = 0.1, seed = 5, kind = 'terra', rings = 3 } = {}) { // Rosette (Echeveria-artig)
  const g = new THREE.Group(), rnd = mulberry32(seed * 17 + 2), L = new Leaves(), pr = r * 0.9;
  g.add(pot({ r: pr, h: pr * 1.1, kind })); const y0 = pr * 1.1 - 0.01;
  for (let k = 0; k < rings; k++) { const nn = 6 + k * 3, tilt = 1.25 - k * 0.38; for (let i = 0; i < nn; i++) { const yaw = (i / nn) * TAU + k * 0.4; L.leaf('succ', { o: [0, y0 + 0.01 * k, 0], yaw, tilt, len: r * (1.1 - k * 0.17), wid: r * 0.55, bend: 0.5, cup: 1.5, seg: 2, color: tintOf(rnd, G(1, 1, 1), 0.14) }); } }
  g.add(L.mesh()); return g;
}
export function cactus({ h = 0.35, seed = 6, kind = 'terra' } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed), pr = 0.1; g.add(pot({ r: pr, h: pr * 1.2, kind }));
  const cm = new THREE.MeshStandardMaterial({ color: 0x4a8a56, roughness: 0.7 }), y0 = pr * 1.2;
  const main = mesh(new THREE.CapsuleGeometry(pr * 0.7, h, 6, 12), mat('bio-cactus', () => cm)); main.position.y = y0 + h / 2 + pr * 0.6; g.add(main);
  for (const s of [-1, 1]) { const arm = mesh(new THREE.CapsuleGeometry(pr * 0.33, h * 0.35, 5, 10), mat('bio-cactus', () => cm)); arm.position.set(s * pr * 1.0, y0 + h * (0.5 + rnd() * 0.2), 0); g.add(arm); const el = mesh(new THREE.CapsuleGeometry(pr * 0.3, pr * 1.0, 5, 10), mat('bio-cactus', () => cm)); el.rotation.z = Math.PI / 2; el.position.set(s * pr * 0.6, arm.position.y - h * 0.12, 0); g.add(el); }
  return g;
}
export function grassTuft({ r = 0.2, h = 0.4, seed = 7, n = 20, kind = 'terra' } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 13), L = new Leaves(), pr = r; g.add(pot({ r: pr, h: pr * 1.2, kind })); const y0 = pr * 1.2 - 0.01;
  for (let i = 0; i < n; i++) { const yaw = rnd() * TAU; L.leaf('grass', { o: [Math.cos(yaw) * 0.04, y0, Math.sin(yaw) * 0.04], yaw, tilt: 0.1 + rnd() * 0.4, len: h * (0.7 + rnd() * 0.6), wid: 0.045 + rnd() * 0.02, bend: 0.8 + rnd() * 0.8, cup: 0, seg: 4, color: tintOf(rnd, G(1, 1, 0.95), 0.25) }); }
  g.add(L.mesh()); return g;
}
// hängende Pflanze: Korb an Ketten, Ranken mit kleinen runden Blättern (Efeutute / Tradescantia)
export function hangingPlant({ len = 1.0, seed = 8, strands = 6, hang = 0.7, leaf = 'round' } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 23 + 1), L = new Leaves(), brass = M.brass();
  const bowl = mesh(new THREE.SphereGeometry(0.2, 18, 10, 0, TAU, Math.PI / 2, Math.PI / 2), M.plain(0xb8643c, 0.88)); bowl.material = bowl.material; g.add(bowl);
  const rim = mesh(new THREE.TorusGeometry(0.2, 0.014, 6, 22), brass); rim.rotation.x = Math.PI / 2; g.add(rim);
  for (let k = 0; k < 3; k++) { const a = (k / 3) * TAU, x = Math.cos(a) * 0.2, z = Math.sin(a) * 0.2; const ch = mesh(new THREE.CylinderGeometry(0.004, 0.004, hang, 4), brass); ch.position.set(x / 2, hang / 2, z / 2); ch.rotation.set(Math.sin(a) * Math.atan(0.2 / hang), 0, -Math.cos(a) * Math.atan(0.2 / hang)); g.add(ch); }
  const stemM = M.plain(0x4a8a3a, 0.8);
  for (let s = 0; s < strands; s++) {
    const a = (s / strands) * TAU + rnd() * 0.5, ll = len * (0.5 + rnd() * 0.6), r0 = 0.12 + rnd() * 0.08, n = Math.round(ll / 0.075);
    const stem = mesh(new THREE.CylinderGeometry(0.004, 0.004, ll, 4), stemM); stem.position.set(Math.cos(a) * (r0 + 0.04), -ll / 2 + 0.03, Math.sin(a) * (r0 + 0.04)); g.add(stem);
    for (let j = 0; j < n; j++) { const t = j / n, yy = 0.03 - t * ll, off = r0 + 0.03 + Math.sin(t * 6 + s) * 0.01; for (const sd of [-1, 1]) L.leaf(leaf, { o: [Math.cos(a) * off, yy, Math.sin(a) * off], yaw: a + sd * 1.3, tilt: 1.6 + rnd() * 0.4, len: 0.09 + rnd() * 0.03, wid: 0.075, bend: 0.2, cup: 0.4, seg: 1, color: tintOf(rnd, G(1, 1, 1), 0.3) }); }
  }
  // Blätter über dem Rand
  for (let i = 0; i < 16; i++) { const a = rnd() * TAU; L.leaf(leaf, { o: [Math.cos(a) * 0.1, 0.02, Math.sin(a) * 0.1], yaw: a, tilt: 0.9 + rnd() * 0.5, len: 0.16, wid: 0.12, bend: 0.8, cup: 0.4, seg: 2, color: tintOf(rnd, G(1, 1, 1), 0.25) }); }
  g.add(L.mesh()); return g;
}
// Efeu-/Blattgirlande entlang einer Strecke (von a nach b, hängt leicht durch). Liefert Gruppe mit einem Blatt-Mesh
export function garland(a, b, { n = 36, sag = 0.12, seed = 9, leaf = 'ivy', size = 0.11 } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 31 + 4), L = new Leaves(), A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), ang = Math.atan2(d.z, d.x);
  for (let i = 0; i <= n; i++) { const t = i / n, p = A.clone().addScaledVector(d, t); p.y -= Math.sin(t * Math.PI) * sag; for (let k = 0; k < 2; k++) L.leaf(leaf, { o: [p.x, p.y, p.z], yaw: -ang + Math.PI / 2 + (rnd() - 0.5) * 2.6, tilt: 1.3 + rnd() * 0.6, len: size * (0.8 + rnd() * 0.5), wid: size * 0.9, bend: 0.5, cup: 0.5, seg: 1, color: tintOf(rnd, G(1, 1, 1), 0.3) }); }
  g.add(L.mesh()); return g;
}
// herabhängende Ranken von einer Regalkante (x0..x1 am Ursprung z=0, nach unten)
export function trailing({ w = 1.4, drops = 5, len = 0.7, seed = 10, leaf = 'round' } = {}) {
  const g = new THREE.Group(), rnd = mulberry32(seed * 19 + 6), L = new Leaves(), stemM = M.plain(0x4a8a3a, 0.8);
  for (let s = 0; s < drops; s++) { const x = (s / Math.max(1, drops - 1) - 0.5) * w + (rnd() - 0.5) * 0.15, ll = len * (0.4 + rnd() * 0.7), n = Math.round(ll / 0.07);
    const stem = mesh(new THREE.CylinderGeometry(0.004, 0.004, ll, 4), stemM); stem.position.set(x, -ll / 2, 0.01); g.add(stem);
    for (let j = 0; j < n; j++) { const yy = -j * ll / n; for (const sd of [-1, 1]) L.leaf(leaf, { o: [x, yy, 0.01], yaw: sd * (1.0 + rnd() * 0.8) + Math.PI / 2 * 0, tilt: 1.5 + rnd() * 0.5, len: 0.08 + rnd() * 0.03, wid: 0.07, bend: 0.2, cup: 0.4, seg: 1, color: tintOf(rnd, G(1, 1, 1), 0.3) }); } }
  g.add(L.mesh()); return g;
}
