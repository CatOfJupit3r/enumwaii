import { ORPCError, call, safe } from "@orpc/server";
import { describe, expect, it } from "vitest";

import { createApp } from "../src/app";
import { ERROR_KIND } from "../src/contract";
import { JOB_STATUS, JobStore } from "../src/domain/jobs";
import {
  contextFor,
  createCallCounters,
  type AppContext,
  local,
} from "../src/router";

function httpHeaders(extra: Record<string, string> = {}): Headers {
  return new Headers({
    "content-type": "application/json",
    "x-actor": "http-operator",
    "x-request-id": "req-http",
    ...extra,
  });
}

describe("local procedure calls", () => {
  it("uses enumwaii directly for scalar input and output", async () => {
    const context = contextFor(new JobStore());
    const output = await call(local.status, JOB_STATUS.RUNNING, { context });

    expect(output).toBe(JOB_STATUS.RUNNING);
    expect(context.calls.status).toBe(1);
  });

  it.each(["PAUSED", 42])(
    "rejects invalid scalar input %j before the handler",
    async (input) => {
      const context = contextFor(new JobStore());
      const result = await safe(call(local.status, input, { context }));

      expect(result.isSuccess).toBe(false);
      expect(result.error).toMatchObject({ code: "BAD_REQUEST" });
      expect(context.calls.status).toBe(0);
    },
  );

  it("applies a legal transition and exposes middleware context", async () => {
    const context = contextFor(new JobStore(), {
      actor: "local-operator",
      requestId: "req-legal",
    });
    const output = await call(
      local.transition,
      {
        jobId: "job-7",
        to: JOB_STATUS.RUNNING,
        expectedVersion: 0,
      },
      { context },
    );

    expect(output).toMatchObject({
      job: { id: "job-7", status: JOB_STATUS.RUNNING, version: 1 },
      audit: {
        actor: "local-operator",
        requestId: "req-legal:middleware",
      },
    });
  });

  it("returns typed data for an illegal transition", async () => {
    const result = await safe(
      call(
        local.transition,
        {
          jobId: "job-7",
          to: JOB_STATUS.SUCCEEDED,
          expectedVersion: 0,
        },
        { context: contextFor(new JobStore()) },
      ),
    );

    expect(result.isSuccess).toBe(false);
    expect(result.isDefined).toBe(true);
    expect(result.error).toMatchObject({
      code: "CONFLICT",
      status: 409,
      data: {
        kind: ERROR_KIND.ILLEGAL_TRANSITION,
        currentStatus: JOB_STATUS.QUEUED,
        requestedStatus: JOB_STATUS.SUCCEEDED,
      },
    });
  });

  it("distinguishes optimistic-concurrency conflict data", async () => {
    const result = await safe(
      call(
        local.transition,
        {
          jobId: "job-7",
          to: JOB_STATUS.RUNNING,
          expectedVersion: 12,
        },
        { context: contextFor(new JobStore()) },
      ),
    );

    expect(result.isSuccess).toBe(false);
    expect(result.error).toMatchObject({
      code: "CONFLICT",
      data: {
        kind: ERROR_KIND.VERSION_CONFLICT,
        expectedVersion: 12,
        actualVersion: 0,
      },
    });
  });

  it("returns typed not-found data", async () => {
    const result = await safe(
      call(
        local.transition,
        {
          jobId: "missing",
          to: JOB_STATUS.RUNNING,
          expectedVersion: 0,
        },
        { context: contextFor(new JobStore()) },
      ),
    );

    expect(result.isSuccess).toBe(false);
    expect(result.error).toMatchObject({
      code: "NOT_FOUND",
      status: 404,
      data: { kind: ERROR_KIND.NOT_FOUND, jobId: "missing" },
    });
  });

  it("rejects an empty actor in context middleware", async () => {
    const context: AppContext = contextFor(new JobStore(), { actor: "" });
    const result = await safe(call(local.list, {}, { context }));

    expect(result.isSuccess).toBe(false);
    expect(result.error).toBeInstanceOf(ORPCError);
    expect(result.error).toMatchObject({ code: "FORBIDDEN", status: 403 });
    expect(context.calls.list).toBe(0);
  });

  it("validates handler output", async () => {
    const context = contextFor(new JobStore(), { corruptOutput: true });
    const result = await safe(
      call(local.status, JOB_STATUS.QUEUED, { context }),
    );

    expect(result.isSuccess).toBe(false);
    expect(result.error).toMatchObject({ code: "INTERNAL_SERVER_ERROR" });
    expect(context.calls.status).toBe(1);
  });
});

describe("OpenAPI HTTP handler", () => {
  it("serves the real UI and health endpoint", async () => {
    const app = createApp();
    const page = await app.request("/");
    const health = await app.request("/health");

    expect(page.status).toBe(200);
    expect(await page.text()).toContain("Run a scenario");
    expect(health.status).toBe(200);
    await expect(health.json()).resolves.toEqual({ status: "ok" });
  });

  it("validates scalar HTTP input before the procedure handler", async () => {
    const calls = createCallCounters();
    const app = createApp({ calls });
    const response = await app.request("/api/v1/jobs/status", {
      method: "POST",
      headers: httpHeaders(),
      body: JSON.stringify("PAUSED"),
    });

    expect(response.status).toBe(400);
    expect(calls.status).toBe(0);
  });

  it("accepts a legal REST-shaped transition and returns middleware audit", async () => {
    const app = createApp();
    const response = await app.request("/api/v1/jobs/job-7/transitions", {
      method: "POST",
      headers: httpHeaders(),
      body: JSON.stringify({ to: "RUNNING", expectedVersion: 0 }),
    });

    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      job: { id: "job-7", status: "RUNNING", version: 1 },
      audit: { actor: "http-operator", requestId: "req-http:middleware" },
    });
  });

  it("validates the Zod object boundary before the transition handler", async () => {
    const calls = createCallCounters();
    const app = createApp({ calls });
    const response = await app.request("/api/v1/jobs/job-7/transitions", {
      method: "POST",
      headers: httpHeaders(),
      body: JSON.stringify({ to: 42, expectedVersion: 0 }),
    });

    expect(response.status).toBe(400);
    expect(calls.transition).toBe(0);
  });

  it("serializes typed business conflicts over HTTP", async () => {
    const app = createApp();
    const response = await app.request("/api/v1/jobs/job-7/transitions", {
      method: "POST",
      headers: httpHeaders(),
      body: JSON.stringify({ to: "SUCCEEDED", expectedVersion: 0 }),
    });

    expect(response.status).toBe(409);
    expect(await response.json()).toMatchObject({
      code: "CONFLICT",
      data: {
        kind: "ILLEGAL_TRANSITION",
        jobId: "job-7",
        currentStatus: "QUEUED",
      },
    });
  });

  it("runs context middleware on HTTP requests", async () => {
    const calls = createCallCounters();
    const app = createApp({ calls });
    const response = await app.request("/api/v1/jobs", {
      headers: { "x-request-id": "req-no-actor" },
    });

    expect(response.status).toBe(403);
    expect(calls.list).toBe(0);
  });

  it("turns invalid handler output into an HTTP 500", async () => {
    const calls = createCallCounters();
    const app = createApp({ calls });
    const response = await app.request("/api/v1/jobs/status", {
      method: "POST",
      headers: httpHeaders({ "x-demo-corrupt-output": "enabled" }),
      body: JSON.stringify("QUEUED"),
    });

    expect(response.status).toBe(500);
    expect(calls.status).toBe(1);
  });
});
