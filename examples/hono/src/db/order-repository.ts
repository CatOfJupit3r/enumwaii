import { and, desc, eq, sql } from "drizzle-orm";
import {
  assertOrderTransition,
  drinkSizeSchema,
  DRINK_SIZE,
  orderStatusSchema,
  ORDER_STATUS,
  type DrinkSize,
  type OrderStatus,
} from "../domain/order-status";
import type { OrderDatabase } from "./client";
import { orders, type OrderInsert, type OrderSelect } from "./schema";

export type Order = {
  readonly id: string;
  readonly status: OrderStatus;
  readonly drink: string;
  readonly size: DrinkSize;
  readonly note: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};
export type NewOrder = {
  readonly id?: string;
  readonly status?: OrderStatus;
  readonly drink: string;
  readonly size?: DrinkSize;
  readonly note?: string | null;
};
export type OrderRowErrorColumn = "row" | keyof OrderSelect;
export class InvalidOrderRowError extends Error {
  public constructor(
    public readonly column: OrderRowErrorColumn,
    public readonly value: unknown,
  ) {
    super(`Invalid café order ${column}: ${String(value)}`);
    this.name = "InvalidOrderRowError";
  }
}
export class OrderNotFoundError extends Error {
  public constructor(public readonly orderId: string) {
    super(`Order ${orderId} was not found`);
    this.name = "OrderNotFoundError";
  }
}
export class OrderVersionConflict extends Error {
  public constructor(
    public readonly orderId: string,
    public readonly expectedVersion: number,
    public readonly actualVersion: number,
  ) {
    super(
      `Order ${orderId} is at version ${actualVersion}, not ${expectedVersion}`,
    );
    this.name = "OrderVersionConflict";
  }
}
function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
function invalidRow(column: OrderRowErrorColumn, value: unknown) {
  return new InvalidOrderRowError(column, value);
}
function timestamp(
  column: keyof Pick<OrderSelect, "createdAt" | "updatedAt">,
  value: unknown,
): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value)))
    throw invalidRow(column, value);
  return new Date(value).toISOString();
}
/** A bad historical DB value fails closed: do not invent a café status during hydration. */
export function hydrateOrder(input: unknown): Order {
  if (!isRecord(input)) throw invalidRow("row", input);
  if (typeof input.id !== "string" || input.id.length === 0)
    throw invalidRow("id", input.id);
  if (typeof input.drink !== "string" || input.drink.length === 0)
    throw invalidRow("drink", input.drink);
  const status = orderStatusSchema.safeParse(input.status);
  if (!status.success) throw invalidRow("status", input.status);
  const size = drinkSizeSchema.safeParse(input.size);
  if (!size.success) throw invalidRow("size", input.size);
  if (input.note !== null && typeof input.note !== "string")
    throw invalidRow("note", input.note);
  if (
    typeof input.version !== "number" ||
    !Number.isInteger(input.version) ||
    input.version < 1
  )
    throw invalidRow("version", input.version);
  return {
    id: input.id,
    status: status.value,
    drink: input.drink,
    size: size.value,
    note: input.note,
    version: input.version,
    createdAt: timestamp("createdAt", input.createdAt),
    updatedAt: timestamp("updatedAt", input.updatedAt),
  };
}
function prepareOrderInsert(input: NewOrder): OrderInsert {
  const insert: OrderInsert = {
    id: input.id ?? globalThis.crypto.randomUUID(),
    drink: input.drink,
    note: input.note ?? null,
    size: input.size ?? DRINK_SIZE.TALL,
  };
  if (input.status !== undefined) insert.status = input.status;
  return insert;
}
export class OrderRepository {
  public constructor(private readonly db: OrderDatabase) {}
  public async seed(): Promise<void> {
    await this.db
      .insert(orders)
      .values([
        {
          id: "marin-oat-latte",
          status: ORDER_STATUS.PLACED,
          drink: "Oat latte",
          size: DRINK_SIZE.GRANDE,
          note: "Extra hot for Marin",
        },
        {
          id: "sol-espresso",
          status: ORDER_STATUS.BREWING,
          drink: "Espresso",
          size: DRINK_SIZE.SHORT,
          note: "Double shot",
        },
        {
          id: "noa-matcha",
          status: ORDER_STATUS.READY,
          drink: "Iced matcha",
          size: DRINK_SIZE.TALL,
          note: "Light ice",
        },
      ])
      .onConflictDoNothing();
  }
  public async list(): Promise<readonly Order[]> {
    return (
      await this.db
        .select()
        .from(orders)
        .orderBy(desc(orders.createdAt), desc(orders.id))
    ).map(hydrateOrder);
  }
  public async create(input: NewOrder): Promise<Order> {
    const [row] = await this.db
      .insert(orders)
      .values(prepareOrderInsert(input))
      .returning();
    if (row === undefined)
      throw new Error("PostgreSQL did not return the inserted order");
    return hydrateOrder(row);
  }
  public async transition(
    orderId: string,
    to: OrderStatus,
    expectedVersion: number,
  ): Promise<Order> {
    const [selected] = await this.db
      .select()
      .from(orders)
      .where(eq(orders.id, orderId))
      .limit(1);
    if (selected === undefined) throw new OrderNotFoundError(orderId);
    const current = hydrateOrder(selected);
    if (current.version !== expectedVersion)
      throw new OrderVersionConflict(orderId, expectedVersion, current.version);
    assertOrderTransition(current.status, to);
    const [updated] = await this.db
      .update(orders)
      .set({
        status: to,
        version: sql`${orders.version} + 1`,
        updatedAt: sql`now()`,
      })
      .where(and(eq(orders.id, orderId), eq(orders.version, expectedVersion)))
      .returning();
    if (updated === undefined) {
      const [latest] = await this.db
        .select({ version: orders.version })
        .from(orders)
        .where(eq(orders.id, orderId))
        .limit(1);
      if (latest === undefined) throw new OrderNotFoundError(orderId);
      throw new OrderVersionConflict(orderId, expectedVersion, latest.version);
    }
    return hydrateOrder(updated);
  }
}
