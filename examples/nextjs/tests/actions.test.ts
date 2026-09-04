import { describe, expect, it } from "vitest";

import { submitForReviewAction } from "../app/actions";
import { ARTICLE_STATUS } from "../lib/articles";

describe("submitForReviewAction", () => {
  it("strictly accepts an owned IN_REVIEW article status", async () => {
    await expect(
      submitForReviewAction({
        title: "The night train that remade the coast",
        status: ARTICLE_STATUS.IN_REVIEW,
      }),
    ).resolves.toEqual({
      title: "The night train that remade the coast",
      status: ARTICLE_STATUS.IN_REVIEW,
    });
  });

  it("rejects malformed or non-review statuses instead of falling back", async () => {
    await expect(
      submitForReviewAction({ title: "A story", status: "PAUSED" }),
    ).rejects.toThrow("Only an owned IN_REVIEW status");
    await expect(
      submitForReviewAction({ title: "A story", status: ARTICLE_STATUS.DRAFT }),
    ).rejects.toThrow("Only an owned IN_REVIEW status");
  });
});
