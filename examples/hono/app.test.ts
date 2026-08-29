import { describe, expect, it } from "vitest";

import { app } from "./src/app";

describe("order status API", () => {
  it("validates a scalar JSON body with Standard Schema middleware", async () => {
    const response = await app.request("/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("PAID"),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "PAID",
      label: "Paid",
      terminal: false,
    });
  });

  it("returns a clear 400 response for an invalid JSON status", async () => {
    const response = await app.request("/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("CANCELLED"),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid order status",
    });
  });

  it("manually validates a query scalar before calling the domain service", async () => {
    const response = await app.request("/orders/status?status=SHIPPED");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "SHIPPED",
      label: "Shipped",
      terminal: true,
    });
  });

  it("returns 400 for an invalid query status", async () => {
    const response = await app.request("/orders/status?status=CANCELLED");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid order status",
    });
  });
});
