import { describe, expect, it } from "vitest";

import sitemap from "../app/sitemap";
import { ARTICLES, PUBLIC_STATUS } from "../lib/articles";

describe("public article sitemap", () => {
  it("emits only ArticleStatus.pick public statuses", () => {
    const entries = sitemap();
    const emittedIds = entries.map((entry) => entry.url.split("/").at(-1));
    const expectedIds = ARTICLES.filter(
      (article) =>
        article.status === PUBLIC_STATUS.PUBLISHED ||
        article.status === PUBLIC_STATUS.ARCHIVED,
    ).map((article) => article.id.toLowerCase());

    expect(emittedIds).toEqual(expectedIds);
    expect(emittedIds).not.toContain("byl-184");
    expect(emittedIds).not.toContain("byl-187");
  });
});
