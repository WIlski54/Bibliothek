// Papierschnitt-Figuren für den Raum Geschichte: Specs aus dem Ägypten-Buch (Kopien unter ./art/), hier zu EINEM Schnittteil
// zusammengefasst und mit der Papierschnitt-Pipeline (src/lib/papercut.js) zu einem Mesh gebaut.
import * as THREE from 'three';
import { buildCut } from '../../../lib/papercut.js';
import { tutmaske } from './art/eg_mask.js';
import { doppelkrone } from './art/eg_crowns.js';
import rosetta_stein from './art/eg_rosetta.js';
import { papyrusrolle } from './art/eg_script.js';
import { pyramide_schnitt } from './art/eg_schnitt.js';

export const SPECS = { tutmaske, doppelkrone, rosetta_stein, papyrusrolle, pyramide_schnitt };

// Alle Teile einer Spec zu einem Teil (Schichten in Reihenfolge der Teile, z aufsteigend)
export function mergeParts(spec, extra = {}) {
  const parts = Object.values(spec.parts).slice().sort((a, b) => (a.z ?? 0) - (b.z ?? 0));
  const afters = parts.map((p) => p.after).filter(Boolean);
  const out = { layers: parts.flatMap((p) => p.layers), ...extra };
  if (afters.length) out.after = (c) => afters.forEach((f) => f(c));
  return out;
}

// Baut ein Schnittteil. id = Name in SPECS; height = Zielhöhe in Metern (der Spec-Höhe angepasst); Rückgabe { mesh, canvas, bbox, w, h }
// Das Mesh steht mit der Unterkante auf y=0, Mitte x=0, Vorderseite +z, Rückseite bei z=-thickness.
export function paperCut(id, { height, thickness = 0.02, border = 0.012, ppu = 1400, maxTex = 1024, edge, paper, grain, name } = {}) {
  const spec = SPECS[id]();
  const ws = height / spec.meta.heightM;
  const extra = {}; if (edge) extra.edge = edge; if (paper) extra.paper = paper; if (grain != null) extra.grain = grain;
  const part = mergeParts(spec, extra);
  const cut = buildCut(part, { worldScale: ws, ppu, thickness, border, maxTex, name: name || ('gesch:' + id) });
  // Modellkoordinaten sind schon in Metern ab Spec-Skala; mesh.scale = ws
  const bb = cut.bbox; // Modell-Einheiten
  return { mesh: cut.mesh, canvas: cut.canvas, bbox: bb, ws, spec, w: (bb.x1 - bb.x0) * ws, h: (bb.y1 - bb.y0) * ws, cut };
}

// Kartenbild: Canvas in Zielbreite (transparenter Rand bleibt)
export function cardImage(canvas, maxW = 520) {
  const k = Math.min(1, maxW / canvas.width), c = document.createElement('canvas');
  c.width = Math.round(canvas.width * k); c.height = Math.round(canvas.height * k);
  c.getContext('2d').drawImage(canvas, 0, 0, c.width, c.height); return c;
}

// weicher Schatten hinter einem Schnittteil: Silhouette (Alpha) des Canvas, schwarz, unscharf; liefert Mesh (Plane) passend zum Schnittteil
const shadowMats = new Map();
export function shadowFor(pc, { blur = 0.03, opacity = 0.5, dx = 0.025, dy = -0.03 } = {}) {
  const src = pc.canvas, k = 256 / Math.max(src.width, src.height), w = Math.max(8, Math.round(src.width * k)), h = Math.max(8, Math.round(src.height * k));
  const pad = 24, c = document.createElement('canvas'); c.width = w + pad * 2; c.height = h + pad * 2; const g = c.getContext('2d');
  g.filter = `blur(${Math.max(2, Math.round(blur * Math.max(w, h) * 3))}px)`;
  g.drawImage(src, pad, pad, w, h); g.filter = 'none';
  // Alpha -> schwarz
  g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, c.width, c.height);
  const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity, depthWrite: false });
  const W = (pc.bbox.x1 - pc.bbox.x0) * pc.ws, H = (pc.bbox.y1 - pc.bbox.y0) * pc.ws;
  const pw = W * (1 + (pad * 2) / w), ph = H * (1 + (pad * 2) / h);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), mat);
  m.position.set(((pc.bbox.x0 + pc.bbox.x1) / 2) * pc.ws + dx, ((pc.bbox.y0 + pc.bbox.y1) / 2) * pc.ws + dy, 0);
  m.renderOrder = 1; return m;
}
