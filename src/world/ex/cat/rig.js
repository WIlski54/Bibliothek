// Baut aus Teil-Beschreibungen (art-*.js) eine Pose: Gruppe mit beweglichen Papierlagen (Knoten je Teil, Drehpunkt = pivot).
import * as THREE from 'three';
import { cutFlat } from './cutbuild.js';

export const Z_STEP = 0.0065;   // Abstand der Papierlagen (m), von vorn gesehen kaum sichtbar, aber ohne Z-Fighting

export function buildPose(parts, { name = 'pose', border = 0.007, maxTex = 512, ppu = 1150 } = {}) {
  const root = new THREE.Group(); root.name = name;
  const nodes = {}, cuts = {}, byName = Object.fromEntries(parts.map((p) => [p.name, p]));
  for (const p of parts) {
    const node = new THREE.Group(); node.name = p.name;
    const cut = cutFlat(p.variants, { name: `${name}:${p.name}`, border: p.border ?? border, maxTex: p.maxTex ?? maxTex, ppu: p.ppu ?? ppu, tilt: p.tilt ?? 0.5, glow: p.glow ?? 0.14 });
    cut.mesh.position.set(-p.pivot[0], -p.pivot[1], 0);
    node.add(cut.mesh);
    const parent = p.parent ? byName[p.parent] : null;
    node.userData.base = { x: p.pivot[0] - (parent ? parent.pivot[0] : 0), y: p.pivot[1] - (parent ? parent.pivot[1] : 0), z: (p.z - (parent ? parent.z : 0)) * Z_STEP };
    node.position.set(node.userData.base.x, node.userData.base.y, node.userData.base.z);
    nodes[p.name] = node; cuts[p.name] = cut;
  }
  for (const p of parts) (p.parent ? nodes[p.parent] : root).add(nodes[p.name]);
  return { root, nodes, cuts, parts: byName, dispose() { for (const c of Object.values(cuts)) c.dispose(); } };
}

// Knoten in die Ruhelage zurück
export function resetNodes(pose) {
  for (const n of Object.values(pose.nodes)) { const b = n.userData.base; n.position.set(b.x, b.y, b.z); n.rotation.set(0, 0, 0); n.scale.set(1, 1, 1); }
}
