---
title: ESLint plugin
description: Install the syntax-only or type-aware rules that complement enumwaii's TypeScript guarantees.
---

The lint package guides source-level conventions that TypeScript does not fully
express. It is separate from the runtime package and is never needed in a
production bundle.

## Install

```sh
pnpm add -D eslint eslint-plugin-enumwaii
```

### Syntax-only flat config

The lightweight preset enforces declaration casing and needs no TypeScript
project:

```js
import enumwaii from "eslint-plugin-enumwaii";

export default [...enumwaii.configs["flat/recommended"]];
```

### Type-aware flat config

The complete preset needs `@typescript-eslint/parser` with project services.
Apply it only to TypeScript files:

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

Legacy equivalents are available as `recommended` and
`recommended-type-checked`.

## Rules

| Rule                           | Type information | Purpose                                                                     |
| ------------------------------ | ---------------- | --------------------------------------------------------------------------- |
| `enforce-enum-casing`          | No               | Require `CONSTANT_CASE` members in direct internal declarations.            |
| `no-direct-enumwaii-reference` | Yes              | Extract `.enum`, `.rawEnum`, and `.cases` before referencing members.       |
| `no-enumwaii-case-misuse`      | Yes              | Keep raw case values inside discriminated-union declarations and narrowing. |
| `no-raw-enum-comparison`       | Yes              | Replace raw comparison and `switch` literals with owned members.            |
| `no-raw-enum-member`           | Yes              | Use owned members and composition APIs for subsets and targeted mappings.   |
| `no-union-property-in`         | Yes              | Prefer an enumwaii case discriminant to structural `in` narrowing.          |

The rules have no options and do not autofix. Provenance-sensitive changes
should remain explicit and reviewable.

### `enforce-enum-casing`

Checks literal members in direct `em([...])` and `new Enumwaii([...])`
declarations. Disable it locally for a deliberate external wire value rather
than changing that value at runtime.

### `no-direct-enumwaii-reference`

Rejects member expressions such as `roles.enum.ADMIN`. Extract the view once—
for example, `const ROLE = roles.enum`—then use `ROLE.ADMIN`. Methods such as
`roles.parse()` and properties such as `roles.values` remain direct APIs.

### `no-enumwaii-case-misuse`

Recognizes the type marker on `.cases` and confines raw case members to native
discriminated-union declarations, values, comparisons, and `switch` narrowing.

### `no-raw-enum-comparison`

Finds raw string literals in equality checks, `switch` cases, and discriminant
values when the surrounding type identifies an enumwaii declaration. Use its
extracted `.enum` or `.cases` member instead.

### `no-raw-enum-member`

Protects subset and targeted-derivation APIs from raw values, foreign members,
and reconstructed declarations. Prefer `pick`, `omit`, `extend`, `em.combine`,
and owned tuple entries.

### `no-union-property-in`

Flags structural `"property" in value` narrowing for object unions. A declared
`.cases` discriminant keeps the union explicit and makes every variant visible
to TypeScript and reviewers.

## Oxlint

Oxlint can load the package as a JavaScript plugin. JavaScript-plugin support is
still evolving, and only the syntax-only casing rule is useful without
TypeScript parser services:

```jsonc
{
  "jsPlugins": ["eslint-plugin-enumwaii"],
  "rules": {
    "enumwaii/enforce-enum-casing": "error",
  },
}
```

Run the type-aware preset through ESLint. See [Linting boundaries](./linting.md)
for why lint complements rather than replaces required branding.
