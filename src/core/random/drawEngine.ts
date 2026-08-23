import type { NormalizedComment } from "@/types/comment";
import { hashCandidatePool } from "@/core/verification/hash";
import { secureSample } from "./secureRandom";

export const ALGORITHM_VERSION = "mycp-draw-v1";

export interface DrawResult {
  winners: NormalizedComment[];
  candidatePoolHash: string;
  algorithmVersion: string;
  eligibleEntries: number;
}

/** Deterministic ordering so the same pool always hashes the same way, regardless of fetch order. */
function canonicalOrder(entries: NormalizedComment[]): NormalizedComment[] {
  return [...entries].sort((a, b) => a.id.localeCompare(b.id));
}

/**
 * Runs a secure draw over an eligible entry pool. Pass `excludeIds` (previous
 * winners) when picking additional winners so the same entry can't win twice
 * in one draw.
 */
export async function runDraw(
  eligible: NormalizedComment[],
  winnerCount: number,
  excludeIds: Set<string> = new Set()
): Promise<DrawResult> {
  const ordered = canonicalOrder(eligible);
  const pool = ordered.filter((c) => !excludeIds.has(c.id));

  if (winnerCount > pool.length) {
    throw new Error(
      `Cannot select ${winnerCount} winner(s) from ${pool.length} remaining eligible entries.`
    );
  }

  const winners = secureSample(pool, winnerCount);
  const candidatePoolHash = await hashCandidatePool(ordered.map((c) => c.id));

  return {
    winners,
    candidatePoolHash,
    algorithmVersion: ALGORITHM_VERSION,
    eligibleEntries: ordered.length,
  };
}
