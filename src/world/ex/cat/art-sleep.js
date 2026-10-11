// Archimedes schlafend, zusammengerollt (Brötchen-Haltung), leicht von der Seite. Entwurf in cm, Boden y = 0, Kopf rechts.
import { K, stripe, dropShadow, eyeFront, eyeClosed } from './paintbits.js';
import { C } from './palette.js';

const rim = (shapes, w = 0.2) => K.rim(shapes, { w, color: C.rim, soft: 0.14 });
const SL_STOPS = [[0, C.top], [0.5, C.mid], [1, C.low]];
const HX = 10.5, HY = 8.2;

export function sleepHeadShapes() {
  return K.S(K.blob(HX, HY, 9.4, 7.8, -0.08, 40), K.blob(HX + 2, HY - 5, 6.4, 3.2, 0, 24), K.blob(HX - 7.6, HY - 2, 3.6, 3.2, 0, 16), K.blob(HX + 7.6, HY - 2, 3.6, 3.2, 0, 16));
}
export function sleepParts() {
  const parts = [];
  const bodyS = K.S(K.blob(-3, 9.4, 19.5, 9.4, 0, 44), K.blob(-10, 11.6, 11.5, 9.8, 0.1, 32), K.blob(4, 6, 12, 6, 0, 24));
  parts.push({ name: 'body', z: 0, pivot: K.pt([0, 0]), variants: [{ layers: [{ shapes: bodyS, fill: { stops: SL_STOPS }, stroke: null,
    deco: K.deco((c, bb) => {
      K.shade(c, bb, { dark: 'rgba(52,40,60,.24)', light: 'rgba(255,250,235,.16)' });
      for (let i = 0; i < 6; i++) stripe(c, -18 + i * 3.8, 20.4 - Math.abs(i - 2.5) * 0.6, -Math.PI / 2 - 0.25, 8.4, 1.25, C.stripe, 0.5, 0.35);
      for (let i = 0; i < 3; i++) stripe(c, -18.6, 9.4 - i * 2.8, Math.PI * 0.05, 6.4, 1.0, C.stripe, 0.4, 0.3);
      K.fur(c, bb, 'rgba(70,78,94,.8)', 14, 3, 0.16, { seed: 8, alpha: 0.22, ang: -0.8 });
      dropShadow(c, sleepHeadShapes(), { dx: 0.4, dy: -1.6, blur: 2.2, alpha: 0.36 });
    }, rim(bodyS, 0.22)) }] }] });
  // Ohren (hinter dem Kopf)
  const earL = K.poly([[HX - 8.8, HY + 4], [HX - 8.4, HY + 14.8], [HX - 1.2, HY + 7.6]], 2);
  const earR = K.poly([[HX + 2.4, HY + 7.6], [HX + 9.4, HY + 14.6], [HX + 9.6, HY + 3.4]], 2);
  for (const [name, ear, pk] of [['earL', earL, [-8.4, 8.8, 1]], ['earR', earR, [-1, 9.6, 1]]]) {
    const s = name === 'earL' ? -1 : 1;
    parts.push({ name, z: 0.8, parent: 'head', pivot: K.pt([HX + (s < 0 ? -5 : 5.4), HY + 6.2]), variants: [{ layers: [{ shapes: [ear], fill: { top: C.top, bottom: C.mid }, stroke: null,
      deco: K.deco((c) => { K.paintPoly(c, s < 0 ? [[HX - 7.2, HY + 5.6], [HX - 7.0, HY + 12.6], [HX - 2.4, HY + 7.6]] : [[HX + 3.4, HY + 8], [HX + 8.2, HY + 12.4], [HX + 8.2, HY + 5]], C.pink, 0.9, 2); }, rim([ear])) }] }] });
  }
  const hs = sleepHeadShapes();
  const mk = (v) => ({ layers: [{ shapes: hs, fill: { stops: [[0, C.top], [0.5, C.mid], [0.85, C.low], [1, C.low]] }, stroke: null,
    deco: K.deco((c, bb) => {
      K.shade(c, bb, { dark: 'rgba(52,40,60,.16)', light: 'rgba(255,250,235,.2)' });
      for (const [dx, a, l] of [[-3, -1.6, 3.6], [0, -1.57, 4.2], [3, -1.52, 3.6]]) stripe(c, HX + dx, HY + 7.6, a, l, 0.9, C.stripe, 0.6, 0);
      for (const s of [-1, 1]) for (const y of [-1.4, -3.4]) stripe(c, HX + s * 9.6, HY + y, s > 0 ? Math.PI + 0.1 : -0.1, 3.6, 0.8, C.stripe, 0.5, 0.2);
      K.paintPoly(c, [[HX, HY - 1.6], [HX + 4.2, HY - 2.4], [HX + 5.6, HY - 5.4], [HX + 3.6, HY - 7.6], [HX, HY - 8.2], [HX - 3.6, HY - 7.6], [HX - 5.6, HY - 5.4], [HX - 4.2, HY - 2.4]], C.white, 1, 2);
      const ex = 4.6, ey = HY + 1.2;
      if (v.eyes === 'closed') { eyeClosed(c, HX - ex, ey, { r: 3.1, side: -1, happy: false }); eyeClosed(c, HX + ex, ey, { r: 3.1, side: 1, happy: false }); }
      else if (v.eyes === 'slit') { eyeFront(c, HX - ex, ey, { r: 3.1, lid: 0.62, side: -1, pup: 0.3 }); eyeFront(c, HX + ex, ey, { r: 3.1, lid: 0.62, side: 1, pup: 0.3 }); }
      else { eyeFront(c, HX - ex, ey, { r: 3.4, lid: 0, side: -1, pup: 0.5 }); eyeFront(c, HX + ex, ey, { r: 3.4, lid: 0, side: 1, pup: 0.5 }); }
      K.paintPoly(c, [[HX - 1.6, HY - 2.2], [HX + 1.6, HY - 2.2], [HX, HY - 3.9]], C.nose, 1, 2);
      K.curve(c, [[HX, HY - 3.8], [HX, HY - 4.8]], C.mouth, 0.28); K.curve(c, [[HX, HY - 4.8], [HX - 1.0, HY - 5.7], [HX - 2.4, HY - 5.2]], C.mouth, 0.28); K.curve(c, [[HX, HY - 4.8], [HX + 1.0, HY - 5.7], [HX + 2.4, HY - 5.2]], C.mouth, 0.28);
    }, rim(hs, 0.22)) }] });
  parts.push({ name: 'head', z: 2, pivot: K.pt([HX, 1]), variants: [mk({ eyes: 'closed' }), mk({ eyes: 'slit' }), mk({ eyes: 'wide' })] });
  // Vorderpfoten (weiß) unter dem Kinn
  for (const [name, x] of [['pawL', HX - 5.4], ['pawR', HX + 5.8]]) {
    const paw = K.S(K.blob(x, 3.0, 5.0, 3.2, 0, 24));
    parts.push({ name, z: 3, pivot: K.pt([x, 3]), variants: [{ layers: [{ shapes: paw, fill: { top: C.low, bottom: C.white }, stroke: null,
      deco: K.deco((c, bb) => { K.shade(c, bb, { dark: 'rgba(52,40,60,.14)' }); for (const dx of [-1.4, 0.8]) stripe(c, x + dx, 3.4, -Math.PI / 2, 2.4, 0.35, 'rgba(70,60,80,.7)', 0.6, 0); }, rim(paw, 0.2)) }] }] });
  }
  // Schwanz: legt sich vorn um den Körper
  const tailC = [[-20, 9, 6.2], [-22.6, 4.6, 5.8], [-16, 1.4, 5.4], [-4, 1.6, 5.0], [6, 2.0, 4.4]];
  const tail = K.limb(tailC, { per: 10 });
  parts.push({ name: 'tail', z: 2.5, pivot: K.pt([-20, 8]), variants: [{ layers: [{ shapes: [tail], fill: { top: C.mid, bottom: C.top }, stroke: null,
    deco: K.deco((c, bb) => { K.shade(c, bb, { dark: 'rgba(52,40,60,.2)' }); K.rings(c, tailC, { step: 3.8, color: C.stripe, w: 1.6, alpha: 0.62, reach: 8, offset: 3 }); K.paintBlob(c, 5.4, 2.0, 2.5, 2.4, 0, C.stripe, 0.85); }, rim([tail])) }] }] });
  return parts;
}
export const SLEEP_HEAD = { closed: 0, slit: 1, wide: 2 };
