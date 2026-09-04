import { describe, expect, it } from "vitest";
import {
  ARTICLE_STATUS,
  ARTICLE_STATUS_METADATA,
  allArticleStatuses,
  articlesForStatus,
  resolveDashboardStatus,
} from "../lib/articles";

describe("Byline article domain", () => {
  it("defaults to the complete desk only when the URL has no filter", () => {
    expect(resolveDashboardStatus(undefined)).toMatchObject({
      status: null,
      policy: "DEFAULT",
    });
  });
  it("accepts a known editorial status and explains an unknown filter", () => {
    expect(resolveDashboardStatus("in-review")).toMatchObject({
      status: ARTICLE_STATUS.IN_REVIEW,
      policy: "REQUEST",
    });
    expect(resolveDashboardStatus("PAUSED")).toMatchObject({
      status: ARTICLE_STATUS.DRAFT,
      policy: "FALLBACK",
    });
  });
  it("keeps metadata and selectors exhaustive", () => {
    expect(allArticleStatuses()).toHaveLength(5);
    expect(
      ARTICLE_STATUS_METADATA.get(ARTICLE_STATUS.PUBLISHED).shortLabel,
    ).toBe("Live");
    expect(
      articlesForStatus(ARTICLE_STATUS.DRAFT).every(
        (article) => article.status === ARTICLE_STATUS.DRAFT,
      ),
    ).toBe(true);
  });
});

it("treats code keys and underscore spellings as malformed URL filters", () => {
  for (const status of ["IN_REVIEW", "in_review"]) {
    expect(resolveDashboardStatus(status)).toMatchObject({
      status: ARTICLE_STATUS.DRAFT,
      policy: "FALLBACK",
    });
  }
});
