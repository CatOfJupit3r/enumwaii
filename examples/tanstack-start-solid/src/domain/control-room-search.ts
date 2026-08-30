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

function describeReceivedValue(input: unknown): string {
  if (typeof input === "string") return input;

  try {
    const encoded = JSON.stringify(input);
    if (encoded !== undefined) return encoded;
  } catch {
    return Object.prototype.toString.call(input);
  }

  if (
    typeof input === "number" ||
    typeof input === "boolean" ||
    typeof input === "bigint"
  ) {
    return input.toString();
  }
  if (typeof input === "symbol") return input.description ?? "Symbol()";
  if (typeof input === "function") {
    return `[function ${input.name || "anonymous"}]`;
  }
  return Object.prototype.toString.call(input);
}

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
      received: describeReceivedValue(input),
    };
  }

  return {
    focus: incidentStateSchema.parse(input, {
      fallback: INCIDENT_STATE.TRIAGE,
    }),
    resolution: "fallback",
    received: describeReceivedValue(input),
  };
}
