import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Registry-installed component code (shadcn/Animate UI CLI) - vendored,
    // not hand-maintained, so upstream lint nits aren't ours to fix here.
    "src/components/animate-ui/**",
    "src/hooks/use-is-in-view.tsx",
  ]),
]);

export default eslintConfig;
