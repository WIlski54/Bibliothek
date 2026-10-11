// Archimedes sitzend, von vorn (Hauptpose). Teile als Papierlagen; Entwurf in cm (Designeinheiten), Boden y = 0, Mitte x = 0.
// Teil: { name, z (Lage, 0 = hinten), pivot [x,y] in Metern, parent?, variants: [Teil-Beschreibung ...] }
import { K, stripe, dropShadow, eyeFront, eyeClosed, noseMouth, spanY, continueGrad } from './paintbits.js';
import { C } from './palette.js';

const rim = (shapes, w = 0.2) => K.rim(shapes, { w, color: C.rim, soft: 0.14 });
const BODY_STOPS = [[0, C.top], [0.45, C.mid], [0.85, C.low], [1, C.low]];

export function headShapes() {
  const skull = K.blob(0, 33.4, 13.0, 10.4, 0, 48);
  const cheeks = [];
  for (const s of [-1, 1]) { cheeks.push(K.blob(s * 10.6, 30.4, 5.0, 3.8, s * 0.3, 24)); }
  const chin = K.blob(0, 26.6, 7.6, 4.2, 0, 32);
  return K.S(skull, cheeks, chin);
}
export function earShape(s) { return K.poly([[s * 14.2, 34.6], [s * 13.2, 49.2], [s * 3.6, 41.2]], 2); }
const LEG_X = 4.8;
export function legShapes(s) {
  const x = s * LEG_X;
  return K.S(K.limb([[x * 0.9, 20.5, 6.4], [x * 1.0, 12, 6.2], [x * 1.16, 5, 6.2]], { per: 8 }), K.blob(x * 1.16 + s * 0.5, 2.3, 5.4, 2.8, 0, 24));
}
export function bodyShapes() {
  const haunch = [K.blob(-8.8, 8.4, 10.2, 8.4, 0, 36), K.blob(8.8, 8.4, 10.2, 8.4, 0, 36)];
  const torso = K.limb([[0, 6, 22], [0, 13, 17.5], [0, 22, 13.5]], { per: 10 });
  const chest = K.blob(0, 21.5, 8.8, 7.8, 0, 32);
  const hind = [K.blob(-12.2, 1.7, 6.2, 2.3, 0, 24), K.blob(12.2, 1.7, 6.2, 2.3, 0, 24)];
  return K.S(haunch, torso, chest, hind);
}

function faceDeco(v) {
  return (c, bb) => {
    K.shade(c, bb, { dark: 'rgba(52,40,60,.16)', light: 'rgba(255,250,235,.22)' });
    // Stirn-Tabby ("M") und Schläfen-/Wangenstriche
    for (const [x, a, l, w] of [[-3.4, -1.64, 4.4, 1.0], [0, -1.57, 5.2, 1.15], [3.4, -1.50, 4.4, 1.0]]) stripe(c, x, 43.4, a, l, w, C.stripe, 0.62, 0);
    for (const s of [-1, 1]) {
      stripe(c, s * 8.6, 42.2, s > 0 ? -2.15 : -0.99, 3.4, 0.9, C.stripe, 0.45, 0);
      for (const [y, l] of [[31.4, 4.6], [29.0, 4.2], [33.8, 3.6]]) stripe(c, s * 13.4, y, s > 0 ? Math.PI + 0.1 : -0.1, l, 0.85, C.stripe, 0.5, 0.2);
    }
    // weiße Schnauze und Kinn
    K.paintPoly(c, [[0, 31.0], [4.8, 30.0], [6.8, 27.6], [4.9, 24.6], [0, 23.4], [-4.9, 24.6], [-6.8, 27.6], [-4.8, 30.0]], C.white, 1, 2);
    K.fur(c, { x0: -5 * 0.01, y0: 24.5 * 0.01, w: 10 * 0.01, h: 5 * 0.01 }, 'rgba(160,168,182,.8)', 8, 1.5, 0.12, { seed: 11, alpha: 0.4, ang: Math.PI / 2 });
    for (const s of [-1, 1]) for (const [x, y] of [[2.6, 28.2], [3.9, 27.4], [2.4, 26.2], [4.1, 29.2]]) K.paintBlob(c, s * x, y, 0.2, 0.2, 0, '#6a6f7d', 0.7);
    for (const s of [-1, 1]) K.paintBlob(c, s * 9.4, 29.4, 2.4, 1.3, s * 0.15, '#f4a0a6', 0.3);   // Bäckchen
    const ex = 5.6, ey = 34.6;
    if (v.eyes === 'open') { eyeFront(c, -ex, ey, { r: 3.8, lid: 0.12, side: -1, pup: 0.4 }); eyeFront(c, ex, ey, { r: 3.8, lid: 0.12, side: 1, pup: 0.4 }); }
    else if (v.eyes === 'wide') { eyeFront(c, -ex, ey, { r: 3.9, lid: 0, side: -1, pup: 0.45 }); eyeFront(c, ex, ey, { r: 3.9, lid: 0, side: 1, pup: 0.45 }); }
    else if (v.eyes === 'closed') { eyeClosed(c, -ex, ey, { r: 3.7, side: -1 }); eyeClosed(c, ex, ey, { r: 3.7, side: 1 }); }
    else if (v.eyes === 'happy') { eyeClosed(c, -ex, ey, { r: 3.7, side: -1, happy: true }); eyeClosed(c, ex, ey, { r: 3.7, side: 1, happy: true }); }
    noseMouth(c, 0, 29.4, { open: v.open || 0 });
  };
}

export function sitParts() {
  const parts = [];
  // ---------------- Schwanz (hinter allem), Ansatz rechts hinten
  const tailC = [[9, 5.4, 7.2], [18.0, 3.4, 6.4], [24.6, 8.4, 5.6], [24.8, 17.0, 4.8], [21.0, 23.6, 4.0]];
  const tail = K.limb(tailC, { per: 10 });
  parts.push({ name: 'tail', z: 0, pivot: K.pt([9, 5.4]), variants: [{ layers: [{ shapes: [tail], fill: { top: C.mid, bottom: C.top }, stroke: null,
    deco: K.deco((c, bb) => { K.shade(c, bb, { dark: 'rgba(52,40,60,.2)' }); K.rings(c, tailC, { step: 3.8, color: C.stripe, w: 1.6, alpha: 0.62, reach: 8, offset: 4 }); K.paintBlob(c, 21.2, 23.2, 2.6, 2.8, 0, C.stripe, 0.85); }, rim([tail])) }] }] });

  // ---------------- Körper (Keulen, Rumpf, Brust, Hinterpfoten)
  const bs = bodyShapes(), [by0, by1] = spanY(bs);
  parts.push({ name: 'body', z: 1, pivot: K.pt([0, 4]), variants: [{ layers: [{ shapes: bs, fill: { stops: BODY_STOPS }, stroke: null,
    deco: K.deco((c, bb) => {
      K.shade(c, bb, { dark: 'rgba(52,40,60,.2)', light: 'rgba(255,250,235,.16)' });
      // weiße Brust und Bauch
      K.paintPoly(c, [[0, 27], [6.4, 22.5], [6.0, 12], [4.2, 4.2], [0, 3.4], [-4.2, 4.2], [-6.0, 12], [-6.4, 22.5]], C.white, 1, 2);
      K.fur(c, { x0: -6 * 0.01, y0: 5 * 0.01, w: 12 * 0.01, h: 20 * 0.01 }, 'rgba(170,178,192,.9)', 12, 2.4, 0.16, { seed: 21, alpha: 0.35, ang: -Math.PI / 2 });
      // Streifen an den Keulen und Flanken
      for (const s of [-1, 1]) {
        for (let i = 0; i < 4; i++) stripe(c, s * 18.4, 14.0 - i * 3.0, s > 0 ? Math.PI * 0.9 : Math.PI * 0.1, 7.0 - i * 0.5, 1.1, C.stripe, 0.5, s * 0.5);
        stripe(c, s * 8.0, 20.0, s > 0 ? -0.5 : Math.PI + 0.5, 4.6, 0.9, C.stripe, 0.4, 0);
        for (const dx of [-1.6, 0.6]) stripe(c, s * 12.6 + dx * s, 3.2, -Math.PI / 2, 2.6, 0.35, 'rgba(70,60,80,.7)', 0.6, 0);
      }
      // Schatten von Kopf und Vorderbeinen auf dem Rumpf
      dropShadow(c, headShapes(), { dy: -1.8, blur: 2.0, alpha: 0.42 });
      for (const s of [-1, 1]) dropShadow(c, legShapes(s), { dx: s * 0.4, dy: -0.4, blur: 1.4, alpha: 0.28 });
      // Halsband (zwischen Kinn und Brust) mit Messingmarke
      const col = [[-8.8, 24.8], [-5.4, 21.4], [0, 20.0], [5.4, 21.4], [8.8, 24.8]];
      K.curve(c, col, C.collarDark, 3.4, { alpha: 1 }); K.curve(c, col, C.collar, 2.6, { alpha: 1 });
      K.curve(c, col.map(([x, y]) => [x, y + 0.7]), 'rgba(255,200,190,.5)', 0.5);
      K.paintBlob(c, 0, 18.2, 1.9, 1.9, 0, C.brassDark, 1); K.paintBlob(c, 0, 18.3, 1.55, 1.55, 0, C.brass, 1); K.paintBlob(c, -0.4, 18.8, 0.55, 0.45, 0, 'rgba(255,250,210,.9)', 1);
    }, rim(bs, 0.22)) }] }] });

  // ---------------- Vorderbeine mit weißen Söckchen (Verlauf setzt den Körperverlauf fort, die Kontur beginnt erst am Knie)
  for (const s of [-1, 1]) {
    const leg = legShapes(s), x = s * LEG_X, [ly0, ly1] = spanY(leg);
    const stops = continueGrad(BODY_STOPS, [by0, by1], [ly0, ly1]);
    parts.push({ name: s < 0 ? 'legL' : 'legR', z: 2, pivot: K.pt([x, 20]), variants: [{ layers: [{ shapes: leg, fill: { stops }, stroke: null,
      deco: K.deco((c, bb) => {
        K.paintPoly(c, [[x - 8, 9.0], [x - 5.6, 11.2], [x - 3.6, 9.2], [x - 1.4, 11.4], [x + 0.8, 9.0], [x + 3, 11.2], [x + 5, 9.2], [x + 8, 10.6], [x + 8, -1], [x - 8, -1]], C.white, 1, 1);
        K.shade(c, bb, { dark: 'rgba(52,40,60,.16)', light: 'rgba(255,250,235,.1)' });
        for (const dx of [-1.6, 0.8]) stripe(c, x + s * 0.5 + dx, 3.6, -Math.PI / 2, 2.8, 0.35, 'rgba(70,60,80,.7)', 0.6, 0);
        stripe(c, x - 2.8, 15.6, 0.1, 5.4, 0.9, C.stripe, 0.4, 0.2); stripe(c, x - 2.6, 12.8, 0.1, 5.2, 0.8, C.stripe, 0.36, 0.2);
        const { ctx } = c; for (let k = 0; k < 6; k++) { ctx.save(); const [, yc] = c.tf(0, (17 - k * 1.3) * 0.01); ctx.beginPath(); ctx.rect(0, yc, c.W, c.H); ctx.clip(); ctx.globalAlpha = 0.2; rim(leg, 0.2)(c); ctx.restore(); }
      }) }] }] });
  }

  // ---------------- Pfote zum Putzen (statt des rechten Vorderbeins sichtbar): angewinkelter Arm, Pfote an der Wange
  {
    const arm = K.S(K.limb([[4.4, 19.0, 6.2], [8.4, 23.6, 5.6], [9.6, 29.4, 5.2]], { per: 8 }), K.blob(9.8, 31.4, 4.1, 3.7, 0.2, 22));
    const [ay0, ay1] = spanY(arm);
    parts.push({ name: 'lickR', z: 5, hidden: true, pivot: K.pt([4.6, 19]), variants: [{ layers: [{ shapes: arm, fill: { stops: [[0, C.mid], [0.55, C.low], [1, C.white]] }, stroke: null,
      deco: K.deco((c, bb) => {
        K.shade(c, bb, { dark: 'rgba(52,40,60,.16)', light: 'rgba(255,250,235,.1)' });
        for (const dx of [-1.6, 0.2, 1.8]) stripe(c, 9.8 + dx, 33.0, -Math.PI / 2, 2.2, 0.32, 'rgba(70,60,80,.7)', 0.6, 0);
        stripe(c, 6.6, 23.6, 0.9, 4.4, 0.8, C.stripe, 0.4, 0.2);
      }, rim(arm, 0.2)) }] }] });
    void ay0; void ay1;
  }

  // ---------------- Ohren (hinter dem Kopf, drehen um den Ansatz)
  for (const s of [-1, 1]) {
    const ear = earShape(s);
    parts.push({ name: s < 0 ? 'earL' : 'earR', z: 3, parent: 'head', pivot: K.pt([s * 8.8, 37.0]), variants: [{ layers: [{ shapes: [ear], fill: { top: C.top, bottom: C.mid }, stroke: null,
      deco: K.deco((c) => {
        K.paintPoly(c, [[s * 12.6, 37.6], [s * 12.0, 46.6], [s * 5.8, 41.0]], C.pink, 0.95, 2);
        K.paintPoly(c, [[s * 11.8, 40.0], [s * 11.4, 45.4], [s * 8.0, 41.8]], 'rgba(255,232,232,.55)', 1, 1);
        stripe(c, s * 12.4, 48.4, s > 0 ? -2.0 : -1.14, 4.0, 0.9, C.stripe, 0.5, 0);
      }, rim([ear])) }] }] });
  }

  // ---------------- Kopf (Varianten: offen, geschlossen, weit, miau, froh, sprechen)
  const hs = headShapes();
  const mk = (v) => ({ layers: [{ shapes: hs, fill: { stops: [[0, C.top], [0.45, C.mid], [0.8, C.low], [1, C.low]] }, stroke: null, deco: K.deco(faceDeco(v), rim(hs, 0.22)) }] });
  parts.push({ name: 'head', z: 4, pivot: K.pt([0, 25]), variants: [mk({ eyes: 'open' }), mk({ eyes: 'closed' }), mk({ eyes: 'wide' }), mk({ eyes: 'happy', open: 1 }), mk({ eyes: 'happy' }), mk({ eyes: 'open', open: 0.7 })] });
  return parts;
}
export const HEAD_VARIANT = { open: 0, closed: 1, wide: 2, meow: 3, happy: 4, speak: 5 };
