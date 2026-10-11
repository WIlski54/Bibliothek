// Prozedurale Texturen für die Bibliothek (alles im Code, keine Bilddateien). Alle Fabriken sind gecacht.
import * as THREE from 'three';
import { fbm, mulberry32, clamp, TAU } from '../lib/util.js';

const cache = new Map();
const memo = (key, fn) => { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); };

function canvasTex(w, h, draw, { repeat = [1, 1], srgb = true, aniso = 8 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  draw(c.getContext('2d'), w, h);
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); t.anisotropy = aniso;
  return t;
}
const rgb = (c) => (Array.isArray(c) ? c : [(c >> 16) & 255, (c >> 8) & 255, c & 255]);

// Holzmaserung (Dielen oder Furnier). dir 'x': Maserung entlang x
export function woodTex({ base = 0x7a4a2a, planks = 5, w = 512, h = 512, seed = 3, contrast = 1, plankLines = true, repeat = [1, 1] } = {}) {
  return memo(`wood${base}|${planks}|${seed}|${contrast}|${plankLines}|${repeat}`, () => canvasTex(w, h, (g, W, H) => {
    const [br, bg, bb] = rgb(base); const rnd = mulberry32(seed);
    const img = g.createImageData(W, H), ph = H / planks, tint = [], off = [];
    for (let i = 0; i < planks; i++) { tint.push(0.82 + rnd() * 0.36); off.push(rnd() * 100); }
    for (let y = 0; y < H; y++) {
      const pi = Math.min(planks - 1, Math.floor(y / ph)); const seam = Math.min(y - pi * ph, (pi + 1) * ph - y);
      for (let x = 0; x < W; x++) {
        const warp = fbm(x * 0.004 + off[pi], y * 0.02, 3) * 5.0;
        const ring = Math.sin((y * 0.5 + warp * 14 + off[pi] * 3) * 0.2);
        const fine = fbm(x * 0.03, y * 0.8 + off[pi], 2);
        let v = 0.5 + (ring * 0.16 + fine * 0.28) * contrast;
        if (plankLines && seam < 1.8) v *= 0.4 + seam * 0.3;
        const t = tint[pi], i = (y * W + x) * 4;
        img.data[i] = clamp(br * (0.45 + v * 0.9) * t, 0, 255); img.data[i + 1] = clamp(bg * (0.45 + v * 0.9) * t, 0, 255); img.data[i + 2] = clamp(bb * (0.45 + v * 0.9) * t, 0, 255); img.data[i + 3] = 255;
      }
    }
    g.putImageData(img, 0, 0);
  }, { repeat }));
}

// Schachbrett aus hellem und dunklem Marmor mit Adern
export function marbleTex({ n = 4, seed = 5, light = [236, 230, 218], dark = [58, 52, 50], repeat = [1, 1] } = {}) {
  return memo(`marble${n}|${seed}|${light}|${dark}|${repeat}`, () => canvasTex(512, 512, (g, W, H) => {
    const img = g.createImageData(W, H), cs = W / n;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const cx = Math.floor(x / cs), cy = Math.floor(y / cs), isDark = (cx + cy) % 2 === 1;
      const base = isDark ? dark : light;
      const vein = Math.abs(Math.sin((x * 0.011 + fbm(x * 0.006 + seed * cx, y * 0.006 + seed * cy, 4) * 6) * 3.1)); // dünne Adern
      const v = 0.92 + fbm(x * 0.012, y * 0.012, 3) * 0.28 - (vein < 0.06 ? 0.16 : 0);
      const edge = Math.min(x % cs, cs - (x % cs), y % cs, cs - (y % cs));
      const e = edge < 1.3 ? 0.7 : 1;
      const i = (y * W + x) * 4;
      img.data[i] = clamp(base[0] * v * e, 0, 255); img.data[i + 1] = clamp(base[1] * v * e, 0, 255); img.data[i + 2] = clamp(base[2] * v * e, 0, 255); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { repeat }));
}

// Fliesen (Chemieraum): glasierte Wandfliesen mit Fugen
export function tileTex({ color = [104, 170, 168], grout = [220, 222, 216], n = 8, seed = 9, repeat = [1, 1] } = {}) {
  return memo(`tile${color}|${n}|${seed}|${repeat}`, () => canvasTex(512, 512, (g, W, H) => {
    const rnd = mulberry32(seed); g.fillStyle = `rgb(${grout})`; g.fillRect(0, 0, W, H); const cs = W / n;
    for (let j = 0; j < n; j++) for (let i = 0; i < n; i++) {
      const v = 0.92 + rnd() * 0.16, x = i * cs + 2, y = j * cs + 2, s = cs - 4;
      const gr = g.createLinearGradient(x, y, x + s, y + s);
      gr.addColorStop(0, `rgb(${color.map((c) => clamp(c * v * 1.12, 0, 255) | 0)})`); gr.addColorStop(1, `rgb(${color.map((c) => clamp(c * v * 0.9, 0, 255) | 0)})`);
      g.fillStyle = gr; g.beginPath(); g.roundRect(x, y, s, s, 5); g.fill();
      g.fillStyle = 'rgba(255,255,255,.18)'; g.beginPath(); g.roundRect(x + 4, y + 4, s * 0.6, 4, 2); g.fill();
    }
  }, { repeat }));
}

// Teppich mit Bordüre und Ornament
export function carpetTex({ field = [120, 34, 36], accent = [214, 170, 80], second = [28, 52, 96], seed = 2, repeat = [1, 1] } = {}) {
  return memo(`carpet${field}|${accent}|${second}|${repeat}`, () => canvasTex(512, 512, (g, W, H) => {
    const rnd = mulberry32(seed); g.fillStyle = `rgb(${field})`; g.fillRect(0, 0, W, H);
    // Fasern
    for (let i = 0; i < 9000; i++) { g.fillStyle = `rgba(${rnd() < 0.5 ? '0,0,0' : '255,230,200'},${0.03 + rnd() * 0.05})`; g.fillRect(rnd() * W, rnd() * H, 1 + rnd() * 3, 1); }
    const frame = (inset, lw, col) => { g.strokeStyle = col; g.lineWidth = lw; g.strokeRect(inset, inset, W - 2 * inset, H - 2 * inset); };
    frame(18, 14, `rgb(${second})`); frame(40, 4, `rgb(${accent})`); frame(56, 10, `rgb(${second})`); frame(74, 3, `rgb(${accent})`);
    // Mittelmedaillon
    g.save(); g.translate(W / 2, H / 2);
    for (let k = 0; k < 8; k++) { g.rotate(TAU / 8); g.fillStyle = `rgb(${k % 2 ? accent : second})`; g.beginPath(); g.ellipse(0, -62, 22, 54, 0, 0, TAU); g.fill(); }
    g.fillStyle = `rgb(${accent})`; g.beginPath(); g.arc(0, 0, 32, 0, TAU); g.fill(); g.fillStyle = `rgb(${field})`; g.beginPath(); g.arc(0, 0, 20, 0, TAU); g.fill();
    g.restore();
    // Eckornamente
    for (const [x, y] of [[110, 110], [W - 110, 110], [110, H - 110], [W - 110, H - 110]]) { g.fillStyle = `rgb(${accent})`; g.beginPath(); g.arc(x, y, 14, 0, TAU); g.fill(); g.fillStyle = `rgb(${second})`; g.beginPath(); g.arc(x, y, 7, 0, TAU); g.fill(); }
  }, { repeat }));
}

// Tapete mit Damast-Muster (Rauten + Blüten)
export function wallpaperTex({ base = [96, 24, 30], ink = [170, 120, 70], repeat = [1, 1], seed = 4 } = {}) {
  return memo(`wp${base}|${ink}|${repeat}`, () => canvasTex(256, 256, (g, W, H) => {
    g.fillStyle = `rgb(${base})`; g.fillRect(0, 0, W, H); const rnd = mulberry32(seed);
    for (let i = 0; i < 2500; i++) { g.fillStyle = `rgba(0,0,0,${rnd() * 0.06})`; g.fillRect(rnd() * W, rnd() * H, 2, 2); }
    g.strokeStyle = `rgba(${ink},.55)`; g.fillStyle = `rgba(${ink},.45)`; g.lineWidth = 2;
    for (const [cx, cy] of [[0, 0], [W, 0], [0, H], [W, H], [W / 2, H / 2]]) {
      g.save(); g.translate(cx, cy);
      g.beginPath(); g.moveTo(0, -56); g.quadraticCurveTo(34, -20, 0, 56); g.quadraticCurveTo(-34, -20, 0, -56); g.stroke();
      g.beginPath(); g.ellipse(0, 0, 12, 22, 0, 0, TAU); g.fill();
      for (let k = 0; k < 6; k++) { g.rotate(TAU / 6); g.beginPath(); g.ellipse(0, -30, 6, 14, 0, 0, TAU); g.fill(); }
      g.restore();
    }
  }, { repeat }));
}

// Putz / Kalk mit feiner Körnung
export function plasterTex({ color = [236, 226, 206], repeat = [1, 1], seed = 6 } = {}) {
  return memo(`plaster${color}|${repeat}`, () => canvasTex(256, 256, (g, W, H) => {
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const v = 0.97 + fbm(x * 0.05, y * 0.05, 4) * 0.07 + (mulberry32(x * 7919 + y * 104729 + seed)() - 0.5) * 0.04, i = (y * W + x) * 4;
      img.data[i] = clamp(color[0] * v, 0, 255); img.data[i + 1] = clamp(color[1] * v, 0, 255); img.data[i + 2] = clamp(color[2] * v, 0, 255); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
  }, { repeat }));
}

// Brüniertes Messing / Gold als Verlaufstextur (für Rahmen, Leisten, Schilder)
export function brassTex() {
  return memo('brass', () => canvasTex(64, 256, (g, W, H) => {
    const gr = g.createLinearGradient(0, 0, 0, H);
    gr.addColorStop(0, '#fff0b3'); gr.addColorStop(0.18, '#c99a3c'); gr.addColorStop(0.45, '#f3d57a'); gr.addColorStop(0.7, '#9a6d1c'); gr.addColorStop(1, '#e6c262');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
  }));
}

// Schild mit Text (Messing, Holz oder Papier): liefert Canvas-Textur
export function labelTex(text, { w = 512, h = 128, bg = '#3a1d10', fg = '#f6dc8a', font = 'bold 56px Georgia, serif', border = '#d9a441', sub = '', subFont = 'italic 28px Georgia, serif' } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16); g.lineWidth = 1.5; g.strokeRect(16, 16, w - 32, h - 32); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font; g.fillText(text, w / 2, sub ? h * 0.42 : h / 2, w - 48);
  if (sub) { g.font = subFont; g.fillStyle = fg; g.globalAlpha = 0.85; g.fillText(sub, w / 2, h * 0.78, w - 48); }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; return t;
}
