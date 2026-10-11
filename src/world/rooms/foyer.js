// Foyer: Marmorhalle mit drei Türen, Fahnen, Lageplan, Neuzugängen und Lesetisch. Lokale Koordinaten = Weltkoordinaten (Mittelpunkt 0,0).
import * as THREE from 'three';
import { FOYER, DOOR, DEPT_COLORS } from '../layout.js';
import { marbleTex, plasterTex, carpetTex, woodTex } from '../tex.js';
import { M, mesh, box, roomShell, shelfUnit, fillBooks, readingTable, chair, armchair, globe, pottedPlant, chandelier, deskLamp, sconce, framedPicture, plaque, vitrine, banner, archFrame, placeWall, wallPos, hitPlane, hitBox } from '../kit.js';
import { makeBook } from '../books.js';
import { bannerTex, planTex, DEPT_NAME } from '../signs.js';
import { catPortrait } from '../cat.js';

export function build(ctx) {
  const R = FOYER, g = new THREE.Group(); g.name = 'foyer';
  const blockers = [], stations = [];
  const door = { x: 0, w: DOOR.w, h: DOOR.h, arch: true };

  const wall = M.textured(plasterTex({ color: [236, 222, 192] }), 0.92);
  const floor = new THREE.MeshStandardMaterial({ map: marbleTex({ n: 4 }), roughness: 0.28, metalness: 0.06 });
  const ceil = M.textured(plasterTex({ color: [244, 236, 218], seed: 11 }), 0.95);
  const trim = M.wood(0x4a2a18, { planks: 1 });
  const shell = roomShell({ w: R.w, d: R.d, h: R.h, wall, floor, ceiling: ceil, floorTile: 2.4, wallTile: 2.6, trim, openings: { W: [door], N: [door], E: [door] }, wainscot: { h: 1.2, mat: M.wood(0x5a3320, { planks: 4, seed: 8 }), tile: 1.3 }, crown: true });
  g.add(shell); blockers.push(shell);

  // Teppichläufer (Nord-Süd und West-Ost) und Mittelmedaillon
  const carpet = (w, d, rep, rot = 0, y = 0.012) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshStandardMaterial({ map: carpetTex({ repeat: rep }), roughness: 0.95 })); m.rotation.x = -Math.PI / 2; m.rotation.z = rot; m.position.y = y; m.receiveShadow = true; return m; };
  const run1 = carpet(2.6, 11.4, [1, 4.4]); g.add(run1);
  const run2 = carpet(2.6, 12.6, [1, 4.8], Math.PI / 2, 0.014); g.add(run2);

  // Deckenbalken
  const beam = M.wood(0x3a2014, { planks: 1 });
  for (const x of [-4.5, 0, 4.5]) { const b = box(0.3, 0.3, R.d - 0.2, beam, { tile: 1 }); b.position.set(x, R.h - 0.15, 0); g.add(b); }
  for (const z of [-3, 3]) { const b = box(R.w - 0.2, 0.26, 0.26, beam, { tile: 1 }); b.position.set(0, R.h - 0.13 - 0.04, z); g.add(b); }

  // ---------------- Türen: Gewände, Schild, Fahnen, Klickfläche
  const room = { w: R.w, d: R.d };
  const doorWalls = { geschichte: 'W', biologie: 'N', chemie: 'E' };
  for (const [dept, wl] of Object.entries(doorWalls)) {
    const af = archFrame(DOOR.w, DOOR.h, 0.1, trim, 0.14); placeWall(af, room, wl, 0, 0); g.add(af);
    const pq = plaque(DEPT_NAME[dept], { w: 1.5, h: 0.4, bg: '#' + new THREE.Color(DEPT_COLORS[dept]).multiplyScalar(0.55).getHexString(), fg: '#f6dc8a' }); placeWall(pq, room, wl, 0, 0.03, DOOR.h + 0.5); g.add(pq);
    for (const sx of [-1, 1]) { const bn = banner(bannerTex(dept), { w: 0.86, h: 2.0 }); placeWall(bn, room, wl, sx * 2.35, 0.08, 1.55); g.add(bn); }
    const hp = hitPlane(DOOR.w, DOOR.h, { kind: 'nav', to: dept, label: DEPT_NAME[dept] }); const wp = wallPos(room, wl, 0, 0.12); hp.position.set(wp.x, DOOR.h / 2, wp.z); hp.rotation.y = wp.ry; g.add(hp);
    // Türschwelle im Tunnel
    const sill = box(DOOR.w, 0.03, 0.55, M.wood(0x3a2014, { planks: 1 }), { tile: 1 }); const sp = wallPos(room, wl, 0, -0.25); sill.position.set(sp.x, 0.015, sp.z); sill.rotation.y = sp.ry; g.add(sill);
  }

  // ---------------- Süden: Haupteingang (nur Optik) und Bücherwände
  {
    const dr = new THREE.Group(); const wd = M.wood(0x3a2014, { planks: 3 });
    const af = archFrame(DOOR.w + 0.3, DOOR.h + 0.5, 0.12, trim, 0.16); dr.add(af);
    for (const sx of [-1, 1]) { const leaf = box(1.0, DOOR.h - 1.2 + 0.1, 0.07, wd, { tile: 1 }); leaf.position.set(sx * 0.52, (DOOR.h - 1.2 + 0.1) / 2, -0.02); dr.add(leaf); const hd = mesh(new THREE.SphereGeometry(0.045, 10, 8), M.brass()); hd.position.set(sx * 0.12, 1.05, 0.04); dr.add(hd); for (const y of [0.5, 1.8]) { const pn = box(0.74, 0.9, 0.02, wd, { tile: 0.8 }); pn.position.set(sx * 0.52, y, 0.03); dr.add(pn); } }
    const fan = new THREE.Mesh(new THREE.CircleGeometry(DOOR.w / 2 - 0.02, 28, 0, Math.PI), new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0xbfe0ff, emissiveIntensity: 0.9 })); fan.position.set(0, DOOR.h - DOOR.w / 2 + 0.05, -0.02); dr.add(fan);
    // Speichen im Oberlicht
    for (let i = 1; i < 6; i++) { const a = (i / 6) * Math.PI, sp = box(0.02, DOOR.w / 2, 0.02, M.brass()); sp.position.set(Math.cos(a) * DOOR.w / 4, DOOR.h - DOOR.w / 2 + 0.05 + Math.sin(a) * DOOR.w / 4, 0.0); sp.rotation.z = a - Math.PI / 2; dr.add(sp); }
    placeWall(dr, room, 'S', 0, 0.02); g.add(dr);
    const tap = { kind: 'info', title: 'Der Ausgang', sub: 'Hier geht es zurück in die Welt', paras: ['Hinter dieser Tür liegt der Alltag. Die Bibliothek bleibt aber geöffnet, du kannst jederzeit wiederkommen.', 'Alle Bücher sind selbst gebaute Popup-Bücher für den Unterricht. Texte stehen unter CC BY-SA 4.0, der Code unter MIT-Lizenz.'] };
    const hp = hitPlane(DOOR.w, DOOR.h, tap); const wp = wallPos(room, 'S', 0, 0.2); hp.position.set(wp.x, DOOR.h / 2, wp.z); hp.rotation.y = wp.ry; g.add(hp);
  }
  const deco = [0x7b1f26, 0x2c4a6e, 0x2f6a4a, 0x8a5a2b, 0x4a2c5a, 0x1f3f3a, 0x9a7b30, 0x5a2a20];
  const shelfAt = (wl, a, seed, o = {}) => {
    const s = shelfUnit({ w: 1.6, h: 2.7, d: 0.4, shelves: 5, ...o }); placeWall(s, room, wl, a, 0.2); g.add(s);
    s.userData.slots.forEach((sl, i) => { const f = fillBooks(sl, { seed: seed * 17 + i, density: 0.94, palette: deco }); if (f) s.add(f); });
    return s;
  };
  const shelves = [shelfAt('S', -3.0, 1), shelfAt('S', -4.7, 2), shelfAt('S', 3.0, 3), shelfAt('S', 4.7, 4), shelfAt('W', -4.4, 5), shelfAt('W', 4.4, 6), shelfAt('E', -4.4, 7), shelfAt('E', 4.4, 8)];
  for (const s of shelves) { const hp = hitPlane(1.5, 2.6, { kind: 'info', label: 'Regal', title: 'Katalog und Nachschlagewerke', sub: 'Das Foyer-Regal', paras: ['Hier stehen Bücher, die jeder braucht: Lexika, Atlanten, Wörterbücher. Die Popup-Bücher selbst findest du in den Fachräumen.', 'Geh durch eine der drei Türen und stöbere in den Regalen der Abteilungen.'] }); hp.position.set(0, 1.4, -0.17); s.add(hp); }

  // ---------------- Norden: Lageplan und Hausherr (Archimedes) an der Wand
  const plan = framedPicture(planTex({ counts: ctx.counts }), { w: 1.5, h: 1.07, name: 'Lageplan', sub: 'Wo geht es wohin?' });
  placeWall(plan, room, 'N', 4.75, 0.02, 1.7); g.add(plan);
  plan.userData.tap = { kind: 'info', title: 'Lageplan', sub: 'Die große Bibliothek', paras: ['Vom Foyer aus führen drei Türen in die Fachräume. Tippe auf einen Raum, dann fährt die Kamera dorthin.'], map: true, station: 'foyer-plan' };
  const hausherr = catPortrait();
  if (hausherr) { placeWall(hausherr, room, 'N', -4.75, 0.02, 1.7); g.add(hausherr); }

  // ---------------- Mitte: Lesetisch mit Lampe, Globus, aufgeschlagenem Buch
  const table = readingTable({ r: 1.0 }); table.position.set(0, 0, -0.6); g.add(table);
  const lamp = deskLamp({ light: false }); lamp.position.set(0.45, 0.81, -0.85); lamp.scale.setScalar(0.9); g.add(lamp);
  for (const a of [1.9, 3.6, 4.9]) { const c = chair(); c.position.set(Math.sin(a) * 1.35, 0, Math.cos(a) * 1.35); c.rotation.y = a + Math.PI; c.position.z -= 0.6; g.add(c); }
  const open = new THREE.Group(); { const pgM = M.plain(0xf0e6cc, 0.95), cvM = M.plain(0x7b1f26, 0.7); const c1 = box(0.48, 0.02, 0.34, cvM); c1.position.y = 0.01; open.add(c1); for (const sx of [-1, 1]) { const pg = box(0.22, 0.03, 0.31, pgM); pg.position.set(sx * 0.115, 0.035, 0); pg.rotation.z = -sx * 0.09; open.add(pg); } open.position.set(-0.35, 0.81, -0.3); open.rotation.y = 0.5; g.add(open); }
  const gl = globe({ r: 0.33 }); gl.position.set(-3.0, 0, 1.3); g.add(gl);
  gl.userData.tap = { kind: 'info', title: 'Der Globus', sub: 'Die Welt im Kleinen', paras: ['Ägypten liegt in Nordostafrika am Nil. Die Dinosaurier lebten auf allen Kontinenten, die damals noch ganz anders angeordnet waren.', 'Dreh den Globus im Kopf: Wo liegt dein Wohnort?'] };

  // ---------------- Neuzugänge: Vitrine mit den fertigen Büchern
  const vit = vitrine({ w: 1.5, d: 0.8, plinthH: 0.85, glassH: 0.95 }); vit.position.set(3.0, 0, 1.3); vit.rotation.y = -0.45; g.add(vit);
  const shown = ctx.books.filter((b) => b.status === 'fertig').slice(0, 3);
  shown.forEach((def, i) => {
    const bk = makeBook(def, { t: 0.1, h: 0.58, d: 0.4 }); bk.rotation.set(0, -Math.PI / 2, 0); const holder = new THREE.Group();
    const stand = box(0.46, 0.03, 0.3, M.wood(0x3a2014, { planks: 1 }), { tile: 1 }); stand.position.y = 0.015; holder.add(stand); bk.position.set(0, 0.03, 0.02); holder.add(bk);
    holder.position.set((i - (shown.length - 1) / 2) * 0.5, 0.04, 0); holder.rotation.x = 0; vit.userData.inner.add(holder);
    holder.userData.tap = { kind: 'book', book: def, station: 'foyer-neu' };
  });
  const neuPl = plaque('Neu im Regal', { w: 0.8, h: 0.2 }); neuPl.position.set(0, 0.62, 0.42); neuPl.rotation.x = -0.35; vit.add(neuPl);
  const bluePrint = new THREE.Group(); g.add(bluePrint);

  // ---------------- Möbel und Pflanzen
  const ac1 = armchair({ color: 0x6a2230 }); ac1.position.set(-6.0, 0, 3.6); ac1.rotation.y = Math.PI / 2 + 0.3; g.add(ac1);
  const ac2 = armchair({ color: 0x2c4a6e }); ac2.position.set(6.0, 0, 3.6); ac2.rotation.y = -Math.PI / 2 - 0.3; g.add(ac2);
  const sideTab = readingTable({ r: 0.32, h: 0.6 }); sideTab.position.set(6.2, 0, 2.5); g.add(sideTab);
  const sl = deskLamp({ light: false }); sl.position.set(6.2, 0.63, 2.5); sl.scale.setScalar(0.7); g.add(sl);
  for (const [x, z, s] of [[-6.4, -5.2, 1], [6.4, -5.2, 2], [-6.5, 5.3, 3], [6.5, 5.3, 4]]) { const p = pottedPlant({ h: 1.7, seed: s }); p.position.set(x, 0, z); g.add(p); }

  // ---------------- Beleuchtung: Kronleuchter + Wandlampen (nur Optik; echte Lichter über ctx-Pool)
  const ch = chandelier({ r: 0.85, arms: 10, light: false }); ch.position.set(0, R.h - 1.35, 0); g.add(ch);
  for (const [wl, a] of [['S', -1.9], ['S', 1.9], ['W', -3.7], ['W', 3.7], ['E', -3.7], ['E', 3.7], ['N', -3.6], ['N', 3.6]]) { const sc = sconce({ light: false }); placeWall(sc, room, wl, a, 0.02, 3.1); g.add(sc); }

  // ---------------- Stationen
  stations.push(
    { id: 'foyer-eingang', room: 'foyer', name: 'Eingangshalle', pos: [0, 1.6, 4.7], look: [0, 1.9, -6] },
    { id: 'foyer-neu', room: 'foyer', name: 'Neu im Regal', pos: [0.9, 1.6, 3.2], look: [3.0, 1.3, 1.3] },
    { id: 'foyer-plan', room: 'foyer', name: 'Lageplan', pos: [3.3, 1.6, -2.3], look: [4.8, 1.8, -6] },
  );
  const lights = [
    { pos: [0, 5.0, 0], color: 0xffe2b0, intensity: 38, distance: 0, decay: 2 },
    { pos: [0, 3.0, 4.2], color: 0xffd9a0, intensity: 9, distance: 0, decay: 2 },
    { pos: [0, 3.0, -4.2], color: 0xffd9a0, intensity: 9, distance: 0, decay: 2 },
  ];
  return { group: g, stations, lights, blockers, update(dt, t) { ch.rotation.y = Math.sin(t * 0.3) * 0.04; } };
}
