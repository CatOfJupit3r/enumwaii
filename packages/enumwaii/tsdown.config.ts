import { defineConfig } from "tsdown";

export default defineConfig({
  entry: [
    "src/index.ts",
    "src/adapters/zod.ts",
    "src/adapters/valibot.ts",
    "src/derive-with/index.ts",
  ],
  format: ["esm", "cjs"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "node18",
  deps: { neverBundle: ["zod", "valibot"] },
});
