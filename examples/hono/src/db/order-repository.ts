import { randomUUID } from "node:crypto";

import { and, desc, eq, sql } from "drizzle-orm";

import {
  assertOrderTransition,
  ORDER_STATUS,
  orderStatusSchema,
  type OrderStatus,
} from "../domain/order-status";
import type { OrderDatabase } from "./client";
import { orders, type OrderInsert, type OrderSelect } from "./schema";

export type Order = {
  readonly id: string;
  readonly status: OrderStatus;
  readonly memo: string | null;
  readonly version: number;
  readonly createdAt: string;
  readonly updatedAt: string;
};

export type NewOrder = {
  readonly id?: string;
  readonly status?: OrderStatus;
  readonly memo?: string | null;
};

export type OrderRowErrorColumn = "row" | keyof OrderSelect;

export class InvalidOrderRowError extends Error {
  public constructor(
    public readonly column: OrderRowErrorColumn,
    public readonly value: unknown,
  ) {
    super(`Invalid orders.${column} database value: ${String(value)}`);
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

function invalidRow(
  column: OrderRowErrorColumn,
  value: unknown,
): InvalidOrderRowError {
  return new InvalidOrderRowError(column, value);
}

function hydrateTimestamp(
  column: "createdAt" | "updatedAt",
  value: unknown,
): string {
  if (typeof value !== "string" || Number.isNaN(Date.parse(value))) {
    throw invalidRow(column, value);
  }
  return new Date(value).toISOString();
}

/** Strictly restore the nominal status brand at the untrusted driver edge. */
export function hydrateOrder(input: unknown): Order {
  if (!isRecord(input)) {
    throw invalidRow("row", input);
  }

  const id = input.id;
  if (typeof id !== "string" || id.length === 0) {
    throw invalidRow("id", id);
  }

  const statusResult = orderStatusSchema.safeParse(input.status);
  if (!statusResult.success) {
    throw invalidRow("status", input.status);
  }

  const memo = input.memo;
  if (memo !== null && typeof memo !== "string") {
    throw invalidRow("memo", memo);
  }

  const version = input.version;
  if (
    typeof version !== "number" ||
    !Number.isInteger(version) ||
    version < 1
  ) {
    throw invalidRow("version", version);
  }

  return {
    id,
    status: statusResult.value,
    memo,
    version,
    createdAt: hydrateTimestamp("createdAt", input.createdAt),
    updatedAt: hydrateTimestamp("updatedAt", input.updatedAt),
  };
}

function prepareOrderInsert(input: NewOrder): OrderInsert {
  const insert: OrderInsert = {
    id: input.id ?? randomUUID(),
    memo: input.memo ?? null,
  };
  if (input.status !== undefined) {
    insert.status = input.status;
  }
  return insert;
}

export class OrderRepository {
  public constructor(private readonly db: OrderDatabase) {}

  public async seed(): Promise<void> {
    await this.db
      .insert(orders)
      .values([
        {
          id: "demo-pending",
          status: ORDER_STATUS.PENDING,
          memo: "Confirm delivery window with the customer",
        },
        {
          id: "demo-paid",
          status: ORDER_STATUS.PAID,
          memo: "Priority pack · north warehouse",
        },
        {
          id: "demo-shipped",
          status: ORDER_STATUS.SHIPPED,
          memo: "Carrier scan complete",
        },
      ])
      .onConflictDoNothing();
  }

  public async list(): Promise<readonly Order[]> {
    const rows = await this.db
      .select()
      .from(orders)
      .orderBy(desc(orders.createdAt), desc(orders.id));
    return rows.map(hydrateOrder);
  }

  public async create(input: NewOrder): Promise<Order> {
    const [row] = await this.db
      .insert(orders)
      .values(prepareOrderInsert(input))
      .returning();
    if (row === undefined) {
      throw new Error("PostgreSQL did not return the inserted order");
    }
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
    if (selected === undefined) {
      throw new OrderNotFoundError(orderId);
    }

    const current = hydrateOrder(selected);
    if (current.version !== expectedVersion) {
      throw new OrderVersionConflict(orderId, expectedVersion, current.version);
    }
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
      if (latest === undefined) {
        throw new OrderNotFoundError(orderId);
      }
      throw new OrderVersionConflict(orderId, expectedVersion, latest.version);
    }

    return hydrateOrder(updated);
  }
}
