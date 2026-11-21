"""Assertions on 3d/street.blend. Run: node scripts/blender.mjs 3d/tests/check_street.py   (exit 1 on the first failure)"""
import bpy, json, math, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
CFG = json.load(open(os.path.join(REPO, 'src', 'data', 'diorama.json'), encoding='utf-8'))
BLEND = os.path.join(REPO, '3d', 'street.blend')

passed = 0

def check(cond, msg):
    global passed
    if not cond:
        print(f'check_street: FAIL {msg}')
        sys.exit(1)
    passed += 1

check(os.path.exists(BLEND), f'{BLEND} exists')
bpy.ops.wm.open_mainfile(filepath=BLEND)
objs = bpy.data.objects

# canvases: one or more per stop, UVs inside 0..1
for s in CFG['stops']:
    pre = f"canvas_{s['n']}_{s['service']}"
    found = [o for o in objs if o.name.startswith(pre)]
    check(found, f'{pre}* exists')
    for o in found:
        check(o.get('canvas') == s['n'] and o.get('service') == s['service'], f'{o.name} custom props')
        uv = o.data.uv_layers.get('UVMap')
        check(uv is not None, f'{o.name} has UVMap')
        check(all(-1e-6 <= d.uv[0] <= 1 + 1e-6 and -1e-6 <= d.uv[1] <= 1 + 1e-6 for d in uv.data), f'{o.name} UVs in 0..1')

# logos never mirrored; the far one is rotated
for n in ('van_logo_near', 'van_logo_far'):
    check(n in objs and objs[n].matrix_world.determinant() > 0, f'{n} not mirrored')
check(abs(objs['van_logo_far'].rotation_euler.z - math.pi) < 1e-4, 'van_logo_far rotated 180 deg')
for o in objs:
    if o.type == 'MESH':
        check(min(o.scale) > 0 and o.matrix_world.determinant() > 0, f'{o.name} has no negative scale')

# near-side palms clear of every van stop
props = objs['palms']
ti = [i for i, m in enumerate(props.data.materials) if m and m.name == 'trunk']
check(ti, 'palms have the trunk material')
bases = set()
for p in props.data.polygons:
    if p.material_index in ti:
        for vi in p.vertices:
            co = props.matrix_world @ props.data.vertices[vi].co
            if co.z < 0.3 and co.y < 0:
                bases.add(round(co.x, 1))
for s in CFG['stops']:
    near = [x for x in bases if abs(x - s['vanX']) < 4.0]
    check(not near, f"no near-side palm within 4 m of stop {s['n']} van x {s['vanX']} (found {near[:3]})")

# van keyframes include every stop
van = objs['van']
ad = van.animation_data.action
try:
    curves = list(ad.fcurves)
except AttributeError:
    curves = [c for l in ad.layers for st in l.strips for b in st.channelbags for c in b.fcurves]
xs = {round(k.co[1], 3) for c in curves if c.data_path == 'location' and c.array_index == 0 for k in c.keyframe_points}
for s in CFG['stops']:
    check(round(s['vanX'], 3) in xs, f"van keyframe at stop {s['n']} x {s['vanX']}")

# triangle budget
dg = bpy.context.evaluated_depsgraph_get()
tris = 0
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); tris += len(me.loop_triangles)
        o.evaluated_get(dg).to_mesh_clear()
check(tris <= 150_000, f'triangles {tris} <= 150000')

# hierarchy: everything hangs off street_root
check('street_root' in objs, 'street_root exists')
root = objs['street_root']
def under(o):
    while o.parent:
        o = o.parent
    return o == root
for o in bpy.context.scene.objects:
    if o != root:
        check(under(o), f'{o.name} is under street_root')

# the carved-rock finish
check('plinth_rock' in objs and len(objs['plinth_rock'].data.vertices) >= 2000, 'plinth_rock carved (>= 2000 verts)')
check('sea_foam' in objs, 'sea_foam exists')

# v2 polish: hotspot anchors, surface detail, shiny glass, film cameras
for st in CFG['stops']:
    h = objs.get(f"hotspot_{st['n']}")
    check(h is not None and h.type == 'EMPTY', f"hotspot_{st['n']} exists")
    cs = [o for o in objs if o.name.startswith(f"canvas_{st['n']}_")]
    d = min((h.matrix_world.translation - c.matrix_world.translation).length for c in cs)
    check(d < 2.0, f"hotspot_{st['n']} within 2 m of its canvas ({d:.2f})")
SMOOTH = ('glass', 'water', 'foam', 'sea_grad', 'lamp', 'head', 'tail')
def in_tree(o, names):
    return any(c.name in names or any(p.name in names for p in bpy.data.collections if c.name in [x.name for x in p.children]) for c in o.users_collection)
seen = set()
for o in objs:
    if o.type == 'MESH' and in_tree(o, {'10 Street', '11 Ground', '12 Buildings', '40 Props'}):
        for m in o.data.materials:
            if m and m.name not in seen and not any(k in m.name for k in SMOOTH):
                seen.add(m.name)
                check(any(n.type == 'BUMP' for n in m.node_tree.nodes), f'{m.name} has surface detail (Bump)')
check(len(seen) >= 15, f'surface detail on {len(seen)} materials')
check(bpy.data.materials['glass'].node_tree.nodes['Principled BSDF'].inputs['Roughness'].default_value <= 0.25, 'glass is shiny')
for n in ('film_cam_en', 'film_cam_ar'):
    check(n in objs and objs[n].type == 'CAMERA', f'{n} exists')

TOPS = {'10 Street', '20 Stops', '30 Van', '40 Props', '90 Rig'}

# a clean, clear scene: numbered top-level collections, descriptive names, no orphan data
import re as _re
tops = {c.name for c in bpy.context.scene.collection.children}
check(tops == TOPS, f'top-level collections {sorted(tops)} == {sorted(TOPS)}')
for blk in (bpy.data.meshes, bpy.data.materials):
    for d in blk:
        check(not _re.search(r'\.\d{3}$', d.name) and d.name != 'Material', f'descriptive name: {d.name}')
        check(d.users > 0, f'no orphan data: {d.name}')

print(f'check_street: all {passed} checks passed ({tris} triangles)')
