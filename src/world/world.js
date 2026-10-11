// Welt: baut Foyer und Fachräume an ihre Plätze, verwaltet die (gepoolten) Lichter, die Klickziele und das Anklicken per Raycast.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ROOMS, FOYER_DOORS } from './layout.js';
import { clamp } from '../lib/util.js';
import * as foyer from './rooms/foyer.js';
import * as geschichte from './rooms/geschichte.js';
import * as biologie from './rooms/biologie.js';
import * as chemie from './rooms/chemie.js';
import { createCat } from './cat.js';
import { mergeStatic } from './merge.js';

const MODS = { foyer, geschichte, biologie, chemie };
const DEPTS = ['geschichte', 'biologie', 'chemie'];
const EYE_Y = 1.6;
const nextFrame = () => new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));

export class World {
  constructor(renderer, scene, rig, ctx) {
    this.renderer = renderer; this.scene = scene; this.rig = rig; this.ctx = ctx;
    this.rooms = {}; this.pickRoots = []; this.blockerMeshes = new Set(); this.ray = new THREE.Raycaster(); this.t = 0;
    this.want = null; this.fixed = []; this.pool = [];
    scene.background = new THREE.Color(0x120d0a);
    scene.add(new THREE.HemisphereLight(0xfff0dc, 0x4a3524, 0.5));
    const pm = new THREE.PMREMGenerator(renderer); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture; scene.environmentIntensity = 0.32; pm.dispose();
  }
  async build(progress) {
    const ids = ['foyer', ...DEPTS]; let n = 0;
    for (const id of ids) {
      const r = MODS[id].build(this.ctx); const off = ROOMS[id].offset; r.group.position.set(off[0], off[1], off[2]); r.offset = new THREE.Vector3(...off); this.scene.add(r.group); this.rooms[id] = r;
      for (const s of r.stations) this.rig.addStation({ ...s, pos: [s.pos[0] + off[0], s.pos[1], s.pos[2] + off[2]], look: [s.look[0] + off[0], s.look[1], s.look[2] + off[2]], catSpot: s.catSpot && [s.catSpot[0] + off[0], s.catSpot[1], s.catSpot[2] + off[2]], bookSpot: s.bookSpot && [s.bookSpot[0] + off[0], s.bookSpot[1] + off[2]] });
      r.group.updateMatrixWorld(true);
      for (const b of r.blockers) mergeStatic(b);
      r.merged = mergeStatic(r.group, { exclude: r.blockers });
      r.group.traverse((o) => { if (o.userData.tap) this.pickRoots.push(o); });
      for (const b of r.blockers) b.traverse((o) => { if (o.isMesh) this.blockerMeshes.add(o); });
      progress?.(++n / ids.length); await nextFrame();
    }
    // Foyer-Lichter fest, Fachraum-Lichter im Pool (4 Stück, werden zum Raum geschwenkt, den man ansieht)
    for (const a of this.rooms.foyer.lights) { const l = new THREE.PointLight(a.color, a.intensity, a.distance, a.decay); l.position.set(...a.pos); this.scene.add(l); this.fixed.push({ l, base: a.intensity }); }
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffe2b0, 0, 0, 2); this.scene.add(l); this.pool.push({ l, room: null, cur: 0, tgt: null }); }
    this.setWant('geschichte', true);
    this.roomsOrder = ids;
    this.detail = {}; this.culled = {};
    for (const id of ids) { // nicht zusammengefasste Einzelteile je Raum (für das Ausblenden außerhalb des Türausschnitts)
      const list = []; this.rooms[id].group.updateMatrixWorld(true);
      this.rooms[id].group.traverse((o) => {
        if (!(o.isMesh || o.isPoints || o.isLine) || o.name === 'merged' || this.blockerMeshes.has(o) || !o.geometry) return;
        if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere(); const bs = o.geometry.boundingSphere; if (!bs) return;
        const sc = o.matrixWorld.getMaxScaleOnAxis(); list.push({ o, c: bs.center.clone().applyMatrix4(o.matrixWorld), r: bs.radius * sc + 0.35, on: true });
      });
      this.detail[id] = list;
    }
    this.cat = createCat({ rig: this.rig, world: this, ui: this.ctx.ui, books: this.ctx.books }); this.scene.add(this.cat.group); this.pickRoots.push(this.cat.group);
    // Rücksprung-Stationen im Foyer neben jeder Tür (für "Zurück ins Foyer")
    for (const d of DEPTS) {
      const fd = FOYER_DOORS[d]; const ins = new THREE.Vector3(...fd.inside), out = new THREE.Vector3(...fd.outside); const dir = out.clone().sub(ins).setY(0).normalize();
      const p = ins.clone().addScaledVector(dir, -1.6); this.rig.addStation({ id: `foyer-tuer-${d}`, room: 'foyer', name: 'Foyer', pos: [p.x, 1.6, p.z], look: [0, 1.7, 0], hidden: true });
    }
  }

  roomAt(p) {
    for (const d of DEPTS) { const r = ROOMS[d], o = r.offset; if (Math.abs(p.x - o[0]) < r.size.w / 2 + 0.55 && Math.abs(p.z - o[2]) < r.size.d / 2 + 0.55) return d; }
    return 'foyer';
  }
  setWant(id, snap = false) {
    if (this.want === id) return; this.want = id;
    const tgt = id ? this.rooms[id].lights.map((a) => ({ pos: new THREE.Vector3(a.pos[0] + ROOMS[id].offset[0], a.pos[1], a.pos[2] + ROOMS[id].offset[2]), color: a.color, intensity: a.intensity, distance: a.distance, decay: a.decay })) : [];
    this.pool.forEach((s, i) => { s.tgt = tgt[i] || null; s.next = id; });
    if (snap) this.pool.forEach((s) => { this.applyAnchor(s); s.room = id; s.cur = s.tgt ? s.tgt.intensity : 0; s.l.intensity = s.cur; });
  }
  applyAnchor(s) { if (s.tgt) { s.l.position.copy(s.tgt.pos); s.l.color.setHex(s.tgt.color); s.l.distance = s.tgt.distance; s.l.decay = s.tgt.decay; } }
  chooseRoom() { // Welchen Fachraum soll der Lichtpool beleuchten?
    const cam = this.rig.camera, p = cam.position, here = this.roomAt(p);
    if (here !== 'foyer') return here;
    const f = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation); f.y = 0; f.normalize();
    let best = null, bs = 0.5;
    for (const d of DEPTS) { const fd = FOYER_DOORS[d]; const to = new THREE.Vector3(fd.world[0] - p.x, 0, fd.world[2] - p.z); const dist = to.length(); to.normalize(); const sc = f.dot(to) - dist * 0.012; if (sc > bs) { bs = sc; best = d; } }
    return best || this.want || 'geschichte';
  }
  // Nur sichtbare Räume zeichnen: der Raum, in dem die Kamera steht, plus Nachbarräume, deren Tür im Blickfeld liegt
  updateVisibility() {
    const cam = this.rig.camera, p = cam.position, here = this.roomAt(p);
    const f = new THREE.Vector3(0, 0, -1).applyEuler(cam.rotation), vf = (cam.fov * Math.PI) / 180 / 2, th = Math.tan(vf), half = Math.atan(Math.sqrt(th * th + th * th * cam.aspect * cam.aspect)) + 0.3;
    const seen = (d) => { const fd = FOYER_DOORS[d]; const to = new THREE.Vector3(fd.world[0] - p.x, EYE_Y - p.y, fd.world[2] - p.z); const dist = to.length(); return dist < 4.5 || f.dot(to.normalize()) > Math.cos(Math.min(half, 3.0)); };
    const vis = { foyer: here === 'foyer', geschichte: false, biologie: false, chemie: false }; vis[here] = true;
    if (here === 'foyer') for (const d of DEPTS) vis[d] = seen(d); else vis.foyer = seen(here);
    for (const id of this.roomsOrder) { const g = this.rooms[id].group; if (g.visible !== vis[id]) g.visible = vis[id]; }
    // Räume, die man nur durch eine Tür sieht: Einzelteile außerhalb des Türausschnitts nicht zeichnen (Tür = Fenster ins Nachbarzimmer)
    for (const id of this.roomsOrder) {
      if (!vis[id]) continue;
      const door = id === here ? null : id === 'foyer' ? here : id; // Tür, durch die man in diesen Raum schaut
      if (!door) { if (this.culled[id]) { for (const e of this.detail[id]) if (!e.on) { e.o.visible = true; e.on = true; } this.culled[id] = false; } continue; }
      const planes = this.portalPlanes(p, door, id === 'foyer');
      for (const e of this.detail[id]) {
        let inside = true; for (const pl of planes) if (pl.normal.dot(e.c) + pl.constant < -e.r) { inside = false; break; }
        if (inside !== e.on) { e.on = inside; e.o.visible = inside; }
      }
      this.culled[id] = true;
    }
  }
  // Ebenen des Sichtkegels von der Kamera durch den Türausschnitt (nach innen zeigend) + Türebene; towardFoyer: Blick vom Fachraum ins Foyer
  portalPlanes(p, dept, towardFoyer) {
    const fd = FOYER_DOORS[dept], W = new THREE.Vector3(fd.world[0], 0, fd.world[2]);
    const dir = new THREE.Vector3(fd.outside[0] - fd.inside[0], 0, fd.outside[2] - fd.inside[2]).normalize(); // vom Foyer in den Fachraum
    const side = new THREE.Vector3(-dir.z, 0, dir.x), hw = 1.2 + 0.3, top = 3.8, bot = -0.2;
    const C = [[-1, bot], [1, bot], [1, top], [-1, top]].map(([sx, y]) => W.clone().addScaledVector(side, sx * hw).setY(y));
    const mid = W.clone().setY(1.6), planes = [];
    for (let i = 0; i < 4; i++) {
      const a = C[i].clone().sub(p), b = C[(i + 1) % 4].clone().sub(p), n = a.cross(b).normalize();
      if (n.dot(mid.clone().sub(p)) < 0) n.negate(); planes.push(new THREE.Plane(n, -n.dot(p)));
    }
    const nrm = dir.clone().multiplyScalar(towardFoyer ? -1 : 1); planes.push(new THREE.Plane(nrm, -nrm.dot(W) + 0.05));
    return planes;
  }
  update(dt) {
    this.t += dt; this.updateVisibility(); this.cat?.update(dt, this.t);
    for (const id of this.roomsOrder || []) this.rooms[id].update?.(dt, this.t, this);
    this.acc = (this.acc || 0) + dt;
    if (this.acc > 0.12) { this.acc = 0; this.setWant(this.chooseRoom()); }
    for (const s of this.pool) { // erst ausblenden, dann umhängen, dann einblenden
      if (s.room !== s.next) { s.cur = Math.max(0, s.cur - dt * 60); s.l.intensity = s.cur; if (s.cur <= 0.05) { this.applyAnchor(s); s.room = s.next; } }
      else { const g = s.tgt ? s.tgt.intensity : 0; s.cur += (g - s.cur) * clamp(dt * 7, 0, 1); s.l.intensity = s.cur; }
    }
  }

  // Anklicken: NDC (-1..1). Gibt {tap, obj, point} oder null. Wände der Räume verdecken, was dahinter liegt.
  pick(nx, ny) {
    this.ray.setFromCamera({ x: nx, y: ny }, this.rig.camera);
    const targets = [...this.pickRoots, ...this.blockerMeshes];
    const hits = this.ray.intersectObjects(targets, true);
    for (const h of hits) {
      if (this.blockerMeshes.has(h.object)) return null;
      let o = h.object; while (o && !o.userData.tap) o = o.parent;
      if (o) return { tap: o.userData.tap, obj: o, point: h.point, uv: h.uv, hit: h };
    }
    return null;
  }
}
