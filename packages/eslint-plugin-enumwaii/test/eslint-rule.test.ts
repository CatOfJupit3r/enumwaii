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
  it("reports its package identity to ESLint", () => {
    expect(plugin.meta?.name).toBe("eslint-plugin-enumwaii");
    expect(plugin.meta?.version).toMatch(/^\d+\.\d+\.\d+$/);
  });

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
      "import { em } from 'enumwaii'; em(['READY', 'in-progress']); em({ READY: 'READY', BAD: 'not-constant' });",
    );
    expect(result?.messages.map((message) => message.messageId)).toEqual([
      "invalidInternalMember",
      "invalidInternalMember",
    ]);
  });

  it("checks object keys as CONSTANT_CASE and values with configured casing", async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: {
        plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
        rules: {
          "enumwaii/enforce-enum-casing": ["error", { valueCasing: "kebab" }],
        },
      },
    });
    const [result] = await eslint.lintText(`
      import { em } from "enumwaii";
      em({
        ORDER_PAID: "order-paid",
        badKey: "still-valid",
        INVALID_VALUE: "NOT-KEBAB",
      });
    `);

    expect(result?.messages.map((message) => message.messageId)).toEqual([
      "invalidInternalMember",
      "invalidInternalMember",
    ]);
    expect(result?.messages.map((message) => message.message)).toEqual([
      "Enumwaii declaration string badKey must use CONSTANT_CASE.",
      'Enumwaii declaration string "NOT-KEBAB" must use kebab-case.',
    ]);
  });

  it("allows configured kebab and snake values in tuple and object declarations", async () => {
    async function messagesFor(valueCasing: "kebab" | "snake", source: string) {
      const eslint = new ESLint({
        overrideConfigFile: true,
        overrideConfig: {
          plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
          rules: {
            "enumwaii/enforce-enum-casing": ["error", { valueCasing }],
          },
        },
      });
      const [result] = await eslint.lintText(source);
      return result?.messages ?? [];
    }

    await expect(
      messagesFor(
        "kebab",
        'em(["in-progress"]); new Enumwaii({ IN_PROGRESS: "in-progress" });',
      ),
    ).resolves.toEqual([]);
    await expect(
      messagesFor(
        "snake",
        'em(["in_progress"]); new Enumwaii({ IN_PROGRESS: "in_progress" });',
      ),
    ).resolves.toEqual([]);
  });

  it("ignores declarations whose names match configured patterns", async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: {
        plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
        rules: {
          "enumwaii/enforce-enum-casing": [
            "error",
            { ignoredNamePatterns: ["wire*", "Legacy?"] },
          ],
        },
      },
    });
    const [result] = await eslint.lintText(`
      import { em, Enumwaii } from "enumwaii";
      const wireStatus = em({ badKey: "in-progress" });
      const Legacy1 = new Enumwaii(["legacy-value"]);
      const status = em(["not-constant"]);
    `);

    expect(result?.messages.map((message) => message.messageId)).toEqual([
      "invalidInternalMember",
    ]);
  });

  it("ignores declarations in files matching configured patterns", async () => {
    const eslint = new ESLint({
      cwd: packageRoot,
      overrideConfigFile: true,
      overrideConfig: {
        plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
        rules: {
          "enumwaii/enforce-enum-casing": [
            "error",
            {
              ignoredFilePatterns: ["**/generated/**", "**/*.generated.js"],
            },
          ],
        },
      },
    });
    const source = "import { em } from 'enumwaii'; em(['wire-value']);";
    const [generated, generatedSuffix, checked] = await Promise.all([
      eslint.lintText(source, { filePath: "generated/status.js" }),
      eslint.lintText(source, { filePath: "src/status.generated.js" }),
      eslint.lintText(source, { filePath: "src/status.js" }),
    ]);

    expect(generated[0]?.messages).toEqual([]);
    expect(generatedSuffix[0]?.messages).toEqual([]);
    expect(checked[0]?.messages.map((message) => message.messageId)).toEqual([
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
