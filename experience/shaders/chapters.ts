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
    col += vec3(0.971, 0.578, 0.282) * (minor + major + 0.18) * lead * (0.3 + glint * 1.6) * 0.85;
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
    vec3 col = uFace * (0.45 + 1.1 * dk) + vec3(0.626, 0.418, 0.338) * uFace * df * 1.2;
    col += vec3(0.974, 0.953, 0.936) * spec * 0.28 + uFace * top * 0.35;
    col += uEdge * rim * 0.22;
    col += mix(vec3(0.862, 0.839, 0.806), uEdge, 0.5) * edge * (0.25 + 0.3 * dk);
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
  // Physical editorial print (2026-11-25): a photograph mounted on warm
  // matte paper with an even border, lit by the room, not projected. No
  // scanlines, edge light, bloom or corner brackets. The reveal is a clean
  // top-down wipe; far prints simply sit in shadow.
  precision highp float;
  uniform sampler2D uMap;
  uniform vec2 uSize;     // plane size (world), photo + margin
  uniform vec2 uPhoto;    // photo half size (world)
  uniform vec2 uCrop;     // uv scale for cover fit
  uniform float uFocus;   // 1 active → 0 far
  uniform float uVis;     // overall visibility
  uniform float uReveal;  // wipe 0..1
  uniform float uTime;
  uniform vec3 uEdgeA;    // paper tone
  uniform vec3 uEdgeB;    // unused (kept for the uniform contract)
  varying vec2 vUv;

  float sdBox(vec2 p, vec2 b) { vec2 q = abs(p) - b; return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0); }
  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }

  void main() {
    vec2 p = (vUv - 0.5) * uSize;
    vec2 paperHalf = uPhoto + vec2(0.12, 0.12);
    float dp = sdBox(p, paperHalf);
    float dph = sdBox(p, uPhoto);
    float aa = fwidth(dp) * 1.2;
    float onPaper = 1.0 - smoothstep(-aa, aa, dp);
    float onPhoto = 1.0 - smoothstep(-aa, aa, dph);
    float f = uFocus;

    vec2 puv = (p / (uPhoto * 2.0)) * uCrop + 0.5;
    vec3 photo = texture2D(uMap, puv).rgb;
    // A print, not a screen: slightly lifted blacks and a soft vignette.
    photo = mix(vec3(0.035), photo, 0.96);
    vec2 v = p / uPhoto;
    photo *= 1.0 - 0.12 * dot(v, v) * 0.5;

    // Matte paper: warm, with a faint fibre grain.
    vec3 paper = uEdgeA * (0.94 + 0.06 * hash(floor(p * 220.0)));
    // A fine bevel line where the photo meets the mount.
    float lip = 1.0 - smoothstep(0.0, 0.004 + aa, abs(dph));
    vec3 col = mix(paper, photo, onPhoto);
    col *= 1.0 - lip * 0.35;

    // Room light: a soft top-left key across the sheet; far prints fall into shadow.
    float key = 0.86 + 0.14 * (vUv.y * 0.7 + (1.0 - vUv.x) * 0.3);
    col *= key * mix(0.38, 1.0, f);

    // Reveal: a clean wipe from the top edge down.
    float wipe = 1.0 - smoothstep(uReveal * 1.1 - 0.06, uReveal * 1.1, 1.0 - vUv.y);
    float a = onPaper * wipe * uVis;
    gl_FragColor = vec4(col * a, a);
  }
`;
