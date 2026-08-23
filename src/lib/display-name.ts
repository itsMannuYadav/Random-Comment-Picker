import type { NormalizedComment } from "@/types/comment";

/**
 * The one place that decides how to show who left a comment. Prefers the
 * human-readable name (which, for platforms like YouTube, is already in
 * "@handle" form) and only falls back to `authorUsername` when there's no
 * name at all — never the other way around, since a platform's
 * `authorUsername` isn't guaranteed to be a display-friendly value (see the
 * YouTube mapper, which leaves it unset rather than fill it with a raw
 * channel ID).
 */
export function displayNameFor(comment: Pick<NormalizedComment, "authorName" | "authorUsername">): string {
  if (comment.authorName) return comment.authorName;
  if (comment.authorUsername) return `@${comment.authorUsername}`;
  return "anonymous";
}
