export type ReplyMode = "include" | "exclude" | "only";

export interface DrawFilters {
  /** Keep only the first eligible comment per unique author. */
  onePerPerson?: boolean;
  /** How replies participate: alongside top-level comments, excluded, or exclusively. */
  replyMode?: ReplyMode;
  /** Drop comments whose normalized text has already appeared. */
  removeDuplicateComments?: boolean;

  keyword?: string;
  hashtag?: string;
  phrase?: string;
  minLength?: number;
  maxLength?: number;

  excludeLinks?: boolean;
  excludeEmpty?: boolean;
  blockedWords?: string[];

  after?: string;
  before?: string;
}

export interface FilterStep {
  label: string;
  count: number;
}

export interface FilterResult {
  eligible: import("@/types/comment").NormalizedComment[];
  steps: FilterStep[];
}
