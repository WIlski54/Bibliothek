// Vordergrund-Requisiten: liegen vor der Kleidung am unteren Bildrand (look.props = ['name', ...])
import { rect, ell, mix, shade, tint, alpha, ribbon, TAU } from './paper.js';
import { glyph } from './bg_geschichte.js';

function rot(cx, cy, ang) { const c = Math.cos(ang), s = Math.sin(ang); return (u, v) => [cx + u * c - v * s, cy + u * s + v * c]; }

export const PROPS = {
  // Geologenhammer (Anning)
  hammer(P) {
    const T = rot(452, 716, -0.62), wood = '#9a6a3a';
    P.cut([T(-80, -7), T(80, -6), T(80, 6), T(-80, 6)], wood, { lift: 1.1, smooth: false, wob: 0.5, step: 20, deco: (ctx) => { ctx.strokeStyle = alpha('#5a3a1a', 0.35); ctx.lineWidth = 1.2; for (let i = 0; i < 6; i++) { const a = T(-70 + i * 26, -3), b = T(-56 + i * 26, 3); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } } });
    P.cut([T(70, -22), T(104, -22), T(104, 22), T(70, 22)], '#8a929a', { lift: 1.0, smooth: false, wob: 0.4, step: 20, grad: 'v' });
    P.cut([T(104, -20), T(130, -6), T(130, 6), T(104, 20)], '#7a828a', { lift: 0.8, smooth: false, wob: 0.4, step: 14 });
    P.cut([T(70, -22), T(46, -3), T(46, 3), T(70, 22)], '#9aa2aa', { lift: 0.8, smooth: false, wob: 0.4, step: 14 });
  },
  // Mikroskop (Franklin)
  mikroskop(P) {
    const brass = '#c9a24a', dark = '#2a2a30';
    P.cut([[40, 782], [170, 782], [176, 800], [34, 800]], dark, { lift: 1, smooth: false, wob: 0.5, step: 20 });
    P.cut([[100, 782], [118, 782], [118, 706], [100, 706]], dark, { lift: 0.8, smooth: false, wob: 0.4, step: 20 });
    P.cut(ribbon([[112, 716, 18], [150, 700, 18], [168, 664, 18], [160, 628, 18]], { step: 6 }), dark, { lift: 0.9, wob: 0.4, grad: 'h' });
    const T = rot(138, 640, -0.3);
    P.cut([T(-14, -64), T(14, -64), T(15, 24), T(-15, 24)], '#3a3a42', { lift: 0.9, smooth: false, wob: 0.4, step: 20 });
    P.cut([T(-12, -88), T(12, -88), T(12, -64), T(-12, -64)], brass, { lift: 0.7, smooth: false, wob: 0.3, step: 20 });
    P.cut([T(-17, 18), T(17, 18), T(14, 40), T(-14, 40)], brass, { lift: 0.8, smooth: false, wob: 0.3, step: 20 });
    P.cut([[80, 742], [152, 742], [152, 752], [80, 752]], '#5a5a62', { lift: 0.9, smooth: false, wob: 0.3, step: 20 });
    P.cut(ell(116, 740, 7, 3, 10), '#e8f0f4', { lift: 0.2, edge: false });
  },
  // Bunsenbrenner mit Flamme (Bunsen)
  brenner(P) {
    const x = 96;
    P.glow(x, 590, 120, '#ffb860', 0.45);
    P.cut([[x - 36, 800], [x - 32, 772], [x + 32, 772], [x + 36, 800]], '#4a4a52', { lift: 1.1, smooth: false, wob: 0.4, step: 16 });
    P.cut([[x - 11, 772], [x + 11, 772], [x + 10, 636], [x - 10, 636]], '#9aa0a8', { lift: 1, smooth: false, wob: 0.4, step: 16, grad: 'h' });
    P.cut([[x - 14, 690], [x + 14, 690], [x + 14, 716], [x - 14, 716]], '#c9a24a', { lift: 0.8, smooth: false, wob: 0.3, step: 16 });
    P.cut(ell(x, 703, 13, 3, 8), '#2a2a30', { lift: 0, edge: false });
    // Flamme: außen hell-orange, innen blau
    P.cut([[x - 12, 636], [x - 20, 600], [x - 14, 556], [x, 520], [x + 14, 556], [x + 20, 600], [x + 12, 636]], '#f2b64a', { lift: 0.5, wob: 0.5, grad: false });
    P.cut([[x - 8, 636], [x - 12, 606], [x - 6, 574], [x, 560], [x + 6, 574], [x + 12, 606], [x + 8, 636]], '#8ac8f0', { lift: 0.2, wob: 0.4, grad: false });
    P.cut([[x - 5, 636], [x - 7, 616], [x, 596], [x + 7, 616], [x + 5, 636]], '#3a7ad0', { lift: 0, wob: 0.3, grad: false, edge: false });
  },
  // Röhrchen mit leuchtendem Radium (Curie)
  roehrchen(P) {
    const x = 520;
    P.glow(x, 680, 110, '#8affc0', 0.5);
    P.cut([[x - 22, 620], [x + 22, 620], [x + 22, 770], [x, 790], [x - 22, 770]], '#dff3ee', { lift: 1, wob: 0.4, grad: false });
    P.cut([[x - 16, 660], [x + 16, 660], [x + 16, 764], [x, 780], [x - 16, 764]], '#8affc0', { lift: 0, wob: 0.3, edge: false, grad: false, deco: (ctx) => { const g = ctx.createLinearGradient(x - 16, 0, x + 16, 0); g.addColorStop(0, 'rgba(255,255,255,0.1)'); g.addColorStop(0.5, 'rgba(255,255,255,0.55)'); g.addColorStop(1, 'rgba(0,80,60,0.15)'); ctx.fillStyle = g; ctx.fillRect(x - 16, 650, 32, 140); } });
    P.cut([[x - 25, 610], [x + 25, 610], [x + 22, 626], [x - 22, 626]], '#b8864a', { lift: 0.8, smooth: false, wob: 0.3, step: 20 });
    P.line([[x - 14, 640], [x - 14, 740]], '#ffffff', 3, { a: 0.7 });
  },
  // Papyrusrolle (Herodot)
  rolle(P) {
    const T = rot(430, 724, -0.12);
    P.cut([T(-110, -34), T(110, -30), T(110, 30), T(-110, 34)], '#f1e6c6', { lift: 1.2, smooth: false, wob: 0.6, step: 20, deco: (ctx) => { ctx.strokeStyle = alpha('#3a2a1c', 0.55); ctx.lineWidth = 2; for (let i = 0; i < 4; i++) { const a = T(-84, -20 + i * 13), b = T(84 - (i % 2) * 24, -20 + i * 13); ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } } });
    for (const sg of [-1, 1]) { P.cut([T(sg * 112, -38), T(sg * 124, -38), T(sg * 124, 38), T(sg * 112, 38)], '#9a6a3a', { lift: 0.9, smooth: false, wob: 0.4, step: 20 }); P.cut(ell(...T(sg * 126, 0), 7, 40, 12, -0.12), '#b8864a', { lift: 0.9, wob: 0.3 }); }
  },
  // Blatt mit Kartusche und Federkiel (Champollion)
  feder(P) {
    const T = rot(96, 716, 0.1);
    P.cut([T(-62, -76), T(62, -76), T(62, 76), T(-62, 76)], '#f6eed6', { lift: 1.2, smooth: false, wob: 0.6, step: 20 });
    P.cut(ell(...T(0, -34), 40, 20, 18, 0.1), '#f6eed6', { lift: 0, edge: false, grad: false, deco: (ctx) => { ctx.strokeStyle = alpha('#7a4a1a', 0.75); ctx.lineWidth = 2.4; ctx.beginPath(); ctx.ellipse(...T(0, -34), 38, 18, 0.1, 0, TAU); ctx.stroke(); } });
    [['sonne', -22], ['vogel', 0], ['wasser', 22]].forEach(([k, u]) => { const p = T(u, -34); glyph(P, k, p[0], p[1], 0.5, '#7a4a1a'); });
    for (let i = 0; i < 4; i++) { const a = T(-44, 4 + i * 16), b = T(44 - (i % 2) * 22, 4 + i * 16); P.line([a, b], '#7a4a1a', 2, { a: 0.55, smooth: false }); }
    // Federkiel
    const Q = rot(176, 700, -0.9);
    P.cut([Q(-6, -3), Q(60, -22), Q(110, -10), Q(60, 2), Q(-6, 3)].map((p) => p), '#f8f2e0', { lift: 1.1, wob: 0.4, deco: (ctx) => { ctx.strokeStyle = alpha('#7a6a4a', 0.6); ctx.lineWidth = 1.4; ctx.beginPath(); const a = Q(0, 0), b = Q(108, -9); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.stroke(); } });
    P.cut([Q(-30, -2.5), Q(0, -3), Q(0, 3), Q(-30, 2.5)], '#d8d0b8', { lift: 0.5, smooth: false, wob: 0.2, step: 14 });
  },
};

export function drawProps(P, G, L) { for (const n of L.props || []) if (PROPS[n]) PROPS[n](P, G, L); }
