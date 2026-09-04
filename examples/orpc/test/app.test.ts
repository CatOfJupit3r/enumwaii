import { ORPCError, call, safe } from "@orpc/server";
import { describe, expect, it } from "vitest";
import { createApp } from "../src/app";
import { ERROR_KIND } from "../src/contract";
import {
  ReservationStore,
  RESERVATION_SERVICE,
  RESERVATION_STATUS,
} from "../src/domain/reservations";
import {
  contextFor,
  createCallCounters,
  local,
  type AppContext,
} from "../src/router";

function headers(extra: Record<string, string> = {}): Headers {
  return new Headers({
    "content-type": "application/json",
    "x-actor": "Mina",
    "x-request-id": "host-http",
    ...extra,
  });
}

describe("Tablewaii reservation procedures", () => {
  it("uses enumwaii directly for scalar availability input and output", async () => {
    const context = contextFor(new ReservationStore());
    await expect(
      call(local.status, RESERVATION_STATUS.CONFIRMED, { context }),
    ).resolves.toBe(RESERVATION_STATUS.CONFIRMED);
    expect(context.calls.status).toBe(1);
  });
  it("rejects invalid scalar availability before the handler", async () => {
    const context = contextFor(new ReservationStore());
    const result = await safe(call(local.status, "MAYBE", { context }));
    expect(result.isSuccess).toBe(false);
    expect(context.calls.status).toBe(0);
  });
  it("creates reservations and applies legal host transitions with audit data", async () => {
    const context = contextFor(new ReservationStore(), {
      actor: "Mina",
      requestId: "host-local",
    });
    const requested = await call(
      local.request,
      {
        owner: "Avery Singh",
        partySize: 3,
        service: RESERVATION_SERVICE.DINNER,
      },
      { context },
    );
    expect(requested.status).toBe(RESERVATION_STATUS.REQUESTED);
    const output = await call(
      local.transition,
      {
        reservationId: "res-olive",
        to: RESERVATION_STATUS.SEATED,
        expectedVersion: 0,
      },
      { context },
    );
    expect(output).toMatchObject({
      reservation: { status: RESERVATION_STATUS.SEATED, version: 1 },
      audit: { actor: "Mina", requestId: "host-local:middleware" },
    });
  });
  it("returns typed data for an illegal reservation transition", async () => {
    const result = await safe(
      call(
        local.transition,
        {
          reservationId: "res-olive",
          to: RESERVATION_STATUS.COMPLETED,
          expectedVersion: 0,
        },
        { context: contextFor(new ReservationStore()) },
      ),
    );
    expect(result.isSuccess).toBe(false);
    expect(result.error).toMatchObject({
      code: "ILLEGAL_TRANSITION",
      data: {
        kind: ERROR_KIND.ILLEGAL_TRANSITION,
        currentStatus: RESERVATION_STATUS.CONFIRMED,
      },
    });
  });
  it("returns a named double-booking error for an existing guest and service", async () => {
    const result = await safe(
      call(
        local.request,
        {
          owner: "Lina & Mateo",
          partySize: 2,
          service: RESERVATION_SERVICE.DINNER,
        },
        { context: contextFor(new ReservationStore()) },
      ),
    );

    expect(result.isSuccess).toBe(false);
    expect(result.error).toMatchObject({
      code: "DOUBLE_BOOKED",
      data: {
        kind: ERROR_KIND.DOUBLE_BOOKED,
        reservationId: "res-olive",
      },
    });
  });
  it("requires the host identity middleware", async () => {
    const context: AppContext = contextFor(new ReservationStore(), {
      actor: "",
    });
    const result = await safe(call(local.list, {}, { context }));
    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(ORPCError);
  });
});

describe("Tablewaii HTTP handler", () => {
  it("serves the host stand and health endpoint", async () => {
    const app = createApp();
    expect(await (await app.request("/")).text()).toContain("Tablewaii");
    expect(await (await app.request("/app.js")).text()).toContain(
      "function escapeHtml(value)",
    );
    await expect((await app.request("/health")).json()).resolves.toEqual({
      status: "ok",
    });
  });
  it("accepts a REST-shaped reservation transition", async () => {
    const app = createApp();
    const response = await app.request(
      "/api/v1/reservations/res-olive/transitions",
      {
        method: "POST",
        headers: headers(),
        body: JSON.stringify({ to: "SEATED", expectedVersion: 0 }),
      },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      reservation: { status: "SEATED" },
    });
  });
  it("validates HTTP availability before its handler", async () => {
    const calls = createCallCounters();
    const app = createApp({ calls });
    const response = await app.request("/api/v1/reservations/availability", {
      method: "POST",
      headers: headers(),
      body: JSON.stringify("UNKNOWN"),
    });
    expect(response.status).toBe(400);
    expect(calls.status).toBe(0);
  });
});

it("renders public form values and availability actions from owned enums", async () => {
  const html = await (await createApp().request("/")).text();
  expect(html).toContain('<option value="LUNCH">');
  expect(html).toContain('<option value="DINNER">');
  expect(html).toContain('data-status="NO_SHOW"');
  expect(html).not.toContain("<!-- service-options -->");
});
