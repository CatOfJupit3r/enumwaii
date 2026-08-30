import {
  TASK_STATUS,
  statusMetadata,
  tasksForStatus,
  type OperationTask,
} from "./lib/operations";

tasksForStatus(TASK_STATUS.IN_PROGRESS);
statusMetadata(TASK_STATUS.BLOCKED);

// @ts-expect-error Domain selectors require an owned enumwaii member.
tasksForStatus("IN_PROGRESS");

const rawTask: OperationTask = {
  id: "OPS-9999",
  title: "Unsafe task",
  account: "External",
  owner: "Unknown",
  window: "Unknown",
  note: "This assignment is intentionally rejected by TypeScript.",
  // @ts-expect-error Hydrated domain records cannot carry an unparsed raw string.
  status: "BLOCKED",
};

void rawTask;
