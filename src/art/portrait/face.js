// Gesicht, Hals, Ohren, Augen, Nase, Mund, Falten, Brille. Alles Papierschnitt-Lagen in Kopf-Koordinaten (u, v):
// u = -1 .. 1 von links nach rechts (Gesichtsbreite), v = -1 (Scheitel) .. 1 (Kinn). G.X(u), G.Y(v) rechnen in Pixel um.
import { mix, shade, tint, alpha, ell, spline, mirrorX, bez, TAU } from './paper.js';

export function makeGeo(look, W = 600) {
  const f = look.face || {};
  const G = { cx: W / 2 + (look.dx || 0), cy: (look.cy || 388), fw: 96 * (f.w || 1), fh: 120 * (f.h || 1) };
  G.X = (u) => G.cx + u * G.fw; G.Y = (v) => G.cy + v * G.fh; G.P = (u, v) => [G.X(u), G.Y(v)];
  G.skin = look.skin || '#efc19b'; G.skinD = shade(G.skin, 0.16); G.skinDD = shade(G.skin, 0.32); G.skinL = tint(G.skin, 0.2);
  G.neckY = G.Y(1.0); G.age = look.age ?? 0.3; G.f = f; G.look = look;
  G.hair = look.hair?.col || '#4a3426'; G.female = !!look.female;
  return G;
}

// Umriss des Gesichts (rechte Hälfte oben -> unten, gespiegelt)
export function faceOutline(G) {
  const f = G.f, jaw = f.jaw ?? 0, dome = f.dome ?? 0, cheek = f.cheek ?? 0, chin = f.chin ?? 0, brow = f.brow ?? 0;
  const R = [
    [0, -1 - dome], [0.46, -0.96 - dome * 0.9], [0.80, -0.82 - dome * 0.55], [0.95 + brow * 0.02, -0.58], [1.0, -0.28], [0.99 + cheek * 0.03, 0.05],
    [0.93 + cheek * 0.07 + jaw * 0.05, 0.34], [0.80 + cheek * 0.07 + jaw * 0.12, 0.60], [0.60 + jaw * 0.12 - chin * 0.08, 0.82], [0.34 + jaw * 0.10 - chin * 0.12, 0.96], [0, 1.0 + chin * 0.02],
  ];
  return mirrorX(R.map(([u, v]) => [G.X(u), G.Y(v)]), G.cx);
}

export function drawNeck(P, G, o = {}) {
  const w = (o.w ?? 0.5) * G.fw, top = G.Y(0.55), ny = G.Y(1.0) + 36, bot = ny + 90, cx = G.cx;
  const pts = [[cx - w, top], [cx + w, top], [cx + w * 1.04, G.Y(1.0) + 20], [cx + w * 1.5, bot], [cx - w * 1.5, bot], [cx - w * 1.04, G.Y(1.0) + 20]];
  const sk = shade(G.skin, 0.07);
  P.cut(pts, sk, { lift: 0.5, grad: false, wob: 0.5, deco: (ctx) => {
    // Schatten unter dem Kinn
    const g = ctx.createLinearGradient(0, G.Y(0.85), 0, G.Y(1.0) + 56); g.addColorStop(0, alpha(G.skinDD, 0.55)); g.addColorStop(1, alpha(G.skinDD, 0));
    ctx.fillStyle = g; ctx.fillRect(cx - w * 2, G.Y(0.7), w * 4, 160);
  } });
}

export function drawEars(P, G, o = {}) {
  const y = G.Y(0.02), s = G.fh * 0.17, ex = o.ex ?? 1.0;
  for (const sg of [-1, 1]) {
    const x = G.cx + sg * G.fw * (ex - 0.03);
    P.cut(ell(x + sg * 3, y, s * 0.62, s * 1.05, 14, sg * 0.12), shade(G.skin, 0.04), { lift: 0.4, wob: 0.4, grad: false });
    P.cut(ell(x + sg * 4, y + 1, s * 0.3, s * 0.65, 10, sg * 0.12), G.skinD, { lift: 0, wob: 0.2, grad: false, edge: false, line: false });
  }
}

export function drawFace(P, G) {
  const o = faceOutline(G);
  return P.cut(o, G.skin, { lift: 0.8, wob: 0.55, grad: false, deco: (ctx) => {
    // Rundung: Licht oben links, Schatten an den Rändern und unten
    const g = ctx.createRadialGradient(G.X(-0.18), G.Y(-0.25), G.fw * 0.1, G.cx, G.Y(0.1), G.fh * 1.12);
    g.addColorStop(0, alpha(G.skinL, 0.55)); g.addColorStop(0.55, alpha(G.skin, 0)); g.addColorStop(1, alpha(G.skinD, 0.55));
    ctx.fillStyle = g; ctx.fillRect(G.cx - G.fw * 1.2, G.Y(-1.3), G.fw * 2.4, G.fh * 2.6);
  } });
}

// Wangenröte, Falten (nach Alter), Augenringe
export function drawSkinDetail(P, G) {
  const a = G.age, ctx = P.ctx, red = G.look.blush ?? (G.female ? 0.36 : 0.24);
  const rose = mix(G.skin, '#e0605a', 0.55);
  P.glow(G.X(-0.56), G.Y(0.34), G.fw * 0.34, rose, red, 0.75); P.glow(G.X(0.56), G.Y(0.34), G.fw * 0.34, rose, red, 0.75);
  const w = G.skinDD;
  if (a > 0.28) { // Stirnfalten
    const n = a > 0.6 ? 3 : 2;
    for (let i = 0; i < n; i++) { const v = -0.56 + i * 0.1; P.line([G.P(-0.5, v + 0.01), G.P(-0.2, v - 0.02), G.P(0.2, v - 0.02), G.P(0.5, v + 0.01)], w, 1.3, { a: 0.2 + a * 0.2 }); }
  }
  if (a > 0.35) { // Krähenfüße, Tränensäcke, Lachfalten
    for (const s of [-1, 1]) {
      P.line([G.P(s * 0.78, -0.12), G.P(s * 0.9, -0.17)], w, 1.2, { a: 0.35 }); P.line([G.P(s * 0.78, -0.06), G.P(s * 0.92, -0.05)], w, 1.2, { a: 0.3 });
      P.line([G.P(s * 0.22, 0.2), G.P(s * 0.42, 0.18), G.P(s * 0.62, 0.15)], w, 1.2, { a: 0.18 + a * 0.2 });
      P.line([G.P(s * 0.3, 0.4), G.P(s * 0.4, 0.55), G.P(s * 0.36, 0.7)], w, 1.3, { a: 0.18 + a * 0.22 });
    }
  }
  if (a > 0.6) { P.line([G.P(-0.12, -0.4), G.P(-0.08, -0.3)], w, 1.2, { a: 0.35 }); P.line([G.P(0.12, -0.4), G.P(0.08, -0.3)], w, 1.2, { a: 0.35 }); }
}

export function drawEyes(P, G) {
  const L = G.look.eyes || {}, sz = L.size ?? 1, col = L.col || '#4b3b2c', ctx = P.ctx;
  const ex = 0.43, ey = L.y ?? -0.02, w = G.fw * 0.34 * sz;
  for (const s of [-1, 1]) {
    const x = G.X(s * ex), y = G.Y(ey), h = w * 0.40;
    // Augenhöhle (feiner Schatten)
    P.glow(x, y - h * 0.4, w * 0.8, G.skinDD, 0.16, 0.6);
    ctx.save();
    const eyePath = new Path2D(); eyePath.moveTo(x - w / 2, y + 1); eyePath.quadraticCurveTo(x, y - h * 1.9, x + w / 2, y + 1); eyePath.quadraticCurveTo(x, y + h * 1.25, x - w / 2, y + 1); eyePath.closePath();
    ctx.fillStyle = '#fbf6ea'; ctx.fill(eyePath); ctx.clip(eyePath);
    const lx = s * w * 0.04 + (L.look || 0) * w * 0.12;
    ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + lx, y - h * 0.1, h * 0.92, 0, TAU); ctx.fill();
    ctx.fillStyle = '#17110c'; ctx.beginPath(); ctx.arc(x + lx, y - h * 0.1, h * 0.5, 0, TAU); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.92)'; ctx.beginPath(); ctx.arc(x + lx - h * 0.28, y - h * 0.42, h * 0.21, 0, TAU); ctx.fill();
    // Oberlid wirft Schatten in das Auge
    const g = ctx.createLinearGradient(0, y - h * 1.4, 0, y); g.addColorStop(0, 'rgba(40,20,10,0.35)'); g.addColorStop(1, 'rgba(40,20,10,0)'); ctx.fillStyle = g; ctx.fillRect(x - w, y - h * 1.6, w * 2, h * 1.5);
    ctx.restore();
    // Lidstrich
    ctx.save(); ctx.strokeStyle = L.lid || '#2a1a10'; ctx.lineWidth = Math.max(1.6, w * 0.075); ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - w / 2 - 1, y + 1.5); ctx.quadraticCurveTo(x, y - h * 1.95, x + w / 2 + 1, y + 1.5); ctx.stroke();
    ctx.globalAlpha = 0.28; ctx.lineWidth = 1.1; ctx.beginPath(); ctx.moveTo(x - w / 2 + 2, y + 2); ctx.quadraticCurveTo(x, y + h * 1.3, x + w / 2 - 2, y + 2); ctx.stroke();
    ctx.restore();
    if (G.female || L.kohl) { ctx.save(); ctx.strokeStyle = '#1c120c'; ctx.lineWidth = L.kohl ? 3.4 : 1.2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.moveTo(x + s * (w / 2 - 2), y + 1); ctx.quadraticCurveTo(x + s * (w / 2 + 6), y - 1, x + s * (w / 2 + (L.kohl ? 15 : 4)), y - (L.kohl ? 2 : 2.5)); ctx.stroke();
      if (L.kohl) { ctx.lineWidth = 2.6; ctx.beginPath(); ctx.moveTo(x - s * (w / 2 - 2), y + 2); ctx.quadraticCurveTo(x, y + h * 1.45, x + s * (w / 2 + 2), y + 3); ctx.stroke(); } ctx.restore(); }
  }
}

export function drawBrows(P, G) {
  const B = G.look.brow || {}, col = B.col || mix(G.hair, '#20120a', 0.2), th = (B.thick ?? 1) * 5.2, arch = B.arch ?? 1, y = B.y ?? -0.24;
  for (const s of [-1, 1]) {
    const x0 = G.X(s * 0.18), x1 = G.X(s * 0.72), ym = G.Y(y - 0.045 * arch);
    const inner = [x0, G.Y(y + 0.012)], mid = [(x0 + x1) / 2 + s * 4, ym], outer = [x1, G.Y(y + 0.045)];
    const up = [bez(inner, [(inner[0] + mid[0]) / 2, mid[1] - 2], mid, 6), bez(mid, [(mid[0] + outer[0]) / 2, mid[1] - 1], outer, 6)].flat();
    const top = up.map((p, i) => [p[0], p[1] - th * (0.5 + 0.5 * Math.sin(Math.PI * Math.min(1, i / (up.length - 1) * 0.9 + 0.08)))]);
    const bot = up.map((p, i) => [p[0], p[1] + th * 0.25 * (1 - i / up.length)]);
    P.cut(top.concat(bot.reverse()), col, { lift: 0.18, wob: 0.3, grad: false, edge: false, line: false, smooth: true, step: 4 });
  }
}

export function drawNose(P, G) {
  const L = G.look.nose || {}, s = L.size ?? 1, wd = G.fw * 0.17 * s, top = G.Y(-0.1), bot = G.Y(0.37 + (L.long ?? 0) * 0.05);
  const tone = mix(G.skin, G.look.noseTone || '#d98a6a', 0.14);
  const pts = [[G.cx, top], [G.cx + wd * 0.5, G.Y(0.1)], [G.cx + wd * 1.05, G.Y(0.3)], [G.cx + wd * 1.2, bot - 3], [G.cx + wd * 0.5, bot + 4], [G.cx, bot + 1], [G.cx - wd * 0.5, bot + 4], [G.cx - wd * 1.2, bot - 3], [G.cx - wd * 1.05, G.Y(0.3)], [G.cx - wd * 0.5, G.Y(0.1)]];
  P.cut(pts, tone, { lift: 0.38, wob: 0.3, grad: 'h', gl: 0.1, gd: 0.1, line: false, edge: false });
  P.glow(G.cx - wd * 0.15, G.Y(0.16), wd * 0.4, G.skinL, 0.5, 2.0);
  P.dot(G.cx - wd * 0.62, bot - 0.5, 2.1, G.skinDD, 0.55); P.dot(G.cx + wd * 0.62, bot - 0.5, 2.1, G.skinDD, 0.55);
  P.line([G.P(-0.16, 0.1), G.P(-0.24, 0.3)], G.skinDD, 1.2, { a: 0.25 }); P.line([G.P(0.16, 0.1), G.P(0.24, 0.3)], G.skinDD, 1.2, { a: 0.25 });
}

export function drawMouth(P, G) {
  const M = G.look.mouth || {}, w = G.fw * 0.5 * (M.w ?? 1), y = G.Y(M.y ?? 0.62), sm = M.smile ?? 0.35, full = M.full ?? 0.9;
  const lip = mix(G.skin, M.col || (G.female ? '#c4455a' : '#b8544f'), G.female ? 0.58 : 0.42), lipD = shade(lip, 0.28);
  const cx = G.cx, h = w * 0.12 * full;
  // Oberlippe
  const lift = sm * 6;
  const up = [[cx - w / 2, y - lift * 0.4], [cx - w * 0.22, y - h * 0.95 - lift * 0.1], [cx, y - h * 0.55], [cx + w * 0.22, y - h * 0.95 - lift * 0.1], [cx + w / 2, y - lift * 0.4], [cx + w * 0.1, y + 0.5], [cx - w * 0.1, y + 0.5]];
  const lo = [[cx - w / 2 + 2, y - lift * 0.4 + 0.5], [cx + w / 2 - 2, y - lift * 0.4 + 0.5], [cx + w * 0.28, y + h * 1.4], [cx, y + h * 1.75], [cx - w * 0.28, y + h * 1.4]];
  P.cut(lo, lip, { lift: 0.25, wob: 0.3, grad: false, edge: false, line: false });
  P.cut(up, mix(lip, '#8a3030', 0.15), { lift: 0.22, wob: 0.3, grad: false, edge: false, line: false });
  P.line([[cx - w / 2, y - lift * 0.35], [cx - w * 0.2, y + 1.2], [cx + w * 0.2, y + 1.2], [cx + w / 2, y - lift * 0.35]], lipD, 1.6, { a: 0.9 });
  P.glow(cx - w * 0.08, y + h * 0.95, w * 0.12, '#ffffff', 0.4, 0.5);
  for (const s of [-1, 1]) P.line([[cx + s * (w / 2 + 2), y - lift * 0.5 - 1], [cx + s * (w / 2 + 4), y - lift * 0.9]], G.skinDD, 1.1, { a: 0.4 });
}

export function drawGlasses(P, G, kind = 'round') {
  const ctx = P.ctx, col = G.look.glassCol || '#3a2a1c', r = G.fw * 0.37 * (kind === 'round' ? 1 : 0.95), y = G.Y(-0.02), lw = kind === 'round' ? 3 : 3.6;
  const fx = (s) => G.X(s * 0.43);
  P.line([[fx(-1) + r * 0.95, y - 2], [fx(1) - r * 0.95, y - 2]], col, lw * 0.8, { a: 0.95, smooth: false });
  P.line([[fx(-1) - r, y - 3], [G.X(-1.04), y - 5], [G.X(-1.08), G.Y(0.06)]], col, lw * 0.75, { a: 0.9 });
  P.line([[fx(1) + r, y - 3], [G.X(1.04), y - 5], [G.X(1.08), G.Y(0.06)]], col, lw * 0.75, { a: 0.9 });
  for (const s of [-1, 1]) {
    const x = fx(s);
    ctx.save();
    ctx.beginPath(); if (kind === 'round') ctx.arc(x, y, r, 0, TAU); else ctx.rect(x - r, y - r * 0.72, r * 2, r * 1.42);
    ctx.fillStyle = 'rgba(210,235,245,0.22)'; ctx.fill();
    ctx.shadowColor = 'rgba(30,14,4,0.38)'; ctx.shadowBlur = 3; ctx.shadowOffsetY = 2; ctx.shadowOffsetX = 0.8; ctx.strokeStyle = col; ctx.lineWidth = lw; ctx.stroke();
    ctx.restore();
    ctx.save(); ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.beginPath(); ctx.arc(x, y, r * 0.72, Math.PI * 1.15, Math.PI * 1.45); ctx.stroke(); ctx.restore();
  }
}
