// Figure = animal built from a spec with several paper-cut parts that can pivot (jaw, neck, tail, wings, ...).
// Spec format (see src/art/animals/*.js):
// { id, parts: { body:{layers,z,pivot?}, jaw:{layers,z,pivot:[x,y]}, ... }, anchors:{head:[x,y], mouth:[x,y], ...}, human?:bool }
// Coordinates: METERS, ground at y=0, animal faces +x.
import * as THREE from 'three';
import { buildCut } from './papercut.js';

export class Figure {
  constructor(spec, { worldScale = 0.2, ppu = 90, facing = 1, thickness = 0.03, border = 0.03, maxTex = 1024 } = {}) {
    this.spec = spec; this.id = spec.id; this.worldScale = worldScale;
    this.group = new THREE.Group(); this.group.name = 'fig-' + spec.id;
    this.root = new THREE.Group(); this.group.add(this.root); // for hop/bob
    this.group.userData.figure = this;
    this.parts = {}; this.cuts = []; this.hit = [];
    const order = Object.entries(spec.parts);
    let zi = 0;
    for (const [name, part] of order) {
      const cut = buildCut(part, { worldScale, ppu, thickness, border, maxTex, name: spec.id + ':' + name });
      this.cuts.push(cut);
      const piv = part.pivot || [0, 0];
      const g = new THREE.Group(); g.name = name;
      g.position.set(piv[0] * worldScale, piv[1] * worldScale, (part.z ?? zi) * thickness * 0.55);
      cut.mesh.position.set(-piv[0] * worldScale, -piv[1] * worldScale, 0);
      g.add(cut.mesh);
      this.root.add(g);
      this.parts[name] = g;
      g.userData.rest = { rz: 0, px: g.position.x, py: g.position.y };
      cut.mesh.userData.figure = this;
      this.hit.push(cut.mesh);
      zi++;
    }
    this.group.scale.x = facing;
    this.facing = facing;
    // bbox over the main body
    const main = this.cuts[0].bbox;
    let x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
    for (const c of this.cuts) { const b = c.bbox; x0 = Math.min(x0, b.x0); x1 = Math.max(x1, b.x1); y0 = Math.min(y0, b.y0); y1 = Math.max(y1, b.y1); }
    this.bbox = { x0, x1, y0, y1, w: x1 - x0, h: y1 - y0 };
    this.height = this.bbox.h * worldScale; this.width = this.bbox.w * worldScale;
    this.anchors = {};
    for (const [k, v] of Object.entries(spec.anchors || {})) this.anchors[k] = new THREE.Vector3(v[0] * worldScale, v[1] * worldScale, 0.05);
    this.setCast(true);
  }
  setCast(on) { for (const c of this.cuts) c.mesh.castShadow = on; }
  anchorWorld(name) { const v = (this.anchors[name] || new THREE.Vector3()).clone(); return this.group.localToWorld(v.applyMatrix4(this.root.matrix)); }
  part(name) { return this.parts[name]; }
  rotatePart(name, rz) { const p = this.parts[name]; if (p) p.rotation.z = rz; }
  dispose() { for (const c of this.cuts) c.dispose(); }
}
