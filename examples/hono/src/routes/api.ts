import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import type { OrderRepository } from "../db/order-repository";
import {
  describeOrderStatus,
  ORDER_STATUS,
  orderStatusSchema,
  type OrderStatus,
} from "../domain/order-status";

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

function parseMemo(input: unknown): string | null {
  if (input === undefined || input === null || input === "") {
    return null;
  }
  if (typeof input !== "string" || input.length > 180) {
    throw new RequestInputError(
      "memo",
      "memo must be a string no longer than 180 characters",
    );
  }
  return input;
}

function parseOptionalStatus(input: unknown): OrderStatus | undefined {
  if (input === undefined || input === null) {
    return undefined;
  }
  const result = orderStatusSchema.safeParse(input);
  if (!result.success) {
    throw new RequestInputError("status", "status is not a known order member");
  }
  return result.value;
}

function parseTransitionInput(input: unknown): {
  readonly to: OrderStatus;
  readonly expectedVersion: number;
} {
  if (!isRecord(input)) {
    throw new RequestInputError("body", "request body must be a JSON object");
  }

  const statusResult = orderStatusSchema.safeParse(input.to);
  if (!statusResult.success) {
    throw new RequestInputError("to", "to is not a known order member");
  }

  const expectedVersion = input.expectedVersion;
  if (
    typeof expectedVersion !== "number" ||
    !Number.isInteger(expectedVersion) ||
    expectedVersion < 1
  ) {
    throw new RequestInputError(
      "expectedVersion",
      "expectedVersion must be a positive integer",
    );
  }

  return { to: statusResult.value, expectedVersion };
}

function presentOrder(order: Awaited<ReturnType<OrderRepository["create"]>>) {
  return {
    ...order,
    statusInfo: describeOrderStatus(order.status),
  };
}

export function createApiRoutes(repository: OrderRepository): Hono {
  const api = new Hono();

  api.get("/orders", async (c) => {
    const orders = await repository.list();
    return c.json({ orders: orders.map(presentOrder) });
  });

  api.post("/orders", async (c) => {
    const input: unknown = await c.req.json();
    if (!isRecord(input)) {
      throw new RequestInputError("body", "request body must be a JSON object");
    }

    const status = parseOptionalStatus(input.status);
    const order = await repository.create({
      memo: parseMemo(input.memo),
      ...(status === undefined ? {} : { status }),
    });

    return c.json(
      {
        order: presentOrder(order),
        defaulted: status === undefined,
      },
      201,
    );
  });

  api.post("/orders/:id/transition", async (c) => {
    const input: unknown = await c.req.json();
    const transition = parseTransitionInput(input);
    const order = await repository.transition(
      c.req.param("id"),
      transition.to,
      transition.expectedVersion,
    );
    return c.json({ order: presentOrder(order) });
  });

  api.post(
    "/status/inspect",
    sValidator("json", orderStatusSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            error: "Invalid order status",
            issues: result.error,
          },
          400,
        );
      }
    }),
    (c) => {
      const status = c.req.valid("json");
      return c.json({ status, ...describeOrderStatus(status) });
    },
  );

  api.get("/status", (c) => {
    const input = c.req.query("status");
    const result = orderStatusSchema.safeParse(input, {
      default: ORDER_STATUS.PENDING,
    });
    if (!result.success) {
      return c.json(
        {
          error: "Invalid order status",
          field: "status",
          issues: [{ message: result.error.message }],
        },
        400,
      );
    }

    return c.json({
      status: result.value,
      ...describeOrderStatus(result.value),
      defaulted: input === undefined,
    });
  });

  return api;
}
