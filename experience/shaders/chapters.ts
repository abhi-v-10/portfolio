/**
 * Milestone 003 world shaders: the Curiosity contour landscape and the
 * Engineering module material. Additive light for Curiosity (exploratory,
 * atmospheric); solid, edge-lit volumes for Engineering (constructed).
 */

const noise2 = /* glsl */ `
  float h21(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
  float vnoise(vec2 x) {
    vec2 i = floor(x); vec2 f = fract(x); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(h21(i), h21(i + vec2(1, 0)), f.x), mix(h21(i + vec2(0, 1)), h21(i + vec2(1, 1)), f.x), f.y);
  }
  float fbm2(vec2 p) { float v = 0.0; float a = 0.5; for (int i = 0; i < 4; i++) { v += a * vnoise(p); p = p * 2.07 + 13.1; a *= 0.5; } return v; }
`;

export const terrainVertex = /* glsl */ `
  ${noise2}
  uniform vec2 uOrigin;
  varying float vH;
  varying vec3 vWorld;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vec2 q = (w.xz - uOrigin) * 0.105;
    float h = fbm2(q + 3.7) * 3.4 - 1.25;
    // A shallow valley along the flight path keeps the hills out of the lens.
    float lane = exp(-pow((w.x - uOrigin.x + 0.4) * 0.22, 2.0));
    h -= lane * 1.1;
    w.y += h;
    vH = h;
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const terrainFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uReveal;
  uniform float uIntensity;
  uniform vec2 uOrigin;
  uniform vec3 uLow;
  uniform vec3 uHigh;
  uniform vec3 uPing;
  varying float vH;
  varying vec3 vWorld;

  float cline(float v, float w) { float f = fract(v); float d = min(f, 1.0 - f); return 1.0 - smoothstep(w, w + fwidth(v) * 1.4, d); }

  void main() {
    float c = vH * 2.4;
    float minor = cline(c, 0.0);
    float major = cline(c / 5.0, 0.0) ;
    float dist = length(vWorld.xz - uOrigin);
    // Exploration ping: a contour ring that keeps travelling out from the split.
    float ring = mod(uTime * 2.6, 34.0);
    float ping = exp(-pow((dist - ring) * 0.7, 2.0));
    float reach = uReveal * 36.0;
    float found = 1.0 - smoothstep(reach - 5.0, reach, dist);
    float fade = 1.0 - smoothstep(12.0, 30.0, dist);
    float hN = clamp(vH * 0.35 + 0.45, 0.0, 1.0);
    vec3 col = mix(uLow, uHigh, hN) * (minor * 0.55 + major * 0.5);
    col += uPing * (minor + major) * ping * 1.2;
    // Dimensional edge (Doctor Strange nod, original form): the ring's leading
    // edge burns amber with travelling glints, then cools back to violet.
    float lead = exp(-pow((dist - ring - 0.9) * 1.5, 2.0));
    float ang = atan(vWorld.z - uOrigin.y, vWorld.x - uOrigin.x);
    float glint = pow(0.5 + 0.5 * sin(ang * 96.0 + uTime * 5.0 + dist * 1.3), 14.0);
    col += vec3(1.0, 0.56, 0.2) * (minor + major + 0.18) * lead * (0.3 + glint * 1.6) * 0.85;
    gl_FragColor = vec4(col * found * fade * uIntensity, 1.0);
  }
`;

export const moduleVertex = /* glsl */ `
  attribute float aGlow;
  attribute float aShape;
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vWorld;
  varying float vGlow;
  varying float vShape;
  const float PI = 3.14159265;
  // Unit square → unit disc (area-preserving enough for a smooth rim).
  vec2 toDisc(vec2 p) {
    return vec2(p.x * sqrt(max(0.0, 1.0 - p.y * p.y * 0.5)), p.y * sqrt(max(0.0, 1.0 - p.x * p.x * 0.5)));
  }
  void main() {
    vLocal = position;
    vGlow = aGlow;
    vShape = aShape;
    vec3 pos = position;
    vec3 nrm = normal;
    if (aShape < 2.5) {
      vec2 q = toDisc(position.xz * 2.0);
      float ang = atan(q.y, q.x);
      if (aShape > 1.5) {
        // Hexagonal prism: pull the disc onto a hexagon with flat sides.
        float seg = PI / 3.0;
        float a = mod(ang + seg * 0.5, seg) - seg * 0.5;
        q *= cos(seg * 0.5) / cos(a);
        float faceAng = ang - a;
        if (abs(normal.y) < 0.5) nrm = vec3(cos(faceAng), 0.0, sin(faceAng));
      } else if (abs(normal.y) < 0.5) {
        nrm = vec3(cos(ang), 0.0, sin(ang));
      }
      pos.xz = q * 0.5;
    }
    vec4 p = vec4(pos, 1.0);
    mat3 nm = mat3(modelMatrix);
    #ifdef USE_INSTANCING
      p = instanceMatrix * p;
      nm = nm * mat3(instanceMatrix);
    #endif
    vN = normalize(nm * nrm);
    vec4 w = modelMatrix * p;
    vWorld = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

export const moduleFragment = /* glsl */ `
  precision highp float;
  uniform float uOpacity;
  uniform float uTime;
  uniform vec3 uFace;
  uniform vec3 uEdge;
  uniform vec3 uFogColor;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vLocal;
  varying vec3 vN;
  varying vec3 vWorld;
  varying float vGlow;
  varying float vShape;

  void main() {
    // Machined modules in the chapter's own colour (corrective pass): cobalt
    // satin under a warm key and cool fill, a tight specular, a cyan fresnel
    // and a thin catch-light on rims only (no box outlines). The accent edge
    // marks active modules.
    vec3 a = abs(vLocal) * 2.0;
    vec3 fw = max(fwidth(vLocal) * 2.0, vec3(1e-4));
    vec3 e = smoothstep(1.0 - fw * 2.2, 1.0 - fw * 0.4, a);
    float side = max(e.x, e.z);
    // Rims: where a cap meets the wall. Slabs (shape 3) keep their box edges.
    float edge = vShape > 2.5 ? max(max(e.x * e.y, e.y * e.z), e.x * e.z) : e.y * side;
    vec3 n = normalize(vN);
    vec3 v = normalize(cameraPosition - vWorld);
    vec3 key = normalize(vec3(0.45, 0.9, 0.55));
    vec3 fill = normalize(vec3(-0.7, 0.25, 0.4));
    float dk = max(dot(n, key), 0.0);
    float df = max(dot(n, fill), 0.0);
    vec3 h = normalize(key + v);
    float spec = pow(max(dot(n, h), 0.0), 40.0);
    float rim = pow(1.0 - max(dot(n, v), 0.0), 3.0);
    float top = smoothstep(0.6, 0.9, n.y);
    vec3 col = uFace * (0.45 + 1.1 * dk) + vec3(0.45, 0.35, 0.95) * uFace * df * 1.2;
    col += vec3(1.0, 0.95, 0.88) * spec * 0.28 + uFace * top * 0.35;
    col += uEdge * rim * 0.22;
    col += mix(vec3(0.75, 0.85, 1.0), uEdge, 0.5) * edge * (0.25 + 0.3 * dk);
    col += uEdge * edge * vGlow * 1.6 + uEdge * vGlow * 0.1;
    float fog = smoothstep(uFogNear, uFogFar, distance(cameraPosition, vWorld));
    col = mix(col, uFogColor, fog);
    gl_FragColor = vec4(col, uOpacity);
  }
`;

/** Billboard label: R channel of a canvas texture, additive. */
export const labelVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const labelFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uText;
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec2 vUv;
  void main() {
    float ink = texture2D(uText, vUv).r;
    gl_FragColor = vec4(uColor * ink * uIntensity, 1.0);
  }
`;

/** Engineering floor: a precise major/minor grid centred on the structure, with a slow scan line. */
export const floorGridFragment = /* glsl */ `
  precision highp float;
  uniform float uIntensity;
  uniform float uTime;
  uniform vec3 uCentre;
  uniform vec3 uColor;
  uniform vec3 uAccent;
  varying vec3 vWorld;
  float gl1(float x, float n, float w) { float f = fract(x * n); float d = min(f, 1.0 - f) / n; return 1.0 - smoothstep(w, w + fwidth(x) * 1.5, d); }
  void main() {
    // A quiet surveyed floor: sparse major lines that die off fast, and a soft
    // pool of light where the structure stands. No scanning sweep.
    vec2 p = vWorld.xz - uCentre.xz;
    float major = max(gl1(p.x, 0.25, 0.012), gl1(p.y, 0.25, 0.012));
    float r = length(p);
    float fade = exp(-r * 0.13);
    float pool = exp(-r * r * 0.012);
    vec3 col = uColor * major * fade * 0.38 + uAccent * pool * 0.05;
    gl_FragColor = vec4(col * uIntensity, 1.0);
  }
`;

/**
 * Gallery frame: photo (or placeholder) inside a rounded glass frame with a
 * cyan→violet edge light. Premultiplied output: alpha darkens behind the
 * glass, colour without alpha adds light (edge glow).
 */
export const frameVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const frameFragment = /* glsl */ `
  precision highp float;
  uniform sampler2D uMap;
  uniform vec2 uSize;     // plane size (world), photo + margin
  uniform vec2 uPhoto;    // photo half size (world)
  uniform vec2 uCrop;     // uv scale for cover fit
  uniform float uFocus;   // 1 active → 0 far
  uniform float uVis;     // overall visibility
  uniform float uReveal;  // holographic assembly 0..1
  uniform float uTime;
  uniform vec3 uEdgeA;
  uniform vec3 uEdgeB;
  varying vec2 vUv;

  float sdRound(vec2 p, vec2 b, float r) { vec2 q = abs(p) - b + r; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r; }
  float h1(float x) { return fract(sin(x * 91.7) * 43758.5453); }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    float d = sdRound(p, uPhoto, 0.06);
    float aa = fwidth(d) * 1.2;
    float inside = 1.0 - smoothstep(-aa, aa, d);
    float f = uFocus;

    // Photo uv (cover-cropped), revealed bottom-up in holographic scan bands.
    vec2 puv = (p / (uPhoto * 2.0)) * uCrop + 0.5;
    vec3 photo = texture2D(uMap, puv).rgb;
    float band = floor(puv.y * 48.0);
    float scan = step(h1(band + floor(uTime * 14.0)) * 0.25 + puv.y * 0.75, uReveal * 1.08);
    float lead = exp(-pow((puv.y - uReveal * 1.08 + 0.02) * 40.0, 2.0)) * step(uReveal, 0.999);

    // Depth: far frames are cooler, dimmer and more glass than picture.
    float lum = dot(photo, vec3(0.299, 0.587, 0.114));
    vec3 cool = mix(vec3(lum), photo, 0.5) * vec3(0.76, 0.85, 1.06);
    vec3 img = mix(cool * 0.4, photo, f);
    // Projection texture: fine scanlines, stronger on the secondary layers.
    float lines = 0.5 + 0.5 * sin(puv.y * 340.0 - uTime * 5.0);
    img *= 1.0 - lines * mix(0.12, 0.035, f);
    // Glass: a slow diagonal sheen and a cool top light.
    float sheen = smoothstep(0.0, 0.1, 0.05 - abs(fract((vUv.x + vUv.y) * 0.5 - uTime * 0.025) - 0.5)) * 0.06;
    img += vec3(sheen) + vec3(0.05, 0.07, 0.11) * smoothstep(0.35, 1.0, puv.y) * 0.6;

    // Edge light: cyan → violet around the perimeter, brightest at the corners.
    float t = clamp(p.x / (uPhoto.x * 2.0) + 0.5 + p.y * 0.1, 0.0, 1.0);
    vec3 edgeCol = mix(uEdgeA, uEdgeB, t);
    vec2 q = abs(p) / uPhoto;
    float cornerBoost = smoothstep(0.75, 1.0, min(q.x, q.y));
    float edge = 1.0 - smoothstep(0.0, 0.01 + aa, abs(d));
    // Soft bloom around the active frame only.
    float bloom = exp(-max(d, 0.0) * 9.0) * (1.0 - inside) * 0.42 * f * f * (1.0 - smoothstep(0.16, 0.3, d));

    // Thin UI brackets outside the frame, on the active frame.
    vec2 b = abs(p) - (uPhoto + 0.11);
    float arm = 0.2;
    float onH = step(abs(b.y), 0.006 + aa) * step(-arm, b.x) * step(b.x, 0.0);
    float onV = step(abs(b.x), 0.006 + aa) * step(-arm, b.y) * step(b.y, 0.0);
    float bracket = max(onH, onV) * f;

    float photoA = inside * scan * mix(0.5, 0.97, f);
    vec3 col = img * photoA;
    float reveal = smoothstep(0.0, 0.3, uReveal);
    col += edgeCol * edge * (0.45 + 0.8 * f + cornerBoost * 0.5 * f) * reveal;
    col += edgeCol * bloom * uReveal;
    col += mix(uEdgeA, vec3(1.0), 0.35) * bracket * 0.85 * reveal;
    col += edgeCol * lead * inside * 0.9;
    gl_FragColor = vec4(col * uVis, photoA * uVis);
  }
`;
