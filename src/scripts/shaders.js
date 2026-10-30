// Shared GLSL for the line-art renderers (stage3d.js, warehouse.js).
// Ink lines sit slightly in front of their own surface; fills are paper-coloured so they hide lines behind.
export const FILL_VS = `#version 300 es
in vec3 position;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 modelMatrix;
out vec3 vPos; out float vWX; out float vWY; out vec3 vW;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPos = mv.xyz; vWX = w.x; vWY = w.y; vW = w.xyz;
  gl_Position = projectionMatrix * mv;
}`;
export const FILL_FS = `#version 300 es
precision highp float;
in vec3 vPos; in float vWX; in float vWY; in vec3 vW;
uniform float uYon; uniform float uYmin;
uniform vec3 uColor; uniform float uAlpha; uniform vec3 uFog; uniform vec2 uFogRange;
uniform float uSweep; uniform vec3 uXr;
out vec4 o;
void main(){
  if (uYon > 0.5 && vWY < uYmin) discard;
  if (uSweep >= 0.0) { float t = (vWX - uXr.x) / (uXr.y - uXr.x); if (uXr.z < 0.0) t = 1.0 - t; if (t > uSweep) discard; }
  vec3 n = abs(normalize(cross(dFdx(vW), dFdy(vW))));
  float l = 1.0;   // flat: solids only hide the lines behind them (line-only look)
  vec3 c = uColor * l;
  c = mix(c, uFog, smoothstep(uFogRange.x, uFogRange.y, -vPos.z) * 0.55);
  o = vec4(c, uAlpha);
}`;
export const lineVS = (draw) => `#version 300 es
in vec3 position; ${draw ? 'in float along;' : ''}
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix;
out vec3 vPos; out float vAlong; out float vK;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vPos = mv.xyz; vAlong = ${draw ? 'along' : '0.0'}; vK = 1.0;
  gl_Position = projectionMatrix * mv;
  gl_Position.z -= 0.0014 * gl_Position.w;   /* lines sit slightly in front of their own surface */
}`;
export const LINE_FS = `#version 300 es
precision highp float;
in vec3 vPos; in float vAlong; in float vK;
uniform vec3 uColor; uniform float uAlpha; uniform vec3 uFog; uniform vec2 uFogRange; uniform float uDraw;
out vec4 o;
void main(){
  if (vAlong > uDraw) discard;
  float f = smoothstep(uFogRange.x, uFogRange.y, -vPos.z);
  float a = uAlpha * (vK < 0.7 ? 0.75 : 1.0);     // interior creases are lighter as well as thinner
  o = vec4(mix(uColor, uFog, f * 0.7), a * (1.0 - f * 0.5));
}`;



// Screen-space thick lines: each segment is a quad (4 vertices carrying both endpoints), widened in pixels.
// WebGL draws every GL line 1 device pixel wide, which is too delicate for ink on paper.
export const fatLineVS = `#version 300 es
in vec3 position; in vec3 other; in float side; in float endf; in vec3 n1; in vec3 n2;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform vec2 uRes; uniform float uWidth;
out vec3 vPos; out float vAlong; out float vK;
void main(){
  vec4 m0 = modelViewMatrix * vec4(position, 1.0); vec4 m1 = modelViewMatrix * vec4(other, 1.0);
  vec4 c0 = projectionMatrix * m0; vec4 c1 = projectionMatrix * m1;
  float nearW = 0.05;
  vAlong = 0.0; vPos = vec3(0.0); vK = 0.0;
  if (c0.w < nearW && c1.w < nearW) { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  // line hierarchy: contour (heavy), interior crease (light), hidden back edge (not drawn), steady (no normals)
  float k = 0.75;
  if (dot(n1, n1) > 0.25 && dot(n2, n2) > 0.25) {
    vec3 vd = -normalize(0.5 * (m0.xyz + m1.xyz));
    float fa = dot(normalize(mat3(modelViewMatrix) * n1), vd);
    float fb = dot(normalize(mat3(modelViewMatrix) * n2), vd);
    if (fa * fb < 0.0) k = 1.0;
    else if (fa > 0.0) k = 0.5;
    else { gl_Position = vec4(2.0, 2.0, 2.0, 1.0); return; }
  }
  vK = k;
  if (c0.w < nearW) { float t = (nearW - c0.w) / (c1.w - c0.w); c0 = mix(c0, c1, t); m0 = mix(m0, m1, t); }
  if (c1.w < nearW) { float t = (nearW - c1.w) / (c0.w - c1.w); c1 = mix(c1, c0, t); m1 = mix(m1, m0, t); }
  vec2 s0 = c0.xy / c0.w * uRes * 0.5; vec2 s1 = c1.xy / c1.w * uRes * 0.5;
  vec2 d = s1 - s0; float len = length(d);
  vec2 dir = len > 0.0001 ? d / len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  bool first = endf < 0.5;
  vec4 c = first ? c0 : c1; vec2 sc = first ? s0 : s1;
  float w = uWidth * k;
  sc += nrm * side * w * 0.5 + dir * (first ? -1.0 : 1.0) * w * 0.5;
  gl_Position = vec4(sc / (uRes * 0.5) * c.w, c.z, c.w);
  gl_Position.z -= 0.0014 * c.w;
  vPos = (first ? m0 : m1).xyz;
}`;


// Textured fill (the client's artwork on printed sheets, proofs and monitors). Optional world-Y clip like FILL_FS.
export const TEX_VS = `#version 300 es
in vec3 position; in vec2 uv;
uniform mat4 modelViewMatrix; uniform mat4 projectionMatrix; uniform mat4 modelMatrix;
out vec3 vPos; out vec2 vUv; out float vWY;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPos = mv.xyz; vUv = uv; vWY = w.y;
  gl_Position = projectionMatrix * mv;
}`;
export const TEX_FS = `#version 300 es
precision highp float;
in vec3 vPos; in vec2 vUv; in float vWY;
uniform sampler2D uTex; uniform float uYon; uniform float uYmin;
uniform vec3 uFog; uniform vec2 uFogRange;
out vec4 o;
void main(){
  if (uYon > 0.5 && vWY < uYmin) discard;
  vec3 c = texture(uTex, vUv).rgb;
  c = mix(c, uFog, smoothstep(uFogRange.x, uFogRange.y, -vPos.z) * 0.55);
  o = vec4(c, 1.0);
}`;
