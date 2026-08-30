---
title: Schemas and adapters
description: Use native Standard Schema support or opt into Zod and Valibot entry points.
---

## Standard Schema is the default

An enumwaii declaration is already a Standard Schema v1 schema. Pass the
declaration itself to a compatible library; no wrapper or adapter is necessary.

```ts
const roles = em(["ADMIN", "USER"]);

form.register("role", roles);
router.input(roles);
```

Enumwaii imports and re-exports the official `StandardSchemaV1` type from
`@standard-schema/spec`. The spec package is a regular dependency because that
type appears in enumwaii's public declarations. It contributes no validation
runtime of its own.

`@standard-schema/utils` is not required by enumwaii. It is useful to authors of
generic Standard Schema tooling, but adding it to the runtime package would not
improve declaration validation or the consumer API.

## Zod

Install Zod only when an API specifically requires a Zod schema:

```sh
pnpm add zod
```

```ts
import { z } from "zod";
import { em } from "enumwaii";
import { zodSchema } from "enumwaii/zod";

const roles = em(["ADMIN", "USER"]);
const inputSchema = z.object({
  role: zodSchema(roles),
});

const input = inputSchema.parse(payload);
// input.role is the branded enumwaii member union
```

The adapter follows Zod's normal parse and error behavior while preserving the
branded output type.

## Valibot

Install Valibot only when the receiving API requires its schema type:

```sh
pnpm add valibot
```

```ts
import * as v from "valibot";
import { em } from "enumwaii";
import { valibotSchema } from "enumwaii/valibot";

const roles = em(["ADMIN", "USER"]);
const inputSchema = v.object({
  role: valibotSchema(roles),
});

const input = v.parse(inputSchema, payload);
// input.role is the branded enumwaii member union
```

Both library adapters are separate package entry points and both validator
packages are optional peers. Applications that use only Standard Schema do not
load either integration.
