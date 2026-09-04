import {
  ORDER_STATUS_URL,
  orderStatusUrlSchema,
  orderStatusUrlToDomain,
} from "./url-values";
import { sValidator } from "@hono/standard-validator";
import { Hono } from "hono";
import {
  describeOrderStatus,
  ORDER_STATUS_VALUES,
  orderStatusSchema,
} from "../domain/order-status";
export function createStatusRoutes(): Hono {
  const routes = new Hono();
  routes.get("/statuses", (c) =>
    c.json({
      statuses: ORDER_STATUS_VALUES.map((status) => ({
        status,
        ...describeOrderStatus(status),
      })),
    }),
  );
  routes.post(
    "/status/inspect",
    sValidator("json", orderStatusSchema, (result, c) =>
      result.success
        ? undefined
        : c.json(
            { error: "Invalid café order status", issues: result.error },
            400,
          ),
    ),
    (c) => {
      const status = c.req.valid("json");
      return c.json({ status, ...describeOrderStatus(status) });
    },
  );
  routes.get("/status", (c) => {
    const input = c.req.query("status");
    const result = orderStatusUrlSchema.safeParse(input, {
      default: ORDER_STATUS_URL.PLACED,
    });
    if (!result.success)
      return c.json(
        { error: "Invalid café order status", field: "status" },
        400,
      );
    const status = orderStatusUrlToDomain.get(result.value);
    return c.json({
      status,
      ...describeOrderStatus(status),
      defaulted: input === undefined,
    });
  });
  return routes;
}
