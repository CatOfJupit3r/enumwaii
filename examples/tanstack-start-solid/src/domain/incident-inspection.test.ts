import { describe, expect, it } from "vitest";

import {
  createIncidentStateInspection,
  parseIncidentStateInspection,
  type IncidentStateInspectionDto,
} from "./incident-inspection";
import { INCIDENT_STATE } from "./incidents";

describe("TanStack Start incident-state serialization bridge", () => {
  it("returns a plain transport DTO after strict enumwaii validation", () => {
    const inspection = createIncidentStateInspection(
      "monitoring",
      "2026-08-30T12:00:00.000Z",
    );

    expect(inspection).toEqual({
      state: "monitoring",
      summary: "The fix is live while telemetry confirms recovery.",
      instruction: "Hold the release gate until the observation window ends.",
      validatedAt: "2026-08-30T12:00:00.000Z",
    });
    expect(JSON.parse(JSON.stringify(inspection))).toEqual(inspection);
  });

  it("re-parses transport strings before returning to the domain", () => {
    const inspection: IncidentStateInspectionDto = {
      state: "mitigating",
      summary: "Transport copy is not domain provenance.",
      instruction: "Re-parse at the receiving boundary.",
      validatedAt: "2026-08-30T12:00:00.000Z",
    };

    expect(parseIncidentStateInspection(inspection)).toBe(
      INCIDENT_STATE.MITIGATING,
    );
  });

  it("rejects malformed input on both sides of the transport", () => {
    expect(() =>
      createIncidentStateInspection("PAUSED", "2026-08-30T12:00:00.000Z"),
    ).toThrow();
    expect(() =>
      parseIncidentStateInspection({
        state: "PAUSED",
        summary: "Malformed wire value",
        instruction: "Reject it",
        validatedAt: "2026-08-30T12:00:00.000Z",
      }),
    ).toThrow();
  });
});
