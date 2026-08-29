import { Hono } from "hono";

import { OrderTransitionConflict } from "./domain/order-status";
import { orderRoutes } from "./routes/orders";

export const app = new Hono();

app.route("/orders", orderRoutes);

app.onError((error, c) => {
  if (error instanceof OrderTransitionConflict) {
    return c.json(
      {
        error: "Order status transition conflict",
        from: error.from,
        to: error.to,
      },
      409,
    );
  }

  return c.json({ error: "Internal Server Error" }, 500);
});
