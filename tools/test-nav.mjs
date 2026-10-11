// Fahrt-Test: Foyer -> Geschichte -> Biologie (über das Foyer), Zwischenbilder in der Tür. Läuft im Handbetrieb (?manual), damit SwiftShader nicht bremst.
import { open, ready, out } from './harness.mjs';
const { browser, page, logs } = await open({ w: 960, h: 600, query: '?q=low&quiet=1&manual=1' });
await ready(page, 120000);
await page.evaluate(() => { document.getElementById('intro').hidden = true; document.getElementById('hud').hidden = false; });
const run = async (name, id, marks) => {
  await page.evaluate((id) => { window.__lib.goStation(id); }, id);
  const total = await page.evaluate(() => window.__lib.rig.travel?.dur || 0);
  let t = 0, mi = 0, log = [];
  while (true) {
    const st = await page.evaluate(() => { window.__lib.step(0.1); const r = window.__lib.rig; const p = r.camera.position; return { moving: r.moving, x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2), prog: r.travel ? +r.travel.t.toFixed(2) : 1 }; });
    log.push(st);
    if (mi < marks.length && st.prog >= marks[mi]) { await page.screenshot({ path: out(`${name}-${marks[mi]}.png`) }); mi++; }
    if (!st.moving) break; if (++t > 200) break;
  }
  console.log(name, 'dur', total.toFixed(1), 'frames', log.length, 'end', JSON.stringify(log[log.length - 1]), 'minY', Math.min(...log.map((l) => l.y)), 'maxY', Math.max(...log.map((l) => l.y)));
};
await run('a-foyer-geschichte', 'geschichte-eingang', [0.3, 0.5, 0.62, 0.75]);
await run('b-geschichte-biologie', 'biologie-eingang', [0.2, 0.4, 0.6, 0.8]);
await run('c-biologie-foyer', 'foyer-tuer-biologie', [0.5, 0.8]);
const errs = logs.filter((l) => /error|warn|pageerror/i.test(l)); if (errs.length) console.log(errs.slice(0, 20).join('\n'));
await browser.close();
