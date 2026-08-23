"use client";

import { CommentPicker } from "@/components/picker/comment-picker";
import type { PlatformAdapter, ResumeState } from "@/components/picker/types";
import { apiFetch } from "@/lib/api-client";
import type { FetchCommentsPage, NormalizedComment, SourceResource } from "@/types/comment";

export function YouTubePickerClient({ videoId, resume }: { videoId: string; resume?: ResumeState }) {
  const adapter: PlatformAdapter = {
    fetchResource: () => apiFetch<SourceResource>(`/api/youtube/video?videoId=${videoId}`),
    fetchComments: async (onProgress) => {
      let all: NormalizedComment[] = [];
      let pageToken: string | undefined;
      let pages = 0;

      do {
        const page = await apiFetch<FetchCommentsPage>(
          `/api/youtube/comments?videoId=${videoId}${pageToken ? `&pageToken=${pageToken}` : ""}&runningTotal=${all.length}`
        );
        all = all.concat(page.comments);
        pages += 1;
        onProgress({ totalFetched: all.length, pagesLoaded: pages, label: `Fetching comments — page ${pages}` });
        pageToken = page.nextPageToken ?? undefined;
      } while (pageToken);

      return all;
    },
  };

  return <CommentPicker platform="youtube" resourceId={videoId} adapter={adapter} resume={resume} />;
}
