// Bausteine für den Raum Geschichte: Messingschilder, Rahmen, Lichtschein, Teppiche, Stehlampe, Fries, Nischenwände, Schaukasten.
// Alles im Code gezeichnet; Materialien und Texturen werden gecacht und geteilt (Zusammenfassen in merge.js).
import * as THREE from 'three';
import { M, box, mesh, hitBox, mat } from '../../kit.js';
import { carpetTex, wallpaperTex, woodTex } from '../../tex.js';
import { mulberry32 } from '../../../lib/util.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const TAU = Math.PI * 2;
const cache = new Map();
const memo = (k, f) => { if (!cache.has(k)) cache.set(k, f()); return cache.get(k); };
// Holz aus wenigen gemeinsamen Maserungstexturen, nur eingefärbt (spart Ladezeit: jede Holztextur kostet ~150 ms)
export function W(hex, { planks = 1 } = {}) {
  const key = planks <= 1 ? 1 : planks <= 3 ? 3 : planks <= 6 ? 5 : 9, seed = { 1: 3, 3: 4, 5: 8, 9: 5 }[key];
  return mat(`gw${hex}|${key}`, () => new THREE.MeshStandardMaterial({ map: woodTex({ base: 0xe0e0e0, planks: key, seed }), color: new THREE.Color(hex).multiplyScalar(1.4), roughness: 0.62, metalness: 0.02 }));
}
export const cv = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; };
export const tex = (c, { repeat = null, aniso = 8, srgb = true } = {}) => { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; if (repeat) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repeat[0], repeat[1]); } return t; };

// ---------------------------------------------------------------- Messingschild
function brassFill(g, w, h) {
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, '#f6dc8c'); gr.addColorStop(0.35, '#d9aa4a'); gr.addColorStop(0.7, '#b98a30'); gr.addColorStop(1, '#e2bd62');
  g.fillStyle = gr; g.fillRect(0, 0, w, h);
  const r = mulberry32(5); g.globalAlpha = 0.12; for (let i = 0; i < 260; i++) { g.fillStyle = r() < 0.5 ? '#fff6cf' : '#6a4210'; g.fillRect(r() * w, r() * h, 20 + r() * 70, 1); } g.globalAlpha = 1;
}
export function brassPlateTex(text, { sub = '', w = 640, h = 160, size = 0.42, subSize = 0.2, dark = '#3a2208', screws = true } = {}) {
  const [c, g] = cv(w, h); brassFill(g, w, h);
  g.strokeStyle = dark; g.lineWidth = 3; g.strokeRect(10, 10, w - 20, h - 20); g.lineWidth = 1.2; g.strokeRect(17, 17, w - 34, h - 34);
  if (screws) for (const [x, y] of [[26, 26], [w - 26, 26], [26, h - 26], [w - 26, h - 26]]) { g.fillStyle = '#8a6420'; g.beginPath(); g.arc(x, y, 5, 0, TAU); g.fill(); g.strokeStyle = dark; g.lineWidth = 1.2; g.beginPath(); g.moveTo(x - 3.5, y - 1); g.lineTo(x + 3.5, y + 1); g.stroke(); }
  g.textAlign = 'center'; g.textBaseline = 'middle';
  const ty = sub ? h * 0.42 : h / 2; g.font = `bold ${Math.round(h * size)}px ${SERIF}`;
  g.fillStyle = 'rgba(255,246,200,.75)'; g.fillText(text, w / 2 + 1.5, ty + 1.5, w - 70); g.fillStyle = dark; g.fillText(text, w / 2, ty, w - 70);
  if (sub) { g.font = `italic ${Math.round(h * subSize)}px ${SERIF}`; g.fillStyle = 'rgba(255,246,200,.7)'; g.fillText(sub, w / 2 + 1, h * 0.76 + 1, w - 70); g.fillStyle = dark; g.fillText(sub, w / 2, h * 0.76, w - 70); }
  return tex(c);
}
const brassPlateMat = (t) => new THREE.MeshStandardMaterial({ map: t, metalness: 0.55, roughness: 0.42, envMapIntensity: 0.7 });
// Schild: Plane mit Messingtextur (an Wand oder Möbel). w,h in Metern
export function brassPlate(text, w, h, o = {}) {
  const t = brassPlateTex(text, { w: Math.round(1024 * Math.min(1, w / 0.9)) || 512, h: Math.round(1024 * Math.min(1, w / 0.9) * h / w) || 128, ...o });
  return new THREE.Mesh(new THREE.PlaneGeometry(w, h), brassPlateMat(t));
}
// Wandschild: Holzträger + Messingplatte, antippbar (tap)
export function wallSign(text, sub, w, h, tap = null, o = {}) {
  const g = new THREE.Group(); const wd = W(0x3a1d10, { planks: 1 });
  const back = box(w + 0.07, h + 0.07, 0.035, wd, { tile: 1 }); back.position.z = 0.0175; g.add(back);
  const px = Math.round(1200 * Math.min(1, w / 2.4) + 400);
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), brassPlateMat(brassPlateTex(text, { sub, w: px, h: Math.round(px * h / w), ...o }))); pl.position.z = 0.037; g.add(pl);
  if (tap) { const hb = hitBox(w + 0.1, h + 0.1, 0.1, tap); hb.position.z = 0.04; g.add(hb); }
  return g;
}

// ---------------------------------------------------------------- Lichtschein (additiv)
const glowTex = () => memo('glowTex', () => { const [c, g] = cv(128, 128); const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.35, 'rgba(255,255,255,.45)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c); });
const beamTex = () => memo('beamTex', () => { const [c, g] = cv(64, 256); const gr = g.createLinearGradient(0, 0, 0, 256); gr.addColorStop(0, 'rgba(255,255,255,.95)'); gr.addColorStop(1, 'rgba(255,255,255,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 256); const gx = g.createLinearGradient(0, 0, 64, 0); gx.addColorStop(0, 'rgba(0,0,0,1)'); gx.addColorStop(0.5, 'rgba(0,0,0,0)'); gx.addColorStop(1, 'rgba(0,0,0,1)'); g.globalCompositeOperation = 'destination-out'; g.fillStyle = gx; g.globalAlpha = 0.9; g.fillRect(0, 0, 64, 256); return tex(c); });
export const glowMat = (color = 0xffd890, opacity = 0.5, beam = false) => memo(`glow${color}|${opacity}|${beam}`, () => new THREE.MeshBasicMaterial({ map: beam ? beamTex() : glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false }));
// weicher Lichtfleck (Ellipse w x h), Vorderseite +z; renderOrder hoch
export function glow(w, h, color = 0xffd890, opacity = 0.5, beam = false) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glowMat(color, opacity, beam)); m.renderOrder = 5; return m; }

// ---------------------------------------------------------------- Mäander-Fries
export function friezeMat() {
  return memo('frieze', () => {
    const [c, g] = cv(512, 128); g.fillStyle = '#4a1d1a'; g.fillRect(0, 0, 512, 128);
    const gr = g.createLinearGradient(0, 0, 0, 128); gr.addColorStop(0, 'rgba(255,200,120,.10)'); gr.addColorStop(1, 'rgba(0,0,0,.25)'); g.fillStyle = gr; g.fillRect(0, 0, 512, 128);
    g.strokeStyle = '#d9b058'; g.lineCap = 'butt'; g.lineJoin = 'miter'; g.lineWidth = 8;
    g.beginPath(); g.moveTo(0, 18); g.lineTo(512, 18); g.moveTo(0, 110); g.lineTo(512, 110); g.stroke();
    g.lineWidth = 7; const s = 64; // Mäanderhaken je 64 px
    for (let x = 0; x < 512; x += s) { g.beginPath(); g.moveTo(x, 100); g.lineTo(x, 36); g.lineTo(x + 52, 36); g.lineTo(x + 52, 80); g.lineTo(x + 24, 80); g.lineTo(x + 24, 58); g.lineTo(x + 38, 58); g.stroke(); }
    g.fillStyle = '#d9b058'; for (let x = 0; x < 512; x += s) { g.beginPath(); g.arc(x + s, 64, 3.2, 0, TAU); g.fill(); }
    const t = tex(c, { repeat: [1, 1] }); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.7, metalness: 0.1 });
  });
}

// ---------------------------------------------------------------- Nischenwände (Samt mit Goldborte)
export function nicheMat(kind) {
  return memo('niche' + kind, () => {
    const W = 1024, H = 1024, [c, g] = cv(W, H), r = mulberry32(kind === 'lapis' ? 3 : 8);
    const base = kind === 'lapis' ? ['#1f3f86', '#142a5e', '#0d1d44'] : ['#2c5546', '#1f3f35', '#142a24'];
    const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, base[0]); gr.addColorStop(0.55, base[1]); gr.addColorStop(1, base[2]); g.fillStyle = gr; g.fillRect(0, 0, W, H);
    // Samtfalten (senkrechte weiche Streifen)
    for (let x = 0; x < W; x += 32) { const a = 0.05 + 0.04 * Math.sin(x * 0.07); g.fillStyle = `rgba(255,255,255,${a})`; g.fillRect(x, 0, 14, H); g.fillStyle = 'rgba(0,0,0,.08)'; g.fillRect(x + 16, 0, 16, H); }
    for (let i = 0; i < 4000; i++) { g.fillStyle = r() < 0.5 ? 'rgba(255,255,255,.04)' : 'rgba(0,0,0,.06)'; g.fillRect(r() * W, r() * H, 1 + r() * 2, 1 + r() * 2); }
    const star = (x, y, rad, col) => { g.fillStyle = col; g.beginPath(); for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i / 10) * TAU, rr = i % 2 ? rad * 0.42 : rad; g.lineTo(x + Math.cos(a) * rr, y + Math.sin(a) * rr); } g.closePath(); g.fill(); };
    if (kind === 'lapis') { for (let i = 0; i < 70; i++) star(60 + r() * (W - 120), 70 + r() * (H - 140), 5 + r() * 9, `rgba(240,200,100,${0.55 + r() * 0.4})`); }
    else { // goldene Lorbeerblätter in Reihen
      g.fillStyle = 'rgba(217,176,88,.5)'; for (let y = 90; y < H - 60; y += 96) for (let x = 64 + ((y / 96) % 2) * 48; x < W - 40; x += 96) { g.save(); g.translate(x, y); g.rotate(0.6); g.beginPath(); g.ellipse(0, 0, 8, 20, 0, 0, TAU); g.fill(); g.rotate(-1.2); g.beginPath(); g.ellipse(0, 0, 8, 20, 0, 0, TAU); g.fill(); g.restore(); }
    }
    // Goldborte
    g.strokeStyle = '#d9b058'; g.lineWidth = 10; g.strokeRect(14, 14, W - 28, H - 28); g.lineWidth = 3; g.strokeRect(34, 34, W - 68, H - 68);
    const t = tex(c); return new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, metalness: 0 });
  });
}

// ---------------------------------------------------------------- Teppich (dick, mit Fransen)
export function rug(w, d, { field = [118, 36, 30], accent = [222, 176, 86], second = [52, 28, 22], repeat = [1, 1], seed = 2 } = {}) {
  const g = new THREE.Group(); const t = 0.024;
  const body = box(w - 0.04, t, d - 0.04, M.fabric(0x5a1e1a), { tile: 0 }); body.position.y = t / 2; g.add(body);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat(`rugtop${w}|${d}|${field}|${accent}|${second}|${repeat}`, () => new THREE.MeshStandardMaterial({ map: carpetTex({ field, accent, second, repeat, seed }), roughness: 0.97 })));
  top.rotation.x = -Math.PI / 2; top.position.y = t + 0.0015; g.add(top);
  const fr = memo('fringe', () => { const [c, gg] = cv(256, 32); gg.strokeStyle = '#efe0b8'; gg.lineWidth = 3; for (let x = 4; x < 256; x += 7) { gg.beginPath(); gg.moveTo(x, 0); gg.lineTo(x + (x % 3 - 1) * 2, 28); gg.stroke(); } return new THREE.MeshStandardMaterial({ map: tex(c), transparent: true, roughness: 0.9, alphaTest: 0.4, side: THREE.DoubleSide }); });
  for (const s of [-1, 1]) { const geo = new THREE.PlaneGeometry(0.12, d - 0.1); geo.rotateX(-Math.PI / 2); geo.rotateY(s > 0 ? 0 : Math.PI); const f = new THREE.Mesh(geo, fr); f.position.set(s * (w / 2 + 0.05), 0.012, 0); g.add(f); }
  return g;
}

// ---------------------------------------------------------------- Stehlampe (Messing, Stoffschirm mit Glühen)
export function floorLamp({ h = 1.65, shade = 0xf1dcaa } = {}) {
  const g = new THREE.Group(); const brass = M.brass();
  const base = mesh(new THREE.CylinderGeometry(0.17, 0.2, 0.04, 24), brass); base.position.y = 0.02; g.add(base);
  const foot = mesh(new THREE.CylinderGeometry(0.06, 0.1, 0.1, 16), brass); foot.position.y = 0.09; g.add(foot);
  const stem = mesh(new THREE.CylinderGeometry(0.014, 0.018, h - 0.3, 10), brass); stem.position.y = 0.14 + (h - 0.3) / 2; g.add(stem);
  for (const y of [0.55, 1.0]) { const ring = mesh(new THREE.TorusGeometry(0.026, 0.01, 6, 14), brass); ring.rotation.x = Math.PI / 2; ring.position.y = y; g.add(ring); }
  const sh = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.23, 0.3, 24, 1, true), mat(`lampshade${shade}`, () => new THREE.MeshStandardMaterial({ color: shade, emissive: 0xffc870, emissiveIntensity: 0.85, roughness: 0.9, side: THREE.DoubleSide })));
  sh.position.y = h - 0.05; g.add(sh);
  const cap = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.03, 10), brass); cap.position.y = h + 0.1; g.add(cap);
  const bulb = mesh(new THREE.SphereGeometry(0.045, 10, 8), M.emissive(0xfff2c8, 4)); bulb.position.y = h - 0.12; g.add(bulb);
  return g;
}

// Bilderleuchte über einem Rahmen (Breite w), Vorderseite +z
export function pictureLight(w = 1.0) {
  const g = new THREE.Group(); const brass = M.brass();
  const bar = mesh(new THREE.CylinderGeometry(0.018, 0.018, w, 10), brass); bar.rotation.z = Math.PI / 2; bar.position.set(0, 0, 0.2); g.add(bar);
  const tube = mesh(new THREE.CylinderGeometry(0.01, 0.01, w * 0.86, 8), M.emissive(0xfff0c8, 3)); tube.rotation.z = Math.PI / 2; tube.position.set(0, -0.022, 0.2); g.add(tube);
  for (const x of [-w * 0.42, 0, w * 0.42]) { const arm = mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.2, 6), brass); arm.rotation.x = Math.PI / 2; arm.position.set(x, 0, 0.1); g.add(arm); }
  const plate = mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 12), brass); plate.rotation.x = Math.PI / 2; plate.position.set(0, 0, 0.01); g.add(plate);
  return g;
}

// ---------------------------------------------------------------- Rahmen (vergoldet) um eine Fläche w x h (Innenmaß); Rahmenbreite fw
export function gildedFrame(w, h, { fw = 0.16, depth = 0.1 } = {}) {
  const g = new THREE.Group(); const wd = W(0x4a1e12, { planks: 1 }), br = M.brass();
  const sides = [[0, h / 2 + fw / 2, w + 2 * fw, fw], [0, -h / 2 - fw / 2, w + 2 * fw, fw], [-w / 2 - fw / 2, 0, fw, h], [w / 2 + fw / 2, 0, fw, h]];
  for (const [x, y, ww, hh] of sides) { const b = box(ww, hh, depth, wd, { tile: 1 }); b.position.set(x, y, depth / 2); g.add(b); }
  // goldene Leisten innen und außen
  const lip = 0.028;
  for (const [x, y, ww, hh] of [[0, h / 2 + lip / 2, w + 2 * lip, lip], [0, -h / 2 - lip / 2, w + 2 * lip, lip], [-w / 2 - lip / 2, 0, lip, h], [w / 2 + lip / 2, 0, lip, h]]) { const b = box(ww, hh, 0.03, br); b.position.set(x, y, depth - 0.005); g.add(b); }
  const o = fw - 0.03; for (const [x, y, ww, hh] of [[0, h / 2 + fw - 0.015, w + 2 * fw, 0.03], [0, -h / 2 - fw + 0.015, w + 2 * fw, 0.03], [-w / 2 - fw + 0.015, 0, 0.03, h], [w / 2 + fw - 0.015, 0, 0.03, h]]) { const b = box(ww, hh, 0.024, br); b.position.set(x, y, depth + 0.002); g.add(b); }
  for (const [sx, sy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const r = mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16), br); r.rotation.x = Math.PI / 2; r.position.set(sx * (w / 2 + fw / 2), sy * (h / 2 + fw / 2), depth + 0.01); g.add(r); const r2 = mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.04, 12), M.plain(0x8a1f26, 0.5, 0.2)); r2.rotation.x = Math.PI / 2; r2.position.set(sx * (w / 2 + fw / 2), sy * (h / 2 + fw / 2), depth + 0.02); g.add(r2); }
  return g;
}

// ---------------------------------------------------------------- Schaukasten (Standvitrine)
// Liefert Group; userData.inner = Gruppe für das Exponat (Mitte der Standfläche), userData.top = Höhe der Standfläche
export function showcase({ w = 1.0, d = 0.72, plinthH = 0.92, glassH = 1.12, cloth = 0x6a1f26, wood = W(0x4a2416, { planks: 3, seed: 4 }) } = {}) {
  const g = new THREE.Group(); const br = M.brass();
  const foot = box(w + 0.06, 0.09, d + 0.06, wood, { tile: 1 }); foot.position.y = 0.045; g.add(foot);
  const body = box(w - 0.02, plinthH - 0.09 - 0.05, d - 0.02, wood, { tile: 1 }); body.position.y = 0.09 + (plinthH - 0.14) / 2; g.add(body);
  const panel = box(w - 0.22, plinthH - 0.36, 0.02, W(0x6a3220, { planks: 2, seed: 9 }), { tile: 0.6 }); panel.position.set(0, 0.09 + (plinthH - 0.14) / 2 + 0.02, d / 2 - 0.005); g.add(panel);
  for (const [x, y, ww, hh] of [[0, plinthH - 0.19, w - 0.2, 0.025], [0, 0.17, w - 0.2, 0.025], [-(w - 0.2) / 2, (plinthH - 0.02) / 2, 0.025, plinthH - 0.36], [(w - 0.2) / 2, (plinthH - 0.02) / 2, 0.025, plinthH - 0.36]]) { const b = box(ww, hh, 0.03, br); b.position.set(x, y, d / 2 + 0.006); g.add(b); }
  const cap = box(w + 0.08, 0.05, d + 0.08, wood, { tile: 1 }); cap.position.y = plinthH - 0.025; g.add(cap);
  const capb = box(w + 0.09, 0.012, d + 0.09, br); capb.position.y = plinthH + 0.003; g.add(capb);
  const top = box(w - 0.04, 0.03, d - 0.04, M.fabric(cloth), { tile: 0 }); top.position.y = plinthH + 0.015; g.add(top);
  const y0 = plinthH + 0.03;
  const gl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.06, glassH, d - 0.06), M.glass()); gl.position.y = y0 + glassH / 2; gl.renderOrder = 3; g.add(gl);
  for (const [sx, sz] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = box(0.028, glassH, 0.028, br); p.position.set(sx * (w / 2 - 0.03), y0 + glassH / 2, sz * (d / 2 - 0.03)); g.add(p); }
  for (const [x, z, ww, dd] of [[0, d / 2 - 0.03, w - 0.03, 0.02], [0, -d / 2 + 0.03, w - 0.03, 0.02], [-w / 2 + 0.03, 0, 0.02, d - 0.03], [w / 2 - 0.03, 0, 0.02, d - 0.03]]) { const b = box(ww, 0.02, dd, br); b.position.set(x, y0 + glassH, z); g.add(b); }
  const lid = box(w + 0.02, 0.07, d + 0.02, wood, { tile: 1 }); lid.position.y = y0 + glassH + 0.045; g.add(lid);
  const crest = box(w + 0.06, 0.03, d + 0.06, wood, { tile: 1 }); crest.position.y = y0 + glassH + 0.095; g.add(crest);
  const strip = box(w - 0.3, 0.014, 0.05, M.emissive(0xfff0cc, 2.2)); strip.position.set(0, y0 + glassH - 0.012, d / 2 - 0.12); g.add(strip);
  const inner = new THREE.Group(); inner.position.y = plinthH + 0.03; g.add(inner); g.userData.inner = inner; g.userData.top = plinthH + 0.03;
  g.userData.size = { w, d, h: y0 + glassH + 0.11 }; g.userData.y0 = y0; g.userData.glassH = glassH;
  return g;
}
