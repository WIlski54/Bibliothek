// Paper-cut pipeline: layered polygon spec -> union -> paper border (offset) -> extruded THREE mesh with painted canvas texture.
import * as THREE from 'three';
import ClipperLib from 'clipper-lib';
import { mulberry32, hashStr, clamp } from './util.js';

const SC = 4000; // model units (meters) -> clipper integers

let MAX_ANISO = 4;
export function setMaxAnisotropy(n) { MAX_ANISO = n; }

// ---------- clipper helpers ----------
const toPath = (poly) => poly.map(([x, y]) => ({ X: Math.round(x * SC), Y: Math.round(y * SC) }));
const fromPath = (p) => p.map((q) => [q.X / SC, q.Y / SC]);

export function area(poly) { let a = 0; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) a += (poly[j][0] + poly[i][0]) * (poly[j][1] - poly[i][1]); return a / 2; }
export const ccw = (poly) => (area(poly) < 0 ? poly.slice().reverse() : poly);

export function unionPolys(polys) {
  const c = new ClipperLib.Clipper();
  for (const p of polys) {
    if (p.length >= 3) c.AddPath(toPath(ccw(p)), ClipperLib.PolyType.ptSubject, true);
  }
  const sol = new ClipperLib.Paths();
  c.Execute(ClipperLib.ClipType.ctUnion, sol, ClipperLib.PolyFillType.pftNonZero, ClipperLib.PolyFillType.pftNonZero);
  return sol;
}

export function offsetPaths(paths, delta, arcTol = 0.004) {
  const co = new ClipperLib.ClipperOffset(2, Math.max(1, arcTol * SC));
  co.AddPaths(paths, ClipperLib.JoinType.jtRound, ClipperLib.EndType.etClosedPolygon);
  const out = new ClipperLib.Paths();
  co.Execute(out, delta * SC);
  return out;
}

function cleanPaths(paths, dist) {
  return ClipperLib.Clipper.CleanPolygons(paths, Math.max(1, dist * SC));
}

function pip(pt, poly) {
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const xi = poly[i][0], yi = poly[i][1], xj = poly[j][0], yj = poly[j][1];
    if (((yi > pt[1]) !== (yj > pt[1])) && (pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi)) inside = !inside;
  }
  return inside;
}

export function pathsToShapes(paths) {
  const outers = [], holes = [];
  for (const p of paths) {
    if (p.length < 3) continue;
    (ClipperLib.Clipper.Orientation(p) ? outers : holes).push(fromPath(p));
  }
  const shapes = outers.map((pts) => ({ pts, shape: new THREE.Shape(pts.map((q) => new THREE.Vector2(q[0], q[1]))) }));
  for (const h of holes) {
    const host = shapes.find((s) => pip(h[0], s.pts)) || shapes[0];
    if (host) host.shape.holes.push(new THREE.Path(h.map((q) => new THREE.Vector2(q[0], q[1]))));
  }
  return { shapes: shapes.map((s) => s.shape), outers, holes };
}

// ---------- grain overlay (paper fibres) ----------
let GRAIN = null;
export function grainCanvas() {
  if (GRAIN) return GRAIN;
  const c = document.createElement('canvas'); c.width = c.height = 256;
  const g = c.getContext('2d');
  const img = g.createImageData(256, 256);
  const r = mulberry32(99);
  for (let i = 0; i < 256 * 256; i++) {
    const v = 215 + Math.floor(r() * 40);
    img.data[i * 4] = v; img.data[i * 4 + 1] = v - 3; img.data[i * 4 + 2] = v - 10; img.data[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  // fibres
  g.globalAlpha = 0.08; g.strokeStyle = '#6b5a3a'; g.lineWidth = 0.6;
  for (let i = 0; i < 160; i++) {
    const x = r() * 256, y = r() * 256, a = r() * 6.28, l = 6 + r() * 14;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + r() * 3, y + Math.sin(a) * l * 0.5 + r() * 3, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  GRAIN = c; return c;
}

// ---------- painting ----------
function tracePath(ctx, polys, tf) {
  ctx.beginPath();
  for (const p of polys) {
    for (let i = 0; i < p.length; i++) {
      const [X, Y] = tf(p[i][0], p[i][1]);
      if (i === 0) ctx.moveTo(X, Y); else ctx.lineTo(X, Y);
    }
    ctx.closePath();
  }
}
function bboxOf(polys) {
  let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
  for (const p of polys) for (const [x, y] of p) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  return { x0, y0, x1, y1, w: x1 - x0, h: y1 - y0 };
}
export { bboxOf };

function makeFill(ctx, fill, bb, tf) {
  if (!fill) return '#888';
  if (typeof fill === 'string') return fill;
  const [ax, ay] = tf(bb.x0, bb.y1), [bx, by] = tf(bb.x0, bb.y0);
  let g;
  if (fill.dir === 'h') {
    const [lx, ly] = tf(bb.x0, (bb.y0 + bb.y1) / 2), [rx, ry] = tf(bb.x1, (bb.y0 + bb.y1) / 2);
    g = ctx.createLinearGradient(lx, ly, rx, ry);
  } else g = ctx.createLinearGradient(ax, ay, bx, by);
  if (fill.stops) fill.stops.forEach(([t, c]) => g.addColorStop(t, c));
  else { g.addColorStop(0, fill.top); g.addColorStop(1, fill.bottom); }
  return g;
}

export function paintCut(part, outlinePolys, bb, S, seed) {
  const pad = 2;
  const Wpx = Math.max(8, Math.ceil(bb.w * S) + pad * 2), Hpx = Math.max(8, Math.ceil(bb.h * S) + pad * 2);
  const canvas = document.createElement('canvas'); canvas.width = Wpx; canvas.height = Hpx;
  const ctx = canvas.getContext('2d');
  // map model -> canvas, with pad: uv covers whole canvas => bbox is expanded by pad px
  const ox = bb.x0 - pad / S, oy = bb.y1 + pad / S;
  const tf = (x, y) => [(x - ox) * S, (oy - y) * S];
  const rng = mulberry32(seed);
  // paper base (white border + under-paint)
  tracePath(ctx, outlinePolys, tf);
  ctx.fillStyle = part.paper || '#f6efdc'; ctx.fill();
  const c = { ctx, S, tf, rng, px: tf, W: Wpx, H: Hpx };
  for (const layer of part.layers) {
    const lu = unionPolys(layer.shapes).map(fromPath);
    const lb = bboxOf(lu);
    ctx.save();
    tracePath(ctx, lu, tf);
    ctx.fillStyle = makeFill(ctx, layer.fill, lb, tf);
    ctx.fill('nonzero');
    ctx.clip('nonzero');
    c.layerBox = lb;
    if (layer.deco) layer.deco(c, lb);
    ctx.restore();
    if (layer.stroke !== null) {
      tracePath(ctx, lu, tf);
      ctx.lineWidth = Math.max(1, S * 0.012); ctx.lineJoin = 'round';
      ctx.strokeStyle = layer.stroke || 'rgba(50,30,15,0.32)';
      ctx.stroke();
    }
  }
  if (part.after) part.after(c);
  // paper fibres, multiplied, clipped to outline
  ctx.save();
  tracePath(ctx, outlinePolys, tf); ctx.clip();
  ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = part.grain ?? 0.55;
  ctx.fillStyle = ctx.createPattern(grainCanvas(), 'repeat');
  ctx.fillRect(0, 0, Wpx, Hpx);
  ctx.restore();
  return { canvas, tf, ox, oy, Wpx, Hpx };
}

const sideMats = new Map();
function sideMaterial(color = '#efe6d0') {
  if (!sideMats.has(color)) sideMats.set(color, new THREE.MeshLambertMaterial({ color }));
  return sideMats.get(color);
}

// ---------- the main builder ----------
// part: { layers:[{shapes:[poly,...], fill, deco?, stroke?}], paper?, grain?, after? }
// opts: worldScale (world units per model unit), ppu (px per world unit), thickness, border (world units)
export function buildCut(part, opts = {}) {
  const {
    worldScale = 1, ppu = 90, thickness = 0.03, border = 0.035, maxTex = 1024, name = 'cut',
    hole = true,
  } = opts;
  const bm = border / worldScale;
  const all = part.layers.flatMap((l) => l.shapes);
  let outline = unionPolys(all);
  outline = offsetPaths(outline, bm, 0.003 / worldScale);
  outline = cleanPaths(outline, 0.0015 / worldScale);
  const { shapes, outers, holes } = pathsToShapes(outline);
  const outlinePolys = outers.concat(holes);
  const bb = bboxOf(outlinePolys);
  let S = ppu * worldScale;
  S = Math.min(S, maxTex / Math.max(bb.w, bb.h));
  S = Math.max(S, 6);
  const seed = hashStr(name);
  const paint = paintCut(part, outlinePolys, bb, S, seed);
  const tex = new THREE.CanvasTexture(paint.canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = MAX_ANISO;
  tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const depth = thickness / worldScale;
  const geo = new THREE.ExtrudeGeometry(shapes, { depth, bevelEnabled: false, curveSegments: 1, steps: 1 });
  geo.translate(0, 0, -depth);
  // uv remap to canvas space
  const pos = geo.attributes.position, uv = geo.attributes.uv;
  const uw = paint.Wpx / S, uh = paint.Hpx / S;
  for (let i = 0; i < pos.count; i++) {
    uv.setXY(i, (pos.getX(i) - paint.ox) / uw, 1 - (paint.oy - pos.getY(i)) / uh);
  }
  uv.needsUpdate = true;
  const matCap = new THREE.MeshLambertMaterial({ map: tex });
  const mesh = new THREE.Mesh(geo, [matCap, sideMaterial(part.edge)]);
  mesh.scale.setScalar(worldScale);
  mesh.castShadow = true; mesh.receiveShadow = false;
  mesh.name = name;
  return {
    mesh, texture: tex, material: matCap, bbox: bb, canvas: paint.canvas,
    dispose() { tex.dispose(); geo.dispose(); matCap.dispose(); },
  };
}

// union of polygons returned as float arrays (model units)
export function unionF(polys) {
  return unionPolys(polys).map((p) => p.map((q) => [q.X / SC, q.Y / SC]));
}
