import { describe, expect, it } from "vitest";

import { inspectStatusBoundary } from "../lib/boundary";
import { TASK_STATUS } from "../lib/operations";

describe("status boundary policies", () => {
  it("marks missing input as a nil-only default in both policies", () => {
    const report = inspectStatusBoundary(undefined);

    expect(report.input).toEqual({ kind: "missing", display: "undefined" });
    expect(report.defaultOnly).toMatchObject({
      accepted: true,
      source: "default",
      status: TASK_STATUS.QUEUED,
    });
    expect(report.recovery).toMatchObject({
      source: "default",
      status: TASK_STATUS.QUEUED,
    });
  });

  it("rejects malformed input under default-only and recovers with fallback", () => {
    const report = inspectStatusBoundary("PAUSED");

    expect(report.defaultOnly).toMatchObject({
      accepted: false,
      source: "rejected",
    });
    expect(report.recovery).toMatchObject({
      accepted: true,
      source: "fallback",
      status: TASK_STATUS.QUEUED,
    });
  });

  it("treats a number as invalid rather than coercing it", () => {
    const report = inspectStatusBoundary(42);

    expect(report.input).toEqual({ kind: "wrong type", display: "42" });
    expect(report.defaultOnly.accepted).toBe(false);
    expect(report.recovery.source).toBe("fallback");
  });
});
