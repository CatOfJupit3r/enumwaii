# enumwaii

String enums that are difficult for humans—and especially code-generating agents—to misuse.

```ts
import { em, type InferEnumwaii } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);

export const ROLE = roles.enum;
export const RAW_ROLE = roles.rawEnum;
export type Role = InferEnumwaii<typeof roles>;

const role: Role = roles.parse(input); // validate while deserializing
role === ROLE.ADMIN; // use the owning member, not a raw string
```

At runtime, a value is still a string, so JSON, URLs, databases, and structured cloning require no wrapper. At compile time, a brand prevents raw strings and members from declarations with different value sets from entering an enum-typed position.

Use `.rawEnum` when an integration needs canonical named members without enumwaii's brand, just as `.rawValues` provides the canonical unbranded array:

```ts
ROLE.ADMIN; // branded member
RAW_ROLE.ADMIN; // unbranded "ADMIN"
roles.rawValues; // readonly ["ADMIN", "USER", "GUEST"]
```

## Why `em()`

The short factory is deliberately values-only. Enumwaii derives its type identity from the complete member set, so there is no separate name to keep synchronized. Declarations with the same members are intentionally compatible.

```ts
const mode = em(["READ", "WRITE"]);
```

`CONSTANT_CASE` is not a runtime restriction. It belongs to `eslint-plugin-enumwaii`, where external wire values can opt out without needing a second runtime API.

## Deserialization and Standard Schema

An enumwaii declaration implements Standard Schema v1 directly.

```ts
roles.parse(JSON.parse(payload).role);

roles.parse(query.role, { default: ROLE.GUEST }); // null or undefined only
roles.parse(query.role, { fallback: ROLE.GUEST }); // any invalid input

const result = roles.safeParse(query.role);
if (result.success) useRole(result.value);

const standardSchema = roles;
standardSchema["~standard"].validate(input);
```

Consumers that accept Standard Schema need no adapter. Enumwaii uses the official `@standard-schema/spec` package for its public types; that package is types-only and adds no runtime code. For APIs coupled to a specific validator, optional entry points are available:

```ts
import { zodSchema } from "enumwaii/zod";
import { valibotSchema } from "enumwaii/valibot";

const zRole = zodSchema(roles);
const vRole = valibotSchema(roles);
```

Install only the adapter's peer dependency you use.

## Composition

```ts
const STAFF = roles.pick([ROLE.ADMIN, ROLE.USER]);
const NON_GUEST = roles.omit([ROLE.GUEST]);
const serviceRoles = roles.extend(["BOT"]);
const roleOrMode = em.combine([roles, mode]);

const labels = roles.derive({
  ADMIN: "Administrator",
  USER: "Member",
  GUEST: "Guest",
});

labels.get(role);
```

Declarations, extensions, and combinations remove duplicate members while preserving first-seen order.

`deriveTo` maps into another enumwaii and accepts either one target member or an array of target members:

```ts
const permissions = em(["READ", "WRITE"]);
const PERMISSION = permissions.enum;

const grants = roles.deriveTo(permissions, {
  ADMIN: [PERMISSION.READ, PERMISSION.WRITE],
  USER: PERMISSION.READ,
  GUEST: [],
});
```

Common `deriveWith` callbacks live in an optional subpath:

```ts
import { lowercase } from "enumwaii/derive-with";

const wireRoles = roles.deriveWith(lowercase);
```

For external records, use the declaration-local `~keys` type:

```ts
const labels = {
  ADMIN: "Administrator",
  USER: "Member",
  GUEST: "Guest",
} as const satisfies Record<(typeof roles)["~keys"], string>;

type RoleKeys = (typeof roles)["~keys"];
type Role = (typeof roles)["~type"];
```

`.rawEnum` exposes canonical unbranded members for integrations that cannot use enumwaii's branded values. `.cases` is reserved for native discriminated-union tags and carries declaration provenance used by the type-aware lint rules. Use `.enum` for ordinary application values.

## Linting

The lint rules are a separate package, following TanStack's split between runtime libraries and ESLint plugins. This keeps the runtime package lean.

```sh
pnpm add enumwaii
pnpm add -D eslint-plugin-enumwaii
```

For ESLint flat config, start with syntax-only rules or the type-aware set:

```js
import enumwaii from "eslint-plugin-enumwaii";

export default [
  ...enumwaii.configs["flat/recommended"],
  // Requires typescript-eslint parserOptions.projectService/project:
  ...enumwaii.configs["flat/recommended-type-checked"],
];
```

Oxlint can load the same package as a JavaScript plugin. Its JS plugin support is currently alpha; `enforce-enum-casing` is syntax-only, while the remaining rules require TypeScript parser services and should be run through ESLint for now.

```jsonc
{
  "jsPlugins": ["eslint-plugin-enumwaii"],
  "rules": { "enumwaii/enforce-enum-casing": "error" },
}
```

## Packages

- `enumwaii`: small runtime, official Standard Schema types, and optional Zod and Valibot adapters.
- `eslint-plugin-enumwaii`: syntax and type-aware enforcement rules.

## Development and releases

This repository uses pnpm, tsdown, Vitest, publint, Are The Types Wrong, and Changesets. Run `pnpm check` before a release. Add a changeset with `pnpm changeset`; the release workflow opens a version PR and publishes merged versions to npm with provenance.

## License

MIT
