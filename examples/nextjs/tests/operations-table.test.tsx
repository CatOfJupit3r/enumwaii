import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { OperationsTable } from "../components/operations-table";
import {
  OPERATION_TASKS,
  TASK_STATUS,
  tasksForStatus,
} from "../lib/operations";

describe("operations table", () => {
  it("renders semantic table structure and derived status labels", () => {
    const markup = renderToStaticMarkup(
      <OperationsTable tasks={OPERATION_TASKS} />,
    );

    expect(markup).toContain('class="operations-table"');
    expect(markup).toContain("<thead>");
    expect(markup).toContain("<tbody>");
    expect(markup).toContain("Search operations queue");
    expect(markup).toContain("Search ID, account, owner, or note");
    expect(markup).toContain("Sort by ID");
    for (const label of [
      "ID",
      "Work item",
      "Account",
      "Status",
      "Owner",
      "Window",
      "Signal note",
    ]) {
      expect(markup).toContain(`data-label="${label}"`);
    }
    expect(markup).toContain("Queued");
    expect(markup).toContain('style="background-color:#e7f1eb;color:#416c5a"');
    expect(markup).toContain("Active");
    expect(markup).toContain("Blocked");
    expect(markup).toContain("Done");
    expect(markup).toContain("of 8 tasks visible");
  });

  it("renders a designed empty state for an empty status queue", () => {
    const markup = renderToStaticMarkup(
      <OperationsTable tasks={tasksForStatus(TASK_STATUS.QUEUED)} />,
    );
    const emptyMarkup = renderToStaticMarkup(<OperationsTable tasks={[]} />);

    expect(markup).not.toContain("No tasks in this queue");
    expect(emptyMarkup).toContain("No tasks in this queue");
    expect(emptyMarkup).toContain("This status queue is clear for the moment.");
    expect(emptyMarkup).toContain("of 0 tasks visible");
  });
});
