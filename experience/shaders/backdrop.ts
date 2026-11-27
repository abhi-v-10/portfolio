/**
 * Dimensional backdrop: a domain-warped colour field on the inside of a sphere.
 * Colours are authored in display (sRGB) space and written directly, so the
 * palette tokens land on screen as designed.
 */
export const backdropVertex = /* glsl */ `
  varying vec3 vDir;
  void main() {
    vDir = normalize(position);
    vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    gl_Position = vec4(p.xy, p.w * 0.9999, p.w); // pin just inside the far plane
  }
`;

export const backdropFragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uIntro;
  uniform vec3 uGround;
  uniform vec3 uZenith;
  uniform vec3 uGlow;
  uniform float uDay;
  uniform float uEng;
  uniform float uDawn;
  uniform float uFinale;
  varying vec3 vDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + 0.1);
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i + vec3(0,0,0)), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
  }
  float fbm(vec3 p) {
    float v = 0.0;
    float a = 0.5;
    for (int i = 0; i < 5; i++) {
      v += a * noise(p);
      p = p * 2.03 + vec3(1.7, 9.2, 3.1);
      a *= 0.5;
    }
    return v;
  }

  void main() {
    vec3 d = normalize(vDir);
    float t = uTime * 0.018;
    vec3 q = d * 1.9;
    float w = fbm(q + vec3(t, -t * 0.6, t * 0.4));
    float n = fbm(q * 1.7 + w * 2.1 + vec3(-t * 0.5, t, 0.0));

    // Chapter palette (2026-11-27): one stable ground per chapter, from
    // experience/director/palette.ts. The sky is the ground at eye level,
    // deepening (or, by day, lifting) toward the zenith and the floor, with
    // the chapter's glow held low on the horizon. Texture stays a whisper
    // (a few percent) so a settled chapter reads as one colour, not a gradient.
    float horizon = exp(-pow((d.y + 0.05) * 3.2, 2.0));
    float up = smoothstep(0.0, 0.85, abs(d.y));
    vec3 col = mix(uGround, uZenith, up * 0.75);
    col = mix(col, uGlow, horizon * smoothstep(0.35, 0.85, w) * mix(0.35, 0.28, uDay));
    // Moving air: lighter by night, a faint shade by day.
    float wisp = smoothstep(0.55, 0.95, n * 0.6 + w * 0.6);
    col += (uGlow - uGround) * wisp * 0.12;

    // Engineering by daylight: faint survey lines, the sky itself measured.
    float elev = asin(clamp(d.y, -1.0, 1.0));
    float survey = 1.0 - smoothstep(0.0, 0.004, abs(fract(elev * 9.0) - 0.5) - 0.497);
    col = mix(col, vec3(0.184, 0.294, 0.478), survey * 0.12 * uEng * (1.0 - abs(d.y)));

    // Closing dawn: the light ground warms into an apricot horizon with a crisp
    // light line just above it.
    float band = exp(-pow((d.y - 0.06) * 4.5, 2.0));
    col = mix(col, vec3(0.914, 0.635, 0.494), band * 0.55 * uDawn);
    col += vec3(1.0, 0.93, 0.84) * exp(-pow((d.y - 0.08) * 16.0, 2.0)) * 0.08 * uDawn;

    col *= 1.0 - 0.88 * uFinale;

    // Intro: the world starts in the loader's darkness and blooms open.
    col = mix(vec3(0.059, 0.055, 0.047), col, smoothstep(0.0, 0.85, uIntro));

    // Gentle dithering against banding.
    col += (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;
    gl_FragColor = vec4(col, 1.0);
  }
`;
