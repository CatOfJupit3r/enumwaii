import { describe, expect, it } from "vitest";

import {
  TASK_STATUS,
  TASK_STATUS_METADATA,
  allTaskStatuses,
  resolveDashboardStatus,
  tasksForStatus,
} from "../lib/operations";

describe("operations domain", () => {
  it("defaults only a missing URL value", () => {
    expect(resolveDashboardStatus(undefined)).toMatchObject({
      status: TASK_STATUS.QUEUED,
      policy: "default",
    });
    expect(resolveDashboardStatus(null)).toMatchObject({
      status: TASK_STATUS.QUEUED,
      policy: "default",
    });
  });

  it("accepts a valid external member", () => {
    expect(resolveDashboardStatus("IN_PROGRESS")).toMatchObject({
      status: TASK_STATUS.IN_PROGRESS,
      policy: "request",
    });
  });

  it("recovers from malformed and wrong-type URL input", () => {
    expect(resolveDashboardStatus("PAUSED")).toMatchObject({
      status: TASK_STATUS.QUEUED,
      policy: "fallback",
    });
    expect(resolveDashboardStatus(["QUEUED", "BLOCKED"])).toMatchObject({
      status: TASK_STATUS.QUEUED,
      policy: "fallback",
    });
  });

  it("keeps derived metadata and domain selectors exhaustive", () => {
    expect(allTaskStatuses()).toHaveLength(4);
    expect(TASK_STATUS_METADATA.get(TASK_STATUS.BLOCKED).label).toBe(
      "Needs intervention",
    );
    expect(
      tasksForStatus(TASK_STATUS.COMPLETE).every(
        (task) => task.status === TASK_STATUS.COMPLETE,
      ),
    ).toBe(true);
  });
});
