// Buch-Auftritt: Antippen eines Buchs zieht es aus dem Regal, es fliegt auf einen kleinen Lesetisch vor der Kamera, die Kamera gleitet heran
// (Blick schräg von oben, wie im Popup-Buch auf dem Tisch). „Lesen“ fährt noch näher heran und blendet das Buch sanft darüber ein.
import * as THREE from 'three';
import { makeBook } from './books.js';
import { readingTable } from './kit.js';
import { easeOutBack, smoother, clamp, lerp } from '../lib/util.js';

const TABLE_H = 0.8, TOP = TABLE_H + 0.03, BOOK_SCALE = 1.15;
const V = (x, y, z) => new THREE.Vector3(x, y, z);

let blobTex = null;
function blob() {
  if (!blobTex) { const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 4, 32, 32, 32); gr.addColorStop(0, 'rgba(0,0,0,.45)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); blobTex = new THREE.CanvasTexture(c); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: blobTex, transparent: true, depthWrite: false })); m.rotation.x = -Math.PI / 2; m.position.y = 0.006; return m;
}
function glow() { // warmer Lichtkegel-Schein auf dem Tisch
  const c = document.createElement('canvas'); c.width = c.height = 64; const g = c.getContext('2d'); const gr = g.createRadialGradient(32, 32, 2, 32, 32, 32); gr.addColorStop(0, 'rgba(255,225,160,.55)'); gr.addColorStop(1, 'rgba(255,225,160,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(0.95, 0.95), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })); m.rotation.x = -Math.PI / 2; m.position.y = TOP + 0.003; return m;
}

export class Showcase {
  constructor({ scene, rig, ui, ambient }) { Object.assign(this, { scene, rig, ui, ambient }); this.active = false; this.phase = 'idle'; this.t = 0; }

  open(def, srcObj, spot) {
    if (this.active || this.rig.moving) return false;
    const rig = this.rig, cam = rig.camera;
    this.def = def; this.station = rig.cur ?? rig.lastCur; this.src = srcObj; this.active = true; this.phase = 'in'; this.t = 0; this.outT = 0;
    // Blickrichtung (waagerecht) und Platz des Tisches
    const f = V(0, 0, -1).applyEuler(cam.rotation); f.y = 0; f.normalize(); this.f = f;
    const S = spot ? V(spot[0], 0, spot[1]) : cam.position.clone().addScaledVector(f, 2.0).setY(0); this.S = S;
    // Tisch
    const g = new THREE.Group(); g.position.copy(S); const table = readingTable({ r: 0.46, h: TABLE_H }); g.add(table); g.add(blob()); g.add(glow()); g.scale.setScalar(0.001); this.group = g; this.scene.add(g);
    // Fliegendes Buch: Start = Pose des Regalbuchs
    srcObj?.updateWorldMatrix(true, true); let bk = null; srcObj?.traverse((o) => { if (!bk && o.userData?.def) bk = o; });
    const sp = new THREE.Vector3(), sq = new THREE.Quaternion(), ss = new THREE.Vector3(); (bk || srcObj || cam).matrixWorld.decompose(sp, sq, ss);
    const size = { t: 0.06, h: 0.4, d: 0.27 }; const fly = makeBook(def, size); fly.position.copy(sp); fly.quaternion.copy(sq); fly.scale.copy(ss.lengthSq() ? ss : V(1, 1, 1)); this.scene.add(fly); this.fly = fly;
    if (srcObj) srcObj.visible = false;
    const th = Math.atan2(f.z, -f.x), qe = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, th, 0)).multiply(new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, Math.PI / 2)));
    const C = V(S.x, TOP + (size.t * BOOK_SCALE) / 2, S.z), off = V(0, (size.h * BOOK_SCALE) / 2, 0).applyQuaternion(qe);
    this.a = { p: sp.clone(), q: sq.clone(), s: fly.scale.x }; this.b = { p: C.clone().sub(off), q: qe, s: BOOK_SCALE };
    // Kamera: näher heran, schräg von oben auf den Tisch
    this.idlePose = { pos: V(S.x - f.x * 0.78, 1.52, S.z - f.z * 0.78), look: V(S.x, 0.86, S.z) };
    this.readPose = { pos: V(S.x - f.x * 0.16, 1.34, S.z - f.z * 0.16), look: V(S.x, 0.86, S.z) };
    this.ambient?.whoosh();
    this.rig.flyTo(this.idlePose.pos, this.idlePose.look, { dur: 1.8, zoom: 1, onDone: () => { if (this.phase === 'in') this.arrived(); } });
    this.ui.hush(); this.ui.tip(null); document.getElementById('gl').classList.remove('hot'); document.getElementById('hud').classList.add('focus');
    return true;
  }
  arrived() {
    this.phase = 'idle'; this.t = 0;
    this.ui.showBookBar(this.def, { onRead: () => this.read(), onBack: () => this.close() });
  }
  read() {
    if (this.phase !== 'idle' || !this.def.url) return;
    this.phase = 'reading'; this.ui.hideBookBar(); this.ambient?.page();
    this.rig.flyTo(this.readPose.pos, this.readPose.look, { dur: 1.5, zoom: 0.62 });
    setTimeout(() => { if (this.phase === 'reading') { this.phase = 'viewer'; this.ui.openBook(this.def); } }, 700);
  }
  onViewer(state) { // vom UI: 'closing' = Buchansicht wird ausgeblendet
    if (!this.active || state !== 'closing') return;
    this.phase = 'idle'; this.rig.flyTo(this.idlePose.pos, this.idlePose.look, { dur: 1.1, zoom: 1, onDone: () => this.ui.showBookBar(this.def, { onRead: () => this.read(), onBack: () => this.close() }) });
  }
  close() {
    if (!this.active || this.phase === 'out' || this.phase === 'in') return;
    this.phase = 'out'; this.outT = 0; this.ui.hideBookBar(); this.ambient?.whoosh();
    if (this.station) this.rig.goTo(this.station, { onDone: () => {} });
  }
  finish() {
    if (this.src) this.src.visible = true;
    this.scene.remove(this.fly); this.scene.remove(this.group);
    this.fly.traverse((o) => { if (o.isMesh) { o.geometry?.dispose(); for (const m of [].concat(o.material)) { m.map?.dispose(); m.dispose?.(); } } });
    this.group = this.fly = this.src = null; this.active = false; this.phase = 'idle'; document.getElementById('hud').classList.remove('focus');
  }

  update(dt) {
    if (!this.active) return;
    const { fly, group, a, b } = this;
    const place = (u, arc) => { fly.position.lerpVectors(a.p, b.p, u); fly.position.y += Math.sin(Math.PI * u) * arc; fly.quaternion.slerpQuaternions(a.q, b.q, u); fly.scale.setScalar(lerp(a.s, b.s, u)); };
    if (this.phase === 'in') {
      this.t += dt; const ts = clamp(this.t / 0.6, 0, 1); group.scale.setScalar(Math.max(0.001, easeOutBack(ts)));
      const u = smoother(clamp((this.t - 0.2) / 1.25, 0, 1)); place(u, 0.45);
    } else if (this.phase === 'out') {
      this.outT += dt; const u = 1 - smoother(clamp(this.outT / 1.0, 0, 1)); place(u, 0.35);
      group.scale.setScalar(Math.max(0.001, 1 - smoother(clamp((this.outT - 0.55) / 0.45, 0, 1))));
      if (this.outT >= 1.05) { if (this.src) this.src.visible = true; fly.visible = false; }
      if (this.outT >= 1.1 && !this.rig.moving) this.finish();
    } else {
      this.t += dt; place(1, 0); fly.position.y += Math.sin(this.t * 1.6) * 0.004; // leichtes Schweben
    }
  }
}
