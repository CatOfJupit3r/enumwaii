import { describe, expect, it } from "vitest";
import { inspectCmsWebhook } from "../lib/cms-webhook";
import { ARTICLE_STATUS } from "../lib/articles";

describe("article status CMS webhook policies", () => {
  it("marks missing input as a nil-only default", () => {
    expect(inspectCmsWebhook(undefined).recovery).toMatchObject({
      source: "DEFAULT",
      status: ARTICLE_STATUS.DRAFT,
    });
  });
  it("rejects malformed input under default-only and falls back to drafts", () => {
    const report = inspectCmsWebhook("PAUSED");
    expect(report.defaultOnly).toMatchObject({
      accepted: false,
      source: "REJECTED",
    });
    expect(report.recovery).toMatchObject({
      source: "FALLBACK",
      status: ARTICLE_STATUS.DRAFT,
    });
  });
});
