import { cloudflareTest } from "@cloudflare/vitest-plugin";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [
    cloudflareTest({
      wrangler: { configPath: "./wrangler.jsonc" },
    }),
  ],
  test: {
    // The Workers pool cannot read Vitest's on-disk module cache, which is
    // enabled by default since Vitest 5.
    fsModuleCache: false,
    include: ["runtime-tests/cloudflare.test.ts"],
  },
});
