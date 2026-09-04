import assert from "node:assert/strict";

import { createApp } from "../src/app.ts";
import { openOrderDatabase } from "../src/db/client.ts";
import {
  EXPECTED_RUNTIME_REPORT,
  exerciseRuntimeContract,
} from "./contract.ts";

const database = await openOrderDatabase("memory://", {
  migrationsFolder: "./drizzle",
});
await database.repository.seed();

const app = createApp({ orders: database.repository });
const server = Deno.serve(
  {
    hostname: "127.0.0.1",
    port: 0,
    onListen() {},
  },
  app.fetch,
);

const address = server.addr as Deno.NetAddr;

function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(`http://127.0.0.1:${address.port}${path}`, init);
}

try {
  const report = await exerciseRuntimeContract(request);
  assert.deepStrictEqual(report, EXPECTED_RUNTIME_REPORT);

  const response = await request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ drink: "Created inside Deno" }),
  });
  const payload = (await response.json()) as {
    readonly defaulted: boolean;
    readonly order: { readonly status: string; readonly drink: string };
  };

  assert.equal(response.status, 201);
  assert.deepStrictEqual(
    {
      defaulted: payload.defaulted,
      status: payload.order.status,
      drink: payload.order.drink,
    },
    {
      defaulted: true,
      status: "PLACED",
      drink: "Created inside Deno",
    },
  );
  console.log("Deno, PGlite, Drizzle, Hono, and enumwaii contract passed");
} finally {
  await server.shutdown();
  await database.close();
}
