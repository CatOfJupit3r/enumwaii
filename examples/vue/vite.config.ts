import vue from "@vitejs/plugin-vue";
import { defineConfig } from "vitest/config";

const disableWebStorageFlag = process.allowedNodeEnvironmentFlags.has(
  "--no-experimental-webstorage",
)
  ? "--no-experimental-webstorage"
  : process.allowedNodeEnvironmentFlags.has("--no-webstorage")
    ? "--no-webstorage"
    : undefined;
// Node's process-level Web Storage shadows jsdom's implementation in workers.
const testExecArgv =
  disableWebStorageFlag === undefined ? [] : [disableWebStorageFlag];

export default defineConfig({
  plugins: [vue()],
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.ts"],
    clearMocks: true,
    execArgv: testExecArgv,
  },
});
