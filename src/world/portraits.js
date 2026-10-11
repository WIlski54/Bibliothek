// Porträts: Rahmen mit Papierschnitt-Bild und Karte zum Antippen.
// SCHNITTSTELLE (Räume rufen nur personFrame auf): personFrame(id, {w, h}) -> THREE.Group, userData.tap = Karte (kind 'info')
// Gezeichnet wird der Papierschnitt in src/art/portrait/ (Canvas 600x800, reines 2D, keine Bilddateien).
// Leistung: Ein Porträt wird erst gezeichnet, wenn es gebraucht wird (erstes Rendern des Rahmens oder Öffnen der Karte)
// und danach je Person nur einmal (Canvas und Textur werden zwischengespeichert, auch bei mehreren personFrame-Aufrufen).
import * as THREE from 'three';
import { framedPicture } from './kit.js';
import { PERSONS } from '../data/persons.js';
import { drawPortrait, PORTRAIT_W, PORTRAIT_H } from '../art/portrait/index.js';

const TAGS = { geschichte: 'Geschichte', biologie: 'Biologie', chemie: 'Chemie' };
const cache = new Map(); // "<id>|<w>x<h>" -> { canvas, drawn, p, tex }
export const portraitStats = { drawn: 0, ms: 0, last: 0 }; // Zähler für Tests

function entry(p, w, h) {
  const key = `${p.id}|${w}x${h}`; let e = cache.get(key);
  if (!e) { const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h; e = { canvas, drawn: false, p, tex: null }; cache.set(key, e); }
  return e;
}
function ensureDrawn(e) {
  if (e.drawn) return e.canvas;
  const t0 = performance.now(); drawPortrait(e.canvas, e.p); e.drawn = true;
  const ms = performance.now() - t0; portraitStats.drawn++; portraitStats.ms += ms; portraitStats.last = ms;
  return e.canvas;
}

// Gezeichnetes Porträt als Canvas (Hochformat 3:4, höchstens 600x800); je Person und Größe nur einmal gezeichnet.
export function portraitCanvas(p, { w = PORTRAIT_W, h = PORTRAIT_H } = {}) {
  return ensureDrawn(entry(p, Math.min(w, PORTRAIT_W), Math.min(h, PORTRAIT_H)));
}

// Karte für das Antippen. Das Bild wird erst beim Öffnen der Karte gezeichnet (image ist ein Getter).
export function personCard(p) {
  const e = entry(p, PORTRAIT_W, PORTRAIT_H);
  return {
    kind: 'info', tag: TAGS[p.dept], dept: p.dept, title: p.name, sub: `${p.years} · ${p.role}`, paras: p.paras, fact: p.fact,
    get image() { return ensureDrawn(e); }, alt: 'Porträt (Papierschnitt-Zeichnung): ' + p.name, src: p.uncertain, label: p.name,
  };
}

export function personFrame(id, { w = 0.72, h = 0.96 } = {}) {
  const p = PERSONS[id]; if (!p) throw new Error('Unbekannte Person: ' + id);
  const e = entry(p, PORTRAIT_W, PORTRAIT_H);
  if (!e.tex) { e.tex = new THREE.CanvasTexture(e.canvas); e.tex.colorSpace = THREE.SRGBColorSpace; e.tex.anisotropy = 4; }
  const f = framedPicture(e.tex, { w, h, name: p.name.length > 22 ? p.name.split(' ').slice(-1)[0] : p.name, sub: p.years });
  // Lazy: erst beim ersten Rendern des Bildes zeichnen (Rahmen in unsichtbaren Räumen kosten nichts)
  const pic = f.userData.pic;
  pic.onBeforeRender = function () { if (!e.drawn) { ensureDrawn(e); e.tex.needsUpdate = true; } this.onBeforeRender = () => {}; };
  f.userData.tap = personCard(p); f.userData.personId = id; return f;
}
