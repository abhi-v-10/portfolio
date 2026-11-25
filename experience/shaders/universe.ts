/**
 * Milestone 005–006 shaders: Project Universe artifacts, the Timeline Nexus
 * strands and the closing horizon. All additive light (display-space colours),
 * so the worlds read as projected energy rather than lit props.
 */

/** Fresnel shell: bright edges, faint body. Solid forms that read as light. */
export const shellVertex = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;
export const shellFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uFill;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vLocal;
  void main() {
    float rim = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.4);
    vec3 col = uColor * (uFill + rim * 1.15) + vec3(1.0) * pow(rim, 6.0) * 0.35;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/** IRIS receipt: paper with procedural text rows and a travelling scan line. */
export const receiptFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uScan;
  varying vec2 vUv;
  float hash(float n) { return fract(sin(n) * 43758.5453); }
  void main() {
    vec2 uv = vUv;
    float edge = 1.0 - smoothstep(0.0, 0.015, min(min(uv.x, 1.0 - uv.x), min(uv.y, 1.0 - uv.y)));
    float row = floor(uv.y * 22.0);
    float inRow = smoothstep(0.35, 0.45, fract(uv.y * 22.0)) * (1.0 - smoothstep(0.62, 0.72, fract(uv.y * 22.0)));
    float len = 0.35 + 0.5 * hash(row * 7.1);
    float text = inRow * step(0.1, uv.x) * step(uv.x, 0.1 + len * 0.8) * step(0.08, uv.y) * step(uv.y, 0.9);
    float scanned = smoothstep(uScan - 0.01, uScan + 0.01, uv.y);
    float line = exp(-pow((uv.y - uScan) * 90.0, 2.0));
    vec3 col = uColor * (0.07 + edge * 0.8 + text * mix(0.22, 0.6, scanned)) + vec3(1.0) * line * 0.9;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;
export const uvVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

/** ELI5: a line that morphs from a tangled knot to one clean loop. */
export const morphLineVertex = /* glsl */ `
  attribute vec3 aTarget;
  attribute float aT;
  uniform float uMorph;
  uniform float uTime;
  varying float vT;
  void main() {
    float m = smoothstep(0.0, 1.0, clamp(uMorph * 1.25 - aT * 0.25, 0.0, 1.0));
    vec3 p = mix(position, aTarget, m);
    vT = aT;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
export const morphLineFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uColor2;
  uniform float uIntensity;
  uniform float uTime;
  varying float vT;
  void main() {
    float flow = pow(0.5 + 0.5 * sin(vT * 40.0 - uTime * 2.4), 6.0);
    vec3 col = mix(uColor, uColor2, vT) * (0.6 + flow * 0.9);
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/** Plain additive line colour (route graphs, links). */
export const lineVertex = /* glsl */ `
  attribute float aLit;
  varying float vLit;
  void main() {
    vLit = aLit;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
export const lineFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform vec3 uLitColor;
  uniform float uIntensity;
  varying float vLit;
  void main() {
    vec3 col = mix(uColor * 0.45, uLitColor * 1.3, clamp(vLit, 0.0, 1.0));
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/**
 * Timeline strand: a thin tube whose light runs from the past (far end, cold
 * white) to the present (the nexus, emerald). `uGather` warms the whole strand
 * from white to living green as the visitor gathers the threads; `uDawn`
 * carries it toward the warm closing light.
 */
export const strandFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  uniform float uGather;
  uniform float uDawn;
  uniform float uSeed;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    float u = vUv.x;
    if (u > uReveal) discard;
    float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.4);
    float flow = pow(0.5 + 0.5 * sin(u * 34.0 - uTime * 1.6 + uSeed * 6.0), 10.0);
    vec3 cold = vec3(0.952, 0.929, 0.91);
    vec3 green = mix(vec3(0.742, 0.78, 0.609), vec3(0.839, 0.875, 0.717), u);
    vec3 warm = mix(vec3(0.96, 0.86, 0.74), vec3(1.0, 0.67, 0.42), u);
    float g = smoothstep(0.0, 1.0, uGather * 1.3 - (1.0 - u) * 0.3);
    vec3 col = mix(cold * 0.7, green, g);
    col = mix(col, warm, uDawn);
    float head = smoothstep(uReveal - 0.05, uReveal, u) * step(uReveal, 0.999);
    float tail = smoothstep(0.0, 0.06, u);
    float a = facing * (0.3 + 0.9 * flow + 1.6 * head) * tail * uIntensity;
    gl_FragColor = vec4(col * a, a);
  }
`;

/**
 * Refinement pass (2026-11-14): textured surfaces for the Project Universe.
 * A panel crossfades between two canvas textures (device states, dense →
 * simple text), can be revealed top-down (the QP-Gen paper), carries an OCR
 * scan line (IRIS) and a soft activation glow. Normal blending, so screens and
 * paper read as objects, not light.
 */
export const panelFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uTexA;
  uniform sampler2D uTexB;
  uniform float uMix;
  uniform float uIntensity;
  uniform float uGlow;
  uniform vec3 uGlowColor;
  uniform float uReveal;
  uniform float uScan;
  varying vec2 vUv;
  void main() {
    vec4 a = texture2D(uTexA, vUv);
    vec4 b = texture2D(uTexB, vUv);
    vec4 c = mix(a, b, uMix);
    float shown = 1.0 - smoothstep(uReveal - 0.04, uReveal, 1.0 - vUv.y);
    c.a *= shown;
    float scanning = step(-0.5, uScan);
    float line = scanning * exp(-pow((vUv.y - uScan) * 110.0, 2.0));
    float read = scanning * smoothstep(uScan - 0.004, uScan + 0.004, vUv.y);
    vec3 col = c.rgb * (1.0 + uGlow * 0.25) + uGlowColor * (uGlow * 0.18 + read * 0.1) * c.a;
    col = mix(col, uGlowColor, line * 0.85);
    float alpha = max(c.a, line * 0.9 * shown);
    gl_FragColor = vec4(col, alpha * uIntensity);
  }
`;

/**
 * Device bodies and plinths (overhaul 2026-11-14): anodised satin under a
 * camera-relative studio key, so laptops, phones and plinths read as objects
 * with a surface, not glowing outlines. A broad soft highlight plus a tight
 * specular, a neutral fresnel, and the accent only as a thin rim at grazing
 * angles.
 */
export const bodyFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform float uIntensity;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vec3 n = normalize(vN);
    vec3 v = normalize(vV);
    vec3 key = normalize(vec3(-0.35, 0.75, 0.55));
    vec3 fill = normalize(vec3(0.8, -0.1, 0.5));
    float dk = max(dot(n, key), 0.0);
    float df = max(dot(n, fill), 0.0);
    vec3 h = normalize(key + v);
    float nh = max(dot(n, h), 0.0);
    float sheen = pow(nh, 14.0) * 0.22 + pow(nh, 90.0) * 0.55;
    float fres = pow(1.0 - max(dot(n, v), 0.0), 4.0);
    vec3 col = uBase * (0.42 + 0.9 * dk + 0.25 * df);
    col += vec3(0.985, 0.971, 0.959) * sheen * (0.35 + 0.65 * length(uBase) * 2.0);
    col += mix(vec3(0.757, 0.734, 0.715), uRim, 0.55) * fres * 0.35;
    gl_FragColor = vec4(col, uIntensity);
  }
`;
