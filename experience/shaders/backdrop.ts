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
  uniform float uScroll;
  uniform float uTrack;
  uniform float uHuman;
  uniform float uIntel;
  uniform float uExpr;
  uniform float uProj;
  uniform float uNexus;
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

    vec3 navy   = vec3(0.067, 0.082, 0.157);
    vec3 abyss  = vec3(0.020, 0.035, 0.075);
    vec3 violet = vec3(0.404, 0.314, 0.784);
    vec3 cobalt = vec3(0.204, 0.471, 0.965);
    vec3 cyan   = vec3(0.337, 0.863, 0.878);
    vec3 coral  = vec3(1.000, 0.667, 0.416);
    vec3 pink   = vec3(0.945, 0.494, 0.596);
    vec3 mist   = vec3(0.800, 0.780, 0.960);

    // Base: deep navy that lifts toward the horizon.
    float horizon = exp(-pow((d.y + 0.05) * 3.2, 2.0));
    vec3 col = mix(abyss, navy * 1.5, 0.5 + 0.5 * horizon);

    // Cosmic violet field, upper region, sculpted by noise.
    float vMask = smoothstep(0.3, 0.7, n) * smoothstep(-0.45, 0.5, d.y + 0.25 * d.x);
    col = mix(col, violet * 0.7, vMask * 0.5);

    // Cobalt current sweeping across.
    float cMask = smoothstep(0.48, 0.82, w) * (0.55 + 0.45 * smoothstep(0.4, -0.4, d.y));
    col = mix(col, cobalt * 0.62, cMask * 0.8);

    // Thin cyan wisps where both fields fold.
    float wisp = smoothstep(0.62, 0.92, n * 0.6 + w * 0.6);
    col += cyan * wisp * 0.3;

    // Small coral/pink warmth low on the horizon (right side).
    float warm = horizon * smoothstep(-0.3, 0.8, d.x) * smoothstep(0.35, 0.75, w);
    col += mix(violet, pink, n * 0.35) * warm * 0.22; // controlled violet highlight
    col += coral * warm * smoothstep(0.7, 0.9, n) * 0.05;

    // Meet the Human: warmer and softer than the hero. Lavender field, pale cyan
    // high light, a touch of peach low on the horizon.
    vec3 lavender = vec3(0.70, 0.62, 0.92);
    vec3 peach = vec3(1.0, 0.74, 0.62);
    vec3 human = mix(navy * 1.8, lavender * 0.42, smoothstep(0.25, 0.8, n));
    human += vec3(0.62, 0.86, 0.95) * wisp * 0.14;
    human += peach * horizon * smoothstep(-0.4, 0.6, -d.x) * smoothstep(0.3, 0.8, w) * 0.2;
    col = mix(col, human, uHuman * 0.82);

    // Curiosity: the world drifts into a violet / pale-mist dimension, hazier and lighter.
    float cur = smoothstep(0.15, 1.1, uTrack) * (1.0 - smoothstep(1.85, 2.45, uTrack));
    vec3 curiosity = mix(violet * 0.8, mist * 0.62, smoothstep(0.4, 0.85, n));
    curiosity += mist * horizon * 0.16;
    col = mix(col, curiosity, cur * 0.78);

    // Engineering: deep, clear blue with a cobalt horizon and faint survey lines:
    // the sky itself becomes measured.
    float eng = smoothstep(1.9, 2.6, uTrack);
    vec3 deep = mix(abyss * 1.4, cobalt * 0.22, horizon);
    deep += cobalt * 0.28 * smoothstep(0.55, 0.85, w) * (0.4 + 0.6 * horizon);
    float elev = asin(clamp(d.y, -1.0, 1.0));
    float survey = 1.0 - smoothstep(0.0, 0.004, abs(fract(elev * 9.0) - 0.5) - 0.497);
    deep += cyan * survey * 0.035 * (1.0 - abs(d.y));
    col = mix(col, deep, eng * 0.9);

    // Intelligence: indigo depth with luminous cyan and purple currents.
    vec3 intel = mix(abyss * 1.6, violet * 0.34, smoothstep(0.35, 0.8, n));
    intel += cyan * smoothstep(0.6, 0.9, w) * 0.16 + violet * wisp * 0.22;
    col = mix(col, intel, uIntel * 0.9);

    // Transition into Project Universe: warm, lighter and more fluid. Violet field, pink and coral
    // bands low on the horizon, a warm ivory haze, a little cyan.
    vec3 ivory = vec3(0.94, 0.85, 0.75);
    vec3 expr = mix(violet * 0.5, pink * 0.45, smoothstep(0.3, 0.85, n));
    expr = mix(expr, coral * 0.5, horizon * smoothstep(0.4, 0.8, w) * 0.7);
    expr += ivory * horizon * 0.12 + cyan * wisp * 0.12;
    col = mix(col, expr, uExpr * 0.85);

    // Project Universe: a dark exhibition hall so each artifact carries its own
    // light; a faint cool horizon and slow violet depth.
    vec3 hall = mix(abyss * 1.3, navy * 1.6, horizon);
    hall += violet * 0.16 * smoothstep(0.45, 0.85, n) + cobalt * 0.08 * smoothstep(0.6, 0.9, w);
    col = mix(col, hall, uProj * 0.92);

    // Timeline Nexus: deep jade night with emerald currents.
    vec3 jade = vec3(0.10, 0.62, 0.45);
    vec3 nexus = mix(vec3(0.015, 0.05, 0.045), jade * 0.22, smoothstep(0.35, 0.85, n));
    nexus += vec3(0.49, 0.96, 0.77) * wisp * 0.12 + jade * horizon * 0.08;
    col = mix(col, nexus, uNexus * 0.9);

    // Next Chapter (refined 2026-11-14): a dimensional dawn, not a white-out.
    // Deep indigo above, lavender air, a controlled gold-coral horizon band with
    // a crisp light line, warm haze below. The post-credits finale dims it all.
    vec3 lav = vec3(0.44, 0.38, 0.68);
    vec3 sky = mix(vec3(0.07, 0.06, 0.16), lav * 0.6, smoothstep(0.65, 0.02, d.y));
    vec3 band = mix(vec3(0.98, 0.76, 0.52), vec3(1.0, 0.58, 0.44), smoothstep(0.2, 0.9, w));
    sky = mix(sky, band * 0.72, exp(-pow((d.y - 0.06) * 5.0, 2.0)) * 0.7);
    sky += vec3(1.0, 0.86, 0.66) * exp(-pow((d.y - 0.07) * 16.0, 2.0)) * 0.16;
    sky = mix(sky, vec3(0.16, 0.11, 0.22), smoothstep(-0.02, -0.45, d.y));
    sky += lav * wisp * 0.05;
    col = mix(col, sky, uDawn * 0.92);
    col *= 1.0 - 0.88 * uFinale;

    // Intro: the world starts in the loader's darkness and blooms open.
    col = mix(vec3(0.012, 0.027, 0.055), col, smoothstep(0.0, 0.85, uIntro));

    // Gentle dithering against banding.
    col += (hash(vec3(gl_FragCoord.xy, uTime)) - 0.5) / 255.0;

    gl_FragColor = vec4(col, 1.0);
  }
`;
