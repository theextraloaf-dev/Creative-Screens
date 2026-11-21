"""Assertions on 3d/oman-map.blend. Run: node scripts/blender.mjs 3d/tests/check_map.py   (exit 1 on the first failure)"""
import bpy, json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(os.path.dirname(HERE))
sys.path.insert(0, os.path.join(REPO, '3d', 'map'))
from geo import project  # noqa: E402

CFG = json.load(open(os.path.join(REPO, 'src', 'data', 'diorama.json'), encoding='utf-8'))
BLEND = os.path.join(REPO, '3d', 'oman-map.blend')
passed = 0

def check(cond, msg):
    global passed
    if not cond:
        print(f'check_map: FAIL {msg}')
        if not os.environ.get('CHECK_ALL'):                 # CHECK_ALL=1 reports every failure instead of the first
            sys.exit(1)
        return
    passed += 1

check(os.path.exists(BLEND), f'{BLEND} exists')
bpy.ops.wm.open_mainfile(filepath=BLEND)
objs = bpy.data.objects

check('oman_terrain' in objs, 'oman_terrain exists')
t = objs['oman_terrain']
vs = [t.matrix_world @ v.co for v in t.data.vertices]

def nearest(lon, lat):
    px, py = project(lon, lat)
    return min(((v.x - px) ** 2 + (v.y - py) ** 2) ** 0.5 for v in vs)

check(nearest(56.25, 26.18) < 3.0, f'Musandam (Khasab) on the terrain, nearest {nearest(56.25, 26.18):.1f} km')
check(nearest(54.09, 17.02) < 3.0, f'Salalah on the terrain, nearest {nearest(54.09, 17.02):.1f} km')
check(nearest(55.27, 25.20) > 10.0, f'Dubai not on the Oman terrain, nearest {nearest(55.27, 25.20):.1f} km')
zmax = max(v.z for v in vs)
check(14 <= zmax <= 21, f'Jebel Shams height x6 in 14..21 km, got {zmax:.1f}')

check('muscat_anchor' in objs, 'muscat_anchor exists')
a = objs['muscat_anchor']; mx, my = project(58.383, 23.588)
check(((a.location.x - mx) ** 2 + (a.location.y - my) ** 2) ** 0.5 < 1.0, 'muscat_anchor at Muscat')
check(abs(a.get('street_scale', -1) - CFG['map']['streetScale']) < 1e-9, 'muscat_anchor street_scale from config')
# v3: 3D pin tokens at every city, trees and rocks, the journey route in the shared config
for p in CFG['pins']:
    check(f"pin3d_{p['slug']}" in objs, f"pin3d_{p['slug']} exists")
check('trees' in objs and len(objs['trees'].data.polygons) > 3000, 'trees scattered')
check('rocks' in objs, 'rocks scattered')
route = CFG.get('route')
check(route and len(route['points']) > 40, 'route points written to diorama.json')
check(route and [s['slug'] for s in route['stops']] == ['salalah', 'duqm', 'sur', 'nizwa', 'sohar', 'muscat'], 'route visits the six cities, ending at Muscat')
check(route and all(0 <= s['t'] <= 1 for s in route['stops']) and [s['t'] for s in route['stops']] == sorted(s['t'] for s in route['stops']), 'stop positions along the route increase')

# v3 polish: the van's road lies on the ground (never through hills), nothing stands on it, the land is soft not faceted
from mathutils import Vector as _V
from mathutils.bvhtree import BVHTree as _BVH
import numpy as _np
_dg = bpy.context.evaluated_depsgraph_get()
_tree = _BVH.FromObject(t, _dg)
def ground(x, y):
    hit = _tree.ray_cast(_V((x, y, 100.0)), _V((0, 0, -1)))
    return None if hit[0] is None else hit[0].z
P = _np.array(route['points'])
seg = _np.hypot(*_np.diff(P[:, :2], axis=0).T)
check(seg.max() <= 2.6, f'van path sampled every <= 2.5 km (max gap {seg.max():.1f} km)')
gaps = [p[2] - g for p in P for g in [ground(p[0], p[1])] if g is not None]
check(len(gaps) > 0.9 * len(P), f'route lies over the terrain ({len(gaps)}/{len(P)} points)')
check(min(gaps) > -0.05 and max(gaps) < 1.5, f'van path hugs the ground: height above it {min(gaps):.2f}..{max(gaps):.2f} km')
# between samples too: the midpoint of every path segment is above the ground
mids = [((a[2] + b[2]) / 2) - g for a, b in zip(P, P[1:]) for g in [ground((a[0] + b[0]) / 2, (a[1] + b[1]) / 2)] if g is not None]
check(min(mids) > -0.05, f'van path never cuts through a hill between samples (worst {min(mids):.2f} km)')
grade = _np.abs(_np.diff(P[:, 2])) / _np.maximum(seg, 1e-6)
check(grade.max() < 0.2, f'road grade gentle (max {grade.max():.2f})')
def route_dist(x, y):
    d = _np.hypot(P[:, 0] - x, P[:, 1] - y)
    return float(d.min())
fort = objs['landmark_fort']
check(route_dist(fort.location.x, fort.location.y) > 10.0, f'the Nizwa fort stands off the road ({route_dist(fort.location.x, fort.location.y):.1f} km)')
# the chase camera sits south-west of the van (scene.js followMap): the fort must stand on the north side of the road
_i = int(_np.argmin(_np.hypot(P[:, 0] - fort.location.x, P[:, 1] - fort.location.y)))
check(fort.location.y > P[_i, 1], 'the Nizwa fort stands north of the road, never between the camera and the van')
# tokens stand on the far side of the road from the chase camera (camera offset is south-west): never in front of the van
_AWAY = _np.array([48.0, 62.0]) / _np.hypot(48.0, 62.0)
for p in CFG['pins']:
    o = objs[f"pin3d_{p['slug']}"]
    j = int(_np.argmin(_np.hypot(P[:, 0] - o.location.x, P[:, 1] - o.location.y)))
    off = _np.array([o.location.x - P[j, 0], o.location.y - P[j, 1]])
    along = float(_np.dot(off, _AWAY)); perp = abs(float(off[0] * _AWAY[1] - off[1] * _AWAY[0]))
    check(along > 0.0 or perp > 6.0, f"{o.name} never stands between the camera and the van (toward camera {-along:.1f} km, off the sight line {perp:.1f} km)")
_tok = objs['pin3d_nizwa']
check(((_tok.location.x - fort.location.x) ** 2 + (_tok.location.y - fort.location.y) ** 2) ** 0.5 > 12.0, 'the Nizwa token keeps clear of the fort')
for p in CFG['pins']:
    o = objs[f"pin3d_{p['slug']}"]
    d = route_dist(o.location.x, o.location.y)
    check(4.0 < d < 14.0, f"{o.name} beside the road, not on it ({d:.1f} km)")
    g = ground(o.location.x, o.location.y)
    check(g is not None and abs(o.location.z - g) < 0.4, f'{o.name} stands on the ground')
for name in ('trees', 'rocks'):
    me = objs[name].data
    V = _np.array([objs[name].matrix_world @ v.co for v in me.vertices])[:, :2][::7]
    near = min(float(_np.hypot(P[::3, 0] - x, P[::3, 1] - y).min()) for x, y in V)
    check(near > 3.0, f'{name} keep clear of the road (nearest {near:.1f} km)')
# soft land, not faceted: the fold between neighbouring faces stays small (raw DEM at x6 measured p95 22, p99 50 deg)
import bmesh as _bmesh, math as _math
_bm = _bmesh.new(); _bm.from_mesh(t.data)
# the land surface, not the coast cut: edges touching the outline drop to sea level onto the plinth cliffs by design
_edge_v = {v.index for e in _bm.edges if e.is_boundary for v in e.verts}
_fold = _np.array([_math.degrees(e.calc_face_angle(0.0)) for e in _bm.edges
                   if len(e.link_faces) == 2 and not any(v.index in _edge_v for v in e.verts)]); _bm.free()
p95, p99 = _np.percentile(_fold, [95, 99])
check(p95 < 10.0 and p99 < 20.0, f'land is softened: face folds p95 {p95:.1f} (< 10), p99 {p99:.1f} (< 20) deg')
for k in ('muscat', 'nizwa', 'jebel_shams', 'sharqiya', 'salalah', 'musandam'):
    check(f'label_{k}' in objs, f'label_{k} exists')
check(not [o for o in objs if o.type == 'FONT'], 'no text objects')
check(not [m for m in bpy.data.materials if 'text' in m.name.lower()], 'no text materials')
for n in ('oman_plinth', 'neighbours', 'borders', 'sea', 'sea_foam', 'landmarks', 'CAM_map', 'oman_root', 'route_line'):
    check(n in objs, f'{n} exists')
root = objs['oman_root']
for o in bpy.context.scene.objects:
    if o != root:
        p = o
        while p.parent:
            p = p.parent
        check(p == root, f'{o.name} is under oman_root')

dg = bpy.context.evaluated_depsgraph_get(); tris = 0
for o in bpy.context.scene.objects:
    if o.type == 'MESH':
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles(); tris += len(me.loop_triangles)
        o.evaluated_get(dg).to_mesh_clear()
check(tris <= 240_000, f'triangles {tris} <= 240000')
check(CFG['map']['camera'] is not None, 'diorama.json map.camera written')

TOPS = {'00 Map', '90 Rig'}

# a clean, clear scene: numbered top-level collections, descriptive names, no orphan data
import re as _re
tops = {c.name for c in bpy.context.scene.collection.children}
check(tops == TOPS, f'top-level collections {sorted(tops)} == {sorted(TOPS)}')
for blk in (bpy.data.meshes, bpy.data.materials):
    for d in blk:
        check(not _re.search(r'\.\d{3}$', d.name) and d.name != 'Material', f'descriptive name: {d.name}')
        check(d.users > 0, f'no orphan data: {d.name}')

print(f'check_map: all {passed} checks passed ({tris} triangles, terrain max {zmax:.1f})')
