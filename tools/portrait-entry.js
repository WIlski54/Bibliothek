// Einstieg für tools/portrait-sheet.mjs: zeichnet die Porträts auf Canvas (ohne 3D) und liefert Zeiten.
import { PERSONS, PERSON_IDS } from '../src/data/persons.js';
import { drawPortrait, PORTRAIT_W, PORTRAIT_H } from '../src/art/portrait/index.js';

function draw(id, w = PORTRAIT_W, h = PORTRAIT_H) {
  const c = document.createElement('canvas'); c.width = w; c.height = h;
  const t0 = performance.now(); drawPortrait(c, PERSONS[id]); c.getContext('2d').getImageData(0, 0, 1, 1); /* erzwingt das Rastern */ return { canvas: c, ms: performance.now() - t0 };
}
window.__portraits = {
  ids: PERSON_IDS,
  one(id) { const r = draw(id); return { ms: r.ms, url: r.canvas.toDataURL('image/png') }; },
  // Kontaktbogen: cols x rows, jede Zelle cw x ch
  sheet(ids, cols, cw, ch) {
    ids = ids && ids.length ? ids : PERSON_IDS; const rows = Math.ceil(ids.length / cols);
    const S = document.createElement('canvas'); S.width = cols * cw; S.height = rows * ch; const g = S.getContext('2d'); g.fillStyle = '#2a1d14'; g.fillRect(0, 0, S.width, S.height);
    const times = {};
    ids.forEach((id, i) => { const r = draw(id); times[id] = +r.ms.toFixed(1); g.drawImage(r.canvas, (i % cols) * cw, Math.floor(i / cols) * ch, cw, ch); });
    return { url: S.toDataURL('image/png'), times };
  },
};
window.__bookReady = true;
window.__time = (id, flags) => { Object.assign(globalThis, flags); const a = []; for (let i = 0; i < 4; i++) a.push(draw(id).ms); return a.map((x) => +x.toFixed(1)); };
window.__prof = (id) => { globalThis.__PROF = {}; draw(id); const a = globalThis.__PROF; globalThis.__PROF = null; return Object.entries(a).map(([k, v]) => `${k} ${v.toFixed(1)}`).join(', '); };
window.__size = (id, w, h) => { const r = draw(id, w, h); return { ms: r.ms, url: r.canvas.toDataURL('image/png') }; };
