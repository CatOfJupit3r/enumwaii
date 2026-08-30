import {
  describeDispatchStage,
  DISPATCH_STAGE,
  incidentsAtStage,
  inspectStageBoundary,
  nextDispatchStages,
  REPORT_PRIORITY,
  validateFieldReport,
} from "../src/domain/dispatch";

describe("dispatch domain", () => {
  test("keeps branded members through exhaustive mobile presentation data", () => {
    expect(describeDispatchStage(DISPATCH_STAGE.ON_SITE)).toMatchObject({
      label: "On site",
      accent: "#236c57",
    });
    expect(incidentsAtStage(DISPATCH_STAGE.ON_SITE)).toHaveLength(1);
  });

  test("supports arrays as derived transition values, including a terminal stage", () => {
    expect(nextDispatchStages(DISPATCH_STAGE.UNASSIGNED)).toEqual([
      DISPATCH_STAGE.DISPATCHED,
    ]);
    expect(nextDispatchStages(DISPATCH_STAGE.RESOLVED)).toEqual([]);
  });

  test("distinguishes a missing deep-link value from malformed input", () => {
    const missing = inspectStageBoundary(undefined);
    const malformed = inspectStageBoundary("ARCHIVED");

    expect(missing.defaultOnly).toMatchObject({
      accepted: true,
      source: "default",
      stage: DISPATCH_STAGE.UNASSIGNED,
    });
    expect(malformed.defaultOnly).toMatchObject({
      accepted: false,
      source: "rejected",
    });
    expect(malformed.recovery).toMatchObject({
      accepted: true,
      source: "fallback",
      stage: DISPATCH_STAGE.UNASSIGNED,
    });
  });

  test("rejects repeated Router query values instead of taking the first", () => {
    const report = inspectStageBoundary(["DISPATCHED", "ON_SITE"]);

    expect(report.input.kind).toBe("repeated query");
    expect(report.defaultOnly.accepted).toBe(false);
    expect(report.recovery.source).toBe("fallback");
  });

  test("describes non-string boundary values without Object coercion", () => {
    expect(inspectStageBoundary({ stage: "ON_SITE" }).input).toEqual({
      kind: "wrong type",
      display: '{"stage":"ON_SITE"}',
    });
    expect(inspectStageBoundary(Symbol("stage")).input).toEqual({
      kind: "wrong type",
      display: "<symbol>",
    });
  });

  test("validates a native form draft before producing domain data", () => {
    expect(
      validateFieldReport({ summary: " ", notes: "", priority: "URGENT" }),
    ).toMatchObject({ success: false, field: "summary" });
    expect(
      validateFieldReport({
        summary: "  Inspect west valve  ",
        notes: "  Bring pressure gauge  ",
        priority: "SOMEDAY",
      }),
    ).toMatchObject({ success: false, field: "priority" });
    expect(
      validateFieldReport({
        summary: "  Inspect west valve  ",
        notes: "  Bring pressure gauge  ",
        priority: "URGENT",
      }),
    ).toEqual({
      success: true,
      report: {
        summary: "Inspect west valve",
        notes: "Bring pressure gauge",
        priority: REPORT_PRIORITY.URGENT,
      },
    });
  });
});
