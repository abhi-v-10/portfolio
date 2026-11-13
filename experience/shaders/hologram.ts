/**
 * Holographic workspace shaders. Everything here is additive light drawn
 * procedurally (no textures): rings, instrument projections, data lines,
 * the emitter floor and the spatial grid. Colours are authored in display space.
 */

const common = /* glsl */ `
  float hash11(float p) { p = fract(p * 0.1031); p *= p + 33.33; p *= p + p; return fract(p); }
  float hash21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  // Anti-aliased line of half-width w centred on d = 0.
  float aline(float d, float w) { float f = fwidth(d); return 1.0 - smoothstep(w, w + f * 1.5, abs(d)); }
  // Periodic grid line: n lines per unit along x.
  float gline(float x, float n, float w) { float f = fract(x * n); float d = min(f, 1.0 - f) / n; return aline(d, w); }
  float sdBox(vec2 p, vec2 b) { vec2 d = abs(p) - b; return length(max(d, 0.0)) + min(max(d.x, d.y), 0.0); }
  const float TAU = 6.28318530718;
`;

export const holoVertex = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vWorld;
  void main() {
    vUv = uv;
    vPos = position;
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    vec4 mv = viewMatrix * world;
    vN = normalize(normalMatrix * normal);
    vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }
`;

/**
 * Core rings. kind 0 = three-arc inner frame (r 1.0), 1 = split orbit with a
 * circulating current (r 1.5), 2 = precision ticks (r 1.85), 3 = wide dashed
 * outer orbit. Kinds 0–2 replicate the SVG loader core one-to-one.
 */
export const ringFragment = /* glsl */ `
  precision highp float;
  ${common}
  uniform float uTime;
  uniform float uKind;
  uniform float uRadius;
  uniform float uRot;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec3 vPos;

  void main() {
    float r = length(vPos.xy);
    float a = atan(vPos.y, vPos.x) / TAU + 0.5 + uRot;
    float d = r - uRadius;
    int kind = int(uKind + 0.5);
    float v = 0.0;
    if (kind == 0) {
      float seg = step(fract(a * 3.0), 0.79);
      v = aline(d, 0.018) * seg;
      v += aline(d - 0.09, 0.004) * step(fract(a * 24.0), 0.5) * 0.35;
    } else if (kind == 1) {
      float seg = step(fract(a * 2.0), 0.8);
      v = aline(d, 0.012) * seg * 0.75;
      float comet = pow(1.0 - fract(uTime * 0.26 - a), 18.0);
      v += aline(d, 0.02) * comet * 1.6;
    } else if (kind == 2) {
      float tick = step(fract(a * 100.0), 0.16);
      v = aline(d, 0.045) * tick * 0.55;
      v += aline(d - 0.065, 0.004) * 0.3;
      v += aline(d, 0.05) * step(fract(a * 4.0), 0.02) * 0.9; // cardinal marks
    } else {
      float dash = step(fract(a * 64.0), 0.45) * step(fract(a * 2.0), 0.72);
      v = aline(d, 0.006) * dash * 0.7;
      v += aline(d + 0.05, 0.003) * 0.25;
    }
    vec3 col = mix(uColor, vec3(1.0), clamp(v - 0.9, 0.0, 1.0));
    gl_FragColor = vec4(col * v * uIntensity, 1.0);
  }
`;

/** Glass shell around the core: fresnel rim, latitude lines and a scanning band. */
export const shellFragment = /* glsl */ `
  precision highp float;
  ${common}
  uniform float uTime;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying vec3 vPos;
  varying vec3 vN;
  varying vec3 vV;

  void main() {
    float facing = abs(dot(normalize(vN), normalize(vV)));
    float fres = pow(1.0 - facing, 2.6);
    float lat = gline(vPos.y + 1.0, 5.0, 0.002) * 0.22;
    float lon = gline(atan(vPos.z, vPos.x) / TAU + 0.5, 18.0, 0.0015) * 0.12 * (1.0 - fres);
    float scanY = sin(uTime * 0.7) * 0.8;
    float band = exp(-pow((vPos.y - scanY) * 16.0, 2.0));
    vec3 col = uColor * (fres * 0.85 + lat + lon) + uAccent * band * (0.25 + fres * 0.6);
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/**
 * Instrument projections: a glass pane, frame and corner brackets around a
 * typeset face (canvas texture of verified copy), plus one live motion per face:
 * packets on a lane (uMotion.w 0 = both ways, 1 = forward), a row scan (2)
 * or a glint sweep (3, callouts).
 */
export const panelFragment = /* glsl */ `
  precision highp float;
  ${common}
  uniform float uTime;
  uniform float uAssemble;
  uniform float uKind;
  uniform float uAspect;
  uniform float uSeed;
  uniform float uOpacity;
  uniform float uGlass;
  uniform vec4 uMotion;
  uniform sampler2D uText;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying vec2 vUv;

  void main() {
    vec2 uv = vUv;
    vec2 p = (uv - 0.5) * vec2(uAspect, 1.0);
    float t = uTime;
    float A = clamp(uAssemble, 0.0, 1.0);
    vec2 halfSize = vec2(uAspect, 1.0) * 0.5 - 0.02;

    // Projection opens vertically from its centre line, then content wipes in.
    float open = smoothstep(0.0, 0.45, A);
    float openMask = step(abs(uv.y - 0.5), open * 0.5 + 0.002);
    float wipe = smoothstep(0.3, 1.0, A) * 1.2;
    float contentMask = smoothstep(wipe - 0.06, wipe - 0.16, uv.x);
    float leading = exp(-pow((uv.x - (wipe - 0.11)) * 60.0, 2.0)) * step(A, 0.999);

    float dFrame = sdBox(p, halfSize);
    float inside = 1.0 - smoothstep(0.0, fwidth(dFrame) * 1.5, dFrame);
    float frame = aline(dFrame, 0.0016);
    vec2 q = abs(p) - halfSize;
    float corner = step(-0.07, q.x) * step(-0.07, q.y);
    float bracket = aline(dFrame + 0.004, 0.004) * corner;
    float fill = inside * (0.03 + 0.035 * (1.0 - uv.y));
    float scan = inside * 0.018 * (0.5 + 0.5 * sin(uv.y * 420.0 - t * 5.0));

    // Typeset face: R = primary ink, G = highlight ink.
    vec3 ink = texture2D(uText, uv).rgb;
    float content = ink.r;
    float accent = ink.g;

    int kind = int(uMotion.w + 0.5);
    if (kind == 0 || kind == 1) {
      // Packets travelling the lane between drawn nodes (both ways on the bridge).
      float x0 = uMotion.x;
      float x1 = uMotion.y;
      float ly = uMotion.z;
      float lane = exp(-pow((uv.y - ly) * 90.0, 2.0)) * step(x0, uv.x) * step(uv.x, x1);
      float u = (uv.x - x0) / max(x1 - x0, 0.001);
      float fwd = exp(-pow((fract(t * 0.32 + uSeed) - u) * 18.0, 2.0));
      float back = kind == 0 ? exp(-pow((fract(-t * 0.27 + uSeed * 1.7) - u) * 18.0, 2.0)) : 0.0;
      accent += lane * (fwd + back) * 1.4;
    } else if (kind == 2) {
      // Index scan: one row at a time lifts to highlight.
      float row = mod(floor(t * 0.55 + uSeed), uMotion.z);
      float cy = uMotion.x - row * uMotion.y;
      float band = 1.0 - smoothstep(uMotion.y * 0.38, uMotion.y * 0.5, abs(uv.y - cy));
      accent += content * band * 0.9;
      content *= 1.0 - band * 0.35;
    } else {
      // Callout: a slow glint sweeps across the type.
      float sweep = fract(t * 0.11 + uSeed * 0.37) * 1.6 - 0.3;
      accent += (content + accent) * exp(-pow((uv.x - sweep) * 9.0, 2.0)) * 0.6;
    }

    float flicker = mix(0.45 + 0.55 * step(0.3, hash11(floor(t * 26.0) + uSeed)), 1.0, smoothstep(0.75, 1.0, A));
    float shell = (frame * 0.8 + bracket * 1.5 + fill + scan) * openMask;
    float body = content * 0.95 * contentMask * openMask;
    float hi = (accent * contentMask + leading * 0.7 * inside) * openMask;
    vec3 col = uColor * (shell + body) + uAccent * hi;
    float k = uOpacity * flicker * step(0.0005, A);
    // Glass: premultiplied output darkens what sits behind, so type stays legible over the rings.
    float glass = inside * openMask * uGlass * smoothstep(0.2, 0.7, A);
    gl_FragColor = vec4(col * k, glass * uOpacity);
  }
`;

/** Emitter floor beneath the core: concentric scales, spokes and rotating arcs. */
export const floorFragment = /* glsl */ `
  precision highp float;
  ${common}
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying vec3 vPos;

  void main() {
    vec2 p = vPos.xy;
    float r = length(p);
    float a = atan(p.y, p.x) / TAU + 0.5;
    float R = 3.0 * uReveal;
    float m = 1.0 - smoothstep(R - 0.05, R, r);
    float v = 0.0;
    v += aline(r - 0.6, 0.006) + aline(r - 1.25, 0.004) * 0.8 + aline(r - 1.9, 0.005) + aline(r - 2.7, 0.003) * 0.6;
    v += step(fract(a * 120.0), 0.18) * step(1.9, r) * step(r, 2.02) * 0.7;
    v += step(fract(a * 24.0), 0.04) * step(0.65, r) * step(r, 1.85) * 0.18;
    float arcs = step(0.6, fract(a * 3.0 + uTime * 0.05)) * aline(r - 1.55, 0.02);
    float arcs2 = step(0.75, fract(a * 5.0 - uTime * 0.035)) * aline(r - 2.35, 0.012);
    float glow = exp(-r * r * 2.2) * 0.55;
    float fade = 1.0 - smoothstep(2.2, 3.0, r) * 0.6;
    vec3 col = uColor * (v * 0.75 + glow) * fade + uAccent * (arcs * 0.8 + arcs2 * 0.6);
    gl_FragColor = vec4(col * m * uIntensity, 1.0);
  }
`;

/** Faint spatial grid: gives the workspace a floor and real depth. */
export const gridFragment = /* glsl */ `
  precision highp float;
  ${common}
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec3 vWorld;

  void main() {
    vec2 p = vWorld.xz;
    float minor = max(gline(p.x, 1.0, 0.004), gline(p.y, 1.0, 0.004));
    float major = max(gline(p.x, 0.2, 0.012), gline(p.y, 0.2, 0.012));
    float fade = exp(-length(p - vec2(0.0, -2.0)) * 0.085);
    float v = (minor * 0.35 + major * 0.7) * fade;
    gl_FragColor = vec4(uColor * v * uIntensity, 1.0);
  }
`;

/** Soft projection cone between emitter and core. */
export const coneFragment = /* glsl */ `
  precision highp float;
  uniform float uIntensity;
  uniform vec3 uColor;
  varying vec2 vUv;
  varying vec3 vN;
  varying vec3 vV;

  void main() {
    float facing = abs(dot(normalize(vN), normalize(vV)));
    float body = pow(facing, 1.6);
    float vertical = smoothstep(1.0, 0.0, vUv.y) * smoothstep(0.0, 0.25, vUv.y + 0.02);
    gl_FragColor = vec4(uColor * body * vertical * uIntensity, 1.0);
  }
`;

/** Data lines (network edges, leader lines): draw-on reveal and travelling pulses. */
export const dataLineVertex = /* glsl */ `
  attribute float aT;
  attribute float aDelay;
  attribute float aPhase;
  varying float vT;
  varying float vDelay;
  varying float vPhase;
  void main() {
    vT = aT;
    vDelay = aDelay;
    vPhase = aPhase;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const dataLineFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  uniform float uPulse;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying float vT;
  varying float vDelay;
  varying float vPhase;

  void main() {
    float local = clamp((uReveal - vDelay) / 0.22, 0.0, 1.0);
    if (vT > local) discard;
    float head = exp(-pow((vT - local) * 18.0, 2.0)) * step(local, 0.999);
    float pulse = pow(max(0.0, 1.0 - abs(fract(vT - uTime * 0.35 + vPhase) - 0.5) * 2.0), 14.0) * uPulse;
    vec3 col = uColor * 0.55 + uAccent * (pulse + head);
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/** Network nodes as round sprites. */
export const nodeVertex = /* glsl */ `
  attribute float aDelay;
  attribute float aSize;
  uniform float uScale;
  varying float vDelay;
  void main() {
    vDelay = aDelay;
    vec4 mv = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = aSize * uScale / max(0.1, -mv.z);
    gl_Position = projectionMatrix * mv;
  }
`;

export const nodeFragment = /* glsl */ `
  precision highp float;
  uniform float uReveal;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec3 uColor;
  varying float vDelay;
  void main() {
    float on = smoothstep(vDelay, vDelay + 0.12, uReveal);
    vec2 c = gl_PointCoord - 0.5;
    float d = length(c);
    float core = 1.0 - smoothstep(0.12, 0.2, d);
    float ring = (1.0 - smoothstep(0.02, 0.05, abs(d - 0.38))) * 0.6;
    float tw = 0.75 + 0.25 * sin(uTime * 2.0 + vDelay * 40.0);
    gl_FragColor = vec4(uColor * (core + ring) * on * tw * uIntensity, 1.0);
  }
`;
