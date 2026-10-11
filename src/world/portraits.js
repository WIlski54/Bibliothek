// Porträts: Rahmen mit Papierschnitt-Bild und Karte zum Antippen.
// SCHNITTSTELLE (Räume rufen nur personFrame auf): personFrame(id, {w, h}) -> THREE.Group, userData.tap = Karte (kind 'info')
// STAND: Platzhalter (einfarbige Tafel mit Initialen). Der Papierschnitt-Zeichner ersetzt portraitCanvas().
import * as THREE from 'three';
import { framedPicture } from './kit.js';
import { PERSONS } from '../data/persons.js';
import { DEPT_COLORS } from './layout.js';

export function portraitCanvas(p, { w = 480, h = 640 } = {}) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d');
  g.fillStyle = DEPT_COLORS[p.dept] || '#886'; g.fillRect(0, 0, w, h);
  g.fillStyle = '#f6ebd0'; g.font = 'bold 150px Georgia, serif'; g.textAlign = 'center'; g.fillText(p.name.split(' ').map((s) => s[0]).slice(0, 2).join(''), w / 2, h / 2 + 50);
  return c;
}
export function personCard(p) {
  return { kind: 'info', tag: { geschichte: 'Geschichte', biologie: 'Biologie', chemie: 'Chemie' }[p.dept], dept: p.dept, title: p.name, sub: `${p.years} · ${p.role}`, paras: p.paras, fact: p.fact, image: portraitCanvas(p), alt: 'Porträt: ' + p.name, src: p.uncertain };
}
export function personFrame(id, { w = 0.72, h = 0.96 } = {}) {
  const p = PERSONS[id]; if (!p) throw new Error('Unbekannte Person: ' + id);
  const tex = new THREE.CanvasTexture(portraitCanvas(p)); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const f = framedPicture(tex, { w, h, name: p.name.length > 22 ? p.name.split(' ').slice(-1)[0] : p.name, sub: p.years });
  f.userData.tap = { ...personCard(p), label: p.name }; f.userData.personId = id; return f;
}
