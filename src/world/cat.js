// Archimedes, die Bibliothekskatze. SCHNITTSTELLE (siehe main.js/world.js):
//   createCat(ctx) -> { group, update(dt, t), place(stationId), follow(fromId, toId, route), arrive(stationId), poke() }
//   ctx: { rig, world, ui, books }.  group.userData.tap = { kind: 'cat', label: 'Archimedes' }
// STAND: Platzhalter ohne Figur. Der Katzen-Bauer ersetzt die Datei.
import * as THREE from 'three';
export function createCat(ctx) {
  const group = new THREE.Group(); group.name = 'archimedes';
  return { group, update() {}, place() {}, follow() {}, arrive() {}, poke() { ctx.ui.say('Miau!'); } };
}
// Gerahmtes Bild des Hausherrn für die Foyer-Nordwand (THREE.Group aus framedPicture, 0.9 x 1.2 m Bild) oder null
export function catPortrait() { return null; }
