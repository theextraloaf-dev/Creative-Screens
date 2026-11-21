"""Geo helpers for the Oman map (stdlib only: importable from Blender's Python and from system Python).

project():           lon/lat -> local km, equirectangular about LON0/LAT0 (1 Blender unit = 1 km on the map)
terrarium_height():  AWS Terrain Tiles (Terrarium PNG) pixel -> metres
tile_xy/tile_bounds: slippy-map tile maths
read_shp_polygons / read_dbf: just enough of the ESRI shapefile and dBase III formats for Natural Earth
point_in_rings():    even-odd ray casting over all rings, so holes work
"""
import math
import struct

LON0, LAT0 = 57.0, 21.0
KM_PER_DEG_LAT = 110.57
KM_PER_DEG_LON = 111.32 * math.cos(math.radians(LAT0))


def project(lon, lat):
    return ((lon - LON0) * KM_PER_DEG_LON, (lat - LAT0) * KM_PER_DEG_LAT)


def terrarium_height(r, g, b):
    return r * 256 + g + b / 256 - 32768


def tile_xy(lon, lat, z):
    n = 2 ** z
    x = int((lon + 180.0) / 360.0 * n)
    y = int((1.0 - math.asinh(math.tan(math.radians(lat))) / math.pi) / 2.0 * n)
    return x, y


def tile_bounds(x, y, z):
    """(west, south, east, north) in degrees."""
    n = 2 ** z
    lat = lambda yy: math.degrees(math.atan(math.sinh(math.pi * (1 - 2 * yy / n))))
    return (x / n * 360.0 - 180.0, lat(y + 1), (x + 1) / n * 360.0 - 180.0, lat(y))


def read_shp_polygons(shp_path):
    """One list of rings per record; each ring a list of (lon, lat). Null shapes give []."""
    out = []
    with open(shp_path, 'rb') as f:
        data = f.read()
    pos = 100
    while pos + 8 <= len(data):
        _num, length = struct.unpack('>ii', data[pos:pos + 8])
        content = data[pos + 8:pos + 8 + length * 2]
        pos += 8 + length * 2
        shape_type = struct.unpack('<i', content[:4])[0]
        if shape_type == 0:
            out.append([])
            continue
        if shape_type != 5:
            raise ValueError(f'unsupported shape type {shape_type}')
        nparts, npoints = struct.unpack('<ii', content[36:44])
        parts = list(struct.unpack(f'<{nparts}i', content[44:44 + 4 * nparts]))
        p0 = 44 + 4 * nparts
        pts = [struct.unpack('<2d', content[p0 + 16 * i:p0 + 16 * i + 16]) for i in range(npoints)]
        bounds = parts + [npoints]
        out.append([pts[bounds[i]:bounds[i + 1]] for i in range(nparts)])
    return out


def read_dbf(dbf_path, encoding='utf-8'):
    with open(dbf_path, 'rb') as f:
        data = f.read()
    nrec, hlen, rlen = struct.unpack('<IHH', data[4:12])
    fields, off = [], 32
    while data[off] != 0x0D:
        name = data[off:off + 11].split(b'\x00')[0].decode('ascii')
        flen = data[off + 16]
        fields.append((name, flen))
        off += 32
    rows = []
    for r in range(nrec):
        base = hlen + r * rlen + 1          # skip the deletion flag
        row, o = {}, base
        for name, flen in fields:
            row[name] = data[o:o + flen].decode(encoding, errors='replace').strip(' \x00')
            o += flen
        rows.append(row)
    return rows


def point_in_rings(lon, lat, rings):
    inside = False
    for ring in rings:
        n = len(ring)
        j = n - 1
        for i in range(n):
            xi, yi = ring[i][0], ring[i][1]
            xj, yj = ring[j][0], ring[j][1]
            if (yi > lat) != (yj > lat) and lon < (xj - xi) * (lat - yi) / (yj - yi) + xi:
                inside = not inside
            j = i
    return inside
