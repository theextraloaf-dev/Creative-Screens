"""Tests for 3d/map/geo.py (stdlib only). Run: npm run test:geo"""
import json, os, sys, unittest

HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, HERE)
from geo import project, terrarium_height, tile_xy, tile_bounds, point_in_rings  # noqa: E402

DATA = os.path.join(HERE, 'data', 'countries.geojson')


class GeoTest(unittest.TestCase):
    def test_terrarium_sea_level(self):
        self.assertEqual(terrarium_height(128, 0, 0), 0.0)
        self.assertAlmostEqual(terrarium_height(128, 11, 184), 11 + 184 / 256)

    def test_project_origin_and_muscat(self):
        self.assertEqual(project(57, 21), (0.0, 0.0))
        x, y = project(58.383, 23.588)
        self.assertAlmostEqual(x, 143.7, delta=0.5)
        self.assertAlmostEqual(y, 286.2, delta=0.5)

    def test_tile_xy_covers_oman(self):
        self.assertEqual(tile_xy(58.383, 23.588, 7), (84, 55))

    def test_tile_bounds_round_trip(self):
        w, s, e, n = tile_bounds(84, 55, 7)
        self.assertTrue(w <= 58.383 <= e and s <= 23.588 <= n)

    def test_point_in_rings_square_with_hole(self):
        outer = [(0, 0), (10, 0), (10, 10), (0, 10), (0, 0)]
        hole = [(4, 4), (6, 4), (6, 6), (4, 6), (4, 4)]
        self.assertFalse(point_in_rings(5, 5, [outer, hole]))
        self.assertTrue(point_in_rings(2, 2, [outer, hole]))
        self.assertFalse(point_in_rings(11, 2, [outer, hole]))

    def test_read_dbf_strips_space_and_nul_padding(self):
        import struct, tempfile
        from geo import read_dbf
        fields = [(b'ADMIN', 10), (b'ISO', 3)]
        hlen = 32 + 32 * len(fields) + 1
        rlen = 1 + sum(n for _, n in fields)
        head = struct.pack('<B3xIHH20x', 3, 2, hlen, rlen)
        desc = b''.join(name.ljust(11, b'\x00') + b'C' + b'\x00' * 4 + bytes([n, 0]) + b'\x00' * 14 for name, n in fields)
        recs = b' ' + b'Oman\x00\x00\x00\x00\x00\x00' + b'OMN' + b' ' + b'Yemen     ' + b'YEM'
        with tempfile.NamedTemporaryFile(suffix='.dbf', delete=False) as f:
            f.write(head + desc + b'\x0d' + recs)
        try:
            rows = read_dbf(f.name)
        finally:
            os.unlink(f.name)
        self.assertEqual(rows, [{'ADMIN': 'Oman', 'ISO': 'OMN'}, {'ADMIN': 'Yemen', 'ISO': 'YEM'}])

    @unittest.skipUnless(os.path.exists(DATA), 'run npm run diorama:data first')
    def test_oman_polygon(self):
        with open(DATA, encoding='utf-8') as f:
            fc = json.load(f)
        oman = next(ft for ft in fc['features'] if ft['properties']['name'] == 'Oman')
        rings = [ring for poly in oman['geometry']['coordinates'] for ring in poly]
        self.assertTrue(point_in_rings(58.383, 23.588, rings), 'Muscat')
        self.assertTrue(point_in_rings(56.25, 26.18, rings), 'Khasab, Musandam')
        self.assertTrue(point_in_rings(54.09, 17.02, rings), 'Salalah')
        self.assertFalse(point_in_rings(55.27, 25.20, rings), 'Dubai')
        self.assertEqual(len(fc['features']), 5)


if __name__ == '__main__':
    unittest.main()
