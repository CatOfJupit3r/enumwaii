import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { ArticlesTable } from "../components/articles-table";
import { ARTICLES, ARTICLE_STATUS, articlesForStatus } from "../lib/articles";

describe("articles table", () => {
  it("renders semantic table structure and derived status labels", () => {
    const markup = renderToStaticMarkup(<ArticlesTable articles={ARTICLES} />);

    expect(markup).toContain('class="articles-table"');
    expect(markup).toContain("<thead>");
    expect(markup).toContain("<tbody>");
    expect(markup).toContain("Search articles");
    expect(markup).toContain("Search headline, author, editor, or note");
    expect(markup).toContain("Sort by ID");
    for (const label of [
      "ID",
      "Headline",
      "Author",
      "Status",
      "Editor",
      "Words",
      "Desk note",
    ]) {
      expect(markup).toContain(`data-label="${label}"`);
    }
    expect(markup).toContain("Review");
    expect(markup).toContain('style="background-color:#e2f4f0;color:#16706a"');
    expect(markup).toContain("Approved");
    expect(markup).toContain("Live");
    expect(markup).toContain("Archive");
    expect(markup).toContain("of 5 articles visible");
  });

  it("renders a designed empty state for an empty status queue", () => {
    const markup = renderToStaticMarkup(
      <ArticlesTable articles={articlesForStatus(ARTICLE_STATUS.IN_REVIEW)} />,
    );
    const emptyMarkup = renderToStaticMarkup(<ArticlesTable articles={[]} />);

    expect(markup).not.toContain("No articles in this desk");
    expect(emptyMarkup).toContain("No articles in this desk");
    expect(emptyMarkup).toContain(
      "This editorial status is clear for the moment.",
    );
    expect(emptyMarkup).toContain("of 0 articles visible");
  });
});
