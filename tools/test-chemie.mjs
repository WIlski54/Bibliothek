// Test des Chemielabors: (1) Daten-Selbsttest der 118 Elemente, (2) Antippen von Periodensystem-Feldern mit der Maus (Karte nennt das richtige Element),
// (3) Karten aller übrigen Exponate und Porträts, (4) Tippen aus der Ferne fährt hin, (5) keine Konsolenfehler.
import { open, ready, out } from './harness.mjs';
import { ELEMENTS, BY_SYM, CATS, elementCard, PLACEHOLDERS } from '../src/data/elements.js';

let ok = true; const check = (name, cond, extra = '') => { console.log(cond ? 'OK  ' : 'FAIL', name, cond ? '' : extra); if (!cond) ok = false; };

// ---------------------------------------------------------------- (1) Daten
{
  const REF = 'H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og'.split(' ');
  check('Daten: 118 Einträge', ELEMENTS.length === 118);
  check('Daten: Ordnungszahlen 1 bis 118 lückenlos', ELEMENTS.every((e, i) => e.z === i + 1));
  check('Daten: Symbole eindeutig', new Set(ELEMENTS.map((e) => e.sym)).size === 118);
  check('Daten: Namen eindeutig und nicht leer', new Set(ELEMENTS.map((e) => e.name)).size === 118 && ELEMENTS.every((e) => e.name.length > 2));
  check('Daten: Symbole stimmen mit der Referenzreihe überein', ELEMENTS.every((e, i) => e.sym === REF[i]), ELEMENTS.filter((e, i) => e.sym !== REF[i]).map((e) => e.sym).join(','));
  check('Daten: Feldpositionen (Spalte, Zeile) eindeutig', new Set(ELEMENTS.map((e) => e.col + ',' + e.row)).size === 118);
  check('Daten: Spalten 1..18, Zeilen 1..9', ELEMENTS.every((e) => e.col >= 1 && e.col <= 18 && e.row >= 1 && e.row <= 9));
  check('Daten: Kategorien gültig', ELEMENTS.every((e) => CATS[e.cat]));
  check('Daten: Aggregatzustand gültig', ELEMENTS.every((e) => 'flgu'.includes(e.state)));
  check('Daten: nur Brom und Quecksilber flüssig', ELEMENTS.filter((e) => e.state === 'l').map((e) => e.sym).join() === 'Br,Hg');
  check('Daten: Gase bei 25 °C', ELEMENTS.filter((e) => e.state === 'g').map((e) => e.sym).join() === 'H,He,N,O,F,Ne,Cl,Ar,Kr,Xe,Rn');
  const nm = { H: 'Wasserstoff', Na: 'Natrium', K: 'Kalium', W: 'Wolfram', Hg: 'Quecksilber', Fe: 'Eisen', Au: 'Gold', Ag: 'Silber', Cu: 'Kupfer', Pb: 'Blei', Sn: 'Zinn', Nh: 'Nihonium', Mc: 'Moscovium', Ts: 'Tenness', Og: 'Oganesson', Fl: 'Flerovium', Lv: 'Livermorium', C: 'Kohlenstoff', O: 'Sauerstoff', N: 'Stickstoff' };
  check('Daten: deutsche Namen (Stichprobe)', Object.entries(nm).every(([s, n]) => BY_SYM[s].name === n));
  check('Daten: Stichprobe Ordnungszahlen', BY_SYM.H.z === 1 && BY_SYM.C.z === 6 && BY_SYM.Fe.z === 26 && BY_SYM.Au.z === 79 && BY_SYM.Og.z === 118 && BY_SYM.U.z === 92);
  check('Daten: Kategorien Stichprobe', BY_SYM.Na.cat === 'ak' && BY_SYM.Ca.cat === 'ea' && BY_SYM.Fe.cat === 'ub' && BY_SYM.Si.cat === 'hm' && BY_SYM.Cl.cat === 'hg' && BY_SYM.Ar.cat === 'eg' && BY_SYM.Ce.cat === 'la' && BY_SYM.U.cat === 'ac' && BY_SYM.Al.cat === 'um' && BY_SYM.O.cat === 'nm');
  check('Daten: Hauptfeld ohne Lücken (Gruppen)', ELEMENTS.filter((e) => e.group).every((e) => e.col === e.group) && BY_SYM.Hf.group === 4 && BY_SYM.Rn.group === 18 && BY_SYM.Cs.period === 6 && BY_SYM.Lr.period === 7);
  check('Daten: Karten für alle 118 mit Titel, Absätzen und Fakt', ELEMENTS.every((e) => { const c = elementCard(e.z); return c && c.title.includes(e.name) && c.paras.length >= 1 && c.fact && c.fact.length > 10; }));
  check('Daten: Platzhalterfelder 57–71 und 89–103', PLACEHOLDERS.length === 2);
  const withMass = ELEMENTS.filter((e) => typeof e.mass === 'number');
  check('Daten: Atommassen wachsen (außer die bekannten Ausnahmen K, Ni, I, Pa)', withMass.every((e, i) => i === 0 || e.mass > withMass[i - 1].mass || ['K', 'Ni', 'I', 'Pa'].includes(e.sym)), withMass.filter((e, i) => i && e.mass <= withMass[i - 1].mass).map((e) => e.sym).join());
}

// ---------------------------------------------------------------- Browser
const { browser, page, logs } = await open({ w: 1024, h: 640, query: '?q=low&quiet=1&manual=1' });
await ready(page, 120000);
await page.evaluate(() => { document.getElementById('go').click(); });
await page.waitForTimeout(900);
const step = (n, dt = 0.1) => page.evaluate(([n, dt]) => { window.__lib.step(dt, n); }, [n, dt]);
const goto = async (id) => { await page.evaluate((id) => window.__lib.goStation(id), id); for (let i = 0; i < 6; i++) { await step(40); if (await page.evaluate((id) => window.__lib.rig.cur === id, id)) return true; } return false; };
const cardTitle = () => page.evaluate(() => { const c = document.getElementById('card'); return c.hidden ? null : c.querySelector('h2')?.textContent || ''; });
const closeCard = async () => { await page.keyboard.press('Escape'); await step(1); };

check('Fahrt vom Foyer ins Labor (durch die Tür)', await goto('chemie-eingang'));
// (2) Felder des Periodensystems
check('Station Periodensystem erreichbar', await goto('chemie-periodensystem'));
const cellScreen = (z) => page.evaluate((z) => {
  const L = window.__lib, b = L.world.rooms.chemie.group.getObjectByName('periodensystem'), P = b.userData.pse; const el = L.ctx.__els?.[z];
  return null;
}, z);
const clickCell = async (sym) => {
  const e = BY_SYM[sym];
  const pt = await page.evaluate(([col, row]) => {
    const L = window.__lib, b = L.world.rooms.chemie.group.getObjectByName('periodensystem'), P = b.userData.pse, r = P.cellRect(col, row);
    const x = ((r.x + r.w / 2) / P.W - 0.5) * P.w, y = (0.5 - (r.y + r.h / 2) / P.H) * P.h; b.updateWorldMatrix(true, false);
    const v = b.localToWorld(new L.THREE.Vector3(x, y, 0)).project(L.camera); const c = document.getElementById('gl').getBoundingClientRect();
    return [(v.x + 1) / 2 * c.width + c.left, (1 - v.y) / 2 * c.height + c.top, r.w / P.W * P.w, Math.hypot(...L.camera.position.clone().sub(b.getWorldPosition(new L.THREE.Vector3())).toArray())];
  }, [e.col, e.row]);
  await page.mouse.click(pt[0], pt[1]); await step(1);
  return { title: await cardTitle(), pt };
};
let minPx = 1e9;
for (const sym of ['H', 'C', 'Fe', 'Au', 'Og', 'He', 'Hg', 'U', 'Na', 'Lu', 'Ac']) {
  const { title, pt } = await clickCell(sym); const e = BY_SYM[sym];
  check(`Feld ${sym} → Karte „${title}“`, title === `${e.name} (${e.sym})`);
  if (sym === 'H') await page.screenshot({ path: out('chemie-card-H.png') });
  if (sym === 'Og') await page.screenshot({ path: out('chemie-card-Og.png') });
  await closeCard();
}
{ // Zellbreite in Bildschirmpixeln (Touch-Ziel)
  const px = await page.evaluate(() => { const L = window.__lib, b = L.world.rooms.chemie.group.getObjectByName('periodensystem'), P = b.userData.pse; const r = P.cellRect(1, 1); const a = b.localToWorld(new L.THREE.Vector3(((r.x) / P.W - 0.5) * P.w, 0, 0)).project(L.camera), c = b.localToWorld(new L.THREE.Vector3(((r.x + r.w) / P.W - 0.5) * P.w, 0, 0)).project(L.camera); return (c.x - a.x) / 2 * 1024; });
  check(`Feldbreite im Bild ≥ 40 px bei 1024 px Breite (gemessen ${px.toFixed(1)})`, px >= 40);
}
// Legende: Kategorie antippen
{ const pt = await page.evaluate(() => { const L = window.__lib, b = L.world.rooms.chemie.group.getObjectByName('periodensystem'), P = b.userData.pse, z = P.zones.find((q) => q.kind === 'cat' && q.y < 300); const x = ((z.x + 40) / P.W - 0.5) * P.w, y = (0.5 - (z.y + z.h / 2) / P.H) * P.h; const v = b.localToWorld(new L.THREE.Vector3(x, y, 0)).project(L.camera), c = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * c.width + c.left, (1 - v.y) / 2 * c.height + c.top]; });
  await page.mouse.click(pt[0], pt[1]); await step(1); const t = await cardTitle(); check(`Legende antippen → Kategoriekarte („${t}“)`, !!t && Object.values(CATS).some((c) => c.name === t)); await closeCard(); }
// Blättern in der Karte: Nächstes Element
{ await clickCell('Fe'); await page.evaluate(() => { const b = [...document.querySelectorAll('#card .acts button')].find((x) => x.textContent.includes('Co')); b?.click(); }); await step(1); const t = await cardTitle(); check(`Blättern: Fe → Co („${t}“)`, t === 'Cobalt (Co)'); await closeCard(); }

// (3) Exponate und Porträts per Mausklick
const tapObject = async (label, from = null) => {
  const info = await page.evaluate((label) => { let f = null; window.__lib.world.rooms.chemie.group.traverse((o) => { if (!f && o.userData.tap && (o.userData.tap.label === label)) f = o; }); return f ? { station: f.userData.tap.station || null } : null; }, label);
  if (!info) return { err: 'nicht gefunden' };
  const st = from || info.station; if (st && !(await goto(st))) return { err: 'Station nicht erreicht' };
  const pt = await page.evaluate((label) => {
    const L = window.__lib; let obj = null; L.world.rooms.chemie.group.traverse((o) => { if (!obj && o.userData.tap && o.userData.tap.label === label) obj = o; });
    const box = new L.THREE.Box3().setFromObject(obj), c = document.getElementById('gl').getBoundingClientRect(); const pts = [];
    for (let i = 0; i <= 6; i++) for (let j = 0; j <= 6; j++) for (let k = 0; k <= 2; k++) pts.push(new L.THREE.Vector3(box.min.x + (box.max.x - box.min.x) * i / 6, box.min.y + (box.max.y - box.min.y) * j / 6, box.min.z + (box.max.z - box.min.z) * k / 2));
    const scr = pts.map((p) => p.project(L.camera)).filter((v) => Math.abs(v.x) < 0.95 && Math.abs(v.y) < 0.8 && v.z < 1);
    scr.sort((a, b) => Math.hypot(a.x, a.y) - Math.hypot(b.x, b.y));
    // Nur Punkte, an denen auch alle Nachbarpixel (±4 px) das Ziel treffen: ein Fingertipp trifft nie auf den Pixel genau
    const at = (px, py) => { const h = L.world.pick(((px - c.left) / c.width) * 2 - 1, -(((py - c.top) / c.height) * 2 - 1)); return h && h.tap.label === label; };
    for (const v of scr) { const px = Math.round((v.x + 1) / 2 * c.width + c.left), py = Math.round((1 - v.y) / 2 * c.height + c.top); if ([[0, 0], [4, 0], [-4, 0], [0, 4], [0, -4]].every(([dx, dy]) => at(px + dx, py + dy))) return [px, py]; }
    return null;
  }, label);
  if (!pt) return { err: 'von der Station nicht antippbar' };
  await page.mouse.click(pt[0], pt[1]); await step(1); if (from && info.station !== from) { await step(60); await page.waitForTimeout(500); } return { title: await cardTitle() };
};
const EXH = [['Labortisch', 'Der Labortisch'], ['Glasgeräte', 'Glasgeräte im Labor'], ['Reagenzglasständer', 'Reagenzgläser mit Lösungen'], ['Bunsenbrenner', 'Der Bunsenbrenner'], ['Destillationsapparatur', 'Destillation mit dem Liebig-Kühler'],
  ['Kochsalz-Gitter (NaCl)', 'Das Kochsalz-Gitter'], ['Kupfersulfat-Kristall', 'Kupfersulfat-Kristall'], ['Natron', 'Natron und Salz'], ['Atommodell (Natrium)', 'Atommodell: Natrium'], ['Balkenwaage', 'Die Waage: Nichts geht verloren'], ['Kupferrohre', 'Kupferrohre'],
  ['Marie Curie', 'Marie Curie'], ['Dorothy Hodgkin', 'Dorothy Hodgkin'], ['Dmitri Mendelejew', 'Dmitri Mendelejew', 'chemie-eingang'], ['Antoine Lavoisier', 'Antoine Lavoisier'], ['Justus von Liebig', 'Justus von Liebig'], ['Robert Bunsen', 'Robert Bunsen']];
for (const [label, title, from] of EXH) {
  const r = await tapObject(label, from); check(`Exponat „${label}“ → Karte „${r.title ?? r.err}“`, r.title === title); if (r.title) { if (['Der Bunsenbrenner', 'Destillation mit dem Liebig-Kühler', 'Das Kochsalz-Gitter', 'Atommodell: Natrium', 'Natron und Salz'].includes(r.title)) await page.screenshot({ path: out('chemie-card-' + label.replace(/[^A-Za-z]/g, '') + '.png') }); await closeCard(); }
}
// Natron: Querverweis aufs Ägypten-Buch
{ await tapObject('Natron'); const has = await page.evaluate(() => [...document.querySelectorAll('#card .acts button')].some((b) => b.textContent.includes('Ägypten'))); check('Natron-Karte hat Button zum Ägypten-Buch', has);
  await page.evaluate(() => [...document.querySelectorAll('#card .acts button')].find((b) => b.textContent.includes('Ägypten'))?.click()); await step(1); const t = await cardTitle(); check(`Button öffnet Buchkarte („${t}“)`, !!t && t.includes('Ägypten')); await closeCard(); }
// Bücher im Regal: Bald-Bücher (Karte)
{ const r = await page.evaluate(() => { let f = null; window.__lib.world.rooms.chemie.group.traverse((o) => { if (!f && o.userData.tap?.kind === 'book') f = o; }); return f ? f.userData.tap.book.title : null; }); check(`Bald-Buch im Regal vorhanden („${r}“)`, !!r); }

// (4) aus der Ferne antippen fährt zur Station
await goto('chemie-eingang');
{ const pt = await page.evaluate(() => { const L = window.__lib, b = L.world.rooms.chemie.group.getObjectByName('periodensystem'); const v = b.localToWorld(new L.THREE.Vector3(0.3, 0.2, 0)).project(L.camera), c = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * c.width + c.left, (1 - v.y) / 2 * c.height + c.top]; });
  await page.mouse.click(pt[0], pt[1]); await step(2);
  check('Tippen aufs Periodensystem aus der Ferne fährt hin (noch keine Karte)', (await page.evaluate(() => window.__lib.rig.moving)) && (await cardTitle()) === null);
  await step(100); check('… und kommt am Periodensystem an', await page.evaluate(() => window.__lib.rig.cur === 'chemie-periodensystem')); }

// (5) Stationenliste und Konsole
const sts = await page.evaluate(() => window.__lib.rig.roomStations('chemie').map((s) => s.id));
check(`Stationen (${sts.length}): ${sts.join(', ')}`, sts.length >= 8 && sts[0] === 'chemie-eingang' && sts.at(-1) === 'chemie-tuer');
const errs = logs.filter((l) => /error|pageerror|warn/i.test(l) && !/permissions policy|Failed to load resource|ERR_/.test(l)); check('Keine Konsolenfehler oder -warnungen', errs.length === 0, errs.slice(0, 5).join('\n'));
console.log(ok ? 'ALLES OK' : 'FEHLER'); await browser.close(); process.exit(ok ? 0 : 1);
