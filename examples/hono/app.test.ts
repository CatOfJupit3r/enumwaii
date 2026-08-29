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

  it("rejects a valid JSON request with the wrong primitive type", async () => {
    const response = await app.request("/orders/status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(42),
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
      defaulted: false,
    });
  });

  it("defaults a missing query status to an owned member", async () => {
    const response = await app.request("/orders/status");

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      status: "PENDING",
      label: "Pending",
      terminal: false,
      defaulted: true,
    });
  });

  it("returns 400 for an invalid query status", async () => {
    const response = await app.request("/orders/status?status=CANCELLED");

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid order status",
    });
  });

  it("accepts an allowed branded status transition", async () => {
    const response = await app.request("/orders/transition/PENDING/PAID", {
      method: "POST",
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toEqual({
      from: {
        status: "PENDING",
        label: "Pending",
        terminal: false,
      },
      to: {
        status: "PAID",
        label: "Paid",
        terminal: false,
      },
    });
  });

  it("returns a Hono 409 response for a terminal transition", async () => {
    const response = await app.request("/orders/transition/SHIPPED/PAID", {
      method: "POST",
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Order status transition conflict",
      from: "SHIPPED",
      to: "PAID",
    });
  });
});
