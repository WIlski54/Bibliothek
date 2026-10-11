// Biologie: Fossilien. Ammonit als echte 3D-Spirale, Trilobit als Relief in der Steinplatte, Fischplatte (Jura), Seeigel und Haizahn.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, mat, mesh, box } from '../../kit.js';
import { fbm, mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, SERIF } from './style.js';

// ---------------------------------------------------------------- Ammonit: logarithmische Spirale, Windungen mit Rippen
export function buildAmmonite({ size = 0.3, turns = 3.2, ribs = 20, seg = 6 } = {}) {
  const W = 2.15, b = Math.log(W) / TAU, k = 0.4, zr = 0.68, th1 = turns * TAU, nS = Math.round(ribs * turns * seg), nP = 16;
  const rEnd = 1 / (1 + k);                                // Außenradius am Ende = 1 (normiert)
  const pos = [], col = [], idx = [], c1 = new THREE.Color(0xd6a95a), c2 = new THREE.Color(0x7a5424), c3 = new THREE.Color(0xf1d89a), tmp = new THREE.Color();
  const rOf = (th) => rEnd * Math.exp(b * (th - th1));
  for (let i = 0; i <= nS; i++) {
    const th = (i / nS) * th1, r = rOf(th), rho = k * r, rib = 0.5 + 0.5 * Math.sin(th * ribs), cx = r * Math.cos(th), cy = r * Math.sin(th), nx = Math.cos(th), ny = Math.sin(th);
    for (let j = 0; j < nP; j++) {
      const ph = (j / nP) * TAU, c = Math.cos(ph), s = Math.sin(ph);
      const flank = Math.max(0, c) * 0.9 + 0.1, bulge = 1 + 0.1 * rib * flank + 0.14 * Math.pow(Math.max(0, c), 10);   // Rippen auf der Außenflanke, Kiel am Außenrand
      const sq = Math.sign(c) * Math.pow(Math.abs(c), 0.85);                                                               // Rücken etwas abgeflacht
      const dx = rho * sq * bulge, dz = rho * zr * s * (1 - 0.18 * Math.max(0, c));
      pos.push((cx + nx * dx) * size * 0.5, (cy + ny * dx) * size * 0.5, dz * size * 0.5);
      tmp.copy(c1).lerp(c2, 0.55 * (1 - rib) * (0.4 + 0.6 * flank) + 0.2 * (1 - flank)).lerp(c3, 0.25 * rib * Math.max(0, c)); tmp.multiplyScalar(0.85 + 0.25 * fbm(th * 3.1, j * 0.7, 2)); col.push(tmp.r, tmp.g, tmp.b);
    }
  }
  for (let i = 0; i < nS; i++) for (let j = 0; j < nP; j++) { const a = i * nP + j, b2 = i * nP + ((j + 1) % nP), c = a + nP, d = b2 + nP; idx.push(a, c, b2, b2, c, d); }
  // Mündung: Fächer, dunkel (Gestein in der Wohnkammer)
  const base = pos.length / 3; { const th = th1, r = rOf(th), cx = r * Math.cos(th), cy = r * Math.sin(th); pos.push(cx * size * 0.5, cy * size * 0.5, 0); col.push(0.32, 0.24, 0.16); const last = nS * nP; for (let j = 0; j < nP; j++) idx.push(base, last + ((j + 1) % nP), last + j); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx); g.computeVertexNormals();
  const m = new THREE.Mesh(g, mat('ammo', () => new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.22, side: THREE.DoubleSide })));
  // untersten Punkt auf y=0 setzen
  g.computeBoundingBox(); const bb = g.boundingBox; m.position.set(-(bb.min.x + bb.max.x) / 2, -bb.min.y, 0); const grp = new THREE.Group(); grp.add(m); grp.userData.size = { w: bb.max.x - bb.min.x, h: bb.max.y - bb.min.y }; return grp;
}

// ---------------------------------------------------------------- Steinplatten mit gemaltem Fossil und Relief (bumpMap)
function stoneTex() { return memo('stone', () => { const [c, g] = canvas(256, 256), rnd = mulberry32(3); const img = g.createImageData(256, 256); for (let y = 0; y < 256; y++) for (let x = 0; x < 256; x++) { const v = 0.95 + fbm(x * 0.06, y * 0.06, 4) * 0.3 + (rnd() - 0.5) * 0.06, i = (y * 256 + x) * 4; img.data[i] = 170 * v; img.data[i + 1] = 156 * v; img.data[i + 2] = 130 * v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); return texOf(c, { wrap: true }); }); }
function stoneCanvas(g, W, H, seed, tone = [196, 180, 150]) { const rnd = mulberry32(seed), img = g.createImageData(W, H); for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const v = 0.95 + fbm(x * 0.05 + seed, y * 0.05, 4) * 0.3 + (rnd() - 0.5) * 0.06, i = (y * W + x) * 4; img.data[i] = tone[0] * v; img.data[i + 1] = tone[1] * v; img.data[i + 2] = tone[2] * v; img.data[i + 3] = 255; } g.putImageData(img, 0, 0); }
function slabWith(key, W, H, draw, { w, d, th, seed, bumpScale = 2.4 }) {
  const g = new THREE.Group();
  const [tex, bump] = memo(key, () => { const [c, gg] = canvas(W, H), [b, bg] = canvas(W, H); stoneCanvas(gg, W, H, seed); bg.fillStyle = '#808080'; bg.fillRect(0, 0, W, H); draw(gg, 'col'); draw(bg, 'bump'); return [texOf(c), texOf(b, { srgb: false })]; });
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: tex, bumpMap: bump, bumpScale, roughness: 0.85 })); top.rotation.x = -Math.PI / 2; top.position.y = th / 2 + 0.0006; g.add(top);
  g.add(box(w, th, d, mat('slabside', () => new THREE.MeshStandardMaterial({ map: stoneTex(), roughness: 0.9 })), { tile: 0.4 }));
  g.userData.size = { w, d, th }; return g;
}
// Trilobit von oben: Kopfschild mit Glabella und Augen, Brust mit Segmenten und drei Längsfurchen, Schwanzschild
function drawTrilobite(g, mode) {
  const col = mode === 'col', K = (c, b) => (col ? c : b), cx = 256;
  const dark = K('#4a3824', '#9a9a9a'), mid = K('#6e5334', '#c8c8c8'), lite = K('#a07c4a', '#ffffff'), edge = K('#2c2014', '#d0d0d0');
  g.save(); g.lineJoin = 'round'; g.lineCap = 'round';
  if (col) { g.shadowColor = 'rgba(40,28,14,.35)'; g.shadowBlur = 16; g.shadowOffsetX = 4; g.shadowOffsetY = 6; }
  // Gesamtumriss (als Schatten und Grundfarbe)
  const outline = () => { g.beginPath(); g.moveTo(cx - 118, 214); g.quadraticCurveTo(cx - 112, 70, cx, 40); g.quadraticCurveTo(cx + 112, 70, cx + 118, 214); g.lineTo(cx + 72, 178); g.lineTo(cx + 70, 190); g.lineTo(cx + 66, 292); g.quadraticCurveTo(cx + 60, 372, cx, 380); g.quadraticCurveTo(cx - 60, 372, cx - 66, 292); g.lineTo(cx - 70, 190); g.lineTo(cx - 72, 178); g.closePath(); };
  g.fillStyle = mid; outline(); g.fill(); g.restore(); g.save(); g.lineJoin = 'round';
  g.strokeStyle = edge; g.lineWidth = 3; outline(); g.stroke();
  // Segmente der Brust: 10 Bänder mit Pleuren, Schrägfurchen
  for (let i = 0; i < 10; i++) { const y = 188 + i * 14.5, wd = 70 - i * 2.4; g.fillStyle = i % 2 ? mid : dark; g.beginPath(); g.roundRect(cx - wd, y, wd * 2, 13, 5); g.fill(); g.strokeStyle = edge; g.lineWidth = 1.6; g.stroke();
    g.strokeStyle = lite; g.lineWidth = 2; for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 24, y + 3); g.lineTo(cx + s * (wd - 4), y + 9); g.stroke(); } }
  // Spindel (Rhachis): erhabene Mitte
  g.fillStyle = lite; g.globalAlpha = col ? 0.55 : 0.9; g.beginPath(); g.moveTo(cx - 26, 170); g.lineTo(cx + 26, 170); g.lineTo(cx + 19, 340); g.quadraticCurveTo(cx, 352, cx - 19, 340); g.closePath(); g.fill(); g.globalAlpha = 1;
  g.strokeStyle = edge; g.lineWidth = 2.2; for (let i = 0; i < 10; i++) { const y = 188 + i * 14.5; g.beginPath(); g.moveTo(cx - 24 + i * 0.8, y); g.lineTo(cx + 24 - i * 0.8, y); g.stroke(); }
  // Schwanzschild: Rippen
  for (let i = 0; i < 6; i++) { const y = 336 + i * 7; g.strokeStyle = edge; g.lineWidth = 1.8; g.beginPath(); g.moveTo(cx - 52 + i * 6, y); g.quadraticCurveTo(cx, y + 6, cx + 52 - i * 6, y); g.stroke(); }
  // Kopfschild: Glabella, Furchen, Augen, Wangen
  g.fillStyle = dark; g.beginPath(); g.moveTo(cx - 100, 190); g.quadraticCurveTo(cx - 100, 80, cx, 52); g.quadraticCurveTo(cx + 100, 80, cx + 100, 190); g.lineTo(cx + 60, 176); g.lineTo(cx - 60, 176); g.closePath(); g.fill(); g.strokeStyle = edge; g.lineWidth = 2.4; g.stroke();
  g.fillStyle = lite; g.globalAlpha = col ? 0.8 : 1; g.beginPath(); g.moveTo(cx - 24, 176); g.bezierCurveTo(cx - 36, 130, cx - 30, 84, cx, 72); g.bezierCurveTo(cx + 30, 84, cx + 36, 130, cx + 24, 176); g.closePath(); g.fill(); g.globalAlpha = 1; g.strokeStyle = edge; g.lineWidth = 2.2; g.stroke();
  g.strokeStyle = edge; g.lineWidth = 2; for (let i = 0; i < 3; i++) for (const s of [-1, 1]) { g.beginPath(); g.moveTo(cx + s * 28, 150 - i * 28); g.lineTo(cx + s * 12, 142 - i * 28); g.stroke(); }
  for (const s of [-1, 1]) { g.fillStyle = mid; g.beginPath(); g.ellipse(cx + s * 58, 118, 16, 24, s * 0.35, 0, Math.PI * 2); g.fill(); g.stroke(); g.strokeStyle = lite; g.lineWidth = 3; g.beginPath(); g.arc(cx + s * 58, 118, 11, s > 0 ? -1.8 : 1.3, s > 0 ? 1.4 : 4.9); g.stroke(); g.strokeStyle = edge; g.lineWidth = 2; g.beginPath(); g.moveTo(cx + s * 30, 100); g.quadraticCurveTo(cx + s * 44, 96, cx + s * 52, 112); g.stroke(); }
  g.restore();
}
export function buildTrilobitePlate({ w = 0.3, d = 0.26, th = 0.03 } = {}) { return slabWith('trilo', 512, 440, drawTrilobite, { w, d, th, seed: 6, bumpScale: 2.6 }); }

// ---------------------------------------------------------------- Fischplatte (Jura): Skelett gemalt, mit Relief über bumpMap
function drawFish(gg, mode) {
  const col = mode === 'col', dark = col ? '#4a3622' : '#ffffff', mid = col ? '#6a4e30' : '#dddddd';
  const spine = (t) => [60 + t * 330, 160 + Math.sin(t * 2.2) * 10 - t * 6];
  gg.save(); gg.lineCap = 'round'; gg.lineJoin = 'round';
  gg.fillStyle = mid; gg.globalAlpha = 0.28; gg.beginPath(); gg.moveTo(392, 160); gg.bezierCurveTo(340, 98, 190, 96, 82, 150); gg.lineTo(82, 170); gg.bezierCurveTo(190, 224, 340, 224, 392, 166); gg.closePath(); gg.fill(); gg.globalAlpha = 1;
  for (let i = 0; i < 34; i++) { const [x, y] = spine(i / 33); gg.fillStyle = dark; gg.beginPath(); gg.ellipse(x, y, 5.5, 8, 0, 0, TAU); gg.fill(); }
  gg.strokeStyle = dark; gg.lineWidth = 2.3; for (let i = 3; i < 28; i++) { const [x, y] = spine(i / 33), L = 40 * Math.sin(Math.PI * (0.1 + i / 33 * 0.8)); for (const s of [-1, 1]) { gg.beginPath(); gg.moveTo(x, y); gg.quadraticCurveTo(x + 10, y + s * L * 0.6, x + 22, y + s * L); gg.stroke(); } }
  gg.fillStyle = dark; gg.globalAlpha = 0.85; gg.beginPath(); gg.moveTo(380, 150); gg.bezierCurveTo(396, 122, 446, 126, 466, 156); gg.bezierCurveTo(444, 192, 394, 196, 378, 170); gg.closePath(); gg.fill(); gg.globalAlpha = 1;
  gg.strokeStyle = mid; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(466, 156); gg.lineTo(396, 158); gg.stroke(); gg.fillStyle = col ? '#c9b88c' : '#999'; gg.beginPath(); gg.arc(430, 146, 8, 0, TAU); gg.fill(); gg.fillStyle = dark; gg.beginPath(); gg.arc(430, 146, 4, 0, TAU); gg.fill();
  gg.strokeStyle = dark; gg.lineWidth = 1.8; for (let k = 0; k < 14; k++) { const t = k / 13; gg.beginPath(); gg.moveTo(70, 156 + (t - 0.5) * 6); gg.lineTo(18 + Math.abs(t - 0.5) * 20, 156 + (t - 0.5) * 120); gg.stroke(); }
  for (let k = 0; k < 9; k++) { const [x, y] = spine(0.45 + k * 0.035); gg.beginPath(); gg.moveTo(x, y - 8); gg.lineTo(x - 14 + k * 3, y - 54 + Math.abs(k - 4) * 6); gg.stroke(); gg.beginPath(); gg.moveTo(x, y + 8); gg.lineTo(x - 12 + k * 2, y + 44 - Math.abs(k - 4) * 5); gg.stroke(); }
  for (let k = 0; k < 7; k++) { gg.beginPath(); gg.moveTo(372 - k * 3, 176); gg.lineTo(352 - k * 6, 214 - k * 2); gg.stroke(); }
  gg.restore();
}
export function buildFishPlate({ w = 0.34, d = 0.22, th = 0.028 } = {}) { return slabWith('fishplate', 512, 320, drawFish, { w, d, th, seed: 21, bumpScale: 2.2 }); }

// ---------------------------------------------------------------- Seeigel und Haizahn
export function buildUrchin({ r = 0.045 } = {}) {
  const g = new THREE.Group(), tex = memo('urchin', () => { const [c, gg] = canvas(256, 256); gg.fillStyle = '#9c9686'; gg.fillRect(0, 0, 256, 256); for (let a = 0; a < 5; a++) { const ang = (a / 5) * TAU; for (let k = 0; k < 14; k++) { const t = 0.08 + k * 0.065; for (const off of [-0.07, 0.07]) { const aa = ang + off * (1 - t * 0.7), x = 128 + Math.cos(aa) * t * 118, y = 128 + Math.sin(aa) * t * 118; gg.fillStyle = '#5a5648'; gg.beginPath(); gg.arc(x, y, 1.5 + t * 4, 0, TAU); gg.fill(); } } gg.strokeStyle = '#b8b2a0'; gg.lineWidth = 3; gg.beginPath(); gg.moveTo(128, 128); gg.lineTo(128 + Math.cos(ang) * 126, 128 + Math.sin(ang) * 126); gg.stroke(); } return texOf(c); });
  const geo = new THREE.SphereGeometry(r, 28, 12, 0, TAU, 0, Math.PI / 2); const p = geo.attributes.position, uv = geo.attributes.uv; for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i); uv.setXY(i, 0.5 + x / r * 0.5, 0.5 + z / r * 0.5); p.setY(i, p.getY(i) * 0.82); } geo.computeVertexNormals();
  const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.8 })); g.add(m); return g;
}
export function buildSharkTooth({ h = 0.06 } = {}) {
  const g = new THREE.Group(), shape = new THREE.Shape(); shape.moveTo(-h * 0.45, 0); shape.quadraticCurveTo(-h * 0.35, h * 0.55, h * 0.05, h); shape.quadraticCurveTo(h * 0.3, h * 0.45, h * 0.45, 0); shape.lineTo(0, -h * 0.08); shape.closePath();
  const geo = new THREE.ExtrudeGeometry(shape, { depth: h * 0.12, bevelEnabled: true, bevelSize: h * 0.04, bevelThickness: h * 0.04, bevelSegments: 2, curveSegments: 6 });
  const m = new THREE.Mesh(geo, mat('tooth', () => new THREE.MeshStandardMaterial({ color: 0x3a3228, roughness: 0.35, metalness: 0.15 }))); m.rotation.x = -1.2; m.position.y = h * 0.06; g.add(m); return g;
}
