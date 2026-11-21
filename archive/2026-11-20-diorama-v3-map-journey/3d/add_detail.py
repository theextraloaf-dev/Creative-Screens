"""Adds fitting detail (glass reflections, lamps, grille, plate, exhausts, mirrors, door handles, character lines, creases,
badges, wheel rims, lug nuts and tread grooves) as extra line segments on the generic sedan, in the car's own mm coordinates.
Reads 3d/car.base.json (the Blender export) and writes public/models/car.json. Run: python3 3d/add_detail.py
Detail lines belong to the panel they sit on, so they explode and ghost with it."""
import json, math, os

HERE = os.path.dirname(os.path.abspath(__file__))
model = json.load(open(os.path.join(HERE, 'car.base.json')))
parts = model['parts']

def tris_of(name):
    d = parts[name]; p = d['p']; t = d['t']
    return [tuple((p[i * 3], p[i * 3 + 1], p[i * 3 + 2]) for i in t[k:k + 3]) for k in range(0, len(t), 3)]
CACHE = {}
def tris(name):
    if name not in CACHE: CACHE[name] = tris_of(name)
    return CACHE[name]

def hit(name, drop, a, b, pick):
    """Project along axis `drop` (0 x, 1 y, 2 z): (a, b) are the other two coordinates in axis order; return the max/min value on the surface."""
    ia, ib = [i for i in range(3) if i != drop]
    best = None
    for tri in tris(name):
        (ax, ay), (bx, by), (cx, cy) = [(v[ia], v[ib]) for v in tri]
        den = (by - cy) * (ax - cx) + (cx - bx) * (ay - cy)
        if abs(den) < 1e-9: continue
        l1 = ((by - cy) * (a - cx) + (cx - bx) * (b - cy)) / den
        l2 = ((cy - ay) * (a - cx) + (ax - cx) * (b - cy)) / den
        l3 = 1 - l1 - l2
        if l1 < -1e-6 or l2 < -1e-6 or l3 < -1e-6: continue
        val = l1 * tri[0][drop] + l2 * tri[1][drop] + l3 * tri[2][drop]
        if best is None or (val > best if pick == 'max' else val < best): best = val
    return best

class Out:
    def __init__(self, name): self.d = parts[name]
    def line(self, pts):
        p, l = self.d['p'], self.d['l']; o = len(p) // 3
        for q in pts: p.extend(int(round(c)) for c in q)
        for k in range(len(pts) - 1): l.extend([o + k, o + k + 1])
    def loop(self, pts): self.line(list(pts) + [pts[0]])

def ellipse(cx, cy, a, b, n=28): return [(cx + a * math.cos(2 * math.pi * k / n), cy + b * math.sin(2 * math.pi * k / n)) for k in range(n)]
def rrect(cx, cy, w, h, r=0.35):
    r = min(w, h) * r; pts = []
    for sx, sy, a0 in ((1, 1, 0), (-1, 1, 90), (-1, -1, 180), (1, -1, 270)):
        for k in range(5):
            t = math.radians(a0 + 90 * k / 4); pts.append((cx + sx * (w - r) + r * math.cos(t), cy + sy * (h - r) + r * math.sin(t)))
    return pts

def on_face(out, name, drop, pick, pts2, off, lift=4):
    """Draw a 2D polyline (a, b) draped on the surface of `name`; segments with no surface under them are skipped."""
    run = []
    def flush():
        nonlocal run
        if len(run) > 1: out.line(run)
        run = []
    for a, b in pts2:
        v = hit(name, drop, a, b, pick)
        if v is None: flush(); continue
        v += off * lift if False else 0
        q = [0, 0, 0]; ia, ib = [i for i in range(3) if i != drop]; q[ia], q[ib], q[drop] = a, b, v + off
        run.append(tuple(q))
    flush()

def on_closed(out, name, drop, pick, pts2, off):
    pts = list(pts2) + [pts2[0]]
    on_face(out, name, drop, pick, pts, off)

# ---- both sides ----
for sg, side in ((-1, 'near'), (1, 'far')):
    pick_y = 'min' if sg < 0 else 'max'
    off = 5 * sg
    # door handles + lock dots
    for door, x0, x1 in (('door_front', 520, 720), ('door_rear', -420, -240)):
        o = Out(f'{door}_{side}')
        on_closed(o, f'{door}_{side}', 1, pick_y, rrect((x0 + x1) / 2, 900, (x1 - x0) / 2, 15), off)
        on_face(o, f'{door}_{side}', 1, pick_y, [(x0 + 12, 900), (x1 - 12, 900)], off)
        on_closed(o, f'{door}_{side}', 1, pick_y, ellipse(x1 + 50, 900, 7, 7, 10), off)
    # door shut-line hardware: lower sill line and belt moulding double line
    o = Out(f'door_front_{side}')
    on_face(o, f'door_front_{side}', 1, pick_y, [(x, 930) for x in range(-30, 951, 30)], off)
    o = Out(f'door_rear_{side}')
    on_face(o, f'door_rear_{side}', 1, pick_y, [(x, 930) for x in range(-930, -49, 30)], off)
    # character line and rocker line along the body side
    o = Out('body_shell')
    on_face(o, 'body_shell', 1, pick_y, [(x, 650) for x in range(-2080, 2081, 40)], off)
    on_face(o, 'body_shell', 1, pick_y, [(x, 395) for x in range(-2080, 2081, 40)], off)
    # side mirror: a small box on a stalk, on the front door
    o = Out(f'door_front_{side}')
    ys = hit(f'door_front_{side}', 1, 330, 940, pick_y)
    if ys is not None:
        y0, y1 = ys, ys + sg * 105
        x0, x1, z0, z1 = 270, 390, 962, 1042
        c = [(x, y, z) for z in (z0, z1) for y in (y0, y1) for x in (x0, x1)]
        o.line([c[0], c[1], c[3], c[2], c[0]]); o.line([c[4], c[5], c[7], c[6], c[4]])
        for i in range(4): o.line([c[i], c[i + 4]])
    # glass reflections
    for k, (z0, xs) in enumerate(((1000, -880), (1000, -700), (1000, -520))):
        pass
    g = f'side_glass_{side}'; o = Out(g)
    for c0 in (-1100, -900, -700, -500):
        seg = [(x, 940 + 1.15 * (x - c0)) for x in range(c0, c0 + 260, 20)]
        run = [(x, z) for x, z in seg if hit(g, 1, x, z, pick_y) is not None and hit(g, 1, x + 25, z, pick_y) is not None and hit(g, 1, x - 25, z, pick_y) is not None and 975 < z < 1330]
        if len(run) > 1:
            on_face(o, g, 1, pick_y, run, off)
    # wheels
    for ax in ('front', 'rear'):
        o = Out(f'wheel_{ax}_{side}'); yf = sg * 115
        for r in (262, 238, 160): o.loop([(r * math.cos(a), yf, r * math.sin(a)) for a in [2 * math.pi * k / 40 for k in range(40)]])
        o.loop([(48 * math.cos(a), yf, 48 * math.sin(a)) for a in [2 * math.pi * k / 20 for k in range(20)]])
        for k in range(5):
            a = 2 * math.pi * k / 5 + math.pi / 2
            cx, cz = 90 * math.cos(a), 90 * math.sin(a)
            o.loop([(cx + 15 * math.cos(t), yf, cz + 15 * math.sin(t)) for t in [2 * math.pi * j / 8 for j in range(8)]])
        for yy in (-70, 70): o.loop([(345 * math.cos(a), yy, 345 * math.sin(a)) for a in [2 * math.pi * k / 72 for k in range(72)]])
        for k in range(48):
            a = 2 * math.pi * k / 48; d = math.radians(5)
            o.line([(345 * math.cos(a), -70, 345 * math.sin(a)), (345 * math.cos(a + d), 0, 345 * math.sin(a + d)), (345 * math.cos(a), 70, 345 * math.sin(a))])

# ---- front: lamps, grille, plate, badge, fog lamps ----
o = Out('bumper_front')
for sg in (-1, 1):
    cy = sg * 560
    on_closed(o, 'bumper_front', 0, 'max', ellipse(cy, 650, 175, 78), 4)
    on_closed(o, 'bumper_front', 0, 'max', ellipse(cy, 650, 128, 50), 4)
    on_closed(o, 'bumper_front', 0, 'max', ellipse(cy - sg * 60, 650, 36, 36, 18), 4)
    for dz in (-22, 0, 22): on_face(o, 'bumper_front', 0, 'max', [(cy + sg * 20, 650 + dz), (cy + sg * 120, 650 + dz)], 4)
    on_closed(o, 'bumper_front', 0, 'max', ellipse(sg * 690, 330, 38, 38, 14), 4)
    on_closed(o, 'bumper_front', 0, 'max', ellipse(sg * 690, 330, 20, 20, 12), 4)
on_closed(o, 'bumper_front', 0, 'max', rrect(0, 485, 270, 62, 0.2), 4)
for dz in (-36, -18, 0, 18, 36): on_face(o, 'bumper_front', 0, 'max', [(-262, 485 + dz), (262, 485 + dz)], 4)
for yy in range(-210, 211, 70): on_face(o, 'bumper_front', 0, 'max', [(yy, 450), (yy, 520)], 4)
on_closed(o, 'bumper_front', 0, 'max', rrect(0, 340, 185, 42, 0.15), 4)
on_closed(o, 'bumper_front', 0, 'max', ellipse(0, 600, 30, 30, 18), 4)
on_face(o, 'bumper_front', 0, 'max', [(-300, 278), (300, 278)], 4)
# ---- rear: lamps, plate, exhausts ----
o = Out('bumper_rear')
for sg in (-1, 1):
    on_closed(o, 'bumper_rear', 0, 'min', ellipse(sg * 640, 800, 175, 62), -4)
    on_closed(o, 'bumper_rear', 0, 'min', ellipse(sg * 640, 800, 125, 36), -4)
    for dz in (-14, 0, 14): on_face(o, 'bumper_rear', 0, 'min', [(sg * 640 - 110, 800 + dz), (sg * 640 + 110, 800 + dz)], -4)
    on_closed(o, 'bumper_rear', 0, 'min', ellipse(sg * 500, 300, 42, 30, 16), -4)
    on_closed(o, 'bumper_rear', 0, 'min', ellipse(sg * 500, 300, 28, 18, 16), -4)
on_closed(o, 'bumper_rear', 0, 'min', rrect(0, 590, 185, 42, 0.15), -4)
on_closed(o, 'bumper_rear', 0, 'min', ellipse(0, 800, 28, 28, 18), -4)
# ---- hood and trunk creases, badge ----
o = Out('hood')
for yy in (0, 260, -260):
    on_face(o, 'hood', 2, 'max', [(x, yy) for x in range(1020, 2081, 40)], 4)
for x in (1100, 1950): on_face(o, 'hood', 2, 'max', [(x, y) for y in range(-260, 261, 40)], 4)
for sg in (-1, 1): on_closed(o, 'hood', 2, 'max', ellipse(1090, sg * 420, 22, 10, 10), 4)
o = Out('trunk')
for yy in (0, 300, -300): on_face(o, 'trunk', 2, 'max', [(x, yy) for x in range(-2130, -1770, 30)], 4)
on_closed(o, 'trunk', 2, 'max', ellipse(-2020, 0, 28, 28, 18), 4)
# ---- windshield and rear glass reflections ----
for gname, pick, sgn in (('windshield', 'max', 1), ('rear_glass', 'min', -1)):
    o = Out(gname)
    for c0 in (-700, -450, -200, 100):
        run = [(y, 1100 + 1.0 * (y - c0)) for y in range(c0, c0 + 240, 20)]
        run = [(y, z) for y, z in run if all(hit(gname, 0, yy, z, pick) is not None for yy in (y - 25, y, y + 25)) and 900 < z < 1300]
        if len(run) > 1: on_face(o, gname, 0, pick, run, 4 * sgn)

json.dump(model, open(os.path.join(HERE, '..', 'public', 'models', 'car.json'), 'w'), separators=(',', ':'))
print('ok', sum(len(d['l']) // 2 for d in parts.values()), 'line segments')
