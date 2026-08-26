import tsParser from "@typescript-eslint/parser";
import { ESLint, type Linter } from "eslint";
import fs from "node:fs/promises";
import path from "node:path";
import { performance } from "node:perf_hooks";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import { brandlessResearchRule } from "./brandless-research-rule";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);
const fixtureRoot = path.join(
  packageRoot,
  "test/fixtures/brandless-research",
);

const plugin: ESLint.Plugin = {
  rules: {
    "brandless-research-provenance": brandlessResearchRule,
  },
};

function createEslint(enabled: boolean): ESLint {
  return new ESLint({
    cwd: packageRoot,
    overrideConfigFile: true,
    overrideConfig: {
      files: ["**/*.ts"],
      languageOptions: {
        parser: tsParser as unknown as Linter.Parser,
        parserOptions: {
          projectService: true,
          tsconfigRootDir: packageRoot,
        },
      },
      plugins: { research: plugin },
      rules: enabled
        ? { "research/brandless-research-provenance": "error" }
        : {},
    },
  });
}

async function expectedByLine(
  fixturePath: string,
): Promise<ReadonlyMap<number, string>> {
  const source = await fs.readFile(fixturePath, "utf8");
  return new Map(
    source
      .split("\n")
      .map((line, index) => {
        const marker = /expect:(raw|foreign|unowned|false-positive-raw)/u.exec(
          line,
        )?.[1];
        return marker ? ([index + 1, marker] as const) : undefined;
      })
      .filter(
        (entry): entry is readonly [number, string] => entry !== undefined,
      ),
  );
}

async function lintFixture(name: string): Promise<readonly Linter.LintMessage[]> {
  const fixturePath = path.join(fixtureRoot, name);
  const [result] = await createEslint(true).lintFiles([fixturePath]);
  return result?.messages ?? [];
}

async function assertMarkedDiagnostics(name: string): Promise<void> {
  const fixturePath = path.join(fixtureRoot, name);
  const expected = await expectedByLine(fixturePath);
  const messages = await lintFixture(name);

  for (const [line, marker] of expected) {
    const expectedKind = marker === "false-positive-raw" ? "raw" : marker;
    expect(
      messages.some(
        (message) =>
          message.line === line && message.messageId === expectedKind,
      ),
      `missing ${expectedKind} diagnostic at ${name}:${line}`,
    ).toBe(true);
  }

  const unexpected = messages.filter((message) => !expected.has(message.line));
  expect(unexpected).toEqual([]);
}

describe("brandless provenance research", () => {
  it("covers returns and source-level summaries", async () => {
    await assertMarkedDiagnostics("definitions.ts");
  }, 30_000);

  it("covers the mandatory flow stress matrix", async () => {
    await assertMarkedDiagnostics("consumer.fixture.ts");
  }, 30_000);

  it("covers assignments, comparisons, and switch cases", async () => {
    await assertMarkedDiagnostics("comparison.fixture.ts");
  }, 30_000);

  it("records the generic-slot collision limitation", async () => {
    await assertMarkedDiagnostics("limitations.fixture.ts");
  }, 30_000);

  it("measures prototype lint overhead", async () => {
    const fixturePath = path.join(fixtureRoot, "consumer.fixture.ts");
    const baseline = createEslint(false);
    const enabled = createEslint(true);

    await baseline.lintFiles([fixturePath]);
    await enabled.lintFiles([fixturePath]);

    const iterations = 3;
    const baselineStart = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      await baseline.lintFiles([fixturePath]);
    }
    const baselineMs = (performance.now() - baselineStart) / iterations;

    const enabledStart = performance.now();
    for (let index = 0; index < iterations; index += 1) {
      await enabled.lintFiles([fixturePath]);
    }
    const enabledMs = (performance.now() - enabledStart) / iterations;

    console.info(
      `BRANDLESS_LINT_PERF ${JSON.stringify({ baselineMs, enabledMs, overheadMs: enabledMs - baselineMs })}`,
    );
    expect(enabledMs).toBeGreaterThan(0);
  }, 60_000);
});
