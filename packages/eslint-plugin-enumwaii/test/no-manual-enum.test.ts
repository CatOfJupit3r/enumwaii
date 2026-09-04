import tsParser from "@typescript-eslint/parser";
import { ESLint, type Linter } from "eslint";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import plugin from "../src/index";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
function createEslint(options = {}) {
  return new ESLint({
    cwd: root,
    overrideConfigFile: true,
    overrideConfig: {
      files: ["**/*.ts"],
      languageOptions: {
        parser: tsParser as unknown as Linter.Parser,
        parserOptions: { projectService: true, tsconfigRootDir: root },
      },
      plugins: { enumwaii: plugin as unknown as ESLint.Plugin },
      rules: { "enumwaii/no-manual-enum": ["error", options] },
    },
  });
}
const eslint = createEslint();
async function lint(source: string, options?: object) {
  const [result] = await (options ? createEslint(options) : eslint).lintText(
    "export {};\n" + source,
    {
      filePath: path.join(root, "test/fixtures/no-manual-enum.fixture.ts"),
    },
  );
  return result!.messages;
}

describe("no-manual-enum", () => {
  it.each([
    'type Status = "A" | "B";',
    'interface Job { status: "A" | "B" }',
    'function update(status: "A" | "B") {}',
    'declare function get(): "A" | "B";',
    'type Status = "A" | "B" | null | undefined;',
    'function update<T extends "A" | "B">(status: T) {}',
    'type Status = Array<"A" | "B">;',
    'type Status = Record<"A" | "B", number>;',
    'type A = "A"; type B = "B"; type Status = A | B;',
    'type Status = ("A" | "B") & { readonly brand: "Status" };',
    'import { em as make } from "enumwaii"; const s = make(["A", "B"]); type Status = typeof s["~type"]; type Extended = Status | "C";',
    'type Pick<T, K> = K; type Status = Pick<{}, "A" | "B">;',
  ])("rejects assembled unions: %s", async (source) => {
    expect((await lint(source)).map((m) => m.messageId)).toEqual([
      "manualUnion",
    ]);
  });

  it.each([
    'const S = ["A", "B"] as const; type Status = (typeof S)[number];',
    'const S = { A: "a", B: "b" } as const; type Status = (typeof S)[keyof typeof S];',
  ])("rejects const enum replacements: %s", async (source) => {
    const messages = await lint(source);
    expect(messages.map((m) => m.messageId)).toEqual(["manualContainer"]);
    expect(messages[0]?.fix).toBeUndefined();
  });

  it.each([
    'type State = { state: "A" } | { state: "B"; data: string };',
    'interface A { state: "A" } interface B { state: "B" } type State = A | B;',
  ])("rejects raw discriminants: %s", async (source) => {
    expect((await lint(source)).map((m) => m.messageId)).toEqual([
      "manualDiscriminant",
    ]);
  });

  it.each([
    'type User = { id: string; name: string }; type K = keyof User; type P = Pick<User, "id" | "name">; type O = Omit<User, "id" | "name">; type V = User["id" | "name"];',
    'const names = ["Alice", "Bob"] as const; const defaults = { host: "localhost", protocol: "https" } as const;',
    "type ID = `user_${string}`; type Pixel = `${number}px`;",
    'type A = "A"; type Optional = A | undefined; type Mixed = string | number;',
    'import { em } from "enumwaii"; const s = em(["A", "B"]); const S = s.enum; type Status = typeof s["~type"]; type Optional = Status | undefined; type Member = typeof S.A;',
    'import { em } from "enumwaii"; const s = em(["A", "B"]); const S = s.cases; type State = { state: typeof S.A } | { state: typeof S.B; data: string };',
    'function em() { return { "~type": "A" as const }; } const s = em(); type Status = typeof s["~type"] | "B";',
    "type Recursive = Recursive | undefined;",
  ])("allows derivation and ordinary structural types: %s", async (source) => {
    expect(await lint(source)).toEqual([]);
  });

  it("enables only the type-checked presets", () => {
    expect(
      plugin.configs["recommended-type-checked"].rules?.[
        "enumwaii/no-manual-enum"
      ],
    ).toBe("error");
    expect(
      plugin.configs["flat/recommended-type-checked"][0]?.rules?.[
        "enumwaii/no-manual-enum"
      ],
    ).toBe("error");
    expect(plugin.configs.recommended.rules).not.toHaveProperty(
      "enumwaii/no-manual-enum",
    );
  });

  it("reports the original union without repeating it at references", async () => {
    expect(
      (
        await lint(
          'type Status = "A" | "B"; type Optional = Status | undefined; type Alias = Status;',
        )
      ).map((m) => m.messageId),
    ).toEqual(["manualUnion"]);
  });
});

const exception = (name: object) => ({
  name,
  reason: "external-contract",
  justification: "Provider declarations require this vocabulary.",
});

describe("no-manual-enum ignore", () => {
  it.each([
    { startsWith: "Wire" },
    { endsWith: "Status" },
    { contains: "Legacy" },
    { startsWith: "Wire", endsWith: "Status", contains: "Legacy" },
    { regex: "^WireLegacyStatus$" },
  ])("supports name matcher %j", async (name) => {
    expect(
      await lint('type WireLegacyStatus = "A" | "B";', {
        ignore: [exception(name)],
      }),
    ).toEqual([]);
  });

  it.each([
    'type WireStatus = Array<"A" | "B">;',
    'interface WireStatus { status: "A" | "B" }',
    'declare function WireStatus(status: "A" | "B"): "C" | "D";',
    'const WireStatus = (status: "A" | "B") => status;',
    'type WireStatus = { state: "A" } | { state: "B" };',
    'const S = ["A", "B"] as const; type WireStatus = (typeof S)[number];',
    'const S = { A: "a", B: "b" } as const; type WireStatus = (typeof S)[keyof typeof S];',
  ])("ignores the enclosing declaration: %s", async (source) => {
    expect(
      await lint(source, { ignore: [exception({ regex: "^WireStatus$" })] }),
    ).toEqual([]);
  });

  it("combines matcher fields with AND and entries with OR", async () => {
    const options = {
      ignore: [
        exception({ startsWith: "Other" }),
        exception({ startsWith: "Wire", endsWith: "Status" }),
      ],
    };
    expect(
      (
        await lint(
          'type WireStatus = "A" | "B"; type WireRole = "A" | "B"; type LocalStatus = "A" | "B";',
          options,
        )
      ).map((m) => m.messageId),
    ).toEqual(["manualUnion", "manualUnion"]);
  });

  it("does not exempt other declarations through ignored sources or outer scopes", async () => {
    const source =
      'type WireA = "A"; type Local = WireA | "B"; const WireValues = ["A", "B"] as const; type Status = (typeof WireValues)[number]; function WireFunction() { type Inner = "A" | "B"; }';
    expect(
      (await lint(source, { ignore: [exception({ startsWith: "Wire" })] })).map(
        (m) => m.messageId,
      ),
    ).toEqual(["manualUnion", "manualContainer", "manualUnion"]);
  });

  it("supports documented compatibility exceptions", async () => {
    expect(
      await lint('type Legacy = "a" | "b";', {
        ignore: [
          {
            name: { regex: "^Legacy$" },
            reason: "compatibility",
            justification:
              "Existing generated consumer types must remain assignable.",
          },
        ],
      }),
    ).toEqual([]);
  });

  it.each([
    { name: {} },
    exception({ startsWith: "" }),
    exception({ startsWith: "Wire", regex: "Status$" }),
    exception({ unknown: "Wire" }),
    { ...exception({ contains: "Wire" }), reason: "anything" },
    { ...exception({ contains: "Wire" }), justification: " " },
    { name: { contains: "Wire" }, reason: "external-contract" },
  ])("rejects invalid entry %j", async (entry) => {
    await expect(
      lint('type Status = "A" | "B";', { ignore: [entry] }),
    ).rejects.toThrow();
  });

  it("reports invalid regular expressions clearly", async () => {
    await expect(
      lint('type Status = "A" | "B";', { ignore: [exception({ regex: "[" })] }),
    ).rejects.toThrow("no-manual-enum: invalid ignore regex");
  });
});
