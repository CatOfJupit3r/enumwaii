import { Hono } from "hono";

import { createStatusRoutes } from "../src/routes/status";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    service: "Orderline portable boundary worker",
    runtime: "Cloudflare Workers",
    persistence:
      "The PGlite order console runs on Node, Bun, and Deno; this Worker exposes the shared database-free enum boundary routes.",
    endpoints: {
      statuses: "GET /api/statuses",
      selection: "GET /api/status?status=PAID",
      standardSchema: "POST /api/status/inspect",
    },
  }),
);

app.route("/api", createStatusRoutes());
app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  if (error instanceof SyntaxError) {
    return c.json({ error: "Malformed JSON body" }, 400);
  }

  return c.json({ error: "Internal server error" }, 500);
});

export default app;
