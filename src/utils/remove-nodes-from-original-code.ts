import type {
    CommentBlock,
    CommentLine,
    Directive,
    ImportDeclaration,
    InterpreterDirective,
    Statement,
} from '@babel/types';

/** A range between a start position (inclusive) and an end position (exclusive). */
type Range = readonly [start: number, end: number];

/** An optional range between a start position (inclusive) and an end position (exclusive). */
type OptionalRange = readonly [
    start: number | null | undefined,
    end: number | null | undefined,
];

/** Compares two range by their start position. */
function compareRangesByStart(range1: Range, range2: Range): number {
    return range1[0] < range2[0] ? -1 : range1[0] > range2[0] ? 1 : 0;
}

/** Type predicate that checks whether a range has a defined start and end. */
function hasRange(range: OptionalRange): range is Range {
    return (
        range[0] !== null &&
        range[1] !== null &&
        Number.isSafeInteger(range[0]) &&
        Number.isSafeInteger(range[1])
    );
}

/**
 * @param range1 One range to check.
 * @param range2 Another range to check.
 * @param `true` if both ranges have some overlap. This overlap may consist of
 * a single point, i.e. `[2, 5)` and `[4, 8)` are considered overlapping.
 */
function hasOverlap(range1: Range, range2: Range): boolean {
    return range1[1] > range2[0] && range2[1] > range1[0];
}

/**
 * Given two ranges that are known to overlap, constructs a new range
 * representing the single range enclosing both ranges.
 * @param range1 One range to process.
 * @param range2 Another range to process.
 * @returns A single range representing the union of both ranges.
 */
function mergeOverlappingRanges(range1: Range, range2: Range): Range {
    return [Math.min(range1[0], range2[0]), Math.max(range1[1], range2[1])];
}

/**
 * Given a list of ordered, possibly overlapping (non-disjoint) ranges,
 * constructs a new list of ranges that consists entirely of disjoint ranges.
 * The new list is also ordered.
 * @param A list of ranges that may be overlapping, but are ordered by their
 * start position.
 * @return A list of disjoint ranges that are also ordered by their start
 * position.
 */
function mergeRanges(ranges: Range[]): Range[] {
    // Start with a result list initialized to the empty list
    // Iterate over all given ranges. If a range overlaps the last item in
    // the result list, replace the last item with the merger between that item
    // and the range. Otherwise, just add the item to the result list.
    // For comparison, see also
    // https://www.geeksforgeeks.org/merging-intervals/
    const merged: Range[] = [];
    for (const range of ranges) {
        const currRange = merged[merged.length - 1];
        if (currRange !== undefined && hasOverlap(currRange, range)) {
            merged[merged.length - 1] = mergeOverlappingRanges(
                currRange,
                range,
            );
        } else {
            merged.push(range);
        }
    }
    return merged;
}

/**
 * Takes a list of ordered, disjoint, non-overlapping ranges and a range
 * `[0, totalLength)` that encloses all those ranges.
 *
 * Constructs a new list of ranges representing the negation of the ranges with
 * respect to the enclosing range `[0, totalLength)`. Put in other words,
 * subtracts the given ranges from the range `[0, totalLength)`.
 *
 * More formally, let `r_1`, `r_2`, ..., `r_n` denote the sets represented by
 * the given ranges; and let `r` be the set `[0, totalLength)`. Then this
 * function returns a list of ranges representing the set
 *
 * > r \ r_1 \ r_2 \ ... \ r_n
 *
 * (where `\` is the set negation operator)
 * @param ranges  A list of disjoint (non-overlapping) ranges ordered by
 * their start position.
 * @param totalLength The end of the enclosing range from which to subtract
 * the given ranges.
 * @returns A list of ranges representing the inverse of the given ranges with
 * respect to the enclosing range.
 */
function invertRanges(ranges: Range[], totalLength: number): Range[] {
    // We'd run into out-of-bounds checks if we performed the rest of the
    // algorithm with an empty array, and would have to insert additional
    // checks. So just return immediately to keep the code simpler.
    if (ranges.length === 0) {
        return ranges;
    }

    const resultRanges: Range[] = [];
    const isValidRange = (start: number, end: number) => end > start;

    // Add the part from the start of the enclosing range to the start of the
    // first range to exclude.
    //
    // |-----------xxxxx-----xxxx-----xxxx-----------|
    //  ^---------^
    //  This part
    const firstRange = ranges[0];
    if (isValidRange(0, firstRange[0])) {
        resultRanges.push([0, firstRange[0]]);
    }

    // Iterate over the parts between the ranges to remove and add those parts.
    //
    // |----------xxxxx-----xxxx------xxxx-----------|
    //                 ^---^    ^----^
    //                   These parts
    for (let index = 0; index < ranges.length - 1; index += 1) {
        const prevRange = ranges[index];
        const nextRange = ranges[index + 1];
        const start = prevRange[1];
        const end = nextRange[0];
        if (isValidRange(start, end)) {
            resultRanges.push([start, end]);
        }
    }

    // Add the part from the end of the last range to exclude to the end of the
    // enclosing range.
    //
    // |----------xxxxx-----xxxx-----xxxx------------|
    //                                   ^----------^
    //                                    This part
    const lastRange = ranges[ranges.length - 1];
    if (isValidRange(lastRange[1], totalLength)) {
        resultRanges.push([lastRange[1], totalLength]);
    }

    return resultRanges;
}

/**
 * Given a piece of code and a list of nodes that appear in that code, removes
 * all those nodes from the code.
 * @param code The whole file as text
 * @param nodes List of nodes to be removed from the code.
 * @return The given code with all parts of the code removed that correspond to
 * one of the given nodes.
 */
export const removeNodesFromOriginalCode = (
    code: string,
    nodes: (
        | Statement
        | CommentBlock
        | CommentLine
        | ImportDeclaration
        | InterpreterDirective
        | Directive
    )[],
): string => {
    // A list of ranges we should remove from the code
    // Each range [start, end] consists of a start position in the code
    // (inclusive) and an end position in the code (exclusive)
    const excludes = nodes
        .map((node) => [node.start, node.end] as const)
        .filter(hasRange)
        .sort(compareRangesByStart);

    // In case there are overlapping ranges, merge all overlapping ranges into
    // a single range.
    const mergedExcludes = mergeRanges(excludes);

    // Find the code ranges we want to keep by inverting the excludes with
    // respect to the entire range [0, code.length]
    const includes = invertRanges(mergedExcludes, code.length);

    // Extract all code parts we want to keep and join them together again
    return includes
        .map((include) => code.substring(include[0], include[1]))
        .join('');
};
