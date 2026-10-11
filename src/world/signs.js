// Beschilderung aus Canvas: Fahnen in Abteilungsfarben, Lageplan, Türschilder
import * as THREE from 'three';
import { motif } from './books.js';
import { DEPT_COLORS } from './layout.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const toTex = (c) => { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t; };
const canvas = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const MOTIF_OF = { geschichte: 'pyramid', biologie: 'leaf', chemie: 'flask' };
export const DEPT_NAME = { geschichte: 'Geschichte', biologie: 'Biologie', chemie: 'Chemie' };

export function bannerTex(dept, { w = 300, h = 700 } = {}) {
  const [c, g] = canvas(w, h); const col = DEPT_COLORS[dept];
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, col); gr.addColorStop(1, shade(col, 0.62)); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.1; for (let y = 0; y < h; y += 4) { g.fillStyle = y % 8 ? '#000' : '#fff'; g.fillRect(0, y, w, 1.5); } g.globalAlpha = 1;
  g.strokeStyle = '#f0d27a'; g.lineWidth = 6; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 2; g.strokeRect(26, 26, w - 52, h - 52);
  g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.arc(w / 2, 250, 98, 0, Math.PI * 2); g.fill();
  motif(g, MOTIF_OF[dept], w / 2, 250, 112, '#f6dc8a');
  g.fillStyle = '#f6dc8a'; g.textAlign = 'center'; g.font = `bold 46px ${SERIF}`; g.shadowColor = 'rgba(0,0,0,.5)'; g.shadowBlur = 4; g.fillText(DEPT_NAME[dept], w / 2, 470, w - 70);
  g.shadowColor = 'transparent'; g.font = `italic 26px ${SERIF}`; g.globalAlpha = 0.9; g.fillText('Abteilung', w / 2, 520);
  g.beginPath(); for (let i = 0; i < 3; i++) { g.moveTo(w / 2 - 70 + i * 70, h - 100); g.lineTo(w / 2 - 55 + i * 70, h - 80); g.lineTo(w / 2 - 40 + i * 70, h - 100); } g.globalAlpha = 0.7; g.fill();
  return toTex(c);
}
function shade(hex, k) { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); }

// Lageplan: Foyer in der Mitte, Fachräume links, oben und rechts
export function planTex({ w = 900, h = 640, counts = {} } = {}) {
  const [c, g] = canvas(w, h);
  g.fillStyle = '#efe0bd'; g.fillRect(0, 0, w, h);
  g.globalAlpha = 0.1; for (let i = 0; i < 3000; i++) { g.fillStyle = Math.random() < 0.5 ? '#6a4a25' : '#fff'; g.fillRect(Math.random() * w, Math.random() * h, 2, 2); } g.globalAlpha = 1;
  g.strokeStyle = '#5a3a20'; g.lineWidth = 8; g.strokeRect(14, 14, w - 28, h - 28); g.lineWidth = 2; g.strokeRect(28, 28, w - 56, h - 56);
  g.fillStyle = '#5a3a20'; g.textAlign = 'center'; g.font = `bold 40px ${SERIF}`; g.fillText('Lageplan der großen Bibliothek', w / 2, 82);
  const room = (x, y, rw, rh, label, col, sub) => {
    g.fillStyle = col; g.globalAlpha = 0.92; g.fillRect(x, y, rw, rh); g.globalAlpha = 1; g.strokeStyle = '#3a2210'; g.lineWidth = 5; g.strokeRect(x, y, rw, rh);
    g.fillStyle = '#fff6dc'; g.font = `bold 34px ${SERIF}`; g.fillText(label, x + rw / 2, y + rh / 2 + (sub ? -4 : 10), rw - 20);
    if (sub) { g.font = `italic 22px ${SERIF}`; g.fillText(sub, x + rw / 2, y + rh / 2 + 28, rw - 20); }
  };
  const cx = w / 2, cy = 360;
  room(cx - 130, cy - 90, 260, 190, 'Foyer', '#8a6a48', 'hier beginnst du');
  room(cx - 130 - 50 - 200, cy - 80, 200, 170, 'Geschichte', DEPT_COLORS.geschichte, counts.geschichte);
  room(cx + 130 + 50, cy - 80, 200, 170, 'Chemie', DEPT_COLORS.chemie, counts.chemie);
  room(cx - 100, cy - 90 - 50 - 150, 200, 150, 'Biologie', DEPT_COLORS.biologie, counts.biologie);
  g.strokeStyle = '#efe0bd'; g.lineWidth = 14; for (const [x1, y1, x2, y2] of [[cx - 130, cy, cx - 180, cy], [cx + 130, cy, cx + 180, cy], [cx, cy - 90, cx, cy - 140]]) { g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.stroke(); }
  g.fillStyle = '#7b1f26'; g.beginPath(); g.arc(cx, cy + 70, 11, 0, Math.PI * 2); g.fill(); g.fillStyle = '#5a3a20'; g.font = `italic 22px ${SERIF}`; g.fillText('Eingang', cx, cy + 126);
  g.font = `italic 22px ${SERIF}`; g.fillText('Tippe auf einen Raum, um hinzugehen.', w / 2, h - 52);
  return toTex(c);
}
