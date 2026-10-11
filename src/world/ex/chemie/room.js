// Raumschmuck des Chemielabors: Fliesenbordüre, Sprossenfenster, Kupferrohre, Deckenbalken, Pendelleuchten, Lichtflecken.
import * as THREE from 'three';
import { placeWall } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { Batch, MAT, canvas, texOf } from './util.js';

const memo = new Map();
const once = (k, f) => { if (!memo.has(k)) memo.set(k, f()); return memo.get(k); };

// ---------------------------------------------------------------- Texturen
// Himmel hinter den Fenstern: helles Blau, weiche Wolken, warmer Dunst unten
export function skyTex() {
  return once('sky', () => {
    const [c, g] = canvas(256, 256); const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, '#5fa6e6'); gr.addColorStop(0.5, '#9ccbf2'); gr.addColorStop(1, '#e9f4ff'); g.fillStyle = gr; g.fillRect(0, 0, 256, 256);
    const r = mulberry32(21); g.globalAlpha = 0.5;
    for (let i = 0; i < 14; i++) { const x = r() * 256, y = 40 + r() * 140, w = 30 + r() * 60; const rg = g.createRadialGradient(x, y, 2, x, y, w); rg.addColorStop(0, 'rgba(255,255,255,.95)'); rg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = rg; g.beginPath(); g.ellipse(x, y, w, w * 0.45, 0, 0, TAU); g.fill(); }
    return texOf(c);
  });
}
// Fliesenbordüre: cremefarbene Fliesen mit blaugrüner Raute; 1 m x 0.25 m
export function friezeTex() {
  return once('frieze', () => {
    const [c, g] = canvas(512, 128); g.fillStyle = '#e4dcc4'; g.fillRect(0, 0, 512, 128);
    for (let i = 0; i < 4; i++) {
      const x = i * 128 + 3, s = 122; const gr = g.createLinearGradient(x, 3, x + s, 125); gr.addColorStop(0, '#f6f0dc'); gr.addColorStop(1, '#e6dcc0'); g.fillStyle = gr; g.beginPath(); g.roundRect(x, 3, s, s, 6); g.fill();
      g.save(); g.translate(x + s / 2, 64); g.fillStyle = '#1d6e72'; g.beginPath(); g.moveTo(0, -46); g.lineTo(46, 0); g.lineTo(0, 46); g.lineTo(-46, 0); g.closePath(); g.fill();
      g.fillStyle = '#e8c15e'; g.beginPath(); g.moveTo(0, -28); g.lineTo(28, 0); g.lineTo(0, 28); g.lineTo(-28, 0); g.closePath(); g.fill();
      g.fillStyle = '#1d6e72'; g.beginPath(); g.arc(0, 0, 11, 0, TAU); g.fill();
      g.fillStyle = '#4fa8a4'; for (const [dx, dy] of [[-52, -52], [52, -52], [-52, 52], [52, 52]]) { g.beginPath(); g.arc(dx, dy, 7, 0, TAU); g.fill(); }
      g.restore();
    }
    g.fillStyle = '#c99a3c'; g.fillRect(0, 0, 512, 4); g.fillRect(0, 124, 512, 4);
    return texOf(c);
  });
}
// Lichtfleck für den Boden (Fensterkreuz mit weichem Rand), additiv
export function lightPatchTex() {
  return once('patch', () => {
    const [c, g] = canvas(256, 256); g.fillStyle = '#000'; g.fillRect(0, 0, 256, 256);
    g.filter = 'blur(5px)'; g.fillStyle = '#fff3d0'; const pw = 56, ph = 56;
    for (let j = 0; j < 3; j++) for (let i = 0; i < 2; i++) g.fillRect(30 + i * (pw + 28) + 14, 22 + j * (ph + 14) + 6, pw, ph);
    return texOf(c, { srgb: true });
  });
}
function gaugeTex() {
  return once('gauge', () => {
    const [c, g] = canvas(256, 256); g.fillStyle = '#f4efe0'; g.beginPath(); g.arc(128, 128, 124, 0, TAU); g.fill();
    g.strokeStyle = '#2a2a2a'; g.fillStyle = '#2a2a2a'; g.lineWidth = 3;
    for (let i = 0; i <= 20; i++) { const a = (-225 + i * 13.5) * Math.PI / 180, l = i % 5 === 0 ? 22 : 12; g.beginPath(); g.moveTo(128 + Math.cos(a) * 104, 128 + Math.sin(a) * 104); g.lineTo(128 + Math.cos(a) * (104 - l), 128 + Math.sin(a) * (104 - l)); g.stroke(); }
    g.strokeStyle = '#b3261e'; g.lineWidth = 8; g.beginPath(); g.arc(128, 128, 100, (-225 + 16 * 13.5) * Math.PI / 180, (-225 + 20 * 13.5) * Math.PI / 180); g.stroke();
    g.fillStyle = '#2a2a2a'; g.font = 'bold 26px Georgia, serif'; g.textAlign = 'center'; g.fillText('bar', 128, 190);
    g.strokeStyle = '#1a1a1a'; g.lineWidth = 6; g.lineCap = 'round'; const a = (-225 + 7 * 13.5) * Math.PI / 180; g.beginPath(); g.moveTo(128, 128); g.lineTo(128 + Math.cos(a) * 82, 128 + Math.sin(a) * 82); g.stroke(); g.beginPath(); g.arc(128, 128, 9, 0, TAU); g.fill();
    return texOf(c);
  });
}

// ---------------------------------------------------------------- Fliesenbordüre rund um den Raum
export function addFrieze(g, room, y = 3.5, h = 0.24) {
  const mat = once('friezeMat', () => new THREE.MeshStandardMaterial({ map: friezeTex(), roughness: 0.3 }));
  const seg = (wall, a0, a1) => {
    const len = a1 - a0, geo = new THREE.PlaneGeometry(len, h), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len); // 1 Wiederholung je Meter
    const m = new THREE.Mesh(geo, mat); placeWall(m, room, wall, (a0 + a1) / 2, 0.012, y); g.add(m);
  };
  const L = (w) => (w === 'N' || w === 'S' ? room.w : room.d);
  for (const w of ['N', 'S', 'E']) seg(w, -L(w) / 2 + 0.02, L(w) / 2 - 0.02);
  seg('W', -L('W') / 2 + 0.02, -1.5); seg('W', 1.5, L('W') / 2 - 0.02);
}

// ---------------------------------------------------------------- Sprossenfenster: Rahmen aus weiß gestrichenem Holz, Scheibe leuchtet
export function windowMat() { return once('winMat', () => new THREE.MeshBasicMaterial({ map: skyTex(), color: new THREE.Color(1.0, 1.02, 1.06) })); }
export function makeWindow({ w = 1.9, h = 2.3, nx = 2, ny = 4, seed = 0, deep = 0.12 } = {}) {
  const grp = new THREE.Group(), b = new Batch(), paint = MAT.paint(), t = 0.085;
  const geo = new THREE.PlaneGeometry(w, h), uv = geo.attributes.uv; const ox = (seed * 0.37) % 0.6, oy = (seed * 0.21) % 0.2;
  for (let i = 0; i < uv.count; i++) { uv.setXY(i, ox + uv.getX(i) * 0.4, oy + uv.getY(i) * 0.8); }
  const pane = new THREE.Mesh(geo, windowMat()); pane.position.set(0, h / 2, 0.012); grp.add(pane);
  b.box(paint, w + 2 * t, t, deep, 0, h + t / 2, deep / 2); b.box(paint, w + 2 * t, t, deep, 0, -t / 2, deep / 2);
  b.box(paint, t, h, deep, -w / 2 - t / 2, h / 2, deep / 2); b.box(paint, t, h, deep, w / 2 + t / 2, h / 2, deep / 2);
  for (let i = 1; i < nx; i++) b.box(paint, 0.035, h, 0.05, -w / 2 + (w * i) / nx, h / 2, 0.035);
  for (let j = 1; j < ny; j++) b.box(paint, w, 0.035, 0.05, 0, (h * j) / ny, 0.035);
  b.box(paint, w + 0.3, 0.05, deep + 0.12, 0, -t - 0.025, (deep + 0.12) / 2); // Fensterbank
  b.box(paint, w + 0.22, 0.07, deep + 0.03, 0, h + t + 0.035, (deep + 0.03) / 2); // Sturz
  grp.add(b.build({ name: 'fensterrahmen' })); return grp;
}

// ---------------------------------------------------------------- Kupferrohre mit Halterungen, Muffen und Patina-Akzenten
// pts: Streckenzug (lokale Raumkoordinaten); bracketEvery: Abstand der Wandhalter, wallDir: Richtung zur Wand (Einheitsvektor) für die Halter
export function addPipe(b, pts, { r = 0.03, R = 0.09, bracketEvery = 1.2, wallDir = null, patina = [] } = {}) {
  const cu = MAT.copper(), pa = MAT.patina();
  b.pipe(cu, pts, r, R);
  // Muffen (dickere Ringe) und Wandhalter entlang der geraden Stücke
  const wd = wallDir ? new THREE.Vector3(...wallDir) : null;
  for (let i = 0; i < pts.length - 1; i++) {
    const A = new THREE.Vector3(...pts[i]), B = new THREE.Vector3(...pts[i + 1]), d = B.clone().sub(A), len = d.length(); d.normalize();
    const n = Math.max(1, Math.round(len / bracketEvery));
    for (let k = 0; k < n; k++) {
      const P = A.clone().addScaledVector(d, ((k + 0.5) / n) * len);
      if (wd) { const W = P.clone().addScaledVector(wd, r + 0.014); b.tube(MAT.darkSteel(), P.toArray(), W.toArray(), 0.009, 6); b.tube(MAT.darkSteel(), W.toArray(), W.clone().addScaledVector(wd, 0.012).toArray(), 0.03, 10); }
      b.tube(MAT.darkSteel(), P.clone().addScaledVector(d, -0.016).toArray(), P.clone().addScaledVector(d, 0.016).toArray(), r * 1.45, 12);
    }
    if (len > 0.5) { const P = A.clone().addScaledVector(d, len * 0.5 + (len / n) * 0.5 * (n % 2 ? 0 : 1) * 0); b.tube(patina.includes(i) ? pa : cu, P.clone().addScaledVector(d, -0.04).toArray(), P.clone().addScaledVector(d, 0.04).toArray(), r * 1.32, 12); }
  }
}
// Absperrhahn: Körper, Handrad (Patina), Spindel
export function addValve(b, p, axis = 'y', r = 0.03) {
  const [x, y, z] = p, cu = MAT.copper(), pa = MAT.patina();
  b.sph(MAT.darkSteel(), r * 1.9, x, y, z, { w: 14, h: 10 });
  if (axis === 'y') { b.cyl(cu, 0.012, 0.012, 0.12, x, y + 0.11, z); b.torus(pa, 0.06, 0.012, x, y + 0.17, z, { rx: Math.PI / 2, ts: 18 }); b.cyl(pa, 0.012, 0.012, 0.12, x, y + 0.17, z, { rz: Math.PI / 2 }); b.cyl(pa, 0.012, 0.012, 0.12, x, y + 0.17, z, { rx: Math.PI / 2 }); }
  else { b.cyl(cu, 0.012, 0.012, 0.12, x, y, z + 0.11, { rx: Math.PI / 2 }); b.torus(pa, 0.06, 0.012, x, y, z + 0.17, { ts: 18 }); b.cyl(pa, 0.012, 0.012, 0.12, x, y, z + 0.17, { rz: Math.PI / 2 }); b.cyl(pa, 0.012, 0.012, 0.12, x, y, z + 0.17); }
}
// Manometer (Messingring, Zifferblatt), Front nach +z in lokaler Gruppe
export function makeGauge(r = 0.09) {
  const g = new THREE.Group(), b = new Batch();
  b.torus(MAT.copper(), r, 0.012, 0, 0, 0.03, { ts: 24 }); b.cyl(MAT.copper(), r, r, 0.05, 0, 0, 0.0, { rx: Math.PI / 2, seg: 24 });
  g.add(b.build({ name: 'manometer' }));
  const face = new THREE.Mesh(new THREE.CircleGeometry(r, 28), once('gaugeMat', () => new THREE.MeshStandardMaterial({ map: gaugeTex(), roughness: 0.35 }))); face.position.z = 0.027; g.add(face); return g;
}

// ---------------------------------------------------------------- Deckenbalken und Pendelleuchten (nur Optik, das Licht kommt aus dem Lichtpool)
export function addCeiling(g, R) {
  const b = new Batch(), wood = new THREE.MeshStandardMaterial({ color: 0x4a2c1a, roughness: 0.7 });
  for (const x of [-4, 0, 4]) { b.box(wood, 0.24, 0.3, R.d, x, R.h - 0.15, 0); b.box(MAT.copper(), 0.27, 0.025, R.d, x, R.h - 0.31, 0); }
  g.add(b.build({ name: 'balken' }));
}
export function makeLamp({ drop = 1.1 } = {}) {
  const g = new THREE.Group(), b = new Batch();
  b.cyl(MAT.black(), 0.008, 0.008, drop, 0, -drop / 2, 0, { seg: 6 });
  b.cyl(MAT.copper(), 0.05, 0.05, 0.05, 0, 0.0, 0);
  const prof = [[0.05, 0], [0.12, -0.08], [0.3, -0.26], [0.32, -0.28]];
  b.lathe(MAT.white(), prof.map(([x, y]) => [x, y - drop]), 0, 0, 0, { seg: 28 });
  b.torus(MAT.copper(), 0.32, 0.012, 0, -drop - 0.28, 0, { rx: Math.PI / 2, ts: 28 });
  b.sph(MAT.emissive(0xfff0c8, 3.2), 0.1, 0, -drop - 0.2, 0, { w: 14, h: 10 });
  g.add(b.build({ name: 'lampe' })); return g;
}
// Sonnenflecken auf dem Boden (additiv, weich), pro Fenster einer
export function makeLightPatch(w = 2.4, d = 3.4) {
  const mat = once('patchMat', () => new THREE.MeshBasicMaterial({ map: lightPatchTex(), color: new THREE.Color(0.5, 0.42, 0.26), blending: THREE.AdditiveBlending, transparent: true, depthWrite: false }));
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat);
  m.rotation.x = -Math.PI / 2; m.renderOrder = 2; return m;
}
// Läufer (Teppich) in Blaugrün mit Borte und Rauten, einmal aufgespannt (Seitenverhältnis wie die Fläche)
export function makeRunner(w = 6.6, d = 1.9) {
  const px = 1320, ph = Math.round(px * d / w), [c, g] = canvas(px, ph); g.fillStyle = '#1b5560'; g.fillRect(0, 0, px, ph);
  const r = mulberry32(8); for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${r() < 0.5 ? '0,0,0' : '255,240,210'},${0.03 + r() * 0.05})`; g.fillRect(r() * px, r() * ph, 1 + r() * 3, 1); }
  const frame = (ins, lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.strokeRect(ins, ins, px - 2 * ins, ph - 2 * ins); };
  frame(14, 12, '#d8cbae'); frame(34, 4, '#b98a34'); frame(50, 22, '#7a3526'); frame(80, 3, '#b98a34'); frame(92, 8, '#d8cbae');
  const n = 5, step = (px - 260) / (n - 1);
  for (let i = 0; i < n; i++) { const x = 130 + i * step, y = ph / 2, s = ph * 0.3; g.fillStyle = i % 2 ? '#7a3526' : '#d8cbae'; g.beginPath(); g.moveTo(x, y - s); g.lineTo(x + s * 1.2, y); g.lineTo(x, y + s); g.lineTo(x - s * 1.2, y); g.closePath(); g.fill(); g.fillStyle = '#1b5560'; g.beginPath(); g.moveTo(x, y - s * 0.62); g.lineTo(x + s * 0.74, y); g.lineTo(x, y + s * 0.62); g.lineTo(x - s * 0.74, y); g.closePath(); g.fill(); g.fillStyle = '#b98a34'; g.beginPath(); g.arc(x, y, s * 0.2, 0, TAU); g.fill(); if (i < n - 1) { g.fillStyle = '#d8cbae'; g.beginPath(); g.arc(x + step / 2, y, 9, 0, TAU); g.fill(); } }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.96 })); m.rotation.x = -Math.PI / 2; m.position.y = 0.012; return m;
}
// Gebotszeichen "Augenschutz benutzen": blaue Scheibe, weiße Schutzbrille
export function makeGogglesSign(d = 0.26) {
  const [c, g] = canvas(256, 256); g.fillStyle = '#f2efe4'; g.fillRect(0, 0, 256, 256); g.fillStyle = '#1757a8'; g.beginPath(); g.arc(128, 128, 112, 0, TAU); g.fill();
  g.strokeStyle = '#fff'; g.fillStyle = '#fff'; g.lineWidth = 11; g.lineCap = 'round';
  for (const sx of [-1, 1]) { g.beginPath(); g.ellipse(128 + sx * 36, 118, 31, 24, 0, 0, TAU); g.stroke(); }
  g.beginPath(); g.moveTo(100, 112); g.quadraticCurveTo(128, 96, 156, 112); g.stroke(); g.beginPath(); g.moveTo(66, 112); g.lineTo(44, 106); g.moveTo(190, 112); g.lineTo(212, 106); g.stroke();
  g.font = 'bold 26px system-ui, sans-serif'; g.textAlign = 'center'; g.fillText('Schutzbrille', 128, 192);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(d, d), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.5 })); return m;
}
