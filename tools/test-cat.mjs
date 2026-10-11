// Archimedes-Test: Rundgang Foyer -> Geschichte -> Biologie -> Chemie -> Foyer im Handbetrieb (?manual=1, __lib.step).
// Prüft nach jeder Ankunft: Katze sitzt, ist im Bild (NDC), frei von Wänden und Möbeln, nicht verdeckt; der Tipp erscheint genau einmal;
// ein Mausklick auf die Katze löst poke() aus (Sprechblase). Außerdem: Start (schlafend auf dem Tisch), Antippen im Schlaf, ruhiger Modus, Zeichenaufrufe.
// Standard ist die 3D-Katze (Modell geladen, Clips, <= 8 Zeichenaufrufe, <= 14000 Dreiecke); mit CAT=paper läuft dieselbe Prüfung für die Papierkatze (?cat=paper, <= 30 Aufrufe).
// Aufruf: BOOK_HTML=... OUT_DIR=... [CAT=paper] node tools/test-cat.mjs
import { open, ready, out } from './harness.mjs';
const paper = process.env.CAT === 'paper';
const { browser, page, logs } = await open({ w: +(process.env.W || 1024), h: +(process.env.H || 640), query: '?q=low&quiet=1&manual=1' + (paper ? '&cat=paper' : '') });
page.setDefaultTimeout(240000);
await ready(page, 180000);
await page.evaluate(() => { document.getElementById('go').click(); });
await page.waitForTimeout(900);
let ok = true; const check = (name, cond, extra = '') => { console.log(cond ? 'OK  ' : 'FAIL', name, extra); if (!cond) ok = false; };
const step = (n, dt = 0.1) => page.evaluate(([n, dt]) => { window.__lib.step(dt, n); }, [n, dt]);
const bubble = () => page.evaluate(() => ({ hidden: document.getElementById('bubble').hidden, text: document.getElementById('bubble-text').textContent }));
// Alle ui.say-Aufrufe mitschreiben
await page.evaluate(() => { const ui = window.__lib.ui, orig = ui.say.bind(ui); window.__said = []; ui.say = (t, o) => { window.__said.push(t); return orig(t, o); }; });
const catInfo = () => page.evaluate(() => {
  const L = window.__lib, c = L.world.cat, a = c.cat, V = L.THREE.Vector3;
  const proj = (x, y, z) => { const v = new V(x, y, z).project(L.camera); return [v.x, v.y, v.z]; };
  const p = a.pos;
  const body = proj(p.x, p.y + 0.2, p.z), top = proj(p.x, p.y + 0.44, p.z), feet = proj(p.x, p.y, p.z);
  const rooms = Object.fromEntries(Object.entries(window.__lib.world.rooms).map(([k, r]) => [k, [r.offset.x, r.offset.z]]));
  // Schnitt mit den Regal-Klickflächen (Hitplanes): Katzenmitte +-0.3 m um die Fläche
  let shelfHit = null; const B = new L.THREE.Box3();
  for (const r of Object.values(L.world.rooms)) r.group.traverse((o) => { if (o.userData.tap?.label === 'Regal' && o.isMesh) { B.setFromObject(o).expandByVector(new V(0.3, 0, 0.3)); if (p.x > B.min.x && p.x < B.max.x && p.z > B.min.z && p.z < B.max.z && p.y < B.max.y) shelfHit = [B.min.x, B.min.z, B.max.x, B.max.z]; } });
  return { mode: a.mode, pose: a.pose, pos: [p.x, p.y, p.z], body, top, feet, clearance: c.space.clearance(p.x, p.z), room: L.rig.room, cur: L.rig.cur, calm: L.rig.calm, tips: a.tipped.size, rooms, shelfHit };
});
const sizes = { foyer: [14, 12], geschichte: [12, 10], biologie: [10, 12], chemie: [12, 10] };
const lines = {}; // aus talk.js, in der Seite gelesen
const talk = await page.evaluate(() => { const c = window.__lib.world.cat; return { foyer: c.tipFor('foyer'), geschichte: c.tipFor('geschichte'), biologie: c.tipFor('biologie'), chemie: c.tipFor('chemie') }; });
void lines;
const click = async (info) => {
  const [x, y] = await page.evaluate(() => { const L = window.__lib, a = L.world.cat.cat, v = a.bodyCenter().project(L.camera); const r = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; });
  await page.mouse.click(x, y); await step(2);
};

// ---- 3D-Modell geladen?
if (!paper) {
  await page.waitForFunction(() => window.__lib.world.cat.cat.ready === true || window.__lib.world.cat.cat.failed, null, { timeout: 60000 }).catch(() => {});
  const m = await page.evaluate(() => { const a = window.__lib.world.cat.cat; return { cls: a.constructor.name, ready: a.ready, clips: a.clipNames?.() || [], bones: Object.keys(a.bones || {}).length }; });
  check('3D-Katze: Modell geladen (Archimedes3D)', m.cls === 'Archimedes3D' && m.ready, JSON.stringify(m.cls));
  const need = ['sit_idle', 'blink', 'groom', 'meow', 'scared', 'talk', 'walk', 'trot', 'run', 'jump_up', 'jump_down', 'stretch', 'sleep_idle', 'wake'];
  check('3D-Katze: alle Clips vorhanden', need.every((c) => m.clips.includes(c)), m.clips.join(','));
  check('3D-Katze: Skelett mit höchstens 45 Knochen', m.bones > 20 && m.bones <= 45, String(m.bones));
}
const played = () => page.evaluate(() => window.__lib.world.cat.cat.playLog?.slice() || []);
// ---- Start: schläft auf dem Lesetisch
await step(2);
let I = await catInfo();
check('Start: schläft auf dem Foyer-Tisch', I.mode === 'sleep' && I.pose === 'sleep' && Math.abs(I.pos[0]) < 0.05 && Math.abs(I.pos[1] - 0.8) < 0.05 && Math.abs(I.pos[2] + 0.6) < 0.1, JSON.stringify(I.pos));
check('Start: Katze im Bild', Math.abs(I.body[0]) < 1 && Math.abs(I.body[1]) < 1 && I.body[2] < 1, I.body.map((v) => v.toFixed(3)).join(' '));
await page.screenshot({ path: out('cat-0-start.png') });
// Antippen im Schlaf: wacht auf, sagt etwas (kein Raumtipp)
await step(3); await click(I); await step(8);
let B = await bubble();
check('Antippen (schlafend): Sprechblase', !B.hidden && /Mrrau|Hm\?|Miau/.test(B.text), B.text);
I = await catInfo(); check('Antippen (schlafend): sitzt danach', I.mode === 'sit' || I.mode === 'wake', I.mode);
if (!paper) { const pl = await played(); check('Antippen (schlafend): Clips sleep_idle, wake', pl.includes('sleep_idle') && pl.includes('wake'), pl.join(',')); }
await step(10);

// ---- Hausherr-Gemälde an der Foyer-Nordwand antippen: Karte
{
  const [x, y] = await page.evaluate(() => { const L = window.__lib, v = new L.THREE.Vector3(-4.75, 1.75, -5.95).project(L.camera); const r = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; });
  await page.mouse.click(x, y); await step(2);
  const card = await page.evaluate(() => ({ open: !document.getElementById('card').hidden, text: document.querySelector('#card .body')?.textContent || '', imgs: document.querySelectorAll('#card img').length }));
  check('Gemälde „Archimedes, Hausherr“: Karte geht auf', card.open && /Archimedes/.test(card.text) && /Heureka/.test(card.text) && card.imgs === 1, card.text.slice(0, 60));
  await page.waitForTimeout(500);
  const imgOk = await page.evaluate(() => { const i = document.querySelector('#card img'); return !!i && i.complete && i.naturalWidth > 100; });
  check('Gemälde-Karte: Bild geladen', imgOk);
  await page.screenshot({ path: out('cat-portrait-card.png') });
  await page.keyboard.press('Escape'); await step(1);
}
// ---- Rundgang
const tour = [['geschichte-eingang', 'geschichte'], ['biologie-eingang', 'biologie'], ['chemie-eingang', 'chemie'], ['foyer-tuer-chemie', 'foyer']];
const seenTips = {};
for (const [id, room] of tour) {
  const before = await page.evaluate(() => window.__said.length);
  await page.evaluate((id) => { window.__lib.goStation(id); }, id);
  let n = 0, maxWalk = 0, sawWalk = false;
  while (n++ < 140) { await step(1, 0.1); const m = await page.evaluate(() => ({ mv: window.__lib.rig.moving, pose: window.__lib.world.cat.cat.pose })); if (m.pose === 'walk') sawWalk = true; if (!m.mv) break; }
  await step(18, 0.1);
  I = await catInfo();
  check(`${id}: Katze ist unterwegs gerannt`, sawWalk);
  if (!paper) { const pl = await played(); check(`${id}: Laufclip gespielt`, pl.some((c) => ['walk', 'trot', 'run'].includes(c)), pl.slice(-6).join(',')); }
  check(`${id}: Katze sitzt`, I.mode === 'sit' && I.pose === 'sit', `${I.mode}/${I.pose}`);
  const inView = Math.abs(I.body[0]) <= 0.98 && I.body[1] > -0.98 && I.body[1] < 0.9 && I.body[2] > -1 && I.body[2] < 1 && I.top[1] > -0.98;
  check(`${id}: Katze im Blickfeld`, inView, `ndc body ${I.body.map((v) => v.toFixed(2))} top ${I.top[1].toFixed(2)}`);
  const sz = sizes[I.room], off = I.rooms[I.room];
  const dx = Math.abs(I.pos[0] - off[0]), dz = Math.abs(I.pos[2] - off[1]);
  check(`${id}: Abstand zu Wänden/Regalen (>= 0.7 m von der Wand)`, dx <= sz[0] / 2 - 0.7 && dz <= sz[1] / 2 - 0.7, `dx ${dx.toFixed(2)} dz ${dz.toFixed(2)} im Raum ${I.room}`);
  check(`${id}: frei von Möbeln (Raster)`, I.clearance >= 0.22, `Abstand ${I.clearance.toFixed(2)} m`);
  check(`${id}: kein Schnitt mit Regal-Klickflächen`, !I.shelfHit, JSON.stringify(I.shelfHit));
  // Sichtbarkeit: der Strahl durch den Körper trifft zuerst die Katze
  const hit = await page.evaluate(() => { const L = window.__lib, a = L.world.cat.cat, v = a.bodyCenter().project(L.camera), h = L.world.pick(v.x, v.y); return h ? h.tap.kind : null; });
  check(`${id}: Katze ist antippbar (nicht verdeckt)`, hit === 'cat', String(hit));
  // Tipp: genau einmal, mit dem Raumtext
  const said = await page.evaluate((b) => window.__said.slice(b), before);
  check(`${id}: Tipp erscheint einmal`, room === 'foyer' ? said.length === 0 : said.filter((t) => t === talk[room]).length === 1 && said.length === 1, JSON.stringify(said.map((t) => t.slice(0, 40))));
  if (room !== 'foyer') { B = await bubble(); check(`${id}: Sprechblase sichtbar`, !B.hidden && B.text.length > 10, B.text.slice(0, 50)); }
  await page.screenshot({ path: out(`cat-${room}-${id}.png`) });
  // Antippen: Sprechblase mit einem Spruch (anderer Text als der Tipp)
  await page.evaluate(() => window.__lib.ui.hush());
  await click(I); await step(3);
  B = await bubble();
  check(`${id}: Antippen löst poke() aus`, !B.hidden && B.text.length > 10 && B.text !== talk[room], B.text.slice(0, 60));
  if (!paper) { const pl = await played(); check(`${id}: Antippen spielt meow oder scared`, pl.slice(-6).some((c) => c === 'meow' || c === 'scared'), pl.slice(-6).join(',')); }
  await step(10); await page.screenshot({ path: out(`cat-${room}-${id}-poke.png`) });
  await page.evaluate(() => window.__lib.ui.hush());
}
// Zweiter Besuch: kein neuer Tipp
{
  const before = await page.evaluate(() => window.__said.length);
  await page.evaluate(() => window.__lib.goStation('geschichte-eingang')); let n = 0; while (n++ < 140) { await step(1, 0.1); if (!(await page.evaluate(() => window.__lib.rig.moving))) break; } await step(15, 0.1);
  const said = await page.evaluate((b) => window.__said.slice(b), before);
  check('Zweiter Besuch Geschichte: kein neuer Tipp', said.length === 0, JSON.stringify(said));
}
// ---- Alle Stationen: Katzenplatz prüfen (Aufruf wie place + Blickpunkt)
const bad = [];
const all = await page.evaluate(() => {
  const L = window.__lib, V = L.THREE.Vector3, res = [];
  for (const st of L.rig.stations.values()) {
    L.rig.jump(st.id); L.world.cat.place(st.id); L.step(0.2, 3);
    const a = L.world.cat.cat, p = a.pos, pr = (y) => { const v = new V(p.x, p.y + y, p.z).project(L.camera); return v; };
    const c = pr(0.2), t = pr(0.44), f = pr(0.0), sp = L.world.cat.space;
    let shelfHit = false; const B = new L.THREE.Box3();
    for (const r of Object.values(L.world.rooms)) r.group.traverse((o) => { if (o.userData.tap?.label === 'Regal' && o.isMesh) { B.setFromObject(o).expandByVector(new V(0.3, 0, 0.3)); if (p.x > B.min.x && p.x < B.max.x && p.z > B.min.z && p.z < B.max.z) shelfHit = true; } });
    res.push({ id: st.id, body: [c.x, c.y], top: t.y, feet: f.y, clr: sp.clearance(p.x, p.z), pos: [p.x, p.z], shelfHit });
  }
  return res;
});
for (const r of all) { const vis = Math.abs(r.body[0]) < 0.97 && r.top > -0.97 && r.top < 0.9 && r.body[1] < 0.5; const clr = r.clr >= 0.2 && !r.shelfHit; if (!vis || !clr) bad.push(`${r.id} (ndc ${r.body.map((v) => v.toFixed(2))} top ${r.top.toFixed(2)} clr ${r.clr.toFixed(2)})`); }
// An Wandstationen mit Blick nach oben ist vom Boden nichts zu sehen: dort darf die Katze fehlen (höchstens gut ein Drittel der Stationen)
if (bad.length) console.log('Hinweis: Katze nicht im Bild an', bad.length, 'Stationen:', bad.map((b) => b.split(' ')[0]).join(', '));
check(`Katzenplatz: an mindestens 65 % von ${all.length} Stationen sichtbar und frei`, bad.length <= all.length * 0.35, `${bad.length} ohne`);
// ---- Ruhiger Modus: kein Laufen, Teleport
{
  await page.evaluate(() => { const L = window.__lib; L.rig.calm = true; L.rig.jump('foyer-eingang'); L.world.cat.place('geschichte-eingang'); });
  await step(5);
  await page.evaluate(() => window.__lib.goStation('chemie-eingang'));
  let n = 0, walked = false; while (n++ < 60) { await step(1, 0.1); const m = await page.evaluate(() => ({ mv: window.__lib.rig.moving, pose: window.__lib.world.cat.cat.pose, mode: window.__lib.world.cat.cat.mode })); if (m.pose === 'walk' || m.mode === 'walk') walked = true; if (!m.mv) break; }
  await step(10, 0.1);
  I = await catInfo();
  check('Ruhiger Modus: kein Trotten, Katze am Ziel', !walked && I.mode === 'sit' && Math.hypot(I.pos[0] - 12, I.pos[2] - 2) < 4 && I.clearance >= 0.2, `walked ${walked} ${I.mode} ${I.cur} clr ${I.clearance.toFixed(2)} pos ${I.pos.map((v) => v.toFixed(1))}`);
  check('Ruhiger Modus: Katze im Bild', Math.abs(I.body[0]) <= 0.98 && I.body[1] > -0.98);
  await page.evaluate(() => { window.__lib.rig.calm = false; });
}
// ---- Zeichenaufrufe: Anteil der Katze
{
  const calls = await page.evaluate(() => {
    const L = window.__lib; L.rig.jump('foyer-neu'); L.world.cat.place('foyer-neu'); L.world.cat.cat.mode = 'sit'; L.world.setWant('foyer', true); L.world.update(0.3); L.world.update(0.3);
    const cnt = (vis) => { L.world.cat.group.visible = vis; L.renderer.info.reset(); L.world.update(0.1); L.renderer.render(L.scene, L.camera); return L.renderer.info.render.calls; };
    const a = cnt(true), b = cnt(false); L.world.cat.group.visible = true;
    // Dreiecke der Katze: Szene mit und ohne Katze zeichnen
    const tr = (vis) => { L.world.cat.group.visible = vis; L.renderer.info.reset(); L.renderer.render(L.scene, L.camera); return L.renderer.info.render.triangles; };
    const ta = tr(true), tb = tr(false); L.world.cat.group.visible = true;
    return [a, b, ta - tb];
  });
  check(paper ? 'Zeichenaufrufe der Katze <= 30' : 'Zeichenaufrufe der Katze <= 8', calls[0] - calls[1] <= (paper ? 30 : 8), `mit ${calls[0]}, ohne ${calls[1]}`);
  check('Dreiecke der Katze <= 14000', calls[2] <= 14000, `${calls[2]}`);
}
const errs = logs.filter((l) => /error|pageerror|warn/i.test(l) && !/permissions policy|Failed to load resource|ERR_|KHR_parallel_shader_compile/i.test(l));
check('keine Konsolenfehler', errs.length === 0, errs.slice(0, 5).join('\n'));
console.log(ok ? 'ALLES OK' : 'FEHLER'); await browser.close(); process.exit(ok ? 0 : 1);
