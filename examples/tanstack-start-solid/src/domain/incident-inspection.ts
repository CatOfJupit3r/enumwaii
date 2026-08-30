import {
  describeIncidentState,
  incidentStateSchema,
  type IncidentState,
} from "./incidents";

export interface IncidentStateInspectionDto {
  readonly state: string;
  readonly summary: string;
  readonly instruction: string;
  readonly validatedAt: string;
}

export function createIncidentStateInspection(
  input: unknown,
  validatedAt: string,
): IncidentStateInspectionDto {
  const state = incidentStateSchema.parse(input);
  const presentation = describeIncidentState(state);

  return {
    state: String(state),
    summary: presentation.summary,
    instruction: presentation.instruction,
    validatedAt,
  };
}

export function parseIncidentStateInspection(
  inspection: IncidentStateInspectionDto,
): IncidentState {
  return incidentStateSchema.parse(inspection.state);
}
