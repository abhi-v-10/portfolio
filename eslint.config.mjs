import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

export default defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    // React Three Fiber idiom: three.js objects and uniforms are mutated inside
    // useFrame, outside React's render cycle. The React Compiler immutability
    // rule cannot model that, so it is relaxed for the WebGL world only.
    files: ["experience/world/**/*.tsx", "experience/chapters/**/*.tsx"],
    rules: { "react-hooks/immutability": "off" },
  },
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);
