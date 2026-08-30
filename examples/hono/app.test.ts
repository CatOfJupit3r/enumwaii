import type { Hono } from "hono";
import { getTableConfig } from "drizzle-orm/pg-core";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createApp } from "./src/app";
import { openOrderDatabase, type OrderDatabaseHandle } from "./src/db/client";
import { hydrateOrder, InvalidOrderRowError } from "./src/db/order-repository";
import { orders, orderStatusDbEnum } from "./src/db/schema";
import {
  ORDER_STATUS,
  ORDER_STATUS_DB_ENUM,
  ORDER_STATUS_DB_VALUES,
} from "./src/domain/order-status";

describe("Hono + Drizzle order operations", () => {
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

  it("renders a useful server-side dashboard", async () => {
    const response = await app.request("/");
    const html = await response.text();

    expect(response.status).toBe(200);
    expect(html).toContain("Orders that keep their state honest");
    expect(html).toContain('id="create-order"');
    expect(html).toContain("Boundary lab");
    expect(html).toContain("demo-pending");
  });

  it("persists an order and uses the canonical PostgreSQL default", async () => {
    const response = await app.request("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memo: "Database default check" }),
    });
    const created = await response.json();

    expect(response.status).toBe(201);
    expect(created).toMatchObject({
      defaulted: true,
      order: { status: "PENDING", memo: "Database default check", version: 1 },
    });

    const listResponse = await app.request("/api/orders");
    const payload = (await listResponse.json()) as {
      orders: { id: string; memo: string | null }[];
    };
    expect(payload.orders).toContainEqual(
      expect.objectContaining({ memo: "Database default check" }),
    );
  });

  it("uses enumwaii directly as scalar Standard Schema middleware", async () => {
    const response = await app.request("/api/status/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify("PAID"),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      status: "PAID",
      label: "Paid",
      terminal: false,
    });
  });

  it.each([
    ["unknown member", "REFUNDED"],
    ["wrong primitive", 42],
  ])("rejects a %s at the scalar boundary", async (_label, body) => {
    const response = await app.request("/api/status/inspect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    expect(response.status).toBe(400);
    await expect(response.json()).resolves.toMatchObject({
      error: "Invalid order status",
    });
  });

  it("distinguishes a nil default from malformed input", async () => {
    const defaulted = await app.request("/api/status");
    expect(defaulted.status).toBe(200);
    await expect(defaulted.json()).resolves.toMatchObject({
      status: "PENDING",
      defaulted: true,
    });

    const malformed = await app.request("/api/status?status=REFUNDED");
    expect(malformed.status).toBe(400);
    await expect(malformed.json()).resolves.toMatchObject({
      error: "Invalid order status",
      field: "status",
    });
  });

  it("persists a legal transition and increments its version", async () => {
    const order = await database.repository.create({
      id: "legal-transition",
      status: ORDER_STATUS.PENDING,
    });
    const response = await app.request(`/api/orders/${order.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "PAID", expectedVersion: 1 }),
    });

    expect(response.status).toBe(200);
    await expect(response.json()).resolves.toMatchObject({
      order: { id: order.id, status: "PAID", version: 2 },
    });
    const persisted = await database.repository.list();
    expect(persisted).toContainEqual(
      expect.objectContaining({ id: order.id, status: ORDER_STATUS.PAID }),
    );
  });

  it("rejects an illegal transition", async () => {
    const order = await database.repository.create({
      id: "illegal-transition",
      status: ORDER_STATUS.PENDING,
    });
    const response = await app.request(`/api/orders/${order.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "SHIPPED", expectedVersion: 1 }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toEqual({
      error: "Illegal order transition",
      from: "PENDING",
      to: "SHIPPED",
    });
  });

  it("reports a stale optimistic version without overwriting the row", async () => {
    const order = await database.repository.create({
      id: "version-conflict",
      status: ORDER_STATUS.PENDING,
    });
    await database.repository.transition(order.id, ORDER_STATUS.PAID, 1);

    const response = await app.request(`/api/orders/${order.id}/transition`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to: "SHIPPED", expectedVersion: 1 }),
    });

    expect(response.status).toBe(409);
    await expect(response.json()).resolves.toMatchObject({
      error: "Order version conflict",
      expectedVersion: 1,
      actualVersion: 2,
    });
  });

  it("keeps the canonical enum and default in Drizzle metadata", () => {
    const statusColumn = getTableConfig(orders).columns.find(
      (column) => column.name === "status",
    );

    expect(orderStatusDbEnum.enumValues).toEqual(ORDER_STATUS_DB_VALUES);
    expect(statusColumn?.enumValues).toEqual(ORDER_STATUS_DB_VALUES);
    expect(statusColumn?.default).toBe(ORDER_STATUS_DB_ENUM.PENDING);
  });

  it("rejects historical or corrupt output instead of silently coercing it", () => {
    expect(() =>
      hydrateOrder({
        id: "historical-row",
        status: "REFUNDED",
        memo: null,
        version: 1,
        createdAt: "2026-08-30T12:00:00.000Z",
        updatedAt: "2026-08-30T12:00:00.000Z",
      }),
    ).toThrowError(InvalidOrderRowError);
  });
});
