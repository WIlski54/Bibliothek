// Kontaktbogen-Skript: node tools/cat-sheet.mjs <script.js>   (BOOK_HTML = Bündel von tools/cat-sheet-entry.js)
import { open, ready, out } from './harness.mjs';
import fs from 'node:fs';
const W = +(process.env.W || 1400), H = +(process.env.H || 800);
const { browser, page, logs } = await open({ w: W, h: H, query: `?w=${W}&h=${H}` });
await ready(page, 120000);
const code = fs.readFileSync(process.argv[2], 'utf8');
await page.evaluate(code);
await page.waitForTimeout(100);
await page.screenshot({ path: out(process.env.NAME || 'sheet.png') });
console.log(logs.filter((l) => !/permissions policy/i.test(l)).join('\n'));
await browser.close();
