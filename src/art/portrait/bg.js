// Hintergründe mit Fach-Motiv: look.bg = { id, c: [Farben] }
import { BG_GESCHICHTE } from './bg_geschichte.js';
import { BG_BIOLOGIE } from './bg_biologie.js';
import { BG_CHEMIE } from './bg_chemie.js';
import { base } from './bg_util.js';

export const BG = { ...BG_GESCHICHTE, ...BG_BIOLOGIE, ...BG_CHEMIE };
export function drawBackground(P, G, B, L) {
  const f = BG[B.id];
  if (f) f(P, G, B.c || [], L); else base(P, (B.c && B.c[0]) || '#e8d8b0');
}
