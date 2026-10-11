// Archimedes in 3D: echtes, geskinntes Modell aus Blender (assets/cat/archimedes.glb, per tools/blender/archimedes.py erzeugt, eingebettet).
// Erbt Verhalten, Wegsuche, Katzenplatz, Tipps und Sprüche von der Papierfigur und ersetzt nur die Figur: Clips (AnimationMixer) statt Papierlagen.
// Der Körper dreht sich in Laufrichtung bzw. weich zur Kamera, Kopf und Augen folgen dem Besucher. Zeichenaufrufe: 3 Netze (Fell, Augen, Zubehör) + Schatten (+ Symbole).
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clamp, lerp, mulberry32 } from '../../../lib/util.js';
import { Archimedes } from './archimedes.js';
import glb from '../../../../assets/cat/archimedes.glb';

const rnd3 = mulberry32(777);
const rr = (a, b) => a + (b - a) * rnd3();
const angDiff = (a, b) => Math.atan2(Math.sin(a - b), Math.cos(a - b));
// Zwischenspeicher (keine Allokation je Bild)
const TMP = { v1: new THREE.Vector3(), v2: new THREE.Vector3(), v3: new THREE.Vector3(), v4: new THREE.Vector3(), v5: new THREE.Vector3(), q1: new THREE.Quaternion(), q2: new THREE.Quaternion(), q3: new THREE.Quaternion(), q4: new THREE.Quaternion(), q5: new THREE.Quaternion(), q6: new THREE.Quaternion(), q7: new THREE.Quaternion() };
const UP = new THREE.Vector3(0, 1, 0), RIGHT = new THREE.Vector3(1, 0, 0);

// Das Modell wird einmal geparst (die Papierkatze braucht es nicht)
let modelPromise = null;
export function loadCatModel() {
  if (!modelPromise) {
    modelPromise = new Promise((resolve, reject) => {
      try {
        if (typeof location !== 'undefined' && /[?&]cat=fail(&|$)/.test(location.search)) throw new Error('?cat=fail: Ladefehler zum Testen des Rückfalls');
        const buf = glb.buffer.slice(glb.byteOffset, glb.byteOffset + glb.byteLength);
        new GLTFLoader().parse(buf, '', resolve, reject);
      } catch (e) { reject(e); }
    });
  }
  return modelPromise;
}

// Eigenschaften der Clips, die nicht im Modell stehen: natürliches Tempo (m/s) der Laufzyklen ersetzt die Metadaten im GLB, falls sie fehlen
const GAIT_FALLBACK = { walk: { stride: 0.2424, T: 1.0 }, trot: { stride: 0.4231, T: 0.5667 }, run: { stride: 0.8824, T: 0.4667 } };
const LOOPS = new Set(['sit_idle', 'sit_calm', 'talk', 'walk', 'trot', 'run', 'sleep_idle']);
const BLINK_OK = new Set(['sit_idle', 'sit_calm', 'talk', 'walk', 'trot', 'meow']);

export class Archimedes3D extends Archimedes {
  constructor(ctx, opts = {}) {
    super(ctx, opts);
    this.onFail = opts.onFail || null;
  }

  // ------------------------------------------------------------ Figur
  initFigure() {
    this.dur = { wake: 0.55, groom: 3.5, stretch: 1.95, sleepin: 0.85 };
    this.model = null; this.ready = false; this.failed = false;
    this.mixer = null; this.mixB = null; this.act = {}; this.cur = null; this.curAct = null; this.gaits = GAIT_FALLBACK;
    this.bodyYaw = 0; this.snapYaw = true; this.gait = 'walk'; this.shot = null; this.lastPoke = -9; this.blinking = false;
    this.look = { yaw: 0, pitch: 0, w: 0, ex: 0, ey: 0 };
    this.bones = {}; this.q0 = {}; this.playLog = [];   // Namen der gespielten Clips (Tests)
    this.group.visible = true;
    loadCatModel().then((g) => this.attach(g)).catch((e) => this.fail(e));
  }
  scheduleWarm() {}
  getPose() { return null; }
  showPose(name) { this.pose = name; }
  switchPose(name, instant, face) { this.pose = name; if (face != null) this.face = face; this.flip = null; }
  runFlip() { this.flip = null; this.flipS = 1; }
  sleepFace() { return 1; }

  fail(e) {
    this.failed = true; console.warn('Archimedes: 3D-Modell nicht geladen, Papierkatze springt ein.', e);
    if (this.onFail) this.onFail(this);
  }

  attach(gltf) {
    if (this.failed) return;
    const model = gltf.scene; model.name = 'archimedes-3d';
    const meshes = [];
    model.traverse((o) => {
      o.userData.dynamic = true;
      if (o.isSkinnedMesh || o.isMesh) { meshes.push(o); o.frustumCulled = false; o.raycast = () => {}; o.castShadow = false; o.receiveShadow = false; o.renderOrder = 2; }
      if (o.isBone) this.bones[o.name] = o;
      if (o.userData.archimedes) { try { this.gaits = { ...GAIT_FALLBACK, ...JSON.parse(o.userData.archimedes).gaits }; } catch (e) { /* Metadaten optional */ } }
    });
    for (const m of meshes) this.tune(m);
    this.model = model; this.group.add(model);
    model.updateMatrixWorld(true);
    for (const [n, b] of Object.entries(this.bones)) this.q0[n] = b.quaternion.clone();
    // Blickrichtung der Augen in ihrem Knochenraum (Modell blickt nach +z)
    this.eyeFwd = {};
    for (const n of ['eyeL', 'eyeR']) { const b = this.bones[n]; if (b) { const q = b.getWorldQuaternion(new THREE.Quaternion()); this.eyeFwd[n] = new THREE.Vector3(0, 0, 1).applyQuaternion(q.invert()); } }
    this.mixer = new THREE.AnimationMixer(model); this.mixB = new THREE.AnimationMixer(model);
    for (const clip of gltf.animations) {
      // Der Blink-Clip darf nur Lider und Augen führen (der Exporter schreibt sonst alle Knochen hinein)
      if (clip.name === 'blink') clip.tracks = clip.tracks.filter((t) => /^(lid|eye)[LR]\./.test(t.name));
      const a = (clip.name === 'blink' ? this.mixB : this.mixer).clipAction(clip);
      if (LOOPS.has(clip.name)) a.setLoop(THREE.LoopRepeat, Infinity); else { a.setLoop(THREE.LoopOnce, 1); a.clampWhenFinished = true; }
      this.act[clip.name] = a;
    }
    this.ready = true; this.cur = null;
    this.updateClips(0, !!this.rig.calm, true);
    this.mixer.update(0);
  }

  // Materialien: matt, weiche Ränder; Augen leuchten leicht aus sich heraus, damit sie in jedem Licht lebendig bleiben
  tune(m) {
    const mat = m.material; if (!mat) return;
    mat.side = THREE.FrontSide;
    if (mat.name === 'Fell') {
      // Fell: matt, mit weichem Schimmer am Rand (Sheen) wie bei Plüsch; die Farbkarte kommt aus dem Modell
      if (mat.map) mat.map.anisotropy = 4;
      const fur = new THREE.MeshPhysicalMaterial({ name: 'Fell', map: mat.map, roughness: 0.9, metalness: 0, sheen: 0.6, sheenRoughness: 0.6, sheenColor: new THREE.Color(0xa6b3cf), envMapIntensity: 0.55 });
      m.material = fur; mat.dispose(); return;
    }
    else if (mat.name === 'Augen') { mat.emissive = new THREE.Color(0xffffff); mat.emissiveMap = mat.map; mat.emissiveIntensity = 0.55; mat.roughness = 0.35; mat.envMapIntensity = 0.7; }
    else { mat.envMapIntensity = 0.8; }
    mat.needsUpdate = true;
  }

  // ------------------------------------------------------------ Blickrichtung
  face_() { const c = this.cam.position; this.yaw = Math.atan2(c.x - this.pos.x, c.z - this.pos.z); }

  targetYaw() {
    const m = this.mode;
    if ((m === 'walk' && this.travel) || m === 'prep' || (m === 'wake' && this.wakeNext === 'go')) {
      const d = (m === 'walk' && this.travel) ? this.heading : (this.goDir || this.heading);
      return Math.atan2(d.x, d.z);
    }
    if (m === 'sleep' || m === 'sleepin') return this.yaw + 0.55 * (this.sleepSide ||= (rnd3() < 0.5 ? -1 : 1));
    return this.yaw;
  }
  updateYaw(dt) {
    const want = this.targetYaw();
    if (this.snapYaw) { this.bodyYaw = want; this.snapYaw = false; return; }
    const walking = (this.mode === 'walk' && this.travel) || this.mode === 'prep';
    const rate = walking ? 9 : (this.mode === 'sleep' ? 0.35 : 2.6);
    const d = angDiff(want, this.bodyYaw);
    this.bodyYaw += d * (1 - Math.exp(-dt * rate));
  }
  place(stationId) { super.place(stationId); this.snapYaw = true; this.sleepSide = 0; }

  // ------------------------------------------------------------ Clips
  play(name, { ts = 1, fade = 0.25, at = null } = {}) {
    const next = this.act[name]; if (!next) return;
    if (this.cur === name && this.curAct === next) {
      next.setEffectiveTimeScale(ts);
      if (at != null) { next.paused = true; next.time = at; }
      return;
    }
    const prev = this.curAct;
    next.reset(); next.setEffectiveTimeScale(ts); next.setEffectiveWeight(1); next.enabled = true;
    if (prev) { next.fadeIn(fade); prev.fadeOut(fade); } else next.weight = 1;
    next.play();
    if (at != null) { next.paused = true; next.time = at; }
    this.cur = name; this.curAct = next; this.playLog.push(name); if (this.playLog.length > 400) this.playLog.splice(0, 200);
  }

  gaitFor(sp) {
    let g = this.gait;
    if (g === 'walk' && sp > 0.62) g = 'trot'; else if (g === 'trot') { if (sp < 0.5) g = 'walk'; else if (sp > 2.1) g = 'run'; } else if (g === 'run' && sp < 1.8) g = 'trot';
    this.gait = g; return g;
  }

  chooseClip(calm) {
    const m = this.mode, tr = this.travel;
    if (m === 'sleep') return { name: 'sleep_idle', ts: calm ? 0.5 : 1, fade: 0.6 };
    if (m === 'sleepin') return { name: 'sleep_idle', fade: 0.9 };
    if (m === 'wake') return { name: 'wake', ts: 1.7, fade: 0.2 };
    if (m === 'groom') return { name: 'groom', fade: 0.3 };
    if (m === 'stretch') return { name: 'stretch', fade: 0.3 };
    if (m === 'prep') return { name: 'walk', ts: 0.2, fade: 0.3 };
    if (m === 'walk' && tr) {
      if (tr.endY > 0.05 && tr.upF > 0 && tr.upF < 1) return { name: 'jump_up', at: tr.upF * this.clipLen('jump_up'), fade: 0.12 };
      if (tr.startY > 0.1 && tr.jf > 0 && tr.jf < 1) return { name: 'jump_down', at: tr.jf * this.clipLen('jump_down'), fade: 0.12 };
      const sp = this.speed, g = this.gaitFor(sp), gi = this.gaits[g];
      const nat = gi.stride / gi.T;
      const lim = { walk: [0.25, 2.4], trot: [0.6, 2.8], run: [0.8, 3.0] }[g];
      return { name: g, ts: clamp(sp / nat, lim[0], lim[1]), fade: 0.22 };
    }
    // Sitzen (und Ankommen): Einzelaktionen, Sprechen, Ruhe
    if (this.shot) return { name: this.shot, fade: 0.14, shot: true };
    if (this.speakT > 0) return { name: 'talk', fade: 0.2 };
    if (calm) return { name: 'sit_calm', fade: 0.3 };
    return { name: 'sit_idle', fade: m === 'settle' ? 0.3 : 0.3 };
  }
  clipLen(name) { return this.act[name] ? this.act[name].getClip().duration : 1; }

  poke() {
    const was = this.mode, quick = this.clock - this.lastPoke < 1.3;
    this.lastPoke = this.clock;
    super.poke();
    if (this.react && was !== 'sleep' && was !== 'walk' && was !== 'prep' && !this.rig.calm) { this.shot = quick ? 'scared' : 'meow'; this.shotActNeedsReset = true; }
  }

  updateClips(dt, calm, first = false) {
    // Einzelaktion beendet?
    if (this.shot && this.curAct && this.cur === this.shot && !this.shotActNeedsReset) {
      const a = this.curAct; if (a.time >= a.getClip().duration - 0.03) this.shot = null;
    }
    if ((this.mode !== 'sit' && this.mode !== 'settle') || (this.shot && !this.act[this.shot])) this.shot = null;
    const w = this.chooseClip(calm);
    if (this.shotActNeedsReset && w.name === this.shot) { if (this.cur === w.name && this.curAct) { this.curAct.reset(); this.curAct.play(); } this.shotActNeedsReset = false; }
    if (first) this.cur = null;
    this.play(w.name, w);
    // Blinzeln (zweites Mischpult nur für die Lider)
    this.tickBlink3(dt, calm, w.name);
  }

  tickBlink3(dt, calm, name) {
    const T = this.t, a = this.act.blink; if (!a) return;
    const ok = BLINK_OK.has(name) && !this.speakShot();
    if (T.blinkT >= 0 && ok) {              // von außen angestoßen (Ankunft: langsames, zufriedenes Blinzeln)
      this.startBlink(T.blinkLen > 0.2 ? 0.4 / T.blinkLen : 1); T.blinkT = -1; T.blinkLen = 0.13;
    } else if (T.blinkT >= 0) T.blinkT = -1;
    if (this.blinking) { if (!a.isRunning() || a.time >= a.getClip().duration - 0.02) this.blinking = false; }
    if (!this.blinking && ok) {
      T.blink -= dt;
      if (T.blink <= 0) { this.startBlink(1); T.blink = rr(2.2, 5.0); if (rnd3() < 0.2) T.blink = 0.34; }
    }
  }
  speakShot() { return this.shot === 'scared'; }
  startBlink(ts) { const a = this.act.blink; a.reset(); a.setEffectiveTimeScale(ts); a.setEffectiveWeight(1); a.play(); this.blinking = true; }

  // ------------------------------------------------------------ Update der Figur
  updateFigure(dt, calm) {
    this.face_();
    this.updateYaw(dt);
    // Antipp-Reaktion (wie bei der Papierfigur: Zeit läuft ab, kleiner Hüpfer am Anfang)
    let hop = 0;
    if (this.react) { const R = this.react; R.t += dt; if (R.t >= R.dur) this.react = null; else if (!calm && R.t < 0.26) hop = 0.045 * Math.sin((R.t / 0.26) * Math.PI); }
    this.hop = hop;
    this.poseW = 0.5; this.poseH = this.pose === 'sleep' ? 0.26 : 0.5;
    if (this.mode === 'walk' || this.mode === 'prep' || this.mode === 'stretch') { this.poseW = 0.6; this.poseH = 0.46; }
    this.apply();
    if (this.ready) {
      this.updateClips(dt, calm);
      this.mixer.update(dt); this.mixB.update(dt);
      this.group.updateMatrixWorld(true);
      this.lookAt(dt, calm);
    }
    this.runFx(dt, calm);
    this.fixShadow();
  }

  // Bodenschatten: weiche Scheibe, längs zum Körper beim Laufen und Liegen
  fixShadow() {
    const m = this.mode, long = (m === 'walk' && this.travel) || m === 'prep' || m === 'sleep' || m === 'sleepin';
    const k = 1 / (1 + this.lift * 3);
    const [w, d] = this.pose === 'sleep' ? [0.58, 0.42] : (m === 'walk' || m === 'prep' || m === 'stretch') ? [0.64, 0.26] : [0.5, 0.36];
    this.shadow.scale.set(w * k, d * k, 1);
    this.sh.rotation.y = long ? this.bodyYaw - Math.PI / 2 : this.yaw;
    this.shadow.position.set(0, 0.017 - this.lift, 0);
  }

  apply() {
    this.group.position.set(this.pos.x, this.ground + this.lift, this.pos.z);
    this.bbf.rotation.y = this.yaw; this.bbn.rotation.y = this.yaw; this.sh.rotation.y = this.yaw;
    this.bbf.scale.set(1, 1, 1);
    if (this.model) { this.model.rotation.y = this.bodyYaw; this.model.position.y = this.hop || 0; }
  }

  // Kopf (Hals) und Augen wenden sich dem Besucher zu
  lookAt(dt, calm) {
    const L = this.look, name = this.cur, m = this.mode;
    const awake = !(m === 'sleep' || m === 'sleepin' || (m === 'wake' && this.curAct && this.curAct.time < 0.3) || name === 'groom' || name === 'scared');
    const wTarget = calm ? 0 : awake ? (m === 'walk' || m === 'prep' ? 0.3 : 1) : 0;
    L.w = lerp(L.w, wTarget, 1 - Math.exp(-dt * 4));
    if (L.w < 0.01 && wTarget === 0) return;
    const head = this.bones.head, neck = this.bones.neck; if (!head || !neck) return;
    const hp = head.getWorldPosition(TMP.v1), modelQ = this.model.getWorldQuaternion(TMP.q1), modelQi = TMP.q2.copy(modelQ).invert();
    const dl = TMP.v2.copy(this.cam.position); dl.y -= 0.12; dl.sub(hp).applyQuaternion(modelQi);     // Richtung zum Besucher im Modellraum (+z = vorn)
    const yaw = clamp(Math.atan2(dl.x, dl.z), -0.6, 0.6), pitch = clamp(Math.atan2(dl.y, Math.hypot(dl.x, dl.z)) * 0.6, -0.22, 0.28);
    const k = 1 - Math.exp(-dt * 5); L.yaw = lerp(L.yaw, yaw, k); L.pitch = lerp(L.pitch, pitch, k);
    const dw = TMP.q3.copy(modelQ);                                                                    // wird je Knochen neu aufgebaut
    const applyDelta = (bone, ay, ap) => {
      if (!bone.parent) return;
      const qp = bone.parent.getWorldQuaternion(TMP.q4);
      TMP.q5.setFromAxisAngle(UP, ay); TMP.q6.setFromAxisAngle(RIGHT, -ap); TMP.q5.multiply(TMP.q6);       // Drehung im Modellraum
      dw.copy(modelQ).multiply(TMP.q5).multiply(modelQi);                                            // ... in den Weltraum
      TMP.q7.copy(qp).invert().multiply(dw).multiply(qp);                                            // ... in den Raum des Elternknochens
      bone.quaternion.premultiply(TMP.q7); bone.updateMatrixWorld(true);
    };
    applyDelta(neck, L.yaw * 0.3 * L.w, L.pitch * 0.3 * L.w);
    applyDelta(head, L.yaw * 0.7 * L.w, L.pitch * 0.7 * L.w);
    // Augen: noch ein Stück weiter zur Kamera (höchstens gut 18 Grad)
    for (const n of ['eyeL', 'eyeR']) {
      const e = this.bones[n]; if (!e || !this.eyeFwd[n]) continue;
      const q = e.getWorldQuaternion(TMP.q4), fw = TMP.v3.copy(this.eyeFwd[n]).applyQuaternion(q);
      const dir = TMP.v4.copy(this.cam.position).sub(e.getWorldPosition(TMP.v5)).normalize();
      const full = fw.angleTo(dir); if (full < 1e-4) continue;
      TMP.q5.setFromUnitVectors(fw, dir); TMP.q6.identity().slerp(TMP.q5, Math.min(full, 0.32) / full);
      const qp = e.parent.getWorldQuaternion(TMP.q4);
      TMP.q7.copy(qp).invert().multiply(TMP.q6).multiply(qp); e.quaternion.premultiply(TMP.q7);
    }
  }

  // ------------------------------------------------------------ Test- und Werkzeugzugriff
  // Clip an einem Zeitpunkt zeigen (Kontaktbögen): keine Mischung, keine Blickwendung
  showClip(name, t = 0, { look = false } = {}) {
    if (!this.ready) return false;
    for (const a of Object.values(this.act)) { a.stop(); }
    const a = this.act[name]; if (!a) return false;
    a.reset(); a.enabled = true; a.setEffectiveWeight(1); a.setEffectiveTimeScale(1); a.play(); a.paused = true; a.time = clamp(t, 0, a.getClip().duration);
    this.mixer.update(0); this.cur = name; this.curAct = a; this.model.updateMatrixWorld(true);
    return true;
  }
  clipNames() { return Object.keys(this.act); }
}
