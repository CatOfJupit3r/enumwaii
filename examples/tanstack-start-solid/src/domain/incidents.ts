import { em, type InferEnumwaii } from "enumwaii";
import { zodSchema } from "enumwaii/zod";
import { z } from "zod";

const incidentStates = em(["TRIAGE", "MITIGATING", "MONITORING", "RESOLVED"]);

export const INCIDENT_STATE = incidentStates.enum;
export const incidentStateSchema = incidentStates;
export type IncidentState = InferEnumwaii<typeof incidentStates>;

export interface IncidentStatePresentation {
  readonly label: string;
  readonly shortLabel: string;
  readonly summary: string;
  readonly instruction: string;
  readonly tone: "critical" | "active" | "watch" | "clear";
  readonly sequence: number;
}

const incidentStatePresentation = incidentStates.derive(
  [
    INCIDENT_STATE.TRIAGE,
    {
      label: "Triage",
      shortLabel: "Triage",
      summary: "Impact is confirmed; ownership and scope are still forming.",
      instruction: "Name an incident lead and establish the blast radius.",
      tone: "critical",
      sequence: 1,
    },
  ],
  [
    INCIDENT_STATE.MITIGATING,
    {
      label: "Mitigating",
      shortLabel: "Mitigate",
      summary: "The team is actively reducing customer-facing impact.",
      instruction: "Ship the safest reversible action and record evidence.",
      tone: "active",
      sequence: 2,
    },
  ],
  [
    INCIDENT_STATE.MONITORING,
    {
      label: "Monitoring",
      shortLabel: "Monitor",
      summary: "The fix is live while telemetry confirms recovery.",
      instruction: "Hold the release gate until the observation window ends.",
      tone: "watch",
      sequence: 3,
    },
  ],
  [
    INCIDENT_STATE.RESOLVED,
    {
      label: "Resolved",
      shortLabel: "Resolve",
      summary: "Customer impact has ended and the release gate can clear.",
      instruction: "Capture follow-ups before closing the control room.",
      tone: "clear",
      sequence: 4,
    },
  ],
);

const allowedIncidentTransitions = incidentStates.deriveTo(
  incidentStates,
  [INCIDENT_STATE.TRIAGE, [INCIDENT_STATE.MITIGATING]],
  [
    INCIDENT_STATE.MITIGATING,
    [INCIDENT_STATE.MONITORING, INCIDENT_STATE.TRIAGE],
  ],
  [
    INCIDENT_STATE.MONITORING,
    [INCIDENT_STATE.RESOLVED, INCIDENT_STATE.MITIGATING],
  ],
  [INCIDENT_STATE.RESOLVED, []],
);

export interface IncidentRecord {
  readonly id: string;
  readonly service: string;
  readonly title: string;
  readonly owner: string;
  readonly openedAt: string;
  readonly impact: string;
  readonly state: IncidentState;
  readonly version: number;
}

export const INITIAL_INCIDENTS = [
  {
    id: "INC-2417",
    service: "Checkout API",
    title: "Elevated payment retries in EU-West",
    owner: "Mira Chen",
    openedAt: "18 min ago",
    impact: "4.8% of checkout attempts",
    state: INCIDENT_STATE.MITIGATING,
    version: 3,
  },
  {
    id: "INC-2414",
    service: "Event pipeline",
    title: "Webhook delivery backlog recovering",
    owner: "Theo Martin",
    openedAt: "46 min ago",
    impact: "p95 delay at 72 seconds",
    state: INCIDENT_STATE.MONITORING,
    version: 6,
  },
  {
    id: "INC-2409",
    service: "Identity edge",
    title: "Token refresh regression contained",
    owner: "Ana Silva",
    openedAt: "2 hr ago",
    impact: "No current customer impact",
    state: INCIDENT_STATE.RESOLVED,
    version: 8,
  },
] satisfies readonly IncidentRecord[];

export const transitionIncidentInputSchema = z.object({
  incidentId: z.string().trim().min(1),
  to: zodSchema(incidentStates),
  expectedVersion: z.number().int().nonnegative(),
});

export type TransitionIncidentInput = z.output<
  typeof transitionIncidentInputSchema
>;

export class IllegalIncidentTransitionError extends Error {
  public constructor(
    public readonly from: IncidentState,
    public readonly to: IncidentState,
  ) {
    super(`Cannot move an incident from ${from} to ${to}.`);
    this.name = "IllegalIncidentTransitionError";
  }
}

export function describeIncidentState(
  state: IncidentState,
): IncidentStatePresentation {
  return incidentStatePresentation.get(state);
}

export function listIncidentStates(): readonly IncidentState[] {
  return incidentStates.values;
}

export function getAllowedIncidentTransitions(
  state: IncidentState,
): readonly IncidentState[] {
  return allowedIncidentTransitions.get(state);
}

export function canTransitionIncident(
  from: IncidentState,
  to: IncidentState,
): boolean {
  return getAllowedIncidentTransitions(from).some(
    (candidate) => candidate === to,
  );
}

export function transitionIncidentState(
  from: IncidentState,
  to: IncidentState,
): IncidentState {
  if (!canTransitionIncident(from, to)) {
    throw new IllegalIncidentTransitionError(from, to);
  }

  return to;
}

export function countIncidentsInState(
  incidents: readonly IncidentRecord[],
  state: IncidentState,
): number {
  return incidents.filter((incident) => incident.state === state).length;
}
