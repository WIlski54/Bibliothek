// Bunsenbrenner mit Gasschlauch und animierter Flamme (blau = Luftzufuhr offen, gelb = Luftzufuhr geschlossen), Dreifuß mit Drahtnetz.
import * as THREE from 'three';
import { M } from '../../kit.js';
import { Batch, MAT } from './util.js';
import { becher } from './glass.js';

const flameMat = (c, o) => new THREE.MeshBasicMaterial({ color: c, transparent: true, opacity: o, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const haloCache = {};
function haloMat(blue) {
  const k = blue ? 'b' : 'y'; if (haloCache[k]) return haloCache[k];
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, blue ? 'rgba(120,170,255,.9)' : 'rgba(255,190,90,.9)'); gr.addColorStop(0.4, blue ? 'rgba(80,130,255,.28)' : 'rgba(255,150,40,.28)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace;
  return (haloCache[k] = new THREE.SpriteMaterial({ map: t, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false, opacity: 0.55 }));
}
const lathe = (pts, seg = 18) => new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg);

// Ursprung: Tischplatte unter dem Brenner, Gaszufuhr nach +z (hinten). open: Luftloch offen.
export function makeBurner({ open = true, hoseTo = 0.36 } = {}) {
  const grp = new THREE.Group(), b = new Batch(), brass = M.brass();
  b.lathe(MAT.darkSteel(), [[0, 0], [0.064, 0], [0.068, 0.006], [0.066, 0.016], [0.046, 0.027], [0.028, 0.037], [0.021, 0.045]], 0, 0, 0, { seg: 28 });
  b.cyl(MAT.steel(), 0.0165, 0.0165, 0.15, 0, 0.115, 0, { seg: 18 });             // Brennerrohr
  b.cyl(MAT.steel(), 0.0195, 0.0195, 0.008, 0, 0.186, 0, { seg: 18 });            // Rohrkopf
  b.cyl(brass, 0.0225, 0.0225, 0.04, 0, 0.088, 0, { seg: 22 });                   // Luftregulierung (drehbare Manschette)
  b.torus(brass, 0.0225, 0.0035, 0, 0.068, 0, { rx: Math.PI / 2, ts: 22, rs: 5 }); b.torus(brass, 0.0225, 0.0035, 0, 0.108, 0, { rx: Math.PI / 2, ts: 22, rs: 5 });
  if (open) for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.box(MAT.black(), 0.011, 0.024, 0.004, Math.sin(a) * 0.0228, 0.088, Math.cos(a) * 0.0228, a); } // offene Luftlöcher
  else for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4; b.box(brass, 0.011, 0.024, 0.0015, Math.sin(a) * 0.0228, 0.088, Math.cos(a) * 0.0228, a); }
  b.cyl(MAT.steel(), 0.0085, 0.0085, 0.05, 0, 0.03, 0.055, { rx: Math.PI / 2, seg: 10 });   // Schlaucholive
  b.torus(MAT.steel(), 0.0095, 0.0022, 0, 0.03, 0.078, { seg: 8, ts: 12, rs: 5 });
  { const cv = new THREE.CatmullRomCurve3([[0, 0.03, 0.075], [0, 0.031, 0.105], [0, 0.024, 0.14], [0, 0.014, 0.19], [0, 0.0105, 0.26], [0, 0.0105, hoseTo - 0.01]].map((q) => new THREE.Vector3(...q)), false, 'centripetal'); b.add(new THREE.TubeGeometry(cv, 32, 0.0105, 8, false), MAT.hoseOrange()); } // Gasschlauch
  // Gasanschluss auf dem Tisch (gelb markiert)
  b.cyl(brass, 0.02, 0.025, 0.012, 0, 0.006, hoseTo + 0.01, { seg: 14 }); b.cyl(brass, 0.011, 0.011, 0.045, 0, 0.034, hoseTo + 0.01, { seg: 10 });
  b.box(MAT.solid(0xe8c020, 0.5), 0.05, 0.01, 0.014, 0, 0.062, hoseTo + 0.01); b.cyl(brass, 0.008, 0.008, 0.04, 0, 0.03, hoseTo - 0.012, { rx: Math.PI / 2, seg: 8 });
  grp.add(b.build({ name: 'brenner' }));

  // Flamme: eigene Gruppe, dynamisch (flackert über Skalierung und Deckkraft). Kein Licht.
  const fl = new THREE.Group(); fl.name = 'flamme'; fl.userData.dynamic = true; fl.position.y = 0.19;
  const parts = [];
  if (open) {
    const outer = new THREE.Mesh(lathe([[0.0, 0], [0.0145, 0.002], [0.019, 0.03], [0.0185, 0.07], [0.0135, 0.105], [0.0065, 0.132], [0, 0.148]]), flameMat(0x3a78ff, 0.5));
    const inner = new THREE.Mesh(lathe([[0, 0.002], [0.0115, 0.004], [0.0105, 0.025], [0.0065, 0.05], [0, 0.07]]), flameMat(0xa6ecff, 0.85));
    const core = new THREE.Mesh(lathe([[0, 0.004], [0.0055, 0.008], [0.0045, 0.02], [0, 0.033]]), flameMat(0xeaffff, 0.9));
    fl.add(outer, inner, core); parts.push(outer, inner, core);
  } else {
    const outer = new THREE.Mesh(lathe([[0, 0], [0.012, 0.004], [0.026, 0.05], [0.027, 0.11], [0.02, 0.17], [0.01, 0.215], [0, 0.245]]), flameMat(0xff8a1c, 0.42));
    const mid = new THREE.Mesh(lathe([[0, 0.004], [0.011, 0.01], [0.019, 0.05], [0.018, 0.1], [0.011, 0.15], [0, 0.185]]), flameMat(0xffd14a, 0.55));
    const base = new THREE.Mesh(lathe([[0, 0.002], [0.011, 0.004], [0.012, 0.02], [0, 0.04]]), flameMat(0x4f86ff, 0.55));
    fl.add(outer, mid, base); parts.push(outer, mid, base);
  }
  const ph = Math.random() * 6;
  const update = (t) => {
    const f = 1 + 0.045 * Math.sin(t * 15 + ph) + 0.03 * Math.sin(t * 27 + 1.7 + ph) + 0.02 * Math.sin(t * 9.3);
    fl.scale.set(1 + 0.03 * Math.sin(t * 21 + ph), f * (open ? 1 : 1.05), 1 + 0.03 * Math.cos(t * 18)); fl.rotation.z = 0.025 * Math.sin(t * 6.1 + ph); fl.rotation.x = 0.02 * Math.sin(t * 4.7);
    parts.forEach((p, i) => { const m = p.material; m.opacity = Math.max(0.2, m.userData.base + 0.07 * Math.sin(t * (11 + i * 4) + ph)); });
  };
  // weicher Schein um die Flamme (kein Licht, nur ein leuchtender Fleck)
  const halo = new THREE.Sprite(haloMat(open)); halo.scale.setScalar(open ? 0.16 : 0.26); halo.position.y = open ? 0.06 : 0.1; halo.renderOrder = 5; fl.add(halo);
  parts.forEach((p) => { p.material.userData.base = p.material.opacity; p.renderOrder = 6; });
  grp.add(fl);
  return { group: grp, flame: fl, update, topY: 0.19 };
}

// Dreifuß mit Drahtnetz (Keramikmitte) und Becherglas mit Wasser; Ursprung: Tischplatte unter der Mitte
export function makeTripod({ withBeaker = true, h = 0.26 } = {}) {
  const b = new Batch(), grp = new THREE.Group(), st = MAT.darkSteel();
  b.torus(st, 0.07, 0.0045, 0, h, 0, { rx: Math.PI / 2, ts: 28, rs: 6 });
  for (let k = 0; k < 3; k++) { const a = (k * 2 * Math.PI) / 3 + 0.5, x0 = Math.sin(a), z0 = Math.cos(a); b.tube(st, [x0 * 0.07, h, z0 * 0.07], [x0 * 0.1, 0, z0 * 0.1], 0.0045, 6); b.cyl(st, 0.006, 0.006, 0.008, x0 * 0.1, 0.004, z0 * 0.1, { seg: 6 }); }
  b.cyl(MAT.solid(0x8d9296, 0.6, 0.4), 0.088, 0.088, 0.004, 0, h + 0.006, 0, { seg: 28 });   // Drahtnetz
  b.cyl(MAT.ceramic(), 0.038, 0.038, 0.004, 0, h + 0.009, 0, { seg: 20 });                      // Keramikmitte
  if (withBeaker) becher(b, 0, h + 0.011, 0, { R: 0.044, H: 0.1, liquid: 0x8fd0ee, level: 0.55, opacity: 0.6 });
  grp.add(b.build({ name: 'dreifuss' })); return grp;
}
