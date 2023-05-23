import type { Comment } from '@babel/types';

/**
 * Detects if `// prettier-ignore` is present in the provided array of comments.
 */
export const hasIgnoreNextNode = (
    comments: readonly Comment[] | null | undefined,
) => (comments ?? []).some(isIgnoreNextNode);

export const isIgnoreNextNode = (comment: Comment) =>
    comment.value.trim() === 'prettier-ignore';
