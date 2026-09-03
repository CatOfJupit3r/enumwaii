<p align="center">
  <img src="https://catofjupit3r.github.io/enumwaii/icon.png" alt="enumwaii" width="112" height="112">
</p>

<h1 align="center">eslint-plugin-enumwaii</h1>

Syntax-only and type-aware ESLint rules for [`enumwaii`](https://www.npmjs.com/package/enumwaii).

[Setup guide](https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin/) · [Rules reference](https://catofjupit3r.github.io/enumwaii/docs/api/eslint-plugin-enumwaii/) · [Design boundaries](https://catofjupit3r.github.io/enumwaii/docs/linting/)

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

This preset enables `enforce-enum-casing` and requires no TypeScript project.

## Type-aware flat config

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
| `enforce-enum-casing` | No | Require `CONSTANT_CASE` declaration members. |
| `no-direct-enumwaii-reference` | Yes | Extract `.enum`, `.rawEnum`, or `.cases` before member use. |
| `no-enumwaii-case-misuse` | Yes | Reserve raw cases for discriminated-union flows. |
| `no-raw-enum-comparison` | Yes | Replace raw comparison and `switch` literals with owned members. |
| `no-raw-enum-member` | Yes | Use owned members and composition APIs in subsets and mappings. |
| `no-union-property-in` | Yes | Prefer enumwaii discriminants to structural `in` narrowing. |

The rules have no options and do not autofix provenance-sensitive code.

## Oxlint

Oxlint can load the package as a JavaScript plugin. Its JavaScript-plugin and type-service capabilities differ from ESLint, so use only the syntax rule there:

```jsonc
{
  "jsPlugins": ["eslint-plugin-enumwaii"],
  "rules": {
    "enumwaii/enforce-enum-casing": "error",
  },
}
```

Run the type-aware preset through ESLint.

## Compatibility

Node.js 18 or newer, ESLint 8–10, and TypeScript 5.5–6.x. TypeScript is optional for the syntax-only preset.

## License

MIT
