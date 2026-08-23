import type { DrawFilters } from "@/core/comment-engine/types";
import type { NormalizedComment } from "@/types/comment";
import type { Platform } from "@/types/platform";

export interface DrawRecord {
  id: string;
  platform: Platform;
  sourceId: string;
  sourceUrl: string;
  sourceTitle?: string;

  totalComments: number;
  eligibleEntries: number;

  filters: DrawFilters;

  winners: NormalizedComment[];

  candidatePoolHash: string;
  algorithmVersion: string;

  createdAt: string;
}
