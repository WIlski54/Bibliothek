// Screenshots von Stationen: node tools/shots.mjs [station-id ...]  (BOOK_HTML, OUT_DIR, W, H, Q als Umgebungsvariablen)
import { open, ready, out } from './harness.mjs';
const ids = process.argv.slice(2);
const W = +(process.env.W || 1024), H = +(process.env.H || 640);
const { browser, page, logs } = await open({ w: W, h: H, query: `?q=${process.env.Q || 'mid'}&quiet=1` });
await ready(page, 120000);
await page.evaluate(() => { document.getElementById('intro').hidden = true; document.getElementById('hud').hidden = false; });
const list = ids.length ? ids : await page.evaluate(() => [...window.__lib.rig.stations.keys()]);
for (const id of list) {
  const [yaw, pitch] = (process.env.LOOK || '0,0').split(',').map(Number);
  await page.evaluate(([id, yaw, pitch]) => { const L = window.__lib; L.rig.jump(id); L.rig.yaw = L.rig.yawT = yaw; L.rig.pitch = L.rig.pitchT = pitch; L.world.setWant(L.world.chooseRoom(), true); L.world.update(0.5); L.rig.update(0.016); L.renderer.render(L.scene, L.camera); }, [id, yaw, pitch]);
  await page.waitForTimeout(150);
  await page.screenshot({ path: out(`${id}.png`) });
  console.log('shot', id);
}
const errs = logs.filter((l) => /error|warn/i.test(l)); if (errs.length) console.log(errs.slice(0, 20).join('\n'));
await browser.close();
