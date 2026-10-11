// Kamerafahrt: Stationen, Routen durch Türen, freies Umschauen (begrenzt), Zoom. Keine Kollision nötig: man bewegt sich nur zwischen Stationen.
import * as THREE from 'three';
import { clamp, smoother, lerp, TAU } from '../lib/util.js';
import { ROOMS, FOYER_DOORS, WALL_T } from './layout.js';

const EYE = 1.6;
const V = (a) => new THREE.Vector3(a[0], a[1], a[2]);
const wrapPI = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };

export class Rig {
  constructor(camera, { onArrive } = {}) {
    this.camera = camera; this.onArrive = onArrive || (() => {});
    this.stations = new Map(); this.cur = null; this.room = 'foyer';
    this.travel = null; this.calm = false;
    this.ry = 0; this.rx = 0;            // Basis-Blickrichtung (Euler y, x)
    this.yaw = 0; this.pitch = 0;        // Umschauen-Versatz (Nutzer)
    this.yawT = 0; this.pitchT = 0;
    this.zoom = 1; this.zoomT = 1;       // 1 = Normal, kleiner = näher
    this.maxYaw = Infinity; this.maxPitchUp = 0.75; this.maxPitchDown = 0.55;
    this.aspect = 1.6; this.hfov = (88 * Math.PI) / 180;
    this.fade = 0; this.fadeCb = null;   // Ruhiger Modus: Überblenden statt Fahren
    this.camera.rotation.order = 'YXZ';
  }
  addStation(st) { // st: {id, room, name, pos:[x,y,z], look:[x,y,z], hidden}
    this.stations.set(st.id, { ...st, P: V(st.pos), L: V(st.look) });
  }
  roomStations(room) { return [...this.stations.values()].filter((s) => s.room === room && !s.hidden); }

  // sofort setzen (Start, Tests)
  jump(id) {
    const st = this.stations.get(id); if (!st) return; this.travel = null; this.cur = id; this.room = st.room;
    this.lastCur = id; this.camera.position.copy(st.P); this.setBase(st.L.clone().sub(st.P)); this.yaw = this.yawT = 0; this.pitch = this.pitchT = 0; this.applyView();
  }
  setBase(f, snap = true) {
    f = f.clone().normalize(); const ry = Math.atan2(-f.x, -f.z), rx = Math.asin(clamp(f.y, -1, 1));
    this.ry = snap ? ry : this.ry + wrapPI(ry - this.ry); this.rx = rx;
  }
  applyView() {
    const c = this.camera; c.rotation.set(clamp(this.rx + this.pitch, -1.35, 1.35), this.ry + this.yaw, 0);
    const a = this.aspect, z = this.zoom;
    const vf = 2 * Math.atan(Math.tan(this.hfov / 2) * z / a);
    c.fov = clamp((vf * 180) / Math.PI, 28, 82); c.updateProjectionMatrix();
  }
  resize(w, h) { this.aspect = w / h; this.camera.aspect = w / h; this.applyView(); }

  look(dx, dy, radPerPx) { // Ziehen: Welt folgt dem Finger
    this.yawT = clamp(this.yawT + dx * radPerPx, -this.maxYaw, this.maxYaw);
    this.pitchT = clamp(this.pitchT + dy * radPerPx, -this.maxPitchDown, this.maxPitchUp);
  }
  zoomBy(f) { this.zoomT = clamp(this.zoomT * f, 0.45, 1.0); }
  recenter() { this.yawT = 0; this.pitchT = 0; this.zoomT = 1; }

  // Route zwischen zwei Stationen; liefert Wegpunkte {p, l}
  route(a, b) {
    const A = this.stations.get(a), B = this.stations.get(b); const pts = [];
    const cl = (w) => ({ p: w.p.clone(), l: w.l.clone() });
    pts.push({ p: A.P.clone(), l: A.L.clone() });
    if (A.room === B.room) { pts.push({ p: B.P.clone(), l: B.L.clone() }); return pts; }
    if (A.room !== 'foyer') pts.push(...this.doorPoints(A.room).leave.map(cl));
    if (A.room !== 'foyer' && B.room !== 'foyer') { // durchs Foyer von Tür zu Tür, um die Mitte herum
      const fa = this.doorPoints(A.room).foyerSide.p, fb = this.doorPoints(B.room).foyerSide.p;
      const mid = fa.clone().add(fb).multiplyScalar(0.5); mid.y = EYE; const hv = new THREE.Vector2(mid.x, mid.z);
      if (hv.length() < 3.2) { if (hv.length() < 0.2) hv.set(0, 1); hv.setLength(3.4); mid.x = hv.x; mid.z = hv.y; }
      pts.push({ p: mid, l: fb.clone() });
    }
    if (B.room !== 'foyer') pts.push(...this.doorPoints(B.room).enter.map(cl));
    pts.push({ p: B.P.clone(), l: B.L.clone() });
    return pts;
  }
  // Wegpunkte rund um die Tür eines Fachraums: enter = Foyer → Raum, leave = Raum → Foyer (Blick in Fahrtrichtung)
  doorPoints(room) {
    const fd = FOYER_DOORS[room];
    const fIn = V(fd.inside).setY(EYE), fOut = V(fd.outside).setY(EYE);
    const dir = fOut.clone().sub(fIn).setY(0).normalize(); // vom Foyer in den Fachraum
    const W = V(fd.world).setY(EYE);
    const at = (p, d) => ({ p, l: p.clone().addScaledVector(d, 3) });
    const back = dir.clone().multiplyScalar(-1);
    const foyerP = fIn.clone(), tIn = W.clone().addScaledVector(dir, -0.05), tOut = W.clone().addScaledVector(dir, 2 * WALL_T + 0.05), rIn = tOut.clone().addScaledVector(dir, 1.2);
    return {
      foyerSide: at(foyerP, dir),
      enter: [at(foyerP, dir), at(tIn, dir), at(tOut, dir), at(rIn, dir)],
      leave: [at(rIn, back), at(tOut, back), at(tIn, back), at(foyerP, back)],
    };
  }

  goTo(id, { onDone } = {}) {
    const B = this.stations.get(id); if (!B) return false;
    this.yaw = wrapPI(this.yaw - this.yawT) + wrapPI(this.yawT); this.yawT = wrapPI(this.yawT);
    const from = this.cur ?? this.lastCur ?? id; if (this.cur === id && !this.travel) { this.recenter(); onDone?.(); return true; }
    const A = this.travel || this.cur === null ? null : this.stations.get(from); // freie Pose (nach flyTo) oder laufende Fahrt: direkt von der Kameraposition weiter
    let pts;
    if (A) pts = this.route(from, id);
    else { // Fahrt unterbrechen: von der aktuellen Kameraposition direkt weiter
      pts = [{ p: this.camera.position.clone(), l: this.camera.position.clone().add(new THREE.Vector3(0, 0, -1).applyEuler(this.camera.rotation).multiplyScalar(3)) }, { p: B.P.clone(), l: B.L.clone() }];
    }
    // Duplikate entfernen
    const clean = [pts[0]]; for (const w of pts.slice(1)) if (w.p.distanceTo(clean[clean.length - 1].p) > 0.02) clean.push(w);
    if (clean.length < 2) { this.jump(id); onDone?.(); return true; }
    let len = 0; for (let i = 1; i < clean.length; i++) len += clean[i].p.distanceTo(clean[i - 1].p);
    const dur = clamp(1.3 + len / 4.2, 1.6, 6.5);
    const cp = new THREE.CatmullRomCurve3(clean.map((w) => w.p), false, 'centripetal');
    // Blickrichtung je Wegpunkt als Winkel (y-Drehung unwrapped, Neigung); dazwischen weich überblendet
    const ry = [], rx = [], sa = [0]; let acc = 0;
    clean.forEach((w, i) => { const d = w.l.clone().sub(w.p).normalize(); let a = Math.atan2(-d.x, -d.z); if (i) a = ry[i - 1] + wrapPI(a - ry[i - 1]); ry.push(a); rx.push(Math.asin(clamp(d.y, -1, 1))); if (i) { acc += w.p.distanceTo(clean[i - 1].p); sa.push(acc); } });
    const sn = sa.map((v) => v / (acc || 1));
    const toRoom = B.room;
    if (this.calm) { // Überblenden: kurz ausblenden, springen, einblenden
      this.travel = { calm: true, t: 0, dur: 0.5, id, toRoom, onDone, jumped: false };
    } else {
      this.travel = { calm: false, cp, ry, rx, sn, t: 0, dur, id, toRoom, onDone, len, route: clean.map((w) => w.p.clone()) };
    }
    this.cur = null; this.leaving = from; this.arrivalPending = true;
    this.onTravel?.(from, id, this.stations.get(from)?.room, toRoom);
    return true;
  }

  // Freie Kamerafahrt (ohne Station): gerade Linie von der aktuellen Pose zu pos/look, optional mit Zoomziel. Danach ist cur = null (freie Pose); goTo(station) fährt von dort weiter.
  flyTo(pos, look, { dur = 1.6, zoom = null, onDone } = {}) {
    const d1 = look.clone().sub(pos).normalize(), ry0 = this.ry + this.yaw, rx0 = this.rx + this.pitch;
    const ry1 = ry0 + wrapPI(Math.atan2(-d1.x, -d1.z) - ry0), rx1 = Math.asin(clamp(d1.y, -1, 1));
    this.ry = ry0; this.rx = rx0; this.yaw = this.pitch = this.yawT = this.pitchT = 0; this.cur = null;
    if (this.calm) { this.camera.position.copy(pos); this.ry = ry1; this.rx = rx1; if (zoom != null) this.zoomT = this.zoom = zoom; onDone?.(); return; }
    const p0 = this.camera.position.clone();
    this.travel = { free: true, calm: false, p0, ry: [ry0, ry1], rx: [rx0, rx1], sn: [0, 1], t: 0, dur, zoomTo: zoom, pos: pos.clone(), onDone };
  }

  update(dt) {
    const k = 1 - Math.exp(-dt * 9);
    const tr = this.travel;
    if (tr) {
      tr.t += dt / tr.dur;
      if (tr.calm) { // 0..0.5 aus, Sprung, 0.5..1 ein
        this.fade = tr.t < 0.5 ? tr.t * 2 : Math.max(0, 2 - tr.t * 2);
        if (tr.t >= 0.5 && !tr.jumped) { tr.jumped = true; const st = this.stations.get(tr.id); this.camera.position.copy(st.P); this.setBase(st.L.clone().sub(st.P)); this.yaw = this.yawT = this.pitch = this.pitchT = 0; this.zoomT = this.zoom = 1; }
        if (tr.t >= 1) { this.finish(tr); }
      } else {
        const u = smoother(clamp(tr.t, 0, 1));
        if (tr.free) this.camera.position.lerpVectors(tr.p0, tr.pos, u); else this.camera.position.copy(tr.cp.getPointAt(u));
        let i = 0; while (i < tr.sn.length - 2 && u > tr.sn[i + 1]) i++;
        const f = clamp((u - tr.sn[i]) / ((tr.sn[i + 1] - tr.sn[i]) || 1), 0, 1), e = f * f * (3 - 2 * f);
        this.ry = lerp(tr.ry[i], tr.ry[i + 1], e); this.rx = lerp(tr.rx[i], tr.rx[i + 1], e);
        this.yawT *= 1 - clamp(dt * 4, 0, 1); this.pitchT *= 1 - clamp(dt * 4, 0, 1); this.zoomT = lerp(this.zoomT, tr.zoomTo ?? 1, clamp(dt * 4, 0, 1));
        if (tr.t >= 1) this.finish(tr);
      }
    }
    this.yaw = lerp(this.yaw, this.yawT, k); this.pitch = lerp(this.pitch, this.pitchT, k); this.zoom = lerp(this.zoom, this.zoomT, k);
    this.applyView();
  }
  finish(tr) {
    if (tr.free) { this.travel = null; this.camera.position.copy(tr.pos); this.ry = tr.ry[1]; this.rx = tr.rx[1]; this.yaw = this.pitch = this.yawT = this.pitchT = 0; if (tr.zoomTo != null) this.zoomT = tr.zoomTo; tr.onDone?.(); return; }
    const st = this.stations.get(tr.id); this.travel = null; this.cur = tr.id; this.lastCur = tr.id; this.room = st.room; this.fade = 0;
    this.camera.position.copy(st.P); this.setBase(st.L.clone().sub(st.P), false); this.yaw = this.pitch = this.yawT = this.pitchT = 0;
    this.onArrive(tr.id, st); tr.onDone?.();
  }
  get moving() { return !!this.travel; }
}
