"use client";

import { CommentPicker } from "@/components/picker/comment-picker";
import type { PlatformAdapter } from "@/components/picker/types";
import { apiFetch } from "@/lib/api-client";
import type { NormalizedComment, SourceResource } from "@/types/comment";

export function InstagramPickerClient({ mediaId }: { mediaId: string }) {
  const adapter: PlatformAdapter = {
    fetchResource: () => apiFetch<SourceResource>(`/api/instagram/media?mediaId=${mediaId}`),
    fetchComments: async () => {
      const result = await apiFetch<{ comments: NormalizedComment[] }>(`/api/instagram/comments?mediaId=${mediaId}`);
      return result.comments;
    },
  };

  return <CommentPicker platform="instagram" resourceId={mediaId} adapter={adapter} />;
}
