import { expectTypeOf } from "vitest";

import type { OrderRepository } from "./src/db/order-repository";
import { hydrateOrder } from "./src/db/order-repository";
import type { OrderInsert, OrderSelect } from "./src/db/schema";
import {
  describeOrderStatus,
  ORDER_STATUS,
  type OrderStatus,
} from "./src/domain/order-status";

type DatabaseStatus = OrderSelect["status"];

expectTypeOf<DatabaseStatus>().toEqualTypeOf<
  "PENDING" | "PAID" | "SHIPPED" | "CANCELLED"
>();
expectTypeOf<OrderStatus>().not.toEqualTypeOf<DatabaseStatus>();
expectTypeOf<OrderInsert>().toMatchTypeOf<{
  id: string;
  status?: DatabaseStatus;
  memo?: string | null;
}>();
expectTypeOf(
  hydrateOrder({
    id: "typed-row",
    status: "PAID",
    memo: null,
    version: 1,
    createdAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
  }),
).toMatchTypeOf<{ readonly status: OrderStatus }>();

declare const repository: OrderRepository;
void repository.create({ status: ORDER_STATUS.PAID });

// @ts-expect-error Raw strings must be parsed before entering domain logic.
describeOrderStatus("PAID");
// @ts-expect-error Persistence APIs accept an owned status, not a raw string.
void repository.create({ status: "PAID" });
