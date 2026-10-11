// Chemie: das Labor der Bibliothek. Türkise Fliesenwände, Kupferrohre, dunkles Holz, Sprossenfenster, Periodensystem, Labortisch,
// Destillation, Kristalle, Atommodell, Waage und Porträts. Die Ausstellungsstücke stehen in src/world/ex/chemie/.
import * as THREE from 'three';
import { buildDept } from './dept.js';
import { M, placeWall, wallPos, hitBox, pottedPlant } from '../kit.js';
import { tileTex, plasterTex } from '../tex.js';
import { personFrame } from '../portraits.js';
import { Batch, makeSignAtlas, slimFrame } from '../ex/chemie/util.js';
import { addFrieze, makeWindow, addPipe, addValve, makeGauge, addCeiling, makeLamp, makeLightPatch, makeRunner, makeGogglesSign } from '../ex/chemie/room.js';
import { createPeriodicTable, makePseFrame } from '../ex/chemie/pse.js';
import { makeCards } from '../ex/chemie/cards.js';
import { LAB, makeCounter, makeCounterDecor, makeSideboard, makeStool } from '../ex/chemie/furniture.js';
import { buildLab } from '../ex/chemie/lab.js';
import { makeNaCl, makeCuSO4, makeNatron, makeDisplayTable, labelStand } from '../ex/chemie/crystals.js';
import { makeAtom } from '../ex/chemie/atom.js';
import { makeScale, makeWeightBox } from '../ex/chemie/scale.js';
import { decorateUnit } from '../ex/chemie/shelfdecor.js';

const ST = { eingang: 'chemie-eingang', regalN: 'chemie-regal-N', regalE: 'chemie-regal-E', periodensystem: 'chemie-periodensystem', labortisch: 'chemie-labortisch', destillation: 'chemie-destillation', waage: 'chemie-waage', kristalle: 'chemie-kristalle', atom: 'chemie-atom', portraets: 'chemie-portraets', tuer: 'chemie-tuer' };

export function build(ctx) {
  const style = {
    wall: M.textured(tileTex({ color: [88, 166, 164], grout: [224, 230, 222], n: 8, seed: 9 }), 0.3, 0),
    ceiling: M.textured(plasterTex({ color: [240, 236, 222], seed: 12 }), 0.95),
    floor: M.wood(0x4d2f1d, { planks: 9, seed: 5 }),
    trim: M.wood(0x3a2214, { planks: 1 }),
    wainscot: { h: 1.05, mat: M.wood(0x4a2a18, { planks: 4, seed: 8 }), tile: 1.3 },
    wallTile: 1.2, floorTile: 2.4,
    palette: [0x2b6f77, 0x7b1f26, 0x2c4a6e, 0x8a5a2b, 0x2f6a4a, 0x9a7b30, 0x4a2c5a, 0x1f3f3a, 0xa8552f, 0x20303a, 0x6a8a8a, 0x8c2d3a],
    shelfWood: M.wood(0x4a2a18), shelfBack: M.wood(0x2f1a10, { planks: 2 }), tableWood: M.wood(0x4a2a18),
    lightColor: 0xfff4e2, plants: false,
  };
  return buildDept(ctx, 'chemie', style, (api) => {
    const { g, R, room } = api, upd = [], cards = makeCards(ctx, ST);
    const frame = (id, o) => slimFrame(personFrame(id, o));
    const atlas = makeSignAtlas([
      { key: 'Stoffe', text: 'Stoffe', w: 1.3, h: 0.3, font: 'bold 66px Georgia, serif' }, { key: 'Elemente', text: 'Elemente', w: 1.3, h: 0.3, font: 'bold 66px Georgia, serif' }, { key: 'Reaktionen', text: 'Reaktionen', w: 1.3, h: 0.3, font: 'bold 66px Georgia, serif' },
      { key: 'Alltag', text: 'Alltag', w: 1.0, h: 0.3, font: 'bold 70px Georgia, serif' }, { key: 'Bücher', text: 'Bücher', w: 1.0, h: 0.3, font: 'bold 70px Georgia, serif' },
      { key: 'nacl', text: 'NaCl · Kochsalz', w: 0.3, h: 0.06, bg: '#2d1c0e', font: 'bold 46px Georgia, serif' }, { key: 'cuso4', text: 'CuSO₄ · 5 H₂O', w: 0.3, h: 0.06, bg: '#2d1c0e', font: 'bold 46px Georgia, serif' },
      { key: 'natron', text: 'Natron', w: 0.3, h: 0.06, bg: '#2d1c0e', font: 'bold 46px Georgia, serif' }, { key: 'atom', text: 'Natrium-Atom (vereinfachtes Modell)', w: 0.5, h: 0.065, bg: '#2d1c0e', font: 'bold 27px Georgia, serif' },
      { key: 'legende', text: '', w: 0.34, h: 0.1, bg: '#2d1c0e', draw: (g, W, H) => { g.textBaseline = 'middle'; g.fillStyle = '#6a78e0'; g.beginPath(); g.arc(56, H * 0.3, 15, 0, 7); g.fill(); g.fillStyle = '#5cc15a'; g.beginPath(); g.arc(56, H * 0.7, 23, 0, 7); g.fill();
        g.fillStyle = '#f6dc8a'; g.font = 'bold 34px Georgia, serif'; g.textAlign = 'left'; g.fillText('Na⁺  klein', 112, H * 0.3); g.fillText('Cl⁻  groß', 112, H * 0.7); } },
    ]);
    // ---- Mitte räumen: Lesetisch, Stühle, Kronleuchter, Teppich und Pflanzen der Vorlage entfernen (wir bauen das Labor selbst)
    for (const c of [...g.children]) {
      const isShelf = c.userData.kind === 'shelf', p = c.position;
      if (isShelf || c === g.children[0]) continue;
      const near0 = Math.hypot(p.x, p.z) < 1.6, plant = Math.abs(p.x) > 5 && Math.abs(p.z) > 4, carpet = c.isMesh && c.geometry.type === 'PlaneGeometry' && Math.abs(p.y - 0.012) < 1e-3;
      if (near0 || plant || carpet) g.remove(c);
    }
    // ---- Regale: Ostwand nur Nord-Flanke (trägt die Bücher), Westwand-Regale außen neben die Porträts
    for (const u of api.units.filter((u) => (u.userData.wall === 'E' && u.userData.a > -3) || u.userData.wall === 'S')) api.removeUnit(u);  // Südwand: Fenster statt Regale
    for (const u of api.units.filter((u) => u.userData.wall === 'W')) { const a = Math.sign(u.userData.a) * 4.1; placeWall(u, room, 'W', a, 0.2); u.userData.a = a; }
    const target = { N: ST.regalN, E: ST.regalE, W: ST.portraets };
    for (const u of api.units) u.traverse((o) => { if (o.userData.tap?.kind === 'goto') o.userData.tap.station = target[u.userData.wall] || o.userData.tap.station; });

    // ---- Regalschmuck nach Thema (Gläser, Mineralstufen, Flaschen, Haushalt); die Bücherreihen lassen dafür Lücken
    { const nu0 = api.units.filter((u) => u.userData.wall === 'N').sort((a, b) => a.userData.a - b.userData.a); ['stoffe', 'stoffe', 'elemente', 'elemente', 'reaktionen', 'reaktionen'].forEach((th, i) => nu0[i] && decorateUnit(nu0[i], th, i + 1));
      api.units.filter((u) => u.userData.wall === 'W').forEach((u, i) => decorateUnit(u, 'alltag', 20 + i)); }

    // ---- Fenster: Südwand drei große, Nordwand ein Band Oberlichter; Bordüre, Balken, Lampen
    const win = new THREE.Group();
    for (const [i, a] of [3.9, 0, -3.9].entries()) { const w = makeWindow({ w: 1.9, h: 2.3, nx: 2, ny: 4, seed: i }); placeWall(w, room, 'S', a, 0, 1.0); win.add(w); }
    for (const [i, a] of [-4.5, -1.5, 1.5, 4.5].entries()) { const w = makeWindow({ w: 2.3, h: 0.78, nx: 4, ny: 1, seed: i + 5, deep: 0.1 }); placeWall(w, room, 'N', a, 0, 3.8); win.add(w); }
    g.add(win); addFrieze(g, room, 3.5); addCeiling(g, R);
    for (const [x, z] of [[-1.9, 1.4], [0.2, 1.4], [2.0, 1.4], [-2.6, -2.7]]) { const l = makeLamp({ drop: R.h - 3.5 - 0.3 }); l.position.set(x, R.h - 0.3, z); g.add(l); }
    for (const a of [3.9, 0, -3.9]) { const p = makeLightPatch(2.0, 3.4); p.position.set(-a * 0.9, 0.015, 3.0); g.add(p); }

    // ---- Kupferrohre: Nordwand über den Regalen, Ostwand als Rahmen ums Periodensystem, Südwand über den Fenstern
    const pb = new Batch();
    const north = wallPos(room, 'N', 0, 0.06), south = wallPos(room, 'S', 0, 0.06), east2 = wallPos(room, 'E', 0, 0.06);
    addPipe(pb, [[-5.75, R.h - 0.3, north.z], [-5.75, 3.2, north.z], [5.75, 3.2, north.z], [5.75, R.h - 0.3, north.z]], { wallDir: [0, 0, -1], bracketEvery: 1.4, patina: [1] });
    addPipe(pb, [[-5.6, 4.15, south.z], [5.6, 4.15, south.z]], { wallDir: [0, 0, 1], bracketEvery: 1.3 });
    for (const zz of [-2.6, 2.6]) addPipe(pb, [[east2.x, 0.0, zz], [east2.x, 4.2, zz], [east2.x, 4.2, zz < 0 ? -1.6 : 1.6]], { wallDir: [1, 0, 0], bracketEvery: 1.1 });
    addValve(pb, [east2.x, 1.0, -2.6]);
    g.add(pb.build({ name: 'kupferrohre' }));
    { const ga = makeGauge(0.1); placeWall(ga, room, 'S', 0.0, 0.07, 4.15); g.add(ga); }
    { const t = hitBox(0.3, 3.0, 0.3, cards.kupfer); t.position.set(east2.x - 0.02, 1.6, -2.6); g.add(t); const t2 = hitBox(0.3, 3.0, 0.3, cards.kupfer); t2.position.set(east2.x - 0.02, 1.6, 2.6); g.add(t2); }

    // ---- Schilder über den Regalen
    const sign = (key, wall, a) => { const s = atlas.mesh(key); placeWall(s, room, wall, a, 0.02, 2.98); g.add(s); };
    const nu = api.units.filter((u) => u.userData.wall === 'N').sort((a, b) => a.userData.a - b.userData.a);
    ['Stoffe', 'Elemente', 'Reaktionen'].forEach((txt, i) => { const u1 = nu[2 * i], u2 = nu[2 * i + 1]; if (u1 && u2) sign(txt, 'N', (u1.userData.a + u2.userData.a) / 2); });
    for (const u of api.units.filter((u) => u.userData.wall === 'W')) sign('Alltag', 'W', u.userData.a);
    for (const u of api.units.filter((u) => u.userData.wall === 'E')) sign('Bücher', 'E', u.userData.a);

    // ---- Periodensystem (Ostwand, Mitte) mit Schrank darunter; Mendelejew daneben
    const pse = createPeriodicTable({ ctx, station: ST.periodensystem, w: 4.2 });
    { const fr = makePseFrame(pse.width); pse.board.position.z = 0.02; fr.add(pse.board); placeWall(fr, room, 'E', 0, 0.03, 2.36); g.add(fr); }
    { const sb = makeSideboard(); placeWall(sb, room, 'E', 0, 0.0, 0.0); g.add(sb); }
    { const pf = frame('mendelejew'); pf.userData.tap.station = ST.periodensystem; placeWall(pf, room, 'E', 3.65, 0.0, 1.95); g.add(pf); }

    { const ru = makeRunner(6.6, 1.9); ru.position.x = -0.9; ru.position.z = -0.35; g.add(ru); }
    { const sg = makeGogglesSign(0.26); placeWall(sg, room, 'W', -1.7, 0.012, 1.55); g.add(sg); }
    // ---- Labortisch mit Geräten
    buildLab(g, cards, upd);
    for (const [x, z, ry] of [[-2.0, 2.45, 0.4], [-0.3, 2.5, 2.2], [1.4, 2.45, 1.0], [-3.25, 0.5, 0.0]]) { const s = makeStool(); s.position.set(x, 0, z); s.rotation.y = ry; g.add(s); }

    // ---- Fensterfront: Arbeitsplatte mit Spüle, Waage (Lavoisier), Gewichtskasten, Standflaschen, Porträts
    { const ct = makeCounter(); placeWall(ct, room, 'S', 0, 0, 0); g.add(ct); const dc = makeCounterDecor(); placeWall(dc, room, 'S', 0, 0, 0.86); g.add(dc); }
    const scale = makeScale(); scale.group.scale.setScalar(1.3); placeWall(scale.group, room, 'S', 1.95, 0.31, 0.86); g.add(scale.group); upd.push((dt, t) => scale.update(t));
    { const t = hitBox(0.86, 0.9, 0.4, cards.waage); placeWall(t, room, 'S', 1.95, 0.31, 0.86 + 0.43); g.add(t); }
    { const wbx = makeWeightBox(); placeWall(wbx, room, 'S', 1.3, 0.28, 0.86); wbx.scale.setScalar(1.25); g.add(wbx); }
    { const pf = frame('lavoisier'); pf.userData.tap.station = ST.waage; placeWall(pf, room, 'S', 1.95, 0.0, 2.25); g.add(pf); }
    { const pf = frame('liebig'); pf.userData.tap.station = ST.destillation; placeWall(pf, room, 'S', -1.95, 0.0, 2.25); g.add(pf); }

    // ---- Nordzone: Schaukasten-Tisch (Kristalle) und Atommodell
    const DT = { x: -2.6, z: -2.75 }, dtab = makeDisplayTable({ w: 2.3, d: 0.95, h: 0.95 }); dtab.group.position.set(DT.x, 0, DT.z); g.add(dtab.group);
    const nacl = makeNaCl({ s: 0.12, rNa: 0.027, rCl: 0.045 }); nacl.group.position.set(DT.x - 0.6, dtab.top + 0.3 + 0.012, DT.z - 0.02); g.add(nacl.group); upd.push((dt, t) => nacl.update(t));
    { const bb = new Batch(); bb.cyl(M.brass(), 0.12, 0.13, 0.014, 0, 0.007, 0, { seg: 26 }); const base = bb.build({ name: 'nacl-fuss' }); base.position.set(DT.x - 0.6, dtab.top, DT.z - 0.02); g.add(base); }
    { const t = hitBox(0.56, 0.6, 0.56, cards.nacl); t.position.set(DT.x - 0.6, dtab.top + 0.31, DT.z - 0.02); g.add(t); }
    const cu = makeCuSO4(); cu.position.set(DT.x + 0.02, dtab.top, DT.z - 0.02); g.add(cu);
    { const t = hitBox(0.32, 0.28, 0.32, cards.kupfersulfat); t.position.set(DT.x + 0.02, dtab.top + 0.14, DT.z - 0.02); g.add(t); }
    const nat = makeNatron(); nat.group.position.set(DT.x + 0.66, dtab.top, DT.z - 0.02); g.add(nat.group);
    { const t = hitBox(0.46, 0.2, 0.32, cards.natron); t.position.set(DT.x + 0.66, dtab.top + 0.1, DT.z - 0.02); g.add(t); }
    for (const [dx, key] of [[-0.62, 'nacl'], [0.02, 'cuso4'], [0.66, 'natron']]) { const ls = labelStand(atlas.mesh(key), 0.3); ls.position.set(DT.x + dx, dtab.top, DT.z + 0.36); g.add(ls); }
    // Atommodell: auf der Arbeitsplatte vor dem mittleren Fenster (leuchtender Hintergrund)
    const atom = makeAtom({ h: 0.4 }); placeWall(atom.group, room, 'S', 0, 0.3, 0.86); g.add(atom.group); upd.push((dt, t) => atom.update(t));
    { const t = hitBox(1.05, 1.1, 0.9, cards.atom); placeWall(t, room, 'S', 0, 0.3, 0.86 + atom.centerY); g.add(t); }
    { const ls = labelStand(atlas.mesh('atom'), 0.5); placeWall(ls, room, 'S', 0, 0.52, 0.86); g.add(ls); }
    { const ls = labelStand(atlas.mesh('legende'), 0.34); ls.position.set(DT.x - 0.97, dtab.top, DT.z + 0.18); ls.rotation.y = 0.35; g.add(ls); }
    for (const [x, z, s] of [[5.45, 3.7, 3], [-5.4, 4.15, 2]]) { const p = pottedPlant({ h: 1.5, seed: s }); p.position.set(x, 0, z); g.add(p); }

    // ---- Stationen (Reihenfolge = Pfeile)
    const S = (id, name, pos, look, extra = {}) => ({ id, room: 'chemie', name: 'Chemie: ' + name, pos, look, ...extra });
    api.stations.length = 0;
    api.stations.push(
      S(ST.eingang, 'Eingang', [-4.3, 1.6, 0], [6, 1.7, 0]),
      S(ST.regalN, 'Regale', [0.0, 1.6, 0.5], [0.0, 2.1, -5]),
      S(ST.regalE, 'Bücher', [3.9, 1.6, -2.2], [6, 1.6, -3.6]),
      S(ST.periodensystem, 'Periodensystem', [3.35, 1.6, 0], [6, 2.3, 0]),
      S(ST.labortisch, 'Labortisch', [-1.3, 1.55, -0.3], [-1.3, 1.05, 1.3]),
      S(ST.destillation, 'Destillation', [1.5, 1.55, -0.1], [1.45, 1.3, 1.3], { catSpot: [2.2, 0.92, 1.4] }),
      S(ST.waage, 'Waage', [-1.95, 1.6, 3.45], [-1.95, 1.5, 4.8], { catSpot: [-2.9, 0.86, 4.65] }),
      S(ST.atom, 'Atommodell', [0.0, 1.6, 3.2], [0.0, 1.6, 4.8], { catSpot: [-0.75, 0.86, 4.7] }),
      S(ST.kristalle, 'Kristalle und Natron', [-2.6, 1.6, -1.1], [-2.6, 1.15, -2.75]),
      S(ST.portraets, 'Porträts', [-2.3, 1.6, 0], [-6, 1.9, 0]),
      S(ST.tuer, 'Ausgang', [3.0, 1.6, 0], [-6, 1.9, 0]),
    );

    // ---- Porträts der Porträtwand (Westwand neben der Tür)
    for (const [id, a] of [['curie', 2.3], ['hodgkin', -2.3]]) { const pf = frame(id); pf.userData.tap.station = ST.portraets; placeWall(pf, room, 'W', a, 0.0, 1.85); g.add(pf); }
    // Bunsen: kleines Bild auf dem Tisch hinter den Brennern
    { const pf = frame('bunsen', { w: 0.2, h: 0.27 }); pf.userData.tap.station = ST.labortisch; pf.position.set(-0.72, LAB.H + 0.24, 1.74); pf.rotation.y = Math.PI; pf.rotation.x = -0.12; g.add(pf);
      const sb = new Batch(); sb.tube(M.wood(0x3a2214, { planks: 1 }), [-0.72, LAB.H + 0.24, 1.74 + 0.05], [-0.72, LAB.H + 0.0, 1.74 + 0.18], 0.012, 6); g.add(sb.build({ name: 'staender' })); }

    // ---- Lichter (max. 4): über Tisch Ost und West, Nordzone, Periodensystem
    api.lights.length = 0;
    api.lights.push({ pos: [-1.9, 3.7, 1.0], color: 0xfff4e2, intensity: 20, distance: 0, decay: 2 }, { pos: [1.8, 3.7, 1.0], color: 0xfff1dc, intensity: 16, distance: 0, decay: 2 },
      { pos: [-1.2, 3.8, -2.6], color: 0xfff1dc, intensity: 16, distance: 0, decay: 2 }, { pos: [3.6, 3.5, 0.0], color: 0xfff6ea, intensity: 12, distance: 0, decay: 2 });

    // Ruhiger Modus (oder „weniger Bewegung“ im Betriebssystem): Drehen und Wippen stehen still, die Flammen flackern weiter
    let tm = 0; const mq = matchMedia('(prefers-reduced-motion: reduce)'), calm = () => document.body.classList.contains('calm') || mq.matches;
    return { update: (dt, t) => { if (!calm()) tm += dt; upd.forEach((f) => f(dt, tm, t)); } };
  });
}
