# Hono + enumwaii

This example keeps the application layers small but explicit:

- `src/domain/order-status.ts` owns the enumwaii declaration, its branded `OrderStatus` type, and exhaustive status metadata.
- `src/routes/orders.ts` owns HTTP boundary validation and passes only parsed `OrderStatus` values to the domain service.
- `src/app.ts` composes the exported Hono app.

`POST /orders/status` uses Hono's Standard Schema middleware directly. The
request body is a JSON scalar (`"PAID"`), so `sValidator("json",
orderStatusSchema)` can use enumwaii without pretending that enumwaii validates
an object shape. Invalid values receive a 400 response with an `Invalid order
status` error.

`GET /orders/status?status=SHIPPED` demonstrates the corresponding manual
boundary. Hono exposes query input as a record, while this enumwaii declaration
validates a scalar, so the route extracts `status`, calls `safeParse`, and only
then invokes the domain service.

From the repository root:

```sh
pnpm --filter enumwaii-examples exec vitest run hono
pnpm --filter enumwaii-examples run test:types
```
