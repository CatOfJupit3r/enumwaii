"use server";

import {
  ARTICLE_STATUS,
  articleStatusSchema,
  type ArticleStatus,
} from "../lib/articles";

export interface SubmitForReviewInput {
  readonly status: unknown;
  readonly title: unknown;
}

export interface SubmittedForReview {
  readonly status: ArticleStatus;
  readonly title: string;
}

export async function submitForReviewAction(
  input: SubmitForReviewInput,
): Promise<SubmittedForReview> {
  if (typeof input.title !== "string" || input.title.trim().length === 0) {
    throw new Error("An article title is required before it can enter review.");
  }
  if (input.title.trim().length > 160) {
    throw new Error("An article title must be 160 characters or fewer.");
  }
  const status = articleStatusSchema.safeParse(input.status);
  if (!status.success || status.value !== ARTICLE_STATUS.IN_REVIEW) {
    throw new Error("Only an owned IN_REVIEW status can submit an article.");
  }
  return { title: input.title.trim(), status: status.value };
}
