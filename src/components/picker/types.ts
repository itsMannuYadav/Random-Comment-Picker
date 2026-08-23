import type { NormalizedComment, SourceResource } from "@/types/comment";
import type { DrawRecord } from "@/core/verification/types";

export type FetchStage = "idle" | "loading-resource" | "fetching-comments" | "ready" | "error";

export interface CommentFetchProgress {
  totalFetched: number;
  pagesLoaded: number;
  label: string;
}

export interface PlatformAdapter {
  fetchResource: () => Promise<SourceResource>;
  /** Streams progress via `onProgress`, resolves with the full comment set once done. */
  fetchComments: (onProgress: (progress: CommentFetchProgress) => void) => Promise<NormalizedComment[]>;
}

export interface ResumeState {
  token: string;
  record: DrawRecord;
}
