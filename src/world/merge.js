// Statische Geometrie je Raum nach Material zusammenfassen (weniger Zeichenaufrufe, wichtig fürs iPad).
// Ausgenommen: alles unterhalb eines Objekts mit userData.tap (anklickbar) oder userData.dynamic (animiert / veränderlich) oder userData.keep,
// durchsichtige oder unsichtbare Materialien, Materiallisten, Meshes ohne Standardattribute.
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

const KEEP = (o) => o.userData && (o.userData.tap || o.userData.dynamic || o.userData.keep);
export function mergeStatic(root, { exclude = [] } = {}) {
  root.updateMatrixWorld(true); const inv = new THREE.Matrix4().copy(root.matrixWorld).invert();
  const groups = new Map(); const skip = new Set(exclude);
  const visit = (o) => {
    if (skip.has(o) || KEEP(o) || o.isLight) return;
    if (o.isMesh && !o.isSkinnedMesh && !o.isInstancedMesh && !Array.isArray(o.material) && o.material && o.material.visible !== false && !o.material.transparent && o.geometry?.attributes?.position) {
      let g = groups.get(o.material); if (!g) groups.set(o.material, (g = [])); g.push(o);
    }
    for (const c of o.children) visit(c);
  };
  visit(root);
  let removed = 0, made = 0;
  for (const [mat, list] of groups) {
    if (list.length < 2) continue;
    const names = (m) => Object.keys(m.geometry.attributes).sort().join(',');
    const sig = names(list[0]); const same = list.filter((m) => names(m) === sig); if (same.length < 2) continue;
    const allIndexed = same.every((m) => !!m.geometry.index);
    const geos = same.map((m) => { let gg = m.geometry.clone(); if (!allIndexed && gg.index) gg = gg.toNonIndexed(); gg.applyMatrix4(new THREE.Matrix4().multiplyMatrices(inv, m.matrixWorld)); return gg; });
    const merged = mergeGeometries(geos, false); if (!merged) continue; geos.forEach((gg) => gg.dispose());
    const mesh = new THREE.Mesh(merged, mat); mesh.receiveShadow = true; mesh.name = 'merged'; root.add(mesh); made++;
    for (const m of same) { m.parent?.remove(m); removed++; }
  }
  return { removed, made };
}
