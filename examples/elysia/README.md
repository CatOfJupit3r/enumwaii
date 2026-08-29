# Elysia + enumwaii

This is a small theme API that uses enumwaii at several Elysia 1.4.30 boundaries.
It deliberately stays serverless in tests: every contract is exercised through
`app.handle(new Request(...))`, and nothing calls `listen`.

## Route matrix

| Route                                     | Boundary        | Behavior                                                                                                          |
| ----------------------------------------- | --------------- | ----------------------------------------------------------------------------------------------------------------- |
| `POST /v1/themes/selection`               | Scalar body     | Passes `themeSchema` directly as an Elysia Standard Schema and returns exhaustive derived metadata.               |
| `GET /v1/themes/lookup/:theme`            | Params object   | Uses Elysia's object schema for the params shape, extracts `params.theme`, then parses that scalar with enumwaii. |
| `GET /v1/themes/preference?theme=...`     | Query object    | Missing `theme` defaults to `SYSTEM`; malformed members fail strictly with a `400`.                               |
| `GET /v1/themes/recommendation?theme=...` | Query object    | Any invalid `theme` falls back to `SYSTEM`, making fallback behavior visibly different from default behavior.     |
| `GET /v1/themes/current`                  | Scalar response | Returns a branded domain value and validates it with `themeSchema` as the response Standard Schema.               |

`LIGHT`, `DARK`, and `SYSTEM` are the only valid members. The successful object
responses include `label`, `cssClass`, and `prefersDark` values from one
exhaustive `derive` mapping. Domain functions accept only the branded `Theme`
type; path and query strings are parsed before those functions are called.

## Elysia integration behavior

Elysia's [validation guide](https://elysiajs.com/essential/validation) accepts a
Standard Schema directly in `body`, `query`, `params`, and `response` route
fields. An enumwaii declaration is a scalar string schema, so it is correct as
the complete body or response schema. Query and params values, however, are
objects in Elysia. Supplying `themeSchema` as the schema for the whole query or
params object would be dishonest; this example uses an Elysia object schema for
the transport shape and explicitly parses the extracted scalar.

There is one Elysia 1.4.30 type-inference limitation to account for. Its exported
`UnwrapBodySchema<typeof themeSchema>` exposes enumwaii's branded output, but the
actual handler context applies Elysia's `PrettifyIfObject` mapping. A branded
string intersection is seen as an object by that conditional type, so the
mapped `body` is no longer assignable to `Theme`. Calling
`describeTheme(body)` therefore produces TS2345 in the installed version. The
selection handler calls `themeSchema.parse(body)` after Elysia validation. That
second membership check is an explicit type-boundary bridge that restores the
brand without `as`; it is not a substitute for Elysia's route validation.
`type-contract.test-d.ts` locks this behavior down and also proves that Elysia's
response schema rejects a handler returning the invalid literal `"NEON"`.

Standard Schema validates the value Elysia has parsed, not the request's media
type. The tests intentionally show that a `text/plain` body containing `DARK`
passes this scalar schema. If an endpoint must require JSON, validate the
`Content-Type` header separately. This follows Elysia's documented Standard
Schema caveat that content type is not inferred or validated automatically in
the same way as Elysia-native file schemas.

## Architecture and errors

The layers stay small and explicit:

- `src/domain/theme.ts` owns the enumwaii declaration, branded `Theme` type,
  exhaustive metadata, and domain functions.
- `src/http/theme-plugin.ts` is a named Elysia plugin. It groups the theme
  routes, owns transport extraction, and registers the documented
  [`onError` lifecycle](https://elysiajs.com/essential/life-cycle#on-error-error-handling)
  before the routes.
- `src/app.ts` mounts the plugin inside a `/v1` Elysia group.
- `app.test.ts` proves runtime status/body contracts through Fetch requests.
- `type-contract.test-d.ts` records compile-time brand and output contracts.

Direct Standard Schema failures are customized by the plugin's Elysia `onError`
lifecycle into `422 INVALID_THEME_REQUEST` responses. Object-boundary failures
raised after scalar extraction use a registered `ThemeBoundaryError` and become
`400 INVALID_THEME_VALUE` responses. A response-validation failure would be
mapped to `500 INVALID_THEME_RESPONSE`; the static contract demonstrates that a
known invalid handler result is rejected by TypeScript before such a route can
be added without an unsafe escape.

`default` and `fallback` have intentionally different contracts here. The
preference route uses `default`, so only a missing value becomes `SYSTEM` and an
unknown string remains an error. The recommendation route uses `fallback`, so
the same unknown string becomes `SYSTEM` with `resolution: "fallback"`.

## Run the checks

From the repository root:

```sh
pnpm --filter enumwaii-examples exec vitest run elysia
pnpm --filter enumwaii-examples run test:types
```
