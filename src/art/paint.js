// Painting helpers used inside layer.deco(c, bbox) callbacks (c = painter context from papercut.js)
import { mulberry32 } from '../lib/util.js';

export function eye(c, x, y, r, { color = '#1b120c', white = '#fff8e6', look = 0.25 } = {}) {
  const { ctx, tf, S } = c;
  const [X, Y] = tf(x, y); const R = Math.max(2, r * S);
  ctx.save();
  ctx.beginPath(); ctx.arc(X, Y, R, 0, 6.2832); ctx.fillStyle = white; ctx.fill();
  ctx.lineWidth = Math.max(1, R * 0.18); ctx.strokeStyle = 'rgba(40,25,10,.8)'; ctx.stroke();
  ctx.beginPath(); ctx.arc(X + R * look, Y, R * 0.58, 0, 6.2832); ctx.fillStyle = color; ctx.fill();
  ctx.beginPath(); ctx.arc(X + R * look + R * 0.2, Y - R * 0.22, R * 0.2, 0, 6.2832); ctx.fillStyle = '#fff'; ctx.fill();
  ctx.restore();
}

export function spots(c, bb, color, n, rmin, rmax, { seed = 7, alpha = 0.55 } = {}) {
  const { ctx, tf } = c; const r = mulberry32(seed);
  ctx.save(); ctx.fillStyle = color; ctx.globalAlpha = alpha;
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h, rad = rmin + r() * (rmax - rmin);
    const [X, Y] = tf(x, y); ctx.beginPath(); ctx.ellipse(X, Y, rad * c.S, rad * c.S * (0.7 + r() * 0.5), r() * 3, 0, 6.2832); ctx.fill();
  }
  ctx.restore();
}

export function stripes(c, bb, color, n, { width = 0.04, slant = 0.25, alpha = 0.5 } = {}) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = width * S; ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + (bb.w * (i + 0.5)) / n;
    const [a, b] = tf(x, bb.y1), [d, e] = tf(x - slant * bb.h * 0.3, bb.y0 + bb.h * 0.35);
    ctx.beginPath(); ctx.moveTo(a, b); ctx.lineTo(d, e); ctx.stroke();
  }
  ctx.restore();
}

// soft darkening toward bottom & light on top (gives volume)
export function volume(c, bb, { dark = 'rgba(40,25,10,0.28)', light = 'rgba(255,248,220,0.22)' } = {}) {
  const { ctx, tf } = c;
  const [x0, y0] = tf(bb.x0, bb.y1), [x1, y1] = tf(bb.x0, bb.y0);
  const g = ctx.createLinearGradient(x0, y0, x1, y1);
  g.addColorStop(0, light); g.addColorStop(0.45, 'rgba(0,0,0,0)'); g.addColorStop(1, dark);
  ctx.save(); ctx.fillStyle = g; ctx.fillRect(0, 0, c.W, c.H); ctx.restore();
}

export function scalesTexture(c, bb, color, { size = 0.06, alpha = 0.22, seed = 3 } = {}) {
  const { ctx, tf, S } = c; const r = mulberry32(seed);
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, S * 0.008);
  for (let y = bb.y0; y < bb.y1; y += size) {
    for (let x = bb.x0 + ((Math.floor(y / size) % 2) * size) / 2; x < bb.x1; x += size) {
      const [X, Y] = tf(x + (r() - 0.5) * size * 0.2, y);
      ctx.beginPath(); ctx.arc(X, Y, size * S * 0.5, 0.2, Math.PI - 0.2); ctx.stroke();
    }
  }
  ctx.restore();
}

export function fuzz(c, bb, color, n, len, { seed = 5, alpha = 0.5 } = {}) {
  const { ctx, tf, S } = c; const r = mulberry32(seed);
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, S * 0.012); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const x = bb.x0 + r() * bb.w, y = bb.y0 + r() * bb.h, a = -0.8 + r() * 0.6;
    const [X, Y] = tf(x, y), [X2, Y2] = tf(x + Math.cos(a) * len, y + Math.sin(a) * len);
    ctx.beginPath(); ctx.moveTo(X, Y); ctx.lineTo(X2, Y2); ctx.stroke();
  }
  ctx.restore();
}

export function line(c, pts, color, w, { alpha = 1, cap = 'round' } = {}) {
  const { ctx, tf, S } = c;
  ctx.save(); ctx.strokeStyle = color; ctx.globalAlpha = alpha; ctx.lineWidth = Math.max(1, w * S); ctx.lineCap = cap; ctx.lineJoin = 'round';
  ctx.beginPath(); pts.forEach((p, i) => { const [X, Y] = tf(p[0], p[1]); if (i) ctx.lineTo(X, Y); else ctx.moveTo(X, Y); }); ctx.stroke();
  ctx.restore();
}

export function dot(c, x, y, r, color, alpha = 1) {
  const { ctx, tf, S } = c; const [X, Y] = tf(x, y);
  ctx.save(); ctx.globalAlpha = alpha; ctx.fillStyle = color; ctx.beginPath(); ctx.arc(X, Y, Math.max(1, r * S), 0, 6.2832); ctx.fill(); ctx.restore();
}
