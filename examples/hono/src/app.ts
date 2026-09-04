import { Hono } from "hono";
import {
  InvalidOrderRowError,
  OrderNotFoundError,
  type OrderRepository,
  OrderVersionConflict,
} from "./db/order-repository";
import { OrderTransitionConflict } from "./domain/order-status";
import { createApiRoutes, RequestInputError } from "./routes/api";
import { createDashboardRoutes } from "./routes/dashboard";
export type AppDependencies = { readonly orders: OrderRepository };
export function createApp(dependencies: AppDependencies): Hono {
  const app = new Hono();
  app.route("/api", createApiRoutes(dependencies.orders));
  app.route("/", createDashboardRoutes(dependencies.orders));
  app.notFound((c) => c.json({ error: "Not found" }, 404));
  app.onError((error, c) => {
    if (error instanceof RequestInputError)
      return c.json(
        {
          error: "Invalid request",
          field: error.field,
          message: error.message,
        },
        400,
      );
    if (error instanceof SyntaxError)
      return c.json({ error: "Malformed JSON body" }, 400);
    if (error instanceof OrderNotFoundError)
      return c.json({ error: "Order not found", orderId: error.orderId }, 404);
    if (error instanceof OrderTransitionConflict)
      return c.json(
        {
          error: "Illegal café order transition",
          from: error.from,
          to: error.to,
        },
        409,
      );
    if (error instanceof OrderVersionConflict)
      return c.json(
        {
          error: "Another barista already moved this order",
          orderId: error.orderId,
          expectedVersion: error.expectedVersion,
          actualVersion: error.actualVersion,
        },
        409,
      );
    if (error instanceof InvalidOrderRowError)
      return c.json(
        {
          error: "A migration went wrong: database row failed strict hydration",
          column: error.column,
        },
        500,
      );
    return c.json({ error: "Internal server error" }, 500);
  });
  return app;
}
