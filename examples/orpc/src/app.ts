import { readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import { serveStatic } from "@hono/node-server/serve-static";
import { OpenAPIHandler } from "@orpc/openapi/fetch";
import { Hono } from "hono";

import {
  ReservationStore,
  reservationServices,
  RESERVATION_STATUS,
} from "./domain/reservations";
import {
  createCallCounters,
  type AppContext,
  type CallCounters,
  router,
} from "./router";

export interface AppOptions {
  readonly calls?: CallCounters;
  readonly store?: ReservationStore;
}

function contextFromRequest(
  request: Request,
  store: ReservationStore,
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
  const store = options.store ?? new ReservationStore();
  const calls = options.calls ?? createCallCounters();
  const handler = new OpenAPIHandler(router);
  const publicDirectory = fileURLToPath(new URL("../public", import.meta.url));

  app.get("/", async (context) => {
    const template = await readFile(
      new URL("index.html", new URL("../public/", import.meta.url)),
      "utf8",
    );
    const services = reservationServices.values
      .map(
        (service) =>
          `<option value="${service}">${service.toLowerCase()}</option>`,
      )
      .join("");
    const availability = [
      RESERVATION_STATUS.CONFIRMED,
      RESERVATION_STATUS.NO_SHOW,
    ]
      .map(
        (status) =>
          `<button class="scenario-card" data-status="${status}" type="button">${status.replaceAll("_", " ")}</button>`,
      )
      .join("");
    return context.html(
      template
        .replace("<!-- service-options -->", services)
        .replace("<!-- availability-options -->", availability),
    );
  });

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
