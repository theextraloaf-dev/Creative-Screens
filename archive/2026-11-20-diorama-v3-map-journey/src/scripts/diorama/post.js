import { HalfFloatType, Vector2, WebGLRenderTarget } from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js';
import { postFor } from '../../lib/diorama-timeline.ts';

/* After the scene: the "real miniature" finish.
   - Tilt-shift: a two-pass blur whose radius grows with the distance from a horizontal focus band (the van, or the
     open postcard's pin), so the street reads as a model on a table. High tier only.
   - Film: a gentle grade (lifted shadows, warm highlights), a soft vignette and moving grain. All tiers.
   Works in linear light; OutputPass converts to sRGB at the end. The page's paper shows through where alpha is 0. */

const VERT = /* glsl */ `varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;

const tiltShift = (dir) => ({
  uniforms: {
    tDiffuse: { value: null }, uFocus: { value: 0.45 }, uBand: { value: 0.14 }, uMax: { value: 7.0 },
    uTexel: { value: new Vector2(1, 1) }, uDir: { value: dir },
  },
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uFocus; uniform float uBand; uniform float uMax;
    uniform vec2 uTexel; uniform vec2 uDir; varying vec2 vUv;
    void main() {
      float d = max(0.0, abs(vUv.y - uFocus) - uBand);
      float r = clamp(d * 2.6, 0.0, 1.0) * uMax;            // blur radius in pixels
      vec4 sum = vec4(0.0); float wsum = 0.0;
      for (int i = -6; i <= 6; i++) {
        float f = float(i);
        float w = exp(-f * f / 18.0);
        sum += texture2D(tDiffuse, vUv + uDir * uTexel * f * r / 6.0) * w; wsum += w;
      }
      gl_FragColor = sum / wsum;
    }`,
});

const film = {
  uniforms: { tDiffuse: { value: null }, uTime: { value: 0 }, uGrain: { value: 0.035 }, uVignette: { value: 0.28 }, uGrade: { value: 1 } },
  vertexShader: VERT,
  fragmentShader: /* glsl */ `
    uniform sampler2D tDiffuse; uniform float uTime; uniform float uGrain; uniform float uVignette; uniform float uGrade;
    varying vec2 vUv;
    float hash(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
    void main() {
      vec4 c = texture2D(tDiffuse, vUv);
      float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722));
      vec3 g = mix(vec3(0.012, 0.010, 0.014), vec3(1.0), c.rgb);          // lift the shadows a touch (slightly cool)
      g *= mix(vec3(1.0), vec3(1.04, 1.0, 0.95), smoothstep(0.25, 0.9, l)); // warm the highlights
      c.rgb = mix(c.rgb, g, uGrade);
      float v = smoothstep(0.95, 0.35, length((vUv - 0.5) * vec2(1.15, 1.0)));
      c.rgb *= mix(1.0 - uVignette, 1.0, v);
      float n = hash(vUv * vec2(1931.0, 1373.0) + fract(uTime * 7.0)) - 0.5;
      c.rgb += n * uGrain * c.a;
      gl_FragColor = c;
    }`,
};

export function createPost(renderer, scene, camera, tier) {
  const opts = postFor(tier);
  // multisampled targets: post-processing bypasses the canvas's own antialiasing, so edges would stair-step
  const target = new WebGLRenderTarget(1, 1, { type: HalfFloatType, samples: tier === 'high' ? 4 : 2 });
  const composer = new EffectComposer(renderer, target);
  composer.addPass(new RenderPass(scene, camera));
  const blur = opts.dof ? [new ShaderPass(tiltShift(new Vector2(1, 0))), new ShaderPass(tiltShift(new Vector2(0, 1)))] : [];
  blur.forEach((p) => composer.addPass(p));
  const filmPass = new ShaderPass(film);
  filmPass.uniforms.uGrain.value = opts.grain ? 0.022 : 0;
  filmPass.uniforms.uGrade.value = opts.grade ? 1 : 0;
  composer.addPass(filmPass);
  composer.addPass(new OutputPass());

  return {
    render(time) { filmPass.uniforms.uTime.value = time; composer.render(); },
    /** y01: 0 bottom .. 1 top of the screen; amount: 0 (no blur) .. 1 */
    setFocus(y01, amount = 1) { for (const p of blur) { p.uniforms.uFocus.value = y01; p.uniforms.uMax.value = 7 * amount; } },
    resize(w, h, dpr) {
      composer.setPixelRatio(dpr); composer.setSize(w, h);
      for (const p of blur) p.uniforms.uTexel.value.set(1 / (w * dpr), 1 / (h * dpr));
    },
    dispose() { composer.dispose(); },
  };
}
