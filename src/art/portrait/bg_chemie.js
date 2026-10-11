// Hintergründe der Abteilung Chemie: Waage, Periodensystem, Strahlen, Labor, Spektrum, Kristallgitter
import { rect, ell, spline, bez, TAU, mix, shade, tint, alpha, ribbon, rngOf } from './paper.js';
import { C, base, halo, band, star, disc, cloud, text, stem, flask } from './bg_util.js';

// Periodensystem (18 Spalten, 7 Perioden); null = leer
const PT = [
  ['H', null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, null, 'He'],
  ['Li', 'Be', null, null, null, null, null, null, null, null, null, null, 'B', 'C', 'N', 'O', 'F', 'Ne'],
  ['Na', 'Mg', null, null, null, null, null, null, null, null, null, null, 'Al', 'Si', 'P', 'S', 'Cl', 'Ar'],
  ['K', 'Ca', 'Sc', 'Ti', 'V', 'Cr', 'Mn', 'Fe', 'Co', 'Ni', 'Cu', 'Zn', 'Ga', 'Ge', 'As', 'Se', 'Br', 'Kr'],
  ['Rb', 'Sr', 'Y', 'Zr', 'Nb', 'Mo', 'Tc', 'Ru', 'Rh', 'Pd', 'Ag', 'Cd', 'In', 'Sn', 'Sb', 'Te', 'I', 'Xe'],
  ['Cs', 'Ba', 'La', 'Hf', 'Ta', 'W', 'Re', 'Os', 'Ir', 'Pt', 'Au', 'Hg', 'Tl', 'Pb', 'Bi', 'Po', 'At', 'Rn'],
  ['Fr', 'Ra', 'Ac', 'Rf', 'Db', 'Sg', 'Bh', 'Hs', 'Mt', 'Ds', 'Rg', 'Cn', 'Nh', 'Fl', 'Mc', 'Lv', 'Ts', 'Og'],
];
const NONMETAL = new Set(['H', 'C', 'N', 'O', 'P', 'S', 'Se']), HALOGEN = new Set(['F', 'Cl', 'Br', 'I', 'At', 'Ts']), NOBLE = new Set(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']);
const META = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te']), POST = new Set(['Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi', 'Po', 'Nh', 'Fl', 'Mc', 'Lv']);
function ptColor(sym, col) {
  if (NOBLE.has(sym)) return '#a890d8'; if (HALOGEN.has(sym)) return '#ee8fb4'; if (NONMETAL.has(sym)) return '#ead566'; if (META.has(sym)) return '#58b0a0'; if (POST.has(sym)) return '#93bdb0';
  if (col === 0) return '#ea7a5e'; if (col === 1) return '#f0a65e'; return '#6f9ed4';
}

function tube(P, a, b, w, col, o = {}) {
  const dx = b[0] - a[0], dy = b[1] - a[1], m = Math.hypot(dx, dy), nx = -dy / m * w / 2, ny = dx / m * w / 2;
  return P.cut([[a[0] + nx, a[1] + ny], [b[0] + nx, b[1] + ny], [b[0] - nx, b[1] - ny], [a[0] - nx, a[1] - ny]], col, { lift: o.lift ?? 0.6, smooth: false, step: 40, wob: 0.3, grad: false });
}

export const BG_CHEMIE = {
  // Lavoisier: Balkenwaage mit Gewichten und Kolben
  waage(P, G, c) {
    const wall = C(c, 0, '#f0e2c0'), brass = C(c, 1, '#b88a4a'), glass = C(c, 2, '#9ac0cc');
    base(P, wall, '#e8d6a8');
    P.glow(G.cx, 200, 330, '#fff4d0', 0.7);
    const gold = '#d4a84a';
    // Aufhängung und Balken
    P.line([[300, 36], [300, 112]], '#7a5a2a', 4, { a: 1 });
    P.cut(ell(300, 44, 16, 16, 18), gold, { lift: 0.6, deco: (ctx) => { ctx.fillStyle = '#f0e2c0'; ctx.beginPath(); ctx.arc(300, 44, 8, 0, TAU); ctx.fill(); } });
    P.cut([[96, 156], [160, 140], [300, 128], [440, 140], [504, 156], [440, 150], [300, 144], [160, 150]], gold, { lift: 0.9, wob: 0.3, grad: 'v' });
    for (const x of [96, 504]) disc(P, x, 154, 8, '#9a6a2a', { lift: 0.5 });
    disc(P, 300, 138, 12, '#9a6a2a', { lift: 0.7 });
    P.cut([[294, 146], [306, 146], [301, 218], [299, 218]], '#6a4a22', { lift: 0.4, smooth: false, step: 40 });
    // Schalen mit Ketten
    for (const [x, load] of [[96, 'weights'], [504, 'flask']]) {
      for (const dx of [-62, 0, 62]) P.line([[x, 156], [x + dx, 292]], '#7a5a2a', 1.6, { a: 0.9, smooth: false });
      if (load === 'flask') flask(P, x, 262, 30, '#c04a3a', { neck: 0.5 });
      else for (let i = 0; i < 3; i++) { P.cut([[x - 18 + i * 3, 280 - i * 18], [x + 18 - i * 3, 280 - i * 18], [x + 16 - i * 3, 266 - i * 18], [x - 16 + i * 3, 266 - i * 18]], '#c9a24a', { lift: 0.5, smooth: false, step: 40, wob: 0.3 }); P.cut(ell(x, 262 - i * 18, 5, 3, 8), '#8a6a2a', { lift: 0.2, edge: false }); }
      P.cut([[x - 68, 292], [x + 68, 292], [x + 52, 312], [x, 320], [x - 52, 312]], gold, { lift: 0.9, wob: 0.4, deco: (ctx) => { ctx.strokeStyle = alpha('#7a5a1a', 0.45); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(x - 60, 298); ctx.lineTo(x + 60, 298); ctx.stroke(); } });
    }
    // Gläser im Regal unten rechts/links
    P.cut(rect(30, 470, 130, 12), '#8a5a30', { lift: 0.7, smooth: false, step: 40, wob: 0.4 }); P.cut(rect(440, 470, 130, 12), '#8a5a30', { lift: 0.7, smooth: false, step: 40, wob: 0.4 });
    flask(P, 80, 438, 26, glass, { neck: 0.7 }); flask(P, 130, 446, 18, '#e8b84a', { neck: 0.6 }); flask(P, 520, 438, 28, '#9a6ac0', { neck: 0.7 });
  },
  // Mendelejew: Periodensystem mit Lücken
  periodensystem(P, G, c) {
    const paper = C(c, 0, '#efe6d0'), gold = '#f2c53a';
    base(P, paper, '#e6d9b8');
    const x0 = 30, y0 = 42, cw = 30, ch = 34;
    P.cut([[x0 - 4, y0 - 6], [x0 + cw * 18 + 4, y0 - 6], [x0 + cw * 18 + 4, y0 + ch * 7 + 4], [x0 - 4, y0 + ch * 7 + 4]], '#fffaf0', { lift: 1, smooth: false, step: 40, wob: 0.6 });
    const { ctx } = P; ctx.save(); ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = 'bold 13px Georgia, serif';
    const gaps = [];
    PT.forEach((row, r) => row.forEach((sym, col) => {
      if (!sym) return; const x = x0 + col * cw, y = y0 + r * ch;
      if (r === 3 && (col === 2 || col === 12 || col === 13)) { gaps.push([x, y]); return; }
      ctx.fillStyle = ptColor(sym, col); ctx.fillRect(x + 1, y + 1, cw - 2, ch - 2); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fillRect(x + 1, y + 1, cw - 2, 3);
      ctx.fillStyle = '#2a2a30'; ctx.font = (sym.length > 1 ? 'bold 12px' : 'bold 14px') + ' Georgia, serif'; ctx.fillText(sym, x + cw / 2, y + ch / 2 + 1);
    }));
    ctx.restore();
    for (const [x, y] of gaps) { P.cut(rect(x + 1, y + 1, cw - 2, ch - 2), gold, { lift: 0.5, smooth: false, step: 40, wob: 0.3, line: false }); text(P, '?', x + cw / 2, y + ch / 2 + 1, { font: 'bold 18px Georgia, serif', col: '#8a3a1a', align: 'center' }); }
    // Lanthanoiden-Zeile angedeutet
    ctx.save(); ctx.fillStyle = '#c8b8a0'; ctx.fillRect(x0 + 3 * cw + 1, y0 + 7 * ch + 10, cw * 14 - 2, 0); ctx.restore();
  },
  // Curie: Strahlen und Radium-Leuchten
  strahlen(P, G, c) {
    const dark = C(c, 0, '#10343a'), glow = C(c, 1, '#6ae8a0'), light = C(c, 2, '#e8f8d0');
    base(P, shade(dark, 0.2), dark);
    P.glow(G.cx, G.cy - 30, 380, glow, 0.5); P.glow(G.cx, G.cy - 30, 210, light, 0.25);
    for (let i = 0; i < 18; i++) { const a = i / 18 * TAU; P.fan(G.cx, G.cy - 20, 640, a, a + 0.1, light, 0.07 + (i % 3) * 0.02); }
    const { ctx } = P; ctx.save(); ctx.strokeStyle = alpha(light, 0.14); ctx.lineWidth = 2; for (const r of [170, 250, 330, 410]) { ctx.beginPath(); ctx.arc(G.cx, G.cy - 20, r, 0, TAU); ctx.stroke(); } ctx.restore();
    const r = rngOf(12); for (let i = 0; i < 30; i++) { const a = r() * TAU, d = 180 + r() * 300; P.dot(G.cx + Math.cos(a) * d, G.cy - 20 + Math.sin(a) * d, 1.5 + r() * 2, light, 0.5 + r() * 0.4); }
    // Elementkärtchen Radium und Polonium
    const tile = (x, y, z, sym, name) => {
      P.cut([[x, y], [x + 92, y], [x + 92, y + 108], [x, y + 108]], '#f4f0dc', { lift: 1, smooth: false, step: 40, wob: 0.6 });
      P.cut([[x + 6, y + 6], [x + 86, y + 6], [x + 86, y + 102], [x + 6, y + 102]], '#2a5a58', { lift: 0, smooth: false, step: 40, wob: 0.4, edge: false });
      text(P, String(z), x + 18, y + 20, { font: 'bold 15px Georgia, serif', col: '#e8f0d0', align: 'left' }); text(P, sym, x + 46, y + 56, { font: 'bold 40px Georgia, serif', col: '#f6fbe0' }); text(P, name, x + 46, y + 88, { font: '14px Georgia, serif', col: '#d8e8c8' });
    };
    tile(44, 48, 88, 'Ra', 'Radium'); tile(464, 48, 84, 'Po', 'Polonium');
  },
  // Liebig: Labor mit Kühler und Kolben
  labor(P, G, c) {
    const wall = C(c, 0, '#e2eadc'), glass = C(c, 1, '#9ac0cc'), orange = C(c, 2, '#e8883a');
    base(P, wall, '#d4dec8');
    P.cut(rect(-10, 456, 640, 400), '#a07a50', { lift: 0.4, smooth: false, step: 300, wob: 0, deco: (ctx) => { ctx.strokeStyle = alpha('#5a3a1a', 0.25); ctx.lineWidth = 2; for (let y = 480; y < 800; y += 28) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); } } });
    // Regal oben links mit Flaschen
    P.cut(rect(24, 232, 176, 12), '#8a5a30', { lift: 0.8, smooth: false, step: 40, wob: 0.4 });
    for (const [x, h, col] of [[54, 62, '#b8d8a8'], [92, 80, '#e8b84a'], [132, 54, '#9ac0e0'], [166, 70, '#d8a0b8']]) { P.cut([[x - 16, 232], [x - 16, 232 - h * 0.65], [x - 7, 232 - h * 0.78], [x - 7, 232 - h], [x + 7, 232 - h], [x + 7, 232 - h * 0.78], [x + 16, 232 - h * 0.65], [x + 16, 232]], col, { lift: 0.6, smooth: false, step: 30, wob: 0.3 }); P.cut(rect(x - 8, 232 - h - 8, 16, 9), '#b8864a', { lift: 0.4, smooth: false, step: 30 }); }
    flask(P, 76, 410, 44, orange, { neck: 0.9 }); flask(P, 154, 424, 30, '#5a9ad0', { neck: 0.8 });
    P.cut(rect(24, 456, 176, 10), '#8a5a30', { lift: 0.6, smooth: false, step: 40, wob: 0.4 });
    // Stativ mit Liebig-Kühler (schräg)
    P.cut(rect(488, 160, 10, 330), '#6a6a72', { lift: 0.5, smooth: false, step: 40, wob: 0.3, grad: 'h' }); P.cut(rect(456, 486, 76, 12), '#5a5a62', { lift: 0.6, smooth: false, step: 40, wob: 0.3 });
    const a = [372, 196], b = [572, 296];
    tube(P, [a[0] - 14, a[1] - 7], [b[0] + 8, b[1] + 4], 34, mix(glass, '#fff', 0.35), { lift: 0.9 });
    tube(P, [a[0] - 24, a[1] - 12], [b[0] + 16, b[1] + 8], 11, '#f6fcfc', { lift: 0.3 });
    P.cut(ell(a[0] - 14, a[1] - 7, 17, 11, 14, 0.46), orange, { lift: 0.5 }); P.cut(ell(b[0] + 8, b[1] + 4, 14, 10, 14, 0.46), orange, { lift: 0.5 });
    tube(P, [a[0] + 60, a[1] + 16], [a[0] + 52, a[1] + 56], 8, glass, { lift: 0.4 }); tube(P, [b[0] - 50, b[1] - 30], [b[0] - 38, b[1] - 76], 8, glass, { lift: 0.4 });
    P.line([[a[0] + 6, a[1] - 9], [b[0] + 4, b[1] - 12]], '#ffffff', 3, { a: 0.7 });
    P.cut(rect(478, 232, 30, 14), '#7a7a82', { lift: 0.6, smooth: false, step: 40, wob: 0.3 });
    // Wasserschlauch
    P.line([[a[0] + 52, a[1] + 56], [a[0] + 70, a[1] + 120], [a[0] + 20, a[1] + 170], [30 + 450, 330]], '#e8883a', 5, { a: 0.9, shadow: true });
  },
  // Bunsen: Spektrum und Linienspektrum
  flamme(P, G, c) {
    const slate = C(c, 0, '#2c3a4a');
    base(P, shade(slate, 0.35), slate);
    P.glow(G.cx, G.cy, 330, '#e8883a', 0.16);
    // kontinuierliches Spektrum mit Fraunhofer-Linien
    P.cut([[42, 40], [558, 40], [558, 92], [42, 92]], '#222', { lift: 0.9, smooth: false, step: 60, wob: 0.6, grad: false, deco: (ctx) => {
      const g = ctx.createLinearGradient(42, 0, 558, 0); [[0, '#7a1aa8'], [0.15, '#4a3ad8'], [0.3, '#2a9ae0'], [0.45, '#3ac860'], [0.6, '#e8e03a'], [0.78, '#f0902a'], [1, '#d82a1a']].forEach(([t, col]) => g.addColorStop(t, col)); ctx.fillStyle = g; ctx.fillRect(42, 40, 516, 52);
      ctx.fillStyle = 'rgba(20,10,10,0.8)'; for (const x of [120, 168, 226, 262, 300, 352, 396, 452, 486]) ctx.fillRect(x, 40, 1.8 + (x % 3), 52);
    } });
    // Emissionsspektrum (helle Linien auf Schwarz)
    P.cut([[42, 104], [558, 104], [558, 140], [42, 140]], '#121418', { lift: 0.7, smooth: false, step: 60, wob: 0.6, grad: false, deco: (ctx) => {
      for (const [x, col, w] of [[96, '#7a4ae8', 3], [172, '#3a8ae8', 3], [214, '#3ae0c8', 2], [254, '#9ae83a', 3], [330, '#f0e83a', 5], [338, '#f0e83a', 3], [402, '#f0902a', 3], [470, '#e83a2a', 4], [510, '#e83a2a', 2]]) { ctx.fillStyle = col; ctx.fillRect(x, 104, w, 36); ctx.fillStyle = alpha(col, 0.25); ctx.fillRect(x - 5, 104, w + 10, 36); }
    } });
  },
  // Hodgkin: Kristallgitter (Kugel-Stab-Modell) und Röntgenstrahl
  kristall(P, G, c) {
    const lav = C(c, 0, '#e2e0f0'), violet = C(c, 1, '#7a6ab8'), gold = C(c, 2, '#e8a83a');
    base(P, lav, '#d6d2ea');
    const ox = 40, oy = 70, dx = 86, dy = 78, kx = 34, ky = -26, layers = 2;
    const node = (i, j, k) => [ox + i * dx + k * kx + (j % 2) * 0, oy + j * dy + k * ky + 40 * k];
    const hidden = (p) => Math.abs(p[0] - G.cx) < 130 && p[1] > 250 && p[1] < 560;
    const { ctx } = P;
    for (let k = layers - 1; k >= 0; k--) {
      for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) {
        const p = node(i, j, k); if (hidden(p) || p[1] > 640) continue;
        const right = node(i + 1, j, k), down = node(i, j + 1, k), depth = node(i, j, k + 1);
        P.line([p, right], alpha('#fffaf0', k ? 0.55 : 0.9), 4.5 - k * 1.5, { smooth: false, shadow: !k });
        P.line([p, down], alpha('#fffaf0', k ? 0.55 : 0.9), 4.5 - k * 1.5, { smooth: false, shadow: !k });
        if (k === 0 && i % 2 === 0 && j % 2 === 0) P.line([p, depth], alpha('#fffaf0', 0.5), 3, { smooth: false });
      }
      for (let j = 0; j < 6; j++) for (let i = 0; i < 7; i++) {
        const p = node(i, j, k); if (hidden(p) || p[1] > 640 || p[0] > 600) continue; const col = (i + j + k) % 2 ? violet : gold, r = 13 - k * 2.5;
        P.cut(ell(p[0], p[1], r, r, 16), k ? mix(col, '#e2e0f0', 0.35) : col, { lift: k ? 0.4 : 0.7, wob: 0.2, edge: false, deco: () => {} });
        P.glow(p[0] - r * 0.3, p[1] - r * 0.3, r * 0.55, '#ffffff', k ? 0.35 : 0.65);
      }
    }
  },
};
