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
// Zeiten: jedes Porträt mehrfach (Rastern wird mit getImageData erzwungen), erster Aufruf der Seite ist wegen der Browser-Aufwärmung nicht aussagekräftig
const all = await page.evaluate(() => window.__portraits.ids);
const FULL = !!process.env.FULL, RUNS = +(process.env.RUNS || 5), times = {};
await page.evaluate(() => window.__portraits.one(window.__portraits.ids[0]));
for (const id of (ids.length ? ids : all)) {
  const t = await page.evaluate(([id, full, runs]) => { const a = []; let url = null; for (let i = 0; i < runs; i++) { const r = window.__portraits.one(id); a.push(r.ms); url = r.url; } a.sort((x, y) => x - y); return { min: a[0], med: a[a.length >> 1], url: full ? url : null }; }, [id, FULL, RUNS]);
  times[id] = t; if (t.url) save(t.url, out(`portraet-${id}.png`));
}
const med = Object.values(times).map((t) => t.med), mn = Object.values(times).map((t) => t.min);
console.log('Zeiten je Porträt in ms (Median von ' + RUNS + ', Minimum):', Object.entries(times).map(([k, v]) => `${k} ${v.med.toFixed(0)}/${v.min.toFixed(0)}`).join('  '));
console.log(`Mittel der Mediane ${(med.reduce((a, b) => a + b, 0) / med.length).toFixed(1)} ms, größter Median ${Math.max(...med).toFixed(1)} ms, größtes Minimum ${Math.max(...mn).toFixed(1)} ms`);
const errs = logs.filter((l) => /error|warn/i.test(l)); if (errs.length) console.log(errs.slice(0, 20).join('\n'));
await browser.close();
