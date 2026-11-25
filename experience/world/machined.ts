import { Color, MeshPhysicalMaterial } from "three";
import { brushedGrain } from "./materials";

/**
 * Engineering modules as machined parts (2026-11-25). The same instanced unit
 * box is still reshaped per instance (disc tiers, drums, hexagonal services,
 * slabs) so the assembly and the Intelligence morph are unchanged, but now
 * through MeshPhysicalMaterial: real metal under the studio HDRI, a 4% chamfer
 * on every cap edge, and a finish per role:
 *  - plates (0): rectangular hard-anodised graphite trays, chamfered
 *  - cartridges (1): hard-anodised storage modules with machined fins
 *  - services (2): brushed titanium
 *  - clients (3): brushed aluminium
 * Active modules get a faint copper emissive edge, not a glow.
 */
export function machinedModuleMaterial() {
  const grain = brushedGrain();
  const m = new MeshPhysicalMaterial({
    color: new Color("#ffffff"),
    metalness: 1,
    roughness: 0.35,
    clearcoat: 0.2,
    clearcoatRoughness: 0.45,
    transparent: true,
    roughnessMap: grain ?? null,
  });
  const uGlowColor = { value: new Color("#c8794a") };
  m.onBeforeCompile = (shader) => {
    shader.uniforms.uGlowColor = uGlowColor;
    shader.vertexShader = shader.vertexShader
      .replace(
        "#include <common>",
        `#include <common>
        attribute float aGlow;
        attribute float aShape;
        varying float vGlow;
        varying float vShape;
        varying vec3 vBoxLocal;
        varying float vSide;
        vec2 toDisc(vec2 p) {
          return vec2(p.x * sqrt(max(0.0, 1.0 - p.y * p.y * 0.5)), p.y * sqrt(max(0.0, 1.0 - p.x * p.x * 0.5)));
        }`,
      )
      .replace(
        "#include <beginnormal_vertex>",
        `vec3 objectNormal = vec3( normal );
        vec3 shaped = position;
        vGlow = aGlow;
        vShape = aShape;
        vBoxLocal = position;
        vSide = abs(normal.y) < 0.5 ? 1.0 : 0.0;
        float chamfer = 1.0 - 0.06 * smoothstep(0.43, 0.5, abs(position.y));
        if (aShape > 1.5 && aShape < 2.5) {
          vec2 q = toDisc(position.xz * 2.0);
          float ang = atan(q.y, q.x);
          if (aShape > 1.5) {
            float seg = PI / 3.0;
            float a = mod(ang + seg * 0.5, seg) - seg * 0.5;
            q *= cos(seg * 0.5) / cos(a);
            ang = ang - a;
          }
          if (abs(normal.y) < 0.5) {
            float slope = smoothstep(0.43, 0.5, abs(position.y));
            objectNormal = normalize(vec3(cos(ang), sign(position.y) * slope * 0.9, sin(ang)));
          }
          shaped.xz = q * 0.5 * chamfer;
        } else {
          shaped.xz *= chamfer;
        }
        #ifdef USE_TANGENT
          vec3 objectTangent = vec3( tangent.xyz );
        #endif`,
      )
      .replace("#include <begin_vertex>", "vec3 transformed = shaped;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        `#include <common>
        uniform vec3 uGlowColor;
        varying float vGlow;
        varying float vShape;
        varying vec3 vBoxLocal;
        varying float vSide;
        // Cartridge fins: six machined grooves around the storage modules' walls.
        float fin() {
          if (vShape < 0.5 || vShape > 1.5 || vSide < 0.5) return 0.0;
          float y = vBoxLocal.y + 0.5;
          float g = fract(y * 7.0);
          return (1.0 - smoothstep(0.0, 0.08, g)) * step(0.12, y) * step(y, 0.88);
        }`,
      )
      .replace(
        "#include <color_fragment>",
        `#include <color_fragment>
        vec3 finish = vShape < 0.5 ? vec3(0.05, 0.046, 0.042) : vShape < 1.5 ? vec3(0.11, 0.105, 0.1) : vShape < 2.5 ? vec3(0.3, 0.287, 0.265) : vec3(0.38, 0.372, 0.357);
        diffuseColor.rgb *= finish * (1.0 - 0.55 * fin());`,
      )
      .replace(
        "#include <metalnessmap_fragment>",
        `#include <metalnessmap_fragment>
        metalnessFactor = vShape < 0.5 ? 0.25 : vShape < 1.5 ? 0.7 : 1.0;`,
      )
      .replace(
        "#include <roughnessmap_fragment>",
        `#include <roughnessmap_fragment>
        roughnessFactor = vShape < 0.5 ? 0.2 * roughnessFactor + 0.62 : vShape < 1.5 ? 0.45 + 0.3 * fin() : roughnessFactor * 0.6 + 0.3;`,
      )
      .replace(
        "#include <emissivemap_fragment>",
        `#include <emissivemap_fragment>
        totalEmissiveRadiance += uGlowColor * vGlow * 0.35;`,
      );
  };
  m.customProgramCacheKey = () => "machined-module-v4";
  return m;
}
