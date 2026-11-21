"""One-off download of the public map data into 3d/map/data/ (gitignored). Run: npm run diorama:data

- Natural Earth 1:10m Admin-0 countries (public domain) -> countries.geojson with Oman and its neighbours only.
  Every ring is stored as its own polygon; consumers flatten the rings and use even-odd tests (geo.point_in_rings).
- AWS Terrain Tiles, Terrarium PNG, zoom 7 (open data: Mapzen, SRTM, GMTED and others; credit shown on the page).
Existing files are kept, so re-running only fetches what is missing.
"""
import io, json, os, sys, urllib.request, zipfile, tempfile

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from geo import read_shp_polygons, read_dbf, tile_xy  # noqa: E402

DATA = os.path.join(HERE, 'data')
NE_URL = 'https://naciscdn.org/naturalearth/10m/cultural/ne_10m_admin_0_countries.zip'
TILE_URL = 'https://s3.amazonaws.com/elevation-tiles-prod/terrarium/{z}/{x}/{y}.png'
COUNTRIES = ['Oman', 'United Arab Emirates', 'Saudi Arabia', 'Yemen', 'Iran']
BBOX = (51.5, 16.0, 60.5, 27.0)   # west, south, east, north
ZOOM = 7
UA = {'User-Agent': 'diorama-map-build/1.0'}


def fetch(url, dest):
    if os.path.exists(dest):
        return False
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
        body = r.read()
    with open(dest, 'wb') as f:
        f.write(body)
    return True


def countries():
    zpath = os.path.join(DATA, 'ne_10m_admin_0_countries.zip')
    fetch(NE_URL, zpath)
    with zipfile.ZipFile(zpath) as z, tempfile.TemporaryDirectory() as tmp:
        for ext in ('shp', 'dbf'):
            name = next(n for n in z.namelist() if n.endswith(f'.{ext}'))
            z.extract(name, tmp)
            if ext == 'shp':
                shp = os.path.join(tmp, name)
            else:
                dbf = os.path.join(tmp, name)
        polys, rows = read_shp_polygons(shp), read_dbf(dbf)
    feats = []
    for rings, row in zip(polys, rows):
        if row.get('ADMIN') in COUNTRIES:
            feats.append({'type': 'Feature', 'properties': {'name': row['ADMIN']},
                          'geometry': {'type': 'MultiPolygon', 'coordinates': [[[list(p) for p in r]] for r in rings]}})
    out = os.path.join(DATA, 'countries.geojson')
    with open(out, 'w', encoding='utf-8') as f:
        json.dump({'type': 'FeatureCollection', 'features': feats}, f)
    missing = set(COUNTRIES) - {ft['properties']['name'] for ft in feats}
    if missing:
        raise SystemExit(f'missing countries: {missing}')
    print(f'countries.geojson: {len(feats)} features')


def tiles():
    x0, y0 = tile_xy(BBOX[0], BBOX[3], ZOOM)
    x1, y1 = tile_xy(BBOX[2], BBOX[1], ZOOM)
    got = total = 0
    for x in range(x0, x1 + 1):
        for y in range(y0, y1 + 1):
            total += 1
            got += fetch(TILE_URL.format(z=ZOOM, x=x, y=y), os.path.join(DATA, 'terrarium', str(ZOOM), str(x), f'{y}.png'))
    print(f'terrain tiles: {total} needed, {got} fetched now (x {x0}-{x1}, y {y0}-{y1})')


if __name__ == '__main__':
    countries()
    tiles()
