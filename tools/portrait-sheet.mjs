// Kontaktbogen der Porträts: node tools/portrait-sheet.mjs [id ...]
//   Umgebung: OUT_DIR (Standard test-out), COLS (6), CW/CH (Zellgröße, 300x400), FULL=1 (zusätzlich jedes Porträt in voller Größe als PNG)
//   Baut ein Mini-Bündel (tools/portrait-entry.js), öffnet es im Headless-Chromium und rendert alle 18 Porträts.
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { open, ready, out } from './harness.mjs';
const dir = process.env.OUT_DIR || 'test-out'; fs.mkdirSync(dir, { recursive: true });
const html = path.resolve(dir, 'portraits-mini.html');
execFileSync('node', ['build.mjs', '--dev', '--entry=tools/portrait-entry.js', `--out=${html}`], { stdio: 'inherit' });
const { browser, page, logs } = await open({ w: 800, h: 600, url: 'file://' + html });
await ready(page, 60000);
const ids = process.argv.slice(2);
const cols = +(process.env.COLS || 6), cw = +(process.env.CW || 300), ch = +(process.env.CH || 400);
const save = (url, file) => fs.writeFileSync(file, Buffer.from(url.split(',')[1], 'base64'));
const r = await page.evaluate(([ids, cols, cw, ch]) => window.__portraits.sheet(ids, cols, cw, ch), [ids, cols, cw, ch]);
save(r.url, out('kontaktbogen.png')); console.log('Kontaktbogen:', out('kontaktbogen.png'));
// Zeiten: jedes Porträt einzeln, erst kalt (erster Aufruf), dann warm
const all = await page.evaluate(() => window.__portraits.ids);
const FULL = !!process.env.FULL, times = {};
for (const id of (ids.length ? ids : all)) {
  const t = await page.evaluate(([id, full]) => { const a = window.__portraits.one(id); const b = window.__portraits.one(id); return { cold: a.ms, warm: b.ms, url: full ? b.url : null }; }, [id, FULL]);
  times[id] = t; if (t.url) save(t.url, out(`portraet-${id}.png`));
}
const ms = Object.values(times).map((t) => t.warm); console.log('Zeiten (ms, warm):', Object.entries(times).map(([k, v]) => `${k} ${v.warm.toFixed(0)}`).join('  '));
console.log(`Mittel ${(ms.reduce((a, b) => a + b, 0) / ms.length).toFixed(1)} ms, Max ${Math.max(...ms).toFixed(1)} ms`);
const errs = logs.filter((l) => /error|warn/i.test(l)); if (errs.length) console.log(errs.slice(0, 20).join('\n'));
await browser.close();
