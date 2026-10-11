"""Skelett, Hautgewichte und Posenhilfen (Blender)."""
import numpy as np
import bpy
import mathutils

CM = 0.01


def make_armature(spec, name='Archimedes'):
    data = bpy.data.armatures.new(name)
    arm = bpy.data.objects.new(name, data)
    bpy.context.scene.collection.objects.link(arm)
    bpy.context.view_layer.objects.active = arm
    arm.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    eb = {}
    for n, par, h, t in spec:
        b = data.edit_bones.new(n)
        b.head = mathutils.Vector(h) * CM; b.tail = mathutils.Vector(t) * CM; b.roll = 0.0
        eb[n] = b
    for n, par, h, t in spec:
        if par: eb[n].parent = eb[par]
    bpy.ops.object.mode_set(mode='OBJECT')
    data.display_type = 'STICK'
    return arm


class Rig:
    """Posen in Weltachsen-Gradwerten: Drehung R um die Achsen des Skeletts (x = quer, y = nach hinten, z = oben), im Rahmen des (bewegten) Elternknochens."""
    def __init__(self, arm):
        self.arm = arm
        self.rest = {}
        for b in arm.data.bones:
            m = b.matrix_local.to_3x3(); self.rest[b.name] = m
        for pb in arm.pose.bones:
            pb.rotation_mode = 'QUATERNION'
        self.names = [b.name for b in arm.data.bones]
        self.cur = {}

    def reset(self):
        for pb in self.arm.pose.bones:
            pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0); pb.scale = (1, 1, 1)
        self.cur = {}

    def set(self, name, rot=None, loc=None, scale=None, mat=None):
        pb = self.arm.pose.bones[name]; R = self.rest[name]
        if mat is not None:
            W = mathutils.Matrix([list(r) for r in mat])
            pb.rotation_quaternion = (R.inverted() @ W @ R).to_quaternion()
        elif rot is not None:
            W = mathutils.Euler([np.radians(a) for a in rot], 'XYZ').to_matrix()
            q = (R.inverted() @ W @ R).to_quaternion()
            pb.rotation_quaternion = q
        if loc is not None:
            pb.location = R.inverted() @ mathutils.Vector(loc)
        if scale is not None:
            pb.scale = scale

    def pose(self, d):
        """d: {knochen: (rx, ry, rz)} oder {knochen: dict(rot=, loc=, scale=)}. Alle anderen Knochen zurück in Ruhe."""
        self.reset()
        for n, v in d.items():
            if isinstance(v, dict): self.set(n, **v)
            else: self.set(n, rot=v)

    def key(self, frame, names=None):
        for n in (names or self.names):
            pb = self.arm.pose.bones[n]
            pb.keyframe_insert('rotation_quaternion', frame=frame)
            if n in ('root', 'pelvis') or any(abs(x) > 1e-9 for x in pb.location):
                pb.keyframe_insert('location', frame=frame)
            if any(abs(s - 1) > 1e-9 for s in pb.scale):
                pb.keyframe_insert('scale', frame=frame)


# ----------------------------------------------------------------------------- Gewichte
def skin_weights(P, F, tau=0.009, maxinf=4, cut=0.02, allowed=None):
    """Hautgewichte nach Abstand zu den Teilvolumina der Knochen (weicher Wettstreit). -> (n, k) Gewichte, Namen"""
    names = list(allowed) if allowed else list(F['parts'].keys())
    fs = np.stack([F['bone_fields'][b](P) for b in names], 1)
    m = fs.min(1, keepdims=True)
    w = np.exp(-(fs - m) / tau)
    w /= w.sum(1, keepdims=True)
    # die größten maxinf behalten
    idx = np.argsort(-w, 1)[:, :maxinf]
    out = np.zeros_like(w); r = np.arange(len(w))[:, None]
    out[r, idx] = w[r, idx]
    out[out < cut] = 0
    out /= out.sum(1, keepdims=True)
    return out, names


def assign_weights(ob, W, names, offset=0):
    """W: (n,k) für die Eckpunkte offset..offset+n"""
    for j, n in enumerate(names):
        vg = ob.vertex_groups.get(n) or ob.vertex_groups.new(name=n)
        col = W[:, j]
        for i in np.nonzero(col > 0)[0]:
            vg.add([int(i) + offset], float(col[i]), 'REPLACE')


def bind(ob, arm):
    md = ob.modifiers.new('Armature', 'ARMATURE'); md.object = arm
    ob.parent = arm
