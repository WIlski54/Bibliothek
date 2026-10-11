// Papierschnitt-Porträts: drawPortrait(canvas, person) zeichnet eine Büste aus Papierlagen
// (Hintergrund, Kleidung, Hals, Gesicht, Haar, Zubehör) mit weichen Schatten zwischen den Lagen.
// Reihenfolge von hinten nach vorn; jede Person wird allein durch person.look beschrieben (siehe src/data/persons.js).
import { Paper, hashStr } from './paper.js';
import { makeGeo, drawNeck, drawEars, drawFace, drawSkinDetail, drawEyes, drawBrows, drawNose, drawMouth, drawGlasses } from './face.js';
import { drawHairLayer, drawHat, BEARD, stache } from './hair.js';
import { DRESS, sleeves } from './dress.js';
import { drawBackground } from './bg.js';
import { drawProps } from './props.js';
import { DEPT_COLORS } from '../../world/layout.js';

export const PORTRAIT_W = 600, PORTRAIT_H = 800;

export function drawPortrait(canvas, p) {
  const L = p.look, P = new Paper(canvas, hashStr(p.id)), G = makeGeo(L), dress = DRESS[L.dress.style];
  const PR = globalThis.__PROF; let t0 = performance.now(); // optionale Zeitmessung (tools/portrait-entry.js)
  const T = (n) => { if (PR) { P.ctx.getImageData(0, 0, 1, 1); const t = performance.now(); PR[n] = (PR[n] || 0) + t - t0; t0 = t; } };
  drawBackground(P, G, L.bg, L); T('hintergrund');
  drawHairLayer(P, G, 'back', L.hair);
  drawNeck(P, G, L.neck);
  dress.base(P, G, L.dress); dress.top(P, G, L.dress); sleeves(P, G); T('kleidung');
  drawHat(P, G, 'back', L.hat);
  drawHairLayer(P, G, 'mid', L.hair);
  drawEars(P, G, L.ears);
  drawFace(P, G); drawSkinDetail(P, G); T('gesicht');
  if (L.beard) BEARD[L.beard.style](P, G, L.beard);
  if (L.sideburns) BEARD.koteletten(P, G, L.sideburns);
  T('bart');
  drawMouth(P, G);
  if (L.stache) stache(P, G, L.stache);
  drawNose(P, G); drawEyes(P, G); drawBrows(P, G);
  drawHairLayer(P, G, 'front', L.hair);
  drawHat(P, G, 'front', L.hat);
  if (L.glasses) drawGlasses(P, G, L.glasses);
  T('haar-hut');
  drawProps(P, G, L); T('requisiten');
  P.finish(); P.mat(DEPT_COLORS[p.dept] || '#886'); T('papier-rahmen');
  return canvas;
}
