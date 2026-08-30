---
title: Member surfaces
description: Choose between .enum, .values, .rawEnum, .rawValues, and .cases.
---

An enumwaii declaration exposes several views of the same closed set. They are intentionally different at the type level.

```ts
const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
const RAW_ROLE = roles.rawEnum;
const ROLE_CASE = roles.cases;

ROLE.ADMIN; // branded application value
roles.values; // branded member tuple
RAW_ROLE.ADMIN; // raw literal "ADMIN"
roles.rawValues; // raw literal tuple
ROLE_CASE.ADMIN; // raw discriminant "ADMIN"
```

## `.enum`: the default

Use `.enum` for application values, comparisons, defaults, fixtures, function arguments, and derivation.

```ts
const ROLE = roles.enum;

function acceptRole(role: (typeof roles)["~type"]) {}

acceptRole(ROLE.ADMIN);
acceptRole("ADMIN"); // TypeScript error
```

If no documented exception applies, `.enum` is the correct surface.

Extract member views once and reference members through the extracted constant:

```ts
const ROLE = roles.enum;

ROLE.ADMIN; // preferred
roles.enum.ADMIN; // lint error
```

The same convention applies to `.rawEnum` and `.cases`. It makes the owning vocabulary visually stable and prevents instance expressions from leaking throughout application code. Other instance APIs such as `roles.parse(...)`, `roles.derive(...)`, and `roles.values` remain direct APIs.

## `.values`: branded iteration

Use `.values` when iterating over owned application members:

```ts
for (const role of roles.values) {
  acceptRole(role);
}
```

The tuple carries declaration provenance. Do not pass it back into `em()` to reconstruct another declaration; use the composition methods instead.

## `.rawEnum` and `.rawValues`: integration escapes

Some APIs require literal strings or literal arrays and cannot preserve enumwaii's brand. `.rawEnum` and `.rawValues` provide canonical unbranded values without making raw literals the normal authoring style.

```ts
const RAW_ROLE = roles.rawEnum;

provider.configure({ defaultRole: RAW_ROLE.USER });
database.defineEnum("role", roles.rawValues);
```

These surfaces should generally stay at an integration boundary. Returning their values to application code loses the ownership check; parse values coming back from that boundary.

## `.cases`: native discriminated-union narrowing

TypeScript does not reliably narrow discriminated unions when the discriminant is a branded string intersection. `.cases` exposes raw literal members so native `switch` and equality narrowing continue to work:

```ts
const EVENT_TYPE = em(["CREATED", "DELETED"]);
const EVENT_CASE = EVENT_TYPE.cases;

type Event =
  | { type: typeof EVENT_CASE.CREATED; record: Record<string, unknown> }
  | { type: typeof EVENT_CASE.DELETED; id: string };

function handle(event: Event) {
  switch (event.type) {
    case EVENT_CASE.CREATED:
      event.record; // correctly narrowed
      break;
    case EVENT_CASE.DELETED:
      event.id; // correctly narrowed
  }
}
```

`.cases` is not a second general-purpose enum. Individual case members are deliberately raw literals. The `.cases` object carries a type marker so enumwaii's lint rules can recognize its intended provenance and flag use outside discriminated-union positions.

Use `.enum` for ordinary values and `.cases` only where TypeScript narrowing requires raw discriminants.

## Runtime identity and object behavior

`.enum`, `.rawEnum`, and `.cases` are different static views of one canonical frozen object:

```ts
roles.enum === roles.rawEnum; // true
roles.enum === roles.cases; // true
```

They are plain objects, not proxies. Unknown properties behave like normal object properties and return `undefined`. This avoids surprising behavior when React, serializers, assertion libraries, inspectors, or promise detection probe an object.

The distinction between the surfaces exists entirely in TypeScript. Runtime code cannot recover which view a consumer used.

## Type-only properties

Three declaration-local properties exist only for TypeScript and are not emitted as runtime fields:

```ts
type Role = (typeof roles)["~type"];
type RoleKey = (typeof roles)["~keys"];
type RoleParseResult = (typeof roles)["~safeParseResult"];
```

- `~type` is the branded member union.
- `~keys` is the raw member union, useful for external records with `satisfies`.
- `~safeParseResult` is the exact discriminated result returned by this declaration's `safeParse` method.

```ts
const labels = {
  ADMIN: "Administrator",
  USER: "Member",
} as const satisfies Record<(typeof roles)["~keys"], string>;
```

Use `derive` instead when the record is part of enumwaii-controlled application behavior and source-member provenance matters.
