import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";

import {
  describeOrderStatus,
  orderStatusSchema,
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
  const result = orderStatusSchema.safeParse(c.req.query("status"));
  if (!result.success) {
    return c.json(
      {
        error: "Invalid order status",
        issues: [{ message: result.error.message }],
      },
      400,
    );
  }

  return c.json(describeOrderStatus(result.value));
});
