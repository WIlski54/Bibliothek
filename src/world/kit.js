// Baukasten für die Bibliotheksräume: Wände, Regale, Möbel, Rahmen, Vitrinen, Lampen ... Alles Meter, y nach oben.
// Konvention: Fronten schauen nach +z (lokal). Ein Raum dreht/verschiebt die fertigen Gruppen an die Wand.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { mulberry32, TAU, clamp } from '../lib/util.js';
import { woodTex, brassTex, labelTex } from './tex.js';

// ---------------------------------------------------------------- UV und Mesh-Hilfen
// Planare Würfel-Projektion in Metern: tile = Kantenlänge der Textur in m (Textur wiederholt sich)
export function worldUV(geo, tile = 1) {
  geo.computeVertexNormals?.();
  const p = geo.attributes.position, n = geo.attributes.normal, uv = geo.attributes.uv || new THREE.BufferAttribute(new Float32Array(p.count * 2), 2);
  for (let i = 0; i < p.count; i++) {
    const nx = Math.abs(n.getX(i)), ny = Math.abs(n.getY(i)), nz = Math.abs(n.getZ(i));
    let u, v;
    if (ny >= nx && ny >= nz) { u = p.getX(i); v = p.getZ(i); } else if (nx >= nz) { u = p.getZ(i); v = p.getY(i); } else { u = p.getX(i); v = p.getY(i); }
    uv.setXY(i, u / tile, v / tile);
  }
  geo.setAttribute('uv', uv); return geo;
}
export function mesh(geo, mat, { tile = 0, shadow = false, name = '' } = {}) {
  if (tile) worldUV(geo, tile);
  const m = new THREE.Mesh(geo, mat); m.castShadow = shadow; m.receiveShadow = true; if (name) m.name = name; return m;
}
export const box = (w, h, d, mat, o) => mesh(new THREE.BoxGeometry(w, h, d), mat, o);
export function at(obj, x = 0, y = 0, z = 0, ry = 0) { obj.position.set(x, y, z); obj.rotation.y = ry; return obj; }

// ---------------------------------------------------------------- Materialien
const mats = new Map();
export function mat(key, make) { if (!mats.has(key)) mats.set(key, make()); return mats.get(key); }
export const M = {
  wood: (base = 0x6a3d22, o = {}) => mat(`wood${base}|${JSON.stringify(o)}`, () => new THREE.MeshStandardMaterial({ map: woodTex({ base, ...o }), roughness: 0.62, metalness: 0.02 })),
  plain: (color, rough = 0.8, metal = 0) => mat(`plain${color}|${rough}|${metal}`, () => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal })),
  brass: () => mat('brass', () => new THREE.MeshStandardMaterial({ map: brassTex(), roughness: 0.32, metalness: 0.85, color: 0xffffff })),
  glass: () => mat('glass', () => new THREE.MeshStandardMaterial({ color: 0xcfe8f0, transparent: true, opacity: 0.14, roughness: 0.05, metalness: 0, depthWrite: false })),
  emissive: (color = 0xffe2a8, i = 1.6) => mat(`em${color}|${i}`, () => new THREE.MeshStandardMaterial({ color: 0x222222, emissive: color, emissiveIntensity: i })),
  fabric: (color, rough = 0.95) => mat(`fab${color}`, () => new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: 0 })),
  textured: (map, rough = 0.8, metal = 0) => new THREE.MeshStandardMaterial({ map, roughness: rough, metalness: metal }),
};

// ---------------------------------------------------------------- Fläche mit Löchern (Wand mit Türbögen)
// Wand in der XY-Ebene, Mitte x=0, Unterkante y=0, Front nach +z. holes: [{x, w, h, arch}]
export function wallPanel(w, h, d, material, holes = [], tile = 2) {
  const s = new THREE.Shape(); s.moveTo(-w / 2, 0); s.lineTo(w / 2, 0); s.lineTo(w / 2, h); s.lineTo(-w / 2, h); s.closePath();
  for (const o of holes) {
    const p = new THREE.Path(); const x0 = o.x - o.w / 2, x1 = o.x + o.w / 2, y0 = o.y0 ?? 0, r = o.arch ? o.w / 2 : 0, yt = o.h - r;
    p.moveTo(x0, y0); p.lineTo(x1, y0); p.lineTo(x1, y0 + yt);
    if (r) { p.absarc(o.x, y0 + yt, r, 0, Math.PI, false); } else { p.lineTo(x0, y0 + o.h); }
    p.lineTo(x0, y0); s.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(s, { depth: d, bevelEnabled: false, curveSegments: 16 }); g.translate(0, 0, -d);
  return mesh(g, material, { tile });
}
// Bogen-Zierrahmen um ein Loch (Türgewände, Messing- oder Holzprofil)
export function archFrame(w, h, depth, material, thick = 0.12) {
  const g = new THREE.Group(); const r = w / 2, yt = h - r;
  const outer = new THREE.Shape(); outer.moveTo(-r - thick, 0); outer.lineTo(r + thick, 0); outer.lineTo(r + thick, yt); outer.absarc(0, yt, r + thick, 0, Math.PI, false); outer.lineTo(-r - thick, 0);
  const hole = new THREE.Path(); hole.moveTo(-r, 0); hole.lineTo(-r, yt); hole.absarc(0, yt, r, Math.PI, 0, true); hole.lineTo(r, 0); hole.lineTo(-r, 0); outer.holes.push(hole);
  const geo = new THREE.ExtrudeGeometry(outer, { depth, bevelEnabled: true, bevelSize: 0.015, bevelThickness: 0.015, bevelSegments: 2, curveSegments: 24 });
  g.add(mesh(geo, material, { tile: 1 })); return g;
}

// ---------------------------------------------------------------- Raumhülle
// Rechteckiger Raum, Mitte (0,0), Boden y=0. walls: { N,S,E,W: { holes:[{x,w,h,arch}] } }  (N = -z, S = +z, E = +x, W = -x; x läuft entlang der Wand von links nach rechts, von innen gesehen)
export function roomShell({ w, d, h, wall, floor, ceiling, floorTile = 2, wallTile = 2, trim, openings = {}, wainscot = null, crown = true }) {
  const g = new THREE.Group(); g.name = 'shell';
  const fl = mesh(new THREE.PlaneGeometry(w, d), floor, { tile: floorTile }); fl.rotation.x = -Math.PI / 2; g.add(fl);
  const ce = mesh(new THREE.PlaneGeometry(w, d), ceiling, { tile: 3 }); ce.rotation.x = Math.PI / 2; ce.position.y = h; g.add(ce);
  const defs = { N: [0, -d / 2, 0, w], S: [0, d / 2, Math.PI, w], E: [w / 2, 0, -Math.PI / 2, d], W: [-w / 2, 0, Math.PI / 2, d] };
  for (const [k, [x, z, ry, len]] of Object.entries(defs)) {
    const holes = openings[k] || [];
    const wg = new THREE.Group(); wg.position.set(x, 0, z); wg.rotation.y = ry; g.add(wg);
    const p = wallPanel(len, h, 0.25, wall, holes, wallTile); p.position.z = 0.0; wg.add(p);
    // Rückseite nicht nötig (Wand hat Dicke), Sockel- und Deckenleiste
    if (trim) {
      const spans = splitSpans(len, holes);
      for (const [a, b] of spans) {
        const sb = box(b - a, 0.14, 0.04, trim, { tile: 1 }); sb.position.set((a + b) / 2, 0.07, 0.02); wg.add(sb);
        if (crown) { const cr = box(b - a, 0.12, 0.08, trim, { tile: 1 }); cr.position.set((a + b) / 2, h - 0.06, 0.04); wg.add(cr); const cr2 = box(b - a, 0.05, 0.14, trim, { tile: 1 }); cr2.position.set((a + b) / 2, h - 0.14, 0.07); wg.add(cr2); }
      }
      if (wainscot) for (const [a, b] of spans) { const sw = b - a - 0.06; if (sw < 0.2) continue; const pw = box(sw, wainscot.h, 0.05, wainscot.mat, { tile: wainscot.tile || 1.2 }); pw.position.set((a + b) / 2, wainscot.h / 2 + 0.14, 0.03); wg.add(pw); const rail = box(sw + 0.04, 0.06, 0.07, trim, { tile: 1 }); rail.position.set((a + b) / 2, wainscot.h + 0.14, 0.04); wg.add(rail); }
    }
  }
  return g;
}
function splitSpans(len, holes) {
  const sorted = holes.map((o) => [o.x - o.w / 2, o.x + o.w / 2]).sort((a, b) => a[0] - b[0]); const out = []; let cur = -len / 2;
  for (const [a, b] of sorted) { if (a - cur > 0.05) out.push([cur, a]); cur = b; } if (len / 2 - cur > 0.05) out.push([cur, len / 2]); return out;
}

// ---------------------------------------------------------------- Regale und Bücher
// Regaleinheit: Breite w, Höhe h, Tiefe d, shelves = Anzahl Bretter (ohne Boden). Front +z. Liefert Group + slots
export function shelfUnit({ w = 1.6, h = 2.6, d = 0.38, shelves = 5, wood = M.wood(0x5a3320), back = M.wood(0x3a2014, { planks: 2 }), plinth = 0.12, board = 0.03 } = {}) {
  const g = new THREE.Group(); g.userData.kind = 'shelf';
  const side = 0.04;
  for (const sx of [-1, 1]) { const s = box(side, h, d, wood, { tile: 1 }); s.position.set(sx * (w / 2 - side / 2), h / 2, 0); g.add(s); }
  const bk = box(w - 2 * side, h - plinth, 0.02, back, { tile: 1 }); bk.position.set(0, plinth + (h - plinth) / 2, -d / 2 + 0.01); g.add(bk);
  const top = box(w + 0.06, 0.05, d + 0.04, wood, { tile: 1 }); top.position.set(0, h + 0.025, 0.01); g.add(top);
  const cornice = box(w + 0.12, 0.06, 0.08, wood, { tile: 1 }); cornice.position.set(0, h + 0.075, d / 2 + 0.03); g.add(cornice);
  const base = box(w, plinth, d + 0.02, wood, { tile: 1 }); base.position.set(0, plinth / 2, 0.01); g.add(base);
  const slots = []; const inner = h - plinth - 0.06; const step = inner / shelves;
  for (let i = 0; i <= shelves; i++) {
    const y = plinth + i * step;
    if (i > 0) { const b = box(w - 2 * side, board, d - 0.02, wood, { tile: 1 }); b.position.set(0, y, 0); g.add(b); }
    if (i < shelves) slots.push({ y: y + (i > 0 ? board / 2 : 0), height: step - (i > 0 ? board / 2 : 0) - 0.02, x0: -w / 2 + side + 0.01, x1: w / 2 - side - 0.01, z: 0, depth: d - 0.06 });
  }
  g.userData.slots = slots; g.userData.size = { w, h, d }; return g;
}

const SPINE = [0x7b1f26, 0x2c4a6e, 0x2f6a4a, 0x8a5a2b, 0x4a2c5a, 0x1f3f3a, 0x9a7b30, 0x5a2a20, 0x2a2f45, 0x6a3a50, 0x3c5a2a, 0xa8552f, 0x20303a, 0x7a6a4a, 0x8c2d3a, 0x18384e];
// Füllbücher einer Regalreihe als EIN Mesh mit Vertexfarben (schnell). rng: mulberry32. skip: Liste [x0,x1] Lücken für Einzelbücher
export function fillBooks(slot, { seed = 1, density = 0.9, skip = [], palette = SPINE, tall = 1 } = {}) {
  const rnd = mulberry32(seed), geos = []; let x = slot.x0 + 0.01; const maxH = slot.height - 0.02;
  const col = new THREE.Color(), pageC = new THREE.Color(0xe9dcc0);
  const push = (g, c) => { const n = g.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); geos.push(g.toNonIndexed ? g.toNonIndexed() : g); };
  while (x < slot.x1 - 0.03) {
    const blocked = skip.find((s) => x + 0.03 > s[0] && x < s[1]); if (blocked) { x = blocked[1]; continue; }
    if (rnd() > density) { x += 0.02 + rnd() * 0.08; continue; }
    const bw = 0.025 + rnd() * 0.04, bh = Math.min(maxH, (0.17 + rnd() * 0.13) * tall), bd = Math.min(slot.depth - 0.02, 0.14 + rnd() * 0.08);
    if (x + bw > slot.x1) break;
    col.setHex(palette[Math.floor(rnd() * palette.length)]); col.offsetHSL((rnd() - 0.5) * 0.03, (rnd() - 0.5) * 0.1, (rnd() - 0.5) * 0.08);
    const lean = rnd() < 0.05 ? (rnd() - 0.5) * 0.3 : 0;
    const body = new THREE.BoxGeometry(bw, bh, bd); body.translate(0, bh / 2, 0);
    const pages = new THREE.BoxGeometry(bw * 0.86, bh * 0.96, 0.012); pages.translate(0, bh / 2, -bd / 2 + 0.002);
    const bands = [];
    const nb = 1 + Math.floor(rnd() * 3); const gold = new THREE.Color(0xd9b45a);
    for (let k = 0; k < nb; k++) { const bg = new THREE.BoxGeometry(bw * 1.02, 0.008 + rnd() * 0.006, 0.006); bg.translate(0, bh * (0.2 + 0.6 * (k + rnd() * 0.5) / (nb + 0.5)), bd / 2 + 0.002); bands.push(bg); }
    const parts = [[body, col.clone()], [pages, pageC]]; for (const b of bands) parts.push([b, gold]);
    const m = new THREE.Matrix4().makeRotationZ(lean); const tr = new THREE.Matrix4().makeTranslation(x + bw / 2, slot.y, slot.z);
    for (const [gg, c] of parts) { gg.applyMatrix4(m); gg.applyMatrix4(tr); push(gg, c); }
    x += bw + 0.003 + (lean ? Math.abs(Math.sin(lean)) * bh * 0.5 : 0);
  }
  if (!geos.length) return null;
  const merged = mergeGeometries(geos, false); merged.computeVertexNormals();
  const m = new THREE.Mesh(merged, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.72, metalness: 0.05 })); m.receiveShadow = true; return m;
}

// ---------------------------------------------------------------- Möbel und Zierrat
export function readingTable({ r = 0.9, h = 0.78, wood = M.wood(0x6a3d22) } = {}) {
  const g = new THREE.Group(); const top = mesh(new THREE.CylinderGeometry(r, r, 0.06, 40), wood, { tile: 1 }); top.position.y = h; g.add(top);
  const rim = mesh(new THREE.TorusGeometry(r, 0.02, 8, 40), wood); rim.rotation.x = Math.PI / 2; rim.position.y = h + 0.03; g.add(rim);
  const col = mesh(new THREE.CylinderGeometry(0.1, 0.16, h, 16), wood, { tile: 1 }); col.position.y = h / 2; g.add(col);
  const foot = mesh(new THREE.CylinderGeometry(0.42, 0.46, 0.06, 28), wood, { tile: 1 }); foot.position.y = 0.03; g.add(foot); return g;
}
export function chair({ wood = M.wood(0x5a3320), seat = M.fabric(0x7b1f26) } = {}) {
  const g = new THREE.Group(); const s = box(0.46, 0.08, 0.44, seat); s.position.y = 0.46; g.add(s);
  for (const [x, z] of [[-0.2, -0.19], [0.2, -0.19], [-0.2, 0.19], [0.2, 0.19]]) { const l = box(0.04, 0.46, 0.04, wood, { tile: 1 }); l.position.set(x, 0.23, z); g.add(l); }
  const back = box(0.46, 0.5, 0.05, seat); back.position.set(0, 0.76, -0.2); g.add(back);
  for (const x of [-0.2, 0.2]) { const p = box(0.04, 0.5, 0.04, wood, { tile: 1 }); p.position.set(x, 0.74, -0.2); g.add(p); } return g;
}
export function armchair({ color = 0x6a2230 } = {}) {
  const g = new THREE.Group(); const f = M.fabric(color, 0.85), wd = M.wood(0x3a2014);
  const base = box(0.82, 0.34, 0.78, f); base.position.y = 0.3; g.add(base);
  const back = box(0.82, 0.62, 0.2, f); back.position.set(0, 0.7, -0.3); g.add(back);
  for (const sx of [-1, 1]) { const a = box(0.16, 0.34, 0.78, f); a.position.set(sx * 0.41, 0.52, 0); g.add(a); const t = mesh(new THREE.CylinderGeometry(0.085, 0.085, 0.78, 14), f); t.rotation.x = Math.PI / 2; t.position.set(sx * 0.41, 0.7, 0); g.add(t); }
  const cus = box(0.6, 0.12, 0.6, f); cus.position.set(0, 0.52, 0.04); g.add(cus);
  for (const [x, z] of [[-0.36, -0.34], [0.36, -0.34], [-0.36, 0.34], [0.36, 0.34]]) { const l = box(0.06, 0.14, 0.06, wd, { tile: 1 }); l.position.set(x, 0.07, z); g.add(l); } return g;
}
export function globe({ r = 0.32, map = null } = {}) {
  const g = new THREE.Group(); const brass = M.brass(), wd = M.wood(0x4a2a18);
  const sph = new THREE.Mesh(new THREE.SphereGeometry(r, 36, 24), map ? new THREE.MeshStandardMaterial({ map, roughness: 0.55 }) : M.plain(0x4a79a8, 0.5)); sph.position.y = r + 0.5; sph.rotation.z = 0.41; g.add(sph); g.userData.sphere = sph;
  const ring = mesh(new THREE.TorusGeometry(r + 0.04, 0.012, 8, 48), brass); ring.position.y = r + 0.5; ring.rotation.y = Math.PI / 2; g.add(ring);
  const stem = mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.5, 12), wd, { tile: 1 }); stem.position.y = 0.25; g.add(stem);
  const foot = mesh(new THREE.CylinderGeometry(0.3, 0.34, 0.06, 28), wd, { tile: 1 }); foot.position.y = 0.03; g.add(foot); return g;
}
export function pottedPlant({ h = 1.4, pot = 0x9a5a38, leaf = 0x3f7a42, seed = 3 } = {}) {
  const g = new THREE.Group(); const rnd = mulberry32(seed);
  const p = mesh(new THREE.CylinderGeometry(0.26, 0.19, 0.4, 20), M.plain(pot, 0.9)); p.position.y = 0.2; g.add(p);
  const rim = mesh(new THREE.TorusGeometry(0.265, 0.025, 8, 24), M.plain(pot, 0.9)); rim.rotation.x = Math.PI / 2; rim.position.y = 0.4; g.add(rim);
  const soil = mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.03, 18), M.plain(0x2a1a10, 1)); soil.position.y = 0.4; g.add(soil);
  const lm = new THREE.MeshStandardMaterial({ color: leaf, roughness: 0.75, side: THREE.DoubleSide });
  const lg = []; for (let i = 0; i < 16; i++) {
    const a = rnd() * TAU, len = h * (0.45 + rnd() * 0.5), wd = 0.1 + rnd() * 0.08, tilt = 0.25 + rnd() * 0.9;
    const geo = new THREE.PlaneGeometry(wd, len, 1, 4); geo.translate(0, len / 2, 0);
    const pos = geo.attributes.position; for (let k = 0; k < pos.count; k++) { const yy = pos.getY(k) / len; pos.setZ(k, yy * yy * len * 0.35); pos.setX(k, pos.getX(k) * (1 - yy * 0.6)); }
    geo.rotateX(-tilt); geo.rotateY(a); geo.translate(0, 0.42, 0); lg.push(geo);
  }
  const lv = new THREE.Mesh(mergeGeometries(lg, false), lm); lv.receiveShadow = true; g.add(lv); return g;
}
// Pendel-/Kronleuchter (nur Optik) mit Lichtquelle optional
export function chandelier({ r = 0.7, arms = 8, light = true, color = 0xffe2b0, intensity = 18 } = {}) {
  const g = new THREE.Group(); const brass = M.brass();
  const chain = mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.2, 6), brass); chain.position.y = 0.6; g.add(chain);
  const ring = mesh(new THREE.TorusGeometry(r, 0.03, 8, 40), brass); ring.rotation.x = Math.PI / 2; ring.position.y = -0.02; g.add(ring);
  const core = mesh(new THREE.SphereGeometry(0.14, 14, 10), brass); core.position.y = -0.04; g.add(core);
  for (let i = 0; i < arms; i++) {
    const a = (i / arms) * TAU, x = Math.cos(a) * r, z = Math.sin(a) * r;
    const cup = mesh(new THREE.CylinderGeometry(0.04, 0.025, 0.06, 10), brass); cup.position.set(x, 0.04, z); g.add(cup);
    const cand = mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.12, 8), M.plain(0xf3ead2, 0.6)); cand.position.set(x, 0.13, z); g.add(cand);
    const fl = mesh(new THREE.SphereGeometry(0.022, 8, 6), M.emissive(0xffd890, 3)); fl.scale.y = 1.6; fl.position.set(x, 0.22, z); g.add(fl);
  }
  if (light) { const pl = new THREE.PointLight(color, intensity, 14, 1.6); pl.position.set(0, -0.2, 0); g.add(pl); g.userData.light = pl; } return g;
}
// Wandlampe (Messingarm mit grünem Schirm) und Stehleuchte
export function deskLamp({ shade = 0x2e6a4a, light = true } = {}) {
  const g = new THREE.Group(); const brass = M.brass();
  const foot = mesh(new THREE.CylinderGeometry(0.1, 0.12, 0.03, 18), brass); foot.position.y = 0.015; g.add(foot);
  const arm = mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.36, 8), brass); arm.position.y = 0.2; g.add(arm);
  const sh = mesh(new THREE.CylinderGeometry(0.06, 0.15, 0.13, 20, 1, true), new THREE.MeshStandardMaterial({ color: shade, roughness: 0.5, side: THREE.DoubleSide })); sh.position.set(0, 0.42, 0); g.add(sh);
  const bulb = mesh(new THREE.SphereGeometry(0.035, 10, 8), M.emissive(0xfff0c0, 4)); bulb.position.y = 0.38; g.add(bulb);
  if (light) { const pl = new THREE.PointLight(0xffe0a0, 3.2, 5, 1.8); pl.position.set(0, 0.36, 0); g.add(pl); g.userData.light = pl; } return g;
}
export function sconce({ light = true } = {}) {
  const g = new THREE.Group(); const brass = M.brass();
  const plate = mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 14), brass); plate.rotation.x = Math.PI / 2; plate.position.set(0, 0, 0.01); g.add(plate);
  const arm = mesh(new THREE.TorusGeometry(0.1, 0.012, 6, 14, Math.PI), brass); arm.position.set(0, 0.1, 0.1); arm.rotation.z = Math.PI / 2; g.add(arm);
  const sh = mesh(new THREE.ConeGeometry(0.1, 0.16, 14, 1, true), new THREE.MeshStandardMaterial({ color: 0xf0e4c4, emissive: 0xffe0a0, emissiveIntensity: 0.9, side: THREE.DoubleSide })); sh.position.set(0, 0.22, 0.2); g.add(sh);
  if (light) { const pl = new THREE.PointLight(0xffd890, 2.6, 5, 1.7); pl.position.set(0, 0.22, 0.22); g.add(pl); g.userData.light = pl; } return g;
}
export function ladder({ h = 2.4 } = {}) {
  const g = new THREE.Group(); const wd = M.wood(0x6a3d22, { planks: 2 }), br = M.brass();
  for (const x of [-0.22, 0.22]) { const r = box(0.04, h, 0.04, wd, { tile: 1 }); r.position.set(x, h / 2, 0); r.rotation.x = -0.12; g.add(r); }
  for (let i = 0; i < 8; i++) { const y = 0.25 + i * ((h - 0.4) / 7); const s = box(0.44, 0.03, 0.06, wd, { tile: 1 }); s.position.set(0, y, -y * 0.12 + 0.02); g.add(s); }
  for (const x of [-0.22, 0.22]) { const hk = mesh(new THREE.TorusGeometry(0.03, 0.008, 6, 10), br); hk.position.set(x, h - 0.02, -h * 0.12 + 0.02); g.add(hk); } return g;
}

// ---------------------------------------------------------------- Bilderrahmen und Schilder
// Rahmen mit beliebiger Textur (Papierschnitt-Porträt als Canvas) und Messingschild. w,h = Bildmaß
export function framedPicture(tex, { w = 0.7, h = 0.9, frame = 0.07, name = '', sub = '', mat = M.brass() } = {}) {
  const g = new THREE.Group(); const dep = 0.05;
  const mount = box(w + frame * 2, h + frame * 2, dep, M.wood(0x3a2014, { planks: 1 }), { tile: 1 }); mount.position.z = dep / 2; g.add(mount);
  for (const [x, y, ww, hh] of [[0, h / 2 + frame / 2, w + frame * 2, frame], [0, -h / 2 - frame / 2, w + frame * 2, frame], [-w / 2 - frame / 2, 0, frame, h], [w / 2 + frame / 2, 0, frame, h]]) { const b = box(ww, hh, 0.02, mat); b.position.set(x, y, dep + 0.005); g.add(b); }
  const pic = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6 })); pic.position.z = dep + 0.002; pic.userData.picture = true; g.add(pic); g.userData.pic = pic;
  if (name) { const pw = Math.min(w + 0.1, 0.62), plate = new THREE.Mesh(new THREE.PlaneGeometry(pw, pw * 0.26), new THREE.MeshStandardMaterial({ map: labelTex(name, { w: 512, h: 133, font: 'bold 44px Georgia, serif', sub, subFont: 'italic 26px Georgia, serif' }), roughness: 0.4, metalness: 0.3 })); plate.position.set(0, -h / 2 - frame - pw * 0.15, dep + 0.003); g.add(plate); }
  return g;
}
export function plaque(text, { w = 0.9, h = 0.26, sub = '', bg = '#4a2a18', fg = '#f6dc8a' } = {}) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: labelTex(text, { w: 640, h: Math.round(640 * h / w), bg, fg, sub, font: 'bold 72px Georgia, serif' }), roughness: 0.7, metalness: 0.05 })); return m;
}

// ---------------------------------------------------------------- Vitrine mit Sockel
// Liefert Group; g.userData.inner = Gruppe für das Exponat (Mitte der Standfläche), g.userData.top = y der Standfläche
export function vitrine({ w = 0.9, d = 0.7, plinthH = 0.9, glassH = 0.95, wood = M.wood(0x4a2a18), cloth = M.fabric(0x1a2a3c, 1), light = true } = {}) {
  const g = new THREE.Group();
  const pl = box(w, plinthH, d, wood, { tile: 1 }); pl.position.y = plinthH / 2; g.add(pl);
  const cap = box(w + 0.06, 0.05, d + 0.06, wood, { tile: 1 }); cap.position.y = plinthH + 0.025; g.add(cap);
  const top = box(w - 0.04, 0.02, d - 0.04, cloth); top.position.y = plinthH + 0.055; g.add(top);
  const gl = new THREE.Mesh(new THREE.BoxGeometry(w - 0.04, glassH, d - 0.04), M.glass()); gl.position.y = plinthH + 0.065 + glassH / 2; gl.renderOrder = 3; g.add(gl); g.userData.glass = gl;
  for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = box(0.02, glassH, 0.02, M.brass()); p.position.set(x * (w / 2 - 0.03), plinthH + 0.065 + glassH / 2, z * (d / 2 - 0.03)); g.add(p); }
  const lid = box(w, 0.04, d, wood, { tile: 1 }); lid.position.y = plinthH + 0.065 + glassH + 0.02; g.add(lid);
  const inner = new THREE.Group(); inner.position.y = plinthH + 0.07; g.add(inner); g.userData.inner = inner; g.userData.top = plinthH + 0.07;
  if (light) { const sp = new THREE.PointLight(0xfff0d0, 1.4, 3, 1.8); sp.position.set(0, plinthH + glassH, 0.1); g.add(sp); g.userData.light = sp; }
  g.userData.size = { w, d, h: plinthH + glassH + 0.1 }; return g;
}
export function pedestal({ w = 0.4, h = 1.1, wood = M.plain(0xdcd2bc, 0.6) } = {}) {
  const g = new THREE.Group(); const b = box(w, h, w, wood, { tile: 1 }); b.position.y = h / 2; g.add(b);
  const top = box(w + 0.08, 0.05, w + 0.08, wood, { tile: 1 }); top.position.y = h + 0.025; g.add(top); const bs = box(w + 0.08, 0.08, w + 0.08, wood, { tile: 1 }); bs.position.y = 0.04; g.add(bs); g.userData.top = h + 0.05; return g;
}
// Fahne / Banner (hängt von einer Stange): Textur mit Abteilungsname
export function banner(tex, { w = 0.9, h = 2.1 } = {}) {
  const g = new THREE.Group(); const rod = mesh(new THREE.CylinderGeometry(0.02, 0.02, w + 0.2, 8), M.brass()); rod.rotation.z = Math.PI / 2; rod.position.y = h; g.add(rod);
  const geo = new THREE.PlaneGeometry(w, h, 8, 12); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) { const y = p.getY(i); p.setZ(i, Math.sin(y * 2.2 + p.getX(i) * 3) * 0.015); }
  const cl = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: tex, roughness: 0.85, side: THREE.DoubleSide })); cl.position.y = h / 2; g.add(cl);
  for (const x of [-w / 2, w / 2]) { const k = mesh(new THREE.SphereGeometry(0.035, 10, 8), M.brass()); k.position.set(x + (x < 0 ? -0.1 : 0.1), h, 0); g.add(k); } return g;
}

// ---------------------------------------------------------------- Platzieren an Wänden
// a = Position entlang der Wand (links -> rechts, von innen gesehen), off = Abstand von der Wandfläche, Fronten schauen in den Raum
export function wallPos(room, wall, a, off = 0) {
  switch (wall) {
    case 'N': return { x: a, z: -room.d / 2 + off, ry: 0 };
    case 'S': return { x: -a, z: room.d / 2 - off, ry: Math.PI };
    case 'E': return { x: room.w / 2 - off, z: a, ry: -Math.PI / 2 };
    default: return { x: -room.w / 2 + off, z: -a, ry: Math.PI / 2 };
  }
}
export function placeWall(obj, room, wall, a, off = 0, y = 0) { const p = wallPos(room, wall, a, off); obj.position.set(p.x, y, p.z); obj.rotation.y = p.ry; return obj; }
// unsichtbare Klickfläche (Raycast trifft, gezeichnet wird nichts)
export function hitPlane(w, h, tap) { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide })); m.userData.tap = tap; return m; }
export function hitBox(w, h, d, tap) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), new THREE.MeshBasicMaterial({ visible: false })); m.userData.tap = tap; return m; }

export { THREE, clamp };
