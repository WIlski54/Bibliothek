// Archimedes, die Bibliothekskatze. SCHNITTSTELLE (siehe main.js/world.js):
//   createCat(ctx) -> { group, update(dt, t), place(stationId), follow(fromId, toId, route), arrive(stationId), poke() }
//   ctx: { rig, world, ui, books }.  group.userData.tap = { kind: 'cat', label: 'Archimedes' }
// Zusätzlich: greet() (Begrüßung im Foyer), tipFor(room), space (Belegungsraster), cat (Zustand für Tests).
// Die Figur steckt in src/world/ex/cat/ (Papierschnitt-Lagen, Verhalten, Wegsuche, Texte).
import { Archimedes } from './ex/cat/archimedes.js';
import { portrait } from './ex/cat/portrait.js';

export function createCat(ctx) {
  const a = new Archimedes(ctx);
  return {
    group: a.group, cat: a, space: a.space,
    update: (dt, t) => a.update(dt, t), place: (id) => a.place(id), follow: (from, to, route) => a.follow(from, to, route), arrive: (id) => a.arrive(id), poke: () => a.poke(),
    greet: () => a.greet(), tipFor: (room) => a.tipFor(room),
  };
}
// Gerahmtes Bild des Hausherrn für die Foyer-Nordwand (THREE.Group aus framedPicture, 0.9 x 1.2 m Bild)
export function catPortrait() { return portrait(); }
