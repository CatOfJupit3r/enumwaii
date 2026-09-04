import { sql } from "drizzle-orm";
import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import {
  DRINK_SIZE_DB_ENUM,
  DRINK_SIZE_DB_VALUES,
  ORDER_STATUS_DB_ENUM,
  ORDER_STATUS_DB_VALUES,
} from "../domain/order-status";

export const orderStatusDbEnum = pgEnum(
  "counter_order_status",
  ORDER_STATUS_DB_VALUES,
);
export const drinkSizeDbEnum = pgEnum(
  "counter_drink_size",
  DRINK_SIZE_DB_VALUES,
);
export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    status: orderStatusDbEnum("status")
      .notNull()
      .default(ORDER_STATUS_DB_ENUM.PLACED),
    drink: text("drink").notNull(),
    size: drinkSizeDbEnum("size").notNull().default(DRINK_SIZE_DB_ENUM.TALL),
    note: text("note"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "string", withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("orders_version_positive", sql`${table.version} > 0`)],
);
export type OrderSelect = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
