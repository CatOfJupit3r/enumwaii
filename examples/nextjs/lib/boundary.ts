import {
  TASK_STATUS,
  statusMetadata,
  taskStatusSchema,
  type TaskStatus,
} from "./operations";

export type BoundaryDecisionSource =
  "request" | "default" | "fallback" | "rejected";

export interface AcceptedBoundaryDecision {
  readonly accepted: true;
  readonly source: Exclude<BoundaryDecisionSource, "rejected">;
  readonly status: TaskStatus;
  readonly label: string;
  readonly explanation: string;
}

export interface RejectedBoundaryDecision {
  readonly accepted: false;
  readonly source: "rejected";
  readonly explanation: string;
}

export type BoundaryDecision =
  AcceptedBoundaryDecision | RejectedBoundaryDecision;

export interface BoundaryReport {
  readonly input: {
    readonly kind: "missing" | "string" | "wrong type";
    readonly display: string;
  };
  readonly defaultOnly: BoundaryDecision;
  readonly recovery: AcceptedBoundaryDecision;
}

function acceptedDecision(
  status: TaskStatus,
  source: AcceptedBoundaryDecision["source"],
): AcceptedBoundaryDecision {
  const metadata = statusMetadata(status);

  return {
    accepted: true,
    source,
    status,
    label: metadata.label,
    explanation:
      source === "request"
        ? "The input matched an owned member and crossed the boundary."
        : source === "default"
          ? "The input was nil, so the explicit default was applied."
          : "The input was invalid, so the explicit fallback recovered safely.",
  };
}

function inputDescription(
  input: unknown,
  result: (typeof taskStatusSchema)["~safeParseResult"],
): BoundaryReport["input"] {
  if (input === undefined || input === null) {
    return { kind: "missing", display: input === null ? "null" : "undefined" };
  }

  if (result.success) {
    return { kind: "string", display: result.value };
  }

  return {
    kind: typeof input === "string" ? "string" : "wrong type",
    display: result.error.receivedText,
  };
}

function decisionSource(input: unknown): AcceptedBoundaryDecision["source"] {
  return input === undefined || input === null ? "default" : "request";
}

export function inspectStatusBoundary(input: unknown): BoundaryReport {
  const defaultOnlyResult = taskStatusSchema.safeParse(input, {
    default: TASK_STATUS.QUEUED,
  });
  const recoveredStatus = taskStatusSchema.parse(input, {
    default: TASK_STATUS.QUEUED,
    fallback: TASK_STATUS.QUEUED,
  });

  const defaultOnly: BoundaryDecision = defaultOnlyResult.success
    ? acceptedDecision(defaultOnlyResult.value, decisionSource(input))
    : {
        accepted: false,
        source: "rejected",
        explanation:
          "A default only covers null or undefined; malformed input remains rejected.",
      };
  const recoverySource = defaultOnlyResult.success
    ? decisionSource(input)
    : "fallback";

  return {
    input: inputDescription(input, defaultOnlyResult),
    defaultOnly,
    recovery: acceptedDecision(recoveredStatus, recoverySource),
  };
}
