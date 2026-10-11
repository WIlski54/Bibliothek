// Gruppe S1 (Landschaft, Pyramiden, Pflanzen) – Baukasten für das Ägypten-Buch.
// Quader-Mauerwerk (Licht von links oben), Dünen, Sandstruktur, Pflanzenbausteine, Palette.
// Alles Meter, y nach oben, Basis y=0. Baut auf dem generischen Kit `_e_kit.js` auf.
import { volume } from '../../../../art/paint.js';
import {
  blob, limb, poly, TAU, rngOf, variantOf, mix, shade, leaf, ribbon, wavy, clipBelow, clipAxis, spline,
  fillPoly, fillPolys, fillGrad, curve, strokes, finish, centerline, along, strand, frond, cluster, beads, profile,
} from './_e_kit.js';

export * from './_e_kit.js';
export { volume };

// ---- Palette (Brief: Sandstein #d9b97a, Lehmziegel #b9824f, Papyrus #5b9a4b, Nilgrün #3f8f5a, Gold, Lapis, Türkis, Karneol) -----
export const PAL = {
  sand: '#d9b97a', sandLit: '#ecd29a', sandDark: '#b08f58', sandShade: '#a37e4c',
  lime: '#efe0b6', limeLit: '#f8efd2', limeShade: '#c4a470', limeDeep: '#a98456',
  mud: '#b9824f', mudDark: '#8a5c35', mudLit: '#d49b66',
  ink: 'rgba(60,36,16,.5)', inkSoft: 'rgba(60,36,16,.28)', hi: 'rgba(255,246,218,.42)', lo: 'rgba(80,46,18,.30)',
  papyrus: '#5b9a4b', nilgruen: '#3f8f5a', gold: '#e0b040', goldLit: '#fff0b3', goldDark: '#8a5f1c', lapis: '#2a5aa0', tuerkis: '#3bb3a8', karneol: '#c0432e',
};

export const spec = (id, name, parts, anchors, meta, o) => finish({ id, parts, anchors, meta: { name, ...meta } }, o);
export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp01 = (t) => Math.max(0, Math.min(1, t));
export const smooth = (t) => { t = clamp01(t); return t * t * (3 - 2 * t); };

/** Rechteck als Polygon */
export const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];

/** Kurzes Hilfs-Polygon: Linie mit Dicke (Strang) zwischen zwei Punkten */
export function bar(x0, y0, x1, y1, w) {
  return limb([[x0, y0, w], [x1, y1, w]], { per: 2, caps: false });
}

// ------------------------------------------------------------------------------------------------
// Quader-Mauerwerk: füllt die Bounding-Box (Layer begrenzt selbst) mit Reihen unterschiedlich breiter Quader.
// edges = aufsteigende y-Grenzen der Schichten. Jeder Quader: Tonwert, helle Oberkante/linke Kante (Licht links oben),
// dunkle Unterkante/rechte Kante, dunkle Fuge.
export function courseEdges(y0, h, n, taper = 0.3) {
  const w = []; let sum = 0;
  for (let i = 0; i < n; i++) { const t = n === 1 ? 0 : i / (n - 1); const k = 1 - taper * t; w.push(k); sum += k; }
  const out = [y0]; let y = y0;
  for (let i = 0; i < n; i++) { y += (h * w[i]) / sum; out.push(y); }
  return out;
}
export function masonry(c, bb, edges, {
  tones = [PAL.limeLit, PAL.lime, '#f2e6c4', '#e9d8ab'], wMin = 0.5, wMax = 1.0, seed = 1, joint = 'rgba(70,42,18,.55)', hi = 'rgba(255,250,230,.55)', lo = 'rgba(90,55,20,.30)',
  jw = 0.016, bevel = 0.16, speck = 0.0, x0 = bb.x0 - 1, x1 = bb.x1 + 1, wScale = 1,
} = {}) {
  const rng = rngOf(seed, 77);
  for (let j = 0; j < edges.length - 1; j++) {
    const ya = edges[j], yb = edges[j + 1], hh = yb - ya;
    let x = x0 - rng() * wMax * wScale;
    while (x < x1) {
      const w = (wMin + rng() * (wMax - wMin)) * wScale * (0.8 + 0.4 * Math.min(1, hh / 0.3));
      const tone = tones[Math.floor(rng() * tones.length)];
      fillPoly(c, rect(x, ya, x + w, yb), tone);
      const b = Math.min(hh, w) * bevel;
      fillPoly(c, rect(x, yb - b, x + w, yb), hi);                 // helle Oberkante
      fillPoly(c, rect(x, ya, x + b * 0.8, yb), 'rgba(255,250,230,.18)');  // linke Kante
      fillPoly(c, rect(x, ya, x + w, ya + b * 1.1), lo);           // dunkle Unterkante (Schatten unter dem Quader)
      fillPoly(c, rect(x + w - b * 0.7, ya, x + w, yb), 'rgba(90,55,20,.14)');
      if (speck) for (let k = 0; k < speck; k++) fillPoly(c, blob(x + rng() * w, ya + rng() * hh, 0.012 + rng() * 0.02, 0.009 + rng() * 0.012, 0, 6), rng() < 0.5 ? 'rgba(255,250,230,.35)' : 'rgba(90,55,25,.28)');
      fillPoly(c, rect(x - jw / 2, ya, x + jw / 2, yb), joint);   // senkrechte Fuge
      x += w;
    }
    fillPoly(c, rect(x0, ya - jw / 2, x1, ya + jw / 2), joint);     // waagerechte Fuge
  }
}

// ------------------------------------------------------------------------------------------------
// Sand: Körnchen, flache Rippel-Bögen
export function sandSpeckle(c, bb, seed = 1, n = 120, { light = 'rgba(255,245,210,.5)', dark = 'rgba(110,70,28,.32)', rmax = 0.03 } = {}) {
  const rng = rngOf(seed, 15);
  for (let k = 0; k < n; k++) fillPoly(c, blob(bb.x0 + rng() * bb.w, bb.y0 + rng() * bb.h, 0.008 + rng() * rmax, 0.006 + rng() * rmax * 0.5, 0, 6), rng() < 0.5 ? light : dark);
}

// ------------------------------------------------------------------------------------------------
// Dünen: jede Düne ist eine eigene Papierlage (Luvseite sanft links = hell, Leeseite steil rechts = Schatten, scharfer Kamm).
// Rückgabe { layers, topAt(x) } – höhere Dünen liegen hinten, niedrigere davor (Reihenfolge im Array = von hinten nach vorn).
export const DUNE_TONES = {
  warm: { lit: ['#f1dca4', '#e2c485'], shade: 'rgba(132,80,34,.45)', crest: 'rgba(255,247,214,.8)', ripple: 'rgba(130,82,36,.30)' },
  hell: { lit: ['#f6e7bd', '#e9d4a0'], shade: 'rgba(140,92,50,.36)', crest: 'rgba(255,250,228,.85)', ripple: 'rgba(140,92,48,.24)' },
  rot: { lit: ['#e4b77e', '#cf9a5f'], shade: 'rgba(110,56,28,.5)', crest: 'rgba(255,232,190,.7)', ripple: 'rgba(110,56,28,.3)' },
  fern: { lit: ['#eddcb2', '#e4cf9f'], shade: 'rgba(150,108,70,.30)', crest: 'rgba(255,250,232,.7)', ripple: 'rgba(150,108,70,.2)' },
};
export function duneProfile(d, x) {
  const u = (x - d.s) / d.L;
  if (u <= 0 || u >= 1) return 0;
  if (u < d.peak) return d.a * Math.pow(Math.sin((u / d.peak) * Math.PI / 2), 1.35);
  return d.a * Math.pow(Math.cos(((u - d.peak) / (1 - d.peak)) * Math.PI / 2), 1.35);
}
export function duneLayers(x0, x1, { count = 5, amp = 0.5, base = 0, seed = 1, tone = 'warm', floor = -0.05, lenK = 1.0, ampJit = 0.35, n = 44, speck = true, ripples = true, gain = 1, edge = 0, edgeMin = 0.12 } = {}) {
  const T = typeof tone === 'string' ? DUNE_TONES[tone] : tone;
  const rng = rngOf(seed, 211);
  const W = x1 - x0;
  const dunes = [];
  // gleichmäßig verteilte Kammlagen (Startpunkte), Längen ~ 2.2x Abstand => Überlappung
  const step = W / count;
  for (let i = -1; i <= count; i++) {
    const L = step * (1.7 + rng() * 0.9) * lenK;
    const a = amp * (1 - ampJit + ampJit * 2 * rng());
    dunes.push({ s: x0 + i * step + (rng() - 0.5) * step * 0.4 - L * 0.1, L, a, peak: 0.6 + rng() * 0.1, i });
  }
  // höhere hinten (zuerst gezeichnet)
  dunes.sort((p, q) => q.a - p.a);
  // Randabfall: an den Enden sinkt die Höhe auf edgeMin (weiche Übergänge in die Seite)
  const fb = (x) => { if (!edge) return 1; const a = smooth((x - x0) / edge), b = smooth((x1 - x) / edge); return edgeMin + (1 - edgeMin) * a * b; };
  const yAt = (d, x) => (base + duneProfile(d, x)) * fb(x);
  const topAt = (x) => { let m = 0; for (const d of dunes) m = Math.max(m, yAt(d, x)); return m; };
  const layers = dunes.map((d, k) => {
    const pts = [];
    for (let i = 0; i <= n; i++) { const x = d.s + (d.L * i) / n; pts.push([x, yAt(d, x)]); }
    let polyPts = [[d.s, floor]].concat(pts, [[d.s + d.L, floor]]);
    if (edge) polyPts = clipAxis(clipAxis(polyPts, 0, x0, true), 0, x1, false);
    return {
      shapes: [polyPts], fill: { top: T.lit[0], bottom: T.lit[1] },
      deco(c, bb) {
        const xp = d.s + d.peak * d.L, yp = yAt(d, xp);
        // Schattenseite (rechts vom Kamm), Kante fällt diagonal nach rechts unten
        const lee = [[xp, yp + 0.02]];
        for (let i = 0; i <= n; i++) { const x = d.s + (d.L * i) / n; if (x >= xp) lee.push([x, yAt(d, x) + 0.01]); }
        lee.push([d.s + d.L + 0.02, floor - 0.1], [xp + d.L * 0.12, floor - 0.1]);
        fillPoly(c, lee, T.shade);
        // Kammlinie
        const crest = pts.filter(([x]) => x <= xp + 0.0001).map(([x, y]) => [x, y - 0.012]);
        if (crest.length > 2) curve(c, crest, T.crest, Math.max(0.02, d.a * 0.07), { alpha: 1 });
        const r = rngOf(seed + k, 9);
        if (ripples) for (let q = 0; q < 3; q++) {
          const u0 = 0.08 + r() * 0.3, u1 = Math.min(d.peak - 0.03, u0 + 0.14 + r() * 0.22), dy = d.a * (0.22 + q * 0.22 + r() * 0.06);
          const rp = []; for (let u = u0; u <= u1; u += 0.025) { const x = d.s + u * d.L; rp.push([x, yAt(d, x) - dy]); }
          if (rp.length > 2) curve(c, rp, T.ripple, Math.max(0.01, d.a * 0.035), { alpha: 1 });
        }
        if (speck) sandSpeckle(c, bb, seed + k * 7, Math.round(bb.w * bb.h * 12 * gain), { rmax: 0.02 });
      },
    };
  });
  return { layers, topAt, dunes };
}

// ------------------------------------------------------------------------------------------------
// Helfer für Pflanzen: Strang mit leicht welligem Verlauf (gerader Halm mit Neigung)
export function stalk(x, y, ang, L, bend, w0, w1, { n = 14, p = 1.4 } = {}) {
  const cl = centerline(x, y, ang, L, bend, { n, p });
  return { cl, shape: strand(cl, w0, w1, { every: 2 }) };
}
/** Dreieck-Spitze (Blatt/Spelze) – Kurzform */
export const tip = (x, y, a, L, W, fat = 0.4, curveK = 0) => leaf(x, y, a, L, W, { fat, curve: curveK, n: 6 });

/** weiche Schattenbänder unten (Erdung): dunkler Verlauf am Fuß */
export function groundShade(c, bb, h = 0.25, col = 'rgba(60,35,15,.35)') {
  fillGrad(c, rect(bb.x0 - 1, bb.y0 - 1, bb.x1 + 1, bb.y0 + h), 0, bb.y0, 0, bb.y0 + h, [[0, col], [1, 'rgba(60,35,15,0)']]);
}
