// Archimedes im Profil (Dreiviertelkopf), blickt nach +x: gehen, traben, rennen, springen, strecken. Entwurf in cm, Boden y = 0.
import { K, stripe, dropShadow, eyeFront, eyeClosed, spanY, continueGrad } from './paintbits.js';
import { C } from './palette.js';

const rim = (shapes, w = 0.2) => K.rim(shapes, { w, color: C.rim, soft: 0.14 });
const BODY_STOPS = [[0, C.top], [0.5, C.mid], [0.9, C.low], [1, C.low]];
const HX = 18.6, HY = 28.6;   // Kopfmitte

export function walkHeadShapes() {
  const skull = K.blob(HX, HY, 10.0, 8.8, 0, 44);
  const muzzle = K.blob(HX + 8.2, HY - 3.0, 4.9, 3.9, 0, 28);
  const cheek = K.blob(HX - 1.8, HY - 5.0, 6.4, 3.6, 0.1, 24);
  const ruff = K.tuft(HX - 8.4, HY - 3.6, Math.PI + 0.5, 5.0, 3.6, 0.25);
  return K.S(skull, muzzle, cheek, ruff);
}
export function walkEarShapes() {
  return {
    near: K.poly([[HX - 7.4, HY + 5.4], [HX - 5.6, HY + 16.8], [HX + 1.0, HY + 8.4]], 2),
    far: K.poly([[HX + 2.2, HY + 8.0], [HX + 6.8, HY + 16.2], [HX + 8.8, HY + 5.2]], 2),
  };
}
const bodyShapes = () => K.S(K.blob(-1, 17.8, 15.2, 8.0, 0, 40), K.blob(8.6, 18.6, 8.6, 8.4, 0, 28), K.blob(-10, 17.8, 8.8, 8.4, 0, 28));
const foreLeg = (x) => K.S(K.limb([[x, 18.8, 6.6], [x + 0.7, 11, 5.0], [x + 0.9, 3.6, 4.6]], { per: 8 }), K.blob(x + 2.5, 1.8, 4.8, 2.1, 0, 20));
const hindLeg = (x) => K.S(K.blob(x + 0.5, 15.8, 6.4, 7.0, 0.15, 24), K.limb([[x, 13, 5.6], [x - 1.2, 7.4, 4.2], [x - 0.5, 3.4, 4.2]], { per: 8 }), K.blob(x + 1.6, 1.8, 4.8, 2.1, 0, 20));

function headFace(v) {
  return (c, bb) => {
    K.shade(c, bb, { dark: 'rgba(52,40,60,.16)', light: 'rgba(255,250,235,.2)' });
    for (const [dx, a, l, w] of [[-2.6, -1.62, 4.2, 0.95], [0.4, -1.57, 4.8, 1.05], [3.4, -1.45, 4.0, 0.95]]) stripe(c, HX + dx, HY + 8.5, a, l, w, C.stripe, 0.6, 0);
    for (const [y, l] of [[-1.4, 4.4], [-3.6, 4.0], [0.8, 3.4]]) stripe(c, HX - 9.6, HY + y, -0.1, l, 0.85, C.stripe, 0.5, 0.2);
    // weiße Schnauze und Kinn
    K.paintPoly(c, [[HX + 3.2, HY - 1.2], [HX + 9.0, HY + 0.4], [HX + 13.0, HY - 2.4], [HX + 13.0, HY - 5.8], [HX + 9.0, HY - 8.0], [HX + 3.6, HY - 7.6], [HX + 1.2, HY - 4.2]], C.white, 1, 2);
    K.fur(c, { x0: (HX + 3) * 0.01, y0: (HY - 7) * 0.01, w: 9 * 0.01, h: 6 * 0.01 }, 'rgba(160,168,182,.8)', 7, 1.4, 0.12, { seed: 5, alpha: 0.4, ang: 0 });
    // Augen: nahes (links) und fernes (rechts, kleiner)
    const e1 = [HX - 0.6, HY + 1.8], e2 = [HX + 6.4, HY + 1.7];
    if (v.eyes === 'open') { eyeFront(c, e1[0], e1[1], { r: 3.5, lid: 0.15, side: -1, pup: 0.34 }); eyeFront(c, e2[0], e2[1], { r: 2.8, lid: 0.15, side: 1, pup: 0.34 }); }
    else if (v.eyes === 'wide') { eyeFront(c, e1[0], e1[1], { r: 3.7, lid: 0, side: -1, pup: 0.45 }); eyeFront(c, e2[0], e2[1], { r: 3.0, lid: 0, side: 1, pup: 0.45 }); }
    else { const hp = v.eyes === 'happy'; eyeClosed(c, e1[0], e1[1], { r: 3.5, side: -1, happy: hp }); eyeClosed(c, e2[0], e2[1], { r: 2.8, side: 1, happy: hp }); }
    // Nase vorn an der Schnauze, Mund
    const nx = HX + 13.2, ny = HY - 2.2;
    K.paintPoly(c, [[nx - 1.4, ny + 1.0], [nx + 1.2, ny + 0.6], [nx + 1.5, ny - 0.8], [nx - 0.4, ny - 1.5]], C.nose, 1, 2);
    K.paintBlob(c, nx - 0.3, ny + 0.2, 0.45, 0.25, 0, 'rgba(255,255,255,.6)', 1);
    if (v.open) { K.paintPoly(c, [[nx - 0.4, ny - 2.6], [nx + 0.8, ny - 2.8], [nx + 1.0, ny - 6.2], [nx - 3.4, ny - 6.0], [nx - 4.6, ny - 3.4]], '#6b222c', 1, 2); K.paintBlob(c, nx - 1.6, ny - 5.2, 1.8, 0.9, 0.2, '#f08c98', 1); }
    else K.curve(c, [[nx - 0.2, ny - 1.6], [nx - 0.6, ny - 3.2], [nx - 2.6, ny - 3.8], [nx - 4.2, ny - 3.2]], C.mouth, 0.3);
    for (const [x, y] of [[HX + 9, HY - 2], [HX + 10.6, HY - 3.0], [HX + 8.4, HY - 4.0]]) K.paintBlob(c, x, y, 0.2, 0.2, 0, '#6a6f7d', 0.7);
  };
}

export function walkParts() {
  const parts = [];
  const bs = bodyShapes(), [by0, by1] = spanY(bs);
  // ---------------- Schwanz (ganz hinten), Ansatz an der Hüfte
  const tailC = [[-17, 19.6, 5.6], [-24, 22, 5.0], [-29.4, 29, 4.6], [-29.2, 37.4, 4.2], [-24.6, 41.8, 3.6]];
  const tail = K.limb(tailC, { per: 10 });
  parts.push({ name: 'tail', z: 0, pivot: K.pt([-17, 19.6]), variants: [{ layers: [{ shapes: [tail], fill: { top: C.mid, bottom: C.top }, stroke: null,
    deco: K.deco((c, bb) => { K.shade(c, bb, { dark: 'rgba(52,40,60,.2)' }); K.rings(c, tailC, { step: 3.9, color: C.stripe, w: 1.6, alpha: 0.62, reach: 8, offset: 4 }); K.paintBlob(c, -24.8, 41.6, 2.9, 2.9, 0, C.stripe, 0.85); }, rim([tail])) }] }] });

  // ---------------- ferne Beine (dunkler), dann Rumpf, nahe Beine, Kopf
  const leg = (name, shapes, px, py, z, far, hind) => {
    const [ly0, ly1] = spanY(shapes);
    const stops = far ? [[0, C.far], [0.6, C.farB], [1, C.farB]] : continueGrad(BODY_STOPS, [by0, by1], [ly0, ly1]);
    parts.push({ name, z, pivot: K.pt([px, py]), variants: [{ layers: [{ shapes, fill: { stops }, stroke: null,
      deco: K.deco((c, bb) => {
        const x = px;
        K.paintPoly(c, [[x - 8, 8.6], [x - 5.6, 10.6], [x - 3.2, 8.8], [x - 1, 10.8], [x + 1.4, 8.6], [x + 3.6, 10.4], [x + 8, 9.0], [x + 8, -1], [x - 8, -1]], far ? '#e6e1d6' : C.white, 1, 1);
        K.shade(c, bb, { dark: 'rgba(52,40,60,.16)', light: 'rgba(255,250,235,.1)' });
        stripe(c, x - 2.4, hind ? 13 : 15.2, 0.1, 4.8, 0.85, C.stripe, 0.4, 0.2); stripe(c, x - 2.2, hind ? 10.4 : 12.4, 0.1, 4.6, 0.8, C.stripe, 0.36, 0.2);
        const { ctx } = c; for (let k = 0; k < 5; k++) { ctx.save(); const [, yc] = c.tf(0, (18 - k * 1.4) * 0.01); ctx.beginPath(); ctx.rect(0, yc, c.W, c.H); ctx.clip(); ctx.globalAlpha = 0.25; rim(shapes, 0.2)(c); ctx.restore(); }
      }) }] }] });
  };
  leg('hindFar', hindLeg(-5.8), -5.8, 19, 0.2, true, true);
  leg('foreFar', foreLeg(6.6), 6.6, 20, 0.3, true, false);

  parts.push({ name: 'body', z: 1, pivot: K.pt([0, 12]), variants: [{ layers: [{ shapes: bs, fill: { stops: BODY_STOPS }, stroke: null,
    deco: K.deco((c, bb) => {
      K.shade(c, bb, { dark: 'rgba(52,40,60,.2)', light: 'rgba(255,250,235,.16)' });
      // helle Brust/Bauch
      K.paintPoly(c, [[17, 22], [17.6, 14], [10, 10.4], [0, 10.6], [-6, 11.8], [-2, 14], [6, 16.2], [11, 20]], C.white, 1, 2);
      for (let i = 0; i < 7; i++) stripe(c, -15 + i * 4.2, 25.4, -Math.PI / 2 - 0.12, 7.6 - Math.abs(i - 3) * 0.3, 1.2, C.stripe, 0.5, 0.35);
      stripe(c, -14, 18, 0.08, 8, 0.9, C.stripe, 0.4, 0.3);
      dropShadow(c, walkHeadShapes(), { dy: -1.8, blur: 2.0, alpha: 0.38 });
      // Halsband mit Marke am Hals
      const col = [[10.2, 26.4], [13.4, 23.6], [16.0, 20.0]];
      K.curve(c, col, C.collarDark, 3.2); K.curve(c, col, C.collar, 2.4);
      K.paintBlob(c, 14.6, 18.8, 1.7, 1.7, 0, C.brassDark, 1); K.paintBlob(c, 14.6, 18.9, 1.4, 1.4, 0, C.brass, 1); K.paintBlob(c, 14.2, 19.4, 0.5, 0.4, 0, 'rgba(255,250,210,.9)', 1);
    }, rim(bs, 0.22)) }] }] });

  leg('hindNear', hindLeg(-11.8), -11.8, 19, 2, false, true);
  leg('foreNear', foreLeg(12.2), 12.2, 20, 2.1, false, false);

  // ---------------- Ohren, Kopf
  const ears = walkEarShapes();
  for (const [name, key] of [['earFar', 'far'], ['earNear', 'near']]) {
    const ear = ears[key], near = key === 'near';
    const cx = near ? HX - 3.6 : HX + 5.4;
    parts.push({ name, z: near ? 3.2 : 3, parent: 'head', pivot: K.pt([cx, HY + 6.6]), variants: [{ layers: [{ shapes: [ear], fill: near ? { top: C.top, bottom: C.mid } : { top: C.far, bottom: C.farB }, stroke: null,
      deco: K.deco((c) => {
        if (near) K.paintPoly(c, [[HX - 6.2, HY + 7.6], [HX - 5.2, HY + 14.6], [HX - 0.4, HY + 9.2]], C.pink, 0.95, 2);
        else K.paintPoly(c, [[HX + 4.0, HY + 9.4], [HX + 6.8, HY + 14.2], [HX + 7.8, HY + 7.4]], '#e3a1a4', 0.9, 2);
      }, rim([ear])) }] }] });
  }
  const hs = walkHeadShapes();
  const mk = (v) => ({ layers: [{ shapes: hs, fill: { stops: [[0, C.top], [0.45, C.mid], [0.8, C.low], [1, C.low]] }, stroke: null, deco: K.deco(headFace(v), rim(hs, 0.22)) }] });
  parts.push({ name: 'head', z: 4, pivot: K.pt([HX - 4, HY - 5]), variants: [mk({ eyes: 'open' }), mk({ eyes: 'closed' }), mk({ eyes: 'wide' }), mk({ eyes: 'happy', open: 1 }), mk({ eyes: 'open', open: 1 })] });
  return parts;
}
export const WALK_HEAD = { open: 0, closed: 1, wide: 2, meow: 3, speak: 4 };
// Drehpunkte für die Animation (Meter)
export const WALK_PIV = { hip: K.pt([-8, 19]), shoulder: K.pt([9, 20]) };
