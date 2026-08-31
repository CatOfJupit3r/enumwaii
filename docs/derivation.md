---
title: Derivation
description: Build exhaustive lookups that retain member provenance.
---

Derivation creates an exhaustive, frozen lookup from every source member to another value.

## Entry-based derivation

```ts twoslash
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;

const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
  [ROLE.GUEST, "Guest"],
);

labels.get(ROLE.ADMIN); // "Administrator" | "Member" | "Guest"
labels.record.ADMIN; // same runtime lookup through a raw-keyed record
```

TypeScript rejects missing entries, duplicate source members, raw source strings, and members from incompatible declarations.

## Contextually typed entries

When derived objects should all implement an existing application type, pass that type once and call the returned entry builder:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
// ---cut---
interface RoleMetadata {
  readonly label: string;
  readonly rank: number;
}

const metadata = roles.derive<RoleMetadata>()(
  [ROLE.ADMIN, { label: "Administrator", rank: 3 }],
  [ROLE.USER, { label: "Member", rank: 2 }],
  [ROLE.GUEST, { label: "Guest", rank: 1 }],
);
```

Every output is contextually checked as `RoleMetadata`, so object literals do not need a repeated `satisfies RoleMetadata`. The extra call preserves exact tuple inference: missing, duplicate, raw, and foreign source members are still rejected. `metadata.get(...)` returns `RoleMetadata` rather than a union of the individual object literal shapes.

## Why tuples instead of an object?

The API would ideally accept an object keyed by owned `.enum` members:

```ts no-twoslash
const labels = roles.derive({
  [ROLE.ADMIN]: "Administrator",
  [ROLE.USER]: "Member",
  [ROLE.GUEST]: "Guest",
});
```

This is the object-shaped API enumwaii originally targeted, but TypeScript erases the necessary ownership information before `derive` can inspect the argument. An enumwaii member is a branded string intersection such as `"ADMIN" & EnumwaiiBrand<...>`. When that value is used as a computed object key, TypeScript infers a string index signature rather than preserving the individual property name. Even a correctly exhaustive object therefore appears as `{ [x: string]: TValue }`, with `keyof` equal to `string | number`.

This standalone example reproduces the erasure without depending on enumwaii:

```ts
// @noErrors: false
// @errors: 2739
declare const brand: unique symbol;
type Owned<T extends string> = T & { readonly [brand]: "roles" };
type Role = Owned<"ADMIN"> | Owned<"USER">;

declare const ADMIN: Owned<"ADMIN">;
declare const USER: Owned<"USER">;

// A computed object key loses the branded member type.
const mapping = {
  [ADMIN]: "Administrator",
  [USER]: "Member",
} as const;

type InferredKeys = keyof typeof mapping;
//   ^?

const exhaustive: Record<"ADMIN" | "USER", string> = mapping;
// Type '{ readonly [x: string]: ... }' is missing ADMIN and USER.

// A tuple keeps the member in a value position.
const entries = [
  [ADMIN, "Administrator"],
  [USER, "Member"],
] as const satisfies readonly (readonly [Role, string])[];

type PreservedMembers = (typeof entries)[number][0];
//   ^?
```

Copy it into the [TypeScript Playground](https://www.typescriptlang.org/play/) to compare `InferredKeys` with `PreservedMembers` and inspect the failing exhaustive assignment. The tuple half isolates the compiler behavior rather than reimplementing `derive`: enumwaii builds its source-ownership, exhaustiveness, and duplicate checks on top of the member types that survive in those value positions.

No `derive` overload can then prove which members were supplied, reject a member from another declaration, or distinguish an owned member from a raw string. Reverse mapped types, exactness constraints, `NoInfer`, `const` type parameters, and template-literal key constraints were all prototyped; every approach received the same already-erased index signature.

The actual API moves every source member into a value position:

```ts twoslash
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
// ---cut---
const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
  [ROLE.GUEST, "Guest"],
);

const adminLabel = labels.get(ROLE.ADMIN);
//    ^?
```

Each array is a two-item `[owned member, output]` tuple, not an arbitrary nested array. The member's brand and declaration identity survive inference because it remains a value. The syntax is slightly longer, but it preserves the ownership guarantee instead of making `derive` an exception to the rest of the API.

## Callback derivation

Use a callback when every member follows the same transformation:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
// ---cut---
const lowerRoles = roles.derive((role) => role.toLowerCase());
```

Optional reusable callbacks are available from `enumwaii/derive-with`:

```ts
import { em } from "enumwaii";
import { lowercase } from "enumwaii/derive-with";

const roles = em(["ADMIN", "USER", "GUEST"]);
// ---cut---
const lowerRoles = roles.derive(lowercase);
```

The callback receives a branded source member. Callback derivation is exhaustive by construction because enumwaii invokes it once for every member.

## `deriveTo`

`deriveTo` additionally checks that every result belongs to a target enumwaii. A result may be one target member or an array of target members:

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
// ---cut---
const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;

const grants = roles.deriveTo(
  permissions,
  [ROLE.ADMIN, [PERMISSION.READ, PERMISSION.WRITE]],
  [ROLE.USER, PERMISSION.READ],
  [ROLE.GUEST, []],
);
```

Both sides use `.enum`: the first tuple item proves source provenance, and the second proves target provenance.

## `.get` and `.record`

Derived results expose two views:

- `.get(member)` accepts a branded source member and is the default application API.
- `.record` is a frozen raw-keyed record for integrations and APIs that need object-shaped data.

For inferred entry derivation, `.get` returns the union of all derived value types. A contextually typed `derive<TValue>()(...)` builder returns `TValue`. Neither form correlates a particular source argument with one tuple result.

At runtime, `.get` is a direct property lookup. It assumes the branded input promised by its TypeScript signature. Plain JavaScript or an unsafe cast can pass an invalid key and receive `undefined`; enumwaii deliberately does not add a proxy or lookup guard because those mechanisms increase integration friction and cannot recover true string provenance anyway.

Entry construction still checks missing, duplicate, and unknown raw keys at runtime, and `deriveTo` checks target membership. Those checks protect JavaScript and unsafe casts where the runtime can establish membership, but two equal strings from different declarations remain indistinguishable at runtime.
