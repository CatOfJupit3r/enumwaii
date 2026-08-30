import { Hono } from "hono";

import type { OrderRepository } from "../db/order-repository";
import { DASHBOARD_CSS, DASHBOARD_SCRIPT } from "../views/assets";
import { Dashboard } from "../views/dashboard";

export function createDashboardRoutes(repository: OrderRepository): Hono {
  const dashboard = new Hono();

  dashboard.get("/", async (c) => {
    const orders = await repository.list();
    return c.html(<Dashboard orders={orders} />);
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
