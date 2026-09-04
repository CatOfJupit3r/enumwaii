import {
  ARTICLE_STATUS,
  articlesForStatus,
  publicStatuses,
  statusMetadata,
  type Article,
} from "./lib/articles";

articlesForStatus(ARTICLE_STATUS.IN_REVIEW);
statusMetadata(ARTICLE_STATUS.PUBLISHED);
publicStatuses.parse(ARTICLE_STATUS.PUBLISHED);

// @ts-expect-error Domain selectors require an owned enumwaii member.
articlesForStatus("in-review");

const rawArticle: Article = {
  id: "BYL-999",
  title: "Unsafe story",
  author: "External",
  editor: "Unknown",
  wordCount: 0,
  note: "This assignment is intentionally rejected by TypeScript.",
  // @ts-expect-error Hydrated domain records cannot carry an unparsed raw string.
  status: "draft",
};
void rawArticle;
