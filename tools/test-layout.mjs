// Layout-Test: Intro, HUD, Sprechblase, Karte auf iPad hoch/quer und Handy
import { open, ready, out } from './harness.mjs';
const sizes = { ipadH: [820, 1180], ipadQ: [1180, 820], phone: [390, 844] };
for (const [name, [w, h]] of Object.entries(sizes)) {
  const { browser, page, logs } = await open({ w, h, touch: true, query: '?q=low&manual=1' });
  await ready(page, 120000);
  await page.evaluate(() => window.__lib.step(0.05, 1)); await page.screenshot({ path: out(`layout-${name}-intro.png`) });
  await page.evaluate(() => document.getElementById('go').click()); await page.waitForTimeout(900);
  await page.evaluate(() => { window.__lib.step(0.05, 1); window.__lib.ui.say('Miau! Ich bin Archimedes. Tippe auf eine Tür oder auf die Knöpfe unten.'); });
  await page.screenshot({ path: out(`layout-${name}-hud.png`) });
  await page.evaluate(() => { window.__lib.ui.openCard({ kind: 'book', book: window.__lib.ctx.books[0] }); });
  await page.waitForTimeout(400); await page.screenshot({ path: out(`layout-${name}-card.png`) });
  const errs = logs.filter((l) => /pageerror|error/i.test(l) && !/permissions policy/.test(l)); if (errs.length) console.log(name, errs.slice(0, 5).join('\n'));
  await browser.close(); console.log('ok', name);
}
