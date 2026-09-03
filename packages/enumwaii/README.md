<p align="center">
  <img src="https://catofjupit3r.github.io/enumwaii/icon.svg" alt="enumwaii" width="128" height="128">
</p>

<h1 align="center">enumwaii</h1>

<p align="center"><strong>String enums that know where they belong.</strong></p>

[Documentation](https://catofjupit3r.github.io/enumwaii/) · [API reference](https://catofjupit3r.github.io/enumwaii/docs/api/enumwaii/) · [Examples](https://github.com/CatOfJupit3r/enumwaii/tree/main/examples)

## Install

```sh
npm install enumwaii
```

OR

```sh
pnpm add enumwaii
```

OR

```sh
yarn add enumwaii
```

OR

```sh
bun add enumwaii
```

OR

```sh
deno add npm:enumwaii
```

## Quick start

```ts
import { em } from "enumwaii";

const roles = em(["ADMIN", "USER", "GUEST"]);
const ROLE = roles.enum;
type Role = (typeof roles)["~type"];

const role: Role = roles.parse(input);

role === ROLE.ADMIN;
// const invalid: Role = "ADMIN"; // TypeScript error
```

Members remain strings at runtime, so they serialize without wrappers. Their required TypeScript brand stops raw strings and members from incompatible declarations from entering an enum-typed position.

## Boundaries and recovery

```ts
roles.is(input);
roles.parse(input);
roles.safeParse(input);

roles.parse(input, { default: ROLE.GUEST }); // nil input only
roles.parse(input, { fallback: ROLE.USER }); // any invalid input
```

Every declaration implements Standard Schema v1 and can be passed directly to a compatible consumer.

## Composition and derivation

```ts
const staff = roles.pick([ROLE.ADMIN, ROLE.USER]);
const withoutGuests = roles.omit([ROLE.GUEST]);
const extended = roles.extend(["BOT"]);

const labels = roles.derive(
  [ROLE.ADMIN, "Administrator"],
  [ROLE.USER, "Member"],
  [ROLE.GUEST, "Guest"],
);

labels.get(ROLE.USER);
```

Duplicates are removed in first-seen order. `deriveTo` can additionally require one or many outputs from another enumwaii declaration.

For object-shaped outputs, provide the shared type once instead of repeating `satisfies` on every entry:

```ts
const metadata = roles.derive<RoleMetadata>()(
  [ROLE.ADMIN, { label: "Administrator", rank: 3 }],
  [ROLE.USER, { label: "Member", rank: 2 }],
  [ROLE.GUEST, { label: "Guest", rank: 1 }],
);
```

## Optional entry points

```ts
import { zodSchema } from "enumwaii/zod";
import { valibotSchema } from "enumwaii/valibot";
import { lowercase, uppercase } from "enumwaii/derive-with";
```

Zod and Valibot are optional peers. Install only the validator required by your integration.

## Member views

- `.enum` and `.values` are branded application surfaces.
- `.rawEnum` and `.rawValues` are unbranded integration escapes.
- `.cases` exists for native discriminated-union narrowing.
- `~type`, `~keys`, and `~safeParseResult` expose declaration-local TypeScript utilities.

Extract member views before referencing their members. The separate [`eslint-plugin-enumwaii`](https://www.npmjs.com/package/eslint-plugin-enumwaii) package can enforce this and related conventions.

Read [Member surfaces](https://catofjupit3r.github.io/enumwaii/docs/member-surfaces/) and [Branding and identity](https://catofjupit3r.github.io/enumwaii/docs/branding-and-identity/) before adopting a raw escape hatch.

## Compatibility

Node.js 18 or newer is supported. ESM and CommonJS entry points, declarations, and source maps are included. The ESM entry is also tested under Bun 1.4, Deno 2.9, and Cloudflare Workers without Node compatibility flags. See [releases and compatibility](https://catofjupit3r.github.io/enumwaii/docs/release-and-compatibility/).

## License

MIT
