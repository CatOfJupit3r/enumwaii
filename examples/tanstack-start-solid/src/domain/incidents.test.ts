import { describe, expect, it } from "vitest";

import {
  INCIDENT_STATE,
  IllegalIncidentTransitionError,
  canTransitionIncident,
  createIncidentInputSchema,
  describeIncidentState,
  getAllowedIncidentTransitions,
  incidentStateSchema,
  summarizeSystemStatus,
  transitionIncidentInputSchema,
  transitionIncidentState,
} from "./incidents";

describe("incident state domain", () => {
  it("parses an external member into an owned value", () => {
    const state = incidentStateSchema.parse("monitoring");

    expect(state).toBe(INCIDENT_STATE.MONITORING);
    expect(describeIncidentState(state)).toMatchObject({
      label: "Monitoring",
      sequence: 3,
      tone: "WATCH",
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
      to: "monitoring",
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

  it("validates incident creation and rejects an unknown state", () => {
    const parsed = createIncidentInputSchema.parse({
      service: "Checkout API",
      title: "Elevated payment retries",
      owner: "Mira Chen",
      impact: "4.8% of checkout attempts",
      state: "triage",
    });

    expect(parsed.state).toBe(INCIDENT_STATE.TRIAGE);
    expect(() =>
      createIncidentInputSchema.parse({
        service: "Checkout API",
        title: "Elevated payment retries",
        owner: "Mira Chen",
        impact: "4.8% of checkout attempts",
        state: "PAUSED",
      }),
    ).toThrow();
  });

  it("folds the derived state severity into a public system banner", () => {
    expect(
      summarizeSystemStatus([
        {
          id: "INC-1",
          service: "Checkout",
          title: "Retries elevated",
          owner: "Mira",
          openedAt: "now",
          impact: "Partial",
          state: INCIDENT_STATE.MONITORING,
          version: 1,
        },
        {
          id: "INC-2",
          service: "Identity",
          title: "Sign-in failures",
          owner: "Ana",
          openedAt: "now",
          impact: "Major",
          state: INCIDENT_STATE.TRIAGE,
          version: 1,
        },
      ]),
    ).toMatchObject({
      label: "Major service disruption",
      state: INCIDENT_STATE.TRIAGE,
      tone: "CRITICAL",
    });
    expect(summarizeSystemStatus([])).toEqual({
      label: "All systems operational",
      detail: "No active incidents",
      tone: "CLEAR",
      state: null,
    });
  });
});
