// Biologie: Gewächshaus-Bibliothek. Raum 10 x 12 x 5,2 m, Tür an Wand S, Stirnwand N. Abteilungsfarbe #3f8f5a.
// Bauplan: buildDept (Regale, Bücher, Stationen) + Ausstellungsstücke aus src/world/ex/biologie/*.
// Ordnung: Westwand Erdgeschichte (T. rex, Fossilien), Ostwand Pflanzen (Herbar, Mikroskop), Stirnwand Stammbaum, Mitte die Doppelhelix,
// Südwand: Schmetterlinge (Ost) und Naturalienkabinett mit Skarabäus und Vogelnest (West).
import * as THREE from 'three';
import { buildDept } from './dept.js';
import { plasterTex } from '../tex.js';
import { M, mesh, box, placeWall, hitPlane, hitBox, shelfUnit, fillBooks } from '../kit.js';
import { personFrame } from '../portraits.js';
import { floorMat, wainscotMat, trimMat, BOOK_PALETTE, brassSign, friezeTex, glassMat, woodDark, woodLight, woodMid } from '../ex/biologie/style.js';
import { skylight, sunFloor } from '../ex/biologie/skylight.js';
import * as P from '../ex/biologie/plants.js';
import { props } from '../ex/biologie/props.js';
import { buildHelix, buildDnaStand, dnaPlaque, labelButton } from '../ex/biologie/dna.js';
import { pairDiagram, buildLectern, buildEasel } from '../ex/biologie/dnaart.js';
import { buildTrexCase, buildIchthyo } from '../ex/biologie/trexcase.js';
import { buildAmmonite, buildTrilobitePlate, buildFishPlate, buildUrchin, buildSharkTooth } from '../ex/biologie/fossils.js';
import { buildMicroscope, buildWorkbench, bench, stool } from '../ex/biologie/microscope.js';
import { buildScarabDome, buildNestOnBranch } from '../ex/biologie/scarab.js';
import { buildButterflyCase, BF_ORDER, BUTTERFLY } from '../ex/biologie/butterflies.js';
import { herbarSheet, herbarCanvas, HERBAR_ORDER } from '../ex/biologie/herbar.js';
import { treeCanvas, treeHit } from '../ex/biologie/tree.js';
import { chartFrame } from '../ex/biologie/charts.js';
import { T } from '../ex/biologie/cards.js';
import { texOf } from '../ex/biologie/style.js';

// Karte: Eigenschaften (auch Getter, z. B. für Bilder, die erst beim Öffnen gezeichnet werden) bleiben erhalten
const card = (c, extra = {}) => Object.defineProperties({ kind: 'info', tag: 'Biologie', dept: 'biologie' }, { ...Object.getOwnPropertyDescriptors(c), ...Object.getOwnPropertyDescriptors(extra) });

export function build(ctx) {
  const style = {
    wall: M.textured(plasterTex({ color: [206, 226, 190] }), 0.92),
    floor: floorMat(), ceiling: new THREE.MeshStandardMaterial({ map: plasterTex({ color: [246, 244, 230], seed: 12 }), roughness: 0.95, emissive: 0xfff4dc, emissiveIntensity: 0.16, emissiveMap: plasterTex({ color: [246, 244, 230], seed: 12 }) }),
    trim: trimMat(), wainscot: { h: 1.1, mat: wainscotMat(), tile: 1.3 }, floorTile: 2.4, wallTile: 2.6,
    palette: BOOK_PALETTE, carpet: { field: [64, 118, 82], accent: [236, 218, 150], second: [30, 70, 52] }, lightColor: 0xfff1d6,
    shelfWood: woodLight(), shelfBack: M.plain(0x86a889, 0.9), tall: 1, tableWood: woodLight(), plants: false,
  };
  return buildDept(ctx, 'biologie', style, (api) => {
    const { g, R, room, st } = api;
    const tapOf = [];                                      // alles, was bei update() Bewegung braucht
    // Standardmöbel der Vorlage entfernen (Tisch, Stühle, Leuchter, Wandlampen, Pflanzen); Hülle, Tür, Teppich, Regale bleiben
    for (const o of [...g.children]) if (o.isGroup && !api.units.includes(o) && !api.blockers.includes(o) && o.children[0]?.geometry?.type !== 'ExtrudeGeometry') g.remove(o);

    // ------------------------------------------------------------ Regale umstellen
    const byWall = (w) => api.units.filter((u) => u.userData.wall === w);
    const [N0, N1, N2, N3, N4] = byWall('N'), E = byWall('E'), W = byWall('W'), S = byWall('S');
    const mv = (u, wl, a) => { placeWall(u, room, wl, a, 0.2); u.userData.a = a; };
    mv(N0, 'N', -4.05); mv(N1, 'N', -2.4); mv(N4, 'N', 3.35); [N2, N3].forEach((u) => api.removeUnit(u));
    mv(W[4], 'W', 3.4); [W[2], W[3], W[5]].forEach((u) => api.removeUnit(u));       // W: a = -z  (W[0]: z = +4.6, W[1]: z = +2.75, W[4]: z = -3.4)
    mv(E[0], 'E', -4.3); [E[1], E[2], E[3]].forEach((u) => api.removeUnit(u));      // E: a = z   (E[5]: z = +4.6, E[4]: z = +2.75, E[0]: z = -4.3)
    S.forEach((u) => api.removeUnit(u));
    // Dinosaurier-Buch und Bald-Bücher ziehen mit auf die Westwand-Regale (Erdgeschichte), nördlich vom T. rex
    for (const h of [...N0.children]) if (h.userData.tap?.kind === 'book') { W[4].add(h); h.userData.tap.station = 'biologie-regal'; }
    W[4].userData.taken[2] = N0.userData.taken[2] || []; N0.userData.taken[2] = [];
    // Regal antippen: Kamera fährt zu der Station, von der aus es gut zu sehen ist
    const stationFor = (u) => { const w = u.userData.wall; return w === 'N' ? 'biologie-stammbaum' : w === 'E' ? (u === E[0] ? 'biologie-herbar' : 'biologie-mikroskop') : (u === W[4] ? 'biologie-regal' : 'biologie-fossilien'); };
    for (const u of api.units) for (const c of u.children) if (c.userData.tap?.kind === 'goto') c.userData.tap.station = stationFor(u);

    // ------------------------------------------------------------ Licht von oben
    g.add(skylight({ h: R.h })); g.add(sunFloor());
    // Fries (Blatt- und Blütengirlande) um den Raum
    { const tex = friezeTex(), fm = M.textured(tex, 0.9); const band = (len) => { const geo = new THREE.PlaneGeometry(len, 0.5), uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * len / 4); return new THREE.Mesh(geo, fm); };
      for (const [wl, len] of [['N', 10], ['W', 12], ['E', 12], ['S', 10]]) { const b = band(len); api.place(b, wl, 0, 0.025, 4.45); } }

    // ------------------------------------------------------------ Regalbeschriftung, Pflanzen und Dinge auf den Regalen
    const sign = (text, wl, a, w) => api.place(brassSign(text, { w, h: 0.28, px: 74 }), wl, a, 0.03, 3.62);
    sign('Erdgeschichte', 'W', -3.68, 1.75); sign('Erdgeschichte', 'W', 3.4, 1.3); sign('Lebewesen', 'N', -3.2, 1.75); sign('Mensch', 'N', 3.35, 1.1); sign('Pflanzen', 'E', 3.68, 1.75); sign('Pflanzen', 'E', -4.3, 1.3);
    const decor = (u, slot, x, key, w = 0.2, o = {}) => { const sl = u.userData.slots[slot], obj = props[key](o); obj.position.set(x, sl.y + 0.012, 0.03); u.add(obj); (u.userData.taken[slot] = u.userData.taken[slot] || []).push([x - w / 2, x + w / 2]); return obj; };
    const topFor = (u, seed) => { // oben auf dem Regal: Farn, Sukkulente, hängende Ranken
      const f = P.fernPlant({ h: 0.62, seed, potR: 0.1, kind: seed % 2 ? 'terra' : 'green' }); f.position.set(-0.5, 2.76, 0.02); u.add(f);
      const s2 = P.succulent({ r: 0.1, seed: seed + 3, kind: 'white' }); s2.position.set(0.5, 2.76, 0.05); u.add(s2);
      const tr = P.trailing({ w: 1.0, drops: 4, len: 0.4, seed: seed + 1 }); tr.position.set(-0.1, 2.77, 0.2); u.add(tr); };
    const units = api.units; units.forEach((u, i) => topFor(u, i + 1));
    // Fächer mit Dingen füllen (nicht die Fächer mit den Dino-Büchern)
    const D = { 'Lebewesen': 0, 'Erdgeschichte': 1, 'Pflanzen': 2 };
    decor(N0, 0, -0.5, 'jar', 0.14, { seed: 1 }); decor(N0, 3, 0.35, 'fern', 0.2, { seed: 2 }); decor(N0, 1, 0.45, 'bone', 0.28); decor(N0, 4, -0.2, 'succ', 0.16);
    decor(N1, 1, -0.4, 'shell', 0.18); decor(N1, 3, -0.3, 'leafy', 0.2); decor(N1, 0, 0.5, 'jar', 0.14, { seed: 3 }); decor(N1, 4, 0.4, 'cactus', 0.14);
    decor(N4, 1, 0.3, 'bone', 0.28); decor(N4, 3, -0.3, 'succ', 0.16, { kind: 'white' }); decor(N4, 0, -0.5, 'books', 0.26, { seed: 5 }); decor(N4, 4, 0.35, 'jar', 0.14, { seed: 6 });
    for (const u of [W[0], W[1]]) { decor(u, 1, 0.35, 'ammo', 0.2); decor(u, 3, -0.4, 'fern', 0.2, { seed: u === W[0] ? 4 : 7 }); decor(u, 4, 0.4, 'shell', 0.18); }
    decor(W[0], 0, -0.4, 'box', 0.24); decor(W[1], 0, 0.4, 'jar', 0.14, { seed: 8 }); decor(W[4], 3, 0.4, 'succ', 0.16); decor(W[4], 1, -0.45, 'ammo', 0.2); decor(W[4], 0, 0.4, 'books', 0.26, { seed: 7 });
    for (const u of [E[5], E[4], E[0]]) { decor(u, 3, -0.45, 'leafy', 0.2, { seed: 9 }); decor(u, 1, 0.4, 'jar', 0.14, { seed: 11 }); decor(u, 4, 0.35, 'grass', 0.16, { seed: 12 }); }
    decor(E[5], 0, -0.4, 'succ', 0.16); decor(E[4], 0, 0.4, 'books', 0.26, { seed: 9 }); decor(E[0], 0, 0.3, 'cactus', 0.14);

    // ------------------------------------------------------------ niedrige Regale unter den Wandstücken
    const low = (wl, a, w, seed) => { const s = shelfUnit({ w, h: 0.92, d: 0.34, shelves: 2, wood: st.shelfWood, back: st.shelfBack }); placeWall(s, room, wl, a, 0.17); g.add(s); s.userData.slots.forEach((sl, i) => { const f = fillBooks(sl, { seed: seed * 11 + i, density: 0.94, palette: BOOK_PALETTE, tall: 0.95 }); if (f) s.add(f); }); return s; };
    low('W', 0.35 - 0.62, 1.2, 1); low('W', 0.35 + 0.62, 1.2, 2); low('N', -0.74, 1.45, 3); low('N', 0.74, 1.45, 4); low('E', -2.2, 1.0, 5); low('E', -1.2, 1.0, 6);

    // zwei kleine Terrarien (Glaskästen mit Moos und Farnen) auf den niedrigen Regalen unter dem Stammbaum
    for (const [a, sd] of [[-0.74, 1], [0.74, 2]]) {
      const t = new THREE.Group(), br = M.brass(), w0 = 0.62, d0 = 0.26, h0 = 0.3;
      const tray = box(w0, 0.03, d0, woodDark(), { tile: 1 }); tray.position.y = 0.015; t.add(tray); const soil = mesh(new THREE.BoxGeometry(w0 - 0.04, 0.05, d0 - 0.04), M.plain(0x3d5a2e, 1)); soil.position.y = 0.055; t.add(soil);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = box(0.016, h0, 0.016, br); p.position.set(x * (w0 / 2 - 0.01), h0 / 2 + 0.03, z * (d0 / 2 - 0.01)); t.add(p); }
      for (const [x, y, ww, hh, dd] of [[0, h0 + 0.03, w0, 0.016, d0], [0, 0.03, w0, 0.01, d0]]) { const b = box(ww, hh, dd, br); b.position.set(x, y, 0); t.add(b); }
      const glass = new THREE.Mesh(new THREE.BoxGeometry(w0 - 0.02, h0, d0 - 0.02), glassMat()); glass.position.y = h0 / 2 + 0.03; glass.renderOrder = 4; t.add(glass);
      const f1 = P.fernPlant({ h: 0.26, seed: sd + 20, potR: 0.001, fronds: 9 }); f1.children.forEach((c, i) => { if (i < 3) c.visible = false; }); f1.position.set(-0.12, 0.04, 0); t.add(f1);
      const f2 = P.succulent({ r: 0.06, seed: sd + 5, kind: 'white' }); f2.children.forEach((c, i) => { if (i < 3) c.visible = false; }); f2.position.set(0.14, 0.05, 0.02); t.add(f2);
      for (const [x, z, r] of [[-0.24, 0.05, 0.03], [0.04, -0.05, 0.035], [0.25, -0.04, 0.025]]) { const m = mesh(new THREE.SphereGeometry(r, 10, 7), M.plain(0x5a9a3e, 1)); m.scale.y = 0.55; m.position.set(x, 0.082, z); t.add(m); }
      api.place(t, 'N', a, 0.17, 0.92); }

    // ------------------------------------------------------------ Mitte: Doppelhelix auf dem Sockel
    const DNA_POS = [0, -0.95];
    const stand = buildDnaStand({ h: 0.7 }); stand.position.set(DNA_POS[0], 0, DNA_POS[1]); g.add(stand);
    const helixRoot = new THREE.Group(); helixRoot.position.set(DNA_POS[0], stand.userData.top, DNA_POS[1]); g.add(helixRoot);
    const helix = buildHelix(); helixRoot.add(helix);
    const dnaTap = card(T.dna, { wide: true, alt: 'Zwei Basenpaare von oben: A–T mit zwei und G–C mit drei Wasserstoffbrücken', station: 'biologie-dna', label: 'Doppelhelix (DNA)', get image() { return pairDiagram(); } });
    { const hb = hitBox(0.74, 2.9, 0.74, dnaTap); hb.position.set(DNA_POS[0], 1.45, DNA_POS[1]); g.add(hb); }
    { const pq = dnaPlaque(); pq.position.set(DNA_POS[0], 0.33, DNA_POS[1] + 0.39); g.add(pq);
      const bt = labelButton(); bt.position.set(DNA_POS[0], 0.53, DNA_POS[1] + 0.395); g.add(bt); bt.userData.tap = { label: 'Buchstaben ein/aus', resolve: () => { const l = helix.userData.labels; l.visible = !l.visible; return { kind: 'say', who: 'Doppelhelix', text: l.visible ? T.dnaLabels.on : T.dnaLabels.off }; } }; }
    // Pult mit Legende und Staffelei mit Rosalind Franklin
    const lect = buildLectern(); lect.position.set(-1.3, 0, 0.25); lect.rotation.y = 0.75; g.add(lect);
    { const hb = hitBox(0.9, 1.0, 0.6, card(T.dnaLegend, { station: 'biologie-dna', label: 'Legende' })); hb.position.set(0, 0.95, 0.0); hb.rotation.x = 0.4; lect.add(hb); }
    const easel = buildEasel(); easel.position.set(1.7, 0, -1.6); easel.rotation.y = -0.45; easel.scale.setScalar(0.85); g.add(easel);
    { const fr = personFrame('franklin'); fr.position.set(1.7, 1.56, -1.6); fr.rotation.y = -0.45; fr.translateZ(0.02); g.add(fr); }

    // ------------------------------------------------------------ Westwand: T. rex, Ichthyosaurus, Fossilien, Anning und Darwin
    const trexTap = card(T.trex, { station: 'biologie-fossilien', label: 'T. rex' });
    const tc = buildTrexCase(); api.place(tc, 'W', 0.35, 0.09, 1.4);
    { const sz = tc.userData.size, hp = hitPlane(sz.w, sz.h, trexTap); hp.position.set(0, sz.h / 2 - 0.09, 0.4); tc.add(hp); }
    const ich = buildIchthyo({ scale: 0.52 }); api.place(ich, 'W', 0.35, 0.12, 3.6); ich.rotation.z = 0;
    { const hp = hitPlane(3.0, 1.4, card(T.ichthyo, { station: 'biologie-fossilien', label: 'Fischsaurier' })); hp.position.set(0.0, 0.0, 0.1); ich.add(hp); const brass = M.brass(); for (const x of [-0.9, 0.8]) { const rod = mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), brass); rod.rotation.x = Math.PI / 2; rod.position.set(x, 0.1, 0.02); ich.add(rod); } }
    // Fossilientisch
    const table = new THREE.Group(); table.position.set(-3.45, 0, -0.35); table.rotation.y = Math.PI / 2; g.add(table);
    { const wood = woodMid(), brass = M.brass(), L = 1.7, D = 0.8;
      const body = box(L, 0.74, D, wood, { tile: 1 }); body.position.y = 0.37; table.add(body);
      const cap = box(L + 0.06, 0.05, D + 0.06, wood, { tile: 1 }); cap.position.y = 0.765; table.add(cap);
      const cloth = box(L - 0.1, 0.012, D - 0.1, M.fabric(0x24402f, 1)); cloth.position.y = 0.795; table.add(cloth);
      for (const [x, z] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { const p = box(0.024, 0.34, 0.024, brass); p.position.set(x * (L / 2 - 0.02), 0.97, z * (D / 2 - 0.02)); table.add(p); }
      const gl = new THREE.Mesh(new THREE.BoxGeometry(L - 0.04, 0.34, D - 0.04), glassMat()); gl.position.y = 0.97; gl.renderOrder = 3; table.add(gl);
      for (const [x, z, ww, dd] of [[0, D / 2 - 0.02, L, 0.024], [0, -D / 2 + 0.02, L, 0.024]]) { const b = box(ww, 0.02, dd, brass); b.position.set(x, 1.145, z); table.add(b); }
      for (const s of [-1, 1]) { const b = box(0.024, 0.02, D, brass); b.position.set(s * (L / 2 - 0.02), 1.145, 0); table.add(b); }
      const lid = box(L - 0.04, 0.012, D - 0.04, M.plain(0xf0eadb, 0.7)); lid.visible = false; table.add(lid);
      const y0 = 0.8;
      const am = buildAmmonite({ size: 0.31 }); am.position.set(-0.55, y0, 0.0); am.rotation.y = 0.15; table.add(am);
      const stnd = box(0.12, 0.03, 0.1, woodDark(), { tile: 1 }); stnd.position.set(-0.55, y0 + 0.015, 0.0); table.add(stnd); am.position.y = y0 + 0.03;
      const tp = buildTrilobitePlate({ w: 0.3, d: 0.26 }); tp.position.set(0.1, y0 + 0.07, -0.02); tp.rotation.x = 0.5; tp.rotation.y = 0.0; table.add(tp);
      const wedge = box(0.2, 0.09, 0.1, woodDark(), { tile: 1 }); wedge.position.set(0.1, y0 + 0.04, -0.12); table.add(wedge);
      const fp = buildFishPlate({ w: 0.34, d: 0.22 }); fp.position.set(0.6, y0 + 0.07, -0.05); fp.rotation.x = 0.5; fp.rotation.y = 0.12; table.add(fp);
      const wedge2 = box(0.2, 0.09, 0.1, woodDark(), { tile: 1 }); wedge2.position.set(0.6, y0 + 0.04, -0.14); table.add(wedge2);
      const ur = buildUrchin(); ur.position.set(-0.1, y0 + 0.006, 0.28); table.add(ur); const sk = buildSharkTooth(); sk.position.set(0.02, y0 + 0.006, 0.3); sk.rotation.y = 0.5; table.add(sk);
      const tag = brassSign('Fossilien', { w: 0.5, h: 0.1, px: 56, sub: 'Spuren aus der Erdgeschichte' }); tag.position.set(0, 0.5, D / 2 + 0.032); table.add(tag);
      for (const [x, z, t, sub] of [[-0.55, 0.3, 'Ammonit', 'Jura'], [0.1, 0.3, 'Trilobit', 'Erdaltertum'], [0.6, 0.3, 'Fisch', 'Jura'], [-0.04, 0.34, 'Seeigel, Haizahn', '']]) { const lb = brassSign(t, { w: 0.2, h: 0.045, px: 40, sub, bg: '#3a2c18' }); lb.rotation.x = -Math.PI / 2; lb.position.set(x, y0 + 0.008, z + (x === -0.04 ? 0.06 : 0)); table.add(lb); }
      // Tipp-Flächen (in lokalen Tischkoordinaten, in Richtung +z = Blickseite)
      const hit = (x, w, h, tap, z = 0.0, y = 1.0) => { const hb = hitBox(w, h, 0.4, tap); hb.position.set(x, y0 + h / 2, z); table.add(hb); };
      hit(-0.55, 0.36, 0.34, card(T.ammonit, { station: 'biologie-fossilien', label: 'Ammonit' }));
      hit(0.1, 0.34, 0.26, card(T.trilobit, { station: 'biologie-fossilien', label: 'Trilobit' }), -0.02);
      hit(0.6, 0.38, 0.24, card(T.fisch, { station: 'biologie-fossilien', label: 'Fischfossil' }), -0.05);
      hit(-0.04, 0.3, 0.1, card(T.seeigel, { station: 'biologie-fossilien', label: 'Seeigel und Haizahn' }), 0.28); }
    { const f = personFrame('anning'); api.place(f, 'W', -1.5, 0.06, 1.75); }
    { const f = personFrame('darwin'); api.place(f, 'W', 2.1, 0.06, 1.75); }

    // ------------------------------------------------------------ Stirnwand: Stammbaum und Linné
    { const w = 2.6, fr = new THREE.Group(), wood = woodMid(), brass = M.brass();
      const tex = texOf(treeCanvas(), { aniso: 8 }), pic = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshStandardMaterial({ map: tex, roughness: 0.7 })); pic.position.set(0, w / 2, 0.06); fr.add(pic);
      for (const [x, y, ww, hh] of [[0, w + 0.07, w + 0.28, 0.14], [0, -0.07, w + 0.28, 0.14]]) { const b = box(ww, hh, 0.1, wood, { tile: 1 }); b.position.set(x, y, 0.05); fr.add(b); }
      for (const s of [-1, 1]) { const b = box(0.14, w, 0.1, wood, { tile: 1 }); b.position.set(s * (w / 2 + 0.07), w / 2, 0.05); fr.add(b); const br = box(0.02, w, 0.02, brass); br.position.set(s * (w / 2 - 0.01), w / 2, 0.065); fr.add(br); }
      for (const [x, y, ww, hh] of [[0, w - 0.01, w, 0.02], [0, 0.01, w, 0.02]]) { const b = box(ww, hh, 0.02, brass); b.position.set(x, y, 0.065); fr.add(b); }
      const tap = { label: 'Stammbaum des Lebens', resolve: (hit) => { const u = hit.uv ? hit.uv.x : 0.5, v = hit.uv ? hit.uv.y : 0.5, id = treeHit(u * 1024, (1 - v) * 1024), c = id && T.treeNodes[id]; return card(c ? { ...c, station: 'biologie-stammbaum' } : { ...T.tree, station: 'biologie-stammbaum' }); } };
      const hp = new THREE.Mesh(new THREE.PlaneGeometry(w, w), new THREE.MeshBasicMaterial({ visible: false })); hp.position.set(0, w / 2, 0.075); hp.userData.tap = tap; fr.add(hp);
      api.place(fr, 'N', 0, 0.04, 1.4); }
    { const f = personFrame('linne'); api.place(f, 'N', 1.95, 0.06, 1.75); }

    // ------------------------------------------------------------ Ostwand: Herbar, Arbeitstisch mit Mikroskop, Humboldt
    HERBAR_ORDER.forEach((key, i) => {
      const col = i % 3, row = Math.floor(i / 3), a = -2.35 + col * 0.66, y = row === 0 ? 2.58 : 1.6, f = herbarSheet(key, { w: 0.42, h: 0.588 }); api.place(f, 'E', a, 0.07, y);
      const hp = hitPlane(0.56, 0.78, card(T.herbar[key], { src: T.herbar.src, station: 'biologie-herbar', label: T.herbar[key].title, get image() { return herbarCanvas(key); }, alt: 'Herbarbogen: ' + T.herbar[key].title })); hp.position.set(0, -0.04, 0.07); f.add(hp);
    });
    { const bn = new THREE.Group(); bn.position.set(4.35, 0, 1.1); bn.rotation.y = -Math.PI / 2; g.add(bn);
      bn.add(buildWorkbench()); bn.add(bench()); const mic = buildMicroscope({ s: 1.5 }); mic.position.set(0.12, 0.804, -0.12); bn.add(mic);
      const hb = hitBox(0.44, 0.76, 0.46, card(T.mikroskop, { station: 'biologie-mikroskop', label: 'Mikroskop' })); hb.position.set(0.12, 0.804 + 0.38, -0.12); bn.add(hb);
      const sl = stool(); sl.position.set(-0.2, 0, 0.78); sl.rotation.y = 0.4; bn.add(sl); }
    { const f = personFrame('humboldt'); api.place(f, 'E', 1.1, 0.06, 2.15); }

    // ------------------------------------------------------------ Südwand: Schmetterlinge mit Merian, Kabinett mit Skarabäus, Nest und Mendel
    { const bc = buildButterflyCase(); api.place(bc, 'S', -3.3, 0, 1.0);
      const sz = bc.userData.size; const bg = hitPlane(sz.w, sz.h, card(T.butterflies, { station: 'biologie-schmetterlinge', label: 'Schmetterlings-Schaukasten' })); bg.position.set(0, 0.55 + 0.0, 0.17); bc.add(bg);
      BF_ORDER.forEach((key, i) => { const f = bc.userData.figs[key], b = BUTTERFLY[key]; const hp = hitPlane(0.34, 0.26, card(T.bf[key], { station: 'biologie-schmetterlinge', label: b.name, src: T.butterflies.src })); hp.position.set(f.position.x, f.position.y, 0.2); bc.add(hp); }); }
    { const f = personFrame('merian'); api.place(f, 'S', -1.9, 0.06, 1.75); }
    { const con = new THREE.Group(), wood = woodMid(), brass = M.brass(), cw = 1.9;
      const body = box(cw, 0.74, 0.5, wood, { tile: 1 }); body.position.y = 0.37; con.add(body); const top = box(cw + 0.06, 0.05, 0.56, wood, { tile: 1 }); top.position.y = 0.765; con.add(top);
      for (let i = -1; i <= 1; i++) { const d = box(cw / 3 - 0.06, 0.62, 0.02, woodMid(), { tile: 1 }); d.position.set(i * cw / 3, 0.37, 0.255); con.add(d); const k = mesh(new THREE.SphereGeometry(0.02, 8, 6), brass); k.position.set(i * cw / 3, 0.4, 0.28); con.add(k); }
      const dome = buildScarabDome(); dome.position.set(-0.55, 0.79, 0.0); dome.scale.setScalar(1.75); con.add(dome);
      const nest = buildNestOnBranch(); nest.position.set(0.52, 0.79, 0.02); nest.scale.setScalar(2.0); con.add(nest);
      const hb1 = hitBox(0.7, 0.85, 0.7, card(T.skarabaeus, { station: 'biologie-kabinett', label: 'Skarabäus' })); hb1.position.set(-0.55, 0.79 + 0.4, 0); con.add(hb1);
      const hb2 = hitBox(0.9, 0.45, 0.55, card(T.nest, { station: 'biologie-kabinett', label: 'Vogelnest' })); hb2.position.set(0.52, 0.79 + 0.2, 0); con.add(hb2);
      { const f = P.fernPlant({ h: 0.4, seed: 8, potR: 0.08 }); f.position.set(0.9, 0.79, 0.14); f.scale.setScalar(0.8); con.add(f); const bk = props.books({ seed: 4 }); bk.position.set(-0.93, 0.79, 0.12); bk.rotation.y = 0.2; con.add(bk); }
      api.place(con, 'S', 3.3, 0.0, 0);
      // Wandbrett mit Samengläsern über dem Kabinett
      const sh = new THREE.Group(); { const wd = woodMid(), br = M.brass(); const bd = box(1.7, 0.04, 0.24, wd, { tile: 1 }); bd.position.set(0, 0, 0.12); sh.add(bd); for (const x of [-0.7, 0.7]) { const b = box(0.03, 0.2, 0.2, br); b.position.set(x, -0.1, 0.1); sh.add(b); }
        [['seedJar', -0.62, { color: 0x7ab04a, seed: 1 }], ['seedJar', -0.3, { color: 0xa8452a, seed: 2, size: 0.013 }], ['seedJar', 0.02, { color: 0xe8a03a, seed: 3, size: 0.009 }], ['succ', 0.4, {}], ['books', 0.58, { seed: 5 }]].forEach(([k, x, o]) => { const it = props[k](o); it.position.set(x, 0.02, 0.12); sh.add(it); }); }
      api.place(sh, 'S', 3.3, 0.0, 1.78); }
    { const f = personFrame('mendel'); api.place(f, 'S', 1.9, 0.06, 1.75); }

    // ------------------------------------------------------------ Lehrtafeln an den oberen Wänden
    for (const [key, wl, a, y, stn] of [['meta', 'S', -3.3, 3.05, 'biologie-schmetterlinge'], ['mendel', 'S', 3.3, 2.95, 'biologie-kabinett'], ['flower', 'E', -1.7, 3.4, 'biologie-herbar'], ['cells', 'E', 1.1, 3.4, 'biologie-herbar']]) {
      const f = chartFrame(key, { w: 1.4 }); api.place(f, wl, a, 0.04, y); const sz = f.userData.size; const hp = hitPlane(sz.w, sz.h, card(T.charts[key], { station: stn, label: T.charts[key].title })); hp.position.z = 0.06; f.add(hp); }

    // ------------------------------------------------------------ Große Pflanzen, hängende Körbe
    const big = [[P.palmPlant({ h: 2.3, seed: 2 }), 4.55, -5.3], [P.palmPlant({ h: 1.9, seed: 5 }), -4.7, 5.5], [P.monsteraPlant({ h: 1.35, seed: 3 }), 4.55, 5.3], [P.fernPlant({ h: 1.0, seed: 4, kind: 'green', fronds: 16 }), -4.5, 4.2]];
    for (const [o, x, z] of big) { o.position.set(x, 0, z); g.add(o); }
    for (const [x, z, s] of [[-3.0, -3.1, 1], [3.0, -3.1, 2], [-2.6, 2.7, 3], [2.6, 2.7, 4]]) { const hp = P.hangingPlant({ len: 1.1, seed: s, strands: 7 }); hp.position.set(x, R.h - 0.75, z); g.add(hp); }

    // ------------------------------------------------------------ Stationen (Reihenfolge = Pfeile)
    const S0 = (id, name, pos, look, extra = {}) => ({ id: `biologie-${id}`, room: 'biologie', name: `Biologie: ${name}`, pos, look, ...extra });
    const eingang = api.stations.find((s) => s.id === 'biologie-eingang'), tuer = api.stations.find((s) => s.id === 'biologie-tuer');
    eingang.catSpot = [-2.2, 0, 3.4]; Object.assign(tuer, { pos: [0.4, 1.6, 1.5], look: [0, 1.8, 6], name: 'Biologie: Ausgang', catSpot: [1.9, 0, 3.4] });
    api.stations.length = 0;
    api.stations.push(
      eingang,
      S0('regal', 'Regale und Dino-Buch', [-1.5, 1.6, -2.0], [-5, 1.9, -3.5], { catSpot: [-3.2, 0, -1.6] }),
      S0('dna', 'Doppelhelix', [1.4, 1.6, 2.0], [0, 1.75, -0.9], { catSpot: [-1.0, 0, 2.4] }),
      S0('fossilien', 'Fossilien und T. rex', [-1.3, 1.6, 1.3], [-4.6, 1.45, -0.2], { catSpot: [-2.0, 0, -1.8] }),
      S0('mikroskop', 'Mikroskop', [1.9, 1.6, 2.8], [4.5, 1.25, 1.0], { catSpot: [2.9, 0, 3.6] }),
      S0('herbar', 'Herbar und Lehrtafeln', [1.7, 1.6, -3.6], [4.9, 2.3, -1.4], { catSpot: [3.0, 0, -3.2] }),
      S0('stammbaum', 'Stammbaum des Lebens', [0.2, 1.6, -2.7], [0.2, 2.2, -6], { catSpot: [-1.8, 0, -3.8] }),
      S0('schmetterlinge', 'Schmetterlinge', [2.9, 1.6, 2.9], [3.3, 1.85, 6], { catSpot: [1.2, 0, 4.6] }),
      S0('kabinett', 'Skarabäus und Vogelnest', [-3.0, 1.6, 3.0], [-3.3, 1.75, 6], { catSpot: [-1.2, 0, 4.6] }),
      tuer);

    // ------------------------------------------------------------ Licht (drei echte Lichter: spart Rechenzeit)
    api.lights.length = 0;
    api.lights.push(
      { pos: [0.3, 4.3, -0.8], color: 0xfff4de, intensity: 36, distance: 0, decay: 2 },
      { pos: [-3.3, 3.0, -0.3], color: 0xfff0d6, intensity: 7, distance: 0, decay: 2 },
      { pos: [3.3, 3.0, 0.4], color: 0xfff0d6, intensity: 7, distance: 0, decay: 2 });

    const calmQ = typeof matchMedia === 'function' ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    return { update(dt) { if (!(calmQ?.matches || document.body.classList.contains('calm'))) helix.rotation.y += dt * 0.14; } };
  });
}
