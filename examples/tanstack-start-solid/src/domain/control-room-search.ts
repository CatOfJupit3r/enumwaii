import { z } from "zod";

import {
  INCIDENT_STATE,
  incidentStateSchema,
  type IncidentState,
} from "./incidents";

export type FocusResolution = "requested" | "default" | "fallback";

export interface ControlRoomFocus {
  readonly focus: IncidentState;
  readonly resolution: FocusResolution;
  readonly received: string | null;
}

export const controlRoomSearchSchema = z
  .object({
    focus: z.unknown().optional(),
  })
  .transform(({ focus }) => resolveControlRoomFocus(focus));

export type ControlRoomSearch = z.output<typeof controlRoomSearchSchema>;

export function resolveControlRoomFocus(input: unknown): ControlRoomFocus {
  if (input === null || input === undefined) {
    return {
      focus: incidentStateSchema.parse(input, {
        default: INCIDENT_STATE.MITIGATING,
      }),
      resolution: "default",
      received: null,
    };
  }

  const parsed = incidentStateSchema.safeParse(input);
  if (parsed.success) {
    return {
      focus: parsed.value,
      resolution: "requested",
      received: parsed.value,
    };
  }

  return {
    focus: incidentStateSchema.parse(input, {
      fallback: INCIDENT_STATE.TRIAGE,
    }),
    resolution: "fallback",
    received: parsed.error.receivedText,
  };
}
