// Biologie: Farben, Texturen und Materialien des Gewächshaus-Raums (alles im Code, gecacht).
import * as THREE from 'three';
import { fbm, mulberry32, clamp, TAU } from '../../../lib/util.js';
import { M, mat } from '../../kit.js';

export const GREEN = '#3f8f5a';
export const SERIF = 'Georgia, "Times New Roman", serif';
const cache = new Map();
export const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };

export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function texOf(c, { wrap = false, repeat = [1, 1], aniso = 8, srgb = true } = {}) {
  const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso;
  if (wrap) { t.wrapS = t.wrapT = THREE.RepeatWrapping; } t.repeat.set(repeat[0], repeat[1]); return t;
}

// ------------------------------------------------------------------ Boden: cremefarbene Fliesen mit grünen Rauten (Orangerie)
export function floorTex() {
  return memo('bio-floor', () => {
    const [c, g] = canvas(512, 512), W = 512, n = 8, cs = W / n, rnd = mulberry32(31);
    const img = g.createImageData(W, W), tones = Array.from({ length: n * n }, (_, k) => 0.93 + mulberry32(k * 131 + 5)() * 0.12);
    for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
      const cx = Math.floor(x / cs), cy = Math.floor(y / cs), i = (y * W + x) * 4;
      const tone = tones[cy * n + cx];
      const v = tone + fbm(x * 0.03, y * 0.03, 3) * 0.12 + (rnd() - 0.5) * 0.025;
      const ex = Math.min(x % cs, cs - (x % cs)), ey = Math.min(y % cs, cs - (y % cs)), edge = Math.min(ex, ey);
      const grout = edge < 1.5 ? 0.78 : 1;
      img.data[i] = clamp(226 * v * grout, 0, 255); img.data[i + 1] = clamp(214 * v * grout, 0, 255); img.data[i + 2] = clamp(186 * v * grout, 0, 255); img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    // kleine grüne Rauten auf den Fugenkreuzen (am Rand halbiert, ergänzt sich beim Wiederholen) und terrakottafarbene Punkte
    for (let j = 0; j <= n; j++) for (let i = 0; i <= n; i++) {
      const X = i * cs, Y = j * cs;
      g.fillStyle = 'rgba(62,120,84,.85)'; g.beginPath(); g.moveTo(X, Y - 9); g.lineTo(X + 9, Y); g.lineTo(X, Y + 9); g.lineTo(X - 9, Y); g.closePath(); g.fill();
      if (i < n && j < n) { g.fillStyle = 'rgba(190,110,70,.35)'; g.beginPath(); g.arc(X + cs / 2, Y + cs / 2, 4, 0, TAU); g.fill(); }
    }
    return texOf(c, { wrap: true });
  });
}

// ------------------------------------------------------------------ Wandvertäfelung: salbeigrüne Holzbretter mit Nut
export function wainscotTex() {
  return memo('bio-wainscot', () => {
    const [c, g] = canvas(512, 512), n = 13, bw = 512 / n, rnd = mulberry32(8);
    for (let i = 0; i < n; i++) {
      const v = 0.94 + rnd() * 0.1, x = i * bw;
      g.fillStyle = `rgb(${86 * v | 0},${134 * v | 0},${98 * v | 0})`; g.fillRect(x, 0, bw, 512);
      g.globalAlpha = 0.07; g.strokeStyle = '#102a18'; g.lineWidth = 1; for (let k = 0; k < 14; k++) { const xx = x + 3 + rnd() * (bw - 6); g.beginPath(); g.moveTo(xx, 0); g.lineTo(xx + (rnd() - 0.5) * 3, 512); g.stroke(); } g.globalAlpha = 1;
      g.fillStyle = 'rgba(0,0,0,.34)'; g.fillRect(x, 0, 2.2, 512); g.fillStyle = 'rgba(255,255,255,.16)'; g.fillRect(x + 2.4, 0, 1.4, 512);
    }
    return texOf(c, { wrap: true });
  });
}
export const wainscotMat = () => mat('bio-wainscot-mat', () => new THREE.MeshStandardMaterial({ map: wainscotTex(), roughness: 0.55 }));
export const floorMat = () => mat('bio-floor-mat', () => new THREE.MeshStandardMaterial({ map: floorTex(), roughness: 0.42, metalness: 0.02 }));

// ------------------------------------------------------------------ Oberlicht: Himmel, Wolken, Laubschatten, Sprossen
export function skyTex() {
  return memo('bio-sky', () => {
    const W = 1024, H = 1024, [c, g] = canvas(W, H), rnd = mulberry32(77);
    const gr = g.createRadialGradient(W / 2, H / 2, 40, W / 2, H / 2, W * 0.75); gr.addColorStop(0, '#ffffff'); gr.addColorStop(0.55, '#e8f5ff'); gr.addColorStop(1, '#b9dcf5');
    g.fillStyle = gr; g.fillRect(0, 0, W, H);
    for (let i = 0; i < 46; i++) { // weiche Wolken
      const x = rnd() * W, y = rnd() * H, r = 50 + rnd() * 120, cg = g.createRadialGradient(x, y, 0, x, y, r); cg.addColorStop(0, 'rgba(255,255,255,.55)'); cg.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = cg; g.beginPath(); g.ellipse(x, y, r * 1.6, r * 0.6, 0.2, 0, TAU); g.fill();
    }
    // Laubschatten von Bäumen draußen (in den Ecken, sehr weich)
    for (const [x0, y0] of [[0, 0], [W, 0], [0, H], [W, H]]) for (let i = 0; i < 26; i++) {
      const a = rnd() * TAU, d = rnd() * 330, x = x0 + Math.cos(a) * d * (x0 ? -1 : 1) * 0.9, y = y0 + Math.sin(a) * d * (y0 ? -1 : 1) * 0.9, r = 14 + rnd() * 42;
      g.fillStyle = `rgba(${40 + rnd() * 30 | 0},${100 + rnd() * 50 | 0},${60 + rnd() * 30 | 0},${0.12 + rnd() * 0.16})`; g.beginPath(); g.ellipse(x, y, r, r * 0.55, rnd() * 3, 0, TAU); g.fill();
    }
    return texOf(c, { srgb: true });
  });
}
// Lichtfleck auf dem Boden (additiv): helles Rechteck mit dunklen Sprossen-Schatten, weiche Ränder
export function lightPatchTex(cols = 4, rows = 5) {
  return memo(`bio-patch${cols}x${rows}`, () => {
    const W = 512, [c, g] = canvas(W, W);
    g.fillStyle = '#000'; g.fillRect(0, 0, W, W);
    const m = 56; g.fillStyle = '#fff'; g.fillRect(m, m, W - 2 * m, W - 2 * m);
    g.fillStyle = '#000'; for (let i = 1; i < cols; i++) g.fillRect(m + (W - 2 * m) * i / cols - 3, m, 6, W - 2 * m); for (let j = 1; j < rows; j++) g.fillRect(m, m + (W - 2 * m) * j / rows - 3, W - 2 * m, 6);
    g.filter = 'blur(10px)'; g.drawImage(c, 0, 0); g.filter = 'none';
    return texOf(c, { srgb: false });
  });
}
// senkrechter Lichtstrahl (additiv): weicher Verlauf nach unten und zu den Seiten
export function beamTex() {
  return memo('bio-beam', () => {
    const [c, g] = canvas(64, 256), W = 64, H = 256;
    const img = g.createImageData(W, H);
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const u = Math.abs(x / (W - 1) - 0.5) * 2, v = y / (H - 1); const a = Math.pow(1 - u, 1.6) * (0.25 + 0.75 * (1 - v)) * Math.min(1, v * 8 + 0.2) * 255; const i = (y * W + x) * 4; img.data[i] = img.data[i + 1] = img.data[i + 2] = a; img.data[i + 3] = 255; }
    g.putImageData(img, 0, 0); return texOf(c, { srgb: false });
  });
}

// ------------------------------------------------------------------ Materialien
export const trimMat = () => M.plain(0xf1ead6, 0.62);
export const paintGreen = () => M.plain(0x6f9c7a, 0.6);
export const ironGreen = () => mat('bio-iron', () => new THREE.MeshStandardMaterial({ color: 0x2f4a3a, roughness: 0.45, metalness: 0.5 }));
export const terracotta = () => M.plain(0xb8643c, 0.88);
export const BOOK_PALETTE = [0x2f6a4a, 0x4b8a5a, 0x7ab07a, 0x1f4a3f, 0xc9a24a, 0xe3d3a2, 0x9a5a38, 0x2c5a6e, 0x6a8a3a, 0xb4533a, 0x8b7a4a, 0x3a7a78, 0xd8c08a, 0x5a3a52];

// Beschriftungsschild als Messingplatte (Canvas), liefert Mesh
export function brassSign(text, { w = 0.9, h = 0.22, px = 64, sub = '', color = '#f6e7b0', bg = '#2c5a3e' } = {}) {
  const key = `sign|${text}|${sub}|${w}|${h}|${bg}`;
  const tex = memo(key, () => {
    const cw = 640, ch = Math.round(640 * h / w), [c, g] = canvas(cw, ch);
    const gr = g.createLinearGradient(0, 0, 0, ch); gr.addColorStop(0, '#f2d88a'); gr.addColorStop(0.3, '#c99a3c'); gr.addColorStop(0.55, '#f0d27a'); gr.addColorStop(1, '#9a6d1c'); g.fillStyle = gr; g.fillRect(0, 0, cw, ch);
    g.fillStyle = bg; g.fillRect(14, 14, cw - 28, ch - 28); g.strokeStyle = '#e6c262'; g.lineWidth = 3; g.strokeRect(22, 22, cw - 44, ch - 44);
    g.fillStyle = color; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${px}px ${SERIF}`; g.fillText(text, cw / 2, sub ? ch * 0.42 : ch / 2 + 2, cw - 70);
    if (sub) { g.font = `italic ${px * 0.42}px ${SERIF}`; g.globalAlpha = 0.9; g.fillText(sub, cw / 2, ch * 0.78, cw - 70); g.globalAlpha = 1; }
    return texOf(c);
  });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat(`signmat|${key}`, () => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.4, metalness: 0.35 })));
}

// Fries (Blatt- und Blütengirlande) für den oberen Wandstreifen, nahtlos wiederholbar
export function friezeTex() {
  return memo('bio-frieze', () => {
    const W = 1024, H = 128, [c, g] = canvas(W, H), rnd = mulberry32(19);
    g.fillStyle = '#d4e6c4'; g.fillRect(0, 0, W, H);
    g.fillStyle = '#9cc08a'; g.fillRect(0, 0, W, 6); g.fillRect(0, H - 6, W, 6); g.fillStyle = '#e9d9a0'; g.fillRect(0, 8, W, 2); g.fillRect(0, H - 10, W, 2);
    const leaf = (x, y, a, l, col) => { g.save(); g.translate(x, y); g.rotate(a); g.beginPath(); g.moveTo(0, 0); g.bezierCurveTo(l * 0.3, -l * 0.28, l * 0.75, -l * 0.22, l, 0); g.bezierCurveTo(l * 0.75, l * 0.22, l * 0.3, l * 0.28, 0, 0); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(30,70,40,.5)'; g.lineWidth = 1.2; g.stroke(); g.strokeStyle = 'rgba(240,250,220,.55)'; g.beginPath(); g.moveTo(2, 0); g.lineTo(l * 0.9, 0); g.stroke(); g.restore(); };
    const flower = (x, y, r, col) => { for (let i = 0; i < 6; i++) { g.save(); g.translate(x, y); g.rotate((i / 6) * TAU); g.beginPath(); g.ellipse(0, -r * 0.62, r * 0.28, r * 0.5, 0, 0, TAU); g.fillStyle = col; g.fill(); g.strokeStyle = 'rgba(120,70,70,.45)'; g.lineWidth = 1; g.stroke(); g.restore(); } g.beginPath(); g.arc(x, y, r * 0.25, 0, TAU); g.fillStyle = '#f2c43a'; g.fill(); };
    // Ranke in Wellenlinie
    g.strokeStyle = '#4f8a56'; g.lineWidth = 4; g.lineCap = 'round'; g.beginPath(); for (let x = 0; x <= W; x += 8) { const y = H / 2 + Math.sin((x / W) * TAU * 4) * 26; if (x) g.lineTo(x, y); else g.moveTo(x, y); } g.stroke();
    for (let i = 0; i < 32; i++) { const x = (i / 32) * W + 16, y = H / 2 + Math.sin((x / W) * TAU * 4) * 26, s = i % 2 ? 1 : -1; leaf(x, y, s * 0.9 + (rnd() - 0.5) * 0.3, 30 + rnd() * 10, i % 3 ? '#6fae6a' : '#8cc47a'); leaf(x, y, -s * 0.9 + (rnd() - 0.5) * 0.3, 24 + rnd() * 8, i % 3 ? '#5f9e5c' : '#7cb86c'); }
    for (let i = 0; i < 8; i++) { const x = (i / 8) * W + 64, y = H / 2 + Math.sin((x / W) * TAU * 4) * 26; flower(x, y, 20, i % 2 ? '#f6f0e0' : '#f4b8b0'); }
    return texOf(c, { wrap: true });
  });
}

// Glas ohne Beleuchtung (billig zu zeichnen): einfarbig oder mit schrägem Lichtstreifen
export const glassMat = () => mat('bio-glass', () => new THREE.MeshBasicMaterial({ color: 0xd4eef4, transparent: true, opacity: 0.13, depthWrite: false }));
export const glassSheen = () => mat('bio-glass-sheen', () => {
  const [c, g] = canvas(256, 256); g.fillStyle = 'rgba(214,238,244,.11)'; g.fillRect(0, 0, 256, 256);
  for (const [x, w, a] of [[40, 34, 0.16], [110, 12, 0.14], [150, 6, 0.1]]) { const gr = g.createLinearGradient(x, 0, x + w, 0); gr.addColorStop(0, 'rgba(255,255,255,0)'); gr.addColorStop(0.5, `rgba(255,255,255,${a})`); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.save(); g.translate(128, 128); g.rotate(0.55); g.translate(-128, -128); g.fillStyle = gr; g.fillRect(x - 100, -100, w + 200, 460); g.restore(); }
  return new THREE.MeshBasicMaterial({ map: texOf(c), transparent: true, depthWrite: false });
});
