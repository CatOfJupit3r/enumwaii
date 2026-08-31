# enumwaii

Enumwaii creates closed string vocabularies whose values retain the identity of
the declaration that owns them. At runtime, members are ordinary strings. In
TypeScript, a required brand prevents a matching raw string—or a member from a
different declaration—from silently entering application code.

Use enumwaii for values that are finite, authored, and behavior-driving:
permissions, workflow states, event kinds, access levels, provider codes, form
options, and persisted status fields. Do not use it for names, free-form input,
generated identifiers, or vocabularies that are intentionally open-ended.

## Minimal working path

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;

type Role = (typeof roles)["~type"];

function canManageUsers(role: Role): boolean {
  return role === ROLE.ADMIN;
}

const role = roles.parse(request.body.role);
canManageUsers(role);
```

Declare the complete vocabulary once, extract `.enum` once, use its members in
trusted application code, and parse unknown values where they enter the trusted
domain.

## The ownership model

- `ROLE.ADMIN` is a branded string owned by `roles`.
- The raw literal `"ADMIN"` is not assignable to the role type.
- A matching member from a different enumwaii declaration is not assignable.
- Declarations with the same complete canonical value set share an identity.
- `pick`, `omit`, and `extend` retain their source identity.
- `em.combine` derives identity from the complete combined member set.
- Brands exist only in TypeScript; runtime values serialize as normal strings.

The required brand is deliberate. A brandless design is more native-looking,
but TypeScript then accepts raw literals and structurally identical sets. Lint
rules cannot preserve ownership through every alias, generic, re-export,
consumer configuration, assertion, or JavaScript boundary.

## Member surfaces

Use `.enum` unless a documented exception applies.

| Surface      | Purpose                                                                                     |
| ------------ | ------------------------------------------------------------------------------------------- |
| `.enum`      | Named branded values for application code, comparisons, defaults, fixtures, and derivation. |
| `.values`    | Iterate over the branded member tuple.                                                      |
| `.rawEnum`   | Named unbranded values for an integration that rejects branded strings.                     |
| `.rawValues` | An unbranded tuple for database, provider, or schema metadata.                              |
| `.cases`     | Raw discriminants for native TypeScript union narrowing.                                    |

Extract member objects before using them:

```ts
const ROLE = roles.enum;
const ROLE_CASES = roles.cases;

ROLE.ADMIN; // preferred
roles.enum.ADMIN; // rejected by the type-aware lint preset
```

`.cases` is a narrow TypeScript escape hatch. Branded string intersections do
not reliably narrow native discriminated unions, so `.cases` supplies raw
literal tags for those union definitions and their `switch` or equality checks.
It is not a second general-purpose enum.

At runtime, `.enum`, `.rawEnum`, and `.cases` are static views of one frozen
plain object. Enumwaii intentionally does not use property-access proxy traps;
unknown properties behave normally and return `undefined`.

## Boundary parsing

```ts
const strict = roles.parse(input);

const result = roles.safeParse(input);
if (result.success) {
  useRole(result.value);
} else {
  report(result.error.receivedText);
}

if (roles.is(input)) {
  useRole(input);
}
```

- `parse` returns an owned member or throws `EnumwaiiParseError`.
- `safeParse` returns a discriminated success or failure result.
- `is` is a type guard.
- `default` applies only to `null` and `undefined`.
- `fallback` applies to every otherwise-invalid value.
- When both could handle a nil value, `default` wins.
- Defaults and fallbacks must themselves be owned members.

```ts
roles.parse(input, { default: ROLE.USER });
roles.parse(input, { fallback: ROLE.USER });
```

There is no serializer. Owned members already work with JSON, URLs, forms,
database drivers, structured cloning, and other string-based APIs.

## Standard Schema and adapters

Every enumwaii declaration implements Standard Schema v1 directly. Pass the
declaration itself to a compatible form, RPC, validation, or routing library:

```ts
consumer.acceptSchema(roles);
roles["~standard"].validate(input);
```

The protocol type comes from `@standard-schema/spec`; enumwaii does not maintain
or re-export a local copy. Use `enumwaii/zod` or `enumwaii/valibot` only when the
receiving API specifically requires that library's schema type. Those adapters
are optional entry points and preserve the branded output type.

## Composition and exhaustive data

```ts
const staffRoles = roles.pick([ROLE.ADMIN]);
const nonAdminRoles = roles.omit([ROLE.ADMIN]);
const extendedRoles = roles.extend(["OWNER"]);

const permissions = em(["READ", "WRITE"]);
const roleOrPermission = em.combine([roles, permissions]);
const ROLE_OR_PERMISSION = roleOrPermission.enum;
```

Use tuple-based derivation when every member needs application data. Tuples keep
source-member provenance; object keys cannot do so reliably in TypeScript.

```ts
const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
);

labels.get(ROLE.ADMIN);
labels.record.ADMIN;
```

`derive` also supports callbacks and contextual result typing.
`deriveTo(target, ...)` requires every result to be a member of another
declaration and supports a target member or an array of target members.

## Declaration-local types

When the declaration is in scope, prefer its type-only properties:

```ts
type Role = (typeof roles)["~type"];
type RoleKey = (typeof roles)["~keys"];
type RoleParseResult = (typeof roles)["~safeParseResult"];

const labels = {
  ADMIN: "Administrator",
  USER: "Member",
} as const satisfies Record<RoleKey, string>;
```

Use the exported `InferEnumwaii<T>` and `InferEnumwaiiCase<T>` utilities in
generic or cross-module code where a declaration-local property is awkward.

## What TypeScript cannot guarantee

Enumwaii cannot recover information erased before validation:

- runtime membership cannot determine which declaration produced an equal
  string;
- `any`, unsafe assertions, ignored errors, and plain JavaScript can bypass a
  brand;
- external JSON, routes, forms, environment variables, databases, providers,
  and agent output remain untrusted until parsed;
- object keys erase branded provenance;
- branded string discriminants do not reliably preserve native union narrowing.

Parse at boundaries, use `.cases` only for the narrowing limitation, and enable
the type-aware ESLint preset when the repository already uses ESLint.

## ESLint's role

`eslint-plugin-enumwaii` complements rather than replaces the type system.

- The syntax-only preset enforces `CONSTANT_CASE` declarations.
- The type-aware preset also enforces extracted member views, limits `.cases`,
  rejects raw comparisons and raw subset members, and guides discriminated
  unions away from structural `in` checks.
- Provenance-sensitive rules intentionally do not autofix.

## Agent workflow

When adopting enumwaii in an existing repository:

1. Inspect the package manager, runtimes, workspace graph, TypeScript and lint
   configuration, schemas, database layer, tests, and local agent instructions.
2. Find a genuinely closed vocabulary and trace its declaration, producers,
   parsers, comparisons, lookups, persistence, transport, fixtures, and exports.
3. Preserve public wire and persisted values unless a change is requested.
4. Migrate one representative vertical slice before attempting a broad rewrite.
5. Parse unknown input at its boundary and use extracted `.enum` members after
   that boundary.
6. Add focused tests for valid values, invalid input, defaults, fallbacks, and
   any integration adapter.
7. Run the repository's own format, type, lint, test, and build commands.

The hosted [enumwaii skill](https://catofjupit3r.github.io/enumwaii/skills/enumwaii/SKILL.md)
contains imperative implementation guidance for agents.

## Detailed sources

Each documentation page is also available as Markdown by appending `.md` to its
canonical documentation path.

- [Getting started](https://catofjupit3r.github.io/enumwaii/docs/getting-started.md)
- [Core API](https://catofjupit3r.github.io/enumwaii/docs/core-api.md)
- [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity.md)
- [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces.md)
- [Runtime boundaries](https://catofjupit3r.github.io/enumwaii/docs/runtime-boundaries.md)
- [Schemas and adapters](https://catofjupit3r.github.io/enumwaii/docs/adapters.md)
- [Derivation](https://catofjupit3r.github.io/enumwaii/docs/derivation.md)
- [ESLint plugin](https://catofjupit3r.github.io/enumwaii/docs/eslint-plugin.md)
- [API decisions and limitations](https://catofjupit3r.github.io/enumwaii/docs.md)
- [Generated API reference](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/)
- [Runnable application examples](https://catofjupit3r.github.io/enumwaii/docs/examples.md)
