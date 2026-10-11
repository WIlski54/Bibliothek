// Gruppe O3 – Hieroglyphen. Echte, einfache Zeichen (Nummern nach Gardiner), jedes als gemalte Papierplatte `glyphe_<name>`.
// Alle Zeichen sind in einer Einheitsbox (x,y in etwa -0.5..0.5, y oben, Blick nach +x) als bemalte Polygone beschrieben und werden
// von `drawGlyph()` in beliebiger Größe gemalt (Platte, Kartusche des Rosetta-Steins, Zierbänder).
//   Einkonsonantenzeichen:  eule m (G17) · wasser n (N35) · mund r (D21) · schilfblatt i (M17) · geier a (G1) · fuss b (D58)
//                           kueken w (G43) · korb k (V31) · strick h (V28) · schlange dsch (I10) · loewe l (E23)
//                           matte p (Q3) · brot t (X1) · stoff s (S29)
//   Bild-/Deutzeichen:      sonne ra (N5) · wellen mw (N35 ×3, „Wasser“) · haus pr (O1) · auge ir (D4)
// Platten: opts.frame (Farbe des Rahmens), opts.flip (gespiegelt, Schreibrichtung nach links).
import { P, INK, blob, limb, poly, mk, L, volume, polyline, rrect, rect, ring, speckle, hatch, gloss, fillPoly, strokePoly, curve, line, dot, rngOf, norm, mix } from './_eg_daily_kit.js';

const F = (p, fill, o = {}) => ({ p, fill, ...o });
const LN = (ln, c, w, o = {}) => ({ ln, c, w, ...o });
const DT = (x, y, r, c) => ({ d: [x, y, r], c });
const SH = (ln, c, w, o = {}) => ({ ln, c, w, sharp: true, ...o }); // scharfe Linie

function zig(x0, x1, n, a, y = 0) {
  const pts = [];
  for (let i = 0; i < n; i++) pts.push([x0 + ((x1 - x0) * i) / (n - 1), y + (i % 2 ? a : -a)]);
  return pts;
}

// ------------------------------------------------------------------------------------------------
// Zeichen-Definitionen: () => Liste von Zeichenelementen (Reihenfolge = Malreihenfolge)
export const GLYPHS = {
  // G17 Eule (m): Körper im Profil, Kopf frontal mit zwei Augen, Flügelbänderung, Beine
  eule() {
    const body = poly([[-0.2, -0.3], [-0.31, -0.12], [-0.29, 0.1], [-0.18, 0.2], [0.02, 0.24], [0.2, 0.19], [0.3, 0.02], [0.3, -0.16], [0.21, -0.31]], 2);
    const tail = poly([[-0.18, -0.26], [-0.33, -0.47], [-0.12, -0.5], [0.02, -0.3]], 1);
    const wing = poly([[-0.08, 0.15], [0.2, 0.12], [0.28, -0.08], [0.2, -0.27], [-0.06, -0.2], [-0.12, 0.0]], 2);
    const out = [
      F(tail, '#7a4a28'),
      LN([[0.0, -0.31], [0.0, -0.46]], P.goldD, 0.05, { sharp: true }), LN([[-0.1, -0.31], [-0.1, -0.46]], P.goldD, 0.05),
      LN([[0.0, -0.46], [0.07, -0.47]], P.goldD, 0.04), LN([[-0.1, -0.46], [-0.03, -0.47]], P.goldD, 0.04),
      F(body, '#d9a95a'),
      F(wing, '#8c5a30'),
    ];
    for (let k = 0; k < 4; k++) out.push(LN([[-0.07 + k * 0.01, 0.07 - k * 0.075], [0.22 - k * 0.0, 0.07 - k * 0.075]], '#f1dcae', 0.028));
    out.push(F(poly(blob(0.0, 0.3, 0.28, 0.2, 0, 30), 0), '#c98a45'));
    out.push(F(blob(-0.12, 0.3, 0.12, 0.12, 0, 22), '#f6e7be', { line: null }), F(blob(0.12, 0.3, 0.12, 0.12, 0, 22), '#f6e7be', { line: null }));
    out.push(F(blob(-0.12, 0.31, 0.065, 0.065, 0, 18), P.gold), F(blob(0.12, 0.31, 0.065, 0.065, 0, 18), P.gold));
    out.push(DT(-0.12, 0.31, 0.034, INK), DT(0.12, 0.31, 0.034, INK));
    out.push(F([[-0.045, 0.26], [0.045, 0.26], [0.0, 0.14]], '#3a2a20'));
    return out;
  },
  // N35 Wasser (n): kräftige Zickzacklinie
  wasser() {
    const z = zig(-0.46, 0.46, 7, 0.17);
    return [F(polyline(z, 0.17), P.lapis), SH(z.map(([x, y]) => [x, y + 0.025]), '#7fb0ee', 0.035)];
  },
  // „Wasser“ (mw): drei Zickzacklinien übereinander
  wellen() {
    const out = [];
    for (const dy of [0.3, 0, -0.3]) {
      const z = zig(-0.44, 0.44, 7, 0.085, dy);
      out.push(F(polyline(z, 0.1), P.lapis), SH(z.map(([x, y]) => [x, y + 0.016]), '#7fb0ee', 0.022));
    }
    return out;
  },
  // D21 Mund (r): Lippenoval mit Spalt
  mund() {
    const lens = poly([[-0.42, 0], [-0.2, 0.1], [0.2, 0.1], [0.42, 0], [0.2, -0.1], [-0.2, -0.1]], 2);
    return [
      F(blob(0, 0, 0.47, 0.22, 0, 40), P.karneol),
      F(lens, '#6b1810'),
      LN([[-0.3, 0.14], [0, 0.18], [0.3, 0.14]], '#f08a6a', 0.032),
      LN([[-0.3, -0.14], [0, -0.17], [0.3, -0.14]], '#8c2418', 0.024),
      SH([[-0.18, 0.02], [0.18, 0.02]], '#f6efe0', 0.02, { a: 0.6 }),
    ];
  },
  // M17 Schilfblatt (i): Halm, Blütenwedel oben, abgespreiztes Blatt
  schilfblatt() {
    const plume = poly([[0, 0.02], [-0.11, 0.14], [-0.12, 0.3], [-0.02, 0.5], [0.09, 0.4], [0.12, 0.2]], 2);
    const blade = limb([[0.0, -0.18, 0.14], [0.17, -0.1, 0.15], [0.33, 0.1, 0.12], [0.37, 0.33, 0.015]], { per: 8 });
    const out = [
      F(polyline([[0, -0.48], [0, 0.05]], 0.07), P.nil),
      F(blade, P.papyrus),
      LN([[0.02, -0.17], [0.17, -0.08], [0.31, 0.12]], '#2f6e44', 0.02),
      F(plume, '#6fb35a'),
    ];
    for (let k = 0; k < 5; k++) out.push(SH([[0, 0.05 + k * 0.08], [-0.09 + k * 0.012, 0.15 + k * 0.08]], '#2f6e44', 0.022), SH([[0, 0.05 + k * 0.08], [0.1 - k * 0.012, 0.14 + k * 0.08]], '#2f6e44', 0.022));
    out.push(LN([[0, -0.4], [0, 0.02]], '#8bd08a', 0.016, { a: 0.8 }));
    return out;
  },
  // G1 Ägyptischer Geier (a)
  geier() {
    const body = blob(-0.04, -0.12, 0.34, 0.21, 0.3, 36);
    const tail = poly([[-0.3, -0.12], [-0.5, -0.32], [-0.42, -0.4], [-0.18, -0.28]], 1);
    const neck = limb([[0.14, -0.02, 0.22], [0.25, 0.08, 0.16], [0.28, 0.2, 0.12]], { per: 8 });
    const wing = poly([[-0.32, -0.06], [-0.04, 0.05], [0.15, -0.03], [0.12, -0.17], [-0.2, -0.27], [-0.4, -0.25]], 2);
    const beak = poly([[0.35, 0.3], [0.46, 0.28], [0.5, 0.2], [0.44, 0.22], [0.35, 0.21]], 1);
    const out = [
      LN([[0.0, -0.27], [0.02, -0.48]], P.goldD, 0.05), LN([[0.12, -0.23], [0.14, -0.48]], P.goldD, 0.05),
      LN([[0.02, -0.48], [0.1, -0.49]], P.goldD, 0.035), LN([[0.14, -0.48], [0.22, -0.49]], P.goldD, 0.035),
      F(tail, '#55483c'),
      F(body, '#efe6d2'),
      F(neck, '#efe6d2'),
      F(wing, '#55483c'),
    ];
    for (let k = 0; k < 4; k++) out.push(SH([[-0.36 + k * 0.1, -0.17 - k * 0.012], [-0.28 + k * 0.1, -0.23 - k * 0.012]], '#efe6d2', 0.022));
    for (let k = 0; k < 3; k++) out.push(SH([[0.1 + k * 0.05, 0.06 - k * 0.012], [0.13 + k * 0.05, -0.02 - k * 0.012]], '#cdbf9f', 0.018));
    out.push(F(blob(0.31, 0.27, 0.09, 0.085, 0, 22), '#f2c14e'), F(beak, '#f2c14e'), F([[0.44, 0.22], [0.5, 0.2], [0.46, 0.28]], '#3a2a20', { line: null }));
    out.push(DT(0.33, 0.29, 0.022, INK), DT(0.337, 0.3, 0.008, '#fff'));
    return out;
  },
  // D58 Fuß (b): Unterschenkel und Fuß im Profil
  fuss() {
    const foot = poly([[-0.22, 0.47], [0.0, 0.47], [0.03, 0.12], [0.2, 0.0], [0.38, -0.1], [0.47, -0.22], [0.42, -0.34], [-0.28, -0.34], [-0.34, -0.2], [-0.25, -0.02]], 2);
    return [
      F(foot, P.hautM),
      F(poly([[-0.2, 0.47], [-0.08, 0.47], [-0.1, 0.05], [-0.22, -0.02]], 1), '#c98051', { line: null }),
      LN([[-0.04, 0.1], [0.12, 0.02], [0.3, -0.06]], '#8a4a24', 0.022),
      F(blob(-0.14, -0.12, 0.05, 0.045, 0, 14), '#e0a070', { w: 0.018 }),
      LN([[0.34, -0.28], [0.42, -0.2]], '#f1dcae', 0.03), LN([[-0.2, -0.28], [0.3, -0.29]], '#8a4a24', 0.02),
      LN([[-0.2, 0.43], [0.0, 0.43]], '#7a3e1c', 0.025),
      SH([[0.3, -0.12], [0.31, -0.22]], '#8a4a24', 0.016), SH([[0.37, -0.14], [0.38, -0.25]], '#8a4a24', 0.016),
    ];
  },
  // G43 Wachtelküken (w)
  kueken() {
    const body = blob(-0.04, -0.12, 0.33, 0.23, 0.1, 34);
    const out = [
      LN([[-0.06, -0.3], [-0.04, -0.46]], P.goldD, 0.045), LN([[0.1, -0.3], [0.12, -0.46]], P.goldD, 0.045),
      LN([[-0.04, -0.46], [0.04, -0.47]], P.goldD, 0.03), LN([[0.12, -0.46], [0.2, -0.47]], P.goldD, 0.03),
      F(poly([[-0.28, -0.06], [-0.46, 0.06], [-0.36, -0.2]], 1), '#8c5a30'),
      F(body, '#d9a042'),
      F(blob(0.06, -0.2, 0.22, 0.11, 0.1, 24), '#f6e7be', { line: null }),
      F(poly([[-0.22, -0.02], [0.08, -0.06], [0.18, -0.22], [-0.12, -0.3]], 2), '#8c5a30'),
      F(blob(0.28, 0.09, 0.115, 0.11, 0, 24), '#d9a042'),
      F([[0.37, 0.12], [0.5, 0.06], [0.37, 0.02]], '#3a2a20'),
      DT(0.3, 0.12, 0.028, INK), DT(0.31, 0.13, 0.009, '#fff'),
      SH([[-0.16, -0.08], [0.0, -0.1]], '#f1dcae', 0.02), SH([[-0.2, -0.16], [-0.06, -0.18]], '#f1dcae', 0.02),
    ];
    return out;
  },
  // V31 Korb mit Henkel (k)
  korb() {
    const bowl = poly([[-0.38, 0.0], [0.38, 0.0], [0.3, -0.3], [0.12, -0.38], [-0.12, -0.38], [-0.3, -0.3]], 2);
    const handle = limb([[-0.26, 0.02, 0.06], [-0.2, 0.28, 0.06], [0, 0.42, 0.06], [0.2, 0.28, 0.06], [0.26, 0.02, 0.06]], { per: 8, caps: false });
    const out = [F(handle, P.goldD), F(bowl, '#e3b866'), F(rrect(-0.42, -0.07, 0.42, 0.06, 0.04), '#c58f46')];
    for (let k = -4; k <= 4; k++) out.push(SH([[k * 0.085 - 0.04, -0.06], [k * 0.07, -0.36]], '#8a5f1c', 0.016, { a: 0.7 }));
    for (let k = 0; k < 3; k++) out.push(LN([[-0.34 + k * 0.03, -0.14 - k * 0.08], [0.34 - k * 0.03, -0.14 - k * 0.08]], '#8a5f1c', 0.016, { a: 0.7 }));
    out.push(LN([[-0.36, -0.01], [0.36, -0.01]], '#f6dc9a', 0.016, { a: 0.8 }));
    return out;
  },
  // V28 Docht aus gedrehtem Flachs (h)
  strick() {
    const loop = ring(0, 0.32, 0.17, 0.08, 28, 1, 1.15);
    const rope = limb([[0.0, 0.2, 0.2], [0.0, 0.0, 0.26], [0.0, -0.2, 0.24], [0.0, -0.34, 0.14]], { per: 8 });
    const out = [F(loop, '#e3b866'), F(rope, '#e3b866')];
    for (let k = 0; k < 7; k++) { const y = 0.2 - k * 0.1; out.push(SH([[-0.12, y - 0.07], [0.12, y + 0.05]], '#8a5f1c', 0.03)); }
    out.push(F(polyline([[-0.04, -0.34], [-0.17, -0.5]], 0.07), '#e3b866'), F(polyline([[0.04, -0.34], [0.17, -0.5]], 0.07), '#e3b866'));
    out.push(LN([[-0.05, 0.18], [-0.05, -0.28]], '#fff0b3', 0.02, { a: 0.7 }));
    return out;
  },
  // I10 Kobra (dsch): aufgerichtet, Körper in Wellen am Boden
  schlange() {
    const body = limb([[-0.5, -0.38, 0.03], [-0.4, -0.34, 0.09], [-0.28, -0.26, 0.13], [-0.14, -0.38, 0.16], [0.02, -0.3, 0.18], [0.16, -0.12, 0.2], [0.2, 0.08, 0.2], [0.2, 0.2, 0.17]], { per: 8 });
    const head = blob(0.27, 0.3, 0.13, 0.095, 0.12, 24);
    const out = [F(body, '#4f8f48'), F(head, '#4f8f48')];
    out.push(LN([[0.27, 0.16], [0.26, 0.0], [0.12, -0.14], [0.0, -0.3], [-0.14, -0.38]], '#e6dca0', 0.05, { a: 0.95 }));
    for (let k = 0; k < 6; k++) { const t = k / 5; out.push(SH([[0.17 + (0.04 - t * 0.02), 0.16 - k * 0.06], [0.28 + (0.0 - t * 0.02), 0.15 - k * 0.062]], '#b8a85a', 0.014)); }
    for (let k = 0; k < 5; k++) out.push(F(poly([[-0.34 + k * 0.1, -0.31 - (k % 2) * 0.08], [-0.3 + k * 0.1, -0.26 - (k % 2) * 0.08], [-0.26 + k * 0.1, -0.31 - (k % 2) * 0.08], [-0.3 + k * 0.1, -0.36 - (k % 2) * 0.08]], 0), '#2f6e44', { line: null, a: 0.6 }));
    out.push(DT(0.31, 0.33, 0.026, INK), DT(0.317, 0.34, 0.009, '#fff'));
    out.push(SH([[0.39, 0.28], [0.47, 0.26], [0.51, 0.3]], P.karneol, 0.018), SH([[0.47, 0.26], [0.51, 0.22]], P.karneol, 0.018));
    return out;
  },
  // N5 Sonnenscheibe (ra)
  sonne() {
    return [
      F(blob(0, 0, 0.44, 0.44, 0, 48), P.gold),
      F(blob(0, 0, 0.32, 0.32, 0, 48), '#ffe38a', { w: 0.018 }),
      F(blob(0, 0, 0.12, 0.12, 0, 24), P.karneol),
      LN([[-0.32, 0.22], [-0.2, 0.34], [-0.04, 0.4]], '#fff8d8', 0.03, { a: 0.9 }),
      SH([[0.0, 0.2], [0.0, 0.2]], '#fff', 0.01),
    ];
  },
  // E23 Liegender Löwe (l)
  loewe() {
    const out = [
      LN([[-0.4, -0.12], [-0.5, 0.0], [-0.46, 0.18], [-0.34, 0.26], [-0.26, 0.18]], '#c98a45', 0.06),
      F(blob(-0.24, 0.17, 0.05, 0.06, 0.4, 12), '#8a5f1c', { w: 0.018 }),
      F(poly([[-0.42, -0.34], [-0.4, -0.04], [-0.2, 0.08], [0.1, 0.06], [0.26, -0.02], [0.3, -0.34]], 2), '#d9a042'),
      F(blob(-0.3, -0.24, 0.13, 0.11, 0, 20), '#c98a45', { w: 0.02 }),
      F(limb([[0.1, -0.26, 0.14], [0.3, -0.3, 0.12], [0.46, -0.31, 0.11]], { per: 6 }), '#d9a042'),
      F(blob(0.46, -0.31, 0.06, 0.055, 0, 14), '#e5b25a', { w: 0.02 }),
      F(blob(0.22, 0.12, 0.2, 0.22, 0, 30), '#8a5f1c'),
      F(blob(0.28, 0.14, 0.13, 0.13, 0, 24), '#e5b25a'),
      F(blob(0.36, 0.1, 0.07, 0.055, 0, 14), '#f3dba0', { line: null }),
      F(poly([[0.38, 0.12], [0.44, 0.1], [0.42, 0.06], [0.38, 0.07]], 1), INK, { line: null }),
      F(blob(0.24, 0.27, 0.035, 0.035, 0, 10), '#8a5f1c'),
      DT(0.31, 0.19, 0.022, INK), DT(0.316, 0.2, 0.007, '#fff'),
      SH([[0.37, 0.07], [0.33, 0.04]], '#8a5f1c', 0.014),
    ];
    for (let k = 0; k < 5; k++) out.push(SH([[0.06 + k * 0.03, 0.2 - k * 0.07], [0.1 + k * 0.03, 0.12 - k * 0.07]], '#5e3d1f', 0.018));
    out.push(SH([[0.0, -0.04], [-0.1, -0.12]], '#8a5f1c', 0.018), SH([[-0.08, 0.0], [-0.18, -0.08]], '#8a5f1c', 0.018));
    return out;
  },
  // Q3 Matte/Hocker (p)
  matte() {
    const shape = poly([[-0.45, -0.2], [-0.45, 0.16], [0.45, 0.16], [0.45, -0.2], [0.3, -0.2], [0.3, -0.04], [-0.3, -0.04], [-0.3, -0.2]], 1);
    const out = [F(shape, '#e3b866')];
    for (let k = -7; k <= 7; k++) out.push(SH([[k * 0.06 - 0.04, 0.15], [k * 0.06 + 0.04, -0.03]], '#8a5f1c', 0.016, { a: 0.7 }));
    out.push(LN([[-0.42, 0.12], [0.42, 0.12]], '#f6dc9a', 0.02, { a: 0.9 }));
    return out;
  },
  // X1 Brot (t)
  brot() {
    const loaf = poly([[-0.45, -0.17], [-0.45, -0.06], [-0.36, 0.1], [-0.2, 0.22], [0, 0.26], [0.2, 0.22], [0.36, 0.1], [0.45, -0.06], [0.45, -0.17]], 2);
    return [
      F(loaf, P.brot),
      F(poly([[-0.4, -0.17], [-0.4, -0.08], [-0.3, 0.06], [-0.16, 0.16], [0, 0.2], [0.2, 0.17], [0.4, -0.05], [0.4, -0.17]], 2), '#e0a85a', { line: null }),
      LN([[-0.34, 0.06], [-0.2, 0.17], [-0.05, 0.21]], '#ffe6a8', 0.034, { a: 0.8 }),
      SH([[-0.14, 0.2], [-0.06, 0.0]], '#8a4f1f', 0.02), SH([[0.04, 0.22], [0.1, 0.0]], '#8a4f1f', 0.02), SH([[0.22, 0.18], [0.26, 0.0]], '#8a4f1f', 0.02),
    ];
  },
  // S29 Gefaltetes Tuch (s): Stoffbahn mit umgeschlagener Ecke, Falten und Fransen
  stoff() {
    const cloth = poly([[-0.42, -0.24], [0.4, -0.24], [0.4, 0.22], [-0.2, 0.22], [-0.42, 0.0]], 0);
    const out = [F(cloth, '#f6efe0')];
    out.push(F([[-0.2, 0.22], [-0.42, 0.0], [-0.18, 0.0]], '#d9cdb4'));
    for (let k = 0; k < 5; k++) out.push(SH([[0.4, -0.2 + k * 0.09], [0.5, -0.21 + k * 0.09]], '#bfae8a', 0.028));
    out.push(SH([[-0.14, -0.06], [0.4, -0.06]], '#bfae8a', 0.022), SH([[-0.14, -0.14], [0.4, -0.14]], '#d9cdb4', 0.02), SH([[-0.04, 0.12], [0.34, 0.12]], '#d9cdb4', 0.02));
    out.push(F(rect(0.22, -0.24, 0.4, 0.22), P.lapis, { line: null, a: 0.0 }));
    return out;
  },
  // O1 Haus (pr): Grundriss, Eingang unten
  haus() {
    const frame = [[-0.12, -0.34], [-0.4, -0.34], [-0.4, 0.34], [0.4, 0.34], [0.4, -0.34], [0.12, -0.34]];
    return [
      F(rect(-0.4, -0.34, 0.4, 0.34), '#f3e6c0', { line: null }),
      F(polyline(frame, 0.1), '#c58f46'),
      SH(frame.map(([x, y]) => [x * 0.9, y * 0.9 + (y > 0 ? -0.0 : 0.0)]).slice(1, 5), '#8a5f1c', 0.02, { a: 0.5 }),
      F(rect(-0.2, -0.16, 0.2, 0.18), P.lapis, { line: null, a: 0.0 }),
      LN([[-0.28, 0.25], [0.28, 0.25]], '#f6dc9a', 0.022, { a: 0.9 }),
    ];
  },
  // D4 Auge (ir): Auge mit Lidstrich und Schminkstrich
  auge() {
    const almond = poly([[-0.44, 0.0], [-0.24, 0.16], [0.0, 0.22], [0.24, 0.16], [0.44, 0.0], [0.24, -0.15], [0.0, -0.18], [-0.24, -0.14]], 2);
    return [
      F(almond, '#fbf3df'),
      F(blob(0.0, 0.03, 0.15, 0.15, 0, 24), '#3a2418'),
      F(blob(0.0, 0.03, 0.08, 0.08, 0, 18), INK, { line: null }),
      DT(0.04, 0.08, 0.026, '#fff'),
      LN([[-0.44, 0.0], [-0.24, 0.16], [0.0, 0.22], [0.24, 0.16], [0.44, 0.0]], INK, 0.07),
      F(polyline([[0.3, -0.04], [0.5, -0.12]], 0.06), INK, { line: null }),
      LN([[-0.3, -0.12], [0.0, -0.18], [0.3, -0.12]], INK, 0.03, { a: 0.9 }),
    ];
  },
};

/** Schlüssel in Reihenfolge: Pflichtliste des Briefs zuerst, dann die Zusatzzeichen. */
export const GLYPH_IDS = ['eule', 'wasser', 'mund', 'schilfblatt', 'geier', 'fuss', 'kueken', 'korb', 'strick', 'schlange', 'sonne', 'wellen',
  'loewe', 'matte', 'brot', 'stoff', 'haus', 'auge'];
/** Lautwert / Bedeutung (für Seiten und Tests, keine Zeichnung). */
export const GLYPH_INFO = {
  eule: { name: 'Eule', laut: 'm', gardiner: 'G17' }, wasser: { name: 'Wasserlinie', laut: 'n', gardiner: 'N35' }, mund: { name: 'Mund', laut: 'r', gardiner: 'D21' },
  schilfblatt: { name: 'Schilfblatt', laut: 'i', gardiner: 'M17' }, geier: { name: 'Geier', laut: 'a', gardiner: 'G1' }, fuss: { name: 'Fuß', laut: 'b', gardiner: 'D58' },
  kueken: { name: 'Wachtelküken', laut: 'w (u)', gardiner: 'G43' }, korb: { name: 'Korb mit Henkel', laut: 'k', gardiner: 'V31' }, strick: { name: 'Flachsdocht', laut: 'h', gardiner: 'V28' },
  schlange: { name: 'Kobra', laut: 'dsch', gardiner: 'I10' }, sonne: { name: 'Sonne', laut: 'ra (Sonne, Re)', gardiner: 'N5' }, wellen: { name: 'Wasser', laut: 'mw', gardiner: 'N35' },
  loewe: { name: 'Liegender Löwe', laut: 'l', gardiner: 'E23' }, matte: { name: 'Matte', laut: 'p', gardiner: 'Q3' }, brot: { name: 'Brotlaib', laut: 't', gardiner: 'X1' },
  stoff: { name: 'Gefaltetes Tuch', laut: 's', gardiner: 'S29' }, haus: { name: 'Haus', laut: 'pr (Haus)', gardiner: 'O1' }, auge: { name: 'Auge', laut: 'ir (machen)', gardiner: 'D4' },
};
/** Breite eines Zeichens relativ zur Höhe (Zeilenabstand in Kartuschen) und Vergrößerung für flache Zeichen. */
export const GLYPH_FIT = {
  eule: { w: 0.72, z: 1 }, wasser: { w: 1.0, z: 0.8 }, mund: { w: 1.0, z: 0.85 }, schilfblatt: { w: 0.78, z: 1 }, geier: { w: 1.02, z: 1 }, fuss: { w: 0.95, z: 1 },
  kueken: { w: 1.0, z: 1 }, korb: { w: 0.9, z: 1 }, strick: { w: 0.5, z: 1 }, schlange: { w: 1.05, z: 1 }, sonne: { w: 0.95, z: 0.9 }, wellen: { w: 0.95, z: 0.9 },
  loewe: { w: 1.1, z: 1 }, matte: { w: 1.0, z: 0.8 }, brot: { w: 1.0, z: 0.85 }, stoff: { w: 1.1, z: 0.85 }, haus: { w: 0.9, z: 0.95 }, auge: { w: 1.0, z: 0.9 },
};

const lum = (h) => { const n = parseInt(h.slice(1, 7), 16); return (0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255)) / 255; };

/**
 * Malt Zeichen `key` mit Mittelpunkt (cx,cy), Höhe/Breite s (Einheitsbox → s Meter).
 * opts: flip (Blick nach links), lw (Linienstärke ×), style 'color' (Standard, bunt) | 'line' (nur Umrisse in `ink` auf `paper`: eingemeißelt/Tusche)
 */
export function drawGlyph(c, key, cx, cy, s, { flip = false, ink = INK, lw = 1, style = 'color', paper = '#f3e6c0' } = {}) {
  const prims = GLYPHS[key]();
  const T = ([x, y]) => [cx + (flip ? -x : x) * s, cy + y * s];
  const lineStyle = style === 'line';
  for (const pr of prims) {
    if (pr.p) {
      const pts = pr.p.map(T);
      if (lineStyle) {
        if (pr.a !== 0) fillPoly(c, pts, paper, 1);
        if (pr.line !== null) strokePoly(c, pts, ink, (pr.w ?? 0.03) * s * lw * 0.9);
        continue;
      }
      if (pr.fill && pr.a !== 0) fillPoly(c, pts, pr.fill, pr.a ?? 1);
      if (pr.line !== null) strokePoly(c, pts, pr.line || ink, (pr.w ?? 0.03) * s * lw);
    } else if (pr.ln) {
      const pts = pr.ln.map(T);
      if (pr.a === 0) continue;
      if (lineStyle) { if (lum(pr.c) < 0.62) line(c, pts, ink, pr.w * s * lw * 0.8, { alpha: 0.9 }); continue; }
      if (pr.sharp) line(c, pts, pr.c, pr.w * s * lw, { alpha: pr.a ?? 1 }); else curve(c, pts, pr.c, pr.w * s * lw, { alpha: pr.a ?? 1 });
    } else if (pr.d) {
      const [x, y, r] = pr.d; const [X, Y] = T([x, y]);
      dot(c, X, Y, r * s, lineStyle ? (lum(pr.c) < 0.62 ? ink : paper) : pr.c);
    }
  }
}

/**
 * Kartusche (Namensring): liegendes Oval aus dickem Rand, Zeichenreihe `keys` (in Bildreihenfolge von links nach rechts), Abschlussstrich.
 * flip = Zeichen blicken nach links (Schreibrichtung nach rechts). Rückgabe: Liste der Zeichenmitten.
 */
export function drawCartouche(c, keys, cx, cy, W, H, { flip = false, ink = INK, bg = '#f3e6c0', edge = P.goldD, style = 'color', lw = 1, ring: ringCol = null } = {}) {
  const r = H / 2;
  const body = poly([[cx - W / 2 + r * 0.2, cy + r], [cx + W / 2 - r * 0.2, cy + r], [cx + W / 2 + r * 0.05, cy + r * 0.45], [cx + W / 2 + r * 0.05, cy - r * 0.45], [cx + W / 2 - r * 0.2, cy - r],
    [cx - W / 2 + r * 0.2, cy - r], [cx - W / 2 - r * 0.05, cy - r * 0.45], [cx - W / 2 - r * 0.05, cy + r * 0.45]], 3);
  fillPoly(c, body, bg, 1);
  strokePoly(c, body, ringCol || ink, H * 0.075 * lw, 1);
  if (style === 'color') strokePoly(c, body.map(([x, y]) => [cx + (x - cx) * 0.965, cy + (y - cy) * 0.93]), edge, H * 0.03 * lw, 0.9);
  // Abschlussstrich an der „Schlussseite“ (dort, wohin die Zeichen blicken, ist der Anfang)
  const bx = cx + (flip ? W / 2 + r * 0.02 : -W / 2 - r * 0.02);
  line(c, [[bx + (flip ? -1 : 1) * H * 0.02, cy - r * 1.0], [bx + (flip ? -1 : 1) * H * 0.02, cy + r * 1.0]], ringCol || ink, H * 0.08 * lw);
  let inner = H * 0.74;
  const avail = W - r * 0.9;
  const rawTot = keys.reduce((t, k) => t + GLYPH_FIT[k].w * GLYPH_FIT[k].z * inner * 0.92, 0);
  if (rawTot > avail * 0.9) inner *= (avail * 0.9) / rawTot;
  const slots = keys.map((k) => GLYPH_FIT[k].w * GLYPH_FIT[k].z * inner * 0.92);
  const tot = slots.reduce((a, b) => a + b, 0);
  const gap = Math.max(0, (avail - tot) / (keys.length + 1));
  let x = cx - (tot + gap * (keys.length - 1)) / 2;
  const mids = [];
  keys.forEach((k, i) => {
    const sl = slots[i];
    drawGlyph(c, k, x + sl / 2, cy, inner * GLYPH_FIT[k].z, { flip, ink, style, paper: bg, lw });
    mids.push(x + sl / 2);
    x += sl + gap;
  });
  return mids;
}

// ------------------------------------------------------------------------------------------------
// Platte: Stele mit Rundbogen, Rahmen und großem Zeichen
const FRAME = {
  eule: P.lapis, wasser: P.tuerkis, mund: P.karneol, schilfblatt: P.papyrus, geier: P.lapis, fuss: P.karneol, kueken: P.papyrus, korb: P.goldD,
  strick: P.tuerkis, schlange: P.nil, sonne: P.lapis, wellen: P.tuerkis, loewe: P.karneol, matte: P.lapis, brot: P.goldD, stoff: P.tuerkis, haus: P.karneol, auge: P.lapis,
};

export function glyphe(opts = {}) {
  const o = norm(opts);
  const key = GLYPHS[o.g] ? o.g : (GLYPHS[o.variant] ? o.variant : 'eule');
  const frame = o.frame || FRAME[key] || P.lapis;
  const W = 0.42, H = 0.5, x0 = -W / 2, r = W / 2;
  const arch = [];
  for (let i = 0; i <= 24; i++) { const a = Math.PI - (i / 24) * Math.PI; arch.push([Math.cos(a) * r, H - r + Math.sin(a) * r * 0.92]); }
  const plate = poly([[x0, 0.045], ...arch, [x0 + W, 0.045]], 0);
  const base = rrect(-W / 2 - 0.035, 0, W / 2 + 0.035, 0.06, 0.02);
  const cy = 0.255, S = 0.33 * (GLYPH_FIT[key]?.z ?? 1);
  const info = GLYPH_INFO[key];
  return mk('glyphe_' + key, 'Hieroglyphe ' + info.name + ' (' + info.laut + ')', {
    body: {
      layers: [
        L([base], { stops: [[0, '#b98a52'], [1, '#8a5f33']], dir: 'v' }, (c, bb) => { speckle(c, bb, ['#5e3d1f', '#d9b97a'], 14, 0.004, 0.01, 3, 0.4); }),
        L([plate], '#f3e6c0', (c, bb) => {
          fillPoly(c, poly([[x0, 0.0], ...arch, [x0 + W, 0.0]], 0), '#f3e6c0');
          volume(c, bb, { dark: 'rgba(120,80,30,.22)', light: 'rgba(255,255,235,.25)' });
          speckle(c, bb, ['#d9c28a', '#fff8e0', '#c9a96a'], 60, 0.003, 0.009, 7, 0.45);
          // Rahmen: breites Farbband, innere Goldlinie, Punktreihe
          const inset = (d) => poly([[x0 + d, 0.07], ...arch.map(([x, y]) => [x * (1 - (2 * d) / W) , (y - (H - r)) * (1 - (2 * d) / W) + (H - r)]), [x0 + W - d, 0.07]], 0);
          const outer = inset(0.012), inner = inset(0.052), inner2 = inset(0.066);
          strokePoly(c, outer, frame, 0.04, 1);
          strokePoly(c, inner, P.gold, 0.012, 1);
          strokePoly(c, inner2, P.goldD, 0.006, 0.7);
          for (let i = 0; i < 9; i++) { const t = i / 8, a = Math.PI - t * Math.PI; dot(c, Math.cos(a) * (r - 0.032), (H - r) + Math.sin(a) * (r - 0.032) * 0.92, 0.0075, P.goldH); }
          fillPoly(c, blob(0, cy, S * 0.55, S * 0.55, 0, 40), 'rgba(255,250,225,.45)');
          drawGlyph(c, key, 0, cy, S, { flip: !!o.flip });
          // Ecken-Schmuck unten: kleine Farbpunkte
          for (const sx of [-1, 1]) { dot(c, sx * (r - 0.05), 0.105, 0.012, frame); dot(c, sx * (r - 0.05), 0.105, 0.005, P.goldH); }
        }),
      ],
    },
  }, { glyph: [0, cy], base: [0, 0.03], top: [0, H] }, { gardiner: info.gardiner, laut: info.laut, heightM: H }, {});
}
export default glyphe;
