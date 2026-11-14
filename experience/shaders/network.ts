/**
 * Milestone 004 shaders. One ribbon system and one node system carry both
 * chapters, so the change is a single continuous transformation driven by
 * `uFlex` (0 = Intelligence: thin precise connections with request pulses,
 * 1 = the transition toward Project Universe: wide flowing ribbons in the warm palette).
 */

const palette = /* glsl */ `
  // Transition palette: violet → pink → coral → cyan → warm ivory (display values).
  vec3 pal(float k) {
    k = fract(k) * 5.0;
    vec3 c0 = vec3(0.50, 0.38, 0.95);
    vec3 c1 = vec3(0.95, 0.45, 0.66);
    vec3 c2 = vec3(1.00, 0.62, 0.44);
    vec3 c3 = vec3(0.38, 0.86, 0.90);
    vec3 c4 = vec3(0.98, 0.88, 0.76);
    vec3 a = k < 1.0 ? c0 : k < 2.0 ? c1 : k < 3.0 ? c2 : k < 4.0 ? c3 : c4;
    vec3 b = k < 1.0 ? c1 : k < 2.0 ? c2 : k < 3.0 ? c3 : k < 4.0 ? c4 : c0;
    float f = fract(k);
    return mix(a, b, f * f * (3.0 - 2.0 * f));
  }
`;

export const ribbonVertex = /* glsl */ `
  attribute vec3 aA;
  attribute vec3 aB;
  attribute vec3 aC;
  attribute float aT;
  attribute float aSide;
  attribute float aSeed;
  uniform float uTime;
  uniform float uFlex;
  uniform float uWidth;
  uniform float uWidthFlex;
  varying float vT;
  varying float vSide;
  varying float vSeed;

  vec3 bez(vec3 a, vec3 c, vec3 b, float t) { float u = 1.0 - t; return u * u * a + 2.0 * u * t * c + t * t * b; }

  void main() {
    // The control point loosens: still in Intelligence, wandering in the transition.
    vec3 wander = vec3(sin(uTime * 0.35 + aSeed * 6.0), 0.8 * sin(uTime * 0.28 + aSeed * 4.1), cos(uTime * 0.31 + aSeed * 5.3));
    vec3 c = aC + wander * (0.12 + 2.4 * uFlex);
    vec3 p = bez(aA, c, aB, aT);
    vec3 tang = bez(aA, c, aB, min(aT + 0.01, 1.0)) - bez(aA, c, aB, max(aT - 0.01, 0.0));
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vec3 tv = normalize((modelViewMatrix * vec4(tang, 0.0)).xyz + 1e-5);
    vec3 side = normalize(cross(tv, vec3(0.0, 0.0, 1.0)) + 1e-5);
    float taper = pow(sin(3.14159 * aT), 0.6);
    float breathe = 0.65 + 0.35 * sin(aSeed * 12.0 + aT * 6.0 + uTime * 0.6);
    float w = mix(uWidth, uWidthFlex * breathe, uFlex) * mix(1.0, taper, uFlex);
    mv.xyz += side * aSide * w;
    vT = aT;
    vSide = aSide;
    vSeed = aSeed;
    gl_Position = projectionMatrix * mv;
  }
`;

export const ribbonFragment = /* glsl */ `
  precision highp float;
  ${palette}
  uniform float uTime;
  uniform float uFlex;
  uniform float uReveal;
  uniform float uIntensity;
  uniform vec3 uCold;
  uniform vec3 uPulse;
  varying float vT;
  varying float vSide;
  varying float vSeed;

  void main() {
    float rev = clamp((uReveal - vSeed * 0.35) / 0.45, 0.0, 1.0);
    if (vT > rev) discard;
    float soft = 1.0 - smoothstep(0.35, 1.0, abs(vSide));
    // Request pulses along every connection (Intelligence); a slow sheen later.
    float pulse = pow(max(0.0, 1.0 - abs(fract(vT - uTime * 0.42 + vSeed) - 0.5) * 2.0), 18.0);
    vec3 cold = uCold * 0.6 + uPulse * pulse * 1.5;
    float k = vT * 0.55 + vSeed + uTime * 0.025;
    vec3 warm = pal(k) * (0.75 + 0.35 * pow(1.0 - abs(vSide), 2.0));
    vec3 col = mix(cold, warm, uFlex);
    float a = soft * mix(1.0, 0.7, uFlex);
    gl_FragColor = vec4(col * a * uIntensity, 1.0);
  }
`;

export const blobVertex = /* glsl */ `
  attribute float aSeed;
  attribute float aWarm;
  varying float vWarm;
  uniform float uTime;
  uniform float uFlex;
  varying vec3 vN;
  varying vec3 vView;
  varying float vSeed;
  void main() {
    vec3 p = position;
    // Precise sphere → soft, slowly breathing form.
    float n = sin(dot(p, vec3(3.1, 2.7, 3.7)) * 1.6 + uTime * 0.9 + aSeed * 10.0) * 0.5
            + sin(dot(p, vec3(-2.3, 3.9, 1.7)) * 2.2 - uTime * 0.7 + aSeed * 4.0) * 0.35;
    p *= 1.0 + n * 0.24 * uFlex;
    vec4 w = modelMatrix * instanceMatrix * vec4(p, 1.0);
    vN = normalize(mat3(modelMatrix) * mat3(instanceMatrix) * normal);
    vView = normalize(cameraPosition - w.xyz);
    vSeed = aSeed;
    vWarm = aWarm;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const blobFragment = /* glsl */ `
  precision highp float;
  ${palette}
  uniform float uFlex;
  uniform float uIntensity;
  uniform float uTime;
  varying vec3 vN;
  varying vec3 vView;
  varying float vSeed;
  varying float vWarm;
  void main() {
    float f = pow(1.0 - max(dot(normalize(vN), normalize(vView)), 0.0), 2.2);
    // Intelligence: a bright cyan core with a cool rim (additive, alpha 0).
    vec3 cold = mix(vec3(0.62, 0.95, 1.0), vec3(0.45, 0.5, 1.0), f) * (0.9 + f * 0.8);
    // Result node: a gold core inside a cyan rim, breathing slowly (a nod to Vision, original form).
    vec3 gold = mix(vec3(1.0, 0.82, 0.38), vec3(0.45, 0.6, 1.0), f) * (1.0 + 0.18 * sin(uTime * 1.6));
    cold = mix(cold, gold, vWarm);
    // Transition: iridescent palette form with an ivory highlight.
    float k = vSeed + f * 0.35 + uTime * 0.02;
    vec3 warm = mix(pal(k), pal(k + 0.25), f) * (0.65 + 0.5 * f);
    warm += vec3(1.0, 0.95, 0.88) * pow(max(dot(normalize(vN), normalize(vec3(-0.3, 0.8, 0.5))), 0.0), 18.0) * 0.5;
    vec3 col = mix(cold, warm, uFlex);
    float a = mix(0.0, 0.8, uFlex);
    gl_FragColor = vec4(col * uIntensity, a * uIntensity);
  }
`;
