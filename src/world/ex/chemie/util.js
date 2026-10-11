// Hilfsmittel für den Chemieraum: Geometrie-Sammler (Batch), gecachte Materialien, Rohre, Drehkörper.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { worldUV } from '../../kit.js';

const cache = new Map();
const memo = (key, make) => { if (!cache.has(key)) cache.set(key, make()); return cache.get(key); };
export const col = (c) => new THREE.Color(c);

// ---------------------------------------------------------------- Materialien (je Parameter nur einmal erzeugt, damit world.js sie zusammenfassen kann)
export const MAT = {
  copper: () => memo('copper', () => new THREE.MeshStandardMaterial({ color: 0xd08a52, metalness: 0.7, roughness: 0.32, emissive: 0x2a1204, emissiveIntensity: 0.6 })),
  patina: () => memo('patina', () => new THREE.MeshStandardMaterial({ color: 0x4fa88e, metalness: 0.1, roughness: 0.78, emissive: 0x08241c, emissiveIntensity: 0.5 })),
  steel: () => memo('steel', () => new THREE.MeshStandardMaterial({ color: 0xc9ced2, metalness: 0.75, roughness: 0.3 })),
  darkSteel: () => memo('darkSteel', () => new THREE.MeshStandardMaterial({ color: 0x4a5056, metalness: 0.6, roughness: 0.42 })),
  black: () => memo('black', () => new THREE.MeshStandardMaterial({ color: 0x1c1d20, metalness: 0.2, roughness: 0.55 })),
  rubber: () => memo('rubber', () => new THREE.MeshStandardMaterial({ color: 0x2b2020, metalness: 0, roughness: 0.85 })),
  hoseBlue: () => memo('hoseBlue', () => new THREE.MeshStandardMaterial({ color: 0x3a74c9, metalness: 0, roughness: 0.55 })),
  hoseGrey: () => memo('hoseGrey', () => new THREE.MeshStandardMaterial({ color: 0x9aa7b4, metalness: 0, roughness: 0.55 })),
  hoseOrange: () => memo('hoseOrange', () => new THREE.MeshStandardMaterial({ color: 0xc4521c, metalness: 0, roughness: 0.6 })),
  paper: () => memo('paper', () => new THREE.MeshStandardMaterial({ color: 0xf1e8cf, roughness: 0.9 })),
  white: () => memo('white', () => new THREE.MeshStandardMaterial({ color: 0xece8dc, roughness: 0.55 })),
  paint: () => memo('paint', () => new THREE.MeshStandardMaterial({ color: 0xe9e5d6, roughness: 0.6 })),
  cork: () => memo('cork', () => new THREE.MeshStandardMaterial({ color: 0xb98a55, roughness: 0.95 })),
  ceramic: () => memo('ceramic', () => new THREE.MeshStandardMaterial({ color: 0xf3f2ec, roughness: 0.18, metalness: 0 })),
  // Glas: durchsichtig, beidseitig; an den Rändern (streifender Blick) dichter und heller (Fresnel), das gibt Glas seine Kontur
  glass: () => memo('glass', () => {
    const m = new THREE.MeshStandardMaterial({ color: 0xdff1f8, emissive: 0x16262e, emissiveIntensity: 0.5, transparent: true, opacity: 0.13, roughness: 0.05, metalness: 0, side: THREE.DoubleSide, depthWrite: false });
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <opaque_fragment>', `
      float chF = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.2);
      outgoingLight += vec3(0.62, 0.8, 0.9) * chF * 0.55; diffuseColor.a = clamp(opacity + chF * 0.62, 0.0, 0.92);
      #include <opaque_fragment>`); };
    m.customProgramCacheKey = () => 'chemie-glass'; return m;
  }),
  liquid: (c, k = 0.9) => memo(`liq${c}|${k}`, () => new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.22, roughness: 0.12, metalness: 0, transparent: k < 1, opacity: k, depthWrite: k >= 1 })),
  // Flüssigkeiten mit Vertexfarben: alle Farben teilen sich EIN Material (ein Zeichenaufruf statt einem je Farbe); Farbe über Batch.add({ color })
  liquidVC: (k = 1) => memo(`liqvc${k}`, () => {
    const m = new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.12, metalness: 0, transparent: k < 1, opacity: k, depthWrite: k >= 1 });
    m.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += diffuseColor.rgb * 0.22;'); }; m.customProgramCacheKey = () => 'chemie-liquid'; return m;
  }),
  vc: () => memo('vc', () => new THREE.MeshStandardMaterial({ color: 0xffffff, vertexColors: true, roughness: 0.42, metalness: 0.08 })),   // Vertexfarben, opak (Kleinkram)
  solid: (c, rough = 0.7, metal = 0) => memo(`solid${c}|${rough}|${metal}`, () => new THREE.MeshStandardMaterial({ color: c, roughness: rough, metalness: metal })),
  emissive: (c, i = 1.5) => memo(`em${c}|${i}`, () => new THREE.MeshStandardMaterial({ color: 0x222222, emissive: c, emissiveIntensity: i })),
};

// ---------------------------------------------------------------- Geometrie-Sammler
// Sammelt Teilgeometrien samt Lage und fasst sie je Material zu EINEM Mesh zusammen (wenige Zeichenaufrufe, auch für animierte oder tippbare Gruppen).
const _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(), _m = new THREE.Matrix4();
export class Batch {
  constructor() { this.map = new Map(); }
  // r = Euler (x,y,z; Reihenfolge YXZ), s = Skalierung (Zahl oder [x,y,z])
  add(geo, mat, { p = [0, 0, 0], r = [0, 0, 0], s = 1, m = null, tile = 0, color = null } = {}) {
    const g = geo.clone();
    if (m) g.applyMatrix4(m); else { _e.set(r[0], r[1], r[2], 'YXZ'); _q.setFromEuler(_e); _p.set(p[0], p[1], p[2]); if (Array.isArray(s)) _s.set(s[0], s[1], s[2]); else _s.setScalar(s); _m.compose(_p, _q, _s); g.applyMatrix4(_m); }
    if (tile) worldUV(g, tile);
    if (!g.attributes.uv) g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    if (!g.attributes.normal) g.computeVertexNormals();
    if (color != null) { const c = new THREE.Color(color), n = g.attributes.position.count, arr = new Float32Array(n * 3); for (let i = 0; i < n; i++) { arr[i * 3] = c.r; arr[i * 3 + 1] = c.g; arr[i * 3 + 2] = c.b; } g.setAttribute('color', new THREE.BufferAttribute(arr, 3)); }
    for (const k of Object.keys(g.attributes)) if (k !== 'position' && k !== 'normal' && k !== 'uv' && k !== 'color') g.deleteAttribute(k);
    let list = this.map.get(mat); if (!list) this.map.set(mat, (list = [])); list.push(g); return this;
  }
  box(mat, w, h, d, x = 0, y = 0, z = 0, ry = 0, o = {}) { return this.add(new THREE.BoxGeometry(w, h, d), mat, { p: [x, y, z], r: [o.rx || 0, ry, o.rz || 0], tile: o.tile || 0 }); }
  cyl(mat, rt, rb, h, x = 0, y = 0, z = 0, o = {}) { return this.add(new THREE.CylinderGeometry(rt, rb, h, o.seg || 14, 1, !!o.open), mat, { p: [x, y, z], r: [o.rx || 0, o.ry || 0, o.rz || 0] }); }
  sph(mat, r, x = 0, y = 0, z = 0, o = {}) { return this.add(new THREE.SphereGeometry(r, o.w || 14, o.h || 10), mat, { p: [x, y, z], s: o.s || 1, r: [0, o.ry || 0, 0] }); }
  torus(mat, R, r, x = 0, y = 0, z = 0, o = {}) { return this.add(new THREE.TorusGeometry(R, r, o.rs || 8, o.ts || 20, o.arc || Math.PI * 2), mat, { p: [x, y, z], r: [o.rx || 0, o.ry || 0, o.rz || 0] }); }
  // Zylinder von Punkt a nach Punkt b (Arrays), Radius r
  tube(mat, a, b, r, seg = 10, rEnd = r) {
    const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), len = d.length(); if (len < 1e-5) return this;
    const g = new THREE.CylinderGeometry(rEnd, r, len, seg, 1); // oben (+y) = Ende bei b
    _q.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize()); _m.compose(A.clone().add(B).multiplyScalar(0.5), _q, _s.set(1, 1, 1)); return this.add(g, mat, { m: _m.clone() });
  }
  // Drehkörper aus Profil [[radius, y], ...]
  lathe(mat, pts, x = 0, y = 0, z = 0, o = {}) { return this.add(new THREE.LatheGeometry(pts.map((q) => new THREE.Vector2(q[0], q[1])), o.seg || 24), mat, { p: [x, y, z], r: [o.rx || 0, o.ry || 0, o.rz || 0], s: o.s || 1, color: o.color ?? null }); }
  // Rohrleitung entlang eines Streckenzugs mit gerundeten Ecken (Radius R); Ecken müssen achsparallel sein
  pipe(mat, pts, r, R = 0.07, seg = 12) {
    const P = pts.map((q) => new THREE.Vector3(...q)); let cur = P[0].clone();
    for (let i = 1; i < P.length; i++) {
      const d1 = P[i].clone().sub(P[i - 1]).normalize(); const last = i === P.length - 1;
      let end = P[i].clone(), corner = null;
      if (!last) { const d2 = P[i + 1].clone().sub(P[i]).normalize(); end = P[i].clone().addScaledVector(d1, -R); corner = { d1, d2, a: end.clone(), c: end.clone().addScaledVector(d2, R) }; }
      this.tube(mat, cur.toArray(), end.toArray(), r, seg);
      if (corner) {
        const ex = corner.d2.clone().negate(), ey = corner.d1.clone(), ez = new THREE.Vector3().crossVectors(ex, ey);
        _m.makeBasis(ex, ey, ez).setPosition(corner.c); this.add(new THREE.TorusGeometry(R, r, seg, 10, Math.PI / 2), mat, { m: _m.clone() });
        cur = P[i].clone().addScaledVector(corner.d2, R);
      }
    }
    return this;
  }
  get empty() { return this.map.size === 0; }
  // mirrorX: ganze Gruppe an der YZ-Ebene spiegeln (Geometrie spiegeln und Dreiecke umdrehen), damit world.js sie ganz normal zusammenfassen kann
  build({ name = 'batch', renderOrder = 0, mirrorX = false } = {}) {
    const grp = new THREE.Group(); grp.name = name;
    for (const [mat, list] of this.map) {
      const idx = list.filter((g) => g.index).length; if (idx && idx !== list.length) list.forEach((g, i) => { if (g.index) list[i] = g.toNonIndexed(); });
      const merged = mergeGeometries(list, false); if (!merged) continue; list.forEach((g) => g.dispose());
      if (mirrorX) { merged.scale(-1, 1, 1); flipWinding(merged); }
      const m = new THREE.Mesh(merged, mat); m.renderOrder = mat.transparent ? 3 + renderOrder : renderOrder; grp.add(m);
    }
    this.map.clear(); return grp;
  }
}

function flipWinding(g) {
  if (g.index) { const a = g.index.array; for (let i = 0; i < a.length; i += 3) { const t = a[i + 1]; a[i + 1] = a[i + 2]; a[i + 2] = t; } g.index.needsUpdate = true; return; }
  for (const attr of Object.values(g.attributes)) { const n = attr.itemSize, a = attr.array, tmp = new Array(n); for (let i = 0; i + 2 < attr.count; i += 3) for (let k = 0; k < n; k++) { const i1 = (i + 1) * n + k, i2 = (i + 2) * n + k; const t = a[i1]; a[i1] = a[i2]; a[i2] = t; } attr.needsUpdate = true; }
}
// Rahmen mit vielen gleichen Materialien (zum Beispiel Porträtrahmen) zu wenigen Meshes zusammenfassen: gleiche Materialien werden verschmolzen, Bildfläche und Schild bleiben einzeln
export function slimFrame(root) {
  const by = new Map(); for (const c of [...root.children]) { if (!c.isMesh || Array.isArray(c.material) || c.userData.picture) continue; if (!by.has(c.material)) by.set(c.material, []); by.get(c.material).push(c); }
  for (const [mat, list] of by) {
    if (list.length < 2) continue;
    const geos = list.map((m) => { const g = m.geometry.clone(); m.updateMatrix(); g.applyMatrix4(m.matrix); return g; }); const merged = mergeGeometries(geos, false); if (!merged) continue;
    list.forEach((m) => root.remove(m)); root.add(new THREE.Mesh(merged, mat));
  }
  return root;
}
// ---------------------------------------------------------------- Kleinkram
export const rad = (d) => (d * Math.PI) / 180;
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
export function texOf(c, { aniso = 8, srgb = true } = {}) { const t = new THREE.CanvasTexture(c); if (srgb) t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = aniso; return t; }
// Beschriftungsschild als Canvas-Textur (Messing, Papier ...)
export function signTex(text, { w = 512, h = 128, bg = '#3a2a14', fg = '#f6dc8a', font = 'bold 56px Georgia, serif', border = '#d9a441', sub = '', subFont = 'italic 28px Georgia, serif' } = {}) {
  const [c, g] = canvas(w, h); g.fillStyle = bg; g.fillRect(0, 0, w, h);
  if (border) { g.strokeStyle = border; g.lineWidth = 4; g.strokeRect(8, 8, w - 16, h - 16); g.lineWidth = 1.5; g.strokeRect(15, 15, w - 30, h - 30); }
  g.fillStyle = fg; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = font; g.fillText(text, w / 2, sub ? h * 0.42 : h / 2, w - 44);
  if (sub) { g.font = subFont; g.globalAlpha = 0.85; g.fillText(sub, w / 2, h * 0.77, w - 44); }
  return texOf(c);
}
export function signMesh(text, w, h, o = {}) {
  const px = o.px || 640; const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: signTex(text, { w: px, h: Math.round(px * h / w), ...o }), roughness: o.rough ?? 0.45, metalness: o.metal ?? 0.25 })); return m;
}

// Schilder-Atlas: alle Beschriftungsschilder des Raums liegen auf EINER Textur und teilen sich ein Material (world.js fasst sie dann zu einem Zeichenaufruf zusammen)
export function makeSignAtlas(entries) {
  const [c, g] = canvas(1024, 1024), rects = {}, CW = 512, CH = 200;
  entries.forEach((e, i) => {
    const x = (i % 2) * CW, y = Math.floor(i / 2) * CH, ph = Math.round(CW * e.h / e.w); rects[e.key] = { x, y, ph, w: e.w, h: e.h };
    const t = signTex(e.draw ? '' : e.text, { w: CW, h: ph, bg: e.bg || '#3a2410', fg: e.fg || '#f6dc8a', font: e.font || 'bold 56px Georgia, serif', border: e.border ?? '#d9a441' }); g.drawImage(t.image, x, y); t.dispose();
    if (e.draw) { g.save(); g.translate(x, y); e.draw(g, CW, ph); g.restore(); }   // eigene Zeichnung (zum Beispiel Legende mit Farbpunkten)
  });
  const mat = new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.45, metalness: 0.25 });
  return { material: mat, mesh(key) { const r = rects[key], geo = new THREE.PlaneGeometry(r.w, r.h), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, (r.x + uv.getX(i) * 512) / 1024, 1 - (r.y + (1 - uv.getY(i)) * r.ph) / 1024); return new THREE.Mesh(geo, mat); } };
}
export { THREE };
