import { describe, expect, it } from "vitest";

import { INCIDENT_STATE } from "./incidents";
import {
  controlRoomSearchSchema,
  resolveControlRoomFocus,
} from "./control-room-search";

describe("control-room search boundary", () => {
  it("defaults a missing focus and records why", () => {
    expect(controlRoomSearchSchema.parse({})).toEqual({
      focus: INCIDENT_STATE.MITIGATING,
      resolution: "DEFAULT",
      received: null,
    });
    expect(resolveControlRoomFocus(null).resolution).toBe("DEFAULT");
  });

  it("preserves valid external members as branded output", () => {
    expect(controlRoomSearchSchema.parse({ focus: "monitoring" })).toEqual({
      focus: INCIDENT_STATE.MONITORING,
      resolution: "REQUESTED",
      received: "monitoring",
    });
  });

  it("labels malformed recovery instead of treating it as a default", () => {
    expect(controlRoomSearchSchema.parse({ focus: "PAUSED" })).toEqual({
      focus: INCIDENT_STATE.TRIAGE,
      resolution: "FALLBACK",
      received: '"PAUSED"',
    });
  });

  it("uses enumwaii's safe received text for unusual boundary values", () => {
    expect(resolveControlRoomFocus(Symbol("focus"))).toEqual({
      focus: INCIDENT_STATE.TRIAGE,
      resolution: "FALLBACK",
      received: "Symbol(focus)",
    });
  });
});
