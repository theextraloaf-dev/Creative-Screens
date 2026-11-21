"""The intro shot under the title: a Hajar mountain road at golden hour, our van coming towards the camera.
Design: docs/superpowers/specs/2026-11-20-diorama-v3-map-journey-design.md ("Intro").

Near-photoreal (Cycles), unlike the toy street: a canyon road with layered limestone walls, a gravel shoulder, a
guard rail, scrub and boulders, aerial haze toward the far ridges, and the same Creative Screens van (built by
build_street.build_van, so the model never drifts). Generic: no real place, no signs with text.

Inside Blender (live, through the MCP):  exec(open(r'<repo>/3d/live.py').read()); run('build_intro')
Render headless:                       node scripts/blender.mjs 3d/build_intro.py -- --render [--film]

Axes: the road runs away from the camera along +Y and climbs gently; the van drives toward the camera (-Y) in its
right-hand lane (camera's left as seen from the shoulder). Metres.
"""
import bpy, math, os, random, sys
import numpy as np
from mathutils import Vector

try:
    HERE = os.path.dirname(os.path.abspath(__file__))
except NameError:
    HERE = os.getcwd()
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
from kit import *  # noqa: F401,F403
from kit import _principled  # noqa: E402

OUT = os.path.join(REPO, 'public', 'diorama')
ROAD_HALF, SHOULDER = 3.6, 2.2
Y0, Y1 = -40.0, 1400.0
VAN_Y = (78.0, 30.0)                 # film: from here to here (metres along the road, toward the camera)
POSTER_Y = 27.0                      # the still: van about 40 m from the camera


def cx(y):
    """Road centreline x at distance y: straight toward the camera, then a long bend right up the valley."""
    u = max(0.0, y - 260.0)
    return 90.0 * (1.0 - math.cos(u / 420.0)) if u < 420.0 * math.pi else 180.0

def cx_np(Y):
    u = np.clip(Y - 260.0, 0.0, 420.0 * math.pi)
    return 90.0 * (1.0 - np.cos(u / 420.0))

def rz(y):
    """Road surface height: a gentle climb that steepens up the valley."""
    return 0.028 * y + 0.00002 * y * y


# ----------------------------------------------------------------------------- noise (numpy value noise, fBm)
_rng = np.random.default_rng(1961)
_LAT = _rng.random((512, 512)).astype(np.float32)

def _vnoise(x, y):
    xi, yi = np.floor(x).astype(np.int64), np.floor(y).astype(np.int64)
    fx, fy = x - xi, y - yi
    fx, fy = fx * fx * (3 - 2 * fx), fy * fy * (3 - 2 * fy)
    a = _LAT[xi & 511, yi & 511]; b = _LAT[(xi + 1) & 511, yi & 511]
    c = _LAT[xi & 511, (yi + 1) & 511]; d = _LAT[(xi + 1) & 511, (yi + 1) & 511]
    return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy

def fbm(x, y, oct=6, ridged=False):
    s, amp, f, norm = 0.0, 1.0, 1.0, 0.0
    for _ in range(oct):
        n = _vnoise(x * f + 17.3 * f, y * f - 9.1 * f)
        if ridged:
            n = 1.0 - np.abs(n * 2 - 1)
            n = n * n
        s = s + n * amp; norm += amp; amp *= 0.5; f *= 2.03
    return s / norm


# ----------------------------------------------------------------------------- materials (photoreal set, own names)
def _haze(nt, b, color, dist=1100.0, amount=0.82):
    """Aerial perspective in the material: mix the colour toward a warm haze by camera distance."""
    cd = nt.nodes.new('ShaderNodeCameraData')
    m1 = nt.nodes.new('ShaderNodeMath'); m1.operation = 'DIVIDE'; m1.inputs[1].default_value = -dist
    nt.links.new(cd.outputs['View Distance'], m1.inputs[0])
    ex = nt.nodes.new('ShaderNodeMath'); ex.operation = 'EXPONENT'; nt.links.new(m1.outputs[0], ex.inputs[0])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1.0
    nt.links.new(ex.outputs[0], inv.inputs[1])
    sc = nt.nodes.new('ShaderNodeMath'); sc.operation = 'MULTIPLY'; sc.inputs[1].default_value = amount
    nt.links.new(inv.outputs[0], sc.inputs[0])
    src = b.inputs['Base Color'].links[0].from_socket if b.inputs['Base Color'].links else None
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'
    nt.links.new(sc.outputs[0], mix.inputs['Factor'])
    if src:
        nt.links.new(src, mix.inputs['A'])
    else:
        mix.inputs['A'].default_value = b.inputs['Base Color'].default_value
    mix.inputs['B'].default_value = lin(color)
    nt.links.new(mix.outputs['Result'], b.inputs['Base Color'])
    # the haze glows a little (it is lit air, not grey paint)
    nt.links.new(mix.outputs['Result'], b.inputs['Emission Color'])
    em = nt.nodes.new('ShaderNodeMath'); em.operation = 'MULTIPLY'; em.inputs[1].default_value = 0.55
    nt.links.new(sc.outputs[0], em.inputs[0]); nt.links.new(em.outputs[0], b.inputs['Emission Strength'])

def rock_material():
    """Layered Hajar limestone: warm ochre and grey-brown bands along height, broken by noise, crisp bump."""
    m = bpy.data.materials.new('intro_rock'); nt, b = _principled(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    wave = nt.nodes.new('ShaderNodeTexWave'); wave.wave_type = 'BANDS'; wave.bands_direction = 'Z'
    wave.inputs['Scale'].default_value = 0.012; wave.inputs['Distortion'].default_value = 3.0
    wave.inputs['Detail'].default_value = 2.0; wave.inputs['Detail Scale'].default_value = 0.8
    nt.links.new(tc.outputs['Object'], wave.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.08; nz.inputs['Detail'].default_value = 10.0
    nz.inputs['Roughness'].default_value = 0.62; nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.elements[0].position = 0.0; cr.elements[0].color = lin('#5e4c40')
    cr.elements[1].position = 1.0; cr.elements[1].color = lin('#c2a283')
    for pos, hx in ((0.3, '#7a6352'), (0.52, '#98775d'), (0.75, '#b08d6c')):
        e = cr.elements.new(pos); e.color = lin(hx)
    mixf = nt.nodes.new('ShaderNodeMath'); mixf.operation = 'MULTIPLY_ADD'
    mixf.inputs[1].default_value = 0.35
    nt.links.new(wave.outputs['Fac'], mixf.inputs[0]); nt.links.new(nz.outputs['Fac'], mixf.inputs[2])
    nt.links.new(mixf.outputs[0], ramp.inputs['Fac'])
    nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.93
    # bump: big fractures + fine grit
    n2 = nt.nodes.new('ShaderNodeTexVoronoi'); n2.feature = 'F1'; n2.inputs['Scale'].default_value = 0.35
    n2.inputs['Detail'].default_value = 6.0; n2.inputs['Roughness'].default_value = 0.6
    nt.links.new(tc.outputs['Object'], n2.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.6; bp.inputs['Distance'].default_value = 1.2
    nt.links.new(n2.outputs['Distance'], bp.inputs['Height'])
    bp2 = nt.nodes.new('ShaderNodeBump'); bp2.inputs['Strength'].default_value = 0.35; bp2.inputs['Distance'].default_value = 2.5
    nt.links.new(wave.outputs['Fac'], bp2.inputs['Height']); nt.links.new(bp2.outputs['Normal'], bp.inputs['Normal'])
    nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    _haze(nt, b, '#e7c398')
    return m

def gravel_material():
    m = bpy.data.materials.new('intro_gravel'); nt, b = _principled(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    vor = nt.nodes.new('ShaderNodeTexVoronoi'); vor.inputs['Scale'].default_value = 9.0
    nt.links.new(tc.outputs['Object'], vor.inputs['Vector'])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 0.6; nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.elements[0].color = lin('#7c654f'); cr.elements[1].color = lin('#c8a983')
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 0.95
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.5; bp.inputs['Distance'].default_value = 0.03
    nt.links.new(vor.outputs['Distance'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    _haze(nt, b, '#e7c398')
    return m

def asphalt_material():
    m = bpy.data.materials.new('intro_asphalt'); nt, b = _principled(m)
    tc = nt.nodes.new('ShaderNodeTexCoord')
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 1.4; nz.inputs['Detail'].default_value = 8.0
    nt.links.new(tc.outputs['Object'], nz.inputs['Vector'])
    ramp = nt.nodes.new('ShaderNodeValToRGB'); cr = ramp.color_ramp
    cr.elements[0].color = lin('#2f2d2c'); cr.elements[1].color = lin('#57514b')
    nt.links.new(nz.outputs['Fac'], ramp.inputs['Fac']); nt.links.new(ramp.outputs['Color'], b.inputs['Base Color'])
    rr = nt.nodes.new('ShaderNodeMapRange'); rr.inputs['To Min'].default_value = 0.55; rr.inputs['To Max'].default_value = 0.85
    nt.links.new(nz.outputs['Fac'], rr.inputs['Value']); nt.links.new(rr.outputs['Result'], b.inputs['Roughness'])
    fine = nt.nodes.new('ShaderNodeTexNoise'); fine.inputs['Scale'].default_value = 160.0
    nt.links.new(tc.outputs['Object'], fine.inputs['Vector'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = 0.25; bp.inputs['Distance'].default_value = 0.01
    nt.links.new(fine.outputs['Fac'], bp.inputs['Height']); nt.links.new(bp.outputs['Normal'], b.inputs['Normal'])
    _haze(nt, b, '#e7c398')
    return m

def paint_material():
    m = bpy.data.materials.new('intro_paint'); nt, b = _principled(m)
    b.inputs['Base Color'].default_value = lin('#ece8de'); b.inputs['Roughness'].default_value = 0.55
    _haze(nt, b, '#e7c398')
    return m

def simple(name, hexc, rough=0.8, metal=0.0):
    m = bpy.data.materials.new(name); nt, b = _principled(m)
    b.inputs['Base Color'].default_value = lin(hexc); b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    _haze(nt, b, '#e7c398')
    return m


# ----------------------------------------------------------------------------- terrain
def _mesh_from_grid(name, col, X, Y, Z, material):
    ny, nx = Z.shape
    verts = np.stack([X.ravel(), Y.ravel(), Z.ravel()], 1).astype(np.float32)
    ii, jj = np.meshgrid(np.arange(nx - 1), np.arange(ny - 1))
    a = (jj * nx + ii).ravel(); quads = np.stack([a, a + 1, a + nx + 1, a + nx], 1).astype(np.int32)
    me = bpy.data.meshes.new(name)
    me.vertices.add(len(verts)); me.vertices.foreach_set('co', verts.ravel())
    me.loops.add(quads.size); me.loops.foreach_set('vertex_index', quads.ravel())
    me.polygons.add(len(quads)); me.polygons.foreach_set('loop_start', np.arange(0, quads.size, 4, dtype=np.int32))
    me.update(calc_edges=True); me.validate()
    me.materials.append(material); me.shade_smooth()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    return ob

def build_terrain(col):
    """The canyon: flat gravel beside the road, walls rising steeply to broken ridges, far peaks fading in haze.
    Finer rows near the camera, coarser far away."""
    t = np.linspace(0, 1, 340) ** 1.9
    ys = Y0 + (Y1 - Y0) * t
    xs = np.linspace(-1, 1, 300); xs = np.sign(xs) * np.abs(xs) ** 1.6 * 700.0
    X, Y = np.meshgrid(xs, ys)
    cxv = cx_np(Y)
    road = 0.028 * Y + 0.00002 * Y * Y
    d = np.abs(X - cxv) - (ROAD_HALF + SHOULDER)
    side = np.where(X > cxv, 1.0, 0.0)
    # left wall close and tall (the cliff), right side steps back over a dry wadi, then rises
    wob = 40.0 * (fbm(Y / 260.0, X / 900.0, 3) - 0.5)                      # the valley edge wanders
    start = np.where(side > 0, 95.0, 80.0) + wob
    rise = np.clip((d - start) / np.where(side > 0, 300.0, 300.0), 0.0, 1.0)
    H = 80.0 + 300.0 * fbm(X / 520.0, Y / 520.0, 5) + 200.0 * fbm(X / 210.0, Y / 210.0, 6, ridged=True)
    H *= 0.45 + 1.1 * np.clip(Y / 1200.0, 0, 1)                             # low near, peaks rising up the valley
    gully = 70.0 * fbm(X / 60.0, Y / 75.0, 6, ridged=True)                  # ribs and gullies down the faces
    crag = 22.0 * fbm(X / 16.0, Y / 16.0, 4, ridged=True)                   # broken ledges
    wall = (rise ** 1.3) * H + np.sqrt(rise) * (gully + crag)
    floor = (1.2 + 3.0 * np.clip(d / 30.0, 0, 1)) * (fbm(X / 22.0, Y / 22.0, 5) - 0.4) * np.clip(d / 5.0, 0, 1)
    fan = 6.0 * np.clip((d - start * 0.6) / 30.0, 0, 1)                      # scree fans at the foot of the walls
    Z = road + wall + floor + fan
    Z = np.where(d < 0, road - 0.12, Z)                                     # under the road and shoulder
    return _mesh_from_grid('canyon', col, X, Y, Z, rock_material())

def build_road(col):
    """Asphalt ribbon, gravel shoulders, edge lines and a dashed centre line, all following cx/rz."""
    import bmesh
    asphalt, gravel, paint = asphalt_material(), gravel_material(), paint_material()
    bm = bmesh.new(); mats = [asphalt, gravel, paint]
    def strip(x0, x1, z_off, mi, y_from=Y0, y_to=900.0, step=1.0, dash=None):
        y = y_from; prev = None
        while y <= y_to:
            on = dash is None or (y % dash[0]) < dash[1]
            c = cx(y); z = rz(y) + z_off
            dy = (cx(y + 0.5) - cx(y - 0.5))
            n = Vector((1.0, -dy, 0)).normalized()
            a = bm.verts.new((c + n.x * x0, y + n.y * x0, z)); b = bm.verts.new((c + n.x * x1, y + n.y * x1, z))
            if prev and on and prev[2]:
                f = bm.faces.new((prev[0], prev[1], b, a)); f.material_index = mi; f.smooth = True
            prev = (a, b, on)
            y += step if y < 200 else step * 4
    strip(-ROAD_HALF, ROAD_HALF, 0.0, 0)
    strip(-ROAD_HALF - SHOULDER, -ROAD_HALF, -0.06, 1); strip(ROAD_HALF, ROAD_HALF + SHOULDER, -0.06, 1)
    strip(-ROAD_HALF + 0.15, -ROAD_HALF + 0.3, 0.012, 2, y_to=700); strip(ROAD_HALF - 0.3, ROAD_HALF - 0.15, 0.012, 2, y_to=700)
    strip(-0.07, 0.07, 0.012, 2, y_to=700, step=0.5, dash=(9.0, 3.0))
    me = bpy.data.meshes.new('road'); bm.normal_update(); bm.to_mesh(me); bm.free()
    for m in mats:
        me.materials.append(m)
    ob = bpy.data.objects.new('road', me); col.objects.link(ob)
    return ob

def build_rail(col):
    """A galvanised guard rail on the wadi side: posts every 4 m, a W-beam at 0.7 m."""
    mb = MB(); steel = simple('intro_steel', '#a9aba8', 0.35, 0.9)
    y = -30.0; edge = ROAD_HALF + SHOULDER - 0.4
    pts = []
    while y < 260.0:
        c = cx(y); z = rz(y)
        mb.boxz(steel, c + edge - 0.06, c + edge + 0.06, y - 0.06, y + 0.06, z - 0.06, z + 0.62)
        pts.append((c + edge - 0.1, y, z + 0.66)); y += 4.0
    for (x0, y0, z0), (x1, y1, z1) in zip(pts, pts[1:]):
        mb.poly(steel, [(x0, y0, z0 - 0.17), (x1, y1, z1 - 0.17), (x1, y1, z1 + 0.17), (x0, y0, z0 + 0.17)])
    return mb.finish('guard_rail', col, bevel=0.0, recalc=False)

def build_scatter(col):
    """Boulders and scrub along the shoulders and on the lower slopes (more near the camera)."""
    r = random.Random(4)
    mb = MB(); stone = rock_material(); stone.name = 'intro_boulder'
    leaf = simple('intro_scrub', '#6d7a3c', 0.85); dry = simple('intro_dry', '#a28a5a', 0.9)
    trunk = simple('intro_trunk', '#5a4330', 0.9)
    for _ in range(170):
        y = Y0 + 20 + (r.random() ** 1.8) * 420
        s = 1 if r.random() < 0.5 else -1
        off = ROAD_HALF + SHOULDER + 0.6 + r.random() ** 1.5 * 30
        x = cx(y) + s * off; z = rz(y) - 0.15
        k = r.random()
        if k < 0.55:
            sz = r.uniform(0.25, 1.6)
            mb.sphere(stone, (x, y, z + sz * 0.25), sz, scale=(1.0, r.uniform(0.7, 1.3), r.uniform(0.45, 0.8)), seg=10)
        elif k < 0.9:
            sz = r.uniform(0.3, 0.8)
            for j in range(3):
                mb.sphere(leaf if r.random() < 0.6 else dry, (x + r.uniform(-0.4, 0.4), y + r.uniform(-0.4, 0.4), z + sz * 0.45),
                          sz * r.uniform(0.6, 1.0), scale=(1.2, 1.2, 0.75), seg=8)
        else:                                                                # a lone acacia
            h = r.uniform(2.6, 4.2)
            mb.cyl_between(trunk, (x, y, z), (x + 0.3, y, z + h * 0.7), 0.12, 0.08, seg=6)
            for j in range(3):
                mb.sphere(leaf, (x + r.uniform(-1, 1), y + r.uniform(-1, 1), z + h * (0.75 + 0.06 * j)), h * 0.42,
                          scale=(1.6, 1.4, 0.32), seg=10)
    return mb.finish('scatter', col, bevel=0.0)


# ----------------------------------------------------------------------------- van, light, camera
def place_on_road(rig, y, lane=-1.8):
    c = cx(y); dx = cx(y - 0.5) - cx(y + 0.5)
    n = Vector((1.0, -(cx(y + 0.5) - cx(y - 0.5)), 0)).normalized()
    rig.location = (c + n.x * lane, y + n.y * lane, rz(y))
    heading = math.atan2(-1.0, dx)                                           # the van model faces +X; drive toward -Y
    rig.rotation_euler = (0.0, 0.0, heading)

def build_van_here(col):
    ns = {'__file__': os.path.join(HERE, 'build_street.py'), '__name__': 'intro_van'}
    exec(compile(open(ns['__file__'], encoding='utf-8').read(), ns['__file__'], 'exec'), ns)
    rig = ns['build_van'](col)
    # wheels turn with distance travelled along -Y
    for o in rig.children:
        if o.name.startswith('van_wheel') and o.animation_data:
            for fc in o.animation_data.drivers:
                v = fc.driver.variables[0]; v.name = 'y'; v.targets[0].transform_type = 'LOC_Y'
                fc.driver.expression = '-y / 0.38'
    for m in bpy.data.materials:                                             # lights on at golden hour
        if m.name.startswith('head') or m.name.startswith('tail'):
            nt, b = _principled(m); b.inputs['Emission Strength'].default_value = 9.0 if m.name.startswith('head') else 3.0
    place_on_road(rig, POSTER_Y)
    return rig

def build_light(col):
    sc = bpy.context.scene
    sun_dir = Vector((0.6, 0.78, -0.13)).normalized()                       # low, from behind the camera's left: gold on the van
    sd = bpy.data.lights.new('sun', 'SUN'); sd.energy = 5.5; sd.angle = math.radians(1.2); sd.color = (1.0, 0.68, 0.42)
    sun = bpy.data.objects.new('sun', sd); col.objects.link(sun)
    sun.rotation_euler = sun_dir.to_track_quat('-Z', 'Y').to_euler()
    w = bpy.data.worlds.new('intro_sky'); sc.world = w
    try:
        w.use_nodes = True
    except Exception:
        pass
    nt = w.node_tree
    bg = next(n for n in nt.nodes if n.type == 'BACKGROUND')
    sky = nt.nodes.new('ShaderNodeTexSky')
    for t in ('MULTIPLE_SCATTERING', 'NISHITA', 'SINGLE_SCATTERING', 'HOSEK_WILKIE'):
        try:
            sky.sky_type = t; break
        except Exception:
            continue
    for attr, val in (('sun_elevation', math.radians(7.5)), ('sun_rotation', math.atan2(-sun_dir.x, -sun_dir.y) + math.pi),
                      ('sun_disc', False), ('altitude', 400.0), ('air_density', 2.2), ('dust_density', 5.0), ('sun_intensity', 0.6)):
        try:
            setattr(sky, attr, val)
        except Exception:
            pass
    nt.links.new(sky.outputs['Color'], bg.inputs['Color']); bg.inputs['Strength'].default_value = 0.4
    return sun

def build_camera(col, van):
    cd = bpy.data.cameras.new('CAM_intro'); cd.lens = 50; cd.sensor_width = 36
    cam = bpy.data.objects.new('CAM_intro', cd); col.objects.link(cam)
    y = -8.0
    cam.location = (cx(y) - ROAD_HALF - 1.0, y, rz(y) + 1.3)
    tgt = Vector((cx(400.0) - 50.0, 400.0, rz(400.0) + 16.0))
    look_at(cam, tgt)
    cd.dof.use_dof = True; cd.dof.focus_object = van; cd.dof.aperture_fstop = 2.8
    bpy.context.scene.camera = cam
    return cam

def animate(van, cam, frames):
    sc = bpy.context.scene; sc.frame_start, sc.frame_end = 1, frames
    for f in range(1, frames + 1, 4):
        u = (f - 1) / (frames - 1)
        place_on_road(van, VAN_Y[0] + (VAN_Y[1] - VAN_Y[0]) * u)
        van.keyframe_insert('location', frame=f); van.keyframe_insert('rotation_euler', frame=f)
    loc0 = cam.location.copy()
    for f, dz in ((1, 0.0), (frames, -0.12)):                               # a slow settle, like a long lens on a tripod head
        cam.location = loc0 + Vector((0.0, 0.0, dz)); cam.keyframe_insert('location', frame=f)
    cam.location = loc0


def build():
    clear_scene()
    root = coll('50 Intro')
    c_land, c_road, c_props, c_van, c_rig = (coll('51 Canyon', root), coll('52 Road', root), coll('53 Scatter', root),
                                             coll('54 Van', root), coll('59 Rig', root))
    build_terrain(c_land)
    build_road(c_road); build_rail(c_road)
    build_scatter(c_props)
    van = build_van_here(c_van)
    build_light(c_rig)
    cam = build_camera(c_rig, van)
    vs = bpy.context.scene.view_settings
    vs.view_transform = 'AgX'
    try:
        vs.look = 'AgX - Medium High Contrast'
    except Exception:
        pass
    vs.exposure = -0.25
    r = bpy.context.scene.render; r.resolution_x, r.resolution_y = 1920, 1080; r.film_transparent = False
    return van, cam


def cycles_gpu(samples):
    sc = bpy.context.scene; sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    for t in ('OPTIX', 'CUDA'):
        try:
            prefs.compute_device_type = t; prefs.get_devices()
            if any(d.type == t for d in prefs.devices):
                for d in prefs.devices:
                    d.use = d.type == t
                sc.cycles.device = 'GPU'; break
        except Exception:
            continue
    sc.cycles.samples = samples; sc.cycles.use_denoising = True
    sc.cycles.use_adaptive_sampling = True; sc.cycles.adaptive_threshold = 0.02
    sc.cycles.max_bounces = 6; sc.cycles.glossy_bounces = 3; sc.cycles.transparent_max_bounces = 4
    sc.render.use_persistent_data = True


def main(argv):
    van, cam = build()
    out = {}
    if '--render' in argv:
        cycles_gpu(160)
        sc = bpy.context.scene
        sc.render.image_settings.file_format = 'WEBP'; sc.render.image_settings.quality = 84
        sc.render.filepath = os.path.join(OUT, 'intro-poster.webp'); bpy.ops.render.render(write_still=True)
        out['poster'] = 'intro-poster.webp'
    if '--film' in argv:
        frames = 96
        animate(van, cam, frames)
        cycles_gpu(40)
        sc = bpy.context.scene; r = sc.render
        r.resolution_x, r.resolution_y = 1280, 720; r.fps = 30
        r.image_settings.media_type = 'VIDEO'
        r.image_settings.file_format = 'FFMPEG'; r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'
        r.ffmpeg.constant_rate_factor = 'MEDIUM'; r.ffmpeg.gopsize = 15
        r.filepath = os.path.join(OUT, 'intro-720.mp4')
        bpy.ops.render.render(animation=True)
        out['film'] = 'intro-720.mp4'
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(HERE, 'intro.blend'))
    print('BUILD_INTRO_RESULT', out)
    return out

if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
