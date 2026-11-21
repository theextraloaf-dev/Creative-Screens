"""Shared Blender building blocks for the diorama scenes (build_street.py, build_map.py).

Materials in the diorama palette, the MB mesh builder, grey web canvases, palms, the fort tower, render helpers.
Import from a script run with Blender:  sys.path.insert(0, <3d dir>); from kit import *
"""
import bpy, bmesh, math, random, os
from mathutils import Vector, Matrix, noise


# ----------------------------------------------------------------------------- colour + materials
def lin(h, a=1.0):
    h = h.lstrip('#')
    c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    return tuple(x / 12.92 if x <= 0.04045 else ((x + 0.055) / 1.055) ** 2.4 for x in c) + (a,)

PAL = dict(
    navy='#131d27', lime='#bbd440', canvas='#b9b9b4', white='#ffffff',
    plaster='#efe6d6', sand='#e3cfa9', beige='#d9bf94', peach='#ecd2b4', terracotta='#c9825b', trim='#f6f1e7',
    wood='#8a5a36', door='#6e4428', teal='#2f7f86', glass='#22343f', shop_glass='#3b5563', lattice='#4a2e1c',
    asphalt='#5e5b58', line='#f2efe6', paving='#d8d0c2', plaza='#e6dccb',
    ground='#dcc59c', soil='#b98f5f', rock='#8c6a48', board='#3a2f27', water='#2e8c9a',
    trunk='#8b6a48', frond='#5f8a3a', frond_dark='#4b7330', shrub='#6f9a45', bloom='#d9457f', date='#b5651d',
    metal='#8f9294', lamp='#ffd9a0', ac='#d7d7d2', tank='#f0ece2',
    bus='#f4f3ef', tyre='#222222', rim='#c8c8c8', dark='#1b1b1b', head='#fff4dc', tail='#c0262d', sail='#f3eee2',
)

_M = {}

def _principled(m):
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    b = next((n for n in nt.nodes if n.type == 'BSDF_PRINCIPLED'), None)
    if b is None:
        out = next((n for n in nt.nodes if n.type == 'OUTPUT_MATERIAL'), None) or nt.nodes.new('ShaderNodeOutputMaterial')
        b = nt.nodes.new('ShaderNodeBsdfPrincipled')
        nt.links.new(b.outputs[0], out.inputs['Surface'])
    return nt, b

# surface detail per material kind: (noise scale, bump strength, stretch along z). The bake turns it into normal maps.
BUMP_KIND = {   # noise scale, strength, stretch along z, bump distance (scene units)
    'plaster': (22, 0.12, 1.0, 0.02), 'asphalt': (70, 0.22, 1.0, 0.02), 'sand': (30, 0.16, 1.0, 0.02),
    'rock': (6, 0.35, 1.0, 0.02), 'wood': (14, 0.18, 8.0, 0.02), 'fabric': (90, 0.05, 1.0, 0.02), 'fine': (40, 0.06, 1.0, 0.02),
    'terrain': (0.12, 0.6, 1.0, 3.0),     # the Oman map is in km: features of a few km
}
BUMP_FOR = {
    'plaster': 'plaster', 'sand': 'plaster', 'beige': 'plaster', 'peach': 'plaster', 'terracotta': 'plaster',
    'trim': 'plaster', 'tank': 'plaster', 'asphalt': 'asphalt', 'ground': 'sand', 'paving': 'sand', 'plaza': 'sand',
    'dune': 'sand', 'neighbour': 'sand', 'soil': 'rock', 'rock': 'rock', 'board': 'wood', 'wood': 'wood', 'door': 'wood',
    'lattice': 'wood', 'trunk': 'wood', 'sail': 'fabric', 'bus': 'fine',
}
SMOOTH = ('glass', 'water', 'foam', 'sea_grad', 'lamp', 'head', 'tail')     # glossy or emissive: no bump

def add_bump(m, kind='fine'):
    """Procedural Noise -> Bump into the material's normal (object space, so it bakes cleanly)."""
    scale, strength, stretch, dist = BUMP_KIND[kind]
    nt, b = _principled(m)
    if any(n.type == 'BUMP' for n in nt.nodes):
        return m
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping')
    mp.inputs['Scale'].default_value = (1.0, 1.0, stretch)
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = scale; nz.inputs['Detail'].default_value = 6.0
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = strength; bp.inputs['Distance'].default_value = dist
    nt.links.new(tc.outputs['Object'], mp.inputs['Vector']); nt.links.new(mp.outputs['Vector'], nz.inputs['Vector'])
    nt.links.new(nz.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    return m

def mat(key, rough=0.75, metal=0.0, emit=0.0, hexc=None, name=None, coat=0.0, bump=None):
    name = name or key
    if name in _M:
        return _M[name]
    col = lin(hexc or PAL[key])
    m = bpy.data.materials.new(name)
    nt, b = _principled(m)
    b.inputs['Base Color'].default_value = col
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if coat:
        b.inputs['Coat Weight'].default_value = coat; b.inputs['Coat Roughness'].default_value = 0.08
    if emit:
        b.inputs['Emission Color'].default_value = col
        b.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = col
    if not emit and not any(k in name for k in SMOOTH):
        add_bump(m, bump or BUMP_FOR.get(key, 'fine'))
    _M[name] = m
    return m

def anchor(col, name, loc, size=0.6):
    """A named empty the web projects UI onto (hotspots, pins)."""
    e = bpy.data.objects.new(name, None); col.objects.link(e)
    e.empty_display_type = 'SPHERE'; e.empty_display_size = size; e.location = loc
    return e

def _math(nt, op, a, b=None):
    n = nt.nodes.new('ShaderNodeMath'); n.operation = op
    for i, v in enumerate((a, b)):
        if v is None:
            continue
        if isinstance(v, (int, float)):
            n.inputs[i].default_value = v
        else:
            nt.links.new(v, n.inputs[i])
    return n.outputs[0]

def _mixc(nt, fac, a, b):
    n = nt.nodes.new('ShaderNodeMix'); n.data_type = 'RGBA'
    for sock, v in ((n.inputs[0], fac), (n.inputs[6], a), (n.inputs[7], b)):
        if isinstance(v, tuple):
            sock.default_value = v
        else:
            nt.links.new(v, sock)
    return n.outputs[2]

def art_mat(n, emit=0.0):
    """Placeholder brand artwork for the 'filled' state: navy ground, a lime diagonal band, a white pinstripe, a lime dot.
    Only used for preview renders (the web uses real artwork textures)."""
    name = f'art_{n}'
    if name in _M:
        return _M[name]
    m = bpy.data.materials.new(name)
    nt, b = _principled(m)
    b.inputs['Roughness'].default_value = 0.4
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ')
    nt.links.new(tc.outputs['UV'], sep.inputs[0])
    u, v = sep.outputs[0], sep.outputs[1]
    off = [0.45, 0.62, 0.38, 0.55, 0.5][(n - 1) % 5]
    d = _math(nt, 'ADD', _math(nt, 'MULTIPLY', u, 0.75), _math(nt, 'MULTIPLY', v, 0.55))
    band = _math(nt, 'LESS_THAN', _math(nt, 'ABSOLUTE', _math(nt, 'SUBTRACT', d, off)), 0.13)
    pin = _math(nt, 'LESS_THAN', _math(nt, 'ABSOLUTE', _math(nt, 'SUBTRACT', d, off + 0.24)), 0.025)
    du = _math(nt, 'SUBTRACT', u, 0.16); dv = _math(nt, 'SUBTRACT', v, 0.7)
    dist = _math(nt, 'SQRT', _math(nt, 'ADD', _math(nt, 'MULTIPLY', du, du), _math(nt, 'MULTIPLY', dv, dv)))
    dot = _math(nt, 'LESS_THAN', dist, 0.1)
    c = _mixc(nt, band, lin(PAL['navy']), lin(PAL['lime']))
    c = _mixc(nt, pin, c, lin(PAL['white']))
    c = _mixc(nt, dot, c, lin(PAL['lime']))
    nt.links.new(c, b.inputs['Base Color'])
    if emit:
        nt.links.new(c, b.inputs['Emission Color'])
        b.inputs['Emission Strength'].default_value = emit
    m.diffuse_color = lin(PAL['navy'])
    _M[name] = m
    return m

# ----------------------------------------------------------------------------- collections + mesh builder
def coll(name, parent=None):
    c = bpy.data.collections.get(name) or bpy.data.collections.new(name)
    p = parent or bpy.context.scene.collection
    if c.name not in [x.name for x in p.children]:
        p.children.link(c)
    return c

class MB:
    """Accumulates primitives (one material slot per material) into one bmesh, then makes one object."""
    def __init__(s):
        s.bm = bmesh.new(); s.mats = []

    def _tag(s, verts, m, M=None):
        if M is not None:
            bmesh.ops.transform(s.bm, matrix=M, verts=verts)
        if m not in s.mats:
            s.mats.append(m)
        i = s.mats.index(m)
        for f in {f for v in verts for f in v.link_faces}:
            f.material_index = i
        return verts

    def box(s, m, c, size, rz=0.0, ry=0.0, rx=0.0):
        v = bmesh.ops.create_cube(s.bm, size=1.0)['verts']
        M = (Matrix.Translation(Vector(c)) @ Matrix.Rotation(rz, 4, 'Z') @ Matrix.Rotation(ry, 4, 'Y')
             @ Matrix.Rotation(rx, 4, 'X') @ Matrix.Diagonal((size[0], size[1], size[2], 1.0)))
        return s._tag(v, m, M)

    def boxz(s, m, x0, x1, y0, y1, z0, z1):
        return s.box(m, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), (x1 - x0, y1 - y0, z1 - z0))

    def cyl(s, m, c, r, h, seg=16, r2=None, axis='Z', rz=0.0):
        v = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r,
                                  radius2=r if r2 is None else r2, depth=h)['verts']
        R = {'Z': Matrix.Identity(4), 'Y': Matrix.Rotation(math.pi / 2, 4, 'X'), 'X': Matrix.Rotation(math.pi / 2, 4, 'Y')}[axis]
        return s._tag(v, m, Matrix.Translation(Vector(c)) @ Matrix.Rotation(rz, 4, 'Z') @ R)

    def cyl_between(s, m, p0, p1, r0, r1, seg=10):
        p0, p1 = Vector(p0), Vector(p1); d = p1 - p0
        v = bmesh.ops.create_cone(s.bm, cap_ends=True, cap_tris=False, segments=seg, radius1=r0, radius2=r1, depth=d.length)['verts']
        R = d.to_track_quat('Z', 'Y').to_matrix().to_4x4()
        return s._tag(v, m, Matrix.Translation((p0 + p1) / 2) @ R)

    def sphere(s, m, c, r, scale=(1, 1, 1), seg=14, hemi=False):
        v = bmesh.ops.create_uvsphere(s.bm, u_segments=seg, v_segments=max(4, seg // 2), radius=r)['verts']
        if hemi:
            bmesh.ops.delete(s.bm, geom=[x for x in v if x.co.z < -1e-4], context='VERTS')
            v = [x for x in v if x.is_valid]
        return s._tag(v, m, Matrix.Translation(Vector(c)) @ Matrix.Diagonal((*scale, 1.0)))

    def prism(s, m, prof, y0, y1):
        """Extrude an XZ profile across Y (y0..y1)."""
        a = [s.bm.verts.new((x, y0, z)) for x, z in prof]
        b = [s.bm.verts.new((x, y1, z)) for x, z in prof]
        s.bm.faces.new(a); s.bm.faces.new(b[::-1])
        n = len(prof)
        for i in range(n):
            j = (i + 1) % n
            s.bm.faces.new((a[i], a[j], b[j], b[i]))
        return s._tag(a + b, m)

    def poly(s, m, pts):
        v = [s.bm.verts.new(p) for p in pts]
        s.bm.faces.new(v)
        return s._tag(v, m)

    def side_poly(s, m, prof, y):
        """A flat XZ polygon at constant y (decals on vehicle sides)."""
        return s.poly(m, [(x, y, z) for x, z in prof])

    def frond(s, m, base, ang, L=2.3, lift=0.55, droop=1.7, w=0.34, n=7):
        d = Vector((math.cos(ang), math.sin(ang), 0)); side = Vector((-d.y, d.x, 0))
        rows = []
        for i in range(n + 1):
            t = i / n
            p = Vector(base) + d * (L * t) + Vector((0, 0, lift * t - droop * t * t))
            ww = w * math.sin(math.pi * min(t * 1.12, 1.0)) ** 0.7 + 0.02
            sag = Vector((0, 0, -0.12 * ww / w))
            rows.append([s.bm.verts.new(p - side * ww + sag), s.bm.verts.new(p + Vector((0, 0, 0.04))),
                         s.bm.verts.new(p + side * ww + sag)])
        for i in range(n):
            for j in range(2):
                s.bm.faces.new((rows[i][j], rows[i][j + 1], rows[i + 1][j + 1], rows[i + 1][j]))
        return s._tag([v for r in rows for v in r], m)

    def finish(s, name, col, origin=(0, 0, 0), bevel=0.05, segments=2, recalc=True):
        if recalc:
            bmesh.ops.recalc_face_normals(s.bm, faces=s.bm.faces[:])
        o = Vector(origin)
        if o.length:
            bmesh.ops.translate(s.bm, vec=-o, verts=s.bm.verts[:])
        me = bpy.data.meshes.new(name)
        s.bm.to_mesh(me); s.bm.free()
        for m in s.mats:
            me.materials.append(m)
        me.shade_smooth()
        ob = bpy.data.objects.new(name, me)
        col.objects.link(ob)
        ob.location = o
        if bevel:
            bv = ob.modifiers.new('Bevel', 'BEVEL')
            bv.width = bevel; bv.segments = segments; bv.limit_method = 'ANGLE'
            bv.angle_limit = math.radians(35); bv.harden_normals = True
        return ob

def canvas(col, n, service, x0, x1, z0, z1, y, part=None, nu=1, nv=1, shape=None, belly=0.0):
    """Grey surface that the web fills with artwork. Faces -Y. UVs 0..1 (u along +X, v up), never mirrored.
    shape(u, v) -> (x, z) overrides the rectangle (feather flags)."""
    name = f'canvas_{n}_{service}' + (f'_{part}' if part else '')
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap')
    cx, cz = (x0 + x1) / 2, (z0 + z1) / 2
    grid, uvs = [], {}
    for j in range(nv + 1):
        row = []
        for i in range(nu + 1):
            u, v = i / nu, j / nv
            x, z = shape(u, v) if shape else (x0 + (x1 - x0) * u, z0 + (z1 - z0) * v)
            vert = bm.verts.new((x - cx, -belly * math.sin(math.pi * u), z - cz))
            uvs[vert] = (u, v); row.append(vert)
        grid.append(row)
    for j in range(nv):
        for i in range(nu):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for lp in f.loops:
                lp[uvl].uv = uvs[lp.vert]
    me = bpy.data.meshes.new(name); bm.to_mesh(me); bm.free()
    me.materials.append(mat('canvas', rough=0.6))
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    ob.location = (cx, y, cz)
    ob['canvas'] = n; ob['service'] = service
    return ob

def _strata_material():
    """Rock strata by height from a colour attribute: soil near the top, darker rock below, thin pale bands."""
    if 'strata' in _M:
        return _M['strata']
    m = bpy.data.materials.new('strata'); nt, b = _principled(m)
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = 0.95
    m.diffuse_color = lin(PAL['rock']); add_bump(m, 'rock'); _M['strata'] = m
    return m


def arch(mb, m, x, y, z0, w, h, depth=0.12):
    """Arched opening (door/window) on a -Y facing wall at y: box + half-cylinder top."""
    mb.boxz(m, x - w / 2, x + w / 2, y - depth, y + 0.02, z0, z0 + h - w / 2)
    mb.cyl(m, (x, y - depth / 2 + 0.01, z0 + h - w / 2), w / 2, depth + 0.02, seg=16, axis='Y')


def fort_tower(col, x, y):
    mb = MB(); S = mat('sand', 0.9)
    mb.cyl(S, (x, y, 4.5), 2.0, 9.0, seg=28, r2=1.65)
    mb.cyl(mat('trim', 0.8), (x, y, 9.2), 1.85, 0.4, seg=28)
    for k in range(14):
        a = k / 14 * math.tau
        mb.box(S, (x + 1.68 * math.cos(a), y + 1.68 * math.sin(a), 9.75), (0.4, 0.3, 0.7), rz=a)
    for z in (3.5, 6.5):
        mb.boxz(mat('dark', 0.9), x - 0.09, x + 0.09, y - 2.0, y - 1.6, z, z + 0.8)
    arch(mb, mat('door', 0.7), x, y - 1.95, 0.0, 1.1, 2.1, depth=0.12)
    return mb.finish('fort_tower', col, bevel=0.05)


def palm(mb, x, y, h=5.5, seed=0):
    r = random.Random(seed)
    lean = Vector((r.uniform(-0.6, 0.6), r.uniform(-0.4, 0.4), 0))
    pts = [Vector((x, y, 0.1)) + lean * (t * t) + Vector((0, 0, h * t)) for t in [k / 6 for k in range(7)]]
    for k in range(6):
        mb.cyl_between(mat('trunk', 0.9), pts[k], pts[k + 1] + (pts[k + 1] - pts[k]) * 0.08,
                       0.24 - 0.012 * k, 0.21 - 0.012 * k, seg=10)
    top = pts[-1]
    mb.sphere(mat('frond_dark', 0.8), top, 0.32, seg=10)
    n = 10
    for k in range(n):
        a = k / n * math.tau + r.uniform(-0.2, 0.2)
        mb.frond(mat('frond' if k % 2 else 'frond_dark', 0.75), top, a, L=r.uniform(2.1, 2.7), lift=0.5, droop=r.uniform(1.5, 2.0))
    for k in range(4):
        a = k / 4 * math.tau + 0.4
        mb.frond(mat('frond', 0.75), top, a, L=1.5, lift=1.1, droop=0.5, w=0.25)
    for k in range(5):
        a = r.uniform(0, math.tau)
        mb.sphere(mat('date', 0.7), top + Vector((0.3 * math.cos(a), 0.3 * math.sin(a), -0.35)), 0.12, seg=8)


def look_at(ob, target):
    d = Vector(target) - ob.location
    ob.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()


def render_setup():
    sc = bpy.context.scene; r = sc.render
    items = [i.identifier for i in r.bl_rna.properties['engine'].enum_items]
    r.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in items else 'BLENDER_EEVEE'
    r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 100
    r.film_transparent = True
    for attr, val in (('taa_render_samples', 64), ('use_raytracing', True), ('use_shadows', True)):
        try:
            setattr(sc.eevee, attr, val)
        except Exception:
            pass
    vs = sc.view_settings
    try:
        vs.view_transform = 'AgX'
        vs.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    vs.exposure = -0.1


def tri_count():
    dg = bpy.context.evaluated_depsgraph_get(); total = 0; per = {}
    for o in bpy.context.scene.objects:
        if o.type != 'MESH':
            continue
        me = o.evaluated_get(dg).to_mesh(); me.calc_loop_triangles()
        n = len(me.loop_triangles); o.evaluated_get(dg).to_mesh_clear()
        total += n
        c = o.users_collection[0].name; per[c] = per.get(c, 0) + n
    return total, per

def flatten_on_paper(path, paper='#ededed'):
    """Composite the transparent render onto the site's paper colour (display space) with numpy."""
    import numpy as np
    img = bpy.data.images.load(path, check_existing=False)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(-1, 4)
    p = np.array([int(paper[i:i + 2], 16) / 255 for i in (1, 3, 5)], dtype=np.float32)
    a = px[:, 3:4]; px[:, :3] = px[:, :3] * a + p * (1 - a); px[:, 3] = 1.0
    img.pixels.foreach_set(px.ravel()); img.filepath_raw = path; img.file_format = 'PNG'; img.save()
    bpy.data.images.remove(img)

def render_to(path, camera, frame):
    sc = bpy.context.scene; sc.camera = camera; sc.frame_set(frame)
    sc.render.filepath = path; bpy.ops.render.render(write_still=True)
    flatten_on_paper(path)

def clear_scene():
    for o in list(bpy.data.objects):
        bpy.data.objects.remove(o, do_unlink=True)
    for c in list(bpy.data.collections):
        bpy.data.collections.remove(c)
    for blk in (bpy.data.meshes, bpy.data.materials, bpy.data.cameras, bpy.data.lights, bpy.data.curves, bpy.data.actions):
        for d in list(blk):
            blk.remove(d)
    _M.clear()


def add_sun_and_sky(col, sun_dir=(0.62, 0.70, -0.36)):
    """Warm low late-afternoon sun and a soft blue sky fill. Shared by the street and the map so their bakes match."""
    sc = bpy.context.scene
    sun_d = bpy.data.lights.new('sun', 'SUN'); sun_d.energy = 4.0; sun_d.angle = math.radians(3.0)
    sun_d.color = (1.0, 0.80, 0.58)                                      # late-afternoon gold
    sun = bpy.data.objects.new('sun', sun_d); col.objects.link(sun)
    sun.rotation_euler = Vector(sun_dir).to_track_quat('-Z', 'Y').to_euler()

    w = bpy.data.worlds.new('sky'); sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    nt = w.node_tree
    bg = next((n for n in nt.nodes if n.type == 'BACKGROUND'), None) or nt.nodes.new('ShaderNodeBackground')
    out = next((n for n in nt.nodes if n.type == 'OUTPUT_WORLD'), None) or nt.nodes.new('ShaderNodeOutputWorld')
    nt.links.new(bg.outputs[0], out.inputs['Surface'])
    bg.inputs['Color'].default_value = (0.40, 0.52, 0.76, 1.0); bg.inputs['Strength'].default_value = 0.55
    return sun

def dhow(col, name='dhow'):
    """Toy dhow at the origin, about 5 m long, bow toward +X, lateen sail. Built in metres; scale the object as needed."""
    d = MB(); wd = mat('wood', 0.6)
    d.prism(wd, [(-2.2, 0.0), (1.6, 0.0), (2.8, 1.1), (1.9, 0.95), (-2.0, 0.95), (-2.5, 1.2)], -0.75, 0.75)
    d.boxz(mat('door', 0.7), -1.9, 1.8, -0.62, 0.62, 0.95, 1.05)
    d.cyl_between(wd, (0.4, 0, 1.0), (0.1, 0, 5.2), 0.07, 0.05, seg=8)
    d.cyl_between(wd, (2.3, 0, 1.3), (-2.0, 0, 5.6), 0.04, 0.03, seg=6)
    d.poly(mat('sail', 0.8), [(2.2, 0.08, 1.45), (-1.9, 0.08, 5.45), (-0.4, 0.08, 1.6)])
    return d.finish(name, col, bevel=0.03, recalc=False)


def tidy_scene(camera=None):
    """Leave the file clean and clear: drop empty collections, purge orphan data, open in Material Preview
    through the given camera. Returns what it removed."""
    sc = bpy.context.scene
    removed = {'collections': 0}
    def prune(parent):
        for c in list(parent.children):
            prune(c)
            if not c.objects and not c.children:
                bpy.data.collections.remove(c); removed['collections'] += 1
    prune(sc.collection)
    for c in [c for c in bpy.data.collections if c.users == 0]:
        bpy.data.collections.remove(c); removed['collections'] += 1
    before = sum(len(b) for b in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.images))
    bpy.data.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    removed['data'] = before - sum(len(b) for b in (bpy.data.meshes, bpy.data.materials, bpy.data.curves, bpy.data.images))
    if camera is not None:
        sc.camera = camera
    for win in getattr(bpy.context.window_manager, 'windows', []):       # GUI only; headless has no windows
        for area in win.screen.areas:
            if area.type == 'VIEW_3D':
                sp = area.spaces.active
                sp.shading.type = 'MATERIAL'; sp.clip_end = 20000
                sp.overlay.show_relationship_lines = False      # no dashed parent lines across the view
                sp.overlay.show_floor = False; sp.overlay.show_axis_x = False; sp.overlay.show_axis_y = False
                if camera is not None:
                    sp.region_3d.view_perspective = 'CAMERA'
    return removed
