import { Hono } from "hono";

import { orderRoutes } from "./routes/orders";

export const app = new Hono();

app.route("/orders", orderRoutes);
