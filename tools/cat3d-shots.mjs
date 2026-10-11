// Screenshots der 3D-Katze in den Räumen (Raumlicht): node tools/cat3d-shots.mjs [station ...]
//   Umgebung: BOOK_HTML, OUT_DIR, W, H, Q (Qualität), STATE=sit|sleep|groom|stretch|meow|talk|walk|trot|run (Standard sit),
//   CLOSE=1 Nahaufnahme (Kamera 0.8 m vom Kopf, 3/4 von vorn), CLOSE=front|q3|side|back wählt den Blick, DIST=Abstand in m (Standard 0.85), HEAD=1 zielt auf den Kopf, NAME=Dateipräfix
// Die Katze wird mit __lib.world.cat.place(Station) hingesetzt, der Zustand per Clip gezeigt (showClip), Kamera = Stationsblick (oder Nahaufnahme).
import { open, ready, out } from './harness.mjs';
const ids = process.argv.slice(2);
const W = +(process.env.W || 1024), H = +(process.env.H || 640), state = process.env.STATE || 'sit', close = process.env.CLOSE || '';
const dist = +(process.env.DIST || 0.85), headLook = process.env.HEAD === '1';
const { browser, page, logs } = await open({ w: W, h: H, query: `?q=${process.env.Q || 'mid'}&quiet=1&manual=1` });
page.setDefaultTimeout(240000);
await ready(page, 180000);
await page.evaluate(() => { document.getElementById('intro').hidden = true; document.getElementById('hud').hidden = false; });
await page.waitForFunction(() => window.__lib?.world?.cat?.cat?.ready === true, null, { timeout: 60000 });
const list = ids.length ? ids : ['foyer-eingang', 'geschichte-eingang', 'biologie-eingang', 'chemie-eingang'];
for (const id of list) {
  await page.evaluate(([id, state, close, dist, headLook]) => {
    const L = window.__lib, cat = L.world.cat.cat, THREE = L.THREE;
    L.rig.jump(id); L.world.setWant(L.world.chooseRoom(), true); L.world.update(0.5);
    L.world.cat.place(id); L.step(0.1, 6);
    if (state !== 'sit') {
      const map = { sleep: 'sleep_idle', groom: 'groom', stretch: 'stretch', meow: 'meow', talk: 'talk', walk: 'walk', trot: 'trot', run: 'run', scared: 'scared', wake: 'wake' };
      const clip = map[state] || state; cat.showClip(clip, 0.45 * cat.act[clip].getClip().duration);
      if (state === 'sleep') cat.mode = 'sleep'; cat.pose = state === 'sleep' ? 'sleep' : ['walk', 'trot', 'run', 'stretch'].includes(state) ? 'walk' : 'sit';
      if (['walk', 'trot', 'run'].includes(state)) { cat.bodyYaw = Math.atan2(L.camera.position.x - cat.pos.x, L.camera.position.z - cat.pos.z) + 1.0; }
      cat.model.rotation.y = cat.bodyYaw;
    }
    if (close) {
      const p = cat.pos, v = { front: [0, 0, 1], q3: [0.7, 0, 0.75], side: [1, 0, 0], back: [0.3, 0, -1] }[close] || [0.7, 0, 0.75];
      const dir = new THREE.Vector3(v[0], 0, v[2]).normalize().applyAxisAngle(new THREE.Vector3(0, 1, 0), cat.bodyYaw);
      const cy = state === 'sleep' ? 0.12 : headLook ? 0.34 : 0.3;
      L.camera.position.set(p.x + dir.x * dist, p.y + cy + 0.08, p.z + dir.z * dist); L.camera.lookAt(p.x, p.y + cy, p.z); L.camera.updateMatrixWorld(true);
    }
    L.renderer.render(L.scene, L.camera);
  }, [id, state, close, dist, headLook]);
  await page.waitForTimeout(100);
  await page.screenshot({ path: out(`${process.env.NAME || 'cat3d'}-${state}${close ? '-' + close : ''}-${id}.png`) });
  console.log('Bild', id, state, close);
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/permissions policy|KHR_parallel/i.test(l)); if (errs.length) console.log(errs.slice(0, 10).join('\n'));
await browser.close();
