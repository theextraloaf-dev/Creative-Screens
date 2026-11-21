import { Color, DoubleSide, MeshBasicMaterial, MeshPhysicalMaterial, ShaderMaterial, Vector3 } from 'three';

/* Materials for the diorama. Diffuse light is baked in Blender (3d/bake_export.py, through AgX); on top of it the web
   adds what a bake cannot hold: reflections that follow the camera, surface detail catching them, and motion.
   - litMaterial: baked light as emission (so diffuse is exactly the bake) + a specular layer: normal map, roughness
     map and the street's own environment map. No double diffuse, no scene lights needed.
   - waterMaterial: lit + moving wave normals (uTime).
   - addSway: palms sway with height, from uTime (vertex shader).
   - mapFadeMaterial: the Oman map drawn only inside a dithered disc around Muscat during the dive.
   - routeMaterial: the journey's route on the map, drawn on by uReveal.
   - fillMaterial: a grey canvas that a lime, then navy, band wipes into the artwork; flags and banner wave.
   Every material is double-sided: a few Blender faces point inward and Blender renders both sides. */

export const shared = { uTime: { value: 0 } };

/** kind: 'matte' (plaster, sand, rock), 'paint' (the van: clear coat), 'water' */
export function litMaterial({ baked, normal, orm, env, kind = 'matte' }) {
  const m = new MeshPhysicalMaterial({
    color: 0x000000, emissive: 0xffffff, emissiveMap: baked ?? null, metalness: 0,
    normalMap: normal ?? null, roughnessMap: orm ?? null, roughness: 1,
    envMap: env ?? null, envMapIntensity: kind === 'matte' ? 0.35 : 1.0, side: DoubleSide,
  });
  if (kind === 'paint') { m.clearcoat = 0.8; m.clearcoatRoughness = 0.12; }
  return m;
}

export function waterMaterial(opts) {
  const m = litMaterial({ ...opts, kind: 'water' });
  m.roughnessMap = null; m.roughness = 0.08;
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uTime = shared.uTime;
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
{
  // two slow wave trains in view space: cheap, and enough for a toy sea to glint as it moves
  vec2 p = vViewPosition.xy * 0.35;
  float a = sin(p.x * 1.7 + uTime * 0.9) + sin(p.y * 2.3 - uTime * 0.7);
  float b = cos(p.x * 2.9 - uTime * 1.3) + cos(p.y * 1.1 + uTime * 0.6);
  normal = normalize(normal + vec3(a, b, 0.0) * 0.06);
}`);
  };
  m.customProgramCacheKey = () => 'water';
  return m;
}

/** palms: bend with height, gusting slowly; amp is the sway at the crown in scene units */
export function addSway(material, { amp = 0.12 } = {}) {
  const prev = material.onBeforeCompile;
  material.onBeforeCompile = (shader, r) => {
    prev?.(shader, r);
    shader.uniforms.uTime = shared.uTime;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nuniform float uTime;')
      .replace('#include <begin_vertex>', `#include <begin_vertex>
{
  vec4 wp = modelMatrix * vec4(transformed, 1.0);
  float h = smoothstep(1.5, 6.5, wp.y);
  float g = sin(uTime * 1.1 + wp.x * 0.35) * 0.7 + sin(uTime * 2.3 + wp.z * 0.5) * 0.3;
  transformed.x += g * ${amp.toFixed(3)} * h * h;
  transformed.z += g * ${(amp * 0.5).toFixed(3)} * h * h;
}`);
  };
  material.customProgramCacheKey = () => `sway-${amp}`;
  return material;
}

export function bakedMaterial(texture) {
  return new MeshBasicMaterial({ map: texture ?? null, side: DoubleSide });
}

/* one set of uniforms shared by every map material, so one write updates the whole map */
export const mapFade = { uCenter: { value: new Vector3() }, uRadius: { value: 1e6 }, uEdge: { value: 40 }, uGrid: { value: 1 }, uHole: { value: 0 } };

/** the map's static meshes; `extra` ({ normal, orm, env, kind }) adds the specular layer, `water` animates it */
/** grid: draw the cartographic graticule (every 50 km, a stronger line every 250 km) on this surface */
/** hole: this surface also clears a disc of radius uHole around Muscat (the trees and rocks, so the dive lands on the street) */
export function mapFadeMaterial(texture, extra, water = false, grid = false, hole = false) {
  const m = extra ? (water ? waterMaterial({ baked: texture, ...extra }) : litMaterial({ baked: texture, ...extra }))
    : new MeshBasicMaterial({ map: texture ?? null, side: DoubleSide });
  const prev = m.onBeforeCompile;
  m.onBeforeCompile = (shader, r) => {
    prev?.(shader, r);
    Object.assign(shader.uniforms, mapFade);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vWorld;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvWorld = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vWorld;
uniform vec3 uCenter; uniform float uRadius; uniform float uEdge; uniform float uGrid; uniform float uHole;
float vhash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float vnoise(vec2 p) {
  vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(vhash(i), vhash(i + vec2(1, 0)), f.x), mix(vhash(i + vec2(0, 1)), vhash(i + vec2(1, 1)), f.x), f.y);
}
float gridLine(vec2 p, float step, float px) {
  vec2 g = abs(fract(p / step - 0.5) - 0.5) * step / (fwidth(p) * px);
  return 1.0 - clamp(min(g.x, g.y), 0.0, 1.0);
}`)
      .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
float n = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453);
if (distance(vWorld.xz, uCenter.xz) - uRadius > (n - 0.5) * uEdge) discard;${hole ? ' if (distance(vWorld.xz, uCenter.xz) < uHole) discard;' : ''}`);
    if (grid) {
      shader.fragmentShader = shader.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
vec2 gp = vWorld.xz - uCenter.xz;
${water ? '' : `// ground grain: drifts of sand and stony patches (3 km and 0.7 km), so close-ups are never a flat smear of the bake
float grain = vnoise(gp / 3.0) * 0.6 + vnoise(gp / 0.7) * 0.4;
gl_FragColor.rgb *= 0.93 + 0.14 * grain;`}
float gline = max(gridLine(gp, 20.0, 1.0) * 0.6, gridLine(gp, 100.0, 1.5));
gl_FragColor.rgb = mix(gl_FragColor.rgb, gl_FragColor.rgb * 0.78 + vec3(0.02, 0.03, 0.04), gline * 0.75 * uGrid);`);
    }
  };
  m.customProgramCacheKey = () => `mapfade-${!!extra}-${water}-${grid}-${hole}`;
  return m;
}

/** the route line on the map, drawn on by uReveal (0..1 along its uv u), with a brighter head */
export function routeMaterial() {
  return new ShaderMaterial({
    transparent: true, depthWrite: false, side: DoubleSide,
    uniforms: { uReveal: { value: 0 }, uLime: { value: new Color('#bbd440') } },
    vertexShader: /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`,
    fragmentShader: /* glsl */ `
      uniform float uReveal; uniform vec3 uLime; varying vec2 vUv;
      void main() {
        if (vUv.x > uReveal) discard;
        float head = smoothstep(uReveal - 0.04, uReveal, vUv.x);
        float edge = smoothstep(0.2, 0.3, vUv.y) * smoothstep(0.8, 0.7, vUv.y);
        gl_FragColor = vec4(uLime * (1.0 + head * 0.8), edge);
        #include <colorspace_fragment>
      }`,
  });
}

const GREY = new Color('#b9b9b4').r;     // linear albedo of the canvas grey (all three channels are close)

/** wave: 0 for rigid surfaces, ~0.08 for feather flags, ~0.03 for the banner (metres at the free edge) */
export function fillMaterial({ light, art, dir, wave = 0 }) {
  return new ShaderMaterial({
    side: DoubleSide,
    uniforms: {
      uLight: { value: light }, uArt: { value: art }, uProgress: { value: 0 }, uDir: { value: dir },
      uGrey: { value: GREY }, uLime: { value: new Color('#bbd440') }, uNavy: { value: new Color('#131d27') },
      uTime: shared.uTime, uWave: { value: wave },
    },
    vertexShader: /* glsl */ `
      attribute vec2 uv1;
      uniform float uTime; uniform float uWave;
      varying vec2 vUv; varying vec2 vUv1;
      void main() {
        vUv = uv; vUv1 = uv1;
        vec3 p = position;
        // fabric ripples travel away from the pole (u = 0), growing toward the free edge
        p.z += sin(uv.x * 7.0 - uTime * 3.2 + uv.y * 2.0) * uWave * uv.x;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: /* glsl */ `
      uniform sampler2D uLight; uniform sampler2D uArt; uniform float uProgress; uniform float uDir; uniform float uGrey;
      uniform vec3 uLime; uniform vec3 uNavy;
      varying vec2 vUv; varying vec2 vUv1;
      void main() {
        vec3 light = texture2D(uLight, vUv1).rgb;
        float shade = 1.0 / uGrey;
        float u = uDir > 0.0 ? vUv.x : 1.0 - vUv.x;          // the wipe follows reading direction
        float e = uProgress * 1.24;                          // runs past 1 so both bands leave the surface
        vec3 c = light;                                      // still grey ahead of the edge
        if (u < e) c = uLime * light * shade;
        if (u < e - 0.06) c = uNavy * light * shade;
        if (u < e - 0.12) c = texture2D(uArt, vUv).rgb * light * shade;
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  });
}
