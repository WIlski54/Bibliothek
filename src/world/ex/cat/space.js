// Raum für die Katze: Belegungsraster aus der echten Geometrie aller Räume (Wände, Regale, Möbel, Pflanzen ...), Wegsuche (A*)
// und Auswahl des „Katzenplatzes“ je Station. Alles in Weltkoordinaten (Meter), Raster 0.1 m, nur die Bodenschicht (0.06 bis 1.8 m Höhe) zählt.
import * as THREE from 'three';
import { ROOMS, FOYER_DOORS } from '../../layout.js';

const CELL = 0.1;
const X0 = -21, X1 = 21, Z0 = -20, Z1 = 7.5;
const NX = Math.round((X1 - X0) / CELL), NZ = Math.round((Z1 - Z0) / CELL);
const YMIN = 0.06, YMAX = 1.8;      // Höhenband, das erfasst wird
const BLOCK_LO = 0.08, BLOCK_HI = 0.9; // Zelle ist für die Katze gesperrt, wenn Geometrie in diesem Band liegt
const CAT_R = 0.24;                 // Platzbedarf der Katze (Radius, m)
const DIRS = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, Math.SQRT2], [1, -1, Math.SQRT2], [-1, 1, Math.SQRT2], [-1, -1, Math.SQRT2]];

const ci = (x) => Math.floor((x - X0) / CELL), cj = (z) => Math.floor((z - Z0) / CELL);
const inGrid = (i, j) => i >= 0 && j >= 0 && i < NX && j < NZ;

export class Space {
  constructor({ world, rig }) {
    this.world = world; this.rig = rig;
    this.minY = new Float32Array(NX * NZ).fill(9); this.maxY = new Float32Array(NX * NZ).fill(-9);
    this.dist = null; this.blocked = null; this.avoid = null;
    this.job = null; this.done = false; this.spots = new Map(); this.stats = { tris: 0, samples: 0, ms: 0 };
    this.cam = new THREE.PerspectiveCamera(60, 1.6, 0.05, 80);
  }

  // ------------------------------------------------------------ Rasterisieren (in Scheiben, damit kein Ruckeln entsteht)
  *rasterJob() {
    const meshes = [];
    for (const id of this.world.roomsOrder || Object.keys(this.world.rooms)) {
      const g = this.world.rooms[id].group; g.updateMatrixWorld(true);
      g.traverse((o) => { if (o.isMesh && o.material && o.material.visible !== false && o.geometry?.attributes?.position && !Array.isArray(o.material)) meshes.push(o); });
    }
    const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3(), m4 = new THREE.Matrix4();
    let budget = 0;
    for (const mesh of meshes) {
      const pos = mesh.geometry.attributes.position, idx = mesh.geometry.index; m4.copy(mesh.matrixWorld);
      const n = idx ? idx.count : pos.count;
      for (let t = 0; t < n; t += 3) {
        const i0 = idx ? idx.getX(t) : t, i1 = idx ? idx.getX(t + 1) : t + 1, i2 = idx ? idx.getX(t + 2) : t + 2;
        a.fromBufferAttribute(pos, i0).applyMatrix4(m4); b.fromBufferAttribute(pos, i1).applyMatrix4(m4); c.fromBufferAttribute(pos, i2).applyMatrix4(m4);
        this.stats.tris++;
        this.rasterTri(a, b, c);
        if (++budget >= 6000) { budget = 0; yield; }
      }
    }
    this.finishGrid(); this.done = true;
  }
  // Dreieck auf das Band [YMIN, YMAX] beschneiden, dann mit Gitterpunkten (~5 cm) abtasten
  rasterTri(a, b, c) {
    const lo = Math.min(a.y, b.y, c.y), hi = Math.max(a.y, b.y, c.y);
    if (hi < YMIN || lo > YMAX) return;
    let poly = [[a.x, a.y, a.z], [b.x, b.y, b.z], [c.x, c.y, c.z]];
    if (lo < YMIN || hi > YMAX) { poly = clipY(poly, YMIN, true); poly = clipY(poly, YMAX, false); }
    if (poly.length < 3) return;
    for (let k = 1; k + 1 < poly.length; k++) this.sampleTri(poly[0], poly[k], poly[k + 1]);
  }
  sampleTri(p, q, r) {
    // Ecke gegenüber der längsten Kante als Ursprung
    const d = (u, v) => Math.hypot(u[0] - v[0], u[1] - v[1], u[2] - v[2]);
    const lpq = d(p, q), lqr = d(q, r), lrp = d(r, p);
    let o, e1, e2;
    if (lpq >= lqr && lpq >= lrp) { o = r; e1 = p; e2 = q; } else if (lqr >= lrp) { o = p; e1 = q; e2 = r; } else { o = q; e1 = r; e2 = p; }
    const l1 = d(o, e1), l2 = d(o, e2), nu = Math.max(1, Math.ceil(l1 / 0.05)), nv = Math.max(1, Math.ceil(l2 / 0.05));
    const minY = this.minY, maxY = this.maxY;
    for (let u = 0; u <= nu; u++) {
      const fu = u / nu, vmax = Math.floor((1 - fu) * nv + 1e-6);
      for (let v = 0; v <= vmax; v++) {
        const fv = v / nv;
        const x = o[0] + (e1[0] - o[0]) * fu + (e2[0] - o[0]) * fv, y = o[1] + (e1[1] - o[1]) * fu + (e2[1] - o[1]) * fv, z = o[2] + (e1[2] - o[2]) * fu + (e2[2] - o[2]) * fv;
        const i = ci(x), j = cj(z); if (!inGrid(i, j)) continue; const k = j * NX + i;
        if (y < minY[k]) minY[k] = y; if (y > maxY[k]) maxY[k] = y;
        this.stats.samples++;
      }
    }
  }
  finishGrid() {
    const n = NX * NZ;
    // Innenraum = Räume und Türtunnel; alles andere gilt als gesperrt (Wände, Außenbereich)
    const inside = new Uint8Array(n);
    const mark = (cx, cz, hw, hd) => { for (let j = cj(cz - hd); j <= cj(cz + hd); j++) for (let i = ci(cx - hw); i <= ci(cx + hw); i++) if (inGrid(i, j)) inside[j * NX + i] = 1; };
    for (const r of Object.values(ROOMS)) mark(r.offset[0], r.offset[2], r.size.w / 2 - 0.02, r.size.d / 2 - 0.02);
    for (const d of Object.values(FOYER_DOORS)) { const horiz = d.wall === 'W' || d.wall === 'E'; mark(d.world[0], d.world[2], horiz ? 0.9 : 1.15, horiz ? 1.15 : 0.9); }
    this.inside = inside;
    this.blocked = new Uint8Array(n);
    for (let k = 0; k < n; k++) this.blocked[k] = !inside[k] || (this.minY[k] < BLOCK_HI && this.maxY[k] > BLOCK_LO) ? 1 : 0;
    // Abstand zur nächsten gesperrten Zelle (m), Chamfer-Verfahren
    const D = new Float32Array(n).fill(99); for (let k = 0; k < n; k++) if (this.blocked[k]) D[k] = 0;
    const W = [1, Math.SQRT2];
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; let v = D[k]; if (i > 0) v = Math.min(v, D[k - 1] + W[0] * CELL); if (j > 0) { v = Math.min(v, D[k - NX] + W[0] * CELL); if (i > 0) v = Math.min(v, D[k - NX - 1] + W[1] * CELL); if (i < NX - 1) v = Math.min(v, D[k - NX + 1] + W[1] * CELL); } D[k] = v; }
    for (let j = NZ - 1; j >= 0; j--) for (let i = NX - 1; i >= 0; i--) { const k = j * NX + i; let v = D[k]; if (i < NX - 1) v = Math.min(v, D[k + 1] + W[0] * CELL); if (j < NZ - 1) { v = Math.min(v, D[k + NX] + W[0] * CELL); if (i < NX - 1) v = Math.min(v, D[k + NX + 1] + W[1] * CELL); if (i > 0) v = Math.min(v, D[k + NX - 1] + W[1] * CELL); } D[k] = v; }
    this.dist = D;
    // Türzonen, in denen sie nicht sitzen soll
    this.avoid = new Uint8Array(n);
    for (const d of Object.values(FOYER_DOORS)) { const R = 1.7; for (let j = cj(d.world[2] - R); j <= cj(d.world[2] + R); j++) for (let i = ci(d.world[0] - R); i <= ci(d.world[0] + R); i++) if (inGrid(i, j) && Math.hypot(X0 + (i + 0.5) * CELL - d.world[0], Z0 + (j + 0.5) * CELL - d.world[2]) < R) this.avoid[j * NX + i] = 1; }
  }
  warm(ms = 3) {
    if (this.done) return true;
    if (!this.job) { this.job = this.rasterJob(); this.t0 = performance.now(); }
    const end = performance.now() + ms;
    while (performance.now() < end) { if (this.job.next().done) break; }
    if (this.done) this.stats.ms = performance.now() - this.t0;
    return this.done;
  }
  ensure() { if (!this.done) { if (!this.job) { this.job = this.rasterJob(); this.t0 = performance.now(); } while (!this.job.next().done); this.stats.ms = performance.now() - this.t0; } }

  // ------------------------------------------------------------ Abfragen
  clearance(x, z) { this.ensure(); const i = ci(x), j = cj(z); if (!inGrid(i, j)) return 0; return this.dist[j * NX + i]; }
  free(x, z, r = CAT_R) { return this.clearance(x, z) >= r; }
  // Sichtlinie von der Kamera (Auge) zu einem Punkt: durchquert sie Möbel oder Wände?
  occluded(eye, tx, ty, tz, ignoreR = 0.35) {
    this.ensure(); const dx = tx - eye.x, dz = tz - eye.z, len = Math.hypot(dx, dz), n = Math.ceil(len / 0.05);
    for (let s = 1; s < n; s++) {
      const t = s / n, x = eye.x + dx * t, z = eye.z + dz * t; if (Math.hypot(x - tx, z - tz) < ignoreR) break; if (t * len < 0.25) continue;
      const i = ci(x), j = cj(z); if (!inGrid(i, j)) return true; const k = j * NX + i, h = eye.y + (ty - eye.y) * t;
      if (this.maxY[k] > -5 && h >= this.minY[k] - 0.03 && h <= this.maxY[k] + 0.03) return true;
    }
    return false;
  }
  nearestFree(x, z, r = CAT_R, maxR = 2.0) {
    if (this.free(x, z, r)) return [x, z];
    for (let rad = CELL; rad <= maxR; rad += CELL) for (let a = 0; a < 6.2832; a += 0.2) { const px = x + Math.cos(a) * rad, pz = z + Math.sin(a) * rad; if (this.free(px, pz, r)) return [px, pz]; }
    return [x, z];
  }
  // Absprungstelle von einem Möbelstück (z. B. Tisch): freier Boden, der die Strecke Start -> Ziel am wenigsten verlängert
  exitPoint(from, goal) {
    let best = null, bc = 1e9;
    for (let rad = 0.3; rad <= 2.2; rad += 0.1) for (let a = 0; a < 6.2832; a += 0.1) {
      const x = from.x + Math.cos(a) * rad, z = from.z + Math.sin(a) * rad; if (!this.free(x, z, CAT_R)) continue;
      const c = rad + Math.hypot(goal[0] - x, goal[1] - z) * 1.05; if (c < bc) { bc = c; best = [x, z]; }
    }
    return best || this.nearestFree(from.x, from.z, 0.12);
  }
  lineFree(ax, az, bx, bz, r = CAT_R) {
    const len = Math.hypot(bx - ax, bz - az), n = Math.max(1, Math.ceil(len / 0.07));
    for (let s = 0; s <= n; s++) { const t = s / n; if (!this.free(ax + (bx - ax) * t, az + (bz - az) * t, r)) return false; }
    return true;
  }

  // ------------------------------------------------------------ Weg (A*), guide = Kamerawegpunkte: der Weg hält Abstand dazu
  plan(from, to, guide) {
    this.ensure();
    const g = this.nearestFree(to.x, to.z, CAT_R), s = from.y > 0.1 ? this.exitPoint(from, g) : this.nearestFree(from.x, from.z, 0.12);
    const n = NX * NZ, pen = new Float32Array(n);
    if (guide && guide.length > 1) {
      for (let k = 1; k < guide.length; k++) {
        const A = guide[k - 1], B = guide[k], len = Math.hypot(B.x - A.x, B.z - A.z), steps = Math.max(1, Math.ceil(len / 0.15));
        for (let q = 0; q <= steps; q++) { const x = A.x + (B.x - A.x) * q / steps, z = A.z + (B.z - A.z) * q / steps; for (let j = cj(z - 0.9); j <= cj(z + 0.9); j++) for (let i = ci(x - 0.9); i <= ci(x + 0.9); i++) { if (!inGrid(i, j)) continue; const d = Math.hypot(X0 + (i + 0.5) * CELL - x, Z0 + (j + 0.5) * CELL - z); if (d < 0.9) { const p = (0.9 - d) / 0.9 * 2.2, kk = j * NX + i; if (p > pen[kk]) pen[kk] = p; } } }
      }
    }
    const si = ci(s[0]), sj = cj(s[1]), gi = ci(g[0]), gj = cj(g[1]);
    const G = new Float32Array(n).fill(1e9), P = new Int32Array(n).fill(-1), closed = new Uint8Array(n);
    const heap = []; const push = (k, f) => { heap.push([f, k]); let c = heap.length - 1; while (c > 0) { const p = (c - 1) >> 1; if (heap[p][0] <= heap[c][0]) break; [heap[p], heap[c]] = [heap[c], heap[p]]; c = p; } };
    const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let c = 0; for (;;) { let l = 2 * c + 1, r = l + 1, m = c; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === c) break; [heap[m], heap[c]] = [heap[c], heap[m]]; c = m; } } return top; };
    const sk = sj * NX + si, gk = gj * NX + gi; G[sk] = 0; push(sk, 0); let found = false;
    while (heap.length) {
      const [, k] = pop(); if (closed[k]) continue; closed[k] = 1; if (k === gk) { found = true; break; }
      const i = k % NX, j = (k - i) / NX;
      for (const [di, dj, w] of DIRS) {
        const ni = i + di, nj = j + dj; if (!inGrid(ni, nj)) continue; const nk = nj * NX + ni; if (closed[nk]) continue;
        const cl = this.dist[nk]; if (cl < 0.2) continue;
        const cost = w * CELL * (1 + pen[nk] + Math.max(0, 0.55 - cl) * 5);
        const ng = G[k] + cost; if (ng < G[nk]) { G[nk] = ng; P[nk] = k; push(nk, ng + Math.hypot(ni - gi, nj - gj) * CELL); }
      }
    }
    let pts = [];
    if (found) { for (let k = gk; k !== -1; k = P[k]) { const i = k % NX, j = (k - i) / NX; pts.push([X0 + (i + 0.5) * CELL, Z0 + (j + 0.5) * CELL]); } pts.reverse(); }
    else pts = [s, g];
    if (from.y > 0.1) pts.unshift([from.x, from.z]); else pts[0] = [from.x, from.z];
    pts[pts.length - 1] = [to.x, to.z];
    // Sichtlinien-Glättung (String Pulling)
    const out = [pts[0]]; let a = 0;
    while (a < pts.length - 1) { let b = pts.length - 1; while (b > a + 1 && !this.lineFree(pts[a][0], pts[a][1], pts[b][0], pts[b][1], 0.2)) b--; out.push(pts[b]); a = b; }
    const res = out.map((p) => new THREE.Vector3(p[0], 0, p[1])); res[0].y = from.y; res[res.length - 1].y = to.y;
    return res;
  }

  // ------------------------------------------------------------ Katzenplatz je Station
  aspect() { return Math.max(0.4, Math.min(2.4, this.rig.aspect || 1.6)); }
  camFor(P, L) {
    const asp = this.aspect(), hf = this.rig.hfov || (88 * Math.PI) / 180, cam = this.cam;
    cam.fov = Math.min(82, Math.max(28, (2 * Math.atan(Math.tan(hf / 2) / asp) * 180) / Math.PI)); cam.aspect = asp; cam.updateProjectionMatrix();
    cam.position.copy(P); cam.up.set(0, 1, 0); cam.lookAt(L); cam.updateMatrixWorld(true); return cam;
  }
  hud() { // Rechtecke der Oberfläche in NDC: Raumleiste unten, Sprechblase unten links
    const W = innerWidth || 1024, H = innerHeight || 640, nd = (r) => ({ x0: (r.left / W) * 2 - 1, x1: (r.right / W) * 2 - 1, y0: -((r.bottom / H) * 2 - 1), y1: -((r.top / H) * 2 - 1) });
    let bar = { x0: -0.6, x1: 0.6, y0: -1, y1: -0.72 };
    const el = document.getElementById('roombar'); if (el && el.getBoundingClientRect().width > 10) bar = nd(el.getBoundingClientRect());
    else if (W < 700) bar = { x0: -0.95, x1: 0.95, y0: -1, y1: -0.8 };
    const bub = { x0: -1, x1: Math.min(1, (Math.min(380, W - 28) / W) * 2 - 1 + 0.03), y0: -(((H - 82) / H) * 2 - 1) - 0.0, y1: -(((H - 82 - 110) / H) * 2 - 1) };
    return { bar, bub };
  }
  // Wählt den Katzenplatz: im Bild unten links/rechts (bevorzugt rechts), frei von Möbeln, nicht verdeckt, nicht hinter Oberflächenelementen
  spotFor(id, { force = false } = {}) {
    const st = this.rig.stations.get(id); if (!st) return null;
    const key = id + '|' + Math.round(this.aspect() * 3);
    if (!force && this.spots.has(key)) return this.spots.get(key).clone();
    let res;
    if (st.catSpot) res = new THREE.Vector3(st.catSpot[0], st.catSpot[1] || 0, st.catSpot[2]);
    else res = this.autoSpot(st);
    this.spots.set(key, res); return res.clone();
  }
  autoSpot(st) {
    this.ensure(); const P = st.P, L = st.L; const f = new THREE.Vector3(L.x - P.x, 0, L.z - P.z); if (f.lengthSq() < 1e-6) f.set(0, 0, -1); f.normalize();
    const right = new THREE.Vector3(-f.z, 0, f.x), cam = this.camFor(P, L), { bar, bub } = this.hud();
    const v = new THREE.Vector3(), ndc = (x, y, z) => { v.set(x, y, z).project(cam); return [v.x, v.y, v.z]; };
    const hit = (a, b, m = 0.02) => a.x0 < b.x1 + m && a.x1 > b.x0 - m && a.y0 < b.y1 + m && a.y1 > b.y0 - m;
    let best = null;
    const eval1 = (d, l, relax) => {
      const x = P.x + f.x * d + right.x * l, z = P.z + f.z * d + right.z * l;
      if (!this.free(x, z, CAT_R + 0.04)) return null;
      if (this.avoid[cj(z) * NX + ci(x)]) return null;
      const feet = ndc(x, 0.0, z), top = ndc(x, 0.46, z), s1 = ndc(x + right.x * 0.27, 0.2, z + right.z * 0.27), s2 = ndc(x - right.x * 0.27, 0.2, z - right.z * 0.27);
      if (feet[2] > 1 || top[2] > 1 || feet[2] < -1) return null;
      const fy = Math.max(feet[1], -0.97), r = { x0: Math.min(s1[0], s2[0]), x1: Math.max(s1[0], s2[0]), y0: fy, y1: top[1] };
      if (r.x0 < -0.96 || r.x1 > 0.96 || r.y1 > 0.25) return null;
      const vis = (top[1] - fy) / Math.max(1e-3, top[1] - feet[1]); if (vis < (relax ? 0.2 : 0.4)) return null;
      const cx = (r.x0 + r.x1) / 2, hgt = r.y1 - r.y0;
      let cost = Math.abs(Math.abs(cx) - 0.66) * 2.2 + Math.abs(feet[1] + 0.82) * 0.8 + Math.max(0, d - 2.6) * 0.3 + Math.max(0, 0.3 - hgt) * 6 + (l < 0 ? 0.35 : 0) + (1 - vis) * 3;
      if (hit(r, bar)) { if (!relax) return null; cost += 3; }
      if (hit(r, bub)) cost += 0.9;
      if (Math.abs(cx) < 0.42) cost += (0.42 - Math.abs(cx)) * 4;
      if (this.occluded(P, x, 0.3, z) || this.occluded(P, x, 0.08, z)) { if (!relax) return null; cost += 4; }
      return { x, z, cost };
    };
    for (const relax of [false, true]) {
      for (let d = 1.6; d <= 5.2; d += 0.2) for (let l = -3.4; l <= 3.4; l += 0.2) { const e = eval1(d, l, relax); if (e && (!best || e.cost < best.cost)) best = e; }
      if (best) break;
    }
    if (!best) { const nf = this.nearestFree(P.x + f.x * 3 + right.x * 1.2, P.z + f.z * 3 + right.z * 1.2); best = { x: nf[0], z: nf[1] }; }
    return new THREE.Vector3(best.x, 0, best.z);
  }

  // Zum Prüfen: Raster als Bild
  debugCanvas(marks = []) {
    this.ensure(); const S = 2, c = document.createElement('canvas'); c.width = NX * S / 2 * 1; c.height = NZ * S / 2; const g = c.getContext('2d'); const sc = c.width / NX;
    g.fillStyle = '#111'; g.fillRect(0, 0, c.width, c.height);
    for (let j = 0; j < NZ; j++) for (let i = 0; i < NX; i++) { const k = j * NX + i; if (!this.inside[k]) continue; g.fillStyle = this.blocked[k] ? '#c44' : this.dist[k] < CAT_R ? '#844' : '#2a3'; g.fillRect(i * sc, j * sc, sc + 0.5, sc + 0.5); }
    for (const m of marks) { g.fillStyle = m.color || '#ff0'; g.beginPath(); g.arc((m.x - X0) / CELL * sc, (m.z - Z0) / CELL * sc, m.r || 4, 0, 6.3); g.fill(); }
    return c;
  }
}

// Polygon an einer Ebene y = v beschneiden (keepAbove: y >= v behalten)
function clipY(poly, v, keepAbove) {
  const out = [], inside = (p) => (keepAbove ? p[1] >= v : p[1] <= v);
  for (let i = 0; i < poly.length; i++) {
    const p = poly[i], q = poly[(i + 1) % poly.length], pi = inside(p), qi = inside(q);
    if (pi) out.push(p);
    if (pi !== qi) { const t = (v - p[1]) / (q[1] - p[1]); out.push([p[0] + (q[0] - p[0]) * t, v, p[2] + (q[2] - p[2]) * t]); }
  }
  return out;
}
