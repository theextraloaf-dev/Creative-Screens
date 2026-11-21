"""Generic sedan, built in Blender as named panels (so it can be pulled apart on the web).

Run inside Blender:  exec(open('<path>/build_car.py').read())
Axes: +X front, +Y far side, -Y near side (the side the web camera sees), +Z up. Metres.
Proportions follow ordinary sedan blueprints (about 4.6 x 1.83 x 1.46 m, wheelbase 2.7 m).
No manufacturer shapes, badges or logos: a deliberately generic car.
"""
import bpy, bmesh, math
from mathutils import Vector

# ----------------------------------------------------------------------------- profiles
def hermite(pts, x):
    n = len(pts)
    if x <= pts[0][0]: return pts[0][1]
    if x >= pts[-1][0]: return pts[-1][1]
    for i in range(n - 1):
        if pts[i][0] <= x <= pts[i + 1][0]: break
    x0, y0 = pts[i]; x1, y1 = pts[i + 1]
    def slope(j):
        if j == 0: return (pts[1][1] - pts[0][1]) / (pts[1][0] - pts[0][0])
        if j == n - 1: return (pts[-1][1] - pts[-2][1]) / (pts[-1][0] - pts[-2][0])
        return (pts[j + 1][1] - pts[j - 1][1]) / (pts[j + 1][0] - pts[j - 1][0])
    h = x1 - x0; t = (x - x0) / h
    m0 = slope(i) * h; m1 = slope(i + 1) * h
    return ((2*t**3 - 3*t**2 + 1) * y0 + (t**3 - 2*t**2 + t) * m0 +
            (-2*t**3 + 3*t**2) * y1 + (t**3 - t**2) * m1)

def smooth(t):
    t = max(0.0, min(1.0, t)); return t * t * (3 - 2 * t)

Z_TOP = [(-2.3, .88), (-2.2, .95), (-1.95, .975), (-1.75, .99), (-1.4, 1.12), (-1.0, 1.33), (-.55, 1.43),
         (-.05, 1.44), (.3, 1.36), (.65, 1.10), (1.0, .86), (1.3, .86), (1.7, .82), (2.1, .74), (2.3, .64)]
Z_BELT = [(-2.3, .82), (-2.1, .93), (-1.7, .95), (-1.0, .95), (0, .96), (.9, .90), (1.4, .82), (2.0, .72), (2.3, .62)]
Z_BOT = [(-2.3, .33), (-2.15, .25), (-1.9, .22), (1.9, .22), (2.15, .25), (2.3, .31)]
HALF_W = [(-2.3, .70), (-2.0, .86), (-1.5, .905), (0, .915), (1.2, .90), (1.9, .87), (2.3, .78)]

LOWER = [(0.0, 0.0), (0.55, 0.0), (0.88, 0.03), (0.985, 0.2), (1.0, 0.5), (0.985, 1.0)]      # k0..k5
UP_CABIN = [(.96, .14), (.92, .36), (.86, .60), (.80, .82), (.72, 1.0), (.40, 1.0), (0.0, 1.0)]  # k6..k12
UP_HOOD = [(.95, .25), (.90, .50), (.80, .72), (.66, .88), (.48, .97), (.25, 1.0), (0.0, 1.0)]
K = len(LOWER) + len(UP_CABIN)  # 13 points per half section

WHEEL_X = (1.35, -1.35); WHEEL_R = 0.345; ARCH_R = 0.42; WHEEL_Z = 0.345; TRACK = 0.81

def cabin(x):  # 0 over hood and boot, 1 over the passenger cell
    return smooth((1.05 - x) / 0.75) * smooth((x + 1.85) / 0.60)

def section(x):
    """Half cross-section at station x: list of (y, z) for k = 0..K-1 (y >= 0)."""
    w = hermite(HALF_W, x); zt = hermite(Z_TOP, x); zb = hermite(Z_BOT, x)
    zbelt = min(hermite(Z_BELT, x), zt - 0.02)
    c = cabin(x)
    pts = []
    for yf, zf in LOWER:
        pts.append([yf * w, zb + zf * (zbelt - zb)])
    for (yc, zc), (yh, zh) in zip(UP_CABIN, UP_HOOD):
        yf = yh + (yc - yh) * c; zf = zh + (zc - zh) * c
        pts.append([yf * w, zbelt + zf * (zt - zbelt)])
    # wheel arches cut into the side zone only (k2..k5)
    for xw in WHEEL_X:
        dx = abs(x - xw)
        if dx < ARCH_R:
            arch = WHEEL_Z + math.sqrt(ARCH_R ** 2 - dx ** 2)
            for k in (2, 3, 4):
                pts[k][1] = max(pts[k][1], min(arch + 0.012 * (k - 2), zbelt - 0.03 + 0.005 * k))
    for k in range(1, K):  # keep each section strictly rising
        if pts[k][1] < pts[k - 1][1] + 0.004: pts[k][1] = pts[k - 1][1] + 0.004
    return pts

STEP = 0.05
XS = [round(-2.3 + i * STEP, 4) for i in range(int(round(4.6 / STEP)) + 1)]
GRID = [section(x) for x in XS]          # GRID[i][k] = (y, z)

# ----------------------------------------------------------------------------- panel assignment
def panel_for(x, q):
    """Which panel owns the quad at station x (centre) and section interval q (k -> k+1)."""
    if x > 2.1: return 'bumper_front'
    if x < -2.15: return 'bumper_rear'
    top = q >= 5
    if top:
        if x >= 1.0: return 'hood'
        if x >= 0.3: return 'windshield'
        if x >= -1.0: return 'side_glass' if q <= 8 else 'roof'
        if x >= -1.75: return 'rear_glass'
        return 'trunk'
    if q in (3, 4):
        if 0.0 - 0.05 <= x < 0.95: return 'door_front'
        if -0.95 <= x < -0.05: return 'door_rear'
    return 'body_shell'

CENTER_PANELS = {'hood', 'windshield', 'roof', 'rear_glass', 'trunk', 'bumper_front', 'bumper_rear', 'body_shell', 'side_glass'}
SIDED = {'door_front', 'door_rear', 'side_glass'}  # one mesh per side


def build_panels():
    quads = {}  # name -> list of (side, i, q)
    for i in range(len(XS) - 1):
        xc = (XS[i] + XS[i + 1]) / 2
        for q in range(K - 1):
            name = panel_for(xc, q)
            for side in (-1, 1):  # -1 = near (-Y), +1 = far (+Y)
                key = f'{name}_{"near" if side < 0 else "far"}' if name in SIDED else name
                quads.setdefault(key, []).append((side, i, q))
    return quads


def make_mesh(name, qlist, collection):
    me = bpy.data.meshes.new(name)
    bm = bmesh.new()
    verts = {}
    li = bm.verts.layers.int.new('gi'); lk = bm.verts.layers.int.new('gk')
    def vert(side, i, k):
        y, z = GRID[i][k]
        # points on the centre plane are shared between both halves
        key = (0 if k in (0, K - 1) else side, i, k)
        if key not in verts:
            v = bm.verts.new((XS[i], y * side if y > 1e-9 else 0.0, z))
            v[li] = i; v[lk] = k
            verts[key] = v
        return verts[key]
    for side, i, q in qlist:
        vs = [vert(side, i, q), vert(side, i + 1, q), vert(side, i + 1, q + 1), vert(side, i, q + 1)]
        try:
            f = bm.faces.new(vs)
        except ValueError:
            continue
        f.normal_update()
        n = f.normal
        c = f.calc_center_median()
        if n.dot(c - Vector((0, 0, 0.7))) < 0: f.normal_flip()
        f.smooth = True
    if name in ('bumper_front', 'bumper_rear'):   # close the open end of the loft
        i = len(XS) - 1 if name == 'bumper_front' else 0
        loop = [vert(-1, i, k) for k in range(0, K)] + [vert(1, i, k) for k in range(K - 2, 0, -1)]
        try:
            cap = bm.faces.new(loop)
            cap.normal_update()
            if cap.normal.x * (1 if name == 'bumper_front' else -1) < 0: cap.normal_flip()
        except ValueError:
            pass
    bm.normal_update()
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    collection.objects.link(ob)
    return ob


def mark_contours(ob):
    """Seam = 'draw this edge as a line': rings every 6 stations plus a few long character lines."""
    me = ob.data
    gi = me.attributes.get('gi'); gk = me.attributes.get('gk')
    LONG = {4, 5, 9, 12}
    for e in me.edges:
        v0, v1 = e.vertices
        i0, i1 = gi.data[v0].value, gi.data[v1].value
        k0, k1 = gk.data[v0].value, gk.data[v1].value
        ring = (i0 == i1) and (i0 % 6 == 0)
        long_ = (k0 == k1) and (k0 in LONG)
        e.use_seam = False   # contour rings and long lines read as noise; keep only panel outlines and creases
    me.update()


def make_wheel(name, x, side, collection):
    """side -1 = near (-Y), +1 = far. Rim face points outwards."""
    N = 36
    K_ = WHEEL_R / 0.33
    TIRE = [(0.23, 0.100), (0.30, 0.112), (0.33, 0.090), (0.33, -0.090), (0.30, -0.112), (0.23, -0.100)]
    RIM = [(0.23, 0.100), (0.212, 0.060), (0.075, 0.060), (0.0, 0.075)]
    bm = bmesh.new()
    def ring(r, yo):
        r = r * K_
        return [bm.verts.new((r * math.cos(2 * math.pi * a / N), side * yo, r * math.sin(2 * math.pi * a / N))) for a in range(N)]
    def revolve(profile):
        rings = [ring(r, yo) for r, yo in profile]
        for j in range(len(rings) - 1):
            for a in range(N):
                b = (a + 1) % N
                v = [rings[j][a], rings[j][b], rings[j + 1][b], rings[j + 1][a]]
                if len(set(v)) == 4:
                    bm.faces.new(v)
        if profile[-1][0] == 0.0:  # close the hub
            pass
    revolve(TIRE)
    revolve(RIM)
    # five spokes, slightly proud of the rim face
    for s in range(5):
        a0 = 2 * math.pi * s / 5
        def p(r, da, yo): return bm.verts.new((r * math.cos(a0 + da), side * yo, r * math.sin(a0 + da)))
        pts = [p(0.085, -0.16, 0.074), p(0.205, -0.075, 0.067), p(0.205, 0.075, 0.067), p(0.085, 0.16, 0.074)]
        bm.faces.new(pts)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    ob.location = (x, side * TRACK, WHEEL_Z)
    collection.objects.link(ob)
    for p in me.polygons: p.use_smooth = False
    return ob


def build_wheels(col, objs):
    for x, nm in ((WHEEL_X[0], 'front'), (WHEEL_X[1], 'rear')):
        for side, sn in ((-1, 'near'), (1, 'far')):
            name = f'wheel_{nm}_{sn}'
            objs[name] = make_wheel(name, x, side, col)


def clear_scene():
    for o in list(bpy.data.objects): bpy.data.objects.remove(o, do_unlink=True)
    for m in list(bpy.data.meshes): bpy.data.meshes.remove(m)
    for c in list(bpy.data.collections): bpy.data.collections.remove(c)


def build():
    clear_scene()
    col = bpy.data.collections.new('Car'); bpy.context.scene.collection.children.link(col)
    quads = build_panels()
    objs = {}
    for name, ql in quads.items():
        objs[name] = make_mesh(name, ql, col)
        mark_contours(objs[name])
    build_wheels(col, objs)
    return col, objs

if __name__ == '__main__' or True:
    col, objs = build()
    result = {'parts': {k: len(v.data.polygons) for k, v in objs.items()}}
