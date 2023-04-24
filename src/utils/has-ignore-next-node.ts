import type { Comment } from '@babel/types';

/**
 * Detects if `// prettier-ignore` is present in the provided array of comments.
 */
export const hasIgnoreNextNode = (comments: readonly Comment[] | null) =>
    (comments ?? []).some(
        (comment) => comment.value.trim() === 'prettier-ignore',
    );
