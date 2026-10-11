// Das große Periodensystem als Wandtafel: Canvas 2048x1024, alle 118 Elemente, Antippen per tap.resolve(hit) (UV -> Feld),
// Hervorhebung des angetippten Feldes (Canvas wird nur beim Tippen neu gezeichnet), Legende zum Antippen (hebt eine ganze Kategorie hervor).
import * as THREE from 'three';
import { ELEMENTS, BY_Z, CATS, PLACEHOLDERS, elementCard, massText } from '../../../data/elements.js';
import { Batch, canvas, texOf, signMesh } from './util.js';
import { M } from '../../kit.js';

export const PSE_W = 2048, PSE_H = 1024;
const X0 = 66, Y0 = 72, CW = (PSE_W - X0 - 22) / 18, CH = 100, FGAP = 26;
const cellRect = (col, row) => ({ x: X0 + (col - 1) * CW, y: Y0 + (row <= 7 ? (row - 1) * CH : 7 * CH + FGAP + (row - 8) * CH), w: CW, h: CH });
const SANS = 'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';
const SERIF = 'Georgia, "Times New Roman", serif';
const STATE_COL = { f: '#171717', l: '#0a45d0', g: '#b3121c', u: '#6a6a6a' };
const ROMAN = { 1: 'I', 2: 'II', 13: 'III', 14: 'IV', 15: 'V', 16: 'VI', 17: 'VII', 18: 'VIII' };
const CAT_ORDER = ['ak', 'ea', 'ub', 'um', 'hm', 'nm', 'hg', 'eg', 'la', 'ac'];

const CAT_TEXT = {
  ak: { sub: 'Gruppe 1 ohne Wasserstoff: Lithium, Natrium, Kalium, Rubidium, Caesium, Francium', paras: ['Alkalimetalle sind weiche, silbrig glänzende Metalle. Man kann sie mit dem Messer schneiden.', 'Sie reagieren heftig mit Wasser und mit Luft. Deshalb bewahrt man sie unter Öl auf.'], fact: 'Alkalimetalle färben die Flamme: Lithium rot, Natrium gelb, Kalium violett.' },
  ea: { sub: 'Gruppe 2: Beryllium, Magnesium, Calcium, Strontium, Barium, Radium', paras: ['Erdalkalimetalle sind härter als die Alkalimetalle. Auch sie reagieren gern, aber nicht ganz so heftig.', 'Calcium und Magnesium sind wichtige Mineralstoffe für deinen Körper.'], fact: 'In Feuerwerk färbt Strontium rot und Barium grün.' },
  ub: { sub: 'Gruppen 3 bis 12: zum Beispiel Eisen, Kupfer, Silber, Gold, Zink', paras: ['Übergangsmetalle sind meist hart, glänzen und leiten den Strom gut. Viele schmelzen erst bei hohen Temperaturen.', 'Ihre Verbindungen sind oft bunt, zum Beispiel blaue Kupfersalze oder die violette Kaliumpermanganat-Lösung.'], fact: 'Quecksilber ist das einzige Metall, das bei Zimmertemperatur flüssig ist.' },
  um: { sub: 'Hauptgruppen 13 bis 16: zum Beispiel Aluminium, Zinn, Blei, Bismut', paras: ['Diese Metalle stehen rechts neben den Übergangsmetallen. Sie sind meist weicher und schmelzen leichter.'], fact: 'Aluminium ist das häufigste Metall der Erdkruste.', src: 'Die Elemente 113 bis 116 (Nihonium bis Livermorium) sind nach ihrer Stellung im Periodensystem hier eingeordnet; ihre Eigenschaften sind kaum untersucht.' },
  hm: { sub: 'Bor, Silicium, Germanium, Arsen, Antimon, Tellur', paras: ['Halbmetalle haben Eigenschaften von Metallen und von Nichtmetallen. Manche leiten den Strom nur ein wenig.', 'Silicium ist als Halbleiter die Grundlage von Computerchips.'], fact: 'Sand besteht großenteils aus Siliciumdioxid.', src: 'Die Einteilung der Halbmetalle wird in Büchern leicht unterschiedlich gehandhabt; hier sind die sechs üblichen Elemente gefärbt.' },
  nm: { sub: 'Wasserstoff, Kohlenstoff, Stickstoff, Phosphor, Sauerstoff, Schwefel, Selen', paras: ['Nichtmetalle leiten den Strom meist schlecht. Als Feststoffe sind sie oft spröde, viele sind Gase.'], fact: 'Lebewesen bestehen überwiegend aus Kohlenstoff, Wasserstoff, Sauerstoff und Stickstoff.' },
  hg: { sub: 'Gruppe 17: Fluor, Chlor, Brom, Iod, Astat, Tenness', paras: ['Halogene sind sehr reaktionsfreudig. Das Wort bedeutet „Salzbildner“: Mit Metallen bilden sie Salze, zum Beispiel Natriumchlorid.'], fact: 'Bei Zimmertemperatur ist Chlor ein Gas, Brom eine Flüssigkeit und Iod ein Feststoff.' },
  eg: { sub: 'Gruppe 18: Helium, Neon, Argon, Krypton, Xenon, Radon, Oganesson', paras: ['Edelgase reagieren fast gar nicht mit anderen Stoffen. Sie kommen als einzelne Atome vor.', 'Man füllt sie in Leuchtröhren und Ballons.'], fact: 'Argon macht knapp 1 % der Luft aus.' },
  la: { sub: 'Lanthan bis Lutetium, Ordnungszahlen 57 bis 71', paras: ['Lanthanoide sind silbrige Metalle, die einander sehr ähnlich sind. Sie stehen abgesetzt unter der Tafel, damit diese nicht zu breit wird.', 'Zusammen mit Scandium und Yttrium nennt man sie auch „Seltene Erden“.'], fact: 'Neodym-Magnete, etwa in Kopfhörern, enthalten ein Lanthanoid.' },
  ac: { sub: 'Actinium bis Lawrencium, Ordnungszahlen 89 bis 103', paras: ['Alle Actinoide sind radioaktiv. Uran und Thorium findet man in der Natur, die schwereren stellt man künstlich her.'], fact: 'Viele Rauchmelder enthalten Americium, ein Actinoid.' },
};

export function createPeriodicTable({ ctx, station = 'chemie-periodensystem', w = 4.2 }) {
  const [cv, g] = canvas(PSE_W, PSE_H), tex = texOf(cv, { aniso: 8 }); tex.generateMipmaps = true; tex.minFilter = THREE.LinearMipmapLinearFilter;
  const zones = []; // Trefferflächen in Canvas-Pixeln
  let selZ = 0, selCat = null;

  const rr = (x, y, w2, h2, r) => { g.beginPath(); g.roundRect(x, y, w2, h2, r); };
  const fit = (txt, font, maxW) => { let s = parseInt(font.match(/(\d+)px/)[1]); g.font = font; while (g.measureText(txt).width > maxW && s > 9) { s -= 1; g.font = font.replace(/\d+px/, s + 'px'); } };
  function drawCell(rect, { cat, sym, num, name, state, label, dim, hi }) {
    const c = CATS[cat].col, { x, y, w: cw, h: ch } = rect, ins = 3;
    g.save(); if (dim) g.globalAlpha = 0.28;
    const grad = g.createLinearGradient(0, y, 0, y + ch); grad.addColorStop(0, shade(c, 1.1)); grad.addColorStop(1, shade(c, 0.86));
    g.fillStyle = grad; rr(x + ins, y + ins, cw - 2 * ins, ch - 2 * ins, 9); g.fill();
    g.strokeStyle = 'rgba(0,0,0,.3)'; g.lineWidth = 2; g.stroke();
    g.fillStyle = 'rgba(255,255,255,.28)'; rr(x + ins + 6, y + ins + 4, cw - 2 * ins - 12, 5, 2.5); g.fill();
    g.textAlign = 'left'; g.fillStyle = '#222'; g.font = `bold 23px ${SANS}`; if (num != null) g.fillText(String(num), x + 11, y + 29);
    g.textAlign = 'center'; g.fillStyle = STATE_COL[state] || '#171717'; g.font = `bold 52px ${SANS}`; if (sym) g.fillText(sym, x + cw / 2, y + 71);
    if (label) { g.fillStyle = '#222'; g.font = `bold 34px ${SANS}`; g.fillText(label, x + cw / 2, y + 60); g.font = `20px ${SANS}`; g.fillText(label === '57–71' ? 'Lanthanoide' : 'Actinoide', x + cw / 2, y + 86); }
    if (name) { g.fillStyle = '#1e1e1e'; fit(name, `16px ${SANS}`, cw - 10); g.fillText(name, x + cw / 2, y + 92); }
    g.restore();
    if (hi) { // Hervorhebung: größerer weißer Rahmen mit Leuchten
      g.save(); g.shadowColor = '#fff3b0'; g.shadowBlur = 26; g.strokeStyle = '#ffffff'; g.lineWidth = 7; rr(x + 1, y + 1, cw - 2, ch - 2, 11); g.stroke(); g.restore();
    }
  }
  const shade = (hex, k) => { const c = new THREE.Color(hex); c.multiplyScalar(k); return '#' + c.getHexString(); };

  function draw() {
    zones.length = 0;
    const bg = g.createLinearGradient(0, 0, 0, PSE_H); bg.addColorStop(0, '#20353b'); bg.addColorStop(1, '#14242a'); g.fillStyle = bg; g.fillRect(0, 0, PSE_W, PSE_H);
    g.strokeStyle = 'rgba(232,193,94,.55)'; g.lineWidth = 4; g.strokeRect(8, 8, PSE_W - 16, PSE_H - 16);
    // Gruppenzahlen oben (IUPAC) und römische Hauptgruppen, Periodenzahlen links
    g.textAlign = 'center'; for (let c = 1; c <= 18; c++) { const r = cellRect(c, 1); g.fillStyle = '#f3e7c4'; g.font = `bold 27px ${SANS}`; g.fillText(String(c), r.x + CW / 2, Y0 - 12); if (ROMAN[c]) { g.fillStyle = '#9fc9c6'; g.font = `italic 17px ${SERIF}`; g.fillText(ROMAN[c], r.x + CW / 2, Y0 - 40); } }
    g.fillStyle = '#9fc9c6'; g.font = `italic 17px ${SERIF}`; g.textAlign = 'right'; g.fillText('Hauptgruppe', X0 - 6 + 3 * CW + 2, 22); g.textAlign = 'center';
    for (let p = 1; p <= 7; p++) { const r = cellRect(1, p); g.fillStyle = '#f3e7c4'; g.font = `bold 27px ${SANS}`; g.fillText(String(p), X0 / 2 - 4, r.y + CH / 2 + 10); }
    g.save(); g.translate(18, Y0 + 3.5 * CH); g.rotate(-Math.PI / 2); g.fillStyle = '#9fc9c6'; g.font = `italic 19px ${SERIF}`; g.fillText('Periode', 0, 0); g.restore();
    g.fillStyle = '#f3e7c4'; g.font = `bold 17px ${SANS}`; g.fillText('Gruppe', X0 / 2 + 1, Y0 - 12);

    const dimAll = (e) => selCat && e.cat !== selCat;
    for (const e of ELEMENTS) { const r = cellRect(e.col, e.row); drawCell(r, { cat: e.cat, sym: e.sym, num: e.z, name: e.name, state: e.state, dim: dimAll(e) }); zones.push({ ...r, kind: 'el', z: e.z }); }
    PLACEHOLDERS.forEach((p) => { const r = cellRect(p.col, p.row); drawCell(r, { cat: p.cat, label: p.label, dim: selCat && p.cat !== selCat }); zones.push({ ...r, kind: 'cat', cat: p.cat }); });
    // Zeilenbeschriftung der abgesetzten Zeilen
    for (const [row, cat, txt] of [[8, 'la', 'Lanthanoide'], [9, 'ac', 'Actinoide']]) {
      const r = cellRect(1, row), wd = CW * 3 - 12; g.save(); if (selCat && selCat !== cat) g.globalAlpha = 0.28; g.fillStyle = CATS[cat].col; rr(r.x + 4, r.y + 14, wd, CH - 28, 10); g.fill(); g.fillStyle = '#1e1e1e'; g.textAlign = 'center'; g.font = `bold 27px ${SANS}`; g.fillText(txt, r.x + 4 + wd / 2, r.y + 44); g.font = `19px ${SANS}`; g.fillText(row === 8 ? '57 bis 71' : '89 bis 103', r.x + 4 + wd / 2, r.y + 72); g.restore();
      zones.push({ x: r.x + 4, y: r.y + 14, w: wd, h: CH - 28, kind: 'cat', cat });
    }
    // Titel und Legende in der Lücke über den Übergangsmetallen
    const lx = X0 + 2 * CW + 14;
    g.textAlign = 'left'; g.fillStyle = '#f6e7b8'; g.font = `italic 600 36px ${SERIF}`; g.fillText('Tippe ein Feld oder eine Farbe an', lx, Y0 + 52);
    const rows = 5, ly0 = Y0 + 112, step = 34, colW = 5.1 * CW;
    CAT_ORDER.forEach((cat, i) => {
      const cx = lx + Math.floor(i / rows) * colW, cy = ly0 + (i % rows) * step - 20;
      g.save(); if (selCat && selCat !== cat) g.globalAlpha = 0.35; g.fillStyle = CATS[cat].col; rr(cx, cy, 46, 26, 6); g.fill(); g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 2; g.stroke(); g.fillStyle = '#f3ecd6'; g.font = `24px ${SANS}`; g.fillText(CATS[cat].name, cx + 58, cy + 22); g.restore();
      zones.push({ x: cx - 4, y: cy - 4, w: colW - 20, h: 34, kind: 'cat', cat });
    });
    // Zustandslegende (Symbolfarbe), rechts in der obersten Zeile
    const sx = X0 + 11.4 * CW, sy = Y0 + 30; g.fillStyle = '#f3ecd6'; g.font = `italic 21px ${SERIF}`; g.textAlign = 'left'; g.fillText('Farbe des Symbols bei 25 °C:', sx, sy - 6);
    [['f', 'fest'], ['l', 'flüssig'], ['g', 'gasförmig'], ['u', 'nicht bekannt']].forEach(([s, t], i) => {
      const bx = sx + (i % 2) * 3.1 * CW, by = sy + 24 + Math.floor(i / 2) * 36;
      g.fillStyle = '#d8d0b8'; rr(bx, by - 22, 40, 30, 6); g.fill(); g.fillStyle = STATE_COL[s]; g.font = `bold 24px ${SANS}`; g.textAlign = 'center'; g.fillText('Xy', bx + 20, by + 2);
      g.fillStyle = '#f3ecd6'; g.font = `23px ${SANS}`; g.textAlign = 'left'; g.fillText(t, bx + 52, by + 2);
    });
    // gewähltes Feld / gewählte Kategorie zuletzt (liegt über den Nachbarn)
    if (selCat) { for (const e of ELEMENTS) if (e.cat === selCat) drawOutline(cellRect(e.col, e.row)); PLACEHOLDERS.forEach((p) => { if (p.cat === selCat) drawOutline(cellRect(p.col, p.row)); }); }
    if (selZ) { g.fillStyle = 'rgba(8,16,20,.42)'; g.fillRect(10, 10, PSE_W - 20, PSE_H - 20); }   // Scheinwerfer: alles andere wird gedämpft
    if (selZ) { const e = BY_Z(selZ), r = cellRect(e.col, e.row), k = 1.38, big = { x: r.x - (r.w * (k - 1)) / 2, y: r.y - (r.h * (k - 1)) / 2, w: r.w * k, h: r.h * k }; drawCell(big, { cat: e.cat, sym: e.sym, num: e.z, name: e.name, state: e.state, hi: true }); }
    tex.needsUpdate = true;
  }
  function drawOutline(r) { g.save(); g.strokeStyle = '#ffffff'; g.lineWidth = 5; rr(r.x + 2, r.y + 2, r.w - 4, r.h - 4, 10); g.stroke(); g.restore(); }

  // ---------- Karten
  function tileImage(e) {
    const [c, k] = canvas(360, 360), col = CATS[e.cat].col; const gr = k.createLinearGradient(0, 0, 0, 360); gr.addColorStop(0, shade(col, 1.12)); gr.addColorStop(1, shade(col, 0.84)); k.fillStyle = gr; k.fillRect(0, 0, 360, 360);
    k.strokeStyle = 'rgba(0,0,0,.35)'; k.lineWidth = 8; k.strokeRect(4, 4, 352, 352); k.fillStyle = 'rgba(255,255,255,.25)'; k.fillRect(14, 14, 332, 10);
    k.fillStyle = '#222'; k.textAlign = 'left'; k.font = `bold 52px ${SANS}`; k.fillText(String(e.z), 28, 84);
    k.textAlign = 'center'; k.fillStyle = STATE_COL[e.state]; k.font = `bold ${e.sym.length > 1 ? 150 : 170}px ${SANS}`; k.fillText(e.sym, 180, 218);
    k.fillStyle = '#1e1e1e'; k.font = `bold 38px ${SANS}`; const nm = e.name; k.font = `bold ${nm.length > 11 ? 30 : 38}px ${SANS}`; k.fillText(nm, 180, 280);
    const mt = massText(e); k.font = `28px ${SANS}`; k.fillStyle = '#333'; k.fillText(mt == null ? '' : (typeof e.mass === 'string' ? e.mass : mt + ' u'), 180, 324);
    return c;
  }
  const nav = (z) => [
    z > 1 ? { label: '‹ ' + BY_Z(z - 1).sym, fn: () => show(z - 1) } : null, z < 118 ? { label: BY_Z(z + 1).sym + ' ›', fn: () => show(z + 1) } : null,
  ].filter(Boolean);
  function cardFor(z) { const d = elementCard(z, { image: tileImage }); d.actions = nav(z); d.station = station; return d; }
  function catCard(cat) {
    const c = CATS[cat], t = CAT_TEXT[cat]; const els = ELEMENTS.filter((e) => e.cat === cat);
    const [cvs, k] = canvas(360, 200); k.fillStyle = '#20353b'; k.fillRect(0, 0, 360, 200);
    const n = els.length, cols = Math.min(n, n > 20 ? 8 : 6), rowsN = Math.ceil(n / cols), cs = Math.min(52, 340 / cols), x0 = 180 - (cols * cs) / 2, y0 = 100 - (rowsN * cs) / 2;
    els.forEach((e, i) => { const x = x0 + (i % cols) * cs, y = y0 + Math.floor(i / cols) * cs; k.fillStyle = c.col; k.fillRect(x + 2, y + 2, cs - 4, cs - 4); k.fillStyle = STATE_COL[e.state]; k.textAlign = 'center'; k.font = `bold ${Math.round(cs * 0.4)}px ${SANS}`; k.fillText(e.sym, x + cs / 2, y + cs * 0.64); });
    return { kind: 'info', tag: 'Chemie', dept: 'chemie', title: c.name, sub: t.sub, paras: t.paras, fact: t.fact, factLabel: 'Wusstest du? ', image: cvs, alt: c.name + ' im Periodensystem', src: t.src, station, label: c.name };
  }
  function show(z) { selZ = z; selCat = null; draw(); ctx.ui.openCard(cardFor(z)); }

  // ---------- Antippen
  const hitCard = (hit) => {
    if (!hit?.uv) return null;
    const far = hit.hit && hit.hit.distance > 4.3; // aus der Ferne erst hinfahren, dann gezielt tippen
    if (far) return { kind: 'goto', station, label: 'Periodensystem' };
    const px = hit.uv.x * PSE_W, py = (1 - hit.uv.y) * PSE_H;
    const z = zones.find((q) => px >= q.x && px <= q.x + q.w && py >= q.y && py <= q.y + q.h);
    if (!z) return null;
    if (z.kind === 'el') { selZ = z.z; selCat = null; draw(); return cardFor(z.z); }
    selZ = 0; selCat = z.cat; draw(); return catCard(z.cat);
  };

  draw();
  const board = new THREE.Mesh(new THREE.PlaneGeometry(w, w / 2), new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.42, roughness: 0.55, metalness: 0 }));
  board.name = 'periodensystem'; board.userData.tap = { resolve: hitCard, label: 'Periodensystem – tippe ein Feld an' };
  board.userData.pse = { cellRect, W: PSE_W, H: PSE_H, w, h: w / 2, zones };   // für Tests: Feldlage in Canvas-Pixeln
  return { board, tex, zones, show, cardFor, catCard, select: (z) => { selZ = z; selCat = null; draw(); }, cellRect, width: w, height: w / 2 };
}

// Holzrahmen mit Messingleiste, Kopfschild und Ablage (nur Optik)
export function makePseFrame(w = 4.2) {
  const grp = new THREE.Group(), b = new Batch(), wood = M.wood(0x3a2214, { planks: 1 }), brass = M.brass(), h = w / 2, f = 0.13;
  b.box(wood, w + 2 * f, f, 0.12, 0, h / 2 + f / 2, 0.03); b.box(wood, w + 2 * f, f, 0.12, 0, -h / 2 - f / 2, 0.03);
  b.box(wood, f, h, 0.12, -w / 2 - f / 2, 0, 0.03); b.box(wood, f, h, 0.12, w / 2 + f / 2, 0, 0.03);
  b.box(brass, w + 0.02, 0.02, 0.02, 0, h / 2 + 0.01, 0.1); b.box(brass, w + 0.02, 0.02, 0.02, 0, -h / 2 - 0.01, 0.1); b.box(brass, 0.02, h, 0.02, -w / 2 - 0.01, 0, 0.1); b.box(brass, 0.02, h, 0.02, w / 2 + 0.01, 0, 0.1);
  b.box(wood, w + 0.5, 0.06, 0.16, 0, -h / 2 - f - 0.03, 0.08); // Ablage / Kreideleiste
  grp.add(b.build({ name: 'pse-rahmen' }));
  const head = signMesh('Periodensystem der Elemente', 2.9, 0.36, { bg: '#2d1c0e', fg: '#f6dc8a', font: 'bold 62px Georgia, serif', px: 1024 }); head.position.set(0, h / 2 + f + 0.34, 0.075); grp.add(head);
  return grp;
}
