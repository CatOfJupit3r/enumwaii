import { expectTypeOf } from "vitest";
import {
  describeParcelStatus,
  COURIER,
  courierSchema,
  PARCEL_STATUS,
  type Courier,
  type ParcelStatus,
} from "./src/domain/parcel";

expectTypeOf<Courier>().not.toEqualTypeOf<"express" | "standard" | "cargo">();
expectTypeOf<ParcelStatus>().not.toEqualTypeOf<
  "created" | "in-transit" | "out-for-delivery" | "delivered" | "returned"
>();
expectTypeOf(COURIER.EXPRESS).toMatchTypeOf<Courier>();
expectTypeOf(PARCEL_STATUS.DELIVERED).toMatchTypeOf<ParcelStatus>();
// @ts-expect-error Raw strings must be parsed before entering derived domain logic.
describeParcelStatus("delivered");
const parsed = courierSchema.parse("express");
expectTypeOf(parsed).toMatchTypeOf<Courier>();
