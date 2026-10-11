// Kleidung als Papierschnitt-Lagen. Jeder Stil hat base (hinter dem Hals) und top (Kragen, Revers, Schmuck: vor dem Hals, hinter dem Gesicht).
import { mix, shade, tint, alpha, ell, spline, mirrorX, bez, TAU } from './paper.js';

const mir = (cx, half) => mirrorX(half.map(([x, y]) => [cx + x, y]), cx);
// rechte Hälfte (x relativ zur Mitte) und linke Hälfte als getrennte Formen
const both = (cx, pts, f) => { for (const s of [-1, 1]) { const q = pts.map(([x, y]) => [cx + s * x, y]); f(s < 0 ? q.reverse() : q, s); } };

function torso(P, G, col, o = {}) {
  const cx = G.cx, ny = G.Y(1.0) + 36, hw = o.hw ?? 252, nk = o.neck ?? 54, d = o.d ?? 6;
  G._sl = { col: o.sleeve || col, deco: o.deco, hw, nk, ny, none: o.noSleeves, hi: o.hi ?? 0.08 };
  const half = [[0, ny + d], [nk * 0.5, ny + d - (d > 12 ? 2 : 0)], [nk * 0.9, ny + d * 0.45 - 2], [nk, ny - 4], [nk + 70, ny + 14], [hw - 48, ny + 54], [hw - 6, ny + 124], [hw, 830], [0, 830]];
  return P.cut(mir(cx, half), col, { lift: 0.9, wob: 1.1, deco: (ctx, bb) => {
    const g = ctx.createLinearGradient(0, ny, 0, 800); g.addColorStop(0, alpha('#ffffff', o.hi ?? 0.08)); g.addColorStop(0.4, 'rgba(0,0,0,0)'); g.addColorStop(1, 'rgba(20,10,5,0.22)'); ctx.fillStyle = g; ctx.fillRect(0, ny - 20, 600, 800);
    if (o.deco) o.deco(ctx, bb);
  } });
}
// Ärmel als eigene Papierlage über dem Rumpf (wirft Schatten auf die Brust)
export function sleeves(P, G) {
  const S = G._sl; if (!S || S.none) return; const cx = G.cx, { ny, hw, nk } = S;
  both(cx, [[nk + 76, ny + 14], [hw - 48, ny + 54], [hw - 6, ny + 124], [hw, 830], [hw - 96, 830], [hw - 104, ny + 300], [hw - 104, ny + 168], [hw - 92, ny + 90]], (q, s) => {
    P.cut(q, shade(S.col, 0.04), { lift: 0.8, wob: 1.0, deco: (ctx, bb) => {
      const g = ctx.createLinearGradient(cx + s * hw, 0, cx + s * (hw - 100), 0); g.addColorStop(0, 'rgba(20,10,5,0.20)'); g.addColorStop(0.5, 'rgba(255,255,255,0.04)'); g.addColorStop(1, 'rgba(20,10,5,0.12)'); ctx.fillStyle = g; ctx.fillRect(0, ny, 600, 800);
      if (S.deco) S.deco(ctx, bb);
      ctx.strokeStyle = alpha(shade(S.col, 0.4), 0.22); ctx.lineWidth = 2;
      for (let k = 0; k < 2; k++) { const x = cx + s * (hw - 40 - k * 36); ctx.beginPath(); ctx.moveTo(x - s * 6, ny + 120); ctx.quadraticCurveTo(x + s * 4, ny + 300, x - s * 2, 800); ctx.stroke(); }
    } });
  });
}
function button(P, x, y, col = '#d8b04a', r = 6) {
  P.cut(ell(x, y, r, r, 12), col, { lift: 0.35, wob: 0.2, edge: false });
  P.dot(x - r * 0.28, y - r * 0.3, r * 0.28, '#fff6d0', 0.7);
}
function folds(P, list, col, w = 1.6, a = 0.28) { for (const l of list) P.line(l, col, w, { a }); }
// Knopfleiste
const buttons = (P, x, y0, y1, n, col, r) => { for (let i = 0; i < n; i++) button(P, x, y0 + (y1 - y0) * i / Math.max(1, n - 1), col, r); };

function cravat(P, G, col, o = {}) {
  const cx = G.cx, ny = G.Y(1.0) + 36, w = o.w ?? 1;
  // Binde um den Hals
  P.cut([[cx - 62 * w, ny - 30], [cx + 62 * w, ny - 30], [cx + 66 * w, ny + 6], [cx + 34 * w, ny + 20], [cx - 34 * w, ny + 20], [cx - 66 * w, ny + 6]], col, { lift: 0.8, wob: 0.7, deco: (ctx) => {
    ctx.strokeStyle = alpha(shade(col, 0.35), 0.4); ctx.lineWidth = 1.5;
    for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx - 62 * w, ny - 22 + i * 12); ctx.quadraticCurveTo(cx, ny - 14 + i * 12, cx + 62 * w, ny - 22 + i * 12); ctx.stroke(); }
  } });
  // Schleifenenden
  for (const sg of [-1, 1]) P.cut([[cx + sg * 6, ny + 2], [cx + sg * 36 * w, ny + 8], [cx + sg * 44 * w, ny + 46], [cx + sg * 22 * w, ny + 52], [cx + sg * 8, ny + 22]], col, { lift: 0.7, wob: 0.5, deco: (ctx) => { ctx.strokeStyle = alpha(shade(col, 0.35), 0.4); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(cx + sg * 12, ny + 12); ctx.lineTo(cx + sg * 32 * w, ny + 44); ctx.stroke(); } });
  P.cut(ell(cx, ny + 2, 14 * w, 12, 12), tint(col, 0.04), { lift: 0.8, wob: 0.4 });
}
function stiffCollar(P, G, col, o = {}) { // hohe Kragenspitzen neben den Wangen
  const cx = G.cx, ny = G.Y(1.0) + 36, w = o.w ?? 1, top = G.Y(o.h ?? 0.66);
  both(cx, [[22, ny - 2], [96 * w, top], [106 * w, top + 12], [72 * w, ny - 14], [58 * w, ny + 6], [30, ny + 10]], (q) => P.cut(q, col, { lift: 0.7, wob: 0.5, smooth: false, step: 8, deco: (ctx) => { ctx.strokeStyle = alpha(shade(col, 0.3), 0.3); ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(q[0][0], q[0][1] - 4); ctx.lineTo(q[1][0] + (q[1][0] < cx ? 6 : -6), q[1][1] + 12); ctx.stroke(); } }));
}
function pleats(P, G, col, x0, x1, y0, y1, n, a = 0.18) {
  for (let i = 0; i <= n; i++) { const x = x0 + (x1 - x0) * i / n; P.line([[x, y0], [x + (x - G.cx) * 0.06, (y0 + y1) / 2], [x + (x - G.cx) * 0.1, y1]], col, 1.5, { a }); }
}

export const DRESS = {
  // Griechisches Gewand: helles Untergewand (Chiton) und Mantel (Himation) schräg über Brust und Schulter
  himation: {
    base(P, G, D) { torso(P, G, D.under || '#efe4cc', { hw: 254, hi: 0.1 }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, col = D.col || '#c9a05a', bord = D.trim || '#2f4f7a';
      P.cut([[cx - 26, ny + 2], [cx + 60, ny - 4], [cx + 150, ny + 20], [cx + 222, ny + 58], [cx + 264, ny + 128], [cx + 268, 830], [cx - 270, 830], [cx - 270, ny + 290], [cx - 200, ny + 216], [cx - 120, ny + 150], [cx - 60, ny + 70]], col, { lift: 1.0, wob: 1.2, deco: (ctx) => {
        const g = ctx.createLinearGradient(cx - 200, ny, cx + 260, 800); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(40,20,5,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 830);
        ctx.strokeStyle = alpha(shade(col, 0.4), 0.38); ctx.lineWidth = 2;
        for (let i = 0; i < 6; i++) { const t = i / 5; ctx.beginPath(); ctx.moveTo(cx - 50 + t * 270, ny + 26 + t * 40); ctx.quadraticCurveTo(cx + 60 + t * 120, ny + 140 + t * 90, cx - 30 + t * 140 + 60, 800); ctx.stroke(); }
        ctx.strokeStyle = alpha(tint(col, 0.5), 0.35); ctx.lineWidth = 1.6; for (let i = 0; i < 5; i++) { const t = i / 4; ctx.beginPath(); ctx.moveTo(cx - 45 + t * 250, ny + 34 + t * 36); ctx.quadraticCurveTo(cx + 70 + t * 110, ny + 150 + t * 80, cx + t * 140 + 70, 800); ctx.stroke(); }
        // Saum mit Mäanderband unten
        ctx.fillStyle = alpha(bord, 0.9); ctx.fillRect(0, 760, 600, 40); ctx.strokeStyle = alpha('#f2e2b4', 0.9); ctx.lineWidth = 3;
        for (let x = 40; x < 600; x += 30) { ctx.beginPath(); ctx.moveTo(x, 790); ctx.lineTo(x, 768); ctx.lineTo(x + 20, 768); ctx.lineTo(x + 20, 780); ctx.lineTo(x + 10, 780); ctx.stroke(); }
      } });
      // gerollter Mantelrand entlang der Schräge
      P.cut([[cx - 34, ny - 2], [cx - 16, ny - 6], [cx - 100, ny + 120], [cx - 180, ny + 200], [cx - 272, ny + 270], [cx - 272, ny + 304], [cx - 190, ny + 244], [cx - 100, ny + 160], [cx - 50, ny + 80]], shade(col, 0.1), { lift: 0.6, wob: 0.9, deco: (ctx) => { ctx.strokeStyle = alpha(bord, 0.9); ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(cx - 28, ny); ctx.quadraticCurveTo(cx - 90, ny + 120, cx - 270, ny + 285); ctx.stroke(); } });
      // Ausschnitt des Chitons
      P.line([[cx - 56, ny + 6], [cx - 10, ny + 26], [cx + 44, ny + 10]], shade(D.under || '#efe4cc', 0.25), 2, { a: 0.5 });
    },
  },
  // Ägyptisches Prachtkragen-Kleid (Kleopatra als Künstlerdarstellung): weißes Leinen, breiter Perlenkragen
  usech: {
    base(P, G, D) {
      torso(P, G, D.col || '#f4efe2', { hw: 226, hi: 0.1, d: 56, neck: 88, noSleeves: true });
      const cx = G.cx, ny = G.Y(1.0) + 36;
      pleats(P, G, shade(D.col || '#f4efe2', 0.25), cx - 220, cx + 220, ny + 40, 800, 22, 0.2);
    },
    top(P, G, D) {
      const cx = G.cx, cy = G.Y(1.0) + 6, cols = D.rings || ['#e2b64a', '#2a5aa0', '#3bb3a8', '#c0432e', '#e2b64a'];
      const n = cols.length;
      for (let k = n - 1; k >= 0; k--) {
        const rx1 = 80 + (k + 1) * 34, ry1 = 58 + (k + 1) * 24, rx0 = 80 + k * 34, ry0 = 58 + k * 24;
        const pts = []; for (let i = 0; i <= 18; i++) { const a = Math.PI * i / 18; pts.push([cx + rx1 * Math.cos(a), cy + ry1 * Math.sin(a) * 0.98 - 6]); }
        for (let i = 18; i >= 0; i--) { const a = Math.PI * i / 18; pts.push([cx + rx0 * Math.cos(a), cy + ry0 * Math.sin(a) * 0.98 - 6]); }
        P.cut(pts, cols[k], { lift: 0.7, wob: 0.4, smooth: false, step: 9, deco: (ctx) => {
          ctx.strokeStyle = alpha(shade(cols[k], 0.4), 0.55); ctx.lineWidth = 1.4;
          for (let i = 0; i <= 44; i++) { const a = Math.PI * i / 44, c = Math.cos(a), s = Math.sin(a); ctx.beginPath(); ctx.moveTo(cx + rx0 * c, cy + ry0 * s * 0.98 - 6); ctx.lineTo(cx + rx1 * c, cy + ry1 * s * 0.98 - 6); ctx.stroke(); }
        } });
      }
      // Tropfen am Außenrand
      const rx = 80 + n * 34, ry = 58 + n * 24;
      for (let i = 1; i < 26; i++) { const a = Math.PI * i / 26; const x = cx + rx * Math.cos(a), y = cy + ry * Math.sin(a) * 0.98 - 6; P.cut(ell(x + 0.6 * Math.cos(a) * 8, y + 7, 4.5, 9, 8, -Math.cos(a) * 0.6), i % 2 ? '#3bb3a8' : '#c0432e', { lift: 0.4, wob: 0.2, edge: false, grad: false }); }
    },
  },
  // Gehrock um 1822 mit Weste, hohem Kragen und weißer Halsbinde
  frock: {
    base(P, G, D) { torso(P, G, D.col || '#34463c', { hw: 254 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 190, ny + 120], [cx - 214, ny + 330], [cx - 220, 800]], [[cx + 190, ny + 120], [cx + 214, ny + 330], [cx + 220, 800]]], shade(D.col || '#34463c', 0.5), 2, 0.3); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#34463c', vest = D.vest || '#d6b36e', rev = D.rev || tint(coat, 0.1);
      P.cut([[cx - 64, ny - 4], [cx + 64, ny - 4], [cx + 82, 820], [cx - 82, 820]], vest, { lift: 0.6, wob: 0.8, deco: (ctx) => {
        ctx.fillStyle = alpha(shade(vest, 0.3), 0.35); for (let y = ny + 20; y < 800; y += 20) for (let x = cx - 80 + ((y / 20) % 2) * 10; x < cx + 82; x += 20) { ctx.beginPath(); ctx.arc(x, y, 2, 0, TAU); ctx.fill(); } } });
      P.cut([[cx - 32, ny - 2], [cx + 32, ny - 2], [cx + 16, ny + 90], [cx - 16, ny + 90]], '#f4efe4', { lift: 0.4, smooth: false });
      both(cx, [[52, ny - 6], [140, ny + 32], [104, ny + 84], [118, ny + 146], [70, ny + 300], [46, ny + 300], [52, ny + 80]], (q) => P.cut(q, rev, { lift: 0.9, wob: 0.9, smooth: false, step: 10, deco: (ctx) => { ctx.strokeStyle = alpha(shade(rev, 0.5), 0.5); ctx.setLineDash([5, 4]); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(q[0][0] + (q[0][0] < cx ? 5 : -5), q[0][1] + 6); ctx.lineTo(q[4][0] + (q[0][0] < cx ? 5 : -5), q[4][1]); ctx.stroke(); } }));
      stiffCollar(P, G, '#f6f1e6', { h: 0.62, w: 1.0 });
      cravat(P, G, '#f8f4ea');
      buttons(P, cx - 40, ny + 150, ny + 300, 3, '#cdb067', 5);
    },
  },
  // Dreiteiler der 1920er mit Fliege
  anzug: {
    base(P, G, D) { torso(P, G, D.col || '#8a7a5e', { hw: 254, deco: (ctx) => { ctx.strokeStyle = alpha(shade(D.col || '#8a7a5e', 0.4), 0.18); ctx.lineWidth = 1; for (let i = -300; i < 700; i += 9) { ctx.beginPath(); ctx.moveTo(i, 500); ctx.lineTo(i + 300, 830); ctx.stroke(); } for (let i = 300; i > -300; i -= 9) { ctx.beginPath(); ctx.moveTo(i + 300, 500); ctx.lineTo(i, 830); ctx.stroke(); } } }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#8a7a5e', vest = D.vest || '#5c5240';
      P.cut([[cx - 70, ny - 2], [cx + 70, ny - 2], [cx + 66, 820], [cx - 66, 820]], vest, { lift: 0.6, wob: 0.8 });
      P.cut([[cx - 40, ny - 8], [cx + 40, ny - 8], [cx + 20, ny + 130], [cx - 20, ny + 130]], '#f3eee2', { lift: 0.4, smooth: false });
      buttons(P, cx, ny + 150, ny + 290, 4, '#c9a95a', 5);
      both(cx, [[56, ny - 8], [150, ny + 38], [110, ny + 100], [120, ny + 140], [76, ny + 250], [54, ny + 250], [60, ny + 90]], (q) => P.cut(q, coat, { lift: 1, wob: 0.9, smooth: false, step: 10, deco: (ctx) => { ctx.strokeStyle = alpha(shade(coat, 0.45), 0.4); ctx.lineWidth = 1.4; ctx.setLineDash([4, 4]); ctx.beginPath(); ctx.moveTo(q[0][0] + (q[0][0] < cx ? 5 : -5), q[0][1] + 8); ctx.lineTo(q[4][0] + (q[0][0] < cx ? 5 : -5), q[4][1]); ctx.stroke(); } }));
      // weicher Hemdkragen
      both(cx, [[22, ny - 10], [64, ny - 48], [78, ny - 30], [56, ny + 6], [20, ny + 2]], (q) => P.cut(q, '#f7f3e8', { lift: 0.7, wob: 0.5, smooth: false, step: 8 }));
      // Fliege
      const bow = D.bow || '#8a2f2f';
      both(cx, [[6, ny - 8], [46, ny - 22], [50, ny + 14], [6, ny + 6]], (q) => P.cut(q, bow, { lift: 0.7, wob: 0.4, smooth: true, deco: (ctx) => { ctx.strokeStyle = alpha(shade(bow, 0.4), 0.4); ctx.lineWidth = 1.2; for (let i = 0; i < 3; i++) { ctx.beginPath(); ctx.moveTo(cx + (q[0][0] < cx ? -8 : 8), ny - 2 + i * 4 - 4); ctx.lineTo(cx + (q[0][0] < cx ? -44 : 44), ny - 8 + i * 6 - 4); ctx.stroke(); } } }));
      P.cut(ell(cx, ny - 2, 9, 11, 10), shade(bow, 0.12), { lift: 0.6, wob: 0.3 });
      // Uhrkette
      P.line([[cx - 54, ny + 150], [cx - 20, ny + 180], [cx + 40, ny + 168]], '#d8b04a', 2.4, { a: 0.95, shadow: true });
    },
  },
  // Spätmittelalterlicher Rock mit Pelzkragen
  mittelalter: {
    base(P, G, D) { torso(P, G, D.col || '#7a2f2a', { hw: 254, deco: (ctx) => {
      const cx = G.cx, ny = G.Y(1.0) + 36; ctx.strokeStyle = alpha(shade(D.col || '#7a2f2a', 0.5), 0.3); ctx.lineWidth = 2;
      for (let i = -5; i <= 5; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 40, ny + 90); ctx.quadraticCurveTo(cx + i * 46, ny + 300, cx + i * 56, 810); ctx.stroke(); }
      ctx.fillStyle = alpha('#3a2216', 0.9); ctx.fillRect(0, ny + 250, 600, 30); ctx.fillStyle = '#d8b04a'; ctx.fillRect(cx - 14, ny + 252, 28, 26);
    } }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, fur = D.fur || '#e8dfcc';
      P.cut([[cx - 54, ny - 14], [cx + 54, ny - 14], [cx + 42, ny + 60], [cx - 42, ny + 60]], '#efe6d2', { lift: 0.5, wob: 0.6 }); // Hemd
      for (let i = 0; i < 4; i++) P.line([[cx - 16, ny + 4 + i * 11], [cx + 16, ny + 8 + i * 11]], '#8a6a4a', 1.4, { a: 0.7 });
      P.cut([[cx - 250, ny + 100], [cx - 214, ny + 44], [cx - 150, ny + 20], [cx - 56, ny - 14], [cx + 56, ny - 14], [cx + 150, ny + 20], [cx + 214, ny + 44], [cx + 250, ny + 100], [cx + 150, ny + 130], [cx + 60, ny + 100], [cx - 60, ny + 100], [cx - 150, ny + 130]],
      fur, { lift: 1, wob: 1.2, bump: { amp: 4, wl: 20 }, deco: (ctx) => { ctx.fillStyle = alpha('#3a2a1c', 0.55); for (let i = 0; i < 28; i++) { const x = cx - 230 + ((i * 53) % 460), y = ny + 30 + ((i * 29) % 80); ctx.beginPath(); ctx.ellipse(x, y, 3, 8, 0.4, 0, TAU); ctx.fill(); } } });
    },
  },
  // Dunkler Gehrock mit locker gebundenem Tuch (Darwin)
  victorian: {
    base(P, G, D) { torso(P, G, D.col || '#2e2d32', { hw: 254, hi: 0.1 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 150, ny + 100], [cx - 190, ny + 300], [cx - 200, 800]], [[cx + 150, ny + 100], [cx + 190, ny + 300], [cx + 200, 800]]], tint(D.col || '#2e2d32', 0.3), 2, 0.3); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#2e2d32';
      P.cut([[cx - 56, ny - 6], [cx + 56, ny - 6], [cx + 60, 820], [cx - 60, 820]], D.vest || '#4a4a52', { lift: 0.6 });
      both(cx, [[44, ny - 12], [150, ny + 36], [120, ny + 100], [132, ny + 170], [86, ny + 280], [52, ny + 280], [52, ny + 80]], (q) => P.cut(q, tint(coat, 0.06), { lift: 1, wob: 0.9, smooth: false, step: 10 }));
      both(cx, [[20, ny - 10], [50, ny - 40], [68, ny - 24], [52, ny + 6], [20, ny + 2]], (q) => P.cut(q, '#f2eee2', { lift: 0.6, wob: 0.5, smooth: false, step: 8 }));
      P.cut([[cx - 44, ny - 10], [cx + 44, ny - 10], [cx + 20, ny + 40], [cx + 30, ny + 112], [cx, ny + 130], [cx - 30, ny + 112], [cx - 20, ny + 40]], D.tie || '#1c1c20', { lift: 0.8, wob: 0.8 });
    },
  },
  // Schwedischer Rock mit goldener Knopfleiste und Spitzenjabot (Linné)
  schwedisch: {
    base(P, G, D) { torso(P, G, D.col || '#2f5a7a', { hw: 254 }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#2f5a7a';
      P.cut([[cx - 80, ny - 6], [cx + 80, ny - 6], [cx + 94, 820], [cx - 94, 820]], D.vest || '#efe2c0', { lift: 0.6, deco: (ctx) => {
        ctx.strokeStyle = alpha('#c9a24a', 0.7); ctx.lineWidth = 2; for (let i = 0; i < 9; i++) { ctx.beginPath(); ctx.moveTo(cx - 72, ny + 80 + i * 40); ctx.quadraticCurveTo(cx - 50, ny + 62 + i * 40, cx - 28, ny + 80 + i * 40); ctx.moveTo(cx + 72, ny + 80 + i * 40); ctx.quadraticCurveTo(cx + 50, ny + 62 + i * 40, cx + 28, ny + 80 + i * 40); ctx.stroke(); } } });
      both(cx, [[78, ny - 4], [160, ny + 36], [132, ny + 120], [100, ny + 330], [84, ny + 330], [80, ny + 100]], (q) => P.cut(q, coat, { lift: 1, wob: 0.9, smooth: false, step: 10 }));
      for (const s of [-1, 1]) buttons(P, cx + s * 100, ny + 120, ny + 320, 5, '#d8b04a', 5.5);
      // Jabot
      P.cut([[cx - 40, ny - 14], [cx + 40, ny - 14], [cx + 56, ny + 40], [cx + 36, ny + 110], [cx + 14, ny + 90], [cx, ny + 140], [cx - 14, ny + 90], [cx - 36, ny + 110], [cx - 56, ny + 40]], '#fbf7ec', { lift: 0.9, wob: 0.7, bump: { amp: 3, wl: 14 }, deco: (ctx) => { ctx.strokeStyle = alpha('#b8a888', 0.6); ctx.lineWidth = 1.3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 40, ny + i * 24); ctx.quadraticCurveTo(cx, ny + 14 + i * 24, cx + 40, ny + i * 24); ctx.stroke(); } } });
      P.cut(ell(cx, ny - 6, 28, 12, 12), '#f6f0e0', { lift: 0.6, wob: 0.4 });
    },
  },
  // Schwarze Ordenstracht mit weißem Kragenstreifen und Brustkreuz (Mendel)
  habit: {
    base(P, G, D) { torso(P, G, D.col || '#26242a', { hw: 254, hi: 0.12 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 40, ny + 90], [cx - 60, ny + 300], [cx - 70, 800]], [[cx + 40, ny + 90], [cx + 60, ny + 300], [cx + 70, 800]], [[cx - 170, ny + 100], [cx - 200, ny + 300], [cx - 212, 800]], [[cx + 170, ny + 100], [cx + 200, ny + 300], [cx + 212, 800]]], tint(D.col || '#26242a', 0.35), 2.2, 0.35); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, col = D.col || '#26242a';
      P.cut([[cx - 56, ny - 10], [cx + 56, ny - 10], [cx + 62, ny + 24], [cx - 62, ny + 24]], tint(col, 0.08), { lift: 0.7, wob: 0.6 }); // Stehkragen
      P.cut([[cx - 22, ny - 8], [cx + 22, ny - 8], [cx + 22, ny + 18], [cx - 22, ny + 18]], '#f6f2e8', { lift: 0.5, smooth: false }); // Kragenstreifen
      both(cx, [[56, ny + 4], [120, ny + 44], [90, ny + 120], [92, ny + 330], [60, ny + 330], [42, ny + 70]], (q) => P.cut(q, shade(col, 0.1), { lift: 0.7, wob: 0.7, smooth: false, step: 10 }));
      // Brustkreuz an Kette
      P.line([[cx - 56, ny + 10], [cx - 40, ny + 80], [cx, ny + 150]], '#c9c2b2', 2.2, { a: 0.95, shadow: true }); P.line([[cx + 56, ny + 10], [cx + 40, ny + 80], [cx, ny + 150]], '#c9c2b2', 2.2, { a: 0.95, shadow: true });
      P.cut([[cx - 7, ny + 140], [cx + 7, ny + 140], [cx + 7, ny + 162], [cx + 24, ny + 162], [cx + 24, ny + 176], [cx + 7, ny + 176], [cx + 7, ny + 214], [cx - 7, ny + 214], [cx - 7, ny + 176], [cx - 24, ny + 176], [cx - 24, ny + 162], [cx - 7, ny + 162]], D.cross || '#d8d2c2', { lift: 0.8, smooth: false, wob: 0.3, step: 30 });
    },
  },
  // Frack mit Stehkragen, weißer Weste und hoher Halsbinde (Humboldt)
  frack: {
    base(P, G, D) { torso(P, G, D.col || '#243a5a', { hw: 254 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 180, ny + 90], [cx - 205, ny + 300], [cx - 215, 800]], [[cx + 180, ny + 90], [cx + 205, ny + 300], [cx + 215, 800]]], tint(D.col || '#243a5a', 0.25), 2, 0.3); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#243a5a';
      P.cut([[cx - 60, ny - 4], [cx + 60, ny - 4], [cx + 70, 820], [cx - 70, 820]], D.vest || '#f1ead8', { lift: 0.6, deco: (ctx) => { ctx.strokeStyle = alpha('#c8b890', 0.6); ctx.lineWidth = 1.4; for (let y = ny + 40; y < 800; y += 22) { ctx.beginPath(); ctx.moveTo(cx - 70, y); ctx.lineTo(cx + 70, y); ctx.stroke(); } } });
      both(cx, [[50, ny - 8], [146, ny + 30], [112, ny + 90], [124, ny + 160], [82, ny + 300], [50, ny + 300], [54, ny + 80]], (q) => P.cut(q, coat, { lift: 1, wob: 0.9, smooth: false, step: 10 }));
      both(cx, [[40, ny - 20], [128, ny - 4], [140, ny + 24], [64, ny + 10]], (q) => P.cut(q, shade(coat, 0.2), { lift: 0.6, wob: 0.7, smooth: false, step: 10 })); // Stehkragen des Rocks
      stiffCollar(P, G, '#f7f2e6', { h: 0.7, w: 1.0, out: 8 });
      cravat(P, G, '#fbf8ef', { w: 1.1 });
      if (D.ribbon) { P.cut([[cx + 78, ny + 70], [cx + 106, ny + 66], [cx + 118, ny + 120], [cx + 90, ny + 128]], D.ribbon, { lift: 0.6 }); P.cut(ell(cx + 100, ny + 140, 14, 14, 10), '#d8b04a', { lift: 0.6 }); }
    },
  },
  // Kleid des 17. Jahrhunderts mit großem weißen Kragen und Schnürung (Merian)
  barock: {
    base(P, G, D) { torso(P, G, D.col || '#4a2a30', { hw: 226, hi: 0.1 }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, col = D.col || '#4a2a30', lace = D.collar || '#f6f1e4';
      // Mieder / Schnürung
      P.cut([[cx - 72, ny + 20], [cx + 72, ny + 20], [cx + 90, 820], [cx - 90, 820]], D.stomacher || shade(col, 0.15), { lift: 0.6, deco: (ctx) => {
        ctx.strokeStyle = alpha('#d8b878', 0.8); ctx.lineWidth = 2; for (let i = 0; i < 8; i++) { const y = ny + 70 + i * 32; ctx.beginPath(); ctx.moveTo(cx - 24, y); ctx.lineTo(cx + 24, y + 12); ctx.moveTo(cx + 24, y); ctx.lineTo(cx - 24, y + 12); ctx.stroke(); } } });
      // Kragen: breiter, runder Schulterkragen
      P.cut([[cx - 60, ny - 22], [cx + 60, ny - 22], [cx + 150, ny + 8], [cx + 205, ny + 48], [cx + 196, ny + 94], [cx + 120, ny + 104], [cx + 60, ny + 90], [cx - 60, ny + 90], [cx - 120, ny + 104], [cx - 196, ny + 94], [cx - 205, ny + 48], [cx - 150, ny + 8]], lace, { lift: 1, wob: 0.9, bump: { amp: 3.2, wl: 16 }, deco: (ctx) => {
        ctx.strokeStyle = alpha('#b8a888', 0.55); ctx.lineWidth = 1.3; for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.ellipse(cx, ny + 8, 90 + i * 28, 30 + i * 18, 0, 0.1, Math.PI - 0.1); ctx.stroke(); } } });
      P.cut(ell(cx, ny + 40, 12, 12, 10), '#c9a24a', { lift: 0.6 });
    },
  },
  // Schlichtes Kleid mit Schultertuch und Brosche (Anning)
  schlicht: {
    base(P, G, D) { torso(P, G, D.col || '#4e5a60', { hw: 226 }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, shawl = D.shawl || '#e8dcc2';
      P.cut([[cx - 44, ny - 6], [cx + 44, ny - 6], [cx + 190, ny + 50], [cx + 214, ny + 110], [cx + 120, ny + 220], [cx, ny + 330], [cx - 120, ny + 220], [cx - 214, ny + 110], [cx - 190, ny + 50]], shawl, { lift: 1, wob: 1, deco: (ctx) => {
        ctx.strokeStyle = alpha('#8a6a4a', 0.45); ctx.lineWidth = 1.4; for (let i = -9; i <= 9; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 22, ny); ctx.lineTo(cx + i * 22 + (i * 5), ny + 340); ctx.stroke(); }
        ctx.strokeStyle = alpha('#a2554a', 0.55); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(cx - 190, ny + 56); ctx.lineTo(cx, ny + 330); ctx.lineTo(cx + 190, ny + 56); ctx.stroke(); } });
      P.cut(ell(cx, ny + 36, 11, 11, 10), '#b8863a', { lift: 0.7 });
    },
  },
  // Weißer Laborkittel über Bluse (Franklin)
  kittel: {
    base(P, G, D) { torso(P, G, D.col || '#f2efe8', { hw: 240, hi: 0.04 }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#f2efe8', blouse = D.blouse || '#8fb0c8';
      P.cut([[cx - 70, ny - 10], [cx + 70, ny - 10], [cx + 40, ny + 130], [cx - 40, ny + 130]], blouse, { lift: 0.6, wob: 0.6 });
      both(cx, [[16, ny - 12], [78, ny - 22], [94, ny + 30], [30, ny + 24]], (q) => P.cut(q, tint(blouse, 0.15), { lift: 0.6, wob: 0.5, smooth: false, step: 8 })); // Blusenkragen
      both(cx, [[44, ny - 6], [140, ny + 34], [96, ny + 110], [112, ny + 140], [56, ny + 330], [30, ny + 330], [30, ny + 100]], (q) => P.cut(q, coat, { lift: 1, wob: 0.8, smooth: false, step: 10, deco: (ctx) => { const g = ctx.createLinearGradient(0, ny, 0, 800); g.addColorStop(0, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(60,40,20,0.08)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 800); } }));
      // Brusttasche mit Stiften
      P.cut([[cx + 100, ny + 190], [cx + 170, ny + 190], [cx + 170, ny + 250], [cx + 100, ny + 250]], tint(coat, 0.0), { lift: 0.6, smooth: false, step: 20 });
      P.cut([[cx + 118, ny + 160], [cx + 126, ny + 160], [cx + 126, ny + 196], [cx + 118, ny + 196]], '#2a4a6a', { lift: 0.4, smooth: false, step: 20 });
      P.cut([[cx + 134, ny + 168], [cx + 142, ny + 168], [cx + 142, ny + 198], [cx + 134, ny + 198]], '#b03a3a', { lift: 0.4, smooth: false, step: 20 });
      for (let i = 0; i < 3; i++) button(P, cx, ny + 160 + i * 60, '#d9d4c8', 5);
    },
  },
  // Rock des 18. Jahrhunderts mit Stoffknöpfen und Spitzenjabot (Lavoisier)
  rokoko: {
    base(P, G, D) { torso(P, G, D.col || '#6b2f3a', { hw: 254 }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#6b2f3a';
      P.cut([[cx - 84, ny - 6], [cx + 84, ny - 6], [cx + 96, 820], [cx - 96, 820]], D.vest || '#e6d3a4', { lift: 0.6, deco: (ctx) => { ctx.strokeStyle = alpha('#b8943e', 0.65); ctx.lineWidth = 2; for (const s of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx + s * 86, ny + 40); ctx.lineTo(cx + s * 86, 800); ctx.stroke(); } } });
      both(cx, [[84, ny - 4], [170, ny + 36], [140, ny + 140], [110, ny + 330], [90, ny + 330], [86, ny + 100]], (q) => P.cut(q, coat, { lift: 1, wob: 0.9, smooth: false, step: 10 }));
      for (const s of [-1, 1]) buttons(P, cx + s * 100, ny + 130, ny + 330, 5, tint(coat, 0.3), 6);
      P.cut([[cx - 36, ny - 12], [cx + 36, ny - 12], [cx + 60, ny + 40], [cx + 40, ny + 100], [cx + 14, ny + 86], [cx, ny + 124], [cx - 14, ny + 86], [cx - 40, ny + 100], [cx - 60, ny + 40]], '#fbf7ec', { lift: 0.9, wob: 0.7, bump: { amp: 3, wl: 13 }, deco: (ctx) => { ctx.strokeStyle = alpha('#b8a888', 0.6); ctx.lineWidth = 1.3; for (let i = 0; i < 5; i++) { ctx.beginPath(); ctx.moveTo(cx - 40, ny + i * 22); ctx.quadraticCurveTo(cx, ny + 14 + i * 22, cx + 40, ny + i * 22); ctx.stroke(); } } });
    },
  },
  // Dunkler Rock, offenes weißes Hemd (Mendelejew)
  russisch: {
    base(P, G, D) { torso(P, G, D.col || '#3a3a40', { hw: 254 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 160, ny + 100], [cx - 190, ny + 300], [cx - 200, 800]], [[cx + 160, ny + 100], [cx + 190, ny + 300], [cx + 200, ny + 330]]], tint(D.col || '#3a3a40', 0.28), 2, 0.3); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36;
      P.cut([[cx - 70, ny - 10], [cx + 70, ny - 10], [cx + 36, ny + 190], [cx, ny + 220], [cx - 36, ny + 190]], D.shirt || '#efe9db', { lift: 0.6, wob: 0.7 });
      both(cx, [[46, ny - 14], [150, ny + 30], [122, ny + 120], [110, ny + 190], [60, ny + 330], [30, ny + 230], [60, ny + 80]], (q) => P.cut(q, shade(D.col || '#3a3a40', 0.12), { lift: 1, wob: 0.9, smooth: false, step: 10 }));
      both(cx, [[20, ny - 10], [62, ny - 34], [78, ny - 16], [54, ny + 12], [24, ny + 8]], (q) => P.cut(q, '#f3eee0', { lift: 0.6, wob: 0.5, smooth: false, step: 8 }));
    },
  },
  // Schwarzes Kleid mit schmalem weißen Kragenrand (Curie)
  trauer: {
    base(P, G, D) { torso(P, G, D.col || '#2c2a2e', { hw: 226, hi: 0.14, d: 16, neck: 58 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 110, ny + 80], [cx - 130, ny + 300], [cx - 140, 800]], [[cx + 110, ny + 80], [cx + 130, ny + 300], [cx + 140, 800]], [[cx - 30, ny + 120], [cx - 36, ny + 400]], [[cx + 30, ny + 120], [cx + 36, ny + 400]]], tint(D.col || '#2c2a2e', 0.3), 2.2, 0.3); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, col = D.col || '#2c2a2e';
      P.line([[cx - 60, ny - 6], [cx - 34, ny + 14], [cx, ny + 19], [cx + 34, ny + 14], [cx + 60, ny - 6]], '#efe9db', 5, { a: 1, shadow: true });
      P.cut(ell(cx, ny + 34, 8, 8, 10), D.brooch || '#9aa0a8', { lift: 0.6 });
    },
  },
  // Blaugrauer Arbeitskittel mit Stehkragen (Liebig)
  arbeitskittel: {
    base(P, G, D) { torso(P, G, D.col || '#6f8494', { hw: 254 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 150, ny + 100], [cx - 180, ny + 300], [cx - 190, 800]], [[cx + 150, ny + 100], [cx + 180, ny + 300], [cx + 190, 800]], [[cx - 90, ny + 140], [cx - 100, 800]], [[cx + 90, ny + 140], [cx + 100, 800]]], shade(D.col || '#6f8494', 0.4), 2, 0.28); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, col = D.col || '#6f8494';
      P.cut([[cx - 50, ny - 12], [cx + 50, ny - 12], [cx + 30, ny + 130], [cx - 30, ny + 130]], '#f0ebdd', { lift: 0.5, wob: 0.6 });
      stiffCollar(P, G, '#f6f1e6', { h: 0.7, w: 0.9, out: 4 });
      P.cut([[cx - 36, ny - 8], [cx + 36, ny - 8], [cx + 20, ny + 40], [cx + 24, ny + 100], [cx, ny + 116], [cx - 24, ny + 100], [cx - 20, ny + 40]], '#232126', { lift: 0.7, wob: 0.7 });
      both(cx, [[58, ny - 10], [112, ny + 20], [92, ny + 150], [30, ny + 150], [50, ny + 40]], (q) => P.cut(q, tint(col, 0.06), { lift: 0.8, wob: 0.8, smooth: false, step: 10 }));
      buttons(P, cx, ny + 150, ny + 330, 4, '#e6e0d0', 6);
      P.cut([[cx + 90, ny + 220], [cx + 190, ny + 220], [cx + 190, ny + 310], [cx + 90, ny + 310]], tint(col, 0.04), { lift: 0.6, smooth: false, step: 20 });
    },
  },
  // Dunkler Rock mit hohem Kragen und schwarzer Binde (Bunsen)
  gelehrtenrock: {
    base(P, G, D) { torso(P, G, D.col || '#3b3430', { hw: 254 }); const cx = G.cx, ny = G.Y(1.0) + 36;
      folds(P, [[[cx - 170, ny + 100], [cx - 196, ny + 300], [cx - 204, 800]], [[cx + 170, ny + 100], [cx + 196, ny + 300], [cx + 204, 800]]], tint(D.col || '#3b3430', 0.3), 2, 0.3); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, coat = D.col || '#3b3430';
      P.cut([[cx - 66, ny - 4], [cx + 66, ny - 4], [cx + 74, 820], [cx - 74, 820]], D.vest || '#7a7488', { lift: 0.6, deco: (ctx) => { ctx.strokeStyle = alpha('#2a2630', 0.3); ctx.lineWidth = 1.4; for (let x = cx - 80; x < cx + 90; x += 14) { ctx.beginPath(); ctx.moveTo(x, ny); ctx.lineTo(x, 820); ctx.stroke(); } for (let y = ny; y < 820; y += 14) { ctx.beginPath(); ctx.moveTo(cx - 80, y); ctx.lineTo(cx + 80, y); ctx.stroke(); } } });
      both(cx, [[50, ny - 8], [142, ny + 34], [108, ny + 94], [118, ny + 150], [74, ny + 290], [48, ny + 290], [52, ny + 80]], (q) => P.cut(q, tint(coat, 0.05), { lift: 1, wob: 0.9, smooth: false, step: 10 }));
      stiffCollar(P, G, '#f7f2e6', { h: 0.62, w: 1.0 });
      P.cut([[cx - 46, ny - 16], [cx + 46, ny - 16], [cx + 54, ny + 20], [cx + 20, ny + 50], [cx - 20, ny + 50], [cx - 54, ny + 20]], '#1f1c20', { lift: 0.8, wob: 0.7 });
      P.cut(ell(cx, ny + 8, 14, 16, 10), '#2a272c', { lift: 0.6 });
      buttons(P, cx - 40, ny + 160, ny + 290, 3, '#9a8a5a', 5);
    },
  },
  // Strickjacke über Bluse mit Perlenkette (Hodgkin)
  strick: {
    base(P, G, D) { torso(P, G, D.col || '#5b8a8a', { hw: 238, deco: (ctx) => { ctx.strokeStyle = alpha(shade(D.col || '#5b8a8a', 0.4), 0.2); ctx.lineWidth = 1.4; for (let x = 20; x < 600; x += 7) { ctx.beginPath(); ctx.moveTo(x, 540); ctx.lineTo(x, 830); ctx.stroke(); } } }); },
    top(P, G, D) {
      const cx = G.cx, ny = G.Y(1.0) + 36, col = D.col || '#5b8a8a', blouse = D.blouse || '#f1e4cc';
      P.cut([[cx - 60, ny - 10], [cx + 60, ny - 10], [cx + 34, ny + 160], [cx - 34, ny + 160]], blouse, { lift: 0.6, wob: 0.6, deco: (ctx) => { ctx.fillStyle = alpha('#b8604a', 0.5); for (let i = 0; i < 18; i++) { ctx.beginPath(); ctx.arc(cx - 40 + (i * 37) % 80, ny + ((i * 23) % 150), 3.4, 0, TAU); ctx.fill(); } } });
      both(cx, [[18, ny - 8], [66, ny - 26], [84, ny + 18], [30, ny + 36]], (q) => P.cut(q, tint(blouse, 0.2), { lift: 0.6, wob: 0.5, smooth: false, step: 8 }));
      both(cx, [[56, ny - 8], [130, ny + 26], [84, ny + 100], [60, ny + 340], [34, ny + 340], [34, ny + 130]], (q) => P.cut(q, tint(col, 0.06), { lift: 0.9, wob: 0.8, smooth: false, step: 10, deco: (ctx) => { ctx.strokeStyle = alpha(shade(col, 0.4), 0.2); ctx.lineWidth = 1.4; for (let x = 20; x < 600; x += 7) { ctx.beginPath(); ctx.moveTo(x, 540); ctx.lineTo(x, 830); ctx.stroke(); } } }));
      for (let i = 0; i < 4; i++) button(P, cx - 46, ny + 160 + i * 52, '#efe4cc', 6);
      // Perlenkette
      for (let i = 0; i <= 14; i++) { const a = Math.PI * (0.1 + 0.8 * i / 14); P.cut(ell(cx + Math.cos(a) * 62, ny - 4 + Math.sin(a) * 40, 4.5, 4.5, 8), '#f8f2e4', { lift: 0.3, wob: 0.1, edge: false }); }
    },
  },
};
