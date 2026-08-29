# Branding and identity

## The required brand

Enumwaii members are string literals intersected with a declaration identity:

```ts
const roles = em(["ADMIN", "USER"]);
const ROLE = roles.enum;
type Role = (typeof roles)["~type"];

const role: Role = ROLE.ADMIN; // valid
const rawRole: Role = "ADMIN"; // TypeScript error
```

At runtime, `ROLE.ADMIN === "ADMIN"`. The brand has no runtime property and adds no serialization cost. Its job is to stop an unvalidated string from entering a position that promises an owned enumwaii member.

We keep the brand required because rejecting raw strings is the library's defining guarantee. A brandless default would feel closer to a native string union, but it would also permit exactly the accidental raw-string flow enumwaii exists to prevent.

## How identity is chosen

`em()` derives identity from the complete union of declared members. There is no name argument.

```ts
const first = em(["ON", "OFF"]);
const second = em(["OFF", "ON"]);

const value: (typeof second)["~type"] = first.enum.ON; // valid
```

Declarations with the same complete member set are intentionally compatible, regardless of order. Declarations with different sets are distinct, even when an individual raw value overlaps:

```ts
const roles = em(["ADMIN", "USER"]);
const legacyRoles = em(["ADMIN"]);

// TypeScript error: the declarations have different identities.
const role: (typeof roles)["~type"] = legacyRoles.enum.ADMIN;
```

This is set identity, not instance identity. Enumwaii cannot distinguish two separately-created declarations with exactly the same members without asking users to supply an additional nominal token or name. We chose values-only declarations because they are easier to keep synchronized and because independently declared equivalent sets should interoperate.

## Composition and identity

Composition preserves or deliberately creates identity as follows:

- `pick` and `omit` retain the source declaration's identity. Their members remain a subset of the original domain.
- `extend` retains the source identity while adding members to that domain.
- `em.combine` creates an identity from the combined member set.
- Duplicate runtime values are removed in first-seen order.

Use these operations instead of reconstructing declarations from `.rawValues`; reconstruction creates identity from the new complete set and discards the relationship TypeScript knew about the source.

## Limitations

The brand is a TypeScript constraint, not a security boundary.

- `as`, `any`, `unknown` casts, `@ts-ignore`, or plain JavaScript can bypass it.
- Runtime strings contain no provenance. If two declarations both contain `"ADMIN"`, runtime code cannot determine which declaration produced the string.
- Values loaded from JSON, a database, a URL, or a provider must enter through `parse`, `safeParse`, `is`, or Standard Schema validation.
- Some TypeScript control-flow features do not narrow branded string intersections correctly. `.cases` exists for one important instance of this limitation.

See [member surfaces](./member-surfaces.md) for `.cases` and [runtime boundaries](./runtime-boundaries.md) for safely introducing external values.
