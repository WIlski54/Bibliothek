// Gemeinsamer Bauplan für die Fachräume: Hülle mit Tür zum Foyer, Regalwände mit den Büchern der Abteilung, Lesetisch, Leuchter.
// Die einzelnen Räume (geschichte.js, biologie.js, chemie.js) rufen buildDept() mit ihrem Stil auf und fügen in extras(api) ihre Ausstellungsstücke hinzu.
import * as THREE from 'three';
import { ROOMS, DOOR, DEPT_COLORS } from '../layout.js';
import { plasterTex, carpetTex } from '../tex.js';
import { M, box, roomShell, shelfUnit, fillBooks, readingTable, chair, pottedPlant, chandelier, sconce, plaque, archFrame, placeWall, wallPos, hitPlane } from '../kit.js';
import { makeBook } from '../books.js';
import { DEPT_NAME } from '../signs.js';

const OPP = { N: 'S', S: 'N', E: 'W', W: 'E' };
const WALL_LEN = (R, wl) => (wl === 'N' || wl === 'S' ? R.w : R.d);
const WALL_NAME = { N: 'Nordwand', S: 'Südwand', E: 'Ostwand', W: 'Westwand' };

export function buildDept(ctx, id, style = {}, extras = null) {
  const R = ROOMS[id].size, doorWall = ROOMS[id].doorWall, g = new THREE.Group(); g.name = id;
  const blockers = [], stations = [], lights = [];
  const room = { w: R.w, d: R.d };
  const st = {
    wall: M.textured(plasterTex({ color: [226, 210, 180] }), 0.92), floor: M.wood(0x6a3d22, { planks: 7, seed: 5 }), ceiling: M.textured(plasterTex({ color: [240, 232, 214], seed: 12 }), 0.95),
    trim: M.wood(0x4a2a18, { planks: 1 }), wainscot: { h: 1.1, mat: M.wood(0x5a3320, { planks: 4, seed: 8 }), tile: 1.3 }, floorTile: 2.4, wallTile: 2.6,
    palette: undefined, carpet: {}, lightColor: 0xffe2b0, shelfWood: M.wood(0x5a3320), shelfBack: M.wood(0x3a2014, { planks: 2 }), tall: 1, tableWood: M.wood(0x6a3d22),
    ...style,
  };
  const door = { x: 0, w: DOOR.w, h: DOOR.h, arch: true };
  const shell = roomShell({ w: R.w, d: R.d, h: R.h, wall: st.wall, floor: st.floor, ceiling: st.ceiling, floorTile: st.floorTile, wallTile: st.wallTile, trim: st.trim, openings: { [doorWall]: [door] }, wainscot: st.wainscot, crown: true });
  g.add(shell); blockers.push(shell);
  const af = archFrame(DOOR.w, DOOR.h, 0.1, st.trim, 0.14); placeWall(af, room, doorWall, 0, 0); g.add(af);
  { const pq = plaque(DEPT_NAME[id], { w: 1.4, h: 0.36, bg: '#' + new THREE.Color(DEPT_COLORS[id]).multiplyScalar(0.55).getHexString() }); placeWall(pq, room, doorWall, 0, 0.03, DOOR.h + 0.42); g.add(pq); }
  { const hp = hitPlane(DOOR.w, DOOR.h, { kind: 'nav', to: 'foyer', label: 'Zurück ins Foyer' }); const wp = wallPos(room, doorWall, 0, 0.12); hp.position.set(wp.x, DOOR.h / 2, wp.z); hp.rotation.y = wp.ry; g.add(hp); }
  { const s = Math.min(R.w, R.d) * 0.55; const cp = new THREE.Mesh(new THREE.PlaneGeometry(s, s), new THREE.MeshStandardMaterial({ map: carpetTex({ ...st.carpet }), roughness: 0.95 })); cp.rotation.x = -Math.PI / 2; cp.position.y = 0.012; g.add(cp); }

  // ---------------- Regalwände: Gegenwand und beide Seitenwände voll, an der Türwand je ein Regal neben der Tür
  const far = OPP[doorWall], sides = doorWall === 'N' || doorWall === 'S' ? ['E', 'W'] : ['N', 'S'];
  const units = [];
  const addUnit = (wl, a) => { const s = shelfUnit({ w: 1.6, h: 2.7, d: 0.4, shelves: 5, wood: st.shelfWood, back: st.shelfBack }); placeWall(s, room, wl, a, 0.2); g.add(s); s.userData.wall = wl; s.userData.a = a; s.userData.seed = units.length + 1; s.userData.taken = []; s.userData.tap = { kind: 'goto', station: `${id}-regal-${wl}`, label: 'Regal' }; units.push(s); return s; };
  const run = (wl) => { const n = Math.max(2, Math.floor((WALL_LEN(R, wl) - 1.0) / 1.7)), pitch = (WALL_LEN(R, wl) - 1.0) / n; for (let i = 0; i < n; i++) addUnit(wl, (i - (n - 1) / 2) * pitch); };
  run(far); sides.forEach(run);
  for (const sg of [-1, 1]) { const a = sg * (DOOR.w / 2 + 0.4 + 0.9); if (Math.abs(a) + 0.8 <= WALL_LEN(R, doorWall) / 2 - 0.1) addUnit(doorWall, a); }

  // ---------------- Bücher der Abteilung: Deckel nach vorn, auf dem Augenhöhe-Brett der Gegenwand
  const myBooks = ctx.books.filter((b) => b.department === id), eye = 2, farUnits = units.filter((u) => u.userData.wall === far), perUnit = 5;
  myBooks.forEach((def, i) => {
    const u = farUnits[Math.floor(i / perUnit) % farUnits.length]; if (!u) return; const k = i % perUnit, sl = u.userData.slots[eye];
    const pitch = (sl.x1 - sl.x0) / perUnit, x = sl.x0 + pitch * (k + 0.5);
    const bk = makeBook(def, { t: 0.06, h: Math.min(0.4, sl.height - 0.05), d: 0.27, soon: def.status === 'bald' });
    bk.rotation.y = -Math.PI / 2; const holder = new THREE.Group(); holder.add(bk); holder.rotation.x = -0.1; holder.position.set(x, sl.y + 0.01, 0.06); u.add(holder);
    u.userData.taken[eye] = (u.userData.taken[eye] || []).concat([[x - 0.16, x + 0.16]]);
    holder.userData.tap = { kind: 'book', book: def, station: `${id}-regal-${far}` };
  });

  // ---------------- Mitte und Licht
  const table = readingTable({ r: 0.95, wood: st.tableWood }); g.add(table);
  for (const a of [0.2, 2.3, 4.2]) { const c = chair(); c.position.set(Math.sin(a) * 1.3, 0, Math.cos(a) * 1.3); c.rotation.y = a + Math.PI; g.add(c); }
  const ch = chandelier({ r: 0.7, arms: 8, light: false }); ch.position.set(0, R.h - 1.25, 0); g.add(ch);
  lights.push({ pos: [0, R.h - 1.1, 0], color: st.lightColor, intensity: 22, distance: 0, decay: 2 });
  { const p = wallPos(room, far, 0, 2.2); lights.push({ pos: [p.x, 2.6, p.z], color: st.lightColor, intensity: 8, distance: 0, decay: 2 }); }
  for (const a of [-1, 1]) { const sc = sconce({ light: false }); placeWall(sc, room, far, a * (WALL_LEN(R, far) / 4), 0.02, 3.0); g.add(sc); }
  if (st.plants !== false) for (const [x, z, s] of [[-R.w / 2 + 0.5, -R.d / 2 + 0.5, 1], [R.w / 2 - 0.5, R.d / 2 - 0.5, 2]]) { const p = pottedPlant({ h: 1.5, seed: s }); p.position.set(x, 0, z); g.add(p); }

  // ---------------- Stationen: Eingang und je eine pro Regalwand
  const ip = wallPos(room, doorWall, 0, 1.7), fp = wallPos(room, far, 0, 0);
  stations.push({ id: `${id}-eingang`, room: id, name: `${DEPT_NAME[id]}: Eingang`, pos: [ip.x, 1.6, ip.z], look: [fp.x, 1.7, fp.z] });
  for (const wl of [far, ...sides]) {
    const near = wallPos(room, wl, 0, 3.0), tgt = wallPos(room, wl, 0, 0);
    stations.push({ id: `${id}-regal-${wl}`, room: id, name: `${DEPT_NAME[id]}: ${WALL_NAME[wl]}`, pos: [near.x, 1.6, near.z], look: [tgt.x, 1.7, tgt.z], wall: wl });
  }
  const api = {
    id, R, room, doorWall, far, sides, st, g, stations, lights, blockers, units, ctx,
    place: (obj, wl, a, off = 0, y = 0) => { placeWall(obj, room, wl, a, off, y); g.add(obj); return obj; },
    removeUnit: (u) => { g.remove(u); const i = units.indexOf(u); if (i >= 0) units.splice(i, 1); },
  };
  const ex = extras?.(api) || {};
  // Füllbestand zuletzt, damit extras() Regale entfernen oder Lücken (u.userData.taken) eintragen kann
  for (const u of units) u.userData.slots.forEach((sl, k) => { const f = fillBooks(sl, { seed: u.userData.seed * 13 + k, density: 0.93, palette: st.palette, tall: st.tall, skip: u.userData.taken[k] || [] }); if (f) u.add(f); });
  return { group: g, stations, lights, blockers, update: ex.update };
}
