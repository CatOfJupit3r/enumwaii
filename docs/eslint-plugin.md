---
title: ESLint plugin
description: Install and understand the syntax-only and type-aware rules that complement enumwaii's TypeScript guarantees.
---

The lint package guides source-level conventions alongside TypeScript's ownership checks. It runs as a Node-based development dependency and stays outside production bundles.

## Install

Use the package manager that already owns the ESLint toolchain:

```sh tab="npm" tab-group="enumwaii-package-manager"
npm install --save-dev eslint eslint-plugin-enumwaii
```

```sh tab="pnpm"
pnpm add -D eslint eslint-plugin-enumwaii
```

```sh tab="yarn"
yarn add -D eslint eslint-plugin-enumwaii
```

```sh tab="bun"
bun add -d eslint eslint-plugin-enumwaii
```

```sh tab="deno"
deno add --dev npm:eslint npm:eslint-plugin-enumwaii
```

The plugin is a Node-based development tool. Deno and Cloudflare applications need it only when their repository already runs ESLint through a compatible toolchain; it is not part of enumwaii's runtime support.

### Syntax-only flat config

The lightweight preset uses syntax-only analysis to enforce declaration casing:

```js
import enumwaii from "eslint-plugin-enumwaii";

export default [...enumwaii.configs["flat/recommended"]];
```

### Type-aware flat config

The complete preset needs `@typescript-eslint/parser` with project services. Apply it only to TypeScript files:

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

For eslintrc configuration, use the `recommended` and `recommended-type-checked` presets.

## Rules

| Rule | Recommended | Type information | Purpose |
| --- | --- | --- | --- |
| `enforce-enum-casing` | Both | No | Enforce declaration-key and configurable value casing. |
| `no-direct-enumwaii-reference` | Type-aware | Yes | Extract `.enum`, `.rawEnum`, and `.cases` before referencing members. |
| `no-enumwaii-case-misuse` | Type-aware | Yes | Keep raw case values inside discriminated-union declarations and narrowing. |
| `no-raw-enum-comparison` | Type-aware | Yes | Replace raw comparison and `switch` literals with owned members. |
| `no-raw-enum-member` | Type-aware | Yes | Use owned members and composition APIs for subsets and targeted mappings. |
| `no-union-property-in` | Type-aware | Yes | Prefer an enumwaii case discriminant to structural `in` narrowing. |

Only `enforce-enum-casing` has options; the other rules have no options. The rules do not autofix, so provenance-sensitive changes remain explicit and reviewable. Each flagged example renders the rule and report ID beside the affected source.

### `enforce-enum-casing`

Checks string literals in the first array or object passed directly to `em(...)` or `new Enumwaii(...)`. This is the only syntax-only rule: it does not need TypeScript parser services. Object keys always require `CONSTANT_CASE`. Tuple members and object values follow `valueCasing`: `"constant"` (the default), `"kebab"`, or `"snake"`. Non-literal values are outside its scope.

Use `valueCasing` for consistent lowercase wire formats. Disable the rule locally at one declaration, or configure `ignoredNamePatterns` and `ignoredFilePatterns` when a naming convention or generated-file boundary should bypass casing checks entirely.

The ignore options accept wildcard patterns. `*` matches within one path segment, `**` crosses path separators, and `?` matches one non-separator character. Name patterns match identifiers directly bound to a declaration, such as `wireStatus` in `const wireStatus = em([...])`. File patterns match normalized forward-slash paths, so `**/generated/**` works on every operating system. A matched declaration skips both key and value checks.

```js
{
  rules: {
    "enumwaii/enforce-enum-casing": [
      "error",
      {
        valueCasing: "kebab",
        ignoredNamePatterns: ["wire*", "*Payload"],
        ignoredFilePatterns: ["**/generated/**", "**/*.generated.ts"],
      },
    ],
  },
}
```

Reports: `invalidInternalMember`.

#### Flagged

```ts
// @noErrors
import { em } from "enumwaii";

const status = em({ inProgress: "IN_PROGRESS" });
// @error: enumwaii/enforce-enum-casing (invalidInternalMember) — internal members use CONSTANT_CASE.
```

#### Accepted

```ts
import { em } from "enumwaii";

// With valueCasing: "kebab"
const status = em({
  READY: "ready",
  IN_PROGRESS: "in-progress",
});
```

### `no-direct-enumwaii-reference`

Requires `.enum`, `.rawEnum`, and `.cases` to be extracted before their members are referenced. A TypeScript `as`, `satisfies`, or non-null wrapper around the extraction is recognized. This makes the member vocabulary visible at module scope and avoids passing the declaration object around as a namespace.

The rule identifies real enumwaii instances through their types. An unrelated object with an `enum` property is not flagged. Direct instance APIs such as `parse`, `safeParse`, `is`, `pick`, `derive`, `values`, and `rawValues` remain valid.

Reports: `directMemberView`.

#### Flagged

```ts
// @noErrors
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);

const admin = roles.enum.ADMIN;
const rawUser = roles.rawEnum.USER;
const adminCase = roles.cases.ADMIN;
// @error: enumwaii/no-direct-enumwaii-reference (directMemberView) — extract each member view first.
```

#### Accepted

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;
const ROLE_CASES = roles.cases;

const admin = ROLE.ADMIN;
const rawUser = RAW_ROLE.USER;
const adminCase = ROLE_CASES.ADMIN;
const parsed = roles.parse("ADMIN");

const unrelated = { enum: { ADMIN: "ADMIN" } } as const;
const unrelatedAdmin = unrelated.enum.ADMIN;
```

### `no-enumwaii-case-misuse`

Keeps `.cases` in the narrow role for which it exists: native discriminated union authoring and control-flow narrowing. Extract a cases object once into an uppercase name ending in `_CASES`, such as `ROLE_CASES`.

Case members are accepted in type queries, recognized discriminant properties, `z.literal(...)`, equality comparisons, and `if` or `switch` narrowing. The rule flags incorrectly exposed case containers, computed raw-key access, and a case member used as an ordinary application value. Use `.enum` for the latter.

Reports: `caseObjectEscape`, `computedCaseMember`, and `caseValueEscape`.

#### Flagged

```ts
// @noErrors
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE_CASES = roles.cases;

export const BAD_ALIAS = roles.cases;
// @error: enumwaii/no-enumwaii-case-misuse (caseObjectEscape) — export the extracted *_CASES object.
export const computed = ROLE_CASES["ADMIN"];
// @error: enumwaii/no-enumwaii-case-misuse (computedCaseMember) — use static case access.
export const leakedApplicationValue = ROLE_CASES.USER;
// @error: enumwaii/no-enumwaii-case-misuse (caseValueEscape) — use .enum for application values.
```

#### Accepted

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
export const ROLE_CASES = roles.cases;

type RoleEvent =
  | { type: typeof ROLE_CASES.ADMIN; role: typeof ROLE.ADMIN }
  | { type: typeof ROLE_CASES.USER; role: typeof ROLE.USER };

declare const event: RoleEvent;

if (event.type === ROLE_CASES.ADMIN) {
  event.role;
}
```

### `no-raw-enum-comparison`

Rejects raw string and no-expression template literals when they are compared with a branded value, used as a `switch` case for an enumwaii value, or supplied as a discriminant value in a `.cases`-backed union. Assignments to those discriminants are checked too.

Use an extracted `.enum` member for ordinary application values and an extracted `.cases` member for native union discriminants. Unrelated strings and ordinary string unions without enumwaii provenance are not flagged. Parsing a raw external value is also valid—the parser is the boundary that establishes ownership.

Reports: `rawComparison`, `rawSwitchCase`, and `rawCaseValue`.

#### Flagged

```ts
// @noErrors
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE_CASES = roles.cases;
const role = roles.parse("ADMIN");

const isAdmin = role === "ADMIN";
// @error: enumwaii/no-raw-enum-comparison (rawComparison) — compare with an owned .enum member.

function describe(value: typeof role) {
  switch (value) {
    case "USER":
      // @error: enumwaii/no-raw-enum-comparison (rawSwitchCase) — use an owned switch case.
      return "Member";
    default:
      return "Administrator";
  }
}

type Event = { type: typeof ROLE_CASES.ADMIN };
const event: Event = { type: "ADMIN" };
// @error: enumwaii/no-raw-enum-comparison (rawCaseValue) — use the extracted .cases member.
```

#### Accepted

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const ROLE_CASES = roles.cases;
const role = roles.parse("ADMIN");

const isAdmin = role === ROLE.ADMIN;

function describe(value: typeof role) {
  switch (value) {
    case ROLE.USER:
      return "Member";
    default:
      return "Administrator";
  }
}

type Event = { type: typeof ROLE_CASES.ADMIN };
const event: Event = { type: ROLE_CASES.ADMIN };
```

### `no-raw-enum-member`

Requires owned members in `pick` and `omit`, and owned target members in `deriveTo`. It also prevents creating a new declaration from another declaration's branded members or value collections, which would discard the existing ownership relationship.

Use the source declaration's extracted `.enum` view for subsets, the target declaration's `.enum` view for `deriveTo`, and the built-in `combine`, `pick`, `omit`, or `extend` composition APIs. Ordinary `derive` result values remain unrestricted because they are intentionally application-defined data.

Reports: `rawSubsetMember`, `rawTargetMember`, `derivedConstructorMember`, and `derivedConstructorValues`.

#### Flagged

```ts
// @noErrors
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;

roles.pick(["ADMIN"]);
// @error: enumwaii/no-raw-enum-member (rawSubsetMember) — subsets require owned source members.
roles.deriveTo(
  permissions,
  [ROLE.ADMIN, ["READ", PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
);
// @error: enumwaii/no-raw-enum-member (rawTargetMember) — deriveTo requires owned target members.

em([ROLE.ADMIN]);
// @error: enumwaii/no-raw-enum-member (derivedConstructorMember) — use a composition API.
em(roles.rawValues);
// @error: enumwaii/no-raw-enum-member (derivedConstructorValues) — use a composition API.
```

#### Accepted

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;

const staffRoles = roles.pick([ROLE.ADMIN]);
const nonAdminRoles = roles.omit([ROLE.ADMIN]);
const grants = roles.deriveTo(
  permissions,
  [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
);
const combined = em.combine([roles, permissions]);
```

### `no-union-property-in`

Flags a static string on the left side of `in` when the right side is an object union and the property is available on some variants but unavailable on others. It does not reject ordinary property-existence checks, non-unions, dynamic property names, or unions whose members are not structurally separated by that property.

For a closed set of variants, add a `.cases` discriminant and narrow it with equality or `switch`. The union then remains explicit to both TypeScript and reviewers.

Reports: `structuralUnionNarrowing`.

#### Flagged

```ts
// @noErrors
type Scope =
  | { kind: "STORY"; storyId: string; chatId?: never }
  | { kind: "CHAT"; storyId: string; chatId: string };

declare const scope: Scope;

const hasChat = "chatId" in scope;
// @error: enumwaii/no-union-property-in (structuralUnionNarrowing) — narrow on an explicit case discriminant.
```

#### Accepted

```ts
import { em } from "enumwaii";

const scopeKinds = em(["STORY", "CHAT"]);
const SCOPE_CASES = scopeKinds.cases;

type Scope =
  | { kind: typeof SCOPE_CASES.STORY; storyId: string }
  | { kind: typeof SCOPE_CASES.CHAT; chatId: string };

declare const scope: Scope;

if (scope.kind === SCOPE_CASES.CHAT) {
  scope.chatId;
}
```

## Oxlint

Oxlint can load the package as a JavaScript plugin. JavaScript-plugin support is still evolving, and only the syntax-only casing rule is useful without TypeScript parser services:

```jsonc
{
  "jsPlugins": ["eslint-plugin-enumwaii"],
  "rules": {
    "enumwaii/enforce-enum-casing": "error",
  },
}
```

Run the type-aware preset through ESLint. See the [enforcement model](https://catofjupit3r.github.io/enumwaii/docs/linting/) for how branding and lint divide responsibility.
