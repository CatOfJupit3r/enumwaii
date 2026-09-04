import { Hono } from "hono";
import type { OrderRepository } from "../db/order-repository";
import { orderStatusUrlSchema, orderStatusUrlToDomain } from "./url-values";
import { ORDER_STATUS } from "../domain/order-status";
import { DASHBOARD_CSS, DASHBOARD_SCRIPT } from "../views/assets";
import { Dashboard } from "../views/dashboard";

export function createDashboardRoutes(repository: OrderRepository): Hono {
  const dashboard = new Hono();
  dashboard.get("/", async (c) => {
    const input = c.req.query("status");
    const result = orderStatusUrlSchema.safeParse(input);
    const fallback = input !== undefined && !result.success;
    const status = result.success
      ? orderStatusUrlToDomain.get(result.value)
      : fallback
        ? ORDER_STATUS.READY
        : undefined;
    const orders = (await repository.list()).filter(
      (order) => status === undefined || order.status === status,
    );
    return c.html(
      <Dashboard orders={orders} filter={status} fallback={fallback} />,
    );
  });
  dashboard.get("/assets/dashboard.css", (c) =>
    c.body(DASHBOARD_CSS, 200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/css; charset=utf-8",
    }),
  );
  dashboard.get("/assets/dashboard.js", (c) =>
    c.body(DASHBOARD_SCRIPT, 200, {
      "Cache-Control": "no-store",
      "Content-Type": "text/javascript; charset=utf-8",
    }),
  );
  return dashboard;
}
