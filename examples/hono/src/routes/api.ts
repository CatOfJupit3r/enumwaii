import { Hono } from "hono";
import type { OrderRepository } from "../db/order-repository";
import {
  describeDrinkSize,
  describeOrderStatus,
  drinkSizeSchema,
  orderStatusSchema,
  type DrinkSize,
  type OrderStatus,
} from "../domain/order-status";
import { createMenuRoutes } from "./menu";
import { createStatusRoutes } from "./status";
export class RequestInputError extends Error {
  public constructor(
    public readonly field: string,
    message: string,
  ) {
    super(message);
    this.name = "RequestInputError";
  }
}
function isRecord(input: unknown): input is Record<string, unknown> {
  return typeof input === "object" && input !== null && !Array.isArray(input);
}
function parseString(
  input: unknown,
  field: string,
  required = false,
): string | null {
  if (input === undefined || input === null || input === "") {
    if (required) throw new RequestInputError(field, `${field} is required`);
    return null;
  }
  if (typeof input !== "string" || input.length > 180)
    throw new RequestInputError(
      field,
      `${field} must be a string no longer than 180 characters`,
    );
  return input;
}
function parseEnum(
  input: unknown,
  schema: typeof orderStatusSchema | typeof drinkSizeSchema,
  field: string,
): OrderStatus | DrinkSize | undefined {
  if (input === undefined || input === null) return undefined;
  const parsed = schema.safeParse(input);
  if (!parsed.success)
    throw new RequestInputError(field, `${field} is not a known enum member`);
  return parsed.value;
}
function parseTransition(input: unknown): {
  to: OrderStatus;
  expectedVersion: number;
} {
  if (!isRecord(input))
    throw new RequestInputError("body", "request body must be a JSON object");
  const to = parseEnum(input.to, orderStatusSchema, "to");
  if (to === undefined) throw new RequestInputError("to", "to is required");
  const expectedVersion = input.expectedVersion;
  if (
    typeof expectedVersion !== "number" ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1
  )
    throw new RequestInputError(
      "expectedVersion",
      "expectedVersion must be a positive integer",
    );
  return { to: to as OrderStatus, expectedVersion };
}
function presentOrder(order: Awaited<ReturnType<OrderRepository["create"]>>) {
  return {
    ...order,
    statusInfo: describeOrderStatus(order.status),
    sizeInfo: describeDrinkSize(order.size),
  };
}
export function createApiRoutes(repository: OrderRepository): Hono {
  const api = new Hono();
  api.get("/orders", async (c) =>
    c.json({ orders: (await repository.list()).map(presentOrder) }),
  );
  api.post("/orders", async (c) => {
    const input: unknown = await c.req.json();
    if (!isRecord(input))
      throw new RequestInputError("body", "request body must be a JSON object");
    const status = parseEnum(input.status, orderStatusSchema, "status") as
      OrderStatus | undefined;
    const size = parseEnum(input.size, drinkSizeSchema, "size") as
      DrinkSize | undefined;
    const drink = parseString(input.drink, "drink", true);
    const order = await repository.create({
      drink: drink!,
      note: parseString(input.note, "note"),
      ...(status === undefined ? {} : { status }),
      ...(size === undefined ? {} : { size }),
    });
    return c.json(
      { order: presentOrder(order), defaulted: status === undefined },
      201,
    );
  });
  api.post("/orders/:id/transition", async (c) => {
    const transition = parseTransition(await c.req.json());
    return c.json({
      order: presentOrder(
        await repository.transition(
          c.req.param("id"),
          transition.to,
          transition.expectedVersion,
        ),
      ),
    });
  });
  api.route("/", createStatusRoutes());
  api.route("/", createMenuRoutes());
  return api;
}
