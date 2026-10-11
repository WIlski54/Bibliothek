// Tyrannosaurus rex – Oberkreide, ~12 m. Riesiger tiefer Kopf, winzige Zweifinger-Arme, dicker Schwanz, kräftige Beine.
// Freundlich: große Augen, wenige einfache Zähne, rostbrauner Rücken mit dunklen Streifen, heller Bauch.
// Teile: body (Kopf/Hals/Rumpf/Arm), jaw (Pivot Kiefergelenk), tail (Pivot Hüfte, leichtes Schwingen),
//        legA (fern), legB (nah) (Pivot Hüfte).
import { limb, poly, blob } from '../../../../art/dsl.js';
import { volume } from '../../../../art/paint.js';
import { loop, soft, fillPoly, strokePoly, wedge, bar, topOf, botOf, underBandOf, theropodLeg, claws, teethRow, bigEye, rotPt, dorsalSpots } from './_a_kit.js';

const HIP = [0.15, 3.5];
const HEAD0 = [3.3, 4.75], HEAD_ROT = -0.08, HS = 1.42;

export default function make(opts = {}) {
  const C = { back: '#8b5231', backLo: '#7c4729', belly: '#efcf98', stripe: '#46250f', accent: '#d9894a', leg: '#865030', legFar: '#693d22', cream: '#fbf1d2', pink: '#d9776a', eye: '#2a170c' };
  const H = (p) => { const [x, y] = rotPt([HEAD0[0] + p[0] * HS, HEAD0[1] + p[1] * HS], HEAD0[0], HEAD0[1], HEAD_ROT); return [x, y]; };
  const Hs = (pts) => pts.map(H);

  // ---- Rumpf + Hals ---------------------------------------------------------------------------
  const spineC = [[-0.7, 3.8, 1.55], [0.2, 3.72, 2.05], [1.3, 3.55, 2.15], [2.2, 3.7, 2.0], [2.75, 4.1, 1.8], [3.1, 4.45, 1.65], [3.3, 4.7, 1.5]];
  const spine = limb(spineC, { per: 14 });
  const belly = blob(1.2, 3.4, 1.8, 1.2, -0.05, 64);
  // ---- Kopf (lokal, Länge ~1.9) ---------------------------------------------------------------
  const headL = [
    [1.96, 0.03], [1.93, 0.22], [1.79, 0.4], [1.52, 0.52], [1.22, 0.6], [0.97, 0.68], [0.78, 0.84], [0.54, 0.85], [0.3, 0.76], [0.04, 0.6],
    [-0.14, 0.34], [-0.15, 0.0], [-0.06, -0.25], [0.22, -0.2], [0.5, -0.15], [0.9, -0.13], [1.3, -0.14], [1.65, -0.12], [1.94, -0.06],
  ];
  const head = loop(Hs(headL), 6);
  const teeth = teethRow(H([1.0, -0.11]), H([1.85, -0.09]), 5, 0.27, 0.17, 1, 0.12).map((t) => poly(t));
  // ---- Arm: winzig, zwei Finger ---------------------------------------------------------------
  const arm = limb([[2.0, 3.3, 0.46], [2.28, 2.88, 0.34], [2.7, 2.7, 0.26], [3.0, 2.78, 0.19]], { per: 10 });
  const fingers = [limb([[2.94, 2.78, 0.17], [3.3, 2.92, 0.1]], { per: 4 }), limb([[2.94, 2.7, 0.16], [3.32, 2.68, 0.09]], { per: 4 })];
  const fClaws = claws([[3.35, 2.94], [3.37, 2.68]], 0.14, 0.09, -0.2);
  const bodyShapes = [spine, belly, head, arm].concat(fingers);

  // ---- Schwanz (eigenes Teil, Pivot Hüfte) -------------------------------------------------------
  const tailC = [[-6.1, 3.62, 0.05], [-5.1, 3.42, 0.32], [-3.9, 3.38, 0.72], [-2.8, 3.48, 1.12], [-1.8, 3.64, 1.5], [-0.9, 3.78, 1.8], [0.3, 3.75, 1.85]];
  const tail = limb(tailC, { per: 14 });

  // gemeinsames Bauchband (Modellkoordinaten, in beiden Teilen gemalt -> nahtlos)
  const allShapes = bodyShapes.concat([tail]);
  const bellyBand = underBandOf(allShapes, -6.0, 3.0, (x) => (x > 1.9 ? 0.45 : x > -2 ? 0.75 + 0.1 * Math.min(1, (x + 2) / 2) : 0.32 + (x + 6.4) * 0.07), 120);
  const throat = [H([-0.1, -0.2]), H([0.6, -0.2]), H([0.6, -0.02]), H([-0.1, 0.1])];
  const stripesOn = (c) => {
    for (let i = 0; i < 16; i++) {
      const x = 1.6 - i * 0.42;
      const t = topOf(allShapes, x); if (t === null) continue;
      const len = x > -1 ? 0.95 : 0.5 + 0.35 * Math.max(0, (x + 6) / 5);
      wedge(c, x, t + 0.05, t - len, 0.34 - Math.max(0, -x) * 0.03 + (x < -4 ? -0.04 : 0), -0.18, C.stripe, 0.6);
    }
  };

  const bodyLayers = [
    { shapes: bodyShapes, fill: { top: C.back, bottom: C.backLo },
      deco(c, bb) {
        soft(c, bellyBand, C.belly, 0.2, 1);
        soft(c, [[2.2, 2.9], [3.35, 3.6], [3.8, 4.1], [3.5, 4.0], [2.6, 3.4]], C.belly, 0.12, 0.9);
        stripesOn(c);
        // große Hautflecken am Hals
        dorsalSpots(c, spine, 2.4, 3.6, 7, 0.05, 0.12, 0.5, C.stripe, 0.35);
        volume(c, bb, { dark: 'rgba(50,20,8,0.22)', light: 'rgba(255,230,190,0.2)' });
        // Kopf: weich aufgehellt (kein harter Übergang zum Hals)
        soft(c, head, '#b06c43', 0.14, 0.62);
        soft(c, throat, C.belly, 0.1, 0.9);
        soft(c, Hs([[0.0, -0.2], [1.95, -0.12], [1.95, 0.0], [0.3, 0.06]]), '#f0cf9a', 0.1, 0.9);   // heller Oberlippenrand
        // Wangenfleck (freundlich)
        const ch = H([0.34, 0.12]); soft(c, [[ch[0] - 0.22, ch[1] - 0.05], [ch[0], ch[1] + 0.14], [ch[0] + 0.22, ch[1] - 0.05], [ch[0], ch[1] - 0.1]], C.accent, 0.08, 0.7);
        // dunkle Streifen am Schädel
        strokePoly(c, Hs([[0.5, 0.78], [0.38, 0.6], [0.26, 0.42]]), C.stripe, 0.1, 0.45);
        strokePoly(c, Hs([[0.22, 0.66], [0.12, 0.5], [0.02, 0.3]]), C.stripe, 0.09, 0.45);
        // Nüster
        const n = H([1.78, 0.26]); c.ctx.save(); c.ctx.fillStyle = 'rgba(50,25,10,0.8)'; const [X, Y] = c.tf(n[0], n[1]);
        c.ctx.beginPath(); c.ctx.ellipse(X, Y, 0.06 * c.S, 0.035 * c.S, -0.5, 0, 6.28); c.ctx.fill(); c.ctx.restore();
        // Mundlinie mit kleinem Lächeln am Mundwinkel
        strokePoly(c, Hs([[1.9, -0.075], [1.5, -0.1], [1.0, -0.1], [0.6, -0.1], [0.4, -0.08], [0.28, -0.03]]), 'rgba(55,25,10,0.85)', 0.035, 1);
        const e = H([0.7, 0.4]); bigEye(c, e[0], e[1], 0.21, { color: C.eye });
      } },
    { shapes: fClaws, fill: '#3a2414', stroke: null },
    { shapes: teeth, fill: C.cream, stroke: 'rgba(110,80,50,0.45)' },
  ];

  // ---- Kiefer ---------------------------------------------------------------------------------
  const jawPivot = H([0.2, -0.1]);
  const jawShape = loop(Hs([[1.9, -0.04], [1.97, -0.22], [1.78, -0.45], [1.4, -0.6], [1.0, -0.72], [0.6, -0.8], [0.28, -0.76], [0.04, -0.55], [0.0, -0.15], [0.3, 0.0], [1.0, 0.0], [1.6, 0.0]]), 6);
  const lining = loop(Hs([[0.0, 0.05], [0.6, 0.05], [1.5, 0.0], [1.85, -0.04], [1.7, -0.35], [1.0, -0.5], [0.3, -0.5], [0.0, -0.3]]), 5);
  const jawTeeth = teethRow(H([1.15, -0.1]), H([1.8, -0.08]), 4, 0.18, 0.13, -1, -0.1).map((t) => poly(t));

  // ---- Beine ----------------------------------------------------------------------------------
  const mkLeg = (foot, far) => {
    const lg = theropodLeg({ hip: HIP, foot, L: [1.4, 1.35, 0.95], metaAng: 1.15, widths: [1.15, 1.4, 0.78, 0.6, 0.4, 0.38], toe: 0.8, toeW: 0.34, kneeSide: 1 });
    const col = far ? C.legFar : C.leg;
    return {
      z: far ? 0 : 2, pivot: HIP.slice(),
      layers: [
        { shapes: lg.shapes, fill: { top: col, bottom: far ? '#a98056' : '#d9ab74' },
          deco(c, bb) {
            wedge(c, HIP[0] - 0.4, HIP[1] + 0.5, HIP[1] - 0.6, 0.25, 0.3, C.stripe, far ? 0.3 : 0.4);
            wedge(c, HIP[0] + 0.1, HIP[1] + 0.6, HIP[1] - 0.8, 0.22, 0.3, C.stripe, far ? 0.3 : 0.4);
            volume(c, bb, { dark: 'rgba(50,20,8,0.25)', light: 'rgba(255,230,190,0.12)' });
          } },
        { shapes: claws(lg.clawPts, 0.22, 0.14, -0.12), fill: '#3a2414', stroke: null },
      ],
    };
  };

  const parts = {};
  parts.body = { z: 1, layers: bodyLayers };
  parts.jaw = { z: 0, pivot: jawPivot, layers: [
    { shapes: [lining], fill: C.pink, stroke: null },
    { shapes: [jawShape], fill: { top: '#d8ad78', bottom: C.cream },
      deco(c, bb) { strokePoly(c, Hs([[0.5, -0.55], [1.0, -0.55], [1.6, -0.4]]), 'rgba(110,60,25,0.2)', 0.05, 1); } },
    { shapes: jawTeeth, fill: C.cream, stroke: 'rgba(110,80,50,0.45)' },
  ] };
  parts.tail = { z: 0, pivot: [0.0, 3.7], layers: [
    { shapes: [tail], fill: { top: C.back, bottom: C.backLo },
      deco(c, bb) { soft(c, bellyBand, C.belly, 0.15, 1); stripesOn(c); volume(c, bb, { dark: 'rgba(50,20,8,0.2)', light: 'rgba(255,230,190,0.18)' }); } },
  ] };
  parts.legA = mkLeg(0.85, true);
  parts.legB = mkLeg(0.25, false);

  return {
    id: 'trex',
    parts,
    anchors: { head: H([0.9, 0.2]), mouth: H([1.95, -0.1]), eye: H([0.7, 0.4]), back: [0.4, 4.7], foot: [0.55, 0.0], hip: HIP.slice(), tailTip: [-6.1, 3.62] },
    meta: { name: 'Tyrannosaurus rex', lengthM: 12, massKg: 8000, period: 'Oberkreide',
      ranges: { jaw: [0, -0.55], tail: [0, 0.1], legA: [0, 0.35], legB: [0, 0.35] }, // tail: Schwingen ±0.1 rad um 0 (Pivot Hüfte); Beine ±0.35 rad
      swing: { tail: [-0.1, 0.1], legA: [-0.35, 0.35], legB: [-0.35, 0.35] } },
  };
}
