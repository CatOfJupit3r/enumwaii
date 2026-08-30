import { em } from "enumwaii";

import type { IncidentCardProps } from "~/components/incident-card";
import {
  createIncidentStateInspection,
  parseIncidentStateInspection,
} from "~/domain/incident-inspection";
import {
  INCIDENT_STATE,
  type IncidentRecord,
  type IncidentState,
  transitionIncidentInputSchema,
  transitionIncidentState,
} from "~/domain/incidents";

const state: IncidentState = INCIDENT_STATE.TRIAGE;

// @ts-expect-error External raw strings must cross the enumwaii parser boundary.
const rawState: IncidentState = "TRIAGE";

const providerStates = em(["TRIAGE", "MITIGATING"]);
const PROVIDER_STATE = providerStates.enum;

// @ts-expect-error A similarly named member from another declaration is not owned here.
const foreignState: IncidentState = PROVIDER_STATE.TRIAGE;

const incident: IncidentRecord = {
  id: "INC-9000",
  service: "Contract test",
  title: "Ownership remains branded",
  owner: "TypeScript",
  openedAt: "now",
  impact: "compile-time only",
  state,
  version: 0,
};

const cardProps: IncidentCardProps = {
  incident,
  focused: true,
  busy: false,
  onTransition: (_record, to) => {
    transitionIncidentState(state, to);
  },
};

// @ts-expect-error Transition targets cannot bypass ownership with raw members.
transitionIncidentState(INCIDENT_STATE.TRIAGE, "MITIGATING");

const parsedInput = transitionIncidentInputSchema.parse({
  incidentId: "INC-9000",
  to: "MITIGATING",
  expectedVersion: 0,
});

const parsedTarget: IncidentState = parsedInput.to;
const inspectionDto = createIncidentStateInspection(
  INCIDENT_STATE.MONITORING,
  "2026-08-30T12:00:00.000Z",
);
const transportState: string = inspectionDto.state;

// @ts-expect-error A serialized string must be re-parsed before domain use.
const unparsedTransportState: IncidentState = inspectionDto.state;

const reparsedTransportState: IncidentState =
  parseIncidentStateInspection(inspectionDto);

void cardProps;
void foreignState;
void parsedTarget;
void reparsedTransportState;
void rawState;
void transportState;
void unparsedTransportState;
