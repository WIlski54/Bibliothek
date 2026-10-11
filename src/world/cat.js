// Archimedes, die Bibliothekskatze. SCHNITTSTELLE (siehe main.js/world.js):
//   createCat(ctx) -> { group, update(dt, t), place(stationId), follow(fromId, toId, route), arrive(stationId), poke() }
//   ctx: { rig, world, ui, books }.  group.userData.tap = { kind: 'cat', label: 'Archimedes' }
// Zusätzlich: greet() (Foyer-Begrüßung als Sprechblase), tipFor(room), screenAnchor() (Kopf in NDC, z. B. für eine Sprechblase), space (Belegungsraster), cat (Zustand für Tests).
// Katzenplatz je Station: `catSpot` der Station (Weltkoordinaten), sonst automatisch aus der echten Raumgeometrie (siehe ex/cat/space.js).
// Standard ist die 3D-Katze (Modell aus Blender, ex/cat/cat3d.js). Die Papierkatze (ex/cat/archimedes.js, Papierschnitt-Lagen) springt ein,
// wenn das Modell nicht lädt, und läuft, wenn die Adresse `?cat=paper` enthält.
import * as THREE from 'three';
import { Archimedes } from './ex/cat/archimedes.js';
import { Archimedes3D } from './ex/cat/cat3d.js';
import { portrait } from './ex/cat/portrait.js';

export function createCat(ctx) {
  const group = new THREE.Group();
  const forcePaper = typeof location !== 'undefined' && /[?&]cat=paper(&|$)/.test(location.search);
  let a = null;
  // Rückfall: Papierfigur an derselben Stelle (gleiche Gruppe, gleicher Zustand, gleiches Belegungsraster)
  const swapToPaper = (old) => {
    for (const c of [...group.children]) group.remove(c);
    const p = new Archimedes(ctx, { group, space: old.space });
    p.pos.copy(old.pos); p.ground = old.ground; p.placed = true; p.visited = old.visited; p.tipped = old.tipped;
    if (old.mode === 'sleep') p.setSleep(); else p.setSit(true);
    a = p;
  };
  a = forcePaper ? new Archimedes(ctx, { group }) : new Archimedes3D(ctx, { group, onFail: swapToPaper });
  return {
    group, get cat() { return a; }, get space() { return a.space; },
    update: (dt, t) => a.update(dt, t), place: (id) => a.place(id), follow: (from, to, route) => a.follow(from, to, route), arrive: (id) => a.arrive(id), poke: () => a.poke(),
    greet: () => a.greet(), tipFor: (room) => a.tipFor(room), screenAnchor: () => a.screenAnchor(),
  };
}
// Gerahmtes Bild des Hausherrn für die Foyer-Nordwand (THREE.Group aus framedPicture, 0.9 x 1.2 m Bild)
export function catPortrait() { return portrait(); }
