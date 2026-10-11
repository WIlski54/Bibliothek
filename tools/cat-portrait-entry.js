// Zeigt das Hausherr-Gemälde als Bild (Entwicklungswerkzeug): node build.mjs --dev --entry=tools/cat-portrait-entry.js --out=...
import { portraitCanvas } from '../src/world/ex/cat/portrait.js';
document.getElementById('intro').hidden = true;
const t0 = performance.now(); const c = portraitCanvas(); console.log('portrait ms', Math.round(performance.now() - t0));
window.__png = c.toDataURL('image/png'); window.__bookReady = true;
