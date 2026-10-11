// Haare, Bärte, Schnurrbärte, Perücken und Kopfbedeckungen als Papierschnitt-Lagen.
// Alle Formen in Kopf-Koordinaten (u, v), siehe face.js. Ein Stil liefert Funktionen für drei Ebenen:
//   back  (hinter Kleidung und Hals), mid (über den Schultern, hinter dem Gesicht), front (vor dem Gesicht)
import { mix, shade, tint, alpha, ell, spline, bez, mirrorX, TAU } from './paper.js';

const lerp = (a, b, t) => a + (b - a) * t;
// Hälfte (rechts, oben -> unten, Anfang und Ende auf der Achse) -> volle Form
const full = (G, half) => mirrorX(half.map(([u, v]) => G.P(u, v)), G.cx);

function hairlineV(hl, u) { // Höhe der Haarlinie bei u (hl: rechts -> links)
  for (let i = 0; i < hl.length - 1; i++) { const a = hl[i], b = hl[i + 1]; if ((u <= a[0] && u >= b[0])) return lerp(a[1], b[1], (a[0] - u) / ((a[0] - b[0]) || 1)); }
  return hl[hl.length - 1][1];
}
// Strähnen vom Scheitel nach außen
function strands(ctx, G, o, n = 22) {
  const { side, top, hl, part = 0 } = o, b = -top - 0.3;
  const col1 = tint(o.col, 0.32), col2 = shade(o.col, 0.3);
  ctx.save(); ctx.lineCap = 'round';
  for (let i = 0; i < n; i++) {
    const a = Math.PI * (0.04 + 0.92 * (i + 0.5) / n), uo = side * Math.cos(a), vo = -0.3 - b * Math.sin(a);
    const us = Math.cos(a) * 0.86, vs = hairlineV(hl, Math.max(-0.9, Math.min(0.9, us))) + 0.02;
    const [x0, y0] = G.P(lerp(part, us, 0.7), lerp(vs, -0.9, 0.3)), [x1, y1] = G.P(uo, vo);
    const mx = (x0 + x1) / 2 + (Math.cos(a) > 0 ? 6 : -6), my = (y0 + y1) / 2 + 3;
    ctx.strokeStyle = i % 2 ? alpha(col1, 0.5) : alpha(col2, 0.32); ctx.lineWidth = 1.2 + (i % 3) * 0.5;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo(mx, my, x0, y0); ctx.stroke();
  }
  ctx.restore();
}
const HL = [[0.93, -0.06], [0.93, -0.36], [0.74, -0.6], [0.4, -0.72], [0, -0.75], [-0.4, -0.72], [-0.74, -0.6], [-0.93, -0.36], [-0.93, -0.06]];

// Haarkappe: das Haar auf dem Schädel, von der Haarlinie bis zum äußeren Bogen
export function cap(P, G, o) {
  const side = o.side ?? 1.08, top = o.top ?? -1.2, sd = o.sdrop ?? 0.05, fl = o.flare ?? 0, hl = o.hl || HL, b = -top - 0.3;
  const out = [G.P(side + fl, sd)];
  for (let i = 0; i <= 12; i++) { const a = Math.PI * i / 12; out.push(G.P(side * Math.cos(a) + (a < 0.3 ? fl * (1 - a / 0.3) : a > Math.PI - 0.3 ? -fl * (1 - (Math.PI - a) / 0.3) : 0), -0.3 - b * Math.sin(a))); }
  out.push(G.P(-side - fl, sd));
  const inner = hl.map(([u, v]) => G.P(u * (o.inner ?? 1), v));
  // hl läuft rechts -> links; nach dem äußeren Bogen (endet links) geht es links -> rechts zurück
  const pts = out.concat(inner.slice().reverse());
  const col = o.col;
  return P.cut(pts, col, { lift: o.lift ?? 0.75, wob: 0.9, bump: o.bump, step: 5, deco: (ctx, bb) => { if (o.strands !== false) strands(ctx, G, { ...o, side, top, hl }); if (o.deco) o.deco(ctx, bb); } });
}

// ---------------------------------------------------------------- Haarstile
export const HAIR = {
  none: {},
  // kurzes Haar mit Scheitel (Carter, Mendel, Franklin ...)
  kurz: { front(P, G, H) {
    const hl = H.hl || [[0.93, -0.06], [0.93, -0.34], [0.8, -0.56], [0.5, -0.7], [0.1, -0.76], [-0.3, -0.74], [-0.7, -0.6], [-0.93, -0.36], [-0.93, -0.06]];
    cap(P, G, { col: H.col, side: H.side ?? 1.06, top: H.top ?? -1.14, sdrop: H.sdrop ?? 0.02, hl, part: -0.3, bump: H.bump });
    if (H.partLine) P.line([G.P(-0.28, -0.78), G.P(-0.34, -1.0), G.P(-0.28, -1.12)], shade(H.col, 0.4), 1.6, { a: 0.7 });
  } },
  // Wellen, halblang, über die Ohren (Herodot, Humboldt, Liebig)
  wellig: { front(P, G, H) {
    cap(P, G, { col: H.col, side: H.side ?? 1.12, top: H.top ?? -1.22, sdrop: H.sdrop ?? 0.5, flare: H.flare ?? 0.1, hl: H.hl, bump: H.bump || { amp: 4, wl: 30 }, part: H.part ?? -0.2 });
  }, back(P, G, H) {
    if (H.back === false) return;
    P.cut(full(G, [[0, -1.3], [0.7, -1.25], [1.14, -0.7], [1.2, -0.1], [1.2, 0.7], [0.9, 1.0], [0, 1.0]]), shade(H.col, 0.18), { lift: 0.6, bump: { amp: 3, wl: 26 } });
  } },
  // Locken (Champollion)
  locken: { front(P, G, H) {
    const hl = [[0.95, 0.2], [0.93, -0.3], [0.78, -0.52], [0.5, -0.58], [0.25, -0.5], [0, -0.56], [-0.28, -0.5], [-0.55, -0.58], [-0.8, -0.52], [-0.93, -0.3], [-0.95, 0.2]];
    cap(P, G, { col: H.col, side: 1.2, top: -1.4, sdrop: 0.3, flare: 0.04, hl, bump: { amp: 8, wl: 30 }, part: 0, strands: false, lift: 0.9, deco: (ctx, bb) => {
      const r = P.rnd; ctx.lineCap = 'round';
      for (let i = 0; i < 46; i++) { const x = bb.x0 + 10 + r() * (bb.w - 20), y = bb.y0 + 6 + r() * (bb.h * 0.8), rad = 6 + r() * 7, a = r() * TAU;
        ctx.strokeStyle = i % 2 ? alpha(tint(H.col, 0.34), 0.5) : alpha('#000', 0.35); ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, rad, a, a + 3.4); ctx.stroke(); } } });
    // einzelne Stirnlocken
    for (const [u, v, rr] of [[-0.64, -0.5, 21], [-0.38, -0.5, 18], [-0.12, -0.52, 19], [0.14, -0.5, 18], [0.4, -0.52, 20], [0.64, -0.5, 21]]) P.cut(ell(G.X(u), G.Y(v), rr, rr * 0.9, 14), H.col, { lift: 0.3, wob: 0.6, grad: false, bump: { amp: 2.8, wl: 14 }, deco: (ctx) => { ctx.strokeStyle = alpha(tint(H.col, 0.36), 0.55); ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(G.X(u) + 2, G.Y(v), rr * 0.45, 0.5, 4.2); ctx.stroke(); } });
  } },
  // fast kahl: Haarkranz seitlich und hinten (Darwin, Bunsen)
  kranz: { back(P, G, H) {
    P.cut(full(G, [[0, -0.55], [0.8, -0.5], [1.12, -0.1], [1.16, 0.35], [1.0, 0.62], [0, 0.62]]), H.col, { lift: 0.7, bump: { amp: 3.5, wl: 22 }, deco: (ctx) => {
      ctx.strokeStyle = alpha(shade(H.col, 0.3), 0.4); ctx.lineWidth = 1.3; for (let i = 0; i < 16; i++) { const s = i % 2 ? 1 : -1, x = G.cx + s * (G.fw * (1.0 + (i % 5) * 0.03)); ctx.beginPath(); ctx.moveTo(x, G.Y(-0.4 + (i % 4) * 0.1)); ctx.quadraticCurveTo(x + s * 6, G.Y(0.1), x - s * 2, G.Y(0.55)); ctx.stroke(); } } });
  }, front(P, G, H) {
    for (const s of [-1, 1]) {
      const half = [[0.97, -0.46], [1.07, -0.24], [1.1, 0.12], [1.03, 0.36], [0.95, 0.2], [0.97, -0.08]].map(([u, v]) => G.P(s * u, v));
      P.cut(s < 0 ? half.reverse() : half, H.col, { lift: 0.5, bump: { amp: 2.2, wl: 16 }, step: 5 });
    }
  } },
  // lange, wilde Haare (Mendelejew)
  lang: { back(P, G, H) {
    P.cut(full(G, [[0, -1.34], [0.8, -1.3], [1.28, -0.7], [1.5, 0.2], [1.6, 1.0], [1.65, 1.9], [0, 1.9]]), shade(H.col, 0.15), { lift: 0.7, bump: { amp: 6, wl: 26 }, deco: (ctx) => {
      ctx.strokeStyle = alpha(tint(H.col, 0.3), 0.45); ctx.lineWidth = 1.4;
      for (let i = 0; i < 26; i++) { const s = i % 2 ? 1 : -1, u = 1.0 + (i % 7) * 0.08, x0 = G.X(s * u), y0 = G.Y(-0.6 + (i % 5) * 0.1); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + s * 18, G.Y(0.6), x0 + s * (10 + (i % 4) * 6), G.Y(1.7)); ctx.stroke(); }
    } });
  }, front(P, G, H) {
    cap(P, G, { col: H.col, side: 1.16, top: -1.3, sdrop: 0.4, flare: 0.12, bump: { amp: 5, wl: 28 }, part: 0.06,
      hl: [[0.96, 0.3], [0.94, -0.3], [0.78, -0.58], [0.45, -0.68], [0.1, -0.74], [-0.25, -0.7], [-0.62, -0.62], [-0.9, -0.4], [-0.96, 0.3]] });
  } },
  // Melonenfrisur (Kleopatra): in der Mitte gescheitelt, wellige Rippen nach hinten, Knoten im Nacken
  melone: { back(P, G, H) {
    P.cut(ell(G.cx, G.Y(1.05), G.fw * 0.5, G.fh * 0.32, 18), shade(H.col, 0.1), { lift: 0.6, bump: { amp: 4, wl: 18 } }); // Knoten im Nacken
    P.cut(full(G, [[0, -1.3], [0.75, -1.24], [1.14, -0.7], [1.16, 0.0], [1.06, 0.55], [0.9, 0.7], [0, 0.7]]), shade(H.col, 0.12), { lift: 0.6 });
  }, front(P, G, H) {
    const hl = [[0.95, 0.1], [0.93, -0.3], [0.78, -0.56], [0.45, -0.66], [0.1, -0.7], [0, -0.7], [-0.1, -0.7], [-0.45, -0.66], [-0.78, -0.56], [-0.93, -0.3], [-0.95, 0.1]];
    cap(P, G, { col: H.col, side: 1.13, top: -1.18, sdrop: 0.1, flare: 0.04, hl, strands: false, lift: 0.9, part: 0 });
    // Rippen
    const ctx = P.ctx; ctx.save(); ctx.lineCap = 'round';
    for (const s of [-1, 1]) for (let i = 0; i < 6; i++) {
      const t = (i + 0.7) / 6.4, ux = s * (0.08 + t * 0.95);
      const [x0, y0] = G.P(ux * 0.75, -0.7 + t * 0.15 - 0.0), [x1, y1] = G.P(s * (0.95 + t * 0.17), -0.1 + t * 0.15), [xm, ym] = G.P(s * (0.65 + t * 0.55), -0.95 + t * 0.38);
      ctx.strokeStyle = alpha(shade(H.col, 0.45), 0.55); ctx.lineWidth = 1.8; ctx.beginPath(); ctx.moveTo(G.X(s * 0.02), G.Y(-0.72)); ctx.quadraticCurveTo(xm, ym - 14, x1, y1); ctx.stroke();
      ctx.strokeStyle = alpha(tint(H.col, 0.35), 0.4); ctx.lineWidth = 1.3; ctx.beginPath(); ctx.moveTo(G.X(s * 0.02), G.Y(-0.74)); ctx.quadraticCurveTo(xm + s * 3, ym - 12, x1 + s * 3, y1 - 2); ctx.stroke();
    }
    ctx.restore();
    P.line([G.P(0, -0.7), G.P(0, -1.18)], shade(H.col, 0.5), 1.8, { a: 0.8 });
  } },
  // Allongeperücke (Linné): lange helle Locken bis zur Schulter
  allonge: { back(P, G, H) {
    P.cut(full(G, [[0, -1.42], [0.8, -1.36], [1.3, -0.8], [1.45, 0.1], [1.52, 0.9], [1.55, 1.5], [1.2, 1.78], [0, 1.78]]), shade(H.col, 0.06), { lift: 0.9, bump: { amp: 7, wl: 24 }, deco: (ctx) => {
      ctx.strokeStyle = alpha(shade(H.col, 0.3), 0.4); ctx.lineWidth = 1.3;
      for (let i = 0; i < 14; i++) for (const s of [-1, 1]) { const y = G.Y(0.4 + i * 0.09); ctx.beginPath(); ctx.arc(G.X(s * (1.15 + (i % 3) * 0.1)), y, 11, 0, Math.PI); ctx.stroke(); }
    } });
  }, front(P, G, H) {
    cap(P, G, { col: H.col, side: 1.2, top: -1.38, sdrop: 0.3, flare: 0.14, bump: { amp: 6, wl: 22 }, part: 0, lift: 1,
      hl: [[0.96, 0.3], [0.94, -0.3], [0.8, -0.58], [0.5, -0.74], [0.18, -0.74], [0, -0.66], [-0.18, -0.74], [-0.5, -0.74], [-0.8, -0.58], [-0.94, -0.3], [-0.96, 0.3]] });
    for (const s of [-1, 1]) for (let j = 0; j < 3; j++) P.cut(ell(G.X(s * (1.12 + j * 0.02)), G.Y(0.1 + j * 0.34), 17, 20, 14), H.col, { lift: 0.5, bump: { amp: 3, wl: 14 }, wob: 0.5 });
  } },
  // Rollenperücke (Lavoisier): kurze Stirn, zwei Rollen an jeder Seite
  rollen: { back(P, G, H) { P.cut(full(G, [[0, -1.3], [0.8, -1.26], [1.2, -0.6], [1.22, 0.3], [1.0, 0.9], [0, 0.9]]), shade(H.col, 0.1), { lift: 0.6 }); },
    front(P, G, H) {
      cap(P, G, { col: H.col, side: 1.12, top: -1.26, sdrop: 0.0, hl: [[0.95, -0.04], [0.93, -0.36], [0.76, -0.6], [0.4, -0.7], [0, -0.74], [-0.4, -0.7], [-0.76, -0.6], [-0.93, -0.36], [-0.95, -0.04]], bump: { amp: 3, wl: 20 }, lift: 0.9 });
      for (const s of [-1, 1]) for (let j = 0; j < 2; j++) {
        const x = G.X(s * 1.07), y = G.Y(0.0 + j * 0.34);
        P.cut(ell(x, y, 21, 14.5, 18), H.col, { lift: 0.8, wob: 0.5, deco: (ctx) => { ctx.strokeStyle = alpha(shade(H.col, 0.35), 0.5); ctx.lineWidth = 1.4; for (let q = -1; q <= 1; q++) { ctx.beginPath(); ctx.moveTo(x - 17, y + q * 5); ctx.quadraticCurveTo(x, y + q * 5 - 4, x + 17, y + q * 5); ctx.stroke(); } } });
      }
    } },
  // Haarknoten (Curie): nach hinten gekämmt, Wellen an den Schläfen, Knoten oben
  knoten: { back(P, G, H) {
    P.cut(ell(G.cx, G.Y(-1.28), G.fw * 0.5, G.fh * 0.3, 18), shade(H.col, 0.05), { lift: 0.8, bump: { amp: 3, wl: 16 } });
    P.cut(full(G, [[0, -1.2], [0.8, -1.16], [1.1, -0.6], [1.12, 0.1], [0.98, 0.4], [0, 0.4]]), shade(H.col, 0.15), { lift: 0.6 });
  }, front(P, G, H) {
    cap(P, G, { col: H.col, side: 1.1, top: -1.14, sdrop: 0.18, flare: 0.02, bump: { amp: 2.5, wl: 26 }, part: 0,
      hl: [[0.95, 0.12], [0.93, -0.3], [0.78, -0.56], [0.5, -0.7], [0.2, -0.76], [0, -0.78], [-0.2, -0.76], [-0.5, -0.7], [-0.78, -0.56], [-0.93, -0.3], [-0.95, 0.12]] });
    P.line([G.P(0, -0.78), G.P(0, -1.14)], shade(H.col, 0.5), 1.6, { a: 0.7 });
  } },
};

// ---------------------------------------------------------------- Bärte
export const BEARD = {
  // voller, krauser Bart (Herodot, Mendelejew, Darwin als lang)
  voll(P, G, B) {
    const len = B.len ?? 0.3, wid = B.wid ?? 1.0;
    const half = [[0, 0.46], [0.3, 0.43], [0.62, 0.29], [0.86, 0.05], [0.98, -0.25], [1.0 * wid, 0.1], [0.96 * wid, 0.5], [0.84 * wid, 0.9], [0.6 * wid, 1.25 + len * 0.4], [0.3, 1.45 + len], [0, 1.52 + len]];
    const col = B.col;
    P.cut(full(G, half), col, { lift: 0.9, bump: B.curl ? { amp: B.curl, wl: B.wl || 20 } : undefined, wob: 0.9, step: 5, deco: (ctx) => {
      ctx.lineCap = 'round';
      const n = B.strands ?? 40;
      for (let i = 0; i < n; i++) {
        const s = i % 2 ? 1 : -1, t = (i * 0.618) % 1, u = (0.12 + t * 0.78) * s * wid, v0 = 0.5 + ((i * 7) % 5) * 0.06;
        ctx.strokeStyle = i % 3 ? alpha(tint(col, 0.3), 0.5) : alpha(shade(col, 0.35), 0.35); ctx.lineWidth = 1.2 + (i % 3) * 0.4;
        const [x0, y0] = G.P(u, v0), [x1, y1] = G.P(u * 0.8 + s * 0.05, 1.15 + len * (0.4 + t * 0.7));
        ctx.beginPath(); ctx.moveTo(x0, y0); ctx.quadraticCurveTo(x0 + s * 6, (y0 + y1) / 2, x1, y1); ctx.stroke();
      }
    } });
  },
  // Backenbart / Koteletten: oben schmal, in Wangenhöhe am breitesten, unten spitz zulaufend
  koteletten(P, G, B) {
    const w = B.wid ?? 1, l = B.len ?? 0.55, a = 0.07 * (w - 1), tip = 0.62 + 0.3 * l;
    for (const s of [-1, 1]) {
      const half = [[0.96 + a * 0.3, -0.3], [1.05 + a, 0.0], [1.1 + a, 0.3], [1.05 + a * 0.8, 0.55], [0.96, tip - 0.1], [0.9, tip], [0.84, 0.55], [0.82 - a, 0.3], [0.88 - a, 0.0], [0.93, -0.25]].map(([u, v]) => G.P(s * u, v));
      P.cut(s < 0 ? half.reverse() : half, B.col, { lift: 0.8, bump: { amp: B.curl ?? 2.5, wl: 14 }, step: 5, deco: (ctx) => {
        ctx.strokeStyle = alpha(shade(B.col, 0.3), 0.4); ctx.lineWidth = 1.2; for (let i = 0; i < 7; i++) { const [x0, y0] = G.P(s * (0.9 + i * 0.03), -0.15 + i * 0.02), [x1, y1] = G.P(s * (0.88 + i * 0.03), tip - 0.12); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
      } });
    }
  },
  // Kinnbart, gegabelt (Gutenberg)
  gabel(P, G, B) {
    for (const s of [-1, 1]) {
      const r = [[0.12, 0.8], [0.52, 0.72], [0.62, 1.0], [0.54, 1.35], [0.4, 1.95], [0.3, 1.5], [0.12, 1.2]].map(([u, v]) => G.P(s * u, v));
      P.cut(s < 0 ? r.reverse() : r, B.col, { lift: 0.8, bump: { amp: 2.5, wl: 16 }, step: 5 });
    }
  },
  // Kinnlappen / Ziegenbart
  spitz(P, G, B) {
    P.cut(full(G, [[0, 0.78], [0.3, 0.78], [0.38, 1.05], [0.22, 1.45 + (B.len ?? 0)], [0, 1.6 + (B.len ?? 0)]]), B.col, { lift: 0.7, bump: { amp: 2, wl: 14 } });
  },
};
export function stache(P, G, S) {
  const droop = S.droop ?? 0.06, w = S.w ?? 0.6, th = S.th ?? 1;
  const half = [[0.02, 0.47], [0.22, 0.45], [0.42, 0.48], [w, 0.55 + droop], [w + 0.05, 0.7 + droop * 1.4], [w - 0.1, 0.68 + droop], [0.38, 0.6 + 0.02 * th], [0.18, 0.58], [0.02, 0.57]];
  for (const s of [-1, 1]) {
    const r = half.map(([u, v]) => G.P(s * u, v));
    P.cut(s < 0 ? r.reverse() : r, S.col, { lift: 0.55, wob: 0.6, bump: S.curl ? { amp: S.curl, wl: 10 } : undefined, step: 4, deco: (ctx) => {
      ctx.strokeStyle = alpha(shade(S.col, 0.4), 0.45); ctx.lineWidth = 1; for (let i = 0; i < 6; i++) { const [x0, y0] = G.P(s * (0.05 + i * 0.1), 0.5), [x1, y1] = G.P(s * (0.15 + i * 0.1 + (w - 0.4) * i / 6), 0.62 + droop * i / 5); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); }
    } });
  }
}

// ---------------------------------------------------------------- Kopfbedeckungen und Kopfschmuck
// Jede hat front (vor dem Haar) und optional back (hinter dem Gesicht)
export const HAT = {
  // steifer Filzhut (Homburg) mit Hutband
  homburg: { front(P, G, T) {
    const col = T.col, band = T.band || shade(col, 0.5);
    const crown = [[-0.98, -0.78], [-1.0, -1.2], [-0.86, -1.62], [-0.5, -1.82], [0, -1.74], [0.5, -1.82], [0.86, -1.62], [1.0, -1.2], [0.98, -0.78]].map(([u, v]) => G.P(u, v));
    P.cut(crown, col, { lift: 1, deco: (ctx) => { ctx.fillStyle = alpha(band, 1); ctx.beginPath(); ctx.moveTo(G.X(-1.02), G.Y(-1.0)); ctx.lineTo(G.X(1.02), G.Y(-1.0)); ctx.lineTo(G.X(1.0), G.Y(-0.76)); ctx.lineTo(G.X(-1.0), G.Y(-0.76)); ctx.fill();
      ctx.strokeStyle = alpha(shade(col, 0.35), 0.5); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(G.X(0), G.Y(-1.74)); ctx.quadraticCurveTo(G.X(0.02), G.Y(-1.52), G.X(0), G.Y(-1.38)); ctx.stroke(); } });
    const brim = [[-1.62, -0.84], [-1.4, -0.98], [-0.7, -0.92], [0, -0.86], [0.7, -0.92], [1.4, -0.98], [1.62, -0.84], [1.5, -0.62], [0.8, -0.56], [0, -0.52], [-0.8, -0.56], [-1.5, -0.62]].map(([u, v]) => G.P(u, v));
    P.cut(brim, tint(col, 0.04), { lift: 1.1, deco: (ctx) => { const g = ctx.createLinearGradient(0, G.Y(-1), 0, G.Y(-0.5)); g.addColorStop(0, 'rgba(255,255,255,0.12)'); g.addColorStop(1, 'rgba(30,15,5,0.25)'); ctx.fillStyle = g; ctx.fillRect(0, 0, 600, 800); } });
    P.line([G.P(-1.5, -0.88), G.P(-0.7, -0.8), G.P(0, -0.74), G.P(0.7, -0.8), G.P(1.5, -0.88)], alpha(band, 1), 3, { a: 0.5 });
  } },
  // Barett (spätmittelalterlich, Gutenberg)
  barett: { front(P, G, T) {
    const col = T.col;
    P.cut([[-1.18, -0.8], [-1.12, -1.22], [-0.7, -1.54], [0, -1.62], [0.8, -1.55], [1.2, -1.3], [1.24, -0.95], [0.95, -0.74], [0, -0.7], [-0.95, -0.74]].map(([u, v]) => G.P(u, v)), col, { lift: 1.1, bump: { amp: 1.5, wl: 40 }, deco: (ctx) => {
      ctx.strokeStyle = alpha(shade(col, 0.4), 0.45); ctx.lineWidth = 1.6; for (let i = -3; i <= 3; i++) { ctx.beginPath(); ctx.moveTo(G.X(i * 0.12), G.Y(-0.74)); ctx.quadraticCurveTo(G.X(i * 0.3), G.Y(-1.2), G.X(i * 0.34), G.Y(-1.6)); ctx.stroke(); } } });
    P.cut([[-0.98, -0.74], [0, -0.7], [1.0, -0.72], [1.04, -0.9], [0, -0.88], [-1.02, -0.9]].map(([u, v]) => G.P(u, v)), T.trim || shade(col, 0.3), { lift: 0.8, smooth: false });
  } },
  // weiße Leinenhaube (Merian)
  haube: { front(P, G, T) {
    const col = T.col || '#f4efe2';
    P.cut(full(G, [[0, -1.55], [0.7, -1.45], [1.15, -1.05], [1.22, -0.4], [1.18, 0.3], [1.05, 0.55], [0.95, 0.1], [0.9, -0.4], [0.7, -0.72], [0.3, -0.84], [0, -0.85]]),
      col, { lift: 1, bump: { amp: 2, wl: 18 }, deco: (ctx) => {
        ctx.strokeStyle = alpha(shade(col, 0.2), 0.5); ctx.lineWidth = 1.4;
        for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(G.X(i * 0.065), G.Y(-0.84 + Math.abs(i) * 0.014)); ctx.quadraticCurveTo(G.X(i * 0.15), G.Y(-1.2), G.X(i * 0.12), G.Y(-1.55)); ctx.stroke(); }
      } });
    P.line([G.P(-0.9, -0.4), G.P(-0.7, -0.72), G.P(-0.3, -0.85), G.P(0.3, -0.85), G.P(0.7, -0.72), G.P(0.9, -0.4)], tint(col, 0.2), 4.5, { a: 1, shadow: true });
  } },
  // Haube mit breiter Krempe (Anning): Innenseite hinter dem Gesicht, Rand und Bänder davor
  bonnet: {
    back(P, G, T) {
      const col = T.col, half = [[0, -1.66], [0.7, -1.56], [1.2, -1.14], [1.38, -0.5], [1.4, 0.3], [1.3, 0.8], [1.1, 0.92], [0, 0.92]];
      P.cut(full(G, half), col, { lift: 1.1, bump: { amp: 1.2, wl: 40 }, deco: (ctx) => { ctx.strokeStyle = alpha(shade(col, 0.3), 0.38); ctx.lineWidth = 1.6; for (let i = -7; i <= 7; i++) { ctx.beginPath(); ctx.moveTo(G.X(i * 0.1), G.Y(-0.95)); ctx.quadraticCurveTo(G.X(i * 0.22), G.Y(-1.35), G.X(i * 0.28), G.Y(-1.62)); ctx.stroke(); } } });
      P.cut(full(G, [[0, -1.0], [0.62, -0.92], [1.06, -0.5], [1.16, 0.2], [1.1, 0.8], [0, 0.9]]), shade(col, 0.28), { lift: 0.3, wob: 0.5, edge: false });
    },
    front(P, G, T) {
      const rib = T.ribbon || '#a04a48', col = T.col;
      // Randstreifen über der Stirn und an den Seiten
      P.line([G.P(-1.28, 0.62), G.P(-1.34, 0.0), G.P(-1.22, -0.66), G.P(-0.8, -1.2), G.P(0, -1.34), G.P(0.8, -1.2), G.P(1.22, -0.66), G.P(1.34, 0.0), G.P(1.28, 0.62)], rib, 7, { a: 1, shadow: true });
      // Schleife unter dem Kinn
      P.line([G.P(-1.2, 0.8), G.P(-0.7, 1.12), G.P(-0.12, 1.14)], rib, 5, { a: 1, shadow: true }); P.line([G.P(1.2, 0.8), G.P(0.7, 1.12), G.P(0.12, 1.14)], rib, 5, { a: 1, shadow: true });
      for (const sg of [-1, 1]) P.cut([[G.X(0), G.Y(1.1)], [G.X(sg * 0.34), G.Y(1.0)], [G.X(sg * 0.44), G.Y(1.22)], [G.X(sg * 0.1), G.Y(1.22)]].map(([x, y]) => [x, y]), rib, { lift: 0.7, wob: 0.4 });
      P.cut(ell(G.X(0), G.Y(1.12), 9, 9, 10), shade(rib, 0.15), { lift: 0.7 });
    },
  },
  // goldenes Stirnband mit Uräusschlange (Kleopatra)
  diadem: { front(P, G, T) {
    const gold = T.col || '#e2b64a', gl = tint(gold, 0.5);
    const up = [[-1.0, -0.2], [-0.92, -0.52], [-0.6, -0.74], [-0.3, -0.82], [0, -0.84], [0.3, -0.82], [0.6, -0.74], [0.92, -0.52], [1.0, -0.2]], th = 0.1;
    const outer = up.map(([u, v]) => G.P(u, v - th / 2)), inner = up.map(([u, v]) => G.P(u, v + th / 2)).reverse();
    P.cut(outer.concat(inner), gold, { lift: 0.9, wob: 0.4, deco: (ctx) => { ctx.fillStyle = alpha('#fff4c0', 0.45); ctx.fillRect(0, G.Y(-0.92), 600, 4); } });
    for (let i = -3; i <= 3; i++) { const [x, y] = G.P(i * 0.24, -0.84 + (Math.abs(i) * 0.04) + (Math.abs(i) > 2 ? 0.06 : 0)); P.cut(ell(x, y, 5, 5, 8), i % 2 ? '#2a5aa0' : '#c0432e', { lift: 0.3, edge: false, wob: 0.1 }); }
    // Uräus: aufgerichtete Kobra
    const cx = G.cx, y0 = G.Y(-0.8);
    P.cut([[cx - 7, y0 + 4], [cx - 14, y0 - 10], [cx - 18, y0 - 28], [cx - 9, y0 - 42], [cx + 9, y0 - 42], [cx + 18, y0 - 28], [cx + 14, y0 - 10], [cx + 7, y0 + 4]], gold, { lift: 0.9, wob: 0.3, deco: (ctx) => { ctx.strokeStyle = alpha('#7a5a1a', 0.5); ctx.lineWidth = 1.2; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(cx - 12 + k * 1, y0 - 34 + k * 7); ctx.quadraticCurveTo(cx, y0 - 30 + k * 7, cx + 12 - k * 1, y0 - 34 + k * 7); ctx.stroke(); } } });
    P.cut(ell(cx, y0 - 46, 7.5, 6.5, 12), gold, { lift: 0.7, wob: 0.2 }); P.dot(cx - 2.6, y0 - 47, 1.5, '#2a1a10'); P.dot(cx + 2.6, y0 - 47, 1.5, '#2a1a10');
  } },
  // schmales Stirnband (Herodot): Binde im Haar
  band: { front(P, G, T) {
    const up = [[-1.08, -0.1], [-0.98, -0.5], [-0.6, -0.8], [0, -0.9], [0.6, -0.8], [0.98, -0.5], [1.08, -0.1]], th = 0.07;
    P.cut(up.map(([u, v]) => G.P(u, v - th / 2)).concat(up.map(([u, v]) => G.P(u, v + th / 2)).reverse()), T.col || '#a8433a', { lift: 0.8, wob: 0.4 });
  } },
};

export function drawHairLayer(P, G, layer, H) {
  if (!H || !HAIR[H.style]) return; const f = HAIR[H.style][layer]; if (f) f(P, G, H);
}
export function drawHat(P, G, layer, T) { if (T && HAT[T.style] && HAT[T.style][layer]) HAT[T.style][layer](P, G, T); }
