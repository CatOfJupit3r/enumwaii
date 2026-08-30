import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import {
  describeOrderStatus,
  ORDER_STATUS,
  ORDER_STATUS_VALUES,
  orderStatusSchema,
} from "../domain/order-status";

export function createStatusRoutes(): Hono {
  const statusRoutes = new Hono();

  statusRoutes.get("/statuses", (c) =>
    c.json({
      statuses: ORDER_STATUS_VALUES.map((status) => ({
        status,
        ...describeOrderStatus(status),
      })),
    }),
  );

  statusRoutes.post(
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

  statusRoutes.get("/status", (c) => {
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

  return statusRoutes;
}
