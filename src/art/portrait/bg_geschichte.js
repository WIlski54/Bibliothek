// Hintergründe der Abteilung Geschichte: Wüste/Pyramiden, Hieroglyphenwand, Setzkasten, Meer, Nil
import { rect, ell, spline, bez, TAU, mix, shade, tint, alpha, ribbon, rngOf } from './paper.js';
import { C, base, halo, band, star, leaf, disc, cloud, peak, text, stem } from './bg_util.js';

// Hieroglyphen-ähnliche Zeichen, eingemeißelt: heller Rand unten rechts, dunkle Linie
function glyph(P, kind, x, y, s, col) {
  const { ctx } = P;
  const draw = (dx, dy, c, w) => {
    ctx.save(); ctx.translate(x + dx, y + dy); ctx.scale(s, s); ctx.strokeStyle = c; ctx.fillStyle = c; ctx.lineWidth = w / s; ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.beginPath();
    switch (kind) {
      case 'auge': ctx.moveTo(-14, 0); ctx.quadraticCurveTo(0, -14, 14, 0); ctx.quadraticCurveTo(0, 12, -14, 0); ctx.moveTo(4, 0); ctx.arc(0, 0, 4, 0, TAU); ctx.moveTo(-2, 8); ctx.lineTo(-8, 17); ctx.stroke(); ctx.beginPath(); ctx.arc(0, 0, 3, 0, TAU); ctx.fill(); break;
      case 'anch': ctx.ellipse(0, -9, 6, 8, 0, 0, TAU); ctx.moveTo(0, -1); ctx.lineTo(0, 18); ctx.moveTo(-9, 5); ctx.lineTo(9, 5); ctx.stroke(); break;
      case 'wasser': for (let i = 0; i < 3; i++) { const yy = -8 + i * 8; ctx.moveTo(-14, yy); ctx.lineTo(-7, yy - 4); ctx.lineTo(0, yy); ctx.lineTo(7, yy - 4); ctx.lineTo(14, yy); } ctx.stroke(); break;
      case 'schilf': ctx.moveTo(0, 16); ctx.quadraticCurveTo(-9, -4, 0, -17); ctx.quadraticCurveTo(9, -4, 0, 16); ctx.moveTo(0, 16); ctx.lineTo(0, 20); ctx.stroke(); break;
      case 'sonne': ctx.arc(0, 0, 13, 0, TAU); ctx.moveTo(2.5, 0); ctx.arc(0, 0, 2.5, 0, TAU); ctx.stroke(); break;
      case 'vogel': ctx.ellipse(0, 2, 12, 7, -0.2, 0, TAU); ctx.moveTo(10, -3); ctx.arc(11, -8, 4.5, 0, TAU); ctx.moveTo(15, -8); ctx.lineTo(20, -6); ctx.moveTo(-10, 5); ctx.lineTo(-18, 12); ctx.moveTo(-2, 8); ctx.lineTo(-3, 17); ctx.moveTo(4, 8); ctx.lineTo(5, 17); ctx.stroke(); break;
      case 'schlange': ctx.moveTo(-14, 8); ctx.bezierCurveTo(-8, -10, -2, 14, 4, 0); ctx.bezierCurveTo(8, -8, 12, -4, 12, -10); ctx.stroke(); ctx.beginPath(); ctx.arc(12, -11, 3, 0, TAU); ctx.fill(); break;
      case 'skarabaeus': ctx.ellipse(0, 2, 9, 12, 0, 0, TAU); ctx.moveTo(0, -10); ctx.lineTo(0, 14); ctx.moveTo(-9, -2); ctx.lineTo(-17, -6); ctx.moveTo(9, -2); ctx.lineTo(17, -6); ctx.moveTo(-8, 8); ctx.lineTo(-15, 14); ctx.moveTo(8, 8); ctx.lineTo(15, 14); ctx.stroke(); break;
      case 'korb': ctx.moveTo(-14, -2); ctx.quadraticCurveTo(0, 20, 14, -2); ctx.closePath(); ctx.moveTo(-14, -2); ctx.lineTo(14, -2); ctx.stroke(); break;
      case 'haus': ctx.rect(-12, -9, 24, 18); ctx.moveTo(-5, 9); ctx.lineTo(-5, 0); ctx.lineTo(5, 0); ctx.lineTo(5, 9); ctx.stroke(); break;
      case 'arm': ctx.moveTo(-14, 4); ctx.lineTo(4, 4); ctx.lineTo(12, -8); ctx.moveTo(4, 4); ctx.lineTo(14, 6); ctx.stroke(); break;
      default: ctx.arc(0, 0, 8, 0, TAU); ctx.stroke();
    }
    ctx.restore();
  };
  draw(1.3, 1.5, alpha(tint(col, 0.55), 0.8), 3.4 * s / 1); draw(0, 0, alpha(shade(col, 0.15), 0.85), 2.6);
}
const GLYPHS = ['auge', 'anch', 'wasser', 'schilf', 'sonne', 'vogel', 'schlange', 'skarabaeus', 'korb', 'haus', 'arm'];

export const BG_GESCHICHTE = {
  // Carter: Wüste, Pyramiden, Nil mit Segelboot
  wueste(P, G, c) {
    const sand = C(c, 0, '#f0c98a'), sand2 = C(c, 1, '#d89a4a'), sand3 = C(c, 2, '#b8703a');
    base(P, '#f6dcae', '#f0c488');
    disc(P, 458, 140, 74, '#fbeccb', { lift: 0.2 }); disc(P, 458, 140, 54, '#f6c95a', { lift: 0.3 });
    for (let i = 0; i < 4; i++) cloud(P, [90, 200, 120, 520][i], [120, 80, 205, 230][i], 0.6 + (i % 2) * 0.2, '#fdf1da');
    // ferne Pyramiden
    peak(P, 255, 420, 480, 335, 365, mix(sand, '#fff', 0.2), mix(sand2, sand, 0.3), { xm: 360 });
    // große Pyramiden links und rechts
    peak(P, 20, 250, 540, 120, 330, '#e8b878', '#b9803f', { xm: 155 });
    peak(P, 360, 640, 540, 490, 290, '#eebf80', '#bd8442', { xm: 520 });
    for (let i = 0; i < 6; i++) { const f = i / 6; P.line([[40 + f * 60, 540 - f * 190], [225 - f * 60, 540 - f * 190]], '#a8702f', 1.3, { a: 0.18 }); }
    // Dünen
    band(P, 520, 300, sand, { amp: 12, wl: 320, ph: 0.2 }); band(P, 560, 300, sand2, { amp: 10, wl: 260, ph: 0.6 });
    // Nil mit Segelboot (links unten, Rest verdeckt der Rumpf)
    band(P, 470, 14, '#6fa6b4', { amp: 3, wl: 90, x0: -20, x1: 260, lift: 0.3 });
    P.cut([[40, 452], [120, 452], [108, 468], [52, 468]], '#6a3f22', { lift: 0.4, smooth: false, step: 20, wob: 0.4 });
    P.cut([[84, 450], [84, 396], [128, 446]], '#fbf3e0', { lift: 0.4, smooth: false, step: 20, wob: 0.4 });
    P.line([[84, 452], [84, 392]], '#6a3f22', 2.4, {});
    // Palme rechts
    P.line([[545, 520], [538, 460], [548, 400]], '#6a4a2a', 7, { a: 1, shadow: true });
    for (let i = 0; i < 6; i++) { const a = -2.9 + i * 0.55; leaf(P, 548, 398, 70, a, i % 2 ? '#4f8a4f' : '#3f7a44', 0.22, { lift: 0.5 }); }
  },
  // Champollion: Sandsteinwand mit Hieroglyphen
  hieroglyphen(P, G, c) {
    const sand = C(c, 0, '#e2c48e'), dark = C(c, 1, '#8a5a2a');
    base(P, sand, mix(sand, '#b88a50', 0.35));
    // Quader-Fugen
    const { ctx } = P; ctx.save(); ctx.strokeStyle = alpha(shade(sand, 0.4), 0.28); ctx.lineWidth = 2;
    for (let y = 70; y < 800; y += 96) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(600, y); ctx.stroke(); }
    for (let r = 0; r < 9; r++) for (let x = (r % 2) * 120 - 60; x < 640; x += 240) { ctx.beginPath(); ctx.moveTo(x, 70 + r * 96 - 96); ctx.lineTo(x, 70 + r * 96); ctx.stroke(); }
    ctx.restore();
    // Glyphenfelder links und rechts, oben ein Band
    const r = rngOf(31); let k = 0;
    for (const x0 of [74, 128]) for (let y = 70; y < 560; y += 56) { glyph(P, GLYPHS[(k++ * 5 + 3) % GLYPHS.length], x0 + (r() - 0.5) * 6, y + (r() - 0.5) * 6, 1.0, dark); }
    for (const x0 of [472, 526]) for (let y = 70; y < 560; y += 56) { glyph(P, GLYPHS[(k++ * 7 + 1) % GLYPHS.length], x0 + (r() - 0.5) * 6, y + (r() - 0.5) * 6, 1.0, dark); }
    for (let x = 198; x < 410; x += 52) glyph(P, GLYPHS[(k++ * 3) % GLYPHS.length], x, 62, 0.95, dark);
    // Kartusche (Namensring) über dem Kopf
    P.cut([[222, 88], [378, 88], [394, 112], [378, 152], [222, 152], [206, 112]], tint(sand, 0.35), { lift: 0.7, wob: 0.6, deco: (ctx2) => { ctx2.strokeStyle = alpha(dark, 0.7); ctx2.lineWidth = 3; ctx2.beginPath(); ctx2.moveTo(222, 88); ctx2.lineTo(378, 88); ctx2.quadraticCurveTo(396, 120, 378, 152); ctx2.lineTo(222, 152); ctx2.quadraticCurveTo(204, 120, 222, 88); ctx2.stroke(); ctx2.beginPath(); ctx2.moveTo(404, 92); ctx2.lineTo(404, 148); ctx2.stroke(); } });
    for (let i = 0; i < 4; i++) glyph(P, ['sonne', 'schilf', 'vogel', 'wasser'][i], 248 + i * 34, 120, 0.82, dark);
  },
  // Gutenberg: Setzkasten mit Bleilettern (spiegelverkehrt) und Druckseite
  lettern(P, G, c) {
    const wood = C(c, 1, '#6a4a2a'), lead = C(c, 2, '#9aa0a8'), paper = C(c, 0, '#efe2c0');
    base(P, shade(wood, 0.25));
    const { ctx } = P; const r = rngOf(55);
    const letters = 'ABDEGHKMNRSTUW';
    // Kasten: Rahmen + Fächer
    const cols = 6, rows = 4, x0 = 34, y0 = 34, cw = 90, ch = 100;
    for (let j = 0; j < rows; j++) for (let i = 0; i < cols; i++) {
      const x = x0 + i * cw + 3, y = y0 + j * ch + 3;
      if (j > 2 && (i > 1 && i < 4)) continue;
      P.cut([[x, y], [x + cw - 6, y], [x + cw - 6, y + ch - 6], [x, y + ch - 6]], shade(wood, 0.45), { lift: -0, smooth: false, step: 60, wob: 0.5, grad: false, edge: false, line: false, deco: (ctx2) => {
        const g = ctx2.createLinearGradient(x, y, x + 20, y + 24); g.addColorStop(0, 'rgba(0,0,0,0.45)'); g.addColorStop(1, 'rgba(0,0,0,0)'); ctx2.fillStyle = g; ctx2.fillRect(x, y, cw, ch);
        // Bleilettern, von oben gesehen
        const n = 3 + Math.floor(r() * 3), m = 3;
        for (let q = 0; q < n * m; q++) {
          const lx = x + 6 + (q % n) * ((cw - 18) / n), ly = y + 10 + Math.floor(q / n) * ((ch - 22) / m), lw = (cw - 18) / n - 4, lh = (ch - 22) / m - 5;
          if (r() < 0.12) continue; ctx2.fillStyle = shade(lead, 0.05 + r() * 0.15); ctx2.fillRect(lx, ly, lw, lh); ctx2.fillStyle = 'rgba(255,255,255,0.25)'; ctx2.fillRect(lx, ly, lw, 2);
          ctx2.save(); ctx2.translate(lx + lw / 2, ly + lh / 2 + 1); ctx2.scale(-1, 1); ctx2.fillStyle = '#23201e'; ctx2.font = `bold ${Math.min(lh, lw) * 0.95}px Georgia, serif`; ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.fillText(letters[Math.floor(r() * letters.length)], 0, 0); ctx2.restore();
        }
      } });
    }
    // Druckseite mit zwei Spalten und roter Initiale (rechts unten sichtbar neben den Schultern)
    P.cut([[30, 366], [150, 360], [158, 560], [28, 566]], paper, { lift: 1, smooth: false, step: 40, wob: 0.8 });
    for (const x of [44, 94]) for (let y = 384; y < 540; y += 11) P.line([[x, y], [x + 42 - (r() * 8), y]], '#3a2a1c', 2, { a: 0.7, smooth: false });
    text(P, 'A', 56, 398, { font: 'bold 34px Georgia, serif', col: '#a02a2a' });
    P.cut([[450, 340], [572, 346], [570, 548], [446, 542]], paper, { lift: 1, smooth: false, step: 40, wob: 0.8 });
    for (const x of [462, 514]) for (let y = 366; y < 530; y += 11) P.line([[x, y], [x + 44 - (r() * 8), y]], '#3a2a1c', 2, { a: 0.7, smooth: false });
  },
  // Herodot: Meer, Segelschiff, Sonne, Mäanderband
  meer(P, G, c) {
    const sky = C(c, 0, '#cfe4e8'), sea = C(c, 1, '#3f7f9a'), sun = C(c, 2, '#e8c25a');
    base(P, sky, '#f4ead2');
    disc(P, 478, 150, 90, '#fdf4d8', { lift: 0.2 }); disc(P, 478, 150, 60, sun, { lift: 0.3 });
    for (let i = 0; i < 12; i++) { const a = i / 12 * TAU; P.fan(478, 150, 130, a, a + 0.12, '#f6dd8a', 0.25); }
    cloud(P, 110, 150, 0.8, '#ffffff'); cloud(P, 330, 90, 0.55, '#ffffff');
    // Schiff
    const sx = 120, sy = 410;
    P.cut([[sx - 78, sy - 26], [sx - 60, sy], [sx + 60, sy], [sx + 86, sy - 22], [sx + 70, sy + 24], [sx - 54, sy + 24]], '#8a3a2a', { lift: 0.8, wob: 0.6, deco: (ctx) => { ctx.fillStyle = '#e8c25a'; ctx.fillRect(sx - 90, sy + 2, 190, 5); } });
    P.line([[sx, sy], [sx, sy - 130]], '#5a3a22', 4, { a: 1 });
    P.cut([[sx - 60, sy - 124], [sx + 60, sy - 124], [sx + 56, sy - 28], [sx - 56, sy - 28]], '#fbf3dc', { lift: 0.8, smooth: false, step: 24, wob: 0.6, deco: (ctx) => { ctx.fillStyle = '#b8423a'; ctx.fillRect(sx - 60, sy - 100, 120, 14); ctx.fillRect(sx - 60, sy - 58, 120, 14); } });
    for (let i = 0; i < 5; i++) P.line([[sx - 40 + i * 20, sy + 12], [sx - 52 + i * 20, sy + 46]], '#5a3a22', 2.4, { a: 0.9 });
    // Wellen
    band(P, 430, 60, mix(sea, '#fff', 0.3), { amp: 6, wl: 90, scallop: true, ph: 0.1 });
    band(P, 480, 80, mix(sea, '#fff', 0.1), { amp: 8, wl: 70, scallop: true, ph: 0.4 });
    band(P, 530, 120, sea, { amp: 9, wl: 60, scallop: true, ph: 0.7 });
    // Mäanderband oben
    P.cut(rect(30, 34, 540, 38), '#f4e8c8', { lift: 0.5, smooth: false, step: 60, wob: 0.6, deco: (ctx) => { ctx.strokeStyle = '#7a3a22'; ctx.lineWidth = 3; ctx.lineJoin = 'miter'; for (let x = 40; x < 580; x += 34) { ctx.beginPath(); ctx.moveTo(x, 68); ctx.lineTo(x, 42); ctx.lineTo(x + 24, 42); ctx.lineTo(x + 24, 62); ctx.lineTo(x + 10, 62); ctx.lineTo(x + 10, 52); ctx.stroke(); } } });
  },
  // Kleopatra: Nilnacht, Sonnenscheibe mit Hörnern, Leuchtturm von Pharos, Papyrus
  nil(P, G, c) {
    const night = C(c, 0, '#1f3f78'), gold = C(c, 1, '#e2b64a'), green = C(c, 2, '#4a9a6a');
    base(P, night, shade(night, 0.35));
    const r = rngOf(9);
    for (let i = 0; i < 26; i++) { const x = 40 + r() * 520, y = 40 + r() * 300; if (Math.abs(x - 300) < 90 && y < 190) continue; star(P, x, y, 3 + r() * 5, '#f2d878', 4, { lift: 0.2 }); }
    // Sonnenscheibe mit Kuhhörnern
    for (const sg of [-1, 1]) P.cut(ribbon([[300 + sg * 40, 150, 20], [300 + sg * 78, 150, 20], [300 + sg * 104, 124, 15], [300 + sg * 100, 92, 8], [300 + sg * 88, 78, 3]], { step: 5 }), '#f4e8c8', { lift: 0.6, wob: 0.4, smooth: false, step: 5 });
    disc(P, 300, 130, 48, gold, { lift: 0.7 }); disc(P, 300, 130, 34, '#f6d56a', { lift: 0.2, grad: false });
    // Pharos von Alexandria
    const px = 100;
    P.cut([[px - 46, 600], [px - 40, 470], [px + 40, 470], [px + 46, 600]], '#e8dcc0', { lift: 0.8, smooth: false, step: 30, wob: 0.6 });
    P.cut([[px - 32, 470], [px - 28, 356], [px + 28, 356], [px + 32, 470]], '#d9ccaa', { lift: 0.8, smooth: false, step: 30, wob: 0.6 });
    P.cut([[px - 20, 356], [px - 17, 262], [px + 17, 262], [px + 20, 356]], '#e8dcc0', { lift: 0.8, smooth: false, step: 30, wob: 0.6 });
    P.cut([[px - 24, 262], [px + 24, 262], [px + 18, 240], [px - 18, 240]], '#7a5a3a', { lift: 0.6, smooth: false, step: 30, wob: 0.4 });
    P.glow(px, 224, 56, '#ffe9a0', 0.85); disc(P, px, 224, 13, '#fff4c0', { lift: 0.1 });
    P.fan(px, 224, 130, 0.0 - 0.07, 0.0 + 0.07, '#ffe9a0', 0.18);
    for (let y = 300; y < 560; y += 70) P.cut(rect(px - 7, y, 14, 18), '#3a3a50', { lift: 0, edge: false, line: false, smooth: false, step: 30 });
    // Papyrus rechts
    for (let i = 0; i < 7; i++) {
      const bx = 470 + i * 16 + (i % 2) * 6, top = 330 + (i * 37) % 70, lean = (i - 3) * 6;
      stem(P, [[bx, 620], [bx + lean * 0.3, 500], [bx + lean, top]], 5, mix(green, '#fff', i % 3 * 0.12), { lift: 0.3 });
      for (let k = 0; k < 11; k++) { const a = -Math.PI / 2 + (k - 5) * 0.28; P.line([[bx + lean, top], [bx + lean + Math.cos(a) * 34, top + Math.sin(a) * 34 + 6]], mix(green, '#2a5a3a', 0.2), 1.6, { a: 0.95 }); }
    }
    // Nil-Wellen
    band(P, 560, 30, '#2f6aa8', { amp: 5, wl: 70, scallop: true, ph: 0.3, lift: 0.4 }); band(P, 600, 60, '#3a7ac0', { amp: 6, wl: 60, scallop: true, ph: 0.8, lift: 0.4 });
  },
};
