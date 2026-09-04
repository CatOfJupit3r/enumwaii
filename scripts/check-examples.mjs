import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const examples = [
  "effect",
  "elysia",
  "hono",
  "nestjs",
  "nextjs",
  "orpc",
  "tanstack-start-solid",
  "vue",
];

function run(args) {
  const command =
    process.platform === "win32" ? (process.env.ComSpec ?? "cmd.exe") : "pnpm";
  const commandArgs =
    process.platform === "win32" ? ["/d", "/s", "/c", "pnpm", ...args] : args;
  const result = spawnSync(command, commandArgs, {
    cwd: workspaceRoot,
    stdio: "inherit",
  });

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(["--filter", "enumwaii", "run", "build"]);

for (const example of examples) {
  const directory = `examples/${example}`;
  console.log(`\nChecking ${directory}...`);
  run(["--dir", directory, "install", "--no-frozen-lockfile"]);
  run(["--dir", directory, "run", "test"]);
  run(["--dir", directory, "run", "test:types"]);
  run(["--dir", directory, "run", "build"]);
}
