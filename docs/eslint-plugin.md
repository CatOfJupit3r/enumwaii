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

The lightweight preset uses syntax-only analysis to enforce declaration casing and restrict object inputs:

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
| `no-object-em` | Both | Optional | Prefer arrays; reserve object inputs for documented external contracts or compatibility. |
| `no-manual-enum` | Type-aware | Yes | Declare string vocabularies through enumwaii. |
| `no-direct-enumwaii-reference` | Type-aware | Yes | Extract `.enum`, `.rawEnum`, and `.cases` before referencing members. |
| `no-enumwaii-case-misuse` | Type-aware | Yes | Keep raw case values inside discriminated-union declarations and narrowing. |
| `no-raw-enum-comparison` | Type-aware | Yes | Replace raw comparison and `switch` literals with owned members. |
| `no-raw-enum-member` | Type-aware | Yes | Use owned members and composition APIs for subsets and targeted mappings. |
| `no-union-property-in` | Type-aware | Yes | Prefer an enumwaii case discriminant to structural `in` narrowing. |

`enforce-enum-casing`, `no-object-em`, and `no-manual-enum` have options; the other rules have no options. The rules do not autofix, so provenance-sensitive changes remain explicit and reviewable. Each flagged example renders the rule and report ID beside the affected source.

### `no-manual-enum`

Enabled in both type-checked presets. Reports unions of two or more distinct raw string literals, including inline annotations, constraints, containers, nullable unions, branded wrappers, and assembly from single-literal aliases (including imports). Adding even one raw literal to a branded enumwaii type is also reported. References to an already assembled vocabulary are not reported again.

The rule also reports string-valued const arrays and objects when indexed access extracts a multi-value domain, and unions whose branches share a required property with distinct raw string tags. Ordinary const data is allowed until used as a type vocabulary. Diagnostics distinguish unions, const containers, and discriminants.

```ts
import { em } from "enumwaii";

const states = em(["LOADING", "SUCCESS", "ERROR"]);
type State = (typeof states)["~type"];
const STATE = states.cases;
type RequestState =
  | { state: typeof STATE.LOADING }
  | { state: typeof STATE.SUCCESS; data: string }
  | { state: typeof STATE.ERROR; error: Error };
```

Use `.cases` for TypeScript's native discriminant narrowing and exhaustiveness, consistent with the other enumwaii rules. Use `.enum` for ordinary branded values.

`keyof`, indexed property selection, built-in `Pick`/`Omit` keys, open template formats, and existing external type references remain allowed. No blanket exemption applies to `.d.ts` files or DTO names. Exclude generated files explicitly through ESLint `ignores`.

Use `ignore` for explicit declaration exceptions, with the same matchers and required rationale as `no-object-em`:

```js
{
  rules: {
    "enumwaii/no-manual-enum": ["error", {
      ignore: [{
        name: { startsWith: "Provider", endsWith: "Status" },
        reason: "external-contract",
        justification: "Provider schema requires a separately declared wire type.",
      }],
    }],
  },
}
```

A name matcher supports `startsWith`, `endsWith`, and `contains` together (all must match), or a standalone `regex` string. Any matching entry exempts the declaration. Matching is case-sensitive; regexes use Unicode mode. Each entry requires `reason: "external-contract" | "compatibility"` and a nonblank `justification`. Invalid options and regexes fail configuration.

Names come from the nearest enclosing type alias, interface, function, method, or variable declaration. This includes inline annotations within that declaration. For const extraction, match the derived type name, not the source container. Matching stops at the nearest declaration, so ignoring a function does not exempt a separately named local type. Unnamed declarations are not matched. Exceptions neither propagate through references nor disable other rules; generated-file exclusions still belong in ESLint `ignores`.

There are no automatic fixes. Preserve existing wire and persisted values when migrating; `no-object-em` representation exceptions do not disable this rule. Coverage is deliberately bounded: it does not evaluate finite template expansions, arbitrary generic transformations, native TypeScript enum declarations, or const containers hidden behind value aliases or non-const assertions. It recognizes branded ownership through enumwaii's declaration source, not a local function named `em` or a property named `~type`.

### `no-object-em`

Enabled in every recommended preset. Use `em(["IN_PROGRESS", "COMPLETED"])` for internal identities and new public APIs, including `PROGRESS_TYPE`. Keep display labels in a separate map indexed by extracted enum members. For existing enum subsets and derivations, use `.pick()`, `.omit()`, `.deriveTo()`, and `em.combine()` with owned members.

Reserve object inputs with distinct keys and values for **external-contract** constraints (AWS or other provider SDKs, provider events/scopes, protocol/media/browser/CSS/locale/runtime tokens) or **compatibility** constraints (existing database rows, saved files, historical messages, previously published values). A new public interface, URL, CLI/config choice, serialization, or lowercase spelling alone does not qualify. AI assistants should fix the representation or use composition, rather than disabling lint or renaming variables to fit an ignore pattern.

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

Each `name` accepts either one object containing any combination of `startsWith`, `endsWith`, and `contains` (at least one required), or a separate `{ regex: string }` object. All provided string conditions must match (AND); ignore entries are alternatives (OR). For example, `{ startsWith: "aws", endsWith: "Status", contains: "Wire" }` matches `awsWireStatus`. Regex cannot be mixed with the string conditions. Native JavaScript string methods implement the first three (`contains` uses `includes`); regex strings compile once per rule instance with the Unicode flag. Matching is case-sensitive against the receiving variable name, such as `awsStatus` in `const awsStatus = em(SdkStatus)`. Anonymous calls cannot match an exception. Patterns must be nonempty; `reason` and a nonblank `justification` are mandatory. No exceptions are built in, and matching a name cannot prove the stated contract.

Recognizes direct factories, renamed named imports and namespace imports from `enumwaii`, TypeScript wrappers, local constant aliases, and local TypeScript enums. Without parser services, unknown imported values, parameters, and function results are outside its scope. Project-aware TypeScript parser services extend checking to those object inputs while allowing arrays and tuples. Unknown/`any` inputs remain unclassified.

An exemption never permits a statically resolved redundant object literal such as `em({ GET: "GET", POST: "POST" })`: use `em(["GET", "POST"])`. The rule does not prove redundancy for imported or dynamic objects and does not autofix contract-sensitive values.

Exceptions apply only to this rule: retain magic-string enforcement at use sites. Required external literal values may need a separate, narrowly scoped `enforce-enum-casing` name override; keep your keys `CONSTANT_CASE`. Directly importing the provider enum avoids duplicating its literal definitions.

Reports: `objectInput`, `redundantObject`.

### `enforce-enum-casing`

Checks string literals in the first array or object passed directly to `em(...)` or `new Enumwaii(...)`. It does not need TypeScript parser services. Object keys always require `CONSTANT_CASE`. Tuple members and object values follow `valueCasing`: `"constant"` (the default), `"kebab"`, or `"snake"`. Non-literal values are outside its scope.

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
