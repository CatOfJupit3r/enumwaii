import tsParser from "@typescript-eslint/parser";
import { ESLint, type Linter } from "eslint";
import { describe, expect, it } from "vitest";
import path from "node:path";
import { fileURLToPath } from "node:url";
import plugin from "../src/index";

async function lint(source: string, options = {}) {
  const eslint = new ESLint({
    overrideConfigFile: true,
    overrideConfig: {
      files: ["**/*.ts"],
      languageOptions: { parser: tsParser as unknown as Linter.Parser },
      plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
      rules: { "enumwaii/no-object-em": ["error", options] },
    },
  });
  const [result] = await eslint.lintText(source, { filePath: "test.ts" });
  return result!.messages;
}

const exception = (name: object) => ({
  name,
  reason: "external-contract",
  justification: "Provider protocol requires these exact values.",
});

describe("no-object-em", () => {
  it("uses available type services for imported objects and parameters while allowing arrays", async () => {
    const packageRoot = path.resolve(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
    );
    const eslint = new ESLint({
      cwd: packageRoot,
      overrideConfigFile: true,
      overrideConfig: {
        files: ["**/*.ts"],
        languageOptions: {
          parser: tsParser as unknown as Linter.Parser,
          parserOptions: { projectService: true, tsconfigRootDir: packageRoot },
        },
        plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
        rules: {
          "enumwaii/no-object-em": [
            "error",
            { ignore: [exception({ startsWith: "aws" })] },
          ],
        },
      },
    });
    const [result] = await eslint.lintFiles([
      path.join(packageRoot, "test/fixtures/no-object-em.fixture.ts"),
    ]);
    expect(result?.messages.map((m) => m.messageId)).toEqual([
      "objectInput",
      "objectInput",
    ]);
  });

  it("is enabled in every recommended preset", () => {
    for (const config of Object.values(plugin.configs)) {
      const presets = Array.isArray(config) ? config : [config];
      expect(presets[0]?.rules?.["enumwaii/no-object-em"]).toBe("error");
    }
  });

  it.each([
    'em({ IN_PROGRESS: "inProgress" })',
    'new Enumwaii({ IN_PROGRESS: "inProgress" })',
    'em({ IN_PROGRESS: "inProgress" } as const)',
    'em({ IN_PROGRESS: "inProgress" } satisfies Record<string, string>)',
    'const values = { IN_PROGRESS: "inProgress" }; const alias = values; em(alias)',
    'enum Values { IN_PROGRESS = "inProgress" }; em(Values)',
    'import { em as make } from "enumwaii"; make({ READY: "ready" })',
    'import { Enumwaii as E } from "enumwaii"; new E({ READY: "ready" })',
    'import * as ew from "enumwaii"; ew.em({ READY: "ready" })',
    'import * as ew from "enumwaii"; new ew.Enumwaii({ READY: "ready" })',
    'import * as ew from "enumwaii"; ew["em"]({ READY: "ready" })',
    "em({ ...values })",
    'em({ [key]: "value" })',
  ])("rejects object declarations: %s", async (source) => {
    expect((await lint(source)).map((m) => m.messageId)).toEqual([
      "objectInput",
    ]);
  });

  it.each([
    'em(["IN_PROGRESS", "COMPLETED"])',
    'const values = ["READY"] as const; em(values)',
    'import { em } from "other"; em({ READY: "ready" })',
    'function em(x: unknown) { return x; } em({ READY: "ready" })',
    'import { em } from "enumwaii"; function f(em: Function) { em({ READY: "ready" }); }',
    'const local = { em(x: unknown) { return x; } }; local.em({ READY: "ready" })',
    "em.combine(a, b); a.pick([A.READY]);",
    "const a = b; const b = a; em(a)",
  ])("allows arrays and unrelated calls: %s", async (source) => {
    expect(await lint(source)).toEqual([]);
  });

  it.each([
    { startsWith: "aws" },
    { endsWith: "Status" },
    { contains: "Wire" },
    { startsWith: "aws", endsWith: "Status" },
    { startsWith: "aws", contains: "Wire" },
    { endsWith: "Status", contains: "Wire" },
    { startsWith: "aws", endsWith: "Status", contains: "Wire" },
    { regex: "^awsWireStatus$" },
  ])("supports the name matcher %j", async (name) => {
    expect(
      await lint('const awsWireStatus = em({ READY: "ready" }) as const;', {
        ignore: [exception(name)],
      }),
    ).toEqual([]);
  });

  it("matches destination names case-sensitively and does not exempt anonymous calls", async () => {
    const messages = await lint(
      `
      const awsValues = { READY: "ready" };
      const internal = em(awsValues);
      const AWSStatus = em({ READY: "ready" });
      em({ READY: "ready" });
    `,
      { ignore: [exception({ startsWith: "aws" })] },
    );
    expect(messages.map((m) => m.messageId)).toEqual(
      Array(3).fill("objectInput"),
    );
  });

  it.each(["otherWireStatus", "awsWireMode", "awsStatus"])(
    "requires every configured string condition to match: %s",
    async (name) => {
      const messages = await lint(`const ${name} = em({ READY: "ready" });`, {
        ignore: [
          exception({
            startsWith: "aws",
            endsWith: "Status",
            contains: "Wire",
          }),
        ],
      });
      expect(messages.map((message) => message.messageId)).toEqual([
        "objectInput",
      ]);
    },
  );

  it("allows any matching ignore entry", async () => {
    expect(
      await lint('const awsWireStatus = em({ READY: "ready" });', {
        ignore: [
          exception({ startsWith: "other" }),
          exception({ startsWith: "aws", endsWith: "Status" }),
        ],
      }),
    ).toEqual([]);
  });

  it("rejects redundant objects even with an exception", async () => {
    expect(
      (
        await lint(
          'const awsStatus = em({ READY: "READY", ["DONE"]: "DONE" as const });',
          {
            ignore: [exception({ startsWith: "aws" })],
          },
        )
      ).map((m) => m.messageId),
    ).toEqual(["redundantObject"]);
  });

  it("permits a documented compatibility mapping", async () => {
    expect(
      await lint('const legacy = new Enumwaii({ COMPLETED: "done" });', {
        ignore: [
          {
            name: { regex: "^legacy$" },
            reason: "compatibility",
            justification: "Existing orders.status rows use done.",
          },
        ],
      }),
    ).toEqual([]);
  });

  it.each([
    {
      name: { startsWith: "" },
      reason: "external-contract",
      justification: "Contract",
    },
    {
      name: { startsWith: "aws", regex: "Status$" },
      reason: "external-contract",
      justification: "Contract",
    },
    {
      name: { contains: "Api" },
      reason: "public-interface",
      justification: "Our API",
    },
    {
      name: { contains: "aws" },
      reason: "external-contract",
      justification: " ",
    },
    { name: { contains: "aws" }, reason: "external-contract" },
    { name: {}, reason: "external-contract", justification: "Contract" },
    {
      name: { startsWith: "aws", endsWith: "" },
      reason: "external-contract",
      justification: "Contract",
    },
    {
      name: { startsWith: "aws", unknown: "Status" },
      reason: "external-contract",
      justification: "Contract",
    },
  ])("rejects invalid exceptions: %j", async (entry) => {
    await expect(lint('em(["READY"])', { ignore: [entry] })).rejects.toThrow();
  });

  it("reports malformed regex configuration clearly", async () => {
    await expect(
      lint('em(["READY"])', { ignore: [exception({ regex: "[" })] }),
    ).rejects.toThrow("no-object-em: invalid ignore regex");
  });

  it("does not silence casing or usage rules", async () => {
    const eslint = new ESLint({
      overrideConfigFile: true,
      overrideConfig: [
        ...plugin.configs["flat/recommended"],
        {
          rules: {
            "enumwaii/no-object-em": [
              "error",
              { ignore: [exception({ startsWith: "aws" })] },
            ],
          },
        },
      ],
    });
    const [result] = await eslint.lintText(
      'const awsStatus = em({ READY: "ready" });',
    );
    expect(result?.messages.map((m) => m.ruleId)).toEqual([
      "enumwaii/enforce-enum-casing",
    ]);
  });
});
