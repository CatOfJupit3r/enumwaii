import { useReducer } from "react";
import { em, type InferEnumwaii } from "enumwaii";

const FILTERS = em(["ALL", "ACTIVE", "COMPLETED"]);
export const FILTER = FILTERS.enum;
export type Filter = InferEnumwaii<typeof FILTERS>;

const TASK_STATUSES = em(["ACTIVE", "COMPLETED"]);
const TASK_STATUS = TASK_STATUSES.enum;
type TaskStatus = InferEnumwaii<typeof TASK_STATUSES>;

export interface Task {
  readonly id: string;
  readonly title: string;
  readonly detail: string;
  readonly status: TaskStatus;
}

export const TASKS: readonly Task[] = [
  {
    id: "export-edge-case",
    title: "Fix the export edge case",
    detail: "Confirm CSV output when a task has no due date.",
    status: TASK_STATUS.ACTIVE,
  },
  {
    id: "review-audit-log",
    title: "Review the audit log",
    detail: "Check the last deployment for unexpected permission changes.",
    status: TASK_STATUS.ACTIVE,
  },
  {
    id: "invite-design-partner",
    title: "Invite the design partner",
    detail: "Send the workspace invite before tomorrow's critique.",
    status: TASK_STATUS.COMPLETED,
  },
];

const STATUS_METADATA = TASK_STATUSES.derive(
  [TASK_STATUS.ACTIVE, { label: "In progress", color: "#9a3412" }],
  [TASK_STATUS.COMPLETED, { label: "Completed", color: "#166534" }],
);

/** Every filter owns both its copy and its task-selection rule. */
export const FILTER_METADATA = FILTERS.derive(
  [
    FILTER.ALL,
    {
      label: "All tasks",
      description: "A complete view of the team's current work.",
      emptyMessage: "There are no tasks in this workspace yet.",
      matches: (_task: Task) => true,
    },
  ],
  [
    FILTER.ACTIVE,
    {
      label: "In progress",
      description: "Work that still needs attention from the team.",
      emptyMessage: "Everything is complete. Nice work!",
      matches: (task: Task) => task.status === TASK_STATUS.ACTIVE,
    },
  ],
  [
    FILTER.COMPLETED,
    {
      label: "Completed",
      description: "Recently finished work, kept here for visibility.",
      emptyMessage: "Completed tasks will appear here.",
      matches: (task: Task) => task.status === TASK_STATUS.COMPLETED,
    },
  ],
);

const FILTER_ACTIONS = em(["SELECT", "RESET"]);
/** Raw cases are intentionally used only as native reducer discriminants. */
export const FILTER_ACTION_CASES = FILTER_ACTIONS.cases;

export type FilterAction =
  | {
      readonly type: typeof FILTER_ACTION_CASES.SELECT;
      readonly filter: Filter;
    }
  | { readonly type: typeof FILTER_ACTION_CASES.RESET };

export interface FilterState {
  readonly selected: Filter;
}

export function filterReducer(
  state: FilterState,
  action: FilterAction,
): FilterState {
  switch (action.type) {
    case FILTER_ACTION_CASES.SELECT:
      return { ...state, selected: action.filter };
    case FILTER_ACTION_CASES.RESET:
      return { ...state, selected: FILTER.ALL };
  }

  return assertNever(action);
}

function assertNever(value: never): never {
  throw new Error(`Unhandled filter action: ${String(value)}`);
}

/** Read a query/URL boundary, keeping malformed or absent values out of state. */
export function filterFromUrl(input: unknown): Filter {
  let candidate: unknown;

  if (input instanceof URLSearchParams) {
    candidate = input.get("filter");
  } else if (input instanceof URL) {
    candidate = input.searchParams.get("filter");
  } else if (typeof input === "string") {
    try {
      const url = new URL(input, "https://enumwaii.example");
      candidate = url.searchParams.get("filter");

      // Also accept a plain query string such as "filter=ACTIVE".
      if (candidate === null && !input.includes("?")) {
        candidate = new URLSearchParams(input).get("filter");
      }
    } catch {
      candidate = undefined;
    }
  }

  return FILTERS.parse(candidate, {
    default: FILTER.ALL,
    fallback: FILTER.ALL,
  });
}

export interface FilterPanelProps {
  /** A URL, query string, URLSearchParams, or unknown external value. */
  readonly initialUrl?: unknown;
  /** Data may arrive already hydrated from an application-owned boundary. */
  readonly tasks?: readonly Task[];
}

const styles = {
  shell: {
    background: "#f8fafc",
    color: "#172033",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
    margin: "0 auto",
    maxWidth: 720,
    minHeight: "100vh",
    padding: "48px 24px",
  },
  eyebrow: {
    color: "#6366f1",
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: "0.12em",
    margin: 0,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 36,
    letterSpacing: "-0.04em",
    margin: "8px 0",
  },
  intro: {
    color: "#64748b",
    lineHeight: 1.6,
    margin: 0,
  },
  card: {
    background: "#ffffff",
    border: "1px solid #e2e8f0",
    borderRadius: 20,
    boxShadow: "0 16px 40px rgba(15, 23, 42, 0.08)",
    marginTop: 32,
    overflow: "hidden",
  },
  filterBar: {
    borderBottom: "1px solid #e2e8f0",
    display: "flex",
    gap: 8,
    padding: 12,
  },
  filterButton: {
    background: "transparent",
    border: 0,
    borderRadius: 12,
    color: "#64748b",
    cursor: "pointer",
    flex: 1,
    font: "inherit",
    fontSize: 13,
    fontWeight: 650,
    padding: "10px 12px",
  },
  content: {
    padding: "24px 28px 28px",
  },
  contentHeader: {
    alignItems: "start",
    display: "flex",
    gap: 20,
    justifyContent: "space-between",
  },
  heading: {
    fontSize: 22,
    letterSpacing: "-0.02em",
    margin: 0,
  },
  description: {
    color: "#64748b",
    fontSize: 14,
    lineHeight: 1.5,
    margin: "6px 0 0",
  },
  reset: {
    background: "#eef2ff",
    border: 0,
    borderRadius: 10,
    color: "#4338ca",
    cursor: "pointer",
    font: "inherit",
    fontSize: 12,
    fontWeight: 700,
    padding: "9px 12px",
    whiteSpace: "nowrap",
  },
  list: {
    listStyle: "none",
    margin: "24px 0 0",
    padding: 0,
  },
  task: {
    alignItems: "center",
    borderTop: "1px solid #f1f5f9",
    display: "flex",
    gap: 16,
    justifyContent: "space-between",
    padding: "17px 0",
  },
  taskTitle: {
    fontSize: 14,
    fontWeight: 700,
    margin: 0,
  },
  taskDetail: {
    color: "#64748b",
    fontSize: 13,
    lineHeight: 1.45,
    margin: "4px 0 0",
  },
  status: {
    borderRadius: 999,
    flexShrink: 0,
    fontSize: 11,
    fontWeight: 700,
    padding: "6px 9px",
  },
  empty: {
    background: "#f8fafc",
    borderRadius: 12,
    color: "#64748b",
    margin: "24px 0 0",
    padding: 20,
    textAlign: "center",
  },
} as const;

export function FilterPanel({
  initialUrl,
  tasks = TASKS,
}: FilterPanelProps = {}) {
  const [state, dispatch] = useReducer(
    filterReducer,
    filterFromUrl(initialUrl),
    (selected): FilterState => ({ selected }),
  );
  const selectedMetadata = FILTER_METADATA.get(state.selected);
  const visibleTasks = tasks.filter(selectedMetadata.matches);

  return (
    <main style={styles.shell}>
      <header>
        <p style={styles.eyebrow}>enumwaii · React 19</p>
        <h1 style={styles.title}>Team task queue</h1>
        <p style={styles.intro}>
          A small filter surface with typed state, safe URL input, and an
          exhaustive presentation model.
        </p>
      </header>

      <section aria-label="Task filters" style={styles.card}>
        <div role="group" aria-label="Task filters" style={styles.filterBar}>
          {FILTERS.values.map((filter) => {
            const metadata = FILTER_METADATA.get(filter);
            const selected = filter === state.selected;
            const count = tasks.filter(metadata.matches).length;

            return (
              <button
                aria-pressed={selected}
                key={filter}
                onClick={() =>
                  dispatch({ type: FILTER_ACTION_CASES.SELECT, filter })
                }
                style={
                  selected
                    ? {
                        ...styles.filterButton,
                        background: "#eef2ff",
                        color: "#4338ca",
                      }
                    : styles.filterButton
                }
                type="button"
              >
                {metadata.label} · {count}
              </button>
            );
          })}
        </div>

        <div style={styles.content}>
          <div style={styles.contentHeader}>
            <div>
              <h2 style={styles.heading}>{selectedMetadata.label}</h2>
              <p style={styles.description}>{selectedMetadata.description}</p>
            </div>
            <button
              onClick={() => dispatch({ type: FILTER_ACTION_CASES.RESET })}
              style={styles.reset}
              type="button"
            >
              Reset
            </button>
          </div>

          {visibleTasks.length > 0 ? (
            <ul style={styles.list}>
              {visibleTasks.map((task) => {
                const status = STATUS_METADATA.get(task.status);

                return (
                  <li key={task.id} style={styles.task}>
                    <div>
                      <p style={styles.taskTitle}>{task.title}</p>
                      <p style={styles.taskDetail}>{task.detail}</p>
                    </div>
                    <span
                      style={{
                        ...styles.status,
                        background: `${status.color}18`,
                        color: status.color,
                      }}
                    >
                      {status.label}
                    </span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p style={styles.empty}>{selectedMetadata.emptyMessage}</p>
          )}
        </div>
      </section>
    </main>
  );
}
