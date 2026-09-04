import { em, type InferEnumwaii } from "enumwaii";
import {
  ARTICLE_STATUS,
  articleStatusSchema,
  statusMetadata,
  type ArticleStatus,
} from "./articles";

const cmsSources = em(["REQUEST", "DEFAULT", "FALLBACK", "REJECTED"]);
export const CMS_SOURCE = cmsSources.enum;
export type CmsWebhookDecisionSource = InferEnumwaii<typeof cmsSources>;
const acceptedSources = cmsSources.omit([CMS_SOURCE.REJECTED]);
const inputKinds = em(["MISSING", "STRING", "WRONG_TYPE"]);
const INPUT_KIND = inputKinds.enum;

export interface AcceptedCmsWebhookDecision {
  readonly accepted: true;
  readonly source: InferEnumwaii<typeof acceptedSources>;
  readonly status: ArticleStatus;
  readonly label: string;
  readonly explanation: string;
}

export interface RejectedCmsWebhookDecision {
  readonly accepted: false;
  readonly source: typeof CMS_SOURCE.REJECTED;
  readonly explanation: string;
}

export type CmsWebhookDecision =
  AcceptedCmsWebhookDecision | RejectedCmsWebhookDecision;

export interface CmsWebhookReport {
  readonly input: {
    readonly kind: InferEnumwaii<typeof inputKinds>;
    readonly display: string;
  };
  readonly defaultOnly: CmsWebhookDecision;
  readonly recovery: AcceptedCmsWebhookDecision;
}

function acceptedDecision(
  status: ArticleStatus,
  source: AcceptedCmsWebhookDecision["source"],
): AcceptedCmsWebhookDecision {
  const metadata = statusMetadata(status);

  return {
    accepted: true,
    source,
    status,
    label: metadata.label,
    explanation:
      source === CMS_SOURCE.REQUEST
        ? "The input matched an owned member and crossed the CMS webhook."
        : source === CMS_SOURCE.DEFAULT
          ? "The input was nil, so the explicit default was applied."
          : "The input was invalid, so the explicit fallback recovered safely.",
  };
}

function inputDescription(
  input: unknown,
  result: (typeof articleStatusSchema)["~safeParseResult"],
): CmsWebhookReport["input"] {
  if (input === undefined || input === null) {
    return {
      kind: INPUT_KIND.MISSING,
      display: input === null ? "null" : "undefined",
    };
  }

  if (result.success) {
    return { kind: INPUT_KIND.STRING, display: result.value };
  }

  return {
    kind: typeof input === "string" ? INPUT_KIND.STRING : INPUT_KIND.WRONG_TYPE,
    display: result.error.receivedText,
  };
}

function decisionSource(input: unknown): AcceptedCmsWebhookDecision["source"] {
  return input === undefined || input === null
    ? CMS_SOURCE.DEFAULT
    : CMS_SOURCE.REQUEST;
}

export function inspectCmsWebhook(input: unknown): CmsWebhookReport {
  const defaultOnlyResult = articleStatusSchema.safeParse(input, {
    default: ARTICLE_STATUS.DRAFT,
  });
  const recoveredStatus = articleStatusSchema.parse(input, {
    default: ARTICLE_STATUS.DRAFT,
    fallback: ARTICLE_STATUS.DRAFT,
  });

  const defaultOnly: CmsWebhookDecision = defaultOnlyResult.success
    ? acceptedDecision(defaultOnlyResult.value, decisionSource(input))
    : {
        accepted: false,
        source: CMS_SOURCE.REJECTED,
        explanation:
          "A default only covers null or undefined; malformed input remains rejected.",
      };
  const recoverySource = defaultOnlyResult.success
    ? decisionSource(input)
    : CMS_SOURCE.FALLBACK;

  return {
    input: inputDescription(input, defaultOnlyResult),
    defaultOnly,
    recovery: acceptedDecision(recoveredStatus, recoverySource),
  };
}
