import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import {
  FILTER,
  FILTER_ACTION_CASES,
  FILTER_METADATA,
  FilterPanel,
  filterFromUrl,
  filterReducer,
  type FilterState,
} from "./app";

describe("React enumwaii filter example", () => {
  it("parses each supported URL boundary shape", () => {
    expect(filterFromUrl("?filter=ACTIVE")).toBe(FILTER.ACTIVE);
    expect(
      filterFromUrl(new URL("https://enumwaii.example/queue?filter=COMPLETED")),
    ).toBe(FILTER.COMPLETED);
    expect(filterFromUrl(new URLSearchParams("filter=ACTIVE"))).toBe(
      FILTER.ACTIVE,
    );
    expect(filterFromUrl("filter=COMPLETED")).toBe(FILTER.COMPLETED);
  });

  it("defaults nil input and falls back from malformed members", () => {
    expect(filterFromUrl("filter=NOT_A_FILTER")).toBe(FILTER.ALL);
    expect(filterFromUrl({ filter: "ACTIVE" })).toBe(FILTER.ALL);
    expect(filterFromUrl(undefined)).toBe(FILTER.ALL);
    expect(filterFromUrl(null)).toBe(FILTER.ALL);
  });

  it("uses extracted cases for native reducer narrowing", () => {
    const state: FilterState = { selected: FILTER.ALL };

    expect(
      filterReducer(state, {
        type: FILTER_ACTION_CASES.SELECT,
        filter: FILTER.ACTIVE,
      }),
    ).toEqual({ selected: FILTER.ACTIVE });
    expect(filterReducer(state, { type: FILTER_ACTION_CASES.RESET })).toEqual(
      state,
    );
  });

  it("derives metadata for every filter and renders valid state on the server", () => {
    expect(FILTER_METADATA.get(FILTER.ALL).label).toBe("All tasks");
    expect(FILTER_METADATA.get(FILTER.ACTIVE).label).toBe("In progress");
    expect(FILTER_METADATA.get(FILTER.COMPLETED).label).toBe("Completed");

    const html = renderToStaticMarkup(
      <FilterPanel initialUrl="?filter=ACTIVE" />,
    );

    expect(html).toContain("In progress");
    expect(html).toContain("Fix the export edge case");
    expect(html).not.toContain("Invite the design partner");
  });

  it("renders the fallback view for invalid input", () => {
    const html = renderToStaticMarkup(
      <FilterPanel initialUrl="?filter=ARCHIVED" />,
    );

    expect(html).toContain("All tasks");
    expect(html).toContain("Invite the design partner");
  });

  it("renders derived empty-state copy for an empty hydrated collection", () => {
    const html = renderToStaticMarkup(
      <FilterPanel initialUrl="?filter=ACTIVE" tasks={[]} />,
    );

    expect(html).toContain("Everything is complete. Nice work!");
    expect(html).not.toContain("Fix the export edge case");
  });
});
