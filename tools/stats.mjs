// Zeichenaufrufe, Dreiecke, Texturen je Station: node tools/stats.mjs [station ...]
import { open, ready } from './harness.mjs';
const { browser, page } = await open({ w: 800, h: 500, query: '?q=low&quiet=1&manual=1' });
await ready(page, 120000);
const ids = process.argv.slice(2);
const res = await page.evaluate((ids) => {
  const L = window.__lib, out = []; const list = ids.length ? ids : [...L.rig.stations.keys()];
  for (const id of list) { L.rig.jump(id); L.world.setWant(L.world.chooseRoom(), true); L.renderer.info.reset(); L.world.update(0.3); L.renderer.render(L.scene, L.camera); const r = L.renderer.info.render; out.push(`${id.padEnd(24)} calls ${String(r.calls).padStart(4)}  tris ${String(r.triangles).padStart(7)}`); }
  const m = L.renderer.info.memory; out.push(`Speicher: Texturen ${m.textures}, Geometrien ${m.geometries}`);
  let px = 0; L.scene.traverse((o) => { const mats = [].concat(o.material || []); for (const mt of mats) for (const k of ['map', 'normalMap', 'roughnessMap', 'emissiveMap']) { const t = mt[k]; if (t?.image && !t.__c) { t.__c = 1; px += (t.image.width || 0) * (t.image.height || 0); } } });
  out.push(`Textur-Pixel (Szene, Karten): ${(px / 1e6).toFixed(1)} MPixel (~${(px * 4 * 1.33 / 1e6).toFixed(0)} MB mit Mipmaps)`);
  return out;
}, ids);
console.log(res.join('\n')); await browser.close();
