import { em, type InferEnumwaii } from "enumwaii";

const taskStatuses = em(["QUEUED", "IN_PROGRESS", "BLOCKED", "COMPLETE"]);
export const TASK_STATUS = taskStatuses.enum;
export const taskStatusSchema = taskStatuses;
export type TaskStatus = InferEnumwaii<typeof taskStatuses>;

export interface TaskStatusMetadata {
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly accent: string;
  readonly surface: string;
}

export const TASK_STATUS_METADATA = taskStatuses.derive<TaskStatusMetadata>()(
  [
    TASK_STATUS.QUEUED,
    {
      label: "Ready for pickup",
      shortLabel: "Queued",
      description: "Scoped work waiting for an available operator.",
      accent: "#416c5a",
      surface: "#e7f1eb",
    },
  ],
  [
    TASK_STATUS.IN_PROGRESS,
    {
      label: "In progress",
      shortLabel: "Active",
      description: "Work with an owner and an active delivery window.",
      accent: "#c05d38",
      surface: "#fae9df",
    },
  ],
  [
    TASK_STATUS.BLOCKED,
    {
      label: "Needs intervention",
      shortLabel: "Blocked",
      description: "Work paused on a dependency or decision.",
      accent: "#9f3f49",
      surface: "#f8e6e8",
    },
  ],
  [
    TASK_STATUS.COMPLETE,
    {
      label: "Completed",
      shortLabel: "Done",
      description: "Verified work delivered during this operating window.",
      accent: "#506586",
      surface: "#e7ebf2",
    },
  ],
);

export interface OperationTask {
  readonly id: string;
  readonly title: string;
  readonly account: string;
  readonly owner: string;
  readonly window: string;
  readonly note: string;
  readonly status: TaskStatus;
}

export const OPERATION_TASKS: readonly OperationTask[] = [
  {
    id: "OPS-2841",
    title: "Reconcile carrier exception feed",
    account: "Northwind Logistics",
    owner: "Mina K.",
    window: "09:30–10:15",
    note: "12 records need a destination decision before the morning cutoff.",
    status: TASK_STATUS.IN_PROGRESS,
  },
  {
    id: "OPS-2844",
    title: "Release the priority replenishment batch",
    account: "Atlas Retail",
    owner: "Unassigned",
    window: "Before 11:00",
    note: "Inventory checks passed; the batch is ready for an operator.",
    status: TASK_STATUS.QUEUED,
  },
  {
    id: "OPS-2848",
    title: "Verify customs document correction",
    account: "Kanso Supply",
    owner: "Leo P.",
    window: "10:00–10:45",
    note: "The corrected tariff code is waiting on compliance review.",
    status: TASK_STATUS.BLOCKED,
  },
  {
    id: "OPS-2853",
    title: "Confirm cold-chain handoff",
    account: "Meridian Health",
    owner: "Sasha T.",
    window: "10:30–11:10",
    note: "Monitor the final sensor packet and confirm receipt with the depot.",
    status: TASK_STATUS.IN_PROGRESS,
  },
  {
    id: "OPS-2856",
    title: "Audit duplicate delivery alerts",
    account: "Fieldstone Goods",
    owner: "Unassigned",
    window: "Before 12:00",
    note: "The support queue shows six alerts sharing the same tracking IDs.",
    status: TASK_STATUS.QUEUED,
  },
  {
    id: "OPS-2827",
    title: "Publish overnight service summary",
    account: "Internal operations",
    owner: "Noor A.",
    window: "Completed 08:42",
    note: "All regional handoffs are included in the signed report.",
    status: TASK_STATUS.COMPLETE,
  },
  {
    id: "OPS-2835",
    title: "Close the weather reroute review",
    account: "Juniper Home",
    owner: "Owen R.",
    window: "Completed 09:04",
    note: "Replacement routes are live and downstream teams were notified.",
    status: TASK_STATUS.COMPLETE,
  },
  {
    id: "OPS-2860",
    title: "Approve high-value shipment release",
    account: "Cobalt Systems",
    owner: "Priya D.",
    window: "Decision by 11:20",
    note: "Finance verification is missing from the release packet.",
    status: TASK_STATUS.BLOCKED,
  },
];

export type StatusResolutionPolicy = "request" | "default" | "fallback";

export interface DashboardStatusResolution {
  readonly status: TaskStatus;
  readonly policy: StatusResolutionPolicy;
  readonly notice: string;
}

export function resolveDashboardStatus(
  input: unknown,
): DashboardStatusResolution {
  const strictResult = taskStatuses.safeParse(input, {
    default: TASK_STATUS.QUEUED,
  });

  if (strictResult.success) {
    const defaulted = input === null || input === undefined;

    return {
      status: strictResult.value,
      policy: defaulted ? "default" : "request",
      notice: defaulted
        ? "No status was supplied, so the nil-only default selected the ready queue."
        : "The URL value was validated before it entered the dashboard domain.",
    };
  }

  return {
    status: taskStatuses.parse(input, { fallback: TASK_STATUS.QUEUED }),
    policy: "fallback",
    notice:
      "That URL value is not a known status. The recovery policy kept the dashboard usable with the ready queue.",
  };
}

export function tasksForStatus(status: TaskStatus): readonly OperationTask[] {
  return OPERATION_TASKS.filter((task) => task.status === status);
}

export function countTasks(status: TaskStatus): number {
  return tasksForStatus(status).length;
}

export function statusMetadata(status: TaskStatus): TaskStatusMetadata {
  return TASK_STATUS_METADATA.get(status);
}

export function allTaskStatuses(): readonly TaskStatus[] {
  return taskStatuses.values;
}
