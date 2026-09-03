import { spawnSync } from "node:child_process";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { format, getFileInfo, resolveConfig } from "prettier";

import { dependencyVersionViolations } from "./dependency-pin-policy.mjs";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));
const manifestPattern = /(?:^|\/)package\.json$/;

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

function readStagedFile(file) {
  const result = spawnSync("git", ["show", `:${file}`], {
    cwd: workspaceRoot,
    encoding: "utf8",
  });

  if (result.error !== undefined) {
    throw result.error;
  }

  if (result.status !== 0) {
    process.stderr.write(result.stderr);
    process.exit(result.status ?? 1);
  }

  return result.stdout;
}

const staged = spawnSync(
  "git",
  ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"],
  {
    cwd: workspaceRoot,
    encoding: "utf8",
  },
);

if (staged.error !== undefined) {
  throw staged.error;
}

if (staged.status !== 0) {
  process.stderr.write(staged.stderr);
  process.exit(staged.status ?? 1);
}

const files = staged.stdout.split("\0").filter(Boolean);

if (files.length === 0) {
  console.log("No staged files to check.");
  process.exit(0);
}

run("git", ["diff", "--cached", "--check"]);

const unformatted = [];

for (const file of files) {
  const absolutePath = join(workspaceRoot, file);
  const fileInfo = await getFileInfo(absolutePath, {
    ignorePath: [
      join(workspaceRoot, ".gitignore"),
      join(workspaceRoot, ".prettierignore"),
    ],
  });

  if (fileInfo.ignored || fileInfo.inferredParser === null) {
    continue;
  }

  const source = readStagedFile(file);
  const config = (await resolveConfig(absolutePath)) ?? {};
  const formatted = await format(source, { ...config, filepath: absolutePath });

  if (formatted !== source) {
    unformatted.push(file);
  }
}

if (unformatted.length > 0) {
  console.error("Prettier found staged files that need formatting:");

  for (const file of unformatted) {
    console.error(`- ${file}`);
  }

  console.error("Run `pnpm format`, then stage the formatted files.");
  process.exit(1);
}

const stagedManifests = files.filter((file) => manifestPattern.test(file));
const pinViolations = stagedManifests.flatMap((file) =>
  dependencyVersionViolations(JSON.parse(readStagedFile(file)), file),
);

if (pinViolations.length > 0) {
  console.error("Dependency version policy violations:");

  for (const violation of pinViolations) {
    console.error(
      `- ${violation.path}: ${violation.section}.${violation.name} = ${JSON.stringify(violation.specifier)}; expected ${violation.expected}`,
    );
  }

  process.exit(1);
}

if (files.includes("pnpm-workspace.yaml")) {
  await import("./check-dependency-pins.mjs");

  if (process.exitCode !== undefined && process.exitCode !== 0) {
    process.exit(process.exitCode);
  }
}

console.log(
  `Checked ${files.length} staged file${files.length === 1 ? "" : "s"}.`,
);
