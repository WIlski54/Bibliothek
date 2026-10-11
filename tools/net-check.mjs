// Netzwerk-Check: Die Bibliothek darf beim Rundgang nichts aus dem Netz laden (nur beim Öffnen eines Buchs) und keine Cookies setzen.
import { open, ready } from './harness.mjs';
import path from 'node:path';
const file = 'file://' + path.resolve(process.env.BOOK_HTML || 'dist/index.html');
const { browser, ctx, page } = await open({ w: 900, h: 560, query: '?q=low&quiet=1&manual=1' });
const reqs = []; page.on('request', (r) => reqs.push(r.url()));
await ready(page, 200000);
await page.evaluate(() => { document.getElementById('go').click(); });
for (const id of ['geschichte-eingang', 'biologie-eingang', 'chemie-eingang', 'foyer-eingang']) { await page.evaluate((id) => { window.__lib.rig.jump(id); window.__lib.step(0.1, 2); }, id); }
await page.evaluate(() => { window.__lib.ui.openCard({ title: 'Test', paras: ['x'] }); });
const external = reqs.filter((u) => !u.startsWith('file:') && !u.startsWith('data:') && !u.startsWith('blob:') && !u.startsWith('about:'));
const cookies = await ctx.cookies(); const ls = await page.evaluate(() => { try { return localStorage.length; } catch (e) { return -1; } });
console.log('Anfragen gesamt', reqs.length, '· extern', external.length, external.slice(0, 5).join(' '), '· Cookies', cookies.length, '· localStorage-Einträge', ls);
console.log(external.length === 0 && cookies.length === 0 ? 'OK: keine externen Anfragen, keine Cookies' : 'FEHLER');
await browser.close(); process.exit(external.length === 0 && cookies.length === 0 ? 0 : 1);
