import {
  check,
  integer,
  pgEnum,
  pgTable,
  text,
  timestamp,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

import {
  ORDER_STATUS_DB_ENUM,
  ORDER_STATUS_DB_VALUES,
} from "../domain/order-status";

/** Raw enum metadata is intentionally confined to the PostgreSQL schema. */
export const orderStatusDbEnum = pgEnum("order_status", ORDER_STATUS_DB_VALUES);

export const orders = pgTable(
  "orders",
  {
    id: text("id").primaryKey(),
    status: orderStatusDbEnum("status")
      .notNull()
      .default(ORDER_STATUS_DB_ENUM.PENDING),
    memo: text("memo"),
    version: integer("version").notNull().default(1),
    createdAt: timestamp("created_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", {
      mode: "string",
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (table) => [check("orders_version_positive", sql`${table.version} > 0`)],
);

export type OrderSelect = typeof orders.$inferSelect;
export type OrderInsert = typeof orders.$inferInsert;
