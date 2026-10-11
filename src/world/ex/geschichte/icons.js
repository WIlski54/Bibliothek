// Kleine Papierschnitt-Symbole (Canvas) für Kartennadeln und Zeituhr. Jedes Symbol passt in die Einheitsbox [-1,1] und wird einfarbig gefüllt.
const TAU = Math.PI * 2;
const poly = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); g.fill(); };
const rr = (g, x, y, w, h, r) => { g.beginPath(); g.roundRect(x, y, w, h, r); g.fill(); };
const cut = (g, paper, fn) => { const f = g.fillStyle; g.fillStyle = paper; fn(); g.fillStyle = f; };

export const ICONS = {
  pyramide(g, ink, paper) {
    poly(g, [[-0.95, 0.7], [0.95, 0.7], [0, -0.8]]);
    g.strokeStyle = paper; g.lineWidth = 0.08; g.lineCap = 'round';
    for (const y of [0.38, 0.02, -0.34]) { const hw = 0.95 * (y + 0.8) / 1.5; g.beginPath(); g.moveTo(-hw, y); g.lineTo(hw, y); g.stroke(); }
    g.fillStyle = ink; g.beginPath(); g.arc(0.62, -0.62, 0.2, 0, TAU); g.fill();
  },
  papyrus(g, ink, paper) {
    rr(g, -0.7, -0.55, 1.4, 1.1, 0.12);
    cut(g, paper, () => { for (const y of [-0.28, 0, 0.28]) rr(g, -0.46, y - 0.05, 0.92, 0.1, 0.05); });
    g.fillStyle = ink; g.beginPath(); g.ellipse(-0.7, 0, 0.16, 0.62, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.7, 0, 0.16, 0.62, 0, 0, TAU); g.fill();
    cut(g, paper, () => { g.beginPath(); g.ellipse(-0.7, 0, 0.07, 0.3, 0, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0.7, 0, 0.07, 0.3, 0, 0, TAU); g.fill(); });
  },
  tafel(g, ink, paper) { // Tontafel mit Keilschrift-Zeilen
    g.save(); g.rotate(-0.1); rr(g, -0.8, -0.75, 1.6, 1.5, 0.2); g.restore();
    cut(g, paper, () => { for (let r = 0; r < 4; r++) for (let c = 0; c < 4; c++) { const x = -0.5 + c * 0.33 + (r % 2) * 0.05, y = -0.5 + r * 0.33; poly(g, [[x - 0.1, y - 0.1], [x + 0.1, y - 0.1], [x, y + 0.1]]); } });
  },
  tempel(g, ink, paper) {
    poly(g, [[-1, -0.35], [1, -0.35], [0, -0.95]]);
    rr(g, -0.95, -0.28, 1.9, 0.14, 0.03);
    for (const x of [-0.7, -0.24, 0.24, 0.7]) rr(g, x - 0.1, -0.1, 0.2, 0.75, 0.04);
    rr(g, -1, 0.68, 2, 0.14, 0.03); rr(g, -0.92, 0.82, 1.84, 0.12, 0.03);
  },
  lorbeer(g, ink, paper) {
    for (let i = 0; i < 11; i++) for (const s of [-1, 1]) {
      const a = Math.PI * (0.62 + i * 0.075) * (s < 0 ? 1 : -1) + (s < 0 ? 0 : Math.PI), x = Math.cos(a) * 0.72, y = Math.sin(a) * 0.72 + 0.05;
      g.save(); g.translate(x, y); g.rotate(a + Math.PI / 2 + (s < 0 ? 0.5 : -0.5)); g.beginPath(); g.ellipse(0, 0, 0.1, 0.24, 0, 0, TAU); g.fill(); g.restore();
    }
    g.save(); g.beginPath(); g.arc(0, 0.05, 0.72, 0.5, Math.PI - 0.5); g.lineWidth = 0.07; g.strokeStyle = ink; g.stroke(); g.restore();
    g.fillStyle = ink; g.font = 'bold 0.8px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('R', 0, 0.1);
  },
  krone(g, ink, paper) {
    poly(g, [[-0.85, 0.55], [-0.85, -0.45], [-0.45, 0.05], [0, -0.7], [0.45, 0.05], [0.85, -0.45], [0.85, 0.55]]);
    for (const [x, y] of [[-0.85, -0.52], [0, -0.78], [0.85, -0.52]]) { g.beginPath(); g.arc(x, y, 0.14, 0, TAU); g.fill(); }
    cut(g, paper, () => { for (const x of [-0.45, 0, 0.45]) { g.beginPath(); g.arc(x, 0.3, 0.1, 0, TAU); g.fill(); } });
  },
  druck(g, ink, paper) { // Drucktype: Klötzchen mit Buchstabe
    rr(g, -0.55, -0.8, 1.1, 1.6, 0.1);
    g.fillStyle = paper; g.font = 'bold 1.25px Georgia, serif'; g.textAlign = 'center'; g.textBaseline = 'alphabetic'; g.fillText('A', 0, 0.5);
  },
  schiff(g, ink, paper) {
    poly(g, [[-0.95, 0.25], [0.95, 0.25], [0.65, 0.7], [-0.6, 0.7]]);
    rr(g, -0.04, -0.85, 0.08, 1.1, 0.02);
    poly(g, [[0.12, -0.8], [0.8, 0.1], [0.12, 0.1]]); poly(g, [[-0.12, -0.55], [-0.7, 0.1], [-0.12, 0.1]]);
    poly(g, [[0.04, -0.85], [0.4, -0.7], [0.04, -0.58]]);
  },
  kartusche(g, ink, paper) {
    g.beginPath(); g.roundRect(-0.5, -0.82, 1.0, 1.64, 0.5); g.fill();
    cut(g, paper, () => { g.beginPath(); g.roundRect(-0.34, -0.66, 0.68, 1.32, 0.34); g.fill(); });
    g.fillStyle = ink; for (const y of [-0.38, 0, 0.38]) { g.beginPath(); g.ellipse(0, y, 0.15, 0.1, 0, 0, TAU); g.fill(); }
    rr(g, -0.7, 0.8, 1.4, 0.1, 0.04);
  },
  mond(g, ink, paper) {
    g.beginPath(); g.arc(0, 0.05, 0.78, 0, TAU); g.fill();
    cut(g, paper, () => { for (const [x, y, r] of [[-0.25, -0.1, 0.18], [0.28, 0.25, 0.14], [0.2, -0.38, 0.1]]) { g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); } });
    g.fillStyle = ink; rr(g, 0.38, -0.95, 0.06, 0.65, 0.02); poly(g, [[0.44, -0.95], [0.9, -0.82], [0.44, -0.68]]);
  },
  soldat(g, ink, paper) {
    g.beginPath(); g.arc(0, -0.38, 0.32, 0, TAU); g.fill();
    g.beginPath(); g.arc(0, -0.78, 0.12, 0, TAU); g.fill();
    g.beginPath(); g.moveTo(-0.75, 0.85); g.quadraticCurveTo(-0.7, 0.1, 0, 0.05); g.quadraticCurveTo(0.7, 0.1, 0.75, 0.85); g.closePath(); g.fill();
    cut(g, paper, () => { rr(g, -0.17, -0.45, 0.1, 0.08, 0.03); rr(g, 0.07, -0.45, 0.1, 0.08, 0.03); });
  },
  terrassen(g, ink, paper) {
    poly(g, [[-0.95, 0.75], [-0.6, 0.75], [-0.6, 0.45], [-0.3, 0.45], [-0.3, 0.15], [0, 0.15], [0, -0.15], [0.3, -0.15], [0.3, -0.45], [0.6, -0.45], [0.6, -0.75], [0.95, -0.75], [0.95, 0.75]]);
    cut(g, paper, () => { for (const y of [0.55, 0.25, -0.05, -0.35]) rr(g, -0.9, y - 0.02, 1.8, 0.04, 0.02); });
  },
  kobra(g, ink, paper) { // Uräus: aufgerichtete Kobra mit Haube
    g.beginPath(); g.moveTo(0, -0.95); g.quadraticCurveTo(0.2, -0.9, 0.22, -0.68); g.quadraticCurveTo(0.7, -0.45, 0.62, 0.0); g.quadraticCurveTo(0.5, 0.35, 0.16, 0.42); g.lineTo(-0.16, 0.42); g.quadraticCurveTo(-0.5, 0.35, -0.62, 0.0); g.quadraticCurveTo(-0.7, -0.45, -0.22, -0.68); g.quadraticCurveTo(-0.2, -0.9, 0, -0.95); g.fill();
    g.lineWidth = 0.3; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, 0.3); g.bezierCurveTo(0.55, 0.45, 0.45, 0.8, 0.0, 0.8); g.bezierCurveTo(-0.35, 0.8, -0.3, 0.55, 0, 0.62); g.stroke();
    cut(g, paper, () => { g.beginPath(); g.arc(-0.07, -0.72, 0.045, 0, TAU); g.fill(); g.beginPath(); g.ellipse(0, -0.1, 0.17, 0.3, 0, 0, TAU); g.fill(); });
  },
};
export function drawIcon(g, name, cx, cy, r, ink = '#3b2415', paper = '#f6efdc') {
  const f = ICONS[name]; if (!f) return;
  g.save(); g.translate(cx, cy); g.scale(r, r); g.fillStyle = ink; g.strokeStyle = ink; f(g, ink, paper); g.restore();
}
