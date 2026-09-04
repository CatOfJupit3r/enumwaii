"use client";

import { useReducer, useState, useTransition } from "react";

import { em } from "enumwaii";

import { ARTICLE_STATUS } from "../lib/articles";
import { submitForReviewAction } from "../app/actions";

const reviewEvents = em(["APPROVE", "REQUEST_CHANGES", "PUBLISH"]);
const REVIEW_EVENT_CASE = reviewEvents.cases;

type ReviewAction = {
  readonly type: (typeof REVIEW_EVENT_CASE)[keyof typeof REVIEW_EVENT_CASE];
};
interface ReviewState {
  readonly message: string;
}

function reviewReducer(state: ReviewState, action: ReviewAction): ReviewState {
  switch (action.type) {
    case REVIEW_EVENT_CASE.APPROVE:
      return {
        message: "Approved - this article is ready for its publication slot.",
      };
    case REVIEW_EVENT_CASE.REQUEST_CHANGES:
      return { message: "Changes requested - the author has been notified." };
    case REVIEW_EVENT_CASE.PUBLISH:
      return { message: "Published - the story is now visible to readers." };
  }

  return state;
}

/** A client review surface: .cases supplies native reducer discriminants. */
export function ReviewPanel() {
  const [state, dispatch] = useReducer(reviewReducer, {
    message: "Select an editorial decision for the story in review.",
  });
  const [submission, setSubmission] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function submitForReview(): void {
    startTransition(async () => {
      const submitted = await submitForReviewAction({
        title: "The night train that remade the coast",
        status: ARTICLE_STATUS.IN_REVIEW,
      });
      setSubmission('Submitted "' + submitted.title + '" for review.');
    });
  }

  return (
    <section className="editorial-review-section" aria-label="Editorial review">
      <div className="section-heading editorial-review-heading">
        <div>
          <p className="eyebrow">Editorial review</p>
          <h2>“The night train that remade the coast”</h2>
        </div>
        <p>
          Client-side decisions are modeled as an exhaustive reducer using
          enumwaii’s raw .cases view.
        </p>
      </div>
      <div className="review-shell">
        <div className="review-actions-panel">
          <p className="panel-kicker">Editor actions</p>
          <button
            className="review-action-button"
            disabled={isPending}
            onClick={submitForReview}
            type="button"
          >
            <span>Submit for review</span>
            <code>{ARTICLE_STATUS.IN_REVIEW}</code>
          </button>
          <div
            className="review-actions-grid"
            role="group"
            aria-label="Review actions"
          >
            <button
              className="review-action-button"
              onClick={() => dispatch({ type: REVIEW_EVENT_CASE.APPROVE })}
              type="button"
            >
              <span>Approve</span>
              <code>{ARTICLE_STATUS.APPROVED}</code>
            </button>
            <button
              className="review-action-button"
              onClick={() =>
                dispatch({ type: REVIEW_EVENT_CASE.REQUEST_CHANGES })
              }
              type="button"
            >
              <span>Request changes</span>
              <code>{ARTICLE_STATUS.DRAFT}</code>
            </button>
            <button
              className="review-action-button"
              onClick={() => dispatch({ type: REVIEW_EVENT_CASE.PUBLISH })}
              type="button"
            >
              <span>Publish</span>
              <code>{ARTICLE_STATUS.PUBLISHED}</code>
            </button>
          </div>
        </div>
        <div className="result-panel" aria-live="polite">
          <p className="panel-kicker">Desk update</p>
          <p className="input-readout">
            {isPending
              ? "Submitting for review..."
              : (submission ?? state.message)}
          </p>
        </div>
      </div>
    </section>
  );
}
