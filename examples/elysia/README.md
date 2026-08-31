# Elysia + enumwaii

```sh
pnpm --filter @enumwaii/example-elysia dev
```

Open [http://localhost:3000](http://localhost:3000) for the Theme Boundary Console: a responsive, interactive playground backed by the real API. It runs Elysia 1.4 on Node through the official `@elysia/node` adapter. Set `PORT` to change the default port of `3000`.

TypeBox is intentionally pinned to `0.34.51`: the published `0.34.52` artifact omits `anyschema.mjs` even though its ESM barrel imports that runtime module.

## UI tour

The console turns each enum boundary into a small request lab:

- **Scalar request** sends `LIGHT`, `DARK`, `SYSTEM`, an unknown member, the wrong primitive type, or a `text/plain` body to the direct Standard Schema body route.
- **Object-shaped params** shows Elysia validating the params object before the handler extracts and parses its scalar `theme` value.
- **Absence versus malformed input** contrasts a missing-value `default`, a strict unknown-member failure, and an invalid-input `fallback`.
- **Scalar response** reads the current branded domain value through an enumwaii response schema.
- **Response inspector** displays the real status, media type, latency, and response body for every browser `fetch` call.

No client-side code reimplements enum validation. The browser invokes the same grouped Elysia plugin exercised by the tests.

## API tour

| Route | Boundary | Behavior |
| --- | --- | --- |
| `POST /v1/themes/selection` | Scalar body | Passes `themeSchema` directly as an Elysia Standard Schema and returns exhaustive derived metadata. |
| `GET /v1/themes/lookup/:theme` | Params object | Uses Elysia's object schema for the params shape, extracts `params.theme`, then parses that scalar with enumwaii. |
| `GET /v1/themes/preference?theme=...` | Query object | Missing `theme` defaults to `SYSTEM`; malformed members fail strictly with a `400`. |
| `GET /v1/themes/recommendation?theme=...` | Query object | Any invalid `theme` falls back to `SYSTEM`, making fallback visibly different from default. |
| `GET /v1/themes/current` | Scalar response | Returns a branded domain value and validates it with `themeSchema` as the response Standard Schema. |

`LIGHT`, `DARK`, and `SYSTEM` are the only valid members. Successful object responses include `label`, `cssClass`, and `prefersDark` from one exhaustive `derive` mapping. Domain functions accept only branded `Theme` values.

## Try it with curl

Run the development server, then call the same boundaries directly:

```sh
# Direct scalar Standard Schema body
curl -i -X POST http://localhost:3000/v1/themes/selection \
  -H "Content-Type: application/json" \
  --data '"DARK"'

# Wrong primitive type -> customized 422
curl -i -X POST http://localhost:3000/v1/themes/selection \
  -H "Content-Type: application/json" \
  --data '42'

# Params object -> extracted scalar parse
curl -i http://localhost:3000/v1/themes/lookup/LIGHT
curl -i http://localhost:3000/v1/themes/lookup/NEON

# Missing uses default; malformed remains strict
curl -i http://localhost:3000/v1/themes/preference
curl -i "http://localhost:3000/v1/themes/preference?theme=NEON"

# The same malformed value uses fallback here
curl -i "http://localhost:3000/v1/themes/recommendation?theme=NEON"

# Standard Schema response
curl -i http://localhost:3000/v1/themes/current

# Membership passes even with text/plain; media type is a separate boundary
curl -i -X POST http://localhost:3000/v1/themes/selection \
  -H "Content-Type: text/plain" \
  --data 'DARK'
```

## Elysia integration behavior

Elysia's [validation guide](https://elysiajs.com/essential/validation) accepts a Standard Schema directly in `body`, `query`, `params`, and `response` route fields. An enumwaii declaration is a scalar string schema, so it is correct as the complete body or response schema. Query and params values are objects in Elysia, so this example uses framework-native object schemas for their transport shape and explicitly parses the extracted scalar. There is no hand-written schema wrapper.

Elysia 1.4.30 has one type-inference limitation relevant to branded strings. Its exported `UnwrapBodySchema<typeof themeSchema>` exposes enumwaii's branded output, but the actual handler context applies Elysia's `PrettifyIfObject` mapping. A branded string intersection is treated as an object, so the mapped `body` is no longer assignable to `Theme`. Calling `describeTheme(body)` produces TS2345 in this installed version.

The selection handler therefore calls `themeSchema.parse(body)` after Elysia validation. That second membership check is an explicit type-boundary bridge: it restores the brand without `as` and does not replace route validation. `type-contract.test-d.ts` locks down this behavior and proves that the response schema rejects a handler returning the invalid literal `"NEON"`.

Standard Schema validates the value Elysia parsed, not the request media type. The test suite intentionally proves that a `text/plain` body containing `DARK` passes this scalar schema. Require JSON with separate header validation when an endpoint needs that policy; Elysia documents the related content-type caveat for Standard Schema file validation.

## Architecture and errors

- `src/domain/theme.ts` owns the declaration, extracted member view, branded type, exhaustive metadata, and domain functions.
- `src/http/theme-plugin.ts` is a named plugin that groups the API routes, owns transport extraction, and registers the documented [`onError` lifecycle](https://elysiajs.com/essential/life-cycle#on-error-error-handling) before its routes.
- `src/ui/dashboard.ts` renders the dependency-free browser playground.
- `src/app.ts` configures the official Node adapter, serves `/`, and mounts the plugin in the `/v1` group. It never starts a listener.
- `src/server.ts` is the only listening entrypoint and reads `PORT`.
- `app.test.ts` exercises the app through `app.handle(new Request(...))`.
- `type-contract.test-d.ts` records compile-time brand and output contracts.

Direct Standard Schema failures become customized `422 INVALID_THEME_REQUEST` responses through Elysia's error lifecycle. Object-boundary failures raised after scalar extraction use the registered `ThemeBoundaryError` and become `400 INVALID_THEME_VALUE` responses. A response validation failure maps to `500 INVALID_THEME_RESPONSE`; a known invalid return is rejected by TypeScript before it can become a runtime route.

## Build and verify

```sh
pnpm --filter @enumwaii/example-elysia test
pnpm --filter @enumwaii/example-elysia test:types
pnpm --filter @enumwaii/example-elysia build
pnpm --filter @enumwaii/example-elysia start
```

`build` emits an ESM Node application to `dist/server.mjs`; `start` runs that production artifact. Tests import the configured app and use Fetch requests without importing `src/server.ts`, so they never bind a port.
