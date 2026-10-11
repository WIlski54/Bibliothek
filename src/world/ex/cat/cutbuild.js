// Papierschnitt-Teil als FLACHES Mesh (eine Fläche statt Extrusion, ein Zeichenaufruf) mit mehreren austauschbaren Texturen
// (Varianten: z. B. Kopf mit offenen / geschlossenen Augen). Nutzt die Papierschnitt-Technik der Popup-Bücher (lib/papercut.js):
// Lagen -> Vereinigung -> Papierrand -> bemalte Textur. Alle Texturen entstehen einmal beim Bauen.
import * as THREE from 'three';
import ClipperLib from 'clipper-lib';
import { unionPolys, offsetPaths, pathsToShapes, bboxOf, paintCut } from '../../../lib/papercut.js';
import { hashStr } from '../../../lib/util.js';

const SC = 4000;

/**
 * variants: Liste von Teil-Beschreibungen { layers: [{shapes, fill, deco, stroke}], paper?, grain?, after? };
 * alle Varianten teilen sich die Umrisse (shapes) der ersten, nur die Bemalung darf sich unterscheiden.
 * opts: { name, border (m Papierrand), ppu (Pixel je m, Obergrenze), maxTex, tilt (Normalenneigung nach oben, rad), glow (Eigenleuchten 0..1) }
 * Rückgabe: { mesh, textures, bbox, setVariant(i), dispose() }
 */
export function cutFlat(variants, { name = 'cut', border = 0.007, ppu = 1500, maxTex = 512, tilt = 0.5, glow = 0.14 } = {}) {
  const all = variants[0].layers.flatMap((l) => l.shapes);
  let outline = unionPolys(all);
  outline = offsetPaths(outline, border, 0.003);
  outline = ClipperLib.Clipper.CleanPolygons(outline, Math.max(1, 0.0015 * SC));
  const { shapes, outers, holes } = pathsToShapes(outline);
  const outlinePolys = outers.concat(holes);
  const bb = bboxOf(outlinePolys);
  const S = Math.max(6, Math.min(ppu, maxTex / Math.max(bb.w, bb.h)));
  const paints = variants.map((v, i) => paintCut(v, outlinePolys, bb, S, hashStr(name) + i));
  const p0 = paints[0], uw = p0.Wpx / S, uh = p0.Hpx / S;
  const textures = paints.map((p) => {
    const t = new THREE.CanvasTexture(p.canvas);
    t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; t.generateMipmaps = true; t.minFilter = THREE.LinearMipmapLinearFilter;
    return t;
  });
  const geo = new THREE.ShapeGeometry(shapes, 1);
  const pos = geo.attributes.position, uv = geo.attributes.uv, nor = geo.attributes.normal;
  const ny = Math.sin(tilt), nz = Math.cos(tilt);
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - p0.ox) / uw, 1 - (p0.oy - pos.getY(i)) / uh);
    nor.setXYZ(i, 0, ny, nz);
  }
  uv.needsUpdate = true; nor.needsUpdate = true;
  const material = new THREE.MeshLambertMaterial({ map: textures[0], emissive: 0xffffff, emissiveMap: textures[0], emissiveIntensity: glow });
  const mesh = new THREE.Mesh(geo, material);
  mesh.name = name; mesh.raycast = () => {};
  const setVariant = (i) => { const t = textures[Math.min(Math.max(0, i | 0), textures.length - 1)]; if (material.map !== t) { material.map = t; material.emissiveMap = t; } };
  return { mesh, textures, material, bbox: bb, setVariant, dispose() { for (const t of textures) t.dispose(); geo.dispose(); material.dispose(); } };
}
