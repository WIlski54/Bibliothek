// Kopie von _t_kit.js aus den Popup-Büchern (Ägypten), Papierschnitt-Baukasten für Tiere: Entwurf in "Designeinheiten" (u Meter je Einheit, meist 1 cm), damit Konturen, Fellstriche und Augen mit dem Tier skalieren.
// Kopie/Erweiterung des Dino-Baukastens _d_kit.js: kit(u) -> K.limb/blob/poly/S/rim/bead/fur/dapples/shade/curve/rings ...
import { blob, limb, poly, xf, spline } from '../../../art/dsl.js';
import { line } from '../../../art/paint.js';
import { unionPolys } from '../../../lib/papercut.js';
import { mulberry32 } from '../../../lib/util.js';

const SC = 4000; // must match papercut.js clipper scale

export function kit(u) {
  const P = (pts) => pts.map(([x, y]) => [x * u, Math.max(0, y * u)]);   // Boden bei y = 0: runde Beinenden werden flach abgeschnitten
  const K = { u, P };
  K.pt = ([x, y]) => [x * u, y * u];
  // flatten polygons / lists of polygons / nested lists into one list of polygons (call as K.S(a, b, [c, d]))
  K.S = (...items) => items.flatMap((it) => (!it || !it.length ? [] : typeof it[0][0] === 'number' ? [it] : K.S(...it)));
  K.blob = (cx, cy, rx, ry = rx, rot = 0, n = 40) => P(blob(cx, cy, rx, ry, rot, n));
  K.poly = (pts, sm = 2) => P(poly(pts, sm));
  K.limb = (ctrl, o) => P(limb(ctrl, o));
  // little curved fur tuft: from (x,y) pointing at angle `a` (radians), length l, base width w
  K.tuft = (x, y, a, l, w, bend = 0.25) => {
    const ca = Math.cos(a), sa = Math.sin(a), nx = -sa, ny = ca;
    return P(limb([[x, y, w], [x + ca * l * 0.5 + nx * l * bend * 0.5, y + sa * l * 0.5 + ny * l * bend * 0.5, w * 0.6],
      [x + ca * l + nx * l * bend, y + sa * l + ny * l * bend, 0]], { per: 5 }));
  };
  // a row of tufts along a curve of design points -> list of polys (for scalloped / fluffy silhouettes)
  K.tufts = (pts, a, l, w, bend = 0.25) => pts.map(([x, y], i) => K.tuft(x, y, typeof a === 'function' ? a(i) : a, typeof l === 'function' ? l(i) : l, w, bend));
  K.xf = (p, o) => { // transform a design-space polygon given in meters-space: o in design units
    return xf(p, { ...o, x: (o.x || 0) * u, y: (o.y || 0) * u });
  };

  // arc-length samples of a design-space [x,y,w] control polyline: [{x,y,w,tx,ty,s}]
  K.path = (ctrl, per = 16) => {
    const pts = spline(ctrl, per); let s = 0; const out = [];
    for (let i = 0; i < pts.length; i++) {
      if (i) s += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      const a = pts[Math.max(0, i - 1)], b = pts[Math.min(pts.length - 1, i + 1)];
      let tx = b[0] - a[0], ty = b[1] - a[1]; const m = Math.hypot(tx, ty) || 1; tx /= m; ty /= m;
      out.push({ x: pts[i][0], y: pts[i][1], w: pts[i][2], tx, ty, s });
    }
    return out;
  };
  // fluffy limb: tapered limb plus little fur tufts along both edges (for bushy tails, manes, ruffs)
  K.bushyLimb = (ctrl, { every = 1.4, len = 1.5, tw = 1.1, from = 0.15, to = 1, bend = 0.2, ang = 0.7 } = {}) => {
    const path = K.path(ctrl), total = path[path.length - 1].s, out = [K.limb(ctrl, { per: 12 })];
    let next = from * total, side = 1;
    for (const p of path) {
      if (p.s < next || p.s > to * total || p.w < 0.5) continue;
      next = p.s + every; side = -side;
      const nx = -p.ty * side, ny = p.tx * side, h = p.w / 2 - tw * 0.3;
      const a = Math.atan2(p.ty, p.tx) + (side > 0 ? 1 : -1) * ang;
      out.push(K.tuft(p.x + nx * h, p.y + ny * h, a, len, tw, side * bend));
    }
    return out;
  };

  // ---------- painting (design units in, metre-based painter out) ----------
  const tracePaths = (c, paths) => {
    const { ctx, tf } = c; ctx.beginPath();
    for (const p of paths) {
      p.forEach((q, i) => { const [X, Y] = tf(q.X / SC, q.Y / SC); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
      ctx.closePath();
    }
  };
  // outline + soft inner shade along the silhouette (replacement for the engine's fixed-width stroke)
  K.rim = (shapes, { w = 0.12, color = 'rgba(48,26,12,.78)', soft = 0.16 } = {}) => (c) => {
    const paths = unionPolys(shapes); const { ctx, S } = c;
    ctx.save(); ctx.lineJoin = 'round'; ctx.lineCap = 'round';
    tracePaths(c, paths);
    if (soft) { ctx.strokeStyle = `rgba(35,18,6,${soft})`; ctx.lineWidth = w * u * S * 6; ctx.stroke(); }
    ctx.strokeStyle = color; ctx.lineWidth = w * u * S * 2; ctx.stroke();
    ctx.restore();
  };
  // glossy dark bead eye, centre (x,y) radius r (design units)
  K.bead = (c, x, y, r, { color = '#1b100a', look = 0.1, shine = true, ring = null } = {}) => {
    const { ctx, tf, S } = c; const [X, Y] = tf(x * u, y * u); const R = Math.max(2, r * u * S);
    ctx.save();
    if (ring) { ctx.beginPath(); ctx.arc(X, Y, R * 1.18, 0, 6.2832); ctx.fillStyle = ring; ctx.fill(); }
    const g = ctx.createRadialGradient(X + R * 0.1, Y - R * 0.1, R * 0.1, X, Y, R);
    g.addColorStop(0, '#3a2418'); g.addColorStop(1, color);
    ctx.beginPath(); ctx.arc(X + R * look * 0.3, Y, R, 0, 6.2832); ctx.fillStyle = g; ctx.fill();
    if (shine) {
      ctx.fillStyle = '#fffaf0';
      ctx.beginPath(); ctx.arc(X + R * (0.3 + look), Y - R * 0.34, R * 0.3, 0, 6.2832); ctx.fill();
      ctx.globalAlpha = 0.75; ctx.beginPath(); ctx.arc(X - R * 0.28 + R * look, Y + R * 0.38, R * 0.13, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  };
  // fill a (smoothed) polygon given in design units
  K.paintPoly = (c, pts, color, alpha = 1, sm = 0) => {
    const { ctx, tf } = c; const q = poly(pts, sm);
    ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    q.forEach(([x, y], i) => { const [X, Y] = tf(x * u, y * u); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.fill(); ctx.restore();
  };
  // fill a polygon that is already in metres (e.g. the result of K.tuft / K.limb)
  K.fillM = (c, pts, color, alpha = 1) => {
    const { ctx, tf } = c; ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath();
    pts.forEach(([x, y], i) => { const [X, Y] = tf(x, y); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); });
    ctx.closePath(); ctx.fill(); ctx.restore();
  };
  K.paintBlob = (c, cx, cy, rx, ry, rot, color, alpha = 1) => K.paintPoly(c, blob(cx, cy, rx, ry, rot, 28), color, alpha);
  K.ink = (c, pts, color, w, o) => line(c, pts.map(([x, y]) => [x * u, y * u]), color, w * u, o);
  // smooth curve through design points as a stroked path (nicer for mouths/brows than polylines)
  K.curve = (c, pts, color, w, { alpha = 1 } = {}) => {
    const { ctx, tf, S } = c; ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * u * S);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    const T = pts.map(([x, y]) => tf(x * u, y * u));
    ctx.moveTo(T[0][0], T[0][1]);
    for (let i = 1; i < T.length - 1; i++) { const mx = (T[i][0] + T[i + 1][0]) / 2, my = (T[i][1] + T[i + 1][1]) / 2; ctx.quadraticCurveTo(T[i][0], T[i][1], mx, my); }
    const l = T[T.length - 1]; ctx.lineTo(l[0], l[1]); ctx.stroke(); ctx.restore();
  };
  // bold fur flicks: n tapered brush strokes inside bb pointing at angle ang (+-spread); len/w in design units
  K.fur = (c, bb, color, n, len, w, { seed = 5, alpha = 0.5, ang = Math.PI + 0.55, spread = 0.5, box = null, boxD = null, curl = 0.25 } = {}) => {
    const { ctx, tf, S } = c; const r = mulberry32(seed); const B = boxD ? { x0: boxD.x0 * u, y0: boxD.y0 * u, w: boxD.w * u, h: boxD.h * u } : (box || bb);
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const x = B.x0 + r() * B.w, y = B.y0 + r() * B.h, a = ang + (r() - 0.5) * spread, l = len * u * (0.6 + r() * 0.7);
      const [X, Y] = tf(x, y), [X2, Y2] = tf(x + Math.cos(a) * l, y + Math.sin(a) * l);
      const dx = X2 - X, dy = Y2 - Y, L = Math.hypot(dx, dy) || 1, nx = -dy / L, ny = dx / L, wp = Math.max(1, w * u * S), cv = (r() - 0.3) * curl * L;
      const mx = (X + X2) / 2 + nx * cv, my = (Y + Y2) / 2 + ny * cv;
      ctx.beginPath(); ctx.moveTo(X + nx * wp / 2, Y + ny * wp / 2);
      ctx.quadraticCurveTo(mx + nx * wp * 0.55, my + ny * wp * 0.55, X2 + nx * cv * 0.5, Y2 + ny * cv * 0.5);
      ctx.quadraticCurveTo(mx - nx * wp * 0.45, my - ny * wp * 0.45, X - nx * wp / 2, Y - ny * wp / 2);
      ctx.closePath(); ctx.fill();
    }
    ctx.restore();
  };
  // soft dapples / blotches (fawn-like spots): n spots inside box (default bb), radii in design units
  K.dapples = (c, bb, color, n, rmin, rmax, { seed = 7, alpha = 0.6, box = null, boxD = null } = {}) => {
    const { ctx, tf, S } = c; const r = mulberry32(seed); const B = boxD ? { x0: boxD.x0 * u, y0: boxD.y0 * u, w: boxD.w * u, h: boxD.h * u } : (box || bb);
    ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha;
    for (let i = 0; i < n; i++) {
      const x = B.x0 + r() * B.w, y = B.y0 + r() * B.h, rad = (rmin + r() * (rmax - rmin)) * u * S;
      const [X, Y] = tf(x, y); ctx.beginPath(); ctx.ellipse(X, Y, rad, rad * (0.7 + r() * 0.4), r() * 3, 0, 6.2832); ctx.fill();
    }
    ctx.restore();
  };
  // little scale arcs, in design units
  K.scaleMarks = (c, bb, color, size, { alpha = 0.3, w = 0.07 } = {}) => {
    const { ctx, tf, S } = c; const r = mulberry32(3);
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * u * S); ctx.lineCap = 'round';
    const sz = size * u;
    for (let y = bb.y0, row = 0; y < bb.y1 + sz; y += sz * 0.8, row++) {
      for (let x = bb.x0 + (row % 2) * sz / 2; x < bb.x1 + sz; x += sz) {
        const [X, Y] = tf(x + (r() - 0.5) * sz * 0.15, y);
        ctx.beginPath(); ctx.arc(X, Y, sz * S * 0.5, 0.25, Math.PI - 0.25); ctx.stroke();
      }
    }
    ctx.restore();
  };
  // soft vertical light/shade for volume (like paint.volume but tunable)
  K.shade = (c, bb, { dark = 'rgba(40,20,8,0.30)', light = 'rgba(255,244,215,0.26)', mid = 0.5 } = {}) => {
    const { ctx, tf } = c; const [x0, y0] = tf(bb.x0, bb.y1), [x1, y1] = tf(bb.x0, bb.y0);
    const g = ctx.createLinearGradient(x0, y0, x1, y1);
    g.addColorStop(0, light); g.addColorStop(mid, 'rgba(0,0,0,0)'); g.addColorStop(1, dark);
    ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
  };
  // colour bands across a limb-like path (striped / ringed tails); ctrl in design units, step = distance between ring centres
  K.rings = (c, ctrl, { step = 3, color = '#000', w = 1.2, alpha = 0.5, from = 0, to = 1, reach = 12, offset = 0 } = {}) => {
    const { ctx, tf, S } = c; const path = K.path(ctrl), total = path[path.length - 1].s;
    ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * u * S); ctx.lineCap = 'butt';
    let next = from * total + offset;
    for (const p of path) {
      if (p.s < next) continue; if (p.s > to * total) break; next = p.s + step;
      const nx = -p.ty, ny = p.tx, r = reach / 2;
      const [X1, Y1] = tf((p.x + nx * r) * u, (p.y + ny * r) * u), [X2, Y2] = tf((p.x - nx * r) * u, (p.y - ny * r) * u);
      ctx.beginPath(); ctx.moveTo(X1, Y1); ctx.lineTo(X2, Y2); ctx.stroke();
    }
    ctx.restore();
  };
  // row of little triangular bumps (scutes, crests, spikes) along a design-space [x,y,w] path; side=+1 left of travel direction, -1 right.
  // h = height (design units), w = base width, every = spacing; the bumps sit on the edge (half the path width out) and point outward.
  K.ridge = (ctrl, { every = 6, h = 3, w = 4, side = 1, from = 0, to = 1, grow = 0 } = {}) => {
    const path = K.path(ctrl), total = path[path.length - 1].s, out = []; let next = from * total;
    for (const p of path) {
      if (p.s < next) continue; if (p.s > to * total) break; next = p.s + every;
      const nx = -p.ty * side, ny = p.tx * side, e = Math.max(0, p.w / 2 - h * 0.35), hh = h * (1 + grow * (p.s / total));
      const bx = p.x + nx * e, by = p.y + ny * e;
      out.push(K.poly([[bx - p.tx * w / 2, by - p.ty * w / 2], [bx + nx * hh + p.tx * w * 0.1, by + ny * hh + p.ty * w * 0.1], [bx + p.tx * w / 2, by + p.ty * w / 2]], 0));
    }
    return out;
  };
  // lift: build a part of the drawing at design coordinates, then raise it by dy (design units) afterwards:
  // L = K.up(dy); L.s(...shapes) shifts polygons, L.d(decoFn) shifts the painting coordinates of a deco callback.
  K.up = (dy, dx = 0) => ({
    s: (...items) => K.S(...items).map((p) => p.map(([x, y]) => [x + dx * u, y + dy * u])),
    d: (fn) => (c, bb) => fn({ ...c, tf: (x, y) => c.tf(x + dx * u, y + dy * u) }, bb),
  });
  // place: draw something in LOCAL design coordinates (e.g. a head with origin at its centre, facing +x) and put it into the model
  // at (ox,oy) rotated by rot and scaled by sc. Returns T (local point -> design point), poly/blob/limb builders, d(fn) for deco callbacks.
  K.place = (ox, oy, rot = 0, sc = 1) => {
    const cs = Math.cos(rot), sn = Math.sin(rot);
    const T = ([x, y]) => [ox + (x * cs - y * sn) * sc, oy + (x * sn + y * cs) * sc];
    return {
      T, sc, rot,
      poly: (pts, sm = 2) => K.poly(pts.map(T), sm),
      blob: (cx, cy, rx, ry = rx, r = 0, n = 32) => K.blob(...T([cx, cy]), rx * sc, ry * sc, r + rot, n),
      limb: (ctrl, o) => K.limb(ctrl.map(([x, y, w]) => [...T([x, y]), (w ?? 0) * sc]), o),
      d: (fn) => (c, bb) => fn({ ...c, tf: (xm, ym) => { const [X, Y] = T([xm / u, ym / u]); return c.tf(X * u, Y * u); } }, bb),
    };
  };
  // compose several deco functions
  K.deco = (...fns) => (c, bb) => { for (const f of fns) if (f) f(c, bb); };
  return K;
}

// shared standard ranges helper
export const fillV = (top, bottom) => ({ top, bottom });
