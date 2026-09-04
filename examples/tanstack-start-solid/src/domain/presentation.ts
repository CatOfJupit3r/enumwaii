import { em, type InferEnumwaii } from "enumwaii";

const noticeTones = em(["SUCCESS", "ERROR"]);
export const NOTICE_TONE = noticeTones.enum;
export type NoticeTone = InferEnumwaii<typeof noticeTones>;

const releaseTones = em(["HOLD", "WATCH", "CLEAR"]);
export const RELEASE_TONE = releaseTones.enum;
export type ReleaseTone = InferEnumwaii<typeof releaseTones>;
