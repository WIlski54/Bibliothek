// Echte Weltkarte aus Natural-Earth-Daten (gemeinfrei, 1:50 Mio., über das Paket world-atlas): src/data/world-50m.json.
// Zeichnet auf ein 2D-Canvas: Staaten (Atlas-Farben) oder Pergament-Stil, Gradnetz, Äquator/Wendekreise/Polarkreise, Beschriftungen.
//   drawWorld(g, w, h, opts)   opts: { proj:'equirect'|'robinson', style:'atlas'|'parchment', lon0,lon1,lat0,lat1 (nur equirect), grid:30, lines:true, labels:true, seed }
//   worldProject(w, h, opts) -> (lon, lat) => [x, y]   (für eigene Markierungen)
//   globeTexture({ w:2048, h:1024 }) -> THREE.CanvasTexture (gleichrechteckig, Länge -180..180 über die Breite; für SphereGeometry)
//   LAND_NAMES: nicht nötig; Staatsnamen stehen nicht auf der Karte (zu klein), nur Kontinente und Meere.
import * as THREE from 'three';
import { feature, neighbors, mesh } from 'topojson-client';
import topo from '../../data/world-50m.json';

const R2D = Math.PI / 180;
// Robinson-Tabelle (Breite 0..90 in 5°-Schritten): Längenfaktor und Abstand vom Äquator
const RX = [1, 0.9986, 0.9954, 0.99, 0.9822, 0.973, 0.96, 0.9427, 0.9216, 0.8962, 0.8679, 0.835, 0.7986, 0.7597, 0.7186, 0.6732, 0.6213, 0.5722, 0.5322];
const RY = [0, 0.062, 0.124, 0.186, 0.248, 0.31, 0.372, 0.434, 0.4958, 0.5571, 0.6176, 0.6769, 0.7346, 0.7903, 0.8435, 0.8936, 0.9394, 0.9761, 1];
const ROB_W = 0.8487 * Math.PI * 2, ROB_H = 1.3523 * 2; // Breite/Höhe der Robinson-Karte (Einheiten)
export const ROBINSON_ASPECT = ROB_W / ROB_H;
function robinson(lon, lat) {
  const a = Math.min(Math.abs(lat), 90) / 5, i = Math.min(Math.floor(a), 17), f = a - i;
  const px = RX[i] + (RX[i + 1] - RX[i]) * f, py = RY[i] + (RY[i + 1] - RY[i]) * f;
  return [0.8487 * px * lon * R2D, 1.3523 * py * Math.sign(lat || 1)];
}

export function worldProject(w, h, o = {}) {
  if (o.proj === 'robinson') return (lon, lat) => { const [x, y] = robinson(lon, lat); return [((x + ROB_W / 2) / ROB_W) * w, ((ROB_H / 2 - y) / ROB_H) * h]; };
  const lon0 = o.lon0 ?? -180, lon1 = o.lon1 ?? 180, lat0 = o.lat0 ?? -90, lat1 = o.lat1 ?? 90;
  return (lon, lat) => [((lon - lon0) / (lon1 - lon0)) * w, ((lat1 - lat) / (lat1 - lat0)) * h];
}

let DATA = null;
// Ringe/Linien, die den Längengrad ±180 überschreiten, entfalten (Längen laufen dann über ±180 hinaus); beim Zeichnen mit Versatz -360/0/+360 wiederholt
function unwrap(pts) {
  const out = new Array(pts.length); let off = 0, prev = pts[0][0], lo = Infinity, hi = -Infinity;
  for (let i = 0; i < pts.length; i++) { let lon = pts[i][0] + off; if (i) { while (lon - prev > 180) { off -= 360; lon -= 360; } while (lon - prev < -180) { off += 360; lon += 360; } } prev = lon; out[i] = [lon, pts[i][1]]; if (lon < lo) lo = lon; if (lon > hi) hi = lon; }
  out.lo = lo; out.hi = hi; return out;
}
function data() {
  if (DATA) return DATA;
  const countries = feature(topo, topo.objects.countries).features, nb = neighbors(topo.objects.countries.geometries);
  // Greedy-Färbung: benachbarte Staaten bekommen verschiedene Farben
  const col = new Array(countries.length).fill(-1), order = countries.map((_, i) => i).sort((a, b) => nb[b].length - nb[a].length);
  for (const i of order) { const used = new Set(nb[i].map((j) => col[j])); let c = 0; while (used.has(c)) c++; col[i] = c; }
  const rings = countries.map((f) => (f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates).flat().map(unwrap));
  DATA = { countries, rings, col, borders: mesh(topo, topo.objects.countries, (a, b) => a !== b).coordinates.map(unwrap), coast: mesh(topo, topo.objects.land).coordinates.map(unwrap) };
  return DATA;
}

const STYLES = {
  atlas: { sea: ['#3d82b8', '#2a679c'], land: ['#ecdca0', '#c3df9d', '#f0b992', '#d3b8e0', '#a9d9d0', '#f2c6c6', '#d9d9a0', '#b9cdee'], ice: '#f4f8fb', border: 'rgba(110,80,50,.75)', coast: '#3d3022', grid: 'rgba(255,255,255,.2)', line: 'rgba(255,230,150,.85)', label: 'rgba(255,255,255,.88)', labelLand: 'rgba(60,40,25,.75)', labelShadow: 'rgba(0,0,0,.35)' },
  parchment: { sea: ['#e6d29c', '#dcc68a'], land: ['#d3b36f', '#cfae68', '#d8ba7a', '#cdb070'], ice: '#efe3be', border: 'rgba(90,58,26,.45)', coast: '#4d3216', grid: 'rgba(90,58,26,.16)', line: 'rgba(125,38,38,.55)', label: 'rgba(90,58,26,.75)', labelLand: 'rgba(70,42,16,.8)', labelShadow: 'rgba(255,245,215,.6)' },
};
const LABELS = [
  ['Pazifischer Ozean', -150, 8, 1, 'sea'], ['Pazifischer Ozean', -128, -28, 1, 'sea'], ['Atlantischer Ozean', -35, 22, 1, 'sea'], ['Atlantischer Ozean', -22, -22, 1, 'sea'], ['Indischer Ozean', 78, -22, 1, 'sea'], ['Arktischer Ozean', 0, 83, 0.8, 'sea'], ['Südlicher Ozean', 50, -62, 0.9, 'sea'],
  ['Nordamerika', -102, 46, 1, 'land'], ['Südamerika', -60, -14, 1, 'land'], ['Europa', 16, 52, 0.7, 'land'], ['Afrika', 20, 3, 1, 'land'], ['Asien', 88, 50, 1.1, 'land'], ['Australien', 134, -25, 0.85, 'land'], ['Antarktis', 20, -80, 0.9, 'land'], ['Mittelmeer', 18, 34.5, 0.42, 'sea'],
];

export function drawWorld(g, w, h, o = {}) {
  const st = STYLES[o.style || 'atlas'], P = worldProject(w, h, o), D = data(), s = w / 2048; // Linienstärken relativ zu 2048 px Breite
  g.save();
  // Meer (bei Robinson nur innerhalb der Umrisslinie)
  const outline = new Path2D();
  if (o.proj === 'robinson') { for (let lat = -90; lat <= 90; lat += 3) { const [x, y] = P(-180, lat); lat === -90 ? outline.moveTo(x, y) : outline.lineTo(x, y); } for (let lat = 90; lat >= -90; lat -= 3) { const [x, y] = P(180, lat); outline.lineTo(x, y); } outline.closePath(); } else outline.rect(0, 0, w, h);
  g.clip(outline);
  const gr = g.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, st.sea[0]); gr.addColorStop(0.5, st.sea[1]); gr.addColorStop(1, st.sea[0]); g.fillStyle = gr; g.fillRect(0, 0, w, h);
  // Gradnetz
  const step = o.grid ?? 30; g.lineWidth = Math.max(1, 1.3 * s); g.strokeStyle = st.grid;
  if (step) { g.beginPath(); for (let lon = -180; lon <= 180; lon += step) { for (let lat = -90; lat <= 90; lat += 3) { const [x, y] = P(lon, lat); lat === -90 ? g.moveTo(x, y) : g.lineTo(x, y); } } for (let lat = -90 + step; lat < 90; lat += step) { for (let lon = -180; lon <= 180; lon += 4) { const [x, y] = P(lon, lat); lon === -180 ? g.moveTo(x, y) : g.lineTo(x, y); } } g.stroke(); }
  // Staaten (Ringe, die über ±180 hinausreichen, dreifach zeichnen)
  const offs = (r) => (r.lo < -180 ? [0, 360] : r.hi > 180 ? [0, -360] : [0]);
  const ring = (r, d) => { for (let i = 0; i < r.length; i++) { const [x, y] = P(r[i][0] + d, r[i][1]); i ? g.lineTo(x, y) : g.moveTo(x, y); } g.closePath(); };
  D.countries.forEach((f, i) => {
    g.beginPath(); for (const r of D.rings[i]) for (const d of offs(r)) ring(r, d);
    g.fillStyle = f.properties.name === 'Antarctica' ? st.ice : st.land[D.col[i] % st.land.length]; g.fill('evenodd');
  });
  // Antarktis reicht in den Daten nicht ganz bis zum Pol: Streifen auffüllen
  { const [x0, y0] = P(-180, -84.2), [, y1] = P(-180, -90.5); if (o.proj !== 'robinson') { g.fillStyle = st.ice; g.fillRect(0, y0, w, y1 - y0 + 2); } }
  const lines = (list, style, lw) => {
    g.beginPath();
    for (const ls of list) for (const d of offs(ls)) { let pen = false; for (let i = 0; i < ls.length; i++) { const a = ls[i - 1], b = ls[i]; const skip = a && ((Math.abs(a[0] - b[0]) < 1e-6 && Math.abs(b[0]) >= 179.99) || (Math.abs(a[1] - b[1]) < 0.01 && b[1] < -84 && Math.abs(a[0] - b[0]) > 20)); const [x, y] = P(b[0] + d, b[1]); if (!pen || skip) g.moveTo(x, y); else g.lineTo(x, y); pen = true; } }
    g.strokeStyle = style; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke();
  };
  lines(D.borders, st.border, Math.max(0.6, 1.1 * s)); lines(D.coast, st.coast, Math.max(0.8, 1.7 * s));
  // Äquator, Wendekreise, Polarkreise
  if (o.lines !== false) {
    g.setLineDash([10 * s, 8 * s]); g.strokeStyle = st.line; g.lineWidth = Math.max(1, 2 * s);
    for (const lat of [0, 23.44, -23.44, 66.56, -66.56]) { g.beginPath(); for (let lon = -180; lon <= 180; lon += 3) { const [x, y] = P(lon, lat); lon === -180 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke(); }
    g.setLineDash([]);
  }
  // Beschriftung
  if (o.labels !== false) {
    g.textAlign = 'center'; g.textBaseline = 'middle';
    for (const [t, lon, lat, k, kind] of LABELS) {
      const [x, y] = P(lon, lat); if (x < -50 || x > w + 50 || y < -20 || y > h + 20) continue;
      const fs = Math.round(h * 0.034 * k * (o.labelScale ?? 1)); g.font = `${kind === 'sea' ? 'italic' : 'bold'} ${fs}px Georgia, "Times New Roman", serif`;
      g.fillStyle = kind === 'sea' ? st.label : st.labelLand; g.shadowColor = st.labelShadow; g.shadowBlur = fs * 0.12; g.fillText(t, x, y); g.shadowBlur = 0;
    }
    if (o.lines !== false) { g.font = `italic ${Math.round(h * 0.022)}px Georgia, serif`; g.fillStyle = st.line; g.textAlign = 'left'; for (const [t, lat] of [['Äquator', 0], ['Wendekreis des Krebses', 23.44], ['Wendekreis des Steinbocks', -23.44], ['Nördlicher Polarkreis', 66.56], ['Südlicher Polarkreis', -66.56]]) { const [x, y] = P(-176, lat); g.fillText(t, x + 4 * s + (o.proj === 'robinson' ? 40 * s : 0), y - h * 0.014); } }
  }
  g.restore();
}

let globeMap = null;
export function globeTexture({ w = 2048, h = 1024 } = {}) {
  if (globeMap) return globeMap;
  const c = document.createElement('canvas'); c.width = w; c.height = h; drawWorld(c.getContext('2d'), w, h, { proj: 'equirect', style: 'atlas', grid: 30, lines: true, labels: true });
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8; t.wrapS = THREE.RepeatWrapping; return (globeMap = t);
}
