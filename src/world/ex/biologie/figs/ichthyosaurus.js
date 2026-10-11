// Ichthyosaurus (Ophthalmosaurus, Oberjura, ~5 m): delfinaehnlich, riesiges Auge, spitze Schnauze, Rueckenfinne, senkrechte Fluke.
// Teile: body, tail (Pivot am Schwanzansatz), flipperA (Pivot an der Schulter).
import { blob, limb, poly } from '../../../../art/dsl.js';
import { eye, volume, spots } from '../../../../art/paint.js';
import { smooth, strokePath, glow, ringEye } from './_c_helpers.js';

export default function make(opts = {}) {
  const TP = [1.22, 0.8];   // tail pivot (Schwanzansatz)
  const FP = [3.28, 0.66];  // flipper pivot (Schulter)

  // ---- body: spindle, long pointed snout, dorsal fin ----
  const hull = smooth([
    [5.04, 0.84, 1],
    [4.62, 0.935], [4.2, 1.10], [3.75, 1.29], [3.25, 1.41], [2.75, 1.45], [2.25, 1.41], [1.82, 1.29], [1.5, 1.12],
    [1.3, 1.03], [1.12, 0.97],
    [0.98, 0.84], [1.12, 0.65], [1.4, 0.62],
    [1.75, 0.50], [2.25, 0.35], [2.85, 0.30], [3.4, 0.36], [3.9, 0.50], [4.35, 0.66], [4.72, 0.77],
  ], 8);
  const dorsal = smooth([[2.55, 1.34], [2.2, 1.62], [1.88, 1.80, 1], [1.80, 1.52], [1.72, 1.24]], 8);
  const capBall = blob(TP[0], TP[1], 0.12, 0.12);
  const farFlipper = limb([[3.62, 0.52, 0.2], [3.5, 0.34, 0.26], [3.36, 0.15, 0.22], [3.28, 0.06, 0.1]], { per: 8 });

  // ---- tail: peduncle + lunate fluke (lower lobe bigger: backbone bends down) ----
  const ped = limb([[TP[0] + 0.1, TP[1], 0.28], [0.98, 0.79, 0.25], [0.8, 0.8, 0.26]], { per: 8 });
  const fluke = smooth([[0.08, 1.52, 1], [0.42, 1.26], [0.78, 0.86], [0.66, 0.5], [0.4, 0.22], [0.03, 0.02, 1], [0.2, 0.26], [0.31, 0.52], [0.35, 0.8], [0.31, 1.06], [0.2, 1.3]], 8);
  const upper = [], lower = [], web = [];
  const tailRoot = blob(TP[0], TP[1], 0.14, 0.14);

  // ---- near flipper: narrow paddle, rounded root on the body ----
  const flip = [
    ...limb([[FP[0], FP[1], 0.26], [FP[0] - 0.12, FP[1] - 0.2, 0.3], [FP[0] - 0.3, FP[1] - 0.42, 0.26], [FP[0] - 0.46, FP[1] - 0.58, 0.14], [FP[0] - 0.52, FP[1] - 0.63, 0.04]], { per: 10 }),
  ];
  const flipRoot = blob(FP[0], FP[1], 0.14, 0.14);

  const back = '#43607a', mid = '#5f7d96', belly = '#ece5cf';
  const bodyDeco = (c, bb) => {
    volume(c, bb, { dark: 'rgba(30,25,20,0.10)', light: 'rgba(255,248,220,0.14)' });
    // cream blotches on the dark back: a few bold marks
    spots(c, { x0: 1.5, x1: 3.6, y0: 1.05, y1: 1.4, w: 2.1, h: 0.35 }, '#f1e6c2', 7, 0.035, 0.06, { seed: 21, alpha: 0.55 });
    // mouth line with a friendly upturn
    strokePath(c, [[5.0, 0.83], [4.7, 0.83], [4.4, 0.85], [4.15, 0.9], [4.06, 0.97]], 'rgba(30,20,12,.8)', 0.012);
    glow(c, 3.0, 1.3, 0.8, 0.12, 'rgba(255,255,255,0.7)', 0.25);
    // gill slit
    strokePath(c, [[3.82, 1.1], [3.74, 0.96], [3.76, 0.8]], 'rgba(30,20,12,.4)', 0.012);
    ringEye(c, 4.22, 1.03, 0.2, { ring: '#e0ab42', look: 0.5 });
  };

  const parts = {
    body: {
      z: 1,
      layers: [
        { shapes: [farFlipper], fill: { top: '#2f4559', bottom: '#40586e' }, deco: (c, bb) => volume(c, bb) },
        { shapes: [hull, dorsal, capBall], fill: { stops: [[0, back], [0.42, mid], [0.6, '#a9b9c3'], [0.74, belly], [1, belly]], dir: 'v' }, deco: bodyDeco },
      ],
    },
    tail: {
      z: 0, pivot: TP,
      layers: [{
        shapes: [tailRoot, ped, fluke], fill: { top: '#3b546c', bottom: '#6a879e' },
        deco: (c, bb) => { volume(c, bb); strokePath(c, [[0.7, 0.8], [0.5, 0.55], [0.22, 0.2]], 'rgba(20,30,40,.22)', 0.012); strokePath(c, [[0.7, 0.84], [0.5, 1.05], [0.28, 1.3]], 'rgba(20,30,40,.22)', 0.012); },
      }],
    },
    flipperA: {
      z: 2, pivot: FP,
      layers: [{
        shapes: [flipRoot, flip], fill: { top: '#3a5670', bottom: '#78939f' },
        deco: (c, bb) => { volume(c, bb); strokePath(c, [[FP[0] - 0.05, FP[1] - 0.08], [FP[0] - 0.3, FP[1] - 0.42], [FP[0] - 0.46, FP[1] - 0.58]], 'rgba(235,225,200,.5)', 0.02); },
      }],
    },
  };
  return {
    id: 'ichthyosaurus', parts,
    anchors: { head: [4.6, 0.95], mouth: [5.0, 0.83], eye: [4.28, 1.02], back: [2.6, 1.45], tail: [0.2, 0.7], belly: [2.8, 0.3], foot: [2.8, 0.3] },
    meta: { name: 'Ophthalmosaurus', lengthM: 5, epoch: 'Oberjura', ranges: { tail: [0, 0.4], flipperA: [0, 0.6] }, flap: { tail: [-0.4, 0.4], flipperA: [-0.5, 0.6] } },
  };
}
