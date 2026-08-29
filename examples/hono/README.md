# Hono + enumwaii

This example keeps the application layers small but explicit:

- `src/domain/order-status.ts` owns the enumwaii declaration, its branded `OrderStatus` type, and exhaustive status metadata.
- `src/routes/orders.ts` owns HTTP boundary validation and passes only parsed `OrderStatus` values to the domain operations.
- `src/app.ts` composes the exported Hono app and maps domain transition conflicts to a Hono-native 409 response.

`POST /orders/status` uses Hono's Standard Schema middleware directly. The
request body is a JSON scalar (`"PAID"`), so `sValidator("json",
orderStatusSchema)` can use enumwaii without pretending that enumwaii validates
an object shape. Invalid values receive a 400 response with an `Invalid order
status` error.

`GET /orders/status?status=SHIPPED` demonstrates the corresponding manual
boundary. Hono exposes query input as a record, while this enumwaii declaration
validates a scalar, so the route extracts `status`, calls `safeParse`, and only
then invokes the domain operation. A missing query uses the owned
`ORDER_STATUS.PENDING` default; a supplied malformed value remains a 400.

`POST /orders/transition/:from/:to` extracts two scalar path values from
Hono's params record, validates both with enumwaii, and applies an exhaustive
`deriveTo` transition map. `PENDING -> PAID` succeeds, while any disallowed
transition (including a transition out of terminal `SHIPPED`) is rejected by
the branded domain operation and becomes a 409 response through `app.onError`.

| Route                               | Boundary case                     | Result                            |
| ----------------------------------- | --------------------------------- | --------------------------------- |
| `POST /orders/status`               | valid JSON scalar                 | 200 with status metadata          |
| `POST /orders/status`               | unknown value or wrong primitive  | 400                               |
| `GET /orders/status`                | missing `status`                  | 200 using owned `PENDING` default |
| `GET /orders/status`                | malformed `status`                | 400                               |
| `POST /orders/transition/:from/:to` | allowed transition                | 200                               |
| `POST /orders/transition/:from/:to` | disallowed or terminal transition | 409                               |

From the repository root:

```sh
pnpm --filter enumwaii-examples exec vitest run hono
pnpm --filter enumwaii-examples run test:types
```
