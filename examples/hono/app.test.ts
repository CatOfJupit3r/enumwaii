import {
  exerciseRuntimeContract,
  EXPECTED_RUNTIME_REPORT,
} from "./runtime-tests/contract";
import type { Hono } from "hono";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createApp } from "./src/app";
import { openOrderDatabase, type OrderDatabaseHandle } from "./src/db/client";
import { hydrateOrder, InvalidOrderRowError } from "./src/db/order-repository";
import { drinkSizeDbEnum, orders, orderStatusDbEnum } from "./src/db/schema";
import {
  DRINK_SIZE,
  DRINK_SIZE_DB_VALUES,
  ORDER_STATUS,
  ORDER_STATUS_DB_VALUES,
} from "./src/domain/order-status";

describe("Counter café order board", () => {
  let database: OrderDatabaseHandle;
  let app: Hono;
  beforeAll(async () => {
    database = await openOrderDatabase("memory://");
    await database.repository.seed();
    app = createApp({ orders: database.repository });
  });
  afterAll(async () => {
    await database.close();
  });
  it("renders a barista board with an accessible request toast", async () => {
    const response = await app.request("/");
    const html = await response.text();
    expect(response.status).toBe(200);
    expect(html).toContain("Coffee orders, right where the barista needs them");
    expect(html).toContain("marin-oat-latte");
    expect(html).not.toContain("Boundary lab");
    expect(html).toContain('id="request-toast"');
    expect(html).toContain('aria-live="polite"');
  });
  it("uses the canonical PostgreSQL defaults while creating a drink", async () => {
    const response = await app.request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ drink: "Cortado" }),
    });
    expect(response.status).toBe(201);
    await expect(response.json()).resolves.toMatchObject({
      defaulted: true,
      order: { status: "PLACED", size: "TALL", drink: "Cortado", version: 1 },
    });
  });
  it("uses enumwaii directly as scalar Standard Schema middleware", async () => {
    const response = await app.request("/api/status/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("READY"),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "READY",
      label: "Ready",
      terminal: false,
    });
  });
  it("rejects an unknown scalar status", async () => {
    const response = await app.request("/api/status/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("refunded"),
    });
    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid café order status",
    });
  });
  it("maps URL values to constant-case domain and database values", async () => {
    const response = await app.request("/api/status?status=picked-up");
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "PICKED_UP",
    });
    const filtered = await app.request("/?status=ready");
    expect(filtered.status).toBe(200);
    await expect(
      exerciseRuntimeContract(async (path, init) => app.request(path, init)),
    ).resolves.toEqual(EXPECTED_RUNTIME_REPORT);
  });
  it("defaults a missing status query but rejects malformed input", async () => {
    const defaulted = await app.request("/api/status");
    await expect(defaulted.json()).resolves.toMatchObject({
      status: "PLACED",
      defaulted: true,
    });
    const malformed = await app.request("/api/status?status=refunded");
    expect(malformed.status).toBe(400);
  });
  it("persists a legal card move and increments its version", async () => {
    const order = await database.repository.create({
      id: "legal-transition",
      drink: "Flat white",
      status: ORDER_STATUS.PLACED,
      size: DRINK_SIZE.TALL,
    });
    const response = await app.request(`/api/orders/${order.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "BREWING", expectedVersion: 1 }),
    });
    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      order: { id: order.id, status: "BREWING", version: 2 },
    });
  });
  it("surfaces a barista version conflict without overwriting the row", async () => {
    const order = await database.repository.create({
      id: "version-conflict",
      drink: "Americano",
      status: ORDER_STATUS.PLACED,
    });
    await database.repository.transition(order.id, ORDER_STATUS.BREWING, 1);
    const response = await app.request(`/api/orders/${order.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "READY", expectedVersion: 1 }),
    });
    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "Another barista already moved this order",
      expectedVersion: 1,
      actualVersion: 2,
    });
  });
  it("keeps status and drink size database metadata canonical", () => {
    const columns = getTableConfig(orders).columns;
    expect(orderStatusDbEnum.enumValues).toEqual(ORDER_STATUS_DB_VALUES);
    expect(drinkSizeDbEnum.enumValues).toEqual(DRINK_SIZE_DB_VALUES);
    expect(columns.find((column) => column.name === "status")?.default).toBe(
      "PLACED",
    );
    expect(columns.find((column) => column.name === "size")?.default).toBe(
      "TALL",
    );
  });
  it("frames corrupt hydration as a migration failure", () => {
    expect(() =>
      hydrateOrder({
        id: "historical-row",
        status: "refunded",
        drink: "Latte",
        size: "TALL",
        note: null,
        version: 1,
        createdAt: "2026-08-30T12:00:00.000Z",
        updatedAt: "2026-08-30T12:00:00.000Z",
      }),
    ).toThrowError(InvalidOrderRowError);
  });
});
