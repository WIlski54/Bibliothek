// Zifferblatt der Zeituhr: äußerer Ring mit zehn Meilensteinen (Papierschnitt-Medaillons), innen eine echte Uhr (Zeiger kommen als 3D-Teile).
import { drawIcon } from './icons.js';
import { MILESTONES } from './texts.js';

const SERIF = 'Georgia, "Times New Roman", serif';
const TAU = Math.PI * 2, INK = '#3b2415', PAPER = '#f6efdc';
export const EPOCH_COL = { altertum: '#b5532f', mittelalter: '#c8982c', neuzeit: '#3f7f6a' };
const EPOCH_NAME = { altertum: 'ALTERTUM', mittelalter: 'MITTELALTER', neuzeit: 'NEUZEIT' };

function arcText(g, text, cx, cy, r, theta, size, col) { // theta: Mitte, Grad im Uhrzeigersinn ab 12 Uhr
  g.save(); g.font = `bold ${size}px ${SERIF}`; g.fillStyle = col; g.textAlign = 'center'; g.textBaseline = 'middle';
  const chars = [...text], ws = chars.map((c) => g.measureText(c).width + size * 0.22), tot = ws.reduce((a, b) => a + b, 0), flip = theta > 90 && theta < 270;
  const mid = ((theta - 90) * Math.PI) / 180; let a = mid + (flip ? 1 : -1) * (tot / r) / 2;
  chars.forEach((ch, i) => { const da = ws[i] / r, am = a + (flip ? -da / 2 : da / 2); g.save(); g.translate(cx + Math.cos(am) * r, cy + Math.sin(am) * r); g.rotate(am + Math.PI / 2 + (flip ? Math.PI : 0)); g.fillText(ch, 0, 0); g.restore(); a += flip ? -da : da; });
  g.restore();
}

export function renderClockFace(canvas) {
  const S = canvas.width, R = S / 2, g = canvas.getContext('2d'), cx = R, cy = R;
  // Grund: Pergament
  const gr = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R); gr.addColorStop(0, '#fbf3dc'); gr.addColorStop(0.8, '#f0e1b6'); gr.addColorStop(1, '#dcc58f');
  g.fillStyle = gr; g.beginPath(); g.arc(cx, cy, R, 0, TAU); g.fill();
  // Epochen-Band (r 446..494)
  const idx = MILESTONES.map((m) => m.epoch); const n = MILESTONES.length, step = 360 / n;
  const bands = []; idx.forEach((e, i) => { const last = bands[bands.length - 1]; if (last && last.e === e) last.end = (i + 1) * step; else bands.push({ e, start: i * step, end: (i + 1) * step }); });
  const rA = R * 0.87, rB = R * 0.965;
  for (const b of bands) {
    g.beginPath(); g.arc(cx, cy, rB, ((b.start - 90) * Math.PI) / 180, ((b.end - 90) * Math.PI) / 180); g.arc(cx, cy, rA, ((b.end - 90) * Math.PI) / 180, ((b.start - 90) * Math.PI) / 180, true); g.closePath();
    g.fillStyle = EPOCH_COL[b.e]; g.fill(); g.strokeStyle = PAPER; g.lineWidth = 4; g.stroke();
    arcText(g, EPOCH_NAME[b.e], cx, cy, (rA + rB) / 2, (b.start + b.end) / 2, Math.round(R * 0.062), '#fbf1d6');
  }
  g.strokeStyle = '#8a6420'; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, rB + 6, 0, TAU); g.stroke(); g.beginPath(); g.arc(cx, cy, rA - 6, 0, TAU); g.stroke();
  // Medaillons
  const rm = R * 0.765, mr = R * 0.098;
  MILESTONES.forEach((m, i) => {
    const th = ((i + 0.5) * step - 90) * Math.PI / 180, x = cx + Math.cos(th) * rm, y = cy + Math.sin(th) * rm;
    g.save(); g.shadowColor = 'rgba(40,20,5,.5)'; g.shadowBlur = 8; g.shadowOffsetX = 3; g.shadowOffsetY = 5; g.fillStyle = PAPER; g.beginPath(); g.arc(x, y, mr + 6, 0, TAU); g.fill(); g.restore();
    g.fillStyle = EPOCH_COL[m.epoch]; g.beginPath(); g.arc(x, y, mr, 0, TAU); g.fill(); g.fillStyle = '#fbf3dc'; g.beginPath(); g.arc(x, y, mr - 11, 0, TAU); g.fill();
    drawIcon(g, m.icon, x, y, (mr - 11) * 0.66, INK, '#fbf3dc');
    // Jahreszahl (aufrecht) zwischen Medaillon und Uhr
    const ry = R * 0.55, tx = cx + Math.cos(th) * ry, ty = cy + Math.sin(th) * ry;
    g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillStyle = INK; g.font = `bold ${Math.round(R * 0.082)}px ${SERIF}`; g.fillText(m.year, tx, ty - R * 0.02);
    g.font = `italic ${Math.round(R * 0.05)}px ${SERIF}`; g.fillStyle = '#6a4224'; g.fillText(m.era, tx, ty + R * 0.05);
  });
  // feine Ringe
  g.strokeStyle = 'rgba(138,100,32,.7)'; g.lineWidth = 2.5; g.beginPath(); g.arc(cx, cy, R * 0.435, 0, TAU); g.stroke();
  // Uhrscheibe innen
  const ri = R * 0.40; const gi = g.createRadialGradient(cx, cy, 0, cx, cy, ri); gi.addColorStop(0, '#fffaec'); gi.addColorStop(1, '#f3e6c4'); g.fillStyle = gi; g.beginPath(); g.arc(cx, cy, ri, 0, TAU); g.fill();
  g.strokeStyle = INK; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, ri - 3, 0, TAU); g.stroke();
  const roman = ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'];
  for (let i = 0; i < 60; i++) { const a = (i / 60) * TAU - Math.PI / 2, big = i % 5 === 0, r1 = ri - 6, r2 = ri - (big ? 26 : 14); g.lineWidth = big ? 4 : 1.6; g.beginPath(); g.moveTo(cx + Math.cos(a) * r1, cy + Math.sin(a) * r1); g.lineTo(cx + Math.cos(a) * r2, cy + Math.sin(a) * r2); g.stroke(); }
  g.fillStyle = INK; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = `bold ${Math.round(R * 0.062)}px ${SERIF}`;
  roman.forEach((t, i) => { const a = (i / 12) * TAU - Math.PI / 2, rr = ri - 52; g.fillText(t, cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); });
  g.font = `italic ${Math.round(R * 0.045)}px ${SERIF}`; g.fillStyle = '#6a4224'; g.fillText('Zeituhr', cx, cy - ri * 0.42); g.fillText('3000 v. Chr. bis heute', cx, cy + ri * 0.42);
  return canvas;
}
