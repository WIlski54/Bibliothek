// Rückfall der Katze: ?cat=paper startet die Papierkatze, ?cat=fail simuliert ein nicht ladbares 3D-Modell (dann springt die Papierkatze ein).
// Aufruf: BOOK_HTML=... OUT_DIR=... node tools/test-cat-fallback.mjs
import { open, ready, out } from './harness.mjs';
let ok = true; const check = (name, cond, extra = '') => { console.log(cond ? 'OK  ' : 'FAIL', name, extra); if (!cond) ok = false; };
for (const mode of ['paper', 'fail']) {
  const { browser, page, logs } = await open({ w: 800, h: 500, query: `?q=low&quiet=1&manual=1&cat=${mode}` });
  page.setDefaultTimeout(240000);
  await ready(page, 180000);
  await page.evaluate(() => { document.getElementById('go').click(); });
  await page.waitForTimeout(1200);
  await page.evaluate(() => { window.__lib.step(0.1, 8); });
  const st = await page.evaluate(() => { const c = window.__lib.world.cat, a = c.cat; return { cls: a.constructor.name, pose: a.pose, mode: a.mode, kids: c.group.children.length, tap: c.group.userData.tap?.kind, vis: c.group.visible }; });
  check(`?cat=${mode}: Papierkatze läuft`, st.cls === 'Archimedes' && st.mode === 'sleep' && st.tap === 'cat' && st.vis, JSON.stringify(st));
  // Tippen und Rundgang funktionieren auch im Rückfall
  await page.evaluate(() => { window.__lib.world.cat.poke(); window.__lib.step(0.1, 8); });
  const b = await page.evaluate(() => ({ hidden: document.getElementById('bubble').hidden, text: document.getElementById('bubble-text').textContent }));
  check(`?cat=${mode}: Antippen: Sprechblase`, !b.hidden && b.text.length > 5, b.text.slice(0, 40));
  await page.evaluate(() => { window.__lib.goStation('geschichte-eingang'); let n = 0; while (n++ < 140) { window.__lib.step(0.1, 1); if (!window.__lib.rig.moving) break; } window.__lib.step(0.1, 18); });
  const e = await page.evaluate(() => { const a = window.__lib.world.cat.cat; return { mode: a.mode, room: window.__lib.rig.room }; });
  check(`?cat=${mode}: Katze folgt in die Geschichte und sitzt`, e.mode === 'sit' && e.room === 'geschichte', JSON.stringify(e));
  await page.screenshot({ path: out(`cat-fallback-${mode}.png`) });
  const errs = logs.filter((l) => /error|pageerror/i.test(l) && !/permissions policy|Failed to load resource|ERR_|KHR_parallel|cat=fail/i.test(l));
  check(`?cat=${mode}: keine Konsolenfehler`, errs.length === 0, errs.slice(0, 3).join('\n'));
  await browser.close();
}
console.log(ok ? 'ALLES OK' : 'FEHLER'); process.exit(ok ? 0 : 1);
