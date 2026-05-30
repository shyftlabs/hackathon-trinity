import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  {
    settings: {
      next: {
        rootDir: "frontend",
      },
    },
  },
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "frontend/.next/**",
    "out/**",
    "frontend/out/**",
    "build/**",
    "frontend/build/**",
    "next-env.d.ts",
    "frontend/next-env.d.ts",
    "backend/continuum/**",
  ]),
]);

export default eslintConfig;
