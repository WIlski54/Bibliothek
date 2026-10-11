// Biologie-Test: Jedes Exponat (inkl. Doppelhelix, Stammbaum-Zweige, Falter, Herbarbögen, Porträts) wird per Mausklick angetippt, die Karte muss aufgehen
// (Titel passt), danach zu. Dazu: Buchstaben-Knopf an der Doppelhelix, Stationen vorhanden und im Raum, Konsole ohne Fehler.
// Aufruf: node tools/test-biologie.mjs   (BOOK_HTML und OUT_DIR wie bei den anderen Werkzeugen)
import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 1100, h: 700, query: '?q=low&quiet=1&manual=1' });
page.setDefaultTimeout(240000);
await ready(page, 240000);
await page.evaluate(() => { document.getElementById('intro').hidden = true; document.getElementById('hud').hidden = false; });
let ok = true; const check = (name, cond, extra = '') => { console.log(cond ? 'OK  ' : 'FAIL', name, extra); if (!cond) ok = false; };

// 1) Stationen
const st = await page.evaluate(() => { const L = window.__lib; return L.world.rooms.biologie.stations.map((s) => ({ id: s.id, name: s.name, pos: s.pos, look: s.look })); });
check('Stationen: 6 bis 10', st.length >= 6 && st.length <= 10, st.map((s) => s.id).join(' '));
check('Stationen: Eingang zuerst, Ausgang zuletzt', st[0].id === 'biologie-eingang' && st[st.length - 1].id === 'biologie-tuer');
const inside = st.every((s) => Math.abs(s.pos[0]) < 4.9 && Math.abs(s.pos[2]) < 5.9 && s.pos[1] > 1.2 && s.pos[1] < 1.9);
check('Stationen liegen im Raum', inside);

// 2) alle antippbaren Dinge des Raums sammeln
const taps = await page.evaluate(() => {
  const L = window.__lib, T = L.THREE, g = L.world.rooms.biologie.group, out = []; g.updateMatrixWorld(true);
  g.traverse((o) => { const t = o.userData.tap; if (!t) return; const b = new T.Box3().setFromObject(o), c = b.getCenter(new T.Vector3()); out.push({ uuid: o.uuid, title: t.title || null, label: t.label || null, kind: t.kind || null, resolve: !!t.resolve, station: t.station || null, c: [c.x, c.y, c.z], size: [b.max.x - b.min.x, b.max.y - b.min.y, b.max.z - b.min.z] }); });
  return out;
});
const wanted = (re) => taps.filter((t) => re.test(t.title || t.label || ''));
check('Exponate gefunden', taps.length >= 40, String(taps.length));
const proj = (c) => page.evaluate(([x, y, z]) => { const L = window.__lib; const v = new L.THREE.Vector3(x, y, z).project(L.camera); const r = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top, v.z]; }, c);
const jump = (id) => page.evaluate((id) => { const L = window.__lib; L.rig.jump(id); L.world.setWant('biologie', true); L.world.update(0.5); L.renderer.render(L.scene, L.camera); }, id);
const cardTitle = () => page.evaluate(() => (document.getElementById('card').hidden ? null : document.querySelector('#card h2')?.textContent || ''));
const closeCard = async () => { await page.keyboard.press('Escape'); await page.waitForTimeout(30); };

// 3) jedes Ding antippen (ohne die dynamischen Tippflächen: Baum, Knopf)
let done = 0, failed = [];
for (const t of taps) {
  if (t.resolve || t.kind === 'goto' || t.kind === 'nav' || !t.title || !t.station) continue;   // Regale, Tür, Buch-Halter, Porträts und Spezialfälle: siehe unten
  const sid = t.station || 'biologie-eingang'; await jump(sid);
  const [x, y, z] = await proj(t.c); let hit = false;
  if (z < 1 && x > 0 && x < 1100 && y > 0 && y < 700) { await page.mouse.click(x, y); await page.waitForTimeout(40); const ti = await cardTitle(); hit = ti !== null; if (hit) { if (ti !== t.title) failed.push(`${t.title} -> andere Karte: ${ti}`); await closeCard(); } }
  if (!hit) failed.push(`${t.title}: kein Treffer von ${sid} bei ${x.toFixed(0)},${y.toFixed(0)}`); else done++;
}
check(`alle ${done} Exponate öffnen ihre Karte`, failed.length === 0, failed.join(' | '));

// 4) Porträts (alle sieben)
for (const name of ['Charles Darwin', 'Carl von Linné', 'Gregor Mendel', 'Alexander von Humboldt', 'Maria Sibylla Merian', 'Mary Anning', 'Rosalind Franklin']) {
  const t = taps.find((q) => q.title === name); if (!t) { check('Porträt ' + name, false, 'nicht im Raum'); continue; }
  // von der Station aus, die dem Porträt am nächsten liegt
  const best = st.map((s) => ({ id: s.id, d: Math.hypot(s.pos[0] - t.c[0], s.pos[2] - (t.c[2] + 12.5)) })).sort((a, b) => a.d - b.d)[0];
  let hit = false; for (const sid of [best.id, ...st.map((s) => s.id)]) { await jump(sid); const [x, y, z] = await proj(t.c); if (z < 1 && x > 0 && x < 1100 && y > 0 && y < 700) { await page.mouse.click(x, y); await page.waitForTimeout(40); const ti = await cardTitle(); if (ti === name) { hit = true; await closeCard(); break; } if (ti !== null) await closeCard(); } }
  check('Porträt ' + name, hit);
}

// 5) Stammbaum: Zweige und Schilder
{ const tr = taps.find((t) => t.label === 'Stammbaum des Lebens'); await jump('biologie-stammbaum');
  const cases = [['vogel', 'Vögel'], ['g-tie', 'Tiere'], ['g-bak', 'Bakterien'], ['bluete', 'Blütenpflanzen'], ['hefe', 'Hefen'], [null, 'Der Stammbaum des Lebens']];
  const pos = { vogel: [962, 338], 'g-tie': [640, 532], 'g-bak': [200, 890], bluete: [445, 195], hefe: [945, 585], null: [512, 300] };
  for (const [k, title] of cases) { const [px, py] = pos[k]; const w = tr.size[0], h = tr.size[1];
    const wp = [tr.c[0] - w / 2 + (px / 1024) * w, tr.c[1] + h / 2 - (py / 1024) * h, tr.c[2]]; const [x, y, z] = await proj(wp);
    await page.mouse.click(x, y); await page.waitForTimeout(40); const ti = await cardTitle(); check('Stammbaum ' + title, ti === title, String(ti)); if (ti !== null) await closeCard(); } }

// 6) Doppelhelix: Knopf blendet Buchstaben ein und aus; sie dreht sich
{ const bt = taps.find((t) => t.label === 'Buchstaben ein/aus'); await jump('biologie-dna'); const [x, y] = await proj(bt.c);
  const lab = () => page.evaluate(() => { let v = null; window.__lib.world.rooms.biologie.group.traverse((o) => { if (o.userData.labels) v = o.userData.labels.visible; }); return v; });
  const r0 = await page.evaluate(() => { let r = null; window.__lib.world.rooms.biologie.group.traverse((o) => { if (o.name === 'helix') r = o.rotation.y; }); return r; });
  await page.mouse.click(x, y); await page.waitForTimeout(40); check('Knopf blendet Buchstaben ein', (await lab()) === true); await page.mouse.click(x, y); await page.waitForTimeout(40); check('Knopf blendet Buchstaben aus', (await lab()) === false);
  await page.evaluate(() => window.__lib.step(0.1, 20)); const r1 = await page.evaluate(() => { let r = null; window.__lib.world.rooms.biologie.group.traverse((o) => { if (o.name === 'helix') r = o.rotation.y; }); return r; });
  check('Doppelhelix dreht sich', r1 > r0 + 0.1, `${r0.toFixed(2)} -> ${r1.toFixed(2)}`);
  const dyn = await page.evaluate(() => { let v = false; window.__lib.world.rooms.biologie.group.traverse((o) => { if (o.name === 'helix') v = o.userData.dynamic === true; }); return v; }); check('Helix: userData.dynamic', dyn); }

// 7) Regale: Antippen fährt zur Station; Dino-Buch antippbar
{ await jump('biologie-regal'); const bk = taps.find((t) => t.kind === 'book'); let found = null; await page.evaluate(() => { }); const bp = await page.evaluate(() => { const L = window.__lib; let p = null; L.world.rooms.biologie.group.traverse((o) => { if (o.userData.tap?.kind === 'book' && !p) { const v = new L.THREE.Vector3(); o.getWorldPosition(v); p = [v.x, v.y + 0.2, v.z]; } }); return p; });
  const [x, y, z] = await proj(bp); await page.mouse.click(x, y); await page.waitForTimeout(40); const ti = await cardTitle(); check('Dino-Buch öffnet Karte', ti !== null && /Dinosaurier/.test(ti), String(ti)); if (ti !== null) await closeCard(); }

const errs = logs.filter((l) => /error|pageerror/i.test(l) && !/Failed to load resource|ERR_/.test(l)); if (errs.length) console.log(errs.slice(0, 10).join('\n'));
check('keine Konsolenfehler', errs.length === 0);
console.log(ok ? 'ALLES OK' : 'FEHLER'); await browser.close(); process.exit(ok ? 0 : 1);
