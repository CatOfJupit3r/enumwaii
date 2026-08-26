import { execFileSync } from "node:child_process";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

interface CompilerMetrics {
  readonly files: number;
  readonly types: number;
  readonly instantiations: number;
  readonly checkSeconds: number;
  readonly totalSeconds: number;
}

const require = createRequire(import.meta.url);
const tscPath = require.resolve("typescript/lib/tsc.js");
const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const repositoryRoot = path.resolve(packageRoot, "../..");

function metric(output: string, name: string): number {
  const match = new RegExp(`^${name}:\\s+([0-9.]+)`, "mu").exec(output)?.[1];
  if (!match)
    throw new Error(`Missing ${name} in TypeScript diagnostics:\n${output}`);
  return Number(match);
}

function runCompiler(configPath: string): CompilerMetrics {
  const output = execFileSync(
    process.execPath,
    [tscPath, "-p", configPath, "--extendedDiagnostics", "--pretty", "false"],
    {
      cwd: repositoryRoot,
      encoding: "utf8",
      env: process.env,
    },
  );

  return {
    files: metric(output, "Files"),
    types: metric(output, "Types"),
    instantiations: metric(output, "Instantiations"),
    checkSeconds: metric(output, "Check time"),
    totalSeconds: metric(output, "Total time"),
  };
}

describe("brandless representation performance", () => {
  it("measures TypeScript 6 representation costs", () => {
    const experimentRoot = path.join(
      repositoryRoot,
      "experiments/brandless-research/perf",
    );
    const measurements = {
      stressMatrix: runCompiler(
        path.join(
          repositoryRoot,
          "experiments/brandless-research/tsconfig.json",
        ),
      ),
      currentProductionBenchmark: runCompiler(
        path.join(repositoryRoot, "packages/enumwaii/bench/tsconfig.json"),
      ),
      requiredBrandDeclarations: runCompiler(
        path.join(experimentRoot, "tsconfig.branded.json"),
      ),
      brandlessDeclarations: runCompiler(
        path.join(experimentRoot, "tsconfig.brandless.json"),
      ),
      generatedNativeCarrierDeclarations: runCompiler(
        path.join(experimentRoot, "tsconfig.native-carrier.json"),
      ),
      nativeStringEnumDeclarations: runCompiler(
        path.join(experimentRoot, "tsconfig.native-enum.json"),
      ),
    };

    console.info(`BRANDLESS_TS_PERF ${JSON.stringify(measurements)}`);
    expect(measurements.brandlessDeclarations.instantiations).toBeLessThan(
      measurements.requiredBrandDeclarations.instantiations,
    );
    expect(
      measurements.nativeStringEnumDeclarations.instantiations,
    ).toBeGreaterThan(0);
  }, 60_000);
});
