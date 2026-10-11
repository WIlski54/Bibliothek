// Porträt-Test in der vollen Bibliothek: findet alle Porträt-Rahmen (userData.personId) in den Räumen, prüft Zwischenspeicher,
// Zeichenzeit, Antippen (Karte geht auf, Bild ist ein Canvas, Text da). Wenn kein Raum Porträts aufhängt, wird das gemeldet (kein Fehler).
// Aufruf: BOOK_HTML=<bündel.html> node tools/test-portraits.mjs
import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 1100, h: 700, query: '?q=low&quiet=1&manual=1' });
await ready(page, 120000);
await page.evaluate(() => { document.getElementById('go')?.click(); });
await page.waitForTimeout(800);
let ok = true; const check = (name, cond, extra = '') => { console.log(cond ? 'OK  ' : 'FAIL', name, extra); if (!cond) ok = false; };
const step = (n, dt = 0.1) => page.evaluate(([n, dt]) => { window.__lib.step(dt, n); }, [n, dt]);
const frames = await page.evaluate(() => { const L = window.__lib, list = []; for (const [rid, room] of Object.entries(L.world.rooms)) room.group.traverse((o) => { if (o.userData.personId && o.userData.tap) { const v = new L.THREE.Vector3(); o.getWorldPosition(v); list.push({ room: rid, id: o.userData.personId, pos: [v.x, v.y, v.z] }); } }); return list; });
if (!frames.length) { console.log('Keine Porträt-Rahmen in den Räumen gefunden (Räume hängen noch keine auf): Test übersprungen.'); await browser.close(); process.exit(0); }
console.log(`${frames.length} Porträt-Rahmen: ${frames.map((f) => f.id).join(', ')}`);
// 1) Karte und Bild je Person: Antippen, Zeichenzeit (kalt und danach zwischengespeichert)
const times = [];
for (const f of frames) {
  const r = await page.evaluate((id) => {
    const L = window.__lib; let frame = null; for (const room of Object.values(L.world.rooms)) room.group.traverse((o) => { if (o.userData.personId === id && !frame) frame = o; });
    const tap = frame.userData.tap, t0 = performance.now(); const img = tap.image; const t1 = performance.now(); const img2 = tap.image;
    return { cold: t1 - t0, same: img === img2, isCanvas: img instanceof HTMLCanvasElement, w: img.width, h: img.height, title: tap.title, paras: tap.paras.length, fact: !!tap.fact, kind: tap.kind };
  }, f.id);
  times.push(r.cold);
  check(`${f.id}: Karte (${r.title})`, r.kind === 'info' && r.isCanvas && r.same && r.w <= 600 && r.h <= 800 && r.paras >= 2 && r.fact, `Bild ${r.w}x${r.h}, ${r.cold.toFixed(1)} ms`);
}
console.log(`Zeichenzeit je Porträt (ms): Mittel ${(times.reduce((a, b) => a + b, 0) / times.length).toFixed(1)}, Max ${Math.max(...times).toFixed(1)}`);
// 2) Zwischenspeicher: zweiter Rahmen derselben Person teilt Textur
const shared = await page.evaluate((id) => { const L = window.__lib; const a = []; for (const room of Object.values(L.world.rooms)) room.group.traverse((o) => { if (o.userData.personId === id && o.userData.pic) a.push(o.userData.pic.material.map); }); return a.length < 2 ? null : a[0] === a[1]; }, frames[0].id);
if (shared !== null) check('mehrere Rahmen derselben Person teilen die Textur', shared);
// 3) Antippen im Raum: Station anfahren, Rahmen antippen, Karte geht auf
const f0 = frames[0];
await page.evaluate((room) => { const L = window.__lib; L.rig.jump(`${room}-regal-${(L.world.rooms[room].stations.find((s) => s.wall) || {}).wall || 'W'}`); L.world.setWant(L.world.chooseRoom(), true); L.world.update(0.5); L.rig.update(0.016); }, f0.room);
await step(3);
const proj = (x, y, z) => page.evaluate(([x, y, z]) => { const L = window.__lib; const v = new L.THREE.Vector3(x, y, z).project(L.camera); const r = document.getElementById('gl').getBoundingClientRect(); return [(v.x + 1) / 2 * r.width + r.left, (1 - v.y) / 2 * r.height + r.top, v.z]; }, [x, y, z]);
let tapped = false;
for (const f of frames.filter((q) => q.room === f0.room)) {
  const [x, y, z] = await proj(...f.pos); if (z > 1 || x < 20 || y < 20 || x > 1080 || y > 680) continue;
  await page.mouse.click(x, y); await step(2);
  tapped = await page.evaluate(() => !document.getElementById('card').hidden);
  if (tapped) { const title = await page.evaluate(() => document.querySelector('#card h2')?.textContent); check(`Antippen öffnet Karte (${f.id})`, title && title.length > 2, title); await page.screenshot({ path: out('portraet-karte.png') }); await page.keyboard.press('Escape'); break; }
}
if (!tapped) check('Antippen öffnet Karte', false, 'kein Rahmen im Bild getroffen');
const errs = logs.filter((l) => /error|pageerror/i.test(l) && !/Failed to load resource|ERR_/.test(l)); if (errs.length) { console.log(errs.slice(0, 10).join('\n')); ok = false; }
console.log(ok ? 'ALLES OK' : 'FEHLER'); await browser.close(); process.exit(ok ? 0 : 1);
