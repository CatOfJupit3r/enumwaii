"use client";

import { useState } from "react";
import {
  createColumnHelper,
  createFilteredRowModel,
  createSortedRowModel,
  filterFn_includesString,
  globalFilteringFeature,
  columnFilteringFeature,
  rowSortingFeature,
  sortFn_alphanumeric,
  tableFeatures,
  useTable,
  type SortingState,
} from "@tanstack/react-table";

import { statusMetadata, type OperationTask } from "../lib/operations";

const operationTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
  filterFns: { includesString: filterFn_includesString },
  sortFns: { alphanumeric: sortFn_alphanumeric },
});

const operationColumnHelper = createColumnHelper<
  typeof operationTableFeatures,
  OperationTask
>();

const operationTableColumns = operationColumnHelper.columns([
  operationColumnHelper.accessor("id", {
    header: "ID",
    sortFn: "alphanumeric",
  }),
  operationColumnHelper.accessor("title", {
    header: "Work item",
    sortFn: "alphanumeric",
  }),
  operationColumnHelper.accessor("account", {
    header: "Account",
    sortFn: "alphanumeric",
  }),
  operationColumnHelper.accessor("status", {
    header: "Status",
    sortFn: "alphanumeric",
    cell: ({ getValue }) => {
      const metadata = statusMetadata(getValue());

      return (
        <span
          className="status-badge"
          style={{ backgroundColor: metadata.surface, color: metadata.accent }}
        >
          {metadata.shortLabel}
        </span>
      );
    },
  }),
  operationColumnHelper.accessor("owner", {
    header: "Owner",
    sortFn: "alphanumeric",
  }),
  operationColumnHelper.accessor("window", {
    header: "Window",
    sortFn: "alphanumeric",
  }),
  operationColumnHelper.accessor("note", {
    header: "Signal note",
    enableSorting: false,
  }),
]);

const operationColumnLabels: Readonly<Record<string, string>> = {
  account: "Account",
  id: "ID",
  note: "Signal note",
  owner: "Owner",
  status: "Status",
  title: "Work item",
  window: "Window",
};

interface OperationsTableProps {
  readonly tasks: readonly OperationTask[];
}

function columnHeaderLabel(columnId: string): string {
  return operationColumnLabels[columnId] ?? columnId;
}

function sortAnnouncement(
  label: string,
  direction: false | "asc" | "desc",
): string {
  if (direction === "asc") {
    return `${label} sorted ascending. Activate to change the sort.`;
  }

  if (direction === "desc") {
    return `${label} sorted descending. Activate to change the sort.`;
  }

  return `Sort by ${label}`;
}

export function OperationsTable({ tasks }: OperationsTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useTable(
    {
      features: operationTableFeatures,
      columns: operationTableColumns,
      data: tasks,
      globalFilterFn: "includesString",
      state: { globalFilter, sorting },
      onGlobalFilterChange: setGlobalFilter,
      onSortingChange: setSorting,
    },
    (state) => ({
      globalFilter: state.globalFilter,
      sorting: state.sorting,
    }),
  );
  const rows = table.getRowModel().rows;
  const hasSearch = globalFilter.trim().length > 0;

  return (
    <div className="operations-table-shell">
      <div className="table-toolbar">
        <label className="table-search">
          <span>Search queue</span>
          <input
            aria-label="Search operations queue"
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder="Search ID, account, owner, or note"
            type="search"
            value={globalFilter}
          />
        </label>
        <div className="table-results" aria-live="polite">
          <strong>{rows.length}</strong>
          <span>of {tasks.length} tasks visible</span>
        </div>
        <button
          className="table-clear"
          disabled={!globalFilter}
          onClick={() => table.setGlobalFilter("")}
          type="button"
        >
          Clear search
        </button>
      </div>

      <div className="operations-table-wrap">
        <table className="operations-table" aria-label="Operations queue">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  const label = columnHeaderLabel(header.column.id);
                  const direction = header.column.getIsSorted();

                  return (
                    <th
                      aria-sort={
                        direction === "asc"
                          ? "ascending"
                          : direction === "desc"
                            ? "descending"
                            : "none"
                      }
                      key={header.id}
                      scope="col"
                    >
                      {header.isPlaceholder ? null : header.column.getCanSort() ? (
                        <button
                          aria-label={sortAnnouncement(label, direction)}
                          className="table-sort"
                          onClick={header.column.getToggleSortingHandler()}
                          type="button"
                        >
                          <table.FlexRender header={header} />
                          <span aria-hidden="true" className="sort-indicator">
                            {direction === "asc"
                              ? "↑"
                              : direction === "desc"
                                ? "↓"
                                : "↕"}
                          </span>
                        </button>
                      ) : (
                        <table.FlexRender header={header} />
                      )}
                    </th>
                  );
                })}
              </tr>
            ))}
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr key={row.id}>
                  {row.getAllCells().map((cell) => (
                    <td
                      data-label={columnHeaderLabel(cell.column.id)}
                      key={cell.id}
                    >
                      <table.FlexRender cell={cell} />
                    </td>
                  ))}
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={operationTableColumns.length}>
                  <div className="table-empty-state">
                    <span aria-hidden="true">⌕</span>
                    <strong>
                      {hasSearch
                        ? "No matching tasks"
                        : "No tasks in this queue"}
                    </strong>
                    <p>
                      {hasSearch
                        ? "Try a different task, account, owner, or status search."
                        : "This status queue is clear for the moment."}
                    </p>
                    {hasSearch ? (
                      <button
                        className="table-empty-action"
                        onClick={() => table.setGlobalFilter("")}
                        type="button"
                      >
                        Clear search
                      </button>
                    ) : null}
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
