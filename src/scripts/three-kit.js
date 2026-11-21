import {
  AddEquation, BufferAttribute, BufferGeometry, CustomBlending, DoubleSide, GLSL3, NoBlending, OneMinusSrcAlphaFactor,
  RawShaderMaterial, SrcAlphaFactor, WebGLRenderer,
} from 'three';

/* Shared Three.js plumbing for the line-art scenes (stage3d.js, warehouse.js).
   The GLSL in shaders.js is written for raw WebGL2 (it declares its own attributes and matrices), so every
   material is a RawShaderMaterial and the shaders run unchanged. */

/* Transparent canvas that composites straight (not premultiplied) alpha: the shaders output colour and alpha separately. */
export function createRenderer(canvas, dpr) {
  const renderer = new WebGLRenderer({ canvas, alpha: true, antialias: true, depth: true, premultipliedAlpha: false });
  renderer.setPixelRatio(dpr);
  renderer.setClearColor(0x000000, 0);
  return renderer;
}

/* Three adds its own #version line (glslVersion) ahead of its defines, so the one in our GLSL has to go. */
const withoutVersion = (src) => src.replace(/^#version 300 es\s*/, '');

/* blended: ordinary src-alpha blending (set explicitly so the alpha channel blends like the original OGL scenes);
   otherwise the material is opaque and draws with no blending at all. */
export function inkMaterial({ vertex, fragment, uniforms, blended = false, depthWrite = true }) {
  return new RawShaderMaterial({
    glslVersion: GLSL3,
    vertexShader: withoutVersion(vertex),
    fragmentShader: withoutVersion(fragment),
    uniforms,
    side: DoubleSide,
    transparent: blended,
    depthWrite,
    ...(blended
      ? { blending: CustomBlending, blendEquation: AddEquation, blendSrc: SrcAlphaFactor, blendDst: OneMinusSrcAlphaFactor }
      : { blending: NoBlending }),
  });
}

/* attrs: { name: [typedArray, itemSize] }; index: Uint16Array | Uint32Array (optional) */
export function bufferGeometry(attrs, index) {
  const g = new BufferGeometry();
  for (const [name, [data, size]] of Object.entries(attrs)) g.setAttribute(name, new BufferAttribute(data, size));
  if (index) g.setIndex(new BufferAttribute(index, 1));
  return g;
}
