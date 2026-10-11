// Speichert das Hausherr-Gemälde als PNG (Entwicklungswerkzeug).
// Bauen: node build.mjs --dev --entry=tools/cat-portrait-entry.js --out=$SCRATCH/portrait.html ; BOOK_HTML=$SCRATCH/portrait.html OUT_DIR=... node tools/cat-portrait.mjs
import { open, ready, out } from './harness.mjs';
import fs from 'node:fs';
const { browser, page, logs } = await open({ w: 800, h: 600 });
page.setDefaultTimeout(240000);
await ready(page, 180000);
const url = await page.evaluate(() => window.__png);
fs.writeFileSync(out('portrait.png'), Buffer.from(url.split(',')[1], 'base64'));
console.log(logs.filter((l) => !/permissions policy/i.test(l)).join('\n'));
await browser.close();
