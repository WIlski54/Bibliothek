// Hintergründe der Abteilung Biologie: Galápagos, Herbarium, Erbsen, Chimborazo, Falter, Klippen, Röntgenmuster
import { rect, ell, spline, bez, TAU, mix, shade, tint, alpha, ribbon, rngOf } from './paper.js';
import { C, base, halo, band, star, leaf, disc, cloud, peak, text, stem } from './bg_util.js';

function finch(P, x, y, s, flip, beak, body, wing) {
  const f = flip ? -1 : 1, k = s / 20, X = (u) => x + u * k * f, Y = (v) => y + v * k;
  P.line([[X(-4), Y(12)], [X(-4), Y(24)]], '#5a3a22', 2.2, { a: 1 }); P.line([[X(4), Y(12)], [X(4), Y(24)]], '#5a3a22', 2.2, { a: 1 });
  P.cut([[X(-26), Y(12)], [X(-10), Y(2)], [X(-8), Y(14)]], shade(wing, 0.1), { lift: 0.3, smooth: false, wob: 0.2, step: 30 }); // Schwanz
  P.cut(ell(X(0), Y(4), 17 * k, 12 * k, 16, f * 0.15), body, { lift: 0.5, wob: 0.3 });
  P.cut(ell(X(10), Y(-9), 9.5 * k, 9.5 * k, 14), body, { lift: 0.4, wob: 0.2 });
  const bl = beak.len * k, bh = beak.h * k;
  P.cut([[X(18), Y(-12 - bh / 2)], [X(18 + bl), Y(-9)], [X(18), Y(-9 + bh / 2)]], '#3a2a1c', { lift: 0.2, smooth: false, wob: 0.1, step: 30, edge: false });
  P.cut(ell(X(-3), Y(3), 11 * k, 7 * k, 12, f * 0.3), wing, { lift: 0.3, wob: 0.2 });
  P.dot(X(13), Y(-11), 1.6 * k + 0.4, '#111');
}
function peaflower(P, x, y, s, rot = 0) {
  P.cut(ell(x, y - 8 * s, 14 * s, 16 * s, 16, rot), '#f4f0f6', { lift: 0.5, wob: 0.3 });
  P.cut(ell(x - 12 * s, y + 4 * s, 9 * s, 12 * s, 12, 0.6 + rot), '#d9c4e8', { lift: 0.4, wob: 0.3 }); P.cut(ell(x + 12 * s, y + 4 * s, 9 * s, 12 * s, 12, -0.6 + rot), '#d9c4e8', { lift: 0.4, wob: 0.3 });
  P.cut(ell(x, y + 10 * s, 8 * s, 8 * s, 10), '#b79ad0', { lift: 0.4, wob: 0.2 });
}
function pod(P, x, y, len, ang, col, open) {
  const c = Math.cos(ang), s = Math.sin(ang), L = (u, v) => [x + c * u - s * v, y + s * u + c * v], h = len * 0.12;
  const shell = [L(0, 0), L(len * 0.2, -h), L(len * 0.6, -h * 1.05), L(len, -h * 0.2), L(len * 1.05, 0), L(len, h * 0.5), L(len * 0.6, h * 1.05), L(len * 0.2, h)];
  P.cut(shell, col, { lift: 0.6, wob: 0.4 });
  if (open) { const inner = [L(len * 0.06, 0), L(len * 0.25, -h * 0.65), L(len * 0.6, -h * 0.7), L(len * 0.95, -h * 0.1), L(len * 0.6, h * 0.7), L(len * 0.25, h * 0.65)]; P.cut(inner, tint(col, 0.45), { lift: 0.2, wob: 0.2 });
    for (let i = 0; i < 5; i++) { const p = L(len * (0.17 + i * 0.16), 0); P.cut(ell(p[0], p[1], h * 0.5, h * 0.5, 14), i === 3 ? '#8aba3a' : '#e4cf4a', { lift: 0.5, wob: 0.2 }); } }
  else for (let i = 0; i < 5; i++) { const p = L(len * (0.17 + i * 0.16), 0); P.glow(p[0], p[1], h * 0.9, shade(col, 0.2), 0.3); }
}
function butterfly(P, x, y, s, rot, c1, c2, edge, spot) {
  const T = (u, v) => { const c = Math.cos(rot), sn = Math.sin(rot); return [x + (u * c - v * sn) * s, y + (u * sn + v * c) * s]; };
  for (const sg of [-1, 1]) {
    const up = [[0, -4], [sg * 20, -50], [sg * 62, -78], [sg * 96, -60], [sg * 92, -22], [sg * 56, 4], [sg * 12, 8]].map(([u, v]) => T(u, v));
    const lo = [[0, 4], [sg * 52, 6], [sg * 70, 30], [sg * 58, 62], [sg * 30, 56], [sg * 8, 24]].map(([u, v]) => T(u, v));
    P.cut(lo, edge, { lift: 0.7, wob: 0.5 });
    P.cut(lo.map((p, i) => { const q = T(0, 8); return [q[0] + (p[0] - q[0]) * 0.8, q[1] + (p[1] - q[1]) * 0.8]; }), c2, { lift: 0.1, wob: 0.4, edge: false });
    P.cut(up, edge, { lift: 0.8, wob: 0.5 });
    const inner = up.map((p) => { const q = T(0, 0); return [q[0] + (p[0] - q[0]) * 0.82, q[1] + (p[1] - q[1]) * 0.82]; });
    P.cut(inner, c1, { lift: 0.1, wob: 0.4, edge: false, line: false });
    for (let i = 0; i < 4; i++) { const p = T(sg * (66 + i * 6 - (i === 3 ? 18 : 0)), -70 + i * 17 + (i === 3 ? -4 : 0)); P.dot(p[0], p[1], 3.2 * s, spot, 0.95); }
  }
  const b0 = T(0, -26), b1 = T(0, 34); P.cut(ell((b0[0] + b1[0]) / 2, (b0[1] + b1[1]) / 2, 6 * s, 32 * s, 14, rot), '#2a1c18', { lift: 0.5, wob: 0.2 });
  for (const sg of [-1, 1]) { const a = T(0, -28), b = T(sg * 26, -62); P.line([a, T(sg * 12, -50), b], '#2a1c18', 2 * s, { a: 1 }); }
}
function condor(P, x, y, s, col) {
  const T = (u, v) => [x + u * s, y + v * s];
  for (const sg of [-1, 1]) P.cut([[0, -4], [sg * 40, -14], [sg * 90, -4], [sg * 120, 14], [sg * 90, 6], [sg * 70, 16], [sg * 50, 8], [sg * 30, 16], [0, 10]].map(([u, v]) => T(u, v)), col, { lift: 0.3, wob: 0.3 });
  P.cut(ell(x, y + 4 * s, 8 * s, 14 * s, 12), col, { lift: 0.3 }); P.cut(ell(x, y - 12 * s, 5 * s, 5 * s, 10), '#efe8d8', { lift: 0.3 });
}

export const BG_BIOLOGIE = {
  // Darwin: Galápagos
  galapagos(P, G, c) {
    const sky = C(c, 0, '#cfe8e0'), sea = C(c, 1, '#4a9a8a'), sun = C(c, 2, '#e8c25a');
    base(P, sky, '#f6efd4');
    disc(P, 470, 120, 62, '#fdf3cf', { lift: 0.2 }); disc(P, 470, 120, 42, sun, { lift: 0.3 });
    cloud(P, 120, 200, 0.7, '#fff'); cloud(P, 380, 70, 0.5, '#fff');
    band(P, 440, 200, mix(sea, '#fff', 0.35), { amp: 5, wl: 80, scallop: true });
    band(P, 480, 200, sea, { amp: 6, wl: 70, scallop: true, ph: 0.5 });
    // Vulkaninseln
    P.cut([[-20, 460], [-20, 360], [50, 330], [90, 300], [140, 340], [200, 400], [260, 460]], '#6a5a52', { lift: 0.6, wob: 1.2, smooth: false, step: 18 });
    P.cut([[330, 462], [400, 410], [470, 368], [540, 380], [640, 430], [640, 470]], '#7a6a5e', { lift: 0.6, wob: 1.2, smooth: false, step: 18 });
    // Opuntie (Feigenkaktus)
    for (const [x, y, rx, ry, r] of [[70, 500, 24, 30, 0.1], [50, 458, 18, 24, -0.3], [100, 462, 18, 22, 0.4], [120, 424, 14, 18, 0.2]]) { P.cut(ell(x, y, rx, ry, 18, r), '#5f9a56', { lift: 0.6, wob: 0.4 }); for (let i = 0; i < 6; i++) P.dot(x + Math.cos(i * 1.4 + r) * rx * 0.5, y + Math.sin(i * 1.4 + r) * ry * 0.5, 1.4, '#f4eac8'); }
    // Riesenschildkröte
    const tx = 500, ty = 520;
    P.cut([[tx - 118, ty + 10], [tx - 100, ty - 14], [tx - 90, ty + 8]], '#8a7a52', { lift: 0.4, smooth: true, wob: 0.4 }); // Kopf
    P.cut(ell(tx - 108, ty - 2, 17, 12, 14, -0.3), '#9a8a5e', { lift: 0.5 }); P.dot(tx - 112, ty - 6, 1.8, '#111');
    P.cut(ell(tx - 62, ty + 28, 18, 34, 12, 0.2), '#8a7a52', { lift: 0.4 }); P.cut(ell(tx + 54, ty + 30, 18, 34, 12, -0.2), '#8a7a52', { lift: 0.4 });
    P.cut([[tx - 100, ty + 30], [tx - 96, ty - 14], [tx - 60, ty - 58], [tx, ty - 70], [tx + 66, ty - 54], [tx + 102, ty - 8], [tx + 100, ty + 30]], '#6f5a3a', { lift: 0.8, wob: 0.8, deco: (ctx) => {
      ctx.strokeStyle = alpha('#2a1c10', 0.5); ctx.lineWidth = 2; for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.moveTo(tx + i * 38, ty - 66); ctx.quadraticCurveTo(tx + i * 44, ty - 20, tx + i * 40, ty + 30); ctx.stroke(); } ctx.beginPath(); ctx.moveTo(tx - 98, ty - 14); ctx.quadraticCurveTo(tx, ty - 24, tx + 100, ty - 8); ctx.stroke();
      ctx.fillStyle = alpha('#c8b078', 0.28); for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.ellipse(tx - 60 + i * 30, ty - 40 + (i % 2) * 24, 12, 8, 0, 0, TAU); ctx.fill(); } } });
    // Zweig mit drei Finken (verschiedene Schnäbel)
    stem(P, [[30, 170], [100, 150], [180, 138], [250, 120]], 7, '#6a4a2a', { lift: 0.5 });
    for (const [x, y, a] of [[70, 160, -0.2], [150, 142, 0.3], [226, 122, -0.4]]) leaf(P, x, y, 38, a - 1.4, '#5a9a4a', 0.4, { lift: 0.3 });
    finch(P, 84, 124, 34, false, { len: 14, h: 11 }, '#8a7a52', '#5a4a30');
    finch(P, 158, 108, 34, true, { len: 17, h: 3.5 }, '#a89868', '#6a5a38');
    finch(P, 226, 92, 34, false, { len: 9, h: 13 }, '#6a5a40', '#3a2e1e');
  },
  // Linné: Herbarium mit Linnaea borealis und Namensschild
  kraeuter(P, G, c) {
    const paper = C(c, 0, '#f1e9cf'), green = C(c, 1, '#5a9a5a'), pink = C(c, 2, '#d88aa0');
    base(P, paper, '#e9dfbf');
    const { ctx } = P; ctx.save(); ctx.strokeStyle = alpha('#b8a478', 0.4); ctx.lineWidth = 1; for (let y = 60; y < 800; y += 36) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); } ctx.restore();
    const plant = (x, y, sg) => {
      const T = (u, v) => [x + sg * u, y + v];
      stem(P, [T(0, 340), T(10, 250), T(-2, 160), T(8, 80)], 5, '#6a8a4a');
      for (let i = 0; i < 6; i++) { const p = T(i % 2 ? 6 : 2, 300 - i * 50); leaf(P, p[0], p[1], 40, sg > 0 ? (i % 2 ? -0.3 : -2.8) : (i % 2 ? -2.8 : -0.3), green, 0.7, { lift: 0.4 }); leaf(P, p[0], p[1], 36, sg > 0 ? (i % 2 ? 0.4 : 3.4) : (i % 2 ? 3.4 : 0.4), mix(green, '#fff', 0.12), 0.7, { lift: 0.4 }); }
      const top = T(8, 80);
      for (const d of [-1, 1]) {
        const e = [top[0] + d * 34, top[1] - 8];
        P.line([top, [top[0] + d * 14, top[1] - 24], e], '#6a8a4a', 2.4, { a: 1 });
        P.cut([[e[0] - 6, e[1]], [e[0] + 6, e[1]], [e[0] + 15, e[1] + 30], [e[0] + 8, e[1] + 34], [e[0], e[1] + 31], [e[0] - 8, e[1] + 34], [e[0] - 15, e[1] + 30]], pink, { lift: 0.5, wob: 0.3, deco: (c2) => { c2.strokeStyle = alpha(shade(pink, 0.3), 0.5); c2.lineWidth = 1; for (const k of [-6, 0, 6]) { c2.beginPath(); c2.moveTo(e[0] + k * 0.3, e[1] + 4); c2.lineTo(e[0] + k * 1.1, e[1] + 30); c2.stroke(); } } });
      }
    };
    plant(46, 200, 1); plant(560, 230, -1); plant(120, 420, 1); plant(490, 440, -1);
    // Namensschild
    P.cut([[190, 52], [410, 52], [420, 70], [410, 96], [190, 96], [180, 70]], '#fffaf0', { lift: 0.9, wob: 0.5, smooth: false, step: 30 });
    P.dot(196, 74, 4, shade(paper, 0.3)); text(P, 'Linnaea borealis', 306, 75, { font: 'italic 24px Georgia, serif', col: '#3a2a1c' });
  },
  // Mendel: Erbsengarten
  erbsen(P, G, c) {
    const bgc = C(c, 0, '#e6efc8'), green = C(c, 1, '#5aa05a'), yel = C(c, 2, '#c9d86a');
    base(P, bgc, mix(bgc, green, 0.25));
    // Rankgitter
    const { ctx } = P; ctx.save(); ctx.strokeStyle = alpha('#8a6a3a', 0.85); ctx.lineWidth = 5; ctx.lineCap = 'round';
    for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(40 + i * 20, 560); ctx.lineTo(70 + i * 20, 120); ctx.stroke(); ctx.beginPath(); ctx.moveTo(560 - i * 20, 560); ctx.lineTo(530 - i * 20, 120); ctx.stroke(); }
    ctx.lineWidth = 4; for (let y = 200; y < 560; y += 90) { ctx.beginPath(); ctx.moveTo(30, y); ctx.lineTo(200, y - 8); ctx.moveTo(400, y - 8); ctx.lineTo(570, y); ctx.stroke(); }
    ctx.restore();
    // Ranken, Blätter, Hülsen, Blüten
    for (const sg of [-1, 1]) {
      const x0 = sg < 0 ? 62 : 538;
      stem(P, [[x0, 600], [x0 + sg * 30, 480], [x0 - sg * 10, 380], [x0 + sg * 40, 270], [x0 + sg * 10, 150]], 6, '#4a8a46');
      for (let i = 0; i < 7; i++) { const y = 540 - i * 60, x = x0 + sg * (8 + (i % 3) * 12); leaf(P, x, y, 54, sg > 0 ? -2.7 + (i % 2) * 0.3 : -0.45 - (i % 2) * 0.3, mix(green, '#fff', (i % 3) * 0.1), 0.5, { lift: 0.5 }); leaf(P, x, y, 48, sg > 0 ? -0.3 : -2.8, mix(green, '#fff', 0.15), 0.5, { lift: 0.4 }); }
      pod(P, x0 - sg * 6, 300, 84, sg > 0 ? 2.5 : 0.65, '#6aaa4a', true);
      pod(P, x0 + sg * 6, 470, 90, sg > 0 ? 2.1 : 1.0, '#7ab456', false);
      peaflower(P, x0 + sg * 50, 210, 0.9, sg * 0.2); peaflower(P, x0 - sg * 4, 140, 0.8, -sg * 0.2); peaflower(P, x0 + sg * 40, 400, 0.8, sg * 0.1);
      P.line([[x0 + sg * 6, 400], [x0 + sg * 40, 392], [x0 + sg * 54, 410], [x0 + sg * 44, 420]], '#4a8a46', 2, { a: 1 });
    }
    // 3 : 1 – drei gelbe Erbsen, eine grüne
    P.cut([[222, 40], [378, 40], [388, 60], [378, 82], [222, 82], [212, 60]], '#fffaf0', { lift: 0.8, wob: 0.5, smooth: false, step: 30 });
    for (let i = 0; i < 4; i++) P.cut(ell(246 + i * 36, 61, 13, 13, 16), i < 3 ? '#e8cc3a' : '#7ab43a', { lift: 0.5, wob: 0.2, deco: (c2) => { P.glow(246 + i * 36 - 4, 56, 7, '#fff', 0.5); } });
  },
  // Humboldt: Chimborazo mit Vegetationsstufen, Kondor, Palmwedel
  tropen(P, G, c) {
    const sky = C(c, 0, '#cfe6ea'), green = C(c, 1, '#3f8f5a'), snow = C(c, 2, '#f2f0ea');
    base(P, sky, '#f4efdc');
    cloud(P, 90, 190, 0.8, '#fff'); cloud(P, 520, 130, 0.7, '#fff'); cloud(P, 430, 300, 0.5, '#fff');
    const mtn = [[-60, 600], [60, 470], [150, 390], [220, 300], [275, 220], [300, 196], [330, 222], [390, 300], [450, 390], [540, 470], [660, 600]];
    P.cut(mtn, '#9a8e86', { lift: 0.8, smooth: false, wob: 1.2, step: 16, grad: false, deco: (ctx) => {
      const zones = [[196, 300, snow], [300, 360, '#a8a29a'], [360, 420, '#c9b88a'], [420, 480, mix(green, '#c9d86a', 0.4)], [480, 560, mix(green, '#2a5a3a', 0.2)], [560, 640, shade(green, 0.25)]];
      for (const [y0, y1, col] of zones) { ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(-60, y0 + 8); for (let x = -60; x <= 660; x += 20) ctx.lineTo(x, y0 + 8 + Math.sin(x * 0.05 + y0) * 8); ctx.lineTo(660, y1 + 8); for (let x = 660; x >= -60; x -= 20) ctx.lineTo(x, y1 + 8 + Math.sin(x * 0.05 + y1) * 8); ctx.closePath(); ctx.fill(); }
      const g = ctx.createLinearGradient(300, 0, 600, 0); g.addColorStop(0, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(30,20,10,0.28)'); ctx.fillStyle = g; ctx.fillRect(300, 150, 360, 500);
    } });
    condor(P, 120, 120, 1.0, '#3a3438');
    // Wedel
    for (const [x, y, ang, len] of [[30, 610, -1.2, 190], [30, 610, -0.8, 200], [30, 610, -1.55, 150], [570, 610, -1.95, 190], [570, 610, -2.35, 200], [570, 610, -1.6, 150]]) leaf(P, x, y, len, ang, mix(green, '#2a5a3a', (len % 3) * 0.1), 0.3, { lift: 0.8 });
  },
  // Merian: Blätter, Raupe, Puppe, Falter
  falter(P, G, c) {
    const cream = C(c, 0, '#f3e6c4'), green = C(c, 1, '#6aaa5a'), orange = C(c, 2, '#e8883a');
    base(P, cream, '#ecdcb0');
    stem(P, [[30, 210], [110, 190], [200, 170], [270, 130]], 8, '#6a4a2a', { lift: 0.5 });
    for (const [x, y, a, l] of [[60, 205, -1.6, 120], [120, 190, 1.4, 100], [175, 175, -1.5, 110], [230, 150, 1.2, 80], [40, 330, -0.2, 0]]) if (l) leaf(P, x, y, l, a, mix(green, '#fff', (x % 3) * 0.08), 0.42, { lift: 0.6 });
    // Raupe auf dem Blatt
    const cx0 = 90, cy0 = 245; for (let i = 0; i < 7; i++) { const x = cx0 + i * 15, y = cy0 + Math.sin(i * 0.9) * 6; P.cut(ell(x, y, 10 - Math.abs(i - 3) * 0.2, 10, 14), i === 6 ? '#7ab43a' : '#a8d048', { lift: 0.5, wob: 0.2, deco: (c2) => { c2.fillStyle = alpha(orange, 0.9); c2.beginPath(); c2.arc(x, y - 6, 2.6, 0, TAU); c2.fill(); } }); }
    P.dot(cx0 + 6 * 15 + 3, cy0 + Math.sin(5.4) * 6 - 2, 1.6, '#222');
    // Puppe (Chrysalis) am Zweig
    P.line([[236, 150], [236, 176]], '#6a4a2a', 2, { a: 1 }); P.cut([[236, 174], [248, 190], [250, 226], [240, 258], [232, 224], [224, 190]], '#8a6a3a', { lift: 0.7, wob: 0.4, deco: (c2) => { c2.strokeStyle = alpha('#3a2a18', 0.5); c2.lineWidth = 1.4; for (let y = 188; y < 250; y += 9) { c2.beginPath(); c2.moveTo(224, y); c2.quadraticCurveTo(238, y + 4, 252, y); c2.stroke(); } } });
    // Falter
    butterfly(P, 470, 132, 1.12, 0.25, '#3a8ad8', '#2a6ab8', '#1c1c34', '#ffffff');
    butterfly(P, 90, 380, 0.6, -0.4, '#f4a23a', '#e8883a', '#2a1c18', '#fff4d8');
    butterfly(P, 520, 390, 0.5, 0.5, '#f6d85a', '#f0c030', '#3a2a18', '#ffffff');
    // Blüte
    for (let i = 0; i < 6; i++) { const a = i / 6 * TAU; P.cut(ell(520 + Math.cos(a) * 20, 470 + Math.sin(a) * 20, 20, 12, 12, a), '#e87a9a', { lift: 0.5, wob: 0.3 }); } disc(P, 520, 470, 11, '#f6d85a', { lift: 0.4 });
  },
  // Anning: Klippen von Lyme Regis, Ammoniten
  klippen(P, G, c) {
    const sky = C(c, 0, '#c7d6da'), slate = C(c, 1, '#6f8494'), cream = C(c, 2, '#d8c8a2');
    base(P, sky, '#e8eadf');
    cloud(P, 300, 110, 0.9, '#fff'); cloud(P, 120, 300, 0.5, '#fff');
    for (const [x, y, s] of [[200, 200, 1], [250, 170, 0.8], [510, 300, 0.9]]) { P.line([[x - 14 * s, y - 6 * s], [x - 6 * s, y - 12 * s], [x, y - 4 * s], [x + 6 * s, y - 12 * s], [x + 14 * s, y - 6 * s]], '#fff', 3.2 * s, { a: 1, shadow: true }); }
    band(P, 520, 300, '#7aa4b0', { amp: 6, wl: 70, scallop: true }); band(P, 560, 300, '#5a8a9a', { amp: 7, wl: 60, ph: 0.5, scallop: true });
    // Klippen mit Schichten
    const strata = (poly) => P.cut(poly, slate, { lift: 0.9, smooth: false, wob: 1.4, step: 20, grad: false, deco: (ctx, bb) => {
      let y = bb.y0, i = 0; while (y < bb.y1 + 20) { const h = 18 + (i * 7) % 16; ctx.fillStyle = i % 4 === 0 ? mix(cream, slate, 0.35) : i % 4 === 2 ? mix(slate, '#fff', 0.15) : shade(slate, (i % 3) * 0.08); ctx.beginPath(); ctx.moveTo(bb.x0 - 5, y); for (let x = bb.x0; x <= bb.x1 + 5; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.04 + i) * 3); ctx.lineTo(bb.x1 + 5, y + h); ctx.lineTo(bb.x0 - 5, y + h); ctx.fill(); y += h; i++; } } });
    strata([[-20, 640], [-20, 250], [50, 232], [100, 262], [140, 330], [180, 390], [214, 470], [226, 640]]);
    strata([[640, 640], [640, 300], [580, 282], [520, 320], [480, 400], [462, 470], [450, 640]]);
    // Ammoniten
    const ammo = (x, y, r) => {
      const ctrl = []; for (let i = 0; i <= 26; i++) { const t = i / 26 * 4.2 * Math.PI, rad = r * 0.12 * Math.exp(0.2 * t) * 1.0; ctrl.push([x + Math.cos(t) * rad, y + Math.sin(t) * rad, rad * 0.62]); }
      const shell = ribbon(ctrl.filter((_, i) => i % 2 === 0 || i === 26), { step: 4 });
      P.cut(shell, cream, { lift: 0.8, wob: 0.5, deco: (ctx) => { ctx.strokeStyle = alpha('#7a6a48', 0.55); ctx.lineWidth = 1.6; for (let i = 0; i < ctrl.length - 1; i++) { const t = i / 26 * 4.2 * Math.PI, rad = r * 0.12 * Math.exp(0.2 * t); ctx.beginPath(); ctx.moveTo(x + Math.cos(t) * (rad - rad * 0.3), y + Math.sin(t) * (rad - rad * 0.3)); ctx.lineTo(x + Math.cos(t) * (rad + rad * 0.3), y + Math.sin(t) * (rad + rad * 0.3)); ctx.stroke(); } } });
    };
    ammo(470, 150, 70); ammo(110, 130, 40);
  },
  // Franklin: Röntgenbeugungsbild (X-Muster) und Doppelhelix
  roentgen(P, G, c) {
    const dark = C(c, 0, '#1d2a4a'), cream = C(c, 1, '#e8e2c8'), blue = C(c, 2, '#5a8ac8');
    base(P, shade(dark, 0.25), dark);
    P.glow(G.cx, G.cy, 330, blue, 0.30); P.glow(G.cx, G.cy, 150, '#ffffff', 0.12);
    const { ctx } = P;
    const spot = (x, y, rx, ry, rot, a) => { ctx.save(); ctx.translate(x, y); ctx.rotate(rot); ctx.scale(1, ry / rx); const g = ctx.createRadialGradient(0, 0, 0, 0, 0, rx); g.addColorStop(0, alpha('#fffdf0', a)); g.addColorStop(0.45, alpha(cream, a * 0.8)); g.addColorStop(1, alpha(cream, 0)); ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, rx, 0, TAU); ctx.fill(); ctx.restore(); };
    // zwei Diagonalen mit Reflexen (X); jeder Reflex hat zwei Nachbarn quer dazu (Rautenmuster)
    for (const sg of [-1, 1]) for (const ss of [-1, 1]) for (let t = 1; t <= 8; t++) {
      const dx = ss * 0.82, dy = sg * 0.66, m = Math.hypot(dx, dy), d = t * 41, x = G.cx + dx * d, y = G.cy + dy * d, rot = Math.atan2(dy, dx), a = Math.max(0.3, 1 - t * 0.08);
      spot(x, y, 24 - t * 1.2, 11 - t * 0.5, rot, a);
      for (const q of [-1, 1]) spot(x + (-dy / m) * 26 * q * 0.9, y + (dx / m) * 26 * q * 0.9, 13 - t * 0.6, 7 - t * 0.3, rot, a * 0.6);
    }
    // Schichtlinien oben und unten (Chevrons)
    for (const sg of [-1, 1]) for (let k = 0; k < 3; k++) for (let i = -4; i <= 4; i++) { if (!i && k === 0) continue; spot(G.cx + i * 40, G.cy + sg * (150 + k * 62 + Math.abs(i) * 14), 11, 7, 0, 0.8 - k * 0.2 - Math.abs(i) * 0.04); }
    spot(G.cx, G.cy, 38, 38, 0, 0.5);
    ctx.save(); ctx.strokeStyle = alpha(cream, 0.12); ctx.lineWidth = 2; for (const r of [150, 230, 310]) { ctx.beginPath(); ctx.arc(G.cx, G.cy, r, 0, TAU); ctx.stroke(); } ctx.restore();
    // Doppelhelix rechts und links
    for (const hx of [62, 540]) {
      const A = [], B = []; for (let y = 50; y <= 600; y += 10) { const t = y / 46; A.push([hx + Math.sin(t) * 24, y]); B.push([hx - Math.sin(t) * 24, y]); }
      for (let y = 50; y <= 600; y += 23) { const t = y / 46, a = hx + Math.sin(t) * 24, b = hx - Math.sin(t) * 24; P.line([[a, y], [b, y]], alpha(cream, 0.55), 2.2, { smooth: false }); }
      P.line(A, '#e8a83a', 5, { a: 0.95, shadow: true }); P.line(B, '#6ab4e8', 5, { a: 0.95, shadow: true });
    }
  },
};
