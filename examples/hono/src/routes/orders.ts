import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import {
  ORDER_STATUS,
  describeOrderStatus,
  orderStatusSchema,
  transitionOrder,
} from "../domain/order-status";

export const orderRoutes = new Hono();

orderRoutes.post(
  "/status",
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
  (c) => c.json(describeOrderStatus(c.req.valid("json"))),
);

orderRoutes.get("/status", (c) => {
  const rawStatus = c.req.query("status");
  const result = orderStatusSchema.safeParse(rawStatus, {
    default: ORDER_STATUS.PENDING,
  });
  if (!result.success) {
    return c.json(
      {
        error: "Invalid order status",
        issues: [{ message: result.error.message }],
      },
      400,
    );
  }

  return c.json({
    ...describeOrderStatus(result.value),
    defaulted: rawStatus === undefined,
  });
});

orderRoutes.post("/transition/:from/:to", (c) => {
  const fromResult = orderStatusSchema.safeParse(c.req.param("from"));
  if (!fromResult.success) {
    return c.json(
      {
        error: "Invalid order status",
        field: "from",
        issues: [{ message: fromResult.error.message }],
      },
      400,
    );
  }

  const toResult = orderStatusSchema.safeParse(c.req.param("to"));
  if (!toResult.success) {
    return c.json(
      {
        error: "Invalid order status",
        field: "to",
        issues: [{ message: toResult.error.message }],
      },
      400,
    );
  }

  const status = transitionOrder(fromResult.value, toResult.value);
  return c.json({
    from: describeOrderStatus(fromResult.value),
    to: describeOrderStatus(status),
  });
});
