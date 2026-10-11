// Kleine Zusatzlagen: Schnurrhaare, Bodenschatten, „Zzz“, Glühbirne („Heureka“), Ausrufe- und Fragezeichen.
// Alle Texturen werden einmal gemalt und geteilt.
import * as THREE from 'three';

const cache = new Map();
function mk(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function tex(c) { const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; }
function once(key, fn) { if (!cache.has(key)) cache.set(key, fn()); return cache.get(key); }
const noRay = (m) => { m.raycast = () => {}; return m; };

// ---- Schnurrhaare: 'front' = beide Seiten symmetrisch (Plane 0.5 x 0.125 m), 'side' = nach rechts (0.26 x 0.13 m)
export function whiskerTexture(kind) {
  return once('wh' + kind, () => {
    const front = kind === 'front', [c, g] = front ? mk(512, 128) : mk(256, 128);
    g.lineCap = 'round';
    const stroke = (pts, w, col) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); g.moveTo(...pts[0]); g.quadraticCurveTo(...pts[1], ...pts[2]); g.stroke(); };
    const wh = (x0, y0, x1, y1, bend) => { const p = [[x0, y0], [(x0 + x1) / 2, (y0 + y1) / 2 + bend], [x1, y1]]; stroke(p, 7, 'rgba(40,30,50,.45)'); stroke(p, 3.6, 'rgba(255,253,244,.98)'); };
    if (front) for (const s of [-1, 1]) for (const [dy, ey, b] of [[-6, -26, -6], [4, -3, -2], [12, 22, 4]]) wh(256 + s * 52, 64 + dy, 256 + s * 196, 64 + ey, b);
    else for (const [dy, ey, b] of [[-6, -28, -8], [4, -2, -3], [12, 24, 3]]) wh(20, 64 + dy, 200, 64 + ey, b);
    return tex(c);
  });
}
export function whiskerMesh(kind) {
  const front = kind === 'front';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(front ? 0.5 : 0.26, front ? 0.125 : 0.13), new THREE.MeshBasicMaterial({ map: whiskerTexture(kind), transparent: true, depthWrite: false, toneMapped: true, color: 0xe8e4de }));
  m.name = 'whiskers'; m.renderOrder = 5; return noRay(m);
}

// ---- Bodenschatten (weicher dunkler Fleck)
export function shadowMesh() {
  const t = once('shadow', () => {
    const [c, g] = mk(128, 128); const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62);
    gr.addColorStop(0, 'rgba(20,10,10,.62)'); gr.addColorStop(0.55, 'rgba(20,10,10,.32)'); gr.addColorStop(1, 'rgba(20,10,10,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128); return tex(c);
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), new THREE.MeshBasicMaterial({ map: t, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.rotation.x = -Math.PI / 2; m.name = 'shadow'; m.renderOrder = 1; return noRay(m);
}

// ---- Symbole als Papierausschnitt: z, bulb, excl, quest
function symbolTexture(kind) {
  return once('sym' + kind, () => {
    const [c, g] = mk(160, 192);
    g.lineJoin = 'round'; g.lineCap = 'round';
    const paperOutline = (path, fill, lw = 12) => { // weißer Papierrand + Füllung + dünne Kontur
      g.save(); g.shadowColor = 'rgba(30,20,10,.45)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.strokeStyle = '#fbf6e6'; g.lineWidth = lw; g.stroke(path); g.restore();
      g.fillStyle = fill; g.fill(path); g.strokeStyle = 'rgba(40,30,40,.55)'; g.lineWidth = 2; g.stroke(path);
    };
    if (kind === 'z') {
      const p = new Path2D(); p.moveTo(34, 52); p.lineTo(126, 52); p.lineTo(126, 70); p.lineTo(66, 128); p.lineTo(128, 128); p.lineTo(128, 148); p.lineTo(32, 148); p.lineTo(32, 130); p.lineTo(92, 70); p.lineTo(34, 70); p.closePath();
      paperOutline(p, '#9db4ee');
    } else if (kind === 'bulb') {
      // Strahlen
      g.strokeStyle = '#ffd24a'; g.lineWidth = 7;
      for (let i = 0; i < 7; i++) { const a = -Math.PI + (i / 6) * Math.PI; g.beginPath(); g.moveTo(80 + Math.cos(a) * 58, 78 + Math.sin(a) * 58); g.lineTo(80 + Math.cos(a) * 74, 78 + Math.sin(a) * 74); g.stroke(); }
      const bulb = new Path2D(); bulb.arc(80, 82, 38, 0, Math.PI * 2); bulb.moveTo(62, 110); bulb.lineTo(98, 110); bulb.lineTo(94, 136); bulb.lineTo(66, 136); bulb.closePath();
      g.save(); g.shadowColor = 'rgba(30,20,10,.45)'; g.shadowBlur = 8; g.shadowOffsetY = 3; g.strokeStyle = '#fbf6e6'; g.lineWidth = 12; g.stroke(bulb); g.restore();
      const gr = g.createRadialGradient(70, 72, 4, 80, 82, 44); gr.addColorStop(0, '#fffbc8'); gr.addColorStop(1, '#ffd34a'); g.fillStyle = gr; g.fill(bulb);
      g.strokeStyle = 'rgba(120,80,20,.6)'; g.lineWidth = 2; g.stroke(bulb);
      g.strokeStyle = '#c98a1c'; g.lineWidth = 3; g.beginPath(); g.moveTo(70, 100); g.lineTo(76, 84); g.lineTo(84, 98); g.lineTo(90, 84); g.stroke();
      g.fillStyle = '#7b8696'; g.fillRect(64, 138, 32, 8); g.fillRect(68, 148, 24, 8); g.strokeStyle = '#fbf6e6'; g.lineWidth = 2; g.strokeRect(64, 138, 32, 8);
    } else if (kind === 'excl') {
      const p = new Path2D(); p.moveTo(64, 30); p.quadraticCurveTo(80, 22, 96, 30); p.lineTo(90, 116); p.quadraticCurveTo(80, 124, 70, 116); p.closePath(); p.moveTo(80, 134); p.arc(80, 148, 14, 0, Math.PI * 2);
      paperOutline(p, '#e8503c', 12);
    } else if (kind === 'quest') {
      const p = new Path2D(); p.moveTo(46, 66); p.bezierCurveTo(40, 22, 120, 20, 116, 66); p.bezierCurveTo(114, 90, 92, 92, 90, 116); p.lineTo(70, 116); p.bezierCurveTo(70, 84, 94, 82, 96, 66); p.bezierCurveTo(98, 46, 66, 44, 66, 66); p.closePath(); p.moveTo(80, 134); p.arc(80, 148, 14, 0, Math.PI * 2);
      paperOutline(p, '#4f9fe0', 12);
    }
    return tex(c);
  });
}
export function symbolMesh(kind, size = 0.12) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size * 1.2), new THREE.MeshBasicMaterial({ map: symbolTexture(kind), transparent: true, depthWrite: false, toneMapped: false }));
  m.name = 'sym-' + kind; m.renderOrder = 6; m.userData.kind = kind; return noRay(m);
}
export function setSymbol(mesh, kind) { mesh.material.map = symbolTexture(kind); mesh.userData.kind = kind; }
