// Die große Bibliothek: Einstieg. Renderer, Eingabe (Ziehen, Zoomen, Antippen), Kamerafahrt, Oberfläche.
import * as THREE from 'three';
import booksJson from './data/books.json';
import { loadBooks } from './world/books.js';
import { Rig } from './world/nav.js';
import { World } from './world/world.js';
import { UI } from './ui/ui.js';
import { clamp } from './lib/util.js';

const qs = new URLSearchParams(location.search);
const touchDevice = matchMedia('(pointer:coarse)').matches || 'ontouchstart' in window;
const TIERS = { low: { pr: 1, aa: false }, mid: { pr: 1.5, aa: true }, high: { pr: 2, aa: true } };
let tierName = qs.get('q') || (touchDevice ? 'mid' : 'high'); if (!TIERS[tierName]) tierName = 'mid';
let tierLocked = qs.has('q'), calm = matchMedia('(prefers-reduced-motion: reduce)').matches || qs.has('calm');

const books = loadBooks(booksJson);
const counts = {}; for (const d of ['geschichte', 'biologie', 'chemie']) { const mine = books.filter((b) => b.department === d); const done = mine.filter((b) => b.status === 'fertig').length; counts[d] = done ? `${done} Buch${done > 1 ? 'er' : ''}, ${mine.length - done} bald` : `${mine.length} bald`; }

const canvas = document.getElementById('gl');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: TIERS[tierName].aa, powerPreference: 'high-performance' });
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.0;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1.6, 0.05, 80);
const rig = new Rig(camera);
rig.calm = calm;

const ctx = { books, counts };
const world = new World(renderer, scene, rig, ctx);
let ui;
let paused = qs.has('manual');

function size() {
  const w = innerWidth, h = innerHeight; renderer.setPixelRatio(Math.min(devicePixelRatio || 1, TIERS[tierName].pr)); renderer.setSize(w, h, false); rig.resize(w, h);
}
addEventListener('resize', size); size();

// ---------------------------------------------------------------- Navigation
const roomEntry = { foyer: 'foyer-eingang', geschichte: 'geschichte-eingang', biologie: 'biologie-eingang', chemie: 'chemie-eingang' };
function roomOf(id) { return rig.stations.get(id)?.room; }
function goStation(id, onDone) {
  const st = rig.stations.get(id); if (!st) return; if (rig.moving) return;
  ui.setWhere(st.room, st.name); ui.hush();
  rig.goTo(id, { onDone });
}
function goRoom(r) {
  // Rückweg aus einem Fachraum ins Foyer endet an der Tür, durch die man kam
  if (r === 'foyer' && ['geschichte', 'biologie', 'chemie'].includes(rig.room)) return goStation(`foyer-tuer-${rig.room}`);
  goStation(roomEntry[r]);
}
function step(dir) {
  if (rig.moving) return; const list = rig.roomStations(rig.room); if (list.length < 2) return;
  const i = Math.max(0, list.findIndex((s) => s.id === rig.cur)); goStation(list[(i + dir + list.length) % list.length].id);
}
rig.onArrive = (id, st) => { ui.setWhere(st.room, st.name); window.__arrived = id; world.cat?.arrive(id); };

// ---------------------------------------------------------------- Antippen
function handleTap(tap) {
  if (!tap) return;
  const act = () => {
    switch (tap.kind) {
      case 'book': ui.openCard({ kind: 'book', book: tap.book }); break;
      case 'info': ui.openCard(tap); break;
      case 'nav': goRoom(tap.to); break;
      case 'goto': if (rig.cur !== tap.station) goStation(tap.station); break;
      case 'cat': world.cat?.poke(); break;
      case 'say': ui.say(tap.text, tap.who ? { who: tap.who } : {}); break;
      default: if (tap.title) ui.openCard(tap);
    }
  };
  if (tap.station && tap.kind !== 'goto' && tap.kind !== 'nav' && rig.cur !== tap.station) goStation(tap.station, () => setTimeout(act, 250));
  else act();
}
function ndc(e) { const r = canvas.getBoundingClientRect(); return [((e.clientX - r.left) / r.width) * 2 - 1, -(((e.clientY - r.top) / r.height) * 2 - 1)]; }

const ptr = new Map(); let down = null, pinch = null, lastHover = 0;
canvas.addEventListener('pointerdown', (e) => {
  if (ui.blocking) return; canvas.setPointerCapture(e.pointerId); ptr.set(e.pointerId, { x: e.clientX, y: e.clientY });
  if (ptr.size === 1) down = { x: e.clientX, y: e.clientY, t: performance.now(), moved: 0 }; else { down = null; const [a, b] = [...ptr.values()]; pinch = Math.hypot(a.x - b.x, a.y - b.y); }
  canvas.classList.add('grabbing');
});
canvas.addEventListener('pointermove', (e) => {
  const p = ptr.get(e.pointerId);
  if (!p) { // Hover (nur Maus)
    if (e.pointerType === 'mouse' && !ui.blocking && !rig.moving && performance.now() - lastHover > 90) {
      lastHover = performance.now(); const [x, y] = ndc(e); const h = world.pick(x, y);
      canvas.classList.toggle('hot', !!h); const label = h && (h.tap.label || h.tap.book?.title || h.tap.title); ui.tip(label, e.clientX, e.clientY - 4);
    }
    return;
  }
  const dx = e.clientX - p.x, dy = e.clientY - p.y; p.x = e.clientX; p.y = e.clientY;
  if (ptr.size === 2) { const [a, b] = [...ptr.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y); if (pinch) rig.zoomBy(pinch / d); pinch = d; return; }
  if (down) down.moved += Math.abs(dx) + Math.abs(dy);
  if (!rig.moving) rig.look(dx, dy, (camera.fov * Math.PI / 180) / innerHeight);
});
const up = (e) => {
  const had = ptr.delete(e.pointerId); if (!had) return; canvas.classList.remove('grabbing'); if (ptr.size < 2) pinch = null;
  if (down && ptr.size === 0 && down.moved < 10 && performance.now() - down.t < 600 && !ui.blocking && !rig.moving) { const [x, y] = ndc(e); const h = world.pick(x, y); if (h) handleTap(h.tap); }
  if (ptr.size === 0) down = null;
};
canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
canvas.addEventListener('pointerleave', () => ui.tip(null));
canvas.addEventListener('wheel', (e) => { e.preventDefault(); if (!ui.blocking) rig.zoomBy(e.deltaY > 0 ? 1.08 : 1 / 1.08); }, { passive: false });
addEventListener('keydown', (e) => {
  if (ui.blocking) return; const k = e.key;
  if (k === 'ArrowLeft') rig.look(-60, 0, 0.004 * 1); else if (k === 'ArrowRight') rig.look(60, 0, 0.004); else if (k === 'ArrowUp') rig.look(0, -40, 0.004); else if (k === 'ArrowDown') rig.look(0, 40, 0.004);
  else if (k === 'n' || k === 'PageDown') step(1); else if (k === 'p' || k === 'PageUp') step(-1); else if (k === ' ') rig.recenter(); else if (k === '+' || k === '=') rig.zoomBy(0.9); else if (k === '-') rig.zoomBy(1.1);
});

// ---------------------------------------------------------------- Einstellungen, Anhalten
function setTier(name, lock) { tierName = TIERS[name] ? name : tierName; if (lock) tierLocked = true; size(); }
ui = new UI({
  onGo: goRoom, onStep: step,
  onSettings: (o) => {
    if ('calm' in o) { calm = o.calm; rig.calm = calm; document.body.classList.toggle('calm', calm); }
    if ('quality' in o) { if (o.quality === 'auto') { tierLocked = false; tierName = touchDevice ? 'mid' : 'high'; size(); } else setTier(o.quality, true); }
  },
});
ctx.ui = ui;
ui.onViewerChange = (open) => { paused = open; if (!open) last = performance.now(); };
document.addEventListener('visibilitychange', () => { paused = document.hidden || ui.viewerOpen; if (!paused) last = performance.now(); });

// ---------------------------------------------------------------- Schleife
let last = performance.now(), frames = 0, acc = 0;
function frame(now) {
  requestAnimationFrame(frame); if (paused) return;
  const dt = Math.min(0.05, (now - last) / 1000); last = now;
  rig.update(dt); world.update(dt);
  const f = document.getElementById('gl'); void f;
  renderer.render(scene, camera);
  // Automatische Qualität: bei dauerhaft langsamen Bildern eine Stufe tiefer
  if (!tierLocked) { frames++; acc += dt; if (acc > 3) { const fps = frames / acc; frames = 0; acc = 0; if (fps < 26 && tierName !== 'low') { tierName = tierName === 'high' ? 'mid' : 'low'; size(); } } }
}

(async () => {
  await world.build((p) => { const b = document.getElementById('go'); b.textContent = `Bibliothek wird aufgebaut … ${Math.round(p * 100)} %`; });
  world.cat?.place?.('foyer-eingang'); rig.jump('foyer-eingang'); ui.setWhere('foyer', rig.stations.get('foyer-eingang').name);
  rig.onTravel = (from, to) => { world.cat?.follow(from, to, rig.travel?.route); };
  requestAnimationFrame((t) => { last = t; frame(t); });
  ui.ready(() => { if (!qs.has('quiet')) setTimeout(() => ui.say('Miau! Ich bin Archimedes. Komm, ich zeige dir die Bibliothek. Tippe auf eine Tür oder auf die Knöpfe unten.', { ms: 9000 }), 700); });
  window.__lib = { rig, world, ui, THREE, renderer, scene, camera, goStation, goRoom, handleTap, setTier, ctx, step: (dt, n = 1) => { for (let i = 0; i < n; i++) { rig.update(dt); world.update(dt); } renderer.render(scene, camera); } };
  window.__bookReady = true;
})();
