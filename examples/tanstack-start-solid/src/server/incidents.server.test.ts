import { describe, expect, it } from "vitest";

import {
  INCIDENT_STATE,
  IllegalIncidentTransitionError,
} from "~/domain/incidents";
import {
  IncidentNotFoundError,
  IncidentStore,
  IncidentVersionConflictError,
} from "./incidents.server";

describe("incident store seam", () => {
  it("applies an owned transition and increments the version", () => {
    const store = new IncidentStore();

    const updated = store.transition({
      incidentId: "INC-2417",
      to: INCIDENT_STATE.MONITORING,
      expectedVersion: 3,
    });

    expect(updated.state).toBe(INCIDENT_STATE.MONITORING);
    expect(updated.version).toBe(4);
  });

  it("protects the mutation with optimistic concurrency", () => {
    const store = new IncidentStore();

    expect(() =>
      store.transition({
        incidentId: "INC-2417",
        to: INCIDENT_STATE.MONITORING,
        expectedVersion: 2,
      }),
    ).toThrow(IncidentVersionConflictError);
  });

  it("rejects missing incidents and illegal graph jumps", () => {
    const store = new IncidentStore();

    expect(() =>
      store.transition({
        incidentId: "INC-0000",
        to: INCIDENT_STATE.MONITORING,
        expectedVersion: 0,
      }),
    ).toThrow(IncidentNotFoundError);
    expect(() =>
      store.transition({
        incidentId: "INC-2417",
        to: INCIDENT_STATE.RESOLVED,
        expectedVersion: 3,
      }),
    ).toThrow(IllegalIncidentTransitionError);
  });

  it("returns snapshots instead of exposing mutable storage", () => {
    const store = new IncidentStore();

    expect(store.list()).not.toBe(store.list());
    expect(store.list()[0]).not.toBe(store.list()[0]);
  });
});
