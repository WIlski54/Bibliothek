// Fachraum Geschichte: Holzvertäfelung in Rotbraun und Gold, dicker Teppich, Messinglampen. Weltkarte an der Stirnwand (West),
// zwei Schaukasten-Nischen (Schätze der Pharaonen, Schrift und Buch), Modell der Cheops-Pyramide, Zeituhr, Kartentisch, Globus,
// Gutenberg-Presse und Porträts. Regale nach Epochen (Urgeschichte, Altertum, Mittelalter, Neuzeit).
import * as THREE from 'three';
import { buildDept } from './dept.js';
import { M, box, mesh, hitBox, framedPicture, globe, armchair, chair, deskLamp, readingTable, placeWall } from '../kit.js';
import { wallpaperTex } from '../tex.js';
import { personFrame } from '../portraits.js';
import { paperCut, shadowFor, cardImage } from '../ex/geschichte/figs.js';
import { renderMap, mapSize, PINS } from '../ex/geschichte/worldmap.js';
import { globeTexture } from '../ex/worldmap.js';
import { renderClockFace } from '../ex/geschichte/clockface.js';
import { EXHIBITS, MAP_CARD, PIN_CARDS, EPOCHS, CLOCK_CARD, FURNITURE } from '../ex/geschichte/texts.js';
import { W, tex, brassPlate, wallSign, glow, friezeMat, nicheMat, rug, floorLamp, pictureLight, gildedFrame, showcase } from '../ex/geschichte/decor.js';
import { pyramidModel, tableCase, legendPlate } from '../ex/geschichte/pyramid.js';
import { mapTable, printingPress, sunDisc, bibelSeiteCanvas } from '../ex/geschichte/props.js';

const TAU = Math.PI * 2;
const MS = mapSize(2048, 44), MAP_W = MS.w, MAP_H = MS.h;

// Papierschnitt-Teile leuchten leicht von selbst (sonst wirken sie in der Vitrine zu dunkel)
function lit(pc, k = 0.32) { for (const m of [].concat(pc.mesh.material)) if (m.map) { m.emissive = new THREE.Color(0xffffff); m.emissiveMap = m.map; m.emissiveIntensity = k; } return pc; }

export function build(ctx) {
  const style = {
    wall: M.textured(wallpaperTex({ base: [112, 44, 34], ink: [196, 152, 82] }), 0.92), wallTile: 1.5,
    floor: W(0x80502a, { planks: 9 }), floorTile: 2.6,
    trim: W(0x4a2210, { planks: 1 }),
    wainscot: { h: 1.15, mat: W(0x6a2e1a, { planks: 5 }), tile: 1.2 },
    palette: [0x7b1f26, 0x8a4a22, 0x2c4a6e, 0x2f6a4a, 0xa77a2e, 0x5a2a20, 0x4a2c5a, 0xa8552f, 0x6a3a2a, 0x1f3f3a, 0x9a3a2a],
    lightColor: 0xffd9a0, shelfWood: W(0x5a2a16), shelfBack: W(0x3a1a0e, { planks: 2 }), tableWood: W(0x6a3a20),
  };
  return buildDept(ctx, 'geschichte', style, (api) => extras(api, ctx));
}

function extras(api, ctx) {
  const { g, R, room, units, stations, lights } = api;
  const place = (o, wl, a, off = 0, y = 0) => { placeWall(o, room, wl, a, off, y); g.add(o); return o; };
  const at = (o, x, y, z, ry = 0) => { o.position.set(x, y, z); o.rotation.y = ry; g.add(o); return o; };
  const book = ctx.books.find((b) => b.id === 'aegypten');

  // ---------------------------------------------------------------- Aufräumen: Vorgaben von buildDept, die hier stören
  for (const c of g.children.slice()) {
    const r = Math.hypot(c.position.x, c.position.z);
    if (c.name === 'shell') continue;
    if (c.isMesh && Math.abs(c.position.y - 0.012) < 1e-6) g.remove(c);                                                      // Standard-Teppich
    else if (c.isGroup && c.position.y === 0 && r < 1.45 && !c.userData.kind) g.remove(c);                                   // Lesetisch und Stühle
    else if (c.isGroup && Math.abs(c.position.y - 3.0) < 1e-6 && Math.abs(c.position.x + R.w / 2) < 0.05) g.remove(c);       // Wandlampen an der Stirnwand
  }

  // ---------------------------------------------------------------- Regale: Mitte der Stirnwand frei (Weltkarte), Nischen an N und S, Türwand
  const onWall = (w) => units.filter((u) => u.userData.wall === w);
  for (const u of onWall('W')) if (Math.abs(u.userData.a) < 2.5) api.removeUnit(u);
  for (const w of ['N', 'S']) for (const u of onWall(w)) if (Math.abs(u.userData.a) < 1.5) api.removeUnit(u);
  for (const u of onWall('E')) { const a = Math.sign(u.userData.a) * 4.2; placeWall(u, room, 'E', a, 0.2); u.userData.a = a; }
  const retarget = (u, station) => { const hp = u.children.find((c) => c.userData.tap?.kind === 'goto'); if (hp) hp.userData.tap.station = station; };
  for (const u of units) {
    const w = u.userData.wall;
    retarget(u, w === 'N' ? (u.userData.a > 0 ? 'geschichte-regal-N' : 'geschichte-schaetze') : w === 'S' ? (u.userData.a > 0 ? 'geschichte-regal-S' : 'geschichte-schrift') : w === 'E' ? 'geschichte-tuer' : u.userData.a < 0 ? 'geschichte-regal-W' : 'geschichte-karte');
  }

  // ---------------------------------------------------------------- Licht (höchstens 4 echte Lichter)
  lights.length = 0;
  lights.push({ pos: [0, R.h - 1.15, 0], color: 0xffd9a0, intensity: 24, distance: 0, decay: 2 });
  lights.push({ pos: [-4.0, 3.4, 0], color: 0xffcf90, intensity: 11, distance: 0, decay: 2 });
  lights.push({ pos: [0.2, 3.1, -2.7], color: 0xffe0b0, intensity: 6.5, distance: 0, decay: 2 });
  lights.push({ pos: [0.2, 3.1, 2.7], color: 0xffe0b0, intensity: 6.5, distance: 0, decay: 2 });

  // ---------------------------------------------------------------- Decke: Balken
  const beam = W(0x3a1a0e, { planks: 1 });
  for (const x of [-4, 0, 4]) { const b = box(0.28, 0.26, R.d - 0.2, beam, { tile: 1 }); b.position.set(x, R.h - 0.13, 0); g.add(b); }
  for (const z of [-2.5, 2.5]) { const b = box(R.w - 0.2, 0.2, 0.22, beam, { tile: 1 }); b.position.set(0, R.h - 0.1 - 0.06, z); g.add(b); }
  for (const x of [-4, 0, 4]) for (const z of [-2.5, 2.5]) { const k = mesh(new THREE.SphereGeometry(0.07, 10, 8), M.brass()); k.position.set(x, R.h - 0.27, z); g.add(k); }

  // ---------------------------------------------------------------- Mäander-Fries rund um den Raum
  for (const wl of ['N', 'S', 'E', 'W']) {
    const len = wl === 'N' || wl === 'S' ? R.w : R.d, geo = new THREE.PlaneGeometry(len - 0.1, 0.3), uv = geo.attributes.uv;
    for (let i = 0; i < uv.count; i++) uv.setX(i, uv.getX(i) * (len / 1.2));
    place(new THREE.Mesh(geo, friezeMat()), wl, 0, 0.012, 4.38);
  }

  // ---------------------------------------------------------------- Weltkarte an der Stirnwand (West)
  const mapW = 4.9, mapH = mapW * MAP_H / MAP_W, mapY = 2.52;
  const mc = document.createElement('canvas'); mc.width = MAP_W; mc.height = MAP_H; const mi = renderMap(mc);
  const mapTex = tex(mc);
  const mapMat = new THREE.MeshStandardMaterial({ map: mapTex, roughness: 0.85, emissive: 0xffffff, emissiveMap: mapTex, emissiveIntensity: 0.2 });
  const mapMesh = new THREE.Mesh(new THREE.PlaneGeometry(mapW, mapH), mapMat);
  const pinAt = (hit) => { // Nadel unter dem Finger?
    if (!hit?.uv) return null; const px = hit.uv.x * MAP_W, py = (1 - hit.uv.y) * MAP_H; let best = null, bd = 64;
    for (const p of PINS) { const [x, y] = mi.P(p.lon, p.lat), d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = p; } } return best;
  };
  mapMesh.userData.tap = {
    label: 'Weltkarte',
    resolve: (hit) => {
      const p = pinAt(hit), station = 'geschichte-karte';
      if (!p) return { ...MAP_CARD, station, image: cardImage(mc, 640), wide: true, alt: 'Weltkarte' };
      const card = { ...PIN_CARDS[p.id], station };
      if (p.id === 'aegypten' && book) card.actions = [{ label: 'Ägypten-Buch öffnen', fn: () => ctx.ui.openBook(book) }];
      return card;
    },
  };
  mapMesh.userData.pins = PINS.map((p) => { const [x, y] = mi.P(p.lon, p.lat); return { id: p.id, x, y }; }); mapMesh.userData.size = [MAP_W, MAP_H];
  place(mapMesh, 'W', 0, 0.03, mapY);
  place(gildedFrame(mapW, mapH, { fw: 0.15, depth: 0.1 }), 'W', 0, 0.0, mapY);
  place(pictureLight(2.4), 'W', 0, 0.02, mapY + mapH / 2 + 0.3);
  place(glow(3.4, 0.9, 0xffd890, 0.28), 'W', 0, 0.06, mapY + mapH / 2 + 0.5);
  place(brassPlate('Die Welt der Geschichte', 1.5, 0.2, { sub: 'Wo die Geschichte spielte' }), 'W', 0, 0.115, mapY - mapH / 2 - 0.24);

  // ---------------------------------------------------------------- Nischen mit Samtwand, Giebelbalken und Titelschild
  const niche = (wl, kind, title) => {
    place(new THREE.Mesh(new THREE.PlaneGeometry(4.1, 4.2), nicheMat(kind)), wl, 0, 0.012, 2.1);
    place(box(4.3, 0.26, 0.2, W(0x3a1a0e, { planks: 1 }), { tile: 1 }), wl, 0, 0.1, 4.33);
    place(box(4.3, 0.035, 0.22, M.brass()), wl, 0, 0.11, 4.2);
    place(box(4.3, 0.025, 0.21, M.brass()), wl, 0, 0.105, 4.46);
    place(wallSign(title, '', 2.5, 0.3, null, { size: 0.5 }), wl, 0, 0.012, 4.0);
  };
  niche('N', 'lapis', 'Schätze der Pharaonen');
  niche('S', 'gruen', 'Schrift und Buch');

  // ---------------------------------------------------------------- Epochen-Schilder über den Regalgruppen
  const sign = (wl, a, text, sub, card, station) => place(wallSign(text, sub, 3.2, 0.4, { ...card, station, label: text }, { size: 0.5, subSize: 0.2 }), wl, a, 0.012, 3.12);
  sign('N', -3.67, 'Urgeschichte', 'Steinzeit und frühe Menschen', EPOCHS.urgeschichte, 'geschichte-schaetze');
  sign('N', 3.67, 'Altertum', 'Ägypten, Griechen, Römer', EPOCHS.altertum, 'geschichte-schaetze');
  sign('S', -3.67, 'Mittelalter', 'Burgen, Klöster, Städte', EPOCHS.mittelalter, 'geschichte-schrift');
  sign('S', 3.67, 'Neuzeit', 'Entdecker und Erfinder', EPOCHS.neuzeit, 'geschichte-schrift');
  for (const [wl, a] of [['N', -3.67], ['N', 3.67], ['S', -3.67], ['S', 3.67]]) place(glow(3.0, 0.6, 0xffc880, 0.16), wl, a, 0.02, 3.5);

  // kleine Schilder über den übrigen Regalen (Stirnwand und Türwand)
  for (const [wl, a, text, sub] of [['W', -3.6, 'Popup-Bücher', 'Zum Aufklappen und Staunen'], ['W', 3.6, 'Reisen und Karten', 'Atlanten und Entdecker'], ['E', -4.2, 'Nachschlagewerke', 'Lexika und Jahreszahlen'], ['E', 4.2, 'Buchdruck', 'Wie Bücher entstehen']]) place(wallSign(text, sub, 1.5, 0.3, null, { size: 0.46, subSize: 0.2 }), wl, a, 0.012, 3.1);

  // ---------------------------------------------------------------- Schaukästen
  const exhibit = (key, wl, a, cfg) => {
    const vit = showcase({ w: 1.0, d: 0.74, plinthH: 0.92, glassH: 1.15, cloth: cfg.cloth }); cfg.fill(vit.userData.inner); place(vit, wl, a, 0.52, 0);
    const pl = brassPlate(EXHIBITS[key].label, 0.66, 0.2, { sub: cfg.sub, size: 0.36, subSize: 0.2 }); pl.position.set(0, 0.46, 0.74 / 2 + 0.014); vit.add(pl);
    const card = { ...EXHIBITS[key], image: cfg.image, alt: EXHIBITS[key].title, station: cfg.station };
    const hb = hitBox(1.12, 2.25, 0.86, { ...card, label: EXHIBITS[key].label }); hb.position.set(0, 1.12, 0); vit.add(hb);
    return vit;
  };
  { // Goldmaske
    const pc = lit(paperCut('tutmaske', { height: 0.8, thickness: 0.03, border: 0.008, name: 'gesch:maske' }), 0.3);
    exhibit('maske', 'N', -1.0, {
      cloth: 0x1b2a66, sub: 'um 1323 v. Chr. · Nachbau', station: 'geschichte-schaetze', image: cardImage(pc.canvas, 480),
      fill(inner) {
        const sun = sunDisc(0.5); sun.position.set(0, 0.47, -0.2); inner.add(sun);
        const b = box(0.36, 0.04, 0.2, M.brass()); b.position.set(0, 0.02, 0.0); inner.add(b);
        pc.mesh.position.set(0, 0.04, 0.03); inner.add(pc.mesh);
        const sh = shadowFor(pc, { dx: 0.03, dy: -0.025, opacity: 0.45 }); sh.position.add(new THREE.Vector3(0, 0.04, -0.045)); inner.add(sh);
      },
    });
  }
  { // Doppelkrone
    const pc = lit(paperCut('doppelkrone', { height: 0.86, thickness: 0.03, border: 0.008, name: 'gesch:krone' }), 0.3);
    exhibit('krone', 'N', 1.0, {
      cloth: 0x1b2a66, sub: 'Zeichen für ganz Ägypten', station: 'geschichte-schaetze', image: cardImage(pc.canvas, 380),
      fill(inner) {
        const cushion = mesh(new THREE.CylinderGeometry(0.2, 0.24, 0.07, 28), M.fabric(0x7b1f26)); cushion.position.y = 0.035; inner.add(cushion);
        const ring = mesh(new THREE.TorusGeometry(0.235, 0.012, 8, 40), M.brass()); ring.rotation.x = Math.PI / 2; ring.position.y = 0.07; inner.add(ring);
        pc.mesh.position.set(0, 0.07, 0.0); inner.add(pc.mesh);
        const sh = shadowFor(pc, { dx: 0.03, dy: -0.02, opacity: 0.4 }); sh.position.add(new THREE.Vector3(0, 0.07, -0.045)); inner.add(sh);
      },
    });
  }
  { // Papyrusrolle (S-Nische, von der Raummitte aus gesehen links = +x)
    const pc = lit(paperCut('papyrusrolle', { height: 0.62, thickness: 0.03, border: 0.008, name: 'gesch:papyrus' }), 0.3);
    exhibit('papyrus', 'S', -1.0, {
      cloth: 0x1f3a2e, sub: 'Das Papier der Ägypter', station: 'geschichte-schrift', image: cardImage(pc.canvas, 480),
      fill(inner) {
        const b = box(0.62, 0.05, 0.16, W(0x5a2a16, { planks: 2 }), { tile: 1 }); b.position.set(0, 0.025, 0.02); inner.add(b);
        const br = box(0.64, 0.012, 0.18, M.brass()); br.position.set(0, 0.056, 0.02); inner.add(br);
        pc.mesh.position.set(0, 0.062, 0.04); pc.mesh.rotation.x = -0.05; inner.add(pc.mesh);
        const sh = shadowFor(pc, { dx: 0.03, dy: -0.02, opacity: 0.4 }); sh.position.add(new THREE.Vector3(0, 0.062, -0.01)); inner.add(sh);
        const ink = mesh(new THREE.CylinderGeometry(0.035, 0.04, 0.05, 14), M.plain(0x1c2a3a, 0.2, 0.4)); ink.position.set(0.36, 0.025, 0.2); inner.add(ink);
        const lid = mesh(new THREE.CylinderGeometry(0.02, 0.028, 0.02, 12), M.brass()); lid.position.set(0.36, 0.06, 0.2); inner.add(lid);
        const reed = mesh(new THREE.CylinderGeometry(0.004, 0.004, 0.26, 6), M.plain(0xd8c27a, 0.8)); reed.rotation.z = Math.PI / 2; reed.rotation.y = 0.3; reed.position.set(-0.3, 0.008, 0.22); inner.add(reed);
      },
    });
  }
  { // Stein von Rosette
    const pc = lit(paperCut('rosetta_stein', { height: 0.8, thickness: 0.1, border: 0.004, edge: '#3a3d44', paper: '#3a3d44', grain: 0.3, name: 'gesch:rosette' }), 0.22);
    exhibit('rosette', 'S', 1.0, {
      cloth: 0x1f3a2e, sub: 'gefunden 1799 · Nachbau', station: 'geschichte-schrift', image: cardImage(pc.canvas, 480),
      fill(inner) {
        const b = box(0.62, 0.03, 0.3, M.brass()); b.position.set(0, 0.015, 0); inner.add(b);
        pc.mesh.position.set(0, 0.03, 0.06); pc.mesh.rotation.x = -0.1; inner.add(pc.mesh);
      },
    });
  }

  // ---------------------------------------------------------------- Modell der Cheops-Pyramide in der Tischvitrine (Raummitte, Schnitt zeigt zur Tür)
  {
    const cc = new THREE.Group(), tc = tableCase({ w: 1.5, d: 1.05 }), model = pyramidModel({ height: 0.66 });
    model.position.set(0, 0.02, 0.04); model.rotation.y = 0.38; tc.userData.inner.add(model); cc.add(tc);
    const lg = legendPlate(0.9, 0.15); lg.position.set(0, 0.82 - 0.2, 1.05 / 2 - 0.1 + 0.029); tc.add(lg);
    const pl = brassPlate(EXHIBITS.pyramide.label, 0.56, 0.12, { sub: 'aufgeschnitten', size: 0.4, subSize: 0.22 }); pl.position.set(0, 0.82 + 0.06, 1.05 / 2 - 0.14); pl.rotation.x = -0.95; tc.add(pl);
    const card = { ...EXHIBITS.pyramide, image: cardImage(model.children[0].material[0].map.image, 520), wide: true, alt: 'Querschnitt der Cheops-Pyramide', station: 'geschichte-pyramide' };
    const hb = hitBox(1.6, 1.95, 1.15, { ...card, label: EXHIBITS.pyramide.label }); hb.position.set(0, 0.97, 0); tc.add(hb);
    cc.rotation.y = Math.PI / 2; cc.position.set(1.3, 0, 1.4); g.add(cc);
  }

  // ---------------------------------------------------------------- Zeituhr an der Türwand (Nordseite der Tür)
  const clock = new THREE.Group(); let hourHand, minHand, secHand, globeSphere;
  {
    const CR = 0.76;
    const fc = document.createElement('canvas'); fc.width = 768; fc.height = 768; renderClockFace(fc);
    const ft = tex(fc), fm = new THREE.MeshStandardMaterial({ map: ft, roughness: 0.7, emissive: 0xffffff, emissiveMap: ft, emissiveIntensity: 0.22 });
    const back = mesh(new THREE.CylinderGeometry(CR + 0.07, CR + 0.07, 0.1, 56), W(0x4a1e12, { planks: 1 }), { tile: 1 }); back.rotation.x = Math.PI / 2; back.position.z = 0.05; clock.add(back);
    const bez = mesh(new THREE.TorusGeometry(CR + 0.02, 0.05, 10, 72), M.brass()); bez.position.z = 0.1; clock.add(bez);
    const bez2 = mesh(new THREE.TorusGeometry(CR + 0.09, 0.022, 8, 72), M.brass()); bez2.position.z = 0.075; clock.add(bez2);
    const face = new THREE.Mesh(new THREE.CircleGeometry(CR, 72), fm); face.position.z = 0.103; clock.add(face);
    face.userData.tap = { ...CLOCK_CARD, label: 'Zeituhr', station: 'geschichte-uhr', image: cardImage(fc, 520), alt: 'Zifferblatt der Zeituhr' };
    const crest = box(0.5, 0.1, 0.1, W(0x3a1a0e, { planks: 1 }), { tile: 1 }); crest.position.set(0, CR + 0.14, 0.05); clock.add(crest);
    const ball = mesh(new THREE.SphereGeometry(0.07, 14, 10), M.brass()); ball.position.set(0, CR + 0.24, 0.05); clock.add(ball);
    // Zeiger (dynamisch, werden nicht zusammengefasst)
    const hands = new THREE.Group(); hands.userData.dynamic = true; hands.position.z = 0.11; clock.add(hands);
    const handShape = (len, wd, tail) => { const s = new THREE.Shape(); s.moveTo(-wd * 0.3, -tail); s.lineTo(wd * 0.3, -tail); s.lineTo(wd * 0.3, len * 0.55); s.lineTo(wd, len * 0.62); s.lineTo(0, len); s.lineTo(-wd, len * 0.62); s.lineTo(-wd * 0.3, len * 0.55); s.closePath(); return s; };
    const hm = new THREE.MeshStandardMaterial({ color: 0x2a1a0c, roughness: 0.4, metalness: 0.5, side: THREE.DoubleSide });
    const mk = (len, wd, tail, z) => { const m = new THREE.Mesh(new THREE.ShapeGeometry(handShape(len, wd, tail)), hm); m.position.z = z; m.userData.dynamic = true; hands.add(m); return m; };
    hourHand = mk(0.2, 0.034, 0.05, 0.002); minHand = mk(0.3, 0.026, 0.06, 0.006);
    const sec = new THREE.Mesh(new THREE.PlaneGeometry(0.008, 0.3), new THREE.MeshStandardMaterial({ color: 0xb8352b, roughness: 0.5, side: THREE.DoubleSide })); sec.geometry.translate(0, 0.1, 0); sec.position.z = 0.01; sec.userData.dynamic = true; hands.add(sec); secHand = sec;
    const cap = mesh(new THREE.SphereGeometry(0.03, 12, 8), M.brass()); cap.position.z = 0.016; cap.userData.dynamic = true; hands.add(cap);
    place(clock, 'E', -2.5, 0.0, 2.7);
    place(pictureLight(0.9), 'E', -2.5, 0.02, 3.9);
    place(glow(2.4, 1.0, 0xffd890, 0.22), 'E', -2.5, 0.05, 3.95);
  }
  const tickClock = () => {
    const d = new Date(), s = d.getSeconds() + d.getMilliseconds() / 1000, m = d.getMinutes() + s / 60, h = (d.getHours() % 12) + m / 60;
    hourHand.rotation.z = -(h / 12) * TAU; minHand.rotation.z = -(m / 60) * TAU; secHand.rotation.z = -(s / 60) * TAU;
  };
  tickClock();

  // ---------------------------------------------------------------- Gutenberg-Ecke (Türwand, Südseite)
  {
    const press = printingPress(); press.scale.setScalar(1.05); place(press, 'E', 2.4, 0.3, 0);
    const hb = hitBox(1.5, 1.75, 1.1, { ...FURNITURE.presse, label: 'Gutenberg-Druckerpresse', station: 'geschichte-presse' }); hb.position.set(0, 0.88, 0.05); press.add(hb);
    place(personFrame('gutenberg'), 'E', 2.0, 0.012, 2.85);
    const bt = new THREE.CanvasTexture(bibelSeiteCanvas()); bt.colorSpace = THREE.SRGBColorSpace; bt.anisotropy = 8;
    const bf = framedPicture(bt, { w: 0.5, h: 0.66, name: 'Gutenberg-Bibel', sub: 'um 1455' }); place(bf, 'E', 3.0, 0.012, 2.85);
    bf.userData.tap = { ...FURNITURE.presse, label: 'Seite aus der Gutenberg-Bibel', station: 'geschichte-presse' };
    place(pictureLight(0.9), 'E', 2.0, 0.02, 3.55);
    place(glow(1.8, 0.9, 0xffd890, 0.2), 'E', 2.45, 0.05, 3.5);
  }

  // ---------------------------------------------------------------- Porträts an den Nischen
  for (const [wl, a, id] of [['N', -1.0, 'carter'], ['N', 1.0, 'kleopatra'], ['S', -1.0, 'herodot'], ['S', 1.0, 'champollion']]) {
    const f = personFrame(id); place(f, wl, a, 0.014, 3.1); f.userData.tap = { ...f.userData.tap, station: wl === 'N' ? 'geschichte-schaetze' : 'geschichte-schrift' };
    place(pictureLight(0.9), wl, a, 0.014, 3.82); place(glow(1.3, 0.6, 0xffd890, 0.22), wl, a, 0.04, 3.7);
  }

  // ---------------------------------------------------------------- Kartentisch, Globus, Sitzecke, Lampen
  {
    const mt = mapTable(); mt.rotation.y = Math.PI / 2; mt.position.set(-4.75, 0, 0); g.add(mt);
    const hb = hitBox(1.1, 0.95, 2.0, { ...FURNITURE.tisch, label: 'Kartentisch', station: 'geschichte-tisch' }); hb.position.set(0, 0.47, 0); mt.add(hb);
    const lamp = deskLamp({ light: false }); lamp.scale.setScalar(0.9); lamp.position.set(0.6, 0.8, 0.38); mt.add(lamp);
    at(chair({ seat: M.fabric(0x6a2230), wood: W(0x5a2a16) }), -4.45, 0, 1.45, Math.PI + 0.5);
    const gl = globe({ r: 0.34, map: globeTexture() }); globeSphere = gl.userData.sphere; globeSphere.rotation.y = -0.2;
    at(gl, -4.8, 0, 2.15, 0); gl.scale.setScalar(1.08);
    const hg = hitBox(0.9, 1.5, 0.9, { ...FURNITURE.globus, label: 'Globus', station: 'geschichte-tisch' }); hg.position.set(0, 0.8, 0); gl.add(hg);
    // Leseecke an der Nordseite der Mittelachse
    at(armchair({ color: 0x6a2230 }), 2.0, 0, -2.7, -1.15);
    const st = at(readingTable({ r: 0.3, h: 0.58, wood: W(0x6a3a20) }), 2.35, 0, -1.55);
    const dl = deskLamp({ light: false }); dl.position.set(0, 0.6, 0); dl.scale.setScalar(0.75); st.add(dl);
    for (const [x, z] of [[-5.2, -2.3], [1.4, -2.0]]) {
      at(floorLamp(), x, 0, z);
      const gp = glow(1.8, 1.8, 0xffc070, 0.16); gp.rotation.x = -Math.PI / 2; gp.position.set(x, 0.03, z); g.add(gp);
    }
  }

  // ---------------------------------------------------------------- Teppiche
  at(rug(6.6, 4.2, {}), 0.4, 0, 0);
  at(rug(3.4, 1.5, { field: [34, 58, 110], second: [30, 24, 40], seed: 5 }), 0, 0, -3.35);
  at(rug(3.4, 1.5, { field: [30, 78, 60], second: [30, 24, 40], seed: 6 }), 0, 0, 3.35);
  at(rug(1.9, 1.5, { field: [96, 30, 34], second: [40, 24, 20], seed: 7 }), 2.2, 0, -2.2);

  // ---------------------------------------------------------------- Stationen (Reihenfolge der Pfeile)
  stations.length = 0;
  const st = (id, name, pos, look, extra = {}) => stations.push({ id: `geschichte-${id}`, room: 'geschichte', name: `Geschichte: ${name}`, pos, look, ...extra });
  st('eingang', 'Eingang', [4.4, 1.6, 0.0], [-6, 2.15, 0], { catSpot: [2.0, 0, 2.7] });
  st('regal-W', 'Popup-Bücher', [-3.7, 1.6, 3.35], [-5.8, 1.35, 3.6], { catSpot: [-3.0, 0, 2.4] });
  st('regal-N', 'Regale Altertum', [3.6, 1.6, -1.7], [3.6, 2.2, -5], { catSpot: [1.8, 0, -1.2] });
  st('regal-S', 'Regale Neuzeit', [-3.6, 1.6, 1.7], [-3.6, 2.2, 5], { catSpot: [-2.1, 0, 2.6] });
  st('schaetze', 'Schätze der Pharaonen', [0.0, 1.6, -1.6], [0, 2.15, -5], { catSpot: [2.6, 0, -3.5] });
  st('schrift', 'Schrift und Buch', [0.0, 1.6, 1.6], [0, 2.15, 5], { catSpot: [-2.4, 0, 3.4] });
  st('pyramide', 'Cheops-Pyramide', [3.2, 1.55, 1.4], [1.3, 1.0, 1.4], { catSpot: [2.8, 0, 0.1] });
  st('karte', 'Weltkarte', [-2.6, 1.6, 0.0], [-6, 2.25, 0], { catSpot: [-4.5, 0.8, -0.7] });
  st('tisch', 'Kartentisch und Globus', [-2.1, 1.6, -0.2], [-4.9, 0.95, 0.7], { catSpot: [-2.9, 0, -2.4] });
  st('uhr', 'Zeituhr', [3.9, 1.6, -2.5], [6, 2.65, -2.5], { catSpot: [4.8, 0, -0.5] });
  st('presse', 'Gutenberg und der Buchdruck', [2.7, 1.6, 2.5], [6, 1.7, 2.45], { catSpot: [4.9, 0, 0.9] });
  st('tuer', 'Ausgang', [-3.0, 1.6, 0.0], [6, 1.9, 0], { catSpot: [-1.2, 0, -1.6] });

  // ---------------------------------------------------------------- Animation: Uhrzeiger
  let acc = 0;
  return { update(dt) { acc += dt; if (globeSphere) globeSphere.rotation.y += dt * 0.12; if (acc > 0.25) { acc = 0; tickClock(); } } };
}
