import { Comment } from '@babel/types';

import { GetRangeIgnoredLines } from '../types';

type Range = readonly [number, number];
type Ranges = readonly Range[];

export function isRangeStartComment(comment: Comment): boolean {
    return comment.value.trim() === 'prettier-ignore-start';
}

export function isRangeEndComment(comment: Comment): boolean {
    return comment.value.trim() === 'prettier-ignore-end';
}

function isRangeUnfinished(range: Range | undefined): boolean {
    return range !== undefined && isNaN(range[1]);
}

function findIgnoredRanges(): [
    (ranges: Ranges, comment: Comment) => Ranges,
    Ranges,
] {
    return [
        (ranges, comment) => {
            const lastRangeUnfinished = isRangeUnfinished(
                ranges[ranges.length - 1],
            );
            if (isRangeStartComment(comment)) {
                return lastRangeUnfinished
                    ? ranges
                    : [...ranges, [comment.loc.start.line, NaN]];
            }
            if (isRangeEndComment(comment)) {
                const head = ranges.slice(0, ranges.length - 1);
                const tail = ranges[ranges.length - 1];
                return lastRangeUnfinished
                    ? [...head, [tail[0], comment.loc.end.line]]
                    : ranges;
            }
            return ranges;
        },
        [],
    ];
}

function numbersBetween([start, end]: Range): readonly number[] {
    const lines: number[] = [];
    for (let line = start; line <= end; line += 1) {
        lines.push(line);
    }
    return lines;
}

/**
 * Given a list of comments, checks for ranged ignore comments and returns a
 * set of all lines that should be ignored.  The start of an ignored range is
 * indicated by a `prettier-ignore-start` comment, then end of an ignored range
 * by a `prettier-ignore-end` comment.
 *
 * Note that lines comments (`//`) should be used. This algorithm works with
 * block comments (`/* ... * /`) too, but will consider the entire line ignored,
 * even when the block comment is at the end of the line. This matches the
 * current (2.4.1) prettier behavior for `prettier-ignore` (as prettier does not
 * yet support ranged comments in JavaScript).
 * @param comments List of comments to process.
 * @return The set of all lines that fall inside a range delimited by range
 * ignore comments. The lines with the comments themselves are included.
 */
export const getRangeIgnoredLines: GetRangeIgnoredLines = (comments) => {
    const lines = comments
        .reduce(...findIgnoredRanges())
        .filter((range) => !isRangeUnfinished(range))
        .map(numbersBetween)
        .flat();
    return new Set(lines);
};
