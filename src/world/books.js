// Einzelne, gestaltete Bücher (Rücken + Deckel aus Code). Die Bücherliste steht in src/data/books.json.
import * as THREE from 'three';
import { TAU, mulberry32, hashStr } from '../lib/util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const hexCss = (n) => '#' + n.toString(16).padStart(6, '0');
const tint = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

// einfache goldene Motive für Deckel und Rücken
export function motif(g, kind, cx, cy, s, col = '#e6c262') {
  g.save(); g.translate(cx, cy); g.scale(s, s); g.fillStyle = col; g.strokeStyle = col; g.lineWidth = 0.06;
  const tri = (x, y, w, h) => { g.beginPath(); g.moveTo(x - w / 2, y); g.lineTo(x, y - h); g.lineTo(x + w / 2, y); g.closePath(); g.fill(); };
  switch (kind) {
    case 'pyramid': g.beginPath(); g.arc(0, -0.2, 0.5, 0, TAU); g.globalAlpha = 0.4; g.fill(); g.globalAlpha = 1; tri(-0.35, 0.5, 0.9, 0.8); tri(0.3, 0.5, 0.6, 0.5); g.fillRect(-0.9, 0.5, 1.8, 0.06); break;
    case 'dino': g.beginPath(); g.moveTo(-0.9, 0.5); g.quadraticCurveTo(-0.5, 0.05, -0.1, 0.1); g.quadraticCurveTo(0.2, -0.45, 0.5, -0.4); g.quadraticCurveTo(0.7, -0.45, 0.85, -0.3); g.lineTo(0.55, -0.2); g.quadraticCurveTo(0.4, 0.0, 0.2, 0.2); g.lineTo(0.28, 0.5); g.lineTo(0.15, 0.5); g.lineTo(0.0, 0.25); g.lineTo(-0.2, 0.5); g.lineTo(-0.33, 0.5); g.lineTo(-0.2, 0.2); g.closePath(); g.fill(); break;
    case 'flask': g.beginPath(); g.moveTo(-0.14, -0.7); g.lineTo(0.14, -0.7); g.lineTo(0.14, -0.2); g.lineTo(0.6, 0.55); g.lineTo(-0.6, 0.55); g.lineTo(-0.14, -0.2); g.closePath(); g.fill(); g.globalAlpha = 0.5; g.fillStyle = '#0a3a3a'; g.beginPath(); g.moveTo(-0.38, 0.2); g.lineTo(0.38, 0.2); g.lineTo(0.5, 0.45); g.lineTo(-0.5, 0.45); g.closePath(); g.fill(); break;
    case 'atom': for (let k = 0; k < 3; k++) { g.save(); g.rotate((k * Math.PI) / 3); g.beginPath(); g.ellipse(0, 0, 0.75, 0.28, 0, 0, TAU); g.stroke(); g.restore(); } g.beginPath(); g.arc(0, 0, 0.12, 0, TAU); g.fill(); break;
    case 'leaf': g.beginPath(); g.moveTo(0, 0.7); g.quadraticCurveTo(-0.7, 0.1, 0, -0.7); g.quadraticCurveTo(0.7, 0.1, 0, 0.7); g.fill(); g.globalAlpha = 0.5; g.strokeStyle = '#0a2a14'; g.beginPath(); g.moveTo(0, 0.7); g.lineTo(0, -0.5); g.stroke(); break;
    case 'book': g.beginPath(); g.moveTo(0, -0.4); g.quadraticCurveTo(-0.4, -0.55, -0.8, -0.4); g.lineTo(-0.8, 0.5); g.quadraticCurveTo(-0.4, 0.35, 0, 0.5); g.quadraticCurveTo(0.4, 0.35, 0.8, 0.5); g.lineTo(0.8, -0.4); g.quadraticCurveTo(0.4, -0.55, 0, -0.4); g.fill(); break;
    default: g.beginPath(); for (let k = 0; k < 8; k++) { const a = (k / 8) * TAU; g.lineTo(Math.cos(a) * (k % 2 ? 0.3 : 0.6), Math.sin(a) * (k % 2 ? 0.3 : 0.6)); } g.closePath(); g.fill();
  }
  g.restore();
}

// Deckel (Hochformat): Leinen, goldener Rahmen, Titel, Motiv
export function coverTexture(def, { w = 512, h = 720, soon = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const base = def.color ?? 0x7b1f26, rnd = mulberry32(hashStr(def.id || def.title || 'x'));
  const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, tint(base, 1.18)); gr.addColorStop(1, tint(base, 0.78)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.14; for (let y = 0; y < h; y += 3) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(0, y, w, 1.4); } for (let x = 0; x < w; x += 3) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(x, 0, 1.4, h); } g.globalAlpha = 1;
  const v = g.createRadialGradient(w / 2, h / 2, h * 0.2, w / 2, h / 2, h * 0.75); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(0,0,0,.4)'); g.fillStyle = v; g.fillRect(0, 0, w, h);
  const acc = hexCss(def.accent ?? 0xe6c262);
  g.strokeStyle = acc; g.lineWidth = 6; g.strokeRect(26, 26, w - 52, h - 52); g.lineWidth = 2; g.strokeRect(40, 40, w - 80, h - 80);
  g.fillStyle = acc; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
  const words = (def.title || '').split(' '); const lines = []; let cur = '';
  for (const wd of words) { if ((cur + ' ' + wd).trim().length > 14 && cur) { lines.push(cur); cur = wd; } else cur = (cur + ' ' + wd).trim(); } if (cur) lines.push(cur);
  const fs = lines.length > 3 ? 50 : 62; g.font = `bold ${fs}px ${SERIF}`; let y = 120; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 4; g.shadowOffsetY = 2;
  for (const ln of lines) { g.fillText(ln, w / 2, y, w - 120); y += fs * 1.12; }
  g.shadowColor = 'transparent'; motif(g, def.motif || 'star', w / 2, h * 0.58, 130, acc);
  g.font = `italic 30px ${SERIF}`; g.fillText(def.subtitle || '', w / 2, h - 96, w - 110);
  g.font = `bold 20px ${SERIF}`; g.globalAlpha = 0.8; g.fillText(soon ? 'BALD' : 'POPUP-BUCH', w / 2, h - 62); g.globalAlpha = 1;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// Rücken (Hochformat 1:6): Titel senkrecht (von oben nach unten), Zierbänder, Motiv unten
export function spineTexture(def, { w = 160, h = 960, soon = false } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  const base = soon ? 0x8a8478 : (def.color ?? 0x7b1f26), acc = soon ? '#d8d2c2' : hexCss(def.accent ?? 0xe6c262);
  const gr = g.createLinearGradient(0, 0, w, 0); gr.addColorStop(0, tint(base, 0.78)); gr.addColorStop(0.5, tint(base, 1.14)); gr.addColorStop(1, tint(base, 0.8)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const rnd = mulberry32(hashStr(def.id || 'b')); g.globalAlpha = 0.12; for (let y = 0; y < h; y += 3) { g.fillStyle = rnd() > 0.5 ? '#000' : '#fff'; g.fillRect(0, y, w, 1.3); } g.globalAlpha = 1;
  g.strokeStyle = acc; g.fillStyle = acc;
  for (const y of [40, 56, h - 56, h - 40]) { g.lineWidth = y === 40 || y === h - 40 ? 5 : 2; g.beginPath(); g.moveTo(8, y); g.lineTo(w - 8, y); g.stroke(); }
  g.save(); g.translate(w / 2, h / 2 - 30); g.rotate(Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle';
  let fs = 62; g.font = `bold ${fs}px ${SERIF}`; const tw = g.measureText(def.title || '').width, maxW = h - 330; if (tw > maxW) { fs = Math.floor(fs * maxW / tw); g.font = `bold ${fs}px ${SERIF}`; }
  g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 3; g.fillText(def.title || '', 0, 0); g.restore(); g.shadowColor = 'transparent';
  motif(g, def.motif || 'star', w / 2, h - 118, 36, acc);
  if (soon) { g.save(); g.translate(w / 2, 150); g.rotate(Math.PI / 2); g.font = `bold 34px ${SERIF}`; g.textAlign = 'center'; g.fillText('BALD', 0, 10); g.restore(); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}

// Ein Buch als Quader: Rücken schaut nach +z (steht im Regal). Maße in m: t Dicke (x), h Höhe (y), d Tiefe (z)
export function makeBook(def, { t = 0.05, h = 0.3, d = 0.21, soon = false } = {}) {
  const spine = new THREE.MeshStandardMaterial({ map: spineTexture(def, { soon }), roughness: 0.6, metalness: 0.05 });
  const cover = new THREE.MeshStandardMaterial({ map: coverTexture(def, { soon }), roughness: 0.62, metalness: 0.04 });
  const back = new THREE.MeshStandardMaterial({ color: def.color ?? 0x7b1f26, roughness: 0.7 });
  const pages = new THREE.MeshStandardMaterial({ color: 0xe9dcc0, roughness: 0.95 });
  // BoxGeometry-Reihenfolge: +x, -x, +y, -y, +z, -z
  const geo = new THREE.BoxGeometry(t, h, d);
  const m = new THREE.Mesh(geo, [cover, back, pages, pages, spine, pages]); m.castShadow = false; m.receiveShadow = true;
  const g = new THREE.Group(); m.position.y = h / 2; g.add(m); g.userData = { def, book: m, size: { t, h, d }, soon };
  m.userData.bookGroup = g; return g;
}

export function loadBooks(json) {
  return json.map((b) => ({ ...b, color: typeof b.color === 'string' ? parseInt(b.color.replace('#', ''), 16) : b.color, accent: typeof b.accent === 'string' ? parseInt(b.accent.replace('#', ''), 16) : b.accent }));
}
