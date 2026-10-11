// Biologie: T.-rex-Schaukasten (Diorama) mit der Papierschnitt-Figur aus dem Dino-Buch und gestaffelten Papierlandschaften.
import * as THREE from 'three';
import { Figure } from '../../../lib/figure.js';
import { M, mat, box, mesh } from '../../kit.js';
import { mulberry32, TAU } from '../../../lib/util.js';
import { canvas, texOf, memo, brassSign, glassSheen, woodMid } from './style.js';
import { cutout, frond, conifer, cycad, hills } from './paper.js';
import makeTrex from './figs/trex.js';
import makeIchthyo from './figs/ichthyosaurus.js';

const W = 1024, H = 560;
function sceneTextures() {
  return memo('trex-scene', () => {
    // Schicht 0: Himmel (deckend)
    const sc = (w, h) => { const r = canvas(Math.round(w * 0.625), Math.round(h * 0.625)); r[1].scale(0.625, 0.625); return r; };
    const [c0, g0] = sc(W, H); const sky = g0.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#9ccbe6'); sky.addColorStop(0.55, '#f6e2b4'); sky.addColorStop(1, '#f3c58a'); g0.fillStyle = sky; g0.fillRect(0, 0, W, H);
    const sun = g0.createRadialGradient(780, 190, 8, 780, 190, 170); sun.addColorStop(0, 'rgba(255,248,214,1)'); sun.addColorStop(0.3, 'rgba(255,236,170,.85)'); sun.addColorStop(1, 'rgba(255,230,160,0)'); g0.fillStyle = sun; g0.fillRect(0, 0, W, H);
    cutout(g0, (c) => { c.arc(780, 190, 56, 0, TAU); }, '#fff6c8', { border: 5, shadow: 0.1, sx: 3, sy: 4, blur: 6 });
    const rnd = mulberry32(5); for (let i = 0; i < 5; i++) { const x = 80 + i * 210 + rnd() * 80, y = 70 + rnd() * 120; cutout(g0, (c) => { c.moveTo(x - 90, y); c.bezierCurveTo(x - 90, y - 38, x - 40, y - 44, x - 20, y - 26); c.bezierCurveTo(x, y - 54, x + 56, y - 46, x + 62, y - 18); c.bezierCurveTo(x + 100, y - 16, x + 108, y + 8, x + 80, y + 12); c.lineTo(x - 80, y + 12); c.closePath(); }, 'rgba(255,255,255,.92)', { border: 4, shadow: 0.08, sx: 3, sy: 5, blur: 6, stroke: 'rgba(120,120,140,.2)' }); }
    // ferne Berge
    cutout(g0, (c) => { c.moveTo(0, 420); c.lineTo(110, 300); c.lineTo(190, 360); c.lineTo(300, 250); c.lineTo(420, 380); c.lineTo(520, 320); c.lineTo(660, 400); c.lineTo(760, 330); c.lineTo(900, 410); c.lineTo(W, 360); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); }, '#b9b3cf', { border: 4, shadow: 0.12, sx: 2, sy: 5, blur: 8 });
    // Schicht 1: Hügel mit Nadelbäumen
    const [c1, g1] = sc(W, H);
    hills(g1, W, H, 400, 22, 1.4, 0.4, '#8fb06a', { shadow: 0.3 });
    for (const [x, y, h, w] of [[120, 405, 190, 100], [200, 400, 150, 80], [860, 410, 200, 106], [930, 405, 150, 80], [760, 415, 120, 66]]) conifer(g1, x, y, h, w, { fill: '#4f8a4a' });
    // Schicht 2: Mittelgrund, Sagopalmfarne und Farne
    const [c2, g2] = sc(W, H);
    hills(g2, W, H, 470, 14, 2, 1.2, '#6e9a48', { shadow: 0.3 });
    cycad(g2, 150, 480, 150, { seed: 3 }); cycad(g2, 890, 485, 130, { seed: 8, fill: '#58a050' });
    // Schicht 3: Vordergrund (Boden, Farne, Steine)
    const [c3, g3] = sc(W, H);
    cutout(g3, (c) => { c.moveTo(0, 520); for (let x = 0; x <= W; x += 10) c.lineTo(x, 506 + Math.sin(x * 0.012) * 6); c.lineTo(W, H); c.lineTo(0, H); c.closePath(); }, '#9a7a4a', { border: 4, shadow: 0.3 });
    for (const [x, y, l, a, cu, s] of [[40, 540, 230, -1.2, 1.1, 1], [90, 545, 200, -1.9, -0.9, 2], [980, 540, 230, -1.9, -1.1, 3], [930, 545, 190, -1.2, 0.9, 4], [300, 552, 120, -1.5, 0.6, 5], [690, 552, 110, -1.7, -0.7, 6]]) frond(g3, x, y, l, a, cu, { fill: '#3f8a45', seed: s, w: 0.22 });
    for (const [x, y, r] of [[470, 540, 36], [560, 548, 24], [150, 548, 30]]) cutout(g3, (c) => { c.ellipse(x, y, r * 1.4, r, 0, 0, TAU); }, '#a9a392', { border: 3, shadow: 0.2 });
    const mk = (c, o) => { const t = texOf(c); return t; };
    return [mk(c0), mk(c1), mk(c2), mk(c3)];
  });
}
const layerMat = (i, transparent) => mat(`trex-layer${i}`, () => new THREE.MeshBasicMaterial({ map: sceneTextures()[i], transparent, color: 0xf2f2f2, depthWrite: !transparent ? true : false, toneMapped: true }));

export function litFigure(spec, opts) { // Figur etwas selbstleuchtend, damit sie im Kasten freundlich hell bleibt
  const f = new Figure(spec, opts); for (const c of f.cuts) { const m = c.material; m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = 0.38; } return f;
}

// Kasten: Ursprung Mitte unten an der Wand, Vorderseite +z
export function buildTrexCase({ w = 2.3, h = 1.25, d = 0.34 } = {}) {
  const g = new THREE.Group(), wood = woodMid(), brass = M.brass(), T = 0.09;
  const frame = [[0, h + T / 2, w + 2 * T, T], [0, -T / 2, w + 2 * T, T]]; for (const [x, y, ww, hh] of frame) { const b = box(ww, hh, d + 0.04, wood, { tile: 1 }); b.position.set(x, y + 0, (d + 0.04) / 2 - 0.02); g.add(b); }
  for (const s of [-1, 1]) { const b = box(T, h, d + 0.04, wood, { tile: 1 }); b.position.set(s * (w / 2 + T / 2), h / 2, (d + 0.04) / 2 - 0.02); g.add(b); }
  // Messingleiste um die Glasöffnung
  for (const [x, y, ww, hh] of [[0, h - 0.01, w, 0.02], [0, 0.01, w, 0.02]]) { const b = box(ww, hh, 0.02, brass); b.position.set(x, y, d + 0.012); g.add(b); }
  for (const s of [-1, 1]) { const b = box(0.02, h, 0.02, brass); b.position.set(s * (w / 2 - 0.01), h / 2, d + 0.012); g.add(b); }
  // Hintergrund und Papierschichten
  const planes = [[0, 0.025, false], [1, 0.07, true], [2, 0.115, true], [3, 0.255, true]];
  for (const [i, z, tr] of planes) { const p = new THREE.Mesh(new THREE.PlaneGeometry(w, w * H / W), layerMat(i, tr)); p.position.set(0, h / 2, z); p.renderOrder = tr ? 1 + i : 0; if (w * H / W > h) p.scale.set(h / (w * H / W), h / (w * H / W), 1); g.add(p); }
  // Glas
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(w, h), glassSheen()); gl.position.set(0, h / 2, d - 0.005); gl.renderOrder = 9; g.add(gl);
  // Lichtleiste unter dem Dach
  const lamp = box(w - 0.2, 0.03, 0.05, M.emissive(0xfff0c8, 2.2)); lamp.position.set(0, h - 0.04, d - 0.06); g.add(lamp);
  // der T. rex
  const fig = litFigure(makeTrex(), { worldScale: 0.118, ppu: 600, maxTex: 1024, thickness: 0.032, border: 0.03 });
  fig.rotatePart('jaw', -0.2); fig.group.position.set(0.12, 0.1, 0.165); g.add(fig.group); g.userData.fig = fig;
  const pl = brassSign('Tyrannosaurus rex', { w: 0.62, h: 0.12, px: 60, sub: 'Oberkreide, vor etwa 68 bis 66 Mio. Jahren', bg: '#2c5a3e' }); pl.position.set(0, -0.11, 0.2 + d / 2 - 0.1); pl.rotation.x = -0.18; pl.position.z = d + 0.045; g.add(pl);
  g.userData.size = { w: w + 2 * T, h: h + 2 * T, d };
  return g;
}

// Großer Ichthyosaurus aus Papier an der Wand (Mary-Anning-Fund)
export function buildIchthyo({ scale = 0.56 } = {}) {
  const g = new THREE.Group(), fig = litFigure(makeIchthyo(), { worldScale: scale, ppu: 330, maxTex: 1024, thickness: 0.05, border: 0.04 });
  g.add(fig.group); fig.group.position.set(-2.6 * scale, 0, 0); fig.rotatePart('tail', 0.12); fig.rotatePart('flipperA', 0.2); g.userData.fig = fig;
  return g;
}
