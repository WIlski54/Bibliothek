// Welt: baut Foyer und Fachräume an ihre Plätze, verwaltet die (gepoolten) Lichter, die Klickziele und das Anklicken per Raycast.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { ROOMS, FOYER_DOORS } from './layout.js';
import { clamp } from '../lib/util.js';
import * as foyer from './rooms/foyer.js';
import * as geschichte from './rooms/geschichte.js';
import * as biologie from './rooms/biologie.js';
import * as chemie from './rooms/chemie.js';

const MODS = { foyer, geschichte, biologie, chemie };
const DEPTS = ['geschichte', 'biologie', 'chemie'];
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
      for (const s of r.stations) this.rig.addStation({ ...s, pos: [s.pos[0] + off[0], s.pos[1], s.pos[2] + off[2]], look: [s.look[0] + off[0], s.look[1], s.look[2] + off[2]] });
      r.group.updateMatrixWorld(true);
      r.group.traverse((o) => { if (o.userData.tap) this.pickRoots.push(o); });
      for (const b of r.blockers) b.traverse((o) => { if (o.isMesh) this.blockerMeshes.add(o); });
      progress?.(++n / ids.length); await nextFrame();
    }
    // Foyer-Lichter fest, Fachraum-Lichter im Pool (4 Stück, werden zum Raum geschwenkt, den man ansieht)
    for (const a of this.rooms.foyer.lights) { const l = new THREE.PointLight(a.color, a.intensity, a.distance, a.decay); l.position.set(...a.pos); this.scene.add(l); this.fixed.push({ l, base: a.intensity }); }
    for (let i = 0; i < 4; i++) { const l = new THREE.PointLight(0xffe2b0, 0, 0, 2); this.scene.add(l); this.pool.push({ l, room: null, cur: 0, tgt: null }); }
    this.setWant('geschichte', true);
    this.roomsOrder = ids;
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
  update(dt) {
    this.t += dt;
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
      if (o) return { tap: o.userData.tap, obj: o, point: h.point };
    }
    return null;
  }
}
