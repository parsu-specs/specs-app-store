import type { Comment } from "./types";

// Includes the top-level comment: one comment plus three reply levels.
export const MAX_COMMENT_LEVELS = 4;

export function assertReplyDepth(comments: Comment[], parentId: string): void {
  const byId = new Map(comments.map((c) => [c.id, c]));
  let ancestorId: string | null | undefined = parentId;
  let level = 1;
  while (ancestorId) {
    if (++level > MAX_COMMENT_LEVELS) {
      throw new Error(`Replies are limited to ${MAX_COMMENT_LEVELS} levels.`);
    }
    const ancestor = byId.get(ancestorId);
    if (!ancestor) throw new Error("That comment no longer exists.");
    ancestorId = ancestor.parentId;
  }
}
