// Kontaktbogen aller Posen von Archimedes (Entwicklungswerkzeug), schreibt $OUT_DIR/cat-poses.png
// Bauen: node build.mjs --dev --entry=tools/cat-pose-entry.js --out=$SCRATCH/pose.html ; BOOK_HTML=$SCRATCH/pose.html OUT_DIR=... node tools/cat-poses.mjs
import { open, ready, out } from './harness.mjs';
const W = 1500, H = 1000;
const { browser, page, logs } = await open({ w: W, h: H, query: `?w=${W}&h=${H}` });
page.setDefaultTimeout(240000);
await ready(page, 180000);
await page.evaluate(() => {
  const T = window.__t, cat = T.cat, V = T.THREE.Vector3;
  const base = () => { cat.pos.set(0, 0, 0); cat.ground = 0; cat.lift = 0; cat.react = null; cat.travel = null; cat.face = 1; cat.flip = null; cat.testSpeed = undefined; cat.speakT = 0; cat.popT = -1; cat.t.blinkT = -1; cat.t.blink = 99; cat.t.groom = 1e9; cat.t.sleep = 1e9; cat.t.stretch = 1e9; };
  const sit = (fn, n = 3) => ({ setup() { base(); cat.setSit(true); fn?.(); T.step(0.033, n); }, cam: [0, 0.3, 1.45, 0, 0.23, 0] });
  const walk = (speed, phase, extra) => ({ setup() { base(); cat.mode = 'walk'; cat.pose = 'walk'; cat.showPose('walk'); cat.testSpeed = speed; cat.phase = phase; extra?.(); T.step(0.001, 1); }, cam: [0, 0.3, 1.45, 0, 0.2, 0] });
  const list = [
    sit(null, 4), sit(() => { cat.t.blinkT = 0.05; }, 1), sit(() => { cat.mode = 'groom'; cat.modeT = 1.6; }, 2),
    sit(() => { cat.poke(); }, 6), sit(() => { cat.poke(); }, 24), sit(() => { cat.showPop('bulb', 9); cat.popT = 0.6; }, 2),
    { setup() { base(); cat.setSleep(); T.step(0.033, 12); }, cam: [0, 0.2, 1.2, 0, 0.12, 0] },
    { setup() { base(); cat.setSleep(); cat.mode = 'wake'; T.step(0.033, 3); }, cam: [0, 0.2, 1.2, 0, 0.12, 0] },
    walk(0, 0), walk(1.4, 0.1), walk(1.4, 0.35), walk(3.5, 0.15), walk(3.5, 0.4),
    { setup() { base(); cat.pose = 'walk'; cat.showPose('walk'); cat.mode = 'stretch'; cat.modeT = 0.95; cat.testSpeed = 0; T.step(0.001, 1); }, cam: [0, 0.3, 1.45, 0, 0.2, 0] },
  ];
  T.grid(5, 3, list);
});
await page.waitForTimeout(150);
await page.screenshot({ path: out('cat-poses.png') });
console.log(logs.filter((l) => !/permissions policy/i.test(l)).join('\n')); await browser.close();
