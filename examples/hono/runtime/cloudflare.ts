import { Hono } from "hono";

import { createMenuRoutes } from "../src/routes/menu";

const app = new Hono();

app.get("/", (c) =>
  c.json({
    service: "Counter portable café menu worker",
    runtime: "Cloudflare Workers",
    persistence:
      "The PGlite order board runs on Node, Bun, and Deno; this Worker exposes its database-free menu and pricing catalog.",
    endpoints: {
      menu: "GET /api/menu",
      pricing: "GET /api/menu/pricing/tall",
    },
  }),
);

app.route("/api", createMenuRoutes());
app.notFound((c) => c.json({ error: "Not found" }, 404));

app.onError((error, c) => {
  if (error instanceof SyntaxError) {
    return c.json({ error: "Malformed JSON body" }, 400);
  }
  return c.json({ error: "Internal server error" }, 500);
});

export default app;
