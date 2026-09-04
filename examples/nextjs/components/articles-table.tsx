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
  type Column,
} from "@tanstack/react-table";
import { em } from "enumwaii";

import { statusMetadata, type Article } from "../lib/articles";

const articleTableFeatures = tableFeatures({
  columnFilteringFeature,
  globalFilteringFeature,
  rowSortingFeature,
  filteredRowModel: createFilteredRowModel(),
  sortedRowModel: createSortedRowModel(),
});

const articleColumns = em([
  "ID",
  "TITLE",
  "AUTHOR",
  "STATUS",
  "EDITOR",
  "WORD_COUNT",
  "NOTE",
]);
const ARTICLE_COLUMN = articleColumns.enum;

const articleColumnLabels = articleColumns.derive<string>()(
  [ARTICLE_COLUMN.ID, "ID"],
  [ARTICLE_COLUMN.TITLE, "Headline"],
  [ARTICLE_COLUMN.AUTHOR, "Author"],
  [ARTICLE_COLUMN.STATUS, "Status"],
  [ARTICLE_COLUMN.EDITOR, "Editor"],
  [ARTICLE_COLUMN.WORD_COUNT, "Words"],
  [ARTICLE_COLUMN.NOTE, "Desk note"],
);

const articleColumnHelper = createColumnHelper<
  typeof articleTableFeatures,
  Article
>();

const articleTableColumns = articleColumnHelper.columns([
  articleColumnHelper.accessor("id", {
    id: ARTICLE_COLUMN.ID,
    header: articleColumnLabels.get(ARTICLE_COLUMN.ID),
    sortFn: sortFn_alphanumeric,
  }),
  articleColumnHelper.accessor("title", {
    id: ARTICLE_COLUMN.TITLE,
    header: articleColumnLabels.get(ARTICLE_COLUMN.TITLE),
    sortFn: sortFn_alphanumeric,
  }),
  articleColumnHelper.accessor("author", {
    id: ARTICLE_COLUMN.AUTHOR,
    header: articleColumnLabels.get(ARTICLE_COLUMN.AUTHOR),
    sortFn: sortFn_alphanumeric,
  }),
  articleColumnHelper.accessor("status", {
    id: ARTICLE_COLUMN.STATUS,
    header: articleColumnLabels.get(ARTICLE_COLUMN.STATUS),
    sortFn: sortFn_alphanumeric,
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
  articleColumnHelper.accessor("editor", {
    id: ARTICLE_COLUMN.EDITOR,
    header: articleColumnLabels.get(ARTICLE_COLUMN.EDITOR),
    sortFn: sortFn_alphanumeric,
  }),
  articleColumnHelper.accessor("wordCount", {
    id: ARTICLE_COLUMN.WORD_COUNT,
    header: articleColumnLabels.get(ARTICLE_COLUMN.WORD_COUNT),
    sortFn: sortFn_alphanumeric,
  }),
  articleColumnHelper.accessor("note", {
    id: ARTICLE_COLUMN.NOTE,
    header: articleColumnLabels.get(ARTICLE_COLUMN.NOTE),
    enableSorting: false,
  }),
]);

interface ArticlesTableProps {
  readonly articles: readonly Article[];
}

function columnHeaderLabel(columnId: string): string {
  const parsedColumn = articleColumns.safeParse(columnId);
  return parsedColumn.success
    ? articleColumnLabels.get(parsedColumn.value)
    : columnId;
}

function sortAnnouncement(
  label: string,
  direction: ReturnType<
    Column<typeof articleTableFeatures, Article>["getIsSorted"]
  >,
): string {
  if (direction === "asc") {
    return `${label} sorted ascending. Activate to change the sort.`;
  }

  if (direction === "desc") {
    return `${label} sorted descending. Activate to change the sort.`;
  }

  return `Sort by ${label}`;
}

export function ArticlesTable({ articles }: ArticlesTableProps) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState<SortingState>([]);
  const table = useTable(
    {
      features: articleTableFeatures,
      columns: articleTableColumns,
      data: articles,
      globalFilterFn: filterFn_includesString,
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
    <div className="articles-table-shell">
      <div className="table-toolbar">
        <label className="table-search">
          <span>Search articles</span>
          <input
            aria-label="Search article desk"
            onChange={(event) => table.setGlobalFilter(event.target.value)}
            placeholder="Search headline, author, editor, or note"
            type="search"
            value={globalFilter}
          />
        </label>
        <div className="table-results" aria-live="polite">
          <strong>{rows.length}</strong>
          <span>of {articles.length} articles visible</span>
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

      <div className="articles-table-wrap">
        <table className="articles-table" aria-label="Article desk">
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
                <td colSpan={articleTableColumns.length}>
                  <div className="table-empty-state">
                    <span aria-hidden="true">⌕</span>
                    <strong>
                      {hasSearch
                        ? "No matching articles"
                        : "No articles in this desk"}
                    </strong>
                    <p>
                      {hasSearch
                        ? "Try a different headline, author, editor, or status search."
                        : "This editorial status is clear for the moment."}
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
