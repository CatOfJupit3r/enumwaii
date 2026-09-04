import { em, type InferEnumwaii } from "enumwaii";

const statusResolutionPolicies = em(["REQUEST", "DEFAULT", "FALLBACK"]);
export const STATUS_RESOLUTION_POLICY = statusResolutionPolicies.enum;
export type StatusResolutionPolicy = InferEnumwaii<
  typeof statusResolutionPolicies
>;

const articleStatuses = em({
  DRAFT: "draft",
  IN_REVIEW: "in-review",
  APPROVED: "approved",
  PUBLISHED: "published",
  ARCHIVED: "archived",
});

export const ARTICLE_STATUS = articleStatuses.enum;
export const articleStatusSchema = articleStatuses;
export type ArticleStatus = InferEnumwaii<typeof articleStatuses>;

/** The sitemap can emit only statuses intended for a public audience. */
export const publicStatuses = articleStatuses.pick([
  ARTICLE_STATUS.PUBLISHED,
  ARTICLE_STATUS.ARCHIVED,
]);
export const PUBLIC_STATUS = publicStatuses.enum;

export interface ArticleStatusMetadata {
  readonly label: string;
  readonly shortLabel: string;
  readonly description: string;
  readonly accent: string;
  readonly surface: string;
}

export const ARTICLE_STATUS_METADATA =
  articleStatuses.derive<ArticleStatusMetadata>()(
    [
      ARTICLE_STATUS.DRAFT,
      {
        label: "Draft",
        shortLabel: "Draft",
        description: "Still with its author.",
        accent: "#506586",
        surface: "#e7ebf2",
      },
    ],
    [
      ARTICLE_STATUS.IN_REVIEW,
      {
        label: "In review",
        shortLabel: "Review",
        description: "An editor is reading this piece.",
        accent: "#c05d38",
        surface: "#fae9df",
      },
    ],
    [
      ARTICLE_STATUS.APPROVED,
      {
        label: "Approved",
        shortLabel: "Approved",
        description: "Cleared for its publication slot.",
        accent: "#416c5a",
        surface: "#e7f1eb",
      },
    ],
    [
      ARTICLE_STATUS.PUBLISHED,
      {
        label: "Published",
        shortLabel: "Live",
        description: "Available to readers.",
        accent: "#16706a",
        surface: "#e2f4f0",
      },
    ],
    [
      ARTICLE_STATUS.ARCHIVED,
      {
        label: "Archived",
        shortLabel: "Archive",
        description: "Preserved from the live desk.",
        accent: "#765c86",
        surface: "#f0e8f3",
      },
    ],
  );

export interface Article {
  readonly id: string;
  readonly title: string;
  readonly author: string;
  readonly editor: string;
  readonly wordCount: number;
  readonly note: string;
  readonly status: ArticleStatus;
}

export const ARTICLES: readonly Article[] = [
  {
    id: "BYL-184",
    title: "The night train that remade the coast",
    author: "Mara Iqbal",
    editor: "Elena Rossi",
    wordCount: 1_280,
    note: "Photos and final fact check are in.",
    status: ARTICLE_STATUS.IN_REVIEW,
  },
  {
    id: "BYL-187",
    title: "A field guide to neighborhood bakeries",
    author: "Theo March",
    editor: "Nora Chen",
    wordCount: 920,
    note: "Needs a stronger closing scene.",
    status: ARTICLE_STATUS.DRAFT,
  },
  {
    id: "BYL-179",
    title: "How libraries became climate shelters",
    author: "Noor Patel",
    editor: "Maya Stein",
    wordCount: 1_540,
    note: "Scheduled for Tuesday morning.",
    status: ARTICLE_STATUS.APPROVED,
  },
  {
    id: "BYL-166",
    title: "The mapmakers keeping old rivers visible",
    author: "Jon Bell",
    editor: "Elena Rossi",
    wordCount: 1_110,
    note: "Reader response is unusually strong.",
    status: ARTICLE_STATUS.PUBLISHED,
  },
  {
    id: "BYL-121",
    title: "A summer of borrowed bicycles",
    author: "Hana Wu",
    editor: "Nora Chen",
    wordCount: 840,
    note: "Filed in the annual city package.",
    status: ARTICLE_STATUS.ARCHIVED,
  },
];

export interface DashboardStatusResolution {
  readonly status: ArticleStatus | null;
  readonly policy: StatusResolutionPolicy;
  readonly notice: string;
}

export function resolveDashboardStatus(
  input: unknown,
): DashboardStatusResolution {
  if (input === null || input === undefined) {
    return {
      status: null,
      policy: STATUS_RESOLUTION_POLICY.DEFAULT,
      notice: "Showing every article on the desk.",
    };
  }
  const parsed = articleStatuses.safeParse(input);
  if (parsed.success)
    return {
      status: parsed.value,
      policy: STATUS_RESOLUTION_POLICY.REQUEST,
      notice: "The URL filter was recognized.",
    };
  return {
    status: ARTICLE_STATUS.DRAFT,
    policy: STATUS_RESOLUTION_POLICY.FALLBACK,
    notice:
      "We didn't recognize that filter, so you are seeing drafts instead.",
  };
}

export function articlesForStatus(
  status: ArticleStatus | null,
): readonly Article[] {
  return status === null
    ? ARTICLES
    : ARTICLES.filter((article) => article.status === status);
}
export function countArticles(status: ArticleStatus): number {
  return articlesForStatus(status).length;
}
export function statusMetadata(status: ArticleStatus): ArticleStatusMetadata {
  return ARTICLE_STATUS_METADATA.get(status);
}
export function allArticleStatuses(): readonly ArticleStatus[] {
  return articleStatuses.values;
}
