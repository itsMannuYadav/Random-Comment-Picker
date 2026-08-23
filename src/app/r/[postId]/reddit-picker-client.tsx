"use client";

import { CommentPicker } from "@/components/picker/comment-picker";
import type { PlatformAdapter, ResumeState } from "@/components/picker/types";
import { apiFetch } from "@/lib/api-client";
import type { NormalizedComment, SourceResource } from "@/types/comment";

export function RedditPickerClient({
  postId,
  subreddit,
  resume,
}: {
  postId: string;
  subreddit?: string;
  resume?: ResumeState;
}) {
  const query = `postId=${postId}${subreddit ? `&subreddit=${subreddit}` : ""}`;

  const adapter: PlatformAdapter = {
    fetchResource: () => apiFetch<SourceResource>(`/api/reddit/post?${query}`),
    fetchComments: async (onProgress) => {
      onProgress({ totalFetched: 0, pagesLoaded: 0, label: "Fetching the full comment thread…" });
      const result = await apiFetch<{ comments: NormalizedComment[]; totalFetched: number }>(
        `/api/reddit/comments?${query}`
      );
      onProgress({ totalFetched: result.totalFetched, pagesLoaded: 1, label: "Fetching the full comment thread…" });
      return result.comments;
    },
  };

  return <CommentPicker platform="reddit" resourceId={postId} adapter={adapter} resume={resume} />;
}
