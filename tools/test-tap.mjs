// Tap-Test: Tür antippen -> Fahrt; Buch in der Vitrine antippen -> Karte; Karte schließen; Buch öffnen ohne URL -> Hinweis; Buchansicht mit URL
import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 960, h: 600, query: '?q=low&quiet=1&manual=1' });
await ready(page, 120000);
await page.evaluate(() => { document.getElementById('go').click(); });
await page.waitForTimeout(900);
const proj = (x, y, z) => page.evaluate(([x, y, z]) => { const L = window.__lib; const v = new L.THREE.Vector3(x, y, z).project(L.camera); const r = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top]; }, [x, y, z]);
const step = (n, dt = 0.1) => page.evaluate(([n, dt]) => { window.__lib.step(dt, n); }, [n, dt]);
let ok = true; const check = (name, cond) => { console.log(cond ? 'OK  ' : 'FAIL', name); if (!cond) ok = false; };

// 1) Tür Biologie antippen
await step(2);
let [x, y] = await proj(0, 1.5, -6); await page.mouse.click(x, y);
await step(2); check('Tür -> Fahrt gestartet', await page.evaluate(() => window.__lib.rig.moving));
await step(80); check('Ankunft Biologie', await page.evaluate(() => window.__lib.rig.cur === 'biologie-eingang'));
// 2) zurück durch die Tür
await page.evaluate(() => { window.__lib.goStation('biologie-tuer'); }); await step(80);
[x, y] = await proj(0, 1.5, -12.5 + 6);
await page.mouse.click(x, y); await step(80); check('Tür zurück -> Foyer', await page.evaluate(() => window.__lib.rig.cur === 'foyer-tuer-biologie'));
// 3) Buch in der Vitrine
await page.evaluate(() => window.__lib.goStation('foyer-neu')); await step(60);
const bp = await page.evaluate(() => { const L = window.__lib; let p = null; L.world.rooms.foyer.group.traverse((o) => { if (o.userData.tap?.kind === 'book' && !p) { const v = new L.THREE.Vector3(); o.getWorldPosition(v); p = [v.x, v.y + 0.3, v.z]; } }); return p; });
[x, y] = await proj(...bp); await page.mouse.click(x, y); await step(1);
check('Buchkarte offen', await page.evaluate(() => !document.getElementById('card').hidden));
await page.screenshot({ path: out('card-book.png') });
await page.keyboard.press('Escape'); check('Karte schließt mit Esc', await page.evaluate(() => document.getElementById('card').hidden));
// 4) Lageplan tippen -> Karte mit Karte
await page.evaluate(() => window.__lib.goStation('foyer-plan')); await step(60);
[x, y] = await proj(4.75, 1.7 + 0.5, -5.95); await page.mouse.click(x, y); await step(1);
check('Lageplan-Karte offen', await page.evaluate(() => !document.getElementById('card').hidden));
await page.screenshot({ path: out('card-plan.png') });
await page.evaluate(() => document.querySelector('#card .x').click());
// 5) Buchansicht (URL) öffnen und schließen
await page.evaluate(() => window.__lib.ui.openBook(window.__lib.ctx.books[0])); await step(1);
check('Viewer offen', await page.evaluate(() => !document.getElementById('viewer').hidden));
await page.screenshot({ path: out('viewer.png') });
await page.evaluate(() => document.getElementById('v-back').click()); check('Viewer zu', await page.evaluate(() => document.getElementById('viewer').hidden));
// 6) Buch ohne URL
await page.evaluate(() => window.__lib.ui.openBook(window.__lib.ctx.books[1])); await step(1);
await page.screenshot({ path: out('card-nourl.png') });
const errs = logs.filter((l) => /error|pageerror/i.test(l) && !/Failed to load resource|ERR_/.test(l)); if (errs.length) console.log(errs.slice(0, 10).join('\n'));
console.log(ok ? 'ALLES OK' : 'FEHLER'); await browser.close(); process.exit(ok ? 0 : 1);
