// Gruppe O1 – Goldmaske des Tutanchamun (frontal, würdevoll): Gold, Lapislazuli-Streifen, Uräus aus Geier und Kobra, Kragen, Kinnbart.
// Gebaut in cm (Mitte x=0), skaliert via finish() auf 0,54 m.
import {
  K, spec, blob, limb, poly, sym, ring, rrect, arcPts, stroke2poly, shade, mix,
  gold, inlay, flat, goldFill, bevel, gloss, volume, seg, ln, dotAt, ellipseAt, bands, uraeusFront, vultureFront, TAU,
} from './_eg_royal_kit.js';

const PI = Math.PI;

// ---- Kragen (Wesekh) aus Perlenreihen ---------------------------------------------------------------------------------------
function collarLayers(cx, cy, a0, a1) {
  const rows = [
    { r0: 9.6, r1: 11.2, kind: 'gold' },
    { r0: 11.2, r1: 13.4, col: K.lapis, line: 'rgba(140,190,255,.55)' },
    { r0: 13.4, r1: 15.4, col: K.turq, line: 'rgba(210,255,248,.5)' },
    { r0: 15.4, r1: 17.4, col: K.carn, line: 'rgba(255,170,140,.5)' },
    { r0: 17.4, r1: 19.2, col: K.lapis, line: 'rgba(140,190,255,.55)' },
    { r0: 19.2, r1: 20.6, kind: 'gold' },
  ];
  const layers = [];
  for (const row of rows) {
    const shape = ring(cx, cy, row.r0, row.r1, a0, a1, 40);
    const beadLines = (c) => {
      const n = Math.round(((a1 - a0) * (row.r0 + row.r1) / 2) / 0.62);
      for (let i = 0; i <= n; i++) {
        const a = a0 + ((a1 - a0) * i) / n;
        seg(c, [cx + Math.cos(a) * row.r0, cy + Math.sin(a) * row.r0], [cx + Math.cos(a) * row.r1, cy + Math.sin(a) * row.r1], row.line || 'rgba(120,70,5,.55)', 0.14, 1);
      }
    };
    if (row.kind === 'gold') layers.push(gold([shape], { dir: 'v', gloss: false, deco: beadLines, bevelOpts: { px: 1.2 } }));
    else layers.push(inlay([shape], row.col, { bevel: true, deco: beadLines, stroke: 'rgba(25,15,5,.38)' }));
  }
  // Tropfen am Außenrand
  const drops = [[], [], []];
  const nD = 31;
  for (let i = 0; i < nD; i++) {
    const a = a0 + 0.04 + ((a1 - a0 - 0.08) * i) / (nD - 1);
    const rr = 20.3, L = 2.7;
    const x = cx + Math.cos(a) * (rr + L / 2 - 0.4), y = cy + Math.sin(a) * (rr + L / 2 - 0.4);
    drops[i % 3].push(blob(x, y, 0.85, L / 2, a - PI / 2, 14));
  }
  layers.push(inlay(drops[0], K.turq, { bevel: true }));
  layers.push(inlay(drops[1], K.carn, { bevel: true }));
  layers.push(inlay(drops[2], K.lapis, { bevel: true }));
  return layers;
}

// ---- Gesicht -----------------------------------------------------------------------------------------------------------------------
const FY = 38; // Gesichtsmitte (Augenhöhe)

function faceShape() {
  return sym([[0, 47.7], [4.6, 47.1], [7.6, 44.8], [8.7, 41], [8.4, 36.4], [6.9, 32.2], [4, 29.2], [1.7, 28.2], [0, 28]], 1);
}
function eyeLayers(sg) {
  const ex = sg * 3.9, ey = 39.5;
  const almond = (rx, ry) => {
    const pts = [];
    for (let i = 0; i < 24; i++) {
      const t = (i / 24) * TAU;
      // innen (zur Nase) etwas tiefer, außen etwas höher: Mandelform
      const tilt = -sg * Math.cos(t) * 0.22;
      pts.push([ex + Math.cos(t) * rx, ey + Math.sin(t) * ry + tilt * ry * 1.1]);
    }
    return pts;
  };
  // Lidstrich (Lapis) bis zur Schläfe
  const kohl = stroke2poly([[sg * 1.0, 38.9], [sg * 2.3, 40.5], [sg * 4.0, 41.0], [sg * 5.9, 40.7], [sg * 7.9, 40.5]], 0.6);
  const kohlLow = stroke2poly([[sg * 5.9, 38.7], [sg * 7.3, 39.5]], 0.32);
  const white = poly(almond(2.75, 0.98), 1);
  return [
    inlay([kohl, kohlLow], '#1f4a8c', { stroke: 'rgba(5,10,30,.35)', up: 0.2, down: -0.15 }),
    {
      shapes: [white], fill: '#fbf6e6', stroke: 'rgba(30,18,5,.75)',
      deco(c) {
        dotAt(c, ex + sg * 0.1, ey + 0.02, 0.66, K.black);          // Obsidian
        dotAt(c, ex + sg * 0.1 - 0.2, ey + 0.2, 0.18, 'rgba(255,255,255,.9)');
        ln(c, [[ex - 2.6, ey + 0.52], [ex - 1.2, ey + 0.86], [ex + 1.2, ey + 0.86], [ex + 2.6, ey + 0.52]], 'rgba(120,70,8,.7)', 0.3);
        dotAt(c, ex - sg * 2.2, ey - 0.08, 0.26, K.carn, 0.9);    // Tränenwinkel
      },
    },
  ];
}
function browLayer(sg) {
  const pts = [[sg * 1.5, 42.3], [sg * 3.2, 43.4], [sg * 5.2, 43.3], [sg * 7.2, 42.2]];
  return inlay([stroke2poly(pts, 0.85)], K.lapis, { bevel: true, stroke: 'rgba(5,10,30,.6)' });
}

function faceLayer() {
  const shapes = [faceShape()];
  return {
    shapes, fill: { stops: [[0, '#fff0b3'], [0.3, '#f0c85a'], [0.7, '#e0b040'], [1, '#b98528']], dir: 'v' }, stroke: 'rgba(100,60,8,.5)',
    deco(c, bb) {
      const { ctx } = c;
      // weiche Wangen-/Stirnlichter
      const g = (x, y, r, a) => {
        const [X, Y] = c.tf(x, y); const R = r * c.S;
        const rg = ctx.createRadialGradient(X, Y, 0, X, Y, R);
        rg.addColorStop(0, `rgba(255,248,205,${a})`); rg.addColorStop(1, 'rgba(255,248,205,0)');
        ctx.save(); ctx.fillStyle = rg; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
      };
      g(-2.5, 44.6, 5.2, 0.65); g(-5, 34.5, 3.8, 0.5); g(0, 36.7, 2.2, 0.45);
      volume(c, bb, { dark: 'rgba(110,60,5,.25)', light: 'rgba(0,0,0,0)' });
      // Schatten: Wangenrand rechts, Nasenflügel, unter der Unterlippe, Kinnlinie
      for (const sg of [-1, 1]) {
        ln(c, [[sg * 8.0, 42], [sg * 8.3, 37], [sg * 6.6, 32.4]], 'rgba(120,70,8,.3)', 0.6);
        ln(c, [[sg * 1.1, 37.0], [sg * 1.9, 35.0], [sg * 2.1, 33.9]], 'rgba(120,70,8,.38)', 0.35); // Nasenflügel außen
        dotAt(c, sg * 1.0, 33.7, 0.42, 'rgba(90,50,5,.75)');                                         // Nasenloch
      }
      // Nasenrücken (Licht) + Nasenspitze
      ln(c, [[0, 39], [0, 36], [0, 34.6]], 'rgba(255,248,205,.7)', 0.8);
      ln(c, [[-1, 33.7], [0, 33.1], [1, 33.7]], 'rgba(100,55,5,.45)', 0.4);
      // Lippen
      const lip = (pts, col, w) => ln(c, pts, col, w);
      ellipseAt(c, 0, 30.9, 2.0, 0.62, '#d7a032', 0.9);
      ellipseAt(c, 0, 30.1, 1.75, 0.5, '#e8b947', 0.9);
      lip([[-2.2, 30.75], [-1.0, 30.55], [0, 30.35], [1.0, 30.55], [2.2, 30.75]], 'rgba(90,50,5,.75)', 0.26);
      lip([[-1.7, 31.45], [-0.6, 31.7], [0, 31.5], [0.6, 31.7], [1.7, 31.45]], 'rgba(110,60,5,.55)', 0.2);
      lip([[-1.5, 29.7], [0, 29.35], [1.5, 29.7]], 'rgba(110,60,5,.35)', 0.22);
      // feine Stirnband-Linie
      
    },
  };
}

/** Alle Layer der Maske (Rohkoordinaten in cm, Höhe ca. 58): auch als Kopf des goldenen Sargs verwendet. */
export function maskLayers() {
  const cx = 0, cy = 26;
  // Nemes-Haube + Lappen als eine Silhouette (Gesicht liegt davor)
  const nemesShape = sym([
    [0, 58.4], [5, 58], [9.6, 55.4], [12.6, 50.4], [13.8, 43], [15.2, 36.5], [17.0, 31], [19.2, 26.4], [18.8, 20], [0, 19],
  ], 1);
  const cloth = {
    shapes: [nemesShape], fill: { stops: [[0, K.goldHi], [0.4, K.gold], [1, '#b98528']], dir: 'v' }, stroke: 'rgba(60,40,5,.8)',
    deco(c, bb) {
      bands(c, bb, [K.lapis, null], { y0: 17, y1: 61, n: 22, curve: 0.011 });
      volume(c, bb, { dark: 'rgba(15,20,60,.3)', light: 'rgba(255,245,190,.25)' });
      // Faltenlinien an den Lappen
      for (const sg of [-1, 1]) {
        ln(c, [[sg * 12.0, 40], [sg * 14.2, 30], [sg * 16.5, 22]], 'rgba(10,15,50,.4)', 0.5);
        ln(c, [[sg * 14.4, 40], [sg * 16.4, 30], [sg * 18.3, 23]], 'rgba(255,240,170,.45)', 0.4);
      }
      gloss(c, bb, { ang: 0.9, pos: 0.22, w: 0.1, a: 0.4 });
      bevel(c, [nemesShape], bb);
    },
  };
  const neck = gold([ring(0, 26, 0, 10.2, PI, TAU, 24), poly([[-6.6, 31.5], [6.6, 31.5], [8.0, 27], [8.6, 19], [-8.6, 19], [-8.0, 27]], 1)], { dir: 'h', gloss: false });
  const collar = collarLayers(cx, cy, PI - 0.1, TAU + 0.1);
  // Ohren
  const ears = gold([blob(-9.0, 38.6, 1.3, 2.7, 0.15, 16), blob(9.0, 38.6, 1.3, 2.7, -0.15, 16)], {
    dir: 'h', gloss: false, deco(c) { dotAt(c, -9.0, 37.2, 0.34, 'rgba(90,50,5,.7)'); dotAt(c, 9.0, 37.2, 0.34, 'rgba(90,50,5,.7)'); },
  });
  const face = faceLayer();
  // Stirnband über dem Gesicht
  const band = gold([stroke2poly([[-7.8, 44.4], [-4.5, 46.8], [0, 48.0], [4.5, 46.8], [7.8, 44.4]], 1.3)], { dir: 'v', gloss: false });
  // Bart (geflochten, Lapis/Gold)
  const beardShape = poly([[-1.5, 29.2], [1.5, 29.2], [1.6, 22], [1.8, 14], [2.2, 10.4], [0, 9.2], [-2.2, 10.4], [-1.8, 14], [-1.6, 22]], 1);
  const beard = {
    shapes: [beardShape], fill: goldFill('h'), stroke: 'rgba(100,60,8,.85)',
    deco(c, bb) {
      bands(c, bb, [K.lapis, null, null], { y0: 9.2, y1: 29.2, n: 24 });
      volume(c, bb, { dark: 'rgba(15,20,60,.3)', light: 'rgba(255,245,190,.22)' });
      gloss(c, bb, { ang: 0, pos: 0.3, w: 0.2, a: 0.5 });
      bevel(c, [beardShape], bb, { px: 1.0 });
    },
  };
  const ur1 = vultureFront(-2.7, 46.8, 10.8);
  const ur2 = uraeusFront(2.7, 46.8, 10.8);
  return [cloth, neck, ...collar, ears, face, band, browLayer(-1), browLayer(1), ...eyeLayers(-1), ...eyeLayers(1), beard, ur1, ur2];
}

export function tutmaske(opts = {}) {
  const parts = { body: { z: 1, layers: maskLayers() } };
  return spec('tutmaske', 'Goldmaske des Tutanchamun', parts, { head: [0, 38], eye: [3.5, 40.7], uraeus: [0, 52] },
    { heightM: 0.54, ranges: {}, desc: 'Totenmaske aus massivem Gold, Lapislazuli, Karneol und Glas; um 1323 v. Chr.' }, { h: opts.h || 0.54 });
}
