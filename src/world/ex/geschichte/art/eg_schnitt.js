// Gruppe S1 – pyramide_schnitt: Querschnitt durch die Cheops-Pyramide (Nord links).
// Gänge, Kammern und Schächte sind bewusst übertrieben dick und farbig kodiert, damit die Seite sie gut beschriften kann:
// Gänge dunkelbraun, Große Galerie gold, Königskammer karneolrot, Königinnenkammer blau, Schächte türkis,
// Entlastungskammern ocker, unterirdische Kammer violett.
import {
  spec, rect, courseEdges, masonry, sandSpeckle, blob, limb, poly, rngOf, wavy, volume, fillPoly, curve,
} from './_eg_land_kit.js';

export function pyramide_schnitt(opts = {}) {
  const G = 0.9, H = 3.6, half = 2.9;            // Erdboden bei y=G, Pyramidenhöhe H
  const Y = (yg) => yg + G;                      // „Höhe über Boden“ -> Modell-y
  const P = (x, yg) => [x, Y(yg)];
  const layers = [];
  const rng = rngOf(opts.seed ?? 1, 401);
  // --- Felsuntergrund (Schnitt durch den Boden) mit welligen Seitenkanten und Schichtbändern
  const bx = 3.75;
  const bedrock = poly([[-bx, 0], [bx, 0], [bx + 0.08, 0.3], [bx - 0.05, 0.6], [bx + 0.06, G], [-bx - 0.06, G], [-bx + 0.05, 0.6], [-bx - 0.08, 0.3]], 1);
  layers.push({
    shapes: [bedrock], fill: { top: '#a98d68', bottom: '#80694b' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(40,24,10,.35)', light: 'rgba(255,235,190,.15)' });
      for (let k = 0; k < 5; k++) curve(c, wavy(bb.x0 - 0.2, bb.x1 + 0.2, 0.15 + k * 0.17, 0.02, 7 + k, { n: 60, phase: k * 2 }), 'rgba(60,36,16,.32)', 0.018, { alpha: 1 });
      for (let k = 0; k < 40; k++) fillPoly(c, blob(bb.x0 + rng() * bb.w, bb.y0 + rng() * bb.h, 0.02 + rng() * 0.04, 0.012 + rng() * 0.02, rng() * 3, 6), rng() < 0.5 ? 'rgba(255,240,200,.3)' : 'rgba(50,30,14,.3)');
    },
  });
  // Sandstreifen auf dem Untergrund (liegt hinter der Pyramide)
  layers.push({
    shapes: [poly([[-bx - 0.06, G - 0.03], [bx + 0.06, G - 0.03], [bx + 0.04, G + 0.08], [2.6, G + 0.14], [0, G + 0.1], [-2.6, G + 0.14], [-bx - 0.04, G + 0.08]], 1)], fill: { top: '#f0d79c', bottom: '#d9b977' },
    deco(c, bb) { volume(c, bb); sandSpeckle(c, bb, 4, 40); },
  });
  // --- Pyramidenkörper: heller Verkleidungsrand + Kernmauerwerk
  const tri = [[-half, G], [half, G], [0, G + H]];
  layers.push({
    shapes: [tri], fill: { top: '#f7efd4', bottom: '#e6d6a8' },
    deco(c, bb) { volume(c, bb, { dark: 'rgba(110,70,30,.2)', light: 'rgba(255,255,240,.3)' }); },
  });
  const k = 0.1; // Randstärke der Verkleidung
  const inner = [[-half + k * 1.55, G + 0.02], [half - k * 1.55, G + 0.02], [0, G + H - k * 1.9]];
  const edges = courseEdges(G, H, 14, 0.25);
  layers.push({
    shapes: [inner], fill: { top: '#e3cc98', bottom: '#cdb078' },
    deco(c, bb) {
      masonry(c, bb, edges, { tones: ['#e8d4a2', '#e0c993', '#ecdab0', '#d9c08a'], wMin: 0.55, wMax: 1.1, wScale: 0.8, seed: 13, joint: 'rgba(110,75,35,.4)', hi: 'rgba(255,248,222,.35)', lo: 'rgba(110,75,35,.2)', jw: 0.012, bevel: 0.12 });
      volume(c, bb, { dark: 'rgba(110,70,30,.2)', light: 'rgba(255,248,225,.25)' });
    },
  });

  // --- Innenleben ---------------------------------------------------------------------------------
  const tube = (pts, w, o = {}) => limb(pts.map(([x, yg]) => [x, Y(yg), w]), { per: o.per ?? 6, caps: o.caps ?? true });
  const rrect = (x0, y0, x1, y1, r = 0.06) => {
    r = Math.min(r, (x1 - x0) / 3, (y1 - y0) / 3);
    return poly([[x0 + r, y0], [x1 - r, y0], [x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r]], 1);
  };
  const E = [-2.52, 0.43], U0 = [-0.1, -0.52], A0 = [-0.95, 0.72], A1 = [0.05, 1.3];
  const dsl = (U0[1] - E[1]) / (U0[0] - E[0]), onD = (x) => [x, E[1] + dsl * (x - E[0])];   // Gerade des Absteigenden Gangs
  const Jn = onD(-1.9);
  const KC = { x: 0.66, y: 1.5, w: 1.1, h: 0.62 }, QC = { x: 0.5, y: 0.56, w: 0.95, h: 0.44 }, UC = { x: 0.45, y: -0.55, w: 1.2, h: 0.4 };
  const dark = { top: '#5a4130', bottom: '#3a281c' };
  const layerOf = (shapes, fill, o = {}) => layers.push({ shapes, fill, stroke: o.stroke, deco: o.deco });
  const brown = { top: '#6e4e38', bottom: '#4a3426' };
  // Schächte (türkis, dünn) – zuerst, damit Kammern darüber liegen
  const shaftN = [[0.1, 1.72], [-0.25, 1.8], [-0.7, 2.06], [-1.15, 2.2]];
  const shaftS = [[1.15, 1.68], [1.5, 1.78]];
  const qShaftS = [[0.9, 0.72], [1.2, 0.9], [1.45, 1.0]];
  const qShaftN = [[0.1, 0.78], [-0.08, 0.88]];
  layerOf([tube(shaftN, 0.085), tube(shaftS, 0.085), tube(qShaftS, 0.07), tube(qShaftN, 0.07)], { top: '#58cfc4', bottom: '#2a948c' }, { deco(c, bb) { volume(c, bb, { dark: 'rgba(0,50,50,.3)', light: 'rgba(255,255,255,.2)' }); } });
  // Eingangsöffnung (Giebel) an der Nordwand
  // Absteigender Gang + unterirdische Kammer
  layerOf([tube([E, onD(-1.5), onD(-0.8), onD(-0.3), U0], 0.16)], dark, { deco(c, bb) { volume(c, bb); } });
  layerOf([tube([Jn, [(Jn[0] + A0[0]) / 2, (Jn[1] + A0[1]) / 2], A0], 0.14)], brown, { deco(c, bb) { volume(c, bb); } });
  // waagerechter Gang zur Königinnenkammer
  layerOf([tube([[A0[0], 0.56], [QC.x - QC.w / 2 + 0.05, 0.56]], 0.12, { caps: false })], brown);
  // unterirdische Kammer (violett)
  layerOf([rrect(UC.x - UC.w / 2, Y(UC.y - UC.h / 2), UC.x + UC.w / 2, Y(UC.y + UC.h / 2))], { top: '#8470a0', bottom: '#5c4a78' }, { deco(c, bb) { volume(c, bb, { dark: 'rgba(30,10,50,.35)', light: 'rgba(255,255,255,.15)' }); } });
  // Große Galerie (gold) – schräger Streifen mit Stufenmarken
  const gdir = [A1[0] - A0[0], A1[1] - A0[1]], gl = Math.hypot(...gdir), gn = [-gdir[1] / gl, gdir[0] / gl], gw = 0.3;
  const gallery = [[A0[0] + gn[0] * gw / 2, Y(A0[1]) + gn[1] * gw / 2], [A1[0] + gn[0] * gw / 2, Y(A1[1]) + gn[1] * gw / 2], [A1[0] - gn[0] * gw / 2, Y(A1[1]) - gn[1] * gw / 2], [A0[0] - gn[0] * gw / 2, Y(A0[1]) - gn[1] * gw / 2]];
  layerOf([gallery], { top: '#f2c25a', bottom: '#d49a2e' }, {
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(110,60,0,.3)', light: 'rgba(255,250,200,.25)' });
      for (let q = 1; q < 7; q++) { const t = q / 7, cx0 = A0[0] + gdir[0] * t, cy0 = Y(A0[1]) + gdir[1] * t; curve(c, [[cx0 + gn[0] * gw * 0.55, cy0 + gn[1] * gw * 0.55], [cx0 - gn[0] * gw * 0.55, cy0 - gn[1] * gw * 0.55]], 'rgba(120,70,10,.55)', 0.016, { alpha: 1 }); }
      curve(c, [[A0[0] + gn[0] * gw * 0.2, Y(A0[1]) + gn[1] * gw * 0.2], [A1[0] + gn[0] * gw * 0.2, Y(A1[1]) + gn[1] * gw * 0.2]], 'rgba(255,248,200,.7)', 0.022, { alpha: 1 });
    },
  });
  // Entlastungskammern (ocker, vier flache Kästen + Giebel)
  const rel = [];
  for (let q = 0; q < 4; q++) { const w = 0.9 - q * 0.1, y0 = 1.95 + q * 0.15; rel.push(rrect(0.5 - w / 2, Y(y0), 0.5 + w / 2, Y(y0 + 0.11), 0.03)); }
  rel.push([[0.5 - 0.27, Y(2.56)], [0.5 + 0.27, Y(2.56)], [0.5, Y(2.74)]]);
  layerOf(rel, { top: '#c78f4a', bottom: '#9a6a2e' }, { deco(c, bb) { volume(c, bb, { dark: 'rgba(50,25,0,.3)', light: 'rgba(255,230,170,.2)' }); } });
  // Königinnenkammer (lapis, Giebeldach)
  const qc = [[QC.x - QC.w / 2, Y(QC.y - QC.h / 2)], [QC.x + QC.w / 2, Y(QC.y - QC.h / 2)], [QC.x + QC.w / 2, Y(QC.y + QC.h * 0.2)], [QC.x, Y(QC.y + QC.h * 0.62)], [QC.x - QC.w / 2, Y(QC.y + QC.h * 0.2)]];
  layerOf([poly(qc, 1)], { top: '#4a7cc4', bottom: '#2a5aa0' }, { deco(c, bb) { volume(c, bb, { dark: 'rgba(0,10,60,.35)', light: 'rgba(210,230,255,.25)' }); fillPoly(c, rect(bb.x0, bb.y0, bb.x1, bb.y0 + 0.06), 'rgba(0,10,50,.3)'); } });
  // Königskammer (karneolrot mit Goldrahmen, Sarkophag)
  layerOf([rrect(KC.x - KC.w / 2 - 0.04, Y(KC.y - KC.h / 2) - 0.04, KC.x + KC.w / 2 + 0.04, Y(KC.y + KC.h / 2) + 0.04)], { top: '#f0cc6a', bottom: '#c99a30' });
  layerOf([rrect(KC.x - KC.w / 2, Y(KC.y - KC.h / 2), KC.x + KC.w / 2, Y(KC.y + KC.h / 2))], { top: '#d8583c', bottom: '#b03a26' }, {
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(60,0,0,.3)', light: 'rgba(255,220,190,.25)' });
      fillPoly(c, rrect(KC.x - 0.22, Y(KC.y - KC.h / 2) + 0.03, KC.x + 0.24, Y(KC.y - KC.h / 2) + 0.22, 0.03), '#3a2018');   // Sarkophag
      fillPoly(c, rect(KC.x - 0.2, Y(KC.y - KC.h / 2) + 0.19, KC.x + 0.22, Y(KC.y - KC.h / 2) + 0.21), 'rgba(255,220,160,.45)');
    },
  });
  const anchors = {
    base: [0, 0], top: { rel: [0.5, 1] }, apex: [0, Y(H)],
    eingang: P(...E), absteigender_gang: P(...onD(-1.0)), aufsteigender_gang: P((Jn[0] + A0[0]) / 2, (Jn[1] + A0[1]) / 2), grosse_galerie: P((A0[0] + A1[0]) / 2, (A0[1] + A1[1]) / 2),
    koenigskammer: P(KC.x, KC.y), koeniginnenkammer: P(QC.x, QC.y), unterkammer: P(UC.x, UC.y), entlastungskammern: P(0.5, 2.3),
    schacht_nord: P(-0.7, 2.06), schacht_sued: P(1.4, 1.75), felsgrund: P(-3.0, -0.45),
  };
  return spec('pyramide_schnitt', 'Querschnitt der Cheops-Pyramide', { body: { z: 0, layers } }, anchors,
    { kind: 'building', hint: 'Gänge/Kammern übertrieben dick; Farben: Königskammer rot, Königinnenkammer blau, Große Galerie gold, Schächte türkis, Gänge braun, Unterkammer violett' },
    { h: opts.h ?? 4.5, floor: 0 });
}
