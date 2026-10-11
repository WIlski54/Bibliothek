// Kontaktbogen der Clips der 3D-Katze, gerendert aus Three.js (Browser) im Foyer-Licht: je Clip vier Zeitpunkte, damit man die Animationen prüfen kann.
// Aufruf: BOOK_HTML=... OUT_DIR=... node tools/cat3d-sheet.mjs [clip ...]
//   Umgebung: TIMES=0,0.25,0.5,0.75 (Anteile der Clip-Dauer), CELL=300 (Pixel), VIEW=q3|front|side (Blickwinkel), PER=5 (Clips je Bild), PLACE=x,z (Weltposition)
// Ergebnis: $OUT_DIR/cat3d-sheet-<n>.png
import { open, ready, out } from './harness.mjs';
import fs from 'node:fs';
const cell = +(process.env.CELL || 300), times = (process.env.TIMES || '0,0.25,0.5,0.75').split(',').map(Number), per = +(process.env.PER || 5);
const view = process.env.VIEW || 'q3', place = (process.env.PLACE || '0.6,1.4').split(',').map(Number);
const { browser, page, logs } = await open({ w: 900, h: 560, query: '?q=mid&quiet=1&manual=1' });
page.setDefaultTimeout(240000);
await ready(page, 180000);
await page.evaluate(() => { document.getElementById('intro').hidden = true; document.getElementById('hud').hidden = false; });
await page.waitForFunction(() => window.__lib?.world?.cat?.cat?.ready === true, null, { timeout: 60000 });
const all = await page.evaluate(() => window.__lib.world.cat.cat.clipNames());
const clips = process.argv.slice(2).length ? process.argv.slice(2) : ['sit_idle', 'sit_calm', 'blink', 'talk', 'meow', 'scared', 'groom', 'stretch', 'walk', 'trot', 'run', 'jump_up', 'jump_down', 'sleep_idle', 'wake'].filter((c) => all.includes(c));
const sheets = [];
for (let i = 0; i < clips.length; i += per) sheets.push(clips.slice(i, i + per));
let n = 0;
for (const group of sheets) {
  const url = await page.evaluate(({ group, times, cell, view, place }) => {
    const L = window.__lib, cat = L.world.cat.cat, THREE = L.THREE;
    L.rig.jump('foyer-eingang'); L.world.setWant('foyer', true); L.world.update(0.5);
    cat.mode = 'sit'; cat.group.visible = true;
    cat.pos.set(place[0], 0, place[1]); cat.ground = 0; cat.lift = 0; cat.travel = null;
    for (const z of cat.zs) z.visible = false; cat.pop.visible = false; cat.shadow.material.opacity = 0.9;
    const cv = document.createElement('canvas'); cv.width = cell * times.length; cv.height = cell * group.length; const g = cv.getContext('2d');
    const r = L.renderer, size = r.getSize(new THREE.Vector2()), pr = r.getPixelRatio();
    r.setPixelRatio(1); r.setSize(cell, cell, false);
    const cam = new THREE.PerspectiveCamera(36, 1, 0.05, 40);
    const views = { q3: [0.75, 0.2, 1.35], front: [0, 0.2, 1.4], side: [1.4, 0.2, 0.0] };
    const [vx, vy, vz] = views[view] || views.q3;
    group.forEach((name, row) => {
      times.forEach((tf, col) => {
        cat.bodyYaw = 0; cat.yaw = Math.atan2(vx, vz) * 0 + 0;
        cat.showClip(name, tf * (cat.act[name].getClip().duration - 0.001));
        cat.group.position.set(place[0], 0, place[1]); cat.model.rotation.y = 0;
        const base = new THREE.Vector3(place[0], 0, place[1]);
        const walking = ['walk', 'trot', 'run', 'jump_up', 'jump_down', 'stretch'].includes(name);
        const vv = walking ? [1.2, 0.25, 0.9] : [vx, vy, vz];
        cam.position.set(base.x + vv[0], vy + (walking ? 0 : 0.12), base.z + vv[2]); cam.lookAt(base.x, name === 'sleep_idle' ? 0.1 : 0.2, base.z);
        cat.sh.position.set(0, 0, 0);
        L.scene.updateMatrixWorld(true);
        r.render(L.scene, cam);
        g.drawImage(r.domElement, col * cell, row * cell, cell, cell);
        g.fillStyle = 'rgba(0,0,0,.55)'; g.fillRect(col * cell, row * cell, cell, 18); g.fillStyle = '#fff'; g.font = '13px sans-serif'; g.fillText(`${name}  ${tf.toFixed(2)}`, col * cell + 4, row * cell + 13);
      });
    });
    r.setPixelRatio(pr); r.setSize(size.x, size.y, false);
    return cv.toDataURL('image/png');
  }, { group, times, cell, view, place });
  const f = out(`cat3d-sheet-${n++}.png`); fs.writeFileSync(f, Buffer.from(url.split(',')[1], 'base64')); console.log('Bogen', f, group.join(', '));
}
const errs = logs.filter((l) => /error|warn/i.test(l) && !/permissions policy|KHR_parallel/i.test(l)); if (errs.length) console.log(errs.slice(0, 10).join('\n'));
await browser.close();
