"""Oman's outline as a light SVG for the non-blocking loader (it draws itself as the 3D downloads).
Run: python 3d/map/outline_svg.py   (after npm run diorama:data). Writes public/diorama/oman-outline.svg.
Same projection as the 3D map (geo.project); north up; every ring is its own subpath (mainland, Musandam, Madha, islands).
"""
import json, os, sys

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from geo import project  # noqa: E402

REPO = os.path.dirname(os.path.dirname(HERE))
OUT = os.path.join(REPO, 'public', 'diorama', 'oman-outline.svg')


def simplify(pts, step):
    keep = [pts[0]]
    for p in pts[1:]:
        if abs(p[0] - keep[-1][0]) + abs(p[1] - keep[-1][1]) >= step:
            keep.append(p)
    return keep


def main():
    fc = json.load(open(os.path.join(HERE, 'data', 'countries.geojson'), encoding='utf-8'))
    oman = next(f for f in fc['features'] if f['properties']['name'] == 'Oman')
    rings = [[project(lon, lat) for lon, lat in ring] for poly in oman['geometry']['coordinates'] for ring in poly]
    rings = [simplify(r, 4.0) for r in rings if len(r) > 8]
    xs = [p[0] for r in rings for p in r]; ys = [p[1] for r in rings for p in r]
    x0, x1, y0, y1 = min(xs), max(xs), min(ys), max(ys)
    w, h = x1 - x0, y1 - y0
    d = ' '.join('M' + ' L'.join(f'{p[0] - x0:.1f},{y1 - p[1]:.1f}' for p in r) + ' Z' for r in rings if len(r) > 3)
    svg = (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w:.0f} {h:.0f}" fill="none" stroke="currentColor" '
           f'stroke-width="6" stroke-linejoin="round" stroke-linecap="round"><path pathLength="1" d="{d}"/></svg>\n')
    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    open(OUT, 'w', encoding='utf-8').write(svg)
    print(f'oman-outline.svg: {len(rings)} rings, {len(svg) // 1024} KB')


if __name__ == '__main__':
    main()
