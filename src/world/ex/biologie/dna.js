// Biologie: DNA-Doppelhelix (B-DNA) als großes 3D-Modell, Sockel, Legende. Fachlich genau:
//  - rechtsgängig, 10 Basenpaare je Windung (36 Grad, Anstieg 0,34 nm je Paar -> hier 0,08 m), Durchmesser des Rückgrats etwa 2 nm
//  - zwei Zucker-Phosphat-Rückgrate (Phosphate orange, Desoxyribose als Fünfeck-Ring), gegenläufig (Strang 1 von 5' unten nach 3' oben)
//  - Basenpaare nur A-T (2 Wasserstoffbrücken) und G-C (3); Purine (A, G) mit Doppelring, Pyrimidine (T, C) mit Einzelring
//  - Furchen verschieden breit: die beiden Rückgrate sitzen um 130 Grad versetzt, die Basenpaar-Ebene liegt NICHT symmetrisch zur Achse
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { M, mat, mesh, box, hitBox, hitPlane } from '../../kit.js';
import { canvas, texOf, memo, SERIF } from './style.js';

export const DNA = {
  N: 25, RISE: 0.08, TWIST: Math.PI / 5, R: 0.215, R_SUG: 0.178, R_C1: 0.142, DELTA: (130 * Math.PI) / 180,
  SEQ: 'GATTACAGCTCGATGCCTAGGCATG', // Strang 1, 5' -> 3' (unten -> oben)
  COLORS: { A: 0xe0463c, T: 0xf3cf2e, G: 0x8a4fc4, C: 0x2f7fd6 },
  NAMES: { A: 'Adenin', T: 'Thymin', G: 'Guanin', C: 'Cytosin' },
};
export const COMP = { A: 'T', T: 'A', G: 'C', C: 'G' };
export const isPurine = (b) => b === 'A' || b === 'G';
const HB = { A: 2, T: 2, G: 3, C: 3 };

// ---------------------------------------------------------------- Formen der Basen in der Basenpaar-Ebene (u zum Partner, v von der Sugar-Seite zur Furche)
const RHO = 0.056, CY = 0.088, HW = 0.1285 - 0.017;   // Sechseck-Radius, Mittelhöhe, Abstand der Paarungskante von der Sugar-Seite
export const CXH = HW - RHO * Math.cos(Math.PI / 6);   // Mittelpunkt des Sechsrings
const R5 = RHO / (2 * Math.sin(Math.PI / 5));
export function hexPts(cx = CXH, cy = CY, r = RHO) { return Array.from({ length: 6 }, (_, k) => { const a = Math.PI / 2 + (k * Math.PI) / 3; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }); }
export function pentPts(cx = CXH - RHO * Math.cos(Math.PI / 6) - R5 * Math.cos(Math.PI / 5), cy = CY, r = R5) { return Array.from({ length: 5 }, (_, k) => { const a = Math.PI + (k * 2 * Math.PI) / 5; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; }); }
export const ATTACH = { pyr: () => hexPts()[3], pur: () => pentPts()[1] };   // N1 (unterste Ecke) bzw. N9 (untere Ecke des Fünfrings)

// ---------------------------------------------------------------- Geometrie-Hilfen
const V3 = THREE.Vector3, UP = new V3(0, 1, 0);
const nonIndexed = (g) => (g.index ? g.toNonIndexed() : g);
function mergeAll(list) { if (!list.length) return null; return mergeGeometries(list.map((g) => { const n = nonIndexed(g); for (const k of Object.keys(n.attributes)) if (!['position', 'normal', 'uv'].includes(k)) n.deleteAttribute(k); return n; }), false); }
function cylBetween(a, b, r, seg = 8) { const d = b.clone().sub(a), len = d.length(), g = new THREE.CylinderGeometry(r, r, len, seg, 1); g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(UP, d.normalize()), new V3(1, 1, 1))); return g; }
function plateGeo(pts, th, ex, ey, org) { // flaches Vieleck in der Ebene (ex, ey), um die Höhe org.y zentriert
  const s = new THREE.Shape(pts.map(([u, v]) => new THREE.Vector2(u, v)));
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelThickness: 0.004, bevelSize: 0.004, bevelSegments: 1, curveSegments: 1 });
  const ez = new V3().crossVectors(ex, ey); g.translate(0, 0, -th / 2);
  g.applyMatrix4(new THREE.Matrix4().makeBasis(ex, ey, ez).setPosition(org)); return g;
}
const helixPt = (t, off, r, y0 = 0) => { const a = t * DNA.TWIST + off; return new V3(r * Math.cos(a), y0 + t * DNA.RISE, -r * Math.sin(a)); };   // rechtsgängig um +y

// Band (flacher Streifen mit Dicke) entlang der Schraube des Zucker-Phosphat-Rückgrats
function ribbonGeo(off, y0, { w = 0.05, th = 0.016, seg = 260 } = {}) {
  const { N } = DNA, t0 = -0.5, t1 = N - 0.5, pos = [], idx = [];
  for (let i = 0; i <= seg; i++) {
    const t = t0 + ((t1 - t0) * i) / seg, c = helixPt(t, off, DNA.R, y0), rad = new V3(c.x, 0, c.z).normalize();
    for (const [dy, dr] of [[-1, -1], [-1, 1], [1, 1], [1, -1]]) pos.push(c.x + rad.x * dr * th / 2, c.y + dy * w / 2, c.z + rad.z * dr * th / 2);
  }
  for (let i = 0; i < seg; i++) { const a = i * 4, b = a + 4; for (let k = 0; k < 4; k++) { const k2 = (k + 1) % 4; idx.push(a + k, b + k, b + k2, a + k, b + k2, a + k2); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx);
  const ng = g.toNonIndexed(); ng.computeVertexNormals(); ng.setAttribute('uv', new THREE.Float32BufferAttribute(new Float32Array(ng.attributes.position.count * 2), 2)); return ng;
}

// Buchstaben-Plättchen (A T G C) als Atlas
export function letterTex() {
  return memo('dna-letters', () => {
    const [c, g] = canvas(512, 128), keys = ['A', 'T', 'G', 'C'];
    keys.forEach((k, i) => { const x = i * 128 + 64; g.fillStyle = '#' + DNA.COLORS[k].toString(16).padStart(6, '0'); g.beginPath(); g.arc(x, 64, 56, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff8e6'; g.stroke(); g.fillStyle = '#fff'; g.font = `bold 78px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(k, x, 70); });
    return texOf(c);
  });
}
function endTag(text, color) {
  const [c, g] = canvas(128, 128); g.fillStyle = color; g.beginPath(); g.arc(64, 64, 58, 0, Math.PI * 2); g.fill(); g.lineWidth = 6; g.strokeStyle = '#fff8e6'; g.stroke(); g.fillStyle = '#fff'; g.font = `bold 62px ${SERIF}`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 64, 70);
  const t = texOf(c); const sp = new THREE.Sprite(new THREE.SpriteMaterial({ map: t, depthWrite: false, toneMapped: false })); sp.scale.setScalar(0.14); return sp;
}

// ---------------------------------------------------------------- das Modell (Gruppe um die Achse, y = 0 unten)
export function buildHelix() {
  const { N, RISE, TWIST, R, R_SUG, R_C1, DELTA, SEQ } = DNA, y0 = 0.1;
  const g = new THREE.Group(); g.name = 'helix'; g.userData.dynamic = true;
  const seq1 = SEQ.split(''), seq2 = seq1.map((b) => COMP[b]);            // Strang 2 ist gegenläufig: seq2[n] liegt auf Höhe n, wird aber von oben nach unten gelesen (5' oben)
  const bucket = { A: [], T: [], G: [], C: [], hb: [], stalk: [], sug: [], pho: [], tube: [] };
  const labelQuads = [];
  for (let n = 0; n < N; n++) {
    const y = y0 + n * RISE, a1 = n * TWIST, a2 = a1 + DELTA;
    const c1 = new V3(R_C1 * Math.cos(a1), y, -R_C1 * Math.sin(a1)), c2 = new V3(R_C1 * Math.cos(a2), y, -R_C1 * Math.sin(a2));
    const mid = c1.clone().add(c2).multiplyScalar(0.5), ec = c2.clone().sub(c1).normalize(), ed = mid.clone().setY(y).negate().setY(0).normalize();   // ed: von der Sehne zur Achse und weiter in die große Furche
    const sg1 = new V3(R_SUG * Math.cos(a1), y, -R_SUG * Math.sin(a1)), sg2 = new V3(R_SUG * Math.cos(a2), y, -R_SUG * Math.sin(a2));
    const bases = [[seq1[n], c1, ec, sg1, a1], [seq2[n], c2, ec.clone().negate(), sg2, a2]];
    for (const [b, org, eu, sg, a] of bases) {
      const th = 0.032, hex = hexPts(), pent = pentPts();
      bucket[b].push(plateGeo(hex, th, eu, ed, org));
      let att;
      if (isPurine(b)) { bucket[b].push(plateGeo(pent, th, eu, ed, org)); att = ATTACH.pur(); } else att = ATTACH.pyr();
      const ap = org.clone().addScaledVector(eu, att[0]).addScaledVector(ed, att[1]);
      bucket.stalk.push(cylBetween(sg, ap, 0.0085, 6));
      // Zucker: Fünfring (Desoxyribose), Flächennormale radial nach außen
      const ring = new THREE.Shape(Array.from({ length: 5 }, (_, k) => { const t = Math.PI / 2 + (k * 2 * Math.PI) / 5; return new THREE.Vector2(0.036 * Math.cos(t), 0.036 * Math.sin(t)); }));
      ring.holes.push(new THREE.Path(Array.from({ length: 5 }, (_, k) => { const t = Math.PI / 2 + (k * 2 * Math.PI) / 5; return new THREE.Vector2(0.019 * Math.cos(t), 0.019 * Math.sin(t)); })));
      const sgeo = new THREE.ExtrudeGeometry(ring, { depth: 0.016, bevelEnabled: false }); sgeo.translate(0, 0, -0.008);
      const radial = sg.clone().setY(0).normalize(), side = new V3().crossVectors(UP, radial).normalize();
      sgeo.applyMatrix4(new THREE.Matrix4().makeBasis(side, UP.clone(), radial).setPosition(sg)); bucket.sug.push(sgeo);
      // Beschriftung (Buchstaben-Plättchen, außen am Rückgrat)
      labelQuads.push({ b, pos: sg.clone().addScaledVector(radial, 0.085).setY(y + 0.002), radial });
    }
    // Wasserstoffbrücken: weiße Stäbchen zwischen den Basen (zwei bei A-T, drei bei G-C), in der Paarungsebene, entlang der Sehne
    const hc = c1.distanceTo(c2) / 2, k = HB[seq1[n]], pos = k === 2 ? [CY - 0.013, CY + 0.013] : [CY - 0.022, CY, CY + 0.022];
    for (const v of pos) bucket.hb.push(cylBetween(mid.clone().addScaledVector(ec, -0.0245).addScaledVector(ed, v), mid.clone().addScaledVector(ec, 0.0245).addScaledVector(ed, v), 0.008, 6));
  }
  // Rückgrate: Band entlang der Schraube; Phosphate (orange) zwischen den Zuckern
  const mkCurve = (off, rev) => new THREE.CatmullRomCurve3(Array.from({ length: N * 6 + 1 }, (_, i) => { const t = -0.5 + (i / 6); return helixPt(t, off, R, y0); }));
  const curves = [mkCurve(0), mkCurve(DELTA)];
  for (const off of [0, DELTA]) bucket.tube.push(ribbonGeo(off, y0));
  for (const off of [0, DELTA]) for (let n = 0; n < N - 1; n++) { const p = helixPt(n + 0.5, off, R, y0); const s = new THREE.SphereGeometry(0.034, 12, 9); s.translate(p.x, p.y, p.z); bucket.pho.push(s); }
  // Stäbe vom Rückgrat zum Zucker (kurz)
  for (const off of [0, DELTA]) for (let n = 0; n < N; n++) { const p = helixPt(n, off, R, y0), q = helixPt(n, off, R_SUG, y0); bucket.stalk.push(cylBetween(p, q, 0.0085, 6)); }
  const mk = (list, color, o = {}) => { const gm = mergeAll(list); if (!gm) return null; const m = new THREE.Mesh(gm, mat(`dna-${color}-${JSON.stringify(o)}`, () => new THREE.MeshStandardMaterial({ color, roughness: 0.35, metalness: 0.0, ...o }))); m.frustumCulled = false; return m; };
  for (const b of ['A', 'T', 'G', 'C']) g.add(mk(bucket[b], DNA.COLORS[b], { roughness: 0.3 }));
  g.add(mk(bucket.hb, 0xffffff, { roughness: 0.3, emissive: 0x555555 }));
  g.add(mk(bucket.stalk, 0xb8b2a0, { roughness: 0.5 }));
  g.add(mk(bucket.sug, 0xf2ede0, { roughness: 0.35 }));
  g.add(mk(bucket.pho, 0xf08a22, { roughness: 0.28, metalness: 0.15 }));
  g.add(mk([bucket.tube[0]], 0xbcd2e0, { roughness: 0.4, metalness: 0.1 }));   // Strang 1 (5' unten): bläulich
  g.add(mk([bucket.tube[1]], 0xe0d4b4, { roughness: 0.4, metalness: 0.1 }));   // Strang 2 (5' oben): sandfarben
  // Pfeilspitzen an den 3'-Enden: Strang 1 oben (Richtung +y), Strang 2 unten (Richtung -y)
  const arrows = [];
  { const e = curves[0].getPoint(1), tg = curves[0].getTangent(1); const c = new THREE.ConeGeometry(0.03, 0.09, 12); c.applyMatrix4(new THREE.Matrix4().compose(e.clone().addScaledVector(tg, 0.03), new THREE.Quaternion().setFromUnitVectors(UP, tg), new V3(1, 1, 1))); arrows.push(c); }
  { const e = curves[1].getPoint(0), tg = curves[1].getTangent(0).negate(); const c = new THREE.ConeGeometry(0.03, 0.09, 12); c.applyMatrix4(new THREE.Matrix4().compose(e.clone().addScaledVector(tg, 0.03), new THREE.Quaternion().setFromUnitVectors(UP, tg), new V3(1, 1, 1))); arrows.push(c); }
  g.add(mk(arrows, 0xf08a22, { roughness: 0.3 }));
  // Enden beschriften: 5' und 3'
  const tagAt = (p, dir, text, color) => { const s = endTag(text, color); s.position.copy(p).addScaledVector(dir, 0.11); g.add(s); };
  const up = new V3(0, 1, 0);
  tagAt(curves[0].getPoint(0), up.clone().negate(), '5′', '#2f6aa8'); tagAt(curves[0].getPoint(1), up, '3′', '#b04a2a');
  tagAt(curves[1].getPoint(0), up.clone().negate(), '3′', '#b04a2a'); tagAt(curves[1].getPoint(1), up, '5′', '#2f6aa8');
  // Buchstaben (ein/aus)
  const labels = (() => {
    const pos = [], uv = [], idx = [], nrm = []; const order = { A: 0, T: 1, G: 2, C: 3 };
    labelQuads.forEach((q, i) => { const side = new V3().crossVectors(UP, q.radial).normalize(), s = 0.055, base = i * 4; for (const [dx, dy] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) { const p = q.pos.clone().addScaledVector(side, dx * s).addScaledVector(UP, dy * s); pos.push(p.x, p.y, p.z); nrm.push(q.radial.x, 0, q.radial.z); } const u0 = order[q.b] / 4; uv.push(u0 + 0.0, 0, u0 + 0.25, 0, u0 + 0.25, 1, u0, 1); idx.push(base, base + 1, base + 2, base, base + 2, base + 3); });
    const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); geo.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); geo.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); geo.setIndex(idx);
    const m = new THREE.Mesh(geo, mat('dna-letters', () => new THREE.MeshBasicMaterial({ map: letterTex(), transparent: true, alphaTest: 0.3, toneMapped: false }))); m.visible = false; m.frustumCulled = false; return m;
  })();
  g.add(labels); g.userData.labels = labels; g.userData.height = y0 + (N - 1) * RISE + 0.1;
  return g;
}

// ---------------------------------------------------------------- Sockel mit Plakette und Beschriftungs-Knopf
export function buildDnaStand({ h = 0.7 } = {}) {
  const g = new THREE.Group(), stone = M.plain(0xe6dec8, 0.5), brass = M.brass(), dark = M.plain(0x2c5a3e, 0.6);
  const base = mesh(new THREE.CylinderGeometry(0.56, 0.6, 0.1, 40), stone, { tile: 1 }); base.position.y = 0.05; g.add(base);
  const step = mesh(new THREE.CylinderGeometry(0.44, 0.5, 0.08, 40), stone, { tile: 1 }); step.position.y = 0.14; g.add(step);
  const col = mesh(new THREE.CylinderGeometry(0.34, 0.4, h - 0.28, 40), stone, { tile: 1 }); col.position.y = 0.18 + (h - 0.28) / 2; g.add(col);
  const cap = mesh(new THREE.CylinderGeometry(0.46, 0.38, 0.1, 40), stone, { tile: 1 }); cap.position.y = h - 0.05; g.add(cap);
  const ring = mesh(new THREE.TorusGeometry(0.46, 0.014, 8, 48), brass); ring.rotation.x = Math.PI / 2; ring.position.y = h - 0.0; g.add(ring);
  const ring2 = mesh(new THREE.TorusGeometry(0.405, 0.012, 8, 48), brass); ring2.rotation.x = Math.PI / 2; ring2.position.y = 0.19; g.add(ring2);
  const top = mesh(new THREE.CylinderGeometry(0.44, 0.44, 0.02, 40), dark, { tile: 1 }); top.position.y = h + 0.005; g.add(top);
  g.userData.top = h + 0.015; return g;
}
export function dnaPlaque() {
  const [c, gg] = canvas(512, 192); const gr = gg.createLinearGradient(0, 0, 0, 192); gr.addColorStop(0, '#f2d88a'); gr.addColorStop(0.35, '#c99a3c'); gr.addColorStop(0.6, '#f0d27a'); gr.addColorStop(1, '#9a6d1c'); gg.fillStyle = gr; gg.fillRect(0, 0, 512, 192);
  gg.fillStyle = '#2a1a0c'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.font = `bold 62px ${SERIF}`; gg.fillText('Die Doppelhelix', 256, 70); gg.font = `italic 34px ${SERIF}`; gg.fillText('DNA · Bauplan des Lebens', 256, 132);
  gg.strokeStyle = '#6a4a14'; gg.lineWidth = 4; gg.strokeRect(10, 10, 492, 172);
  return new THREE.Mesh(new THREE.PlaneGeometry(0.42, 0.157), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.4, metalness: 0.4 }));
}
export function labelButton() {
  const [c, gg] = canvas(256, 96); const gr = gg.createLinearGradient(0, 0, 0, 96); gr.addColorStop(0, '#f2d88a'); gr.addColorStop(0.5, '#c99a3c'); gr.addColorStop(1, '#9a6d1c'); gg.fillStyle = gr; gg.fillRect(0, 0, 256, 96);
  gg.fillStyle = '#2a1a0c'; gg.textAlign = 'center'; gg.textBaseline = 'middle'; gg.font = `bold 34px ${SERIF}`; gg.fillText('A T G C', 128, 36); gg.font = `italic 22px ${SERIF}`; gg.fillText('Tippe: Buchstaben ein/aus', 128, 72); gg.strokeStyle = '#6a4a14'; gg.lineWidth = 3; gg.strokeRect(5, 5, 246, 86);
  return new THREE.Mesh(new THREE.PlaneGeometry(0.26, 0.098), new THREE.MeshStandardMaterial({ map: texOf(c), roughness: 0.4, metalness: 0.4 }));
}
