import { describe, expect, it } from "vitest";

import {
  INCIDENT_STATE,
  IllegalIncidentTransitionError,
  canTransitionIncident,
  describeIncidentState,
  getAllowedIncidentTransitions,
  incidentStateSchema,
  transitionIncidentInputSchema,
  transitionIncidentState,
} from "./incidents";

describe("incident state domain", () => {
  it("parses an external member into an owned value", () => {
    const state = incidentStateSchema.parse("MONITORING");

    expect(state).toBe(INCIDENT_STATE.MONITORING);
    expect(describeIncidentState(state)).toMatchObject({
      label: "Monitoring",
      sequence: 3,
      tone: "watch",
    });
  });

  it("keeps missing defaults distinct from malformed fallbacks", () => {
    expect(
      incidentStateSchema.parse(undefined, {
        default: INCIDENT_STATE.MITIGATING,
      }),
    ).toBe(INCIDENT_STATE.MITIGATING);
    expect(() =>
      incidentStateSchema.parse("PAUSED", {
        default: INCIDENT_STATE.MITIGATING,
      }),
    ).toThrow();
    expect(
      incidentStateSchema.parse("PAUSED", {
        fallback: INCIDENT_STATE.TRIAGE,
      }),
    ).toBe(INCIDENT_STATE.TRIAGE);
  });

  it("exposes the exhaustive transition graph", () => {
    expect(getAllowedIncidentTransitions(INCIDENT_STATE.MITIGATING)).toEqual([
      INCIDENT_STATE.MONITORING,
      INCIDENT_STATE.TRIAGE,
    ]);
    expect(
      canTransitionIncident(INCIDENT_STATE.MONITORING, INCIDENT_STATE.RESOLVED),
    ).toBe(true);
    expect(getAllowedIncidentTransitions(INCIDENT_STATE.RESOLVED)).toEqual([]);
  });

  it("accepts valid transitions and rejects illegal skips", () => {
    expect(
      transitionIncidentState(
        INCIDENT_STATE.MITIGATING,
        INCIDENT_STATE.MONITORING,
      ),
    ).toBe(INCIDENT_STATE.MONITORING);
    expect(() =>
      transitionIncidentState(INCIDENT_STATE.TRIAGE, INCIDENT_STATE.RESOLVED),
    ).toThrow(IllegalIncidentTransitionError);
  });

  it("validates object mutations through Zod and the official adapter", () => {
    const parsed = transitionIncidentInputSchema.parse({
      incidentId: "INC-2417",
      to: "MONITORING",
      expectedVersion: 3,
    });

    expect(parsed.to).toBe(INCIDENT_STATE.MONITORING);
    expect(() =>
      transitionIncidentInputSchema.parse({
        incidentId: "INC-2417",
        to: "PAUSED",
        expectedVersion: 3,
      }),
    ).toThrow();
  });
});
