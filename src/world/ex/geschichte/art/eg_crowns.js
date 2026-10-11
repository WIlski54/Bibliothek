// Gruppe O1 – Kronen und Zepter: Hedjet (weiße Krone), Deschret (rote Krone), Pschent (Doppelkrone), Nemes, Khepresch (blaue Krone),
// Heqa-Krummstab + Nechacha-Wedel. Alle im Profil (schauen nach +x), Basis y=0, Mitte x=0. Gebaut in cm, skaliert via finish().
import {
  K, spec, bandedLimb, blob, limb, poly, xf, spline, sym, rect, rrect, arcPts, stroke2poly, beadsAlong, shade, mix,
  gold, inlay, flat, goldFill, bevel, gloss, volume, seg, ln, dotAt, ellipseAt, bands, bead, glyph, uraeusProfile, uraeusFront, strokes,
} from './_eg_royal_kit.js';

// ---- Hedjet-Umriss (Höhe 50, Basisbreite 15) -----------------------------------------------------------------------------
const HEDJET = [
  [-7.2, 0], [-6.7, 8], [-6.0, 18], [-6.4, 26], [-8.0, 34], [-9.0, 41], [-7.8, 46.2], [-4, 49.4], [0, 50.0], [4.2, 49.2], [8, 45.5], [9.2, 40.5], [8.6, 34.5],
  [7, 27], [6.2, 18], [6.6, 8], [7.4, 0],
];
const hedjetShape = (k = 1, x = 0, y = 0, wx = 1.22) => xf(poly(HEDJET, 2), { sx: k * wx, sy: k, x, y });

function whiteLeather(shapes, k, x, y, top) {
  return {
    shapes, stroke: 'rgba(80,60,30,.55)',
    fill: { stops: [[0, '#fffdf4'], [0.4, K.linen], [0.8, '#e2d7bd'], [1, '#c9bc9c']], dir: 'h' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(110,85,40,.18)', light: 'rgba(255,255,255,.3)' });
      // Nähte: senkrechte Rippen der Lederkrone
      const cx = x + 0.4 * k;
      for (let i = -2; i <= 2; i++) {
        const o = i * 2.6 * k;
        ln(c, [[cx + o * 0.9, y + 11 * k], [cx + o * 1.05, y + 27 * k], [cx + o * 1.3, y + 38 * k], [cx + o * 0.9, y + 47.5 * k]], 'rgba(120,95,55,.35)', 0.35 * k);
      }
      gloss(c, bb, { ang: 0, pos: 0.18, w: 0.1, a: 0.5, color: '255,255,255' });
    },
  };
}

function bandGold(x, y, k, w = 13.6, h = 2.6) {
  return gold([poly(rrect(x - w / 2 * k, y, x + w / 2 * k, y + h * k, 0.9 * k, 4), 0)], {
    dir: 'v', deco(c, bb) {
      for (let i = 0; i < 5; i++) dotAt(c, x - 5 * k + i * 2.5 * k, y + h * k * 0.5, 0.33 * k, K.lapis);
    },
  });
}

export function weisse_krone(opts = {}) {
  const k = 1;
  const body = hedjetShape();
  const parts = {
    body: {
      z: 1, layers: [
        whiteLeather([body], k, 0, 0),
        gold([blob(0.5, 50.2, 1.9, 1.5, 0, 12)], { dir: 'v', gloss: false }),
        bandGold(0, 0.2, 1, 17.6, 2.6),
        ...(opts.uraeus === false ? [] : [uraeusProfile(9.4, 3.6, 10)]),
      ],
    },
  };
  return spec('weisse_krone', 'Weiße Krone (Hedjet)', parts, { base: [0, 0], top: [0.5, 50] },
    { heightM: 0.5, ranges: {}, desc: 'Krone Oberägyptens' }, { h: opts.h || 0.5 });
}

// ---- Deschret --------------------------------------------------------------------------------------------------------------------
// Hinterer Hochteil + niedrige Kappe + Spirale; (x,y) Fuß, k Maßstab, hMax Höhe des Hochteils
function deschretShapes(k = 1, x = 0, y = 0, tall = 43) {
  const t = tall / 43;
  const column = poly([
    [-8.6, 0], [-9.4, 12], [-9.2, 25 * t], [-8.2, 36 * t], [-5.8, 42.4 * t], [-2, 44 * t], [1.4, 42 * t], [3.2, 35 * t], [4.3, 25 * t], [4.8, 14], [4, 0],
  ], 2);
  const cap = poly([
    [-8.4, 0], [-8.8, 8], [-6.8, 15.6], [-1, 19], [3.6, 18.6], [7, 15], [8.6, 9.6], [8.9, 4], [8.5, 0],
  ], 2);
  // Spirale: Draht aus der Kappenvorderseite, vorn oben eingerollt
  const spiral = [[5.6, 16, 1.7], [6.2, 22, 1.6], [7.0, 28, 1.5]];
  const C = [10.6, 30.4]; let r = 3.7, a = Math.PI + 0.35;
  for (let i = 0; i < 20; i++) { spiral.push([C[0] + Math.cos(a) * r, C[1] + Math.sin(a) * r, 1.45 - i * 0.02]); a -= 0.4; r *= 0.945; }
  const curl = limb(spiral.map((p) => [p[0], p[1], p[2]]), { per: 4 });
  const T = (p) => xf(p, { s: k, x, y });
  return { column: T(column), cap: T(cap), curl: T(curl) };
}

function redLeather(shapes, k, x, y, hi = 0.0) {
  return {
    shapes, stroke: 'rgba(60,15,8,.7)',
    fill: { stops: [[0, mix(K.carn, '#ff9a80', 0.35 + hi)], [0.4, K.carn], [0.85, '#9a3020'], [1, K.carnLo]], dir: 'h' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(60,5,0,.3)', light: 'rgba(255,200,170,.25)' });
      // Flechtmuster: feine Rauten
      const list = [];
      for (let u = bb.x0 - bb.h; u < bb.x1 + bb.h; u += 1.3 * k) { list.push([u, bb.y0, u + bb.h, bb.y1]); list.push([u + bb.h, bb.y0, u, bb.y1]); }
      strokes(c, list, 'rgba(70,10,0,.9)', 0.12 * k, 0.16);
      gloss(c, bb, { ang: 0, pos: 0.2, w: 0.1, a: 0.4, color: '255,210,190' });
    },
  };
}

export function rote_krone(opts = {}) {
  const k = 1;
  const S = deschretShapes(k, 0, 0, 43);
  const uraeus = uraeusProfile(8.4, 5.4, 10.5);
  const parts = {
    body: {
      z: 1, layers: [
        redLeather([S.column], k, 0, 0),
        redLeather([S.cap], k, 0, 0, 0.1),
        redLeather([S.curl], k, 0, 0, 0.2),
        bandGold(0, 0.1, 1, 18, 2.6),
        uraeus,
      ],
    },
  };
  return spec('rote_krone', 'Rote Krone (Deschret)', parts, { base: [0, 0], top: [0, 43], uraeus: [7.6, 10] },
    { heightM: 0.5, ranges: {}, desc: 'Krone Unterägyptens' }, { h: opts.h || 0.5 });
}

// ---- Pschent (Doppelkrone) ----------------------------------------------------------------------------------------------
export function doppelkrone(opts = {}) {
  const S = deschretShapes(1, -1.6, 0, 46);
  // Hedjet steckt in der Deschret: Fuß auf Höhe der Kappe
  const k = 1.12, hy = 12, hx = 3.2;
  const white = hedjetShape(k, hx, hy);
  const uraeus = uraeusProfile(8.6, 5.2, 10.5);
  const parts = {
    body: {
      z: 1, layers: [
        redLeather([S.column], 1, 0, 0),
        whiteLeather([white], k, hx, hy),
        redLeather([S.cap], 1, 0, 0, 0.1),
        redLeather([S.curl], 1, 0, 0, 0.2),
        bandGold(0, 0.1, 1, 18, 2.6),
        uraeus,
      ],
    },
  };
  return spec('doppelkrone', 'Doppelkrone (Pschent)', parts, { base: [0, 0], top: [0.4, 71] },
    { heightM: 0.8, ranges: {}, desc: 'Vereinte Krone beider Länder' }, { h: opts.h || 0.8 });
}

// ---- Nemes (Streifentuch) ------------------------------------------------------------------------------------------------------
// Frontal: Haube + zwei Seitenlappen, Gesichtsöffnung ausgeschnitten (wie ein Hohlkopfschmuck), goldenes Stirnband, Uräus.
function nemesTuch(opts = {}) {
  const cloth = sym([
    [0, 40.4], [6, 39.4], [10.4, 35], [12.2, 28], [14.2, 19], [16.6, 8], [17.8, 0.4], [9.2, 0.4], [8.8, 8], [7.9, 16], [6.8, 21.5], [4.2, 25.4], [0, 27.2],
  ], 1);
  const nemesFill = { stops: [[0, K.goldHi], [0.3, K.gold], [1, '#b98528']], dir: 'v' };
  const cl = {
    shapes: [cloth], fill: nemesFill, stroke: 'rgba(60,40,5,.75)',
    deco(c, bb) {
      bands(c, bb, [K.lapis, null], { y0: 0.4, y1: 40.4, n: 18 });
      volume(c, bb, { dark: 'rgba(15,20,60,.3)', light: 'rgba(255,245,190,.22)' });
      // Seitenlappen leicht schattiert (Faltenwurf)
      for (const sg of [-1, 1]) ln(c, [[sg * 11.6, 28], [sg * 13.2, 16], [sg * 14.4, 4]], 'rgba(10,15,50,.35)', 0.5);
      gloss(c, bb, { ang: 0.9, pos: 0.25, w: 0.12, a: 0.4 });
      bevel(c, [cloth], bb);
    },
  };
  // Stirnband entlang der Öffnung
  const bandPts = [[-8.9, 14], [-7.7, 19.4], [-5.4, 23.8], [-2.8, 26.2], [0, 27.1], [2.8, 26.2], [5.4, 23.8], [7.7, 19.4], [8.9, 14]];
  const band = gold([stroke2poly(bandPts, 2.2)], {
    dir: 'v', deco(c) { for (let i = 1; i < bandPts.length - 1; i++) dotAt(c, bandPts[i][0], bandPts[i][1], 0.45, i % 2 ? K.turq : K.carn, 0.95); },
  });
  const ur = uraeusFront(0, 27.6, 10.5);
  const parts = { body: { z: 1, layers: [cl, band, ur] } };
  return spec('nemes', 'Nemes-Kopftuch', parts, { base: [0, 0], top: [0, 40], uraeus: [0, 38] },
    { heightM: 0.4, ranges: {}, desc: 'Königliches Streifenkopftuch mit Uräus' }, { h: opts.h || 0.4 });
}

// Standard: goldene Königsbüste im Profil mit Nemes (zeigt, wie das Tuch getragen wird). opts.view='tuch' liefert das Tuch allein (frontal).
export function nemes(opts = {}) {
  if (opts.view === 'tuch') return nemesTuch(opts);
  const stripeFill = { stops: [[0, K.goldHi], [0.3, K.gold], [1, '#b98528']], dir: 'v' };
  const cloth = (shapes, y0, y1, n) => ({
    shapes, fill: stripeFill, stroke: 'rgba(60,40,5,.75)',
    deco(c, bb) {
      bands(c, bb, [K.lapis, null], { y0, y1, n });
      volume(c, bb, { dark: 'rgba(15,20,60,.3)', light: 'rgba(255,245,190,.22)' });
      gloss(c, bb, { ang: 0.9, pos: 0.25, w: 0.12, a: 0.4 });
      bevel(c, shapes, bb);
    },
  });
  const queue = poly([[-9.6, 23], [-13, 19.5], [-14.8, 12], [-14.6, 5], [-9.8, 4.4], [-8.8, 11], [-7.8, 18]], 1);
  const dome = poly([[9.6, 29.2], [10, 32.4], [8.6, 36.8], [4.4, 39.8], [-1, 40.6], [-6.6, 38.8], [-10.6, 33.6], [-12, 27], [-11.4, 20.6], [-6.4, 19.2], [-1.2, 22.6], [0.6, 26.2], [2.4, 28], [5.2, 29]], 2);
  const neck = poly([[-3.6, 22], [4.6, 22], [4.8, 14], [5.8, 8], [7, 0.8], [-6, 0.8], [-5, 8], [-3.8, 14]], 1);
  const lappet = poly([[3.2, 17.8], [10.6, 17.2], [12.4, 10], [14.2, 0.8], [0.6, 0.8], [1.6, 9]], 1);
  const face = poly([[0, 29.8], [8.6, 29.8], [9.4, 28.4], [8.9, 26.8], [11.8, 23.2], [10.8, 21.8], [11.0, 20.4], [10.4, 19.6], [10.9, 18.8], [9.9, 16.4], [8.4, 14.6], [3.8, 15.4], [0.6, 19], [0, 24]], 1);
  const faceL = {
    shapes: [face], fill: { stops: [[0, '#f0c85a'], [0.5, '#fff0b3'], [1, '#e0b040']], dir: 'h' }, stroke: 'rgba(100,60,8,.85)',
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(110,60,5,.22)', light: 'rgba(255,248,205,.2)' });
      ln(c, [[10.6, 20.0], [9.2, 20.3]], 'rgba(90,50,5,.8)', 0.22);                       // Mund
      ellipseAt(c, 10.4, 19.2, 0.7, 0.4, 'rgba(210,150,40,.7)');
      ln(c, [[10.2, 22.0], [9.4, 22.5]], 'rgba(100,55,5,.55)', 0.2);                       // Nasenflügel
      gloss(c, bb, { ang: 0, pos: 0.7, w: 0.1, a: 0.35 });
      bevel(c, [face], bb, { px: 1.0 });
    },
  };
  const neckL = gold([neck], { dir: 'h', gloss: false });
  const eye = {
    shapes: [poly([[4.8, 26.4], [6.2, 27.0], [7.8, 26.6], [6.4, 25.8]], 2)], fill: '#fbf6e6', stroke: 'rgba(30,18,5,.85)',
    deco(c) { dotAt(c, 6.9, 26.5, 0.5, K.black); },
  };
  const kohl = inlay([stroke2poly([[3.8, 26.2], [5.0, 26.8], [6.8, 27.2], [8.2, 26.8]], 0.55), stroke2poly([[3.8, 26.2], [2.4, 26.9]], 0.4)], K.lapisLo, { stroke: 'rgba(5,10,30,.6)' });
  const brow = inlay([stroke2poly([[4.2, 28.2], [6.6, 28.6], [9.0, 28.2]], 0.7)], K.lapis, { stroke: 'rgba(5,10,30,.6)' });
  const ear = gold([blob(1.8, 23.6, 1.0, 2.0, 0.2, 14)], { dir: 'h', gloss: false, deco(c) { dotAt(c, 1.7, 22.7, 0.25, 'rgba(90,50,5,.7)'); } });
  const trim = gold([stroke2poly([[9.8, 29.4], [5.2, 29.0], [2.4, 28.1], [0.6, 26.2], [-1.2, 22.8], [-6.4, 19.5], [-11.2, 20.8]], 0.9)], { dir: 'v', gloss: false });
  const beardShape = poly([[8.6, 17], [11.0, 16.6], [11.3, 9.4], [13, 6], [10.6, 5.4], [8.4, 9]], 1);
  const beard = {
    shapes: [beardShape], fill: goldFill('h'), stroke: 'rgba(100,60,8,.85)',
    deco(c, bb) { bands(c, bb, [K.lapis, null, null], { y0: 5.8, y1: 16.8, n: 14 }); volume(c, bb); bevel(c, [beardShape], bb, { px: 1.0 }); },
  };
  const uraeus = uraeusProfile(9.3, 29.4, 9);
  const parts = {
    body: {
      z: 1, layers: [cloth([queue], 4.4, 24, 6), neckL, cloth([lappet], 0.8, 18, 8), faceL, cloth([dome], 19, 40.6, 7), trim, ear, kohl, brow, eye, beard, uraeus],
    },
  };
  return spec('nemes', 'Königsbüste mit Nemes', parts, { base: [0, 0], top: [0, 40], uraeus: [9.3, 38] },
    { heightM: 0.4, ranges: {}, desc: 'Gestreiftes Königskopftuch (Nemes) mit Uräus auf einer goldenen Büste; opts.view=\'tuch\' zeigt das Tuch allein' }, { h: opts.h || 0.4 });
}

// ---- Khepresch (Blaue Krone) --------------------------------------------------------------------------------------------------------
export function blaue_krone(opts = {}) {
  const shell = poly([
    [8.6, 0], [8.7, 8], [7, 18], [3.8, 28], [-1.2, 36], [-6, 39.8], [-10.4, 36.6], [-12, 26], [-12.2, 14], [-10.8, 6], [-9.2, 0],
  ], 2);
  // Bänder (hinten herabhängend)
  const streamer = [
    limb([[-10.5, 13, 3.2], [-14.5, 8, 3.0], [-17.4, 2.2, 2.6]], { per: 8 }),
    limb([[-10.5, 8, 3], [-13.6, 4.4, 2.8], [-14.2, 1.4, 2.4]], { per: 8 }),
  ];
  const lap = inlay(streamer, K.lapisHi, {
    volume: true, bevel: true,
    deco(c) { for (const s of streamer) { /* goldene Randlinie kommt über Stroke */ } },
  });
  const crown = {
    shapes: [shell], stroke: 'rgba(8,20,50,.85)',
    fill: { stops: [[0, K.lapisHi], [0.45, K.lapis], [1, K.lapisLo]], dir: 'h' },
    deco(c, bb) {
      volume(c, bb, { dark: 'rgba(0,0,30,.28)', light: 'rgba(200,225,255,.25)' });
      // Goldene Scheibchen im Versatzmuster
      for (let row = 0; row < 8; row++) {
        const y = 6.5 + row * 4.0, off = (row % 2) * 1.8;
        for (let x = -11 + off; x < 9; x += 3.6) {
          const fall = 1 - Math.max(0, (y - 22) / 30);
          dotAt(c, x, y, 1.0 * fall + 0.35, 'rgba(60,35,5,.7)');
          dotAt(c, x, y + 0.08, 0.86 * fall + 0.27, K.gold);
          dotAt(c, x - 0.15, y + 0.2, 0.34 * fall + 0.1, K.goldHi);
        }
      }
      gloss(c, bb, { ang: 0, pos: 0.15, w: 0.1, a: 0.35, color: '220,235,255' });
    },
  };
  const uraeus = uraeusProfile(8.6, 3.4, 12);
  const parts = {
    body: {
      z: 1, layers: [
        crown,
        gold([poly(rrect(-10.6, 0, 8.6, 2.7, 1, 4), 0)], { dir: 'v' }),
        uraeus,
      ],
    },
  };
  return spec('blaue_krone', 'Blaue Krone (Khepresch)', parts, { base: [0, 0], top: [-6, 40] },
    { heightM: 0.4, ranges: {}, desc: 'Kriegskrone, mit Goldscheiben besetzt' }, { h: opts.h || 0.4, floor: null });
}

// ---- Krummstab (Heqa) und Wedel (Nechacha) gekreuzt -----------------------------------------------------------------------------
export function krummstab_wedel(opts = {}) {
  // Krummstab: Stab von unten links nach oben rechts, Haken oben nach vorn (rechts) eingerollt
  const crookCtrl = [[-13, 0, 4.6], [-6, 20, 4.6], [1, 42, 4.6], [8, 64, 4.6], [12, 74, 4.5], [18, 83, 4.4], [27, 87, 4.2], [34, 82, 3.8], [35, 74, 3.4], [31, 69, 3.0]];
  const segs = bandedLimb(crookCtrl, 18);
  const A = segs.filter((_, i) => i % 3 === 0), B = segs.filter((_, i) => i % 3 === 1), C = segs.filter((_, i) => i % 3 === 2);
  const crook = [
    inlay(A, K.lapis, { bevel: true }),
    gold(B, { dir: 'v', gloss: false }),
    inlay(C, K.turq, { bevel: true }),
    gold([blob(-13.4, 1.0, 3.6, 3.2, 0, 14), blob(31, 69, 2.3, 2.3, 0, 12)], { dir: 'v', gloss: false }),
  ];
  // Wedel: Griff von unten rechts nach oben links, Spitze knickt ab, drei Perlenschnüre hängen
  const hCtrl = [[13, 0, 4.4], [7, 18, 4.4], [1, 38, 4.4], [-5, 56, 4.4], [-9, 64, 4.2], [-16, 69, 3.4]];
  const hs = bandedLimb(hCtrl, 14);
  const hA = hs.filter((_, i) => i % 2 === 0), hB = hs.filter((_, i) => i % 2 === 1);
  const root = [-16, 69];
  const strands = [
    [root, [-22, 66], [-29, 58], [-34, 47]],
    [root, [-20, 64], [-26, 53], [-29, 40]],
    [root, [-17, 62], [-20, 50], [-21, 36]],
  ];
  const beadShapes = [[], [], []];
  const cords = [];
  strands.forEach((st) => {
    const pts = spline(st.map((p) => [p[0], p[1], 0]), 12);
    cords.push(limb(pts.map((p) => [p[0], p[1], 0.8]), { per: 1 }));
    let acc = 0, k = 0;
    for (let i = 1; i < pts.length; i++) {
      acc += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      if (acc >= 4.4) { acc = 0; beadShapes[k % 3].push(blob(pts[i][0], pts[i][1], 2.0, 2.0, 0, 14)); k++; }
    }
  });
  const flail = [
    gold(cords, { dir: 'v', gloss: false, stroke: 'rgba(80,45,5,.7)' }),
    inlay(beadShapes[0], K.lapis, { bevel: true }),
    inlay(beadShapes[1], K.carn, { bevel: true }),
    inlay(beadShapes[2], K.turq, { bevel: true }),
    inlay(hA, K.lapis, { bevel: true }),
    gold(hB, { dir: 'v', gloss: false }),
    gold([blob(13.4, 1.0, 3.6, 3.2, 0, 14), blob(-16, 69, 3.0, 3.0, 0, 14)], { dir: 'v', gloss: false }),
  ];
  const parts = {
    body: { z: 1, layers: crook },
    wedel: { z: 2, pivot: [0, 34], layers: flail },
  };
  return spec('krummstab_wedel', 'Krummstab und Wedel (Heqa und Nechacha)', parts, { crossing: [0, 34], hook: [30, 80] },
    { heightM: 0.9, ranges: { wedel: [0, 0.2] }, desc: 'Zeichen der Königsherrschaft' }, { h: opts.h || 0.9 });
}
