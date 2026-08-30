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

function inputDescription(input: unknown): BoundaryReport["input"] {
  if (input === undefined || input === null) {
    return { kind: "missing", display: input === null ? "null" : "undefined" };
  }

  if (typeof input === "string") {
    return { kind: "string", display: `"${input}"` };
  }

  return {
    kind: "wrong type",
    display: formatUnknown(input),
  };
}

function formatUnknown(input: unknown): string {
  try {
    const encoded = JSON.stringify(input);
    if (encoded !== undefined) return encoded;
  } catch {
    return Object.prototype.toString.call(input);
  }

  if (typeof input === "string") return input;
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
    input: inputDescription(input),
    defaultOnly,
    recovery: acceptedDecision(recoveredStatus, recoverySource),
  };
}
