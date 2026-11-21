"""Muscat street diorama for the Creative Screens van journey.
Design: docs/superpowers/specs/2026-11-20-muscat-diorama-journey-design.md

Run headless (from the repo root):
    blender --background --factory-startup --python 3d/build_street.py -- --render 3d/renders [--glb out.glb]
Or inside Blender:  exec(open(r'<repo>/3d/build_street.py').read())

Axes as in build_car.py: +X is the English driving direction, the web camera sits on -Y looking +Y, +Z up, metres.
Toy-like, not photoreal: rounded edges (bevel + hardened normals), soft materials, warm low sun.
Muscat-flavoured (flat roofs, crenellated parapets, arches, projecting wooden window screens, palms, a round
fort tower, a dhow, the Hajar ridge) but no real landmark. Generic vehicles, no manufacturer shapes or badges.

Each stop has grey `canvas_<n>_<service>` objects with clean 0..1 UVs and custom props {canvas, service};
the web fills them with artwork. Nothing that carries text is ever mirrored: the far-side van logo is rotated.
"""
import bpy, bmesh, json, math, random, sys, os
from mathutils import Vector, Matrix, noise

try:
    HERE = os.path.dirname(os.path.abspath(__file__))
except NameError:
    HERE = os.getcwd()
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from kit import *  # noqa: F401,F403  (palette, materials, MB, canvas, palm, fort_tower, render helpers)
from kit import _M, _principled, _math, _mixc, _strata_material  # noqa: E402
rng = random.Random(1970)

# ----------------------------------------------------------------------------- layout: src/data/diorama.json is shared with the web
CFG = json.load(open(os.path.join(REPO, 'src', 'data', 'diorama.json'), encoding='utf-8'))
LANE_Y = CFG['laneY']              # van drives in the near (right-hand) lane
STOPS = [(s['n'], s['service'], s['canvasX'], s['vanX']) for s in CFG['stops']]  # n, service, canvas x, van stop x
VAN_START, VAN_END = CFG['vanStart'], CFG['vanEnd']
PLINTH = (-42.0, 42.0, -9.0, 22.0)  # x0, x1, y0, y1
SEA_X = 30.0                       # corniche: water from here to the +X edge, behind the sea wall


# ----------------------------------------------------------------------------- diorama base, road, mountains, sea
def build_base(col):
    mb = MB(); x0, x1, y0, y1 = PLINTH
    mb.boxz(mat('board', 0.5), x0 - 0.6, x1 + 0.6, y0 - 0.6, y1 + 0.6, -2.9, -2.5)
    mb.boxz(mat('rock', 0.9), x0 + 0.05, x1 - 0.05, y0 + 0.05, y1 - 0.05, -2.5, -1.25)   # core, hidden behind the carved walls
    mb.boxz(mat('soil', 0.9), x0 + 0.05, SEA_X, y0 + 0.05, y1 - 0.05, -1.25, -0.3)
    mb.boxz(mat('soil', 0.9), SEA_X, x1 - 0.05, y0 + 0.05, 7.0, -1.25, -0.3)
    build_plinth_rock(col)
    g = mat('ground', 0.9)
    mb.boxz(g, x0, SEA_X, y0, y1, -0.3, 0.0)
    mb.boxz(g, SEA_X, x1, y0, 7.0, -0.3, 0.0)
    a = mat('asphalt', 0.85)
    mb.boxz(a, x0, x1, -3.5, 3.5, -0.3, 0.02)
    mb.boxz(a, -18.5, -9.5, 3.4, 5.8, -0.3, 0.02)              # lay-by for the parked minibus (stop 2)
    p = mat('paving', 0.8)
    mb.boxz(p, x0, x1, -6.6, -3.5, -0.3, 0.16)
    mb.boxz(p, x0, -18.5, 3.5, 6.6, -0.3, 0.16)
    mb.boxz(p, -9.5, x1, 3.5, 6.6, -0.3, 0.16)
    mb.boxz(p, -18.5, -9.5, 5.8, 6.6, -0.3, 0.16)
    ln = mat('line', 0.6)
    x = x0 + 1.0
    while x < x1 - 1.0:                                          # dashed centre line
        mb.boxz(ln, x, x + 2.0, -0.07, 0.07, 0.0, 0.035); x += 4.0
    for yy in (-3.3, 3.3):
        mb.boxz(ln, x0, x1, yy - 0.06, yy + 0.06, 0.0, 0.035)
    # near side: low white wall, then garden strip to the plinth edge
    mb.boxz(mat('plaster', 0.85), x0, x1, -7.0, -6.6, 0.0, 0.6)
    base = mb.finish('diorama_base', col, bevel=0.04)

    # the sea (resin-like water in a tray at the corniche end) and its sea wall + railing
    sw = MB()
    sw.boxz(sea_material(), SEA_X, x1, 7.0, y1, -1.2, -0.35)
    sw.boxz(mat('trim', 0.8), SEA_X - 0.4, x1, 6.6, 7.0, -0.3, 0.9)
    for xx in [SEA_X + 0.6 + i * 1.5 for i in range(8)]:
        sw.cyl(mat('metal', 0.4, 0.6), (xx, 6.8, 1.25), 0.04, 0.7, seg=8)
    sw.boxz(mat('metal', 0.4, 0.6), SEA_X, x1, 6.76, 6.84, 1.56, 1.62)
    sw.finish('sea', col, bevel=0.03)
    build_sea_foam(col)
    return base

def build_plinth_rock(col):
    """Carved rock walls around the plinth's cut edges (like a model cut out of the landscape): each wall is a grid
    pushed outward by fractal noise, with strata colours by height. Displacement fades to zero at the wall ends and
    at the top edge, so the corners close and the ground layer sits cleanly on top."""
    x0, x1, y0, y1 = PLINTH
    bm = bmesh.new(); lay = bm.loops.layers.color.new('Col')
    soil, rock, band = Vector(lin(PAL['soil'])[:3]), Vector(lin(PAL['rock'])[:3]), Vector(lin('#c9a77c')[:3])
    z_bot = -2.5
    def z_top(x, y):
        return -1.2 if (x > SEA_X and y > 7.0) else -0.3      # under the water the rock stops at the tray floor
    walls = [  # start, end, outward normal
        (Vector((x0, y0)), Vector((x1, y0)), Vector((0, -1))),
        (Vector((x1, y0)), Vector((x1, y1)), Vector((1, 0))),
        (Vector((x1, y1)), Vector((x0, y1)), Vector((0, 1))),
        (Vector((x0, y1)), Vector((x0, y0)), Vector((-1, 0))),
    ]
    rows = 10
    for a, b2, nrm in walls:
        length = (b2 - a).length
        cols = int(length / 0.5)
        grid = []
        for i in range(cols + 1):
            t = i / cols; p = a.lerp(b2, t)
            end_fade = min(1.0, (t * length) / 0.8, ((1 - t) * length) / 0.8)
            zt = z_top(p.x, p.y)
            col_v = []
            for j in range(rows + 1):
                z = z_bot + (zt - z_bot) * j / rows
                top_fade = min(1.0, (zt - z) / 0.35)
                n = noise.fractal(Vector((p.x * 0.55, p.y * 0.55, z * 0.9)), 0.6, 2.2, 4)
                off = (0.18 + 0.32 * n) * end_fade * max(0.0, top_fade)
                col_v.append(bm.verts.new((p.x + nrm.x * off, p.y + nrm.y * off, z)))
            grid.append(col_v)
        for i in range(cols):
            for j in range(rows):
                f = bm.faces.new((grid[i][j], grid[i + 1][j], grid[i + 1][j + 1], grid[i][j + 1]))
                for lp in f.loops:
                    z = lp.vert.co.z
                    h = (z - z_bot) / 2.2                                     # 0 at the bottom, 1 at ground level
                    c = rock.lerp(soil, max(0.0, min(1.0, (h - 0.35) / 0.4)))
                    stripe = 0.5 + 0.5 * math.sin(z * 9.0 + noise.noise(Vector((lp.vert.co.x * 0.3, lp.vert.co.y * 0.3, 0))) * 3.0)
                    if stripe > 0.93:
                        c = c.lerp(band, 0.55)
                    c = c * (0.9 + 0.2 * noise.noise(lp.vert.co * 1.7))
                    lp[lay] = (c.x, c.y, c.z, 1.0)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    for f in bm.faces:                                    # make sure every wall faces outward
        cen = f.calc_center_median()
        out = Vector((cen.x - (x0 + x1) / 2, cen.y - (y0 + y1) / 2, 0))
        if f.normal.to_2d().dot(out.to_2d()) < 0:
            f.normal_flip()
    me = bpy.data.meshes.new('plinth_rock'); bm.to_mesh(me); bm.free()
    me.materials.append(_strata_material()); me.shade_smooth()
    ob = bpy.data.objects.new('plinth_rock', me); col.objects.link(ob)
    return ob

def sea_material():
    """Darker toward the back: light teal at the sea wall, deep blue-green at the plinth's back edge."""
    if 'sea_grad' in _M:
        return _M['sea_grad']
    m = bpy.data.materials.new('sea_grad'); nt, b = _principled(m)
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['Object'], sep.inputs[0])
    mr = nt.nodes.new('ShaderNodeMapRange')
    mr.inputs['From Min'].default_value = 7.0; mr.inputs['From Max'].default_value = PLINTH[3]
    nt.links.new(sep.outputs[1], mr.inputs['Value'])
    c = _mixc(nt, mr.outputs[0], lin('#3aa0ad'), lin('#12465a'))
    nt.links.new(c, b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.08
    m.diffuse_color = lin('#2e8c9a'); _M['sea_grad'] = m
    return m

def build_sea_foam(col):
    """White foam where the water meets the sea wall and around the dhow, as thin noise-edged quads on the water."""
    x1, y1 = PLINTH[1], PLINTH[3]
    mb = MB(); foam = mat('foam', 0.6, hexc='#f4f7f5')
    z = -0.34
    x = SEA_X + 0.1
    while x < x1 - 0.1:
        w = 0.25 + 0.35 * (0.5 + 0.5 * noise.noise(Vector((x * 0.8, 0.0, 0.0))))
        mb.poly(foam, [(x, 7.02, z), (x + 0.5, 7.02, z), (x + 0.5, 7.02 + w, z), (x, 7.02 + w * 0.8, z)])
        x += 0.5
    r = random.Random(5)
    for k in range(26):                                   # broken foam lines further out
        cx, cy = r.uniform(SEA_X + 0.8, x1 - 0.8), r.uniform(8.0, y1 - 0.8)
        L = r.uniform(0.6, 1.8); a = r.uniform(-0.3, 0.3)
        d = Vector((math.cos(a), math.sin(a), 0)) * L / 2; s = Vector((-d.y, d.x, 0)).normalized() * 0.06
        c = Vector((cx, cy, z))
        mb.poly(foam, [c - d - s, c + d - s, c + d + s, c - d + s])
    return mb.finish('sea_foam', col, bevel=0.0, recalc=False)

def build_mountains(col):
    """Stylised Hajar ridge on the back strip, cut flat at the plinth's back and left edges (diorama cut)."""
    xs = [PLINTH[0] + i * 0.75 for i in range(int((SEA_X - PLINTH[0]) / 0.75) + 1)]
    ys = [13.5 + j * 0.5 for j in range(int((PLINTH[3] - 13.5) / 0.5) + 1)]
    sm = lambda t: (lambda c: c * c * (3 - 2 * c))(max(0.0, min(1.0, t)))
    def h(x, y):
        ridge = 7.0 + 2.6 * math.sin(0.11 * x + 0.5) + 1.7 * math.sin(0.27 * x + 2.1) + 0.8 * math.sin(0.63 * x + 0.7)
        bumps = 0.25 * math.sin(1.1 * x + 1.6 * y) + 0.3 * math.sin(0.55 * x - 1.3 * y)
        return max(0.0, (ridge + bumps) * sm((y - 13.5) / 5.5) * sm((SEA_X - x) / 7.0))
    bm = bmesh.new(); top = []
    for y in ys:
        top.append([bm.verts.new((x, y, h(x, y))) for x in xs])
    for j in range(len(ys) - 1):
        for i in range(len(xs) - 1):
            bm.faces.new((top[j][i], top[j][i + 1], top[j + 1][i + 1], top[j + 1][i]))
    # skirts: back edge and left edge down to the ground
    back = top[-1]; bb = [bm.verts.new((v.co.x, v.co.y, -0.3)) for v in back]
    for i in range(len(back) - 1):
        bm.faces.new((back[i], bb[i], bb[i + 1], back[i + 1]))
    left = [row[0] for row in top]; lb = [bm.verts.new((v.co.x, v.co.y, -0.3)) for v in left]
    for j in range(len(left) - 1):
        bm.faces.new((left[j + 1], lb[j + 1], lb[j], left[j]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    # height-based colour: darker gullies, lighter ridges
    lay = bm.loops.layers.color.new('Col')
    lo, hi = Vector(lin('#7f6048')[:3]), Vector(lin('#c9ab86')[:3])
    for f in bm.faces:
        for lp in f.loops:
            t = max(0.0, min(1.0, lp.vert.co.z / 11.0)) ** 0.8
            c = lo.lerp(hi, t); lp[lay] = (c.x, c.y, c.z, 1.0)
    me = bpy.data.meshes.new('mountains'); bm.to_mesh(me); bm.free()
    m = bpy.data.materials.new('mountain'); nt, b = _principled(m); add_bump(m, 'rock')
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.95
    m.diffuse_color = lin('#b07f55')
    me.materials.append(m); me.shade_smooth()
    ob = bpy.data.objects.new('mountains', me); col.objects.link(ob)
    return ob

# ----------------------------------------------------------------------------- buildings
WALLS = ['plaster', 'sand', 'beige', 'peach', 'plaster', 'terracotta', 'plaster']

def window(mb, style, x, y, z, wall_m):
    glass, wood, teal, trim = mat('glass', 0.15), mat('wood', 0.7), mat('teal', 0.6), mat('trim', 0.8)
    if style == 'bay':                       # projecting wooden screen (mashrabiya-style)
        mb.boxz(wood, x - 0.65, x + 0.65, y - 0.5, y + 0.05, z, z + 1.7)
        for k in range(5):
            xx = x - 0.44 + k * 0.22
            mb.boxz(mat('lattice', 0.8), xx - 0.035, xx + 0.035, y - 0.52, y - 0.48, z + 0.2, z + 1.5)
        mb.boxz(trim, x - 0.75, x + 0.75, y - 0.58, y + 0.05, z + 1.7, z + 1.85)
        mb.boxz(trim, x - 0.72, x + 0.72, y - 0.56, y + 0.05, z - 0.12, z)
    elif style == 'arch':
        arch(mb, trim, x, y, z - 0.1, 1.2, 1.9, depth=0.06)
        arch(mb, glass, x, y - 0.03, z, 0.95, 1.7, depth=0.06)
    else:                                    # plain window with open teal shutters
        mb.boxz(glass, x - 0.45, x + 0.45, y - 0.06, y + 0.02, z, z + 1.35)
        mb.boxz(teal, x - 0.95, x - 0.5, y - 0.08, y + 0.02, z - 0.02, z + 1.37)
        mb.boxz(teal, x + 0.5, x + 0.95, y - 0.08, y + 0.02, z - 0.02, z + 1.37)
        mb.boxz(trim, x - 0.6, x + 0.6, y - 0.14, y + 0.02, z - 0.12, z)

def building(col, name, x0, x1, y0, depth, h, wall='plaster', ground='door', style=None, dome=False,
             tank=None, bloom=None, floors=None, crenel=True):
    mb = MB(); W = mat(wall, 0.85); trim = mat('trim', 0.8)
    y1 = y0 + depth
    mb.boxz(W, x0, x1, y0, y1, 0.0, h)
    mb.boxz(trim, x0 - 0.1, x1 + 0.1, y0 - 0.1, y1 + 0.1, h, h + 0.3)             # cornice
    if crenel:                                                                    # stepped merlons on the parapet
        n = max(2, int((x1 - x0 - 0.4) / 0.8))
        for i in range(n + 1):
            x = x0 + 0.25 + i * (x1 - x0 - 0.5) / n
            mb.boxz(W, x - 0.17, x + 0.17, y0 - 0.06, y0 + 0.24, h + 0.3, h + 0.72)
            mb.boxz(W, x - 0.08, x + 0.08, y0 - 0.04, y0 + 0.2, h + 0.72, h + 0.9)
    floors = floors or max(1, round(h / 3.4))
    fh = h / floors
    bays = max(1, int((x1 - x0) / 2.3))
    bx = [x0 + (x1 - x0) * (i + 0.5) / bays for i in range(bays)]
    style = style or rng.choice(['bay', 'shutter', 'arch'])
    if ground == 'door':
        di = rng.randrange(bays)
        arch(mb, trim, bx[di], y0, 0.0, 1.7, 2.75, depth=0.06)
        arch(mb, mat('door', 0.7), bx[di], y0 - 0.03, 0.0, 1.3, 2.45, depth=0.08)
        for i, x in enumerate(bx):
            if i != di:
                window(mb, 'shutter' if style != 'arch' else 'arch', x, y0, 0.9, W)
    for f in range(1, floors):
        for x in bx:
            window(mb, style, x, y0, f * fh + 0.7, W)
    # roof clutter: AC units and a water tank (very Muscat)
    for k in range(rng.randint(1, 3)):
        ax = rng.uniform(x0 + 0.8, x1 - 0.8); ay = rng.uniform(y0 + 1.5, y1 - 1.0)
        mb.boxz(mat('ac', 0.6), ax - 0.45, ax + 0.45, ay - 0.3, ay + 0.3, h, h + 0.6)
    if tank if tank is not None else rng.random() < 0.6:
        tx = rng.uniform(x0 + 1.0, x1 - 1.0); ty = y1 - 1.2
        for dx in (-0.35, 0.35):
            mb.boxz(mat('metal', 0.5, 0.5), tx + dx - 0.04, tx + dx + 0.04, ty - 0.04, ty + 0.04, h, h + 0.5)
        mb.cyl(mat('tank', 0.5), (tx, ty, h + 1.0), 0.55, 1.0, seg=18)
    if dome:
        dx = (x0 + x1) / 2; dy = y0 + depth / 2
        mb.cyl(W, (dx, dy, h + 0.45), 1.35, 0.9, seg=24)
        mb.sphere(mat('trim', 0.6), (dx, dy, h + 0.9), 1.35, seg=24, hemi=True)
        mb.cyl(mat('metal', 0.3, 0.8), (dx, dy, h + 2.4), 0.05, 0.5, seg=8)
    if bloom:                                                                     # bougainvillea climbing the wall from a planter
        mb.boxz(trim, bloom - 0.6, bloom + 0.6, y0 - 0.6, y0, 0.0, 0.5)
        mb.sphere(mat('shrub', 0.8), (bloom, y0 - 0.3, 0.75), 0.45, scale=(1.3, 0.7, 1.0), seg=10)
        for k in range(4):
            mb.sphere(mat('shrub', 0.8), (bloom + rng.uniform(-0.5, 0.5), y0 - 0.2, 1.2 + k * 0.5), 0.3, scale=(1.2, 0.6, 1.0), seg=10)
        for k in range(8):
            mb.sphere(mat('bloom', 0.8), (bloom + rng.uniform(-1.1, 1.1), y0 - 0.25, rng.uniform(2.2, 3.4)),
                      rng.uniform(0.28, 0.45), scale=(1, 0.6, 0.8), seg=10)
    return mb, mb.finish(name, col, bevel=0.05)

def fill(col, xa, xb, tag, hmin=4.5, hmax=10.5):
    x = xa; i = 0
    while x < xb - 3.5:
        w = min(rng.uniform(5.0, 8.5), xb - x)
        if xb - (x + w) < 3.5:
            w = xb - x
        h = rng.choice([4.2, 4.6, 7.0, 7.4, 10.2, 6.8])
        h = max(hmin, min(hmax, h))
        y0 = rng.choice([6.8, 7.0, 7.3])
        building(col, f'bldg_{tag}_{i}', x + 0.05, x + w - 0.05, y0, rng.uniform(6.0, 7.2), h,
                 wall=rng.choice(WALLS), dome=rng.random() < 0.18,
                 bloom=(x + w * 0.3) if rng.random() < 0.3 else None)
        x += w; i += 1

# ----------------------------------------------------------------------------- props
def lamp(mb, x, y, toward=1):
    m = mat('metal', 0.45, 0.6)
    mb.cyl(m, (x, y, 2.7), 0.07, 5.2, seg=10)
    mb.cyl(m, (x, y, 0.35), 0.16, 0.4, seg=12)
    mb.boxz(m, x - 0.04, x + 0.04, min(y, y + toward * 1.3), max(y, y + toward * 1.3), 5.15, 5.23)
    hy = y + toward * 1.45
    mb.boxz(m, x - 0.25, x + 0.25, hy - 0.14, hy + 0.14, 5.0, 5.18)
    mb.boxz(mat('lamp', 0.3, emit=3.0), x - 0.2, x + 0.2, hy - 0.1, hy + 0.1, 4.97, 5.0)

def build_props(col):
    mb = MB()
    # Near side sits between the follow camera and the van: palms only where they can't hide the van at a stop
    # (van spans about vx +-2.6) or a canvas. Lamps are thin, so they go between stops.
    pm = MB()
    for i, x in enumerate([-41.0, 20.5, 41.3]):
        palm(pm, x, -5.6, h=rng.uniform(4.6, 5.2), seed=i)
    for x in [-30.0, -16.5, 1.0, 13.0, 33.5]:                                       # low planters on the near pavement
        mb.boxz(mat('trim', 0.8), x - 0.7, x + 0.7, -6.3, -5.3, 0.16, 0.6)
        for k in range(3):
            mb.sphere(mat('shrub', 0.85), (x - 0.4 + k * 0.4, -5.8, 0.75), rng.uniform(0.3, 0.42), scale=(1, 1, 0.8), seg=10)
    for i, x in enumerate([-38.5, -8.5, 7.5, 27.5]):                               # far-side palms
        palm(pm, x, 5.9, h=rng.uniform(5.2, 6.2), seed=10 + i)
    for x in [-40.0, -24.5, -11.0, 0.5, 17.0, 33.0]:
        lamp(mb, x, -4.0, toward=1)
    for k in range(70):                                                             # garden strip shrubs + bougainvillea on the near wall
        x = rng.uniform(PLINTH[0] + 0.6, PLINTH[1] - 0.6)
        mb.sphere(mat('shrub', 0.85), (x, rng.uniform(-8.6, -7.4), 0.25), rng.uniform(0.35, 0.65), scale=(1.2, 1, 0.8), seg=10)
    for x in [-36.0, -19.0, -4.5, 9.0, 31.0]:
        for k in range(6):
            mb.sphere(mat('bloom', 0.8), (x + rng.uniform(-1.2, 1.2), -6.85, 0.6 + rng.uniform(0.0, 0.35)),
                      rng.uniform(0.25, 0.4), scale=(1, 0.8, 0.8), seg=10)
    mb.finish('props', col, bevel=0.0)
    pm.finish('palms', col, bevel=0.0)          # its own mesh: the web sways the palms, not the lamps

    # a dhow on the water behind the corniche
    dh = dhow(col, 'dhow')
    dh.location = (37.0, 15.0, -0.55); dh.rotation_euler = (0, 0, math.radians(-25))

# ----------------------------------------------------------------------------- vehicles
WHEEL_X, ARCH_R, SILL = 1.75, 0.47, 0.45

def _arch(cx):
    """Wheel-arch notch in the side profile, left to right over the top of the wheel."""
    return [(cx + ARCH_R * math.cos(math.pi * (1 - i / 10)), SILL + ARCH_R * math.sin(math.pi * (1 - i / 10))) for i in range(11)]

# side profile (x, z): a modern high-roof van with a short sloped bonnet, a raked windscreen and real wheel arches.
# Generic proportions (no manufacturer's shape).
VAN_PROF = ([(-2.8, SILL)] + _arch(-WHEEL_X) + _arch(WHEEL_X)
            + [(2.8, SILL), (2.86, 0.9), (2.76, 1.12), (2.3, 1.32), (1.85, 1.42), (1.25, 2.38), (1.0, 2.6),
               (-2.72, 2.62), (-2.8, 2.52)])

def _wheel(col, name, x, y, r=0.38, w=0.28, parent=None):
    mb = MB()
    mb.cyl(mat('tyre', 0.85), (0, 0, 0), r, w, seg=28, axis='Y')
    mb.cyl(mat('rim', 0.35, 0.7), (0, 0, 0), r * 0.58, w + 0.02, seg=20, axis='Y')
    mb.cyl(mat('metal', 0.4, 0.6), (0, 0, 0), r * 0.18, w + 0.05, seg=12, axis='Y')
    for k in range(5):                                                   # spokes make the rotation readable
        a = k / 5 * math.tau
        mb.box(mat('metal', 0.4, 0.6), (r * 0.36 * math.cos(a), 0, r * 0.36 * math.sin(a)), (0.05, w + 0.04, 0.16), ry=-a)
    ob = mb.finish(name, col, bevel=0.02)
    ob.location = (x, y, r)
    if parent:
        ob.parent = parent
    return ob

def import_logo(col, name, x0, x1, zc, y, far=False):
    """The real wordmark (public/img/logo-wordmark.svg) as a thin lime mesh, or a lime placeholder bar.
    Far side: rotated 180 deg about Z, never mirrored, so it reads correctly from either side."""
    path = os.path.join(REPO, 'public', 'img', 'logo-wordmark.svg')
    before = set(bpy.data.objects)
    ok = False
    try:
        bpy.ops.import_curve.svg(filepath=path)
        ok = True
    except Exception as e:
        print('svg import unavailable:', e)
    new = [o for o in bpy.data.objects if o not in before]
    for c in [c for c in bpy.data.collections if c.name.startswith('logo-wordmark')]:   # the importer's own collection
        bpy.data.collections.remove(c)
    lime = mat('lime', 0.5)
    bm = bmesh.new()
    if ok and new:
        dg = bpy.context.evaluated_depsgraph_get()
        for o in new:
            if o.type == 'CURVE':
                o.data.extrude = 0.0; o.data.fill_mode = 'BOTH'
        dg.update()
        for o in new:
            if o.type in ('CURVE', 'MESH'):
                me = bpy.data.meshes.new_from_object(o.evaluated_get(dg))
                me.transform(o.matrix_world); bm.from_mesh(me); bpy.data.meshes.remove(me)
        for o in new:
            bpy.data.objects.remove(o, do_unlink=True)
    if not bm.verts:
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=0.5)
        bmesh.ops.scale(bm, vec=(15.0, 1.0, 1.0), verts=bm.verts[:])
        ok = False
    # fit into x0..x1 in the XY plane, centred, then stand it up facing -Y
    xs = [v.co.x for v in bm.verts]; ys = [v.co.y for v in bm.verts]
    s = (x1 - x0) / (max(xs) - min(xs))
    cx, cy = (max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2
    bmesh.ops.translate(bm, vec=(-cx, -cy, -min(v.co.z for v in bm.verts)), verts=bm.verts[:])
    bmesh.ops.scale(bm, vec=(s, s, 1.0), verts=bm.verts[:])
    bmesh.ops.rotate(bm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / 2, 3, 'X'), verts=bm.verts[:])
    for f in bm.faces:
        f.material_index = 0
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free(); me.materials.append(lime)
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    ob.location = ((x0 + x1) / 2, y, zc)
    if far:
        ob.rotation_euler = (0, 0, math.pi)
        ob.location.x = (x0 + x1) / 2
    ob['logo'] = 'wordmark' if ok else 'placeholder'
    return ob

def build_van(col):
    """The Creative Screens van: high roof, spare wheel on the rear door, rear ladder, roof rack with a roof box,
    black lower trim, angled headlights; navy with a lime band and the wordmark on both flanks (never mirrored)."""
    rig = bpy.data.objects.new('van', None); col.objects.link(rig)
    rig.empty_display_type = 'ARROWS'; rig.location = (VAN_START, LANE_Y, 0)
    mb = MB(); navy = mat('navy', 0.3, coat=0.7, name='van_paint', hexc=PAL['navy'])
    mb.prism(navy, VAN_PROF, -1.0, 1.0)
    glass = mat('glass', 0.12); lime = mat('lime', 0.5); dark = mat('dark', 0.8); trim = mat('dark', 0.6, name='van_trim')
    rack = mat('metal', 0.4, 0.6)
    # windscreen along the raked line
    a, b = Vector((1.85, 1.42)), Vector((1.25, 2.38)); nrm = Vector((0.96, 0.6)).normalized() * 0.014
    p0, p1 = a.lerp(b, 0.06) + nrm, a.lerp(b, 0.94) + nrm
    mb.poly(glass, [(p0.x, -0.86, p0.y), (p0.x, 0.86, p0.y), (p1.x, 0.86, p1.y), (p1.x, -0.86, p1.y)])
    for sy in (-1.0, 1.0):
        y = sy * 1.012
        mb.side_poly(dark, [(0.44, 1.48), (1.84, 1.48), (1.3, 2.36), (0.44, 2.36)], sy * 1.010)          # window frame
        mb.side_poly(glass, [(0.5, 1.54), (1.74, 1.54), (1.27, 2.3), (0.5, 2.3)], y)                       # cab window
        mb.side_poly(lime, [(-2.75, 1.18), (2.2, 1.18), (2.2, 1.31), (-2.75, 1.31)], y)                    # lime band
        for x0, x1 in ((-2.78, -WHEEL_X - ARCH_R - 0.02), (-WHEEL_X + ARCH_R + 0.02, WHEEL_X - ARCH_R - 0.02), (WHEEL_X + ARCH_R + 0.02, 2.78)):
            mb.side_poly(trim, [(x0, SILL + 0.01), (x1, SILL + 0.01), (x1, 0.66), (x0, 0.66)], sy * 1.011)  # black lower trim
        mb.boxz(dark, 0.22, 0.4, sy * 1.0 - 0.03, sy * 1.0 + 0.03, 1.42, 1.48)                              # door handle
        mb.box(navy, (1.72, sy * 1.1, 1.78), (0.14, 0.22, 0.26))                                            # mirror
    mb.side_poly(dark, [(0.18, SILL + 0.2), (0.22, SILL + 0.2), (0.22, 2.5), (0.18, 2.5)], -1.014)       # sliding door seam
    for wx in (WHEEL_X, -WHEEL_X):                                                                      # dark wheel wells
        mb.boxz(dark, wx - ARCH_R, wx + ARCH_R, -0.98, 0.98, SILL - 0.02, SILL + ARCH_R + 0.02)
    # front: bumper, grille, angled headlights
    mb.boxz(trim, 2.7, 2.98, -0.98, 0.98, 0.32, 0.72)
    mb.box(dark, (2.84, 0, 1.0), (0.05, 0.9, 0.16), ry=math.radians(-25))
    for sy in (-1, 1):
        mb.box(mat('head', 0.2, emit=2.0), (2.8, sy * 0.72, 1.06), (0.06, 0.32, 0.14), ry=math.radians(-25))
    # rear: bumper, door seam, windows, tail lights, the spare wheel on the door, a ladder
    mb.boxz(trim, -2.98, -2.7, -0.98, 0.98, 0.32, 0.66)
    mb.poly(dark, [(-2.812, -0.01, 0.62), (-2.812, 0.01, 0.62), (-2.812, 0.01, 2.48), (-2.812, -0.01, 2.48)])
    for sy in (-1, 1):
        mb.poly(glass, [(-2.814, sy * 0.1, 1.72), (-2.814, sy * 0.82, 1.72), (-2.814, sy * 0.82, 2.3), (-2.814, sy * 0.1, 2.3)][:: -sy])
        mb.box(mat('tail', 0.3, emit=1.5), (-2.81, sy * 0.86, 1.55), (0.05, 0.14, 0.5))
    mb.cyl(mat('tyre', 0.85), (-2.95, 0.3, 1.2), 0.36, 0.24, seg=24, axis='X')
    mb.cyl(mat('rim', 0.35, 0.7), (-3.0, 0.3, 1.2), 0.2, 0.2, seg=16, axis='X')
    mb.cyl(navy, (-3.08, 0.3, 1.2), 0.24, 0.04, seg=20, axis='X')                                      # wheel cover
    for ly in (-0.78, -0.5):
        mb.boxz(rack, -2.9, -2.86, ly - 0.025, ly + 0.025, 0.75, 2.66)
    for k in range(6):
        z = 0.95 + k * 0.3
        mb.boxz(rack, -2.9, -2.86, -0.8, -0.48, z - 0.02, z + 0.02)
    # roof: a low rack and a rounded roof box
    for ry in (-0.78, 0.78):
        mb.boxz(rack, -2.5, 0.85, ry - 0.04, ry + 0.04, 2.64, 2.72)
    for rx in (-2.3, -1.4, -0.5, 0.4):
        mb.boxz(rack, rx - 0.035, rx + 0.035, -0.8, 0.8, 2.7, 2.75)
    mb.boxz(mat('ac', 0.5, name='roof_box'), -2.05, 0.3, -0.62, 0.62, 2.75, 2.98)
    body = mb.finish('van_body', col, bevel=0.12, segments=4, recalc=False)
    body.parent = rig
    for nm, x, y in (('van_wheel_fl', WHEEL_X, -0.9), ('van_wheel_rl', -WHEEL_X, -0.9), ('van_wheel_fr', WHEEL_X, 0.9), ('van_wheel_rr', -WHEEL_X, 0.9)):
        w = _wheel(col, nm, x, y, parent=rig)
        fc = w.driver_add('rotation_euler', 1); d = fc.driver; d.type = 'SCRIPTED'
        v = d.variables.new(); v.name = 'x'; v.type = 'TRANSFORMS'
        v.targets[0].id = rig; v.targets[0].transform_type = 'LOC_X'; v.targets[0].transform_space = 'WORLD_SPACE'
        d.expression = 'x / 0.38'
    ln = import_logo(col, 'van_logo_near', -2.45, 0.2, 1.88, -1.016)
    lf = import_logo(col, 'van_logo_far', -2.45, 0.2, 1.88, 1.016, far=True)
    for o in (ln, lf):
        o.parent = rig
    return rig

def build_minibus(col_stop):
    """Stop 2: a generic white minibus parked in the lay-by; its near flank is the canvas."""
    x, y = -14.0, 4.65
    mb = MB(); white = mat('bus', 0.45); glass = mat('glass', 0.12); dark = mat('dark', 0.8)
    prof = [(-3.1, 0.4), (3.1, 0.4), (3.1, 1.2), (2.95, 1.35), (2.45, 2.45), (2.2, 2.6), (-3.1, 2.6)]
    mb.prism(white, prof, -1.0, 1.0)
    for sy in (-1, 1):
        for k in range(5):
            wx = -2.85 + k * 1.02
            mb.side_poly(glass, [(wx, 1.68), (wx + 0.88, 1.68), (wx + 0.88, 2.36), (wx, 2.36)], sy * 1.012)
        mb.side_poly(glass, [(2.3, 1.68), (2.75, 1.68), (2.5, 2.3), (2.3, 2.3)], sy * 1.012)
        for wx in (2.0, -2.0):
            mb.side_poly(dark, [(wx + 0.5 * math.cos(t * math.pi / 12), 0.4 + 0.5 * math.sin(t * math.pi / 12) * 0.85)
                                for t in range(13)], sy * 1.008)
    a, b = Vector((2.95, 1.35)), Vector((2.45, 2.45)); nrm = Vector((1.1, 0.5)).normalized() * 0.014
    p0, p1 = a.lerp(b, 0.1) + nrm, a.lerp(b, 0.9) + nrm
    mb.poly(glass, [(p0.x, -0.85, p0.y), (p0.x, 0.85, p0.y), (p1.x, 0.85, p1.y), (p1.x, -0.85, p1.y)])
    mb.boxz(dark, 2.95, 3.22, -0.98, 0.98, 0.28, 0.56); mb.boxz(dark, -3.22, -2.95, -0.98, 0.98, 0.28, 0.56)
    for sy in (-1, 1):
        mb.box(mat('head', 0.2, emit=0.5, name='head_off'), (3.11, sy * 0.7, 0.98), (0.05, 0.34, 0.15))
    bus = mb.finish('minibus', col_stop, bevel=0.1, segments=3, recalc=False)
    bus.location = (x, y, 0.0)
    for nm, wx, wy in (('minibus_wheel_fl', 2.0, -0.9), ('minibus_wheel_rl', -2.0, -0.9),
                       ('minibus_wheel_fr', 2.0, 0.9), ('minibus_wheel_rr', -2.0, 0.9)):
        w = _wheel(col_stop, nm, wx, wy, r=0.36, parent=bus)
        w.location = (wx, wy, 0.36)
    c = canvas(col_stop, 2, 'wrap', x - 2.95, x + 2.8, 0.92, 1.58, y - 1.016, nu=8, nv=2)
    return bus, c

# ----------------------------------------------------------------------------- the five stops
def build_stops(col_bldg, col_stop):
    # 1. Shopfront signage: a café/shop with a blank fascia sign
    mb, shop = building(col_bldg, 'shop_stop1', -32.0, -24.0, 6.9, 6.8, 7.0, wall='plaster', ground='shop',
                        style='bay', floors=2, tank=True)
    s = MB(); y0 = 6.9
    s.boxz(mat('shop_glass', 0.15), -31.2, -24.8, y0 - 0.08, y0 + 0.02, 0.2, 2.9)
    for xx in (-31.25, -29.1, -26.95, -24.8):
        s.boxz(mat('dark', 0.6), xx - 0.07, xx + 0.07, y0 - 0.12, y0 + 0.02, 0.0, 3.0)
    s.boxz(mat('door', 0.7), -28.55, -27.55, y0 - 0.1, y0 + 0.02, 0.0, 2.6)
    s.boxz(mat('dark', 0.6), -31.4, -24.6, y0 - 0.45, y0 + 0.02, 3.15, 4.45)                # sign box
    s.boxz(mat('teal', 0.6), -31.3, -24.7, y0 - 1.5, y0 + 0.02, 2.95, 3.08)                 # awning (flat, toy-like)
    for xx in (-31.0, -25.0):
        s.cyl(mat('metal', 0.4, 0.6), (xx, y0 - 1.4, 1.5), 0.035, 3.0, seg=8)
    for k, xx in enumerate((-30.4, -26.0)):                                                  # café tables
        s.cyl(mat('trim', 0.6), (xx, y0 - 0.85 + 0.0, 0.95), 0.32, 0.05, seg=16)
        s.cyl(mat('metal', 0.4, 0.6), (xx, y0 - 0.85, 0.55), 0.04, 0.8, seg=8)
    s.finish('shop_front', col_stop, bevel=0.03)
    canvas(col_stop, 1, 'signage', -31.2, -24.8, 3.25, 4.35, y0 - 0.462)

    # 2. Vehicle wrap: the minibus
    build_minibus(col_stop)

    # 3. LED screen on a taller building
    building(col_bldg, 'tower_stop3', -4.0, 5.0, 6.9, 7.4, 14.4, wall='sand', style='shutter', floors=4, tank=True)
    l = MB(); y0 = 6.9
    l.boxz(mat('dark', 0.5), -3.1, 4.1, y0 - 0.4, y0 + 0.02, 7.0, 11.1)
    for xx in (-2.4, 3.4):
        l.boxz(mat('metal', 0.4, 0.6), xx - 0.08, xx + 0.08, y0 - 0.3, y0, 6.4, 7.0)
    l.finish('led_frame', col_stop, bevel=0.04)
    canvas(col_stop, 3, 'led', -2.85, 3.85, 7.2, 10.9, y0 - 0.412)

    # 4. Exhibition stand in a small plaza
    pz = MB(); P = mat('plaza', 0.75); Wt = mat('trim', 0.6); Mt = mat('metal', 0.4, 0.6)
    pz.boxz(P, 9.5, 20.0, 6.6, 14.5, -0.1, 0.12)
    for k in range(10):                                                                     # paving joints
        xx = 9.5 + k * 1.05
        pz.boxz(mat('paving', 0.8), xx, xx + 0.04, 6.6, 14.5, 0.12, 0.125)
    pz.boxz(Wt, 11.5, 17.5, 8.5, 12.0, 0.12, 0.3)                                            # stand platform
    pz.boxz(Wt, 11.6, 17.4, 11.6, 11.95, 0.3, 3.3)                                           # back wall
    for xx in (11.65, 17.35):
        pz.boxz(Mt, xx - 0.07, xx + 0.07, 8.55, 8.69, 0.3, 3.5)
        pz.boxz(Mt, xx - 0.07, xx + 0.07, 8.55, 11.9, 3.36, 3.5)
    pz.boxz(Wt, 11.5, 17.5, 8.45, 8.7, 3.0, 3.55)                                            # header fascia
    pz.boxz(Wt, 13.2, 15.8, 9.2, 9.9, 0.3, 1.3)                                              # counter
    for xx in (12.4, 16.6):                                                                  # stools
        pz.cyl(Mt, (xx, 9.6, 0.65), 0.04, 0.7, seg=8); pz.cyl(mat('lime', 0.5), (xx, 9.6, 1.02), 0.2, 0.07, seg=16)
    for xx in (10.6, 18.9):                                                                  # benches
        pz.boxz(mat('wood', 0.7), xx - 0.9, xx + 0.9, 7.1, 7.5, 0.45, 0.55)
        for dx in (-0.7, 0.7):
            pz.boxz(Mt, xx + dx - 0.05, xx + dx + 0.05, 7.15, 7.45, 0.12, 0.45)
    pz.finish('plaza_stand', col_stop, bevel=0.03)
    pm = MB()
    palm(pm, 10.2, 13.2, h=5.8, seed=31); palm(pm, 19.3, 13.4, h=6.3, seed=32)
    pm.finish('plaza_palms', col_stop, bevel=0.0)
    canvas(col_stop, 4, 'stand', 11.9, 17.1, 0.55, 3.15, 11.585, part='wall')
    canvas(col_stop, 4, 'stand', 11.6, 17.4, 3.06, 3.49, 8.435, part='header')
    canvas(col_stop, 4, 'stand', 13.3, 15.7, 0.42, 1.2, 9.185, part='counter')

    # 5. Flags & banners on the corniche
    f = MB(); Mt = mat('metal', 0.4, 0.6)
    flag_x = [29.2, 31.0, 32.8, 34.6]
    for i, px in enumerate(flag_x):
        f.cyl(Mt, (px, 5.9, 2.65), 0.035, 5.0, seg=8)
        f.box(mat('dark', 0.7), (px, 5.9, 0.2), (0.8, 0.08, 0.06)); f.box(mat('dark', 0.7), (px, 5.9, 0.2), (0.08, 0.8, 0.06))
        top, w = 4.95, 0.85
        def shape(u, v, px=px, top=top, w=w):
            z = 1.0 + (top - 1.0) * v
            width = w * (0.78 + 0.22 * min(1.0, v / 0.2)) * (1.0 - 0.9 * max(0.0, (v - 0.72) / 0.28) ** 2)
            return px + 0.04 + width * u, z
        canvas(col_stop, 5, 'flags', px, px + w, 1.0, top, 5.86, part=f'flag_{i + 1}', nu=4, nv=12, shape=shape, belly=0.08)
    for xx in (35.6, 41.4):                                                                  # banner frame on the sea wall
        f.cyl(Mt, (xx, 6.45, 1.6), 0.05, 3.2, seg=8)
    f.boxz(Mt, 35.6, 41.4, 6.42, 6.48, 3.12, 3.2)
    f.finish('flag_poles', col_stop, bevel=0.0)
    canvas(col_stop, 5, 'flags', 35.8, 41.2, 1.3, 3.0, 6.38, part='banner', nu=6, nv=2, belly=0.04)

def build_hotspots(col_stop):
    """One anchor per stop, 1.2 m in front (camera side) of the middle of its canvases: the web projects the hotspot here."""
    for n, svc, cx, vx in STOPS:
        cs = [o for o in col_stop.objects if o.name.startswith(f'canvas_{n}_')]
        c = sum((o.location for o in cs), Vector()) / len(cs)
        anchor(col_stop, f'hotspot_{n}', (c.x, c.y - 1.2, c.z))

def build_street(col):
    fill(col, -42.0, -32.0, 'a')
    fill(col, -24.0, -4.0, 'b')
    fill(col, 5.0, 9.5, 'c', hmin=6.8)
    building(col, 'bldg_d_dome', 20.0, 26.5 - 4.0, 7.2, 6.6, 7.0, wall='plaster', dome=True, style='arch')
    fort_tower(col, 25.5, 10.5)
    building(col, 'bldg_d_end', 27.6, SEA_X - 0.2, 7.4, 6.4, 4.4, wall='sand', style='shutter')

# ----------------------------------------------------------------------------- light, world, cameras, animation
def build_rig(col, van):
    sc = bpy.context.scene
    sun = add_sun_and_sky(col)

    # overview: the whole diorama on the table
    ov, fo = CFG['overview'], CFG['follow']
    cd = bpy.data.cameras.new('CAM_overview'); cd.lens = ov['lens']
    cam = bpy.data.objects.new('CAM_overview', cd); col.objects.link(cam)
    el, az, D, tgt = math.radians(ov['elevationDeg']), math.radians(ov['azimuthDeg']), ov['distance'], Vector(ov['target'])
    cam.location = tgt + D * Vector((-math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    look_at(cam, tgt); cd.clip_end = 1000

    # follow camera: rides a rig that copies the van's X; slight tilt-shift via depth of field
    follow = bpy.data.objects.new('follow_rig', None); col.objects.link(follow)
    cc = follow.constraints.new('COPY_LOCATION'); cc.target = van; cc.use_y = False; cc.use_z = False
    tgt_e = bpy.data.objects.new('follow_target', None); col.objects.link(tgt_e)
    tgt_e.parent = follow; tgt_e.location = fo['target']
    fd = bpy.data.cameras.new('CAM_follow'); fd.lens = fo['lens']; fd.clip_end = 500
    fd.dof.use_dof = True; fd.dof.focus_object = van; fd.dof.aperture_fstop = 1.4
    fcam = bpy.data.objects.new('CAM_follow', fd); col.objects.link(fcam)
    fcam.parent = follow; fcam.location = fo['eye']
    tc = fcam.constraints.new('TRACK_TO'); tc.target = tgt_e; tc.track_axis = 'TRACK_NEGATIVE_Z'; tc.up_axis = 'UP_Y'
    # film cameras: frame the wrapped minibus (stop 2) and the whole LED screen (stop 3) where the van parks
    # EN: the van passes the minibus (stop 2) and parks under the LED (stop 3).
    # AR: it comes from the right and parks just past the LED (x 7.5), so that camera frames the LED and the van.
    for name, eye, target in (('film_cam_en', (-13.0, -21.0, 7.2), (-6.0, 4.0, 4.6)),
                              ('film_cam_ar', (6.5, -21.0, 7.2), (0.5, 4.0, 4.6))):
        fd2 = bpy.data.cameras.new(name); fd2.lens = 32; fd2.clip_end = 500
        fc2 = bpy.data.objects.new(name, fd2); col.objects.link(fc2)
        fc2.location = eye
        look_at(fc2, target)
    sc.camera = cam
    return cam, fcam

def animate_van(van):
    """Ease in and out of each stop. The web drives position along this path from scroll; frames are only for preview."""
    keys = [(1, VAN_START)]; f = 1
    for n, svc, cx, vx in STOPS:
        f += 50; keys.append((f, vx)); f += 25; keys.append((f, vx))
    f += 45; keys.append((f, VAN_END))
    for fr, x in keys:
        van.location.x = x; van.keyframe_insert('location', index=0, frame=fr)
    ad = van.animation_data.action
    try:
        curves = ad.fcurves
    except AttributeError:                       # 5.x layered actions
        curves = [c for layer in ad.layers for strip in layer.strips for bag in strip.channelbags for c in bag.fcurves]
    for c in curves:
        for kp in c.keyframe_points:
            kp.interpolation = 'BEZIER'; kp.handle_left_type = kp.handle_right_type = 'AUTO_CLAMPED'
    sc = bpy.context.scene; sc.frame_start = 1; sc.frame_end = f
    van['stop_frames'] = [k[0] for k in keys]
    return keys

# ----------------------------------------------------------------------------- canvas states + stats + output
def canvases():
    return [o for o in bpy.data.objects if o.name.startswith('canvas_')]

def set_filled(filled):
    grey = mat('canvas', rough=0.6)
    for o in canvases():
        n = o['canvas']
        o.data.materials[0] = (art_mat(n, emit=4.0 if o['service'] == 'led' else 0.0) if filled else grey)

def build():
    clear_scene()
    # numbered, clearly named collections (the outliner reads like a table of contents)
    root = coll('10 Street')
    c_base, c_street = coll('11 Ground', root), coll('12 Buildings', root)
    c_stops, c_van, c_props, c_rig = coll('20 Stops'), coll('30 Van'), coll('40 Props'), coll('90 Rig')
    build_base(c_base); build_mountains(c_base)
    build_street(c_street)
    build_stops(c_street, c_stops)
    build_hotspots(c_stops)
    build_props(c_props)
    van = build_van(c_van)
    cam, fcam = build_rig(c_rig, van)
    keys = animate_van(van)
    # one root for the whole street: the web scales this node during the dive from the Oman map
    sr = bpy.data.objects.new('street_root', None); root.objects.link(sr)
    for o in list(bpy.context.scene.objects):
        if o is not sr and o.parent is None:
            o.parent = sr
    render_setup()
    bpy.context.scene['stops'] = [{'n': n, 'service': s, 'canvas_x': cx, 'van_x': vx} for n, s, cx, vx in STOPS]
    return van, cam, fcam, keys

def main(argv):
    van, cam, fcam, keys = build()
    out = {'tidy': tidy_scene(cam)}
    blend = os.path.join(HERE, 'street.blend')
    bpy.ops.wm.save_as_mainfile(filepath=blend)
    out['blend'] = blend
    total, per = tri_count(); out['triangles'] = total; out['triangles_by_collection'] = per
    out['objects'] = len(bpy.context.scene.objects)
    out['logo'] = bpy.data.objects['van_logo_near'].get('logo')
    out['engine'] = bpy.context.scene.render.engine
    if '--render' in argv:
        d = os.path.abspath(argv[argv.index('--render') + 1]); os.makedirs(d, exist_ok=True)
        stop3_hold = keys[6][0] - 5          # van parked at stop 3
        render_to(os.path.join(d, 'street_overview_grey.png'), cam, stop3_hold)
        set_filled(True)
        render_to(os.path.join(d, 'street_overview_filled.png'), cam, stop3_hold)
        render_to(os.path.join(d, 'street_stop3_follow.png'), fcam, stop3_hold)
        render_to(os.path.join(d, 'street_stop1_follow.png'), fcam, keys[2][0] - 5)
        set_filled(False)
        out['renders'] = d
    if '--glb' in argv:
        p = os.path.abspath(argv[argv.index('--glb') + 1])
        try:
            bpy.ops.export_scene.gltf(filepath=p, export_format='GLB', export_apply=True, export_extras=True,
                                      export_draco_mesh_compression_enable=True, export_cameras=True, export_lights=False)
            out['glb_bytes'] = os.path.getsize(p)
        except Exception as e:
            out['glb_error'] = str(e)
    print('BUILD_STREET_RESULT', out)
    return out

if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
