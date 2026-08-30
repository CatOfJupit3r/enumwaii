import { fileURLToPath } from "node:url";

import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { Hono } from "hono";

import { JobStore } from "./domain/jobs";
import {
  createCallCounters,
  type AppContext,
  type CallCounters,
  router,
} from "./router";

export interface AppOptions {
  readonly calls?: CallCounters;
  readonly store?: JobStore;
}

function contextFromRequest(
  request: Request,
  store: JobStore,
  calls: CallCounters,
): AppContext {
  return {
    actor: request.headers.get("x-actor") ?? "",
    calls,
    corruptOutput: request.headers.get("x-demo-corrupt-output") === "enabled",
    requestId: request.headers.get("x-request-id") ?? crypto.randomUUID(),
    store,
  };
}

export function createApp(options: AppOptions = {}): Hono {
  const app = new Hono();
  const store = options.store ?? new JobStore();
  const calls = options.calls ?? createCallCounters();
  const handler = new OpenAPIHandler(router);
  const publicDirectory = fileURLToPath(new URL("../public", import.meta.url));

  app.get("/health", (context) => context.json({ status: "ok" }));

  app.use("/api/*", async (context, next) => {
    const { matched, response } = await handler.handle(context.req.raw, {
      prefix: "/api",
      context: contextFromRequest(context.req.raw, store, calls),
    });

    if (matched) return context.newResponse(response.body, response);
    await next();
  });

  app.use("/*", serveStatic({ root: publicDirectory }));
  app.notFound((context) => context.json({ message: "Not found" }, 404));

  return app;
}

export const app = createApp();
