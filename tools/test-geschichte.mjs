// Test Fachraum Geschichte: jede Vitrine, die Weltkarte (mit zwei Kartennadeln), die Zeituhr, ein Porträt, Epochenschild, Presse, Globus und
// Kartentisch werden per Mausklick angetippt; die Karte muss aufgehen und den erwarteten Titel tragen. Außerdem: alle Stationen erreichbar.
import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 1024, h: 640, query: '?q=low&quiet=1&manual=1' });
page.setDefaultTimeout(240000); await ready(page, 120000);
await page.evaluate(() => { document.getElementById('go').click(); });
await page.waitForTimeout(900);
let ok = true; const check = (name, cond, extra = '') => { console.log(cond ? 'OK  ' : 'FAIL', name, extra); if (!cond) ok = false; };
const step = (n, dt = 0.1) => page.evaluate(([n, dt]) => { window.__lib.step(dt, n); }, [n, dt]);
const proj = (x, y, z) => page.evaluate(([x, y, z]) => { const L = window.__lib; const v = new L.THREE.Vector3(x, y, z).project(L.camera); const r = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top, v.z]; }, [x, y, z]);
const go = async (id) => { await page.evaluate((id) => window.__lib.goStation(id), id); await step(120); return page.evaluate((id) => window.__lib.rig.cur === id, id); };
const cardTitle = () => page.evaluate(() => { const c = document.getElementById('card'); return c.hidden ? null : c.querySelector('h2')?.textContent || ''; });
const closeCard = async () => { await page.keyboard.press('Escape'); await step(1); };
// Mittelpunkt (Welt) eines antippbaren Objekts im Raum: nach Label, Titel oder personId
const centerOf = (key) => page.evaluate((key) => {
  const L = window.__lib, g = L.world.rooms.geschichte.group; let found = null;
  g.traverse((o) => { if (found || !o.userData) return; const t = o.userData.tap; if ((t && (t.label === key || t.title === key)) || o.userData.personId === key) found = o; });
  if (!found) return null; found.updateWorldMatrix(true, true); const b = new L.THREE.Box3().setFromObject(found), c = b.getCenter(new L.THREE.Vector3()); return [c.x, c.y, c.z];
}, key);
const tapObject = async (key, expectTitle, { from = null, label = key } = {}) => {
  if (from) { if (!(await go(from))) { check(`${label}: Station ${from} erreicht`, false); return; } }
  const c = await centerOf(key); if (!c) { check(`${label}: Objekt gefunden`, false); return; }
  const [x, y, z] = await proj(...c);
  if (z > 1 || x < 0 || y < 0 || x > 1024 || y > 640) { check(`${label}: im Bild`, false, `(${x | 0},${y | 0})`); return; }
  await page.mouse.click(x, y); await step(3); await page.waitForTimeout(400);
  const t = await cardTitle(); check(`${label}: Karte „${t}“`, t === expectTitle, t === expectTitle ? '' : `erwartet „${expectTitle}“`);
  if (t) await page.screenshot({ path: out(`gesch-card-${label.replace(/\W+/g, '_')}.png`) });
  await closeCard();
};

// 0) alle Stationen von Geschichte erreichbar, in der Pfeil-Reihenfolge
const list = await page.evaluate(() => window.__lib.rig.roomStations('geschichte').map((s) => s.id));
check('Stationen Geschichte: 8 bis 13', list.length >= 8 && list.length <= 13, list.join(', '));
for (const id of list) check(`Station ${id} erreichbar`, await go(id));

// 1) Vitrinen (von der jeweiligen Station aus)
await tapObject('Goldmaske des Tutanchamun', 'Goldmaske des Tutanchamun', { from: 'geschichte-schaetze', label: 'Vitrine Goldmaske' });
await tapObject('Doppelkrone (Pschent)', 'Die Doppelkrone (Pschent)', { label: 'Vitrine Doppelkrone' });
await tapObject('Papyrusrolle', 'Die Papyrusrolle', { from: 'geschichte-schrift', label: 'Vitrine Papyrusrolle' });
await tapObject('Stein von Rosette', 'Der Stein von Rosette', { label: 'Vitrine Stein von Rosette' });
await tapObject('Modell der Cheops-Pyramide', 'Modell der Cheops-Pyramide', { from: 'geschichte-pyramide', label: 'Vitrine Pyramide' });

// 2) Weltkarte: freie Stelle (Ozean) und zwei Kartennadeln. Nadelpositionen stehen in mapMesh.userData.pins
{
  await go('geschichte-karte');
  const mapPt = (u, v) => page.evaluate(([u, v]) => {
    const L = window.__lib; let m = null; L.world.rooms.geschichte.group.traverse((o) => { if (!m && o.userData.tap?.label === 'Weltkarte') m = o; });
    const p = m.geometry.parameters; const w = m.localToWorld(new L.THREE.Vector3((u - 0.5) * p.width, (v - 0.5) * p.height, 0)); return [w.x, w.y, w.z];
  }, [u, v]);
  const pinPx = (id) => page.evaluate((id) => { let r = null; window.__lib.world.rooms.geschichte.group.traverse((o) => { if (!r && o.userData.pins) { const p = o.userData.pins.find((q) => q.id === id), [W, H] = o.userData.size; r = [p.x / W, 1 - p.y / H]; } }); return r; }, id);
  const clickMap = async (name, u, v, expect) => { const [x, y] = await proj(...(await mapPt(u, v))); await page.mouse.click(x, y); await step(3); await page.waitForTimeout(400); const t = await cardTitle(); check(`Weltkarte ${name}: Karte „${t}“`, t === expect); if (t && name === 'Ägypten') await page.screenshot({ path: out('gesch-card-karte-aegypten.png') }); await closeCard(); };
  await clickMap('Ozean', 0.1, 0.5, 'Die Weltkarte');
  for (const [name, id, title] of [['Ägypten', 'aegypten', 'Ägypten am Nil'], ['Mainz', 'mainz', 'Mainz']]) { const [u, v] = await pinPx(id); await clickMap(name, u, v, title); }
}

// 3) Zeituhr, Porträt, Epochenschild, Presse, Globus, Kartentisch
await tapObject('Zeituhr', 'Die Zeituhr', { from: 'geschichte-uhr', label: 'Zeituhr' });
await tapObject('carter', 'Howard Carter', { from: 'geschichte-schaetze', label: 'Porträt Carter' });
await tapObject('Altertum', 'Altertum', { from: 'geschichte-tuer', label: 'Epochenschild Altertum' });
await tapObject('Gutenberg-Druckerpresse', 'Die Druckerpresse', { from: 'geschichte-presse', label: 'Druckerpresse' });
await tapObject('Kartentisch', 'Der Kartentisch', { from: 'geschichte-tisch', label: 'Kartentisch' });
await tapObject('Globus', 'Der Globus', { label: 'Globus' });

// 4) Fahrt auf Tipp: Vitrine vom Eingang aus antippen -> Kamera fährt zur Station, danach Karte
{
  await go('geschichte-eingang');
  const c = await centerOf('Goldmaske des Tutanchamun'); const [x, y, z] = await proj(...c);
  if (z < 1 && x > 0 && x < 1024 && y > 0 && y < 640) {
    await page.mouse.click(x, y); await step(2); check('Tipp aus der Ferne startet Fahrt', await page.evaluate(() => window.__lib.rig.moving));
    await step(120); await page.waitForTimeout(500); check('Nach der Fahrt geht die Karte auf', (await cardTitle()) === 'Goldmaske des Tutanchamun'); await closeCard();
  } else check('Goldmaske vom Eingang sichtbar', false, `(${x | 0},${y | 0})`);
}

const errs = logs.filter((l) => /error|warn|pageerror/i.test(l) && !/permissions policy/i.test(l)); if (errs.length) { console.log(errs.slice(0, 10).join('\n')); ok = false; }
check('keine Konsolenfehler', errs.length === 0);
console.log(ok ? 'ALLES OK' : 'FEHLER'); await browser.close(); process.exit(ok ? 0 : 1);
