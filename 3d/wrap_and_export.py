"""Part 2: wrap-film layers on the near front door, callout anchors, and the web export.

Run in Blender after build_car.py, in the same exec namespace:
    exec(open('.../build_car.py').read()); exec(open('.../wrap_and_export.py').read())
Layer names are GENERIC placeholders until the client supplies the real film, laminate and ink names.
"""
import bpy, bmesh, math, json, os
from mathutils import Vector

# ------------------------------------------------------------------ film layers on the near front door
DOOR_X = (0.04, 0.86)       # film is inset from the door panel (x -0.05 .. 0.95)
DOOR_Z = (0.43, 0.87)
NX, NZ = 36, 14
FILM_LAYERS = [  # name, outward offset (m)
    ('film_backing', 0.004), ('film_adhesive', 0.008), ('film_vinyl', 0.012), ('film_laminate', 0.016)]
ART_CENTER = (0.45, 0.65); ART_A = 0.31; ART_B = 0.115     # stadium (pill) half-length / half-height


def side_y(x, z):
    """Near-side surface y (negative) at height z on the door zone."""
    pts = section(x)
    for k in range(2, 8):
        (y0, z0), (y1, z1) = pts[k], pts[k + 1]
        if z0 <= z <= z1 and z1 > z0:
            t = (z - z0) / (z1 - z0)
            return -(y0 + (y1 - y0) * t)
    return -pts[4][0]


def make_film(name, off, col):
    bm = bmesh.new()
    grid = []
    for iz in range(NZ + 1):
        row = []
        for ix in range(NX + 1):
            x = DOOR_X[0] + (DOOR_X[1] - DOOR_X[0]) * ix / NX
            z = DOOR_Z[0] + (DOOR_Z[1] - DOOR_Z[0]) * iz / NZ
            row.append(bm.verts.new((x, side_y(x, z) - off, z)))
        grid.append(row)
    for iz in range(NZ):
        for ix in range(NX):
            f = bm.faces.new([grid[iz][ix], grid[iz][ix + 1], grid[iz + 1][ix + 1], grid[iz + 1][ix]])
            f.smooth = True
    bm.normal_update()
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    return ob


def stadium_points(n=56):
    """Closed outline of a pill, as (x, z) pairs, counter-clockwise."""
    cx, cz = ART_CENTER; a, b = ART_A, ART_B
    pts = []
    h = n // 4
    for i in range(h + 1):   # right cap, bottom -> top
        t = -math.pi / 2 + math.pi * i / h
        pts.append((cx + a + b * math.cos(t), cz + b * math.sin(t)))
    for i in range(h + 1):   # left cap, top -> bottom
        t = math.pi / 2 + math.pi * i / h
        pts.append((cx - a + b * math.cos(t), cz + b * math.sin(t)))
    return pts


def make_art(col, off):
    bm = bmesh.new()
    pts = stadium_points()
    ring = [bm.verts.new((x, side_y(x, z) - off, z)) for x, z in pts]
    cx, cz = ART_CENTER
    ctr = bm.verts.new((cx, side_y(cx, cz) - off, cz))
    for i in range(len(ring)):
        bm.faces.new([ctr, ring[i], ring[(i + 1) % len(ring)]])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('film_art'); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new('film_art', me); col.objects.link(ob)
    return ob


def build_film(col):
    out = {}
    for name, off in FILM_LAYERS:
        out[name] = make_film(name, off, col)
    out['film_art'] = make_art(col, 0.0135)
    return out


# ------------------------------------------------------------------ callout anchors (metres)
ANCHORS = {
    'hood': (1.55, 0.0, 0.88), 'roof': (-0.30, 0.0, 1.46), 'trunk': (-1.95, 0.0, 1.00),
    'windshield': (0.65, 0.0, 1.12), 'side_glass': (-0.40, -0.80, 1.22),
    'door': (0.45, -0.93, 0.50), 'wheel': (1.35, -0.94, 0.345),
    'bumper_front': (2.28, 0.0, 0.46), 'sill': (-0.40, -0.92, 0.28),
}


def build_anchors(col):
    for n, p in ANCHORS.items():
        e = bpy.data.objects.new('anchor_' + n, None)
        e.empty_display_type = 'PLAIN_AXES'; e.empty_display_size = 0.08
        e.location = p; col.objects.link(e)


# ------------------------------------------------------------------ web export
def export_web(path, collection='Car'):
    out = {'units': 'mm', 'parts': {}, 'anchors': {k: [round(c * 1000) for c in v] for k, v in ANCHORS.items()}}
    for ob in bpy.data.collections[collection].objects:
        if ob.type != 'MESH':
            continue
        bm = bmesh.new(); bm.from_mesh(ob.data)
        bm.verts.ensure_lookup_table(); bm.edges.ensure_lookup_table()
        sharp = 0.6 if ob.name.startswith('wheel') else 0.45   # radians: wheels keep their detail; body keeps real creases only
        lines = []
        for e in bm.edges:
            boundary = len(e.link_faces) == 1
            ang = e.calc_face_angle(None)
            if boundary or e.seam or (ang is not None and ang > sharp):
                lines += [e.verts[0].index, e.verts[1].index]
        bmesh.ops.triangulate(bm, faces=bm.faces[:])
        tris = []
        for f in bm.faces:
            tris += [v.index for v in f.verts]
        pos = []
        for v in bm.verts:
            pos += [round(v.co.x * 1000), round(v.co.y * 1000), round(v.co.z * 1000)]
        out['parts'][ob.name] = {
            'o': [round(c * 1000) for c in ob.location], 'p': pos, 't': tris, 'l': lines}
        bm.free()
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, 'w') as f:
        json.dump(out, f, separators=(',', ':'))
    return os.path.getsize(path)


col = bpy.data.collections['Car']
film = build_film(col)
build_anchors(col)
EXPORT_PATH = '/Users/bindurajesh/Downloads/CreativeScreens-project-2026-10-29/creativescreens-site/public/models/car.json'
size = export_web(EXPORT_PATH)
result = {'export_bytes': size, 'objects': len(col.objects)}
