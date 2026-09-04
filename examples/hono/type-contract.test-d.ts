import { expectTypeOf } from "vitest";
import type { OrderRepository } from "./src/db/order-repository";
import { hydrateOrder } from "./src/db/order-repository";
import type { OrderInsert, OrderSelect } from "./src/db/schema";
import {
  describeDrinkSize,
  describeOrderStatus,
  DRINK_SIZE,
  ORDER_STATUS,
  type DrinkSize,
  type OrderStatus,
} from "./src/domain/order-status";

expectTypeOf<OrderSelect["status"]>().toMatchTypeOf<string>();
expectTypeOf<OrderSelect["size"]>().toMatchTypeOf<string>();
expectTypeOf<OrderStatus>().not.toEqualTypeOf<OrderSelect["status"]>();
expectTypeOf<DrinkSize>().not.toEqualTypeOf<OrderSelect["size"]>();
expectTypeOf<OrderInsert>().toMatchTypeOf<{
  drink: string;
  size?: OrderSelect["size"];
}>();
expectTypeOf(
  hydrateOrder({
    id: "typed-row",
    status: "READY",
    drink: "Latte",
    size: "TALL",
    note: null,
    version: 1,
    createdAt: "2026-08-30T12:00:00.000Z",
    updatedAt: "2026-08-30T12:00:00.000Z",
  }),
).toMatchTypeOf<{ readonly status: OrderStatus; readonly size: DrinkSize }>();
declare const repository: OrderRepository;
void repository.create({
  drink: "Flat white",
  status: ORDER_STATUS.PLACED,
  size: DRINK_SIZE.SHORT,
});
// @ts-expect-error Raw strings must be parsed before entering domain logic.
describeOrderStatus("PLACED");
// @ts-expect-error Raw sizes must be parsed before price derivation.
describeDrinkSize("TALL");
// @ts-expect-error Persistence APIs accept owned enum members, not raw strings.
void repository.create({ drink: "Flat white", status: "PLACED" });
