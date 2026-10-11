// Archimedes: Figur, Verhalten und Bewegung. Papierfigur (Billboard um die Y-Achse), Posen: sitzen (von vorn), gehen/traben/rennen/strecken (Profil), schlafen.
import * as THREE from 'three';
import { clamp, lerp, easeOutBack, mulberry32, smoother } from '../../../lib/util.js';
import { buildPose } from './rig.js';
import { sitParts, HEAD_VARIANT as SH } from './art-sit.js';
import { walkParts, WALK_HEAD as WH } from './art-walk.js';
import { sleepParts, SLEEP_HEAD as LH } from './art-sleep.js';
import { whiskerMesh, shadowMesh, symbolMesh, setSymbol } from './fx.js';
import { Space } from './space.js';
import { TIPS, LINES, MEOWS } from './talk.js';

const TAU = Math.PI * 2;
const TABLE_SPOT = [0, 0.805, -0.6];   // Foyer-Lesetisch (Mitte, Platte oben)
const wrap = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
const smooth = (t) => t * t * (3 - 2 * t);
// Wegprofil: kurz anlaufen, laufen, etwas länger abbremsen (Anteil 0..1 des Weges nach Zeitanteil u)
const TA = 0.14, TD = 0.2, TV = 1 / (1 - (TA + TD) / 2);
const trap = (u) => (u <= 0 ? 0 : u >= 1 ? 1 : u < TA ? TV * u * u / (2 * TA) : u <= 1 - TD ? TV * (TA / 2 + (u - TA)) : 1 - TV * (1 - u) * (1 - u) / (2 * TD));
const rnd = mulberry32(20240611);
const rr = (a, b) => a + (b - a) * rnd();

// Knoten relativ zur Ruhelage setzen
function put(n, dx = 0, dy = 0, rz = 0, sx = 1, sy = 1) { const b = n.userData.base; n.position.set(b.x + dx, b.y + dy, b.z); n.rotation.z = rz; n.scale.set(sx, sy, 1); }
// Knoten (oberste Ebene) um den Punkt q drehen
function putAbout(n, qx, qy, a, rz = 0, dx = 0, dy = 0, sx = 1, sy = 1) {
  const b = n.userData.base, ca = Math.cos(a), sa = Math.sin(a), rx = b.x - qx, ry = b.y - qy;
  n.position.set(qx + ca * rx - sa * ry + dx, qy + sa * rx + ca * ry + dy, b.z); n.rotation.z = a + rz; n.scale.set(sx, sy, 1);
}

export class Archimedes {
  constructor(ctx) {
    this.ctx = ctx; this.rig = ctx.rig; this.cam = ctx.rig.camera;
    this.group = new THREE.Group(); this.group.name = 'archimedes'; this.group.userData.dynamic = true; this.group.userData.tap = { kind: 'cat', label: 'Archimedes' };
    // bbf: gedreht zur Kamera und gespiegelt (Profil nach links/rechts); bbn: nur gedreht (Symbole); sh: Schattenhalter
    this.bbf = new THREE.Group(); this.bbn = new THREE.Group(); this.sh = new THREE.Group();
    for (const g of [this.bbf, this.bbn, this.sh]) g.userData.dynamic = true;
    this.group.add(this.sh, this.bbf, this.bbn);
    this.shadow = shadowMesh(); this.sh.add(this.shadow);
    // unsichtbare Tippfläche
    this.hit = new THREE.Mesh(new THREE.BoxGeometry(1, 1, 1), new THREE.MeshBasicMaterial({ visible: false })); this.hit.name = 'hitbox'; this.bbf.add(this.hit);
    this.zs = [0, 1, 2].map(() => { const m = symbolMesh('z', 0.1); m.visible = false; this.bbn.add(m); return m; });
    this.pop = symbolMesh('bulb', 0.13); this.pop.visible = false; this.bbn.add(this.pop);
    this.poses = {}; this.warm = ['sleep', 'sit', 'walk'];
    this.space = new Space({ world: ctx.world, rig: this.rig });
    // Zustand
    this.pos = new THREE.Vector3(...TABLE_SPOT); this.ground = TABLE_SPOT[1]; this.lift = 0;
    this.pose = 'sleep'; this.mode = 'sleep'; this.modeT = 0; this.clock = 0; this.face = 1; this.yaw = 0;
    this.flip = null; this.travel = null; this.teleport = null; this.react = null; this.speakT = 0; this.popT = -1; this.stretchT = -1; this.bow = 0;
    this.speed = 0; this.phase = 0; this.vel = new THREE.Vector3(); this.heading = new THREE.Vector3(1, 0, 0);
    this.visited = new Set(['foyer']); this.tipped = new Set(['foyer']); this.lineIdx = {}; this.lineOrder = {}; this.wakeLines = 0;
    this.t = { blink: rr(1.5, 3), ear: rr(2, 5), look: rr(2, 5), wag: rr(6, 12), groom: rr(18, 30), sleep: rr(70, 100), stretch: rr(30, 50), blinkT: -1, earT: -1, earSide: 0, wagT: -1, lookX: 0, lookTo: 0, double: false };
    this.sitHead = 0; this.dbg = {};
    this.getPose('sleep'); this.showPose('sleep');
    this.apply();
    this.scheduleWarm();
  }

  // ------------------------------------------------------------ Posen bauen (leicht verzögert im Hintergrund)
  getPose(name) {
    if (this.poses[name]) return this.poses[name];
    const t0 = performance.now(); let P, wh;
    if (name === 'sit') { P = buildPose(sitParts(), { name }); wh = whiskerMesh('front'); wh.position.set(0, 0.03, 0.001); P.nodes.head.add(wh); P.nodes.lickR.visible = false; }
    else if (name === 'walk') { P = buildPose(walkParts(), { name }); wh = whiskerMesh('side'); wh.position.set(0.108, 0.02, 0.001); P.nodes.head.add(wh); }
    else { P = buildPose(sleepParts(), { name }); wh = whiskerMesh('front'); wh.scale.setScalar(0.8); wh.position.set(0.008, -0.03, 0.001); P.nodes.head.add(wh); }
    P.whiskers = wh; P.root.visible = false; P.root.userData.dynamic = true; for (const n of Object.values(P.nodes)) n.userData.dynamic = true;
    this.bbf.add(P.root); this.poses[name] = P; P.buildMs = performance.now() - t0; return P;
  }
  scheduleWarm() {
    const order = ['sit', 'walk'];
    const next = () => { const n = order.shift(); if (!n) return; try { this.getPose(n); } catch (e) { console.error(e); } setTimeout(next, 120); };
    setTimeout(next, 250);
  }
  showPose(name) { this.pose = name; for (const [k, p] of Object.entries(this.poses)) p.root.visible = k === name; }
  switchPose(name, instant = false, face = null) {
    this.getPose(name);
    if (this.flip && this.flip.to === name && (face == null || this.flip.face === face)) return;
    if (name === this.pose && !this.flip && (face == null || face === this.face)) return;
    if (instant || this.rig.calm) { this.flip = null; this.showPose(name); if (face != null) this.face = face; return; }
    this.flip = { t: 0, dur: 0.2, to: name, face: face ?? this.face, swapped: false };
  }
  // Profilrichtung (+1 = nach Bildschirm-rechts) für eine Bewegungsrichtung d (Welt)
  faceFor(d) { const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw); const sx = d.x * rx + d.z * rz; return sx >= 0 ? 1 : -1; }
  sleepFace() { const c = this.cam.position, rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw), s = (this.pos.x - c.x) * rx + (this.pos.z - c.z) * rz; return Math.abs(s) < 0.4 ? 1 : s > 0 ? -1 : 1; }

  // ------------------------------------------------------------ Schnittstelle
  place(stationId) {
    this.travel = null; this.teleport = null; this.flip = null; this.react = null; this.popT = -1;
    const first = !this.placed; this.placed = true;
    if (first && (!stationId || stationId === 'foyer-eingang')) { this.pos.set(...TABLE_SPOT); this.ground = TABLE_SPOT[1]; this.setSleep(); return; }
    const spot = this.space.spotFor(stationId); if (!spot) return;
    this.pos.copy(spot); this.ground = spot.y; this.lift = 0; this.setSit(true);
    this.tipped.add(this.rig.stations.get(stationId)?.room);
  }
  setSleep() { this.mode = 'sleep'; this.modeT = 0; this.getPose('sleep'); this.showPose('sleep'); this.flip = null; this.face = this.sleepFace(); this.t.sleep = rr(70, 100); }
  setSit(instant = false) { this.mode = 'sit'; this.modeT = 0; this.switchPose('sit', instant); this.t.sleep = rr(70, 100); this.t.groom = rr(14, 26); }

  follow(fromId, toId, route) {
    const target = this.space.spotFor(toId); if (!target) return;
    this.react = null; this.speakT = 0; this.popT = -1; this.teleport = null;
    const rt = this.rig.travel;
    if (this.rig.calm || rt?.calm) { this.travel = null; this.teleport = { t: 0, at: 0.27, pos: target }; if (this.mode === 'sleep') this.mode = 'sit'; return; }
    const guide = (route || []).map((p) => new THREE.Vector3(p.x, 0, p.z));
    const path = this.space.plan(this.pos, target, guide);
    let L = 0; const lens = [0]; for (let i = 1; i < path.length; i++) { L += Math.hypot(path[i].x - path[i - 1].x, path[i].z - path[i - 1].z); lens.push(L); }
    const dur = rt?.dur || 3;
    const wasSleeping = this.mode === 'sleep';
    const delay = wasSleeping ? 0.45 : 0.22; this.curS = 0;
    if (L < 0.35) { this.pos.copy(target); this.ground = target.y; return; }
    let T = Math.max(0.7, dur * 0.86 - delay - (wasSleeping ? 0.3 : 0)); T = Math.max(T, L / (0.83 * 6.5));
    this.travel = { path, lens, L, T, t: 0, s: 0, useCam: !!rt, lead: 0.6 / Math.max(1, dur), delay, delay0: delay, stretchPrep: wasSleeping, startY: this.pos.y, endY: target.y, target, jumpAt: Math.max(0.05, (lens[1] || 0.7) - 0.55) };
    this.goFace = this.faceFor(new THREE.Vector3(path[1].x - this.pos.x, 0, path[1].z - this.pos.z));
    if (wasSleeping) { this.mode = 'wake'; this.modeT = 0; this.wakeNext = 'go'; } else { this.mode = 'prep'; this.modeT = 0; this.switchPose('walk', false, this.goFace); }
  }
  arrive(stationId) {
    const st = this.rig.stations.get(stationId); const room = st?.room;
    // Katze am Ziel absetzen, falls sie noch unterwegs ist
    if (this.teleport) this.finishTeleport();
    if (this.travel) { const rest = this.travel.L - (this.curS || 0); if (rest > 1.2) this.endTravel(true); else this.travel.T = Math.min(this.travel.T, this.travel.t + 0.35); }
    this.t.blinkT = 0.5; this.t.wagT = 1.0;
    if (room && !this.tipped.has(room) && TIPS[room]) { this.tipped.add(room); this.say(TIPS[room], { tip: true }); }
    this.visited.add(room);
  }
  greet() { this.tipped.add('foyer'); this.say(TIPS.foyer, { tip: true }); }
  tipFor(room) { return TIPS[room]; }

  say(text, { tip = false, bulb } = {}) {
    const ms = Math.min(10500, 4500 + text.length * (tip ? 60 : 55)); this.ctx.ui?.say?.(text, { ms: tip ? Math.max(7000, ms) : ms });
    this.speakT = Math.min(3.2, text.length * 0.045);
    if (bulb ?? /Heureka/.test(text)) this.showPop('bulb', 2.2);
  }
  showPop(kind, dur = 1.6) { setSymbol(this.pop, kind); this.popT = 0; this.popDur = dur; }

  poke() {
    const room = this.rig.room || 'foyer';
    if (this.mode === 'walk' || this.mode === 'prep') return;
    const was = this.mode;
    if (was === 'sleep') { // aufwecken, erster Satz ist eine Ausrede
      const w = ['Mrrau? Ich habe nur die Augen ausgeruht.', 'Hm? Ich war nicht eingeschlafen. Ich habe nachgedacht.', 'Miau … ach, du bist es. Gut, dass du da bist.'];
      this.mode = 'wake'; this.modeT = 0; this.wakeNext = 'sit'; this.say(w[this.wakeLines++ % w.length], { bulb: false }); this.showPop('excl', 1.2); return;
    }
    const list = LINES[room] || LINES.foyer;
    if (!this.lineOrder[room]) { const o = list.map((_, i) => i); for (let i = o.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [o[i], o[j]] = [o[j], o[i]]; } this.lineOrder[room] = o; this.lineIdx[room] = 0; }
    const text = list[this.lineOrder[room][this.lineIdx[room]++ % list.length]];
    if (was === 'groom') { this.mode = 'sit'; this.modeT = 0; }
    this.react = { t: 0, dur: Math.max(1.8, Math.min(4.5, text.length * 0.045)) };
    this.say(text);
    if (!/Heureka/.test(text)) this.showPop(rnd() < 0.5 ? 'excl' : 'quest', 1.5);
    this.t.sleep = rr(70, 100);
  }
  // Tippfläche für Tests und die Oberfläche: Mittelpunkt des Körpers (Welt)
  bodyCenter() { return new THREE.Vector3(this.pos.x, this.pos.y + 0.2, this.pos.z); }

  // ------------------------------------------------------------ Bewegung
  finishTeleport() { const tp = this.teleport; this.teleport = null; this.travel = null; this.pos.copy(tp.pos); this.ground = tp.pos.y; this.lift = 0; this.speed = 0; this.setSit(true); }
  endTravel(snap = false) {
    const tr = this.travel; this.travel = null; if (!tr) return;
    this.pos.copy(tr.target); this.ground = tr.endY; this.lift = 0; this.speed = 0;
    if (snap) this.setSit(true); else { this.mode = 'settle'; this.modeT = 0; }
  }
  stepTravel(dt) {
    const tr = this.travel; if (this.mode !== 'walk' && this.mode !== 'prep') return;
    if (this.mode === 'prep') { tr.delay -= dt; if (tr.delay <= 0) { this.mode = 'walk'; this.modeT = 0; } return; }
    tr.t += dt;
    // Sollweg: Die Katze läuft der Kamera ein Stück voraus (gleicher Zeitverlauf wie die Kamerafahrt), sonst nach eigenem Zeitplan
    const rt = this.rig.travel; let target;
    if (tr.useCam && rt && !rt.calm) target = tr.L * smoother(clamp(rt.t + tr.lead)); else if (tr.useCam) target = tr.L; else target = tr.L * trap(clamp(tr.t / tr.T));
    const vmax = 7.0; const s = Math.min(Math.max(target, tr.s || 0), (tr.s || 0) + vmax * dt); tr.s = s; this.curS = s;
    const L = tr.lens; let i = 1; while (i < L.length - 1 && L[i] < s) i++;
    const a = tr.path[i - 1], b = tr.path[i], seg = (L[i] - L[i - 1]) || 1, f = clamp((s - L[i - 1]) / seg);
    const old = this.pos.clone();
    this.pos.x = lerp(a.x, b.x, f); this.pos.z = lerp(a.z, b.z, f);
    // Höhe: erst vom Möbelstück herunterspringen
    const jl = tr.jumpAt, jf = clamp((s - jl) / 0.6); this.ground = tr.startY > 0.1 ? lerp(tr.startY, 0, smooth(jf)) : 0; this.lift = tr.startY > 0.1 && jf > 0 && jf < 1 ? 0.16 * Math.sin(Math.PI * jf) : 0;
    this.pos.y = this.ground + this.lift;
    const d = new THREE.Vector3(this.pos.x - old.x, 0, this.pos.z - old.z); const sp = d.length() / Math.max(dt, 1e-4);
    if (sp > 0.02) this.heading.copy(d).normalize();
    this.speed = lerp(this.speed, sp, 1 - Math.exp(-dt * 14)); this.phase += this.speed * dt * (this.speed > 2.2 ? 1.0 : this.speed > 0.7 ? 1.85 : 2.8);
    if (s >= tr.L - 0.004) this.endTravel(false);
  }

  // ------------------------------------------------------------ Update
  update(dt) {
    dt = Math.min(dt, 0.05); this.clock += dt; this.modeT += dt;
    const calm = !!this.rig.calm;
    if (!this.space.done && !this.travel) this.space.warm(2.5);
    if (this.teleport) { this.teleport.t += dt; if (this.teleport.t >= this.teleport.at) this.finishTeleport(); }
    if (this.travel) this.stepTravel(dt);
    this.runMode(dt, calm);
    this.runFlip(dt);
    this.face_();
    const a = this['anim_' + this.pose]; if (a) a.call(this, dt, calm);
    this.runFx(dt, calm);
    this.apply();
  }

  runFlip(dt) {
    const f = this.flip; if (!f) { this.flipS = 1; return; }
    f.t += dt; const u = f.t / f.dur;
    if (u >= 0.5 && !f.swapped) { f.swapped = true; this.showPose(f.to); this.face = f.face; }
    if (u >= 1) { this.flip = null; this.flipS = 1; return; }
    this.flipS = Math.abs(u < 0.5 ? 1 - u * 2 : u * 2 - 1);
  }

  runMode(dt, calm) {
    const T = this.t;
    switch (this.mode) {
      case 'sleep': break;
      case 'wake': { // Augen auf, kleiner Schreck, dann weiter
        if (this.modeT > 0.26) {
          if (this.wakeNext === 'go') { this.mode = 'prep'; this.modeT = 0; this.switchPose('walk', false, this.goFace); }
          else { this.setSit(); this.t.blinkT = 0.4; }
        }
        break;
      }
      case 'settle': { if (this.pose !== 'sit' && !this.flip) this.switchPose('sit'); if (this.modeT > 0.35) { this.mode = 'sit'; this.modeT = 0; this.t.groom = rr(12, 24); this.t.sleep = rr(70, 100); } break; }
      case 'sit': {
        if (calm) break;
        T.groom -= dt; T.sleep -= dt; T.stretch -= dt;
        if (T.groom <= 0 && !this.react && !this.speakT) { this.mode = 'groom'; this.modeT = 0; T.groom = rr(22, 40); }
        else if (T.stretch <= 0 && !this.react && !this.speakT) { this.mode = 'stretch'; this.modeT = 0; T.stretch = rr(40, 70); this.switchPose('walk', false, this.sitStretchFace || 1); }
        else if (T.sleep <= 0 && !this.react && !this.speakT) { this.mode = 'sleepin'; this.modeT = 0; }
        break;
      }
      case 'groom': { if (this.modeT > 4.6 || calm) { this.mode = 'sit'; this.modeT = 0; } break; }
      case 'sleepin': { if (this.modeT > 0.9) { this.switchPose('sleep', false, this.sleepFace()); this.mode = 'sleep'; this.modeT = 0; } break; }
      case 'stretch': { if (this.modeT > 1.9) { this.mode = 'sit'; this.modeT = 0; this.switchPose('sit'); } break; }
      default: break;
    }
  }

  // Blickrichtung: Billboard zur Kamera, Profil nach links/rechts je nach Bewegung
  face_() {
    const c = this.cam.position; this.yaw = Math.atan2(c.x - this.pos.x, c.z - this.pos.z);
    if (this.pose === 'walk' && !this.flip && this.travel && this.mode === 'walk') {
      const rx = Math.cos(this.yaw), rz = -Math.sin(this.yaw), sx = this.heading.x * rx + this.heading.z * rz;
      if (Math.abs(sx) > 0.35 && (sx > 0 ? 1 : -1) !== this.face) this.flip = { t: 0, dur: 0.16, to: 'walk', face: sx > 0 ? 1 : -1, swapped: false };
    }
  }

  // ------------------------------------------------------------ Animation je Pose
  headVariantSit() {
    const T = this.t, speakOpen = this.speakT > 0 && Math.sin(this.clock * 17) > 0;
    if (this.mode === 'groom') return SH.happy;
    if (T.blinkT >= 0) return SH.closed;
    if (this.react && this.react.t < 0.35) return SH.wide;
    if (speakOpen) return SH.speak;
    if (this.mode === 'wake') return SH.wide;
    return SH.open;
  }
  anim_sit(dt, calm) {
    const P = this.poses.sit, n = P.nodes, T = this.t, t = this.clock;
    const br = Math.sin(t * 1.7);
    // Zeitgeber
    T.blink -= dt; if (T.blink <= 0 && T.blinkT < 0) { T.blinkT = 0; T.double = rnd() < 0.2; T.blink = rr(2.2, 5.0); }
    if (T.blinkT >= 0) { T.blinkT += dt; if (T.blinkT > 0.13) { if (T.double) { T.double = false; T.blinkT = -0.12 + 0.0; } else T.blinkT = -1; } }
    if (T.blinkT < 0 && T.blinkT > -1) T.blinkT = -1;
    let tailRot = 0.07 * Math.sin(t * 1.4) + 0.03 * Math.sin(t * 2.9), earL = 0, earR = 0, headRz = 0, headDx = 0, headDy = 0, headS = 1, hop = 0, bodySy = 1 + 0.01 * br;
    if (!calm) {
      T.ear -= dt; if (T.ear <= 0) { T.ear = rr(2.5, 6.5); T.earT = 0; T.earSide = rnd() < 0.5 ? -1 : 1; }
      if (T.earT >= 0) { T.earT += dt; const u = T.earT / 0.3; if (u >= 1) T.earT = -1; else { const f = Math.sin(u * Math.PI) * (1 - u * 0.3); if (T.earSide < 0) earL = 0.4 * f; else earR = -0.4 * f; } }
      T.wag -= dt; if (T.wag <= 0) { T.wag = rr(7, 14); T.wagT = 0; }
      if (T.wagT >= 0) { T.wagT += dt; const u = T.wagT / 1.4; if (u >= 1) T.wagT = -1; else tailRot += 0.3 * Math.sin(T.wagT * 11) * Math.sin(u * Math.PI); }
      T.look -= dt; if (T.look <= 0) { T.look = rr(3, 8); T.lookTo = rnd() < 0.3 ? 0 : rr(-0.13, 0.13); }
      T.lookX = lerp(T.lookX, T.lookTo, 1 - Math.exp(-dt * 3.2));
      headRz = -T.lookX; headDx = T.lookX * 0.06;
    }
    // Reaktion auf Antippen: Hüpfer, Kopf hoch, Schwanz wedelt, Ohren zurück/auf
    const R = this.react;
    if (R) {
      R.t += dt; const u = R.t / R.dur; if (u >= 1) this.react = null;
      else {
        const k = Math.max(0, 1 - u);
        hop = R.t < 0.28 ? 0.05 * Math.sin((R.t / 0.28) * Math.PI) : 0;
        headS = 1 + 0.045 * Math.max(0, 1 - R.t * 3); headRz += -0.11 * Math.sin(Math.min(1, u * 1.6) * Math.PI) * (this.face || 1);
        headDy += 0.006 * Math.sin(Math.min(1, R.t / 0.3) * Math.PI);
        if (!calm) { tailRot += 0.34 * Math.sin(R.t * 15) * k; const f = R.t < 0.2 ? -0.4 : 0.25 * Math.sin(R.t * 3) * k; earL += -f; earR += f; }
      }
    }
    // Putzen: rechte Pfote an die Wange, Kopf neigt sich, Pfote streicht
    const gr = this.mode === 'groom';
    P.nodes.lickR.visible = gr; n.legR.visible = !gr;
    if (gr) {
      const m = this.modeT, on = smooth(clamp(m / 0.5)) * (1 - smooth(clamp((m - 4.1) / 0.5)));
      headRz += -0.17 * on; headDx += 0.01 * on; headDy -= 0.004 * on * (0.5 + 0.5 * Math.sin(m * 9));
      put(n.lickR, 0, 0, -0.08 * Math.sin(m * 9) * on + (1 - on) * 0.5, 1, 1); n.lickR.scale.set(on, on, 1);
      earL += 0.08 * on; earR += -0.1 * on; tailRot += 0.12 * Math.sin(m * 2.2) * on;
    }
    // Flip nach dem Hinsetzen: der Schwanz bleibt ruhig bis zum Ende der Wende
    const wake = this.mode === 'wake'; if (wake) { earL -= 0.2; earR += 0.2; }
    put(n.body, 0, 0, 0, 1, bodySy); put(n.tail, 0, 0, tailRot);
    put(n.head, headDx, headDy + 0.0035 * br, headRz, headS, headS); put(n.earL, 0, 0, earL); put(n.earR, 0, 0, earR);
    P.cuts.head.setVariant(this.headVariantSit());
    P.root.position.y = hop;
    this.bbfOffset = 0; this.poseW = 0.5; this.poseH = 0.5;
  }

  anim_sleep(dt, calm) {
    const P = this.poses.sleep, n = P.nodes, T = this.t, t = this.clock;
    const br = Math.sin(t * 1.35);
    put(n.body, 0, 0, 0, 1, 1 + 0.028 * br); put(n.head, 0, 0.0045 * br, 0.01 * br, 1, 1 + 0.01 * br); put(n.tail, 0, 0, 0.02 * Math.sin(t * 0.8));
    let earR = 0, earL = 0;
    if (!calm) { T.ear -= dt; if (T.ear <= 0) { T.ear = rr(4, 9); T.earT = 0; T.earSide = rnd() < 0.5 ? -1 : 1; } if (T.earT >= 0) { T.earT += dt; const u = T.earT / 0.35; if (u >= 1) T.earT = -1; else { const f = Math.sin(u * Math.PI) * 0.35; if (T.earSide < 0) earL = f; else earR = -f; } } }
    put(n.earL, 0, 0, earL); put(n.earR, 0, 0, earR);
    const wake = this.mode === 'wake'; const sl = this.mode === 'sleepin';
    P.cuts.head.setVariant(wake ? LH.wide : sl ? LH.slit : LH.closed);
    P.root.position.y = 0; this.poseW = 0.5; this.poseH = 0.26;
  }

  anim_walk(dt, calm) {
    const P = this.poses.walk, n = P.nodes, t = this.clock;
    const moving = this.mode === 'walk' && this.travel, sp = this.testSpeed ?? (moving ? this.speed : 0);
    const gait = sp > 2.2 ? 'gallop' : sp > 0.7 ? 'trot' : sp > 0.05 ? 'walk' : 'stand';
    const ph = this.phase;
    const sw = (off, amp) => amp * Math.sin(TAU * (ph + off));
    let fN = 0, fF = 0, hN = 0, hF = 0, bob = 0, tail = 0.1 * Math.sin(t * 1.6), pitch = 0, headRz = 0, headDy = 0, hopRise = 0, lift = [1, 1, 1, 1], bodySx = 1;
    if (gait === 'walk') { const a = 0.32; fN = sw(0, a); hN = sw(0.25, a); fF = sw(0.5, a); hF = sw(0.75, a); bob = 0.003 * Math.abs(Math.sin(TAU * ph * 2)); tail += 0.1; }
    else if (gait === 'trot') { const a = 0.5; fN = sw(0, a); hF = sw(0, a); fF = sw(0.5, a); hN = sw(0.5, a); bob = 0.008 * Math.abs(Math.sin(TAU * ph * 2)); tail += 0.15 * Math.sin(ph * TAU); headRz = 0.05 * Math.sin(TAU * ph * 2); }
    else if (gait === 'gallop') { const a = 0.78; fN = sw(0, a); fF = sw(0.08, a); hN = sw(0.5, a * 0.9); hF = sw(0.58, a * 0.9); bob = 0.022 * Math.max(0, Math.sin(TAU * ph)) ; pitch = -0.06 * Math.sin(TAU * ph); tail = 0.95 + 0.12 * Math.sin(ph * TAU * 2); bodySx = 1 + 0.05 * Math.sin(TAU * ph); headRz = 0.1 * Math.sin(TAU * ph); }
    const idleStretch = this.mode === 'stretch' ? Math.sin(clamp((this.modeT - 0.2) / 1.5) * Math.PI) : (this.mode === 'prep' && this.travel?.stretchPrep ? Math.sin(clamp((this.travel.delay0 - this.travel.delay) / this.travel.delay0) * Math.PI) : 0);
    const jump = this.lift > 0.01 || (moving && this.ground > 0.02 && this.curS >= (this.travel?.jumpAt ?? 9));
    if (jump) { const u = clamp(this.travel ? (this.curS - this.travel.jumpAt) / 0.6 : 1); fN = 0.9 - 0.4 * u; fF = 0.8 - 0.4 * u; hN = -0.7 + 0.5 * u; hF = -0.6 + 0.5 * u; bob = 0; pitch = 0.1 - 0.2 * u; tail = 0.3; }
    if (this.mode === 'wake' || (this.mode === 'prep' && this.modeT < 0.3)) { tail = 0.25 + 0.2 * Math.sin(t * 12); }
    // Strecken (Verbeugung): Vorderkörper nach unten, Beine nach vorn, Schwanz hoch
    const bw = idleStretch;
    const hipX = -0.118, hipY = 0.19, a = -0.27 * bw;
    for (const [name, rz, i] of [['foreNear', fN, 0], ['foreFar', fF, 1], ['hindNear', hN, 2], ['hindFar', hF, 3]]) {
      const node = n[name], fore = i < 2;
      if (fore) putAbout(node, hipX, hipY, a, rz + 0.78 * bw + 0.27 * bw, 0.0, bob, 1, 1);
      else putAbout(node, hipX, hipY, 0, rz - 0.25 * bw, 0, bob, 1, 1);
    }
    putAbout(n.body, hipX, hipY, a, 0, 0, bob, bodySx + 0.06 * bw, 1);
    putAbout(n.tail, hipX, hipY, a, tail - 0.35 * bw, 0, bob);
    putAbout(n.head, hipX, hipY, a, headRz + 0.2 * bw, 0, bob + headDy);
    put(n.earNear, 0, 0, 0); put(n.earFar, 0, 0, 0);
    const blink = this.t.blinkT >= 0;
    if (!this.travel || this.mode !== 'walk') { this.t.blink -= dt; if (this.t.blink <= 0 && this.t.blinkT < 0) { this.t.blinkT = 0; this.t.blink = rr(2.2, 5); } if (this.t.blinkT >= 0) { this.t.blinkT += dt; if (this.t.blinkT > 0.13) this.t.blinkT = -1; } }
    const talk = this.speakT > 0 && Math.sin(this.clock * 17) > 0;
    P.cuts.head.setVariant(blink ? WH.closed : (gait === 'gallop' ? WH.meow : talk ? WH.speak : WH.open));
    P.root.position.y = this.lift * 0 + hopRise; P.root.rotation.z = pitch;
    this.poseW = 0.7; this.poseH = 0.46;
  }

  // ------------------------------------------------------------ Zusatzlagen
  runFx(dt, calm) {
    // Zzz
    const sleeping = this.pose === 'sleep' && !this.flip;
    for (let i = 0; i < 3; i++) {
      const z = this.zs[i]; z.visible = sleeping;
      if (!sleeping) continue;
      const ph = calm ? 0.25 + i * 0.28 : ((this.clock * 0.32 + i / 3) % 1);
      const f = this.face;
      z.position.set(0.14 * f + ph * 0.1 * f, 0.22 + ph * 0.3, 0.04); z.scale.setScalar(0.45 + ph * 0.75);
      z.material.opacity = 1; z.material.transparent = true; z.material.opacity = Math.sin(Math.PI * Math.min(1, ph * 1.08)) ** 0.6;
    }
    // Symbol über dem Kopf (Glühbirne, Ausrufe-, Fragezeichen)
    const p = this.pop;
    if (this.popT >= 0) {
      this.popT += dt; const u = this.popT / this.popDur;
      if (u >= 1) { this.popT = -1; p.visible = false; }
      else {
        p.visible = true; const e = easeOutBack(clamp(this.popT / 0.35)); const s = Math.max(0.01, e);
        const top = this.pose === 'sleep' ? 0.32 : this.pose === 'walk' ? 0.6 : 0.6;
        p.position.set(this.pose === 'sit' ? 0.13 : 0.0, top + 0.03 * Math.sin(this.clock * 6), 0.05); p.scale.setScalar(s);
        p.material.opacity = 1; p.material.transparent = true; p.material.opacity = u > 0.8 ? (1 - u) / 0.2 : 1;
      }
    } else p.visible = false;
    if (this.speakT > 0) this.speakT = Math.max(0, this.speakT - dt);
    // Schatten und Tippfläche
    const lift = this.lift, shw = this.pose === 'walk' ? 0.74 : this.pose === 'sleep' ? 0.62 : 0.5, shd = this.pose === 'walk' ? 0.26 : 0.28, k = 1 / (1 + lift * 3);
    this.shadow.scale.set(shw * k, shd * k, 1); this.shadow.material.opacity = 0.9 * k; this.shadow.position.set(0, 0.017 - lift, -0.06);
    const dist = this.cam.position.distanceTo(this.group.position);
    const w = Math.max(this.poseW + 0.1, 0.085 * dist), h = Math.max(this.poseH + 0.08, 0.085 * dist * 1.1);
    this.hit.scale.set(w, h, 0.4); this.hit.position.set(0, h / 2 - 0.04, 0);
  }

  apply() {
    this.group.position.set(this.pos.x, this.ground + this.lift, this.pos.z);
    this.bbf.rotation.y = this.yaw; this.bbn.rotation.y = this.yaw; this.sh.rotation.y = this.yaw;
    const fs = this.pose === 'sit' ? 1 : this.face;
    this.bbf.scale.set(fs * (this.flipS ?? 1) || 0.001, 1, 1);
  }
}
