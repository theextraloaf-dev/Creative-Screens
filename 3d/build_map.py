"""Oman map diorama: the opening scene of the journey, which then dives into the Muscat street.
Design: docs/superpowers/specs/2026-11-20-muscat-diorama-journey-design.md ("The Oman map intro")

Run headless (from the repo root, after `npm run diorama:data`):
    node scripts/blender.mjs 3d/build_map.py [-- --render 3d/renders]
Units: 1 Blender unit = 1 km, equirectangular about 57E 21N (3d/map/geo.py). Heights x15.

- oman_terrain: true outline incl. Musandam and Madha, AWS Terrain Tiles heights, colours from height/slope/region
- oman_plinth: carved rock cliffs along every Oman edge, down to the table (z -30)
- neighbours (UAE, Saudi Arabia, Yemen, Iran) as plain flat slabs below Oman; borders as thin ribbons
- sea with a coast-to-deep gradient, foam along Oman's coast
- generic miniatures only (no replicas, no text): a fort near Nizwa, dunes in the Sharqiya Sands, palms on the
  Batinah coast, dhows and ships; trees and rocks; 3D pin tokens at the six route cities; the journey route;
  muscat_anchor where the street tile sits; label_* empties
  for the HTML labels; CAM_map, whose framing is written back to src/data/diorama.json (map.camera)
"""
import bpy, bmesh, json, math, os, random, re, sys
import numpy as np
from mathutils import Vector, Matrix, noise

HERE = os.path.dirname(os.path.abspath(__file__))
REPO = os.path.dirname(HERE)
sys.path.insert(0, HERE); sys.path.insert(0, os.path.join(HERE, 'map'))
from kit import *  # noqa: F401,F403
from kit import _M, _principled, _strata_material, add_bump  # noqa: E402
from geo import project, tile_xy, KM_PER_DEG_LON, KM_PER_DEG_LAT, LON0, LAT0  # noqa: E402

CFG_PATH = os.path.join(REPO, 'src', 'data', 'diorama.json')
CFG = json.load(open(CFG_PATH, encoding='utf-8'))
DATA = os.path.join(HERE, 'map', 'data')
BBOX = (51.5, 16.0, 60.5, 27.0)        # west, south, east, north: the whole block on the table
ZOOM = 7
HSCALE = 6.0 / 1000.0                  # metres -> km, exaggerated x6: gentle relief that holds up close (the van's camera)
GRID = 2.5                             # terrain sample spacing, km (the blur, not density, makes it soft)
ROAD_STEP = 0.75                       # the road is sampled every 0.75 km (the van's path every 1.5)
ROAD_FLAT, ROAD_FADE = 2.5, 7.0        # km either side of the road: flattened to the road, then blended back
ROAD_GRADE = 0.12                      # steepest the road climbs (km per km): it cuts passes through the ridges
OMAN_XY = None
LANDMARK_XY = []                       # big landmarks (the fort): tokens keep clear of them
TERRAIN = None                         # (xs, ys, Zg) once build_terrain has run: the one height every prop stands on
SEA_Z, NEIGHBOUR_Z, BOTTOM_Z = -6.0, -4.0, -30.0
rng = random.Random(23)
LM = 2.2          # landmark scale: toy-like exaggeration so they read at the overview distance

def P(lon, lat):
    return np.array(project(lon, lat))

# ----------------------------------------------------------------------------- data
def load_countries():
    fc = json.load(open(os.path.join(DATA, 'countries.geojson'), encoding='utf-8'))
    out = {}
    for ft in fc['features']:
        rings = [np.array(ring, dtype=np.float64) for poly in ft['geometry']['coordinates'] for ring in poly]
        out[ft['properties']['name']] = rings
    return out

class DEM:
    """Mosaic of Terrarium tiles; sample(lon, lat) -> metres (bilinear)."""
    def __init__(self):
        self.x0, self.y0 = tile_xy(BBOX[0], BBOX[3], ZOOM)
        x1, y1 = tile_xy(BBOX[2], BBOX[1], ZOOM)
        nx, ny = x1 - self.x0 + 1, y1 - self.y0 + 1
        self.h = np.zeros((ny * 256, nx * 256), dtype=np.float32)
        for tx in range(nx):
            for ty in range(ny):
                p = os.path.join(DATA, 'terrarium', str(ZOOM), str(self.x0 + tx), f'{self.y0 + ty}.png')
                img = bpy.data.images.load(p, check_existing=False)
                img.colorspace_settings.name = 'Non-Color'
                px = np.empty(256 * 256 * 4, dtype=np.float32); img.pixels.foreach_get(px)
                px = np.round(px.reshape(256, 256, 4)[::-1] * 255.0)      # Blender rows run bottom-up
                self.h[ty * 256:(ty + 1) * 256, tx * 256:(tx + 1) * 256] = px[..., 0] * 256 + px[..., 1] + px[..., 2] / 256 - 32768
                bpy.data.images.remove(img)

    def sample(self, lon, lat):
        lon = np.asarray(lon, dtype=np.float64); lat = np.asarray(lat, dtype=np.float64)
        n = 2 ** ZOOM * 256
        gx = (lon + 180.0) / 360.0 * n - self.x0 * 256 - 0.5
        gy = (1.0 - np.arcsinh(np.tan(np.radians(lat))) / np.pi) / 2.0 * n - self.y0 * 256 - 0.5
        gx = np.clip(gx, 0, self.h.shape[1] - 1.001); gy = np.clip(gy, 0, self.h.shape[0] - 1.001)
        ix, iy = gx.astype(int), gy.astype(int); fx, fy = gx - ix, gy - iy
        h = self.h
        return ((h[iy, ix] * (1 - fx) + h[iy, ix + 1] * fx) * (1 - fy) + (h[iy + 1, ix] * (1 - fx) + h[iy + 1, ix + 1] * fx) * fy)

def unproject(x, y):
    return x / KM_PER_DEG_LON + LON0, y / KM_PER_DEG_LAT + LAT0

def inside(xy, rings_xy):
    """Even-odd test of many points (N,2) against rings in projected km."""
    res = np.zeros(len(xy), dtype=bool)
    px, py = xy[:, 0], xy[:, 1]
    for r in rings_xy:
        lo, hi = r.min(axis=0), r.max(axis=0)
        cand = (px >= lo[0]) & (px <= hi[0]) & (py >= lo[1]) & (py <= hi[1])
        if not cand.any():
            continue
        cx, cy = px[cand], py[cand]; flip = np.zeros(len(cx), dtype=bool)
        a, b = r, np.roll(r, -1, axis=0)
        for (xi, yi), (xj, yj) in zip(a, b):
            if yi == yj:
                continue
            c = ((yi > cy) != (yj > cy)) & (cx < (xj - xi) * (cy - yi) / (yj - yi) + xi)
            flip ^= c
        res[np.where(cand)[0]] ^= flip
    return res

def nearest_on_segments(pts, segs_a, segs_b):
    """For each point, the closest point on any segment a->b. pts (N,2); segs (M,2)."""
    out = np.empty_like(pts); d = segs_b - segs_a; L2 = np.maximum((d ** 2).sum(1), 1e-12)
    for i, p in enumerate(pts):
        t = np.clip(((p - segs_a) * d).sum(1) / L2, 0, 1)
        q = segs_a + d * t[:, None]
        out[i] = q[np.argmin(((q - p) ** 2).sum(1))]
    return out

def min_dist(pts, ref, chunk=2048):
    out = np.empty(len(pts))
    for s in range(0, len(pts), chunk):
        p = pts[s:s + chunk]
        out[s:s + chunk] = np.sqrt(((p[:, None, :] - ref[None, :, :]) ** 2).sum(2)).min(1)
    return out

def simplify(ring, step):
    keep = [ring[0]]
    for p in ring[1:]:
        if np.hypot(*(p - keep[-1])) >= step:
            keep.append(p)
    return np.array(keep)

def clip_ring(ring, bx):
    """Sutherland-Hodgman against the projected bbox rectangle."""
    x0, y0, x1, y1 = bx
    def clip(pts, inside_fn, inter):
        out = []
        for i in range(len(pts)):
            a, b = pts[i - 1], pts[i]
            ia, ib = inside_fn(a), inside_fn(b)
            if ib:
                if not ia: out.append(inter(a, b))
                out.append(b)
            elif ia:
                out.append(inter(a, b))
        return out
    def ix(a, b, x): t = (x - a[0]) / (b[0] - a[0]); return (x, a[1] + t * (b[1] - a[1]))
    def iy(a, b, y): t = (y - a[1]) / (b[1] - a[1]); return (a[0] + t * (b[0] - a[0]), y)
    pts = [tuple(p) for p in ring]
    for f, g in ((lambda p: p[0] >= x0, lambda a, b: ix(a, b, x0)), (lambda p: p[0] <= x1, lambda a, b: ix(a, b, x1)),
                 (lambda p: p[1] >= y0, lambda a, b: iy(a, b, y0)), (lambda p: p[1] <= y1, lambda a, b: iy(a, b, y1))):
        if not pts: break
        pts = clip(pts, f, g)
    return np.array(pts)

def mesh_obj(name, verts, faces, col, material, colors=None):
    me = bpy.data.meshes.new(name)
    me.from_pydata([tuple(map(float, v)) for v in verts], [], [tuple(map(int, f)) for f in faces])
    me.validate(); me.update()
    if colors is not None:
        ca = me.color_attributes.new('Col', 'FLOAT_COLOR', 'POINT')
        ca.data.foreach_set('color', np.hstack([colors, np.ones((len(colors), 1))]).astype(np.float32).ravel())
    me.materials.append(material); me.shade_smooth()
    ob = bpy.data.objects.new(name, me); col.objects.link(ob)
    return ob

def color_material(name, rough=0.9):
    if name in _M:
        return _M[name]
    m = bpy.data.materials.new(name); nt, b = _principled(m)
    vc = nt.nodes.new('ShaderNodeVertexColor'); vc.layer_name = 'Col'
    nt.links.new(vc.outputs['Color'], b.inputs['Base Color']); b.inputs['Roughness'].default_value = rough
    if 'sea' not in name:
        add_bump(m, 'terrain')
    _M[name] = m
    return m

def C(h):
    return np.array(lin(h)[:3])

# ----------------------------------------------------------------------------- Oman terrain + plinth
def _blur(Z, passes=2):
    """Separable binomial blur (1 4 6 4 1): softens the DEM's sharp facets into rounded, toy-like relief."""
    k = np.array([1, 4, 6, 4, 1], dtype=np.float64) / 16.0
    for _ in range(passes):
        Zp = np.pad(Z, ((0, 0), (2, 2)), mode='edge'); Z = sum(k[i] * Zp[:, i:i + Z.shape[1]] for i in range(5))
        Zp = np.pad(Z, ((2, 2), (0, 0)), mode='edge'); Z = sum(k[i] * Zp[i:i + Z.shape[0], :] for i in range(5))
    return Z

def route_dense(step=ROAD_STEP):
    """The journey's road through the ROUTE points (Catmull-Rom), resampled every `step` km.
    Returns (xy[N,2], {slug: index})."""
    pts = [np.array(project(lon, lat)) for lon, lat in ROUTE]
    out, stop_at = [], {}
    for i in range(len(pts) - 1):
        for slug, idx in ROUTE_STOPS:
            if idx == i:
                stop_at[slug] = len(out)
        p0, p1, p2, p3 = pts[max(i - 1, 0)], pts[i], pts[i + 1], pts[min(i + 2, len(pts) - 1)]
        n = max(2, int(np.ceil(np.hypot(*(p2 - p1)) / step * 1.15)))
        for k in range(n):
            t = k / n
            out.append(0.5 * ((2 * p1) + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t ** 3))
    out.append(pts[-1])
    stop_at.update({slug: len(out) - 1 for slug, idx in ROUTE_STOPS if idx == len(pts) - 1})
    return np.array(out), stop_at

def terrain_height(x, y):
    """Bilinear height of the final (soft, road-carved) terrain at km coordinates; works on scalars or arrays."""
    xs, ys, Zg = TERRAIN
    fx = np.clip((np.asarray(x, dtype=np.float64) - xs[0]) / GRID, 0, len(xs) - 1.001)
    fy = np.clip((np.asarray(y, dtype=np.float64) - ys[0]) / GRID, 0, len(ys) - 1.001)
    i, j = np.floor(fx).astype(int), np.floor(fy).astype(int); u, v = fx - i, fy - j
    z = (Zg[j, i] * (1 - u) * (1 - v) + Zg[j, i + 1] * u * (1 - v) + Zg[j + 1, i] * (1 - u) * v + Zg[j + 1, i + 1] * u * v)
    return float(z) if np.ndim(z) == 0 else z

def _road_profile(Zg, xs, ys, road):
    """The road's height along its length: the valley floor (rolling minimum), smoothed, then cut so it never
    climbs steeper than ROAD_GRADE (passes are carved, never filled)."""
    global TERRAIN
    TERRAIN = (xs, ys, Zg)
    h = terrain_height(road[:, 0], road[:, 1])
    w = 7
    hp = np.pad(h, w, mode='edge'); h = np.array([hp[i:i + 2 * w + 1].min() for i in range(len(h))])
    g = np.exp(-0.5 * (np.arange(-18, 19) / 6.0) ** 2); g /= g.sum()
    h = np.convolve(np.pad(h, 18, mode='edge'), g, mode='valid')
    ds = np.r_[0, np.hypot(*np.diff(road, axis=0).T)]
    for i in range(1, len(h)):
        h[i] = min(h[i], h[i - 1] + ROAD_GRADE * ds[i])
    for i in range(len(h) - 2, -1, -1):
        h[i] = min(h[i], h[i + 1] + ROAD_GRADE * ds[i + 1])
    return h

def _carve_road(Zg, xs, ys, road, prof):
    """Flatten the land to the road within ROAD_FLAT km, blending back to the hills by ROAD_FADE km."""
    best = np.full(Zg.shape, np.inf); bz = np.zeros(Zg.shape)
    r = int(np.ceil(ROAD_FADE / GRID)) + 1
    for (x, y), z in zip(road, prof):
        ci, cj = int(round((x - xs[0]) / GRID)), int(round((y - ys[0]) / GRID))
        i0, i1, j0, j1 = max(ci - r, 0), min(ci + r + 1, len(xs)), max(cj - r, 0), min(cj + r + 1, len(ys))
        if i0 >= i1 or j0 >= j1:
            continue
        gx, gy = np.meshgrid(xs[i0:i1], ys[j0:j1])
        d = np.hypot(gx - x, gy - y)
        sub = best[j0:j1, i0:i1]; m = d < sub
        sub[m] = d[m]; bz[j0:j1, i0:i1][m] = z
    t = np.clip((best - ROAD_FLAT) / (ROAD_FADE - ROAD_FLAT), 0, 1); w = 1 - t * t * (3 - 2 * t)
    return Zg * (1 - w) + bz * w

def build_terrain(col, oman_xy, coast_a, coast_b, dem):
    allp = np.vstack(oman_xy)
    lo, hi = allp.min(0) - GRID, allp.max(0) + GRID
    xs = np.arange(lo[0], hi[0] + GRID, GRID); ys = np.arange(lo[1], hi[1] + GRID, GRID)
    gx, gy = np.meshgrid(xs, ys)                       # rows = y
    pts = np.stack([gx.ravel(), gy.ravel()], 1)
    ins = inside(pts, oman_xy).reshape(gx.shape)
    ny, nx = gx.shape
    # a cell is kept when any corner is inside; its outside corners are snapped onto Oman's outline
    cell = ins[:-1, :-1] | ins[1:, :-1] | ins[:-1, 1:] | ins[1:, 1:]
    used = np.zeros_like(ins)
    used[:-1, :-1] |= cell; used[1:, :-1] |= cell; used[:-1, 1:] |= cell; used[1:, 1:] |= cell
    idx = -np.ones(gx.shape, dtype=np.int64); idx[used] = np.arange(used.sum())
    V = pts[used.ravel()].copy()
    out_mask = ~ins.ravel()[used.ravel()]
    allseg_a = np.vstack([r for r in oman_xy]); allseg_b = np.vstack([np.roll(r, -1, axis=0) for r in oman_xy])
    V[out_mask] = nearest_on_segments(V[out_mask], allseg_a, allseg_b)
    lon, lat = unproject(V[:, 0], V[:, 1])
    hm = np.maximum(dem.sample(lon, lat), 0.0)
    hm[out_mask] = np.minimum(hm[out_mask], 40.0)       # the cut edge sits near sea level on coasts
    # v3 polish: one soft heightfield on the whole grid (blurred DEM), the road carved into it; every prop reads it
    glon, glat = unproject(gx.ravel(), gy.ravel())
    raw = np.maximum(dem.sample(glon, glat), 0.0).reshape(gx.shape) * HSCALE
    Zg = _blur(raw, passes=3)
    Zg *= raw.max() / max(Zg.max(), 1e-6)                 # keep the peaks' height: softer folds, same drama
    road, _ = route_dense()
    Zg = _carve_road(Zg, xs, ys, road, _road_profile(Zg, xs, ys, road))
    global TERRAIN
    TERRAIN = (xs, ys, Zg)
    Z = terrain_height(V[:, 0], V[:, 1])
    Z[out_mask] = np.minimum(Z[out_mask], 40.0 * HSCALE)
    faces = []
    for j, i in zip(*np.where(cell)):
        a, b, c, d = idx[j, i], idx[j, i + 1], idx[j + 1, i + 1], idx[j + 1, i]
        faces.append((a, b, c, d))
    # colours: sand, rock by height + slope, green Dhofar, green Batinah strip
    grid_h = np.zeros(gx.shape); grid_h[used] = hm
    gyd, gxd = np.gradient(grid_h, GRID * 1000.0)
    slope = np.hypot(gxd, gyd)[used]
    sand, rock_lo, rock_hi = C('#e8c48c'), C('#9a7354'), C('#c4a07a')
    rock = rock_lo + (rock_hi - rock_lo) * np.clip(hm / 3000.0, 0, 1)[:, None]
    w_rock = np.clip((hm - 120.0) / 700.0, 0, 1) * 0.75 + np.clip(slope * 4.0, 0, 0.35)
    col_v = sand + (rock - sand) * np.clip(w_rock, 0, 1)[:, None]
    dhofar = (lon < 55.6) & (lat < 17.4) & (hm > 50) & (hm < 1500)
    w_g = np.clip((17.4 - lat) / 0.25, 0, 1) * np.clip((55.6 - lon) / 0.4, 0, 1)
    col_v[dhofar] = col_v[dhofar] + (C('#5f8a3a') - col_v[dhofar]) * (0.85 * w_g[dhofar])[:, None]
    bat = (lon > 56.7) & (lon < 58.6) & (lat > 23.5) & (lat < 24.4)
    if bat.any():
        dcoast = min_dist(V[bat], coast_a)
        w_b = np.clip(1 - dcoast / 12.0, 0, 1) * 0.7
        col_v[bat] = col_v[bat] + (C('#8fae5a') - col_v[bat]) * w_b[:, None]
    col_v *= (0.93 + 0.14 * np.array([noise.noise(Vector((x * 0.05, y * 0.05, 0))) for x, y in V]))[:, None]
    verts = np.hstack([V, Z[:, None]])
    ob = mesh_obj('oman_terrain', verts, faces, col, color_material('oman_land'), colors=np.clip(col_v, 0, 1))
    return ob

def build_plinth(col, terrain):
    """Carved cliffs: every boundary edge of the terrain is extruded down to BOTTOM_Z in noisy rows."""
    me = terrain.data
    bm = bmesh.new(); bm.from_mesh(me); bm.verts.ensure_lookup_table()
    bedges = [e for e in bm.edges if e.is_boundary]
    outward = {}
    for e in bedges:
        f = e.link_faces[0]; c = f.calc_center_median()
        a, b = e.verts[0].co, e.verts[1].co
        t = (b - a).to_2d(); n = Vector((t.y, -t.x)).normalized()
        if n.dot((a + b).to_2d() / 2 - c.to_2d()) < 0:
            n = -n
        for v in e.verts:
            outward[v.index] = outward.get(v.index, Vector((0, 0))) + n
    rows = 8
    out_v, out_f, colors, ring = [], [], [], {}
    soil, rockc, band = C('#b98f5f'), C('#8c6a48'), C('#c9a77c')
    for vi, n in outward.items():
        co = bm.verts[vi].co; n = n.normalized() if n.length > 1e-9 else Vector((0, 0))
        ids = []
        for j in range(rows + 1):
            z = co.z + (BOTTOM_Z - co.z) * j / rows
            depth = (co.z - z)
            amp = min(1.0, depth / 3.0)
            off = (0.6 + 1.6 * noise.fractal(Vector((co.x * 0.08, co.y * 0.08, z * 0.15)), 0.6, 2.1, 4)) * amp
            p = Vector((co.x + n.x * off, co.y + n.y * off, z))
            ids.append(len(out_v)); out_v.append(p)
            h = (z - BOTTOM_Z) / (max(co.z, 0.0) - BOTTOM_Z + 1e-6)
            c = rockc + (soil - rockc) * np.clip((h - 0.5) / 0.4, 0, 1)
            if (0.5 + 0.5 * math.sin(z * 0.9 + noise.noise(Vector((co.x * 0.02, co.y * 0.02, 0))) * 3)) > 0.92:
                c = c + (band - c) * 0.55
            colors.append(np.clip(c * (0.9 + 0.2 * noise.noise(p * 0.11)), 0, 1))
        ring[vi] = ids
    for e in bedges:
        a, b = ring[e.verts[0].index], ring[e.verts[1].index]
        for j in range(rows):
            out_f.append((a[j], b[j], b[j + 1], a[j + 1]))
    bm.free()
    ob = mesh_obj('oman_plinth', out_v, out_f, col, _strata_material(), colors=np.array(colors))
    # face the cliffs outward
    bm = bmesh.new(); bm.from_mesh(ob.data); bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:]); bm.to_mesh(ob.data); bm.free()
    return ob

# ----------------------------------------------------------------------------- neighbours, borders, sea
def build_neighbours(col, countries, bbox_xy):
    tops, walls = [], []
    bm = bmesh.new()
    pieces = {}
    for name, rings in countries.items():
        if name == 'Oman':
            continue
        for r in rings:
            rr = clip_ring(np.array([project(*p) for p in r]), bbox_xy)
            if len(rr) < 3:
                continue
            rr = simplify(rr, 1.5)
            if len(rr) < 3:
                continue
            pieces.setdefault(name, []).append(rr)
            top = [bm.verts.new((x, y, NEIGHBOUR_Z)) for x, y in rr]
            bot = [bm.verts.new((x, y, BOTTOM_Z)) for x, y in rr]
            try:
                bm.faces.new(top)
            except ValueError:
                pass
            for i in range(len(rr)):
                j = (i + 1) % len(rr)
                bm.faces.new((top[i], top[j], bot[j], bot[i]))
    bmesh.ops.triangulate(bm, faces=[f for f in bm.faces if len(f.verts) > 4])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces[:])
    me = bpy.data.meshes.new('neighbours'); bm.to_mesh(me); bm.free()
    me.materials.append(mat('neighbour', 0.95, hexc='#e6dfd3', bump='terrain'))
    ob = bpy.data.objects.new('neighbours', me); col.objects.link(ob)
    return ob, pieces

def build_borders(col, pieces, oman_xy):
    """Thin ribbons on the neighbour slabs wherever their outline runs along another country (land borders)."""
    others = {n: np.vstack(rs) for n, rs in pieces.items()}
    others['Oman'] = np.vstack([simplify(r, 1.5) for r in oman_xy])
    bm = bmesh.new(); z = NEIGHBOUR_Z + 0.03; w = 0.3
    for name, rings in pieces.items():
        ref = np.vstack([v for k, v in others.items() if k != name])
        for rr in rings:
            near = min_dist(rr, ref) < 3.0
            for i in range(len(rr) - 1):
                if near[i] and near[i + 1]:
                    a, b = Vector((*rr[i], z)), Vector((*rr[i + 1], z))
                    d = (b - a);
                    if d.length < 1e-6:
                        continue
                    s = Vector((-d.y, d.x, 0)).normalized() * w
                    bm.faces.new([bm.verts.new(a - s), bm.verts.new(b - s), bm.verts.new(b + s), bm.verts.new(a + s)])
    me = bpy.data.meshes.new('borders'); bm.to_mesh(me); bm.free()
    me.materials.append(mat('border', 0.9, hexc='#8a7a63'))
    ob = bpy.data.objects.new('borders', me); col.objects.link(ob)
    return ob

def build_sea(col, bbox_xy, coast_pts):
    x0, y0, x1, y1 = bbox_xy; step = 12.0
    xs = np.arange(x0, x1 + 1e-6, step); ys = np.arange(y0, y1 + 1e-6, step)
    gx, gy = np.meshgrid(xs, ys); V = np.stack([gx.ravel(), gy.ravel()], 1)
    d = min_dist(V, coast_pts)
    t = np.clip((d - 15.0) / 105.0, 0, 1)[:, None]
    colors = C('#2f8fa0') + (C('#0e3a52') - C('#2f8fa0')) * t
    ny, nx = gx.shape
    verts = [(x, y, SEA_Z) for x, y in V]
    faces = [(j * nx + i, j * nx + i + 1, (j + 1) * nx + i + 1, (j + 1) * nx + i) for j in range(ny - 1) for i in range(nx - 1)]
    # the four sides of the block, deep blue, down to the table
    base = len(verts)
    corners = [(x0, y0), (x1, y0), (x1, y1), (x0, y1)]
    for x, y in corners:
        verts.append((x, y, SEA_Z)); verts.append((x, y, BOTTOM_Z))
    for k in range(4):
        a, b = base + 2 * k, base + 2 * ((k + 1) % 4)
        faces.append((a, a + 1, b + 1, b))
    colors = np.vstack([colors, np.tile(C('#0e3a52'), (8, 1))])
    ob = mesh_obj('sea', verts, faces, col, color_material('map_sea', rough=0.12), colors=colors)
    return ob

def build_foam(col, coast_a, coast_b, oman_xy):
    mb = MB(); foam = mat('foam', 0.6, hexc='#f4f7f5'); z = SEA_Z + 0.05
    r = random.Random(9)
    for a, b in zip(coast_a, coast_b):
        d = b - a; L = np.hypot(*d)
        if L < 0.5:
            continue
        n = np.array([d[1], -d[0]]) / L
        mid = (a + b) / 2
        if inside(np.array([mid + n * 1.0]), oman_xy)[0]:
            n = -n
        o1, o2 = 1.8 + r.uniform(0, 0.6), 2.8 + r.uniform(0, 1.6)
        p = [a + n * o1, b + n * o1, b + n * o2, a + n * o2]
        mb.poly(foam, [(q[0], q[1], z) for q in p])
    return mb.finish('sea_foam', col, bevel=0.0, recalc=False)

# ----------------------------------------------------------------------------- landmarks, pin, anchors, labels
def ground_z(dem, lon, lat):
    """Height of the land at lon/lat: the built terrain once it exists (props stand on what is drawn)."""
    if TERRAIN is not None:
        return float(terrain_height(*project(lon, lat)))
    return float(max(dem.sample(lon, lat), 0.0)) * HSCALE

def off_road(lon, lat, km, side=1):
    """lon/lat moved `km` to one side of the road at its nearest point (landmarks stand beside it, not on it)."""
    road, _ = route_dense()
    p = np.array(project(lon, lat)); i = int(np.argmin(np.hypot(*(road - p).T)))
    d = road[min(i + 1, len(road) - 1)] - road[max(i - 1, 0)]; d /= np.linalg.norm(d)
    q = road[i] + side * km * np.array([-d[1], d[0]])
    return unproject(q[0], q[1])

def road_distance(xy):
    road, _ = route_dense(2.0)
    return min_dist(np.atleast_2d(xy), road)

def ship(col, name):
    mb = MB()
    mb.prism(mat('navy', 0.5), [(-4.5, 0.0), (4.0, 0.0), (5.2, 1.2), (-4.6, 1.2)], -0.9, 0.9)
    cols = ['lime', 'terracotta', 'teal', 'trim', 'navy']
    for i in range(6):
        for j in range(2):
            mb.boxz(mat(cols[(i + j) % len(cols)], 0.6), -3.2 + i * 1.1, -2.2 + i * 1.1, -0.8 + j * 0.8, 0.0 + j * 0.8, 1.2, 1.9 + 0.3 * ((i + j) % 2))
    mb.boxz(mat('trim', 0.5), -4.4, -3.4, -0.8, 0.8, 1.2, 3.0)
    return mb.finish(name, col, bevel=0.05)

def build_landmarks(col, dem, oman_xy):
    root = bpy.data.objects.new('landmarks', None); col.objects.link(root)
    def place(ob, lon, lat, scale, z=None, rz=0.0):
        x, y = project(lon, lat)
        ob.location = (x, y, ground_z(dem, lon, lat) if z is None else z)
        ob.scale = (scale, scale, scale); ob.rotation_euler = (0, 0, rz); ob.parent = root
        return ob
    # a generic round-towered fort near Nizwa: tower + square curtain wall (built in metres, scaled up)
    fort = fort_tower(col, 0.0, 0.0); fort.name = 'landmark_fort'
    flon, flat = off_road(57.53, 22.93, 26.0, side=-1)              # beside the road, on the far side from the chase camera
    place(fort, flon, flat, LM)
    LANDMARK_XY.append(np.array(project(flon, flat)))
    wall = MB(); S = mat('sand', 0.9)
    for (ax, ay, bx, by) in ((-5, -5, 5, -4.4), (-5, 4.4, 5, 5), (-5, -5, -4.4, 5), (4.4, -5, 5, 5)):
        wall.boxz(S, ax, bx, ay, by, 0, 2.6)
    for cx, cy in ((-4.7, -4.7), (4.7, -4.7), (-4.7, 4.7), (4.7, 4.7)):
        wall.cyl(S, (cx, cy, 1.8), 0.9, 3.6, seg=16)
    place(wall.finish('landmark_fort_walls', col, bevel=0.05), flon, flat, LM)
    # dunes in the Sharqiya Sands: crescent-ish mounds
    dunes = MB(); dc = mat('dune', 0.9, hexc='#e9c48e')
    for k in range(11):
        lon = 58.6 + rng.uniform(-0.35, 0.35); lat = 22.1 + rng.uniform(-0.3, 0.3)
        x, y = project(lon, lat); z = ground_z(dem, lon, lat)
        L = rng.uniform(9, 16)
        dunes.sphere(dc, (x, y, z - 0.2), 1.0, scale=(L, L * 0.45, rng.uniform(2.0, 3.5)), seg=20, hemi=True)
    dunes.finish('landmark_dunes', col, bevel=0.0).parent = root
    # palms along the Batinah coast
    pm = MB()
    for k in range(6):
        lon = 57.1 + k * 0.17; lat = 23.82 + k * 0.06 + rng.uniform(-0.03, 0.03)
        if not inside(np.array([project(lon, lat)]), oman_xy)[0] or road_distance(project(lon, lat)) < 5.0:
            continue
        pm_local = MB(); palm(pm_local, 0.0, 0.0, h=5.5, seed=k)
        ob = pm_local.finish(f'landmark_palm_{k}', col, bevel=0.0)
        place(ob, lon, lat, 1.3 * LM / 0.9)
    # dhows and ships on the sea (bows roughly along the coast)
    for k, (lon, lat, rz) in enumerate(((58.9, 23.9, 0.5), (56.6, 26.6, 2.0), (54.6, 16.6, 3.0))):
        place(dhow(col, f'landmark_dhow_{k + 1}'), lon, lat, 5.0, z=SEA_Z, rz=rz)
    for k, (lon, lat, rz) in enumerate(((59.6, 22.6, 1.9), (57.6, 25.2, 0.3))):
        place(ship(col, f'landmark_ship_{k + 1}'), lon, lat, 4.5, z=SEA_Z, rz=rz)
    return root

def build_pin(col, dem):
    lon, lat = 58.383, 23.588
    x, y = project(lon, lat); z = ground_z(dem, lon, lat)
    a = bpy.data.objects.new('muscat_anchor', None); col.objects.link(a)
    a.location = (x, y, z); a['street_scale'] = CFG['map']['streetScale']
    return a

# the journey's route on the map: Musandam's neck, down the Batinah coast, to Muscat (drawn on by the web)
# Salalah up the coast to Duqm and Sur, inland to Nizwa, north to Sohar, and home to Muscat: the journey ends at the
# workshop, where the camera dives into the street diorama.
# inland of the bays north of Duqm and of the Batinah shore, so the van never drives over the sea
ROUTE = [(54.09, 17.02), (54.40, 17.60), (55.30, 18.30), (56.60, 19.10), (57.70, 19.66),
         (57.65, 20.30), (58.00, 21.00), (58.60, 21.50), (59.10, 21.95), (59.40, 22.35), (59.45, 22.52),
         (59.10, 22.62), (58.53, 22.69), (58.10, 22.70), (57.53, 22.93),
         (57.20, 23.45), (56.75, 24.30),
         (57.00, 23.98), (57.45, 23.72), (57.90, 23.56), (58.20, 23.54), (58.383, 23.588)]
ROUTE_STOPS = [('salalah', 0), ('duqm', 4), ('sur', 10), ('nizwa', 14), ('sohar', 16), ('muscat', 21)]   # index into ROUTE

def build_route(col, dem, width=3.0):
    """A lime ribbon a few km wide (toy scale) just above the terrain; uv u runs 0..1 along it for the reveal."""
    road, stop_at = route_dense()
    dense = [Vector((x, y, 0)) for x, y in road]
    lens = [0.0]
    for a, b in zip(dense, dense[1:]):
        lens.append(lens[-1] + (b - a).length)
    bm = bmesh.new(); uvl = bm.loops.layers.uv.new('UVMap'); rows = []
    for i, p in enumerate(dense):
        d = (dense[min(i + 1, len(dense) - 1)] - dense[max(i - 1, 0)]).normalized()
        side = Vector((-d.y, d.x, 0)) * width / 2
        z = terrain_height(p.x, p.y) + 0.12                       # a painted ribbon just over the carved road
        rows.append((bm.verts.new((p.x - side.x, p.y - side.y, z)), bm.verts.new((p.x + side.x, p.y + side.y, z)), lens[i] / lens[-1]))
    for (a0, a1, u0), (b0, b1, u1) in zip(rows, rows[1:]):
        f = bm.faces.new((a0, b0, b1, a1))
        for lp, uv in zip(f.loops, ((u0, 0), (u1, 0), (u1, 1), (u0, 1))):
            lp[uvl].uv = uv
    # the van's path for the web: Blender coords, slightly above the ribbon, plus where each city sits along it
    keep = list(range(0, len(rows), 2)) + ([len(rows) - 1] if (len(rows) - 1) % 2 else [])
    path = [[round(dense[i].x, 2), round(dense[i].y, 2), round(rows[i][0].co.z + 0.05, 3)] for i in keep]
    stops = [{'slug': slug, 't': round(lens[stop_at[slug]] / lens[-1], 4)} for slug, _ in ROUTE_STOPS]
    txt = open(CFG_PATH, encoding='utf-8').read()
    block = '"route": ' + json.dumps({'points': path, 'stops': stops}, separators=(',', ':'))
    txt = re.sub(r'"route": \{.*?\]\}', block, txt, count=1, flags=re.S) if '"route":' in txt else txt.replace('"pins": [', block + ',\n  "pins": [', 1)
    open(CFG_PATH, 'w', encoding='utf-8').write(txt)
    me = bpy.data.meshes.new('route_line'); bm.to_mesh(me); bm.free()
    me.materials.append(mat('route', 0.5, hexc='#bbd440', bump='terrain'))
    ob = bpy.data.objects.new('route_line', me); col.objects.link(ob)
    return ob

def build_pins(col, dem):
    """Anchors for the project pins (the web draws the pins as HTML buttons on these points)."""
    for p in CFG['pins']:
        x, y = project(p['lon'], p['lat'])
        anchor(col, f"pin_{p['slug']}", (x, y, ground_z(dem, p['lon'], p['lat']) + 3.0), size=4.0)

def _token_outline(r=4.0, tip=7.0, n=24):
    """A map-pin outline in the XZ plane: a round head on a point, standing on its tip at the origin."""
    cz = tip
    pts = []
    side = math.asin(min(0.999, r / tip))
    start, end = -math.pi / 2 + side + 0.15, 3 * math.pi / 2 - side - 0.15
    for i in range(n + 1):
        a = start + (end - start) * i / n
        pts.append((r * math.cos(a), cz + r * math.sin(a)))
    pts.append((0.0, 0.0))
    return pts

def _star(cx, cz, r1=1.9, r2=0.8, k=5):
    return [(cx + (r1 if i % 2 == 0 else r2) * math.cos(math.pi / 2 + i * math.pi / k),
             cz + (r1 if i % 2 == 0 else r2) * math.sin(math.pi / 2 + i * math.pi / k)) for i in range(2 * k)]

def build_pins3d(col, dem):
    """Chunky 3D pin tokens at every city on the route: a lime token with a navy star, 1.6 km thick, standing on the
    map (the web turns them to face the camera and pops them in as the van arrives)."""
    lime, navy = mat('lime', 0.45, name='pin_lime', hexc='#bbd440'), mat('navy', 0.4, name='pin_navy', hexc='#131d27')
    out = []
    for p in CFG['pins']:
        mb = MB()
        outline = _token_outline()
        mb.prism(lime, outline, -0.8, 0.8)
        mb.prism(navy, _star(0.0, 7.0), -0.95, -0.75)               # front icon
        mb.prism(navy, _star(0.0, 7.0), 0.75, 0.95)                 # back icon
        ob = mb.finish(f"pin3d_{p['slug']}", col, bevel=0.35, segments=2, recalc=True)
        # the van parks beside its token: on land, clear of the road and the fort, and on the far side of the road from
        # the chase camera (south-west of the van, scene.js followMap) so the token never hides the van
        road, _ = route_dense(); c0 = np.array(project(p['lon'], p['lat']))
        r0 = road[int(np.argmin(np.hypot(*(road - c0).T)))]
        away = [r0 + km * np.array([math.cos(a), math.sin(a)]) for km in (7.0, 9.0, 11.0) for a in np.radians([52, 30, 75, 10, 95, 115, -10, 135, -30])]
        sides = [np.array(project(*off_road(p['lon'], p['lat'], km, side))) for side in (-1, 1) for km in (7.0, 9.0)]
        ok = lambda c: (inside(c[None, :], OMAN_XY)[0] and float(road_distance(c)[0]) > 4.5
                        and all(np.hypot(*(c - l)) > 12.0 for l in LANDMARK_XY))
        x, y = next((c for c in away + sides if ok(c)), sides[0])
        ob.location = (x, y, terrain_height(x, y))
        ob.scale = (1.4, 1.4, 1.4)
        ob['pin'] = p['slug']
        out.append(ob)
    return out

def _acacia(mb, x, y, z, s, r):
    mb.cyl_between(mat('trunk', 0.9), (x, y, z), (x + r.uniform(-0.3, 0.3) * s, y, z + 2.2 * s), 0.18 * s, 0.12 * s, seg=6)
    for k in range(3):                                              # a flat umbrella canopy
        mb.sphere(mat('frond_dark', 0.85, name='acacia_leaf', hexc='#5b6e2e'),
                  (x + r.uniform(-0.6, 0.6) * s, y + r.uniform(-0.6, 0.6) * s, z + (2.3 + 0.15 * k) * s),
                  1.0 * s, scale=(1.5, 1.3, 0.38), seg=12)

def _ghaf(mb, x, y, z, s, r):
    mb.cyl_between(mat('trunk', 0.9), (x, y, z), (x, y, z + 1.4 * s), 0.2 * s, 0.14 * s, seg=6)
    mb.sphere(mat('frond', 0.85, name='ghaf_leaf', hexc='#6f8f3a'), (x, y, z + 2.0 * s), 1.2 * s, scale=(1.15, 1.15, 0.85), seg=12)
    mb.sphere(mat('frond', 0.85, name='ghaf_leaf', hexc='#6f8f3a'), (x + 0.5 * s, y - 0.3 * s, z + 1.6 * s), 0.8 * s, scale=(1, 1, 0.8), seg=10)

def _land_points(oman_xy, n, seed):
    """n random points inside Oman (km), drawn in one batch and tested with one vectorised even-odd pass."""
    g = np.random.default_rng(seed)
    lo, hi = np.vstack(oman_xy).min(0), np.vstack(oman_xy).max(0)
    pts = g.uniform(lo, hi, size=(n * 4, 2))
    return pts[inside(pts, oman_xy)][:n]

def build_trees(col, dem, oman_xy):
    """Acacia on the mountain flanks and wadis, ghaf in the sands and plains, denser in Dhofar and along the Batinah.
    Toy scale (a tree is a few km tall) so they read like the reference's miniature trees."""
    r = random.Random(71); mb = MB(); placed = 0
    cand = _land_points(oman_xy, 6000, seed=71)                     # one vectorised inside-test, not one per point
    cand = cand[road_distance(cand) > 8.5]                           # trees (canopies ~4 km across) stand clear of the road
    for x, y in cand:
        if placed >= 175:
            break
        lon, lat = unproject(x, y)
        h = float(max(dem.sample(lon, lat), 0.0))
        dhofar = lon < 55.6 and lat < 17.6 and 50 < h < 1500
        batinah = 56.4 < lon < 58.6 and 23.4 < lat < 24.6 and h < 300
        foothills = 300 < h < 1400
        p = 0.9 if dhofar else 0.6 if batinah else 0.35 if foothills else 0.05
        if r.random() > p:
            continue
        s = r.uniform(1.6, 2.6)
        (_acacia if (foothills or dhofar) and r.random() < 0.7 else _ghaf)(mb, x, y, terrain_height(x, y) - 0.2, s, r)
        placed += 1
    ob = mb.finish('trees', col, bevel=0.0)
    ob['count'] = placed
    return ob

def build_rocks(col, dem, oman_xy, n=160):
    r = random.Random(13); mb = MB()
    rock = mat('rock', 0.9, name='map_rock', hexc='#a07a58', bump='terrain')
    pts = _land_points(oman_xy, n * 2, seed=13)
    for x, y in pts[road_distance(pts) > 4.5][:n]:
        z = terrain_height(x, y)
        s = r.uniform(0.6, 1.4)
        mb.sphere(rock, (x, y, z + 0.15 * s), 0.9 * s, scale=(1.0, r.uniform(0.7, 1.0), r.uniform(0.45, 0.7)), seg=8)
    return mb.finish('rocks', col, bevel=0.0)

LABELS = {'muscat': (58.383, 23.588), 'nizwa': (57.53, 22.93), 'jebel_shams': (57.26, 23.24),
          'sharqiya': (58.6, 22.1), 'salalah': (54.09, 17.02), 'musandam': (56.25, 26.18)}

def build_labels(col, dem):
    out = []
    for k, (lon, lat) in LABELS.items():
        e = bpy.data.objects.new(f'label_{k}', None); col.objects.link(e)
        x, y = project(lon, lat); e.location = (x, y, ground_z(dem, lon, lat) + 3.0)
        e.empty_display_size = 4.0; out.append(e)
    return out

# ----------------------------------------------------------------------------- camera
def build_camera(col, oman_xy):
    from bpy_extras.object_utils import world_to_camera_view
    sc = bpy.context.scene
    pts = np.vstack([r[::8] for r in oman_xy])
    lo, hi = pts.min(0), pts.max(0); tgt = Vector(((lo[0] + hi[0]) / 2, (lo[1] + hi[1]) / 2, 0.0))
    x0, y0 = project(BBOX[0], BBOX[1]); x1, y1 = project(BBOX[2], BBOX[3])
    frame = [Vector((x, y, z)) for x in (x0, x1) for y in (y0, y1) for z in (SEA_Z, BOTTOM_Z)]
    cd = bpy.data.cameras.new('CAM_map'); cd.lens = 35; cd.clip_start = 1.0; cd.clip_end = 20000
    cam = bpy.data.objects.new('CAM_map', cd); col.objects.link(cam)
    el, az = math.radians(42), math.radians(20)
    dirv = Vector((-math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))
    def fits(D):
        cam.location = tgt + dirv * D; look_at(cam, tgt); bpy.context.view_layer.update()
        for p in frame:
            v = world_to_camera_view(sc, cam, p)
            if not (0.04 <= v.x <= 0.96 and 0.04 <= v.y <= 0.96):
                return False
        return True
    lo_d, hi_d = 200.0, 8000.0
    for _ in range(30):
        mid = (lo_d + hi_d) / 2
        lo_d, hi_d = (lo_d, mid) if fits(mid) else (mid, hi_d)
    fits(hi_d)
    key = {'eye': [round(c, 3) for c in cam.location], 'target': [round(c, 3) for c in tgt], 'lens': cd.lens}
    txt = open(CFG_PATH, encoding='utf-8').read()
    txt = re.sub(r'"camera": (null|\{[^}]*\})', '"camera": ' + json.dumps(key), txt, count=1)
    open(CFG_PATH, 'w', encoding='utf-8').write(txt)
    sc.camera = cam
    return cam

# ----------------------------------------------------------------------------- main
def build():
    clear_scene(); LANDMARK_XY.clear()
    root_c = coll('00 Map'); c_land, c_sea, c_marks = coll('01 Land', root_c), coll('02 Sea', root_c), coll('03 Landmarks', root_c)
    c_rig = coll('90 Rig')
    countries = load_countries(); dem = DEM()
    oman_xy = [np.array([project(*p) for p in r]) for r in countries['Oman']]
    global OMAN_XY
    OMAN_XY = oman_xy
    # Oman coastline vs land border: a segment is coast when it is far from every neighbour
    neigh_pts = np.vstack([np.array([project(*p) for p in r]) for n, rs in countries.items() if n != 'Oman' for r in rs])
    neigh_pts = neigh_pts[(neigh_pts[:, 0] > -700) & (neigh_pts[:, 0] < 500) & (neigh_pts[:, 1] > -600) & (neigh_pts[:, 1] < 800)]
    seg_a = np.vstack(oman_xy); seg_b = np.vstack([np.roll(r, -1, axis=0) for r in oman_xy])
    coast = min_dist((seg_a + seg_b) / 2, neigh_pts) > 3.0
    coast_a, coast_b = seg_a[coast], seg_b[coast]
    x0, y0 = project(BBOX[0], BBOX[1]); x1, y1 = project(BBOX[2], BBOX[3]); bbox_xy = (x0, y0, x1, y1)

    terrain = build_terrain(c_land, oman_xy, coast_a, coast_b, dem)
    build_plinth(c_land, terrain)
    _, pieces = build_neighbours(c_land, countries, bbox_xy)
    build_borders(c_land, pieces, oman_xy)
    coast_all = np.vstack([seg_a[::2]] + [simplify(r, 3.0) for rs in pieces.values() for r in rs])
    build_sea(c_sea, bbox_xy, coast_all)
    build_foam(c_sea, coast_a, coast_b, oman_xy)
    build_landmarks(c_marks, dem, oman_xy)
    build_pin(c_marks, dem)
    build_labels(c_marks, dem)
    build_route(c_land, dem)
    build_pins(c_marks, dem)
    build_pins3d(c_marks, dem)
    build_trees(c_marks, dem, oman_xy)
    build_rocks(c_marks, dem, oman_xy)
    add_sun_and_sky(c_rig)
    render_setup()
    cam = build_camera(c_rig, oman_xy)
    root = bpy.data.objects.new('oman_root', None); root_c.objects.link(root)
    for o in list(bpy.context.scene.objects):
        if o is not root and o.parent is None:
            o.parent = root
    return cam

def main(argv):
    cam = build()
    out = {'tidy': tidy_scene(cam)}
    blend = os.path.join(HERE, 'oman-map.blend')
    bpy.ops.wm.save_as_mainfile(filepath=blend); out['blend'] = blend
    total, per = tri_count(); out['triangles'] = total; out['triangles_by_collection'] = per
    if '--render' in argv:
        d = os.path.abspath(argv[argv.index('--render') + 1]); os.makedirs(d, exist_ok=True)
        render_to(os.path.join(d, 'map_overview.png'), cam, 1); out['renders'] = d
    print('BUILD_MAP_RESULT', out)

if __name__ == '__main__':
    main(sys.argv[sys.argv.index('--') + 1:] if '--' in sys.argv else [])
