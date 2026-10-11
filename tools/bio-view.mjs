// node tools/bio-view.mjs <objekt> "x,y,z>tx,ty,tz[@fov][#rot]" ...   Fotos nach $OUT_DIR/v-<objekt>-<n>.png (Viewer: tools/bio-viewer.js)
import { open, ready, out } from './harness.mjs';
const [name, ...cams] = process.argv.slice(2);
const { browser, page, logs } = await open({ w: +(process.env.VW || 900), h: +(process.env.VH || 560), query: "" });
await ready(page, 60000);
await page.evaluate((n) => window.__v.show(n), name);
let i = 0;
for (const c of cams) {
  const m = c.match(/^([^>]+)>([^@#]+)(?:@([\d.]+))?(?:#([-\d.]+))?(?:\^([-\d.]+))?$/); const pos = m[1].split(',').map(Number), look = m[2].split(',').map(Number), fov = m[3] ? +m[3] : 50, rot = m[4] !== undefined ? +m[4] : undefined, clipY = m[5] !== undefined ? +m[5] : undefined;
  await page.evaluate(([p, l, f, r, cy, VW, VH]) => window.__v.shot(p, l, { fov: f, rot: r, clipY: cy, w: +VW, h: +VH }), [pos, look, fov, rot, clipY, process.env.VW || 900, process.env.VH || 560]);
  await page.screenshot({ path: out(`v-${name}-${i++}.png`), clip: { x: 0, y: 0, width: +(process.env.VW || 900), height: +(process.env.VH || 560) } });
}
const errs = logs.filter((l) => /error|warn/i.test(l)); if (errs.length) console.log(errs.slice(0, 10).join('\n'));
await browser.close(); console.log('ok', i);
