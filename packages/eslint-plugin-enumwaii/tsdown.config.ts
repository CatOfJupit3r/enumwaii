import { defineConfig } from "tsdown";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  deps: { neverBundle: ["@typescript-eslint/utils", "typescript"] },
  outputOptions: { exports: "named" },
});
