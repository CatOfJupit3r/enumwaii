import { afterAll, expect, test } from "bun:test";

import { createApp } from "../src/app";
import { openOrderDatabase } from "../src/db/client";
import { EXPECTED_RUNTIME_REPORT, exerciseRuntimeContract } from "./contract";

const database = await openOrderDatabase("memory://", {
  migrationsFolder: "./drizzle",
});
await database.repository.seed();

const app = createApp({ orders: database.repository });
const server = Bun.serve({
  hostname: "127.0.0.1",
  port: 0,
  fetch: app.fetch,
});

function request(path: string, init?: RequestInit): Promise<Response> {
  return fetch(new URL(path, server.url), init);
}

afterAll(async () => {
  await server.stop(true);
  await database.close();
});

test("runs the portable enumwaii contract through Bun HTTP", async () => {
  expect(await exerciseRuntimeContract(request)).toEqual(
    EXPECTED_RUNTIME_REPORT,
  );
});

test("runs the real PGlite and Drizzle order path under Bun", async () => {
  const response = await request("/api/orders", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ memo: "Created inside Bun" }),
  });
  const payload = (await response.json()) as {
    readonly defaulted: boolean;
    readonly order: { readonly status: string; readonly memo: string | null };
  };

  expect(response.status).toBe(201);
  expect(payload).toMatchObject({
    defaulted: true,
    order: { status: "PENDING", memo: "Created inside Bun" },
  });
});
