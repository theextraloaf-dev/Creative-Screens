"""Bake light into textures and export the web models, plus the still, the poster and the placeholder art.

Run (from the repo root):  npm run diorama:export -- --scene street|map|all
Reads 3d/street.blend and 3d/oman-map.blend (never saved back). Writes:
  public/models/muscat-street{,-low}.glb, public/models/oman-map{,-low}.glb   (Draco, WebP textures)
  public/diorama/still.webp (street overview, canvases filled), public/diorama/map-poster.webp (CAM_map)
  public/diorama/art/stop-<n>[-<part>].webp   (placeholder artwork, canvas aspect ratio)

Static scenery is joined into a few `static_<group>` meshes, each with one baked atlas (Cycles COMBINED without
glossy, so the web can draw it unlit). Canvases keep UVMap (TEXCOORD_0, artwork) and get a `bake` UV
(TEXCOORD_1) for their own baked grey lighting; the web multiplies artwork by light / grey albedo.
The van and its wheels are baked on their own (no street shadows), so they light correctly anywhere on the path.
"""
import bpy, math, os, sys
import numpy as np

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE)
MODELS = os.path.join(REPO, 'public', 'models')
DIORAMA = os.path.join(REPO, 'public', 'diorama')
GREY = '#b9b9b4'

# groups: name -> predicate(object) for the static meshes, and atlas size (high variant)
STREET_GROUPS = [
    ('static_base', lambda o: o.users_collection[0].name == '11 Ground' and o.name not in ('sea', 'sea_foam'), 2048),
    ('static_street', lambda o: o.users_collection[0].name == '12 Buildings', 2048),
    ('static_props', lambda o: o.users_collection[0].name == '40 Props' and o.name != 'palms', 1024),
    ('static_palms', lambda o: o.name in ('palms', 'plaza_palms'), 1024),       # swayed by the web
    ('static_stops', lambda o: o.users_collection[0].name == '20 Stops' and not o.name.startswith('canvas_'), 1024),
]
MAP_GROUPS = [
    ('static_terrain', lambda o: o.name == 'oman_terrain', 2048),
    ('static_plinth', lambda o: o.name == 'oman_plinth', 1024),
    ('static_neighbours', lambda o: o.name in ('neighbours', 'borders'), 512),
    ('static_sea', lambda o: o.name in ('sea', 'sea_foam'), 1024),
    ('static_landmarks', lambda o: o.users_collection[0].name == '03 Landmarks' and not o.name.startswith('pin3d_'), 2048),
]

# ----------------------------------------------------------------------------- cycles setup
def cycles(samples=64):
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'
    prefs = bpy.context.preferences.addons['cycles'].preferences
    device = 'CPU'
    for t in ('OPTIX', 'CUDA', 'HIP', 'ONEAPI'):
        try:
            prefs.compute_device_type = t; prefs.get_devices()
            gpus = [d for d in prefs.devices if d.type == t]
            if gpus:
                for d in prefs.devices:
                    d.use = d.type == t
                device = t
                break
        except Exception:
            continue
    sc.cycles.device = 'GPU' if device != 'CPU' else 'CPU'
    sc.cycles.samples = samples if device != 'CPU' else min(samples, 24)
    b = sc.render.bake
    b.use_pass_direct = b.use_pass_indirect = True
    b.use_pass_diffuse = b.use_pass_emit = b.use_pass_transmission = True
    b.use_pass_glossy = False
    b.margin = 6
    print('bake device:', device, 'samples:', sc.cycles.samples)

def select_only(objs, active):
    for o in bpy.context.view_layer.objects:
        o.select_set(False)
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = active

# ----------------------------------------------------------------------------- join + uv + bake
def join(name, objs):
    """Apply modifiers, make data single-user, join into one mesh named `name` (world transforms kept)."""
    objs = [o for o in objs if o.type == 'MESH']
    if not objs:
        return None
    for o in objs:
        o.hide_set(False); o.hide_viewport = False
    select_only(objs, objs[0])
    bpy.ops.object.make_single_user(object=True, obdata=True, material=False)
    bpy.ops.object.convert(target='MESH')
    if len(objs) > 1:
        bpy.ops.object.join()
    ob = bpy.context.view_layer.objects.active
    ob.name = name; ob.data.name = name
    return ob

def own_materials(ob):
    """Copies of the object's materials, so the bake target node never leaks into another object's bake."""
    for i, slot in enumerate(ob.material_slots):
        if slot.material:
            ob.material_slots[i].material = slot.material.copy()

def bake_uv(ob, from_layer=None):
    me = ob.data
    if from_layer:                                           # canvases: bake UV = a copy of the art UV (already 0..1)
        src = me.uv_layers[from_layer]
        dst = me.uv_layers.new(name='bake')
        dst.data.foreach_set('uv', np.array([d.uv[:] for d in src.data]).ravel())
        me.uv_layers.active = dst
        return
    for uv in list(me.uv_layers):
        me.uv_layers.remove(uv)
    me.uv_layers.new(name='bake')
    select_only([ob], ob)
    bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.uv.smart_project(angle_limit=math.radians(66), island_margin=0.004, scale_to_bounds=False)
    bpy.ops.object.mode_set(mode='OBJECT')

_TMP = None

def to_display(img):
    """Float (linear) bake -> 8-bit texture through the scene's colour management (AgX, its look and exposure),
    so the unlit web scene matches the approved EEVEE renders instead of clipping highlights and crushing shade."""
    global _TMP
    import tempfile
    _TMP = _TMP or tempfile.mkdtemp(prefix='diorama_bake_')
    sc = bpy.context.scene; s = sc.render.image_settings
    s.file_format = 'PNG'; s.color_mode = 'RGB'; s.color_depth = '8'
    path = os.path.join(_TMP, f'{img.name}.png')
    img.save_render(path, scene=sc)
    name = img.name
    bpy.data.images.remove(img)
    out = bpy.data.images.load(path); out.name = name
    return out

def bake(ob, size):
    img = bpy.data.images.new(f'{ob.name}_bake', size, size, alpha=False, float_buffer=True)
    for slot in ob.material_slots:
        m = slot.material
        if not m:
            continue
        nt = m.node_tree
        node = nt.nodes.new('ShaderNodeTexImage'); node.image = img
        nt.nodes.active = node
    select_only([ob], ob)
    bpy.ops.object.bake(type='COMBINED', use_clear=True, margin=6, uv_layer='bake')
    return to_display(img)

def _bake_into(ob, img, kind, **kw):
    for slot in ob.material_slots:
        if slot.material:
            nt = slot.material.node_tree
            node = nt.nodes.new('ShaderNodeTexImage'); node.image = img; nt.nodes.active = node
    select_only([ob], ob)
    bpy.ops.object.bake(type=kind, use_clear=True, margin=6, uv_layer='bake', **kw)

def bake_surface(ob, size):
    """Surface detail for the web's specular layer, at half the diffuse size: tangent-space normals (from the
    procedural bumps) and an ORM texture (R occlusion = 1, G roughness, B metal = 0)."""
    s = max(128, size // 2)
    nrm = bpy.data.images.new(f'{ob.name}_normal', s, s, alpha=False); nrm.colorspace_settings.name = 'Non-Color'
    _bake_into(ob, nrm, 'NORMAL', normal_space='TANGENT')
    orm = bpy.data.images.new(f'{ob.name}_orm', s, s, alpha=False); orm.colorspace_settings.name = 'Non-Color'
    _bake_into(ob, orm, 'ROUGHNESS')
    px = np.empty(s * s * 4, dtype=np.float32); orm.pixels.foreach_get(px); px = px.reshape(-1, 4)
    px[:, 1] = px[:, 0]; px[:, 0] = 1.0; px[:, 2] = 0.0
    orm.pixels.foreach_set(px.ravel()); orm.update(); orm.pack()
    nrm.pack()
    return nrm, orm

def baked_material(ob, img, uv='bake', normal=None, orm=None):
    m = bpy.data.materials.new(f'baked_{ob.name}')
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); b = nt.nodes.new('ShaderNodeBsdfPrincipled')
    tx = nt.nodes.new('ShaderNodeTexImage'); tx.image = img
    uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = uv
    nt.links.new(uvn.outputs['UV'], tx.inputs['Vector'])
    nt.links.new(tx.outputs['Color'], b.inputs['Base Color'])
    b.inputs['Roughness'].default_value = 1.0
    if normal is not None:
        tn = nt.nodes.new('ShaderNodeTexImage'); tn.image = normal
        nm = nt.nodes.new('ShaderNodeNormalMap'); nm.uv_map = uv
        nt.links.new(uvn.outputs['UV'], tn.inputs['Vector']); nt.links.new(tn.outputs['Color'], nm.inputs['Color'])
        nt.links.new(nm.outputs['Normal'], b.inputs['Normal'])
    if orm is not None:
        to = nt.nodes.new('ShaderNodeTexImage'); to.image = orm
        sep = nt.nodes.new('ShaderNodeSeparateColor')
        nt.links.new(uvn.outputs['UV'], to.inputs['Vector']); nt.links.new(to.outputs['Color'], sep.inputs['Color'])
        nt.links.new(sep.outputs['Green'], b.inputs['Roughness']); nt.links.new(sep.outputs['Blue'], b.inputs['Metallic'])
    nt.links.new(b.outputs[0], out.inputs['Surface'])
    ob.data.materials.clear(); ob.data.materials.append(m)

def bake_static(groups):
    done = []
    for name, pred, size in groups:
        objs = [o for o in bpy.context.scene.objects if o.type == 'MESH' and pred(o)]
        ob = join(name, objs)
        if not ob:
            continue
        own_materials(ob); bake_uv(ob)
        img = bake(ob, size); nrm, orm = bake_surface(ob, size)
        baked_material(ob, img, normal=nrm, orm=orm); done.append((ob, img))
        print(f'baked {name}: {len(ob.data.polygons)} faces, {size}px')
    return done

def bake_single(ob, size, isolate=None, from_layer=None, surface=False):
    """Bake one object (optionally with only `isolate` visible to the renderer)."""
    hidden = []
    if isolate is not None:
        for o in bpy.context.scene.objects:
            if o.type == 'MESH' and o not in isolate and not o.hide_render:
                o.hide_render = True; hidden.append(o)
    select_only([ob], ob)
    bpy.ops.object.make_single_user(object=True, obdata=True, material=False)
    bpy.ops.object.convert(target='MESH')
    own_materials(ob); bake_uv(ob, from_layer=from_layer)
    img = bake(ob, size)
    nrm, orm = bake_surface(ob, size) if surface else (None, None)
    baked_material(ob, img, normal=nrm, orm=orm)
    for o in hidden:
        o.hide_render = False
    return img

# ----------------------------------------------------------------------------- export
def export(path, low=False):
    """High: Draco 14-bit positions / 12-bit UVs. Low (phones): 12-bit positions (under 2.5 cm on the 90 m street,
    about 0.3 km on the map), 10-bit UVs, max compression, so geometry shrinks along with the halved textures."""
    bpy.ops.export_scene.gltf(
        filepath=path, export_format='GLB', export_apply=True, export_extras=True, export_cameras=True,
        export_lights=False, export_animations=False, export_image_format='WEBP', export_image_quality=82 if not low else 78,
        export_draco_mesh_compression_enable=True, export_draco_mesh_compression_level=10 if low else 6,
        export_draco_position_quantization=12 if low else 14, export_draco_texcoord_quantization=10 if low else 12,
        export_texcoords=True, export_normals=False, export_materials='EXPORT')
    print(f'exported {os.path.relpath(path, REPO)}: {os.path.getsize(path) / 1024:.0f} KB')

def export_pair(name, low_dissolve=()):
    """High, then the phone variant: textures at half size and, for the named meshes, a planar decimate that keeps
    boundary edges (so the terrain still meets its cliffs) and UV islands (so the bake still fits)."""
    os.makedirs(MODELS, exist_ok=True)
    export(os.path.join(MODELS, f'{name}.glb'))
    for img in bpy.data.images:
        if img.name.endswith(('_bake', '_normal', '_orm')) and img.size[0] > 128:
            img.scale(img.size[0] // 2, img.size[1] // 2)
    for n in low_dissolve:
        d = bpy.data.objects[n].modifiers.new('low', 'DECIMATE')
        d.decimate_type = 'DISSOLVE'; d.angle_limit = math.radians(3.0)
        d.use_dissolve_boundaries = False; d.delimit = {'UV'}
    export(os.path.join(MODELS, f'{name}-low.glb'), low=True)

def drop_helpers(names):
    for n in names:
        o = bpy.data.objects.get(n)
        if o:
            bpy.data.objects.remove(o, do_unlink=True)

def street():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'street.blend'))
    cycles()
    bpy.context.scene.frame_set(1)
    drop_helpers(['sun_helper'])
    van_parts = [o for o in bpy.context.scene.objects if o.users_collection[0].name == '30 Van' and o.type == 'MESH']
    # van: join the logos into the body (they never move relative to it); wheels stay separate (they turn)
    body = bpy.data.objects['van_body']
    logos = [bpy.data.objects['van_logo_near'], bpy.data.objects['van_logo_far']]
    van_iso = list(van_parts)
    canvases = [o for o in bpy.context.scene.objects if o.name.startswith('canvas_')]
    write_hotspots()
    env_map()
    bake_static(STREET_GROUPS)
    for n in ('sea', 'sea_foam'):                     # separate, so the web can animate the water
        bake_single(bpy.data.objects[n], 1024 if n == 'sea' else 256, surface=n == 'sea')
    for c in canvases:
        bake_single(c, 256, from_layer='UVMap')
    # logos keep their names (the page and the tests look them up) but are baked with the body's light
    for o in [body] + logos + [w for w in van_parts if 'wheel' in w.name]:
        bake_single(o, 1024 if o is body else 256, isolate=van_iso, surface=o is body)
    export_pair('muscat-street')

def map_():
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'oman-map.blend'))
    cycles()
    bake_static(MAP_GROUPS)
    for o in [o for o in bpy.data.objects if o.name.startswith('pin3d_')]:
        bake_single(o, 256)                            # the tokens move (pop, face the camera): their own meshes
    export_pair('oman-map', low_dissolve=('static_terrain',))

def write_hotspots():
    """Where each stop's hotspot sits on the still image (reduced motion): CAM_overview at the still's 1920x1080."""
    import json, re
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene; sc.render.resolution_x, sc.render.resolution_y = 1920, 1080
    cam = bpy.data.objects['CAM_overview']; out = []
    for n in range(1, 6):
        v = world_to_camera_view(sc, cam, bpy.data.objects[f'hotspot_{n}'].matrix_world.translation)
        out.append({'n': n, 'x': round(v.x, 4), 'y': round(1 - v.y, 4)})
    path = os.path.join(REPO, 'src', 'data', 'diorama.json'); txt = open(path, encoding='utf-8').read()
    txt = re.sub(r'"hotspots": \[[^\]]*\]', '"hotspots": ' + json.dumps(out), txt, count=1)
    open(path, 'w', encoding='utf-8').write(txt)
    print('hotspots', out)

def env_map():
    """Equirectangular render of the street from above its middle: what the van's paint, glass and the water reflect."""
    sc = bpy.context.scene; r = sc.render; s = r.image_settings
    cd = bpy.data.cameras.new('env_cam'); cd.type = 'PANO'
    try:
        cd.panorama_type = 'EQUIRECTANGULAR'
    except Exception:
        cd.cycles.panorama_type = 'EQUIRECTANGULAR'
    cam = bpy.data.objects.new('env_cam', cd); sc.collection.objects.link(cam)
    cam.location = (0.0, -2.0, 6.0); cam.rotation_euler = (math.pi / 2, 0, 0)
    keep = (sc.camera, r.resolution_x, r.resolution_y, r.film_transparent, sc.cycles.samples)
    sc.camera = cam; r.resolution_x, r.resolution_y = 1024, 512; r.film_transparent = False; sc.cycles.samples = 32
    s.file_format = 'WEBP'; s.color_mode = 'RGB'; s.quality = 80
    os.makedirs(DIORAMA, exist_ok=True)
    r.filepath = os.path.join(DIORAMA, 'env.webp'); bpy.ops.render.render(write_still=True)
    sc.camera, r.resolution_x, r.resolution_y, r.film_transparent, sc.cycles.samples = keep
    bpy.data.objects.remove(cam, do_unlink=True)
    print('rendered env.webp')

def _fcurves(action):
    try:
        return list(action.fcurves)
    except AttributeError:
        return [c for l in action.layers for st in l.strips for b in st.channelbags for c in b.fcurves]

def _emission(name, color=None):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    nt = m.node_tree
    for n in list(nt.nodes):
        nt.nodes.remove(n)
    out = nt.nodes.new('ShaderNodeOutputMaterial'); em = nt.nodes.new('ShaderNodeEmission')
    if color:
        em.inputs['Color'].default_value = color
    nt.links.new(em.outputs[0], out.inputs['Surface'])
    return m, nt, em

def _video_output(r):
    """Blender 5.x hides FFMPEG behind media_type = 'VIDEO'; older versions have no media_type."""
    if 'media_type' in r.image_settings.bl_rna.properties:
        r.image_settings.media_type = 'VIDEO'

def led_loop(seconds=6, fps=30):
    """A seamless brand loop for the LED screen: navy, lime bands sweeping on the diagonal, a white pinstripe, the
    wordmark. Rendered flat (Standard view) straight to H.264."""
    import glob
    bpy.ops.wm.read_homefile(use_empty=True)
    import build_street as bs
    bs._M.clear()                                   # the reset removed every material the cache still points at
    sc = bpy.context.scene; col = sc.collection
    me = bpy.data.meshes.new('led_plane'); w, h = 1.6, 0.9
    me.from_pydata([(-w / 2, 0, -h / 2), (w / 2, 0, -h / 2), (w / 2, 0, h / 2), (-w / 2, 0, h / 2)], [], [(0, 1, 2, 3)])
    uv = me.uv_layers.new(name='UVMap'); uv.data.foreach_set('uv', [0, 0, 1, 0, 1, 1, 0, 1])
    plane = bpy.data.objects.new('led_plane', me); col.objects.link(plane)
    m, nt, em = _emission('led_art')
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['UV'], sep.inputs[0])
    t = nt.nodes.new('ShaderNodeValue'); t.name = 'T'
    diag = bs._math(nt, 'ADD', bs._math(nt, 'MULTIPLY', sep.outputs[0], 0.75 * 16 / 9), bs._math(nt, 'MULTIPLY', sep.outputs[1], 0.55))
    d = bs._math(nt, 'FRACT', bs._math(nt, 'SUBTRACT', bs._math(nt, 'MULTIPLY', diag, 1.6), t.outputs[0]))
    band = bs._math(nt, 'LESS_THAN', d, 0.3)
    pin = bs._math(nt, 'LESS_THAN', bs._math(nt, 'ABSOLUTE', bs._math(nt, 'SUBTRACT', d, 0.44)), 0.025)
    c = bs._mixc(nt, band, bs.lin('#131d27'), bs.lin('#bbd440')); c = bs._mixc(nt, pin, c, bs.lin('#ffffff'))
    nt.links.new(c, em.inputs['Color'])
    me.materials.append(m)
    frames = seconds * fps
    t.outputs[0].default_value = 0.0; t.outputs[0].keyframe_insert('default_value', frame=1)
    t.outputs[0].default_value = 1.0; t.outputs[0].keyframe_insert('default_value', frame=frames + 1)
    for fc in _fcurves(nt.animation_data.action):
        for k in fc.keyframe_points:
            k.interpolation = 'LINEAR'
    logo = bs.import_logo(col, 'led_logo', -0.42, 0.42, 0.0, -0.01)
    white, _, _ = _emission('led_white', (1, 1, 1, 1))
    logo.data.materials.clear(); logo.data.materials.append(white)
    cd = bpy.data.cameras.new('led_cam'); cd.type = 'ORTHO'; cd.ortho_scale = w
    cam = bpy.data.objects.new('led_cam', cd); col.objects.link(cam); cam.location = (0, -5, 0); cam.rotation_euler = (math.pi / 2, 0, 0)
    sc.camera = cam
    r = sc.render
    items = [i.identifier for i in r.bl_rna.properties['engine'].enum_items]
    r.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in items else 'BLENDER_EEVEE'
    r.resolution_x, r.resolution_y, r.resolution_percentage = 1024, 576, 100
    r.fps = fps
    sc.frame_start, sc.frame_end = 1, frames
    sc.view_settings.view_transform = 'Standard'
    _video_output(r); r.image_settings.file_format = 'FFMPEG'
    r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'
    r.ffmpeg.constant_rate_factor = 'MEDIUM'; r.ffmpeg.ffmpeg_preset = 'GOOD'; r.ffmpeg.gopsize = fps
    for f in glob.glob(os.path.join(DIORAMA, 'led-loop*.mp4')):
        os.remove(f)
    r.filepath = os.path.join(DIORAMA, 'led-loop')
    bpy.ops.render.render(animation=True)
    made = sorted(glob.glob(os.path.join(DIORAMA, 'led-loop*.mp4')), key=os.path.getmtime)[-1]
    os.replace(made, os.path.join(DIORAMA, 'led-loop.mp4'))
    print(f'rendered led-loop.mp4 ({os.path.getsize(os.path.join(DIORAMA, "led-loop.mp4")) // 1024} KB)')

# ----------------------------------------------------------------------------- still, poster, placeholder art
def render_webp(path, camera):
    sc = bpy.context.scene; s = sc.render.image_settings
    sc.camera = camera; sc.render.film_transparent = True
    s.file_format = 'WEBP'; s.color_mode = 'RGBA'; s.quality = 85
    sc.render.filepath = path
    bpy.ops.render.render(write_still=True)
    print(f'rendered {os.path.relpath(path, REPO)}')

def stills():
    os.makedirs(DIORAMA, exist_ok=True)
    import build_street as bs
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'street.blend'))
    bs._M.clear()
    for m in bpy.data.materials:
        bs._M[m.name] = m
    bs.set_filled(True)
    van = bpy.data.objects['van']; keys = van.get('stop_frames')
    bpy.context.scene.frame_set(int(keys[6]) - 5 if keys else 1)       # parked at stop 3
    render_webp(os.path.join(DIORAMA, 'still.webp'), bpy.data.objects['CAM_overview'])
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'oman-map.blend'))
    render_webp(os.path.join(DIORAMA, 'map-poster.webp'), bpy.data.objects['CAM_map'])

SLUGS = {1: 'signage', 2: 'wrap', 3: 'led', 4: 'stand', 5: 'flags'}

def _wipe_material(n, rtl, bs):
    """The web's fill as a Blender material: grey ahead of the edge, a lime band, a navy band, then the artwork.
    Driven by a keyframed value node named 'P' (0..1); right to left in Arabic, the artwork never flipped."""
    m = bs.art_mat(n, emit=4.0 if n == 3 else 0.0).copy(); m.name = f'film_wipe_{n}'
    nt = m.node_tree
    b = next(x for x in nt.nodes if x.type == 'BSDF_PRINCIPLED')
    art = next(l.from_socket for l in nt.links if l.to_socket == b.inputs['Base Color'])
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); nt.links.new(tc.outputs['UV'], sep.inputs[0])
    u = bs._math(nt, 'SUBTRACT', 1.0, sep.outputs[0]) if rtl else sep.outputs[0]
    pv = nt.nodes.new('ShaderNodeValue'); pv.name = 'P'; pv.outputs[0].default_value = 0.0
    e = bs._math(nt, 'MULTIPLY', pv.outputs[0], 1.24)
    on = lambda off: bs._math(nt, 'LESS_THAN', u, bs._math(nt, 'SUBTRACT', e, off))
    c = bs._mixc(nt, on(0.0), bs.lin('#b9b9b4'), bs.lin('#bbd440'))
    c = bs._mixc(nt, on(0.06), c, bs.lin('#131d27'))
    c = bs._mixc(nt, on(0.12), c, art)
    nt.links.new(c, b.inputs['Base Color'])
    if n == 3:
        nt.links.new(c, b.inputs['Emission Color'])
    return m, pv

def film(seconds=8, fps=30):
    """The opening film, EN and AR, 1080p and 720p: a held shot over the stretch with stops 2 and 3; the van drives
    through (far lane, right to left in Arabic) and both surfaces wipe into brand colour as it passes. Plays once and
    rests on its last frame, which is also the poster (a loop would snap the filled surfaces back to grey on screen)."""
    import glob
    import build_street as bs
    frames = seconds * fps
    for lang in ('en', 'ar'):
        rtl = lang == 'ar'
        bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'street.blend'))
        bs._M.clear()
        for m in bpy.data.materials:
            bs._M[m.name] = m
        sc = bpy.context.scene; r = sc.render
        van = bpy.data.objects['van']
        van.animation_data_clear()
        stop3 = next(s for s in bs.CFG['stops'] if s['n'] == 3)
        park = stop3['vanX'] if not rtl else min(bs.CFG['vanEnd'] - 2, 2 * stop3['canvasX'] - stop3['vanX'])
        sx, ex = (-30.0, park) if not rtl else (22.0, park)       # drives in and parks under the LED screen
        van.location = (sx, bs.CFG['rtl']['laneY'] if rtl else bs.LANE_Y, 0.0)
        van.rotation_euler = (0, 0, math.pi if rtl else 0.0)
        van.keyframe_insert('location', index=0, frame=1)
        arrive = int(frames * 0.72)                                # parked for the last quarter: the LED fills
        van.location.x = ex; van.keyframe_insert('location', index=0, frame=arrive)
        fcx = [fc for fc in _fcurves(van.animation_data.action) if fc.data_path == 'location' and fc.array_index == 0][0]
        for k in fcx.keyframe_points:
            k.interpolation = 'BEZIER'; k.handle_left_type = k.handle_right_type = 'AUTO_CLAMPED'
        k0 = fcx.keyframe_points[0]; k0.interpolation = 'LINEAR'          # full speed in from off-screen, easing to the stop
        fcx.update()
        def frame_at(x):
            for f in range(1, frames + 1):
                v = fcx.evaluate(f)
                if (v >= x) if not rtl else (v <= x):
                    return f
            return frames
        for n in (2, 3):
            cx = next(c for (nn, _, c, _) in bs.STOPS if nn == n)
            m, pv = _wipe_material(n, rtl, bs)
            for o in bpy.data.objects:
                if o.name.startswith(f'canvas_{n}_'):
                    o.data.materials[0] = m
            if n == 2:                                             # the bus wraps as the van passes it
                a, b = (cx - 6, cx + 2) if not rtl else (cx + 6, cx - 2)
                f0, f1 = frame_at(a), frame_at(b)
            else:                                                  # the LED fills once the van has pulled in
                f0 = arrive - 6; f1 = min(frames - 12, arrive + 40)
            pv.outputs[0].default_value = 0.0; pv.outputs[0].keyframe_insert('default_value', frame=max(1, f0))
            pv.outputs[0].default_value = 1.0; pv.outputs[0].keyframe_insert('default_value', frame=max(f0 + 12, f1))
        sc.camera = bpy.data.objects[f'film_cam_{lang}']
        items = [i.identifier for i in r.bl_rna.properties['engine'].enum_items]
        r.engine = 'BLENDER_EEVEE_NEXT' if 'BLENDER_EEVEE_NEXT' in items else 'BLENDER_EEVEE'
        try:
            sc.eevee.taa_render_samples = 32
        except Exception:
            pass
        r.use_motion_blur = True
        r.film_transparent = False; r.fps = fps
        sc.frame_start, sc.frame_end = 1, frames
        os.makedirs(DIORAMA, exist_ok=True)
        # poster: the last frame (both surfaces filled), what the page shows before and after the film
        sc.frame_set(frames)
        r.resolution_x, r.resolution_y, r.resolution_percentage = 1920, 1080, 100
        r.image_settings.file_format = 'WEBP'; r.image_settings.color_mode = 'RGB'; r.image_settings.quality = 78
        r.filepath = os.path.join(DIORAMA, f'film-poster-{lang}.webp'); bpy.ops.render.render(write_still=True)
        for (w, h, crf) in ((1920, 1080, 'LOW'), (1280, 720, 'LOW')):
            r.resolution_x, r.resolution_y = w, h
            _video_output(r); r.image_settings.file_format = 'FFMPEG'
            r.ffmpeg.format = 'MPEG4'; r.ffmpeg.codec = 'H264'; r.ffmpeg.constant_rate_factor = crf
            r.ffmpeg.ffmpeg_preset = 'GOOD'; r.ffmpeg.gopsize = fps; r.ffmpeg.audio_codec = 'NONE'
            stem = os.path.join(DIORAMA, f'film-{lang}-{h}')
            for f in glob.glob(stem + '*.mp4'):
                os.remove(f)
            r.filepath = stem
            bpy.ops.render.render(animation=True)
            made = sorted(glob.glob(stem + '*.mp4'), key=os.path.getmtime)[-1]
            os.replace(made, stem + '.mp4')
            print(f'rendered film-{lang}-{h}.mp4 ({os.path.getsize(stem + ".mp4") // 1024} KB)')

def story_photos():
    """Placeholder story photos rendered from our own street with the canvases filled (tagged "Sample" on the page):
    per stop a hero shot with the van parked, plus three detail angles. 1280x800 WebP, sky visible."""
    from mathutils import Vector
    import build_street as bs
    out = os.path.join(DIORAMA, 'stories'); os.makedirs(out, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'street.blend'))
    bs._M.clear()
    for m in bpy.data.materials:
        bs._M[m.name] = m
    bs.set_filled(True)
    sc = bpy.context.scene; r = sc.render; s_ = r.image_settings
    r.resolution_x, r.resolution_y = 1280, 800; r.film_transparent = False
    s_.file_format = 'WEBP'; s_.color_mode = 'RGB'; s_.quality = 82
    keys = list(bpy.data.objects['van'].get('stop_frames') or [])
    cd = bpy.data.cameras.new('story_cam'); cam = bpy.data.objects.new('story_cam', cd); sc.collection.objects.link(cam)
    sc.camera = cam
    for n, slug in SLUGS.items():
        cs = [o for o in bpy.data.objects if o.name.startswith(f'canvas_{n}_')]
        c = sum((o.matrix_world.translation for o in cs), Vector()) / len(cs)
        if keys:
            sc.frame_set(int(keys[2 * n]) - 5)            # the van parked at this stop
        shots = [((-4.0, -15.0, 4.5), 30), ((0.0, -6.0, 0.6), 45), ((-6.0, -7.0, 1.6), 35), ((5.5, -8.0, 3.2), 35)]
        for i, (off, lens) in enumerate(shots, start=1):
            cam.location = c + Vector(off); cd.lens = lens
            cam.rotation_euler = (c + Vector((0, 0, 0.3)) - cam.location).to_track_quat('-Z', 'Y').to_euler()
            r.filepath = os.path.join(out, f'{slug}-{i}.webp')
            bpy.ops.render.render(write_still=True)
        print(f'story photos {slug}: 4')

def art_pixels(w, h, n):
    """Same artwork as build_street.art_mat, computed in UV space: navy, lime band, white pinstripe, lime dot."""
    def srgb(hx): return np.array([int(hx[i:i + 2], 16) / 255 for i in (1, 3, 5)], dtype=np.float32)
    u, v = np.meshgrid((np.arange(w) + 0.5) / w, (np.arange(h) + 0.5) / h)
    off = [0.45, 0.62, 0.38, 0.55, 0.5][(n - 1) % 5]
    d = 0.75 * u + 0.55 * v
    img = np.empty((h, w, 3), dtype=np.float32); img[:] = srgb('#131d27')
    img[np.abs(d - off) < 0.13] = srgb('#bbd440')
    img[np.abs(d - off - 0.24) < 0.025] = srgb('#ffffff')
    img[np.hypot(u - 0.16, v - 0.7) < 0.1] = srgb('#bbd440')
    return img

def placeholder_art():
    out = os.path.join(DIORAMA, 'art'); os.makedirs(out, exist_ok=True)
    bpy.ops.wm.open_mainfile(filepath=os.path.join(HERE, 'street.blend'))
    for o in bpy.context.scene.objects:
        if not o.name.startswith('canvas_'):
            continue
        n, svc = o['canvas'], o['service']
        part = o.name[len(f'canvas_{n}_{svc}'):].lstrip('_')
        xs = [v.co.x for v in o.data.vertices]; zs = [v.co.z for v in o.data.vertices]
        aspect = (max(xs) - min(xs)) / (max(zs) - min(zs))
        w, h = (1024, max(16, round(1024 / aspect))) if aspect >= 1 else (max(16, round(1024 * aspect)), 1024)
        px = np.ones((h, w, 4), dtype=np.float32); px[..., :3] = art_pixels(w, h, n)
        img = bpy.data.images.new(f'art_{o.name}', w, h, alpha=False)
        img.pixels.foreach_set(px.ravel())
        fname = f'stop-{n}' + (f'-{part}' if part else '') + '.webp'
        img.filepath_raw = os.path.join(out, fname); img.file_format = 'WEBP'
        img.save()
        print(f'art {fname} {w}x{h}')

def main(argv):
    scene = argv[argv.index('--scene') + 1] if '--scene' in argv else 'all'
    if scene in ('street', 'all'):
        street()
    if scene in ('map', 'all'):
        map_()
    if scene in ('stills', 'all'):
        stills()
    if scene in ('art', 'all'):
        placeholder_art()
    if scene in ('stories', 'all'):
        story_photos()
    if scene == 'film':                                     # long: not part of 'all'
        film()
    if scene in ('led', 'all'):
        led_loop()

if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
