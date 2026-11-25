/** Living signal: an additive energy current that flows along a tube's length. */
export const signalVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;
  void main() {
    vUv = uv;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

export const signalFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  uniform float uSpeed;
  uniform vec3 uColA;
  uniform vec3 uColB;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;

  void main() {
    float u = vUv.x;
    if (u > uReveal) discard;

    float facing = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
    float head = smoothstep(uReveal - 0.06, uReveal, u) * step(uReveal, 0.999);
    float flow = pow(0.5 + 0.5 * sin(u * 46.0 - uTime * uSpeed), 8.0);
    float tail = smoothstep(0.0, 0.015, u) * (1.0 - smoothstep(0.82, 1.0, u));

    vec3 col = mix(uColA, uColB, smoothstep(0.0, 1.0, u));
    col = mix(col, vec3(1.0), head * 0.4 + flow * 0.15);
    float a = facing * (0.3 + 0.6 * flow + 1.4 * head) * tail * uIntensity * 0.8;
    gl_FragColor = vec4(col * a, a);
  }
`;

/** Soft radial glow for billboards (core light, travelling packet). */
export const glowVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const glowFragment = /* glsl */ `
  precision highp float;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float core = exp(-d * d * 28.0);
    // 2026-11-25: a tight light point, not an ambient bloom. The wide halo
    // that washed nearby surfaces is cut to a trace.
    float halo = exp(-d * d * 9.0) * 0.08;
    float a = (core + halo) * (1.0 - smoothstep(0.85, 1.0, d)) * uIntensity * 0.75;
    vec3 col = mix(uColor, vec3(1.0), core * 0.5);
    gl_FragColor = vec4(col * a, a);
  }
`;
