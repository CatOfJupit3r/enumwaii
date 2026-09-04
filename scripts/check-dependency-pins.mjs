import { glob, readFile } from "node:fs/promises";
import { isAbsolute, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { dependencyVersionViolations } from "./dependency-pin-policy.mjs";

const workspaceRoot = fileURLToPath(new URL("../", import.meta.url));

function parseYamlScalar(value) {
  if (value.startsWith('"')) {
    return JSON.parse(value);
  }

  if (value.startsWith("'")) {
    if (!value.endsWith("'")) {
      throw new Error(`Invalid quoted workspace pattern: ${value}`);
    }

    return value.slice(1, -1).replaceAll("''", "'");
  }

  const commentIndex = value.search(/\s+#/);
  return commentIndex === -1 ? value : value.slice(0, commentIndex).trimEnd();
}

function workspacePatterns(source) {
  const patterns = [];
  let insidePackages = false;

  for (const line of source.split(/\r?\n/)) {
    if (!insidePackages) {
      insidePackages = line.trim() === "packages:";
      continue;
    }

    const match = /^\s+-\s+(.+?)\s*$/.exec(line);
    if (match?.[1] !== undefined) {
      const pattern = parseYamlScalar(match[1]);

      if (
        pattern.length === 0 ||
        pattern.startsWith("!") ||
        isAbsolute(pattern) ||
        pattern.split(/[\\/]/).includes("..")
      ) {
        throw new Error(`Unsupported workspace pattern: ${pattern}`);
      }

      patterns.push(pattern);
      continue;
    }

    if (line.trim() === "" || /^\s+#/.test(line)) {
      continue;
    }

    if (!/^\s/.test(line)) {
      break;
    }

    throw new Error(`Unsupported packages entry: ${line.trim()}`);
  }

  if (patterns.length === 0) {
    throw new Error("pnpm-workspace.yaml must define at least one package.");
  }

  return patterns;
}

async function manifestPaths() {
  const workspaceConfig = await readFile(
    join(workspaceRoot, "pnpm-workspace.yaml"),
    "utf8",
  );
  const paths = new Set([join(workspaceRoot, "package.json")]);

  for (const pattern of workspacePatterns(workspaceConfig)) {
    const manifestPattern = `${pattern.replace(/\/$/, "")}/package.json`;

    for await (const path of glob(manifestPattern, { cwd: workspaceRoot })) {
      paths.add(resolve(workspaceRoot, path));
    }
  }

  for await (const path of glob("examples/*/package.json", {
    cwd: workspaceRoot,
  })) {
    paths.add(resolve(workspaceRoot, path));
  }

  return [...paths].sort((left, right) => left.localeCompare(right));
}

async function readManifest(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

const paths = await manifestPaths();
const violations = [];

for (const path of paths) {
  const manifest = await readManifest(path);
  violations.push(...dependencyVersionViolations(manifest, path));
}

if (violations.length > 0) {
  console.error("Dependency version policy violations:");

  for (const violation of violations) {
    const path = relative(workspaceRoot, violation.path);
    console.error(
      `- ${path}: ${violation.section}.${violation.name} = ${JSON.stringify(violation.specifier)}; expected ${violation.expected}`,
    );
  }

  process.exitCode = 1;
} else {
  console.log(
    `Dependency version policy valid in ${paths.length} repository manifests.`,
  );
}
