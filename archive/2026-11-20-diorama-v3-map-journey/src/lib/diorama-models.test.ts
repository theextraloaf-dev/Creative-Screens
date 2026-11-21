/* Checks on the exported diorama models (public/models/*.glb): the node names, extras and budgets the page relies on.
   Regenerate with: npm run diorama:export -- --scene all */
import assert from 'node:assert/strict';
import { readFileSync, statSync } from 'node:fs';
import { test } from 'node:test';

const MODELS = new URL('../../public/models/', import.meta.url);
const MB = 1024 * 1024;

interface GltfNode { name?: string; scale?: number[]; extras?: Record<string, unknown>; children?: number[] }
interface Gltf { nodes: GltfNode[]; extensionsUsed?: string[] }

function readGlb(name: string): Gltf {
  const buf = readFileSync(new URL(name, MODELS));
  assert.equal(buf.readUInt32LE(0), 0x46546c67, `${name} is a GLB`);
  const len = buf.readUInt32LE(12);
  assert.equal(buf.readUInt32LE(16), 0x4e4f534a, `${name} first chunk is JSON`);
  return JSON.parse(buf.subarray(20, 20 + len).toString('utf8')) as Gltf;
}
const names = (g: Gltf) => new Set(g.nodes.map((n) => n.name));
const node = (g: Gltf, n: string) => g.nodes.find((x) => x.name === n);
const size = (name: string) => statSync(new URL(name, MODELS)).size;

test('street glb has the nodes the page uses', () => {
  for (const file of ['muscat-street.glb', 'muscat-street-low.glb']) {
    const g = readGlb(file); const has = names(g);
    for (const n of ['street_root', 'van', 'van_body', 'van_wheel_fl', 'van_wheel_rl', 'van_wheel_fr', 'van_wheel_rr',
      'van_logo_near', 'van_logo_far', 'CAM_overview']) assert.ok(has.has(n), `${file}: ${n}`);
    const canvases = g.nodes.filter((n) => n.name?.startsWith('canvas_'));
    assert.equal(canvases.length, 11, `${file}: canvas count`);
    for (const c of canvases) {
      const k = c.extras?.canvas as number;
      assert.ok(k >= 1 && k <= 5, `${c.name} extras.canvas`);
      assert.equal(typeof c.extras?.service, 'string');
    }
    assert.ok(g.nodes.filter((n) => n.name?.startsWith('static_')).length <= 8, `${file}: static meshes joined`);
  }
});

test('map glb has anchor, pin, labels and camera', () => {
  for (const file of ['oman-map.glb', 'oman-map-low.glb']) {
    const g = readGlb(file); const has = names(g);
    assert.equal(node(g, 'muscat_anchor')?.extras?.street_scale, 0.07, `${file}: street_scale`);
    for (const n of ['oman_root', 'pin3d_muscat', 'pin3d_salalah', 'CAM_map', 'label_muscat', 'label_nizwa', 'label_jebel_shams',
      'label_sharqiya', 'label_salalah', 'label_musandam']) assert.ok(has.has(n), `${file}: ${n}`);
    assert.ok(g.nodes.filter((n) => n.name?.startsWith('static_')).length <= 6, `${file}: static meshes joined`);
  }
});

test('meshes are draco compressed', () => {
  for (const file of ['muscat-street.glb', 'muscat-street-low.glb', 'oman-map.glb', 'oman-map-low.glb']) {
    assert.ok(readGlb(file).extensionsUsed?.includes('KHR_draco_mesh_compression'), file);
  }
});

test('budgets (v3: the map is the main stage; still 12 MB desktop / 5 MB phone in total)', () => {
  assert.ok(size('muscat-street.glb') <= 3.5 * MB, `street ${size('muscat-street.glb')}`);
  assert.ok(size('oman-map.glb') <= 3.2 * MB, `map ${size('oman-map.glb')}`);
  assert.ok(size('muscat-street-low.glb') <= 1.5 * MB, `street low ${size('muscat-street-low.glb')}`);
  assert.ok(size('oman-map-low.glb') <= 1.5 * MB, `map low ${size('oman-map-low.glb')}`);
});

const PUB = new URL('../../public/diorama/', import.meta.url);
type Prim = { attributes: Record<string, number>; material?: number };
type Full = Gltf & { meshes: { primitives: Prim[] }[]; materials: { normalTexture?: unknown; pbrMetallicRoughness?: { metallicRoughnessTexture?: unknown } }[] };

test('static scenery carries surface detail and roughness', () => {
  for (const file of ['muscat-street.glb', 'oman-map.glb']) {
    const g = readGlb(file) as Full;
    const statics = g.nodes.filter((n) => n.name?.startsWith('static_')) as (GltfNode & { mesh?: number })[];
    assert.ok(statics.length > 0, file);
    for (const n of statics) {
      for (const p of g.meshes[n.mesh!].primitives) {
        const m = g.materials[p.material!];
        assert.ok(m.normalTexture, `${file}: ${n.name} normalTexture`);
        assert.ok(m.pbrMetallicRoughness?.metallicRoughnessTexture, `${file}: ${n.name} roughness texture`);
      }
    }
  }
});

test('anchors for the interaction layer', () => {
  const street = names(readGlb('muscat-street.glb'));
  for (let n = 1; n <= 5; n++) assert.ok(street.has(`hotspot_${n}`), `hotspot_${n}`);
  const map = readGlb('oman-map.glb');
  assert.equal(map.nodes.filter((n) => n.name?.startsWith('pin_')).length, 6, 'six pins');
  assert.ok(names(map).has('route_line'), 'route_line');
});

test('environment map, LED loop and still hotspots', () => {
  for (const f of ['env.webp', 'led-loop.mp4']) {
    const b = statSync(new URL(f, PUB)).size;
    assert.ok(b > 1000 && b <= 0.5 * MB, `${f} ${b}`);
  }
  const cfg = JSON.parse(readFileSync(new URL('../data/diorama.json', import.meta.url), 'utf8'));
  assert.equal(cfg.hotspots.length, 5);
  for (const h of cfg.hotspots) assert.ok(h.x > 0 && h.x < 1 && h.y > 0 && h.y < 1, `hotspot ${h.n} ${h.x},${h.y}`);
});

test('canvases carry art UVs and baked-light UVs', () => {
  for (const file of ['muscat-street.glb', 'muscat-street-low.glb']) {
    const g = readGlb(file) as Gltf & { meshes: { primitives: { attributes: Record<string, number> }[] }[] };
    for (const n of g.nodes.filter((x) => x.name?.startsWith('canvas_')) as (GltfNode & { mesh?: number })[]) {
      assert.ok(n.mesh !== undefined, `${n.name} has a mesh`);
      for (const p of g.meshes[n.mesh!].primitives) {
        assert.ok('TEXCOORD_0' in p.attributes && 'TEXCOORD_1' in p.attributes, `${file}: ${n.name} TEXCOORD_0 + _1`);
      }
    }
  }
});

test('no node is mirrored', () => {
  for (const file of ['muscat-street.glb', 'oman-map.glb']) {
    for (const n of readGlb(file).nodes) {
      if (n.scale) assert.ok(n.scale.every((s) => s > 0), `${file}: ${n.name} scale ${n.scale}`);
    }
  }
});
