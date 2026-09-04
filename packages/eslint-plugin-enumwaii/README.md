<p align="center">
  <img src="https://raw.githubusercontent.com/CatOfJupit3r/enumwaii/6562b1b79844f0963677d1118ae5f4a9f2c7af8e/assets/enumwaii-icon.png" alt="enumwaii" width="112" height="112">
</p>

<h1 align="center">eslint-plugin-enumwaii</h1>

Syntax-only and type-aware ESLint rules for [`enumwaii`](https://www.npmjs.com/package/enumwaii).

[Setup and rules](https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/) · [Design boundaries](https://catofjupit3r.github.io/enumwaii/docs/linting/)

## Install

```sh
npm install --save-dev eslint eslint-plugin-enumwaii
```

OR

```sh
pnpm add -D eslint eslint-plugin-enumwaii
```

OR

```sh
yarn add -D eslint eslint-plugin-enumwaii
```

OR

```sh
bun add -d eslint eslint-plugin-enumwaii
```

## Syntax-only flat config

```js
import enumwaii from "eslint-plugin-enumwaii";

export default [...enumwaii.configs["flat/recommended"]];
```

This preset enables `enforce-enum-casing` and `no-object-em` and requires no TypeScript project.

## Type-aware flat config

The type-checked presets include `no-manual-enum`: declare string vocabularies with enumwaii instead of manual literal unions, raw discriminated tags, or const-container type extraction. Property selection and canonical derived types remain allowed. Its `ignore` list accepts documented name exceptions using the same matchers as `no-object-em`. The rule has no autofix; migrations must preserve existing values. See the linked rule documentation for coverage boundaries.

```js
import tsParser from "@typescript-eslint/parser";
import enumwaii from "eslint-plugin-enumwaii";

const [recommended] = enumwaii.configs["flat/recommended-type-checked"];

export default [
  {
    ...recommended,
    files: ["**/*.ts", "**/*.tsx"],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
  },
];
```

Legacy presets are available as `recommended` and `recommended-type-checked`.

## Rules

| Rule | Type-aware | Purpose |
| --- | --- | --- |
| `enforce-enum-casing` | No | Enforce declaration-key and configurable value casing. |
| `no-object-em` | Optional | Prefer arrays; reserve object inputs for documented contracts or compatibility. |
| `no-direct-enumwaii-reference` | Yes | Extract `.enum`, `.rawEnum`, or `.cases` before member use. |
| `no-enumwaii-case-misuse` | Yes | Reserve raw cases for discriminated-union flows. |
| `no-raw-enum-comparison` | Yes | Replace raw comparison and `switch` literals with owned members. |
| `no-raw-enum-member` | Yes | Use owned members and composition APIs in subsets and mappings. |
| `no-union-property-in` | Yes | Prefer enumwaii discriminants to structural `in` narrowing. |

`enforce-enum-casing` and `no-object-em` have options. For casing, set `valueCasing` to `"constant"` (the default), `"kebab"`, or `"snake"`; object keys always remain `CONSTANT_CASE`. Use `ignoredNamePatterns` or `ignoredFilePatterns` with `*`, `**`, and `?` wildcards to skip both casing checks for selected declarations. The other rules have no options, and none of the rules autofix provenance-sensitive code.

```js
{
  rules: {
    "enumwaii/enforce-enum-casing": [
      "error",
      {
        valueCasing: "kebab",
        ignoredNamePatterns: ["wire*"],
        ignoredFilePatterns: ["**/generated/**"],
      },
    ],
  },
}
```

## no-object-em

Enabled at error severity in all recommended presets. Prefer `em(["IN_PROGRESS", "COMPLETED"])`, including for new public APIs you control. Object mappings are an exception for values whose exact spelling is imposed by an external contract or existing compatibility requirement. Different keys and values alone do not establish that need.

```js
{
  rules: {
    "enumwaii/no-object-em": ["error", {
      ignore: [{
        name: { startsWith: "aws", endsWith: "Status" },
        reason: "external-contract",
        justification: "AWS SDK values must retain the provider's exact spelling.",
      }, {
        name: { regex: "^legacyOrderStatus$" },
        reason: "compatibility",
        justification: "Existing orders.status rows use inProgress and done.",
      }],
    }],
  },
}
```

Each `name` is either a string-matcher object with one or more of `startsWith`, `endsWith`, and `contains`, or a separate `{ regex: string }` object. All conditions in one string-matcher object must match (AND); any matching ignore entry grants the exception (OR). For example, `{ startsWith: "aws", endsWith: "Status", contains: "Wire" }` matches `awsWireStatus`. Regex cannot be combined with the string conditions. The first three use native JavaScript string operations (`contains` uses `includes`); regex strings compile once per rule instance with the Unicode flag. All matching is case-sensitive. Match the receiving declaration name (`awsStatus` in `const awsStatus = em(SdkStatus)`), not the argument name. Use narrow patterns; an exception documents a reviewed constraint, it cannot prove one. There are no built-in name exemptions. Both `reason` and a nonblank `justification` are required.

For AI assistants: fix internal identities with array declarations; keep display labels in a separate map keyed by extracted enum members. For subsets and derived enums, use `.pick()`, `.omit()`, `.deriveTo()`, or `em.combine()` with owned members. Do not disable lint, rename a declaration to evade the rule, or add an exception merely for prettier lowercase strings, URLs, CLI/config values, a new public API, or database storage. New `PROGRESS_TYPE` values should remain `CONSTANT_CASE`.

Strong exceptions include provider SDK enums, provider event identifiers and scopes, standard protocol/media/browser/CSS/locale/runtime tokens, and already persisted or published values whose spelling must remain compatible. A public interface alone is not an exception. Even an exempt declaration reports a statically known object such as `{ GET: "GET", POST: "POST" }`; use an array instead.

The rule checks `em(...)` and `new Enumwaii(...)`, including named import aliases and namespace imports from `enumwaii`, TypeScript expression wrappers, local constant aliases, and local TypeScript enums. Without type services, imported inputs, parameters, and function results whose shape is unknown are outside its scope. Configure the type-checked preset with project services to detect these object inputs too; arrays and tuples remain allowed. Unknown/`any` types cannot establish an object input. Redundancy checking is limited to resolved object literals.

Exceptions affect only this rule. Casing and usage-site magic-string rules remain active. If a required external literal spelling conflicts with casing, configure `enforce-enum-casing` separately for that specific declaration using its existing name override; keep internal keys `CONSTANT_CASE`. Importing a provider's enum directly also avoids duplicating its literal definitions. No autofix is offered because changing values can break a contract.

## Oxlint

Oxlint can load the package as a JavaScript plugin. Its JavaScript-plugin and type-service capabilities differ from ESLint, so use the rules that do not require type services there:

```jsonc
{
  "jsPlugins": ["eslint-plugin-enumwaii"],
  "rules": {
    "enumwaii/enforce-enum-casing": "error",
    "enumwaii/no-object-em": "error",
  },
}
```

Run the type-aware preset through ESLint.

## Compatibility

Node.js 18 or newer, ESLint 8–10, and TypeScript 5.5–6.x. TypeScript is optional for the syntax-only preset.

## License

MIT
