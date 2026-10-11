// Headless-Chromium test harness (software WebGL via SwiftShader)
import { chromium } from 'playwright-core';
import path from 'node:path';
import fs from 'node:fs';
const CHROME = '/opt/pw-browsers/chromium-1194/chrome-linux/chrome';
export async function open({ w = 1280, h = 720, url, touch = false, query = '' } = {}) {
  const browser = await chromium.launch({
    executablePath: CHROME,
    args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist',
      '--autoplay-policy=no-user-gesture-required', '--no-sandbox', '--disable-dev-shm-usage', '--enable-webgl'],
  });
  const ctx = await browser.newContext({ viewport: { width: w, height: h }, hasTouch: touch, deviceScaleFactor: 1 });
  const page = await ctx.newPage();
  const logs = [];
  page.on('console', (m) => logs.push(`[${m.type()}] ${m.text()}`));
  page.on('pageerror', (e) => logs.push(`[pageerror] ${e.message}\n${e.stack || ''}`));
  const target = url || ('file://' + path.resolve(process.env.BOOK_HTML || 'dist/index.html') + query);
  await page.goto(target);
  return { browser, ctx, page, logs };
}
export async function ready(page, timeout = 60000) {
  await page.waitForFunction('window.__bookReady === true', null, { timeout });
}
export function out(name) { const d = process.env.OUT_DIR || 'test-out'; fs.mkdirSync(d, { recursive: true }); return path.join(d, name); }
