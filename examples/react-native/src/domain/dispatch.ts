import { em, type InferEnumwaii } from "enumwaii";

const dispatchStages = em(["UNASSIGNED", "DISPATCHED", "ON_SITE", "RESOLVED"]);

export const DISPATCH_STAGE = dispatchStages.enum;
export const DISPATCH_STAGE_VALUES = dispatchStages.values;
export const dispatchStageSchema = dispatchStages;
export type DispatchStage = InferEnumwaii<typeof dispatchStages>;

export interface DispatchStagePresentation {
  readonly label: string;
  readonly eyebrow: string;
  readonly description: string;
  readonly accent: string;
  readonly surface: string;
}

const dispatchStagePresentation =
  dispatchStages.derive<DispatchStagePresentation>()(
    [
      DISPATCH_STAGE.UNASSIGNED,
      {
        label: "Unassigned",
        eyebrow: "Needs an owner",
        description: "Reported work waiting for a field operator.",
        accent: "#8a5a12",
        surface: "#fff3d7",
      },
    ],
    [
      DISPATCH_STAGE.DISPATCHED,
      {
        label: "Dispatched",
        eyebrow: "Operator en route",
        description: "Accepted work with an active response window.",
        accent: "#275ea8",
        surface: "#e5efff",
      },
    ],
    [
      DISPATCH_STAGE.ON_SITE,
      {
        label: "On site",
        eyebrow: "Work in progress",
        description: "The operator has arrived and is recording findings.",
        accent: "#236c57",
        surface: "#def5ec",
      },
    ],
    [
      DISPATCH_STAGE.RESOLVED,
      {
        label: "Resolved",
        eyebrow: "Ready for review",
        description: "The field response is complete and synchronized.",
        accent: "#6b4fa1",
        surface: "#efe8fb",
      },
    ],
  );

const allowedStageTransitions = dispatchStages.deriveTo(
  dispatchStages,
  [DISPATCH_STAGE.UNASSIGNED, [DISPATCH_STAGE.DISPATCHED]],
  [DISPATCH_STAGE.DISPATCHED, [DISPATCH_STAGE.ON_SITE]],
  [DISPATCH_STAGE.ON_SITE, [DISPATCH_STAGE.RESOLVED]],
  [DISPATCH_STAGE.RESOLVED, []],
);

const reportPriorities = em(["ROUTINE", "IMPORTANT", "URGENT"]);
export const REPORT_PRIORITY = reportPriorities.enum;
export const REPORT_PRIORITY_VALUES = reportPriorities.values;
export const reportPrioritySchema = reportPriorities;
export type ReportPriority = InferEnumwaii<typeof reportPriorities>;

export interface ReportPriorityPresentation {
  readonly label: string;
  readonly description: string;
  readonly accent: string;
}

const reportPriorityPresentation =
  reportPriorities.derive<ReportPriorityPresentation>()(
    [
      REPORT_PRIORITY.ROUTINE,
      {
        label: "Routine",
        description: "Can be handled in the normal field queue.",
        accent: "#506575",
      },
    ],
    [
      REPORT_PRIORITY.IMPORTANT,
      {
        label: "Important",
        description: "Needs an operator during the current shift.",
        accent: "#b45f16",
      },
    ],
    [
      REPORT_PRIORITY.URGENT,
      {
        label: "Urgent",
        description: "Escalate immediately and keep dispatch informed.",
        accent: "#b33145",
      },
    ],
  );

export interface DispatchIncident {
  readonly id: string;
  readonly title: string;
  readonly location: string;
  readonly operator: string;
  readonly responseWindow: string;
  readonly stage: DispatchStage;
  readonly priority: ReportPriority;
}

export const DISPATCH_INCIDENTS: readonly DispatchIncident[] = [
  {
    id: "FD-2048",
    title: "Inspect the north pump pressure drop",
    location: "Riverside station · Bay 3",
    operator: "Unassigned",
    responseWindow: "Within 45 minutes",
    stage: DISPATCH_STAGE.UNASSIGNED,
    priority: REPORT_PRIORITY.URGENT,
  },
  {
    id: "FD-2051",
    title: "Replace the damaged loading sensor",
    location: "Atlas depot · Door 12",
    operator: "Mara L.",
    responseWindow: "ETA 14:35",
    stage: DISPATCH_STAGE.DISPATCHED,
    priority: REPORT_PRIORITY.IMPORTANT,
  },
  {
    id: "FD-2039",
    title: "Verify the cold-room alarm reset",
    location: "Meridian clinic · Lower level",
    operator: "Noor A.",
    responseWindow: "Arrived 13:48",
    stage: DISPATCH_STAGE.ON_SITE,
    priority: REPORT_PRIORITY.URGENT,
  },
  {
    id: "FD-2027",
    title: "Confirm backup generator telemetry",
    location: "Juniper hub · Utility room",
    operator: "Sasha T.",
    responseWindow: "Closed 12:16",
    stage: DISPATCH_STAGE.RESOLVED,
    priority: REPORT_PRIORITY.ROUTINE,
  },
];

export type BoundaryDecisionSource =
  "request" | "default" | "fallback" | "rejected";

export interface AcceptedStageDecision {
  readonly accepted: true;
  readonly source: Exclude<BoundaryDecisionSource, "rejected">;
  readonly stage: DispatchStage;
  readonly explanation: string;
}

export interface RejectedStageDecision {
  readonly accepted: false;
  readonly source: "rejected";
  readonly explanation: string;
}

export type StageBoundaryDecision =
  AcceptedStageDecision | RejectedStageDecision;

export interface StageBoundaryReport {
  readonly input: {
    readonly kind: "missing" | "string" | "repeated query" | "wrong type";
    readonly display: string;
  };
  readonly defaultOnly: StageBoundaryDecision;
  readonly recovery: AcceptedStageDecision;
}

export interface NewFieldReport {
  readonly summary: string;
  readonly notes: string;
  readonly priority: ReportPriority;
}

export type FieldReportValidation =
  | { readonly success: true; readonly report: NewFieldReport }
  | {
      readonly success: false;
      readonly field: "summary" | "priority";
      readonly message: string;
    };

function isStageList(
  input: DispatchStage | readonly DispatchStage[],
): input is readonly DispatchStage[] {
  return Array.isArray(input);
}

function acceptedStageDecision(
  stage: DispatchStage,
  source: AcceptedStageDecision["source"],
): AcceptedStageDecision {
  return {
    accepted: true,
    source,
    stage,
    explanation:
      source === "request"
        ? "The external value matched an owned dispatch member."
        : source === "default"
          ? "No value was supplied, so the nil-only default was applied."
          : "The malformed value was replaced by an explicit recovery member.",
  };
}

function describeBoundaryInput(
  input: unknown,
  result: (typeof dispatchStages)["~safeParseResult"],
): StageBoundaryReport["input"] {
  if (input === null || input === undefined) {
    return { kind: "missing", display: input === null ? "null" : "undefined" };
  }

  if (result.success) {
    return { kind: "string", display: result.value };
  }

  return {
    kind: Array.isArray(input)
      ? "repeated query"
      : typeof input === "string"
        ? "string"
        : "wrong type",
    display: result.error.receivedText,
  };
}

export function describeDispatchStage(
  stage: DispatchStage,
): DispatchStagePresentation {
  return dispatchStagePresentation.get(stage);
}

export function describeReportPriority(
  priority: ReportPriority,
): ReportPriorityPresentation {
  return reportPriorityPresentation.get(priority);
}

export function nextDispatchStages(
  stage: DispatchStage,
): readonly DispatchStage[] {
  const next = allowedStageTransitions.get(stage);
  return isStageList(next) ? next : [next];
}

export function incidentsAtStage(
  stage: DispatchStage,
): readonly DispatchIncident[] {
  return DISPATCH_INCIDENTS.filter((incident) => incident.stage === stage);
}

export function inspectStageBoundary(input: unknown): StageBoundaryReport {
  const defaultOnlyResult = dispatchStages.safeParse(input, {
    default: DISPATCH_STAGE.UNASSIGNED,
  });
  const recoveredStage = dispatchStages.parse(input, {
    default: DISPATCH_STAGE.UNASSIGNED,
    fallback: DISPATCH_STAGE.UNASSIGNED,
  });
  const source = input === null || input === undefined ? "default" : "request";

  return {
    input: describeBoundaryInput(input, defaultOnlyResult),
    defaultOnly: defaultOnlyResult.success
      ? acceptedStageDecision(defaultOnlyResult.value, source)
      : {
          accepted: false,
          source: "rejected",
          explanation:
            "A default covers only null or undefined; this value remains rejected.",
        },
    recovery: acceptedStageDecision(
      recoveredStage,
      defaultOnlyResult.success ? source : "fallback",
    ),
  };
}

export function validateFieldReport(input: {
  readonly summary: string;
  readonly notes: string;
  readonly priority: unknown;
}): FieldReportValidation {
  const summary = input.summary.trim();
  if (summary.length < 4) {
    return {
      success: false,
      field: "summary",
      message: "Add a summary with at least four characters.",
    };
  }

  const priority = reportPriorities.safeParse(input.priority);
  if (!priority.success) {
    return {
      success: false,
      field: "priority",
      message: "Priority must be ROUTINE, IMPORTANT, or URGENT.",
    };
  }

  return {
    success: true,
    report: {
      summary,
      notes: input.notes.trim(),
      priority: priority.value,
    },
  };
}
