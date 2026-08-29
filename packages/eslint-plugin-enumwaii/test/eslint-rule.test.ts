import tsParser from "@typescript-eslint/parser";
import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

import plugin from "../src/index";

const packageRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

function createTypeAwareEslint(ruleName: keyof typeof plugin.rules): ESLint {
  return new ESLint({
    cwd: packageRoot,
    overrideConfigFile: true,
    overrideConfig: {
      files: ["**/*.ts"],
      languageOptions: {
        parser: tsParser as unknown as Linter.Parser,
        parserOptions: { projectService: true, tsconfigRootDir: packageRoot },
      },
      plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
      rules: { [`enumwaii/${ruleName}`]: "error" },
    },
  });
}

async function lintFixture(
  ruleName: keyof typeof plugin.rules,
  fixtureName: string,
): Promise<string[]> {
  const eslint = createTypeAwareEslint(ruleName);
  const [result] = await eslint.lintFiles([
    path.join(packageRoot, `test/fixtures/${fixtureName}.fixture.ts`),
  ]);
  return result?.messages.map((message) => message.messageId ?? "") ?? [];
}

describe("eslint-plugin-enumwaii", () => {
  it("exports self-referential flat configs", () => {
    expect(plugin.configs["flat/recommended"][0]?.plugins?.enumwaii).toBe(
      plugin,
    );
    expect(
      plugin.configs["flat/recommended-type-checked"][0]?.plugins?.enumwaii,
    ).toBe(plugin);
  });

  it("enforces CONSTANT_CASE without parser services", async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: {
        plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
        rules: { "enumwaii/enforce-enum-casing": "error" },
      },
    });
    const [result] = await eslint.lintText(
      "import { em } from 'enumwaii'; em(['READY', 'in-progress']);",
    );
    expect(result?.messages.map((message) => message.messageId)).toEqual([
      "invalidInternalMember",
    ]);
  });

  it("rejects raw comparisons and switch cases", async () => {
    await expect(
      lintFixture("no-raw-enum-comparison", "raw-comparison"),
    ).resolves.toEqual(["rawComparison", "rawSwitchCase"]);
  }, 30_000);

  it("requires member views to be extracted before use", async () => {
    await expect(
      lintFixture("no-direct-enumwaii-reference", "direct-reference"),
    ).resolves.toEqual([
      "directMemberView",
      "directMemberView",
      "directMemberView",
      "directMemberView",
    ]);
  }, 30_000);

  it("allows extracted views and other Enumwaii APIs", async () => {
    await expect(
      lintFixture("no-direct-enumwaii-reference", "extracted-reference"),
    ).resolves.toEqual([]);
  }, 30_000);

  it("rejects raw targeted, subset, and constructor members", async () => {
    await expect(
      lintFixture("no-raw-enum-member", "raw-member"),
    ).resolves.toEqual([
      "rawTargetMember",
      "rawSubsetMember",
      "rawSubsetMember",
      "derivedConstructorMember",
      "derivedConstructorValues",
    ]);
  }, 30_000);

  it("keeps cases scoped to discriminated-union use", async () => {
    await expect(
      lintFixture("no-enumwaii-case-misuse", "case-misuse"),
    ).resolves.toEqual([
      "caseObjectEscape",
      "computedCaseMember",
      "caseValueEscape",
    ]);
  }, 30_000);

  it("rejects structural property-presence union narrowing", async () => {
    await expect(
      lintFixture("no-union-property-in", "union-property-in"),
    ).resolves.toEqual(["structuralUnionNarrowing"]);
  }, 30_000);
});
